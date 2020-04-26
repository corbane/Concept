import { xnode } from "../../Base/xnode.js";
import { Container } from "../../Base/Container/index.js";
//import { expandable, ExpendableElement } from "../../Base/expendable.js"
import { scollable } from "../../Base/scrollable.js";
import { pick, define, inStock, make } from "../../db.js";
const toPosition = {
    lr: "left",
    rl: "right",
    tb: "top",
    bt: "bottom",
};
/**
 *   ```
 *   .panel
 *        .panel-header
 *             .panel-main-buttton
 *             [...]
 *        .panel-content
 *             [...]
 *        .panel-footer
 *             [...]
 *   ```
 */
export class Panel extends Container {
    //protected expandable: ExpendableElement
    defaultData() {
        return Object.assign(Object.assign({}, super.defaultData()), { type: "panel", children: [], direction: "rl" });
    }
    getHtml() {
        if (this.container == undefined) {
            const header = xnode("div", { class: "panel-header" });
            const content = xnode("div", { class: "panel-content" });
            const container = xnode("div", { class: "panel close" },
                header,
                content);
            const data = this.data;
            // if ( data.hasMainButton )
            // {
            //      const btn = <span class="panel-main-button">
            //           <span class="icon">⇕</span>
            //      </span>
            //      this.main_button = btn
            //      header.append ( btn )
            // }
            if (data.header) {
                this.header = inStock(data.header)
                    ? pick(data.header)
                    : make(data.header);
                header.append(...this.header.getHtml());
            }
            if (data.children) {
                //super.append ( ... data.children )
                for (const child of data.children) {
                    this.content = inStock(child)
                        ? pick(child)
                        : make(child);
                    content.append(...this.content.getHtml());
                }
            }
            this.container = container;
            // this.expandable = expandable ( container, {
            //      direction    : data.direction,
            //      near         : 60,
            //      handles      : Array.of ( this.main_button ),
            //      onAfterOpen  : () => {
            //           //content.style.overflow = ""
            //           content.classList.remove ( "hidden" )
            //      },
            //      onBeforeClose: () => {
            //           //content.style.overflow = "hidden"
            //           content.classList.add ( "hidden" )
            //      }
            // })
            // this.expandable.activate ()
            scollable({
                handles: [content],
                direction: "bt"
            })
                .activate();
            this._header = header;
            this._content = content;
            this.container.classList.add(toPosition[data.direction]);
        }
        return [this.container];
    }
    // private onClickTab ()
    // {
    //      this.open ()
    // }
    //isOpen ()
    //{
    //     return this.expandable.isOpen ()
    //}
    //isClose ()
    //{
    //     return this.expandable.isClose ()
    //}
    setOrientation(value) {
        const { data } = this;
        this.container.classList.remove(toPosition[data.direction]);
        this.container.classList.add(toPosition[value]);
        super.setOrientation(value);
        //expandable.updateConfig ({ direction: value })
        data.direction = value;
    }
}
define(Panel, ["panel"]);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9VaS9Db21wb25lbnQvUGFuZWwvaW5kZXgudHN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBLE9BQU8sRUFBRSxLQUFLLEVBQUUsTUFBTSxxQkFBcUIsQ0FBQTtBQUUzQyxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sK0JBQStCLENBQUE7QUFDekQsMEVBQTBFO0FBQzFFLE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSwwQkFBMEIsQ0FBQTtBQUNwRCxPQUFPLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLE1BQU0sYUFBYSxDQUFBO0FBZ0J6RCxNQUFNLFVBQVUsR0FBRztJQUNkLEVBQUUsRUFBRyxNQUFNO0lBQ1gsRUFBRSxFQUFHLE9BQU87SUFDWixFQUFFLEVBQUcsS0FBSztJQUNWLEVBQUUsRUFBRyxRQUFRO0NBQ2pCLENBQUE7QUFFRDs7Ozs7Ozs7Ozs7R0FXRztBQUNILE1BQU0sT0FBTyxLQUFvQyxTQUFRLFNBQWE7SUFRakUseUNBQXlDO0lBRXpDLFdBQVc7UUFFTix1Q0FDUyxLQUFLLENBQUMsV0FBVyxFQUFHLEtBQ3hCLElBQUksRUFBVyxPQUFPLEVBQ3RCLFFBQVEsRUFBTyxFQUFFLEVBQ2pCLFNBQVMsRUFBTSxJQUFJLElBRXZCO0lBQ04sQ0FBQztJQUVELE9BQU87UUFFRixJQUFLLElBQUksQ0FBQyxTQUFTLElBQUksU0FBUyxFQUNoQztZQUNLLE1BQU0sTUFBTSxHQUFNLGVBQUssS0FBSyxFQUFDLGNBQWMsR0FBRyxDQUFBO1lBQzlDLE1BQU0sT0FBTyxHQUFLLGVBQUssS0FBSyxFQUFDLGVBQWUsR0FBRyxDQUFBO1lBQy9DLE1BQU0sU0FBUyxHQUFHLGVBQUssS0FBSyxFQUFDLGFBQWE7Z0JBQ25DLE1BQU07Z0JBQ04sT0FBTyxDQUNSLENBQUE7WUFFTixNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxD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