/* Battery Health Check tool — live battery readings via navigator.getBattery(). */
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
  var gauge = $('gaugeLevel');
  if (!gauge) return; // not the tool page

  /* ---- Pure helpers (no DOM access, testable) ---- */

  /* Seconds -> "2h 15m", "45m", "30s". Infinity or bad input -> null. */
  function formatTime(seconds) {
    if (seconds === null || seconds === undefined) return null;
    if (typeof seconds !== 'number' || !isFinite(seconds) || seconds < 0) return null;
    var total = Math.round(seconds);
    var h = Math.floor(total / 3600);
    var m = Math.floor((total % 3600) / 60);
    var s = total % 60;
    if (h > 0) return h + 'h ' + m + 'm';
    if (m > 0) return m + 'm';
    return s + 's';
  }

  /* level is 0..1, charging is a boolean. Returns 'Full', 'Charging' or 'Discharging'. */
  function statusText(level, charging) {
    if (charging) return level >= 1 ? 'Full' : 'Charging';
    return 'Discharging';
  }

  /* Gauge fill class: '' (green) above 50%, 'mid' 20-50%, 'low' below 20% (only when discharging). */
  function gaugeClass(levelPct, charging) {
    if (charging || levelPct >= 50) return '';
    if (levelPct >= 20) return 'mid';
    return 'low';
  }

  /* Advice for the self-check list, based on how many warning signs are ticked. */
  function selfCheckAdvice(checked, total) {
    if (checked === 0) return 'No warning signs ticked yet — tick any that sound familiar.';
    if (checked <= 2) return checked + ' of ' + total + ' signs ticked — a couple of early signs. Watch your battery over the next few days and check the real health in your phone settings.';
    return checked + ' of ' + total + ' signs ticked — several warning signs. Your battery is very likely worn out; check the real health in your phone settings and consider a battery replacement.';
  }

  /* ---- Live battery reading ---- */

  var battery = null;

  function readValues(b) {
    var pct = Math.round(b.level * 100);
    var status = statusText(b.level, b.charging);
    var timeSec = b.charging ? b.chargingTime : b.dischargingTime;
    var timeLabel = b.charging ? 'Time to full' : 'Time to empty';
    return {
      pct: pct,
      status: status,
      timeLabel: timeLabel,
      timeText: status === 'Full' ? 'Fully charged' : (formatTime(timeSec) || 'Not available'),
      gaugeCls: gaugeClass(pct, b.charging)
    };
  }

  function render() {
    if (!battery) return;
    var v = readValues(battery);
    gauge.innerHTML = v.pct + '<small>%</small>';
    var pill = $('statusPill');
    pill.textContent = (v.status === 'Charging' ? '⚡ ' : '') + v.status;
    pill.className = 'status-pill ' + v.status.toLowerCase();
    var fill = $('batteryFill');
    fill.style.width = v.pct + '%';
    fill.className = 'battery-fill' + (v.gaugeCls ? ' ' + v.gaugeCls : '');
    $('tLevel').textContent = v.pct + '%';
    $('tStatus').textContent = v.status;
    $('tTime').textContent = v.timeText;
    $('tTimeName').textContent = v.timeLabel;
    $('tTimeSub').textContent = v.status === 'Full' ? 'battery is fully charged'
      : v.status === 'Charging' ? 'until the battery is fully charged'
      : 'until the battery runs out at current use';
  }

  function showUnsupported() {
    var box = $('unsupportedBox');
    if (box) box.hidden = false;
    var live = $('liveTool');
    if (live) live.hidden = true;
    var note = $('toolNote');
    if (note) note.hidden = true;
  }

  function attach(b) {
    battery = b;
    render();
    var events = ['levelchange', 'chargingchange', 'chargingtimechange', 'dischargingtimechange'];
    events.forEach(function (ev) { b.addEventListener(ev, render); });
  }

  function refreshBattery() {
    if (!navigator.getBattery) { showUnsupported(); return; }
    navigator.getBattery().then(attach, showUnsupported);
  }

  var refreshBtn = $('refreshBtn');
  if (refreshBtn) refreshBtn.addEventListener('click', refreshBattery);

  var copyBtn = $('copyBtn');
  if (copyBtn) copyBtn.addEventListener('click', function () {
    if (!battery) return;
    var v = readValues(battery);
    var text = 'Battery level: ' + v.pct + '%\n' +
      'Status: ' + v.status + '\n' +
      v.timeLabel + ': ' + v.timeText + '\n' +
      'Checked with Battery Health Check (https://phonescreenresolution.github.io/battery-health-check.html)';
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

  /* Self-check list: live count + advice. */
  var checks = document.querySelectorAll('.selfcheck input[type="checkbox"]');
  var resultEl = $('selfCheckResult');
  if (checks.length && resultEl) {
    var updateSelfCheck = function () {
      var checked = 0;
      checks.forEach(function (c) { if (c.checked) checked++; });
      resultEl.textContent = selfCheckAdvice(checked, checks.length);
    };
    checks.forEach(function (c) { c.addEventListener('change', updateSelfCheck); });
    updateSelfCheck();
  }

  refreshBattery();
})();
