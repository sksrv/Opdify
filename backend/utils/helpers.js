import Doctor from '../models/Doctor.js';

export const getTodayDate = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

export const generateDoctorId = async (name) => {
  const prefix = name.replace(/[^a-zA-Z]/g, '').substring(0, 5).toUpperCase() || 'DOCTR';
  let counter = 1001;
  let uniqueId;
  let attempts = 0;
  do {
    uniqueId = `DR-${prefix}-${counter}`;
    const existing = await Doctor.findOne({ uniqueId });
    if (!existing) break;
    counter++;
    attempts++;
  } while (attempts < 200);
  return uniqueId;
};
