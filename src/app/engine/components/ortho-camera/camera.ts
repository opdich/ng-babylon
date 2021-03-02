import { AxonPointersInput } from './input-pointers';
import { AxonMousewheelInput } from './input-mousewheel';
import {
  Camera,
  ArcRotateCamera,
  Scene,
  Viewport,
  Vector3,
} from '@babylonjs/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

export class OrthoCamera extends ArcRotateCamera {
  protected _canvas: HTMLElement;
  public curScaleFactor: number;
  private _curScaleFactor$: BehaviorSubject<number> = new BehaviorSubject(0);

  constructor(
    name: string,
    private _alphaBase: number,
    private _betaBase: number,
    public scaleFactor: number,
    public scaleDelta: number,
    public scaleUpperLimit: number,
    public scaleLowerLimit: number,
    public panMaxX: number,
    public panMinX: number,
    public panMaxZ: number,
    public panMinZ: number,
    public scene: Scene
  ) {
    /* Implement ArcRotateCamera */
    super(name, _alphaBase, _betaBase, 1000, Vector3.Zero(), scene);

    /* Ortho Specific */
    this.mode = Camera.ORTHOGRAPHIC_CAMERA;
    this.viewport = new Viewport(0, 0, 1.0, 1.0);

    /* Controllers */
    // Remove all default controllers
    this.inputs.removeByType('ArcRotateCameraKeyboardMoveInput');
    this.inputs.removeByType('ArcRotateCameraMouseWheelInput');
    this.inputs.removeByType('ArcRotateCameraPointersInput');

    // Update the view
    this._canvas = this.getEngine().getRenderingCanvas();
    this.updateOrtho(true);
  }

  updateOrtho(isResetToGridSize = false): void {
    // Get the starting alpha + beta
    const alpha = this.alpha;
    const beta = this.beta;

    // Get the adjustment factor - based on the height of the canvas
    let boundingRect: DOMRect = this._canvas.getBoundingClientRect();

    // Reset the zoom value
    if (isResetToGridSize) {
      this.curScaleFactor = this.scaleFactor;
      this._curScaleFactor$.next(this.curScaleFactor);
    }
    // Adjust all the boundaries
    this.setOrthoVals(
      boundingRect.width,
      boundingRect.height,
      1 / this.curScaleFactor
    );

    // Reset the target
    this.setTarget(this.target);

    // Reset the angles
    this.alpha = alpha;
    this.beta = beta;
  }

  updateZoom(delta: number) {
    // Get the adjustment factor - based on the height of the canvas
    let boundingRect: DOMRect = this._canvas.getBoundingClientRect();

    // Calculate the scale factor
    this.curScaleFactor =
      this.curScaleFactor * Math.pow(this.scaleDelta, -delta);

    // Limit the scaling
    if (this.curScaleFactor < this.scaleUpperLimit)
      this.curScaleFactor = this.scaleUpperLimit;
    else if (this.curScaleFactor > this.scaleLowerLimit)
      this.curScaleFactor = this.scaleLowerLimit;

    // Then update the zoom
    this.setOrthoVals(
      boundingRect.width,
      boundingRect.height,
      1 / this.curScaleFactor
    );

    // Broadcast new scale factor
    this._curScaleFactor$.next(this.curScaleFactor);
  }

  setOrthoVals(dimX: number, dimY: number, multiplier: number): void {
    for (let i = 0; i < 4; i++) {
      // Parse to get the correct dimension, direction
      let dimVal = dimY;
      let dir = 1;
      if (i > 1) dimVal = dimX;
      if (i % 2 === 1) dir = -1;

      // Parse for the correct value
      switch (i) {
        case 0:
          this.orthoTop = dimVal * dir * multiplier;
          break;
        case 1:
          this.orthoBottom = dimVal * dir * multiplier;
          break;
        case 2:
          this.orthoRight = dimVal * dir * multiplier;
          break;
        case 3:
        default:
          this.orthoLeft = dimVal * dir * multiplier;
          break;
      }
    }
  }

  getScaleFactor$(): Observable<number> {
    return this._curScaleFactor$.asObservable();
  }
}

export class AxonCamera extends OrthoCamera {
  constructor(
    name: string,
    private _rotAxon: number,
    scaleFactor: number,
    scaleDelta: number,
    scaleUpperLimit: number,
    scaleLowerLimit: number,
    public panMaxX: number,
    public panMinX: number,
    public panMaxZ: number,
    public panMinZ: number,
    scene: Scene
  ) {
    /* Implement OrthoCamera in Isometric orientation */
    super(
      name,
      _rotAxon,
      Math.PI / 4,
      scaleFactor,
      scaleDelta,
      scaleUpperLimit,
      scaleLowerLimit,
      panMaxX,
      panMinX,
      panMaxZ,
      panMinZ,
      scene
    );

    /* Add in Axon Controllers */
    this.inputs.add(new AxonPointersInput());
    this.inputs.add(new AxonMousewheelInput());
  }
}
