import type {MaterialDefines} from '@babylonjs/core/Materials/materialDefines';
import {MaterialPluginBase} from '@babylonjs/core/Materials/materialPluginBase';
import {PBRMaterial} from '@babylonjs/core/Materials/PBR/pbrMaterial';
import type {UniformBuffer} from '@babylonjs/core/Materials/uniformBuffer';
import {Color3} from '@babylonjs/core/Maths/math.color';
import type {AbstractMesh} from '@babylonjs/core/Meshes/abstractMesh';
import {serialize} from '@babylonjs/core/Misc/decorators';
import type {Scene} from '@babylonjs/core/scene';

export class StainedGlassMaterialPlugin extends MaterialPluginBase {
  private _isEnabled = false;
  public tiling = 8;
  public baseAlpha = 0.75;
  public borderWidth = 0.05;
  private readonly borderColor: Color3;
  private readonly glassColors: Color3[];

  constructor(material: PBRMaterial, borderColor: Color3, glassColors: Color3[]) {
    super(
      material,
      StainedGlassMaterialPlugin.name,
      200,
      {
        STAINED_GLASS: false,
      },
    );
    this.borderColor = borderColor;
    this.glassColors = [...glassColors];

    const addProperty = serialize();
    for (const property of [
      'isEnabled',
      'tiling',
      'baseAlpha',
      'borderWidth',
      'borderColor',
      'glassColors',
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
        {name: 'uTiling', size: 1, type: 'float'},
        {name: 'uBaseAlpha', size: 1, type: 'float'},
        {name: 'uBorderWidth', size: 1, type: 'float'},
        {name: 'uBorderColor', size: 3, type: 'vec3'},
        {name: 'uNumberOfGlassColors', size: 1, type: 'highp int'},
        {name: 'uGlassColors', size: 3, type: 'vec3', arraySize: this.glassColors.length},
      ],
      fragment: `
#ifdef STAINED_GLASS
float uTiling;
float uBaseAlpha;
float uBorderWidth;
vec3 uBorderColor;
uniform int uNumberOfGlassColors;
uniform vec3 uGlassColors[${this.glassColors.length}];
#endif`,
    };
  }

  bindForSubMesh(uniformBuffer: UniformBuffer): void {
    if (!this._isEnabled) { return; }
    uniformBuffer.updateFloat('uTiling', this.tiling);
    uniformBuffer.updateFloat('uBaseAlpha', this.baseAlpha);
    uniformBuffer.updateFloat('uBorderWidth', this.borderWidth);
    uniformBuffer.updateColor3('uBorderColor', this.borderColor);
    const colorsArray = new Float32Array(this.glassColors.length * 3);
    for (let i = 0; i < this.glassColors.length; i++) {
      const color = this.glassColors[i];
      colorsArray.set([color.r, color.g, color.b], i * 3);
    }
    uniformBuffer.updateInt('uNumberOfGlassColors', this.glassColors.length);
    uniformBuffer.updateFloatArray('uGlassColors', colorsArray);
  }

  // TODO : use noise to created frosted glass appearance
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

int hash(ivec2 id) {
  int h = id.x * 374761393 + id.y * 668265263;
  h = (h ^ (h >> 13)) * 1274126177;
  return abs(h);
}

vec2 random2(vec2 p) {
  return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453);
}

vec3 voronoi(vec2 position) {
  vec2 baseCell = floor(position);
  vec2 localPosition = fract(position);

  vec2 closestNeighbor;
  vec2 toClosestNeighbor;

  float minSqrDistance = uTiling;

  // Find the closest cell and point in cell
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      // Neighbor place in the grid
      vec2 neighbor = vec2(x, y);
      // Random position from current + neighbor place in the grid
      vec2 point = random2(baseCell + neighbor);
      // Vector between the pixel and the point
      vec2 toNeighbor = neighbor + point - localPosition;
      float sqrDistance = dot(toNeighbor, toNeighbor);
      if (sqrDistance < minSqrDistance) {
        minSqrDistance = sqrDistance;
        toClosestNeighbor = toNeighbor;
        closestNeighbor = neighbor;
      }
    }
  }

  float minBorderDistance = uTiling;
  // Search around the cell that contained the closest point to find distance to border
  for (int y = -2; y <= 2; y++) {
    for (int x = -2; x <= 2; x++) {
      vec2 closestNeighborOffset = closestNeighbor + vec2(x, y);
      vec2 point = random2(baseCell + closestNeighborOffset);
      vec2 toOtherNeighbor = closestNeighborOffset + point - localPosition;
      vec2 direction = normalize(toOtherNeighbor - toClosestNeighbor);
      vec2 midpoint = 0.5 * (toOtherNeighbor + toClosestNeighbor);
      float borderDistance = dot(midpoint, direction);
      minBorderDistance = min(minBorderDistance, borderDistance);
    }
  }
  vec2 winningCell = baseCell + closestNeighbor;
  return vec3(minBorderDistance, winningCell);
}
#endif
`,
          CUSTOM_FRAGMENT_UPDATE_ALPHA: `
#ifdef STAINED_GLASS
vec2 uv = vUV * vec2(uTiling);
vec3 v = voronoi(uv);
float borderMask = smoothstep(uBorderWidth, 0., v.x);
alpha = uBaseAlpha + borderMask;
#endif
`,
          CUSTOM_FRAGMENT_BEFORE_LIGHTS: `
#ifdef STAINED_GLASS
int index = hash(ivec2(v.yz)) % uNumberOfGlassColors;
vec3 cellColor = uGlassColors[index];
surfaceAlbedo = mix(cellColor, uBorderColor, borderMask);
#endif
`,
        };
      default:
        return null;
    }
  }
}
