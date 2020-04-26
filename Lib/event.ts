

export interface IEvent <F extends ( ...args: any[] ) => void = () => void>
{
    ( callback: F ): void
    enable (): this
    disable (): this
    dispatch ( ...args: Parameters <F> ): this
    remove ( callback: F ): this
    count (): number
}

export function create <F extends (( ...args: any[] ) => void) = (() => void)> (): IEvent <F>
{
    const register = [] as F[]
    var   enabled  = true

    const self = function ( callback: F )
    {
        register.push ( callback ) - 1

        return self
    }

    self.count = () =>
    {
        return register.length
    }

    self.disable = () =>
    {
        enabled = false

        return self
    }

    self.enable = () =>
    {
        enabled = true

        return self
    }

    self.append = ( callback: F ) =>
    {
        self ( callback )

        return self
    }

    self.remove = ( callback: F ) =>
    {
        const index = register.indexOf ( callback )

        if ( index != -1 )
            register.splice ( index, 1 )

        return self
    }

    self.removeAll = () =>
    {
        register.splice (0)

        return self
    }

    self.dispatch = ( ...args: Parameters <F> ) =>
    {
        if ( enabled )
        {
            for( var fn of register )
                fn ( ... args )
        }

        return self
    }

    return self
}

