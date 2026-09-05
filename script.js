import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

/* ---------- Mobile nav toggle ---------- */
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');
navToggle.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', String(isOpen));
});
navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

/* ---------- Scroll reveal ---------- */
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!reduceMotion) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
} else {
  document.querySelectorAll('.reveal').forEach(el => el.classList.add('is-visible'));
}

/* ---------- Three.js hero scene ---------- */
const canvas = document.getElementById('scene-canvas');
const hero = document.getElementById('hero');

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, hero.clientWidth / hero.clientHeight, 0.1, 100);
camera.position.set(0, 0, 9);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(hero.clientWidth, hero.clientHeight);

// --- central wireframe icosahedron ("the system") ---
const coreGeo = new THREE.IcosahedronGeometry(2.6, 1);
const edges = new THREE.EdgesGeometry(coreGeo);
const coreMat = new THREE.LineBasicMaterial({ color: 0x6fd3e8, transparent: true, opacity: 0.55 });
const core = new THREE.LineSegments(edges, coreMat);
scene.add(core);

// vertex nodes
const nodeGeo = new THREE.SphereGeometry(0.045, 8, 8);
const nodeMat = new THREE.MeshBasicMaterial({ color: 0xe8ab5c });
const nodesGroup = new THREE.Group();
const posAttr = coreGeo.attributes.position;
const seen = new Set();
for (let i = 0; i < posAttr.count; i++) {
  const key = `${posAttr.getX(i).toFixed(2)}_${posAttr.getY(i).toFixed(2)}_${posAttr.getZ(i).toFixed(2)}`;
  if (seen.has(key)) continue;
  seen.add(key);
  const node = new THREE.Mesh(nodeGeo, nodeMat);
  node.position.set(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i));
  nodesGroup.add(node);
}
scene.add(nodesGroup);

// --- scattered blueprint dust ---
const dustCount = 220;
const dustGeo = new THREE.BufferGeometry();
const dustPositions = new Float32Array(dustCount * 3);
for (let i = 0; i < dustCount; i++) {
  dustPositions[i * 3] = (Math.random() - 0.5) * 22;
  dustPositions[i * 3 + 1] = (Math.random() - 0.5) * 14;
  dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 12 - 2;
}
dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
const dustMat = new THREE.PointsMaterial({ color: 0x3a5170, size: 0.045, transparent: true, opacity: 0.7 });
const dust = new THREE.Points(dustGeo, dustMat);
scene.add(dust);

let targetRotX = 0, targetRotY = 0;
let mouseX = 0, mouseY = 0;

function onPointerMove(e) {
  const rect = hero.getBoundingClientRect();
  mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  mouseY = ((e.clientY - rect.top) / rect.height) * 2 - 1;
  targetRotY = mouseX * 0.4;
  targetRotX = mouseY * 0.25;
}
if (!reduceMotion) {
  hero.addEventListener('pointermove', onPointerMove);
}

function onResize() {
  const w = hero.clientWidth, h = hero.clientHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}
window.addEventListener('resize', onResize);

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();

  const autoSpeed = reduceMotion ? 0.03 : 0.09;
  core.rotation.y = t * autoSpeed + targetRotY;
  core.rotation.x = t * autoSpeed * 0.6 + targetRotX;
  nodesGroup.rotation.copy(core.rotation);

  dust.rotation.y = t * 0.01;

  renderer.render(scene, camera);
}
animate();