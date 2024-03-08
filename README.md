# vai-gl

## Overview

Vai-gl RenderEngine is a WebGL2 TypeScript rendering engine component that leverages vertex attribute instancing. This engine is designed for efficiently rendering instances of vertex primitives with custom attributes while minimizing boilerplate and GL state management. See an example usage here: [audreyadora/harmony](https://github.com/audreyadora/harmony)

## Install
```typescript 
pnmp install vai-gl
```

## Features

- **Shader Support:** The engine supports custom vertex and fragment shaders. The default shaders, `PianoRollShaderVertex` and `PianoRollShaderFragment`, can be easily replaced with your own.

- **Instanced Rendering:** Efficiently renders multiple instances of vertex primitives with customizable attributes. The engine provides functions to bind instanced vertex primitives and attributes.

- **Dynamic Attribute Handling:** The engine allows dynamic handling of attributes, supporting different attribute names, sizes, and lengths. 

- **Program Compilation:** The `compileProgram` function simplifies the process of compiling and linking vertex and fragment shaders into a WebGL program.

- **Canvas Resize Handling:** The engine includes a `resizeHandler` method to handle canvas resizing, considering device pixel ratio for optimal display.

## Usage

### Initialization

```typescript
import { RenderEngine } from './RenderEngine';

const canvas = document.getElementById('yourCanvas') as HTMLCanvasElement;
const renderEngine = new RenderEngine({ canvas });
```
### Rendering

```typescript 
const numInstances = 10;
const attributeArrayF32List = [...]; // List of Float32Arrays for each instance

renderEngine.render({ attributeArrayF32List, numInstances });
```

The RenderEngine class contains a contextLost flag that can be validated in the render loop to reinitialize the Render component when needed. 

### Customization

Replace default shaders by providing your own vertex and fragment shader sources during initialization:

```typescript 
const customVertexSource = `
    // Your custom vertex shader code here
`;

const customFragmentSource = `
    // Your custom fragment shader code here
`;

const customRenderEngine = new RenderEngine({
    canvas,
    vertexSource: customVertexSource,
    fragmentSource: customFragmentSource,
});
```

### Examples

This is a general example component class implementation which handles contextLost and canvas resize events. You can also import and extend this wrapper class from 'Vai'.

```typescript 
import { RenderEngine } from '../RenderEngine/RenderEngine';

export class MyComponent {
    canvas = null as null | HTMLCanvasElement;
    Render = null as null |  RenderEngine;
    width = 1000;
    height = 1000;
    id = '';
 
    recalc_render_flag = true;

    constructor(data: {canvas: HTMLCanvasElement, canvas_id: string}) {
        this.canvas = data.canvas;
        this.id = data.canvas_id;

        this.Render = new RenderEngine({canvas: this.canvas});

        this._resizeObserver.observe(this.canvas, {box: "device-pixel-content-box"})
        this._onResize()
    }

    _resizeObserver = new ResizeObserver((entries:ResizeObserverEntry[]) => {
        for (const entry of entries) {
            if (entry?.target?.id === this.id) {
                this.height = entry.devicePixelContentBoxSize[0].blockSize;
                this.width = entry.devicePixelContentBoxSize[0].inlineSize;
                this._onResize();
                break;
            };
        };
    });

    _renderCtxInit() {
        if (this.canvas) {
            this.Render = new RenderEngine({canvas: this.canvas});
        }
    }

    _onResize() {

        if (!this.Render) { this._renderCtxInit() } else {
            this.Render.resizeHandler(this.width, this.height)
        }

        this.recalc_render_flag = true;
        
    }

    render() {
        
        if (!this?.Render) { this._renderCtxInit() } else if (this?.Render?.contextLost) { this._renderCtxInit() } else {

            this.Render.render({
                attributeArrayF32List: [], 
                numInstances: 0 
            })
          
        };
    }
}
```
### Contributing 
Feel free to fork and modify for your own usecases/implementations.

### License
This code is licensed under the MIT License - see the LICENSE file for details.
