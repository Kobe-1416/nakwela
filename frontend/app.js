// app.js
// Shared utility functions

function buildSlots(openTime, closeTime) {
  const slots = [];
  let [oh] = openTime.split(':').map(Number);
  let [ch] = closeTime.split(':').map(Number);

  for (let h = oh; h < ch; h++) {
    const start = String(h).padStart(2, '0') + ':00';
    const end = String(h + 1).padStart(2, '0') + ':00';
    slots.push({ start, end });
  }

  return slots;
}

function pad(n) {
  return String(n).padStart(2, '0');
}

function isBusinessOpenNow(biz) {
  const now = new Date();

  const [oh, om] = biz.openTime.split(':').map(Number);
  const [ch, cm] = biz.closeTime.split(':').map(Number);

  const openMins = oh * 60 + om;
  const closeMins = ch * 60 + cm;
  const nowMins = now.getHours() * 60 + now.getMinutes();

  return nowMins >= openMins && nowMins < closeMins;
}

function showToast(msg) {
  let toast = document.querySelector('.toast');

  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }

  toast.textContent = msg;
  toast.classList.add('show');

  clearTimeout(window.__toastTimer);

  window.__toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 2600);
}

function qs(name) {
  return new URLSearchParams(window.location.search).get(name);
}

if ("serviceWorker" in navigator) {
    window.addEventListener("load", async () => {
        try {
            const registration = await navigator.serviceWorker.register("/frontend/sw.js");
        } catch (err) {
            console.error(err);
        }
    });
}