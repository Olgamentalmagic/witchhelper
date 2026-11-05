/**
 * Считает клики по .js-play-hit и .js-appstore-hit.
 * Хранение: бесплатный Abacus API (без ключей).
 */
(function () {
  'use strict';

  var REFRESH_MS = 30000;

  var counters = [
    {
      hitClass: 'js-play-hit',
      hitUrl: 'https://abacus.jasoncameron.dev/hit/witchhelper/playclicks',
      getUrl: 'https://abacus.jasoncameron.dev/get/witchhelper/playclicks',
      badgeId: 'play-stats-badge',
      valueId: 'play-stats-value',
      title: 'Сколько раз нажали кнопку Google Play',
    },
    {
      hitClass: 'js-appstore-hit',
      hitUrl: 'https://abacus.jasoncameron.dev/hit/witchhelper/appstoreclicks',
      getUrl: 'https://abacus.jasoncameron.dev/get/witchhelper/appstoreclicks',
      badgeId: 'appstore-stats-badge',
      valueId: 'appstore-stats-value',
      title: 'Сколько раз нажали кнопку App Store',
    },
  ];

  function bump(url) {
    try {
      fetch(url, {
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

  function matchCounter(el) {
    if (!el || !el.classList) return null;
    for (var i = 0; i < counters.length; i++) {
      if (el.classList.contains(counters[i].hitClass)) return counters[i];
    }
    return null;
  }

  document.addEventListener(
    'click',
    function (ev) {
      var t = ev.target;
      if (!t || !t.closest) return;
      var a = t.closest('a');
      var c = matchCounter(a);
      if (!c) return;
      bump(c.hitUrl);
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
      var c = matchCounter(a);
      if (!c) return;
      bump(c.hitUrl);
    },
    true
  );

  function formatCount(n) {
    var num = Number(n);
    if (!isFinite(num)) return '—';
    try {
      return num.toLocaleString('ru-RU');
    } catch (e) {
      return String(num);
    }
  }

  function wireBadge(c) {
    var badge = document.getElementById(c.badgeId);
    var valueEl = document.getElementById(c.valueId);
    if (!badge || !valueEl) return;

    badge.hidden = false;
    badge.title = c.title;

    function refresh() {
      fetch(c.getUrl, {
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
            badge.classList.remove('store-stats--error');
          } else {
            throw new Error('bad payload');
          }
        })
        .catch(function () {
          valueEl.textContent = '—';
          badge.classList.add('store-stats--error');
        });
    }

    refresh();
    setInterval(refresh, REFRESH_MS);
  }

  for (var i = 0; i < counters.length; i++) {
    wireBadge(counters[i]);
  }
})();
