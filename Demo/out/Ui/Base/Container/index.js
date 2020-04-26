import { pick, inStock, make } from "../../db.js";
import { Component } from "../Component/index.js";
import { Phantom } from "../../Component/Phantom/index.js";
export class Container extends Component {
    constructor(data) {
        super(data);
        this.children = {};
        data = this.data;
        const children = data.children;
        if (children) {
            for (const child of children) {
                if (!inStock(child))
                    make(child);
            }
        }
        this.is_vertical = data.direction == "bt" || data.direction == "tb";
    }
    defaultData() {
        return {
            context: "concept-ui",
            type: "component",
            id: undefined,
            direction: "lr",
        };
    }
    getHtml() {
        if (this.container != undefined)
            return [this.container];
        const elements = super.getHtml();
        const container = this.container;
        const data = this.data;
        const children = this.children;
        const und = undefined;
        if (this.is_vertical)
            container.classList.add("vertical");
        else
            container.classList.remove("vertical");
        if (this.slot == undefined)
            this.slot = container;
        const slot = this.slot;
        if (data.children) {
            const new_children = [];
            for (const child of data.children) {
                const o = pick(child);
                slot.append(...o.getHtml());
                children[o.data.id] = o;
            }
            this.onChildrenAdded(new_children);
        }
        return elements;
    }
    onChildrenAdded(components) {
    }
    append(...elements) {
        if (this.container == undefined)
            this.getHtml();
        const slot = this.slot;
        const children = this.children;
        const new_child = [];
        for (var e of elements) {
            if (typeof e == "string") {
                e = new Phantom({
                    context: "concept-ui",
                    type: "phantom",
                    id: undefined,
                    content: e
                });
            }
            else if (e instanceof Element) {
                const UI_COMPONENT = Symbol.for("UI_COMPONENT");
                e = e[UI_COMPONENT] != undefined
                    ? e[UI_COMPONENT]
                    : new Phantom({
                        context: "concept-ui",
                        type: "phantom",
                        id: undefined,
                        content: e.outerHTML
                    });
            }
            else if (!(e instanceof Component)) {
                e = inStock(e)
                    ? pick(e)
                    : make(e);
            }
            children[e.data.id] = e;
            slot.append(...e.getHtml());
            new_child.push(e);
        }
        if (new_child.length > 0)
            this.onChildrenAdded(new_child);
    }
    remove(...elements) {
    }
    clear() {
        this.children = {};
        if (this.container)
            this.container.innerHTML = "";
    }
    getOrientation() {
        return this.data.direction;
    }
    setOrientation(value) {
        const config = this.data;
        if (value == config.direction)
            return;
        const container = this.container;
        if (this.is_vertical)
            container.classList.add("vertical");
        else
            container.classList.remove("vertical");
        config.direction = value;
        this.is_vertical = value == "bt" || value == "tb";
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9VaS9CYXNlL0NvbnRhaW5lci9pbmRleC50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0EsT0FBTyxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLE1BQU0sYUFBYSxDQUFBO0FBQ2pELE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSx1QkFBdUIsQ0FBQTtBQUNqRCxPQUFPLEVBQUUsT0FBTyxFQUFFLE1BQU0sa0NBQWtDLENBQUE7QUFjMUQsTUFBTSxPQUFPLFNBQThDLFNBQVEsU0FBYTtJQWlCM0UsWUFBYyxJQUFPO1FBRWhCLEtBQUssQ0FBRyxJQUFJLENBQUUsQ0FBQTtRQWpCbkIsYUFBUSxHQUFHLEVBQWdDLENBQUE7UUFtQnRDLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFBO1FBQ2hCLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUE7UUFFOUIsSUFBSyxRQUFRLEVBQ2I7WUFDSyxLQUFNLE1BQU0sS0FBSyxJQUFJLFFBQVEsRUFDN0I7Z0JBQ0ssSUFBSyxDQUFFLE9BQU8sQ0FBRyxLQUFLLENBQUU7b0JBQ25CLElBQUksQ0FBRyxLQUFLLENBQUUsQ0FBQTthQUN2QjtTQUNMO1FBRUQsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUMsU0FBUyxJQUFJLElBQUksSUFBSSxJQUFJLENBQUMsU0FBUyxJQUFJLElBQUksQ0FBQTtJQUN4RSxDQUFDO0lBM0JELFdBQVc7UUFFTixPQUFPO1lBQ0YsT0FBTyxFQUFFLFlBQVk7WUFDckIsSUFBSSxFQUFPLFdBQVc7WUFDdEIsRUFBRSxFQUFTLFNBQVM7WUFDcEIsU0FBUyxFQUFFLElBQUk7U0FDbkIsQ0FBQTtJQUNOLENBQUM7SUFxQkQsT0FBTztRQUVGLElBQUssSUFBSSxDQUFDLFNBQVMsSUFBSSxTQUFTO1lBQzNCLE9BQU8sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENB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