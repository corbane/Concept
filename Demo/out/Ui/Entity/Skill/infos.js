import { xnode, Component, define } from "../../index.js";
import * as db from "../../../Application/Data/db.js";
export class SkillViewer extends Component {
    display(skill) {
        const target = xnode("div", { class: "people" });
        for (const name of skill.items) {
            const person = db.getData(name);
            const card = xnode("div", { class: "w3-card-4 person-card" },
                xnode("img", { src: person.avatar, alt: "Avatar" }),
                xnode("div", { class: "w3-container" },
                    xnode("h4", null,
                        xnode("b", null, person.firstName)),
                    xnode("label", null,
                        xnode("b", null, person.isCaptain ? "Expert" : null))));
            target.append(card);
        }
        this.container.classList.add("container");
        this.container.innerHTML = "";
        this.container.append(xnode("h1", null, skill.id));
        this.container.append(xnode("p", null, skill.description));
        this.container.append(target);
        // https://github.com/LorDOniX/json-viewer/blob/master/src/json-viewer.js
        this.container.append(xnode("pre", null, JSON.stringify(skill, null, 3)));
    }
}
define(SkillViewer, {
    context: "concept-ui",
    type: "skill-viewer",
    id: undefined,
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5mb3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9VaS9FbnRpdHkvU2tpbGwvaW5mb3MudHN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBLE9BQU8sRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLE1BQU0sRUFBRSxNQUFNLGdCQUFnQixDQUFBO0FBQ3pELE9BQU8sS0FBSyxFQUFFLE1BQU0saUNBQWlDLENBQUE7QUFVckQsTUFBTSxPQUFPLFdBQVksU0FBUSxTQUF3QjtJQUVwRCxPQUFPLENBQUcsS0FBYTtRQUVsQixNQUFNLE1BQU0sR0FBRyxlQUFLLEtBQUssRUFBQyxRQUFRLEdBQU8sQ0FBQTtRQUV6QyxLQUFNLE1BQU0sSUFBSSxJQUFJLEtBQUssQ0FBQyxLQUFLLEVBQy9CO1lBQ0ssTUFBTSxNQUFNLEdBQUcsRUFBRSxDQUFDLE9BQU8sQ0FBYSxJQUFJLENBQUUsQ0FBQTtZQUU1QyxNQUFNLElBQUksR0FBRyxlQUFLLEtBQUssRUFBQyx1QkFBdUI7Z0JBQzFDLGVBQUssR0FBRyxFQUFHLE1BQU0sQ0FBQyxNQUFNLEVBQUcsR0FBRyxFQUFDLFFBQVEsR0FBRTtnQkFDekMsZUFBSyxLQUFLLEVBQUMsY0FBYztvQkFDcEI7d0JBQ0ssaUJBQUssTUFBTSxDQUFDLFNBQVMsQ0FBTSxDQUMzQjtvQkFDTDt3QkFDSyxpQkFBSyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBTSxDQUMxQyxDQUNQLENBQ0wsQ0FBQTtZQUVOLE1BQU0sQ0FBQyxNQUFNLENBQUcsSUFBSSxDQUFFLENBQUE7U0FDMUI7UUFFRCxJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUcsV0FBVyxDQUFFLENBQUE7UUFDNUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLEdBQUcsRUFBRSxDQUFBO1FBQzdCLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFHLGtCQUFNLEtBQUssQ0FBQyxFQUFFLENBQU8sQ0FBRSxDQUFBO1FBQy9DLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFHLGlCQUFLLEtBQUssQ0FBQyxXQUFXLENBQU0sQ0FBRSxDQUFBO1FBQ3RELElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFHLE1BQU0sQ0FBRSxDQUFBO1FBRWhDLHlFQUF5RTtRQUN6RSxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBRyxtQkFBTyxJQUFJLENBQUMsU0FBUyxDQUFHLEtBQUssRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFFLENBQVEsQ0FBRSxDQUFBO0lBQy9FLENBQUM7Q0FDTDtBQUVELE1BQU0sQ0FBRyxXQUFXLEVBQUU7SUFDakIsT0FBTyxFQUFFLFlBQVk7SUFDckIsSUFBSSxFQUFLLGNBQWM7SUFDdkIsRUFBRSxFQUFPLFNBQVM7Q0FDdEIsQ0FBQyxDQUFBIn0=