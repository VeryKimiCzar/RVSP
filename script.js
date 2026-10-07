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

// Opened state survives a reload; storage access is guarded so a blocked browser can't stop the script
const STORAGE_KEY = "rvsp-envelope-opened";
const storage = {
  get: (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} },
};
if (storage.get(STORAGE_KEY) === "true") {
  stage.classList.add("is-opened");
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
  storage.set(STORAGE_KEY, "true");
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

// Entourage names come from the "Entourage" tab through the same Apps Script web app as the old site.
// Expected reply: { ok: true, entourage: [ { role: "best man", name: "..." }, ... ] }
(function () {
  const ENTOURAGE_API_URL = "https://script.google.com/macros/s/AKfycbxr_RAl4cYYbmkKhBMQ0jTdFhAfkopi_kwzyDHOElHUGZOJITwMgDCyOE6DRMRv3LCu4w/exec";

  const ROLE_TO_BLOCK = {
    "parents of the groom": "parentsGroom", "parents of the bride": "parentsBride",
    "primary principal": "principal", "principal sponsor": "principal", "principal sponsors": "principal", "principal": "principal",
    "best man": "bestMan", "maid of honor": "maid", "maid of honour": "maid",
    "candle": "candle", "veil": "veil", "cord": "cord",
    "groomsman": "groomsmen", "groomsmen": "groomsmen", "bridesmaid": "bridesmaids", "bridesmaids": "bridesmaids",
    "ring bearer": "ring", "coin bearer": "coin", "bible bearer": "bible",
    "flower girl": "flower", "flower girls": "flower"
  };
  const status = document.getElementById("entStatus");

  function fill(block, names) {
    const box = document.querySelector('.ent-names[data-ent="' + block + '"]');
    if (!box) return;
    box.textContent = "";
    names.forEach(function (n) {
      const row = document.createElement("div");
      row.textContent = n;
      box.appendChild(row);
    });
  }

  function render(entries) {
    const groups = {};
    entries.forEach(function (e) {
      const block = ROLE_TO_BLOCK[String(e.role || "").toLowerCase().replace(/\s+/g, " ").trim()];
      const name = String(e.name || "").trim();
      if (!block || !name) return;
      (groups[block] = groups[block] || []).push(name);
    });

    // Principal sponsors are two columns: Mrs./Ms. on the right, everyone else (Mr., "Ninong"...) on the left.
    // If nobody has a Mrs./Ms. prefix, the list is simply split in half.
    const p = groups.principal || [];
    let right = p.filter(function (n) { return /^(mrs|ms|miss)\b\.?/i.test(n); });
    let left = p.filter(function (n) { return right.indexOf(n) === -1; });
    if (!right.length && p.length > 1) { left = p.slice(0, Math.ceil(p.length / 2)); right = p.slice(left.length); }
    groups.principalLeft = left;
    groups.principalRight = right;
    delete groups.principal;

    Object.keys(groups).forEach(function (k) { fill(k, groups[k]); });
  }

  async function load() {
    try {
      const data = await (await fetch(ENTOURAGE_API_URL + "?action=entourage")).json();
      if (!data.ok) throw new Error("not ok");
      render(data.entourage || []);
    } catch (err) {
      status.textContent = "We couldn\u2019t load the entourage list. Please try again in a moment.";
      status.hidden = false;
    }
  }
  load();
})();

// Side nav: dot rail with labels (shown on hover or tap) and one blob that travels to the active dot.
// To add a section: give it an id and add one <li><a class="nav-item" href="#id"><span class="nav-label">Label</span></a></li> in index.html (44px per item).
(function () {
  const nav = document.getElementById("sideNav");
  if (!nav) return;
  const goo = nav.querySelector(".nav-goo");
  const items = Array.from(nav.querySelectorAll(".nav-item"));
  const targets = items.map(function (a) { return document.querySelector(a.getAttribute("href")); });
  const H = 44;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

  goo.style.height = items.length * H + "px";
  items.forEach(function (_, i) {
    const d = document.createElement("span");
    d.className = "nav-dot";
    d.style.transform = "translateY(" + i * H + "px)";
    goo.appendChild(d);
  });
  const blob = document.createElement("span");
  blob.className = "nav-blob";
  goo.appendChild(blob);

  let active = -1, ready = false;
  function setActive(i) {
    if (i === active) return;
    const y0 = ready ? new DOMMatrix(getComputedStyle(blob).transform).m42 : i * H;
    const y1 = i * H;
    active = i;
    items.forEach(function (a, k) {
      if (k === i) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current");
    });
    blob.style.transform = "translateY(" + y1 + "px)";
    if (ready && !reduce.matches && y0 !== y1) {
      // one blob: stretches while it travels, then settles on the new dot
      const steps = Math.min(Math.abs(y1 - y0) / H, 3);
      blob.animate([
        { transform: "translateY(" + y0 + "px) scale(1, 1)" },
        { transform: "translateY(" + (y0 + y1) / 2 + "px) scale(.7, 1.8)", offset: 0.5 },
        { transform: "translateY(" + y1 + "px) scale(1, 1)" }
      ], { duration: 380 + 70 * steps, easing: "cubic-bezier(.65, 0, .35, 1)" });
    }
  }

  function current() {
    const line = window.innerHeight * 0.45;
    let idx = 0;
    targets.forEach(function (t, i) { if (t && t.getBoundingClientRect().top <= line) idx = i; });
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) idx = items.length - 1;
    return idx;
  }

  // While a nav click is scrolling the page, keep the blob on the chosen dot instead of following the scroll.
  let locked = false, idleT, hardT, closeT, ticking = false;
  function unlock() { locked = false; clearTimeout(hardT); setActive(current()); }
  window.addEventListener("scroll", function () {
    if (locked) { clearTimeout(idleT); idleT = setTimeout(unlock, 150); return; }
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { ticking = false; setActive(current()); });
  }, { passive: true });

  // Hover devices see labels on hover. On touch, the first tap only reveals the labels; the next tap navigates.
  function setOpen(open) { nav.classList.toggle("is-open", open); }
  function isTouch(e) {
    return e.pointerType === "touch" || (!e.pointerType && !window.matchMedia("(hover: hover)").matches);
  }
  items.forEach(function (a, i) {
    a.addEventListener("click", function (e) {
      e.preventDefault();
      if (isTouch(e) && !nav.classList.contains("is-open")) { setOpen(true); return; }
      locked = true;
      clearTimeout(hardT);
      hardT = setTimeout(unlock, 2500);
      setActive(i);
      targets[i].scrollIntoView({ behavior: reduce.matches ? "auto" : "smooth", block: "start" });
      clearTimeout(closeT);
      closeT = setTimeout(function () { setOpen(false); }, 1400);
    });
  });
  document.addEventListener("click", function (e) {
    if (nav.classList.contains("is-open") && !nav.contains(e.target)) setOpen(false);
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") setOpen(false); });

  setActive(current());
  requestAnimationFrame(function () { requestAnimationFrame(function () { ready = true; }); });
})();
