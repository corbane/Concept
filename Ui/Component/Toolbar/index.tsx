
import { ListView } from "../List/index.js"
import { define } from "../../db.js"

type Direction = "lr" | "rl" | "tb" | "bt"

type Units = "px" | "%"

declare global
{
     export interface $Toolbar extends $Extends <$ListView> // $Container
     {
          type     : "toolbar"
          title    : string
          buttons  : $Button []
     }
}

const toFlexDirection = {
     lr: "row"            as "row",
     rl: "row-reverse"    as "row-reverse",
     tb: "column"         as "column",
     bt: "column-reverse" as "column-reverse",
}

const toReverse = {
     lr: "rl" as "rl",
     rl: "lr" as "lr",
     tb: "bt" as "bt",
     bt: "tb" as "tb",
}

/**
 *   ```pug
 *   .toolbar
 *        .toolbar-backgroung
 *        .toolbar-slide
 *             [...]
 *   ```
 */
export class Toolbar extends ListView <$Toolbar>
{
     tabs      : JSX.Element []
     background: JSX.Element

     defaultConfig (): $Toolbar
     {
          return {
               ... super.defaultData (),
               type     : "toolbar",
               title    : "Title ...",
               direction: "lr",
               //reverse  : false,
               buttons: []
          }
     }

     /** @override */
     getHtml ()
     {
          if ( this.container != undefined )
               return [this.container]

          super.getHtml ()

          if ( this.data.buttons )
               this.append ( ... this.data.buttons )

          return [this.container]
     }
}

define ( Toolbar, ["toolbar"] )
