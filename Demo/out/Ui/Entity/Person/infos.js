import { xnode, Component, define } from "../../index.js";
export class PersonVieweer extends Component {
    display(person) {
        const card = xnode("div", { class: "w3-card-4 person-card" },
            xnode("img", { src: person.avatar, alt: "Avatar" }),
            xnode("div", { class: "w3-container" },
                xnode("h4", null,
                    xnode("b", null, person.firstName)),
                xnode("label", null,
                    xnode("b", null, person.isCaptain ? "Expert" : null))));
        this.container.innerHTML = "";
        this.container.append(card);
    }
}
define(PersonVieweer, {
    context: "concept-ui",
    type: "person-viewer",
    id: undefined,
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5mb3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9VaS9FbnRpdHkvUGVyc29uL2luZm9zLnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDQSxPQUFPLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxNQUFNLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQTtBQVl6RCxNQUFNLE9BQU8sYUFBYyxTQUFRLFNBQXlCO0lBRXZELE9BQU8sQ0FBRyxNQUFlO1FBRXBCLE1BQU0sSUFBSSxHQUFHLGVBQUssS0FBSyxFQUFDLHVCQUF1QjtZQUMxQyxlQUFLLEdBQUcsRUFBRyxNQUFNLENBQUMsTUFBTSxFQUFHLEdBQUcsRUFBQyxRQUFRLEdBQUU7WUFDekMsZUFBSyxLQUFLLEVBQUMsY0FBYztnQkFDcEI7b0JBQ0ssaUJBQUssTUFBTSxDQUFDLFNBQVMsQ0FBTSxDQUMzQjtnQkFDTDtvQkFDSyxpQkFBSyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBTSxDQUMxQyxDQUNQLENBQ0wsQ0FBQTtRQUdOLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxHQUFHLEVBQUUsQ0FBQTtRQUM3QixJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBRyxJQUFJLENBQUUsQ0FBQTtJQUNuQyxDQUFDO0NBQ0w7QUFFRCxNQUFNLENBQUcsYUFBYSxFQUFFO0lBQ25CLE9BQU8sRUFBRSxZQUFZO0lBQ3JCLElBQUksRUFBSyxlQUFlO0lBQ3hCLEVBQUUsRUFBTyxTQUFTO0NBQ3RCLENBQUMsQ0FBQSJ9