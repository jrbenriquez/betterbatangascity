/* Records are rendered as text, including literal <placeholder> values. */
document.addEventListener('DOMContentLoaded', async function () {
  const bodies = ['resolution-table-body', 'resolution-table-body-2026']
    .map((id) => document.getElementById(id))
    .filter(Boolean);
  if (!bodies.length) return;
  function render(records) {
    bodies.forEach((body) => {
      body.replaceChildren();
      (records.length ? records : [{}]).forEach((record) => {
        const row = document.createElement('tr');
        ['resolutionNo', 'title', 'sessionDate'].forEach((field) => {
          const cell = document.createElement('td');
          cell.textContent = record[field] || '<placeholder>';
          row.appendChild(cell);
        });
        body.appendChild(row);
      });
    });
  }
  render([]);
  try {
    const response = await fetch('../data/resolutions.json');
    if (!response.ok) return;
    const data = await response.json();
    render(data.resolutions || []);
  } catch (_) {
    /* Keep the placeholder. */
  }
});
