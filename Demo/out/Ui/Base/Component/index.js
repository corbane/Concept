import { createNode } from "../../../Data/index.js";
import { xnode } from "../xnode.js";
export class Component {
    constructor(data) {
        this.data = Object.assign(this.defaultData(), createNode(data.type, data.id, data));
    }
    defaultData() {
        return {
            context: "concept-ui",
            type: "component",
            id: undefined,
        };
    }
    getHtml() {
        if (this.container == undefined) {
            this.container = xnode("div", { class: this.data.type });
            this.onCreate();
        }
        return [this.container];
    }
    onCreate() {
    }
    makeHtml() {
        throw new Error("Not implemented");
    }
    makeSvg() {
        throw new Error("Not implemented");
    }
    makeFabric() {
        throw new Error("Not implemented");
    }
    onCreateHtml() {
    }
    onCreateSvg() {
    }
    onCreateFabric() {
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9VaS9CYXNlL0NvbXBvbmVudC9pbmRleC50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0EsT0FBTyxFQUFFLFVBQVUsRUFBRSxNQUFNLHdCQUF3QixDQUFBO0FBQ25ELE9BQU8sRUFBRSxLQUFLLEVBQUUsTUFBTSxhQUFhLENBQUE7QUFZbkMsTUFBTSxPQUFPLFNBQVM7SUFlakIsWUFBYyxJQUFPO1FBRWhCLElBQUksQ0FBQyxJQUFJLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FDcEIsSUFBSSxDQUFDLFdBQVcsRUFBRyxFQUNuQixVQUFVLENBQUcsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBUyxDQUNsRCxDQUFBO0lBQ04sQ0FBQztJQWZELFdBQVc7UUFFTixPQUFPO1lBQ0YsT0FBTyxFQUFFLFlBQVk7WUFDckIsSUFBSSxFQUFLLFdBQVc7WUFDcEIsRUFBRSxFQUFPLFNBQVM7U0FDdEIsQ0FBQTtJQUNOLENBQUM7SUFVRCxPQUFPO1FBRUYsSUFBSyxJQUFJLENBQUMsU0FBUyxJQUFJLFNBQVMsRUFDaEM7WUFDSyxJQUFJLENBQUMsU0FBUyxHQUFHLGVBQUssS0FBSyxFQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxHQUFTLENBQUE7WUFDckQsSUFBSSxDQUFDLFFBQVEsRUFBRyxDQUFBO1NBQ3BCO1FBRUQsT0FBTyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQTtJQUM1QixDQUFDO0lBRUQsUUFBUTtJQUdSLENBQUM7SUFFUyxRQUFRO1FBRWIsTUFBTSxJQUFJLEtBQUssQ0FBRSxpQkFBaUIsQ0FBQyxDQUFBO0lBQ3hDLENBQUM7SUFFUyxPQUFPO1FBRVosTUFBTSxJQUFJLEtBQUssQ0FBRSxpQkFBaUIsQ0FBQyxDQUFBO0lBQ3hDLENBQUM7SUFFUyxVQUFVO1FBRWYsTUFBTSxJQUFJLEtBQUssQ0FBRSxpQkFBaUIsQ0FBQyxDQUFBO0lBQ3hDLENBQUM7SUFFRCxZQUFZO0lBR1osQ0FBQztJQUVELFdBQVc7SUFHWCxDQUFDO0lBRUQsY0FBYztJQUdkLENBQUM7Q0FFTCJ9