const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const path = require('path');

// Configure Cloudinary
console.log('CLOUDINARY CONFIG CHECK:');
console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME ? 'OK' : 'MISSING');
console.log('API Key:', process.env.CLOUDINARY_API_KEY ? 'OK' : 'MISSING');
console.log('API Secret:', process.env.CLOUDINARY_API_SECRET ? 'OK' : 'MISSING');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Storage
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'x-icon-garage', 
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
        transformation: [{ width: 1000, height: 1000, crop: 'limit' }] // Resize limit
    }
});

const upload = multer({ storage: storage });

module.exports = { cloudinary, upload };
