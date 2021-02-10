import { Injectable, OnDestroy } from '@angular/core';
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
  MeshBuilder,
  PBRMaterial,
} from '@babylonjs/core';
import '@babylonjs/loaders/glTF';
import { Observable, ReplaySubject, Subscription } from 'rxjs';
import { take } from 'rxjs/operators';
import { config } from 'src/app/_config';

const ASSET_PATH = 'assets/webgl/';

@Injectable({
  providedIn: 'root',
})
export class AssetManagerService implements OnDestroy {
  private _isInit$: ReplaySubject<boolean> = new ReplaySubject(1);

  private _sub: Subscription = new Subscription();
  private _sun: DirectionalLight;

  scene: Scene;

  constructor() {}

  ngOnDestroy() {
    this._sub.unsubscribe();
  }

  setScene(scene: Scene): void {
    this.scene = scene;
    this._isInit$.next(true);
  }

  checkInit$(): Observable<boolean> {
    return this._isInit$.pipe(take(1));
  }

  loadEnvironment(cameras: Camera[]): void {
    // Set scene coloration
    this.scene.clearColor = Color4.FromHexString(config.engine.env.clearHex);
    this.scene.ambientColor = Color3.FromHexString(
      config.engine.env.ambientHex
    );

    // Set lighting
    // HDR
    let hdrTexture = CubeTexture.CreateFromPrefilteredData(
      `${ASSET_PATH}hdr/${config.engine.env.hdr.file}`,
      this.scene
    );
    this.scene.environmentTexture = hdrTexture;
    this.scene.environmentIntensity = config.engine.env.hdr.intensity;

    // Directional Light
    this._sun = new DirectionalLight(
      'sun',
      config.engine.env.sun.dir,
      this.scene
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
    const gl = new GlowLayer('glow', this.scene);
    gl.intensity = 0.4;
  }

  loadDefaultBox(): void {
    const box = MeshBuilder.CreateBox('box', {}, this.scene);

    const pbrMat = new PBRMaterial('pbr', this.scene);
    pbrMat.albedoColor = Color3.FromHexString('#526278');
    pbrMat.roughness = 0.9;
    pbrMat.metallic = 0;
    pbrMat.ambientColor = Color3.FromHexString('#283448');
    box.material = pbrMat;
  }

  createBasicPBRMat(
    albedo: string | Color3 = '#526278',
    ambient: string | Color3 = '#283448',
    roughness: number = 0.9,
    metallic: number = 0
  ): PBRMaterial {
    const mat = new PBRMaterial('pbr', this.scene);
    mat.albedoColor =
      typeof albedo === 'string' ? Color3.FromHexString(albedo) : albedo;
    mat.ambientColor =
      typeof ambient === 'string' ? Color3.FromHexString(ambient) : ambient;
    mat.roughness = roughness;
    mat.metallic = metallic;
    return mat;
  }
}
