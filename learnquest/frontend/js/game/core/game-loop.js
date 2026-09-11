/** A small lifecycle owner for the shared update/render animation loop. */
export class GameLoop {
  constructor({ clock, update, render, requestFrame = requestAnimationFrame, cancelFrame = cancelAnimationFrame }) {
    this.clock = clock;
    this.update = update;
    this.render = render;
    this.requestFrame = requestFrame;
    this.cancelFrame = cancelFrame;
    this.frameId = null;
    this.active = false;
    this.tick = () => {
      if (!this.active) return;
      const delta = Math.min(.035, this.clock.getDelta());
      this.update(delta);
      this.render(delta);
      this.frameId = this.requestFrame(this.tick);
    };
  }

  start() {
    if (this.active) return;
    this.active = true;
    this.frameId = this.requestFrame(this.tick);
  }

  stop() {
    this.active = false;
    if (this.frameId !== null) this.cancelFrame(this.frameId);
    this.frameId = null;
  }
}
