function image_url(type, filename) {
  if (!filename) return "";
  let folder = "";
  if (type === "destinationCategory") folder = "dastinationcategory"; // <-- spelling match karo
  if (type === "hotel_syt") folder = "hotel_syt";
  if (type === "room_syt") folder = "room_syt";
  if (type === "placephoto") folder = "placephoto";
  if (type === "vendor_car") folder = "vendor_car";
  if (type === "car_syt") folder = "car_syt";
  if (type === "blogger") folder = "blogger";
  if (type === "safetyinfo") folder = "safetyinfo";
  return `/public/images/${folder}/${filename}`;
}

module.exports = image_url;
