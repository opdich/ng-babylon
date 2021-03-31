import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { Engine, Scene, Vector3 } from '@babylonjs/core';
import { Observable, ReplaySubject } from 'rxjs';
import { take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class RenderProjectionService implements OnDestroy {
  private _isInit$: ReplaySubject<boolean> = new ReplaySubject(1);

  private _engine: Engine;
  private _scene: Scene;

  constructor(private _ngZone: NgZone) {}

  setRenderer(engine: Engine, scene: Scene): void {
    this._engine = engine;
    this._scene = scene;

    // Broadcast ready
    this._isInit$.next(true);
  }

  ngOnDestroy(): void {
    this._scene.onBeforeRenderObservable.clear();
  }

  checkInit$(): Observable<boolean> {
    return this._isInit$.pipe(take(1));
  }

  addOBR(
    inputCallback: () => Vector3[],
    outputCallback: (screenCoords: Vector3, i: number) => void,
    isOnce: boolean = false
  ): void {
    this.checkInit$().subscribe(() => {
      this._ngZone.runOutsideAngular(() => {
        isOnce
          ? this._scene.onBeforeRenderObservable.addOnce(() =>
              this.handleOBR(inputCallback, outputCallback)
            )
          : this._scene.onBeforeRenderObservable.add(() =>
              this.handleOBR(inputCallback, outputCallback)
            );
      });
    });
  }

  handleOBR(
    inputCallback: () => Vector3[],
    outputCallback: (screenCoords: Vector3, i: number) => void
  ): void {
    inputCallback().forEach((coord, i) => {
      let posInViewProj = Vector3.TransformCoordinates(
        coord,
        this._scene.getTransformMatrix()
      );
      let screenCoords = posInViewProj
        .multiplyByFloats(0.5, -0.5, 1.0)
        .add(new Vector3(0.5, 0.5, 0.0))
        .multiplyByFloats(
          this._engine.getRenderWidth(),
          this._engine.getRenderHeight(),
          1
        );
      outputCallback(screenCoords, i);
    });
  }
}
