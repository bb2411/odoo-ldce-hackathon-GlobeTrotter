require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const prisma = require("../src/lib/Prisma");

const cities = [
  ["Delhi", "India", "IN", 28.6139, 77.209, "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=1200&q=85"],
  ["Mumbai", "India", "IN", 19.076, 72.8777, "https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?auto=format&fit=crop&w=1200&q=85"],
  ["Jaipur", "India", "IN", 26.9124, 75.7873, "https://images.unsplash.com/photo-1599661046827-dacde697654f?auto=format&fit=crop&w=1200&q=85"],
  ["Udaipur", "India", "IN", 24.5854, 73.7125, "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1200&q=85"],
  ["Rishikesh", "India", "IN", 30.0869, 78.2676, "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1200&q=85"],
  ["Goa", "India", "IN", 15.2993, 74.124, "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=85"],
  ["Varanasi", "India", "IN", 25.3176, 82.9739, "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=1200&q=85"],
  ["Kochi", "India", "IN", 9.9312, 76.2673, "https://images.unsplash.com/photo-1600100397608-f0101a9d7f4c?auto=format&fit=crop&w=1200&q=85"],
  ["Bengaluru", "India", "IN", 12.9716, 77.5946, "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=1200&q=85"],
  ["Leh", "India", "IN", 34.1526, 77.5771, "https://images.unsplash.com/photo-1626014303757-636d4e3bb1c2?auto=format&fit=crop&w=1200&q=85"],
];

const activities = [
  ["delhi-red-fort", "Delhi", "Red Fort heritage walk", "Culture", 500, 120, "Explore Mughal architecture and the stories behind Old Delhi's iconic fort."],
  ["delhi-food", "Delhi", "Old Delhi street-food trail", "Food", 850, 180, "Taste chaat, jalebi and local classics with a guided walk through Chandni Chowk."],
  ["mumbai-gateway", "Mumbai", "Gateway of India and Colaba walk", "Culture", 400, 120, "A coastal heritage walk through Mumbai's best-known neighbourhood."],
  ["mumbai-marine", "Mumbai", "Sunset at Marine Drive", "Leisure", 0, 90, "Watch the city lights come on along the Queen's Necklace."],
  ["jaipur-amber", "Jaipur", "Amber Fort and Palace tour", "Culture", 700, 180, "Discover hilltop palaces, courtyards and Rajput history."],
  ["jaipur-blockprint", "Jaipur", "Block-printing workshop", "Arts", 1200, 150, "Make a hand-printed textile with a local artisan."],
  ["udaipur-lake", "Udaipur", "Lake Pichola sunset boat ride", "Leisure", 650, 75, "Take in the City of Lakes from the water at golden hour."],
  ["rishikesh-rafting", "Rishikesh", "Ganga white-water rafting", "Adventure", 1800, 210, "A guided rafting adventure on the Ganges."],
  ["goa-kayak", "Goa", "Mangrove kayaking", "Adventure", 1400, 150, "Paddle quiet backwaters and spot coastal wildlife."],
  ["goa-cuisine", "Goa", "Goan home-cooking class", "Food", 1600, 180, "Cook a seasonal Goan meal in a local home."],
  ["varanasi-aarti", "Varanasi", "Ganga Aarti viewing", "Spiritual", 0, 75, "Experience the evening ceremony from the ghats."],
  ["kochi-fort", "Kochi", "Fort Kochi art and history walk", "Culture", 600, 150, "See Chinese fishing nets, colonial lanes and contemporary art."],
  ["bengaluru-brew", "Bengaluru", "Craft coffee tasting", "Food", 750, 90, "Taste single-origin Indian coffee with a specialist."],
  ["leh-stupa", "Leh", "Shanti Stupa sunrise hike", "Outdoors", 0, 120, "A peaceful early walk for sweeping mountain views."],
];

async function main() {
  const cityByName = {};
  for (const [name, country, countryCode, latitude, longitude, imageUrl] of cities) {
    cityByName[name] = await prisma.city.upsert({ where: { name_country: { name, country } }, update: { countryCode, latitude, longitude, imageUrl, source: "globetrotter-india" }, create: { name, country, countryCode, latitude, longitude, imageUrl, source: "globetrotter-india", externalId: `india-${name.toLowerCase()}` } });
  }
  for (const [externalId, cityName, name, category, basePrice, durationMinutes, description] of activities) {
    const existing = await prisma.activity.findFirst({ where: { externalId } });
    const data = { cityId: cityByName[cityName].id, name, category, basePrice, durationMinutes, description, source: "globetrotter-india", externalId };
    if (existing) await prisma.activity.update({ where: { id: existing.id }, data }); else await prisma.activity.create({ data });
  }
  console.log(`Seeded ${cities.length} Indian cities and ${activities.length} activities.`);
}

main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
