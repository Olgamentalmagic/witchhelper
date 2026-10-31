/**
 * Считает клики по любой ссылке .js-play-hit (кнопки Google Play).
 * Хранение: бесплатный Abacus API (без ключей).
 */
(function () {
  'use strict';

  var HIT_URL = 'https://abacus.jasoncameron.dev/hit/witchhelper/playclicks';
  var GET_URL = 'https://abacus.jasoncameron.dev/get/witchhelper/playclicks';
  var HIT_CLASS = 'js-play-hit';
  var REFRESH_MS = 30000;

  function isPlayStoreButton(el) {
    return !!(el && el.classList && el.classList.contains(HIT_CLASS));
  }

  function bump() {
    try {
      fetch(HIT_URL, {
        method: 'GET',
        mode: 'cors',
        cache: 'no-store',
        credentials: 'omit',
        keepalive: true,
      }).catch(function () {});
    } catch (e) {
      /* ignore */
    }
  }

  document.addEventListener(
    'click',
    function (ev) {
      var t = ev.target;
      if (!t || !t.closest) return;
      var a = t.closest('a');
      if (!isPlayStoreButton(a)) return;
      bump();
    },
    true
  );

  document.addEventListener(
    'auxclick',
    function (ev) {
      if (ev.button !== 1) return;
      var t = ev.target;
      if (!t || !t.closest) return;
      var a = t.closest('a');
      if (!isPlayStoreButton(a)) return;
      bump();
    },
    true
  );

  var badge = document.getElementById('play-stats-badge');
  var valueEl = document.getElementById('play-stats-value');
  if (!badge || !valueEl) return;

  badge.hidden = false;
  badge.title = 'Сколько раз нажали кнопку Google Play';

  function formatCount(n) {
    var num = Number(n);
    if (!isFinite(num)) return '—';
    try {
      return num.toLocaleString('ru-RU');
    } catch (e) {
      return String(num);
    }
  }

  function refresh() {
    fetch(GET_URL, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-store',
      credentials: 'omit',
    })
      .then(function (res) {
        if (!res.ok) throw new Error('http ' + res.status);
        return res.json();
      })
      .then(function (data) {
        if (data && typeof data.value !== 'undefined') {
          valueEl.textContent = formatCount(data.value);
          badge.classList.remove('play-stats--error');
        } else {
          throw new Error('bad payload');
        }
      })
      .catch(function () {
        valueEl.textContent = '—';
        badge.classList.add('play-stats--error');
      });
  }

  refresh();
  setInterval(refresh, REFRESH_MS);
})();
