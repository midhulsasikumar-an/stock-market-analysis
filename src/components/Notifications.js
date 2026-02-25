// Threshold values (statistical)
const thresholds = {
  GOOGL: 140,
  TSLA: 240,
  AMZN: 165,
  NVDA: 600
};

let notifications = [];

// Fetch market prices from API
async function fetchMarketPrices() {
  try {
    const response = await fetch("https://api.example.com/market-prices");
    const markets = await response.json(); // array of stocks

    checkThresholds(markets);
  } catch (error) {
    console.error("Error fetching prices:", error);
  }
}

// Compare live price with threshold
function checkThresholds(markets) {
  markets.forEach(stock => {
    const symbol = stock.symbol;
    const price = stock.price;

    if (thresholds[symbol] && price > thresholds[symbol]) {
      const diff = (price - thresholds[symbol]).toFixed(2);
      const message = `${symbol} crossed threshold by $${diff}`;

      if (!notifications.includes(message)) {
        notifications.push(message);
        alert(message);
        updateIcon();
      }
    }
  });
}

// Update navbar icon
function updateIcon() {
  const badge = document.getElementById("notificationCount");
  badge.style.display = "inline";
  badge.innerText = notifications.length;
}

// Click notification icon → show messages
document.getElementById("notificationIcon").addEventListener("click", () => {
  if (notifications.length === 0) {
    alert("No notifications");
  } else {
    alert(notifications.join("\n"));
  }
});

// Auto check every 10 seconds
setInterval(fetchMarketPrices, 10000);
