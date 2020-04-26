import { xnode } from "../../Base/xnode.js";
import { Panel } from "../Panel/index.js";
import { expandable } from "../../Base/expendable.js";
import { define } from "../../db.js";
export class SideMenu extends Panel {
    getHtml() {
        const elements = super.getHtml();
        const data = this.data;
        const container = this.container;
        const header = this._header;
        const content = this._content;
        container.classList.replace("panel", "side-menu");
        header.classList.replace("panel-header", "side-menu-header");
        content.classList.replace("panel-content", "side-menu-content");
        if (data.hasMainButton) {
            const btn = xnode("span", { class: "side-menu-main-button" },
                xnode("span", { class: "icon" }, "\u21D5"));
            this.main_button = btn;
            //this.container.insertAdjacentElement ( "afterbegin", btn )
            header.insertAdjacentElement("afterbegin", btn);
        }
        this.expandable = expandable(this.container, {
            direction: data.direction,
            near: 60,
            handles: Array.of(this.main_button),
            onAfterOpen: () => {
                content.classList.remove("hidden");
            },
            onBeforeClose: () => {
                content.classList.add("hidden");
            }
        });
        this.expandable.activate();
        return elements;
    }
    isOpen() {
        return this.expandable.isOpen();
    }
    isClose() {
        return this.expandable.isClose();
    }
    open() {
    }
    close() {
        this.expandable.close();
        return this;
    }
}
define(SideMenu, ["side-menu"]);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9VaS9Db21wb25lbnQvU2lkZU1lbnUvaW5kZXgudHN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBLE9BQU8sRUFBRSxLQUFLLEVBQUUsTUFBTSxxQkFBcUIsQ0FBQTtBQUMzQyxPQUFPLEVBQUUsS0FBSyxFQUFFLE1BQU0sbUJBQW1CLENBQUE7QUFDekMsT0FBTyxFQUFFLFVBQVUsRUFBcUIsTUFBTSwwQkFBMEIsQ0FBQTtBQUN4RSxPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0sYUFBYSxDQUFBO0FBYXBDLE1BQU0sT0FBTyxRQUFTLFNBQVEsS0FBaUI7SUFLMUMsT0FBTztRQUVGLE1BQU0sUUFBUSxHQUFHLEtBQUssQ0FBQyxPQUFPLEVBQUcsQ0FBQTtRQUVqQyxNQUFNLElBQUksR0FBUSxJQUFJLENBQUMsSUFBSSxDQUFBO1FBQzNCLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUE7UUFDaEMsTUFBTSxNQUFNLEdBQU0sSUFBSSxDQUFDLE9BQU8sQ0FBQTtRQUM5QixNQUFNLE9BQU8sR0FBSyxJQUFJLENBQUMsUUFBUSxDQUFBO1FBRS9CLFNBQVMsQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFHLE9BQU8sRUFBVSxXQUFXLENBQUUsQ0FBQTtRQUM1RCxNQUFNLENBQUksU0FBUyxDQUFDLE9BQU8sQ0FBRyxjQUFjLEVBQUcsa0JBQWtCLENBQUUsQ0FBQTtRQUNuRSxPQUFPLENBQUcsU0FBUyxDQUFDLE9BQU8sQ0FBRyxlQUFlLEVBQUUsbUJBQW1CLENBQUUsQ0FBQTtRQUVwRSxJQUFLLElBQUksQ0FBQyxhQUFhLEVBQ3ZCO1lBQ0ssTUFBTSxHQUFHLEdBQUcsZ0JBQU0sS0FBSyxFQUFDLHVCQUF1QjtnQkFDMUMsZ0JBQU0sS0FBSyxFQUFDLE1BQU0sYUFBUyxDQUN6QixDQUFBO1lBRVAsSUFBSSxDQUFDLFdBQVcsR0FBRyxHQUFHLENBQUE7WUFDdEIsNERBQTREO1lBQzVELE1BQU0sQ0FBQyxxQkFBcUIsQ0FBRyxZQUFZLEVBQUUsR0FBRyxDQUFFLENBQUE7U0FDdEQ7UUFFRCxJQUFJLENBQUMsVUFBVSxHQUFHLFVBQVUsQ0FBRyxJQUFJLENBQUMsU0FBUyxFQUFFO1lBQzFDLFNBQVMsRUFBTSxJQUFJLENBQUMsU0FBUztZQUM3QixJQUFJLEVBQVcsRUFBRTtZQUNqQixPQUFPLEVBQVEsS0FBSyxDQUFDLEVBQUUsQ0FBRyxJQUFJLENBQUMsV0FBVyxDQUFFO1lBQzVDLFdBQVcsRUFBSSxHQUFHLEVBQUU7Z0JBQ2YsT0FBTyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUcsUUFBUSxDQUFFLENBQUE7WUFDMUMsQ0FBQztZQUNELGFBQWEsRUFBRSxHQUFHLEVBQUU7Z0JBQ2YsT0FBTyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUcsUUFBUSxDQUFFLENBQUE7WUFDdkMsQ0FBQztTQUNMLENBQUMsQ0FBQTtRQUVGLElBQUksQ0FBQyxVQUFVLENBQUMsUUFBUSxFQUFHLENBQUE7UUFFM0IsT0FBTyxRQUFRLENBQUE7SUFDcEIsQ0FBQztJQUVELE1BQU07UUFFRCxPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFHLENBQUE7SUFDckMsQ0FBQztJQUVELE9BQU87UUFFRixPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxFQUFHLENBQUE7SUFDdEMsQ0FBQztJQUVELElBQUk7SUFHSixDQUFDO0lBRUQsS0FBSztRQUVBLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxFQUFHLENBQUE7UUFFeEIsT0FBTyxJQUFJLENBQUE7SUFDaEIsQ0FBQztDQVdMO0FBRUQsTUFBTSxDQUFHLFFBQVEsRUFBRSxDQUFDLFdBQVcsQ0FBQyxDQUFFLENBQUEifQ==