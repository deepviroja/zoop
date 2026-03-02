import { useState } from "react";
import { normalizeCityName } from "../utils/cityMapping";

export const useGeoLocation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getCityName = async (lat, lon) => {
    if (!lat || !lon) {
      console.error("Invalid coordinates provided to getCityName");
      return null; // Changed from "Surat"
    }

    try {
      const response = await fetch(
        `/mapapi/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=en`,
        {
          headers: {
            "Accept-Language": "en",
          },
        },
      );

      // Check if response is actually JSON before parsing
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error(
          "Received HTML instead of JSON. Did you restart the server?",
        );
      }

      const data = await response.json();

      if (data.error) {
        console.error("API Error:", data.error);
        return null; // Changed from "Surat"
      }

      // Try to get city name from multiple fields
      const rawCity =
        data.address.city ||
        data.address.town ||
        data.address.village ||
        data.address.state_district ||
        data.address.county ||
        data.address.state;

      // If no city found, return null
      if (!rawCity) return null;

      return normalizeCityName(rawCity);
    } catch (error) {
      console.error("Geocoding error:", error);
      return null; // Changed from "Surat"
    }
  };

  const detectCity = () => {
    return new Promise((resolve, reject) => {
      setLoading(true);
      setError(null);

      if (!navigator.geolocation) {
        const msg = "Geolocation is not supported by your browser";
        setError(msg);
        setLoading(false);
        reject(msg);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const city = await getCityName(
            position.coords.latitude,
            position.coords.longitude,
          );
          setLoading(false);

          if (city) {
            resolve(city);
          } else {
            // Handle case where coordinates worked but city wasn't found
            const msg =
              "Location found, but city name could not be determined.";
            setError(msg);
            reject(msg);
          }
        },
        (err) => {
          setError(err.message);
          setLoading(false);
          reject(err);
        },
      );
    });
  };

  return { detectCity, loading, error };
};
