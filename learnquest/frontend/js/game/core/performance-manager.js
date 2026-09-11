export function runnerQualityProfile(view = window, device = navigator) {
  const lowPower = view.innerWidth < 700 || (device.hardwareConcurrency && device.hardwareConcurrency <= 4);
  return {
    lowPower,
    pixelRatio: Math.min(view.devicePixelRatio || 1, lowPower ? 1.25 : 1.75),
    shadowMapSize: lowPower ? 512 : 1024,
  };
}

export function resizeRunnerView(renderer, camera, width, height) {
  if (!renderer || !camera) return;
  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.fov = width < 700 ? 68 : 62;
  camera.updateProjectionMatrix();
}

export function disposeObject3D(group) {
  group?.traverse?.((object) => {
    object.geometry?.dispose?.();
    if (!object.material) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach((material) => {
      material.map?.dispose?.();
      material.dispose?.();
    });
  });
}
