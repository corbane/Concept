
import { PanelCommands } from "./panel.js"
import { MenuCommands } from "./menu.js"
import { AreaCommands } from "./area.js"
import { Commands as cmd } from "../Ui/Base/command.js"

export type CommandNames = keyof Commands

type Commands = PanelCommands
               & MenuCommands
               & AreaCommands

export const addCommand = cmd.current.add.bind (cmd.current) as
{
     <K extends CommandNames> ( name: K, callback: Commands [K] ): void
     ( name: string, callback: ( ...args: any ) => any ): void
}

export const runCommand = cmd.current.run.bind (cmd.current) as
{
     <K extends CommandNames> ( name: K, ... args: Parameters <Commands [K]> ): void
     ( name: string, ... args: any ): void
}

export const hasCommand = cmd.current.has.bind (cmd.current) as
{
     ( key: CommandNames ): boolean
     ( key: string ): boolean
}

export const onCommand = cmd.current.on.bind (cmd.current) as
{
     ( name: CommandNames, callback: () => void ): void
     ( name: string, callback: () => void ): void
}

export const removeCommand = cmd.current.remove.bind (cmd.current) as
{
     ( name: CommandNames ): void
     ( name: string ): void
}
