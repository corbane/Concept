
import { Geometry }  from "@lib"
import { get }   from "./db"
import { Shape } from "./shape"

export class Group <$ extends $Shape <$Group> = $Shape <$Group>> extends Shape <$>
{
     readonly children: Shape []

     display_size = 1

     constructor ( options: $ )
     {
          super ( options )
          this.children = []

          const entity = this.config.data

          for ( const child of Object.values ( entity.items ) )
          {
               const a = get ( child )
               this.add ( a )
          }

          this.pack ()
     }

     displaySize ()
     {
          const config = this.config

          var size = (this.display_size + config.sizeOffset) * config.sizeFactor

          if ( size < config.minSize )
               size = config.minSize

          return size || 1
     }

     add ( child: Shape )
     {
          const { group } = this

          this.children.push ( child )

          if ( group )
          {
               group.add ( child.group )
               group.setCoords ()
          }
     }

     pack ()
     {
          const { group, children, config } = this

          const positions = [] as Geometry.Circle []

          for ( const c of children )
          {
               const g = c.group
               const r = (g.width > g.height ? g.width : g.height) / 2
               positions.push ( { x: g.left, y: g.top, r: r + 6 } )
          }

          const size =  Geometry.packEnclose ( positions ) * 2

          for ( var i = 0 ; i < children.length ; i++ )
          {
               const g = children [i].group
               const p = positions [i]

               g.left = p.x
               g.top  = p.y

               group.add ( g )
          }

          this.display_size = size + config.sizeOffset

          this.updateSize ()
     }

}

