import {querySelectorNotNull} from '../dom/query-selectors';
import {SceneController} from './scene-controller';

export class Application {
  private _sceneController: SceneController | null = null;

  get sceneController(): SceneController {
    if (this._sceneController === null) { throw new Error('Scene controller not assigned'); }
    return this._sceneController;
  }

  prepare(): void {
    const canvasContainer = querySelectorNotNull<HTMLElement>(document, '.canvas-container');
    const canvas = querySelectorNotNull<HTMLCanvasElement>(canvasContainer, '.canvas');
    this._sceneController = new SceneController(this, canvas);
    this._sceneController.prepare();
  }

  dispose(): void {
    this._sceneController?.dispose();
  }
}
