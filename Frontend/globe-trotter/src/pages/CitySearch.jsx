import { useState, useEffect } from "react";
import axios from "axios";
import {
  Search,
  MapPin,
  Plus,
  Check,
  Users,
  Map,
  Navigation,
  Globe,
} from "lucide-react";

function CitySearch() {
  const [search, setSearch] = useState("");
  const [selectedCities, setSelectedCities] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Search cities using GeoDB API
  const searchCities = async () => {
    if (search.trim().length < 2) {
      setCities([]);
      setError("");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await axios.get(
        "https://wft-geo-db.p.rapidapi.com/v1/geo/cities",
        {
          params: {
            namePrefix: search,
            limit: 10,
          },
          headers: {
            "X-RapidAPI-Key": "95ca9c656fmsh7520587b80a2b80p1b7bfbjsneaa0fa0a0008",
            "X-RapidAPI-Host": "wft-geo-db.p.rapidapi.com",
          },
        }
      );

      // Keep only actual cities
      const cityResults = response.data.data.filter(
        (item) => item.type === "CITY"
      );

      setCities(cityResults);
    } catch (error) {
      console.error("Error searching cities:", error);
      setCities([]);
      setError("Unable to search cities. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Search after user stops typing for 500ms
  useEffect(() => {
    const timer = setTimeout(() => {
      searchCities();
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  // Add city to selected cities
  const addCity = (city) => {
    if (!selectedCities.some((item) => item.id === city.id)) {
      setSelectedCities([...selectedCities, city]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Add Destinations
          </h1>

          <p className="text-gray-500 mt-2">
            Search and add cities to your trip itinerary.
          </p>
        </div>

        {/* Search Box */}
        <div className="bg-white p-4 rounded-xl shadow-sm mb-8">
          <div className="flex items-center gap-3 border border-gray-300 rounded-lg px-4 py-3">
            <Search size={22} className="text-gray-400" />

            <input
              type="text"
              placeholder="Search city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full outline-none text-gray-700"
            />
          </div>
        </div>

        {/* Selected Cities */}
        {selectedCities.length > 0 && (
          <div className="mb-10">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Your Selected Cities
            </h2>

            <div className="flex flex-wrap gap-3">
              {selectedCities.map((city) => (
                <div
                  key={city.id}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-full"
                >
                  <Check size={18} />

                  <span>
                    {city.city}, {city.country}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Results Heading */}
        <h2 className="text-xl font-bold text-gray-800 mb-5">
          {search ? "Search Results" : "Search for a Destination"}
        </h2>

        {/* Loading */}
        {loading && (
          <div className="text-center py-10 text-gray-500">
            Searching cities...
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-center py-10 text-red-500">
            {error}
          </div>
        )}

        {/* City Results */}
        {!loading && !error && cities.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            {cities.map((city) => {
              const isAdded = selectedCities.some(
                (item) => item.id === city.id
              );

              return (
                <div
                  key={city.id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition"
                >
                  {/* City Header */}
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex items-center gap-3">

                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <MapPin
                          size={24}
                          className="text-blue-600"
                        />
                      </div>

                      <div>
                        <h3 className="text-xl font-bold text-gray-800">
                          {city.city}
                        </h3>

                        <p className="text-sm text-gray-500">
                          {city.country}
                        </p>
                      </div>

                    </div>

                    <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-medium">
                      {city.countryCode}
                    </span>
                  </div>

                  {/* Region */}
                  <div className="flex items-center gap-2 text-gray-600 mb-3">
                    <Map size={18} className="text-gray-400" />

                    <span>
                      {city.region || "Region not available"}
                    </span>
                  </div>

                  {/* Population */}
                  <div className="flex items-center gap-2 text-gray-600 mb-3">
                    <Users size={18} className="text-gray-400" />

                    <span>
                      Population:{" "}
                      {city.population > 0
                        ? city.population.toLocaleString()
                        : "Not available"}
                    </span>
                  </div>

                  {/* Coordinates */}
                  <div className="flex items-start gap-2 text-gray-600 mb-5">
                    <Navigation
                      size={18}
                      className="text-gray-400 mt-1"
                    />

                    <div>
                      <p className="text-sm">
                        Latitude: {city.latitude}
                      </p>

                      <p className="text-sm">
                        Longitude: {city.longitude}
                      </p>
                    </div>
                  </div>

                  {/* City Type */}
                  <div className="flex items-center gap-2 text-gray-500 mb-5">
                    <Globe size={18} />

                    <span className="text-sm">
                      Type: {city.type}
                    </span>
                  </div>

                  {/* Add Button */}
                  <button
                    onClick={() => addCity(city)}
                    disabled={isAdded}
                    className={`w-full py-3 rounded-xl flex justify-center items-center gap-2 font-medium transition ${
                      isAdded
                        ? "bg-green-100 text-green-700"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <Check size={18} />
                        Added to Trip
                      </>
                    ) : (
                      <>
                        <Plus size={18} />
                        Add to Trip
                      </>
                    )}
                  </button>
                </div>
              );
            })}

          </div>
        )}

        {/* No Results */}
        {!loading &&
          !error &&
          search.length >= 2 &&
          cities.length === 0 && (
            <div className="text-center py-20 text-gray-500">
              <MapPin size={50} className="mx-auto mb-4" />

              <p>No cities found.</p>
            </div>
          )}

        {/* Initial State */}
        {!loading && !error && search.length < 2 && (
          <div className="text-center py-20 text-gray-400">
            <Search size={50} className="mx-auto mb-4" />

            <p>Start typing to search for cities.</p>
          </div>
        )}

      </div>
    </div>
  );
}

export default CitySearch;