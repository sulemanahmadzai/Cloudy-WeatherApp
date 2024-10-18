// script.js

const input = document.querySelector("#search");
const button = document.querySelector("#btn1");
const apiKey = "6e48d6831753609515d6d8bb1e3fcd83"; // Replace with your OpenWeather API key
const geminiApiKey = "AIzaSyARzPEfRPn1Jk25rO0zb1hxnt8p2R9zlFs";
// Elements to display weather data
const cityNameEl = document.querySelector("#city-name");
const temperatureEl = document.querySelector("#temperature");
const humidityEl = document.querySelector("#humidity");
const windSpeedEl = document.querySelector("#wind-speed");
const descriptionEl = document.querySelector("#description");
const weatherIconEl = document.querySelector("#weather-icon");
const weatherDisplay = document.querySelector("#weather-display");

// Time element
const timeEl = document.querySelector("#time");

// Unit toggle elements
let isCelsius = true; // Default is Celsius
const unitToggle = document.getElementById("unit-toggle");
const unitLabel = document.getElementById("unit-label");
const unitSymbolEls = document.querySelectorAll(
  "#unit-symbol, #unit-symbol-table"
);

// Pagination variables
let currentPage = 1;
const rowsPerPage = 10;
let forecastData = []; // This will hold all forecast entries
let originalForecastData = []; // Original data to reset filters

// Elements for filters
const sortAscBtn = document.getElementById("sort-asc");
const sortDescBtn = document.getElementById("sort-desc");
const filterRainBtn = document.getElementById("filter-rain");
const highestTempBtn = document.getElementById("highest-temp");
const resetFiltersBtn = document.getElementById("reset-filters");

// Event listener to fetch weather data when the button is clicked
button.addEventListener("click", handleSearch);

// Event listener for unit toggle
unitToggle.addEventListener("change", handleUnitToggle);

// Event listeners for pagination buttons
document.getElementById("prev-page").addEventListener("click", handlePrevPage);
document.getElementById("next-page").addEventListener("click", handleNextPage);

// Event listeners for filters
sortAscBtn.addEventListener("click", handleSortAsc);
sortDescBtn.addEventListener("click", handleSortDesc);
filterRainBtn.addEventListener("click", handleFilterRain);
highestTempBtn.addEventListener("click", handleHighestTemp);
resetFiltersBtn.addEventListener("click", handleResetFilters);

// Real-time Validation for City Input
const searchInput = document.getElementById("search");
const searchError = document.getElementById("search-error");
searchInput.addEventListener("input", handleSearchInput);

// Call getWeatherByLocation when the page loads
window.onload = getWeatherByLocation;

// Function to handle search button click
function handleSearch() {
  const cityName = input.value.trim();
  if (cityName) {
    clearErrorMessage();
    fetchWeatherData(cityName);
    fetchForecastData(cityName);
  } else {
    displayErrorMessage("Please enter a city name.");
  }
}

// Function to handle unit toggle
function handleUnitToggle() {
  isCelsius = !isCelsius;
  unitLabel.textContent = isCelsius ? "Celsius" : "Fahrenheit";
  unitSymbolEls.forEach((el) => (el.textContent = isCelsius ? "C" : "F"));
  updateDisplayedTemperatures();
}

// Function to handle previous page button click
function handlePrevPage() {
  if (currentPage > 1) {
    currentPage--;
    displayForecastTable();
  }
}

// Function to handle next page button click
function handleNextPage() {
  const totalPages = Math.ceil(forecastData.length / rowsPerPage);
  if (currentPage < totalPages) {
    currentPage++;
    displayForecastTable();
  }
}

// Function to handle sort ascending button click
function handleSortAsc() {
  forecastData = [...originalForecastData].sort(
    (a, b) => a.main.temp - b.main.temp
  );
  currentPage = 1;
  displayForecastTable();
}

// Function to handle sort descending button click
function handleSortDesc() {
  forecastData = [...originalForecastData].sort(
    (a, b) => b.main.temp - a.main.temp
  );
  currentPage = 1;
  displayForecastTable();
}

// Function to handle filter rain button click
function handleFilterRain() {
  forecastData = originalForecastData.filter((item) =>
    item.weather[0].description.toLowerCase().includes("rain")
  );
  currentPage = 1;
  displayForecastTable();
}

