
export type Require <T extends object, K extends keyof T> = {
    [P in K]-?: T[P]
} & Omit <T, K>

export type Optional <T extends object, K extends keyof T> = {
    [P in K]?: T[P]
} & Omit <T, K>

export type Writable <T extends object> = { -readonly [K in keyof T]: T[K] }
