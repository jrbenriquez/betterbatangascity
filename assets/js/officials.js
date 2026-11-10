/* Render names as text so literal placeholders and future content are safe. */
document.addEventListener('DOMContentLoaded', async function () {
  const container = document.getElementById('officials-container');
  if (!container) return;
  container.textContent = '<placeholder>';
  try {
    const response = await fetch('../data/officials.json');
    if (!response.ok) return;
    const data = await response.json();
    const cards = [data.mayor, data.vice_mayor, ...(data.councilors || [])]
      .filter(Boolean)
      .map((official) => {
        const card = document.createElement('article');
        card.className = 'card text-center';
        const name = document.createElement('h3');
        name.textContent = official.name;
        const title = document.createElement('p');
        title.textContent = official.title;
        card.append(name, title);
        return card;
      });
    container.replaceChildren(...cards);
  } catch (_) {
    /* Keep the placeholder. */
  }
});
