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

  // The queer backgammon "chosen family" cap, modelled on the product photos: a cranberry
  // cotton-twill dad hat (colour sampled from the photos, #8d2440) with six soft panels,
  // pressed-in seams, embroidered eyelets, a top button, a pre-curved brim with rows of
  // stitching, an arched back with strap and brass buckle, and the aqua embroidery.
  // It gets its own neutral lighting (see mount) so the colours stay true.
  const lin = (hex) => new THREE.Color(hex).convertSRGBToLinear();

  function twillTexture() {
    // fine diagonal ribs, used only as a bump map: reads as cotton twill up close
    const S = 128, c = document.createElement("canvas");
    c.width = c.height = S;
    const x = c.getContext("2d");
    x.fillStyle = "#808080";
    x.fillRect(0, 0, S, S);
    x.lineWidth = 1.5;
    for (let k = -S; k < S * 2; k += 4) {
      x.strokeStyle = "#b0b0b0";
      x.beginPath(); x.moveTo(k, 0); x.lineTo(k + S, S); x.stroke();
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(40, 14);
    t.anisotropy = 4;
    return t;
  }

  function gridGeometry(NU, NV, at, uvAt) {
    const pos = [], uv = [], idx = [];
    for (let i = 0; i <= NU; i++) for (let j = 0; j <= NV; j++) {
      const p = at(i / NU, j / NV);
      pos.push(p.x, p.y, p.z);
      const [u, v] = uvAt(i / NU, j / NV);
      uv.push(u, v);
    }
    for (let i = 0; i < NU; i++) for (let j = 0; j < NV; j++) {
      const a = i * (NV + 1) + j, b = a + NV + 1;
      idx.push(a, a + 1, b, b, a + 1, b + 1);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    return geo;
  }

  function hatGroup() {
    const H = 1.02, RX = 1, RZ = 1.1, BACK = Math.PI * 1.5, TAU = Math.PI * 2;
    const g = new THREE.Group();
    const V = (x, y, z) => new THREE.Vector3(x, y, z);
    const angTo = (phi, c) => Math.atan2(Math.sin(phi - c), Math.cos(phi - c));

    // crown surface. phi runs round the head (PI/2 = front), t from the top (0) to the band
    // (PI/2). At the back the band rises into the arched strap opening.
    const ARCH_W = 0.42;
    const tMax = (phi) => {
      const d = angTo(phi, BACK) / ARCH_W;
      return Math.abs(d) < 1 ? Math.PI / 2 - 0.4 * Math.sqrt(1 - d * d) : Math.PI / 2;
    };
    const surf = (phi, t, off = 0) => {
      const s = Math.sin(t), c = Math.cos(t);
      const k = angTo(phi, Math.PI / 2) / (Math.PI / 3);            // panel coordinate
      const ds = Math.abs(k - Math.round(k)) * (Math.PI / 3);       // angle to nearest seam
      const seam = Math.exp(-((ds / 0.035) ** 2));
      const puff = 1 + 0.035 * (1 - Math.cos(Math.min(1, ds / (Math.PI / 6)) * Math.PI)) / 2 * Math.sin(2 * t);
      const press = 1 - 0.01 * seam * Math.sin(t);
      const r = Math.pow(s, 0.97) * puff * press + off;
      const y = H * (1 + 0.07 * Math.sin(phi) * s) * Math.pow(c, 1.08) * puff * press + off * c;
      return V(-Math.cos(phi) * RX * r, y, Math.sin(phi) * RZ * r);
    };

    const twill = twillTexture();
    const CLOTH = 0x8a1a3c; // a shade under the photo average, since the lights add some back
    const cloth = new THREE.MeshStandardMaterial({ color: lin(CLOTH), bumpMap: twill, bumpScale: 0.004, roughness: 1, metalness: 0 });
    const lining = new THREE.MeshStandardMaterial({ color: lin(0x5a1229), roughness: 1, side: THREE.BackSide });
    const stitch = new THREE.LineBasicMaterial({ color: lin(0xb0536c), transparent: true, opacity: 0.6 });

    // crown (first and last columns meet at the back; their normals are averaged)
    const NU = 192, NV = 40;
    const crownGeo = gridGeometry(NU, NV,
      (u, v) => { const phi = BACK + u * TAU; return surf(phi, v * tMax(phi)); },
      (u, v) => [u, v]);
    const n = crownGeo.attributes.normal;
    for (let j = 0; j <= NV; j++) {
      const a = j, b = NU * (NV + 1) + j;
      const nx = n.getX(a) + n.getX(b), ny = n.getY(a) + n.getY(b), nz = n.getZ(a) + n.getZ(b), l = Math.hypot(nx, ny, nz) || 1;
      n.setXYZ(a, nx / l, ny / l, nz / l); n.setXYZ(b, nx / l, ny / l, nz / l);
    }
    g.add(new THREE.Mesh(crownGeo, cloth));
    g.add(new THREE.Mesh(crownGeo, lining));

    // stitching either side of each seam, and an embroidered eyelet on each panel
    const eyeMat = new THREE.MeshStandardMaterial({ color: lin(0x6e1832), roughness: 0.85 });
    const holeMat = new THREE.MeshBasicMaterial({ color: lin(0x2a0610) });
    for (let k = 0; k < 6; k++) {
      const phi = Math.PI / 2 + (k * Math.PI) / 3;
      [-0.045, 0.045].forEach((dp) => {
        const pts = [], tm = tMax(phi + dp);
        for (let i = 0; i <= 40; i++) pts.push(surf(phi + dp, 0.06 + ((tm - 0.1) * i) / 40, 0.003));
        g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), stitch));
      });
      const ep = phi + Math.PI / 6;
      if (Math.abs(angTo(ep, BACK)) > 0.3) {
        const at = surf(ep, 0.55, 0.003);
        [new THREE.Mesh(new THREE.RingGeometry(0.011, 0.024, 20), eyeMat), new THREE.Mesh(new THREE.CircleGeometry(0.011, 12), holeMat)]
          .forEach((m) => { m.position.copy(at); m.lookAt(at.clone().multiplyScalar(2)); g.add(m); });
      }
    }
    // stitched band just above the brim, following the arch at the back
    const band = [];
    for (let i = 0; i <= 200; i++) { const phi = BACK + (i / 200) * TAU; band.push(surf(phi, tMax(phi) - 0.05, 0.003)); }
    g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(band), stitch));

    // fabric-covered button
    const button = new THREE.Mesh(new THREE.SphereGeometry(0.07, 24, 12), cloth);
    button.scale.y = 0.5;
    button.position.y = H + 0.01;
    g.add(button);

    // brim: pre-curved bill. Top and bottom surfaces plus a rolled edge.
    const A0 = 0.12 * Math.PI, A1 = 0.88 * Math.PI, NB = 64, MB = 12, TH = 0.022;
    const bump = (a) => Math.pow(Math.max(0, Math.sin(((a - A0) / (A1 - A0)) * Math.PI)), 0.55);
    const brimPt = (a, f, dy = 0) => {
      const b = bump(a);
      const ix = -Math.cos(a) * RX * 0.975, iz = Math.sin(a) * RZ * 0.975;
      const ox = -Math.cos(a) * RX * (1 + 0.05 * b), oz = Math.sin(a) * RZ + 0.82 * b;
      const x = ix + (ox - ix) * f, z = iz + (oz - iz) * f;
      return V(x, 0.012 - (0.34 * x * x + 0.05) * f * f * b + dy, z); // curves down smoothly toward the edge, flat where it meets the crown
    };
    const brimMat = cloth.clone();
    brimMat.side = THREE.DoubleSide;
    [0, -TH].forEach((dy) => g.add(new THREE.Mesh(
      gridGeometry(NB, MB, (u, v) => brimPt(A0 + (A1 - A0) * u, v, dy), (u, v) => [u, v]), brimMat)));
    g.add(new THREE.Mesh(gridGeometry(NB, 1,
      (u, v) => brimPt(A0 + (A1 - A0) * u, 1, -TH * v), (u, v) => [u, v]), brimMat));
    [0.14, 0.27, 0.4, 0.53, 0.66, 0.79, 0.9].forEach((f) => {
      const pts = [];
      for (let i = 2; i <= NB - 2; i++) pts.push(brimPt(A0 + ((A1 - A0) * i) / NB, f, 0.003));
      g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), stitch));
    });

    // back strap across the arch, with a brass slide buckle
    g.add(new THREE.Mesh(gridGeometry(24, 1, (u, v) => {
      const p = surf(BACK - ARCH_W - 0.05 + (2 * ARCH_W + 0.1) * u, Math.PI / 2, -0.01);
      return V(p.x, 0.085 * v, p.z);
    }, (u, v) => [u, v]), new THREE.MeshStandardMaterial({ color: lin(CLOTH), roughness: 0.9, side: THREE.DoubleSide })));
    const brass = new THREE.MeshStandardMaterial({ color: lin(0xb08d4a), metalness: 0.85, roughness: 0.35 });
    const bat = surf(BACK - 0.2, Math.PI / 2, 0.012), buckle = new THREE.Group();
    const bar = (w, h, x, y) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.014), brass); m.position.set(x, y, 0); buckle.add(m); };
    bar(0.1, 0.013, 0, 0.045); bar(0.1, 0.013, 0, -0.045); bar(0.013, 0.1, -0.045, 0); bar(0.013, 0.1, 0.045, 0); bar(0.011, 0.09, 0, 0);
    buckle.position.set(bat.x, 0.045, bat.z);
    buckle.lookAt(bat.x * 2, 0.045, bat.z * 2);
    g.add(buckle);

    // embroidery: patches of the crown surface carrying the artwork, tinted to the thread
    // colour in the photos (about #55b0d0)
    const loader = new THREE.TextureLoader(), base = window.BASE || "";
    const patch = (file, phiC, phiW, t0, tL) => {
      const tex = loader.load(base + "assets/hat/" + file);
      tex.encoding = THREE.sRGBEncoding;
      tex.anisotropy = 4;
      g.add(new THREE.Mesh(
        gridGeometry(40, 20, (u, v) => surf(phiC - phiW / 2 + phiW * u, t0 + tL * v, 0.006), (u, v) => [u, 1 - v]),
        new THREE.MeshStandardMaterial({
          map: tex, color: lin(0xc2c6e3), bumpMap: tex, bumpScale: 0.015, roughness: 0.55,
          transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2,
        })));
    };
    patch("front.png", Math.PI / 2, 1.15, 0.9, 0.52);              // "QUEER BACKGAMMON" low across the front, as on the cap
    patch("back.png", BACK, 0.5, 0.66, 0.42);                       // logo centred on the back, above the strap opening

    g.position.y = -0.4;
    const outer = new THREE.Group();
    outer.add(g);
    outer.scale.setScalar(0.92);
    return outer;
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

    const shape = canvas.dataset.shape;
    if (shape === "hat") {
      // neutral daylight so the cap keeps its real colours
      renderer.outputEncoding = THREE.sRGBEncoding;
      scene.add(new THREE.HemisphereLight(0xfff8f0, 0x2a1418, 0.36));
      const sun = new THREE.DirectionalLight(0xfff4e8, 1.12);
      sun.position.set(-2.5, 3.5, 4);
      scene.add(sun);
      const fill = new THREE.DirectionalLight(0xfff0ea, 0.15);
      fill.position.set(3, 1, 2);
      scene.add(fill);
    } else {
      scene.add(new THREE.HemisphereLight(0xffffff, BLUE, 1.15));
      const key = new THREE.DirectionalLight(0xffffff, 0.9);
      key.position.set(2.5, 3, 4);
      scene.add(key);
    }
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
    if (isHat) mesh.rotation.set(0.2, -0.35, 0); // start in the resting pose
    let spinY = reduce || isHat ? 0 : 0.008, velY = spinY, rx = isHat ? 0.2 : -0.25, tx = 0, ty = 0, drag = false, lx = 0, ly = 0, velX = 0;
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
        rx += velX; rx += (((isHat ? 0.2 : -0.25) + tx) - rx) * 0.04; // the hat is always seen a little from above
        mesh.rotation.x = rx;
        mesh.rotation.z += ((ty * 0.3) - mesh.rotation.z) * 0.05;
        renderer.render(scene, camera);
      }
      requestAnimationFrame(frame);
    })();
  }

  document.querySelectorAll("canvas.lowpoly").forEach(mount);
})();
