
declare global
{
     export type $AnyComponents
               = $Button
               //| $Panel
               | $SideMenu
               | $Block
               | $Phantom
               | $Slide
               | $Slideshow
               | $Toolbar

               | $SkillViewer
               | $PersonViewer


     type $Extends <$> = Omit <$, "type" | "id"> & {
          type: string
          id  : string
     }

}


export type ComponentTypes = $AnyComponents ["type"]
