import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

const MODEL_URL = "/models/call_of_duty_ghost_-_weapons.glb";

const viewport = document.getElementById("viewport");
const loading = document.getElementById("loading");
const resetButton = document.getElementById("reset-view");
const autoRotateButton = document.getElementById("auto-rotate");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0f14);

const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  200,
);
camera.position.set(0, 1.2, 4.5);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: false,
  powerPreference: "high-performance",
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
viewport.appendChild(renderer.domElement);

const pmremGenerator = new THREE.PMREMGenerator(renderer);
scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 1.5;
controls.maxDistance = 12;
controls.maxPolarAngle = Math.PI * 0.92;
controls.target.set(0, 0.4, 0);

const hemiLight = new THREE.HemisphereLight(0xbfd9ff, 0x1a1410, 0.8);
scene.add(hemiLight);

const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
keyLight.position.set(4, 8, 5);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(1024, 1024);
scene.add(keyLight);

const rimLight = new THREE.DirectionalLight(0xf5a524, 1.1);
rimLight.position.set(-5, 3, -4);
scene.add(rimLight);

const platform = new THREE.Mesh(
  new THREE.CylinderGeometry(2.2, 2.4, 0.18, 64),
  new THREE.MeshStandardMaterial({
    color: 0x1a2430,
    metalness: 0.75,
    roughness: 0.35,
  }),
);
platform.position.y = -0.09;
platform.receiveShadow = true;
scene.add(platform);

const grid = new THREE.GridHelper(8, 16, 0x2a3644, 0x18212c);
grid.position.y = -0.01;
scene.add(grid);

let weaponsRoot = null;
let defaultCameraPosition = camera.position.clone();
let defaultTarget = controls.target.clone();

function fitModelToView(object) {
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  object.position.sub(center);
  object.position.y += size.y * 0.5;

  const maxDim = Math.max(size.x, size.y, size.z);
  const scale = 2.4 / maxDim;
  object.scale.setScalar(scale);

  const fittedBox = new THREE.Box3().setFromObject(object);
  const fittedSize = fittedBox.getSize(new THREE.Vector3());

  controls.target.set(0, fittedSize.y * 0.45, 0);
  camera.position.set(0, fittedSize.y * 0.55, fittedSize.z * 1.8 + 2.2);
  defaultCameraPosition = camera.position.clone();
  defaultTarget = controls.target.clone();
}

function enableShadows(object) {
  object.traverse((child) => {
    if (!child.isMesh) return;
    child.castShadow = true;
    child.receiveShadow = true;
    if (child.material) {
      child.material.envMapIntensity = 1.2;
    }
  });
}

const loader = new GLTFLoader();
loader.load(
  MODEL_URL,
  (gltf) => {
    weaponsRoot = gltf.scene;
    enableShadows(weaponsRoot);
    fitModelToView(weaponsRoot);
    scene.add(weaponsRoot);
    loading.classList.add("hidden");
  },
  (event) => {
    if (!event.total) return;
    const percent = Math.round((event.loaded / event.total) * 100);
    loading.querySelector("p").textContent = `Loading weapons... ${percent}%`;
  },
  (error) => {
    loading.querySelector("p").textContent = "Failed to load weapons model.";
    console.error(error);
  },
);

let autoRotate = true;
controls.autoRotate = autoRotate;
controls.autoRotateSpeed = 0.8;
autoRotateButton.classList.add("active");

autoRotateButton.addEventListener("click", () => {
  autoRotate = !autoRotate;
  controls.autoRotate = autoRotate;
  autoRotateButton.classList.toggle("active", autoRotate);
  autoRotateButton.textContent = autoRotate ? "Auto Rotate" : "Manual Rotate";
});

resetButton.addEventListener("click", () => {
  camera.position.copy(defaultCameraPosition);
  controls.target.copy(defaultTarget);
  controls.update();
});

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener("resize", onResize);

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

animate();
