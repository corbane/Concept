//import * as fabric from "fabric/fabric-impl.js"
import { Factory } from "./factory.js";
export class Geometry {
    constructor(owner) {
        this.owner = owner;
        this.config = owner.config;
        this.updateShape();
    }
    update(options) {
        Object.assign(this.config, options);
        if ("shape" in options) {
            this.updateShape();
        }
        else if ("backgroundImage" in options || "backgroundRepeat" in options) {
            this.updateBackgroundImage();
        }
    }
    updatePosition() {
        const { config, object } = this;
        object.set({
            left: config.x,
            top: config.y,
        })
            .setCoords();
    }
    updateSize() {
        const { owner, config, object } = this;
        const size = owner.displaySize();
        if (config.shape == "circle") {
            object.set({
                radius: size / 2
            });
        }
        else {
            object.set({
                width: size,
                height: size,
            });
        }
        object.setCoords();
    }
    updateShape(shape) {
        const { config, owner } = this;
        if (arguments.length == 0)
            shape = config.shape;
        else
            config.shape = shape;
        if (owner.group != undefined && this.object != undefined)
            owner.group.remove(this.object);
        const obj = this.object
            = Factory[config.shape](config, owner.displaySize(), {
                left: 0,
                top: 0,
                originX: "center",
                originY: "center",
                fill: config.backgroundColor,
                stroke: config.borderColor,
                strokeWidth: config.borderWidth,
            });
        owner.group.add(obj);
        obj.sendToBack();
        if (config.backgroundImage != undefined)
            this.updateBackgroundImage();
        if (obj.canvas != undefined)
            obj.canvas.requestRenderAll();
    }
    updateBackgroundImage(path) {
        if (arguments.length == 0)
            path = this.config.backgroundImage;
        else
            this.config.backgroundImage = path;
        if (typeof path == "string" && path.length > 0)
            fabric.util.loadImage(path, this.on_pattern.bind(this));
    }
    on_pattern(dimg) {
        const { owner } = this;
        const factor = dimg.width < dimg.height
            ? owner.displaySize() / dimg.width
            : owner.displaySize() / dimg.height;
        this.object.set({
            fill: new fabric.Pattern({
                source: dimg,
                repeat: "no-repeat",
                patternTransform: [
                    factor, 0, 0,
                    factor, 0, 0,
                ]
            })
        })
            .setCoords();
        if (this.object.canvas)
            this.object.canvas.renderAll();
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VvbWV0cnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9BcHBsaWNhdGlvbi9Bc3BlY3QvR2VvbWV0cnkvZ2VvbWV0cnkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0EsaURBQWlEO0FBR2pELE9BQU8sRUFBRSxPQUFPLEVBQUUsTUFBTSxjQUFjLENBQUE7QUFrQnRDLE1BQU0sT0FBTyxRQUFRO0lBS2hCLFlBQXVCLEtBQVk7UUFBWixVQUFLLEdBQUwsS0FBSyxDQUFPO1FBRTlCLElBQUksQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQTtRQUMxQixJQUFJLENBQUMsV0FBVyxFQUFHLENBQUE7SUFDeEIsQ0FBQztJQUVELE1BQU0sQ0FBRyxPQUE0QjtRQUVoQyxNQUFNLENBQUMsTUFBTSxDQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsT0FBTyxDQUFFLENBQUE7UUFFdEMsSUFBSyxPQUFPLElBQUksT0FBTyxFQUN2QjtZQUNLLElBQUksQ0FBQyxXQUFXLEVBQUcsQ0FBQTtTQUN2QjthQUNJLElBQUssaUJBQWlCLElBQUksT0FBTyxJQUFJLGtCQUFrQixJQUFJLE9BQU8sRUFDdkU7WUFDSyxJQUFJLENBQUMscUJBQXFCLEVBQUcsQ0FBQTtTQUNqQztJQUNOLENBQUM7SUFFRCxjQUFjO1FBRVQsTUFBTSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsR0FBRyxJQUFJLENBRTlCO1FBQUMsTUFBd0IsQ0FBQyxHQUFHLENBQUU7WUFDM0IsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQ2QsR0FBRyxFQUFHLE1BQU0sQ0FBQyxDQUFDO1NBQ2xCLENBQUM7YUFDRCxTQUFTLEVBQUcsQ0FBQTtJQUNsQixDQUFDO0lBRUQsVUFBVTtRQUVMLE1BQU0sRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxHQUFHLElBQUksQ0FBQTtRQUV0QyxNQUFNLElBQUksR0FBRyxLQUFLLENBQUMsV0FBVyxFQUFHLENBQUE7UUFFakMsSUFBSyxNQUFNLENBQUMsS0FBSyxJQUFJLFFBQVEsRUFDN0I7WUFDTSxNQUF3QixDQUFDLEdBQUcsQ0FBRTtnQkFDMUIsTUFBTSxFQUFFLElBQUksR0FBRyxDQUFDO2FBQ3BCLENBQUMsQ0FBQTtTQUNOO2FBRUQ7WUFDTSxNQUF3QixDQUFDLEdBQUcsQ0FBRTtnQkFDMUIsS0FBSyxFQUFHLElBQUk7Z0JBQ1osTUFBTSxFQUFFLElBQUk7YUFDaEIsQ0FBQyxDQUFBO1NBQ047UUFFRCxNQUFNLENBQUMsU0FBUyxFQUFHLENBQUE7SUFDeEIsQ0FBQztJQUVELFdBQVcsQ0FBRyxLQUFxQjtRQUU5QixNQUFNLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxHQUFHLElBQUksQ0FBQTtRQUU5QixJQUFLLFNBQVMsQ0FBQyxNQUFNLElBQUksQ0FBQztZQUNyQixLQUFLLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQTs7WUFFcEIsTUFBTSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUE7UUFFekIsSUFBSyxLQUFLLENBQUMsS0FBSyxJQUFJLFNBQVMsSUFBSSxJQUFJLENBQUMsTUFBTSxJQUFJLFNBQVM7WUFDcEQsS0FBSyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFBO1FBRXZDLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxNQUFNO2NBQ1gsT0FBTyxDQUFFLE1BQU0sQ0FBQyxLQUFZLENBQUMsQ0FBRyxNQUFNLEVBQUUsS0FBSyxDQUFDLFdBQVcsRUFBRyxFQUFFO2dCQUMzRCxJQUFJLEVBQVMsQ0FBQztnQkFDZCxHQUFHLEVBQVUsQ0FBQztnQkFDZCxPQUFPLEVBQU0sUUFBUTtnQkFDckIsT0FBTyxFQUFNLFFBQVE7Z0JBQ3JCLElBQUksRUFBUyxNQUFNLENBQUMsZUFBZTtnQkFDbkMsTUFBTSxFQUFPLE1BQU0sQ0FBQyxXQUFXO2dCQUMvQixXQUFXLEVBQUUsTUFBTSxDQUFDLFdBQVc7YUFDbkMsQ0FBQyxDQUFBO1FBRVosS0FBSyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUcsR0FBRyxDQUFFLENBQUE7UUFDdkIsR0FBRyxDQUFDLFVBQVUsRUFBRyxDQUFBO1FBRWpCLElBQUssTUFBTSxDQUFDLGVBQWUsSUFBSSxTQUFTO1lBQ25DLElBQUksQ0FBQyxxQkFBcUIsRUFBRyxDQUFBO1FBRWxDLElBQUssR0FBRyxDQUFDLE1BQU0sSUFBSSxTQUFTO1lBQ3ZCLEdBQUcsQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLEVBQUcsQ0FBQTtJQUV4QyxDQUFDO0lBRUQscUJBQXFCLENBQUcsSUFBYTtRQUVoQyxJQUFLLFNBQVMsQ0FBQyxNQUFNLElBQUksQ0FBQztZQUNyQixJQUFJLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxlQUFlLENBQUE7O1lBRWxDLElBQUksQ0FBQyxNQUFNLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQTtRQUV2QyxJQUFLLE9BQU8sSUFBSSxJQUFJLFFBQVEsSUFBSSxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUM7WUFDMUMsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUcsSUFBSSxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFFLElBQUksQ0FBQyxDQUFFLENBQUE7SUFDckUsQ0FBQztJQUVPLFVBQVUsQ0FBRyxJQUFzQjtRQUV0QyxNQUFNLEVBQUUsS0FBSyxFQUFFLEdBQUcsSUFBSSxDQUFBO1FBRXRCLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQU07WUFDeEIsQ0FBQyxDQUFDLEtBQUssQ0FBQyxXQUFXLEVBQUcsR0FBRyxJQUFJLENBQUMsS0FBSztZQUNuQyxDQUFDLENBQUMsS0FBSyxDQUFDLFdBQVcsRUFBRyxHQUFHLElBQUksQ0FBQyxNQUFNLENBRWxEO1FBQUMsSUFBSSxDQUFDLE1BQWMsQ0FBQyxHQUFHLENBQUU7WUFDdEIsSUFBSSxFQUFFLElBQUksTUFBTSxDQUFDLE9BQU8sQ0FBRTtnQkFDckIsTUFBTSxFQUFFLElBQUk7Z0JBQ1osTUFBTSxFQUFFLFdBQVc7Z0JBQ25CLGdCQUFnQixFQUFFO29CQUNiLE1BQU0sRUFBRSxDQUFDLEVBQUUsQ0FBQztvQkFDWixNQUFNLEVBQUUsQ0FBQyxFQUFFLENBQUM7aUJBQ2hCO2FBQ0wsQ0FBQztTQUNOLENBQUM7YUFDRCxTQUFTLEVBQUcsQ0FBQTtRQUViLElBQUssSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNO1lBQ2xCLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRyxDQUFBO0lBQ3pDLENBQUM7Q0FDTCJ9