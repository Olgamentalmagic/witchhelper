/**
 * Тап по кнопке магазина → сразу приложение Play / App Store с установкой.
 * Android: intent:// → market:// → https
 * iOS: itms-apps:// → https
 * Десктоп: обычный https
 * Счётчик: ping на pointerdown/click до ухода.
 */
(function () {
  'use strict';

  var REFRESH_MS = 15000;
  var PLAY_HTTPS = 'https://play.google.com/store/apps/details?id=ru.witchhelper.app';
  var PLAY_MARKET = 'market://details?id=ru.witchhelper.app';
  // Intent надёжнее в WebView Facebook/Instagram, чем голый market://
  var PLAY_INTENT =
    'intent://details?id=ru.witchhelper.app#Intent;scheme=market;package=com.android.vending;' +
    'S.browser_fallback_url=' +
    encodeURIComponent(PLAY_HTTPS) +
    ';end';
  var IOS_HTTPS = 'https://apps.apple.com/ru/app/witch-helper/id6828506257';
  var IOS_ITMS = 'itms-apps://apps.apple.com/ru/app/witch-helper/id6828506257';

  var counters = [
    {
      hitClass: 'js-play-hit',
      hitUrl: 'https://abacus.jasoncameron.dev/hit/witchhelper/playclicks',
      getUrl: 'https://abacus.jasoncameron.dev/get/witchhelper/playclicks',
      badgeId: 'play-stats-badge',
      valueId: 'play-stats-value',
      title: 'Тапы по кнопке Google Play',
      kind: 'play',
    },
    {
      hitClass: 'js-appstore-hit',
      hitUrl: 'https://abacus.jasoncameron.dev/hit/witchhelper/appstoreclicks',
      getUrl: 'https://abacus.jasoncameron.dev/get/witchhelper/appstoreclicks',
      badgeId: 'appstore-stats-badge',
      valueId: 'appstore-stats-value',
      title: 'Тапы по кнопке App Store',
      kind: 'ios',
    },
  ];

  function ua() {
    return navigator.userAgent || '';
  }
  function isAndroid() {
    return /Android/i.test(ua());
  }
  function isIOS() {
    return (
      /iPhone|iPad|iPod/i.test(ua()) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    );
  }

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

  function openNative(kind) {
    if (kind === 'play' && isAndroid()) {
      // Сначала intent (FB/Instagram WebView), затем market, иначе https
      window.location.href = PLAY_INTENT;
      setTimeout(function () {
        try {
          window.location.href = PLAY_MARKET;
        } catch (e) {}
      }, 400);
      setTimeout(function () {
        window.location.href = PLAY_HTTPS;
      }, 1200);
      return true;
    }
    if (kind === 'ios' && isIOS()) {
      window.location.href = IOS_ITMS;
      setTimeout(function () {
        window.location.href = IOS_HTTPS;
      }, 900);
      return true;
    }
    return false;
  }

  function onIntent(ev) {
    var t = ev.target;
    if (!t || !t.closest) return;
    var a = t.closest('a');
    var c = matchCounter(a);
    if (!c) return;

    // не дублировать ping на pointerdown+click одного жеста
    if (a.getAttribute('data-hit-sent') !== '1') {
      a.setAttribute('data-hit-sent', '1');
      ping(c.hitUrl);
      setTimeout(function () {
        try {
          a.removeAttribute('data-hit-sent');
        } catch (e) {}
      }, 2000);
    }

    // Только на click/pointerup-эквивалент открываем магазин (не на touchstart)
    if (ev.type !== 'click') return;

    if (openNative(c.kind)) {
      ev.preventDefault();
    }
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
