const fs = require('fs');
const path = require('path');

async function update_path(foldername, data) {
  if (!data || data.length === 0) {
    console.log('[DEBUG] No image data provided');
    return null;
  }

  // In development, use localhost with port from environment or default to 4000
  const isProduction = process.env.NODE_ENV === 'production';
  const baseUrl = isProduction
    ? 'https://start-your-tour-harsh.onrender.com'
    : `http://localhost:${process.env.PORT || 4000}`;

  const imagePath = path.join(__dirname, 'public', 'images', foldername, data);

  // Debug output
  console.log(`[DEBUG] Base URL: ${baseUrl}`);
  console.log(`[DEBUG] Looking for image at: ${imagePath}`);

  try {
    // Check if file exists
    try {
      await fs.promises.access(imagePath, fs.constants.F_OK);
      console.log(`[DEBUG] Image found at: ${imagePath}`);
    } catch (err) {
      console.warn(`[WARNING] Image not found: ${imagePath}`);
      // Return a default image if the requested one doesn't exist
      return `${baseUrl}/images/placeholder.jpg`;
    }

    // Return the full URL to the image
    const imageUrl = `${baseUrl}/images/${foldername}/${encodeURIComponent(data)}`;
    console.log(`[DEBUG] Generated image URL: ${imageUrl}`);
    return imageUrl;
  } catch (error) {
    console.error(`[ERROR] Error processing image path:`, error);
    return `${baseUrl}/images/placeholder.jpg`;
  }
}

module.exports = update_path;
