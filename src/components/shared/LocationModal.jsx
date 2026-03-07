import React, { useEffect, useMemo, useState } from "react";
import { useGeoLocation } from "../../hooks/useGeoLocation";
import { useUser } from "../../context/UserContext";
import { contentApi } from "../../services/api";

const LocationModal = ({ isOpen, onClose }) => {
  const { detectCity, loading, error } = useGeoLocation();
  const { updateLocation } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [cities, setCities] = useState([
    "Surat",
    "Ahmedabad",
    "Mumbai",
    "Delhi",
    "Bengaluru",
    "Pune",
    "Kolkata",
    "Chennai",
    "Jaipur",
    "Hyderabad",
  ]);

  useEffect(() => {
    let cancelled = false;
    const loadCities = async () => {
      try {
        const list = await contentApi.getCities();
        if (cancelled || !Array.isArray(list) || list.length === 0) return;
        const names = list
          .map((item) => String(item?.name || "").trim())
          .filter(Boolean);
        if (!cancelled && names.length > 0) {
          setCities(Array.from(new Set(names)).sort((a, b) => a.localeCompare(b)));
        }
      } catch {
        // Keep fallback list.
      }
    };
    if (isOpen) {
      void loadCities();
    }
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  // Filter cities based on search query
  const filteredCities = useMemo(
    () =>
      cities.filter((city) =>
        city.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [cities, searchQuery],
  );

  if (!isOpen) return null;

  const handleCitySelect = (city) => {
    updateLocation(city);
    onClose();
    setSearchQuery(""); // Reset search
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-zoop-obsidian/60 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 space-y-6">
          <h3 className="text-xl font-900 text-zoop-obsidian text-center">
            Set Your <span className="text-zoop-moss">Local Node</span>
          </h3>
          <p className="text-center text-gray-500 text-xs">
            See same-day delivery products available near you.
          </p>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-xs font-bold flex items-center gap-2 animate-pulse">
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              {error}
            </div>
          )}
          
          <button
            onClick={async () => {
              try {
                const city = await detectCity();
                handleCitySelect(city);
              } catch {
                // Error state is already handled by the hook
              }
            }}
            className="w-full bg-zoop-moss p-4 rounded-xl font-black flex justify-center items-center gap-2 cursor-pointer hover:shadow-lg hover:brightness-105 transition-all disabled:opacity-50 text-zoop-obsidian"
            disabled={loading}
          >
            {loading ? (
              <span className="animate-spin h-4 w-4 border-2 border-black border-t-transparent rounded-full"></span>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
            )}
            {loading ? " Detecting..." : " Use My Current Location"}
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-100" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500 font-bold">Or select manually</span>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search for your city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 pr-10 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zoop-moss focus:border-transparent"
            />
            <svg
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </div>

          {/* Cities Grid */}
          <div className="grid grid-cols-2 gap-3 max-h-[200px] overflow-y-auto no-scrollbar">
            {filteredCities.length > 0 ? (
              filteredCities.map((city) => (
                <button
                  key={city}
                  onClick={() => handleCitySelect(city)}
                  className="px-4 py-3 rounded-lg border border-gray-100 text-sm font-bold text-gray-600 hover:border-zoop-moss hover:bg-zoop-moss/10 hover:text-zoop-obsidian transition-all"
                >
                  {city}
                </button>
              ))
            ) : (
              <div className="col-span-2 text-center py-6 text-gray-400 text-sm">
                No cities found. Try a different search.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationModal;
