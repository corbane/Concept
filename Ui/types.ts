
declare global
{
     export type $AnyComponents
               = $Button
               | $SideMenu
               | $Slideshow
               | $Toolbar
               | $Panel
               //| $Block
               //| $Slide
               | $SkillViewer
               | $PersonViewer


     type $Extends <$> = Omit <$, "type" | "id"> & {
          type: string
          id  : string
     }

}


export type ComponentTypes = $AnyComponents ["type"]
