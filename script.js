// The full navigation remains available when JavaScript is disabled.
document.documentElement.classList.add("js");
const header = document.querySelector(".site-header");
const menuButton = document.querySelector(".menu-toggle");
const navigation = document.getElementById("navigation");
const navigationLinks = [...navigation.querySelectorAll("a")];
const sections = [...navigationLinks]
  .map(link => document.querySelector(link.getAttribute("href")))
  .sort((first, second) => first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1);
menuButton.hidden = false;

function closeMenu() {
  navigation.classList.remove("is-open");
  menuButton.setAttribute("aria-expanded", "false");
  menuButton.querySelector("span").textContent = "+";
}

menuButton.addEventListener("click", () => {
  const open = menuButton.getAttribute("aria-expanded") !== "true";
  navigation.classList.toggle("is-open", open);
  menuButton.setAttribute("aria-expanded", String(open));
  menuButton.querySelector("span").textContent = open ? "−" : "+";
});

navigation.addEventListener("click", event => {
  const link = event.target.closest("a");
  if (!link) return;
  closeMenu();
  // Move focus to the target as well as scrolling, so keyboard users continue there.
  const target = document.querySelector(link.getAttribute("href"));
  target.setAttribute("tabindex", "-1");
  target.focus({ preventScroll: true });
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape" && menuButton.getAttribute("aria-expanded") === "true") {
    closeMenu();
    menuButton.focus();
  }
});

const desktop = window.matchMedia("(min-width: 48rem)");
desktop.addEventListener("change", closeMenu);

// Mark the section at the reading position; short sections and the footer still work.
let framePending = false;
function updateCurrentSection() {
  const readingLine = header.getBoundingClientRect().height + 80;
  let current = null;
  for (const section of sections) {
    if (section.getBoundingClientRect().top <= readingLine) current = section;
  }
  if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4) {
    current = sections[sections.length - 1];
  }
  for (const link of navigationLinks) {
    const active = current !== null && link.getAttribute("href") === `#${current.id}`;
    if (active) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  }
  if (!desktop.matches) {
    const activeLink = navigationLinks.find(link => link.hasAttribute("aria-current"));
    menuButton.firstChild.textContent = activeLink ? `${activeLink.textContent} / Menu ` : "Menu ";
  }
  framePending = false;
}
function scheduleUpdate() {
  if (framePending) return;
  framePending = true;
  requestAnimationFrame(updateCurrentSection);
}
window.addEventListener("scroll", scheduleUpdate, { passive: true });
window.addEventListener("resize", scheduleUpdate);
window.addEventListener("hashchange", scheduleUpdate);
window.addEventListener("load", scheduleUpdate);
updateCurrentSection();
document.getElementById("year").textContent = new Date().getFullYear();

// Animate on entry without hiding content while it waits to enter the viewport.
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const revealed = new WeakSet();
const activeReveals = new Set();
let revealObserver;

function setupReveals() {
  if (revealObserver) revealObserver.disconnect();
  if (reducedMotion.matches) {
    for (const animation of activeReveals) animation.cancel();
    activeReveals.clear();
    return;
  }
  if (!("IntersectionObserver" in window) || !("animate" in Element.prototype)) return;

  revealObserver = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const element = entry.target;
      revealed.add(element);
      revealObserver.unobserve(element);
      const siblings = [...element.parentElement.children];
      const stagger = element.matches(".project, .skills-grid > div")
        ? siblings.indexOf(element) * 70 : 0;
      const animation = element.animate([
        { opacity: 0, transform: "translateY(14px)" },
        { opacity: 1, transform: "translateY(0)" }
      ], {
        duration: 550,
        delay: stagger,
        easing: "cubic-bezier(.2, .7, .2, 1)",
        fill: "backwards"
      });
      activeReveals.add(animation);
      animation.finished.then(
        () => activeReveals.delete(animation),
        () => activeReveals.delete(animation)
      );
    }
  }, { threshold: .08 });

  document.querySelectorAll(
    ".hero h1, .hero-intro, .education-summary, .section-heading, .role, .project, .skills-grid > div, .contact-content"
  ).forEach(element => {
    if (!revealed.has(element)) revealObserver.observe(element);
  });
}

reducedMotion.addEventListener("change", setupReveals);
setupReveals();
