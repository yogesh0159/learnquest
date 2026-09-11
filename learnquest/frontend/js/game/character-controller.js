import * as THREE from "three";
import { GLTFLoader } from "/vendor/three-addons/loaders/GLTFLoader.js";

const DEFAULT_CLIP_ALIASES = Object.freeze({
  idle: ["idle", "breathing", "stand"],
  run: ["run", "running", "jog"],
  sprint: ["sprint", "fast_run", "run_fast"],
  jump: ["jump", "jump_start", "takeoff"],
  land: ["land", "landing"],
  slide: ["slide", "sliding", "duck"],
  dodgeLeft: ["dodge_left", "strafe_left", "left"],
  dodgeRight: ["dodge_right", "strafe_right", "right"],
  hit: ["hit", "impact", "hurt"],
  fall: ["fall", "death", "knockdown"],
  victory: ["victory", "celebrate", "celebration", "win"],
});

function normalizeName(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function pickClip(clips, aliases) {
  const normalized = clips.map((clip) => ({ clip, name: normalizeName(clip.name) }));
  for (const alias of aliases) {
    const exact = normalized.find((item) => item.name === alias);
    if (exact) return exact.clip;
  }
  for (const alias of aliases) {
    const fuzzy = normalized.find((item) => item.name.includes(alias));
    if (fuzzy) return fuzzy.clip;
  }
  return null;
}

function setShadows(root) {
  root.traverse((obj) => {
    if (!obj.isMesh) return;
    obj.castShadow = true;
    obj.receiveShadow = true;
    if (obj.material?.map) obj.material.map.colorSpace = THREE.SRGBColorSpace;
  });
}

function fitCharacter(root, targetHeight = 2.85) {
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());
  if (size.y > 0.001) {
    const scale = targetHeight / size.y;
    root.scale.multiplyScalar(scale);
  }
  root.updateMatrixWorld(true);
  const fitted = new THREE.Box3().setFromObject(root);
  const center = fitted.getCenter(new THREE.Vector3());
  root.position.x -= center.x;
  root.position.z -= center.z;
  root.position.y -= fitted.min.y;
}

