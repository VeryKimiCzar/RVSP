const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycby7M2CM-wCFw-ZcLeiBIB2A3v74MFKrZdPO24kvgEvUL8HvQrPcYpd--HFw75ei82CQqQ/exec";

const REVEAL_BATCH_SIZE = 5;

const NAME_SUFFIXES = new Set(["jr", "sr", "i", "ii", "iii", "iv", "v", "vi", "vii", "viii"]);

let currentGuest = null;
let currentSimilar = [];
let revealedCount = 0;
let touchedIds = new Set();
const rowInputs = new Map();

async function submitRSVP(guest, status){
  if(!APPS_SCRIPT_URL){
    return { ok: false, error: "connection" };
  }

  try{
    const url = `${APPS_SCRIPT_URL}?action=rsvp&id=${encodeURIComponent(guest.id)}&name=${encodeURIComponent(guest.name)}&status=${encodeURIComponent(status)}`;
    const data = await (await fetch(url)).json();
    if(data.ok) guest.status = status;
    return data;
  }catch(err){
    return { ok: false, error: "connection" };
  }
}

function parseName(fullName){
  const parts = fullName.trim().split(/\s+/);
  if(parts.length === 1) return { first: parts[0], last: parts[0], suffix: "" };

  const lastToken = parts[parts.length - 1];
  const isSuffix = NAME_SUFFIXES.has(lastToken.replace(/\.$/, "").toLowerCase());

  return isSuffix && parts.length > 2
    ? { first: parts.slice(0, -2).join(" "), last: parts[parts.length - 2], suffix: lastToken }
    : { first: parts.slice(0, -1).join(" "), last: lastToken, suffix: "" };
}

const surnameOf = fullName => parseName(fullName).last.toLowerCase();
const titleCase = str => str.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

async function findGuest(query){
  if(!APPS_SCRIPT_URL) return { match: null, similar: [], error: true };

  try{
    const url = `${APPS_SCRIPT_URL}?action=search&q=${encodeURIComponent(query)}`;
    const data = await (await fetch(url)).json();
    if(data.ok) return { match: data.match, similar: data.similar || [], error: false };
    return { match: null, similar: [], error: true };
  }catch(err){
    return { match: null, similar: [], error: true };
  }
}

const hero = document.getElementById("hero");
const envelopeWrap = document.getElementById("envelopeWrap");
const board = document.getElementById("board");

const rsvpToggle = document.getElementById("rsvpToggle");
const rsvpPanel = document.getElementById("rsvpPanel");

const nameInput = document.getElementById("nameInput");
const lookupStatus = document.getElementById("lookupStatus");
const inviteSection = document.getElementById("inviteSection");
const confirmSection = document.getElementById("confirmSection");
const inviteName = document.getElementById("inviteName");
const attendToggle = document.getElementById("attendToggle");
const attendLabel = document.getElementById("attendLabel");
const confirmBtn = document.getElementById("confirmBtn");
const confirmStatus = document.getElementById("confirmStatus");

const similarToggle = document.getElementById("similarToggle");
const similarSurnameEl = document.getElementById("similarSurname");
const similarRows = document.getElementById("similarRows");

const thankYouOverlay = document.getElementById("thankYouOverlay");
const thankYouMessage = document.getElementById("thankYouMessage");
const closeThankYouBtn = document.getElementById("closeThankYouBtn");

const entourageOpen = document.getElementById("entourageOpen");
const entourageOverlay = document.getElementById("entourageOverlay");
const entourageClose = document.getElementById("entourageClose");
const entourageReturn = document.getElementById("entourageReturn");
const entourageStatus = document.getElementById("entourageStatus");

const detailsOpen = document.getElementById("detailsOpen");
const detailsOverlay = document.getElementById("detailsOverlay");
const detailsClose = document.getElementById("detailsClose");
const detailsReturn = document.getElementById("detailsReturn");

const musicDisc = document.getElementById("musicDisc");
const musicHint = document.getElementById("musicHint");
const bgMusic = document.getElementById("bgMusic");

document.getElementById("openBtn").addEventListener("click", () => {
  envelopeWrap.classList.add("is-unsealed");
  setTimeout(() => hero.classList.add("is-leaving"), 400);
  setTimeout(() => {
    hero.style.display = "none";
    board.classList.add("visible");
  }, 1100);
});

