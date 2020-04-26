import { xnode } from "../../Base/xnode.js";
import { Container } from "../../Base/Container/index.js";
import { expandable } from "../../Base/expendable.js";
import { cssFloat } from "../../Base/dom.js";
export class ListView extends Container {
    getHtml() {
        if (this.container != undefined)
            return [this.container];
        const slot = this.slot = xnode("div", { class: "list-view-slide" });
        super.getHtml();
        const container = this.container;
        container.append(slot);
        container.classList.add("list-view");
        this.swipeable = expandable(slot, {
            handles: [container],
            minSize: 0,
            maxSize: 0,
            property: this.is_vertical ? "top" : "left",
            direction: this.data.direction,
            unit: "px",
        });
        this.swipeable.activate();
        window.addEventListener("DOMContentLoaded", () => {
            this.swipeable.updateConfig({
                minSize: -this.slideSize(),
            });
        });
        return [this.container];
    }
    onChildrenAdded(elements) {
        this.swipeable.updateConfig({
            minSize: -this.slideSize(),
            property: this.is_vertical ? "top" : "left",
            direction: this.data.direction,
        });
    }
    slideSize() {
        const { slot } = this;
        return cssFloat(slot, this.is_vertical ? "height" : "width");
    }
    swipe(offset, unit) {
        // if ( typeof offset == "string" )
        //      this.swipeable.swipe ( offset )
        // else
        //      this.swipeable.swipe ( offset, unit )
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9VaS9Db21wb25lbnQvTGlzdC9pbmRleC50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0EsT0FBTyxFQUFFLEtBQUssRUFBRSxNQUFNLHFCQUFxQixDQUFBO0FBRTNDLE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSwrQkFBK0IsQ0FBQTtBQUV6RCxPQUFPLEVBQXFCLFVBQVUsRUFBRSxNQUFNLDBCQUEwQixDQUFBO0FBQ3hFLE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSxtQkFBbUIsQ0FBQTtBQVc1QyxNQUFNLE9BQU8sUUFBMEMsU0FBUSxTQUFhO0lBSXZFLE9BQU87UUFFRixJQUFLLElBQUksQ0FBQyxTQUFTLElBQUksU0FBUztZQUMzQixPQUFPLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFBO1FBRTVCLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLEdBQUcsZUFBSyxLQUFLLEVBQUMsaUJBQWlCLEdBQU8sQ0FBQTtRQUU1RCxLQUFLLENBQUMsT0FBTyxFQUFHLENBQUE7UUFFaEIsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQTtRQUVoQyxTQUFTLENBQUMsTUFBTSxDQUFHLElBQUksQ0FBRSxDQUFBO1FBQ3pCLFNBQVMsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFHLFdBQVcsQ0FBRSxDQUFBO1FBRXZDLElBQUksQ0FBQyxTQUFTLEdBQUcsVUFBVSxDQUFHLElBQUksRUFBRTtZQUMvQixPQUFPLEVBQUssQ0FBRSxTQUFTLENBQUU7WUFDekIsT0FBTyxFQUFJLENBQUM7WUFDWixPQUFPLEVBQUksQ0FBQztZQUNaLFFBQVEsRUFBSSxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUEsQ0FBQyxDQUFDLE1BQU07WUFDNUMsU0FBUyxFQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUztZQUMvQixJQUFJLEVBQU8sSUFBSTtTQUVuQixDQUFDLENBQUE7UUFDRixJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsRUFBRyxDQUFBO1FBRTFCLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBRyxrQkFBa0IsRUFBRSxHQUFHLEVBQUU7WUFFOUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxZQUFZLENBQUU7Z0JBQ3hCLE9BQU8sRUFBRSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUc7YUFDL0IsQ0FBQyxDQUFBO1FBQ1AsQ0FBQyxDQUFDLENBQUE7UUFFRixPQUFPLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFBO0lBQzVCLENBQUM7SUFFRCxlQUFlLENBQUcsUUFBc0I7UUFFbkMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxZQUFZLENBQUU7WUFDeEIsT0FBTyxFQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRztZQUM3QixRQUFRLEVBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFBLENBQUMsQ0FBQyxNQUFNO1lBQzNDLFNBQVMsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVM7U0FDbEMsQ0FBQyxDQUFBO0lBQ1AsQ0FBQztJQUVPLFNBQVM7UUFFWixNQUFNLEVBQUUsSUFBSSxFQUFFLEdBQUcsSUFBSSxDQUFBO1FBRXJCLE9BQU8sUUFBUSxDQUFHLElBQUksRUFBRSxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBRSxDQUFBO0lBQ3BFLENBQUM7SUFFRCxLQUFLLENBQUcsTUFBcUIsRUFBRSxJQUFpQjtRQUU1QyxtQ0FBbUM7UUFDbkMsdUNBQXVDO1FBQ3ZDLE9BQU87UUFDUCw2Q0FBNkM7SUFDakQsQ0FBQztDQUNMIn0=