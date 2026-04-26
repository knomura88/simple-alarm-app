const currentTimeEl = document.getElementById('current-time');
const currentDateEl = document.getElementById('current-date');
const alarmTimeInput = document.getElementById('alarm-time');
const alarmLabelInput = document.getElementById('alarm-label');
const addAlarmBtn = document.getElementById('add-alarm');
const alarmListEl = document.getElementById('alarm-list');
const ringingOverlay = document.getElementById('ringing-overlay');
const ringingTimeEl = document.getElementById('ringing-time');
const ringingLabelEl = document.getElementById('ringing-label');
const dismissBtn = document.getElementById('dismiss-btn');
const alarmSound = document.getElementById('alarm-sound');

let alarms = JSON.parse(localStorage.getItem('alarms') || '[]');
let ringingId = null;

const DAYS = ['日', '月', '火', '水', '木', '金', '土'];

function pad(n) {
  return String(n).padStart(2, '0');
}

function tick() {
  const now = new Date();
  const h = pad(now.getHours());
  const m = pad(now.getMinutes());
  const s = pad(now.getSeconds());
  currentTimeEl.textContent = `${h}:${m}:${s}`;

  const y = now.getFullYear();
  const mo = pad(now.getMonth() + 1);
  const d = pad(now.getDate());
  const day = DAYS[now.getDay()];
  currentDateEl.textContent = `${y}年${mo}月${d}日 (${day})`;

  if (s === '00' || (s === '00' && ringingId === null)) {
    checkAlarms(h, m);
  }
}

function checkAlarms(h, m) {
  const current = `${h}:${m}`;
  alarms.forEach(alarm => {
    if (alarm.enabled && alarm.time === current && ringingId !== alarm.id) {
      triggerAlarm(alarm);
    }
  });
}

function triggerAlarm(alarm) {
  ringingId = alarm.id;
  ringingTimeEl.textContent = alarm.time;
  ringingLabelEl.textContent = alarm.label || '';
  ringingOverlay.classList.remove('hidden');

  alarmSound.play().catch(() => {
    // autoplay blocked — silent alarm, overlay still shows
  });
}

dismissBtn.addEventListener('click', () => {
  ringingOverlay.classList.add('hidden');
  alarmSound.pause();
  alarmSound.currentTime = 0;
  ringingId = null;
});

function saveAlarms() {
  localStorage.setItem('alarms', JSON.stringify(alarms));
}

function renderAlarms() {
  alarmListEl.innerHTML = '';

  if (alarms.length === 0) {
    alarmListEl.innerHTML = '<li class="empty-message">アラームがありません</li>';
    return;
  }

  alarms
    .slice()
    .sort((a, b) => a.time.localeCompare(b.time))
    .forEach(alarm => {
      const li = document.createElement('li');
      li.className = `alarm-item ${alarm.enabled ? 'active' : 'inactive'}`;
      li.dataset.id = alarm.id;

      li.innerHTML = `
        <div class="alarm-item-time">${alarm.time}</div>
        <div class="alarm-item-label">${alarm.label || ''}</div>
        <button class="toggle-btn ${alarm.enabled ? 'on' : ''}" data-id="${alarm.id}" title="ON/OFF"></button>
        <button class="delete-btn" data-id="${alarm.id}" title="削除">✕</button>
      `;
      alarmListEl.appendChild(li);
    });
}

alarmListEl.addEventListener('click', e => {
  const toggleBtn = e.target.closest('.toggle-btn');
  const deleteBtn = e.target.closest('.delete-btn');

  if (toggleBtn) {
    const id = toggleBtn.dataset.id;
    const alarm = alarms.find(a => a.id === id);
    if (alarm) {
      alarm.enabled = !alarm.enabled;
      saveAlarms();
      renderAlarms();
    }
  }

  if (deleteBtn) {
    const id = deleteBtn.dataset.id;
    alarms = alarms.filter(a => a.id !== id);
    saveAlarms();
    renderAlarms();
  }
});

addAlarmBtn.addEventListener('click', () => {
  const time = alarmTimeInput.value;
  if (!time) {
    alarmTimeInput.focus();
    return;
  }

  const label = alarmLabelInput.value.trim();
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  alarms.push({ id, time, label, enabled: true });
  saveAlarms();
  renderAlarms();

  alarmTimeInput.value = '';
  alarmLabelInput.value = '';
});

alarmTimeInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') addAlarmBtn.click();
});

alarmLabelInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') addAlarmBtn.click();
});

renderAlarms();
tick();
setInterval(tick, 1000);
