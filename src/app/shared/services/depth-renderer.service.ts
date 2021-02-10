import { Injectable, NgZone, OnDestroy } from '@angular/core';
import {
  Camera,
  DepthRenderer,
  Engine,
  RenderTargetTexture,
  Scene,
  Vector3,
} from '@babylonjs/core';
import { Observable, ReplaySubject } from 'rxjs';
import { take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class DepthRendererService implements OnDestroy {
  private _isInit$: ReplaySubject<boolean> = new ReplaySubject(1);

  private _engine: Engine;
  private _camera: Camera;
  private _scene: Scene;
  private _renderer: DepthRenderer;

  private _depthMap: RenderTargetTexture;
  private _buffer: Float32Array;

  constructor(private _ngZone: NgZone) {}

  setRenderer(engine: Engine, scene: Scene, camera: Camera): void {
    this._engine = engine;
    this._camera = camera;
    this._scene = scene;
    this._renderer = this._scene.enableDepthRenderer(camera, false);

    this._ngZone.runOutsideAngular(() => {
      this._initOBR();
    });

    // Broadcast ready
    this._isInit$.next(true);
  }

  private _initOBR(): void {
    this._depthMap = this._renderer.getDepthMap();
    this._buffer = new Float32Array(
      4 * this._depthMap.getSize().width * this._depthMap.getSize().height
    );
  }

  ngOnDestroy(): void {
    this._scene.onBeforeRenderObservable.clear();
  }

  checkInit$(): Observable<boolean> {
    return this._isInit$.pipe(take(1));
  }

  addOBR(
    inputCallback: () => Vector3[],
    outputCallback: (screenCoords: Vector3, i: number) => void
  ): void {
    this.checkInit$().subscribe(() => {
      this._scene.onBeforeRenderObservable.add(() => {
        this._depthMap.readPixels(0, 0, this._buffer);

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
      });
    });
  }
}
