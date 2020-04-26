import { xnode, Component, define } from "../../Ui/index.js";
import * as db from "../Data/db.js";
export class SkillInfos extends Component {
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
        this.container.innerHTML = "";
        this.container.append(xnode("h1", null, skill.id));
        this.container.append(xnode("p", null, skill.description));
        this.container.append(target);
        // https://github.com/LorDOniX/json-viewer/blob/master/src/json-viewer.js
        this.container.append(xnode("pre", null, JSON.stringify(skill, null, 3)));
    }
}
//factory.define ( SkillInfos, {
//     context: "concept-aspect",
//     type   : "skill",
//     id     : undefined,
//})
define(SkillInfos, ["concept-infos", "data"]);
define(SkillInfos, ["console", "app-console"]);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5mb3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9BcHBsaWNhdGlvbi9Db21wb25lbnQvaW5mb3MudHN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBLE9BQU8sRUFBRSxLQUFLLEVBQWMsU0FBUyxFQUFFLE1BQU0sRUFBRSxNQUFNLG1CQUFtQixDQUFBO0FBR3hFLE9BQU8sS0FBSyxFQUFFLE1BQU0sZUFBZSxDQUFBO0FBaUJuQyxNQUFNLE9BQU8sVUFBVyxTQUFRLFNBQXVCO0lBRWxELE9BQU8sQ0FBRyxLQUFhO1FBRWxCLE1BQU0sTUFBTSxHQUFHLGVBQUssS0FBSyxFQUFDLFFBQVEsR0FBTyxDQUFBO1FBRXpDLEtBQU0sTUFBTSxJQUFJLElBQUksS0FBSyxDQUFDLEtBQUssRUFDL0I7WUFDSyxNQUFNLE1BQU0sR0FBRyxFQUFFLENBQUMsT0FBTyxDQUFhLElBQUksQ0FBRSxDQUFBO1lBRTVDLE1BQU0sSUFBSSxHQUFHLGVBQUssS0FBSyxFQUFDLHVCQUF1QjtnQkFDMUMsZUFBSyxHQUFHLEVBQUcsTUFBTSxDQUFDLE1BQU0sRUFBRyxHQUFHLEVBQUMsUUFBUSxHQUFFO2dCQUN6QyxlQUFLLEtBQUssRUFBQyxjQUFjO29CQUNwQjt3QkFDSyxpQkFBSyxNQUFNLENBQUMsU0FBUyxDQUFNLENBQzNCO29CQUNMO3dCQUNLLGlCQUFLLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFNLENBQzFDLENBQ1AsQ0FDTCxDQUFBO1lBRU4sTUFBTSxDQUFDLE1BQU0sQ0FBRyxJQUFJLENBQUUsQ0FBQTtTQUMxQjtRQUVELElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxHQUFHLEVBQUUsQ0FBQTtRQUM3QixJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBRyxrQkFBTSxLQUFLLENBQUMsRUFBRSxDQUFPLENBQUUsQ0FBQTtRQUMvQyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBRyxpQkFBSyxLQUFLLENBQUMsV0FBVyxDQUFNLENBQUUsQ0FBQTtRQUN0RCxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBRyxNQUFNLENBQUUsQ0FBQTtRQUVoQyx5RUFBeUU7UUFDekUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUcsbUJBQU8sSUFBSSxDQUFDLFNBQVMsQ0FBRyxLQUFLLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBRSxDQUFRLENBQUUsQ0FBQTtJQUMvRSxDQUFDO0NBQ0w7QUFFRCxnQ0FBZ0M7QUFDaEMsaUNBQWlDO0FBQ2pDLHdCQUF3QjtBQUN4QiwwQkFBMEI7QUFDMUIsSUFBSTtBQUVKLE1BQU0sQ0FBRyxVQUFVLEVBQUUsQ0FBQyxlQUFlLEVBQUUsTUFBTSxDQUFDLENBQUcsQ0FBQTtBQUNqRCxNQUFNLENBQUcsVUFBVSxFQUFFLENBQUMsU0FBUyxFQUFFLGFBQWEsQ0FBQyxDQUFFLENBQUEifQ==