import { xnode } from "../../Base/xnode.js";
import { css } from "../../Base/dom.js";
export function createMenu() {
    const self = {};
    const button = xnode("button", { class: "w3-button w3-xxlarge", click: open }, "\u2630");
    const overlay = xnode("div", { class: "w3-overlay w3-animate-opacity", style: "cursor:pointer", click: close });
    const sidebar = xnode("div", { class: "w3-sidebar w3-bar-block" },
        xnode("button", { class: "w3-bar-item w3-button", click: close }, "Close"),
        xnode("button", { class: "w3-bar-item w3-button", click: rotateLayout }, "\u2934 Rotate layout"),
        xnode("button", { class: "w3-bar-item w3-button", click: reverseLayout }, "\u21C5 Switch layout"));
    css(sidebar, {
        zIndex: "4",
        transition: "all 0.4s",
        left: "-300px"
    });
    button.style.position = "fixed";
    button.style.zIndex = "2";
    self.elements = () => [button, overlay, sidebar];
    self.open = open;
    self.close = close;
    return self;
    function open() {
        sidebar.style.left = "0px";
        overlay.style.display = "block";
    }
    function close() {
        sidebar.style.left = "-300px";
        overlay.style.display = "none";
    }
    function rotateLayout() {
        // const panel = Application.panel
        // switch ( panel.getOrientation () )
        // {
        // case "bt": panel.setOrientation ( "rl"  ) ; break
        // case "rl": panel.setOrientation ( "bt" ) ; break
        // case "lr": panel.setOrientation ( "tb"    ) ; break
        // default  : panel.setOrientation ( "lr"   ) ; break
        // }
    }
    function reverseLayout() {
        // const panel = Application.panel
        // switch ( panel.getOrientation () )
        // {
        // case "bt": panel.setOrientation ( "tb"    ) ; break
        // case "tb": panel.setOrientation ( "bt" ) ; break
        // case "lr": panel.setOrientation ( "rl"  ) ; break
        // default  : panel.setOrientation ( "lr"   ) ; break
        // }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9VaS9Db21wb25lbnQvTWVudS9pbmRleC50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0EsT0FBTyxFQUFFLEtBQUssRUFBRSxNQUFNLHFCQUFxQixDQUFBO0FBQzNDLE9BQU8sRUFBRSxHQUFHLEVBQUUsTUFBTSxtQkFBbUIsQ0FBQTtBQVN2QyxNQUFNLFVBQVUsVUFBVTtJQUV0QixNQUFNLElBQUksR0FBRyxFQUFXLENBQUE7SUFFeEIsTUFBTSxNQUFNLEdBQ1Isa0JBQVEsS0FBSyxFQUFDLHNCQUFzQixFQUFDLEtBQUssRUFBRyxJQUFJLGFBRXhDLENBQUE7SUFFYixNQUFNLE9BQU8sR0FDVCxlQUFLLEtBQUssRUFBQywrQkFBK0IsRUFBQyxLQUFLLEVBQUMsZ0JBQWdCLEVBQzdELEtBQUssRUFBRyxLQUFLLEdBQVMsQ0FBQTtJQUU5QixNQUFNLE9BQU8sR0FDVCxlQUFLLEtBQUssRUFBQyx5QkFBeUI7UUFDaEMsa0JBQVEsS0FBSyxFQUFDLHVCQUF1QixFQUFDLEtBQUssRUFBRyxLQUFLLFlBRTFDO1FBQ1Qsa0JBQVEsS0FBSyxFQUFDLHVCQUF1QixFQUFDLEtBQUssRUFBRyxZQUFZLDJCQUVqRDtRQUNULGtCQUFRLEtBQUssRUFBQyx1QkFBdUIsRUFBQyxLQUFLLEVBQUcsYUFBYSwyQkFFbEQsQ0FDUCxDQUFBO0lBRVYsR0FBRyxDQUFHLE9BQU8sRUFBRTtRQUNYLE1BQU0sRUFBTSxHQUFHO1FBQ2YsVUFBVSxFQUFFLFVBQVU7UUFDdEIsSUFBSSxFQUFRLFFBQVE7S0FDdkIsQ0FBQyxDQUFBO0lBRUYsTUFBTSxDQUFDLEtBQUssQ0FBQyxRQUFRLEdBQUcsT0FBTyxDQUFBO0lBQy9CLE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFLLEdBQUcsQ0FBQTtJQUUzQixJQUFJLENBQUMsUUFBUSxHQUFHLEdBQUcsRUFBRSxDQUFFLENBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxPQUFPLENBQUUsQ0FBQTtJQUNuRCxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQTtJQUNoQixJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQTtJQUVsQixPQUFPLElBQUksQ0FBQTtJQUVYLFNBQVMsSUFBSTtRQUVULE9BQU8sQ0FBQyxLQUFLLENBQUMsSUFBSSxHQUFNLEtBQUssQ0FBQTtRQUM3QixPQUFPLENBQUMsS0FBSyxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUE7SUFDbkMsQ0FBQztJQUNELFNBQVMsS0FBSztRQUVWLE9BQU8sQ0FBQyxLQUFLLENBQUMsSUFBSSxHQUFNLFFBQVEsQ0FBQTtRQUNoQyxPQUFPLENBQUMsS0FBSyxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUM7SUFDbkMsQ0FBQztJQUVELFNBQVMsWUFBWTtRQUVqQixrQ0FBa0M7UUFDbEMscUNBQXFDO1FBQ3JDLElBQUk7UUFDSixvREFBb0Q7UUFDcEQsbURBQW1EO1FBQ25ELHNEQUFzRDtRQUN0RCxxREFBcUQ7UUFDckQsSUFBSTtJQUNSLENBQUM7SUFDRCxTQUFTLGFBQWE7UUFFbEIsa0NBQWtDO1FBQ2xDLHFDQUFxQztRQUNyQyxJQUFJO1FBQ0osc0RBQXNEO1FBQ3RELG1EQUFtRDtRQUNuRCxvREFBb0Q7UUFDcEQscURBQXFEO1FBQ3JELElBQUk7SUFDUixDQUFDO0FBQ0wsQ0FBQyJ9