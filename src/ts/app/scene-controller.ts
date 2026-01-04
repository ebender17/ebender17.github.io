import {ArcRotateCamera, HemisphericLight} from '@babylonjs/core';
import {Engine} from '@babylonjs/core/Engines/engine';
import {Vector3} from '@babylonjs/core/Maths/math.vector';
import {MeshBuilder} from '@babylonjs/core/Meshes/meshBuilder';
import {Scene} from '@babylonjs/core/scene';
import type {Application} from './application';
import '@babylonjs/core/Debug/debugLayer';
import '@babylonjs/inspector';

export class SceneController {
  private readonly contentResizeObserver = new ResizeObserver(this.onCanvasResize.bind(this));
  private readonly engine: Engine;
  private readonly scene: Scene;

  constructor(
    public readonly application: Application,
    public readonly canvas: HTMLCanvasElement,
  ) {
    this.engine = new Engine(canvas, true);
    this.scene = new Scene(this.engine);
  }

  prepare(): void {
    this.createScene();
    this.contentResizeObserver.observe(this.canvas, {box: 'border-box'});
    this.engine.runRenderLoop(this.onRenderLoop.bind(this));
    const urlParameters = new URLSearchParams(window.location.search);
    const hasDebug = urlParameters.has('debug');
    if (hasDebug) {
      this.scene.debugLayer.show({
        handleResize: true,
        overlay: true,
      });
    }
  }

  dispose(): void {
    this.scene.dispose();
    this.engine.dispose();
    this.contentResizeObserver.disconnect();
  }

  private createScene(): void {
    const camera = new ArcRotateCamera('camera', Math.PI / 2, Math.PI / 3, 6, new Vector3(0, 1, 0), this.scene);
    camera.attachControl(this.canvas, true);
    camera.inputs.removeByType('ArcRotateCameraMouseWheelInput');

    new HemisphericLight('light', new Vector3(0, 1, 0), this.scene);

    const sphere = MeshBuilder.CreateSphere('sphere', {diameter: 1}, this.scene);
    sphere.position.y = 1;

    MeshBuilder.CreateGround('ground', {width: 6, height: 6}, this.scene);
  }

  private onRenderLoop(): void {
    this.scene.render();
  }

  private onCanvasResize(): void {
    this.engine.resize();
    // Render to prevent flash of white
    this.onRenderLoop();
  }
}
