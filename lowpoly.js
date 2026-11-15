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

  // The queer backgammon "chosen family" cap, modelled on the product photos:
  // a low, soft six-panel "dad hat" with seams to the top button, eyelets, a long brim
  // that curves down at the sides with rows of stitching, and a strap with a brass buckle.
  function hatGroup() {
    const MAROON = 0x7a1430, STITCH = 0xc0506e, H = 0.68;
    const g = new THREE.Group();
    const cloth = new THREE.MeshStandardMaterial({ color: MAROON, flatShading: true, roughness: 0.95, metalness: 0, side: THREE.DoubleSide });
    const thread = new THREE.LineBasicMaterial({ color: STITCH, transparent: true, opacity: 0.75 });
    const onDome = (phi, th, r = 1.012) => new THREE.Vector3(-Math.cos(phi) * Math.sin(th) * r, Math.cos(th) * r * H, Math.sin(phi) * Math.sin(th) * r);

    // crown
    const crown = new THREE.Mesh(new THREE.SphereGeometry(1, 18, 7, 0, Math.PI * 2, 0, Math.PI / 2), cloth);
    crown.scale.y = H;
    g.add(crown);

    // six seams from the button down, one at the centre front
    for (let k = 0; k < 6; k++) {
      const phi = Math.PI / 2 + (k * Math.PI) / 3, pts = [];
      for (let t = 0.06; t <= Math.PI / 2 + 0.001; t += Math.PI / 24) pts.push(onDome(phi, t));
      g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), thread));
      // an embroidered eyelet in the middle of each panel
      const eye = new THREE.Mesh(new THREE.CircleGeometry(0.03, 8), new THREE.MeshBasicMaterial({ color: 0x3a0716 }));
      const at = onDome(phi + Math.PI / 6, 0.62, 1.016);
      eye.position.copy(at);
      eye.lookAt(at.clone().multiplyScalar(2));
      g.add(eye);
    }
    // sweatband edge
    const rim = [];
    for (let k = 0; k <= 36; k++) rim.push(onDome((k / 36) * Math.PI * 2, Math.PI / 2 - 0.05, 1.015));
    g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(rim), thread));

    // top button
    const button = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 4), cloth);
    button.position.y = H + 0.015;
    g.add(button);

    // brim: drawn flat, then bent down at the tip and the sides
    const bend = (x, z) => -0.2 * Math.max(0, z - 0.95) - 0.34 * x * x * Math.max(0, z - 0.45);
    const a0 = 0.16, a1 = Math.PI - 0.16, N = 10;
    const inner = (t) => { const a = a0 + (a1 - a0) * t; return [-Math.cos(a) * 0.985, Math.sin(a) * 0.985]; };
    const outer = (t) => { const a = a0 + (a1 - a0) * t; return [-Math.cos(a) * 1.04, Math.sin(a) * 1.95]; };
    const sh = new THREE.Shape();
    for (let k = 0; k <= N; k++) { const [x, y] = outer(k / N); k ? sh.lineTo(x, y) : sh.moveTo(x, y); }
    for (let k = N; k >= 0; k--) { const [x, y] = inner(k / N); sh.lineTo(x, y); }
    const brimGeo = new THREE.ExtrudeGeometry(sh, { depth: 0.045, bevelEnabled: false, curveSegments: 1 });
    brimGeo.rotateX(Math.PI / 2);
    const bp = brimGeo.attributes.position;
    for (let i = 0; i < bp.count; i++) bp.setY(i, bp.getY(i) + bend(bp.getX(i), bp.getZ(i)));
    brimGeo.computeVertexNormals();
    const brim = new THREE.Mesh(brimGeo, cloth);
    brim.position.y = 0.03;
    g.add(brim);
    // rows of stitching across the brim
    for (let r = 1; r <= 6; r++) {
      const f = 0.18 + r * 0.12, pts = [];
      for (let k = 0; k <= 24; k++) {
        const t = k / 24, [xi, zi] = inner(t), [xo, zo] = outer(t);
        const x = xi + (xo - xi) * f, z = zi + (zo - zi) * f;
        pts.push(new THREE.Vector3(x, 0.034 + bend(x, z), z));
      }
      g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), thread));
    }

    // back strap: a dark opening with a brass buckle
    const open = new THREE.Mesh(new THREE.CircleGeometry(0.24, 10, 0, Math.PI), new THREE.MeshBasicMaterial({ color: 0x1a0308, side: THREE.DoubleSide }));
    open.position.set(0, 0.0, -1.0);
    g.add(open);
    const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.08, 0.04), new THREE.MeshStandardMaterial({ color: 0xb8913a, metalness: 0.7, roughness: 0.35, flatShading: true }));
    buckle.position.set(0.12, 0.06, -1.01);
    g.add(buckle);

    // embroidery decals on a skin just outside the crown
    const loader = new THREE.TextureLoader(), base = window.BASE || "";
    const decal = (file, phi0, phiLen, th0, thLen) => {
      const geo = new THREE.SphereGeometry(1.014, 24, 12, phi0, phiLen, th0, thLen);
      const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: loader.load(base + "assets/hat/" + file), transparent: true, depthWrite: false, roughness: 0.8 }));
      m.scale.y = H;
      g.add(m);
    };
    decal("front.png", Math.PI / 2 - 0.78, 1.56, 0.52, 0.72);      // "QUEER BACKGAMMON" across the front panels
    decal("back.png", Math.PI * 1.5 - 1.0, 0.42, 0.66, 0.36);      // logo on the back left panel, above the strap

    g.position.y = -0.38;
    g.rotation.x = 0.62; // look at it from a little above, like the product photos
    const outerGroup = new THREE.Group();
    outerGroup.add(g);
    outerGroup.scale.setScalar(1.12);
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
