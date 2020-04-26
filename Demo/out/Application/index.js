import "../Lib/index.js";
import "../Data/index.js";
import "../Ui/index.js";
import "./Aspect/index.js";
export * from "./Data/index.js";
import "./context-menu.js";
import "./menu.js";
import "./panel.js";
import "./area.js";
export * from "./command.js";
export * from "./area.js";
import { area, contextualMenu } from "./area.js";
import { panel } from "./panel.js";
import { menu } from "./menu.js";
import { onCommand } from "./command.js";
export function width() {
    return area.fcanvas.getWidth();
}
export function height() {
    return area.fcanvas.getHeight();
}
export function refresh() {
    //$area.setZoom (0.1)
    area.fcanvas.requestRenderAll();
}
onCommand("open-menu", () => {
    panel.close();
    contextualMenu.hide();
});
onCommand("open-panel", () => {
    menu.close();
    contextualMenu.hide();
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9BcHBsaWNhdGlvbi9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDQSxPQUFPLGlCQUFpQixDQUFBO0FBQ3hCLE9BQU8sa0JBQWtCLENBQUE7QUFDekIsT0FBTyxnQkFBZ0IsQ0FBQTtBQUV2QixPQUFPLG1CQUFtQixDQUFBO0FBRTFCLGNBQWMsaUJBQWlCLENBQUE7QUFHL0IsT0FBTyxtQkFBbUIsQ0FBQTtBQUMxQixPQUFPLFdBQVcsQ0FBQTtBQUNsQixPQUFPLFlBQVksQ0FBQTtBQUNuQixPQUFPLFdBQVcsQ0FBQTtBQUVsQixjQUFjLGNBQWMsQ0FBQTtBQUM1QixjQUFjLFdBQVcsQ0FBQTtBQUd6QixPQUFPLEVBQUUsSUFBSSxFQUFFLGNBQWMsRUFBRSxNQUFNLFdBQVcsQ0FBQTtBQUNoRCxPQUFPLEVBQUUsS0FBSyxFQUFFLE1BQU0sWUFBWSxDQUFBO0FBQ2xDLE9BQU8sRUFBRSxJQUFJLEVBQUUsTUFBTSxXQUFXLENBQUE7QUFDaEMsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLGNBQWMsQ0FBQTtBQUV4QyxNQUFNLFVBQVUsS0FBSztJQUVoQixPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFHLENBQUE7QUFDcEMsQ0FBQztBQUVELE1BQU0sVUFBVSxNQUFNO0lBRWpCLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUcsQ0FBQTtBQUNyQyxDQUFDO0FBRUQsTUFBTSxVQUFVLE9BQU87SUFFbEIscUJBQXFCO0lBQ3JCLElBQUksQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLEVBQUcsQ0FBQTtBQUNyQyxDQUFDO0FBRUQsU0FBUyxDQUFHLFdBQVcsRUFBRSxHQUFHLEVBQUU7SUFFekIsS0FBSyxDQUFDLEtBQUssRUFBRyxDQUFBO0lBQ2QsY0FBYyxDQUFDLElBQUksRUFBRyxDQUFBO0FBQzNCLENBQUMsQ0FBQyxDQUFBO0FBQ0YsU0FBUyxDQUFHLFlBQVksRUFBRSxHQUFHLEVBQUU7SUFFMUIsSUFBSSxDQUFDLEtBQUssRUFBRyxDQUFBO0lBQ2IsY0FBYyxDQUFDLElBQUksRUFBRyxDQUFBO0FBQzNCLENBQUMsQ0FBQyxDQUFBIn0=