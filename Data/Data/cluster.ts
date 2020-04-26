
//   BUBBLE
//
//   Une bulle (Bubble) est l’élément graphique le plus générique après les formes
//   (Shape). Il représente des concepts, des idées, des groupes de personnes, des
//   ensembles de ressources, une organisation, une asso et tous éléments devants
//   être regroupés. C’est donc un groupement de formes.



// export interface $Cluster <$Child extends $Node = $Node> extends $Node
// {
//      children?: $Child []
// }

/*export class Cluster <
     Data  extends $Cluster = any,
     Child extends Node = Node
>
extends Node <Data>
{
     children = {} as Record <string, Child>

     includes ( ... elements: Child [] )
     {
          // link ( element, "member of", this )

          if ( arguments.length == 0 )
               return Object.values ( this.children )

          for ( const child of elements )
          {
               if ( this.children [child.id] == undefined )
                    this.children [child.id] = child
          }

          return elements
     }

     excludes ( ... elements: Child [] )
     {
          for ( const child of elements )
          {
               if ( this.children [ child.id ] )
               {
                    //m_group.removeWithUpdate( shape._fab )
                    //delete m_elements [ shape._key ]
               }
          }
     }
}*/
