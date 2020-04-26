import { ListView } from "../List/index.js";
import { define } from "../../db.js";
const toFlexDirection = {
    lr: "row",
    rl: "row-reverse",
    tb: "column",
    bt: "column-reverse",
};
const toReverse = {
    lr: "rl",
    rl: "lr",
    tb: "bt",
    bt: "tb",
};
/**
 *   ```pug
 *   .toolbar
 *        .toolbar-backgroung
 *        .toolbar-slide
 *             [...]
 *   ```
 */
export class Toolbar extends ListView {
    defaultConfig() {
        return Object.assign({}, super.defaultData(), { type: "toolbar", title: "Title ...", direction: "lr", 
            //reverse  : false,
            buttons: [] });
    }
    getHtml() {
        if (this.container != undefined)
            return [this.container];
        super.getHtml();
        if (this.data.buttons)
            this.append(...this.data.buttons);
        return [this.container];
    }
}
define(Toolbar, ["toolbar"]);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9VaS9Db21wb25lbnQvVG9vbGJhci9pbmRleC50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0EsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLGtCQUFrQixDQUFBO0FBQzNDLE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSxhQUFhLENBQUE7QUFnQnBDLE1BQU0sZUFBZSxHQUFHO0lBQ25CLEVBQUUsRUFBRSxLQUF5QjtJQUM3QixFQUFFLEVBQUUsYUFBaUM7SUFDckMsRUFBRSxFQUFFLFFBQTRCO0lBQ2hDLEVBQUUsRUFBRSxnQkFBb0M7Q0FDNUMsQ0FBQTtBQUVELE1BQU0sU0FBUyxHQUFHO0lBQ2IsRUFBRSxFQUFFLElBQVk7SUFDaEIsRUFBRSxFQUFFLElBQVk7SUFDaEIsRUFBRSxFQUFFLElBQVk7SUFDaEIsRUFBRSxFQUFFLElBQVk7Q0FDcEIsQ0FBQTtBQUVEOzs7Ozs7O0dBT0c7QUFDSCxNQUFNLE9BQU8sT0FBUSxTQUFRLFFBQW1CO0lBSzNDLGFBQWE7UUFFUix5QkFDUyxLQUFLLENBQUMsV0FBVyxFQUFHLElBQ3hCLElBQUksRUFBTyxTQUFTLEVBQ3BCLEtBQUssRUFBTSxXQUFXLEVBQ3RCLFNBQVMsRUFBRSxJQUFJO1lBQ2YsbUJBQW1CO1lBQ25CLE9BQU8sRUFBRSxFQUFFLElBQ2Y7SUFDTixDQUFDO0lBRUQsT0FBTztRQUVGLElBQUssSUFBSSxDQUFDLFNBQVMsSUFBSSxTQUFTO1lBQzNCLE9BQU8sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUE7UUFFNUIsS0FBSyxDQUFDLE9BQU8sRUFBRyxDQUFBO1FBRWhCLElBQUssSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPO1lBQ2pCLElBQUksQ0FBQyxNQUFNLENBQUcsR0FBSSxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBRSxDQUFBO1FBRTFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUE7SUFDNUIsQ0FBQztDQUNMO0FBRUQsTUFBTSxDQUFHLE9BQU8sRUFBRSxDQUFDLFNBQVMsQ0FBQyxDQUFFLENBQUEifQ==