function buildProceduralExplorer(preset = {}) {
  const root = new THREE.Group();
  root.name = `procedural_${preset.gender || "explorer"}`;

  const gender = preset.gender === "girl" ? "girl" : "boy";
  const skin = new THREE.MeshStandardMaterial({ color: 0xc98762, roughness: 0.68 });
  const skinLight = new THREE.MeshStandardMaterial({ color: 0xdd9b77, roughness: 0.68 });
  const shirt = new THREE.MeshStandardMaterial({ color: gender === "girl" ? 0x7f63c6 : 0x2f7d72, roughness: 0.72 });
  const shirtAccent = new THREE.MeshStandardMaterial({ color: gender === "girl" ? 0xf0b6d0 : 0xf0c768, roughness: 0.72 });
  const bottoms = new THREE.MeshStandardMaterial({ color: 0x263e52, roughness: 0.84 });
  const shoes = new THREE.MeshStandardMaterial({ color: 0x252b31, roughness: 0.78 });
  const white = new THREE.MeshStandardMaterial({ color: 0xf7f4ea, roughness: 0.6 });
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x2c211c, roughness: 0.88 });
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x1b1714, roughness: 0.35 });

  const hips = new THREE.Group();
  hips.position.y = 1.08;
  root.add(hips);

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 0.72, 8, 14), shirt);
  torso.position.y = 0.7;
  torso.scale.set(1, 1.03, 0.76);
  hips.add(torso);

  const chestBadge = new THREE.Mesh(new THREE.CircleGeometry(0.12, 16), shirtAccent);
  chestBadge.position.set(0, 0.82, 0.36);
  hips.add(chestBadge);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.22, 12), skin);
  neck.position.y = 1.24;
  hips.add(neck);

  const headGroup = new THREE.Group();
  headGroup.position.y = 1.62;
  hips.add(headGroup);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.45, 22, 18), skinLight);
  head.scale.set(0.92, 1.05, 0.9);
  headGroup.add(head);

  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), skin);
  nose.position.set(0, -0.02, 0.42);
  headGroup.add(nose);

  [-0.145, 0.145].forEach((x) => {
    const eyeWhite = new THREE.Mesh(new THREE.SphereGeometry(0.062, 12, 10), white);
    eyeWhite.scale.set(1.05, 0.72, 0.42);
    eyeWhite.position.set(x, 0.08, 0.39);
    headGroup.add(eyeWhite);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.027, 10, 8), eyeMat);
    pupil.position.set(x, 0.08, 0.435);
    headGroup.add(pupil);
  });

  const smile = new THREE.Mesh(
    new THREE.TorusGeometry(0.105, 0.014, 6, 18, Math.PI),
    new THREE.MeshStandardMaterial({ color: 0x7b3e35, roughness: 0.55 })
  );
  smile.rotation.z = Math.PI;
  smile.position.set(0, -0.15, 0.405);
  headGroup.add(smile);

  const hairCap = new THREE.Mesh(
    new THREE.SphereGeometry(0.46, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.57),
    hairMat
  );
  hairCap.position.y = 0.08;
  headGroup.add(hairCap);

  if (gender === "girl") {
    [-1, 1].forEach((sign) => {
      const pony = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 10), hairMat);
      pony.scale.set(0.72, 1.45, 0.72);
      pony.position.set(sign * 0.39, -0.02, -0.12);
      pony.rotation.z = sign * 0.32;
      headGroup.add(pony);
    });
  } else {
    for (let i = 0; i < 5; i += 1) {
      const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.27, 7), hairMat);
      tuft.position.set((i - 2) * 0.13, 0.45 - Math.abs(i - 2) * 0.025, 0.03);
      tuft.rotation.z = (i - 2) * 0.12;
      headGroup.add(tuft);
    }
  }

  const leftArmPivot = new THREE.Group();
  const rightArmPivot = new THREE.Group();
  leftArmPivot.position.set(-0.5, 1.02, 0);
  rightArmPivot.position.set(0.5, 1.02, 0);
  hips.add(leftArmPivot, rightArmPivot);

  const armGeo = new THREE.CapsuleGeometry(0.105, 0.62, 6, 10);
  const leftArm = new THREE.Mesh(armGeo, skin);
  const rightArm = new THREE.Mesh(armGeo, skin);
  leftArm.position.y = -0.34;
  rightArm.position.y = -0.34;
  leftArmPivot.add(leftArm);
  rightArmPivot.add(rightArm);

  const leftLegPivot = new THREE.Group();
  const rightLegPivot = new THREE.Group();
  leftLegPivot.position.set(-0.22, 0.08, 0);
  rightLegPivot.position.set(0.22, 0.08, 0);
  hips.add(leftLegPivot, rightLegPivot);

  const legGeo = new THREE.CapsuleGeometry(0.125, 0.72, 6, 10);
  const leftLeg = new THREE.Mesh(legGeo, bottoms);
  const rightLeg = new THREE.Mesh(legGeo, bottoms);
  leftLeg.position.y = -0.43;
  rightLeg.position.y = -0.43;
  leftLegPivot.add(leftLeg);
  rightLegPivot.add(rightLeg);

  const shoeGeo = new THREE.BoxGeometry(0.3, 0.18, 0.55);
  const leftShoe = new THREE.Mesh(shoeGeo, shoes);
  const rightShoe = new THREE.Mesh(shoeGeo, shoes);
  leftShoe.position.set(0, -0.86, 0.12);
  rightShoe.position.set(0, -0.86, 0.12);
  leftLegPivot.add(leftShoe);
  rightLegPivot.add(rightShoe);

  const backpack = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.68, 0.24), shirtAccent);
  backpack.position.set(0, 0.72, -0.43);
  hips.add(backpack);

  root.traverse((obj) => {
    if (obj.isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });

  root.userData.proceduralRig = {
    hips,
    torso,
    headGroup,
    leftArmPivot,
    rightArmPivot,
    leftLegPivot,
    rightLegPivot,
  };
  root.userData.isProcedural = true;
  return root;
}

