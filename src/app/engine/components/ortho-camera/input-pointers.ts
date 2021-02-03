import { OrthoCamera } from './camera';
import {
  Scene,
  Vector3,
  ICameraInput,
  Nullable,
  Matrix,
  Plane,
  Observer,
  EventState,
  PointerInfo,
  PointerEventTypes,
  PointerTouch,
  Tools,
} from '@babylonjs/core';

enum MouseState {
  NONE,
  CLICK,
  PAN,
}

/* Reference */
// Multi Touch
// https://forum.babylonjs.com/t/free-camera-with-custom-fov-zoom-control-for-pinch-gesture/1657/5
// https://github.com/BabylonJS/Babylon.js/blob/master/src/Cameras/Inputs/BaseCameraPointersInput.ts
// For custom controller
// https://doc.babylonjs.com/how_to/customizing_camera_inputs
// https://www.babylonjs-playground.com/#6PA720
// For top down controls
// https://www.babylonjs-playground.com/#E2Q8RH#9
// https://forum.babylonjs.com/t/addition-of-camera-type-that-matches-3d-applications/8359/17

export class AxonPointersInput implements ICameraInput<OrthoCamera> {
  camera: OrthoCamera;
  private _scene: Scene;
  private _mouseState: MouseState = MouseState.NONE;

  // Calculators
  private _identity: Matrix = Matrix.Identity();
  private _plane: Plane = Plane.FromPositionAndNormal(
    new Vector3(0, 0, 0),
    new Vector3(0, 1, 0)
  );
  private _pickOrigin: Nullable<Vector3> = null;

  // Buttons
  protected _altKey: boolean;
  protected _ctrlKey: boolean;
  protected _metaKey: boolean;
  protected _shiftKey: boolean;

  // Which mouse buttons were pressed at time of last mouse event.
  // https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/buttons
  protected _buttonsPressed: number;

  // Defines the buttons associated with the input to handle camera move.
  public buttons = [0, 1, 2];

  // Zoom pinch
  public pinchPrecision = 12000.0;
  private _twoFingerActivityCount: number = 0;
  private _isPinching: boolean = false;

