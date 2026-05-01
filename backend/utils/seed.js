import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Doctor from '../models/Doctor.js';
import Hospital from '../models/Hospital.js';

dotenv.config();

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/Opdify');
  console.log('🌱 Seeding...');

  await User.deleteMany({});
  await Doctor.deleteMany({});
  await Hospital.deleteMany({});

  const adminUser = await User.create({
    name: 'Admin', phone: '9000000000', email: 'admin@Opdify.in',
    password: await bcrypt.hash('admin123', 12), role: 'admin',
  });

  const hospital = await Hospital.create({
    name: 'Apollo Specialty Hospital', uniqueId: 'HSP-APOL-1001',
    adminId: adminUser._id,
    address: { street: 'Sector 5, Dwarka', city: 'New Delhi', state: 'Delhi', pincode: '110075' },
    location: { type: 'Point', coordinates: [77.0414, 28.5921] },
    phone: '011-23456789', specializations: ['Cardiology', 'Orthopedics', 'Neurology', 'General Medicine'],
    isVerified: true,
  });

  const doctors = [
    { name: 'Dr. Priya Sharma',   spec: 'Cardiologist',       uid: 'DR-PRIYA-1001', exp: 12, fee: 800,  coords: [77.2090, 28.6139], city: 'New Delhi' },
    { name: 'Dr. Rahul Mehta',    spec: 'Orthopedic Surgeon', uid: 'DR-RAHUL-1002', exp: 9,  fee: 700,  coords: [72.8777, 19.0760], city: 'Mumbai' },
    { name: 'Dr. Anjali Singh',   spec: 'General Physician',  uid: 'DR-ANJAL-1003', exp: 7,  fee: 400,  coords: [77.0500, 28.5700], city: 'New Delhi' },
    { name: 'Dr. Vikram Nair',    spec: 'Neurologist',        uid: 'DR-VIKRA-1004', exp: 15, fee: 1000, coords: [77.5946, 12.9716], city: 'Bangalore' },
    { name: 'Dr. Meera Patel',    spec: 'Dermatologist',      uid: 'DR-MEERA-1005', exp: 6,  fee: 600,  coords: [72.5714, 23.0225], city: 'Ahmedabad' },
    { name: 'Dr. Arjun Reddy',    spec: 'Pediatrician',       uid: 'DR-ARJUN-1006', exp: 10, fee: 500,  coords: [78.4867, 17.3850], city: 'Hyderabad' },
  ];

  for (const d of doctors) {
    const phone = `9${Math.floor(100000000 + Math.random() * 900000000)}`;
    const dUser = await User.create({
      name: d.name, phone, email: `${d.uid.toLowerCase()}@Opdify.in`,
      password: await bcrypt.hash('doctor123', 12), role: 'doctor',
    });
    await Doctor.create({
      userId: dUser._id, uniqueId: d.uid, name: d.name, phone,
      specialization: d.spec, qualifications: ['MBBS', 'MD'],
      experience: d.exp, consultationFee: d.fee,
      clinicName: `${d.name}'s Clinic`,
      clinicAddress: { city: d.city, country: 'India' },
      location: { type: 'Point', coordinates: d.coords },
      hospitalId: hospital._id,
      avgTimePerPatient: 15, maxPatientsPerDay: 30,
      isBookingOpen: true, isAvailableToday: true, isVerified: true,
      rating: parseFloat((4 + Math.random()).toFixed(1)),
      reviewCount: Math.floor(50 + Math.random() * 200),
      totalPatientsSeen: Math.floor(200 + Math.random() * 800),
    });
  }

  await User.create({
    name: 'Ravi Kumar', phone: '9876543210', email: 'patient@Opdify.in',
    password: await bcrypt.hash('patient123', 12), role: 'patient',
  });

  console.log('\n✅ Seed complete!');
  console.log('Patient  → 9876543210 / patient123');
  console.log('Doctor   → (see DB)   / doctor123');
  console.log('Admin    → 9000000000 / admin123\n');
  process.exit(0);
};

seed().catch(e => { console.error(e); process.exit(1); });
