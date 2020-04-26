import { Component } from "../../Base/Component/index.js";
import { xnode } from "../../Base/xnode.js";
import { Commands } from "../../Base/command.js";
import { define } from "../../db.js";
export class Button extends Component {
    getHtml() {
        if (this.container == undefined) {
            const data = this.data;
            const node = xnode("div", { class: "button" },
                data.icon ? xnode("span", { class: "icon" }, data.icon) : null,
                data.text ? xnode("span", { class: "text" }, data.text) : null);
            if (this.data.callback != undefined || this.data.command != undefined)
                node.addEventListener("click", this.onTouch.bind(this));
            this.container = node;
        }
        return [this.container];
    }
    onTouch() {
        if (this.data.callback && this.data.callback() !== true)
            return;
        if (this.data.command)
            Commands.current.run(this.data.command);
    }
    onHover() {
    }
}
define(Button, ["button"]);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHRtbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL1VpL0NvbXBvbmVudC9CdXR0b24vaHRtbC50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0EsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLCtCQUErQixDQUFBO0FBQ3pELE9BQU8sRUFBRSxLQUFLLEVBQUUsTUFBVSxxQkFBcUIsQ0FBQTtBQUMvQyxPQUFPLEVBQUUsUUFBUSxFQUFFLE1BQU8sdUJBQXVCLENBQUE7QUFDakQsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFTLGFBQWEsQ0FBQTtBQUV2QyxNQUFNLE9BQU8sTUFBTyxTQUFRLFNBQW1CO0lBRTFDLE9BQU87UUFFRixJQUFLLElBQUksQ0FBQyxTQUFTLElBQUksU0FBUyxFQUNoQztZQUNLLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUE7WUFFdEIsTUFBTSxJQUFJLEdBQUcsZUFBSyxLQUFLLEVBQUMsUUFBUTtnQkFDekIsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsZ0JBQU0sS0FBSyxFQUFDLE1BQU0sSUFBRyxJQUFJLENBQUMsSUFBSSxDQUFTLENBQUMsQ0FBQyxDQUFDLElBQUk7Z0JBQzFELElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLGdCQUFNLEtBQUssRUFBQyxNQUFNLElBQUcsSUFBSSxDQUFDLElBQUksQ0FBUyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQzNELENBQUE7WUFFTixJQUFLLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxJQUFJLFNBQVMsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sSUFBSSxTQUFTO2dCQUNqRSxJQUFJLENBQUMsZ0JBQWdCLENBQUcsT0FBTyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFFLElBQUksQ0FBQyxDQUFFLENBQUE7WUFFaEUsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUE7U0FDekI7UUFFRCxPQUFPLENBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBb0IsQ0FBQTtJQUNoRCxDQUFDO0lBRUQsT0FBTztRQUVGLElBQUssSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUcsS0FBSyxJQUFJO1lBQ3BELE9BQU07UUFFWCxJQUFLLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTztZQUNqQixRQUFRLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBRSxDQUFBO0lBQ3BELENBQUM7SUFFUyxPQUFPO0lBR2pCLENBQUM7Q0FDTDtBQUdELE1BQU0sQ0FBRyxNQUFNLEVBQUUsQ0FBQyxRQUFRLENBQUMsQ0FBRSxDQUFBIn0=