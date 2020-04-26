import { Css } from "../../Lib/index.js";
import { cssFloat } from "./dom.js";
import * as Ui from "./draggable.js";
function defaultConfig() {
    return {
        handles: [],
        porperty: "left",
        minValue: -100,
        maxValue: 0,
        units: "%",
        mouseWheel: true,
    };
}
var start_position = 0;
var is_vertical = false;
var prop;
export function swipeable(element, options) {
    const config = defaultConfig();
    const draggable = Ui.draggable({
        onStartDrag,
        onStopDrag,
    });
    element.classList.add("swipeable");
    updateConfig(options);
    function updateConfig(options) {
        Object.assign(config, options);
        switch (config.porperty) {
            case "top":
            case "bottom":
            case "y":
                is_vertical = true;
                break;
            case "left":
            case "right":
            case "x":
                is_vertical = false;
                break;
            default:
                debugger;
                return;
        }
        draggable.updateConfig({
            handles: config.handles,
            onDrag: is_vertical ? onDragVertical : onDragHorizontal
        });
        prop = config.porperty;
        if (draggable.isActive())
            activeEvents();
        else
            desactiveEvents();
    }
    function position() {
        return cssFloat(element, prop);
    }
    function activate() {
        draggable.activate();
        activeEvents();
    }
    function desactivate() {
        draggable.desactivate();
        desactiveEvents();
    }
    function swipe(offset, u) {
        if (typeof offset == "string") {
            u = Css.getUnit(offset);
            offset = parseFloat(offset);
        }
        if (!["px", "%"].includes(u))
            u = "px";
        if (u != config.units) {
            if ((u = config.units) == "%")
                offset = toPercents(offset);
            else
                offset = toPixels(offset);
        }
        element.style[prop] = clamp(offset) + u;
    }
    return {
        updateConfig,
        activate,
        desactivate,
        position,
        swipe,
    };
    function activeEvents() {
        if (config.mouseWheel) {
            for (const h of config.handles)
                h.addEventListener("wheel", onWheel);
        }
    }
    function desactiveEvents() {
        for (const h of config.handles)
            h.removeEventListener("wheel", onWheel);
    }
    function toPixels(percentage) {
        const { minValue: min, maxValue: max } = config;
        if (percentage < 100)
            percentage = 100 + percentage;
        return min + (max - min) * percentage / 100;
    }
    function toPercents(pixels) {
        const { minValue: min, maxValue: max } = config;
        return Math.abs((pixels - min) / (max - min) * 100);
    }
    function onStartDrag() {
        element.classList.remove("animate");
        start_position = position();
    }
    function onDragVertical(event) {
        element.style[prop] = clamp(start_position + event.y) + config.units;
    }
    function onDragHorizontal(event) {
        element.style[prop] = clamp(start_position + event.x) + config.units;
    }
    function onStopDrag(event) {
        element.classList.add("animate");
        const offset = is_vertical
            ? event.y + event.velocityY
            : event.x + event.velocityX;
        element.style[prop] = clamp(start_position + offset) + config.units;
    }
    function onWheel(event) {
        if (event.deltaMode != WheelEvent.DOM_DELTA_PIXEL)
            return;
        if (is_vertical) {
            var delta = event.deltaY;
        }
        else {
            var delta = event.deltaX;
            if (delta == 0)
                delta = event.deltaY;
        }
        element.style[prop] = clamp(position() + delta) + config.units;
    }
    function clamp(value) {
        return value < config.minValue ? config.minValue
            : value > config.maxValue ? config.maxValue
                : value;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3dpcGVhYmxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vVWkvQ29yZS9zd2lwZWFibGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0EsT0FBTyxFQUFFLEdBQUcsRUFBRSxNQUFNLG9CQUFvQixDQUFBO0FBQ3hDLE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSxVQUFVLENBQUE7QUFDbkMsT0FBTyxLQUFLLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQTtBQXNCcEMsU0FBUyxhQUFhO0lBRWpCLE9BQU87UUFDRixPQUFPLEVBQUssRUFBRTtRQUNkLFFBQVEsRUFBSSxNQUFNO1FBQ2xCLFFBQVEsRUFBSSxDQUFDLEdBQUc7UUFDaEIsUUFBUSxFQUFJLENBQUM7UUFDYixLQUFLLEVBQU8sR0FBRztRQUNmLFVBQVUsRUFBRSxJQUFJO0tBQ3BCLENBQUE7QUFDTixDQUFDO0FBRUQsSUFBSSxjQUFjLEdBQUcsQ0FBQyxDQUFBO0FBQ3RCLElBQUksV0FBVyxHQUFNLEtBQUssQ0FBQTtBQUMxQixJQUFJLElBQXdCLENBQUE7QUFFNUIsTUFBTSxVQUFVLFNBQVMsQ0FBRyxPQUFvQixFQUFFLE9BQXlCO0lBRXRFLE1BQU0sTUFBTSxHQUFHLGFBQWEsRUFBRyxDQUFBO0lBRS9CLE1BQU0sU0FBUyxHQUFHLEVBQUUsQ0FBQyxTQUFTLENBQUU7UUFDM0IsV0FBVztRQUNYLFVBQVU7S0FDZCxDQUFDLENBQUE7SUFFRixPQUFPLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBRyxXQUFXLENBQUUsQ0FBQTtJQUVyQyxZQUFZLENBQUcsT0FBTyxDQUFFLENBQUE7SUFFeEIsU0FBUyxZQUFZLENBQUcsT0FBeUI7UUFFNUMsTUFBTSxDQUFDLE1BQU0sQ0FBRyxNQUFNLEVBQUUsT0FBTyxDQUFFLENBQUE7UUFFakMsUUFBUyxNQUFNLENBQUMsUUFBUSxFQUN4QjtZQUNBLEtBQUssS0FBSyxDQUFDO1lBQUMsS0FBSyxRQUFRLENBQUM7WUFBQyxLQUFLLEdB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