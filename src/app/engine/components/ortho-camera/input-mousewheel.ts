import { OrthoCamera } from './camera';
import {
  ICameraInput,
  Nullable,
  Observer,
  EventState,
  PointerInfo,
  PointerEventTypes,
} from '@babylonjs/core';

// impor;

/* Reference */
// https://github.com/BabylonJS/Babylon.js/blob/master/src/Cameras/Inputs/arcRotateCameraMouseWheelInput.ts

export class AxonMousewheelInput implements ICameraInput<OrthoCamera> {
  /* Babylon stuffs */
  camera: OrthoCamera;

  /* Zoom properties */
  wheelPrecision = 3.0;

  /* Pointer Properties */
  private _observer: Observer<PointerInfo>;
  private _wheel: Nullable<(p: PointerInfo, s: EventState) => void>;

  getClassName(): string {
    return 'AxonMousewheelInput';
  }
  getSimpleName(): string {
    return 'mousewheel';
  }
  attachControl(noPreventDefault?: boolean): void {
    this._wheel = (p, s) => {
      //sanity check - this should be a PointerWheel event.
      if (p.type !== PointerEventTypes.POINTERWHEEL) {
        return;
      }
      var event = <MouseWheelEvent>p.event;
      var delta = 0;

      let mouseWheelLegacyEvent = event as any;
      let wheelDelta = 0;

      if (mouseWheelLegacyEvent.wheelDelta) {
        wheelDelta = mouseWheelLegacyEvent.wheelDelta;
      } else {
        wheelDelta = -(event.deltaY || event.detail) * 60;
      }

      delta = wheelDelta / (this.wheelPrecision * 40);

      if (delta) {
        if (delta > 5) delta = 3;
        else if (delta < -5) delta = -3;

        // Send to the camera where everything is handled in one place
        this.camera.updateZoom(delta);
      }

      if (event.preventDefault) {
        if (!noPreventDefault) {
          event.preventDefault();
        }
      }
    };

    this._observer = this.camera
      .getScene()
      .onPointerObservable.add(this._wheel, PointerEventTypes.POINTERWHEEL);
  }

  detachControl(ignored?: any): void {
    if (this._observer) {
      this.camera.getScene().onPointerObservable.remove(this._observer);
      this._observer = null;
      this._wheel = null;
    }
  }
}
