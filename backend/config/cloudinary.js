import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';


try {
  const envPath = new URL('../.env', import.meta.url).pathname;
  dotenv.config({ path: envPath });
} catch (e) {
  
  try { dotenv.config({ path: require('path').resolve(process.cwd(), 'backend', '.env') }); } catch (err) { /* ignore */ }
}

if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.warn('Warning: Cloudinary env vars missing. Check backend/.env');
} else {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'cliniq/avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face', quality: 'auto' }],
  },
});

export const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });
export { cloudinary };
