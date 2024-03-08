/**
 * @jest-environment jsdom
 */
// __tests__/RenderEngine.test.ts
import { RenderEngine, bindInstancedVertexPrimitive, bindInstancedVertexAttributes, compileProgram } from '../src';
import {expect, jest, test, describe, beforeEach, afterEach} from '@jest/globals';
//RenderEngine
describe('RenderEngine', () => {
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    document.body.appendChild(canvas);
  });

  afterEach(() => {
    document.body.removeChild(canvas);
  });

  test('RenderEngine initialization', () => {
    const renderEngine = new RenderEngine({ canvas });

    expect(renderEngine).toBeDefined();
    expect(renderEngine.gl).toBeDefined();
    expect(renderEngine.program).toBeDefined();
    expect(renderEngine.vao).toBeDefined();

  });

  test('RenderEngine initialization with custom shaders', () => {
    const customVertexShader = `
      #version 300 es
      precision highp float;
      in vec2 a_position;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    const customFragmentShader = `
      #version 300 es
      precision highp float;
      out vec4 fragColor;
      void main() {
        fragColor = vec4(1.0, 0.0, 0.0, 1.0);
      }
    `;

    const renderEngine = new RenderEngine({ canvas, vertexSource: customVertexShader, fragmentSource: customFragmentShader });

    expect(renderEngine).toBeDefined();
    expect(renderEngine.gl).toBeDefined();
    expect(renderEngine.program).toBeDefined();
    expect(renderEngine.vao).toBeDefined();
    // Add more assertions as needed
  });

  
 
});


//Bind Instanced Vertex Primitive
describe('bindInstancedVertexPrimitive', () => {
    let gl: WebGL2RenderingContext;
    let program: WebGLProgram;
  
    beforeEach(() => {
      // Mock WebGL context and program
      gl = ({
        createBuffer: jest.fn(() => 'fakeBuffer'),
        getAttribLocation: jest.fn(() => 1),
        bindBuffer: jest.fn(),
        bufferData: jest.fn(),
        enableVertexAttribArray: jest.fn(),
        vertexAttribPointer: jest.fn(),
        vertexAttribDivisor: jest.fn(),
      } as unknown) as WebGL2RenderingContext;
  
      program = {} as WebGLProgram;
    });
  
    test('bindInstancedVertexPrimitive function', () => {
      const attributeName = 'a_position';
      const attributeSize = 2;
      const primitiveVertexArray = [1, 0, 0, 1, 1, 1, 0, 0, 1, 0, 0, 1];
  
      const result = bindInstancedVertexPrimitive({ gl, program, attributeName, attributeSize, primitiveVertexArray });
  
      expect(result.primitiveBuffer).toBe('fakeBuffer');
      expect(result.primitiveLoc).toBe(1);
  
      // Add more assertions as needed based on your specific implementation
      expect(gl.createBuffer).toHaveBeenCalledTimes(1);
      expect(gl.bindBuffer).toHaveBeenCalledWith(gl.ARRAY_BUFFER, 'fakeBuffer');
      expect(gl.bufferData).toHaveBeenCalledWith(gl.ARRAY_BUFFER, new Float32Array(primitiveVertexArray), gl.STATIC_DRAW);
      // Add more assertions for other WebGL functions called by bindInstancedVertexPrimitive
    });
  });

//Bind Instanced Vertex Attributes
describe('bindInstancedVertexAttributes', () => {
  let gl: WebGL2RenderingContext;
  let program: WebGLProgram;

  beforeEach(() => {
    // Mock WebGL context and program
    gl = ({
      createBuffer: jest.fn(() => 'fakeBuffer'),
      getAttribLocation: jest.fn((attributeName:string) => {
        // Mock different attribute locations based on the attribute name
        const attributeLocations: { [key: string]: number } = {
          'v_box': 2,
          'v_color': 3,
          'v_corner': 4,
          'v_window': 5,
          'v_sigma': 6,
        };
        return attributeLocations[attributeName] || -1;
      }),
      bindBuffer: jest.fn(),
      bufferData: jest.fn(),
      enableVertexAttribArray: jest.fn(),
      vertexAttribPointer: jest.fn(),
      vertexAttribDivisor: jest.fn(),
    } as unknown) as WebGL2RenderingContext;

    program = {} as WebGLProgram;
  });

  test('bindInstancedVertexAttributes function', () => {
    const attributeNameArray = ['v_box', 'v_color', 'v_corner', 'v_window', 'v_sigma'];
    const attributeFloatLengthArray = [4, 4, 4, 2, 1];
    const numInstances = 2;

    const result = bindInstancedVertexAttributes({ gl, program, attributeNameArray, attributeFloatLengthArray, numInstances });

    expect(result.attributeLocationArray).toEqual([2, 3, 4, 5, 6]);
    expect(result.attributeBufferArray).toEqual(['fakeBuffer', 'fakeBuffer', 'fakeBuffer', 'fakeBuffer', 'fakeBuffer']);
    expect(result.attributeFloatCount).toBe(15);

    // Verify the number of times certain functions were called
    expect(gl.createBuffer).toHaveBeenCalledTimes(attributeNameArray.length);
    expect(gl.bindBuffer).toHaveBeenCalledTimes(attributeNameArray.length * 2); // bindBuffer is called twice for each attribute
    expect(gl.bufferData).toHaveBeenCalledTimes(attributeNameArray.length);
    expect(gl.enableVertexAttribArray).toHaveBeenCalledTimes(attributeNameArray.length);
    expect(gl.vertexAttribPointer).toHaveBeenCalledTimes(attributeNameArray.length);
    expect(gl.vertexAttribDivisor).toHaveBeenCalledTimes(attributeNameArray.length);

  });
});

//Compile Program
describe('compileProgram', () => {
  let gl: WebGL2RenderingContext;

  beforeEach(() => {
    // Mock WebGL context
    gl = ({
      createShader: jest.fn(() => 'fakeShader'),
      shaderSource: jest.fn(),
      compileShader: jest.fn(),
      getShaderParameter: jest.fn(() => true),
      createProgram: jest.fn(() => 'fakeProgram'),
      attachShader: jest.fn(),
      linkProgram: jest.fn(),
      getProgramParameter: jest.fn(() => true),
    } as unknown) as WebGL2RenderingContext;
  });

  test('compileProgram function', () => {
    const vertexSource = 'fakeVertexShaderSource';
    const fragmentSource = 'fakeFragmentShaderSource';

    const result = compileProgram({gl: gl,vertexSource: vertexSource,fragmentSource: fragmentSource });
    expect(result).toBe('fakeProgram');

    // Verify the number of times certain functions were called
    expect(gl.createShader).toHaveBeenCalledTimes(2); // One for vertex shader, one for fragment shader
    expect(gl.shaderSource).toHaveBeenCalledTimes(2);
    expect(gl.compileShader).toHaveBeenCalledTimes(2);
    expect(gl.getShaderParameter).toHaveBeenCalledTimes(2);
    expect(gl.createProgram).toHaveBeenCalledTimes(1);
    expect(gl.attachShader).toHaveBeenCalledTimes(2);
    expect(gl.linkProgram).toHaveBeenCalledTimes(1);
    expect(gl.getProgramParameter).toHaveBeenCalledTimes(1);

  });

  test('RenderEngine initialization with invalid shaders', async () => {
    const invalidVertexShader = `#version 330 cor
    in struct InData {
        vec2 position;
        vec4 color;
    
    inData;
      out vec4 color;
      void main(){
        color = inData.color;
    }`;
    const invalidFragmentShader = `
    #version 330 core
      layout(location = 0) in struct InData {
          vec3 position;
          vec4 color;
    `;
    await expect(() => {
      compileProgram({gl: gl, vertexSource: invalidVertexShader, fragmentSource: invalidFragmentShader})
    }).toThrowError()
  });
});

