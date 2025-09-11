import express from 'express';
import { getProvinces, getDistricts, getWards } from '../controllers/vietnamRegions.controller.js';

const router = express.Router();

router.get('/provinces', getProvinces);
router.get('/districts/:provinceCode', getDistricts);
router.get('/wards/:districtCode', getWards);

export default router;