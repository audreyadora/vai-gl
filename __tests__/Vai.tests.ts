/**
 * @jest-environment jsdom
 */
import { Vai, RenderEngine } from '../src';
import {expect, jest, test, describe, beforeEach, afterEach} from '@jest/globals';
jest.mock('../src/', () => {
  return {
    RenderEngine: jest.fn().mockImplementation(() => ({
      resizeHandler: jest.fn(),
      render: jest.fn(),
    })),
  };
});

describe('Vai', () => {
  let canvas: HTMLCanvasElement;
  let renderEngineInstance: RenderEngine;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    document.body.appendChild(canvas);

    // Reset the mock implementation for RenderEngine before each test
    renderEngineInstance = new RenderEngine({ canvas });
    (RenderEngine as jest.Mock).mockClear();
    (RenderEngine as jest.Mock).mockImplementation(() => renderEngineInstance);
  });

  afterEach(() => {
    document.body.removeChild(canvas);
  });

  test('Vai initialization', () => {
    const vai = new Vai({ canvas, canvas_id: 'fakeId' });

    expect(vai).toBeDefined();
    expect(vai.canvas).toBe(canvas);
    expect(vai.id).toBe('fakeId');
    expect(vai.Render).toBe(renderEngineInstance);
    expect(RenderEngine).toHaveBeenCalledWith({ canvas });

  });

  test('Vai resizing', () => {
    const vai = new Vai({ canvas, canvas_id: 'fakeId' });

    // Simulate resize event
    canvas.dispatchEvent(new Event('resize'));

    // Verify that _onResize method is called
    expect(vai['_onResize']).toHaveBeenCalled();
    // Verify that RenderEngine.resizeHandler is called with the updated width and height
    expect(renderEngineInstance.resizeHandler).toHaveBeenCalledWith(vai.width, vai.height);

  });

  test('Vai rendering', () => {
    const vai = new Vai({ canvas, canvas_id: 'fakeId' });

    // Simulate RAF loop
    const callback = jest.fn();
    requestAnimationFrame(callback);

    // Ensure that RAF callback is invoked
    expect(callback).toHaveBeenCalled();

    // Verify that RenderEngine.render is called with the provided parameters
    const attributeArrayF32List = [new Float32Array([
        // layer 1:
        0,0,100,100, //xa,ya,xb,yb
        0.867,0.867,0.867,1.0, // r,g,a,b
        1,1,1,1, // corner radius: xa,ya,xb,yb
        1000,1000, // canvas width, height 
    ]), new Float32Array([
        //layer 2:
        50,50,150,150, //xa,ya,xb,yb
        0.938,0.938,0.938, 1.0, // r,g,a,b
        1,1,1,1, // corner radius: xa,ya,xb,yb
        1000,1000, // canvas width, height 
    ])];
    const numInstances = 2;
    vai.render(attributeArrayF32List, numInstances);
    expect(renderEngineInstance.render).toHaveBeenCalledWith({
      attributeArrayF32List,
      numInstances,
    });

  });
});
