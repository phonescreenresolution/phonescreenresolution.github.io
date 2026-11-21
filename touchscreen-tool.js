/* Touchscreen Test tool — tap grid, multi-touch test, draw area, touch info. */
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

  /* Device touch support info. */
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

  /* 1. Tap grid — 5 columns x 4 rows = 20 areas. */
  var COLS = 5, ROWS = 4, TOTAL = COLS * ROWS;
  var grid = $('tapGrid');
  var tapCount = $('tapCount');
  var tapDone = $('tapDone');
  var tested = 0;
  var cells = [];

  function updateTapCount() {
    tapCount.textContent = tested + ' / ' + TOTAL + ' areas tested';
    tapDone.hidden = tested !== TOTAL;
  }

  function markCell(cell) {
    if (cell.classList.contains('tested')) return;
    cell.classList.add('tested');
    cell.textContent = '✓';
    tested++;
    updateTapCount();
  }

  for (var i = 0; i < TOTAL; i++) {
    var cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'tap-cell';
    cell.setAttribute('aria-label', 'Test area ' + (i + 1) + ' of ' + TOTAL);
    cell.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      markCell(e.currentTarget);
    });
    grid.appendChild(cell);
    cells.push(cell);
  }

  $('tapReset').addEventListener('click', function () {
    cells.forEach(function (c) {
      c.classList.remove('tested');
      c.textContent = '';
    });
    tested = 0;
    updateTapCount();
  });

  /* 2. Multi-touch test — track every active pointer on the pad. */
  var pad = $('mtPad');
  var mtCount = $('mtCount');
  var mtCoords = $('mtCoords');
  var pointers = new Map(); // pointerId -> {x, y}

  function padPos(e) {
    var r = pad.getBoundingClientRect();
    return { x: Math.round(e.clientX - r.left), y: Math.round(e.clientY - r.top) };
  }

  function renderMt(lastEvent) {
    mtCount.textContent = pointers.size;
    if (lastEvent) {
      var p = pointers.get(lastEvent.pointerId) || padPos(lastEvent);
      mtCoords.textContent = 'Last touch: x ' + p.x + ', y ' + p.y + ' (' + lastEvent.pointerType + ')';
    }
    pad.querySelectorAll('.mt-dot').forEach(function (d) { d.remove(); });
    pointers.forEach(function (pos) {
      var dot = document.createElement('span');
      dot.className = 'mt-dot';
      dot.style.left = pos.x + 'px';
      dot.style.top = pos.y + 'px';
      pad.appendChild(dot);
    });
  }

  pad.addEventListener('pointerdown', function (e) {
    e.preventDefault();
    if (pad.setPointerCapture) { try { pad.setPointerCapture(e.pointerId); } catch (err) {} }
    pointers.set(e.pointerId, padPos(e));
    renderMt(e);
  });
  pad.addEventListener('pointermove', function (e) {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, padPos(e));
    renderMt(e);
  });
  function endPointer(e) {
    pointers.delete(e.pointerId);
    renderMt(null);
  }
  pad.addEventListener('pointerup', endPointer);
  pad.addEventListener('pointercancel', endPointer);

  /* 3. Draw area — drag to draw a trail; gaps can mean dead spots. */
  var canvas = $('drawCanvas');
  var ctx = canvas.getContext('2d');
  var drawing = false;
  var lastPoint = null;

  function sizeCanvas() {
    var dpr = window.devicePixelRatio || 1;
    var w = canvas.clientWidth, h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0284c7';
    ctx.fillStyle = '#0284c7';
  }
  sizeCanvas();
  window.addEventListener('resize', sizeCanvas);

  function canvasPos(e) {
    var r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  canvas.addEventListener('pointerdown', function (e) {
    e.preventDefault();
    if (canvas.setPointerCapture) { try { canvas.setPointerCapture(e.pointerId); } catch (err) {} }
    drawing = true;
    lastPoint = canvasPos(e);
    ctx.beginPath();
    ctx.arc(lastPoint.x, lastPoint.y, 1.5, 0, Math.PI * 2);
    ctx.fill();
  });
  canvas.addEventListener('pointermove', function (e) {
    if (!drawing) return;
    e.preventDefault();
    var p = canvasPos(e);
    ctx.beginPath();
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    lastPoint = p;
  });
  function stopDraw() {
    drawing = false;
    lastPoint = null;
  }
  canvas.addEventListener('pointerup', stopDraw);
  canvas.addEventListener('pointercancel', stopDraw);

  $('drawClear').addEventListener('click', function () {
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
  });
})();
