// ===== Your WAQI token =====
const WAQI_TOKEN = "8e76662ad55eab9c41cf0061f3518d2ac1b4f884";

// DOM elements
const locEl = document.getElementById("location");
const aqiEl = document.getElementById("aqi");
const sugEl = document.getElementById("suggestion");
const tipEl = document.getElementById("tip");
const stationsList = document.getElementById("stations-list");
const nearestStationEl = document.getElementById("nearest-station");

// ✅ Search bar elements
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");

/* ----------------- Tip collections ----------------- */
const TIPS_GOOD = [
  "Enjoy the fresh air — great day for a walk or cycling.",
  "Open windows for 10–15 minutes to ventilate indoor spaces.",
  "Light outdoor workouts are recommended (jogging, brisk walk).",
  "Include seasonal fruits and fresh salads for antioxidants.",
  "Take advantage of clear air for outdoor errands and chores."
];
const TIPS_MODERATE = [
  "Avoid long strenuous exercise near busy roads.",
  "If you have asthma or respiratory issues, keep inhalers handy.",
  "Prefer early morning or late evening when traffic is lower.",
  "Rinse eyes and face if you feel irritation after time outside.",
  "Keep indoor plants that help with air purification (e.g., snake plant)."
];
const TIPS_UNHEALTHY = [
  "Reduce outdoor exertion; choose indoor low-intensity workouts.",
  "Consider wearing a mask when outside for extended periods.",
  "Close windows when traffic is heavy to limit infiltration.",
  "Drink warm water and include ginger/ turmeric in meals.",
  "Avoid burning candles or indoor smoking which worsens indoor air."
];
const TIPS_VERY_UNHEALTHY = [
  "Stay indoors, run air purifiers if available.",
  "Avoid strenuous activity and keep windows closed.",
  "Use N95 / P2 masks if you must go outside.",
  "Keep hydrated and avoid heavy fried foods today.",
  "If symptoms appear (breathlessness, chest pain) seek medical help."
];

// Meals & exercise
const MEALS_GOOD = [
  "Grilled fish or chicken + fresh salad",
  "Oatmeal with nuts & berries",
  "Yogurt with fruit and seeds"
];
const MEALS_MODERATE = [
  "Veg stir-fry with tofu and greens",
  "Lentil soup and whole grains",
  "Quinoa bowl with vegetables"
];
const MEALS_UNHEALTHY = [
  "Hydrating soups (ginger, turmeric)",
  "Steamed vegetables + simple protein",
  "Smoothie with berries and spinach"
];
const MEALS_VERY_UNHEALTHY = [
  "Broth-based soups and light protein",
  "Cooked vegetables and easily digestible meals",
  "Avoid heavy oily or fried foods"
];
const EX_GOOD = ["Outdoor run or cycling", "Brisk walk", "Outdoor sports"];
const EX_MODERATE = ["Short walk, avoid heavy exertion", "Light jogging or yoga", "Indoor cardio sessions"];
const EX_UNHEALTHY = ["Prefer indoor low-to-moderate workouts (yoga, stationary bike)"];
const EX_VERY_UNHEALTHY = ["Avoid outdoor exercise — gentle indoor stretching"];

function pickRandom(arr, n = 2) {
  const copy = arr.slice();
  const out = [];
  n = Math.min(n, copy.length);
  for (let i = 0; i < n; i++) {
    const idx = Math.floor(Math.random() * copy.length);
    out.push(copy.splice(idx, 1)[0]);
  }
  return out;
}

/* ------------ Geolocation (default on load) ------------ */
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(success, geoError, { timeout: 10000 });
} else {
  locEl.textContent = "Geolocation not supported by your browser.";
}

function success(position) {
  const lat = position.coords.latitude;
  const lon = position.coords.longitude;
  getLocationName(lat, lon);
  getAQI(lat, lon);
  getTopStations(lat, lon);
}

function geoError(err) {
  console.warn("Geolocation error:", err);
  locEl.textContent = "Location access denied or unavailable.";
  showDemoData();
}

/* ------------ Reverse geocode for city name ------------ */
async function getLocationName(lat, lon) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
    );
    const j = await res.json();
    const addr = j.address || {};
    const city = addr.city || addr.town || addr.village || addr.county || j.display_name;
    locEl.textContent = `📍 You are in ${city}`;
  } catch {
    locEl.textContent = `📍 Location: ${lat.toFixed(3)}, ${lon.toFixed(3)}`;
  }
}

/* ------------ Fetch AQI by coordinates ------------ */
async function getAQI(lat, lon) {
  try {
    const res = await fetch(`https://api.waqi.info/feed/geo:${lat};${lon}/?token=${WAQI_TOKEN}`);
    const json = await res.json();
    if (json.status === "ok" && json.data && typeof json.data.aqi === "number") {
      const aqi = json.data.aqi;
      aqiEl.textContent = `Current AQI: ${aqi}`;
      updateSuggestions(aqi);
    } else {
      aqiEl.textContent = "AQI data not available.";
      showDemoData();
    }
  } catch {
    aqiEl.textContent = "Error fetching AQI.";
    showDemoData();
  }
}