// Function to handle highest temperature button click
function handleHighestTemp() {
  const highestTempItem = originalForecastData.reduce(
    (max, item) => (item.main.temp > max.main.temp ? item : max),
    originalForecastData[0]
  );
  forecastData = [highestTempItem];
  currentPage = 1;
  displayForecastTable();
}

// Function to handle reset filters button click
function handleResetFilters() {
  forecastData = [...originalForecastData];
  currentPage = 1;
  displayForecastTable();
}

// Function to handle dark mode toggle
function handleDarkModeToggle() {
  document.body.classList.toggle("dark-mode");
}

// Function to handle search input validation
function handleSearchInput() {
  searchError.textContent =
    searchInput.value.trim() === "" ? "City name cannot be empty." : "";
}

// Function to fetch current weather data
async function fetchWeatherData(cityName, latitude, longitude) {
  showLoadingSpinner();

  let api;
  if (latitude && longitude) {
    api = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${apiKey}`;
  } else if (cityName) {
    api = `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&units=metric&appid=${apiKey}`;
  } else {
    hideLoadingSpinner();
    return;
  }

  try {
    const response = await fetch(api);
    const data = await response.json();
    hideLoadingSpinner();

    if (data.cod === 200) {
      displayWeatherData(data);
    } else {
      displayErrorMessage("City not found. Please try again.");
    }
  } catch (error) {
    hideLoadingSpinner();
    console.error("Error fetching weather data:", error);
    displayErrorMessage("Error fetching weather data.");
  }
}

// Function to display weather data
function displayWeatherData(data) {
  weatherDisplay.style.display = "block";
  cityNameEl.textContent = data.name;
  temperatureEl.dataset.celsius = data.main.temp.toFixed(1);
  const temp = isCelsius
    ? data.main.temp.toFixed(1)
    : celsiusToFahrenheit(data.main.temp).toFixed(1);
  temperatureEl.textContent = `${temp}°${isCelsius ? "C" : "F"}`;
  humidityEl.textContent = `${data.main.humidity}%`;
  windSpeedEl.textContent = `${data.wind.speed} km/h`;
  descriptionEl.textContent = data.weather[0].description;

  // Update weather icon using OpenWeather icons
  const iconCode = data.weather[0].icon;
  weatherIconEl.src = `http://openweathermap.org/img/wn/${iconCode}@2x.png`;
  weatherIconEl.alt = data.weather[0].description;

  // Update background based on weather condition
  updateWidgetBackground(data.weather[0].main.toLowerCase());

  // Update time
  const localTime = new Date((data.dt + data.timezone) * 1000).toUTCString();
  timeEl.textContent = localTime.slice(-12, -7);
}

// Function to update widget background
function updateWidgetBackground(condition) {
  const weatherDisplayEl = document.getElementById("weather-display");
  const backgrounds = {
    clear: 'url("images/clear.jpg")',
    clouds: 'url("images/clouds.jpg")',
    rain: 'url("images/rain.jpg")',
    drizzle: 'url("images/rain.jpg")',
    thunderstorm: 'url("images/thunderstorm.jpg")',
    snow: 'url("images/snow.jpg")',
    mist: 'url("images/fog.jpg")',
    fog: 'url("images/fog.jpg")',
    haze: 'url("images/fog.jpg")',
    default: 'url("images/default.jpg")',
  };

  weatherDisplayEl.style.backgroundImage =
    backgrounds[condition] || backgrounds.default;
}

// Function to fetch 5-day weather forecast
async function fetchForecastData(cityName, latitude, longitude) {
  showLoadingSpinner();

  let api;
  if (latitude && longitude) {
    api = `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&units=metric&appid=${apiKey}`;
  } else if (cityName) {
    api = `https://api.openweathermap.org/data/2.5/forecast?q=${cityName}&units=metric&appid=${apiKey}`;
  } else {
    hideLoadingSpinner();
    return;
  }

  try {
    const response = await fetch(api);
    const data = await response.json();
    hideLoadingSpinner();

    if (data.cod === "200") {
      forecastData = [...data.list];
      originalForecastData = [...data.list];
      currentPage = 1;
      displayForecastTable();
      processChartData(forecastData);
    } else {
      displayErrorMessage("Error fetching forecast data.");
    }
  } catch (error) {
    hideLoadingSpinner();
    console.error("Error fetching forecast data:", error);
    displayErrorMessage("Error fetching forecast data.");
  }
}

// Function to display the forecast table with pagination
function displayForecastTable() {
  const tableBody = document.getElementById("forecast-table-body");
  const pageInfo = document.getElementById("page-info");
  const prevButton = document.getElementById("prev-page");
  const nextButton = document.getElementById("next-page");

  // Calculate total pages
  const totalPages = Math.ceil(forecastData.length / rowsPerPage);

  // Adjust button states
  prevButton.disabled = currentPage === 1;
  nextButton.disabled = currentPage === totalPages;

  // Update page info
  pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;

  // Clear existing table data
  tableBody.innerHTML = "";

  // Calculate start and end index
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedData = forecastData.slice(startIndex, endIndex);

  // Populate table with paginated data
  const fragment = document.createDocumentFragment();
  paginatedData.forEach((item) => {
    const row = document.createElement("tr");

    const dateTime = new Date(item.dt_txt).toLocaleString();
    const tempCelsius = item.main.temp;
    const temp = isCelsius ? tempCelsius : celsiusToFahrenheit(tempCelsius);
    const desc = item.weather[0].description;

    row.innerHTML = `
            <td>${dateTime}</td>
            <td class="temp-cell" data-celsius="${tempCelsius}">${temp.toFixed(
      1
    )}°${isCelsius ? "C" : "F"}</td>
            <td>${desc}</td>
        `;

    fragment.appendChild(row);
  });
  tableBody.appendChild(fragment);
}

// Function to process data for charts
function processChartData(list) {
  const dates = [];
  const temps = [];
  const weatherConditions = {};

  for (let i = 0; i < list.length; i += 8) {
    const forecastItem = list[i];
    const date = new Date(forecastItem.dt_txt).toLocaleDateString();
    const tempCelsius = forecastItem.main.temp;
    const temp = isCelsius ? tempCelsius : celsiusToFahrenheit(tempCelsius);
    const mainCondition = forecastItem.weather[0].main;

    dates.push(date);
    temps.push(temp);

    weatherConditions[mainCondition] =
      (weatherConditions[mainCondition] || 0) + 1;
  }

  createBarChart(dates, temps);
  createDoughnutChart(weatherConditions);
  createLineChart(dates, temps);
}

// Function to create Bar Chart
function createBarChart(dates, temps) {
  const ctx = document.getElementById("bar-chart").getContext("2d");
  if (window.barChartInstance) {
    window.barChartInstance.destroy();
  }
  window.barChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: dates,
      datasets: [
        {
          label: `Temperature (°${isCelsius ? "C" : "F"})`,
          data: temps,
          backgroundColor: "rgba(102, 126, 234, 0.6)",
          borderColor: "rgba(102, 126, 234, 1)",
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  });
}

// Function to create Doughnut Chart
function createDoughnutChart(weatherConditions) {
  const ctx = document.getElementById("doughnut-chart").getContext("2d");
  const labels = Object.keys(weatherConditions);
  const data = Object.values(weatherConditions);
  if (window.doughnutChartInstance) {
    window.doughnutChartInstance.destroy();
  }
  window.doughnutChartInstance = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: [
            "#667eea",
            "#764ba2",
            "#ff6b6b",
            "#f0e130",
            "#1abc9c",
          ],
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
    },
  });
}

