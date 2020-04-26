import { xnode } from "../../Base/xnode.js";
import { pick } from "../../db.js";
export class ButtonGroup {
    constructor() {
        this.buttons = []; //as Button []
        this.container = xnode("div", { class: "button-group" });
    }
    add(...elements) {
        const { buttons, container } = this;
        for (var obj of elements) {
            const comp = pick(obj);
            buttons.push(comp);
            container.append(...comp.getHtml());
        }
    }
    setOrientation(orientation) {
        const classList = this.container.classList;
        var new_orientation = classList.contains("vertical")
            ? "horizontal"
            : "vertical";
        if (orientation == new_orientation)
            return;
        classList.replace(orientation, new_orientation);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9VaS9Db21wb25lbnQvQnV0dG9uR3JvdXAvaW5kZXgudHN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBLE9BQU8sRUFBRSxLQUFLLEVBQUUsTUFBTSxxQkFBcUIsQ0FBQTtBQUMzQyxPQUFPLEVBQUUsSUFBSSxFQUFFLE1BQU0sYUFBYSxDQUFBO0FBU2xDLE1BQU0sT0FBTyxXQUFXO0lBQXhCO1FBRUssWUFBTyxHQUFHLEVBQUUsQ0FBQSxDQUFDLGNBQWM7UUFFM0IsY0FBUyxHQUFHLGVBQUssS0FBSyxFQUFDLGNBQWMsR0FBTyxDQUFBO0lBNEJqRCxDQUFDO0lBMUJJLEdBQUcsQ0FBRyxHQUFJLFFBQW9CO1FBRXpCLE1BQU0sRUFBRSxPQUFPLEVBQUUsU0FBUyxFQUFFLEdBQUcsSUFBSSxDQUFBO1FBRW5DLEtBQU0sSUFBSSxHQUFHLElBQUksUUFBUSxFQUN6QjtZQUNLLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBRyxHQUFHLENBQUUsQ0FBQTtZQUV6QixPQUFPLENBQUMsSUFBSSxDQUFHLElBQUksQ0FBRSxDQUFBO1lBQ3JCLFNBQVMsQ0FBQyxNQUFNLENBQUcsR0FBSSxJQUFJLENBQUMsT0FBTyxFQUFHLENBQUUsQ0FBQTtTQUM1QztJQUNOLENBQUM7SUFFRCxjQUFjLENBQUcsV0FBd0I7UUFFcEMsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUE7UUFFMUMsSUFBSSxlQUFlLEdBQUcsU0FBUyxDQUFDLFFBQVEsQ0FBRyxVQUFVLENBQUU7WUFDbkMsQ0FBQyxDQUFDLFlBQVk7WUFDZCxDQUFDLENBQUMsVUFBVSxDQUFBO1FBRWhDLElBQUssV0FBVyxJQUFJLGVBQWU7WUFDOUIsT0FBTTtRQUVYLFNBQVMsQ0FBQyxPQUFPLENBQUksV0FBVyxFQUFFLGVBQWUsQ0FBRSxDQUFBO0lBQ3hELENBQUM7Q0FDTCJ9