import { Injectable, OnDestroy } from '@angular/core';
import {
  Scene,
  Color3,
  Color4,
  GlowLayer,
  DirectionalLight,
  MeshBuilder,
  PBRMaterial,
  ShadowGenerator,
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
  private _shadowGenerator: ShadowGenerator;
  scene: Scene;

  constructor() {}

  ngOnDestroy() {
    this._sub.unsubscribe();
  }

  setScene(scene: Scene): void {
    this.scene = scene;
  }

  checkInit$(): Observable<boolean> {
    return this._isInit$.pipe(take(1));
  }

  loadEnvironment(): void {
    // Set scene coloration
    this.scene.clearColor = Color4.FromHexString(config.engine.env.clearHex);
    this.scene.ambientColor = Color3.FromHexString(
      config.engine.env.ambientHex
    );

    // Set Environment
    this.scene.createDefaultLight();
    this.scene.createDefaultEnvironment({
      cameraExposure: config.camera.settings.exposure,
      createSkybox: config.engine.env.skybox.enable,
      skyboxSize: config.engine.env.skybox.size,
      skyboxColor: Color3.FromHexString(config.engine.env.skybox.hex),
      createGround: config.engine.env.ground.enable,
      groundSize: config.engine.env.ground.size,
      groundColor: Color3.FromHexString(config.engine.env.ground.hex),
    });

    // Directional Light
    this._sun = new DirectionalLight(
      'sun',
      config.engine.env.sun.dir,
      this.scene
    );
    this._sun.intensity = config.engine.env.sun.intensity;
    this._sun.diffuse = Color3.FromHexString(config.engine.env.sun.diffuse);
    this._shadowGenerator = new ShadowGenerator(2048, this._sun);

    // Set effects
    const gl = new GlowLayer('glow', this.scene);
    gl.intensity = 0.4;

    // Initialized
    this._isInit$.next(true);
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
