// update_url_path.js
const image_url = async (type, path) => {
  const baseURL = "https://start-your-tour-harsh.onrender.com/images/";

  // Handle empty or null paths
  if (!path) {
    return `${baseURL}${type}/placeholder.jpg`; // Fallback to a placeholder image
  }

  // Normalize the path by removing any leading/trailing slashes
  const cleanPath = path.replace(/^\/+|\/+$/g, "");

  // Check if the path is already a full URL
  if (cleanPath.startsWith("http://") || cleanPath.startsWith("https://")) {
    const doubleBaseURL = `${baseURL}${type}/`;
    // If the path contains the baseURL + type, strip the redundant part
    if (cleanPath.startsWith(doubleBaseURL)) {
      return cleanPath.replace(doubleBaseURL, `${baseURL}${type}/`);
    }
    // If it's a valid full URL, return it as is
    return cleanPath;
  }

  // If it's a relative path, construct the full URL
  return `${baseURL}${type}/${cleanPath}`;
};

module.exports = image_url;