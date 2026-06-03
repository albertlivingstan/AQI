// US EPA AQI Calculation Utilities

function interpolate(c, cLow, cHigh, iLow, iHigh) {
  return Math.round(((iHigh - iLow) / (cHigh - cLow)) * (c - cLow) + iLow);
}

/**
 * Calculates the US AQI score for a specific pollutant.
 * @param {string} pollutant - 'pm2_5', 'pm10', 'no2', 'so2', 'co', 'o3'
 * @param {number} value - Concentration in ug/m3
 * @returns {number} AQI score (0 - 500)
 */
export function calculateIndividualAqi(pollutant, value) {
  let breakpoints = [];
  let adjustedValue = value;

  if (pollutant === "pm2_5") {
    // PM2.5 (ug/m3)
    breakpoints = [
      { cLow: 0.0, cHigh: 12.0, iLow: 0, iHigh: 50 },
      { cLow: 12.1, cHigh: 35.4, iLow: 51, iHigh: 100 },
      { cLow: 35.5, cHigh: 55.4, iLow: 101, iHigh: 150 },
      { cLow: 55.5, cHigh: 150.4, iLow: 151, iHigh: 200 },
      { cLow: 150.5, cHigh: 250.4, iLow: 201, iHigh: 300 },
      { cLow: 250.5, cHigh: 350.4, iLow: 301, iHigh: 400 },
      { cLow: 350.5, cHigh: 500.4, iLow: 401, iHigh: 500 }
    ];
  } else if (pollutant === "pm10") {
    // PM10 (ug/m3)
    breakpoints = [
      { cLow: 0, cHigh: 54, iLow: 0, iHigh: 50 },
      { cLow: 55, cHigh: 154, iLow: 51, iHigh: 100 },
      { cLow: 155, cHigh: 254, iLow: 101, iHigh: 150 },
      { cLow: 255, cHigh: 354, iLow: 151, iHigh: 200 },
      { cLow: 355, cHigh: 424, iLow: 201, iHigh: 300 },
      { cLow: 425, cHigh: 504, iLow: 301, iHigh: 400 },
      { cLow: 505, cHigh: 604, iLow: 401, iHigh: 500 }
    ];
  } else if (pollutant === "no2") {
    // NO2 (convert ug/m3 to ppb, 1 ppb ≈ 1.88 ug/m3)
    adjustedValue = value / 1.88;
    breakpoints = [
      { cLow: 0, cHigh: 53, iLow: 0, iHigh: 50 },
      { cLow: 54, cHigh: 100, iLow: 51, iHigh: 100 },
      { cLow: 101, cHigh: 360, iLow: 101, iHigh: 150 },
      { cLow: 361, cHigh: 649, iLow: 151, iHigh: 200 },
      { cLow: 650, cHigh: 1249, iLow: 201, iHigh: 300 },
      { cLow: 1250, cHigh: 1649, iLow: 301, iHigh: 400 },
      { cLow: 1650, cHigh: 2049, iLow: 401, iHigh: 500 }
    ];
  } else if (pollutant === "so2") {
    // SO2 (convert ug/m3 to ppb, 1 ppb ≈ 2.62 ug/m3)
    adjustedValue = value / 2.62;
    breakpoints = [
      { cLow: 0, cHigh: 35, iLow: 0, iHigh: 50 },
      { cLow: 36, cHigh: 75, iLow: 51, iHigh: 100 },
      { cLow: 76, cHigh: 185, iLow: 101, iHigh: 150 },
      { cLow: 186, cHigh: 304, iLow: 151, iHigh: 200 },
      { cLow: 305, cHigh: 604, iLow: 201, iHigh: 300 },
      { cLow: 605, cHigh: 804, iLow: 301, iHigh: 400 },
      { cLow: 805, cHigh: 1004, iLow: 401, iHigh: 500 }
    ];
  } else if (pollutant === "co") {
    // CO (convert ug/m3 to ppm, 1 ppm ≈ 1145 ug/m3)
    adjustedValue = value / 1145;
    breakpoints = [
      { cLow: 0.0, cHigh: 4.4, iLow: 0, iHigh: 50 },
      { cLow: 4.5, cHigh: 9.4, iLow: 51, iHigh: 100 },
      { cLow: 9.5, cHigh: 12.4, iLow: 101, iHigh: 150 },
      { cLow: 12.5, cHigh: 15.4, iLow: 151, iHigh: 200 },
      { cLow: 15.5, cHigh: 30.4, iLow: 201, iHigh: 300 },
      { cLow: 30.5, cHigh: 40.4, iLow: 301, iHigh: 400 },
      { cLow: 40.5, cHigh: 50.4, iLow: 401, iHigh: 500 }
    ];
  } else if (pollutant === "o3") {
    // O3 (convert ug/m3 to ppb, 1 ppb ≈ 1.96 ug/m3)
    adjustedValue = value / 1.96;
    breakpoints = [
      { cLow: 0, cHigh: 54, iLow: 0, iHigh: 50 },
      { cLow: 55, cHigh: 70, iLow: 51, iHigh: 100 },
      { cLow: 71, cHigh: 85, iLow: 101, iHigh: 150 },
      { cLow: 86, cHigh: 105, iLow: 151, iHigh: 200 },
      { cLow: 106, cHigh: 200, iLow: 201, iHigh: 300 },
      { cLow: 201, cHigh: 600, iLow: 301, iHigh: 500 }
    ];
  } else {
    return 0;
  }

  for (const b of breakpoints) {
    if (adjustedValue >= b.cLow && adjustedValue <= b.cHigh) {
      return interpolate(adjustedValue, b.cLow, b.cHigh, b.iLow, b.iHigh);
    }
  }

  // Fallback for extremely high values
  if (breakpoints.length > 0 && adjustedValue > breakpoints[breakpoints.length - 1].cHigh) {
    return 500;
  }
  return 0;
}