export class CharacterController {
  constructor({ scene, preset, targetHeight = 2.85, logger = console } = {}) {
    if (!scene) throw new Error("CharacterController requires a Three.js scene");
    this.scene = scene;
    this.preset = preset || { id: "human_boy_v1", gender: "boy", model: null };
    this.targetHeight = targetHeight;
    this.logger = logger;
    this.root = new THREE.Group();
    this.root.name = `character_${this.preset.id || "explorer"}`;
    this.visual = null;
    this.collider = null;
    this.mixer = null;
    this.actions = new Map();
    this.activeAction = null;
    this.state = "idle";
    this.stateTime = 0;
    this.runPhase = 0;
    this.assetMode = "loading";
    this.lastAssetError = null;
    this.scene.add(this.root);
    this._buildCollider();
  }

  _buildCollider() {
    const geometry = new THREE.CapsuleGeometry(0.4, 1.25, 5, 10);
    const material = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
    this.collider = new THREE.Mesh(geometry, material);
    this.collider.position.y = 1.25;
    this.collider.visible = false;
    this.collider.name = "player_gameplay_collider";
    this.root.add(this.collider);
  }

  async load() {
    if (this.preset.model) {
      try {
        await this._loadGltf(this.preset.model);
        this.assetMode = "gltf";
        this.setState("idle", { immediate: true });
        return { mode: this.assetMode, model: this.preset.model, clips: [...this.actions.keys()] };
      } catch (error) {
        this.lastAssetError = error;
        this.logger.warn?.("Explorer GLB unavailable; using procedural fallback", error);
      }
    }
    this._loadFallback();
    this.assetMode = "procedural";
    this.setState("idle", { immediate: true });
    return { mode: this.assetMode, model: null, clips: [] };
  }

  async _loadGltf(url) {
    const loader = new GLTFLoader();
    const gltf = await loader.loadAsync(url);
    const model = gltf.scene || gltf.scenes?.[0];
    if (!model) throw new Error(`GLB has no scene: ${url}`);
    setShadows(model);
    fitCharacter(model, this.targetHeight);
    this.visual = model;
    this.root.add(model);
    this.mixer = new THREE.AnimationMixer(model);

    for (const [state, aliases] of Object.entries(DEFAULT_CLIP_ALIASES)) {
      const clip = pickClip(gltf.animations || [], aliases);
      if (!clip) continue;
      const action = this.mixer.clipAction(clip);
      if (["jump", "land", "hit", "fall", "victory"].includes(state)) {
        action.setLoop(THREE.LoopOnce, 1);
        action.clampWhenFinished = true;
      }
      this.actions.set(state, action);
    }

    if (!this.actions.has("run") && gltf.animations?.length) {
      this.actions.set("run", this.mixer.clipAction(gltf.animations[0]));
    }
  }

  _loadFallback() {
    const model = buildProceduralExplorer(this.preset);
    fitCharacter(model, this.targetHeight);
    this.visual = model;
    this.root.add(model);
  }

  setPosition(x, y, z) {
    this.root.position.set(x, y, z);
  }

  setRotationY(radians) {
    this.root.rotation.y = radians;
  }

  setState(nextState, { immediate = false } = {}) {
    if (!nextState || (this.state === nextState && !immediate)) return;
    this.state = nextState;
    this.stateTime = 0;

    if (!this.mixer) return;
    const next = this.actions.get(nextState) || this.actions.get(nextState === "sprint" ? "run" : "idle") || this.actions.get("run");
    if (!next || next === this.activeAction) return;
    next.reset();
    next.enabled = true;
    next.setEffectiveWeight(1);
    next.setEffectiveTimeScale(1);
    if (this.activeAction && !immediate) next.crossFadeFrom(this.activeAction, 0.14, true);
    else next.play();
    if (!next.isRunning()) next.play();
    this.activeAction = next;
  }

