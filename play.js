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

  /* ── social site: "unlearning design" ──────────────────────────────────
        The zine and the sticker sheet sit right under the heading as objects you can handle:
        the zine folds open, the stickers peel off and stick to the page. The rest of the
        flyers follow in a sideways strip. ── */
  if (window.SIDE === "social" && window.QBG_SERIES) {
    const zine = QBG_SERIES.find((t) => t.zine), sheet = QBG_SERIES.find((t) => t.stickers);
    const series = QBG_SERIES.filter((t) => !t.zine && !t.stickers);
    const sec = document.createElement("section");
    sec.className = "qf";
    sec.id = "qbg";
    sec.innerHTML = `
      <p class="qf-kicker">a practice · since spring 2025</p>
      <h2>unlearning <em>design</em></h2>
      <div class="qf-objects">
        <figure class="qf-obj qf-zine"><button type="button" aria-label="Open the zine" aria-pressed="false"><div class="zn-book">
            <div class="zn-leaf zn-base"><i class="zn-face" style="background-image:url('${zine.inside}');background-position:right"></i><i class="zn-face zn-back" style="background-image:url('${zine.src}');background-position:left"></i></div>
            <div class="zn-leaf zn-cover"><i class="zn-face" style="background-image:url('${zine.src}');background-position:right"></i><i class="zn-face zn-back" style="background-image:url('${zine.inside}');background-position:left"></i></div>
          </div></button><figcaption>zine · <span>tap to open</span></figcaption></figure>
        <figure class="qf-obj qf-stickers"><button type="button" aria-label="Peel the stickers"><img src="${sheet.src}" alt="Sticker sheet: open 2 flirt, looking 4 love, looking 4 buddies, lover girl, lover person" draggable="false"></button><figcaption>stickers · <span>tap to peel</span></figcaption></figure>
      </div>
      <div class="qf-body">
        <div class="qf-text">
          <p class="qf-lead">Since finishing Ruben Pater’s <em>CAPS LOCK</em> in spring 2025, I’ve been taking my own training apart.</p>
          <p>A lot of what we call “good design” is a taste we were sold: slick, Western, built for convenience, made to move product. So I draw by hand, screenshot my notes app, and leave things broken on purpose. In the era of AI, the human and the imperfect feel more valuable than ever.</p>
          <p>True anti-design probably isn’t possible. Sooner or later, everything gets turned into a look someone can sell. So it’s a direction more than a destination: design for the people in the room, not for the market.</p>
          <p>Since December 2025, queer backgammon is where I push it furthest: the zine and stickers above, every flyer below. Hot Girls Eat Dolma belongs here too.</p>
          <a class="qf-link" href="https://queerbackgammon.com" target="_blank" rel="noopener">queerbackgammon.com ↗</a>
        </div>
        <ol class="qf-rules">
          <li>draw it by hand</li>
          <li>a screenshot is a layout</li>
          <li>leave it a little broken</li>
          <li>make it for the room, not the feed</li>
        </ol>
      </div>
      <div class="qf-strip" tabindex="0" aria-label="Flyers, scroll sideways">
        ${series.map((t, k) => `<figure class="qf-item"><button type="button" aria-label="Open ${t.label}"><img src="${t.src}" alt="${t.label}" loading="lazy" draggable="false"></button><figcaption>UD-${String(k + 1).padStart(2, "0")} · ${t.label}</figcaption></figure>`).join("")}
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

    // look closer at a flyer
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

    // the zine: fold it open / shut
    const zFig = sec.querySelector(".qf-zine"), zBtn = zFig.querySelector("button");
    zBtn.addEventListener("click", () => {
      const open = zBtn.getAttribute("aria-pressed") !== "true";
      zBtn.setAttribute("aria-pressed", String(open));
      zFig.classList.toggle("open", open);
      zFig.querySelector("figcaption span").textContent = open ? "tap to close" : "tap to open";
    });

    // phones: things show their own colours while touched
    sec.addEventListener("touchstart", (e) => e.target.closest(".qf-item, .qf-obj")?.classList.add("pressed"), { passive: true });
    sec.addEventListener("touchend", () => setTimeout(() => sec.querySelectorAll(".pressed").forEach((el) => el.classList.remove("pressed")), 450));
    if (location.hash === "#qbg") setTimeout(() => sec.scrollIntoView({ behavior: "smooth", block: "start" }), 300);

    /* ── stickers ─────────────────────────────────────────── */
    const sFig = sec.querySelector(".qf-stickers"), sBtn = sFig.querySelector("button"), sImg = sBtn.querySelector("img");
    let cut = null, out = false, hint = null;
    function cutOut(img) {
      // find each sticker on the sheet: flood the white paper in from the edges,
      // then every island of colour that is left is one sticker
      const W = img.naturalWidth, H = img.naturalHeight;
      const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
      const cx = cv.getContext("2d"); cx.drawImage(img, 0, 0);
      const d = cx.getImageData(0, 0, W, H).data, N = W * H;
      const paper = (i) => d[i * 4] > 232 && d[i * 4 + 1] > 232 && d[i * 4 + 2] > 232;
      const lab = new Int32Array(N); // 0 unknown, -1 paper, >0 sticker id
      const q = new Int32Array(N);
      let qh = 0, qt = 0;
      const push = (i) => { if (lab[i] === 0 && paper(i)) { lab[i] = -1; q[qt++] = i; } };
      for (let x = 0; x < W; x++) { push(x); push((H - 1) * W + x); }
      for (let y = 0; y < H; y++) { push(y * W); push(y * W + W - 1); }
      while (qh < qt) { const i = q[qh++], x = i % W; if (x > 0) push(i - 1); if (x < W - 1) push(i + 1); if (i >= W) push(i - W); if (i < N - W) push(i + W); }
      const parts = [];
      for (let s0 = 0; s0 < N; s0++) {
        if (lab[s0] !== 0) continue;
        const id = parts.length + 1; let x0 = W, y0 = H, x1 = 0, y1 = 0, n = 0;
        qh = qt = 0; lab[s0] = id; q[qt++] = s0;
        while (qh < qt) {
          const i = q[qh++], x = i % W, y = (i - x) / W; n++;
          if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
          for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, i - W, i + W]) if (j >= 0 && j < N && lab[j] === 0) { lab[j] = id; q[qt++] = j; }
        }
        parts.push({ id, x0, y0, x1, y1, n });
      }
      const real = parts.filter((p) => p.n > 900);
      // the cut-outs, plus the empty backing sheet with pale die-cut shapes where they were
      const back = cx.getImageData(0, 0, W, H);
      const list = real.map((p) => {
        const w = p.x1 - p.x0 + 1, h = p.y1 - p.y0 + 1;
        const c = document.createElement("canvas"); c.width = w; c.height = h;
        const g = c.getContext("2d"), o = g.createImageData(w, h);
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
          const i = (p.y0 + y) * W + p.x0 + x;
          if (lab[i] !== p.id) continue;
          const k = (y * w + x) * 4; o.data[k] = d[i * 4]; o.data[k + 1] = d[i * 4 + 1]; o.data[k + 2] = d[i * 4 + 2]; o.data[k + 3] = 255;
          back.data[i * 4] = 238; back.data[i * 4 + 1] = 236; back.data[i * 4 + 2] = 244;
        }
        g.putImageData(o, 0, 0);
        return { url: c.toDataURL(), x: p.x0, y: p.y0, w, h };
      });
      cx.putImageData(back, 0, 0);
      return { list, empty: cv.toDataURL("image/jpeg", 0.9), full: img.src, W, H };
    }

    // a hint: one sticker on the sheet keeps lifting its corner, like it wants to come off
    function prepare() {
      if (cut || !sImg.naturalWidth) return;
      try { cut = cutOut(sImg); } catch { return; }
      const pick = cut.list.reduce((a, b) => (b.x - b.y > a.x - a.y ? b : a)); // the top-right one
      hint = document.createElement("img");
      hint.className = "st-hint"; hint.src = pick.url; hint.alt = ""; hint.draggable = false;
      Object.assign(hint.style, { left: (pick.x / cut.W * 100) + "%", top: (pick.y / cut.H * 100) + "%", width: (pick.w / cut.W * 100) + "%" });
      sBtn.appendChild(hint);
    }
    const later = (f) => ("requestIdleCallback" in window ? requestIdleCallback(f, { timeout: 1500 }) : setTimeout(f, 400));
    if (sImg.complete) later(prepare); else sImg.addEventListener("load", () => later(prepare), { once: true });

    const flying = [];
    let raf2 = 0, last2 = 0;
    sBtn.addEventListener("click", () => {
      if (!cut) prepare();
      if (!cut) return;
      const r = sImg.getBoundingClientRect(), k = r.width / cut.W;
      const label = sFig.querySelector("figcaption span");
      if (!out) {
        out = true;
        sImg.src = cut.empty;
        if (hint) hint.hidden = true;
        label.textContent = "tap to put them back";
        // where they land: on wide screens, the empty table to the right of the sheet;
        // on narrow ones, scattered over the zine and the sheet themselves
        const box = sec.getBoundingClientRect(), ob = sec.querySelector(".qf-objects").getBoundingClientRect();
        const room = box.right - r.right - 30, small = room < 300;
        const L = (small ? box.left : r.right + 30) + scrollX, R = box.right + scrollX;
        const T = ob.top + scrollY, B = ob.bottom + scrollY;
        cut.list.map((_, i) => i).sort(() => Math.random() - 0.5).forEach((i, n) => {
          const s = cut.list[i];
          const el = document.createElement("img");
          el.className = "qf-sticker"; el.src = s.url; el.alt = ""; el.draggable = false;
          const grow = 1.15, w = s.w * k * grow, h = s.h * k * grow;
          const p = { el, x: r.left + scrollX + s.x * k, y: r.top + scrollY + s.y * k, w, h, vx: 0, vy: 0, rot: 0, av: 0,
            phase: "wait", t0: 0, ph: Math.random() * 6.3, fl: 4 + Math.random() * 3, side: Math.random() < 0.5 ? -1 : 1,
            // land somewhere on the page below the sheet, spread across the section
            // keep clear of the edges and of the captions under the sheet and zine
            fx: L + 6 + Math.random() * Math.max(10, R - L - w * 1.15 - 12), floor: T + Math.random() * Math.max(10, B - T - h * 1.3 - 36) };
          Object.assign(el.style, { width: w + "px", height: h + "px", transform: `translate(${p.x}px, ${p.y}px)` });
          document.body.appendChild(el);
          flying.push(p);
          setTimeout(() => { p.phase = "peel"; p.t0 = performance.now(); el.classList.add("off"); }, 60 + n * 85);
        });
        last2 = performance.now();
        fall();
      } else {
        // put them back: every sticker flies home to its spot on the sheet
        out = false;
        label.textContent = "tap to peel";
        cancelAnimationFrame(raf2);
        const done = flying.splice(0).map((p) => {
          const s = cut.list.find((c) => p.el.src === c.url) || { x: 0, y: 0 };
          const tx = r.left + scrollX + s.x * k, ty = r.top + scrollY + s.y * k, sc = (s.w * k) / p.w;
          return p.el.animate([{ transform: p.el.style.transform }, { transform: `translate(${tx}px, ${ty}px) rotate(0deg) scale(${sc})` }],
            { duration: 520 + Math.random() * 240, easing: "cubic-bezier(.5,0,.2,1)", fill: "forwards" }).finished.catch(() => {});
        });
        // (and a timer, in case the browser pauses animations in a background tab)
        const home = () => { document.querySelectorAll(".qf-sticker").forEach((el) => { if (!flying.some((f) => f.el === el)) el.remove(); }); if (!out) { sImg.src = cut.full; if (hint) hint.hidden = false; } };
        Promise.race([Promise.all(done), new Promise((ok) => setTimeout(ok, 900))]).then(home);
      }
    });

    // paper physics: a quick peel from one corner, then it drifts down, swaying and turning
    // like a light piece of paper, and sticks flat where it lands
    function fall() {
      cancelAnimationFrame(raf2);
      const now = performance.now(), dt = Math.min(0.033, (now - last2) / 1000); last2 = now;
      let busy = false;
      for (const p of flying) {
        if (p.phase === "rest" || p.held) continue;
        busy = true;
        if (p.phase === "wait") continue;
        if (p.phase === "peel") {
          const u = Math.min(1, (now - p.t0) / 260);
          p.rot = p.side * 14 * Math.sin(u * Math.PI / 2); p.y -= 18 * dt * 10 * (1 - u);
          if (u >= 1) { p.phase = "fly"; p.vx = (p.fx - p.x) / 1.1; p.vy = -160 - Math.random() * 80; p.av = p.side * (40 + Math.random() * 60); }
        } else {
          const t = now / 1000;
          p.vy += 1500 * dt;                                    // gravity
          p.vy -= p.vy * 2.2 * dt;                              // air holds it back
          p.vx += Math.sin(t * p.fl + p.ph) * 900 * dt;         // flutter side to side
          p.vx += ((p.fx - p.x) * 1.4 - p.vx) * 1.2 * dt;       // drift toward where it will land
          p.av += (p.vx * 0.12 - p.av) * 3 * dt;                // turns with the sway
          p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.av * dt;
          if (p.y >= p.floor) {
            p.y = p.floor; p.phase = "rest";
            p.rot = ((p.rot + 180) % 360 + 360) % 360 - 180;
            p.el.classList.remove("off"); p.el.classList.add("stuck");
            p.el.animate([{ scale: "1.07" }, { scale: "0.98" }, { scale: "1" }], { duration: 220, easing: "ease-out" });
          }
        }
        p.el.style.transform = `translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px) rotate(${p.rot.toFixed(1)}deg)`;
      }
      if (busy) raf2 = requestAnimationFrame(fall);
    }

    // a landed sticker can be picked up and stuck somewhere else (mouse or finger)
    let held = null;
    addEventListener("pointerdown", (e) => {
      const el = e.target.closest?.(".qf-sticker"); if (!el) return;
      const p = flying.find((f) => f.el === el); if (!p || p.phase !== "rest") return;
      e.preventDefault();
      held = { p, dx: e.pageX - p.x, dy: e.pageY - p.y }; p.held = true; el.classList.add("lift");
      el.parentNode.appendChild(el);
    });
    addEventListener("pointermove", (e) => {
      if (!held) return; const { p } = held;
      p.x = e.pageX - held.dx; p.y = e.pageY - held.dy;
      p.el.style.transform = `translate(${p.x}px, ${p.y}px) rotate(${p.rot.toFixed(1)}deg) scale(1.06)`;
    });
    const put = () => {
      if (!held) return; const { p } = held; held = null; p.held = false; p.el.classList.remove("lift");
      p.el.style.transform = `translate(${p.x}px, ${p.y}px) rotate(${p.rot.toFixed(1)}deg)`;
    };
    addEventListener("pointerup", put);
    addEventListener("pointercancel", put);
  }
})();
