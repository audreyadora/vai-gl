import { RenderEngine } from './RenderEngine';
/**
 * Vai.ts
 * Component wrapper for Render Engine
 */
export class Vai {
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

    render(attributeArrayF32List: Float32Array[], numInstances: number) {
        if (!this?.Render) {
             this._renderCtxInit() 
        } else if (this?.Render?.contextLost) {
             this._renderCtxInit() 
        } else {
            this.Render.render({
                attributeArrayF32List: attributeArrayF32List, 
                numInstances: numInstances
            })
        };
    }
}