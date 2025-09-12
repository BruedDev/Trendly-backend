import fetch from 'node-fetch';

export const getProvinces = async (req, res) => {
  try {
    const response = await fetch('https://provinces.open-api.vn/api/?depth=1');
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch provinces' });
  }
};

export const getDistricts = async (req, res) => {
  const { provinceCode } = req.params;
  try {
    const response = await fetch(`https://provinces.open-api.vn/api/p/${provinceCode}?depth=2`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch districts' });
  }
};

export const getWards = async (req, res) => {
  const { districtCode } = req.params;
  try {
    const response = await fetch(`https://provinces.open-api.vn/api/d/${districtCode}?depth=2`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch wards' });
  }
};
