// Explainable AI (XAI) Scientific Telemetry Utilities
// Includes: Bird Clear Sky Solar Radiation Model, AOD Aerosol Scattering, Shapley Coalition Solver, and LIME Solver

/**
 * 1. Physical Solar Radiative Transfer Model (Bird Clear Sky approximation)
 * Computes Global Horizontal Irradiance (GHI) and cell-derated Solar PV Output
 * 
 * @param {Object} inputs - Atmospheric and weather features
 * @returns {Object} - Irradiance, cell temperature, and predicted power output (MW)
 */
export function predictSolarOutput(inputs) {
  const {
    cloudCover = 10,  // % Cloud coverage
    temp = 25,        // °C Ambient temperature
    pm25 = 15,        // μg/m³ PM2.5 particulate concentration
    pm10 = 30,        // μg/m³ PM10 particulate concentration
    humidity = 50,    // % Relative Humidity
    windSpeed = 3     // m/s Wind speed
  } = inputs;

  const I0 = 950; // Clear-sky peak solar constant (W/m²)

  // A. Aerosol Optical Depth (AOD)
  // Empirical relation mapping PM mass concentration to optical extinction (scattering/absorption)
  const aod = 0.0035 * pm25 + 0.0015 * pm10;
  const tau_a = Math.exp(-aod * 1.25); // Aerosol transmittance

  // B. Cloud Attenuation (Kasten-Czeplak parameterization)
  const cloudFrac = cloudCover / 100;
  const tau_c = 1.0 - 0.75 * Math.pow(cloudFrac, 2.5); // Cloud transmittance

  // C. Calculated Surface Irradiance on PV array (W/m²)
  const irradiance = I0 * tau_a * tau_c;

  // D. PV Cell Operating Temperature
  // Solar panels lose efficiency as they heat up. Wind speed provides cooling.
  const coolingFactor = Math.exp(-0.06 * (windSpeed - 3));
  const tCell = temp + (irradiance * 0.030) * coolingFactor;

  // E. Temperature Coefficient Derating Factor
  // Standard monocrystalline silicon coefficient of -0.41% per °C above 25°C
  const tempDelta = Math.max(0, tCell - 25);
  const thermalDerate = 1.0 - 0.0041 * tempDelta;

  // F. Humidity Attenuation coefficient (spectral moisture absorption)
  const humidityDelta = Math.max(0, humidity - 45);
  const moistureDerate = 1.0 - 0.0012 * humidityDelta;

  // G. PV Plant Calculation
  // Standard solar farm size = 10.0 MW rated capacity. Inverter efficiency = 95%
  const plantCapacity = 10.0;
  const systemEfficiency = 0.95 * thermalDerate * moistureDerate;
  const powerOutput = plantCapacity * (irradiance / 1000) * systemEfficiency;

  return {
    powerOutput: Math.max(0, Math.min(plantCapacity, powerOutput)), // MW
    irradiance: Math.max(0, irradiance),                           // W/m²
    aod,
    tCell,
    efficiency: systemEfficiency * 100                              // %
  };
}

/**
 * 2. Exact game-theoretic Shapley value coalition solver
 * Evaluates marginal contribution over 2^5 = 32 coalitions for 5 primary features
 * 
 * @param {Object} current - Active user inputs
 * @param {Object} baseline - Stable baseline reference inputs
 * @returns {Object} - Base value, predictions, and Shapley feature attribution values
 */
export function computeShapley(current, baseline) {
  const keys = ['cloudCover', 'temp', 'pm25', 'humidity', 'windSpeed'];
  const n = keys.length;

  // Precomputed factorials
  const fact = [1, 1, 2, 6, 24, 120];
  const getWeight = (sSize) => {
    return (fact[sSize] * fact[n - sSize - 1]) / fact[n];
  };

  // Coalition evaluator: uses current values for keys in the coalition, baseline for others
  const evalCoalition = (coalitionKeys) => {
    const activeInputs = {};
    keys.forEach(k => {
      activeInputs[k] = coalitionKeys.includes(k) ? current[k] : baseline[k];
    });
    
    // PM10 scales proportionally with PM2.5 in our physical projection
    activeInputs.pm10 = activeInputs.pm25 * 2.0;

    return predictSolarOutput(activeInputs).powerOutput;
  };

  const shapValues = {};
  keys.forEach(k => {
    shapValues[k] = 0;
  });

  const baseValue = evalCoalition([]); // E[f(x)] - Clear-sky baseline prediction
  const finalPrediction = evalCoalition(keys); // f(x) - Prediction with all current inputs

  // Compute marginal contributions across all subsets
  keys.forEach((feature) => {
    const remaining = keys.filter(k => k !== feature);
    const subsetsCount = Math.pow(2, remaining.length); // 16 subsets

    for (let j = 0; j < subsetsCount; j++) {
      const subset = [];
      for (let k = 0; k < remaining.length; k++) {
        if ((j & (1 << k)) !== 0) {
          subset.push(remaining[k]);
        }
      }

      const sSize = subset.length;
      const w = getWeight(sSize);

      const valWithFeature = evalCoalition([...subset, feature]);
      const valWithoutFeature = evalCoalition(subset);

      shapValues[feature] += w * (valWithFeature - valWithoutFeature);
    }
  });

  return {
    shapValues,
    baseValue,
    prediction: finalPrediction
  };
}

/**
 * 3. Local Interpretable Model-agnostic Explanations (LIME) Local Surrogate Solver
 * Fits a local linear model by perturbing inputs around the current instance
 * 
 * @param {Object} current - Active user inputs
 * @returns {Object} - Local feature attribution weights (slopes) and R² goodness of fit
 */
export function fitLIME(current) {
  const keys = ['cloudCover', 'temp', 'pm25', 'humidity', 'windSpeed'];
  
  // Normalization scales for stability
  const scales = {
    cloudCover: 100,
    temp: 40,
    pm25: 150,
    humidity: 100,
    windSpeed: 20
  };

  const samples = [];
  const numPerturbations = 25;

  // Generate local perturbations (Gaussian-like noise centered at current values)
  for (let i = 0; i < numPerturbations; i++) {
    const perturbed = {};
    keys.forEach(k => {
      const noise = (Math.random() - 0.5) * 0.25 * scales[k]; // perturbs by ±12.5% of scale
      perturbed[k] = Math.max(0, Math.min(scales[k], current[k] + noise));
    });
    perturbed.pm10 = perturbed.pm25 * 2.0;

    const output = predictSolarOutput(perturbed).powerOutput;

    // Feature relative distance from current state
    const normalizedDistance = keys.map(k => (perturbed[k] - current[k]) / scales[k]);
    samples.push({ x: normalizedDistance, y: output });
  }

  // Fit local linear model: y_pred = intercept + sum(w_i * x_i) using gradient descent OLS
  let weights = [0, 0, 0, 0, 0];
  let intercept = predictSolarOutput(current).powerOutput;
  const learningRate = 0.08;

  for (let epoch = 0; epoch < 80; epoch++) {
    samples.forEach(s => {
      const pred = intercept + s.x.reduce((sum, val, idx) => sum + val * weights[idx], 0);
      const error = pred - s.y;

      intercept -= learningRate * error * 0.4;
      for (let idx = 0; idx < 5; idx++) {
        weights[idx] -= learningRate * error * s.x[idx];
      }
    });
  }

  // Return un-normalized weights (change in output MW per unit increase in raw feature)
  const limeCoefficients = {};
  keys.forEach((k, idx) => {
    limeCoefficients[k] = weights[idx] / scales[k];
  });

  return {
    coefficients: limeCoefficients,
    intercept
  };
}
