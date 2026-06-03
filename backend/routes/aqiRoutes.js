import express from 'express';
import { getAqiData, getHistoricalAqi } from '../controllers/aqiController.js';

const router = express.Router();

router.get('/', getAqiData);
router.get('/history', getHistoricalAqi);

export default router;
