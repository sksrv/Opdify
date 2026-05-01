import Hospital from '../models/Hospital.js';
import Doctor from '../models/Doctor.js';

export const getHospitals = async (req, res, next) => {
  try {
    const { search, city, lat, lng, radius = 15, page = 1, limit = 10 } = req.query;
    const query = { isActive: true };
    if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { uniqueId: { $regex: search, $options: 'i' } }];
    if (city) query['address.city'] = { $regex: city, $options: 'i' };
    let hospitals;
    if (lat && lng) {
      hospitals = await Hospital.find({ ...query, location: { $near: { $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] }, $maxDistance: Number(radius) * 1000 } } }).limit(Number(limit));
    } else {
      hospitals = await Hospital.find(query).skip((Number(page) - 1) * Number(limit)).limit(Number(limit)).sort({ rating: -1 });
    }
    res.json({ success: true, data: hospitals });
  } catch (err) { next(err); }
};

export const getHospital = async (req, res, next) => {
  try {
    const hospital = await Hospital.findOne({ $or: [{ _id: req.params.id.length === 24 ? req.params.id : null }, { uniqueId: req.params.id.toUpperCase() }] });
    if (!hospital) return res.status(404).json({ success: false, message: 'Hospital not found' });
    const doctors = await Doctor.find({ hospitalId: hospital._id, isActive: true }).select('name uniqueId specialization avgTimePerPatient isBookingOpen rating consultationFee avatar');
    res.json({ success: true, data: { ...hospital.toObject(), doctors } });
  } catch (err) { next(err); }
};

export const createHospital = async (req, res, next) => {
  try {
    const { name } = req.body;
    const uniqueId = `HSP-${name.substring(0, 4).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const hospital = await Hospital.create({ ...req.body, uniqueId, adminId: req.user._id });
    res.status(201).json({ success: true, data: hospital });
  } catch (err) { next(err); }
};
