import { draggable } from "./draggable.js";
function defaultConfig() {
    return {
        handles: [],
        direction: "tb"
    };
}
function scrollableNative(options) {
    desactivate();
    return {
        activate,
        desactivate,
    };
    function activate() {
        const dir = options.direction == "bt" || options.direction == "tb"
            ? "pan-y" : "pan-x";
        for (const h of options.handles)
            h.style.touchAction = dir;
    }
    function desactivate() {
        const dir = options.direction == "bt" || options.direction == "tb"
            ? "pan-y" : "pan-x";
        for (const h of options.handles)
            h.style.touchAction = "none";
    }
}
export function scollable(options) {
    if ("ontouchstart" in window)
        return scrollableNative(options);
    const drag = draggable({
        handles: options.handles,
        velocityFactor: 100,
        onStartDrag,
        onDrag: options.direction == "bt" || options.direction == "tb"
            ? onDragVertical
            : onDragHorizontal,
        onStopDrag: options.direction == "bt" || options.direction == "tb"
            ? onStopDragVertical
            : onStopDragHorizontal,
    });
    return {
        activate: () => { drag.activate(); }
    };
    function onStartDrag() {
        for (const h of options.handles)
            h.style.scrollBehavior = "unset";
    }
    function onDragVertical(event) {
        for (const h of options.handles)
            h.scrollBy(0, event.offsetY);
    }
    function onDragHorizontal(event) {
        for (const h of options.handles)
            h.scrollBy(event.offsetX, 0);
    }
    function onStopDragVertical(event) {
        for (const h of options.handles) {
            h.scrollBy(0, event.offsetY);
            //h.style.scrollBehavior = "smooth"
            //h.scrollBy ( 0, event.offsetY + event.velocityY )
        }
        return true;
    }
    function onStopDragHorizontal(event) {
        for (const h of options.handles) {
            h.scrollBy(event.offsetX, 0);
            //h.style.scrollBehavior = "smooth"
            //h.scrollBy ( event.offsetX + event.velocityX, 0 )
        }
        return true;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2Nyb2xsYWJsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL1VpL0Jhc2Uvc2Nyb2xsYWJsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDQSxPQUFPLEVBQUUsU0FBUyxFQUFhLE1BQU0sZ0JBQWdCLENBQUE7QUFXckQsU0FBUyxhQUFhO0lBRWpCLE9BQU87UUFDRixPQUFPLEVBQUksRUFBRTtRQUNiLFNBQVMsRUFBRSxJQUFJO0tBQ25CLENBQUE7QUFDTixDQUFDO0FBRUQsU0FBUyxnQkFBZ0IsQ0FBRyxPQUF3QjtJQUUvQyxXQUFXLEVBQUcsQ0FBQTtJQUVkLE9BQU87UUFDRixRQUFRO1FBQ1IsV0FBVztLQUNmLENBQUE7SUFFRCxTQUFTLFFBQVE7UUFFWixNQUFNLEdBQUcsR0FBRyxPQUFPLENBQUMsU0FBUyxJQUFJLElBQUksSUFBSSxPQUFPLENBQUMsU0FBUyxJQUFJLElBQUk7WUFDeEQsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFBO1FBRTdCLEtBQU0sTUFBTSxDQUFDLElBQUksT0FBTyxDQUFDLE9BQU87WUFDM0IsQ0FBQyxDQUFDLEtBQUssQ0FBQyxXQUFXLEdBQUcsR0FBRyxDQUFBO0lBQ25DLENBQUM7SUFFRCxTQUFTLFdBQVc7UUFFZixNQUFNLEdBQUcsR0FBRyxPQUFPLENBQUMsU0FBUyxJQUFJLElBQUksSUFBSSxPQUFPLENBQUMsU0FBUyxJQUFJLElBQUk7WUFDeEQsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFBO1FBRTdCLEtBQU0sTUFBTSxDQUFDLElBQUksT0FBTyxDQUFDLE9BQU87WUFDM0IsQ0FBQyxDQUFDLEtBQUssQ0FBQyxXQUFXLEdBQUcsTUFBTSxDQUFBO0lBQ3RDLENBQUM7QUFDTixDQUFDO0FBRUQsTUFBTSxVQUFVLFNBQVMsQ0FBRyxPQUF3QjtJQUUvQyxJQUFLLGNBQWMsSUFBSSxNQUFNO1FBQ3hCLE9BQU8sZ0JBQWdCLENBQUcsT0FBTyxDQUFFLENBQUE7SUFFeEMsTUFBTSxJQUFJLEdBQUcsU0FBUyxDQUFFO1FBQ25CLE9BQU8sRUFBUyxPQUFPLENBQUMsT0FBTztRQUMvQixjQUFjLEVBQUUsR0FBRztRQUNuQixXQUFXO1FBQ1gsTUFBTSxFQUFPLE9BQU8sQ0FBQyxTQUFTLElBQUksSUFBSSxJQUFJLE9BQU8sQ0FBQyxTQUFTLElBQUksSUFBSTtZQUN4RCxDQUFDLENBQUMsY0FBYztZQUNoQixDQUFDLENBQUMsZ0JBQWdCO1FBQzdCLFVBQVUsRUFBRSxPQUFPLENBQUMsU0FBUyxJQUFJLElBQUksSUFBSSxPQUFPLENBQUMsU0FBUyxJQUFJLElBQUk7WUFDeEQsQ0FBQyxDQUFDLGtCQUFrQjtZQUNwQixDQUFDLENBQUMsb0JBQW9CO0tBQ3BDLENBQUMsQ0FBQTtJQUVGLE9BQU87UUFDRixRQUFRLEVBQUUsR0FBRyxFQUFFLEdBQUcsSUFBSSxDQUFDLFFBQVEsRUFBRyxDQUFBLENBQUMsQ0FBQztLQUN4QyxDQUFBO0lBRUQsU0FBUyxXQUFXO1FBRWYsS0FBTSxNQUFNLENBQUMsSUFBSSxPQUFPLENBQUMsT0FBTztZQUMzQixDQUFDLENBQUMsS0FBSyxDQUFDLGNBQWMsR0FBRyxPQUFPLENBQUE7SUFDMUMsQ0FBQztJQUNELFNBQVMsY0FBYyxDQUFHLEtBQWdCO1FBRXJDLEtBQU0sTUFBTSxDQUFDLElBQUksT0FBTyxDQUFDLE9BQU87WUFDM0IsQ0FBQyxDQUFDLFFBQVEsQ0FBRyxDQUFDLEVBQUUsS0FBSyxDQUFDLE9BQU8sQ0FBRSxDQUFBO0lBQ3pDLENBQUM7SUFDRCxTQUFTLGdCQUFnQixDQUFHLEtBQWdCO1FBRXZDLEtBQU0sTUFBTSxDQUFDLElBQUksT0FBTyxDQUFDLE9BQU87WUFDM0IsQ0FBQyxDQUFDLFFBQVEsQ0FBRyxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBRSxDQUFBO0lBQ3pDLENBQUM7SUFDRCxTQUFTLGtCQUFrQixDQUFHLEtBQWdCO1FBRXpDLEtBQU0sTUFBTSxDQUFDLElBQUksT0FBTyxDQUFDLE9BQU8sRUFDaEM7WUFDSyxDQUFDLENBQUMsUUFBUSxDQUFHLENBQUMsRUFBRSxLQUFLLENBQUMsT0FBTyxDQUFFLENBQUE7WUFDL0IsbUNBQW1DO1lBQ25DLG1EQUFtRDtTQUN2RDtRQUNELE9BQU8sSUFBSSxDQUFBO0lBQ2hCLENBQUM7SUFDRCxTQUFTLG9CQUFvQixDQUFHLEtBQWdCO1FBRTNDLEtBQU0sTUFBTSxDQUFDLElBQUksT0FBTyxDQUFDLE9BQU8sRUFDaEM7WUFDSyxDQUFDLENBQUMsUUFBUSxDQUFHLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFFLENBQUE7WUFDL0IsbUNBQW1DO1lBQ25DLG1EQUFtRDtTQUN2RDtRQUNELE9BQU8sSUFBSSxDQUFBO0lBQ2hCLENBQUM7QUFDTixDQUFDIn0=