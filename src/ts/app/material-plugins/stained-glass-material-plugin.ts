import {MaterialDefines, AbstractMesh, UniformBuffer} from '@babylonjs/core';
import {MaterialPluginBase} from '@babylonjs/core/Materials/materialPluginBase';
import {PBRMaterial} from '@babylonjs/core/Materials/PBR/pbrMaterial';
import {serialize} from '@babylonjs/core/Misc/decorators';
import type {Scene} from '@babylonjs/core/scene';

export class StainedGlassMaterialPlugin extends MaterialPluginBase {
  private _isEnabled = false;

  constructor(material: PBRMaterial) {
    super(
      material,
      StainedGlassMaterialPlugin.name,
      200,
      {
        STAINED_GLASS: false,
      },
    );

    const addProperty = serialize();
    for (const property of [
      'isEnabled',
    ]) {
      addProperty(this, property);
    }
  }

  get isEnabled(): boolean { return this._isEnabled; }
  set isEnabled(value) {
    if (this._isEnabled === value) { return; }
    this._isEnabled = value;
    this.markAllDefinesAsDirty();
    this._enable(value);
  }

  prepareDefines(defines: MaterialDefines, _scene: Scene, _mesh: AbstractMesh): void {
    defines.STAINED_GLASS = this._isEnabled;
    defines.UV1 = true;
  }

  getClassName(): string {
    return StainedGlassMaterialPlugin.name;
  }

  getUniforms(): ReturnType<MaterialPluginBase['getUniforms']> {
    return {
      ubo: [
      ],
      fragment: `
#ifdef STAINED_GLASS
#endif`,
    };
  }

  bindForSubMesh(uniformBuffer: UniformBuffer): void {
    if (!this._isEnabled) { return; }
    // TODO : update uniforms here
  }

  // TODO : clean comments
  getCustomCode(shaderType: string | null): ReturnType<MaterialPluginBase['getCustomCode']> {
    switch (shaderType) {
      case 'vertex':
        return {
          CUSTOM_VERTEX_DEFINITIONS: `
#ifdef STAINED_GLASS
varying vec2 vUV;
#endif
`,
          CUSTOM_VERTEX_MAIN_END: `
#ifdef STAINED_GLASS
vUV = uv;
#endif
`,
        };
      case 'fragment':
        return {
          CUSTOM_FRAGMENT_DEFINITIONS: `
#ifdef STAINED_GLASS
varying vec2 vUV;

vec2 random2(vec2 p) {
  return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453);
}
#endif
          `,
          CUSTOM_FRAGMENT_BEFORE_LIGHTS: `
#ifdef STAINED_GLASS
vec3 color = vec3(0.);

// Scale
vec2 uv = vUV * vec2(3.);

// Tile the space
vec2 iUV = floor(uv);
vec2 fUV = fract(uv);

float minDistance = 1.;

for (int y = -1; y <= 1; y++) {
  for (int x = -1; x <= 1; x++) {
    // Neighbor place in the grid
    vec2 neighbor = vec2(float(x), float(y));
    // Random position from current + neighbor place in the grid
    vec2 point = random2(iUV + neighbor);
    // Vector between the pixel and the point
    vec2 diff = neighbor + point - fUV;
    float distance = length(diff);
    minDistance = min(minDistance, distance);
  }
}
color += minDistance;
surfaceAlbedo = color;
#endif
`,
        };
      default:
        return null;
    }
  }
}
