// One Apps Script web app serves the entourage names and the RSVP guest search/submit; change the URL here only
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw39epnk-qfOVKuoDhtSQCsNek5_78Z-Qec0QCRSFvwL1Yq4fayL7suLlQZ22V1aw5aGQ/exec";

const stage = document.getElementById("stage");
const musicDisc = document.getElementById("musicDisc");
const musicHint = document.getElementById("musicHint");
const bgMusic = document.getElementById("bgMusic");
const countdown = document.getElementById("countdown");

const WEDDING = new Date("2026-12-08T00:00:00+08:00").getTime();
// every element tagged data-cd="d|h|m|s" (the countdown scene and the Details section) is updated together
const cdParts = {};
["d", "h", "m", "s"].forEach((k) => { cdParts[k] = document.querySelectorAll('[data-cd="' + k + '"]'); });
const setAll = (els, v) => els.forEach((el) => { el.textContent = v; });
const pad = (n) => String(n).padStart(2, "0");

// The opened envelope is remembered only for a refresh (or back/forward) in this tab, with the scroll position, so a reload
// returns to the same spot. Opening the site fresh (new tab, typed or shared link) starts at the envelope again.
// Storage access is guarded so a blocked browser can't stop the script.
const STORAGE_KEY = "rvsp-envelope-opened";
const SCROLL_KEY = "rvsp-scroll-y";
const storage = {
  get: (k) => { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
  set: (k, v) => { try { sessionStorage.setItem(k, v); } catch (e) {} },
  remove: (k) => { try { sessionStorage.removeItem(k); } catch (e) {} },
};
try { localStorage.removeItem(STORAGE_KEY); } catch (e) {} // earlier versions remembered it forever
function navigationType() {
  const nav = performance.getEntriesByType && performance.getEntriesByType("navigation")[0];
  if (nav && nav.type) return nav.type;
  const legacy = performance.navigation && performance.navigation.type; // 1 = reload, 2 = back/forward
  return legacy === 1 ? "reload" : legacy === 2 ? "back_forward" : "navigate";
}
const keepPlace = navigationType() === "reload" || navigationType() === "back_forward";
if (!keepPlace) { storage.remove(STORAGE_KEY); storage.remove(SCROLL_KEY); }
if ("scrollRestoration" in history) history.scrollRestoration = "manual";
if (keepPlace && storage.get(STORAGE_KEY) === "true") {
  stage.classList.add("is-opened");
  document.body.classList.add("site-opened");
  countdown.setAttribute("aria-hidden", "false");
  const savedY = Number(storage.get(SCROLL_KEY)) || 0;
  if (savedY > 0) {
    requestAnimationFrame(() => window.scrollTo(0, savedY));
    window.addEventListener("load", () => { if (Math.abs(window.scrollY - savedY) > 2) window.scrollTo(0, savedY); }, { once: true });
  }
}
let scrollSaveQueued = false;
function saveScroll() {
  scrollSaveQueued = false;
  if (document.body.classList.contains("site-opened")) storage.set(SCROLL_KEY, String(Math.round(window.scrollY)));
}
window.addEventListener("scroll", () => {
  if (!scrollSaveQueued) { scrollSaveQueued = true; requestAnimationFrame(saveScroll); }
}, { passive: true });
window.addEventListener("pagehide", saveScroll);

// Every request to the Apps Script gives up after 12s, so "Searching..." can never hang forever
const FETCH_TIMEOUT_MS = 12000;
async function fetchJSON(url) {
  const ctrl = typeof AbortController === "function" ? new AbortController() : null;
  const timer = setTimeout(() => { if (ctrl) ctrl.abort(); }, FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, ctrl ? { signal: ctrl.signal } : undefined);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

function tickCountdown() {
  const total = Math.max(0, Math.floor((WEDDING - Date.now()) / 1000));
  setAll(cdParts.d, pad(Math.floor(total / 86400)));
  setAll(cdParts.h, pad(Math.floor((total % 86400) / 3600)));
  setAll(cdParts.m, pad(Math.floor((total % 3600) / 60)));
  setAll(cdParts.s, pad(total % 60));
}
tickCountdown();
setInterval(tickCountdown, 1000);

document.getElementById("openBtn").addEventListener("click", () => {
  stage.classList.add("is-opened");
  document.body.classList.add("site-opened");
  countdown.setAttribute("aria-hidden", "false");
  storage.set(STORAGE_KEY, "true");
});

// "Click to see our story" (the scroll in the countdown scene): smooth-scroll down to the Love Story section
const storyLink = document.getElementById("storyLink");
if (storyLink) storyLink.addEventListener("click", (e) => {
  e.preventDefault();
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.getElementById("story").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
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
  const ENTOURAGE_API_URL = APPS_SCRIPT_URL;

  // Roles in the sheet are matched without case, extra spaces, punctuation or the word "the" ("Parents of the Groom" = "parents of groom")
  const ROLE_TO_BLOCK = {
    "parents of groom": "parentsGroom", "parents of bride": "parentsBride", "grooms parents": "parentsGroom", "brides parents": "parentsBride",
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
      const block = ROLE_TO_BLOCK[String(e.role || "").toLowerCase().replace(/[\u2019'`.]/g, "").replace(/\bthe\b/g, " ").replace(/\s+/g, " ").trim()];
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
      const data = await fetchJSON(ENTOURAGE_API_URL + "?action=entourage");
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

// RSVP: find your name (?action=search), flip attending or declined, confirm (?action=rsvp), thank-you popup.
(function () {
  const MIN_SEARCH_LENGTH = 4;
  const $ = (id) => document.getElementById(id);
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (!document.getElementById("rsvpPanel")) return;
  const openBtn = $("rsvpOpen"), panel = $("rsvpPanel"), panelInner = panel.querySelector(".rsvp-panel-inner");
  const nameInput = $("nameInput"), lookupStatus = $("lookupStatus");
  const inviteSection = $("inviteSection"), confirmSection = $("confirmSection");
  const inviteName = $("inviteName"), attendToggle = $("attendToggle"), attendLabel = $("attendLabel");
  const confirmBtn = $("confirmBtn"), confirmStatus = $("confirmStatus");
  const overlay = $("thankYouOverlay"), thankYouMessage = $("thankYouMessage"), closeBtn = $("closeThankYouBtn");

  let currentGuest = null, debounceTimer, lookupRequestId = 0;

  const titleCase = (s) => s.split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

  function setStatus(el, text, isError) {
    el.classList.toggle("is-error", !!isError);
    el.textContent = "";
    if (!text) return;
    const dot = document.createElement("span");
    dot.className = "dot";
    el.append(dot, " " + text);
  }

  async function api(params) {
    const query = Object.keys(params).map((k) => k + "=" + encodeURIComponent(params[k])).join("&");
    return fetchJSON(APPS_SCRIPT_URL + "?" + query);
  }

  async function findGuest(query) {
    try {
      const data = await api({ action: "search", q: query });
      return data.ok ? { match: data.match, error: false } : { match: null, error: true };
    } catch (err) {
      return { match: null, error: true };
    }
  }

  async function submitRSVP(guest, status) {
    try {
      const data = await api({ action: "rsvp", id: guest.id, name: guest.name, status: status });
      if (data.ok) guest.status = status;
      return data;
    } catch (err) {
      return { ok: false, error: "connection" };
    }
  }

  // Closed parts are inert so their fields can't be reached with Tab or a screen reader
  function setReveal(section, open) {
    section.classList.toggle("is-open", open);
    section.firstElementChild.toggleAttribute("inert", !open);
  }
  function closeReveals() { setReveal(inviteSection, false); setReveal(confirmSection, false); }

  function setPanel(open) {
    panel.classList.toggle("is-open", open);
    panelInner.toggleAttribute("inert", !open);
    openBtn.setAttribute("aria-expanded", String(open));
  }

  openBtn.addEventListener("click", () => {
    const opening = !panel.classList.contains("is-open");
    setPanel(opening);
    if (opening) {
      setTimeout(() => {
        panel.scrollIntoView({ behavior: reduce.matches ? "auto" : "smooth", block: "start" });
        nameInput.focus({ preventScroll: true });
      }, 350);
    }
  });

  // Under 4 characters, search only once the guest has started a second word, or on Enter
  function meetsSearchThreshold(value) {
    return value.length >= MIN_SEARCH_LENGTH || /\s/.test(value);
  }

  async function handleLookup(value, force) {
    const trimmed = value.trim();
    const requestId = ++lookupRequestId;

    if (!trimmed || (!force && !meetsSearchThreshold(trimmed))) {
      setStatus(lookupStatus, "");
      closeReveals();
      return;
    }

    setStatus(lookupStatus, "Searching\u2026");
    const { match, error } = await findGuest(trimmed);
    if (requestId !== lookupRequestId) return; // a newer search has started
    currentGuest = match;

    if (error) {
      setStatus(lookupStatus, "We couldn\u2019t connect to the server. Please try again in a moment.", true);
      closeReveals();
    } else if (match) {
      setStatus(lookupStatus, "Invitation found \u2014 welcome, " + titleCase(match.name) + ".");
      inviteName.textContent = match.name;
      attendToggle.checked = match.status === "Attending";
      setAttendLabel();
      setReveal(inviteSection, true);
      setReveal(confirmSection, true);
    } else {
      setStatus(lookupStatus, "We couldn\u2019t find that name. Please check the spelling or contact us directly.", true);
      closeReveals();
    }
  }

  nameInput.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => handleLookup(nameInput.value, false), 350);
  });
  nameInput.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    clearTimeout(debounceTimer);
    handleLookup(nameInput.value, true);
  });

  function setAttendLabel() {
    const on = attendToggle.checked;
    attendLabel.textContent = on ? "Joyfully accepts" : "Regretfully declines";
    attendLabel.classList.toggle("is-accept", on);
  }
  attendToggle.addEventListener("change", setAttendLabel);

  confirmBtn.addEventListener("click", async () => {
    if (!currentGuest) return;
    confirmBtn.disabled = true;
    confirmBtn.textContent = "Sending\u2026";
    setStatus(confirmStatus, "");

    const accepted = attendToggle.checked;
    const result = await submitRSVP(currentGuest, accepted ? "Attending" : "Declined");

    confirmBtn.disabled = false;
    confirmBtn.textContent = "Confirm response";

    if (!result.ok) {
      setStatus(confirmStatus, "We couldn\u2019t reach the server. Please try again in a moment.", true);
      return;
    }
    showThankYou(accepted);
  });

  function showThankYou(accepted) {
    const sentiment = accepted ? "We can\u2019t wait to celebrate with you!" : "We\u2019ll miss you, but thank you for letting us know.";
    thankYouMessage.textContent = "Your response has been received. " + sentiment;
    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden"; // the body is the page's scroller
    closeBtn.focus();
  }

  function closeThankYou() {
    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    confirmBtn.focus({ preventScroll: true });
  }
  closeBtn.addEventListener("click", closeThankYou);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) closeThankYou(); });
  document.addEventListener("keydown", (e) => {
    if (!overlay.classList.contains("is-open")) return;
    if (e.key === "Escape") closeThankYou();
    else if (e.key === "Tab") { e.preventDefault(); closeBtn.focus(); } // one button: keep focus inside the popup
  });
})();