/**
 * Calculates overall US AQI and dominant pollutant from the components object.
 * @param {object} components - Pollutant concentrations from OpenWeather
 * @returns {object} { aqi: number, dominant: string }
 */
export function calculateOverallAqi(components) {
  if (!components) return { aqi: 0, dominant: "N/A" };
  const pollutants = ["pm2_5", "pm10", "no2", "so2", "co", "o3"];
  let maxAqi = 0;
  let dominant = "N/A";

  for (const p of pollutants) {
    if (components[p] !== undefined) {
      const aqi = calculateIndividualAqi(p, components[p]);
      if (aqi > maxAqi) {
        maxAqi = aqi;
        dominant = p;
      }
    }
  }
  return { aqi: maxAqi, dominant };
}

/**
 * Maps an AQI score to its corresponding EPA Category details.
 * @param {number} aqi - US AQI score
 * @returns {object} Category details including label, colors, and advisory
 */
export function getAqiCategory(aqi) {
  if (aqi <= 50) {
    return {
      label: "Good",
      color: "emerald",
      textColor: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/25",
      ringColor: "ring-emerald-500/30",
      progressColor: "bg-emerald-500",
      advisory: "Air quality is satisfactory, and air pollution poses little or no risk."
    };
  } else if (aqi <= 100) {
    return {
      label: "Moderate",
      color: "yellow",
      textColor: "text-yellow-400",
      bgColor: "bg-yellow-500/10",
      borderColor: "border-yellow-500/25",
      ringColor: "ring-yellow-500/30",
      progressColor: "bg-yellow-500",
      advisory: "Air quality is acceptable. However, there may be a risk for some people, particularly those who are unusually sensitive to air pollution."
    };
  } else if (aqi <= 150) {
    return {
      label: "Unhealthy for Sensitive Groups",
      color: "orange",
      textColor: "text-orange-400",
      bgColor: "bg-orange-500/10",
      borderColor: "border-orange-500/25",
      ringColor: "ring-orange-500/30",
      progressColor: "bg-orange-500",
      advisory: "Members of sensitive groups may experience health effects. The general public is less likely to be affected."
    };
  } else if (aqi <= 200) {
    return {
      label: "Unhealthy",
      color: "red",
      textColor: "text-red-400",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/25",
      ringColor: "ring-red-500/30",
      progressColor: "bg-red-500",
      advisory: "Some members of the general public may experience health effects; members of sensitive groups may experience more serious health effects."
    };
  } else if (aqi <= 300) {
    return {
      label: "Very Unhealthy",
      color: "purple",
      textColor: "text-purple-400",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/25",
      ringColor: "ring-purple-500/30",
      progressColor: "bg-purple-500",
      advisory: "Health alert: The risk of health effects is increased for everyone."
    };
  } else {
    return {
      label: "Hazardous",
      color: "pink",
      textColor: "text-pink-500",
      bgColor: "bg-pink-500/10",
      borderColor: "border-pink-500/25",
      ringColor: "ring-pink-500/30",
      progressColor: "bg-pink-500",
      advisory: "Health warning of emergency conditions: everyone is more likely to be affected."
    };
  }
}
