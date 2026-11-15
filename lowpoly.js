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
    const geo = shape === "gem" ? gemGeometry() : starGeometry();
    const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: RED, flatShading: true, roughness: 0.55, metalness: 0.05 }));
    // thin white edges make the facets read as low-poly
    mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo, 1), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35 })));
    mesh.scale.setScalar(shape === "gem" ? 1.05 : 1.2);
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
