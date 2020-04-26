

export type RadialOption = {
    r        : number,
    count    : number,
    padding? : number,
    rotation?: number,
}

export type RadialDefinition = Required <RadialOption> & {
    cx    : number,
    cy    : number,
    width : number,
    height: number,
    points: Part [],
}

type Part = {
    x : number
    y : number
    a : number
    a1: number
    a2: number
    chord?: {
        x1    : number
        y1    : number
        x2    : number
        y2    : number
        length: number
    }
}

export function getRadialDistribution ( options: RadialOption )
{
    const { PI, cos, sin } = Math

    const r        = options.r        || 30
    const count    = options.count    || 10
    const rotation = options.rotation || 0

    const points = [] as Part []

    const a     = 2 * PI / count
    const chord = 2 * r * sin ( a * 0.5 )
    const size  = r * 4 + chord
    const c     = size / 2

    for ( var i = 0; i < count; ++i )
    {
        const start  = a * i + rotation
        const middle = start + a * 0.5
        const end    = start + a

        points.push ({
            a1   : start,
            a    : middle,
            a2   : end,
            x    : cos (middle) * r + c,
            y    : sin (middle) * r + c,
            chord: {
                x1: cos (start) * r + c,
                y1: sin (start) * r + c,
                x2: cos (end)   * r + c,
                y2: sin (end)   * r + c,
                length: chord
            }
        })
    }

    const result: RadialDefinition = {
        r,
        count,
        rotation,
        padding: options.padding || 0,
        cx     : c,
        cy     : c,
        width  : size,
        height : size,
        points
    }

    return result
}
