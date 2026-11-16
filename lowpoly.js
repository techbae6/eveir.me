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

  // The queer backgammon "chosen family" cap: a soft, low six-panel dad hat with a
  // gently curved brim and the embroidered lettering across the front. Kept simple on
  // purpose: smooth crown, faint seams, a short brim, no extra hardware.
  function hatGroup() {
    const MAROON = 0x5e0f26, STITCH = 0xc25a78, H = 0.8;
    const g = new THREE.Group();
    const cloth = new THREE.MeshStandardMaterial({ color: MAROON, roughness: 0.9, metalness: 0, side: THREE.DoubleSide });
    const thread = new THREE.LineBasicMaterial({ color: STITCH, transparent: true, opacity: 0.45 });
    const onDome = (phi, th, r = 1.006) => new THREE.Vector3(-Math.cos(phi) * Math.sin(th) * r, Math.cos(th) * r * H, Math.sin(phi) * Math.sin(th) * r);

    // crown
    const crown = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 16, 0, Math.PI * 2, 0, Math.PI / 2), cloth);
    crown.scale.y = H;
    g.add(crown);

    // six faint seams to the button, one down the centre front
    for (let k = 0; k < 6; k++) {
      const phi = Math.PI / 2 + (k * Math.PI) / 3, pts = [];
      for (let t = 0.07; t <= Math.PI / 2 + 0.001; t += Math.PI / 32) pts.push(onDome(phi, t));
      g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), thread));
    }

    // top button
    const button = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 6), cloth);
    button.position.y = H + 0.01;
    g.add(button);

    // brim: a short, rounded bill that dips softly at the sides
    const bend = (x, z) => -0.22 * x * x * Math.max(0, z - 0.4) - 0.08 * Math.max(0, z - 1.1);
    const a0 = 0.2, a1 = Math.PI - 0.2, N = 24;
    const inner = (t) => { const a = a0 + (a1 - a0) * t; return [-Math.cos(a) * 0.99, Math.sin(a) * 0.99]; };
    const outer = (t) => { const a = a0 + (a1 - a0) * t; return [-Math.cos(a) * 1.0, Math.sin(a) * 1.62]; };
    const sh = new THREE.Shape();
    for (let k = 0; k <= N; k++) { const [x, y] = outer(k / N); k ? sh.lineTo(x, y) : sh.moveTo(x, y); }
    for (let k = N; k >= 0; k--) { const [x, y] = inner(k / N); sh.lineTo(x, y); }
    const brimGeo = new THREE.ExtrudeGeometry(sh, { depth: 0.04, bevelEnabled: false, curveSegments: 4 });
    brimGeo.rotateX(Math.PI / 2);
    const bp = brimGeo.attributes.position;
    for (let i = 0; i < bp.count; i++) bp.setY(i, bp.getY(i) + bend(bp.getX(i), bp.getZ(i)));
    brimGeo.computeVertexNormals();
    const brim = new THREE.Mesh(brimGeo, cloth);
    brim.position.y = 0.02;
    g.add(brim);
    // two rows of stitching along the bill
    [0.35, 0.7].forEach((f) => {
      const pts = [];
      for (let k = 0; k <= 32; k++) {
        const t = 0.04 + (k / 32) * 0.92, [xi, zi] = inner(t), [xo, zo] = outer(t);
        const x = xi + (xo - xi) * f, z = zi + (zo - zi) * f;
        pts.push(new THREE.Vector3(x, 0.025 + bend(x, z), z));
      }
      g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), thread));
    });

    // embroidered lettering across the front panels
    const loader = new THREE.TextureLoader(), base = window.BASE || "";
    const tex = loader.load(base + "assets/hat/front.png");
    tex.anisotropy = 4;
    const geo = new THREE.SphereGeometry(1.01, 40, 16, Math.PI / 2 - 0.85, 1.7, 0.42, 0.78);
    const word = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, transparent: true, depthWrite: false, roughness: 0.7 }));
    word.scale.y = H;
    g.add(word);

    g.position.y = -0.22;
    g.rotation.x = 0.5; // seen a little from above, so the brim reads
    const outerGroup = new THREE.Group();
    outerGroup.add(g);
    outerGroup.scale.setScalar(0.98);
    return outerGroup;
  }

  // Nazar (evil eye) bead: stacked faceted discs, each a little prouder than the one below,
  // so it reads like a pressed-glass bead from the side.
  function eyeGroup() {
    const g = new THREE.Group();
    const rings = [
      { r: 1.0, h: 0.22, z: 0.0, c: 0x0a1fd6 },   // deep blue
      { r: 0.66, h: 0.2, z: 0.07, c: 0xf6f4ee },  // white
      { r: 0.46, h: 0.2, z: 0.12, c: 0x7fd3f7 },  // light blue
      { r: 0.22, h: 0.2, z: 0.17, c: 0x0b0b16 },  // black pupil
    ];
    rings.forEach(({ r, h, z, c }) => {
      const geo = new THREE.CylinderGeometry(r * 0.92, r, h, 12, 1);
      geo.rotateX(Math.PI / 2);
      const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: c, flatShading: true, roughness: 0.35, metalness: 0.05 }));
      m.position.z = z;
      m.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo, 1), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.22 })));
      g.add(m);
    });
    // the back face, so it still reads as a bead when it spins around
    const back = new THREE.Mesh(new THREE.CylinderGeometry(1, 0.9, 0.12, 12, 1).rotateX(Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0x0a1fd6, flatShading: true, roughness: 0.4 }));
    back.position.z = -0.14;
    g.add(back);
    g.scale.setScalar(1.15);
    return g;
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
    } else if (shape === "eye") {
      mesh = eyeGroup();
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

    const isHat = shape === "hat";
    let spinY = reduce || isHat ? 0 : 0.008, velY = spinY, rx = -0.25, tx = 0, ty = 0, drag = false, lx = 0, ly = 0, velX = 0;
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
        if (isHat && !drag) {
          const home = -0.35 + (reduce ? 0 : Math.sin(performance.now() / 1600) * 0.28);
          const T = Math.PI * 2, off = (((mesh.rotation.y - home + Math.PI) % T) + T) % T - Math.PI;
          mesh.rotation.y = home + off - off * 0.03; // settle back the short way round
        }
        rx += velX; rx += (((isHat ? 0 : -0.25) + tx) - rx) * 0.04;
        mesh.rotation.x = rx;
        mesh.rotation.z += ((ty * 0.3) - mesh.rotation.z) * 0.05;
        renderer.render(scene, camera);
      }
      requestAnimationFrame(frame);
    })();
  }

  document.querySelectorAll("canvas.lowpoly").forEach(mount);
})();
