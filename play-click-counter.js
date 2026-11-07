/**
 * Показывает счётчики Abacus.
 * Сами клики считаются на промежуточных страницах go/play.html и go/ios.html
 * (так надёжнее во Facebook/Instagram WebView).
 */
(function () {
  'use strict';

  var REFRESH_MS = 15000;

  var counters = [
    {
      getUrl: 'https://abacus.jasoncameron.dev/get/witchhelper/playclicks',
      badgeId: 'play-stats-badge',
      valueId: 'play-stats-value',
      title: 'Клики по кнопке Google Play (через go/play)',
    },
    {
      getUrl: 'https://abacus.jasoncameron.dev/get/witchhelper/appstoreclicks',
      badgeId: 'appstore-stats-badge',
      valueId: 'appstore-stats-value',
      title: 'Клики по кнопке App Store (через go/ios)',
    },
  ];

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
