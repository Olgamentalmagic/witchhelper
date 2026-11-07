/**
 * Счётчик тапов по кнопкам магазина.
 * Сразу ведёт в Play / App Store (без промежуточных страниц).
 * Учёт: img + fetch + XHR на pointerdown/touchstart — до ухода со страницы.
 */
(function () {
  'use strict';

  var REFRESH_MS = 15000;

  var counters = [
    {
      hitClass: 'js-play-hit',
      hitUrl: 'https://abacus.jasoncameron.dev/hit/witchhelper/playclicks',
      getUrl: 'https://abacus.jasoncameron.dev/get/witchhelper/playclicks',
      badgeId: 'play-stats-badge',
      valueId: 'play-stats-value',
      title: 'Тапы по кнопке Google Play',
    },
    {
      hitClass: 'js-appstore-hit',
      hitUrl: 'https://abacus.jasoncameron.dev/hit/witchhelper/appstoreclicks',
      getUrl: 'https://abacus.jasoncameron.dev/get/witchhelper/appstoreclicks',
      badgeId: 'appstore-stats-badge',
      valueId: 'appstore-stats-value',
      title: 'Тапы по кнопке App Store',
    },
  ];

  function ping(url) {
    try {
      var img = new Image();
      img.src = url + (url.indexOf('?') >= 0 ? '&' : '?') + 't=' + Date.now();
    } catch (e) {}
    try {
      fetch(url, {
        method: 'GET',
        mode: 'no-cors',
        cache: 'no-store',
        credentials: 'omit',
        keepalive: true,
      });
    } catch (e) {}
    try {
      var x = new XMLHttpRequest();
      x.open('GET', url, true);
      x.send();
    } catch (e) {}
  }

  function matchCounter(el) {
    if (!el || !el.classList) return null;
    for (var i = 0; i < counters.length; i++) {
      if (el.classList.contains(counters[i].hitClass)) return counters[i];
    }
    return null;
  }

  function onIntent(ev) {
    var t = ev.target;
    if (!t || !t.closest) return;
    var a = t.closest('a');
    var c = matchCounter(a);
    if (!c) return;
    // не дублировать на одном жесте pointerdown+click
    if (a.getAttribute('data-hit-sent') === '1') return;
    a.setAttribute('data-hit-sent', '1');
    ping(c.hitUrl);
    setTimeout(function () {
      try {
        a.removeAttribute('data-hit-sent');
      } catch (e) {}
    }, 2000);
  }

  document.addEventListener('pointerdown', onIntent, true);
  document.addEventListener('touchstart', onIntent, { capture: true, passive: true });
  document.addEventListener('click', onIntent, true);

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
