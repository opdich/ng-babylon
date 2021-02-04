import { ElementRef, Injectable, NgZone } from '@angular/core';

import {
  Engine,
  Scene,
  Color4,
  MeshBuilder,
  PBRMaterial,
  Color3,
} from '@babylonjs/core';

import { AssetManagerService } from './asset-manager.service';
import { CameraService } from './camera.service';

/* Reference */
// https://github.com/JohnnyDevNull/ng-babylon-template/blob/master/src/app/engine/engine.service.ts

@Injectable({
  providedIn: 'root',
})
export class EngineService {
  private _canvas: HTMLCanvasElement;
  private _engine: Engine;
  private _scene: Scene;

  constructor(
    private _ngZone: NgZone,
    private _ams: AssetManagerService,
    private _cs: CameraService
  ) {}

  buildScene(canvas: ElementRef<HTMLCanvasElement>): void {
    /* Boilerplate */
    this._canvas = canvas.nativeElement;
    this._engine = new Engine(this._canvas, true, { stencil: true });

    /* Init Scene */
    this._scene = new Scene(this._engine);
    this._scene.resetLastAnimationTimeFrame(); // Enables animations during loading

    // Build the cameras
    this._cs.loadCamera(this._canvas, this._scene);

    /* Load Assets */
    this._ams.setScene(this._scene);
    this._ams.loadEnvironment([this._cs.camera]);

    const box = MeshBuilder.CreateBox('box', {}, this._scene);
    let pbrMat = new PBRMaterial('name', this._scene);
    pbrMat.albedoColor = Color3.FromHexString('#526278');
    pbrMat.roughness = 0.9;
    pbrMat.metallic = 0;
    pbrMat.ambientColor = Color3.FromHexString('#283448');
    box.material = pbrMat;
  }

  animate(): void {
    // We have to run this outside angular zones,
    // because it could trigger heavy changeDetection cycles.
    this._ngZone.runOutsideAngular(() => {
      const rendererLoopCallback = () => {
        this._scene.render();
      };

      if (document.readyState !== 'loading') {
        this._engine.runRenderLoop(rendererLoopCallback);
      } else {
        window.addEventListener('DOMContentLoaded', () => {
          this._engine.runRenderLoop(rendererLoopCallback);
        });
      }

      window.addEventListener('resize', () => {
        this._engine.resize();
        this._cs.resize();
      });
    });
  }
}
