
import { $Button } from "../Ui/Component/Button/index.js"
import { CommandNames, runCommand } from "./command.js"

interface ButtonOptions extends $Button
{
     command: CommandNames
}

interface ButtonDefinition extends ButtonOptions
{
}

type ButtunNames = CommandNames

const db = {} as Record <string, ButtonDefinition>

export function addButton ( name: ButtunNames, definition: ButtonOptions )
{
     Object.assign ( definition, {
          id: name,
          callback: () => { runCommand ( definition.command ) },
     } as ButtonDefinition )

     if ( name in db )
          throw "The button definition already exists"

     db [name] = definition as ButtonDefinition
}

export function getButton ( name: ButtunNames )
{
     const def = db [name]

     if ( def == undefined )
          return {}

     return {
          ... def
     }
}
