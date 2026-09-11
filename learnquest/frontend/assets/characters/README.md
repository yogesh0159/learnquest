# LearnQuest RealWorld Character Assets

The RealWorld V1 code is ready to auto-load two licensed rigged GLB characters:

- `boy-explorer.glb`
- `girl-explorer.glb`

Until those files exist, `CharacterController` automatically uses the procedural human explorer fallback. This is intentional so profile creation, previews and future runner integration do not fail because an art asset is missing.

## Required model contract

Preferred format: binary glTF (`.glb`).

Each model should:

- be a stylized realistic-cartoon child explorer, not a copy of an existing game/movie character;
- have a commercial-use license owned or approved for LearnQuest;
- be fully rigged with a humanoid skeleton;
- face the expected forward axis consistently;
- keep feet close to ground/origin after export;
- use PBR materials;
- avoid unnecessary bones, materials and skinned meshes;
- work on WebGL2 mobile hardware;
- avoid embedding personal/real-child biometric data.

## Animation naming

The controller maps common clip aliases automatically. Best canonical clip names are:

- `Idle`
- `Run`
- `Sprint`
- `Jump`
- `Land`
- `Slide`
- `Dodge_Left`
- `Dodge_Right`
- `Hit`
- `Fall`
- `Victory`

If an asset uses another naming convention, update the alias map in `frontend/js/game/character-controller.js` rather than renaming gameplay states.

## Performance targets

For the first production pack:

- keep one high-quality character roughly within 20k–60k triangles where practical;
- prefer 1K–2K textures over 4K textures for ordinary mobile play;
- minimize material/draw-call count;
- use texture compression (KTX2/Basis) and mesh compression after the basic GLB integration is proven;
- add lower-detail character LOD if real-device testing shows it is needed.

## Testing

Open `/character-lab.html` on the upgrade branch/preview deployment. The top badge reports either:

- `Rigged GLB active` when the asset loaded, or
- `Safe fallback active` when the file is absent/invalid.

Test every animation-state button and inspect mobile frame rate before wiring a new art pack into production runners.
