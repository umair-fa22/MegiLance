/**
 * Timer polyfill/shim for three-render-objects compatibility
 * The Timer class was removed from three.js main exports in newer versions
 * but three-render-objects still expects it to exist.
 * 
 * This provides a minimal Timer implementation that matches the three.js API.
 */

export class Timer {
  private _previousTime: number = 0;
  private _currentTime: number = 0;
  private _delta: number = 0;
  private _elapsed: number = 0;
  private _timescale: number = 1;
  private _useFixedDelta: boolean = false;
  private _fixedDelta: number = 16.67;

  constructor() {
    this._previousTime = 0;
    this._currentTime = 0;
  }

  getDelta(): number {
    return this._delta;
  }

  getElapsed(): number {
    return this._elapsed;
  }

  getTimescale(): number {
    return this._timescale;
  }

  setTimescale(timescale: number): this {
    this._timescale = timescale;
    return this;
  }

  useFixedDelta(fixedDelta: boolean): this {
    this._useFixedDelta = fixedDelta;
    return this;
  }

  setFixedDelta(fixedDelta: number): this {
    this._fixedDelta = fixedDelta;
    return this;
  }

  update(timestamp?: number): this {
    const newTime = timestamp !== undefined ? timestamp : performance.now();
    
    this._delta = this._useFixedDelta 
      ? this._fixedDelta 
      : (newTime - this._currentTime) * this._timescale;
    
    this._previousTime = this._currentTime;
    this._currentTime = newTime;
    this._elapsed += this._delta;
    
    return this;
  }

  reset(): this {
    this._previousTime = 0;
    this._currentTime = 0;
    this._delta = 0;
    this._elapsed = 0;
    return this;
  }

  dispose(): void {
    // Cleanup if needed
  }
}

export default Timer;
