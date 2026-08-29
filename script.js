/* ================================================================
   PHASE 3/4 NOTE:
   GUEST_LIST starts out as local mock data — the same one row = one
   invited person shape as the Google Sheet (Guest ID | Guest Name |
   RSVP | Response Time | Note). APPS_SCRIPT_URL below is now pointed
   at the deployed Apps Script Web App, so loadGuestList() fetches the
   real list from the Sheet on page load and submitRSVP() writes
   responses back to it automatically. If you ever redeploy and get a
   new URL, update it here — the mock GUEST_LIST above stays as a
   fallback if the Sheet can't be reached.
   ================================================================ */

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwOcKL_JDD3cZYx44O-PK31FP94VzL4EMZsNxOZS2mfEs0sXftUsoIXKtGmthAIJgqXxA/exec";

// How many same-surname rows to reveal per "Show N more" click.
const REVEAL_BATCH_SIZE = 5;

// Common generational suffixes that should never be treated as a surname,
// e.g. "Brandon Marson Jr." -> surname is "Marson", not "Jr".
// Matched case-insensitively, with or without a trailing period.
const NAME_SUFFIXES = new Set(["jr", "sr", "i", "ii", "iii", "iv", "v", "vi", "vii", "viii"]);

let GUEST_LIST = [
  { id: "G001", name: "Kimi Czar", status: "Pending" },
  { id: "G002", name: "Merry Chris", status: "Pending" },
  { id: "G003", name: "Marilyn Santos", status: "Pending" }
];

let currentGuest = null;     // the person actually searched for
let currentSimilar = [];     // other guests sharing that person's surname
let revealedCount = 0;       // how many of currentSimilar are shown as rows
let touchedIds = new Set();  // similar-row guest ids the user has actually toggled
const rowInputs = new Map(); // guest id -> that row's checkbox element

/* ---------------------------- guest list source -------------------------------- */
// Fetches the live guest list from the Sheet if APPS_SCRIPT_URL is set;
// otherwise keeps using the mock GUEST_LIST above so the site still works
// before the backend is connected.
async function loadGuestList(){
  if(!APPS_SCRIPT_URL) return;
  try{
    const res = await fetch(`${APPS_SCRIPT_URL}?action=list`);
    const data = await res.json();
    if(data.ok && Array.isArray(data.guests)) GUEST_LIST = data.guests;
  }catch(err){
    console.warn("Could not load guest list from Google Sheet — using mock data.", err);
  }
}
loadGuestList();

async function submitRSVP(guest, status){
  guest.status = status;

  if(!APPS_SCRIPT_URL){
    console.log("RSVP submitted (mock, no Sheet connected)", guest.id, status);
    return { ok: true };
  }

  try{
    const url = `${APPS_SCRIPT_URL}?action=rsvp&id=${encodeURIComponent(guest.id)}&status=${encodeURIComponent(status)}`;
    return await (await fetch(url)).json();
  }catch(err){
    console.warn("Could not reach Google Sheet — RSVP kept locally only.", err);
    return { ok: false, error: err.message };
  }
}

/* ---------------------------- name helpers -------------------------------- */
function parseName(fullName){
  const parts = fullName.trim().split(/\s+/);
  if(parts.length === 1) return { first: parts[0], last: parts[0], suffix: "" };

  const lastToken = parts[parts.length - 1];
  const isSuffix = NAME_SUFFIXES.has(lastToken.replace(/\.$/, "").toLowerCase());

  return isSuffix && parts.length > 2
    ? { first: parts.slice(0, -2).join(" "), last: parts[parts.length - 2], suffix: lastToken }
    : { first: parts.slice(0, -1).join(" "), last: lastToken, suffix: "" };
}

const surnameOf   = fullName => parseName(fullName).last.toLowerCase();
const firstNameOf = fullName => parseName(fullName).first.split(" ")[0];
const titleCase   = str => str.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

/* ---------------------------- lookup -------------------------------- */
// Returns the single best match for the typed query, plus (separately) any
// other guests who share that match's surname. Shared-surname guests are
// never auto-bundled — they only join a submission once their own row is
// actually toggled.
function findGuest(query){
  const q = query.trim().toLowerCase();
  if(!q) return { match: null, similar: [] };

  const match = GUEST_LIST.find(g => g.name.toLowerCase() === q)
             || GUEST_LIST.find(g => g.name.toLowerCase().includes(q))
             || null;
  if(!match) return { match: null, similar: [] };

  const matchSurname = surnameOf(match.name);
  const similar = GUEST_LIST.filter(g => g.id !== match.id && surnameOf(g.name) === matchSurname);
  return { match, similar };
}

/* ---------------------------- DOM references -------------------------------- */
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

const similarToggle = document.getElementById("similarToggle");
const similarSurnameEl = document.getElementById("similarSurname");
const similarRows = document.getElementById("similarRows");

const thankYouOverlay = document.getElementById("thankYouOverlay");
const thankYouMessage = document.getElementById("thankYouMessage");
const closeThankYouBtn = document.getElementById("closeThankYouBtn");

/* ---------------------------- hero: unseal envelope ------------------- */
document.getElementById("openBtn").addEventListener("click", () => {
  envelopeWrap.classList.add("is-unsealed");
  setTimeout(() => hero.classList.add("is-leaving"), 400);
  setTimeout(() => {
    hero.style.display = "none";
    board.classList.add("visible");
  }, 1100);
});

/* ---------------------------- RSVP plaque toggle ------------------------ */
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

/* ---------------------------- name lookup -------------------------------- */
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

function handleLookup(value){
  const trimmed = value.trim();

  if(!trimmed){
    lookupStatus.textContent = "";
    closeSection(inviteSection); closeSection(confirmSection);
    resetSimilar();
    return;
  }

  const { match, similar } = findGuest(trimmed);
  currentGuest = match;

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

/* ---------------------------- shared-surname rows -------------------------------- */
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

// One name+toggle row, shared between the main match and every relative
// revealed under it. Only fires into `touchedIds` when its own switch is
// actually flipped — just being revealed doesn't opt anyone in.
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

  // A "show N more" choice is only meaningful when more than one batch
  // remains — otherwise it's identical to "Show all".
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
    // First time opening: if the whole list already fits in one batch,
    // just show it — a "N more" choice would be pointless.
    if(currentSimilar.length <= REVEAL_BATCH_SIZE) revealedCount = currentSimilar.length;
    renderSimilarRows();
  }

  similarRows.classList.toggle("is-open", opening);
  similarToggle.setAttribute("aria-expanded", String(opening));
});

/* ---------------------------- confirm + thank you -------------------- */
confirmBtn.addEventListener("click", async () => {
  if(!currentGuest) return;
  confirmBtn.disabled = true;
  confirmBtn.textContent = "Sending…";

  const submissions = [{ guest: currentGuest, accepted: attendToggle.checked }];
  touchedIds.forEach(id => {
    const guest = currentSimilar.find(g => g.id === id);
    const input = rowInputs.get(id);
    if(guest && input) submissions.push({ guest, accepted: input.checked });
  });

  for(const { guest, accepted } of submissions){
    await submitRSVP(guest, accepted ? "Attending" : "Declined");
  }

  showThankYou(submissions);

  confirmBtn.disabled = false;
  confirmBtn.textContent = "Confirm response";
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
