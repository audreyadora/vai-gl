import {RectangleShaderFragment, RectangleShaderVertex} from './Shaders'

/**
 * RenderEngine.ts
 * WebGL2 Render Engine with Vertex Attribute Instancing
 */

//shader defaults
const quad = [1, 0, 0, 1, 1, 1, 0, 0, 1, 0, 0, 1]
const attributeNameArray = ['v_box','v_color','v_corner','v_window','v_sigma'];
const attributeFloatLengthArray = [4,4,4,2,1];
const vertexAttributeName = 'a_position'
const vertexAttributeLength = 2

export function bindInstancedVertexPrimitive(data: {
    gl: WebGL2RenderingContext;
    program: WebGLProgram;
    attributeName: string;
    attributeSize: number;
    primitiveVertexArray: number[];
}) {

    const primitiveBuffer = data.gl.createBuffer();
    const primitiveLoc = data.gl.getAttribLocation(data.program, data.attributeName);

    data.gl.bindBuffer(data.gl.ARRAY_BUFFER, primitiveBuffer);
    data.gl.bufferData(data.gl.ARRAY_BUFFER, new Float32Array(data.primitiveVertexArray), data.gl.STATIC_DRAW);

    data.gl.enableVertexAttribArray(primitiveLoc);
    data.gl.vertexAttribPointer(primitiveLoc, data.attributeSize, data.gl.FLOAT, false, 0, 0);

    return {
        primitiveBuffer: primitiveBuffer,
        primitiveLoc: primitiveLoc,
    }

}

export function bindInstancedVertexAttributes(data: {
    gl: WebGL2RenderingContext;
    program: WebGLProgram;
    attributeNameArray: string[];
    attributeFloatLengthArray: number[];
    numInstances: number;
}) {

    const attributeLocationArray: number[] = [];
    const attributeBufferArray: (WebGLBuffer | null)[] = [];

    const attributeFloatCount = data.attributeFloatLengthArray.reduce((a, b) => a + b, 0);
    const bytesPerAttributeInstance = 4 * attributeFloatCount;

    let byteOffset = 0;
    for (let i = 0; i < data.attributeNameArray.length; ++i) {
        const attributeBuffer = data.gl.createBuffer();
        const attributeLoc = data.gl.getAttribLocation(data.program, data.attributeNameArray[i])

        data.gl.bindBuffer(data.gl.ARRAY_BUFFER, attributeBuffer);
        data.gl.bufferData(data.gl.ARRAY_BUFFER, data.numInstances * bytesPerAttributeInstance, data.gl.DYNAMIC_DRAW);

        data.gl.enableVertexAttribArray(attributeLoc);
        data.gl.vertexAttribPointer(attributeLoc, data.attributeFloatLengthArray[i], data.gl.FLOAT, false, bytesPerAttributeInstance, byteOffset);

        data.gl.vertexAttribDivisor(attributeLoc, 1);

        attributeLocationArray.push(attributeLoc)
        attributeBufferArray.push(attributeBuffer)
        byteOffset += data.attributeFloatLengthArray[i] * 4;
    }

    return {
        attributeLocationArray: attributeLocationArray,
        attributeBufferArray: attributeBufferArray,
        attributeFloatCount: attributeFloatCount
    }

}

export function compileProgram(data: {
    gl: WebGL2RenderingContext;
    vertexSource: string;
    fragmentSource: string;
}) {

    function compileShader(type: number, source: string) {
        const shader = data.gl.createShader(type);
        if (shader) {
            data.gl.shaderSource(shader, source);
            data.gl.compileShader(shader);
            if (!data.gl.getShaderParameter(shader, data.gl.COMPILE_STATUS)) {
                throw new Error(data.gl.getShaderInfoLog(shader) as string);
            }
            data.gl.attachShader(program, shader);
        }
    }

    const program = data.gl.createProgram() as WebGLProgram;
    compileShader(data.gl.VERTEX_SHADER, data.vertexSource);
    compileShader(data.gl.FRAGMENT_SHADER, data.fragmentSource);
    data.gl.linkProgram(program);

    if (!data.gl.getProgramParameter(program, data.gl.LINK_STATUS)) {
        throw new Error(data.gl.getProgramInfoLog(program) as string);
    }

    return program;
}

export class RenderEngine {
    gl: WebGL2RenderingContext | null;
    program = null as WebGLProgram | null;
    canvas = null as null | HTMLCanvasElement;

    vertexSource = RectangleShaderVertex
    fragmentSource = RectangleShaderFragment

    vertexAttributeName: string;
    vertexAttributeLength: number;

    attributeNameArray: string[];
    attributeFloatLengthArray: number[];

    width = 100;
    height = 100;
    numInstances = 0;
    backgroundColor = [0.8118, 0.7843, 0.7843, 0.0]
    multiplier=1;
    vao = null as WebGLVertexArrayObject | null;

    vertex = {
        primitiveBuffer: null as WebGLBuffer | null,
        primitiveLoc: 0
    };

    vertexAttributes = {
        attributeLocationArray: [] as number[],
        attributeBufferArray: [null] as (WebGLBuffer | null)[],
        attributeFloatCount: 0
    };

