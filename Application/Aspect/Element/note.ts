
import { Shape } from "./shape.js"

export class Note extends Shape
{
     init ()
     {
          //super.init ()

          const { group } = this

          const text = new fabric.Textbox ( (this.config.data as any).text, {
               fontSize: 12,
               originX : "center",
               originY : "center",
               left    : group.left,
               top     : group.top,
               selectable: true,
               editable: true,
          })

          const text_onInput = text.onInput.bind (text)

          text.onInput = ( event ) =>
          {
               text_onInput ( event )
               group.set ({
                    width: text.width,
                    height: text.height
               })
               group.setCoords ()
          }

          group.addWithUpdate ( text ).setCoords ()
     }
}
