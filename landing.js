// Home page: an LED-volume ring of screens showing the work.
// Drag to spin it (it keeps your momentum, then eases back to a slow turn),
// move the mouse to tilt it, click a screen to open that project.
const ring = document.getElementById("ring");
const wrap = document.getElementById("ringWrap");
const items = window.PROJECTS.filter((p) => p.ring !== false);
const n = items.length;
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const touch = matchMedia("(hover: none)").matches;

items.forEach((p, i) => {
  const a = document.createElement("a");
  a.className = "panel";
  a.dataset.i = i;
  a.href = `work.html#${p.id}`;
  a.setAttribute("aria-label", p.title);
  a.innerHTML = `<img src="${p.thumb}" alt="" draggable="false" loading="eager">
    <span class="cap"><b>${p.venue}</b><i>${p.title}</i></span>`;
  ring.appendChild(a);
});

function layout() {
  const w = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--panel-w"));
  const r = w / (2 * Math.tan(Math.PI / n)) + 6;
  ring.querySelectorAll(".panel").forEach((p, i) => {
    p.style.transform = `rotateY(${(360 / n) * i}deg) translateZ(${r}px)`;
  });
}
layout();
addEventListener("resize", layout);

/* ── physics: drag, momentum, tilt ────────────────────────── */
const IDLE = reduce ? 0 : -0.12;
let angle = 0, vel = IDLE, dragging = false, moved = 0, lastX = 0;
let tilt = -8, targetTilt = -8;

(function frame() {
  if (!dragging) {
    vel += (IDLE - vel) * 0.02; // ease back to the idle spin
    angle += vel;
  }
  tilt += (targetTilt - tilt) * 0.08;
  ring.style.transform = `rotateX(${tilt}deg) rotateY(${angle}deg)`;
  requestAnimationFrame(frame);
})();

wrap.addEventListener("pointerdown", (e) => {
  dragging = true; moved = 0; lastX = e.clientX;
  try { wrap.setPointerCapture(e.pointerId); } catch {}
  wrap.classList.add("grabbing");
});
wrap.addEventListener("pointermove", (e) => {
  if (!dragging) return;
  const dx = e.clientX - lastX;
  lastX = e.clientX;
  moved += Math.abs(dx);
  vel = dx * 0.25;
  angle += vel;
});
const end = () => { dragging = false; wrap.classList.remove("grabbing"); };
wrap.addEventListener("pointerup", end);
wrap.addEventListener("pointercancel", end);
// a drag shouldn't count as a click on a screen
wrap.addEventListener("click", (e) => { if (moved > 6) e.preventDefault(); }, true);
addEventListener("pointermove", (e) => {
  if (!dragging) targetTilt = -8 + ((e.clientY / innerHeight) - 0.5) * -10;
});

/* ── label next to the cursor (desktop) ───────────────────── */
// The ring keeps turning under a still cursor, so re-check every frame.
const label = document.createElement("div");
label.className = "ring-label";
label.setAttribute("aria-hidden", "true");
document.body.appendChild(label);
let px = -1, py = -1, shown = null;
addEventListener("pointermove", (e) => {
  px = e.clientX; py = e.clientY;
  label.style.left = px + "px";
  label.style.top = py + "px";
});
document.addEventListener("pointerleave", () => { px = py = -1; });
(function track() {
  const hit = px < 0 || dragging || touch ? null : document.elementFromPoint(px, py)?.closest(".panel");
  ring.querySelectorAll(".panel.lit").forEach((el) => el !== hit && el.classList.remove("lit"));
  if (hit !== shown) {
    shown = hit;
    if (hit) {
      const p = items[+hit.dataset.i];
      hit.classList.add("lit");
      label.innerHTML = `<b>${p.venue}</b><i>${p.title}</i>`;
    }
    label.classList.toggle("on", !!hit);
  }
  requestAnimationFrame(track);
})();

