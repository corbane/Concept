import { pick, inStock, make } from "../../db.js";
import { Component } from "../Component/index.js";
import { Phantom } from "../../Component/Phantom/index.js";
const toPosition = {
    lr: "left",
    rl: "right",
    tb: "top",
    bt: "bottom",
};
export class Container extends Component {
    constructor(data) {
        super(data);
        this.children = {};
        const children = this.data.children;
        if (children) {
            for (const child of children) {
                if (!inStock(child))
                    make(child);
            }
        }
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
        if (this.container == undefined) {
            super.getHtml();
            const container = this.container;
            const data = this.data;
            const children = this.children;
            if (data.children) {
                for (const child of data.children) {
                    const o = pick(child);
                    container.append(...o.getHtml());
                    children[o.data.id] = o;
                }
            }
            container.classList.add(toPosition[this.data.direction]);
            this.onCreate();
        }
        return [this.container];
    }
    onCreate() {
    }
    append(...elements) {
        const def = this.data.children;
        const new_child = [];
        if (this.container == undefined)
            this.getHtml();
        const container = this.container;
        const children = this.children;
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
            container.append(...e.getHtml());
        }
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
        container.classList.remove(toPosition[config.direction]);
        container.classList.add(toPosition[value]);
        config.direction = value;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9VaS9Db3JlL0NvbnRhaW5lci9pbmRleC50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0EsT0FBTyxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLE1BQU0sYUFBYSxDQUFBO0FBQ2pELE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSx1QkFBdUIsQ0FBQTtBQUNqRCxPQUFPLEVBQUUsT0FBTyxFQUFFLE1BQU0sa0NBQWtDLENBQUE7QUFjMUQsTUFBTSxVQUFVLEdBQUc7SUFDZCxFQUFFLEVBQUcsTUFBTTtJQUNYLEVBQUUsRUFBRyxPQUFPO0lBQ1osRUFBRSxFQUFHLEtBQUs7SUFDVixFQUFFLEVBQUcsUUFBUTtDQUNqQixDQUFBO0FBRUQsTUFBTSxPQUFPLFNBQThDLFNBQVEsU0FBYTtJQWMzRSxZQUFjLElBQU87UUFFaEIsS0FBSyxDQUFHLElBQUksQ0FBRSxDQUFBO1FBZG5CLGFBQVEsR0FBRyxFQUFnQyxDQUFBO1FBZ0J0QyxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQTtRQUVuQyxJQUFLLFFBQVEsRUFDYjtZQUNLLEtBQU0sTUFBTSxLQUFLLElBQUksUUFBUSxFQUM3QjtnQkFDSyxJQUFLLENBQUUsT0FBTyxDQUFHLEtBQUssQ0FBRTtvQkFDbkIsSUFBSSxDQUFHLEtBQUssQ0FBRSxDQUFBO2FBQ3ZCO1NBQ0w7SUFDTixDQUFDO0lBeEJELFdBQVc7UUFFTixPQUFPO1lBQ0YsT0FBTyxFQUFFLFlBQVk7WUFDckIsSUFBSSxFQUFPLFdBQVc7WUFDdEIsRUFBRSxFQUFTLFNBQVM7WUFDcEIsU0FBUyxFQUFFLElBQUk7U0FDbkIsQ0FBQTtJQUNOLENBQUM7SUFrQkQsT0FBTztRQUVGLElBQUssSUFBSSxDQUFDLFNBQVMsSUFBSSxTQUFTLEVBQ2hDO1lBQ0ssS0FBSyxDQUFDLE9BQU8sRUFBRyxDQUFBO1lBRWhC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