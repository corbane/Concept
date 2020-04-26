import { Container } from "../../Base/Container/index.js";
import { swipeable } from "../../Base/swipeable.js";
import { define } from "../../db.js";
//   ```
//   .slideshow
//        [...]
//   ```
export class Slideshow extends Container {
    constructor() {
        super(...arguments);
        this.children = {};
    }
    getHtml() {
        const elements = super.getHtml();
        const data = this.data;
        const container = this.container;
        if (data.isSwipeable) {
            this.swipeable = swipeable(container, {
                handles: [container],
                minValue: -0,
                maxValue: 0,
                porperty: data.direction == "bt" || data.direction == "tb" ? "top" : "left",
                units: "px",
                mouseWheel: true,
            });
            this.swipeable.activate();
        }
        return elements;
    }
    show(id, ...content) {
        const child = this.children[id];
        if (child == undefined)
            return;
        if (this.current)
            this.current = child;
        if (content) {
            child.clear();
            console.log(content);
            child.append(...content);
        }
        child.container.style.display = "block";
    }
}
define(Slideshow, ["slideshow"]);
define(Container, ["slide"]);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9VaS9Db21wb25lbnQvU2xpZGVzaG93L2luZGV4LnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDQSxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sK0JBQStCLENBQUE7QUFDekQsT0FBTyxFQUFFLFNBQVMsRUFBb0IsTUFBTSx5QkFBeUIsQ0FBQTtBQUNyRSxPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0sYUFBYSxDQUFBO0FBaUJwQyxRQUFRO0FBQ1IsZUFBZTtBQUNmLGVBQWU7QUFDZixRQUFRO0FBQ1IsTUFBTSxPQUFPLFNBQVUsU0FBUSxTQUFzQjtJQUFyRDs7UUFFSyxhQUFRLEdBQUcsRUFBZ0MsQ0FBQTtJQThDaEQsQ0FBQztJQTFDSSxPQUFPO1FBRUYsTUFBTSxRQUFRLEdBQUcsS0FBSyxDQUFDLE9BQU8sRUFBRyxDQUFBO1FBRWpDLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUE7UUFDdEIsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQTtRQUVoQyxJQUFLLElBQUksQ0FBQyxXQUFXLEVBQ3JCO1lBQ0ssSUFBSSxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUcsU0FBUyxFQUFFO2dCQUNuQyxPQUFPLEVBQUssQ0FBRSxTQUFTLENBQUU7Z0JBQ3pCLFFBQVEsRUFBSSxDQUFDLENBQUM7Z0JBQ2QsUUFBUSxFQUFJLENBQUM7Z0JBQ2IsUUFBUSxFQUFJLElBQUksQ0FBQyxTQUFTLElBQUksSUFBSSxJQUFJLElBQUksQ0FBQyxTQUFTLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUEsQ0FBQyxDQUFDLE1BQU07Z0JBQzVFLEtBQUssRUFBTyxJQUFJO2dCQUNoQixVQUFVLEVBQUUsSUFBSTthQUNwQixDQUFDLENBQUE7WUFDRixJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsRUFBRyxDQUFBO1NBQzlCO1FBRUQsT0FBTyxRQUFRLENBQUE7SUFDcEIsQ0FBQztJQUVELElBQUksQ0FBRyxFQUFVLEVBQUUsR0FBSSxPQUE0RDtRQUU5RSxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFFLEVBQUUsQ0FBQyxDQUFBO1FBRWhDLElBQUssS0FBSyxJQUFJLFNBQVM7WUFDbEIsT0FBTTtRQUVYLElBQUssSUFBSSxDQUFDLE9BQU87WUFDWixJQUFJLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQTtRQUV6QixJQUFLLE9BQU8sRUFDWjtZQUNLLEtBQUssQ0FBQyxLQUFLLEVBQUcsQ0FBQTtZQUNkLE9BQU8sQ0FBQyxHQUFHLENBQUcsT0FBTyxDQUFFLENBQUE7WUFDdkIsS0FBSyxDQUFDLE1BQU0sQ0FBRyxHQUFJLE9BQU8sQ0FBRSxDQUFBO1NBQ2hDO1FBRUQsS0FBSyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQTtJQUM1QyxDQUFDO0NBQ0w7QUFFRCxNQUFNLENBQUcsU0FBUyxFQUFFLENBQUMsV0FBVyxDQUFDLENBQUUsQ0FBQTtBQUNuQyxNQUFNLENBQUcsU0FBUyxFQUFFLENBQUMsT0FBTyxDQUFDLENBQU0sQ0FBQSJ9