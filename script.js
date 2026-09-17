const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxr_RAl4cYYbmkKhBMQ0jTdFhAfkopi_kwzyDHOElHUGZOJITwMgDCyOE6DRMRv3LCu4w/exec";

const MIN_SEARCH_LENGTH = 4;

let currentGuest = null;

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

const titleCase = str => str.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

function meetsSearchThreshold(trimmedValue){
  if(trimmedValue.length >= MIN_SEARCH_LENGTH) return true;
  // Under the minimum: only search if the first word already looks
  // finished — the guest has typed into a second word (e.g. "Al Reyes").
  // A short name typed alone (e.g. just "Al") still searches on Enter.
  return /\s/.test(trimmedValue);
}

async function findGuest(query){
  if(!APPS_SCRIPT_URL) return { match: null, error: true };

  try{
    const url = `${APPS_SCRIPT_URL}?action=search&q=${encodeURIComponent(query)}`;
    const data = await (await fetch(url)).json();
    if(data.ok) return { match: data.match, error: false };
    return { match: null, error: true };
  }catch(err){
    return { match: null, error: true };
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
  handleLookup(nameInput.value, { force: true });
});

let lookupRequestId = 0;

async function handleLookup(value, { force = false } = {}){
  const trimmed = value.trim();
  const requestId = ++lookupRequestId;

  if(!trimmed){
    lookupStatus.textContent = "";
    closeSection(inviteSection); closeSection(confirmSection);
    return;
  }

  if(!force && !meetsSearchThreshold(trimmed)){
    lookupStatus.textContent = "";
    closeSection(inviteSection); closeSection(confirmSection);
    return;
  }

  lookupStatus.classList.remove("is-error");
  lookupStatus.innerHTML = '<span class="dot"></span> Searching…';

  const { match, error } = await findGuest(trimmed);
  if(requestId !== lookupRequestId) return;
  currentGuest = match;

  if(error){
    lookupStatus.classList.add("is-error");
    lookupStatus.innerHTML = '<span class="dot"></span> We couldn\'t connect to the server. Please try again in a moment.';
    closeSection(inviteSection); closeSection(confirmSection);
    return;
  }

  if(match){
    lookupStatus.classList.remove("is-error");
    lookupStatus.innerHTML = `<span class="dot"></span> Invitation found — welcome, ${titleCase(match.name)}.`;
    populateInvite(match);
    openSection(inviteSection); openSection(confirmSection);
  } else {
    lookupStatus.classList.add("is-error");
    lookupStatus.innerHTML = '<span class="dot"></span> We couldn\'t find that name. Please check the spelling or contact us directly.';
    closeSection(inviteSection); closeSection(confirmSection);
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

confirmBtn.addEventListener("click", async () => {
  if(!currentGuest) return;
  confirmBtn.disabled = true;
  confirmBtn.textContent = "Sending…";
  confirmStatus.textContent = "";
  confirmStatus.classList.remove("is-error");

  const accepted = attendToggle.checked;
  const result = await submitRSVP(currentGuest, accepted ? "Attending" : "Declined");

  confirmBtn.disabled = false;
  confirmBtn.textContent = "Confirm response";

  if(!result.ok){
    confirmStatus.classList.add("is-error");
    confirmStatus.innerHTML = '<span class="dot"></span> We couldn\'t reach the server. Please try again in a moment.';
    return;
  }

  showThankYou(accepted);
});

function showThankYou(accepted){
  const sentiment = accepted
    ? "We can't wait to celebrate with you!"
    : "We'll miss you, but thank you for letting us know.";

  thankYouMessage.textContent = `Your response has been received. ${sentiment}`;
  thankYouOverlay.classList.add("is-open");
}

closeThankYouBtn.addEventListener("click", () => {
  thankYouOverlay.classList.remove("is-open");
});

const ENTOURAGE_ROLE_MAP = {
  "parents of the groom": "entParentsGroom",
  "parents of the bride": "entParentsBride",
  "primary principal": "entPrimaryPrincipal",
  "best man": "entBestMan",
  "maid of honor": "entMaidOfHonor",
  "veil": "entVeil",
  "cord": "entCord",
  "candle": "entCandle",
  "groomsman": "entGroomsmen",
  "bridesmaid": "entBridesmaids",
  "ring bearer": "entRingBearer",
  "coin bearer": "entCoinBearer",
  "bible bearer": "entBibleBearer",
  "flower girl": "entFlowerGirls"
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
  musicHint.classList.add("is-hidden");
  entourageOverlay.classList.add("is-open");
  loadEntourage();
  window.location.hash = 'entourage';
});

// Quietly warm this up in the background while the guest is still on the
// envelope/board, so by the time they tap into the entourage overlay the
// data (and the Apps Script backend) is usually already ready to go.
loadEntourage();
entourageClose.addEventListener("click", () => {
  entourageOverlay.classList.remove("is-open");
  window.location.hash = '';
});
entourageReturn.addEventListener("click", (e) => {
  e.preventDefault();
  entourageOverlay.classList.remove("is-open");
  window.location.hash = '';
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
  musicHint.classList.add("is-hidden");
  detailsOverlay.classList.add("is-open");
  if(!countdownInterval){
    updateCountdown();
    countdownInterval = setInterval(updateCountdown, 1000);
  }
  window.location.hash = 'details';
});
detailsClose.addEventListener("click", () => {
  detailsOverlay.classList.remove("is-open");
  clearInterval(countdownInterval);
  countdownInterval = null;
  window.location.hash = '';
});
detailsReturn.addEventListener("click", (e) => {
  e.preventDefault();
  detailsOverlay.classList.remove("is-open");
  clearInterval(countdownInterval);
  countdownInterval = null;
  window.location.hash = '';
});

// Image functionality for details timeline - click to enlarge
let currentImageOverlay = null;

// Image URLs for venues (you would replace these with actual image URLs)
const venueImages = {
  "Our Lady of the Assumption Parish": "https://via.placeholder.com/400x300?text=Our+Lady+of+the+Assumption+Parish",
  "Socorro's The Venue": "https://via.placeholder.com/400x300?text=Socorro%27s+The+Venue"
};

// Handle clicks on "View on map" links in the details timeline
document.addEventListener("click", (e) => {
  const mapLink = e.target.closest(".detail-event-map");
  if (mapLink) {
    e.preventDefault();

    // Remove any existing image overlay
    if (currentImageOverlay) {
      currentImageOverlay.remove();
      currentImageOverlay = null;
    }

    // Get the venue name from the event
    const detailEvent = mapLink.closest(".detail-event");
    if (!detailEvent) return; // Safety check

    const venueElement = detailEvent.querySelector(".detail-event-venue");
    const venueName = venueElement ? venueElement.textContent.trim() : "";

    // Use a fallback venue name if empty
    const finalVenueName = venueName || "Venue Location";

    // Get image URL for the venue (use fallback if not found)
    const imageUrl = venueImages[finalVenueName] || "https://via.placeholder.com/400x300?text=Venue+Location";

    // Create image overlay container
    const imageOverlay = document.createElement("div");
    imageOverlay.className = "image-overlay";
    imageOverlay.innerHTML = `
      <div class="image-overlay-content">
        <img src="${imageUrl}" alt="${finalVenueName}" class="enlargeable-image">
        <button class="image-close-btn">×</button>
      </div>
    `;

    // Insert the overlay after the clicked link
    mapLink.parentNode.insertBefore(imageOverlay, mapLink.nextSibling);

    // Keep reference to current overlay
    currentImageOverlay = imageOverlay;

    // Add event listeners for closing the overlay
    const closeBtn = imageOverlay.querySelector(".image-close-btn");
    const overlayContent = imageOverlay.querySelector(".image-overlay-content");

    closeBtn.addEventListener("click", () => {
      imageOverlay.remove();
      currentImageOverlay = null;
    });

    // Close when clicking outside the image content
    imageOverlay.addEventListener("click", (clickEvent) => {
      if (clickEvent.target === imageOverlay) {
        imageOverlay.remove();
        currentImageOverlay = null;
      }
    });
  }
});

// Close entourage overlay when clicking outside the panel
entourageOverlay.addEventListener("click", (e) => {
  if (e.target === entourageOverlay) {
    entourageOverlay.classList.remove("is-open");
    window.location.hash = '';
  }
});

// Close details overlay when clicking outside the panel
detailsOverlay.addEventListener("click", (e) => {
  if (e.target === detailsOverlay) {
    detailsOverlay.classList.remove("is-open");
    clearInterval(countdownInterval);
    countdownInterval = null;
    window.location.hash = '';
  }
});

// Check URL hash on page load to determine which overlay to open
function checkUrlHashOnLoad() {
  const hash = window.location.hash.substring(1); // Remove the '#'

  if (hash === 'entourage' || hash === 'details') {
    // Show the main board (skip envelope animation)
    if (hero) hero.style.display = "none";
    if (board) board.classList.add("visible");

    // Also hide the envelope wrap just in case
    if (envelopeWrap) envelopeWrap.classList.remove("is-unsealed");
    if (hero) hero.classList.remove("is-leaving");
  }

  if (hash === 'entourage') {
    if (entourageOverlay) entourageOverlay.classList.add('is-open');
    loadEntourage();
  } else if (hash === 'details') {
    if (detailsOverlay) detailsOverlay.classList.add('is-open');
    if (!countdownInterval) {
      updateCountdown();
      countdownInterval = setInterval(updateCountdown, 1000);
    }
  }
}

// Run the hash check on page load with a small delay to ensure DOM is ready
setTimeout(checkUrlHashOnLoad, 50);