  public attachControl(noPreventDefault?: boolean): void {
    let engine = this.camera.getEngine();
    const element = engine.getInputElement();
    this._scene = this.camera.getScene();
    let previousPinchSquaredDistance = 0;

    this.pointA = null;
    this.pointB = null;

    this._buttonsPressed = 0;

    this._pointerInput = (p, s) => {
      let evt = <PointerEvent>p.event;
      let isTouch = evt.pointerType === 'touch';

      if (
        p.type !== PointerEventTypes.POINTERMOVE &&
        this.buttons.indexOf(evt.button) === -1
      ) {
        return;
      }

      let srcElement = <HTMLElement>(evt.srcElement || evt.target);

      this._altKey = evt.altKey;
      this._ctrlKey = evt.ctrlKey;
      this._metaKey = evt.metaKey;
      this._shiftKey = evt.shiftKey;
      this._buttonsPressed = evt.buttons;

      if (engine.isPointerLock) {
        let offsetX =
          evt.movementX ||
          evt.mozMovementX ||
          evt.webkitMovementX ||
          evt.msMovementX ||
          0;
        let offsetY =
          evt.movementY ||
          evt.mozMovementY ||
          evt.webkitMovementY ||
          evt.msMovementY ||
          0;

        this.onTouch(null, offsetX, offsetY);
        this.pointA = null;
        this.pointB = null;
      } else if (p.type === PointerEventTypes.POINTERDOWN && srcElement) {
        try {
          srcElement.setPointerCapture(evt.pointerId);
        } catch (e) {
          //Nothing to do with the error. Execution will continue.
        }

        if (this.pointA === null) {
          this.pointA = {
            x: evt.clientX,
            y: evt.clientY,
            pointerId: evt.pointerId,
            type: evt.pointerType,
          };
        } else if (this.pointB === null) {
          this.pointB = {
            x: evt.clientX,
            y: evt.clientY,
            pointerId: evt.pointerId,
            type: evt.pointerType,
          };
        }

        this.onButtonDown(evt, p);

        if (!noPreventDefault) {
          evt.preventDefault();
          element && element.focus();
        }
      } else if (p.type === PointerEventTypes.POINTERDOUBLETAP) {
        this.onDoubleTap(evt.pointerType);
      } else if (p.type === PointerEventTypes.POINTERUP && srcElement) {
        try {
          srcElement.releasePointerCapture(evt.pointerId);
        } catch (e) {
          //Nothing to do with the error.
        }

        if (!isTouch) {
          this.pointB = null; // Mouse and pen are mono pointer
        }

        //would be better to use pointers.remove(evt.pointerId) for multitouch gestures,
        //but emptying completely pointers collection is required to fix a bug on iPhone :
        //when changing orientation while pinching camera,
        //one pointer stay pressed forever if we don't release all pointers
        //will be ok to put back pointers.remove(evt.pointerId); when iPhone bug corrected
        if (engine._badOS) {
          this.pointA = this.pointB = null;
        } else {
          //only remove the impacted pointer in case of multitouch allowing on most
          //platforms switching from rotate to zoom and pan seamlessly.
          if (
            this.pointB &&
            this.pointA &&
            this.pointA.pointerId == evt.pointerId
          ) {
            this.pointA = this.pointB;
            this.pointB = null;
          } else if (
            this.pointA &&
            this.pointB &&
            this.pointB.pointerId == evt.pointerId
          ) {
            this.pointB = null;
          } else {
            this.pointA = this.pointB = null;
          }
        }

        if (previousPinchSquaredDistance !== 0) {
          // Previous pinch data is populated but a button has been lifted
          // so pinch has ended.
          this.onMultiTouch(
            this.pointA,
            this.pointB,
            previousPinchSquaredDistance,
            0 // pinchSquaredDistance
          );
          previousPinchSquaredDistance = 0;
        }

        this.onButtonUp(evt);

        if (!noPreventDefault) {
          evt.preventDefault();
        }
      } else if (p.type === PointerEventTypes.POINTERMOVE) {
        if (!noPreventDefault) {
          evt.preventDefault();
        }

        // One button down
        if (this.pointA && this.pointB === null) {
          let offsetX = evt.clientX - this.pointA.x;
          let offsetY = evt.clientY - this.pointA.y;
          this.onTouch(this.pointA, offsetX, offsetY);

          this.pointA.x = evt.clientX;
          this.pointA.y = evt.clientY;
        }
        // Two buttons down: pinch
        else if (this.pointA && this.pointB) {
          let ed =
            this.pointA.pointerId === evt.pointerId ? this.pointA : this.pointB;
          ed.x = evt.clientX;
          ed.y = evt.clientY;
          let distX = this.pointA.x - this.pointB.x;
          let distY = this.pointA.y - this.pointB.y;
          let pinchSquaredDistance = distX * distX + distY * distY;

          this.onMultiTouch(
            this.pointA,
            this.pointB,
            previousPinchSquaredDistance,
            pinchSquaredDistance
          );

          previousPinchSquaredDistance = pinchSquaredDistance;
        }
      }
    };

    this._observer = this.camera
      .getScene()
      .onPointerObservable.add(
        this._pointerInput,
        PointerEventTypes.POINTERDOWN |
          PointerEventTypes.POINTERUP |
          PointerEventTypes.POINTERMOVE
      );

    this._onLostFocus = () => {
      this.pointA = this.pointB = null;
      previousPinchSquaredDistance = 0;
      this.onLostFocus();
    };

    element &&
      element.addEventListener(
        'contextmenu',
        <EventListener>this.onContextMenu.bind(this),
        false
      );

    let hostWindow = this.camera.getScene().getEngine().getHostWindow();

    if (hostWindow) {
      Tools.RegisterTopRootEvents(hostWindow, [
        { name: 'blur', handler: this._onLostFocus },
      ]);
    }
  }