    attributeArrayF32 = new Float32Array(0);
    attributeArrayF32BufferLength = 0;

    contextLost = false;
    #initialized = false;
    
    constructor(data:{
        canvas: HTMLCanvasElement; 
        backgroundColor?: number[];  //rgba
        fragmentSource?: string;
        vertexSource?: string;

        vertexAttributeName?: string; // override defaults
        vertexAttributeLength?: number; // override defaults
        attributeNameArray?: string[]; // override defaults 
        attributeFloatLengthArray?: number[]; //override defaults

    }) {

        this.canvas = data.canvas;
        this.gl = data.canvas.getContext('webgl2', { alpha: false, depth: false, stencil: false });
        this.backgroundColor = data?.backgroundColor || this.backgroundColor;
        this.vertexSource = data?.vertexSource || this.vertexSource; 
        this.fragmentSource = data?.fragmentSource || this.fragmentSource;

        this.vertexAttributeName = data?.vertexAttributeName || vertexAttributeName; 
        this.vertexAttributeLength = data?.vertexAttributeLength || vertexAttributeLength;
        this.attributeNameArray = data?.attributeNameArray || attributeNameArray; 
        this.attributeFloatLengthArray = data?.attributeFloatLengthArray || attributeFloatLengthArray;

        if (this.gl) {

            this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
            this.gl.enable(this.gl.BLEND);
            this.gl.clearColor(this.backgroundColor[0],this.backgroundColor[1],this.backgroundColor[2],this.backgroundColor[3])

            this.program = compileProgram({
                gl: this.gl, 
                vertexSource: this.vertexSource, 
                fragmentSource: this.fragmentSource
            })

            this.vao = this.gl.createVertexArray();
            this.gl.bindVertexArray(this.vao);

            this.vertex = bindInstancedVertexPrimitive({
                gl: this.gl,
                program: this.program,
                attributeName: 'a_position',
                attributeSize: 2,
                primitiveVertexArray: quad
            })

            this.vertexAttributes = bindInstancedVertexAttributes({
                gl: this.gl,
                program: this.program,
                attributeNameArray: attributeNameArray,
                attributeFloatLengthArray: attributeFloatLengthArray,
                numInstances: this.numInstances
            })

            this.gl.useProgram(this.program);
            this.#initialized = true;
        }

    }

    set background_color(backgroundColor: number[]) {
        this.backgroundColor = backgroundColor;
        this?.gl?.clearColor(backgroundColor[0],backgroundColor[1],backgroundColor[2],backgroundColor[3]);
    }

    _rebindAttributes(data: {
        numInstances: number
    }) {
        if (this.gl && this.program && this.#initialized && !this.contextLost) {

            this.attributeArrayF32BufferLength = data.numInstances * this.vertexAttributes.attributeFloatCount;
            this.attributeArrayF32 = new Float32Array(this.attributeArrayF32BufferLength);
            this.numInstances = data.numInstances;

            this.vertexAttributes = bindInstancedVertexAttributes({
                gl: this.gl,
                program: this.program,
                attributeNameArray: attributeNameArray,
                attributeFloatLengthArray: attributeFloatLengthArray,
                numInstances: this.numInstances
            })
        }
    }

    resizeHandler(width?: number, height?: number) {
        if (this.canvas) {
            this.multiplier = window?.devicePixelRatio || 1;
            this.multiplier = Math.max(0, this.multiplier);
            this.width  = (width ? width : this.canvas.clientWidth)  * this.multiplier | 0;
            this.height = (height ? height : this.canvas.clientHeight) * this.multiplier | 0;
            if (this.canvas.width !== this.width || this.canvas.height !== this.height) {
                this.canvas.width = this.width;
                this.canvas.height = this.height;
            }
        }
    }

    render(data: {
        attributeArrayF32List: Float32Array[];
        numInstances: number;
    }) {
        if (this.gl && this.#initialized) {
            if (this.contextLost) {
                console.log('gl context lost')
                return;
            }

            if (this.numInstances !== data.numInstances) {
                this._rebindAttributes({numInstances: data.numInstances})
            }

            let bufferOffset = 0;
            for (const F32Arr of data.attributeArrayF32List) {
                
                const currentOffset = F32Arr.byteLength/4

                if (bufferOffset + currentOffset <= this.attributeArrayF32BufferLength) {
                    this.attributeArrayF32.set(F32Arr,bufferOffset);
                    bufferOffset += currentOffset;
                } else {
                    console.log('buffer overflow: attributeArrayF32List is longer than expected floats per numInstances')
                    return;
                }
            }

            this.gl.viewport(0, 0, this.width, this.height);
            this.gl.clear(this.gl.COLOR_BUFFER_BIT);
            this.gl.bindVertexArray(this.vao);

                
            for (let i = 0; i < this.vertexAttributes.attributeBufferArray.length; ++i) {
                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexAttributes.attributeBufferArray[i]);
                this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, this.attributeArrayF32);
            }
                
            this.gl.drawArraysInstanced(this.gl.TRIANGLES, 0, 6, this.numInstances);
        } else {
            this.contextLost = true;
        }
    }
}










         

            

            

            

                