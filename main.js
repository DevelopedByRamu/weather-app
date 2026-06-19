const API_KEY = "41b0b28d2d3f4a64375db34c3c244579";

const searchBtn = document.getElementById("search-btn");
const cityInput = document.getElementById("city");
let hourlyRefreshTimer = null;
let activeLocation = null;
let initialLocationHandled = false;

// Map weather conditions to local images
function getWeatherIcon(weatherMain) {
  const iconMap = {
    Clear: "img/sun.png",
    Sunny: "img/sun.png",
    Clouds: "img/cloudy.png",
    Cloudy: "img/cloudy.png",
    Overcast: "img/cloudy.png",
    Rain: "img/heavy-rain.png",
    Drizzle: "img/heavy-rain.png",
    Thunderstorm: "img/thunderstorm.png",
    Thunder: "img/thunder.png",
    Snow: "img/snowy.png",
    Mist: "img/mist.png",
    Smoke: "img/mist.png",
    Haze: "img/mist.png",
    Dust: "img/sand.png",
    Fog: "img/mist.png",
    Sand: "img/sand.png",
    Ash: "img/sand.png",
    Squall: "img/cloudy.png",
    Tornado: "img/thunderstorm.png",
  };
  return iconMap[weatherMain] || "img/sun.png";
}

function getBackgroundImage(weatherMain) {
  const backgroundMap = {
    Clear: "bg img/sunny background.jpg",
    Sunny: "bg img/sunny background.jpg",
    Clouds: "bg img/partly cloudly background.jpeg",
    Cloudy: "bg img/partly cloudly background.jpeg",
    Overcast: "bg img/overcast weather background.jpg",
    Rain: "bg img/heavy-rain gif.gif",
    Drizzle: "bg img/heavy-rain gif.gif",
    Thunderstorm: "bg img/thunderstorm gif.gif",
    Thunder: "bg img/thunderstorm gif.gif",
    Snow: "bg img/snowy weather.jpg",
    Mist: "bg img/misty background.jpg",
    Smoke: "bg img/partly cloudly background.jpeg",
    Haze: "bg img/misty background.jpg",
    Dust: "bg img/sandstorm.jpg",
    Fog: "bg img/misty background.jpg",
    Sand: "bg img/sandstorm.jpg",
    Ash: "bg img/partly cloudly background.jpeg",
    Squall: "bg img/Thunderstorm weather background.jpg",
    Tornado: "bg img/Thunderstorm weather background.jpg",
  };
  return backgroundMap[weatherMain] || "bg img/sunny background.jpg";
}

function updateContainerBackground(weatherMain) {
  const container = document.querySelector(".container");
  if (!container) return;

  const backgroundImage = getBackgroundImage(weatherMain);
  container.style.backgroundImage = `linear-gradient(
      rgba(17, 17, 17, 0.35),
      rgba(17, 17, 17, 0.35)
    ), url("${backgroundImage}")`;
  container.style.backgroundSize = "cover";
  container.style.backgroundPosition = "center";
  container.style.backgroundRepeat = "no-repeat";
}