musicDisc.addEventListener("click", () => {
  if(bgMusic.paused){
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

rsvpToggle.addEventListener("click", () => {
  const opening = !rsvpPanel.classList.contains("is-open");
  rsvpPanel.classList.toggle("is-open", opening);
  if(opening){
    setTimeout(() => {
      rsvpPanel.scrollIntoView({ behavior: "smooth", block: "start" });
      nameInput.focus();
    }, 350);
  }
});

let debounceTimer;
nameInput.addEventListener("input", () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => handleLookup(nameInput.value), 350);
});
nameInput.addEventListener("keydown", (e) => {
  if(e.key !== "Enter") return;
  e.preventDefault();
  clearTimeout(debounceTimer);
  handleLookup(nameInput.value);
});

let lookupRequestId = 0;

async function handleLookup(value){
  const trimmed = value.trim();
  const requestId = ++lookupRequestId;

  if(!trimmed){
    lookupStatus.textContent = "";
    closeSection(inviteSection); closeSection(confirmSection);
    resetSimilar();
    return;
  }

  const { match, similar, error } = await findGuest(trimmed);
  if(requestId !== lookupRequestId) return;
  currentGuest = match;

  if(error){
    lookupStatus.classList.add("is-error");
    lookupStatus.innerHTML = '<span class="dot"></span> We couldn\'t connect to the server. Please try again in a moment.';
    closeSection(inviteSection); closeSection(confirmSection);
    resetSimilar();
    return;
  }

  if(match){
    lookupStatus.classList.remove("is-error");
    lookupStatus.innerHTML = `<span class="dot"></span> Invitation found — welcome, ${titleCase(match.name)}.`;
    populateInvite(match);
    populateSimilar(match, similar);
    openSection(inviteSection); openSection(confirmSection);
  } else {
    lookupStatus.classList.add("is-error");
    lookupStatus.innerHTML = '<span class="dot"></span> We couldn\'t find that name. Please check the spelling or contact us directly.';
    closeSection(inviteSection); closeSection(confirmSection);
    resetSimilar();
  }
}

function openSection(el){ el.classList.add("is-open"); }
function closeSection(el){ el.classList.remove("is-open"); }

function populateInvite(guest){
  inviteName.textContent = guest.name;
  attendToggle.checked = guest.status === "Attending";
  setAttendLabel(attendLabel, attendToggle.checked);
}

function setAttendLabel(labelEl, isAttending){
  labelEl.textContent = isAttending ? "Joyfully accepts" : "Regretfully declines";
  labelEl.classList.toggle("is-accept", isAttending);
}

attendToggle.addEventListener("change", () => setAttendLabel(attendLabel, attendToggle.checked));

function resetSimilar(){
  currentSimilar = [];
  revealedCount = 0;
  touchedIds = new Set();
  rowInputs.clear();
  similarRows.innerHTML = "";
  similarRows.classList.remove("is-open");
  similarToggle.setAttribute("aria-expanded", "false");
  similarToggle.hidden = true;
}

function populateSimilar(match, similar){
  resetSimilar();
  if(!similar.length) return;

  currentSimilar = similar;
  similarSurnameEl.textContent = titleCase(surnameOf(match.name));
  similarToggle.hidden = false;
}

function buildPersonRow(guest){
  const isAttending = guest.status === "Attending";

  const row = document.createElement("div");
  row.className = "person-row";
  row.innerHTML = `
    <span class="person-name">${guest.name}</span>
    <div class="member-control">
      <label class="switch">
        <input type="checkbox" aria-label="${guest.name} attending" ${isAttending ? "checked" : ""}>
        <span class="track"></span>
        <span class="thumb"></span>
      </label>
      <span class="switch-label${isAttending ? " is-accept" : ""}">${isAttending ? "Joyfully accepts" : "Regretfully declines"}</span>
    </div>
  `;

  const input = row.querySelector("input");
  const labelText = row.querySelector(".switch-label");
  input.addEventListener("change", () => {
    setAttendLabel(labelText, input.checked);
    touchedIds.add(guest.id);
  });

  rowInputs.set(guest.id, input);
  return row;
}

function renderSimilarRows(){
  similarRows.innerHTML = "";
  currentSimilar.slice(0, revealedCount).forEach(g => similarRows.appendChild(buildPersonRow(g)));

  const remaining = currentSimilar.length - revealedCount;
  if(remaining <= 0) return;

  const controls = document.createElement("div");
  controls.className = "reveal-more";

  const revealMore = (count) => { revealedCount = Math.min(revealedCount + count, currentSimilar.length); renderSimilarRows(); };

  const showAllBtn = document.createElement("button");
  showAllBtn.type = "button";
  showAllBtn.textContent = "Show all";
  showAllBtn.addEventListener("click", () => revealMore(currentSimilar.length));
  controls.appendChild(showAllBtn);

  if(remaining > REVEAL_BATCH_SIZE){
    const showMoreBtn = document.createElement("button");
    showMoreBtn.type = "button";
    showMoreBtn.textContent = `Show ${REVEAL_BATCH_SIZE} more`;
    showMoreBtn.addEventListener("click", () => revealMore(REVEAL_BATCH_SIZE));
    controls.appendChild(showMoreBtn);
  }

  similarRows.appendChild(controls);
}

similarToggle.addEventListener("click", () => {
  const opening = !similarRows.classList.contains("is-open");

  if(opening && revealedCount === 0 && currentSimilar.length){
    if(currentSimilar.length <= REVEAL_BATCH_SIZE) revealedCount = currentSimilar.length;
    renderSimilarRows();
  }

  similarRows.classList.toggle("is-open", opening);
  similarToggle.setAttribute("aria-expanded", String(opening));
});

confirmBtn.addEventListener("click", async () => {
  if(!currentGuest) return;
  confirmBtn.disabled = true;
  confirmBtn.textContent = "Sending…";
  confirmStatus.textContent = "";
  confirmStatus.classList.remove("is-error");

  const submissions = [{ guest: currentGuest, accepted: attendToggle.checked }];
  touchedIds.forEach(id => {
    const guest = currentSimilar.find(g => g.id === id);
    const input = rowInputs.get(id);
    if(guest && input) submissions.push({ guest, accepted: input.checked });
  });

  const results = [];
  for(const { guest, accepted } of submissions){
    results.push(await submitRSVP(guest, accepted ? "Attending" : "Declined"));
  }

  confirmBtn.disabled = false;
  confirmBtn.textContent = "Confirm response";

  if(results.some(r => !r.ok)){
    confirmStatus.classList.add("is-error");
    confirmStatus.innerHTML = '<span class="dot"></span> We couldn\'t reach the server. Please try again in a moment.';
    return;
  }

  showThankYou(submissions);
});

function showThankYou(submissions){
  const allDeclined = submissions.every(s => !s.accepted);
  const sentiment = allDeclined
    ? "We'll miss you, but thank you for letting us know."
    : "We can't wait to celebrate with you!";

  thankYouMessage.textContent = `Your response has been received. ${sentiment}`;
  thankYouOverlay.classList.add("is-open");
}

closeThankYouBtn.addEventListener("click", () => {
  thankYouOverlay.classList.remove("is-open");
});

const ENTOURAGE_ROLE_MAP = {
  "primary principal": "entPrimaryPrincipal",
  "best man": "entBestMan",
  "maid of honor": "entMaidOfHonor",
  "veil": "entVeil",
  "cord": "entCord",
  "candle": "entCandle",
  "bridesmaid": "entBridesmaids",
  "groomsman": "entGroomsmen"
};

let entourageLoaded = false;

async function loadEntourage(){
  if(entourageLoaded) return;
  entourageStatus.textContent = "";
  entourageStatus.classList.remove("is-error");

  if(!APPS_SCRIPT_URL){
    showEntourageError();
    return;
  }

  try{
    const data = await (await fetch(`${APPS_SCRIPT_URL}?action=entourage`)).json();
    if(!data.ok) throw new Error();
    renderEntourage(data.entourage || []);
    entourageLoaded = true;
  }catch(err){
    showEntourageError();
  }
}

function showEntourageError(){
  entourageStatus.classList.add("is-error");
  entourageStatus.innerHTML = '<span class="dot"></span> We couldn\'t load the entourage list. Please try again in a moment.';
}

function renderEntourage(entries){
  const grouped = {};
  entries.forEach(entry => {
    const containerId = ENTOURAGE_ROLE_MAP[entry.role.toLowerCase()];
    if(!containerId) return;
    if(!grouped[containerId]) grouped[containerId] = [];
    grouped[containerId].push(entry.name);
  });

  Object.values(ENTOURAGE_ROLE_MAP).forEach(containerId => {
    const container = document.getElementById(containerId);
    if(!container) return;
    container.innerHTML = "";

    const names = grouped[containerId];
    if(names && names.length){
      names.forEach(name => {
        const pill = document.createElement("div");
        pill.className = "ent-pill";
        pill.textContent = name;
        container.appendChild(pill);
      });
    } else {
      container.appendChild(document.createElement("div")).className = "ent-pill";
    }
  });
}

entourageOpen.addEventListener("click", () => {
  entourageOverlay.classList.add("is-open");
  loadEntourage();
});
entourageClose.addEventListener("click", () => {
  entourageOverlay.classList.remove("is-open");
});
entourageReturn.addEventListener("click", (e) => {
  e.preventDefault();
  entourageOverlay.classList.remove("is-open");
});

// Ceremony start time — also the countdown's target and the day the
// calendar highlights. Update this if the date/time ever changes.
const WEDDING_DATE = new Date(2026, 11, 8, 14, 30); // Dec 8, 2026, 2:30 PM
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const calendarMonthLabel = document.getElementById("calendarMonthLabel");
const calendarGrid = document.getElementById("calendarGrid");
const cdDays = document.getElementById("cdDays");
const cdHours = document.getElementById("cdHours");
const cdMinutes = document.getElementById("cdMinutes");
const cdSeconds = document.getElementById("cdSeconds");

let countdownInterval = null;

function buildCalendar(){
  const year = WEDDING_DATE.getFullYear();
  const month = WEDDING_DATE.getMonth();
  const targetDay = WEDDING_DATE.getDate();

  calendarMonthLabel.textContent = `${MONTH_NAMES[month]} ${year}`;
  calendarGrid.innerHTML = "";

  ["S", "M", "T", "W", "T", "F", "S"].forEach(d => {
    const dow = document.createElement("span");
    dow.className = "mini-calendar-dow";
    dow.textContent = d;
    calendarGrid.appendChild(dow);
  });

  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for(let i = 0; i < firstWeekday; i++){
    calendarGrid.appendChild(document.createElement("span"));
  }
  for(let day = 1; day <= daysInMonth; day++){
    const cell = document.createElement("span");
    cell.className = "mini-calendar-day" + (day === targetDay ? " is-target" : "");
    cell.textContent = day;
    calendarGrid.appendChild(cell);
  }
}

function updateCountdown(){
  const remaining = WEDDING_DATE - new Date();
  const clamped = Math.max(remaining, 0);

  const days = Math.floor(clamped / 86400000);
  const hours = Math.floor((clamped % 86400000) / 3600000);
  const minutes = Math.floor((clamped % 3600000) / 60000);
  const seconds = Math.floor((clamped % 60000) / 1000);

  cdDays.textContent = String(days).padStart(2, "0");
  cdHours.textContent = String(hours).padStart(2, "0");
  cdMinutes.textContent = String(minutes).padStart(2, "0");
  cdSeconds.textContent = String(seconds).padStart(2, "0");
}

buildCalendar(); // static — only needs to run once

detailsOpen.addEventListener("click", () => {
  detailsOverlay.classList.add("is-open");
  if(!countdownInterval){
    updateCountdown();
    countdownInterval = setInterval(updateCountdown, 1000);
  }
});
detailsClose.addEventListener("click", () => {
  detailsOverlay.classList.remove("is-open");
  clearInterval(countdownInterval);
  countdownInterval = null;
});
detailsReturn.addEventListener("click", (e) => {
  e.preventDefault();
  detailsOverlay.classList.remove("is-open");
  clearInterval(countdownInterval);
  countdownInterval = null;
});
