import { Injectable } from '@angular/core';
import {
  Animation,
  EasingFunction,
  Matrix,
  Plane,
  Ray,
  Scene,
  SineEase,
  Vector3,
} from '@babylonjs/core';
import { Observable, Subject } from 'rxjs';
import { AxonCamera } from '../components/ortho-camera/camera';
import { config } from 'src/app/_config';

@Injectable({
  providedIn: 'root',
})
export class CameraService {
  scene: Scene;
  camera: AxonCamera;
  private _ease: SineEase = new SineEase();
  private _identity: Matrix = Matrix.Identity();
  private _plane: Plane = Plane.FromPositionAndNormal(
    new Vector3(0, 0, 0),
    new Vector3(0, 1, 0)
  );
  private _rotation$: Subject<{
    val: number;
    duration: number;
  }> = new Subject();

  constructor() {
    this.init();
  }

  init(): void {
    this._ease.setEasingMode(EasingFunction.EASINGMODE_EASEOUT);
  }

  loadCamera(canvas: HTMLCanvasElement, scene: Scene) {
    this.scene = scene;
    this.camera = new AxonCamera(
      'cameraMain',
      config.camera.ortho.rot_angle,
      config.camera.ortho.scale_factor,
      config.camera.ortho.scale_delta,
      config.camera.ortho.scale_upper_limit,
      config.camera.ortho.scal_lower_limit,
      config.camera.ortho.pan_max_x,
      config.camera.ortho.pan_min_x,
      config.camera.ortho.pan_max_z,
      config.camera.ortho.pan_min_z,
      scene
    );
    // Attach it and set active
    this.camera.attachControl(canvas, true);
    scene.activeCameras.push(this.camera);
  }

  /* Basic actions */
  moveTo(
    pickedPoint: Vector3,
    duration: number = 400,
    onComplete: () => void = () => {}
  ): void {
    let ray: Ray = this.scene.createPickingRay(
      0,
      0,
      this._identity,
      this.camera,
      false
    );
    let distance = ray.intersectsPlane(this._plane);
    let pickOrigin: Vector3 = ray.direction.scale(distance).add(ray.origin);
    let diff: Vector3 = pickOrigin.subtract(pickedPoint);
    let newTarget = new Vector3(
      this.camera.target.x - diff.x,
      0,
      this.camera.target.z - diff.z
    );

    const alpha = this.camera.alpha;
    const beta = this.camera.beta;

    // Lazy move with target + ab fix
    Animation.CreateAndStartAnimation(
      'rotateCamera',
      this.camera,
      'target',
      30,
      (duration / 1000) * 30,
      this.camera.target,
      newTarget,
      0,
      this._ease,
      onComplete
    );
    this.smoothFixAlphaBeta(true, alpha, duration);
    this.smoothFixAlphaBeta(false, beta, duration);
  }
  rotate(duration: number = 400, onComplete: () => void = () => {}): void {
    // Broadcast the final rotation to start
    // Do this before so things can animate in sync
    this._rotation$.next({
      val: this.camera.alpha + Math.PI / 2,
      duration: duration,
    });

    // Set the target to the middle of the screen
    const canvas = this.scene.getEngine().getRenderingCanvas();
    let ray = this.scene.createPickingRay(
      canvas.width / 2,
      canvas.height / 2,
      this._identity,
      this.camera,
      false
    );

    let distance = ray.intersectsPlane(this._plane);
    //if the distance is none, return
    if (distance === null) return;

    // Set the camera target
    this.camera.target = ray.direction.scale(distance).add(ray.origin);

    // THen rotate the camera about the center
    Animation.CreateAndStartAnimation(
      'rotateCamera',
      this.camera,
      'alpha',
      30,
      (duration / 1000) * 30,
      this.camera.alpha,
      this.camera.alpha + Math.PI / 2,
      0,
      this._ease,
      onComplete
    );
  }
  zoom(dir: number): void {
    this.camera.updateZoom(dir);
  }
  resize(): void {
    this.camera.updateOrtho();
  }
  reset() {
    this.camera.setTarget(Vector3.Zero());
    this.camera.updateOrtho(true);
  }

  /* Helper Methods */
  smoothFixAlphaBeta(isAlpha: boolean, val: number, duration: number): void {
    Animation.CreateAndStartAnimation(
      'smoothFixAB',
      this.camera,
      isAlpha ? 'alpha' : 'beta',
      30,
      (duration / 1000) * 30 + 1, // Add an extra frame so it finishes after the animation
      isAlpha ? this.camera.alpha : this.camera.beta,
      val,
      0,
      this._ease
    );
  }

  getRotation$(): Observable<{ val: number; duration: number }> {
    return this._rotation$.asObservable();
  }
}
