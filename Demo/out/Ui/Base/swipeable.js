import { Css } from "../../Lib/index.js";
import { cssFloat } from "./dom.js";
import * as Ui from "./draggable.js";
function defaultConfig() {
    return {
        handles: [],
        direction: "lr",
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
        handles: [],
        onStartDrag,
        onStopDrag,
    });
    element.classList.add("swipeable");
    updateConfig(options);
    function updateConfig(options) {
        Object.assign(config, options);
        is_vertical = config.direction == "bt" || config.direction == "tb";
        if (options.porperty == undefined)
            config.porperty = is_vertical ? "top" : "left";
        // switch ( config.porperty )
        // {
        // case "top": case "bottom": case "y": is_vertical = true  ; break
        // case "left": case "right": case "x": is_vertical = false ; break
        // default: debugger ; return
        // }
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
                h.addEventListener("wheel", onWheel, { passive: true });
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
            ? event.y //+ event.velocityY
            : event.x; //+ event.velocityX
        element.style[prop] = clamp(start_position + offset) + config.units;
        return true;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3dpcGVhYmxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vVWkvQmFzZS9zd2lwZWFibGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0EsT0FBTyxFQUFFLEdBQUcsRUFBRSxNQUFNLG9CQUFvQixDQUFBO0FBQ3hDLE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSxVQUFVLENBQUE7QUFDbkMsT0FBTyxLQUFLLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQTtBQXVCcEMsU0FBUyxhQUFhO0lBRWpCLE9BQU87UUFDRixPQUFPLEVBQUssRUFBRTtRQUNkLFNBQVMsRUFBRyxJQUFJO1FBQ2hCLFFBQVEsRUFBSSxNQUFNO1FBQ2xCLFFBQVEsRUFBSSxDQUFDLEdBQUc7UUFDaEIsUUFBUSxFQUFJLENBQUM7UUFDYixLQUFLLEVBQU8sR0FBRztRQUNmLFVBQVUsRUFBRSxJQUFJO0tBQ3BCLENBQUE7QUFDTixDQUFDO0FBRUQsSUFBSSxjQUFjLEdBQUcsQ0FBQyxDQUFBO0FBQ3RCLElBQUksV0FBVyxHQUFNLEtBQUssQ0FBQTtBQUMxQixJQUFJLElBQXdCLENBQUE7QUFFNUIsTUFBTSxVQUFVLFNBQVMsQ0FBRyxPQUFvQixFQUFFLE9BQXlCO0lBRXRFLE1BQU0sTUFBTSxHQUFHLGFBQWEsRUFBRyxDQUFBO0lBRS9CLE1BQU0sU0FBUyxHQUFHLEVBQUUsQ0FBQyxTQUFTLENBQUU7UUFDM0IsT0FBTyxFQUFFLEVBQUU7UUFDWCxXQUFXO1FBQ1gsVUFBVTtLQUNkLENBQUMsQ0FBQTtJQUVGLE9BQU8sQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFHLFdBQVcsQ0FBRSxDQUFBO0lBRXJDLFlBQVksQ0FBRyxPQUFPLENBQUUsQ0FBQTtJQUV4QixTQUFTLFlBQVksQ0FBRyxPQUF5QjtRQUU1QyxNQUFNLENBQUMsTUFBTSxDQUFHLE1BQU0sRUFBRSxPQUFPLENBQUUsQ0FBQTtRQUVqQyxXQUFXLEdBQUcsTUFBTSxDQUFDLFNBQVMsSUFBSSxJQUFJLElB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