  detachControl(ignored?: any): void {
    if (this._onLostFocus) {
      let hostWindow = this.camera.getScene().getEngine().getHostWindow();
      if (hostWindow) {
        Tools.UnregisterTopRootEvents(hostWindow, [
          { name: 'blur', handler: this._onLostFocus },
        ]);
      }
    }

    if (this._observer) {
      this.camera.getScene().onPointerObservable.remove(this._observer);
      this._observer = null;

      if (this.onContextMenu) {
        const inputElement = this.camera
          .getScene()
          .getEngine()
          .getInputElement();
        inputElement &&
          inputElement.removeEventListener(
            'contextmenu',
            <EventListener>this.onContextMenu
          );
      }

      this._onLostFocus = null;
    }

    this._altKey = false;
    this._ctrlKey = false;
    this._metaKey = false;
    this._shiftKey = false;
    this._buttonsPressed = 0;

    this._mouseState = MouseState.NONE;
    this._pickOrigin = null;
  }

  public getClassName(): string {
    return 'AxonPointersInput';
  }

  public getSimpleName(): string {
    return 'pointers';
  }

  // Called on pointer POINTERDOUBLETAP event.
  protected onDoubleTap(type: string) {}

  // Called on pointer POINTERMOVE event if only a single touch is active.
  protected onTouch(
    point: Nullable<PointerTouch>,
    offsetX: number,
    offsetY: number
  ): void {
    //check the mouse state and update to panning
    if (this._mouseState === MouseState.CLICK)
      this._mouseState = MouseState.PAN;
    //if panning, calculate the camera translation
    if (this._mouseState === MouseState.PAN) {
      let ray = this._scene.createPickingRay(
        point.x,
        point.y,
        this._identity,
        this.camera,
        false
      );
      let distance = ray.intersectsPlane(this._plane);
      let pickedPoint = ray.direction.scale(distance).add(ray.origin);
      let diff = pickedPoint.subtract(this._pickOrigin);

      // Check if out of bounds
      if (this.camera.target.x - diff.x >= this.camera.panMaxX) diff.x = 0;
      if (this.camera.target.x - diff.x <= this.camera.panMinX) diff.x = 0;
      if (this.camera.target.z - diff.z >= this.camera.panMaxZ) diff.z = 0;
      if (this.camera.target.z - diff.z <= this.camera.panMinZ) diff.z = 0;

      this.camera.target.subtractInPlace(new Vector3(diff.x, 0, diff.z));
      return;
    }
  }

  // Called on pointer POINTERMOVE event if multiple touches are active.
  protected onMultiTouch(
    pointA: Nullable<PointerTouch>,
    pointB: Nullable<PointerTouch>,
    previousPinchSquaredDistance: number,
    pinchSquaredDistance: number
  ): void {
    if (previousPinchSquaredDistance === 0) {
      // First time this method is called for new pinch.
      // Next time this is called there will be a
      // previousPinchSquaredDistance and pinchSquaredDistance to compare.
      return;
    }
    if (pinchSquaredDistance === 0) {
      // Last time this method is called at the end of a pinch.
      return;
    }

    // interial pinch
    let delta =
      (pinchSquaredDistance - previousPinchSquaredDistance) /
      this.pinchPrecision;

    //// TODO: test this
    const limit = 0.5;
    if (Math.abs(delta) > limit) delta = limit * (delta / Math.abs(delta));

    this.camera.updateZoom(delta);
  }

  // Called on JS contextmenu event.
  protected onContextMenu(evt: PointerEvent): void {
    evt.preventDefault();
  }

  // Called each time a new POINTERDOWN event occurs. Ie, for each buttonpress.
  protected onButtonDown(evt: PointerEvent, p: PointerInfo): void {
    let distance = p.pickInfo.ray.intersectsPlane(this._plane);
    this._pickOrigin = p.pickInfo.ray.direction
      .scale(distance)
      .add(p.pickInfo.ray.origin);

    //set the state
    this._mouseState = MouseState.CLICK;
  }

  // Called each time a new POINTERUP event occurs. Ie, for each button release.
  protected onButtonUp(evt: PointerEvent): void {
    //reset
    this._mouseState = MouseState.NONE;
    this._pickOrigin = null;
    this._twoFingerActivityCount = 0;
    this._isPinching = false;
  }

  // Called when window becomes inactive.
  protected onLostFocus(): void {}

  private _pointerInput: (p: PointerInfo, s: EventState) => void;
  private _observer: Nullable<Observer<PointerInfo>>;
  private _onLostFocus: Nullable<(e: FocusEvent) => any>;
  private pointA: Nullable<PointerTouch>;
  private pointB: Nullable<PointerTouch>;
}
