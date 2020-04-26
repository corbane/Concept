// https://observablehq.com/@d3/d3-packenclose?collection=@observablehq/algorithms
// https://observablehq.com/@d3/circle-packing
// https://github.com/d3/d3-hierarchy/blob/master/src/pack/enclose.js


export type Circle = {
     x: number,
     y: number,
     r: number
}

const slice = Array.prototype.slice

function shuffle <T> ( array: T[] )
{
     var m = array.length,
          t,
          i: number

     while ( m )
     {
          i = Math.random () * m-- | 0
          t = array [m]
          array [m] = array [i]
          array [i] = t
     }

     return array
}

export function enclose ( circles: Circle[] )
{
     circles = shuffle ( slice.call( circles ) )

     const n = circles.length

     var i = 0,
     B = [],
     p: Circle,
     e: Circle;

     while ( i < n )
     {
          p = circles [i]

          if ( e && enclosesWeak ( e, p ) )
          {
               i++
          }
          else
          {
               B = extendBasis ( B, p )
               e = encloseBasis ( B )
               i = 0
          }
     }

     return e
}

function extendBasis ( B: Circle[], p: Circle )
{
     var i: number,
     j: number

     if ( enclosesWeakAll ( p, B ) )
          return [p]

     // If we get here then B must have at least one element.
     for ( i = 0; i < B.length; ++i )
     {
          if ( enclosesNot ( p, B [i] )
          && enclosesWeakAll ( encloseBasis2 ( B [i], p ), B )
          ){
               return [ B[i], p ]
          }
     }

     // If we get here then B must have at least two elements.
     for ( i = 0; i < B.length - 1; ++i )
     {
          for ( j = i + 1; j < B.length; ++j )
          {
               if ( enclosesNot    ( encloseBasis2 ( B [i], B [j]    ), p )
               && enclosesNot    ( encloseBasis2 ( B [i], p        ), B [j] )
               && enclosesNot    ( encloseBasis2 ( B [j], p        ), B [i] )
               && enclosesWeakAll( encloseBasis3 ( B [i], B [j], p ), B )
               ){
                    return [ B[ i ], B[ j ], p ];
               }
          }
     }

     // If we get here then something is very wrong.
     throw new Error;
}

function enclosesNot ( a: Circle, b: Circle )
{
     const dr = a.r - b.r
     const dx = b.x - a.x
     const dy = b.y - a.y

     return dr < 0 || dr * dr < dx * dx + dy * dy;
}

function enclosesWeak ( a: Circle, b: Circle )
{
     var dr = a.r - b.r + 1e-6,
     dx = b.x - a.x,
     dy = b.y - a.y

     return dr > 0 && dr * dr > dx * dx + dy * dy
}

function enclosesWeakAll ( a: Circle, B: Circle[] )
{
     for ( var i = 0; i < B.length; ++i )
     {
          if ( ! enclosesWeak ( a, B[i] ) )
               return false
     }
     return true
}

function encloseBasis ( B: Circle[] )
{
     switch ( B.length )
     {
          case 1: return encloseBasis1( B [0] )
          case 2: return encloseBasis2( B [0], B [1] )
          case 3: return encloseBasis3( B [0], B [1], B [2] )
     }
}

function encloseBasis1 ( a: Circle )
{
     return {
          x: a.x,
          y: a.y,
          r: a.r
     };
}

function encloseBasis2 ( a: Circle, b: Circle )
{
     const { x: x1, y: y1, r: r1 } = a
     const { x: x2, y: y2, r: r2 } = b

     var x21 = x2 - x1,
     y21 = y2 - y1,
     r21 = r2 - r1,
     l   = Math.sqrt( x21 * x21 + y21 * y21 );

     return {
          x: ( x1 + x2 + x21 / l * r21 ) / 2,
          y: ( y1 + y2 + y21 / l * r21 ) / 2,
          r: ( l + r1 + r2 ) / 2
     };
}

function encloseBasis3 ( a: Circle, b: Circle, c: Circle )
{
     const { x: x1, y: y1, r: r1 } = a
     const { x: x2, y: y2, r: r2 } = b
     const { x: x3, y: y3, r: r3 } = c

     const a2 = x1 - x2,
               a3 = x1 - x3,
               b2 = y1 - y2,
               b3 = y1 - y3,
               c2 = r2 - r1,
               c3 = r3 - r1,

               d1 = x1 * x1 + y1 * y1 - r1 * r1,
               d2 = d1 - x2 * x2 - y2 * y2 + r2 * r2,
               d3 = d1 - x3 * x3 - y3 * y3 + r3 * r3,

               ab = a3 * b2 - a2 * b3,
               xa = ( b2 * d3 - b3 * d2 ) / ( ab * 2 ) - x1,
               xb = ( b3 * c2 - b2 * c3 ) / ab,
               ya = ( a3 * d2 - a2 * d3 ) / ( ab * 2 ) - y1,
               yb = ( a2 * c3 - a3 * c2 ) / ab,

               A  = xb * xb + yb * yb - 1,
               B  = 2 * ( r1 + xa * xb + ya * yb ),
               C  = xa * xa + ya * ya - r1 * r1,
               r  = -( A ? ( B + Math.sqrt( B * B - 4 * A * C ) ) / ( 2 * A ) : C / B )

     return {
          x: x1 + xa + xb * r,
          y: y1 + ya + yb * r,
          r: r
     };
}
