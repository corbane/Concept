import "../Ui/db.js";
import "../Ui/Component/Slideshow/index.js";
import "./Component/infos.js";
import "../Ui/Entity/Skill/infos.js";
import * as ui from "../Ui/index.js";
import { addCommand } from "./command.js";
var direction = "rl";
export const panel = ui.make({
    context: "concept-ui",
    type: "side-menu",
    id: undefined,
    direction: direction,
    hasMainButton: true,
    header: {
        context: "concept-ui",
        type: "toolbar",
        id: undefined,
        title: "Title ..",
        direction: direction == "lr" || direction == "rl" ? "tb" : "lr",
        buttons: [{
                context: "concept-ui",
                type: "button",
                id: "console",
                icon: "⚠",
                text: "",
                handleOn: "*",
                command: "pack-view"
            }, {
                context: "concept-ui",
                type: "button",
                id: "properties",
                icon: "",
                text: "panel properties",
                handleOn: "*",
            }]
    },
    children: [{
            context: "concept-ui",
            type: "slideshow",
            id: "panel-slideshow",
            children: [{
                    context: "concept-ui",
                    type: "skill-viewer",
                    id: "slide-skill"
                }, {
                    context: "concept-ui",
                    type: "person-viewer",
                    id: "slide-person"
                }]
        }]
});
document.body.append(...panel.getHtml());
const slideshow = ui.pick("slideshow", "panel-slideshow");
const slideInfos = ui.pick("skill-viewer", "slide-skill");
addCommand("open-panel", (name, ...content) => {
    if (name)
        slideshow.show(name, ...content);
    else
        panel.open();
});
addCommand("open-infos-panel", (data) => {
    if (data) {
        slideInfos.display(data);
        panel.open();
    }
});
addCommand("close-panel", () => {
    panel.close();
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFuZWwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9BcHBsaWNhdGlvbi9wYW5lbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDQSxPQUFPLGFBQWEsQ0FBQTtBQUNwQixPQUFPLG9DQUFvQyxDQUFBO0FBQzNDLE9BQU8sc0JBQXNCLENBQUE7QUFDN0IsT0FBTyw2QkFBNkIsQ0FBQTtBQUVwQyxPQUFPLEtBQUssRUFBRSxNQUFNLGdCQUFnQixDQUFBO0FBR3BDLE9BQU8sRUFBRSxVQUFVLEVBQUUsTUFBTSxjQUFjLENBQUE7QUFRekMsSUFBSSxTQUFTLEdBQUcsSUFBaUMsQ0FBQTtBQUVqRCxNQUFNLENBQUMsTUFBTSxLQUFLLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBd0I7SUFDL0MsT0FBTyxFQUFRLFlBQVk7SUFDM0IsSUFBSSxFQUFXLFdBQVc7SUFDMUIsRUFBRSxFQUFhLFNBQVM7SUFDeEIsU0FBUyxFQUFNLFNBQVM7SUFDeEIsYUFBYSxFQUFFLElBQUk7SUFFbkIsTUFBTSxFQUFFO1FBQ0gsT0FBTyxFQUFJLFlBQVk7UUFDdkIsSUFBSSxFQUFPLFNBQVM7UUFDcEIsRUFBRSxFQUFTLFNBQVM7UUFDcEIsS0FBSyxFQUFNLFVBQVU7UUFDckIsU0FBUyxFQUFFLFNBQVMsSUFBSSxJQUFJLElBQUksU0FBUyxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJO1FBRS9ELE9BQU8sRUFBRSxDQUFDO2dCQUNMLE9BQU8sRUFBRSxZQUFZO2dCQUNyQixJQUFJLEVBQU0sUUFBUTtnQkFDbEIsRUFBRSxFQUFRLFNBQVM7Z0JBQ25CLElBQUksRUFBTSxHQUFHO2dCQUNiLElBQUksRUFBTSxFQUFFO2dCQUNaLFFBQVEsRUFBRSxHQUFHO2dCQUNiLE9BQU8sRUFBRSxXQUFXO2FBQ3hCLEVBQUM7Z0JBQ0csT0FBTyxFQUFFLFlBQVk7Z0JBQ3JCLElBQUksRUFBTSxRQUFRO2dCQUNsQixFQUFFLEVBQVEsWUFBWTtnQkFDdEIsSUFBSSxFQUFNLEVBQUU7Z0JBQ1osSUFBSSxFQUFNLGtCQUFrQjtnQkFDNUIsUUFBUSxFQUFFLEdBQUc7YUFDakIsQ0FBQztLQUNOO0lBRUQsUUFBUSxFQUFFLENBQUM7WUFDTixPQUFPLEVBQUksWUFBWTtZQUN2QixJQUFJLEVBQU8sV0FBVztZQUN0QixFQUFFLEVBQVMsaUJBQWlCO1lBRTVCLFFBQVEsRUFBRSxDQUFDO29CQUNOLE9BQU8sRUFBRSxZQUFZO29CQUNyQixJQUFJLEVBQUssY0FBYztvQkFDdkIsRUFBRSxFQUFPLGFBQWE7aUJBQzFCLEVBQUM7b0JBQ0csT0FBTyxFQUFFLFlBQVk7b0JBQ3JCLElBQUksRUFBSyxlQUFlO29CQUN4QixFQUFFLEVBQU8sY0FBYztpQkFDM0IsQ0FBQztTQUNOLENBQUM7Q0FDTixDQUFDLENBQUE7QUFFRixRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBRyxHQUFJLEtBQUssQ0FBQyxPQUFPLEVBQUcsQ0FBRSxDQUFBO0FBRTdDLE1BQU0sU0FBUyxHQUFJLEVBQUUsQ0FBQyxJQUFJLENBQWlCLFdBQVcsRUFBRSxpQkFBaUIsQ0FBRSxDQUFBO0FBQzNFLE1BQU0sVUFBVSxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQWlCLGNBQWMsRUFBRSxhQUFhLENBQUUsQ0FBQTtBQUUxRSxVQUFVLENBQUcsWUFBWSxFQUFFLENBQUUsSUFBSSxFQUFFLEdBQUksT0FBTyxFQUFHLEVBQUU7SUFFOUMsSUFBSyxJQUFJO1FBQ0osU0FBUyxDQUFDLElBQUksQ0FBRyxJQUFJLEVBQUUsR0FBSSxPQUFPLENBQUUsQ0FBQTs7UUFFcEMsS0FBSyxDQUFDLElBQUksRUFBRyxDQUFBO0FBQ3ZCLENBQUMsQ0FBQyxDQUFBO0FBRUYsVUFBVSxDQUFHLGtCQUFrQixFQUFFLENBQUUsSUFBSSxFQUFHLEVBQUU7SUFFdkMsSUFBSyxJQUFJLEVBQ1Q7UUFDSyxVQUFVLENBQUMsT0FBTyxDQUFHLElBQVcsQ0FBRSxDQUFBO1FBQ2xDLEtBQUssQ0FBQyxJQUFJLEVBQUcsQ0FBQTtLQUNqQjtBQUNOLENBQUMsQ0FBQyxDQUFBO0FBRUYsVUFBVSxDQUFHLGFBQWEsRUFBRyxHQUFHLEVBQUU7SUFFN0IsS0FBSyxDQUFDLEtBQUssRUFBRyxDQUFBO0FBQ25CLENBQUMsQ0FBQyxDQUFBIn0=