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

  // The queer backgammon "chosen family" cap, in the same faceted style as the star and
  // the evil eye: a rounded cranberry crown, a short brim, a top button and the aqua
  // lettering across the front. Nothing else.
  function hatGroup() {
    const CAP = 0x8a1636, H = 0.86;
    const g = new THREE.Group();
    const cloth = new THREE.MeshStandardMaterial({ color: CAP, flatShading: true, roughness: 0.75, metalness: 0 });
    const edges = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.16 });

    // crown
    const crownGeo = new THREE.SphereGeometry(1, 18, 6, 0, Math.PI * 2, 0, Math.PI / 2);
    const crown = new THREE.Mesh(crownGeo, cloth);
    crown.scale.y = H;
    crown.add(new THREE.LineSegments(new THREE.EdgesGeometry(crownGeo, 1), edges));
    g.add(crown);

    // top button
    const button = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 4), cloth);
    button.scale.y = 0.6;
    button.position.y = H;
    g.add(button);

    // brim: a rounded bill
    const sh = new THREE.Shape(), N = 14, a0 = 0.15, a1 = Math.PI - 0.15;
    for (let k = 0; k <= N; k++) {
      const a = a0 + ((a1 - a0) * k) / N;
      const [x, z] = [-Math.cos(a) * 1.0, Math.sin(a) * 1.62];
      k ? sh.lineTo(x, z) : sh.moveTo(x, z);
    }
    for (let k = N; k >= 0; k--) {
      const a = a0 + ((a1 - a0) * k) / N;
      sh.lineTo(-Math.cos(a) * 0.9, Math.sin(a) * 0.9);
    }
    const brimGeo = new THREE.ExtrudeGeometry(sh, { depth: 0.05, bevelEnabled: false, curveSegments: 1 });
    brimGeo.rotateX(Math.PI / 2);
    const brim = new THREE.Mesh(brimGeo, cloth);
    brim.add(new THREE.LineSegments(new THREE.EdgesGeometry(brimGeo, 20), edges));
    brim.position.set(0, 0.05, 0); // tucked just under the crown edge, no gap
    g.add(brim);

    // the embroidered lettering
    const tex = new THREE.TextureLoader().load((window.BASE || "") + "assets/hat/front.png");
    tex.anisotropy = 4;
    const word = new THREE.Mesh(
      new THREE.SphereGeometry(1.02, 32, 12, Math.PI / 2 - 0.8, 1.6, 0.5, 0.7),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false })
    );
    word.scale.y = H;
    g.add(word);

    g.position.y = -0.3;
    return g;
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
    if (isHat) mesh.rotation.set(0.3, -0.35, 0); // start in the resting pose
    let spinY = reduce || isHat ? 0 : 0.008, velY = spinY, rx = isHat ? 0.3 : -0.25, tx = 0, ty = 0, drag = false, lx = 0, ly = 0, velX = 0;
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
        rx += velX; rx += (((isHat ? 0.3 : -0.25) + tx) - rx) * 0.04; // the hat is always seen a little from above
        mesh.rotation.x = rx;
        mesh.rotation.z += ((ty * 0.3) - mesh.rotation.z) * 0.05;
        renderer.render(scene, camera);
      }
      requestAnimationFrame(frame);
    })();
  }

  document.querySelectorAll("canvas.lowpoly").forEach(mount);
})();
