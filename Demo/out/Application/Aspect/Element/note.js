// <reference path="../../typings.d.ts" />
//import * as fabric from "fabric/fabric-impl.js"
import { Shape } from "./shape.js";
export class Note extends Shape {
    init() {
        //super.init ()
        const { group } = this;
        const text = new fabric.Textbox(this.config.data.text, {
            fontSize: 12,
            originX: "center",
            originY: "center",
            left: group.left,
            top: group.top,
            selectable: true,
            editable: true,
        });
        const text_onInput = text.onInput.bind(text);
        text.onInput = (event) => {
            text_onInput(event);
            group.set({
                width: text.width,
                height: text.height
            });
            group.setCoords();
        };
        group.addWithUpdate(text).setCoords();
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL0FwcGxpY2F0aW9uL0FzcGVjdC9FbGVtZW50L25vdGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsMENBQTBDO0FBQzFDLGlEQUFpRDtBQUVqRCxPQUFPLEVBQUUsS0FBSyxFQUFFLE1BQU0sWUFBWSxDQUFBO0FBRWxDLE1BQU0sT0FBTyxJQUFLLFNBQVEsS0FBSztJQUUxQixJQUFJO1FBRUMsZUFBZTtRQUVmLE1BQU0sRUFBRSxLQUFLLEVBQUUsR0FBRyxJQUFJLENBQUE7UUFFdEIsTUFBTSxJQUFJLEdBQUcsSUFBSSxNQUFNLENBQUMsT0FBTyxDQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBWSxDQUFDLElBQUksRUFBRTtZQUM3RCxRQUFRLEVBQUUsRUFBRTtZQUNaLE9BQU8sRUFBRyxRQUFRO1lBQ2xCLE9BQU8sRUFBRyxRQUFRO1lBQ2xCLElBQUksRUFBTSxLQUFLLENBQUMsSUFBSTtZQUNwQixHQUFHLEVBQU8sS0FBSyxDQUFDLEdBQUc7WUFDbkIsVUFBVSxFQUFFLElBQUk7WUFDaEIsUUFBUSxFQUFFLElBQUk7U0FDbEIsQ0FBQyxDQUFBO1FBRUYsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUUsSUFBSSxDQUFDLENBQUE7UUFFN0MsSUFBSSxDQUFDLE9BQU8sR0FBRyxDQUFFLEtBQUssRUFBRyxFQUFFO1lBRXRCLFlBQVksQ0FBRyxLQUFLLENBQUUsQ0FBQTtZQUN0QixLQUFLLENBQUMsR0FBRyxDQUFFO2dCQUNOLEtBQUssRUFBRSxJQUFJLENBQUMsS0FBSztnQkFDakIsTUFBTSxFQUFFLElBQUksQ0FBQyxNQUFNO2FBQ3ZCLENBQUMsQ0FBQTtZQUNGLEtBQUssQ0FBQyxTQUFTLEVBQUcsQ0FBQTtRQUN2QixDQUFDLENBQUE7UUFFRCxLQUFLLENBQUMsYUFBYSxDQUFHLElBQUksQ0FBRSxDQUFDLFNBQVMsRUFBRyxDQUFBO0lBQzlDLENBQUM7Q0FDTCJ9