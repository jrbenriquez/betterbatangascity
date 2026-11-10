/* Keyless public data for a static site. Missing data remains <placeholder>. */
(function () {
  'use strict';
  const config = window.SITE_CONFIG;
  const setText = (selector, value) => {
    const node = document.querySelector(selector);
    if (node) node.textContent = value;
  };
  function clock() {
    const now = new Date();
    setText(
      '.time-value',
      now.toLocaleTimeString('en-PH', {
        timeZone: config.timeZone,
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
      })
    );
    setText(
      '.date-value',
      now.toLocaleDateString('en-PH', {
        timeZone: config.timeZone,
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    );
  }
  async function weather() {
    setText('.weather-temp', '<placeholder>');
    const container = document.getElementById('weather-container');
    if (container) {
      container.textContent = '<placeholder>';
      container.setAttribute('aria-label', 'Weather in ' + config.location.name);
    }
    try {
      const params = new URLSearchParams({
        latitude: config.location.latitude,
        longitude: config.location.longitude,
        current: 'temperature_2m,relative_humidity_2m,wind_speed_10m',
        timezone: config.timeZone,
      });
      const response = await fetch(config.weatherEndpoint + '?' + params, {
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) throw new Error('Weather unavailable');
      const data = await response.json();
      const current = data.current;
      if (!current || !Number.isFinite(current.temperature_2m)) throw new Error('Missing weather');
      setText('.weather-temp', Math.round(current.temperature_2m) + '°C');
      if (container) {
        const widget = document.createElement('div');
        widget.className = 'weather-widget';
        const location = document.createElement('h3');
        location.textContent = config.location.name;
        const temp = document.createElement('p');
        temp.className = 'weather-current-temp';
        temp.textContent = Math.round(current.temperature_2m) + '°C';
        const details = document.createElement('p');
        const humidity = Number.isFinite(current.relative_humidity_2m)
          ? current.relative_humidity_2m + '%'
          : '<placeholder>';
        const wind = Number.isFinite(current.wind_speed_10m)
          ? current.wind_speed_10m + ' km/h'
          : '<placeholder>';
        details.textContent = 'Humidity: ' + humidity + ' · Wind: ' + wind;
        const source = document.createElement('p');
        source.textContent =
          'Open-Meteo · ' + current.time.replace('T', ' ') + ' (Philippine time)';
        widget.append(location, temp, details, source);
        container.replaceChildren(widget);
      }
    } catch (_) {
      /* Keep the explicit placeholder when public data is unavailable. */
    }
  }
  async function exchange() {
    setText('.rate-display', '<placeholder>');
    try {
      const response = await fetch(config.exchangeEndpoint, { signal: AbortSignal.timeout(10000) });
      if (!response.ok) return;
      const data = await response.json();
      const rates = data.rates;
      const currencies = ['USD', 'EUR', 'JPY', 'GBP', 'AED'];
      const valid = currencies.filter((c) => Number.isFinite(rates?.[c]) && rates[c] > 0);
      if (!valid.length) return;
      let i = 0;
      const show = () => {
        const currency = valid[i++ % valid.length];
        setText('.rate-display', '1 ' + currency + ' = ₱ ' + (1 / rates[currency]).toFixed(2));
      };
      show();
      setInterval(show, 5000);
    } catch (_) {
      /* No made-up exchange rate fallback. */
    }
  }
  function init() {
    if (!config || !document.querySelector('.info-bar')) return;
    clock();
    setInterval(clock, 1000);
    weather();
    exchange();
    setInterval(weather, 30 * 60 * 1000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
