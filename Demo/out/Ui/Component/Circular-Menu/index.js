import { Geometry } from "../../../Lib/index.js";
import { Component } from "../../Base/Component/index.js";
import * as Svg from "../../Base/Svg/index.js";
import { xnode } from "../../Base/xnode.js";
const G = Geometry;
export class RadialMenu extends Component {
    constructor() {
        super(...arguments);
        this.renderers = {
            "circle": this.renderSvgCircles.bind(this)
        };
    }
    getHtml() {
        this.update();
        return [this.container];
    }
    add(...buttons) {
        this.data.buttons.push(...buttons);
        this.update();
    }
    update() {
        const { data } = this;
        const def = {
            count: data.buttons.length,
            r: 75,
            padding: 6,
            rotation: data.rotation || 0
        };
        this.definition = G.getRadialDistribution(def);
        this.container = this.toSvg("circle");
    }
    enableEvents() {
        //const { options } = this
        //for ( const btn of options.buttons )
        //     btn.
    }
    show(x, y) {
        const n = this.container;
        const offset = this.definition.width / 2;
        n.style.left = (x - offset) + "px";
        n.style.top = (y - offset) + "px";
        n.classList.remove("close");
        window.addEventListener("mousedown", this.hide.bind(this), true);
    }
    hide() {
        this.container.classList.add("close");
        document.removeEventListener("mousedown", this.hide);
    }
    toSvg(style) {
        const { definition: def, renderers, data } = this;
        const svg = xnode("svg", { class: "radial-menu close", width: def.width + "px", height: def.height + "px", viewBox: `0 0 ${def.width} ${def.height}` });
        const buttons = style in renderers
            ? renderers[style](def)
            : this.renderSvgCircles(def);
        svg.append(...buttons);
        for (var i = 0; i != buttons.length; i++) {
            const opt = data.buttons[i];
            if (typeof opt.callback == "function")
                buttons[i].addEventListener("mousedown", () => opt.callback());
        }
        return svg;
    }
    renderSvgCircles(definition) {
        const points = definition.points;
        const padding = definition.padding;
        const buttuns = [];
        for (var i = 0; i < points.length; ++i) {
            const def = points[i];
            const btn = this.data.buttons[i];
            const group = xnode("g", { class: "button" });
            const circle = Svg.createSvgShape("circle", {
                size: def.chord.length - padding * 2,
                x: def.x,
                y: def.y
            });
            const text = xnode("text", { x: def.x, y: def.y, "font-size": "30", fill: "black", style: "user-select: none; cursor: pointer; dominant-baseline: central; text-anchor: middle;" });
            if (btn.fontFamily != undefined)
                text.setAttribute("font-family", btn.fontFamily);
            text.innerHTML = btn.icon;
            group.append(circle);
            group.append(text);
            buttuns.push(group);
        }
        return buttuns;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9VaS9Db21wb25lbnQvQ2lyY3VsYXItTWVudS9pbmRleC50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLHVCQUF1QixDQUFBO0FBQ2hELE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSwrQkFBK0IsQ0FBQTtBQUN6RCxPQUFPLEtBQUssR0FBRyxNQUFNLHlCQUF5QixDQUFBO0FBQzlDLE9BQU8sRUFBRSxLQUFLLEVBQUUsTUFBTSxxQkFBcUIsQ0FBQTtBQUUzQyxNQUFNLENBQUMsR0FBRyxRQUFRLENBQUE7QUFpQmxCLE1BQU0sT0FBTyxVQUFXLFNBQVEsU0FBdUI7SUFBdkQ7O1FBS2MsY0FBUyxHQUE4QjtZQUMzQyxRQUFRLEVBQUUsSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBRSxJQUFJLENBQUM7U0FDL0MsQ0FBQTtJQTRITixDQUFDO0lBMUhJLE9BQU87UUFFRixJQUFJLENBQUMsTUFBTSxFQUFHLENBQUE7UUFFZCxPQUFPLENBQUMsSUFBSSxDQUFDLFNBQWdCLENBQUMsQ0FBQTtJQUNuQyxDQUFDO0lBRUQsR0FBRyxDQUFHLEdBQUksT0FBbUI7UUFFeEIsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFHLEdBQUksT0FBYyxDQUFFLENBQUE7UUFFN0MsSUFBSSxDQUFDLE1BQU0sRUFBRyxDQUFBO0lBQ25CLENBQUM7SUFFRCxNQUFNO1FBRUQsTUFBTSxFQUFFLElBQUksRUFBRSxHQUFHLElBQUksQ0FBQTtRQUVyQixNQUFNLEdBQUcsR0FBaUI7WUFDckIsS0FBSyxFQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTTtZQUM1QixDQUFDLEVBQVEsRUFBRTtZQUNYLE9BQU8sRUFBRSxDQUFDO1lBQ1YsUUFBUSxFQUFFLElBQUksQ0FBQyxRQUFRLElBQUksQ0FBQztTQUNoQyxDQUFB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