import { v2 as cloudinary } from 'cloudinary';

// 1. Configure Cloudinary inline
cloudinary.config({
  cloud_name: 'ddxprul53',
  api_key: '811439696878995',
  api_secret: 'RJpH1HcZ9gZFUMdv-Ctq-3yf5mk',
  secure: true
});

async function run() {
  try {
    const imageUrl = 'https://res.cloudinary.com/demo/image/upload/sample.jpg';
    console.log('Uploading image...');
    
    // 2. Upload an image
    const uploadResult = await cloudinary.uploader.upload(imageUrl);
    console.log('Upload success!');
    console.log('Secure URL:', uploadResult.secure_url);
    console.log('Public ID:', uploadResult.public_id);
    
    // 3. Get image details
    console.log('\nFetching image details...');
    const details = await cloudinary.api.resource(uploadResult.public_id);
    console.log('Width:', details.width);
    console.log('Height:', details.height);
    console.log('Format:', details.format);
    console.log('File size (bytes):', details.bytes);
    
    // 4. Transform the image
    // f_auto: Automatically delivers the image in the most optimal format (e.g., WebP, AVIF) depending on the browser.
    // q_auto: Automatically optimizes the image's quality/compression balance to minimize file size while maintaining visual quality.
    const transformedUrl = cloudinary.url(uploadResult.public_id, {
      transformation: [
        { fetch_format: 'auto' }, // f_auto
        { quality: 'auto' }       // q_auto
      ]
    });
    
    console.log('\nDone! Click link below to see optimized version of the image. Check the size and the format.');
    console.log(transformedUrl);
    
  } catch (error) {
    console.error('Error during Cloudinary onboarding operations:', error);
  }
}

run();
