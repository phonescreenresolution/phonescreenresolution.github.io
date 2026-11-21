/* Phone Screen Resolution tool — live detection, screen diagram, PPI calculator, copy details. */
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
  var diagram = $('diagram');
  if (!diagram) return; // not the tool page

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

  /* Screen diagram: outline in physical pixels, window + taskbar in logical pixels. */
  function buildDiagram(v) {
    var sw = v.sw, sh = v.sh, dpr = v.dpr;
    var winW = Math.min(sw, Math.round(v.vw * dpr));
    var winH = Math.min(sh, Math.round(v.vh * dpr));
    var taskPhys = Math.round(v.taskCss * dpr);
    var padL = 110, padT = 96, padR = 36;
    var padB = taskPhys > 0 ? 108 : 62;
    var W = padL + sw + padR, H = padT + sh + padB;
    var fs = Math.max(46, Math.round(sw * 0.024));
    var fsSmall = Math.max(38, Math.round(sw * 0.018));
    var s = '';
    s += '<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Screen diagram: ' + fmt(sw) + ' by ' + fmt(sh) + ' physical pixels">';
    s += '<defs><pattern id="hatch" width="16" height="16" patternTransform="rotate(45)" patternUnits="userSpaceOnUse"><rect width="16" height="16" fill="#f3f0ff"/><line x1="0" y1="0" x2="0" y2="16" stroke="#c9b8f5" stroke-width="5"/></pattern></defs>';
    /* Top dimension line: physical width. */
    var ty = padT - 36;
    s += '<line x1="' + padL + '" y1="' + ty + '" x2="' + (padL + sw) + '" y2="' + ty + '" stroke="#8a7fb8" stroke-width="2"/>';
    s += '<line x1="' + padL + '" y1="' + (ty - 9) + '" x2="' + padL + '" y2="' + (ty + 9) + '" stroke="#8a7fb8" stroke-width="2"/>';
    s += '<line x1="' + (padL + sw) + '" y1="' + (ty - 9) + '" x2="' + (padL + sw) + '" y2="' + (ty + 9) + '" stroke="#8a7fb8" stroke-width="2"/>';
    s += '<text x="' + (padL + sw / 2) + '" y="' + (ty - 16) + '" text-anchor="middle" font-size="' + fs + '" fill="#4b4566">' + sw + ' px</text>';
    /* Left dimension line: physical height. */
    var lx = padL - 36;
    s += '<line x1="' + lx + '" y1="' + padT + '" x2="' + lx + '" y2="' + (padT + sh) + '" stroke="#8a7fb8" stroke-width="2"/>';
    s += '<line x1="' + (lx - 9) + '" y1="' + padT + '" x2="' + (lx + 9) + '" y2="' + padT + '" stroke="#8a7fb8" stroke-width="2"/>';
    s += '<line x1="' + (lx - 9) + '" y1="' + (padT + sh) + '" x2="' + (lx + 9) + '" y2="' + (padT + sh) + '" stroke="#8a7fb8" stroke-width="2"/>';
    s += '<text x="' + (lx - 18) + '" y="' + (padT + sh / 2) + '" text-anchor="middle" font-size="' + fs + '" fill="#4b4566" transform="rotate(-90 ' + (lx - 18) + ' ' + (padT + sh / 2) + ')">' + sh + ' px</text>';
    /* Screen outline (physical pixels). */
    s += '<rect x="' + padL + '" y="' + padT + '" width="' + sw + '" height="' + sh + '" fill="#ffffff" stroke="#7c3aed" stroke-width="3" stroke-dasharray="12 8"/>';
    /* Browser window (logical pixels, scaled by DPR). */
    s += '<rect x="' + padL + '" y="' + padT + '" width="' + winW + '" height="' + winH + '" fill="#ffffff" stroke="#c9b8f5" stroke-width="2"/>';
    var dotY = padT + Math.max(30, Math.round(fs * 0.6));
    for (var i = 0; i < 3; i++) {
      s += '<circle cx="' + (padL + 30 + i * 34) + '" cy="' + dotY + '" r="8" fill="#c9b8f5"/>';
    }
    var labelY = dotY + Math.round(fs * 1.7);
    s += '<text x="' + (padL + 26) + '" y="' + labelY + '" font-size="' + fs + '"><tspan fill="#7c3aed">Browser window</tspan><tspan fill="#221a3a"> ' + v.vw + ' × ' + v.vh + '</tspan></text>';
    /* Taskbar strip (logical pixels, scaled by DPR). */
    if (taskPhys > 0) {
      var taskY = padT + sh - taskPhys;
      s += '<rect x="' + padL + '" y="' + taskY + '" width="' + sw + '" height="' + taskPhys + '" fill="url(#hatch)" stroke="#c9b8f5" stroke-width="2"/>';
      s += '<line x1="' + (padL + 26) + '" y1="' + (padT + sh) + '" x2="' + (padL + 26) + '" y2="' + (padT + sh + 16) + '" stroke="#8a7fb8" stroke-width="2"/>';
      s += '<text x="' + (padL + 40) + '" y="' + (padT + sh + 52) + '" font-size="' + fsSmall + '" fill="#4b4566">Taskbar ' + fmt(v.taskCss) + '</text>';
    }
    /* Caption. */
    var capY = padT + sh + (taskPhys > 0 ? 96 : 46);
    s += '<text x="' + (padL + sw / 2) + '" y="' + capY + '" text-anchor="middle" font-size="' + fsSmall + '" fill="#6b6390">Outline in physical pixels, taskbar and window in logical pixels</text>';
    s += '</svg>';
    diagram.innerHTML = s;
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
    buildDiagram(v);
    $('physRes').textContent = v.sw + ' × ' + v.sh;
    $('classBadge').textContent = v.cls;
    $('aspectBadge').textContent = v.aspect;
    $('orientPill').textContent = v.orient;
    $('sTotal').textContent = fmt(v.sw * v.sh);
    $('sLogical').textContent = v.cssW + ' × ' + v.cssH;
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
