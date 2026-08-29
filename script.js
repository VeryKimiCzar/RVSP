/* ================================================================
   PHASE 3/4 NOTE:
   GUEST_LIST stands in for the future Google Sheet. findGuest()
   and submitRSVP() are isolated so they can later be swapped for
   fetch() calls to a Google Apps Script Web App endpoint without
   touching the UI/reveal logic below.
   ================================================================ */

const GUEST_LIST = [
  { id: "czar-001", seats: 4, members: ["Kimi Czar", "Nico Czar", "Bea Czar", "Ella Czar"] },
  { id: "chris-002", seats: 2, members: ["Merry Chris", "Joy Chris"] },
  { id: "delacruz-003", seats: 1, members: ["Andrea Dela Cruz"] }
];

let currentParty = null;

function findGuest(query){
  const q = query.trim().toLowerCase();
  if(!q) return null;
  return GUEST_LIST.find(party =>
    party.members.some(name => name.toLowerCase() === q || name.toLowerCase().includes(q))
  ) || null;
}

function submitRSVP(party, responses){
  // Placeholder for the eventual write to Google Sheets via Apps Script.
  console.log("RSVP submitted", party.id, responses);
  return Promise.resolve({ ok: true });
}

function titleCase(str){
  return str.split(" ").map(w => w ? w.charAt(0).toUpperCase() + w.slice(1) : w).join(" ");
}

/* ---------------------------- hero: unseal envelope ------------------- */
const hero = document.getElementById("hero");
const envelopeWrap = document.getElementById("envelopeWrap");
const board = document.getElementById("board");

document.getElementById("openBtn").addEventListener("click", () => {
  envelopeWrap.classList.add("is-unsealed");
  setTimeout(() => hero.classList.add("is-leaving"), 400);
  setTimeout(() => {
    hero.style.display = "none";
    board.classList.add("visible");
  }, 1100);
});

/* ---------------------------- RSVP plaque toggle ------------------------ */
const rsvpToggle = document.getElementById("rsvpToggle");
const rsvpPanel = document.getElementById("rsvpPanel");

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
const nameInput = document.getElementById("nameInput");
const lookupStatus = document.getElementById("lookupStatus");
const seatsSection = document.getElementById("seatsSection");
const attendanceSection = document.getElementById("attendanceSection");
const confirmSection = document.getElementById("confirmSection");
const thankYouSection = document.getElementById("thankYouSection");
const seatNumber = document.getElementById("seatNumber");
const seatCaption = document.getElementById("seatCaption");
const memberList = document.getElementById("memberList");
const confirmBtn = document.getElementById("confirmBtn");

let debounceTimer;
nameInput.addEventListener("input", () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => handleLookup(nameInput.value), 350);
});
nameInput.addEventListener("keydown", (e) => {
  if(e.key === "Enter"){
    e.preventDefault();
    clearTimeout(debounceTimer);
    handleLookup(nameInput.value);
  }
});

function handleLookup(value){
  const trimmed = value.trim();
  closeSection(thankYouSection);

  if(!trimmed){
    lookupStatus.textContent = "";
    closeSection(seatsSection); closeSection(attendanceSection); closeSection(confirmSection);
    return;
  }

  const party = findGuest(trimmed);
  if(party){
    currentParty = party;
    lookupStatus.classList.remove("is-error");
    lookupStatus.innerHTML = '<span class="dot"></span> Invitation found — welcome, ' + titleCase(trimmed) + '.';
    populateParty(party);
    openSection(seatsSection); openSection(attendanceSection); openSection(confirmSection);
  } else {
    currentParty = null;
    lookupStatus.classList.add("is-error");
    lookupStatus.innerHTML = '<span class="dot"></span> We couldn\'t find that name. Please check the spelling or contact us directly.';
    closeSection(seatsSection); closeSection(attendanceSection); closeSection(confirmSection);
  }
}

function openSection(el){ el.classList.add("is-open"); }
function closeSection(el){ el.classList.remove("is-open"); }

const ROMAN = ["i","ii","iii","iv","v","vi","vii","viii"];

function populateParty(party){
  seatNumber.textContent = party.seats;
  seatCaption.textContent = party.seats === 1 ? "guest included in the invitation" : "guests included in the invitation";

  memberList.innerHTML = "";
  party.members.forEach((name, idx) => {
    const li = document.createElement("li");
    li.className = "member-row";
    li.innerHTML = `
      <span class="member-index">${ROMAN[idx] || (idx+1)}.</span>
      <span class="member-name">${name}</span>
      <div class="member-control">
        <label class="switch">
          <input type="checkbox" checked data-member="${name}" aria-label="${name} attending">
          <span class="track"></span>
          <span class="thumb"></span>
        </label>
        <span class="switch-label is-accept" data-for="${name}">Joyfully accepts</span>
      </div>
    `;
    memberList.appendChild(li);
  });

  memberList.querySelectorAll('input[type="checkbox"]').forEach(box => {
    box.addEventListener("change", () => {
      const label = memberList.querySelector(`.switch-label[data-for="${CSS.escape(box.dataset.member)}"]`);
      if(box.checked){ label.textContent = "Joyfully accepts"; label.classList.add("is-accept"); }
      else { label.textContent = "Regretfully declines"; label.classList.remove("is-accept"); }
    });
  });
}

/* ---------------------------- confirm + thank you -------------------- */
confirmBtn.addEventListener("click", async () => {
  if(!currentParty) return;
  confirmBtn.disabled = true;
  confirmBtn.textContent = "Sending…";

  const responses = {};
  memberList.querySelectorAll('input[type="checkbox"]').forEach(box => {
    responses[box.dataset.member] = box.checked ? "accept" : "decline";
  });

  await submitRSVP(currentParty, responses);

  const thankYouName = document.getElementById("thankYouName");
  thankYouName.textContent = "Thank you, " + currentParty.members[0].split(" ")[0] + "!";

  const summaryList = document.getElementById("summaryList");
  summaryList.innerHTML = "";
  currentParty.members.forEach(name => {
    const state = responses[name];
    const li = document.createElement("li");
    li.innerHTML = `<span>${name}</span>
      <span class="${state === 'accept' ? 'status-accept' : 'status-decline'}">
        ${state === 'accept' ? 'Joyfully accepts' : 'Regretfully declines'}
      </span>`;
    summaryList.appendChild(li);
  });

  openSection(thankYouSection);
  confirmBtn.disabled = false;
  confirmBtn.textContent = "Confirm response";
  thankYouSection.scrollIntoView({ behavior: "smooth", block: "start" });
});

document.getElementById("newSearchBtn").addEventListener("click", () => {
  nameInput.value = "";
  lookupStatus.textContent = "";
  closeSection(seatsSection); closeSection(attendanceSection);
  closeSection(confirmSection); closeSection(thankYouSection);
  currentParty = null;
  rsvpPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  nameInput.focus();
});
