import { Component } from "../../Base/Component/index.js";
export class Phantom extends Component {
    getHtml() {
        if (this.container == undefined) {
            this.container = document.createElement("div");
            this.container.innerHTML = this.data.content;
        }
        return this.container.childNodes;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9VaS9Db21wb25lbnQvUGhhbnRvbS9pbmRleC50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLCtCQUErQixDQUFBO0FBV3pELE1BQU0sT0FBTyxPQUFRLFNBQVEsU0FBb0I7SUFJNUMsT0FBTztRQUVGLElBQUssSUFBSSxDQUFDLFNBQVMsSUFBSSxTQUFTLEVBQ2hDO1lBQ0ssSUFBSSxDQUFDLFNBQVMsR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFHLEtBQUssQ0FBRSxDQUFBO1lBQ2pELElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFBO1NBQ2hEO1FBRUQsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLFVBQW1DLENBQUE7SUFDOUQsQ0FBQztDQUNMIn0=