/* ── phones: name the screen facing you ───────────────────── */
const front = document.createElement("a");
front.className = "front-cap";
document.getElementById("stage").appendChild(front);
let lastFront = -1;
(function faceTrack() {
  const step = 360 / n;
  const i = (((Math.round(-angle / step)) % n) + n) % n;
  if (i !== lastFront) {
    lastFront = i;
    const p = items[i];
    front.href = `work.html#${p.id}`;
    front.innerHTML = `<b>${p.venue}</b><i>${p.title}</i>`;
    front.classList.remove("pop"); void front.offsetWidth; front.classList.add("pop");
    ring.querySelectorAll(".panel").forEach((el, k) => el.classList.toggle("facing", k === i));
  }
  requestAnimationFrame(faceTrack);
})();
if (touch) {
  const hint = document.querySelector(".hint");
  if (hint) hint.textContent = "swipe to spin · tap a screen";
}

/* ── about panel ──────────────────────────────────────────── */
const about = document.getElementById("about");
const toggleAbout = (open) => {
  about.classList.toggle("open", open);
  about.setAttribute("aria-hidden", String(!open));
};
document.getElementById("aboutBtn").addEventListener("click", (e) => { e.preventDefault(); toggleAbout(true); });
document.getElementById("aboutClose").addEventListener("click", () => toggleAbout(false));
addEventListener("keydown", (e) => { if (e.key === "Escape") toggleAbout(false); });
if (location.hash === "#about") toggleAbout(true);

/* ── about: click the email to copy it ────────────────────── */
const mail = document.getElementById("abMail");
if (mail) {
  const hint = mail.querySelector(".ab-mail-hint");
  mail.addEventListener("click", async () => {
    const addr = mail.dataset.mail;
    try { await navigator.clipboard.writeText(addr); hint.textContent = "copied ✓"; }
    catch { location.href = "mailto:" + addr; return; }
    mail.classList.add("done");
    setTimeout(() => { hint.textContent = "click to copy"; mail.classList.remove("done"); }, 1800);
  });
  // the address leans toward the cursor while you hover it
  mail.addEventListener("pointermove", (e) => {
    const r = mail.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    mail.style.setProperty("--mx", (x * 10).toFixed(1) + "px");
    mail.style.setProperty("--my", (y * 8).toFixed(1) + "px");
  });
  mail.addEventListener("pointerleave", () => { mail.style.setProperty("--mx", "0px"); mail.style.setProperty("--my", "0px"); });
}

/* ── entrance word: merhaba → welcome → willkommen ────────── */
// Each word decodes out of random glyphs, holds, then scrambles into the next,
// like a signal being tuned in. Clicking the word still enters the site.
(() => {
  const el = document.getElementById("word");
  if (!el) return;
  const WORDS = ["merhaba", "welcome", "willkommen"];
  const GLYPHS = "▓▒░█<>/\\|_=+*#01{}[]";
  let i = 0;
  const show = (s) => { el.innerHTML = s; };
  function morph(to, done) {
    const from = el.textContent;
    const len = Math.max(from.length, to.length);
    // each letter settles at its own moment, left to right with a little jitter
    const settle = [...Array(len)].map((_, k) => 6 + k * 2 + Math.floor(Math.random() * 6));
    let f = 0;
    (function tick() {
      let out = "", doneAll = true;
      for (let k = 0; k < len; k++) {
        if (f >= settle[k]) { out += to[k] || ""; continue; }
        doneAll = false;
        out += f < settle[k] - 4 && from[k] && Math.random() < 0.35
          ? from[k]
          : `<i>${GLYPHS[(Math.random() * GLYPHS.length) | 0]}</i>`;
      }
      show(out);
      f++;
      if (doneAll) { el.classList.remove("tuning"); done && done(); }
      else requestAnimationFrame(() => setTimeout(tick, 34));
    })();
    el.classList.add("tuning");
  }
  if (reduce) return; // keep "merhaba" still for reduced motion
  (function loop() {
    setTimeout(() => {
      i = (i + 1) % WORDS.length;
      morph(WORDS[i], loop);
    }, 2400);
  })();
})();
