(function () {
    'use strict';

    function create() {
        const register = [];
        var enabled = true;
        const self = function (callback) {
            register.push(callback) - 1;
            return self;
        };
        self.count = () => {
            return register.length;
        };
        self.disable = () => {
            enabled = false;
            return self;
        };
        self.enable = () => {
            enabled = true;
            return self;
        };
        self.append = (callback) => {
            self(callback);
            return self;
        };
        self.remove = (callback) => {
            const index = register.indexOf(callback);
            if (index != -1)
                register.splice(index, 1);
            return self;
        };
        self.removeAll = () => {
            register.splice(0);
            return self;
        };
        self.dispatch = (...args) => {
            if (enabled) {
                for (var fn of register)
                    fn(...args);
            }
            return self;
        };
        return self;
    }

    var NumberLib;
    (function (NumberLib) {
        function limitedValue(value, min, max) {
            const self = {
                limit,
                set,
                factor,
            };
            return self;
            function limit(minValue, maxValue) {
                return self;
            }
            function set(newValue) {
                return self;
            }
            function factor(num) {
                return self;
            }
        }
        NumberLib.limitedValue = limitedValue;
        function multipleLimitedValues(values, min, max) {
            const ranges = [];
            var iclamp = 0;
            const self = {
                limit,
                set,
                factor
            };
            limit(min, max);
            return self;
            function limit(minValues, maxValues) {
                if (typeof minValues == "number")
                    minValues = [minValues];
                if (typeof maxValues == "number")
                    maxValues = [maxValues];
                const minCount = minValues.length;
                const maxCount = maxValues.length;
                const count = values.length;
                min = [];
                max = [];
                for (var i = 0; i < count; i++) {
                    if (i < minCount && Number.isFinite(minValues[i]))
                        min[i] = minValues[i];
                    else
                        min[i] = 0;
                }
                for (var i = 0; i < count; i++) {
                    if (i < maxCount && Number.isFinite(maxValues[i]))
                        max[i] = maxValues[i];
                    else
                        max[i] = values[i]; // || min [i]
                }
                // clamp
                const clampStart = minCount != 0;
                const clampEnd = maxCount != 0;
                iclamp = clampStart && clampEnd ? 1
                    : clampStart ? 2
                        : clampEnd ? 3
                            : 0;
                // range
                ranges.splice(0);
                if (clampStart && clampEnd) {
                    for (var i = 0; i != count; i++)
                        ranges.push(max[i] - min[i]);
                }
                // update
                set(values);
                return self;
            }
            function set(newValues) {
                if (typeof newValues == "number")
                    newValues = [newValues];
                const count = values.length < newValues.length ? values.length : newValues.length;
                for (var i = 0; i != count; i++)
                    values[i] = newValues[i];
                switch (iclamp) {
                    case 0:
                        for (var i = 0; i != count; i++)
                            values[i] = newValues[i];
                        break;
                    case 1:
                        for (var i = 0; i != count; i++) {
                            const n = newValues[i];
                            values[i] = n < min[i] ? min[i]
                                : n > max[i] ? max[i]
                                    : n;
                        }
                        break;
                    case 2:
                        for (var i = 0; i != count; i++) {
                            const n = newValues[i];
                            values[i] = n < min[i] ? min[i] : n;
                        }
                        break;
                    case 3:
                        for (var i = 0; i != count; i++) {
                            const n = newValues[i];
                            values[i] = n > max[i] ? max[i] : n;
                        }
                        break;
                }
                return self;
            }
            function factor(factors) {
                if (typeof factors == "number") {
                    if (!Number.isFinite(factors))
                        return self;
                    for (var i = 0; i != values.length; i++)
                        values[i] = min[i] + ranges[i] * factors;
                }
                else if (Array.isArray(factors)) {
                    const count = values.length < factors.length ? values.length : factors.length;
                    if (count == 0)
                        return self;
                    for (var i = 0; i != count; i++) {
                        if (isFinite(factors[i]))
                            values[i] = min[i] + ranges[i] * factors[i];
                    }
                }
                return self;
            }
        }
        NumberLib.multipleLimitedValues = multipleLimitedValues;
    })(NumberLib || (NumberLib = {}));

    function getRadialDistribution(options) {
        const { PI, cos, sin } = Math;
        const r = options.r || 30;
        const count = options.count || 10;
        const rotation = options.rotation || 0;
        const points = [];
        const a = 2 * PI / count;
        const chord = 2 * r * sin(a * 0.5);
        const size = r * 4 + chord;
        const c = size / 2;
        for (var i = 0; i < count; ++i) {
            const start = a * i + rotation;
            const middle = start + a * 0.5;
            const end = start + a;
            points.push({
                a1: start,
                a: middle,
                a2: end,
                x: cos(middle) * r + c,
                y: sin(middle) * r + c,
                chord: {
                    x1: cos(start) * r + c,
                    y1: sin(start) * r + c,
                    x2: cos(end) * r + c,
                    y2: sin(end) * r + c,
                    length: chord
                }
            });
        }
        const result = {
            r,
            count,
            rotation,
            padding: options.padding || 0,
            cx: c,
            cy: c,
            width: size,
            height: size,
            points
        };
        return result;
    }

    // https://observablehq.com/@d3/d3-packenclose?collection=@observablehq/algorithms
    // https://observablehq.com/@d3/circle-packing
    // https://github.com/d3/d3-hierarchy/blob/master/src/pack/enclose.js
    const slice = Array.prototype.slice;
    function shuffle(array) {
        var m = array.length, t, i;
        while (m) {
            i = Math.random() * m-- | 0;
            t = array[m];
            array[m] = array[i];
            array[i] = t;
        }
        return array;
    }
    function enclose(circles) {
        circles = shuffle(slice.call(circles));
        const n = circles.length;
        var i = 0, B = [], p, e;
        while (i < n) {
            p = circles[i];
            if (e && enclosesWeak(e, p)) {
                i++;
            }
            else {
                B = extendBasis(B, p);
                e = encloseBasis(B);
                i = 0;
            }
        }
        return e;
    }
    function extendBasis(B, p) {
        var i, j;
        if (enclosesWeakAll(p, B))
            return [p];
        // If we get here then B must have at least one element.
        for (i = 0; i < B.length; ++i) {
            if (enclosesNot(p, B[i])
                && enclosesWeakAll(encloseBasis2(B[i], p), B)) {
                return [B[i], p];
            }
        }
        // If we get here then B must have at least two elements.
        for (i = 0; i < B.length - 1; ++i) {
            for (j = i + 1; j < B.length; ++j) {
                if (enclosesNot(encloseBasis2(B[i], B[j]), p)
                    && enclosesNot(encloseBasis2(B[i], p), B[j])
                    && enclosesNot(encloseBasis2(B[j], p), B[i])
                    && enclosesWeakAll(encloseBasis3(B[i], B[j], p), B)) {
                    return [B[i], B[j], p];
                }
            }
        }
        // If we get here then something is very wrong.
        throw new Error;
    }
    function enclosesNot(a, b) {
        const dr = a.r - b.r;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        return dr < 0 || dr * dr < dx * dx + dy * dy;
    }
    function enclosesWeak(a, b) {
        var dr = a.r - b.r + 1e-6, dx = b.x - a.x, dy = b.y - a.y;
        return dr > 0 && dr * dr > dx * dx + dy * dy;
    }
    function enclosesWeakAll(a, B) {
        for (var i = 0; i < B.length; ++i) {
            if (!enclosesWeak(a, B[i]))
                return false;
        }
        return true;
    }
    function encloseBasis(B) {
        switch (B.length) {
            case 1: return encloseBasis1(B[0]);
            case 2: return encloseBasis2(B[0], B[1]);
            case 3: return encloseBasis3(B[0], B[1], B[2]);
        }
    }
    function encloseBasis1(a) {
        return {
            x: a.x,
            y: a.y,
            r: a.r
        };
    }
    function encloseBasis2(a, b) {
        const { x: x1, y: y1, r: r1 } = a;
        const { x: x2, y: y2, r: r2 } = b;
        var x21 = x2 - x1, y21 = y2 - y1, r21 = r2 - r1, l = Math.sqrt(x21 * x21 + y21 * y21);
        return {
            x: (x1 + x2 + x21 / l * r21) / 2,
            y: (y1 + y2 + y21 / l * r21) / 2,
            r: (l + r1 + r2) / 2
        };
    }
    function encloseBasis3(a, b, c) {
        const { x: x1, y: y1, r: r1 } = a;
        const { x: x2, y: y2, r: r2 } = b;
        const { x: x3, y: y3, r: r3 } = c;
        const a2 = x1 - x2, a3 = x1 - x3, b2 = y1 - y2, b3 = y1 - y3, c2 = r2 - r1, c3 = r3 - r1, d1 = x1 * x1 + y1 * y1 - r1 * r1, d2 = d1 - x2 * x2 - y2 * y2 + r2 * r2, d3 = d1 - x3 * x3 - y3 * y3 + r3 * r3, ab = a3 * b2 - a2 * b3, xa = (b2 * d3 - b3 * d2) / (ab * 2) - x1, xb = (b3 * c2 - b2 * c3) / ab, ya = (a3 * d2 - a2 * d3) / (ab * 2) - y1, yb = (a2 * c3 - a3 * c2) / ab, A = xb * xb + yb * yb - 1, B = 2 * (r1 + xa * xb + ya * yb), C = xa * xa + ya * ya - r1 * r1, r = -(A ? (B + Math.sqrt(B * B - 4 * A * C)) / (2 * A) : C / B);
        return {
            x: x1 + xa + xb * r,
            y: y1 + ya + yb * r,
            r: r
        };
    }

    /// <reference path="./d3-enclose.ts" />
    function place(b, a, c) {
        var dx = b.x - a.x, x, a2, dy = b.y - a.y, y, b2, d2 = dx * dx + dy * dy;
        if (d2) {
            a2 = a.r + c.r, a2 *= a2;
            b2 = b.r + c.r, b2 *= b2;
            if (a2 > b2) {
                x = (d2 + b2 - a2) / (2 * d2);
                y = Math.sqrt(Math.max(0, b2 / d2 - x * x));
                c.x = b.x - x * dx - y * dy;
                c.y = b.y - x * dy + y * dx;
            }
            else {
                x = (d2 + a2 - b2) / (2 * d2);
                y = Math.sqrt(Math.max(0, a2 / d2 - x * x));
                c.x = a.x + x * dx - y * dy;
                c.y = a.y + x * dy + y * dx;
            }
        }
        else {
            c.x = a.x + c.r;
            c.y = a.y;
        }
    }
    function intersects(a, b) {
        var dr = a.r + b.r - 1e-6, dx = b.x - a.x, dy = b.y - a.y;
        return dr > 0 && dr * dr > dx * dx + dy * dy;
    }
    function score(node) {
        var a = node._, b = node.next._, ab = a.r + b.r, dx = (a.x * b.r + b.x * a.r) / ab, dy = (a.y * b.r + b.y * a.r) / ab;
        return dx * dx + dy * dy;
    }
    class Node$1 {
        constructor(_) {
            this._ = _;
            this.next = null;
            this.previous = null;
        }
    }
    function packEnclose(circles) {
        if (!(n = circles.length))
            return 0;
        var a, b, c /*: Node & Circle*/, n, aa, ca, i, j, k, sj, sk;
        // Place the first circle.
        a = circles[0], a.x = 0, a.y = 0;
        if (!(n > 1))
            return a.r;
        // Place the second circle.
        b = circles[1], a.x = -b.r, b.x = a.r, b.y = 0;
        if (!(n > 2))
            return a.r + b.r;
        // Place the third circle.
        place(b, a, c = circles[2]);
        // Initialize the front-chain using the first three circles a, b and c.
        a = new Node$1(a), b = new Node$1(b), c = new Node$1(c);
        a.next = c.previous = b;
        b.next = a.previous = c;
        c.next = b.previous = a;
        // Attempt to place each remaining circle…
        pack: for (i = 3; i < n; ++i) {
            place(a._, b._, c = circles[i]), c = new Node$1(c);
            // Find the closest intersecting circle on the front-chain, if any.
            // “Closeness” is determined by linear distance along the front-chain.
            // “Ahead” or “behind” is likewise determined by linear distance.
            j = b.next, k = a.previous, sj = b._.r, sk = a._.r;
            do {
                if (sj <= sk) {
                    if (intersects(j._, c._)) {
                        b = j, a.next = b, b.previous = a, --i;
                        continue pack;
                    }
                    sj += j._.r, j = j.next;
                }
                else {
                    if (intersects(k._, c._)) {
                        a = k, a.next = b, b.previous = a, --i;
                        continue pack;
                    }
                    sk += k._.r, k = k.previous;
                }
            } while (j !== k.next);
            // Success! Insert the new circle c between a and b.
            c.previous = a, c.next = b, a.next = b.previous = b = c;
            // Compute the new closest circle pair to the centroid.
            aa = score(a);
            while ((c = c.next) !== b) {
                if ((ca = score(c)) < aa) {
                    a = c,
                        aa = ca;
                }
            }
            b = a.next;
        }
        // Compute the enclosing circle of the front chain.
        a = [b._];
        c = b;
        while ((c = c.next) !== b)
            a.push(c._);
        c = enclose(a);
        // Translate the circles to put the enclosing circle around the origin.
        for (i = 0; i < n; ++i) {
            a = circles[i],
                a.x -= c.x,
                a.y -= c.y;
        }
        return c.r;
    }
    function packCircles(circles) {
        packEnclose(circles);
        return circles;
    }



    var Geometry = /*#__PURE__*/Object.freeze({
        __proto__: null,
        getRadialDistribution: getRadialDistribution,
        enclose: enclose,
        packEnclose: packEnclose,
        packCircles: packCircles
    });

    function getUnit(value) {
        if (typeof value != "string")
            return undefined;
        const split = /[+-]?\d*\.?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?(%|px|pt|em|rem|in|cm|mm|ex|ch|pc|vw|vh|vmin|vmax|deg|rad|turn)?$/
            .exec(value);
        if (split)
            return split[1];
        return undefined;
    }

    // https://github.com/rdfjs-base/data-model/tree/master/lib
    var nextId = 0;
    function createNode(type, id, data) {
        data.type = type;
        data.id = id || (++nextId).toString();
        return data;
    }
    /*export class Node <D extends $Node = $Node, T extends string = D ["type"]>
    {
         static nextId = 0

         readonly type: string

         readonly id: string

         readonly uid: number

         readonly data: D

         defaultData (): $Node
         {
              return {
                   context: "",
                   type   : "node",
                   id     : undefined,
              }
         }

         constructor ( data: D )
         {
              this.type = data.type
              this.uid  = ++Node.nextId
              this.id   = data.id || (data.id = this.uid.toString ())

              this.data = Object.assign ( this.defaultData (), data as D )
         }

         equals ( other: Node <any> )
         {
              return !!other
                   && other.type === this.type
                   && other.id   === this.id
         }

         toJson ()
         {
              return JSON.stringify ( this.data )
         }
    }*/

    class DataTree {
        constructor() {
            this.records = {};
        }
        has(path) {
            var rec = this.records;
            var count = 0;
            for (const k of path) {
                count++;
                if (k in rec) {
                    if (k === undefined)
                        break;
                    rec = rec[k];
                }
                else {
                    return false;
                }
            }
            return path.length == count;
        }
        count(path) {
            var rec = this.records;
            for (const k of path) {
                if (k === undefined)
                    break;
                if (k in rec)
                    rec = rec[k];
                else
                    return 0;
            }
            //@ts-ignore
            return undefined in rec
                ? Object.keys(rec).length - 1
                : Object.keys(rec).length;
        }
        set(path, data) {
            const und = undefined;
            var rec = this.records;
            for (const k of path) {
                if (k === undefined)
                    break;
                if (k in rec)
                    rec = rec[k];
                else
                    rec = rec[k] = {};
            }
            return rec[und] = data;
        }
        get(path) {
            const und = undefined;
            var rec = this.records;
            for (const k of path) {
                if (k === undefined)
                    break;
                if (k in rec)
                    rec = rec[k];
                else
                    break;
            }
            return rec[und];
        }
        near(path) {
            var rec = this.records;
            const und = undefined;
            for (const k of path) {
                if (k === undefined)
                    break;
                if (k in rec)
                    rec = rec[k];
                else
                    break;
            }
            return rec[und];
        }
        walk(path, cb) {
            var rec = this.records;
            const und = undefined;
            for (const k of path) {
                if (und in rec)
                    cb(rec[und]);
                if (k === undefined)
                    break;
                if (k in rec)
                    rec = rec[k];
                else
                    break;
            }
            if (und in rec)
                cb(rec[und]);
            return;
        }
    }

    class Database extends DataTree {
        has() {
            if (arguments.length == 0)
                return;
            if (arguments.length == 1) {
                const o = arguments[0];
                return super.near([o.context, o.type, o.id]) !== undefined;
            }
            else {
                return super.near(arguments) !== undefined;
            }
        }
        count() {
            if (arguments.length == 0)
                return;
            if (arguments.length == 1) {
                const o = arguments[0];
                return super.count([o.context, o.type, o.id]);
            }
            else {
                return super.count(arguments);
            }
        }
        set() {
            if (arguments.length == 0)
                return;
            if (arguments.length == 1) {
                const o = arguments[0];
                return super.set([o.context, o.type, o.id], o);
            }
            else {
                return super.set(arguments[0], arguments[1]);
            }
        }
        get() {
            if (arguments.length == 0)
                return;
            const result = {};
            if (arguments.length == 1) {
                const o = arguments[0];
                super.walk([o.context, o.type, o.id], data => {
                    Object.assign(result, data);
                });
                return Object.assign(result, o);
            }
            else {
                super.walk(arguments, data => {
                    Object.assign(result, data);
                });
                return Object.assign(result, {
                    context: arguments[0],
                    type: arguments[1],
                    id: arguments[2],
                });
            }
        }
    }

    class Factory {
        constructor(db) {
            this.db = db;
            this.ctors = new DataTree();
            this.insts = new DataTree();
        }
        getPath() {
            if (arguments.length == 0)
                throw new Error("Null argument");
            const arg = arguments[0];
            if (typeof arg == "string")
                return arguments;
            if (Array.isArray(arg))
                return arg.flat();
            return [arg.context, arg.type, arg.id];
        }
        inStock() {
            return this.insts.has(this.getPath(...arguments));
        }
        _inStock(path) {
            return this.insts.has(path);
        }
        define(ctor, ...rest) {
            var path = this.getPath(...rest);
            if (this.ctors.has(path))
                throw "Bad argument";
            return this.ctors.set(path, ctor);
        }
        _define(ctor, path) {
            if (this.ctors.has(path))
                throw "Bad argument";
            return this.ctors.set(path, ctor);
        }
        pick() {
            var path = this.getPath(...arguments);
            if (this.insts.has(path))
                return this.insts.get(path);
            throw "Bad argument";
        }
        _pick(path) {
            if (this.insts.has(path))
                return this.insts.get(path);
            throw "Bad argument";
        }
        make() {
            var path = this.getPath(...arguments);
            const arg = arguments[0];
            if (typeof arg == "object" && !Array.isArray(arg))
                return this._make(path, arg);
            else
                return this._make(path);
        }
        _make(path, data) {
            if (this.insts.has(path))
                return this.insts.get(path);
            const ctor = this.ctors.near(path);
            if (ctor == undefined)
                throw "Bad argument";
            const tmp = this.db.get(...path);
            data = data == undefined
                ? tmp
                : Object.assign(tmp, data);
            return this.insts.set(path, new ctor(data));
        }
    }

    const xnode = (() => {
        const svg_names = ["svg", "g", "line", "circle", "path", "text"];
        function create(name, props, ...children) {
            props = Object.assign({}, props);
            const element = svg_names.indexOf(name) === -1
                ? document.createElement(name)
                : document.createElementNS("http://www.w3.org/2000/svg", name);
            const content = [];
            // Children
            while (children.length > 0) {
                let child = children.pop();
                if (Array.isArray(child)) {
                    for (var i = 0; i != child.length; i++)
                        children.push(child[i]);
                }
                else {
                    content.push(child);
                }
            }
            while (content.length > 0) {
                let child = content.pop();
                if (child instanceof Node)
                    element.appendChild(child);
                else if (typeof child == "boolean" || child)
                    element.appendChild(document.createTextNode(child.toString()));
            }
            // Attributes
            const isArray = Array.isArray;
            const conv = {
                class: (v) => isArray(v) ? v.join(" ") : v,
                style: (v) => isArray(v) ? v.join(" ")
                    : typeof v == "object" ? objectToStyle(v)
                        : v,
                // svg
                d: (v) => isArray(v) ? v.join(" ") : v,
            };
            for (const key in props) {
                const value = props[key];
                if (typeof value == "function")
                    element.addEventListener(key, value);
                else
                    element.setAttribute(key, (conv[key] || (v => v))(value));
            }
            return element;
            function objectToStyle(obj) {
                var result = "";
                for (const key in obj)
                    result += key + ": " + obj[key] + "; ";
                return result;
            }
        }
        return create;
    })();

    function defaultConfig() {
        return {
            handles: [],
            minVelocity: 0,
            maxVelocity: 1,
            onStartDrag: () => { },
            onDrag: () => { },
            onStopDrag: () => true,
            onEndAnimation: () => { },
            velocityFactor: (window.innerHeight < window.innerWidth
                ? window.innerHeight : window.innerWidth) / 2,
        };
    }
    var is_drag = false;
    var pointer;
    // https://gist.github.com/gre/1650294
    var EasingFunctions = {
        linear: (t) => t,
        easeInQuad: (t) => t * t,
        easeOutQuad: (t) => t * (2 - t),
        easeInOutQuad: (t) => t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
        easeInCubic: (t) => t * t * t,
        easeOutCubic: (t) => (--t) * t * t + 1,
        easeInOutCubic: (t) => t < .5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
        easeInQuart: (t) => t * t * t * t,
        easeOutQuart: (t) => 1 - (--t) * t * t * t,
        easeInOutQuart: (t) => t < .5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t,
        easeInQuint: (t) => t * t * t * t * t,
        easeOutQuint: (t) => 1 + (--t) * t * t * t * t,
        easeInOutQuint: (t) => t < .5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t
    };
    function draggable(options) {
        const config = defaultConfig();
        var is_active = false;
        var is_animate = false;
        var current_event;
        var start_time = 0;
        var start_x = 0;
        var start_y = 0;
        var velocity_delay = 500;
        var velocity_x;
        var velocity_y;
        var current_animation = -1;
        updateConfig(options);
        function updateConfig(options) {
            if (is_drag) {
                return;
            }
            if (navigator.maxTouchPoints > 0)
                document.body.style.touchAction = "none";
            disableEvents();
            Object.assign(config, options);
            enableEvents();
        }
        function addHandles(...handles) {
            for (const h of handles) {
                if (!config.handles.includes(h))
                    config.handles.push(h);
            }
            if (is_active) {
                desactivate();
                activate();
            }
        }
        function activate() {
            enableEvents();
            is_active = true;
        }
        function desactivate() {
            disableEvents();
            is_active = false;
        }
        return {
            updateConfig,
            addHandles,
            isActive: () => is_active,
            activate,
            desactivate,
        };
        function enableEvents() {
            for (const h of config.handles)
                h.addEventListener("pointerdown", onStart, { passive: true });
        }
        function disableEvents() {
            for (const h of config.handles)
                h.removeEventListener("pointerdown", onStart);
        }
        function onStart(event) {
            if (is_drag) {
                console.warn("Tentative de démarrage des événements "
                    + "\"draggable \" déjà en cours.");
                return;
            }
            if (is_animate) {
                stopVelocityFrame();
            }
            pointer = event.touches
                ? event.touches[0]
                : event;
            window.addEventListener("pointermove", onMove);
            window.addEventListener("pointerup", onEnd);
            disableEvents();
            current_animation = window.requestAnimationFrame(onAnimationStart);
            is_drag = true;
        }
        function onMove(event) {
            if (is_drag == false)
                return;
            pointer = event.touches !== undefined
                ? event.touches[0]
                : event;
        }
        function onEnd(event) {
            window.removeEventListener("pointermove", onMove);
            window.removeEventListener("pointerup", onEnd);
            enableEvents();
            is_drag = false;
        }
        function onAnimationStart(now) {
            start_x = pointer.clientX;
            start_y = pointer.clientY;
            start_time = now;
            current_event = {
                delay: 0,
                x: 0,
                y: 0,
                offsetX: 0,
                offsetY: 0,
                targetX: 0,
                targetY: 0,
            };
            config.onStartDrag();
            current_animation = window.requestAnimationFrame(onAnimationFrame);
        }
        function onAnimationFrame(now) {
            const { velocityFactor } = config;
            const x = pointer.clientX - start_x;
            const y = start_y - pointer.clientY;
            const delay = now - start_time;
            const offsetDelay = delay - current_event.delay;
            const offsetX = x - current_event.x;
            const offsetY = y - current_event.y;
            current_event = {
                delay,
                x,
                y,
                targetX: x,
                targetY: y,
                offsetX,
                offsetY,
            };
            if (is_drag) {
                config.onDrag(current_event);
                current_animation = window.requestAnimationFrame(onAnimationFrame);
            }
            else {
                start_time = now;
                start_x = x;
                start_y = y;
                velocity_x = velocityFactor * norm(offsetX / offsetDelay);
                velocity_y = velocityFactor * norm(offsetY / offsetDelay);
                current_event.targetX += velocity_x;
                current_event.targetY += velocity_y;
                if (config.onStopDrag(current_event) === true) {
                    is_animate = true;
                    current_animation = window.requestAnimationFrame(onVelocityFrame);
                }
            }
            function norm(value) {
                if (value < -1)
                    return -1;
                if (value > 1)
                    return 1;
                return value;
            }
        }
        function onVelocityFrame(now) {
            const delay = now - start_time;
            const t = delay >= velocity_delay
                ? 1
                : delay / velocity_delay;
            const factor = EasingFunctions.easeOutQuart(t);
            const offsetX = velocity_x * factor;
            const offsetY = velocity_y * factor;
            current_event.x = start_x + offsetX;
            current_event.y = start_y + offsetY;
            current_event.offsetX = velocity_x - offsetX;
            current_event.offsetY = velocity_y - offsetY;
            config.onDrag(current_event);
            if (t == 1) {
                is_animate = false;
                config.onEndAnimation(current_event);
                return;
            }
            current_animation = window.requestAnimationFrame(onVelocityFrame);
        }
        function stopVelocityFrame() {
            is_animate = false;
            window.cancelAnimationFrame(current_animation);
            config.onEndAnimation(current_event);
        }
    }

    /*declare global{

         interface Window
         {
              on: Window ["addEventListener"]
              off: Window ["removeEventListener"]
         }

         interface Element
         {
              css ( properties: Partial <ExtendedCSSStyleDeclaration> ): this

              cssInt   ( property: string ): number
              cssFloat ( property: string ): number

              on : HTMLElement ["addEventListener"]
              off: HTMLElement ["removeEventListener"]
              $  : HTMLElement ["querySelector"]
              $$ : HTMLElement ["querySelectorAll"]
         }
    }

    Window.prototype.on  = Window.prototype.addEventListener
    Window.prototype.off = Window.prototype.removeEventListener

    Element.prototype.css = function ( props )
    {
    Object.assign ( this.style, props )
    return this
    }

    Element.prototype.cssInt = function ( property: string )
    {
         var value = parseInt ( this.style [ property ] )

         if ( Number.isNaN ( value ) )
         {
              value = parseInt ( window.getComputedStyle ( this ) [ property ] )

              if ( Number.isNaN ( value ) )
                   value = 0
         }

         return value
    }

    Element.prototype.cssFloat = function ( property: string )
    {
         var value = parseFloat ( this.style [ property ] )

         if ( Number.isNaN ( value ) )
         {
              value = parseFloat ( window.getComputedStyle ( this ) [ property ] )

              if ( Number.isNaN ( value ) )
                   value = 0
         }

         return value
    }

    Element.prototype.on  = Element.prototype.addEventListener

    Element.prototype.off = Element.prototype.removeEventListener

    Element.prototype.$   = Element.prototype.querySelector

    Element.prototype.$$  = Element.prototype.querySelectorAll


    Element.prototype.cssInt = function ( property: string )
    {
         var value = parseInt ( this.style [ property ] )

         if ( Number.isNaN ( value ) )
         {
              const style = window.getComputedStyle ( this )

              value = parseInt ( style [ property ] )

              if ( Number.isNaN ( value ) )
                   value = 0
         }

         return value
    }*/
    function cssFloat(el, property) {
        var value = parseFloat(el.style[property]);
        if (Number.isNaN(value)) {
            value = parseFloat(window.getComputedStyle(el)[property]);
            if (Number.isNaN(value))
                value = 0;
        }
        return value;
    }
    function cssInt(el, property) {
        var value = parseInt(el.style[property]);
        if (Number.isNaN(value)) {
            const style = window.getComputedStyle(el);
            value = parseInt(style[property]);
            if (Number.isNaN(value))
                value = 0;
        }
        return value;
    }

    function defaultConfig$1() {
        return {
            handles: [],
            property: "height",
            open: false,
            near: 40,
            delay: 250,
            minSize: 0,
            maxSize: window.innerHeight,
            unit: "px",
            direction: "tb",
            onBeforeOpen: () => { },
            onAfterOpen: () => { },
            onBeforeClose: () => { },
            onAfterClose: () => { },
        };
    }
    const toSign = {
        lr: 1,
        rl: -1,
        tb: -1,
        bt: 1,
    };
    const toProperty = {
        lr: "width",
        rl: "width",
        tb: "height",
        bt: "height",
    };
    function expandable(element, options = {}) {
        const config = defaultConfig$1();
        var is_open;
        var is_vertical;
        var sign;
        var unit;
        var cb;
        var minSize;
        var maxSize;
        var start_size = 0;
        var open_size = 100;
        const draggable$1 = draggable({
            handles: [],
            onStartDrag: onStartDrag,
            onStopDrag: onStopDrag,
            onEndAnimation: onEndAnimation,
        });
        updateConfig(options);
        function updateConfig(options = {}) {
            if (options.property == undefined && options.direction != undefined)
                options.property = toProperty[options.direction];
            Object.assign(config, options);
            is_open = config.open;
            sign = toSign[config.direction];
            unit = config.unit;
            is_vertical = config.direction == "bt" || config.direction == "tb" ? true : false;
            minSize = config.minSize;
            maxSize = config.maxSize;
            element.classList.remove(is_vertical ? "horizontal" : "vertical");
            element.classList.add(is_vertical ? "vertical" : "horizontal");
            draggable$1.updateConfig({
                handles: config.handles,
                onDrag: is_vertical ? onDragVertical : onDragHorizontal,
            });
        }
        function size() {
            return is_open ? cssInt(element, config.property) : 0;
        }
        function toggle() {
            if (is_open)
                close();
            else
                open();
        }
        function open() {
            config.onBeforeOpen();
            element.classList.add("animate");
            element.classList.replace("close", "open");
            if (cb)
                onTransitionEnd();
            cb = config.onAfterOpen;
            element.addEventListener("transitionend", () => onTransitionEnd);
            element.style[config.property] = open_size + unit;
            is_open = true;
        }
        function close() {
            config.onBeforeClose();
            open_size = size();
            element.classList.add("animate");
            element.classList.replace("open", "close");
            if (cb)
                onTransitionEnd();
            cb = config.onAfterClose;
            element.addEventListener("transitionend", onTransitionEnd);
            element.style[config.property] = "0" + unit;
            is_open = false;
        }
        return {
            updateConfig,
            open,
            close,
            toggle,
            isOpen: () => is_open,
            isClose: () => !is_open,
            isVertical: () => is_vertical,
            isActive: () => draggable$1.isActive(),
            activate: () => draggable$1.activate(),
            desactivate: () => draggable$1.desactivate(),
        };
        function onTransitionEnd() {
            if (cb)
                cb();
            element.removeEventListener("transitionend", () => onTransitionEnd);
            cb = null;
        }
        function onStartDrag() {
            start_size = size();
            element.classList.remove("animate");
        }
        function onDragVertical(event) {
            console.log(minSize, event.y, maxSize);
            console.log(clamp(start_size + sign * event.y) + unit);
            element.style[config.property] = clamp(start_size + sign * event.y) + unit;
        }
        function onDragHorizontal(event) {
            element.style[config.property] = clamp(start_size + sign * event.x) + unit;
        }
        function onStopDrag(event) {
            var is_moved = is_vertical ? sign * event.y > config.near
                : sign * event.x > config.near;
            if ((is_moved == false) && event.delay <= config.delay) {
                toggle();
                return false;
            }
            const target_size = clamp(is_vertical ? start_size + sign * event.targetY
                : start_size + sign * event.targetX);
            if (target_size <= config.near) {
                close();
                return false;
            }
            return true;
        }
        function onEndAnimation() {
            open_size = cssInt(element, config.property);
            open();
        }
        function clamp(v) {
            if (v < minSize)
                return minSize;
            if (v > maxSize)
                return maxSize;
            return v;
        }
    }

    function defaultConfig$2() {
        return {
            handles: [],
            direction: "lr",
            porperty: "left",
            minValue: -100,
            maxValue: 0,
            units: "%",
            mouseWheel: true,
        };
    }
    var start_position = 0;
    var is_vertical = false;
    var prop;
    function swipeable(element, options) {
        const config = defaultConfig$2();
        const draggable$1 = draggable({
            handles: [],
            onStartDrag,
            onStopDrag,
        });
        element.classList.add("swipeable");
        updateConfig(options);
        function updateConfig(options) {
            Object.assign(config, options);
            is_vertical = config.direction == "bt" || config.direction == "tb";
            if (options.porperty == undefined)
                config.porperty = is_vertical ? "top" : "left";
            // switch ( config.porperty )
            // {
            // case "top": case "bottom": case "y": is_vertical = true  ; break
            // case "left": case "right": case "x": is_vertical = false ; break
            // default: debugger ; return
            // }
            draggable$1.updateConfig({
                handles: config.handles,
                onDrag: is_vertical ? onDragVertical : onDragHorizontal
            });
            prop = config.porperty;
            if (draggable$1.isActive())
                activeEvents();
            else
                desactiveEvents();
        }
        function position() {
            return cssFloat(element, prop);
        }
        function activate() {
            draggable$1.activate();
            activeEvents();
        }
        function desactivate() {
            draggable$1.desactivate();
            desactiveEvents();
        }
        function swipe(offset, u) {
            if (typeof offset == "string") {
                u = getUnit(offset);
                offset = parseFloat(offset);
            }
            if (!["px", "%"].includes(u))
                u = "px";
            if (u != config.units) {
                if ((u = config.units) == "%")
                    offset = toPercents(offset);
                else
                    offset = toPixels(offset);
            }
            element.style[prop] = clamp(offset) + u;
        }
        return {
            updateConfig,
            activate,
            desactivate,
            position,
            swipe,
        };
        function activeEvents() {
            if (config.mouseWheel) {
                for (const h of config.handles)
                    h.addEventListener("wheel", onWheel, { passive: true });
            }
        }
        function desactiveEvents() {
            for (const h of config.handles)
                h.removeEventListener("wheel", onWheel);
        }
        function toPixels(percentage) {
            const { minValue: min, maxValue: max } = config;
            if (percentage < 100)
                percentage = 100 + percentage;
            return min + (max - min) * percentage / 100;
        }
        function toPercents(pixels) {
            const { minValue: min, maxValue: max } = config;
            return Math.abs((pixels - min) / (max - min) * 100);
        }
        function onStartDrag() {
            element.classList.remove("animate");
            start_position = position();
        }
        function onDragVertical(event) {
            element.style[prop] = clamp(start_position + event.y) + config.units;
        }
        function onDragHorizontal(event) {
            element.style[prop] = clamp(start_position + event.x) + config.units;
        }
        function onStopDrag(event) {
            element.classList.add("animate");
            const offset = is_vertical
                ? event.y //+ event.velocityY
                : event.x; //+ event.velocityX
            element.style[prop] = clamp(start_position + offset) + config.units;
            return true;
        }
        function onWheel(event) {
            if (event.deltaMode != WheelEvent.DOM_DELTA_PIXEL)
                return;
            if (is_vertical) {
                var delta = event.deltaY;
            }
            else {
                var delta = event.deltaX;
                if (delta == 0)
                    delta = event.deltaY;
            }
            element.style[prop] = clamp(position() + delta) + config.units;
        }
        function clamp(value) {
            return value < config.minValue ? config.minValue
                : value > config.maxValue ? config.maxValue
                    : value;
        }
    }

    class Commands {
        constructor() {
            this.db = {};
            this.events = {};
        }
        static get current() { return current; }
        add(name, callback) {
            if (name in this.db)
                return;
            this.db[name] = callback;
        }
        has(key) {
            return key in this.db;
        }
        run(name, ...args) {
            if (name in this.db) {
                this.db[name](...args);
                if (name in this.events)
                    this.events[name].dispatch();
            }
        }
        on(name, callback) {
            const callbacks = name in this.events
                ? this.events[name]
                : this.events[name] = create();
            callbacks(callback);
        }
        remove(key) {
            delete this.db[key];
        }
    }
    const current = new Commands();

    class Component {
        constructor(data) {
            this.data = Object.assign(this.defaultData(), createNode(data.type, data.id, data));
        }
        defaultData() {
            return {
                context: "concept-ui",
                type: "component",
                id: undefined,
            };
        }
        getHtml() {
            if (this.container == undefined) {
                this.container = xnode("div", { class: this.data.type });
                this.onCreate();
            }
            return [this.container];
        }
        onCreate() {
        }
        makeHtml() {
            throw new Error("Not implemented");
        }
        makeSvg() {
            throw new Error("Not implemented");
        }
        makeFabric() {
            throw new Error("Not implemented");
        }
        onCreateHtml() {
        }
        onCreateSvg() {
        }
        onCreateFabric() {
        }
    }

    /// <reference path="../Data/index.ts" />
    const CONTEXT = "concept-ui";
    const db = new Database();
    const factory = new Factory(db);
    const inStock = function () {
        const arg = arguments.length == 1
            ? normalize(arguments[0])
            : normalize([...arguments]);
        const path = factory.getPath(arg);
        return factory._inStock(path);
    };
    const pick = function (...rest) {
        const arg = arguments.length == 1
            ? normalize(arguments[0])
            : normalize([...arguments]);
        const path = factory.getPath(arg);
        return factory._pick(path);
    };
    const make = function () {
        const arg = arguments.length == 1
            ? normalize(arguments[0])
            : normalize([...arguments]);
        const path = factory.getPath(arg);
        if (isNode(arg))
            var data = arg;
        return factory._make(path, data);
    };
    const set = function () {
        const arg = normalize(arguments[0]);
        if (arguments.length == 1)
            db.set(arg);
        else
            db.set(arg, normalize(arguments[1]));
    };
    const define = function (ctor, ...rest) {
        const arg = rest.length == 1
            ? normalize(rest[0])
            : normalize([...rest]);
        const path = factory.getPath(arg);
        factory._define(ctor, path);
    };
    function isNode(obl) {
        return typeof obl == "object" && !Array.isArray(obl);
    }
    function normalize(arg) {
        if (Array.isArray(arg)) {
            if (arg[0] !== CONTEXT)
                arg.unshift(CONTEXT);
        }
        else if (typeof arg == "object") {
            if ("context" in arg) {
                if (arg.context !== CONTEXT)
                    throw "Bad context value";
            }
            else {
                arg.context = CONTEXT;
            }
        }
        return arg;
    }

    class Phantom extends Component {
        getHtml() {
            if (this.container == undefined) {
                this.container = document.createElement("div");
                this.container.innerHTML = this.data.content;
            }
            return this.container.childNodes;
        }
    }

    class Container extends Component {
        constructor(data) {
            super(data);
            this.children = {};
            data = this.data;
            const children = data.children;
            if (children) {
                for (const child of children) {
                    if (!inStock(child))
                        make(child);
                }
            }
            this.is_vertical = data.direction == "bt" || data.direction == "tb";
        }
        defaultData() {
            return {
                context: "concept-ui",
                type: "component",
                id: undefined,
                direction: "lr",
            };
        }
        getHtml() {
            if (this.container != undefined)
                return [this.container];
            const elements = super.getHtml();
            const container = this.container;
            const data = this.data;
            const children = this.children;
            if (this.is_vertical)
                container.classList.add("vertical");
            else
                container.classList.remove("vertical");
            if (this.slot == undefined)
                this.slot = container;
            const slot = this.slot;
            if (data.children) {
                const new_children = [];
                for (const child of data.children) {
                    const o = pick(child);
                    slot.append(...o.getHtml());
                    children[o.data.id] = o;
                }
                this.onChildrenAdded(new_children);
            }
            return elements;
        }
        onChildrenAdded(components) {
        }
        append(...elements) {
            if (this.container == undefined)
                this.getHtml();
            const slot = this.slot;
            const children = this.children;
            const new_child = [];
            for (var e of elements) {
                if (typeof e == "string") {
                    e = new Phantom({
                        context: "concept-ui",
                        type: "phantom",
                        id: undefined,
                        content: e
                    });
                }
                else if (e instanceof Element) {
                    const UI_COMPONENT = Symbol.for("UI_COMPONENT");
                    e = e[UI_COMPONENT] != undefined
                        ? e[UI_COMPONENT]
                        : new Phantom({
                            context: "concept-ui",
                            type: "phantom",
                            id: undefined,
                            content: e.outerHTML
                        });
                }
                else if (!(e instanceof Component)) {
                    e = inStock(e)
                        ? pick(e)
                        : make(e);
                }
                children[e.data.id] = e;
                slot.append(...e.getHtml());
                new_child.push(e);
            }
            if (new_child.length > 0)
                this.onChildrenAdded(new_child);
        }
        remove(...elements) {
        }
        clear() {
            this.children = {};
            if (this.container)
                this.container.innerHTML = "";
        }
        getOrientation() {
            return this.data.direction;
        }
        setOrientation(value) {
            const config = this.data;
            if (value == config.direction)
                return;
            const container = this.container;
            if (this.is_vertical)
                container.classList.add("vertical");
            else
                container.classList.remove("vertical");
            config.direction = value;
            this.is_vertical = value == "bt" || value == "tb";
        }
    }

    class Block extends Component {
        constructor() {
            super(...arguments);
            this.container = xnode("div", { class: "bar" });
        }
        get orientation() {
            return this.container.classList.contains("vertical")
                ? "horizontal"
                : "vertical";
        }
        set orientation(orientation) {
            const classList = this.container.classList;
            var new_orientation = classList.contains("vertical")
                ? "horizontal"
                : "vertical";
            if (orientation == new_orientation)
                return;
            classList.replace(orientation, new_orientation);
        }
    }
    define(Block, ["block"]);

    class Button extends Component {
        getHtml() {
            if (this.container == undefined) {
                const data = this.data;
                const node = xnode("div", { class: "button" },
                    data.icon ? xnode("span", { class: "icon" }, data.icon) : null,
                    data.text ? xnode("span", { class: "text" }, data.text) : null);
                if (this.data.callback != undefined || this.data.command != undefined)
                    node.addEventListener("click", this.onTouch.bind(this));
                this.container = node;
            }
            return [this.container];
        }
        onTouch() {
            if (this.data.callback && this.data.callback() !== true)
                return;
            if (this.data.command)
                Commands.current.run(this.data.command);
        }
        onHover() {
        }
    }
    define(Button, ["button"]);

    const $default = {
        type: "button",
        id: undefined,
        icon: undefined,
    };
    set(["button"], $default);

    //   ```
    //   .slideshow
    //        [...]
    //   ```
    class Slideshow extends Container {
        constructor() {
            super(...arguments);
            this.children = {};
        }
        getHtml() {
            const elements = super.getHtml();
            const data = this.data;
            const container = this.container;
            if (data.isSwipeable) {
                this.swipeable = swipeable(container, {
                    handles: [container],
                    minValue: -0,
                    maxValue: 0,
                    porperty: data.direction == "bt" || data.direction == "tb" ? "top" : "left",
                    units: "px",
                    mouseWheel: true,
                });
                this.swipeable.activate();
            }
            return elements;
        }
        show(id, ...content) {
            const child = this.children[id];
            if (child == undefined)
                return;
            if (this.current)
                this.current = child;
            if (content) {
                child.clear();
                console.log(content);
                child.append(...content);
            }
            child.container.style.display = "block";
        }
    }
    define(Slideshow, ["slideshow"]);
    define(Container, ["slide"]);

    class ListView extends Container {
        getHtml() {
            if (this.container != undefined)
                return [this.container];
            const slot = this.slot = xnode("div", { class: "list-view-slide" });
            super.getHtml();
            const container = this.container;
            container.append(slot);
            container.classList.add("list-view");
            this.swipeable = expandable(slot, {
                handles: [container],
                minSize: 0,
                maxSize: 0,
                property: this.is_vertical ? "top" : "left",
                direction: this.data.direction,
                unit: "px",
            });
            this.swipeable.activate();
            window.addEventListener("DOMContentLoaded", () => {
                this.swipeable.updateConfig({
                    minSize: -this.slideSize(),
                });
            });
            return [this.container];
        }
        onChildrenAdded(elements) {
            this.swipeable.updateConfig({
                minSize: -this.slideSize(),
                property: this.is_vertical ? "top" : "left",
                direction: this.data.direction,
            });
        }
        slideSize() {
            const { slot } = this;
            return cssFloat(slot, this.is_vertical ? "height" : "width");
        }
        swipe(offset, unit) {
            // if ( typeof offset == "string" )
            //      this.swipeable.swipe ( offset )
            // else
            //      this.swipeable.swipe ( offset, unit )
        }
    }

    /**
     *   ```pug
     *   .toolbar
     *        .toolbar-backgroung
     *        .toolbar-slide
     *             [...]
     *   ```
     */
    class Toolbar extends ListView {
        defaultConfig() {
            return Object.assign(Object.assign({}, super.defaultData()), { type: "toolbar", title: "Title ...", direction: "lr", 
                //reverse  : false,
                buttons: [] });
        }
        getHtml() {
            if (this.container != undefined)
                return [this.container];
            super.getHtml();
            if (this.data.buttons)
                this.append(...this.data.buttons);
            return [this.container];
        }
    }
    define(Toolbar, ["toolbar"]);

    function scrollableNative(options) {
        desactivate();
        return {
            activate,
            desactivate,
        };
        function activate() {
            const dir = options.direction == "bt" || options.direction == "tb"
                ? "pan-y" : "pan-x";
            for (const h of options.handles)
                h.style.touchAction = dir;
        }
        function desactivate() {
            const dir = options.direction == "bt" || options.direction == "tb"
                ? "pan-y" : "pan-x";
            for (const h of options.handles)
                h.style.touchAction = "none";
        }
    }
    function scollable(options) {
        if ("ontouchstart" in window)
            return scrollableNative(options);
        const drag = draggable({
            handles: options.handles,
            velocityFactor: 100,
            onStartDrag,
            onDrag: options.direction == "bt" || options.direction == "tb"
                ? onDragVertical
                : onDragHorizontal,
            onStopDrag: options.direction == "bt" || options.direction == "tb"
                ? onStopDragVertical
                : onStopDragHorizontal,
        });
        return {
            activate: () => { drag.activate(); }
        };
        function onStartDrag() {
            for (const h of options.handles)
                h.style.scrollBehavior = "unset";
        }
        function onDragVertical(event) {
            for (const h of options.handles)
                h.scrollBy(0, event.offsetY);
        }
        function onDragHorizontal(event) {
            for (const h of options.handles)
                h.scrollBy(event.offsetX, 0);
        }
        function onStopDragVertical(event) {
            for (const h of options.handles) {
                h.scrollBy(0, event.offsetY);
                //h.style.scrollBehavior = "smooth"
                //h.scrollBy ( 0, event.offsetY + event.velocityY )
            }
            return true;
        }
        function onStopDragHorizontal(event) {
            for (const h of options.handles) {
                h.scrollBy(event.offsetX, 0);
                //h.style.scrollBehavior = "smooth"
                //h.scrollBy ( event.offsetX + event.velocityX, 0 )
            }
            return true;
        }
    }

    const toPosition = {
        lr: "left",
        rl: "right",
        tb: "top",
        bt: "bottom",
    };
    /**
     *   ```
     *   .panel
     *        .panel-header
     *             .panel-main-buttton
     *             [...]
     *        .panel-content
     *             [...]
     *        .panel-footer
     *             [...]
     *   ```
     */
    class Panel extends Container {
        //protected expandable: ExpendableElement
        defaultData() {
            return Object.assign(Object.assign({}, super.defaultData()), { type: "panel", children: [], direction: "rl" });
        }
        getHtml() {
            if (this.container == undefined) {
                const header = xnode("div", { class: "panel-header" });
                const content = xnode("div", { class: "panel-content" });
                const container = xnode("div", { class: "panel close" },
                    header,
                    content);
                const data = this.data;
                // if ( data.hasMainButton )
                // {
                //      const btn = <span class="panel-main-button">
                //           <span class="icon">⇕</span>
                //      </span>
                //      this.main_button = btn
                //      header.append ( btn )
                // }
                if (data.header) {
                    this.header = inStock(data.header)
                        ? pick(data.header)
                        : make(data.header);
                    header.append(...this.header.getHtml());
                }
                if (data.children) {
                    //super.append ( ... data.children )
                    for (const child of data.children) {
                        this.content = inStock(child)
                            ? pick(child)
                            : make(child);
                        content.append(...this.content.getHtml());
                    }
                }
                this.container = container;
                // this.expandable = expandable ( container, {
                //      direction    : data.direction,
                //      near         : 60,
                //      handles      : Array.of ( this.main_button ),
                //      onAfterOpen  : () => {
                //           //content.style.overflow = ""
                //           content.classList.remove ( "hidden" )
                //      },
                //      onBeforeClose: () => {
                //           //content.style.overflow = "hidden"
                //           content.classList.add ( "hidden" )
                //      }
                // })
                // this.expandable.activate ()
                scollable({
                    handles: [content],
                    direction: "bt"
                })
                    .activate();
                this._header = header;
                this._content = content;
                this.container.classList.add(toPosition[data.direction]);
            }
            return [this.container];
        }
        // private onClickTab ()
        // {
        //      this.open ()
        // }
        //isOpen ()
        //{
        //     return this.expandable.isOpen ()
        //}
        //isClose ()
        //{
        //     return this.expandable.isClose ()
        //}
        setOrientation(value) {
            const { data } = this;
            this.container.classList.remove(toPosition[data.direction]);
            this.container.classList.add(toPosition[value]);
            super.setOrientation(value);
            //expandable.updateConfig ({ direction: value })
            data.direction = value;
        }
    }
    define(Panel, ["panel"]);

    class SideMenu extends Panel {
        getHtml() {
            const elements = super.getHtml();
            const data = this.data;
            const container = this.container;
            const header = this._header;
            const content = this._content;
            container.classList.replace("panel", "side-menu");
            header.classList.replace("panel-header", "side-menu-header");
            content.classList.replace("panel-content", "side-menu-content");
            if (data.hasMainButton) {
                const btn = xnode("span", { class: "side-menu-main-button" },
                    xnode("span", { class: "icon" }, "\u21D5"));
                this.main_button = btn;
                //this.container.insertAdjacentElement ( "afterbegin", btn )
                header.insertAdjacentElement("afterbegin", btn);
            }
            this.expandable = expandable(this.container, {
                direction: data.direction,
                near: 60,
                handles: Array.of(this.main_button),
                onAfterOpen: () => {
                    content.classList.remove("hidden");
                },
                onBeforeClose: () => {
                    content.classList.add("hidden");
                }
            });
            this.expandable.activate();
            return elements;
        }
        isOpen() {
            return this.expandable.isOpen();
        }
        isClose() {
            return this.expandable.isClose();
        }
        open() {
        }
        close() {
            this.expandable.close();
            return this;
        }
    }
    define(SideMenu, ["side-menu"]);

    function createSvgShape(type, def) {
        switch (type) {
            case "circle": return SvgFactory.circle(def);
            case "triangle": return SvgFactory.triangle(def);
            case "square": return SvgFactory.square(def);
            case "pantagon": return SvgFactory.pantagon(def);
            case "hexagon": return SvgFactory.hexagon(def);
            case "square": return SvgFactory.square(def);
            case "text": return SvgFactory.text(def);
            case "textbox": return SvgFactory.textbox(def);
            case "path": return SvgFactory.path(def);
        }
    }
    class SvgFactory {
        // To get triangle, square, [panta|hexa]gon points
        //
        // var a = Math.PI*2/4
        // for ( var i = 0 ; i != 4 ; i++ )
        //     console.log ( `[ ${ Math.sin(a*i) }, ${ Math.cos(a*i) } ]` )
        static circle(def) {
            const node = xnode("circle", { cx: def.x || 0, cy: def.y || 0, r: def.size / 2 });
            return node;
        }
        static triangle(def) {
        }
        static square(def) {
        }
        static pantagon(def) {
        }
        static hexagon(def) {
        }
        static text(def) {
        }
        static textbox(def) {
        }
        static path(def) {
        }
    }

    const G = Geometry;
    class RadialMenu extends Component {
        constructor() {
            super(...arguments);
            this.renderers = {
                "circle": this.renderSvgCircles.bind(this)
            };
        }
        getHtml() {
            this.update();
            return [this.container];
        }
        add(...buttons) {
            this.data.buttons.push(...buttons);
            this.update();
        }
        update() {
            const { data } = this;
            const def = {
                count: data.buttons.length,
                r: 75,
                padding: 6,
                rotation: data.rotation || 0
            };
            this.definition = G.getRadialDistribution(def);
            this.container = this.toSvg("circle");
        }
        enableEvents() {
            //const { options } = this
            //for ( const btn of options.buttons )
            //     btn.
        }
        show(x, y) {
            const n = this.container;
            const offset = this.definition.width / 2;
            n.style.left = (x - offset) + "px";
            n.style.top = (y - offset) + "px";
            n.classList.remove("close");
            window.addEventListener("mousedown", this.hide.bind(this), true);
        }
        hide() {
            this.container.classList.add("close");
            document.removeEventListener("mousedown", this.hide);
        }
        toSvg(style) {
            const { definition: def, renderers, data } = this;
            const svg = xnode("svg", { class: "radial-menu close", width: def.width + "px", height: def.height + "px", viewBox: `0 0 ${def.width} ${def.height}` });
            const buttons = style in renderers
                ? renderers[style](def)
                : this.renderSvgCircles(def);
            svg.append(...buttons);
            for (var i = 0; i != buttons.length; i++) {
                const opt = data.buttons[i];
                if (typeof opt.callback == "function")
                    buttons[i].addEventListener("mousedown", () => opt.callback());
            }
            return svg;
        }
        renderSvgCircles(definition) {
            const points = definition.points;
            const padding = definition.padding;
            const buttuns = [];
            for (var i = 0; i < points.length; ++i) {
                const def = points[i];
                const btn = this.data.buttons[i];
                const group = xnode("g", { class: "button" });
                const circle = createSvgShape("circle", {
                    size: def.chord.length - padding * 2,
                    x: def.x,
                    y: def.y
                });
                const text = xnode("text", { x: def.x, y: def.y, "font-size": "30", fill: "black", style: "user-select: none; cursor: pointer; dominant-baseline: central; text-anchor: middle;" });
                if (btn.fontFamily != undefined)
                    text.setAttribute("font-family", btn.fontFamily);
                text.innerHTML = btn.icon;
                group.append(circle);
                group.append(text);
                buttuns.push(group);
            }
            return buttuns;
        }
    }

    class PersonVieweer extends Component {
        display(person) {
            const card = xnode("div", { class: "w3-card-4 person-card" },
                xnode("img", { src: person.avatar, alt: "Avatar" }),
                xnode("div", { class: "w3-container" },
                    xnode("h4", null,
                        xnode("b", null, person.firstName)),
                    xnode("label", null,
                        xnode("b", null, person.isCaptain ? "Expert" : null))));
            this.container.innerHTML = "";
            this.container.append(card);
        }
    }
    define(PersonVieweer, {
        context: "concept-ui",
        type: "person-viewer",
        id: undefined,
    });

    /// <reference path="./types.d.ts" />
    const CONTEXT$1 = "concept-data";
    const Data = new Database();
    function normalize$1(node) {
        if ("context" in node) {
            if (node.context !== CONTEXT$1)
                throw "Bad context value";
        }
        else {
            node.context = CONTEXT$1;
        }
        return node;
    }
    function getData() {
        if (arguments.length == 0)
            return;
        if (arguments.length == 1)
            return Data.get(normalize$1(arguments[0]));
        else
            return Data.get(CONTEXT$1, ...arguments);
    }
    function setData(node) {
        Data.set(normalize$1(node));
    }

    class SkillViewer extends Component {
        display(skill) {
            const target = xnode("div", { class: "people" });
            for (const name of skill.items) {
                const person = getData(name);
                const card = xnode("div", { class: "w3-card-4 person-card" },
                    xnode("img", { src: person.avatar, alt: "Avatar" }),
                    xnode("div", { class: "w3-container" },
                        xnode("h4", null,
                            xnode("b", null, person.firstName)),
                        xnode("label", null,
                            xnode("b", null, person.isCaptain ? "Expert" : null))));
                target.append(card);
            }
            this.container.classList.add("container");
            this.container.innerHTML = "";
            this.container.append(xnode("h1", null, skill.id));
            this.container.append(xnode("p", null, skill.description));
            this.container.append(target);
            // https://github.com/LorDOniX/json-viewer/blob/master/src/json-viewer.js
            this.container.append(xnode("pre", null, JSON.stringify(skill, null, 3)));
        }
    }
    define(SkillViewer, {
        context: "concept-ui",
        type: "skill-viewer",
        id: undefined,
    });

    //import * as fabric from "fabric/fabric-impl.js"
    const fabric_base_obtions = {
        left: 0,
        top: 0,
        originX: "center",
        originY: "center",
    };
    const Factory$1 = {
        group(def, size, opt) {
            return new fabric.Group(undefined, Object.assign(Object.assign(Object.assign({}, fabric_base_obtions), opt), { width: size, height: size }));
        },
        // To get triangle, square, [panta|hexa]gon points
        //
        // var a = Math.PI*2/4
        // for ( var i = 0 ; i != 4 ; i++ )
        //     console.log ( `[ ${ Math.sin(a*i) }, ${ Math.cos(a*i) } ]` )
        circle(def, size, opt) {
            return new fabric.Circle(Object.assign(Object.assign(Object.assign({}, fabric_base_obtions), opt), { radius: size / 2 }));
        },
        triangle(def, size, opt) {
            const points = [];
            const scale = 1.2;
            const r = size / 2 * scale;
            for (const p of [
                [0, 1],
                [0.8660254037844387, -0.4999999999999998],
                [-0.8660254037844385, -0.5000000000000004]
            ])
                points.push({ x: p[0] * r, y: p[1] * r });
            return new fabric.Polygon(points, Object.assign(Object.assign(Object.assign({}, fabric_base_obtions), opt), { angle: 180 }));
        },
        square(def, size, opt) {
            const scale = 0.9;
            return new fabric.Rect(Object.assign(Object.assign(Object.assign({}, fabric_base_obtions), opt), { width: size * scale, height: size * scale }));
        },
        pantagon(def, size, opt) {
            const points = [];
            const scale = 1.1;
            const r = size / 2 * scale;
            for (const p of [
                [0, 1],
                [0.9510565162951535, 0.30901699437494745],
                [0.5877852522924732, -0.8090169943749473],
                [-0.587785252292473, -0.8090169943749475],
                [-0.9510565162951536, 0.30901699437494723]
            ])
                points.push({ x: p[0] * r, y: p[1] * r });
            return new fabric.Polygon(points, Object.assign(Object.assign(Object.assign({}, fabric_base_obtions), opt), { angle: 180 }));
        },
        hexagon(def, size, opt) {
            const points = [];
            const scale = 1.1;
            const r = size / 2 * scale;
            for (const p of [
                [0, 1],
                [0.8660254037844386, 0.5000000000000001],
                [0.8660254037844387, -0.4999999999999998],
                [1.2246467991473532e-16, -1],
                [-0.8660254037844385, -0.5000000000000004],
                [-0.866025403784439, 0.49999999999999933],
            ])
                points.push({ x: p[0] * r, y: p[1] * r });
            return new fabric.Polygon(points, Object.assign(Object.assign(Object.assign({}, fabric_base_obtions), opt), { angle: 90 }));
        },
        text(def, size, opt) {
            return new fabric.Text("...", Object.assign(Object.assign(Object.assign({}, fabric_base_obtions), opt), { fontSize: size }));
        },
        textbox(def, size, opt) {
            return new fabric.Textbox("...", Object.assign(Object.assign(Object.assign({}, fabric_base_obtions), opt), { fontSize: size }));
        },
        path(def, size, opt) {
            return new fabric.Path(def.path, Object.assign(Object.assign(Object.assign({}, fabric_base_obtions), opt), { scaleX: size / 100, scaleY: size / 100 }));
        },
    };

    //import * as fabric from "fabric/fabric-impl.js"
    class Geometry$1 {
        constructor(owner) {
            this.owner = owner;
            this.config = owner.config;
            this.updateShape();
        }
        update(options) {
            Object.assign(this.config, options);
            if ("shape" in options) {
                this.updateShape();
            }
            else if ("backgroundImage" in options || "backgroundRepeat" in options) {
                this.updateBackgroundImage();
            }
        }
        updatePosition() {
            const { config, object } = this;
            object.set({
                left: config.x,
                top: config.y,
            })
                .setCoords();
        }
        updateSize() {
            const { owner, config, object } = this;
            const size = owner.displaySize();
            if (config.shape == "circle") {
                object.set({
                    radius: size / 2
                });
            }
            else {
                object.set({
                    width: size,
                    height: size,
                });
            }
            object.setCoords();
        }
        updateShape(shape) {
            const { config, owner } = this;
            if (arguments.length == 0)
                shape = config.shape;
            else
                config.shape = shape;
            if (owner.group != undefined && this.object != undefined)
                owner.group.remove(this.object);
            const obj = this.object
                = Factory$1[config.shape](config, owner.displaySize(), {
                    left: 0,
                    top: 0,
                    originX: "center",
                    originY: "center",
                    fill: config.backgroundColor,
                    stroke: config.borderColor,
                    strokeWidth: config.borderWidth,
                });
            owner.group.add(obj);
            obj.sendToBack();
            if (config.backgroundImage != undefined)
                this.updateBackgroundImage();
            if (obj.canvas != undefined)
                obj.canvas.requestRenderAll();
        }
        updateBackgroundImage(path) {
            if (arguments.length == 0)
                path = this.config.backgroundImage;
            else
                this.config.backgroundImage = path;
            if (typeof path == "string" && path.length > 0)
                fabric.util.loadImage(path, this.on_pattern.bind(this));
        }
        on_pattern(dimg) {
            const { owner } = this;
            const factor = dimg.width < dimg.height
                ? owner.displaySize() / dimg.width
                : owner.displaySize() / dimg.height;
            this.object.set({
                fill: new fabric.Pattern({
                    source: dimg,
                    repeat: "no-repeat",
                    patternTransform: [
                        factor, 0, 0,
                        factor, 0, 0,
                    ]
                })
            })
                .setCoords();
            if (this.object.canvas)
                this.object.canvas.renderAll();
        }
    }

    // <reference path="../../typings.d.ts" />
    class Shape {
        constructor(data) {
            this.group = undefined;
            //console.log ( "Updata here Shape.data " + data.data )
            this.background = undefined;
            this.border = undefined;
            this.config = Object.assign(Object.assign({}, this.defaultConfig()), data);
            //      this.init ()
            // }
            // init ()
            // {
            const { config } = this;
            const group = this.group = new fabric.Group([], {
                width: this.displaySize(),
                height: this.displaySize(),
                left: config.x,
                top: config.y,
                hasBorders: true,
                hasControls: true,
                originX: "center",
                originY: "center",
            });
            this.background = new Geometry$1(this);
            //group.add ( this.background.object )
            //this.background.object.sendToBack ()
            // ;(this.border as Geometry) = new Geometry ( this, this.config )
            // group.add ( this.border.object )
            group.setCoords();
        }
        defaultConfig() {
            return {
                context: "concept-aspect",
                type: "shape",
                id: undefined,
                data: undefined,
                x: 0,
                y: 0,
                //size      : 20,
                minSize: 1,
                sizeFactor: 1,
                sizeOffset: 0,
                shape: "circle",
                borderColor: "gray",
                borderWidth: 5,
                backgroundColor: "transparent",
                backgroundImage: undefined,
                backgroundRepeat: false,
                onCreate: undefined,
                onDelete: undefined,
                onTouch: undefined,
            };
        }
        displaySize() {
            const config = this.config;
            var size = (1 + config.sizeOffset) * config.sizeFactor;
            if (size < config.minSize)
                size = config.minSize;
            return size || 1;
        }
        updateSize() {
            const { group, config } = this;
            if (this.background)
                this.background.updateSize();
            if (this.border)
                this.border.updateSize();
            group.set({
                width: this.displaySize(),
                height: this.displaySize(),
            });
            if (group.canvas)
                group.canvas.requestRenderAll();
        }
        coords() {
            return this.group.getCoords();
        }
        setBackground(options) {
            Object.assign(this.config, options);
            this.background.update(options);
            this.updateSize();
        }
        setPosition(x, y) {
            const { group, config } = this;
            config.x = x;
            config.y = y;
            group.set({
                left: x,
                top: y
            })
                .setCoords();
            if (group.canvas)
                group.canvas.requestRenderAll();
        }
        hover(up) {
            const target = this.background != undefined
                ? this.background.object
                : this.group;
            target.setShadow('rgba(0,0,0,0.3)');
            fabric.util.animate({
                startValue: up ? 0 : 1,
                endValue: up ? 1 : 0,
                easing: fabric.util.ease.easeOutCubic,
                byValue: undefined,
                duration: 100,
                onChange: (value) => {
                    const offset = 1 * value;
                    target.setShadow(`${offset}px ${offset}px ${10 * value}px rgba(0,0,0,0.3)`);
                    target.scale(1 + 0.1 * value);
                    target.canvas.requestRenderAll();
                },
            });
        }
        toJson() {
            return JSON.stringify(this.config);
        }
    }

    /// <reference path="../typings.d.ts" />
    const CONTEXT$2 = "concept-aspect";
    const db$1 = new Database();
    const factory$1 = new Factory(db$1);
    const ASPECT = Symbol.for("ASPECT");
    function normalize$2(node) {
        if ("context" in node) {
            if (node.context !== CONTEXT$2)
                throw "Bad context value";
        }
        else {
            node.context = CONTEXT$2;
        }
        return node;
    }
    function getAspect(obj) {
        if (obj == undefined)
            return undefined;
        if (obj instanceof Shape)
            return obj;
        if (obj instanceof fabric.Object)
            return obj[ASPECT];
        if (factory$1.inStock(CONTEXT$2, obj.type, obj.id))
            return factory$1.make(CONTEXT$2, obj.type, obj.id);
        const options = obj.context == CONTEXT$2
            ? obj
            : {
                context: CONTEXT$2,
                type: obj.type,
                id: obj.id,
                data: obj,
            };
        if (!isFinite(options.x))
            options.x = 0;
        if (!isFinite(options.y))
            options.y = 0;
        const shape = factory$1.make(options);
        // shape.events = arguments.events
        // Object.assign ( shape, events )
        //shape.init ()
        shape.group[ASPECT] = shape;
        if (shape.config.onCreate)
            shape.config.onCreate(shape.config.data, shape);
        return shape;
    }
    function setAspect(node) {
        db$1.set(normalize$2(node));
    }
    function defineAspect(ctor, type) {
        factory$1._define(ctor, [CONTEXT$2, type]);
    }

    class Badge extends Shape {
        constructor(options) {
            super(options);
            this.owner = undefined;
            this.position = { angle: 0, offset: 0 };
            // }
            // init ()
            // {
            //      super.init ()
            const { group } = this;
            const entity = getData(this.config.data);
            const text = new fabric.Textbox(entity.emoji || "X", {
                fontSize: this.displaySize(),
                originX: "center",
                originY: "center",
                left: group.left,
                top: group.top,
            });
            group.addWithUpdate(text);
        }
        displaySize() {
            return 20;
        }
        attach(target, pos = {}) {
            const { random, PI } = Math;
            if (!isFinite(pos.angle))
                pos.angle = random() * PI * 2;
            if (!isFinite(pos.offset))
                pos.offset = 0.1;
            this.position = Object.assign({}, pos);
            if (this.owner != undefined)
                target.group.remove(this.group);
            target.group.add(this.group);
            this.owner = target;
            this.updatePosition();
        }
        updatePosition() {
            const { position: pos, owner } = this;
            if (owner == undefined)
                return;
            const { random, PI, cos, sin } = Math;
            const rad = pos.angle || random() * PI * 2;
            const x = sin(rad);
            const y = cos(rad);
            const s = owner.displaySize() / 2;
            const offset = typeof pos.offset == "number"
                ? this.displaySize() * pos.offset
                : this.displaySize() * 0.1;
            this.setPosition(x * (s + offset), y * (s + offset));
        }
    }

    class Container$1 extends Shape {
        constructor(options) {
            super(options);
            this.display_size = 1;
            this.children = [];
            // }
            // init ()
            // {
            //      super.init ()
            const entity = this.config.data;
            //for ( const child of Object.values ( entity.children ) )
            for (const child of Object.values(entity.items)) {
                const a = getAspect(child);
                //a.init ()
                this.add(a);
            }
            this.pack();
        }
        displaySize() {
            const config = this.config;
            var size = (this.display_size + config.sizeOffset) * config.sizeFactor;
            if (size < config.minSize)
                size = config.minSize;
            return size || 1;
        }
        add(child) {
            const { group } = this;
            this.children.push(child);
            if (group) {
                group.add(child.group);
                group.setCoords();
            }
        }
        pack() {
            const { group, children, config } = this;
            const positions = [];
            for (const c of children) {
                const g = c.group;
                const r = (g.width > g.height ? g.width : g.height) / 2;
                positions.push({ x: g.left, y: g.top, r: r + 6 });
            }
            const size = packEnclose(positions) * 2;
            for (var i = 0; i < children.length; i++) {
                const g = children[i].group;
                const p = positions[i];
                g.left = p.x;
                g.top = p.y;
                group.add(g);
            }
            this.display_size = size + config.sizeOffset;
            this.updateSize();
        }
    }

    const addCommand = Commands.current.add.bind(Commands.current);
    const runCommand = Commands.current.run.bind(Commands.current);
    const hasCommand = Commands.current.has.bind(Commands.current);
    const onCommand = Commands.current.on.bind(Commands.current);
    const removeCommand = Commands.current.remove.bind(Commands.current);

    defineAspect(Shape, "person" /* , { onCreate: () => ..., onTouch: () => ... } */);
    defineAspect(Container$1, "skill");
    defineAspect(Badge, "badge");
    setAspect({
        type: "person",
        id: undefined,
        data: undefined,
        shape: "circle",
        x: 0,
        y: 0,
        minSize: 30,
        sizeFactor: 1,
        sizeOffset: 0,
        borderColor: "#00c0aa",
        borderWidth: 4,
        backgroundColor: "transparent",
        backgroundImage: undefined,
        backgroundRepeat: false,
        onCreate: (person, aspect) => {
            aspect.setBackground({
                backgroundImage: person.avatar,
                shape: person.isCaptain ? "square" : "circle",
            });
        },
        onDelete: undefined,
        onTouch: undefined,
    });
    setAspect({
        type: "skill",
        id: undefined,
        data: undefined,
        shape: "circle",
        x: 0,
        y: 0,
        borderColor: "#f1bc31",
        borderWidth: 8,
        backgroundColor: "#FFFFFF",
        backgroundImage: undefined,
        backgroundRepeat: false,
        minSize: 50,
        sizeOffset: 10,
        sizeFactor: 1,
        onCreate(skill, aspect) {
            const data = getData({
                type: "badge",
                id: skill.icon,
            });
            const badge = getAspect(data);
            //badge.init ()
            badge.attach(aspect);
        },
        onTouch(shape) {
            const skill = getData({
                type: shape.config.type,
                id: shape.config.id
            });
            runCommand("open-infos-panel", skill);
        },
        onDelete: undefined
    });
    setAspect({
        type: "badge",
        id: undefined,
        data: undefined,
        x: 0,
        y: 0,
        minSize: 1,
        sizeFactor: 1,
        sizeOffset: 0,
        shape: "circle",
        borderColor: "gray",
        borderWidth: 0,
        backgroundColor: "transparent",
        backgroundImage: undefined,
        backgroundRepeat: false,
        onCreate: undefined,
        onDelete: undefined,
        onTouch: undefined,
    });

    //export const menu = createMenu ()
    //document.body.append ( ... menu.elements () )
    const menu = make({
        context: "concept-ui",
        type: "side-menu",
        id: "menu",
        hasMainButton: true,
        direction: "lr"
    });
    document.body.append(...menu.getHtml());
    //addCommand ( "open-menu", () => { menu.open () })
    //addCommand ( "close-menu", () => { menu.close () })

    class SkillInfos extends Component {
        display(skill) {
            const target = xnode("div", { class: "people" });
            for (const name of skill.items) {
                const person = getData(name);
                const card = xnode("div", { class: "w3-card-4 person-card" },
                    xnode("img", { src: person.avatar, alt: "Avatar" }),
                    xnode("div", { class: "w3-container" },
                        xnode("h4", null,
                            xnode("b", null, person.firstName)),
                        xnode("label", null,
                            xnode("b", null, person.isCaptain ? "Expert" : null))));
                target.append(card);
            }
            this.container.innerHTML = "";
            this.container.append(xnode("h1", null, skill.id));
            this.container.append(xnode("p", null, skill.description));
            this.container.append(target);
            // https://github.com/LorDOniX/json-viewer/blob/master/src/json-viewer.js
            this.container.append(xnode("pre", null, JSON.stringify(skill, null, 3)));
        }
    }
    //factory.define ( SkillInfos, {
    //     context: "concept-aspect",
    //     type   : "skill",
    //     id     : undefined,
    //})
    define(SkillInfos, ["concept-infos", "data"]);
    define(SkillInfos, ["console", "app-console"]);

    var direction = "rl";
    const panel = make({
        context: "concept-ui",
        type: "side-menu",
        id: undefined,
        direction: direction,
        hasMainButton: true,
        header: {
            context: "concept-ui",
            type: "toolbar",
            id: undefined,
            title: "Title ..",
            direction:  "tb" ,
            buttons: [{
                    context: "concept-ui",
                    type: "button",
                    id: "console",
                    icon: "⚠",
                    text: "",
                    handleOn: "*",
                    command: "pack-view"
                }, {
                    context: "concept-ui",
                    type: "button",
                    id: "properties",
                    icon: "",
                    text: "panel properties",
                    handleOn: "*",
                }]
        },
        children: [{
                context: "concept-ui",
                type: "slideshow",
                id: "panel-slideshow",
                children: [{
                        context: "concept-ui",
                        type: "skill-viewer",
                        id: "slide-skill"
                    }, {
                        context: "concept-ui",
                        type: "person-viewer",
                        id: "slide-person"
                    }]
            }]
    });
    document.body.append(...panel.getHtml());
    const slideshow = pick("slideshow", "panel-slideshow");
    const slideInfos = pick("skill-viewer", "slide-skill");
    addCommand("open-panel", (name, ...content) => {
        if (name)
            slideshow.show(name, ...content);
        else
            panel.open();
    });
    addCommand("open-infos-panel", (data) => {
        if (data) {
            slideInfos.display(data);
            panel.open();
        }
    });
    addCommand("close-panel", () => {
        panel.close();
    });

    /*
    example:
    https://prezi.com/p/9jqe2wkfhhky/la-bulloterie-tpcmn/
    https://movilab.org/index.php?title=Utilisateur:Aur%C3%A9lienMarty
    */
    fabric.Object.prototype.padding = 0;
    fabric.Object.prototype.objectCaching = false;
    fabric.Object.prototype.hasControls = true;
    fabric.Object.prototype.hasBorders = true;
    fabric.Object.prototype.hasRotatingPoint = false;
    fabric.Object.prototype.transparentCorners = false;
    fabric.Object.prototype.centeredScaling = true;
    fabric.Object.prototype.cornerStyle = "circle";
    fabric.Object.prototype.setControlVisible("ml", false);
    fabric.Object.prototype.setControlVisible("mt", false);
    fabric.Object.prototype.setControlVisible("mr", false);
    fabric.Object.prototype.setControlVisible("mb", false);
    fabric.Object.prototype.setControlVisible("tl", false);
    fabric.Object.prototype.setControlVisible("bl", false);
    fabric.Object.prototype.setControlVisible("br", false);
    class Area {
        constructor(canvas) {
            this.views = {};
            this.overFObject = undefined;
            this.onOverObject = null;
            this.onOutObject = null;
            this.onTouchObject = null;
            this.onDoubleTouchObject = null;
            this.onTouchArea = null;
            this.fcanvas = new fabric.Canvas(canvas);
            this.enableEvents();
        }
        get view() {
            return this.active;
        }
        createView(name) {
            const { views } = this;
            if (name in views)
                throw "The view already exists";
            return views[name] = {
                name,
                active: false,
                children: [],
                packing: "enclose",
                thumbnail: null,
            };
        }
        use(name) {
            const { fcanvas, views } = this;
            if (typeof name != "string")
                name = name.name;
            if (this.active && this.active.name == name)
                return;
            if (!(name in views))
                return;
            const active = this.active = views[name];
            fcanvas.clear();
            for (const shape of active.children)
                fcanvas.add(shape.group);
            return active;
        }
        add() {
            const { active, fcanvas } = this;
            if (arguments.length == 0)
                return;
            if (typeof arguments[0] == "string") {
                const node = getData(...arguments);
                const shp = getAspect(node);
                active.children.push(shp);
                fcanvas.add(shp.group);
            }
            else
                for (const s of arguments) {
                    const shp = getAspect(s);
                    // shp.getFabric
                    // shp.getHtml
                    // shp.getSvg
                    // factory
                    active.children.push(shp);
                    fcanvas.add(shp.group);
                }
            fcanvas.requestRenderAll();
        }
        clear() {
            this.fcanvas.clear();
        }
        pack() {
            const { fcanvas } = this;
            const objects = fcanvas.getObjects();
            const positions = [];
            for (const g of objects) {
                const r = (g.width > g.height ? g.width : g.height) / 2;
                positions.push({ x: g.left, y: g.top, r: r + 20 });
            }
            packEnclose(positions) * 2;
            for (var i = 0; i < objects.length; i++) {
                const g = objects[i];
                const p = positions[i];
                g.left = p.x;
                g.top = p.y;
                g.setCoords();
            }
            fcanvas.requestRenderAll();
        }
        zoom(factor) {
            const { fcanvas } = this;
            if (typeof factor == "number") {
                return;
            }
            const objects = fcanvas.getObjects();
            if (typeof factor == "object") {
                const o = factor.group;
                var left = o.left - o.width;
                var right = o.left + o.width;
                var top = o.top - o.height;
                var bottom = o.top + o.height;
            }
            else {
                var left = 0;
                var right = 0;
                var top = 0;
                var bottom = 0;
                for (const o of objects) {
                    const l = o.left - o.width;
                    const r = o.left + o.width;
                    const t = o.top - o.height;
                    const b = o.top + o.height;
                    if (l < left)
                        left = l;
                    if (r > right)
                        right = r;
                    if (t < top)
                        top = t;
                    if (b > bottom)
                        bottom = b;
                }
            }
            const w = right - left;
            const h = bottom - top;
            const vw = fcanvas.getWidth();
            const vh = fcanvas.getHeight();
            const f = w > h
                ? (vw < vh ? vw : vh) / w
                : (vw < vh ? vw : vh) / h;
            fcanvas.viewportTransform[0] = f;
            fcanvas.viewportTransform[3] = f;
            const cx = left + w / 2;
            const cy = top + h / 2;
            fcanvas.viewportTransform[4] = -(cx * f) + vw / 2;
            fcanvas.viewportTransform[5] = -(cy * f) + vh / 2;
            for (const o of objects)
                o.setCoords();
            fcanvas.requestRenderAll();
        }
        isolate(shape) {
            for (const o of this.fcanvas.getObjects()) {
                o.visible = false;
            }
            shape.group.visible = true;
        }
        getThumbnail() {
            const { active: cview } = this;
            const thumbnail = cview.thumbnail;
            if (thumbnail || cview.active == false)
                ;
            return cview.thumbnail = this.fcanvas.toDataURL({ format: "jpeg" });
        }
        // UI EVENTS
        enableEvents() {
            this.initClickEvent();
            this.initOverEvent();
            this.initPanEvent();
            this.initZoomEvent();
            //this.initMoveObject ()
            //this.initDragEvent  ()
            window.addEventListener("resize", this.responsive.bind(this));
        }
        responsive() {
            var width = (window.innerWidth > 0) ? window.innerWidth : screen.width;
            var height = (window.innerHeight > 0) ? window.innerHeight : screen.height;
            this.fcanvas.setDimensions({
                width: width,
                height: height
            });
        }
        initClickEvent() {
            const page = this.fcanvas;
            const max_clich_area = 25 * 25;
            var last_click = -1;
            var last_pos = { x: -9999, y: -9999 };
            page.on("mouse:down", fevent => {
                console.log("mouse:down");
                const now = Date.now();
                const pos = fevent.pointer;
                const reset = () => {
                    last_click = now;
                    last_pos = pos;
                };
                // Nous vérifions que soit un double-clique.
                if (500 < now - last_click) {
                    if (this.onTouchObject) {
                        const element = getAspect(fevent.target);
                        if (element)
                            this.onTouchObject(element);
                        fevent.e.stopImmediatePropagation();
                        return;
                    }
                    else {
                        return reset();
                    }
                }
                // Nous vérifions que les deux cliques se trouve dans une région proche.
                const zone = (pos.x - last_pos.x) * (pos.y - last_pos.y);
                if (zone < -max_clich_area || max_clich_area < zone)
                    return reset();
                // Si le pointer est au-dessus d’une forme.
                if (fevent.target != undefined) {
                    if (this.onDoubleTouchObject) {
                        const element = getAspect(fevent.target);
                        if (element)
                            this.onDoubleTouchObject(element);
                    }
                    last_click = -1;
                }
                // Si le pointer est au-dessus d’une zone vide.
                else {
                    if (this.onTouchArea)
                        this.onTouchArea(pos.x, pos.y);
                }
                fevent.e.stopImmediatePropagation();
                return;
            });
        }
        initOverEvent() {
            const page = this.fcanvas;
            page.on("mouse:over", fevent => {
                this.overFObject = fevent.target;
                if (this.onOverObject) {
                    const element = getAspect(fevent.target);
                    if (element)
                        this.onOverObject(element);
                }
            });
            page.on("mouse:out", fevent => {
                this.overFObject = undefined;
                if (this.onOutObject) {
                    const element = getAspect(fevent.target);
                    if (element)
                        this.onOutObject(element);
                }
            });
        }
        initPanEvent() {
            const page = this.fcanvas;
            var isDragging = false;
            var lastPosX = -1;
            var lastPosY = -1;
            page.on("mouse:down", fevent => {
                if (this.overFObject == undefined) {
                    page.selection = false;
                    page.discardActiveObject();
                    page.forEachObject(o => { o.selectable = false; });
                    isDragging = true;
                    lastPosX = fevent.pointer.x;
                    lastPosY = fevent.pointer.y;
                    page.requestRenderAll();
                }
            });
            page.on("mouse:move", fevent => {
                if (isDragging) {
                    const pointer = fevent.pointer;
                    page.viewportTransform[4] += pointer.x - lastPosX;
                    page.viewportTransform[5] += pointer.y - lastPosY;
                    page.requestRenderAll();
                    lastPosX = pointer.x;
                    lastPosY = pointer.y;
                }
            });
            page.on("mouse:up", () => {
                page.selection = true;
                page.forEachObject(o => {
                    o.selectable = true;
                    o.setCoords();
                });
                isDragging = false;
                page.requestRenderAll();
            });
        }
        initZoomEvent() {
            const page = this.fcanvas;
            page.on("mouse:wheel", fevent => {
                const event = fevent.e;
                var delta = event.deltaY;
                var zoom = page.getZoom();
                zoom = zoom - delta * 0.005;
                if (zoom > 9)
                    zoom = 9;
                if (zoom < 0.5)
                    zoom = 0.5;
                page.zoomToPoint(new fabric.Point(event.offsetX, event.offsetY), zoom);
                event.preventDefault();
                event.stopPropagation();
                page.requestRenderAll();
            });
        }
        initMoveObject() {
            const page = this.fcanvas;
            var cluster = undefined;
            var positions = undefined;
            var originX = 0;
            var originY = 0;
            function on_selection(fevent) {
                const target = fevent.target;
                console.log(target);
                cluster = target["cluster"];
                if (cluster == undefined)
                    return;
                originX = target.left;
                originY = target.top;
                positions = [];
                for (const o of cluster)
                    positions.push([o.left, o.top]);
                console.log("created");
            }
            page.on("selection:created", on_selection);
            page.on("selection:updated", on_selection);
            page.on("object:moving", fevent => {
                if (cluster == undefined)
                    return;
                const target = fevent.target;
                const offsetX = target.left - originX;
                const offsetY = target.top - originY;
                for (var i = 0; i < cluster.length; i++) {
                    const obj = cluster[i];
                    const pos = positions[i];
                    obj.set({
                        left: pos[0] + offsetX,
                        top: pos[1] + offsetY
                    });
                }
            });
            page.on("selection:cleared", fevent => {
                cluster = undefined;
                console.log("cleared");
            });
        }
        initDragEvent() {
            // https://www.w3schools.com/html/html5_draganddrop.asp
            // https://github.com/Shopify/draggable/blob/master/src/Draggable/Draggable.js
            const page = this.fcanvas;
            page.on("touch:drag", fevent => {
                //console.log ( fevent )
                console.log("touch:drag");
            });
            page.on("dragenter", fevent => {
                //console.log ( "DROP-ENTER", fevent )
            });
            page.on("dragover", fevent => {
                //console.log ( "DROP-OVER", fevent )
            });
            page.on("drop", fevent => {
                //const e = fevent.e as DragEvent
                //console.log ( "DROP", e.dataTransfer.getData ("text") )
            });
        }
    }

    const area = (() => {
        const canvas = document.createElement("canvas");
        canvas.width = document.body.clientWidth;
        canvas.height = document.body.clientHeight;
        document.body.append(canvas);
        return new Area(canvas);
    })();
    const contextualMenu = new RadialMenu({
        context: "concept-ui",
        type: "radial-menu",
        id: "area-menu",
        buttons: [
            { type: "button", id: "add-thing", text: "", icon: "&#xe3c8;", fontFamily: "Material Icons", callback: () => { runCommand("zoom-extends"); } },
            { type: "button", id: "add-bubble", text: "", icon: "&#xe6dd;", fontFamily: "Material Icons" },
            { type: "button", id: "add-note", text: "", icon: "&#xe244;", fontFamily: "Material Icons", command: "pack-view" },
            { type: "button", id: "add-people", text: "", icon: "&#xe87c;", fontFamily: "Material Icons" },
            { type: "button", id: "add-tag", text: "", icon: "&#xe867;", fontFamily: "Material Icons" },
        ],
        rotation: Math.PI / 2,
    });
    document.body.append(...contextualMenu.getHtml());
    addCommand("open-contextal-menu", (x, y) => {
        contextualMenu.show(x, y);
    });
    addCommand("close-contextal-menu", () => {
        contextualMenu.hide();
    });
    addCommand("add-skill", (title) => {
        console.log("Add skill");
    });
    addCommand("add-person", (name) => {
    });
    addCommand("zoom-extends", () => {
        area.zoom();
    });
    addCommand("zoom-to", (shape) => {
        area.zoom(shape);
        area.isolate(shape);
    });
    addCommand("pack-view", () => {
        area.pack();
    });
    // CLICK EVENTS
    // area.onTouchObject = ( shape ) =>
    // {
    //      runCommand ( "zoom-to", shape )
    // }
    area.onDoubleTouchObject = (shape) => {
        if (shape.config.onTouch != undefined)
            shape.config.onTouch(shape);
    };
    area.onTouchArea = (x, y) => {
        runCommand("open-contextal-menu", x, y);
    };
    // HOVER EVENTS
    area.onOverObject = (shape) => {
        shape.hover(true);
        area.fcanvas.requestRenderAll();
    };
    area.onOutObject = (shape) => {
        shape.hover(false);
        area.fcanvas.requestRenderAll();
    };
    // TEST
    if (navigator.maxTouchPoints > 0) {
        window.addEventListener("pointermove", event => {
            //const target = area.fcanvas.findTarget ( event, true )
            //if ( target )
            //     console.log ( target )
        });
    }
    else {
        window.addEventListener("mousemove", event => {
            //const target = area.fcanvas.findTarget ( event, true )
            //if ( target )
            //     console.log ( target )
        });
    }

    onCommand("open-menu", () => {
        panel.close();
        contextualMenu.hide();
    });
    onCommand("open-panel", () => {
        menu.close();
        contextualMenu.hide();
    });

    /// <reference types="faker" />
    const randomInt = (min, max) => {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };
    const area$1 = area;
    const view = area$1.createView("compétances");
    area$1.use(view);
    // Person
    const personNames = [];
    for (var i = 1; i <= 20; i++) {
        setData({
            type: "person",
            id: "user" + i,
            firstName: faker.name.firstName(),
            lastName: faker.name.lastName(),
            avatar: `./avatars/f (${i}).jpg`,
            isCaptain: randomInt(0, 4) == 1 //i % 4 == 0,
        });
        setData({
            type: "person",
            id: "user" + (20 + i),
            firstName: faker.name.firstName(),
            lastName: faker.name.lastName(),
            avatar: `./avatars/h (${i}).jpg`,
            isCaptain: randomInt(0, 4) == 1 // (20 + i) % 4 == 0,
        });
        personNames.push("user" + i, "user" + (20 + i));
        // area.add ( "person", "user" + i )
        // area.add ( "person", "user" + (i + 20) )
    }
    // Badges
    // https://drive.google.com/drive/folders/1KwWl9G_A8v91NLXApjZGHCfnx_mnfME4
    // https://reconnaitre.openrecognition.org/ressources/
    // https://www.letudiant.fr/educpros/actualite/les-open-badges-un-complement-aux-diplomes-universitaires.html
    // https://www.echosciences-normandie.fr/communautes/le-dome/articles/badge-dome
    const badgePresets = {
        default: { id: "default", emoji: "🦁" },
        hat: { id: "hat", emoji: "🎩" },
        star: { id: "star", emoji: "⭐" },
        clothes: { id: "clothes", emoji: "👕" },
        ecology: { id: "ecology", emoji: "💧" },
        programming: { id: "programming", emoji: "💾" },
        communication: { id: "communication", emoji: "📢" },
        construction: { id: "construction", emoji: "🔨" },
        biology: { id: "biology", emoji: "🔬" },
        robotic: { id: "robotic", emoji: "🤖" },
        game: { id: "game", emoji: "🤡" },
        music: { id: "music", emoji: "🥁" },
        lion: { id: "lion", emoji: "🦁" },
        voltage: { id: "voltage", emoji: "⚡" },
    };
    for (const name in badgePresets)
        setData(Object.assign({ context: "concept-data", type: "badge" }, badgePresets[name]));
    // Skills
    for (const name in badgePresets) {
        const people = [];
        for (var j = randomInt(0, 6); j > 0; j--) {
            const name = personNames.splice(randomInt(1, personNames.length), 1)[0];
            if (name)
                people.push(getData("person", name));
        }
        setData({
            context: "concept-data",
            type: "skill",
            id: name,
            icon: name,
            items: people
        });
    }
    //
    for (const name in badgePresets)
        area$1.add("skill", name);
    // Notes
    // const note =  new B.Note ({
    //      text: "A note ...",
    // })
    // area.add ( Aspect.create ( note ) )
    area$1.pack();
    area$1.zoom();
    // Cluster -----------------------------------------------------------------
    //
    // const t1 = new fabric.Textbox ( "Editable ?", {
    //      top: 50,
    //      left: 300,
    //      fontSize: 30,
    //      selectable: true,
    //      editable: true,
    //      originX: "center",
    //      originY: "center",
    // })
    // const r1 = new fabric.Rect ({
    //      top   : 0,
    //      left  : 300,
    //      width : 50,
    //      height: 50,
    //      fill  : "blue",
    //      selectable: true,
    //      originX: "center",
    //      originY: "center",
    // })
    // $app._layout.area.add (t1)
    // $app._layout.area.add (r1)
    // t1["cluster"] = [ r1 ]
    // r1["cluster"] = [ t1 ]

}());
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzIjpbIi4uLy4uL0xpYi9ldmVudC50cyIsIi4uLy4uL0xpYi9udW1iZXIudHMiLCIuLi8uLi9MaWIvZ2VvbWV0cnkvZGlzdHJpYnV0ZS50cyIsIi4uLy4uL0xpYi9nZW9tZXRyeS9kMy1lbmNsb3NlLnRzIiwiLi4vLi4vTGliL2dlb21ldHJ5L2QzLXBhY2sudHMiLCIuLi8uLi9MaWIvY3NzL3VuaXQudHMiLCIuLi8uLi9EYXRhL0RhdGEvbm9kZS50cyIsIi4uLy4uL0RhdGEvRGIvZGF0YS10cmVlLnRzIiwiLi4vLi4vRGF0YS9EYi9kYi50cyIsIi4uLy4uL0RhdGEvRGIvZmFjdG9yeS50cyIsIi4uLy4uL1VpL0Jhc2UveG5vZGUudHMiLCIuLi8uLi9VaS9CYXNlL2RyYWdnYWJsZS50cyIsIi4uLy4uL1VpL0Jhc2UvZG9tLnRzIiwiLi4vLi4vVWkvQmFzZS9leHBlbmRhYmxlLnRzIiwiLi4vLi4vVWkvQmFzZS9zd2lwZWFibGUudHMiLCIuLi8uLi9VaS9CYXNlL2NvbW1hbmQudHMiLCIuLi8uLi9VaS9CYXNlL0NvbXBvbmVudC9pbmRleC50c3giLCIuLi8uLi9VaS9kYi50cyIsIi4uLy4uL1VpL0NvbXBvbmVudC9QaGFudG9tL2luZGV4LnRzeCIsIi4uLy4uL1VpL0Jhc2UvQ29udGFpbmVyL2luZGV4LnRzeCIsIi4uLy4uL1VpL0NvbXBvbmVudC9CYXIvaW5kZXgudHN4IiwiLi4vLi4vVWkvQ29tcG9uZW50L0J1dHRvbi9odG1sLnRzeCIsIi4uLy4uL1VpL0NvbXBvbmVudC9CdXR0b24vaW5kZXgudHN4IiwiLi4vLi4vVWkvQ29tcG9uZW50L1NsaWRlc2hvdy9pbmRleC50c3giLCIuLi8uLi9VaS9Db21wb25lbnQvTGlzdC9pbmRleC50c3giLCIuLi8uLi9VaS9Db21wb25lbnQvVG9vbGJhci9pbmRleC50c3giLCIuLi8uLi9VaS9CYXNlL3Njcm9sbGFibGUudHMiLCIuLi8uLi9VaS9Db21wb25lbnQvUGFuZWwvaW5kZXgudHN4IiwiLi4vLi4vVWkvQ29tcG9uZW50L1NpZGVNZW51L2luZGV4LnRzeCIsIi4uLy4uL1VpL0Jhc2UvU3ZnL2luZGV4LnRzeCIsIi4uLy4uL1VpL0NvbXBvbmVudC9DaXJjdWxhci1NZW51L2luZGV4LnRzeCIsIi4uLy4uL1VpL0VudGl0eS9QZXJzb24vaW5mb3MudHN4IiwiLi4vLi4vQXBwbGljYXRpb24vRGF0YS9kYi50cyIsIi4uLy4uL1VpL0VudGl0eS9Ta2lsbC9pbmZvcy50c3giLCIuLi8uLi9BcHBsaWNhdGlvbi9Bc3BlY3QvR2VvbWV0cnkvZmFjdG9yeS50cyIsIi4uLy4uL0FwcGxpY2F0aW9uL0FzcGVjdC9HZW9tZXRyeS9nZW9tZXRyeS50cyIsIi4uLy4uL0FwcGxpY2F0aW9uL0FzcGVjdC9FbGVtZW50L3NoYXBlLnRzIiwiLi4vLi4vQXBwbGljYXRpb24vQXNwZWN0L2RiLnRzIiwiLi4vLi4vQXBwbGljYXRpb24vQXNwZWN0L0VsZW1lbnQvYmFkZ2UudHMiLCIuLi8uLi9BcHBsaWNhdGlvbi9Bc3BlY3QvRWxlbWVudC9ncm91cC50cyIsIi4uLy4uL0FwcGxpY2F0aW9uL2NvbW1hbmQudHMiLCIuLi8uLi9BcHBsaWNhdGlvbi9Bc3BlY3QvaW5kZXgudHMiLCIuLi8uLi9BcHBsaWNhdGlvbi9tZW51LnRzIiwiLi4vLi4vQXBwbGljYXRpb24vQ29tcG9uZW50L2luZm9zLnRzeCIsIi4uLy4uL0FwcGxpY2F0aW9uL3BhbmVsLnRzIiwiLi4vLi4vVWkvQ29tcG9uZW50L0FyZWEvYXJlYS50cyIsIi4uLy4uL0FwcGxpY2F0aW9uL2FyZWEudHMiLCIuLi8uLi9BcHBsaWNhdGlvbi9pbmRleC50cyIsIi4uL2luZGV4LnRzIl0sInNvdXJjZXNDb250ZW50IjpbIlxuXG5leHBvcnQgaW50ZXJmYWNlIElFdmVudCA8RiBleHRlbmRzICggLi4uYXJnczogYW55W10gKSA9PiB2b2lkID0gKCkgPT4gdm9pZD5cbntcbiAgICAoIGNhbGxiYWNrOiBGICk6IHZvaWRcbiAgICBlbmFibGUgKCk6IHRoaXNcbiAgICBkaXNhYmxlICgpOiB0aGlzXG4gICAgZGlzcGF0Y2ggKCAuLi5hcmdzOiBQYXJhbWV0ZXJzIDxGPiApOiB0aGlzXG4gICAgcmVtb3ZlICggY2FsbGJhY2s6IEYgKTogdGhpc1xuICAgIGNvdW50ICgpOiBudW1iZXJcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZSA8RiBleHRlbmRzICgoIC4uLmFyZ3M6IGFueVtdICkgPT4gdm9pZCkgPSAoKCkgPT4gdm9pZCk+ICgpOiBJRXZlbnQgPEY+XG57XG4gICAgY29uc3QgcmVnaXN0ZXIgPSBbXSBhcyBGW11cbiAgICB2YXIgICBlbmFibGVkICA9IHRydWVcblxuICAgIGNvbnN0IHNlbGYgPSBmdW5jdGlvbiAoIGNhbGxiYWNrOiBGIClcbiAgICB7XG4gICAgICAgIHJlZ2lzdGVyLnB1c2ggKCBjYWxsYmFjayApIC0gMVxuXG4gICAgICAgIHJldHVybiBzZWxmXG4gICAgfVxuXG4gICAgc2VsZi5jb3VudCA9ICgpID0+XG4gICAge1xuICAgICAgICByZXR1cm4gcmVnaXN0ZXIubGVuZ3RoXG4gICAgfVxuXG4gICAgc2VsZi5kaXNhYmxlID0gKCkgPT5cbiAgICB7XG4gICAgICAgIGVuYWJsZWQgPSBmYWxzZVxuXG4gICAgICAgIHJldHVybiBzZWxmXG4gICAgfVxuXG4gICAgc2VsZi5lbmFibGUgPSAoKSA9PlxuICAgIHtcbiAgICAgICAgZW5hYmxlZCA9IHRydWVcblxuICAgICAgICByZXR1cm4gc2VsZlxuICAgIH1cblxuICAgIHNlbGYuYXBwZW5kID0gKCBjYWxsYmFjazogRiApID0+XG4gICAge1xuICAgICAgICBzZWxmICggY2FsbGJhY2sgKVxuXG4gICAgICAgIHJldHVybiBzZWxmXG4gICAgfVxuXG4gICAgc2VsZi5yZW1vdmUgPSAoIGNhbGxiYWNrOiBGICkgPT5cbiAgICB7XG4gICAgICAgIGNvbnN0IGluZGV4ID0gcmVnaXN0ZXIuaW5kZXhPZiAoIGNhbGxiYWNrIClcblxuICAgICAgICBpZiAoIGluZGV4ICE9IC0xIClcbiAgICAgICAgICAgIHJlZ2lzdGVyLnNwbGljZSAoIGluZGV4LCAxIClcblxuICAgICAgICByZXR1cm4gc2VsZlxuICAgIH1cblxuICAgIHNlbGYucmVtb3ZlQWxsID0gKCkgPT5cbiAgICB7XG4gICAgICAgIHJlZ2lzdGVyLnNwbGljZSAoMClcblxuICAgICAgICByZXR1cm4gc2VsZlxuICAgIH1cblxuICAgIHNlbGYuZGlzcGF0Y2ggPSAoIC4uLmFyZ3M6IFBhcmFtZXRlcnMgPEY+ICkgPT5cbiAgICB7XG4gICAgICAgIGlmICggZW5hYmxlZCApXG4gICAgICAgIHtcbiAgICAgICAgICAgIGZvciggdmFyIGZuIG9mIHJlZ2lzdGVyIClcbiAgICAgICAgICAgICAgICBmbiAoIC4uLiBhcmdzIClcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBzZWxmXG4gICAgfVxuXG4gICAgcmV0dXJuIHNlbGZcbn1cblxuIiwiXG5jb25zdCB7IG1pbiwgbWF4IH0gPSBNYXRoXG5cbmV4cG9ydCBmdW5jdGlvbiBsaW1pdGVkVmFsdWVzICggbWluOiBudW1iZXIgW10sIG1heDogbnVtYmVyIFtdIClcbntcbiAgICAgaWYgKCBtaW4ubGVuZ3RoIDwgbWF4Lmxlbmd0aCApXG4gICAgICAgICAgbWF4ID0gbWF4LnNsaWNlICggMCwgbWluLmxlbmd0aCApXG4gICAgIGVsc2VcbiAgICAgICAgICBtaW4gPSBtaW4uc2xpY2UgKCAwLCBtYXgubGVuZ3RoICApXG5cbiAgICAgY29uc3QgY291bnQgPSBtaW4ubGVuZ3RoXG4gICAgIGNvbnN0IHJhbmdlcyA9IFtdIGFzIG51bWJlciBbXVxuXG4gICAgIGZvciAoIHZhciBpID0gMCA7IGkgIT0gY291bnQgOyBpKysgKVxuICAgICAgICAgIHJhbmdlcy5wdXNoICggbWF4IFtpXSAtIG1pbiBbaV0gKVxuXG4gICAgIHJldHVybiAoIG51bXM6IG51bWJlciApID0+XG4gICAgIHtcbiAgICAgICAgICBjb25zdCByZXN1bHQgPSBbXSBhcyBudW1iZXIgW11cblxuICAgICAgICAgIGZvciAoIHZhciBpID0gMCA7IGkgIT0gY291bnQgOyBpKysgKVxuICAgICAgICAgICAgICAgcmVzdWx0LnB1c2ggKCBtaW4gW2ldICsgcmFuZ2VzIFtpXSAqIG51bXMgKVxuXG4gICAgICAgICAgcmV0dXJuIHJlc3VsdFxuICAgICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjbGFtcCAgKCB2YWx1ZTogbnVtYmVyLCBzdGFydDogbnVtYmVyLCBlbmQ6IG51bWJlciApOiBudW1iZXJcbntcbiAgICAgcmV0dXJuIG1pbiAoIG1heCggdmFsdWUsIHN0YXJ0ICksIGVuZCApXG59XG5cblxuZGVjbGFyZSBtb2R1bGUgZ2xvYmFsXG57XG4gICAgIGV4cG9ydCBpbnRlcmZhY2UgTnVtYmVyQ29uc3RydWN0b3JcbiAgICAge1xuICAgICAgICAgIHdyYXBTdHJpbmdWYWx1ZSAoXG4gICAgICAgICAgICAgICB2YWx1ZSAgICAgOiBudW1iZXIgfCBzdHJpbmcgfCAobnVtYmVyIHwgc3RyaW5nKSBbXSxcbiAgICAgICAgICAgICAgIGRlY29tcG9zZT86ICggdmFsdWU6IHN0cmluZyApID0+IHsgbnVtYmVyczogbnVtYmVyIFtdLCByZWNvbXBvc2U6ICgpID0+IHN0cmluZyB9LFxuICAgICAgICAgICAgICAgbWluVmFsdWU/IDogbnVtYmVyIHwgc3RyaW5nIHwgKG51bWJlciB8IHN0cmluZykgW10gfCBudWxsLFxuICAgICAgICAgICAgICAgbWF4VmFsdWU/IDogbnVtYmVyIHwgc3RyaW5nIHwgKG51bWJlciB8IHN0cmluZykgW10gfCBudWxsLFxuICAgICAgICAgICAgICAgb25VcGRhdGU/IDogKCkgPT4gdm9pZFxuICAgICAgICAgICk6IFdyYXBwZWRTdHJpbmdOdW1iZXJcblxuICAgICAgICAgIGRlY29tcG9zZVN0cmluZ1ZhbHVlICggdmFsdWU6IHN0cmluZyApOiB7XG4gICAgICAgICAgICAgICBzdHJpbmdzOiBzdHJpbmcgW10sXG4gICAgICAgICAgICAgICBudW1iZXJzOiBudW1iZXIgW10sXG4gICAgICAgICAgICAgICByZWNvbXBvc2U6ICgpID0+IHN0cmluZ1xuICAgICAgICAgIH1cbiAgICAgfVxufVxuXG5cbmludGVyZmFjZSBXcmFwcGVkU3RyaW5nTnVtYmVyIC8vIGV4dGVuZHMgTXVsdGlwbGVMaW1pdGVkVmFsdWVcbntcbiAgICAgbnVtYmVyczogbnVtYmVyIFtdLFxuICAgICBzZXQgKCB2YWx1ZXM6IG51bWJlciB8IHN0cmluZyB8IChudW1iZXIgfCBzdHJpbmcpIFtdICk6IHRoaXMsXG4gICAgIGxpbWl0ICggbWluPzogbnVtYmVyIHwgc3RyaW5nIHwgKG51bWJlciB8IHN0cmluZykgW10sIG1heD86IG51bWJlciB8IHN0cmluZyB8IChudW1iZXIgfCBzdHJpbmcpIFtdICk6IHRoaXMsXG4gICAgIGZhY3RvciAoIGZhY3RvcnM6IG51bWJlciB8IG51bWJlciBbXSApOiB0aGlzLFxuICAgICByZXNldCAoKTogdGhpcyxcbiAgICAgdG9TdHJpbmcgKCk6IHN0cmluZyxcbn1cblxubW9kdWxlIE51bWJlckxpYlxue1xuICAgICBleHBvcnQgaW50ZXJmYWNlIExpbWl0ZWRWYWx1ZVxuICAgICB7XG4gICAgICAgICAgc2V0ICggdmFsdWU6IG51bWJlciApOiB0aGlzXG4gICAgICAgICAgbGltaXQgKCBtaW4/OiBudW1iZXIsIG1heD86IG51bWJlciApOiB0aGlzXG4gICAgICAgICAgZmFjdG9yICggdmFsdWU6IG51bWJlciApOiB0aGlzXG4gICAgIH1cblxuICAgICBleHBvcnQgZnVuY3Rpb24gbGltaXRlZFZhbHVlICggdmFsdWU6IG51bWJlciwgbWluPzogbnVtYmVyLCBtYXg/OiBudW1iZXIgKVxuICAgICB7XG4gICAgICAgICAgdmFyIGljbGFtcCA9IDBcblxuICAgICAgICAgIGNvbnN0IHNlbGY6IExpbWl0ZWRWYWx1ZSA9IHtcbiAgICAgICAgICAgICAgIGxpbWl0LFxuICAgICAgICAgICAgICAgc2V0LFxuICAgICAgICAgICAgICAgZmFjdG9yLFxuICAgICAgICAgIH1cblxuICAgICAgICAgIGxpbWl0ICggbWluLCBtYXggKVxuXG4gICAgICAgICAgcmV0dXJuIHNlbGZcblxuICAgICAgICAgIGZ1bmN0aW9uIGxpbWl0ICggbWluVmFsdWU/OiBudW1iZXIsIG1heFZhbHVlPzogbnVtYmVyIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBtaW4gPSBtaW5WYWx1ZVxuICAgICAgICAgICAgICAgbWF4ID0gbWF4VmFsdWVcblxuICAgICAgICAgICAgICAgY29uc3QgY2xhbXBTdGFydCA9IE51bWJlci5pc0Zpbml0ZSAoIG1pbiApXG4gICAgICAgICAgICAgICBjb25zdCBjbGFtcEVuZCAgID0gTnVtYmVyLmlzRmluaXRlICggbWF4IClcblxuICAgICAgICAgICAgICAgaWNsYW1wID0gY2xhbXBTdGFydCAmJiBjbGFtcEVuZCA/IDFcbiAgICAgICAgICAgICAgICAgICAgICA6IGNsYW1wU3RhcnQgICAgICAgICAgICAgPyAyXG4gICAgICAgICAgICAgICAgICAgICAgOiBjbGFtcEVuZCAgICAgICAgICAgICAgID8gM1xuICAgICAgICAgICAgICAgICAgICAgIDogMFxuXG4gICAgICAgICAgICAgICByZXR1cm4gc2VsZlxuICAgICAgICAgIH1cblxuICAgICAgICAgIGZ1bmN0aW9uIHNldCAoIG5ld1ZhbHVlOiBudW1iZXIgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHZhbHVlID0gbmV3VmFsdWVcblxuICAgICAgICAgICAgICAgc3dpdGNoICggaWNsYW1wIClcbiAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNhc2UgMTpcbiAgICAgICAgICAgICAgICAgICAgaWYgKCB2YWx1ZSA8IG1pbiApXG4gICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSBtaW5cbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoIHZhbHVlID4gbWF4IClcbiAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IG1heFxuICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgY2FzZSAyOlxuICAgICAgICAgICAgICAgICAgICBpZiAoIHZhbHVlIDwgbWluIClcbiAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IG1pblxuICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgY2FzZSAzOlxuICAgICAgICAgICAgICAgICAgICBpZiAoIHZhbHVlID4gbWF4IClcbiAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IG1heFxuICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICByZXR1cm4gc2VsZlxuICAgICAgICAgIH1cblxuICAgICAgICAgIGZ1bmN0aW9uIGZhY3RvciAoIG51bTogbnVtYmVyIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICB2YWx1ZSA9IG1pbiArICggbWF4IC0gbWluICkgKiBudW1cblxuICAgICAgICAgICAgICAgcmV0dXJuIHNlbGZcbiAgICAgICAgICB9XG4gICAgIH1cblxuICAgICBleHBvcnQgaW50ZXJmYWNlIE11bHRpcGxlTGltaXRlZFZhbHVlcyBleHRlbmRzIExpbWl0ZWRWYWx1ZVxuICAgICB7XG4gICAgICAgICAgc2V0ICggdmFsdWVzOiBudW1iZXIgfCBudW1iZXIgW10gKTogdGhpc1xuICAgICAgICAgIGxpbWl0ICggbWluPzogbnVtYmVyIHwgbnVtYmVyIFtdLCBtYXg/OiBudW1iZXIgfCBudW1iZXIgW10gKTogdGhpc1xuICAgICAgICAgIGZhY3RvciAoIHZhbHVlczogbnVtYmVyIHwgbnVtYmVyIFtdICk6IHRoaXNcbiAgICAgfVxuXG4gICAgIGV4cG9ydCBmdW5jdGlvbiBtdWx0aXBsZUxpbWl0ZWRWYWx1ZXMgKCB2YWx1ZXM6IG51bWJlciBbXSwgbWluPzogbnVtYmVyIFtdLCBtYXg/OiBudW1iZXIgW10gKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgcmFuZ2VzID0gW10gYXMgbnVtYmVyIFtdXG5cbiAgICAgICAgICB2YXIgaWNsYW1wID0gMFxuXG4gICAgICAgICAgY29uc3Qgc2VsZjogTXVsdGlwbGVMaW1pdGVkVmFsdWVzID0ge1xuICAgICAgICAgICAgICAgbGltaXQsXG4gICAgICAgICAgICAgICBzZXQsXG4gICAgICAgICAgICAgICBmYWN0b3JcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBsaW1pdCAoIG1pbiwgbWF4IClcblxuICAgICAgICAgIHJldHVybiBzZWxmXG5cbiAgICAgICAgICBmdW5jdGlvbiBsaW1pdCAoIG1pblZhbHVlcz86IG51bWJlciB8IG51bWJlciBbXSwgbWF4VmFsdWVzPzogbnVtYmVyIHwgbnVtYmVyIFtdIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBpZiAoIHR5cGVvZiBtaW5WYWx1ZXMgPT0gXCJudW1iZXJcIiApXG4gICAgICAgICAgICAgICAgICAgIG1pblZhbHVlcyA9IFttaW5WYWx1ZXNdXG5cbiAgICAgICAgICAgICAgIGlmICggdHlwZW9mIG1heFZhbHVlcyA9PSBcIm51bWJlclwiIClcbiAgICAgICAgICAgICAgICAgICAgbWF4VmFsdWVzID0gW21heFZhbHVlc11cblxuICAgICAgICAgICAgICAgY29uc3QgbWluQ291bnQgPSBtaW5WYWx1ZXMubGVuZ3RoXG4gICAgICAgICAgICAgICBjb25zdCBtYXhDb3VudCA9IG1heFZhbHVlcy5sZW5ndGhcbiAgICAgICAgICAgICAgIGNvbnN0IGNvdW50ICAgID0gdmFsdWVzLmxlbmd0aFxuXG4gICAgICAgICAgICAgICBtaW4gPSBbXVxuICAgICAgICAgICAgICAgbWF4ID0gW11cblxuICAgICAgICAgICAgICAgZm9yICggdmFyIGkgPSAwIDsgaSA8IGNvdW50IDsgaSsrIClcbiAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBpIDwgbWluQ291bnQgJiYgTnVtYmVyLmlzRmluaXRlICggbWluVmFsdWVzIFtpXSApIClcbiAgICAgICAgICAgICAgICAgICAgICAgICBtaW4gW2ldID0gbWluVmFsdWVzIFtpXVxuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgbWluIFtpXSA9IDBcbiAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgZm9yICggdmFyIGkgPSAwIDsgaSA8IGNvdW50IDsgaSsrIClcbiAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBpIDwgbWF4Q291bnQgJiYgTnVtYmVyLmlzRmluaXRlICggbWF4VmFsdWVzIFtpXSApIClcbiAgICAgICAgICAgICAgICAgICAgICAgICBtYXggW2ldID0gbWF4VmFsdWVzIFtpXVxuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgbWF4IFtpXSA9IHZhbHVlcyBbaV0gLy8gfHwgbWluIFtpXVxuICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAvLyBjbGFtcFxuXG4gICAgICAgICAgICAgICBjb25zdCBjbGFtcFN0YXJ0ID0gbWluQ291bnQgIT0gMFxuICAgICAgICAgICAgICAgY29uc3QgY2xhbXBFbmQgICA9IG1heENvdW50ICE9IDBcblxuICAgICAgICAgICAgICAgaWNsYW1wID0gY2xhbXBTdGFydCAmJiBjbGFtcEVuZCA/IDFcbiAgICAgICAgICAgICAgICAgICAgICA6IGNsYW1wU3RhcnQgICAgICAgICAgICAgPyAyXG4gICAgICAgICAgICAgICAgICAgICAgOiBjbGFtcEVuZCAgICAgICAgICAgICAgID8gM1xuICAgICAgICAgICAgICAgICAgICAgIDogMFxuXG4gICAgICAgICAgICAgICAvLyByYW5nZVxuXG4gICAgICAgICAgICAgICByYW5nZXMuc3BsaWNlICgwKVxuXG4gICAgICAgICAgICAgICBpZiAoIGNsYW1wU3RhcnQgJiYgY2xhbXBFbmQgKVxuICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKCB2YXIgaSA9IDAgOyBpICE9IGNvdW50IDsgaSsrIClcbiAgICAgICAgICAgICAgICAgICAgICAgICByYW5nZXMucHVzaCAoIG1heCBbaV0gLSBtaW4gW2ldIClcbiAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgLy8gdXBkYXRlXG5cbiAgICAgICAgICAgICAgIHNldCAoIHZhbHVlcyApXG5cbiAgICAgICAgICAgICAgIHJldHVybiBzZWxmXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgZnVuY3Rpb24gc2V0ICggbmV3VmFsdWVzOiBudW1iZXIgfCBudW1iZXIgW10gKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGlmICggdHlwZW9mIG5ld1ZhbHVlcyA9PSBcIm51bWJlclwiIClcbiAgICAgICAgICAgICAgICAgICAgbmV3VmFsdWVzID0gW25ld1ZhbHVlc11cblxuICAgICAgICAgICAgICAgY29uc3QgY291bnQgPSB2YWx1ZXMubGVuZ3RoIDwgbmV3VmFsdWVzLmxlbmd0aCA/IHZhbHVlcy5sZW5ndGggOiBuZXdWYWx1ZXMubGVuZ3RoXG5cbiAgICAgICAgICAgICAgIGZvciAoIHZhciBpID0gMCA7IGkgIT0gY291bnQgOyBpKysgKVxuICAgICAgICAgICAgICAgICAgICB2YWx1ZXMgW2ldID0gbmV3VmFsdWVzIFtpXVxuXG4gICAgICAgICAgICAgICBzd2l0Y2ggKCBpY2xhbXAgKVxuICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgY2FzZSAwOlxuXG4gICAgICAgICAgICAgICAgICAgIGZvciAoIHZhciBpID0gMCA7IGkgIT0gY291bnQgOyBpKysgKVxuICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlcyBbaV0gPSBuZXdWYWx1ZXMgW2ldXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG5cbiAgICAgICAgICAgICAgIGNhc2UgMTpcblxuICAgICAgICAgICAgICAgICAgICBmb3IgKCB2YXIgaSA9IDAgOyBpICE9IGNvdW50IDsgaSsrIClcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG4gPSBuZXdWYWx1ZXMgW2ldXG4gICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWVzIFtpXSA9IG4gPCBtaW4gW2ldID8gbWluIFtpXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBuID4gbWF4IFtpXSA/IG1heCBbaV1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogblxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG5cbiAgICAgICAgICAgICAgIGNhc2UgMjpcblxuICAgICAgICAgICAgICAgICAgICBmb3IgKCB2YXIgaSA9IDAgOyBpICE9IGNvdW50IDsgaSsrIClcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG4gPSBuZXdWYWx1ZXMgW2ldXG4gICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWVzIFtpXSA9IG4gPCBtaW4gW2ldID8gbWluIFtpXSA6IG5cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBicmVha1xuXG4gICAgICAgICAgICAgICBjYXNlIDM6XG5cbiAgICAgICAgICAgICAgICAgICAgZm9yICggdmFyIGkgPSAwIDsgaSAhPSBjb3VudCA7IGkrKyApXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBuID0gbmV3VmFsdWVzIFtpXVxuICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlcyBbaV0gPSBuID4gbWF4IFtpXSA/IG1heCBbaV0gOiBuXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgcmV0dXJuIHNlbGZcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBmdW5jdGlvbiBmYWN0b3IgKCBmYWN0b3JzOiBudW1iZXIgfCBudW1iZXIgW10gKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGlmICggdHlwZW9mIGZhY3RvcnMgPT0gXCJudW1iZXJcIiApXG4gICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGlmICggISBOdW1iZXIuaXNGaW5pdGUgKCBmYWN0b3JzICkgKVxuICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBzZWxmXG5cbiAgICAgICAgICAgICAgICAgICAgZm9yICggdmFyIGkgPSAwIDsgaSAhPSB2YWx1ZXMubGVuZ3RoIDsgaSsrIClcbiAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZXMgW2ldID0gbWluIFtpXSArIHJhbmdlcyBbaV0gKiBmYWN0b3JzXG4gICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICBlbHNlIGlmICggQXJyYXkuaXNBcnJheSAoIGZhY3RvcnMgKSApXG4gICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvdW50ID0gdmFsdWVzLmxlbmd0aCA8IGZhY3RvcnMubGVuZ3RoID8gdmFsdWVzLmxlbmd0aCA6IGZhY3RvcnMubGVuZ3RoXG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCBjb3VudCA9PSAwIClcbiAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gc2VsZlxuXG4gICAgICAgICAgICAgICAgICAgIGZvciAoIHZhciBpID0gMCA7IGkgIT0gY291bnQgOyBpKysgKVxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCBpc0Zpbml0ZSAoIGZhY3RvcnMgW2ldICkgKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWVzIFtpXSA9IG1pbiBbaV0gKyByYW5nZXMgW2ldICogZmFjdG9ycyBbaV1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICByZXR1cm4gc2VsZlxuICAgICAgICAgIH1cbiAgICAgfVxufVxuXG50eXBlIElucHV0VmFsdWUgPSBudW1iZXIgfCBzdHJpbmcgfCAobnVtYmVyIHwgc3RyaW5nKSBbXTtcblxuZXhwb3J0IGZ1bmN0aW9uIHdyYXBTdHJpbmdWYWx1ZSAoXG4gICAgIHZhbHVlICAgICA6IG51bWJlciB8IHN0cmluZyB8IChudW1iZXIgfCBzdHJpbmcpIFtdLFxuICAgICBkZWNvbXBvc2U/OiAoIHZhbHVlOiBzdHJpbmcgKSA9PiB7IG51bWJlcnM6IG51bWJlciBbXSwgcmVjb21wb3NlOiAoKSA9PiBzdHJpbmcgfSxcbiAgICAgbWluVmFsdWU/IDogbnVtYmVyIHwgc3RyaW5nIHwgKG51bWJlciB8IHN0cmluZykgW10gfCBudWxsLFxuICAgICBtYXhWYWx1ZT8gOiBudW1iZXIgfCBzdHJpbmcgfCAobnVtYmVyIHwgc3RyaW5nKSBbXSB8IG51bGwsXG4gICAgIG9uVXBkYXRlPyA6ICgpID0+IHZvaWRcbik6IFdyYXBwZWRTdHJpbmdOdW1iZXJcbntcbiAgICAgaWYgKCB0eXBlb2YgZGVjb21wb3NlICE9IFwiZnVuY3Rpb25cIiApXG4gICAgICAgICAgZGVjb21wb3NlID09IGRlY29tcG9zZVN0cmluZ1ZhbHVlXG5cbiAgICAgdmFyIHBhcnRzOiBSZXR1cm5UeXBlIDx0eXBlb2YgZGVjb21wb3NlPlxuICAgICB2YXIgbnVtczogTnVtYmVyTGliLk11bHRpcGxlTGltaXRlZFZhbHVlc1xuXG4gICAgIGNvbnN0IHNlbGY6IFdyYXBwZWRTdHJpbmdOdW1iZXIgPSB7XG4gICAgICAgICAgbGltaXQsXG4gICAgICAgICAgc2V0LFxuICAgICAgICAgIGZhY3RvcixcbiAgICAgICAgICByZXNldCxcbiAgICAgICAgICB0b1N0cmluZyAoKSB7IHJldHVybiBwYXJ0cy5yZWNvbXBvc2UgKCkgfSxcbiAgICAgICAgICBnZXQgbnVtYmVycyAoKSB7IHJldHVybiBwYXJ0cy5udW1iZXJzIH1cbiAgICAgfVxuXG4gICAgIDt7XG4gICAgICAgICAgY29uc3QgdG1wID0gb25VcGRhdGVcbiAgICAgICAgICBvblVwZGF0ZSA9IG51bGxcblxuICAgICAgICAgIHJlc2V0ICgpXG5cbiAgICAgICAgICBpZiAoIHR5cGVvZiB0bXAgPT0gXCJmdW5jdGlvblwiIClcbiAgICAgICAgICAgICAgIG9uVXBkYXRlID0gdG1wXG4gICAgIH1cblxuICAgICBmdW5jdGlvbiBsaW1pdCAoIG1pbj86IElucHV0VmFsdWUsIG1heD86IElucHV0VmFsdWUgKVxuICAgICB7XG4gICAgICAgICAgbWluVmFsdWUgPSBtaW5cbiAgICAgICAgICBtYXhWYWx1ZSA9IG1heFxuXG4gICAgICAgICAgbnVtcy5saW1pdCAoXG4gICAgICAgICAgICAgICBkZWNvbXBvc2UgKCBub3JtICggbWluICkgKS5udW1iZXJzLFxuICAgICAgICAgICAgICAgZGVjb21wb3NlICggbm9ybSAoIG1heCApICkubnVtYmVyc1xuICAgICAgICAgIClcblxuICAgICAgICAgIGlmICggb25VcGRhdGUgKVxuICAgICAgICAgICAgICAgb25VcGRhdGUgKClcblxuICAgICAgICAgIHJldHVybiBzZWxmXG4gICAgIH1cblxuICAgICBmdW5jdGlvbiByZXNldCAoKVxuICAgICB7XG4gICAgICAgICAgY29uc3Qgb2xkID0gcGFydHMgIT0gdW5kZWZpbmVkID8gcGFydHMucmVjb21wb3NlICgpIDogXCJcIlxuXG4gICAgICAgICAgcGFydHMgPSBkZWNvbXBvc2UgKCBub3JtICggdmFsdWUgKSApXG5cbiAgICAgICAgICBudW1zID0gTnVtYmVyTGliLm11bHRpcGxlTGltaXRlZFZhbHVlcyAoXG4gICAgICAgICAgICAgICBwYXJ0cy5udW1iZXJzLFxuICAgICAgICAgICAgICAgZGVjb21wb3NlICggbm9ybSAoIG1pblZhbHVlICkgKS5udW1iZXJzLFxuICAgICAgICAgICAgICAgZGVjb21wb3NlICggbm9ybSAoIG1heFZhbHVlICkgKS5udW1iZXJzLFxuICAgICAgICAgIClcblxuICAgICAgICAgIGlmICggb25VcGRhdGUgJiYgb2xkICE9IHBhcnRzLnJlY29tcG9zZSAoKSApXG4gICAgICAgICAgICAgICBvblVwZGF0ZSAoKVxuXG4gICAgICAgICAgcmV0dXJuIHNlbGZcbiAgICAgfVxuXG4gICAgIGZ1bmN0aW9uIHNldCAoIHZhbHVlczogSW5wdXRWYWx1ZSApXG4gICAgIHtcbiAgICAgICAgICBudW1zLnNldCAoXG4gICAgICAgICAgICAgICB0eXBlb2YgdmFsdWVzID09IFwibnVtYmVyXCJcbiAgICAgICAgICAgICAgID8gW3ZhbHVlc11cbiAgICAgICAgICAgICAgIDogZGVjb21wb3NlICggbm9ybSAoIHZhbHVlcyApICkubnVtYmVyc1xuICAgICAgICAgIClcblxuICAgICAgICAgIGlmICggb25VcGRhdGUgKVxuICAgICAgICAgICAgICAgb25VcGRhdGUgKClcblxuICAgICAgICAgIHJldHVybiBzZWxmXG4gICAgIH1cblxuICAgICBmdW5jdGlvbiBmYWN0b3IgKCBmYWN0b3JzOiBudW1iZXIgfCBudW1iZXIgW10gKVxuICAgICB7XG4gICAgICAgICAgbnVtcy5mYWN0b3IgKCBmYWN0b3JzIClcblxuICAgICAgICAgIGlmICggb25VcGRhdGUgKVxuICAgICAgICAgICAgICAgb25VcGRhdGUgKClcblxuICAgICAgICAgIHJldHVybiBzZWxmXG4gICAgIH1cblxuICAgICBmdW5jdGlvbiBub3JtICggaW5wdXQ6IElucHV0VmFsdWUgKVxuICAgICB7XG4gICAgICAgICAgaWYgKCBBcnJheS5pc0FycmF5ICggaW5wdXQgKSApXG4gICAgICAgICAgICAgICByZXR1cm4gaW5wdXQuam9pbiAoJyAnKVxuXG4gICAgICAgICAgaWYgKCB0eXBlb2YgaW5wdXQgPT0gXCJudW1iZXJcIiApXG4gICAgICAgICAgICAgICByZXR1cm4gaW5wdXQudG9TdHJpbmcgKClcblxuICAgICAgICAgIGlmICggdHlwZW9mIGlucHV0ID09IFwic3RyaW5nXCIgKVxuICAgICAgICAgICAgICAgcmV0dXJuIGlucHV0XG5cbiAgICAgICAgICByZXR1cm4gXCJcIlxuICAgICB9XG5cbiAgICAgcmV0dXJuIHNlbGZcbn1cblxuY29uc3QgcmVnZXggPSAvKFsrLV0/XFxkKlxcLj9cXGQrKD86XFwuXFxkKyk/KD86W2VFXVsrLV0/XFxkKyk/KS9nXG5cblxuZnVuY3Rpb24gZGVjb21wb3NlU3RyaW5nVmFsdWUgKCB2YWx1ZTogc3RyaW5nICk6IHtcbiAgICAgc3RyaW5nczogc3RyaW5nIFtdLFxuICAgICBudW1iZXJzOiBudW1iZXIgW10sXG4gICAgIHJlY29tcG9zZTogKCkgPT4gc3RyaW5nXG59XG57XG4gICAgIGNvbnN0IHN0cmluZ3MgPSBbXSBhcyBzdHJpbmcgW11cbiAgICAgY29uc3QgbnVtYmVycyA9IFtdIGFzIG51bWJlciBbXVxuXG4gICAgIHZhciBzdGFydCA9IDBcbiAgICAgdmFyIG1hdGNoOiBSZWdFeHBFeGVjQXJyYXlcblxuICAgICB3aGlsZSAoIChtYXRjaCA9IHJlZ2V4LmV4ZWMgKCB2YWx1ZSApKSAhPT0gbnVsbCApXG4gICAgIHtcbiAgICAgICAgICBzdHJpbmdzLnB1c2ggKCB2YWx1ZS5zdWJzdHJpbmcgKCBzdGFydCwgbWF0Y2guaW5kZXggKSApXG4gICAgICAgICAgbnVtYmVycy5wdXNoICAoIHBhcnNlRmxvYXQgKCBtYXRjaCBbMV0gKSApXG5cbiAgICAgICAgICBzdGFydCA9IG1hdGNoLmluZGV4ICsgbWF0Y2ggWzBdLmxlbmd0aFxuICAgICB9XG5cbiAgICAgc3RyaW5ncy5wdXNoICggdmFsdWUuc3Vic3RyaW5nICggc3RhcnQgKSApXG5cbiAgICAgY29uc3QgcmVjb21wb3NlID0gKCkgPT5cbiAgICAge1xuICAgICAgICAgIHZhciByZXN1bHQgPSBcIlwiXG5cbiAgICAgICAgICBmb3IgKCB2YXIgaSA9IDAgOyBpICE9IG51bWJlcnMubGVuZ3RoIDsgaSsrIClcbiAgICAgICAgICAgICAgIHJlc3VsdCArPSBzdHJpbmdzIFtpXSArIG51bWJlcnMgW2ldXG5cbiAgICAgICAgICByZXR1cm4gcmVzdWx0ICsgc3RyaW5ncyBbaV1cbiAgICAgfVxuXG4gICAgIHJldHVybiB7XG4gICAgICAgICAgc3RyaW5ncyxcbiAgICAgICAgICBudW1iZXJzLFxuICAgICAgICAgIHJlY29tcG9zZVxuICAgICB9XG59XG4iLCJcblxuZXhwb3J0IHR5cGUgUmFkaWFsT3B0aW9uID0ge1xuICAgIHIgICAgICAgIDogbnVtYmVyLFxuICAgIGNvdW50ICAgIDogbnVtYmVyLFxuICAgIHBhZGRpbmc/IDogbnVtYmVyLFxuICAgIHJvdGF0aW9uPzogbnVtYmVyLFxufVxuXG5leHBvcnQgdHlwZSBSYWRpYWxEZWZpbml0aW9uID0gUmVxdWlyZWQgPFJhZGlhbE9wdGlvbj4gJiB7XG4gICAgY3ggICAgOiBudW1iZXIsXG4gICAgY3kgICAgOiBudW1iZXIsXG4gICAgd2lkdGggOiBudW1iZXIsXG4gICAgaGVpZ2h0OiBudW1iZXIsXG4gICAgcG9pbnRzOiBQYXJ0IFtdLFxufVxuXG50eXBlIFBhcnQgPSB7XG4gICAgeCA6IG51bWJlclxuICAgIHkgOiBudW1iZXJcbiAgICBhIDogbnVtYmVyXG4gICAgYTE6IG51bWJlclxuICAgIGEyOiBudW1iZXJcbiAgICBjaG9yZD86IHtcbiAgICAgICAgeDEgICAgOiBudW1iZXJcbiAgICAgICAgeTEgICAgOiBudW1iZXJcbiAgICAgICAgeDIgICAgOiBudW1iZXJcbiAgICAgICAgeTIgICAgOiBudW1iZXJcbiAgICAgICAgbGVuZ3RoOiBudW1iZXJcbiAgICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRSYWRpYWxEaXN0cmlidXRpb24gKCBvcHRpb25zOiBSYWRpYWxPcHRpb24gKVxue1xuICAgIGNvbnN0IHsgUEksIGNvcywgc2luIH0gPSBNYXRoXG5cbiAgICBjb25zdCByICAgICAgICA9IG9wdGlvbnMuciAgICAgICAgfHwgMzBcbiAgICBjb25zdCBjb3VudCAgICA9IG9wdGlvbnMuY291bnQgICAgfHwgMTBcbiAgICBjb25zdCByb3RhdGlvbiA9IG9wdGlvbnMucm90YXRpb24gfHwgMFxuXG4gICAgY29uc3QgcG9pbnRzID0gW10gYXMgUGFydCBbXVxuXG4gICAgY29uc3QgYSAgICAgPSAyICogUEkgLyBjb3VudFxuICAgIGNvbnN0IGNob3JkID0gMiAqIHIgKiBzaW4gKCBhICogMC41IClcbiAgICBjb25zdCBzaXplICA9IHIgKiA0ICsgY2hvcmRcbiAgICBjb25zdCBjICAgICA9IHNpemUgLyAyXG5cbiAgICBmb3IgKCB2YXIgaSA9IDA7IGkgPCBjb3VudDsgKytpIClcbiAgICB7XG4gICAgICAgIGNvbnN0IHN0YXJ0ICA9IGEgKiBpICsgcm90YXRpb25cbiAgICAgICAgY29uc3QgbWlkZGxlID0gc3RhcnQgKyBhICogMC41XG4gICAgICAgIGNvbnN0IGVuZCAgICA9IHN0YXJ0ICsgYVxuXG4gICAgICAgIHBvaW50cy5wdXNoICh7XG4gICAgICAgICAgICBhMSAgIDogc3RhcnQsXG4gICAgICAgICAgICBhICAgIDogbWlkZGxlLFxuICAgICAgICAgICAgYTIgICA6IGVuZCxcbiAgICAgICAgICAgIHggICAgOiBjb3MgKG1pZGRsZSkgKiByICsgYyxcbiAgICAgICAgICAgIHkgICAgOiBzaW4gKG1pZGRsZSkgKiByICsgYyxcbiAgICAgICAgICAgIGNob3JkOiB7XG4gICAgICAgICAgICAgICAgeDE6IGNvcyAoc3RhcnQpICogciArIGMsXG4gICAgICAgICAgICAgICAgeTE6IHNpbiAoc3RhcnQpICogciArIGMsXG4gICAgICAgICAgICAgICAgeDI6IGNvcyAoZW5kKSAgICogciArIGMsXG4gICAgICAgICAgICAgICAgeTI6IHNpbiAoZW5kKSAgICogciArIGMsXG4gICAgICAgICAgICAgICAgbGVuZ3RoOiBjaG9yZFxuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgIH1cblxuICAgIGNvbnN0IHJlc3VsdDogUmFkaWFsRGVmaW5pdGlvbiA9IHtcbiAgICAgICAgcixcbiAgICAgICAgY291bnQsXG4gICAgICAgIHJvdGF0aW9uLFxuICAgICAgICBwYWRkaW5nOiBvcHRpb25zLnBhZGRpbmcgfHwgMCxcbiAgICAgICAgY3ggICAgIDogYyxcbiAgICAgICAgY3kgICAgIDogYyxcbiAgICAgICAgd2lkdGggIDogc2l6ZSxcbiAgICAgICAgaGVpZ2h0IDogc2l6ZSxcbiAgICAgICAgcG9pbnRzXG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdFxufVxuIiwiLy8gaHR0cHM6Ly9vYnNlcnZhYmxlaHEuY29tL0BkMy9kMy1wYWNrZW5jbG9zZT9jb2xsZWN0aW9uPUBvYnNlcnZhYmxlaHEvYWxnb3JpdGhtc1xuLy8gaHR0cHM6Ly9vYnNlcnZhYmxlaHEuY29tL0BkMy9jaXJjbGUtcGFja2luZ1xuLy8gaHR0cHM6Ly9naXRodWIuY29tL2QzL2QzLWhpZXJhcmNoeS9ibG9iL21hc3Rlci9zcmMvcGFjay9lbmNsb3NlLmpzXG5cblxuZXhwb3J0IHR5cGUgQ2lyY2xlID0ge1xuICAgICB4OiBudW1iZXIsXG4gICAgIHk6IG51bWJlcixcbiAgICAgcjogbnVtYmVyXG59XG5cbmNvbnN0IHNsaWNlID0gQXJyYXkucHJvdG90eXBlLnNsaWNlXG5cbmZ1bmN0aW9uIHNodWZmbGUgPFQ+ICggYXJyYXk6IFRbXSApXG57XG4gICAgIHZhciBtID0gYXJyYXkubGVuZ3RoLFxuICAgICAgICAgIHQsXG4gICAgICAgICAgaTogbnVtYmVyXG5cbiAgICAgd2hpbGUgKCBtIClcbiAgICAge1xuICAgICAgICAgIGkgPSBNYXRoLnJhbmRvbSAoKSAqIG0tLSB8IDBcbiAgICAgICAgICB0ID0gYXJyYXkgW21dXG4gICAgICAgICAgYXJyYXkgW21dID0gYXJyYXkgW2ldXG4gICAgICAgICAgYXJyYXkgW2ldID0gdFxuICAgICB9XG5cbiAgICAgcmV0dXJuIGFycmF5XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBlbmNsb3NlICggY2lyY2xlczogQ2lyY2xlW10gKVxue1xuICAgICBjaXJjbGVzID0gc2h1ZmZsZSAoIHNsaWNlLmNhbGwoIGNpcmNsZXMgKSApXG5cbiAgICAgY29uc3QgbiA9IGNpcmNsZXMubGVuZ3RoXG5cbiAgICAgdmFyIGkgPSAwLFxuICAgICBCID0gW10sXG4gICAgIHA6IENpcmNsZSxcbiAgICAgZTogQ2lyY2xlO1xuXG4gICAgIHdoaWxlICggaSA8IG4gKVxuICAgICB7XG4gICAgICAgICAgcCA9IGNpcmNsZXMgW2ldXG5cbiAgICAgICAgICBpZiAoIGUgJiYgZW5jbG9zZXNXZWFrICggZSwgcCApIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBpKytcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIEIgPSBleHRlbmRCYXNpcyAoIEIsIHAgKVxuICAgICAgICAgICAgICAgZSA9IGVuY2xvc2VCYXNpcyAoIEIgKVxuICAgICAgICAgICAgICAgaSA9IDBcbiAgICAgICAgICB9XG4gICAgIH1cblxuICAgICByZXR1cm4gZVxufVxuXG5mdW5jdGlvbiBleHRlbmRCYXNpcyAoIEI6IENpcmNsZVtdLCBwOiBDaXJjbGUgKVxue1xuICAgICB2YXIgaTogbnVtYmVyLFxuICAgICBqOiBudW1iZXJcblxuICAgICBpZiAoIGVuY2xvc2VzV2Vha0FsbCAoIHAsIEIgKSApXG4gICAgICAgICAgcmV0dXJuIFtwXVxuXG4gICAgIC8vIElmIHdlIGdldCBoZXJlIHRoZW4gQiBtdXN0IGhhdmUgYXQgbGVhc3Qgb25lIGVsZW1lbnQuXG4gICAgIGZvciAoIGkgPSAwOyBpIDwgQi5sZW5ndGg7ICsraSApXG4gICAgIHtcbiAgICAgICAgICBpZiAoIGVuY2xvc2VzTm90ICggcCwgQiBbaV0gKVxuICAgICAgICAgICYmIGVuY2xvc2VzV2Vha0FsbCAoIGVuY2xvc2VCYXNpczIgKCBCIFtpXSwgcCApLCBCIClcbiAgICAgICAgICApe1xuICAgICAgICAgICAgICAgcmV0dXJuIFsgQltpXSwgcCBdXG4gICAgICAgICAgfVxuICAgICB9XG5cbiAgICAgLy8gSWYgd2UgZ2V0IGhlcmUgdGhlbiBCIG11c3QgaGF2ZSBhdCBsZWFzdCB0d28gZWxlbWVudHMuXG4gICAgIGZvciAoIGkgPSAwOyBpIDwgQi5sZW5ndGggLSAxOyArK2kgKVxuICAgICB7XG4gICAgICAgICAgZm9yICggaiA9IGkgKyAxOyBqIDwgQi5sZW5ndGg7ICsraiApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgaWYgKCBlbmNsb3Nlc05vdCAgICAoIGVuY2xvc2VCYXNpczIgKCBCIFtpXSwgQiBbal0gICAgKSwgcCApXG4gICAgICAgICAgICAgICAmJiBlbmNsb3Nlc05vdCAgICAoIGVuY2xvc2VCYXNpczIgKCBCIFtpXSwgcCAgICAgICAgKSwgQiBbal0gKVxuICAgICAgICAgICAgICAgJiYgZW5jbG9zZXNOb3QgICAgKCBlbmNsb3NlQmFzaXMyICggQiBbal0sIHAgICAgICAgICksIEIgW2ldIClcbiAgICAgICAgICAgICAgICYmIGVuY2xvc2VzV2Vha0FsbCggZW5jbG9zZUJhc2lzMyAoIEIgW2ldLCBCIFtqXSwgcCApLCBCIClcbiAgICAgICAgICAgICAgICl7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBbIEJbIGkgXSwgQlsgaiBdLCBwIF07XG4gICAgICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICB9XG5cbiAgICAgLy8gSWYgd2UgZ2V0IGhlcmUgdGhlbiBzb21ldGhpbmcgaXMgdmVyeSB3cm9uZy5cbiAgICAgdGhyb3cgbmV3IEVycm9yO1xufVxuXG5mdW5jdGlvbiBlbmNsb3Nlc05vdCAoIGE6IENpcmNsZSwgYjogQ2lyY2xlIClcbntcbiAgICAgY29uc3QgZHIgPSBhLnIgLSBiLnJcbiAgICAgY29uc3QgZHggPSBiLnggLSBhLnhcbiAgICAgY29uc3QgZHkgPSBiLnkgLSBhLnlcblxuICAgICByZXR1cm4gZHIgPCAwIHx8IGRyICogZHIgPCBkeCAqIGR4ICsgZHkgKiBkeTtcbn1cblxuZnVuY3Rpb24gZW5jbG9zZXNXZWFrICggYTogQ2lyY2xlLCBiOiBDaXJjbGUgKVxue1xuICAgICB2YXIgZHIgPSBhLnIgLSBiLnIgKyAxZS02LFxuICAgICBkeCA9IGIueCAtIGEueCxcbiAgICAgZHkgPSBiLnkgLSBhLnlcblxuICAgICByZXR1cm4gZHIgPiAwICYmIGRyICogZHIgPiBkeCAqIGR4ICsgZHkgKiBkeVxufVxuXG5mdW5jdGlvbiBlbmNsb3Nlc1dlYWtBbGwgKCBhOiBDaXJjbGUsIEI6IENpcmNsZVtdIClcbntcbiAgICAgZm9yICggdmFyIGkgPSAwOyBpIDwgQi5sZW5ndGg7ICsraSApXG4gICAgIHtcbiAgICAgICAgICBpZiAoICEgZW5jbG9zZXNXZWFrICggYSwgQltpXSApIClcbiAgICAgICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICB9XG4gICAgIHJldHVybiB0cnVlXG59XG5cbmZ1bmN0aW9uIGVuY2xvc2VCYXNpcyAoIEI6IENpcmNsZVtdIClcbntcbiAgICAgc3dpdGNoICggQi5sZW5ndGggKVxuICAgICB7XG4gICAgICAgICAgY2FzZSAxOiByZXR1cm4gZW5jbG9zZUJhc2lzMSggQiBbMF0gKVxuICAgICAgICAgIGNhc2UgMjogcmV0dXJuIGVuY2xvc2VCYXNpczIoIEIgWzBdLCBCIFsxXSApXG4gICAgICAgICAgY2FzZSAzOiByZXR1cm4gZW5jbG9zZUJhc2lzMyggQiBbMF0sIEIgWzFdLCBCIFsyXSApXG4gICAgIH1cbn1cblxuZnVuY3Rpb24gZW5jbG9zZUJhc2lzMSAoIGE6IENpcmNsZSApXG57XG4gICAgIHJldHVybiB7XG4gICAgICAgICAgeDogYS54LFxuICAgICAgICAgIHk6IGEueSxcbiAgICAgICAgICByOiBhLnJcbiAgICAgfTtcbn1cblxuZnVuY3Rpb24gZW5jbG9zZUJhc2lzMiAoIGE6IENpcmNsZSwgYjogQ2lyY2xlIClcbntcbiAgICAgY29uc3QgeyB4OiB4MSwgeTogeTEsIHI6IHIxIH0gPSBhXG4gICAgIGNvbnN0IHsgeDogeDIsIHk6IHkyLCByOiByMiB9ID0gYlxuXG4gICAgIHZhciB4MjEgPSB4MiAtIHgxLFxuICAgICB5MjEgPSB5MiAtIHkxLFxuICAgICByMjEgPSByMiAtIHIxLFxuICAgICBsICAgPSBNYXRoLnNxcnQoIHgyMSAqIHgyMSArIHkyMSAqIHkyMSApO1xuXG4gICAgIHJldHVybiB7XG4gICAgICAgICAgeDogKCB4MSArIHgyICsgeDIxIC8gbCAqIHIyMSApIC8gMixcbiAgICAgICAgICB5OiAoIHkxICsgeTIgKyB5MjEgLyBsICogcjIxICkgLyAyLFxuICAgICAgICAgIHI6ICggbCArIHIxICsgcjIgKSAvIDJcbiAgICAgfTtcbn1cblxuZnVuY3Rpb24gZW5jbG9zZUJhc2lzMyAoIGE6IENpcmNsZSwgYjogQ2lyY2xlLCBjOiBDaXJjbGUgKVxue1xuICAgICBjb25zdCB7IHg6IHgxLCB5OiB5MSwgcjogcjEgfSA9IGFcbiAgICAgY29uc3QgeyB4OiB4MiwgeTogeTIsIHI6IHIyIH0gPSBiXG4gICAgIGNvbnN0IHsgeDogeDMsIHk6IHkzLCByOiByMyB9ID0gY1xuXG4gICAgIGNvbnN0IGEyID0geDEgLSB4MixcbiAgICAgICAgICAgICAgIGEzID0geDEgLSB4MyxcbiAgICAgICAgICAgICAgIGIyID0geTEgLSB5MixcbiAgICAgICAgICAgICAgIGIzID0geTEgLSB5MyxcbiAgICAgICAgICAgICAgIGMyID0gcjIgLSByMSxcbiAgICAgICAgICAgICAgIGMzID0gcjMgLSByMSxcblxuICAgICAgICAgICAgICAgZDEgPSB4MSAqIHgxICsgeTEgKiB5MSAtIHIxICogcjEsXG4gICAgICAgICAgICAgICBkMiA9IGQxIC0geDIgKiB4MiAtIHkyICogeTIgKyByMiAqIHIyLFxuICAgICAgICAgICAgICAgZDMgPSBkMSAtIHgzICogeDMgLSB5MyAqIHkzICsgcjMgKiByMyxcblxuICAgICAgICAgICAgICAgYWIgPSBhMyAqIGIyIC0gYTIgKiBiMyxcbiAgICAgICAgICAgICAgIHhhID0gKCBiMiAqIGQzIC0gYjMgKiBkMiApIC8gKCBhYiAqIDIgKSAtIHgxLFxuICAgICAgICAgICAgICAgeGIgPSAoIGIzICogYzIgLSBiMiAqIGMzICkgLyBhYixcbiAgICAgICAgICAgICAgIHlhID0gKCBhMyAqIGQyIC0gYTIgKiBkMyApIC8gKCBhYiAqIDIgKSAtIHkxLFxuICAgICAgICAgICAgICAgeWIgPSAoIGEyICogYzMgLSBhMyAqIGMyICkgLyBhYixcblxuICAgICAgICAgICAgICAgQSAgPSB4YiAqIHhiICsgeWIgKiB5YiAtIDEsXG4gICAgICAgICAgICAgICBCICA9IDIgKiAoIHIxICsgeGEgKiB4YiArIHlhICogeWIgKSxcbiAgICAgICAgICAgICAgIEMgID0geGEgKiB4YSArIHlhICogeWEgLSByMSAqIHIxLFxuICAgICAgICAgICAgICAgciAgPSAtKCBBID8gKCBCICsgTWF0aC5zcXJ0KCBCICogQiAtIDQgKiBBICogQyApICkgLyAoIDIgKiBBICkgOiBDIC8gQiApXG5cbiAgICAgcmV0dXJuIHtcbiAgICAgICAgICB4OiB4MSArIHhhICsgeGIgKiByLFxuICAgICAgICAgIHk6IHkxICsgeWEgKyB5YiAqIHIsXG4gICAgICAgICAgcjogclxuICAgICB9O1xufVxuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4vZDMtZW5jbG9zZS50c1wiIC8+XG5cbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9kMy9kMy1oaWVyYXJjaHkvYmxvYi9tYXN0ZXIvc3JjL3BhY2svc2libGluZ3MuanNcblxuaW1wb3J0IHsgZW5jbG9zZSwgQ2lyY2xlIH0gZnJvbSBcIi4vZDMtZW5jbG9zZS5qc1wiXG5cbmZ1bmN0aW9uIHBsYWNlICggYjogQ2lyY2xlLCBhOiBDaXJjbGUsIGM6IENpcmNsZSApXG57XG4gICAgIHZhciBkeCA9IGIueCAtIGEueCxcbiAgICAgICAgICB4OiBudW1iZXIsXG4gICAgICAgICAgYTI6IG51bWJlcixcbiAgICAgICAgICBkeSA9IGIueSAtIGEueSxcbiAgICAgICAgICB5IDogbnVtYmVyLFxuICAgICAgICAgIGIyOiBudW1iZXIsXG4gICAgICAgICAgZDIgPSBkeCAqIGR4ICsgZHkgKiBkeVxuXG4gICAgIGlmICggZDIgKVxuICAgICB7XG4gICAgICAgICAgYTIgPSBhLnIgKyBjLnIsIGEyICo9IGEyXG4gICAgICAgICAgYjIgPSBiLnIgKyBjLnIsIGIyICo9IGIyXG5cbiAgICAgICAgICBpZiAoIGEyID4gYjIgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHggPSAoIGQyICsgYjIgLSBhMiApIC8gKCAyICogZDIgKVxuICAgICAgICAgICAgICAgeSA9IE1hdGguc3FydCggTWF0aC5tYXgoIDAsIGIyIC8gZDIgLSB4ICogeCApIClcbiAgICAgICAgICAgICAgIGMueCA9IGIueCAtIHggKiBkeCAtIHkgKiBkeVxuICAgICAgICAgICAgICAgYy55ID0gYi55IC0geCAqIGR5ICsgeSAqIGR4XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICB4ID0gKCBkMiArIGEyIC0gYjIgKSAvICggMiAqIGQyIClcbiAgICAgICAgICAgICAgIHkgPSBNYXRoLnNxcnQoIE1hdGgubWF4KCAwLCBhMiAvIGQyIC0geCAqIHggKSApXG4gICAgICAgICAgICAgICBjLnggPSBhLnggKyB4ICogZHggLSB5ICogZHlcbiAgICAgICAgICAgICAgIGMueSA9IGEueSArIHggKiBkeSArIHkgKiBkeFxuICAgICAgICAgIH1cbiAgICAgfVxuICAgICBlbHNlXG4gICAgIHtcbiAgICAgICAgICBjLnggPSBhLnggKyBjLnJcbiAgICAgICAgICBjLnkgPSBhLnlcbiAgICAgfVxufVxuXG5mdW5jdGlvbiBpbnRlcnNlY3RzICggYTogQ2lyY2xlLCBiOiBDaXJjbGUgKVxue1xuICAgICB2YXIgZHIgPSBhLnIgKyBiLnIgLSAxZS02LCBkeCA9IGIueCAtIGEueCwgZHkgPSBiLnkgLSBhLnk7XG4gICAgIHJldHVybiBkciA+IDAgJiYgZHIgKiBkciA+IGR4ICogZHggKyBkeSAqIGR5O1xufVxuXG5mdW5jdGlvbiBzY29yZSAoIG5vZGU6IE5vZGUgKVxue1xuICAgICB2YXIgYSA9IG5vZGUuXyxcbiAgICAgICAgICBiID0gbm9kZS5uZXh0Ll8sXG4gICAgICAgICAgYWIgPSBhLnIgKyBiLnIsXG4gICAgICAgICAgZHggPSAoIGEueCAqIGIuciArIGIueCAqIGEuciApIC8gYWIsXG4gICAgICAgICAgZHkgPSAoIGEueSAqIGIuciArIGIueSAqIGEuciApIC8gYWI7XG4gICAgIHJldHVybiBkeCAqIGR4ICsgZHkgKiBkeTtcbn1cblxuY2xhc3MgTm9kZVxue1xuICAgICBuZXh0ICAgICA9IG51bGwgYXMgTm9kZVxuICAgICBwcmV2aW91cyA9IG51bGwgYXMgTm9kZVxuICAgICBjb25zdHJ1Y3RvciAoIHB1YmxpYyBfOiBDaXJjbGUgKSB7fVxufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFja0VuY2xvc2UgKCBjaXJjbGVzOiBDaXJjbGVbXSApXG57XG4gICAgIGlmICggISggbiA9IGNpcmNsZXMubGVuZ3RoICkgKSByZXR1cm4gMDtcblxuICAgICB2YXIgYSwgYiwgYyAvKjogTm9kZSAmIENpcmNsZSovLCBuLCBhYSwgY2EsIGksIGosIGssIHNqLCBzaztcblxuICAgICAvLyBQbGFjZSB0aGUgZmlyc3QgY2lyY2xlLlxuICAgICBhID0gY2lyY2xlc1sgMCBdLCBhLnggPSAwLCBhLnkgPSAwO1xuICAgICBpZiAoICEoIG4gPiAxICkgKSByZXR1cm4gYS5yO1xuXG4gICAgIC8vIFBsYWNlIHRoZSBzZWNvbmQgY2lyY2xlLlxuICAgICBiID0gY2lyY2xlc1sgMSBdLCBhLnggPSAtYi5yLCBiLnggPSBhLnIsIGIueSA9IDA7XG4gICAgIGlmICggISggbiA+IDIgKSApIHJldHVybiBhLnIgKyBiLnI7XG5cbiAgICAgLy8gUGxhY2UgdGhlIHRoaXJkIGNpcmNsZS5cbiAgICAgcGxhY2UoIGIsIGEsIGMgPSBjaXJjbGVzWyAyIF0gKTtcblxuICAgICAvLyBJbml0aWFsaXplIHRoZSBmcm9udC1jaGFpbiB1c2luZyB0aGUgZmlyc3QgdGhyZWUgY2lyY2xlcyBhLCBiIGFuZCBjLlxuICAgICBhID0gbmV3IE5vZGUoIGEgKSwgYiA9IG5ldyBOb2RlKCBiICksIGMgPSBuZXcgTm9kZSggYyApO1xuICAgICBhLm5leHQgPSBjLnByZXZpb3VzID0gYjtcbiAgICAgYi5uZXh0ID0gYS5wcmV2aW91cyA9IGM7XG4gICAgIGMubmV4dCA9IGIucHJldmlvdXMgPSBhO1xuXG4gICAgIC8vIEF0dGVtcHQgdG8gcGxhY2UgZWFjaCByZW1haW5pbmcgY2lyY2xl4oCmXG4gICAgIHBhY2s6IGZvciAoIGkgPSAzOyBpIDwgbjsgKytpIClcbiAgICAge1xuICAgICAgICAgIHBsYWNlKCBhLl8sIGIuXywgYyA9IGNpcmNsZXNbIGkgXSApLCBjID0gbmV3IE5vZGUoIGMgKTtcblxuICAgICAgICAgIC8vIEZpbmQgdGhlIGNsb3Nlc3QgaW50ZXJzZWN0aW5nIGNpcmNsZSBvbiB0aGUgZnJvbnQtY2hhaW4sIGlmIGFueS5cbiAgICAgICAgICAvLyDigJxDbG9zZW5lc3PigJ0gaXMgZGV0ZXJtaW5lZCBieSBsaW5lYXIgZGlzdGFuY2UgYWxvbmcgdGhlIGZyb250LWNoYWluLlxuICAgICAgICAgIC8vIOKAnEFoZWFk4oCdIG9yIOKAnGJlaGluZOKAnSBpcyBsaWtld2lzZSBkZXRlcm1pbmVkIGJ5IGxpbmVhciBkaXN0YW5jZS5cbiAgICAgICAgICBqID0gYi5uZXh0LCBrID0gYS5wcmV2aW91cywgc2ogPSBiLl8uciwgc2sgPSBhLl8ucjtcbiAgICAgICAgICBkb1xuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGlmICggc2ogPD0gc2sgKVxuICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIGludGVyc2VjdHMoIGouXywgYy5fICkgKVxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgYiA9IGosIGEubmV4dCA9IGIsIGIucHJldmlvdXMgPSBhLCAtLWk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWUgcGFjaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBzaiArPSBqLl8uciwgaiA9IGoubmV4dDtcbiAgICAgICAgICAgICAgIH0gZWxzZVxuICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIGludGVyc2VjdHMoIGsuXywgYy5fICkgKVxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgYSA9IGssIGEubmV4dCA9IGIsIGIucHJldmlvdXMgPSBhLCAtLWk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWUgcGFjaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBzayArPSBrLl8uciwgayA9IGsucHJldmlvdXM7XG4gICAgICAgICAgICAgICB9XG4gICAgICAgICAgfSB3aGlsZSAoIGogIT09IGsubmV4dCApO1xuXG4gICAgICAgICAgLy8gU3VjY2VzcyEgSW5zZXJ0IHRoZSBuZXcgY2lyY2xlIGMgYmV0d2VlbiBhIGFuZCBiLlxuICAgICAgICAgIGMucHJldmlvdXMgPSBhLCBjLm5leHQgPSBiLCBhLm5leHQgPSBiLnByZXZpb3VzID0gYiA9IGM7XG5cbiAgICAgICAgICAvLyBDb21wdXRlIHRoZSBuZXcgY2xvc2VzdCBjaXJjbGUgcGFpciB0byB0aGUgY2VudHJvaWQuXG4gICAgICAgICAgYWEgPSBzY29yZSggYSApO1xuICAgICAgICAgIHdoaWxlICggKCBjID0gYy5uZXh0ICkgIT09IGIgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGlmICggKCBjYSA9IHNjb3JlKCBjICkgKSA8IGFhIClcbiAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgYSA9IGMsXG4gICAgICAgICAgICAgICAgICAgIGFhID0gY2E7XG4gICAgICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGIgPSBhLm5leHQ7XG4gICAgIH1cblxuICAgICAvLyBDb21wdXRlIHRoZSBlbmNsb3NpbmcgY2lyY2xlIG9mIHRoZSBmcm9udCBjaGFpbi5cbiAgICAgYSA9IFsgYi5fIF1cbiAgICAgYyA9IGJcbiAgICAgd2hpbGUgKCAoIGMgPSBjLm5leHQgKSAhPT0gYiApXG4gICAgICAgICAgYS5wdXNoKCBjLl8gKTtcbiAgICAgYyA9IGVuY2xvc2UoIGEgKVxuXG4gICAgIC8vIFRyYW5zbGF0ZSB0aGUgY2lyY2xlcyB0byBwdXQgdGhlIGVuY2xvc2luZyBjaXJjbGUgYXJvdW5kIHRoZSBvcmlnaW4uXG4gICAgIGZvciAoIGkgPSAwOyBpIDwgbjsgKytpIClcbiAgICAge1xuICAgICAgICAgIGEgPSBjaXJjbGVzWyBpIF0sXG4gICAgICAgICAgYS54IC09IGMueCxcbiAgICAgICAgICBhLnkgLT0gYy55XG4gICAgIH1cblxuICAgICByZXR1cm4gYy5yIGFzIG51bWJlclxufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFja0NpcmNsZXMgKCBjaXJjbGVzOiBDaXJjbGVbXSApXG57XG4gICAgIHBhY2tFbmNsb3NlKCBjaXJjbGVzICk7XG4gICAgIHJldHVybiBjaXJjbGVzIGFzIENpcmNsZVtdO1xufVxuIiwiXHJcblxyXG5leHBvcnQgdHlwZSBVbml0XHJcbiAgICA9IFwiJVwiXHJcbiAgICB8IFwicHhcIiB8IFwicHRcIiB8IFwiZW1cIiB8IFwicmVtXCIgfCBcImluXCIgfCBcImNtXCIgfCBcIm1tXCJcclxuICAgIHwgXCJleFwiIHwgXCJjaFwiIHwgXCJwY1wiXHJcbiAgICB8IFwidndcIiB8IFwidmhcIiB8IFwidm1pblwiIHwgXCJ2bWF4XCJcclxuICAgIHwgXCJkZWdcIiB8IFwicmFkXCIgfCBcInR1cm5cIlxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldFVuaXQgKCB2YWx1ZTogYW55ICk6IFVuaXQgfCB1bmRlZmluZWRcclxue1xyXG4gICAgaWYgKCB0eXBlb2YgdmFsdWUgIT0gXCJzdHJpbmdcIiApXHJcbiAgICAgICAgIHJldHVybiB1bmRlZmluZWRcclxuXHJcbiAgICBjb25zdCBzcGxpdCA9IC9bKy1dP1xcZCpcXC4/XFxkKyg/OlxcLlxcZCspPyg/OltlRV1bKy1dP1xcZCspPyglfHB4fHB0fGVtfHJlbXxpbnxjbXxtbXxleHxjaHxwY3x2d3x2aHx2bWlufHZtYXh8ZGVnfHJhZHx0dXJuKT8kL1xyXG4gICAgICAgICAgICAgIC5leGVjKCB2YWx1ZSApO1xyXG5cclxuICAgIGlmICggc3BsaXQgKVxyXG4gICAgICAgICByZXR1cm4gc3BsaXQgWzFdIGFzIFVuaXRcclxuXHJcbiAgICByZXR1cm4gdW5kZWZpbmVkXHJcbn1cclxuXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0VHJhbnNmb3JtVW5pdCAoIHByb3BOYW1lOiBzdHJpbmcgKVxyXG57XHJcbiAgICBpZiAoIHByb3BOYW1lLmluY2x1ZGVzICggJ3RyYW5zbGF0ZScgKSB8fCBwcm9wTmFtZSA9PT0gJ3BlcnNwZWN0aXZlJyApXHJcbiAgICAgICAgcmV0dXJuICdweCdcclxuXHJcbiAgICBpZiAoIHByb3BOYW1lLmluY2x1ZGVzICggJ3JvdGF0ZScgKSB8fCBwcm9wTmFtZS5pbmNsdWRlcyAoICdza2V3JyApIClcclxuICAgICAgICByZXR1cm4gJ2RlZydcclxufSIsIlxuLy8gaHR0cHM6Ly9naXRodWIuY29tL3JkZmpzLWJhc2UvZGF0YS1tb2RlbC90cmVlL21hc3Rlci9saWJcblxuZGVjbGFyZSBnbG9iYWxcbntcbiAgICAgZXhwb3J0IGludGVyZmFjZSAkTm9kZVxuICAgICB7XG4gICAgICAgICAgcmVhZG9ubHkgY29udGV4dDogc3RyaW5nXG4gICAgICAgICAgcmVhZG9ubHkgdHlwZTogc3RyaW5nXG4gICAgICAgICAgcmVhZG9ubHkgaWQ6IHN0cmluZ1xuICAgICB9XG5cbiAgICAgZXhwb3J0IGludGVyZmFjZSAkQ2x1c3RlciA8JENoaWxkIGV4dGVuZHMgJE5vZGUgPSAkTm9kZT4gZXh0ZW5kcyAkTm9kZVxuICAgICB7XG4gICAgICAgICAgY2hpbGRyZW4/OiAkQ2hpbGQgW11cbiAgICAgfVxufVxuXG52YXIgbmV4dElkID0gMFxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTm9kZSA8RCBleHRlbmRzICROb2RlID0gJE5vZGUsIFQgZXh0ZW5kcyBzdHJpbmcgPSBEIFtcInR5cGVcIl0+ICggdHlwZTogVCwgaWQ6IHN0cmluZywgZGF0YTogUGFydGlhbCA8T21pdCA8RCwgXCJ0eXBlXCIgfCBcImlkXCI+PiApXG57XG4gICAgIHR5cGUgTiA9IHsgLXJlYWRvbmx5IFtLIGluIGtleW9mIERdOiBEW0tdIH1cblxuICAgICA7KGRhdGEgYXMgTikudHlwZSA9IHR5cGVcbiAgICAgOyhkYXRhIGFzIE4pLmlkICAgPSBpZCB8fCAoKytuZXh0SWQpLnRvU3RyaW5nICgpXG4gICAgIHJldHVybiBkYXRhIGFzIERcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFVJZCAoIG5vZGU6ICROb2RlIClcbntcbiAgICAgcmV0dXJuIG5vZGUuY29udGV4dCArICcjJyArIG5vZGUudHlwZSArICc6JyArIG5vZGUuaWRcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGVxdWFsTm9kZXMgKCBhOiAkTm9kZSwgYjogJE5vZGUgKVxue1xuICAgICByZXR1cm4gISFhICYmICEhYlxuICAgICAgICAgICYmIGEudHlwZSA9PT0gYi50eXBlXG4gICAgICAgICAgJiYgYS5pZCAgID09PSBiLmlkXG59XG5cbi8qZXhwb3J0IGNsYXNzIE5vZGUgPEQgZXh0ZW5kcyAkTm9kZSA9ICROb2RlLCBUIGV4dGVuZHMgc3RyaW5nID0gRCBbXCJ0eXBlXCJdPlxue1xuICAgICBzdGF0aWMgbmV4dElkID0gMFxuXG4gICAgIHJlYWRvbmx5IHR5cGU6IHN0cmluZ1xuXG4gICAgIHJlYWRvbmx5IGlkOiBzdHJpbmdcblxuICAgICByZWFkb25seSB1aWQ6IG51bWJlclxuXG4gICAgIHJlYWRvbmx5IGRhdGE6IERcblxuICAgICBkZWZhdWx0RGF0YSAoKTogJE5vZGVcbiAgICAge1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICBjb250ZXh0OiBcIlwiLFxuICAgICAgICAgICAgICAgdHlwZSAgIDogXCJub2RlXCIsXG4gICAgICAgICAgICAgICBpZCAgICAgOiB1bmRlZmluZWQsXG4gICAgICAgICAgfVxuICAgICB9XG5cbiAgICAgY29uc3RydWN0b3IgKCBkYXRhOiBEIClcbiAgICAge1xuICAgICAgICAgIHRoaXMudHlwZSA9IGRhdGEudHlwZVxuICAgICAgICAgIHRoaXMudWlkICA9ICsrTm9kZS5uZXh0SWRcbiAgICAgICAgICB0aGlzLmlkICAgPSBkYXRhLmlkIHx8IChkYXRhLmlkID0gdGhpcy51aWQudG9TdHJpbmcgKCkpXG5cbiAgICAgICAgICB0aGlzLmRhdGEgPSBPYmplY3QuYXNzaWduICggdGhpcy5kZWZhdWx0RGF0YSAoKSwgZGF0YSBhcyBEIClcbiAgICAgfVxuXG4gICAgIGVxdWFscyAoIG90aGVyOiBOb2RlIDxhbnk+IClcbiAgICAge1xuICAgICAgICAgIHJldHVybiAhIW90aGVyXG4gICAgICAgICAgICAgICAmJiBvdGhlci50eXBlID09PSB0aGlzLnR5cGVcbiAgICAgICAgICAgICAgICYmIG90aGVyLmlkICAgPT09IHRoaXMuaWRcbiAgICAgfVxuXG4gICAgIHRvSnNvbiAoKVxuICAgICB7XG4gICAgICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5ICggdGhpcy5kYXRhIClcbiAgICAgfVxufSovXG4iLCJcbmV4cG9ydCB0eXBlIFBhdGggPSB7XG4gICAgIGxlbmd0aDogbnVtYmVyXG4gICAgIFtTeW1ib2wuaXRlcmF0b3JdKCk6IEl0ZXJhYmxlSXRlcmF0b3I8c3RyaW5nPlxufVxuXG5leHBvcnQgY2xhc3MgRGF0YVRyZWUgPFQ+XG57XG4gICAgIHJlY29yZHMgPSB7fSBhcyB7XG4gICAgICAgICAgW2NvbnRleHQ6IHN0cmluZ106IFQgfCB7XG4gICAgICAgICAgICAgICBbdHlwZTogc3RyaW5nXTogVCB8IHtcbiAgICAgICAgICAgICAgICAgICAgW2lkOiBzdHJpbmddOiBUXG4gICAgICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICB9XG5cbiAgICAgaGFzICggcGF0aDogUGF0aCApICA6IGJvb2xlYW5cbiAgICAge1xuICAgICAgICAgIHZhciAgIHJlYyAgPSB0aGlzLnJlY29yZHMgYXMgYW55XG4gICAgICAgICAgdmFyIGNvdW50ID0gMFxuXG4gICAgICAgICAgZm9yICggY29uc3QgayBvZiBwYXRoIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBjb3VudCArK1xuXG4gICAgICAgICAgICAgICBpZiAoIGsgaW4gcmVjIClcbiAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBrID09PSB1bmRlZmluZWQgKVxuICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrXG5cbiAgICAgICAgICAgICAgICAgICAgcmVjID0gcmVjIFtrXVxuICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gcGF0aC5sZW5ndGggPT0gY291bnRcbiAgICAgfVxuXG4gICAgIGNvdW50ICggcGF0aDogUGF0aCApXG4gICAgIHtcbiAgICAgICAgICB2YXIgIHJlYyA9IHRoaXMucmVjb3JkcyBhcyBhbnlcblxuICAgICAgICAgIGZvciAoIGNvbnN0IGsgb2YgcGF0aCApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgaWYgKCBrID09PSB1bmRlZmluZWQgKVxuICAgICAgICAgICAgICAgICAgICBicmVha1xuXG4gICAgICAgICAgICAgICBpZiAoIGsgaW4gcmVjIClcbiAgICAgICAgICAgICAgICAgICAgcmVjID0gcmVjIFtrXVxuICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gMFxuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vQHRzLWlnbm9yZVxuICAgICAgICAgIHJldHVybiB1bmRlZmluZWQgaW4gcmVjXG4gICAgICAgICAgICAgICA/IE9iamVjdC5rZXlzICggcmVjICkubGVuZ3RoIC0gMVxuICAgICAgICAgICAgICAgOiBPYmplY3Qua2V5cyAoIHJlYyApLmxlbmd0aFxuXG4gICAgIH1cblxuICAgICBzZXQgKCBwYXRoOiBQYXRoLCBkYXRhOiBUICk6IFRcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHVuZCA9IHVuZGVmaW5lZFxuICAgICAgICAgIHZhciAgIHJlYyAgPSB0aGlzLnJlY29yZHMgYXMgYW55XG5cbiAgICAgICAgICBmb3IgKCBjb25zdCBrIG9mIHBhdGggKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGlmICggayA9PT0gdW5kZWZpbmVkIClcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcblxuICAgICAgICAgICAgICAgaWYgKCBrIGluIHJlYyApXG4gICAgICAgICAgICAgICAgICAgIHJlYyA9IHJlYyBba11cbiAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgcmVjID0gcmVjIFtrXSA9IHt9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIHJlYyBbdW5kXSA9IGRhdGFcbiAgICAgfVxuXG4gICAgIGdldCAoIHBhdGg6IFBhdGggKTogVFxuICAgICB7XG4gICAgICAgICAgY29uc3QgdW5kID0gdW5kZWZpbmVkXG4gICAgICAgICAgdmFyICAgcmVjICA9IHRoaXMucmVjb3JkcyBhcyBhbnlcblxuICAgICAgICAgIGZvciAoIGNvbnN0IGsgb2YgcGF0aCApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgaWYgKCBrID09PSB1bmRlZmluZWQgKVxuICAgICAgICAgICAgICAgICAgICBicmVha1xuXG4gICAgICAgICAgICAgICBpZiAoIGsgaW4gcmVjIClcbiAgICAgICAgICAgICAgICAgICAgcmVjID0gcmVjIFtrXVxuICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiByZWMgW3VuZF1cbiAgICAgfVxuXG4gICAgIG5lYXIgKCBwYXRoOiBQYXRoICk6IFRcbiAgICAge1xuICAgICAgICAgIHZhciByZWMgPSB0aGlzLnJlY29yZHMgYXMgYW55XG4gICAgICAgICAgY29uc3QgdW5kID0gdW5kZWZpbmVkXG5cbiAgICAgICAgICBmb3IgKCBjb25zdCBrIG9mIHBhdGggKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGlmICggayA9PT0gdW5kZWZpbmVkIClcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcblxuICAgICAgICAgICAgICAgaWYgKCBrIGluIHJlYyApXG4gICAgICAgICAgICAgICAgICAgIHJlYyA9IHJlYyBba11cbiAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gcmVjIFt1bmRdXG4gICAgIH1cblxuICAgICB3YWxrICggcGF0aDogUGF0aCwgY2I6ICggZGF0YTogVCApID0+IHZvaWQgKVxuICAgICB7XG4gICAgICAgICAgdmFyICAgcmVjICA9IHRoaXMucmVjb3JkcyBhcyBhbnlcbiAgICAgICAgICBjb25zdCB1bmQgID0gdW5kZWZpbmVkXG5cbiAgICAgICAgICBmb3IgKCBjb25zdCBrIG9mIHBhdGggKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGlmICggdW5kIGluIHJlYyApXG4gICAgICAgICAgICAgICAgICAgIGNiICggcmVjIFt1bmRdIClcblxuICAgICAgICAgICAgICAgaWYgKCBrID09PSB1bmRlZmluZWQgKVxuICAgICAgICAgICAgICAgICAgICBicmVha1xuXG4gICAgICAgICAgICAgICBpZiAoIGsgaW4gcmVjIClcbiAgICAgICAgICAgICAgICAgICAgcmVjID0gcmVjIFtrXVxuICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICggdW5kIGluIHJlYyApXG4gICAgICAgICAgICAgICBjYiAoIHJlYyBbdW5kXSApXG5cbiAgICAgICAgICByZXR1cm5cbiAgICAgfVxufVxuIiwiXG5pbXBvcnQgeyBPcHRpb25hbCwgUmVxdWlyZSB9IGZyb20gXCIuLi8uLi9MaWIvdHlwaW5nLmpzXCJcbmltcG9ydCB7IERhdGFUcmVlIH0gZnJvbSBcIi4vZGF0YS10cmVlLmpzXCJcblxuXG50eXBlIFJlZiA8TiBleHRlbmRzICROb2RlPiA9IFJlcXVpcmUgPFBhcnRpYWwgPE4+LCBcImNvbnRleHRcIiB8IFwidHlwZVwiIHwgXCJpZFwiPlxuXG50eXBlIEQgPE4gZXh0ZW5kcyAkTm9kZT4gPSBPcHRpb25hbCA8TiwgXCJjb250ZXh0XCIgfCBcInR5cGVcIiB8IFwiaWRcIj5cblxuXG5leHBvcnQgY2xhc3MgRGF0YWJhc2UgPE4gZXh0ZW5kcyAkTm9kZSA9ICROb2RlPiBleHRlbmRzIERhdGFUcmVlIDxOPlxue1xuICAgICBoYXMgKCBub2RlOiBSZWYgPE4+ICkgICAgICA6IGJvb2xlYW5cbiAgICAgaGFzICggLi4uIHBhdGg6IHN0cmluZyBbXSApOiBib29sZWFuXG4gICAgIGhhcyAoKTogYm9vbGVhblxuICAgICB7XG4gICAgICAgICAgaWYgKCBhcmd1bWVudHMubGVuZ3RoID09IDAgKVxuICAgICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgICBpZiAoIGFyZ3VtZW50cy5sZW5ndGggPT0gMSApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgY29uc3QgbzogTiA9IGFyZ3VtZW50cyBbMF1cbiAgICAgICAgICAgICAgIHJldHVybiBzdXBlci5uZWFyICggW28uY29udGV4dCwgby50eXBlLCBvLmlkXSApICE9PSB1bmRlZmluZWRcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHJldHVybiBzdXBlci5uZWFyICggYXJndW1lbnRzICkgIT09IHVuZGVmaW5lZFxuICAgICAgICAgIH1cbiAgICAgfVxuXG4gICAgIGNvdW50ICggbm9kZTogUmVmIDxOPiApICAgICAgOiBudW1iZXJcbiAgICAgY291bnQgKCAuLi4gcGF0aDogc3RyaW5nIFtdICk6IG51bWJlclxuICAgICBjb3VudCAoKTogbnVtYmVyXG4gICAgIHtcbiAgICAgICAgICBpZiAoIGFyZ3VtZW50cy5sZW5ndGggPT0gMCApXG4gICAgICAgICAgICAgICByZXR1cm5cblxuICAgICAgICAgIGlmICggYXJndW1lbnRzLmxlbmd0aCA9PSAxIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBjb25zdCBvOiBOID0gYXJndW1lbnRzIFswXVxuICAgICAgICAgICAgICAgcmV0dXJuIHN1cGVyLmNvdW50ICggW28uY29udGV4dCwgby50eXBlLCBvLmlkXSApXG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICByZXR1cm4gc3VwZXIuY291bnQgKCBhcmd1bWVudHMgKVxuICAgICAgICAgIH1cbiAgICAgfVxuXG4gICAgIHNldCA8JCBleHRlbmRzIE4+ICggbm9kZTogJCApICAgICAgICAgICAgICAgICAgICAgOiAkXG4gICAgIHNldCA8JCBleHRlbmRzIE4+ICggcGF0aDogc3RyaW5nIFtdLCBkYXRhOiBEIDwkPiApOiAkXG4gICAgIHNldCAoKTogTlxuICAgICB7XG4gICAgICAgICAgaWYgKCBhcmd1bWVudHMubGVuZ3RoID09IDAgKVxuICAgICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgICBpZiAoIGFyZ3VtZW50cy5sZW5ndGggPT0gMSApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgY29uc3QgbzogTiA9IGFyZ3VtZW50cyBbMF1cbiAgICAgICAgICAgICAgIHJldHVybiBzdXBlci5zZXQgKCBbby5jb250ZXh0LCBvLnR5cGUsIG8uaWRdLCBvIClcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHJldHVybiBzdXBlci5zZXQgKCBhcmd1bWVudHMgWzBdLCBhcmd1bWVudHMgWzFdIClcbiAgICAgICAgICB9XG4gICAgIH1cblxuICAgICBnZXQgPCQgZXh0ZW5kcyBOPiAoIG5vZGU6IFJlZiA8JE5vZGU+ICkgIDogJFxuICAgICBnZXQgPCQgZXh0ZW5kcyBOPiAoIC4uLiBwYXRoOiBzdHJpbmcgW10gKTogJFxuICAgICBnZXQgKCk6IE5cbiAgICAge1xuICAgICAgICAgIGlmICggYXJndW1lbnRzLmxlbmd0aCA9PSAwIClcbiAgICAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgICAgY29uc3QgcmVzdWx0ID0ge30gYXMgTlxuXG4gICAgICAgICAgaWYgKCBhcmd1bWVudHMubGVuZ3RoID09IDEgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNvbnN0IG86ICROb2RlID0gYXJndW1lbnRzIFswXVxuICAgICAgICAgICAgICAgc3VwZXIud2FsayAoIFtvLmNvbnRleHQsIG8udHlwZSwgby5pZF0sIGRhdGEgPT4ge1xuICAgICAgICAgICAgICAgICAgICBPYmplY3QuYXNzaWduICggcmVzdWx0LCBkYXRhIClcbiAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICByZXR1cm4gT2JqZWN0LmFzc2lnbiAoIHJlc3VsdCwgbyApXG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBzdXBlci53YWxrICggYXJndW1lbnRzLCBkYXRhID0+IHtcbiAgICAgICAgICAgICAgICAgICAgT2JqZWN0LmFzc2lnbiAoIHJlc3VsdCwgZGF0YSApXG4gICAgICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICAgICByZXR1cm4gT2JqZWN0LmFzc2lnbiAoIHJlc3VsdCwge1xuICAgICAgICAgICAgICAgICAgICBjb250ZXh0OiBhcmd1bWVudHMgWzBdLFxuICAgICAgICAgICAgICAgICAgICB0eXBlICAgOiBhcmd1bWVudHMgWzFdLFxuICAgICAgICAgICAgICAgICAgICBpZCAgICAgOiBhcmd1bWVudHMgWzJdLFxuICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICB9XG4gICAgIH1cbn1cbiIsIlxuaW1wb3J0IHsgRGF0YWJhc2UgfSBmcm9tIFwiLi9kYi5qc1wiXG5pbXBvcnQgeyBEYXRhVHJlZSwgUGF0aCB9IGZyb20gXCIuL2RhdGEtdHJlZS5qc1wiXG5cbmltcG9ydCB7IE9wdGlvbmFsIH0gZnJvbSBcIi4uLy4uL0xpYi9pbmRleC5qc1wiXG5cblxudHlwZSBJdGVtIDxUID0gYW55LCAkIGV4dGVuZHMgJE5vZGUgPSAkTm9kZT4gPVxue1xuICAgICBtdWx0aXBsZTogYm9vbGVhblxuICAgICBpbnN0YW5jZXM6IFQgW11cbiAgICAgY29uc3RydWN0b3I6IG5ldyAoIGRhdGE6ICQgKSA9PiBUXG59XG5cbnR5cGUgJEluIDxOIGV4dGVuZHMgJE5vZGUgPSAkTm9kZT4gPSBPcHRpb25hbCA8TiwgXCJjb250ZXh0XCI+XG5cbi8vZXhwb3J0IHR5cGUgQ3RvciA8TiBleHRlbmRzICROb2RlID0gJE5vZGUsIFQgPSBhbnk+ID0gbmV3ICggZGF0YTogTiApID0+IFRcbmV4cG9ydCB0eXBlIEN0b3IgPE4gZXh0ZW5kcyAkTm9kZSA9ICROb2RlLCBUID0gYW55PiA9IG5ldyAoIGRhdGE6IE4sIGNoaWxkcmVuPzogYW55IFtdICkgPT4gVFxuXG50eXBlIEFyZyA8Rj4gPSBGIGV4dGVuZHMgbmV3ICggZGF0YTogaW5mZXIgRCApID0+IGFueSA/IEQgOiBhbnlcblxuXG5leHBvcnQgY2xhc3MgRmFjdG9yeSA8RSA9IGFueSwgTiBleHRlbmRzICROb2RlID0gJE5vZGU+XG57XG4gICAgIGNvbnN0cnVjdG9yICggcmVhZG9ubHkgZGI6IERhdGFiYXNlIDxOPiApIHt9XG5cbiAgICAgcHJpdmF0ZSBjdG9ycyA9IG5ldyBEYXRhVHJlZSA8Q3RvciA8JE5vZGUsIEU+PiAoKVxuICAgICBwcml2YXRlIGluc3RzID0gIG5ldyBEYXRhVHJlZSA8RT4gKClcblxuXG4gICAgIGdldFBhdGggKCBub2RlOiAkTm9kZSApICAgICAgICA6IFBhdGhcbiAgICAgZ2V0UGF0aCAoIHBhdGg6IFBhdGggKSAgICAgICAgIDogUGF0aFxuICAgICBnZXRQYXRoICggLi4uIHBhdGg6IHN0cmluZyBbXSApOiBQYXRoXG5cbiAgICAgZ2V0UGF0aCAoKVxuICAgICB7XG4gICAgICAgICAgaWYgKCBhcmd1bWVudHMubGVuZ3RoID09IDAgKVxuICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yICggXCJOdWxsIGFyZ3VtZW50XCIgKVxuXG4gICAgICAgICAgY29uc3QgYXJnICA9IGFyZ3VtZW50cyBbMF1cblxuICAgICAgICAgIGlmICggdHlwZW9mIGFyZyA9PSBcInN0cmluZ1wiIClcbiAgICAgICAgICAgICAgIHJldHVybiBhcmd1bWVudHMgYXMgUGF0aFxuXG4gICAgICAgICAgaWYgKCBBcnJheS5pc0FycmF5ICggYXJnKSApXG4gICAgICAgICAgICAgICByZXR1cm4gYXJnLmZsYXQgKCkgYXMgUGF0aFxuXG4gICAgICAgICAgcmV0dXJuIFsgYXJnLmNvbnRleHQsIGFyZy50eXBlLCBhcmcuaWQgXSBhcyBQYXRoXG4gICAgIH1cblxuICAgICBpblN0b2NrICggbm9kZTogJE5vZGUgKSAgICAgICAgOiBib29sZWFuXG4gICAgIGluU3RvY2sgKCBwYXRoOiBQYXRoICkgICAgICAgICA6IGJvb2xlYW5cbiAgICAgaW5TdG9jayAoIC4uLiBwYXRoOiBzdHJpbmcgW10gKTogYm9vbGVhblxuXG4gICAgIGluU3RvY2sgKCk6IGJvb2xlYW5cbiAgICAge1xuICAgICAgICAgIHJldHVybiB0aGlzLmluc3RzLmhhcyAoIHRoaXMuZ2V0UGF0aCAoIC4uLiBhcmd1bWVudHMgKSBhcyBQYXRoIClcbiAgICAgfVxuICAgICBfaW5TdG9jayAoIHBhdGg6IFBhdGggKVxuICAgICB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuaW5zdHMuaGFzICggcGF0aCApXG4gICAgIH1cblxuICAgICBkZWZpbmUgPEYgZXh0ZW5kcyBDdG9yPiAoIGN0b3I6IEYsIG5vZGU6IEFyZyA8Rj4gKSAgICAgIDogdm9pZFxuICAgICBkZWZpbmUgPEYgZXh0ZW5kcyBDdG9yPiAoIGN0b3I6IEYsIHBhdGg6IFBhdGggKSAgICAgICAgIDogdm9pZFxuICAgICBkZWZpbmUgPEYgZXh0ZW5kcyBDdG9yPiAoIGN0b3I6IEYsIC4uLiBwYXRoOiBzdHJpbmcgW10gKTogdm9pZFxuXG4gICAgIGRlZmluZSAoIGN0b3I6IEN0b3IsIC4uLiByZXN0OiBhbnkgW10gKVxuICAgICB7XG4gICAgICAgICAgdmFyIHBhdGggPSB0aGlzLmdldFBhdGggKCAuLi4gcmVzdCApXG5cbiAgICAgICAgICBpZiAoIHRoaXMuY3RvcnMuaGFzICggcGF0aCApIClcbiAgICAgICAgICAgICAgIHRocm93IFwiQmFkIGFyZ3VtZW50XCJcblxuICAgICAgICAgIHJldHVybiB0aGlzLmN0b3JzLnNldCAoIHBhdGgsIGN0b3IgKVxuICAgICB9XG4gICAgIF9kZWZpbmUgKCBjdG9yOiBDdG9yLCBwYXRoOiBQYXRoIClcbiAgICAge1xuICAgICAgICAgIGlmICggdGhpcy5jdG9ycy5oYXMgKCBwYXRoICkgKVxuICAgICAgICAgICAgICAgdGhyb3cgXCJCYWQgYXJndW1lbnRcIlxuXG4gICAgICAgICAgcmV0dXJuIHRoaXMuY3RvcnMuc2V0ICggcGF0aCwgY3RvciApXG4gICAgIH1cblxuICAgICBwaWNrIDxSIGV4dGVuZHMgRSwgJCBleHRlbmRzIE4gPSBOPiAoIG5vZGU6ICROb2RlICk6IFJcbiAgICAgcGljayA8UiBleHRlbmRzIEU+ICggLi4uIHBhdGg6IHN0cmluZyBbXSApICAgICAgICAgOiBSXG4gICAgIHBpY2sgPFIgZXh0ZW5kcyBFPiAoIHBhdGg6IFBhdGggKSAgICAgICAgICAgICAgICAgIDogUlxuXG4gICAgIHBpY2sgKCk6IEVcbiAgICAge1xuICAgICAgICAgIHZhciBwYXRoID0gdGhpcy5nZXRQYXRoICggLi4uIGFyZ3VtZW50cyApXG5cbiAgICAgICAgICBpZiAoIHRoaXMuaW5zdHMuaGFzICggcGF0aCApIClcbiAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmluc3RzLmdldCAoIHBhdGggKVxuXG4gICAgICAgICAgdGhyb3cgXCJCYWQgYXJndW1lbnRcIlxuICAgICB9XG4gICAgIF9waWNrICggcGF0aDogUGF0aCApXG4gICAgIHtcbiAgICAgICAgICBpZiAoIHRoaXMuaW5zdHMuaGFzICggcGF0aCApIClcbiAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmluc3RzLmdldCAoIHBhdGggKVxuXG4gICAgICAgICAgdGhyb3cgXCJCYWQgYXJndW1lbnRcIlxuICAgICB9XG5cbiAgICAgbWFrZSA8UiBleHRlbmRzIEUsICQgZXh0ZW5kcyBOID0gTj4gKCBub2RlOiAkICk6IFJcbiAgICAgbWFrZSA8UiBleHRlbmRzIEU+ICggcGF0aDogUGF0aCApICAgICAgICAgICAgICA6IFJcbiAgICAgbWFrZSA8UiBleHRlbmRzIEU+ICggLi4uIHBhdGg6IHN0cmluZyBbXSApICAgICA6IFJcblxuICAgICBtYWtlICgpOiBFXG4gICAgIHtcbiAgICAgICAgICB2YXIgcGF0aCA9IHRoaXMuZ2V0UGF0aCAoIC4uLiBhcmd1bWVudHMgKVxuXG4gICAgICAgICAgY29uc3QgYXJnICA9IGFyZ3VtZW50cyBbMF1cblxuICAgICAgICAgIGlmICggdHlwZW9mIGFyZyA9PSBcIm9iamVjdFwiICYmICEgQXJyYXkuaXNBcnJheSAoYXJnKSApXG4gICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fbWFrZSAoIHBhdGgsIGFyZyApXG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX21ha2UgKCBwYXRoIClcbiAgICAgfVxuICAgICBfbWFrZSAoIHBhdGg6IFBhdGgsIGRhdGE/OiBQYXJ0aWFsIDxOPiApXG4gICAgIHtcbiAgICAgICAgICBpZiAoIHRoaXMuaW5zdHMuaGFzICggcGF0aCApIClcbiAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmluc3RzLmdldCAoIHBhdGggKVxuXG4gICAgICAgICAgY29uc3QgY3RvciA9IHRoaXMuY3RvcnMubmVhciAoIHBhdGggKVxuXG4gICAgICAgICAgaWYgKCBjdG9yID09IHVuZGVmaW5lZCApXG4gICAgICAgICAgICAgICB0aHJvdyBcIkJhZCBhcmd1bWVudFwiXG5cbiAgICAgICAgICBjb25zdCB0bXAgPSB0aGlzLmRiLmdldCAoIC4uLiBwYXRoIClcblxuICAgICAgICAgIGRhdGEgPSBkYXRhID09IHVuZGVmaW5lZFxuICAgICAgICAgICAgICAgPyB0bXBcbiAgICAgICAgICAgICAgIDogT2JqZWN0LmFzc2lnbiAoIHRtcCwgZGF0YSApXG5cbiAgICAgICAgICByZXR1cm4gdGhpcy5pbnN0cy5zZXQgKCBwYXRoLCBuZXcgY3RvciAoIGRhdGEgYXMgTiApIClcbiAgICAgfVxufVxuIiwiXG5cblxuZXhwb3J0IGNvbnN0IHhub2RlID0gKCgpID0+XG57XG4gICAgIGNvbnN0IHN2Z19uYW1lcyA9IFsgXCJzdmdcIiwgXCJnXCIsIFwibGluZVwiLCBcImNpcmNsZVwiLCBcInBhdGhcIiwgXCJ0ZXh0XCIgXVxuXG4gICAgIGZ1bmN0aW9uIGNyZWF0ZSAoXG4gICAgICAgICAgbmFtZToga2V5b2YgSlNYLkludHJpbnNpY0hUTUxFbGVtZW50cyxcbiAgICAgICAgICBwcm9wczogYW55LFxuICAgICAgICAgIC4uLmNoaWxkcmVuOiBbIEhUTUxFbGVtZW50IHwgc3RyaW5nIHwgYW55W10gXVxuICAgICApOiBIVE1MRWxlbWVudFxuXG4gICAgIGZ1bmN0aW9uIGNyZWF0ZSAoXG4gICAgICAgICAgbmFtZToga2V5b2YgSlNYLkludHJpbnNpY1NWR0VsZW1lbnRzLFxuICAgICAgICAgIHByb3BzOiBhbnksXG4gICAgICAgICAgLi4uY2hpbGRyZW46IFsgSFRNTEVsZW1lbnQgfCBzdHJpbmcgfCBhbnlbXSBdXG4gICAgICk6IFNWR0VsZW1lbnRcblxuICAgICBmdW5jdGlvbiBjcmVhdGUgKFxuICAgICAgICAgIG5hbWU6IHN0cmluZyxcbiAgICAgICAgICBwcm9wczogYW55LFxuICAgICAgICAgIC4uLmNoaWxkcmVuOiBbIEhUTUxFbGVtZW50IHwgc3RyaW5nIHwgYW55W10gXVxuICAgICApOiBIVE1MRWxlbWVudCB8IFNWR0VsZW1lbnRcbiAgICAge1xuICAgICAgICAgIHByb3BzID0gT2JqZWN0LmFzc2lnbiAoIHt9LCBwcm9wcyApXG5cbiAgICAgICAgICBjb25zdCBlbGVtZW50ID0gc3ZnX25hbWVzLmluZGV4T2YgKCBuYW1lICkgPT09IC0xXG4gICAgICAgICAgICAgICAgICAgID8gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCAoIG5hbWUgKVxuICAgICAgICAgICAgICAgICAgICA6IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyAoIFwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiwgbmFtZSApXG5cbiAgICAgICAgICBjb25zdCBjb250ZW50ID0gW10gYXMgYW55W11cblxuICAgICAgICAgIC8vIENoaWxkcmVuXG5cbiAgICAgICAgICB3aGlsZSAoIGNoaWxkcmVuLmxlbmd0aCA+IDAgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGxldCBjaGlsZCA9IGNoaWxkcmVuLnBvcCgpXG5cbiAgICAgICAgICAgICAgIGlmICggQXJyYXkuaXNBcnJheSggY2hpbGQgKSApXG4gICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAoIHZhciBpID0gMCA7IGkgIT0gY2hpbGQubGVuZ3RoIDsgaSsrIClcbiAgICAgICAgICAgICAgICAgICAgICAgICBjaGlsZHJlbi5wdXNoKCBjaGlsZCBbaV0gKVxuICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBjb250ZW50LnB1c2goIGNoaWxkIClcbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICB3aGlsZSAoIGNvbnRlbnQubGVuZ3RoID4gMCApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgbGV0IGNoaWxkID0gY29udGVudC5wb3AoKVxuXG4gICAgICAgICAgICAgICBpZiAoIGNoaWxkIGluc3RhbmNlb2YgTm9kZSApXG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQoIGNoaWxkIClcblxuICAgICAgICAgICAgICAgZWxzZSBpZiAoIHR5cGVvZiBjaGlsZCA9PSBcImJvb2xlYW5cIiB8fCBjaGlsZCApXG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQoIGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKCBjaGlsZC50b1N0cmluZygpICkgKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIEF0dHJpYnV0ZXNcblxuICAgICAgICAgIGNvbnN0IGlzQXJyYXkgPSBBcnJheS5pc0FycmF5XG4gICAgICAgICAgY29uc3QgY29udjogUmVjb3JkIDxzdHJpbmcsICh2OiBhbnkpID0+IHN0cmluZz4gPVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNsYXNzOiAoIHYgKSA9PiBpc0FycmF5ICh2KSA/IHYuam9pbiAoXCIgXCIpIDogdixcbiAgICAgICAgICAgICAgIHN0eWxlOiAoIHYgKSA9PiBpc0FycmF5ICh2KSA/IHYuam9pbiAoXCIgXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogdHlwZW9mIHYgPT0gXCJvYmplY3RcIiA/IG9iamVjdFRvU3R5bGUgKHYpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogdixcbiAgICAgICAgICAgICAgIC8vIHN2Z1xuICAgICAgICAgICAgICAgZDogKCB2ICkgPT4gaXNBcnJheSAodikgPyB2LmpvaW4gKFwiIFwiKSA6IHYsXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgZm9yICggY29uc3Qga2V5IGluIHByb3BzIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBjb25zdCB2YWx1ZSA9IHByb3BzW2tleV1cblxuICAgICAgICAgICAgICAgaWYgKCB0eXBlb2YgdmFsdWUgPT0gXCJmdW5jdGlvblwiIClcbiAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyICgga2V5LCB2YWx1ZSApXG5cbiAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGUgKCBrZXksIChjb252W2tleV0gfHwgKHY9PnYpKSAodmFsdWUpIClcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gZWxlbWVudFxuXG4gICAgICAgICAgZnVuY3Rpb24gb2JqZWN0VG9TdHlsZSAoIG9iajogb2JqZWN0IClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICB2YXIgcmVzdWx0ID0gXCJcIlxuXG4gICAgICAgICAgICAgICBmb3IgKCBjb25zdCBrZXkgaW4gb2JqIClcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0ICs9IGtleSArIFwiOiBcIiArIG9iaiBba2V5XSArIFwiOyBcIlxuXG4gICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgZnVuY3Rpb24gY2FtZWxpemUgKCBzdHI6IHN0cmluZyApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgcmV0dXJuIHN0ci5yZXBsYWNlIChcbiAgICAgICAgICAgICAgICAgICAgLyg/OltBLVpdfFxcYlxcdykvZyxcbiAgICAgICAgICAgICAgICAgICAgKCB3b3JkLCBpbmRleCApID0+IGluZGV4ID09IDAgPyB3b3JkLnRvTG93ZXJDYXNlKCkgOiB3b3JkLnRvVXBwZXJDYXNlKClcbiAgICAgICAgICAgICAgICkucmVwbGFjZSgvXFxzKy9nLCAnJyk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgZnVuY3Rpb24gdW5jYW1lbGl6ZSAoIHN0cjogc3RyaW5nIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICByZXR1cm4gc3RyLnRyaW0gKCkucmVwbGFjZSAoXG4gICAgICAgICAgICAgICAvLyAgIC8oPzwhLSkoPzpbQS1aXXxcXGJcXHcpL2csXG4gICAgICAgICAgICAgICAgICAgIC8oPzpbQS1aXXxcXGJcXHcpL2csXG4gICAgICAgICAgICAgICAgICAgICggd29yZCwgaW5kZXggKSA9PiBpbmRleCA9PSAwID8gd29yZC50b0xvd2VyQ2FzZSgpIDogJy0nICsgd29yZC50b0xvd2VyQ2FzZSgpXG4gICAgICAgICAgICAgICApLnJlcGxhY2UoLyg/Olxccyt8XykvZywgJycpO1xuICAgICAgICAgIH1cbiAgICAgfVxuXG4gICAgIHJldHVybiBjcmVhdGVcblxufSkgKClcblxuZGVjbGFyZSBnbG9iYWxcbntcbiAgICAgZXhwb3J0IG5hbWVzcGFjZSBKU1hcbiAgICAge1xuICAgICAgICAgIGV4cG9ydCB0eXBlIEVsZW1lbnQgPSBIVE1MRWxlbWVudCB8IFNWR0VsZW1lbnRcblxuICAgICAgICAgIGV4cG9ydCB0eXBlIEludHJpbnNpY0VsZW1lbnRzID0gSW50cmluc2ljSFRNTEVsZW1lbnRzICYgSW50cmluc2ljU1ZHRWxlbWVudHNcblxuICAgICAgICAgIGV4cG9ydCBpbnRlcmZhY2UgSW50cmluc2ljSFRNTEVsZW1lbnRzXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgYSAgICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGFiYnIgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBhZGRyZXNzICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgYXJlYSAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGFydGljbGUgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBhc2lkZSAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgYXVkaW8gICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGIgICAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBiYXNlICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgYmRpICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGJkbyAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBiaWcgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgYmxvY2txdW90ZTogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGJvZHkgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBiciAgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgYnV0dG9uICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGNhbnZhcyAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBjYXB0aW9uICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgY2l0ZSAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGNvZGUgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBjb2wgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgY29sZ3JvdXAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGRhdGEgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBkYXRhbGlzdCAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZGQgICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGRlbCAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBkZXRhaWxzICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZGZuICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGRpYWxvZyAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBkaXYgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZGwgICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGR0ICAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBlbSAgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZW1iZWQgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGZpZWxkc2V0ICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBmaWdjYXB0aW9uOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZmlndXJlICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGZvb3RlciAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBmb3JtICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgaDEgICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGgyICAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBoMyAgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgaDQgICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGg1ICAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBoNiAgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgaGVhZCAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGhlYWRlciAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBoZ3JvdXAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgaHIgICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGh0bWwgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBpICAgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgaWZyYW1lICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGltZyAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBpbnB1dCAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgaW5zICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGtiZCAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBrZXlnZW4gICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgbGFiZWwgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGxlZ2VuZCAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBsaSAgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgbGluayAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIG1haW4gICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBtYXAgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgbWFyayAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIG1lbnUgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBtZW51aXRlbSAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgbWV0YSAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIG1ldGVyICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBuYXYgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgbm9zY3JpcHQgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIG9iamVjdCAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBvbCAgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgb3B0Z3JvdXAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIG9wdGlvbiAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBvdXRwdXQgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgcCAgICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHBhcmFtICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBwaWN0dXJlICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgcHJlICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHByb2dyZXNzICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBxICAgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgcnAgICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHJ0ICAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBydWJ5ICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgcyAgICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHNhbXAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBzY3JpcHQgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgc2VjdGlvbiAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHNlbGVjdCAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBzbG90ICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgc21hbGwgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHNvdXJjZSAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBzcGFuICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgc3Ryb25nICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHN0eWxlICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBzdWIgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgc3VtbWFyeSAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHN1cCAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICB0YWJsZSAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgdGJvZHkgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHRkICAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICB0ZXh0YXJlYSAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgdGZvb3QgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHRoICAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICB0aGVhZCAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgdGltZSAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHRpdGxlICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICB0ciAgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgdHJhY2sgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHUgICAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICB1bCAgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgXCJ2YXJcIiAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgdmlkZW8gICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHdiciAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgZXhwb3J0IGludGVyZmFjZSBJbnRyaW5zaWNTVkdFbGVtZW50c1xuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHN2ZyAgICAgICAgICAgICAgICA6IFNWR0F0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGFuaW1hdGUgICAgICAgICAgICA6IFNWR0F0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGNpcmNsZSAgICAgICAgICAgICA6IFNWR0F0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGNsaXBQYXRoICAgICAgICAgICA6IFNWR0F0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGRlZnMgICAgICAgICAgICAgICA6IFNWR0F0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGRlc2MgICAgICAgICAgICAgICA6IFNWR0F0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGVsbGlwc2UgICAgICAgICAgICA6IFNWR0F0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGZlQmxlbmQgICAgICAgICAgICA6IFNWR0F0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGZlQ29sb3JNYXRyaXggICAgICA6IFNWR0F0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGZlQ29tcG9uZW50VHJhbnNmZXI6IFNWR0F0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGZlQ29tcG9zaXRlICAgICAgICA6IFNWR0F0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGZlQ29udm9sdmVNYXRyaXggICA6IFNWR0F0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGZlRGlmZnVzZUxpZ2h0aW5nICA6IFNWR0F0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGZlRGlzcGxhY2VtZW50TWFwICA6IFNWR0F0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGZlRmxvb2QgICAgICAgICAgICA6IFNWR0F0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGZlR2F1c3NpYW5CbHVyICAgICA6IFNWR0F0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGZlSW1hZ2UgICAgICAgICAgICA6IFNWR0F0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGZlTWVyZ2UgICAgICAgICAgICA6IFNWR0F0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGZlTWVyZ2VOb2RlICAgICAgICA6IFNWR0F0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGZlTW9ycGhvbG9neSAgICAgICA6IFNWR0F0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGZlT2Zmc2V0ICAgICAgICAgICA6IFNWR0F0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGZlU3BlY3VsYXJMaWdodGluZyA6IFNWR0F0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGZlVGlsZSAgICAgICAgICAgICA6IFNWR0F0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGZlVHVyYnVsZW5jZSAgICAgICA6IFNWR0F0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGZpbHRlciAgICAgICAgICAgICA6IFNWR0F0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGZvcmVpZ25PYmplY3QgICAgICA6IFNWR0F0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGcgICAgICAgICAgICAgICAgICA6IFNWR0F0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGltYWdlICAgICAgICAgICAgICA6IFNWR0F0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGxpbmUgICAgICAgICAgICAgICA6IFNWR0F0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGxpbmVhckdyYWRpZW50ICAgICA6IFNWR0F0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIG1hcmtlciAgICAgICAgICAgICA6IFNWR0F0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIG1hc2sgICAgICAgICAgICAgICA6IFNWR0F0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHBhdGggICAgICAgICAgICAgICA6IFNWR0F0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHBhdHRlcm4gICAgICAgICAgICA6IFNWR0F0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHBvbHlnb24gICAgICAgICAgICA6IFNWR0F0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHBvbHlsaW5lICAgICAgICAgICA6IFNWR0F0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHJhZGlhbEdyYWRpZW50ICAgICA6IFNWR0F0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHJlY3QgICAgICAgICAgICAgICA6IFNWR0F0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHN0b3AgICAgICAgICAgICAgICA6IFNWR0F0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHN5bWJvbCAgICAgICAgICAgICA6IFNWR0F0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHRleHQgICAgICAgICAgICAgICA6IFNWR0F0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHRzcGFuICAgICAgICAgICAgICA6IFNWR0F0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHVzZSAgICAgICAgICAgICAgICA6IFNWR0F0dHJpYnV0ZXNcbiAgICAgICAgICB9XG4gICAgIH1cblxuXG4gICAgIGludGVyZmFjZSBQYXRoQXR0cmlidXRlc1xuICAgICB7XG4gICAgICAgICAgZDogc3RyaW5nXG4gICAgIH1cblxuICAgICB0eXBlIEV2ZW50SGFuZGxlciA8RSBleHRlbmRzIEV2ZW50PiA9ICggZXZlbnQ6IEUgKSA9PiB2b2lkXG5cbiAgICAgdHlwZSBDbGlwYm9hcmRFdmVudEhhbmRsZXIgICA9IEV2ZW50SGFuZGxlcjxDbGlwYm9hcmRFdmVudD5cbiAgICAgdHlwZSBDb21wb3NpdGlvbkV2ZW50SGFuZGxlciA9IEV2ZW50SGFuZGxlcjxDb21wb3NpdGlvbkV2ZW50PlxuICAgICB0eXBlIERyYWdFdmVudEhhbmRsZXIgICAgICAgID0gRXZlbnRIYW5kbGVyPERyYWdFdmVudD5cbiAgICAgdHlwZSBGb2N1c0V2ZW50SGFuZGxlciAgICAgICA9IEV2ZW50SGFuZGxlcjxGb2N1c0V2ZW50PlxuICAgICB0eXBlIEtleWJvYXJkRXZlbnRIYW5kbGVyICAgID0gRXZlbnRIYW5kbGVyPEtleWJvYXJkRXZlbnQ+XG4gICAgIHR5cGUgTW91c2VFdmVudEhhbmRsZXIgICAgICAgPSBFdmVudEhhbmRsZXI8TW91c2VFdmVudD5cbiAgICAgdHlwZSBUb3VjaEV2ZW50SGFuZGxlciAgICAgICA9IEV2ZW50SGFuZGxlcjxUb3VjaEV2ZW50PlxuICAgICB0eXBlIFVJRXZlbnRIYW5kbGVyICAgICAgICAgID0gRXZlbnRIYW5kbGVyPFVJRXZlbnQ+XG4gICAgIHR5cGUgV2hlZWxFdmVudEhhbmRsZXIgICAgICAgPSBFdmVudEhhbmRsZXI8V2hlZWxFdmVudD5cbiAgICAgdHlwZSBBbmltYXRpb25FdmVudEhhbmRsZXIgICA9IEV2ZW50SGFuZGxlcjxBbmltYXRpb25FdmVudD5cbiAgICAgdHlwZSBUcmFuc2l0aW9uRXZlbnRIYW5kbGVyICA9IEV2ZW50SGFuZGxlcjxUcmFuc2l0aW9uRXZlbnQ+XG4gICAgIHR5cGUgR2VuZXJpY0V2ZW50SGFuZGxlciAgICAgPSBFdmVudEhhbmRsZXI8RXZlbnQ+XG4gICAgIHR5cGUgUG9pbnRlckV2ZW50SGFuZGxlciAgICAgPSBFdmVudEhhbmRsZXI8UG9pbnRlckV2ZW50PlxuXG4gICAgIGludGVyZmFjZSBET01BdHRyaWJ1dGVzXG4gICAgIHtcbiAgICAgICAgICBbZXZlbnQ6IHN0cmluZ106IGFueVxuXG4gICAgICAgICAgLy8gI3JlZ2lvbiBJbWFnZSBFdmVudHNcbiAgICAgICAgICBvbkxvYWQ/ICAgICAgICA6IEdlbmVyaWNFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkxvYWRDYXB0dXJlPyA6IEdlbmVyaWNFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkVycm9yPyAgICAgICA6IEdlbmVyaWNFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkVycm9yQ2FwdHVyZT86IEdlbmVyaWNFdmVudEhhbmRsZXJcbiAgICAgICAgICAvLyAjZW5kcmVnaW9uXG5cbiAgICAgICAgICAvLyAjcmVnaW9uIENsaXBib2FyZCBFdmVudHNcbiAgICAgICAgICBvbkNvcHk/ICAgICAgICA6IENsaXBib2FyZEV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uQ29weUNhcHR1cmU/IDogQ2xpcGJvYXJkRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25DdXQ/ICAgICAgICAgOiBDbGlwYm9hcmRFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkN1dENhcHR1cmU/ICA6IENsaXBib2FyZEV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uUGFzdGU/ICAgICAgIDogQ2xpcGJvYXJkRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25QYXN0ZUNhcHR1cmU/OiBDbGlwYm9hcmRFdmVudEhhbmRsZXJcbiAgICAgICAgICAvLyAjZW5kcmVnaW9uXG5cbiAgICAgICAgICAvLyAjcmVnaW9uIENvbXBvc2l0aW9uIEV2ZW50c1xuICAgICAgICAgIG9uQ29tcG9zaXRpb25FbmQ/ICAgICAgICAgIDogQ29tcG9zaXRpb25FdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkNvbXBvc2l0aW9uRW5kQ2FwdHVyZT8gICA6IENvbXBvc2l0aW9uRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Db21wb3NpdGlvblN0YXJ0PyAgICAgICAgOiBDb21wb3NpdGlvbkV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uQ29tcG9zaXRpb25TdGFydENhcHR1cmU/IDogQ29tcG9zaXRpb25FdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkNvbXBvc2l0aW9uVXBkYXRlPyAgICAgICA6IENvbXBvc2l0aW9uRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Db21wb3NpdGlvblVwZGF0ZUNhcHR1cmU/OiBDb21wb3NpdGlvbkV2ZW50SGFuZGxlclxuICAgICAgICAgIC8vICNlbmRyZWdpb25cblxuICAgICAgICAgIC8vICNyZWdpb24gRm9jdXMgRXZlbnRzXG4gICAgICAgICAgb25Gb2N1cz8gICAgICAgOiBGb2N1c0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRm9jdXNDYXB0dXJlPzogRm9jdXNFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkJsdXI/ICAgICAgICA6IEZvY3VzRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25CbHVyQ2FwdHVyZT8gOiBGb2N1c0V2ZW50SGFuZGxlclxuICAgICAgICAgIC8vICNlbmRyZWdpb25cblxuICAgICAgICAgIC8vICNyZWdpb24gRm9ybSBFdmVudHNcbiAgICAgICAgICBvbkNoYW5nZT8gICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uQ2hhbmdlQ2FwdHVyZT8gOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25JbnB1dD8gICAgICAgICA6IEdlbmVyaWNFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbklucHV0Q2FwdHVyZT8gIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uU2VhcmNoPyAgICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25TZWFyY2hDYXB0dXJlPyA6IEdlbmVyaWNFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblN1Ym1pdD8gICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uU3VibWl0Q2FwdHVyZT8gOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25JbnZhbGlkPyAgICAgICA6IEdlbmVyaWNFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkludmFsaWRDYXB0dXJlPzogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIC8vICNlbmRyZWdpb25cblxuICAgICAgICAgIC8vICNyZWdpb24gS2V5Ym9hcmQgRXZlbnRzXG4gICAgICAgICAgb25LZXlEb3duPyAgICAgICAgOiBLZXlib2FyZEV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uS2V5RG93bkNhcHR1cmU/IDogS2V5Ym9hcmRFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbktleVByZXNzPyAgICAgICA6IEtleWJvYXJkRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25LZXlQcmVzc0NhcHR1cmU/OiBLZXlib2FyZEV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uS2V5VXA/ICAgICAgICAgIDogS2V5Ym9hcmRFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbktleVVwQ2FwdHVyZT8gICA6IEtleWJvYXJkRXZlbnRIYW5kbGVyXG4gICAgICAgICAgLy8gI2VuZHJlZ2lvblxuXG4gICAgICAgICAgLy8gI3JlZ2lvbiBNZWRpYSBFdmVudHNcbiAgICAgICAgICBvbkFib3J0PyAgICAgICAgICAgICAgICA6IEdlbmVyaWNFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkFib3J0Q2FwdHVyZT8gICAgICAgICA6IEdlbmVyaWNFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkNhblBsYXk/ICAgICAgICAgICAgICA6IEdlbmVyaWNFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkNhblBsYXlDYXB0dXJlPyAgICAgICA6IEdlbmVyaWNFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkNhblBsYXlUaHJvdWdoPyAgICAgICA6IEdlbmVyaWNFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkNhblBsYXlUaHJvdWdoQ2FwdHVyZT86IEdlbmVyaWNFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkR1cmF0aW9uQ2hhbmdlPyAgICAgICA6IEdlbmVyaWNFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkR1cmF0aW9uQ2hhbmdlQ2FwdHVyZT86IEdlbmVyaWNFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkVtcHRpZWQ/ICAgICAgICAgICAgICA6IEdlbmVyaWNFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkVtcHRpZWRDYXB0dXJlPyAgICAgICA6IEdlbmVyaWNFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkVuY3J5cHRlZD8gICAgICAgICAgICA6IEdlbmVyaWNFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkVuY3J5cHRlZENhcHR1cmU/ICAgICA6IEdlbmVyaWNFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkVuZGVkPyAgICAgICAgICAgICAgICA6IEdlbmVyaWNFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkVuZGVkQ2FwdHVyZT8gICAgICAgICA6IEdlbmVyaWNFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkxvYWRlZERhdGE/ICAgICAgICAgICA6IEdlbmVyaWNFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkxvYWRlZERhdGFDYXB0dXJlPyAgICA6IEdlbmVyaWNFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkxvYWRlZE1ldGFkYXRhPyAgICAgICA6IEdlbmVyaWNFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkxvYWRlZE1ldGFkYXRhQ2FwdHVyZT86IEdlbmVyaWNFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkxvYWRTdGFydD8gICAgICAgICAgICA6IEdlbmVyaWNFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkxvYWRTdGFydENhcHR1cmU/ICAgICA6IEdlbmVyaWNFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblBhdXNlPyAgICAgICAgICAgICAgICA6IEdlbmVyaWNFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblBhdXNlQ2FwdHVyZT8gICAgICAgICA6IEdlbmVyaWNFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblBsYXk/ICAgICAgICAgICAgICAgICA6IEdlbmVyaWNFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblBsYXlDYXB0dXJlPyAgICAgICAgICA6IEdlbmVyaWNFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblBsYXlpbmc/ICAgICAgICAgICAgICA6IEdlbmVyaWNFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblBsYXlpbmdDYXB0dXJlPyAgICAgICA6IEdlbmVyaWNFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblByb2dyZXNzPyAgICAgICAgICAgICA6IEdlbmVyaWNFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblByb2dyZXNzQ2FwdHVyZT8gICAgICA6IEdlbmVyaWNFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblJhdGVDaGFuZ2U/ICAgICAgICAgICA6IEdlbmVyaWNFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblJhdGVDaGFuZ2VDYXB0dXJlPyAgICA6IEdlbmVyaWNFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblNlZWtlZD8gICAgICAgICAgICAgICA6IEdlbmVyaWNFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblNlZWtlZENhcHR1cmU/ICAgICAgICA6IEdlbmVyaWNFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblNlZWtpbmc/ICAgICAgICAgICAgICA6IEdlbmVyaWNFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblNlZWtpbmdDYXB0dXJlPyAgICAgICA6IEdlbmVyaWNFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblN0YWxsZWQ/ICAgICAgICAgICAgICA6IEdlbmVyaWNFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblN0YWxsZWRDYXB0dXJlPyAgICAgICA6IEdlbmVyaWNFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblN1c3BlbmQ/ICAgICAgICAgICAgICA6IEdlbmVyaWNFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblN1c3BlbmRDYXB0dXJlPyAgICAgICA6IEdlbmVyaWNFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblRpbWVVcGRhdGU/ICAgICAgICAgICA6IEdlbmVyaWNFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblRpbWVVcGRhdGVDYXB0dXJlPyAgICA6IEdlbmVyaWNFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblZvbHVtZUNoYW5nZT8gICAgICAgICA6IEdlbmVyaWNFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblZvbHVtZUNoYW5nZUNhcHR1cmU/ICA6IEdlbmVyaWNFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbldhaXRpbmc/ICAgICAgICAgICAgICA6IEdlbmVyaWNFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbldhaXRpbmdDYXB0dXJlPyAgICAgICA6IEdlbmVyaWNFdmVudEhhbmRsZXJcbiAgICAgICAgICAvLyAjZW5kcmVnaW9uXG5cbiAgICAgICAgICAvLyAjcmVnaW9uIE1vdXNlRXZlbnRzXG4gICAgICAgICAgb25DbGljaz8gICAgICAgICAgICAgOiBNb3VzZUV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uQ2xpY2tDYXB0dXJlPyAgICAgIDogTW91c2VFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkNvbnRleHRNZW51PyAgICAgICA6IE1vdXNlRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Db250ZXh0TWVudUNhcHR1cmU/OiBNb3VzZUV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRGJsQ2xpY2s/ICAgICAgICAgIDogTW91c2VFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkRibENsaWNrQ2FwdHVyZT8gICA6IE1vdXNlRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25EcmFnPyAgICAgICAgICAgICAgOiBEcmFnRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25EcmFnQ2FwdHVyZT8gICAgICAgOiBEcmFnRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25EcmFnRW5kPyAgICAgICAgICAgOiBEcmFnRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25EcmFnRW5kQ2FwdHVyZT8gICAgOiBEcmFnRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25EcmFnRW50ZXI/ICAgICAgICAgOiBEcmFnRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25EcmFnRW50ZXJDYXB0dXJlPyAgOiBEcmFnRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25EcmFnRXhpdD8gICAgICAgICAgOiBEcmFnRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25EcmFnRXhpdENhcHR1cmU/ICAgOiBEcmFnRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25EcmFnTGVhdmU/ICAgICAgICAgOiBEcmFnRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25EcmFnTGVhdmVDYXB0dXJlPyAgOiBEcmFnRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25EcmFnT3Zlcj8gICAgICAgICAgOiBEcmFnRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25EcmFnT3ZlckNhcHR1cmU/ICAgOiBEcmFnRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25EcmFnU3RhcnQ/ICAgICAgICAgOiBEcmFnRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25EcmFnU3RhcnRDYXB0dXJlPyAgOiBEcmFnRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Ecm9wPyAgICAgICAgICAgICAgOiBEcmFnRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Ecm9wQ2FwdHVyZT8gICAgICAgOiBEcmFnRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Nb3VzZURvd24/ICAgICAgICAgOiBNb3VzZUV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uTW91c2VEb3duQ2FwdHVyZT8gIDogTW91c2VFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbk1vdXNlRW50ZXI/ICAgICAgICA6IE1vdXNlRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Nb3VzZUVudGVyQ2FwdHVyZT8gOiBNb3VzZUV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uTW91c2VMZWF2ZT8gICAgICAgIDogTW91c2VFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbk1vdXNlTGVhdmVDYXB0dXJlPyA6IE1vdXNlRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Nb3VzZU1vdmU/ICAgICAgICAgOiBNb3VzZUV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uTW91c2VNb3ZlQ2FwdHVyZT8gIDogTW91c2VFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbk1vdXNlT3V0PyAgICAgICAgICA6IE1vdXNlRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Nb3VzZU91dENhcHR1cmU/ICAgOiBNb3VzZUV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uTW91c2VPdmVyPyAgICAgICAgIDogTW91c2VFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbk1vdXNlT3ZlckNhcHR1cmU/ICA6IE1vdXNlRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Nb3VzZVVwPyAgICAgICAgICAgOiBNb3VzZUV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uTW91c2VVcENhcHR1cmU/ICAgIDogTW91c2VFdmVudEhhbmRsZXJcbiAgICAgICAgICAvLyAjZW5kcmVnaW9uXG5cbiAgICAgICAgICAvLyAjcmVnaW9uIFNlbGVjdGlvbiBFdmVudHNcbiAgICAgICAgICBvblNlbGVjdD86IEdlbmVyaWNFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblNlbGVjdENhcHR1cmU/OiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgLy8gI2VuZHJlZ2lvblxuXG4gICAgICAgICAgLy8gI3JlZ2lvbiBUb3VjaCBFdmVudHNcbiAgICAgICAgICBvblRvdWNoQ2FuY2VsPzogVG91Y2hFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblRvdWNoQ2FuY2VsQ2FwdHVyZT86IFRvdWNoRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Ub3VjaEVuZD86IFRvdWNoRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Ub3VjaEVuZENhcHR1cmU/OiBUb3VjaEV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uVG91Y2hNb3ZlPzogVG91Y2hFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblRvdWNoTW92ZUNhcHR1cmU/OiBUb3VjaEV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uVG91Y2hTdGFydD86IFRvdWNoRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Ub3VjaFN0YXJ0Q2FwdHVyZT86IFRvdWNoRXZlbnRIYW5kbGVyXG4gICAgICAgICAgLy8gI2VuZHJlZ2lvblxuXG4gICAgICAgICAgLy8gI3JlZ2lvbiBQb2ludGVyIEV2ZW50c1xuICAgICAgICAgIG9uUG9pbnRlck92ZXI/ICAgICAgICAgICAgICA6IFBvaW50ZXJFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblBvaW50ZXJPdmVyQ2FwdHVyZT8gICAgICAgOiBQb2ludGVyRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Qb2ludGVyRW50ZXI/ICAgICAgICAgICAgIDogUG9pbnRlckV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uUG9pbnRlckVudGVyQ2FwdHVyZT8gICAgICA6IFBvaW50ZXJFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblBvaW50ZXJEb3duPyAgICAgICAgICAgICAgOiBQb2ludGVyRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Qb2ludGVyRG93bkNhcHR1cmU/ICAgICAgIDogUG9pbnRlckV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uUG9pbnRlck1vdmU/ICAgICAgICAgICAgICA6IFBvaW50ZXJFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblBvaW50ZXJNb3ZlQ2FwdHVyZT8gICAgICAgOiBQb2ludGVyRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Qb2ludGVyVXA/ICAgICAgICAgICAgICAgIDogUG9pbnRlckV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uUG9pbnRlclVwQ2FwdHVyZT8gICAgICAgICA6IFBvaW50ZXJFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblBvaW50ZXJDYW5jZWw/ICAgICAgICAgICAgOiBQb2ludGVyRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Qb2ludGVyQ2FuY2VsQ2FwdHVyZT8gICAgIDogUG9pbnRlckV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uUG9pbnRlck91dD8gICAgICAgICAgICAgICA6IFBvaW50ZXJFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblBvaW50ZXJPdXRDYXB0dXJlPyAgICAgICAgOiBQb2ludGVyRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Qb2ludGVyTGVhdmU/ICAgICAgICAgICAgIDogUG9pbnRlckV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uUG9pbnRlckxlYXZlQ2FwdHVyZT8gICAgICA6IFBvaW50ZXJFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkdvdFBvaW50ZXJDYXB0dXJlPyAgICAgICAgOiBQb2ludGVyRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Hb3RQb2ludGVyQ2FwdHVyZUNhcHR1cmU/IDogUG9pbnRlckV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uTG9zdFBvaW50ZXJDYXB0dXJlPyAgICAgICA6IFBvaW50ZXJFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkxvc3RQb2ludGVyQ2FwdHVyZUNhcHR1cmU/OiBQb2ludGVyRXZlbnRIYW5kbGVyXG4gICAgICAgICAgLy8gI2VuZHJlZ2lvblxuXG4gICAgICAgICAgLy8gI3JlZ2lvbiBVSSBFdmVudHNcbiAgICAgICAgICBvblNjcm9sbD8gICAgICAgOiBVSUV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uU2Nyb2xsQ2FwdHVyZT86IFVJRXZlbnRIYW5kbGVyXG4gICAgICAgICAgLy8gI2VuZHJlZ2lvblxuXG4gICAgICAgICAgLy8gI3JlZ2lvbiBXaGVlbCBFdmVudHNcbiAgICAgICAgICBvbldoZWVsPyAgICAgICA6IFdoZWVsRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25XaGVlbENhcHR1cmU/OiBXaGVlbEV2ZW50SGFuZGxlclxuICAgICAgICAgIC8vICNlbmRyZWdpb25cblxuICAgICAgICAgIC8vICNyZWdpb24gQW5pbWF0aW9uIEV2ZW50c1xuICAgICAgICAgIG9uQW5pbWF0aW9uU3RhcnQ/ICAgICAgICAgICA6IEFuaW1hdGlvbkV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uQW5pbWF0aW9uU3RhcnRDYXB0dXJlPyAgICA6IEFuaW1hdGlvbkV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uQW5pbWF0aW9uRW5kPyAgICAgICAgICAgICA6IEFuaW1hdGlvbkV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uQW5pbWF0aW9uRW5kQ2FwdHVyZT8gICAgICA6IEFuaW1hdGlvbkV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uQW5pbWF0aW9uSXRlcmF0aW9uPyAgICAgICA6IEFuaW1hdGlvbkV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uQW5pbWF0aW9uSXRlcmF0aW9uQ2FwdHVyZT86IEFuaW1hdGlvbkV2ZW50SGFuZGxlclxuICAgICAgICAgIC8vICNlbmRyZWdpb25cblxuICAgICAgICAgIC8vICNyZWdpb24gVHJhbnNpdGlvbiBFdmVudHNcbiAgICAgICAgICBvblRyYW5zaXRpb25FbmQ/ICAgICAgIDogVHJhbnNpdGlvbkV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uVHJhbnNpdGlvbkVuZENhcHR1cmU/OiBUcmFuc2l0aW9uRXZlbnRIYW5kbGVyXG4gICAgICAgICAgLy8gI2VuZHJlZ2lvblxuICAgICB9XG5cbiAgICAgaW50ZXJmYWNlIEhUTUxBdHRyaWJ1dGVzIGV4dGVuZHMgRE9NQXR0cmlidXRlc1xuICAgICB7XG4gICAgICAgICAgLy8gU3RhbmRhcmQgSFRNTCBBdHRyaWJ1dGVzXG4gICAgICAgICAgYWNjZXB0PyAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBhY2NlcHRDaGFyc2V0PyAgICA6IHN0cmluZ1xuICAgICAgICAgIGFjY2Vzc0tleT8gICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgYWN0aW9uPyAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBhbGxvd0Z1bGxTY3JlZW4/ICA6IHN0cmluZyB8IGJvb2xlYW5cbiAgICAgICAgICBhbGxvd1RyYW5zcGFyZW5jeT86IHN0cmluZyB8IGJvb2xlYW5cbiAgICAgICAgICBhbHQ/ICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGFzeW5jPyAgICAgICAgICAgIDogc3RyaW5nIHwgYm9vbGVhblxuICAgICAgICAgIGF1dG9jb21wbGV0ZT8gICAgIDogc3RyaW5nXG4gICAgICAgICAgYXV0b0NvbXBsZXRlPyAgICAgOiBzdHJpbmdcbiAgICAgICAgICBhdXRvY29ycmVjdD8gICAgICA6IHN0cmluZ1xuICAgICAgICAgIGF1dG9Db3JyZWN0PyAgICAgIDogc3RyaW5nXG4gICAgICAgICAgYXV0b2ZvY3VzPyAgICAgICAgOiBzdHJpbmcgfCBib29sZWFuXG4gICAgICAgICAgYXV0b0ZvY3VzPyAgICAgICAgOiBzdHJpbmcgfCBib29sZWFuXG4gICAgICAgICAgYXV0b1BsYXk/ICAgICAgICAgOiBzdHJpbmcgfCBib29sZWFuXG4gICAgICAgICAgY2FwdHVyZT8gICAgICAgICAgOiBzdHJpbmcgfCBib29sZWFuXG4gICAgICAgICAgY2VsbFBhZGRpbmc/ICAgICAgOiBzdHJpbmcgfCBudW1iZXJcbiAgICAgICAgICBjZWxsU3BhY2luZz8gICAgICA6IHN0cmluZyB8IG51bWJlclxuICAgICAgICAgIGNoYXJTZXQ/ICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgY2hhbGxlbmdlPyAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBjaGVja2VkPyAgICAgICAgICA6IHN0cmluZyB8IGJvb2xlYW5cbiAgICAgICAgICBjbGFzcz8gICAgICAgICAgICA6IHN0cmluZyB8IHN0cmluZ1tdXG4gICAgICAgICAgY2xhc3NOYW1lPyAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBjb2xzPyAgICAgICAgICAgICA6IHN0cmluZyB8IG51bWJlclxuICAgICAgICAgIGNvbFNwYW4/ICAgICAgICAgIDogc3RyaW5nIHwgbnVtYmVyXG4gICAgICAgICAgY29udGVudD8gICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBjb250ZW50RWRpdGFibGU/ICA6IHN0cmluZyB8IGJvb2xlYW5cbiAgICAgICAgICBjb250ZXh0TWVudT8gICAgICA6IHN0cmluZ1xuICAgICAgICAgIGNvbnRyb2xzPyAgICAgICAgIDogc3RyaW5nIHwgYm9vbGVhblxuICAgICAgICAgIGNvbnRyb2xzTGlzdD8gICAgIDogc3RyaW5nXG4gICAgICAgICAgY29vcmRzPyAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBjcm9zc09yaWdpbj8gICAgICA6IHN0cmluZ1xuICAgICAgICAgIGRhdGE/ICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgZGF0ZVRpbWU/ICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBkZWZhdWx0PyAgICAgICAgICA6IHN0cmluZyB8IGJvb2xlYW5cbiAgICAgICAgICBkZWZlcj8gICAgICAgICAgICA6IHN0cmluZyB8IGJvb2xlYW5cbiAgICAgICAgICBkaXI/ICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGRpc2FibGVkPyAgICAgICAgIDogc3RyaW5nIHwgYm9vbGVhblxuICAgICAgICAgIGRvd25sb2FkPyAgICAgICAgIDogYW55XG4gICAgICAgICAgZHJhZ2dhYmxlPyAgICAgICAgOiBzdHJpbmcgfCBib29sZWFuXG4gICAgICAgICAgZW5jVHlwZT8gICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBmb3JtPyAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGZvcm1BY3Rpb24/ICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgZm9ybUVuY1R5cGU/ICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBmb3JtTWV0aG9kPyAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGZvcm1Ob1ZhbGlkYXRlPyAgIDogc3RyaW5nIHwgYm9vbGVhblxuICAgICAgICAgIGZvcm1UYXJnZXQ/ICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgZnJhbWVCb3JkZXI/ICAgICAgOiBzdHJpbmcgfCBudW1iZXJcbiAgICAgICAgICBoZWFkZXJzPyAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGhlaWdodD8gICAgICAgICAgIDogc3RyaW5nIHwgbnVtYmVyXG4gICAgICAgICAgaGlkZGVuPyAgICAgICAgICAgOiBzdHJpbmcgfCBib29sZWFuXG4gICAgICAgICAgaGlnaD8gICAgICAgICAgICAgOiBzdHJpbmcgfCBudW1iZXJcbiAgICAgICAgICBocmVmPyAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGhyZWZMYW5nPyAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgZm9yPyAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBodG1sRm9yPyAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGh0dHBFcXVpdj8gICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgaWNvbj8gICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBpZD8gICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGlucHV0TW9kZT8gICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgaW50ZWdyaXR5PyAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBpcz8gICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGtleVBhcmFtcz8gICAgICAgIDogc3RyaW5nXG4gICAgICAgICAga2V5VHlwZT8gICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBraW5kPyAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGxhYmVsPyAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgbGFuZz8gICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBsaXN0PyAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGxvb3A/ICAgICAgICAgICAgIDogc3RyaW5nIHwgYm9vbGVhblxuICAgICAgICAgIGxvdz8gICAgICAgICAgICAgIDogc3RyaW5nIHwgbnVtYmVyXG4gICAgICAgICAgbWFuaWZlc3Q/ICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBtYXJnaW5IZWlnaHQ/ICAgICA6IHN0cmluZyB8IG51bWJlclxuICAgICAgICAgIG1hcmdpbldpZHRoPyAgICAgIDogc3RyaW5nIHwgbnVtYmVyXG4gICAgICAgICAgbWF4PyAgICAgICAgICAgICAgOiBzdHJpbmcgfCBudW1iZXJcbiAgICAgICAgICBtYXhMZW5ndGg/ICAgICAgICA6IHN0cmluZyB8IG51bWJlclxuICAgICAgICAgIG1lZGlhPyAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgbWVkaWFHcm91cD8gICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBtZXRob2Q/ICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIG1pbj8gICAgICAgICAgICAgIDogc3RyaW5nIHwgbnVtYmVyXG4gICAgICAgICAgbWluTGVuZ3RoPyAgICAgICAgOiBzdHJpbmcgfCBudW1iZXJcbiAgICAgICAgICBtdWx0aXBsZT8gICAgICAgICA6IHN0cmluZyB8IGJvb2xlYW5cbiAgICAgICAgICBtdXRlZD8gICAgICAgICAgICA6IHN0cmluZyB8IGJvb2xlYW5cbiAgICAgICAgICBuYW1lPyAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIG5vVmFsaWRhdGU/ICAgICAgIDogc3RyaW5nIHwgYm9vbGVhblxuICAgICAgICAgIG9wZW4/ICAgICAgICAgICAgIDogc3RyaW5nIHwgYm9vbGVhblxuICAgICAgICAgIG9wdGltdW0/ICAgICAgICAgIDogc3RyaW5nIHwgbnVtYmVyXG4gICAgICAgICAgcGF0dGVybj8gICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBwbGFjZWhvbGRlcj8gICAgICA6IHN0cmluZ1xuICAgICAgICAgIHBsYXlzSW5saW5lPyAgICAgIDogc3RyaW5nIHwgYm9vbGVhblxuICAgICAgICAgIHBvc3Rlcj8gICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgcHJlbG9hZD8gICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICByYWRpb0dyb3VwPyAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHJlYWRPbmx5PyAgICAgICAgIDogc3RyaW5nIHwgYm9vbGVhblxuICAgICAgICAgIHJlbD8gICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgcmVxdWlyZWQ/ICAgICAgICAgOiBzdHJpbmcgfCBib29sZWFuXG4gICAgICAgICAgcm9sZT8gICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICByb3dzPyAgICAgICAgICAgICA6IHN0cmluZyB8IG51bWJlclxuICAgICAgICAgIHJvd1NwYW4/ICAgICAgICAgIDogc3RyaW5nIHwgbnVtYmVyXG4gICAgICAgICAgc2FuZGJveD8gICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBzY29wZT8gICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHNjb3BlZD8gICAgICAgICAgIDogc3RyaW5nIHwgYm9vbGVhblxuICAgICAgICAgIHNjcm9sbGluZz8gICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgc2VhbWxlc3M/ICAgICAgICAgOiBzdHJpbmcgfCBib29sZWFuXG4gICAgICAgICAgc2VsZWN0ZWQ/ICAgICAgICAgOiBzdHJpbmcgfCBib29sZWFuXG4gICAgICAgICAgc2hhcGU/ICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBzaXplPyAgICAgICAgICAgICA6IHN0cmluZyB8IG51bWJlclxuICAgICAgICAgIHNpemVzPyAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgc2xvdD8gICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBzcGFuPyAgICAgICAgICAgICA6IHN0cmluZyB8IG51bWJlclxuICAgICAgICAgIHNwZWxsY2hlY2s/ICAgICAgIDogc3RyaW5nIHwgYm9vbGVhblxuICAgICAgICAgIHNyYz8gICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgc3Jjc2V0PyAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBzcmNEb2M/ICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHNyY0xhbmc/ICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgc3JjU2V0PyAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBzdGFydD8gICAgICAgICAgICA6IHN0cmluZyB8IG51bWJlclxuICAgICAgICAgIHN0ZXA/ICAgICAgICAgICAgIDogc3RyaW5nIHwgbnVtYmVyXG4gICAgICAgICAgc3R5bGU/ICAgICAgICAgICAgOiBzdHJpbmcgfCB7IFsga2V5OiBzdHJpbmcgXTogc3RyaW5nIHwgbnVtYmVyIH1cbiAgICAgICAgICBzdW1tYXJ5PyAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHRhYkluZGV4PyAgICAgICAgIDogc3RyaW5nIHwgbnVtYmVyXG4gICAgICAgICAgdGFyZ2V0PyAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICB0aXRsZT8gICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHR5cGU/ICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgdXNlTWFwPyAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICB2YWx1ZT8gICAgICAgICAgICA6IHN0cmluZyB8IHN0cmluZ1tdIHwgbnVtYmVyXG4gICAgICAgICAgd2lkdGg/ICAgICAgICAgICAgOiBzdHJpbmcgfCBudW1iZXJcbiAgICAgICAgICB3bW9kZT8gICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHdyYXA/ICAgICAgICAgICAgIDogc3RyaW5nXG5cbiAgICAgICAgICAvLyBSREZhIEF0dHJpYnV0ZXNcbiAgICAgICAgICBhYm91dD86IHN0cmluZ1xuICAgICAgICAgIGRhdGF0eXBlPzogc3RyaW5nXG4gICAgICAgICAgaW5saXN0PzogYW55XG4gICAgICAgICAgcHJlZml4Pzogc3RyaW5nXG4gICAgICAgICAgcHJvcGVydHk/OiBzdHJpbmdcbiAgICAgICAgICByZXNvdXJjZT86IHN0cmluZ1xuICAgICAgICAgIHR5cGVvZj86IHN0cmluZ1xuICAgICAgICAgIHZvY2FiPzogc3RyaW5nXG5cbiAgICAgICAgICAvLyBNaWNyb2RhdGEgQXR0cmlidXRlc1xuICAgICAgICAgIGl0ZW1Qcm9wPzogc3RyaW5nXG4gICAgICAgICAgaXRlbVNjb3BlPzogYm9vbGVhblxuICAgICAgICAgIGl0ZW1UeXBlPzogc3RyaW5nXG4gICAgICAgICAgaXRlbUlEPzogc3RyaW5nXG4gICAgICAgICAgaXRlbVJlZj86IHN0cmluZ1xuICAgICB9XG5cbiAgICAgaW50ZXJmYWNlIFNWR0F0dHJpYnV0ZXMgZXh0ZW5kcyBIVE1MQXR0cmlidXRlc1xuICAgICB7XG4gICAgICAgICAgYWNjZW50SGVpZ2h0PyAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBhY2N1bXVsYXRlPyAgICAgICAgICAgICAgICA6IFwibm9uZVwiIHwgXCJzdW1cIlxuICAgICAgICAgIGFkZGl0aXZlPyAgICAgICAgICAgICAgICAgIDogXCJyZXBsYWNlXCIgfCBcInN1bVwiXG4gICAgICAgICAgYWxpZ25tZW50QmFzZWxpbmU/ICAgICAgICAgOiBcImF1dG9cIiB8IFwiYmFzZWxpbmVcIiB8IFwiYmVmb3JlLWVkZ2VcIiB8IFwidGV4dC1iZWZvcmUtZWRnZVwiIHwgXCJtaWRkbGVcIiB8IFwiY2VudHJhbFwiIHwgXCJhZnRlci1lZGdlXCIgfCBcInRleHQtYWZ0ZXItZWRnZVwiIHwgXCJpZGVvZ3JhcGhpY1wiIHwgXCJhbHBoYWJldGljXCIgfCBcImhhbmdpbmdcIiB8IFwibWF0aGVtYXRpY2FsXCIgfCBcImluaGVyaXRcIlxuICAgICAgICAgIGFsbG93UmVvcmRlcj8gICAgICAgICAgICAgIDogXCJub1wiIHwgXCJ5ZXNcIlxuICAgICAgICAgIGFscGhhYmV0aWM/ICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgYW1wbGl0dWRlPyAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBhcmFiaWNGb3JtPyAgICAgICAgICAgICAgICA6IFwiaW5pdGlhbFwiIHwgXCJtZWRpYWxcIiB8IFwidGVybWluYWxcIiB8IFwiaXNvbGF0ZWRcIlxuICAgICAgICAgIGFzY2VudD8gICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgYXR0cmlidXRlTmFtZT8gICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBhdHRyaWJ1dGVUeXBlPyAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGF1dG9SZXZlcnNlPyAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgYXppbXV0aD8gICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBiYXNlRnJlcXVlbmN5PyAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGJhc2VsaW5lU2hpZnQ/ICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgYmFzZVByb2ZpbGU/ICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBiYm94PyAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGJlZ2luPyAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgYmlhcz8gICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBieT8gICAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGNhbGNNb2RlPyAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgY2FwSGVpZ2h0PyAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBjbGlwPyAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGNsaXBQYXRoPyAgICAgICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgY2xpcFBhdGhVbml0cz8gICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBjbGlwUnVsZT8gICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGNvbG9ySW50ZXJwb2xhdGlvbj8gICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgY29sb3JJbnRlcnBvbGF0aW9uRmlsdGVycz8gOiBcImF1dG9cIiB8IFwic1JHQlwiIHwgXCJsaW5lYXJSR0JcIiB8IFwiaW5oZXJpdFwiXG4gICAgICAgICAgY29sb3JQcm9maWxlPyAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBjb2xvclJlbmRlcmluZz8gICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGNvbnRlbnRTY3JpcHRUeXBlPyAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgY29udGVudFN0eWxlVHlwZT8gICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBjdXJzb3I/ICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGN4PyAgICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgY3k/ICAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBkPyAgICAgICAgICAgICAgICAgICAgICAgICA6IHN0cmluZyB8IChudW1iZXIgfCBzdHJpbmcpIFtdXG4gICAgICAgICAgZGVjZWxlcmF0ZT8gICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBkZXNjZW50PyAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGRpZmZ1c2VDb25zdGFudD8gICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZGlyZWN0aW9uPyAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBkaXNwbGF5PyAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGRpdmlzb3I/ICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZG9taW5hbnRCYXNlbGluZT8gICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBkdXI/ICAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGR4PyAgICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZHk/ICAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBlZGdlTW9kZT8gICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGVsZXZhdGlvbj8gICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZW5hYmxlQmFja2dyb3VuZD8gICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBlbmQ/ICAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGV4cG9uZW50PyAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZXh0ZXJuYWxSZXNvdXJjZXNSZXF1aXJlZD8gOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBmaWxsPyAgICAgICAgICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGZpbGxPcGFjaXR5PyAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZmlsbFJ1bGU/ICAgICAgICAgICAgICAgICAgOiBcIm5vbnplcm9cIiB8IFwiZXZlbm9kZFwiIHwgXCJpbmhlcml0XCJcbiAgICAgICAgICBmaWx0ZXI/ICAgICAgICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGZpbHRlclJlcz8gICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZmlsdGVyVW5pdHM/ICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBmbG9vZENvbG9yPyAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGZsb29kT3BhY2l0eT8gICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZm9jdXNhYmxlPyAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBmb250RmFtaWx5PyAgICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGZvbnRTaXplPyAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZm9udFNpemVBZGp1c3Q/ICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBmb250U3RyZXRjaD8gICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGZvbnRTdHlsZT8gICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZm9udFZhcmlhbnQ/ICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBmb250V2VpZ2h0PyAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGZvcm1hdD8gICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZnJvbT8gICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBmeD8gICAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGZ5PyAgICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZzE/ICAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBnMj8gICAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGdseXBoTmFtZT8gICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZ2x5cGhPcmllbnRhdGlvbkhvcml6b250YWw/OiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBnbHlwaE9yaWVudGF0aW9uVmVydGljYWw/ICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGdseXBoUmVmPyAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZ3JhZGllbnRUcmFuc2Zvcm0/ICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBncmFkaWVudFVuaXRzPyAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGhhbmdpbmc/ICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgaG9yaXpBZHZYPyAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBob3Jpek9yaWdpblg/ICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGlkZW9ncmFwaGljPyAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgaW1hZ2VSZW5kZXJpbmc/ICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBpbjI/ICAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGluPyAgICAgICAgICAgICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgaW50ZXJjZXB0PyAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBrMT8gICAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGsyPyAgICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgazM/ICAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBrND8gICAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGs/ICAgICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAga2VybmVsTWF0cml4PyAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBrZXJuZWxVbml0TGVuZ3RoPyAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGtlcm5pbmc/ICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAga2V5UG9pbnRzPyAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBrZXlTcGxpbmVzPyAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGtleVRpbWVzPyAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgbGVuZ3RoQWRqdXN0PyAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBsZXR0ZXJTcGFjaW5nPyAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGxpZ2h0aW5nQ29sb3I/ICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgbGltaXRpbmdDb25lQW5nbGU/ICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBsb2NhbD8gICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIG1hcmtlckVuZD8gICAgICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgbWFya2VySGVpZ2h0PyAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBtYXJrZXJNaWQ/ICAgICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIG1hcmtlclN0YXJ0PyAgICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgbWFya2VyVW5pdHM/ICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBtYXJrZXJXaWR0aD8gICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIG1hc2s/ICAgICAgICAgICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgbWFza0NvbnRlbnRVbml0cz8gICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBtYXNrVW5pdHM/ICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIG1hdGhlbWF0aWNhbD8gICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgbW9kZT8gICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBudW1PY3RhdmVzPyAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIG9mZnNldD8gICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgb3BhY2l0eT8gICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBvcGVyYXRvcj8gICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIG9yZGVyPyAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgb3JpZW50PyAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBvcmllbnRhdGlvbj8gICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIG9yaWdpbj8gICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgb3ZlcmZsb3c/ICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBvdmVybGluZVBvc2l0aW9uPyAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIG92ZXJsaW5lVGhpY2tuZXNzPyAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgcGFpbnRPcmRlcj8gICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBwYW5vc2UxPyAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHBhdGhMZW5ndGg/ICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgcGF0dGVybkNvbnRlbnRVbml0cz8gICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBwYXR0ZXJuVHJhbnNmb3JtPyAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHBhdHRlcm5Vbml0cz8gICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgcG9pbnRlckV2ZW50cz8gICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBwb2ludHM/ICAgICAgICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHBvaW50c0F0WD8gICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgcG9pbnRzQXRZPyAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBwb2ludHNBdFo/ICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHByZXNlcnZlQWxwaGE/ICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgcHJlc2VydmVBc3BlY3RSYXRpbz8gICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBwcmltaXRpdmVVbml0cz8gICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHI/ICAgICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgcmFkaXVzPyAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICByZWZYPyAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHJlZlk/ICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgcmVuZGVyaW5nSW50ZW50PyAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICByZXBlYXRDb3VudD8gICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHJlcGVhdER1cj8gICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgcmVxdWlyZWRFeHRlbnNpb25zPyAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICByZXF1aXJlZEZlYXR1cmVzPyAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHJlc3RhcnQ/ICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgcmVzdWx0PyAgICAgICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICByb3RhdGU/ICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHJ4PyAgICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgcnk/ICAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBzY2FsZT8gICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHNlZWQ/ICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgc2hhcGVSZW5kZXJpbmc/ICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBzbG9wZT8gICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHNwYWNpbmc/ICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgc3BlY3VsYXJDb25zdGFudD8gICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBzcGVjdWxhckV4cG9uZW50PyAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHNwZWVkPyAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgc3ByZWFkTWV0aG9kPyAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBzdGFydE9mZnNldD8gICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHN0ZERldmlhdGlvbj8gICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgc3RlbWg/ICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBzdGVtdj8gICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHN0aXRjaFRpbGVzPyAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgc3RvcENvbG9yPyAgICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBzdG9wT3BhY2l0eT8gICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHN0cmlrZXRocm91Z2hQb3NpdGlvbj8gICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgc3RyaWtldGhyb3VnaFRoaWNrbmVzcz8gICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBzdHJpbmc/ICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHN0cm9rZT8gICAgICAgICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgc3Ryb2tlRGFzaGFycmF5PyAgICAgICAgICAgOiBzdHJpbmcgfCBudW1iZXJcbiAgICAgICAgICBzdHJva2VEYXNob2Zmc2V0PyAgICAgICAgICA6IHN0cmluZyB8IG51bWJlclxuICAgICAgICAgIHN0cm9rZUxpbmVjYXA/ICAgICAgICAgICAgIDogXCJidXR0XCIgfCBcInJvdW5kXCIgfCBcInNxdWFyZVwiIHwgXCJpbmhlcml0XCJcbiAgICAgICAgICBzdHJva2VMaW5lam9pbj8gICAgICAgICAgICA6IFwibWl0ZXJcIiB8IFwicm91bmRcIiB8IFwiYmV2ZWxcIiB8IFwiaW5oZXJpdFwiXG4gICAgICAgICAgc3Ryb2tlTWl0ZXJsaW1pdD8gICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBzdHJva2VPcGFjaXR5PyAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHN0cm9rZVdpZHRoPyAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgc3VyZmFjZVNjYWxlPyAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBzeXN0ZW1MYW5ndWFnZT8gICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHRhYmxlVmFsdWVzPyAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgdGFyZ2V0WD8gICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB0YXJnZXRZPyAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHRleHRBbmNob3I/ICAgICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgdGV4dERlY29yYXRpb24/ICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB0ZXh0TGVuZ3RoPyAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHRleHRSZW5kZXJpbmc/ICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgdG8/ICAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB0cmFuc2Zvcm0/ICAgICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHUxPyAgICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgdTI/ICAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB1bmRlcmxpbmVQb3NpdGlvbj8gICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHVuZGVybGluZVRoaWNrbmVzcz8gICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgdW5pY29kZT8gICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB1bmljb2RlQmlkaT8gICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHVuaWNvZGVSYW5nZT8gICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgdW5pdHNQZXJFbT8gICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB2QWxwaGFiZXRpYz8gICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHZhbHVlcz8gICAgICAgICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgdmVjdG9yRWZmZWN0PyAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB2ZXJzaW9uPyAgICAgICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHZlcnRBZHZZPyAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgdmVydE9yaWdpblg/ICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB2ZXJ0T3JpZ2luWT8gICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHZIYW5naW5nPyAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgdklkZW9ncmFwaGljPyAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB2aWV3Qm94PyAgICAgICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHZpZXdUYXJnZXQ/ICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgdmlzaWJpbGl0eT8gICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB2TWF0aGVtYXRpY2FsPyAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHdpZHRocz8gICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgd29yZFNwYWNpbmc/ICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB3cml0aW5nTW9kZT8gICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHgxPyAgICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgeDI/ICAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB4PyAgICAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHhDaGFubmVsU2VsZWN0b3I/ICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgeEhlaWdodD8gICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB4bGlua0FjdHVhdGU/ICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHhsaW5rQXJjcm9sZT8gICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgeGxpbmtIcmVmPyAgICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICB4bGlua1JvbGU/ICAgICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHhsaW5rU2hvdz8gICAgICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgeGxpbmtUaXRsZT8gICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICB4bGlua1R5cGU/ICAgICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHhtbEJhc2U/ICAgICAgICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgeG1sTGFuZz8gICAgICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICB4bWxucz8gICAgICAgICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHhtbG5zWGxpbms/ICAgICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgeG1sU3BhY2U/ICAgICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICB5MT8gICAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHkyPyAgICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgeT8gICAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB5Q2hhbm5lbFNlbGVjdG9yPyAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHo/ICAgICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgem9vbUFuZFBhbj8gICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgfVxufVxuIiwiXG5leHBvcnQgaW50ZXJmYWNlICBEcmFnZ2FibGVPcHRpb25zXG57XG4gICAgIGhhbmRsZXMgICAgICAgIDogSlNYLkVsZW1lbnQgW11cbiAgICAgbWluVmVsb2NpdHk/ICAgOiBudW1iZXJcbiAgICAgbWF4VmVsb2NpdHk/ICAgOiBudW1iZXJcbiAgICAgdmVsb2NpdHlGYWN0b3I/OiBudW1iZXJcbiAgICAgb25EcmFnPyAgICAgICAgOiAoIGV2ZW50OiBEcmFnRXZlbnQgKSA9PiB2b2lkXG4gICAgIG9uU3RhcnREcmFnPyAgIDogKCkgPT4gdm9pZFxuICAgICBvblN0b3BEcmFnPyAgICA6ICggZXZlbnQ6IERyYWdFdmVudCApID0+IGJvb2xlYW5cbiAgICAgb25FbmRBbmltYXRpb24/OiAoICBldmVudDogRHJhZ0V2ZW50ICApID0+IHZvaWRcbn1cblxuZXhwb3J0IHR5cGUgRHJhZ2dhYmxlQ29uZmlnID0gUmVxdWlyZWQgPERyYWdnYWJsZU9wdGlvbnM+XG5cbmV4cG9ydCBpbnRlcmZhY2UgRHJhZ0V2ZW50XG57XG4gICAgIHggICAgICAgIDogbnVtYmVyXG4gICAgIHkgICAgICAgIDogbnVtYmVyXG4gICAgIG9mZnNldFggIDogbnVtYmVyXG4gICAgIG9mZnNldFkgIDogbnVtYmVyXG4gICAgIHRhcmdldFg6IG51bWJlclxuICAgICB0YXJnZXRZOiBudW1iZXJcbiAgICAgZGVsYXkgICAgOiBudW1iZXJcbn1cblxuZnVuY3Rpb24gZGVmYXVsdENvbmZpZyAoKTogRHJhZ2dhYmxlQ29uZmlnXG57XG4gICAgIHJldHVybiB7XG4gICAgICAgICAgaGFuZGxlcyAgICAgICA6IFtdLFxuICAgICAgICAgIG1pblZlbG9jaXR5ICAgOiAwLFxuICAgICAgICAgIG1heFZlbG9jaXR5ICAgOiAxLFxuICAgICAgICAgIG9uU3RhcnREcmFnICAgOiAoKSA9PiB7fSxcbiAgICAgICAgICBvbkRyYWcgICAgICAgIDogKCkgPT4ge30sXG4gICAgICAgICAgb25TdG9wRHJhZyAgICA6ICgpID0+IHRydWUsXG4gICAgICAgICAgb25FbmRBbmltYXRpb246ICgpID0+IHt9LFxuICAgICAgICAgIHZlbG9jaXR5RmFjdG9yOiAod2luZG93LmlubmVySGVpZ2h0IDwgd2luZG93LmlubmVyV2lkdGhcbiAgICAgICAgICAgICAgICAgICAgICAgICA/IHdpbmRvdy5pbm5lckhlaWdodCA6IHdpbmRvdy5pbm5lcldpZHRoKSAvIDIsXG4gICAgIH1cbn1cblxudmFyIGlzX2RyYWcgICAgPSBmYWxzZVxudmFyIHBvaW50ZXI6IE1vdXNlRXZlbnQgfCBUb3VjaFxuXG4vLyBodHRwczovL2dpc3QuZ2l0aHViLmNvbS9ncmUvMTY1MDI5NFxudmFyIEVhc2luZ0Z1bmN0aW9ucyA9IHtcbiAgICAgbGluZWFyICAgICAgICA6ICggdDogbnVtYmVyICkgPT4gdCxcbiAgICAgZWFzZUluUXVhZCAgICA6ICggdDogbnVtYmVyICkgPT4gdCp0LFxuICAgICBlYXNlT3V0UXVhZCAgIDogKCB0OiBudW1iZXIgKSA9PiB0KigyLXQpLFxuICAgICBlYXNlSW5PdXRRdWFkIDogKCB0OiBudW1iZXIgKSA9PiB0PC41ID8gMip0KnQgOiAtMSsoNC0yKnQpKnQsXG4gICAgIGVhc2VJbkN1YmljICAgOiAoIHQ6IG51bWJlciApID0+IHQqdCp0LFxuICAgICBlYXNlT3V0Q3ViaWMgIDogKCB0OiBudW1iZXIgKSA9PiAoLS10KSp0KnQrMSxcbiAgICAgZWFzZUluT3V0Q3ViaWM6ICggdDogbnVtYmVyICkgPT4gdDwuNSA/IDQqdCp0KnQgOiAodC0xKSooMip0LTIpKigyKnQtMikrMSxcbiAgICAgZWFzZUluUXVhcnQgICA6ICggdDogbnVtYmVyICkgPT4gdCp0KnQqdCxcbiAgICAgZWFzZU91dFF1YXJ0ICA6ICggdDogbnVtYmVyICkgPT4gMS0oLS10KSp0KnQqdCxcbiAgICAgZWFzZUluT3V0UXVhcnQ6ICggdDogbnVtYmVyICkgPT4gdDwuNSA/IDgqdCp0KnQqdCA6IDEtOCooLS10KSp0KnQqdCxcbiAgICAgZWFzZUluUXVpbnQgICA6ICggdDogbnVtYmVyICkgPT4gdCp0KnQqdCp0LFxuICAgICBlYXNlT3V0UXVpbnQgIDogKCB0OiBudW1iZXIgKSA9PiAxKygtLXQpKnQqdCp0KnQsXG4gICAgIGVhc2VJbk91dFF1aW50OiAoIHQ6IG51bWJlciApID0+IHQ8LjUgPyAxNip0KnQqdCp0KnQgOiAxKzE2KigtLXQpKnQqdCp0KnRcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGRyYWdnYWJsZSAoIG9wdGlvbnM6IERyYWdnYWJsZU9wdGlvbnMgKVxue1xuICAgICBjb25zdCBjb25maWcgICAgID0gZGVmYXVsdENvbmZpZyAoKVxuXG4gICAgIHZhciBpc19hY3RpdmUgID0gZmFsc2VcbiAgICAgdmFyIGlzX2FuaW1hdGUgPSBmYWxzZVxuICAgICB2YXIgY3VycmVudF9ldmVudDogRHJhZ0V2ZW50XG5cbiAgICAgdmFyIHN0YXJ0X3RpbWUgPSAwXG4gICAgIHZhciBzdGFydF94ICAgID0gMFxuICAgICB2YXIgc3RhcnRfeSAgICA9IDBcblxuICAgICB2YXIgdmVsb2NpdHlfZGVsYXkgPSA1MDBcbiAgICAgdmFyIHZlbG9jaXR5X3g6IG51bWJlclxuICAgICB2YXIgdmVsb2NpdHlfeTogbnVtYmVyXG5cbiAgICAgdmFyIGN1cnJlbnRfYW5pbWF0aW9uID0gLTFcblxuICAgICB1cGRhdGVDb25maWcgKCBvcHRpb25zIClcblxuICAgICBmdW5jdGlvbiB1cGRhdGVDb25maWcgKCBvcHRpb25zOiBEcmFnZ2FibGVPcHRpb25zIClcbiAgICAge1xuICAgICAgICAgIGlmICggaXNfZHJhZyApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKCBuYXZpZ2F0b3IubWF4VG91Y2hQb2ludHMgPiAwIClcbiAgICAgICAgICAgICAgIGRvY3VtZW50LmJvZHkuc3R5bGUudG91Y2hBY3Rpb24gPSBcIm5vbmVcIlxuXG4gICAgICAgICAgZGlzYWJsZUV2ZW50cyAoKVxuXG4gICAgICAgICAgT2JqZWN0LmFzc2lnbiAoIGNvbmZpZywgb3B0aW9ucyApXG5cbiAgICAgICAgICBlbmFibGVFdmVudHMgKClcbiAgICAgfVxuXG4gICAgIGZ1bmN0aW9uIGFkZEhhbmRsZXMgKCAuLi4gaGFuZGxlczogSlNYLkVsZW1lbnQgW10gKVxuICAgICB7XG4gICAgICAgICAgZm9yICggY29uc3QgaCBvZiBoYW5kbGVzIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBpZiAoICEgY29uZmlnLmhhbmRsZXMuaW5jbHVkZXMgKGgpIClcbiAgICAgICAgICAgICAgICAgICAgY29uZmlnLmhhbmRsZXMucHVzaCAoaClcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoIGlzX2FjdGl2ZSApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgZGVzYWN0aXZhdGUgKClcbiAgICAgICAgICAgICAgIGFjdGl2YXRlICgpXG4gICAgICAgICAgfVxuICAgICB9XG5cbiAgICAgZnVuY3Rpb24gYWN0aXZhdGUgKClcbiAgICAge1xuICAgICAgICAgIGVuYWJsZUV2ZW50cyAoKVxuICAgICAgICAgIGlzX2FjdGl2ZSA9IHRydWVcbiAgICAgfVxuXG4gICAgIGZ1bmN0aW9uIGRlc2FjdGl2YXRlICgpXG4gICAgIHtcbiAgICAgICAgICBkaXNhYmxlRXZlbnRzICgpXG4gICAgICAgICAgaXNfYWN0aXZlID0gZmFsc2VcbiAgICAgfVxuXG4gICAgIHJldHVybiB7XG4gICAgICAgICAgdXBkYXRlQ29uZmlnLFxuICAgICAgICAgIGFkZEhhbmRsZXMsXG4gICAgICAgICAgaXNBY3RpdmU6ICgpID0+IGlzX2FjdGl2ZSxcbiAgICAgICAgICBhY3RpdmF0ZSxcbiAgICAgICAgICBkZXNhY3RpdmF0ZSxcbiAgICAgfVxuXG4gICAgIGZ1bmN0aW9uIGVuYWJsZUV2ZW50cyAoKVxuICAgICB7XG4gICAgICAgICAgZm9yICggY29uc3QgaCBvZiBjb25maWcuaGFuZGxlcyApXG4gICAgICAgICAgICAgICBoLmFkZEV2ZW50TGlzdGVuZXIgKCBcInBvaW50ZXJkb3duXCIsIG9uU3RhcnQsIHsgcGFzc2l2ZTogdHJ1ZSB9IClcbiAgICAgfVxuICAgICBmdW5jdGlvbiBkaXNhYmxlRXZlbnRzICgpXG4gICAgIHtcbiAgICAgICAgICBmb3IgKCBjb25zdCBoIG9mIGNvbmZpZy5oYW5kbGVzIClcbiAgICAgICAgICAgICAgIGgucmVtb3ZlRXZlbnRMaXN0ZW5lciAoIFwicG9pbnRlcmRvd25cIiAsIG9uU3RhcnQgKVxuICAgICB9XG5cbiAgICAgZnVuY3Rpb24gb25TdGFydCAoIGV2ZW50OiBNb3VzZUV2ZW50IHwgVG91Y2hFdmVudCApXG4gICAgIHtcbiAgICAgICAgICBpZiAoIGlzX2RyYWcgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNvbnNvbGUud2FybiAoIFwiVGVudGF0aXZlIGRlIGTDqW1hcnJhZ2UgZGVzIMOpdsOpbmVtZW50cyBcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKyBcIlxcXCJkcmFnZ2FibGUgXFxcIiBkw6lqw6AgZW4gY291cnMuXCIgKVxuICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKCBpc19hbmltYXRlIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBzdG9wVmVsb2NpdHlGcmFtZSAoKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHBvaW50ZXIgPSAoZXZlbnQgYXMgVG91Y2hFdmVudCkudG91Y2hlc1xuICAgICAgICAgICAgICAgICAgICA/IChldmVudCBhcyBUb3VjaEV2ZW50KS50b3VjaGVzIFswXVxuICAgICAgICAgICAgICAgICAgICA6IChldmVudCBhcyBNb3VzZUV2ZW50KVxuXG4gICAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIgKFwicG9pbnRlcm1vdmVcIiwgb25Nb3ZlKVxuICAgICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyIChcInBvaW50ZXJ1cFwiICAsIG9uRW5kKVxuICAgICAgICAgIGRpc2FibGVFdmVudHMgKClcblxuICAgICAgICAgIGN1cnJlbnRfYW5pbWF0aW9uID0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSAoIG9uQW5pbWF0aW9uU3RhcnQgKVxuXG4gICAgICAgICAgaXNfZHJhZyA9IHRydWVcbiAgICAgfVxuICAgICBmdW5jdGlvbiBvbk1vdmUgKCBldmVudDogTW91c2VFdmVudCB8IFRvdWNoRXZlbnQgKVxuICAgICB7XG4gICAgICAgICAgaWYgKCBpc19kcmFnID09IGZhbHNlIClcbiAgICAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgICAgcG9pbnRlciA9IChldmVudCBhcyBUb3VjaEV2ZW50KS50b3VjaGVzICE9PSB1bmRlZmluZWRcbiAgICAgICAgICAgICAgICAgICAgPyAoZXZlbnQgYXMgVG91Y2hFdmVudCkudG91Y2hlcyBbMF1cbiAgICAgICAgICAgICAgICAgICAgOiAoZXZlbnQgYXMgTW91c2VFdmVudClcbiAgICAgfVxuICAgICBmdW5jdGlvbiBvbkVuZCAoIGV2ZW50OiBNb3VzZUV2ZW50IHwgVG91Y2hFdmVudCApXG4gICAgIHtcbiAgICAgICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lciAoXCJwb2ludGVybW92ZVwiLCBvbk1vdmUpXG4gICAgICAgICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIgKFwicG9pbnRlcnVwXCIgICwgb25FbmQpXG4gICAgICAgICAgZW5hYmxlRXZlbnRzICgpXG5cbiAgICAgICAgICBpc19kcmFnID0gZmFsc2VcbiAgICAgfVxuXG4gICAgIGZ1bmN0aW9uIG9uQW5pbWF0aW9uU3RhcnQgKCBub3c6IG51bWJlciApXG4gICAgIHtcbiAgICAgICAgICBzdGFydF94ICAgID0gcG9pbnRlci5jbGllbnRYXG4gICAgICAgICAgc3RhcnRfeSAgICA9IHBvaW50ZXIuY2xpZW50WVxuICAgICAgICAgIHN0YXJ0X3RpbWUgPSBub3dcblxuICAgICAgICAgIGN1cnJlbnRfZXZlbnQgPSB7XG4gICAgICAgICAgICAgICBkZWxheSAgICA6IDAsXG4gICAgICAgICAgICAgICB4ICAgICAgICA6IDAsXG4gICAgICAgICAgICAgICB5ICAgICAgICA6IDAsXG4gICAgICAgICAgICAgICBvZmZzZXRYICA6IDAsXG4gICAgICAgICAgICAgICBvZmZzZXRZICA6IDAsXG4gICAgICAgICAgICAgICB0YXJnZXRYOiAwLFxuICAgICAgICAgICAgICAgdGFyZ2V0WTogMCxcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjb25maWcub25TdGFydERyYWcgKClcblxuICAgICAgICAgIGN1cnJlbnRfYW5pbWF0aW9uID0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSAoIG9uQW5pbWF0aW9uRnJhbWUgKVxuICAgICB9XG4gICAgIGZ1bmN0aW9uIG9uQW5pbWF0aW9uRnJhbWUgKCBub3c6IG51bWJlciApXG4gICAgIHtcbiAgICAgICAgICBjb25zdCB7IHZlbG9jaXR5RmFjdG9yIH0gPSBjb25maWdcblxuICAgICAgICAgIGNvbnN0IHggICAgICAgICAgID0gcG9pbnRlci5jbGllbnRYIC0gc3RhcnRfeFxuICAgICAgICAgIGNvbnN0IHkgICAgICAgICAgID0gc3RhcnRfeSAtIHBvaW50ZXIuY2xpZW50WVxuICAgICAgICAgIGNvbnN0IGRlbGF5ICAgICAgID0gbm93IC0gc3RhcnRfdGltZVxuICAgICAgICAgIGNvbnN0IG9mZnNldERlbGF5ID0gZGVsYXkgLSBjdXJyZW50X2V2ZW50LmRlbGF5XG4gICAgICAgICAgY29uc3Qgb2Zmc2V0WCAgICAgPSB4IC0gY3VycmVudF9ldmVudC54XG4gICAgICAgICAgY29uc3Qgb2Zmc2V0WSAgICAgPSB5IC0gY3VycmVudF9ldmVudC55XG5cbiAgICAgICAgICBjdXJyZW50X2V2ZW50ID0ge1xuICAgICAgICAgICAgICAgZGVsYXksXG4gICAgICAgICAgICAgICB4LFxuICAgICAgICAgICAgICAgeSxcbiAgICAgICAgICAgICAgIHRhcmdldFg6IHgsXG4gICAgICAgICAgICAgICB0YXJnZXRZOiB5LFxuICAgICAgICAgICAgICAgb2Zmc2V0WCxcbiAgICAgICAgICAgICAgIG9mZnNldFksXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKCBpc19kcmFnIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBjb25maWcub25EcmFnICggY3VycmVudF9ldmVudCApXG4gICAgICAgICAgICAgICBjdXJyZW50X2FuaW1hdGlvbiA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgKCBvbkFuaW1hdGlvbkZyYW1lIClcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHN0YXJ0X3RpbWUgICAgID0gbm93XG4gICAgICAgICAgICAgICBzdGFydF94ICAgICAgICA9IHhcbiAgICAgICAgICAgICAgIHN0YXJ0X3kgICAgICAgID0geVxuICAgICAgICAgICAgICAgdmVsb2NpdHlfeCAgICAgICA9IHZlbG9jaXR5RmFjdG9yICogbm9ybSAoIG9mZnNldFggLyBvZmZzZXREZWxheSApXG4gICAgICAgICAgICAgICB2ZWxvY2l0eV95ICAgICAgID0gdmVsb2NpdHlGYWN0b3IgKiBub3JtICggb2Zmc2V0WSAvIG9mZnNldERlbGF5IClcblxuICAgICAgICAgICAgICAgY3VycmVudF9ldmVudC50YXJnZXRYICs9IHZlbG9jaXR5X3hcbiAgICAgICAgICAgICAgIGN1cnJlbnRfZXZlbnQudGFyZ2V0WSArPSB2ZWxvY2l0eV95XG5cbiAgICAgICAgICAgICAgIGlmICggY29uZmlnLm9uU3RvcERyYWcgKCBjdXJyZW50X2V2ZW50ICkgPT09IHRydWUgKVxuICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBpc19hbmltYXRlID0gdHJ1ZVxuICAgICAgICAgICAgICAgICAgICBjdXJyZW50X2FuaW1hdGlvbiA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgKCBvblZlbG9jaXR5RnJhbWUgKVxuICAgICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGZ1bmN0aW9uIG5vcm0gKCB2YWx1ZTogbnVtYmVyIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBpZiAodmFsdWUgPCAtMSApXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAtMVxuXG4gICAgICAgICAgICAgICBpZiAoIHZhbHVlID4gMSApXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAxXG5cbiAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZVxuICAgICAgICAgIH1cbiAgICAgfVxuICAgICBmdW5jdGlvbiBvblZlbG9jaXR5RnJhbWUgKCBub3c6IG51bWJlciApXG4gICAgIHtcbiAgICAgICAgICBjb25zdCBkZWxheSA9IG5vdyAtIHN0YXJ0X3RpbWVcblxuICAgICAgICAgIGNvbnN0IHQgPSBkZWxheSA+PSB2ZWxvY2l0eV9kZWxheVxuICAgICAgICAgICAgICAgICAgPyAxXG4gICAgICAgICAgICAgICAgICA6IGRlbGF5IC8gdmVsb2NpdHlfZGVsYXlcblxuICAgICAgICAgIGNvbnN0IGZhY3RvciAgPSBFYXNpbmdGdW5jdGlvbnMuZWFzZU91dFF1YXJ0ICh0KVxuICAgICAgICAgIGNvbnN0IG9mZnNldFggPSB2ZWxvY2l0eV94ICogZmFjdG9yXG4gICAgICAgICAgY29uc3Qgb2Zmc2V0WSA9IHZlbG9jaXR5X3kgKiBmYWN0b3JcblxuICAgICAgICAgIGN1cnJlbnRfZXZlbnQueCAgICAgICA9IHN0YXJ0X3ggKyBvZmZzZXRYXG4gICAgICAgICAgY3VycmVudF9ldmVudC55ICAgICAgID0gc3RhcnRfeSArIG9mZnNldFlcbiAgICAgICAgICBjdXJyZW50X2V2ZW50Lm9mZnNldFggPSB2ZWxvY2l0eV94IC0gb2Zmc2V0WFxuICAgICAgICAgIGN1cnJlbnRfZXZlbnQub2Zmc2V0WSA9IHZlbG9jaXR5X3kgLSBvZmZzZXRZXG5cbiAgICAgICAgICBjb25maWcub25EcmFnICggY3VycmVudF9ldmVudCApXG5cbiAgICAgICAgICBpZiAoIHQgPT0gMSApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgaXNfYW5pbWF0ZSA9IGZhbHNlXG4gICAgICAgICAgICAgICBjb25maWcub25FbmRBbmltYXRpb24gKCBjdXJyZW50X2V2ZW50IClcbiAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgIH1cblxuICAgICAgICAgIGN1cnJlbnRfYW5pbWF0aW9uID0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSAoIG9uVmVsb2NpdHlGcmFtZSApXG4gICAgIH1cbiAgICAgZnVuY3Rpb24gc3RvcFZlbG9jaXR5RnJhbWUgKClcbiAgICAge1xuICAgICAgICAgIGlzX2FuaW1hdGUgPSBmYWxzZVxuICAgICAgICAgIHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSAoIGN1cnJlbnRfYW5pbWF0aW9uIClcbiAgICAgICAgICBjb25maWcub25FbmRBbmltYXRpb24gKCBjdXJyZW50X2V2ZW50IClcbiAgICAgfVxufVxuIiwiXG5leHBvcnQgdHlwZSBFeHRlbmRlZENTU1N0eWxlRGVjbGFyYXRpb24gPSBDU1NTdHlsZURlY2xhcmF0aW9uICZcbntcbiAgICBkaXNwbGF5ICAgICAgOiBcImlubGluZVwiIHwgXCJibG9ja1wiIHwgXCJjb250ZW50c1wiIHwgXCJmbGV4XCIgfCBcImdyaWRcIiB8IFwiaW5saW5lLWJsb2NrXCIgfCBcImlubGluZS1mbGV4XCIgfCBcImlubGluZS1ncmlkXCIgfCBcImlubGluZS10YWJsZVwiIHwgXCJsaXN0LWl0ZW1cIiB8IFwicnVuLWluXCIgfCBcInRhYmxlXCIgfCBcInRhYmxlLWNhcHRpb25cIiB8IFwidGFibGUtY29sdW1uLWdyb3VwXCIgfCBcInRhYmxlLWhlYWRlci1ncm91cFwiIHwgXCJ0YWJsZS1mb290ZXItZ3JvdXBcIiB8IFwidGFibGUtcm93LWdyb3VwXCIgfCBcInRhYmxlLWNlbGxcIiB8IFwidGFibGUtY29sdW1uXCIgfCBcInRhYmxlLXJvd1wiIHwgXCJub25lXCIgfCBcImluaXRpYWxcIiB8IFwiaW5oZXJpdFwiXG4gICAgZmxleERpcmVjdGlvbjogXCJyb3dcIiB8IFwicm93LXJldmVyc2VcIiB8IFwiY29sdW1uXCIgfCBcImNvbHVtbi1yZXZlcnNlXCIgfCBcImluaXRpYWxcIiB8IFwiaW5oZXJpdFwiXG4gICAgb3ZlcmZsb3cgICAgIDogXCJ2aXNpYmxlXCIgfCBcImhpZGRlblwiIHwgXCJzY3JvbGxcIiB8IFwiYXV0b1wiIHwgXCJpbml0aWFsXCIgfCBcImluaGVyaXRcIlxuICAgIG92ZXJmbG93WCAgICA6IFwidmlzaWJsZVwiIHwgXCJoaWRkZW5cIiB8IFwic2Nyb2xsXCIgfCBcImF1dG9cIiB8IFwiaW5pdGlhbFwiIHwgXCJpbmhlcml0XCJcbiAgICBvdmVyZmxvd1kgICAgOiBcInZpc2libGVcIiB8IFwiaGlkZGVuXCIgfCBcInNjcm9sbFwiIHwgXCJhdXRvXCIgfCBcImluaXRpYWxcIiB8IFwiaW5oZXJpdFwiXG4gICAgcG9zaXRpb24gICAgIDogXCJzdGF0aWNcIiB8IFwiYWJzb2x1dGVcIiB8IFwiZml4ZWRcIiB8IFwicmVsYXRpdmVcIiB8IFwic3RpY2t5XCIgfCBcImluaXRpYWxcIiB8IFwiaW5oZXJpdFwiXG59XG5cbi8qZGVjbGFyZSBnbG9iYWx7XG5cbiAgICAgaW50ZXJmYWNlIFdpbmRvd1xuICAgICB7XG4gICAgICAgICAgb246IFdpbmRvdyBbXCJhZGRFdmVudExpc3RlbmVyXCJdXG4gICAgICAgICAgb2ZmOiBXaW5kb3cgW1wicmVtb3ZlRXZlbnRMaXN0ZW5lclwiXVxuICAgICB9XG5cbiAgICAgaW50ZXJmYWNlIEVsZW1lbnRcbiAgICAge1xuICAgICAgICAgIGNzcyAoIHByb3BlcnRpZXM6IFBhcnRpYWwgPEV4dGVuZGVkQ1NTU3R5bGVEZWNsYXJhdGlvbj4gKTogdGhpc1xuXG4gICAgICAgICAgY3NzSW50ICAgKCBwcm9wZXJ0eTogc3RyaW5nICk6IG51bWJlclxuICAgICAgICAgIGNzc0Zsb2F0ICggcHJvcGVydHk6IHN0cmluZyApOiBudW1iZXJcblxuICAgICAgICAgIG9uIDogSFRNTEVsZW1lbnQgW1wiYWRkRXZlbnRMaXN0ZW5lclwiXVxuICAgICAgICAgIG9mZjogSFRNTEVsZW1lbnQgW1wicmVtb3ZlRXZlbnRMaXN0ZW5lclwiXVxuICAgICAgICAgICQgIDogSFRNTEVsZW1lbnQgW1wicXVlcnlTZWxlY3RvclwiXVxuICAgICAgICAgICQkIDogSFRNTEVsZW1lbnQgW1wicXVlcnlTZWxlY3RvckFsbFwiXVxuICAgICB9XG59XG5cbldpbmRvdy5wcm90b3R5cGUub24gID0gV2luZG93LnByb3RvdHlwZS5hZGRFdmVudExpc3RlbmVyXG5XaW5kb3cucHJvdG90eXBlLm9mZiA9IFdpbmRvdy5wcm90b3R5cGUucmVtb3ZlRXZlbnRMaXN0ZW5lclxuXG5FbGVtZW50LnByb3RvdHlwZS5jc3MgPSBmdW5jdGlvbiAoIHByb3BzIClcbntcbk9iamVjdC5hc3NpZ24gKCB0aGlzLnN0eWxlLCBwcm9wcyApXG5yZXR1cm4gdGhpc1xufVxuXG5FbGVtZW50LnByb3RvdHlwZS5jc3NJbnQgPSBmdW5jdGlvbiAoIHByb3BlcnR5OiBzdHJpbmcgKVxue1xuICAgICB2YXIgdmFsdWUgPSBwYXJzZUludCAoIHRoaXMuc3R5bGUgWyBwcm9wZXJ0eSBdIClcblxuICAgICBpZiAoIE51bWJlci5pc05hTiAoIHZhbHVlICkgKVxuICAgICB7XG4gICAgICAgICAgdmFsdWUgPSBwYXJzZUludCAoIHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlICggdGhpcyApIFsgcHJvcGVydHkgXSApXG5cbiAgICAgICAgICBpZiAoIE51bWJlci5pc05hTiAoIHZhbHVlICkgKVxuICAgICAgICAgICAgICAgdmFsdWUgPSAwXG4gICAgIH1cblxuICAgICByZXR1cm4gdmFsdWVcbn1cblxuRWxlbWVudC5wcm90b3R5cGUuY3NzRmxvYXQgPSBmdW5jdGlvbiAoIHByb3BlcnR5OiBzdHJpbmcgKVxue1xuICAgICB2YXIgdmFsdWUgPSBwYXJzZUZsb2F0ICggdGhpcy5zdHlsZSBbIHByb3BlcnR5IF0gKVxuXG4gICAgIGlmICggTnVtYmVyLmlzTmFOICggdmFsdWUgKSApXG4gICAgIHtcbiAgICAgICAgICB2YWx1ZSA9IHBhcnNlRmxvYXQgKCB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZSAoIHRoaXMgKSBbIHByb3BlcnR5IF0gKVxuXG4gICAgICAgICAgaWYgKCBOdW1iZXIuaXNOYU4gKCB2YWx1ZSApIClcbiAgICAgICAgICAgICAgIHZhbHVlID0gMFxuICAgICB9XG5cbiAgICAgcmV0dXJuIHZhbHVlXG59XG5cbkVsZW1lbnQucHJvdG90eXBlLm9uICA9IEVsZW1lbnQucHJvdG90eXBlLmFkZEV2ZW50TGlzdGVuZXJcblxuRWxlbWVudC5wcm90b3R5cGUub2ZmID0gRWxlbWVudC5wcm90b3R5cGUucmVtb3ZlRXZlbnRMaXN0ZW5lclxuXG5FbGVtZW50LnByb3RvdHlwZS4kICAgPSBFbGVtZW50LnByb3RvdHlwZS5xdWVyeVNlbGVjdG9yXG5cbkVsZW1lbnQucHJvdG90eXBlLiQkICA9IEVsZW1lbnQucHJvdG90eXBlLnF1ZXJ5U2VsZWN0b3JBbGxcblxuXG5FbGVtZW50LnByb3RvdHlwZS5jc3NJbnQgPSBmdW5jdGlvbiAoIHByb3BlcnR5OiBzdHJpbmcgKVxue1xuICAgICB2YXIgdmFsdWUgPSBwYXJzZUludCAoIHRoaXMuc3R5bGUgWyBwcm9wZXJ0eSBdIClcblxuICAgICBpZiAoIE51bWJlci5pc05hTiAoIHZhbHVlICkgKVxuICAgICB7XG4gICAgICAgICAgY29uc3Qgc3R5bGUgPSB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZSAoIHRoaXMgKVxuXG4gICAgICAgICAgdmFsdWUgPSBwYXJzZUludCAoIHN0eWxlIFsgcHJvcGVydHkgXSApXG5cbiAgICAgICAgICBpZiAoIE51bWJlci5pc05hTiAoIHZhbHVlICkgKVxuICAgICAgICAgICAgICAgdmFsdWUgPSAwXG4gICAgIH1cblxuICAgICByZXR1cm4gdmFsdWVcbn0qL1xuXG5leHBvcnQgZnVuY3Rpb24gY3NzICggZWw6IEhUTUxFbGVtZW50IHwgU1ZHRWxlbWVudCwgcHJvcHM6IFBhcnRpYWwgPEV4dGVuZGVkQ1NTU3R5bGVEZWNsYXJhdGlvbj4gKVxue1xuICAgICBPYmplY3QuYXNzaWduICggZWwuc3R5bGUsIHByb3BzIClcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNzc0Zsb2F0ICggZWw6IEhUTUxFbGVtZW50IHwgU1ZHRWxlbWVudCwgcHJvcGVydHk6IHN0cmluZyApXG57XG4gICAgIHZhciB2YWx1ZSA9IHBhcnNlRmxvYXQgKCBlbC5zdHlsZSBbIHByb3BlcnR5IF0gKVxuXG4gICAgIGlmICggTnVtYmVyLmlzTmFOICggdmFsdWUgKSApXG4gICAgIHtcbiAgICAgICAgICB2YWx1ZSA9IHBhcnNlRmxvYXQgKCB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZSAoIGVsICkgWyBwcm9wZXJ0eSBdIClcblxuICAgICAgICAgIGlmICggTnVtYmVyLmlzTmFOICggdmFsdWUgKSApXG4gICAgICAgICAgICAgICB2YWx1ZSA9IDBcbiAgICAgfVxuXG4gICAgIHJldHVybiB2YWx1ZVxufVxuXG5leHBvcnQgZnVuY3Rpb24gY3NzSW50ICggZWw6IEhUTUxFbGVtZW50IHwgU1ZHRWxlbWVudCwgcHJvcGVydHk6IHN0cmluZyApXG57XG4gICAgIHZhciB2YWx1ZSA9IHBhcnNlSW50ICggZWwuc3R5bGUgWyBwcm9wZXJ0eSBdIClcblxuICAgICBpZiAoIE51bWJlci5pc05hTiAoIHZhbHVlICkgKVxuICAgICB7XG4gICAgICAgICAgY29uc3Qgc3R5bGUgPSB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZSAoIGVsIClcblxuICAgICAgICAgIHZhbHVlID0gcGFyc2VJbnQgKCBzdHlsZSBbIHByb3BlcnR5IF0gKVxuXG4gICAgICAgICAgaWYgKCBOdW1iZXIuaXNOYU4gKCB2YWx1ZSApIClcbiAgICAgICAgICAgICAgIHZhbHVlID0gMFxuICAgICB9XG5cbiAgICAgcmV0dXJuIHZhbHVlXG59XG5cbiIsIlxuaW1wb3J0ICogYXMgVWkgZnJvbSBcIi4vZHJhZ2dhYmxlLmpzXCJcbmltcG9ydCB7IGNzc0ludCB9IGZyb20gXCIuL2RvbS5qc1wiXG5cbnR5cGUgRGlyZWN0aW9uID0gXCJsclwiIHwgXCJybFwiIHwgXCJidFwiIHwgXCJ0YlwiXG5cbi8vZXhwb3J0IHR5cGUgRXhwZW5kYWJsZVByb3BlcnR5ID0gXCJ3aWR0aFwiIHwgXCJoZWlnaHRcIlxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfCBcInRvcFwiIHwgXCJsZWZ0XCIgfCBcImJvdHRvbVwiIHwgXCJyaWdodFwiXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8IFwieFwiIHwgXCJ5XCJcblxuZXhwb3J0IHR5cGUgRXhwZW5kYWJsZUVsZW1lbnQgPSBSZXR1cm5UeXBlIDx0eXBlb2YgZXhwYW5kYWJsZT5cblxudHlwZSBFeHBlbmRhYmxlT3B0aW9ucyA9IFBhcnRpYWwgPEV4cGVuZGFibGVDb25maWc+XG5cbmludGVyZmFjZSBFeHBlbmRhYmxlQ29uZmlnXG57XG4gICAgIGhhbmRsZXMgICAgICA6IEpTWC5FbGVtZW50IFtdXG4gICAgIHByb3BlcnR5PyAgICA6IHN0cmluZyxcbiAgICAgb3BlbiAgICAgICAgIDogYm9vbGVhblxuICAgICBuZWFyICAgICAgICAgOiBudW1iZXJcbiAgICAgZGVsYXkgICAgICAgIDogbnVtYmVyXG4gICAgIGRpcmVjdGlvbiAgICA6IERpcmVjdGlvblxuICAgICBtaW5TaXplICAgICAgOiBudW1iZXJcbiAgICAgbWF4U2l6ZSAgICAgIDogbnVtYmVyXG4gICAgIHVuaXQgICAgICAgICA6IFwicHhcIiB8IFwiJVwiIHwgXCJcIixcbiAgICAgb25CZWZvcmVPcGVuIDogKCkgPT4gdm9pZFxuICAgICBvbkFmdGVyT3BlbiAgOiAoKSA9PiB2b2lkXG4gICAgIG9uQmVmb3JlQ2xvc2U6ICgpID0+IHZvaWRcbiAgICAgb25BZnRlckNsb3NlIDogKCkgPT4gdm9pZFxufVxuXG5jb25zdCB2ZXJ0aWNhbFByb3BlcnRpZXMgPSBbIFwiaGVpZ2h0XCIsIFwidG9wXCIsIFwiYm90dG9tXCIgXVxuXG5mdW5jdGlvbiBkZWZhdWx0Q29uZmlnICgpOiBFeHBlbmRhYmxlQ29uZmlnXG57XG4gICAgIHJldHVybiB7XG4gICAgICAgICAgaGFuZGxlcyAgICAgIDogW10sXG4gICAgICAgICAgcHJvcGVydHkgICAgIDogXCJoZWlnaHRcIixcbiAgICAgICAgICBvcGVuICAgICAgICAgOiBmYWxzZSxcbiAgICAgICAgICBuZWFyICAgICAgICAgOiA0MCxcbiAgICAgICAgICBkZWxheSAgICAgICAgOiAyNTAsXG4gICAgICAgICAgbWluU2l6ZSAgICAgIDogMCxcbiAgICAgICAgICBtYXhTaXplICAgICAgOiB3aW5kb3cuaW5uZXJIZWlnaHQsXG4gICAgICAgICAgdW5pdCAgICAgICAgIDogXCJweFwiLFxuICAgICAgICAgIGRpcmVjdGlvbiAgICA6IFwidGJcIixcbiAgICAgICAgICBvbkJlZm9yZU9wZW4gOiAoKSA9PiB7fSxcbiAgICAgICAgICBvbkFmdGVyT3BlbiAgOiAoKSA9PiB7fSxcbiAgICAgICAgICBvbkJlZm9yZUNsb3NlOiAoKSA9PiB7fSxcbiAgICAgICAgICBvbkFmdGVyQ2xvc2UgOiAoKSA9PiB7fSxcbiAgICAgfVxufVxuXG5jb25zdCB0b1NpZ24gPSB7XG4gICAgIGxyIDogMSxcbiAgICAgcmwgOiAtMSxcbiAgICAgdGIgOiAtMSxcbiAgICAgYnQgOiAxLFxufVxuY29uc3QgdG9Qcm9wZXJ0eSA6IFJlY29yZCA8RGlyZWN0aW9uLCBzdHJpbmc+ID0ge1xuICAgICBsciA6IFwid2lkdGhcIixcbiAgICAgcmwgOiBcIndpZHRoXCIsXG4gICAgIHRiIDogXCJoZWlnaHRcIixcbiAgICAgYnQgOiBcImhlaWdodFwiLFxufVxuXG5leHBvcnQgZnVuY3Rpb24gZXhwYW5kYWJsZSAoIGVsZW1lbnQ6IEpTWC5FbGVtZW50LCBvcHRpb25zOiBFeHBlbmRhYmxlT3B0aW9ucyA9IHt9IClcbntcbiAgICAgY29uc3QgY29uZmlnID0gZGVmYXVsdENvbmZpZyAoKVxuXG4gICAgIHZhciBpc19vcGVuICAgIDogYm9vbGVhblxuICAgICB2YXIgaXNfdmVydGljYWw6IGJvb2xlYW5cbiAgICAgdmFyIHNpZ24gICAgICAgOiBudW1iZXJcbiAgICAgdmFyIHVuaXQgICAgICAgOiBFeHBlbmRhYmxlQ29uZmlnIFtcInVuaXRcIl1cbiAgICAgdmFyIGNiICAgICAgICAgOiAoKSA9PiB2b2lkXG4gICAgIHZhciBtaW5TaXplICAgIDogbnVtYmVyXG4gICAgIHZhciBtYXhTaXplICAgIDogbnVtYmVyXG4gICAgIHZhciBzdGFydF9zaXplICA9IDBcbiAgICAgdmFyIG9wZW5fc2l6ZSAgID0gMTAwXG5cbiAgICAgY29uc3QgZHJhZ2dhYmxlID0gVWkuZHJhZ2dhYmxlICh7XG4gICAgICAgICAgaGFuZGxlcyAgICAgICA6IFtdLFxuICAgICAgICAgIG9uU3RhcnREcmFnICAgOiBvblN0YXJ0RHJhZyxcbiAgICAgICAgICBvblN0b3BEcmFnICAgIDogb25TdG9wRHJhZyxcbiAgICAgICAgICBvbkVuZEFuaW1hdGlvbjogb25FbmRBbmltYXRpb24sXG4gICAgIH0pXG5cbiAgICAgdXBkYXRlQ29uZmlnICggb3B0aW9ucyApXG5cbiAgICAgZnVuY3Rpb24gdXBkYXRlQ29uZmlnICggb3B0aW9ucyA9IHt9IGFzIEV4cGVuZGFibGVPcHRpb25zIClcbiAgICAge1xuICAgICAgICAgIGlmICggb3B0aW9ucy5wcm9wZXJ0eSA9PSB1bmRlZmluZWQgJiYgb3B0aW9ucy5kaXJlY3Rpb24gIT0gdW5kZWZpbmVkIClcbiAgICAgICAgICAgICAgIG9wdGlvbnMucHJvcGVydHkgPSB0b1Byb3BlcnR5IFtvcHRpb25zLmRpcmVjdGlvbl1cblxuICAgICAgICAgIE9iamVjdC5hc3NpZ24gKCBjb25maWcsIG9wdGlvbnMgKVxuXG4gICAgICAgICAgaXNfb3BlbiAgICAgPSBjb25maWcub3BlblxuICAgICAgICAgIHNpZ24gICAgICAgID0gdG9TaWduIFtjb25maWcuZGlyZWN0aW9uXVxuICAgICAgICAgIHVuaXQgICAgICAgID0gY29uZmlnLnVuaXRcbiAgICAgICAgICBpc192ZXJ0aWNhbCA9IGNvbmZpZy5kaXJlY3Rpb24gPT0gXCJidFwiIHx8IGNvbmZpZy5kaXJlY3Rpb24gPT0gXCJ0YlwiID8gdHJ1ZSA6IGZhbHNlXG4gICAgICAgICAgbWluU2l6ZSA9IGNvbmZpZy5taW5TaXplXG4gICAgICAgICAgbWF4U2l6ZSA9IGNvbmZpZy5tYXhTaXplXG5cbiAgICAgICAgICBlbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUgKCBpc192ZXJ0aWNhbCA/IFwiaG9yaXpvbnRhbFwiIDogXCJ2ZXJ0aWNhbFwiIClcbiAgICAgICAgICBlbGVtZW50LmNsYXNzTGlzdC5hZGQgICAgKCBpc192ZXJ0aWNhbCA/IFwidmVydGljYWxcIiA6IFwiaG9yaXpvbnRhbFwiIClcblxuICAgICAgICAgIGRyYWdnYWJsZS51cGRhdGVDb25maWcgKHtcbiAgICAgICAgICAgICAgIGhhbmRsZXM6IGNvbmZpZy5oYW5kbGVzLFxuICAgICAgICAgICAgICAgb25EcmFnIDogaXNfdmVydGljYWwgPyBvbkRyYWdWZXJ0aWNhbDogb25EcmFnSG9yaXpvbnRhbCxcbiAgICAgICAgICB9KVxuICAgICB9XG4gICAgIGZ1bmN0aW9uIHNpemUgKClcbiAgICAge1xuICAgICAgICAgIHJldHVybiBpc19vcGVuID8gY3NzSW50ICggZWxlbWVudCwgY29uZmlnLnByb3BlcnR5ICkgOiAwXG4gICAgIH1cbiAgICAgZnVuY3Rpb24gdG9nZ2xlICgpXG4gICAgIHtcbiAgICAgICAgICBpZiAoIGlzX29wZW4gKVxuICAgICAgICAgICAgICAgY2xvc2UgKClcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICBvcGVuICgpXG4gICAgIH1cbiAgICAgZnVuY3Rpb24gb3BlbiAoKVxuICAgICB7XG4gICAgICAgICAgY29uZmlnLm9uQmVmb3JlT3BlbiAoKVxuXG4gICAgICAgICAgZWxlbWVudC5jbGFzc0xpc3QuYWRkICggXCJhbmltYXRlXCIgKVxuICAgICAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LnJlcGxhY2UgKCBcImNsb3NlXCIsIFwib3BlblwiIClcblxuICAgICAgICAgIGlmICggY2IgKVxuICAgICAgICAgICAgICAgb25UcmFuc2l0aW9uRW5kICgpXG5cbiAgICAgICAgICBjYiA9IGNvbmZpZy5vbkFmdGVyT3BlblxuICAgICAgICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lciAoIFwidHJhbnNpdGlvbmVuZFwiLCAoKSA9PiBvblRyYW5zaXRpb25FbmQgKVxuXG4gICAgICAgICAgZWxlbWVudC5zdHlsZSBbIGNvbmZpZy5wcm9wZXJ0eSBdID0gb3Blbl9zaXplICsgdW5pdFxuXG4gICAgICAgICAgaXNfb3BlbiA9IHRydWVcbiAgICAgfVxuICAgICBmdW5jdGlvbiBjbG9zZSAoKVxuICAgICB7XG4gICAgICAgICAgY29uZmlnLm9uQmVmb3JlQ2xvc2UgKClcblxuICAgICAgICAgIG9wZW5fc2l6ZSA9IHNpemUgKClcblxuICAgICAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LmFkZCAoIFwiYW5pbWF0ZVwiIClcbiAgICAgICAgICBlbGVtZW50LmNsYXNzTGlzdC5yZXBsYWNlICggXCJvcGVuXCIsIFwiY2xvc2VcIiApXG5cbiAgICAgICAgICBpZiAoIGNiIClcbiAgICAgICAgICAgICAgIG9uVHJhbnNpdGlvbkVuZCAoKVxuXG4gICAgICAgICAgY2IgPSBjb25maWcub25BZnRlckNsb3NlXG4gICAgICAgICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyICggXCJ0cmFuc2l0aW9uZW5kXCIsIG9uVHJhbnNpdGlvbkVuZCApXG5cbiAgICAgICAgICBlbGVtZW50LnN0eWxlIFsgY29uZmlnLnByb3BlcnR5IF0gPSBcIjBcIiArIHVuaXRcblxuICAgICAgICAgIGlzX29wZW4gPSBmYWxzZVxuICAgICB9XG5cbiAgICAgcmV0dXJuIHtcbiAgICAgICAgICB1cGRhdGVDb25maWcsXG4gICAgICAgICAgb3BlbixcbiAgICAgICAgICBjbG9zZSxcbiAgICAgICAgICB0b2dnbGUsXG4gICAgICAgICAgaXNPcGVuICAgICA6ICgpID0+IGlzX29wZW4sXG4gICAgICAgICAgaXNDbG9zZSAgICA6ICgpID0+ICEgaXNfb3BlbixcbiAgICAgICAgICBpc1ZlcnRpY2FsIDogKCkgPT4gaXNfdmVydGljYWwsXG4gICAgICAgICAgaXNBY3RpdmUgICA6ICgpID0+IGRyYWdnYWJsZS5pc0FjdGl2ZSAoKSxcbiAgICAgICAgICBhY3RpdmF0ZSAgIDogKCkgPT4gZHJhZ2dhYmxlLmFjdGl2YXRlICgpLFxuICAgICAgICAgIGRlc2FjdGl2YXRlOiAoKSA9PiBkcmFnZ2FibGUuZGVzYWN0aXZhdGUgKCksXG4gICAgIH1cblxuICAgICBmdW5jdGlvbiBvblRyYW5zaXRpb25FbmQgKClcbiAgICAge1xuICAgICAgICAgIGlmICggY2IgKVxuICAgICAgICAgICAgICAgY2IgKClcbiAgICAgICAgICBlbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIgKCBcInRyYW5zaXRpb25lbmRcIiwgKCkgPT4gb25UcmFuc2l0aW9uRW5kIClcbiAgICAgICAgICBjYiA9IG51bGxcbiAgICAgfVxuXG4gICAgIGZ1bmN0aW9uIG9uU3RhcnREcmFnICgpXG4gICAgIHtcbiAgICAgICAgICBzdGFydF9zaXplID0gc2l6ZSAoKVxuICAgICAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZSAoIFwiYW5pbWF0ZVwiIClcbiAgICAgfVxuICAgICBmdW5jdGlvbiBvbkRyYWdWZXJ0aWNhbCAoIGV2ZW50OiBVaS5EcmFnRXZlbnQgKVxuICAgICB7XG4gICAgICAgICAgY29uc29sZS5sb2cgKCBtaW5TaXplLCBldmVudC55LCBtYXhTaXplIClcbiAgICAgICAgICBjb25zb2xlLmxvZyAoIGNsYW1wICggc3RhcnRfc2l6ZSArIHNpZ24gKiBldmVudC55ICkgKyB1bml0IClcbiAgICAgICAgICBlbGVtZW50LnN0eWxlIFsgY29uZmlnLnByb3BlcnR5IF0gPSBjbGFtcCAoIHN0YXJ0X3NpemUgKyBzaWduICogZXZlbnQueSApICsgdW5pdFxuICAgICB9XG4gICAgIGZ1bmN0aW9uIG9uRHJhZ0hvcml6b250YWwgKCBldmVudDogVWkuRHJhZ0V2ZW50IClcbiAgICAge1xuICAgICAgICAgIGVsZW1lbnQuc3R5bGUgWyBjb25maWcucHJvcGVydHkgXSA9IGNsYW1wICggc3RhcnRfc2l6ZSArIHNpZ24gKiBldmVudC54ICkgKyB1bml0XG4gICAgIH1cbiAgICAgZnVuY3Rpb24gb25TdG9wRHJhZyAoIGV2ZW50OiBVaS5EcmFnRXZlbnQgKVxuICAgICB7XG4gICAgICAgICAgdmFyIGlzX21vdmVkID0gaXNfdmVydGljYWwgPyBzaWduICogZXZlbnQueSA+IGNvbmZpZy5uZWFyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBzaWduICogZXZlbnQueCA+IGNvbmZpZy5uZWFyXG5cbiAgICAgICAgICBpZiAoIChpc19tb3ZlZCA9PSBmYWxzZSkgJiYgZXZlbnQuZGVsYXkgPD0gY29uZmlnLmRlbGF5IClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICB0b2dnbGUgKClcbiAgICAgICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbnN0IHRhcmdldF9zaXplID0gY2xhbXAgKFxuICAgICAgICAgICAgICAgaXNfdmVydGljYWwgPyBzdGFydF9zaXplICsgc2lnbiAqIGV2ZW50LnRhcmdldFlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIDogc3RhcnRfc2l6ZSArIHNpZ24gKiBldmVudC50YXJnZXRYXG4gICAgICAgICAgKVxuXG4gICAgICAgICAgaWYgKCB0YXJnZXRfc2l6ZSA8PSBjb25maWcubmVhciApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgY2xvc2UgKClcbiAgICAgICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiB0cnVlXG5cbiAgICAgfVxuICAgICBmdW5jdGlvbiBvbkVuZEFuaW1hdGlvbiAoKVxuICAgICB7XG4gICAgICAgICAgb3Blbl9zaXplID0gY3NzSW50ICggZWxlbWVudCwgY29uZmlnLnByb3BlcnR5IClcbiAgICAgICAgICBvcGVuICgpXG4gICAgIH1cblxuICAgICBmdW5jdGlvbiBjbGFtcCAoIHY6IG51bWJlciApXG4gICAgIHtcbiAgICAgICAgICBpZiAoIHYgPCBtaW5TaXplIClcbiAgICAgICAgICAgICAgIHJldHVybiBtaW5TaXplXG5cbiAgICAgICAgICBpZiAoIHYgPiBtYXhTaXplIClcbiAgICAgICAgICAgICAgIHJldHVybiBtYXhTaXplXG5cbiAgICAgICAgICByZXR1cm4gdlxuICAgICB9XG59XG4iLCJcbmltcG9ydCB7IENzcyB9IGZyb20gXCIuLi8uLi9MaWIvaW5kZXguanNcIlxuaW1wb3J0IHsgY3NzRmxvYXQgfSBmcm9tIFwiLi9kb20uanNcIlxuaW1wb3J0ICogYXMgVWkgZnJvbSBcIi4vZHJhZ2dhYmxlLmpzXCJcbmltcG9ydCB7IHhub2RlIH0gZnJvbSBcIi4veG5vZGUuanNcIlxuXG50eXBlIERpcmVjdGlvbiAgID0gXCJsclwiIHwgXCJybFwiIHwgXCJidFwiIHwgXCJ0YlwiXG50eXBlIE9yaWVudGF0aW9uID0gXCJ2ZXJ0aWNhbFwiIHwgXCJob3Jpem9udGFsXCJcbnR5cGUgVW5pdHMgICAgICAgPSBcInB4XCIgfCBcIiVcIlxudHlwZSBTd2lwZWFibGVQcm9wZXJ0eSA9IFwidG9wXCIgfCBcImxlZnRcIiB8IFwiYm90dG9tXCIgfCBcInJpZ2h0XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICB8IFwieFwiIHwgXCJ5XCJcblxudHlwZSBTd2lwZWFibGVPcHRpb25zID0gUGFydGlhbCA8U3dpcGVhYmxlQ29uZmlnPlxuXG50eXBlIFN3aXBlYWJsZUNvbmZpZyA9IHtcbiAgICAgaGFuZGxlcyAgIDogSlNYLkVsZW1lbnQgW11cbiAgICAgZGlyZWN0aW9uIDogRGlyZWN0aW9uLFxuICAgICBwb3JwZXJ0eT8gOiBTd2lwZWFibGVQcm9wZXJ0eVxuICAgICBtaW5WYWx1ZSAgOiBudW1iZXIsXG4gICAgIG1heFZhbHVlICA6IG51bWJlcixcbiAgICAgdW5pdHMgICAgIDogVW5pdHMsXG4gICAgIG1vdXNlV2hlZWw6IGJvb2xlYW5cbn1cblxuZXhwb3J0IHR5cGUgU3dpcGVhYmxlRWxlbWVudCA9IFJldHVyblR5cGUgPHR5cGVvZiBzd2lwZWFibGU+XG5cbmZ1bmN0aW9uIGRlZmF1bHRDb25maWcgKCk6IFN3aXBlYWJsZUNvbmZpZ1xue1xuICAgICByZXR1cm4ge1xuICAgICAgICAgIGhhbmRsZXMgICA6IFtdLFxuICAgICAgICAgIGRpcmVjdGlvbiA6IFwibHJcIixcbiAgICAgICAgICBwb3JwZXJ0eSAgOiBcImxlZnRcIixcbiAgICAgICAgICBtaW5WYWx1ZSAgOiAtMTAwLFxuICAgICAgICAgIG1heFZhbHVlICA6IDAsXG4gICAgICAgICAgdW5pdHMgICAgIDogXCIlXCIsXG4gICAgICAgICAgbW91c2VXaGVlbDogdHJ1ZSxcbiAgICAgfVxufVxuXG52YXIgc3RhcnRfcG9zaXRpb24gPSAwXG52YXIgaXNfdmVydGljYWwgICAgPSBmYWxzZVxudmFyIHByb3AgOiBTd2lwZWFibGVQcm9wZXJ0eVxuXG5leHBvcnQgZnVuY3Rpb24gc3dpcGVhYmxlICggZWxlbWVudDogSlNYLkVsZW1lbnQsIG9wdGlvbnM6IFN3aXBlYWJsZU9wdGlvbnMgKVxue1xuICAgICBjb25zdCBjb25maWcgPSBkZWZhdWx0Q29uZmlnICgpXG5cbiAgICAgY29uc3QgZHJhZ2dhYmxlID0gVWkuZHJhZ2dhYmxlICh7XG4gICAgICAgICAgaGFuZGxlczogW10sXG4gICAgICAgICAgb25TdGFydERyYWcsXG4gICAgICAgICAgb25TdG9wRHJhZyxcbiAgICAgfSlcblxuICAgICBlbGVtZW50LmNsYXNzTGlzdC5hZGQgKCBcInN3aXBlYWJsZVwiIClcblxuICAgICB1cGRhdGVDb25maWcgKCBvcHRpb25zIClcblxuICAgICBmdW5jdGlvbiB1cGRhdGVDb25maWcgKCBvcHRpb25zOiBTd2lwZWFibGVPcHRpb25zIClcbiAgICAge1xuICAgICAgICAgIE9iamVjdC5hc3NpZ24gKCBjb25maWcsIG9wdGlvbnMgKVxuXG4gICAgICAgICAgaXNfdmVydGljYWwgPSBjb25maWcuZGlyZWN0aW9uID09IFwiYnRcIiB8fCBjb25maWcuZGlyZWN0aW9uID09IFwidGJcIlxuXG4gICAgICAgICAgaWYgKCBvcHRpb25zLnBvcnBlcnR5ID09IHVuZGVmaW5lZCApXG4gICAgICAgICAgICAgICBjb25maWcucG9ycGVydHkgPSBpc192ZXJ0aWNhbCA/IFwidG9wXCIgOiBcImxlZnRcIlxuXG4gICAgICAgICAgLy8gc3dpdGNoICggY29uZmlnLnBvcnBlcnR5IClcbiAgICAgICAgICAvLyB7XG4gICAgICAgICAgLy8gY2FzZSBcInRvcFwiOiBjYXNlIFwiYm90dG9tXCI6IGNhc2UgXCJ5XCI6IGlzX3ZlcnRpY2FsID0gdHJ1ZSAgOyBicmVha1xuICAgICAgICAgIC8vIGNhc2UgXCJsZWZ0XCI6IGNhc2UgXCJyaWdodFwiOiBjYXNlIFwieFwiOiBpc192ZXJ0aWNhbCA9IGZhbHNlIDsgYnJlYWtcbiAgICAgICAgICAvLyBkZWZhdWx0OiBkZWJ1Z2dlciA7IHJldHVyblxuICAgICAgICAgIC8vIH1cblxuICAgICAgICAgIGRyYWdnYWJsZS51cGRhdGVDb25maWcgKHtcbiAgICAgICAgICAgICAgIGhhbmRsZXM6IGNvbmZpZy5oYW5kbGVzLFxuICAgICAgICAgICAgICAgb25EcmFnOiBpc192ZXJ0aWNhbCA/IG9uRHJhZ1ZlcnRpY2FsIDogb25EcmFnSG9yaXpvbnRhbFxuICAgICAgICAgIH0pXG5cbiAgICAgICAgICBwcm9wID0gY29uZmlnLnBvcnBlcnR5XG5cbiAgICAgICAgICBpZiAoIGRyYWdnYWJsZS5pc0FjdGl2ZSAoKSApXG4gICAgICAgICAgICAgICBhY3RpdmVFdmVudHMgKClcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICBkZXNhY3RpdmVFdmVudHMgKClcbiAgICAgfVxuXG4gICAgIGZ1bmN0aW9uIHBvc2l0aW9uICgpXG4gICAgIHtcbiAgICAgICAgICByZXR1cm4gY3NzRmxvYXQgKCBlbGVtZW50LCBwcm9wIClcbiAgICAgfVxuXG4gICAgIGZ1bmN0aW9uIGFjdGl2YXRlICgpXG4gICAgIHtcbiAgICAgICAgICBkcmFnZ2FibGUuYWN0aXZhdGUgKClcbiAgICAgICAgICBhY3RpdmVFdmVudHMgKClcbiAgICAgfVxuICAgICBmdW5jdGlvbiBkZXNhY3RpdmF0ZSAoKVxuICAgICB7XG4gICAgICAgICAgZHJhZ2dhYmxlLmRlc2FjdGl2YXRlICgpXG4gICAgICAgICAgZGVzYWN0aXZlRXZlbnRzICgpXG4gICAgIH1cblxuICAgICBmdW5jdGlvbiBzd2lwZSAoIG9mZnNldDogc3RyaW5nICk6IHZvaWRcbiAgICAgZnVuY3Rpb24gc3dpcGUgKCBvZmZzZXQ6IG51bWJlciwgdW5pdHM6IFVuaXRzICk6IHZvaWRcbiAgICAgZnVuY3Rpb24gc3dpcGUgKCBvZmZzZXQ6IHN0cmluZ3xudW1iZXIsIHU/OiBVbml0cyApXG4gICAgIHtcbiAgICAgICAgICBpZiAoIHR5cGVvZiBvZmZzZXQgPT0gXCJzdHJpbmdcIiApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgdSA9IENzcy5nZXRVbml0ICggb2Zmc2V0ICkgYXMgVW5pdHNcbiAgICAgICAgICAgICAgIG9mZnNldCA9IHBhcnNlRmxvYXQgKCBvZmZzZXQgKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICggISBbXCJweFwiLCBcIiVcIl0uaW5jbHVkZXMgKCB1ICkgKVxuICAgICAgICAgICAgICAgdSA9IFwicHhcIlxuXG4gICAgICAgICAgaWYgKCB1ICE9IGNvbmZpZy51bml0cyApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgaWYgKCAodSA9IGNvbmZpZy51bml0cykgPT0gXCIlXCIgKVxuICAgICAgICAgICAgICAgICAgICBvZmZzZXQgPSB0b1BlcmNlbnRzICggb2Zmc2V0IClcbiAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgb2Zmc2V0ID0gdG9QaXhlbHMgKCBvZmZzZXQgKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGVsZW1lbnQuc3R5bGUgW3Byb3BdID0gY2xhbXAgKCBvZmZzZXQgKSArIHVcbiAgICAgfVxuXG4gICAgIHJldHVybiB7XG4gICAgICAgICAgdXBkYXRlQ29uZmlnLFxuICAgICAgICAgIGFjdGl2YXRlLFxuICAgICAgICAgIGRlc2FjdGl2YXRlLFxuICAgICAgICAgIHBvc2l0aW9uLFxuICAgICAgICAgIHN3aXBlLFxuICAgICB9XG5cbiAgICAgZnVuY3Rpb24gYWN0aXZlRXZlbnRzICgpXG4gICAgIHtcbiAgICAgICAgICBpZiAoIGNvbmZpZy5tb3VzZVdoZWVsIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBmb3IgKCBjb25zdCBoIG9mIGNvbmZpZy5oYW5kbGVzIClcbiAgICAgICAgICAgICAgICAgICAgaC5hZGRFdmVudExpc3RlbmVyICggXCJ3aGVlbFwiLCBvbldoZWVsLCB7IHBhc3NpdmU6IHRydWUgfSApXG4gICAgICAgICAgfVxuICAgICB9XG4gICAgIGZ1bmN0aW9uIGRlc2FjdGl2ZUV2ZW50cyAoKVxuICAgICB7XG4gICAgICAgICAgZm9yICggY29uc3QgaCBvZiBjb25maWcuaGFuZGxlcyApXG4gICAgICAgICAgICAgICBoLnJlbW92ZUV2ZW50TGlzdGVuZXIgKCBcIndoZWVsXCIsIG9uV2hlZWwgKVxuICAgICB9XG5cbiAgICAgZnVuY3Rpb24gdG9QaXhlbHMgKCBwZXJjZW50YWdlOiBudW1iZXIgKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgeyBtaW5WYWx1ZTogbWluLCBtYXhWYWx1ZTogbWF4IH0gPSBjb25maWdcblxuICAgICAgICAgIGlmICggcGVyY2VudGFnZSA8IDEwMCApXG4gICAgICAgICAgICAgICBwZXJjZW50YWdlID0gMTAwICsgcGVyY2VudGFnZVxuXG4gICAgICAgICAgcmV0dXJuIG1pbiArIChtYXggLSBtaW4pICogcGVyY2VudGFnZSAvIDEwMFxuICAgICB9XG4gICAgIGZ1bmN0aW9uIHRvUGVyY2VudHMgKCBwaXhlbHM6IG51bWJlciApXG4gICAgIHtcbiAgICAgICAgICBjb25zdCB7IG1pblZhbHVlOiBtaW4sIG1heFZhbHVlOiBtYXggfSA9IGNvbmZpZ1xuICAgICAgICAgIHJldHVybiBNYXRoLmFicyAoIChwaXhlbHMgLSBtaW4pIC8gKG1heCAtIG1pbikgKiAxMDAgKVxuICAgICB9XG5cbiAgICAgZnVuY3Rpb24gb25TdGFydERyYWcgKClcbiAgICAge1xuICAgICAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZSAoIFwiYW5pbWF0ZVwiIClcbiAgICAgICAgICBzdGFydF9wb3NpdGlvbiA9IHBvc2l0aW9uICgpXG4gICAgIH1cbiAgICAgZnVuY3Rpb24gb25EcmFnVmVydGljYWwgKCBldmVudDogVWkuRHJhZ0V2ZW50IClcbiAgICAge1xuICAgICAgICAgIGVsZW1lbnQuc3R5bGUgW3Byb3BdID0gY2xhbXAgKCBzdGFydF9wb3NpdGlvbiArIGV2ZW50LnkgKSArIGNvbmZpZy51bml0c1xuICAgICB9XG4gICAgIGZ1bmN0aW9uIG9uRHJhZ0hvcml6b250YWwgKCBldmVudDogVWkuRHJhZ0V2ZW50IClcbiAgICAge1xuICAgICAgICAgIGVsZW1lbnQuc3R5bGUgW3Byb3BdID0gY2xhbXAgKCBzdGFydF9wb3NpdGlvbiArIGV2ZW50LnggKSArIGNvbmZpZy51bml0c1xuICAgICB9XG4gICAgIGZ1bmN0aW9uIG9uU3RvcERyYWcgKCBldmVudDogVWkuRHJhZ0V2ZW50IClcbiAgICAge1xuICAgICAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LmFkZCAoIFwiYW5pbWF0ZVwiIClcblxuICAgICAgICAgIGNvbnN0IG9mZnNldCA9IGlzX3ZlcnRpY2FsXG4gICAgICAgICAgICAgICAgICAgICAgICAgPyBldmVudC55IC8vKyBldmVudC52ZWxvY2l0eVlcbiAgICAgICAgICAgICAgICAgICAgICAgICA6IGV2ZW50LnggLy8rIGV2ZW50LnZlbG9jaXR5WFxuXG4gICAgICAgICAgZWxlbWVudC5zdHlsZSBbcHJvcF0gPSBjbGFtcCAoIHN0YXJ0X3Bvc2l0aW9uICsgb2Zmc2V0ICkgKyBjb25maWcudW5pdHNcbiAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICB9XG4gICAgIGZ1bmN0aW9uIG9uV2hlZWwgKCBldmVudDogV2hlZWxFdmVudCApXG4gICAgIHtcbiAgICAgICAgICBpZiAoIGV2ZW50LmRlbHRhTW9kZSAhPSBXaGVlbEV2ZW50LkRPTV9ERUxUQV9QSVhFTCApXG4gICAgICAgICAgICAgICByZXR1cm5cblxuICAgICAgICAgIGlmICggaXNfdmVydGljYWwgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHZhciBkZWx0YSA9IGV2ZW50LmRlbHRhWVxuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgdmFyIGRlbHRhID0gZXZlbnQuZGVsdGFYXG5cbiAgICAgICAgICAgICAgIGlmICggZGVsdGEgPT0gMCApXG4gICAgICAgICAgICAgICAgICAgIGRlbHRhID0gZXZlbnQuZGVsdGFZXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgZWxlbWVudC5zdHlsZSBbcHJvcF0gPSBjbGFtcCAoIHBvc2l0aW9uICgpICsgZGVsdGEgKSArIGNvbmZpZy51bml0c1xuICAgICB9XG4gICAgIGZ1bmN0aW9uIGNsYW1wICggdmFsdWU6IG51bWJlciApXG4gICAgIHtcbiAgICAgICAgICByZXR1cm4gdmFsdWUgPCBjb25maWcubWluVmFsdWUgPyBjb25maWcubWluVmFsdWVcbiAgICAgICAgICAgICAgIDogdmFsdWUgPiBjb25maWcubWF4VmFsdWUgPyBjb25maWcubWF4VmFsdWVcbiAgICAgICAgICAgICAgIDogdmFsdWVcbiAgICAgfVxufVxuIiwiXG5cbmltcG9ydCB7IHVFdmVudCB9IGZyb20gXCIuLi8uLi9MaWIvaW5kZXguanNcIlxuXG50eXBlIFJlY29yZHMgPSBSZWNvcmQgPHN0cmluZywgKCAuLi4gYXJnczogYW55ICkgPT4gYW55PlxuXG5leHBvcnQgaW50ZXJmYWNlICRDb21tYW5kIGV4dGVuZHMgJE5vZGVcbntcbiAgICAgY29udGV4dDogXCJjb25jZXB0LWFwcGxpY2F0aW9uXCJcbiAgICAgdHlwZTogXCJjb21tYW5kXCJcbiAgICAgbmFtZTogc3RyaW5nXG4gICAgIHNob3J0Y3V0OiBzdHJpbmdcbn1cblxuZXhwb3J0IGNsYXNzIENvbW1hbmRzIDxcbiAgICAgQ21kcyAgIGV4dGVuZHMgUmVjb3JkcyxcbiAgICAgQ05hbWVzIGV4dGVuZHMga2V5b2YgQ21kc1xuPlxue1xuICAgICBzdGF0aWMgZ2V0IGN1cnJlbnQgKCkgeyByZXR1cm4gY3VycmVudCB9XG5cbiAgICAgcmVhZG9ubHkgZGIgPSB7fSBhcyBDbWRzXG4gICAgIHJlYWRvbmx5IGV2ZW50cyA9IHt9IGFzIFJlY29yZCA8Q05hbWVzLCB1RXZlbnQuSUV2ZW50PlxuXG4gICAgIGNvbnN0cnVjdG9yICgpIHt9XG5cbiAgICAgYWRkIDxLIGV4dGVuZHMgQ05hbWVzPiAoIG5hbWU6IEssIGNhbGxiYWNrOiBDbWRzIFtLXSApXG4gICAgIHtcbiAgICAgICAgICBpZiAoIG5hbWUgaW4gdGhpcy5kYiApXG4gICAgICAgICAgICAgICByZXR1cm5cblxuICAgICAgICAgICAgICAgdGhpcy5kYiBbbmFtZV0gPSBjYWxsYmFja1xuICAgICB9XG5cbiAgICAgaGFzICgga2V5OiBzdHJpbmcgKVxuICAgICB7XG4gICAgICAgICAgcmV0dXJuIGtleSBpbiB0aGlzLmRiXG4gICAgIH1cblxuICAgICBydW4gPEsgZXh0ZW5kcyBDTmFtZXM+ICggbmFtZTogSywgLi4uIGFyZ3M6IFBhcmFtZXRlcnMgPENtZHMgW0tdPiApXG4gICAgIHtcbiAgICAgICAgICBpZiAoIG5hbWUgaW4gdGhpcy5kYiApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgdGhpcy5kYiBbbmFtZV0gKCAuLi4gYXJncyBhcyBhbnkgKVxuXG4gICAgICAgICAgICAgICBpZiAoIG5hbWUgaW4gdGhpcy5ldmVudHMgKVxuICAgICAgICAgICAgICAgICAgICB0aGlzLmV2ZW50cyBbbmFtZV0uZGlzcGF0Y2ggKClcbiAgICAgICAgICB9XG4gICAgIH1cblxuICAgICBvbiAoIG5hbWU6IENOYW1lcywgY2FsbGJhY2s6ICgpID0+IHZvaWQgKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgY2FsbGJhY2tzID0gbmFtZSBpbiB0aGlzLmV2ZW50c1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPyB0aGlzLmV2ZW50cyBbbmFtZV1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogdGhpcy5ldmVudHMgW25hbWVdID0gdUV2ZW50LmNyZWF0ZSAoKVxuXG4gICAgICAgICAgY2FsbGJhY2tzICggY2FsbGJhY2sgKVxuICAgICB9XG5cbiAgICAgcmVtb3ZlICgga2V5OiBzdHJpbmcgKVxuICAgICB7XG4gICAgICAgICAgZGVsZXRlIHRoaXMuZGIgW2tleV1cbiAgICAgfVxufVxuXG5jb25zdCBjdXJyZW50ID0gbmV3IENvbW1hbmRzICgpXG4iLCJcbmltcG9ydCB7IGNyZWF0ZU5vZGUgfSBmcm9tIFwiLi4vLi4vLi4vRGF0YS9pbmRleC5qc1wiXG5pbXBvcnQgeyB4bm9kZSB9IGZyb20gXCIuLi94bm9kZS5qc1wiXG5cbmRlY2xhcmUgZ2xvYmFsXG57XG4gICAgIGV4cG9ydCBpbnRlcmZhY2UgJENvbXBvbmVudCA8QyBleHRlbmRzICROb2RlID0gJE5vZGU+IGV4dGVuZHMgJENsdXN0ZXIgPEM+XG4gICAgIHtcbiAgICAgICAgICByZWFkb25seSBjb250ZXh0OiBcImNvbmNlcHQtdWlcIlxuICAgICAgICAgIHR5cGU6IHN0cmluZ1xuICAgICAgICAgIGNoaWxkcmVuPzogQyBbXSAvLyBSZWNvcmQgPHN0cmluZywgJENoaWxkPlxuICAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBDb21wb25lbnQgPCQgZXh0ZW5kcyAkQ29tcG9uZW50ID0gJENvbXBvbmVudD5cbntcbiAgICAgZGF0YTogJFxuXG4gICAgIGNvbnRhaW5lcjogSFRNTEVsZW1lbnQgfCBTVkdFbGVtZW50XG5cbiAgICAgZGVmYXVsdERhdGEgKCkgOiAkQ29tcG9uZW50XG4gICAgIHtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgY29udGV4dDogXCJjb25jZXB0LXVpXCIsXG4gICAgICAgICAgICAgICB0eXBlICAgOiBcImNvbXBvbmVudFwiLFxuICAgICAgICAgICAgICAgaWQgICAgIDogdW5kZWZpbmVkLFxuICAgICAgICAgIH1cbiAgICAgfVxuXG4gICAgIGNvbnN0cnVjdG9yICggZGF0YTogJCApXG4gICAgIHtcbiAgICAgICAgICB0aGlzLmRhdGEgPSBPYmplY3QuYXNzaWduIChcbiAgICAgICAgICAgICAgIHRoaXMuZGVmYXVsdERhdGEgKCksXG4gICAgICAgICAgICAgICBjcmVhdGVOb2RlICggZGF0YS50eXBlLCBkYXRhLmlkLCBkYXRhICkgYXMgYW55XG4gICAgICAgICAgKVxuICAgICB9XG5cbiAgICAgZ2V0SHRtbCAoKTogKEhUTUxFbGVtZW50IHwgU1ZHRWxlbWVudCkgW11cbiAgICAge1xuICAgICAgICAgIGlmICggdGhpcy5jb250YWluZXIgPT0gdW5kZWZpbmVkIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICB0aGlzLmNvbnRhaW5lciA9IDxkaXYgY2xhc3M9eyB0aGlzLmRhdGEudHlwZSB9PjwvZGl2PlxuICAgICAgICAgICAgICAgdGhpcy5vbkNyZWF0ZSAoKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiBbdGhpcy5jb250YWluZXJdXG4gICAgIH1cblxuICAgICBvbkNyZWF0ZSAoKVxuICAgICB7XG5cbiAgICAgfVxuXG4gICAgIHByb3RlY3RlZCBtYWtlSHRtbCAoKVxuICAgICB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yIChcIk5vdCBpbXBsZW1lbnRlZFwiKVxuICAgICB9XG5cbiAgICAgcHJvdGVjdGVkIG1ha2VTdmcgKClcbiAgICAge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvciAoXCJOb3QgaW1wbGVtZW50ZWRcIilcbiAgICAgfVxuXG4gICAgIHByb3RlY3RlZCBtYWtlRmFicmljICgpXG4gICAgIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IgKFwiTm90IGltcGxlbWVudGVkXCIpXG4gICAgIH1cblxuICAgICBvbkNyZWF0ZUh0bWwgKClcbiAgICAge1xuXG4gICAgIH1cblxuICAgICBvbkNyZWF0ZVN2ZyAoKVxuICAgICB7XG5cbiAgICAgfVxuXG4gICAgIG9uQ3JlYXRlRmFicmljICgpXG4gICAgIHtcblxuICAgICB9XG5cbn1cblxuXG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vRGF0YS9pbmRleC50c1wiIC8+XG5cbmltcG9ydCB7IEZhY3RvcnksIERhdGFiYXNlIH0gZnJvbSBcIi4uL0RhdGEvaW5kZXguanNcIlxuaW1wb3J0IHsgQ29tcG9uZW50IH0gZnJvbSBcIi4vQmFzZS9Db21wb25lbnQvaW5kZXguanNcIlxuXG5jb25zdCBDT05URVhUID0gXCJjb25jZXB0LXVpXCJcbmNvbnN0IGRiICAgICAgPSBuZXcgRGF0YWJhc2UgPCRBbnlDb21wb25lbnRzPiAoKVxuY29uc3QgZmFjdG9yeSA9IG5ldyBGYWN0b3J5IDxDb21wb25lbnQsICRBbnlDb21wb25lbnRzPiAoIGRiIClcblxuZXhwb3J0IGNvbnN0IGluU3RvY2s6IHR5cGVvZiBmYWN0b3J5LmluU3RvY2sgPSBmdW5jdGlvbiAoKVxue1xuICAgICBjb25zdCBhcmcgPSBhcmd1bWVudHMubGVuZ3RoID09IDFcbiAgICAgICAgICAgICAgID8gbm9ybWFsaXplICggYXJndW1lbnRzIFswXSApXG4gICAgICAgICAgICAgICA6IG5vcm1hbGl6ZSAoIFsuLi4gYXJndW1lbnRzXSApXG5cbiAgICAgY29uc3QgcGF0aCA9IGZhY3RvcnkuZ2V0UGF0aCAoIGFyZyApXG5cbiAgICAgcmV0dXJuIGZhY3RvcnkuX2luU3RvY2sgKCBwYXRoIClcbn1cblxuZXhwb3J0IGNvbnN0IHBpY2s6IHR5cGVvZiBmYWN0b3J5LnBpY2sgPSBmdW5jdGlvbiAoIC4uLiByZXN0OiBhbnkgW10gKVxue1xuICAgICBjb25zdCBhcmcgPSBhcmd1bWVudHMubGVuZ3RoID09IDFcbiAgICAgICAgICAgICAgID8gbm9ybWFsaXplICggYXJndW1lbnRzIFswXSApXG4gICAgICAgICAgICAgICA6IG5vcm1hbGl6ZSAoIFsuLi4gYXJndW1lbnRzXSApXG5cbiAgICAgY29uc3QgcGF0aCA9IGZhY3RvcnkuZ2V0UGF0aCAoIGFyZyApXG5cbiAgICAgcmV0dXJuIGZhY3RvcnkuX3BpY2sgKCBwYXRoIClcbn1cblxuZXhwb3J0IGNvbnN0IG1ha2U6IHR5cGVvZiBmYWN0b3J5Lm1ha2UgPSBmdW5jdGlvbiAoKVxue1xuICAgICBjb25zdCBhcmcgPSBhcmd1bWVudHMubGVuZ3RoID09IDFcbiAgICAgICAgICAgICAgID8gbm9ybWFsaXplICggYXJndW1lbnRzIFswXSApXG4gICAgICAgICAgICAgICA6IG5vcm1hbGl6ZSAoIFsuLi4gYXJndW1lbnRzXSApXG5cbiAgICAgY29uc3QgcGF0aCA9IGZhY3RvcnkuZ2V0UGF0aCAoIGFyZyApXG5cbiAgICAgaWYgKCBpc05vZGUgKCBhcmcgKSApXG4gICAgICAgICAgdmFyIGRhdGEgPSBhcmdcblxuICAgICByZXR1cm4gZmFjdG9yeS5fbWFrZSAoIHBhdGgsIGRhdGEgKVxufVxuXG5leHBvcnQgY29uc3Qgc2V0OiB0eXBlb2YgZGIuc2V0ID0gZnVuY3Rpb24gKClcbntcbiAgICAgY29uc3QgYXJnID0gbm9ybWFsaXplICggYXJndW1lbnRzIFswXSApXG5cbiAgICAgaWYgKCBhcmd1bWVudHMubGVuZ3RoID09IDEgKVxuICAgICAgICAgIGRiLnNldCAoIGFyZyApXG4gICAgIGVsc2VcbiAgICAgICAgICBkYi5zZXQgKCBhcmcsIG5vcm1hbGl6ZSAoIGFyZ3VtZW50cyBbMV0gKSApXG59XG5cbmV4cG9ydCBjb25zdCBkZWZpbmU6IHR5cGVvZiBmYWN0b3J5LmRlZmluZSA9IGZ1bmN0aW9uICggY3RvcjogYW55LCAuLi4gcmVzdDogYW55IClcbntcbiAgICAgY29uc3QgYXJnID0gcmVzdC5sZW5ndGggPT0gMVxuICAgICAgICAgICAgICAgPyBub3JtYWxpemUgKCByZXN0IFswXSApXG4gICAgICAgICAgICAgICA6IG5vcm1hbGl6ZSAoIFsuLi4gcmVzdF0gKVxuXG4gICAgIGNvbnN0IHBhdGggPSBmYWN0b3J5LmdldFBhdGggKCBhcmcgKVxuXG4gICAgIGZhY3RvcnkuX2RlZmluZSAoIGN0b3IsIHBhdGggKVxufVxuXG5cbmZ1bmN0aW9uIGlzTm9kZSAoIG9ibDogYW55IClcbntcbiAgICAgcmV0dXJuIHR5cGVvZiBvYmwgPT0gXCJvYmplY3RcIiAmJiAhIEFycmF5LmlzQXJyYXkgKG9ibClcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplICggYXJnOiBhbnkgKVxue1xuICAgICBpZiAoIEFycmF5LmlzQXJyYXkgKGFyZykgKVxuICAgICB7XG4gICAgICAgICAgaWYgKCBhcmcgWzBdICE9PSBDT05URVhUIClcbiAgICAgICAgICAgICAgIGFyZy51bnNoaWZ0ICggQ09OVEVYVCApXG4gICAgIH1cbiAgICAgZWxzZSBpZiAoIHR5cGVvZiBhcmcgPT0gXCJvYmplY3RcIiApXG4gICAgIHtcbiAgICAgICAgICBpZiAoIFwiY29udGV4dFwiIGluIGFyZyApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgaWYgKCBhcmcuY29udGV4dCAhPT0gQ09OVEVYVCApXG4gICAgICAgICAgICAgICAgICAgIHRocm93IFwiQmFkIGNvbnRleHQgdmFsdWVcIlxuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgKGFyZyBhcyBhbnkpLmNvbnRleHQgPSBDT05URVhUXG4gICAgICAgICAgfVxuICAgICB9XG5cbiAgICAgcmV0dXJuIGFyZ1xufVxuIiwiaW1wb3J0IHsgQ29tcG9uZW50IH0gZnJvbSBcIi4uLy4uL0Jhc2UvQ29tcG9uZW50L2luZGV4LmpzXCJcblxuZGVjbGFyZSBnbG9iYWxcbntcbiAgICAgZXhwb3J0IGludGVyZmFjZSAkUGhhbnRvbSBleHRlbmRzICRDb21wb25lbnRcbiAgICAge1xuICAgICAgICAgIHR5cGU6IFwicGhhbnRvbVwiXG4gICAgICAgICAgY29udGVudDogc3RyaW5nXG4gICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFBoYW50b20gZXh0ZW5kcyBDb21wb25lbnQgPCRQaGFudG9tPlxue1xuICAgICBjb250YWluZXI6IEhUTUxFbGVtZW50IHwgU1ZHRWxlbWVudFxuXG4gICAgIGdldEh0bWwgKClcbiAgICAge1xuICAgICAgICAgIGlmICggdGhpcy5jb250YWluZXIgPT0gdW5kZWZpbmVkIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICB0aGlzLmNvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgKCBcImRpdlwiIClcbiAgICAgICAgICAgICAgIHRoaXMuY29udGFpbmVyLmlubmVySFRNTCA9IHRoaXMuZGF0YS5jb250ZW50XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIHRoaXMuY29udGFpbmVyLmNoaWxkTm9kZXMgYXMgYW55IGFzIEhUTUxFbGVtZW50IFtdXG4gICAgIH1cbn1cblxuXG4iLCJcbmltcG9ydCB7IHBpY2ssIGluU3RvY2ssIG1ha2UgfSBmcm9tIFwiLi4vLi4vZGIuanNcIlxuaW1wb3J0IHsgQ29tcG9uZW50IH0gZnJvbSBcIi4uL0NvbXBvbmVudC9pbmRleC5qc1wiXG5pbXBvcnQgeyBQaGFudG9tIH0gZnJvbSBcIi4uLy4uL0NvbXBvbmVudC9QaGFudG9tL2luZGV4LmpzXCJcbmltcG9ydCB7IHhub2RlIH0gZnJvbSBcIi4uL3hub2RlLmpzXCJcblxudHlwZSBEaXJlY3Rpb24gPSBcImxyXCIgfCBcInJsXCIgfCBcInRiXCIgfCBcImJ0XCJcblxuZGVjbGFyZSBnbG9iYWxcbntcbiAgICAgZXhwb3J0IGludGVyZmFjZSAkQ29udGFpbmVyIDxDIGV4dGVuZHMgJENvbXBvbmVudCA9ICRBbnlDb21wb25lbnRzPiBleHRlbmRzICRDb21wb25lbnQgLy9EYXRhLiRDbHVzdGVyIDxDPlxuICAgICB7XG4gICAgICAgICAgZGlyZWN0aW9uPzogRGlyZWN0aW9uXG4gICAgICAgICAgY2hpbGRyZW4/OiBDIFtdIC8vIFJlY29yZCA8c3RyaW5nLCAgQz5cbiAgICAgfVxufVxuXG5leHBvcnQgY2xhc3MgQ29udGFpbmVyIDwkIGV4dGVuZHMgJENvbnRhaW5lciA9ICRDb250YWluZXI+IGV4dGVuZHMgQ29tcG9uZW50IDwkPlxue1xuICAgICBjaGlsZHJlbiA9IHt9IGFzIFJlY29yZCA8c3RyaW5nLCBDb21wb25lbnQ+XG4gICAgIHNsb3Q6IEpTWC5FbGVtZW50XG5cbiAgICAgcmVhZG9ubHkgaXNfdmVydGljYWw6IGJvb2xlYW5cblxuICAgICBkZWZhdWx0RGF0YSAoKSA6ICRDb250YWluZXJcbiAgICAge1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICBjb250ZXh0OiBcImNvbmNlcHQtdWlcIixcbiAgICAgICAgICAgICAgIHR5cGUgICAgIDogXCJjb21wb25lbnRcIixcbiAgICAgICAgICAgICAgIGlkICAgICAgIDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgZGlyZWN0aW9uOiBcImxyXCIsXG4gICAgICAgICAgfVxuICAgICB9XG5cbiAgICAgY29uc3RydWN0b3IgKCBkYXRhOiAkIClcbiAgICAge1xuICAgICAgICAgIHN1cGVyICggZGF0YSApXG5cbiAgICAgICAgICBkYXRhID0gdGhpcy5kYXRhXG4gICAgICAgICAgY29uc3QgY2hpbGRyZW4gPSBkYXRhLmNoaWxkcmVuXG5cbiAgICAgICAgICBpZiAoIGNoaWxkcmVuIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBmb3IgKCBjb25zdCBjaGlsZCBvZiBjaGlsZHJlbiApXG4gICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGlmICggISBpblN0b2NrICggY2hpbGQgKSApXG4gICAgICAgICAgICAgICAgICAgICAgICAgbWFrZSAoIGNoaWxkIClcbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICB0aGlzLmlzX3ZlcnRpY2FsID0gZGF0YS5kaXJlY3Rpb24gPT0gXCJidFwiIHx8IGRhdGEuZGlyZWN0aW9uID09IFwidGJcIlxuICAgICB9XG5cbiAgICAgZ2V0SHRtbCAoKVxuICAgICB7XG4gICAgICAgICAgaWYgKCB0aGlzLmNvbnRhaW5lciAhPSB1bmRlZmluZWQgKVxuICAgICAgICAgICAgICAgcmV0dXJuIFt0aGlzLmNvbnRhaW5lcl1cblxuICAgICAgICAgIGNvbnN0IGVsZW1lbnRzICA9IHN1cGVyLmdldEh0bWwgKClcbiAgICAgICAgICBjb25zdCBjb250YWluZXIgPSB0aGlzLmNvbnRhaW5lclxuICAgICAgICAgIGNvbnN0IGRhdGEgICAgICA9IHRoaXMuZGF0YVxuICAgICAgICAgIGNvbnN0IGNoaWxkcmVuICA9IHRoaXMuY2hpbGRyZW5cbiAgICAgICAgICBjb25zdCB1bmQgPSB1bmRlZmluZWRcblxuICAgICAgICAgIGlmICggdGhpcy5pc192ZXJ0aWNhbCApXG4gICAgICAgICAgICAgICBjb250YWluZXIuY2xhc3NMaXN0LmFkZCAoIFwidmVydGljYWxcIiApXG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgY29udGFpbmVyLmNsYXNzTGlzdC5yZW1vdmUgKCBcInZlcnRpY2FsXCIgKVxuXG4gICAgICAgICAgaWYgKCB0aGlzLnNsb3QgPT0gdW5kZWZpbmVkIClcbiAgICAgICAgICAgICAgIHRoaXMuc2xvdCA9IGNvbnRhaW5lclxuXG4gICAgICAgICAgY29uc3Qgc2xvdCA9IHRoaXMuc2xvdFxuXG4gICAgICAgICAgaWYgKCBkYXRhLmNoaWxkcmVuIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBjb25zdCBuZXdfY2hpbGRyZW4gPSBbXSBhcyBDb21wb25lbnQgW11cblxuICAgICAgICAgICAgICAgZm9yICggY29uc3QgY2hpbGQgb2YgZGF0YS5jaGlsZHJlbiApXG4gICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG8gPSBwaWNrICggY2hpbGQgKVxuICAgICAgICAgICAgICAgICAgICBzbG90LmFwcGVuZCAoIC4uLiBvLmdldEh0bWwgKCkgKVxuICAgICAgICAgICAgICAgICAgICBjaGlsZHJlbiBbby5kYXRhLmlkXSA9IG9cbiAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgdGhpcy5vbkNoaWxkcmVuQWRkZWQgKCBuZXdfY2hpbGRyZW4gKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiBlbGVtZW50c1xuICAgICB9XG5cbiAgICAgb25DaGlsZHJlbkFkZGVkICggY29tcG9uZW50czogQ29tcG9uZW50IFtdIClcbiAgICAge1xuXG4gICAgIH1cblxuICAgICBhcHBlbmQgKCAuLi4gZWxlbWVudHM6IChzdHJpbmcgfCBFbGVtZW50IHwgQ29tcG9uZW50IHwgJEFueUNvbXBvbmVudHMpIFtdIClcbiAgICAge1xuXG4gICAgICAgICAgaWYgKCB0aGlzLmNvbnRhaW5lciA9PSB1bmRlZmluZWQgKVxuICAgICAgICAgICAgICAgdGhpcy5nZXRIdG1sICgpXG5cbiAgICAgICAgICBjb25zdCBzbG90ICAgICAgPSB0aGlzLnNsb3RcbiAgICAgICAgICBjb25zdCBjaGlsZHJlbiAgPSB0aGlzLmNoaWxkcmVuXG4gICAgICAgICAgY29uc3QgbmV3X2NoaWxkID0gW10gYXMgQ29tcG9uZW50IFtdXG5cbiAgICAgICAgICBmb3IgKCB2YXIgZSBvZiBlbGVtZW50cyApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgaWYgKCB0eXBlb2YgZSA9PSBcInN0cmluZ1wiIClcbiAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgZSA9IG5ldyBQaGFudG9tICh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgY29udGV4dDogXCJjb25jZXB0LXVpXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgdHlwZSAgIDogXCJwaGFudG9tXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgaWQgIDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnQ6IGVcbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgIGVsc2UgaWYgKCBlIGluc3RhbmNlb2YgRWxlbWVudCApXG4gICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IFVJX0NPTVBPTkVOVCA9IFN5bWJvbC5mb3IgKCBcIlVJX0NPTVBPTkVOVFwiIClcblxuICAgICAgICAgICAgICAgICAgICBlID0gZSBbVUlfQ09NUE9ORU5UXSAhPSB1bmRlZmluZWRcbiAgICAgICAgICAgICAgICAgICAgICAgICA/IGUgW1VJX0NPTVBPTkVOVF1cbiAgICAgICAgICAgICAgICAgICAgICAgICA6IG5ldyBQaGFudG9tICh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250ZXh0OiBcImNvbmNlcHQtdWlcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGUgICA6IFwicGhhbnRvbVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWQgIDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudDogZS5vdXRlckhUTUxcbiAgICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgZWxzZSBpZiAoICEoZSBpbnN0YW5jZW9mIENvbXBvbmVudCkgKVxuICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBlID0gaW5TdG9jayAoIGUgKVxuICAgICAgICAgICAgICAgICAgICAgID8gcGljayAoIGUgKVxuICAgICAgICAgICAgICAgICAgICAgIDogbWFrZSAoIGUgKVxuICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICBjaGlsZHJlbiBbKGUgYXMgQ29tcG9uZW50KS5kYXRhLmlkXSA9IGUgYXMgQ29tcG9uZW50XG4gICAgICAgICAgICAgICBzbG90LmFwcGVuZCAoIC4uLiAoZSBhcyBDb21wb25lbnQpLmdldEh0bWwgKCkgKVxuICAgICAgICAgICAgICAgbmV3X2NoaWxkLnB1c2ggKCBlIGFzIENvbXBvbmVudCApXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKCBuZXdfY2hpbGQubGVuZ3RoID4gMCApXG4gICAgICAgICAgICAgICB0aGlzLm9uQ2hpbGRyZW5BZGRlZCAoIG5ld19jaGlsZCApXG4gICAgIH1cblxuICAgICByZW1vdmUgKCAuLi4gZWxlbWVudHM6IChzdHJpbmcgfCBFbGVtZW50IHwgQ29tcG9uZW50IHwgJENvbXBvbmVudCkgW10gKVxuICAgICB7XG5cbiAgICAgfVxuXG4gICAgIGNsZWFyICgpXG4gICAgIHtcbiAgICAgICAgICB0aGlzLmNoaWxkcmVuID0ge31cblxuICAgICAgICAgIGlmICggdGhpcy5jb250YWluZXIgKVxuICAgICAgICAgICAgICAgdGhpcy5jb250YWluZXIuaW5uZXJIVE1MID0gXCJcIlxuICAgICB9XG5cbiAgICAgZ2V0T3JpZW50YXRpb24gKClcbiAgICAge1xuICAgICAgICAgIHJldHVybiB0aGlzLmRhdGEuZGlyZWN0aW9uXG4gICAgIH1cblxuICAgICBzZXRPcmllbnRhdGlvbiAoIHZhbHVlOiBEaXJlY3Rpb24gKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgY29uZmlnID0gdGhpcy5kYXRhXG5cbiAgICAgICAgICBpZiAoIHZhbHVlID09IGNvbmZpZy5kaXJlY3Rpb24gKVxuICAgICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgICBjb25zdCBjb250YWluZXIgPSB0aGlzLmNvbnRhaW5lclxuXG4gICAgICAgICAgaWYgKCB0aGlzLmlzX3ZlcnRpY2FsIClcbiAgICAgICAgICAgICAgIGNvbnRhaW5lci5jbGFzc0xpc3QuYWRkICggXCJ2ZXJ0aWNhbFwiIClcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICBjb250YWluZXIuY2xhc3NMaXN0LnJlbW92ZSAoIFwidmVydGljYWxcIiApXG5cbiAgICAgICAgICBjb25maWcuZGlyZWN0aW9uID0gdmFsdWVcbiAgICAgICAgICA7KHRoaXMuaXNfdmVydGljYWwgYXMgYm9vbGVhbikgPSB2YWx1ZSA9PSBcImJ0XCIgfHwgdmFsdWUgPT0gXCJ0YlwiXG4gICAgIH1cbn1cblxuIiwiaW1wb3J0IHsgQ29tcG9uZW50IH0gZnJvbSBcIi4uLy4uL0Jhc2UvQ29tcG9uZW50L2luZGV4LmpzXCJcbmltcG9ydCB7IHhub2RlIH0gZnJvbSBcIi4uLy4uL0Jhc2UveG5vZGUuanNcIlxuaW1wb3J0IHsgZGVmaW5lIH0gZnJvbSBcIi4uLy4uL2RiLmpzXCJcblxuZGVjbGFyZSBnbG9iYWxcbntcbiAgICAgZXhwb3J0IGludGVyZmFjZSAkQmxvY2sgZXh0ZW5kcyAkQ29tcG9uZW50XG4gICAgIHtcbiAgICAgICAgICB0eXBlOiBcImJsb2NrXCJcbiAgICAgICAgICBvcmllbnRhdGlvbjogT3JpZW50YXRpb25cbiAgICAgICAgICBlbGVtZW50czogQ29tcG9uZW50IFtdXG4gICAgIH1cbn1cblxudHlwZSBPcmllbnRhdGlvbiA9IFwidmVydGljYWxcIiB8IFwiaG9yaXpvbnRhbFwiXG5cbmV4cG9ydCBjbGFzcyBCbG9jayBleHRlbmRzIENvbXBvbmVudCA8JEJsb2NrPlxue1xuICAgICBjb250YWluZXIgPSA8ZGl2IGNsYXNzPVwiYmFyXCI+PC9kaXY+XG5cbiAgICAgZ2V0IG9yaWVudGF0aW9uICgpXG4gICAgIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5jb250YWluZXIuY2xhc3NMaXN0LmNvbnRhaW5zICggXCJ2ZXJ0aWNhbFwiIClcbiAgICAgICAgICAgICAgID8gXCJob3Jpem9udGFsXCJcbiAgICAgICAgICAgICAgIDogXCJ2ZXJ0aWNhbFwiXG4gICAgIH1cblxuICAgICBzZXQgb3JpZW50YXRpb24gKCBvcmllbnRhdGlvbjogT3JpZW50YXRpb24gKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgY2xhc3NMaXN0ID0gdGhpcy5jb250YWluZXIuY2xhc3NMaXN0XG5cbiAgICAgICAgICB2YXIgbmV3X29yaWVudGF0aW9uID0gY2xhc3NMaXN0LmNvbnRhaW5zICggXCJ2ZXJ0aWNhbFwiIClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gXCJob3Jpem9udGFsXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogXCJ2ZXJ0aWNhbFwiXG5cbiAgICAgICAgICBpZiAoIG9yaWVudGF0aW9uID09IG5ld19vcmllbnRhdGlvbiApXG4gICAgICAgICAgICAgICByZXR1cm5cblxuICAgICAgICAgIGNsYXNzTGlzdC5yZXBsYWNlICAoIG9yaWVudGF0aW9uLCBuZXdfb3JpZW50YXRpb24gKVxuICAgICB9XG59XG5cblxuZGVmaW5lICggQmxvY2ssIFtcImJsb2NrXCJdIClcbiIsIlxuaW1wb3J0IHsgQ29tcG9uZW50IH0gZnJvbSBcIi4uLy4uL0Jhc2UvQ29tcG9uZW50L2luZGV4LmpzXCJcbmltcG9ydCB7IHhub2RlIH0gICAgIGZyb20gXCIuLi8uLi9CYXNlL3hub2RlLmpzXCJcbmltcG9ydCB7IENvbW1hbmRzIH0gIGZyb20gXCIuLi8uLi9CYXNlL2NvbW1hbmQuanNcIlxuaW1wb3J0IHsgZGVmaW5lIH0gICAgZnJvbSBcIi4uLy4uL2RiLmpzXCJcblxuZXhwb3J0IGNsYXNzIEJ1dHRvbiBleHRlbmRzIENvbXBvbmVudCA8JEJ1dHRvbj5cbntcbiAgICAgZ2V0SHRtbCAoKVxuICAgICB7XG4gICAgICAgICAgaWYgKCB0aGlzLmNvbnRhaW5lciA9PSB1bmRlZmluZWQgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNvbnN0IGRhdGEgPSB0aGlzLmRhdGFcblxuICAgICAgICAgICAgICAgY29uc3Qgbm9kZSA9IDxkaXYgY2xhc3M9XCJidXR0b25cIj5cbiAgICAgICAgICAgICAgICAgICAgeyBkYXRhLmljb24gPyA8c3BhbiBjbGFzcz1cImljb25cIj57IGRhdGEuaWNvbiB9PC9zcGFuPiA6IG51bGwgfVxuICAgICAgICAgICAgICAgICAgICB7IGRhdGEudGV4dCA/IDxzcGFuIGNsYXNzPVwidGV4dFwiPnsgZGF0YS50ZXh0IH08L3NwYW4+IDogbnVsbCB9XG4gICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgaWYgKCB0aGlzLmRhdGEuY2FsbGJhY2sgIT0gdW5kZWZpbmVkIHx8IHRoaXMuZGF0YS5jb21tYW5kICE9IHVuZGVmaW5lZCApXG4gICAgICAgICAgICAgICAgICAgIG5vZGUuYWRkRXZlbnRMaXN0ZW5lciAoIFwiY2xpY2tcIiwgdGhpcy5vblRvdWNoLmJpbmQgKHRoaXMpIClcblxuICAgICAgICAgICAgICAgdGhpcy5jb250YWluZXIgPSBub2RlXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIFsgdGhpcy5jb250YWluZXIgXSBhcyBIVE1MRWxlbWVudCBbXVxuICAgICB9XG5cbiAgICAgb25Ub3VjaCAoKVxuICAgICB7XG4gICAgICAgICAgaWYgKCB0aGlzLmRhdGEuY2FsbGJhY2sgJiYgdGhpcy5kYXRhLmNhbGxiYWNrICgpICE9PSB0cnVlIClcbiAgICAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgICAgaWYgKCB0aGlzLmRhdGEuY29tbWFuZCApXG4gICAgICAgICAgICAgICBDb21tYW5kcy5jdXJyZW50LnJ1biAoIHRoaXMuZGF0YS5jb21tYW5kIClcbiAgICAgfVxuXG4gICAgIHByb3RlY3RlZCBvbkhvdmVyICgpXG4gICAgIHtcblxuICAgICB9XG59XG5cblxuZGVmaW5lICggQnV0dG9uLCBbXCJidXR0b25cIl0gKVxuIiwiXG5cbmltcG9ydCB7IHNldCB9ICAgICAgZnJvbSBcIi4uLy4uL2RiLmpzXCJcbmltcG9ydCB7IENvbW1hbmRzIH0gZnJvbSBcIi4uLy4uL0Jhc2UvY29tbWFuZC5qc1wiXG5pbXBvcnQgeyB4bm9kZSB9ICAgIGZyb20gXCIuLi8uLi9CYXNlL3hub2RlLmpzXCJcblxuZGVjbGFyZSBnbG9iYWxcbntcbiAgICAgZXhwb3J0IGludGVyZmFjZSAkQnV0dG9uIGV4dGVuZHMgJENvbXBvbmVudFxuICAgICB7XG4gICAgICAgICAgdHlwZSAgICAgICA6IFwiYnV0dG9uXCJcbiAgICAgICAgICBpY29uICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgdGV4dD8gICAgICA6IHN0cmluZ1xuICAgICAgICAgIHRvb2x0aXA/ICAgOiBKU1guRWxlbWVudFxuICAgICAgICAgIGZvbnRGYW1pbHk/OiBzdHJpbmcsXG4gICAgICAgICAgY2FsbGJhY2s/ICA6ICgpID0+IGJvb2xlYW4gfCB2b2lkLFxuICAgICAgICAgIGNvbW1hbmQ/ICAgOiBzdHJpbmcsXG4gICAgICAgICAgaGFuZGxlT24/ICA6IFwidG9nZ2xlXCIgfCBcImRyYWdcIiB8IFwiKlwiXG4gICAgIH1cbn1cblxuY29uc3QgX0J1dHRvbiA9ICggZGF0YTogJEJ1dHRvbiApID0+XG57XG4gICAgIGNvbnN0IG9uVG91Y2ggPSAoKSA9PlxuICAgICB7XG4gICAgICAgICAgaWYgKCBkYXRhLmNhbGxiYWNrICYmIGRhdGEuY2FsbGJhY2sgKCkgIT09IHRydWUgKVxuICAgICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgICBpZiAoIGRhdGEuY29tbWFuZCApXG4gICAgICAgICAgICAgICBDb21tYW5kcy5jdXJyZW50LnJ1biAoIGRhdGEuY29tbWFuZCApXG4gICAgIH1cblxuICAgICBjb25zdCBub2RlID1cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwiYnV0dG9uXCIgb25DbGljaz17IGRhdGEuY2FsbGJhY2sgfHwgZGF0YS5jb21tYW5kID8gb25Ub3VjaCA6IG51bGwgfT5cbiAgICAgICAgICAgICAgIHsgZGF0YS5pY29uID8gPHNwYW4gY2xhc3M9XCJpY29uXCI+eyBkYXRhLmljb24gfTwvc3Bhbj4gOiBudWxsIH1cbiAgICAgICAgICAgICAgIHsgZGF0YS50ZXh0ID8gPHNwYW4gY2xhc3M9XCJ0ZXh0XCI+eyBkYXRhLnRleHQgfTwvc3Bhbj4gOiBudWxsIH1cbiAgICAgICAgICA8L2Rpdj5cblxuICAgICByZXR1cm4gbm9kZVxufVxuXG5cbmV4cG9ydCB7IEJ1dHRvbiB9IGZyb20gXCIuL2h0bWwuanNcIlxuXG5leHBvcnQgY29uc3QgJGRlZmF1bHQgPSB7XG4gICAgIHR5cGU6IFwiYnV0dG9uXCIgYXMgXCJidXR0b25cIixcbiAgICAgaWQgIDogdW5kZWZpbmVkLFxuICAgICBpY29uOiB1bmRlZmluZWQsXG59XG5cbnNldCA8JEJ1dHRvbj4gKCBbIFwiYnV0dG9uXCIgXSwgJGRlZmF1bHQgKVxuIiwiaW1wb3J0IHsgQ29tcG9uZW50IH0gZnJvbSBcIi4uLy4uL0Jhc2UvQ29tcG9uZW50L2luZGV4LmpzXCJcbmltcG9ydCB7IENvbnRhaW5lciB9IGZyb20gXCIuLi8uLi9CYXNlL0NvbnRhaW5lci9pbmRleC5qc1wiXG5pbXBvcnQgeyBzd2lwZWFibGUsIFN3aXBlYWJsZUVsZW1lbnQgfSBmcm9tIFwiLi4vLi4vQmFzZS9zd2lwZWFibGUuanNcIlxuaW1wb3J0IHsgZGVmaW5lIH0gZnJvbSBcIi4uLy4uL2RiLmpzXCJcblxuZGVjbGFyZSBnbG9iYWxcbntcbiAgICAgZXhwb3J0IGludGVyZmFjZSAkU2xpZGVzaG93IGV4dGVuZHMgJENvbnRhaW5lclxuICAgICB7XG4gICAgICAgICAgdHlwZSAgICAgICAgOiBcInNsaWRlc2hvd1wiXG4gICAgICAgICAgY2hpbGRyZW4gICAgOiAkQW55Q29tcG9uZW50cyBbXVxuICAgICAgICAgIGlzU3dpcGVhYmxlPzogYm9vbGVhblxuICAgICB9XG5cbiAgICAgZXhwb3J0IGludGVyZmFjZSAkU2xpZGUgZXh0ZW5kcyAkQ29udGFpbmVyXG4gICAgIHtcbiAgICAgICAgICB0eXBlOiBcInNsaWRlXCJcbiAgICAgfVxufVxuXG4vLyAgIGBgYFxuLy8gICAuc2xpZGVzaG93XG4vLyAgICAgICAgWy4uLl1cbi8vICAgYGBgXG5leHBvcnQgY2xhc3MgU2xpZGVzaG93IGV4dGVuZHMgQ29udGFpbmVyIDwkU2xpZGVzaG93Plxue1xuICAgICBjaGlsZHJlbiA9IHt9IGFzIFJlY29yZCA8c3RyaW5nLCBDb250YWluZXI+XG4gICAgIGN1cnJlbnQ6IENvbXBvbmVudFxuICAgICBwcml2YXRlIHN3aXBlYWJsZTogU3dpcGVhYmxlRWxlbWVudFxuXG4gICAgIGdldEh0bWwgKClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IGVsZW1lbnRzID0gc3VwZXIuZ2V0SHRtbCAoKVxuXG4gICAgICAgICAgY29uc3QgZGF0YSA9IHRoaXMuZGF0YVxuICAgICAgICAgIGNvbnN0IGNvbnRhaW5lciA9IHRoaXMuY29udGFpbmVyXG5cbiAgICAgICAgICBpZiAoIGRhdGEuaXNTd2lwZWFibGUgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHRoaXMuc3dpcGVhYmxlID0gc3dpcGVhYmxlICggY29udGFpbmVyLCB7XG4gICAgICAgICAgICAgICAgICAgIGhhbmRsZXMgICA6IFsgY29udGFpbmVyIF0sXG4gICAgICAgICAgICAgICAgICAgIG1pblZhbHVlICA6IC0wLFxuICAgICAgICAgICAgICAgICAgICBtYXhWYWx1ZSAgOiAwLFxuICAgICAgICAgICAgICAgICAgICBwb3JwZXJ0eSAgOiBkYXRhLmRpcmVjdGlvbiA9PSBcImJ0XCIgfHwgZGF0YS5kaXJlY3Rpb24gPT0gXCJ0YlwiID8gXCJ0b3BcIjogXCJsZWZ0XCIsXG4gICAgICAgICAgICAgICAgICAgIHVuaXRzICAgICA6IFwicHhcIixcbiAgICAgICAgICAgICAgICAgICAgbW91c2VXaGVlbDogdHJ1ZSxcbiAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICB0aGlzLnN3aXBlYWJsZS5hY3RpdmF0ZSAoKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiBlbGVtZW50c1xuICAgICB9XG5cbiAgICAgc2hvdyAoIGlkOiBzdHJpbmcsIC4uLiBjb250ZW50OiAoc3RyaW5nIHwgRWxlbWVudCB8IENvbXBvbmVudCB8ICRBbnlDb21wb25lbnRzICkgW10gKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgY2hpbGQgPSB0aGlzLmNoaWxkcmVuIFtpZF1cblxuICAgICAgICAgIGlmICggY2hpbGQgPT0gdW5kZWZpbmVkIClcbiAgICAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgICAgaWYgKCB0aGlzLmN1cnJlbnQgKVxuICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50ID0gY2hpbGRcblxuICAgICAgICAgIGlmICggY29udGVudCApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgY2hpbGQuY2xlYXIgKClcbiAgICAgICAgICAgICAgIGNvbnNvbGUubG9nICggY29udGVudCApXG4gICAgICAgICAgICAgICBjaGlsZC5hcHBlbmQgKCAuLi4gY29udGVudCApXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY2hpbGQuY29udGFpbmVyLnN0eWxlLmRpc3BsYXkgPSBcImJsb2NrXCJcbiAgICAgfVxufVxuXG5kZWZpbmUgKCBTbGlkZXNob3csIFtcInNsaWRlc2hvd1wiXSApXG5kZWZpbmUgKCBDb250YWluZXIsIFtcInNsaWRlXCJdICAgICApXG4iLCJcbmltcG9ydCB7IHhub2RlIH0gZnJvbSBcIi4uLy4uL0Jhc2UveG5vZGUuanNcIlxuaW1wb3J0IHsgVW5pdCB9IGZyb20gXCIuLi8uLi8uLi9MaWIvY3NzL3VuaXQuanNcIlxuaW1wb3J0IHsgQ29udGFpbmVyIH0gZnJvbSBcIi4uLy4uL0Jhc2UvQ29udGFpbmVyL2luZGV4LmpzXCJcbmltcG9ydCB7IFN3aXBlYWJsZUVsZW1lbnQsIHN3aXBlYWJsZSB9IGZyb20gXCIuLi8uLi9CYXNlL3N3aXBlYWJsZS5qc1wiXG5pbXBvcnQgeyBFeHBlbmRhYmxlRWxlbWVudCwgZXhwYW5kYWJsZSB9IGZyb20gXCIuLi8uLi9CYXNlL2V4cGVuZGFibGUuanNcIlxuaW1wb3J0IHsgY3NzRmxvYXQgfSBmcm9tIFwiLi4vLi4vQmFzZS9kb20uanNcIlxuaW1wb3J0IHsgQ29tcG9uZW50IH0gZnJvbSBcIi4uLy4uL0Jhc2UvQ29tcG9uZW50L2luZGV4LmpzXCJcblxuZGVjbGFyZSBnbG9iYWxcbntcbiAgICAgaW50ZXJmYWNlICRMaXN0VmlldyBleHRlbmRzICRDb250YWluZXJcbiAgICAge1xuICAgICAgICAgIHR5cGU6IFwibGlzdC12aWV3XCJcbiAgICAgfVxufVxuXG5leHBvcnQgY2xhc3MgTGlzdFZpZXcgPCQgZXh0ZW5kcyAkRXh0ZW5kcyA8JExpc3RWaWV3Pj4gZXh0ZW5kcyBDb250YWluZXIgPCQ+XG57XG4gICAgIHN3aXBlYWJsZTogRXhwZW5kYWJsZUVsZW1lbnRcblxuICAgICBnZXRIdG1sICgpXG4gICAgIHtcbiAgICAgICAgICBpZiAoIHRoaXMuY29udGFpbmVyICE9IHVuZGVmaW5lZCApXG4gICAgICAgICAgICAgICByZXR1cm4gW3RoaXMuY29udGFpbmVyXVxuXG4gICAgICAgICAgY29uc3Qgc2xvdCA9IHRoaXMuc2xvdCA9IDxkaXYgY2xhc3M9XCJsaXN0LXZpZXctc2xpZGVcIj48L2Rpdj5cblxuICAgICAgICAgIHN1cGVyLmdldEh0bWwgKClcblxuICAgICAgICAgIGNvbnN0IGNvbnRhaW5lciA9IHRoaXMuY29udGFpbmVyXG5cbiAgICAgICAgICBjb250YWluZXIuYXBwZW5kICggc2xvdCApXG4gICAgICAgICAgY29udGFpbmVyLmNsYXNzTGlzdC5hZGQgKCBcImxpc3Qtdmlld1wiIClcblxuICAgICAgICAgIHRoaXMuc3dpcGVhYmxlID0gZXhwYW5kYWJsZSAoIHNsb3QsIHtcbiAgICAgICAgICAgICAgIGhhbmRsZXMgICA6IFsgY29udGFpbmVyIF0sXG4gICAgICAgICAgICAgICBtaW5TaXplICA6IDAsXG4gICAgICAgICAgICAgICBtYXhTaXplICA6IDAsXG4gICAgICAgICAgICAgICBwcm9wZXJ0eSAgOiB0aGlzLmlzX3ZlcnRpY2FsID8gXCJ0b3BcIjogXCJsZWZ0XCIsXG4gICAgICAgICAgICAgICBkaXJlY3Rpb24gOiB0aGlzLmRhdGEuZGlyZWN0aW9uLFxuICAgICAgICAgICAgICAgdW5pdCAgICAgOiBcInB4XCIsXG4gICAgICAgICAgICAgICAvL21vdXNlV2hlZWw6IHRydWUsXG4gICAgICAgICAgfSlcbiAgICAgICAgICB0aGlzLnN3aXBlYWJsZS5hY3RpdmF0ZSAoKVxuXG4gICAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIgKCBcIkRPTUNvbnRlbnRMb2FkZWRcIiwgKCkgPT5cbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICB0aGlzLnN3aXBlYWJsZS51cGRhdGVDb25maWcgKHtcbiAgICAgICAgICAgICAgICAgICAgbWluU2l6ZTogLXRoaXMuc2xpZGVTaXplICgpLFxuICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICB9KVxuXG4gICAgICAgICAgcmV0dXJuIFt0aGlzLmNvbnRhaW5lcl1cbiAgICAgfVxuXG4gICAgIG9uQ2hpbGRyZW5BZGRlZCAoIGVsZW1lbnRzOiBDb21wb25lbnQgW10gKVxuICAgICB7XG4gICAgICAgICAgdGhpcy5zd2lwZWFibGUudXBkYXRlQ29uZmlnICh7XG4gICAgICAgICAgICAgICBtaW5TaXplICA6IC10aGlzLnNsaWRlU2l6ZSAoKSxcbiAgICAgICAgICAgICAgIHByb3BlcnR5IDogdGhpcy5pc192ZXJ0aWNhbCA/IFwidG9wXCI6IFwibGVmdFwiLFxuICAgICAgICAgICAgICAgZGlyZWN0aW9uOiB0aGlzLmRhdGEuZGlyZWN0aW9uLFxuICAgICAgICAgIH0pXG4gICAgIH1cblxuICAgICBwcml2YXRlIHNsaWRlU2l6ZSAoKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgeyBzbG90IH0gPSB0aGlzXG5cbiAgICAgICAgICByZXR1cm4gY3NzRmxvYXQgKCBzbG90LCB0aGlzLmlzX3ZlcnRpY2FsID8gXCJoZWlnaHRcIiA6IFwid2lkdGhcIiApXG4gICAgIH1cblxuICAgICBzd2lwZSAoIG9mZnNldDogc3RyaW5nfG51bWJlciwgdW5pdD86IFwicHhcIiB8IFwiJVwiIClcbiAgICAge1xuICAgICAgICAgLy8gaWYgKCB0eXBlb2Ygb2Zmc2V0ID09IFwic3RyaW5nXCIgKVxuICAgICAgICAgLy8gICAgICB0aGlzLnN3aXBlYWJsZS5zd2lwZSAoIG9mZnNldCApXG4gICAgICAgICAvLyBlbHNlXG4gICAgICAgICAvLyAgICAgIHRoaXMuc3dpcGVhYmxlLnN3aXBlICggb2Zmc2V0LCB1bml0IClcbiAgICAgfVxufVxuIiwiXG5pbXBvcnQgeyBMaXN0VmlldyB9IGZyb20gXCIuLi9MaXN0L2luZGV4LmpzXCJcbmltcG9ydCB7IGRlZmluZSB9IGZyb20gXCIuLi8uLi9kYi5qc1wiXG5cbnR5cGUgRGlyZWN0aW9uID0gXCJsclwiIHwgXCJybFwiIHwgXCJ0YlwiIHwgXCJidFwiXG5cbnR5cGUgVW5pdHMgPSBcInB4XCIgfCBcIiVcIlxuXG5kZWNsYXJlIGdsb2JhbFxue1xuICAgICBleHBvcnQgaW50ZXJmYWNlICRUb29sYmFyIGV4dGVuZHMgJEV4dGVuZHMgPCRMaXN0Vmlldz4gLy8gJENvbnRhaW5lclxuICAgICB7XG4gICAgICAgICAgdHlwZSAgICAgOiBcInRvb2xiYXJcIlxuICAgICAgICAgIHRpdGxlICAgIDogc3RyaW5nXG4gICAgICAgICAgYnV0dG9ucyAgOiAkQnV0dG9uIFtdXG4gICAgIH1cbn1cblxuY29uc3QgdG9GbGV4RGlyZWN0aW9uID0ge1xuICAgICBscjogXCJyb3dcIiAgICAgICAgICAgIGFzIFwicm93XCIsXG4gICAgIHJsOiBcInJvdy1yZXZlcnNlXCIgICAgYXMgXCJyb3ctcmV2ZXJzZVwiLFxuICAgICB0YjogXCJjb2x1bW5cIiAgICAgICAgIGFzIFwiY29sdW1uXCIsXG4gICAgIGJ0OiBcImNvbHVtbi1yZXZlcnNlXCIgYXMgXCJjb2x1bW4tcmV2ZXJzZVwiLFxufVxuXG5jb25zdCB0b1JldmVyc2UgPSB7XG4gICAgIGxyOiBcInJsXCIgYXMgXCJybFwiLFxuICAgICBybDogXCJsclwiIGFzIFwibHJcIixcbiAgICAgdGI6IFwiYnRcIiBhcyBcImJ0XCIsXG4gICAgIGJ0OiBcInRiXCIgYXMgXCJ0YlwiLFxufVxuXG4vKipcbiAqICAgYGBgcHVnXG4gKiAgIC50b29sYmFyXG4gKiAgICAgICAgLnRvb2xiYXItYmFja2dyb3VuZ1xuICogICAgICAgIC50b29sYmFyLXNsaWRlXG4gKiAgICAgICAgICAgICBbLi4uXVxuICogICBgYGBcbiAqL1xuZXhwb3J0IGNsYXNzIFRvb2xiYXIgZXh0ZW5kcyBMaXN0VmlldyA8JFRvb2xiYXI+XG57XG4gICAgIHRhYnMgICAgICA6IEpTWC5FbGVtZW50IFtdXG4gICAgIGJhY2tncm91bmQ6IEpTWC5FbGVtZW50XG5cbiAgICAgZGVmYXVsdENvbmZpZyAoKTogJFRvb2xiYXJcbiAgICAge1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAuLi4gc3VwZXIuZGVmYXVsdERhdGEgKCksXG4gICAgICAgICAgICAgICB0eXBlICAgICA6IFwidG9vbGJhclwiLFxuICAgICAgICAgICAgICAgdGl0bGUgICAgOiBcIlRpdGxlIC4uLlwiLFxuICAgICAgICAgICAgICAgZGlyZWN0aW9uOiBcImxyXCIsXG4gICAgICAgICAgICAgICAvL3JldmVyc2UgIDogZmFsc2UsXG4gICAgICAgICAgICAgICBidXR0b25zOiBbXVxuICAgICAgICAgIH1cbiAgICAgfVxuXG4gICAgIGdldEh0bWwgKClcbiAgICAge1xuICAgICAgICAgIGlmICggdGhpcy5jb250YWluZXIgIT0gdW5kZWZpbmVkIClcbiAgICAgICAgICAgICAgIHJldHVybiBbdGhpcy5jb250YWluZXJdXG5cbiAgICAgICAgICBzdXBlci5nZXRIdG1sICgpXG5cbiAgICAgICAgICBpZiAoIHRoaXMuZGF0YS5idXR0b25zIClcbiAgICAgICAgICAgICAgIHRoaXMuYXBwZW5kICggLi4uIHRoaXMuZGF0YS5idXR0b25zIClcblxuICAgICAgICAgIHJldHVybiBbdGhpcy5jb250YWluZXJdXG4gICAgIH1cbn1cblxuZGVmaW5lICggVG9vbGJhciwgW1widG9vbGJhclwiXSApXG4iLCJcbmltcG9ydCB7IGRyYWdnYWJsZSwgRHJhZ0V2ZW50IH0gZnJvbSBcIi4vZHJhZ2dhYmxlLmpzXCJcblxudHlwZSBEaXJlY3Rpb24gPSBcImxyXCIgfCBcInJsXCIgfCBcImJ0XCIgfCBcInRiXCJcbnR5cGUgRE9NRWxlbWVudCA9IEhUTUxFbGVtZW50IHwgU1ZHRWxlbWVudFxuXG5leHBvcnQgaW50ZXJmYWNlIFNjb2xsYWJsZUNvbmZpZ1xue1xuICAgICBoYW5kbGVzOiBET01FbGVtZW50IFtdXG4gICAgIGRpcmVjdGlvbjogRGlyZWN0aW9uXG59XG5cbmZ1bmN0aW9uIGRlZmF1bHRDb25maWcgKCk6IFNjb2xsYWJsZUNvbmZpZ1xue1xuICAgICByZXR1cm4ge1xuICAgICAgICAgIGhhbmRsZXMgIDogW10sXG4gICAgICAgICAgZGlyZWN0aW9uOiBcInRiXCJcbiAgICAgfVxufVxuXG5mdW5jdGlvbiBzY3JvbGxhYmxlTmF0aXZlICggb3B0aW9uczogU2NvbGxhYmxlQ29uZmlnIClcbntcbiAgICAgZGVzYWN0aXZhdGUgKClcblxuICAgICByZXR1cm4ge1xuICAgICAgICAgIGFjdGl2YXRlLFxuICAgICAgICAgIGRlc2FjdGl2YXRlLFxuICAgICB9XG5cbiAgICAgZnVuY3Rpb24gYWN0aXZhdGUgKClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IGRpciA9IG9wdGlvbnMuZGlyZWN0aW9uID09IFwiYnRcIiB8fCBvcHRpb25zLmRpcmVjdGlvbiA9PSBcInRiXCJcbiAgICAgICAgICAgICAgICAgICAgPyBcInBhbi15XCIgOiBcInBhbi14XCJcblxuICAgICAgICAgIGZvciAoIGNvbnN0IGggb2Ygb3B0aW9ucy5oYW5kbGVzIClcbiAgICAgICAgICAgICAgIGguc3R5bGUudG91Y2hBY3Rpb24gPSBkaXJcbiAgICAgfVxuXG4gICAgIGZ1bmN0aW9uIGRlc2FjdGl2YXRlICgpXG4gICAgIHtcbiAgICAgICAgICBjb25zdCBkaXIgPSBvcHRpb25zLmRpcmVjdGlvbiA9PSBcImJ0XCIgfHwgb3B0aW9ucy5kaXJlY3Rpb24gPT0gXCJ0YlwiXG4gICAgICAgICAgICAgICAgICAgID8gXCJwYW4teVwiIDogXCJwYW4teFwiXG5cbiAgICAgICAgICBmb3IgKCBjb25zdCBoIG9mIG9wdGlvbnMuaGFuZGxlcyApXG4gICAgICAgICAgICAgICBoLnN0eWxlLnRvdWNoQWN0aW9uID0gXCJub25lXCJcbiAgICAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gc2NvbGxhYmxlICggb3B0aW9uczogU2NvbGxhYmxlQ29uZmlnIClcbntcbiAgICAgaWYgKCBcIm9udG91Y2hzdGFydFwiIGluIHdpbmRvdyApXG4gICAgICAgICAgcmV0dXJuIHNjcm9sbGFibGVOYXRpdmUgKCBvcHRpb25zIClcblxuICAgICBjb25zdCBkcmFnID0gZHJhZ2dhYmxlICh7XG4gICAgICAgICAgaGFuZGxlcyAgICAgICA6IG9wdGlvbnMuaGFuZGxlcyxcbiAgICAgICAgICB2ZWxvY2l0eUZhY3RvcjogMTAwLFxuICAgICAgICAgIG9uU3RhcnREcmFnLFxuICAgICAgICAgIG9uRHJhZyAgICAgOiBvcHRpb25zLmRpcmVjdGlvbiA9PSBcImJ0XCIgfHwgb3B0aW9ucy5kaXJlY3Rpb24gPT0gXCJ0YlwiXG4gICAgICAgICAgICAgICAgICAgICA/IG9uRHJhZ1ZlcnRpY2FsXG4gICAgICAgICAgICAgICAgICAgICA6IG9uRHJhZ0hvcml6b250YWwsXG4gICAgICAgICAgb25TdG9wRHJhZzogb3B0aW9ucy5kaXJlY3Rpb24gPT0gXCJidFwiIHx8IG9wdGlvbnMuZGlyZWN0aW9uID09IFwidGJcIlxuICAgICAgICAgICAgICAgICAgICA/IG9uU3RvcERyYWdWZXJ0aWNhbFxuICAgICAgICAgICAgICAgICAgICA6IG9uU3RvcERyYWdIb3Jpem9udGFsLFxuICAgICB9KVxuXG4gICAgIHJldHVybiB7XG4gICAgICAgICAgYWN0aXZhdGU6ICgpID0+IHsgZHJhZy5hY3RpdmF0ZSAoKSB9XG4gICAgIH1cblxuICAgICBmdW5jdGlvbiBvblN0YXJ0RHJhZyAoKVxuICAgICB7XG4gICAgICAgICAgZm9yICggY29uc3QgaCBvZiBvcHRpb25zLmhhbmRsZXMgKVxuICAgICAgICAgICAgICAgaC5zdHlsZS5zY3JvbGxCZWhhdmlvciA9IFwidW5zZXRcIlxuICAgICB9XG4gICAgIGZ1bmN0aW9uIG9uRHJhZ1ZlcnRpY2FsICggZXZlbnQ6IERyYWdFdmVudCApXG4gICAgIHtcbiAgICAgICAgICBmb3IgKCBjb25zdCBoIG9mIG9wdGlvbnMuaGFuZGxlcyApXG4gICAgICAgICAgICAgICBoLnNjcm9sbEJ5ICggMCwgZXZlbnQub2Zmc2V0WSApXG4gICAgIH1cbiAgICAgZnVuY3Rpb24gb25EcmFnSG9yaXpvbnRhbCAoIGV2ZW50OiBEcmFnRXZlbnQgKVxuICAgICB7XG4gICAgICAgICAgZm9yICggY29uc3QgaCBvZiBvcHRpb25zLmhhbmRsZXMgKVxuICAgICAgICAgICAgICAgaC5zY3JvbGxCeSAoIGV2ZW50Lm9mZnNldFgsIDAgKVxuICAgICB9XG4gICAgIGZ1bmN0aW9uIG9uU3RvcERyYWdWZXJ0aWNhbCAoIGV2ZW50OiBEcmFnRXZlbnQgKVxuICAgICB7XG4gICAgICAgICAgZm9yICggY29uc3QgaCBvZiBvcHRpb25zLmhhbmRsZXMgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGguc2Nyb2xsQnkgKCAwLCBldmVudC5vZmZzZXRZIClcbiAgICAgICAgICAgICAgIC8vaC5zdHlsZS5zY3JvbGxCZWhhdmlvciA9IFwic21vb3RoXCJcbiAgICAgICAgICAgICAgIC8vaC5zY3JvbGxCeSAoIDAsIGV2ZW50Lm9mZnNldFkgKyBldmVudC52ZWxvY2l0eVkgKVxuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICB9XG4gICAgIGZ1bmN0aW9uIG9uU3RvcERyYWdIb3Jpem9udGFsICggZXZlbnQ6IERyYWdFdmVudCApXG4gICAgIHtcbiAgICAgICAgICBmb3IgKCBjb25zdCBoIG9mIG9wdGlvbnMuaGFuZGxlcyApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgaC5zY3JvbGxCeSAoIGV2ZW50Lm9mZnNldFgsIDAgKVxuICAgICAgICAgICAgICAgLy9oLnN0eWxlLnNjcm9sbEJlaGF2aW9yID0gXCJzbW9vdGhcIlxuICAgICAgICAgICAgICAgLy9oLnNjcm9sbEJ5ICggZXZlbnQub2Zmc2V0WCArIGV2ZW50LnZlbG9jaXR5WCwgMCApXG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgIH1cbn1cbiIsIlxuaW1wb3J0IHsgeG5vZGUgfSBmcm9tIFwiLi4vLi4vQmFzZS94bm9kZS5qc1wiXG5pbXBvcnQgeyBDb21wb25lbnQgfSBmcm9tIFwiLi4vLi4vQmFzZS9Db21wb25lbnQvaW5kZXguanNcIlxuaW1wb3J0IHsgQ29udGFpbmVyIH0gZnJvbSBcIi4uLy4uL0Jhc2UvQ29udGFpbmVyL2luZGV4LmpzXCJcbi8vaW1wb3J0IHsgZXhwYW5kYWJsZSwgRXhwZW5kYWJsZUVsZW1lbnQgfSBmcm9tIFwiLi4vLi4vQmFzZS9leHBlbmRhYmxlLmpzXCJcbmltcG9ydCB7IHNjb2xsYWJsZSB9IGZyb20gXCIuLi8uLi9CYXNlL3Njcm9sbGFibGUuanNcIlxuaW1wb3J0IHsgcGljaywgZGVmaW5lLCBpblN0b2NrLCBtYWtlIH0gZnJvbSBcIi4uLy4uL2RiLmpzXCJcblxudHlwZSBEaXJlY3Rpb24gPSBcImxyXCIgfCBcInJsXCIgfCBcInRiXCIgfCBcImJ0XCJcblxuZGVjbGFyZSBnbG9iYWxcbntcbiAgICAgaW50ZXJmYWNlICRQYW5lbCBleHRlbmRzICRDb250YWluZXJcbiAgICAge1xuICAgICAgICAgIHR5cGUgICAgICAgICA6IFwicGFuZWxcIixcbiAgICAgICAgICAvL2hhc01haW5CdXR0b246IGJvb2xlYW4sXG4gICAgICAgICAgaGVhZGVyPyAgICAgIDogJEFueUNvbXBvbmVudHMsXG4gICAgICAgICAgY2hpbGRyZW4/ICAgIDogJEFueUNvbXBvbmVudHMgW10sXG4gICAgICAgICAgZm9vdGVyPyAgICAgIDogJEFueUNvbXBvbmVudHMsXG4gICAgIH1cbn1cblxuY29uc3QgdG9Qb3NpdGlvbiA9IHtcbiAgICAgbHIgOiBcImxlZnRcIixcbiAgICAgcmwgOiBcInJpZ2h0XCIsXG4gICAgIHRiIDogXCJ0b3BcIixcbiAgICAgYnQgOiBcImJvdHRvbVwiLFxufVxuXG4vKipcbiAqICAgYGBgXG4gKiAgIC5wYW5lbFxuICogICAgICAgIC5wYW5lbC1oZWFkZXJcbiAqICAgICAgICAgICAgIC5wYW5lbC1tYWluLWJ1dHR0b25cbiAqICAgICAgICAgICAgIFsuLi5dXG4gKiAgICAgICAgLnBhbmVsLWNvbnRlbnRcbiAqICAgICAgICAgICAgIFsuLi5dXG4gKiAgICAgICAgLnBhbmVsLWZvb3RlclxuICogICAgICAgICAgICAgWy4uLl1cbiAqICAgYGBgXG4gKi9cbmV4cG9ydCBjbGFzcyBQYW5lbCA8JCBleHRlbmRzICRFeHRlbmRzIDwkUGFuZWw+PiBleHRlbmRzIENvbnRhaW5lciA8JD5cbntcbiAgICAgLy9tYWluX2J1dHRvbjogSlNYLkVsZW1lbnRcbiAgICAgY29udGVudCAgICA6IENvbXBvbmVudFxuICAgICBoZWFkZXIgICAgIDogQ29tcG9uZW50XG4gICAgIF9oZWFkZXI6IEpTWC5FbGVtZW50XG4gICAgIF9jb250ZW50OiBKU1guRWxlbWVudFxuXG4gICAgIC8vcHJvdGVjdGVkIGV4cGFuZGFibGU6IEV4cGVuZGFibGVFbGVtZW50XG5cbiAgICAgZGVmYXVsdERhdGEgKCk6ICRQYW5lbFxuICAgICB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgIC4uLiBzdXBlci5kZWZhdWx0RGF0YSAoKSxcbiAgICAgICAgICAgICAgIHR5cGUgICAgICAgICA6IFwicGFuZWxcIixcbiAgICAgICAgICAgICAgIGNoaWxkcmVuICAgICA6IFtdLFxuICAgICAgICAgICAgICAgZGlyZWN0aW9uICAgIDogXCJybFwiLFxuICAgICAgICAgICAgICAgLy9oYXNNYWluQnV0dG9uOiB0cnVlLFxuICAgICAgICAgIH1cbiAgICAgfVxuXG4gICAgIGdldEh0bWwgKClcbiAgICAge1xuICAgICAgICAgIGlmICggdGhpcy5jb250YWluZXIgPT0gdW5kZWZpbmVkIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBjb25zdCBoZWFkZXIgICAgPSA8ZGl2IGNsYXNzPVwicGFuZWwtaGVhZGVyXCIgLz5cbiAgICAgICAgICAgICAgIGNvbnN0IGNvbnRlbnQgICA9IDxkaXYgY2xhc3M9XCJwYW5lbC1jb250ZW50XCIgLz5cbiAgICAgICAgICAgICAgIGNvbnN0IGNvbnRhaW5lciA9IDxkaXYgY2xhc3M9XCJwYW5lbCBjbG9zZVwiPlxuICAgICAgICAgICAgICAgICAgICB7IGhlYWRlciB9XG4gICAgICAgICAgICAgICAgICAgIHsgY29udGVudCB9XG4gICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgY29uc3QgZGF0YSA9IHRoaXMuZGF0YVxuXG4gICAgICAgICAgICAgICAvLyBpZiAoIGRhdGEuaGFzTWFpbkJ1dHRvbiApXG4gICAgICAgICAgICAgICAvLyB7XG4gICAgICAgICAgICAgICAvLyAgICAgIGNvbnN0IGJ0biA9IDxzcGFuIGNsYXNzPVwicGFuZWwtbWFpbi1idXR0b25cIj5cbiAgICAgICAgICAgICAgIC8vICAgICAgICAgICA8c3BhbiBjbGFzcz1cImljb25cIj7ih5U8L3NwYW4+XG4gICAgICAgICAgICAgICAvLyAgICAgIDwvc3Bhbj5cblxuICAgICAgICAgICAgICAgLy8gICAgICB0aGlzLm1haW5fYnV0dG9uID0gYnRuXG4gICAgICAgICAgICAgICAvLyAgICAgIGhlYWRlci5hcHBlbmQgKCBidG4gKVxuICAgICAgICAgICAgICAgLy8gfVxuXG4gICAgICAgICAgICAgICBpZiAoIGRhdGEuaGVhZGVyIClcbiAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5oZWFkZXIgPSBpblN0b2NrICggZGF0YS5oZWFkZXIgKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IHBpY2sgKCBkYXRhLmhlYWRlciApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogbWFrZSAoIGRhdGEuaGVhZGVyIClcblxuICAgICAgICAgICAgICAgICAgICBoZWFkZXIuYXBwZW5kICggLi4uIHRoaXMuaGVhZGVyLmdldEh0bWwgKCkgKVxuICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICBpZiAoIGRhdGEuY2hpbGRyZW4gKVxuICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAvL3N1cGVyLmFwcGVuZCAoIC4uLiBkYXRhLmNoaWxkcmVuIClcbiAgICAgICAgICAgICAgICAgICAgZm9yICggY29uc3QgY2hpbGQgb2YgZGF0YS5jaGlsZHJlbiApXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNvbnRlbnQgPSBpblN0b2NrICggY2hpbGQgKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IHBpY2sgKCBjaGlsZCApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogbWFrZSAoIGNoaWxkIClcblxuICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnQuYXBwZW5kICggLi4uIHRoaXMuY29udGVudC5nZXRIdG1sICgpIClcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICB0aGlzLmNvbnRhaW5lciAgPSBjb250YWluZXJcblxuICAgICAgICAgICAgICAgLy8gdGhpcy5leHBhbmRhYmxlID0gZXhwYW5kYWJsZSAoIGNvbnRhaW5lciwge1xuICAgICAgICAgICAgICAgLy8gICAgICBkaXJlY3Rpb24gICAgOiBkYXRhLmRpcmVjdGlvbixcbiAgICAgICAgICAgICAgIC8vICAgICAgbmVhciAgICAgICAgIDogNjAsXG4gICAgICAgICAgICAgICAvLyAgICAgIGhhbmRsZXMgICAgICA6IEFycmF5Lm9mICggdGhpcy5tYWluX2J1dHRvbiApLFxuICAgICAgICAgICAgICAgLy8gICAgICBvbkFmdGVyT3BlbiAgOiAoKSA9PiB7XG4gICAgICAgICAgICAgICAvLyAgICAgICAgICAgLy9jb250ZW50LnN0eWxlLm92ZXJmbG93ID0gXCJcIlxuICAgICAgICAgICAgICAgLy8gICAgICAgICAgIGNvbnRlbnQuY2xhc3NMaXN0LnJlbW92ZSAoIFwiaGlkZGVuXCIgKVxuICAgICAgICAgICAgICAgLy8gICAgICB9LFxuICAgICAgICAgICAgICAgLy8gICAgICBvbkJlZm9yZUNsb3NlOiAoKSA9PiB7XG4gICAgICAgICAgICAgICAvLyAgICAgICAgICAgLy9jb250ZW50LnN0eWxlLm92ZXJmbG93ID0gXCJoaWRkZW5cIlxuICAgICAgICAgICAgICAgLy8gICAgICAgICAgIGNvbnRlbnQuY2xhc3NMaXN0LmFkZCAoIFwiaGlkZGVuXCIgKVxuICAgICAgICAgICAgICAgLy8gICAgICB9XG4gICAgICAgICAgICAgICAvLyB9KVxuXG4gICAgICAgICAgICAgICAvLyB0aGlzLmV4cGFuZGFibGUuYWN0aXZhdGUgKClcblxuICAgICAgICAgICAgICAgc2NvbGxhYmxlICh7XG4gICAgICAgICAgICAgICAgICAgIGhhbmRsZXM6IFtjb250ZW50XSxcbiAgICAgICAgICAgICAgICAgICAgZGlyZWN0aW9uOiBcImJ0XCJcbiAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAuYWN0aXZhdGUgKClcblxuICAgICAgICAgICAgICAgdGhpcy5faGVhZGVyID0gaGVhZGVyXG4gICAgICAgICAgICAgICB0aGlzLl9jb250ZW50ID0gY29udGVudFxuXG4gICAgICAgICAgICAgICB0aGlzLmNvbnRhaW5lci5jbGFzc0xpc3QuYWRkICggdG9Qb3NpdGlvbiBbZGF0YS5kaXJlY3Rpb25dIClcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gWyB0aGlzLmNvbnRhaW5lciBdIGFzIEhUTUxFbGVtZW50IFtdXG4gICAgIH1cblxuICAgICAvLyBwcml2YXRlIG9uQ2xpY2tUYWIgKClcbiAgICAgLy8ge1xuICAgICAvLyAgICAgIHRoaXMub3BlbiAoKVxuICAgICAvLyB9XG5cbiAgICAgLy9pc09wZW4gKClcbiAgICAgLy97XG4gICAgIC8vICAgICByZXR1cm4gdGhpcy5leHBhbmRhYmxlLmlzT3BlbiAoKVxuICAgICAvL31cblxuICAgICAvL2lzQ2xvc2UgKClcbiAgICAgLy97XG4gICAgIC8vICAgICByZXR1cm4gdGhpcy5leHBhbmRhYmxlLmlzQ2xvc2UgKClcbiAgICAgLy99XG5cbiAgICAgc2V0T3JpZW50YXRpb24gKCB2YWx1ZTogRGlyZWN0aW9uIClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHsgZGF0YSB9ID0gdGhpc1xuXG4gICAgICAgICAgdGhpcy5jb250YWluZXIuY2xhc3NMaXN0LnJlbW92ZSAoIHRvUG9zaXRpb24gW2RhdGEuZGlyZWN0aW9uXSApXG4gICAgICAgICAgdGhpcy5jb250YWluZXIuY2xhc3NMaXN0LmFkZCAoIHRvUG9zaXRpb24gW3ZhbHVlXSApXG5cbiAgICAgICAgICBzdXBlci5zZXRPcmllbnRhdGlvbiAoIHZhbHVlIClcblxuICAgICAgICAgIC8vZXhwYW5kYWJsZS51cGRhdGVDb25maWcgKHsgZGlyZWN0aW9uOiB2YWx1ZSB9KVxuXG4gICAgICAgICAgZGF0YS5kaXJlY3Rpb24gPSB2YWx1ZVxuICAgICB9XG5cbiAgICAgLy8gb3BlbiAoIGlkPzogc3RyaW5nLCAuLi4gY29udGVudDogKHN0cmluZyB8IEVsZW1lbnQgfCBDb21wb25lbnQgfCAkQ29tcG9uZW50KSBbXSApXG4gICAgIC8vIHtcbiAgICAgLy8gICAgICAvL2lmICggYXJndW1lbnRzLmxlbmd0aCA+IDEgKVxuICAgICAvLyAgICAgIC8vICAgICB0aGlzLnNsaWRlc2hvdy5zaG93ICggaWQsIC4uLiBjb250ZW50IClcblxuICAgICAvLyAgICAgIC8vdGhpcy5leHBhbmRhYmxlLm9wZW4gKClcblxuICAgICAvLyAgICAgIC8vdGhpcy5jb250ZW50ICggLi4uIGFyZ3MgKVxuXG4gICAgIC8vICAgICAgcmV0dXJuIHRoaXNcbiAgICAgLy8gfVxuXG4gICAgIC8vIGNsb3NlICgpXG4gICAgIC8vIHtcbiAgICAgLy8gICAgICB0aGlzLmV4cGFuZGFibGUuY2xvc2UgKClcblxuICAgICAvLyAgICAgIHJldHVybiB0aGlzXG4gICAgIC8vIH1cblxuICAgICAvL3NpemUgPSAwXG5cbiAgICAgLy8gcmVzaXplICggc2l6ZTogbnVtYmVyIClcbiAgICAgLy8ge1xuICAgICAvLyAgICAgIGNvbnN0IHsgZXhwYW5kYWJsZSwgY29udGFpbmVyIH0gPSB0aGlzXG5cbiAgICAgLy8gICAgICBpZiAoIGV4cGFuZGFibGUuaXNWZXJ0aWNhbCAoKSApXG4gICAgIC8vICAgICAgICAgICBjb250YWluZXIuc3R5bGUuaGVpZ2h0ID0gc2l6ZSArIFwicHhcIlxuICAgICAvLyAgICAgIGVsc2VcbiAgICAgLy8gICAgICAgICAgIGNvbnRhaW5lci5zdHlsZS53aWR0aCA9IHNpemUgKyBcInB4XCJcblxuICAgICAvLyAgICAgIHRoaXMuc2l6ZSA9IHNpemVcbiAgICAgLy8gfVxuXG4gICAgIC8vIGV4cGFuZCAoIG9mZnNldDogbnVtYmVyIClcbiAgICAgLy8ge1xuICAgICAvLyAgICAgIGNvbnN0IHsgZXhwYW5kYWJsZSwgY29udGFpbmVyIH0gPSB0aGlzXG5cbiAgICAgLy8gICAgICBjb25zdCBzaXplID0gdGhpcy5zaXplICsgb2Zmc2V0XG5cbiAgICAgLy8gICAgICBpZiAoIGV4cGFuZGFibGUuaXNWZXJ0aWNhbCAoKSApXG4gICAgIC8vICAgICAgICAgICBjb250YWluZXIuc3R5bGUuaGVpZ2h0ID0gc2l6ZSArIFwicHhcIlxuICAgICAvLyAgICAgIGVsc2VcbiAgICAgLy8gICAgICAgICAgIGNvbnRhaW5lci5zdHlsZS53aWR0aCA9IHNpemUgKyBcInB4XCJcblxuICAgICAvLyAgICAgIHRoaXMuc2l6ZSA9IHNpemVcbiAgICAgLy8gfVxufVxuXG5kZWZpbmUgKCBQYW5lbCwgW1wicGFuZWxcIl0gKVxuXG4iLCJcbmltcG9ydCB7IHhub2RlIH0gZnJvbSBcIi4uLy4uL0Jhc2UveG5vZGUuanNcIlxuaW1wb3J0IHsgUGFuZWwgfSBmcm9tIFwiLi4vUGFuZWwvaW5kZXguanNcIlxuaW1wb3J0IHsgZXhwYW5kYWJsZSwgRXhwZW5kYWJsZUVsZW1lbnQgfSBmcm9tIFwiLi4vLi4vQmFzZS9leHBlbmRhYmxlLmpzXCJcbmltcG9ydCB7IGRlZmluZSB9IGZyb20gXCIuLi8uLi9kYi5qc1wiXG5cbmRlY2xhcmUgZ2xvYmFsXG57XG4gICAgIGludGVyZmFjZSAkU2lkZU1lbnUgZXh0ZW5kcyBPbWl0IDwkUGFuZWwsIFwidHlwZVwiPlxuICAgICB7XG4gICAgICAgICAgdHlwZTogXCJzaWRlLW1lbnVcIlxuICAgICAgICAgIGhhc01haW5CdXR0b246IGJvb2xlYW4sXG4gICAgIH1cbn1cblxudHlwZSBEaXJlY3Rpb24gPSBcImxyXCIgfCBcInJsXCIgfCBcInRiXCIgfCBcImJ0XCJcblxuZXhwb3J0IGNsYXNzIFNpZGVNZW51IGV4dGVuZHMgUGFuZWwgPCRTaWRlTWVudT5cbntcbiAgICAgbWFpbl9idXR0b246IEpTWC5FbGVtZW50XG4gICAgIGV4cGFuZGFibGU6IEV4cGVuZGFibGVFbGVtZW50XG5cbiAgICAgZ2V0SHRtbCAoKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgZWxlbWVudHMgPSBzdXBlci5nZXRIdG1sICgpXG5cbiAgICAgICAgICBjb25zdCBkYXRhICAgICAgPSB0aGlzLmRhdGFcbiAgICAgICAgICBjb25zdCBjb250YWluZXIgPSB0aGlzLmNvbnRhaW5lclxuICAgICAgICAgIGNvbnN0IGhlYWRlciAgICA9IHRoaXMuX2hlYWRlclxuICAgICAgICAgIGNvbnN0IGNvbnRlbnQgICA9IHRoaXMuX2NvbnRlbnRcblxuICAgICAgICAgIGNvbnRhaW5lci5jbGFzc0xpc3QucmVwbGFjZSAoIFwicGFuZWxcIiAgICAgICAgLCBcInNpZGUtbWVudVwiIClcbiAgICAgICAgICBoZWFkZXIgICAuY2xhc3NMaXN0LnJlcGxhY2UgKCBcInBhbmVsLWhlYWRlclwiICwgXCJzaWRlLW1lbnUtaGVhZGVyXCIgKVxuICAgICAgICAgIGNvbnRlbnQgIC5jbGFzc0xpc3QucmVwbGFjZSAoIFwicGFuZWwtY29udGVudFwiLCBcInNpZGUtbWVudS1jb250ZW50XCIgKVxuXG4gICAgICAgICAgaWYgKCBkYXRhLmhhc01haW5CdXR0b24gKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNvbnN0IGJ0biA9IDxzcGFuIGNsYXNzPVwic2lkZS1tZW51LW1haW4tYnV0dG9uXCI+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwiaWNvblwiPuKHlTwvc3Bhbj5cbiAgICAgICAgICAgICAgIDwvc3Bhbj5cblxuICAgICAgICAgICAgICAgdGhpcy5tYWluX2J1dHRvbiA9IGJ0blxuICAgICAgICAgICAgICAgLy90aGlzLmNvbnRhaW5lci5pbnNlcnRBZGphY2VudEVsZW1lbnQgKCBcImFmdGVyYmVnaW5cIiwgYnRuIClcbiAgICAgICAgICAgICAgIGhlYWRlci5pbnNlcnRBZGphY2VudEVsZW1lbnQgKCBcImFmdGVyYmVnaW5cIiwgYnRuIClcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB0aGlzLmV4cGFuZGFibGUgPSBleHBhbmRhYmxlICggdGhpcy5jb250YWluZXIsIHtcbiAgICAgICAgICAgICAgIGRpcmVjdGlvbiAgICA6IGRhdGEuZGlyZWN0aW9uLFxuICAgICAgICAgICAgICAgbmVhciAgICAgICAgIDogNjAsXG4gICAgICAgICAgICAgICBoYW5kbGVzICAgICAgOiBBcnJheS5vZiAoIHRoaXMubWFpbl9idXR0b24gKSxcbiAgICAgICAgICAgICAgIG9uQWZ0ZXJPcGVuICA6ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29udGVudC5jbGFzc0xpc3QucmVtb3ZlICggXCJoaWRkZW5cIiApXG4gICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgb25CZWZvcmVDbG9zZTogKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb250ZW50LmNsYXNzTGlzdC5hZGQgKCBcImhpZGRlblwiIClcbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICB9KVxuXG4gICAgICAgICAgdGhpcy5leHBhbmRhYmxlLmFjdGl2YXRlICgpXG5cbiAgICAgICAgICByZXR1cm4gZWxlbWVudHNcbiAgICAgfVxuXG4gICAgIGlzT3BlbiAoKVxuICAgICB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuZXhwYW5kYWJsZS5pc09wZW4gKClcbiAgICAgfVxuXG4gICAgIGlzQ2xvc2UgKClcbiAgICAge1xuICAgICAgICAgIHJldHVybiB0aGlzLmV4cGFuZGFibGUuaXNDbG9zZSAoKVxuICAgICB9XG5cbiAgICAgb3BlbiAoKVxuICAgICB7XG5cbiAgICAgfVxuXG4gICAgIGNsb3NlICgpXG4gICAgIHtcbiAgICAgICAgICB0aGlzLmV4cGFuZGFibGUuY2xvc2UgKClcblxuICAgICAgICAgIHJldHVybiB0aGlzXG4gICAgIH1cblxuICAgICAvLyBzZXRPcmllbnRhdGlvbiAoIHZhbHVlOiBEaXJlY3Rpb24gKVxuICAgICAvLyB7XG4gICAgIC8vICAgICAgc3VwZXIuc2V0T3JpZW50YXRpb24gKCB2YWx1ZSApXG5cbiAgICAgLy8gICAgICBjb25zdCB7IGV4cGFuZGFibGUgfSA9IHRoaXNcblxuICAgICAvLyAgICAgIGV4cGFuZGFibGUudXBkYXRlQ29uZmlnICh7IGRpcmVjdGlvbjogdmFsdWUgfSlcblxuICAgICAvLyB9XG59XG5cbmRlZmluZSAoIFNpZGVNZW51LCBbXCJzaWRlLW1lbnVcIl0gKVxuIiwiXG5pbXBvcnQgeyB4bm9kZSB9IGZyb20gXCIuLi94bm9kZS5qc1wiXG5cbmV4cG9ydCB0eXBlIFNoYXBlTmFtZXMgPSBrZXlvZiBTaGFwZURlZmluaXRpb25zXG5cbmV4cG9ydCBpbnRlcmZhY2UgU2hhcGVEZWZpbml0aW9uc1xue1xuICAgICBjaXJjbGUgICA6IE9iamVjdERlZmluaXRpb24sXG4gICAgIHRyaWFuZ2xlIDogT2JqZWN0RGVmaW5pdGlvbixcbiAgICAgc3F1YXJlICAgOiBPYmplY3REZWZpbml0aW9uLFxuICAgICBwYW50YWdvbiA6IE9iamVjdERlZmluaXRpb24sXG4gICAgIGhleGFnb24gIDogT2JqZWN0RGVmaW5pdGlvbixcbiAgICAgdGV4dCAgICAgOiBUZXh0RGVmaW5pdGlvbixcbiAgICAgdGV4dGJveCAgOiBUZXh0RGVmaW5pdGlvbixcbiAgICAgcGF0aCAgICAgOiBQYXRoRGVmaW5pdGlvbixcbn1cblxuZXhwb3J0IGludGVyZmFjZSBPYmplY3REZWZpbml0aW9uXG57XG4gICAgIHNpemU6IG51bWJlcixcbiAgICAgeD8gIDogbnVtYmVyLFxuICAgICB5PyAgOiBudW1iZXJcbn1cblxuZXhwb3J0IGludGVyZmFjZSBUZXh0RGVmaW5pdGlvbiBleHRlbmRzIE9iamVjdERlZmluaXRpb25cbntcbiAgICAgdGV4dDogc3RyaW5nXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUGF0aERlZmluaXRpb24gZXh0ZW5kcyBPYmplY3REZWZpbml0aW9uXG57XG4gICAgIHBhdGg6IHN0cmluZ1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlU3ZnU2hhcGUgPFQgZXh0ZW5kcyBTaGFwZU5hbWVzPiAoXG4gICAgIHR5cGU6IFQsXG4gICAgIGRlZiA6IFNoYXBlRGVmaW5pdGlvbnMgW1RdLFxuKTogUmV0dXJuVHlwZSA8dHlwZW9mIFN2Z0ZhY3RvcnkgW1RdPlxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlU3ZnU2hhcGUgKCB0eXBlOiBTaGFwZU5hbWVzLCBkZWY6IGFueSApXG57XG4gICAgIHN3aXRjaCAoIHR5cGUgKVxuICAgICB7XG4gICAgIGNhc2UgXCJjaXJjbGVcIiAgOiByZXR1cm4gU3ZnRmFjdG9yeS5jaXJjbGUgICAoIGRlZiApXG4gICAgIGNhc2UgXCJ0cmlhbmdsZVwiOiByZXR1cm4gU3ZnRmFjdG9yeS50cmlhbmdsZSAoIGRlZiApXG4gICAgIGNhc2UgXCJzcXVhcmVcIiAgOiByZXR1cm4gU3ZnRmFjdG9yeS5zcXVhcmUgICAoIGRlZiApXG4gICAgIGNhc2UgXCJwYW50YWdvblwiOiByZXR1cm4gU3ZnRmFjdG9yeS5wYW50YWdvbiAoIGRlZiApXG4gICAgIGNhc2UgXCJoZXhhZ29uXCIgOiByZXR1cm4gU3ZnRmFjdG9yeS5oZXhhZ29uICAoIGRlZiApXG4gICAgIGNhc2UgXCJzcXVhcmVcIiAgOiByZXR1cm4gU3ZnRmFjdG9yeS5zcXVhcmUgICAoIGRlZiApXG4gICAgIGNhc2UgXCJ0ZXh0XCIgICAgOiByZXR1cm4gU3ZnRmFjdG9yeS50ZXh0ICAgICAoIGRlZiApXG4gICAgIGNhc2UgXCJ0ZXh0Ym94XCIgOiByZXR1cm4gU3ZnRmFjdG9yeS50ZXh0Ym94ICAoIGRlZiApXG4gICAgIGNhc2UgXCJwYXRoXCIgICAgOiByZXR1cm4gU3ZnRmFjdG9yeS5wYXRoICAgICAoIGRlZiApXG4gICAgIH1cbn1cblxuY2xhc3MgU3ZnRmFjdG9yeVxue1xuICAgICAvLyBUbyBnZXQgdHJpYW5nbGUsIHNxdWFyZSwgW3BhbnRhfGhleGFdZ29uIHBvaW50c1xuICAgICAvL1xuICAgICAvLyB2YXIgYSA9IE1hdGguUEkqMi80XG4gICAgIC8vIGZvciAoIHZhciBpID0gMCA7IGkgIT0gNCA7IGkrKyApXG4gICAgIC8vICAgICBjb25zb2xlLmxvZyAoIGBbICR7IE1hdGguc2luKGEqaSkgfSwgJHsgTWF0aC5jb3MoYSppKSB9IF1gIClcblxuICAgICBzdGF0aWMgY2lyY2xlICggZGVmOiBPYmplY3REZWZpbml0aW9uIClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IG5vZGUgPSA8Y2lyY2xlXG4gICAgICAgICAgICAgICBjeCA9IHsgZGVmLnggfHwgMCB9XG4gICAgICAgICAgICAgICBjeSA9IHsgZGVmLnkgfHwgMCB9XG4gICAgICAgICAgICAgICByICA9IHsgZGVmLnNpemUgLyAyIH1cbiAgICAgICAgICAvPlxuXG4gICAgICAgICAgcmV0dXJuIG5vZGVcbiAgICAgfVxuXG4gICAgIHN0YXRpYyB0cmlhbmdsZSAoIGRlZjogT2JqZWN0RGVmaW5pdGlvbiApXG4gICAgIHtcbiAgICAgfVxuXG5cbiAgICAgc3RhdGljIHNxdWFyZSAoIGRlZjogT2JqZWN0RGVmaW5pdGlvbiApXG4gICAgIHtcbiAgICAgfVxuXG4gICAgIHN0YXRpYyBwYW50YWdvbiAoIGRlZjogT2JqZWN0RGVmaW5pdGlvbiApXG4gICAgIHtcbiAgICAgfVxuXG4gICAgIHN0YXRpYyBoZXhhZ29uICggZGVmOiBPYmplY3REZWZpbml0aW9uIClcbiAgICAge1xuICAgICB9XG5cblxuICAgICBzdGF0aWMgdGV4dCAoIGRlZjogVGV4dERlZmluaXRpb24gKVxuICAgICB7XG4gICAgIH1cblxuICAgICBzdGF0aWMgdGV4dGJveCAoIGRlZjogVGV4dERlZmluaXRpb24gKVxuICAgICB7XG4gICAgIH1cblxuXG4gICAgIHN0YXRpYyBwYXRoICggZGVmOiBQYXRoRGVmaW5pdGlvbiApXG4gICAgIHtcbiAgICAgfVxufVxuIiwiaW1wb3J0IHsgR2VvbWV0cnkgfSBmcm9tIFwiLi4vLi4vLi4vTGliL2luZGV4LmpzXCJcbmltcG9ydCB7IENvbXBvbmVudCB9IGZyb20gXCIuLi8uLi9CYXNlL0NvbXBvbmVudC9pbmRleC5qc1wiXG5pbXBvcnQgKiBhcyBTdmcgZnJvbSBcIi4uLy4uL0Jhc2UvU3ZnL2luZGV4LmpzXCJcbmltcG9ydCB7IHhub2RlIH0gZnJvbSBcIi4uLy4uL0Jhc2UveG5vZGUuanNcIlxuXG5jb25zdCBHID0gR2VvbWV0cnlcblxudHlwZSBSZW5kZXJlciA9ICggZGVmaW5pdGlvbjogUmFkaWFsRGVmaW5pdGlvbiApID0+IFNWR0VsZW1lbnQgW11cbnR5cGUgUmFkaWFsRGVmaW5pdGlvbiA9IEdlb21ldHJ5LlJhZGlhbERlZmluaXRpb25cbnR5cGUgUmFkaWFsT3B0aW9uICAgICA9IEdlb21ldHJ5LlJhZGlhbE9wdGlvblxuXG5kZWNsYXJlIGdsb2JhbFxue1xuICAgICBpbnRlcmZhY2UgJFJhZGlhbE1lbnUgZXh0ZW5kcyAkQ29tcG9uZW50XG4gICAgIHtcbiAgICAgICAgICB0eXBlOiBcInJhZGlhbC1tZW51XCIsXG4gICAgICAgICAgYnV0dG9uczogUGFydGlhbCA8JEJ1dHRvbj4gW10sXG4gICAgICAgICAgcm90YXRpb246IG51bWJlclxuICAgICB9XG59XG5cblxuZXhwb3J0IGNsYXNzIFJhZGlhbE1lbnUgZXh0ZW5kcyBDb21wb25lbnQgPCRSYWRpYWxNZW51Plxue1xuICAgICBjb250YWluZXI6IFNWR1NWR0VsZW1lbnRcbiAgICAgZGVmaW5pdGlvbjogUmFkaWFsRGVmaW5pdGlvblxuXG4gICAgIHJlYWRvbmx5IHJlbmRlcmVyczogUmVjb3JkIDxzdHJpbmcsIFJlbmRlcmVyPiA9IHtcbiAgICAgICAgICBcImNpcmNsZVwiOiB0aGlzLnJlbmRlclN2Z0NpcmNsZXMuYmluZCAodGhpcylcbiAgICAgfVxuXG4gICAgIGdldEh0bWwgKClcbiAgICAge1xuICAgICAgICAgIHRoaXMudXBkYXRlICgpXG5cbiAgICAgICAgICByZXR1cm4gW3RoaXMuY29udGFpbmVyIGFzIGFueV1cbiAgICAgfVxuXG4gICAgIGFkZCAoIC4uLiBidXR0b25zOiAkQnV0dG9uIFtdIClcbiAgICAge1xuICAgICAgICAgIHRoaXMuZGF0YS5idXR0b25zLnB1c2ggKCAuLi4gYnV0dG9ucyBhcyBhbnkgKVxuXG4gICAgICAgICAgdGhpcy51cGRhdGUgKClcbiAgICAgfVxuXG4gICAgIHVwZGF0ZSAoKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgeyBkYXRhIH0gPSB0aGlzXG5cbiAgICAgICAgICBjb25zdCBkZWY6IFJhZGlhbE9wdGlvbiA9IHtcbiAgICAgICAgICAgICAgIGNvdW50ICA6IGRhdGEuYnV0dG9ucy5sZW5ndGgsXG4gICAgICAgICAgICAgICByICAgICAgOiA3NSxcbiAgICAgICAgICAgICAgIHBhZGRpbmc6IDYsXG4gICAgICAgICAgICAgICByb3RhdGlvbjogZGF0YS5yb3RhdGlvbiB8fCAwXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdGhpcy5kZWZpbml0aW9uID0gRy5nZXRSYWRpYWxEaXN0cmlidXRpb24gKCBkZWYgKVxuICAgICAgICAgIHRoaXMuY29udGFpbmVyICA9IHRoaXMudG9TdmcgKCBcImNpcmNsZVwiIClcbiAgICAgfVxuXG4gICAgIHByaXZhdGUgZW5hYmxlRXZlbnRzICgpXG4gICAgIHtcbiAgICAgICAgICAvL2NvbnN0IHsgb3B0aW9ucyB9ID0gdGhpc1xuICAgICAgICAgIC8vZm9yICggY29uc3QgYnRuIG9mIG9wdGlvbnMuYnV0dG9ucyApXG4gICAgICAgICAgLy8gICAgIGJ0bi5cbiAgICAgfVxuXG4gICAgIHNob3cgKCB4OiBudW1iZXIsIHk6IG51bWJlciApOiB2b2lkXG4gICAgIHtcbiAgICAgICAgICBjb25zdCBuID0gdGhpcy5jb250YWluZXJcbiAgICAgICAgICBjb25zdCBvZmZzZXQgPSB0aGlzLmRlZmluaXRpb24ud2lkdGggLyAyXG5cbiAgICAgICAgICBuLnN0eWxlLmxlZnQgPSAoeCAtIG9mZnNldCkgKyBcInB4XCJcbiAgICAgICAgICBuLnN0eWxlLnRvcCAgPSAoeSAtIG9mZnNldCkgKyBcInB4XCJcbiAgICAgICAgICBuLmNsYXNzTGlzdC5yZW1vdmUgKCBcImNsb3NlXCIgKVxuICAgICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyICggXCJtb3VzZWRvd25cIiwgdGhpcy5oaWRlLmJpbmQgKHRoaXMpLCB0cnVlIClcbiAgICAgfVxuXG4gICAgIGhpZGUgKClcbiAgICAge1xuICAgICAgICAgIHRoaXMuY29udGFpbmVyLmNsYXNzTGlzdC5hZGQgKFwiY2xvc2VcIilcbiAgICAgICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyICggXCJtb3VzZWRvd25cIiwgdGhpcy5oaWRlIClcbiAgICAgfVxuXG4gICAgIHRvU3ZnICggc3R5bGU6IHN0cmluZyApXG4gICAgIHtcbiAgICAgICAgICBjb25zdCB7IGRlZmluaXRpb246IGRlZiwgcmVuZGVyZXJzLCBkYXRhIH0gPSB0aGlzXG5cbiAgICAgICAgICBjb25zdCBzdmcgPVxuICAgICAgICAgICAgICAgPHN2Z1xuICAgICAgICAgICAgICAgICAgICBjbGFzcyAgID1cInJhZGlhbC1tZW51IGNsb3NlXCJcbiAgICAgICAgICAgICAgICAgICAgd2lkdGggICA9eyBkZWYud2lkdGggKyBcInB4XCIgfVxuICAgICAgICAgICAgICAgICAgICBoZWlnaHQgID17IGRlZi5oZWlnaHQgKyBcInB4XCIgfVxuICAgICAgICAgICAgICAgICAgICB2aWV3Qm94ID17IGAwIDAgJHsgZGVmLndpZHRoIH0gJHsgZGVmLmhlaWdodCB9YCB9XG4gICAgICAgICAgICAgICAvPiBhcyBTVkdTVkdFbGVtZW50XG5cbiAgICAgICAgICBjb25zdCBidXR0b25zID0gc3R5bGUgaW4gcmVuZGVyZXJzXG4gICAgICAgICAgICAgICAgICAgICAgICAgPyByZW5kZXJlcnMgW3N0eWxlXSAoIGRlZiApXG4gICAgICAgICAgICAgICAgICAgICAgICAgOiB0aGlzLnJlbmRlclN2Z0NpcmNsZXMgKCBkZWYgKVxuXG4gICAgICAgICAgc3ZnLmFwcGVuZCAoIC4uLiBidXR0b25zIGFzIE5vZGUgW10gKVxuXG4gICAgICAgICAgZm9yICggdmFyIGkgPSAwIDsgaSAhPSBidXR0b25zLmxlbmd0aCA7IGkrKyApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgY29uc3Qgb3B0ID0gZGF0YS5idXR0b25zIFtpXVxuXG4gICAgICAgICAgICAgICBpZiAoIHR5cGVvZiBvcHQuY2FsbGJhY2sgPT0gXCJmdW5jdGlvblwiIClcbiAgICAgICAgICAgICAgICAgICAgYnV0dG9ucyBbaV0uYWRkRXZlbnRMaXN0ZW5lciAoIFwibW91c2Vkb3duXCIsICgpID0+IG9wdC5jYWxsYmFjayAoKSApXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIHN2Z1xuICAgICB9XG5cbiAgICAgcmVuZGVyU3ZnQ2lyY2xlcyAoIGRlZmluaXRpb246IFJhZGlhbERlZmluaXRpb24gKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgcG9pbnRzICA9IGRlZmluaXRpb24ucG9pbnRzXG4gICAgICAgICAgY29uc3QgcGFkZGluZyA9IGRlZmluaXRpb24ucGFkZGluZ1xuICAgICAgICAgIGNvbnN0IGJ1dHR1bnMgPSBbXSBhcyBTVkdFbGVtZW50IFtdXG5cbiAgICAgICAgICBmb3IgKCB2YXIgaSA9IDA7IGkgPCBwb2ludHMubGVuZ3RoOyArK2kgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNvbnN0IGRlZiA9IHBvaW50cyBbaV1cbiAgICAgICAgICAgICAgIGNvbnN0IGJ0biA9IHRoaXMuZGF0YS5idXR0b25zIFtpXVxuXG4gICAgICAgICAgICAgICBjb25zdCBncm91cCA9IDxnIGNsYXNzPVwiYnV0dG9uXCIgLz5cblxuICAgICAgICAgICAgICAgY29uc3QgY2lyY2xlID0gU3ZnLmNyZWF0ZVN2Z1NoYXBlICggXCJjaXJjbGVcIiwge1xuICAgICAgICAgICAgICAgICAgICBzaXplOiBkZWYuY2hvcmQubGVuZ3RoIC0gcGFkZGluZyAqIDIsXG4gICAgICAgICAgICAgICAgICAgIHg6IGRlZi54LFxuICAgICAgICAgICAgICAgICAgICB5OiBkZWYueVxuICAgICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgICAgY29uc3QgdGV4dCA9IDx0ZXh0XG4gICAgICAgICAgICAgICAgICAgIHggPSB7IGRlZi54IH1cbiAgICAgICAgICAgICAgICAgICAgeSA9IHsgZGVmLnkgfVxuICAgICAgICAgICAgICAgICAgICBmb250LXNpemU9XCIzMFwiXG4gICAgICAgICAgICAgICAgICAgIGZpbGw9XCJibGFja1wiXG4gICAgICAgICAgICAgICAgICAgIHN0eWxlPVwidXNlci1zZWxlY3Q6IG5vbmU7IGN1cnNvcjogcG9pbnRlcjsgZG9taW5hbnQtYmFzZWxpbmU6IGNlbnRyYWw7IHRleHQtYW5jaG9yOiBtaWRkbGU7XCJcbiAgICAgICAgICAgICAgIC8+XG5cbiAgICAgICAgICAgICAgIGlmICggYnRuLmZvbnRGYW1pbHkgIT0gdW5kZWZpbmVkIClcbiAgICAgICAgICAgICAgICAgICAgdGV4dC5zZXRBdHRyaWJ1dGUgKCBcImZvbnQtZmFtaWx5XCIsIGJ0bi5mb250RmFtaWx5IClcblxuICAgICAgICAgICAgICAgdGV4dC5pbm5lckhUTUwgPSBidG4uaWNvblxuXG4gICAgICAgICAgICAgICBncm91cC5hcHBlbmQgKCBjaXJjbGUgKVxuICAgICAgICAgICAgICAgZ3JvdXAuYXBwZW5kICggdGV4dCApXG5cbiAgICAgICAgICAgICAgIGJ1dHR1bnMucHVzaCAoIGdyb3VwIGFzIFNWR0VsZW1lbnQgKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiBidXR0dW5zXG4gICAgIH1cbn1cblxuIiwiXG5pbXBvcnQgeyB4bm9kZSwgQ29tcG9uZW50LCBkZWZpbmUgfSBmcm9tIFwiLi4vLi4vaW5kZXguanNcIlxuaW1wb3J0ICogYXMgZGIgZnJvbSBcIi4uLy4uLy4uL0FwcGxpY2F0aW9uL0RhdGEvZGIuanNcIlxuXG5kZWNsYXJlIGdsb2JhbFxue1xuXG4gICAgIGV4cG9ydCBpbnRlcmZhY2UgJFBlcnNvblZpZXdlciBleHRlbmRzICRDb21wb25lbnRcbiAgICAge1xuICAgICAgICAgIHR5cGU6IFwicGVyc29uLXZpZXdlclwiXG4gICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFBlcnNvblZpZXdlZXIgZXh0ZW5kcyBDb21wb25lbnQgPCRQZXJzb25WaWV3ZXI+XG57XG4gICAgIGRpc3BsYXkgKCBwZXJzb246ICRQZXJzb24gKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgY2FyZCA9IDxkaXYgY2xhc3M9XCJ3My1jYXJkLTQgcGVyc29uLWNhcmRcIj5cbiAgICAgICAgICAgICAgIDxpbWcgc3JjPXsgcGVyc29uLmF2YXRhciB9IGFsdD1cIkF2YXRhclwiLz5cbiAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJ3My1jb250YWluZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgPGg0PlxuICAgICAgICAgICAgICAgICAgICAgICAgIDxiPnsgcGVyc29uLmZpcnN0TmFtZSB9PC9iPlxuICAgICAgICAgICAgICAgICAgICA8L2g0PlxuICAgICAgICAgICAgICAgICAgICA8bGFiZWw+XG4gICAgICAgICAgICAgICAgICAgICAgICAgPGI+eyBwZXJzb24uaXNDYXB0YWluID8gXCJFeHBlcnRcIiA6IG51bGwgfTwvYj5cbiAgICAgICAgICAgICAgICAgICAgPC9sYWJlbD5cbiAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuXG5cbiAgICAgICAgICB0aGlzLmNvbnRhaW5lci5pbm5lckhUTUwgPSBcIlwiXG4gICAgICAgICAgdGhpcy5jb250YWluZXIuYXBwZW5kICggY2FyZCApXG4gICAgIH1cbn1cblxuZGVmaW5lICggUGVyc29uVmlld2Vlciwge1xuICAgICBjb250ZXh0OiBcImNvbmNlcHQtdWlcIixcbiAgICAgdHlwZSAgIDogXCJwZXJzb24tdmlld2VyXCIsXG4gICAgIGlkICAgICA6IHVuZGVmaW5lZCxcbn0pXG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi90eXBlcy5kLnRzXCIgLz5cblxuaW1wb3J0IHsgRGF0YWJhc2UgfSBmcm9tIFwiLi4vLi4vRGF0YS9pbmRleC5qc1wiXG5pbXBvcnQgeyBXcml0YWJsZSwgT3B0aW9uYWwgfSBmcm9tIFwiLi4vLi4vTGliL2luZGV4LmpzXCJcblxuY29uc3QgQ09OVEVYVCA9IFwiY29uY2VwdC1kYXRhXCJcbmNvbnN0IERhdGEgPSBuZXcgRGF0YWJhc2UgKClcblxudHlwZSAkSW4gPCQgZXh0ZW5kcyAkVGhpbmcgPSAkVGhpbmc+ID0gT3B0aW9uYWwgPCQsIFwiY29udGV4dFwiPlxuXG5mdW5jdGlvbiBub3JtYWxpemUgKCBub2RlOiAkSW4gKVxue1xuICAgICBpZiAoIFwiY29udGV4dFwiIGluIG5vZGUgKVxuICAgICB7XG4gICAgICAgICAgaWYgKCBub2RlLmNvbnRleHQgIT09IENPTlRFWFQgKVxuICAgICAgICAgICAgICAgdGhyb3cgXCJCYWQgY29udGV4dCB2YWx1ZVwiXG4gICAgIH1cbiAgICAgZWxzZVxuICAgICB7XG4gICAgICAgICAgKG5vZGUgYXMgV3JpdGFibGUgPCROb2RlPikuY29udGV4dCA9IENPTlRFWFRcbiAgICAgfVxuXG4gICAgIHJldHVybiBub2RlIGFzICROb2RlXG59XG5cblxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0RGF0YSA8JCBleHRlbmRzICRUaGluZz4gKCBub2RlOiAkSW4gKTogJFxuZXhwb3J0IGZ1bmN0aW9uIGdldERhdGEgPCQgZXh0ZW5kcyAkVGhpbmc+ICggLi4uIHBhdGg6IHN0cmluZyBbXSApOiAkXG5leHBvcnQgZnVuY3Rpb24gZ2V0RGF0YSAoKVxue1xuICAgICBpZiAoIGFyZ3VtZW50cy5sZW5ndGggPT0gMCApXG4gICAgICAgICAgcmV0dXJuXG5cbiAgICAgaWYgKCBhcmd1bWVudHMubGVuZ3RoID09IDEgKVxuICAgICAgICAgIHJldHVybiBEYXRhLmdldCAoIG5vcm1hbGl6ZSAoIGFyZ3VtZW50cyBbMF0gKSApXG4gICAgIGVsc2VcbiAgICAgICAgICByZXR1cm4gRGF0YS5nZXQgKCBDT05URVhULCAuLi4gYXJndW1lbnRzIClcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldERhdGEgPCQgZXh0ZW5kcyAkVGhpbmc+ICggbm9kZTogJEluIDwkPiApXG57XG4gICAgIERhdGEuc2V0ICggbm9ybWFsaXplICggbm9kZSApIClcbn1cblxuXG5leHBvcnQgZnVuY3Rpb24gY291bnREYXRhICggdHlwZTogc3RyaW5nIClcbntcbiAgICAgcmV0dXJuIERhdGEuY291bnQgKCBcImNvbmNlcHQtZGF0YVwiLCB0eXBlIClcbn1cbiIsIlxuaW1wb3J0IHsgeG5vZGUsIENvbXBvbmVudCwgZGVmaW5lIH0gZnJvbSBcIi4uLy4uL2luZGV4LmpzXCJcbmltcG9ydCAqIGFzIGRiIGZyb20gXCIuLi8uLi8uLi9BcHBsaWNhdGlvbi9EYXRhL2RiLmpzXCJcblxuZGVjbGFyZSBnbG9iYWxcbntcbiAgICAgZXhwb3J0IGludGVyZmFjZSAkU2tpbGxWaWV3ZXIgZXh0ZW5kcyAkQ29tcG9uZW50XG4gICAgIHtcbiAgICAgICAgICB0eXBlOiBcInNraWxsLXZpZXdlclwiXG4gICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFNraWxsVmlld2VyIGV4dGVuZHMgQ29tcG9uZW50IDwkU2tpbGxWaWV3ZXI+XG57XG4gICAgIGRpc3BsYXkgKCBza2lsbDogJFNraWxsIClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHRhcmdldCA9IDxkaXYgY2xhc3M9XCJwZW9wbGVcIj48L2Rpdj5cblxuICAgICAgICAgIGZvciAoIGNvbnN0IG5hbWUgb2Ygc2tpbGwuaXRlbXMgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNvbnN0IHBlcnNvbiA9IGRiLmdldERhdGEgPCRQZXJzb24+ICggbmFtZSApXG5cbiAgICAgICAgICAgICAgIGNvbnN0IGNhcmQgPSA8ZGl2IGNsYXNzPVwidzMtY2FyZC00IHBlcnNvbi1jYXJkXCI+XG4gICAgICAgICAgICAgICAgICAgIDxpbWcgc3JjPXsgcGVyc29uLmF2YXRhciB9IGFsdD1cIkF2YXRhclwiLz5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInczLWNvbnRhaW5lclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgIDxoND5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxiPnsgcGVyc29uLmZpcnN0TmFtZSB9PC9iPlxuICAgICAgICAgICAgICAgICAgICAgICAgIDwvaDQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgPGxhYmVsPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGI+eyBwZXJzb24uaXNDYXB0YWluID8gXCJFeHBlcnRcIiA6IG51bGwgfTwvYj5cbiAgICAgICAgICAgICAgICAgICAgICAgICA8L2xhYmVsPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgICB0YXJnZXQuYXBwZW5kICggY2FyZCApXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdGhpcy5jb250YWluZXIuY2xhc3NMaXN0LmFkZCAoIFwiY29udGFpbmVyXCIgKVxuICAgICAgICAgIHRoaXMuY29udGFpbmVyLmlubmVySFRNTCA9IFwiXCJcbiAgICAgICAgICB0aGlzLmNvbnRhaW5lci5hcHBlbmQgKCA8aDE+eyBza2lsbC5pZCB9PC9oMT4gKVxuICAgICAgICAgIHRoaXMuY29udGFpbmVyLmFwcGVuZCAoIDxwPnsgc2tpbGwuZGVzY3JpcHRpb24gfTwvcD4gKVxuICAgICAgICAgIHRoaXMuY29udGFpbmVyLmFwcGVuZCAoIHRhcmdldCApXG5cbiAgICAgICAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vTG9yRE9uaVgvanNvbi12aWV3ZXIvYmxvYi9tYXN0ZXIvc3JjL2pzb24tdmlld2VyLmpzXG4gICAgICAgICAgdGhpcy5jb250YWluZXIuYXBwZW5kICggPHByZT57IEpTT04uc3RyaW5naWZ5ICggc2tpbGwsIG51bGwsIDMgKSB9PC9wcmU+IClcbiAgICAgfVxufVxuXG5kZWZpbmUgKCBTa2lsbFZpZXdlciwge1xuICAgICBjb250ZXh0OiBcImNvbmNlcHQtdWlcIixcbiAgICAgdHlwZSAgIDogXCJza2lsbC12aWV3ZXJcIixcbiAgICAgaWQgICAgIDogdW5kZWZpbmVkLFxufSlcbiIsIlxuLy9pbXBvcnQgKiBhcyBmYWJyaWMgZnJvbSBcImZhYnJpYy9mYWJyaWMtaW1wbC5qc1wiXG5cbmltcG9ydCB7ICRHZW9tZXRyeSB9IGZyb20gXCIuL2dlb21ldHJ5LmpzXCJcblxuZXhwb3J0IGludGVyZmFjZSBUZXh0RGVmaW5pdGlvbiBleHRlbmRzICRHZW9tZXRyeVxue1xuICAgICB0ZXh0OiBzdHJpbmdcbn1cblxuZXhwb3J0IGludGVyZmFjZSBQYXRoRGVmaW5pdGlvbiBleHRlbmRzICRHZW9tZXRyeVxue1xuICAgICBwYXRoOiBzdHJpbmdcbn1cblxuY29uc3QgZmFicmljX2Jhc2Vfb2J0aW9uczogZmFicmljLklPYmplY3RPcHRpb25zID0ge1xuICAgICBsZWZ0ICAgOiAwLFxuICAgICB0b3AgICAgOiAwLFxuICAgICBvcmlnaW5YOiBcImNlbnRlclwiLFxuICAgICBvcmlnaW5ZOiBcImNlbnRlclwiLFxufVxuXG5leHBvcnQgY29uc3QgRmFjdG9yeSA9XG57XG4gICAgIGdyb3VwICggZGVmOiAkR2VvbWV0cnksIHNpemU6IG51bWJlciwgb3B0OiBmYWJyaWMuSUNpcmNsZU9wdGlvbnMgKVxuICAgICB7XG4gICAgICAgICAgcmV0dXJuIG5ldyBmYWJyaWMuR3JvdXAgKCB1bmRlZmluZWQsXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgLi4uIGZhYnJpY19iYXNlX29idGlvbnMsXG4gICAgICAgICAgICAgICAuLi4gb3B0LFxuICAgICAgICAgICAgICAgd2lkdGg6IHNpemUsXG4gICAgICAgICAgICAgICBoZWlnaHQ6IHNpemUsXG4gICAgICAgICAgfSlcbiAgICAgfSxcblxuICAgICAvLyBUbyBnZXQgdHJpYW5nbGUsIHNxdWFyZSwgW3BhbnRhfGhleGFdZ29uIHBvaW50c1xuICAgICAvL1xuICAgICAvLyB2YXIgYSA9IE1hdGguUEkqMi80XG4gICAgIC8vIGZvciAoIHZhciBpID0gMCA7IGkgIT0gNCA7IGkrKyApXG4gICAgIC8vICAgICBjb25zb2xlLmxvZyAoIGBbICR7IE1hdGguc2luKGEqaSkgfSwgJHsgTWF0aC5jb3MoYSppKSB9IF1gIClcblxuICAgICBjaXJjbGUgKCBkZWY6ICRHZW9tZXRyeSwgc2l6ZTogbnVtYmVyLCBvcHQ6IGZhYnJpYy5JQ2lyY2xlT3B0aW9ucyApXG4gICAgIHtcblxuICAgICAgICAgIHJldHVybiBuZXcgZmFicmljLkNpcmNsZSAoXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgLi4uIGZhYnJpY19iYXNlX29idGlvbnMsXG4gICAgICAgICAgICAgICAuLi4gb3B0LFxuICAgICAgICAgICAgICAgcmFkaXVzOiBzaXplIC8gMixcbiAgICAgICAgICB9KVxuICAgICB9LFxuXG4gICAgIHRyaWFuZ2xlICggZGVmOiAkR2VvbWV0cnksIHNpemU6IG51bWJlciwgb3B0OiBmYWJyaWMuSVRyaWFuZ2xlT3B0aW9ucyApXG4gICAgIHtcbiAgICAgICAgICBjb25zdCBwb2ludHMgPSBbXVxuICAgICAgICAgIGNvbnN0IHNjYWxlID0gMS4yXG4gICAgICAgICAgY29uc3QgciA9IHNpemUgLyAyICogc2NhbGVcblxuICAgICAgICAgIGZvciAoIGNvbnN0IHAgb2YgW1xuICAgICAgICAgICAgICAgWyAwLCAxIF0sXG4gICAgICAgICAgICAgICBbIDAuODY2MDI1NDAzNzg0NDM4NywgLTAuNDk5OTk5OTk5OTk5OTk5OCBdLFxuICAgICAgICAgICAgICAgWyAtMC44NjYwMjU0MDM3ODQ0Mzg1LCAtMC41MDAwMDAwMDAwMDAwMDA0IF1cbiAgICAgICAgICBdKSBwb2ludHMucHVzaCAoeyB4OiBwWzBdICogciwgeTogcFsxXSAqIHIgfSlcblxuICAgICAgICAgIHJldHVybiBuZXcgZmFicmljLlBvbHlnb24gKCBwb2ludHMsIHtcbiAgICAgICAgICAgICAgIC4uLiBmYWJyaWNfYmFzZV9vYnRpb25zLFxuICAgICAgICAgICAgICAgLi4uIG9wdCxcbiAgICAgICAgICAgICAgIGFuZ2xlOiAxODAsXG4gICAgICAgICAgfSlcbiAgICAgfSxcblxuXG4gICAgIHNxdWFyZSAoIGRlZjogJEdlb21ldHJ5LCBzaXplOiBudW1iZXIsIG9wdDogZmFicmljLklSZWN0T3B0aW9ucyApXG4gICAgIHtcbiAgICAgICAgICBjb25zdCBzY2FsZSA9IDAuOVxuICAgICAgICAgIHJldHVybiBuZXcgZmFicmljLlJlY3QgKFxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIC4uLiBmYWJyaWNfYmFzZV9vYnRpb25zLFxuICAgICAgICAgICAgICAgLi4uIG9wdCxcbiAgICAgICAgICAgICAgIHdpZHRoIDogc2l6ZSAqIHNjYWxlLFxuICAgICAgICAgICAgICAgaGVpZ2h0OiBzaXplICogc2NhbGUsXG4gICAgICAgICAgfSlcbiAgICAgfSxcblxuICAgICBwYW50YWdvbiAoIGRlZjogJEdlb21ldHJ5LCBzaXplOiBudW1iZXIsIG9wdDogZmFicmljLklPYmplY3RPcHRpb25zIClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHBvaW50cyA9IFtdXG4gICAgICAgICAgY29uc3Qgc2NhbGUgPSAxLjFcbiAgICAgICAgICBjb25zdCByID0gc2l6ZSAvIDIgKiBzY2FsZVxuXG4gICAgICAgICAgZm9yICggY29uc3QgcCBvZiBbXG4gICAgICAgICAgICAgICBbIDAsIDEgXSxcbiAgICAgICAgICAgICAgIFsgMC45NTEwNTY1MTYyOTUxNTM1LCAwLjMwOTAxNjk5NDM3NDk0NzQ1IF0sXG4gICAgICAgICAgICAgICBbIDAuNTg3Nzg1MjUyMjkyNDczMiwgLTAuODA5MDE2OTk0Mzc0OTQ3MyBdLFxuICAgICAgICAgICAgICAgWyAtMC41ODc3ODUyNTIyOTI0NzMsIC0wLjgwOTAxNjk5NDM3NDk0NzUgXSxcbiAgICAgICAgICAgICAgIFsgLTAuOTUxMDU2NTE2Mjk1MTUzNiwgMC4zMDkwMTY5OTQzNzQ5NDcyMyBdXG4gICAgICAgICAgXSkgcG9pbnRzLnB1c2ggKHsgeDogcFswXSAqIHIsIHk6IHBbMV0gKiByIH0pXG5cbiAgICAgICAgICByZXR1cm4gbmV3IGZhYnJpYy5Qb2x5Z29uICggcG9pbnRzLCB7XG4gICAgICAgICAgICAgICAuLi4gZmFicmljX2Jhc2Vfb2J0aW9ucyxcbiAgICAgICAgICAgICAgIC4uLiBvcHQsXG4gICAgICAgICAgICAgICBhbmdsZTogMTgwLFxuICAgICAgICAgIH0pXG4gICAgIH0sXG5cbiAgICAgaGV4YWdvbiAoIGRlZjogJEdlb21ldHJ5LCBzaXplOiBudW1iZXIsIG9wdDogZmFicmljLklPYmplY3RPcHRpb25zIClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHBvaW50cyA9IFtdXG4gICAgICAgICAgY29uc3Qgc2NhbGUgPSAxLjFcbiAgICAgICAgICBjb25zdCByID0gc2l6ZSAvIDIgKiBzY2FsZVxuXG4gICAgICAgICAgZm9yICggY29uc3QgcCBvZiBbXG4gICAgICAgICAgICAgICBbIDAsIDEgXSxcbiAgICAgICAgICAgICAgIFsgMC44NjYwMjU0MDM3ODQ0Mzg2LCAwLjUwMDAwMDAwMDAwMDAwMDEgXSxcbiAgICAgICAgICAgICAgIFsgMC44NjYwMjU0MDM3ODQ0Mzg3LCAtMC40OTk5OTk5OTk5OTk5OTk4IF0sXG4gICAgICAgICAgICAgICBbIDEuMjI0NjQ2Nzk5MTQ3MzUzMmUtMTYsIC0xIF0sXG4gICAgICAgICAgICAgICBbIC0wLjg2NjAyNTQwMzc4NDQzODUsIC0wLjUwMDAwMDAwMDAwMDAwMDQgXSxcbiAgICAgICAgICAgICAgIFsgLTAuODY2MDI1NDAzNzg0NDM5LCAwLjQ5OTk5OTk5OTk5OTk5OTMzIF0sXG4gICAgICAgICAgXSkgcG9pbnRzLnB1c2ggKHsgeDogcFswXSAqIHIsIHk6IHBbMV0gKiByIH0pXG5cbiAgICAgICAgICByZXR1cm4gbmV3IGZhYnJpYy5Qb2x5Z29uICggcG9pbnRzLCB7XG4gICAgICAgICAgICAgICAuLi4gZmFicmljX2Jhc2Vfb2J0aW9ucyxcbiAgICAgICAgICAgICAgIC4uLiBvcHQsXG4gICAgICAgICAgICAgICBhbmdsZTogOTAsXG4gICAgICAgICAgfSlcbiAgICAgfSxcblxuXG4gICAgIHRleHQgKCBkZWY6IFRleHREZWZpbml0aW9uLCBzaXplOiBudW1iZXIsIG9wdDogZmFicmljLlRleHRPcHRpb25zIClcbiAgICAge1xuICAgICAgICAgIHJldHVybiBuZXcgZmFicmljLlRleHQgKCBcIi4uLlwiLCB7XG4gICAgICAgICAgICAgICAuLi4gZmFicmljX2Jhc2Vfb2J0aW9ucyxcbiAgICAgICAgICAgICAgIC4uLiBvcHQsXG4gICAgICAgICAgICAgICBmb250U2l6ZTogc2l6ZSxcbiAgICAgICAgICB9KVxuICAgICB9LFxuXG4gICAgIHRleHRib3ggKCBkZWY6IFRleHREZWZpbml0aW9uLCBzaXplOiBudW1iZXIsIG9wdDogZmFicmljLlRleHRPcHRpb25zIClcbiAgICAge1xuICAgICAgICAgIHJldHVybiBuZXcgZmFicmljLlRleHRib3ggKCBcIi4uLlwiLCB7XG4gICAgICAgICAgICAgICAuLi4gZmFicmljX2Jhc2Vfb2J0aW9ucyxcbiAgICAgICAgICAgICAgIC4uLiBvcHQsXG4gICAgICAgICAgICAgICBmb250U2l6ZTogc2l6ZSxcbiAgICAgICAgICB9KVxuICAgICB9LFxuXG5cbiAgICAgcGF0aCAoIGRlZjogUGF0aERlZmluaXRpb24sIHNpemU6IG51bWJlciwgb3B0OiBmYWJyaWMuSU9iamVjdE9wdGlvbnMgKVxuICAgICB7XG4gICAgICAgICAgcmV0dXJuIG5ldyBmYWJyaWMuUGF0aCAoIGRlZi5wYXRoLFxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIC4uLiBmYWJyaWNfYmFzZV9vYnRpb25zLFxuICAgICAgICAgICAgICAgLi4uIG9wdCxcbiAgICAgICAgICAgICAgIHNjYWxlWDogc2l6ZSAvIDEwMCwgLy8gRW4gc3VwcG9zYW50IHF1ZSBsZSB2aWV3Qm94XG4gICAgICAgICAgICAgICBzY2FsZVk6IHNpemUgLyAxMDAsIC8vIGVzdCBcIjAgMCAxMDAgMTAwXCJcbiAgICAgICAgICB9KVxuICAgICB9LFxufVxuXG5cbiIsIlxuLy9pbXBvcnQgKiBhcyBmYWJyaWMgZnJvbSBcImZhYnJpYy9mYWJyaWMtaW1wbC5qc1wiXG5cbmltcG9ydCB7ICRTaGFwZSwgU2hhcGUgfSBmcm9tIFwiLi4vRWxlbWVudC9zaGFwZS5qc1wiXG5pbXBvcnQgeyBGYWN0b3J5IH0gZnJvbSBcIi4vZmFjdG9yeS5qc1wiXG5cbmV4cG9ydCB0eXBlIEdlb21ldHJ5TmFtZXMgPSBrZXlvZiB0eXBlb2YgRmFjdG9yeVxuXG5leHBvcnQgaW50ZXJmYWNlICRHZW9tZXRyeVxue1xuICAgICBzaGFwZTogR2VvbWV0cnlOYW1lc1xuICAgICB4ICAgICAgICAgOiBudW1iZXJcbiAgICAgeSAgICAgICAgIDogbnVtYmVyXG5cbiAgICAgYm9yZGVyV2lkdGggICAgOiBudW1iZXJcbiAgICAgYm9yZGVyQ29sb3IgICAgOiBzdHJpbmdcblxuICAgICBiYWNrZ3JvdW5kQ29sb3IgOiBzdHJpbmdcbiAgICAgYmFja2dyb3VuZEltYWdlIDogc3RyaW5nXG4gICAgIGJhY2tncm91bmRSZXBlYXQ6IGJvb2xlYW5cbn1cblxuZXhwb3J0IGNsYXNzIEdlb21ldHJ5IDxUIGV4dGVuZHMgR2VvbWV0cnlOYW1lcyA9IEdlb21ldHJ5TmFtZXM+XG57XG4gICAgIGNvbmZpZzogJEdlb21ldHJ5XG4gICAgIG9iamVjdDogUmV0dXJuVHlwZSA8dHlwZW9mIEZhY3RvcnkgW1RdPlxuXG4gICAgIGNvbnN0cnVjdG9yICggcmVhZG9ubHkgb3duZXI6IFNoYXBlIClcbiAgICAge1xuICAgICAgICAgIHRoaXMuY29uZmlnID0gb3duZXIuY29uZmlnXG4gICAgICAgICAgdGhpcy51cGRhdGVTaGFwZSAoKVxuICAgICB9XG5cbiAgICAgdXBkYXRlICggb3B0aW9uczogUGFydGlhbCA8JEdlb21ldHJ5PiApXG4gICAgIHtcbiAgICAgICAgICBPYmplY3QuYXNzaWduICggdGhpcy5jb25maWcsIG9wdGlvbnMgKVxuXG4gICAgICAgICAgaWYgKCBcInNoYXBlXCIgaW4gb3B0aW9ucyApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgdGhpcy51cGRhdGVTaGFwZSAoKVxuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIGlmICggXCJiYWNrZ3JvdW5kSW1hZ2VcIiBpbiBvcHRpb25zIHx8IFwiYmFja2dyb3VuZFJlcGVhdFwiIGluIG9wdGlvbnMgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHRoaXMudXBkYXRlQmFja2dyb3VuZEltYWdlICgpXG4gICAgICAgICAgfVxuICAgICB9XG5cbiAgICAgdXBkYXRlUG9zaXRpb24gKClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHsgY29uZmlnLCBvYmplY3QgfSA9IHRoaXNcblxuICAgICAgICAgIDsob2JqZWN0IGFzIGZhYnJpYy5PYmplY3QpLnNldCAoe1xuICAgICAgICAgICAgICAgbGVmdDogY29uZmlnLngsXG4gICAgICAgICAgICAgICB0b3AgOiBjb25maWcueSxcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5zZXRDb29yZHMgKClcbiAgICAgfVxuXG4gICAgIHVwZGF0ZVNpemUgKClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHsgb3duZXIsIGNvbmZpZywgb2JqZWN0IH0gPSB0aGlzXG5cbiAgICAgICAgICBjb25zdCBzaXplID0gb3duZXIuZGlzcGxheVNpemUgKClcblxuICAgICAgICAgIGlmICggY29uZmlnLnNoYXBlID09IFwiY2lyY2xlXCIgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIChvYmplY3QgYXMgZmFicmljLkNpcmNsZSkuc2V0ICh7XG4gICAgICAgICAgICAgICAgICAgIHJhZGl1czogc2l6ZSAvIDJcbiAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICAob2JqZWN0IGFzIGZhYnJpYy5PYmplY3QpLnNldCAoe1xuICAgICAgICAgICAgICAgICAgICB3aWR0aCA6IHNpemUsXG4gICAgICAgICAgICAgICAgICAgIGhlaWdodDogc2l6ZSxcbiAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgb2JqZWN0LnNldENvb3JkcyAoKVxuICAgICB9XG5cbiAgICAgdXBkYXRlU2hhcGUgKCBzaGFwZT86IEdlb21ldHJ5TmFtZXMgKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgeyBjb25maWcsIG93bmVyIH0gPSB0aGlzXG5cbiAgICAgICAgICBpZiAoIGFyZ3VtZW50cy5sZW5ndGggPT0gMCApXG4gICAgICAgICAgICAgICBzaGFwZSA9IGNvbmZpZy5zaGFwZVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgIGNvbmZpZy5zaGFwZSA9IHNoYXBlXG5cbiAgICAgICAgICBpZiAoIG93bmVyLmdyb3VwICE9IHVuZGVmaW5lZCAmJiB0aGlzLm9iamVjdCAhPSB1bmRlZmluZWQgKVxuICAgICAgICAgICAgICAgb3duZXIuZ3JvdXAucmVtb3ZlICggdGhpcy5vYmplY3QgKVxuXG4gICAgICAgICAgY29uc3Qgb2JqID0gdGhpcy5vYmplY3RcbiAgICAgICAgICAgICAgICAgICAgPSBGYWN0b3J5IFtjb25maWcuc2hhcGUgYXMgYW55XSAoIGNvbmZpZywgb3duZXIuZGlzcGxheVNpemUgKCksIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICBsZWZ0ICAgICAgIDogMCwgLy9jb25maWcueCxcbiAgICAgICAgICAgICAgICAgICAgICAgICB0b3AgICAgICAgIDogMCwgLy9jb25maWcueSxcbiAgICAgICAgICAgICAgICAgICAgICAgICBvcmlnaW5YICAgIDogXCJjZW50ZXJcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICBvcmlnaW5ZICAgIDogXCJjZW50ZXJcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICBmaWxsICAgICAgIDogY29uZmlnLmJhY2tncm91bmRDb2xvcixcbiAgICAgICAgICAgICAgICAgICAgICAgICBzdHJva2UgICAgIDogY29uZmlnLmJvcmRlckNvbG9yLFxuICAgICAgICAgICAgICAgICAgICAgICAgIHN0cm9rZVdpZHRoOiBjb25maWcuYm9yZGVyV2lkdGgsXG4gICAgICAgICAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICBvd25lci5ncm91cC5hZGQgKCBvYmogKVxuICAgICAgICAgIG9iai5zZW5kVG9CYWNrICgpXG5cbiAgICAgICAgICBpZiAoIGNvbmZpZy5iYWNrZ3JvdW5kSW1hZ2UgIT0gdW5kZWZpbmVkIClcbiAgICAgICAgICAgICAgIHRoaXMudXBkYXRlQmFja2dyb3VuZEltYWdlICgpXG5cbiAgICAgICAgICBpZiAoIG9iai5jYW52YXMgIT0gdW5kZWZpbmVkIClcbiAgICAgICAgICAgICAgIG9iai5jYW52YXMucmVxdWVzdFJlbmRlckFsbCAoKVxuXG4gICAgIH1cblxuICAgICB1cGRhdGVCYWNrZ3JvdW5kSW1hZ2UgKCBwYXRoPzogc3RyaW5nIClcbiAgICAge1xuICAgICAgICAgIGlmICggYXJndW1lbnRzLmxlbmd0aCA9PSAwIClcbiAgICAgICAgICAgICAgIHBhdGggPSB0aGlzLmNvbmZpZy5iYWNrZ3JvdW5kSW1hZ2VcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICB0aGlzLmNvbmZpZy5iYWNrZ3JvdW5kSW1hZ2UgPSBwYXRoXG5cbiAgICAgICAgICBpZiAoIHR5cGVvZiBwYXRoID09IFwic3RyaW5nXCIgJiYgcGF0aC5sZW5ndGggPiAwIClcbiAgICAgICAgICAgICAgIGZhYnJpYy51dGlsLmxvYWRJbWFnZSAoIHBhdGgsIHRoaXMub25fcGF0dGVybi5iaW5kICh0aGlzKSApXG4gICAgIH1cblxuICAgICBwcml2YXRlIG9uX3BhdHRlcm4gKCBkaW1nOiBIVE1MSW1hZ2VFbGVtZW50IClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHsgb3duZXIgfSA9IHRoaXNcblxuICAgICAgICAgIGNvbnN0IGZhY3RvciA9IGRpbWcud2lkdGggPCBkaW1nLmhlaWdodFxuICAgICAgICAgICAgICAgICAgICAgICAgID8gb3duZXIuZGlzcGxheVNpemUgKCkgLyBkaW1nLndpZHRoXG4gICAgICAgICAgICAgICAgICAgICAgICAgOiBvd25lci5kaXNwbGF5U2l6ZSAoKSAvIGRpbWcuaGVpZ2h0XG5cbiAgICAgICAgICA7KHRoaXMub2JqZWN0IGFzIGFueSkuc2V0ICh7XG4gICAgICAgICAgICAgICBmaWxsOiBuZXcgZmFicmljLlBhdHRlcm4gKHtcbiAgICAgICAgICAgICAgICAgICAgc291cmNlOiBkaW1nLFxuICAgICAgICAgICAgICAgICAgICByZXBlYXQ6IFwibm8tcmVwZWF0XCIsXG4gICAgICAgICAgICAgICAgICAgIHBhdHRlcm5UcmFuc2Zvcm06IFtcbiAgICAgICAgICAgICAgICAgICAgICAgICBmYWN0b3IsIDAsIDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgZmFjdG9yLCAwLCAwLFxuICAgICAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgICB9KVxuICAgICAgICAgIH0pXG4gICAgICAgICAgLnNldENvb3JkcyAoKVxuXG4gICAgICAgICAgaWYgKCB0aGlzLm9iamVjdC5jYW52YXMgKVxuICAgICAgICAgICAgICAgdGhpcy5vYmplY3QuY2FudmFzLnJlbmRlckFsbCAoKVxuICAgICB9XG59XG4iLCIvLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi8uLi90eXBpbmdzLmQudHNcIiAvPlxuLy9pbXBvcnQgKiBhcyBmYWJyaWMgZnJvbSBcImZhYnJpYy9mYWJyaWMtaW1wbC5qc1wiXG5cbmltcG9ydCB7IEdlb21ldHJ5IH0gZnJvbSBcIi4uL0dlb21ldHJ5L2dlb21ldHJ5LmpzXCJcblxuaW1wb3J0IHsgQ3RvciBhcyBEYXRhQ3RvciB9IGZyb20gXCIuLi8uLi8uLi9EYXRhL2luZGV4LmpzXCJcbmltcG9ydCB7ICRHZW9tZXRyeSB9IGZyb20gXCIuLi9HZW9tZXRyeS9nZW9tZXRyeS5qc1wiXG5cbmV4cG9ydCBpbnRlcmZhY2UgJFNoYXBlRXZlbnRzIDxEIGV4dGVuZHMgJE5vZGUgPSBhbnk+XG57XG4gICAgIG9uQ3JlYXRlOiAoIGVudGl0eTogRCwgYXNwZWN0OiBTaGFwZSApID0+IHZvaWQsXG4gICAgIG9uRGVsZXRlOiAoIGVudGl0eTogRCwgc2hhcGU6IFNoYXBlICkgPT4gdm9pZCxcbiAgICAgb25Ub3VjaDogKCBhc3BlY3Q6IFNoYXBlICkgPT4gdm9pZFxufVxuXG5leHBvcnQgaW50ZXJmYWNlICRTaGFwZSA8RCBleHRlbmRzICRUaGluZyA9ICRUaGluZz4gZXh0ZW5kcyAkTm9kZSwgJEdlb21ldHJ5LCAkU2hhcGVFdmVudHNcbntcbiAgICAgY29udGV4dDogXCJjb25jZXB0LWFzcGVjdFwiXG5cbiAgICAgZGF0YTogRFxuXG4gICAgIG1pblNpemUgICA6IG51bWJlclxuICAgICBzaXplT2Zmc2V0OiBudW1iZXJcbiAgICAgc2l6ZUZhY3RvcjogbnVtYmVyXG59XG5cbmV4cG9ydCB0eXBlIEN0b3IgPERhdGEgZXh0ZW5kcyAkU2hhcGUgPSAkU2hhcGUsIFQgZXh0ZW5kcyBTaGFwZSA9IFNoYXBlPlxuICAgICAgICAgICAgICAgPSBEYXRhQ3RvciA8RGF0YSwgVD5cblxuZXhwb3J0IGNsYXNzIFNoYXBlIDwkIGV4dGVuZHMgJFNoYXBlID0gJFNoYXBlPlxue1xuICAgICBkZWZhdWx0Q29uZmlnICgpOiAkU2hhcGVcbiAgICAge1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICBjb250ZXh0OiBcImNvbmNlcHQtYXNwZWN0XCIsXG4gICAgICAgICAgICAgICB0eXBlICAgOiBcInNoYXBlXCIsXG4gICAgICAgICAgICAgICBpZCAgICAgOiB1bmRlZmluZWQsXG4gICAgICAgICAgICAgICBkYXRhICAgOiB1bmRlZmluZWQsXG4gICAgICAgICAgICAgICB4ICAgICAgOiAwLFxuICAgICAgICAgICAgICAgeSAgICAgIDogMCxcbiAgICAgICAgICAgICAgIC8vc2l6ZSAgICAgIDogMjAsXG4gICAgICAgICAgICAgICBtaW5TaXplICAgOiAxLFxuICAgICAgICAgICAgICAgc2l6ZUZhY3RvcjogMSxcbiAgICAgICAgICAgICAgIHNpemVPZmZzZXQ6IDAsXG5cbiAgICAgICAgICAgICAgIHNoYXBlICAgICAgICAgICA6IFwiY2lyY2xlXCIsXG4gICAgICAgICAgICAgICBib3JkZXJDb2xvciAgICAgOiBcImdyYXlcIixcbiAgICAgICAgICAgICAgIGJvcmRlcldpZHRoICAgICA6IDUsXG5cbiAgICAgICAgICAgICAgIGJhY2tncm91bmRDb2xvciA6IFwidHJhbnNwYXJlbnRcIixcbiAgICAgICAgICAgICAgIGJhY2tncm91bmRJbWFnZSA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgIGJhY2tncm91bmRSZXBlYXQ6IGZhbHNlLFxuXG4gICAgICAgICAgICAgICBvbkNyZWF0ZSAgICAgICAgOiB1bmRlZmluZWQsXG4gICAgICAgICAgICAgICBvbkRlbGV0ZSAgICAgICAgOiB1bmRlZmluZWQsXG4gICAgICAgICAgICAgICBvblRvdWNoICAgICAgICAgOiB1bmRlZmluZWQsXG4gICAgICAgICAgfVxuICAgICB9XG5cbiAgICAgcmVhZG9ubHkgY29uZmlnOiAkXG5cbiAgICAgZ3JvdXAgPSB1bmRlZmluZWQgYXMgZmFicmljLkdyb3VwXG5cbiAgICAgcmVhZG9ubHkgYmFja2dyb3VuZDogR2VvbWV0cnlcbiAgICAgcmVhZG9ubHkgYm9yZGVyOiBHZW9tZXRyeVxuXG4gICAgIGNvbnN0cnVjdG9yICggZGF0YTogJCApXG4gICAgIHtcbiAgICAgICAgICAvL2NvbnNvbGUubG9nICggXCJVcGRhdGEgaGVyZSBTaGFwZS5kYXRhIFwiICsgZGF0YS5kYXRhIClcbiAgICAgICAgICB0aGlzLmJhY2tncm91bmQgPSB1bmRlZmluZWRcbiAgICAgICAgICB0aGlzLmJvcmRlciA9IHVuZGVmaW5lZFxuICAgICAgICAgIHRoaXMuY29uZmlnID0ge1xuICAgICAgICAgICAgICAgLi4uIHRoaXMuZGVmYXVsdENvbmZpZyAoKSxcbiAgICAgICAgICAgICAgIC4uLiBkYXRhXG4gICAgICAgICAgfVxuXG4gICAgIC8vICAgICAgdGhpcy5pbml0ICgpXG4gICAgIC8vIH1cblxuICAgICAvLyBpbml0ICgpXG4gICAgIC8vIHtcbiAgICAgICAgICBjb25zdCB7IGNvbmZpZyB9ID0gdGhpc1xuXG4gICAgICAgICAgY29uc3QgZ3JvdXAgPSB0aGlzLmdyb3VwID0gbmV3IGZhYnJpYy5Hcm91cCAoIFtdLFxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHdpZHRoICAgICAgOiB0aGlzLmRpc3BsYXlTaXplICgpLFxuICAgICAgICAgICAgICAgaGVpZ2h0ICAgICA6IHRoaXMuZGlzcGxheVNpemUgKCksXG4gICAgICAgICAgICAgICBsZWZ0ICAgICAgIDogY29uZmlnLngsXG4gICAgICAgICAgICAgICB0b3AgICAgICAgIDogY29uZmlnLnksXG4gICAgICAgICAgICAgICBoYXNCb3JkZXJzIDogdHJ1ZSwgICAgICAgICAgICAgICAgICAvLyBmYWxzZSxcbiAgICAgICAgICAgICAgIGhhc0NvbnRyb2xzOiB0cnVlLCAgICAgICAgICAgICAgICAgIC8vIGZhbHNlLFxuICAgICAgICAgICAgICAgb3JpZ2luWCAgICA6IFwiY2VudGVyXCIsXG4gICAgICAgICAgICAgICBvcmlnaW5ZICAgIDogXCJjZW50ZXJcIixcbiAgICAgICAgICB9KVxuXG4gICAgICAgICAgOyh0aGlzLmJhY2tncm91bmQgYXMgR2VvbWV0cnkpID0gbmV3IEdlb21ldHJ5ICggdGhpcyApXG4gICAgICAgICAgLy9ncm91cC5hZGQgKCB0aGlzLmJhY2tncm91bmQub2JqZWN0IClcbiAgICAgICAgICAvL3RoaXMuYmFja2dyb3VuZC5vYmplY3Quc2VuZFRvQmFjayAoKVxuXG4gICAgICAgICAgLy8gOyh0aGlzLmJvcmRlciBhcyBHZW9tZXRyeSkgPSBuZXcgR2VvbWV0cnkgKCB0aGlzLCB0aGlzLmNvbmZpZyApXG4gICAgICAgICAgLy8gZ3JvdXAuYWRkICggdGhpcy5ib3JkZXIub2JqZWN0IClcblxuICAgICAgICAgIGdyb3VwLnNldENvb3JkcyAoKVxuICAgICB9XG5cbiAgICAgZGlzcGxheVNpemUgKClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IHRoaXMuY29uZmlnXG5cbiAgICAgICAgICB2YXIgc2l6ZSA9ICgxICsgY29uZmlnLnNpemVPZmZzZXQpICogY29uZmlnLnNpemVGYWN0b3JcblxuICAgICAgICAgIGlmICggc2l6ZSA8IGNvbmZpZy5taW5TaXplIClcbiAgICAgICAgICAgICAgIHNpemUgPSBjb25maWcubWluU2l6ZVxuXG4gICAgICAgICAgcmV0dXJuIHNpemUgfHwgMVxuICAgICB9XG5cbiAgICAgdXBkYXRlU2l6ZSAoKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgeyBncm91cCwgY29uZmlnIH0gPSB0aGlzXG5cbiAgICAgICAgICBpZiAoIHRoaXMuYmFja2dyb3VuZCApXG4gICAgICAgICAgICAgICB0aGlzLmJhY2tncm91bmQudXBkYXRlU2l6ZSAoKVxuXG4gICAgICAgICAgaWYgKCB0aGlzLmJvcmRlciApXG4gICAgICAgICAgICAgICB0aGlzLmJvcmRlci51cGRhdGVTaXplICgpXG5cbiAgICAgICAgICBncm91cC5zZXQgKHtcbiAgICAgICAgICAgICAgIHdpZHRoIDogdGhpcy5kaXNwbGF5U2l6ZSAoKSxcbiAgICAgICAgICAgICAgIGhlaWdodDogdGhpcy5kaXNwbGF5U2l6ZSAoKSxcbiAgICAgICAgICB9KVxuXG4gICAgICAgICAgaWYgKCBncm91cC5jYW52YXMgKVxuICAgICAgICAgICAgICAgZ3JvdXAuY2FudmFzLnJlcXVlc3RSZW5kZXJBbGwgKClcbiAgICAgfVxuXG4gICAgIGNvb3JkcyAoKVxuICAgICB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuZ3JvdXAuZ2V0Q29vcmRzICgpXG4gICAgIH1cblxuICAgICBzZXRCYWNrZ3JvdW5kICggb3B0aW9uczogUGFydGlhbCA8JEdlb21ldHJ5PiApXG4gICAgIHtcbiAgICAgICAgICBPYmplY3QuYXNzaWduICggdGhpcy5jb25maWcsIG9wdGlvbnMgKVxuXG4gICAgICAgICAgdGhpcy5iYWNrZ3JvdW5kLnVwZGF0ZSAoIG9wdGlvbnMgKVxuXG4gICAgICAgICAgdGhpcy51cGRhdGVTaXplICgpXG4gICAgIH1cblxuICAgICBzZXRQb3NpdGlvbiAoIHg6IG51bWJlciwgeTogbnVtYmVyIClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHsgZ3JvdXAsIGNvbmZpZyB9ID0gdGhpc1xuXG4gICAgICAgICAgY29uZmlnLnggPSB4XG4gICAgICAgICAgY29uZmlnLnkgPSB5XG5cbiAgICAgICAgICBncm91cC5zZXQgKHtcbiAgICAgICAgICAgICAgIGxlZnQ6IHgsXG4gICAgICAgICAgICAgICB0b3AgOiB5XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuc2V0Q29vcmRzICgpXG5cbiAgICAgICAgICBpZiAoIGdyb3VwLmNhbnZhcyApXG4gICAgICAgICAgICAgICBncm91cC5jYW52YXMucmVxdWVzdFJlbmRlckFsbCAoKVxuICAgICB9XG5cblxuICAgICBob3ZlciAoIHVwOiBib29sZWFuIClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHRhcmdldCA9IHRoaXMuYmFja2dyb3VuZCAhPSB1bmRlZmluZWRcbiAgICAgICAgICAgICAgICAgICAgICAgICA/IHRoaXMuYmFja2dyb3VuZC5vYmplY3RcbiAgICAgICAgICAgICAgICAgICAgICAgICA6IHRoaXMuZ3JvdXBcblxuICAgICAgICAgIHRhcmdldC5zZXRTaGFkb3coICdyZ2JhKDAsMCwwLDAuMyknIClcblxuICAgICAgICAgIGZhYnJpYy51dGlsLmFuaW1hdGUoe1xuICAgICAgICAgICAgICAgc3RhcnRWYWx1ZTogdXAgPyAwIDogMSxcbiAgICAgICAgICAgICAgIGVuZFZhbHVlICA6IHVwID8gMSA6IDAsXG4gICAgICAgICAgICAgICBlYXNpbmcgICAgOiBmYWJyaWMudXRpbC5lYXNlLmVhc2VPdXRDdWJpYyxcbiAgICAgICAgICAgICAgIGJ5VmFsdWUgICA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgIGR1cmF0aW9uICA6IDEwMCxcbiAgICAgICAgICAgICAgIG9uQ2hhbmdlICA6ICggdmFsdWU6IG51bWJlciApID0+XG4gICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG9mZnNldCA9IDEgKiB2YWx1ZVxuXG4gICAgICAgICAgICAgICAgICAgIHRhcmdldC5zZXRTaGFkb3coIGAkeyBvZmZzZXQgfXB4ICR7IG9mZnNldCB9cHggJHsgMTAgKiB2YWx1ZSB9cHggcmdiYSgwLDAsMCwwLjMpYCApXG4gICAgICAgICAgICAgICAgICAgIHRhcmdldC5zY2FsZSggMSArIDAuMSAqIHZhbHVlIClcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0LmNhbnZhcy5yZXF1ZXN0UmVuZGVyQWxsICgpXG4gICAgICAgICAgICAgICB9LFxuICAgICAgICAgIH0pXG4gICAgIH1cblxuICAgICB0b0pzb24gKClcbiAgICAge1xuICAgICAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeSAoIHRoaXMuY29uZmlnIClcbiAgICAgfVxufVxuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uL3R5cGluZ3MuZC50c1wiIC8+XG4vL2ltcG9ydCAqIGFzIGZhYnJpYyBmcm9tIFwiZmFicmljL2ZhYnJpYy1pbXBsXCJcblxuaW1wb3J0IHsgRGF0YWJhc2UsIEZhY3RvcnkgfSBmcm9tIFwiLi4vLi4vRGF0YS9pbmRleC5qc1wiXG5pbXBvcnQgeyBTaGFwZSwgJFNoYXBlIH0gZnJvbSBcIi4vRWxlbWVudC9zaGFwZS5qc1wiXG5pbXBvcnQgeyBXcml0YWJsZSwgT3B0aW9uYWwgfSBmcm9tIFwiLi4vLi4vTGliL2luZGV4LmpzXCJcblxuXG5jb25zdCBDT05URVhUID0gXCJjb25jZXB0LWFzcGVjdFwiXG5jb25zdCBkYiAgICAgID0gbmV3IERhdGFiYXNlICgpXG5jb25zdCBmYWN0b3J5ID0gbmV3IEZhY3RvcnkgPFNoYXBlPiAoIGRiIClcbmNvbnN0IEFTUEVDVCAgPSBTeW1ib2wuZm9yICggXCJBU1BFQ1RcIiApXG5cbi8vIHN2Z0ZhY3Rvcnlcbi8vIGh0bWxGYWN0b3J5XG4vLyBmYWJyaWNGYWN0b3J5XG5cbi8vIHVpLmZhY3Rvcnkuc2V0ICggW1wiY29uY2VwdC11aVwiLCBcImJ1dHRvblwiLCBcImh0bWxcIiAgLCBcImJ0bjFcIl0sIGN0b3IgKVxuLy8gdWkuZmFjdG9yeS5zZXQgKCBbXCJjb25jZXB0LXVpXCIsIFwiYnV0dG9uXCIsIFwic3ZnXCIgICAsIFwiYnRuMVwiXSwgY3RvciApXG4vLyB1aS5mYWN0b3J5LnNldCAoIFtcImNvbmNlcHQtdWlcIiwgXCJidXR0b25cIiwgXCJmYWJyaWNcIiwgXCJidG4xXCJdLCBjdG9yIClcblxudHlwZSAkSW4gPCQgZXh0ZW5kcyAkU2hhcGUgPSAkU2hhcGU+ID0gT3B0aW9uYWwgPCQsIFwiY29udGV4dFwiPlxuXG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZSAoIG5vZGU6ICRJbiApXG57XG4gICAgIGlmICggXCJjb250ZXh0XCIgaW4gbm9kZSApXG4gICAgIHtcbiAgICAgICAgICBpZiAoIG5vZGUuY29udGV4dCAhPT0gQ09OVEVYVCApXG4gICAgICAgICAgICAgICB0aHJvdyBcIkJhZCBjb250ZXh0IHZhbHVlXCJcbiAgICAgfVxuICAgICBlbHNlXG4gICAgIHtcbiAgICAgICAgICAobm9kZSBhcyBXcml0YWJsZSA8JFNoYXBlPikuY29udGV4dCA9IENPTlRFWFRcbiAgICAgfVxuXG4gICAgIHJldHVybiBub2RlIGFzICRTaGFwZVxufVxuXG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRBc3BlY3QgPFQgZXh0ZW5kcyBTaGFwZT4gKCBvYmo6ICROb2RlIHwgU2hhcGUgfCBmYWJyaWMuT2JqZWN0ICk6IFQgfCB1bmRlZmluZWRcbntcbiAgICAgaWYgKCBvYmogPT0gdW5kZWZpbmVkIClcbiAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkXG5cbiAgICAgaWYgKCBvYmogaW5zdGFuY2VvZiBTaGFwZSApXG4gICAgICAgICAgcmV0dXJuIG9iaiBhcyBUXG5cbiAgICAgaWYgKCBvYmogaW5zdGFuY2VvZiBmYWJyaWMuT2JqZWN0IClcbiAgICAgICAgICByZXR1cm4gb2JqIFtBU1BFQ1RdXG5cbiAgICAgaWYgKCBmYWN0b3J5LmluU3RvY2sgKCBDT05URVhULCBvYmoudHlwZSwgb2JqLmlkICkgKVxuICAgICAgICAgIHJldHVybiBmYWN0b3J5Lm1ha2UgKCBDT05URVhULCBvYmoudHlwZSwgb2JqLmlkIClcblxuICAgICBjb25zdCBvcHRpb25zICA9IG9iai5jb250ZXh0ID09IENPTlRFWFRcbiAgICAgICAgICAgICAgICAgICAgPyBvYmogYXMgJFNoYXBlXG4gICAgICAgICAgICAgICAgICAgIDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRleHQ6IENPTlRFWFQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgdHlwZSAgIDogb2JqLnR5cGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgaWQgICAgIDogb2JqLmlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGEgICA6IG9iaixcbiAgICAgICAgICAgICAgICAgICAgfSBhcyAkU2hhcGVcblxuICAgICBpZiAoICEgaXNGaW5pdGUgKG9wdGlvbnMueCkgKVxuICAgICAgICAgIG9wdGlvbnMueCA9IDBcblxuICAgICBpZiAoICEgaXNGaW5pdGUgKG9wdGlvbnMueSkgKVxuICAgICAgICAgIG9wdGlvbnMueSA9IDBcblxuICAgICBjb25zdCBzaGFwZSA9IGZhY3RvcnkubWFrZSAoIG9wdGlvbnMgKVxuXG4gICAgIC8vIHNoYXBlLmV2ZW50cyA9IGFyZ3VtZW50cy5ldmVudHNcbiAgICAgLy8gT2JqZWN0LmFzc2lnbiAoIHNoYXBlLCBldmVudHMgKVxuXG4gICAgIC8vc2hhcGUuaW5pdCAoKVxuICAgICBzaGFwZS5ncm91cCBbQVNQRUNUXSA9IHNoYXBlXG5cbiAgICAgaWYgKCBzaGFwZS5jb25maWcub25DcmVhdGUgKVxuICAgICAgICAgIHNoYXBlLmNvbmZpZy5vbkNyZWF0ZSAoIHNoYXBlLmNvbmZpZy5kYXRhLCBzaGFwZSApXG5cbiAgICAgcmV0dXJuIHNoYXBlIGFzIFRcbn1cblxuXG5leHBvcnQgZnVuY3Rpb24gc2V0QXNwZWN0IDwkIGV4dGVuZHMgJFNoYXBlPiAoIG5vZGU6ICRJbiA8JD4gKVxue1xuICAgICBkYi5zZXQgKCBub3JtYWxpemUgKCBub2RlICkgKVxufVxuXG5cbmV4cG9ydCBmdW5jdGlvbiBkZWZpbmVBc3BlY3QgKCBjdG9yOiBuZXcgKCBkYXRhOiAkU2hhcGUgKSA9PiBTaGFwZSwgdHlwZTogc3RyaW5nIClcbntcbiAgICAgZmFjdG9yeS5fZGVmaW5lICggY3RvciwgW0NPTlRFWFQsIHR5cGVdIClcbn1cbiIsIlxuaW1wb3J0ICogYXMgZGIgZnJvbSBcIi4uLy4uL0RhdGEvZGIuanNcIlxuXG5pbXBvcnQgeyBTaGFwZSwgJFNoYXBlIH0gZnJvbSBcIi4vc2hhcGUuanNcIlxuXG5leHBvcnQgdHlwZSBCYWRnZVBvc2l0aW9uID0geyBhbmdsZTogbnVtYmVyLCBvZmZzZXQ6IG51bWJlciB9XG5cbmV4cG9ydCBjbGFzcyBCYWRnZSBleHRlbmRzIFNoYXBlXG57XG4gICAgIHJlYWRvbmx5IG93bmVyID0gdW5kZWZpbmVkIGFzIFNoYXBlXG5cbiAgICAgcmVhZG9ubHkgcG9zaXRpb24gPSB7IGFuZ2xlOiAwLCBvZmZzZXQ6IDAgfVxuXG4gICAgIGNvbnN0cnVjdG9yICggb3B0aW9uczogJFNoYXBlIClcbiAgICAge1xuICAgICAgICAgIHN1cGVyICggb3B0aW9ucyApXG4gICAgIC8vIH1cbiAgICAgLy8gaW5pdCAoKVxuICAgICAvLyB7XG4gICAgIC8vICAgICAgc3VwZXIuaW5pdCAoKVxuXG4gICAgICAgICAgY29uc3QgeyBncm91cCB9ID0gdGhpc1xuXG4gICAgICAgICAgY29uc3QgZW50aXR5ID0gZGIuZ2V0RGF0YSA8JEJhZGdlPiAoIHRoaXMuY29uZmlnLmRhdGEgKVxuXG4gICAgICAgICAgY29uc3QgdGV4dCA9IG5ldyBmYWJyaWMuVGV4dGJveCAoIGVudGl0eS5lbW9qaSB8fCBcIlhcIiwge1xuICAgICAgICAgICAgICAgZm9udFNpemU6IHRoaXMuZGlzcGxheVNpemUgKCksXG4gICAgICAgICAgICAgICBvcmlnaW5YIDogXCJjZW50ZXJcIixcbiAgICAgICAgICAgICAgIG9yaWdpblkgOiBcImNlbnRlclwiLFxuICAgICAgICAgICAgICAgbGVmdCAgICA6IGdyb3VwLmxlZnQsXG4gICAgICAgICAgICAgICB0b3AgICAgIDogZ3JvdXAudG9wLFxuICAgICAgICAgIH0pXG5cbiAgICAgICAgICBncm91cC5hZGRXaXRoVXBkYXRlICggdGV4dCApXG4gICAgIH1cblxuICAgICBkaXNwbGF5U2l6ZSAoKVxuICAgICB7XG4gICAgICAgICAgcmV0dXJuIDIwXG4gICAgIH1cblxuICAgICBhdHRhY2ggKCB0YXJnZXQ6IFNoYXBlLCBwb3MgPSB7fSBhcyBCYWRnZVBvc2l0aW9uIClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHsgcmFuZG9tLCBQSSB9ID0gTWF0aFxuXG4gICAgICAgICAgaWYgKCAhIGlzRmluaXRlICggcG9zLmFuZ2xlICkgKVxuICAgICAgICAgICAgICAgcG9zLmFuZ2xlID0gcmFuZG9tICgpICogUEkgKiAyXG5cbiAgICAgICAgICBpZiAoICEgaXNGaW5pdGUgKCBwb3Mub2Zmc2V0ICkgKVxuICAgICAgICAgICAgICAgcG9zLm9mZnNldCA9IDAuMVxuXG4gICAgICAgICAgOyh0aGlzLnBvc2l0aW9uIGFzIEJhZGdlUG9zaXRpb24pID0geyAuLi4gcG9zIH1cblxuICAgICAgICAgIGlmICggdGhpcy5vd25lciAhPSB1bmRlZmluZWQgKVxuICAgICAgICAgICAgICAgdGFyZ2V0Lmdyb3VwLnJlbW92ZSAoIHRoaXMuZ3JvdXAgKVxuXG4gICAgICAgICAgdGFyZ2V0Lmdyb3VwLmFkZCAoIHRoaXMuZ3JvdXAgKVxuXG4gICAgICAgICAgOyh0aGlzLm93bmVyIGFzIFNoYXBlKSA9IHRhcmdldFxuXG4gICAgICAgICAgdGhpcy51cGRhdGVQb3NpdGlvbiAoKVxuICAgICB9XG5cbiAgICAgdXBkYXRlUG9zaXRpb24gKClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHsgcG9zaXRpb246IHBvcywgb3duZXIgfSA9IHRoaXNcblxuICAgICAgICAgIGlmICggb3duZXIgPT0gdW5kZWZpbmVkIClcbiAgICAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgICAgY29uc3QgeyByYW5kb20sIFBJLCBjb3MsIHNpbiB9ID0gTWF0aFxuXG4gICAgICAgICAgY29uc3QgcmFkICAgID0gcG9zLmFuZ2xlIHx8IHJhbmRvbSAoKSAqIFBJICogMlxuICAgICAgICAgIGNvbnN0IHggICAgICA9IHNpbiAocmFkKVxuICAgICAgICAgIGNvbnN0IHkgICAgICA9IGNvcyAocmFkKVxuICAgICAgICAgIGNvbnN0IHMgICAgICA9IG93bmVyLmRpc3BsYXlTaXplICgpIC8gMlxuICAgICAgICAgIGNvbnN0IG9mZnNldCA9IHR5cGVvZiBwb3Mub2Zmc2V0ID09IFwibnVtYmVyXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICA/IHRoaXMuZGlzcGxheVNpemUgKCkgKiBwb3Mub2Zmc2V0XG4gICAgICAgICAgICAgICAgICAgICAgICAgOiB0aGlzLmRpc3BsYXlTaXplICgpICogMC4xXG5cbiAgICAgICAgICB0aGlzLnNldFBvc2l0aW9uICggeCAqIChzICsgb2Zmc2V0KSwgeSAqIChzICsgb2Zmc2V0KSApXG4gICAgIH1cbn1cbiIsIlxuaW1wb3J0IHsgR2VvbWV0cnkgfSBmcm9tIFwiLi4vLi4vLi4vTGliL2luZGV4LmpzXCJcblxuaW1wb3J0IHsgZ2V0QXNwZWN0IH0gZnJvbSBcIi4uL2RiLmpzXCJcblxuaW1wb3J0IHsgU2hhcGUsICRTaGFwZSB9IGZyb20gXCIuL3NoYXBlLmpzXCJcblxuZXhwb3J0IGNsYXNzIENvbnRhaW5lciA8JCBleHRlbmRzICRTaGFwZSA8JEdyb3VwPiA9ICRTaGFwZSA8JEdyb3VwPj4gZXh0ZW5kcyBTaGFwZSA8JD5cbntcbiAgICAgcmVhZG9ubHkgY2hpbGRyZW46IFNoYXBlIFtdXG5cbiAgICAgZGlzcGxheV9zaXplID0gMVxuXG4gICAgIGNvbnN0cnVjdG9yICggb3B0aW9uczogJCApXG4gICAgIHtcbiAgICAgICAgICBzdXBlciAoIG9wdGlvbnMgKVxuICAgICAgICAgIHRoaXMuY2hpbGRyZW4gPSBbXVxuICAgICAvLyB9XG5cbiAgICAgLy8gaW5pdCAoKVxuICAgICAvLyB7XG4gICAgIC8vICAgICAgc3VwZXIuaW5pdCAoKVxuXG4gICAgICAgICAgY29uc3QgZW50aXR5ID0gdGhpcy5jb25maWcuZGF0YVxuXG4gICAgICAgICAgLy9mb3IgKCBjb25zdCBjaGlsZCBvZiBPYmplY3QudmFsdWVzICggZW50aXR5LmNoaWxkcmVuICkgKVxuICAgICAgICAgIGZvciAoIGNvbnN0IGNoaWxkIG9mIE9iamVjdC52YWx1ZXMgKCBlbnRpdHkuaXRlbXMgKSApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgY29uc3QgYSA9IGdldEFzcGVjdCAoIGNoaWxkIClcbiAgICAgICAgICAgICAgIC8vYS5pbml0ICgpXG4gICAgICAgICAgICAgICB0aGlzLmFkZCAoIGEgKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHRoaXMucGFjayAoKVxuICAgICB9XG5cbiAgICAgZGlzcGxheVNpemUgKClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IHRoaXMuY29uZmlnXG5cbiAgICAgICAgICB2YXIgc2l6ZSA9ICh0aGlzLmRpc3BsYXlfc2l6ZSArIGNvbmZpZy5zaXplT2Zmc2V0KSAqIGNvbmZpZy5zaXplRmFjdG9yXG5cbiAgICAgICAgICBpZiAoIHNpemUgPCBjb25maWcubWluU2l6ZSApXG4gICAgICAgICAgICAgICBzaXplID0gY29uZmlnLm1pblNpemVcblxuICAgICAgICAgIHJldHVybiBzaXplIHx8IDFcbiAgICAgfVxuXG4gICAgIGFkZCAoIGNoaWxkOiBTaGFwZSApXG4gICAgIHtcbiAgICAgICAgICBjb25zdCB7IGdyb3VwIH0gPSB0aGlzXG5cbiAgICAgICAgICB0aGlzLmNoaWxkcmVuLnB1c2ggKCBjaGlsZCApXG5cbiAgICAgICAgICBpZiAoIGdyb3VwIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBncm91cC5hZGQgKCBjaGlsZC5ncm91cCApXG4gICAgICAgICAgICAgICBncm91cC5zZXRDb29yZHMgKClcbiAgICAgICAgICB9XG4gICAgIH1cblxuICAgICBwYWNrICgpXG4gICAgIHtcbiAgICAgICAgICBjb25zdCB7IGdyb3VwLCBjaGlsZHJlbiwgY29uZmlnIH0gPSB0aGlzXG5cbiAgICAgICAgICBjb25zdCBwb3NpdGlvbnMgPSBbXSBhcyBHZW9tZXRyeS5DaXJjbGUgW11cblxuICAgICAgICAgIGZvciAoIGNvbnN0IGMgb2YgY2hpbGRyZW4gKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNvbnN0IGcgPSBjLmdyb3VwXG4gICAgICAgICAgICAgICBjb25zdCByID0gKGcud2lkdGggPiBnLmhlaWdodCA/IGcud2lkdGggOiBnLmhlaWdodCkgLyAyXG4gICAgICAgICAgICAgICBwb3NpdGlvbnMucHVzaCAoIHsgeDogZy5sZWZ0LCB5OiBnLnRvcCwgcjogciArIDYgfSApXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29uc3Qgc2l6ZSA9ICBHZW9tZXRyeS5wYWNrRW5jbG9zZSAoIHBvc2l0aW9ucyApICogMlxuXG4gICAgICAgICAgZm9yICggdmFyIGkgPSAwIDsgaSA8IGNoaWxkcmVuLmxlbmd0aCA7IGkrKyApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgY29uc3QgZyA9IGNoaWxkcmVuIFtpXS5ncm91cFxuICAgICAgICAgICAgICAgY29uc3QgcCA9IHBvc2l0aW9ucyBbaV1cblxuICAgICAgICAgICAgICAgZy5sZWZ0ID0gcC54XG4gICAgICAgICAgICAgICBnLnRvcCAgPSBwLnlcblxuICAgICAgICAgICAgICAgZ3JvdXAuYWRkICggZyApXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdGhpcy5kaXNwbGF5X3NpemUgPSBzaXplICsgY29uZmlnLnNpemVPZmZzZXRcblxuICAgICAgICAgIHRoaXMudXBkYXRlU2l6ZSAoKVxuICAgICB9XG5cbn1cblxuIiwiXG5pbXBvcnQgeyBQYW5lbENvbW1hbmRzIH0gZnJvbSBcIi4vcGFuZWwuanNcIlxuaW1wb3J0IHsgTWVudUNvbW1hbmRzIH0gZnJvbSBcIi4vbWVudS5qc1wiXG5pbXBvcnQgeyBBcmVhQ29tbWFuZHMgfSBmcm9tIFwiLi9hcmVhLmpzXCJcbmltcG9ydCB7IENvbW1hbmRzIGFzIGNtZCB9IGZyb20gXCIuLi9VaS9CYXNlL2NvbW1hbmQuanNcIlxuXG5leHBvcnQgdHlwZSBDb21tYW5kTmFtZXMgPSBrZXlvZiBDb21tYW5kc1xuXG50eXBlIENvbW1hbmRzID0gUGFuZWxDb21tYW5kc1xuICAgICAgICAgICAgICAgJiBNZW51Q29tbWFuZHNcbiAgICAgICAgICAgICAgICYgQXJlYUNvbW1hbmRzXG5cbmV4cG9ydCBjb25zdCBhZGRDb21tYW5kID0gY21kLmN1cnJlbnQuYWRkLmJpbmQgKGNtZC5jdXJyZW50KSBhc1xue1xuICAgICA8SyBleHRlbmRzIENvbW1hbmROYW1lcz4gKCBuYW1lOiBLLCBjYWxsYmFjazogQ29tbWFuZHMgW0tdICk6IHZvaWRcbiAgICAgKCBuYW1lOiBzdHJpbmcsIGNhbGxiYWNrOiAoIC4uLmFyZ3M6IGFueSApID0+IGFueSApOiB2b2lkXG59XG5cbmV4cG9ydCBjb25zdCBydW5Db21tYW5kID0gY21kLmN1cnJlbnQucnVuLmJpbmQgKGNtZC5jdXJyZW50KSBhc1xue1xuICAgICA8SyBleHRlbmRzIENvbW1hbmROYW1lcz4gKCBuYW1lOiBLLCAuLi4gYXJnczogUGFyYW1ldGVycyA8Q29tbWFuZHMgW0tdPiApOiB2b2lkXG4gICAgICggbmFtZTogc3RyaW5nLCAuLi4gYXJnczogYW55ICk6IHZvaWRcbn1cblxuZXhwb3J0IGNvbnN0IGhhc0NvbW1hbmQgPSBjbWQuY3VycmVudC5oYXMuYmluZCAoY21kLmN1cnJlbnQpIGFzXG57XG4gICAgICgga2V5OiBDb21tYW5kTmFtZXMgKTogYm9vbGVhblxuICAgICAoIGtleTogc3RyaW5nICk6IGJvb2xlYW5cbn1cblxuZXhwb3J0IGNvbnN0IG9uQ29tbWFuZCA9IGNtZC5jdXJyZW50Lm9uLmJpbmQgKGNtZC5jdXJyZW50KSBhc1xue1xuICAgICAoIG5hbWU6IENvbW1hbmROYW1lcywgY2FsbGJhY2s6ICgpID0+IHZvaWQgKTogdm9pZFxuICAgICAoIG5hbWU6IHN0cmluZywgY2FsbGJhY2s6ICgpID0+IHZvaWQgKTogdm9pZFxufVxuXG5leHBvcnQgY29uc3QgcmVtb3ZlQ29tbWFuZCA9IGNtZC5jdXJyZW50LnJlbW92ZS5iaW5kIChjbWQuY3VycmVudCkgYXNcbntcbiAgICAgKCBuYW1lOiBDb21tYW5kTmFtZXMgKTogdm9pZFxuICAgICAoIG5hbWU6IHN0cmluZyApOiB2b2lkXG59XG4iLCJcblxuZXhwb3J0IHsgZGVmaW5lQXNwZWN0LCBnZXRBc3BlY3QsIHNldEFzcGVjdCB9IGZyb20gXCIuL2RiLmpzXCJcblxuZXhwb3J0IHsgR2VvbWV0cnksICRHZW9tZXRyeSB9IGZyb20gXCIuL0dlb21ldHJ5L2dlb21ldHJ5LmpzXCJcbmV4cG9ydCB7IFNoYXBlLCAkU2hhcGUsICRTaGFwZUV2ZW50cyB9IGZyb20gXCIuL0VsZW1lbnQvc2hhcGUuanNcIlxuZXhwb3J0IHsgTm90ZSB9ICAgICAgZnJvbSBcIi4vRWxlbWVudC9ub3RlLmpzXCJcbmV4cG9ydCB7IEJhZGdlIH0gICAgIGZyb20gXCIuL0VsZW1lbnQvYmFkZ2UuanNcIlxuZXhwb3J0IHsgQ29udGFpbmVyIH0gZnJvbSBcIi4vRWxlbWVudC9ncm91cC5qc1wiXG5cblxuaW1wb3J0IHsgZ2V0RGF0YX0gZnJvbSBcIi4uL0RhdGEvZGIuanNcIlxuaW1wb3J0IHsgZ2V0QXNwZWN0LCBkZWZpbmVBc3BlY3QsIHNldEFzcGVjdCB9IGZyb20gXCIuL2RiLmpzXCJcbmltcG9ydCB7IFNoYXBlIH0gZnJvbSBcIi4vRWxlbWVudC9zaGFwZS5qc1wiXG5pbXBvcnQgeyAkU2hhcGUgfSBmcm9tIFwiLi9FbGVtZW50L3NoYXBlLmpzXCJcbmltcG9ydCB7IENvbnRhaW5lciB9IGZyb20gXCIuL0VsZW1lbnQvZ3JvdXAuanNcIlxuaW1wb3J0IHsgQmFkZ2UgfSAgICAgZnJvbSBcIi4vRWxlbWVudC9iYWRnZS5qc1wiXG5cbmltcG9ydCB7IHJ1bkNvbW1hbmQgfSBmcm9tIFwiLi4vY29tbWFuZC5qc1wiXG5cbmRlZmluZUFzcGVjdCAoIFNoYXBlICAgICwgXCJwZXJzb25cIiAvKiAsIHsgb25DcmVhdGU6ICgpID0+IC4uLiwgb25Ub3VjaDogKCkgPT4gLi4uIH0gKi8gKVxuZGVmaW5lQXNwZWN0ICggQ29udGFpbmVyLCBcInNraWxsXCIgKVxuZGVmaW5lQXNwZWN0ICggQmFkZ2UgICAgLCBcImJhZGdlXCIgKVxuXG5zZXRBc3BlY3QgPCRTaGFwZT4gKHtcbiAgICAgdHlwZSAgIDogXCJwZXJzb25cIixcbiAgICAgaWQgICAgIDogdW5kZWZpbmVkLFxuXG4gICAgIGRhdGEgICA6IHVuZGVmaW5lZCxcblxuICAgICBzaGFwZSAgOiBcImNpcmNsZVwiLFxuXG4gICAgIHg6IDAsXG4gICAgIHk6IDAsXG5cbiAgICAgbWluU2l6ZSAgICA6IDMwLFxuICAgICBzaXplRmFjdG9yOiAxLFxuICAgICBzaXplT2Zmc2V0OiAwLFxuXG4gICAgIGJvcmRlckNvbG9yICAgICA6IFwiIzAwYzBhYVwiLFxuICAgICBib3JkZXJXaWR0aCAgICAgOiA0LFxuICAgICBiYWNrZ3JvdW5kQ29sb3IgOiBcInRyYW5zcGFyZW50XCIsXG4gICAgIGJhY2tncm91bmRJbWFnZSA6IHVuZGVmaW5lZCxcbiAgICAgYmFja2dyb3VuZFJlcGVhdDogZmFsc2UsXG5cbiAgICAgb25DcmVhdGUgICA6ICggcGVyc29uOiAkUGVyc29uLCBhc3BlY3QgKSA9PlxuICAgICB7XG4gICAgICAgICAgYXNwZWN0LnNldEJhY2tncm91bmQgKHtcbiAgICAgICAgICAgICAgIGJhY2tncm91bmRJbWFnZTogcGVyc29uLmF2YXRhcixcbiAgICAgICAgICAgICAgIHNoYXBlOiBwZXJzb24uaXNDYXB0YWluID8gXCJzcXVhcmVcIiA6IFwiY2lyY2xlXCIsXG4gICAgICAgICAgfSBhcyBhbnkpXG4gICAgIH0sXG4gICAgIG9uRGVsZXRlOiB1bmRlZmluZWQsXG4gICAgIG9uVG91Y2g6IHVuZGVmaW5lZCxcbn0pXG5cbnNldEFzcGVjdCA8JFNoYXBlPiAoe1xuICAgICB0eXBlICAgOiBcInNraWxsXCIsXG4gICAgIGlkICAgICA6IHVuZGVmaW5lZCxcblxuICAgICBkYXRhOiB1bmRlZmluZWQsXG5cbiAgICAgc2hhcGU6IFwiY2lyY2xlXCIsXG4gICAgIHg6IDAsXG4gICAgIHk6IDAsXG5cbiAgICAgYm9yZGVyQ29sb3IgICAgIDogXCIjZjFiYzMxXCIsXG4gICAgIGJvcmRlcldpZHRoICAgICA6IDgsXG4gICAgIGJhY2tncm91bmRDb2xvciA6IFwiI0ZGRkZGRlwiLFxuICAgICBiYWNrZ3JvdW5kSW1hZ2UgOiB1bmRlZmluZWQsXG4gICAgIGJhY2tncm91bmRSZXBlYXQ6IGZhbHNlLFxuICAgICBtaW5TaXplICAgICAgICAgOiA1MCxcbiAgICAgc2l6ZU9mZnNldCAgICAgIDogMTAsXG4gICAgIHNpemVGYWN0b3IgICAgICA6IDEsXG5cbiAgICAgb25DcmVhdGUgKCBza2lsbDogJFNraWxsLCBhc3BlY3QgKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgZGF0YSA9IGdldERhdGEgKHtcbiAgICAgICAgICAgICAgIHR5cGU6IFwiYmFkZ2VcIixcbiAgICAgICAgICAgICAgIGlkICA6IHNraWxsLmljb24sXG4gICAgICAgICAgfSlcblxuICAgICAgICAgIGNvbnN0IGJhZGdlID0gZ2V0QXNwZWN0IDxCYWRnZT4gKCBkYXRhIClcblxuICAgICAgICAgIC8vYmFkZ2UuaW5pdCAoKVxuICAgICAgICAgIGJhZGdlLmF0dGFjaCAoIGFzcGVjdCApXG4gICAgIH0sXG5cbiAgICAgb25Ub3VjaCAoIHNoYXBlIClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHNraWxsID0gZ2V0RGF0YSA8JFNraWxsPiAoe1xuICAgICAgICAgICAgICAgdHlwZTogc2hhcGUuY29uZmlnLnR5cGUsXG4gICAgICAgICAgICAgICBpZCAgOiBzaGFwZS5jb25maWcuaWRcbiAgICAgICAgICB9KVxuXG4gICAgICAgICAgcnVuQ29tbWFuZCAoIFwib3Blbi1pbmZvcy1wYW5lbFwiLCBza2lsbCApXG4gICAgIH0sXG5cbiAgICAgb25EZWxldGU6IHVuZGVmaW5lZFxufSlcblxuc2V0QXNwZWN0IDwkU2hhcGU+ICh7XG4gICAgIHR5cGUgICA6IFwiYmFkZ2VcIixcbiAgICAgaWQgICAgIDogdW5kZWZpbmVkLFxuXG4gICAgIGRhdGE6IHVuZGVmaW5lZCxcblxuICAgICB4ICAgICAgICAgOiAwLFxuICAgICB5ICAgICAgICAgOiAwLFxuICAgICBtaW5TaXplICAgOiAxLFxuICAgICBzaXplRmFjdG9yOiAxLFxuICAgICBzaXplT2Zmc2V0OiAwLFxuXG4gICAgIHNoYXBlICAgICAgICAgICA6IFwiY2lyY2xlXCIsXG4gICAgIGJvcmRlckNvbG9yICAgICA6IFwiZ3JheVwiLFxuICAgICBib3JkZXJXaWR0aCAgICAgOiAwLFxuXG4gICAgIGJhY2tncm91bmRDb2xvciA6IFwidHJhbnNwYXJlbnRcIixcbiAgICAgYmFja2dyb3VuZEltYWdlIDogdW5kZWZpbmVkLFxuICAgICBiYWNrZ3JvdW5kUmVwZWF0OiBmYWxzZSxcblxuICAgICBvbkNyZWF0ZSAgICAgICAgOiB1bmRlZmluZWQsXG4gICAgIG9uRGVsZXRlICAgICAgICA6IHVuZGVmaW5lZCxcbiAgICAgb25Ub3VjaCAgICAgICAgIDogdW5kZWZpbmVkLFxufSlcbiIsIlxuXG5pbXBvcnQgKiBhcyB1aSBmcm9tIFwiLi4vVWkvaW5kZXguanNcIlxuaW1wb3J0IHsgU2lkZU1lbnUgfSBmcm9tIFwiLi4vVWkvaW5kZXguanNcIlxuaW1wb3J0IHsgYWRkQ29tbWFuZCB9IGZyb20gXCIuL2NvbW1hbmQuanNcIlxuXG5cbi8vZXhwb3J0IGNvbnN0IG1lbnUgPSBjcmVhdGVNZW51ICgpXG5cbi8vZG9jdW1lbnQuYm9keS5hcHBlbmQgKCAuLi4gbWVudS5lbGVtZW50cyAoKSApXG5cbmV4cG9ydCBjb25zdCBtZW51ID0gdWkubWFrZSA8U2lkZU1lbnUsICRTaWRlTWVudT4gKHtcbiAgICAgY29udGV4dCAgICAgIDogXCJjb25jZXB0LXVpXCIsXG4gICAgIHR5cGUgICAgICAgICA6IFwic2lkZS1tZW51XCIsXG4gICAgIGlkICAgICAgICAgICA6IFwibWVudVwiLFxuICAgICBoYXNNYWluQnV0dG9uOiB0cnVlLFxuICAgICBkaXJlY3Rpb24gICAgOiBcImxyXCJcbn0pXG5kb2N1bWVudC5ib2R5LmFwcGVuZCAoIC4uLiBtZW51LmdldEh0bWwgKCkgKVxuXG5leHBvcnQgdHlwZSBNZW51Q29tbWFuZHMgPSB7XG4gICAgIFwib3Blbi1tZW51XCI6ICgpID0+IHZvaWQsXG4gICAgIFwiY2xvc2UtbWVudVwiOiAoKSA9PiB2b2lkLFxufVxuXG4vL2FkZENvbW1hbmQgKCBcIm9wZW4tbWVudVwiLCAoKSA9PiB7IG1lbnUub3BlbiAoKSB9KVxuLy9hZGRDb21tYW5kICggXCJjbG9zZS1tZW51XCIsICgpID0+IHsgbWVudS5jbG9zZSAoKSB9KVxuIix7ImVycm5vIjotNDA1OCwiY29kZSI6IkVOT0VOVCIsInN5c2NhbGwiOiJvcGVuIiwicGF0aCI6IkU6XFxQcm9qZXRcXENvbmNlcHRcXEFwcGxpY2F0aW9uXFxDb21wb25lbnRcXGluZm9zLnRzeCJ9LCJcbmltcG9ydCBcIi4uL1VpL2RiLmpzXCJcbmltcG9ydCBcIi4uL1VpL0NvbXBvbmVudC9TbGlkZXNob3cvaW5kZXguanNcIlxuaW1wb3J0IFwiLi9Db21wb25lbnQvaW5mb3MuanNcIlxuaW1wb3J0IFwiLi4vVWkvRW50aXR5L1NraWxsL2luZm9zLmpzXCJcblxuaW1wb3J0ICogYXMgdWkgZnJvbSBcIi4uL1VpL2luZGV4LmpzXCJcbmltcG9ydCB7IFNsaWRlc2hvdywgU2lkZU1lbnUgfSBmcm9tIFwiLi4vVWkvaW5kZXguanNcIlxuaW1wb3J0IHsgU2tpbGxWaWV3ZXIgfSBmcm9tIFwiLi4vVWkvRW50aXR5L1NraWxsL2luZm9zLmpzXCJcbmltcG9ydCB7IGFkZENvbW1hbmQgfSBmcm9tIFwiLi9jb21tYW5kLmpzXCJcblxuZXhwb3J0IHR5cGUgUGFuZWxDb21tYW5kcyA9IHtcbiAgICAgXCJvcGVuLXBhbmVsXCI6ICggbmFtZTogc3RyaW5nLCAuLi4gY29udGVudDogYW55IFtdICkgPT4gdm9pZCxcbiAgICAgXCJvcGVuLWluZm9zLXBhbmVsXCI6ICggZGF0YTogJE5vZGUgKSA9PiB2b2lkLFxuICAgICBcImNsb3NlLXBhbmVsXCI6ICgpID0+IHZvaWQsXG59O1xuXG52YXIgZGlyZWN0aW9uID0gXCJybFwiIGFzIFwicmxcIiB8IFwibHJcIiB8IFwidGJcIiB8IFwiYnRcIlxuXG5leHBvcnQgY29uc3QgcGFuZWwgPSB1aS5tYWtlIDxTaWRlTWVudSwgJFNpZGVNZW51PiAoe1xuICAgICBjb250ZXh0ICAgICAgOiBcImNvbmNlcHQtdWlcIixcbiAgICAgdHlwZSAgICAgICAgIDogXCJzaWRlLW1lbnVcIixcbiAgICAgaWQgICAgICAgICAgIDogdW5kZWZpbmVkLFxuICAgICBkaXJlY3Rpb24gICAgOiBkaXJlY3Rpb24sXG4gICAgIGhhc01haW5CdXR0b246IHRydWUsXG5cbiAgICAgaGVhZGVyOiB7XG4gICAgICAgICAgY29udGV4dCAgOiBcImNvbmNlcHQtdWlcIixcbiAgICAgICAgICB0eXBlICAgICA6IFwidG9vbGJhclwiLFxuICAgICAgICAgIGlkICAgICAgIDogdW5kZWZpbmVkLFxuICAgICAgICAgIHRpdGxlICAgIDogXCJUaXRsZSAuLlwiLFxuICAgICAgICAgIGRpcmVjdGlvbjogZGlyZWN0aW9uID09IFwibHJcIiB8fCBkaXJlY3Rpb24gPT0gXCJybFwiID8gXCJ0YlwiIDogXCJsclwiLFxuXG4gICAgICAgICAgYnV0dG9uczogW3tcbiAgICAgICAgICAgICAgIGNvbnRleHQ6IFwiY29uY2VwdC11aVwiLFxuICAgICAgICAgICAgICAgdHlwZSAgICA6IFwiYnV0dG9uXCIsXG4gICAgICAgICAgICAgICBpZCAgICAgIDogXCJjb25zb2xlXCIsXG4gICAgICAgICAgICAgICBpY29uICAgIDogXCLimqBcIixcbiAgICAgICAgICAgICAgIHRleHQgICAgOiBcIlwiLFxuICAgICAgICAgICAgICAgaGFuZGxlT246IFwiKlwiLFxuICAgICAgICAgICAgICAgY29tbWFuZDogXCJwYWNrLXZpZXdcIlxuICAgICAgICAgIH0se1xuICAgICAgICAgICAgICAgY29udGV4dDogXCJjb25jZXB0LXVpXCIsXG4gICAgICAgICAgICAgICB0eXBlICAgIDogXCJidXR0b25cIixcbiAgICAgICAgICAgICAgIGlkICAgICAgOiBcInByb3BlcnRpZXNcIixcbiAgICAgICAgICAgICAgIGljb24gICAgOiBcIlwiLFxuICAgICAgICAgICAgICAgdGV4dCAgICA6IFwicGFuZWwgcHJvcGVydGllc1wiLFxuICAgICAgICAgICAgICAgaGFuZGxlT246IFwiKlwiLFxuICAgICAgICAgIH1dXG4gICAgIH0sXG5cbiAgICAgY2hpbGRyZW46IFt7XG4gICAgICAgICAgY29udGV4dCAgOiBcImNvbmNlcHQtdWlcIixcbiAgICAgICAgICB0eXBlICAgICA6IFwic2xpZGVzaG93XCIsXG4gICAgICAgICAgaWQgICAgICAgOiBcInBhbmVsLXNsaWRlc2hvd1wiLFxuXG4gICAgICAgICAgY2hpbGRyZW46IFt7XG4gICAgICAgICAgICAgICBjb250ZXh0OiBcImNvbmNlcHQtdWlcIixcbiAgICAgICAgICAgICAgIHR5cGUgICA6IFwic2tpbGwtdmlld2VyXCIsXG4gICAgICAgICAgICAgICBpZCAgICAgOiBcInNsaWRlLXNraWxsXCJcbiAgICAgICAgICB9LHtcbiAgICAgICAgICAgICAgIGNvbnRleHQ6IFwiY29uY2VwdC11aVwiLFxuICAgICAgICAgICAgICAgdHlwZSAgIDogXCJwZXJzb24tdmlld2VyXCIsXG4gICAgICAgICAgICAgICBpZCAgICAgOiBcInNsaWRlLXBlcnNvblwiXG4gICAgICAgICAgfV1cbiAgICAgfV1cbn0pXG5cbmRvY3VtZW50LmJvZHkuYXBwZW5kICggLi4uIHBhbmVsLmdldEh0bWwgKCkgKVxuXG5jb25zdCBzbGlkZXNob3cgID0gdWkucGljayA8U2xpZGVzaG93PiAgICggXCJzbGlkZXNob3dcIiwgXCJwYW5lbC1zbGlkZXNob3dcIiApXG5jb25zdCBzbGlkZUluZm9zID0gdWkucGljayA8U2tpbGxWaWV3ZXI+ICggXCJza2lsbC12aWV3ZXJcIiwgXCJzbGlkZS1za2lsbFwiIClcblxuYWRkQ29tbWFuZCAoIFwib3Blbi1wYW5lbFwiLCAoIG5hbWUsIC4uLiBjb250ZW50ICkgPT5cbntcbiAgICAgaWYgKCBuYW1lIClcbiAgICAgICAgICBzbGlkZXNob3cuc2hvdyAoIG5hbWUsIC4uLiBjb250ZW50IClcbiAgICAgZWxzZVxuICAgICAgICAgIHBhbmVsLm9wZW4gKClcbn0pXG5cbmFkZENvbW1hbmQgKCBcIm9wZW4taW5mb3MtcGFuZWxcIiwgKCBkYXRhICkgPT5cbntcbiAgICAgaWYgKCBkYXRhIClcbiAgICAge1xuICAgICAgICAgIHNsaWRlSW5mb3MuZGlzcGxheSAoIGRhdGEgYXMgYW55IClcbiAgICAgICAgICBwYW5lbC5vcGVuICgpXG4gICAgIH1cbn0pXG5cbmFkZENvbW1hbmQgKCBcImNsb3NlLXBhbmVsXCIgLCAoKSA9Plxue1xuICAgICBwYW5lbC5jbG9zZSAoKVxufSlcblxuIiwiXG4vKlxuZXhhbXBsZTpcbmh0dHBzOi8vcHJlemkuY29tL3AvOWpxZTJ3a2ZoaGt5L2xhLWJ1bGxvdGVyaWUtdHBjbW4vXG5odHRwczovL21vdmlsYWIub3JnL2luZGV4LnBocD90aXRsZT1VdGlsaXNhdGV1cjpBdXIlQzMlQTlsaWVuTWFydHlcbiovXG5cbi8vaW1wb3J0ICogYXMgZmFicmljIGZyb20gXCJmYWJyaWMvZmFicmljLWltcGwuanNcIlxuXG5pbXBvcnQgeyBHZW9tZXRyeSB9IGZyb20gXCIuLi8uLi8uLi9MaWIvaW5kZXguanNcIlxuXG5pbXBvcnQgeyBTaGFwZSB9IGZyb20gXCIuLi8uLi8uLi9BcHBsaWNhdGlvbi9Bc3BlY3QvRWxlbWVudC9zaGFwZS5qc1wiXG5pbXBvcnQgKiBhcyBhc3BlY3QgZnJvbSBcIi4uLy4uLy4uL0FwcGxpY2F0aW9uL0FzcGVjdC9kYi5qc1wiXG5pbXBvcnQgKiBhcyBkYiBmcm9tIFwiLi4vLi4vLi4vQXBwbGljYXRpb24vRGF0YS9kYi5qc1wiXG5cbmZhYnJpYy5PYmplY3QucHJvdG90eXBlLnBhZGRpbmcgICAgICAgICAgICA9IDBcbmZhYnJpYy5PYmplY3QucHJvdG90eXBlLm9iamVjdENhY2hpbmcgICAgICA9IGZhbHNlXG5mYWJyaWMuT2JqZWN0LnByb3RvdHlwZS5oYXNDb250cm9scyAgICAgICAgPSB0cnVlXG5mYWJyaWMuT2JqZWN0LnByb3RvdHlwZS5oYXNCb3JkZXJzICAgICAgICAgPSB0cnVlXG5mYWJyaWMuT2JqZWN0LnByb3RvdHlwZS5oYXNSb3RhdGluZ1BvaW50ICAgPSBmYWxzZVxuZmFicmljLk9iamVjdC5wcm90b3R5cGUudHJhbnNwYXJlbnRDb3JuZXJzID0gZmFsc2VcbmZhYnJpYy5PYmplY3QucHJvdG90eXBlLmNlbnRlcmVkU2NhbGluZyAgICA9IHRydWVcbmZhYnJpYy5PYmplY3QucHJvdG90eXBlLmNvcm5lclN0eWxlICAgICAgICA9IFwiY2lyY2xlXCJcbmZhYnJpYy5PYmplY3QucHJvdG90eXBlLnNldENvbnRyb2xWaXNpYmxlICggXCJtbFwiLCBmYWxzZSApXG5mYWJyaWMuT2JqZWN0LnByb3RvdHlwZS5zZXRDb250cm9sVmlzaWJsZSAoIFwibXRcIiwgZmFsc2UgKVxuZmFicmljLk9iamVjdC5wcm90b3R5cGUuc2V0Q29udHJvbFZpc2libGUgKCBcIm1yXCIsIGZhbHNlIClcbmZhYnJpYy5PYmplY3QucHJvdG90eXBlLnNldENvbnRyb2xWaXNpYmxlICggXCJtYlwiLCBmYWxzZSApXG5mYWJyaWMuT2JqZWN0LnByb3RvdHlwZS5zZXRDb250cm9sVmlzaWJsZSAoIFwidGxcIiwgZmFsc2UgKVxuZmFicmljLk9iamVjdC5wcm90b3R5cGUuc2V0Q29udHJvbFZpc2libGUgKCBcImJsXCIsIGZhbHNlIClcbmZhYnJpYy5PYmplY3QucHJvdG90eXBlLnNldENvbnRyb2xWaXNpYmxlICggXCJiclwiLCBmYWxzZSApXG5cbmV4cG9ydCBpbnRlcmZhY2UgVmlld1xue1xuICAgICBuYW1lOiBzdHJpbmdcbiAgICAgYWN0aXZlOiBib29sZWFuXG4gICAgIGNoaWxkcmVuIDogU2hhcGUgW11cbiAgICAgdGh1bWJuYWlsOiBzdHJpbmdcbiAgICAgcGFja2luZyAgOiBcImVuY2xvc2VcIlxufVxuXG5leHBvcnQgY2xhc3MgQXJlYVxue1xuICAgICByZWFkb25seSBmY2FudmFzOiBmYWJyaWMuQ2FudmFzXG4gICAgIHByaXZhdGUgYWN0aXZlOiBWaWV3XG4gICAgIHByaXZhdGUgdmlld3MgPSB7fSBhcyBSZWNvcmQgPHN0cmluZywgVmlldz5cblxuICAgICBjb25zdHJ1Y3RvciAoIGNhbnZhczogSFRNTENhbnZhc0VsZW1lbnQgKVxuICAgICB7XG4gICAgICAgICAgdGhpcy5mY2FudmFzID0gbmV3IGZhYnJpYy5DYW52YXMgKCBjYW52YXMgKVxuICAgICAgICAgIHRoaXMuZW5hYmxlRXZlbnRzICgpXG4gICAgIH1cblxuICAgICBnZXQgdmlldyAoKVxuICAgICB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuYWN0aXZlXG4gICAgIH1cblxuICAgICBvdmVyRk9iamVjdDogZmFicmljLk9iamVjdCA9IHVuZGVmaW5lZFxuXG4gICAgIG9uT3Zlck9iamVjdCAgPSBudWxsIGFzICggb2JqOiBTaGFwZSApID0+IHZvaWRcbiAgICAgb25PdXRPYmplY3QgICA9IG51bGwgYXMgKCBvYmo6IFNoYXBlICkgPT4gdm9pZFxuICAgICBvblRvdWNoT2JqZWN0ID0gbnVsbCBhcyAoIG9iajogU2hhcGUgKSA9PiB2b2lkXG4gICAgIG9uRG91YmxlVG91Y2hPYmplY3QgPSBudWxsIGFzICggb2JqOiBTaGFwZSApID0+IHZvaWRcbiAgICAgb25Ub3VjaEFyZWEgICA9IG51bGwgYXMgKCB4OiBudW1iZXIsIHk6IG51bWJlciApID0+IHZvaWRcblxuICAgICBjcmVhdGVWaWV3ICggbmFtZTogc3RyaW5nIClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHsgdmlld3MgfSA9IHRoaXNcblxuICAgICAgICAgIGlmICggbmFtZSBpbiB2aWV3cyApXG4gICAgICAgICAgICAgICB0aHJvdyBcIlRoZSB2aWV3IGFscmVhZHkgZXhpc3RzXCJcblxuICAgICAgICAgIHJldHVybiB2aWV3cyBbbmFtZV0gPSB7XG4gICAgICAgICAgICAgICBuYW1lLFxuICAgICAgICAgICAgICAgYWN0aXZlICAgOiBmYWxzZSxcbiAgICAgICAgICAgICAgIGNoaWxkcmVuIDogW10sXG4gICAgICAgICAgICAgICBwYWNraW5nICA6IFwiZW5jbG9zZVwiLFxuICAgICAgICAgICAgICAgdGh1bWJuYWlsOiBudWxsLFxuICAgICAgICAgIH1cbiAgICAgfVxuXG4gICAgIHVzZSAoIG5hbWU6IHN0cmluZyApOiBWaWV3XG4gICAgIHVzZSAoIHZpZXc6IFZpZXcgKSAgOiBWaWV3XG4gICAgIHVzZSAoIG5hbWU6IHN0cmluZyB8IFZpZXcgKTogVmlld1xuICAgICB7XG4gICAgICAgICAgY29uc3QgeyBmY2FudmFzLCB2aWV3cyB9ID0gdGhpc1xuXG4gICAgICAgICAgaWYgKCB0eXBlb2YgbmFtZSAhPSBcInN0cmluZ1wiIClcbiAgICAgICAgICAgICAgIG5hbWUgPSBuYW1lLm5hbWVcblxuICAgICAgICAgIGlmICggdGhpcy5hY3RpdmUgJiYgdGhpcy5hY3RpdmUubmFtZSA9PSBuYW1lIClcbiAgICAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgICAgaWYgKCAhIChuYW1lIGluIHZpZXdzKSApXG4gICAgICAgICAgICAgICByZXR1cm5cblxuICAgICAgICAgIGNvbnN0IGFjdGl2ZSA9IHRoaXMuYWN0aXZlID0gdmlld3MgW25hbWVdXG5cbiAgICAgICAgICBmY2FudmFzLmNsZWFyICgpXG5cbiAgICAgICAgICBmb3IgKCBjb25zdCBzaGFwZSBvZiBhY3RpdmUuY2hpbGRyZW4gKVxuICAgICAgICAgICAgICAgZmNhbnZhcy5hZGQgKCBzaGFwZS5ncm91cCApXG5cbiAgICAgICAgICByZXR1cm4gYWN0aXZlXG4gICAgIH1cblxuICAgICBhZGQgKCAuLi4gc2hhcGVzOiAoU2hhcGUgfCAkTm9kZSkgW10gKVxuICAgICBhZGQgKCAuLi4gcGF0aDogc3RyaW5nIFtdIClcbiAgICAgYWRkICgpXG4gICAgIHtcbiAgICAgICAgICBjb25zdCB7IGFjdGl2ZSwgZmNhbnZhcyB9ID0gdGhpc1xuXG4gICAgICAgICAgaWYgKCBhcmd1bWVudHMubGVuZ3RoID09IDAgKVxuICAgICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgICBpZiAoIHR5cGVvZiBhcmd1bWVudHMgWzBdID09IFwic3RyaW5nXCIgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNvbnN0IG5vZGUgPSBkYi5nZXREYXRhICggLi4uIGFyZ3VtZW50cyBhcyBhbnkgYXMgc3RyaW5nIFtdIClcbiAgICAgICAgICAgICAgIGNvbnN0IHNocCA9IGFzcGVjdC5nZXRBc3BlY3QgKCBub2RlIClcbiAgICAgICAgICAgICAgIGFjdGl2ZS5jaGlsZHJlbi5wdXNoICggc2hwIClcbiAgICAgICAgICAgICAgIGZjYW52YXMuYWRkICggc2hwLmdyb3VwIClcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZSBmb3IgKCBjb25zdCBzIG9mIGFyZ3VtZW50cyApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgY29uc3Qgc2hwID0gYXNwZWN0LmdldEFzcGVjdCAoIHMgYXMgJE5vZGUgfCBTaGFwZSApXG5cbiAgICAgICAgICAgICAgIC8vIHNocC5nZXRGYWJyaWNcbiAgICAgICAgICAgICAgIC8vIHNocC5nZXRIdG1sXG4gICAgICAgICAgICAgICAvLyBzaHAuZ2V0U3ZnXG5cbiAgICAgICAgICAgICAgIC8vIGZhY3RvcnlcblxuICAgICAgICAgICAgICAgYWN0aXZlLmNoaWxkcmVuLnB1c2ggKCBzaHAgKVxuICAgICAgICAgICAgICAgZmNhbnZhcy5hZGQgKCBzaHAuZ3JvdXAgKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGZjYW52YXMucmVxdWVzdFJlbmRlckFsbCAoKVxuICAgICB9XG5cbiAgICAgY2xlYXIgKClcbiAgICAge1xuICAgICAgICAgIHRoaXMuZmNhbnZhcy5jbGVhciAoKVxuICAgICB9XG5cbiAgICAgcGFjayAoKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgeyBmY2FudmFzIH0gPSB0aGlzXG5cbiAgICAgICAgICBjb25zdCBvYmplY3RzID0gZmNhbnZhcy5nZXRPYmplY3RzICgpXG4gICAgICAgICAgY29uc3QgcG9zaXRpb25zID0gW10gYXMgR2VvbWV0cnkuQ2lyY2xlIFtdXG5cbiAgICAgICAgICBmb3IgKCBjb25zdCBnIG9mIG9iamVjdHMgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNvbnN0IHIgPSAoZy53aWR0aCA+IGcuaGVpZ2h0ID8gZy53aWR0aCA6IGcuaGVpZ2h0KSAvIDJcbiAgICAgICAgICAgICAgIHBvc2l0aW9ucy5wdXNoICggeyB4OiBnLmxlZnQsIHk6IGcudG9wLCByOiByICsgMjAgfSApXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgR2VvbWV0cnkucGFja0VuY2xvc2UgKCBwb3NpdGlvbnMgKSAqIDJcblxuICAgICAgICAgIGZvciAoIHZhciBpID0gMCA7IGkgPCBvYmplY3RzLmxlbmd0aCA7IGkrKyApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgY29uc3QgZyA9IG9iamVjdHMgW2ldXG4gICAgICAgICAgICAgICBjb25zdCBwID0gcG9zaXRpb25zIFtpXVxuXG4gICAgICAgICAgICAgICBnLmxlZnQgPSBwLnhcbiAgICAgICAgICAgICAgIGcudG9wICA9IHAueVxuICAgICAgICAgICAgICAgZy5zZXRDb29yZHMgKClcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBmY2FudmFzLnJlcXVlc3RSZW5kZXJBbGwgKClcbiAgICAgfVxuXG4gICAgIHpvb20gKCBmYWN0b3I/OiBudW1iZXIgfCBTaGFwZSApXG4gICAgIHtcbiAgICAgICAgICBjb25zdCB7IGZjYW52YXMgfSA9IHRoaXNcblxuICAgICAgICAgIGlmICggdHlwZW9mIGZhY3RvciA9PSBcIm51bWJlclwiIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjb25zdCBvYmplY3RzID0gZmNhbnZhcy5nZXRPYmplY3RzICgpXG5cbiAgICAgICAgICBpZiAoIHR5cGVvZiBmYWN0b3IgPT0gXCJvYmplY3RcIiApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgY29uc3QgbyA9IGZhY3Rvci5ncm91cFxuXG4gICAgICAgICAgICAgICB2YXIgbGVmdCAgID0gby5sZWZ0IC0gby53aWR0aFxuICAgICAgICAgICAgICAgdmFyIHJpZ2h0ICA9IG8ubGVmdCArIG8ud2lkdGhcbiAgICAgICAgICAgICAgIHZhciB0b3AgICAgPSBvLnRvcCAgLSBvLmhlaWdodFxuICAgICAgICAgICAgICAgdmFyIGJvdHRvbSA9IG8udG9wICArIG8uaGVpZ2h0XG5cbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHZhciBsZWZ0ICAgPSAwXG4gICAgICAgICAgICAgICB2YXIgcmlnaHQgID0gMFxuICAgICAgICAgICAgICAgdmFyIHRvcCAgICA9IDBcbiAgICAgICAgICAgICAgIHZhciBib3R0b20gPSAwXG5cbiAgICAgICAgICAgICAgIGZvciAoIGNvbnN0IG8gb2Ygb2JqZWN0cyApXG4gICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGwgPSBvLmxlZnQgLSBvLndpZHRoXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHIgPSBvLmxlZnQgKyBvLndpZHRoXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHQgPSBvLnRvcCAgLSBvLmhlaWdodFxuICAgICAgICAgICAgICAgICAgICBjb25zdCBiID0gby50b3AgICsgby5oZWlnaHRcblxuICAgICAgICAgICAgICAgICAgICBpZiAoIGwgPCBsZWZ0IClcbiAgICAgICAgICAgICAgICAgICAgICAgICBsZWZ0ID0gbFxuXG4gICAgICAgICAgICAgICAgICAgIGlmICggciA+IHJpZ2h0IClcbiAgICAgICAgICAgICAgICAgICAgICAgICByaWdodCA9IHJcblxuICAgICAgICAgICAgICAgICAgICBpZiAoIHQgPCB0b3AgKVxuICAgICAgICAgICAgICAgICAgICAgICAgIHRvcCA9IHRcblxuICAgICAgICAgICAgICAgICAgICBpZiAoIGIgPiBib3R0b20gKVxuICAgICAgICAgICAgICAgICAgICAgICAgIGJvdHRvbSA9IGJcbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjb25zdCB3ICA9IHJpZ2h0IC0gbGVmdFxuICAgICAgICAgIGNvbnN0IGggID0gYm90dG9tIC0gdG9wXG4gICAgICAgICAgY29uc3QgdncgPSBmY2FudmFzLmdldFdpZHRoICAoKVxuICAgICAgICAgIGNvbnN0IHZoID0gZmNhbnZhcy5nZXRIZWlnaHQgKClcblxuICAgICAgICAgIGNvbnN0IGYgPSB3ID4gaFxuICAgICAgICAgICAgICAgICAgICA/ICh2dyA8IHZoID8gdncgOiB2aCkgLyB3XG4gICAgICAgICAgICAgICAgICAgIDogKHZ3IDwgdmggPyB2dyA6IHZoKSAvIGhcblxuICAgICAgICAgIGZjYW52YXMudmlld3BvcnRUcmFuc2Zvcm0gWzBdID0gZlxuICAgICAgICAgIGZjYW52YXMudmlld3BvcnRUcmFuc2Zvcm0gWzNdID0gZlxuXG4gICAgICAgICAgY29uc3QgY3ggPSBsZWZ0ICsgdyAvIDJcbiAgICAgICAgICBjb25zdCBjeSA9IHRvcCAgKyBoIC8gMlxuXG4gICAgICAgICAgZmNhbnZhcy52aWV3cG9ydFRyYW5zZm9ybSBbNF0gPSAtKGN4ICogZikgKyB2dyAvIDJcbiAgICAgICAgICBmY2FudmFzLnZpZXdwb3J0VHJhbnNmb3JtIFs1XSA9IC0oY3kgKiBmKSArIHZoIC8gMlxuXG4gICAgICAgICAgZm9yICggY29uc3QgbyBvZiBvYmplY3RzIClcbiAgICAgICAgICAgICAgIG8uc2V0Q29vcmRzICgpXG5cbiAgICAgICAgICBmY2FudmFzLnJlcXVlc3RSZW5kZXJBbGwgKClcbiAgICAgfVxuXG4gICAgIGlzb2xhdGUgKCBzaGFwZTogU2hhcGUgKVxuICAgICB7XG4gICAgICAgICAgZm9yICggY29uc3QgbyBvZiB0aGlzLmZjYW52YXMuZ2V0T2JqZWN0cyAoKSApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgby52aXNpYmxlID0gZmFsc2VcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBzaGFwZS5ncm91cC52aXNpYmxlID0gdHJ1ZVxuICAgICB9XG5cbiAgICAgZ2V0VGh1bWJuYWlsICgpXG4gICAgIHtcbiAgICAgICAgICBjb25zdCB7IGFjdGl2ZTogY3ZpZXcgfSA9IHRoaXNcblxuICAgICAgICAgIGNvbnN0IHRodW1ibmFpbCA9IGN2aWV3LnRodW1ibmFpbFxuXG4gICAgICAgICAgaWYgKCB0aHVtYm5haWwgfHwgY3ZpZXcuYWN0aXZlID09IGZhbHNlIClcbiAgICAgICAgICAgICAgIHRodW1ibmFpbFxuXG4gICAgICAgICAgcmV0dXJuIGN2aWV3LnRodW1ibmFpbCA9IHRoaXMuZmNhbnZhcy50b0RhdGFVUkwgKHsgZm9ybWF0OiBcImpwZWdcIiB9KVxuICAgICB9XG5cbiAgICAgLy8gVUkgRVZFTlRTXG5cbiAgICAgZW5hYmxlRXZlbnRzICgpXG4gICAgIHtcbiAgICAgICAgICB0aGlzLmluaXRDbGlja0V2ZW50ICgpXG4gICAgICAgICAgdGhpcy5pbml0T3ZlckV2ZW50ICAoKVxuICAgICAgICAgIHRoaXMuaW5pdFBhbkV2ZW50ICAgKClcbiAgICAgICAgICB0aGlzLmluaXRab29tRXZlbnQgICgpXG4gICAgICAgICAgLy90aGlzLmluaXRNb3ZlT2JqZWN0ICgpXG4gICAgICAgICAgLy90aGlzLmluaXREcmFnRXZlbnQgICgpXG5cbiAgICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lciAoIFwicmVzaXplXCIsIHRoaXMucmVzcG9uc2l2ZS5iaW5kICh0aGlzKSApXG4gICAgIH1cblxuICAgICBwcml2YXRlIHJlc3BvbnNpdmUgKClcbiAgICAge1xuICAgICAgICAgIHZhciB3aWR0aCAgID0gKHdpbmRvdy5pbm5lcldpZHRoICA+IDApID8gd2luZG93LmlubmVyV2lkdGggIDogc2NyZWVuLndpZHRoXG4gICAgICAgICAgdmFyIGhlaWdodCAgPSAod2luZG93LmlubmVySGVpZ2h0ID4gMCkgPyB3aW5kb3cuaW5uZXJIZWlnaHQgOiBzY3JlZW4uaGVpZ2h0XG5cbiAgICAgICAgICB0aGlzLmZjYW52YXMuc2V0RGltZW5zaW9ucyh7XG4gICAgICAgICAgICAgICB3aWR0aDogd2lkdGgsXG4gICAgICAgICAgICAgICBoZWlnaHQ6IGhlaWdodFxuICAgICAgICAgIH0pXG4gICAgIH1cblxuICAgICBwcml2YXRlIGluaXRDbGlja0V2ZW50ICgpXG4gICAgIHtcbiAgICAgICAgICBjb25zdCBwYWdlICAgICAgICAgICA9IHRoaXMuZmNhbnZhc1xuICAgICAgICAgIGNvbnN0IG1heF9jbGljaF9hcmVhID0gMjUgKiAyNVxuICAgICAgICAgIHZhciAgIGxhc3RfY2xpY2sgICAgID0gLTFcbiAgICAgICAgICB2YXIgICBsYXN0X3BvcyAgICAgICA9IHsgeDogLTk5OTksIHk6IC05OTk5IH1cblxuICAgICAgICAgIHBhZ2Uub24gKCBcIm1vdXNlOmRvd25cIiwgZmV2ZW50ID0+XG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgY29uc29sZS5sb2cgKCBcIm1vdXNlOmRvd25cIiApXG4gICAgICAgICAgICAgICBjb25zdCBub3cgICA9IERhdGUubm93ICgpXG4gICAgICAgICAgICAgICBjb25zdCBwb3MgICA9IGZldmVudC5wb2ludGVyXG4gICAgICAgICAgICAgICBjb25zdCByZXNldCA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgbGFzdF9jbGljayA9IG5vd1xuICAgICAgICAgICAgICAgICAgICBsYXN0X3BvcyAgID0gcG9zXG4gICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgIC8vIE5vdXMgdsOpcmlmaW9ucyBxdWUgc29pdCB1biBkb3VibGUtY2xpcXVlLlxuICAgICAgICAgICAgICAgaWYgKCA1MDAgPCBub3cgLSBsYXN0X2NsaWNrIClcbiAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCB0aGlzLm9uVG91Y2hPYmplY3QgKVxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZWxlbWVudCA9IGFzcGVjdC5nZXRBc3BlY3QgKCBmZXZlbnQudGFyZ2V0IClcblxuICAgICAgICAgICAgICAgICAgICAgICAgIGlmICggZWxlbWVudCApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm9uVG91Y2hPYmplY3QgKCBlbGVtZW50IClcblxuICAgICAgICAgICAgICAgICAgICAgICAgIGZldmVudC5lLnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbiAoKVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc2V0ICgpXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgLy8gTm91cyB2w6lyaWZpb25zIHF1ZSBsZXMgZGV1eCBjbGlxdWVzIHNlIHRyb3V2ZSBkYW5zIHVuZSByw6lnaW9uIHByb2NoZS5cbiAgICAgICAgICAgICAgIGNvbnN0IHpvbmUgPSAocG9zLnggLSBsYXN0X3Bvcy54KSAqIChwb3MueSAtIGxhc3RfcG9zLnkpXG4gICAgICAgICAgICAgICBpZiAoIHpvbmUgPCAtbWF4X2NsaWNoX2FyZWEgfHwgbWF4X2NsaWNoX2FyZWEgPCB6b25lIClcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc2V0ICgpXG5cbiAgICAgICAgICAgICAgIC8vIFNpIGxlIHBvaW50ZXIgZXN0IGF1LWRlc3N1cyBk4oCZdW5lIGZvcm1lLlxuICAgICAgICAgICAgICAgaWYgKCBmZXZlbnQudGFyZ2V0ICE9IHVuZGVmaW5lZCApXG4gICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGlmICggdGhpcy5vbkRvdWJsZVRvdWNoT2JqZWN0IClcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGVsZW1lbnQgPSBhc3BlY3QuZ2V0QXNwZWN0ICggZmV2ZW50LnRhcmdldCApXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIGVsZW1lbnQgKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5vbkRvdWJsZVRvdWNoT2JqZWN0ICggZWxlbWVudCApXG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBsYXN0X2NsaWNrICAgPSAtMVxuICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgLy8gU2kgbGUgcG9pbnRlciBlc3QgYXUtZGVzc3VzIGTigJl1bmUgem9uZSB2aWRlLlxuICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIHRoaXMub25Ub3VjaEFyZWEgKVxuICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMub25Ub3VjaEFyZWEgKCBwb3MueCwgcG9zLnkgKVxuICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICBmZXZlbnQuZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24gKClcblxuICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgfSlcbiAgICAgfVxuXG4gICAgIHByaXZhdGUgaW5pdE92ZXJFdmVudCAoKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgcGFnZSA9IHRoaXMuZmNhbnZhc1xuXG4gICAgICAgICAgcGFnZS5vbiAoIFwibW91c2U6b3ZlclwiLCBmZXZlbnQgPT5cbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICB0aGlzLm92ZXJGT2JqZWN0ID0gZmV2ZW50LnRhcmdldFxuXG4gICAgICAgICAgICAgICBpZiAoIHRoaXMub25PdmVyT2JqZWN0IClcbiAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZWxlbWVudCA9IGFzcGVjdC5nZXRBc3BlY3QgKCBmZXZlbnQudGFyZ2V0IClcblxuICAgICAgICAgICAgICAgICAgICBpZiAoIGVsZW1lbnQgKVxuICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMub25PdmVyT2JqZWN0ICggZWxlbWVudCApXG4gICAgICAgICAgICAgICB9XG4gICAgICAgICAgfSlcblxuICAgICAgICAgIHBhZ2Uub24gKCBcIm1vdXNlOm91dFwiLCBmZXZlbnQgPT5cbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICB0aGlzLm92ZXJGT2JqZWN0ID0gdW5kZWZpbmVkXG5cbiAgICAgICAgICAgICAgIGlmICggdGhpcy5vbk91dE9iamVjdCApXG4gICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVsZW1lbnQgPSBhc3BlY3QuZ2V0QXNwZWN0ICggZmV2ZW50LnRhcmdldCApXG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCBlbGVtZW50IClcbiAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm9uT3V0T2JqZWN0ICggZWxlbWVudCApXG4gICAgICAgICAgICAgICB9XG4gICAgICAgICAgfSlcbiAgICAgfVxuXG4gICAgIHByaXZhdGUgaW5pdFBhbkV2ZW50ICgpXG4gICAgIHtcbiAgICAgICAgICBjb25zdCBwYWdlICAgICAgID0gdGhpcy5mY2FudmFzXG4gICAgICAgICAgdmFyICAgaXNEcmFnZ2luZyA9IGZhbHNlXG4gICAgICAgICAgdmFyICAgbGFzdFBvc1ggICA9IC0xXG4gICAgICAgICAgdmFyICAgbGFzdFBvc1kgICA9IC0xXG5cbiAgICAgICAgICBwYWdlLm9uICggXCJtb3VzZTpkb3duXCIsIGZldmVudCA9PlxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGlmICggdGhpcy5vdmVyRk9iamVjdCA9PSB1bmRlZmluZWQgKVxuICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBwYWdlLnNlbGVjdGlvbiA9IGZhbHNlXG4gICAgICAgICAgICAgICAgICAgIHBhZ2UuZGlzY2FyZEFjdGl2ZU9iamVjdCAoKVxuICAgICAgICAgICAgICAgICAgICBwYWdlLmZvckVhY2hPYmplY3QgKCBvID0+IHsgby5zZWxlY3RhYmxlID0gZmFsc2UgfSApXG5cbiAgICAgICAgICAgICAgICAgICAgaXNEcmFnZ2luZyA9IHRydWVcbiAgICAgICAgICAgICAgICAgICAgbGFzdFBvc1ggICA9IGZldmVudC5wb2ludGVyLnhcbiAgICAgICAgICAgICAgICAgICAgbGFzdFBvc1kgICA9IGZldmVudC5wb2ludGVyLnlcblxuICAgICAgICAgICAgICAgICAgICBwYWdlLnJlcXVlc3RSZW5kZXJBbGwgKClcbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICB9KVxuXG4gICAgICAgICAgcGFnZS5vbiAoIFwibW91c2U6bW92ZVwiLCBmZXZlbnQgPT5cbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBpZiAoIGlzRHJhZ2dpbmcgKVxuICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBwb2ludGVyICA9IGZldmVudC5wb2ludGVyXG5cbiAgICAgICAgICAgICAgICAgICAgcGFnZS52aWV3cG9ydFRyYW5zZm9ybSBbNF0gKz0gcG9pbnRlci54IC0gbGFzdFBvc1hcbiAgICAgICAgICAgICAgICAgICAgcGFnZS52aWV3cG9ydFRyYW5zZm9ybSBbNV0gKz0gcG9pbnRlci55IC0gbGFzdFBvc1lcblxuICAgICAgICAgICAgICAgICAgICBwYWdlLnJlcXVlc3RSZW5kZXJBbGwoKVxuXG4gICAgICAgICAgICAgICAgICAgIGxhc3RQb3NYID0gcG9pbnRlci54XG4gICAgICAgICAgICAgICAgICAgIGxhc3RQb3NZID0gcG9pbnRlci55XG4gICAgICAgICAgICAgICB9XG4gICAgICAgICAgfSlcblxuICAgICAgICAgIHBhZ2Uub24gKCBcIm1vdXNlOnVwXCIsICgpID0+XG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgcGFnZS5zZWxlY3Rpb24gPSB0cnVlXG5cbiAgICAgICAgICAgICAgIHBhZ2UuZm9yRWFjaE9iamVjdCAoIG8gPT5cbiAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgby5zZWxlY3RhYmxlID0gdHJ1ZVxuICAgICAgICAgICAgICAgICAgICBvLnNldENvb3JkcygpXG4gICAgICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICAgICBpc0RyYWdnaW5nID0gZmFsc2VcblxuICAgICAgICAgICAgICAgcGFnZS5yZXF1ZXN0UmVuZGVyQWxsICgpXG4gICAgICAgICAgfSlcbiAgICAgfVxuXG4gICAgIHByaXZhdGUgaW5pdFpvb21FdmVudCAoKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgcGFnZSA9IHRoaXMuZmNhbnZhc1xuXG4gICAgICAgICAgcGFnZS5vbiAoIFwibW91c2U6d2hlZWxcIiwgZmV2ZW50ID0+XG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgY29uc3QgZXZlbnQgICA9IGZldmVudC5lIGFzIFdoZWVsRXZlbnRcbiAgICAgICAgICAgICAgIHZhciAgIGRlbHRhICAgPSBldmVudC5kZWx0YVlcbiAgICAgICAgICAgICAgIHZhciAgIHpvb20gICAgPSBwYWdlLmdldFpvb20oKVxuICAgICAgICAgICAgICAgICAgICB6b29tICAgID0gem9vbSAtIGRlbHRhICogMC4wMDVcblxuICAgICAgICAgICAgICAgaWYgKHpvb20gPiA5KVxuICAgICAgICAgICAgICAgICAgICB6b29tID0gOVxuXG4gICAgICAgICAgICAgICBpZiAoem9vbSA8IDAuNSlcbiAgICAgICAgICAgICAgICAgICAgem9vbSA9IDAuNVxuXG4gICAgICAgICAgICAgICBwYWdlLnpvb21Ub1BvaW50KCBuZXcgZmFicmljLlBvaW50ICggZXZlbnQub2Zmc2V0WCwgZXZlbnQub2Zmc2V0WSApLCB6b29tIClcblxuICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKVxuICAgICAgICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKClcblxuICAgICAgICAgICAgICAgcGFnZS5yZXF1ZXN0UmVuZGVyQWxsICgpXG4gICAgICAgICAgfSlcbiAgICAgfVxuXG4gICAgIHByaXZhdGUgaW5pdE1vdmVPYmplY3QgKClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHBhZ2UgICAgICA9IHRoaXMuZmNhbnZhc1xuICAgICAgICAgIHZhciAgIGNsdXN0ZXIgICA9IHVuZGVmaW5lZCBhcyBmYWJyaWMuT2JqZWN0IFtdXG4gICAgICAgICAgdmFyICAgcG9zaXRpb25zID0gdW5kZWZpbmVkIGFzIG51bWJlciBbXVtdXG4gICAgICAgICAgdmFyICAgb3JpZ2luWCAgID0gMFxuICAgICAgICAgIHZhciAgIG9yaWdpblkgICA9IDBcblxuICAgICAgICAgIGZ1bmN0aW9uIG9uX3NlbGVjdGlvbiAoZmV2ZW50OiBmYWJyaWMuSUV2ZW50KVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNvbnN0IHRhcmdldCA9IGZldmVudC50YXJnZXRcbiAgICAgICAgICAgICAgIGNvbnNvbGUubG9nICggdGFyZ2V0IClcbiAgICAgICAgICAgICAgIGNsdXN0ZXIgPSB0YXJnZXQgW1wiY2x1c3RlclwiXSBhcyBmYWJyaWMuT2JqZWN0IFtdXG5cbiAgICAgICAgICAgICAgIGlmICggY2x1c3RlciA9PSB1bmRlZmluZWQgKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm5cblxuICAgICAgICAgICAgICAgb3JpZ2luWCAgID0gdGFyZ2V0LmxlZnRcbiAgICAgICAgICAgICAgIG9yaWdpblkgICA9IHRhcmdldC50b3BcbiAgICAgICAgICAgICAgIHBvc2l0aW9ucyA9IFtdXG5cbiAgICAgICAgICAgICAgIGZvciAoIGNvbnN0IG8gb2YgY2x1c3RlciApXG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9ucy5wdXNoIChbIG8ubGVmdCwgby50b3AgXSlcblxuICAgICAgICAgICAgICAgY29uc29sZS5sb2cgKFwiY3JlYXRlZFwiKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHBhZ2Uub24gKCBcInNlbGVjdGlvbjpjcmVhdGVkXCIsIG9uX3NlbGVjdGlvbiApXG4gICAgICAgICAgcGFnZS5vbiAoIFwic2VsZWN0aW9uOnVwZGF0ZWRcIiwgb25fc2VsZWN0aW9uIClcblxuICAgICAgICAgIHBhZ2Uub24gKCBcIm9iamVjdDptb3ZpbmdcIiwgZmV2ZW50ID0+XG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgaWYgKCBjbHVzdGVyID09IHVuZGVmaW5lZCApXG4gICAgICAgICAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgICAgICAgICBjb25zdCB0YXJnZXQgICA9IGZldmVudC50YXJnZXRcbiAgICAgICAgICAgICAgIGNvbnN0IG9mZnNldFggID0gdGFyZ2V0LmxlZnQgLSBvcmlnaW5YXG4gICAgICAgICAgICAgICBjb25zdCBvZmZzZXRZICA9IHRhcmdldC50b3AgIC0gb3JpZ2luWVxuXG4gICAgICAgICAgICAgICBmb3IgKCB2YXIgaSA9IDAgOyBpIDwgY2x1c3Rlci5sZW5ndGggOyBpKysgKVxuICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBvYmogPSBjbHVzdGVyIFtpXVxuICAgICAgICAgICAgICAgICAgICBjb25zdCBwb3MgPSBwb3NpdGlvbnMgW2ldXG4gICAgICAgICAgICAgICAgICAgIG9iai5zZXQgKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICBsZWZ0OiBwb3MgWzBdICsgb2Zmc2V0WCxcbiAgICAgICAgICAgICAgICAgICAgICAgICB0b3AgOiBwb3MgWzFdICsgb2Zmc2V0WVxuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgfVxuICAgICAgICAgIH0pXG5cbiAgICAgICAgICBwYWdlLm9uICggXCJzZWxlY3Rpb246Y2xlYXJlZFwiLCBmZXZlbnQgPT5cbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBjbHVzdGVyID0gdW5kZWZpbmVkXG5cbiAgICAgICAgICAgICAgIGNvbnNvbGUubG9nIChcImNsZWFyZWRcIilcbiAgICAgICAgICB9KVxuICAgICB9XG5cbiAgICAgcHJpdmF0ZSBpbml0RHJhZ0V2ZW50ICgpXG4gICAgIHtcbiAgICAgICAgICAvLyBodHRwczovL3d3dy53M3NjaG9vbHMuY29tL2h0bWwvaHRtbDVfZHJhZ2FuZGRyb3AuYXNwXG4gICAgICAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL1Nob3BpZnkvZHJhZ2dhYmxlL2Jsb2IvbWFzdGVyL3NyYy9EcmFnZ2FibGUvRHJhZ2dhYmxlLmpzXG5cbiAgICAgICAgICBjb25zdCBwYWdlICAgICAgPSB0aGlzLmZjYW52YXNcblxuICAgICAgICAgIHBhZ2Uub24gKCBcInRvdWNoOmRyYWdcIiwgZmV2ZW50ID0+XG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgLy9jb25zb2xlLmxvZyAoIGZldmVudCApXG4gICAgICAgICAgICAgICBjb25zb2xlLmxvZyAoIFwidG91Y2g6ZHJhZ1wiIClcbiAgICAgICAgICB9KVxuXG4gICAgICAgICAgcGFnZS5vbiAoIFwiZHJhZ2VudGVyXCIsIGZldmVudCA9PlxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIC8vY29uc29sZS5sb2cgKCBcIkRST1AtRU5URVJcIiwgZmV2ZW50IClcbiAgICAgICAgICB9KVxuXG4gICAgICAgICAgcGFnZS5vbiAoIFwiZHJhZ292ZXJcIiwgZmV2ZW50ID0+XG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgLy9jb25zb2xlLmxvZyAoIFwiRFJPUC1PVkVSXCIsIGZldmVudCApXG4gICAgICAgICAgfSlcblxuICAgICAgICAgIHBhZ2Uub24gKCBcImRyb3BcIiwgZmV2ZW50ID0+XG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgLy9jb25zdCBlID0gZmV2ZW50LmUgYXMgRHJhZ0V2ZW50XG4gICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nICggXCJEUk9QXCIsIGUuZGF0YVRyYW5zZmVyLmdldERhdGEgKFwidGV4dFwiKSApXG4gICAgICAgICAgfSlcbiAgICAgfVxufVxuIiwiXG5pbXBvcnQgeyBSYWRpYWxNZW51IH0gZnJvbSBcIi4uL1VpL0NvbXBvbmVudC9DaXJjdWxhci1NZW51L2luZGV4LmpzXCJcbmltcG9ydCB7IEFyZWEgfSBmcm9tIFwiLi4vVWkvQ29tcG9uZW50L0FyZWEvYXJlYS5qc1wiXG5pbXBvcnQgKiBhcyBBc3BlY3QgZnJvbSBcIi4vQXNwZWN0L2luZGV4LmpzXCJcblxuaW1wb3J0IHsgYWRkQ29tbWFuZCwgcnVuQ29tbWFuZCwgQ29tbWFuZE5hbWVzIH0gZnJvbSBcIi4vY29tbWFuZC5qc1wiXG5cbmV4cG9ydCBjb25zdCBhcmVhID0gICgoKSA9Plxue1xuICAgICBjb25zdCBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50ICggXCJjYW52YXNcIiApXG5cbiAgICAgY2FudmFzLndpZHRoICA9IGRvY3VtZW50LmJvZHkuY2xpZW50V2lkdGhcbiAgICAgY2FudmFzLmhlaWdodCA9IGRvY3VtZW50LmJvZHkuY2xpZW50SGVpZ2h0XG5cbiAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmQgKCBjYW52YXMgKVxuXG4gICAgIHJldHVybiBuZXcgQXJlYSAoIGNhbnZhcyApXG59KSAoKVxuXG5leHBvcnQgY29uc3QgY29udGV4dHVhbE1lbnUgPSBuZXcgUmFkaWFsTWVudSAoe1xuICAgICBjb250ZXh0OiBcImNvbmNlcHQtdWlcIixcbiAgICAgdHlwZTogXCJyYWRpYWwtbWVudVwiLFxuICAgICBpZDogXCJhcmVhLW1lbnVcIixcbiAgICAgYnV0dG9uczogW1xuICAgICAgICAgIHsgdHlwZTogXCJidXR0b25cIiwgaWQ6IFwiYWRkLXRoaW5nXCIgLCB0ZXh0OiBcIlwiLCBpY29uOiBcIiYjeGUzYzg7XCIsIGZvbnRGYW1pbHk6IFwiTWF0ZXJpYWwgSWNvbnNcIiwgY2FsbGJhY2s6ICgpID0+IHsgcnVuQ29tbWFuZCAoIFwiem9vbS1leHRlbmRzXCIgKSB9IH0sIC8vIGRldGFpbHNcbiAgICAgICAgICB7IHR5cGU6IFwiYnV0dG9uXCIsIGlkOiBcImFkZC1idWJibGVcIiwgdGV4dDogXCJcIiwgaWNvbjogXCImI3hlNmRkO1wiLCBmb250RmFtaWx5OiBcIk1hdGVyaWFsIEljb25zXCIgfSxcbiAgICAgICAgICB7IHR5cGU6IFwiYnV0dG9uXCIsIGlkOiBcImFkZC1ub3RlXCIgICwgdGV4dDogXCJcIiwgaWNvbjogXCImI3hlMjQ0O1wiLCBmb250RmFtaWx5OiBcIk1hdGVyaWFsIEljb25zXCIsIGNvbW1hbmQ6IFwicGFjay12aWV3XCIgfSwgLy8gZm9ybWF0X3F1b3RlXG4gICAgICAgICAgeyB0eXBlOiBcImJ1dHRvblwiLCBpZDogXCJhZGQtcGVvcGxlXCIsIHRleHQ6IFwiXCIsIGljb246IFwiJiN4ZTg3YztcIiwgZm9udEZhbWlseTogXCJNYXRlcmlhbCBJY29uc1wiIH0sIC8vIGZhY2VcbiAgICAgICAgICB7IHR5cGU6IFwiYnV0dG9uXCIsIGlkOiBcImFkZC10YWdcIiAgICwgdGV4dDogXCJcIiwgaWNvbjogXCImI3hlODY3O1wiLCBmb250RmFtaWx5OiBcIk1hdGVyaWFsIEljb25zXCIgfSwgLy8gYm9va21hcmtfYm9yZGVyXG4gICAgIF0gYXMgYW55LFxuICAgICByb3RhdGlvbjogTWF0aC5QSS8yLFxufSlcblxuZG9jdW1lbnQuYm9keS5hcHBlbmQgKCAuLi4gY29udGV4dHVhbE1lbnUuZ2V0SHRtbCAoKSApXG5cbi8vIENPTU1BTkRTXG5cbmV4cG9ydCB0eXBlIEFyZWFDb21tYW5kcyA9XG57XG4gICAgIFwiYWRkLXNraWxsXCIgICAgICAgICAgIDogKCB0aXRsZTogc3RyaW5nICkgPT4gdm9pZCxcbiAgICAgXCJhZGQtcGVyc29uXCIgICAgICAgICAgOiAoIG5hbWU6IHN0cmluZyApID0+IHZvaWQsXG4gICAgIFwiem9vbS1leHRlbmRzXCIgICAgICAgIDogKCkgPT4gdm9pZCxcbiAgICAgXCJ6b29tLXRvXCIgICAgICAgICAgICAgOiAoIHNoYXBlOiBBc3BlY3QuU2hhcGUgKSA9PiB2b2lkLFxuICAgICBcInBhY2stdmlld1wiICAgICAgICAgICA6ICgpID0+IHZvaWQsXG4gICAgIFwib3Blbi1jb250ZXh0YWwtbWVudVwiIDogKCB4OiBudW1iZXIsIHk6IG51bWJlciApID0+IHZvaWQsXG4gICAgIFwiY2xvc2UtY29udGV4dGFsLW1lbnVcIjogKCkgPT4gdm9pZCxcbn1cblxuYWRkQ29tbWFuZCAoIFwib3Blbi1jb250ZXh0YWwtbWVudVwiLCAoIHg6IG51bWJlciwgeTogbnVtYmVyICkgPT5cbntcbiAgICAgY29udGV4dHVhbE1lbnUuc2hvdyAoIHgsIHkgKVxufSlcblxuYWRkQ29tbWFuZCAoIFwiY2xvc2UtY29udGV4dGFsLW1lbnVcIiwgKCkgPT5cbntcbiAgICAgY29udGV4dHVhbE1lbnUuaGlkZSAoKVxufSlcblxuYWRkQ29tbWFuZCAoIFwiYWRkLXNraWxsXCIsICggdGl0bGUgKSA9Plxue1xuICAgICBjb25zb2xlLmxvZyAoIFwiQWRkIHNraWxsXCIgKVxufSlcblxuYWRkQ29tbWFuZCAoIFwiYWRkLXBlcnNvblwiLCAoIG5hbWUgKSA9Plxue1xuXG59KVxuXG5hZGRDb21tYW5kICggXCJ6b29tLWV4dGVuZHNcIiwgKCkgPT5cbntcbiAgICAgYXJlYS56b29tICgpXG59KVxuXG5hZGRDb21tYW5kICggXCJ6b29tLXRvXCIsICggc2hhcGUgKSA9Plxue1xuICAgICBhcmVhLnpvb20gKCBzaGFwZSApXG4gICAgIGFyZWEuaXNvbGF0ZSAoIHNoYXBlIClcbn0pXG5cbmFkZENvbW1hbmQgKCBcInBhY2stdmlld1wiLCAoKSA9Plxue1xuICAgICBhcmVhLnBhY2sgKClcbn0pXG5cbi8vIENMSUNLIEVWRU5UU1xuXG4vLyBhcmVhLm9uVG91Y2hPYmplY3QgPSAoIHNoYXBlICkgPT5cbi8vIHtcbi8vICAgICAgcnVuQ29tbWFuZCAoIFwiem9vbS10b1wiLCBzaGFwZSApXG4vLyB9XG5cbmFyZWEub25Eb3VibGVUb3VjaE9iamVjdCA9ICggc2hhcGUgKSA9Plxue1xuICAgICBpZiAoIHNoYXBlLmNvbmZpZy5vblRvdWNoICE9IHVuZGVmaW5lZCApXG4gICAgICAgICAgc2hhcGUuY29uZmlnLm9uVG91Y2ggKCBzaGFwZSApXG59XG5cbmFyZWEub25Ub3VjaEFyZWEgPSAoIHgsIHkgKSA9Plxue1xuICAgICBydW5Db21tYW5kICggXCJvcGVuLWNvbnRleHRhbC1tZW51XCIsIHgsIHkgKVxufVxuXG4vLyBIT1ZFUiBFVkVOVFNcblxuYXJlYS5vbk92ZXJPYmplY3QgPSAoIHNoYXBlICkgPT5cbntcbiAgICAgc2hhcGUuaG92ZXIgKCB0cnVlIClcbiAgICAgYXJlYS5mY2FudmFzLnJlcXVlc3RSZW5kZXJBbGwgKClcbn1cblxuYXJlYS5vbk91dE9iamVjdCA9ICggc2hhcGUgKSA9Plxue1xuICAgICBzaGFwZS5ob3ZlciAoIGZhbHNlIClcbiAgICAgYXJlYS5mY2FudmFzLnJlcXVlc3RSZW5kZXJBbGwgKClcbn1cblxuLy8gVEVTVFxuXG5pZiAoIG5hdmlnYXRvci5tYXhUb3VjaFBvaW50cyA+IDAgKVxue1xuXG4gICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyICggXCJwb2ludGVybW92ZVwiLCBldmVudCA9PlxuICAgICB7XG4gICAgICAgICAgLy9jb25zdCB0YXJnZXQgPSBhcmVhLmZjYW52YXMuZmluZFRhcmdldCAoIGV2ZW50LCB0cnVlIClcbiAgICAgICAgICAvL2lmICggdGFyZ2V0IClcbiAgICAgICAgICAvLyAgICAgY29uc29sZS5sb2cgKCB0YXJnZXQgKVxuICAgICB9KVxufVxuZWxzZVxue1xuICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lciAoIFwibW91c2Vtb3ZlXCIsIGV2ZW50ID0+XG4gICAgIHtcbiAgICAgICAgICAvL2NvbnN0IHRhcmdldCA9IGFyZWEuZmNhbnZhcy5maW5kVGFyZ2V0ICggZXZlbnQsIHRydWUgKVxuICAgICAgICAgIC8vaWYgKCB0YXJnZXQgKVxuICAgICAgICAgIC8vICAgICBjb25zb2xlLmxvZyAoIHRhcmdldCApXG4gICAgIH0pXG59XG4iLCJcbmltcG9ydCBcIi4uL0xpYi9pbmRleC5qc1wiXG5pbXBvcnQgXCIuLi9EYXRhL2luZGV4LmpzXCJcbmltcG9ydCBcIi4uL1VpL2luZGV4LmpzXCJcblxuaW1wb3J0IFwiLi9Bc3BlY3QvaW5kZXguanNcIlxuXG5leHBvcnQgKiBmcm9tIFwiLi9EYXRhL2luZGV4LmpzXCJcblxuXG5pbXBvcnQgXCIuL2NvbnRleHQtbWVudS5qc1wiXG5pbXBvcnQgXCIuL21lbnUuanNcIlxuaW1wb3J0IFwiLi9wYW5lbC5qc1wiXG5pbXBvcnQgXCIuL2FyZWEuanNcIlxuXG5leHBvcnQgKiBmcm9tIFwiLi9jb21tYW5kLmpzXCJcbmV4cG9ydCAqIGZyb20gXCIuL2FyZWEuanNcIlxuXG5cbmltcG9ydCB7IGFyZWEsIGNvbnRleHR1YWxNZW51IH0gZnJvbSBcIi4vYXJlYS5qc1wiXG5pbXBvcnQgeyBwYW5lbCB9IGZyb20gXCIuL3BhbmVsLmpzXCJcbmltcG9ydCB7IG1lbnUgfSBmcm9tIFwiLi9tZW51LmpzXCJcbmltcG9ydCB7IG9uQ29tbWFuZCB9IGZyb20gXCIuL2NvbW1hbmQuanNcIlxuXG5leHBvcnQgZnVuY3Rpb24gd2lkdGggKClcbntcbiAgICAgcmV0dXJuIGFyZWEuZmNhbnZhcy5nZXRXaWR0aCAoKVxufVxuXG5leHBvcnQgZnVuY3Rpb24gaGVpZ2h0ICgpXG57XG4gICAgIHJldHVybiBhcmVhLmZjYW52YXMuZ2V0SGVpZ2h0ICgpXG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZWZyZXNoICgpXG57XG4gICAgIC8vJGFyZWEuc2V0Wm9vbSAoMC4xKVxuICAgICBhcmVhLmZjYW52YXMucmVxdWVzdFJlbmRlckFsbCAoKVxufVxuXG5vbkNvbW1hbmQgKCBcIm9wZW4tbWVudVwiLCAoKSA9Plxue1xuICAgICBwYW5lbC5jbG9zZSAoKVxuICAgICBjb250ZXh0dWFsTWVudS5oaWRlICgpXG59KVxub25Db21tYW5kICggXCJvcGVuLXBhbmVsXCIsICgpID0+XG57XG4gICAgIG1lbnUuY2xvc2UgKClcbiAgICAgY29udGV4dHVhbE1lbnUuaGlkZSAoKVxufSlcbiIsIi8vLyA8cmVmZXJlbmNlIHR5cGVzPVwiZmFrZXJcIiAvPlxuZGVjbGFyZSBjb25zdCBmYWtlcjogRmFrZXIuRmFrZXJTdGF0aWNcblxuaW1wb3J0ICogYXMgYXBwIGZyb20gXCIuLi9BcHBsaWNhdGlvbi9pbmRleC5qc1wiXG5cbmNvbnN0IHJhbmRvbUludCA9IChtaW46IG51bWJlciwgbWF4OiBudW1iZXIpID0+XG57XG4gICAgIHJldHVybiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAobWF4IC0gbWluICsgMSkpICsgbWluO1xufVxuXG5jb25zdCBhcmVhID0gYXBwLmFyZWFcbmNvbnN0IHZpZXcgPSBhcmVhLmNyZWF0ZVZpZXcgKCBcImNvbXDDqXRhbmNlc1wiIClcbmFyZWEudXNlICggdmlldyApXG5cbi8vIFBlcnNvblxuXG5jb25zdCBwZXJzb25OYW1lcyA9IFtdXG5mb3IgKCB2YXIgaSA9IDEgOyBpIDw9IDIwIDsgaSsrIClcbntcbiAgICAgYXBwLnNldERhdGEgPCRQZXJzb24+ICh7XG4gICAgICAgICAgdHlwZSAgICAgOiBcInBlcnNvblwiLFxuICAgICAgICAgIGlkICAgICAgIDogXCJ1c2VyXCIgKyBpLFxuICAgICAgICAgIGZpcnN0TmFtZTogZmFrZXIubmFtZS5maXJzdE5hbWUgKCksXG4gICAgICAgICAgbGFzdE5hbWUgOiBmYWtlci5uYW1lLmxhc3ROYW1lICgpLFxuICAgICAgICAgIGF2YXRhciAgIDogYC4vYXZhdGFycy9mICgke2l9KS5qcGdgLFxuICAgICAgICAgIGlzQ2FwdGFpbjogcmFuZG9tSW50ICgwLDQpID09IDEgLy9pICUgNCA9PSAwLFxuICAgICB9KVxuXG4gICAgIGFwcC5zZXREYXRhIDwkUGVyc29uPiAoe1xuICAgICAgICAgIHR5cGUgICAgIDogXCJwZXJzb25cIixcbiAgICAgICAgICBpZCAgICAgICA6IFwidXNlclwiICsgKDIwICsgaSksXG4gICAgICAgICAgZmlyc3ROYW1lOiBmYWtlci5uYW1lLmZpcnN0TmFtZSAoKSxcbiAgICAgICAgICBsYXN0TmFtZSA6IGZha2VyLm5hbWUubGFzdE5hbWUgKCksXG4gICAgICAgICAgYXZhdGFyICAgOiBgLi9hdmF0YXJzL2ggKCR7aX0pLmpwZ2AsXG4gICAgICAgICAgaXNDYXB0YWluOiByYW5kb21JbnQgKDAsNCkgPT0gMSAvLyAoMjAgKyBpKSAlIDQgPT0gMCxcbiAgICAgfSlcblxuICAgICBwZXJzb25OYW1lcy5wdXNoICggXCJ1c2VyXCIgKyBpLCBcInVzZXJcIiArICgyMCArIGkpIClcblxuICAgICAvLyBhcmVhLmFkZCAoIFwicGVyc29uXCIsIFwidXNlclwiICsgaSApXG4gICAgIC8vIGFyZWEuYWRkICggXCJwZXJzb25cIiwgXCJ1c2VyXCIgKyAoaSArIDIwKSApXG59XG5cbi8vIEJhZGdlc1xuXG4vLyBodHRwczovL2RyaXZlLmdvb2dsZS5jb20vZHJpdmUvZm9sZGVycy8xS3dXbDlHX0E4djkxTkxYQXBqWkdIQ2ZueF9tbmZNRTRcbi8vIGh0dHBzOi8vcmVjb25uYWl0cmUub3BlbnJlY29nbml0aW9uLm9yZy9yZXNzb3VyY2VzL1xuLy8gaHR0cHM6Ly93d3cubGV0dWRpYW50LmZyL2VkdWNwcm9zL2FjdHVhbGl0ZS9sZXMtb3Blbi1iYWRnZXMtdW4tY29tcGxlbWVudC1hdXgtZGlwbG9tZXMtdW5pdmVyc2l0YWlyZXMuaHRtbFxuXG4vLyBodHRwczovL3d3dy5lY2hvc2NpZW5jZXMtbm9ybWFuZGllLmZyL2NvbW11bmF1dGVzL2xlLWRvbWUvYXJ0aWNsZXMvYmFkZ2UtZG9tZVxuXG5jb25zdCBiYWRnZVByZXNldHMgPSB7IC8vIFBhcnRpYWwgPCRCYWRnZT5cbiAgICAgZGVmYXVsdCAgICAgICA6IHsgaWQ6IFwiZGVmYXVsdFwiICAgICAgLCBlbW9qaTogXCLwn6aBXCIgfSxcbiAgICAgaGF0ICAgICAgICAgICA6IHsgaWQ6IFwiaGF0XCIgICAgICAgICAgLCBlbW9qaTogXCLwn46pXCIgfSxcbiAgICAgc3RhciAgICAgICAgICA6IHsgaWQ6IFwic3RhclwiICAgICAgICAgLCBlbW9qaTogXCLirZBcIiB9LFxuICAgICBjbG90aGVzICAgICAgIDogeyBpZDogXCJjbG90aGVzXCIgICAgICAsIGVtb2ppOiBcIvCfkZVcIiB9LFxuICAgICBlY29sb2d5ICAgICAgIDogeyBpZDogXCJlY29sb2d5XCIgICAgICAsIGVtb2ppOiBcIvCfkqdcIiB9LFxuICAgICBwcm9ncmFtbWluZyAgIDogeyBpZDogXCJwcm9ncmFtbWluZ1wiICAsIGVtb2ppOiBcIvCfkr5cIiB9LFxuICAgICBjb21tdW5pY2F0aW9uIDogeyBpZDogXCJjb21tdW5pY2F0aW9uXCIsIGVtb2ppOiBcIvCfk6JcIiB9LFxuICAgICBjb25zdHJ1Y3Rpb24gIDogeyBpZDogXCJjb25zdHJ1Y3Rpb25cIiAsIGVtb2ppOiBcIvCflKhcIiB9LFxuICAgICBiaW9sb2d5ICAgICAgIDogeyBpZDogXCJiaW9sb2d5XCIgICAgICAsIGVtb2ppOiBcIvCflKxcIiB9LFxuICAgICByb2JvdGljICAgICAgIDogeyBpZDogXCJyb2JvdGljXCIgICAgICAsIGVtb2ppOiBcIvCfpJZcIiB9LFxuICAgICBnYW1lICAgICAgICAgIDogeyBpZDogXCJnYW1lXCIgICAgICAgICAsIGVtb2ppOiBcIvCfpKFcIiB9LFxuICAgICBtdXNpYyAgICAgICAgIDogeyBpZDogXCJtdXNpY1wiICAgICAgICAsIGVtb2ppOiBcIvCfpYFcIiB9LFxuICAgICBsaW9uICAgICAgICAgIDogeyBpZDogXCJsaW9uXCIgICAgICAgICAsIGVtb2ppOiBcIvCfpoFcIiB9LFxuICAgICB2b2x0YWdlICAgICAgIDogeyBpZDogXCJ2b2x0YWdlXCIgICAgICAsIGVtb2ppOiBcIuKaoVwiIH0sXG59XG5cbmZvciAoIGNvbnN0IG5hbWUgaW4gYmFkZ2VQcmVzZXRzIClcbiAgICAgYXBwLnNldERhdGEgKHsgY29udGV4dDogXCJjb25jZXB0LWRhdGFcIiwgdHlwZTogXCJiYWRnZVwiLCAuLi4gYmFkZ2VQcmVzZXRzIFtuYW1lXSB9KVxuXG4vLyBTa2lsbHNcblxuZm9yICggY29uc3QgbmFtZSBpbiBiYWRnZVByZXNldHMgKVxue1xuICAgICBjb25zdCBwZW9wbGUgPSBbXSBhcyAkUGVyc29uIFtdXG5cbiAgICAgZm9yICggdmFyIGogPSByYW5kb21JbnQgKCAwLCA2ICkgOyBqID4gMCA7IGotLSApXG4gICAgIHtcbiAgICAgICAgICBjb25zdCBuYW1lID0gcGVyc29uTmFtZXMuc3BsaWNlICggcmFuZG9tSW50ICggMSwgcGVyc29uTmFtZXMubGVuZ3RoICksIDEgKSBbMF1cblxuICAgICAgICAgIGlmICggbmFtZSApXG4gICAgICAgICAgICAgICBwZW9wbGUucHVzaCAoIGFwcC5nZXREYXRhIDwkUGVyc29uPiAoIFwicGVyc29uXCIsIG5hbWUgKSApXG4gICAgIH1cblxuICAgICBhcHAuc2V0RGF0YSA8JFNraWxsPiAoe1xuICAgICAgICAgIGNvbnRleHQ6IFwiY29uY2VwdC1kYXRhXCIsXG4gICAgICAgICAgdHlwZSAgIDogXCJza2lsbFwiLFxuICAgICAgICAgIGlkICAgICA6IG5hbWUsXG4gICAgICAgICAgaWNvbiAgIDogbmFtZSxcbiAgICAgICAgICBpdGVtcyAgOiBwZW9wbGVcbiAgICAgfSlcblxufVxuXG4vL1xuXG5mb3IgKCBjb25zdCBuYW1lIGluIGJhZGdlUHJlc2V0cyApXG4gICAgIGFyZWEuYWRkICggXCJza2lsbFwiLCBuYW1lIClcblxuLy8gTm90ZXNcblxuLy8gY29uc3Qgbm90ZSA9ICBuZXcgQi5Ob3RlICh7XG4vLyAgICAgIHRleHQ6IFwiQSBub3RlIC4uLlwiLFxuLy8gfSlcbi8vIGFyZWEuYWRkICggQXNwZWN0LmNyZWF0ZSAoIG5vdGUgKSApXG5cblxuYXJlYS5wYWNrICgpXG5hcmVhLnpvb20gKClcblxuXG4vLyBDbHVzdGVyIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vL1xuLy8gY29uc3QgdDEgPSBuZXcgZmFicmljLlRleHRib3ggKCBcIkVkaXRhYmxlID9cIiwge1xuLy8gICAgICB0b3A6IDUwLFxuLy8gICAgICBsZWZ0OiAzMDAsXG4vLyAgICAgIGZvbnRTaXplOiAzMCxcbi8vICAgICAgc2VsZWN0YWJsZTogdHJ1ZSxcbi8vICAgICAgZWRpdGFibGU6IHRydWUsXG4vLyAgICAgIG9yaWdpblg6IFwiY2VudGVyXCIsXG4vLyAgICAgIG9yaWdpblk6IFwiY2VudGVyXCIsXG4vLyB9KVxuLy8gY29uc3QgcjEgPSBuZXcgZmFicmljLlJlY3QgKHtcbi8vICAgICAgdG9wICAgOiAwLFxuLy8gICAgICBsZWZ0ICA6IDMwMCxcbi8vICAgICAgd2lkdGggOiA1MCxcbi8vICAgICAgaGVpZ2h0OiA1MCxcbi8vICAgICAgZmlsbCAgOiBcImJsdWVcIixcbi8vICAgICAgc2VsZWN0YWJsZTogdHJ1ZSxcbi8vICAgICAgb3JpZ2luWDogXCJjZW50ZXJcIixcbi8vICAgICAgb3JpZ2luWTogXCJjZW50ZXJcIixcbi8vIH0pXG4vLyAkYXBwLl9sYXlvdXQuYXJlYS5hZGQgKHQxKVxuLy8gJGFwcC5fbGF5b3V0LmFyZWEuYWRkIChyMSlcbi8vIHQxW1wiY2x1c3RlclwiXSA9IFsgcjEgXVxuLy8gcjFbXCJjbHVzdGVyXCJdID0gWyB0MSBdXG5cbiJdLCJuYW1lcyI6WyJOb2RlIiwiZGVmYXVsdENvbmZpZyIsImRyYWdnYWJsZSIsIlVpLmRyYWdnYWJsZSIsIkNzcy5nZXRVbml0IiwidUV2ZW50LmNyZWF0ZSIsIlN2Zy5jcmVhdGVTdmdTaGFwZSIsIkNPTlRFWFQiLCJub3JtYWxpemUiLCJkYi5nZXREYXRhIiwiRmFjdG9yeSIsIkdlb21ldHJ5IiwiZGIiLCJmYWN0b3J5IiwiQ29udGFpbmVyIiwiR2VvbWV0cnkucGFja0VuY2xvc2UiLCJjbWQiLCJ1aS5tYWtlIiwidWkucGljayIs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RSxHQUFHLENBQUMsQ0FBQTtRQUNqQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsR0FBRyxDQUFDLENBQUE7UUFDakMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLEdBQUcsQ0FBQyxDQUFBO1FBRWpDLE1BQU0sRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQ1IsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQ1osRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQ1osRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQ1osRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQ1osRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBRVosRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxFQUNoQyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxFQUNyQyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxFQUVyQyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxFQUN0QixFQUFFLEdBQUcsQ0FBRSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEtBQU8sRUFBRSxHQUFHLENBQUMsQ0FBRSxHQUFHLEVBQUUsRUFDNUMsRUFBRSxHQUFHLENBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxJQUFLLEVBQUUsRUFDL0IsRUFBRSxHQUFHLENBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxLQUFPLEVBQUUsR0FBRyxDQUFDLENBQUUsR0FBRyxFQUFFLEVBQzVDLEVBQUUsR0FBRyxDQUFFLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsSUFBSyxFQUFFLEVBRS9CLENBQUMsR0FBSSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUMxQixDQUFDLEdBQUksQ0FBQyxJQUFLLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUUsRUFDbkMsQ0FBQyxHQUFJLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxFQUNoQyxDQUFDLEdBQUksRUFBRyxDQUFDLEdBQUcsQ0FBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFFLEtBQU8sQ0FBQyxHQUFHLENBQUMsQ0FBRSxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUUsQ0FBQTtRQUVsRixPQUFPO1lBQ0YsQ0FBQyxFQUFFLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUM7WUFDbkIsQ0FBQyxFQUFFLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUM7WUFDbkIsQ0FBQyxFQUFFLENBQUM7U0FDUixDQUFDO0lBQ1AsQ0FBQzs7SUNsTUQ7QUFFQSxJQUlBLFNBQVMsS0FBSyxDQUFHLENBQVMsRUFBRSxDQUFTLEVBQUUsQ0FBUztRQUUzQyxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQ2IsQ0FBUyxFQUNULEVBQVUsRUFDVixFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUNkLENBQVUsRUFDVixFQUFVLEVBQ1YsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQTtRQUUzQixJQUFLLEVBQUUsRUFDUDtZQUNLLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxJQUFJLEVBQUUsQ0FBQTtZQUN4QixFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsSUFBSSxFQUFFLENBQUE7WUFFeEIsSUFBSyxFQUFFLEdBQUcsRUFBRSxFQUNaO2dCQUNLLENBQUMsR0FBRyxDQUFFLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxLQUFPLENBQUMsR0FBRyxFQUFFLENBQUUsQ0FBQTtnQkFDakMsQ0FBQyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBRSxDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFFLENBQUUsQ0FBQTtnQkFDL0MsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQTtnQkFDM0IsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQTthQUMvQjtpQkFFRDtnQkFDSyxDQUFDLEdBQUcsQ0FBRSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsS0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFFLENBQUE7Z0JBQ2pDLENBQUMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFFLElBQUksQ0FBQyxHQUFHLENBQUUsQ0FBQyxFQUFFLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBRSxDQUFFLENBQUE7Z0JBQy9DLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUE7Z0JBQzNCLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUE7YUFDL0I7U0FDTDthQUVEO1lBQ0ssQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUE7WUFDZixDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUE7U0FDYjtJQUNOLENBQUM7SUFFRCxTQUFTLFVBQVUsQ0FBRyxDQUFTLEVBQUUsQ0FBUztRQUVyQyxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxFQUFFLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUMxRCxPQUFPLEVBQUUsR0FBRyxDQUFDLElBQUksRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUM7SUFDbEQsQ0FBQztJQUVELFNBQVMsS0FBSyxDQUFHLElBQVU7UUFFdEIsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsRUFDVCxDQUFDLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQ2YsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFDZCxFQUFFLEdBQUcsQ0FBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFLLEVBQUUsRUFDbkMsRUFBRSxHQUFHLENBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSyxFQUFFLENBQUM7UUFDekMsT0FBTyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUM7SUFDOUIsQ0FBQztJQUVELE1BQU1BLE1BQUk7UUFJTCxZQUFxQixDQUFTO1lBQVQsTUFBQyxHQUFELENBQUMsQ0FBUTtZQUY5QixTQUFJLEdBQU8sSUFBWSxDQUFBO1lBQ3ZCLGFBQVEsR0FBRyxJQUFZLENBQUE7U0FDWTtLQUN2QztBQUVELGFBQWdCLFdBQVcsQ0FBRyxPQUFpQjtRQUUxQyxJQUFLLEVBQUcsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUU7WUFBRyxPQUFPLENBQUMsQ0FBQztRQUV4QyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxzQkFBc0IsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQzs7UUFHNUQsQ0FBQyxHQUFHLE9BQU8sQ0FBRSxDQUFDLENBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNuQyxJQUFLLEVBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBRTtZQUFHLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQzs7UUFHN0IsQ0FBQyxHQUFHLE9BQU8sQ0FBRSxDQUFDLENBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDakQsSUFBSyxFQUFHLENBQUMsR0FBRyxDQUFDLENBQUU7WUFBRyxPQUFPLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQzs7UUFHbkMsS0FBSyxDQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxHQUFHLE9BQU8sQ0FBRSxDQUFDLENBQUUsQ0FBRSxDQUFDOztRQUdoQyxDQUFDLEdBQUcsSUFBSUEsTUFBSSxDQUFFLENBQUMsQ0FBRSxFQUFFLENBQUMsR0FBRyxJQUFJQSxNQUFJLENBQUUsQ0FBQyxDQUFFLEVBQUUsQ0FBQyxHQUFHLElBQUlBLE1BQUksQ0FBRSxDQUFDLENBQUUsQ0FBQztRQUN4RCxDQUFDLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQyxRQUFRLEdBQUcsQ0FBQyxDQUFDO1FBQ3hCLENBQUMsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDLFFBQVEsR0FBRyxDQUFDLENBQUM7UUFDeEIsQ0FBQyxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsUUFBUSxHQUFHLENBQUMsQ0FBQzs7UUFHeEIsSUFBSSxFQUFFLEtBQU0sQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUM3QjtZQUNLLEtBQUssQ0FBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE9BQU8sQ0FBRSxDQUFDLENBQUUsQ0FBRSxFQUFFLENBQUMsR0FBRyxJQUFJQSxNQUFJLENBQUUsQ0FBQyxDQUFFLENBQUM7Ozs7WUFLdkQsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxRQUFRLEVBQUUsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNuRCxHQUNBO2dCQUNLLElBQUssRUFBRSxJQUFJLEVBQUUsRUFDYjtvQkFDSyxJQUFLLFVBQVUsQ0FBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUUsRUFDM0I7d0JBQ0ssQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsUUFBUSxHQUFHLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQzt3QkFDdkMsU0FBUyxJQUFJLENBQUM7cUJBQ2xCO29CQUNELEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztpQkFDNUI7cUJBQ0Q7b0JBQ0ssSUFBSyxVQUFVLENBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFFLEVBQzNCO3dCQUNLLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLFFBQVEsR0FBRyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7d0JBQ3ZDLFNBQVMsSUFBSSxDQUFDO3FCQUNsQjtvQkFDRCxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxRQUFRLENBQUM7aUJBQ2hDO2FBQ0wsUUFBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksRUFBRzs7WUFHekIsQ0FBQyxDQUFDLFFBQVEsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsUUFBUSxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7O1lBR3hELEVBQUUsR0FBRyxLQUFLLENBQUUsQ0FBQyxDQUFFLENBQUM7WUFDaEIsT0FBUSxDQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxNQUFPLENBQUMsRUFDNUI7Z0JBQ0ssSUFBSyxDQUFFLEVBQUUsR0FBRyxLQUFLLENBQUUsQ0FBQyxDQUFFLElBQUssRUFBRSxFQUM3QjtvQkFDSyxDQUFDLEdBQUcsQ0FBQzt3QkFDTCxFQUFFLEdBQUcsRUFBRSxDQUFDO2lCQUNaO2FBQ0w7WUFDRCxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztTQUNmOztRQUdELENBQUMsR0FBRyxDQUFFLENBQUMsQ0FBQyxDQUFDLENBQUUsQ0FBQTtRQUNYLENBQUMsR0FBRyxDQUFDLENBQUE7UUFDTCxPQUFRLENBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLE1BQU8sQ0FBQztZQUN2QixDQUFDLENBQUMsSUFBSSxDQUFFLENBQUMsQ0FBQyxDQUFDLENBQUUsQ0FBQztRQUNuQixDQUFDLEdBQUcsT0FBTyxDQUFFLENBQUMsQ0FBRSxDQUFBOztRQUdoQixLQUFNLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLENBQUMsRUFDdkI7WUFDSyxDQUFDLEdBQUcsT0FBTyxDQUFFLENBQUMsQ0FBRTtnQkFDaEIsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztnQkFDVixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUE7U0FDZDtRQUVELE9BQU8sQ0FBQyxDQUFDLENBQVcsQ0FBQTtJQUN6QixDQUFDO0FBRUQsYUFBZ0IsV0FBVyxDQUFHLE9BQWlCO1FBRTFDLFdBQVcsQ0FBRSxPQUFPLENBQUUsQ0FBQztRQUN2QixPQUFPLE9BQW1CLENBQUM7SUFDaEMsQ0FBQzs7Ozs7Ozs7Ozs7O2FDcEplLE9BQU8sQ0FBRyxLQUFVO1FBRWhDLElBQUssT0FBTyxLQUFLLElBQUksUUFBUTtZQUN4QixPQUFPLFNBQVMsQ0FBQTtRQUVyQixNQUFNLEtBQUssR0FBRyw0R0FBNEc7YUFDL0csSUFBSSxDQUFFLEtBQUssQ0FBRSxDQUFDO1FBRXpCLElBQUssS0FBSztZQUNMLE9BQU8sS0FBSyxDQUFFLENBQUMsQ0FBUyxDQUFBO1FBRTdCLE9BQU8sU0FBUyxDQUFBO0lBQ3BCLENBQUM7O0lDcEJEO0lBaUJBLElBQUksTUFBTSxHQUFHLENBQUMsQ0FBQTtBQUVkLGFBQWdCLFVBQVUsQ0FBNEQsSUFBTyxFQUFFLEVBQVUsRUFBRSxJQUF1QztRQUkzSSxJQUFVLENBQUMsSUFBSSxHQUFHLElBQUksQ0FDdkI7UUFBQyxJQUFVLENBQUMsRUFBRSxHQUFLLEVBQUUsSUFBSSxDQUFDLEVBQUUsTUFBTSxFQUFFLFFBQVEsRUFBRyxDQUFBO1FBQ2hELE9BQU8sSUFBUyxDQUFBO0lBQ3JCLENBQUM7QUFFRCxJQVlBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztPQXlDRzs7VUM1RVUsUUFBUTtRQUFyQjtZQUVLLFlBQU8sR0FBRyxFQU1ULENBQUE7U0FrSUw7UUFoSUksR0FBRyxDQUFHLElBQVU7WUFFWCxJQUFNLEdBQUcsR0FBSSxJQUFJLENBQUMsT0FBYyxDQUFBO1lBQ2hDLElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQTtZQUViLEtBQU0sTUFBTSxDQUFDLElBQUksSUFBSSxFQUNyQjtnQkFDSyxLQUFLLEVBQUcsQ0FBQTtnQkFFUixJQUFLLENBQUMsSUFBSSxHQUFHLEVBQ2I7b0JBQ0ssSUFBSyxDQUFDLEtBQUssU0FBUzt3QkFDZixNQUFLO29CQUVWLEdBQUcsR0FBRyxHQUFHLENBQUUsQ0FBQyxDQUFDLENBQUE7aUJBQ2pCO3FCQUVEO29CQUNLLE9BQU8sS0FBSyxDQUFBO2lCQUNoQjthQUNMO1lBRUQsT0FBTyxJQUFJLENBQUMsTUFBTSxJQUFJLEtBQUssQ0FBQTtTQUMvQjtRQUVELEtBQUssQ0FBRyxJQUFVO1lBRWIsSUFBSyxHQUFHLEdBQUcsSUFBSSxDQUFDLE9BQWMsQ0FBQTtZQUU5QixLQUFNLE1BQU0sQ0FBQyxJQUFJLElBQUksRUFDckI7Z0JBQ0ssSUFBSyxDQUFDLEtBQUssU0FBUztvQkFDZixNQUFLO2dCQUVWLElBQUssQ0FBQyxJQUFJLEdBQUc7b0JBQ1IsR0FBRyxHQUFHLEdBQUcsQ0FBRSxDQUFDLENBQUMsQ0FBQTs7b0JBRWIsT0FBTyxDQUFDLENBQUE7YUFDakI7O1lBR0QsT0FBTyxTQUFTLElBQUksR0FBRztrQkFDaEIsTUFBTSxDQUFDLElBQUksQ0FBRyxHQUFHLENBQUUsQ0FBQyxNQUFNLEdBQUcsQ0FBQztrQkFDOUIsTUFBTSxDQUFDLElBQUksQ0FBRyxHQUFHLENBQUUsQ0FBQyxNQUFNLENBQUE7U0FFckM7UUFFRCxHQUFHLENBQUcsSUFBVSxFQUFFLElBQU87WUFFcEIsTUFBTSxHQUFHLEdBQUcsU0FBUyxDQUFBO1lBQ3JCLElBQU0sR0FBRyxHQUFJLElBQUksQ0FBQyxPQUFjLENBQUE7WUFFaEMsS0FBTSxNQUFNLENBQUMsSUFBSSxJQUFJLEVBQ3JCO2dCQUNLLElBQUssQ0FBQyxLQUFLLFNBQVM7b0JBQ2YsTUFBSztnQkFFVixJQUFLLENBQUMsSUFBSSxHQUFHO29CQUNSLEdBQUcsR0FBRyxHQUFHLENBQUUsQ0FBQyxDQUFDLENBQUE7O29CQUViLEdBQUcsR0FBRyxHQUFHLENBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFBO2FBQzNCO1lBRUQsT0FBTyxHQUFHLENBQUUsR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFBO1NBQzNCO1FBRUQsR0FBRyxDQUFHLElBQVU7WUFFWCxNQUFNLEdBQUcsR0FBRyxTQUFTLENBQUE7WUFDckIsSUFBTSxHQUFHLEdBQUksSUFBSSxDQUFDLE9BQWMsQ0FBQTtZQUVoQyxLQUFNLE1BQU0sQ0FBQyxJQUFJLElBQUksRUFDckI7Z0JBQ0ssSUFBSyxDQUFDLEtBQUssU0FBUztvQkFDZixNQUFLO2dCQUVWLElBQUssQ0FBQyxJQUFJLEdBQUc7b0JBQ1IsR0FBRyxHQUFHLEdBQUcsQ0FBRSxDQUFDLENBQUMsQ0FBQTs7b0JBRWIsTUFBSzthQUNkO1lBRUQsT0FBTyxHQUFHLENBQUUsR0FBRyxDQUFDLENBQUE7U0FDcEI7UUFFRCxJQUFJLENBQUcsSUFBVTtZQUVaLElBQUksR0FBRyxHQUFHLElBQUksQ0FBQyxPQUFjLENBQUE7WUFDN0IsTUFBTSxHQUFHLEdBQUcsU0FBUyxDQUFBO1lBRXJCLEtBQU0sTUFBTSxDQUFDLElBQUksSUFBSSxFQUNyQjtnQkFDSyxJQUFLLENBQUMsS0FBSyxTQUFTO29CQUNmLE1BQUs7Z0JBRVYsSUFBSyxDQUFDLElBQUksR0FBRztvQkFDUixHQUFHLEdBQUcsR0FBRyxDQUFFLENBQUMsQ0FBQyxDQUFBOztvQkFFYixNQUFLO2FBQ2Q7WUFFRCxPQUFPLEdBQUcsQ0FBRSxHQUFHLENBQUMsQ0FBQTtTQUNwQjtRQUVELElBQUksQ0FBRyxJQUFVLEVBQUUsRUFBdUI7WUFFckMsSUFBTSxHQUFHLEdBQUksSUFBSSxDQUFDLE9BQWMsQ0FBQTtZQUNoQyxNQUFNLEdBQUcsR0FBSSxTQUFTLENBQUE7WUFFdEIsS0FBTSxNQUFNLENBQUMsSUFBSSxJQUFJLEVBQ3JCO2dCQUNLLElBQUssR0FBRyxJQUFJLEdBQUc7b0JBQ1YsRUFBRSxDQUFHLEdBQUcsQ0FBRSxHQUFHLENBQUMsQ0FBRSxDQUFBO2dCQUVyQixJQUFLLENBQUMsS0FBSyxTQUFTO29CQUNmLE1BQUs7Z0JBRVYsSUFBSyxDQUFDLElBQUksR0FBRztvQkFDUixHQUFHLEdBQUcsR0FBRyxDQUFFLENBQUMsQ0FBQyxDQUFBOztvQkFFYixNQUFLO2FBQ2Q7WUFFRCxJQUFLLEdBQUcsSUFBSSxHQUFHO2dCQUNWLEVBQUUsQ0FBRyxHQUFHLENBQUUsR0FBRyxDQUFDLENBQUUsQ0FBQTtZQUVyQixPQUFNO1NBQ1Y7S0FDTDs7VUN0SVksUUFBbUMsU0FBUSxRQUFZO1FBSS9ELEdBQUc7WUFFRSxJQUFLLFNBQVMsQ0FBQyxNQUFNLElBQUksQ0FBQztnQkFDckIsT0FBTTtZQUVYLElBQUssU0FBUyxDQUFDLE1BQU0sSUFBSSxDQUFDLEVBQzFCO2dCQUNLLE1BQU0sQ0FBQyxHQUFNLFNBQVMsQ0FBRSxDQUFDLENBQUMsQ0FBQTtnQkFDMUIsT0FBTyxLQUFLLENBQUMsSUFBSSxDQUFHLENBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBRSxLQUFLLFNBQVMsQ0FBQTthQUNqRTtpQkFFRDtnQkFDSyxPQUFPLEtBQUssQ0FBQyxJQUFJLENBQUcsU0FBUyxDQUFFLEtBQUssU0FBUyxDQUFBO2FBQ2pEO1NBQ0w7UUFJRCxLQUFLO1lBRUEsSUFBSyxTQUFTLENBQUMsTUFBTSxJQUFJLENBQUM7Z0JBQ3JCLE9BQU07WUFFWCxJQUFLLFNBQVMsQ0FBQyxNQUFNLElBQUksQ0FBQyxFQUMxQjtnQkFDSyxNQUFNLENBQUMsR0FBTSxTQUFTLENBQUUsQ0FBQyxDQUFDLENBQUE7Z0JBQzFCLE9BQU8sS0FBSyxDQUFDLEtBQUssQ0FBRyxDQUFDLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQTthQUNwRDtpQkFFRDtnQkFDSyxPQUFPLEtBQUssQ0FBQyxLQUFLLENBQUcsU0FBUyxDQUFFLENBQUE7YUFDcEM7U0FDTDtRQUlELEdBQUc7WUFFRSxJQUFLLFNBQVMsQ0FBQyxNQUFNLElBQUksQ0FBQztnQkFDckIsT0FBTTtZQUVYLElBQUssU0FBUyxDQUFDLE1BQU0sSUFBSSxDQUFDLEVBQzFCO2dCQUNLLE1BQU0sQ0FBQyxHQUFNLFNBQVMsQ0FBRSxDQUFDLENBQUMsQ0FBQTtnQkFDMUIsT0FBTyxLQUFLLENBQUMsR0FBRyxDQUFHLENBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQTthQUNyRDtpQkFFRDtnQkFDSyxPQUFPLEtBQUssQ0FBQyxHQUFHLENBQUcsU0FBUyxDQUFFLENBQUMsQ0FBQyxFQUFFLFNBQVMsQ0FBRSxDQUFDLENBQUMsQ0FBRSxDQUFBO2FBQ3JEO1NBQ0w7UUFJRCxHQUFHO1lBRUUsSUFBSyxTQUFTLENBQUMsTUFBTSxJQUFJLENBQUM7Z0JBQ3JCLE9BQU07WUFFWCxNQUFNLE1BQU0sR0FBRyxFQUFPLENBQUE7WUFFdEIsSUFBSyxTQUFTLENBQUMsTUFBTSxJQUFJLENBQUMsRUFDMUI7Z0JBQ0ssTUFBTSxDQUFDLEdBQVUsU0FBUyxDQUFFLENBQUMsQ0FBQyxDQUFBO2dCQUM5QixLQUFLLENBQUMsSUFBSSxDQUFHLENBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFJO29CQUN2QyxNQUFNLENBQUMsTUFBTSxDQUFHLE1BQU0sRUFBRSxJQUFJLENBQUUsQ0FBQTtpQkFDbEMsQ0FBQyxDQUFBO2dCQUNGLE9BQU8sTUFBTSxDQUFDLE1BQU0sQ0FBRyxNQUFNLEVBQUUsQ0FBQyxDQUFFLENBQUE7YUFDdEM7aUJBRUQ7Z0JBQ0ssS0FBSyxDQUFDLElBQUksQ0FBRyxTQUFTLEVBQUUsSUFBSTtvQkFDdkIsTUFBTSxDQUFDLE1BQU0sQ0FBRyxNQUFNLEVBQUUsSUFBSSxDQUFFLENBQUE7aUJBQ2xDLENBQUMsQ0FBQTtnQkFFRixPQUFPLE1BQU0sQ0FBQyxNQUFNLENBQUcsTUFBTSxFQUFFO29CQUMxQixPQUFPLEVBQUUsU0FBUyxDQUFFLENBQUMsQ0FBQztvQkFDdEIsSUFBSSxFQUFLLFNBQVMsQ0FBRSxDQUFDLENBQUM7b0JBQ3RCLEVBQUUsRUFBTyxTQUFTLENBQUUsQ0FBQyxDQUFDO2lCQUMxQixDQUFDLENBQUE7YUFDTjtTQUNMO0tBQ0w7O1VDMUVZLE9BQU87UUFFZixZQUF1QixFQUFnQjtZQUFoQixPQUFFLEdBQUYsRUFBRSxDQUFjO1lBRS9CLFVBQUssR0FBRyxJQUFJLFFBQVEsRUFBcUIsQ0FBQTtZQUN6QyxVQUFLLEdBQUksSUFBSSxRQUFRLEVBQU8sQ0FBQTtTQUhRO1FBVTVDLE9BQU87WUFFRixJQUFLLFNBQVMsQ0FBQyxNQUFNLElBQUksQ0FBQztnQkFDckIsTUFBTSxJQUFJLEtBQUssQ0FBRyxlQUFlLENBQUUsQ0FBQTtZQUV4QyxNQUFNLEdBQUcsR0FBSSxTQUFTLENBQUUsQ0FBQyxDQUFDLENBQUE7WUFFMUIsSUFBSyxPQUFPLEdBQUcsSUFBSSxRQUFRO2dCQUN0QixPQUFPLFNBQWlCLENBQUE7WUFFN0IsSUFBSyxLQUFLLENBQUMsT0FBTyxDQUFHLEdBQUcsQ0FBQztnQkFDcEIsT0FBTyxHQUFHLENBQUMsSUFBSSxFQUFXLENBQUE7WUFFL0IsT0FBTyxDQUFFLEdBQUcsQ0FBQyxPQUFPLEVBQUUsR0FBRyxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsRUFBRSxDQUFVLENBQUE7U0FDcEQ7UUFNRCxPQUFPO1lBRUYsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBRyxJQUFJLENBQUMsT0FBTyxDQUFHLEdBQUksU0FBUyxDQUFVLENBQUUsQ0FBQTtTQUNwRTtRQUNELFFBQVEsQ0FBRyxJQUFVO1lBRWhCLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUcsSUFBSSxDQUFFLENBQUE7U0FDbEM7UUFNRCxNQUFNLENBQUcsSUFBVSxFQUFFLEdBQUksSUFBWTtZQUVoQyxJQUFJLElBQUksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFHLEdBQUksSUFBSSxDQUFFLENBQUE7WUFFcEMsSUFBSyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBRyxJQUFJLENBQUU7Z0JBQ3ZCLE1BQU0sY0FBYyxDQUFBO1lBRXpCLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUcsSUFBSSxFQUFFLElBQUksQ0FBRSxDQUFBO1NBQ3hDO1FBQ0QsT0FBTyxDQUFHLElBQVUsRUFBRSxJQUFVO1lBRTNCLElBQUssSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUcsSUFBSSxDQUFFO2dCQUN2QixNQUFNLGNBQWMsQ0FBQTtZQUV6QixPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFHLElBQUksRUFBRSxJQUFJLENBQUUsQ0FBQTtTQUN4QztRQU1ELElBQUk7WUFFQyxJQUFJLElBQUksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFHLEdBQUksU0FBUyxDQUFFLENBQUE7WUFFekMsSUFBSyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBRyxJQUFJLENBQUU7Z0JBQ3ZCLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUcsSUFBSSxDQUFFLENBQUE7WUFFbkMsTUFBTSxjQUFjLENBQUE7U0FDeEI7UUFDRCxLQUFLLENBQUcsSUFBVTtZQUViLElBQUssSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUcsSUFBSSxDQUFFO2dCQUN2QixPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFHLElBQUksQ0FBRSxDQUFBO1lBRW5DLE1BQU0sY0FBYyxDQUFBO1NBQ3hCO1FBTUQsSUFBSTtZQUVDLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUcsR0FBSSxTQUFTLENBQUUsQ0FBQTtZQUV6QyxNQUFNLEdBQUcsR0FBSSxTQUFTLENBQUUsQ0FBQyxDQUFDLENBQUE7WUFFMUIsSUFBSyxPQUFPLEdBQUcsSUFBSSxRQUFRLElBQUksQ0FBRSxLQUFLLENBQUMsT0FBTyxDQUFFLEdBQUcsQ0FBQztnQkFDL0MsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFHLElBQUksRUFBRSxHQUFHLENBQUUsQ0FBQTs7Z0JBRS9CLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBRyxJQUFJLENBQUUsQ0FBQTtTQUNuQztRQUNELEtBQUssQ0FBRyxJQUFVLEVBQUUsSUFBa0I7WUFFakMsSUFBSyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBRyxJQUFJLENBQUU7Z0JBQ3ZCLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUcsSUFBSSxDQUFFLENBQUE7WUFFbkMsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUcsSUFBSSxDQUFFLENBQUE7WUFFckMsSUFBSyxJQUFJLElBQUksU0FBUztnQkFDakIsTUFBTSxjQUFjLENBQUE7WUFFekIsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUcsR0FBSSxJQUFJLENBQUUsQ0FBQTtZQUVwQyxJQUFJLEdBQUcsSUFBSSxJQUFJLFNBQVM7a0JBQ2pCLEdBQUc7a0JBQ0gsTUFBTSxDQUFDLE1BQU0sQ0FBRyxHQUFHLEVBQUUsSUFBSSxDQUFFLENBQUE7WUFFbEMsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBRyxJQUFJLEVBQUUsSUFBSSxJQUFJLENBQUcsSUFBUyxDQUFFLENBQUUsQ0FBQTtTQUMxRDtLQUNMOztJQ3ZJTSxNQUFNLEtBQUssR0FBRyxDQUFDO1FBRWpCLE1BQU0sU0FBUyxHQUFHLENBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxNQUFNLENBQUUsQ0FBQTtRQWNsRSxTQUFTLE1BQU0sQ0FDVixJQUFZLEVBQ1osS0FBVSxFQUNWLEdBQUcsUUFBMEM7WUFHN0MsS0FBSyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUcsRUFBRSxFQUFFLEtBQUssQ0FBRSxDQUFBO1lBRW5DLE1BQU0sT0FBTyxHQUFHLFNBQVMsQ0FBQyxPQUFPLENBQUcsSUFBSSxDQUFFLEtBQUssQ0FBQyxDQUFDO2tCQUNyQyxRQUFRLENBQUMsYUFBYSxDQUFHLElBQUksQ0FBRTtrQkFDL0IsUUFBUSxDQUFDLGVBQWUsQ0FBRyw0QkFBNEIsRUFBRSxJQUFJLENBQUUsQ0FBQTtZQUUzRSxNQUFNLE9BQU8sR0FBRyxFQUFXLENBQUE7O1lBSTNCLE9BQVEsUUFBUSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQzNCO2dCQUNLLElBQUksS0FBSyxHQUFHLFFBQVEsQ0FBQyxHQUFHLEVBQUUsQ0FBQTtnQkFFMUIsSUFBSyxLQUFLLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBRSxFQUMzQjtvQkFDSyxLQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRyxDQUFDLElBQUksS0FBSyxDQUFDLE1BQU0sRUFBRyxDQUFDLEVBQUU7d0JBQ3BDLFFBQVEsQ0FBQyxJQUFJLENBQUUsS0FBSyxDQUFFLENBQUMsQ0FBQyxDQUFFLENBQUE7aUJBQ25DO3FCQUVEO29CQUNLLE9BQU8sQ0FBQyxJQUFJLENBQUUsS0FBSyxDQUFFLENBQUE7aUJBQ3pCO2FBQ0w7WUFFRCxPQUFRLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUMxQjtnQkFDSyxJQUFJLEtBQUssR0FBRyxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUE7Z0JBRXpCLElBQUssS0FBSyxZQUFZLElBQUk7b0JBQ3JCLE9BQU8sQ0FBQyxXQUFXLENBQUUsS0FBSyxDQUFFLENBQUE7cUJBRTVCLElBQUssT0FBTyxLQUFLLElBQUksU0FBUyxJQUFJLEtBQUs7b0JBQ3ZDLE9BQU8sQ0FBQyxXQUFXLENBQUUsUUFBUSxDQUFDLGNBQWMsQ0FBRSxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUUsQ0FBRSxDQUFBO2FBQzNFOztZQUlELE1BQU0sT0FBTyxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUE7WUFDN0IsTUFBTSxJQUFJLEdBQ1Y7Z0JBQ0ssS0FBSyxFQUFFLENBQUUsQ0FBQyxLQUFNLE9BQU8sQ0FBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFFLEdBQUcsQ0FBQyxHQUFHLENBQUM7Z0JBQzlDLEtBQUssRUFBRSxDQUFFLENBQUMsS0FBTSxPQUFPLENBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBRSxHQUFHLENBQUM7c0JBQzFCLE9BQU8sQ0FBQyxJQUFJLFFBQVEsR0FBRyxhQUFhLENBQUUsQ0FBQyxDQUFDOzBCQUN4QyxDQUFDOztnQkFFakIsQ0FBQyxFQUFFLENBQUUsQ0FBQyxLQUFNLE9BQU8sQ0FBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFFLEdBQUcsQ0FBQyxHQUFHLENBQUM7YUFDOUMsQ0FBQTtZQUVELEtBQU0sTUFBTSxHQUFHLElBQUksS0FBSyxFQUN4QjtnQkFDSyxNQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUE7Z0JBRXhCLElBQUssT0FBTyxLQUFLLElBQUksVUFBVTtvQkFDMUIsT0FBTyxDQUFDLGdCQUFnQixDQUFHLEdBQUcsRUFBRSxLQUFLLENBQUUsQ0FBQTs7b0JBR3ZDLE9BQU8sQ0FBQyxZQUFZLENBQUcsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBRSxDQUFDLENBQUMsRUFBRyxLQUFLLENBQUMsQ0FBRSxDQUFBO2FBQ3BFO1lBRUQsT0FBTyxPQUFPLENBQUE7WUFFZCxTQUFTLGFBQWEsQ0FBRyxHQUFXO2dCQUUvQixJQUFJLE1BQU0sR0FBRyxFQUFFLENBQUE7Z0JBRWYsS0FBTSxNQUFNLEdBQUcsSUFBSSxHQUFHO29CQUNqQixNQUFNLElBQUksR0FBRyxHQUFHLElBQUksR0FBRyxHQUFHLENBQUUsR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFBO2dCQUU1QyxPQUFPLE1BQU0sQ0FBQTthQUNqQjtTQWtCTDtRQUVELE9BQU8sTUFBTSxDQUFBO0lBRWxCLENBQUMsR0FBSSxDQUFBOztJQzNGTCxTQUFTLGFBQWE7UUFFakIsT0FBTztZQUNGLE9BQU8sRUFBUyxFQUFFO1lBQ2xCLFdBQVcsRUFBSyxDQUFDO1lBQ2pCLFdBQVcsRUFBSyxDQUFDO1lBQ2pCLFdBQVcsRUFBSyxTQUFRO1lBQ3hCLE1BQU0sRUFBVSxTQUFRO1lBQ3hCLFVBQVUsRUFBTSxNQUFNLElBQUk7WUFDMUIsY0FBYyxFQUFFLFNBQVE7WUFDeEIsY0FBYyxFQUFFLENBQUMsTUFBTSxDQUFDLFdBQVcsR0FBRyxNQUFNLENBQUMsVUFBVTtrQkFDdEMsTUFBTSxDQUFDLFdBQVcsR0FBRyxNQUFNLENBQUMsVUFBVSxJQUFJLENBQUM7U0FDaEUsQ0FBQTtJQUNOLENBQUM7SUFFRCxJQUFJLE9BQU8sR0FBTSxLQUFLLENBQUE7SUFDdEIsSUFBSSxPQUEyQixDQUFBO0lBRS9CO0lBQ0EsSUFBSSxlQUFlLEdBQUc7UUFDakIsTUFBTSxFQUFVLENBQUUsQ0FBUyxLQUFNLENBQUM7UUFDbEMsVUFBVSxFQUFNLENBQUUsQ0FBUyxLQUFNLENBQUMsR0FBQyxDQUFDO1FBQ3BDLFdBQVcsRUFBSyxDQUFFLENBQVMsS0FBTSxDQUFDLElBQUUsQ0FBQyxHQUFDLENBQUMsQ0FBQztRQUN4QyxhQUFhLEVBQUcsQ0FBRSxDQUFTLEtBQU0sQ0FBQyxHQUFDLEVBQUUsR0FBRyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxJQUFFLENBQUM7UUFDNUQsV0FBVyxFQUFLLENBQUUsQ0FBUyxLQUFNLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQztRQUN0QyxZQUFZLEVBQUksQ0FBRSxDQUFTLEtBQU0sQ0FBQyxFQUFFLENBQUMsSUFBRSxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUM7UUFDNUMsY0FBYyxFQUFFLENBQUUsQ0FBUyxLQUFNLENBQUMsR0FBQyxFQUFFLEdBQUcsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFDLENBQUMsS0FBRyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxJQUFFLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQztRQUN6RSxXQUFXLEVBQUssQ0FBRSxDQUFTLEtBQU0sQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQztRQUN4QyxZQUFZLEVBQUksQ0FBRSxDQUFTLEtBQU0sQ0FBQyxHQUFDLENBQUMsRUFBRSxDQUFDLElBQUUsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDO1FBQzlDLGNBQWMsRUFBRSxDQUFFLENBQVMsS0FBTSxDQUFDLEdBQUMsRUFBRSxHQUFHLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFDLENBQUMsSUFBRSxFQUFFLENBQUMsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQztRQUNuRSxXQUFXLEVBQUssQ0FBRSxDQUFTLEtBQU0sQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUM7UUFDMUMsWUFBWSxFQUFJLENBQUUsQ0FBUyxLQUFNLENBQUMsR0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFFLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUM7UUFDaEQsY0FBYyxFQUFFLENBQUUsQ0FBUyxLQUFNLENBQUMsR0FBQyxFQUFFLEdBQUcsRUFBRSxHQUFDLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFDLEVBQUUsSUFBRSxFQUFFLENBQUMsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUM7S0FDN0UsQ0FBQTtBQUVELGFBQWdCLFNBQVMsQ0FBRyxPQUF5QjtRQUVoRCxNQUFNLE1BQU0sR0FBTyxhQUFhLEVBQUcsQ0FBQTtRQUVuQyxJQUFJLFNBQVMsR0FBSSxLQUFLLENBQUE7UUFDdEIsSUFBSSxVQUFVLEdBQUcsS0FBSyxDQUFBO1FBQ3RCLElBQUksYUFBd0IsQ0FBQTtRQUU1QixJQUFJLFVBQVUsR0FBRyxDQUFDLENBQUE7UUFDbEIsSUFBSSxPQUFPLEdBQU0sQ0FBQyxDQUFBO1FBQ2xCLElBQUksT0FBTyxHQUFNLENBQUMsQ0FBQTtRQUVsQixJQUFJLGNBQWMsR0FBRyxHQUFHLENBQUE7UUFDeEIsSUFBSSxVQUFrQixDQUFBO1FBQ3RCLElBQUksVUFBa0IsQ0FBQTtRQUV0QixJQUFJLGlCQUFpQixHQUFHLENBQUMsQ0FBQyxDQUFBO1FBRTFCLFlBQVksQ0FBRyxPQUFPLENBQUUsQ0FBQTtRQUV4QixTQUFTLFlBQVksQ0FBRyxPQUF5QjtZQUU1QyxJQUFLLE9BQU8sRUFDWjtnQkFDSyxPQUFNO2FBQ1Y7WUFFRCxJQUFLLFNBQVMsQ0FBQyxjQUFjLEdBQUcsQ0FBQztnQkFDNUIsUUFBUSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxHQUFHLE1BQU0sQ0FBQTtZQUU3QyxhQUFhLEVBQUcsQ0FBQTtZQUVoQixNQUFNLENBQUMsTUFBTSxDQUFHLE1BQU0sRUFBRSxPQUFPLENBQUUsQ0FBQTtZQUVqQyxZQUFZLEVBQUcsQ0FBQTtTQUNuQjtRQUVELFNBQVMsVUFBVSxDQUFHLEdBQUksT0FBdUI7WUFFNUMsS0FBTSxNQUFNLENBQUMsSUFBSSxPQUFPLEVBQ3hCO2dCQUNLLElBQUssQ0FBRSxNQUFNLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBRSxDQUFDLENBQUM7b0JBQzdCLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFFLENBQUMsQ0FBQyxDQUFBO2FBQ2hDO1lBRUQsSUFBSyxTQUFTLEVBQ2Q7Z0JBQ0ssV0FBVyxFQUFHLENBQUE7Z0JBQ2QsUUFBUSxFQUFHLENBQUE7YUFDZjtTQUNMO1FBRUQsU0FBUyxRQUFRO1lBRVosWUFBWSxFQUFHLENBQUE7WUFDZixTQUFTLEdBQUcsSUFBSSxDQUFBO1NBQ3BCO1FBRUQsU0FBUyxXQUFXO1lBRWYsYUFBYSxFQUFHLENBQUE7WUFDaEIsU0FBUyxHQUFHLEtBQUssQ0FBQTtTQUNyQjtRQUVELE9BQU87WUFDRixZQUFZO1lBQ1osVUFBVTtZQUNWLFFBQVEsRUFBRSxNQUFNLFNBQVM7WUFDekIsUUFBUTtZQUNSLFdBQVc7U0FDZixDQUFBO1FBRUQsU0FBUyxZQUFZO1lBRWhCLEtBQU0sTUFBTSxDQUFDLElBQUksTUFBTSxDQUFDLE9BQU87Z0JBQzFCLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBRyxhQUFhLEVBQUUsT0FBTyxFQUFFLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxDQUFFLENBQUE7U0FDekU7UUFDRCxTQUFTLGFBQWE7WUFFakIsS0FBTSxNQUFNLENBQUMsSUFBSSxNQUFNLENBQUMsT0FBTztnQkFDMUIsQ0FBQyxDQUFDLG1CQUFtQixDQUFHLGFBQWEsRUFBRyxPQUFPLENBQUUsQ0FBQTtTQUMxRDtRQUVELFNBQVMsT0FBTyxDQUFHLEtBQThCO1lBRTVDLElBQUssT0FBTyxFQUNaO2dCQUNLLE9BQU8sQ0FBQyxJQUFJLENBQUcsd0NBQXdDO3NCQUN0QywrQkFBK0IsQ0FBRSxDQUFBO2dCQUNsRCxPQUFNO2FBQ1Y7WUFFRCxJQUFLLFVBQVUsRUFDZjtnQkFDSyxpQkFBaUIsRUFBRyxDQUFBO2FBQ3hCO1lBRUQsT0FBTyxHQUFJLEtBQW9CLENBQUMsT0FBTztrQkFDMUIsS0FBb0IsQ0FBQyxPQUFPLENBQUUsQ0FBQyxDQUFDO2tCQUNoQyxLQUFvQixDQUFBO1lBRWpDLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBRSxhQUFhLEVBQUUsTUFBTSxDQUFDLENBQUE7WUFDL0MsTUFBTSxDQUFDLGdCQUFnQixDQUFFLFdBQVcsRUFBSSxLQUFLLENBQUMsQ0FBQTtZQUM5QyxhQUFhLEVBQUcsQ0FBQTtZQUVoQixpQkFBaUIsR0FBRyxNQUFNLENBQUMscUJBQXFCLENBQUcsZ0JBQWdCLENBQUUsQ0FBQTtZQUVyRSxPQUFPLEdBQUcsSUFBSSxDQUFBO1NBQ2xCO1FBQ0QsU0FBUyxNQUFNLENBQUcsS0FBOEI7WUFFM0MsSUFBSyxPQUFPLElBQUksS0FBSztnQkFDaEIsT0FBTTtZQUVYLE9BQU8sR0FBSSxLQUFvQixDQUFDLE9BQU8sS0FBSyxTQUFTO2tCQUN4QyxLQUFvQixDQUFDLE9BQU8sQ0FBRSxDQUFDLENBQUM7a0JBQ2hDLEtBQW9CLENBQUE7U0FDckM7UUFDRCxTQUFTLEtBQUssQ0FBRyxLQUE4QjtZQUUxQyxNQUFNLENBQUMsbUJBQW1CLENBQUUsYUFBYSxFQUFFLE1BQU0sQ0FBQyxDQUFBO1lBQ2xELE1BQU0sQ0FBQyxtQkFBbUIsQ0FBRSxXQUFXLEVBQUksS0FBSyxDQUFDLENBQUE7WUFDakQsWUFBWSxFQUFHLENBQUE7WUFFZixPQUFPLEdBQUcsS0FBSyxDQUFBO1NBQ25CO1FBRUQsU0FBUyxnQkFBZ0IsQ0FBRyxHQUFXO1lBRWxDLE9BQU8sR0FBTSxPQUFPLENBQUMsT0FBTyxDQUFBO1lBQzVCLE9BQU8sR0FBTSxPQUFPLENBQUMsT0FBTyxDQUFBO1lBQzVCLFVBQVUsR0FBRyxHQUFHLENBQUE7WUFFaEIsYUFBYSxHQUFHO2dCQUNYLEtBQUssRUFBTSxDQUFDO2dCQUNaLENBQUMsRUFBVSxDQUFDO2dCQUNaLENBQUMsRUFBVSxDQUFDO2dCQUNaLE9BQU8sRUFBSSxDQUFDO2dCQUNaLE9BQU8sRUFBSSxDQUFDO2dCQUNaLE9BQU8sRUFBRSxDQUFDO2dCQUNWLE9BQU8sRUFBRSxDQUFDO2FBQ2QsQ0FBQTtZQUVELE1BQU0sQ0FBQyxXQUFXLEVBQUcsQ0FBQTtZQUVyQixpQkFBaUIsR0FBRyxNQUFNLENBQUMscUJBQXFCLENBQUcsZ0JBQWdCLENBQUUsQ0FBQTtTQUN6RTtRQUNELFNBQVMsZ0JBQWdCLENBQUcsR0FBVztZQUVsQyxNQUFNLEVBQUUsY0FBYyxFQUFFLEdBQUcsTUFBTSxDQUFBO1lBRWpDLE1BQU0sQ0FBQyxHQUFhLE9BQU8sQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFBO1lBQzdDLE1BQU0sQ0FBQyxHQUFhLE9BQU8sR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFBO1lBQzdDLE1BQU0sS0FBSyxHQUFTLEdBQUcsR0FBRyxVQUFVLENBQUE7WUFDcEMsTUFBTSxXQUFXLEdBQUcsS0FBSyxHQUFHLGFBQWEsQ0FBQyxLQUFLLENBQUE7WUFDL0MsTUFBTSxPQUFPLEdBQU8sQ0FBQyxHQUFHLGFBQWEsQ0FBQyxDQUFDLENBQUE7WUFDdkMsTUFBTSxPQUFPLEdBQU8sQ0FBQyxHQUFHLGFBQWEsQ0FBQyxDQUFDLENBQUE7WUFFdkMsYUFBYSxHQUFHO2dCQUNYLEtBQUs7Z0JBQ0wsQ0FBQztnQkFDRCxDQUFDO2dCQUNELE9BQU8sRUFBRSxDQUFDO2dCQUNWLE9BQU8sRUFBRSxDQUFDO2dCQUNWLE9BQU87Z0JBQ1AsT0FBTzthQUNYLENBQUE7WUFFRCxJQUFLLE9BQU8sRUFDWjtnQkFDSyxNQUFNLENBQUMsTUFBTSxDQUFHLGFBQWEsQ0FBRSxDQUFBO2dCQUMvQixpQkFBaUIsR0FBRyxNQUFNLENBQUMscUJBQXFCLENBQUcsZ0JBQWdCLENBQUUsQ0FBQTthQUN6RTtpQkFFRDtnQkFDSyxVQUFVLEdBQU8sR0FBRyxDQUFBO2dCQUNwQixPQUFPLEdBQVUsQ0FBQyxDQUFBO2dCQUNsQixPQUFPLEdBQVUsQ0FBQyxDQUFBO2dCQUNsQixVQUFVLEdBQVMsY0FBYyxHQUFHLElBQUksQ0FBRyxPQUFPLEdBQUcsV0FBVyxDQUFFLENBQUE7Z0JBQ2xFLFVBQVUsR0FBUyxjQUFjLEdBQUcsSUFBSSxDQUFHLE9BQU8sR0FBRyxXQUFXLENBQUUsQ0FBQTtnQkFFbEUsYUFBYSxDQUFDLE9BQU8sSUFBSSxVQUFVLENBQUE7Z0JBQ25DLGFBQWEsQ0FBQyxPQUFPLElBQUksVUFBVSxDQUFBO2dCQUVuQyxJQUFLLE1BQU0sQ0FBQyxVQUFVLENBQUcsYUFBYSxDQUFFLEtBQUssSUFBSSxFQUNqRDtvQkFDSyxVQUFVLEdBQUcsSUFBSSxDQUFBO29CQUNqQixpQkFBaUIsR0FBRyxNQUFNLENBQUMscUJBQXFCLENBQUcsZUFBZSxDQUFFLENBQUE7aUJBQ3hFO2FBQ0w7WUFFRCxTQUFTLElBQUksQ0FBRyxLQUFhO2dCQUV4QixJQUFJLEtBQUssR0FBRyxDQUFDLENBQUM7b0JBQ1QsT0FBTyxDQUFDLENBQUMsQ0FBQTtnQkFFZCxJQUFLLEtBQUssR0FBRyxDQUFDO29CQUNULE9BQU8sQ0FBQyxDQUFBO2dCQUViLE9BQU8sS0FBSyxDQUFBO2FBQ2hCO1NBQ0w7UUFDRCxTQUFTLGVBQWUsQ0FBRyxHQUFXO1lBRWpDLE1BQU0sS0FBSyxHQUFHLEdBQUcsR0FBRyxVQUFVLENBQUE7WUFFOUIsTUFBTSxDQUFDLEdBQUcsS0FBSyxJQUFJLGNBQWM7a0JBQ3ZCLENBQUM7a0JBQ0QsS0FBSyxHQUFHLGNBQWMsQ0FBQTtZQUVoQyxNQUFNLE1BQU0sR0FBSSxlQUFlLENBQUMsWUFBWSxDQUFFLENBQUMsQ0FBQyxDQUFBO1lBQ2hELE1BQU0sT0FBTyxHQUFHLFVBQVUsR0FBRyxNQUFNLENBQUE7WUFDbkMsTUFBTSxPQUFPLEdBQUcsVUFBVSxHQUFHLE1BQU0sQ0FBQTtZQUVuQyxhQUFhLENBQUMsQ0FBQyxHQUFTLE9BQU8sR0FBRyxPQUFPLENBQUE7WUFDekMsYUFBYSxDQUFDLENBQUMsR0FBUyxPQUFPLEdBQUcsT0FBTyxDQUFBO1lBQ3pDLGFBQWEsQ0FBQyxPQUFPLEdBQUcsVUFBVSxHQUFHLE9BQU8sQ0FBQTtZQUM1QyxhQUFhLENBQUMsT0FBTyxHQUFHLFVBQVUsR0FBRyxPQUFPLENBQUE7WUFFNUMsTUFBTSxDQUFDLE1BQU0sQ0FBRyxhQUFhLENBQUUsQ0FBQTtZQUUvQixJQUFLLENBQUMsSUFBSSxDQUFDLEVBQ1g7Z0JBQ0ssVUFBVSxHQUFHLEtBQUssQ0FBQTtnQkFDbEIsTUFBTSxDQUFDLGNBQWMsQ0FBRyxhQUFhLENBQUUsQ0FBQTtnQkFDdkMsT0FBTTthQUNWO1lBRUQsaUJBQWlCLEdBQUcsTUFBTSxDQUFDLHFCQUFxQixDQUFHLGVBQWUsQ0FBRSxDQUFBO1NBQ3hFO1FBQ0QsU0FBUyxpQkFBaUI7WUFFckIsVUFBVSxHQUFHLEtBQUssQ0FBQTtZQUNsQixNQUFNLENBQUMsb0JBQW9CLENBQUcsaUJBQWlCLENBQUUsQ0FBQTtZQUNqRCxNQUFNLENBQUMsY0FBYyxDQUFHLGFBQWEsQ0FBRSxDQUFBO1NBQzNDO0lBQ04sQ0FBQzs7SUM5UkQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBdUZBLGFBS2dCLFFBQVEsQ0FBRyxFQUE0QixFQUFFLFFBQWdCO1FBRXBFLElBQUksS0FBSyxHQUFHLFVBQVUsQ0FBRyxFQUFFLENBQUMsS0FBSyxDQUFHLFFBQVEsQ0FBRSxDQUFFLENBQUE7UUFFaEQsSUFBSyxNQUFNLENBQUMsS0FBSyxDQUFHLEtBQUssQ0FBRSxFQUMzQjtZQUNLLEtBQUssR0FBRyxVQUFVLENBQUcsTUFBTSxDQUFDLGdCQUFnQixDQUFHLEVBQUUsQ0FBRSxDQUFHLFFBQVEsQ0FBRSxDQUFFLENBQUE7WUFFbEUsSUFBSyxNQUFNLENBQUMsS0FBSyxDQUFHLEtBQUssQ0FBRTtnQkFDdEIsS0FBSyxHQUFHLENBQUMsQ0FBQTtTQUNsQjtRQUVELE9BQU8sS0FBSyxDQUFBO0lBQ2pCLENBQUM7QUFFRCxhQUFnQixNQUFNLENBQUcsRUFBNEIsRUFBRSxRQUFnQjtRQUVsRSxJQUFJLEtBQUssR0FBRyxRQUFRLENBQUcsRUFBRSxDQUFDLEtBQUssQ0FBRyxRQUFRLENBQUUsQ0FBRSxDQUFBO1FBRTlDLElBQUssTUFBTSxDQUFDLEtBQUssQ0FBRyxLQUFLLENBQUUsRUFDM0I7WUFDSyxNQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsZ0JBQWdCLENBQUcsRUFBRSxDQUFFLENBQUE7WUFFNUMsS0FBSyxHQUFHLFFBQVEsQ0FBRyxLQUFLLENBQUcsUUFBUSxDQUFFLENBQUUsQ0FBQTtZQUV2QyxJQUFLLE1BQU0sQ0FBQyxLQUFLLENBQUcsS0FBSyxDQUFFO2dCQUN0QixLQUFLLEdBQUcsQ0FBQyxDQUFBO1NBQ2xCO1FBRUQsT0FBTyxLQUFLLENBQUE7SUFDakIsQ0FBQzs7SUNwR0QsU0FBU0MsZUFBYTtRQUVqQixPQUFPO1lBQ0YsT0FBTyxFQUFRLEVBQUU7WUFDakIsUUFBUSxFQUFPLFFBQVE7WUFDdkIsSUFBSSxFQUFXLEtBQUs7WUFDcEIsSUFBSSxFQUFXLEVBQUU7WUFDakIsS0FBSyxFQUFVLEdBQUc7WUFDbEIsT0FBTyxFQUFRLENBQUM7WUFDaEIsT0FBTyxFQUFRLE1BQU0sQ0FBQyxXQUFXO1lBQ2pDLElBQUksRUFBVyxJQUFJO1lBQ25CLFNBQVMsRUFBTSxJQUFJO1lBQ25CLFlBQVksRUFBRyxTQUFRO1lBQ3ZCLFdBQVcsRUFBSSxTQUFRO1lBQ3ZCLGFBQWEsRUFBRSxTQUFRO1lBQ3ZCLFlBQVksRUFBRyxTQUFRO1NBQzNCLENBQUE7SUFDTixDQUFDO0lBRUQsTUFBTSxNQUFNLEdBQUc7UUFDVixFQUFFLEVBQUcsQ0FBQztRQUNOLEVBQUUsRUFBRyxDQUFDLENBQUM7UUFDUCxFQUFFLEVBQUcsQ0FBQyxDQUFDO1FBQ1AsRUFBRSxFQUFHLENBQUM7S0FDVixDQUFBO0lBQ0QsTUFBTSxVQUFVLEdBQWdDO1FBQzNDLEVBQUUsRUFBRyxPQUFPO1FBQ1osRUFBRSxFQUFHLE9BQU87UUFDWixFQUFFLEVBQUcsUUFBUTtRQUNiLEVBQUUsRUFBRyxRQUFRO0tBQ2pCLENBQUE7QUFFRCxhQUFnQixVQUFVLENBQUcsT0FBb0IsRUFBRSxVQUE2QixFQUFFO1FBRTdFLE1BQU0sTUFBTSxHQUFHQSxlQUFhLEVBQUcsQ0FBQTtRQUUvQixJQUFJLE9BQW9CLENBQUE7UUFDeEIsSUFBSSxXQUFvQixDQUFBO1FBQ3hCLElBQUksSUFBbUIsQ0FBQTtRQUN2QixJQUFJLElBQXNDLENBQUE7UUFDMUMsSUFBSSxFQUF1QixDQUFBO1FBQzNCLElBQUksT0FBbUIsQ0FBQTtRQUN2QixJQUFJLE9BQW1CLENBQUE7UUFDdkIsSUFBSSxVQUFVLEdBQUksQ0FBQyxDQUFBO1FBQ25CLElBQUksU0FBUyxHQUFLLEdBQUcsQ0FBQTtRQUVyQixNQUFNQyxXQUFTLEdBQUdDLFNBQVksQ0FBRTtZQUMzQixPQUFPLEVBQVMsRUFBRTtZQUNsQixXQUFXLEVBQUssV0FBVztZQUMzQixVQUFVLEVBQU0sVUFBVTtZQUMxQixjQUFjLEVBQUUsY0FBYztTQUNsQyxDQUFDLENBQUE7UUFFRixZQUFZLENBQUcsT0FBTyxDQUFFLENBQUE7UUFFeEIsU0FBUyxZQUFZLENBQUcsVUFBVSxFQUF1QjtZQUVwRCxJQUFLLE9BQU8sQ0FBQyxRQUFRLElBQUksU0FBUyxJQUFJLE9BQU8sQ0FBQyxTQUFTLElBQUksU0FBUztnQkFDL0QsT0FBTyxDQUFDLFFBQVEsR0FBRyxVQUFVLENBQUUsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFBO1lBRXRELE1BQU0sQ0FBQyxNQUFNLENBQUcsTUFBTSxFQUFFLE9BQU8sQ0FBRSxDQUFBO1lBRWpDLE9BQU8sR0FBTyxNQUFNLENBQUMsSUFBSSxDQUFBO1lBQ3pCLElBQUksR0FBVSxNQUFNLENBQUUsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFBO1lBQ3ZDLElBQUksR0FBVSxNQUFNLENBQUMsSUFBSSxDQUFBO1lBQ3pCLFdBQVcsR0FBRyxNQUFNLENBQUMsU0FBUyxJQUFJLElBQUksSUFBSSxNQUFNLENBQUMsU0FBUyxJQUFJLElBQUksR0FBRyxJQUFJLEdBQUcsS0FBSyxDQUFBO1lBQ2pGLE9BQU8sR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFBO1lBQ3hCLE9BQU8sR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFBO1lBRXhCLE9BQU8sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFHLFdBQVcsR0FBRyxZQUFZLEdBQUcsVUFBVSxDQUFFLENBQUE7WUFDcEUsT0FBTyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQU0sV0FBVyxHQUFHLFVBQVUsR0FBRyxZQUFZLENBQUUsQ0FBQTtZQUVwRUQsV0FBUyxDQUFDLFlBQVksQ0FBRTtnQkFDbkIsT0FBTyxFQUFFLE1BQU0sQ0FBQyxPQUFPO2dCQUN2QixNQUFNLEVBQUcsV0FBVyxHQUFHLGNBQWMsR0FBRSxnQkFBZ0I7YUFDM0QsQ0FBQyxDQUFBO1NBQ047UUFDRCxTQUFTLElBQUk7WUFFUixPQUFPLE9BQU8sR0FBRyxNQUFNLENBQUcsT0FBTyxFQUFFLE1BQU0sQ0FBQyxRQUFRLENBQUUsR0FBRyxDQUFDLENBQUE7U0FDNUQ7UUFDRCxTQUFTLE1BQU07WUFFVixJQUFLLE9BQU87Z0JBQ1AsS0FBSyxFQUFHLENBQUE7O2dCQUVSLElBQUksRUFBRyxDQUFBO1NBQ2hCO1FBQ0QsU0FBUyxJQUFJO1lBRVIsTUFBTSxDQUFDLFlBQVksRUFBRyxDQUFBO1lBRXRCLE9BQU8sQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFHLFNBQVMsQ0FBRSxDQUFBO1lBQ25DLE9BQU8sQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFHLE9BQU8sRUFBRSxNQUFNLENBQUUsQ0FBQTtZQUU3QyxJQUFLLEVBQUU7Z0JBQ0YsZUFBZSxFQUFHLENBQUE7WUFFdkIsRUFBRSxHQUFHLE1BQU0sQ0FBQyxXQUFXLENBQUE7WUFDdkIsT0FBTyxDQUFDLGdCQUFnQixDQUFHLGVBQWUsRUFBRSxNQUFNLGVBQWUsQ0FBRSxDQUFBO1lBRW5FLE9BQU8sQ0FBQyxLQUFLLENBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBRSxHQUFHLFNBQVMsR0FBRyxJQUFJLENBQUE7WUFFcEQsT0FBTyxHQUFHLElBQUksQ0FBQTtTQUNsQjtRQUNELFNBQVMsS0FBSztZQUVULE1BQU0sQ0FBQyxhQUFhLEVBQUcsQ0FBQTtZQUV2QixTQUFTLEdBQUcsSUFBSSxFQUFHLENBQUE7WUFFbkIsT0FBTyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUcsU0FBUyxDQUFFLENBQUE7WUFDbkMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUcsTUFBTSxFQUFFLE9BQU8sQ0FBRSxDQUFBO1lBRTdDLElBQUssRUFBRTtnQkFDRixlQUFlLEVBQUcsQ0FBQTtZQUV2QixFQUFFLEdBQUcsTUFBTSxDQUFDLFlBQVksQ0FBQTtZQUN4QixPQUFPLENBQUMsZ0JBQWdCLENBQUcsZUFBZSxFQUFFLGVBQWUsQ0FBRSxDQUFBO1lBRTdELE9BQU8sQ0FBQyxLQUFLLENBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBRSxHQUFHLEdBQUcsR0FBRyxJQUFJLENBQUE7WUFFOUMsT0FBTyxHQUFHLEtBQUssQ0FBQTtTQUNuQjtRQUVELE9BQU87WUFDRixZQUFZO1lBQ1osSUFBSTtZQUNKLEtBQUs7WUFDTCxNQUFNO1lBQ04sTUFBTSxFQUFPLE1BQU0sT0FBTztZQUMxQixPQUFPLEVBQU0sTUFBTSxDQUFFLE9BQU87WUFDNUIsVUFBVSxFQUFHLE1BQU0sV0FBVztZQUM5QixRQUFRLEVBQUssTUFBTUEsV0FBUyxDQUFDLFFBQVEsRUFBRztZQUN4QyxRQUFRLEVBQUssTUFBTUEsV0FBUyxDQUFDLFFBQVEsRUFBRztZQUN4QyxXQUFXLEVBQUUsTUFBTUEsV0FBUyxDQUFDLFdBQVcsRUFBRztTQUMvQyxDQUFBO1FBRUQsU0FBUyxlQUFlO1lBRW5CLElBQUssRUFBRTtnQkFDRixFQUFFLEVBQUcsQ0FBQTtZQUNWLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBRyxlQUFlLEVBQUUsTUFBTSxlQUFlLENBQUUsQ0FBQTtZQUN0RSxFQUFFLEdBQUcsSUFBSSxDQUFBO1NBQ2I7UUFFRCxTQUFTLFdBQVc7WUFFZixVQUFVLEdBQUcsSUFBSSxFQUFHLENBQUE7WUFDcEIsT0FBTyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUcsU0FBUyxDQUFFLENBQUE7U0FDMUM7UUFDRCxTQUFTLGNBQWMsQ0FBRyxLQUFtQjtZQUV4QyxPQUFPLENBQUMsR0FBRyxDQUFHLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQyxFQUFFLE9BQU8sQ0FBRSxDQUFBO1lBQ3pDLE9BQU8sQ0FBQyxHQUFHLENBQUcsS0FBSyxDQUFHLFVBQVUsR0FBRyxJQUFJLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBRSxHQUFHLElBQUksQ0FBRSxDQUFBO1lBQzVELE9BQU8sQ0FBQyxLQUFLLENBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBRSxHQUFHLEtBQUssQ0FBRyxVQUFVLEdBQUcsSUFBSSxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUUsR0FBRyxJQUFJLENBQUE7U0FDcEY7UUFDRCxTQUFTLGdCQUFnQixDQUFHLEtBQW1CO1lBRTFDLE9BQU8sQ0FBQyxLQUFLLENBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBRSxHQUFHLEtBQUssQ0FBRyxVQUFVLEdBQUcsSUFBSSxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUUsR0FBRyxJQUFJLENBQUE7U0FDcEY7UUFDRCxTQUFTLFVBQVUsQ0FBRyxLQUFtQjtZQUVwQyxJQUFJLFFBQVEsR0FBRyxXQUFXLEdBQUcsSUFBSSxHQUFHLEtBQUssQ0FBQyxDQUFDLEdBQUcsTUFBTSxDQUFDLElBQUk7a0JBQzVCLElBQUksR0FBRyxLQUFLLENBQUMsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUE7WUFFekQsSUFBSyxDQUFDLFFBQVEsSUFBSSxLQUFLLEtBQUssS0FBSyxDQUFDLEtBQUssSUFBSSxNQUFNLENBQUMsS0FBSyxFQUN2RDtnQkFDSyxNQUFNLEVBQUcsQ0FBQTtnQkFDVCxPQUFPLEtBQUssQ0FBQTthQUNoQjtZQUVELE1BQU0sV0FBVyxHQUFHLEtBQUssQ0FDcEIsV0FBVyxHQUFHLFVBQVUsR0FBRyxJQUFJLEdBQUcsS0FBSyxDQUFDLE9BQU87a0JBQ2pDLFVBQVUsR0FBRyxJQUFJLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FDbkQsQ0FBQTtZQUVELElBQUssV0FBVyxJQUFJLE1BQU0sQ0FBQyxJQUFJLEVBQy9CO2dCQUNLLEtBQUssRUFBRyxDQUFBO2dCQUNSLE9BQU8sS0FBSyxDQUFBO2FBQ2hCO1lBRUQsT0FBTyxJQUFJLENBQUE7U0FFZjtRQUNELFNBQVMsY0FBYztZQUVsQixTQUFTLEdBQUcsTUFBTSxDQUFHLE9BQU8sRUFBRSxNQUFNLENBQUMsUUFBUSxDQUFFLENBQUE7WUFDL0MsSUFBSSxFQUFHLENBQUE7U0FDWDtRQUVELFNBQVMsS0FBSyxDQUFHLENBQVM7WUFFckIsSUFBSyxDQUFDLEdBQUcsT0FBTztnQkFDWCxPQUFPLE9BQU8sQ0FBQTtZQUVuQixJQUFLLENBQUMsR0FBRyxPQUFPO2dCQUNYLE9BQU8sT0FBTyxDQUFBO1lBRW5CLE9BQU8sQ0FBQyxDQUFBO1NBQ1o7SUFDTixDQUFDOztJQ2pORCxTQUFTRCxlQUFhO1FBRWpCLE9BQU87WUFDRixPQUFPLEVBQUssRUFBRTtZQUNkLFNBQVMsRUFBRyxJQUFJO1lBQ2hCLFFBQVEsRUFBSSxNQUFNO1lBQ2xCLFFBQVEsRUFBSSxDQUFDLEdBQUc7WUFDaEIsUUFBUSxFQUFJLENBQUM7WUFDYixLQUFLLEVBQU8sR0FBRztZQUNmLFVBQVUsRUFBRSxJQUFJO1NBQ3BCLENBQUE7SUFDTixDQUFDO0lBRUQsSUFBSSxjQUFjLEdBQUcsQ0FBQyxDQUFBO0lBQ3RCLElBQUksV0FBVyxHQUFNLEtBQUssQ0FBQTtJQUMxQixJQUFJLElBQXdCLENBQUE7QUFFNUIsYUFBZ0IsU0FBUyxDQUFHLE9BQW9CLEVBQUUsT0FBeUI7UUFFdEUsTUFBTSxNQUFNLEdBQUdBLGVBQWEsRUFBRyxDQUFBO1FBRS9CLE1BQU1DLFdBQVMsR0FBR0MsU0FBWSxDQUFFO1lBQzNCLE9BQU8sRUFBRSxFQUFFO1lBQ1gsV0FBVztZQUNYLFVBQVU7U0FDZCxDQUFDLENBQUE7UUFFRixPQUFPLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBRyxXQUFXLENBQUUsQ0FBQTtRQUVyQyxZQUFZLENBQUcsT0FBTyxDQUFFLENBQUE7UUFFeEIsU0FBUyxZQUFZLENBQUcsT0FBeUI7WUFFNUMsTUFBTSxDQUFDLE1BQU0sQ0FBRyxNQUFNLEVBQUUsT0FBTyxDQUFFLENBQUE7WUFFakMsV0FBVyxHQUFHLE1BQU0sQ0FBQyxTQUFTLElBQUksSUFBSSxJQUFJLE1BQU0sQ0FBQyxTQUFTLElBQUksSUFBSSxDQUFBO1lBRWxFLElBQUssT0FBTyxDQUFDLFFBQVEsSUFBSSxTQUFTO2dCQUM3QixNQUFNLENBQUMsUUFBUSxHQUFHLFdBQVcsR0FBRyxLQUFLLEdBQUcsTUFBTSxDQUFBOzs7Ozs7O1lBU25ERCxXQUFTLENBQUMsWUFBWSxDQUFFO2dCQUNuQixPQUFPLEVBQUUsTUFBTSxDQUFDLE9BQU87Z0JBQ3ZCLE1BQU0sRUFBRSxXQUFXLEdBQUcsY0FBYyxHQUFHLGdCQUFnQjthQUMzRCxDQUFDLENBQUE7WUFFRixJQUFJLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQTtZQUV0QixJQUFLQSxXQUFTLENBQUMsUUFBUSxFQUFHO2dCQUNyQixZQUFZLEVBQUcsQ0FBQTs7Z0JBRWYsZUFBZSxFQUFHLENBQUE7U0FDM0I7UUFFRCxTQUFTLFFBQVE7WUFFWixPQUFPLFFBQVEsQ0FBRyxPQUFPLEVBQUUsSUFBSSxDQUFFLENBQUE7U0FDckM7UUFFRCxTQUFTLFFBQVE7WUFFWkEsV0FBUyxDQUFDLFFBQVEsRUFBRyxDQUFBO1lBQ3JCLFlBQVksRUFBRyxDQUFBO1NBQ25CO1FBQ0QsU0FBUyxXQUFXO1lBRWZBLFdBQVMsQ0FBQyxXQUFXLEVBQUcsQ0FBQTtZQUN4QixlQUFlLEVBQUcsQ0FBQTtTQUN0QjtRQUlELFNBQVMsS0FBSyxDQUFHLE1BQXFCLEVBQUUsQ0FBUztZQUU1QyxJQUFLLE9BQU8sTUFBTSxJQUFJLFFBQVEsRUFDOUI7Z0JBQ0ssQ0FBQyxHQUFHRSxPQUFXLENBQUcsTUFBTSxDQUFXLENBQUE7Z0JBQ25DLE1BQU0sR0FBRyxVQUFVLENBQUcsTUFBTSxDQUFFLENBQUE7YUFDbEM7WUFFRCxJQUFLLENBQUUsQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUMsUUFBUSxDQUFHLENBQUMsQ0FBRTtnQkFDNUIsQ0FBQyxHQUFHLElBQUksQ0FBQTtZQUViLElBQUssQ0FBQyxJQUFJLE1BQU0sQ0FBQyxLQUFLLEVBQ3RCO2dCQUNLLElBQUssQ0FBQyxDQUFDLEdBQUcsTUFBTSxDQUFDLEtBQUssS0FBSyxHQUFHO29CQUN6QixNQUFNLEdBQUcsVUFBVSxDQUFHLE1BQU0sQ0FBRSxDQUFBOztvQkFFOUIsTUFBTSxHQUFHLFFBQVEsQ0FBRyxNQUFNLENBQUUsQ0FBQTthQUNyQztZQUVELE9BQU8sQ0FBQyxLQUFLLENBQUUsSUFBSSxDQUFDLEdBQUcsS0FBSyxDQUFHLE1BQU0sQ0FBRSxHQUFHLENBQUMsQ0FBQTtTQUMvQztRQUVELE9BQU87WUFDRixZQUFZO1lBQ1osUUFBUTtZQUNSLFdBQVc7WUFDWCxRQUFRO1lBQ1IsS0FBSztTQUNULENBQUE7UUFFRCxTQUFTLFlBQVk7WUFFaEIsSUFBSyxNQUFNLENBQUMsVUFBVSxFQUN0QjtnQkFDSyxLQUFNLE1BQU0sQ0FBQyxJQUFJLE1BQU0sQ0FBQyxPQUFPO29CQUMxQixDQUFDLENBQUMsZ0JBQWdCLENBQUcsT0FBTyxFQUFFLE9BQU8sRUFBRSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsQ0FBRSxDQUFBO2FBQ25FO1NBQ0w7UUFDRCxTQUFTLGVBQWU7WUFFbkIsS0FBTSxNQUFNLENBQUMsSUFBSSxNQUFNLENBQUMsT0FBTztnQkFDMUIsQ0FBQyxDQUFDLG1CQUFtQixDQUFHLE9BQU8sRUFBRSxPQUFPLENBQUUsQ0FBQTtTQUNuRDtRQUVELFNBQVMsUUFBUSxDQUFHLFVBQWtCO1lBRWpDLE1BQU0sRUFBRSxRQUFRLEVBQUUsR0FBRyxFQUFFLFFBQVEsRUFBRSxHQUFHLEVBQUUsR0FBRyxNQUFNLENBQUE7WUFFL0MsSUFBSyxVQUFVLEdBQUcsR0FBRztnQkFDaEIsVUFBVSxHQUFHLEdBQUcsR0FBRyxVQUFVLENBQUE7WUFFbEMsT0FBTyxHQUFHLEdBQUcsQ0FBQyxHQUFHLEdBQUcsR0FBRyxJQUFJLFVBQVUsR0FBRyxHQUFHLENBQUE7U0FDL0M7UUFDRCxTQUFTLFVBQVUsQ0FBRyxNQUFjO1lBRS9CLE1BQU0sRUFBRSxRQUFRLEVBQUUsR0FBRyxFQUFFLFFBQVEsRUFBRSxHQUFHLEVBQUUsR0FBRyxNQUFNLENBQUE7WUFDL0MsT0FBTyxJQUFJLENBQUMsR0FBRyxDQUFHLENBQUMsTUFBTSxHQUFHLEdBQUcsS0FBSyxHQUFHLEdBQUcsR0FBRyxDQUFDLEdBQUcsR0FBRyxDQUFFLENBQUE7U0FDMUQ7UUFFRCxTQUFTLFdBQVc7WUFFZixPQUFPLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBRyxTQUFTLENBQUUsQ0FBQTtZQUN0QyxjQUFjLEdBQUcsUUFBUSxFQUFHLENBQUE7U0FDaEM7UUFDRCxTQUFTLGNBQWMsQ0FBRyxLQUFtQjtZQUV4QyxPQUFPLENBQUMsS0FBSyxDQUFFLElBQUksQ0FBQyxHQUFHLEtBQUssQ0FBRyxjQUFjLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBRSxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUE7U0FDNUU7UUFDRCxTQUFTLGdCQUFnQixDQUFHLEtBQW1CO1lBRTFDLE9BQU8sQ0FBQyxLQUFLLENBQUUsSUFBSSxDQUFDLEdBQUcsS0FBSyxDQUFHLGNBQWMsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFFLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQTtTQUM1RTtRQUNELFNBQVMsVUFBVSxDQUFHLEtBQW1CO1lBRXBDLE9BQU8sQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFHLFNBQVMsQ0FBRSxDQUFBO1lBRW5DLE1BQU0sTUFBTSxHQUFHLFdBQVc7a0JBQ1QsS0FBSyxDQUFDLENBQUM7a0JBQ1AsS0FBSyxDQUFDLENBQUMsQ0FBQTtZQUV4QixPQUFPLENBQUMsS0FBSyxDQUFFLElBQUksQ0FBQyxHQUFHLEtBQUssQ0FBRyxjQUFjLEdBQUcsTUFBTSxDQUFFLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQTtZQUN2RSxPQUFPLElBQUksQ0FBQTtTQUNmO1FBQ0QsU0FBUyxPQUFPLENBQUcsS0FBaUI7WUFFL0IsSUFBSyxLQUFLLENBQUMsU0FBUyxJQUFJLFVBQVUsQ0FBQyxlQUFlO2dCQUM3QyxPQUFNO1lBRVgsSUFBSyxXQUFXLEVBQ2hCO2dCQUNLLElBQUksS0FBSyxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUE7YUFDNUI7aUJBRUQ7Z0JBQ0ssSUFBSSxLQUFLLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQTtnQkFFeEIsSUFBSyxLQUFLLElBQUksQ0FBQztvQkFDVixLQUFLLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQTthQUM3QjtZQUVELE9BQU8sQ0FBQyxLQUFLLENBQUUsSUFBSSxDQUFDLEdBQUcsS0FBSyxDQUFHLFFBQVEsRUFBRyxHQUFHLEtBQUssQ0FBRSxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUE7U0FDdkU7UUFDRCxTQUFTLEtBQUssQ0FBRyxLQUFhO1lBRXpCLE9BQU8sS0FBSyxHQUFHLE1BQU0sQ0FBQyxRQUFRLEdBQUcsTUFBTSxDQUFDLFFBQVE7a0JBQ3pDLEtBQUssR0FBRyxNQUFNLENBQUMsUUFBUSxHQUFHLE1BQU0sQ0FBQyxRQUFRO3NCQUN6QyxLQUFLLENBQUE7U0FDaEI7SUFDTixDQUFDOztVQ3RNWSxRQUFRO1FBVWhCO1lBSFMsT0FBRSxHQUFHLEVBQVUsQ0FBQTtZQUNmLFdBQU0sR0FBRyxFQUFvQyxDQUFBO1NBRXJDO1FBTGpCLFdBQVcsT0FBTyxLQUFNLE9BQU8sT0FBTyxDQUFBLEVBQUU7UUFPeEMsR0FBRyxDQUFzQixJQUFPLEVBQUUsUUFBa0I7WUFFL0MsSUFBSyxJQUFJLElBQUksSUFBSSxDQUFDLEVBQUU7Z0JBQ2YsT0FBTTtZQUVOLElBQUksQ0FBQyxFQUFFLENBQUUsSUFBSSxDQUFDLEdBQUcsUUFBUSxDQUFBO1NBQ2xDO1FBRUQsR0FBRyxDQUFHLEdBQVc7WUFFWixPQUFPLEdBQUcsSUFBSSxJQUFJLENBQUMsRUFBRSxDQUFBO1NBQ3pCO1FBRUQsR0FBRyxDQUFzQixJQUFPLEVBQUUsR0FBSSxJQUEyQjtZQUU1RCxJQUFLLElBQUksSUFBSSxJQUFJLENBQUMsRUFBRSxFQUNwQjtnQkFDSyxJQUFJLENBQUMsRUFBRSxDQUFFLElBQUksQ0FBQyxDQUFHLEdBQUksSUFBVyxDQUFFLENBQUE7Z0JBRWxDLElBQUssSUFBSSxJQUFJLElBQUksQ0FBQyxNQUFNO29CQUNuQixJQUFJLENBQUMsTUFBTSxDQUFFLElBQUksQ0FBQyxDQUFDLFFBQVEsRUFBRyxDQUFBO2FBQ3ZDO1NBQ0w7UUFFRCxFQUFFLENBQUcsSUFBWSxFQUFFLFFBQW9CO1lBRWxDLE1BQU0sU0FBUyxHQUFHLElBQUksSUFBSSxJQUFJLENBQUMsTUFBTTtrQkFDZixJQUFJLENBQUMsTUFBTSxDQUFFLElBQUksQ0FBQztrQkFDbEIsSUFBSSxDQUFDLE1BQU0sQ0FBRSxJQUFJLENBQUMsR0FBR0MsTUFBYSxFQUFHLENBQUE7WUFFM0QsU0FBUyxDQUFHLFFBQVEsQ0FBRSxDQUFBO1NBQzFCO1FBRUQsTUFBTSxDQUFHLEdBQVc7WUFFZixPQUFPLElBQUksQ0FBQyxFQUFFLENBQUUsR0FBRyxDQUFDLENBQUE7U0FDeEI7S0FDTDtJQUVELE1BQU0sT0FBTyxHQUFHLElBQUksUUFBUSxFQUFHLENBQUE7O1VDbkRsQixTQUFTO1FBZWpCLFlBQWMsSUFBTztZQUVoQixJQUFJLENBQUMsSUFBSSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQ3BCLElBQUksQ0FBQyxXQUFXLEVBQUcsRUFDbkIsVUFBVSxDQUFHLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQVMsQ0FDbEQsQ0FBQTtTQUNMO1FBZkQsV0FBVztZQUVOLE9BQU87Z0JBQ0YsT0FBTyxFQUFFLFlBQVk7Z0JBQ3JCLElBQUksRUFBSyxXQUFXO2dCQUNwQixFQUFFLEVBQU8sU0FBUzthQUN0QixDQUFBO1NBQ0w7UUFVRCxPQUFPO1lBRUYsSUFBSyxJQUFJLENBQUMsU0FBUyxJQUFJLFNBQVMsRUFDaEM7Z0JBQ0ssSUFBSSxDQUFDLFNBQVMsR0FBRyxlQUFLLEtBQUssRUFBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksR0FBUyxDQUFBO2dCQUNyRCxJQUFJLENBQUMsUUFBUSxFQUFHLENBQUE7YUFDcEI7WUFFRCxPQUFPLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFBO1NBQzNCO1FBRUQsUUFBUTtTQUdQO1FBRVMsUUFBUTtZQUViLE1BQU0sSUFBSSxLQUFLLENBQUUsaUJBQWlCLENBQUMsQ0FBQTtTQUN2QztRQUVTLE9BQU87WUFFWixNQUFNLElBQUksS0FBSyxDQUFFLGlCQUFpQixDQUFDLENBQUE7U0FDdkM7UUFFUyxVQUFVO1lBRWYsTUFBTSxJQUFJLEtBQUssQ0FBRSxpQkFBaUIsQ0FBQyxDQUFBO1NBQ3ZDO1FBRUQsWUFBWTtTQUdYO1FBRUQsV0FBVztTQUdWO1FBRUQsY0FBYztTQUdiO0tBRUw7O0lDbkZEO0FBRUEsSUFHQSxNQUFNLE9BQU8sR0FBRyxZQUFZLENBQUE7SUFDNUIsTUFBTSxFQUFFLEdBQVEsSUFBSSxRQUFRLEVBQW9CLENBQUE7SUFDaEQsTUFBTSxPQUFPLEdBQUcsSUFBSSxPQUFPLENBQStCLEVBQUUsQ0FBRSxDQUFBO0FBRTlELElBQU8sTUFBTSxPQUFPLEdBQTJCO1FBRTFDLE1BQU0sR0FBRyxHQUFHLFNBQVMsQ0FBQyxNQUFNLElBQUksQ0FBQztjQUNyQixTQUFTLENBQUcsU0FBUyxDQUFFLENBQUMsQ0FBQyxDQUFFO2NBQzNCLFNBQVMsQ0FBRyxDQUFDLEdBQUksU0FBUyxDQUFDLENBQUUsQ0FBQTtRQUV6QyxNQUFNLElBQUksR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFHLEdBQUcsQ0FBRSxDQUFBO1FBRXBDLE9BQU8sT0FBTyxDQUFDLFFBQVEsQ0FBRyxJQUFJLENBQUUsQ0FBQTtJQUNyQyxDQUFDLENBQUE7QUFFRCxJQUFPLE1BQU0sSUFBSSxHQUF3QixVQUFXLEdBQUksSUFBWTtRQUUvRCxNQUFNLEdBQUcsR0FBRyxTQUFTLENBQUMsTUFBTSxJQUFJLENBQUM7Y0FDckIsU0FBUyxDQUFHLFNBQVMsQ0FBRSxDQUFDLENBQUMsQ0FBRTtjQUMzQixTQUFTLENBQUcsQ0FBQyxHQUFJLFNBQVMsQ0FBQyxDQUFFLENBQUE7UUFFekMsTUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBRyxHQUFHLENBQUUsQ0FBQTtRQUVwQyxPQUFPLE9BQU8sQ0FBQyxLQUFLLENBQUcsSUFBSSxDQUFFLENBQUE7SUFDbEMsQ0FBQyxDQUFBO0FBRUQsSUFBTyxNQUFNLElBQUksR0FBd0I7UUFFcEMsTUFBTSxHQUFHLEdBQUcsU0FBUyxDQUFDLE1BQU0sSUFBSSxDQUFDO2NBQ3JCLFNBQVMsQ0FBRyxTQUFTLENBQUUsQ0FBQyxDQUFDLENBQUU7Y0FDM0IsU0FBUyxDQUFHLENBQUMsR0FBSSxTQUFTLENBQUMsQ0FBRSxDQUFBO1FBRXpDLE1BQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUcsR0FBRyxDQUFFLENBQUE7UUFFcEMsSUFBSyxNQUFNLENBQUcsR0FBRyxDQUFFO1lBQ2QsSUFBSSxJQUFJLEdBQUcsR0FBRyxDQUFBO1FBRW5CLE9BQU8sT0FBTyxDQUFDLEtBQUssQ0FBRyxJQUFJLEVBQUUsSUFBSSxDQUFFLENBQUE7SUFDeEMsQ0FBQyxDQUFBO0FBRUQsSUFBTyxNQUFNLEdBQUcsR0FBa0I7UUFFN0IsTUFBTSxHQUFHLEdBQUcsU0FBUyxDQUFHLFNBQVMsQ0FBRSxDQUFDLENBQUMsQ0FBRSxDQUFBO1FBRXZDLElBQUssU0FBUyxDQUFDLE1BQU0sSUFBSSxDQUFDO1lBQ3JCLEVBQUUsQ0FBQyxHQUFHLENBQUcsR0FBRyxDQUFFLENBQUE7O1lBRWQsRUFBRSxDQUFDLEdBQUcsQ0FBRyxHQUFHLEVBQUUsU0FBUyxDQUFHLFNBQVMsQ0FBRSxDQUFDLENBQUMsQ0FBRSxDQUFFLENBQUE7SUFDckQsQ0FBQyxDQUFBO0FBRUQsSUFBTyxNQUFNLE1BQU0sR0FBMEIsVUFBVyxJQUFTLEVBQUUsR0FBSSxJQUFTO1FBRTNFLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxNQUFNLElBQUksQ0FBQztjQUNoQixTQUFTLENBQUcsSUFBSSxDQUFFLENBQUMsQ0FBQyxDQUFFO2NBQ3RCLFNBQVMsQ0FBRyxDQUFDLEdBQUksSUFBSSxDQUFDLENBQUUsQ0FBQTtRQUVwQyxNQUFNLElBQUksR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFHLEdBQUcsQ0FBRSxDQUFBO1FBRXBDLE9BQU8sQ0FBQyxPQUFPLENBQUcsSUFBSSxFQUFFLElBQUksQ0FBRSxDQUFBO0lBQ25DLENBQUMsQ0FBQTtJQUdELFNBQVMsTUFBTSxDQUFHLEdBQVE7UUFFckIsT0FBTyxPQUFPLEdBQUcsSUFBSSxRQUFRLElBQUksQ0FBRSxLQUFLLENBQUMsT0FBTyxDQUFFLEdBQUcsQ0FBQyxDQUFBO0lBQzNELENBQUM7SUFFRCxTQUFTLFNBQVMsQ0FBRyxHQUFRO1FBRXhCLElBQUssS0FBSyxDQUFDLE9BQU8sQ0FBRSxHQUFHLENBQUMsRUFDeEI7WUFDSyxJQUFLLEdBQUcsQ0FBRSxDQUFDLENBQUMsS0FBSyxPQUFPO2dCQUNuQixHQUFHLENBQUMsT0FBTyxDQUFHLE9BQU8sQ0FBRSxDQUFBO1NBQ2hDO2FBQ0ksSUFBSyxPQUFPLEdBQUcsSUFBSSxRQUFRLEVBQ2hDO1lBQ0ssSUFBSyxTQUFTLElBQUksR0FBRyxFQUNyQjtnQkFDSyxJQUFLLEdBQUcsQ0FBQyxPQUFPLEtBQUssT0FBTztvQkFDdkIsTUFBTSxtQkFBbUIsQ0FBQTthQUNsQztpQkFFRDtnQkFDTSxHQUFXLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQTthQUNsQztTQUNMO1FBRUQsT0FBTyxHQUFHLENBQUE7SUFDZixDQUFDOztVQ2xGWSxPQUFRLFNBQVEsU0FBb0I7UUFJNUMsT0FBTztZQUVGLElBQUssSUFBSSxDQUFDLFNBQVMsSUFBSSxTQUFTLEVBQ2hDO2dCQUNLLElBQUksQ0FBQyxTQUFTLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBRyxLQUFLLENBQUUsQ0FBQTtnQkFDakQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUE7YUFDaEQ7WUFFRCxPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsVUFBbUMsQ0FBQTtTQUM3RDtLQUNMOztVQ1JZLFNBQThDLFNBQVEsU0FBYTtRQWlCM0UsWUFBYyxJQUFPO1lBRWhCLEtBQUssQ0FBRyxJQUFJLENBQUUsQ0FBQTtZQWpCbkIsYUFBUSxHQUFHLEVBQWdDLENBQUE7WUFtQnRDLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFBO1lBQ2hCLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUE7WUFFOUIsSUFBSyxRQUFRLEVBQ2I7Z0JBQ0ssS0FBTSxNQUFNLEtBQUssSUFBSSxRQUFRLEVBQzdCO29CQUNLLElBQUssQ0FBRSxPQUFPLENBQUcsS0FBSyxDQUFFO3dCQUNuQixJQUFJLENBQUcsS0FBSyxDQUFFLENBQUE7aUJBQ3ZCO2FBQ0w7WUFFRCxJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxTQUFTLElBQUksSUFBSSxJQUFJLElBQUksQ0FBQyxTQUFTLElBQUksSUFBSSxDQUFBO1NBQ3ZFO1FBM0JELFdBQVc7WUFFTixPQUFPO2dCQUNGLE9BQU8sRUFBRSxZQUFZO2dCQUNyQixJQUFJLEVBQU8sV0FBVztnQkFDdEIsRUFBRSxFQUFTLFNBQVM7Z0JBQ3BCLFNBQVMsRUFBRSxJQUFJO2FBQ25CLENBQUE7U0FDTDtRQXFCRCxPQUFPO1lBRUYsSUFBSyxJQUFJLENBQUMsU0FBUyxJQUFJLFNBQVM7Z0JBQzNCLE9BQU8sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUE7WUFFNUIsTUFBTSxRQUFRLEdBQUksS0FBSyxDQUFDLE9BQU8sRUFBRyxDQUFBO1lBQ2xDLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUE7WUFDaEMsTUFBTSxJQUFJLEdBQVEsSUFBSSxDQUFDLElBQUksQ0FBQTtZQUMzQixNQUFNLFFBQVEsR0FBSSxJQUFJLENBQUMsUUFBUSxDQUFBO1lBRy9CLElBQUssSUFBSSxDQUFDLFdBQVc7Z0JBQ2hCLFNBQVMsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFHLFVBQVUsQ0FBRSxDQUFBOztnQkFFdEMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUcsVUFBVSxDQUFFLENBQUE7WUFFOUMsSUFBSyxJQUFJLENBQUMsSUFBSSxJQUFJLFNBQVM7Z0JBQ3RCLElBQUksQ0FBQyxJQUFJLEdBQUcsU0FBUyxDQUFBO1lBRTFCLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUE7WUFFdEIsSUFBSyxJQUFJLENBQUMsUUFBUSxFQUNsQjtnQkFDSyxNQUFNLFlBQVksR0FBRyxFQUFrQixDQUFBO2dCQUV2QyxLQUFNLE1BQU0sS0FBSyxJQUFJLElBQUksQ0FBQyxRQUFRLEVBQ2xDO29CQUNLLE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBRyxLQUFLLENBQUUsQ0FBQTtvQkFDeEIsSUFBSSxDQUFDLE1BQU0sQ0FBRyxHQUFJLENBQUMsQ0FBQyxPQUFPLEVBQUcsQ0FBRSxDQUFBO29CQUNoQyxRQUFRLENBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUE7aUJBQzVCO2dCQUVELElBQUksQ0FBQyxlQUFlLENBQUcsWUFBWSxDQUFFLENBQUE7YUFDekM7WUFFRCxPQUFPLFFBQVEsQ0FBQTtTQUNuQjtRQUVELGVBQWUsQ0FBRyxVQUF3QjtTQUd6QztRQUVELE1BQU0sQ0FBRyxHQUFJLFFBQTREO1lBR3BFLElBQUssSUFBSSxDQUFDLFNBQVMsSUFBSSxTQUFTO2dCQUMzQixJQUFJLENBQUMsT0FBTyxFQUFHLENBQUE7WUFFcEIsTUFBTSxJQUFJLEdBQVEsSUFBSSxDQUFDLElBQUksQ0FBQTtZQUMzQixNQUFNLFFBQVEsR0FBSSxJQUFJLENBQUMsUUFBUSxDQUFBO1lBQy9CLE1BQU0sU0FBUyxHQUFHLEVBQWtCLENBQUE7WUFFcEMsS0FBTSxJQUFJLENBQUMsSUFBSSxRQUFRLEVBQ3ZCO2dCQUNLLElBQUssT0FBTyxDQUFDLElBQUksUUFBUSxFQUN6QjtvQkFDSyxDQUFDLEdBQUcsSUFBSSxPQUFPLENBQUU7d0JBQ1osT0FBTyxFQUFFLFlBQVk7d0JBQ3JCLElBQUksRUFBSyxTQUFTO3dCQUNsQixFQUFFLEVBQUksU0FBUzt3QkFDZixPQUFPLEVBQUUsQ0FBQztxQkFDZCxDQUFDLENBQUE7aUJBQ047cUJBQ0ksSUFBSyxDQUFDLFlBQVksT0FBTyxFQUM5QjtvQkFDSyxNQUFNLFlBQVksR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFHLGNBQWMsQ0FBRSxDQUFBO29CQUVsRCxDQUFDLEdBQUcsQ0FBQyxDQUFFLFlBQVksQ0FBQyxJQUFJLFNBQVM7MEJBQzFCLENBQUMsQ0FBRSxZQUFZLENBQUM7MEJBQ2hCLElBQUksT0FBTyxDQUFFOzRCQUNWLE9BQU8sRUFBRSxZQUFZOzRCQUNyQixJQUFJLEVBQUssU0FBUzs0QkFDbEIsRUFBRSxFQUFJLFNBQVM7NEJBQ2YsT0FBTyxFQUFFLENBQUMsQ0FBQyxTQUFTO3lCQUN4QixDQUFDLENBQUE7aUJBQ1g7cUJBQ0ksSUFBSyxFQUFFLENBQUMsWUFBWSxTQUFTLENBQUMsRUFDbkM7b0JBQ0ssQ0FBQyxHQUFHLE9BQU8sQ0FBRyxDQUFDLENBQUU7MEJBQ2IsSUFBSSxDQUFHLENBQUMsQ0FBRTswQkFDVixJQUFJLENBQUcsQ0FBQyxDQUFFLENBQUE7aUJBQ2xCO2dCQUVELFFBQVEsQ0FBRyxDQUFlLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQWMsQ0FBQTtnQkFDcEQsSUFBSSxDQUFDLE1BQU0sQ0FBRyxHQUFLLENBQWUsQ0FBQyxPQUFPLEVBQUcsQ0FBRSxDQUFBO2dCQUMvQyxTQUFTLENBQUMsSUFBSSxDQUFHLENBQWMsQ0FBRSxDQUFBO2FBQ3JDO1lBRUQsSUFBSyxTQUFTLENBQUMsTUFBTSxHQUFHLENBQUM7Z0JBQ3BCLElBQUksQ0FBQyxlQUFlLENBQUcsU0FBUyxDQUFFLENBQUE7U0FDM0M7UUFFRCxNQUFNLENBQUcsR0FBSSxRQUF3RDtTQUdwRTtRQUVELEtBQUs7WUFFQSxJQUFJLENBQUMsUUFBUSxHQUFHLEVBQUUsQ0FBQTtZQUVsQixJQUFLLElBQUksQ0FBQyxTQUFTO2dCQUNkLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxHQUFHLEVBQUUsQ0FBQTtTQUN0QztRQUVELGNBQWM7WUFFVCxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFBO1NBQzlCO1FBRUQsY0FBYyxDQUFHLEtBQWdCO1lBRTVCLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUE7WUFFeEIsSUFBSyxLQUFLLElBQUksTUFBTSxDQUFDLFNBQVM7Z0JBQ3pCLE9BQU07WUFFWCxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFBO1lBRWhDLElBQUssSUFBSSxDQUFDLFdBQVc7Z0JBQ2hCLFNBQVMsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFHLFVBQVUsQ0FBRSxDQUFBOztnQkFFdEMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUcsVUFBVSxDQUFFLENBQUE7WUFFOUMsTUFBTSxDQUFDLFNBQVMsR0FBRyxLQUFLLENBQ3ZCO1lBQUMsSUFBSSxDQUFDLFdBQXVCLEdBQUcsS0FBSyxJQUFJLElBQUksSUFBSSxLQUFLLElBQUksSUFBSSxDQUFBO1NBQ25FO0tBQ0w7O1VDcktZLEtBQU0sU0FBUSxTQUFrQjtRQUE3Qzs7WUFFSyxjQUFTLEdBQUcsZUFBSyxLQUFLLEVBQUMsS0FBSyxHQUFPLENBQUE7U0FzQnZDO1FBcEJJLElBQUksV0FBVztZQUVWLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFHLFVBQVUsQ0FBRTtrQkFDaEQsWUFBWTtrQkFDWixVQUFVLENBQUE7U0FDckI7UUFFRCxJQUFJLFdBQVcsQ0FBRyxXQUF3QjtZQUVyQyxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQTtZQUUxQyxJQUFJLGVBQWUsR0FBRyxTQUFTLENBQUMsUUFBUSxDQUFHLFVBQVUsQ0FBRTtrQkFDakMsWUFBWTtrQkFDWixVQUFVLENBQUE7WUFFaEMsSUFBSyxXQUFXLElBQUksZUFBZTtnQkFDOUIsT0FBTTtZQUVYLFNBQVMsQ0FBQyxPQUFPLENBQUksV0FBVyxFQUFFLGVBQWUsQ0FBRSxDQUFBO1NBQ3ZEO0tBQ0w7SUFHRCxNQUFNLENBQUcsS0FBSyxFQUFFLENBQUMsT0FBTyxDQUFDLENBQUUsQ0FBQTs7VUNyQ2QsTUFBTyxTQUFRLFNBQW1CO1FBRTFDLE9BQU87WUFFRixJQUFLLElBQUksQ0FBQyxTQUFTLElBQUksU0FBUyxFQUNoQztnQkFDSyxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFBO2dCQUV0QixNQUFNLElBQUksR0FBRyxlQUFLLEtBQUssRUFBQyxRQUFRO29CQUN6QixJQUFJLENBQUMsSUFBSSxHQUFHLGdCQUFNLEtBQUssRUFBQyxNQUFNLElBQUcsSUFBSSxDQUFDLElBQUksQ0FBUyxHQUFHLElBQUk7b0JBQzFELElBQUksQ0FBQyxJQUFJLEdBQUcsZ0JBQU0sS0FBSyxFQUFDLE1BQU0sSUFBRyxJQUFJLENBQUMsSUFBSSxDQUFTLEdBQUcsSUFBSSxDQUMzRCxDQUFBO2dCQUVOLElBQUssSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLElBQUksU0FBUyxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxJQUFJLFNBQVM7b0JBQ2pFLElBQUksQ0FBQyxnQkFBZ0IsQ0FBRyxPQUFPLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUUsSUFBSSxDQUFDLENBQUUsQ0FBQTtnQkFFaEUsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUE7YUFDekI7WUFFRCxPQUFPLENBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBb0IsQ0FBQTtTQUMvQztRQUVELE9BQU87WUFFRixJQUFLLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFHLEtBQUssSUFBSTtnQkFDcEQsT0FBTTtZQUVYLElBQUssSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPO2dCQUNqQixRQUFRLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBRSxDQUFBO1NBQ25EO1FBRVMsT0FBTztTQUdoQjtLQUNMO0lBR0QsTUFBTSxDQUFHLE1BQU0sRUFBRSxDQUFDLFFBQVEsQ0FBQyxDQUFFLENBQUE7O0lDQXRCLE1BQU0sUUFBUSxHQUFHO1FBQ25CLElBQUksRUFBRSxRQUFvQjtRQUMxQixFQUFFLEVBQUksU0FBUztRQUNmLElBQUksRUFBRSxTQUFTO0tBQ25CLENBQUE7SUFFRCxHQUFHLENBQWEsQ0FBRSxRQUFRLENBQUUsRUFBRSxRQUFRLENBQUUsQ0FBQTs7SUM5QnhDO0lBQ0E7SUFDQTtJQUNBO0FBQ0EsVUFBYSxTQUFVLFNBQVEsU0FBc0I7UUFBckQ7O1lBRUssYUFBUSxHQUFHLEVBQWdDLENBQUE7U0E4Qy9DO1FBMUNJLE9BQU87WUFFRixNQUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsT0FBTyxFQUFHLENBQUE7WUFFakMsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQTtZQUN0QixNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFBO1lBRWhDLElBQUssSUFBSSxDQUFDLFdBQVcsRUFDckI7Z0JBQ0ssSUFBSSxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUcsU0FBUyxFQUFFO29CQUNuQyxPQUFPLEVBQUssQ0FBRSxTQUFTLENBQUU7b0JBQ3pCLFFBQVEsRUFBSSxDQUFDLENBQUM7b0JBQ2QsUUFBUSxFQUFJLENBQUM7b0JBQ2IsUUFBUSxFQUFJLElBQUksQ0FBQyxTQUFTLElBQUksSUFBSSxJQUFJLElBQUksQ0FBQyxTQUFTLElBQUksSUFBSSxHQUFHLEtBQUssR0FBRSxNQUFNO29CQUM1RSxLQUFLLEVBQU8sSUFBSTtvQkFDaEIsVUFBVSxFQUFFLElBQUk7aUJBQ3BCLENBQUMsQ0FBQTtnQkFDRixJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsRUFBRyxDQUFBO2FBQzlCO1lBRUQsT0FBTyxRQUFRLENBQUE7U0FDbkI7UUFFRCxJQUFJLENBQUcsRUFBVSxFQUFFLEdBQUksT0FBNEQ7WUFFOUUsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBRSxFQUFFLENBQUMsQ0FBQTtZQUVoQyxJQUFLLEtBQUssSUFBSSxTQUFTO2dCQUNsQixPQUFNO1lBRVgsSUFBSyxJQUFJLENBQUMsT0FBTztnQkFDWixJQUFJLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQTtZQUV6QixJQUFLLE9BQU8sRUFDWjtnQkFDSyxLQUFLLENBQUMsS0FBSyxFQUFHLENBQUE7Z0JBQ2QsT0FBTyxDQUFDLEdBQUcsQ0FBRyxPQUFPLENBQUUsQ0FBQTtnQkFDdkIsS0FBSyxDQUFDLE1BQU0sQ0FBRyxHQUFJLE9BQU8sQ0FBRSxDQUFBO2FBQ2hDO1lBRUQsS0FBSyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQTtTQUMzQztLQUNMO0lBRUQsTUFBTSxDQUFHLFNBQVMsRUFBRSxDQUFDLFdBQVcsQ0FBQyxDQUFFLENBQUE7SUFDbkMsTUFBTSxDQUFHLFNBQVMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxDQUFNLENBQUE7O1VDMUR0QixRQUEwQyxTQUFRLFNBQWE7UUFJdkUsT0FBTztZQUVGLElBQUssSUFBSSxDQUFDLFNBQVMsSUFBSSxTQUFTO2dCQUMzQixPQUFPLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFBO1lBRTVCLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLEdBQUcsZUFBSyxLQUFLLEVBQUMsaUJBQWlCLEdBQU8sQ0FBQTtZQUU1RCxLQUFLLENBQUMsT0FBTyxFQUFHLENBQUE7WUFFaEIsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQTtZQUVoQyxTQUFTLENBQUMsTUFBTSxDQUFHLElBQUksQ0FBRSxDQUFBO1lBQ3pCLFNBQVMsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFHLFdBQVcsQ0FBRSxDQUFBO1lBRXZDLElBQUksQ0FBQyxTQUFTLEdBQUcsVUFBVSxDQUFHLElBQUksRUFBRTtnQkFDL0IsT0FBTyxFQUFLLENBQUUsU0FBUyxDQUFFO2dCQUN6QixPQUFPLEVBQUksQ0FBQztnQkFDWixPQUFPLEVBQUksQ0FBQztnQkFDWixRQUFRLEVBQUksSUFBSSxDQUFDLFdBQVcsR0FBRyxLQUFLLEdBQUUsTUFBTTtnQkFDNUMsU0FBUyxFQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUztnQkFDL0IsSUFBSSxFQUFPLElBQUk7YUFFbkIsQ0FBQyxDQUFBO1lBQ0YsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLEVBQUcsQ0FBQTtZQUUxQixNQUFNLENBQUMsZ0JBQWdCLENBQUcsa0JBQWtCLEVBQUU7Z0JBRXpDLElBQUksQ0FBQyxTQUFTLENBQUMsWUFBWSxDQUFFO29CQUN4QixPQUFPLEVBQUUsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFHO2lCQUMvQixDQUFDLENBQUE7YUFDTixDQUFDLENBQUE7WUFFRixPQUFPLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFBO1NBQzNCO1FBRUQsZUFBZSxDQUFHLFFBQXNCO1lBRW5DLElBQUksQ0FBQyxTQUFTLENBQUMsWUFBWSxDQUFFO2dCQUN4QixPQUFPLEVBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFHO2dCQUM3QixRQUFRLEVBQUcsSUFBSSxDQUFDLFdBQVcsR0FBRyxLQUFLLEdBQUUsTUFBTTtnQkFDM0MsU0FBUyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUzthQUNsQyxDQUFDLENBQUE7U0FDTjtRQUVPLFNBQVM7WUFFWixNQUFNLEVBQUUsSUFBSSxFQUFFLEdBQUcsSUFBSSxDQUFBO1lBRXJCLE9BQU8sUUFBUSxDQUFHLElBQUksRUFBRSxJQUFJLENBQUMsV0FBVyxHQUFHLFFBQVEsR0FBRyxPQUFPLENBQUUsQ0FBQTtTQUNuRTtRQUVELEtBQUssQ0FBRyxNQUFxQixFQUFFLElBQWlCOzs7OztTQU0vQztLQUNMOztJQy9DRDs7Ozs7Ozs7QUFRQSxVQUFhLE9BQVEsU0FBUSxRQUFtQjtRQUszQyxhQUFhO1lBRVIsdUNBQ1MsS0FBSyxDQUFDLFdBQVcsRUFBRyxLQUN4QixJQUFJLEVBQU8sU0FBUyxFQUNwQixLQUFLLEVBQU0sV0FBVyxFQUN0QixTQUFTLEVBQUUsSUFBSTs7Z0JBRWYsT0FBTyxFQUFFLEVBQUUsSUFDZjtTQUNMO1FBRUQsT0FBTztZQUVGLElBQUssSUFBSSxDQUFDLFNBQVMsSUFBSSxTQUFTO2dCQUMzQixPQUFPLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFBO1lBRTVCLEtBQUssQ0FBQyxPQUFPLEVBQUcsQ0FBQTtZQUVoQixJQUFLLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTztnQkFDakIsSUFBSSxDQUFDLE1BQU0sQ0FBRyxHQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFFLENBQUE7WUFFMUMsT0FBTyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQTtTQUMzQjtLQUNMO0lBRUQsTUFBTSxDQUFHLE9BQU8sRUFBRSxDQUFDLFNBQVMsQ0FBQyxDQUFFLENBQUE7O0lDbkQvQixTQUFTLGdCQUFnQixDQUFHLE9BQXdCO1FBRS9DLFdBQVcsRUFBRyxDQUFBO1FBRWQsT0FBTztZQUNGLFFBQVE7WUFDUixXQUFXO1NBQ2YsQ0FBQTtRQUVELFNBQVMsUUFBUTtZQUVaLE1BQU0sR0FBRyxHQUFHLE9BQU8sQ0FBQyxTQUFTLElBQUksSUFBSSxJQUFJLE9BQU8sQ0FBQyxTQUFTLElBQUksSUFBSTtrQkFDdEQsT0FBTyxHQUFHLE9BQU8sQ0FBQTtZQUU3QixLQUFNLE1BQU0sQ0FBQyxJQUFJLE9BQU8sQ0FBQyxPQUFPO2dCQUMzQixDQUFDLENBQUMsS0FBSyxDQUFDLFdBQVcsR0FBRyxHQUFHLENBQUE7U0FDbEM7UUFFRCxTQUFTLFdBQVc7WUFFZixNQUFNLEdBQUcsR0FBRyxPQUFPLENBQUMsU0FBUyxJQUFJLElBQUksSUFBSSxPQUFPLENBQUMsU0FBUyxJQUFJLElBQUk7a0JBQ3RELE9BQU8sR0FBRyxPQUFPLENBQUE7WUFFN0IsS0FBTSxNQUFNLENBQUMsSUFBSSxPQUFPLENBQUMsT0FBTztnQkFDM0IsQ0FBQyxDQUFDLEtBQUssQ0FBQyxXQUFXLEdBQUcsTUFBTSxDQUFBO1NBQ3JDO0lBQ04sQ0FBQztBQUVELGFBQWdCLFNBQVMsQ0FBRyxPQUF3QjtRQUUvQyxJQUFLLGNBQWMsSUFBSSxNQUFNO1lBQ3hCLE9BQU8sZ0JBQWdCLENBQUcsT0FBTyxDQUFFLENBQUE7UUFFeEMsTUFBTSxJQUFJLEdBQUcsU0FBUyxDQUFFO1lBQ25CLE9BQU8sRUFBUyxPQUFPLENBQUMsT0FBTztZQUMvQixjQUFjLEVBQUUsR0FBRztZQUNuQixXQUFXO1lBQ1gsTUFBTSxFQUFPLE9BQU8sQ0FBQyxTQUFTLElBQUksSUFBSSxJQUFJLE9BQU8sQ0FBQyxTQUFTLElBQUksSUFBSTtrQkFDdEQsY0FBYztrQkFDZCxnQkFBZ0I7WUFDN0IsVUFBVSxFQUFFLE9BQU8sQ0FBQyxTQUFTLElBQUksSUFBSSxJQUFJLE9BQU8sQ0FBQyxTQUFTLElBQUksSUFBSTtrQkFDdEQsa0JBQWtCO2tCQUNsQixvQkFBb0I7U0FDcEMsQ0FBQyxDQUFBO1FBRUYsT0FBTztZQUNGLFFBQVEsRUFBRSxRQUFRLElBQUksQ0FBQyxRQUFRLEVBQUcsQ0FBQSxFQUFFO1NBQ3hDLENBQUE7UUFFRCxTQUFTLFdBQVc7WUFFZixLQUFNLE1BQU0sQ0FBQyxJQUFJLE9BQU8sQ0FBQyxPQUFPO2dCQUMzQixDQUFDLENBQUMsS0FBSyxDQUFDLGNBQWMsR0FBRyxPQUFPLENBQUE7U0FDekM7UUFDRCxTQUFTLGNBQWMsQ0FBRyxLQUFnQjtZQUVyQyxLQUFNLE1BQU0sQ0FBQyxJQUFJLE9BQU8sQ0FBQyxPQUFPO2dCQUMzQixDQUFDLENBQUMsUUFBUSxDQUFHLENBQUMsRUFBRSxLQUFLLENBQUMsT0FBTyxDQUFFLENBQUE7U0FDeEM7UUFDRCxTQUFTLGdCQUFnQixDQUFHLEtBQWdCO1lBRXZDLEtBQU0sTUFBTSxDQUFDLElBQUksT0FBTyxDQUFDLE9BQU87Z0JBQzNCLENBQUMsQ0FBQyxRQUFRLENBQUcsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUUsQ0FBQTtTQUN4QztRQUNELFNBQVMsa0JBQWtCLENBQUcsS0FBZ0I7WUFFekMsS0FBTSxNQUFNLENBQUMsSUFBSSxPQUFPLENBQUMsT0FBTyxFQUNoQztnQkFDSyxDQUFDLENBQUMsUUFBUSxDQUFHLENBQUMsRUFBRSxLQUFLLENBQUMsT0FBTyxDQUFFLENBQUE7OzthQUduQztZQUNELE9BQU8sSUFBSSxDQUFBO1NBQ2Y7UUFDRCxTQUFTLG9CQUFvQixDQUFHLEtBQWdCO1lBRTNDLEtBQU0sTUFBTSxDQUFDLElBQUksT0FBTyxDQUFDLE9BQU8sRUFDaEM7Z0JBQ0ssQ0FBQyxDQUFDLFFBQVEsQ0FBRyxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBRSxDQUFBOzs7YUFHbkM7WUFDRCxPQUFPLElBQUksQ0FBQTtTQUNmO0lBQ04sQ0FBQzs7SUNsRkQsTUFBTSxVQUFVLEdBQUc7UUFDZCxFQUFFLEVBQUcsTUFBTTtRQUNYLEVBQUUsRUFBRyxPQUFPO1FBQ1osRUFBRSxFQUFHLEtBQUs7UUFDVixFQUFFLEVBQUcsUUFBUTtLQUNqQixDQUFBO0lBRUQ7Ozs7Ozs7Ozs7OztBQVlBLFVBQWEsS0FBb0MsU0FBUSxTQUFhOztRQVVqRSxXQUFXO1lBRU4sdUNBQ1MsS0FBSyxDQUFDLFdBQVcsRUFBRyxLQUN4QixJQUFJLEVBQVcsT0FBTyxFQUN0QixRQUFRLEVBQU8sRUFBRSxFQUNqQixTQUFTLEVBQU0sSUFBSSxJQUV2QjtTQUNMO1FBRUQsT0FBTztZQUVGLElBQUssSUFBSSxDQUFDLFNBQVMsSUFBSSxTQUFTLEVBQ2hDO2dCQUNLLE1BQU0sTUFBTSxHQUFNLGVBQUssS0FBSyxFQUFDLGNBQWMsR0FBRyxDQUFBO2dCQUM5QyxNQUFNLE9BQU8sR0FBSyxlQUFLLEtBQUssRUFBQyxlQUFlLEdBQUcsQ0FBQTtnQkFDL0MsTUFBTSxTQUFTLEdBQUcsZUFBSyxLQUFLLEVBQUMsYUFBYTtvQkFDbkMsTUFBTTtvQkFDTixPQUFPLENBQ1IsQ0FBQTtnQkFFTixNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFBOzs7Ozs7Ozs7Z0JBWXRCLElBQUssSUFBSSxDQUFDLE1BQU0sRUFDaEI7b0JBQ0ssSUFBSSxDQUFDLE1BQU0sR0FBRyxPQUFPLENBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBRTswQkFDdkIsSUFBSSxDQUFHLElBQUksQ0FBQyxNQUFNLENBQUU7MEJBQ3BCLElBQUksQ0FBRyxJQUFJLENBQUMsTUFBTSxDQUFFLENBQUE7b0JBRWxDLE1BQU0sQ0FBQyxNQUFNLENBQUcsR0FBSSxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRyxDQUFFLENBQUE7aUJBQ2hEO2dCQUVELElBQUssSUFBSSxDQUFDLFFBQVEsRUFDbEI7O29CQUVLLEtBQU0sTUFBTSxLQUFLLElBQUksSUFBSSxDQUFDLFFBQVEsRUFDbEM7d0JBQ0ssSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUcsS0FBSyxDQUFFOzhCQUNqQixJQUFJLENBQUcsS0FBSyxDQUFFOzhCQUNkLElBQUksQ0FBRyxLQUFLLENBQUUsQ0FBQTt3QkFFN0IsT0FBTyxDQUFDLE1BQU0sQ0FBRyxHQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFHLENBQUUsQ0FBQTtxQkFDbEQ7aUJBQ0w7Z0JBRUQsSUFBSSxDQUFDLFNBQVMsR0FBSSxTQUFTLENBQUE7Ozs7Ozs7Ozs7Ozs7OztnQkFrQjNCLFNBQVMsQ0FBRTtvQkFDTixPQUFPLEVBQUUsQ0FBQyxPQUFPLENBQUM7b0JBQ2xCLFNBQVMsRUFBRSxJQUFJO2lCQUNuQixDQUFDO3FCQUNELFFBQVEsRUFBRyxDQUFBO2dCQUVaLElBQUksQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFBO2dCQUNyQixJQUFJLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQTtnQkFFdkIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFHLFVBQVUsQ0FBRSxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUUsQ0FBQTthQUNoRTtZQUVELE9BQU8sQ0FBRSxJQUFJLENBQUMsU0FBUyxDQUFvQixDQUFBO1NBQy9DOzs7Ozs7Ozs7Ozs7O1FBaUJELGNBQWMsQ0FBRyxLQUFnQjtZQUU1QixNQUFNLEVBQUUsSUFBSSxFQUFFLEdBQUcsSUFBSSxDQUFBO1lBRXJCLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBRyxVQUFVLENBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFFLENBQUE7WUFDL0QsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFHLFVBQVUsQ0FBRSxLQUFLLENBQUMsQ0FBRSxDQUFBO1lBRW5ELEtBQUssQ0FBQyxjQUFjLENBQUcsS0FBSyxDQUFFLENBQUE7O1lBSTlCLElBQUksQ0FBQyxTQUFTLEdBQUcsS0FBSyxDQUFBO1NBQzFCO0tBZ0RMO0lBRUQsTUFBTSxDQUFHLEtBQUssRUFBRSxDQUFDLE9BQU8sQ0FBQyxDQUFFLENBQUE7O1VDeE1kLFFBQVMsU0FBUSxLQUFpQjtRQUsxQyxPQUFPO1lBRUYsTUFBTSxRQUFRLEdBQUcsS0FBSyxDQUFDLE9BQU8sRUFBRyxDQUFBO1lBRWpDLE1BQU0sSUFBSSxHQUFRLElBQUksQ0FBQyxJQUFJLENBQUE7WUFDM0IsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQTtZQUNoQyxNQUFNLE1BQU0sR0FBTSxJQUFJLENBQUMsT0FBTyxDQUFBO1lBQzlCLE1BQU0sT0FBTyxHQUFLLElBQUksQ0FBQyxRQUFRLENBQUE7WUFFL0IsU0FBUyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUcsT0FBTyxFQUFVLFdBQVcsQ0FBRSxDQUFBO1lBQzVELE1BQU0sQ0FBSSxTQUFTLENBQUMsT0FBTyxDQUFHLGNBQWMsRUFBRyxrQkFBa0IsQ0FBRSxDQUFBO1lBQ25FLE9BQU8sQ0FBRyxTQUFTLENBQUMsT0FBTyxDQUFHLGVBQWUsRUFBRSxtQkFBbUIsQ0FBRSxDQUFBO1lBRXBFLElBQUssSUFBSSxDQUFDLGFBQWEsRUFDdkI7Z0JBQ0ssTUFBTSxHQUFHLEdBQUcsZ0JBQU0sS0FBSyxFQUFDLHVCQUF1QjtvQkFDMUMsZ0JBQU0sS0FBSyxFQUFDLE1BQU0sYUFBUyxDQUN6QixDQUFBO2dCQUVQLElBQUksQ0FBQyxXQUFXLEdBQUcsR0FBRyxDQUFBOztnQkFFdEIsTUFBTSxDQUFDLHFCQUFxQixDQUFHLFlBQVksRUFBRSxHQUFHLENBQUUsQ0FBQTthQUN0RDtZQUVELElBQUksQ0FBQyxVQUFVLEdBQUcsVUFBVSxDQUFHLElBQUksQ0FBQyxTQUFTLEVBQUU7Z0JBQzFDLFNBQVMsRUFBTSxJQUFJLENBQUMsU0FBUztnQkFDN0IsSUFBSSxFQUFXLEVBQUU7Z0JBQ2pCLE9BQU8sRUFBUSxLQUFLLENBQUMsRUFBRSxDQUFHLElBQUksQ0FBQyxXQUFXLENBQUU7Z0JBQzVDLFdBQVcsRUFBSTtvQkFDVixPQUFPLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBRyxRQUFRLENBQUUsQ0FBQTtpQkFDekM7Z0JBQ0QsYUFBYSxFQUFFO29CQUNWLE9BQU8sQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFHLFFBQVEsQ0FBRSxDQUFBO2lCQUN0QzthQUNMLENBQUMsQ0FBQTtZQUVGLElBQUksQ0FBQyxVQUFVLENBQUMsUUFBUSxFQUFHLENBQUE7WUFFM0IsT0FBTyxRQUFRLENBQUE7U0FDbkI7UUFFRCxNQUFNO1lBRUQsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRyxDQUFBO1NBQ3BDO1FBRUQsT0FBTztZQUVGLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLEVBQUcsQ0FBQTtTQUNyQztRQUVELElBQUk7U0FHSDtRQUVELEtBQUs7WUFFQSxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssRUFBRyxDQUFBO1lBRXhCLE9BQU8sSUFBSSxDQUFBO1NBQ2Y7S0FXTDtJQUVELE1BQU0sQ0FBRyxRQUFRLEVBQUUsQ0FBQyxXQUFXLENBQUMsQ0FBRSxDQUFBOzthQ3pEbEIsY0FBYyxDQUFHLElBQWdCLEVBQUUsR0FBUTtRQUV0RCxRQUFTLElBQUk7WUFFYixLQUFLLFFBQVUsRUFBRSxPQUFPLFVBQVUsQ0FBQyxNQUFNLENBQUssR0FBRyxDQUFFLENBQUE7WUFDbkQsS0FBSyxVQUFVLEVBQUUsT0FBTyxVQUFVLENBQUMsUUFBUSxDQUFHLEdBQUcsQ0FBRSxDQUFBO1lBQ25ELEtBQUssUUFBVSxFQUFFLE9BQU8sVUFBVSxDQUFDLE1BQU0sQ0FBSyxHQUFHLENBQUUsQ0FBQTtZQUNuRCxLQUFLLFVBQVUsRUFBRSxPQUFPLFVBQVUsQ0FBQyxRQUFRLENBQUcsR0FBRyxDQUFFLENBQUE7WUFDbkQsS0FBSyxTQUFVLEVBQUUsT0FBTyxVQUFVLENBQUMsT0FBTyxDQUFJLEdBQUcsQ0FBRSxDQUFBO1lBQ25ELEtBQUssUUFBVSxFQUFFLE9BQU8sVUFBVSxDQUFDLE1BQU0sQ0FBSyxHQUFHLENBQUUsQ0FBQTtZQUNuRCxLQUFLLE1BQVUsRUFBRSxPQUFPLFVBQVUsQ0FBQyxJQUFJLENBQU8sR0FBRyxDQUFFLENBQUE7WUFDbkQsS0FBSyxTQUFVLEVBQUUsT0FBTyxVQUFVLENBQUMsT0FBTyxDQUFJLEdBQUcsQ0FBRSxDQUFBO1lBQ25ELEtBQUssTUFBVSxFQUFFLE9BQU8sVUFBVSxDQUFDLElBQUksQ0FBTyxHQUFHLENBQUUsQ0FBQTtTQUNsRDtJQUNOLENBQUM7SUFFRCxNQUFNLFVBQVU7Ozs7OztRQVFYLE9BQU8sTUFBTSxDQUFHLEdBQXFCO1lBRWhDLE1BQU0sSUFBSSxHQUFHLGtCQUNSLEVBQUUsRUFBSyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFDakIsRUFBRSxFQUFLLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUNqQixDQUFDLEVBQU0sR0FBRyxDQUFDLElBQUksR0FBRyxDQUFDLEdBQ3RCLENBQUE7WUFFRixPQUFPLElBQUksQ0FBQTtTQUNmO1FBRUQsT0FBTyxRQUFRLENBQUcsR0FBcUI7U0FFdEM7UUFHRCxPQUFPLE1BQU0sQ0FBRyxHQUFxQjtTQUVwQztRQUVELE9BQU8sUUFBUSxDQUFHLEdBQXFCO1NBRXRDO1FBRUQsT0FBTyxPQUFPLENBQUcsR0FBcUI7U0FFckM7UUFHRCxPQUFPLElBQUksQ0FBRyxHQUFtQjtTQUVoQztRQUVELE9BQU8sT0FBTyxDQUFHLEdBQW1CO1NBRW5DO1FBR0QsT0FBTyxJQUFJLENBQUcsR0FBbUI7U0FFaEM7S0FDTDs7SUNuR0QsTUFBTSxDQUFDLEdBQUcsUUFBUSxDQUFBO0FBaUJsQixVQUFhLFVBQVcsU0FBUSxTQUF1QjtRQUF2RDs7WUFLYyxjQUFTLEdBQThCO2dCQUMzQyxRQUFRLEVBQUUsSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBRSxJQUFJLENBQUM7YUFDL0MsQ0FBQTtTQTRITDtRQTFISSxPQUFPO1lBRUYsSUFBSSxDQUFDLE1BQU0sRUFBRyxDQUFBO1lBRWQsT0FBTyxDQUFDLElBQUksQ0FBQyxTQUFnQixDQUFDLENBQUE7U0FDbEM7UUFFRCxHQUFHLENBQUcsR0FBSSxPQUFtQjtZQUV4QixJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUcsR0FBSSxPQUFjLENBQUUsQ0FBQTtZQUU3QyxJQUFJLENBQUMsTUFBTSxFQUFHLENBQUE7U0FDbEI7UUFFRCxNQUFNO1lBRUQsTUFBTSxFQUFFLElBQUksRUFBRSxHQUFHLElBQUksQ0FBQTtZQUVyQixNQUFNLEdBQUcsR0FBaUI7Z0JBQ3JCLEtBQUssRUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU07Z0JBQzVCLENBQUMsRUFBUSxFQUFFO2dCQUNYLE9BQU8sRUFBRSxDQUFDO2dCQUNWLFFBQVEsRUFBRSxJQUFJLENBQUMsUUFBUSxJQUFJLENBQUM7YUFDaEMsQ0FBQTtZQUVELElBQUksQ0FBQyxVQUFVLEdBQUcsQ0FBQyxDQUFDLHFCQUFxQixDQUFHLEdBQUcsQ0FBRSxDQUFBO1lBQ2pELElBQUksQ0FBQyxTQUFTLEdBQUksSUFBSSxDQUFDLEtBQUssQ0FBRyxRQUFRLENBQUUsQ0FBQTtTQUM3QztRQUVPLFlBQVk7Ozs7U0FLbkI7UUFFRCxJQUFJLENBQUcsQ0FBUyxFQUFFLENBQVM7WUFFdEIsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQTtZQUN4QixNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUE7WUFFeEMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDLEdBQUcsTUFBTSxJQUFJLElBQUksQ0FBQTtZQUNsQyxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsR0FBSSxDQUFDLENBQUMsR0FBRyxNQUFNLElBQUksSUFBSSxDQUFBO1lBQ2xDLENBQUMsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFHLE9BQU8sQ0FBRSxDQUFBO1lBQzlCLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBRyxXQUFXLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUUsSUFBSSxDQUFDLEVBQUUsSUFBSSxDQUFFLENBQUE7U0FDeEU7UUFFRCxJQUFJO1lBRUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFFLE9BQU8sQ0FBQyxDQUFBO1lBQ3RDLFFBQVEsQ0FBQyxtQkFBbUIsQ0FBRyxXQUFXLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBRSxDQUFBO1NBQzNEO1FBRUQsS0FBSyxDQUFHLEtBQWE7WUFFaEIsTUFBTSxFQUFFLFVBQVUsRUFBRSxHQUFHLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxHQUFHLElBQUksQ0FBQTtZQUVqRCxNQUFNLEdBQUcsR0FDSixlQUNLLEtBQUssRUFBSSxtQkFBbUIsRUFDNUIsS0FBSyxFQUFNLEdBQUcsQ0FBQyxLQUFLLEdBQUcsSUFBSSxFQUMzQixNQUFNLEVBQUssR0FBRyxDQUFDLE1BQU0sR0FBRyxJQUFJLEVBQzVCLE9BQU8sRUFBSSxPQUFRLEdBQUcsQ0FBQyxLQUFNLElBQUssR0FBRyxDQUFDLE1BQU8sRUFBRSxHQUNqQyxDQUFBO1lBRXhCLE1BQU0sT0FBTyxHQUFHLEtBQUssSUFBSSxTQUFTO2tCQUNqQixTQUFTLENBQUUsS0FBSyxDQUFDLENBQUcsR0FBRyxDQUFFO2tCQUN6QixJQUFJLENBQUMsZ0JBQWdCLENBQUcsR0FBRyxDQUFFLENBQUE7WUFFOUMsR0FBRyxDQUFDLE1BQU0sQ0FBRyxHQUFJLE9BQWtCLENBQUUsQ0FBQTtZQUVyQyxLQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRyxDQUFDLElBQUksT0FBTyxDQUFDLE1BQU0sRUFBRyxDQUFDLEVBQUUsRUFDM0M7Z0JBQ0ssTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBRSxDQUFDLENBQUMsQ0FBQTtnQkFFNUIsSUFBSyxPQUFPLEdBQUcsQ0FBQyxRQUFRLElBQUksVUFBVTtvQkFDakMsT0FBTyxDQUFFLENBQUMsQ0FBQyxDQUFDLGdCQUFnQixDQUFHLFdBQVcsRUFBRSxNQUFNLEdBQUcsQ0FBQyxRQUFRLEVBQUcsQ0FBRSxDQUFBO2FBQzVFO1lBRUQsT0FBTyxHQUFHLENBQUE7U0FDZDtRQUVELGdCQUFnQixDQUFHLFVBQTRCO1lBRTFDLE1BQU0sTUFBTSxHQUFJLFVBQVUsQ0FBQyxNQUFNLENBQUE7WUFDakMsTUFBTSxPQUFPLEdBQUcsVUFBVSxDQUFDLE9BQU8sQ0FBQTtZQUNsQyxNQUFNLE9BQU8sR0FBRyxFQUFtQixDQUFBO1lBRW5DLEtBQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxNQUFNLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxFQUN2QztnQkFDSyxNQUFNLEdBQUcsR0FBRyxNQUFNLENBQUUsQ0FBQyxDQUFDLENBQUE7Z0JBQ3RCLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFFLENBQUMsQ0FBQyxDQUFBO2dCQUVqQyxNQUFNLEtBQUssR0FBRyxhQUFHLEtBQUssRUFBQyxRQUFRLEdBQUcsQ0FBQTtnQkFFbEMsTUFBTSxNQUFNLEdBQUdDLGNBQWtCLENBQUcsUUFBUSxFQUFFO29CQUN6QyxJQUFJLEVBQUUsR0FBRyxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsT0FBTyxHQUFHLENBQUM7b0JBQ3BDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztvQkFDUixDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7aUJBQ1osQ0FBQyxDQUFBO2dCQUVGLE1BQU0sSUFBSSxHQUFHLGdCQUNSLENBQUMsRUFBSyxHQUFHLENBQUMsQ0FBQyxFQUNYLENBQUMsRUFBSyxHQUFHLENBQUMsQ0FBQyxlQUNELElBQUksRUFDZCxJQUFJLEVBQUMsT0FBTyxFQUNaLEtBQUssRUFBQyxzRkFBc0YsR0FDL0YsQ0FBQTtnQkFFRixJQUFLLEdBQUcsQ0FBQyxVQUFVLElBQUksU0FBUztvQkFDM0IsSUFBSSxDQUFDLFlBQVksQ0FBRyxhQUFhLEVBQUUsR0FBRyxDQUFDLFVBQVUsQ0FBRSxDQUFBO2dCQUV4RCxJQUFJLENBQUMsU0FBUyxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUE7Z0JBRXpCLEtBQUssQ0FBQyxNQUFNLENBQUcsTUFBTSxDQUFFLENBQUE7Z0JBQ3ZCLEtBQUssQ0FBQyxNQUFNLENBQUcsSUFBSSxDQUFFLENBQUE7Z0JBRXJCLE9BQU8sQ0FBQyxJQUFJLENBQUcsS0FBbUIsQ0FBRSxDQUFBO2FBQ3hDO1lBRUQsT0FBTyxPQUFPLENBQUE7U0FDbEI7S0FDTDs7VUM1SVksYUFBYyxTQUFRLFNBQXlCO1FBRXZELE9BQU8sQ0FBRyxNQUFlO1lBRXBCLE1BQU0sSUFBSSxHQUFHLGVBQUssS0FBSyxFQUFDLHVCQUF1QjtnQkFDMUMsZUFBSyxHQUFHLEVBQUcsTUFBTSxDQUFDLE1BQU0sRUFBRyxHQUFHLEVBQUMsUUFBUSxHQUFFO2dCQUN6QyxlQUFLLEtBQUssRUFBQyxjQUFjO29CQUNwQjt3QkFDSyxpQkFBSyxNQUFNLENBQUMsU0FBUyxDQUFNLENBQzNCO29CQUNMO3dCQUNLLGlCQUFLLE1BQU0sQ0FBQyxTQUFTLEdBQUcsUUFBUSxHQUFHLElBQUksQ0FBTSxDQUMxQyxDQUNQLENBQ0wsQ0FBQTtZQUdOLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxHQUFHLEVBQUUsQ0FBQTtZQUM3QixJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBRyxJQUFJLENBQUUsQ0FBQTtTQUNsQztLQUNMO0lBRUQsTUFBTSxDQUFHLGFBQWEsRUFBRTtRQUNuQixPQUFPLEVBQUUsWUFBWTtRQUNyQixJQUFJLEVBQUssZUFBZTtRQUN4QixFQUFFLEVBQU8sU0FBUztLQUN0QixDQUFDLENBQUE7O0lDdkNGO0FBRUEsSUFHQSxNQUFNQyxTQUFPLEdBQUcsY0FBYyxDQUFBO0lBQzlCLE1BQU0sSUFBSSxHQUFHLElBQUksUUFBUSxFQUFHLENBQUE7SUFJNUIsU0FBU0MsV0FBUyxDQUFHLElBQVM7UUFFekIsSUFBSyxTQUFTLElBQUksSUFBSSxFQUN0QjtZQUNLLElBQUssSUFBSSxDQUFDLE9BQU8sS0FBS0QsU0FBTztnQkFDeEIsTUFBTSxtQkFBbUIsQ0FBQTtTQUNsQzthQUVEO1lBQ00sSUFBeUIsQ0FBQyxPQUFPLEdBQUdBLFNBQU8sQ0FBQTtTQUNoRDtRQUVELE9BQU8sSUFBYSxDQUFBO0lBQ3pCLENBQUM7QUFNRCxhQUFnQixPQUFPO1FBRWxCLElBQUssU0FBUyxDQUFDLE1BQU0sSUFBSSxDQUFDO1lBQ3JCLE9BQU07UUFFWCxJQUFLLFNBQVMsQ0FBQyxNQUFNLElBQUksQ0FBQztZQUNyQixPQUFPLElBQUksQ0FBQyxHQUFHLENBQUdDLFdBQVMsQ0FBRyxTQUFTLENBQUUsQ0FBQyxDQUFDLENBQUUsQ0FBRSxDQUFBOztZQUUvQyxPQUFPLElBQUksQ0FBQyxHQUFHLENBQUdELFNBQU8sRUFBRSxHQUFJLFNBQVMsQ0FBRSxDQUFBO0lBQ3BELENBQUM7QUFFRCxhQUFnQixPQUFPLENBQXNCLElBQWE7UUFFckQsSUFBSSxDQUFDLEdBQUcsQ0FBR0MsV0FBUyxDQUFHLElBQUksQ0FBRSxDQUFFLENBQUE7SUFDcEMsQ0FBQzs7VUMvQlksV0FBWSxTQUFRLFNBQXdCO1FBRXBELE9BQU8sQ0FBRyxLQUFhO1lBRWxCLE1BQU0sTUFBTSxHQUFHLGVBQUssS0FBSyxFQUFDLFFBQVEsR0FBTyxDQUFBO1lBRXpDLEtBQU0sTUFBTSxJQUFJLElBQUksS0FBSyxDQUFDLEtBQUssRUFDL0I7Z0JBQ0ssTUFBTSxNQUFNLEdBQUdDLE9BQVUsQ0FBYSxJQUFJLENBQUUsQ0FBQTtnQkFFNUMsTUFBTSxJQUFJLEdBQUcsZUFBSyxLQUFLLEVBQUMsdUJBQXVCO29CQUMxQyxlQUFLLEdBQUcsRUFBRyxNQUFNLENBQUMsTUFBTSxFQUFHLEdBQUcsRUFBQyxRQUFRLEdBQUU7b0JBQ3pDLGVBQUssS0FBSyxFQUFDLGNBQWM7d0JBQ3BCOzRCQUNLLGlCQUFLLE1BQU0sQ0FBQyxTQUFTLENBQU0sQ0FDM0I7d0JBQ0w7NEJBQ0ssaUJBQUssTUFBTSxDQUFDLFNBQVMsR0FBRyxRQUFRLEdBQUcsSUFBSSxDQUFNLENBQzFDLENBQ1AsQ0FDTCxDQUFBO2dCQUVOLE1BQU0sQ0FBQyxNQUFNLENBQUcsSUFBSSxDQUFFLENBQUE7YUFDMUI7WUFFRCxJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUcsV0FBVyxDQUFFLENBQUE7WUFDNUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLEdBQUcsRUFBRSxDQUFBO1lBQzdCLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFHLGtCQUFNLEtBQUssQ0FBQyxFQUFFLENBQU8sQ0FBRSxDQUFBO1lBQy9DLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFHLGlCQUFLLEtBQUssQ0FBQyxXQUFXLENBQU0sQ0FBRSxDQUFBO1lBQ3RELElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFHLE1BQU0sQ0FBRSxDQUFBOztZQUdoQyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBRyxtQkFBTyxJQUFJLENBQUMsU0FBUyxDQUFHLEtBQUssRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFFLENBQVEsQ0FBRSxDQUFBO1NBQzlFO0tBQ0w7SUFFRCxNQUFNLENBQUcsV0FBVyxFQUFFO1FBQ2pCLE9BQU8sRUFBRSxZQUFZO1FBQ3JCLElBQUksRUFBSyxjQUFjO1FBQ3ZCLEVBQUUsRUFBTyxTQUFTO0tBQ3RCLENBQUMsQ0FBQTs7SUNuREY7SUFjQSxNQUFNLG1CQUFtQixHQUEwQjtRQUM5QyxJQUFJLEVBQUssQ0FBQztRQUNWLEdBQUcsRUFBTSxDQUFDO1FBQ1YsT0FBTyxFQUFFLFFBQVE7UUFDakIsT0FBTyxFQUFFLFFBQVE7S0FDckIsQ0FBQTtBQUVELElBQU8sTUFBTUMsU0FBTyxHQUNwQjtRQUNLLEtBQUssQ0FBRyxHQUFjLEVBQUUsSUFBWSxFQUFFLEdBQTBCO1lBRTNELE9BQU8sSUFBSSxNQUFNLENBQUMsS0FBSyxDQUFHLFNBQVMsZ0RBRTFCLG1CQUFtQixHQUNuQixHQUFHLEtBQ1AsS0FBSyxFQUFFLElBQUksRUFDWCxNQUFNLEVBQUUsSUFBSSxJQUNmLENBQUE7U0FDTjs7Ozs7O1FBUUQsTUFBTSxDQUFHLEdBQWMsRUFBRSxJQUFZLEVBQUUsR0FBMEI7WUFHNUQsT0FBTyxJQUFJLE1BQU0sQ0FBQyxNQUFNLCtDQUVmLG1CQUFtQixHQUNuQixHQUFHLEtBQ1AsTUFBTSxFQUFFLElBQUksR0FBRyxDQUFDLElBQ25CLENBQUE7U0FDTjtRQUVELFFBQVEsQ0FBRyxHQUFjLEVBQUUsSUFBWSxFQUFFLEdBQTRCO1lBRWhFLE1BQU0sTUFBTSxHQUFHLEVBQUUsQ0FBQTtZQUNqQixNQUFNLEtBQUssR0FBRyxHQUFHLENBQUE7WUFDakIsTUFBTSxDQUFDLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxLQUFLLENBQUE7WUFFMUIsS0FBTSxNQUFNLENBQUMsSUFBSTtnQkFDWixDQUFFLENBQUMsRUFBRSxDQUFDLENBQUU7Z0JBQ1IsQ0FBRSxrQkFBa0IsRUFBRSxDQUFDLGtCQUFrQixDQUFFO2dCQUMzQyxDQUFFLENBQUMsa0JBQWtCLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBRTthQUNoRDtnQkFBRSxNQUFNLENBQUMsSUFBSSxDQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFBO1lBRTdDLE9BQU8sSUFBSSxNQUFNLENBQUMsT0FBTyxDQUFHLE1BQU0sZ0RBQ3pCLG1CQUFtQixHQUNuQixHQUFHLEtBQ1AsS0FBSyxFQUFFLEdBQUcsSUFDYixDQUFBO1NBQ047UUFHRCxNQUFNLENBQUcsR0FBYyxFQUFFLElBQVksRUFBRSxHQUF3QjtZQUUxRCxNQUFNLEtBQUssR0FBRyxHQUFHLENBQUE7WUFDakIsT0FBTyxJQUFJLE1BQU0sQ0FBQyxJQUFJLCtDQUViLG1CQUFtQixHQUNuQixHQUFHLEtBQ1AsS0FBSyxFQUFHLElBQUksR0FBRyxLQUFLLEVBQ3BCLE1BQU0sRUFBRSxJQUFJLEdBQUcsS0FBSyxJQUN2QixDQUFBO1NBQ047UUFFRCxRQUFRLENBQUcsR0FBYyxFQUFFLElBQVksRUFBRSxHQUEwQjtZQUU5RCxNQUFNLE1BQU0sR0FBRyxFQUFFLENBQUE7WUFDakIsTUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFBO1lBQ2pCLE1BQU0sQ0FBQyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsS0FBSyxDQUFBO1lBRTFCLEtBQU0sTUFBTSxDQUFDLElBQUk7Z0JBQ1osQ0FBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFO2dCQUNSLENBQUUsa0JBQWtCLEVBQUUsbUJBQW1CLENBQUU7Z0JBQzNDLENBQUUsa0JBQWtCLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBRTtnQkFDM0MsQ0FBRSxDQUFDLGlCQUFpQixFQUFFLENBQUMsa0JBQWtCLENBQUU7Z0JBQzNDLENBQUUsQ0FBQyxrQkFBa0IsRUFBRSxtQkFBbUIsQ0FBRTthQUNoRDtnQkFBRSxNQUFNLENBQUMsSUFBSSxDQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFBO1lBRTdDLE9BQU8sSUFBSSxNQUFNLENBQUMsT0FBTyxDQUFHLE1BQU0sZ0RBQ3pCLG1CQUFtQixHQUNuQixHQUFHLEtBQ1AsS0FBSyxFQUFFLEdBQUcsSUFDYixDQUFBO1NBQ047UUFFRCxPQUFPLENBQUcsR0FBYyxFQUFFLElBQVksRUFBRSxHQUEwQjtZQUU3RCxNQUFNLE1BQU0sR0FBRyxFQUFFLENBQUE7WUFDakIsTUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFBO1lBQ2pCLE1BQU0sQ0FBQyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsS0FBSyxDQUFBO1lBRTFCLEtBQU0sTUFBTSxDQUFDLElBQUk7Z0JBQ1osQ0FBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFO2dCQUNSLENBQUUsa0JBQWtCLEVBQUUsa0JBQWtCLENBQUU7Z0JBQzFDLENBQUUsa0JBQWtCLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBRTtnQkFDM0MsQ0FBRSxzQkFBc0IsRUFBRSxDQUFDLENBQUMsQ0FBRTtnQkFDOUIsQ0FBRSxDQUFDLGtCQUFrQixFQUFFLENBQUMsa0JBQWtCLENBQUU7Z0JBQzVDLENBQUUsQ0FBQyxpQkFBaUIsRUFBRSxtQkFBbUIsQ0FBRTthQUMvQztnQkFBRSxNQUFNLENBQUMsSUFBSSxDQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFBO1lBRTdDLE9BQU8sSUFBSSxNQUFNLENBQUMsT0FBTyxDQUFHLE1BQU0sZ0RBQ3pCLG1CQUFtQixHQUNuQixHQUFHLEtBQ1AsS0FBSyxFQUFFLEVBQUUsSUFDWixDQUFBO1NBQ047UUFHRCxJQUFJLENBQUcsR0FBbUIsRUFBRSxJQUFZLEVBQUUsR0FBdUI7WUFFNUQsT0FBTyxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUcsS0FBSyxnREFDckIsbUJBQW1CLEdBQ25CLEdBQUcsS0FDUCxRQUFRLEVBQUUsSUFBSSxJQUNqQixDQUFBO1NBQ047UUFFRCxPQUFPLENBQUcsR0FBbUIsRUFBRSxJQUFZLEVBQUUsR0FBdUI7WUFFL0QsT0FBTyxJQUFJLE1BQU0sQ0FBQyxPQUFPLENBQUcsS0FBSyxnREFDeEIsbUJBQW1CLEdBQ25CLEdBQUcsS0FDUCxRQUFRLEVBQUUsSUFBSSxJQUNqQixDQUFBO1NBQ047UUFHRCxJQUFJLENBQUcsR0FBbUIsRUFBRSxJQUFZLEVBQUUsR0FBMEI7WUFFL0QsT0FBTyxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUcsR0FBRyxDQUFDLElBQUksZ0RBRXhCLG1CQUFtQixHQUNuQixHQUFHLEtBQ1AsTUFBTSxFQUFFLElBQUksR0FBRyxHQUFHLEVBQ2xCLE1BQU0sRUFBRSxJQUFJLEdBQUcsR0FBRyxJQUNyQixDQUFBO1NBQ047S0FDTCxDQUFBOztJQzVKRDtBQUdBLFVBa0JhQyxVQUFRO1FBS2hCLFlBQXVCLEtBQVk7WUFBWixVQUFLLEdBQUwsS0FBSyxDQUFPO1lBRTlCLElBQUksQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQTtZQUMxQixJQUFJLENBQUMsV0FBVyxFQUFHLENBQUE7U0FDdkI7UUFFRCxNQUFNLENBQUcsT0FBNEI7WUFFaEMsTUFBTSxDQUFDLE1BQU0sQ0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLE9BQU8sQ0FBRSxDQUFBO1lBRXRDLElBQUssT0FBTyxJQUFJLE9BQU8sRUFDdkI7Z0JBQ0ssSUFBSSxDQUFDLFdBQVcsRUFBRyxDQUFBO2FBQ3ZCO2lCQUNJLElBQUssaUJBQWlCLElBQUksT0FBTyxJQUFJLGtCQUFrQixJQUFJLE9BQU8sRUFDdkU7Z0JBQ0ssSUFBSSxDQUFDLHFCQUFxQixFQUFHLENBQUE7YUFDakM7U0FDTDtRQUVELGNBQWM7WUFFVCxNQUFNLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxHQUFHLElBQUksQ0FFOUI7WUFBQyxNQUF3QixDQUFDLEdBQUcsQ0FBRTtnQkFDM0IsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDO2dCQUNkLEdBQUcsRUFBRyxNQUFNLENBQUMsQ0FBQzthQUNsQixDQUFDO2lCQUNELFNBQVMsRUFBRyxDQUFBO1NBQ2pCO1FBRUQsVUFBVTtZQUVMLE1BQU0sRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxHQUFHLElBQUksQ0FBQTtZQUV0QyxNQUFNLElBQUksR0FBRyxLQUFLLENBQUMsV0FBVyxFQUFHLENBQUE7WUFFakMsSUFBSyxNQUFNLENBQUMsS0FBSyxJQUFJLFFBQVEsRUFDN0I7Z0JBQ00sTUFBd0IsQ0FBQyxHQUFHLENBQUU7b0JBQzFCLE1BQU0sRUFBRSxJQUFJLEdBQUcsQ0FBQztpQkFDcEIsQ0FBQyxDQUFBO2FBQ047aUJBRUQ7Z0JBQ00sTUFBd0IsQ0FBQyxHQUFHLENBQUU7b0JBQzFCLEtBQUssRUFBRyxJQUFJO29CQUNaLE1BQU0sRUFBRSxJQUFJO2lCQUNoQixDQUFDLENBQUE7YUFDTjtZQUVELE1BQU0sQ0FBQyxTQUFTLEVBQUcsQ0FBQTtTQUN2QjtRQUVELFdBQVcsQ0FBRyxLQUFxQjtZQUU5QixNQUFNLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxHQUFHLElBQUksQ0FBQTtZQUU5QixJQUFLLFNBQVMsQ0FBQyxNQUFNLElBQUksQ0FBQztnQkFDckIsS0FBSyxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUE7O2dCQUVwQixNQUFNLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQTtZQUV6QixJQUFLLEtBQUssQ0FBQyxLQUFLLElBQUksU0FBUyxJQUFJLElBQUksQ0FBQyxNQUFNLElBQUksU0FBUztnQkFDcEQsS0FBSyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFBO1lBRXZDLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxNQUFNO2tCQUNYRCxTQUFPLENBQUUsTUFBTSxDQUFDLEtBQVksQ0FBQyxDQUFHLE1BQU0sRUFBRSxLQUFLLENBQUMsV0FBVyxFQUFHLEVBQUU7b0JBQzNELElBQUksRUFBUyxDQUFDO29CQUNkLEdBQUcsRUFBVSxDQUFDO29CQUNkLE9BQU8sRUFBTSxRQUFRO29CQUNyQixPQUFPLEVBQU0sUUFBUTtvQkFDckIsSUFBSSxFQUFTLE1BQU0sQ0FBQyxlQUFlO29CQUNuQyxNQUFNLEVBQU8sTUFBTSxDQUFDLFdBQVc7b0JBQy9CLFdBQVcsRUFBRSxNQUFNLENBQUMsV0FBVztpQkFDbkMsQ0FBQyxDQUFBO1lBRVosS0FBSyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUcsR0FBRyxDQUFFLENBQUE7WUFDdkIsR0FBRyxDQUFDLFVBQVUsRUFBRyxDQUFBO1lBRWpCLElBQUssTUFBTSxDQUFDLGVBQWUsSUFBSSxTQUFTO2dCQUNuQyxJQUFJLENBQUMscUJBQXFCLEVBQUcsQ0FBQTtZQUVsQyxJQUFLLEdBQUcsQ0FBQyxNQUFNLElBQUksU0FBUztnQkFDdkIsR0FBRyxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsRUFBRyxDQUFBO1NBRXZDO1FBRUQscUJBQXFCLENBQUcsSUFBYTtZQUVoQyxJQUFLLFNBQVMsQ0FBQyxNQUFNLElBQUksQ0FBQztnQkFDckIsSUFBSSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsZUFBZSxDQUFBOztnQkFFbEMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFBO1lBRXZDLElBQUssT0FBTyxJQUFJLElBQUksUUFBUSxJQUFJLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQztnQkFDMUMsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUcsSUFBSSxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFFLElBQUksQ0FBQyxDQUFFLENBQUE7U0FDcEU7UUFFTyxVQUFVLENBQUcsSUFBc0I7WUFFdEMsTUFBTSxFQUFFLEtBQUssRUFBRSxHQUFHLElBQUksQ0FBQTtZQUV0QixNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxNQUFNO2tCQUN0QixLQUFLLENBQUMsV0FBVyxFQUFHLEdBQUcsSUFBSSxDQUFDLEtBQUs7a0JBQ2pDLEtBQUssQ0FBQyxXQUFXLEVBQUcsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUVsRDtZQUFDLElBQUksQ0FBQyxNQUFjLENBQUMsR0FBRyxDQUFFO2dCQUN0QixJQUFJLEVBQUUsSUFBSSxNQUFNLENBQUMsT0FBTyxDQUFFO29CQUNyQixNQUFNLEVBQUUsSUFBSTtvQkFDWixNQUFNLEVBQUUsV0FBVztvQkFDbkIsZ0JBQWdCLEVBQUU7d0JBQ2IsTUFBTSxFQUFFLENBQUMsRUFBRSxDQUFDO3dCQUNaLE1BQU0sRUFBRSxDQUFDLEVBQUUsQ0FBQztxQkFDaEI7aUJBQ0wsQ0FBQzthQUNOLENBQUM7aUJBQ0QsU0FBUyxFQUFHLENBQUE7WUFFYixJQUFLLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTTtnQkFDbEIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFHLENBQUE7U0FDeEM7S0FDTDs7SUNySkQ7QUFDQSxVQTRCYSxLQUFLO1FBcUNiLFlBQWMsSUFBTztZQUxyQixVQUFLLEdBQUcsU0FBeUIsQ0FBQTs7WUFRNUIsSUFBSSxDQUFDLFVBQVUsR0FBRyxTQUFTLENBQUE7WUFDM0IsSUFBSSxDQUFDLE1BQU0sR0FBRyxTQUFTLENBQUE7WUFDdkIsSUFBSSxDQUFDLE1BQU0sbUNBQ0YsSUFBSSxDQUFDLGFBQWEsRUFBRyxHQUNyQixJQUFJLENBQ1osQ0FBQTs7Ozs7WUFPRCxNQUFNLEVBQUUsTUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFBO1lBRXZCLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxNQUFNLENBQUMsS0FBSyxDQUFHLEVBQUUsRUFDaEQ7Z0JBQ0ssS0FBSyxFQUFRLElBQUksQ0FBQyxXQUFXLEVBQUc7Z0JBQ2hDLE1BQU0sRUFBTyxJQUFJLENBQUMsV0FBVyxFQUFHO2dCQUNoQyxJQUFJLEVBQVMsTUFBTSxDQUFDLENBQUM7Z0JBQ3JCLEdBQUcsRUFBVSxNQUFNLENBQUMsQ0FBQztnQkFDckIsVUFBVSxFQUFHLElBQUk7Z0JBQ2pCLFdBQVcsRUFBRSxJQUFJO2dCQUNqQixPQUFPLEVBQU0sUUFBUTtnQkFDckIsT0FBTyxFQUFNLFFBQVE7YUFDekIsQ0FBQyxDQUVEO1lBQUMsSUFBSSxDQUFDLFVBQXVCLEdBQUcsSUFBSUMsVUFBUSxDQUFHLElBQUksQ0FBRSxDQUFBOzs7OztZQU90RCxLQUFLLENBQUMsU0FBUyxFQUFHLENBQUE7U0FDdEI7UUF4RUQsYUFBYTtZQUVSLE9BQU87Z0JBQ0YsT0FBTyxFQUFFLGdCQUFnQjtnQkFDekIsSUFBSSxFQUFLLE9BQU87Z0JBQ2hCLEVBQUUsRUFBTyxTQUFTO2dCQUNsQixJQUFJLEVBQUssU0FBUztnQkFDbEIsQ0FBQyxFQUFRLENBQUM7Z0JBQ1YsQ0FBQyxFQUFRLENBQUM7O2dCQUVWLE9BQU8sRUFBSyxDQUFDO2dCQUNiLFVBQVUsRUFBRSxDQUFDO2dCQUNiLFVBQVUsRUFBRSxDQUFDO2dCQUViLEtBQUssRUFBYSxRQUFRO2dCQUMxQixXQUFXLEVBQU8sTUFBTTtnQkFDeEIsV0FBVyxFQUFPLENBQUM7Z0JBRW5CLGVBQWUsRUFBRyxhQUFhO2dCQUMvQixlQUFlLEVBQUcsU0FBUztnQkFDM0IsZ0JBQWdCLEVBQUUsS0FBSztnQkFFdkIsUUFBUSxFQUFVLFNBQVM7Z0JBQzNCLFFBQVEsRUFBVSxTQUFTO2dCQUMzQixPQUFPLEVBQVcsU0FBUzthQUMvQixDQUFBO1NBQ0w7UUFnREQsV0FBVztZQUVOLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUE7WUFFMUIsSUFBSSxJQUFJLEdBQUcsQ0FBQyxDQUFDLEdBQUcsTUFBTSxDQUFDLFVBQVUsSUFBSSxNQUFNLENBQUMsVUFBVSxDQUFBO1lBRXRELElBQUssSUFBSSxHQUFHLE1BQU0sQ0FBQyxPQUFPO2dCQUNyQixJQUFJLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQTtZQUUxQixPQUFPLElBQUksSUFBSSxDQUFDLENBQUE7U0FDcEI7UUFFRCxVQUFVO1lBRUwsTUFBTSxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsR0FBRyxJQUFJLENBQUE7WUFFOUIsSUFBSyxJQUFJLENBQUMsVUFBVTtnQkFDZixJQUFJLENBQUMsVUFBVSxDQUFDLFVBQVUsRUFBRyxDQUFBO1lBRWxDLElBQUssSUFBSSxDQUFDLE1BQU07Z0JBQ1gsSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFVLEVBQUcsQ0FBQTtZQUU5QixLQUFLLENBQUMsR0FBRyxDQUFFO2dCQUNOLEtBQUssRUFBRyxJQUFJLENBQUMsV0FBVyxFQUFHO2dCQUMzQixNQUFNLEVBQUUsSUFBSSxDQUFDLFdBQVcsRUFBRzthQUMvQixDQUFDLENBQUE7WUFFRixJQUFLLEtBQUssQ0FBQyxNQUFNO2dCQUNaLEtBQUssQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLEVBQUcsQ0FBQTtTQUN6QztRQUVELE1BQU07WUFFRCxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxFQUFHLENBQUE7U0FDbEM7UUFFRCxhQUFhLENBQUcsT0FBNEI7WUFFdkMsTUFBTSxDQUFDLE1BQU0sQ0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLE9BQU8sQ0FBRSxDQUFBO1lBRXRDLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFHLE9BQU8sQ0FBRSxDQUFBO1lBRWxDLElBQUksQ0FBQyxVQUFVLEVBQUcsQ0FBQTtTQUN0QjtRQUVELFdBQVcsQ0FBRyxDQUFTLEVBQUUsQ0FBUztZQUU3QixNQUFNLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxHQUFHLElBQUksQ0FBQTtZQUU5QixNQUFNLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQTtZQUNaLE1BQU0sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFBO1lBRVosS0FBSyxDQUFDLEdBQUcsQ0FBRTtnQkFDTixJQUFJLEVBQUUsQ0FBQztnQkFDUCxHQUFHLEVBQUcsQ0FBQzthQUNYLENBQUM7aUJBQ0QsU0FBUyxFQUFHLENBQUE7WUFFYixJQUFLLEtBQUssQ0FBQyxNQUFNO2dCQUNaLEtBQUssQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLEVBQUcsQ0FBQTtTQUN6QztRQUdELEtBQUssQ0FBRyxFQUFXO1lBRWQsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLFVBQVUsSUFBSSxTQUFTO2tCQUMxQixJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU07a0JBQ3RCLElBQUksQ0FBQyxLQUFLLENBQUE7WUFFM0IsTUFBTSxDQUFDLFNBQVMsQ0FBRSxpQkFBaUIsQ0FBRSxDQUFBO1lBRXJDLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDO2dCQUNmLFVBQVUsRUFBRSxFQUFFLEdBQUcsQ0FBQyxHQUFHLENBQUM7Z0JBQ3RCLFFBQVEsRUFBSSxFQUFFLEdBQUcsQ0FBQyxHQUFHLENBQUM7Z0JBQ3RCLE1BQU0sRUFBTSxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZO2dCQUN6QyxPQUFPLEVBQUssU0FBUztnQkFDckIsUUFBUSxFQUFJLEdBQUc7Z0JBQ2YsUUFBUSxFQUFJLENBQUUsS0FBYTtvQkFFdEIsTUFBTSxNQUFNLEdBQUcsQ0FBQyxHQUFHLEtBQUssQ0FBQTtvQkFFeEIsTUFBTSxDQUFDLFNBQVMsQ0FBRSxHQUFJLE1BQU8sTUFBTyxNQUFPLE1BQU8sRUFBRSxHQUFHLEtBQU0sb0JBQW9CLENBQUUsQ0FBQTtvQkFDbkYsTUFBTSxDQUFDLEtBQUssQ0FBRSxDQUFDLEdBQUcsR0FBRyxHQUFHLEtBQUssQ0FBRSxDQUFBO29CQUMvQixNQUFNLENBQUMsTUFBTSxDQUFDLGdCQUFnQixFQUFHLENBQUE7aUJBQ3JDO2FBQ0wsQ0FBQyxDQUFBO1NBQ047UUFFRCxNQUFNO1lBRUQsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFHLElBQUksQ0FBQyxNQUFNLENBQUUsQ0FBQTtTQUN6QztLQUNMOztJQ3JNRDtBQUNBLElBT0EsTUFBTUosU0FBTyxHQUFHLGdCQUFnQixDQUFBO0lBQ2hDLE1BQU1LLElBQUUsR0FBUSxJQUFJLFFBQVEsRUFBRyxDQUFBO0lBQy9CLE1BQU1DLFNBQU8sR0FBRyxJQUFJLE9BQU8sQ0FBV0QsSUFBRSxDQUFFLENBQUE7SUFDMUMsTUFBTSxNQUFNLEdBQUksTUFBTSxDQUFDLEdBQUcsQ0FBRyxRQUFRLENBQUUsQ0FBQTtJQWF2QyxTQUFTSixXQUFTLENBQUcsSUFBUztRQUV6QixJQUFLLFNBQVMsSUFBSSxJQUFJLEVBQ3RCO1lBQ0ssSUFBSyxJQUFJLENBQUMsT0FBTyxLQUFLRCxTQUFPO2dCQUN4QixNQUFNLG1CQUFtQixDQUFBO1NBQ2xDO2FBRUQ7WUFDTSxJQUEwQixDQUFDLE9BQU8sR0FBR0EsU0FBTyxDQUFBO1NBQ2pEO1FBRUQsT0FBTyxJQUFjLENBQUE7SUFDMUIsQ0FBQztBQUdELGFBQWdCLFNBQVMsQ0FBcUIsR0FBa0M7UUFFM0UsSUFBSyxHQUFHLElBQUksU0FBUztZQUNoQixPQUFPLFNBQVMsQ0FBQTtRQUVyQixJQUFLLEdBQUcsWUFBWSxLQUFLO1lBQ3BCLE9BQU8sR0FBUSxDQUFBO1FBRXBCLElBQUssR0FBRyxZQUFZLE1BQU0sQ0FBQyxNQUFNO1lBQzVCLE9BQU8sR0FBRyxDQUFFLE1BQU0sQ0FBQyxDQUFBO1FBRXhCLElBQUtNLFNBQU8sQ0FBQyxPQUFPLENBQUdOLFNBQU8sRUFBRSxHQUFHLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxFQUFFLENBQUU7WUFDN0MsT0FBT00sU0FBTyxDQUFDLElBQUksQ0FBR04sU0FBTyxFQUFFLEdBQUcsQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLEVBQUUsQ0FBRSxDQUFBO1FBRXRELE1BQU0sT0FBTyxHQUFJLEdBQUcsQ0FBQyxPQUFPLElBQUlBLFNBQU87Y0FDdEIsR0FBYTtjQUNiO2dCQUNHLE9BQU8sRUFBRUEsU0FBTztnQkFDaEIsSUFBSSxFQUFLLEdBQUcsQ0FBQyxJQUFJO2dCQUNqQixFQUFFLEVBQU8sR0FBRyxDQUFDLEVBQUU7Z0JBQ2YsSUFBSSxFQUFLLEdBQUc7YUFDTixDQUFBO1FBRTFCLElBQUssQ0FBRSxRQUFRLENBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQztZQUN0QixPQUFPLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQTtRQUVsQixJQUFLLENBQUUsUUFBUSxDQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFDdEIsT0FBTyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUE7UUFFbEIsTUFBTSxLQUFLLEdBQUdNLFNBQU8sQ0FBQyxJQUFJLENBQUcsT0FBTyxDQUFFLENBQUE7Ozs7UUFNdEMsS0FBSyxDQUFDLEtBQUssQ0FBRSxNQUFNLENBQUMsR0FBRyxLQUFLLENBQUE7UUFFNUIsSUFBSyxLQUFLLENBQUMsTUFBTSxDQUFDLFFBQVE7WUFDckIsS0FBSyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFFLENBQUE7UUFFdkQsT0FBTyxLQUFVLENBQUE7SUFDdEIsQ0FBQztBQUdELGFBQWdCLFNBQVMsQ0FBc0IsSUFBYTtRQUV2REQsSUFBRSxDQUFDLEdBQUcsQ0FBR0osV0FBUyxDQUFHLElBQUksQ0FBRSxDQUFFLENBQUE7SUFDbEMsQ0FBQztBQUdELGFBQWdCLFlBQVksQ0FBRyxJQUFtQyxFQUFFLElBQVk7UUFFM0VLLFNBQU8sQ0FBQyxPQUFPLENBQUcsSUFBSSxFQUFFLENBQUNOLFNBQU8sRUFBRSxJQUFJLENBQUMsQ0FBRSxDQUFBO0lBQzlDLENBQUM7O1VDdEZZLEtBQU0sU0FBUSxLQUFLO1FBTTNCLFlBQWMsT0FBZTtZQUV4QixLQUFLLENBQUcsT0FBTyxDQUFFLENBQUE7WUFOYixVQUFLLEdBQUcsU0FBa0IsQ0FBQTtZQUUxQixhQUFRLEdBQUcsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLE1BQU0sRUFBRSxDQUFDLEVBQUUsQ0FBQTs7Ozs7WUFVdEMsTUFBTSxFQUFFLEtBQUssRUFBRSxHQUFHLElBQUksQ0FBQTtZQUV0QixNQUFNLE1BQU0sR0FBR0UsT0FBVSxDQUFZLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFFLENBQUE7WUFFdkQsTUFBTSxJQUFJLEdBQUcsSUFBSSxNQUFNLENBQUMsT0FBTyxDQUFHLE1BQU0sQ0FBQyxLQUFLLElBQUksR0FBRyxFQUFFO2dCQUNsRCxRQUFRLEVBQUUsSUFBSSxDQUFDLFdBQVcsRUFBRztnQkFDN0IsT0FBTyxFQUFHLFFBQVE7Z0JBQ2xCLE9BQU8sRUFBRyxRQUFRO2dCQUNsQixJQUFJLEVBQU0sS0FBSyxDQUFDLElBQUk7Z0JBQ3BCLEdBQUcsRUFBTyxLQUFLLENBQUMsR0FBRzthQUN2QixDQUFDLENBQUE7WUFFRixLQUFLLENBQUMsYUFBYSxDQUFHLElBQUksQ0FBRSxDQUFBO1NBQ2hDO1FBRUQsV0FBVztZQUVOLE9BQU8sRUFBRSxDQUFBO1NBQ2I7UUFFRCxNQUFNLENBQUcsTUFBYSxFQUFFLE1BQU0sRUFBbUI7WUFFNUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxFQUFFLEVBQUUsR0FBRyxJQUFJLENBQUE7WUFFM0IsSUFBSyxDQUFFLFFBQVEsQ0FBRyxHQUFHLENBQUMsS0FBSyxDQUFFO2dCQUN4QixHQUFHLENBQUMsS0FBSyxHQUFHLE1BQU0sRUFBRyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUE7WUFFbkMsSUFBSyxDQUFFLFFBQVEsQ0FBRyxHQUFHLENBQUMsTUFBTSxDQUFFO2dCQUN6QixHQUFHLENBQUMsTUFBTSxHQUFHLEdBQUcsQ0FFcEI7WUFBQyxJQUFJLENBQUMsUUFBMEIscUJBQVMsR0FBRyxDQUFFLENBQUE7WUFFL0MsSUFBSyxJQUFJLENBQUMsS0FBSyxJQUFJLFNBQVM7Z0JBQ3ZCLE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFHLElBQUksQ0FBQyxLQUFLLENBQUUsQ0FBQTtZQUV2QyxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBRyxJQUFJLENBQUMsS0FBSyxDQUFFLENBRTlCO1lBQUMsSUFBSSxDQUFDLEtBQWUsR0FBRyxNQUFNLENBQUE7WUFFL0IsSUFBSSxDQUFDLGNBQWMsRUFBRyxDQUFBO1NBQzFCO1FBRUQsY0FBYztZQUVULE1BQU0sRUFBRSxRQUFRLEVBQUUsR0FBRyxFQUFFLEtBQUssRUFBRSxHQUFHLElBQUksQ0FBQTtZQUVyQyxJQUFLLEtBQUssSUFBSSxTQUFTO2dCQUNsQixPQUFNO1lBRVgsTUFBTSxFQUFFLE1BQU0sRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLElBQUksQ0FBQTtZQUVyQyxNQUFNLEdBQUcsR0FBTSxHQUFHLENBQUMsS0FBSyxJQUFJLE1BQU0sRUFBRyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUE7WUFDOUMsTUFBTSxDQUFDLEdBQVEsR0FBRyxDQUFFLEdBQUcsQ0FBQyxDQUFBO1lBQ3hCLE1BQU0sQ0FBQyxHQUFRLEdBQUcsQ0FBRSxHQUFHLENBQUMsQ0FBQTtZQUN4QixNQUFNLENBQUMsR0FBUSxLQUFLLENBQUMsV0FBVyxFQUFHLEdBQUcsQ0FBQyxDQUFBO1lBQ3ZDLE1BQU0sTUFBTSxHQUFHLE9BQU8sR0FBRyxDQUFDLE1BQU0sSUFBSSxRQUFRO2tCQUMzQixJQUFJLENBQUMsV0FBVyxFQUFHLEdBQUcsR0FBRyxDQUFDLE1BQU07a0JBQ2hDLElBQUksQ0FBQyxXQUFXLEVBQUcsR0FBRyxHQUFHLENBQUE7WUFFMUMsSUFBSSxDQUFDLFdBQVcsQ0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLE1BQU0sQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEdBQUcsTUFBTSxDQUFDLENBQUUsQ0FBQTtTQUMzRDtLQUNMOztVQzNFWUssV0FBd0QsU0FBUSxLQUFTO1FBTWpGLFlBQWMsT0FBVTtZQUVuQixLQUFLLENBQUcsT0FBTyxDQUFFLENBQUE7WUFKdEIsaUJBQVksR0FBRyxDQUFDLENBQUE7WUFLWCxJQUFJLENBQUMsUUFBUSxHQUFHLEVBQUUsQ0FBQTs7Ozs7WUFPbEIsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUE7O1lBRy9CLEtBQU0sTUFBTSxLQUFLLElBQUksTUFBTSxDQUFDLE1BQU0sQ0FBRyxNQUFNLENBQUMsS0FBSyxDQUFFLEVBQ25EO2dCQUNLLE1BQU0sQ0FBQyxHQUFHLFNBQVMsQ0FBRyxLQUFLLENBQUUsQ0FBQTs7Z0JBRTdCLElBQUksQ0FBQyxHQUFHLENBQUcsQ0FBQyxDQUFFLENBQUE7YUFDbEI7WUFFRCxJQUFJLENBQUMsSUFBSSxFQUFHLENBQUE7U0FDaEI7UUFFRCxXQUFXO1lBRU4sTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQTtZQUUxQixJQUFJLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxZQUFZLEdBQUcsTUFBTSxDQUFDLFVBQVUsSUFBSSxNQUFNLENBQUMsVUFBVSxDQUFBO1lBRXRFLElBQUssSUFBSSxHQUFHLE1BQU0sQ0FBQyxPQUFPO2dCQUNyQixJQUFJLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQTtZQUUxQixPQUFPLElBQUksSUFBSSxDQUFDLENBQUE7U0FDcEI7UUFFRCxHQUFHLENBQUcsS0FBWTtZQUViLE1BQU0sRUFBRSxLQUFLLEVBQUUsR0FBRyxJQUFJLENBQUE7WUFFdEIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUcsS0FBSyxDQUFFLENBQUE7WUFFNUIsSUFBSyxLQUFLLEVBQ1Y7Z0JBQ0ssS0FBSyxDQUFDLEdBQUcsQ0FBRyxLQUFLLENBQUMsS0FBSyxDQUFFLENBQUE7Z0JBQ3pCLEtBQUssQ0FBQyxTQUFTLEVBQUcsQ0FBQTthQUN0QjtTQUNMO1FBRUQsSUFBSTtZQUVDLE1BQU0sRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxHQUFHLElBQUksQ0FBQTtZQUV4QyxNQUFNLFNBQVMsR0FBRyxFQUF3QixDQUFBO1lBRTFDLEtBQU0sTUFBTSxDQUFDLElBQUksUUFBUSxFQUN6QjtnQkFDSyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFBO2dCQUNqQixNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxNQUFNLElBQUksQ0FBQyxDQUFBO2dCQUN2RCxTQUFTLENBQUMsSUFBSSxDQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBRSxDQUFBO2FBQ3hEO1lBRUQsTUFBTSxJQUFJLEdBQUlDLFdBQW9CLENBQUcsU0FBUyxDQUFFLEdBQUcsQ0FBQyxDQUFBO1lBRXBELEtBQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFHLENBQUMsR0FBRyxRQUFRLENBQUMsTUFBTSxFQUFHLENBQUMsRUFBRSxFQUMzQztnQkFDSyxNQUFNLENBQUMsR0FBRyxRQUFRLENBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFBO2dCQUM1QixNQUFNLENBQUMsR0FBRyxTQUFTLENBQUUsQ0FBQyxDQUFDLENBQUE7Z0JBRXZCLENBQUMsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQTtnQkFDWixDQUFDLENBQUMsR0FBRyxHQUFJLENBQUMsQ0FBQyxDQUFDLENBQUE7Z0JBRVosS0FBSyxDQUFDLEdBQUcsQ0FBRyxDQUFDLENBQUUsQ0FBQTthQUNuQjtZQUVELElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxHQUFHLE1BQU0sQ0FBQyxVQUFVLENBQUE7WUFFNUMsSUFBSSxDQUFDLFVBQVUsRUFBRyxDQUFBO1NBQ3RCO0tBRUw7O0lDaEZNLE1BQU0sVUFBVSxHQUFHQyxRQUFHLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUVBLFFBQUcsQ0FBQyxPQUFPLENBSTFELENBQUE7QUFFRCxJQUFPLE1BQU0sVUFBVSxHQUFHQSxRQUFHLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUVBLFFBQUcsQ0FBQyxPQUFPLENBSTFELENBQUE7QUFFRCxJQUFPLE1BQU0sVUFBVSxHQUFHQSxRQUFHLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUVBLFFBQUcsQ0FBQyxPQUFPLENBSTFELENBQUE7QUFFRCxJQUFPLE1BQU0sU0FBUyxHQUFHQSxRQUFHLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUVBLFFBQUcsQ0FBQyxPQUFPLENBSXhELENBQUE7QUFFRCxJQUFPLE1BQU0sYUFBYSxHQUFHQSxRQUFHLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUVBLFFBQUcsQ0FBQyxPQUFPLENBSWhFLENBQUE7O0lDcEJELFlBQVksQ0FBRyxLQUFLLEVBQU0sUUFBUSxxREFBc0QsQ0FBQTtJQUN4RixZQUFZLENBQUdGLFdBQVMsRUFBRSxPQUFPLENBQUUsQ0FBQTtJQUNuQyxZQUFZLENBQUcsS0FBSyxFQUFNLE9BQU8sQ0FBRSxDQUFBO0lBRW5DLFNBQVMsQ0FBVztRQUNmLElBQUksRUFBSyxRQUFRO1FBQ2pCLEVBQUUsRUFBTyxTQUFTO1FBRWxCLElBQUksRUFBSyxTQUFTO1FBRWxCLEtBQUssRUFBSSxRQUFRO1FBRWpCLENBQUMsRUFBRSxDQUFDO1FBQ0osQ0FBQyxFQUFFLENBQUM7UUFFSixPQUFPLEVBQU0sRUFBRTtRQUNmLFVBQVUsRUFBRSxDQUFDO1FBQ2IsVUFBVSxFQUFFLENBQUM7UUFFYixXQUFXLEVBQU8sU0FBUztRQUMzQixXQUFXLEVBQU8sQ0FBQztRQUNuQixlQUFlLEVBQUcsYUFBYTtRQUMvQixlQUFlLEVBQUcsU0FBUztRQUMzQixnQkFBZ0IsRUFBRSxLQUFLO1FBRXZCLFFBQVEsRUFBSyxDQUFFLE1BQWUsRUFBRSxNQUFNO1lBRWpDLE1BQU0sQ0FBQyxhQUFhLENBQUU7Z0JBQ2pCLGVBQWUsRUFBRSxNQUFNLENBQUMsTUFBTTtnQkFDOUIsS0FBSyxFQUFFLE1BQU0sQ0FBQyxTQUFTLEdBQUcsUUFBUSxHQUFHLFFBQVE7YUFDMUMsQ0FBQyxDQUFBO1NBQ2I7UUFDRCxRQUFRLEVBQUUsU0FBUztRQUNuQixPQUFPLEVBQUUsU0FBUztLQUN0QixDQUFDLENBQUE7SUFFRixTQUFTLENBQVc7UUFDZixJQUFJLEVBQUssT0FBTztRQUNoQixFQUFFLEVBQU8sU0FBUztRQUVsQixJQUFJLEVBQUUsU0FBUztRQUVmLEtBQUssRUFBRSxRQUFRO1FBQ2YsQ0FBQyxFQUFFLENBQUM7UUFDSixDQUFDLEVBQUUsQ0FBQztRQUVKLFdBQVcsRUFBTyxTQUFTO1FBQzNCLFdBQVcsRUFBTyxDQUFDO1FBQ25CLGVBQWUsRUFBRyxTQUFTO1FBQzNCLGVBQWUsRUFBRyxTQUFTO1FBQzNCLGdCQUFnQixFQUFFLEtBQUs7UUFDdkIsT0FBTyxFQUFXLEVBQUU7UUFDcEIsVUFBVSxFQUFRLEVBQUU7UUFDcEIsVUFBVSxFQUFRLENBQUM7UUFFbkIsUUFBUSxDQUFHLEtBQWEsRUFBRSxNQUFNO1lBRTNCLE1BQU0sSUFBSSxHQUFHLE9BQU8sQ0FBRTtnQkFDakIsSUFBSSxFQUFFLE9BQU87Z0JBQ2IsRUFBRSxFQUFJLEtBQUssQ0FBQyxJQUFJO2FBQ3BCLENBQUMsQ0FBQTtZQUVGLE1BQU0sS0FBSyxHQUFHLFNBQVMsQ0FBVyxJQUFJLENBQUUsQ0FBQTs7WUFHeEMsS0FBSyxDQUFDLE1BQU0sQ0FBRyxNQUFNLENBQUUsQ0FBQTtTQUMzQjtRQUVELE9BQU8sQ0FBRyxLQUFLO1lBRVYsTUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFXO2dCQUMzQixJQUFJLEVBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBQyxJQUFJO2dCQUN2QixFQUFFLEVBQUksS0FBSyxDQUFDLE1BQU0sQ0FBQyxFQUFFO2FBQ3pCLENBQUMsQ0FBQTtZQUVGLFVBQVUsQ0FBRyxrQkFBa0IsRUFBRSxLQUFLLENBQUUsQ0FBQTtTQUM1QztRQUVELFFBQVEsRUFBRSxTQUFTO0tBQ3ZCLENBQUMsQ0FBQTtJQUVGLFNBQVMsQ0FBVztRQUNmLElBQUksRUFBSyxPQUFPO1FBQ2hCLEVBQUUsRUFBTyxTQUFTO1FBRWxCLElBQUksRUFBRSxTQUFTO1FBRWYsQ0FBQyxFQUFXLENBQUM7UUFDYixDQUFDLEVBQVcsQ0FBQztRQUNiLE9BQU8sRUFBSyxDQUFDO1FBQ2IsVUFBVSxFQUFFLENBQUM7UUFDYixVQUFVLEVBQUUsQ0FBQztRQUViLEtBQUssRUFBYSxRQUFRO1FBQzFCLFdBQVcsRUFBTyxNQUFNO1FBQ3hCLFdBQVcsRUFBTyxDQUFDO1FBRW5CLGVBQWUsRUFBRyxhQUFhO1FBQy9CLGVBQWUsRUFBRyxTQUFTO1FBQzNCLGdCQUFnQixFQUFFLEtBQUs7UUFFdkIsUUFBUSxFQUFVLFNBQVM7UUFDM0IsUUFBUSxFQUFVLFNBQVM7UUFDM0IsT0FBTyxFQUFXLFNBQVM7S0FDL0IsQ0FBQyxDQUFBOztJQ3JIRjtJQUVBO0FBRUEsSUFBTyxNQUFNLElBQUksR0FBR0csSUFBTyxDQUF3QjtRQUM5QyxPQUFPLEVBQVEsWUFBWTtRQUMzQixJQUFJLEVBQVcsV0FBVztRQUMxQixFQUFFLEVBQWEsTUFBTTtRQUNyQixhQUFhLEVBQUUsSUFBSTtRQUNuQixTQUFTLEVBQU0sSUFBSTtLQUN2QixDQUFDLENBQUE7SUFDRixRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBRyxHQUFJLElBQUksQ0FBQyxPQUFPLEVBQUcsQ0FBRSxDQUFBO0lBTzVDO0lBQ0EscURBQXFEOztVQ0x4QyxVQUFXLFNBQVEsU0FBdUI7UUFFbEQsT0FBTyxDQUFHLEtBQWE7WUFFbEIsTUFBTSxNQUFNLEdBQUcsZUFBSyxLQUFLLEVBQUMsUUFBUSxHQUFPLENBQUE7WUFFekMsS0FBTSxNQUFNLElBQUksSUFBSSxLQUFLLENBQUMsS0FBSyxFQUMvQjtnQkFDSyxNQUFNLE1BQU0sR0FBR1IsT0FBVSxDQUFhLElBQUksQ0FBRSxDQUFBO2dCQUU1QyxNQUFNLElBQUksR0FBRyxlQUFLLEtBQUssRUFBQyx1QkFBdUI7b0JBQzFDLGVBQUssR0FBRyxFQUFHLE1BQU0sQ0FBQyxNQUFNLEVBQUcsR0FBRyxFQUFDLFFBQVEsR0FBRTtvQkFDekMsZUFBSyxLQUFLLEVBQUMsY0FBYzt3QkFDcEI7NEJBQ0ssaUJBQUssTUFBTSxDQUFDLFNBQVMsQ0FBTSxDQUMzQjt3QkFDTDs0QkFDSyxpQkFBSyxNQUFNLENBQUMsU0FBUyxHQUFHLFFBQVEsR0FBRyxJQUFJLENBQU0sQ0FDMUMsQ0FDUCxDQUNMLENBQUE7Z0JBRU4sTUFBTSxDQUFDLE1BQU0sQ0FBRyxJQUFJLENBQUUsQ0FBQTthQUMxQjtZQUVELElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxHQUFHLEVBQUUsQ0FBQTtZQUM3QixJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBRyxrQkFBTSxLQUFLLENBQUMsRUFBRSxDQUFPLENBQUUsQ0FBQTtZQUMvQyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBRyxpQkFBSyxLQUFLLENBQUMsV0FBVyxDQUFNLENBQUUsQ0FBQTtZQUN0RCxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBRyxNQUFNLENBQUUsQ0FBQTs7WUFHaEMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUcsbUJBQU8sSUFBSSxDQUFDLFNBQVMsQ0FBRyxLQUFLLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBRSxDQUFRLENBQUUsQ0FBQTtTQUM5RTtLQUNMO0lBRUQ7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUVBLE1BQU0sQ0FBRyxVQUFVLEVBQUUsQ0FBQyxlQUFlLEVBQUUsTUFBTSxDQUFDLENBQUcsQ0FBQTtJQUNqRCxNQUFNLENBQUcsVUFBVSxFQUFFLENBQUMsU0FBUyxFQUFFLGFBQWEsQ0FBQyxDQUFFLENBQUE7O0lDOUNqRCxJQUFJLFNBQVMsR0FBRyxJQUFpQyxDQUFBO0FBRWpELElBQU8sTUFBTSxLQUFLLEdBQUdRLElBQU8sQ0FBd0I7UUFDL0MsT0FBTyxFQUFRLFlBQVk7UUFDM0IsSUFBSSxFQUFXLFdBQVc7UUFDMUIsRUFBRSxFQUFhLFNBQVM7UUFDeEIsU0FBUyxFQUFNLFNBQVM7UUFDeEIsYUFBYSxFQUFFLElBQUk7UUFFbkIsTUFBTSxFQUFFO1lBQ0gsT0FBTyxFQUFJLFlBQVk7WUFDdkIsSUFBSSxFQUFPLFNBQVM7WUFDcEIsRUFBRSxFQUFTLFNBQVM7WUFDcEIsS0FBSyxFQUFNLFVBQVU7WUFDckIsU0FBUyxFQUFFLEFBQXdDLENBQUMsSUFBSSxDQUFDLEFBQU07WUFFL0QsT0FBTyxFQUFFLENBQUM7b0JBQ0wsT0FBTyxFQUFFLFlBQVk7b0JBQ3JCLElBQUksRUFBTSxRQUFRO29CQUNsQixFQUFFLEVBQVEsU0FBUztvQkFDbkIsSUFBSSxFQUFNLEdBQUc7b0JBQ2IsSUFBSSxFQUFNLEVBQUU7b0JBQ1osUUFBUSxFQUFFLEdBQUc7b0JBQ2IsT0FBTyxFQUFFLFdBQVc7aUJBQ3hCLEVBQUM7b0JBQ0csT0FBTyxFQUFFLFlBQVk7b0JBQ3JCLElBQUksRUFBTSxRQUFRO29CQUNsQixFQUFFLEVBQVEsWUFBWTtvQkFDdEIsSUFBSSxFQUFNLEVBQUU7b0JBQ1osSUFBSSxFQUFNLGtCQUFrQjtvQkFDNUIsUUFBUSxFQUFFLEdBQUc7aUJBQ2pCLENBQUM7U0FDTjtRQUVELFFBQVEsRUFBRSxDQUFDO2dCQUNOLE9BQU8sRUFBSSxZQUFZO2dCQUN2QixJQUFJLEVBQU8sV0FBVztnQkFDdEIsRUFBRSxFQUFTLGlCQUFpQjtnQkFFNUIsUUFBUSxFQUFFLENBQUM7d0JBQ04sT0FBTyxFQUFFLFlBQVk7d0JBQ3JCLElBQUksRUFBSyxjQUFjO3dCQUN2QixFQUFFLEVBQU8sYUFBYTtxQkFDMUIsRUFBQzt3QkFDRyxPQUFPLEVBQUUsWUFBWTt3QkFDckIsSUFBSSxFQUFLLGVBQWU7d0JBQ3hCLEVBQUUsRUFBTyxjQUFjO3FCQUMzQixDQUFDO2FBQ04sQ0FBQztLQUNOLENBQUMsQ0FBQTtJQUVGLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFHLEdBQUksS0FBSyxDQUFDLE9BQU8sRUFBRyxDQUFFLENBQUE7SUFFN0MsTUFBTSxTQUFTLEdBQUlDLElBQU8sQ0FBaUIsV0FBVyxFQUFFLGlCQUFpQixDQUFFLENBQUE7SUFDM0UsTUFBTSxVQUFVLEdBQUdBLElBQU8sQ0FBaUIsY0FBYyxFQUFFLGFBQWEsQ0FBRSxDQUFBO0lBRTFFLFVBQVUsQ0FBRyxZQUFZLEVBQUUsQ0FBRSxJQUFJLEVBQUUsR0FBSSxPQUFPO1FBRXpDLElBQUssSUFBSTtZQUNKLFNBQVMsQ0FBQyxJQUFJLENBQUcsSUFBSSxFQUFFLEdBQUksT0FBTyxDQUFFLENBQUE7O1lBRXBDLEtBQUssQ0FBQyxJQUFJLEVBQUcsQ0FBQTtJQUN2QixDQUFDLENBQUMsQ0FBQTtJQUVGLFVBQVUsQ0FBRyxrQkFBa0IsRUFBRSxDQUFFLElBQUk7UUFFbEMsSUFBSyxJQUFJLEVBQ1Q7WUFDSyxVQUFVLENBQUMsT0FBTyxDQUFHLElBQVcsQ0FBRSxDQUFBO1lBQ2xDLEtBQUssQ0FBQyxJQUFJLEVBQUcsQ0FBQTtTQUNqQjtJQUNOLENBQUMsQ0FBQyxDQUFBO0lBRUYsVUFBVSxDQUFHLGFBQWEsRUFBRztRQUV4QixLQUFLLENBQUMsS0FBSyxFQUFHLENBQUE7SUFDbkIsQ0FBQyxDQUFDLENBQUE7O0lDNUZGOzs7OztBQU1BLElBUUEsTUFBTSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsT0FBTyxHQUFjLENBQUMsQ0FBQTtJQUM5QyxNQUFNLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxhQUFhLEdBQVEsS0FBSyxDQUFBO0lBQ2xELE1BQU0sQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLFdBQVcsR0FBVSxJQUFJLENBQUE7SUFDakQsTUFBTSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsVUFBVSxHQUFXLElBQUksQ0FBQTtJQUNqRCxNQUFNLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxnQkFBZ0IsR0FBSyxLQUFLLENBQUE7SUFDbEQsTUFBTSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsa0JBQWtCLEdBQUcsS0FBSyxDQUFBO0lBQ2xELE1BQU0sQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLGVBQWUsR0FBTSxJQUFJLENBQUE7SUFDakQsTUFBTSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsV0FBVyxHQUFVLFFBQVEsQ0FBQTtJQUNyRCxNQUFNLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxpQkFBaUIsQ0FBRyxJQUFJLEVBQUUsS0FBSyxDQUFFLENBQUE7SUFDekQsTUFBTSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsaUJBQWlCLENBQUcsSUFBSSxFQUFFLEtBQUssQ0FBRSxDQUFBO0lBQ3pELE1BQU0sQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLGlCQUFpQixDQUFHLElBQUksRUFBRSxLQUFLLENBQUUsQ0FBQTtJQUN6RCxNQUFNLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxpQkFBaUIsQ0FBRyxJQUFJLEVBQUUsS0FBSyxDQUFFLENBQUE7SUFDekQsTUFBTSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsaUJBQWlCLENBQUcsSUFBSSxFQUFFLEtBQUssQ0FBRSxDQUFBO0lBQ3pELE1BQU0sQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLGlCQUFpQixDQUFHLElBQUksRUFBRSxLQUFLLENBQUUsQ0FBQTtJQUN6RCxNQUFNLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxpQkFBaUIsQ0FBRyxJQUFJLEVBQUUsS0FBSyxDQUFFLENBQUE7QUFXekQsVUFBYSxJQUFJO1FBTVosWUFBYyxNQUF5QjtZQUYvQixVQUFLLEdBQUcsRUFBMkIsQ0FBQTtZQWEzQyxnQkFBVyxHQUFrQixTQUFTLENBQUE7WUFFdEMsaUJBQVksR0FBSSxJQUE4QixDQUFBO1lBQzlDLGdCQUFXLEdBQUssSUFBOEIsQ0FBQTtZQUM5QyxrQkFBYSxHQUFHLElBQThCLENBQUE7WUFDOUMsd0JBQW1CLEdBQUcsSUFBOEIsQ0FBQTtZQUNwRCxnQkFBVyxHQUFLLElBQXdDLENBQUE7WUFmbkQsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLE1BQU0sQ0FBQyxNQUFNLENBQUcsTUFBTSxDQUFFLENBQUE7WUFDM0MsSUFBSSxDQUFDLFlBQVksRUFBRyxDQUFBO1NBQ3hCO1FBRUQsSUFBSSxJQUFJO1lBRUgsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFBO1NBQ3RCO1FBVUQsVUFBVSxDQUFHLElBQVk7WUFFcEIsTUFBTSxFQUFFLEtBQUssRUFBRSxHQUFHLElBQUksQ0FBQTtZQUV0QixJQUFLLElBQUksSUFBSSxLQUFLO2dCQUNiLE1BQU0seUJBQXlCLENBQUE7WUFFcEMsT0FBTyxLQUFLLENBQUUsSUFBSSxDQUFDLEdBQUc7Z0JBQ2pCLElBQUk7Z0JBQ0osTUFBTSxFQUFLLEtBQUs7Z0JBQ2hCLFFBQVEsRUFBRyxFQUFFO2dCQUNiLE9BQU8sRUFBSSxTQUFTO2dCQUNwQixTQUFTLEVBQUUsSUFBSTthQUNuQixDQUFBO1NBQ0w7UUFJRCxHQUFHLENBQUcsSUFBbUI7WUFFcEIsTUFBTSxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsR0FBRyxJQUFJLENBQUE7WUFFL0IsSUFBSyxPQUFPLElBQUksSUFBSSxRQUFRO2dCQUN2QixJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQTtZQUVyQixJQUFLLElBQUksQ0FBQyxNQUFNLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLElBQUksSUFBSTtnQkFDdkMsT0FBTTtZQUVYLElBQUssRUFBRyxJQUFJLElBQUksS0FBSyxDQUFDO2dCQUNqQixPQUFNO1lBRVgsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUUsSUFBSSxDQUFDLENBQUE7WUFFekMsT0FBTyxDQUFDLEtBQUssRUFBRyxDQUFBO1lBRWhCLEtBQU0sTUFBTSxLQUFLLElBQUksTUFBTSxDQUFDLFFBQVE7Z0JBQy9CLE9BQU8sQ0FBQyxHQUFHLENBQUcsS0FBSyxDQUFDLEtBQUssQ0FBRSxDQUFBO1lBRWhDLE9BQU8sTUFBTSxDQUFBO1NBQ2pCO1FBSUQsR0FBRztZQUVFLE1BQU0sRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLEdBQUcsSUFBSSxDQUFBO1lBRWhDLElBQUssU0FBUyxDQUFDLE1BQU0sSUFBSSxDQUFDO2dCQUNyQixPQUFNO1lBRVgsSUFBSyxPQUFPLFNBQVMsQ0FBRSxDQUFDLENBQUMsSUFBSSxRQUFRLEVBQ3JDO2dCQUNLLE1BQU0sSUFBSSxHQUFHVCxPQUFVLENBQUcsR0FBSSxTQUE2QixDQUFFLENBQUE7Z0JBQzdELE1BQU0sR0FBRyxHQUFHVSxTQUFnQixDQUFHLElBQUksQ0FBRSxDQUFBO2dCQUNyQyxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBRyxHQUFHLENBQUUsQ0FBQTtnQkFDNUIsT0FBTyxDQUFDLEdBQUcsQ0FBRyxHQUFHLENBQUMsS0FBSyxDQUFFLENBQUE7YUFDN0I7O2dCQUNJLEtBQU0sTUFBTSxDQUFDLElBQUksU0FBUyxFQUMvQjtvQkFDSyxNQUFNLEdBQUcsR0FBR0EsU0FBZ0IsQ0FBRyxDQUFrQixDQUFFLENBQUE7Ozs7O29CQVFuRCxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBRyxHQUFHLENBQUUsQ0FBQTtvQkFDNUIsT0FBTyxDQUFDLEdBQUcsQ0FBRyxHQUFHLENBQUMsS0FBSyxDQUFFLENBQUE7aUJBQzdCO1lBRUQsT0FBTyxDQUFDLGdCQUFnQixFQUFHLENBQUE7U0FDL0I7UUFFRCxLQUFLO1lBRUEsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUcsQ0FBQTtTQUN6QjtRQUVELElBQUk7WUFFQyxNQUFNLEVBQUUsT0FBTyxFQUFFLEdBQUcsSUFBSSxDQUFBO1lBRXhCLE1BQU0sT0FBTyxHQUFHLE9BQU8sQ0FBQyxVQUFVLEVBQUcsQ0FBQTtZQUNyQyxNQUFNLFNBQVMsR0FBRyxFQUF3QixDQUFBO1lBRTFDLEtBQU0sTUFBTSxDQUFDLElBQUksT0FBTyxFQUN4QjtnQkFDSyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxNQUFNLElBQUksQ0FBQyxDQUFBO2dCQUN2RCxTQUFTLENBQUMsSUFBSSxDQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBRSxDQUFBO2FBQ3pEO1lBRURKLFdBQW9CLENBQUcsU0FBUyxDQUFFLEdBQUcsQ0FBQyxDQUFBO1lBRXRDLEtBQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFHLENBQUMsR0FBRyxPQUFPLENBQUMsTUFBTSxFQUFHLENBQUMsRUFBRSxFQUMxQztnQkFDSyxNQUFNLENBQUMsR0FBRyxPQUFPLENBQUUsQ0FBQyxDQUFDLENBQUE7Z0JBQ3JCLE1BQU0sQ0FBQyxHQUFHLFNBQVMsQ0FBRSxDQUFDLENBQUMsQ0FBQTtnQkFFdkIsQ0FBQyxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFBO2dCQUNaLENBQUMsQ0FBQyxHQUFHLEdBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQTtnQkFDWixDQUFDLENBQUMsU0FBUyxFQUFHLENBQUE7YUFDbEI7WUFFRCxPQUFPLENBQUMsZ0JBQWdCLEVBQUcsQ0FBQTtTQUMvQjtRQUVELElBQUksQ0FBRyxNQUF1QjtZQUV6QixNQUFNLEVBQUUsT0FBTyxFQUFFLEdBQUcsSUFBSSxDQUFBO1lBRXhCLElBQUssT0FBTyxNQUFNLElBQUksUUFBUSxFQUM5QjtnQkFDSyxPQUFNO2FBQ1Y7WUFFRCxNQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMsVUFBVSxFQUFHLENBQUE7WUFFckMsSUFBSyxPQUFPLE1BQU0sSUFBSSxRQUFRLEVBQzlCO2dCQUNLLE1BQU0sQ0FBQyxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUE7Z0JBRXRCLElBQUksSUFBSSxHQUFLLENBQUMsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDLEtBQUssQ0FBQTtnQkFDN0IsSUFBSSxLQUFLLEdBQUksQ0FBQyxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFBO2dCQUM3QixJQUFJLEdBQUcsR0FBTSxDQUFDLENBQUMsR0FBRyxHQUFJLENBQUMsQ0FBQyxNQUFNLENBQUE7Z0JBQzlCLElBQUksTUFBTSxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQTthQUVsQztpQkFFRDtnQkFDSyxJQUFJLElBQUksR0FBSyxDQUFDLENBQUE7Z0JBQ2QsSUFBSSxLQUFLLEdBQUksQ0FBQyxDQUFBO2dCQUNkLElBQUksR0FBRyxHQUFNLENBQUMsQ0FBQTtnQkFDZCxJQUFJLE1BQU0sR0FBRyxDQUFDLENBQUE7Z0JBRWQsS0FBTSxNQUFNLENBQUMsSUFBSSxPQUFPLEVBQ3hCO29CQUNLLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDLEtBQUssQ0FBQTtvQkFDMUIsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFBO29CQUMxQixNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFJLENBQUMsQ0FBQyxNQUFNLENBQUE7b0JBQzNCLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQTtvQkFFM0IsSUFBSyxDQUFDLEdBQUcsSUFBSTt3QkFDUixJQUFJLEdBQUcsQ0FBQyxDQUFBO29CQUViLElBQUssQ0FBQyxHQUFHLEtBQUs7d0JBQ1QsS0FBSyxHQUFHLENBQUMsQ0FBQTtvQkFFZCxJQUFLLENBQUMsR0FBRyxHQUFHO3dCQUNQLEdBQUcsR0FBRyxDQUFDLENBQUE7b0JBRVosSUFBSyxDQUFDLEdBQUcsTUFBTTt3QkFDVixNQUFNLEdBQUcsQ0FBQyxDQUFBO2lCQUNuQjthQUNMO1lBRUQsTUFBTSxDQUFDLEdBQUksS0FBSyxHQUFHLElBQUksQ0FBQTtZQUN2QixNQUFNLENBQUMsR0FBSSxNQUFNLEdBQUcsR0FBRyxDQUFBO1lBQ3ZCLE1BQU0sRUFBRSxHQUFHLE9BQU8sQ0FBQyxRQUFRLEVBQUksQ0FBQTtZQUMvQixNQUFNLEVBQUUsR0FBRyxPQUFPLENBQUMsU0FBUyxFQUFHLENBQUE7WUFFL0IsTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUM7a0JBQ0gsQ0FBQyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLElBQUksQ0FBQztrQkFDdkIsQ0FBQyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFBO1lBRW5DLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUE7WUFDakMsT0FBTyxDQUFDLGlCQUFpQixDQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQTtZQUVqQyxNQUFNLEVBQUUsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQTtZQUN2QixNQUFNLEVBQUUsR0FBRyxHQUFHLEdBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQTtZQUV2QixPQUFPLENBQUMsaUJBQWlCLENBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxFQUFFLEdBQUcsQ0FBQyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQTtZQUNsRCxPQUFPLENBQUMsaUJBQWlCLENBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxFQUFFLEdBQUcsQ0FBQyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQTtZQUVsRCxLQUFNLE1BQU0sQ0FBQyxJQUFJLE9BQU87Z0JBQ25CLENBQUMsQ0FBQyxTQUFTLEVBQUcsQ0FBQTtZQUVuQixPQUFPLENBQUMsZ0JBQWdCLEVBQUcsQ0FBQTtTQUMvQjtRQUVELE9BQU8sQ0FBRyxLQUFZO1lBRWpCLEtBQU0sTUFBTSxDQUFDLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUcsRUFDM0M7Z0JBQ0ssQ0FBQyxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUE7YUFDckI7WUFFRCxLQUFLLENBQUMsS0FBSyxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUE7U0FDOUI7UUFFRCxZQUFZO1lBRVAsTUFBTSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsR0FBRyxJQUFJLENBQUE7WUFFOUIsTUFBTSxTQUFTLEdBQUcsS0FBSyxDQUFDLFNBQVMsQ0FBQTtZQUVqQyxJQUFLLFNBQVMsSUFBSSxLQUFLLENBQUMsTUFBTSxJQUFJLEtBQUs7Z0JBQ2xDLENBQVM7WUFFZCxPQUFPLEtBQUssQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUUsRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQTtTQUN4RTs7UUFJRCxZQUFZO1lBRVAsSUFBSSxDQUFDLGNBQWMsRUFBRyxDQUFBO1lBQ3RCLElBQUksQ0FBQyxhQUFhLEVBQUksQ0FBQTtZQUN0QixJQUFJLENBQUMsWUFBWSxFQUFLLENBQUE7WUFDdEIsSUFBSSxDQUFDLGFBQWEsRUFBSSxDQUFBOzs7WUFJdEIsTUFBTSxDQUFDLGdCQUFnQixDQUFHLFFBQVEsRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBRSxJQUFJLENBQUMsQ0FBRSxDQUFBO1NBQ3JFO1FBRU8sVUFBVTtZQUViLElBQUksS0FBSyxHQUFLLENBQUMsTUFBTSxDQUFDLFVBQVUsR0FBSSxDQUFDLElBQUksTUFBTSxDQUFDLFVBQVUsR0FBSSxNQUFNLENBQUMsS0FBSyxDQUFBO1lBQzFFLElBQUksTUFBTSxHQUFJLENBQUMsTUFBTSxDQUFDLFdBQVcsR0FBRyxDQUFDLElBQUksTUFBTSxDQUFDLFdBQVcsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFBO1lBRTNFLElBQUksQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDO2dCQUN0QixLQUFLLEVBQUUsS0FBSztnQkFDWixNQUFNLEVBQUUsTUFBTTthQUNsQixDQUFDLENBQUE7U0FDTjtRQUVPLGNBQWM7WUFFakIsTUFBTSxJQUFJLEdBQWEsSUFBSSxDQUFDLE9BQU8sQ0FBQTtZQUNuQyxNQUFNLGNBQWMsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFBO1lBQzlCLElBQU0sVUFBVSxHQUFPLENBQUMsQ0FBQyxDQUFBO1lBQ3pCLElBQU0sUUFBUSxHQUFTLEVBQUUsQ0FBQyxFQUFFLENBQUMsSUFBSSxFQUFFLENBQUMsRUFBRSxDQUFDLElBQUksRUFBRSxDQUFBO1lBRTdDLElBQUksQ0FBQyxFQUFFLENBQUcsWUFBWSxFQUFFLE1BQU07Z0JBRXpCLE9BQU8sQ0FBQyxHQUFHLENBQUcsWUFBWSxDQUFFLENBQUE7Z0JBQzVCLE1BQU0sR0FBRyxHQUFLLElBQUksQ0FBQyxHQUFHLEVBQUcsQ0FBQTtnQkFDekIsTUFBTSxHQUFHLEdBQUssTUFBTSxDQUFDLE9BQU8sQ0FBQTtnQkFDNUIsTUFBTSxLQUFLLEdBQUc7b0JBQ1QsVUFBVSxHQUFHLEdBQUcsQ0FBQTtvQkFDaEIsUUFBUSxHQUFLLEdBQUcsQ0FBQTtpQkFDcEIsQ0FBQTs7Z0JBR0QsSUFBSyxHQUFHLEdBQUcsR0FBRyxHQUFHLFVBQVUsRUFDM0I7b0JBQ0ssSUFBSyxJQUFJLENBQUMsYUFBYSxFQUN2Qjt3QkFDSyxNQUFNLE9BQU8sR0FBR0ksU0FBZ0IsQ0FBRyxNQUFNLENBQUMsTUFBTSxDQUFFLENBQUE7d0JBRWxELElBQUssT0FBTzs0QkFDUCxJQUFJLENBQUMsYUFBYSxDQUFHLE9BQU8sQ0FBRSxDQUFBO3dCQUVuQyxNQUFNLENBQUMsQ0FBQyxDQUFDLHdCQUF3QixFQUFHLENBQUE7d0JBRXBDLE9BQU07cUJBQ1Y7eUJBRUQ7d0JBQ0ssT0FBTyxLQUFLLEVBQUcsQ0FBQTtxQkFDbkI7aUJBQ0w7O2dCQUdELE1BQU0sSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxRQUFRLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLEdBQUcsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFBO2dCQUN4RCxJQUFLLElBQUksR0FBRyxDQUFDLGNBQWMsSUFBSSxjQUFjLEdBQUcsSUFBSTtvQkFDL0MsT0FBTyxLQUFLLEVBQUcsQ0FBQTs7Z0JBR3BCLElBQUssTUFBTSxDQUFDLE1BQU0sSUFBSSxTQUFTLEVBQy9CO29CQUNLLElBQUssSUFBSSxDQUFDLG1CQUFtQixFQUM3Qjt3QkFDSyxNQUFNLE9BQU8sR0FBR0EsU0FBZ0IsQ0FBRyxNQUFNLENBQUMsTUFBTSxDQUFFLENBQUE7d0JBRWxELElBQUssT0FBTzs0QkFDUCxJQUFJLENBQUMsbUJBQW1CLENBQUcsT0FBTyxDQUFFLENBQUE7cUJBQzdDO29CQUVELFVBQVUsR0FBSyxDQUFDLENBQUMsQ0FBQTtpQkFDckI7O3FCQUdEO29CQUNLLElBQUssSUFBSSxDQUFDLFdBQVc7d0JBQ2hCLElBQUksQ0FBQyxXQUFXLENBQUcsR0FBRyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFFLENBQUE7aUJBQzFDO2dCQUVELE1BQU0sQ0FBQyxDQUFDLENBQUMsd0JBQXdCLEVBQUcsQ0FBQTtnQkFFcEMsT0FBTTthQUNWLENBQUMsQ0FBQTtTQUNOO1FBRU8sYUFBYTtZQUVoQixNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFBO1lBRXpCLElBQUksQ0FBQyxFQUFFLENBQUcsWUFBWSxFQUFFLE1BQU07Z0JBRXpCLElBQUksQ0FBQyxXQUFXLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQTtnQkFFaEMsSUFBSyxJQUFJLENBQUMsWUFBWSxFQUN0QjtvQkFDSyxNQUFNLE9BQU8sR0FBR0EsU0FBZ0IsQ0FBRyxNQUFNLENBQUMsTUFBTSxDQUFFLENBQUE7b0JBRWxELElBQUssT0FBTzt3QkFDUCxJQUFJLENBQUMsWUFBWSxDQUFHLE9BQU8sQ0FBRSxDQUFBO2lCQUN0QzthQUNMLENBQUMsQ0FBQTtZQUVGLElBQUksQ0FBQyxFQUFFLENBQUcsV0FBVyxFQUFFLE1BQU07Z0JBRXhCLElBQUksQ0FBQyxXQUFXLEdBQUcsU0FBUyxDQUFBO2dCQUU1QixJQUFLLElBQUksQ0FBQyxXQUFXLEVBQ3JCO29CQUNLLE1BQU0sT0FBTyxHQUFHQSxTQUFnQixDQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUUsQ0FBQTtvQkFFbEQsSUFBSyxPQUFPO3dCQUNQLElBQUksQ0FBQyxXQUFXLENBQUcsT0FBTyxDQUFFLENBQUE7aUJBQ3JDO2FBQ0wsQ0FBQyxDQUFBO1NBQ047UUFFTyxZQUFZO1lBRWYsTUFBTSxJQUFJLEdBQVMsSUFBSSxDQUFDLE9BQU8sQ0FBQTtZQUMvQixJQUFNLFVBQVUsR0FBRyxLQUFLLENBQUE7WUFDeEIsSUFBTSxRQUFRLEdBQUssQ0FBQyxDQUFDLENBQUE7WUFDckIsSUFBTSxRQUFRLEdBQUssQ0FBQyxDQUFDLENBQUE7WUFFckIsSUFBSSxDQUFDLEVBQUUsQ0FBRyxZQUFZLEVBQUUsTUFBTTtnQkFFekIsSUFBSyxJQUFJLENBQUMsV0FBVyxJQUFJLFNBQVMsRUFDbEM7b0JBQ0ssSUFBSSxDQUFDLFNBQVMsR0FBRyxLQUFLLENBQUE7b0JBQ3RCLElBQUksQ0FBQyxtQkFBbUIsRUFBRyxDQUFBO29CQUMzQixJQUFJLENBQUMsYUFBYSxDQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsVUFBVSxHQUFHLEtBQUssQ0FBQSxFQUFFLENBQUUsQ0FBQTtvQkFFcEQsVUFBVSxHQUFHLElBQUksQ0FBQTtvQkFDakIsUUFBUSxHQUFLLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFBO29CQUM3QixRQUFRLEdBQUssTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUE7b0JBRTdCLElBQUksQ0FBQyxnQkFBZ0IsRUFBRyxDQUFBO2lCQUM1QjthQUNMLENBQUMsQ0FBQTtZQUVGLElBQUksQ0FBQyxFQUFFLENBQUcsWUFBWSxFQUFFLE1BQU07Z0JBRXpCLElBQUssVUFBVSxFQUNmO29CQUNLLE1BQU0sT0FBTyxHQUFJLE1BQU0sQ0FBQyxPQUFPLENBQUE7b0JBRS9CLElBQUksQ0FBQyxpQkFBaUIsQ0FBRSxDQUFDLENBQUMsSUFBSSxPQUFPLENBQUMsQ0FBQyxHQUFHLFFBQVEsQ0FBQTtvQkFDbEQsSUFBSSxDQUFDLGlCQUFpQixDQUFFLENBQUMsQ0FBQyxJQUFJLE9BQU8sQ0FBQyxDQUFDLEdBQUcsUUFBUSxDQUFBO29CQUVsRCxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQTtvQkFFdkIsUUFBUSxHQUFHLE9BQU8sQ0FBQyxDQUFDLENBQUE7b0JBQ3BCLFFBQVEsR0FBRyxPQUFPLENBQUMsQ0FBQyxDQUFBO2lCQUN4QjthQUNMLENBQUMsQ0FBQTtZQUVGLElBQUksQ0FBQyxFQUFFLENBQUcsVUFBVSxFQUFFO2dCQUVqQixJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQTtnQkFFckIsSUFBSSxDQUFDLGFBQWEsQ0FBRyxDQUFDO29CQUVqQixDQUFDLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQTtvQkFDbkIsQ0FBQyxDQUFDLFNBQVMsRUFBRSxDQUFBO2lCQUNqQixDQUFDLENBQUE7Z0JBRUYsVUFBVSxHQUFHLEtBQUssQ0FBQTtnQkFFbEIsSUFBSSxDQUFDLGdCQUFnQixFQUFHLENBQUE7YUFDNUIsQ0FBQyxDQUFBO1NBQ047UUFFTyxhQUFhO1lBRWhCLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUE7WUFFekIsSUFBSSxDQUFDLEVBQUUsQ0FBRyxhQUFhLEVBQUUsTUFBTTtnQkFFMUIsTUFBTSxLQUFLLEdBQUssTUFBTSxDQUFDLENBQWUsQ0FBQTtnQkFDdEMsSUFBTSxLQUFLLEdBQUssS0FBSyxDQUFDLE1BQU0sQ0FBQTtnQkFDNUIsSUFBTSxJQUFJLEdBQU0sSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFBO2dCQUN6QixJQUFJLEdBQU0sSUFBSSxHQUFHLEtBQUssR0FBRyxLQUFLLENBQUE7Z0JBRW5DLElBQUksSUFBSSxHQUFHLENBQUM7b0JBQ1AsSUFBSSxHQUFHLENBQUMsQ0FBQTtnQkFFYixJQUFJLElBQUksR0FBRyxHQUFHO29CQUNULElBQUksR0FBRyxHQUFHLENBQUE7Z0JBRWYsSUFBSSxDQUFDLFdBQVcsQ0FBRSxJQUFJLE1BQU0sQ0FBQyxLQUFLLENBQUcsS0FBSyxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsT0FBTyxDQUFFLEVBQUUsSUFBSSxDQUFFLENBQUE7Z0JBRTNFLEtBQUssQ0FBQyxjQUFjLEVBQUUsQ0FBQTtnQkFDdEIsS0FBSyxDQUFDLGVBQWUsRUFBRSxDQUFBO2dCQUV2QixJQUFJLENBQUMsZ0JBQWdCLEVBQUcsQ0FBQTthQUM1QixDQUFDLENBQUE7U0FDTjtRQUVPLGNBQWM7WUFFakIsTUFBTSxJQUFJLEdBQVEsSUFBSSxDQUFDLE9BQU8sQ0FBQTtZQUM5QixJQUFNLE9BQU8sR0FBSyxTQUE2QixDQUFBO1lBQy9DLElBQU0sU0FBUyxHQUFHLFNBQXdCLENBQUE7WUFDMUMsSUFBTSxPQUFPLEdBQUssQ0FBQyxDQUFBO1lBQ25CLElBQU0sT0FBTyxHQUFLLENBQUMsQ0FBQTtZQUVuQixTQUFTLFlBQVksQ0FBRSxNQUFxQjtnQkFFdkMsTUFBTSxNQUFNLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQTtnQkFDNUIsT0FBTyxDQUFDLEdBQUcsQ0FBRyxNQUFNLENBQUUsQ0FBQTtnQkFDdEIsT0FBTyxHQUFHLE1BQU0sQ0FBRSxTQUFTLENBQXFCLENBQUE7Z0JBRWhELElBQUssT0FBTyxJQUFJLFNBQVM7b0JBQ3BCLE9BQU07Z0JBRVgsT0FBTyxHQUFLLE1BQU0sQ0FBQyxJQUFJLENBQUE7Z0JBQ3ZCLE9BQU8sR0FBSyxNQUFNLENBQUMsR0FBRyxDQUFBO2dCQUN0QixTQUFTLEdBQUcsRUFBRSxDQUFBO2dCQUVkLEtBQU0sTUFBTSxDQUFDLElBQUksT0FBTztvQkFDbkIsU0FBUyxDQUFDLElBQUksQ0FBRSxDQUFFLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBRSxDQUFDLENBQUE7Z0JBRXZDLE9BQU8sQ0FBQyxHQUFHLENBQUUsU0FBUyxDQUFDLENBQUE7YUFDM0I7WUFFRCxJQUFJLENBQUMsRUFBRSxDQUFHLG1CQUFtQixFQUFFLFlBQVksQ0FBRSxDQUFBO1lBQzdDLElBQUksQ0FBQyxFQUFFLENBQUcsbUJBQW1CLEVBQUUsWUFBWSxDQUFFLENBQUE7WUFFN0MsSUFBSSxDQUFDLEVBQUUsQ0FBRyxlQUFlLEVBQUUsTUFBTTtnQkFFNUIsSUFBSyxPQUFPLElBQUksU0FBUztvQkFDcEIsT0FBTTtnQkFFWCxNQUFNLE1BQU0sR0FBSyxNQUFNLENBQUMsTUFBTSxDQUFBO2dCQUM5QixNQUFNLE9BQU8sR0FBSSxNQUFNLENBQUMsSUFBSSxHQUFHLE9BQU8sQ0FBQTtnQkFDdEMsTUFBTSxPQUFPLEdBQUksTUFBTSxDQUFDLEdBQUcsR0FBSSxPQUFPLENBQUE7Z0JBRXRDLEtBQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFHLENBQUMsR0FBRyxPQUFPLENBQUMsTUFBTSxFQUFHLENBQUMsRUFBRSxFQUMxQztvQkFDSyxNQUFNLEdBQUcsR0FBRyxPQUFPLENBQUUsQ0FBQyxDQUFDLENBQUE7b0JBQ3ZCLE1BQU0sR0FBRyxHQUFHLFNBQVMsQ0FBRSxDQUFDLENBQUMsQ0FBQTtvQkFDekIsR0FBRyxDQUFDLEdBQUcsQ0FBRTt3QkFDSixJQUFJLEVBQUUsR0FBRyxDQUFFLENBQUMsQ0FBQyxHQUFHLE9BQU87d0JBQ3ZCLEdBQUcsRUFBRyxHQUFHLENBQUUsQ0FBQyxDQUFDLEdBQUcsT0FBTztxQkFDM0IsQ0FBQyxDQUFBO2lCQUNOO2FBQ0wsQ0FBQyxDQUFBO1lBRUYsSUFBSSxDQUFDLEVBQUUsQ0FBRyxtQkFBbUIsRUFBRSxNQUFNO2dCQUVoQyxPQUFPLEdBQUcsU0FBUyxDQUFBO2dCQUVuQixPQUFPLENBQUMsR0FBRyxDQUFFLFNBQVMsQ0FBQyxDQUFBO2FBQzNCLENBQUMsQ0FBQTtTQUNOO1FBRU8sYUFBYTs7O1lBS2hCLE1BQU0sSUFBSSxHQUFRLElBQUksQ0FBQyxPQUFPLENBQUE7WUFFOUIsSUFBSSxDQUFDLEVBQUUsQ0FBRyxZQUFZLEVBQUUsTUFBTTs7Z0JBR3pCLE9BQU8sQ0FBQyxHQUFHLENBQUcsWUFBWSxDQUFFLENBQUE7YUFDaEMsQ0FBQyxDQUFBO1lBRUYsSUFBSSxDQUFDLEVBQUUsQ0FBRyxXQUFXLEVBQUUsTUFBTTs7YUFHNUIsQ0FBQyxDQUFBO1lBRUYsSUFBSSxDQUFDLEVBQUUsQ0FBRyxVQUFVLEVBQUUsTUFBTTs7YUFHM0IsQ0FBQyxDQUFBO1lBRUYsSUFBSSxDQUFDLEVBQUUsQ0FBRyxNQUFNLEVBQUUsTUFBTTs7O2FBSXZCLENBQUMsQ0FBQTtTQUNOO0tBQ0w7O0lDeGlCTSxNQUFNLElBQUksR0FBSSxDQUFDO1FBRWpCLE1BQU0sTUFBTSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUcsUUFBUSxDQUFFLENBQUE7UUFFbEQsTUFBTSxDQUFDLEtBQUssR0FBSSxRQUFRLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQTtRQUN6QyxNQUFNLENBQUMsTUFBTSxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFBO1FBRTFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFHLE1BQU0sQ0FBRSxDQUFBO1FBRS9CLE9BQU8sSUFBSSxJQUFJLENBQUcsTUFBTSxDQUFFLENBQUE7SUFDL0IsQ0FBQyxHQUFJLENBQUE7QUFFTCxJQUFPLE1BQU0sY0FBYyxHQUFHLElBQUksVUFBVSxDQUFFO1FBQ3pDLE9BQU8sRUFBRSxZQUFZO1FBQ3JCLElBQUksRUFBRSxhQUFhO1FBQ25CLEVBQUUsRUFBRSxXQUFXO1FBQ2YsT0FBTyxFQUFFO1lBQ0osRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLEVBQUUsRUFBRSxXQUFXLEVBQUcsSUFBSSxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLFVBQVUsRUFBRSxnQkFBZ0IsRUFBRSxRQUFRLEVBQUUsUUFBUSxVQUFVLENBQUcsY0FBYyxDQUFFLENBQUEsRUFBRSxFQUFFO1lBQ2pKLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxFQUFFLEVBQUUsWUFBWSxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRSxVQUFVLEVBQUUsZ0JBQWdCLEVBQUU7WUFDOUYsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLEVBQUUsRUFBRSxVQUFVLEVBQUksSUFBSSxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLFVBQVUsRUFBRSxnQkFBZ0IsRUFBRSxPQUFPLEVBQUUsV0FBVyxFQUFFO1lBQ3BILEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxFQUFFLEVBQUUsWUFBWSxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRSxVQUFVLEVBQUUsZ0JBQWdCLEVBQUU7WUFDOUYsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLEVBQUUsRUFBRSxTQUFTLEVBQUssSUFBSSxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLFVBQVUsRUFBRSxnQkFBZ0IsRUFBRTtTQUMzRjtRQUNSLFFBQVEsRUFBRSxJQUFJLENBQUMsRUFBRSxHQUFDLENBQUM7S0FDdkIsQ0FBQyxDQUFBO0lBRUYsUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUcsR0FBSSxjQUFjLENBQUMsT0FBTyxFQUFHLENBQUUsQ0FBQTtJQWV0RCxVQUFVLENBQUcscUJBQXFCLEVBQUUsQ0FBRSxDQUFTLEVBQUUsQ0FBUztRQUVyRCxjQUFjLENBQUMsSUFBSSxDQUFHLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQTtJQUNqQyxDQUFDLENBQUMsQ0FBQTtJQUVGLFVBQVUsQ0FBRyxzQkFBc0IsRUFBRTtRQUVoQyxjQUFjLENBQUMsSUFBSSxFQUFHLENBQUE7SUFDM0IsQ0FBQyxDQUFDLENBQUE7SUFFRixVQUFVLENBQUcsV0FBVyxFQUFFLENBQUUsS0FBSztRQUU1QixPQUFPLENBQUMsR0FBRyxDQUFHLFdBQVcsQ0FBRSxDQUFBO0lBQ2hDLENBQUMsQ0FBQyxDQUFBO0lBRUYsVUFBVSxDQUFHLFlBQVksRUFBRSxDQUFFLElBQUk7SUFHakMsQ0FBQyxDQUFDLENBQUE7SUFFRixVQUFVLENBQUcsY0FBYyxFQUFFO1FBRXhCLElBQUksQ0FBQyxJQUFJLEVBQUcsQ0FBQTtJQUNqQixDQUFDLENBQUMsQ0FBQTtJQUVGLFVBQVUsQ0FBRyxTQUFTLEVBQUUsQ0FBRSxLQUFLO1FBRTFCLElBQUksQ0FBQyxJQUFJLENBQUcsS0FBSyxDQUFFLENBQUE7UUFDbkIsSUFBSSxDQUFDLE9BQU8sQ0FBRyxLQUFLLENBQUUsQ0FBQTtJQUMzQixDQUFDLENBQUMsQ0FBQTtJQUVGLFVBQVUsQ0FBRyxXQUFXLEVBQUU7UUFFckIsSUFBSSxDQUFDLElBQUksRUFBRyxDQUFBO0lBQ2pCLENBQUMsQ0FBQyxDQUFBO0lBRUY7SUFFQTtJQUNBO0lBQ0E7SUFDQTtJQUVBLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxDQUFFLEtBQUs7UUFFN0IsSUFBSyxLQUFLLENBQUMsTUFBTSxDQUFDLE9BQU8sSUFBSSxTQUFTO1lBQ2pDLEtBQUssQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFHLEtBQUssQ0FBRSxDQUFBO0lBQ3hDLENBQUMsQ0FBQTtJQUVELElBQUksQ0FBQyxXQUFXLEdBQUcsQ0FBRSxDQUFDLEVBQUUsQ0FBQztRQUVwQixVQUFVLENBQUcscUJBQXFCLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFBO0lBQy9DLENBQUMsQ0FBQTtJQUVEO0lBRUEsSUFBSSxDQUFDLFlBQVksR0FBRyxDQUFFLEtBQUs7UUFFdEIsS0FBSyxDQUFDLEtBQUssQ0FBRyxJQUFJLENBQUUsQ0FBQTtRQUNwQixJQUFJLENBQUMsT0FBTyxDQUFDLGdCQUFnQixFQUFHLENBQUE7SUFDckMsQ0FBQyxDQUFBO0lBRUQsSUFBSSxDQUFDLFdBQVcsR0FBRyxDQUFFLEtBQUs7UUFFckIsS0FBSyxDQUFDLEtBQUssQ0FBRyxLQUFLLENBQUUsQ0FBQTtRQUNyQixJQUFJLENBQUMsT0FBTyxDQUFDLGdCQUFnQixFQUFHLENBQUE7SUFDckMsQ0FBQyxDQUFBO0lBRUQ7SUFFQSxJQUFLLFNBQVMsQ0FBQyxjQUFjLEdBQUcsQ0FBQyxFQUNqQztRQUVLLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBRyxhQUFhLEVBQUUsS0FBSzs7OztTQUs3QyxDQUFDLENBQUE7S0FDTjtTQUVEO1FBQ0ssTUFBTSxDQUFDLGdCQUFnQixDQUFHLFdBQVcsRUFBRSxLQUFLOzs7O1NBSzNDLENBQUMsQ0FBQTtLQUNOOztJQ2hHRCxTQUFTLENBQUcsV0FBVyxFQUFFO1FBRXBCLEtBQUssQ0FBQyxLQUFLLEVBQUcsQ0FBQTtRQUNkLGNBQWMsQ0FBQyxJQUFJLEVBQUcsQ0FBQTtJQUMzQixDQUFDLENBQUMsQ0FBQTtJQUNGLFNBQVMsQ0FBRyxZQUFZLEVBQUU7UUFFckIsSUFBSSxDQUFDLEtBQUssRUFBRyxDQUFBO1FBQ2IsY0FBYyxDQUFDLElBQUksRUFBRyxDQUFBO0lBQzNCLENBQUMsQ0FBQyxDQUFBOztJQ2pERjtBQUdBLElBRUEsTUFBTSxTQUFTLEdBQUcsQ0FBQyxHQUFXLEVBQUUsR0FBVztRQUV0QyxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxJQUFJLEdBQUcsR0FBRyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUM7SUFDOUQsQ0FBQyxDQUFBO0lBRUQsTUFBTUMsTUFBSSxHQUFHQyxJQUFRLENBQUE7SUFDckIsTUFBTSxJQUFJLEdBQUdELE1BQUksQ0FBQyxVQUFVLENBQUcsYUFBYSxDQUFFLENBQUE7QUFDOUNBLFVBQUksQ0FBQyxHQUFHLENBQUcsSUFBSSxDQUFFLENBQUE7SUFFakI7SUFFQSxNQUFNLFdBQVcsR0FBRyxFQUFFLENBQUE7SUFDdEIsS0FBTSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUcsQ0FBQyxJQUFJLEVBQUUsRUFBRyxDQUFDLEVBQUUsRUFDL0I7UUFDS0UsT0FBVyxDQUFZO1lBQ2xCLElBQUksRUFBTyxRQUFRO1lBQ25CLEVBQUUsRUFBUyxNQUFNLEdBQUcsQ0FBQztZQUNyQixTQUFTLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUc7WUFDbEMsUUFBUSxFQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFHO1lBQ2pDLE1BQU0sRUFBSyxnQkFBZ0IsQ0FBQyxPQUFPO1lBQ25DLFNBQVMsRUFBRSxTQUFTLENBQUUsQ0FBQyxFQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7U0FDbkMsQ0FBQyxDQUFBO1FBRUZBLE9BQVcsQ0FBWTtZQUNsQixJQUFJLEVBQU8sUUFBUTtZQUNuQixFQUFFLEVBQVMsTUFBTSxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDNUIsU0FBUyxFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFHO1lBQ2xDLFFBQVEsRUFBRyxLQUFLLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRztZQUNqQyxNQUFNLEVBQUssZ0JBQWdCLENBQUMsT0FBTztZQUNuQyxTQUFTLEVBQUUsU0FBUyxDQUFFLENBQUMsRUFBQyxDQUFDLENBQUMsSUFBSSxDQUFDO1NBQ25DLENBQUMsQ0FBQTtRQUVGLFdBQVcsQ0FBQyxJQUFJLENBQUcsTUFBTSxHQUFHLENBQUMsRUFBRSxNQUFNLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFFLENBQUE7OztLQUl0RDtJQUVEO0lBRUE7SUFDQTtJQUNBO0lBRUE7SUFFQSxNQUFNLFlBQVksR0FBRztRQUNoQixPQUFPLEVBQVMsRUFBRSxFQUFFLEVBQUUsU0FBUyxFQUFRLEtBQUssRUFBRSxJQUFJLEVBQUU7UUFDcEQsR0FBRyxFQUFhLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBWSxLQUFLLEVBQUUsSUFBSSxFQUFFO1FBQ3BELElBQUksRUFBWSxFQUFFLEVBQUUsRUFBRSxNQUFNLEVBQVcsS0FBSyxFQUFFLEdBQUcsRUFBRTtRQUNuRCxPQUFPLEVBQVMsRUFBRSxFQUFFLEVBQUUsU0FBUyxFQUFRLEtBQUssRUFBRSxJQUFJLEVBQUU7UUFDcEQsT0FBTyxFQUFTLEVBQUUsRUFBRSxFQUFFLFNBQVMsRUFBUSxLQUFLLEVBQUUsSUFBSSxFQUFFO1FBQ3BELFdBQVcsRUFBSyxFQUFFLEVBQUUsRUFBRSxhQUFhLEVBQUksS0FBSyxFQUFFLElBQUksRUFBRTtRQUNwRCxhQUFhLEVBQUcsRUFBRSxFQUFFLEVBQUUsZUFBZSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUU7UUFDcEQsWUFBWSxFQUFJLEVBQUUsRUFBRSxFQUFFLGNBQWMsRUFBRyxLQUFLLEVBQUUsSUFBSSxFQUFFO1FBQ3BELE9BQU8sRUFBUyxFQUFFLEVBQUUsRUFBRSxTQUFTLEVBQVEsS0FBSyxFQUFFLElBQUksRUFBRTtRQUNwRCxPQUFPLEVBQVMsRUFBRSxFQUFFLEVBQUUsU0FBUyxFQUFRLEtBQUssRUFBRSxJQUFJLEVBQUU7UUFDcEQsSUFBSSxFQUFZLEVBQUUsRUFBRSxFQUFFLE1BQU0sRUFBVyxLQUFLLEVBQUUsSUFBSSxFQUFFO1FBQ3BELEtBQUssRUFBVyxFQUFFLEVBQUUsRUFBRSxPQUFPLEVBQVUsS0FBSyxFQUFFLElBQUksRUFBRTtRQUNwRCxJQUFJLEVBQVksRUFBRSxFQUFFLEVBQUUsTUFBTSxFQUFXLEtBQUssRUFBRSxJQUFJLEVBQUU7UUFDcEQsT0FBTyxFQUFTLEVBQUUsRUFBRSxFQUFFLFNBQVMsRUFBUSxLQUFLLEVBQUUsR0FBRyxFQUFFO0tBQ3ZELENBQUE7SUFFRCxLQUFNLE1BQU0sSUFBSSxJQUFJLFlBQVk7UUFDM0JBLE9BQVcsaUJBQUksT0FBTyxFQUFFLGNBQWMsRUFBRSxJQUFJLEVBQUUsT0FBTyxJQUFNLFlBQVksQ0FBRSxJQUFJLENBQUMsRUFBRyxDQUFBO0lBRXRGO0lBRUEsS0FBTSxNQUFNLElBQUksSUFBSSxZQUFZLEVBQ2hDO1FBQ0ssTUFBTSxNQUFNLEdBQUcsRUFBZ0IsQ0FBQTtRQUUvQixLQUFNLElBQUksQ0FBQyxHQUFHLFNBQVMsQ0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFFLEVBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRyxDQUFDLEVBQUUsRUFDOUM7WUFDSyxNQUFNLElBQUksR0FBRyxXQUFXLENBQUMsTUFBTSxDQUFHLFNBQVMsQ0FBRyxDQUFDLEVBQUUsV0FBVyxDQUFDLE1BQU0sQ0FBRSxFQUFFLENBQUMsQ0FBRSxDQUFFLENBQUMsQ0FBQyxDQUFBO1lBRTlFLElBQUssSUFBSTtnQkFDSixNQUFNLENBQUMsSUFBSSxDQUFHQyxPQUFXLENBQWEsUUFBUSxFQUFFLElBQUksQ0FBRSxDQUFFLENBQUE7U0FDakU7UUFFREQsT0FBVyxDQUFXO1lBQ2pCLE9BQU8sRUFBRSxjQUFjO1lBQ3ZCLElBQUksRUFBSyxPQUFPO1lBQ2hCLEVBQUUsRUFBTyxJQUFJO1lBQ2IsSUFBSSxFQUFLLElBQUk7WUFDYixLQUFLLEVBQUksTUFBTTtTQUNuQixDQUFDLENBQUE7S0FFTjtJQUVEO0lBRUEsS0FBTSxNQUFNLElBQUksSUFBSSxZQUFZO1FBQzNCRixNQUFJLENBQUMsR0FBRyxDQUFHLE9BQU8sRUFBRSxJQUFJLENBQUUsQ0FBQTtJQUUvQjtJQUVBO0lBQ0E7SUFDQTtJQUNBO0FBR0FBLFVBQUksQ0FBQyxJQUFJLEVBQUcsQ0FBQTtBQUNaQSxVQUFJLENBQUMsSUFBSSxFQUFHLENBQUE7SUFHWjtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQSx5QkFBeUI7Ozs7In0=