// Function to create Line Chart
function createLineChart(dates, temps) {
  const ctx = document.getElementById("line-chart").getContext("2d");
  if (window.lineChartInstance) {
    window.lineChartInstance.destroy();
  }
  window.lineChartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: dates,
      datasets: [
        {
          label: `Temperature (°${isCelsius ? "C" : "F"})`,
          data: temps,
          fill: false,
          borderColor: "#ff6b6b",
          tension: 0.1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  });
}

// Function to update displayed temperatures
function updateDisplayedTemperatures() {
  // Update current weather temperature
  if (temperatureEl.textContent) {
    const tempCelsius = parseFloat(temperatureEl.dataset.celsius);
    const temp = isCelsius ? tempCelsius : celsiusToFahrenheit(tempCelsius);
    temperatureEl.textContent = `${temp.toFixed(1)}°${isCelsius ? "C" : "F"}`;
  }

  // Update forecast table temperatures
  const tempCells = document.querySelectorAll(".temp-cell");
  tempCells.forEach((cell) => {
    const tempCelsius = parseFloat(cell.dataset.celsius);
    const temp = isCelsius ? tempCelsius : celsiusToFahrenheit(tempCelsius);
    cell.textContent = `${temp.toFixed(1)}°${isCelsius ? "C" : "F"}`;
  });

  // Update charts
  if (forecastData.length > 0) {
    processChartData(forecastData);
  }
}

