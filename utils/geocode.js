const axios = require("axios");

module.exports = async function geocodeLocation(location) {
  const response = await axios.get(
    "https://nominatim.openstreetmap.org/search",
    {
      params: {
        q: location,
        format: "json",
        limit: 1,
      },
      headers: {
        "User-Agent": "WanderLust-App" // IMPORTANT
      }
    }
  );

  if (!response.data.length) return null;

  return {
    type: "Point",
    coordinates: [
      parseFloat(response.data[0].lon),
      parseFloat(response.data[0].lat),
    ],
  };
};
