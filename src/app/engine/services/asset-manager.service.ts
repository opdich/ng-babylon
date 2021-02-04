import { Injectable, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import {
  Scene,
  Color3,
  Color4,
  CubeTexture,
  GlowLayer,
  FxaaPostProcess,
  TonemapPostProcess,
  ImageProcessingPostProcess,
  Camera,
  DirectionalLight,
} from '@babylonjs/core';
import '@babylonjs/loaders/glTF';
import { config } from 'src/app/_config';

const ASSET_PATH = 'assets/webgl/';

@Injectable({
  providedIn: 'root',
})
export class AssetManagerService implements OnDestroy {
  private _sub: Subscription = new Subscription();
  private _scene: Scene;
  private _sun: DirectionalLight;

  constructor() {}

  ngOnDestroy() {
    this._sub.unsubscribe();
  }

  setScene(scene: Scene): void {
    this._scene = scene;
  }

  loadEnvironment(cameras: Camera[]): void {
    // Set scene coloration
    this._scene.clearColor = Color4.FromHexString(config.engine.env.clearHex);
    this._scene.ambientColor = Color3.FromHexString(
      config.engine.env.ambientHex
    );

    // Set lighting
    // HDR
    let hdrTexture = CubeTexture.CreateFromPrefilteredData(
      `${ASSET_PATH}hdr/${config.engine.env.hdr.file}`,
      this._scene
    );
    this._scene.environmentTexture = hdrTexture;
    this._scene.environmentIntensity = config.engine.env.hdr.intensity;

    // Directional Light
    this._sun = new DirectionalLight(
      'sun',
      config.engine.env.sun.dir,
      this._scene
    );
    this._sun.intensity = config.engine.env.sun.intensity;
    this._sun.diffuse = Color3.FromHexString(config.engine.env.sun.diffuse);

    // Set filters - needs to be done for each camera in scene
    cameras.forEach((camera) => {
      const fxaaProcess = new FxaaPostProcess('fxaa', 1.0, camera);
      const tonemapProcess = new TonemapPostProcess(
        'tonemap',
        config.camera.settings.tonemap,
        1,
        camera
      );
      const postProcess = new ImageProcessingPostProcess(
        'processing',
        1.0,
        camera
      );
      postProcess.contrast = config.camera.settings.contrast;
      postProcess.exposure = config.camera.settings.exposure;
    });

    // Set effects
    const gl = new GlowLayer('glow', this._scene);
    gl.intensity = 0.4;
  }
}
