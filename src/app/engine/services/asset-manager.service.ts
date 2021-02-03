import { Injectable, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import {
  Scene,
  SceneLoader,
  Color3,
  Color4,
  CubeTexture,
  Vector3,
  GlowLayer,
  AssetContainer,
  FxaaPostProcess,
  TonemapPostProcess,
  ImageProcessingPostProcess,
  TonemappingOperator,
  Camera,
  DirectionalLight,
  Texture,
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

  loadEnvironment(
    cameras: Camera[],
    hdrFile: string = 'hdr/photo_studio.env',
    clear: Color4 = new Color4(1, 1, 1, 1),
    ambient: Color3 = new Color3(1, 1, 1),
    sunDiffuse: Color3 = new Color3(1, 1, 0.9),
    sunDirection: Vector3 = new Vector3(1, -3, 0)
  ): void {
    // Set scene coloration
    this._scene.clearColor = clear;
    this._scene.ambientColor = ambient;

    // Set lighting
    // HDR
    let hdrTexture = CubeTexture.CreateFromPrefilteredData(
      ASSET_PATH + hdrFile,
      this._scene
    );
    this._scene.environmentTexture = hdrTexture;
    this._scene.environmentIntensity = 3;

    // Directional Light
    this._sun = new DirectionalLight('sun', sunDirection, this._scene);
    this._sun.intensity = 0.5;
    this._sun.diffuse = sunDiffuse;

    // Set filters - needs to be done for each camera in scene
    cameras.forEach((camera) => {
      const fxaaProcess = new FxaaPostProcess('fxaa', 1.0, camera);
      const tonemapProcess = new TonemapPostProcess(
        'tonemap',
        TonemappingOperator.Photographic,
        config.camera.settings.exposure,
        camera
      );
      const postProcess = new ImageProcessingPostProcess(
        'processing',
        1.0,
        camera
      );
      postProcess.contrast = config.camera.settings.contrast;
    });

    // Set effects
    const gl = new GlowLayer('glow', this._scene);
    gl.intensity = 0.4;
  }
}
