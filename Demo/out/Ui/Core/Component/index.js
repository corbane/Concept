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
            // const comp = get ( this.data )
            this.container = xnode("div", { class: this.data.type });
            this.onCreate();
        }
        return [this.container];
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
    onCreate() {
    }
    onCreateHtml() {
    }
    onCreateSvg() {
    }
    onCreateFabric() {
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9VaS9Db3JlL0NvbXBvbmVudC9pbmRleC50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0EsT0FBTyxFQUFFLFVBQVUsRUFBRSxNQUFNLHdCQUF3QixDQUFBO0FBQ25ELE9BQU8sRUFBRSxLQUFLLEVBQUUsTUFBTSxhQUFhLENBQUE7QUFZbkMsTUFBTSxPQUFPLFNBQVM7SUFlakIsWUFBYyxJQUFPO1FBRWhCLElBQUksQ0FBQyxJQUFJLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FDcEIsSUFBSSxDQUFDLFdBQVcsRUFBRyxFQUNuQixVQUFVLENBQUcsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBUyxDQUNsRCxDQUFBO0lBQ04sQ0FBQztJQWZELFdBQVc7UUFFTixPQUFPO1lBQ0YsT0FBTyxFQUFFLFlBQVk7WUFDckIsSUFBSSxFQUFLLFdBQVc7WUFDcEIsRUFBRSxFQUFPLFNBQVM7U0FDdEIsQ0FBQTtJQUNOLENBQUM7SUFVRCxPQUFPO1FBRUYsSUFBSyxJQUFJLENBQUMsU0FBUyxJQUFJLFNBQVMsRUFDaEM7WUFDSyxpQ0FBaUM7WUFDakMsSUFBSSxDQUFDLFNBQVMsR0FBRyxlQUFLLEtBQUssRUFBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksR0FBUyxDQUFBO1lBQ3JELElBQUksQ0FBQyxRQUFRLEVBQUcsQ0FBQTtTQUNwQjtRQUVELE9BQU8sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUE7SUFDNUIsQ0FBQztJQUVTLFFBQVE7UUFFYixNQUFNLElBQUksS0FBSyxDQUFFLGlCQUFpQixDQUFDLENBQUE7SUFDeEMsQ0FBQztJQUVTLE9BQU87UUFFWixNQUFNLElBQUksS0FBSyxDQUFFLGlCQUFpQixDQUFDLENBQUE7SUFDeEMsQ0FBQztJQUVTLFVBQVU7UUFFZixNQUFNLElBQUksS0FBSyxDQUFFLGlCQUFpQixDQUFDLENBQUE7SUFDeEMsQ0FBQztJQUVELFFBQVE7SUFHUixDQUFDO0lBRUQsWUFBWTtJQUdaLENBQUM7SUFFRCxXQUFXO0lBR1gsQ0FBQztJQUVELGNBQWM7SUFHZCxDQUFDO0NBRUwifQ==