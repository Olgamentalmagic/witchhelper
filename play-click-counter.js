/**
 * Счётчик кликов по внешней кнопке «Открыть в Google Play».
 * Хранение: публичный REST API https://counterapi.com/ (без ключей).
 * Это клики по ссылке, а не подтверждённые установки.
 */
(function () {
  'use strict';

  var NS = 'olgamentalmagic.github.io';
  var ACTION = 'click';
  var KEY = 'witchhelper_google_play';
  var API_BASE =
    'https://counterapi.com/api/' +
    encodeURIComponent(NS) +
    '/' +
    encodeURIComponent(ACTION) +
    '/' +
    encodeURIComponent(KEY);
  var PIXEL_BASE = 'https://counterapi.com/pixel.gif';
  var PLAY_HOST = 'play.google.com';
  var PLAY_PATH = '/store/apps/details';
  var PLAY_ID = 'ru.witchhelper.app';
  var REFRESH_MS = 30000;

  function isTrackedPlayLink(anchor) {
    if (!anchor || !anchor.getAttribute) return false;
    var href = anchor.getAttribute('href') || '';
    // Якорь #download и прочие внутренние ссылки не считаем.
    if (!href || href.charAt(0) === '#') return false;
    try {
      var u = new URL(href, window.location.href);
      if (u.hostname !== PLAY_HOST) return false;
      if (u.pathname.indexOf(PLAY_PATH) !== 0) return false;
      return u.searchParams.get('id') === PLAY_ID;
    } catch (e) {
      return false;
    }
  }

  /** Инкремент: неблокирующий fetch + keepalive; запасной pixel при сбое. */
  function bumpClick() {
    var ok = false;
    try {
      var p = fetch(API_BASE, {
        method: 'GET',
        mode: 'cors',
        cache: 'no-store',
        credentials: 'omit',
        keepalive: true,
      });
      if (p && typeof p.then === 'function') {
        p.then(function (res) {
          if (res && res.ok) return;
          firePixel();
        }).catch(function () {
          firePixel();
        });
        ok = true;
      }
    } catch (e) {
      ok = false;
    }
    if (!ok) firePixel();
  }

  function firePixel() {
    try {
      var img = new Image();
      img.referrerPolicy = 'no-referrer';
      img.src =
        PIXEL_BASE +
        '?ns=' +
        encodeURIComponent(NS) +
        '&action=' +
        encodeURIComponent(ACTION) +
        '&key=' +
        encodeURIComponent(KEY) +
        '&_=' +
        Date.now();
    } catch (e) {
      /* ignore */
    }
  }

  // Делегирование: срабатывает и при target=_blank / средней кнопке.
  document.addEventListener(
    'click',
    function (ev) {
      var t = ev.target;
      if (!t || !t.closest) return;
      var a = t.closest('a');
      if (!isTrackedPlayLink(a)) return;
      bumpClick();
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
      if (!isTrackedPlayLink(a)) return;
      bumpClick();
    },
    true
  );

  // —— Бейдж только при ?stats=1 ——
  var params = new URLSearchParams(window.location.search);
  if (params.get('stats') !== '1') return;

  var badge = document.getElementById('play-stats-badge');
  var valueEl = document.getElementById('play-stats-value');
  if (!badge || !valueEl) return;

  badge.hidden = false;
  badge.title = 'Общее число кликов по «Открыть в Google Play» (не установки)';

  function formatCount(n) {
    var num = Number(n);
    if (!isFinite(num)) return '—';
    try {
      return num.toLocaleString('ru-RU');
    } catch (e) {
      return String(num);
    }
  }

  function applyValue(n) {
    valueEl.textContent = formatCount(n);
    badge.classList.remove('play-stats--error');
  }

  function applyError() {
    valueEl.textContent = '—';
    badge.classList.add('play-stats--error');
  }

  function readViaFetch() {
    return fetch(API_BASE + '?readOnly=true', {
      method: 'GET',
      mode: 'cors',
      cache: 'no-store',
      credentials: 'omit',
    }).then(function (res) {
      if (!res.ok) throw new Error('http ' + res.status);
      return res.json();
    });
  }

  function readViaJsonp() {
    return new Promise(function (resolve, reject) {
      var cbName = '__whPlayCnt_' + Date.now();
      var settled = false;
      var timer = setTimeout(function () {
        cleanup();
        reject(new Error('jsonp timeout'));
      }, 12000);

      function cleanup() {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        try {
          delete window[cbName];
        } catch (e) {
          window[cbName] = undefined;
        }
        if (script.parentNode) script.parentNode.removeChild(script);
      }

      window[cbName] = function (data) {
        cleanup();
        resolve(data);
      };

      var script = document.createElement('script');
      script.async = true;
      script.src = API_BASE + '?readOnly=true&callback=' + cbName;
      script.onerror = function () {
        cleanup();
        reject(new Error('jsonp error'));
      };
      document.head.appendChild(script);
    });
  }

  function refresh() {
    readViaFetch()
      .catch(function () {
        return readViaJsonp();
      })
      .then(function (data) {
        if (data && typeof data.value !== 'undefined') {
          applyValue(data.value);
        } else {
          throw new Error('bad payload');
        }
      })
      .catch(function () {
        applyError();
      });
  }

  refresh();
  setInterval(refresh, REFRESH_MS);
})();
