import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

export function getCloudinary() {
  const config = {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
  };
  if (!config.cloud_name || !config.api_key || !config.api_secret) {
    const error = new Error('Cloudinary is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET to server/.env');
    error.status = 503;
    throw error;
  }
  cloudinary.config(config);
  return cloudinary;
}

export function uploadToCloudinary(filePath, { resourceType, folder }) {
  const client = getCloudinary();
  if (resourceType !== 'video') {
    return client.uploader.upload(filePath, {
      resource_type: resourceType,
      folder,
      unique_filename: true,
      overwrite: false
    });
  }

  return new Promise((resolve, reject) => {
    const source = fs.createReadStream(filePath);
    let settled = false;
    const finish = (error, result) => {
      if (settled) return;
      settled = true;
      if (error) reject(error);
      else resolve(result);
    };
    const destination = client.uploader.upload_chunked_stream({
      resource_type: 'video',
      folder,
      chunk_size: 6_000_000,
      unique_filename: true,
      overwrite: false
    }, finish);
    source.once('error', finish);
    destination.once('error', finish);
    source.pipe(destination);
  });
}

export async function deleteFromCloudinary(publicId, resourceType) {
  if (!publicId) return null;
  return getCloudinary().uploader.destroy(publicId, { resource_type: resourceType });
}
