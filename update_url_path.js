const fs = require('fs');
const path = require('path');

// Map of folder names to their normalized versions
const FOLDER_ALIASES = {
  'destination': 'dastinationcategory',
  'destinationcategory': 'dastinationcategory',
  'hotel': 'hotel_syt',
  'room': 'room_syt',
  'itinerary': 'itinary',
  'car': 'car_syt',
  'blog': 'blogger',
  'user': 'users',
  'vendor': 'vendor_car',
  'safety': 'safetyinfo',
  'highlight': 'highlights',
  'document': 'document',
  'facility': 'facilities',
  'flight': 'flight_booking',
  'place': 'placephoto'
};

// Default images for different folder types
const DEFAULT_IMAGES = {
  'dastinationcategory': 'default-destination.jpg',
  'hotel_syt': 'default-hotel.jpg',
  'room_syt': 'default-room.jpg',
  'itinary': 'default-itinerary.jpg',
  'car_syt': 'default-car.jpg',
  'blogger': 'default-blog.jpg',
  'users': 'default-user.jpg',
  'vendor_car': 'default-vendor.jpg',
  'safetyinfo': 'default-safety.jpg',
  'highlights': 'default-highlight.jpg',
  'placephoto': 'default-place.jpg',
  'default': 'placeholder.jpg'
};

/**
 * Normalizes folder name to match the actual directory structure
 * @param {string} folderName - The folder name to normalize
 * @returns {string} Normalized folder name
 */
function normalizeFolderName(folderName) {
  if (!folderName) return 'default';

  const lowerFolder = folderName.toLowerCase().trim();
  return FOLDER_ALIASES[lowerFolder] || folderName;
}

/**
 * Gets the default image for a folder type
 * @param {string} folderName - The normalized folder name
 * @returns {string} Path to the default image
 */
function getDefaultImage(folderName) {
  const normalized = normalizeFolderName(folderName);
  const defaultImage = DEFAULT_IMAGES[normalized] || DEFAULT_IMAGES.default;
  return `/images/${defaultImage}`;
}

/**
 * Updates the image path based on the folder structure
 * @param {string} folderName - The type of image (e.g., 'hotel', 'destination')
 * @param {string} imageName - The name of the image file
 * @returns {Promise<string>} The full URL to the image
 */
async function update_path(folderName, imageName) {
  // Input validation
  if (!imageName || typeof imageName !== 'string' || imageName.trim() === '') {
    console.warn('[WARNING] Invalid image name provided');
    return getDefaultImage(folderName);
  }

  // Normalize folder name
  const normalizedFolder = normalizeFolderName(folderName);

  // In development, use localhost with port from environment or default to 4000
  const isProduction = process.env.NODE_ENV === 'production';
  const baseUrl = isProduction
    ? 'https://start-your-tour-harsh.onrender.com'
    : `http://localhost:${process.env.PORT || 4000}`;

  // Clean and sanitize the image name
  const cleanImageName = path.basename(imageName).replace(/[^\w\d._-]/g, '');
  if (!cleanImageName) {
    console.warn('[WARNING] Invalid image name after sanitization');
    return baseUrl + getDefaultImage(normalizedFolder);
  }

  // Construct the full image path
  const imagePath = path.join(
    __dirname,
    'public',
    'images',
    normalizedFolder,
    cleanImageName
  );

  // Debug output
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[DEBUG] Base URL: ${baseUrl}`);
    console.log(`[DEBUG] Looking for image at: ${imagePath}`);
  }

  try {
    // Check if file exists
    try {
      await fs.promises.access(imagePath, fs.constants.F_OK);
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[DEBUG] Image found at: ${imagePath}`);
      }
    } catch (err) {
      console.warn(`[WARNING] Image not found: ${imagePath}`);
      // Return default image for the folder type
      return baseUrl + getDefaultImage(normalizedFolder);
    }

    // Return the full URL to the image
    const imageUrl = `${baseUrl}/images/${normalizedFolder}/${encodeURIComponent(cleanImageName)}`;
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DEBUG] Generated image URL: ${imageUrl}`);
    }
    return imageUrl;
  } catch (error) {
    console.error(`[ERROR] Error processing image path:`, error);
    return baseUrl + getDefaultImage(normalizedFolder);
  }
}

module.exports = update_path;