/* ------------ Search AQI by City Name ------------ */
async function fetchAQIbyCity(city) {
  try {
    locEl.textContent = `Searching AQI for ${city}...`;
    const res = await fetch(`https://api.waqi.info/feed/${encodeURIComponent(city)}/?token=${WAQI_TOKEN}`);
    const json = await res.json();
    if (json.status === "ok" && json.data) {
      const aqi = json.data.aqi;
      const station = json.data.city?.name || city;
      locEl.textContent = `📍 ${station}`;
      aqiEl.textContent = `Current AQI: ${aqi}`;
      nearestStationEl.textContent = `Your nearest AQI station is ${station}`;
      updateSuggestions(aqi);
      stationsList.innerHTML = "<div style='opacity:.9'>Station data not loaded for manual search.</div>";
    } else {
      locEl.textContent = `No AQI data found for "${city}".`;
    }
  } catch (err) {
    console.error("Search error:", err);
    locEl.textContent = `Error searching for ${city}.`;
  }
}

/* ------------ Tips / Meals / Exercise ------------ */
function updateSuggestions(aqi) {
  let msg = "", tips = [], meals = [], exercises = [];

  if (aqi <= 50) { msg="Air quality is good. Outdoor exercise is fine."; tips=TIPS_GOOD; meals=MEALS_GOOD; exercises=EX_GOOD; }
  else if (aqi <= 100) { msg="Moderate AQI. Sensitive people should take care."; tips=TIPS_MODERATE; meals=MEALS_MODERATE; exercises=EX_MODERATE; }
  else if (aqi <= 150) { msg="Unhealthy for sensitive groups. Prefer indoor activities."; tips=TIPS_UNHEALTHY; meals=MEALS_UNHEALTHY; exercises=EX_UNHEALTHY; }
  else if (aqi <= 200) { msg="Unhealthy. Avoid outdoor exercise."; tips=TIPS_UNHEALTHY; meals=MEALS_UNHEALTHY; exercises=EX_UNHEALTHY; }
  else { msg="Very unhealthy! Stay indoors and use purifiers if possible."; tips=TIPS_VERY_UNHEALTHY; meals=MEALS_VERY_UNHEALTHY; exercises=EX_VERY_UNHEALTHY; }

  sugEl.textContent = msg;

  const chosenTips = pickRandom(tips, 3);
  const chosenMeals = pickRandom(meals, 2);
  const chosenExercises = pickRandom(exercises, 1);

  let html = `<strong>Tips:</strong><ul style="margin:8px 0 12px 18px;">`;
  chosenTips.forEach(t => html += `<li>${t}</li>`);
  html += `</ul><strong>Meals to prefer:</strong><ul style="margin:8px 0 12px 18px;">`;
  chosenMeals.forEach(m => html += `<li>${m}</li>`);
  html += `</ul><strong>Exercise suggestion:</strong> ${chosenExercises[0]}`;
  tipEl.innerHTML = html;
}

/* ------------ Nearby stations list ------------ */
async function getTopStations(lat, lon) {
  try {
    const lat1 = lat - 1, lon1 = lon - 1, lat2 = lat + 1, lon2 = lon + 1;
    const res = await fetch(`https://api.waqi.info/map/bounds/?latlng=${lat1},${lon1},${lat2},${lon2}&token=${WAQI_TOKEN}`);
    const json = await res.json();
    if (json.status === "ok" && Array.isArray(json.data)) {
      let stations = json.data.filter(s => s && !isNaN(s.aqi))
        .sort((a,b) => b.aqi - a.aqi).slice(0, 10);
      renderStations(stations);
    } else {
      stationsList.textContent = "No station data nearby.";
    }
  } catch {
    stationsList.textContent = "Error fetching station data.";
  }
}

function renderStations(stations) {
  stationsList.innerHTML = "";
  if (!stations.length) {
    stationsList.textContent = "No station data found.";
    return;
  }
  const nearest = stations[0];
  nearestStationEl.textContent = `Your nearest AQI station is ${nearest.station?.name || "Unknown"}`;

  stations.forEach(s => {
    const item = document.createElement("div");
    item.className = "station-item";

    const left = document.createElement("div");
    left.style.flex = "1";
    const name = document.createElement("div");
    name.className = "station-name";
    name.textContent = s.station?.name || `Station ${s.uid}`;
    left.appendChild(name);

    const right = document.createElement("div");
    const aqiBox = document.createElement("div");
    aqiBox.className = "station-aqi " + getAqiClass(Number(s.aqi));
    aqiBox.textContent = s.aqi;
    right.appendChild(aqiBox);

    item.appendChild(left);
    item.appendChild(right);
    stationsList.appendChild(item);
  });
}

function getAqiClass(aqi) {
  if (aqi <= 50) return "aqi-good";
  if (aqi <= 100) return "aqi-moderate";
  return "aqi-unhealthy";
}

/* ------------ Demo fallback ------------ */
function showDemoData() {
  const demo = 70 + Math.floor(Math.random() * 120);
  aqiEl.textContent = `Demo AQI: ${demo}`;
  updateSuggestions(demo);
  stationsList.innerHTML = "<div style='opacity:.9'>Showing demo data. Live WAQI fetch failed or access blocked.</div>";
}

/* ✅ Attach search button listener */
if (searchBtn) {
  searchBtn.addEventListener("click", () => {
    const city = searchInput.value.trim();
    if (city) fetchAQIbyCity(city);
  });
}