async function fetchWeather(city) {
  const url = `https://api.openweathermap.org/data/2.5/weather?units=metric&q=${city}&appid=${API_KEY}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      alert("City not found. Please try again.");
      return;
    }
    const data = await response.json();
    updateWeatherDisplay(data);
    if (data.coord) {
      activeLocation = {
        lat: data.coord.lat,
        lon: data.coord.lon,
        timezoneOffset: (data.timezone || 0) * 1000,
      };
      scheduleHourlyRefresh(
        activeLocation.lat,
        activeLocation.lon,
        activeLocation.timezoneOffset,
      );
      fetchTodaysForecastByCoords(data.coord.lat, data.coord.lon, {
        temp: data.main?.temp,
        icon: data.weather?.[0]?.main,
        timezoneOffset: (data.timezone || 0) * 1000,
      });
    }
  } catch (error) {
    console.error("Error fetching weather:", error);
    alert("Error fetching weather data.");
  }
}

function updateWeatherDisplay(data) {
  document.getElementById("city-name").textContent =
    data.name || "Current Location";
  document.getElementById("temperature").textContent =
    `${Math.round(data.main.temp)}°C`;
  document.getElementById("weather-description").textContent =
    data.weather[0].description || data.weather[0].main;
  document.getElementById("wind-speed-value").textContent =
    `${Math.round(data.wind.speed)} km/h`;
  document.getElementById("humidity-value").textContent =
    `${data.main.humidity}%`;
  document.getElementById("pressure-value").textContent =
    `${data.main.pressure} mb`;

  const weatherDescription = (
    data.weather?.[0]?.description ||
    data.weather?.[0]?.main ||
    ""
  ).toLowerCase();

  if (
    data.main.temp < -1 &&
    (weatherDescription.includes("snowy") ||
      weatherDescription.includes("snow") ||
      weatherDescription.includes("clouds") ||
      weatherDescription.includes("cloudy") ||
      weatherDescription.includes("thunderstorm") ||
      weatherDescription.includes("rain"))
  ) {
    document.getElementById("advice").textContent =
      "It's pretty cold outside, you sure you want to go out? If you do, make sure to put on a jacket and stay warm.";
  }

  if (data.main.temp < 15) {
    document.getElementById("advice").textContent =
      "It's pretty cold outside, you might want to put on a jacket.";
  } else if (
    data.main.temp >= 1 &&
    data.main.temp < 29 &&
    weatherDescription.includes("rain")
  ) {
    document.getElementById("advice").textContent =
      "You might need to put on something warm.";
  } else if (
    data.main.temp >= 1 &&
    data.main.temp < 31 &&
    weatherDescription.includes("overcast")
  ) {
    document.getElementById("advice").textContent =
      "It's pretty cool today, you might want to wear something light but also bring a jacket just in case.";
  } else if (
    data.main.temp >= 1 &&
    data.main.temp < 30 &&
    weatherDescription.includes("Thunderstorm")
  ) {
    document.getElementById("advice").textContent =
      "It's quite stormy outside, you might want to stay indoors.";
  } else if (data.main.temp >= 15 && data.main.temp < 27) {
    document.getElementById("advice").textContent =
      "The weather is quite pleasant, you can go out and enjoy the day!";
  } else if (data.main.temp >= 30) {
    document.getElementById("advice").textContent =
      "It's quite hot outside, make sure to stay hydrated, use sunscreen, and dress lightly.";
  }
  //else if (data.weather[0].main.toLowerCase().includes("rain")) {//

  const weatherIcon = document.getElementById("weather-icon");
  if (weatherIcon && data.weather && data.weather[0]) {
    weatherIcon.src = getWeatherIcon(data.weather[0].main);
    updateContainerBackground(data.weather[0].main);
  }

  const sunriseValue = document.getElementById("sunrise-value");
  const sunsetValue = document.getElementById("sunset-value");
  if (sunriseValue && sunsetValue && data.sys) {
    const timezoneOffset = (data.timezone || 0) * 1000;
    const formatLocalTime = (timestamp) => {
      if (!timestamp) return "--:--";
      return new Intl.DateTimeFormat("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: "UTC",
      }).format(new Date(timestamp * 1000 + timezoneOffset));
    };

    sunriseValue.textContent = formatLocalTime(data.sys.sunrise);
    sunsetValue.textContent = formatLocalTime(data.sys.sunset);
  }
}

function formatForecastTime(dtText) {
  if (!dtText) return "--:--";
  const [, time] = dtText.split(" ");
  return time ? time.slice(0, 5) : "--:--";
}

function formatForecastHour(timestamp, timezoneOffset = 0) {
  if (!timestamp) return "--:--";

  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  }).format(new Date(timestamp * 1000 + timezoneOffset));
}

function formatForecastDay(timestamp, timezoneOffset = 0) {
  if (!timestamp) return "--";

  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(timestamp * 1000 + timezoneOffset));
}

function buildDailyForecastEntries(forecastList, timezoneOffset = 0) {
  const dailyEntries = new Map();

  forecastList.forEach((item) => {
    if (!item?.dt) return;

    const localizedDate = new Date(item.dt * 1000 + timezoneOffset);
    const dateKey = localizedDate.toISOString().slice(0, 10);
    const hour = localizedDate.getUTCHours();
    const existingEntry = dailyEntries.get(dateKey);

    if (
      !existingEntry ||
      Math.abs(hour - 12) < Math.abs(existingEntry.hour - 12)
    ) {
      dailyEntries.set(dateKey, { item, hour });
    }
  });

  return Array.from(dailyEntries.entries())
    .sort(([firstDate], [secondDate]) => firstDate.localeCompare(secondDate))
    .map(([, entry]) => entry.item)
    .slice(0, 5);
}

function updateFiveDayForecastCards(forecastData, timezoneOffset = 0) {
  const forecastSection = document.querySelector(".five-day-forecast");
  if (!forecastSection) return;

  const cards = Array.from(forecastSection.querySelectorAll(".forecast-day"));
  const dailyEntries = buildDailyForecastEntries(
    forecastData?.list || [],
    timezoneOffset,
  );

  cards.forEach((card, index) => {
    const entry = dailyEntries[index];
    const dayLabel = card.querySelector("h3");
    const icon = card.querySelector("img.weather-icon");
    const temperature = card.querySelector("p");

    if (!entry) {
      card.style.display = "none";
      return;
    }

    card.style.display = "flex";

    if (dayLabel) {
      dayLabel.textContent = formatForecastDay(entry.dt, timezoneOffset);
    }

    if (icon && entry.weather?.[0]) {
      icon.src = getWeatherIcon(entry.weather[0].main);
    }

    if (temperature && typeof entry.main?.temp === "number") {
      temperature.textContent = `${Math.round(entry.main.temp)}°C`;
    }
  });
}

function updateTodaysForecastSlots(currentWeather, forecastData) {
  const forecastSection = document.querySelector(".todays-forecast");
  if (!forecastSection) return;

  const times = Array.from(forecastSection.querySelectorAll("h2"));
  const icons = Array.from(
    forecastSection.querySelectorAll("img.weather-icon"),
  );
  const temperatures = Array.from(forecastSection.querySelectorAll("p"));
  const timezoneOffset = currentWeather?.timezoneOffset || 0;
  const localNow = new Date(Date.now() + timezoneOffset);
  const currentLocalHour = localNow.getUTCHours();
  const currentLocalDay = localNow.toISOString().slice(0, 10);

  const upcomingForecasts = (forecastData?.list || [])
    .filter((item) => {
      if (!item?.dt) return false;

      const localizedDate = new Date(item.dt * 1000 + timezoneOffset);
      return localizedDate.toISOString().slice(0, 10) === currentLocalDay;
    })
    .sort((firstItem, secondItem) => firstItem.dt - secondItem.dt)
    .filter((item) => {
      const localizedHour = new Date(
        item.dt * 1000 + timezoneOffset,
      ).getUTCHours();
      return localizedHour >= currentLocalHour;
    })
    .slice(0, Math.max(times.length - 1, 0));

  const forecastSlots = [
    {
      time: "Now",
      temp: currentWeather?.temp,
      icon: currentWeather?.icon,
    },
    ...upcomingForecasts.map((item) => ({
      time: formatForecastHour(item.dt, timezoneOffset),
      temp: item.main?.temp,
      icon: item.weather?.[0]?.main,
    })),
  ];

  forecastSlots.slice(0, times.length).forEach((slot, index) => {
    if (times[index]) {
      times[index].textContent = slot.time;
    }

    if (icons[index] && slot.icon) {
      icons[index].src = getWeatherIcon(slot.icon);
    }

    if (temperatures[index] && typeof slot.temp === "number") {
      temperatures[index].textContent = `${Math.round(slot.temp)}°C`;
    }
  });
}

async function fetchTodaysForecastByCoords(lat, lon, currentWeather) {
  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return console.error("Failed to fetch forecast data", response.status);
    }

    const data = await response.json();
    updateTodaysForecastSlots(currentWeather, data);
    updateFiveDayForecastCards(data, currentWeather?.timezoneOffset || 0);
  } catch (error) {
    console.error("Error fetching forecast data:", error);
  }
}

function scheduleHourlyRefresh(lat, lon, timezoneOffset = 0) {
  if (hourlyRefreshTimer) {
    clearTimeout(hourlyRefreshTimer);
  }

  const localNow = new Date(Date.now() + timezoneOffset);
  const nextHour = new Date(localNow);
  nextHour.setMinutes(0, 0, 0);
  nextHour.setHours(nextHour.getHours() + 1);

  const delay = Math.max(nextHour.getTime() - localNow.getTime(), 60 * 1000);

  hourlyRefreshTimer = setTimeout(async () => {
    await fetchWeatherByCoords(lat, lon);
    scheduleHourlyRefresh(lat, lon, timezoneOffset);
  }, delay);
}

function loadCurrentLocationWeather() {
  if (!navigator.geolocation) {
    console.warn("Geolocation is not supported by this browser.");
    fetchWeather("Thohoyandou");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      if (initialLocationHandled) return;
      initialLocationHandled = true;

      const { latitude, longitude } = position.coords;
      fetchWeatherByCoords(latitude, longitude);
    },
    (error) => {
      if (initialLocationHandled) return;
      initialLocationHandled = true;

      console.error("Error getting current location:", error);
      fetchWeather("Thohoyandou");
    },
    { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 },
  );
}

searchBtn.addEventListener("click", function () {
  const city = cityInput.value.trim();
  if (city) {
    fetchWeather(city);
    cityInput.value = "";
  }
});

cityInput.addEventListener("keypress", function (event) {
  if (event.key === "Enter") {
    const city = cityInput.value.trim();
    if (city) {
      fetchWeather(city);
      cityInput.value = "";
    }
  }
});

loadCurrentLocationWeather();

async function fetchWeatherByCoords(lat, lon) {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`;
  try {
    const res = await fetch(url);
    if (!res.ok)
      return console.error(
        "Failed to fetch weather for coordinates",
        res.status,
      );
    const data = await res.json();
    updateWeatherDisplay(data);
    activeLocation = {
      lat,
      lon,
      timezoneOffset: (data.timezone || 0) * 1000,
    };
    scheduleHourlyRefresh(lat, lon, activeLocation.timezoneOffset);
    fetchTodaysForecastByCoords(lat, lon, {
      temp: data.main?.temp,
      icon: data.weather?.[0]?.main,
      timezoneOffset: (data.timezone || 0) * 1000,
    });
  } catch (err) {
    console.error("Error fetching weather by coords:", err);
  }
}

// 5 day weather forecast (future implementation placeholder)
// const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}`;
