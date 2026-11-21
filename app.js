/* Phone Screen Resolution tool — live detection, PPI calculator, copy details. */
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
  var bigRes = $('bigRes');
  if (!bigRes) return; // not the tool page

  function gcd(a, b) { return b === 0 ? a : gcd(b, a % b); }

  function readValues() {
    var sw = window.screen.width, sh = window.screen.height;
    var vw = window.innerWidth, vh = window.innerHeight;
    var dpr = window.devicePixelRatio || 1;
    var depth = window.screen.colorDepth || 24;
    var portrait = sh >= sw;
    var g = gcd(sw, sh);
    return {
      sw: sw, sh: sh, vw: vw, vh: vh, dpr: dpr, depth: depth,
      orient: portrait ? 'Portrait' : 'Landscape',
      aspect: (sw / g) + ' : ' + (sh / g)
    };
  }

  function render() {
    var v = readValues();
    bigRes.textContent = v.sw + ' × ' + v.sh;
    $('tScreen').textContent = v.sw + ' × ' + v.sh;
    $('tViewport').textContent = v.vw + ' × ' + v.vh;
    $('tDpr').textContent = v.dpr;
    $('tDepth').textContent = v.depth + '-bit';
    $('tOrient').textContent = v.orient;
    $('tAspect').textContent = v.aspect;
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

  $('refreshBtn').addEventListener('click', render);
  $('diagInput').addEventListener('input', calcPpi);
  $('ppiBtn').addEventListener('click', calcPpi);

  $('copyBtn').addEventListener('click', function () {
    var v = readValues();
    var diag = parseFloat($('diagInput').value);
    var ppi = (!diag || diag <= 0) ? '—' : Math.round(Math.sqrt(v.sw * v.sw + v.sh * v.sh) / diag) + ' PPI';
    var text = 'Screen resolution: ' + v.sw + ' x ' + v.sh + ' px\n' +
      'Viewport: ' + v.vw + ' x ' + v.vh + ' CSS px\n' +
      'Pixel ratio (DPR): ' + v.dpr + '\n' +
      'Color depth: ' + v.depth + '-bit\n' +
      'Orientation: ' + v.orient + '\n' +
      'Aspect ratio: ' + v.aspect + '\n' +
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
})();
