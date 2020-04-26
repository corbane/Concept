export { defineAspect, getAspect, setAspect } from "./db.js";
export { Geometry } from "./Geometry/geometry.js";
export { Shape } from "./Element/shape.js";
export { Note } from "./Element/note.js";
export { Badge } from "./Element/badge.js";
export { Container } from "./Element/group.js";
import { getData } from "../Data/db.js";
import { getAspect, defineAspect, setAspect } from "./db.js";
import { Shape } from "./Element/shape.js";
import { Container } from "./Element/group.js";
import { Badge } from "./Element/badge.js";
import { runCommand } from "../command.js";
defineAspect(Shape, "person" /* , { onCreate: () => ..., onTouch: () => ... } */);
defineAspect(Container, "skill");
defineAspect(Badge, "badge");
setAspect({
    type: "person",
    id: undefined,
    data: undefined,
    shape: "circle",
    x: 0,
    y: 0,
    minSize: 30,
    sizeFactor: 1,
    sizeOffset: 0,
    borderColor: "#00c0aa",
    borderWidth: 4,
    backgroundColor: "transparent",
    backgroundImage: undefined,
    backgroundRepeat: false,
    onCreate: (person, aspect) => {
        aspect.setBackground({
            backgroundImage: person.avatar,
            shape: person.isCaptain ? "square" : "circle",
        });
    },
    onDelete: undefined,
    onTouch: undefined,
});
setAspect({
    type: "skill",
    id: undefined,
    data: undefined,
    shape: "circle",
    x: 0,
    y: 0,
    borderColor: "#f1bc31",
    borderWidth: 8,
    backgroundColor: "#FFFFFF",
    backgroundImage: undefined,
    backgroundRepeat: false,
    minSize: 50,
    sizeOffset: 10,
    sizeFactor: 1,
    onCreate(skill, aspect) {
        const data = getData({
            type: "badge",
            id: skill.icon,
        });
        const badge = getAspect(data);
        //badge.init ()
        badge.attach(aspect);
    },
    onTouch(shape) {
        const skill = getData({
            type: shape.config.type,
            id: shape.config.id
        });
        runCommand("open-infos-panel", skill);
    },
    onDelete: undefined
});
setAspect({
    type: "badge",
    id: undefined,
    data: undefined,
    x: 0,
    y: 0,
    minSize: 1,
    sizeFactor: 1,
    sizeOffset: 0,
    shape: "circle",
    borderColor: "gray",
    borderWidth: 0,
    backgroundColor: "transparent",
    backgroundImage: undefined,
    backgroundRepeat: false,
    onCreate: undefined,
    onDelete: undefined,
    onTouch: undefined,
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9BcHBsaWNhdGlvbi9Bc3BlY3QvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBRUEsT0FBTyxFQUFFLFlBQVksRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFFLE1BQU0sU0FBUyxDQUFBO0FBRTVELE9BQU8sRUFBRSxRQUFRLEVBQWEsTUFBTSx3QkFBd0IsQ0FBQTtBQUM1RCxPQUFPLEVBQUUsS0FBSyxFQUF3QixNQUFNLG9CQUFvQixDQUFBO0FBQ2hFLE9BQU8sRUFBRSxJQUFJLEVBQUUsTUFBVyxtQkFBbUIsQ0FBQTtBQUM3QyxPQUFPLEVBQUUsS0FBSyxFQUFFLE1BQVUsb0JBQW9CLENBQUE7QUFDOUMsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLG9CQUFvQixDQUFBO0FBRzlDLE9BQU8sRUFBRSxPQUFPLEVBQUMsTUFBTSxlQUFlLENBQUE7QUFDdEMsT0FBTyxFQUFFLFNBQVMsRUFBRSxZQUFZLEVBQUUsU0FBUyxFQUFFLE1BQU0sU0FBUyxDQUFBO0FBQzVELE9BQU8sRUFBRSxLQUFLLEVBQUUsTUFBTSxvQkFBb0IsQ0FBQTtBQUUxQyxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sb0JBQW9CLENBQUE7QUFDOUMsT0FBTyxFQUFFLEtBQUssRUFBRSxNQUFVLG9CQUFvQixDQUFBO0FBRTlDLE9BQU8sRUFBRSxVQUFVLEVBQUUsTUFBTSxlQUFlLENBQUE7QUFFMUMsWUFBWSxDQUFHLEtBQUssRUFBTSxRQUFRLENBQUMsbURBQW1ELENBQUUsQ0FBQTtBQUN4RixZQUFZLENBQUcsU0FBUyxFQUFFLE9BQU8sQ0FBRSxDQUFBO0FBQ25DLFlBQVksQ0FBRyxLQUFLLEVBQU0sT0FBTyxDQUFFLENBQUE7QUFFbkMsU0FBUyxDQUFXO0lBQ2YsSUFBSSxFQUFLLFFBQVE7SUFDakIsRUFBRSxFQUFPLFNBQVM7SUFFbEIsSUFBSSxFQUFLLFNBQVM7SUFFbEIsS0FBSyxFQUFJ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