// Graphics page play layer.
// 1. "unlock grid": the pieces come loose and float, slow and heavy, nudging each other.
//    Grab one and throw it; it slides to a stop and stays where it lands. "lock grid" sends
//    every piece back to its place in the grid.
// 2. Social site only: the queer backgammon "unlearning design" section at the top.
(() => {
  const wall = document.getElementById("masonry");
  if (!wall) return;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ── control: sits just above the grid, on the right ──── */
  const ctl = document.createElement("div");
  ctl.className = "pl-ctl";
  ctl.innerHTML = `<button type="button" class="pl-unlock" aria-pressed="false"><span class="pl-lock" aria-hidden="true"></span><span class="pl-t">unlock grid</span></button>`;
  wall.parentNode.insertBefore(ctl, wall);
  const btnUnlock = ctl.querySelector(".pl-unlock"), label = ctl.querySelector(".pl-t");

  /* ── unlocked: pieces float ───────────────────────────── */
  let free = false, pieces = [], raf = 0, order = [];
  function unlock() {
    if (free) return;
    free = true;
    order = [...wall.children];
    const wr = wall.getBoundingClientRect();
    pieces = [...wall.querySelectorAll(".gw-item")].map((el) => {
      const r = el.getBoundingClientRect();
      return { el, x: r.left - wr.left, y: r.top - wr.top, w: r.width, h: r.height, m: (r.width * r.height) / 60000,
        vx: 0, vy: 0, rot: 0, av: 0, ph: Math.random() * 100, pinned: false, held: false };
    });
    wall.style.height = wall.offsetHeight + "px";
    wall.classList.add("free");
    pieces.forEach((p, k) => Object.assign(p.el.style, { position: "absolute", left: 0, top: 0, width: p.w + "px", height: p.h + "px", zIndex: 1 + k }));
    btnUnlock.setAttribute("aria-pressed", "true");
    label.textContent = "lock grid";
    // a soft first push, as if the grid just let go
    if (!reduce) pieces.forEach((p) => { p.vx = (Math.random() - 0.5) * 1.2; p.vy = (Math.random() - 0.5) * 1.2; p.av = (Math.random() - 0.5) * 0.12; });
    last = performance.now();
    tick();
  }

  // slow, heavy drift: a weak flow field pushes the pieces, drag slows them, they nudge each other
  const MAX = 0.32, DRAG = 0.985, FLOW = 0.0035;
  let last = 0;
  function tick() {
    cancelAnimationFrame(raf);
    const now = performance.now(), k = Math.min(3, (now - last) / 16.7); last = now;
    const W = wall.clientWidth, H = wall.clientHeight, t = now / 1000;
    if (!reduce) {
      for (const p of pieces) {
        if (p.held) continue;
        if (p.pinned) {                       // thrown or placed: slide to a stop, then stay
          p.vx *= Math.pow(0.93, k); p.vy *= Math.pow(0.93, k); p.av *= Math.pow(0.9, k);
        } else {
          const fx = Math.sin(t * 0.13 + p.ph) + Math.sin(t * 0.07 + p.ph * 1.7) * 0.6;
          const fy = Math.cos(t * 0.11 + p.ph * 1.3) + Math.cos(t * 0.05 + p.ph * 0.4) * 0.6;
          p.vx += (fx * FLOW / p.m) * k; p.vy += (fy * FLOW / p.m) * k;
          const d = Math.pow(DRAG, k); p.vx *= d; p.vy *= d;
          const sp = Math.hypot(p.vx, p.vy);
          if (sp > MAX) { const f = 1 - (1 - MAX / sp) * 0.05 * k; p.vx *= f; p.vy *= f; }
          p.av += (p.vx * 0.004 - p.rot * 0.0008) * k; p.av *= Math.pow(0.97, k);
        }
      }
      // pieces push each other apart a little when they overlap (heavier ones push harder)
      for (let i = 0; i < pieces.length; i++) for (let j = i + 1; j < pieces.length; j++) {
        const a = pieces[i], b = pieces[j];
        const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
        const oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
        if (ox < Math.min(a.w, b.w) * 0.3 || oy < Math.min(a.h, b.h) * 0.3) continue;  // small overlaps are fine, like paper on a table
        const dx = (b.x + b.w / 2) - (a.x + a.w / 2), dy = (b.y + b.h / 2) - (a.y + a.h / 2);
        const len = Math.hypot(dx, dy) || 1, push = Math.min(ox, oy) * 0.00012 * k;
        const ia = a.held || a.pinned ? 0 : 1 / a.m, ib = b.held || b.pinned ? 0 : 1 / b.m, s = ia + ib || 1;
        a.vx -= dx / len * push * ia / s * 2; a.vy -= dy / len * push * ia / s * 2;
        b.vx += dx / len * push * ib / s * 2; b.vy += dy / len * push * ib / s * 2;
      }
      for (const p of pieces) {
        if (p.held) continue;
        p.x += p.vx * k; p.y += p.vy * k; p.rot += p.av * k;
        if (p.rot > 8) { p.rot = 8; p.av *= -0.4; } else if (p.rot < -8) { p.rot = -8; p.av *= -0.4; }
        // soft walls: lose some energy on the bounce
        if (p.x < -p.w * 0.1) { p.x = -p.w * 0.1; p.vx = Math.abs(p.vx) * 0.45; }
        if (p.x > W - p.w * 0.9) { p.x = W - p.w * 0.9; p.vx = -Math.abs(p.vx) * 0.45; }
        if (p.y < 0) { p.y = 0; p.vy = Math.abs(p.vy) * 0.45; }
        if (p.y > H - p.h * 0.7) { p.y = H - p.h * 0.7; p.vy = -Math.abs(p.vy) * 0.45; }
      }
    }
    for (const p of pieces) p.el.style.transform = `translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px) rotate(${p.rot.toFixed(2)}deg)`;
    if (free) raf = requestAnimationFrame(tick);
  }

  // back to the grid: every piece glides from where it is to its own slot, in the original order
  function lock() {
    if (!free) return;
    free = false;
    cancelAnimationFrame(raf);
    drag = null;
    const before = new Map(pieces.map((p) => [p.el, { r: p.el.getBoundingClientRect(), rot: p.rot }]));
    order.forEach((el) => wall.appendChild(el));
    pieces.forEach((p) => { p.el.removeAttribute("style"); p.el.classList.remove("held"); });
    wall.style.height = "";
    wall.classList.remove("free");
    btnUnlock.setAttribute("aria-pressed", "false");
    label.textContent = "unlock grid";
    if (!reduce) pieces.forEach((p, k) => {
      const a = before.get(p.el), b = p.el.getBoundingClientRect();
      // compare centres: rotation changes a piece's bounding box
      const dx = (a.r.left + a.r.width / 2) - (b.left + b.width / 2), dy = (a.r.top + a.r.height / 2) - (b.top + b.height / 2);
      p.el.animate([{ transform: `translate(${dx}px, ${dy}px) rotate(${a.rot.toFixed(1)}deg)` }, { transform: "none" }],
        { duration: 700 + k * 25, easing: "cubic-bezier(.2,.8,.2,1)" });
    });
    pieces = [];
  }
  btnUnlock.addEventListener("click", () => (free ? lock() : unlock()));

  // the filters rebuild the grid: drop back to the tidy grid first
  new MutationObserver(() => {
    if (free && !wall.querySelector(".gw-item[style]")) {
      free = false; cancelAnimationFrame(raf); drag = null; wall.style.height = ""; wall.classList.remove("free");
      label.textContent = "unlock grid"; btnUnlock.setAttribute("aria-pressed", "false"); pieces = [];
    }
  }).observe(wall, { childList: true });

  /* ── drag + throw (only while unlocked); a drag never opens the lightbox ── */
  let drag = null, lastMoved = 0, topZ = 100;
  wall.addEventListener("pointerdown", (e) => {
    if (!free) return;
    const p = pieces.find((q) => q.el === e.target.closest(".gw-item"));
    if (!p) return;
    e.preventDefault();
    p.held = true; p.vx = p.vy = 0;
    p.el.style.zIndex = ++topZ;
    p.el.classList.add("held");
    drag = { p, sx: e.clientX, sy: e.clientY, x0: p.x, y0: p.y, lx: e.clientX, ly: e.clientY, lt: performance.now(), moved: 0 };
    try { wall.setPointerCapture(e.pointerId); } catch {}
  });
  wall.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const { p } = drag, now = performance.now(), dt = Math.max(8, now - drag.lt);
    // smoothed release velocity, in px per frame
    p.vx = p.vx * 0.5 + (e.clientX - drag.lx) * (16.7 / dt) * 0.5;
    p.vy = p.vy * 0.5 + (e.clientY - drag.ly) * (16.7 / dt) * 0.5;
    p.av = p.vx * 0.05;
    drag.lx = e.clientX; drag.ly = e.clientY; drag.lt = now;
    p.x = drag.x0 + e.clientX - drag.sx; p.y = drag.y0 + e.clientY - drag.sy;
    drag.moved = Math.max(drag.moved, Math.abs(e.clientX - drag.sx) + Math.abs(e.clientY - drag.sy));
    if (reduce) tick();
  });
  const drop = () => {
    if (!drag) return;
    const { p, moved } = drag;
    p.held = false;
    p.el.classList.remove("held");
    if (moved > 5) p.pinned = true; else { p.vx = p.vy = 0; } // you put it there, so it stays there
    lastMoved = moved;
    drag = null;
  };
  wall.addEventListener("pointerup", drop);
  wall.addEventListener("pointercancel", drop);
  wall.addEventListener("click", (e) => { if (free && lastMoved > 5) { e.stopPropagation(); e.preventDefault(); lastMoved = 0; } }, true);

  /* ── social site: queer backgammon, "unlearning design" ──────────────── */
  if (window.SIDE === "social" && window.QBG_SERIES) {
    const sec = document.createElement("section");
    sec.className = "qf";
    sec.id = "qbg";
    sec.innerHTML = `
      <p class="qf-kicker">queer backgammon · since spring 2025</p>
      <h2>unlearning <em>design</em></h2>
      <div class="qf-body">
        <div class="qf-text">
          <p class="qf-lead">Since finishing Ruben Pater’s <em>CAPS LOCK</em> in spring 2025, I’ve been taking my own training apart.</p>
          <p>A lot of what we call “good design” is a taste we were sold: slick, Western, built for convenience, made to move product. So I draw by hand, screenshot my notes app, and leave things broken on purpose. In the era of AI, the human and the imperfect feel more valuable than ever.</p>
          <p>True anti-design probably isn’t possible. Sooner or later, everything gets turned into a look someone can sell. So it’s a direction more than a destination: design for the people in the room, not for the market.</p>
          <p>Queer backgammon is where I push it furthest. Every flyer, zine and sticker below.</p>
          <a class="qf-link" href="https://queerbackgammon.com" target="_blank" rel="noopener">queerbackgammon.com ↗</a>
        </div>
        <ol class="qf-rules">
          <li>draw it by hand</li>
          <li>a screenshot is a layout</li>
          <li>leave it a little broken</li>
          <li>make it for the room, not the feed</li>
        </ol>
      </div>
      <div class="qf-strip" tabindex="0" aria-label="Queer backgammon flyers, scroll sideways">
        ${QBG_SERIES.map((t, k) => `<figure class="qf-item"><button type="button" aria-label="Open ${t.label}"><img src="${t.src}" alt="${t.label}" loading="lazy" draggable="false"></button><figcaption>QB-${String(k + 1).padStart(2, "0")} · ${t.label}</figcaption></figure>`).join("")}
      </div>
      <p class="qf-after">everything else <span>↓</span></p>`;
    const anchor = document.querySelector(".g-head");
    anchor.parentNode.insertBefore(sec, anchor.nextSibling);

    // drag the strip sideways with a mouse (touch scrolls natively)
    const strip = sec.querySelector(".qf-strip");
    let sd = null, sMoved = 0;
    strip.addEventListener("pointerdown", (e) => { if (e.pointerType !== "mouse") return; sd = { x: e.clientX, s: strip.scrollLeft }; sMoved = 0; });
    addEventListener("pointermove", (e) => { if (!sd) return; sMoved = Math.abs(e.clientX - sd.x); strip.scrollLeft = sd.s - (e.clientX - sd.x); });
    addEventListener("pointerup", () => { sd = null; });

    // look closer
    const look = document.createElement("div");
    look.className = "qf-look";
    look.setAttribute("role", "dialog");
    document.body.appendChild(look);
    const close = () => look.classList.remove("on");
    look.addEventListener("click", close);
    addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
    strip.addEventListener("click", (e) => {
      const b = e.target.closest(".qf-item button");
      if (!b || sMoved > 5) return;
      const img = b.querySelector("img");
      look.innerHTML = `<img src="${img.src}" alt="${img.alt}"><p>${b.parentNode.querySelector("figcaption").textContent}</p>`;
      look.classList.add("on");
    });
    // phones: a flyer shows its own colours while touched
    strip.addEventListener("touchstart", (e) => e.target.closest(".qf-item")?.classList.add("pressed"), { passive: true });
    strip.addEventListener("touchend", () => setTimeout(() => strip.querySelectorAll(".pressed").forEach((el) => el.classList.remove("pressed")), 450));
    if (location.hash === "#qbg") setTimeout(() => sec.scrollIntoView({ behavior: "smooth", block: "start" }), 300);
  }
})();
