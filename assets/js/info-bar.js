/* Keyless public data for a static site. Missing data remains <placeholder>. */
(function () {
  'use strict';
  const config = window.SITE_CONFIG;
  let paused = false;
  const copy = (key, fallback) => window.TranslationEngine?.getTranslation(key) || fallback;
  function weatherError(container) {
    if (!container) return;
    container.classList.add('empty-state');
    container.replaceChildren();
    const heading = document.createElement('h3');
    heading.dataset.i18n = 'ui-weather-error';
    heading.textContent = copy('ui-weather-error', 'Weather is unavailable');
    const help = document.createElement('p');
    help.dataset.i18n = 'ui-weather-help';
    help.textContent = copy(
      'ui-weather-help',
      'Check your connection and retry. No estimated weather is shown.'
    );
    const value = document.createElement('span');
    value.className = 'template-placeholder';
    value.textContent = '<placeholder>';
    const retry = document.createElement('button');
    retry.type = 'button';
    retry.className = 'btn btn-secondary';
    retry.dataset.i18n = 'ui-weather-retry';
    retry.textContent = copy('ui-weather-retry', 'Retry weather');
    retry.addEventListener('click', weather);
    container.append(heading, help, value, retry);
  }
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
      container.classList.add('empty-state');
      container.textContent = 'Loading weather…';
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
        container.classList.remove('empty-state');
        container.replaceChildren(widget);
      }
    } catch (_) {
      weatherError(container);
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
      // Keep one stable rate rather than rotating information without a pause control.
    } catch (_) {
      /* No made-up exchange rate fallback. */
    }
  }
  function init() {
    if (!config || !document.querySelector('.info-bar')) return;
    clock();
    setInterval(() => {
      if (!paused) clock();
    }, 60000);
    weather();
    exchange();
    setInterval(
      () => {
        if (!paused) weather();
      },
      30 * 60 * 1000
    );
    const toggle = document.querySelector('[data-live-toggle]');
    toggle?.addEventListener('click', () => {
      paused = !paused;
      toggle.setAttribute('aria-pressed', String(paused));
      toggle.dataset.i18n = paused ? 'ui-resume' : 'ui-pause';
      toggle.textContent = copy(toggle.dataset.i18n, paused ? 'Resume updates' : 'Pause updates');
      if (!paused) clock();
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
