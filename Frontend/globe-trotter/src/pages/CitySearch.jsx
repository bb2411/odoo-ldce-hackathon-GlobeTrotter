import { useState, useEffect } from "react";
import axios from "axios";
import { Search, MapPin, Plus, Check } from "lucide-react";

function CitySearch() {
  const [search, setSearch] = useState("");
  const [selectedCities, setSelectedCities] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Search cities using Axios
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
        "http://localhost:5000/api/cities/search",
        {
          params: {
            q: search,
          },
        }
      );

      // GeoDB data will come from backend
      setCities(response.data.data || []);
    } catch (error) {
      console.error("Error searching cities:", error);

      setCities([]);
      setError("Unable to search cities. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Wait 500ms after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      searchCities();
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  // Add city to trip
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
            Search and add cities to your trip.
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
            <h2 className="text-xl font-bold mb-4">
              Your Selected Cities
            </h2>

            <div className="flex flex-wrap gap-3">
              {selectedCities.map((city) => (
                <div
                  key={city.id}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-full"
                >
                  <Check size={18} />

                  {city.city}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search Results Title */}
        <h2 className="text-xl font-bold mb-5">
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
                  className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition"
                >
                  {/* City Image Placeholder */}
                  <div className="h-44 bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
                    <MapPin size={55} className="text-white" />
                  </div>

                  <div className="p-5">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-bold text-gray-800">
                          {city.city}
                        </h3>

                        <div className="flex items-center text-gray-500 mt-1">
                          <MapPin size={16} />

                          <span className="ml-1">
                            {city.country}
                          </span>
                        </div>
                      </div>

                      {city.population && (
                        <span className="bg-gray-100 px-3 py-1 rounded-full text-sm text-gray-600">
                          {city.population.toLocaleString()}
                        </span>
                      )}
                    </div>

                    <p className="text-gray-500 mt-4">
                      {city.region || "Region not available"}
                    </p>

                    <button
                      onClick={() => addCity(city)}
                      disabled={isAdded}
                      className={`w-full mt-5 py-2 rounded-lg flex justify-center items-center gap-2 font-medium transition ${
                        isAdded
                          ? "bg-green-100 text-green-700"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <Check size={18} />
                          Added
                        </>
                      ) : (
                        <>
                          <Plus size={18} />
                          Add to Trip
                        </>
                      )}
                    </button>
                  </div>
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
              No cities found.
            </div>
          )}

        {/* Initial State */}
        {!loading && !error && search.length < 2 && (
          <div className="text-center py-20 text-gray-400">
            <MapPin size={50} className="mx-auto mb-4" />

            <p>Start typing to search for cities.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default CitySearch;