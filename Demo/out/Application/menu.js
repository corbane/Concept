import * as ui from "../Ui/index.js";
//export const menu = createMenu ()
//document.body.append ( ... menu.elements () )
export const menu = ui.make({
    context: "concept-ui",
    type: "side-menu",
    id: "menu",
    hasMainButton: true,
    direction: "lr"
});
document.body.append(...menu.getHtml());
//addCommand ( "open-menu", () => { menu.open () })
//addCommand ( "close-menu", () => { menu.close () })
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVudS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL0FwcGxpY2F0aW9uL21lbnUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBRUEsT0FBTyxLQUFLLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQTtBQUtwQyxtQ0FBbUM7QUFFbkMsK0NBQStDO0FBRS9DLE1BQU0sQ0FBQyxNQUFNLElBQUksR0FBRyxFQUFFLENBQUMsSUFBSSxDQUF3QjtJQUM5QyxPQUFPLEVBQVEsWUFBWTtJQUMzQixJQUFJLEVBQVcsV0FBVztJQUMxQixFQUFFLEVBQWEsTUFBTTtJQUNyQixhQUFhLEVBQUUsSUFBSTtJQUNuQixTQUFTLEVBQU0sSUFBSTtDQUN2QixDQUFDLENBQUE7QUFDRixRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBRyxHQUFJLElBQUksQ0FBQyxPQUFPLEVBQUcsQ0FBRSxDQUFBO0FBTzVDLG1EQUFtRDtBQUNuRCxxREFBcUQifQ==