// Function to convert Celsius to Fahrenheit
function celsiusToFahrenheit(tempCelsius) {
  return (tempCelsius * 9) / 5 + 32;
}

// Function to show loading spinner
function showLoadingSpinner() {
  document.getElementById("loading-spinner").style.display = "block";
}

// Function to hide loading spinner
function hideLoadingSpinner() {
  document.getElementById("loading-spinner").style.display = "none";
}

// Function to display error message
function displayErrorMessage(message) {
  const errorMessageEl = document.getElementById("error-message");
  errorMessageEl.textContent = message;
  errorMessageEl.style.display = "block";
}

// Function to clear error message
function clearErrorMessage() {
  const errorMessageEl = document.getElementById("error-message");
  errorMessageEl.textContent = "";
  errorMessageEl.style.display = "none";
}

// Function to get weather and forecast based on user's current location
function getWeatherByLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((position) => {
      const { latitude, longitude } = position.coords;
      fetchWeatherData(null, latitude, longitude);
      fetchForecastData(null, latitude, longitude);
    }, showError);
  } else {
    displayErrorMessage("Geolocation is not supported by this browser.");
  }
}

// Error handling for geolocation
function showError(error) {
  const errorMessages = {
    [error.PERMISSION_DENIED]: "User denied the request for Geolocation.",
    [error.POSITION_UNAVAILABLE]: "Location information is unavailable.",
    [error.TIMEOUT]: "The request to get user location timed out.",
    [error.UNKNOWN_ERROR]: "An unknown error occurred.",
  };

  displayErrorMessage(
    errorMessages[error.code] || "An unknown error occurred."
  );
}
// Select DOM elements

// Chatbot input form
const chatbotForm = document.getElementById("chatbot-form");
const chatbotInput = document.getElementById("chatbot-input");
const chatbotMessages = document.getElementById("chatbot-messages");

// Weather-related keywords to detect weather queries
const weatherKeywords = [
  "weather",
  "temperature",
  "forecast",
  "humidity",
  "rain",
  "sunny",
  "cloudy",
  "wind",
  "snow",
  "climate",
];

// Event listener to handle chatbot form submission
chatbotForm.addEventListener("submit", function (event) {
  event.preventDefault();
  const userInput = chatbotInput.value.trim();

  // Add user message to chat
  addUserMessage(userInput);

  const isWeatherQuery = weatherKeywords.some((keyword) =>
    userInput.toLowerCase().includes(keyword)
  );

  if (isWeatherQuery) {
    // Handle weather queries
    handleWeatherQuery(userInput);
  } else {
    // Handle non-weather queries using Gemini API
    handleGeminiQuery(userInput);
  }

  // Clear input field
  chatbotInput.value = "";
});
// Function to handle weather queries
function handleWeatherQuery(userInput) {
  const cityMatch = userInput.match(/in\s([a-zA-Z\s]+)/i);
  let city = "";

  if (cityMatch && cityMatch[1]) {
    city = cityMatch[1].trim();
  }

  if (!city) {
    addBotMessage("Please specify a city to get the weather.");
    return;
  }

  // Check if the user input contains "forecast"
  if (userInput.toLowerCase().includes("forecast")) {
    // Fetch 5-day weather forecast data using OpenWeather API
    fetch(
      `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(
        city
      )}&appid=${apiKey}&units=metric`
    )
      .then((response) => response.json())
      .then((data) => {
        if (data.cod === "200") {
          let forecastMessage = `5-day forecast for ${city}:\n`;
          // Extract the forecast for the next 5 days (one entry per day)
          data.list.slice(0, 5).forEach((forecast) => {
            const dateTime = new Date(forecast.dt * 1000).toLocaleString();
            const temperature = forecast.main.temp;
            const weatherDescription = forecast.weather[0].description;
            forecastMessage += `${dateTime}: ${weatherDescription}, ${temperature}°C\n`;
          });
          addBotMessage(forecastMessage);
        } else {
          addBotMessage(
            `Sorry, I couldn't find forecast data for "${city}". Please check the city name and try again.`
          );
        }
      })
      .catch((error) => {
        addBotMessage("Error fetching forecast data: " + error);
      });
  } else {
    // Fetch current weather data using OpenWeather API
    fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
        city
      )}&appid=${apiKey}&units=metric`
    )
      .then((response) => response.json())
      .then((data) => {
        if (data.cod === 200) {
          const weatherDescription = data.weather[0].description;
          const temperature = data.main.temp;
          const humidity = data.main.humidity;

          addBotMessage(
            `The current weather in ${city} is ${weatherDescription} with a temperature of ${temperature}°C and humidity of ${humidity}%.`
          );
        } else {
          addBotMessage(
            `Sorry, I couldn't find weather data for "${city}". Please check the city name and try again.`
          );
        }
      })
      .catch((error) => {
        addBotMessage("Error fetching weather data: " + error);
      });
  }
}

