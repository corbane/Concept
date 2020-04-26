// <reference path="../../typings.d.ts" />
//import * as fabric from "fabric/fabric-impl.js"
import { Geometry } from "../Geometry/geometry.js";
export class Shape {
    constructor(data) {
        this.group = undefined;
        //console.log ( "Updata here Shape.data " + data.data )
        this.background = undefined;
        this.border = undefined;
        this.config = Object.assign(Object.assign({}, this.defaultConfig()), data);
        //      this.init ()
        // }
        // init ()
        // {
        const { config } = this;
        const group = this.group = new fabric.Group([], {
            width: this.displaySize(),
            height: this.displaySize(),
            left: config.x,
            top: config.y,
            hasBorders: true,
            hasControls: true,
            originX: "center",
            originY: "center",
        });
        this.background = new Geometry(this);
        //group.add ( this.background.object )
        //this.background.object.sendToBack ()
        // ;(this.border as Geometry) = new Geometry ( this, this.config )
        // group.add ( this.border.object )
        group.setCoords();
    }
    defaultConfig() {
        return {
            context: "concept-aspect",
            type: "shape",
            id: undefined,
            data: undefined,
            x: 0,
            y: 0,
            //size      : 20,
            minSize: 1,
            sizeFactor: 1,
            sizeOffset: 0,
            shape: "circle",
            borderColor: "gray",
            borderWidth: 5,
            backgroundColor: "transparent",
            backgroundImage: undefined,
            backgroundRepeat: false,
            onCreate: undefined,
            onDelete: undefined,
            onTouch: undefined,
        };
    }
    displaySize() {
        const config = this.config;
        var size = (1 + config.sizeOffset) * config.sizeFactor;
        if (size < config.minSize)
            size = config.minSize;
        return size || 1;
    }
    updateSize() {
        const { group, config } = this;
        if (this.background)
            this.background.updateSize();
        if (this.border)
            this.border.updateSize();
        group.set({
            width: this.displaySize(),
            height: this.displaySize(),
        });
        if (group.canvas)
            group.canvas.requestRenderAll();
    }
    coords() {
        return this.group.getCoords();
    }
    setBackground(options) {
        Object.assign(this.config, options);
        this.background.update(options);
        this.updateSize();
    }
    setPosition(x, y) {
        const { group, config } = this;
        config.x = x;
        config.y = y;
        group.set({
            left: x,
            top: y
        })
            .setCoords();
        if (group.canvas)
            group.canvas.requestRenderAll();
    }
    hover(up) {
        const target = this.background != undefined
            ? this.background.object
            : this.group;
        target.setShadow('rgba(0,0,0,0.3)');
        fabric.util.animate({
            startValue: up ? 0 : 1,
            endValue: up ? 1 : 0,
            easing: fabric.util.ease.easeOutCubic,
            byValue: undefined,
            duration: 100,
            onChange: (value) => {
                const offset = 1 * value;
                target.setShadow(`${offset}px ${offset}px ${10 * value}px rgba(0,0,0,0.3)`);
                target.scale(1 + 0.1 * value);
                target.canvas.requestRenderAll();
            },
        });
    }
    toJson() {
        return JSON.stringify(this.config);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2hhcGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9BcHBsaWNhdGlvbi9Bc3BlY3QvRWxlbWVudC9zaGFwZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwwQ0FBMEM7QUFDMUMsaURBQWlEO0FBRWpELE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSx5QkFBeUIsQ0FBQTtBQTBCbEQsTUFBTSxPQUFPLEtBQUs7SUFxQ2IsWUFBYyxJQUFPO1FBTHJCLFVBQUssR0FBRyxTQUF5QixDQUFBO1FBTzVCLHVEQUF1RDtRQUN2RCxJQUFJLENBQUMsVUFBVSxHQUFHLFNBQVMsQ0FBQTtRQUMzQixJQUFJLENBQUMsTUFBTSxHQUFHLFNBQVMsQ0FBQTtRQUN2QixJQUFJLENBQUMsTUFBTSxtQ0FDRixJQUFJLENBQUMsYUFBYSxFQUFHLEdBQ3JCLElBQUksQ0FDWixDQUFBO1FBRU4sb0JBQW9CO1FBQ3BCLElBQUk7UUFFSixVQUFVO1FBQ1YsSUFBSTtRQUNDLE1BQU0sRUFBRSxNQUFNLEVBQUUsR0FBRyxJQUFJLENBQUE7UUFFdkIsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLE1BQU0sQ0FBQyxLQUFLLENBQUcsRUFBRSxFQUNoRDtZQUNLLEtBQUssRUFBUSxJQUFJLENBQUMsV0FBVyxFQUFHO1lBQ2hDLE1BQU0sRUFBTyxJQUFJLENBQUMsV0FBVyxFQUFHO1lBQ2hDLElBQUksRUFBUyxNQUFNLENBQUMsQ0FBQztZQUNyQixHQUFHLEVBQVUsTUFBTSxDQUFDLENBQUM7WUFDckIsVUFBVSxFQUFHLElBQUk7WUFDakIsV0FBVyxFQUFFLElBQUk7WUFDakIsT0FBTyxFQUFNLFFBQVE7WUFDckIsT0FBTyxFQUFNLFFBQVE7U0FDekIsQ0FBQyxDQUVEO1FBQUMsSUFBSSxDQUFDLFVBQXVCLEdBQUcsSUFBSSxRQUFRLENBQUcsSUFBSSxDQUFFLENBQUE7UUFDdEQsc0NBQXNDO1FBQ3RDLHNDQUFzQztRQUV0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