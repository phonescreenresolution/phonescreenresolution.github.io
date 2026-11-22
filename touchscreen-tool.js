/* Touchscreen Test — 14-test fullscreen flow.
   Order (from the Screen Test Tool plugin, touch tests in ZIP order):
   12 touch tests, then White Screen, then Solid Color.
   One "Start Touch Test" button opens fullscreen and runs the tests
   one after another — no scrolling. Nothing is uploaded or stored. */
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

  /* ---------- Device touch info (start screen) ---------- */
  var maxTouch = navigator.maxTouchPoints || 0;
  var touchSupported = maxTouch > 0 || ('ontouchstart' in window);
  var coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  var fine = window.matchMedia && window.matchMedia('(pointer: fine)').matches;
  var pointerType = coarse ? 'touch' : (fine ? 'mouse' : 'unknown');
  var pill = $('touchPill');
  if (touchSupported) {
    pill.textContent = 'Touch ready';
    pill.classList.add('ready');
  } else {
    pill.textContent = 'No touch detected';
  }
  $('touchInfo').textContent = 'Your device: touch support ' + (touchSupported ? 'Yes' : 'No') +
    ' · Max touch points: ' + maxTouch + ' · Pointer: ' + pointerType +
    ' · Screen: ' + window.screen.width + ' × ' + window.screen.height + ' CSS px';

  /* ---------- Stage helpers ---------- */
  function stagePos(stage, e) {
    var r = stage.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }
  function addCaption(stage, text) {
    var c = document.createElement('div');
    c.className = 'tt-caption';
    c.textContent = text;
    stage.appendChild(c);
    return c;
  }
  function addLabel(stage, text) {
    var l = document.createElement('div');
    l.className = 'tt-label';
    l.textContent = text;
    stage.appendChild(l);
    return l;
  }
  function dropMarker(container, x, y, color) {
    var m = document.createElement('div');
    m.className = 'tt-marker';
    m.style.left = x + 'px';
    m.style.top = y + 'px';
    m.style.background = color;
    container.appendChild(m);
    requestAnimationFrame(function () { m.style.transform = 'scale(1.8)'; m.style.opacity = '0'; });
    setTimeout(function () { m.remove(); }, 450);
  }
  function colorName(hex) {
    var map = {
      '#FFFFFF': 'White', '#000000': 'Black', '#FF0000': 'Red',
      '#00FF00': 'Green', '#0000FF': 'Blue', '#808080': 'Gray'
    };
    return map[hex.toUpperCase()] || hex.toUpperCase();
  }

  /* ---------- Test renderers (adapted from the Screen Test Tool plugin) ---------- */
  function runTouchGrid(stage, test) {
    var rows = test.params.rows, cols = test.params.cols;
    var isSwipe = test.params.mode === 'swipe';
    var grid = document.createElement('div');
    grid.className = 'tt-grid';
    grid.style.gridTemplateColumns = 'repeat(' + cols + ',1fr)';
    grid.style.gridTemplateRows = 'repeat(' + rows + ',1fr)';
    stage.appendChild(grid);
    var total = rows * cols, hitCount = 0;
    var startTime = performance.now();
    var cells = [];
    for (var i = 0; i < total; i++) {
      var cell = document.createElement('div');
      cell.className = 'tt-cell';
      grid.appendChild(cell);
      cells.push(cell);
    }
    var label = addLabel(stage, '');
    function updateLabel() {
      label.textContent = isSwipe
        ? hitCount + ' / ' + total + ' cells covered'
        : hitCount + ' / ' + total + ' cells tested';
    }
    updateLabel();
    function markCell(cell) {
      if (!cell || !cell.classList || !cell.classList.contains('tt-cell') || cell.classList.contains('hit')) return;
      cell.classList.add('hit');
      hitCount++;
      if (!isSwipe) cell.textContent = Math.round(performance.now() - startTime) + 'ms';
      updateLabel();
    }
    var dragging = false;
    function onDown(e) { dragging = true; markCell(e.target.closest('.tt-cell')); }
    function onMove(e) {
      if (!isSwipe || !dragging) return;
      var el = document.elementFromPoint(e.clientX, e.clientY);
      markCell(el && el.closest ? el.closest('.tt-cell') : null);
    }
    function onUp() { dragging = false; }
    grid.addEventListener('pointerdown', onDown);
    if (isSwipe) {
      grid.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onUp);
    }
    var resetBtn = null;
    if (test.params.showReset) {
      resetBtn = document.createElement('button');
      resetBtn.type = 'button';
      resetBtn.className = 'tt-stage-btn';
      resetBtn.textContent = 'Reset';
      resetBtn.addEventListener('click', function () {
        cells.forEach(function (c) { c.classList.remove('hit'); c.textContent = ''; });
        hitCount = 0;
        updateLabel();
      });
      stage.appendChild(resetBtn);
    }
    addCaption(stage, isSwipe
      ? 'Swipe your finger to cover all cells — any cell left dark may be a dead touch zone.'
      : 'Tap every cell. Untested cells may indicate an unresponsive touch zone.');
    return function () {
      grid.removeEventListener('pointerdown', onDown);
      if (isSwipe) {
        grid.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onUp);
      }
    };
  }

  function runTouchLine(stage) {
    var canvas = document.createElement('canvas');
    canvas.className = 'tt-line-canvas';
    stage.appendChild(canvas);
    var dpr = window.devicePixelRatio || 1;
    function size() {
      var r = stage.getBoundingClientRect();
      canvas.width = Math.round(r.width * dpr);
      canvas.height = Math.round(r.height * dpr);
    }
    size();
    var ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#5CF0C0';
    ctx.lineWidth = 4 * dpr;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.fillStyle = '#5CF0C0';
    var drawing = false, lastX = 0, lastY = 0;
    function pos(e) {
      var r = canvas.getBoundingClientRect();
      return [(e.clientX - r.left) * dpr, (e.clientY - r.top) * dpr];
    }
    function down(e) {
      drawing = true;
      var p = pos(e);
      lastX = p[0]; lastY = p[1];
      ctx.beginPath(); ctx.arc(lastX, lastY, 2 * dpr, 0, 7); ctx.fill();
    }
    function move(e) {
      if (!drawing) return;
      var p = pos(e);
      ctx.beginPath(); ctx.moveTo(lastX, lastY); ctx.lineTo(p[0], p[1]); ctx.stroke();
      lastX = p[0]; lastY = p[1];
    }
    function up() { drawing = false; }
    canvas.addEventListener('pointerdown', down);
    canvas.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('resize', size);
    var clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 'tt-stage-btn';
    clearBtn.textContent = 'Clear';
    clearBtn.addEventListener('click', function () { ctx.clearRect(0, 0, canvas.width, canvas.height); });
    stage.appendChild(clearBtn);
    addCaption(stage, 'Drag continuously across the whole screen. Gaps in the line reveal tracking dropouts.');
    return function () {
      canvas.removeEventListener('pointerdown', down);
      canvas.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('resize', size);
    };
  }

  function runMultiTouch(stage) {
    var wrap = document.createElement('div');
    wrap.className = 'tt-fill';
    wrap.style.background = '#0c0e1a';
    stage.appendChild(wrap);
    var active = new Map();
    var counter = 0;
    var idLabels = new Map();
    function makeDot(n, x, y) {
      var dot = document.createElement('div');
      dot.className = 'tt-finger';
      dot.style.left = x + 'px';
      dot.style.top = y + 'px';
      dot.textContent = 'Finger ' + n;
      wrap.appendChild(dot);
      return dot;
    }
    function down(e) {
      counter++;
      idLabels.set(e.pointerId, counter);
      var p = stagePos(stage, e);
      active.set(e.pointerId, makeDot(counter, p.x, p.y));
    }
    function move(e) {
      var dot = active.get(e.pointerId);
      if (!dot) return;
      var p = stagePos(stage, e);
      dot.style.left = p.x + 'px';
      dot.style.top = p.y + 'px';
    }
    function up(e) {
      var dot = active.get(e.pointerId);
      if (dot) dot.remove();
      active.delete(e.pointerId);
    }
    wrap.addEventListener('pointerdown', down);
    wrap.addEventListener('pointermove', move);
    wrap.addEventListener('pointerup', up);
    wrap.addEventListener('pointercancel', up);
    addCaption(stage, 'Place multiple fingers on the screen at once — each should get its own labeled marker.');
    return function () {
      wrap.removeEventListener('pointerdown', down);
      wrap.removeEventListener('pointermove', move);
      wrap.removeEventListener('pointerup', up);
      wrap.removeEventListener('pointercancel', up);
    };
  }

  function runTouchZone(stage, test) {
    var variant = test.params.variant;
    var wrap = document.createElement('div');
    wrap.className = 'tt-fill';
    wrap.style.background = '#0c0e1a';
    stage.appendChild(wrap);
    var overlay = document.createElement('div');
    overlay.className = 'tt-overlay';
    wrap.appendChild(overlay);
    var teardownExtra = function () {};
    var label = addLabel(stage, '');

    if (variant === 'basic') {
      var taps = 0;
      label.textContent = '0 taps registered';
      var tap = function (e) {
        taps++;
        var p = stagePos(stage, e);
        dropMarker(overlay, p.x, p.y, '#5CF0C0');
        label.textContent = taps + ' tap' + (taps === 1 ? '' : 's') + ' registered';
      };
      wrap.addEventListener('pointerdown', tap);
      teardownExtra = function () { wrap.removeEventListener('pointerdown', tap); };
      addCaption(stage, 'Tap anywhere. Every tap should leave a mark.');
    } else if (variant === 'accuracy') {
      var hit = 0, total = 0, offsetSum = 0;
      var placeTarget = function () {
        var w = stage.clientWidth, h = stage.clientHeight;
        var x = 60 + Math.random() * Math.max(1, w - 120);
        var y = 100 + Math.random() * Math.max(1, h - 220);
        overlay.innerHTML = '<div class="tt-target"><div class="tt-target-dot"></div></div>';
        var t = overlay.firstChild;
        t.style.left = x + 'px';
        t.style.top = y + 'px';
        overlay.dataset.tx = x;
        overlay.dataset.ty = y;
      };
      placeTarget();
      var tapAcc = function (e) {
        var tx = parseFloat(overlay.dataset.tx), ty = parseFloat(overlay.dataset.ty);
        var p = stagePos(stage, e);
        var d = Math.hypot(p.x - tx, p.y - ty);
        total++;
        offsetSum += d;
        if (d < 30) hit++;
        label.textContent = hit + '/' + total + ' on target · avg offset ' + (offsetSum / total).toFixed(0) + 'px';
        placeTarget();
      };
      wrap.addEventListener('pointerdown', tapAcc);
      teardownExtra = function () { wrap.removeEventListener('pointerdown', tapAcc); };
      addCaption(stage, 'Tap the center of each target as it appears.');
    } else if (variant === 'sensitivity') {
      var count = 0;
      label.textContent = 'Try light and firm taps across the screen';
      var tapSens = function (e) {
        count++;
        var p = stagePos(stage, e);
        dropMarker(overlay, p.x, p.y, e.pressure ? '#F59E0B' : '#5CF0C0');
        var pr = (e.pressure && e.pressure > 0) ? ' · pressure ' + e.pressure.toFixed(2) : '';
        label.textContent = count + ' taps' + pr;
      };
      wrap.addEventListener('pointerdown', tapSens);
      teardownExtra = function () { wrap.removeEventListener('pointerdown', tapSens); };
      addCaption(stage, "Browsers can't measure true pressure on most devices — compare responsiveness by feel instead.");
    } else if (variant === 'edge' || variant === 'corner') {
      var zoneEls = [];
      if (variant === 'edge') {
        ['top', 'bottom', 'left', 'right'].forEach(function (side) {
          var z = document.createElement('div');
          z.className = 'tt-zone';
          z.dataset.zone = side;
          z.classList.add('tt-zone-' + side);
          overlay.appendChild(z);
          zoneEls.push(z);
        });
      } else {
        [['top', 'left'], ['top', 'right'], ['bottom', 'left'], ['bottom', 'right']].forEach(function (pair) {
          var z = document.createElement('div');
          z.className = 'tt-zone tt-zone-corner';
          z.dataset.zone = pair[0] + '-' + pair[1];
          z.style[pair[0]] = '0';
          z.style[pair[1]] = '0';
          overlay.appendChild(z);
          zoneEls.push(z);
        });
      }
      var totalZones = zoneEls.length;
      label.textContent = '0/' + totalZones + ' zones tested';
      var tapZone = function (e) {
        var z = e.target.closest('[data-zone]');
        if (!z || z.dataset.done) return;
        z.dataset.done = '1';
        z.classList.add('done');
        var done = zoneEls.filter(function (x) { return x.dataset.done; }).length;
        label.textContent = done + '/' + totalZones + ' zones tested';
      };
      overlay.addEventListener('pointerdown', tapZone);
      teardownExtra = function () { overlay.removeEventListener('pointerdown', tapZone); };
      addCaption(stage, variant === 'edge' ? 'Tap along each highlighted edge strip.' : 'Tap each highlighted corner zone.');
    } else if (variant === 'ghost') {
      var events = 0;
      var log = [];
      var logEl = document.createElement('div');
      logEl.className = 'tt-log';
      stage.appendChild(logEl);
      label.textContent = '0 unexpected events logged — set the device down without touching it';
      var onEvt = function (e) {
        events++;
        var t = new Date().toLocaleTimeString();
        log.unshift(t + ' — pointer event at (' + Math.round(e.clientX) + ', ' + Math.round(e.clientY) + ')');
        logEl.innerHTML = log.slice(0, 6).join('<br>');
        label.textContent = events + ' unexpected event' + (events === 1 ? '' : 's') + ' logged';
      };
      wrap.addEventListener('pointerdown', onEvt);
      teardownExtra = function () { wrap.removeEventListener('pointerdown', onEvt); };
      addCaption(stage, "This can only log touch events while you're not touching the screen — it can't diagnose the hardware cause of ghost touch.");
    } else if (variant === 'latency') {
      var target = document.createElement('div');
      target.className = 'tt-latency-target';
      target.textContent = 'Tap me';
      overlay.appendChild(target);
      var samples = [];
      label.textContent = 'Tap the target repeatedly';
      var tapLat = function (e) {
        var t0 = e.timeStamp;
        requestAnimationFrame(function (t1) {
          var ms = Math.max(0, t1 - t0);
          samples.push(ms);
          if (samples.length > 10) samples.shift();
          var avg = samples.reduce(function (a, b) { return a + b; }, 0) / samples.length;
          label.textContent = 'Last: ' + ms.toFixed(1) + 'ms · avg: ' + avg.toFixed(1) + 'ms (approximate, browser-level)';
        });
      };
      target.addEventListener('pointerdown', tapLat);
      teardownExtra = function () { target.removeEventListener('pointerdown', tapLat); };
      addCaption(stage, 'Measures time to the next rendered frame after your tap — not true hardware input latency.');
    }
    return function () { teardownExtra(); };
  }

  function runSolid(stage, test) {
    var colors = test.params.colors;
    var idx = 0;
    var fill = document.createElement('div');
    fill.className = 'tt-fill';
    stage.appendChild(fill);
    var label = addLabel(stage, '');
    function paint() {
      fill.style.background = colors[idx];
      label.textContent = colors.length > 1
        ? colorName(colors[idx]) + ' — tap or press C to cycle (' + (idx + 1) + '/' + colors.length + ')'
        : colorName(colors[idx]);
    }
    paint();
    function cycle() { idx = (idx + 1) % colors.length; paint(); }
    function onClick() { if (colors.length > 1) cycle(); }
    function onKey(e) { if (e.key.toLowerCase() === 'c' && colors.length > 1) cycle(); }
    stage.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey);
    return function () {
      stage.removeEventListener('click', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }

  /* ---------- The 14 tests, in order ---------- */
  var TESTS = [
    { id: 'touch-coverage', name: 'Touch Coverage Test', hint: 'Swipe across the whole grid.', run: function (s) { return runTouchGrid(s, { params: { rows: 8, cols: 11, mode: 'swipe', showReset: true } }); } },
    { id: 'touch-test', name: 'Touch Test', hint: 'Tap anywhere on the screen.', run: function (s) { return runTouchZone(s, { params: { variant: 'basic' } }); } },
    { id: 'multi-touch', name: 'Multi-Touch Test', hint: 'Place several fingers at once.', run: runMultiTouch },
    { id: 'touch-accuracy', name: 'Touch Accuracy Test', hint: 'Tap the center of each target.', run: function (s) { return runTouchZone(s, { params: { variant: 'accuracy' } }); } },
    { id: 'touch-sensitivity', name: 'Touch Sensitivity Test', hint: 'Try light and firm taps.', run: function (s) { return runTouchZone(s, { params: { variant: 'sensitivity' } }); } },
    { id: 'touch-grid', name: 'Touch Grid Test', hint: 'Tap every cell in the grid.', run: function (s) { return runTouchGrid(s, { params: { rows: 8, cols: 5 } }); } },
    { id: 'touch-line', name: 'Touch Line Test', hint: 'Drag your finger across the screen.', run: runTouchLine },
    { id: 'edge-touch', name: 'Edge Touch Test', hint: 'Tap along each edge of the screen.', run: function (s) { return runTouchZone(s, { params: { variant: 'edge' } }); } },
    { id: 'corner-touch', name: 'Corner Touch Test', hint: 'Tap each of the four corners.', run: function (s) { return runTouchZone(s, { params: { variant: 'corner' } }); } },
    { id: 'dead-touch-zone', name: 'Dead Touch Zone Test', hint: 'A finer grid — tap every cell.', run: function (s) { return runTouchGrid(s, { params: { rows: 12, cols: 7 } }); } },
    { id: 'ghost-touch', name: 'Ghost Touch Test', hint: 'Set the device down and watch.', run: function (s) { return runTouchZone(s, { params: { variant: 'ghost' } }); } },
    { id: 'touch-latency', name: 'Touch Latency Test', hint: 'Tap the target repeatedly.', run: function (s) { return runTouchZone(s, { params: { variant: 'latency' } }); } },
    { id: 'white-screen', name: 'White Screen Test', hint: 'Solid white, edge to edge.', run: function (s) { return runSolid(s, { params: { colors: ['#FFFFFF'] } }); } },
    { id: 'solid-color', name: 'Solid Color Test', hint: 'Tap to cycle through the colors.', run: function (s) { return runSolid(s, { params: { colors: ['#FFFFFF', '#000000', '#FF0000', '#00FF00', '#0000FF', '#808080'] } }); } }
  ];

  /* ---------- Runner state ---------- */
  var startScreen = $('ttStart');
  var runner = $('ttRunner');
  var resultsScreen = $('ttResults');
  var stage = $('ttStage');
  var progressEl = $('ttProgress');
  var nameEl = $('ttName');
  var currentList = TESTS;
  var currentIndex = 0;
  var results = {}; // test id -> 'good' | 'problem' | 'skip'
  var teardown = null;
  var running = false;

  function setVerdict(v) {
    results[currentList[currentIndex].id] = v;
  }
  function showTest(i) {
    if (teardown) { teardown(); teardown = null; }
    currentIndex = i;
    stage.innerHTML = '';
    var test = currentList[i];
    progressEl.textContent = 'Test ' + (i + 1) + ' of ' + currentList.length;
    nameEl.textContent = test.name;
    $('ttPrev').disabled = i === 0;
    teardown = test.run(stage, test);
  }
  function advance() {
    if (currentIndex + 1 < currentList.length) {
      showTest(currentIndex + 1);
    } else {
      finish();
    }
  }
  function openFullscreen() {
    var el = runner;
    var req = el.requestFullscreen || el.webkitRequestFullscreen;
    if (req) {
      try {
        var p = req.call(el);
        if (p && p.catch) p.catch(function () { /* fixed overlay fallback stays */ });
      } catch (e) { /* fixed overlay fallback stays */ }
    }
  }
  function startFlow(list) {
    currentList = list;
    results = {};
    startScreen.hidden = true;
    resultsScreen.hidden = true;
    runner.hidden = false;
    runner.classList.add('tt-active');
    document.body.classList.add('tt-no-scroll');
    running = true;
    showTest(0);
    openFullscreen();
  }
  function exitFlow(showResults) {
    if (document.fullscreenElement) {
      try { document.exitFullscreen(); } catch (e) {}
    }
    if (teardown) { teardown(); teardown = null; }
    runner.classList.remove('tt-active');
    runner.hidden = true;
    document.body.classList.remove('tt-no-scroll');
    running = false;
    if (showResults) {
      renderResults();
      resultsScreen.hidden = false;
      resultsScreen.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      resultsScreen.hidden = true;
      startScreen.hidden = false;
    }
  }
  function finish() {
    exitFlow(true);
  }
  function renderResults() {
    var good = 0, problem = 0, skip = 0;
    currentList.forEach(function (t) {
      var v = results[t.id];
      if (v === 'good') good++;
      else if (v === 'problem') problem++;
      else skip++;
    });
    $('ttSummary').textContent = good + ' looked good · ' + problem + ' with a problem · ' + skip + ' skipped';
    var list = $('ttResultList');
    list.innerHTML = '';
    currentList.forEach(function (t, i) {
      var v = results[t.id];
      var li = document.createElement('li');
      var badge = document.createElement('span');
      badge.className = 'tt-badge ' + (v || 'none');
      badge.textContent = v === 'good' ? 'Looks good' : v === 'problem' ? 'Problem found' : v === 'skip' ? 'Skipped' : 'Not marked';
      li.appendChild(document.createTextNode((i + 1) + '. ' + t.name + ' '));
      li.appendChild(badge);
      list.appendChild(li);
    });
    var failedBtn = $('ttFailed');
    failedBtn.hidden = problem === 0;
  }

  /* ---------- Buttons ---------- */
  $('ttStartBtn').addEventListener('click', function () { startFlow(TESTS); });
  $('ttPrev').addEventListener('click', function () {
    if (currentIndex > 0) showTest(currentIndex - 1);
  });
  $('ttNext').addEventListener('click', function () { advance(); });
  $('ttGood').addEventListener('click', function () { setVerdict('good'); advance(); });
  $('ttProblem').addEventListener('click', function () { setVerdict('problem'); advance(); });
  $('ttSkip').addEventListener('click', function () { setVerdict('skip'); advance(); });
  $('ttExit').addEventListener('click', function () {
    var anyAnswered = currentList.some(function (t) { return results[t.id]; });
    exitFlow(anyAnswered);
  });
  $('ttAgain').addEventListener('click', function () { startFlow(TESTS); });
  $('ttFailed').addEventListener('click', function () {
    var failed = TESTS.filter(function (t) { return results[t.id] === 'problem'; });
    if (failed.length) startFlow(failed);
  });
  $('ttClose').addEventListener('click', function () {
    resultsScreen.hidden = true;
    startScreen.hidden = false;
    startScreen.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  /* If the user leaves fullscreen with Esc, end the run the same way. */
  document.addEventListener('fullscreenchange', function () {
    if (!document.fullscreenElement && running) {
      var anyAnswered = currentList.some(function (t) { return results[t.id]; });
      exitFlow(anyAnswered);
    }
  });
})();
