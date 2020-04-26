import { Component } from "../../Base/Component/index.js";
import { xnode } from "../../Base/xnode.js";
import { define } from "../../db.js";
export class Block extends Component {
    constructor() {
        super(...arguments);
        this.container = xnode("div", { class: "bar" });
    }
    get orientation() {
        return this.container.classList.contains("vertical")
            ? "horizontal"
            : "vertical";
    }
    set orientation(orientation) {
        const classList = this.container.classList;
        var new_orientation = classList.contains("vertical")
            ? "horizontal"
            : "vertical";
        if (orientation == new_orientation)
            return;
        classList.replace(orientation, new_orientation);
    }
}
define(Block, ["block"]);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9VaS9Db21wb25lbnQvQmFyL2luZGV4LnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sK0JBQStCLENBQUE7QUFDekQsT0FBTyxFQUFFLEtBQUssRUFBRSxNQUFNLHFCQUFxQixDQUFBO0FBQzNDLE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSxhQUFhLENBQUE7QUFjcEMsTUFBTSxPQUFPLEtBQU0sU0FBUSxTQUFrQjtJQUE3Qzs7UUFFSyxjQUFTLEdBQUcsZUFBSyxLQUFLLEVBQUMsS0FBSyxHQUFPLENBQUE7SUFzQnhDLENBQUM7SUFwQkksSUFBSSxXQUFXO1FBRVYsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUcsVUFBVSxDQUFFO1lBQ2xELENBQUMsQ0FBQyxZQUFZO1lBQ2QsQ0FBQyxDQUFDLFVBQVUsQ0FBQTtJQUN0QixDQUFDO0lBRUQsSUFBSSxXQUFXLENBQUcsV0FBd0I7UUFFckMsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUE7UUFFMUMsSUFBSSxlQUFlLEdBQUcsU0FBUyxDQUFDLFFBQVEsQ0FBRyxVQUFVLENBQUU7WUFDbkMsQ0FBQyxDQUFDLFlBQVk7WUFDZCxDQUFDLENBQUMsVUFBVSxDQUFBO1FBRWhDLElBQUssV0FBVyxJQUFJLGVBQWU7WUFDOUIsT0FBTTtRQUVYLFNBQVMsQ0FBQyxPQUFPLENBQUksV0FBVyxFQUFFLGVBQWUsQ0FBRSxDQUFBO0lBQ3hELENBQUM7Q0FDTDtBQUdELE1BQU0sQ0FBRyxLQUFLLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBRSxDQUFBIn0=