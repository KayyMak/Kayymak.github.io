// intro.js
//
// The intro state machine, in three states:
//   1. loading — the progress bar fills as the page loads
//   2. ready   — "click to continue", waiting for the visitor
//   3. main    — both overlays gone, the page fades in
//
// Only the home page carries the overlays, so the other pages load straight
// in. The overlays are hidden in CSS by default, so if this file fails to
// load the visitor still lands straight on the page.

// How long the bar takes to fill, assuming the page is already loaded.
const LOADING_MS = 1800;
// Keep the intro available to restore later, but open straight to the page.
const SHOW_INTRO = false;
const SHOW_LOADING_SCREEN = false;

// The bar climbs on a clock, but holds at this mark until the browser says
// every image, stylesheet, and script has finished loading. That way the last
// stretch means something rather than just running out the timer.
const HOLD_AT = 90;

const body = document.body;
const loadingScreen = document.getElementById("loading");
const continueScreen = document.getElementById("click-to-continue");
const fill = document.getElementById("loading-fill");
const readout = document.getElementById("loading-percent");
const nameEl = document.querySelector(".continue-name");
const siteName = document.querySelector(".site-name");

let pageLoaded = document.readyState === "complete";
let startedAt = null;

function showLoading() {
  body.classList.add("intro-active");
  loadingScreen.classList.add("visible");
  requestAnimationFrame(step);
}

function step(now) {
  if (startedAt === null) {
    startedAt = now;
  }

  const elapsed = now - startedAt;
  const onTheClock = Math.min(1, elapsed / LOADING_MS) * 100;
  const percent = pageLoaded ? onTheClock : Math.min(onTheClock, HOLD_AT);

  render(percent);

  if (percent >= 100) {
    showReady();
  } else {
    requestAnimationFrame(step);
  }
}

function render(percent) {
  if (fill) {
    fill.style.width = percent + "%";
  }
  if (readout) {
    readout.textContent = Math.round(percent) + "%";
  }
}

function showReady() {
  loadingScreen.classList.remove("visible");
  continueScreen.classList.add("visible");

  // A click anywhere on the overlay, or any key, moves on.
  continueScreen.addEventListener("click", showMain);
  document.addEventListener("keydown", showMain);
}

function showMain() {
  continueScreen.removeEventListener("click", showMain);
  document.removeEventListener("keydown", showMain);

  // Let the page start fading in underneath while the name is still moving.
  body.classList.remove("intro-active");

  if (!canFly()) {
    continueScreen.classList.remove("visible");
    return;
  }

  flyNameToHeader();
}

function canFly() {
  if (!nameEl || !siteName || typeof nameEl.animate !== "function") {
    return false;
  }

  // A name sliding across the screen is exactly what this setting asks us
  // not to do.
  try {
    return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (err) {
    return true;
  }
}

// FLIP: measure where the word is now, measure where the wordmark sits, then
// animate the difference. The header is already laid out at this point — it
// was only transparent, never absent — so its box is there to be measured.
function flyNameToHeader() {
  siteName.classList.add("handing-off");
  continueScreen.classList.add("exiting");

  const from = nameEl.getBoundingClientRect();
  const to = siteName.getBoundingClientRect();

  // Scale by font size rather than box height: the two have different
  // line-heights, so their boxes are not proportional to their type.
  const fromSize = parseFloat(window.getComputedStyle(nameEl).fontSize);
  const toSize = parseFloat(window.getComputedStyle(siteName).fontSize);
  const scale = fromSize ? toSize / fromSize : 1;

  const dx = to.left - from.left;
  const dy = to.top - from.top;

  // No opacity in the animation: the word stays solid the whole way and the
  // real wordmark takes over on the last frame. Both read "mak" in the same
  // face, so the swap happens where they already coincide.
  const flight = nameEl.animate(
    [
      { transform: "translate(0, 0) scale(1)" },
      { transform: "translate(" + dx + "px, " + dy + "px) scale(" + scale + ")" }
    ],
    {
      duration: 700,
      easing: "cubic-bezier(0.65, 0, 0.35, 1)",
      fill: "forwards"
    }
  );

  flight.finished.then(landed, landed);
}

function landed() {
  // Hide the flown word in the same frame the real one appears. Without this
  // it lingers on top of the wordmark and fades out with the overlay, which
  // read as the word ghosting after it had already landed.
  nameEl.style.visibility = "hidden";
  siteName.classList.remove("handing-off");

  // Drop the overlay outright rather than fading it: the backdrop is already
  // transparent and the word is gone, so there is nothing left to fade.
  continueScreen.classList.add("finished");
  continueScreen.classList.remove("visible", "exiting");
}

// The intro is an arrival, not a page transition. Someone clicking "about"
// from Projects is already inside the site and has seen it, so check where
// they came from: an outside referrer, or none at all, means a fresh visit.
function camefromInsideTheSite() {
  if (!document.referrer) {
    return false;
  }

  try {
    return new URL(document.referrer).origin === window.location.origin;
  } catch (err) {
    return false;
  }
}

// Pages without the overlays, and arrivals from elsewhere on the site, skip it.
if (SHOW_INTRO && loadingScreen && continueScreen && !camefromInsideTheSite()) {
  if (SHOW_LOADING_SCREEN) {
    window.addEventListener("load", function () {
      pageLoaded = true;
    });

    // If the load event never arrives, don't strand the visitor behind the bar.
    setTimeout(function () {
      pageLoaded = true;
    }, LOADING_MS * 3);

    showLoading();
  } else {
    body.classList.add("intro-active");
    showReady();
  }
}
