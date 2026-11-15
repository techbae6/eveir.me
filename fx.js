// Motion + interaction layer shared by every page.
// Everything here is decoration: the site works without it, and it all
// switches off for people who ask their device for reduced motion.
(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(pointer: fine)").matches;
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];

  /* 1 ─ page transition: the page softly fades and lifts away, the next one fades in */
  document.documentElement.classList.add("entering");
  requestAnimationFrame(() => requestAnimationFrame(() => document.documentElement.classList.remove("entering")));
  addEventListener("pageshow", (e) => { if (e.persisted) document.documentElement.classList.remove("leaving"); });
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[href]");
    if (!a || e.defaultPrevented || reduce) return;
    if (a.target === "_blank" || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || url.pathname === location.pathname) return;
    e.preventDefault();
    document.documentElement.classList.add("leaving");
    setTimeout(() => { location.href = a.href; }, 220);
  });

  /* 2 ─ things slide up into place as you scroll to them */
  const revealables = () => $$(".row, .g-item, .g-intro, .filters, .work h1");
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
    });
  }, { threshold: 0.08, rootMargin: "0px 0px -6% 0px" });
  const arm = () => revealables().forEach((el, i) => {
    if (el.classList.contains("reveal")) return;
    el.classList.add("reveal");
    el.style.setProperty("--d", `${(i % 3) * 90}ms`);
    if (reduce) el.classList.add("in"); else io.observe(el);
  });
  arm();
  // graphics re-renders its grid when you filter, so watch for new cards
  const grid = document.getElementById("masonry");
  if (grid) new MutationObserver(arm).observe(grid, { childList: true });

  /* 3 ─ video thumbnails and graphics lean toward the cursor */
  if (fine && !reduce) {
    document.addEventListener("pointermove", (e) => {
      const t = e.target.closest(".player, .g-media");
      $$(".tilting").forEach((el) => { if (el !== t) { el.classList.remove("tilting"); el.style.transform = ""; } });
      if (!t || t.querySelector("iframe")) return;
      const r = t.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      t.classList.add("tilting");
      t.style.transform = `perspective(900px) rotateX(${(-y * 7).toFixed(2)}deg) rotateY(${(x * 9).toFixed(2)}deg) scale(1.015)`;
      t.style.setProperty("--gx", `${(x + 0.5) * 100}%`);
      t.style.setProperty("--gy", `${(y + 0.5) * 100}%`);
    });
  }

  /* 5 ─ big section headings lean with scroll speed */
  if (!reduce) {
    let lastY = scrollY, skew = 0;
    const heads = () => $$(".say, .archive-head, .g-intro");
    (function loop() {
      const v = scrollY - lastY;
      lastY = scrollY;
      skew += (Math.max(-8, Math.min(8, v * 0.35)) - skew) * 0.12;
      if (Math.abs(skew) > 0.02) heads().forEach((h) => { h.style.transform = `skewY(${(-skew * 0.6).toFixed(2)}deg) translateX(${(skew * 2).toFixed(1)}px)`; });
      requestAnimationFrame(loop);
    })();
  }

  /* 6 ─ a cursor buddy that says what a click will do */
  if (fine && !reduce) {
    const buddy = document.createElement("div");
    buddy.className = "buddy";
    document.body.appendChild(buddy);
    let bx = innerWidth / 2, by = innerHeight / 2, tx = bx, ty = by;
    addEventListener("pointermove", (e) => {
      tx = e.clientX; ty = e.clientY;
      const t = e.target;
      let word = "";
      if (t.closest(".player.still")) word = "open";
      else if (t.closest(".player button")) word = "play";
      else if (t.closest(".g-item")) word = "look";
      else if (t.closest(".enter")) word = "go";
      else if (t.closest("a, button")) word = "•";
      buddy.textContent = word === "•" ? "" : word;
      buddy.classList.toggle("big", !!word && word !== "•");
      buddy.classList.toggle("link", word === "•");
    });
    document.addEventListener("pointerleave", () => buddy.classList.add("gone"));
    document.addEventListener("pointerenter", () => buddy.classList.remove("gone"));
    (function follow() {
      bx += (tx - bx) * 0.18; by += (ty - by) * 0.18;
      buddy.style.transform = `translate(${bx}px, ${by}px)`;
      requestAnimationFrame(follow);
    })();
  }

  /* 7 ─ "enter" letters do a wave when you get close */
  const enter = document.querySelector(".enter");
  if (enter) {
    enter.innerHTML = [...enter.textContent].map((c, i) => `<span style="--i:${i}">${c}</span>`).join("");
    enter.setAttribute("aria-label", "enter");
  }
})();

/* 8 ─ touch: swipe through the graphics lightbox, and tilt cards with scroll */
(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const lb = document.getElementById("lightbox");
  if (lb) {
    let sx = 0, sy = 0;
    lb.addEventListener("touchstart", (e) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    lb.addEventListener("touchend", (e) => {
      const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        lb.querySelector(dx < 0 ? ".lb-next" : ".lb-prev").click();
      } else if (dy > 90 && Math.abs(dy) > Math.abs(dx)) {
        lb.querySelector(".lb-close").click(); // swipe down to close
      }
    }, { passive: true });
  }
  // On phones there is no hover, so cards come alive as they pass through the screen:
  // they start tipped back and straighten as they reach the middle.
  if (!reduce && matchMedia("(hover: none)").matches) {
    const cards = () => document.querySelectorAll(".player, .g-media");
    (function loop() {
      const mid = innerHeight / 2;
      cards().forEach((c) => {
        if (c.querySelector("iframe")) { c.style.transform = ""; return; }
        const r = c.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight) return;
        const k = Math.max(-1, Math.min(1, (r.top + r.height / 2 - mid) / mid));
        c.style.transform = `perspective(700px) rotateX(${(k * 10).toFixed(2)}deg) scale(${(1 - Math.abs(k) * 0.04).toFixed(3)})`;
        c.classList.toggle("lit", Math.abs(k) < 0.35);
      });
      requestAnimationFrame(loop);
    })();
  }
})();

