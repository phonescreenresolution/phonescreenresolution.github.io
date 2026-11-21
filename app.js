/* Phone Screen Resolution tool — live detection, device visual, PPI calculator, copy details. */
(function () {
  /* Mobile menu (hamburger) — runs on every page, even without the tool. */
  var menuBtn = document.getElementById('menuBtn');
  var mainNav = document.querySelector('nav.main');
  if (menuBtn && mainNav) {
    menuBtn.addEventListener('click', function () {
      var open = mainNav.classList.toggle('open');
      menuBtn.classList.toggle('open', open);
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    mainNav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        mainNav.classList.remove('open');
        menuBtn.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
      });
    });
  }

  var $ = function (id) { return document.getElementById(id); };
  var tool = $('tool');
  if (!tool) return; // not the tool page

  function gcd(a, b) { return b === 0 ? a : gcd(b, a % b); }
  function fmt(n) { return n.toLocaleString('en-US'); }

  function readValues() {
    var dpr = window.devicePixelRatio || 1;
    var cssW = window.screen.width, cssH = window.screen.height;
    var sw = Math.floor(cssW * dpr), sh = Math.floor(cssH * dpr);
    var vw = window.innerWidth, vh = window.innerHeight;
    var availH = window.screen.availHeight || cssH;
    var taskCss = Math.max(0, cssH - availH);
    var depth = window.screen.colorDepth || 24;
    var portrait = sh >= sw;
    var g = gcd(sw, sh);
    var shortSide = Math.min(sw, sh), longSide = Math.max(sw, sh);
    var cls = shortSide >= 2160 ? '2160p · 4K UHD'
      : shortSide >= 1440 ? '1440p · QHD'
      : shortSide >= 1080 ? '1080p · FHD'
      : shortSide >= 720 ? '720p · HD' : 'SD';
    if ((cls.indexOf('FHD') !== -1 || cls.indexOf('QHD') !== -1) && longSide / shortSide > 2) cls += '+';
    return {
      sw: sw, sh: sh, cssW: cssW, cssH: cssH, vw: vw, vh: vh,
      dpr: dpr, taskCss: taskCss, depth: depth,
      depthPerChannel: (depth % 3 === 0) ? depth / 3 : depth,
      orient: portrait ? 'Portrait' : 'Landscape',
      aspect: (sw / g) + ' : ' + (sh / g),
      cls: cls
    };
  }

  /* Device visual: your screen as a glowing device. The browser window and
     taskbar inside it are sized live, to scale (physical pixels). */
  function buildDevice(v) {
    var frame = $('deviceFrame');
    var stage = frame.parentElement;
    var maxW = Math.min(400, Math.max(200, (stage.clientWidth || 800) - 8));
    var maxH = 340;
    var scale = Math.min(maxW / v.sw, maxH / v.sh);
    var frameH = Math.round(v.sh * scale);
    frame.style.width = Math.round(v.sw * scale) + 'px';
    frame.style.height = frameH + 'px';
    var winW = Math.min(v.sw, Math.round(v.vw * v.dpr));
    var winH = Math.min(v.sh, Math.round(v.vh * v.dpr));
    var win = $('deviceWindow');
    win.style.width = (winW / v.sw * 100) + '%';
    win.style.height = (winH / v.sh * 100) + '%';
    var winText = 'Browser window ' + v.vw + ' × ' + v.vh;
    $('deviceWinLabel').textContent = winText;
    $('legendWindow').textContent = winText;
    var taskPhys = Math.round(v.taskCss * v.dpr);
    var taskbar = $('deviceTaskbar');
    var legendTask = $('legendTask');
    if (taskPhys > 0) {
      taskbar.style.display = 'block';
      taskbar.style.height = Math.max(8, Math.round(taskPhys * scale)) + 'px';
      legendTask.style.display = '';
      legendTask.textContent = 'Taskbar ' + fmt(v.taskCss) + ' px';
    } else {
      taskbar.style.display = 'none';
      legendTask.style.display = 'none';
    }
    $('legendDpr').textContent = 'Pixel ratio ' + v.dpr + '×';
  }

  var refreshHz = null;
  function measureRefresh() {
    var frames = 0, start = performance.now();
    function tick() {
      frames++;
      var el = performance.now() - start;
      if (el >= 1000) {
        refreshHz = Math.round(frames / (el / 1000));
        var s = $('sRefresh');
        if (s) s.textContent = refreshHz + ' Hz';
      } else {
        requestAnimationFrame(tick);
      }
    }
    requestAnimationFrame(tick);
  }

  function render() {
    var v = readValues();
    buildDevice(v);
    $('physRes').textContent = v.sw + ' × ' + v.sh;
    $('classBadge').textContent = v.cls;
    $('aspectBadge').textContent = v.aspect;
    $('orientPill').textContent = v.orient;
    $('sTotal').textContent = fmt(v.sw * v.sh);
    $('sLogical').textContent = v.cssW + ' × ' + v.cssH;
    $('sWindow').textContent = v.vw + ' × ' + v.vh;
    $('sDpr').textContent = v.dpr + '×';
    $('sDepth').textContent = v.depthPerChannel + '-bit';
    $('sRefresh').textContent = refreshHz ? refreshHz + ' Hz' : '—';
    calcPpi();
  }

  function calcPpi() {
    var v = readValues();
    var diag = parseFloat($('diagInput').value);
    var out = $('ppiResult');
    if (!diag || diag <= 0) { out.textContent = '— PPI'; return; }
    var ppi = Math.sqrt(v.sw * v.sw + v.sh * v.sh) / diag;
    out.textContent = Math.round(ppi) + ' PPI';
  }

  $('refreshBtn').addEventListener('click', function () { render(); measureRefresh(); });
  $('diagInput').addEventListener('input', calcPpi);
  $('ppiBtn').addEventListener('click', calcPpi);

  $('copyBtn').addEventListener('click', function () {
    var v = readValues();
    var diag = parseFloat($('diagInput').value);
    var ppi = (!diag || diag <= 0) ? '—' : Math.round(Math.sqrt(v.sw * v.sw + v.sh * v.sh) / diag) + ' PPI';
    var text = 'Screen resolution: ' + v.sw + ' x ' + v.sh + ' px (physical)\n' +
      'Logical resolution: ' + v.cssW + ' x ' + v.cssH + ' CSS px\n' +
      'Browser window: ' + v.vw + ' x ' + v.vh + ' CSS px\n' +
      'Taskbar: ' + v.taskCss + ' CSS px\n' +
      'Pixel ratio (DPR): ' + v.dpr + '\n' +
      'Refresh rate: ' + (refreshHz ? refreshHz + ' Hz' : '—') + '\n' +
      'Color depth: ' + v.depthPerChannel + '-bit\n' +
      'Orientation: ' + v.orient + '\n' +
      'Aspect ratio: ' + v.aspect + '\n' +
      'Total pixels: ' + fmt(v.sw * v.sh) + '\n' +
      'PPI (' + diag + ' inch screen): ' + ppi;
    var done = function () {
      var msg = $('copiedMsg');
      msg.hidden = false;
      setTimeout(function () { msg.hidden = true; }, 2000);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, done);
    } else {
      var ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch (e) {}
      ta.remove();
      done();
    }
  });

  // Live updates when the screen rotates or the window resizes.
  window.addEventListener('resize', render);
  window.addEventListener('orientationchange', function () { setTimeout(render, 300); });

  render();
  measureRefresh();
})();
