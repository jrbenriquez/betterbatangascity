/* Empty states for data that must be supplied by the template owner. */
(function () {
  'use strict';
  function init() {
    document
      .querySelectorAll('.animate-on-scroll, .breakdown-initial')
      .forEach((el) => el.classList.add('visible'));
    const projects = document.getElementById('dpwh-projects-container');
    if (projects) projects.textContent = '<placeholder>';
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
