const MAX_CHARGE = 100;
const BLAST_DAMAGE = 1;
const TOTAL_HEARTS = 3;
const BOOST_AMOUNT = 25;

const state = {
  round: 1,
  active: false,
  players: {
    1: { charge: 0, hearts: TOTAL_HEARTS, lastTap: 0 },
    2: { charge: 0, hearts: TOTAL_HEARTS, lastTap: 0 },
  },
};

const elements = {
  arena: document.getElementById("arena"),
  centerBanner: document.getElementById("center-banner"),
  startButton: document.getElementById("start-btn"),
  round: document.getElementById("round"),
  p1Charge: document.getElementById("p1-charge"),
  p2Charge: document.getElementById("p2-charge"),
  p1Hearts: document.getElementById("p1-hearts"),
  p2Hearts: document.getElementById("p2-hearts"),
  p1Action: document.getElementById("p1-action"),
  p2Action: document.getElementById("p2-action"),
  p1Boost: document.getElementById("p1-boost"),
  p2Boost: document.getElementById("p2-boost"),
  blast: document.getElementById("blast"),
  resetButton: document.getElementById("reset-btn"),
  howButton: document.getElementById("how-btn"),
  overlay: document.getElementById("overlay"),
  closeOverlay: document.getElementById("close-overlay"),
};

const lanes = document.querySelectorAll(".lane");

const renderHearts = () => {
  [1, 2].forEach((player) => {
    const hearts = "❤".repeat(state.players[player].hearts);
    const empty = "♡".repeat(TOTAL_HEARTS - state.players[player].hearts);
    elements[`p${player}Hearts`].textContent = `${hearts}${empty}`;
  });
};

const renderCharge = (player) => {
  const { charge } = state.players[player];
  const percent = Math.min(charge, MAX_CHARGE);
  elements[`p${player}Charge`].style.width = `${percent}%`;
  elements[`p${player}Action`].textContent =
    percent >= MAX_CHARGE ? "Charged!" : "Tap to Charge";
};

const setBanner = (message, buttonText) => {
  elements.centerBanner.querySelector("h1").textContent = message;
  elements.centerBanner.querySelector("p").textContent =
    "Tap your side to build charge. Reach 100 to fire a blast!";
  elements.startButton.textContent = buttonText;
  elements.centerBanner.classList.remove("hidden");
};

const hideBanner = () => {
  elements.centerBanner.classList.add("hidden");
};

const showBlast = (player) => {
  const lane = document.getElementById(player === 1 ? "lane-right" : "lane-left");
  const rect = lane.getBoundingClientRect();
  elements.blast.style.left = `${rect.left + rect.width / 2 - 60}px`;
  elements.blast.style.top = `${rect.top + rect.height / 2 - 60}px`;
  elements.blast.style.background =
    player === 1
      ? "radial-gradient(circle, rgba(79,209,255,0.95), rgba(79,209,255,0.1))"
      : "radial-gradient(circle, rgba(255,92,213,0.95), rgba(255,92,213,0.1))";
  elements.blast.classList.add("show");
  setTimeout(() => elements.blast.classList.remove("show"), 500);
};

const fireBlast = (player) => {
  const opponent = player === 1 ? 2 : 1;
  showBlast(player);
  state.players[opponent].hearts = Math.max(
    0,
    state.players[opponent].hearts - BLAST_DAMAGE
  );
  state.players[player].charge = 0;
  renderCharge(player);
  renderHearts();

  if (state.players[opponent].hearts === 0) {
    state.active = false;
    setBanner(`Player ${player} Wins!`, "Rematch");
  }
};

const addCharge = (player, amount) => {
  if (!state.active) return;
  state.players[player].charge = Math.min(
    MAX_CHARGE,
    state.players[player].charge + amount
  );
  renderCharge(player);

  if (state.players[player].charge >= MAX_CHARGE) {
    fireBlast(player);
  }
};

const triggerBoost = (player) => {
  const boost = elements[`p${player}Boost`];
  boost.classList.remove("active");
  addCharge(player, BOOST_AMOUNT);
};

const scheduleBoosts = () => {
  [1, 2].forEach((player) => {
    const boost = elements[`p${player}Boost`];
    const delay = 1500 + Math.random() * 3000;
    setTimeout(() => {
      if (!state.active) return;
      boost.classList.add("active");
      setTimeout(() => boost.classList.remove("active"), 2200);
    }, delay);
  });
};

const resetMatch = () => {
  state.round = 1;
  state.active = false;
  state.players[1].charge = 0;
  state.players[2].charge = 0;
  state.players[1].hearts = TOTAL_HEARTS;
  state.players[2].hearts = TOTAL_HEARTS;
  renderHearts();
  renderCharge(1);
  renderCharge(2);
  elements.round.textContent = `Round ${state.round}`;
  elements.p1Boost.classList.remove("active");
  elements.p2Boost.classList.remove("active");
  setBanner("Tap Clash Duo", "Start Match");
};

lanes.forEach((lane) => {
  lane.addEventListener("pointerdown", (event) => {
    if (!state.active) return;
    const player = Number(lane.dataset.player);
    const now = Date.now();
    if (now - state.players[player].lastTap < 70) return;
    state.players[player].lastTap = now;
    addCharge(player, 8);

    const pulse = document.createElement("span");
    pulse.className = "tap-pulse";
    pulse.style.left = `${event.offsetX}px`;
    pulse.style.top = `${event.offsetY}px`;
    lane.appendChild(pulse);
    setTimeout(() => pulse.remove(), 400);
  });
});

[1, 2].forEach((player) => {
  elements[`p${player}Boost`].addEventListener("click", (event) => {
    event.stopPropagation();
    if (!state.active) return;
    triggerBoost(player);
  });
});

const addPulseStyles = () => {
  const style = document.createElement("style");
  style.textContent = `
    .tap-pulse {
      position: absolute;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 2px solid rgba(255, 255, 255, 0.7);
      transform: translate(-50%, -50%);
      animation: pulse 0.4s ease-out forwards;
      pointer-events: none;
    }

    @keyframes pulse {
      from { transform: translate(-50%, -50%) scale(0.5); opacity: 0.9; }
      to { transform: translate(-50%, -50%) scale(2.5); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
};

const startMatch = () => {
  state.active = true;
  hideBanner();
  scheduleBoosts();
};

const openOverlay = () => elements.overlay.classList.add("active");
const closeOverlay = () => elements.overlay.classList.remove("active");

elements.startButton.addEventListener("click", () => {
  if (!state.active) {
    if (state.players[1].hearts === 0 || state.players[2].hearts === 0) {
      resetMatch();
    }
    startMatch();
  }
});

elements.resetButton.addEventListener("click", resetMatch);

elements.howButton.addEventListener("click", openOverlay);

elements.closeOverlay.addEventListener("click", closeOverlay);

elements.overlay.addEventListener("click", (event) => {
  if (event.target === elements.overlay) {
    closeOverlay();
  }
});

addPulseStyles();
resetMatch();
