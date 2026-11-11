/* Progressive enhancements shared by every static page. No application framework. */
(function () {
  'use strict';
  const text = (key, fallback, params) =>
    window.TranslationEngine?.getTranslation(key, undefined, params) || fallback;
  let sequence = 0;
  function decorate(root = document.body) {
    if (!root || root.nodeType !== Node.ELEMENT_NODE) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (
        node.nodeValue.includes('<placeholder>') &&
        !node.parentElement.closest('script,style,textarea,option,svg,.template-placeholder')
      )
        nodes.push(node);
    }
    for (const node of nodes) {
      const fragment = document.createDocumentFragment();
      node.nodeValue.split(/(<placeholder>)/g).forEach((part) => {
        if (part === '<placeholder>') {
          const marker = document.createElement('span');
          marker.className = 'template-placeholder';
          marker.textContent = part;
          fragment.append(marker);
        } else fragment.append(document.createTextNode(part));
      });
      node.replaceWith(fragment);
    }
  }
  function setupTables() {
    document.querySelectorAll('main table').forEach((table) => {
      let wrapper = table.parentElement;
      if (!wrapper.classList.contains('scrollable-table')) {
        wrapper = document.createElement('div');
        wrapper.className = 'scrollable-table';
        table.before(wrapper);
        wrapper.append(table);
      }
      const hint = document.createElement('p');
      hint.className = 'table-scroll-hint';
      hint.dataset.i18n = 'ui-scroll-table';
      hint.id = 'table-hint-' + ++sequence;
      hint.textContent = text('ui-scroll-table', 'Scroll horizontally to read every column.');
      wrapper.before(hint);
      const update = () => {
        const overflowing = table.scrollWidth > wrapper.clientWidth + 1;
        hint.hidden = !overflowing;
        if (overflowing) {
          wrapper.tabIndex = 0;
          wrapper.setAttribute('role', 'region');
          wrapper.setAttribute(
            'aria-label',
            text('ui-table-region', 'Scrollable information table')
          );
          wrapper.setAttribute('aria-describedby', hint.id);
        } else {
          ['tabindex', 'role', 'aria-label', 'aria-describedby'].forEach((name) =>
            wrapper.removeAttribute(name)
          );
        }
      };
      new ResizeObserver(update).observe(wrapper);
      update();
    });
  }
  function setupFAQs() {
    document.querySelectorAll('button.faq-question').forEach((button) => {
      const item = button.closest('.faq-item');
      const answer = item?.querySelector('.faq-answer');
      if (!answer) return;
      answer.id ||= 'faq-answer-' + ++sequence;
      button.setAttribute('aria-controls', answer.id);
      answer.hidden = !item.classList.contains('active');
      button.setAttribute('aria-expanded', String(!answer.hidden));
      button.addEventListener('click', () => {
        const open = button.getAttribute('aria-expanded') !== 'true';
        button.setAttribute('aria-expanded', String(open));
        answer.hidden = !open;
        item.classList.toggle('active', open);
      });
    });
  }
  function setupTabs() {
    const group = document.querySelector('.cmci-tabs');
    if (group) {
      group.setAttribute('role', 'tablist');
      group.setAttribute(
        'aria-label',
        text('ui-competitiveness-tabs', 'Competitiveness indicators')
      );
      const buttons = [...group.querySelectorAll('button[data-pillar]')];
      const select = (button) =>
        buttons.forEach((tab) => {
          const panel = document.getElementById('panel-' + tab.dataset.pillar);
          const selected = tab === button;
          tab.id = 'tab-' + tab.dataset.pillar;
          tab.setAttribute('role', 'tab');
          tab.setAttribute('aria-selected', String(selected));
          tab.setAttribute('aria-controls', panel.id);
          tab.tabIndex = selected ? 0 : -1;
          tab.classList.toggle('active', selected);
          panel.setAttribute('role', 'tabpanel');
          panel.setAttribute('aria-labelledby', tab.id);
          panel.tabIndex = 0;
          panel.hidden = !selected;
          panel.classList.toggle('active', selected);
        });
      buttons.forEach((button, index) => {
        button.addEventListener('click', () => select(button));
        button.addEventListener('keydown', (event) => {
          const direction = document.documentElement.dir === 'rtl' ? -1 : 1;
          let next;
          if (event.key === 'ArrowRight')
            next = (index + direction + buttons.length) % buttons.length;
          if (event.key === 'ArrowLeft')
            next = (index - direction + buttons.length) % buttons.length;
          if (event.key === 'Home') next = 0;
          if (event.key === 'End') next = buttons.length - 1;
          if (next !== undefined) {
            event.preventDefault();
            select(buttons[next]);
            buttons[next].focus();
          }
        });
      });
      select(buttons[0]);
    }
    const legislative = document.querySelector('.leg-process-tabs');
    if (legislative) {
      legislative.setAttribute('role', 'tablist');
      legislative.setAttribute('aria-label', 'Legislative process');
      const tabs = [...legislative.querySelectorAll('button[data-tab]')];
      const select = (selected) =>
        tabs.forEach((tab) => {
          const panel = document.getElementById(tab.dataset.tab);
          const active = tab === selected;
          tab.id = 'process-tab-' + tab.dataset.tab;
          tab.setAttribute('role', 'tab');
          tab.setAttribute('aria-controls', panel.id);
          tab.setAttribute('aria-selected', String(active));
          tab.tabIndex = active ? 0 : -1;
          tab.classList.toggle('active', active);
          panel.setAttribute('role', 'tabpanel');
          panel.setAttribute('aria-labelledby', tab.id);
          panel.hidden = !active;
          panel.classList.toggle('active', active);
        });
      tabs.forEach((tab, index) => {
        tab.addEventListener('click', () => select(tab));
        tab.addEventListener('keydown', (event) => {
          let next;
          if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
          if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
          if (event.key === 'Home') next = 0;
          if (event.key === 'End') next = tabs.length - 1;
          if (next !== undefined) {
            event.preventDefault();
            select(tabs[next]);
            tabs[next].focus();
          }
        });
      });
      select(tabs[0]);
    }
    const periods = document.querySelector('.sre-period-toggle');
    if (periods && periods.textContent.includes('<placeholder>')) {
      periods.setAttribute('role', 'group');
      periods.setAttribute(
        'aria-label',
        text('ui-periods-pending', 'Fiscal periods awaiting verified records')
      );
      periods.querySelectorAll('button').forEach((button) => {
        button.disabled = true;
        ['role', 'aria-selected'].forEach((name) => button.removeAttribute(name));
      });
      const hint = document.createElement('p');
      hint.className = 'placeholder-help';
      hint.dataset.i18n = 'ui-periods-pending';
      hint.textContent = text('ui-periods-pending', 'Fiscal periods awaiting verified records');
      periods.after(hint);
    }
  }
  function setupSearch() {
    document
      .querySelectorAll('.search-autocomplete:not([data-interface-ready])')
      .forEach((dropdown) => {
        dropdown.dataset.interfaceReady = 'true';
        dropdown.setAttribute('role', 'region');
        const input = dropdown.parentElement.querySelector('input');
        const status = document.createElement('p');
        status.className = 'sr-only';
        status.setAttribute('role', 'status');
        status.setAttribute('aria-live', 'polite');
        dropdown.after(status);
        const update = () => {
          dropdown
            .querySelectorAll('[role=option]')
            .forEach((link) => link.removeAttribute('role'));
          const count = dropdown.querySelectorAll('.search-result-item').length;
          const next = count
            ? text('ui-search-count', 'Search results: ' + count + '.', { count })
            : '';
          if (status.textContent !== next) status.textContent = next;
        };
        new MutationObserver(update).observe(dropdown, { childList: true, subtree: true });
        dropdown.addEventListener('keydown', (event) => {
          const links = [...dropdown.querySelectorAll('a[href],button:not(:disabled)')];
          const index = links.indexOf(document.activeElement);
          if (['ArrowDown', 'ArrowUp'].includes(event.key) && links.length) {
            event.preventDefault();
            links[
              (index + (event.key === 'ArrowDown' ? 1 : -1) + links.length) % links.length
            ].focus();
          }
          if (event.key === 'Escape') {
            event.preventDefault();
            dropdown.style.display = 'none';
            input?.focus();
          }
        });
        update();
      });
  }
  function init() {
    document.addEventListener(
      'click',
      (event) => {
        if (event.target.closest('a[aria-disabled=true]')) {
          event.preventDefault();
          event.stopImmediatePropagation();
        }
      },
      true
    );
    const main = document.querySelector('main');
    if (main && !document.querySelector('.skip-link')) {
      main.id ||= 'main-content';
      const skip = document.createElement('a');
      skip.className = 'skip-link';
      skip.href = '#' + main.id;
      skip.textContent = text('ui-skip', 'Skip to main content');
      document.body.prepend(skip);
    }
    document.querySelectorAll('a[aria-disabled=true]').forEach((link) => {
      if (link.hasAttribute('aria-label')) link.setAttribute('role', 'link');
      link.title = text('ui-unavailable', 'Not configured yet');
    });
    setupTables();
    setupFAQs();
    setupTabs();
    setupSearch();
    decorate();
    new MutationObserver((records) => {
      for (const record of records)
        for (const node of record.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            decorate(node);
            if (node.matches('.search-autocomplete') || node.querySelector('.search-autocomplete'))
              setupSearch();
          } else if (
            node.nodeType === Node.TEXT_NODE &&
            node.parentElement &&
            !node.parentElement.closest('.template-placeholder')
          )
            decorate(node.parentElement);
        }
    }).observe(document.body, { childList: true, subtree: true });
    document.addEventListener('languageChanged', () => decorate());
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
