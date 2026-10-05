const stage = document.getElementById("stage");
const musicDisc = document.getElementById("musicDisc");
const musicHint = document.getElementById("musicHint");
const bgMusic = document.getElementById("bgMusic");
const countdown = document.getElementById("countdown");

const WEDDING = new Date("2026-12-08T00:00:00+08:00").getTime();
const cdParts = {
  d: document.getElementById("cdDays"),
  h: document.getElementById("cdHours"),
  m: document.getElementById("cdMinutes"),
  s: document.getElementById("cdSeconds"),
};
const pad = (n) => String(n).padStart(2, "0");

// Persist opened state
const STORAGE_KEY = 'rvsp-envelope-opened';
// On load: if we previously saved that the envelope was opened, apply the class.
if (localStorage.getItem(STORAGE_KEY) === 'true') {
  stage.classList.add('is-opened');
  countdown.setAttribute("aria-hidden", "false");
}

function tickCountdown() {
  const total = Math.max(0, Math.floor((WEDDING - Date.now()) / 1000));
  cdParts.d.textContent = pad(Math.floor(total / 86400));
  cdParts.h.textContent = pad(Math.floor((total % 86400) / 3600));
  cdParts.m.textContent = pad(Math.floor((total % 3600) / 60));
  cdParts.s.textContent = pad(total % 60);
}
tickCountdown();
setInterval(tickCountdown, 1000);

document.getElementById("openBtn").addEventListener("click", () => {
  stage.classList.add("is-opened");
  countdown.setAttribute("aria-hidden", "false");
  document.dispatchEvent(new CustomEvent("invitation:open"));
  localStorage.setItem(STORAGE_KEY, "true");
});

musicDisc.addEventListener("click", () => {
  if (bgMusic.paused) {
    bgMusic.currentTime = 0;
    bgMusic.muted = false;
    bgMusic.play().catch(() => {});
  } else {
    bgMusic.muted = !bgMusic.muted;
  }
  const isMuted = bgMusic.muted;
  musicDisc.classList.toggle("is-muted", isMuted);
  musicDisc.setAttribute("aria-label", isMuted ? "Play background music" : "Mute background music");
  musicDisc.setAttribute("aria-pressed", String(isMuted));
  musicHint.classList.add("is-hidden");
});