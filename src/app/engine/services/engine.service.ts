import { ElementRef, Injectable, NgZone } from '@angular/core';

import { Engine, Scene } from '@babylonjs/core';
import { RenderProjectionService } from 'src/app/shared/services/render-projection.service';

import { AssetManagerService } from './asset-manager.service';
import { CameraService } from './camera.service';

/* Reference */
// https://github.com/JohnnyDevNull/ng-babylon-template/blob/master/src/app/engine/engine.service.ts

@Injectable({
  providedIn: 'root',
})
export class EngineService {
  canvas: HTMLCanvasElement;
  engine: Engine;
  scene: Scene;

  constructor(
    private _ngZone: NgZone,
    private _ams: AssetManagerService,
    private _cs: CameraService,
    private _rps: RenderProjectionService
  ) {}

  buildScene(canvas: ElementRef<HTMLCanvasElement>): void {
    /* Boilerplate */
    this.canvas = canvas.nativeElement;
    this.engine = new Engine(this.canvas, true, { stencil: true });

    /* Init Scene */
    this.scene = new Scene(this.engine);
    this.scene.resetLastAnimationTimeFrame(); // Enables animations during loading

    // Build the cameras
    this._cs.loadCamera(this.canvas, this.scene);

    // Start the depth renderer
    this._rps.setRenderer(this.engine, this.scene);

    /* Load Assets */
    this._ams.setScene(this.scene);
    this._ams.loadEnvironment();
    this._ams.loadDefaultBox();
  }

  animate(): void {
    // We have to run this outside angular zones,
    // because it could trigger heavy changeDetection cycles.
    this._ngZone.runOutsideAngular(() => {
      const rendererLoopCallback = () => {
        this.scene.render();
      };

      if (document.readyState !== 'loading') {
        this.engine.runRenderLoop(rendererLoopCallback);
      } else {
        window.addEventListener('DOMContentLoaded', () => {
          this.engine.runRenderLoop(rendererLoopCallback);
        });
      }

      window.addEventListener('resize', () => {
        this.engine.resize();
        this._cs.resize();
      });
    });
  }
}
