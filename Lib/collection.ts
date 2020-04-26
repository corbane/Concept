import { create as createEvent, IEvent } from "./event.js"


type TCollectionKey = string | number

interface ICollectionItem
{
    readonly key: TCollectionKey
}

interface ICollection <T extends ICollectionItem>
{
    onItemsAdded: IEvent <( items: T [] ) => void>
    onItemsRemoved: IEvent <( items: T [] ) => void>
    count (): number
    add ( ... items: T [] ): this
    has ( item: TCollectionKey | T ): boolean
    get ( key: TCollectionKey ): T | undefined
    remove ( ... items: [TCollectionKey | T] ): this
    clear ( ): this
    [Symbol.iterator] (): Iterator <T>
}

//export function create <T extends ICollectionItem> (): ICollection <T>

export function create <T extends ICollectionItem> ()
{
    const self     = {} as ICollection <T>
    const registry = {} as Record <TCollectionKey, T>
    var   length   = 0

    const onItemsAdded   = self.onItemsAdded   = createEvent <( items: T [] ) => void> ()
    const onItemsRemoved = self.onItemsRemoved = createEvent <( items: T [] ) => void> ()

    self.count = () => length

    self.add = ( ... args ) =>
    {
        const added = [] as T []

        for ( const arg of args )
        {
            const key = arg.key

            if ( typeof key != "string" || key.length == 0 )
                throw "ICollection; Invalid item key: " + arg.toString ()

            if ( self.has ( key ) )
                continue

            registry[ arg.key ] = arg
            length++
            added.push ( arg )
        }

        onItemsAdded.dispatch ( added )
        return self
    }


    self.has = ( item ) =>
    {
        const key = typeof item == "string" || typeof item == "number" ? item : item.key
        return registry[ key ] != undefined
    }

    self.get = ( key ) =>
    {
        if ( typeof key == "number" )
        {
            key = Object.keys (registry) [key]
        }

        const item = registry[ key ]

        if ( item )
            return item

        return undefined
    }

    self.remove = ( ... items ) =>
    {
        const removed = [] as T []

        for( const item of items )
        {
            const key = typeof item == "string" || typeof item == "number" ? item : item.key

            if ( self.has ( key ) )
            {
                removed.push ( registry [ key ] )
                delete registry[ key ]
                length--
            }
        }

        onItemsRemoved.dispatch ( removed )
        return self
    }

    self.clear = () =>
    {
        const removed = Object.values ( registry )

        for ( const key in registry )
            delete registry[ key ]
        length = 0

        onItemsRemoved.dispatch ( removed )
        return self
    }

    self[Symbol.iterator] = function *(): Iterator <T>
    {
        for ( const key in registry )
            yield registry[ key ]
    }

    return self
}

