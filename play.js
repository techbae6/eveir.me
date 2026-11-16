// Graphics page play layer.
// 1. "unlock grid": the pieces come loose and drift slowly around, a bit chaotic. Grab one
//    and fling it; a piece you put down stays where you left it. "lock" glides them home.
// 2. "shuffle": deals the grid in a new order (or tosses everything when it's unlocked).
// 3. Social site only: the queer backgammon "less designed" section at the top.
(() => {
  const wall = document.getElementById("masonry");
  if (!wall) return;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const head = document.querySelector(".g-head-text") || document.querySelector(".g-head");

  /* ── controls ─────────────────────────────────────────── */
  const ctl = document.createElement("div");
  ctl.className = "pl-ctl";
  ctl.innerHTML = `<button type="button" class="pl-unlock" aria-pressed="false"><span class="pl-lock" aria-hidden="true"></span><span class="pl-t">unlock grid</span></button><button type="button" class="pl-shuffle">shuffle</button>`;
  head.appendChild(ctl);
  const btnUnlock = ctl.querySelector(".pl-unlock"), label = ctl.querySelector(".pl-t");

  /* ── FLIP helper: animate pieces from where they were to where they are now ── */
  const rects = () => new Map([...wall.querySelectorAll(".gw-item")].map((el) => [el, el.getBoundingClientRect()]));
  function flip(before, extra = () => "") {
    if (reduce) return;
    wall.querySelectorAll(".gw-item").forEach((el, k) => {
      const a = before.get(el), b = el.getBoundingClientRect();
      if (!a) return;
      const dx = a.left - b.left, dy = a.top - b.top;
      el.animate([{ transform: `translate(${dx}px, ${dy}px) ${extra(el)}` }, { transform: "none" }],
        { duration: 650 + k * 12, easing: "cubic-bezier(.2,.8,.2,1)" });
    });
  }

  /* ── unlocked: pieces float ───────────────────────────── */
  let free = false, pieces = [], raf = 0;
  function unlock() {
    if (free) return;
    free = true;
    const wr = wall.getBoundingClientRect();
    pieces = [...wall.querySelectorAll(".gw-item")].map((el) => {
      const r = el.getBoundingClientRect();
      return { el, x: r.left - wr.left, y: r.top - wr.top, w: r.width, h: r.height,
        vx: (Math.random() - 0.5) * 0.9, vy: (Math.random() - 0.5) * 0.9, rot: 0,
        ph: Math.random() * 6.28, spin: 0.4 + Math.random() * 0.6, pinned: false, held: false };
    });
    wall.style.height = wall.offsetHeight + "px";
    wall.classList.add("free");
    pieces.forEach((p, k) => Object.assign(p.el.style, { position: "absolute", left: 0, top: 0, width: p.w + "px", height: p.h + "px", zIndex: 1 + k }));
    btnUnlock.setAttribute("aria-pressed", "true");
    label.textContent = "lock grid";
    document.body.classList.add("grid-free");
    if (!reduce) toss(0.6);
    tick();
  }
  function tick() {
    cancelAnimationFrame(raf);
    const W = wall.clientWidth, H = wall.clientHeight, t = performance.now() / 1000;
    pieces.forEach((p) => {
      if (!p.held && !reduce) {
        if (!p.pinned) {
          // wander: a slow, slightly restless drift
          p.vx += Math.sin(t * 0.7 + p.ph) * 0.012 + (Math.random() - 0.5) * 0.02;
          p.vy += Math.cos(t * 0.6 + p.ph * 1.3) * 0.012 + (Math.random() - 0.5) * 0.02;
          const sp = Math.hypot(p.vx, p.vy), max = 0.9;
          if (sp > max) { p.vx *= 0.96; p.vy *= 0.96; }
          p.rot = Math.sin(t * p.spin + p.ph) * 5;
        } else { p.vx *= 0.9; p.vy *= 0.9; }
        p.x += p.vx; p.y += p.vy;
        // bounce softly off the edges of the wall
        if (p.x < -p.w * 0.15) { p.x = -p.w * 0.15; p.vx = Math.abs(p.vx) * 0.6; }
        if (p.x > W - p.w * 0.85) { p.x = W - p.w * 0.85; p.vx = -Math.abs(p.vx) * 0.6; }
        if (p.y < 0) { p.y = 0; p.vy = Math.abs(p.vy) * 0.6; }
        if (p.y > H - p.h * 0.6) { p.y = H - p.h * 0.6; p.vy = -Math.abs(p.vy) * 0.6; }
      }
      p.el.style.transform = `translate(${p.x}px, ${p.y}px) rotate(${p.rot.toFixed(2)}deg)`;
    });
    if (free) raf = requestAnimationFrame(tick);
  }
  function toss(power = 1) {
    pieces.forEach((p) => { p.pinned = false; p.vx = (Math.random() - 0.5) * 14 * power; p.vy = (Math.random() - 0.5) * 14 * power; });
  }
  function lock(animate = true) {
    if (!free) return;
    free = false;
    cancelAnimationFrame(raf);
    const before = rects(), rot = new Map(pieces.map((p) => [p.el, p.rot]));
    pieces.forEach((p) => { p.el.style.cssText = ""; });
    wall.style.height = "";
    wall.classList.remove("free");
    document.body.classList.remove("grid-free");
    btnUnlock.setAttribute("aria-pressed", "false");
    label.textContent = "unlock grid";
    pieces = [];
    if (animate) flip(before, (el) => `rotate(${(rot.get(el) || 0).toFixed(1)}deg)`);
  }

  btnUnlock.addEventListener("click", () => (free ? lock() : unlock()));
  ctl.querySelector(".pl-shuffle").addEventListener("click", () => {
    if (free) { toss(1); return; }
    const before = rects(), items = [...wall.children];
    for (let i = items.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [items[i], items[j]] = [items[j], items[i]]; }
    items.forEach((el) => wall.appendChild(el));
    flip(before);
  });
  // the filters rebuild the grid: drop back to the tidy grid first
  new MutationObserver(() => { if (free && !wall.querySelector(".gw-item[style]")) { free = false; cancelAnimationFrame(raf); wall.style.height = ""; wall.classList.remove("free"); document.body.classList.remove("grid-free"); label.textContent = "unlock grid"; btnUnlock.setAttribute("aria-pressed", "false"); pieces = []; } })
    .observe(wall, { childList: true });

  /* ── drag + fling (only while unlocked); a drag never opens the lightbox ── */
  let drag = null, lastMoved = 0, topZ = 100;
  wall.addEventListener("pointerdown", (e) => {
    if (!free) return;
    const p = pieces.find((q) => q.el === e.target.closest(".gw-item"));
    if (!p) return;
    e.preventDefault();
    p.held = true;
    p.el.style.zIndex = ++topZ;
    p.el.classList.add("held");
    drag = { p, sx: e.clientX, sy: e.clientY, x0: p.x, y0: p.y, lx: e.clientX, ly: e.clientY, lt: performance.now(), moved: 0 };
    try { wall.setPointerCapture(e.pointerId); } catch {}
  });
  wall.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const { p } = drag, now = performance.now(), dt = Math.max(8, now - drag.lt);
    p.vx = (e.clientX - drag.lx) * (16 / dt); p.vy = (e.clientY - drag.ly) * (16 / dt);
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
    if (moved > 5) p.pinned = true; // you put it there, so it stays there
    lastMoved = moved;
    drag = null;
  };
  wall.addEventListener("pointerup", drop);
  wall.addEventListener("pointercancel", drop);
  wall.addEventListener("click", (e) => { if (free && lastMoved > 5) { e.stopPropagation(); e.preventDefault(); lastMoved = 0; } }, true);

  /* ── social site: queer backgammon, "less designed" ──────────────── */
  if (window.SIDE === "social" && window.QBG_SERIES) {
    const sec = document.createElement("section");
    sec.className = "qf";
    sec.id = "qbg";
    sec.innerHTML = `
      <p class="qf-kicker">an anti-design practice · since spring 2025</p>
      <h2>less <em>designed</em></h2>
      <div class="qf-body">
        <div class="qf-text">
          <p class="qf-lead">Since finishing Ruben Pater’s <em>CAPS LOCK</em> in spring 2025, I’ve worked by one rule: stop trying to make it look good.</p>
          <p>So much of what we call “good design” is a taste we were sold: polished, Western, frictionless. So I draw by hand, screenshot my notes app, and leave things broken on purpose. In the era of AI, the human and the imperfect feel more valuable than ever.</p>
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
