// Low-poly 3D accents (three.js). Any <canvas class="lowpoly" data-shape="star|gem">
// gets a faceted, flat-shaded object in the site's orange-red, lit so its shadow
// sides fall into electric blue. It turns slowly, leans toward the cursor, and
// you can drag it to spin it (it keeps your momentum, then settles).
(() => {
  if (!window.THREE) return;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const RED = 0xff4b2b, BLUE = 0x1a2cff;

  function starGeometry() {
    const shape = new THREE.Shape();
    for (let k = 0; k < 10; k++) {
      const r = k % 2 ? 0.42 : 1, a = Math.PI / 2 + (k * Math.PI) / 5;
      const x = r * Math.cos(a), y = r * Math.sin(a);
      k ? shape.lineTo(x, y) : shape.moveTo(x, y);
    }
    shape.closePath();
    const g = new THREE.ExtrudeGeometry(shape, {
      depth: 0.32, bevelEnabled: true, bevelThickness: 0.16, bevelSize: 0.12, bevelSegments: 1, curveSegments: 1,
    });
    g.center();
    return g;
  }

  function gemGeometry() {
    // an icosahedron with its points nudged, so the facets feel hand-cut
    const g = new THREE.IcosahedronGeometry(1, 1);
    const pos = g.attributes.position, seen = new Map();
    for (let i = 0; i < pos.count; i++) {
      const key = [pos.getX(i), pos.getY(i), pos.getZ(i)].map((v) => v.toFixed(3)).join();
      if (!seen.has(key)) seen.set(key, 0.86 + Math.random() * 0.28);
      const s = seen.get(key);
      pos.setXYZ(i, pos.getX(i) * s, pos.getY(i) * s, pos.getZ(i) * s);
    }
    g.computeVertexNormals();
    return g;
  }

  // The queer backgammon "chosen family" cap: a faceted six-panel crown, a curved brim,
  // a top button, with the real embroidery (front lettering, back logo) wrapped on as decals.
  function hatGroup() {
    const MAROON = 0x6e1027, H = 0.8; // H squashes the dome into a cap shape
    const g = new THREE.Group();
    const cloth = new THREE.MeshStandardMaterial({ color: MAROON, flatShading: true, roughness: 0.9, metalness: 0 });
    const seams = new THREE.LineBasicMaterial({ color: 0xff8fb0, transparent: true, opacity: 0.35 });

    // crown: low-poly half sphere, 12 slices so the six panels read as facets
    const crownGeo = new THREE.SphereGeometry(1, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2);
    const crown = new THREE.Mesh(crownGeo, cloth);
    crown.scale.y = H;
    crown.add(new THREE.LineSegments(new THREE.EdgesGeometry(crownGeo, 1), seams));
    g.add(crown);

    // top button
    const button = new THREE.Mesh(new THREE.SphereGeometry(0.085, 6, 4), cloth);
    button.position.y = H + 0.02;
    g.add(button);

    // brim: a flat shape reaching forward, then bent so it droops at the tip and curls at the sides
    const s = new THREE.Shape();
    const a0 = 0.18, a1 = Math.PI - 0.18, N = 7;
    for (let k = 0; k <= N; k++) { // outer edge, left to right
      const a = a0 + (a1 - a0) * (k / N);
      const x = -Math.cos(a) * 1.02, y = Math.sin(a) * 1.75;
      k ? s.lineTo(x, y) : s.moveTo(x, y);
    }
    for (let k = N; k >= 0; k--) { // inner edge hugs the crown
      const a = a0 + (a1 - a0) * (k / N);
      s.lineTo(-Math.cos(a) * 0.98, Math.sin(a) * 0.98);
    }
    const brimGeo = new THREE.ExtrudeGeometry(s, { depth: 0.05, bevelEnabled: false, curveSegments: 1 });
    brimGeo.rotateX(Math.PI / 2);
    const p = brimGeo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i);
      p.setY(i, p.getY(i) - 0.18 * Math.max(0, z - 0.9) - 0.22 * x * x * Math.max(0, z - 0.5));
    }
    brimGeo.computeVertexNormals();
    const brim = new THREE.Mesh(brimGeo, cloth);
    brim.position.y = 0.04;
    brim.add(new THREE.LineSegments(new THREE.EdgesGeometry(brimGeo, 20), seams));
    g.add(brim);

    // embroidery decals on a skin just outside the crown
    const loader = new THREE.TextureLoader(), base = window.BASE || "";
    const decal = (file, phi0, phiLen, th0, thLen) => {
      const geo = new THREE.SphereGeometry(1.012, 24, 12, phi0, phiLen, th0, thLen);
      const tex = loader.load(base + "assets/hat/" + file);
      const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, transparent: true, depthWrite: false, roughness: 0.8 }));
      m.scale.y = H;
      crown.parent ? g.add(m) : g.add(m);
    };
    decal("front.png", Math.PI / 2 - 0.82, 1.64, 0.5, 0.82);      // "QUEER BACKGAMMON" across the front
    decal("back.png", Math.PI * 1.5 - 0.95, 0.42, 0.62, 0.38);     // the little logo, back left above the strap

    g.position.y = -0.35;
    g.rotation.x = 0.18;
    const outer = new THREE.Group(); // rotate the outer group so the inner tilt stays
    outer.add(g);
    outer.scale.setScalar(1.15);
    return outer;
  }

  function mount(canvas) {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
    camera.position.set(0, 0, 5.2);

    scene.add(new THREE.HemisphereLight(0xffffff, BLUE, 1.15));
    const key = new THREE.DirectionalLight(0xffffff, 0.9);
    key.position.set(2.5, 3, 4);
    scene.add(key);

    const shape = canvas.dataset.shape;
    let mesh;
    if (shape === "hat") {
      mesh = hatGroup();
    } else {
      const geo = shape === "gem" ? gemGeometry() : starGeometry();
      mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: RED, flatShading: true, roughness: 0.55, metalness: 0.05 }));
      // thin white edges make the facets read as low-poly
      mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo, 1), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35 })));
      mesh.scale.setScalar(shape === "gem" ? 1.05 : 1.2);
    }
    scene.add(mesh);

    const size = () => {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h; camera.updateProjectionMatrix();
    };
    size(); addEventListener("resize", size);

    let spinY = reduce ? 0 : 0.008, velY = spinY, rx = -0.25, tx = 0, ty = 0, drag = false, lx = 0, ly = 0, velX = 0;
    canvas.addEventListener("pointerdown", (e) => { drag = true; lx = e.clientX; ly = e.clientY; canvas.setPointerCapture?.(e.pointerId); canvas.classList.add("held"); });
    canvas.addEventListener("pointermove", (e) => {
      if (!drag) return;
      velY = (e.clientX - lx) * 0.012; velX = (e.clientY - ly) * 0.008;
      lx = e.clientX; ly = e.clientY;
    });
    const up = () => { drag = false; canvas.classList.remove("held"); };
    canvas.addEventListener("pointerup", up); canvas.addEventListener("pointercancel", up);
    addEventListener("pointermove", (e) => { ty = (e.clientX / innerWidth - 0.5) * 0.6; tx = (e.clientY / innerHeight - 0.5) * 0.4; });

    let visible = true;
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; }).observe(canvas);
    (function frame() {
      if (visible) {
        if (!drag) { velY += (spinY - velY) * 0.03; velX *= 0.92; }
        mesh.rotation.y += velY;
        rx += velX; rx += ((-0.25 + tx) - rx) * 0.04;
        mesh.rotation.x = rx;
        mesh.rotation.z += ((ty * 0.3) - mesh.rotation.z) * 0.05;
        renderer.render(scene, camera);
      }
      requestAnimationFrame(frame);
    })();
  }

  document.querySelectorAll("canvas.lowpoly").forEach(mount);
})();