  update(dt, { speed = 1, lateral = 0, airborne = false, sliding = false } = {}) {
    const safeDt = Math.min(0.05, Math.max(0, Number(dt) || 0));
    this.stateTime += safeDt;
    if (this.mixer) {
      const runAction = this.actions.get("run");
      if (runAction && ["run", "sprint"].includes(this.state)) runAction.timeScale = Math.min(1.65, Math.max(0.75, speed));
      this.mixer.update(safeDt);
    } else {
      this._updateProcedural(safeDt, { speed, lateral, airborne, sliding });
    }
  }

  _updateProcedural(dt, { speed, lateral, airborne, sliding }) {
    const rig = this.visual?.userData?.proceduralRig;
    if (!rig) return;
    this.runPhase += dt * (8.5 + Math.min(7, Math.max(0, speed - 1) * 3));
    const swing = Math.sin(this.runPhase);
    const secondary = Math.sin(this.runPhase * 2);

    const isRun = ["run", "sprint", "dodgeLeft", "dodgeRight"].includes(this.state);
    rig.leftArmPivot.rotation.x = isRun ? swing * 0.72 : Math.sin(this.stateTime * 2) * 0.04;
    rig.rightArmPivot.rotation.x = isRun ? -swing * 0.72 : -Math.sin(this.stateTime * 2) * 0.04;
    rig.leftLegPivot.rotation.x = isRun ? -swing * 0.78 : 0;
    rig.rightLegPivot.rotation.x = isRun ? swing * 0.78 : 0;
    rig.hips.position.y = 1.08 + (isRun ? Math.abs(secondary) * 0.035 : Math.sin(this.stateTime * 2) * 0.012);
    rig.torso.rotation.z += ((-lateral * 0.08) - rig.torso.rotation.z) * Math.min(1, dt * 12);
    rig.headGroup.rotation.z += ((-lateral * 0.035) - rig.headGroup.rotation.z) * Math.min(1, dt * 10);

    if (airborne || this.state === "jump") {
      rig.leftLegPivot.rotation.x = -0.35;
      rig.rightLegPivot.rotation.x = 0.45;
      rig.leftArmPivot.rotation.x = -0.65;
      rig.rightArmPivot.rotation.x = -0.65;
    }
    if (sliding || this.state === "slide") {
      rig.hips.rotation.x += ((-0.58) - rig.hips.rotation.x) * Math.min(1, dt * 16);
      rig.hips.position.y += ((0.72) - rig.hips.position.y) * Math.min(1, dt * 16);
      rig.leftLegPivot.rotation.x = 0.9;
      rig.rightLegPivot.rotation.x = -0.25;
    } else {
      rig.hips.rotation.x += (0 - rig.hips.rotation.x) * Math.min(1, dt * 12);
    }
    if (this.state === "victory") {
      rig.leftArmPivot.rotation.z = 2.45;
      rig.rightArmPivot.rotation.z = -2.45;
      rig.hips.position.y = 1.08 + Math.abs(Math.sin(this.stateTime * 5)) * 0.12;
    } else {
      rig.leftArmPivot.rotation.z *= Math.max(0, 1 - dt * 8);
      rig.rightArmPivot.rotation.z *= Math.max(0, 1 - dt * 8);
    }
    if (["hit", "fall"].includes(this.state)) {
      rig.hips.rotation.z += (0.95 - rig.hips.rotation.z) * Math.min(1, dt * 7);
    } else {
      rig.hips.rotation.z += (0 - rig.hips.rotation.z) * Math.min(1, dt * 9);
    }
  }

  dispose() {
    if (this.mixer && this.visual) this.mixer.uncacheRoot(this.visual);
    this.root.traverse((obj) => {
      if (!obj.isMesh) return;
      obj.geometry?.dispose?.();
      const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
      materials.forEach((mat) => {
        if (!mat) return;
        for (const value of Object.values(mat)) if (value?.isTexture) value.dispose?.();
        mat.dispose?.();
      });
    });
    this.scene.remove(this.root);
  }
}

export { THREE };
