const THINK_SECONDS_BY_AGE = Object.freeze({ "4-6": 8, "7-9": 6, "10-12": 5 });

export function thinkTimeSeconds(ageGroup) {
  return THINK_SECONDS_BY_AGE[ageGroup] ?? THINK_SECONDS_BY_AGE["7-9"];
}

/** Small, renderer-independent timer shared by both learning runners. */
export class LearningFocus {
  constructor({ ageGroup, onChange = () => {}, onReady = () => {} } = {}) {
    this.duration = thinkTimeSeconds(ageGroup);
    this.onChange = onChange;
    this.onReady = onReady;
    this.active = false;
    this.remaining = 0;
  }

  start() {
    this.active = true;
    this.remaining = this.duration;
    this.onChange(Math.ceil(this.remaining), true);
  }

  tick(deltaSeconds) {
    if (!this.active) return false;
    const previousSecond = Math.ceil(this.remaining);
    this.remaining = Math.max(0, this.remaining - deltaSeconds);
    const currentSecond = Math.ceil(this.remaining);
    if (currentSecond !== previousSecond) this.onChange(currentSecond, currentSecond > 0);
    if (this.remaining === 0) this.finish();
    return this.active;
  }

  ready() {
    if (!this.active) return false;
    this.finish();
    return true;
  }

  finish() {
    if (!this.active) return;
    this.active = false;
    this.remaining = 0;
    this.onChange(0, false);
    this.onReady();
  }
}
