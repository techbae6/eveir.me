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

  // The queer backgammon "chosen family" cap, modelled on the product photos: a washed
  // cranberry cotton-twill dad hat. Six soft panels that puff a little between the seams,
  // embroidered eyelets, a top button, a pre-curved brim with rows of stitching, and an
  // arched back opening with a strap and brass buckle. Embroidery front and back.
  function fabricTexture() {
    const S = 256, c = document.createElement("canvas");
    c.width = c.height = S;
    const x = c.getContext("2d");
    x.fillStyle = "#6c1530";
    x.fillRect(0, 0, S, S);
    // washed, uneven dye (drawn tiled so the texture repeats without seams)
    for (let i = 0; i < 160; i++) {
      const px = Math.random() * S, py = Math.random() * S, r = 10 + Math.random() * 34, light = Math.random() < 0.5;
      for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) {
        const g = x.createRadialGradient(px + ox, py + oy, 0, px + ox, py + oy, r);
        g.addColorStop(0, light ? "rgba(255,170,190,0.035)" : "rgba(30,0,8,0.045)");
        g.addColorStop(1, "rgba(0,0,0,0)");
        x.fillStyle = g;
        x.fillRect(px + ox - r, py + oy - r, r * 2, r * 2);
      }
    }
    // twill weave: fine diagonal ribs
    x.lineWidth = 1;
    for (let k = -S; k < S * 2; k += 4) {
      x.strokeStyle = "rgba(255,210,220,0.07)";
      x.beginPath(); x.moveTo(k, 0); x.lineTo(k + S, S); x.stroke();
      x.strokeStyle = "rgba(20,0,6,0.09)";
      x.beginPath(); x.moveTo(k + 2, 0); x.lineTo(k + 2 + S, S); x.stroke();
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 4;
    return t;
  }

  function hatGroup() {
    const H = 0.8, RX = 1, RZ = 1.1, BACK = Math.PI * 1.5, TAU = Math.PI * 2;
    const g = new THREE.Group();
    const V = (x, y, z) => new THREE.Vector3(x, y, z);

    // ---- crown surface: phi goes round the head (PI/2 = front), t from the top (0) down
    // to the band (PI/2). At the back the band rises into the arched strap opening.
    const angTo = (phi, c) => Math.atan2(Math.sin(phi - c), Math.cos(phi - c));
    const ARCH_W = 0.42;
    const tMax = (phi) => {
      const d = angTo(phi, BACK) / ARCH_W;
      return Math.abs(d) < 1 ? Math.PI / 2 - 0.42 * Math.sqrt(1 - d * d) : Math.PI / 2;
    };
    const surf = (phi, t, off = 0) => {
      const s = Math.sin(t), c = Math.cos(t);
      const panel = 0.5 - 0.5 * Math.cos(6 * (phi - Math.PI / 2)); // 0 on a seam, 1 mid-panel
      const puff = 1 + 0.03 * panel * Math.sin(2 * t);
      const r = Math.pow(s, 0.9) * puff + off;
      const y = H * (1 + 0.07 * Math.sin(phi) * s) * Math.pow(c, 0.95) * puff + off * c;
      return V(-Math.cos(phi) * RX * r, y, Math.sin(phi) * RZ * r);
    };

    const fabric = fabricTexture();
    fabric.repeat.set(7, 3);
    const cloth = new THREE.MeshStandardMaterial({ color: 0x9c7c86, map: fabric, bumpMap: fabric, bumpScale: 0.012, roughness: 0.96, metalness: 0 });
    const lining = new THREE.MeshStandardMaterial({ color: 0x3a0a18, roughness: 1, side: THREE.BackSide });
    const stitch = new THREE.LineBasicMaterial({ color: 0xb04866, transparent: true, opacity: 0.55 });

    const NU = 144, NV = 36;
    const pos = [], uv = [], idx = [];
    for (let i = 0; i <= NU; i++) {
      const phi = BACK + (i / NU) * TAU, tm = tMax(phi);
      for (let j = 0; j <= NV; j++) {
        const p = surf(phi, (j / NV) * tm);
        pos.push(p.x, p.y, p.z);
        uv.push(i / NU, 1 - ((j / NV) * tm) / (Math.PI / 2));
      }
    }
    for (let i = 0; i < NU; i++) for (let j = 0; j < NV; j++) {
      const a = i * (NV + 1) + j, b = a + NV + 1;
      idx.push(a, a + 1, b, b, a + 1, b + 1);
    }
    const crownGeo = new THREE.BufferGeometry();
    crownGeo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    crownGeo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    crownGeo.setIndex(idx);
    crownGeo.computeVertexNormals();
    // the first and last columns are the same place: give them the same normal
    const n = crownGeo.attributes.normal;
    for (let j = 0; j <= NV; j++) {
      const a = j, b = NU * (NV + 1) + j;
      const nx = n.getX(a) + n.getX(b), ny = n.getY(a) + n.getY(b), nz = n.getZ(a) + n.getZ(b), l = Math.hypot(nx, ny, nz) || 1;
      n.setXYZ(a, nx / l, ny / l, nz / l); n.setXYZ(b, nx / l, ny / l, nz / l);
    }
    g.add(new THREE.Mesh(crownGeo, cloth));
    g.add(new THREE.Mesh(crownGeo, lining));

    // double-stitched seams from the button down, one at the centre front
    for (let k = 0; k < 6; k++) {
      const phi = Math.PI / 2 + (k * Math.PI) / 3;
      [-0.014, 0.014].forEach((dp) => {
        const pts = [], tm = tMax(phi + dp);
        for (let t = 0.05; t <= tm; t += tm / 40) pts.push(surf(phi + dp, t, 0.004));
        g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), stitch));
      });
      // an embroidered eyelet in the middle of each panel
      const ep = phi + Math.PI / 6;
      if (Math.abs(angTo(ep, BACK)) > 0.2) {
        const at = surf(ep, 0.6, 0.004);
        const eye = new THREE.Mesh(new THREE.RingGeometry(0.012, 0.028, 16), new THREE.MeshStandardMaterial({ color: 0x5a1028, roughness: 0.8 }));
        const hole = new THREE.Mesh(new THREE.CircleGeometry(0.012, 12), new THREE.MeshBasicMaterial({ color: 0x1a0308 }));
        [eye, hole].forEach((m) => { m.position.copy(at); m.lookAt(at.clone().multiplyScalar(2)); g.add(m); });
      }
    }
    // taped edge along the band and round the arch
    const edge = [];
    for (let i = 0; i <= 160; i++) { const phi = BACK + (i / 160) * TAU; edge.push(surf(phi, tMax(phi) - 0.03, 0.004)); }
    g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(edge), stitch));

    // fabric-covered top button
    const button = new THREE.Mesh(new THREE.SphereGeometry(0.075, 20, 10), cloth);
    button.scale.y = 0.55;
    button.position.y = H + 0.012;
    g.add(button);

    // ---- brim: pre-curved bill, joined to the crown at the band
    const A0 = 0.12 * Math.PI, A1 = 0.88 * Math.PI, NB = 56, MB = 10, TH = 0.035;
    const bump = (a) => Math.pow(Math.max(0, Math.sin(((a - A0) / (A1 - A0)) * Math.PI)), 0.6);
    const brimPt = (a, f, dy = 0) => {
      const b = bump(a);
      const ix = -Math.cos(a) * RX * 0.99, iz = Math.sin(a) * RZ * 0.99;
      const ox = -Math.cos(a) * RX * (1 + 0.06 * b), oz = Math.sin(a) * RZ + 0.8 * b;
      const x = ix + (ox - ix) * f, z = iz + (oz - iz) * f;
      const y = -0.2 * x * x * Math.pow(f, 1.3) - 0.06 * f * b + dy;
      return V(x, y, z);
    };
    const bpos = [], buv = [], bidx = [];
    const vid = (s, i, j) => s * (NB + 1) * (MB + 1) + i * (MB + 1) + j;
    [0, -TH].forEach((dy) => {
      for (let i = 0; i <= NB; i++) for (let j = 0; j <= MB; j++) {
        const p = brimPt(A0 + ((A1 - A0) * i) / NB, j / MB, dy);
        bpos.push(p.x, p.y, p.z); buv.push((i / NB) * 4, (j / MB) * 1.2);
      }
    });
    for (let i = 0; i < NB; i++) for (let j = 0; j < MB; j++) {
      const a = vid(0, i, j), b = vid(0, i + 1, j);
      bidx.push(a, a + 1, b, b, a + 1, b + 1);                 // top
      const c = vid(1, i, j), d = vid(1, i + 1, j);
      bidx.push(c, d, c + 1, d, d + 1, c + 1);                 // underside
    }
    for (let i = 0; i < NB; i++) {                                // rolled outer edge
      const a = vid(0, i, MB), b = vid(0, i + 1, MB), c = vid(1, i, MB), d = vid(1, i + 1, MB);
      bidx.push(a, c, b, b, c, d);
    }
    const brimGeo = new THREE.BufferGeometry();
    brimGeo.setAttribute("position", new THREE.Float32BufferAttribute(bpos, 3));
    brimGeo.setAttribute("uv", new THREE.Float32BufferAttribute(buv, 2));
    brimGeo.setIndex(bidx);
    brimGeo.computeVertexNormals();
    const brimMat = cloth.clone();
    brimMat.side = THREE.DoubleSide;
    g.add(new THREE.Mesh(brimGeo, brimMat));
    // rows of stitching that follow the edge of the bill
    [0.16, 0.3, 0.44, 0.58, 0.72, 0.86].forEach((f) => {
      const pts = [];
      for (let i = 3; i <= NB - 3; i++) pts.push(brimPt(A0 + ((A1 - A0) * i) / NB, f, 0.004));
      g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), stitch));
    });

    // ---- back strap across the bottom of the arch, with a brass slide buckle
    const spos = [], sidx = [], SN = 24;
    for (let i = 0; i <= SN; i++) {
      const phi = BACK - ARCH_W - 0.06 + ((2 * ARCH_W + 0.12) * i) / SN;
      const p = surf(phi, Math.PI / 2, -0.012);
      spos.push(p.x, 0.0, p.z, p.x, 0.085, p.z);
      if (i < SN) sidx.push(2 * i, 2 * i + 2, 2 * i + 1, 2 * i + 1, 2 * i + 2, 2 * i + 3);
    }
    const strapGeo = new THREE.BufferGeometry();
    strapGeo.setAttribute("position", new THREE.Float32BufferAttribute(spos, 3));
    strapGeo.setIndex(sidx);
    strapGeo.computeVertexNormals();
    g.add(new THREE.Mesh(strapGeo, new THREE.MeshStandardMaterial({ color: 0x6a1630, roughness: 0.9, side: THREE.DoubleSide })));
    const brass = new THREE.MeshStandardMaterial({ color: 0xa8843c, metalness: 0.8, roughness: 0.35 });
    const bphi = BACK - 0.22, bat = surf(bphi, Math.PI / 2, 0.012);
    const buckle = new THREE.Group();
    const bar = (w, h, x, y) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.016), brass); m.position.set(x, y, 0); buckle.add(m); };
    bar(0.11, 0.014, 0, 0.05); bar(0.11, 0.014, 0, -0.05); bar(0.014, 0.1, -0.05, 0); bar(0.014, 0.1, 0.05, 0); bar(0.012, 0.1, 0, 0);
    buckle.position.set(bat.x, 0.045, bat.z);
    buckle.lookAt(bat.x * 2, 0.045, bat.z * 2);
    g.add(buckle);

    // ---- embroidery: patches of the crown surface carrying the artwork
    const loader = new THREE.TextureLoader(), base = window.BASE || "";
    const patch = (file, phiC, phiW, t0, tL) => {
      const tex = loader.load(base + "assets/hat/" + file);
      tex.anisotropy = 4;
      const P = 40, Q = 20, pp = [], uu = [], ii = [];
      for (let i = 0; i <= P; i++) for (let j = 0; j <= Q; j++) {
        const p = surf(phiC - phiW / 2 + (phiW * i) / P, t0 + (tL * j) / Q, 0.007);
        pp.push(p.x, p.y, p.z); uu.push(i / P, 1 - j / Q);
      }
      for (let i = 0; i < P; i++) for (let j = 0; j < Q; j++) {
        const a = i * (Q + 1) + j, b = a + Q + 1;
        ii.push(a, a + 1, b, b, a + 1, b + 1);
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.Float32BufferAttribute(pp, 3));
      geo.setAttribute("uv", new THREE.Float32BufferAttribute(uu, 2));
      geo.setIndex(ii);
      geo.computeVertexNormals();
      g.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
        map: tex, color: 0x9fb4bc, bumpMap: tex, bumpScale: 0.02, transparent: true, depthWrite: false, roughness: 0.6,
        polygonOffset: true, polygonOffsetFactor: -2,
      })));
    };
    patch("front.png", Math.PI / 2, 1.45, 0.5, 0.72);           // "QUEER BACKGAMMON" across the front
    patch("back.png", BACK - 0.62, 0.42, 0.56, 0.4);            // logo on the back panel, above the strap

    g.position.y = -0.18;
    const outerGroup = new THREE.Group();
    outerGroup.add(g);
    outerGroup.scale.setScalar(0.96);
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
    if (isHat) mesh.rotation.set(0.36, -0.35, 0); // start in the resting pose
    let spinY = reduce || isHat ? 0 : 0.008, velY = spinY, rx = isHat ? 0.36 : -0.25, tx = 0, ty = 0, drag = false, lx = 0, ly = 0, velX = 0;
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
        rx += velX; rx += (((isHat ? 0.36 : -0.25) + tx) - rx) * 0.04; // the hat is always seen a little from above
        mesh.rotation.x = rx;
        mesh.rotation.z += ((ty * 0.3) - mesh.rotation.z) * 0.05;
        renderer.render(scene, camera);
      }
      requestAnimationFrame(frame);
    })();
  }

  document.querySelectorAll("canvas.lowpoly").forEach(mount);
})();