// Function to handle non-weather queries using Gemini API
function handleGeminiQuery(userInput) {
  console.log(userInput);
  fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: userInput,
              },
            ],
          },
        ],
      }),
    }
  )
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      const botResponse =
        data.candidates?.[0]?.content?.parts?.[0]?.text ||
        "Sorry, I didn't understand that.";
      addBotMessage(botResponse);
    })
    .catch((error) => {
      addBotMessage("Error: " + error);
    });
}

// Function to add user message to chat
function addUserMessage(message) {
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("message", "user");
  messageDiv.innerHTML = `<p>${message}</p>`;
  chatbotMessages.appendChild(messageDiv);
  scrollToBottom(chatbotMessages);
}

// Function to add bot message to chat
function addBotMessage(message) {
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("message", "bot");
  messageDiv.innerHTML = `<p>${message}</p>`;
  chatbotMessages.appendChild(messageDiv);
  scrollToBottom(chatbotMessages);
}

// Function to scroll chat to bottom automatically
function scrollToBottom(container) {
  container.scrollTop = container.scrollHeight;
}

// Function to scroll to the top of the page
function scrollToTop(event) {
  event.preventDefault(); // Prevent the default behavior of the link
  window.scrollTo({
    top: 0,
    behavior: "smooth", // Smooth scrolling to the top
  });
}

// Function to scroll to the tables section
function scrollToTables(event) {
  event.preventDefault(); // Prevent default behavior of the link
  document.getElementById("forecast-table-container").scrollIntoView({
    behavior: "smooth", // Smooth scrolling to the tables section
  });
}

// Toggle the mobile menu
document
  .getElementById("menu-toggle")
  .addEventListener("click", function (event) {
    event.stopPropagation(); // Prevent click from bubbling up
    var mobileMenu = document.getElementById("mobile-menu");
    mobileMenu.classList.toggle("open");
  });

// Close the mobile menu when clicking outside
document.addEventListener("click", function (event) {
  var mobileMenu = document.getElementById("mobile-menu");
  var menuToggle = document.getElementById("menu-toggle");
  if (
    !menuToggle.contains(event.target) &&
    !mobileMenu.contains(event.target)
  ) {
    mobileMenu.classList.remove("open");
  }
});

// Get the chatbot container and toggle button
const chatbotContainer = document.getElementById("chatbot-container");
const chatbotToggle = document.getElementById("chatbot-toggle");

// Toggle chatbot window open and close
chatbotContainer.addEventListener("click", function () {
  chatbotContainer.classList.toggle("open");
  chatbotContainer.classList.remove("minimized"); // Ensure it's not minimized
});

// Minimize button functionality
chatbotToggle.addEventListener("click", function (event) {
  event.stopPropagation(); // Prevent event from bubbling up
  chatbotContainer.classList.toggle("minimized");
  chatbotContainer.classList.remove("open"); // Ensure it's closed
});
