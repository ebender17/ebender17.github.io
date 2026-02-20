import {ArcRotateCamera} from '@babylonjs/core/Cameras/arcRotateCamera';
import {Engine} from '@babylonjs/core/Engines/engine';
import {HemisphericLight} from '@babylonjs/core/Lights/hemisphericLight';
import {Material} from '@babylonjs/core/Materials/material';
import {RegisterMaterialPlugin} from '@babylonjs/core/Materials/materialPluginManager';
import {PBRMaterial} from '@babylonjs/core/Materials/PBR/pbrMaterial';
import {Color3} from '@babylonjs/core/Maths/math.color';
import {Vector3} from '@babylonjs/core/Maths/math.vector';
import {Mesh} from '@babylonjs/core/Meshes/mesh';
import {MeshBuilder} from '@babylonjs/core/Meshes/meshBuilder';
import {Scene} from '@babylonjs/core/scene';
import type {Application} from './application';
import {StainedGlassMaterialPlugin} from './material-plugins/stained-glass-material-plugin';
import '@babylonjs/core/Debug/debugLayer';
import '@babylonjs/inspector';

export class SceneController {
  private readonly contentResizeObserver = new ResizeObserver(this.onCanvasResize.bind(this));
  private readonly engine: Engine;
  private readonly scene: Scene;
  private readonly glassColors: Color3[] = [
    Color3.FromHexString('#48D9FA').toLinearSpace(),
    Color3.FromHexString('#48A1FA').toLinearSpace(),
    Color3.FromHexString('#48FAE1').toLinearSpace(),
    Color3.FromHexString('#48FAA4').toLinearSpace(),
    Color3.FromHexString('#4869FA').toLinearSpace(),
    Color3.FromHexString('#9CE9FA').toLinearSpace(),
  ];

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
    RegisterMaterialPlugin(
      StainedGlassMaterialPlugin.name,
      (material: Material): StainedGlassMaterialPlugin | null => {
        if (!(material instanceof PBRMaterial)) { return null; }
        return new StainedGlassMaterialPlugin(material, Color3.Black(), this.glassColors);
      },
    );

    // Camera
    const camera = new ArcRotateCamera('camera', Math.PI / 2, Math.PI / 3, 6, new Vector3(0, 1, 0), this.scene);
    camera.attachControl(this.canvas, true);
    camera.inputs.removeByType('ArcRotateCameraMouseWheelInput');

    // Lights
    new HemisphericLight('light', new Vector3(0, 1, 0), this.scene);

    // Mesh
    const sphere = MeshBuilder.CreateSphere('sphere', {diameter: 1}, this.scene);
    sphere.position.y = 1;

    const plane = MeshBuilder.CreatePlane('plane', {sideOrientation: Mesh.DOUBLESIDE}, this.scene);
    plane.position = new Vector3(-0.1, 1, 1);
    const stainedGlassMaterial = new PBRMaterial('stainedGlass', this.scene);
    stainedGlassMaterial.metallic = 0.4;
    stainedGlassMaterial.roughness = 0.5;
    stainedGlassMaterial.transparencyMode = PBRMaterial.PBRMATERIAL_ALPHATESTANDBLEND;
    plane.material = stainedGlassMaterial;
    const stainedGlassPlugin = stainedGlassMaterial.pluginManager?.getPlugin(StainedGlassMaterialPlugin.name);
    if (stainedGlassPlugin && stainedGlassPlugin instanceof StainedGlassMaterialPlugin) {
      stainedGlassPlugin.isEnabled = true;
    }
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
