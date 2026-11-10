/* Public browser configuration; never put credentials in this file. */
window.SITE_CONFIG = Object.freeze({
  location: Object.freeze({
    name: 'Batangas City, Batangas',
    latitude: 13.7565,
    longitude: 121.0587,
  }),
  weatherEndpoint: 'https://api.open-meteo.com/v1/forecast',
  exchangeEndpoint: 'https://open.er-api.com/v6/latest/PHP',
  timeZone: 'Asia/Manila',
});
