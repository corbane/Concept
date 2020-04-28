(function () {
    'use strict';

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

    class Component {
        constructor(data) {
            this.data = Object.assign(this.defaultData(), createNode(data.type, data.id, data));
        }
        defaultData() {
            return {
                context: CONTEXT_UI,
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
    }

    Object.defineProperty(globalThis, "CONTEXT_UI", {
        enumerable: false,
        configurable: false,
        writable: false,
        value: "concept-ui"
    });
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
    const define = factory.define.bind(factory);
    // Utilities
    function isNode(obl) {
        return typeof obl == "object" && !Array.isArray(obl);
    }
    function normalize(arg) {
        if (Array.isArray(arg)) {
            if (arg[0] !== CONTEXT_UI)
                arg.unshift(CONTEXT_UI);
        }
        else if (typeof arg == "object") {
            if ("context" in arg) {
                if (arg.context !== CONTEXT_UI)
                    throw "Bad context value";
            }
            else {
                arg.context = CONTEXT_UI;
            }
        }
        return arg;
    }

    class PersonViewer extends Component {
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
    define(PersonViewer, {
        context: CONTEXT_UI,
        type: "person-viewer",
        id: undefined,
        position: "left",
        button: null
    });

    const fabric_base_obtions = {
        left: 0,
        top: 0,
        originX: "center",
        originY: "center",
    };
    function group(def, size, opt) {
        return new fabric.Group(undefined, Object.assign(Object.assign(Object.assign({}, fabric_base_obtions), opt), { width: size, height: size }));
    }
    // To get points of triangle, square, [panta|hexa]gon
    //
    // var a = Math.PI*2/4
    // for ( var i = 0 ; i != 4 ; i++ )
    //     console.log ( `[ ${ Math.sin(a*i) }, ${ Math.cos(a*i) } ]` )
    function circle(def, size, opt) {
        return new fabric.Circle(Object.assign(Object.assign(Object.assign({}, fabric_base_obtions), opt), { radius: size / 2 }));
    }
    function triangle(def, size, opt) {
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
    }
    function square(def, size, opt) {
        const scale = 0.9;
        return new fabric.Rect(Object.assign(Object.assign(Object.assign({}, fabric_base_obtions), opt), { width: size * scale, height: size * scale }));
    }
    function pantagon(def, size, opt) {
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
    }
    function hexagon(def, size, opt) {
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
    }
    function text(def, size, opt) {
        return new fabric.Text("...", Object.assign(Object.assign(Object.assign({}, fabric_base_obtions), opt), { fontSize: size }));
    }
    function textbox(def, size, opt) {
        return new fabric.Textbox("...", Object.assign(Object.assign(Object.assign({}, fabric_base_obtions), opt), { fontSize: size }));
    }
    function path(def, size, opt) {
        return new fabric.Path(def.path, Object.assign(Object.assign(Object.assign({}, fabric_base_obtions), opt), { scaleX: size / 100, scaleY: size / 100 }));
    }
    const Factory$1 = {
        group,
        circle,
        triangle,
        square,
        pantagon,
        hexagon,
        text,
        textbox,
        path,
    };
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

    class Shape {
        constructor(data) {
            this.group = undefined;
            this.background = undefined;
            this.border = undefined;
            this.config = Object.assign(Object.assign({}, this.defaultConfig()), data);
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
            group.set({ left: x, top: y }).setCoords();
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

    const CONTEXT = "concept-aspect";
    const db$1 = new Database();
    const factory$1 = new Factory(db$1);
    const ASPECT = Symbol.for("ASPECT");
    function get(obj) {
        if (obj == undefined)
            return undefined;
        if (obj instanceof Shape)
            return obj;
        if (obj instanceof fabric.Object)
            return obj[ASPECT];
        if (factory$1.inStock(CONTEXT, obj.type, obj.id))
            return factory$1.make(CONTEXT, obj.type, obj.id);
        const options = obj.context == CONTEXT
            ? obj
            : {
                context: CONTEXT,
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
    function set$1(node) {
        db$1.set(normalize$1(node));
    }
    function define$1(ctor, type) {
        factory$1._define(ctor, [CONTEXT, type]);
    }
    function normalize$1(node) {
        if ("context" in node) {
            if (node.context !== CONTEXT)
                throw "Bad context value";
        }
        else {
            node.context = CONTEXT;
        }
        return node;
    }

    // <reference path="../Application/nodes.d.ts" />
    Object.defineProperty(globalThis, "CONTEXT_DATA", {
        configurable: false,
        writable: false,
        value: "concept-data"
    });
    const db$2 = new Database();
    function data(a, b) {
        switch (arguments.length) {
            case 1: // data ( description )
                if (typeof a != "object" || a == null || Array.isArray(a))
                    throw `Bad argument "description" : ${a}`;
                b = a;
                a = b.type;
            case 2: // data ( type, id ) | data ( type, description )
                if (typeof a != "string")
                    throw `Bad argument "type" : ${a}`;
                if (typeof b == "string")
                    return db$2.get(CONTEXT_DATA, a, b);
                if (typeof b != "object" || b == null || Array.isArray(b))
                    throw `Bad argument "description" : ${b}`;
                b.context = CONTEXT_DATA;
                b.type = a;
                return db$2.set(b);
            default:
                throw `Bad arguments: 2 arguments expected but ${arguments.length} received`;
        }
    }
    function alias(fn, type) {
        switch (fn.name) {
            case "data": return create(CONTEXT_DATA, type);
        }
    }
    function create(context, type) {
        // fn ( id )
        // fn ( description )
        // fn ( id, description )
        return ((id, description) => {
            if (arguments.length == 1) {
                if (typeof id != "string")
                    throw `Bag id: ${id}`;
                return db$2.get(context, type, id);
            }
            if (typeof id != "string") {
                description = id;
                if (typeof description.id != "string")
                    throw `Bag argument "description": invalid id`;
                id = description.id;
            }
            if (typeof description != "object" || description == null || isArray(description))
                throw `Bag argument "description" : id not found`;
            return db$2.set(Object.assign(Object.assign({}, description), { context, type, id: id }));
        });
    }
    const isArray = Array.isArray;

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
                //const node = db.getNode ( ... arguments as any as string [] )
                const node = data(arguments[0], arguments[1]);
                const shp = get(node);
                active.children.push(shp);
                fcanvas.add(shp.group);
            }
            else
                for (const s of arguments) {
                    const shp = get(s);
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
        /* TODO

        grid ?

             options = {
                  distance: 10,
                  width: c.width,
                  height: c.height,
                  param: {
                       stroke: '#ebebeb',
                       strokeWidth: 1,
                       selectable: false
                  }
             }
             gridLen = options.width / options.distance;

             c = canvas
             for (var i = 0; i < gridLen; i++)
             {
                  var distance   = i * options.distance,
                       horizontal = new fabric.Line([ distance, 0, distance, options.width], options.param),
                       vertical   = new fabric.Line([ 0, distance, options.width, distance], options.param);
                  c.add(horizontal);
                  c.add(vertical);
                  if ( i%5 === 0 )
                  {
                       horizontal.set({stroke: '#cccccc'});
                       vertical.set({stroke: '#cccccc'});
                  };
             };

        */
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
                        const element = get(fevent.target);
                        Area.currentEvent = fevent;
                        if (element)
                            this.onTouchObject(element);
                        Area.currentEvent = null;
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
                        const element = get(fevent.target);
                        Area.currentEvent = fevent;
                        if (element)
                            this.onDoubleTouchObject(element);
                        Area.currentEvent = null;
                    }
                    last_click = -1;
                }
                // Si le pointer est au-dessus d’une zone vide.
                else {
                    Area.currentEvent = fevent;
                    if (this.onTouchArea)
                        this.onTouchArea(pos.x, pos.y);
                    Area.currentEvent = null;
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
                    const element = get(fevent.target);
                    Area.currentEvent = fevent;
                    if (element)
                        this.onOverObject(element);
                    Area.currentEvent = null;
                }
            });
            page.on("mouse:out", fevent => {
                this.overFObject = undefined;
                if (this.onOutObject) {
                    const element = get(fevent.target);
                    Area.currentEvent = fevent;
                    if (element)
                        this.onOutObject(element);
                    Area.currentEvent = null;
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

    const cmds = {};
    class Command {
        constructor(callback) {
            this.callback = callback;
        }
        run() {
            try {
                this.callback(Area.currentEvent);
            }
            catch (error) {
            }
        }
    }
    function command(name, callback) {
        if (typeof callback == "function") {
            if (name in cmds)
                return;
            cmds[name] = new Command(callback);
        }
        return cmds[name];
    }

    class Button extends Component {
        /** @override */
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
                //Commands.current.run ( this.data.command )
                command(this.data.command).run();
        }
        onHover() {
        }
    }
    define(Button, [CONTEXT_UI, "button"]);
    set(["button"], {
        type: "button",
        id: undefined,
        icon: undefined,
    });

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
        /** @override */
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
                for (const child of data.children) {
                    const o = pick(child);
                    slot.append(...o.getHtml());
                    children[o.data.id] = o;
                }
                //this.onChildrenAdded ( new_children )
            }
            return elements;
        }
        //onChildrenAdded ( components: Component [] )
        //{
        //}
        append(...elements) {
            if (this.container == undefined)
                this.getHtml();
            const slot = this.slot;
            const children = this.children;
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
                    e = inStock(e) ? pick(e) : make(e);
                }
                children[e.data.id] = e;
                slot.append(...e.getHtml());
            }
            //if ( new_child.length > 0 )
            //     this.onChildrenAdded ( new_child )
        }
        remove(...elements) {
            const slot = this.slot;
            const children = this.children;
            for (var e of elements) {
                if (e.data.id in children) {
                    e.container.remove();
                    delete children[e.data.id];
                }
            }
        }
        clear() {
            this.children = {};
            if (this.container)
                this.container.innerHTML = "";
        }
    }
    class Phantom extends Component {
        /** @override */
        getHtml() {
            if (this.container == undefined) {
                this.container = document.createElement("div");
                this.container.innerHTML = this.data.content;
            }
            return this.container.childNodes;
        }
    }

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

    class ListView extends Container {
        /** @override */
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
        // onChildrenAdded ( elements: Component [] )
        // {
        //      this.swipeable.updateConfig ({
        //           minSize  : -this.slideSize (),
        //           property : this.is_vertical ? "top": "left",
        //           direction: this.data.direction,
        //      })
        // }
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
        /** @override */
        getHtml() {
            if (this.container != undefined)
                return [this.container];
            super.getHtml();
            if (this.data.buttons)
                this.append(...this.data.buttons);
            return [this.container];
        }
    }
    define(Toolbar, [CONTEXT_UI, "toolbar"]);
    // type Direction = "lr" | "rl" | "tb" | "bt"
    //
    // type Units = "px" | "%"
    //
    // const toFlexDirection = {
    //      lr: "row"            as "row",
    //      rl: "row-reverse"    as "row-reverse",
    //      tb: "column"         as "column",
    //      bt: "column-reverse" as "column-reverse",
    // }
    //
    // const toReverse = {
    //      lr: "rl" as "rl",
    //      rl: "lr" as "lr",
    //      tb: "bt" as "bt",
    //      bt: "tb" as "tb",
    // }

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

    const toPosition = {
        lr: "left",
        rl: "right",
        tb: "top",
        bt: "bottom",
    };
    class SideMenu extends Container {
        /** @override */
        getHtml() {
            const data = this.data;
            const header = xnode("div", { class: "side-menu-header" });
            const content = xnode("div", { class: "side-menu-content" });
            const container = xnode("div", { class: "side-menu close" },
                header,
                content);
            this.toolbar = new Toolbar({
                context: CONTEXT_UI,
                type: "toolbar",
                id: data.id + "-toolbar",
                direction: data.direction == "lr" || data.direction == "rl" ? "tb" : "lr",
                title: null,
                buttons: data.buttons,
                children: null,
            });
            header.append(...this.toolbar.getHtml());
            // data.additionalButtons
            // if ( data.buttons )
            // {
            //      for ( const child of data.buttons )
            //           this.header.append ( child )
            // }
            if (data.hasMainButton) {
                const btn = xnode("span", { class: "side-menu-main-button" },
                    xnode("span", { class: "icon" }, "\u21D5"));
                this.main_button = btn;
                header.insertAdjacentElement("afterbegin", btn);
            }
            this.slideshow = new Slideshow({
                context: CONTEXT_UI,
                type: "slideshow",
                id: data.id + "-slideshow",
                direction: data.direction,
                isSwipeable: false,
                children: []
            });
            content.append(...this.slideshow.getHtml());
            if (data.children) {
                for (const child of data.children) {
                    this.slideshow.append(child);
                    if (child.button)
                        this.toolbar.append(child.button);
                }
            }
            container.classList.add(toPosition[data.direction]);
            scollable({ handles: [content], direction: "bt" }).activate();
            this.container = container;
            this.expandable = expandable(this.container, {
                direction: data.direction,
                near: 60,
                handles: Array.of(this.main_button),
                onAfterOpen: () => content.classList.remove("hidden"),
                onBeforeClose: () => content.classList.add("hidden")
            });
            this.expandable.activate();
            return [this.container];
        }
        /** @override */
        append(...elements) {
            this.slideshow.append(...elements);
        }
        /** @override */
        remove(...elements) {
            this.slideshow.remove(...elements);
        }
        open() {
        }
        close() {
            this.expandable.close();
            return this;
        }
    }
    class Slideshow extends Container {
        constructor() {
            super(...arguments);
            this.children = {};
        }
        /** @override */
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
    }
    define(SideMenu, [CONTEXT_UI, "side-menu"]);
    define(Slideshow, [CONTEXT_UI, "slideshow"]);
    define(Container, [CONTEXT_UI, "slide"]);

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

    /*
    Jolie ce petit menu contextuel,
    mais niveau rapidité d'affichage ce n'est pas bon du tout ...
    */
    const G = Geometry;
    class RadialMenu extends Component {
        constructor() {
            super(...arguments);
            this.renderers = {
                "circle": this.renderSvgCircles.bind(this)
            };
        }
        /** @override */
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

    class Panel extends Component {
        placeTo(side) {
            const data = this.data;
            if (data.position == side && this.menu != null)
                return;
            const cfg = {
                context: "concept-ui",
                type: "side-menu",
                hasMainButton: true,
            };
            var menu;
            switch (side) {
                case "left":
                    if (SideMenu.atLeft == null)
                        SideMenu.atLeft = new SideMenu(Object.assign({ id: "side-menu-left", direction: "lr" }, cfg));
                    menu = SideMenu.atLeft;
                    break;
                case "right":
                    if (SideMenu.atRight == null)
                        SideMenu.atRight = new SideMenu(Object.assign({ id: "side-menu-right", direction: "rl" }, cfg));
                    menu = SideMenu.atRight;
                    break;
                case "top":
                    if (SideMenu.atTop == null)
                        SideMenu.atTop = new SideMenu(Object.assign({ id: "side-menu-top", direction: "tb" }, cfg));
                    menu = SideMenu.atTop;
                    break;
                case "bottom":
                    if (SideMenu.atBottom == null)
                        SideMenu.atBottom = new SideMenu(Object.assign({ id: "side-menu-bottom", direction: "bt" }, cfg));
                    menu = SideMenu.atBottom;
                    break;
            }
            if (this.menu != undefined)
                this.menu.remove(this);
            menu.append(this);
            data.position = side;
        }
        open() {
            this.menu.clear();
            this.menu.append(this);
            this.menu.open();
        }
        close() {
            this.menu.close();
        }
    }

    class SkillViewer extends Panel {
        display(skill) {
            const target = xnode("div", { class: "people" });
            for (const item of skill.items) {
                const person = data(item.type, item.id);
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
        context: CONTEXT_UI,
        type: "skill-viewer",
        id: undefined,
        position: "left",
        button: null
    });

    class Badge extends Shape {
        constructor(options) {
            super(options);
            this.owner = undefined;
            this.position = { angle: 0, offset: 0 };
            const { group } = this;
            const thisdata = this.config.data;
            const entity = data(thisdata.type, thisdata.id);
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

    class Group extends Shape {
        constructor(options) {
            super(options);
            this.display_size = 1;
            this.children = [];
            const entity = this.config.data;
            for (const child of Object.values(entity.items)) {
                const a = get(child);
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

    define$1(Shape, "person");
    define$1(Group, "skill");
    define$1(Badge, "badge");
    set$1({
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
    set$1({
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
            const node = data("badge", skill.icon);
            const badge = get(node);
            badge.attach(aspect);
        },
        onTouch(shape) {
            command("open-infos-panel").run();
        },
        onDelete: undefined
    });
    set$1({
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

    // #region DRAWING AREA
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
            //{ type: "button", id: "add-thing" , text: "", icon: "&#xe3c8;", fontFamily: "Material Icons", callback: () => { runCommand ( "zoom-extends" ) } }, // details
            { type: "button", id: "add-thing", text: "", icon: "&#xe3c8;", fontFamily: "Material Icons" },
            { type: "button", id: "add-bubble", text: "", icon: "&#xe6dd;", fontFamily: "Material Icons" },
            { type: "button", id: "add-note", text: "", icon: "&#xe244;", fontFamily: "Material Icons", command: "pack-view" },
            { type: "button", id: "add-people", text: "", icon: "&#xe87c;", fontFamily: "Material Icons" },
            { type: "button", id: "add-tag", text: "", icon: "&#xe867;", fontFamily: "Material Icons" },
        ],
        rotation: Math.PI / 2,
    });
    document.body.append(...contextualMenu.getHtml());
    // Area events
    area.onDoubleTouchObject = (shape) => {
        if (shape.config.onTouch != undefined)
            shape.config.onTouch(shape);
    };
    area.onTouchArea = (x, y) => {
        command("open-contextal-menu").run();
        //run Command ( "open-contextal-menu", x, y )
    };
    area.onOverObject = (shape) => {
        shape.hover(true);
        area.fcanvas.requestRenderAll();
    };
    area.onOutObject = (shape) => {
        shape.hover(false);
        area.fcanvas.requestRenderAll();
    };
    // Area commands
    command("open-contextal-menu", (e) => {
        contextualMenu.show(e.pointer.x, e.pointer.y);
    });
    command("close-contextal-menu", () => {
        contextualMenu.hide();
    });
    command("add-skill", (title) => {
        console.log("Add skill");
    });
    command("add-person", (name) => {
    });
    command("zoom-extends", () => {
        area.zoom();
    });
    command("zoom-to", (shape) => {
        // area.zoom ( shape )
        // area.isolate ( shape )
    });
    command("pack-view", () => {
        area.pack();
    });
    // test
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
    // #endregion
    // #region MENU
    const menu = make({
        context: CONTEXT_UI,
        type: "side-menu",
        id: "menu",
        hasMainButton: true,
        direction: "bt"
    });
    document.body.append(...menu.getHtml());
    // #endregion
    // #region PANEL
    var direction = "rl";
    const panel = make({
        context: CONTEXT_UI,
        type: "side-menu",
        id: undefined,
        direction: direction,
        hasMainButton: true,
        buttons: [{
                context: CONTEXT_UI,
                type: "button",
                id: "console",
                icon: "⚠",
                text: "",
                handleOn: "*",
                command: "pack-view"
            }],
        children: [{
                context: CONTEXT_UI,
                type: "skill-viewer",
                id: "slide-skill",
                position: "left",
                button: {
                    context: CONTEXT_UI,
                    type: "button",
                    id: "skills",
                    icon: "",
                    text: "Skills",
                    handleOn: "*",
                },
            }, {
                context: CONTEXT_UI,
                type: "person-viewer",
                id: "slide-person",
                position: "left",
                button: {
                    context: CONTEXT_UI,
                    type: "button",
                    id: "properties",
                    icon: "",
                    text: "Properties",
                    handleOn: "*",
                },
            }]
    });
    document.body.append(...panel.getHtml());
    // Pannels commands
    const slideInfos = pick("skill-viewer", "slide-skill");
    command("open-panel", (name, ...content) => {
        // if ( name )
        //      slideshow.show ( name, ... content )
        // else
        //      panel.open ()
    });
    command("open-infos-panel", (e) => {
        const aspect = get(Area.currentEvent.target);
        if (aspect) {
            const skill = data(aspect.config.type, aspect.config.id);
            if (skill) {
                slideInfos.display(skill);
                panel.open();
            }
        }
    });
    command("close-panel", () => {
        panel.close();
    });
    // #endregion
    // #region APPLICATION
    command("open-menu", () => {
        panel.close();
        contextualMenu.hide();
    });
    command("open-panel", () => {
        menu.close();
        contextualMenu.hide();
    });
    // #endregion

    /// <reference types="faker" />
    const randomInt = (min, max) => {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };
    const area$1 = area;
    const view = area$1.createView("compétances");
    area$1.use(view);
    const person = alias(data, "person");
    const badge = alias(data, "badge");
    const skill = alias(data, "skill");
    // Ici on ajoute des personnes à l’application.
    const personNames = [];
    for (var i = 1; i <= 20; i++) {
        person({
            id: "user" + i,
            firstName: faker.name.firstName(),
            lastName: faker.name.lastName(),
            avatar: `./avatars/f (${i}).jpg`,
            isCaptain: randomInt(0, 4) == 1 //i % 4 == 0,
        });
        person({
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
    const badges = [
        badge("default", { emoji: "🦁" }),
        badge("hat", { emoji: "🎩" }),
        badge("star", { emoji: "⭐" }),
        badge("clothes", { emoji: "👕" }),
        badge("ecology", { emoji: "💧" }),
        badge("programming", { emoji: "💾" }),
        badge("communication", { emoji: "📢" }),
        badge("construction", { emoji: "🔨" }),
        badge("biology", { emoji: "🔬" }),
        badge("robotic", { emoji: "🤖" }),
        badge("game", { emoji: "🤡" }),
        badge("music", { emoji: "🥁" }),
        badge("lion", { emoji: "🦁" }),
        badge("voltage", { emoji: "⚡" })
    ];
    // Skills
    //for ( const name in badgePresets )
    for (const badge of badges) {
        const people = [];
        for (var j = randomInt(0, 6); j > 0; j--) {
            const name = personNames.splice(randomInt(1, personNames.length), 1)[0];
            if (name)
                people.push(data("person", name));
        }
        skill({
            id: badge.id,
            icon: badge.id,
            items: people
        });
    }
    //
    for (const badge of badges)
        area$1.add("skill", badge.id);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzIjpbIi4uLy4uL0xpYi9nZW9tZXRyeS9kaXN0cmlidXRlLnRzIiwiLi4vLi4vTGliL2dlb21ldHJ5L2QzLWVuY2xvc2UudHMiLCIuLi8uLi9MaWIvZ2VvbWV0cnkvZDMtcGFjay50cyIsIi4uLy4uL0xpYi9jc3MvdW5pdC50cyIsIi4uLy4uL0RhdGEvbm9kZS50cyIsIi4uLy4uL0RhdGEvZGF0YS10cmVlLnRzIiwiLi4vLi4vRGF0YS9kYi50cyIsIi4uLy4uL0RhdGEvZmFjdG9yeS50cyIsIi4uLy4uL1VpL0Jhc2UveG5vZGUudHMiLCIuLi8uLi9VaS9FbGVtZW50cy9jb21wb25lbnQudHN4IiwiLi4vLi4vVWkvZGIudHMiLCIuLi8uLi9VaS9FbGVtZW50cy9wYW5lbC1wZXJzb24udHN4IiwiLi4vLi4vQXNwZWN0L2dlb21ldHJ5LnRzIiwiLi4vLi4vQXNwZWN0L3NoYXBlLnRzIiwiLi4vLi4vQXNwZWN0L2RiLnRzIiwiLi4vLi4vQXBpL2RhdGEudHMiLCIuLi8uLi9VaS9FbGVtZW50cy9hcmVhLnRzIiwiLi4vLi4vQXBpL2NvbW1hbmQudHMiLCIuLi8uLi9VaS9FbGVtZW50cy9idXR0b24udHN4IiwiLi4vLi4vVWkvRWxlbWVudHMvY29udGFpbmVyLnRzeCIsIi4uLy4uL1VpL0Jhc2UvZHJhZ2dhYmxlLnRzIiwiLi4vLi4vVWkvQmFzZS9kb20udHMiLCIuLi8uLi9VaS9CYXNlL2V4cGVuZGFibGUudHMiLCIuLi8uLi9VaS9FbGVtZW50cy90b29sYmFyLnRzeCIsIi4uLy4uL1VpL0Jhc2Uvc2Nyb2xsYWJsZS50cyIsIi4uLy4uL1VpL0Jhc2Uvc3dpcGVhYmxlLnRzIiwiLi4vLi4vVWkvRWxlbWVudHMvc2lkZU1lbnUudHN4IiwiLi4vLi4vVWkvQmFzZS9zdmcudHN4IiwiLi4vLi4vVWkvRWxlbWVudHMvY2lyY2xlbWVudS50c3giLCIuLi8uLi9VaS9FbGVtZW50cy9wYW5lbC50c3giLCIuLi8uLi9VaS9FbGVtZW50cy9wYW5lbC1za2lsbC50c3giLCIuLi8uLi9Bc3BlY3QvYmFkZ2UudHMiLCIuLi8uLi9Bc3BlY3QvZ3JvdXAudHMiLCIuLi8uLi9BcHBsaWNhdGlvbi9pbml0LWFzcGVjdC50cyIsIi4uLy4uL0FwcGxpY2F0aW9uL2luaXQtdWkudHMiLCIuLi9pbmRleC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJcblxuZXhwb3J0IHR5cGUgUmFkaWFsT3B0aW9uID0ge1xuICAgIHIgICAgICAgIDogbnVtYmVyLFxuICAgIGNvdW50ICAgIDogbnVtYmVyLFxuICAgIHBhZGRpbmc/IDogbnVtYmVyLFxuICAgIHJvdGF0aW9uPzogbnVtYmVyLFxufVxuXG5leHBvcnQgdHlwZSBSYWRpYWxEZWZpbml0aW9uID0gUmVxdWlyZWQgPFJhZGlhbE9wdGlvbj4gJiB7XG4gICAgY3ggICAgOiBudW1iZXIsXG4gICAgY3kgICAgOiBudW1iZXIsXG4gICAgd2lkdGggOiBudW1iZXIsXG4gICAgaGVpZ2h0OiBudW1iZXIsXG4gICAgcG9pbnRzOiBQYXJ0IFtdLFxufVxuXG50eXBlIFBhcnQgPSB7XG4gICAgeCA6IG51bWJlclxuICAgIHkgOiBudW1iZXJcbiAgICBhIDogbnVtYmVyXG4gICAgYTE6IG51bWJlclxuICAgIGEyOiBudW1iZXJcbiAgICBjaG9yZD86IHtcbiAgICAgICAgeDEgICAgOiBudW1iZXJcbiAgICAgICAgeTEgICAgOiBudW1iZXJcbiAgICAgICAgeDIgICAgOiBudW1iZXJcbiAgICAgICAgeTIgICAgOiBudW1iZXJcbiAgICAgICAgbGVuZ3RoOiBudW1iZXJcbiAgICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRSYWRpYWxEaXN0cmlidXRpb24gKCBvcHRpb25zOiBSYWRpYWxPcHRpb24gKVxue1xuICAgIGNvbnN0IHsgUEksIGNvcywgc2luIH0gPSBNYXRoXG5cbiAgICBjb25zdCByICAgICAgICA9IG9wdGlvbnMuciAgICAgICAgfHwgMzBcbiAgICBjb25zdCBjb3VudCAgICA9IG9wdGlvbnMuY291bnQgICAgfHwgMTBcbiAgICBjb25zdCByb3RhdGlvbiA9IG9wdGlvbnMucm90YXRpb24gfHwgMFxuXG4gICAgY29uc3QgcG9pbnRzID0gW10gYXMgUGFydCBbXVxuXG4gICAgY29uc3QgYSAgICAgPSAyICogUEkgLyBjb3VudFxuICAgIGNvbnN0IGNob3JkID0gMiAqIHIgKiBzaW4gKCBhICogMC41IClcbiAgICBjb25zdCBzaXplICA9IHIgKiA0ICsgY2hvcmRcbiAgICBjb25zdCBjICAgICA9IHNpemUgLyAyXG5cbiAgICBmb3IgKCB2YXIgaSA9IDA7IGkgPCBjb3VudDsgKytpIClcbiAgICB7XG4gICAgICAgIGNvbnN0IHN0YXJ0ICA9IGEgKiBpICsgcm90YXRpb25cbiAgICAgICAgY29uc3QgbWlkZGxlID0gc3RhcnQgKyBhICogMC41XG4gICAgICAgIGNvbnN0IGVuZCAgICA9IHN0YXJ0ICsgYVxuXG4gICAgICAgIHBvaW50cy5wdXNoICh7XG4gICAgICAgICAgICBhMSAgIDogc3RhcnQsXG4gICAgICAgICAgICBhICAgIDogbWlkZGxlLFxuICAgICAgICAgICAgYTIgICA6IGVuZCxcbiAgICAgICAgICAgIHggICAgOiBjb3MgKG1pZGRsZSkgKiByICsgYyxcbiAgICAgICAgICAgIHkgICAgOiBzaW4gKG1pZGRsZSkgKiByICsgYyxcbiAgICAgICAgICAgIGNob3JkOiB7XG4gICAgICAgICAgICAgICAgeDE6IGNvcyAoc3RhcnQpICogciArIGMsXG4gICAgICAgICAgICAgICAgeTE6IHNpbiAoc3RhcnQpICogciArIGMsXG4gICAgICAgICAgICAgICAgeDI6IGNvcyAoZW5kKSAgICogciArIGMsXG4gICAgICAgICAgICAgICAgeTI6IHNpbiAoZW5kKSAgICogciArIGMsXG4gICAgICAgICAgICAgICAgbGVuZ3RoOiBjaG9yZFxuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgIH1cblxuICAgIGNvbnN0IHJlc3VsdDogUmFkaWFsRGVmaW5pdGlvbiA9IHtcbiAgICAgICAgcixcbiAgICAgICAgY291bnQsXG4gICAgICAgIHJvdGF0aW9uLFxuICAgICAgICBwYWRkaW5nOiBvcHRpb25zLnBhZGRpbmcgfHwgMCxcbiAgICAgICAgY3ggICAgIDogYyxcbiAgICAgICAgY3kgICAgIDogYyxcbiAgICAgICAgd2lkdGggIDogc2l6ZSxcbiAgICAgICAgaGVpZ2h0IDogc2l6ZSxcbiAgICAgICAgcG9pbnRzXG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdFxufVxuIiwiLy8gaHR0cHM6Ly9vYnNlcnZhYmxlaHEuY29tL0BkMy9kMy1wYWNrZW5jbG9zZT9jb2xsZWN0aW9uPUBvYnNlcnZhYmxlaHEvYWxnb3JpdGhtc1xuLy8gaHR0cHM6Ly9vYnNlcnZhYmxlaHEuY29tL0BkMy9jaXJjbGUtcGFja2luZ1xuLy8gaHR0cHM6Ly9naXRodWIuY29tL2QzL2QzLWhpZXJhcmNoeS9ibG9iL21hc3Rlci9zcmMvcGFjay9lbmNsb3NlLmpzXG5cblxuZXhwb3J0IHR5cGUgQ2lyY2xlID0ge1xuICAgICB4OiBudW1iZXIsXG4gICAgIHk6IG51bWJlcixcbiAgICAgcjogbnVtYmVyXG59XG5cbmNvbnN0IHNsaWNlID0gQXJyYXkucHJvdG90eXBlLnNsaWNlXG5cbmZ1bmN0aW9uIHNodWZmbGUgPFQ+ICggYXJyYXk6IFRbXSApXG57XG4gICAgIHZhciBtID0gYXJyYXkubGVuZ3RoLFxuICAgICAgICAgIHQsXG4gICAgICAgICAgaTogbnVtYmVyXG5cbiAgICAgd2hpbGUgKCBtIClcbiAgICAge1xuICAgICAgICAgIGkgPSBNYXRoLnJhbmRvbSAoKSAqIG0tLSB8IDBcbiAgICAgICAgICB0ID0gYXJyYXkgW21dXG4gICAgICAgICAgYXJyYXkgW21dID0gYXJyYXkgW2ldXG4gICAgICAgICAgYXJyYXkgW2ldID0gdFxuICAgICB9XG5cbiAgICAgcmV0dXJuIGFycmF5XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBlbmNsb3NlICggY2lyY2xlczogQ2lyY2xlW10gKVxue1xuICAgICBjaXJjbGVzID0gc2h1ZmZsZSAoIHNsaWNlLmNhbGwoIGNpcmNsZXMgKSApXG5cbiAgICAgY29uc3QgbiA9IGNpcmNsZXMubGVuZ3RoXG5cbiAgICAgdmFyIGkgPSAwLFxuICAgICBCID0gW10sXG4gICAgIHA6IENpcmNsZSxcbiAgICAgZTogQ2lyY2xlO1xuXG4gICAgIHdoaWxlICggaSA8IG4gKVxuICAgICB7XG4gICAgICAgICAgcCA9IGNpcmNsZXMgW2ldXG5cbiAgICAgICAgICBpZiAoIGUgJiYgZW5jbG9zZXNXZWFrICggZSwgcCApIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBpKytcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIEIgPSBleHRlbmRCYXNpcyAoIEIsIHAgKVxuICAgICAgICAgICAgICAgZSA9IGVuY2xvc2VCYXNpcyAoIEIgKVxuICAgICAgICAgICAgICAgaSA9IDBcbiAgICAgICAgICB9XG4gICAgIH1cblxuICAgICByZXR1cm4gZVxufVxuXG5mdW5jdGlvbiBleHRlbmRCYXNpcyAoIEI6IENpcmNsZVtdLCBwOiBDaXJjbGUgKVxue1xuICAgICB2YXIgaTogbnVtYmVyLFxuICAgICBqOiBudW1iZXJcblxuICAgICBpZiAoIGVuY2xvc2VzV2Vha0FsbCAoIHAsIEIgKSApXG4gICAgICAgICAgcmV0dXJuIFtwXVxuXG4gICAgIC8vIElmIHdlIGdldCBoZXJlIHRoZW4gQiBtdXN0IGhhdmUgYXQgbGVhc3Qgb25lIGVsZW1lbnQuXG4gICAgIGZvciAoIGkgPSAwOyBpIDwgQi5sZW5ndGg7ICsraSApXG4gICAgIHtcbiAgICAgICAgICBpZiAoIGVuY2xvc2VzTm90ICggcCwgQiBbaV0gKVxuICAgICAgICAgICYmIGVuY2xvc2VzV2Vha0FsbCAoIGVuY2xvc2VCYXNpczIgKCBCIFtpXSwgcCApLCBCIClcbiAgICAgICAgICApe1xuICAgICAgICAgICAgICAgcmV0dXJuIFsgQltpXSwgcCBdXG4gICAgICAgICAgfVxuICAgICB9XG5cbiAgICAgLy8gSWYgd2UgZ2V0IGhlcmUgdGhlbiBCIG11c3QgaGF2ZSBhdCBsZWFzdCB0d28gZWxlbWVudHMuXG4gICAgIGZvciAoIGkgPSAwOyBpIDwgQi5sZW5ndGggLSAxOyArK2kgKVxuICAgICB7XG4gICAgICAgICAgZm9yICggaiA9IGkgKyAxOyBqIDwgQi5sZW5ndGg7ICsraiApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgaWYgKCBlbmNsb3Nlc05vdCAgICAoIGVuY2xvc2VCYXNpczIgKCBCIFtpXSwgQiBbal0gICAgKSwgcCApXG4gICAgICAgICAgICAgICAmJiBlbmNsb3Nlc05vdCAgICAoIGVuY2xvc2VCYXNpczIgKCBCIFtpXSwgcCAgICAgICAgKSwgQiBbal0gKVxuICAgICAgICAgICAgICAgJiYgZW5jbG9zZXNOb3QgICAgKCBlbmNsb3NlQmFzaXMyICggQiBbal0sIHAgICAgICAgICksIEIgW2ldIClcbiAgICAgICAgICAgICAgICYmIGVuY2xvc2VzV2Vha0FsbCggZW5jbG9zZUJhc2lzMyAoIEIgW2ldLCBCIFtqXSwgcCApLCBCIClcbiAgICAgICAgICAgICAgICl7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBbIEJbIGkgXSwgQlsgaiBdLCBwIF07XG4gICAgICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICB9XG5cbiAgICAgLy8gSWYgd2UgZ2V0IGhlcmUgdGhlbiBzb21ldGhpbmcgaXMgdmVyeSB3cm9uZy5cbiAgICAgdGhyb3cgbmV3IEVycm9yO1xufVxuXG5mdW5jdGlvbiBlbmNsb3Nlc05vdCAoIGE6IENpcmNsZSwgYjogQ2lyY2xlIClcbntcbiAgICAgY29uc3QgZHIgPSBhLnIgLSBiLnJcbiAgICAgY29uc3QgZHggPSBiLnggLSBhLnhcbiAgICAgY29uc3QgZHkgPSBiLnkgLSBhLnlcblxuICAgICByZXR1cm4gZHIgPCAwIHx8IGRyICogZHIgPCBkeCAqIGR4ICsgZHkgKiBkeTtcbn1cblxuZnVuY3Rpb24gZW5jbG9zZXNXZWFrICggYTogQ2lyY2xlLCBiOiBDaXJjbGUgKVxue1xuICAgICB2YXIgZHIgPSBhLnIgLSBiLnIgKyAxZS02LFxuICAgICBkeCA9IGIueCAtIGEueCxcbiAgICAgZHkgPSBiLnkgLSBhLnlcblxuICAgICByZXR1cm4gZHIgPiAwICYmIGRyICogZHIgPiBkeCAqIGR4ICsgZHkgKiBkeVxufVxuXG5mdW5jdGlvbiBlbmNsb3Nlc1dlYWtBbGwgKCBhOiBDaXJjbGUsIEI6IENpcmNsZVtdIClcbntcbiAgICAgZm9yICggdmFyIGkgPSAwOyBpIDwgQi5sZW5ndGg7ICsraSApXG4gICAgIHtcbiAgICAgICAgICBpZiAoICEgZW5jbG9zZXNXZWFrICggYSwgQltpXSApIClcbiAgICAgICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICB9XG4gICAgIHJldHVybiB0cnVlXG59XG5cbmZ1bmN0aW9uIGVuY2xvc2VCYXNpcyAoIEI6IENpcmNsZVtdIClcbntcbiAgICAgc3dpdGNoICggQi5sZW5ndGggKVxuICAgICB7XG4gICAgICAgICAgY2FzZSAxOiByZXR1cm4gZW5jbG9zZUJhc2lzMSggQiBbMF0gKVxuICAgICAgICAgIGNhc2UgMjogcmV0dXJuIGVuY2xvc2VCYXNpczIoIEIgWzBdLCBCIFsxXSApXG4gICAgICAgICAgY2FzZSAzOiByZXR1cm4gZW5jbG9zZUJhc2lzMyggQiBbMF0sIEIgWzFdLCBCIFsyXSApXG4gICAgIH1cbn1cblxuZnVuY3Rpb24gZW5jbG9zZUJhc2lzMSAoIGE6IENpcmNsZSApXG57XG4gICAgIHJldHVybiB7XG4gICAgICAgICAgeDogYS54LFxuICAgICAgICAgIHk6IGEueSxcbiAgICAgICAgICByOiBhLnJcbiAgICAgfTtcbn1cblxuZnVuY3Rpb24gZW5jbG9zZUJhc2lzMiAoIGE6IENpcmNsZSwgYjogQ2lyY2xlIClcbntcbiAgICAgY29uc3QgeyB4OiB4MSwgeTogeTEsIHI6IHIxIH0gPSBhXG4gICAgIGNvbnN0IHsgeDogeDIsIHk6IHkyLCByOiByMiB9ID0gYlxuXG4gICAgIHZhciB4MjEgPSB4MiAtIHgxLFxuICAgICB5MjEgPSB5MiAtIHkxLFxuICAgICByMjEgPSByMiAtIHIxLFxuICAgICBsICAgPSBNYXRoLnNxcnQoIHgyMSAqIHgyMSArIHkyMSAqIHkyMSApO1xuXG4gICAgIHJldHVybiB7XG4gICAgICAgICAgeDogKCB4MSArIHgyICsgeDIxIC8gbCAqIHIyMSApIC8gMixcbiAgICAgICAgICB5OiAoIHkxICsgeTIgKyB5MjEgLyBsICogcjIxICkgLyAyLFxuICAgICAgICAgIHI6ICggbCArIHIxICsgcjIgKSAvIDJcbiAgICAgfTtcbn1cblxuZnVuY3Rpb24gZW5jbG9zZUJhc2lzMyAoIGE6IENpcmNsZSwgYjogQ2lyY2xlLCBjOiBDaXJjbGUgKVxue1xuICAgICBjb25zdCB7IHg6IHgxLCB5OiB5MSwgcjogcjEgfSA9IGFcbiAgICAgY29uc3QgeyB4OiB4MiwgeTogeTIsIHI6IHIyIH0gPSBiXG4gICAgIGNvbnN0IHsgeDogeDMsIHk6IHkzLCByOiByMyB9ID0gY1xuXG4gICAgIGNvbnN0IGEyID0geDEgLSB4MixcbiAgICAgICAgICAgICAgIGEzID0geDEgLSB4MyxcbiAgICAgICAgICAgICAgIGIyID0geTEgLSB5MixcbiAgICAgICAgICAgICAgIGIzID0geTEgLSB5MyxcbiAgICAgICAgICAgICAgIGMyID0gcjIgLSByMSxcbiAgICAgICAgICAgICAgIGMzID0gcjMgLSByMSxcblxuICAgICAgICAgICAgICAgZDEgPSB4MSAqIHgxICsgeTEgKiB5MSAtIHIxICogcjEsXG4gICAgICAgICAgICAgICBkMiA9IGQxIC0geDIgKiB4MiAtIHkyICogeTIgKyByMiAqIHIyLFxuICAgICAgICAgICAgICAgZDMgPSBkMSAtIHgzICogeDMgLSB5MyAqIHkzICsgcjMgKiByMyxcblxuICAgICAgICAgICAgICAgYWIgPSBhMyAqIGIyIC0gYTIgKiBiMyxcbiAgICAgICAgICAgICAgIHhhID0gKCBiMiAqIGQzIC0gYjMgKiBkMiApIC8gKCBhYiAqIDIgKSAtIHgxLFxuICAgICAgICAgICAgICAgeGIgPSAoIGIzICogYzIgLSBiMiAqIGMzICkgLyBhYixcbiAgICAgICAgICAgICAgIHlhID0gKCBhMyAqIGQyIC0gYTIgKiBkMyApIC8gKCBhYiAqIDIgKSAtIHkxLFxuICAgICAgICAgICAgICAgeWIgPSAoIGEyICogYzMgLSBhMyAqIGMyICkgLyBhYixcblxuICAgICAgICAgICAgICAgQSAgPSB4YiAqIHhiICsgeWIgKiB5YiAtIDEsXG4gICAgICAgICAgICAgICBCICA9IDIgKiAoIHIxICsgeGEgKiB4YiArIHlhICogeWIgKSxcbiAgICAgICAgICAgICAgIEMgID0geGEgKiB4YSArIHlhICogeWEgLSByMSAqIHIxLFxuICAgICAgICAgICAgICAgciAgPSAtKCBBID8gKCBCICsgTWF0aC5zcXJ0KCBCICogQiAtIDQgKiBBICogQyApICkgLyAoIDIgKiBBICkgOiBDIC8gQiApXG5cbiAgICAgcmV0dXJuIHtcbiAgICAgICAgICB4OiB4MSArIHhhICsgeGIgKiByLFxuICAgICAgICAgIHk6IHkxICsgeWEgKyB5YiAqIHIsXG4gICAgICAgICAgcjogclxuICAgICB9O1xufVxuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4vZDMtZW5jbG9zZS50c1wiIC8+XG5cbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9kMy9kMy1oaWVyYXJjaHkvYmxvYi9tYXN0ZXIvc3JjL3BhY2svc2libGluZ3MuanNcblxuaW1wb3J0IHsgZW5jbG9zZSwgQ2lyY2xlIH0gZnJvbSBcIi4vZDMtZW5jbG9zZS5qc1wiXG5cbmZ1bmN0aW9uIHBsYWNlICggYjogQ2lyY2xlLCBhOiBDaXJjbGUsIGM6IENpcmNsZSApXG57XG4gICAgIHZhciBkeCA9IGIueCAtIGEueCxcbiAgICAgICAgICB4OiBudW1iZXIsXG4gICAgICAgICAgYTI6IG51bWJlcixcbiAgICAgICAgICBkeSA9IGIueSAtIGEueSxcbiAgICAgICAgICB5IDogbnVtYmVyLFxuICAgICAgICAgIGIyOiBudW1iZXIsXG4gICAgICAgICAgZDIgPSBkeCAqIGR4ICsgZHkgKiBkeVxuXG4gICAgIGlmICggZDIgKVxuICAgICB7XG4gICAgICAgICAgYTIgPSBhLnIgKyBjLnIsIGEyICo9IGEyXG4gICAgICAgICAgYjIgPSBiLnIgKyBjLnIsIGIyICo9IGIyXG5cbiAgICAgICAgICBpZiAoIGEyID4gYjIgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHggPSAoIGQyICsgYjIgLSBhMiApIC8gKCAyICogZDIgKVxuICAgICAgICAgICAgICAgeSA9IE1hdGguc3FydCggTWF0aC5tYXgoIDAsIGIyIC8gZDIgLSB4ICogeCApIClcbiAgICAgICAgICAgICAgIGMueCA9IGIueCAtIHggKiBkeCAtIHkgKiBkeVxuICAgICAgICAgICAgICAgYy55ID0gYi55IC0geCAqIGR5ICsgeSAqIGR4XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICB4ID0gKCBkMiArIGEyIC0gYjIgKSAvICggMiAqIGQyIClcbiAgICAgICAgICAgICAgIHkgPSBNYXRoLnNxcnQoIE1hdGgubWF4KCAwLCBhMiAvIGQyIC0geCAqIHggKSApXG4gICAgICAgICAgICAgICBjLnggPSBhLnggKyB4ICogZHggLSB5ICogZHlcbiAgICAgICAgICAgICAgIGMueSA9IGEueSArIHggKiBkeSArIHkgKiBkeFxuICAgICAgICAgIH1cbiAgICAgfVxuICAgICBlbHNlXG4gICAgIHtcbiAgICAgICAgICBjLnggPSBhLnggKyBjLnJcbiAgICAgICAgICBjLnkgPSBhLnlcbiAgICAgfVxufVxuXG5mdW5jdGlvbiBpbnRlcnNlY3RzICggYTogQ2lyY2xlLCBiOiBDaXJjbGUgKVxue1xuICAgICB2YXIgZHIgPSBhLnIgKyBiLnIgLSAxZS02LCBkeCA9IGIueCAtIGEueCwgZHkgPSBiLnkgLSBhLnk7XG4gICAgIHJldHVybiBkciA+IDAgJiYgZHIgKiBkciA+IGR4ICogZHggKyBkeSAqIGR5O1xufVxuXG5mdW5jdGlvbiBzY29yZSAoIG5vZGU6IE5vZGUgKVxue1xuICAgICB2YXIgYSA9IG5vZGUuXyxcbiAgICAgICAgICBiID0gbm9kZS5uZXh0Ll8sXG4gICAgICAgICAgYWIgPSBhLnIgKyBiLnIsXG4gICAgICAgICAgZHggPSAoIGEueCAqIGIuciArIGIueCAqIGEuciApIC8gYWIsXG4gICAgICAgICAgZHkgPSAoIGEueSAqIGIuciArIGIueSAqIGEuciApIC8gYWI7XG4gICAgIHJldHVybiBkeCAqIGR4ICsgZHkgKiBkeTtcbn1cblxuY2xhc3MgTm9kZVxue1xuICAgICBuZXh0ICAgICA9IG51bGwgYXMgTm9kZVxuICAgICBwcmV2aW91cyA9IG51bGwgYXMgTm9kZVxuICAgICBjb25zdHJ1Y3RvciAoIHB1YmxpYyBfOiBDaXJjbGUgKSB7fVxufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFja0VuY2xvc2UgKCBjaXJjbGVzOiBDaXJjbGVbXSApXG57XG4gICAgIGlmICggISggbiA9IGNpcmNsZXMubGVuZ3RoICkgKSByZXR1cm4gMDtcblxuICAgICB2YXIgYSwgYiwgYyAvKjogTm9kZSAmIENpcmNsZSovLCBuLCBhYSwgY2EsIGksIGosIGssIHNqLCBzaztcblxuICAgICAvLyBQbGFjZSB0aGUgZmlyc3QgY2lyY2xlLlxuICAgICBhID0gY2lyY2xlc1sgMCBdLCBhLnggPSAwLCBhLnkgPSAwO1xuICAgICBpZiAoICEoIG4gPiAxICkgKSByZXR1cm4gYS5yO1xuXG4gICAgIC8vIFBsYWNlIHRoZSBzZWNvbmQgY2lyY2xlLlxuICAgICBiID0gY2lyY2xlc1sgMSBdLCBhLnggPSAtYi5yLCBiLnggPSBhLnIsIGIueSA9IDA7XG4gICAgIGlmICggISggbiA+IDIgKSApIHJldHVybiBhLnIgKyBiLnI7XG5cbiAgICAgLy8gUGxhY2UgdGhlIHRoaXJkIGNpcmNsZS5cbiAgICAgcGxhY2UoIGIsIGEsIGMgPSBjaXJjbGVzWyAyIF0gKTtcblxuICAgICAvLyBJbml0aWFsaXplIHRoZSBmcm9udC1jaGFpbiB1c2luZyB0aGUgZmlyc3QgdGhyZWUgY2lyY2xlcyBhLCBiIGFuZCBjLlxuICAgICBhID0gbmV3IE5vZGUoIGEgKSwgYiA9IG5ldyBOb2RlKCBiICksIGMgPSBuZXcgTm9kZSggYyApO1xuICAgICBhLm5leHQgPSBjLnByZXZpb3VzID0gYjtcbiAgICAgYi5uZXh0ID0gYS5wcmV2aW91cyA9IGM7XG4gICAgIGMubmV4dCA9IGIucHJldmlvdXMgPSBhO1xuXG4gICAgIC8vIEF0dGVtcHQgdG8gcGxhY2UgZWFjaCByZW1haW5pbmcgY2lyY2xl4oCmXG4gICAgIHBhY2s6IGZvciAoIGkgPSAzOyBpIDwgbjsgKytpIClcbiAgICAge1xuICAgICAgICAgIHBsYWNlKCBhLl8sIGIuXywgYyA9IGNpcmNsZXNbIGkgXSApLCBjID0gbmV3IE5vZGUoIGMgKTtcblxuICAgICAgICAgIC8vIEZpbmQgdGhlIGNsb3Nlc3QgaW50ZXJzZWN0aW5nIGNpcmNsZSBvbiB0aGUgZnJvbnQtY2hhaW4sIGlmIGFueS5cbiAgICAgICAgICAvLyDigJxDbG9zZW5lc3PigJ0gaXMgZGV0ZXJtaW5lZCBieSBsaW5lYXIgZGlzdGFuY2UgYWxvbmcgdGhlIGZyb250LWNoYWluLlxuICAgICAgICAgIC8vIOKAnEFoZWFk4oCdIG9yIOKAnGJlaGluZOKAnSBpcyBsaWtld2lzZSBkZXRlcm1pbmVkIGJ5IGxpbmVhciBkaXN0YW5jZS5cbiAgICAgICAgICBqID0gYi5uZXh0LCBrID0gYS5wcmV2aW91cywgc2ogPSBiLl8uciwgc2sgPSBhLl8ucjtcbiAgICAgICAgICBkb1xuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGlmICggc2ogPD0gc2sgKVxuICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIGludGVyc2VjdHMoIGouXywgYy5fICkgKVxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgYiA9IGosIGEubmV4dCA9IGIsIGIucHJldmlvdXMgPSBhLCAtLWk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWUgcGFjaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBzaiArPSBqLl8uciwgaiA9IGoubmV4dDtcbiAgICAgICAgICAgICAgIH0gZWxzZVxuICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIGludGVyc2VjdHMoIGsuXywgYy5fICkgKVxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgYSA9IGssIGEubmV4dCA9IGIsIGIucHJldmlvdXMgPSBhLCAtLWk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWUgcGFjaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBzayArPSBrLl8uciwgayA9IGsucHJldmlvdXM7XG4gICAgICAgICAgICAgICB9XG4gICAgICAgICAgfSB3aGlsZSAoIGogIT09IGsubmV4dCApO1xuXG4gICAgICAgICAgLy8gU3VjY2VzcyEgSW5zZXJ0IHRoZSBuZXcgY2lyY2xlIGMgYmV0d2VlbiBhIGFuZCBiLlxuICAgICAgICAgIGMucHJldmlvdXMgPSBhLCBjLm5leHQgPSBiLCBhLm5leHQgPSBiLnByZXZpb3VzID0gYiA9IGM7XG5cbiAgICAgICAgICAvLyBDb21wdXRlIHRoZSBuZXcgY2xvc2VzdCBjaXJjbGUgcGFpciB0byB0aGUgY2VudHJvaWQuXG4gICAgICAgICAgYWEgPSBzY29yZSggYSApO1xuICAgICAgICAgIHdoaWxlICggKCBjID0gYy5uZXh0ICkgIT09IGIgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGlmICggKCBjYSA9IHNjb3JlKCBjICkgKSA8IGFhIClcbiAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgYSA9IGMsXG4gICAgICAgICAgICAgICAgICAgIGFhID0gY2E7XG4gICAgICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGIgPSBhLm5leHQ7XG4gICAgIH1cblxuICAgICAvLyBDb21wdXRlIHRoZSBlbmNsb3NpbmcgY2lyY2xlIG9mIHRoZSBmcm9udCBjaGFpbi5cbiAgICAgYSA9IFsgYi5fIF1cbiAgICAgYyA9IGJcbiAgICAgd2hpbGUgKCAoIGMgPSBjLm5leHQgKSAhPT0gYiApXG4gICAgICAgICAgYS5wdXNoKCBjLl8gKTtcbiAgICAgYyA9IGVuY2xvc2UoIGEgKVxuXG4gICAgIC8vIFRyYW5zbGF0ZSB0aGUgY2lyY2xlcyB0byBwdXQgdGhlIGVuY2xvc2luZyBjaXJjbGUgYXJvdW5kIHRoZSBvcmlnaW4uXG4gICAgIGZvciAoIGkgPSAwOyBpIDwgbjsgKytpIClcbiAgICAge1xuICAgICAgICAgIGEgPSBjaXJjbGVzWyBpIF0sXG4gICAgICAgICAgYS54IC09IGMueCxcbiAgICAgICAgICBhLnkgLT0gYy55XG4gICAgIH1cblxuICAgICByZXR1cm4gYy5yIGFzIG51bWJlclxufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFja0NpcmNsZXMgKCBjaXJjbGVzOiBDaXJjbGVbXSApXG57XG4gICAgIHBhY2tFbmNsb3NlKCBjaXJjbGVzICk7XG4gICAgIHJldHVybiBjaXJjbGVzIGFzIENpcmNsZVtdO1xufVxuIiwiXHJcblxyXG5leHBvcnQgdHlwZSBVbml0XHJcbiAgICA9IFwiJVwiXHJcbiAgICB8IFwicHhcIiB8IFwicHRcIiB8IFwiZW1cIiB8IFwicmVtXCIgfCBcImluXCIgfCBcImNtXCIgfCBcIm1tXCJcclxuICAgIHwgXCJleFwiIHwgXCJjaFwiIHwgXCJwY1wiXHJcbiAgICB8IFwidndcIiB8IFwidmhcIiB8IFwidm1pblwiIHwgXCJ2bWF4XCJcclxuICAgIHwgXCJkZWdcIiB8IFwicmFkXCIgfCBcInR1cm5cIlxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldFVuaXQgKCB2YWx1ZTogYW55ICk6IFVuaXQgfCB1bmRlZmluZWRcclxue1xyXG4gICAgaWYgKCB0eXBlb2YgdmFsdWUgIT0gXCJzdHJpbmdcIiApXHJcbiAgICAgICAgIHJldHVybiB1bmRlZmluZWRcclxuXHJcbiAgICBjb25zdCBzcGxpdCA9IC9bKy1dP1xcZCpcXC4/XFxkKyg/OlxcLlxcZCspPyg/OltlRV1bKy1dP1xcZCspPyglfHB4fHB0fGVtfHJlbXxpbnxjbXxtbXxleHxjaHxwY3x2d3x2aHx2bWlufHZtYXh8ZGVnfHJhZHx0dXJuKT8kL1xyXG4gICAgICAgICAgICAgIC5leGVjKCB2YWx1ZSApO1xyXG5cclxuICAgIGlmICggc3BsaXQgKVxyXG4gICAgICAgICByZXR1cm4gc3BsaXQgWzFdIGFzIFVuaXRcclxuXHJcbiAgICByZXR1cm4gdW5kZWZpbmVkXHJcbn1cclxuXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0VHJhbnNmb3JtVW5pdCAoIHByb3BOYW1lOiBzdHJpbmcgKVxyXG57XHJcbiAgICBpZiAoIHByb3BOYW1lLmluY2x1ZGVzICggJ3RyYW5zbGF0ZScgKSB8fCBwcm9wTmFtZSA9PT0gJ3BlcnNwZWN0aXZlJyApXHJcbiAgICAgICAgcmV0dXJuICdweCdcclxuXHJcbiAgICBpZiAoIHByb3BOYW1lLmluY2x1ZGVzICggJ3JvdGF0ZScgKSB8fCBwcm9wTmFtZS5pbmNsdWRlcyAoICdza2V3JyApIClcclxuICAgICAgICByZXR1cm4gJ2RlZydcclxufSIsIlxuLy8gaHR0cHM6Ly9naXRodWIuY29tL3JkZmpzLWJhc2UvZGF0YS1tb2RlbC90cmVlL21hc3Rlci9saWJcblxuZGVjbGFyZSBnbG9iYWxcbntcbiAgICAgaW50ZXJmYWNlICROb2RlXG4gICAgIHtcbiAgICAgICAgICByZWFkb25seSBjb250ZXh0OiBzdHJpbmdcbiAgICAgICAgICByZWFkb25seSB0eXBlOiBzdHJpbmdcbiAgICAgICAgICByZWFkb25seSBpZDogc3RyaW5nXG4gICAgIH1cblxuICAgICBpbnRlcmZhY2UgJENsdXN0ZXIgZXh0ZW5kcyAkTm9kZVxuICAgICB7XG4gICAgICAgICAgY2hpbGRyZW4/OiAkTm9kZSBbXVxuICAgICB9XG59XG5cbnZhciBuZXh0SWQgPSAwXG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVOb2RlIDxEIGV4dGVuZHMgJE5vZGUgPSAkTm9kZSwgVCBleHRlbmRzIHN0cmluZyA9IEQgW1widHlwZVwiXT4gKCB0eXBlOiBULCBpZDogc3RyaW5nLCBkYXRhOiBQYXJ0aWFsIDxPbWl0IDxELCBcInR5cGVcIiB8IFwiaWRcIj4+IClcbntcbiAgICAgdHlwZSBOID0geyAtcmVhZG9ubHkgW0sgaW4ga2V5b2YgRF06IERbS10gfVxuXG4gICAgIDsoZGF0YSBhcyBOKS50eXBlID0gdHlwZVxuICAgICA7KGRhdGEgYXMgTikuaWQgICA9IGlkIHx8ICgrK25leHRJZCkudG9TdHJpbmcgKClcbiAgICAgcmV0dXJuIGRhdGEgYXMgRFxufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0VUlkICggbm9kZTogJE5vZGUgKVxue1xuICAgICByZXR1cm4gbm9kZS5jb250ZXh0ICsgJyMnICsgbm9kZS50eXBlICsgJzonICsgbm9kZS5pZFxufVxuXG5leHBvcnQgZnVuY3Rpb24gZXF1YWxOb2RlcyAoIGE6ICROb2RlLCBiOiAkTm9kZSApXG57XG4gICAgIHJldHVybiAhIWEgJiYgISFiXG4gICAgICAgICAgJiYgYS50eXBlID09PSBiLnR5cGVcbiAgICAgICAgICAmJiBhLmlkICAgPT09IGIuaWRcbn1cblxuLypleHBvcnQgY2xhc3MgTm9kZSA8RCBleHRlbmRzICROb2RlID0gJE5vZGUsIFQgZXh0ZW5kcyBzdHJpbmcgPSBEIFtcInR5cGVcIl0+XG57XG4gICAgIHN0YXRpYyBuZXh0SWQgPSAwXG5cbiAgICAgcmVhZG9ubHkgdHlwZTogc3RyaW5nXG5cbiAgICAgcmVhZG9ubHkgaWQ6IHN0cmluZ1xuXG4gICAgIHJlYWRvbmx5IHVpZDogbnVtYmVyXG5cbiAgICAgcmVhZG9ubHkgZGF0YTogRFxuXG4gICAgIGRlZmF1bHREYXRhICgpOiAkTm9kZVxuICAgICB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgIGNvbnRleHQ6IFwiXCIsXG4gICAgICAgICAgICAgICB0eXBlICAgOiBcIm5vZGVcIixcbiAgICAgICAgICAgICAgIGlkICAgICA6IHVuZGVmaW5lZCxcbiAgICAgICAgICB9XG4gICAgIH1cblxuICAgICBjb25zdHJ1Y3RvciAoIGRhdGE6IEQgKVxuICAgICB7XG4gICAgICAgICAgdGhpcy50eXBlID0gZGF0YS50eXBlXG4gICAgICAgICAgdGhpcy51aWQgID0gKytOb2RlLm5leHRJZFxuICAgICAgICAgIHRoaXMuaWQgICA9IGRhdGEuaWQgfHwgKGRhdGEuaWQgPSB0aGlzLnVpZC50b1N0cmluZyAoKSlcblxuICAgICAgICAgIHRoaXMuZGF0YSA9IE9iamVjdC5hc3NpZ24gKCB0aGlzLmRlZmF1bHREYXRhICgpLCBkYXRhIGFzIEQgKVxuICAgICB9XG5cbiAgICAgZXF1YWxzICggb3RoZXI6IE5vZGUgPGFueT4gKVxuICAgICB7XG4gICAgICAgICAgcmV0dXJuICEhb3RoZXJcbiAgICAgICAgICAgICAgICYmIG90aGVyLnR5cGUgPT09IHRoaXMudHlwZVxuICAgICAgICAgICAgICAgJiYgb3RoZXIuaWQgICA9PT0gdGhpcy5pZFxuICAgICB9XG5cbiAgICAgdG9Kc29uICgpXG4gICAgIHtcbiAgICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkgKCB0aGlzLmRhdGEgKVxuICAgICB9XG59Ki9cbiIsIlxuZXhwb3J0IHR5cGUgUGF0aCA9IHtcbiAgICAgbGVuZ3RoOiBudW1iZXJcbiAgICAgW1N5bWJvbC5pdGVyYXRvcl0oKTogSXRlcmFibGVJdGVyYXRvcjxzdHJpbmc+XG59XG5cbmV4cG9ydCBjbGFzcyBEYXRhVHJlZSA8VD5cbntcbiAgICAgcmVjb3JkcyA9IHt9IGFzIHtcbiAgICAgICAgICBbY29udGV4dDogc3RyaW5nXTogVCB8IHtcbiAgICAgICAgICAgICAgIFt0eXBlOiBzdHJpbmddOiBUIHwge1xuICAgICAgICAgICAgICAgICAgICBbaWQ6IHN0cmluZ106IFRcbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgIH1cblxuICAgICBoYXMgKCBwYXRoOiBQYXRoICkgIDogYm9vbGVhblxuICAgICB7XG4gICAgICAgICAgdmFyICAgcmVjICA9IHRoaXMucmVjb3JkcyBhcyBhbnlcbiAgICAgICAgICB2YXIgY291bnQgPSAwXG5cbiAgICAgICAgICBmb3IgKCBjb25zdCBrIG9mIHBhdGggKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNvdW50ICsrXG5cbiAgICAgICAgICAgICAgIGlmICggayBpbiByZWMgKVxuICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIGsgPT09IHVuZGVmaW5lZCApXG4gICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWtcblxuICAgICAgICAgICAgICAgICAgICByZWMgPSByZWMgW2tdXG4gICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiBwYXRoLmxlbmd0aCA9PSBjb3VudFxuICAgICB9XG5cbiAgICAgY291bnQgKCBwYXRoOiBQYXRoIClcbiAgICAge1xuICAgICAgICAgIHZhciAgcmVjID0gdGhpcy5yZWNvcmRzIGFzIGFueVxuXG4gICAgICAgICAgZm9yICggY29uc3QgayBvZiBwYXRoIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBpZiAoIGsgPT09IHVuZGVmaW5lZCApXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG5cbiAgICAgICAgICAgICAgIGlmICggayBpbiByZWMgKVxuICAgICAgICAgICAgICAgICAgICByZWMgPSByZWMgW2tdXG4gICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAwXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy9AdHMtaWdub3JlXG4gICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZCBpbiByZWNcbiAgICAgICAgICAgICAgID8gT2JqZWN0LmtleXMgKCByZWMgKS5sZW5ndGggLSAxXG4gICAgICAgICAgICAgICA6IE9iamVjdC5rZXlzICggcmVjICkubGVuZ3RoXG5cbiAgICAgfVxuXG4gICAgIHNldCAoIHBhdGg6IFBhdGgsIGRhdGE6IFQgKTogVFxuICAgICB7XG4gICAgICAgICAgY29uc3QgdW5kID0gdW5kZWZpbmVkXG4gICAgICAgICAgdmFyICAgcmVjICA9IHRoaXMucmVjb3JkcyBhcyBhbnlcblxuICAgICAgICAgIGZvciAoIGNvbnN0IGsgb2YgcGF0aCApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgaWYgKCBrID09PSB1bmRlZmluZWQgKVxuICAgICAgICAgICAgICAgICAgICBicmVha1xuXG4gICAgICAgICAgICAgICBpZiAoIGsgaW4gcmVjIClcbiAgICAgICAgICAgICAgICAgICAgcmVjID0gcmVjIFtrXVxuICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICByZWMgPSByZWMgW2tdID0ge31cbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gcmVjIFt1bmRdID0gZGF0YVxuICAgICB9XG5cbiAgICAgZ2V0ICggcGF0aDogUGF0aCApOiBUXG4gICAgIHtcbiAgICAgICAgICBjb25zdCB1bmQgPSB1bmRlZmluZWRcbiAgICAgICAgICB2YXIgICByZWMgID0gdGhpcy5yZWNvcmRzIGFzIGFueVxuXG4gICAgICAgICAgZm9yICggY29uc3QgayBvZiBwYXRoIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBpZiAoIGsgPT09IHVuZGVmaW5lZCApXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG5cbiAgICAgICAgICAgICAgIGlmICggayBpbiByZWMgKVxuICAgICAgICAgICAgICAgICAgICByZWMgPSByZWMgW2tdXG4gICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIHJlYyBbdW5kXVxuICAgICB9XG5cbiAgICAgbmVhciAoIHBhdGg6IFBhdGggKTogVFxuICAgICB7XG4gICAgICAgICAgdmFyIHJlYyA9IHRoaXMucmVjb3JkcyBhcyBhbnlcbiAgICAgICAgICBjb25zdCB1bmQgPSB1bmRlZmluZWRcblxuICAgICAgICAgIGZvciAoIGNvbnN0IGsgb2YgcGF0aCApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgaWYgKCBrID09PSB1bmRlZmluZWQgKVxuICAgICAgICAgICAgICAgICAgICBicmVha1xuXG4gICAgICAgICAgICAgICBpZiAoIGsgaW4gcmVjIClcbiAgICAgICAgICAgICAgICAgICAgcmVjID0gcmVjIFtrXVxuICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiByZWMgW3VuZF1cbiAgICAgfVxuXG4gICAgIHdhbGsgKCBwYXRoOiBQYXRoLCBjYjogKCBkYXRhOiBUICkgPT4gdm9pZCApXG4gICAgIHtcbiAgICAgICAgICB2YXIgICByZWMgID0gdGhpcy5yZWNvcmRzIGFzIGFueVxuICAgICAgICAgIGNvbnN0IHVuZCAgPSB1bmRlZmluZWRcblxuICAgICAgICAgIGZvciAoIGNvbnN0IGsgb2YgcGF0aCApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgaWYgKCB1bmQgaW4gcmVjIClcbiAgICAgICAgICAgICAgICAgICAgY2IgKCByZWMgW3VuZF0gKVxuXG4gICAgICAgICAgICAgICBpZiAoIGsgPT09IHVuZGVmaW5lZCApXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG5cbiAgICAgICAgICAgICAgIGlmICggayBpbiByZWMgKVxuICAgICAgICAgICAgICAgICAgICByZWMgPSByZWMgW2tdXG4gICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKCB1bmQgaW4gcmVjIClcbiAgICAgICAgICAgICAgIGNiICggcmVjIFt1bmRdIClcblxuICAgICAgICAgIHJldHVyblxuICAgICB9XG59XG4iLCJcbmltcG9ydCB7IE9wdGlvbmFsLCBSZXF1aXJlIH0gZnJvbSBcIi4uL0xpYi90eXBpbmcuanNcIlxuaW1wb3J0IHsgRGF0YVRyZWUgfSBmcm9tIFwiLi9kYXRhLXRyZWUuanNcIlxuXG5cbnR5cGUgUmVmIDxOIGV4dGVuZHMgJE5vZGU+ID0gUmVxdWlyZSA8UGFydGlhbCA8Tj4sIFwiY29udGV4dFwiIHwgXCJ0eXBlXCIgfCBcImlkXCI+XG5cbnR5cGUgRCA8TiBleHRlbmRzICROb2RlPiA9IE9wdGlvbmFsIDxOLCBcImNvbnRleHRcIiB8IFwidHlwZVwiIHwgXCJpZFwiPlxuXG5cbmV4cG9ydCBjbGFzcyBEYXRhYmFzZSA8TiBleHRlbmRzICROb2RlID0gJE5vZGU+IGV4dGVuZHMgRGF0YVRyZWUgPE4+XG57XG4gICAgIGhhcyAoIG5vZGU6IFJlZiA8Tj4gKSAgICAgIDogYm9vbGVhblxuICAgICBoYXMgKCAuLi4gcGF0aDogc3RyaW5nIFtdICk6IGJvb2xlYW5cbiAgICAgaGFzICgpOiBib29sZWFuXG4gICAgIHtcbiAgICAgICAgICBpZiAoIGFyZ3VtZW50cy5sZW5ndGggPT0gMCApXG4gICAgICAgICAgICAgICByZXR1cm5cblxuICAgICAgICAgIGlmICggYXJndW1lbnRzLmxlbmd0aCA9PSAxIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBjb25zdCBvOiBOID0gYXJndW1lbnRzIFswXVxuICAgICAgICAgICAgICAgcmV0dXJuIHN1cGVyLm5lYXIgKCBbby5jb250ZXh0LCBvLnR5cGUsIG8uaWRdICkgIT09IHVuZGVmaW5lZFxuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgcmV0dXJuIHN1cGVyLm5lYXIgKCBhcmd1bWVudHMgKSAhPT0gdW5kZWZpbmVkXG4gICAgICAgICAgfVxuICAgICB9XG5cbiAgICAgY291bnQgKCBub2RlOiBSZWYgPE4+ICkgICAgICA6IG51bWJlclxuICAgICBjb3VudCAoIC4uLiBwYXRoOiBzdHJpbmcgW10gKTogbnVtYmVyXG4gICAgIGNvdW50ICgpOiBudW1iZXJcbiAgICAge1xuICAgICAgICAgIGlmICggYXJndW1lbnRzLmxlbmd0aCA9PSAwIClcbiAgICAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgICAgaWYgKCBhcmd1bWVudHMubGVuZ3RoID09IDEgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNvbnN0IG86IE4gPSBhcmd1bWVudHMgWzBdXG4gICAgICAgICAgICAgICByZXR1cm4gc3VwZXIuY291bnQgKCBbby5jb250ZXh0LCBvLnR5cGUsIG8uaWRdIClcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHJldHVybiBzdXBlci5jb3VudCAoIGFyZ3VtZW50cyApXG4gICAgICAgICAgfVxuICAgICB9XG5cbiAgICAgc2V0IDwkIGV4dGVuZHMgTj4gKCBub2RlOiAkICkgICAgICAgICAgICAgICAgICAgICA6ICRcbiAgICAgc2V0IDwkIGV4dGVuZHMgTj4gKCBwYXRoOiBzdHJpbmcgW10sIGRhdGE6IEQgPCQ+ICk6ICRcbiAgICAgc2V0ICgpOiBOXG4gICAgIHtcbiAgICAgICAgICBpZiAoIGFyZ3VtZW50cy5sZW5ndGggPT0gMCApXG4gICAgICAgICAgICAgICByZXR1cm5cblxuICAgICAgICAgIGlmICggYXJndW1lbnRzLmxlbmd0aCA9PSAxIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBjb25zdCBvOiBOID0gYXJndW1lbnRzIFswXVxuICAgICAgICAgICAgICAgcmV0dXJuIHN1cGVyLnNldCAoIFtvLmNvbnRleHQsIG8udHlwZSwgby5pZF0sIG8gKVxuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgcmV0dXJuIHN1cGVyLnNldCAoIGFyZ3VtZW50cyBbMF0sIGFyZ3VtZW50cyBbMV0gKVxuICAgICAgICAgIH1cbiAgICAgfVxuXG4gICAgIGdldCA8JCBleHRlbmRzIE4+ICggbm9kZTogUmVmIDwkTm9kZT4gKSAgOiAkXG4gICAgIGdldCA8JCBleHRlbmRzIE4+ICggLi4uIHBhdGg6IHN0cmluZyBbXSApOiAkXG4gICAgIGdldCAoKTogTlxuICAgICB7XG4gICAgICAgICAgaWYgKCBhcmd1bWVudHMubGVuZ3RoID09IDAgKVxuICAgICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgICBjb25zdCByZXN1bHQgPSB7fSBhcyBOXG5cbiAgICAgICAgICBpZiAoIGFyZ3VtZW50cy5sZW5ndGggPT0gMSApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgY29uc3QgbzogJE5vZGUgPSBhcmd1bWVudHMgWzBdXG4gICAgICAgICAgICAgICBzdXBlci53YWxrICggW28uY29udGV4dCwgby50eXBlLCBvLmlkXSwgZGF0YSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIE9iamVjdC5hc3NpZ24gKCByZXN1bHQsIGRhdGEgKVxuICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgIHJldHVybiBPYmplY3QuYXNzaWduICggcmVzdWx0LCBvIClcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHN1cGVyLndhbGsgKCBhcmd1bWVudHMsIGRhdGEgPT4ge1xuICAgICAgICAgICAgICAgICAgICBPYmplY3QuYXNzaWduICggcmVzdWx0LCBkYXRhIClcbiAgICAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgICAgIHJldHVybiBPYmplY3QuYXNzaWduICggcmVzdWx0LCB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRleHQ6IGFyZ3VtZW50cyBbMF0sXG4gICAgICAgICAgICAgICAgICAgIHR5cGUgICA6IGFyZ3VtZW50cyBbMV0sXG4gICAgICAgICAgICAgICAgICAgIGlkICAgICA6IGFyZ3VtZW50cyBbMl0sXG4gICAgICAgICAgICAgICB9KVxuICAgICAgICAgIH1cbiAgICAgfVxufVxuIiwiXG5pbXBvcnQgeyBEYXRhYmFzZSB9IGZyb20gXCIuL2RiLmpzXCJcbmltcG9ydCB7IERhdGFUcmVlLCBQYXRoIH0gZnJvbSBcIi4vZGF0YS10cmVlLmpzXCJcblxuaW1wb3J0IHsgT3B0aW9uYWwgfSBmcm9tIFwiLi4vTGliL2luZGV4LmpzXCJcblxuXG50eXBlIEl0ZW0gPFQgPSBhbnksICQgZXh0ZW5kcyAkTm9kZSA9ICROb2RlPiA9XG57XG4gICAgIG11bHRpcGxlOiBib29sZWFuXG4gICAgIGluc3RhbmNlczogVCBbXVxuICAgICBjb25zdHJ1Y3RvcjogbmV3ICggZGF0YTogJCApID0+IFRcbn1cblxudHlwZSAkSW4gPE4gZXh0ZW5kcyAkTm9kZSA9ICROb2RlPiA9IE9wdGlvbmFsIDxOLCBcImNvbnRleHRcIj5cblxuLy9leHBvcnQgdHlwZSBDdG9yIDxOIGV4dGVuZHMgJE5vZGUgPSAkTm9kZSwgVCA9IGFueT4gPSBuZXcgKCBkYXRhOiBOICkgPT4gVFxuZXhwb3J0IHR5cGUgQ3RvciA8TiBleHRlbmRzICROb2RlID0gJE5vZGUsIFQgPSBhbnk+ID0gbmV3ICggZGF0YTogTiwgY2hpbGRyZW4/OiBhbnkgW10gKSA9PiBUXG5cbnR5cGUgQXJnIDxGPiA9IEYgZXh0ZW5kcyBuZXcgKCBkYXRhOiBpbmZlciBEICkgPT4gYW55ID8gRCA6IGFueVxuXG5cbmV4cG9ydCBjbGFzcyBGYWN0b3J5IDxFID0gYW55LCBOIGV4dGVuZHMgJE5vZGUgPSAkTm9kZT5cbntcbiAgICAgY29uc3RydWN0b3IgKCByZWFkb25seSBkYjogRGF0YWJhc2UgPE4+ICkge31cblxuICAgICBwcml2YXRlIGN0b3JzID0gbmV3IERhdGFUcmVlIDxDdG9yIDwkTm9kZSwgRT4+ICgpXG4gICAgIHByaXZhdGUgaW5zdHMgPSAgbmV3IERhdGFUcmVlIDxFPiAoKVxuXG5cbiAgICAgZ2V0UGF0aCAoIG5vZGU6ICROb2RlICkgICAgICAgIDogUGF0aFxuICAgICBnZXRQYXRoICggcGF0aDogUGF0aCApICAgICAgICAgOiBQYXRoXG4gICAgIGdldFBhdGggKCAuLi4gcGF0aDogc3RyaW5nIFtdICk6IFBhdGhcblxuICAgICBnZXRQYXRoICgpXG4gICAgIHtcbiAgICAgICAgICBpZiAoIGFyZ3VtZW50cy5sZW5ndGggPT0gMCApXG4gICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IgKCBcIk51bGwgYXJndW1lbnRcIiApXG5cbiAgICAgICAgICBjb25zdCBhcmcgID0gYXJndW1lbnRzIFswXVxuXG4gICAgICAgICAgaWYgKCB0eXBlb2YgYXJnID09IFwic3RyaW5nXCIgKVxuICAgICAgICAgICAgICAgcmV0dXJuIGFyZ3VtZW50cyBhcyBQYXRoXG5cbiAgICAgICAgICBpZiAoIEFycmF5LmlzQXJyYXkgKCBhcmcpIClcbiAgICAgICAgICAgICAgIHJldHVybiBhcmcuZmxhdCAoKSBhcyBQYXRoXG5cbiAgICAgICAgICByZXR1cm4gWyBhcmcuY29udGV4dCwgYXJnLnR5cGUsIGFyZy5pZCBdIGFzIFBhdGhcbiAgICAgfVxuXG4gICAgIGluU3RvY2sgKCBub2RlOiAkTm9kZSApICAgICAgICA6IGJvb2xlYW5cbiAgICAgaW5TdG9jayAoIHBhdGg6IFBhdGggKSAgICAgICAgIDogYm9vbGVhblxuICAgICBpblN0b2NrICggLi4uIHBhdGg6IHN0cmluZyBbXSApOiBib29sZWFuXG5cbiAgICAgaW5TdG9jayAoKTogYm9vbGVhblxuICAgICB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuaW5zdHMuaGFzICggdGhpcy5nZXRQYXRoICggLi4uIGFyZ3VtZW50cyApIGFzIFBhdGggKVxuICAgICB9XG4gICAgIF9pblN0b2NrICggcGF0aDogUGF0aCApXG4gICAgIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5pbnN0cy5oYXMgKCBwYXRoIClcbiAgICAgfVxuXG4gICAgIGRlZmluZSA8RiBleHRlbmRzIEN0b3I+ICggY3RvcjogRiwgbm9kZTogQXJnIDxGPiApICAgICAgOiB2b2lkXG4gICAgIGRlZmluZSA8RiBleHRlbmRzIEN0b3I+ICggY3RvcjogRiwgcGF0aDogUGF0aCApICAgICAgICAgOiB2b2lkXG4gICAgIGRlZmluZSA8RiBleHRlbmRzIEN0b3I+ICggY3RvcjogRiwgLi4uIHBhdGg6IHN0cmluZyBbXSApOiB2b2lkXG5cbiAgICAgZGVmaW5lICggY3RvcjogQ3RvciwgLi4uIHJlc3Q6IGFueSBbXSApXG4gICAgIHtcbiAgICAgICAgICB2YXIgcGF0aCA9IHRoaXMuZ2V0UGF0aCAoIC4uLiByZXN0IClcblxuICAgICAgICAgIGlmICggdGhpcy5jdG9ycy5oYXMgKCBwYXRoICkgKVxuICAgICAgICAgICAgICAgdGhyb3cgXCJCYWQgYXJndW1lbnRcIlxuXG4gICAgICAgICAgcmV0dXJuIHRoaXMuY3RvcnMuc2V0ICggcGF0aCwgY3RvciApXG4gICAgIH1cbiAgICAgX2RlZmluZSAoIGN0b3I6IEN0b3IsIHBhdGg6IFBhdGggKVxuICAgICB7XG4gICAgICAgICAgaWYgKCB0aGlzLmN0b3JzLmhhcyAoIHBhdGggKSApXG4gICAgICAgICAgICAgICB0aHJvdyBcIkJhZCBhcmd1bWVudFwiXG5cbiAgICAgICAgICByZXR1cm4gdGhpcy5jdG9ycy5zZXQgKCBwYXRoLCBjdG9yIClcbiAgICAgfVxuXG4gICAgIHBpY2sgPFIgZXh0ZW5kcyBFLCAkIGV4dGVuZHMgTiA9IE4+ICggbm9kZTogJE5vZGUgKTogUlxuICAgICBwaWNrIDxSIGV4dGVuZHMgRT4gKCAuLi4gcGF0aDogc3RyaW5nIFtdICkgICAgICAgICA6IFJcbiAgICAgcGljayA8UiBleHRlbmRzIEU+ICggcGF0aDogUGF0aCApICAgICAgICAgICAgICAgICAgOiBSXG5cbiAgICAgcGljayAoKTogRVxuICAgICB7XG4gICAgICAgICAgdmFyIHBhdGggPSB0aGlzLmdldFBhdGggKCAuLi4gYXJndW1lbnRzIClcblxuICAgICAgICAgIGlmICggdGhpcy5pbnN0cy5oYXMgKCBwYXRoICkgKVxuICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuaW5zdHMuZ2V0ICggcGF0aCApXG5cbiAgICAgICAgICB0aHJvdyBcIkJhZCBhcmd1bWVudFwiXG4gICAgIH1cbiAgICAgX3BpY2sgKCBwYXRoOiBQYXRoIClcbiAgICAge1xuICAgICAgICAgIGlmICggdGhpcy5pbnN0cy5oYXMgKCBwYXRoICkgKVxuICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuaW5zdHMuZ2V0ICggcGF0aCApXG5cbiAgICAgICAgICB0aHJvdyBcIkJhZCBhcmd1bWVudFwiXG4gICAgIH1cblxuICAgICBtYWtlIDxSIGV4dGVuZHMgRSwgJCBleHRlbmRzIE4gPSBOPiAoIG5vZGU6ICQgKTogUlxuICAgICBtYWtlIDxSIGV4dGVuZHMgRT4gKCBwYXRoOiBQYXRoICkgICAgICAgICAgICAgIDogUlxuICAgICBtYWtlIDxSIGV4dGVuZHMgRT4gKCAuLi4gcGF0aDogc3RyaW5nIFtdICkgICAgIDogUlxuXG4gICAgIG1ha2UgKCk6IEVcbiAgICAge1xuICAgICAgICAgIHZhciBwYXRoID0gdGhpcy5nZXRQYXRoICggLi4uIGFyZ3VtZW50cyApXG5cbiAgICAgICAgICBjb25zdCBhcmcgID0gYXJndW1lbnRzIFswXVxuXG4gICAgICAgICAgaWYgKCB0eXBlb2YgYXJnID09IFwib2JqZWN0XCIgJiYgISBBcnJheS5pc0FycmF5IChhcmcpIClcbiAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9tYWtlICggcGF0aCwgYXJnIClcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fbWFrZSAoIHBhdGggKVxuICAgICB9XG4gICAgIF9tYWtlICggcGF0aDogUGF0aCwgZGF0YT86IFBhcnRpYWwgPE4+IClcbiAgICAge1xuICAgICAgICAgIGlmICggdGhpcy5pbnN0cy5oYXMgKCBwYXRoICkgKVxuICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuaW5zdHMuZ2V0ICggcGF0aCApXG5cbiAgICAgICAgICBjb25zdCBjdG9yID0gdGhpcy5jdG9ycy5uZWFyICggcGF0aCApXG5cbiAgICAgICAgICBpZiAoIGN0b3IgPT0gdW5kZWZpbmVkIClcbiAgICAgICAgICAgICAgIHRocm93IFwiQmFkIGFyZ3VtZW50XCJcblxuICAgICAgICAgIGNvbnN0IHRtcCA9IHRoaXMuZGIuZ2V0ICggLi4uIHBhdGggKVxuXG4gICAgICAgICAgZGF0YSA9IGRhdGEgPT0gdW5kZWZpbmVkXG4gICAgICAgICAgICAgICA/IHRtcFxuICAgICAgICAgICAgICAgOiBPYmplY3QuYXNzaWduICggdG1wLCBkYXRhIClcblxuICAgICAgICAgIHJldHVybiB0aGlzLmluc3RzLnNldCAoIHBhdGgsIG5ldyBjdG9yICggZGF0YSBhcyBOICkgKVxuICAgICB9XG59XG4iLCJcblxuXG5leHBvcnQgY29uc3QgeG5vZGUgPSAoKCkgPT5cbntcbiAgICAgY29uc3Qgc3ZnX25hbWVzID0gWyBcInN2Z1wiLCBcImdcIiwgXCJsaW5lXCIsIFwiY2lyY2xlXCIsIFwicGF0aFwiLCBcInRleHRcIiBdXG5cbiAgICAgZnVuY3Rpb24gY3JlYXRlIChcbiAgICAgICAgICBuYW1lOiBrZXlvZiBKU1guSW50cmluc2ljSFRNTEVsZW1lbnRzLFxuICAgICAgICAgIHByb3BzOiBhbnksXG4gICAgICAgICAgLi4uY2hpbGRyZW46IFsgSFRNTEVsZW1lbnQgfCBzdHJpbmcgfCBhbnlbXSBdXG4gICAgICk6IEhUTUxFbGVtZW50XG5cbiAgICAgZnVuY3Rpb24gY3JlYXRlIChcbiAgICAgICAgICBuYW1lOiBrZXlvZiBKU1guSW50cmluc2ljU1ZHRWxlbWVudHMsXG4gICAgICAgICAgcHJvcHM6IGFueSxcbiAgICAgICAgICAuLi5jaGlsZHJlbjogWyBIVE1MRWxlbWVudCB8IHN0cmluZyB8IGFueVtdIF1cbiAgICAgKTogU1ZHRWxlbWVudFxuXG4gICAgIGZ1bmN0aW9uIGNyZWF0ZSAoXG4gICAgICAgICAgbmFtZTogc3RyaW5nLFxuICAgICAgICAgIHByb3BzOiBhbnksXG4gICAgICAgICAgLi4uY2hpbGRyZW46IFsgSFRNTEVsZW1lbnQgfCBzdHJpbmcgfCBhbnlbXSBdXG4gICAgICk6IEhUTUxFbGVtZW50IHwgU1ZHRWxlbWVudFxuICAgICB7XG4gICAgICAgICAgcHJvcHMgPSBPYmplY3QuYXNzaWduICgge30sIHByb3BzIClcblxuICAgICAgICAgIGNvbnN0IGVsZW1lbnQgPSBzdmdfbmFtZXMuaW5kZXhPZiAoIG5hbWUgKSA9PT0gLTFcbiAgICAgICAgICAgICAgICAgICAgPyBkb2N1bWVudC5jcmVhdGVFbGVtZW50ICggbmFtZSApXG4gICAgICAgICAgICAgICAgICAgIDogZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TICggXCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiLCBuYW1lIClcblxuICAgICAgICAgIGNvbnN0IGNvbnRlbnQgPSBbXSBhcyBhbnlbXVxuXG4gICAgICAgICAgLy8gQ2hpbGRyZW5cblxuICAgICAgICAgIHdoaWxlICggY2hpbGRyZW4ubGVuZ3RoID4gMCApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgbGV0IGNoaWxkID0gY2hpbGRyZW4ucG9wKClcblxuICAgICAgICAgICAgICAgaWYgKCBBcnJheS5pc0FycmF5KCBjaGlsZCApIClcbiAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yICggdmFyIGkgPSAwIDsgaSAhPSBjaGlsZC5sZW5ndGggOyBpKysgKVxuICAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkcmVuLnB1c2goIGNoaWxkIFtpXSApXG4gICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnQucHVzaCggY2hpbGQgKVxuICAgICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHdoaWxlICggY29udGVudC5sZW5ndGggPiAwIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBsZXQgY2hpbGQgPSBjb250ZW50LnBvcCgpXG5cbiAgICAgICAgICAgICAgIGlmICggY2hpbGQgaW5zdGFuY2VvZiBOb2RlIClcbiAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5hcHBlbmRDaGlsZCggY2hpbGQgKVxuXG4gICAgICAgICAgICAgICBlbHNlIGlmICggdHlwZW9mIGNoaWxkID09IFwiYm9vbGVhblwiIHx8IGNoaWxkIClcbiAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5hcHBlbmRDaGlsZCggZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoIGNoaWxkLnRvU3RyaW5nKCkgKSApXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gQXR0cmlidXRlc1xuXG4gICAgICAgICAgY29uc3QgaXNBcnJheSA9IEFycmF5LmlzQXJyYXlcbiAgICAgICAgICBjb25zdCBjb252OiBSZWNvcmQgPHN0cmluZywgKHY6IGFueSkgPT4gc3RyaW5nPiA9XG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgY2xhc3M6ICggdiApID0+IGlzQXJyYXkgKHYpID8gdi5qb2luIChcIiBcIikgOiB2LFxuICAgICAgICAgICAgICAgc3R5bGU6ICggdiApID0+IGlzQXJyYXkgKHYpID8gdi5qb2luIChcIiBcIilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiB0eXBlb2YgdiA9PSBcIm9iamVjdFwiID8gb2JqZWN0VG9TdHlsZSAodilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiB2LFxuICAgICAgICAgICAgICAgLy8gc3ZnXG4gICAgICAgICAgICAgICBkOiAoIHYgKSA9PiBpc0FycmF5ICh2KSA/IHYuam9pbiAoXCIgXCIpIDogdixcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBmb3IgKCBjb25zdCBrZXkgaW4gcHJvcHMgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNvbnN0IHZhbHVlID0gcHJvcHNba2V5XVxuXG4gICAgICAgICAgICAgICBpZiAoIHR5cGVvZiB2YWx1ZSA9PSBcImZ1bmN0aW9uXCIgKVxuICAgICAgICAgICAgICAgICAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIgKCBrZXksIHZhbHVlIClcblxuICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBlbGVtZW50LnNldEF0dHJpYnV0ZSAoIGtleSwgKGNvbnZba2V5XSB8fCAodj0+dikpICh2YWx1ZSkgKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiBlbGVtZW50XG5cbiAgICAgICAgICBmdW5jdGlvbiBvYmplY3RUb1N0eWxlICggb2JqOiBvYmplY3QgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHZhciByZXN1bHQgPSBcIlwiXG5cbiAgICAgICAgICAgICAgIGZvciAoIGNvbnN0IGtleSBpbiBvYmogKVxuICAgICAgICAgICAgICAgICAgICByZXN1bHQgKz0ga2V5ICsgXCI6IFwiICsgb2JqIFtrZXldICsgXCI7IFwiXG5cbiAgICAgICAgICAgICAgIHJldHVybiByZXN1bHRcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBmdW5jdGlvbiBjYW1lbGl6ZSAoIHN0cjogc3RyaW5nIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICByZXR1cm4gc3RyLnJlcGxhY2UgKFxuICAgICAgICAgICAgICAgICAgICAvKD86W0EtWl18XFxiXFx3KS9nLFxuICAgICAgICAgICAgICAgICAgICAoIHdvcmQsIGluZGV4ICkgPT4gaW5kZXggPT0gMCA/IHdvcmQudG9Mb3dlckNhc2UoKSA6IHdvcmQudG9VcHBlckNhc2UoKVxuICAgICAgICAgICAgICAgKS5yZXBsYWNlKC9cXHMrL2csICcnKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBmdW5jdGlvbiB1bmNhbWVsaXplICggc3RyOiBzdHJpbmcgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHJldHVybiBzdHIudHJpbSAoKS5yZXBsYWNlIChcbiAgICAgICAgICAgICAgIC8vICAgLyg/PCEtKSg/OltBLVpdfFxcYlxcdykvZyxcbiAgICAgICAgICAgICAgICAgICAgLyg/OltBLVpdfFxcYlxcdykvZyxcbiAgICAgICAgICAgICAgICAgICAgKCB3b3JkLCBpbmRleCApID0+IGluZGV4ID09IDAgPyB3b3JkLnRvTG93ZXJDYXNlKCkgOiAnLScgKyB3b3JkLnRvTG93ZXJDYXNlKClcbiAgICAgICAgICAgICAgICkucmVwbGFjZSgvKD86XFxzK3xfKS9nLCAnJyk7XG4gICAgICAgICAgfVxuICAgICB9XG5cbiAgICAgcmV0dXJuIGNyZWF0ZVxuXG59KSAoKVxuXG5kZWNsYXJlIGdsb2JhbFxue1xuICAgICBleHBvcnQgbmFtZXNwYWNlIEpTWFxuICAgICB7XG4gICAgICAgICAgZXhwb3J0IHR5cGUgRWxlbWVudCA9IEhUTUxFbGVtZW50IHwgU1ZHRWxlbWVudFxuXG4gICAgICAgICAgZXhwb3J0IHR5cGUgSW50cmluc2ljRWxlbWVudHMgPSBJbnRyaW5zaWNIVE1MRWxlbWVudHMgJiBJbnRyaW5zaWNTVkdFbGVtZW50c1xuXG4gICAgICAgICAgZXhwb3J0IGludGVyZmFjZSBJbnRyaW5zaWNIVE1MRWxlbWVudHNcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBhICAgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgYWJiciAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGFkZHJlc3MgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBhcmVhICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgYXJ0aWNsZSAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGFzaWRlICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBhdWRpbyAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgYiAgICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGJhc2UgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBiZGkgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgYmRvICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGJpZyAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBibG9ja3F1b3RlOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgYm9keSAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGJyICAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBidXR0b24gICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgY2FudmFzICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGNhcHRpb24gICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBjaXRlICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgY29kZSAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGNvbCAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBjb2xncm91cCAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZGF0YSAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGRhdGFsaXN0ICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBkZCAgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZGVsICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGRldGFpbHMgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBkZm4gICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZGlhbG9nICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGRpdiAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBkbCAgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZHQgICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGVtICAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBlbWJlZCAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZmllbGRzZXQgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGZpZ2NhcHRpb246IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBmaWd1cmUgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZm9vdGVyICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGZvcm0gICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBoMSAgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgaDIgICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGgzICAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBoNCAgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgaDUgICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGg2ICAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBoZWFkICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgaGVhZGVyICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGhncm91cCAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBociAgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgaHRtbCAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGkgICAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBpZnJhbWUgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgaW1nICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGlucHV0ICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBpbnMgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAga2JkICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGtleWdlbiAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBsYWJlbCAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgbGVnZW5kICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGxpICAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBsaW5rICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgbWFpbiAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIG1hcCAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBtYXJrICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgbWVudSAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIG1lbnVpdGVtICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBtZXRhICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgbWV0ZXIgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIG5hdiAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBub3NjcmlwdCAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgb2JqZWN0ICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIG9sICAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBvcHRncm91cCAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgb3B0aW9uICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIG91dHB1dCAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBwICAgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgcGFyYW0gICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHBpY3R1cmUgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBwcmUgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgcHJvZ3Jlc3MgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHEgICAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBycCAgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgcnQgICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHJ1YnkgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBzICAgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgc2FtcCAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHNjcmlwdCAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBzZWN0aW9uICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgc2VsZWN0ICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHNsb3QgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBzbWFsbCAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgc291cmNlICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHNwYW4gICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBzdHJvbmcgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgc3R5bGUgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHN1YiAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBzdW1tYXJ5ICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgc3VwICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHRhYmxlICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICB0Ym9keSAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgdGQgICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHRleHRhcmVhICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICB0Zm9vdCAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgdGggICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHRoZWFkICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICB0aW1lICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgdGl0bGUgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHRyICAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICB0cmFjayAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgdSAgICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHVsICAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBcInZhclwiICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICB2aWRlbyAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgd2JyICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBleHBvcnQgaW50ZXJmYWNlIEludHJpbnNpY1NWR0VsZW1lbnRzXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgc3ZnICAgICAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgYW5pbWF0ZSAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgY2lyY2xlICAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgY2xpcFBhdGggICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZGVmcyAgICAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZGVzYyAgICAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZWxsaXBzZSAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZmVCbGVuZCAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZmVDb2xvck1hdHJpeCAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZmVDb21wb25lbnRUcmFuc2ZlcjogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZmVDb21wb3NpdGUgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZmVDb252b2x2ZU1hdHJpeCAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZmVEaWZmdXNlTGlnaHRpbmcgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZmVEaXNwbGFjZW1lbnRNYXAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZmVGbG9vZCAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZmVHYXVzc2lhbkJsdXIgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZmVJbWFnZSAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZmVNZXJnZSAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZmVNZXJnZU5vZGUgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZmVNb3JwaG9sb2d5ICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZmVPZmZzZXQgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZmVTcGVjdWxhckxpZ2h0aW5nIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZmVUaWxlICAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZmVUdXJidWxlbmNlICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZmlsdGVyICAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZm9yZWlnbk9iamVjdCAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZyAgICAgICAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgaW1hZ2UgICAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgbGluZSAgICAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgbGluZWFyR3JhZGllbnQgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgbWFya2VyICAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgbWFzayAgICAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgcGF0aCAgICAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgcGF0dGVybiAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgcG9seWdvbiAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgcG9seWxpbmUgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgcmFkaWFsR3JhZGllbnQgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgcmVjdCAgICAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgc3RvcCAgICAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgc3ltYm9sICAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgdGV4dCAgICAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgdHNwYW4gICAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgdXNlICAgICAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgIH1cbiAgICAgfVxuXG5cbiAgICAgaW50ZXJmYWNlIFBhdGhBdHRyaWJ1dGVzXG4gICAgIHtcbiAgICAgICAgICBkOiBzdHJpbmdcbiAgICAgfVxuXG4gICAgIHR5cGUgRXZlbnRIYW5kbGVyIDxFIGV4dGVuZHMgRXZlbnQ+ID0gKCBldmVudDogRSApID0+IHZvaWRcblxuICAgICB0eXBlIENsaXBib2FyZEV2ZW50SGFuZGxlciAgID0gRXZlbnRIYW5kbGVyPENsaXBib2FyZEV2ZW50PlxuICAgICB0eXBlIENvbXBvc2l0aW9uRXZlbnRIYW5kbGVyID0gRXZlbnRIYW5kbGVyPENvbXBvc2l0aW9uRXZlbnQ+XG4gICAgIHR5cGUgRHJhZ0V2ZW50SGFuZGxlciAgICAgICAgPSBFdmVudEhhbmRsZXI8RHJhZ0V2ZW50PlxuICAgICB0eXBlIEZvY3VzRXZlbnRIYW5kbGVyICAgICAgID0gRXZlbnRIYW5kbGVyPEZvY3VzRXZlbnQ+XG4gICAgIHR5cGUgS2V5Ym9hcmRFdmVudEhhbmRsZXIgICAgPSBFdmVudEhhbmRsZXI8S2V5Ym9hcmRFdmVudD5cbiAgICAgdHlwZSBNb3VzZUV2ZW50SGFuZGxlciAgICAgICA9IEV2ZW50SGFuZGxlcjxNb3VzZUV2ZW50PlxuICAgICB0eXBlIFRvdWNoRXZlbnRIYW5kbGVyICAgICAgID0gRXZlbnRIYW5kbGVyPFRvdWNoRXZlbnQ+XG4gICAgIHR5cGUgVUlFdmVudEhhbmRsZXIgICAgICAgICAgPSBFdmVudEhhbmRsZXI8VUlFdmVudD5cbiAgICAgdHlwZSBXaGVlbEV2ZW50SGFuZGxlciAgICAgICA9IEV2ZW50SGFuZGxlcjxXaGVlbEV2ZW50PlxuICAgICB0eXBlIEFuaW1hdGlvbkV2ZW50SGFuZGxlciAgID0gRXZlbnRIYW5kbGVyPEFuaW1hdGlvbkV2ZW50PlxuICAgICB0eXBlIFRyYW5zaXRpb25FdmVudEhhbmRsZXIgID0gRXZlbnRIYW5kbGVyPFRyYW5zaXRpb25FdmVudD5cbiAgICAgdHlwZSBHZW5lcmljRXZlbnRIYW5kbGVyICAgICA9IEV2ZW50SGFuZGxlcjxFdmVudD5cbiAgICAgdHlwZSBQb2ludGVyRXZlbnRIYW5kbGVyICAgICA9IEV2ZW50SGFuZGxlcjxQb2ludGVyRXZlbnQ+XG5cbiAgICAgaW50ZXJmYWNlIERPTUF0dHJpYnV0ZXNcbiAgICAge1xuICAgICAgICAgIFtldmVudDogc3RyaW5nXTogYW55XG5cbiAgICAgICAgICAvLyAjcmVnaW9uIEltYWdlIEV2ZW50c1xuICAgICAgICAgIG9uTG9hZD8gICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uTG9hZENhcHR1cmU/IDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRXJyb3I/ICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRXJyb3JDYXB0dXJlPzogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIC8vICNlbmRyZWdpb25cblxuICAgICAgICAgIC8vICNyZWdpb24gQ2xpcGJvYXJkIEV2ZW50c1xuICAgICAgICAgIG9uQ29weT8gICAgICAgIDogQ2xpcGJvYXJkRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Db3B5Q2FwdHVyZT8gOiBDbGlwYm9hcmRFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkN1dD8gICAgICAgICA6IENsaXBib2FyZEV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uQ3V0Q2FwdHVyZT8gIDogQ2xpcGJvYXJkRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25QYXN0ZT8gICAgICAgOiBDbGlwYm9hcmRFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblBhc3RlQ2FwdHVyZT86IENsaXBib2FyZEV2ZW50SGFuZGxlclxuICAgICAgICAgIC8vICNlbmRyZWdpb25cblxuICAgICAgICAgIC8vICNyZWdpb24gQ29tcG9zaXRpb24gRXZlbnRzXG4gICAgICAgICAgb25Db21wb3NpdGlvbkVuZD8gICAgICAgICAgOiBDb21wb3NpdGlvbkV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uQ29tcG9zaXRpb25FbmRDYXB0dXJlPyAgIDogQ29tcG9zaXRpb25FdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkNvbXBvc2l0aW9uU3RhcnQ/ICAgICAgICA6IENvbXBvc2l0aW9uRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Db21wb3NpdGlvblN0YXJ0Q2FwdHVyZT8gOiBDb21wb3NpdGlvbkV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uQ29tcG9zaXRpb25VcGRhdGU/ICAgICAgIDogQ29tcG9zaXRpb25FdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkNvbXBvc2l0aW9uVXBkYXRlQ2FwdHVyZT86IENvbXBvc2l0aW9uRXZlbnRIYW5kbGVyXG4gICAgICAgICAgLy8gI2VuZHJlZ2lvblxuXG4gICAgICAgICAgLy8gI3JlZ2lvbiBGb2N1cyBFdmVudHNcbiAgICAgICAgICBvbkZvY3VzPyAgICAgICA6IEZvY3VzRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Gb2N1c0NhcHR1cmU/OiBGb2N1c0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uQmx1cj8gICAgICAgIDogRm9jdXNFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkJsdXJDYXB0dXJlPyA6IEZvY3VzRXZlbnRIYW5kbGVyXG4gICAgICAgICAgLy8gI2VuZHJlZ2lvblxuXG4gICAgICAgICAgLy8gI3JlZ2lvbiBGb3JtIEV2ZW50c1xuICAgICAgICAgIG9uQ2hhbmdlPyAgICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25DaGFuZ2VDYXB0dXJlPyA6IEdlbmVyaWNFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbklucHV0PyAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uSW5wdXRDYXB0dXJlPyAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25TZWFyY2g/ICAgICAgICA6IEdlbmVyaWNFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblNlYXJjaENhcHR1cmU/IDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uU3VibWl0PyAgICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25TdWJtaXRDYXB0dXJlPyA6IEdlbmVyaWNFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkludmFsaWQ/ICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uSW52YWxpZENhcHR1cmU/OiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgLy8gI2VuZHJlZ2lvblxuXG4gICAgICAgICAgLy8gI3JlZ2lvbiBLZXlib2FyZCBFdmVudHNcbiAgICAgICAgICBvbktleURvd24/ICAgICAgICA6IEtleWJvYXJkRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25LZXlEb3duQ2FwdHVyZT8gOiBLZXlib2FyZEV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uS2V5UHJlc3M/ICAgICAgIDogS2V5Ym9hcmRFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbktleVByZXNzQ2FwdHVyZT86IEtleWJvYXJkRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25LZXlVcD8gICAgICAgICAgOiBLZXlib2FyZEV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uS2V5VXBDYXB0dXJlPyAgIDogS2V5Ym9hcmRFdmVudEhhbmRsZXJcbiAgICAgICAgICAvLyAjZW5kcmVnaW9uXG5cbiAgICAgICAgICAvLyAjcmVnaW9uIE1lZGlhIEV2ZW50c1xuICAgICAgICAgIG9uQWJvcnQ/ICAgICAgICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uQWJvcnRDYXB0dXJlPyAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uQ2FuUGxheT8gICAgICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uQ2FuUGxheUNhcHR1cmU/ICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uQ2FuUGxheVRocm91Z2g/ICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uQ2FuUGxheVRocm91Z2hDYXB0dXJlPzogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRHVyYXRpb25DaGFuZ2U/ICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRHVyYXRpb25DaGFuZ2VDYXB0dXJlPzogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRW1wdGllZD8gICAgICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRW1wdGllZENhcHR1cmU/ICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRW5jcnlwdGVkPyAgICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRW5jcnlwdGVkQ2FwdHVyZT8gICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRW5kZWQ/ICAgICAgICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRW5kZWRDYXB0dXJlPyAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uTG9hZGVkRGF0YT8gICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uTG9hZGVkRGF0YUNhcHR1cmU/ICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uTG9hZGVkTWV0YWRhdGE/ICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uTG9hZGVkTWV0YWRhdGFDYXB0dXJlPzogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uTG9hZFN0YXJ0PyAgICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uTG9hZFN0YXJ0Q2FwdHVyZT8gICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uUGF1c2U/ICAgICAgICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uUGF1c2VDYXB0dXJlPyAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uUGxheT8gICAgICAgICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uUGxheUNhcHR1cmU/ICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uUGxheWluZz8gICAgICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uUGxheWluZ0NhcHR1cmU/ICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uUHJvZ3Jlc3M/ICAgICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uUHJvZ3Jlc3NDYXB0dXJlPyAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uUmF0ZUNoYW5nZT8gICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uUmF0ZUNoYW5nZUNhcHR1cmU/ICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uU2Vla2VkPyAgICAgICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uU2Vla2VkQ2FwdHVyZT8gICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uU2Vla2luZz8gICAgICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uU2Vla2luZ0NhcHR1cmU/ICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uU3RhbGxlZD8gICAgICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uU3RhbGxlZENhcHR1cmU/ICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uU3VzcGVuZD8gICAgICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uU3VzcGVuZENhcHR1cmU/ICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uVGltZVVwZGF0ZT8gICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uVGltZVVwZGF0ZUNhcHR1cmU/ICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uVm9sdW1lQ2hhbmdlPyAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uVm9sdW1lQ2hhbmdlQ2FwdHVyZT8gIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uV2FpdGluZz8gICAgICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uV2FpdGluZ0NhcHR1cmU/ICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIC8vICNlbmRyZWdpb25cblxuICAgICAgICAgIC8vICNyZWdpb24gTW91c2VFdmVudHNcbiAgICAgICAgICBvbkNsaWNrPyAgICAgICAgICAgICA6IE1vdXNlRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25DbGlja0NhcHR1cmU/ICAgICAgOiBNb3VzZUV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uQ29udGV4dE1lbnU/ICAgICAgIDogTW91c2VFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkNvbnRleHRNZW51Q2FwdHVyZT86IE1vdXNlRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25EYmxDbGljaz8gICAgICAgICAgOiBNb3VzZUV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRGJsQ2xpY2tDYXB0dXJlPyAgIDogTW91c2VFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkRyYWc/ICAgICAgICAgICAgICA6IERyYWdFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkRyYWdDYXB0dXJlPyAgICAgICA6IERyYWdFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkRyYWdFbmQ/ICAgICAgICAgICA6IERyYWdFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkRyYWdFbmRDYXB0dXJlPyAgICA6IERyYWdFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkRyYWdFbnRlcj8gICAgICAgICA6IERyYWdFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkRyYWdFbnRlckNhcHR1cmU/ICA6IERyYWdFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkRyYWdFeGl0PyAgICAgICAgICA6IERyYWdFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkRyYWdFeGl0Q2FwdHVyZT8gICA6IERyYWdFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkRyYWdMZWF2ZT8gICAgICAgICA6IERyYWdFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkRyYWdMZWF2ZUNhcHR1cmU/ICA6IERyYWdFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkRyYWdPdmVyPyAgICAgICAgICA6IERyYWdFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkRyYWdPdmVyQ2FwdHVyZT8gICA6IERyYWdFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkRyYWdTdGFydD8gICAgICAgICA6IERyYWdFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkRyYWdTdGFydENhcHR1cmU/ICA6IERyYWdFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkRyb3A/ICAgICAgICAgICAgICA6IERyYWdFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkRyb3BDYXB0dXJlPyAgICAgICA6IERyYWdFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbk1vdXNlRG93bj8gICAgICAgICA6IE1vdXNlRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Nb3VzZURvd25DYXB0dXJlPyAgOiBNb3VzZUV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uTW91c2VFbnRlcj8gICAgICAgIDogTW91c2VFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbk1vdXNlRW50ZXJDYXB0dXJlPyA6IE1vdXNlRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Nb3VzZUxlYXZlPyAgICAgICAgOiBNb3VzZUV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uTW91c2VMZWF2ZUNhcHR1cmU/IDogTW91c2VFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbk1vdXNlTW92ZT8gICAgICAgICA6IE1vdXNlRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Nb3VzZU1vdmVDYXB0dXJlPyAgOiBNb3VzZUV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uTW91c2VPdXQ/ICAgICAgICAgIDogTW91c2VFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbk1vdXNlT3V0Q2FwdHVyZT8gICA6IE1vdXNlRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Nb3VzZU92ZXI/ICAgICAgICAgOiBNb3VzZUV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uTW91c2VPdmVyQ2FwdHVyZT8gIDogTW91c2VFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbk1vdXNlVXA/ICAgICAgICAgICA6IE1vdXNlRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Nb3VzZVVwQ2FwdHVyZT8gICAgOiBNb3VzZUV2ZW50SGFuZGxlclxuICAgICAgICAgIC8vICNlbmRyZWdpb25cblxuICAgICAgICAgIC8vICNyZWdpb24gU2VsZWN0aW9uIEV2ZW50c1xuICAgICAgICAgIG9uU2VsZWN0PzogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uU2VsZWN0Q2FwdHVyZT86IEdlbmVyaWNFdmVudEhhbmRsZXJcbiAgICAgICAgICAvLyAjZW5kcmVnaW9uXG5cbiAgICAgICAgICAvLyAjcmVnaW9uIFRvdWNoIEV2ZW50c1xuICAgICAgICAgIG9uVG91Y2hDYW5jZWw/OiBUb3VjaEV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uVG91Y2hDYW5jZWxDYXB0dXJlPzogVG91Y2hFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblRvdWNoRW5kPzogVG91Y2hFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblRvdWNoRW5kQ2FwdHVyZT86IFRvdWNoRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Ub3VjaE1vdmU/OiBUb3VjaEV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uVG91Y2hNb3ZlQ2FwdHVyZT86IFRvdWNoRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Ub3VjaFN0YXJ0PzogVG91Y2hFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblRvdWNoU3RhcnRDYXB0dXJlPzogVG91Y2hFdmVudEhhbmRsZXJcbiAgICAgICAgICAvLyAjZW5kcmVnaW9uXG5cbiAgICAgICAgICAvLyAjcmVnaW9uIFBvaW50ZXIgRXZlbnRzXG4gICAgICAgICAgb25Qb2ludGVyT3Zlcj8gICAgICAgICAgICAgIDogUG9pbnRlckV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uUG9pbnRlck92ZXJDYXB0dXJlPyAgICAgICA6IFBvaW50ZXJFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblBvaW50ZXJFbnRlcj8gICAgICAgICAgICAgOiBQb2ludGVyRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Qb2ludGVyRW50ZXJDYXB0dXJlPyAgICAgIDogUG9pbnRlckV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uUG9pbnRlckRvd24/ICAgICAgICAgICAgICA6IFBvaW50ZXJFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblBvaW50ZXJEb3duQ2FwdHVyZT8gICAgICAgOiBQb2ludGVyRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Qb2ludGVyTW92ZT8gICAgICAgICAgICAgIDogUG9pbnRlckV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uUG9pbnRlck1vdmVDYXB0dXJlPyAgICAgICA6IFBvaW50ZXJFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblBvaW50ZXJVcD8gICAgICAgICAgICAgICAgOiBQb2ludGVyRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Qb2ludGVyVXBDYXB0dXJlPyAgICAgICAgIDogUG9pbnRlckV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uUG9pbnRlckNhbmNlbD8gICAgICAgICAgICA6IFBvaW50ZXJFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblBvaW50ZXJDYW5jZWxDYXB0dXJlPyAgICAgOiBQb2ludGVyRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Qb2ludGVyT3V0PyAgICAgICAgICAgICAgIDogUG9pbnRlckV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uUG9pbnRlck91dENhcHR1cmU/ICAgICAgICA6IFBvaW50ZXJFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblBvaW50ZXJMZWF2ZT8gICAgICAgICAgICAgOiBQb2ludGVyRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Qb2ludGVyTGVhdmVDYXB0dXJlPyAgICAgIDogUG9pbnRlckV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uR290UG9pbnRlckNhcHR1cmU/ICAgICAgICA6IFBvaW50ZXJFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkdvdFBvaW50ZXJDYXB0dXJlQ2FwdHVyZT8gOiBQb2ludGVyRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Mb3N0UG9pbnRlckNhcHR1cmU/ICAgICAgIDogUG9pbnRlckV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uTG9zdFBvaW50ZXJDYXB0dXJlQ2FwdHVyZT86IFBvaW50ZXJFdmVudEhhbmRsZXJcbiAgICAgICAgICAvLyAjZW5kcmVnaW9uXG5cbiAgICAgICAgICAvLyAjcmVnaW9uIFVJIEV2ZW50c1xuICAgICAgICAgIG9uU2Nyb2xsPyAgICAgICA6IFVJRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25TY3JvbGxDYXB0dXJlPzogVUlFdmVudEhhbmRsZXJcbiAgICAgICAgICAvLyAjZW5kcmVnaW9uXG5cbiAgICAgICAgICAvLyAjcmVnaW9uIFdoZWVsIEV2ZW50c1xuICAgICAgICAgIG9uV2hlZWw/ICAgICAgIDogV2hlZWxFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbldoZWVsQ2FwdHVyZT86IFdoZWVsRXZlbnRIYW5kbGVyXG4gICAgICAgICAgLy8gI2VuZHJlZ2lvblxuXG4gICAgICAgICAgLy8gI3JlZ2lvbiBBbmltYXRpb24gRXZlbnRzXG4gICAgICAgICAgb25BbmltYXRpb25TdGFydD8gICAgICAgICAgIDogQW5pbWF0aW9uRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25BbmltYXRpb25TdGFydENhcHR1cmU/ICAgIDogQW5pbWF0aW9uRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25BbmltYXRpb25FbmQ/ICAgICAgICAgICAgIDogQW5pbWF0aW9uRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25BbmltYXRpb25FbmRDYXB0dXJlPyAgICAgIDogQW5pbWF0aW9uRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25BbmltYXRpb25JdGVyYXRpb24/ICAgICAgIDogQW5pbWF0aW9uRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25BbmltYXRpb25JdGVyYXRpb25DYXB0dXJlPzogQW5pbWF0aW9uRXZlbnRIYW5kbGVyXG4gICAgICAgICAgLy8gI2VuZHJlZ2lvblxuXG4gICAgICAgICAgLy8gI3JlZ2lvbiBUcmFuc2l0aW9uIEV2ZW50c1xuICAgICAgICAgIG9uVHJhbnNpdGlvbkVuZD8gICAgICAgOiBUcmFuc2l0aW9uRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25UcmFuc2l0aW9uRW5kQ2FwdHVyZT86IFRyYW5zaXRpb25FdmVudEhhbmRsZXJcbiAgICAgICAgICAvLyAjZW5kcmVnaW9uXG4gICAgIH1cblxuICAgICBpbnRlcmZhY2UgSFRNTEF0dHJpYnV0ZXMgZXh0ZW5kcyBET01BdHRyaWJ1dGVzXG4gICAgIHtcbiAgICAgICAgICAvLyBTdGFuZGFyZCBIVE1MIEF0dHJpYnV0ZXNcbiAgICAgICAgICBhY2NlcHQ/ICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGFjY2VwdENoYXJzZXQ/ICAgIDogc3RyaW5nXG4gICAgICAgICAgYWNjZXNzS2V5PyAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBhY3Rpb24/ICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGFsbG93RnVsbFNjcmVlbj8gIDogc3RyaW5nIHwgYm9vbGVhblxuICAgICAgICAgIGFsbG93VHJhbnNwYXJlbmN5Pzogc3RyaW5nIHwgYm9vbGVhblxuICAgICAgICAgIGFsdD8gICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgYXN5bmM/ICAgICAgICAgICAgOiBzdHJpbmcgfCBib29sZWFuXG4gICAgICAgICAgYXV0b2NvbXBsZXRlPyAgICAgOiBzdHJpbmdcbiAgICAgICAgICBhdXRvQ29tcGxldGU/ICAgICA6IHN0cmluZ1xuICAgICAgICAgIGF1dG9jb3JyZWN0PyAgICAgIDogc3RyaW5nXG4gICAgICAgICAgYXV0b0NvcnJlY3Q/ICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBhdXRvZm9jdXM/ICAgICAgICA6IHN0cmluZyB8IGJvb2xlYW5cbiAgICAgICAgICBhdXRvRm9jdXM/ICAgICAgICA6IHN0cmluZyB8IGJvb2xlYW5cbiAgICAgICAgICBhdXRvUGxheT8gICAgICAgICA6IHN0cmluZyB8IGJvb2xlYW5cbiAgICAgICAgICBjYXB0dXJlPyAgICAgICAgICA6IHN0cmluZyB8IGJvb2xlYW5cbiAgICAgICAgICBjZWxsUGFkZGluZz8gICAgICA6IHN0cmluZyB8IG51bWJlclxuICAgICAgICAgIGNlbGxTcGFjaW5nPyAgICAgIDogc3RyaW5nIHwgbnVtYmVyXG4gICAgICAgICAgY2hhclNldD8gICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBjaGFsbGVuZ2U/ICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGNoZWNrZWQ/ICAgICAgICAgIDogc3RyaW5nIHwgYm9vbGVhblxuICAgICAgICAgIGNsYXNzPyAgICAgICAgICAgIDogc3RyaW5nIHwgc3RyaW5nW11cbiAgICAgICAgICBjbGFzc05hbWU/ICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGNvbHM/ICAgICAgICAgICAgIDogc3RyaW5nIHwgbnVtYmVyXG4gICAgICAgICAgY29sU3Bhbj8gICAgICAgICAgOiBzdHJpbmcgfCBudW1iZXJcbiAgICAgICAgICBjb250ZW50PyAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGNvbnRlbnRFZGl0YWJsZT8gIDogc3RyaW5nIHwgYm9vbGVhblxuICAgICAgICAgIGNvbnRleHRNZW51PyAgICAgIDogc3RyaW5nXG4gICAgICAgICAgY29udHJvbHM/ICAgICAgICAgOiBzdHJpbmcgfCBib29sZWFuXG4gICAgICAgICAgY29udHJvbHNMaXN0PyAgICAgOiBzdHJpbmdcbiAgICAgICAgICBjb29yZHM/ICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGNyb3NzT3JpZ2luPyAgICAgIDogc3RyaW5nXG4gICAgICAgICAgZGF0YT8gICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBkYXRlVGltZT8gICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGRlZmF1bHQ/ICAgICAgICAgIDogc3RyaW5nIHwgYm9vbGVhblxuICAgICAgICAgIGRlZmVyPyAgICAgICAgICAgIDogc3RyaW5nIHwgYm9vbGVhblxuICAgICAgICAgIGRpcj8gICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgZGlzYWJsZWQ/ICAgICAgICAgOiBzdHJpbmcgfCBib29sZWFuXG4gICAgICAgICAgZG93bmxvYWQ/ICAgICAgICAgOiBhbnlcbiAgICAgICAgICBkcmFnZ2FibGU/ICAgICAgICA6IHN0cmluZyB8IGJvb2xlYW5cbiAgICAgICAgICBlbmNUeXBlPyAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGZvcm0/ICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgZm9ybUFjdGlvbj8gICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBmb3JtRW5jVHlwZT8gICAgICA6IHN0cmluZ1xuICAgICAgICAgIGZvcm1NZXRob2Q/ICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgZm9ybU5vVmFsaWRhdGU/ICAgOiBzdHJpbmcgfCBib29sZWFuXG4gICAgICAgICAgZm9ybVRhcmdldD8gICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBmcmFtZUJvcmRlcj8gICAgICA6IHN0cmluZyB8IG51bWJlclxuICAgICAgICAgIGhlYWRlcnM/ICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgaGVpZ2h0PyAgICAgICAgICAgOiBzdHJpbmcgfCBudW1iZXJcbiAgICAgICAgICBoaWRkZW4/ICAgICAgICAgICA6IHN0cmluZyB8IGJvb2xlYW5cbiAgICAgICAgICBoaWdoPyAgICAgICAgICAgICA6IHN0cmluZyB8IG51bWJlclxuICAgICAgICAgIGhyZWY/ICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgaHJlZkxhbmc/ICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBmb3I/ICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGh0bWxGb3I/ICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgaHR0cEVxdWl2PyAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBpY29uPyAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGlkPyAgICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgaW5wdXRNb2RlPyAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBpbnRlZ3JpdHk/ICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGlzPyAgICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAga2V5UGFyYW1zPyAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBrZXlUeXBlPyAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGtpbmQ/ICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgbGFiZWw/ICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBsYW5nPyAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGxpc3Q/ICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgbG9vcD8gICAgICAgICAgICAgOiBzdHJpbmcgfCBib29sZWFuXG4gICAgICAgICAgbG93PyAgICAgICAgICAgICAgOiBzdHJpbmcgfCBudW1iZXJcbiAgICAgICAgICBtYW5pZmVzdD8gICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIG1hcmdpbkhlaWdodD8gICAgIDogc3RyaW5nIHwgbnVtYmVyXG4gICAgICAgICAgbWFyZ2luV2lkdGg/ICAgICAgOiBzdHJpbmcgfCBudW1iZXJcbiAgICAgICAgICBtYXg/ICAgICAgICAgICAgICA6IHN0cmluZyB8IG51bWJlclxuICAgICAgICAgIG1heExlbmd0aD8gICAgICAgIDogc3RyaW5nIHwgbnVtYmVyXG4gICAgICAgICAgbWVkaWE/ICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBtZWRpYUdyb3VwPyAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIG1ldGhvZD8gICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgbWluPyAgICAgICAgICAgICAgOiBzdHJpbmcgfCBudW1iZXJcbiAgICAgICAgICBtaW5MZW5ndGg/ICAgICAgICA6IHN0cmluZyB8IG51bWJlclxuICAgICAgICAgIG11bHRpcGxlPyAgICAgICAgIDogc3RyaW5nIHwgYm9vbGVhblxuICAgICAgICAgIG11dGVkPyAgICAgICAgICAgIDogc3RyaW5nIHwgYm9vbGVhblxuICAgICAgICAgIG5hbWU/ICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgbm9WYWxpZGF0ZT8gICAgICAgOiBzdHJpbmcgfCBib29sZWFuXG4gICAgICAgICAgb3Blbj8gICAgICAgICAgICAgOiBzdHJpbmcgfCBib29sZWFuXG4gICAgICAgICAgb3B0aW11bT8gICAgICAgICAgOiBzdHJpbmcgfCBudW1iZXJcbiAgICAgICAgICBwYXR0ZXJuPyAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHBsYWNlaG9sZGVyPyAgICAgIDogc3RyaW5nXG4gICAgICAgICAgcGxheXNJbmxpbmU/ICAgICAgOiBzdHJpbmcgfCBib29sZWFuXG4gICAgICAgICAgcG9zdGVyPyAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBwcmVsb2FkPyAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHJhZGlvR3JvdXA/ICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgcmVhZE9ubHk/ICAgICAgICAgOiBzdHJpbmcgfCBib29sZWFuXG4gICAgICAgICAgcmVsPyAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICByZXF1aXJlZD8gICAgICAgICA6IHN0cmluZyB8IGJvb2xlYW5cbiAgICAgICAgICByb2xlPyAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHJvd3M/ICAgICAgICAgICAgIDogc3RyaW5nIHwgbnVtYmVyXG4gICAgICAgICAgcm93U3Bhbj8gICAgICAgICAgOiBzdHJpbmcgfCBudW1iZXJcbiAgICAgICAgICBzYW5kYm94PyAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHNjb3BlPyAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgc2NvcGVkPyAgICAgICAgICAgOiBzdHJpbmcgfCBib29sZWFuXG4gICAgICAgICAgc2Nyb2xsaW5nPyAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBzZWFtbGVzcz8gICAgICAgICA6IHN0cmluZyB8IGJvb2xlYW5cbiAgICAgICAgICBzZWxlY3RlZD8gICAgICAgICA6IHN0cmluZyB8IGJvb2xlYW5cbiAgICAgICAgICBzaGFwZT8gICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHNpemU/ICAgICAgICAgICAgIDogc3RyaW5nIHwgbnVtYmVyXG4gICAgICAgICAgc2l6ZXM/ICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBzbG90PyAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHNwYW4/ICAgICAgICAgICAgIDogc3RyaW5nIHwgbnVtYmVyXG4gICAgICAgICAgc3BlbGxjaGVjaz8gICAgICAgOiBzdHJpbmcgfCBib29sZWFuXG4gICAgICAgICAgc3JjPyAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBzcmNzZXQ/ICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHNyY0RvYz8gICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgc3JjTGFuZz8gICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBzcmNTZXQ/ICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHN0YXJ0PyAgICAgICAgICAgIDogc3RyaW5nIHwgbnVtYmVyXG4gICAgICAgICAgc3RlcD8gICAgICAgICAgICAgOiBzdHJpbmcgfCBudW1iZXJcbiAgICAgICAgICBzdHlsZT8gICAgICAgICAgICA6IHN0cmluZyB8IHsgWyBrZXk6IHN0cmluZyBdOiBzdHJpbmcgfCBudW1iZXIgfVxuICAgICAgICAgIHN1bW1hcnk/ICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgdGFiSW5kZXg/ICAgICAgICAgOiBzdHJpbmcgfCBudW1iZXJcbiAgICAgICAgICB0YXJnZXQ/ICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHRpdGxlPyAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgdHlwZT8gICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICB1c2VNYXA/ICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHZhbHVlPyAgICAgICAgICAgIDogc3RyaW5nIHwgc3RyaW5nW10gfCBudW1iZXJcbiAgICAgICAgICB3aWR0aD8gICAgICAgICAgICA6IHN0cmluZyB8IG51bWJlclxuICAgICAgICAgIHdtb2RlPyAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgd3JhcD8gICAgICAgICAgICAgOiBzdHJpbmdcblxuICAgICAgICAgIC8vIFJERmEgQXR0cmlidXRlc1xuICAgICAgICAgIGFib3V0Pzogc3RyaW5nXG4gICAgICAgICAgZGF0YXR5cGU/OiBzdHJpbmdcbiAgICAgICAgICBpbmxpc3Q/OiBhbnlcbiAgICAgICAgICBwcmVmaXg/OiBzdHJpbmdcbiAgICAgICAgICBwcm9wZXJ0eT86IHN0cmluZ1xuICAgICAgICAgIHJlc291cmNlPzogc3RyaW5nXG4gICAgICAgICAgdHlwZW9mPzogc3RyaW5nXG4gICAgICAgICAgdm9jYWI/OiBzdHJpbmdcblxuICAgICAgICAgIC8vIE1pY3JvZGF0YSBBdHRyaWJ1dGVzXG4gICAgICAgICAgaXRlbVByb3A/OiBzdHJpbmdcbiAgICAgICAgICBpdGVtU2NvcGU/OiBib29sZWFuXG4gICAgICAgICAgaXRlbVR5cGU/OiBzdHJpbmdcbiAgICAgICAgICBpdGVtSUQ/OiBzdHJpbmdcbiAgICAgICAgICBpdGVtUmVmPzogc3RyaW5nXG4gICAgIH1cblxuICAgICBpbnRlcmZhY2UgU1ZHQXR0cmlidXRlcyBleHRlbmRzIEhUTUxBdHRyaWJ1dGVzXG4gICAgIHtcbiAgICAgICAgICBhY2NlbnRIZWlnaHQ/ICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGFjY3VtdWxhdGU/ICAgICAgICAgICAgICAgIDogXCJub25lXCIgfCBcInN1bVwiXG4gICAgICAgICAgYWRkaXRpdmU/ICAgICAgICAgICAgICAgICAgOiBcInJlcGxhY2VcIiB8IFwic3VtXCJcbiAgICAgICAgICBhbGlnbm1lbnRCYXNlbGluZT8gICAgICAgICA6IFwiYXV0b1wiIHwgXCJiYXNlbGluZVwiIHwgXCJiZWZvcmUtZWRnZVwiIHwgXCJ0ZXh0LWJlZm9yZS1lZGdlXCIgfCBcIm1pZGRsZVwiIHwgXCJjZW50cmFsXCIgfCBcImFmdGVyLWVkZ2VcIiB8IFwidGV4dC1hZnRlci1lZGdlXCIgfCBcImlkZW9ncmFwaGljXCIgfCBcImFscGhhYmV0aWNcIiB8IFwiaGFuZ2luZ1wiIHwgXCJtYXRoZW1hdGljYWxcIiB8IFwiaW5oZXJpdFwiXG4gICAgICAgICAgYWxsb3dSZW9yZGVyPyAgICAgICAgICAgICAgOiBcIm5vXCIgfCBcInllc1wiXG4gICAgICAgICAgYWxwaGFiZXRpYz8gICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBhbXBsaXR1ZGU/ICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGFyYWJpY0Zvcm0/ICAgICAgICAgICAgICAgIDogXCJpbml0aWFsXCIgfCBcIm1lZGlhbFwiIHwgXCJ0ZXJtaW5hbFwiIHwgXCJpc29sYXRlZFwiXG4gICAgICAgICAgYXNjZW50PyAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBhdHRyaWJ1dGVOYW1lPyAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGF0dHJpYnV0ZVR5cGU/ICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgYXV0b1JldmVyc2U/ICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBhemltdXRoPyAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGJhc2VGcmVxdWVuY3k/ICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgYmFzZWxpbmVTaGlmdD8gICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBiYXNlUHJvZmlsZT8gICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGJib3g/ICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgYmVnaW4/ICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBiaWFzPyAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGJ5PyAgICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgY2FsY01vZGU/ICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBjYXBIZWlnaHQ/ICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGNsaXA/ICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgY2xpcFBhdGg/ICAgICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBjbGlwUGF0aFVuaXRzPyAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGNsaXBSdWxlPyAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgY29sb3JJbnRlcnBvbGF0aW9uPyAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBjb2xvckludGVycG9sYXRpb25GaWx0ZXJzPyA6IFwiYXV0b1wiIHwgXCJzUkdCXCIgfCBcImxpbmVhclJHQlwiIHwgXCJpbmhlcml0XCJcbiAgICAgICAgICBjb2xvclByb2ZpbGU/ICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGNvbG9yUmVuZGVyaW5nPyAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgY29udGVudFNjcmlwdFR5cGU/ICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBjb250ZW50U3R5bGVUeXBlPyAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGN1cnNvcj8gICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgY3g/ICAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBjeT8gICAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGQ/ICAgICAgICAgICAgICAgICAgICAgICAgIDogc3RyaW5nIHwgKG51bWJlciB8IHN0cmluZykgW11cbiAgICAgICAgICBkZWNlbGVyYXRlPyAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGRlc2NlbnQ/ICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZGlmZnVzZUNvbnN0YW50PyAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBkaXJlY3Rpb24/ICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGRpc3BsYXk/ICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZGl2aXNvcj8gICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBkb21pbmFudEJhc2VsaW5lPyAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGR1cj8gICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZHg/ICAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBkeT8gICAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGVkZ2VNb2RlPyAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZWxldmF0aW9uPyAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBlbmFibGVCYWNrZ3JvdW5kPyAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGVuZD8gICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZXhwb25lbnQ/ICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBleHRlcm5hbFJlc291cmNlc1JlcXVpcmVkPyA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGZpbGw/ICAgICAgICAgICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgZmlsbE9wYWNpdHk/ICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBmaWxsUnVsZT8gICAgICAgICAgICAgICAgICA6IFwibm9uemVyb1wiIHwgXCJldmVub2RkXCIgfCBcImluaGVyaXRcIlxuICAgICAgICAgIGZpbHRlcj8gICAgICAgICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgZmlsdGVyUmVzPyAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBmaWx0ZXJVbml0cz8gICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGZsb29kQ29sb3I/ICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZmxvb2RPcGFjaXR5PyAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBmb2N1c2FibGU/ICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGZvbnRGYW1pbHk/ICAgICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgZm9udFNpemU/ICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBmb250U2l6ZUFkanVzdD8gICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGZvbnRTdHJldGNoPyAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZm9udFN0eWxlPyAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBmb250VmFyaWFudD8gICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGZvbnRXZWlnaHQ/ICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZm9ybWF0PyAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBmcm9tPyAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGZ4PyAgICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZnk/ICAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBnMT8gICAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGcyPyAgICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZ2x5cGhOYW1lPyAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBnbHlwaE9yaWVudGF0aW9uSG9yaXpvbnRhbD86IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGdseXBoT3JpZW50YXRpb25WZXJ0aWNhbD8gIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZ2x5cGhSZWY/ICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBncmFkaWVudFRyYW5zZm9ybT8gICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGdyYWRpZW50VW5pdHM/ICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgaGFuZ2luZz8gICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBob3JpekFkdlg/ICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGhvcml6T3JpZ2luWD8gICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgaWRlb2dyYXBoaWM/ICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBpbWFnZVJlbmRlcmluZz8gICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGluMj8gICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgaW4/ICAgICAgICAgICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBpbnRlcmNlcHQ/ICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGsxPyAgICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgazI/ICAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBrMz8gICAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGs0PyAgICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgaz8gICAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBrZXJuZWxNYXRyaXg/ICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGtlcm5lbFVuaXRMZW5ndGg/ICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAga2VybmluZz8gICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBrZXlQb2ludHM/ICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGtleVNwbGluZXM/ICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAga2V5VGltZXM/ICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBsZW5ndGhBZGp1c3Q/ICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGxldHRlclNwYWNpbmc/ICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgbGlnaHRpbmdDb2xvcj8gICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBsaW1pdGluZ0NvbmVBbmdsZT8gICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGxvY2FsPyAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgbWFya2VyRW5kPyAgICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBtYXJrZXJIZWlnaHQ/ICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIG1hcmtlck1pZD8gICAgICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgbWFya2VyU3RhcnQ/ICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBtYXJrZXJVbml0cz8gICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIG1hcmtlcldpZHRoPyAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgbWFzaz8gICAgICAgICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBtYXNrQ29udGVudFVuaXRzPyAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIG1hc2tVbml0cz8gICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgbWF0aGVtYXRpY2FsPyAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBtb2RlPyAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIG51bU9jdGF2ZXM/ICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgb2Zmc2V0PyAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBvcGFjaXR5PyAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIG9wZXJhdG9yPyAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgb3JkZXI/ICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBvcmllbnQ/ICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIG9yaWVudGF0aW9uPyAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgb3JpZ2luPyAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBvdmVyZmxvdz8gICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIG92ZXJsaW5lUG9zaXRpb24/ICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgb3ZlcmxpbmVUaGlja25lc3M/ICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBwYWludE9yZGVyPyAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHBhbm9zZTE/ICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgcGF0aExlbmd0aD8gICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBwYXR0ZXJuQ29udGVudFVuaXRzPyAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHBhdHRlcm5UcmFuc2Zvcm0/ICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgcGF0dGVyblVuaXRzPyAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBwb2ludGVyRXZlbnRzPyAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHBvaW50cz8gICAgICAgICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgcG9pbnRzQXRYPyAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBwb2ludHNBdFk/ICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHBvaW50c0F0Wj8gICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgcHJlc2VydmVBbHBoYT8gICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBwcmVzZXJ2ZUFzcGVjdFJhdGlvPyAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHByaW1pdGl2ZVVuaXRzPyAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgcj8gICAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICByYWRpdXM/ICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHJlZlg/ICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgcmVmWT8gICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICByZW5kZXJpbmdJbnRlbnQ/ICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHJlcGVhdENvdW50PyAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgcmVwZWF0RHVyPyAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICByZXF1aXJlZEV4dGVuc2lvbnM/ICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHJlcXVpcmVkRmVhdHVyZXM/ICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgcmVzdGFydD8gICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICByZXN1bHQ/ICAgICAgICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHJvdGF0ZT8gICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgcng/ICAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICByeT8gICAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHNjYWxlPyAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgc2VlZD8gICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBzaGFwZVJlbmRlcmluZz8gICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHNsb3BlPyAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgc3BhY2luZz8gICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBzcGVjdWxhckNvbnN0YW50PyAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHNwZWN1bGFyRXhwb25lbnQ/ICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgc3BlZWQ/ICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBzcHJlYWRNZXRob2Q/ICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHN0YXJ0T2Zmc2V0PyAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgc3RkRGV2aWF0aW9uPyAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBzdGVtaD8gICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHN0ZW12PyAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgc3RpdGNoVGlsZXM/ICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBzdG9wQ29sb3I/ICAgICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHN0b3BPcGFjaXR5PyAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgc3RyaWtldGhyb3VnaFBvc2l0aW9uPyAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBzdHJpa2V0aHJvdWdoVGhpY2tuZXNzPyAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHN0cmluZz8gICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgc3Ryb2tlPyAgICAgICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBzdHJva2VEYXNoYXJyYXk/ICAgICAgICAgICA6IHN0cmluZyB8IG51bWJlclxuICAgICAgICAgIHN0cm9rZURhc2hvZmZzZXQ/ICAgICAgICAgIDogc3RyaW5nIHwgbnVtYmVyXG4gICAgICAgICAgc3Ryb2tlTGluZWNhcD8gICAgICAgICAgICAgOiBcImJ1dHRcIiB8IFwicm91bmRcIiB8IFwic3F1YXJlXCIgfCBcImluaGVyaXRcIlxuICAgICAgICAgIHN0cm9rZUxpbmVqb2luPyAgICAgICAgICAgIDogXCJtaXRlclwiIHwgXCJyb3VuZFwiIHwgXCJiZXZlbFwiIHwgXCJpbmhlcml0XCJcbiAgICAgICAgICBzdHJva2VNaXRlcmxpbWl0PyAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHN0cm9rZU9wYWNpdHk/ICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgc3Ryb2tlV2lkdGg/ICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBzdXJmYWNlU2NhbGU/ICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHN5c3RlbUxhbmd1YWdlPyAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgdGFibGVWYWx1ZXM/ICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB0YXJnZXRYPyAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHRhcmdldFk/ICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgdGV4dEFuY2hvcj8gICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICB0ZXh0RGVjb3JhdGlvbj8gICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHRleHRMZW5ndGg/ICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgdGV4dFJlbmRlcmluZz8gICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB0bz8gICAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHRyYW5zZm9ybT8gICAgICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgdTE/ICAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB1Mj8gICAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHVuZGVybGluZVBvc2l0aW9uPyAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgdW5kZXJsaW5lVGhpY2tuZXNzPyAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB1bmljb2RlPyAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHVuaWNvZGVCaWRpPyAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgdW5pY29kZVJhbmdlPyAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB1bml0c1BlckVtPyAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHZBbHBoYWJldGljPyAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgdmFsdWVzPyAgICAgICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICB2ZWN0b3JFZmZlY3Q/ICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHZlcnNpb24/ICAgICAgICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgdmVydEFkdlk/ICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB2ZXJ0T3JpZ2luWD8gICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHZlcnRPcmlnaW5ZPyAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgdkhhbmdpbmc/ICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB2SWRlb2dyYXBoaWM/ICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHZpZXdCb3g/ICAgICAgICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgdmlld1RhcmdldD8gICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB2aXNpYmlsaXR5PyAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHZNYXRoZW1hdGljYWw/ICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgd2lkdGhzPyAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB3b3JkU3BhY2luZz8gICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHdyaXRpbmdNb2RlPyAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgeDE/ICAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB4Mj8gICAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHg/ICAgICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgeENoYW5uZWxTZWxlY3Rvcj8gICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICB4SGVpZ2h0PyAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHhsaW5rQWN0dWF0ZT8gICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgeGxpbmtBcmNyb2xlPyAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICB4bGlua0hyZWY/ICAgICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHhsaW5rUm9sZT8gICAgICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgeGxpbmtTaG93PyAgICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICB4bGlua1RpdGxlPyAgICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHhsaW5rVHlwZT8gICAgICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgeG1sQmFzZT8gICAgICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICB4bWxMYW5nPyAgICAgICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHhtbG5zPyAgICAgICAgICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgeG1sbnNYbGluaz8gICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICB4bWxTcGFjZT8gICAgICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHkxPyAgICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgeTI/ICAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB5PyAgICAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHlDaGFubmVsU2VsZWN0b3I/ICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgej8gICAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB6b29tQW5kUGFuPyAgICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICB9XG59XG4iLCJcbmltcG9ydCB7IGNyZWF0ZU5vZGUgfSBmcm9tIFwiLi4vLi4vRGF0YS9pbmRleFwiXG5pbXBvcnQgeyB4bm9kZSB9IGZyb20gXCJAdWkvQmFzZS94bm9kZVwiXG5cbmRlY2xhcmUgZ2xvYmFsXG57XG4gICAgIGludGVyZmFjZSAkQ29tcG9uZW50IGV4dGVuZHMgJENsdXN0ZXJcbiAgICAge1xuICAgICAgICAgIHJlYWRvbmx5IGNvbnRleHQ6IHR5cGVvZiBDT05URVhUX1VJXG4gICAgICAgICAgdHlwZTogc3RyaW5nXG4gICAgICAgICAgY2hpbGRyZW4/OiAkQ29tcG9uZW50IFtdIC8vIFJlY29yZCA8c3RyaW5nLCAkQ2hpbGQ+XG4gICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIENvbXBvbmVudCA8JCBleHRlbmRzICRDb21wb25lbnQgPSAkQ29tcG9uZW50Plxue1xuICAgICBkYXRhOiAkXG5cbiAgICAgY29udGFpbmVyOiBIVE1MRWxlbWVudCB8IFNWR0VsZW1lbnRcblxuICAgICBkZWZhdWx0RGF0YSAoKSA6ICRDb21wb25lbnRcbiAgICAge1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICBjb250ZXh0OiBDT05URVhUX1VJLFxuICAgICAgICAgICAgICAgdHlwZSAgIDogXCJjb21wb25lbnRcIixcbiAgICAgICAgICAgICAgIGlkICAgICA6IHVuZGVmaW5lZCxcbiAgICAgICAgICB9XG4gICAgIH1cblxuICAgICBjb25zdHJ1Y3RvciAoIGRhdGE6ICQgKVxuICAgICB7XG4gICAgICAgICAgdGhpcy5kYXRhID0gT2JqZWN0LmFzc2lnbiAoXG4gICAgICAgICAgICAgICB0aGlzLmRlZmF1bHREYXRhICgpLFxuICAgICAgICAgICAgICAgY3JlYXRlTm9kZSAoIGRhdGEudHlwZSwgZGF0YS5pZCwgZGF0YSApIGFzIGFueVxuICAgICAgICAgIClcbiAgICAgfVxuXG4gICAgIGdldEh0bWwgKCk6IChIVE1MRWxlbWVudCB8IFNWR0VsZW1lbnQpIFtdXG4gICAgIHtcbiAgICAgICAgICBpZiAoIHRoaXMuY29udGFpbmVyID09IHVuZGVmaW5lZCApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgdGhpcy5jb250YWluZXIgPSA8ZGl2IGNsYXNzPXsgdGhpcy5kYXRhLnR5cGUgfT48L2Rpdj5cbiAgICAgICAgICAgICAgIHRoaXMub25DcmVhdGUgKClcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gW3RoaXMuY29udGFpbmVyXVxuICAgICB9XG5cbiAgICAgb25DcmVhdGUgKClcbiAgICAge1xuXG4gICAgIH1cblxufVxuXG5cbiIsIlxuaW1wb3J0IHsgRmFjdG9yeSwgRGF0YWJhc2UgfSBmcm9tIFwiLi4vRGF0YS9pbmRleC5qc1wiXG5pbXBvcnQgeyBDb21wb25lbnQgfSBmcm9tIFwiLi9FbGVtZW50cy9jb21wb25lbnQuanNcIlxuXG5kZWNsYXJlIGdsb2JhbFxue1xuICAgICBjb25zdCBDT05URVhUX1VJOiBcImNvbmNlcHQtdWlcIlxufVxuT2JqZWN0LmRlZmluZVByb3BlcnR5ICggZ2xvYmFsVGhpcywgXCJDT05URVhUX1VJXCIsIHtcbiAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICAgdmFsdWU6IFwiY29uY2VwdC11aVwiXG59IClcblxuY29uc3QgZGIgICAgICA9IG5ldyBEYXRhYmFzZSA8JEFueUNvbXBvbmVudHM+ICgpXG5jb25zdCBmYWN0b3J5ID0gbmV3IEZhY3RvcnkgPENvbXBvbmVudCwgJEFueUNvbXBvbmVudHM+ICggZGIgKVxuXG5jb25zdCBpblN0b2NrOiB0eXBlb2YgZmFjdG9yeS5pblN0b2NrID0gZnVuY3Rpb24gKClcbntcbiAgICAgY29uc3QgYXJnID0gYXJndW1lbnRzLmxlbmd0aCA9PSAxXG4gICAgICAgICAgICAgICA/IG5vcm1hbGl6ZSAoIGFyZ3VtZW50cyBbMF0gKVxuICAgICAgICAgICAgICAgOiBub3JtYWxpemUgKCBbLi4uIGFyZ3VtZW50c10gKVxuXG4gICAgIGNvbnN0IHBhdGggPSBmYWN0b3J5LmdldFBhdGggKCBhcmcgKVxuXG4gICAgIHJldHVybiBmYWN0b3J5Ll9pblN0b2NrICggcGF0aCApXG59XG5cbmNvbnN0IHBpY2s6IHR5cGVvZiBmYWN0b3J5LnBpY2sgPSBmdW5jdGlvbiAoIC4uLiByZXN0OiBhbnkgW10gKVxue1xuICAgICBjb25zdCBhcmcgPSBhcmd1bWVudHMubGVuZ3RoID09IDFcbiAgICAgICAgICAgICAgID8gbm9ybWFsaXplICggYXJndW1lbnRzIFswXSApXG4gICAgICAgICAgICAgICA6IG5vcm1hbGl6ZSAoIFsuLi4gYXJndW1lbnRzXSApXG5cbiAgICAgY29uc3QgcGF0aCA9IGZhY3RvcnkuZ2V0UGF0aCAoIGFyZyApXG5cbiAgICAgcmV0dXJuIGZhY3RvcnkuX3BpY2sgKCBwYXRoIClcbn1cblxuY29uc3QgbWFrZTogdHlwZW9mIGZhY3RvcnkubWFrZSA9IGZ1bmN0aW9uICgpXG57XG4gICAgIGNvbnN0IGFyZyA9IGFyZ3VtZW50cy5sZW5ndGggPT0gMVxuICAgICAgICAgICAgICAgPyBub3JtYWxpemUgKCBhcmd1bWVudHMgWzBdIClcbiAgICAgICAgICAgICAgIDogbm9ybWFsaXplICggWy4uLiBhcmd1bWVudHNdIClcblxuICAgICBjb25zdCBwYXRoID0gZmFjdG9yeS5nZXRQYXRoICggYXJnIClcblxuICAgICBpZiAoIGlzTm9kZSAoIGFyZyApIClcbiAgICAgICAgICB2YXIgZGF0YSA9IGFyZ1xuXG4gICAgIHJldHVybiBmYWN0b3J5Ll9tYWtlICggcGF0aCwgZGF0YSApXG59XG5cbmNvbnN0IHNldDogdHlwZW9mIGRiLnNldCA9IGZ1bmN0aW9uICgpXG57XG4gICAgIGNvbnN0IGFyZyA9IG5vcm1hbGl6ZSAoIGFyZ3VtZW50cyBbMF0gKVxuXG4gICAgIGlmICggYXJndW1lbnRzLmxlbmd0aCA9PSAxIClcbiAgICAgICAgICBkYi5zZXQgKCBhcmcgKVxuICAgICBlbHNlXG4gICAgICAgICAgZGIuc2V0ICggYXJnLCBub3JtYWxpemUgKCBhcmd1bWVudHMgWzFdICkgKVxufVxuXG5jb25zdCBkZWZpbmUgPSBmYWN0b3J5LmRlZmluZS5iaW5kICggZmFjdG9yeSApIGFzIHR5cGVvZiBmYWN0b3J5LmRlZmluZVxuXG5leHBvcnQge1xuICAgICBpblN0b2NrLFxuICAgICBwaWNrLFxuICAgICBtYWtlLFxuICAgICBzZXQsXG4gICAgIGRlZmluZSxcbn1cblxuXG4vLyBVdGlsaXRpZXNcblxuXG5mdW5jdGlvbiBpc05vZGUgKCBvYmw6IGFueSApXG57XG4gICAgIHJldHVybiB0eXBlb2Ygb2JsID09IFwib2JqZWN0XCIgJiYgISBBcnJheS5pc0FycmF5IChvYmwpXG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZSAoIGFyZzogYW55IClcbntcbiAgICAgaWYgKCBBcnJheS5pc0FycmF5IChhcmcpIClcbiAgICAge1xuICAgICAgICAgIGlmICggYXJnIFswXSAhPT0gQ09OVEVYVF9VSSApXG4gICAgICAgICAgICAgICBhcmcudW5zaGlmdCAoIENPTlRFWFRfVUkgKVxuICAgICB9XG4gICAgIGVsc2UgaWYgKCB0eXBlb2YgYXJnID09IFwib2JqZWN0XCIgKVxuICAgICB7XG4gICAgICAgICAgaWYgKCBcImNvbnRleHRcIiBpbiBhcmcgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGlmICggYXJnLmNvbnRleHQgIT09IENPTlRFWFRfVUkgKVxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBcIkJhZCBjb250ZXh0IHZhbHVlXCJcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIChhcmcgYXMgYW55KS5jb250ZXh0ID0gQ09OVEVYVF9VSVxuICAgICAgICAgIH1cbiAgICAgfVxuXG4gICAgIHJldHVybiBhcmdcbn1cbiIsIlxuaW1wb3J0IHsgQ29tcG9uZW50IH0gZnJvbSBcIi4vY29tcG9uZW50LmpzXCJcbmltcG9ydCB7IHhub2RlIH0gZnJvbSBcIi4uL0Jhc2UveG5vZGUuanNcIlxuaW1wb3J0IHsgZGVmaW5lIH0gZnJvbSBcIi4uL2RiXCJcbmltcG9ydCB7IFBhbmVsIH0gZnJvbSBcIi4vcGFuZWwuanNcIlxuXG5kZWNsYXJlIGdsb2JhbFxue1xuXG4gICAgIGV4cG9ydCBpbnRlcmZhY2UgJFBlcnNvblZpZXdlciBleHRlbmRzICRQYW5lbFxuICAgICB7XG4gICAgICAgICAgcmVhZG9ubHkgdHlwZTogXCJwZXJzb24tdmlld2VyXCJcbiAgICAgfVxufVxuXG5leHBvcnQgY2xhc3MgUGVyc29uVmlld2VyIGV4dGVuZHMgQ29tcG9uZW50IDwkUGVyc29uVmlld2VyPlxue1xuICAgICBkaXNwbGF5ICggcGVyc29uOiAkUGVyc29uIClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IGNhcmQgPSA8ZGl2IGNsYXNzPVwidzMtY2FyZC00IHBlcnNvbi1jYXJkXCI+XG4gICAgICAgICAgICAgICA8aW1nIHNyYz17IHBlcnNvbi5hdmF0YXIgfSBhbHQ9XCJBdmF0YXJcIi8+XG4gICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwidzMtY29udGFpbmVyXCI+XG4gICAgICAgICAgICAgICAgICAgIDxoND5cbiAgICAgICAgICAgICAgICAgICAgICAgICA8Yj57IHBlcnNvbi5maXJzdE5hbWUgfTwvYj5cbiAgICAgICAgICAgICAgICAgICAgPC9oND5cbiAgICAgICAgICAgICAgICAgICAgPGxhYmVsPlxuICAgICAgICAgICAgICAgICAgICAgICAgIDxiPnsgcGVyc29uLmlzQ2FwdGFpbiA/IFwiRXhwZXJ0XCIgOiBudWxsIH08L2I+XG4gICAgICAgICAgICAgICAgICAgIDwvbGFiZWw+XG4gICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cblxuXG4gICAgICAgICAgdGhpcy5jb250YWluZXIuaW5uZXJIVE1MID0gXCJcIlxuICAgICAgICAgIHRoaXMuY29udGFpbmVyLmFwcGVuZCAoIGNhcmQgKVxuICAgICB9XG59XG5cbmRlZmluZSAoIFBlcnNvblZpZXdlciwge1xuICAgICBjb250ZXh0IDogQ09OVEVYVF9VSSxcbiAgICAgdHlwZSAgICA6IFwicGVyc29uLXZpZXdlclwiLFxuICAgICBpZCAgICAgIDogdW5kZWZpbmVkLFxuICAgICBwb3NpdGlvbjogXCJsZWZ0XCIsXG4gICAgIGJ1dHRvbiAgOiBudWxsXG59KVxuIiwiXG5pbXBvcnQgeyBTaGFwZSB9IGZyb20gXCIuL3NoYXBlXCJcblxuZGVjbGFyZSBnbG9iYWxcbntcbiAgICAgdHlwZSBHZW9tZXRyeU5hbWVzID0ga2V5b2YgdHlwZW9mIEZhY3RvcnlcblxuICAgICBpbnRlcmZhY2UgJEdlb21ldHJ5XG4gICAgIHtcbiAgICAgICAgICBzaGFwZTogR2VvbWV0cnlOYW1lc1xuICAgICAgICAgIHggICAgICAgICA6IG51bWJlclxuICAgICAgICAgIHkgICAgICAgICA6IG51bWJlclxuXG4gICAgICAgICAgYm9yZGVyV2lkdGggICAgOiBudW1iZXJcbiAgICAgICAgICBib3JkZXJDb2xvciAgICA6IHN0cmluZ1xuXG4gICAgICAgICAgYmFja2dyb3VuZENvbG9yIDogc3RyaW5nXG4gICAgICAgICAgYmFja2dyb3VuZEltYWdlIDogc3RyaW5nXG4gICAgICAgICAgYmFja2dyb3VuZFJlcGVhdDogYm9vbGVhblxuICAgICB9XG5cbiAgICAgaW50ZXJmYWNlICRUZXh0RGVmaW5pdGlvbiBleHRlbmRzICRHZW9tZXRyeVxuICAgICB7XG4gICAgICAgICAgdGV4dDogc3RyaW5nXG4gICAgIH1cblxuICAgICBpbnRlcmZhY2UgJFBhdGhEZWZpbml0aW9uIGV4dGVuZHMgJEdlb21ldHJ5XG4gICAgIHtcbiAgICAgICAgICBwYXRoOiBzdHJpbmdcbiAgICAgfVxufVxuXG5jb25zdCBmYWJyaWNfYmFzZV9vYnRpb25zOiBmYWJyaWMuSU9iamVjdE9wdGlvbnMgPSB7XG4gICAgIGxlZnQgICA6IDAsXG4gICAgIHRvcCAgICA6IDAsXG4gICAgIG9yaWdpblg6IFwiY2VudGVyXCIsXG4gICAgIG9yaWdpblk6IFwiY2VudGVyXCIsXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBncm91cCAoIGRlZjogJEdlb21ldHJ5LCBzaXplOiBudW1iZXIsIG9wdDogZmFicmljLklDaXJjbGVPcHRpb25zIClcbntcbiAgICAgcmV0dXJuIG5ldyBmYWJyaWMuR3JvdXAgKCB1bmRlZmluZWQsXG4gICAgIHtcbiAgICAgICAgICAuLi4gZmFicmljX2Jhc2Vfb2J0aW9ucyxcbiAgICAgICAgICAuLi4gb3B0LFxuICAgICAgICAgIHdpZHRoOiBzaXplLFxuICAgICAgICAgIGhlaWdodDogc2l6ZSxcbiAgICAgfSlcbn1cblxuLy8gVG8gZ2V0IHBvaW50cyBvZiB0cmlhbmdsZSwgc3F1YXJlLCBbcGFudGF8aGV4YV1nb25cbi8vXG4vLyB2YXIgYSA9IE1hdGguUEkqMi80XG4vLyBmb3IgKCB2YXIgaSA9IDAgOyBpICE9IDQgOyBpKysgKVxuLy8gICAgIGNvbnNvbGUubG9nICggYFsgJHsgTWF0aC5zaW4oYSppKSB9LCAkeyBNYXRoLmNvcyhhKmkpIH0gXWAgKVxuXG5leHBvcnQgZnVuY3Rpb24gY2lyY2xlICggZGVmOiAkR2VvbWV0cnksIHNpemU6IG51bWJlciwgb3B0OiBmYWJyaWMuSUNpcmNsZU9wdGlvbnMgKVxue1xuXG4gICAgIHJldHVybiBuZXcgZmFicmljLkNpcmNsZSAoXG4gICAgIHtcbiAgICAgICAgICAuLi4gZmFicmljX2Jhc2Vfb2J0aW9ucyxcbiAgICAgICAgICAuLi4gb3B0LFxuICAgICAgICAgIHJhZGl1czogc2l6ZSAvIDIsXG4gICAgIH0pXG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0cmlhbmdsZSAoIGRlZjogJEdlb21ldHJ5LCBzaXplOiBudW1iZXIsIG9wdDogZmFicmljLklUcmlhbmdsZU9wdGlvbnMgKVxue1xuICAgICBjb25zdCBwb2ludHMgPSBbXVxuICAgICBjb25zdCBzY2FsZSA9IDEuMlxuICAgICBjb25zdCByID0gc2l6ZSAvIDIgKiBzY2FsZVxuXG4gICAgIGZvciAoIGNvbnN0IHAgb2YgW1xuICAgICAgICAgIFsgMCwgMSBdLFxuICAgICAgICAgIFsgMC44NjYwMjU0MDM3ODQ0Mzg3LCAtMC40OTk5OTk5OTk5OTk5OTk4IF0sXG4gICAgICAgICAgWyAtMC44NjYwMjU0MDM3ODQ0Mzg1LCAtMC41MDAwMDAwMDAwMDAwMDA0IF1cbiAgICAgXSkgcG9pbnRzLnB1c2ggKHsgeDogcFswXSAqIHIsIHk6IHBbMV0gKiByIH0pXG5cbiAgICAgcmV0dXJuIG5ldyBmYWJyaWMuUG9seWdvbiAoIHBvaW50cywge1xuICAgICAgICAgIC4uLiBmYWJyaWNfYmFzZV9vYnRpb25zLFxuICAgICAgICAgIC4uLiBvcHQsXG4gICAgICAgICAgYW5nbGU6IDE4MCxcbiAgICAgfSlcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNxdWFyZSAoIGRlZjogJEdlb21ldHJ5LCBzaXplOiBudW1iZXIsIG9wdDogZmFicmljLklSZWN0T3B0aW9ucyApXG57XG4gICAgIGNvbnN0IHNjYWxlID0gMC45XG4gICAgIHJldHVybiBuZXcgZmFicmljLlJlY3QgKFxuICAgICB7XG4gICAgICAgICAgLi4uIGZhYnJpY19iYXNlX29idGlvbnMsXG4gICAgICAgICAgLi4uIG9wdCxcbiAgICAgICAgICB3aWR0aCA6IHNpemUgKiBzY2FsZSxcbiAgICAgICAgICBoZWlnaHQ6IHNpemUgKiBzY2FsZSxcbiAgICAgfSlcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhbnRhZ29uICggZGVmOiAkR2VvbWV0cnksIHNpemU6IG51bWJlciwgb3B0OiBmYWJyaWMuSU9iamVjdE9wdGlvbnMgKVxue1xuICAgICBjb25zdCBwb2ludHMgPSBbXVxuICAgICBjb25zdCBzY2FsZSA9IDEuMVxuICAgICBjb25zdCByID0gc2l6ZSAvIDIgKiBzY2FsZVxuXG4gICAgIGZvciAoIGNvbnN0IHAgb2YgW1xuICAgICAgICAgIFsgMCwgMSBdLFxuICAgICAgICAgIFsgMC45NTEwNTY1MTYyOTUxNTM1LCAwLjMwOTAxNjk5NDM3NDk0NzQ1IF0sXG4gICAgICAgICAgWyAwLjU4Nzc4NTI1MjI5MjQ3MzIsIC0wLjgwOTAxNjk5NDM3NDk0NzMgXSxcbiAgICAgICAgICBbIC0wLjU4Nzc4NTI1MjI5MjQ3MywgLTAuODA5MDE2OTk0Mzc0OTQ3NSBdLFxuICAgICAgICAgIFsgLTAuOTUxMDU2NTE2Mjk1MTUzNiwgMC4zMDkwMTY5OTQzNzQ5NDcyMyBdXG4gICAgIF0pIHBvaW50cy5wdXNoICh7IHg6IHBbMF0gKiByLCB5OiBwWzFdICogciB9KVxuXG4gICAgIHJldHVybiBuZXcgZmFicmljLlBvbHlnb24gKCBwb2ludHMsIHtcbiAgICAgICAgICAuLi4gZmFicmljX2Jhc2Vfb2J0aW9ucyxcbiAgICAgICAgICAuLi4gb3B0LFxuICAgICAgICAgIGFuZ2xlOiAxODAsXG4gICAgIH0pXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBoZXhhZ29uICggZGVmOiAkR2VvbWV0cnksIHNpemU6IG51bWJlciwgb3B0OiBmYWJyaWMuSU9iamVjdE9wdGlvbnMgKVxue1xuICAgICBjb25zdCBwb2ludHMgPSBbXVxuICAgICBjb25zdCBzY2FsZSA9IDEuMVxuICAgICBjb25zdCByID0gc2l6ZSAvIDIgKiBzY2FsZVxuXG4gICAgIGZvciAoIGNvbnN0IHAgb2YgW1xuICAgICAgICAgIFsgMCwgMSBdLFxuICAgICAgICAgIFsgMC44NjYwMjU0MDM3ODQ0Mzg2LCAwLjUwMDAwMDAwMDAwMDAwMDEgXSxcbiAgICAgICAgICBbIDAuODY2MDI1NDAzNzg0NDM4NywgLTAuNDk5OTk5OTk5OTk5OTk5OCBdLFxuICAgICAgICAgIFsgMS4yMjQ2NDY3OTkxNDczNTMyZS0xNiwgLTEgXSxcbiAgICAgICAgICBbIC0wLjg2NjAyNTQwMzc4NDQzODUsIC0wLjUwMDAwMDAwMDAwMDAwMDQgXSxcbiAgICAgICAgICBbIC0wLjg2NjAyNTQwMzc4NDQzOSwgMC40OTk5OTk5OTk5OTk5OTkzMyBdLFxuICAgICBdKSBwb2ludHMucHVzaCAoeyB4OiBwWzBdICogciwgeTogcFsxXSAqIHIgfSlcblxuICAgICByZXR1cm4gbmV3IGZhYnJpYy5Qb2x5Z29uICggcG9pbnRzLCB7XG4gICAgICAgICAgLi4uIGZhYnJpY19iYXNlX29idGlvbnMsXG4gICAgICAgICAgLi4uIG9wdCxcbiAgICAgICAgICBhbmdsZTogOTAsXG4gICAgIH0pXG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0ZXh0ICggZGVmOiAkVGV4dERlZmluaXRpb24sIHNpemU6IG51bWJlciwgb3B0OiBmYWJyaWMuVGV4dE9wdGlvbnMgKVxue1xuICAgICByZXR1cm4gbmV3IGZhYnJpYy5UZXh0ICggXCIuLi5cIiwge1xuICAgICAgICAgIC4uLiBmYWJyaWNfYmFzZV9vYnRpb25zLFxuICAgICAgICAgIC4uLiBvcHQsXG4gICAgICAgICAgZm9udFNpemU6IHNpemUsXG4gICAgIH0pXG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0ZXh0Ym94ICggZGVmOiAkVGV4dERlZmluaXRpb24sIHNpemU6IG51bWJlciwgb3B0OiBmYWJyaWMuVGV4dE9wdGlvbnMgKVxue1xuICAgICByZXR1cm4gbmV3IGZhYnJpYy5UZXh0Ym94ICggXCIuLi5cIiwge1xuICAgICAgICAgIC4uLiBmYWJyaWNfYmFzZV9vYnRpb25zLFxuICAgICAgICAgIC4uLiBvcHQsXG4gICAgICAgICAgZm9udFNpemU6IHNpemUsXG4gICAgIH0pXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXRoICggZGVmOiAkUGF0aERlZmluaXRpb24sIHNpemU6IG51bWJlciwgb3B0OiBmYWJyaWMuSU9iamVjdE9wdGlvbnMgKVxue1xuICAgICByZXR1cm4gbmV3IGZhYnJpYy5QYXRoICggZGVmLnBhdGgsXG4gICAgIHtcbiAgICAgICAgICAuLi4gZmFicmljX2Jhc2Vfb2J0aW9ucyxcbiAgICAgICAgICAuLi4gb3B0LFxuICAgICAgICAgIHNjYWxlWDogc2l6ZSAvIDEwMCwgLy8gRW4gc3VwcG9zYW50IHF1ZSBsZSB2aWV3Qm94XG4gICAgICAgICAgc2NhbGVZOiBzaXplIC8gMTAwLCAvLyBlc3QgXCIwIDAgMTAwIDEwMFwiXG4gICAgIH0pXG59XG5cbmNvbnN0IEZhY3RvcnkgPSB7XG4gICAgIGdyb3VwLFxuICAgICBjaXJjbGUsXG4gICAgIHRyaWFuZ2xlLFxuICAgICBzcXVhcmUsXG4gICAgIHBhbnRhZ29uLFxuICAgICBoZXhhZ29uICxcbiAgICAgdGV4dCxcbiAgICAgdGV4dGJveCAsXG4gICAgIHBhdGgsXG59XG5cblxuZXhwb3J0IGNsYXNzIEdlb21ldHJ5IDxUIGV4dGVuZHMgR2VvbWV0cnlOYW1lcyA9IEdlb21ldHJ5TmFtZXM+XG57XG4gICAgIGNvbmZpZzogJEdlb21ldHJ5XG4gICAgIG9iamVjdDogUmV0dXJuVHlwZSA8dHlwZW9mIEZhY3RvcnkgW1RdPlxuXG4gICAgIGNvbnN0cnVjdG9yICggcmVhZG9ubHkgb3duZXI6IFNoYXBlIClcbiAgICAge1xuICAgICAgICAgIHRoaXMuY29uZmlnID0gb3duZXIuY29uZmlnXG4gICAgICAgICAgdGhpcy51cGRhdGVTaGFwZSAoKVxuICAgICB9XG5cbiAgICAgdXBkYXRlICggb3B0aW9uczogUGFydGlhbCA8JEdlb21ldHJ5PiApXG4gICAgIHtcbiAgICAgICAgICBPYmplY3QuYXNzaWduICggdGhpcy5jb25maWcsIG9wdGlvbnMgKVxuXG4gICAgICAgICAgaWYgKCBcInNoYXBlXCIgaW4gb3B0aW9ucyApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgdGhpcy51cGRhdGVTaGFwZSAoKVxuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIGlmICggXCJiYWNrZ3JvdW5kSW1hZ2VcIiBpbiBvcHRpb25zIHx8IFwiYmFja2dyb3VuZFJlcGVhdFwiIGluIG9wdGlvbnMgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHRoaXMudXBkYXRlQmFja2dyb3VuZEltYWdlICgpXG4gICAgICAgICAgfVxuICAgICB9XG5cbiAgICAgdXBkYXRlUG9zaXRpb24gKClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHsgY29uZmlnLCBvYmplY3QgfSA9IHRoaXNcblxuICAgICAgICAgIDsob2JqZWN0IGFzIGZhYnJpYy5PYmplY3QpLnNldCAoe1xuICAgICAgICAgICAgICAgbGVmdDogY29uZmlnLngsXG4gICAgICAgICAgICAgICB0b3AgOiBjb25maWcueSxcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5zZXRDb29yZHMgKClcbiAgICAgfVxuXG4gICAgIHVwZGF0ZVNpemUgKClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHsgb3duZXIsIGNvbmZpZywgb2JqZWN0IH0gPSB0aGlzXG5cbiAgICAgICAgICBjb25zdCBzaXplID0gb3duZXIuZGlzcGxheVNpemUgKClcblxuICAgICAgICAgIGlmICggY29uZmlnLnNoYXBlID09IFwiY2lyY2xlXCIgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIChvYmplY3QgYXMgZmFicmljLkNpcmNsZSkuc2V0ICh7XG4gICAgICAgICAgICAgICAgICAgIHJhZGl1czogc2l6ZSAvIDJcbiAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICAob2JqZWN0IGFzIGZhYnJpYy5PYmplY3QpLnNldCAoe1xuICAgICAgICAgICAgICAgICAgICB3aWR0aCA6IHNpemUsXG4gICAgICAgICAgICAgICAgICAgIGhlaWdodDogc2l6ZSxcbiAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgb2JqZWN0LnNldENvb3JkcyAoKVxuICAgICB9XG5cbiAgICAgdXBkYXRlU2hhcGUgKCBzaGFwZT86IEdlb21ldHJ5TmFtZXMgKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgeyBjb25maWcsIG93bmVyIH0gPSB0aGlzXG5cbiAgICAgICAgICBpZiAoIGFyZ3VtZW50cy5sZW5ndGggPT0gMCApXG4gICAgICAgICAgICAgICBzaGFwZSA9IGNvbmZpZy5zaGFwZVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgIGNvbmZpZy5zaGFwZSA9IHNoYXBlXG5cbiAgICAgICAgICBpZiAoIG93bmVyLmdyb3VwICE9IHVuZGVmaW5lZCAmJiB0aGlzLm9iamVjdCAhPSB1bmRlZmluZWQgKVxuICAgICAgICAgICAgICAgb3duZXIuZ3JvdXAucmVtb3ZlICggdGhpcy5vYmplY3QgKVxuXG4gICAgICAgICAgY29uc3Qgb2JqID0gdGhpcy5vYmplY3RcbiAgICAgICAgICAgICAgICAgICAgPSBGYWN0b3J5IFtjb25maWcuc2hhcGUgYXMgYW55XSAoIGNvbmZpZywgb3duZXIuZGlzcGxheVNpemUgKCksIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICBsZWZ0ICAgICAgIDogMCwgLy9jb25maWcueCxcbiAgICAgICAgICAgICAgICAgICAgICAgICB0b3AgICAgICAgIDogMCwgLy9jb25maWcueSxcbiAgICAgICAgICAgICAgICAgICAgICAgICBvcmlnaW5YICAgIDogXCJjZW50ZXJcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICBvcmlnaW5ZICAgIDogXCJjZW50ZXJcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICBmaWxsICAgICAgIDogY29uZmlnLmJhY2tncm91bmRDb2xvcixcbiAgICAgICAgICAgICAgICAgICAgICAgICBzdHJva2UgICAgIDogY29uZmlnLmJvcmRlckNvbG9yLFxuICAgICAgICAgICAgICAgICAgICAgICAgIHN0cm9rZVdpZHRoOiBjb25maWcuYm9yZGVyV2lkdGgsXG4gICAgICAgICAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICBvd25lci5ncm91cC5hZGQgKCBvYmogKVxuICAgICAgICAgIG9iai5zZW5kVG9CYWNrICgpXG5cbiAgICAgICAgICBpZiAoIGNvbmZpZy5iYWNrZ3JvdW5kSW1hZ2UgIT0gdW5kZWZpbmVkIClcbiAgICAgICAgICAgICAgIHRoaXMudXBkYXRlQmFja2dyb3VuZEltYWdlICgpXG5cbiAgICAgICAgICBpZiAoIG9iai5jYW52YXMgIT0gdW5kZWZpbmVkIClcbiAgICAgICAgICAgICAgIG9iai5jYW52YXMucmVxdWVzdFJlbmRlckFsbCAoKVxuXG4gICAgIH1cblxuICAgICB1cGRhdGVCYWNrZ3JvdW5kSW1hZ2UgKCBwYXRoPzogc3RyaW5nIClcbiAgICAge1xuICAgICAgICAgIGlmICggYXJndW1lbnRzLmxlbmd0aCA9PSAwIClcbiAgICAgICAgICAgICAgIHBhdGggPSB0aGlzLmNvbmZpZy5iYWNrZ3JvdW5kSW1hZ2VcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICB0aGlzLmNvbmZpZy5iYWNrZ3JvdW5kSW1hZ2UgPSBwYXRoXG5cbiAgICAgICAgICBpZiAoIHR5cGVvZiBwYXRoID09IFwic3RyaW5nXCIgJiYgcGF0aC5sZW5ndGggPiAwIClcbiAgICAgICAgICAgICAgIGZhYnJpYy51dGlsLmxvYWRJbWFnZSAoIHBhdGgsIHRoaXMub25fcGF0dGVybi5iaW5kICh0aGlzKSApXG4gICAgIH1cblxuICAgICBwcml2YXRlIG9uX3BhdHRlcm4gKCBkaW1nOiBIVE1MSW1hZ2VFbGVtZW50IClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHsgb3duZXIgfSA9IHRoaXNcblxuICAgICAgICAgIGNvbnN0IGZhY3RvciA9IGRpbWcud2lkdGggPCBkaW1nLmhlaWdodFxuICAgICAgICAgICAgICAgICAgICAgICAgID8gb3duZXIuZGlzcGxheVNpemUgKCkgLyBkaW1nLndpZHRoXG4gICAgICAgICAgICAgICAgICAgICAgICAgOiBvd25lci5kaXNwbGF5U2l6ZSAoKSAvIGRpbWcuaGVpZ2h0XG5cbiAgICAgICAgICA7KHRoaXMub2JqZWN0IGFzIGFueSkuc2V0ICh7XG4gICAgICAgICAgICAgICBmaWxsOiBuZXcgZmFicmljLlBhdHRlcm4gKHtcbiAgICAgICAgICAgICAgICAgICAgc291cmNlOiBkaW1nLFxuICAgICAgICAgICAgICAgICAgICByZXBlYXQ6IFwibm8tcmVwZWF0XCIsXG4gICAgICAgICAgICAgICAgICAgIHBhdHRlcm5UcmFuc2Zvcm06IFtcbiAgICAgICAgICAgICAgICAgICAgICAgICBmYWN0b3IsIDAsIDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgZmFjdG9yLCAwLCAwLFxuICAgICAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgICB9KVxuICAgICAgICAgIH0pXG4gICAgICAgICAgLnNldENvb3JkcyAoKVxuXG4gICAgICAgICAgaWYgKCB0aGlzLm9iamVjdC5jYW52YXMgKVxuICAgICAgICAgICAgICAgdGhpcy5vYmplY3QuY2FudmFzLnJlbmRlckFsbCAoKVxuICAgICB9XG59XG4iLCJcbmltcG9ydCB7IEdlb21ldHJ5IH0gZnJvbSBcIi4vZ2VvbWV0cnlcIlxuaW1wb3J0IHsgQ3RvciBhcyBEYXRhQ3RvciB9IGZyb20gXCJAZGF0YVwiXG5cbmRlY2xhcmUgZ2xvYmFsXG57XG4gICAgIGludGVyZmFjZSAkU2hhcGVFdmVudHMgPEQgZXh0ZW5kcyAkTm9kZSA9IGFueT5cbiAgICAge1xuICAgICAgICAgIG9uQ3JlYXRlOiAoIGVudGl0eTogRCwgYXNwZWN0OiBTaGFwZSApID0+IHZvaWQsXG4gICAgICAgICAgb25EZWxldGU6ICggZW50aXR5OiBELCBzaGFwZTogU2hhcGUgKSA9PiB2b2lkLFxuICAgICAgICAgIG9uVG91Y2g6ICggYXNwZWN0OiBTaGFwZSApID0+IHZvaWRcbiAgICAgfVxuXG4gICAgIGludGVyZmFjZSAkU2hhcGUgPEQgZXh0ZW5kcyAkVGhpbmcgPSAkVGhpbmc+IGV4dGVuZHMgJE5vZGUsICRHZW9tZXRyeSwgJFNoYXBlRXZlbnRzXG4gICAgIHtcbiAgICAgICAgICBjb250ZXh0OiBcImNvbmNlcHQtYXNwZWN0XCJcblxuICAgICAgICAgIGRhdGE6IERcblxuICAgICAgICAgIG1pblNpemUgICA6IG51bWJlclxuICAgICAgICAgIHNpemVPZmZzZXQ6IG51bWJlclxuICAgICAgICAgIHNpemVGYWN0b3I6IG51bWJlclxuICAgICB9XG59XG5cbmV4cG9ydCB0eXBlIEN0b3IgPERhdGEgZXh0ZW5kcyAkU2hhcGUgPSAkU2hhcGUsIFQgZXh0ZW5kcyBTaGFwZSA9IFNoYXBlPiA9IERhdGFDdG9yIDxEYXRhLCBUPlxuXG5leHBvcnQgY2xhc3MgU2hhcGUgPCQgZXh0ZW5kcyAkU2hhcGUgPSAkU2hhcGU+XG57XG4gICAgIGRlZmF1bHRDb25maWcgKCk6ICRTaGFwZVxuICAgICB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgIGNvbnRleHQ6IFwiY29uY2VwdC1hc3BlY3RcIixcbiAgICAgICAgICAgICAgIHR5cGUgICA6IFwic2hhcGVcIixcbiAgICAgICAgICAgICAgIGlkICAgICA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgIGRhdGEgICA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgIHggICAgICA6IDAsXG4gICAgICAgICAgICAgICB5ICAgICAgOiAwLFxuICAgICAgICAgICAgICAgLy9zaXplICAgICAgOiAyMCxcbiAgICAgICAgICAgICAgIG1pblNpemUgICA6IDEsXG4gICAgICAgICAgICAgICBzaXplRmFjdG9yOiAxLFxuICAgICAgICAgICAgICAgc2l6ZU9mZnNldDogMCxcblxuICAgICAgICAgICAgICAgc2hhcGUgICAgICAgICAgIDogXCJjaXJjbGVcIixcbiAgICAgICAgICAgICAgIGJvcmRlckNvbG9yICAgICA6IFwiZ3JheVwiLFxuICAgICAgICAgICAgICAgYm9yZGVyV2lkdGggICAgIDogNSxcblxuICAgICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yIDogXCJ0cmFuc3BhcmVudFwiLFxuICAgICAgICAgICAgICAgYmFja2dyb3VuZEltYWdlIDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgYmFja2dyb3VuZFJlcGVhdDogZmFsc2UsXG5cbiAgICAgICAgICAgICAgIG9uQ3JlYXRlICAgICAgICA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgIG9uRGVsZXRlICAgICAgICA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgIG9uVG91Y2ggICAgICAgICA6IHVuZGVmaW5lZCxcbiAgICAgICAgICB9XG4gICAgIH1cblxuICAgICByZWFkb25seSBjb25maWc6ICRcblxuICAgICBncm91cCA9IHVuZGVmaW5lZCBhcyBmYWJyaWMuR3JvdXBcblxuICAgICByZWFkb25seSBiYWNrZ3JvdW5kOiBHZW9tZXRyeVxuICAgICByZWFkb25seSBib3JkZXI6IEdlb21ldHJ5XG5cbiAgICAgY29uc3RydWN0b3IgKCBkYXRhOiAkIClcbiAgICAge1xuICAgICAgICAgIHRoaXMuYmFja2dyb3VuZCA9IHVuZGVmaW5lZFxuICAgICAgICAgIHRoaXMuYm9yZGVyID0gdW5kZWZpbmVkXG4gICAgICAgICAgdGhpcy5jb25maWcgPSB7XG4gICAgICAgICAgICAgICAuLi4gdGhpcy5kZWZhdWx0Q29uZmlnICgpLFxuICAgICAgICAgICAgICAgLi4uIGRhdGFcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjb25zdCB7IGNvbmZpZyB9ID0gdGhpc1xuXG4gICAgICAgICAgY29uc3QgZ3JvdXAgPSB0aGlzLmdyb3VwID0gbmV3IGZhYnJpYy5Hcm91cCAoIFtdLFxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHdpZHRoICAgICAgOiB0aGlzLmRpc3BsYXlTaXplICgpLFxuICAgICAgICAgICAgICAgaGVpZ2h0ICAgICA6IHRoaXMuZGlzcGxheVNpemUgKCksXG4gICAgICAgICAgICAgICBsZWZ0ICAgICAgIDogY29uZmlnLngsXG4gICAgICAgICAgICAgICB0b3AgICAgICAgIDogY29uZmlnLnksXG4gICAgICAgICAgICAgICBoYXNCb3JkZXJzIDogdHJ1ZSxcbiAgICAgICAgICAgICAgIGhhc0NvbnRyb2xzOiB0cnVlLFxuICAgICAgICAgICAgICAgb3JpZ2luWCAgICA6IFwiY2VudGVyXCIsXG4gICAgICAgICAgICAgICBvcmlnaW5ZICAgIDogXCJjZW50ZXJcIixcbiAgICAgICAgICB9KVxuXG4gICAgICAgICAgOyh0aGlzLmJhY2tncm91bmQgYXMgR2VvbWV0cnkpID0gbmV3IEdlb21ldHJ5ICggdGhpcyApXG5cbiAgICAgICAgICBncm91cC5zZXRDb29yZHMgKClcbiAgICAgfVxuXG4gICAgIGRpc3BsYXlTaXplICgpXG4gICAgIHtcbiAgICAgICAgICBjb25zdCBjb25maWcgPSB0aGlzLmNvbmZpZ1xuXG4gICAgICAgICAgdmFyIHNpemUgPSAoMSArIGNvbmZpZy5zaXplT2Zmc2V0KSAqIGNvbmZpZy5zaXplRmFjdG9yXG5cbiAgICAgICAgICBpZiAoIHNpemUgPCBjb25maWcubWluU2l6ZSApXG4gICAgICAgICAgICAgICBzaXplID0gY29uZmlnLm1pblNpemVcblxuICAgICAgICAgIHJldHVybiBzaXplIHx8IDFcbiAgICAgfVxuXG4gICAgIHVwZGF0ZVNpemUgKClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHsgZ3JvdXAsIGNvbmZpZyB9ID0gdGhpc1xuXG4gICAgICAgICAgaWYgKCB0aGlzLmJhY2tncm91bmQgKVxuICAgICAgICAgICAgICAgdGhpcy5iYWNrZ3JvdW5kLnVwZGF0ZVNpemUgKClcblxuICAgICAgICAgIGlmICggdGhpcy5ib3JkZXIgKVxuICAgICAgICAgICAgICAgdGhpcy5ib3JkZXIudXBkYXRlU2l6ZSAoKVxuXG4gICAgICAgICAgZ3JvdXAuc2V0ICh7XG4gICAgICAgICAgICAgICB3aWR0aCA6IHRoaXMuZGlzcGxheVNpemUgKCksXG4gICAgICAgICAgICAgICBoZWlnaHQ6IHRoaXMuZGlzcGxheVNpemUgKCksXG4gICAgICAgICAgfSlcblxuICAgICAgICAgIGlmICggZ3JvdXAuY2FudmFzIClcbiAgICAgICAgICAgICAgIGdyb3VwLmNhbnZhcy5yZXF1ZXN0UmVuZGVyQWxsICgpXG4gICAgIH1cblxuICAgICBjb29yZHMgKClcbiAgICAge1xuICAgICAgICAgIHJldHVybiB0aGlzLmdyb3VwLmdldENvb3JkcyAoKVxuICAgICB9XG5cbiAgICAgc2V0QmFja2dyb3VuZCAoIG9wdGlvbnM6IFBhcnRpYWwgPCRHZW9tZXRyeT4gKVxuICAgICB7XG4gICAgICAgICAgT2JqZWN0LmFzc2lnbiAoIHRoaXMuY29uZmlnLCBvcHRpb25zIClcblxuICAgICAgICAgIHRoaXMuYmFja2dyb3VuZC51cGRhdGUgKCBvcHRpb25zIClcblxuICAgICAgICAgIHRoaXMudXBkYXRlU2l6ZSAoKVxuICAgICB9XG5cbiAgICAgc2V0UG9zaXRpb24gKCB4OiBudW1iZXIsIHk6IG51bWJlciApXG4gICAgIHtcbiAgICAgICAgICBjb25zdCB7IGdyb3VwLCBjb25maWcgfSA9IHRoaXNcblxuICAgICAgICAgIGNvbmZpZy54ID0geFxuICAgICAgICAgIGNvbmZpZy55ID0geVxuICAgICAgICAgIGdyb3VwLnNldCAoeyBsZWZ0OiB4LCB0b3AgOiB5IH0pLnNldENvb3JkcyAoKVxuXG4gICAgICAgICAgaWYgKCBncm91cC5jYW52YXMgKVxuICAgICAgICAgICAgICAgZ3JvdXAuY2FudmFzLnJlcXVlc3RSZW5kZXJBbGwgKClcbiAgICAgfVxuXG4gICAgIGhvdmVyICggdXA6IGJvb2xlYW4gKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgdGFyZ2V0ID0gdGhpcy5iYWNrZ3JvdW5kICE9IHVuZGVmaW5lZFxuICAgICAgICAgICAgICAgICAgICAgICAgID8gdGhpcy5iYWNrZ3JvdW5kLm9iamVjdFxuICAgICAgICAgICAgICAgICAgICAgICAgIDogdGhpcy5ncm91cFxuXG4gICAgICAgICAgdGFyZ2V0LnNldFNoYWRvdyggJ3JnYmEoMCwwLDAsMC4zKScgKVxuXG4gICAgICAgICAgZmFicmljLnV0aWwuYW5pbWF0ZSh7XG4gICAgICAgICAgICAgICBzdGFydFZhbHVlOiB1cCA/IDAgOiAxLFxuICAgICAgICAgICAgICAgZW5kVmFsdWUgIDogdXAgPyAxIDogMCxcbiAgICAgICAgICAgICAgIGVhc2luZyAgICA6IGZhYnJpYy51dGlsLmVhc2UuZWFzZU91dEN1YmljLFxuICAgICAgICAgICAgICAgYnlWYWx1ZSAgIDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgZHVyYXRpb24gIDogMTAwLFxuICAgICAgICAgICAgICAgb25DaGFuZ2UgIDogKCB2YWx1ZTogbnVtYmVyICkgPT5cbiAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgb2Zmc2V0ID0gMSAqIHZhbHVlXG5cbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0LnNldFNoYWRvdyggYCR7IG9mZnNldCB9cHggJHsgb2Zmc2V0IH1weCAkeyAxMCAqIHZhbHVlIH1weCByZ2JhKDAsMCwwLDAuMylgIClcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0LnNjYWxlKCAxICsgMC4xICogdmFsdWUgKVxuICAgICAgICAgICAgICAgICAgICB0YXJnZXQuY2FudmFzLnJlcXVlc3RSZW5kZXJBbGwgKClcbiAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSlcbiAgICAgfVxuXG4gICAgIHRvSnNvbiAoKVxuICAgICB7XG4gICAgICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5ICggdGhpcy5jb25maWcgKVxuICAgICB9XG59XG4iLCJcbmltcG9ydCB7IERhdGFiYXNlLCBGYWN0b3J5IH0gZnJvbSBcIi4uL0RhdGEvaW5kZXhcIlxuaW1wb3J0IHsgU2hhcGUgfSBmcm9tIFwiLi9zaGFwZVwiXG5pbXBvcnQgeyBXcml0YWJsZSwgT3B0aW9uYWwgfSBmcm9tIFwiLi4vTGliL2luZGV4XCJcblxuXG5leHBvcnQgY29uc3QgQ09OVEVYVCA9IFwiY29uY2VwdC1hc3BlY3RcIlxuY29uc3QgZGIgICAgICA9IG5ldyBEYXRhYmFzZSAoKVxuY29uc3QgZmFjdG9yeSA9IG5ldyBGYWN0b3J5IDxTaGFwZT4gKCBkYiApXG5jb25zdCBBU1BFQ1QgID0gU3ltYm9sLmZvciAoIFwiQVNQRUNUXCIgKVxuXG5cbmV4cG9ydCBmdW5jdGlvbiBnZXQgPFQgZXh0ZW5kcyBTaGFwZT4gKCBvYmo6ICROb2RlIHwgU2hhcGUgfCBmYWJyaWMuT2JqZWN0ICk6IFQgfCB1bmRlZmluZWRcbntcbiAgICAgaWYgKCBvYmogPT0gdW5kZWZpbmVkIClcbiAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkXG5cbiAgICAgaWYgKCBvYmogaW5zdGFuY2VvZiBTaGFwZSApXG4gICAgICAgICAgcmV0dXJuIG9iaiBhcyBUXG5cbiAgICAgaWYgKCBvYmogaW5zdGFuY2VvZiBmYWJyaWMuT2JqZWN0IClcbiAgICAgICAgICByZXR1cm4gb2JqIFtBU1BFQ1RdXG5cbiAgICAgaWYgKCBmYWN0b3J5LmluU3RvY2sgKCBDT05URVhULCBvYmoudHlwZSwgb2JqLmlkICkgKVxuICAgICAgICAgIHJldHVybiBmYWN0b3J5Lm1ha2UgKCBDT05URVhULCBvYmoudHlwZSwgb2JqLmlkIClcblxuICAgICBjb25zdCBvcHRpb25zICA9IG9iai5jb250ZXh0ID09IENPTlRFWFRcbiAgICAgICAgICAgICAgICAgICAgPyBvYmogYXMgJFNoYXBlXG4gICAgICAgICAgICAgICAgICAgIDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRleHQ6IENPTlRFWFQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgdHlwZSAgIDogb2JqLnR5cGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgaWQgICAgIDogb2JqLmlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGEgICA6IG9iaixcbiAgICAgICAgICAgICAgICAgICAgfSBhcyAkU2hhcGVcblxuICAgICBpZiAoICEgaXNGaW5pdGUgKG9wdGlvbnMueCkgKVxuICAgICAgICAgIG9wdGlvbnMueCA9IDBcblxuICAgICBpZiAoICEgaXNGaW5pdGUgKG9wdGlvbnMueSkgKVxuICAgICAgICAgIG9wdGlvbnMueSA9IDBcblxuICAgICBjb25zdCBzaGFwZSA9IGZhY3RvcnkubWFrZSAoIG9wdGlvbnMgKVxuXG4gICAgIC8vIHNoYXBlLmV2ZW50cyA9IGFyZ3VtZW50cy5ldmVudHNcbiAgICAgLy8gT2JqZWN0LmFzc2lnbiAoIHNoYXBlLCBldmVudHMgKVxuXG4gICAgIC8vc2hhcGUuaW5pdCAoKVxuICAgICBzaGFwZS5ncm91cCBbQVNQRUNUXSA9IHNoYXBlXG5cbiAgICAgaWYgKCBzaGFwZS5jb25maWcub25DcmVhdGUgKVxuICAgICAgICAgIHNoYXBlLmNvbmZpZy5vbkNyZWF0ZSAoIHNoYXBlLmNvbmZpZy5kYXRhLCBzaGFwZSApXG5cbiAgICAgcmV0dXJuIHNoYXBlIGFzIFRcbn1cblxuXG5leHBvcnQgZnVuY3Rpb24gc2V0IDwkIGV4dGVuZHMgJFNoYXBlPiAoIG5vZGU6ICRJbiA8JD4gKVxue1xuICAgICBkYi5zZXQgKCBub3JtYWxpemUgKCBub2RlICkgKVxufVxuXG5cbmV4cG9ydCBmdW5jdGlvbiBkZWZpbmUgKCBjdG9yOiBuZXcgKCBkYXRhOiAkU2hhcGUgKSA9PiBTaGFwZSwgdHlwZTogc3RyaW5nIClcbntcbiAgICAgZmFjdG9yeS5fZGVmaW5lICggY3RvciwgW0NPTlRFWFQsIHR5cGVdIClcbn1cblxuXG4vLyBVdGlsaXRpZXNcblxuXG50eXBlICRJbiA8JCBleHRlbmRzICRTaGFwZSA9ICRTaGFwZT4gPSBPcHRpb25hbCA8JCwgXCJjb250ZXh0XCI+XG5cblxuZnVuY3Rpb24gbm9ybWFsaXplICggbm9kZTogJEluIClcbntcbiAgICAgaWYgKCBcImNvbnRleHRcIiBpbiBub2RlIClcbiAgICAge1xuICAgICAgICAgIGlmICggbm9kZS5jb250ZXh0ICE9PSBDT05URVhUIClcbiAgICAgICAgICAgICAgIHRocm93IFwiQmFkIGNvbnRleHQgdmFsdWVcIlxuICAgICB9XG4gICAgIGVsc2VcbiAgICAge1xuICAgICAgICAgIChub2RlIGFzIFdyaXRhYmxlIDwkU2hhcGU+KS5jb250ZXh0ID0gQ09OVEVYVFxuICAgICB9XG5cbiAgICAgcmV0dXJuIG5vZGUgYXMgJFNoYXBlXG59XG5cbiIsIi8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uL0FwcGxpY2F0aW9uL25vZGVzLmQudHNcIiAvPlxuXG5pbXBvcnQgeyBEYXRhYmFzZSB9IGZyb20gXCJAZGF0YVwiXG5pbXBvcnQgeyBPcHRpb25hbCB9IGZyb20gXCJAbGliXCJcblxuXG5kZWNsYXJlIGdsb2JhbFxue1xuICAgICBjb25zdCBDT05URVhUX0RBVEE6IFwiY29uY2VwdC1kYXRhXCJcbiAgICAgLy8gZnVuY3Rpb24gbm9kZSA8VCBleHRlbmRzICRJbnB1dE5vZGU+ICggdHlwZTogc3RyaW5nLCBpZDogc3RyaW5nICkgICAgOiAkT3V0cHV0Tm9kZSA8VD5cbiAgICAgLy8gZnVuY3Rpb24gbm9kZSA8VCBleHRlbmRzICRJbnB1dE5vZGU+ICggdHlwZTogc3RyaW5nLCBkZXNjcmlwdGlvbjogVCApOiAkT3V0cHV0Tm9kZSA8VD5cbiAgICAgLy8gZnVuY3Rpb24gbm9kZSA8VCBleHRlbmRzICRJbnB1dE5vZGU+ICggZGVzY3JpcHRpb246IFQgKSAgICAgICAgICAgICAgOiAkT3V0cHV0Tm9kZSA8VD5cbn1cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eSAoIGdsb2JhbFRoaXMsIFwiQ09OVEVYVF9EQVRBXCIsIHtcbiAgICAgY29uZmlndXJhYmxlOiBmYWxzZSxcbiAgICAgd3JpdGFibGU6IGZhbHNlLFxuICAgICB2YWx1ZTogXCJjb25jZXB0LWRhdGFcIlxufSlcblxuXG5jb25zdCBkYiA9IG5ldyBEYXRhYmFzZSAoKVxuXG5cbnR5cGUgJEluVGhpbmcgID0gT3B0aW9uYWwgPCRUaGluZywgXCJjb250ZXh0XCIgfCBcInR5cGVcIj5cbnR5cGUgJEluVGhpbmcyID0gT3B0aW9uYWwgPCRUaGluZywgXCJjb250ZXh0XCIgfCBcInR5cGVcIiB8IFwiaWRcIj5cbnR5cGUgJE91dFRoaW5nIDxJbiBleHRlbmRzICRJblRoaW5nMj4gPSAkVGhpbmcgJiBSZXF1aXJlZCA8SW4+XG5cbmV4cG9ydCBmdW5jdGlvbiBkYXRhIDxUIGV4dGVuZHMgJEluVGhpbmc+ICggdHlwZTogc3RyaW5nLCBpZDogc3RyaW5nICkgICAgOiAkT3V0VGhpbmcgPFQ+XG5leHBvcnQgZnVuY3Rpb24gZGF0YSA8VCBleHRlbmRzICRJblRoaW5nPiAoIHR5cGU6IHN0cmluZywgZGVzY3JpcHRpb246IFQgKTogJE91dFRoaW5nIDxUPlxuZXhwb3J0IGZ1bmN0aW9uIGRhdGEgPFQgZXh0ZW5kcyAkSW5UaGluZz4gKCBkZXNjcmlwdGlvbjogVCApICAgICAgICAgICAgICA6ICRPdXRUaGluZyA8VD5cblxuZXhwb3J0IGZ1bmN0aW9uIGRhdGEgKCBhOiBzdHJpbmcgfCAkSW5UaGluZywgYj86IHN0cmluZyB8ICRJblRoaW5nICkgOiAkVGhpbmdcbntcbiAgICAgc3dpdGNoICggYXJndW1lbnRzLmxlbmd0aCApXG4gICAgIHtcbiAgICAgY2FzZSAxOiAvLyBkYXRhICggZGVzY3JpcHRpb24gKVxuXG4gICAgICAgICAgaWYgKCB0eXBlb2YgYSAhPSBcIm9iamVjdFwiIHx8IGEgPT0gbnVsbCB8fCBBcnJheS5pc0FycmF5IChhKSApXG4gICAgICAgICAgICAgICB0aHJvdyBgQmFkIGFyZ3VtZW50IFwiZGVzY3JpcHRpb25cIiA6ICR7IGEgfWBcblxuICAgICAgICAgIGIgPSBhXG4gICAgICAgICAgYSA9IGIudHlwZVxuXG4gICAgIGNhc2UgMjogLy8gZGF0YSAoIHR5cGUsIGlkICkgfCBkYXRhICggdHlwZSwgZGVzY3JpcHRpb24gKVxuXG4gICAgICAgICAgaWYgKCB0eXBlb2YgYSAhPSBcInN0cmluZ1wiIClcbiAgICAgICAgICAgICAgIHRocm93IGBCYWQgYXJndW1lbnQgXCJ0eXBlXCIgOiAkeyBhIH1gXG5cbiAgICAgICAgICBpZiAoIHR5cGVvZiBiID09IFwic3RyaW5nXCIgKVxuICAgICAgICAgICAgICAgcmV0dXJuIGRiLmdldCAoIENPTlRFWFRfREFUQSwgYSwgYiApXG5cbiAgICAgICAgICBpZiAoIHR5cGVvZiBiICE9IFwib2JqZWN0XCIgfHwgYiA9PSBudWxsIHx8IEFycmF5LmlzQXJyYXkgKGIpIClcbiAgICAgICAgICAgICAgIHRocm93IGBCYWQgYXJndW1lbnQgXCJkZXNjcmlwdGlvblwiIDogJHsgYiB9YFxuXG4gICAgICAgICAgOyhiIGFzIGFueSkuY29udGV4dCA9IENPTlRFWFRfREFUQVxuICAgICAgICAgIDsoYiBhcyBhbnkpLnR5cGUgPSBhXG4gICAgICAgICAgcmV0dXJuIGRiLnNldCAoIGIgYXMgJFRoaW5nIClcblxuICAgICBkZWZhdWx0OlxuICAgICAgICAgIHRocm93IGBCYWQgYXJndW1lbnRzOiAyIGFyZ3VtZW50cyBleHBlY3RlZCBidXQgJHsgYXJndW1lbnRzLmxlbmd0aCB9IHJlY2VpdmVkYFxuICAgICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhbGlhcyA8VCBleHRlbmRzICRUaGluZz4gKCBmbjogRnVuY3Rpb24sIHR5cGU6IHN0cmluZyApXG57XG4gICAgIHN3aXRjaCAoIGZuLm5hbWUgKVxuICAgICB7XG4gICAgIGNhc2UgXCJkYXRhXCI6IHJldHVybiBjcmVhdGUgPFQ+ICggQ09OVEVYVF9EQVRBLCB0eXBlIClcbiAgICAgfVxufVxuXG5mdW5jdGlvbiBjcmVhdGUgPFQgZXh0ZW5kcyAkVGhpbmc+ICggY29udGV4dDogc3RyaW5nLCB0eXBlOiBzdHJpbmcgKVxue1xuICAgICAvLyBmbiAoIGlkIClcbiAgICAgLy8gZm4gKCBkZXNjcmlwdGlvbiApXG4gICAgIC8vIGZuICggaWQsIGRlc2NyaXB0aW9uIClcbiAgICAgcmV0dXJuICgoIGlkOiBzdHJpbmcgfCBULCBkZXNjcmlwdGlvbj86IFQgKSA6IFQgPT5cbiAgICAge1xuICAgICAgICAgIGlmICggYXJndW1lbnRzLmxlbmd0aCA9PSAxIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBpZiAoIHR5cGVvZiBpZCAhPSBcInN0cmluZ1wiIClcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgYEJhZyBpZDogJHsgaWQgfWBcblxuICAgICAgICAgICAgICAgcmV0dXJuIGRiLmdldCA8VD4gKCBjb250ZXh0LCB0eXBlLCBpZCApXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKCB0eXBlb2YgaWQgIT0gXCJzdHJpbmdcIiApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgZGVzY3JpcHRpb24gPSBpZFxuXG4gICAgICAgICAgICAgICBpZiAoIHR5cGVvZiBkZXNjcmlwdGlvbi5pZCAhPSBcInN0cmluZ1wiIClcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgYEJhZyBhcmd1bWVudCBcImRlc2NyaXB0aW9uXCI6IGludmFsaWQgaWRgXG5cbiAgICAgICAgICAgICAgIGlkID0gZGVzY3JpcHRpb24uaWRcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoIHR5cGVvZiBkZXNjcmlwdGlvbiAhPSBcIm9iamVjdFwiIHx8IGRlc2NyaXB0aW9uID09IG51bGwgfHwgaXNBcnJheSAoZGVzY3JpcHRpb24pIClcbiAgICAgICAgICAgICAgIHRocm93IGBCYWcgYXJndW1lbnQgXCJkZXNjcmlwdGlvblwiIDogaWQgbm90IGZvdW5kYFxuXG4gICAgICAgICAgcmV0dXJuIGRiLnNldCA8VD4gICh7IC4uLiBkZXNjcmlwdGlvbiwgY29udGV4dCwgdHlwZSwgIGlkOiBpZCB9KVxuICAgICB9KSBhc1xuICAgICB7XG4gICAgICAgICAgKCBpZDogc3RyaW5nICk6IFRcbiAgICAgICAgICAoIGRlc2NyaXB0aW9uOiBPcHRpb25hbCA8VCwgXCJjb250ZXh0XCIgfCBcInR5cGVcIj4gKTogVFxuICAgICAgICAgICggaWQ6IHN0cmluZywgZGVzY3JpcHRpb246IE9wdGlvbmFsIDxULCBcImNvbnRleHRcIiB8IFwidHlwZVwiIHwgXCJpZFwiPiApOiBUXG4gICAgIH1cbn1cblxuY29uc3QgaXNBcnJheSA9IEFycmF5LmlzQXJyYXlcbiIsIlxuLypcbmV4YW1wbGU6XG5odHRwczovL3ByZXppLmNvbS9wLzlqcWUyd2tmaGhreS9sYS1idWxsb3RlcmllLXRwY21uL1xuaHR0cHM6Ly9tb3ZpbGFiLm9yZy9pbmRleC5waHA/dGl0bGU9VXRpbGlzYXRldXI6QXVyJUMzJUE5bGllbk1hcnR5XG5cbiovXG5cblxuaW1wb3J0IHsgR2VvbWV0cnkgfSBmcm9tIFwiLi4vLi4vTGliL2luZGV4XCJcblxuaW1wb3J0IHsgU2hhcGUgfSAgIGZyb20gXCJAYXNwZWN0L3NoYXBlXCJcbmltcG9ydCAqIGFzIGFzcGVjdCBmcm9tIFwiQGFzcGVjdC9kYlwiXG5pbXBvcnQgKiBhcyBkYiAgICAgZnJvbSBcIkBhcGkvZGF0YVwiXG5cbmltcG9ydCBcImZhYnJpY1wiXG5cbmZhYnJpYy5PYmplY3QucHJvdG90eXBlLnBhZGRpbmcgICAgICAgICAgICA9IDBcbmZhYnJpYy5PYmplY3QucHJvdG90eXBlLm9iamVjdENhY2hpbmcgICAgICA9IGZhbHNlXG5mYWJyaWMuT2JqZWN0LnByb3RvdHlwZS5oYXNDb250cm9scyAgICAgICAgPSB0cnVlXG5mYWJyaWMuT2JqZWN0LnByb3RvdHlwZS5oYXNCb3JkZXJzICAgICAgICAgPSB0cnVlXG5mYWJyaWMuT2JqZWN0LnByb3RvdHlwZS5oYXNSb3RhdGluZ1BvaW50ICAgPSBmYWxzZVxuZmFicmljLk9iamVjdC5wcm90b3R5cGUudHJhbnNwYXJlbnRDb3JuZXJzID0gZmFsc2VcbmZhYnJpYy5PYmplY3QucHJvdG90eXBlLmNlbnRlcmVkU2NhbGluZyAgICA9IHRydWVcbmZhYnJpYy5PYmplY3QucHJvdG90eXBlLmNvcm5lclN0eWxlICAgICAgICA9IFwiY2lyY2xlXCJcbmZhYnJpYy5PYmplY3QucHJvdG90eXBlLnNldENvbnRyb2xWaXNpYmxlICggXCJtbFwiLCBmYWxzZSApXG5mYWJyaWMuT2JqZWN0LnByb3RvdHlwZS5zZXRDb250cm9sVmlzaWJsZSAoIFwibXRcIiwgZmFsc2UgKVxuZmFicmljLk9iamVjdC5wcm90b3R5cGUuc2V0Q29udHJvbFZpc2libGUgKCBcIm1yXCIsIGZhbHNlIClcbmZhYnJpYy5PYmplY3QucHJvdG90eXBlLnNldENvbnRyb2xWaXNpYmxlICggXCJtYlwiLCBmYWxzZSApXG5mYWJyaWMuT2JqZWN0LnByb3RvdHlwZS5zZXRDb250cm9sVmlzaWJsZSAoIFwidGxcIiwgZmFsc2UgKVxuZmFicmljLk9iamVjdC5wcm90b3R5cGUuc2V0Q29udHJvbFZpc2libGUgKCBcImJsXCIsIGZhbHNlIClcbmZhYnJpYy5PYmplY3QucHJvdG90eXBlLnNldENvbnRyb2xWaXNpYmxlICggXCJiclwiLCBmYWxzZSApXG5cbmV4cG9ydCBpbnRlcmZhY2UgVmlld1xue1xuICAgICBuYW1lOiBzdHJpbmdcbiAgICAgYWN0aXZlOiBib29sZWFuXG4gICAgIGNoaWxkcmVuIDogU2hhcGUgW11cbiAgICAgdGh1bWJuYWlsOiBzdHJpbmdcbiAgICAgcGFja2luZyAgOiBcImVuY2xvc2VcIlxufVxuXG5leHBvcnQgY2xhc3MgQXJlYVxue1xuICAgICByZWFkb25seSBmY2FudmFzOiBmYWJyaWMuQ2FudmFzXG4gICAgIHByaXZhdGUgYWN0aXZlOiBWaWV3XG4gICAgIHByaXZhdGUgdmlld3MgPSB7fSBhcyBSZWNvcmQgPHN0cmluZywgVmlldz5cblxuICAgICBjb25zdHJ1Y3RvciAoIGNhbnZhczogSFRNTENhbnZhc0VsZW1lbnQgKVxuICAgICB7XG4gICAgICAgICAgdGhpcy5mY2FudmFzID0gbmV3IGZhYnJpYy5DYW52YXMgKCBjYW52YXMgKVxuICAgICAgICAgIHRoaXMuZW5hYmxlRXZlbnRzICgpXG4gICAgIH1cblxuICAgICBnZXQgdmlldyAoKVxuICAgICB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuYWN0aXZlXG4gICAgIH1cblxuICAgICBvdmVyRk9iamVjdDogZmFicmljLk9iamVjdCA9IHVuZGVmaW5lZFxuXG4gICAgIHN0YXRpYyBjdXJyZW50RXZlbnQ6IGZhYnJpYy5JRXZlbnRcbiAgICAgb25PdmVyT2JqZWN0ICA9IG51bGwgYXMgKCBvYmo6IFNoYXBlICkgPT4gdm9pZFxuICAgICBvbk91dE9iamVjdCAgID0gbnVsbCBhcyAoIG9iajogU2hhcGUgKSA9PiB2b2lkXG4gICAgIG9uVG91Y2hPYmplY3QgPSBudWxsIGFzICggb2JqOiBTaGFwZSApID0+IHZvaWRcbiAgICAgb25Eb3VibGVUb3VjaE9iamVjdCA9IG51bGwgYXMgKCBvYmo6IFNoYXBlICkgPT4gdm9pZFxuICAgICBvblRvdWNoQXJlYSAgID0gbnVsbCBhcyAoIHg6IG51bWJlciwgeTogbnVtYmVyICkgPT4gdm9pZFxuXG4gICAgIGNyZWF0ZVZpZXcgKCBuYW1lOiBzdHJpbmcgKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgeyB2aWV3cyB9ID0gdGhpc1xuXG4gICAgICAgICAgaWYgKCBuYW1lIGluIHZpZXdzIClcbiAgICAgICAgICAgICAgIHRocm93IFwiVGhlIHZpZXcgYWxyZWFkeSBleGlzdHNcIlxuXG4gICAgICAgICAgcmV0dXJuIHZpZXdzIFtuYW1lXSA9IHtcbiAgICAgICAgICAgICAgIG5hbWUsXG4gICAgICAgICAgICAgICBhY3RpdmUgICA6IGZhbHNlLFxuICAgICAgICAgICAgICAgY2hpbGRyZW4gOiBbXSxcbiAgICAgICAgICAgICAgIHBhY2tpbmcgIDogXCJlbmNsb3NlXCIsXG4gICAgICAgICAgICAgICB0aHVtYm5haWw6IG51bGwsXG4gICAgICAgICAgfVxuICAgICB9XG5cbiAgICAgdXNlICggbmFtZTogc3RyaW5nICk6IFZpZXdcbiAgICAgdXNlICggdmlldzogVmlldyApICA6IFZpZXdcbiAgICAgdXNlICggbmFtZTogc3RyaW5nIHwgVmlldyApOiBWaWV3XG4gICAgIHtcbiAgICAgICAgICBjb25zdCB7IGZjYW52YXMsIHZpZXdzIH0gPSB0aGlzXG5cbiAgICAgICAgICBpZiAoIHR5cGVvZiBuYW1lICE9IFwic3RyaW5nXCIgKVxuICAgICAgICAgICAgICAgbmFtZSA9IG5hbWUubmFtZVxuXG4gICAgICAgICAgaWYgKCB0aGlzLmFjdGl2ZSAmJiB0aGlzLmFjdGl2ZS5uYW1lID09IG5hbWUgKVxuICAgICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgICBpZiAoICEgKG5hbWUgaW4gdmlld3MpIClcbiAgICAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgICAgY29uc3QgYWN0aXZlID0gdGhpcy5hY3RpdmUgPSB2aWV3cyBbbmFtZV1cblxuICAgICAgICAgIGZjYW52YXMuY2xlYXIgKClcblxuICAgICAgICAgIGZvciAoIGNvbnN0IHNoYXBlIG9mIGFjdGl2ZS5jaGlsZHJlbiApXG4gICAgICAgICAgICAgICBmY2FudmFzLmFkZCAoIHNoYXBlLmdyb3VwIClcblxuICAgICAgICAgIHJldHVybiBhY3RpdmVcbiAgICAgfVxuXG4gICAgIGFkZCAoIC4uLiBzaGFwZXM6IChTaGFwZSB8ICROb2RlKSBbXSApOiB2b2lkXG4gICAgIGFkZCAoIC4uLiBwYXRoOiBzdHJpbmcgW10gKTogdm9pZFxuICAgICBhZGQgKClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHsgYWN0aXZlLCBmY2FudmFzIH0gPSB0aGlzXG5cbiAgICAgICAgICBpZiAoIGFyZ3VtZW50cy5sZW5ndGggPT0gMCApXG4gICAgICAgICAgICAgICByZXR1cm5cblxuICAgICAgICAgIGlmICggdHlwZW9mIGFyZ3VtZW50cyBbMF0gPT0gXCJzdHJpbmdcIiApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgLy9jb25zdCBub2RlID0gZGIuZ2V0Tm9kZSAoIC4uLiBhcmd1bWVudHMgYXMgYW55IGFzIHN0cmluZyBbXSApXG4gICAgICAgICAgICAgICBjb25zdCBub2RlID0gZGIuZGF0YSAoIGFyZ3VtZW50cyBbMF0sIGFyZ3VtZW50cyBbMV0gYXMgc3RyaW5nICApXG4gICAgICAgICAgICAgICBjb25zdCBzaHAgPSBhc3BlY3QuZ2V0ICggbm9kZSApXG4gICAgICAgICAgICAgICBhY3RpdmUuY2hpbGRyZW4ucHVzaCAoIHNocCApXG4gICAgICAgICAgICAgICBmY2FudmFzLmFkZCAoIHNocC5ncm91cCApXG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2UgZm9yICggY29uc3QgcyBvZiBhcmd1bWVudHMgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNvbnN0IHNocCA9IGFzcGVjdC5nZXQgKCBzIGFzICROb2RlIHwgU2hhcGUgKVxuXG4gICAgICAgICAgICAgICAvLyBzaHAuZ2V0RmFicmljXG4gICAgICAgICAgICAgICAvLyBzaHAuZ2V0SHRtbFxuICAgICAgICAgICAgICAgLy8gc2hwLmdldFN2Z1xuXG4gICAgICAgICAgICAgICAvLyBmYWN0b3J5XG5cbiAgICAgICAgICAgICAgIGFjdGl2ZS5jaGlsZHJlbi5wdXNoICggc2hwIClcbiAgICAgICAgICAgICAgIGZjYW52YXMuYWRkICggc2hwLmdyb3VwIClcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBmY2FudmFzLnJlcXVlc3RSZW5kZXJBbGwgKClcbiAgICAgfVxuXG4gICAgIGNsZWFyICgpXG4gICAgIHtcbiAgICAgICAgICB0aGlzLmZjYW52YXMuY2xlYXIgKClcbiAgICAgfVxuXG4gICAgIHBhY2sgKClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHsgZmNhbnZhcyB9ID0gdGhpc1xuXG4gICAgICAgICAgY29uc3Qgb2JqZWN0cyA9IGZjYW52YXMuZ2V0T2JqZWN0cyAoKVxuICAgICAgICAgIGNvbnN0IHBvc2l0aW9ucyA9IFtdIGFzIEdlb21ldHJ5LkNpcmNsZSBbXVxuXG4gICAgICAgICAgZm9yICggY29uc3QgZyBvZiBvYmplY3RzIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBjb25zdCByID0gKGcud2lkdGggPiBnLmhlaWdodCA/IGcud2lkdGggOiBnLmhlaWdodCkgLyAyXG4gICAgICAgICAgICAgICBwb3NpdGlvbnMucHVzaCAoIHsgeDogZy5sZWZ0LCB5OiBnLnRvcCwgcjogciArIDIwIH0gKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIEdlb21ldHJ5LnBhY2tFbmNsb3NlICggcG9zaXRpb25zICkgKiAyXG5cbiAgICAgICAgICBmb3IgKCB2YXIgaSA9IDAgOyBpIDwgb2JqZWN0cy5sZW5ndGggOyBpKysgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNvbnN0IGcgPSBvYmplY3RzIFtpXVxuICAgICAgICAgICAgICAgY29uc3QgcCA9IHBvc2l0aW9ucyBbaV1cblxuICAgICAgICAgICAgICAgZy5sZWZ0ID0gcC54XG4gICAgICAgICAgICAgICBnLnRvcCAgPSBwLnlcbiAgICAgICAgICAgICAgIGcuc2V0Q29vcmRzICgpXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgZmNhbnZhcy5yZXF1ZXN0UmVuZGVyQWxsICgpXG4gICAgIH1cblxuICAgICB6b29tICggZmFjdG9yPzogbnVtYmVyIHwgU2hhcGUgKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgeyBmY2FudmFzIH0gPSB0aGlzXG5cbiAgICAgICAgICBpZiAoIHR5cGVvZiBmYWN0b3IgPT0gXCJudW1iZXJcIiApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29uc3Qgb2JqZWN0cyA9IGZjYW52YXMuZ2V0T2JqZWN0cyAoKVxuXG4gICAgICAgICAgaWYgKCB0eXBlb2YgZmFjdG9yID09IFwib2JqZWN0XCIgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNvbnN0IG8gPSBmYWN0b3IuZ3JvdXBcblxuICAgICAgICAgICAgICAgdmFyIGxlZnQgICA9IG8ubGVmdCAtIG8ud2lkdGhcbiAgICAgICAgICAgICAgIHZhciByaWdodCAgPSBvLmxlZnQgKyBvLndpZHRoXG4gICAgICAgICAgICAgICB2YXIgdG9wICAgID0gby50b3AgIC0gby5oZWlnaHRcbiAgICAgICAgICAgICAgIHZhciBib3R0b20gPSBvLnRvcCAgKyBvLmhlaWdodFxuXG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICB2YXIgbGVmdCAgID0gMFxuICAgICAgICAgICAgICAgdmFyIHJpZ2h0ICA9IDBcbiAgICAgICAgICAgICAgIHZhciB0b3AgICAgPSAwXG4gICAgICAgICAgICAgICB2YXIgYm90dG9tID0gMFxuXG4gICAgICAgICAgICAgICBmb3IgKCBjb25zdCBvIG9mIG9iamVjdHMgKVxuICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBsID0gby5sZWZ0IC0gby53aWR0aFxuICAgICAgICAgICAgICAgICAgICBjb25zdCByID0gby5sZWZ0ICsgby53aWR0aFxuICAgICAgICAgICAgICAgICAgICBjb25zdCB0ID0gby50b3AgIC0gby5oZWlnaHRcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYiA9IG8udG9wICArIG8uaGVpZ2h0XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCBsIDwgbGVmdCApXG4gICAgICAgICAgICAgICAgICAgICAgICAgbGVmdCA9IGxcblxuICAgICAgICAgICAgICAgICAgICBpZiAoIHIgPiByaWdodCApXG4gICAgICAgICAgICAgICAgICAgICAgICAgcmlnaHQgPSByXG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCB0IDwgdG9wIClcbiAgICAgICAgICAgICAgICAgICAgICAgICB0b3AgPSB0XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCBiID4gYm90dG9tIClcbiAgICAgICAgICAgICAgICAgICAgICAgICBib3R0b20gPSBiXG4gICAgICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29uc3QgdyAgPSByaWdodCAtIGxlZnRcbiAgICAgICAgICBjb25zdCBoICA9IGJvdHRvbSAtIHRvcFxuICAgICAgICAgIGNvbnN0IHZ3ID0gZmNhbnZhcy5nZXRXaWR0aCAgKClcbiAgICAgICAgICBjb25zdCB2aCA9IGZjYW52YXMuZ2V0SGVpZ2h0ICgpXG5cbiAgICAgICAgICBjb25zdCBmID0gdyA+IGhcbiAgICAgICAgICAgICAgICAgICAgPyAodncgPCB2aCA/IHZ3IDogdmgpIC8gd1xuICAgICAgICAgICAgICAgICAgICA6ICh2dyA8IHZoID8gdncgOiB2aCkgLyBoXG5cbiAgICAgICAgICBmY2FudmFzLnZpZXdwb3J0VHJhbnNmb3JtIFswXSA9IGZcbiAgICAgICAgICBmY2FudmFzLnZpZXdwb3J0VHJhbnNmb3JtIFszXSA9IGZcblxuICAgICAgICAgIGNvbnN0IGN4ID0gbGVmdCArIHcgLyAyXG4gICAgICAgICAgY29uc3QgY3kgPSB0b3AgICsgaCAvIDJcblxuICAgICAgICAgIGZjYW52YXMudmlld3BvcnRUcmFuc2Zvcm0gWzRdID0gLShjeCAqIGYpICsgdncgLyAyXG4gICAgICAgICAgZmNhbnZhcy52aWV3cG9ydFRyYW5zZm9ybSBbNV0gPSAtKGN5ICogZikgKyB2aCAvIDJcblxuICAgICAgICAgIGZvciAoIGNvbnN0IG8gb2Ygb2JqZWN0cyApXG4gICAgICAgICAgICAgICBvLnNldENvb3JkcyAoKVxuXG4gICAgICAgICAgZmNhbnZhcy5yZXF1ZXN0UmVuZGVyQWxsICgpXG4gICAgIH1cblxuICAgICBpc29sYXRlICggc2hhcGU6IFNoYXBlIClcbiAgICAge1xuICAgICAgICAgIGZvciAoIGNvbnN0IG8gb2YgdGhpcy5mY2FudmFzLmdldE9iamVjdHMgKCkgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIG8udmlzaWJsZSA9IGZhbHNlXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgc2hhcGUuZ3JvdXAudmlzaWJsZSA9IHRydWVcbiAgICAgfVxuXG4gICAgIGdldFRodW1ibmFpbCAoKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgeyBhY3RpdmU6IGN2aWV3IH0gPSB0aGlzXG5cbiAgICAgICAgICBjb25zdCB0aHVtYm5haWwgPSBjdmlldy50aHVtYm5haWxcblxuICAgICAgICAgIGlmICggdGh1bWJuYWlsIHx8IGN2aWV3LmFjdGl2ZSA9PSBmYWxzZSApXG4gICAgICAgICAgICAgICB0aHVtYm5haWxcblxuICAgICAgICAgIHJldHVybiBjdmlldy50aHVtYm5haWwgPSB0aGlzLmZjYW52YXMudG9EYXRhVVJMICh7IGZvcm1hdDogXCJqcGVnXCIgfSlcbiAgICAgfVxuXG4gICAgIC8qIFRPRE9cblxuICAgICBncmlkID9cblxuICAgICAgICAgIG9wdGlvbnMgPSB7XG4gICAgICAgICAgICAgICBkaXN0YW5jZTogMTAsXG4gICAgICAgICAgICAgICB3aWR0aDogYy53aWR0aCxcbiAgICAgICAgICAgICAgIGhlaWdodDogYy5oZWlnaHQsXG4gICAgICAgICAgICAgICBwYXJhbToge1xuICAgICAgICAgICAgICAgICAgICBzdHJva2U6ICcjZWJlYmViJyxcbiAgICAgICAgICAgICAgICAgICAgc3Ryb2tlV2lkdGg6IDEsXG4gICAgICAgICAgICAgICAgICAgIHNlbGVjdGFibGU6IGZhbHNlXG4gICAgICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGdyaWRMZW4gPSBvcHRpb25zLndpZHRoIC8gb3B0aW9ucy5kaXN0YW5jZTtcblxuICAgICAgICAgIGMgPSBjYW52YXNcbiAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGdyaWRMZW47IGkrKylcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICB2YXIgZGlzdGFuY2UgICA9IGkgKiBvcHRpb25zLmRpc3RhbmNlLFxuICAgICAgICAgICAgICAgICAgICBob3Jpem9udGFsID0gbmV3IGZhYnJpYy5MaW5lKFsgZGlzdGFuY2UsIDAsIGRpc3RhbmNlLCBvcHRpb25zLndpZHRoXSwgb3B0aW9ucy5wYXJhbSksXG4gICAgICAgICAgICAgICAgICAgIHZlcnRpY2FsICAgPSBuZXcgZmFicmljLkxpbmUoWyAwLCBkaXN0YW5jZSwgb3B0aW9ucy53aWR0aCwgZGlzdGFuY2VdLCBvcHRpb25zLnBhcmFtKTtcbiAgICAgICAgICAgICAgIGMuYWRkKGhvcml6b250YWwpO1xuICAgICAgICAgICAgICAgYy5hZGQodmVydGljYWwpO1xuICAgICAgICAgICAgICAgaWYgKCBpJTUgPT09IDAgKVxuICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBob3Jpem9udGFsLnNldCh7c3Ryb2tlOiAnI2NjY2NjYyd9KTtcbiAgICAgICAgICAgICAgICAgICAgdmVydGljYWwuc2V0KHtzdHJva2U6ICcjY2NjY2NjJ30pO1xuICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICB9O1xuXG4gICAgICovXG5cbiAgICAgLy8gVUkgRVZFTlRTXG5cbiAgICAgZW5hYmxlRXZlbnRzICgpXG4gICAgIHtcbiAgICAgICAgICB0aGlzLmluaXRDbGlja0V2ZW50ICgpXG4gICAgICAgICAgdGhpcy5pbml0T3ZlckV2ZW50ICAoKVxuICAgICAgICAgIHRoaXMuaW5pdFBhbkV2ZW50ICAgKClcbiAgICAgICAgICB0aGlzLmluaXRab29tRXZlbnQgICgpXG4gICAgICAgICAgLy90aGlzLmluaXRNb3ZlT2JqZWN0ICgpXG4gICAgICAgICAgLy90aGlzLmluaXREcmFnRXZlbnQgICgpXG5cbiAgICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lciAoIFwicmVzaXplXCIsIHRoaXMucmVzcG9uc2l2ZS5iaW5kICh0aGlzKSApXG4gICAgIH1cblxuICAgICBwcml2YXRlIHJlc3BvbnNpdmUgKClcbiAgICAge1xuICAgICAgICAgIHZhciB3aWR0aCAgID0gKHdpbmRvdy5pbm5lcldpZHRoICA+IDApID8gd2luZG93LmlubmVyV2lkdGggIDogc2NyZWVuLndpZHRoXG4gICAgICAgICAgdmFyIGhlaWdodCAgPSAod2luZG93LmlubmVySGVpZ2h0ID4gMCkgPyB3aW5kb3cuaW5uZXJIZWlnaHQgOiBzY3JlZW4uaGVpZ2h0XG5cbiAgICAgICAgICB0aGlzLmZjYW52YXMuc2V0RGltZW5zaW9ucyh7XG4gICAgICAgICAgICAgICB3aWR0aDogd2lkdGgsXG4gICAgICAgICAgICAgICBoZWlnaHQ6IGhlaWdodFxuICAgICAgICAgIH0pXG4gICAgIH1cblxuICAgICBwcml2YXRlIGluaXRDbGlja0V2ZW50ICgpXG4gICAgIHtcbiAgICAgICAgICBjb25zdCBwYWdlICAgICAgICAgICA9IHRoaXMuZmNhbnZhc1xuICAgICAgICAgIGNvbnN0IG1heF9jbGljaF9hcmVhID0gMjUgKiAyNVxuICAgICAgICAgIHZhciAgIGxhc3RfY2xpY2sgICAgID0gLTFcbiAgICAgICAgICB2YXIgICBsYXN0X3BvcyAgICAgICA9IHsgeDogLTk5OTksIHk6IC05OTk5IH1cblxuICAgICAgICAgIHBhZ2Uub24gKCBcIm1vdXNlOmRvd25cIiwgZmV2ZW50ID0+XG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgY29uc29sZS5sb2cgKCBcIm1vdXNlOmRvd25cIiApXG4gICAgICAgICAgICAgICBjb25zdCBub3cgICA9IERhdGUubm93ICgpXG4gICAgICAgICAgICAgICBjb25zdCBwb3MgICA9IGZldmVudC5wb2ludGVyXG4gICAgICAgICAgICAgICBjb25zdCByZXNldCA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgbGFzdF9jbGljayA9IG5vd1xuICAgICAgICAgICAgICAgICAgICBsYXN0X3BvcyAgID0gcG9zXG4gICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgIC8vIE5vdXMgdsOpcmlmaW9ucyBxdWUgc29pdCB1biBkb3VibGUtY2xpcXVlLlxuICAgICAgICAgICAgICAgaWYgKCA1MDAgPCBub3cgLSBsYXN0X2NsaWNrIClcbiAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCB0aGlzLm9uVG91Y2hPYmplY3QgKVxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZWxlbWVudCA9IGFzcGVjdC5nZXQgKCBmZXZlbnQudGFyZ2V0IClcblxuICAgICAgICAgICAgICAgICAgICAgICAgIEFyZWEuY3VycmVudEV2ZW50ID0gZmV2ZW50O1xuICAgICAgICAgICAgICAgICAgICAgICAgIGlmICggZWxlbWVudCApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm9uVG91Y2hPYmplY3QgKCBlbGVtZW50IClcbiAgICAgICAgICAgICAgICAgICAgICAgICBBcmVhLmN1cnJlbnRFdmVudCA9IG51bGw7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICBmZXZlbnQuZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24gKClcbiAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXNldCAoKVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgIC8vIE5vdXMgdsOpcmlmaW9ucyBxdWUgbGVzIGRldXggY2xpcXVlcyBzZSB0cm91dmUgZGFucyB1bmUgcsOpZ2lvbiBwcm9jaGUuXG4gICAgICAgICAgICAgICBjb25zdCB6b25lID0gKHBvcy54IC0gbGFzdF9wb3MueCkgKiAocG9zLnkgLSBsYXN0X3Bvcy55KVxuICAgICAgICAgICAgICAgaWYgKCB6b25lIDwgLW1heF9jbGljaF9hcmVhIHx8IG1heF9jbGljaF9hcmVhIDwgem9uZSApXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXNldCAoKVxuXG4gICAgICAgICAgICAgICAvLyBTaSBsZSBwb2ludGVyIGVzdCBhdS1kZXNzdXMgZOKAmXVuZSBmb3JtZS5cbiAgICAgICAgICAgICAgIGlmICggZmV2ZW50LnRhcmdldCAhPSB1bmRlZmluZWQgKVxuICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIHRoaXMub25Eb3VibGVUb3VjaE9iamVjdCApXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBlbGVtZW50ID0gYXNwZWN0LmdldCAoIGZldmVudC50YXJnZXQgKVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgQXJlYS5jdXJyZW50RXZlbnQgPSBmZXZlbnQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCBlbGVtZW50IClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMub25Eb3VibGVUb3VjaE9iamVjdCAoIGVsZW1lbnQgKVxuICAgICAgICAgICAgICAgICAgICAgICAgIEFyZWEuY3VycmVudEV2ZW50ID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGxhc3RfY2xpY2sgICA9IC0xXG4gICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAvLyBTaSBsZSBwb2ludGVyIGVzdCBhdS1kZXNzdXMgZOKAmXVuZSB6b25lIHZpZGUuXG4gICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIEFyZWEuY3VycmVudEV2ZW50ID0gZmV2ZW50O1xuICAgICAgICAgICAgICAgICAgICBpZiAoIHRoaXMub25Ub3VjaEFyZWEgKVxuICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMub25Ub3VjaEFyZWEgKCBwb3MueCwgcG9zLnkgKVxuICAgICAgICAgICAgICAgICAgICBBcmVhLmN1cnJlbnRFdmVudCA9IG51bGw7XG4gICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgIGZldmVudC5lLnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbiAoKVxuXG4gICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICB9KVxuICAgICB9XG5cbiAgICAgcHJpdmF0ZSBpbml0T3ZlckV2ZW50ICgpXG4gICAgIHtcbiAgICAgICAgICBjb25zdCBwYWdlID0gdGhpcy5mY2FudmFzXG5cbiAgICAgICAgICBwYWdlLm9uICggXCJtb3VzZTpvdmVyXCIsIGZldmVudCA9PlxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHRoaXMub3ZlckZPYmplY3QgPSBmZXZlbnQudGFyZ2V0XG5cbiAgICAgICAgICAgICAgIGlmICggdGhpcy5vbk92ZXJPYmplY3QgKVxuICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBlbGVtZW50ID0gYXNwZWN0LmdldCAoIGZldmVudC50YXJnZXQgKVxuXG4gICAgICAgICAgICAgICAgICAgIEFyZWEuY3VycmVudEV2ZW50ID0gZmV2ZW50O1xuICAgICAgICAgICAgICAgICAgICBpZiAoIGVsZW1lbnQgKVxuICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMub25PdmVyT2JqZWN0ICggZWxlbWVudCApXG4gICAgICAgICAgICAgICAgICAgIEFyZWEuY3VycmVudEV2ZW50ID0gbnVsbDtcbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICB9KVxuXG4gICAgICAgICAgcGFnZS5vbiAoIFwibW91c2U6b3V0XCIsIGZldmVudCA9PlxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHRoaXMub3ZlckZPYmplY3QgPSB1bmRlZmluZWRcblxuICAgICAgICAgICAgICAgaWYgKCB0aGlzLm9uT3V0T2JqZWN0IClcbiAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZWxlbWVudCA9IGFzcGVjdC5nZXQgKCBmZXZlbnQudGFyZ2V0IClcblxuICAgICAgICAgICAgICAgICAgICBBcmVhLmN1cnJlbnRFdmVudCA9IGZldmVudDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBlbGVtZW50IClcbiAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm9uT3V0T2JqZWN0ICggZWxlbWVudCApXG4gICAgICAgICAgICAgICAgICAgIEFyZWEuY3VycmVudEV2ZW50ID0gbnVsbDtcbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICB9KVxuICAgICB9XG5cbiAgICAgcHJpdmF0ZSBpbml0UGFuRXZlbnQgKClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHBhZ2UgICAgICAgPSB0aGlzLmZjYW52YXNcbiAgICAgICAgICB2YXIgICBpc0RyYWdnaW5nID0gZmFsc2VcbiAgICAgICAgICB2YXIgICBsYXN0UG9zWCAgID0gLTFcbiAgICAgICAgICB2YXIgICBsYXN0UG9zWSAgID0gLTFcblxuICAgICAgICAgIHBhZ2Uub24gKCBcIm1vdXNlOmRvd25cIiwgZmV2ZW50ID0+XG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgaWYgKCB0aGlzLm92ZXJGT2JqZWN0ID09IHVuZGVmaW5lZCApXG4gICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHBhZ2Uuc2VsZWN0aW9uID0gZmFsc2VcbiAgICAgICAgICAgICAgICAgICAgcGFnZS5kaXNjYXJkQWN0aXZlT2JqZWN0ICgpXG4gICAgICAgICAgICAgICAgICAgIHBhZ2UuZm9yRWFjaE9iamVjdCAoIG8gPT4geyBvLnNlbGVjdGFibGUgPSBmYWxzZSB9IClcblxuICAgICAgICAgICAgICAgICAgICBpc0RyYWdnaW5nID0gdHJ1ZVxuICAgICAgICAgICAgICAgICAgICBsYXN0UG9zWCAgID0gZmV2ZW50LnBvaW50ZXIueFxuICAgICAgICAgICAgICAgICAgICBsYXN0UG9zWSAgID0gZmV2ZW50LnBvaW50ZXIueVxuXG4gICAgICAgICAgICAgICAgICAgIHBhZ2UucmVxdWVzdFJlbmRlckFsbCAoKVxuICAgICAgICAgICAgICAgfVxuICAgICAgICAgIH0pXG5cbiAgICAgICAgICBwYWdlLm9uICggXCJtb3VzZTptb3ZlXCIsIGZldmVudCA9PlxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGlmICggaXNEcmFnZ2luZyApXG4gICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHBvaW50ZXIgID0gZmV2ZW50LnBvaW50ZXJcblxuICAgICAgICAgICAgICAgICAgICBwYWdlLnZpZXdwb3J0VHJhbnNmb3JtIFs0XSArPSBwb2ludGVyLnggLSBsYXN0UG9zWFxuICAgICAgICAgICAgICAgICAgICBwYWdlLnZpZXdwb3J0VHJhbnNmb3JtIFs1XSArPSBwb2ludGVyLnkgLSBsYXN0UG9zWVxuXG4gICAgICAgICAgICAgICAgICAgIHBhZ2UucmVxdWVzdFJlbmRlckFsbCgpXG5cbiAgICAgICAgICAgICAgICAgICAgbGFzdFBvc1ggPSBwb2ludGVyLnhcbiAgICAgICAgICAgICAgICAgICAgbGFzdFBvc1kgPSBwb2ludGVyLnlcbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICB9KVxuXG4gICAgICAgICAgcGFnZS5vbiAoIFwibW91c2U6dXBcIiwgKCkgPT5cbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBwYWdlLnNlbGVjdGlvbiA9IHRydWVcblxuICAgICAgICAgICAgICAgcGFnZS5mb3JFYWNoT2JqZWN0ICggbyA9PlxuICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBvLnNlbGVjdGFibGUgPSB0cnVlXG4gICAgICAgICAgICAgICAgICAgIG8uc2V0Q29vcmRzKClcbiAgICAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgICAgIGlzRHJhZ2dpbmcgPSBmYWxzZVxuXG4gICAgICAgICAgICAgICBwYWdlLnJlcXVlc3RSZW5kZXJBbGwgKClcbiAgICAgICAgICB9KVxuICAgICB9XG5cbiAgICAgcHJpdmF0ZSBpbml0Wm9vbUV2ZW50ICgpXG4gICAgIHtcbiAgICAgICAgICBjb25zdCBwYWdlID0gdGhpcy5mY2FudmFzXG5cbiAgICAgICAgICBwYWdlLm9uICggXCJtb3VzZTp3aGVlbFwiLCBmZXZlbnQgPT5cbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBjb25zdCBldmVudCAgID0gZmV2ZW50LmUgYXMgV2hlZWxFdmVudFxuICAgICAgICAgICAgICAgdmFyICAgZGVsdGEgICA9IGV2ZW50LmRlbHRhWVxuICAgICAgICAgICAgICAgdmFyICAgem9vbSAgICA9IHBhZ2UuZ2V0Wm9vbSgpXG4gICAgICAgICAgICAgICAgICAgIHpvb20gICAgPSB6b29tIC0gZGVsdGEgKiAwLjAwNVxuXG4gICAgICAgICAgICAgICBpZiAoem9vbSA+IDkpXG4gICAgICAgICAgICAgICAgICAgIHpvb20gPSA5XG5cbiAgICAgICAgICAgICAgIGlmICh6b29tIDwgMC41KVxuICAgICAgICAgICAgICAgICAgICB6b29tID0gMC41XG5cbiAgICAgICAgICAgICAgIHBhZ2Uuem9vbVRvUG9pbnQoIG5ldyBmYWJyaWMuUG9pbnQgKCBldmVudC5vZmZzZXRYLCBldmVudC5vZmZzZXRZICksIHpvb20gKVxuXG4gICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKVxuXG4gICAgICAgICAgICAgICBwYWdlLnJlcXVlc3RSZW5kZXJBbGwgKClcbiAgICAgICAgICB9KVxuICAgICB9XG5cbiAgICAgcHJpdmF0ZSBpbml0TW92ZU9iamVjdCAoKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgcGFnZSAgICAgID0gdGhpcy5mY2FudmFzXG4gICAgICAgICAgdmFyICAgY2x1c3RlciAgID0gdW5kZWZpbmVkIGFzIGZhYnJpYy5PYmplY3QgW11cbiAgICAgICAgICB2YXIgICBwb3NpdGlvbnMgPSB1bmRlZmluZWQgYXMgbnVtYmVyIFtdW11cbiAgICAgICAgICB2YXIgICBvcmlnaW5YICAgPSAwXG4gICAgICAgICAgdmFyICAgb3JpZ2luWSAgID0gMFxuXG4gICAgICAgICAgZnVuY3Rpb24gb25fc2VsZWN0aW9uIChmZXZlbnQ6IGZhYnJpYy5JRXZlbnQpXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgY29uc3QgdGFyZ2V0ID0gZmV2ZW50LnRhcmdldFxuICAgICAgICAgICAgICAgY29uc29sZS5sb2cgKCB0YXJnZXQgKVxuICAgICAgICAgICAgICAgY2x1c3RlciA9IHRhcmdldCBbXCJjbHVzdGVyXCJdIGFzIGZhYnJpYy5PYmplY3QgW11cblxuICAgICAgICAgICAgICAgaWYgKCBjbHVzdGVyID09IHVuZGVmaW5lZCApXG4gICAgICAgICAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgICAgICAgICBvcmlnaW5YICAgPSB0YXJnZXQubGVmdFxuICAgICAgICAgICAgICAgb3JpZ2luWSAgID0gdGFyZ2V0LnRvcFxuICAgICAgICAgICAgICAgcG9zaXRpb25zID0gW11cblxuICAgICAgICAgICAgICAgZm9yICggY29uc3QgbyBvZiBjbHVzdGVyIClcbiAgICAgICAgICAgICAgICAgICAgcG9zaXRpb25zLnB1c2ggKFsgby5sZWZ0LCBvLnRvcCBdKVxuXG4gICAgICAgICAgICAgICBjb25zb2xlLmxvZyAoXCJjcmVhdGVkXCIpXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcGFnZS5vbiAoIFwic2VsZWN0aW9uOmNyZWF0ZWRcIiwgb25fc2VsZWN0aW9uIClcbiAgICAgICAgICBwYWdlLm9uICggXCJzZWxlY3Rpb246dXBkYXRlZFwiLCBvbl9zZWxlY3Rpb24gKVxuXG4gICAgICAgICAgcGFnZS5vbiAoIFwib2JqZWN0Om1vdmluZ1wiLCBmZXZlbnQgPT5cbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBpZiAoIGNsdXN0ZXIgPT0gdW5kZWZpbmVkIClcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgICAgICAgIGNvbnN0IHRhcmdldCAgID0gZmV2ZW50LnRhcmdldFxuICAgICAgICAgICAgICAgY29uc3Qgb2Zmc2V0WCAgPSB0YXJnZXQubGVmdCAtIG9yaWdpblhcbiAgICAgICAgICAgICAgIGNvbnN0IG9mZnNldFkgID0gdGFyZ2V0LnRvcCAgLSBvcmlnaW5ZXG5cbiAgICAgICAgICAgICAgIGZvciAoIHZhciBpID0gMCA7IGkgPCBjbHVzdGVyLmxlbmd0aCA7IGkrKyApXG4gICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG9iaiA9IGNsdXN0ZXIgW2ldXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHBvcyA9IHBvc2l0aW9ucyBbaV1cbiAgICAgICAgICAgICAgICAgICAgb2JqLnNldCAoe1xuICAgICAgICAgICAgICAgICAgICAgICAgIGxlZnQ6IHBvcyBbMF0gKyBvZmZzZXRYLFxuICAgICAgICAgICAgICAgICAgICAgICAgIHRvcCA6IHBvcyBbMV0gKyBvZmZzZXRZXG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICB9XG4gICAgICAgICAgfSlcblxuICAgICAgICAgIHBhZ2Uub24gKCBcInNlbGVjdGlvbjpjbGVhcmVkXCIsIGZldmVudCA9PlxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNsdXN0ZXIgPSB1bmRlZmluZWRcblxuICAgICAgICAgICAgICAgY29uc29sZS5sb2cgKFwiY2xlYXJlZFwiKVxuICAgICAgICAgIH0pXG4gICAgIH1cblxuICAgICBwcml2YXRlIGluaXREcmFnRXZlbnQgKClcbiAgICAge1xuICAgICAgICAgIC8vIGh0dHBzOi8vd3d3Lnczc2Nob29scy5jb20vaHRtbC9odG1sNV9kcmFnYW5kZHJvcC5hc3BcbiAgICAgICAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vU2hvcGlmeS9kcmFnZ2FibGUvYmxvYi9tYXN0ZXIvc3JjL0RyYWdnYWJsZS9EcmFnZ2FibGUuanNcblxuICAgICAgICAgIGNvbnN0IHBhZ2UgICAgICA9IHRoaXMuZmNhbnZhc1xuXG4gICAgICAgICAgcGFnZS5vbiAoIFwidG91Y2g6ZHJhZ1wiLCBmZXZlbnQgPT5cbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nICggZmV2ZW50IClcbiAgICAgICAgICAgICAgIGNvbnNvbGUubG9nICggXCJ0b3VjaDpkcmFnXCIgKVxuICAgICAgICAgIH0pXG5cbiAgICAgICAgICBwYWdlLm9uICggXCJkcmFnZW50ZXJcIiwgZmV2ZW50ID0+XG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgLy9jb25zb2xlLmxvZyAoIFwiRFJPUC1FTlRFUlwiLCBmZXZlbnQgKVxuICAgICAgICAgIH0pXG5cbiAgICAgICAgICBwYWdlLm9uICggXCJkcmFnb3ZlclwiLCBmZXZlbnQgPT5cbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nICggXCJEUk9QLU9WRVJcIiwgZmV2ZW50IClcbiAgICAgICAgICB9KVxuXG4gICAgICAgICAgcGFnZS5vbiAoIFwiZHJvcFwiLCBmZXZlbnQgPT5cbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICAvL2NvbnN0IGUgPSBmZXZlbnQuZSBhcyBEcmFnRXZlbnRcbiAgICAgICAgICAgICAgIC8vY29uc29sZS5sb2cgKCBcIkRST1BcIiwgZS5kYXRhVHJhbnNmZXIuZ2V0RGF0YSAoXCJ0ZXh0XCIpIClcbiAgICAgICAgICB9KVxuICAgICB9XG59XG4iLCJcbmltcG9ydCB7IEFyZWEgfSBmcm9tIFwiQHVpL0VsZW1lbnRzL2FyZWFcIlxuY29uc3QgY21kcyA9IHt9IGFzIFJlY29yZCA8c3RyaW5nLCBDb21tYW5kPlxuXG5jbGFzcyBDb21tYW5kXG57XG4gICAgIGNvbnN0cnVjdG9yICggcHJpdmF0ZSBjYWxsYmFjazogKCBldmVudDogZmFicmljLklFdmVudCApID0+IHZvaWQgKSB7fVxuXG4gICAgIHJ1biAoKVxuICAgICB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgIHRoaXMuY2FsbGJhY2sgKCBBcmVhLmN1cnJlbnRFdmVudCApO1xuICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG5cbiAgICAgICAgICB9XG4gICAgIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbW1hbmQgKCBuYW1lOiBzdHJpbmcsIGNhbGxiYWNrPzogKCBldmVudDogZmFicmljLklFdmVudCApID0+IHZvaWQgKVxue1xuICAgICBpZiAoIHR5cGVvZiBjYWxsYmFjayA9PSBcImZ1bmN0aW9uXCIgKVxuICAgICB7XG4gICAgICAgICAgaWYgKCBuYW1lIGluIGNtZHMgKSByZXR1cm5cbiAgICAgICAgICBjbWRzIFtuYW1lXSA9IG5ldyBDb21tYW5kICggY2FsbGJhY2sgKVxuICAgICB9XG5cbiAgICAgcmV0dXJuIGNtZHMgW25hbWVdXG59XG4iLCJcblxuaW1wb3J0IHsgc2V0LCBkZWZpbmUgfSBmcm9tIFwiLi4vZGJcIlxuaW1wb3J0IHsgeG5vZGUgfSAgICAgICBmcm9tIFwiLi4vQmFzZS94bm9kZVwiXG5pbXBvcnQgeyBjb21tYW5kIH0gICAgIGZyb20gXCIuLi8uLi9BcGkvY29tbWFuZFwiXG5cbmltcG9ydCB7IENvbXBvbmVudCB9ICAgZnJvbSBcIi4vY29tcG9uZW50XCJcblxuZGVjbGFyZSBnbG9iYWxcbntcbiAgICAgaW50ZXJmYWNlICRCdXR0b24gZXh0ZW5kcyAkQ29tcG9uZW50XG4gICAgIHtcbiAgICAgICAgICB0eXBlICAgICAgIDogXCJidXR0b25cIlxuICAgICAgICAgIGljb24gICAgICAgOiBzdHJpbmdcbiAgICAgICAgICB0ZXh0PyAgICAgIDogc3RyaW5nXG4gICAgICAgICAgdG9vbHRpcD8gICA6IEpTWC5FbGVtZW50XG4gICAgICAgICAgZm9udEZhbWlseT86IHN0cmluZyxcbiAgICAgICAgICBjYWxsYmFjaz8gIDogKCkgPT4gYm9vbGVhbiB8IHZvaWQsXG4gICAgICAgICAgY29tbWFuZD8gICA6IHN0cmluZyxcbiAgICAgICAgICBoYW5kbGVPbj8gIDogXCJ0b2dnbGVcIiB8IFwiZHJhZ1wiIHwgXCIqXCJcbiAgICAgfVxufVxuXG5leHBvcnQgY2xhc3MgQnV0dG9uIGV4dGVuZHMgQ29tcG9uZW50IDwkQnV0dG9uPlxue1xuICAgICAvKiogQG92ZXJyaWRlICovXG4gICAgIGdldEh0bWwgKClcbiAgICAge1xuICAgICAgICAgIGlmICggdGhpcy5jb250YWluZXIgPT0gdW5kZWZpbmVkIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBjb25zdCBkYXRhID0gdGhpcy5kYXRhXG5cbiAgICAgICAgICAgICAgIGNvbnN0IG5vZGUgPSA8ZGl2IGNsYXNzPVwiYnV0dG9uXCI+XG4gICAgICAgICAgICAgICAgICAgIHsgZGF0YS5pY29uID8gPHNwYW4gY2xhc3M9XCJpY29uXCI+eyBkYXRhLmljb24gfTwvc3Bhbj4gOiBudWxsIH1cbiAgICAgICAgICAgICAgICAgICAgeyBkYXRhLnRleHQgPyA8c3BhbiBjbGFzcz1cInRleHRcIj57IGRhdGEudGV4dCB9PC9zcGFuPiA6IG51bGwgfVxuICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgIGlmICggdGhpcy5kYXRhLmNhbGxiYWNrICE9IHVuZGVmaW5lZCB8fCB0aGlzLmRhdGEuY29tbWFuZCAhPSB1bmRlZmluZWQgKVxuICAgICAgICAgICAgICAgICAgICBub2RlLmFkZEV2ZW50TGlzdGVuZXIgKCBcImNsaWNrXCIsIHRoaXMub25Ub3VjaC5iaW5kICh0aGlzKSApXG5cbiAgICAgICAgICAgICAgIHRoaXMuY29udGFpbmVyID0gbm9kZVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiBbIHRoaXMuY29udGFpbmVyIF0gYXMgSFRNTEVsZW1lbnQgW11cbiAgICAgfVxuXG4gICAgIG9uVG91Y2ggKClcbiAgICAge1xuICAgICAgICAgIGlmICggdGhpcy5kYXRhLmNhbGxiYWNrICYmIHRoaXMuZGF0YS5jYWxsYmFjayAoKSAhPT0gdHJ1ZSApXG4gICAgICAgICAgICAgICByZXR1cm5cblxuICAgICAgICAgIGlmICggdGhpcy5kYXRhLmNvbW1hbmQgKVxuICAgICAgICAgICAgICAgLy9Db21tYW5kcy5jdXJyZW50LnJ1biAoIHRoaXMuZGF0YS5jb21tYW5kIClcbiAgICAgICAgICAgICAgIGNvbW1hbmQgKCB0aGlzLmRhdGEuY29tbWFuZCApLnJ1biAoKVxuICAgICB9XG5cbiAgICAgcHJvdGVjdGVkIG9uSG92ZXIgKClcbiAgICAge1xuXG4gICAgIH1cbn1cblxuXG5kZWZpbmUgKCBCdXR0b24sIFtDT05URVhUX1VJLCBcImJ1dHRvblwiXSApXG5cbnNldCA8JEJ1dHRvbj4gKCBbIFwiYnV0dG9uXCIgXSwge1xuICAgICB0eXBlOiBcImJ1dHRvblwiIGFzIFwiYnV0dG9uXCIsXG4gICAgIGlkICA6IHVuZGVmaW5lZCxcbiAgICAgaWNvbjogdW5kZWZpbmVkLFxufSlcbiIsIlxuaW1wb3J0IHsgcGljaywgaW5TdG9jaywgbWFrZSB9IGZyb20gXCIuLi9kYlwiXG5pbXBvcnQgeyBDb21wb25lbnQgfSBmcm9tIFwiLi9jb21wb25lbnRcIlxuXG5kZWNsYXJlIGdsb2JhbFxue1xuICAgICBpbnRlcmZhY2UgJENvbnRhaW5lciBleHRlbmRzICRDb21wb25lbnRcbiAgICAge1xuICAgICAgICAgIGRpcmVjdGlvbj86IFwibHJcIiB8IFwicmxcIiB8IFwidGJcIiB8IFwiYnRcIlxuICAgICAgICAgIGNoaWxkcmVuPzogJEFueUNvbXBvbmVudHMgW11cbiAgICAgfVxufVxuXG5leHBvcnQgY2xhc3MgQ29udGFpbmVyIDwkIGV4dGVuZHMgJENvbnRhaW5lciA9ICRDb250YWluZXI+IGV4dGVuZHMgQ29tcG9uZW50IDwkPlxue1xuICAgICBjaGlsZHJlbiA9IHt9IGFzIFJlY29yZCA8c3RyaW5nLCBDb21wb25lbnQ+XG4gICAgIHNsb3Q6IEpTWC5FbGVtZW50XG5cbiAgICAgcmVhZG9ubHkgaXNfdmVydGljYWw6IGJvb2xlYW5cblxuICAgICBkZWZhdWx0RGF0YSAoKSA6ICRDb250YWluZXJcbiAgICAge1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICBjb250ZXh0OiBcImNvbmNlcHQtdWlcIixcbiAgICAgICAgICAgICAgIHR5cGUgICAgIDogXCJjb21wb25lbnRcIixcbiAgICAgICAgICAgICAgIGlkICAgICAgIDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgZGlyZWN0aW9uOiBcImxyXCIsXG4gICAgICAgICAgfVxuICAgICB9XG5cbiAgICAgY29uc3RydWN0b3IgKCBkYXRhOiAkIClcbiAgICAge1xuICAgICAgICAgIHN1cGVyICggZGF0YSApXG5cbiAgICAgICAgICBkYXRhID0gdGhpcy5kYXRhXG4gICAgICAgICAgY29uc3QgY2hpbGRyZW4gPSBkYXRhLmNoaWxkcmVuXG5cbiAgICAgICAgICBpZiAoIGNoaWxkcmVuIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBmb3IgKCBjb25zdCBjaGlsZCBvZiBjaGlsZHJlbiApXG4gICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGlmICggISBpblN0b2NrICggY2hpbGQgKSApXG4gICAgICAgICAgICAgICAgICAgICAgICAgbWFrZSAoIGNoaWxkIClcbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICB0aGlzLmlzX3ZlcnRpY2FsID0gZGF0YS5kaXJlY3Rpb24gPT0gXCJidFwiIHx8IGRhdGEuZGlyZWN0aW9uID09IFwidGJcIlxuICAgICB9XG5cbiAgICAgLyoqIEBvdmVycmlkZSAqL1xuICAgICBnZXRIdG1sICgpXG4gICAgIHtcbiAgICAgICAgICBpZiAoIHRoaXMuY29udGFpbmVyICE9IHVuZGVmaW5lZCApXG4gICAgICAgICAgICAgICByZXR1cm4gW3RoaXMuY29udGFpbmVyXVxuXG4gICAgICAgICAgY29uc3QgZWxlbWVudHMgID0gc3VwZXIuZ2V0SHRtbCAoKVxuICAgICAgICAgIGNvbnN0IGNvbnRhaW5lciA9IHRoaXMuY29udGFpbmVyXG4gICAgICAgICAgY29uc3QgZGF0YSAgICAgID0gdGhpcy5kYXRhXG4gICAgICAgICAgY29uc3QgY2hpbGRyZW4gID0gdGhpcy5jaGlsZHJlblxuICAgICAgICAgIGNvbnN0IHVuZCA9IHVuZGVmaW5lZFxuXG4gICAgICAgICAgaWYgKCB0aGlzLmlzX3ZlcnRpY2FsIClcbiAgICAgICAgICAgICAgIGNvbnRhaW5lci5jbGFzc0xpc3QuYWRkICggXCJ2ZXJ0aWNhbFwiIClcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICBjb250YWluZXIuY2xhc3NMaXN0LnJlbW92ZSAoIFwidmVydGljYWxcIiApXG5cbiAgICAgICAgICBpZiAoIHRoaXMuc2xvdCA9PSB1bmRlZmluZWQgKVxuICAgICAgICAgICAgICAgdGhpcy5zbG90ID0gY29udGFpbmVyXG5cbiAgICAgICAgICBjb25zdCBzbG90ID0gdGhpcy5zbG90XG5cbiAgICAgICAgICBpZiAoIGRhdGEuY2hpbGRyZW4gKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNvbnN0IG5ld19jaGlsZHJlbiA9IFtdIGFzIENvbXBvbmVudCBbXVxuXG4gICAgICAgICAgICAgICBmb3IgKCBjb25zdCBjaGlsZCBvZiBkYXRhLmNoaWxkcmVuIClcbiAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbyA9IHBpY2sgKCBjaGlsZCApXG4gICAgICAgICAgICAgICAgICAgIHNsb3QuYXBwZW5kICggLi4uIG8uZ2V0SHRtbCAoKSApXG4gICAgICAgICAgICAgICAgICAgIGNoaWxkcmVuIFtvLmRhdGEuaWRdID0gb1xuICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAvL3RoaXMub25DaGlsZHJlbkFkZGVkICggbmV3X2NoaWxkcmVuIClcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gZWxlbWVudHNcbiAgICAgfVxuXG4gICAgIC8vb25DaGlsZHJlbkFkZGVkICggY29tcG9uZW50czogQ29tcG9uZW50IFtdIClcbiAgICAgLy97XG5cbiAgICAgLy99XG5cbiAgICAgYXBwZW5kICggLi4uIGVsZW1lbnRzOiAoc3RyaW5nIHwgRWxlbWVudCB8IENvbXBvbmVudCB8ICRBbnlDb21wb25lbnRzKSBbXSApXG4gICAgIHtcblxuICAgICAgICAgIGlmICggdGhpcy5jb250YWluZXIgPT0gdW5kZWZpbmVkIClcbiAgICAgICAgICAgICAgIHRoaXMuZ2V0SHRtbCAoKVxuXG4gICAgICAgICAgY29uc3Qgc2xvdCAgICAgID0gdGhpcy5zbG90XG4gICAgICAgICAgY29uc3QgY2hpbGRyZW4gID0gdGhpcy5jaGlsZHJlblxuICAgICAgICAgIGNvbnN0IG5ld19jaGlsZCA9IFtdIGFzIENvbXBvbmVudCBbXVxuXG4gICAgICAgICAgZm9yICggdmFyIGUgb2YgZWxlbWVudHMgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGlmICggdHlwZW9mIGUgPT0gXCJzdHJpbmdcIiApXG4gICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGUgPSBuZXcgUGhhbnRvbSAoe1xuICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRleHQ6IFwiY29uY2VwdC11aVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGUgICA6IFwicGhhbnRvbVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgIGlkICA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50OiBlXG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICBlbHNlIGlmICggZSBpbnN0YW5jZW9mIEVsZW1lbnQgKVxuICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBVSV9DT01QT05FTlQgPSBTeW1ib2wuZm9yICggXCJVSV9DT01QT05FTlRcIiApXG5cbiAgICAgICAgICAgICAgICAgICAgZSA9IGUgW1VJX0NPTVBPTkVOVF0gIT0gdW5kZWZpbmVkXG4gICAgICAgICAgICAgICAgICAgICAgICAgPyBlIFtVSV9DT01QT05FTlRdXG4gICAgICAgICAgICAgICAgICAgICAgICAgOiBuZXcgUGhhbnRvbSAoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGV4dDogXCJjb25jZXB0LXVpXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlICAgOiBcInBoYW50b21cIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkICA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnQ6IGUub3V0ZXJIVE1MXG4gICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgIGVsc2UgaWYgKCAhKGUgaW5zdGFuY2VvZiBDb21wb25lbnQpIClcbiAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgZSA9IGluU3RvY2sgKCBlICkgPyBwaWNrICggZSApIDogbWFrZSAoIGUgKVxuICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICBjaGlsZHJlbiBbKGUgYXMgQ29tcG9uZW50KS5kYXRhLmlkXSA9IGUgYXMgQ29tcG9uZW50XG4gICAgICAgICAgICAgICBzbG90LmFwcGVuZCAoIC4uLiAoZSBhcyBDb21wb25lbnQpLmdldEh0bWwgKCkgKVxuICAgICAgICAgICAgICAgbmV3X2NoaWxkLnB1c2ggKCBlIGFzIENvbXBvbmVudCApXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy9pZiAoIG5ld19jaGlsZC5sZW5ndGggPiAwIClcbiAgICAgICAgICAvLyAgICAgdGhpcy5vbkNoaWxkcmVuQWRkZWQgKCBuZXdfY2hpbGQgKVxuICAgICB9XG5cbiAgICAgcmVtb3ZlICggLi4uIGVsZW1lbnRzOiBDb21wb25lbnQgW10gKVxuICAgICB7XG4gICAgICAgICAgY29uc3Qgc2xvdCAgICAgID0gdGhpcy5zbG90XG4gICAgICAgICAgY29uc3QgY2hpbGRyZW4gID0gdGhpcy5jaGlsZHJlblxuXG4gICAgICAgICAgZm9yICggdmFyIGUgb2YgZWxlbWVudHMgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGlmICggZS5kYXRhLmlkIGluIGNoaWxkcmVuIClcbiAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgZS5jb250YWluZXIucmVtb3ZlICgpXG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBjaGlsZHJlbiBbZS5kYXRhLmlkXVxuICAgICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgfVxuXG4gICAgIGNsZWFyICgpXG4gICAgIHtcbiAgICAgICAgICB0aGlzLmNoaWxkcmVuID0ge31cblxuICAgICAgICAgIGlmICggdGhpcy5jb250YWluZXIgKVxuICAgICAgICAgICAgICAgdGhpcy5jb250YWluZXIuaW5uZXJIVE1MID0gXCJcIlxuICAgICB9XG5cbn1cblxuXG5pbnRlcmZhY2UgJFBoYW50b20gZXh0ZW5kcyAkQ29tcG9uZW50XG57XG4gICAgIHR5cGU6IFwicGhhbnRvbVwiXG4gICAgIGNvbnRlbnQ6IHN0cmluZ1xufVxuXG5jbGFzcyBQaGFudG9tIGV4dGVuZHMgQ29tcG9uZW50IDwkUGhhbnRvbT5cbntcbiAgICAgY29udGFpbmVyOiBIVE1MRWxlbWVudCB8IFNWR0VsZW1lbnRcblxuICAgICAvKiogQG92ZXJyaWRlICovXG4gICAgIGdldEh0bWwgKClcbiAgICAge1xuICAgICAgICAgIGlmICggdGhpcy5jb250YWluZXIgPT0gdW5kZWZpbmVkIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICB0aGlzLmNvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgKCBcImRpdlwiIClcbiAgICAgICAgICAgICAgIHRoaXMuY29udGFpbmVyLmlubmVySFRNTCA9IHRoaXMuZGF0YS5jb250ZW50XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIHRoaXMuY29udGFpbmVyLmNoaWxkTm9kZXMgYXMgYW55IGFzIEhUTUxFbGVtZW50IFtdXG4gICAgIH1cbn1cbiIsIlxuZXhwb3J0IGludGVyZmFjZSAgRHJhZ2dhYmxlT3B0aW9uc1xue1xuICAgICBoYW5kbGVzICAgICAgICA6IEpTWC5FbGVtZW50IFtdXG4gICAgIG1pblZlbG9jaXR5PyAgIDogbnVtYmVyXG4gICAgIG1heFZlbG9jaXR5PyAgIDogbnVtYmVyXG4gICAgIHZlbG9jaXR5RmFjdG9yPzogbnVtYmVyXG4gICAgIG9uRHJhZz8gICAgICAgIDogKCBldmVudDogRHJhZ0V2ZW50ICkgPT4gdm9pZFxuICAgICBvblN0YXJ0RHJhZz8gICA6ICgpID0+IHZvaWRcbiAgICAgb25TdG9wRHJhZz8gICAgOiAoIGV2ZW50OiBEcmFnRXZlbnQgKSA9PiBib29sZWFuXG4gICAgIG9uRW5kQW5pbWF0aW9uPzogKCAgZXZlbnQ6IERyYWdFdmVudCAgKSA9PiB2b2lkXG59XG5cbmV4cG9ydCB0eXBlIERyYWdnYWJsZUNvbmZpZyA9IFJlcXVpcmVkIDxEcmFnZ2FibGVPcHRpb25zPlxuXG5leHBvcnQgaW50ZXJmYWNlIERyYWdFdmVudFxue1xuICAgICB4ICAgICAgICA6IG51bWJlclxuICAgICB5ICAgICAgICA6IG51bWJlclxuICAgICBvZmZzZXRYICA6IG51bWJlclxuICAgICBvZmZzZXRZICA6IG51bWJlclxuICAgICB0YXJnZXRYOiBudW1iZXJcbiAgICAgdGFyZ2V0WTogbnVtYmVyXG4gICAgIGRlbGF5ICAgIDogbnVtYmVyXG59XG5cbmZ1bmN0aW9uIGRlZmF1bHRDb25maWcgKCk6IERyYWdnYWJsZUNvbmZpZ1xue1xuICAgICByZXR1cm4ge1xuICAgICAgICAgIGhhbmRsZXMgICAgICAgOiBbXSxcbiAgICAgICAgICBtaW5WZWxvY2l0eSAgIDogMCxcbiAgICAgICAgICBtYXhWZWxvY2l0eSAgIDogMSxcbiAgICAgICAgICBvblN0YXJ0RHJhZyAgIDogKCkgPT4ge30sXG4gICAgICAgICAgb25EcmFnICAgICAgICA6ICgpID0+IHt9LFxuICAgICAgICAgIG9uU3RvcERyYWcgICAgOiAoKSA9PiB0cnVlLFxuICAgICAgICAgIG9uRW5kQW5pbWF0aW9uOiAoKSA9PiB7fSxcbiAgICAgICAgICB2ZWxvY2l0eUZhY3RvcjogKHdpbmRvdy5pbm5lckhlaWdodCA8IHdpbmRvdy5pbm5lcldpZHRoXG4gICAgICAgICAgICAgICAgICAgICAgICAgPyB3aW5kb3cuaW5uZXJIZWlnaHQgOiB3aW5kb3cuaW5uZXJXaWR0aCkgLyAyLFxuICAgICB9XG59XG5cbnZhciBpc19kcmFnICAgID0gZmFsc2VcbnZhciBwb2ludGVyOiBNb3VzZUV2ZW50IHwgVG91Y2hcblxuLy8gaHR0cHM6Ly9naXN0LmdpdGh1Yi5jb20vZ3JlLzE2NTAyOTRcbnZhciBFYXNpbmdGdW5jdGlvbnMgPSB7XG4gICAgIGxpbmVhciAgICAgICAgOiAoIHQ6IG51bWJlciApID0+IHQsXG4gICAgIGVhc2VJblF1YWQgICAgOiAoIHQ6IG51bWJlciApID0+IHQqdCxcbiAgICAgZWFzZU91dFF1YWQgICA6ICggdDogbnVtYmVyICkgPT4gdCooMi10KSxcbiAgICAgZWFzZUluT3V0UXVhZCA6ICggdDogbnVtYmVyICkgPT4gdDwuNSA/IDIqdCp0IDogLTErKDQtMip0KSp0LFxuICAgICBlYXNlSW5DdWJpYyAgIDogKCB0OiBudW1iZXIgKSA9PiB0KnQqdCxcbiAgICAgZWFzZU91dEN1YmljICA6ICggdDogbnVtYmVyICkgPT4gKC0tdCkqdCp0KzEsXG4gICAgIGVhc2VJbk91dEN1YmljOiAoIHQ6IG51bWJlciApID0+IHQ8LjUgPyA0KnQqdCp0IDogKHQtMSkqKDIqdC0yKSooMip0LTIpKzEsXG4gICAgIGVhc2VJblF1YXJ0ICAgOiAoIHQ6IG51bWJlciApID0+IHQqdCp0KnQsXG4gICAgIGVhc2VPdXRRdWFydCAgOiAoIHQ6IG51bWJlciApID0+IDEtKC0tdCkqdCp0KnQsXG4gICAgIGVhc2VJbk91dFF1YXJ0OiAoIHQ6IG51bWJlciApID0+IHQ8LjUgPyA4KnQqdCp0KnQgOiAxLTgqKC0tdCkqdCp0KnQsXG4gICAgIGVhc2VJblF1aW50ICAgOiAoIHQ6IG51bWJlciApID0+IHQqdCp0KnQqdCxcbiAgICAgZWFzZU91dFF1aW50ICA6ICggdDogbnVtYmVyICkgPT4gMSsoLS10KSp0KnQqdCp0LFxuICAgICBlYXNlSW5PdXRRdWludDogKCB0OiBudW1iZXIgKSA9PiB0PC41ID8gMTYqdCp0KnQqdCp0IDogMSsxNiooLS10KSp0KnQqdCp0XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBkcmFnZ2FibGUgKCBvcHRpb25zOiBEcmFnZ2FibGVPcHRpb25zIClcbntcbiAgICAgY29uc3QgY29uZmlnICAgICA9IGRlZmF1bHRDb25maWcgKClcblxuICAgICB2YXIgaXNfYWN0aXZlICA9IGZhbHNlXG4gICAgIHZhciBpc19hbmltYXRlID0gZmFsc2VcbiAgICAgdmFyIGN1cnJlbnRfZXZlbnQ6IERyYWdFdmVudFxuXG4gICAgIHZhciBzdGFydF90aW1lID0gMFxuICAgICB2YXIgc3RhcnRfeCAgICA9IDBcbiAgICAgdmFyIHN0YXJ0X3kgICAgPSAwXG5cbiAgICAgdmFyIHZlbG9jaXR5X2RlbGF5ID0gNTAwXG4gICAgIHZhciB2ZWxvY2l0eV94OiBudW1iZXJcbiAgICAgdmFyIHZlbG9jaXR5X3k6IG51bWJlclxuXG4gICAgIHZhciBjdXJyZW50X2FuaW1hdGlvbiA9IC0xXG5cbiAgICAgdXBkYXRlQ29uZmlnICggb3B0aW9ucyApXG5cbiAgICAgZnVuY3Rpb24gdXBkYXRlQ29uZmlnICggb3B0aW9uczogRHJhZ2dhYmxlT3B0aW9ucyApXG4gICAgIHtcbiAgICAgICAgICBpZiAoIGlzX2RyYWcgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICggbmF2aWdhdG9yLm1heFRvdWNoUG9pbnRzID4gMCApXG4gICAgICAgICAgICAgICBkb2N1bWVudC5ib2R5LnN0eWxlLnRvdWNoQWN0aW9uID0gXCJub25lXCJcblxuICAgICAgICAgIGRpc2FibGVFdmVudHMgKClcblxuICAgICAgICAgIE9iamVjdC5hc3NpZ24gKCBjb25maWcsIG9wdGlvbnMgKVxuXG4gICAgICAgICAgZW5hYmxlRXZlbnRzICgpXG4gICAgIH1cblxuICAgICBmdW5jdGlvbiBhZGRIYW5kbGVzICggLi4uIGhhbmRsZXM6IEpTWC5FbGVtZW50IFtdIClcbiAgICAge1xuICAgICAgICAgIGZvciAoIGNvbnN0IGggb2YgaGFuZGxlcyApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgaWYgKCAhIGNvbmZpZy5oYW5kbGVzLmluY2x1ZGVzIChoKSApXG4gICAgICAgICAgICAgICAgICAgIGNvbmZpZy5oYW5kbGVzLnB1c2ggKGgpXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKCBpc19hY3RpdmUgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGRlc2FjdGl2YXRlICgpXG4gICAgICAgICAgICAgICBhY3RpdmF0ZSAoKVxuICAgICAgICAgIH1cbiAgICAgfVxuXG4gICAgIGZ1bmN0aW9uIGFjdGl2YXRlICgpXG4gICAgIHtcbiAgICAgICAgICBlbmFibGVFdmVudHMgKClcbiAgICAgICAgICBpc19hY3RpdmUgPSB0cnVlXG4gICAgIH1cblxuICAgICBmdW5jdGlvbiBkZXNhY3RpdmF0ZSAoKVxuICAgICB7XG4gICAgICAgICAgZGlzYWJsZUV2ZW50cyAoKVxuICAgICAgICAgIGlzX2FjdGl2ZSA9IGZhbHNlXG4gICAgIH1cblxuICAgICByZXR1cm4ge1xuICAgICAgICAgIHVwZGF0ZUNvbmZpZyxcbiAgICAgICAgICBhZGRIYW5kbGVzLFxuICAgICAgICAgIGlzQWN0aXZlOiAoKSA9PiBpc19hY3RpdmUsXG4gICAgICAgICAgYWN0aXZhdGUsXG4gICAgICAgICAgZGVzYWN0aXZhdGUsXG4gICAgIH1cblxuICAgICBmdW5jdGlvbiBlbmFibGVFdmVudHMgKClcbiAgICAge1xuICAgICAgICAgIGZvciAoIGNvbnN0IGggb2YgY29uZmlnLmhhbmRsZXMgKVxuICAgICAgICAgICAgICAgaC5hZGRFdmVudExpc3RlbmVyICggXCJwb2ludGVyZG93blwiLCBvblN0YXJ0LCB7IHBhc3NpdmU6IHRydWUgfSApXG4gICAgIH1cbiAgICAgZnVuY3Rpb24gZGlzYWJsZUV2ZW50cyAoKVxuICAgICB7XG4gICAgICAgICAgZm9yICggY29uc3QgaCBvZiBjb25maWcuaGFuZGxlcyApXG4gICAgICAgICAgICAgICBoLnJlbW92ZUV2ZW50TGlzdGVuZXIgKCBcInBvaW50ZXJkb3duXCIgLCBvblN0YXJ0IClcbiAgICAgfVxuXG4gICAgIGZ1bmN0aW9uIG9uU3RhcnQgKCBldmVudDogTW91c2VFdmVudCB8IFRvdWNoRXZlbnQgKVxuICAgICB7XG4gICAgICAgICAgaWYgKCBpc19kcmFnIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBjb25zb2xlLndhcm4gKCBcIlRlbnRhdGl2ZSBkZSBkw6ltYXJyYWdlIGRlcyDDqXbDqW5lbWVudHMgXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgXCJcXFwiZHJhZ2dhYmxlIFxcXCIgZMOpasOgIGVuIGNvdXJzLlwiIClcbiAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICggaXNfYW5pbWF0ZSApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgc3RvcFZlbG9jaXR5RnJhbWUgKClcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBwb2ludGVyID0gKGV2ZW50IGFzIFRvdWNoRXZlbnQpLnRvdWNoZXNcbiAgICAgICAgICAgICAgICAgICAgPyAoZXZlbnQgYXMgVG91Y2hFdmVudCkudG91Y2hlcyBbMF1cbiAgICAgICAgICAgICAgICAgICAgOiAoZXZlbnQgYXMgTW91c2VFdmVudClcblxuICAgICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyIChcInBvaW50ZXJtb3ZlXCIsIG9uTW92ZSlcbiAgICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lciAoXCJwb2ludGVydXBcIiAgLCBvbkVuZClcbiAgICAgICAgICBkaXNhYmxlRXZlbnRzICgpXG5cbiAgICAgICAgICBjdXJyZW50X2FuaW1hdGlvbiA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgKCBvbkFuaW1hdGlvblN0YXJ0IClcblxuICAgICAgICAgIGlzX2RyYWcgPSB0cnVlXG4gICAgIH1cbiAgICAgZnVuY3Rpb24gb25Nb3ZlICggZXZlbnQ6IE1vdXNlRXZlbnQgfCBUb3VjaEV2ZW50IClcbiAgICAge1xuICAgICAgICAgIGlmICggaXNfZHJhZyA9PSBmYWxzZSApXG4gICAgICAgICAgICAgICByZXR1cm5cblxuICAgICAgICAgIHBvaW50ZXIgPSAoZXZlbnQgYXMgVG91Y2hFdmVudCkudG91Y2hlcyAhPT0gdW5kZWZpbmVkXG4gICAgICAgICAgICAgICAgICAgID8gKGV2ZW50IGFzIFRvdWNoRXZlbnQpLnRvdWNoZXMgWzBdXG4gICAgICAgICAgICAgICAgICAgIDogKGV2ZW50IGFzIE1vdXNlRXZlbnQpXG4gICAgIH1cbiAgICAgZnVuY3Rpb24gb25FbmQgKCBldmVudDogTW91c2VFdmVudCB8IFRvdWNoRXZlbnQgKVxuICAgICB7XG4gICAgICAgICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIgKFwicG9pbnRlcm1vdmVcIiwgb25Nb3ZlKVxuICAgICAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyIChcInBvaW50ZXJ1cFwiICAsIG9uRW5kKVxuICAgICAgICAgIGVuYWJsZUV2ZW50cyAoKVxuXG4gICAgICAgICAgaXNfZHJhZyA9IGZhbHNlXG4gICAgIH1cblxuICAgICBmdW5jdGlvbiBvbkFuaW1hdGlvblN0YXJ0ICggbm93OiBudW1iZXIgKVxuICAgICB7XG4gICAgICAgICAgc3RhcnRfeCAgICA9IHBvaW50ZXIuY2xpZW50WFxuICAgICAgICAgIHN0YXJ0X3kgICAgPSBwb2ludGVyLmNsaWVudFlcbiAgICAgICAgICBzdGFydF90aW1lID0gbm93XG5cbiAgICAgICAgICBjdXJyZW50X2V2ZW50ID0ge1xuICAgICAgICAgICAgICAgZGVsYXkgICAgOiAwLFxuICAgICAgICAgICAgICAgeCAgICAgICAgOiAwLFxuICAgICAgICAgICAgICAgeSAgICAgICAgOiAwLFxuICAgICAgICAgICAgICAgb2Zmc2V0WCAgOiAwLFxuICAgICAgICAgICAgICAgb2Zmc2V0WSAgOiAwLFxuICAgICAgICAgICAgICAgdGFyZ2V0WDogMCxcbiAgICAgICAgICAgICAgIHRhcmdldFk6IDAsXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29uZmlnLm9uU3RhcnREcmFnICgpXG5cbiAgICAgICAgICBjdXJyZW50X2FuaW1hdGlvbiA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgKCBvbkFuaW1hdGlvbkZyYW1lIClcbiAgICAgfVxuICAgICBmdW5jdGlvbiBvbkFuaW1hdGlvbkZyYW1lICggbm93OiBudW1iZXIgKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgeyB2ZWxvY2l0eUZhY3RvciB9ID0gY29uZmlnXG5cbiAgICAgICAgICBjb25zdCB4ICAgICAgICAgICA9IHBvaW50ZXIuY2xpZW50WCAtIHN0YXJ0X3hcbiAgICAgICAgICBjb25zdCB5ICAgICAgICAgICA9IHN0YXJ0X3kgLSBwb2ludGVyLmNsaWVudFlcbiAgICAgICAgICBjb25zdCBkZWxheSAgICAgICA9IG5vdyAtIHN0YXJ0X3RpbWVcbiAgICAgICAgICBjb25zdCBvZmZzZXREZWxheSA9IGRlbGF5IC0gY3VycmVudF9ldmVudC5kZWxheVxuICAgICAgICAgIGNvbnN0IG9mZnNldFggICAgID0geCAtIGN1cnJlbnRfZXZlbnQueFxuICAgICAgICAgIGNvbnN0IG9mZnNldFkgICAgID0geSAtIGN1cnJlbnRfZXZlbnQueVxuXG4gICAgICAgICAgY3VycmVudF9ldmVudCA9IHtcbiAgICAgICAgICAgICAgIGRlbGF5LFxuICAgICAgICAgICAgICAgeCxcbiAgICAgICAgICAgICAgIHksXG4gICAgICAgICAgICAgICB0YXJnZXRYOiB4LFxuICAgICAgICAgICAgICAgdGFyZ2V0WTogeSxcbiAgICAgICAgICAgICAgIG9mZnNldFgsXG4gICAgICAgICAgICAgICBvZmZzZXRZLFxuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICggaXNfZHJhZyApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgY29uZmlnLm9uRHJhZyAoIGN1cnJlbnRfZXZlbnQgKVxuICAgICAgICAgICAgICAgY3VycmVudF9hbmltYXRpb24gPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lICggb25BbmltYXRpb25GcmFtZSApXG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBzdGFydF90aW1lICAgICA9IG5vd1xuICAgICAgICAgICAgICAgc3RhcnRfeCAgICAgICAgPSB4XG4gICAgICAgICAgICAgICBzdGFydF95ICAgICAgICA9IHlcbiAgICAgICAgICAgICAgIHZlbG9jaXR5X3ggICAgICAgPSB2ZWxvY2l0eUZhY3RvciAqIG5vcm0gKCBvZmZzZXRYIC8gb2Zmc2V0RGVsYXkgKVxuICAgICAgICAgICAgICAgdmVsb2NpdHlfeSAgICAgICA9IHZlbG9jaXR5RmFjdG9yICogbm9ybSAoIG9mZnNldFkgLyBvZmZzZXREZWxheSApXG5cbiAgICAgICAgICAgICAgIGN1cnJlbnRfZXZlbnQudGFyZ2V0WCArPSB2ZWxvY2l0eV94XG4gICAgICAgICAgICAgICBjdXJyZW50X2V2ZW50LnRhcmdldFkgKz0gdmVsb2NpdHlfeVxuXG4gICAgICAgICAgICAgICBpZiAoIGNvbmZpZy5vblN0b3BEcmFnICggY3VycmVudF9ldmVudCApID09PSB0cnVlIClcbiAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgaXNfYW5pbWF0ZSA9IHRydWVcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudF9hbmltYXRpb24gPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lICggb25WZWxvY2l0eUZyYW1lIClcbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBmdW5jdGlvbiBub3JtICggdmFsdWU6IG51bWJlciApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgaWYgKHZhbHVlIDwgLTEgKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gLTFcblxuICAgICAgICAgICAgICAgaWYgKCB2YWx1ZSA+IDEgKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gMVxuXG4gICAgICAgICAgICAgICByZXR1cm4gdmFsdWVcbiAgICAgICAgICB9XG4gICAgIH1cbiAgICAgZnVuY3Rpb24gb25WZWxvY2l0eUZyYW1lICggbm93OiBudW1iZXIgKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgZGVsYXkgPSBub3cgLSBzdGFydF90aW1lXG5cbiAgICAgICAgICBjb25zdCB0ID0gZGVsYXkgPj0gdmVsb2NpdHlfZGVsYXlcbiAgICAgICAgICAgICAgICAgID8gMVxuICAgICAgICAgICAgICAgICAgOiBkZWxheSAvIHZlbG9jaXR5X2RlbGF5XG5cbiAgICAgICAgICBjb25zdCBmYWN0b3IgID0gRWFzaW5nRnVuY3Rpb25zLmVhc2VPdXRRdWFydCAodClcbiAgICAgICAgICBjb25zdCBvZmZzZXRYID0gdmVsb2NpdHlfeCAqIGZhY3RvclxuICAgICAgICAgIGNvbnN0IG9mZnNldFkgPSB2ZWxvY2l0eV95ICogZmFjdG9yXG5cbiAgICAgICAgICBjdXJyZW50X2V2ZW50LnggICAgICAgPSBzdGFydF94ICsgb2Zmc2V0WFxuICAgICAgICAgIGN1cnJlbnRfZXZlbnQueSAgICAgICA9IHN0YXJ0X3kgKyBvZmZzZXRZXG4gICAgICAgICAgY3VycmVudF9ldmVudC5vZmZzZXRYID0gdmVsb2NpdHlfeCAtIG9mZnNldFhcbiAgICAgICAgICBjdXJyZW50X2V2ZW50Lm9mZnNldFkgPSB2ZWxvY2l0eV95IC0gb2Zmc2V0WVxuXG4gICAgICAgICAgY29uZmlnLm9uRHJhZyAoIGN1cnJlbnRfZXZlbnQgKVxuXG4gICAgICAgICAgaWYgKCB0ID09IDEgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGlzX2FuaW1hdGUgPSBmYWxzZVxuICAgICAgICAgICAgICAgY29uZmlnLm9uRW5kQW5pbWF0aW9uICggY3VycmVudF9ldmVudCApXG4gICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjdXJyZW50X2FuaW1hdGlvbiA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgKCBvblZlbG9jaXR5RnJhbWUgKVxuICAgICB9XG4gICAgIGZ1bmN0aW9uIHN0b3BWZWxvY2l0eUZyYW1lICgpXG4gICAgIHtcbiAgICAgICAgICBpc19hbmltYXRlID0gZmFsc2VcbiAgICAgICAgICB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUgKCBjdXJyZW50X2FuaW1hdGlvbiApXG4gICAgICAgICAgY29uZmlnLm9uRW5kQW5pbWF0aW9uICggY3VycmVudF9ldmVudCApXG4gICAgIH1cbn1cbiIsIlxuZXhwb3J0IHR5cGUgRXh0ZW5kZWRDU1NTdHlsZURlY2xhcmF0aW9uID0gQ1NTU3R5bGVEZWNsYXJhdGlvbiAmXG57XG4gICAgZGlzcGxheSAgICAgIDogXCJpbmxpbmVcIiB8IFwiYmxvY2tcIiB8IFwiY29udGVudHNcIiB8IFwiZmxleFwiIHwgXCJncmlkXCIgfCBcImlubGluZS1ibG9ja1wiIHwgXCJpbmxpbmUtZmxleFwiIHwgXCJpbmxpbmUtZ3JpZFwiIHwgXCJpbmxpbmUtdGFibGVcIiB8IFwibGlzdC1pdGVtXCIgfCBcInJ1bi1pblwiIHwgXCJ0YWJsZVwiIHwgXCJ0YWJsZS1jYXB0aW9uXCIgfCBcInRhYmxlLWNvbHVtbi1ncm91cFwiIHwgXCJ0YWJsZS1oZWFkZXItZ3JvdXBcIiB8IFwidGFibGUtZm9vdGVyLWdyb3VwXCIgfCBcInRhYmxlLXJvdy1ncm91cFwiIHwgXCJ0YWJsZS1jZWxsXCIgfCBcInRhYmxlLWNvbHVtblwiIHwgXCJ0YWJsZS1yb3dcIiB8IFwibm9uZVwiIHwgXCJpbml0aWFsXCIgfCBcImluaGVyaXRcIlxuICAgIGZsZXhEaXJlY3Rpb246IFwicm93XCIgfCBcInJvdy1yZXZlcnNlXCIgfCBcImNvbHVtblwiIHwgXCJjb2x1bW4tcmV2ZXJzZVwiIHwgXCJpbml0aWFsXCIgfCBcImluaGVyaXRcIlxuICAgIG92ZXJmbG93ICAgICA6IFwidmlzaWJsZVwiIHwgXCJoaWRkZW5cIiB8IFwic2Nyb2xsXCIgfCBcImF1dG9cIiB8IFwiaW5pdGlhbFwiIHwgXCJpbmhlcml0XCJcbiAgICBvdmVyZmxvd1ggICAgOiBcInZpc2libGVcIiB8IFwiaGlkZGVuXCIgfCBcInNjcm9sbFwiIHwgXCJhdXRvXCIgfCBcImluaXRpYWxcIiB8IFwiaW5oZXJpdFwiXG4gICAgb3ZlcmZsb3dZICAgIDogXCJ2aXNpYmxlXCIgfCBcImhpZGRlblwiIHwgXCJzY3JvbGxcIiB8IFwiYXV0b1wiIHwgXCJpbml0aWFsXCIgfCBcImluaGVyaXRcIlxuICAgIHBvc2l0aW9uICAgICA6IFwic3RhdGljXCIgfCBcImFic29sdXRlXCIgfCBcImZpeGVkXCIgfCBcInJlbGF0aXZlXCIgfCBcInN0aWNreVwiIHwgXCJpbml0aWFsXCIgfCBcImluaGVyaXRcIlxufVxuXG4vKmRlY2xhcmUgZ2xvYmFse1xuXG4gICAgIGludGVyZmFjZSBXaW5kb3dcbiAgICAge1xuICAgICAgICAgIG9uOiBXaW5kb3cgW1wiYWRkRXZlbnRMaXN0ZW5lclwiXVxuICAgICAgICAgIG9mZjogV2luZG93IFtcInJlbW92ZUV2ZW50TGlzdGVuZXJcIl1cbiAgICAgfVxuXG4gICAgIGludGVyZmFjZSBFbGVtZW50XG4gICAgIHtcbiAgICAgICAgICBjc3MgKCBwcm9wZXJ0aWVzOiBQYXJ0aWFsIDxFeHRlbmRlZENTU1N0eWxlRGVjbGFyYXRpb24+ICk6IHRoaXNcblxuICAgICAgICAgIGNzc0ludCAgICggcHJvcGVydHk6IHN0cmluZyApOiBudW1iZXJcbiAgICAgICAgICBjc3NGbG9hdCAoIHByb3BlcnR5OiBzdHJpbmcgKTogbnVtYmVyXG5cbiAgICAgICAgICBvbiA6IEhUTUxFbGVtZW50IFtcImFkZEV2ZW50TGlzdGVuZXJcIl1cbiAgICAgICAgICBvZmY6IEhUTUxFbGVtZW50IFtcInJlbW92ZUV2ZW50TGlzdGVuZXJcIl1cbiAgICAgICAgICAkICA6IEhUTUxFbGVtZW50IFtcInF1ZXJ5U2VsZWN0b3JcIl1cbiAgICAgICAgICAkJCA6IEhUTUxFbGVtZW50IFtcInF1ZXJ5U2VsZWN0b3JBbGxcIl1cbiAgICAgfVxufVxuXG5XaW5kb3cucHJvdG90eXBlLm9uICA9IFdpbmRvdy5wcm90b3R5cGUuYWRkRXZlbnRMaXN0ZW5lclxuV2luZG93LnByb3RvdHlwZS5vZmYgPSBXaW5kb3cucHJvdG90eXBlLnJlbW92ZUV2ZW50TGlzdGVuZXJcblxuRWxlbWVudC5wcm90b3R5cGUuY3NzID0gZnVuY3Rpb24gKCBwcm9wcyApXG57XG5PYmplY3QuYXNzaWduICggdGhpcy5zdHlsZSwgcHJvcHMgKVxucmV0dXJuIHRoaXNcbn1cblxuRWxlbWVudC5wcm90b3R5cGUuY3NzSW50ID0gZnVuY3Rpb24gKCBwcm9wZXJ0eTogc3RyaW5nIClcbntcbiAgICAgdmFyIHZhbHVlID0gcGFyc2VJbnQgKCB0aGlzLnN0eWxlIFsgcHJvcGVydHkgXSApXG5cbiAgICAgaWYgKCBOdW1iZXIuaXNOYU4gKCB2YWx1ZSApIClcbiAgICAge1xuICAgICAgICAgIHZhbHVlID0gcGFyc2VJbnQgKCB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZSAoIHRoaXMgKSBbIHByb3BlcnR5IF0gKVxuXG4gICAgICAgICAgaWYgKCBOdW1iZXIuaXNOYU4gKCB2YWx1ZSApIClcbiAgICAgICAgICAgICAgIHZhbHVlID0gMFxuICAgICB9XG5cbiAgICAgcmV0dXJuIHZhbHVlXG59XG5cbkVsZW1lbnQucHJvdG90eXBlLmNzc0Zsb2F0ID0gZnVuY3Rpb24gKCBwcm9wZXJ0eTogc3RyaW5nIClcbntcbiAgICAgdmFyIHZhbHVlID0gcGFyc2VGbG9hdCAoIHRoaXMuc3R5bGUgWyBwcm9wZXJ0eSBdIClcblxuICAgICBpZiAoIE51bWJlci5pc05hTiAoIHZhbHVlICkgKVxuICAgICB7XG4gICAgICAgICAgdmFsdWUgPSBwYXJzZUZsb2F0ICggd2luZG93LmdldENvbXB1dGVkU3R5bGUgKCB0aGlzICkgWyBwcm9wZXJ0eSBdIClcblxuICAgICAgICAgIGlmICggTnVtYmVyLmlzTmFOICggdmFsdWUgKSApXG4gICAgICAgICAgICAgICB2YWx1ZSA9IDBcbiAgICAgfVxuXG4gICAgIHJldHVybiB2YWx1ZVxufVxuXG5FbGVtZW50LnByb3RvdHlwZS5vbiAgPSBFbGVtZW50LnByb3RvdHlwZS5hZGRFdmVudExpc3RlbmVyXG5cbkVsZW1lbnQucHJvdG90eXBlLm9mZiA9IEVsZW1lbnQucHJvdG90eXBlLnJlbW92ZUV2ZW50TGlzdGVuZXJcblxuRWxlbWVudC5wcm90b3R5cGUuJCAgID0gRWxlbWVudC5wcm90b3R5cGUucXVlcnlTZWxlY3RvclxuXG5FbGVtZW50LnByb3RvdHlwZS4kJCAgPSBFbGVtZW50LnByb3RvdHlwZS5xdWVyeVNlbGVjdG9yQWxsXG5cblxuRWxlbWVudC5wcm90b3R5cGUuY3NzSW50ID0gZnVuY3Rpb24gKCBwcm9wZXJ0eTogc3RyaW5nIClcbntcbiAgICAgdmFyIHZhbHVlID0gcGFyc2VJbnQgKCB0aGlzLnN0eWxlIFsgcHJvcGVydHkgXSApXG5cbiAgICAgaWYgKCBOdW1iZXIuaXNOYU4gKCB2YWx1ZSApIClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHN0eWxlID0gd2luZG93LmdldENvbXB1dGVkU3R5bGUgKCB0aGlzIClcblxuICAgICAgICAgIHZhbHVlID0gcGFyc2VJbnQgKCBzdHlsZSBbIHByb3BlcnR5IF0gKVxuXG4gICAgICAgICAgaWYgKCBOdW1iZXIuaXNOYU4gKCB2YWx1ZSApIClcbiAgICAgICAgICAgICAgIHZhbHVlID0gMFxuICAgICB9XG5cbiAgICAgcmV0dXJuIHZhbHVlXG59Ki9cblxuZXhwb3J0IGZ1bmN0aW9uIGNzcyAoIGVsOiBIVE1MRWxlbWVudCB8IFNWR0VsZW1lbnQsIHByb3BzOiBQYXJ0aWFsIDxFeHRlbmRlZENTU1N0eWxlRGVjbGFyYXRpb24+IClcbntcbiAgICAgT2JqZWN0LmFzc2lnbiAoIGVsLnN0eWxlLCBwcm9wcyApXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjc3NGbG9hdCAoIGVsOiBIVE1MRWxlbWVudCB8IFNWR0VsZW1lbnQsIHByb3BlcnR5OiBzdHJpbmcgKVxue1xuICAgICB2YXIgdmFsdWUgPSBwYXJzZUZsb2F0ICggZWwuc3R5bGUgWyBwcm9wZXJ0eSBdIClcblxuICAgICBpZiAoIE51bWJlci5pc05hTiAoIHZhbHVlICkgKVxuICAgICB7XG4gICAgICAgICAgdmFsdWUgPSBwYXJzZUZsb2F0ICggd2luZG93LmdldENvbXB1dGVkU3R5bGUgKCBlbCApIFsgcHJvcGVydHkgXSApXG5cbiAgICAgICAgICBpZiAoIE51bWJlci5pc05hTiAoIHZhbHVlICkgKVxuICAgICAgICAgICAgICAgdmFsdWUgPSAwXG4gICAgIH1cblxuICAgICByZXR1cm4gdmFsdWVcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNzc0ludCAoIGVsOiBIVE1MRWxlbWVudCB8IFNWR0VsZW1lbnQsIHByb3BlcnR5OiBzdHJpbmcgKVxue1xuICAgICB2YXIgdmFsdWUgPSBwYXJzZUludCAoIGVsLnN0eWxlIFsgcHJvcGVydHkgXSApXG5cbiAgICAgaWYgKCBOdW1iZXIuaXNOYU4gKCB2YWx1ZSApIClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHN0eWxlID0gd2luZG93LmdldENvbXB1dGVkU3R5bGUgKCBlbCApXG5cbiAgICAgICAgICB2YWx1ZSA9IHBhcnNlSW50ICggc3R5bGUgWyBwcm9wZXJ0eSBdIClcblxuICAgICAgICAgIGlmICggTnVtYmVyLmlzTmFOICggdmFsdWUgKSApXG4gICAgICAgICAgICAgICB2YWx1ZSA9IDBcbiAgICAgfVxuXG4gICAgIHJldHVybiB2YWx1ZVxufVxuXG4iLCJcbmltcG9ydCAqIGFzIFVpIGZyb20gXCIuL2RyYWdnYWJsZS5qc1wiXG5pbXBvcnQgeyBjc3NJbnQgfSBmcm9tIFwiLi9kb20uanNcIlxuXG50eXBlIERpcmVjdGlvbiA9IFwibHJcIiB8IFwicmxcIiB8IFwiYnRcIiB8IFwidGJcIlxuXG4vL2V4cG9ydCB0eXBlIEV4cGVuZGFibGVQcm9wZXJ0eSA9IFwid2lkdGhcIiB8IFwiaGVpZ2h0XCJcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHwgXCJ0b3BcIiB8IFwibGVmdFwiIHwgXCJib3R0b21cIiB8IFwicmlnaHRcIlxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfCBcInhcIiB8IFwieVwiXG5cbmV4cG9ydCB0eXBlIEV4cGVuZGFibGVFbGVtZW50ID0gUmV0dXJuVHlwZSA8dHlwZW9mIGV4cGFuZGFibGU+XG5cbnR5cGUgRXhwZW5kYWJsZU9wdGlvbnMgPSBQYXJ0aWFsIDxFeHBlbmRhYmxlQ29uZmlnPlxuXG5pbnRlcmZhY2UgRXhwZW5kYWJsZUNvbmZpZ1xue1xuICAgICBoYW5kbGVzICAgICAgOiBKU1guRWxlbWVudCBbXVxuICAgICBwcm9wZXJ0eT8gICAgOiBzdHJpbmcsXG4gICAgIG9wZW4gICAgICAgICA6IGJvb2xlYW5cbiAgICAgbmVhciAgICAgICAgIDogbnVtYmVyXG4gICAgIGRlbGF5ICAgICAgICA6IG51bWJlclxuICAgICBkaXJlY3Rpb24gICAgOiBEaXJlY3Rpb25cbiAgICAgbWluU2l6ZSAgICAgIDogbnVtYmVyXG4gICAgIG1heFNpemUgICAgICA6IG51bWJlclxuICAgICB1bml0ICAgICAgICAgOiBcInB4XCIgfCBcIiVcIiB8IFwiXCIsXG4gICAgIG9uQmVmb3JlT3BlbiA6ICgpID0+IHZvaWRcbiAgICAgb25BZnRlck9wZW4gIDogKCkgPT4gdm9pZFxuICAgICBvbkJlZm9yZUNsb3NlOiAoKSA9PiB2b2lkXG4gICAgIG9uQWZ0ZXJDbG9zZSA6ICgpID0+IHZvaWRcbn1cblxuY29uc3QgdmVydGljYWxQcm9wZXJ0aWVzID0gWyBcImhlaWdodFwiLCBcInRvcFwiLCBcImJvdHRvbVwiIF1cblxuZnVuY3Rpb24gZGVmYXVsdENvbmZpZyAoKTogRXhwZW5kYWJsZUNvbmZpZ1xue1xuICAgICByZXR1cm4ge1xuICAgICAgICAgIGhhbmRsZXMgICAgICA6IFtdLFxuICAgICAgICAgIHByb3BlcnR5ICAgICA6IFwiaGVpZ2h0XCIsXG4gICAgICAgICAgb3BlbiAgICAgICAgIDogZmFsc2UsXG4gICAgICAgICAgbmVhciAgICAgICAgIDogNDAsXG4gICAgICAgICAgZGVsYXkgICAgICAgIDogMjUwLFxuICAgICAgICAgIG1pblNpemUgICAgICA6IDAsXG4gICAgICAgICAgbWF4U2l6ZSAgICAgIDogd2luZG93LmlubmVySGVpZ2h0LFxuICAgICAgICAgIHVuaXQgICAgICAgICA6IFwicHhcIixcbiAgICAgICAgICBkaXJlY3Rpb24gICAgOiBcInRiXCIsXG4gICAgICAgICAgb25CZWZvcmVPcGVuIDogKCkgPT4ge30sXG4gICAgICAgICAgb25BZnRlck9wZW4gIDogKCkgPT4ge30sXG4gICAgICAgICAgb25CZWZvcmVDbG9zZTogKCkgPT4ge30sXG4gICAgICAgICAgb25BZnRlckNsb3NlIDogKCkgPT4ge30sXG4gICAgIH1cbn1cblxuY29uc3QgdG9TaWduID0ge1xuICAgICBsciA6IDEsXG4gICAgIHJsIDogLTEsXG4gICAgIHRiIDogLTEsXG4gICAgIGJ0IDogMSxcbn1cbmNvbnN0IHRvUHJvcGVydHkgOiBSZWNvcmQgPERpcmVjdGlvbiwgc3RyaW5nPiA9IHtcbiAgICAgbHIgOiBcIndpZHRoXCIsXG4gICAgIHJsIDogXCJ3aWR0aFwiLFxuICAgICB0YiA6IFwiaGVpZ2h0XCIsXG4gICAgIGJ0IDogXCJoZWlnaHRcIixcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGV4cGFuZGFibGUgKCBlbGVtZW50OiBKU1guRWxlbWVudCwgb3B0aW9uczogRXhwZW5kYWJsZU9wdGlvbnMgPSB7fSApXG57XG4gICAgIGNvbnN0IGNvbmZpZyA9IGRlZmF1bHRDb25maWcgKClcblxuICAgICB2YXIgaXNfb3BlbiAgICA6IGJvb2xlYW5cbiAgICAgdmFyIGlzX3ZlcnRpY2FsOiBib29sZWFuXG4gICAgIHZhciBzaWduICAgICAgIDogbnVtYmVyXG4gICAgIHZhciB1bml0ICAgICAgIDogRXhwZW5kYWJsZUNvbmZpZyBbXCJ1bml0XCJdXG4gICAgIHZhciBjYiAgICAgICAgIDogKCkgPT4gdm9pZFxuICAgICB2YXIgbWluU2l6ZSAgICA6IG51bWJlclxuICAgICB2YXIgbWF4U2l6ZSAgICA6IG51bWJlclxuICAgICB2YXIgc3RhcnRfc2l6ZSAgPSAwXG4gICAgIHZhciBvcGVuX3NpemUgICA9IDEwMFxuXG4gICAgIGNvbnN0IGRyYWdnYWJsZSA9IFVpLmRyYWdnYWJsZSAoe1xuICAgICAgICAgIGhhbmRsZXMgICAgICAgOiBbXSxcbiAgICAgICAgICBvblN0YXJ0RHJhZyAgIDogb25TdGFydERyYWcsXG4gICAgICAgICAgb25TdG9wRHJhZyAgICA6IG9uU3RvcERyYWcsXG4gICAgICAgICAgb25FbmRBbmltYXRpb246IG9uRW5kQW5pbWF0aW9uLFxuICAgICB9KVxuXG4gICAgIHVwZGF0ZUNvbmZpZyAoIG9wdGlvbnMgKVxuXG4gICAgIGZ1bmN0aW9uIHVwZGF0ZUNvbmZpZyAoIG9wdGlvbnMgPSB7fSBhcyBFeHBlbmRhYmxlT3B0aW9ucyApXG4gICAgIHtcbiAgICAgICAgICBpZiAoIG9wdGlvbnMucHJvcGVydHkgPT0gdW5kZWZpbmVkICYmIG9wdGlvbnMuZGlyZWN0aW9uICE9IHVuZGVmaW5lZCApXG4gICAgICAgICAgICAgICBvcHRpb25zLnByb3BlcnR5ID0gdG9Qcm9wZXJ0eSBbb3B0aW9ucy5kaXJlY3Rpb25dXG5cbiAgICAgICAgICBPYmplY3QuYXNzaWduICggY29uZmlnLCBvcHRpb25zIClcblxuICAgICAgICAgIGlzX29wZW4gICAgID0gY29uZmlnLm9wZW5cbiAgICAgICAgICBzaWduICAgICAgICA9IHRvU2lnbiBbY29uZmlnLmRpcmVjdGlvbl1cbiAgICAgICAgICB1bml0ICAgICAgICA9IGNvbmZpZy51bml0XG4gICAgICAgICAgaXNfdmVydGljYWwgPSBjb25maWcuZGlyZWN0aW9uID09IFwiYnRcIiB8fCBjb25maWcuZGlyZWN0aW9uID09IFwidGJcIiA/IHRydWUgOiBmYWxzZVxuICAgICAgICAgIG1pblNpemUgPSBjb25maWcubWluU2l6ZVxuICAgICAgICAgIG1heFNpemUgPSBjb25maWcubWF4U2l6ZVxuXG4gICAgICAgICAgZWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlICggaXNfdmVydGljYWwgPyBcImhvcml6b250YWxcIiA6IFwidmVydGljYWxcIiApXG4gICAgICAgICAgZWxlbWVudC5jbGFzc0xpc3QuYWRkICAgICggaXNfdmVydGljYWwgPyBcInZlcnRpY2FsXCIgOiBcImhvcml6b250YWxcIiApXG5cbiAgICAgICAgICBkcmFnZ2FibGUudXBkYXRlQ29uZmlnICh7XG4gICAgICAgICAgICAgICBoYW5kbGVzOiBjb25maWcuaGFuZGxlcyxcbiAgICAgICAgICAgICAgIG9uRHJhZyA6IGlzX3ZlcnRpY2FsID8gb25EcmFnVmVydGljYWw6IG9uRHJhZ0hvcml6b250YWwsXG4gICAgICAgICAgfSlcbiAgICAgfVxuICAgICBmdW5jdGlvbiBzaXplICgpXG4gICAgIHtcbiAgICAgICAgICByZXR1cm4gaXNfb3BlbiA/IGNzc0ludCAoIGVsZW1lbnQsIGNvbmZpZy5wcm9wZXJ0eSApIDogMFxuICAgICB9XG4gICAgIGZ1bmN0aW9uIHRvZ2dsZSAoKVxuICAgICB7XG4gICAgICAgICAgaWYgKCBpc19vcGVuIClcbiAgICAgICAgICAgICAgIGNsb3NlICgpXG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgb3BlbiAoKVxuICAgICB9XG4gICAgIGZ1bmN0aW9uIG9wZW4gKClcbiAgICAge1xuICAgICAgICAgIGNvbmZpZy5vbkJlZm9yZU9wZW4gKClcblxuICAgICAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LmFkZCAoIFwiYW5pbWF0ZVwiIClcbiAgICAgICAgICBlbGVtZW50LmNsYXNzTGlzdC5yZXBsYWNlICggXCJjbG9zZVwiLCBcIm9wZW5cIiApXG5cbiAgICAgICAgICBpZiAoIGNiIClcbiAgICAgICAgICAgICAgIG9uVHJhbnNpdGlvbkVuZCAoKVxuXG4gICAgICAgICAgY2IgPSBjb25maWcub25BZnRlck9wZW5cbiAgICAgICAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIgKCBcInRyYW5zaXRpb25lbmRcIiwgKCkgPT4gb25UcmFuc2l0aW9uRW5kIClcblxuICAgICAgICAgIGVsZW1lbnQuc3R5bGUgWyBjb25maWcucHJvcGVydHkgXSA9IG9wZW5fc2l6ZSArIHVuaXRcblxuICAgICAgICAgIGlzX29wZW4gPSB0cnVlXG4gICAgIH1cbiAgICAgZnVuY3Rpb24gY2xvc2UgKClcbiAgICAge1xuICAgICAgICAgIGNvbmZpZy5vbkJlZm9yZUNsb3NlICgpXG5cbiAgICAgICAgICBvcGVuX3NpemUgPSBzaXplICgpXG5cbiAgICAgICAgICBlbGVtZW50LmNsYXNzTGlzdC5hZGQgKCBcImFuaW1hdGVcIiApXG4gICAgICAgICAgZWxlbWVudC5jbGFzc0xpc3QucmVwbGFjZSAoIFwib3BlblwiLCBcImNsb3NlXCIgKVxuXG4gICAgICAgICAgaWYgKCBjYiApXG4gICAgICAgICAgICAgICBvblRyYW5zaXRpb25FbmQgKClcblxuICAgICAgICAgIGNiID0gY29uZmlnLm9uQWZ0ZXJDbG9zZVxuICAgICAgICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lciAoIFwidHJhbnNpdGlvbmVuZFwiLCBvblRyYW5zaXRpb25FbmQgKVxuXG4gICAgICAgICAgZWxlbWVudC5zdHlsZSBbIGNvbmZpZy5wcm9wZXJ0eSBdID0gXCIwXCIgKyB1bml0XG5cbiAgICAgICAgICBpc19vcGVuID0gZmFsc2VcbiAgICAgfVxuXG4gICAgIHJldHVybiB7XG4gICAgICAgICAgdXBkYXRlQ29uZmlnLFxuICAgICAgICAgIG9wZW4sXG4gICAgICAgICAgY2xvc2UsXG4gICAgICAgICAgdG9nZ2xlLFxuICAgICAgICAgIGlzT3BlbiAgICAgOiAoKSA9PiBpc19vcGVuLFxuICAgICAgICAgIGlzQ2xvc2UgICAgOiAoKSA9PiAhIGlzX29wZW4sXG4gICAgICAgICAgaXNWZXJ0aWNhbCA6ICgpID0+IGlzX3ZlcnRpY2FsLFxuICAgICAgICAgIGlzQWN0aXZlICAgOiAoKSA9PiBkcmFnZ2FibGUuaXNBY3RpdmUgKCksXG4gICAgICAgICAgYWN0aXZhdGUgICA6ICgpID0+IGRyYWdnYWJsZS5hY3RpdmF0ZSAoKSxcbiAgICAgICAgICBkZXNhY3RpdmF0ZTogKCkgPT4gZHJhZ2dhYmxlLmRlc2FjdGl2YXRlICgpLFxuICAgICB9XG5cbiAgICAgZnVuY3Rpb24gb25UcmFuc2l0aW9uRW5kICgpXG4gICAgIHtcbiAgICAgICAgICBpZiAoIGNiIClcbiAgICAgICAgICAgICAgIGNiICgpXG4gICAgICAgICAgZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyICggXCJ0cmFuc2l0aW9uZW5kXCIsICgpID0+IG9uVHJhbnNpdGlvbkVuZCApXG4gICAgICAgICAgY2IgPSBudWxsXG4gICAgIH1cblxuICAgICBmdW5jdGlvbiBvblN0YXJ0RHJhZyAoKVxuICAgICB7XG4gICAgICAgICAgc3RhcnRfc2l6ZSA9IHNpemUgKClcbiAgICAgICAgICBlbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUgKCBcImFuaW1hdGVcIiApXG4gICAgIH1cbiAgICAgZnVuY3Rpb24gb25EcmFnVmVydGljYWwgKCBldmVudDogVWkuRHJhZ0V2ZW50IClcbiAgICAge1xuICAgICAgICAgIGNvbnNvbGUubG9nICggbWluU2l6ZSwgZXZlbnQueSwgbWF4U2l6ZSApXG4gICAgICAgICAgY29uc29sZS5sb2cgKCBjbGFtcCAoIHN0YXJ0X3NpemUgKyBzaWduICogZXZlbnQueSApICsgdW5pdCApXG4gICAgICAgICAgZWxlbWVudC5zdHlsZSBbIGNvbmZpZy5wcm9wZXJ0eSBdID0gY2xhbXAgKCBzdGFydF9zaXplICsgc2lnbiAqIGV2ZW50LnkgKSArIHVuaXRcbiAgICAgfVxuICAgICBmdW5jdGlvbiBvbkRyYWdIb3Jpem9udGFsICggZXZlbnQ6IFVpLkRyYWdFdmVudCApXG4gICAgIHtcbiAgICAgICAgICBlbGVtZW50LnN0eWxlIFsgY29uZmlnLnByb3BlcnR5IF0gPSBjbGFtcCAoIHN0YXJ0X3NpemUgKyBzaWduICogZXZlbnQueCApICsgdW5pdFxuICAgICB9XG4gICAgIGZ1bmN0aW9uIG9uU3RvcERyYWcgKCBldmVudDogVWkuRHJhZ0V2ZW50IClcbiAgICAge1xuICAgICAgICAgIHZhciBpc19tb3ZlZCA9IGlzX3ZlcnRpY2FsID8gc2lnbiAqIGV2ZW50LnkgPiBjb25maWcubmVhclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogc2lnbiAqIGV2ZW50LnggPiBjb25maWcubmVhclxuXG4gICAgICAgICAgaWYgKCAoaXNfbW92ZWQgPT0gZmFsc2UpICYmIGV2ZW50LmRlbGF5IDw9IGNvbmZpZy5kZWxheSApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgdG9nZ2xlICgpXG4gICAgICAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjb25zdCB0YXJnZXRfc2l6ZSA9IGNsYW1wIChcbiAgICAgICAgICAgICAgIGlzX3ZlcnRpY2FsID8gc3RhcnRfc2l6ZSArIHNpZ24gKiBldmVudC50YXJnZXRZXG4gICAgICAgICAgICAgICAgICAgICAgICAgICA6IHN0YXJ0X3NpemUgKyBzaWduICogZXZlbnQudGFyZ2V0WFxuICAgICAgICAgIClcblxuICAgICAgICAgIGlmICggdGFyZ2V0X3NpemUgPD0gY29uZmlnLm5lYXIgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNsb3NlICgpXG4gICAgICAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gdHJ1ZVxuXG4gICAgIH1cbiAgICAgZnVuY3Rpb24gb25FbmRBbmltYXRpb24gKClcbiAgICAge1xuICAgICAgICAgIG9wZW5fc2l6ZSA9IGNzc0ludCAoIGVsZW1lbnQsIGNvbmZpZy5wcm9wZXJ0eSApXG4gICAgICAgICAgb3BlbiAoKVxuICAgICB9XG5cbiAgICAgZnVuY3Rpb24gY2xhbXAgKCB2OiBudW1iZXIgKVxuICAgICB7XG4gICAgICAgICAgaWYgKCB2IDwgbWluU2l6ZSApXG4gICAgICAgICAgICAgICByZXR1cm4gbWluU2l6ZVxuXG4gICAgICAgICAgaWYgKCB2ID4gbWF4U2l6ZSApXG4gICAgICAgICAgICAgICByZXR1cm4gbWF4U2l6ZVxuXG4gICAgICAgICAgcmV0dXJuIHZcbiAgICAgfVxufVxuIiwiXG5pbXBvcnQgeyB4bm9kZSB9IGZyb20gXCIuLi9CYXNlL3hub2RlLmpzXCJcbmltcG9ydCB7IENvbnRhaW5lciB9IGZyb20gXCIuL2NvbnRhaW5lci5qc1wiXG5pbXBvcnQgeyBFeHBlbmRhYmxlRWxlbWVudCwgZXhwYW5kYWJsZSB9IGZyb20gXCIuLi9CYXNlL2V4cGVuZGFibGUuanNcIlxuaW1wb3J0IHsgY3NzRmxvYXQgfSBmcm9tIFwiLi4vQmFzZS9kb20uanNcIlxuaW1wb3J0IHsgQ29tcG9uZW50IH0gZnJvbSBcIi4vY29tcG9uZW50LmpzXCJcbmltcG9ydCBcIi4vYnV0dG9uXCJcbmltcG9ydCB7IGRlZmluZSB9IGZyb20gXCIuLi9kYlwiXG5cbmRlY2xhcmUgZ2xvYmFsXG57XG4gICAgIGludGVyZmFjZSAkVG9vbGJhciBleHRlbmRzICRFeHRlbmRzIDwkTGlzdFZpZXc+IC8vICRDb250YWluZXJcbiAgICAge1xuICAgICAgICAgIHR5cGUgICAgIDogXCJ0b29sYmFyXCJcbiAgICAgICAgICB0aXRsZSAgICA6IHN0cmluZ1xuICAgICAgICAgIGJ1dHRvbnMgIDogJEJ1dHRvbiBbXVxuICAgICB9XG5cbiAgICAgaW50ZXJmYWNlICRMaXN0VmlldyBleHRlbmRzICRDb250YWluZXJcbiAgICAge1xuICAgICAgICAgIHR5cGU6IFwibGlzdC12aWV3XCJcbiAgICAgfVxuXG59XG5cbmNsYXNzIExpc3RWaWV3IDwkIGV4dGVuZHMgJEV4dGVuZHMgPCRMaXN0Vmlldz4+IGV4dGVuZHMgQ29udGFpbmVyIDwkPlxue1xuICAgICBzd2lwZWFibGU6IEV4cGVuZGFibGVFbGVtZW50XG5cbiAgICAgLyoqIEBvdmVycmlkZSAqL1xuICAgICBnZXRIdG1sICgpXG4gICAgIHtcbiAgICAgICAgICBpZiAoIHRoaXMuY29udGFpbmVyICE9IHVuZGVmaW5lZCApXG4gICAgICAgICAgICAgICByZXR1cm4gW3RoaXMuY29udGFpbmVyXVxuXG4gICAgICAgICAgY29uc3Qgc2xvdCA9IHRoaXMuc2xvdCA9IDxkaXYgY2xhc3M9XCJsaXN0LXZpZXctc2xpZGVcIj48L2Rpdj5cblxuICAgICAgICAgIHN1cGVyLmdldEh0bWwgKClcblxuICAgICAgICAgIGNvbnN0IGNvbnRhaW5lciA9IHRoaXMuY29udGFpbmVyXG5cbiAgICAgICAgICBjb250YWluZXIuYXBwZW5kICggc2xvdCApXG4gICAgICAgICAgY29udGFpbmVyLmNsYXNzTGlzdC5hZGQgKCBcImxpc3Qtdmlld1wiIClcblxuICAgICAgICAgIHRoaXMuc3dpcGVhYmxlID0gZXhwYW5kYWJsZSAoIHNsb3QsIHtcbiAgICAgICAgICAgICAgIGhhbmRsZXMgICA6IFsgY29udGFpbmVyIF0sXG4gICAgICAgICAgICAgICBtaW5TaXplICA6IDAsXG4gICAgICAgICAgICAgICBtYXhTaXplICA6IDAsXG4gICAgICAgICAgICAgICBwcm9wZXJ0eSAgOiB0aGlzLmlzX3ZlcnRpY2FsID8gXCJ0b3BcIjogXCJsZWZ0XCIsXG4gICAgICAgICAgICAgICBkaXJlY3Rpb24gOiB0aGlzLmRhdGEuZGlyZWN0aW9uLFxuICAgICAgICAgICAgICAgdW5pdCAgICAgOiBcInB4XCIsXG4gICAgICAgICAgICAgICAvL21vdXNlV2hlZWw6IHRydWUsXG4gICAgICAgICAgfSlcbiAgICAgICAgICB0aGlzLnN3aXBlYWJsZS5hY3RpdmF0ZSAoKVxuXG4gICAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIgKCBcIkRPTUNvbnRlbnRMb2FkZWRcIiwgKCkgPT5cbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICB0aGlzLnN3aXBlYWJsZS51cGRhdGVDb25maWcgKHtcbiAgICAgICAgICAgICAgICAgICAgbWluU2l6ZTogLXRoaXMuc2xpZGVTaXplICgpLFxuICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICB9KVxuXG4gICAgICAgICAgcmV0dXJuIFt0aGlzLmNvbnRhaW5lcl1cbiAgICAgfVxuXG4gICAgIC8vIG9uQ2hpbGRyZW5BZGRlZCAoIGVsZW1lbnRzOiBDb21wb25lbnQgW10gKVxuICAgICAvLyB7XG4gICAgIC8vICAgICAgdGhpcy5zd2lwZWFibGUudXBkYXRlQ29uZmlnICh7XG4gICAgIC8vICAgICAgICAgICBtaW5TaXplICA6IC10aGlzLnNsaWRlU2l6ZSAoKSxcbiAgICAgLy8gICAgICAgICAgIHByb3BlcnR5IDogdGhpcy5pc192ZXJ0aWNhbCA/IFwidG9wXCI6IFwibGVmdFwiLFxuICAgICAvLyAgICAgICAgICAgZGlyZWN0aW9uOiB0aGlzLmRhdGEuZGlyZWN0aW9uLFxuICAgICAvLyAgICAgIH0pXG4gICAgIC8vIH1cblxuICAgICBwcml2YXRlIHNsaWRlU2l6ZSAoKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgeyBzbG90IH0gPSB0aGlzXG5cbiAgICAgICAgICByZXR1cm4gY3NzRmxvYXQgKCBzbG90LCB0aGlzLmlzX3ZlcnRpY2FsID8gXCJoZWlnaHRcIiA6IFwid2lkdGhcIiApXG4gICAgIH1cblxuICAgICBzd2lwZSAoIG9mZnNldDogc3RyaW5nfG51bWJlciwgdW5pdD86IFwicHhcIiB8IFwiJVwiIClcbiAgICAge1xuICAgICAgICAgLy8gaWYgKCB0eXBlb2Ygb2Zmc2V0ID09IFwic3RyaW5nXCIgKVxuICAgICAgICAgLy8gICAgICB0aGlzLnN3aXBlYWJsZS5zd2lwZSAoIG9mZnNldCApXG4gICAgICAgICAvLyBlbHNlXG4gICAgICAgICAvLyAgICAgIHRoaXMuc3dpcGVhYmxlLnN3aXBlICggb2Zmc2V0LCB1bml0IClcbiAgICAgfVxufVxuXG4vKipcbiAqICAgYGBgcHVnXG4gKiAgIC50b29sYmFyXG4gKiAgICAgICAgLnRvb2xiYXItYmFja2dyb3VuZ1xuICogICAgICAgIC50b29sYmFyLXNsaWRlXG4gKiAgICAgICAgICAgICBbLi4uXVxuICogICBgYGBcbiAqL1xuZXhwb3J0IGNsYXNzIFRvb2xiYXIgZXh0ZW5kcyBMaXN0VmlldyA8JFRvb2xiYXI+XG57XG4gICAgIHRhYnMgICAgICA6IEpTWC5FbGVtZW50IFtdXG4gICAgIGJhY2tncm91bmQ6IEpTWC5FbGVtZW50XG5cbiAgICAgZGVmYXVsdENvbmZpZyAoKTogJFRvb2xiYXJcbiAgICAge1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAuLi4gc3VwZXIuZGVmYXVsdERhdGEgKCksXG4gICAgICAgICAgICAgICB0eXBlICAgICA6IFwidG9vbGJhclwiLFxuICAgICAgICAgICAgICAgdGl0bGUgICAgOiBcIlRpdGxlIC4uLlwiLFxuICAgICAgICAgICAgICAgZGlyZWN0aW9uOiBcImxyXCIsXG4gICAgICAgICAgICAgICAvL3JldmVyc2UgIDogZmFsc2UsXG4gICAgICAgICAgICAgICBidXR0b25zOiBbXVxuICAgICAgICAgIH1cbiAgICAgfVxuXG4gICAgIC8qKiBAb3ZlcnJpZGUgKi9cbiAgICAgZ2V0SHRtbCAoKVxuICAgICB7XG4gICAgICAgICAgaWYgKCB0aGlzLmNvbnRhaW5lciAhPSB1bmRlZmluZWQgKVxuICAgICAgICAgICAgICAgcmV0dXJuIFt0aGlzLmNvbnRhaW5lcl1cblxuICAgICAgICAgIHN1cGVyLmdldEh0bWwgKClcblxuICAgICAgICAgIGlmICggdGhpcy5kYXRhLmJ1dHRvbnMgKVxuICAgICAgICAgICAgICAgdGhpcy5hcHBlbmQgKCAuLi4gdGhpcy5kYXRhLmJ1dHRvbnMgKVxuXG4gICAgICAgICAgcmV0dXJuIFt0aGlzLmNvbnRhaW5lcl1cbiAgICAgfVxufVxuXG5kZWZpbmUgKCBUb29sYmFyLCBbQ09OVEVYVF9VSSwgXCJ0b29sYmFyXCJdIClcblxuXG4vLyB0eXBlIERpcmVjdGlvbiA9IFwibHJcIiB8IFwicmxcIiB8IFwidGJcIiB8IFwiYnRcIlxuLy9cbi8vIHR5cGUgVW5pdHMgPSBcInB4XCIgfCBcIiVcIlxuLy9cbi8vIGNvbnN0IHRvRmxleERpcmVjdGlvbiA9IHtcbi8vICAgICAgbHI6IFwicm93XCIgICAgICAgICAgICBhcyBcInJvd1wiLFxuLy8gICAgICBybDogXCJyb3ctcmV2ZXJzZVwiICAgIGFzIFwicm93LXJldmVyc2VcIixcbi8vICAgICAgdGI6IFwiY29sdW1uXCIgICAgICAgICBhcyBcImNvbHVtblwiLFxuLy8gICAgICBidDogXCJjb2x1bW4tcmV2ZXJzZVwiIGFzIFwiY29sdW1uLXJldmVyc2VcIixcbi8vIH1cbi8vXG4vLyBjb25zdCB0b1JldmVyc2UgPSB7XG4vLyAgICAgIGxyOiBcInJsXCIgYXMgXCJybFwiLFxuLy8gICAgICBybDogXCJsclwiIGFzIFwibHJcIixcbi8vICAgICAgdGI6IFwiYnRcIiBhcyBcImJ0XCIsXG4vLyAgICAgIGJ0OiBcInRiXCIgYXMgXCJ0YlwiLFxuLy8gfVxuIiwiXG5pbXBvcnQgeyBkcmFnZ2FibGUsIERyYWdFdmVudCB9IGZyb20gXCIuL2RyYWdnYWJsZS5qc1wiXG5cbnR5cGUgRGlyZWN0aW9uID0gXCJsclwiIHwgXCJybFwiIHwgXCJidFwiIHwgXCJ0YlwiXG50eXBlIERPTUVsZW1lbnQgPSBIVE1MRWxlbWVudCB8IFNWR0VsZW1lbnRcblxuZXhwb3J0IGludGVyZmFjZSBTY29sbGFibGVDb25maWdcbntcbiAgICAgaGFuZGxlczogRE9NRWxlbWVudCBbXVxuICAgICBkaXJlY3Rpb246IERpcmVjdGlvblxufVxuXG5mdW5jdGlvbiBkZWZhdWx0Q29uZmlnICgpOiBTY29sbGFibGVDb25maWdcbntcbiAgICAgcmV0dXJuIHtcbiAgICAgICAgICBoYW5kbGVzICA6IFtdLFxuICAgICAgICAgIGRpcmVjdGlvbjogXCJ0YlwiXG4gICAgIH1cbn1cblxuZnVuY3Rpb24gc2Nyb2xsYWJsZU5hdGl2ZSAoIG9wdGlvbnM6IFNjb2xsYWJsZUNvbmZpZyApXG57XG4gICAgIGRlc2FjdGl2YXRlICgpXG5cbiAgICAgcmV0dXJuIHtcbiAgICAgICAgICBhY3RpdmF0ZSxcbiAgICAgICAgICBkZXNhY3RpdmF0ZSxcbiAgICAgfVxuXG4gICAgIGZ1bmN0aW9uIGFjdGl2YXRlICgpXG4gICAgIHtcbiAgICAgICAgICBjb25zdCBkaXIgPSBvcHRpb25zLmRpcmVjdGlvbiA9PSBcImJ0XCIgfHwgb3B0aW9ucy5kaXJlY3Rpb24gPT0gXCJ0YlwiXG4gICAgICAgICAgICAgICAgICAgID8gXCJwYW4teVwiIDogXCJwYW4teFwiXG5cbiAgICAgICAgICBmb3IgKCBjb25zdCBoIG9mIG9wdGlvbnMuaGFuZGxlcyApXG4gICAgICAgICAgICAgICBoLnN0eWxlLnRvdWNoQWN0aW9uID0gZGlyXG4gICAgIH1cblxuICAgICBmdW5jdGlvbiBkZXNhY3RpdmF0ZSAoKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgZGlyID0gb3B0aW9ucy5kaXJlY3Rpb24gPT0gXCJidFwiIHx8IG9wdGlvbnMuZGlyZWN0aW9uID09IFwidGJcIlxuICAgICAgICAgICAgICAgICAgICA/IFwicGFuLXlcIiA6IFwicGFuLXhcIlxuXG4gICAgICAgICAgZm9yICggY29uc3QgaCBvZiBvcHRpb25zLmhhbmRsZXMgKVxuICAgICAgICAgICAgICAgaC5zdHlsZS50b3VjaEFjdGlvbiA9IFwibm9uZVwiXG4gICAgIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNjb2xsYWJsZSAoIG9wdGlvbnM6IFNjb2xsYWJsZUNvbmZpZyApXG57XG4gICAgIGlmICggXCJvbnRvdWNoc3RhcnRcIiBpbiB3aW5kb3cgKVxuICAgICAgICAgIHJldHVybiBzY3JvbGxhYmxlTmF0aXZlICggb3B0aW9ucyApXG5cbiAgICAgY29uc3QgZHJhZyA9IGRyYWdnYWJsZSAoe1xuICAgICAgICAgIGhhbmRsZXMgICAgICAgOiBvcHRpb25zLmhhbmRsZXMsXG4gICAgICAgICAgdmVsb2NpdHlGYWN0b3I6IDEwMCxcbiAgICAgICAgICBvblN0YXJ0RHJhZyxcbiAgICAgICAgICBvbkRyYWcgICAgIDogb3B0aW9ucy5kaXJlY3Rpb24gPT0gXCJidFwiIHx8IG9wdGlvbnMuZGlyZWN0aW9uID09IFwidGJcIlxuICAgICAgICAgICAgICAgICAgICAgPyBvbkRyYWdWZXJ0aWNhbFxuICAgICAgICAgICAgICAgICAgICAgOiBvbkRyYWdIb3Jpem9udGFsLFxuICAgICAgICAgIG9uU3RvcERyYWc6IG9wdGlvbnMuZGlyZWN0aW9uID09IFwiYnRcIiB8fCBvcHRpb25zLmRpcmVjdGlvbiA9PSBcInRiXCJcbiAgICAgICAgICAgICAgICAgICAgPyBvblN0b3BEcmFnVmVydGljYWxcbiAgICAgICAgICAgICAgICAgICAgOiBvblN0b3BEcmFnSG9yaXpvbnRhbCxcbiAgICAgfSlcblxuICAgICByZXR1cm4ge1xuICAgICAgICAgIGFjdGl2YXRlOiAoKSA9PiB7IGRyYWcuYWN0aXZhdGUgKCkgfVxuICAgICB9XG5cbiAgICAgZnVuY3Rpb24gb25TdGFydERyYWcgKClcbiAgICAge1xuICAgICAgICAgIGZvciAoIGNvbnN0IGggb2Ygb3B0aW9ucy5oYW5kbGVzIClcbiAgICAgICAgICAgICAgIGguc3R5bGUuc2Nyb2xsQmVoYXZpb3IgPSBcInVuc2V0XCJcbiAgICAgfVxuICAgICBmdW5jdGlvbiBvbkRyYWdWZXJ0aWNhbCAoIGV2ZW50OiBEcmFnRXZlbnQgKVxuICAgICB7XG4gICAgICAgICAgZm9yICggY29uc3QgaCBvZiBvcHRpb25zLmhhbmRsZXMgKVxuICAgICAgICAgICAgICAgaC5zY3JvbGxCeSAoIDAsIGV2ZW50Lm9mZnNldFkgKVxuICAgICB9XG4gICAgIGZ1bmN0aW9uIG9uRHJhZ0hvcml6b250YWwgKCBldmVudDogRHJhZ0V2ZW50IClcbiAgICAge1xuICAgICAgICAgIGZvciAoIGNvbnN0IGggb2Ygb3B0aW9ucy5oYW5kbGVzIClcbiAgICAgICAgICAgICAgIGguc2Nyb2xsQnkgKCBldmVudC5vZmZzZXRYLCAwIClcbiAgICAgfVxuICAgICBmdW5jdGlvbiBvblN0b3BEcmFnVmVydGljYWwgKCBldmVudDogRHJhZ0V2ZW50IClcbiAgICAge1xuICAgICAgICAgIGZvciAoIGNvbnN0IGggb2Ygb3B0aW9ucy5oYW5kbGVzIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBoLnNjcm9sbEJ5ICggMCwgZXZlbnQub2Zmc2V0WSApXG4gICAgICAgICAgICAgICAvL2guc3R5bGUuc2Nyb2xsQmVoYXZpb3IgPSBcInNtb290aFwiXG4gICAgICAgICAgICAgICAvL2guc2Nyb2xsQnkgKCAwLCBldmVudC5vZmZzZXRZICsgZXZlbnQudmVsb2NpdHlZIClcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgfVxuICAgICBmdW5jdGlvbiBvblN0b3BEcmFnSG9yaXpvbnRhbCAoIGV2ZW50OiBEcmFnRXZlbnQgKVxuICAgICB7XG4gICAgICAgICAgZm9yICggY29uc3QgaCBvZiBvcHRpb25zLmhhbmRsZXMgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGguc2Nyb2xsQnkgKCBldmVudC5vZmZzZXRYLCAwIClcbiAgICAgICAgICAgICAgIC8vaC5zdHlsZS5zY3JvbGxCZWhhdmlvciA9IFwic21vb3RoXCJcbiAgICAgICAgICAgICAgIC8vaC5zY3JvbGxCeSAoIGV2ZW50Lm9mZnNldFggKyBldmVudC52ZWxvY2l0eVgsIDAgKVxuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICB9XG59XG4iLCJcbmltcG9ydCB7IENzcyB9IGZyb20gXCIuLi8uLi9MaWIvaW5kZXguanNcIlxuaW1wb3J0IHsgY3NzRmxvYXQgfSBmcm9tIFwiLi9kb20uanNcIlxuaW1wb3J0ICogYXMgVWkgZnJvbSBcIi4vZHJhZ2dhYmxlLmpzXCJcbmltcG9ydCB7IHhub2RlIH0gZnJvbSBcIi4veG5vZGUuanNcIlxuXG50eXBlIERpcmVjdGlvbiAgID0gXCJsclwiIHwgXCJybFwiIHwgXCJidFwiIHwgXCJ0YlwiXG50eXBlIE9yaWVudGF0aW9uID0gXCJ2ZXJ0aWNhbFwiIHwgXCJob3Jpem9udGFsXCJcbnR5cGUgVW5pdHMgICAgICAgPSBcInB4XCIgfCBcIiVcIlxudHlwZSBTd2lwZWFibGVQcm9wZXJ0eSA9IFwidG9wXCIgfCBcImxlZnRcIiB8IFwiYm90dG9tXCIgfCBcInJpZ2h0XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICB8IFwieFwiIHwgXCJ5XCJcblxudHlwZSBTd2lwZWFibGVPcHRpb25zID0gUGFydGlhbCA8U3dpcGVhYmxlQ29uZmlnPlxuXG50eXBlIFN3aXBlYWJsZUNvbmZpZyA9IHtcbiAgICAgaGFuZGxlcyAgIDogSlNYLkVsZW1lbnQgW11cbiAgICAgZGlyZWN0aW9uIDogRGlyZWN0aW9uLFxuICAgICBwb3JwZXJ0eT8gOiBTd2lwZWFibGVQcm9wZXJ0eVxuICAgICBtaW5WYWx1ZSAgOiBudW1iZXIsXG4gICAgIG1heFZhbHVlICA6IG51bWJlcixcbiAgICAgdW5pdHMgICAgIDogVW5pdHMsXG4gICAgIG1vdXNlV2hlZWw6IGJvb2xlYW5cbn1cblxuZXhwb3J0IHR5cGUgU3dpcGVhYmxlRWxlbWVudCA9IFJldHVyblR5cGUgPHR5cGVvZiBzd2lwZWFibGU+XG5cbmZ1bmN0aW9uIGRlZmF1bHRDb25maWcgKCk6IFN3aXBlYWJsZUNvbmZpZ1xue1xuICAgICByZXR1cm4ge1xuICAgICAgICAgIGhhbmRsZXMgICA6IFtdLFxuICAgICAgICAgIGRpcmVjdGlvbiA6IFwibHJcIixcbiAgICAgICAgICBwb3JwZXJ0eSAgOiBcImxlZnRcIixcbiAgICAgICAgICBtaW5WYWx1ZSAgOiAtMTAwLFxuICAgICAgICAgIG1heFZhbHVlICA6IDAsXG4gICAgICAgICAgdW5pdHMgICAgIDogXCIlXCIsXG4gICAgICAgICAgbW91c2VXaGVlbDogdHJ1ZSxcbiAgICAgfVxufVxuXG52YXIgc3RhcnRfcG9zaXRpb24gPSAwXG52YXIgaXNfdmVydGljYWwgICAgPSBmYWxzZVxudmFyIHByb3AgOiBTd2lwZWFibGVQcm9wZXJ0eVxuXG5leHBvcnQgZnVuY3Rpb24gc3dpcGVhYmxlICggZWxlbWVudDogSlNYLkVsZW1lbnQsIG9wdGlvbnM6IFN3aXBlYWJsZU9wdGlvbnMgKVxue1xuICAgICBjb25zdCBjb25maWcgPSBkZWZhdWx0Q29uZmlnICgpXG5cbiAgICAgY29uc3QgZHJhZ2dhYmxlID0gVWkuZHJhZ2dhYmxlICh7XG4gICAgICAgICAgaGFuZGxlczogW10sXG4gICAgICAgICAgb25TdGFydERyYWcsXG4gICAgICAgICAgb25TdG9wRHJhZyxcbiAgICAgfSlcblxuICAgICBlbGVtZW50LmNsYXNzTGlzdC5hZGQgKCBcInN3aXBlYWJsZVwiIClcblxuICAgICB1cGRhdGVDb25maWcgKCBvcHRpb25zIClcblxuICAgICBmdW5jdGlvbiB1cGRhdGVDb25maWcgKCBvcHRpb25zOiBTd2lwZWFibGVPcHRpb25zIClcbiAgICAge1xuICAgICAgICAgIE9iamVjdC5hc3NpZ24gKCBjb25maWcsIG9wdGlvbnMgKVxuXG4gICAgICAgICAgaXNfdmVydGljYWwgPSBjb25maWcuZGlyZWN0aW9uID09IFwiYnRcIiB8fCBjb25maWcuZGlyZWN0aW9uID09IFwidGJcIlxuXG4gICAgICAgICAgaWYgKCBvcHRpb25zLnBvcnBlcnR5ID09IHVuZGVmaW5lZCApXG4gICAgICAgICAgICAgICBjb25maWcucG9ycGVydHkgPSBpc192ZXJ0aWNhbCA/IFwidG9wXCIgOiBcImxlZnRcIlxuXG4gICAgICAgICAgLy8gc3dpdGNoICggY29uZmlnLnBvcnBlcnR5IClcbiAgICAgICAgICAvLyB7XG4gICAgICAgICAgLy8gY2FzZSBcInRvcFwiOiBjYXNlIFwiYm90dG9tXCI6IGNhc2UgXCJ5XCI6IGlzX3ZlcnRpY2FsID0gdHJ1ZSAgOyBicmVha1xuICAgICAgICAgIC8vIGNhc2UgXCJsZWZ0XCI6IGNhc2UgXCJyaWdodFwiOiBjYXNlIFwieFwiOiBpc192ZXJ0aWNhbCA9IGZhbHNlIDsgYnJlYWtcbiAgICAgICAgICAvLyBkZWZhdWx0OiBkZWJ1Z2dlciA7IHJldHVyblxuICAgICAgICAgIC8vIH1cblxuICAgICAgICAgIGRyYWdnYWJsZS51cGRhdGVDb25maWcgKHtcbiAgICAgICAgICAgICAgIGhhbmRsZXM6IGNvbmZpZy5oYW5kbGVzLFxuICAgICAgICAgICAgICAgb25EcmFnOiBpc192ZXJ0aWNhbCA/IG9uRHJhZ1ZlcnRpY2FsIDogb25EcmFnSG9yaXpvbnRhbFxuICAgICAgICAgIH0pXG5cbiAgICAgICAgICBwcm9wID0gY29uZmlnLnBvcnBlcnR5XG5cbiAgICAgICAgICBpZiAoIGRyYWdnYWJsZS5pc0FjdGl2ZSAoKSApXG4gICAgICAgICAgICAgICBhY3RpdmVFdmVudHMgKClcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICBkZXNhY3RpdmVFdmVudHMgKClcbiAgICAgfVxuXG4gICAgIGZ1bmN0aW9uIHBvc2l0aW9uICgpXG4gICAgIHtcbiAgICAgICAgICByZXR1cm4gY3NzRmxvYXQgKCBlbGVtZW50LCBwcm9wIClcbiAgICAgfVxuXG4gICAgIGZ1bmN0aW9uIGFjdGl2YXRlICgpXG4gICAgIHtcbiAgICAgICAgICBkcmFnZ2FibGUuYWN0aXZhdGUgKClcbiAgICAgICAgICBhY3RpdmVFdmVudHMgKClcbiAgICAgfVxuICAgICBmdW5jdGlvbiBkZXNhY3RpdmF0ZSAoKVxuICAgICB7XG4gICAgICAgICAgZHJhZ2dhYmxlLmRlc2FjdGl2YXRlICgpXG4gICAgICAgICAgZGVzYWN0aXZlRXZlbnRzICgpXG4gICAgIH1cblxuICAgICBmdW5jdGlvbiBzd2lwZSAoIG9mZnNldDogc3RyaW5nICk6IHZvaWRcbiAgICAgZnVuY3Rpb24gc3dpcGUgKCBvZmZzZXQ6IG51bWJlciwgdW5pdHM6IFVuaXRzICk6IHZvaWRcbiAgICAgZnVuY3Rpb24gc3dpcGUgKCBvZmZzZXQ6IHN0cmluZ3xudW1iZXIsIHU/OiBVbml0cyApXG4gICAgIHtcbiAgICAgICAgICBpZiAoIHR5cGVvZiBvZmZzZXQgPT0gXCJzdHJpbmdcIiApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgdSA9IENzcy5nZXRVbml0ICggb2Zmc2V0ICkgYXMgVW5pdHNcbiAgICAgICAgICAgICAgIG9mZnNldCA9IHBhcnNlRmxvYXQgKCBvZmZzZXQgKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICggISBbXCJweFwiLCBcIiVcIl0uaW5jbHVkZXMgKCB1ICkgKVxuICAgICAgICAgICAgICAgdSA9IFwicHhcIlxuXG4gICAgICAgICAgaWYgKCB1ICE9IGNvbmZpZy51bml0cyApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgaWYgKCAodSA9IGNvbmZpZy51bml0cykgPT0gXCIlXCIgKVxuICAgICAgICAgICAgICAgICAgICBvZmZzZXQgPSB0b1BlcmNlbnRzICggb2Zmc2V0IClcbiAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgb2Zmc2V0ID0gdG9QaXhlbHMgKCBvZmZzZXQgKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGVsZW1lbnQuc3R5bGUgW3Byb3BdID0gY2xhbXAgKCBvZmZzZXQgKSArIHVcbiAgICAgfVxuXG4gICAgIHJldHVybiB7XG4gICAgICAgICAgdXBkYXRlQ29uZmlnLFxuICAgICAgICAgIGFjdGl2YXRlLFxuICAgICAgICAgIGRlc2FjdGl2YXRlLFxuICAgICAgICAgIHBvc2l0aW9uLFxuICAgICAgICAgIHN3aXBlLFxuICAgICB9XG5cbiAgICAgZnVuY3Rpb24gYWN0aXZlRXZlbnRzICgpXG4gICAgIHtcbiAgICAgICAgICBpZiAoIGNvbmZpZy5tb3VzZVdoZWVsIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBmb3IgKCBjb25zdCBoIG9mIGNvbmZpZy5oYW5kbGVzIClcbiAgICAgICAgICAgICAgICAgICAgaC5hZGRFdmVudExpc3RlbmVyICggXCJ3aGVlbFwiLCBvbldoZWVsLCB7IHBhc3NpdmU6IHRydWUgfSApXG4gICAgICAgICAgfVxuICAgICB9XG4gICAgIGZ1bmN0aW9uIGRlc2FjdGl2ZUV2ZW50cyAoKVxuICAgICB7XG4gICAgICAgICAgZm9yICggY29uc3QgaCBvZiBjb25maWcuaGFuZGxlcyApXG4gICAgICAgICAgICAgICBoLnJlbW92ZUV2ZW50TGlzdGVuZXIgKCBcIndoZWVsXCIsIG9uV2hlZWwgKVxuICAgICB9XG5cbiAgICAgZnVuY3Rpb24gdG9QaXhlbHMgKCBwZXJjZW50YWdlOiBudW1iZXIgKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgeyBtaW5WYWx1ZTogbWluLCBtYXhWYWx1ZTogbWF4IH0gPSBjb25maWdcblxuICAgICAgICAgIGlmICggcGVyY2VudGFnZSA8IDEwMCApXG4gICAgICAgICAgICAgICBwZXJjZW50YWdlID0gMTAwICsgcGVyY2VudGFnZVxuXG4gICAgICAgICAgcmV0dXJuIG1pbiArIChtYXggLSBtaW4pICogcGVyY2VudGFnZSAvIDEwMFxuICAgICB9XG4gICAgIGZ1bmN0aW9uIHRvUGVyY2VudHMgKCBwaXhlbHM6IG51bWJlciApXG4gICAgIHtcbiAgICAgICAgICBjb25zdCB7IG1pblZhbHVlOiBtaW4sIG1heFZhbHVlOiBtYXggfSA9IGNvbmZpZ1xuICAgICAgICAgIHJldHVybiBNYXRoLmFicyAoIChwaXhlbHMgLSBtaW4pIC8gKG1heCAtIG1pbikgKiAxMDAgKVxuICAgICB9XG5cbiAgICAgZnVuY3Rpb24gb25TdGFydERyYWcgKClcbiAgICAge1xuICAgICAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZSAoIFwiYW5pbWF0ZVwiIClcbiAgICAgICAgICBzdGFydF9wb3NpdGlvbiA9IHBvc2l0aW9uICgpXG4gICAgIH1cbiAgICAgZnVuY3Rpb24gb25EcmFnVmVydGljYWwgKCBldmVudDogVWkuRHJhZ0V2ZW50IClcbiAgICAge1xuICAgICAgICAgIGVsZW1lbnQuc3R5bGUgW3Byb3BdID0gY2xhbXAgKCBzdGFydF9wb3NpdGlvbiArIGV2ZW50LnkgKSArIGNvbmZpZy51bml0c1xuICAgICB9XG4gICAgIGZ1bmN0aW9uIG9uRHJhZ0hvcml6b250YWwgKCBldmVudDogVWkuRHJhZ0V2ZW50IClcbiAgICAge1xuICAgICAgICAgIGVsZW1lbnQuc3R5bGUgW3Byb3BdID0gY2xhbXAgKCBzdGFydF9wb3NpdGlvbiArIGV2ZW50LnggKSArIGNvbmZpZy51bml0c1xuICAgICB9XG4gICAgIGZ1bmN0aW9uIG9uU3RvcERyYWcgKCBldmVudDogVWkuRHJhZ0V2ZW50IClcbiAgICAge1xuICAgICAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LmFkZCAoIFwiYW5pbWF0ZVwiIClcblxuICAgICAgICAgIGNvbnN0IG9mZnNldCA9IGlzX3ZlcnRpY2FsXG4gICAgICAgICAgICAgICAgICAgICAgICAgPyBldmVudC55IC8vKyBldmVudC52ZWxvY2l0eVlcbiAgICAgICAgICAgICAgICAgICAgICAgICA6IGV2ZW50LnggLy8rIGV2ZW50LnZlbG9jaXR5WFxuXG4gICAgICAgICAgZWxlbWVudC5zdHlsZSBbcHJvcF0gPSBjbGFtcCAoIHN0YXJ0X3Bvc2l0aW9uICsgb2Zmc2V0ICkgKyBjb25maWcudW5pdHNcbiAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICB9XG4gICAgIGZ1bmN0aW9uIG9uV2hlZWwgKCBldmVudDogV2hlZWxFdmVudCApXG4gICAgIHtcbiAgICAgICAgICBpZiAoIGV2ZW50LmRlbHRhTW9kZSAhPSBXaGVlbEV2ZW50LkRPTV9ERUxUQV9QSVhFTCApXG4gICAgICAgICAgICAgICByZXR1cm5cblxuICAgICAgICAgIGlmICggaXNfdmVydGljYWwgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHZhciBkZWx0YSA9IGV2ZW50LmRlbHRhWVxuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgdmFyIGRlbHRhID0gZXZlbnQuZGVsdGFYXG5cbiAgICAgICAgICAgICAgIGlmICggZGVsdGEgPT0gMCApXG4gICAgICAgICAgICAgICAgICAgIGRlbHRhID0gZXZlbnQuZGVsdGFZXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgZWxlbWVudC5zdHlsZSBbcHJvcF0gPSBjbGFtcCAoIHBvc2l0aW9uICgpICsgZGVsdGEgKSArIGNvbmZpZy51bml0c1xuICAgICB9XG4gICAgIGZ1bmN0aW9uIGNsYW1wICggdmFsdWU6IG51bWJlciApXG4gICAgIHtcbiAgICAgICAgICByZXR1cm4gdmFsdWUgPCBjb25maWcubWluVmFsdWUgPyBjb25maWcubWluVmFsdWVcbiAgICAgICAgICAgICAgIDogdmFsdWUgPiBjb25maWcubWF4VmFsdWUgPyBjb25maWcubWF4VmFsdWVcbiAgICAgICAgICAgICAgIDogdmFsdWVcbiAgICAgfVxufVxuIiwiXG5pbXBvcnQgeyBDb250YWluZXIgfSBmcm9tIFwiLi9jb250YWluZXJcIlxuaW1wb3J0IHsgQ29tcG9uZW50IH0gZnJvbSBcIi4vY29tcG9uZW50XCJcbmltcG9ydCB7IHhub2RlIH0gZnJvbSBcIi4uL0Jhc2UveG5vZGVcIlxuaW1wb3J0IHsgZXhwYW5kYWJsZSwgRXhwZW5kYWJsZUVsZW1lbnQgfSBmcm9tIFwiLi4vQmFzZS9leHBlbmRhYmxlXCJcbmltcG9ydCB7IGRlZmluZSB9IGZyb20gXCIuLi9kYlwiXG5pbXBvcnQgeyBzY29sbGFibGUgfSBmcm9tIFwiLi4vQmFzZS9zY3JvbGxhYmxlXCJcbmltcG9ydCB7IHN3aXBlYWJsZSwgU3dpcGVhYmxlRWxlbWVudCB9IGZyb20gXCIuLi9CYXNlL3N3aXBlYWJsZVwiXG5pbXBvcnQgeyBUb29sYmFyIH0gZnJvbSBcIi4vdG9vbGJhclwiXG5cblxuXG5kZWNsYXJlIGdsb2JhbFxue1xuICAgICBpbnRlcmZhY2UgJFNpZGVNZW51IGV4dGVuZHMgJENvbnRhaW5lclxuICAgICB7XG4gICAgICAgICAgdHlwZTogXCJzaWRlLW1lbnVcIlxuICAgICAgICAgIGhhc01haW5CdXR0b246IGJvb2xlYW4sXG4gICAgICAgICAgYnV0dG9ucyA/IDogJEJ1dHRvbiBbXVxuICAgICAgICAgIGNoaWxkcmVuPyAgICA6ICRQYW5lbCBbXVxuXG4gICAgICAgICAgLy8gaGVhZGVyPyAgICAgIDogJEFueUNvbXBvbmVudHNcbiAgICAgICAgICAvLyBmb290ZXI/ICAgICAgOiAkQW55Q29tcG9uZW50c1xuICAgICB9XG5cbiAgICAgaW50ZXJmYWNlICRTbGlkZXNob3cgZXh0ZW5kcyAkQ29udGFpbmVyXG4gICAgIHtcbiAgICAgICAgICB0eXBlICAgICAgICA6IFwic2xpZGVzaG93XCJcbiAgICAgICAgICBjaGlsZHJlbiAgICA6ICRBbnlDb21wb25lbnRzIFtdXG4gICAgICAgICAgaXNTd2lwZWFibGU/OiBib29sZWFuXG4gICAgIH1cblxuICAgICBpbnRlcmZhY2UgJFNsaWRlIGV4dGVuZHMgJENvbnRhaW5lclxuICAgICB7XG4gICAgICAgICAgdHlwZTogXCJzbGlkZVwiXG4gICAgIH1cbn1cblxudHlwZSBEaXJlY3Rpb24gPSBcImxyXCIgfCBcInJsXCIgfCBcInRiXCIgfCBcImJ0XCJcblxuXG52YXIgbGVmdF9tZW51ICAgPSBudWxsIGFzIFNpZGVNZW51XG52YXIgcmlnaHRfbWVudSAgPSBudWxsIGFzIFNpZGVNZW51XG52YXIgdG9wX21lbnUgICAgPSBudWxsIGFzIFNpZGVNZW51XG52YXIgYm90dG9tX21lbnUgPSBudWxsIGFzIFNpZGVNZW51XG5cbmNvbnN0IHRvUG9zaXRpb24gPSB7XG4gICAgIGxyIDogXCJsZWZ0XCIsXG4gICAgIHJsIDogXCJyaWdodFwiLFxuICAgICB0YiA6IFwidG9wXCIsXG4gICAgIGJ0IDogXCJib3R0b21cIixcbn1cblxuXG5leHBvcnQgY2xhc3MgU2lkZU1lbnUgZXh0ZW5kcyBDb250YWluZXIgPCRTaWRlTWVudT5cbntcbiAgICAgc3RhdGljIGF0TGVmdDogU2lkZU1lbnVcbiAgICAgc3RhdGljIGF0UmlnaHQ6IFNpZGVNZW51XG4gICAgIHN0YXRpYyBhdFRvcDogU2lkZU1lbnVcbiAgICAgc3RhdGljIGF0Qm90dG9tOiBTaWRlTWVudVxuXG4gICAgIG1haW5fYnV0dG9uOiBKU1guRWxlbWVudFxuICAgICBleHBhbmRhYmxlIDogRXhwZW5kYWJsZUVsZW1lbnRcbiAgICAgc2xpZGVzaG93ICA6IFNsaWRlc2hvd1xuICAgICB0b29sYmFyICAgICA6IENvbnRhaW5lclxuXG4gICAgIC8qKiBAb3ZlcnJpZGUgKi9cbiAgICAgZ2V0SHRtbCAoKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgZGF0YSA9IHRoaXMuZGF0YVxuICAgICAgICAgIGNvbnN0IGhlYWRlciAgICA9IDxkaXYgY2xhc3M9XCJzaWRlLW1lbnUtaGVhZGVyXCIgLz5cbiAgICAgICAgICBjb25zdCBjb250ZW50ICAgPSA8ZGl2IGNsYXNzPVwic2lkZS1tZW51LWNvbnRlbnRcIiAvPlxuICAgICAgICAgIGNvbnN0IGNvbnRhaW5lciA9IDxkaXYgY2xhc3M9XCJzaWRlLW1lbnUgY2xvc2VcIj5cbiAgICAgICAgICAgICAgIHsgaGVhZGVyIH1cbiAgICAgICAgICAgICAgIHsgY29udGVudCB9XG4gICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICB0aGlzLnRvb2xiYXIgPSBuZXcgVG9vbGJhciAoe1xuICAgICAgICAgICAgICAgY29udGV4dCAgOiBDT05URVhUX1VJLFxuICAgICAgICAgICAgICAgdHlwZSAgICAgOiBcInRvb2xiYXJcIixcbiAgICAgICAgICAgICAgIGlkICAgICAgIDogZGF0YS5pZCArIFwiLXRvb2xiYXJcIixcbiAgICAgICAgICAgICAgIGRpcmVjdGlvbjogZGF0YS5kaXJlY3Rpb24gPT0gXCJsclwiIHx8IGRhdGEuZGlyZWN0aW9uID09IFwicmxcIiA/IFwidGJcIiA6IFwibHJcIixcbiAgICAgICAgICAgICAgIHRpdGxlICAgIDogbnVsbCxcbiAgICAgICAgICAgICAgIGJ1dHRvbnMgIDogZGF0YS5idXR0b25zLFxuICAgICAgICAgICAgICAgY2hpbGRyZW4gOiBudWxsLFxuICAgICAgICAgICAgICAgLy9jaGlsZHJlbjogZGF0YS5jaGlsZHJlbixcbiAgICAgICAgICB9KVxuICAgICAgICAgIGhlYWRlci5hcHBlbmQgKCAuLi4gdGhpcy50b29sYmFyLmdldEh0bWwgKCkgKVxuXG4gICAgICAgICAgLy8gZGF0YS5hZGRpdGlvbmFsQnV0dG9uc1xuICAgICAgICAgIC8vIGlmICggZGF0YS5idXR0b25zIClcbiAgICAgICAgICAvLyB7XG4gICAgICAgICAgLy8gICAgICBmb3IgKCBjb25zdCBjaGlsZCBvZiBkYXRhLmJ1dHRvbnMgKVxuICAgICAgICAgIC8vICAgICAgICAgICB0aGlzLmhlYWRlci5hcHBlbmQgKCBjaGlsZCApXG4gICAgICAgICAgLy8gfVxuXG4gICAgICAgICAgaWYgKCBkYXRhLmhhc01haW5CdXR0b24gKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNvbnN0IGJ0biA9IDxzcGFuIGNsYXNzPVwic2lkZS1tZW51LW1haW4tYnV0dG9uXCI+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwiaWNvblwiPuKHlTwvc3Bhbj5cbiAgICAgICAgICAgICAgIDwvc3Bhbj5cblxuICAgICAgICAgICAgICAgdGhpcy5tYWluX2J1dHRvbiA9IGJ0blxuICAgICAgICAgICAgICAgaGVhZGVyLmluc2VydEFkamFjZW50RWxlbWVudCAoIFwiYWZ0ZXJiZWdpblwiLCBidG4gKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHRoaXMuc2xpZGVzaG93ID0gbmV3IFNsaWRlc2hvdyAoe1xuICAgICAgICAgICAgICAgY29udGV4dCAgICA6IENPTlRFWFRfVUksXG4gICAgICAgICAgICAgICB0eXBlICAgICAgIDogXCJzbGlkZXNob3dcIixcbiAgICAgICAgICAgICAgIGlkICAgICAgICAgOiBkYXRhLmlkICsgXCItc2xpZGVzaG93XCIsXG4gICAgICAgICAgICAgICBkaXJlY3Rpb24gIDogZGF0YS5kaXJlY3Rpb24sXG4gICAgICAgICAgICAgICBpc1N3aXBlYWJsZTogZmFsc2UsXG4gICAgICAgICAgICAgICBjaGlsZHJlbiAgIDogW11cbiAgICAgICAgICB9KVxuICAgICAgICAgIGNvbnRlbnQuYXBwZW5kICggLi4uIHRoaXMuc2xpZGVzaG93LmdldEh0bWwgKCkgIClcblxuICAgICAgICAgIGlmICggZGF0YS5jaGlsZHJlbiApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgZm9yICggY29uc3QgY2hpbGQgb2YgZGF0YS5jaGlsZHJlbiApXG4gICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2xpZGVzaG93LmFwcGVuZCAoIGNoaWxkIClcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBjaGlsZC5idXR0b24gKVxuICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudG9vbGJhci5hcHBlbmQgKCBjaGlsZC5idXR0b24gKVxuICAgICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbnRhaW5lci5jbGFzc0xpc3QuYWRkICggdG9Qb3NpdGlvbiBbZGF0YS5kaXJlY3Rpb25dIClcbiAgICAgICAgICBzY29sbGFibGUgKHsgaGFuZGxlczogW2NvbnRlbnRdLCBkaXJlY3Rpb246IFwiYnRcIiB9KS5hY3RpdmF0ZSAoKVxuXG4gICAgICAgICAgdGhpcy5jb250YWluZXIgID0gY29udGFpbmVyXG4gICAgICAgICAgdGhpcy5leHBhbmRhYmxlID0gZXhwYW5kYWJsZSAoIHRoaXMuY29udGFpbmVyLCB7XG4gICAgICAgICAgICAgICBkaXJlY3Rpb24gICAgOiBkYXRhLmRpcmVjdGlvbixcbiAgICAgICAgICAgICAgIG5lYXIgICAgICAgICA6IDYwLFxuICAgICAgICAgICAgICAgaGFuZGxlcyAgICAgIDogQXJyYXkub2YgKCB0aGlzLm1haW5fYnV0dG9uICksXG4gICAgICAgICAgICAgICBvbkFmdGVyT3BlbiAgOiAoKSA9PiBjb250ZW50LmNsYXNzTGlzdC5yZW1vdmUgKCBcImhpZGRlblwiICksXG4gICAgICAgICAgICAgICBvbkJlZm9yZUNsb3NlOiAoKSA9PiBjb250ZW50LmNsYXNzTGlzdC5hZGQgKCBcImhpZGRlblwiIClcbiAgICAgICAgICB9KVxuICAgICAgICAgIHRoaXMuZXhwYW5kYWJsZS5hY3RpdmF0ZSAoKVxuXG4gICAgICAgICAgcmV0dXJuIFsgdGhpcy5jb250YWluZXIgXSBhcyBIVE1MRWxlbWVudCBbXVxuICAgICB9XG5cbiAgICAgLyoqIEBvdmVycmlkZSAqL1xuICAgICBhcHBlbmQgKCAuLi4gZWxlbWVudHM6IChzdHJpbmcgfCBFbGVtZW50IHwgQ29tcG9uZW50IHwgJEFueUNvbXBvbmVudHMpIFtdIClcbiAgICAge1xuICAgICAgICAgIHRoaXMuc2xpZGVzaG93LmFwcGVuZCAoIC4uLiBlbGVtZW50cyApXG4gICAgIH1cblxuICAgICAvKiogQG92ZXJyaWRlICovXG4gICAgIHJlbW92ZSAoIC4uLiBlbGVtZW50czogQ29tcG9uZW50IFtdIClcbiAgICAge1xuICAgICAgICAgIHRoaXMuc2xpZGVzaG93LnJlbW92ZSAoIC4uLiBlbGVtZW50cyApXG4gICAgIH1cblxuICAgICBvcGVuICgpXG4gICAgIHtcblxuICAgICB9XG5cbiAgICAgY2xvc2UgKClcbiAgICAge1xuICAgICAgICAgIHRoaXMuZXhwYW5kYWJsZS5jbG9zZSAoKVxuXG4gICAgICAgICAgcmV0dXJuIHRoaXNcbiAgICAgfVxufVxuXG5cbmV4cG9ydCBjbGFzcyBTbGlkZXNob3cgZXh0ZW5kcyBDb250YWluZXIgPCRTbGlkZXNob3c+XG57XG4gICAgIGNoaWxkcmVuID0ge30gYXMgUmVjb3JkIDxzdHJpbmcsIENvbnRhaW5lcj5cbiAgICAgY3VycmVudDogQ29tcG9uZW50XG4gICAgIHByaXZhdGUgc3dpcGVhYmxlOiBTd2lwZWFibGVFbGVtZW50XG5cbiAgICAgLyoqIEBvdmVycmlkZSAqL1xuICAgICBnZXRIdG1sICgpXG4gICAgIHtcbiAgICAgICAgICBjb25zdCBlbGVtZW50cyA9IHN1cGVyLmdldEh0bWwgKClcblxuICAgICAgICAgIGNvbnN0IGRhdGEgPSB0aGlzLmRhdGFcbiAgICAgICAgICBjb25zdCBjb250YWluZXIgPSB0aGlzLmNvbnRhaW5lclxuXG4gICAgICAgICAgaWYgKCBkYXRhLmlzU3dpcGVhYmxlIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICB0aGlzLnN3aXBlYWJsZSA9IHN3aXBlYWJsZSAoIGNvbnRhaW5lciwge1xuICAgICAgICAgICAgICAgICAgICBoYW5kbGVzICAgOiBbIGNvbnRhaW5lciBdLFxuICAgICAgICAgICAgICAgICAgICBtaW5WYWx1ZSAgOiAtMCxcbiAgICAgICAgICAgICAgICAgICAgbWF4VmFsdWUgIDogMCxcbiAgICAgICAgICAgICAgICAgICAgcG9ycGVydHkgIDogZGF0YS5kaXJlY3Rpb24gPT0gXCJidFwiIHx8IGRhdGEuZGlyZWN0aW9uID09IFwidGJcIiA/IFwidG9wXCI6IFwibGVmdFwiLFxuICAgICAgICAgICAgICAgICAgICB1bml0cyAgICAgOiBcInB4XCIsXG4gICAgICAgICAgICAgICAgICAgIG1vdXNlV2hlZWw6IHRydWUsXG4gICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgdGhpcy5zd2lwZWFibGUuYWN0aXZhdGUgKClcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gZWxlbWVudHNcbiAgICAgfVxufVxuXG5cbmRlZmluZSAoIFNpZGVNZW51LCBbQ09OVEVYVF9VSSwgXCJzaWRlLW1lbnVcIl0gKVxuZGVmaW5lICggU2xpZGVzaG93LCBbQ09OVEVYVF9VSSwgXCJzbGlkZXNob3dcIl0gKVxuZGVmaW5lICggQ29udGFpbmVyLCBbQ09OVEVYVF9VSSwgXCJzbGlkZVwiXSAgICAgKVxuIiwiXG5pbXBvcnQgeyB4bm9kZSB9IGZyb20gXCIuL3hub2RlXCJcblxuZXhwb3J0IHR5cGUgU2hhcGVOYW1lcyA9IGtleW9mIFNoYXBlRGVmaW5pdGlvbnNcblxuZXhwb3J0IGludGVyZmFjZSBTaGFwZURlZmluaXRpb25zXG57XG4gICAgIGNpcmNsZSAgIDogT2JqZWN0RGVmaW5pdGlvbixcbiAgICAgdHJpYW5nbGUgOiBPYmplY3REZWZpbml0aW9uLFxuICAgICBzcXVhcmUgICA6IE9iamVjdERlZmluaXRpb24sXG4gICAgIHBhbnRhZ29uIDogT2JqZWN0RGVmaW5pdGlvbixcbiAgICAgaGV4YWdvbiAgOiBPYmplY3REZWZpbml0aW9uLFxuICAgICB0ZXh0ICAgICA6IFRleHREZWZpbml0aW9uLFxuICAgICB0ZXh0Ym94ICA6IFRleHREZWZpbml0aW9uLFxuICAgICBwYXRoICAgICA6IFBhdGhEZWZpbml0aW9uLFxufVxuXG5leHBvcnQgaW50ZXJmYWNlIE9iamVjdERlZmluaXRpb25cbntcbiAgICAgc2l6ZTogbnVtYmVyLFxuICAgICB4PyAgOiBudW1iZXIsXG4gICAgIHk/ICA6IG51bWJlclxufVxuXG5leHBvcnQgaW50ZXJmYWNlIFRleHREZWZpbml0aW9uIGV4dGVuZHMgT2JqZWN0RGVmaW5pdGlvblxue1xuICAgICB0ZXh0OiBzdHJpbmdcbn1cblxuZXhwb3J0IGludGVyZmFjZSBQYXRoRGVmaW5pdGlvbiBleHRlbmRzIE9iamVjdERlZmluaXRpb25cbntcbiAgICAgcGF0aDogc3RyaW5nXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVTdmdTaGFwZSA8VCBleHRlbmRzIFNoYXBlTmFtZXM+IChcbiAgICAgdHlwZTogVCxcbiAgICAgZGVmIDogU2hhcGVEZWZpbml0aW9ucyBbVF0sXG4pOiBSZXR1cm5UeXBlIDx0eXBlb2YgU3ZnRmFjdG9yeSBbVF0+XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVTdmdTaGFwZSAoIHR5cGU6IFNoYXBlTmFtZXMsIGRlZjogYW55IClcbntcbiAgICAgc3dpdGNoICggdHlwZSApXG4gICAgIHtcbiAgICAgY2FzZSBcImNpcmNsZVwiICA6IHJldHVybiBTdmdGYWN0b3J5LmNpcmNsZSAgICggZGVmIClcbiAgICAgY2FzZSBcInRyaWFuZ2xlXCI6IHJldHVybiBTdmdGYWN0b3J5LnRyaWFuZ2xlICggZGVmIClcbiAgICAgY2FzZSBcInNxdWFyZVwiICA6IHJldHVybiBTdmdGYWN0b3J5LnNxdWFyZSAgICggZGVmIClcbiAgICAgY2FzZSBcInBhbnRhZ29uXCI6IHJldHVybiBTdmdGYWN0b3J5LnBhbnRhZ29uICggZGVmIClcbiAgICAgY2FzZSBcImhleGFnb25cIiA6IHJldHVybiBTdmdGYWN0b3J5LmhleGFnb24gICggZGVmIClcbiAgICAgY2FzZSBcInNxdWFyZVwiICA6IHJldHVybiBTdmdGYWN0b3J5LnNxdWFyZSAgICggZGVmIClcbiAgICAgY2FzZSBcInRleHRcIiAgICA6IHJldHVybiBTdmdGYWN0b3J5LnRleHQgICAgICggZGVmIClcbiAgICAgY2FzZSBcInRleHRib3hcIiA6IHJldHVybiBTdmdGYWN0b3J5LnRleHRib3ggICggZGVmIClcbiAgICAgY2FzZSBcInBhdGhcIiAgICA6IHJldHVybiBTdmdGYWN0b3J5LnBhdGggICAgICggZGVmIClcbiAgICAgfVxufVxuXG5jbGFzcyBTdmdGYWN0b3J5XG57XG4gICAgIC8vIFRvIGdldCB0cmlhbmdsZSwgc3F1YXJlLCBbcGFudGF8aGV4YV1nb24gcG9pbnRzXG4gICAgIC8vXG4gICAgIC8vIHZhciBhID0gTWF0aC5QSSoyLzRcbiAgICAgLy8gZm9yICggdmFyIGkgPSAwIDsgaSAhPSA0IDsgaSsrIClcbiAgICAgLy8gICAgIGNvbnNvbGUubG9nICggYFsgJHsgTWF0aC5zaW4oYSppKSB9LCAkeyBNYXRoLmNvcyhhKmkpIH0gXWAgKVxuXG4gICAgIHN0YXRpYyBjaXJjbGUgKCBkZWY6IE9iamVjdERlZmluaXRpb24gKVxuICAgICB7XG4gICAgICAgICAgY29uc3Qgbm9kZSA9IDxjaXJjbGVcbiAgICAgICAgICAgICAgIGN4ID0geyBkZWYueCB8fCAwIH1cbiAgICAgICAgICAgICAgIGN5ID0geyBkZWYueSB8fCAwIH1cbiAgICAgICAgICAgICAgIHIgID0geyBkZWYuc2l6ZSAvIDIgfVxuICAgICAgICAgIC8+XG5cbiAgICAgICAgICByZXR1cm4gbm9kZVxuICAgICB9XG5cbiAgICAgc3RhdGljIHRyaWFuZ2xlICggZGVmOiBPYmplY3REZWZpbml0aW9uIClcbiAgICAge1xuICAgICB9XG5cblxuICAgICBzdGF0aWMgc3F1YXJlICggZGVmOiBPYmplY3REZWZpbml0aW9uIClcbiAgICAge1xuICAgICB9XG5cbiAgICAgc3RhdGljIHBhbnRhZ29uICggZGVmOiBPYmplY3REZWZpbml0aW9uIClcbiAgICAge1xuICAgICB9XG5cbiAgICAgc3RhdGljIGhleGFnb24gKCBkZWY6IE9iamVjdERlZmluaXRpb24gKVxuICAgICB7XG4gICAgIH1cblxuXG4gICAgIHN0YXRpYyB0ZXh0ICggZGVmOiBUZXh0RGVmaW5pdGlvbiApXG4gICAgIHtcbiAgICAgfVxuXG4gICAgIHN0YXRpYyB0ZXh0Ym94ICggZGVmOiBUZXh0RGVmaW5pdGlvbiApXG4gICAgIHtcbiAgICAgfVxuXG5cbiAgICAgc3RhdGljIHBhdGggKCBkZWY6IFBhdGhEZWZpbml0aW9uIClcbiAgICAge1xuICAgICB9XG59XG4iLCIvKlxuSm9saWUgY2UgcGV0aXQgbWVudSBjb250ZXh0dWVsLFxubWFpcyBuaXZlYXUgcmFwaWRpdMOpIGQnYWZmaWNoYWdlIGNlIG4nZXN0IHBhcyBib24gZHUgdG91dCAuLi5cbiovXG5cbmltcG9ydCB7IEdlb21ldHJ5IH0gIGZyb20gXCIuLi8uLi9MaWIvaW5kZXhcIlxuaW1wb3J0IHsgQ29tcG9uZW50IH0gZnJvbSBcIkB1aS9FbGVtZW50cy9jb21wb25lbnRcIlxuaW1wb3J0ICogYXMgU3ZnICAgICAgZnJvbSBcIkB1aS9CYXNlL3N2Z1wiXG5pbXBvcnQgeyB4bm9kZSB9ICAgICBmcm9tIFwiQHVpL0Jhc2UveG5vZGVcIlxuXG5jb25zdCBHID0gR2VvbWV0cnlcblxudHlwZSBSZW5kZXJlciA9ICggZGVmaW5pdGlvbjogUmFkaWFsRGVmaW5pdGlvbiApID0+IFNWR0VsZW1lbnQgW11cbnR5cGUgUmFkaWFsRGVmaW5pdGlvbiA9IEdlb21ldHJ5LlJhZGlhbERlZmluaXRpb25cbnR5cGUgUmFkaWFsT3B0aW9uICAgICA9IEdlb21ldHJ5LlJhZGlhbE9wdGlvblxuXG5kZWNsYXJlIGdsb2JhbFxue1xuICAgICBpbnRlcmZhY2UgJFJhZGlhbE1lbnUgZXh0ZW5kcyAkQ29tcG9uZW50XG4gICAgIHtcbiAgICAgICAgICB0eXBlOiBcInJhZGlhbC1tZW51XCIsXG4gICAgICAgICAgYnV0dG9uczogUGFydGlhbCA8JEJ1dHRvbj4gW10sXG4gICAgICAgICAgcm90YXRpb246IG51bWJlclxuICAgICB9XG59XG5cblxuZXhwb3J0IGNsYXNzIFJhZGlhbE1lbnUgZXh0ZW5kcyBDb21wb25lbnQgPCRSYWRpYWxNZW51Plxue1xuICAgICBjb250YWluZXI6IFNWR1NWR0VsZW1lbnRcbiAgICAgZGVmaW5pdGlvbjogUmFkaWFsRGVmaW5pdGlvblxuXG4gICAgIHJlYWRvbmx5IHJlbmRlcmVyczogUmVjb3JkIDxzdHJpbmcsIFJlbmRlcmVyPiA9IHtcbiAgICAgICAgICBcImNpcmNsZVwiOiB0aGlzLnJlbmRlclN2Z0NpcmNsZXMuYmluZCAodGhpcylcbiAgICAgfVxuXG4gICAgIC8qKiBAb3ZlcnJpZGUgKi9cbiAgICAgZ2V0SHRtbCAoKVxuICAgICB7XG4gICAgICAgICAgdGhpcy51cGRhdGUgKClcblxuICAgICAgICAgIHJldHVybiBbdGhpcy5jb250YWluZXIgYXMgYW55XVxuICAgICB9XG5cbiAgICAgYWRkICggLi4uIGJ1dHRvbnM6ICRCdXR0b24gW10gKVxuICAgICB7XG4gICAgICAgICAgdGhpcy5kYXRhLmJ1dHRvbnMucHVzaCAoIC4uLiBidXR0b25zIGFzIGFueSApXG5cbiAgICAgICAgICB0aGlzLnVwZGF0ZSAoKVxuICAgICB9XG5cbiAgICAgdXBkYXRlICgpXG4gICAgIHtcbiAgICAgICAgICBjb25zdCB7IGRhdGEgfSA9IHRoaXNcblxuICAgICAgICAgIGNvbnN0IGRlZjogUmFkaWFsT3B0aW9uID0ge1xuICAgICAgICAgICAgICAgY291bnQgIDogZGF0YS5idXR0b25zLmxlbmd0aCxcbiAgICAgICAgICAgICAgIHIgICAgICA6IDc1LFxuICAgICAgICAgICAgICAgcGFkZGluZzogNixcbiAgICAgICAgICAgICAgIHJvdGF0aW9uOiBkYXRhLnJvdGF0aW9uIHx8IDBcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB0aGlzLmRlZmluaXRpb24gPSBHLmdldFJhZGlhbERpc3RyaWJ1dGlvbiAoIGRlZiApXG4gICAgICAgICAgdGhpcy5jb250YWluZXIgID0gdGhpcy50b1N2ZyAoIFwiY2lyY2xlXCIgKVxuICAgICB9XG5cbiAgICAgcHJpdmF0ZSBlbmFibGVFdmVudHMgKClcbiAgICAge1xuICAgICAgICAgIC8vY29uc3QgeyBvcHRpb25zIH0gPSB0aGlzXG4gICAgICAgICAgLy9mb3IgKCBjb25zdCBidG4gb2Ygb3B0aW9ucy5idXR0b25zIClcbiAgICAgICAgICAvLyAgICAgYnRuLlxuICAgICB9XG5cbiAgICAgc2hvdyAoIHg6IG51bWJlciwgeTogbnVtYmVyICk6IHZvaWRcbiAgICAge1xuICAgICAgICAgIGNvbnN0IG4gPSB0aGlzLmNvbnRhaW5lclxuICAgICAgICAgIGNvbnN0IG9mZnNldCA9IHRoaXMuZGVmaW5pdGlvbi53aWR0aCAvIDJcblxuICAgICAgICAgIG4uc3R5bGUubGVmdCA9ICh4IC0gb2Zmc2V0KSArIFwicHhcIlxuICAgICAgICAgIG4uc3R5bGUudG9wICA9ICh5IC0gb2Zmc2V0KSArIFwicHhcIlxuICAgICAgICAgIG4uY2xhc3NMaXN0LnJlbW92ZSAoIFwiY2xvc2VcIiApXG4gICAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIgKCBcIm1vdXNlZG93blwiLCB0aGlzLmhpZGUuYmluZCAodGhpcyksIHRydWUgKVxuICAgICB9XG5cbiAgICAgaGlkZSAoKVxuICAgICB7XG4gICAgICAgICAgdGhpcy5jb250YWluZXIuY2xhc3NMaXN0LmFkZCAoXCJjbG9zZVwiKVxuICAgICAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIgKCBcIm1vdXNlZG93blwiLCB0aGlzLmhpZGUgKVxuICAgICB9XG5cbiAgICAgdG9TdmcgKCBzdHlsZTogc3RyaW5nIClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHsgZGVmaW5pdGlvbjogZGVmLCByZW5kZXJlcnMsIGRhdGEgfSA9IHRoaXNcblxuICAgICAgICAgIGNvbnN0IHN2ZyA9XG4gICAgICAgICAgICAgICA8c3ZnXG4gICAgICAgICAgICAgICAgICAgIGNsYXNzICAgPVwicmFkaWFsLW1lbnUgY2xvc2VcIlxuICAgICAgICAgICAgICAgICAgICB3aWR0aCAgID17IGRlZi53aWR0aCArIFwicHhcIiB9XG4gICAgICAgICAgICAgICAgICAgIGhlaWdodCAgPXsgZGVmLmhlaWdodCArIFwicHhcIiB9XG4gICAgICAgICAgICAgICAgICAgIHZpZXdCb3ggPXsgYDAgMCAkeyBkZWYud2lkdGggfSAkeyBkZWYuaGVpZ2h0IH1gIH1cbiAgICAgICAgICAgICAgIC8+IGFzIFNWR1NWR0VsZW1lbnRcblxuICAgICAgICAgIGNvbnN0IGJ1dHRvbnMgPSBzdHlsZSBpbiByZW5kZXJlcnNcbiAgICAgICAgICAgICAgICAgICAgICAgICA/IHJlbmRlcmVycyBbc3R5bGVdICggZGVmIClcbiAgICAgICAgICAgICAgICAgICAgICAgICA6IHRoaXMucmVuZGVyU3ZnQ2lyY2xlcyAoIGRlZiApXG5cbiAgICAgICAgICBzdmcuYXBwZW5kICggLi4uIGJ1dHRvbnMgYXMgTm9kZSBbXSApXG5cbiAgICAgICAgICBmb3IgKCB2YXIgaSA9IDAgOyBpICE9IGJ1dHRvbnMubGVuZ3RoIDsgaSsrIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBjb25zdCBvcHQgPSBkYXRhLmJ1dHRvbnMgW2ldXG5cbiAgICAgICAgICAgICAgIGlmICggdHlwZW9mIG9wdC5jYWxsYmFjayA9PSBcImZ1bmN0aW9uXCIgKVxuICAgICAgICAgICAgICAgICAgICBidXR0b25zIFtpXS5hZGRFdmVudExpc3RlbmVyICggXCJtb3VzZWRvd25cIiwgKCkgPT4gb3B0LmNhbGxiYWNrICgpIClcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gc3ZnXG4gICAgIH1cblxuICAgICByZW5kZXJTdmdDaXJjbGVzICggZGVmaW5pdGlvbjogUmFkaWFsRGVmaW5pdGlvbiApXG4gICAgIHtcbiAgICAgICAgICBjb25zdCBwb2ludHMgID0gZGVmaW5pdGlvbi5wb2ludHNcbiAgICAgICAgICBjb25zdCBwYWRkaW5nID0gZGVmaW5pdGlvbi5wYWRkaW5nXG4gICAgICAgICAgY29uc3QgYnV0dHVucyA9IFtdIGFzIFNWR0VsZW1lbnQgW11cblxuICAgICAgICAgIGZvciAoIHZhciBpID0gMDsgaSA8IHBvaW50cy5sZW5ndGg7ICsraSApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgY29uc3QgZGVmID0gcG9pbnRzIFtpXVxuICAgICAgICAgICAgICAgY29uc3QgYnRuID0gdGhpcy5kYXRhLmJ1dHRvbnMgW2ldXG5cbiAgICAgICAgICAgICAgIGNvbnN0IGdyb3VwID0gPGcgY2xhc3M9XCJidXR0b25cIiAvPlxuXG4gICAgICAgICAgICAgICBjb25zdCBjaXJjbGUgPSBTdmcuY3JlYXRlU3ZnU2hhcGUgKCBcImNpcmNsZVwiLCB7XG4gICAgICAgICAgICAgICAgICAgIHNpemU6IGRlZi5jaG9yZC5sZW5ndGggLSBwYWRkaW5nICogMixcbiAgICAgICAgICAgICAgICAgICAgeDogZGVmLngsXG4gICAgICAgICAgICAgICAgICAgIHk6IGRlZi55XG4gICAgICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICAgICBjb25zdCB0ZXh0ID0gPHRleHRcbiAgICAgICAgICAgICAgICAgICAgeCA9IHsgZGVmLnggfVxuICAgICAgICAgICAgICAgICAgICB5ID0geyBkZWYueSB9XG4gICAgICAgICAgICAgICAgICAgIGZvbnQtc2l6ZT1cIjMwXCJcbiAgICAgICAgICAgICAgICAgICAgZmlsbD1cImJsYWNrXCJcbiAgICAgICAgICAgICAgICAgICAgc3R5bGU9XCJ1c2VyLXNlbGVjdDogbm9uZTsgY3Vyc29yOiBwb2ludGVyOyBkb21pbmFudC1iYXNlbGluZTogY2VudHJhbDsgdGV4dC1hbmNob3I6IG1pZGRsZTtcIlxuICAgICAgICAgICAgICAgLz5cblxuICAgICAgICAgICAgICAgaWYgKCBidG4uZm9udEZhbWlseSAhPSB1bmRlZmluZWQgKVxuICAgICAgICAgICAgICAgICAgICB0ZXh0LnNldEF0dHJpYnV0ZSAoIFwiZm9udC1mYW1pbHlcIiwgYnRuLmZvbnRGYW1pbHkgKVxuXG4gICAgICAgICAgICAgICB0ZXh0LmlubmVySFRNTCA9IGJ0bi5pY29uXG5cbiAgICAgICAgICAgICAgIGdyb3VwLmFwcGVuZCAoIGNpcmNsZSApXG4gICAgICAgICAgICAgICBncm91cC5hcHBlbmQgKCB0ZXh0IClcblxuICAgICAgICAgICAgICAgYnV0dHVucy5wdXNoICggZ3JvdXAgYXMgU1ZHRWxlbWVudCApXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIGJ1dHR1bnNcbiAgICAgfVxufVxuXG4iLCJcbmltcG9ydCBcIi4uL3R5cGVzXCJcbmltcG9ydCB7IENvbXBvbmVudCB9IGZyb20gXCIuL2NvbXBvbmVudFwiXG5pbXBvcnQgeyBTaWRlTWVudSB9IGZyb20gXCIuL3NpZGVNZW51XCJcblxuZGVjbGFyZSBnbG9iYWxcbntcbiAgICAgaW50ZXJmYWNlICRQYW5lbCBleHRlbmRzICRDb21wb25lbnRcbiAgICAge1xuICAgICAgICAgIC8vdHlwZSAgICAgICAgIDogXCJwYW5lbFwiXG4gICAgICAgICAgaGVhZGVyPyAgICAgIDogJEFueUNvbXBvbmVudHMsXG4gICAgICAgICAgY2hpbGRyZW4/ICAgIDogJEFueUNvbXBvbmVudHMgW11cbiAgICAgICAgICBmb290ZXI/ICAgICAgOiAkQW55Q29tcG9uZW50c1xuICAgICAgICAgIHBvc2l0aW9uOiBcImxlZnRcIiB8IFwicmlnaHRcIiB8IFwidG9wXCIgfCBcImJvdHRvbVwiLFxuICAgICAgICAgIGJ1dHRvbjogJEJ1dHRvblxuICAgICB9XG59XG5cbnR5cGUgRGlyZWN0aW9uID0gXCJsclwiIHwgXCJybFwiIHwgXCJ0YlwiIHwgXCJidFwiXG5cbmNvbnN0IHRvUG9zaXRpb24gPSB7XG4gICAgIGxyIDogXCJsZWZ0XCIsXG4gICAgIHJsIDogXCJyaWdodFwiLFxuICAgICB0YiA6IFwidG9wXCIsXG4gICAgIGJ0IDogXCJib3R0b21cIixcbn1cblxuZXhwb3J0IC8qYWJzdHJhY3QqLyBjbGFzcyBQYW5lbCA8QyBleHRlbmRzICRQYW5lbCA9ICRQYW5lbD4gZXh0ZW5kcyBDb21wb25lbnQgPEM+XG57XG4gICAgIHByaXZhdGUgbWVudTogU2lkZU1lbnVcblxuICAgICBwbGFjZVRvICggc2lkZTogXCJsZWZ0XCIgfCBcInJpZ2h0XCIgfCBcInRvcFwiIHwgXCJib3R0b21cIiApXG4gICAgIHtcbiAgICAgICAgICBjb25zdCBkYXRhID0gdGhpcy5kYXRhXG5cbiAgICAgICAgICBpZiAoIGRhdGEucG9zaXRpb24gPT0gc2lkZSAmJiB0aGlzLm1lbnUgIT0gbnVsbCApIHJldHVyblxuXG4gICAgICAgICAgY29uc3QgY2ZnID0ge1xuICAgICAgICAgICAgICAgY29udGV4dCAgICAgIDogXCJjb25jZXB0LXVpXCIgYXMgXCJjb25jZXB0LXVpXCIsXG4gICAgICAgICAgICAgICB0eXBlICAgICAgICAgOiBcInNpZGUtbWVudVwiICBhcyBcInNpZGUtbWVudVwiLFxuICAgICAgICAgICAgICAgaGFzTWFpbkJ1dHRvbjogdHJ1ZSxcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB2YXIgbWVudTogU2lkZU1lbnVcblxuICAgICAgICAgIHN3aXRjaCAoIHNpZGUgKVxuICAgICAgICAgIHtcbiAgICAgICAgICBjYXNlIFwibGVmdFwiOlxuXG4gICAgICAgICAgICAgICBpZiAoIFNpZGVNZW51LmF0TGVmdCA9PSBudWxsICkgU2lkZU1lbnUuYXRMZWZ0ID0gbmV3IFNpZGVNZW51ICh7XG4gICAgICAgICAgICAgICAgICAgIGlkOiBcInNpZGUtbWVudS1sZWZ0XCIsXG4gICAgICAgICAgICAgICAgICAgIGRpcmVjdGlvbjogXCJsclwiLFxuICAgICAgICAgICAgICAgICAgICAuLi4gY2ZnLFxuICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgIG1lbnUgPSBTaWRlTWVudS5hdExlZnRcbiAgICAgICAgICAgICAgIGJyZWFrXG5cbiAgICAgICAgICBjYXNlIFwicmlnaHRcIjpcblxuICAgICAgICAgICAgICAgaWYgKCBTaWRlTWVudS5hdFJpZ2h0ID09IG51bGwgKSBTaWRlTWVudS5hdFJpZ2h0ID0gbmV3IFNpZGVNZW51ICh7XG4gICAgICAgICAgICAgICAgICAgIGlkOiBcInNpZGUtbWVudS1yaWdodFwiLFxuICAgICAgICAgICAgICAgICAgICBkaXJlY3Rpb246IFwicmxcIixcbiAgICAgICAgICAgICAgICAgICAgLi4uIGNmZyxcbiAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICBtZW51ID0gU2lkZU1lbnUuYXRSaWdodFxuICAgICAgICAgICAgICAgYnJlYWtcblxuICAgICAgICAgIGNhc2UgXCJ0b3BcIjpcblxuICAgICAgICAgICAgICAgaWYgKCBTaWRlTWVudS5hdFRvcCA9PSBudWxsICkgU2lkZU1lbnUuYXRUb3AgPSBuZXcgU2lkZU1lbnUgKHtcbiAgICAgICAgICAgICAgICAgICAgaWQ6IFwic2lkZS1tZW51LXRvcFwiLFxuICAgICAgICAgICAgICAgICAgICBkaXJlY3Rpb246IFwidGJcIixcbiAgICAgICAgICAgICAgICAgICAgLi4uIGNmZyxcbiAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICBtZW51ID0gU2lkZU1lbnUuYXRUb3BcbiAgICAgICAgICAgICAgIGJyZWFrXG5cbiAgICAgICAgICBjYXNlIFwiYm90dG9tXCI6XG5cbiAgICAgICAgICAgICAgIGlmICggU2lkZU1lbnUuYXRCb3R0b20gPT0gbnVsbCApIFNpZGVNZW51LmF0Qm90dG9tID0gbmV3IFNpZGVNZW51ICh7XG4gICAgICAgICAgICAgICAgICAgIGlkOiBcInNpZGUtbWVudS1ib3R0b21cIixcbiAgICAgICAgICAgICAgICAgICAgZGlyZWN0aW9uOiBcImJ0XCIsXG4gICAgICAgICAgICAgICAgICAgIC4uLiBjZmcsXG4gICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgbWVudSA9IFNpZGVNZW51LmF0Qm90dG9tXG4gICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICggdGhpcy5tZW51ICE9IHVuZGVmaW5lZCApXG4gICAgICAgICAgICAgICB0aGlzLm1lbnUucmVtb3ZlICggdGhpcyApXG5cbiAgICAgICAgICBtZW51LmFwcGVuZCAoIHRoaXMgKVxuICAgICAgICAgIGRhdGEucG9zaXRpb24gPSBzaWRlXG4gICAgIH1cblxuICAgICBvcGVuICgpXG4gICAgIHtcbiAgICAgICAgICB0aGlzLm1lbnUuY2xlYXIgKClcbiAgICAgICAgICB0aGlzLm1lbnUuYXBwZW5kICggdGhpcyApXG4gICAgICAgICAgdGhpcy5tZW51Lm9wZW4gKClcbiAgICAgfVxuXG4gICAgIGNsb3NlICgpXG4gICAgIHtcbiAgICAgICAgICB0aGlzLm1lbnUuY2xvc2UgKClcbiAgICAgfVxuXG59XG5cbiIsIlxuaW1wb3J0IHsgeG5vZGUgfSBmcm9tIFwiLi4vQmFzZS94bm9kZVwiXG5pbXBvcnQgeyBkZWZpbmUgfSBmcm9tIFwiLi4vZGJcIlxuaW1wb3J0IHsgUGFuZWwgfSBmcm9tIFwiLi9wYW5lbFwiXG5pbXBvcnQgKiBhcyBkYiBmcm9tIFwiQGFwaS9kYXRhXCJcblxuXG5kZWNsYXJlIGdsb2JhbFxue1xuICAgICBpbnRlcmZhY2UgJFNraWxsVmlld2VyIGV4dGVuZHMgJFBhbmVsXG4gICAgIHtcbiAgICAgICAgICB0eXBlOiBcInNraWxsLXZpZXdlclwiXG4gICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFNraWxsVmlld2VyIGV4dGVuZHMgUGFuZWwgPCRTa2lsbFZpZXdlcj5cbntcbiAgICAgZGlzcGxheSAoIHNraWxsOiAkU2tpbGwgKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgdGFyZ2V0ID0gPGRpdiBjbGFzcz1cInBlb3BsZVwiPjwvZGl2PlxuXG4gICAgICAgICAgZm9yICggY29uc3QgaXRlbSBvZiBza2lsbC5pdGVtcyApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgY29uc3QgcGVyc29uID0gZGIuZGF0YSA8JFBlcnNvbj4gKCBpdGVtLnR5cGUsIGl0ZW0uaWQgKVxuXG4gICAgICAgICAgICAgICBjb25zdCBjYXJkID0gPGRpdiBjbGFzcz1cInczLWNhcmQtNCBwZXJzb24tY2FyZFwiPlxuICAgICAgICAgICAgICAgICAgICA8aW1nIHNyYz17IHBlcnNvbi5hdmF0YXIgfSBhbHQ9XCJBdmF0YXJcIi8+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJ3My1jb250YWluZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICA8aDQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8Yj57IHBlcnNvbi5maXJzdE5hbWUgfTwvYj5cbiAgICAgICAgICAgICAgICAgICAgICAgICA8L2g0PlxuICAgICAgICAgICAgICAgICAgICAgICAgIDxsYWJlbD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxiPnsgcGVyc29uLmlzQ2FwdGFpbiA/IFwiRXhwZXJ0XCIgOiBudWxsIH08L2I+XG4gICAgICAgICAgICAgICAgICAgICAgICAgPC9sYWJlbD5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgdGFyZ2V0LmFwcGVuZCAoIGNhcmQgKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHRoaXMuY29udGFpbmVyLmNsYXNzTGlzdC5hZGQgKCBcImNvbnRhaW5lclwiIClcbiAgICAgICAgICB0aGlzLmNvbnRhaW5lci5pbm5lckhUTUwgPSBcIlwiXG4gICAgICAgICAgdGhpcy5jb250YWluZXIuYXBwZW5kICggPGgxPnsgc2tpbGwuaWQgfTwvaDE+IClcbiAgICAgICAgICB0aGlzLmNvbnRhaW5lci5hcHBlbmQgKCA8cD57IHNraWxsLmRlc2NyaXB0aW9uIH08L3A+IClcbiAgICAgICAgICB0aGlzLmNvbnRhaW5lci5hcHBlbmQgKCB0YXJnZXQgKVxuXG4gICAgICAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL0xvckRPbmlYL2pzb24tdmlld2VyL2Jsb2IvbWFzdGVyL3NyYy9qc29uLXZpZXdlci5qc1xuICAgICAgICAgIHRoaXMuY29udGFpbmVyLmFwcGVuZCAoIDxwcmU+eyBKU09OLnN0cmluZ2lmeSAoIHNraWxsLCBudWxsLCAzICkgfTwvcHJlPiApXG4gICAgIH1cbn1cblxuZGVmaW5lICggU2tpbGxWaWV3ZXIsIHtcbiAgICAgY29udGV4dCA6IENPTlRFWFRfVUksXG4gICAgIHR5cGUgICAgOiBcInNraWxsLXZpZXdlclwiLFxuICAgICBpZCAgICAgIDogdW5kZWZpbmVkLFxuICAgICBwb3NpdGlvbjogXCJsZWZ0XCIsXG4gICAgIGJ1dHRvbjogbnVsbFxufSlcbiIsIlxuaW1wb3J0ICogYXMgZGIgZnJvbSBcIi4uL0FwaS9kYXRhXCJcbmltcG9ydCB7IFNoYXBlIH0gZnJvbSBcIi4vc2hhcGVcIlxuXG5leHBvcnQgdHlwZSBCYWRnZVBvc2l0aW9uID0geyBhbmdsZTogbnVtYmVyLCBvZmZzZXQ6IG51bWJlciB9XG5cbmV4cG9ydCBjbGFzcyBCYWRnZSBleHRlbmRzIFNoYXBlXG57XG4gICAgIHJlYWRvbmx5IG93bmVyID0gdW5kZWZpbmVkIGFzIFNoYXBlXG5cbiAgICAgcmVhZG9ubHkgcG9zaXRpb24gPSB7IGFuZ2xlOiAwLCBvZmZzZXQ6IDAgfVxuXG4gICAgIGNvbnN0cnVjdG9yICggb3B0aW9uczogJFNoYXBlIClcbiAgICAge1xuICAgICAgICAgIHN1cGVyICggb3B0aW9ucyApXG5cbiAgICAgICAgICBjb25zdCB7IGdyb3VwIH0gPSB0aGlzXG5cbiAgICAgICAgICBjb25zdCB0aGlzZGF0YSA9IHRoaXMuY29uZmlnLmRhdGFcbiAgICAgICAgICBjb25zdCBlbnRpdHkgPSBkYi5kYXRhIDwkQmFkZ2U+ICggdGhpc2RhdGEudHlwZSwgdGhpc2RhdGEuaWQgKVxuXG4gICAgICAgICAgY29uc3QgdGV4dCA9IG5ldyBmYWJyaWMuVGV4dGJveCAoIGVudGl0eS5lbW9qaSB8fCBcIlhcIiwge1xuICAgICAgICAgICAgICAgZm9udFNpemU6IHRoaXMuZGlzcGxheVNpemUgKCksXG4gICAgICAgICAgICAgICBvcmlnaW5YIDogXCJjZW50ZXJcIixcbiAgICAgICAgICAgICAgIG9yaWdpblkgOiBcImNlbnRlclwiLFxuICAgICAgICAgICAgICAgbGVmdCAgICA6IGdyb3VwLmxlZnQsXG4gICAgICAgICAgICAgICB0b3AgICAgIDogZ3JvdXAudG9wLFxuICAgICAgICAgIH0pXG5cbiAgICAgICAgICBncm91cC5hZGRXaXRoVXBkYXRlICggdGV4dCApXG4gICAgIH1cblxuICAgICBkaXNwbGF5U2l6ZSAoKVxuICAgICB7XG4gICAgICAgICAgcmV0dXJuIDIwXG4gICAgIH1cblxuICAgICBhdHRhY2ggKCB0YXJnZXQ6IFNoYXBlLCBwb3MgPSB7fSBhcyBCYWRnZVBvc2l0aW9uIClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHsgcmFuZG9tLCBQSSB9ID0gTWF0aFxuXG4gICAgICAgICAgaWYgKCAhIGlzRmluaXRlICggcG9zLmFuZ2xlICkgKVxuICAgICAgICAgICAgICAgcG9zLmFuZ2xlID0gcmFuZG9tICgpICogUEkgKiAyXG5cbiAgICAgICAgICBpZiAoICEgaXNGaW5pdGUgKCBwb3Mub2Zmc2V0ICkgKVxuICAgICAgICAgICAgICAgcG9zLm9mZnNldCA9IDAuMVxuXG4gICAgICAgICAgOyh0aGlzLnBvc2l0aW9uIGFzIEJhZGdlUG9zaXRpb24pID0geyAuLi4gcG9zIH1cblxuICAgICAgICAgIGlmICggdGhpcy5vd25lciAhPSB1bmRlZmluZWQgKVxuICAgICAgICAgICAgICAgdGFyZ2V0Lmdyb3VwLnJlbW92ZSAoIHRoaXMuZ3JvdXAgKVxuXG4gICAgICAgICAgdGFyZ2V0Lmdyb3VwLmFkZCAoIHRoaXMuZ3JvdXAgKVxuXG4gICAgICAgICAgOyh0aGlzLm93bmVyIGFzIFNoYXBlKSA9IHRhcmdldFxuXG4gICAgICAgICAgdGhpcy51cGRhdGVQb3NpdGlvbiAoKVxuICAgICB9XG5cbiAgICAgdXBkYXRlUG9zaXRpb24gKClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHsgcG9zaXRpb246IHBvcywgb3duZXIgfSA9IHRoaXNcblxuICAgICAgICAgIGlmICggb3duZXIgPT0gdW5kZWZpbmVkIClcbiAgICAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgICAgY29uc3QgeyByYW5kb20sIFBJLCBjb3MsIHNpbiB9ID0gTWF0aFxuXG4gICAgICAgICAgY29uc3QgcmFkICAgID0gcG9zLmFuZ2xlIHx8IHJhbmRvbSAoKSAqIFBJICogMlxuICAgICAgICAgIGNvbnN0IHggICAgICA9IHNpbiAocmFkKVxuICAgICAgICAgIGNvbnN0IHkgICAgICA9IGNvcyAocmFkKVxuICAgICAgICAgIGNvbnN0IHMgICAgICA9IG93bmVyLmRpc3BsYXlTaXplICgpIC8gMlxuICAgICAgICAgIGNvbnN0IG9mZnNldCA9IHR5cGVvZiBwb3Mub2Zmc2V0ID09IFwibnVtYmVyXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICA/IHRoaXMuZGlzcGxheVNpemUgKCkgKiBwb3Mub2Zmc2V0XG4gICAgICAgICAgICAgICAgICAgICAgICAgOiB0aGlzLmRpc3BsYXlTaXplICgpICogMC4xXG5cbiAgICAgICAgICB0aGlzLnNldFBvc2l0aW9uICggeCAqIChzICsgb2Zmc2V0KSwgeSAqIChzICsgb2Zmc2V0KSApXG4gICAgIH1cbn1cbiIsIlxuaW1wb3J0IHsgR2VvbWV0cnkgfSAgZnJvbSBcIkBsaWJcIlxuaW1wb3J0IHsgZ2V0IH0gICBmcm9tIFwiLi9kYlwiXG5pbXBvcnQgeyBTaGFwZSB9IGZyb20gXCIuL3NoYXBlXCJcblxuZXhwb3J0IGNsYXNzIEdyb3VwIDwkIGV4dGVuZHMgJFNoYXBlIDwkR3JvdXA+ID0gJFNoYXBlIDwkR3JvdXA+PiBleHRlbmRzIFNoYXBlIDwkPlxue1xuICAgICByZWFkb25seSBjaGlsZHJlbjogU2hhcGUgW11cblxuICAgICBkaXNwbGF5X3NpemUgPSAxXG5cbiAgICAgY29uc3RydWN0b3IgKCBvcHRpb25zOiAkIClcbiAgICAge1xuICAgICAgICAgIHN1cGVyICggb3B0aW9ucyApXG4gICAgICAgICAgdGhpcy5jaGlsZHJlbiA9IFtdXG5cbiAgICAgICAgICBjb25zdCBlbnRpdHkgPSB0aGlzLmNvbmZpZy5kYXRhXG5cbiAgICAgICAgICBmb3IgKCBjb25zdCBjaGlsZCBvZiBPYmplY3QudmFsdWVzICggZW50aXR5Lml0ZW1zICkgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNvbnN0IGEgPSBnZXQgKCBjaGlsZCApXG4gICAgICAgICAgICAgICB0aGlzLmFkZCAoIGEgKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHRoaXMucGFjayAoKVxuICAgICB9XG5cbiAgICAgZGlzcGxheVNpemUgKClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IHRoaXMuY29uZmlnXG5cbiAgICAgICAgICB2YXIgc2l6ZSA9ICh0aGlzLmRpc3BsYXlfc2l6ZSArIGNvbmZpZy5zaXplT2Zmc2V0KSAqIGNvbmZpZy5zaXplRmFjdG9yXG5cbiAgICAgICAgICBpZiAoIHNpemUgPCBjb25maWcubWluU2l6ZSApXG4gICAgICAgICAgICAgICBzaXplID0gY29uZmlnLm1pblNpemVcblxuICAgICAgICAgIHJldHVybiBzaXplIHx8IDFcbiAgICAgfVxuXG4gICAgIGFkZCAoIGNoaWxkOiBTaGFwZSApXG4gICAgIHtcbiAgICAgICAgICBjb25zdCB7IGdyb3VwIH0gPSB0aGlzXG5cbiAgICAgICAgICB0aGlzLmNoaWxkcmVuLnB1c2ggKCBjaGlsZCApXG5cbiAgICAgICAgICBpZiAoIGdyb3VwIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBncm91cC5hZGQgKCBjaGlsZC5ncm91cCApXG4gICAgICAgICAgICAgICBncm91cC5zZXRDb29yZHMgKClcbiAgICAgICAgICB9XG4gICAgIH1cblxuICAgICBwYWNrICgpXG4gICAgIHtcbiAgICAgICAgICBjb25zdCB7IGdyb3VwLCBjaGlsZHJlbiwgY29uZmlnIH0gPSB0aGlzXG5cbiAgICAgICAgICBjb25zdCBwb3NpdGlvbnMgPSBbXSBhcyBHZW9tZXRyeS5DaXJjbGUgW11cblxuICAgICAgICAgIGZvciAoIGNvbnN0IGMgb2YgY2hpbGRyZW4gKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNvbnN0IGcgPSBjLmdyb3VwXG4gICAgICAgICAgICAgICBjb25zdCByID0gKGcud2lkdGggPiBnLmhlaWdodCA/IGcud2lkdGggOiBnLmhlaWdodCkgLyAyXG4gICAgICAgICAgICAgICBwb3NpdGlvbnMucHVzaCAoIHsgeDogZy5sZWZ0LCB5OiBnLnRvcCwgcjogciArIDYgfSApXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29uc3Qgc2l6ZSA9ICBHZW9tZXRyeS5wYWNrRW5jbG9zZSAoIHBvc2l0aW9ucyApICogMlxuXG4gICAgICAgICAgZm9yICggdmFyIGkgPSAwIDsgaSA8IGNoaWxkcmVuLmxlbmd0aCA7IGkrKyApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgY29uc3QgZyA9IGNoaWxkcmVuIFtpXS5ncm91cFxuICAgICAgICAgICAgICAgY29uc3QgcCA9IHBvc2l0aW9ucyBbaV1cblxuICAgICAgICAgICAgICAgZy5sZWZ0ID0gcC54XG4gICAgICAgICAgICAgICBnLnRvcCAgPSBwLnlcblxuICAgICAgICAgICAgICAgZ3JvdXAuYWRkICggZyApXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdGhpcy5kaXNwbGF5X3NpemUgPSBzaXplICsgY29uZmlnLnNpemVPZmZzZXRcblxuICAgICAgICAgIHRoaXMudXBkYXRlU2l6ZSAoKVxuICAgICB9XG5cbn1cblxuIiwiaW1wb3J0IHsgZGF0YSB9ICAgIGZyb20gXCJAYXBpL2RhdGFcIlxuaW1wb3J0IHsgY29tbWFuZCB9IGZyb20gXCJAYXBpL2NvbW1hbmRcIlxuaW1wb3J0IHsgZ2V0LCBkZWZpbmUsIHNldCwgU2hhcGUsIEdyb3VwLCBCYWRnZSB9IGZyb20gXCJAYXNwZWN0XCJcblxuZGVmaW5lICggU2hhcGUsIFwicGVyc29uXCIgKVxuZGVmaW5lICggR3JvdXAsIFwic2tpbGxcIiApXG5kZWZpbmUgKCBCYWRnZSwgXCJiYWRnZVwiIClcblxuc2V0IDwkU2hhcGU+ICh7XG4gICAgIHR5cGUgICA6IFwicGVyc29uXCIsXG4gICAgIGlkICAgICA6IHVuZGVmaW5lZCxcblxuICAgICBkYXRhICAgOiB1bmRlZmluZWQsXG5cbiAgICAgc2hhcGUgIDogXCJjaXJjbGVcIixcblxuICAgICB4OiAwLFxuICAgICB5OiAwLFxuXG4gICAgIG1pblNpemUgICAgOiAzMCxcbiAgICAgc2l6ZUZhY3RvcjogMSxcbiAgICAgc2l6ZU9mZnNldDogMCxcblxuICAgICBib3JkZXJDb2xvciAgICAgOiBcIiMwMGMwYWFcIixcbiAgICAgYm9yZGVyV2lkdGggICAgIDogNCxcbiAgICAgYmFja2dyb3VuZENvbG9yIDogXCJ0cmFuc3BhcmVudFwiLFxuICAgICBiYWNrZ3JvdW5kSW1hZ2UgOiB1bmRlZmluZWQsXG4gICAgIGJhY2tncm91bmRSZXBlYXQ6IGZhbHNlLFxuXG4gICAgIG9uQ3JlYXRlICAgOiAoIHBlcnNvbjogJFBlcnNvbiwgYXNwZWN0ICkgPT5cbiAgICAge1xuICAgICAgICAgIGFzcGVjdC5zZXRCYWNrZ3JvdW5kICh7XG4gICAgICAgICAgICAgICBiYWNrZ3JvdW5kSW1hZ2U6IHBlcnNvbi5hdmF0YXIsXG4gICAgICAgICAgICAgICBzaGFwZTogcGVyc29uLmlzQ2FwdGFpbiA/IFwic3F1YXJlXCIgOiBcImNpcmNsZVwiLFxuICAgICAgICAgIH0gYXMgYW55KVxuICAgICB9LFxuICAgICBvbkRlbGV0ZTogdW5kZWZpbmVkLFxuICAgICBvblRvdWNoOiB1bmRlZmluZWQsXG59KVxuXG5zZXQgPCRTaGFwZT4gKHtcbiAgICAgdHlwZSAgIDogXCJza2lsbFwiLFxuICAgICBpZCAgICAgOiB1bmRlZmluZWQsXG5cbiAgICAgZGF0YTogdW5kZWZpbmVkLFxuXG4gICAgIHNoYXBlOiBcImNpcmNsZVwiLFxuICAgICB4OiAwLFxuICAgICB5OiAwLFxuXG4gICAgIGJvcmRlckNvbG9yICAgICA6IFwiI2YxYmMzMVwiLFxuICAgICBib3JkZXJXaWR0aCAgICAgOiA4LFxuICAgICBiYWNrZ3JvdW5kQ29sb3IgOiBcIiNGRkZGRkZcIixcbiAgICAgYmFja2dyb3VuZEltYWdlIDogdW5kZWZpbmVkLFxuICAgICBiYWNrZ3JvdW5kUmVwZWF0OiBmYWxzZSxcbiAgICAgbWluU2l6ZSAgICAgICAgIDogNTAsXG4gICAgIHNpemVPZmZzZXQgICAgICA6IDEwLFxuICAgICBzaXplRmFjdG9yICAgICAgOiAxLFxuXG4gICAgIG9uQ3JlYXRlICggc2tpbGw6ICRTa2lsbCwgYXNwZWN0IClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IG5vZGUgPSBkYXRhIDwkQmFkZ2U+ICggXCJiYWRnZVwiLCBza2lsbC5pY29uIClcbiAgICAgICAgICBjb25zdCBiYWRnZSA9IGdldCA8QmFkZ2U+ICggbm9kZSApXG5cbiAgICAgICAgICBiYWRnZS5hdHRhY2ggKCBhc3BlY3QgKVxuICAgICB9LFxuXG4gICAgIG9uVG91Y2ggKCBzaGFwZSApXG4gICAgIHtcbiAgICAgICAgICBjb21tYW5kICggXCJvcGVuLWluZm9zLXBhbmVsXCIgKS5ydW4gKClcbiAgICAgfSxcblxuICAgICBvbkRlbGV0ZTogdW5kZWZpbmVkXG59KVxuXG5zZXQgPCRTaGFwZT4gKHtcbiAgICAgdHlwZSAgIDogXCJiYWRnZVwiLFxuICAgICBpZCAgICAgOiB1bmRlZmluZWQsXG5cbiAgICAgZGF0YTogdW5kZWZpbmVkLFxuXG4gICAgIHggICAgICAgICA6IDAsXG4gICAgIHkgICAgICAgICA6IDAsXG4gICAgIG1pblNpemUgICA6IDEsXG4gICAgIHNpemVGYWN0b3I6IDEsXG4gICAgIHNpemVPZmZzZXQ6IDAsXG5cbiAgICAgc2hhcGUgICAgICAgICAgIDogXCJjaXJjbGVcIixcbiAgICAgYm9yZGVyQ29sb3IgICAgIDogXCJncmF5XCIsXG4gICAgIGJvcmRlcldpZHRoICAgICA6IDAsXG5cbiAgICAgYmFja2dyb3VuZENvbG9yIDogXCJ0cmFuc3BhcmVudFwiLFxuICAgICBiYWNrZ3JvdW5kSW1hZ2UgOiB1bmRlZmluZWQsXG4gICAgIGJhY2tncm91bmRSZXBlYXQ6IGZhbHNlLFxuXG4gICAgIG9uQ3JlYXRlICAgICAgICA6IHVuZGVmaW5lZCxcbiAgICAgb25EZWxldGUgICAgICAgIDogdW5kZWZpbmVkLFxuICAgICBvblRvdWNoICAgICAgICAgOiB1bmRlZmluZWQsXG59KVxuIiwiXG5pbXBvcnQgeyBnZXQgfSBmcm9tIFwiQGFzcGVjdC9kYlwiXG5cbmltcG9ydCAqIGFzIHVpICBmcm9tIFwiQHVpL2RiXCJcbmltcG9ydCB7IFNpZGVNZW51IH0gICAgZnJvbSBcIkB1aS9FbGVtZW50cy9zaWRlbWVudVwiXG5pbXBvcnQgeyBTa2lsbFZpZXdlciB9IGZyb20gXCJAdWkvRWxlbWVudHMvcGFuZWwtc2tpbGxcIlxuaW1wb3J0IHsgUmFkaWFsTWVudSB9ICBmcm9tIFwiQHVpL0VsZW1lbnRzL2NpcmNsZW1lbnVcIlxuaW1wb3J0IHsgQXJlYSB9ICAgICAgICBmcm9tIFwiQHVpL0VsZW1lbnRzL2FyZWFcIlxuXG5pbXBvcnQgeyBkYXRhIH0gICAgZnJvbSBcIkBhcGkvZGF0YVwiXG5pbXBvcnQgeyBjb21tYW5kIH0gZnJvbSBcIkBhcGkvY29tbWFuZFwiXG5cbi8vICNyZWdpb24gRFJBV0lORyBBUkVBXG5cbmV4cG9ydCBjb25zdCBhcmVhID0gICgoKSA9Plxue1xuICAgICBjb25zdCBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50ICggXCJjYW52YXNcIiApXG5cbiAgICAgY2FudmFzLndpZHRoICA9IGRvY3VtZW50LmJvZHkuY2xpZW50V2lkdGhcbiAgICAgY2FudmFzLmhlaWdodCA9IGRvY3VtZW50LmJvZHkuY2xpZW50SGVpZ2h0XG5cbiAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmQgKCBjYW52YXMgKVxuXG4gICAgIHJldHVybiBuZXcgQXJlYSAoIGNhbnZhcyApXG59KSAoKVxuXG5leHBvcnQgY29uc3QgY29udGV4dHVhbE1lbnUgPSBuZXcgUmFkaWFsTWVudSAoe1xuICAgICBjb250ZXh0OiBcImNvbmNlcHQtdWlcIixcbiAgICAgdHlwZTogXCJyYWRpYWwtbWVudVwiLFxuICAgICBpZDogXCJhcmVhLW1lbnVcIixcbiAgICAgYnV0dG9uczogW1xuICAgICAgICAgIC8veyB0eXBlOiBcImJ1dHRvblwiLCBpZDogXCJhZGQtdGhpbmdcIiAsIHRleHQ6IFwiXCIsIGljb246IFwiJiN4ZTNjODtcIiwgZm9udEZhbWlseTogXCJNYXRlcmlhbCBJY29uc1wiLCBjYWxsYmFjazogKCkgPT4geyBydW5Db21tYW5kICggXCJ6b29tLWV4dGVuZHNcIiApIH0gfSwgLy8gZGV0YWlsc1xuICAgICAgICAgIHsgdHlwZTogXCJidXR0b25cIiwgaWQ6IFwiYWRkLXRoaW5nXCIgLCB0ZXh0OiBcIlwiLCBpY29uOiBcIiYjeGUzYzg7XCIsIGZvbnRGYW1pbHk6IFwiTWF0ZXJpYWwgSWNvbnNcIiB9LCAvLyBkZXRhaWxzXG4gICAgICAgICAgeyB0eXBlOiBcImJ1dHRvblwiLCBpZDogXCJhZGQtYnViYmxlXCIsIHRleHQ6IFwiXCIsIGljb246IFwiJiN4ZTZkZDtcIiwgZm9udEZhbWlseTogXCJNYXRlcmlhbCBJY29uc1wiIH0sXG4gICAgICAgICAgeyB0eXBlOiBcImJ1dHRvblwiLCBpZDogXCJhZGQtbm90ZVwiICAsIHRleHQ6IFwiXCIsIGljb246IFwiJiN4ZTI0NDtcIiwgZm9udEZhbWlseTogXCJNYXRlcmlhbCBJY29uc1wiLCBjb21tYW5kOiBcInBhY2stdmlld1wiIH0sIC8vIGZvcm1hdF9xdW90ZVxuICAgICAgICAgIHsgdHlwZTogXCJidXR0b25cIiwgaWQ6IFwiYWRkLXBlb3BsZVwiLCB0ZXh0OiBcIlwiLCBpY29uOiBcIiYjeGU4N2M7XCIsIGZvbnRGYW1pbHk6IFwiTWF0ZXJpYWwgSWNvbnNcIiB9LCAvLyBmYWNlXG4gICAgICAgICAgeyB0eXBlOiBcImJ1dHRvblwiLCBpZDogXCJhZGQtdGFnXCIgICAsIHRleHQ6IFwiXCIsIGljb246IFwiJiN4ZTg2NztcIiwgZm9udEZhbWlseTogXCJNYXRlcmlhbCBJY29uc1wiIH0sIC8vIGJvb2ttYXJrX2JvcmRlclxuICAgICBdIGFzIGFueSxcbiAgICAgcm90YXRpb246IE1hdGguUEkvMixcbn0pXG5kb2N1bWVudC5ib2R5LmFwcGVuZCAoIC4uLiBjb250ZXh0dWFsTWVudS5nZXRIdG1sICgpIClcblxuLy8gQXJlYSBldmVudHNcblxuYXJlYS5vbkRvdWJsZVRvdWNoT2JqZWN0ID0gKCBzaGFwZSApID0+XG57XG4gICAgIGlmICggc2hhcGUuY29uZmlnLm9uVG91Y2ggIT0gdW5kZWZpbmVkIClcbiAgICAgICAgICBzaGFwZS5jb25maWcub25Ub3VjaCAoIHNoYXBlIClcbn1cblxuYXJlYS5vblRvdWNoQXJlYSA9ICggeCwgeSApID0+XG57XG4gICAgIGNvbW1hbmQgKCBcIm9wZW4tY29udGV4dGFsLW1lbnVcIiApLnJ1biAoKVxuICAgICAvL3J1biBDb21tYW5kICggXCJvcGVuLWNvbnRleHRhbC1tZW51XCIsIHgsIHkgKVxufVxuXG5hcmVhLm9uT3Zlck9iamVjdCA9ICggc2hhcGUgKSA9Plxue1xuICAgICBzaGFwZS5ob3ZlciAoIHRydWUgKVxuICAgICBhcmVhLmZjYW52YXMucmVxdWVzdFJlbmRlckFsbCAoKVxufVxuXG5hcmVhLm9uT3V0T2JqZWN0ID0gKCBzaGFwZSApID0+XG57XG4gICAgIHNoYXBlLmhvdmVyICggZmFsc2UgKVxuICAgICBhcmVhLmZjYW52YXMucmVxdWVzdFJlbmRlckFsbCAoKVxufVxuXG4vLyBBcmVhIGNvbW1hbmRzXG5cbmNvbW1hbmQgKCBcIm9wZW4tY29udGV4dGFsLW1lbnVcIiwgKCBlOiBmYWJyaWMuSUV2ZW50ICkgPT5cbntcbiAgICAgY29udGV4dHVhbE1lbnUuc2hvdyAoIGUucG9pbnRlci54LCBlLnBvaW50ZXIueSApXG59IClcblxuY29tbWFuZCAoIFwiY2xvc2UtY29udGV4dGFsLW1lbnVcIiwgKCkgPT5cbntcbiAgICAgY29udGV4dHVhbE1lbnUuaGlkZSAoKVxufSlcblxuY29tbWFuZCAoIFwiYWRkLXNraWxsXCIsICggdGl0bGUgKSA9Plxue1xuICAgICBjb25zb2xlLmxvZyAoIFwiQWRkIHNraWxsXCIgKVxufSlcblxuY29tbWFuZCAoIFwiYWRkLXBlcnNvblwiLCAoIG5hbWUgKSA9Plxue1xuXG59KVxuXG5jb21tYW5kICggXCJ6b29tLWV4dGVuZHNcIiwgKCkgPT5cbntcbiAgICAgYXJlYS56b29tICgpXG59KVxuXG5jb21tYW5kICggXCJ6b29tLXRvXCIsICggc2hhcGUgKSA9Plxue1xuICAgICAvLyBhcmVhLnpvb20gKCBzaGFwZSApXG4gICAgIC8vIGFyZWEuaXNvbGF0ZSAoIHNoYXBlIClcbn0pXG5cbmNvbW1hbmQgKCBcInBhY2stdmlld1wiLCAoKSA9Plxue1xuICAgICBhcmVhLnBhY2sgKClcbn0pXG5cbi8vIHRlc3RcblxuaWYgKCBuYXZpZ2F0b3IubWF4VG91Y2hQb2ludHMgPiAwIClcbntcblxuICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lciAoIFwicG9pbnRlcm1vdmVcIiwgZXZlbnQgPT5cbiAgICAge1xuICAgICAgICAgIC8vY29uc3QgdGFyZ2V0ID0gYXJlYS5mY2FudmFzLmZpbmRUYXJnZXQgKCBldmVudCwgdHJ1ZSApXG4gICAgICAgICAgLy9pZiAoIHRhcmdldCApXG4gICAgICAgICAgLy8gICAgIGNvbnNvbGUubG9nICggdGFyZ2V0IClcbiAgICAgfSlcbn1cbmVsc2VcbntcbiAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIgKCBcIm1vdXNlbW92ZVwiLCBldmVudCA9PlxuICAgICB7XG4gICAgICAgICAgLy9jb25zdCB0YXJnZXQgPSBhcmVhLmZjYW52YXMuZmluZFRhcmdldCAoIGV2ZW50LCB0cnVlIClcbiAgICAgICAgICAvL2lmICggdGFyZ2V0IClcbiAgICAgICAgICAvLyAgICAgY29uc29sZS5sb2cgKCB0YXJnZXQgKVxuICAgICB9KVxufVxuXG4vLyAjZW5kcmVnaW9uXG5cbi8vICNyZWdpb24gTUVOVVxuXG5leHBvcnQgY29uc3QgbWVudSA9IHVpLm1ha2UgPFNpZGVNZW51LCAkU2lkZU1lbnU+ICh7XG4gICAgIGNvbnRleHQgICAgICA6IENPTlRFWFRfVUksXG4gICAgIHR5cGUgICAgICAgICA6IFwic2lkZS1tZW51XCIsXG4gICAgIGlkICAgICAgICAgICA6IFwibWVudVwiLFxuICAgICBoYXNNYWluQnV0dG9uOiB0cnVlLFxuICAgICBkaXJlY3Rpb24gICAgOiBcImJ0XCJcbn0pXG5kb2N1bWVudC5ib2R5LmFwcGVuZCAoIC4uLiBtZW51LmdldEh0bWwgKCkgKVxuXG4vLyAjZW5kcmVnaW9uXG5cbi8vICNyZWdpb24gUEFORUxcblxudmFyIGRpcmVjdGlvbiA9IFwicmxcIiBhcyBcInJsXCIgfCBcImxyXCIgfCBcInRiXCIgfCBcImJ0XCJcblxuZXhwb3J0IGNvbnN0IHBhbmVsID0gdWkubWFrZSA8U2lkZU1lbnUsICRTaWRlTWVudT4gKHtcbiAgICAgY29udGV4dCAgICAgIDogQ09OVEVYVF9VSSxcbiAgICAgdHlwZSAgICAgICAgIDogXCJzaWRlLW1lbnVcIixcbiAgICAgaWQgICAgICAgICAgIDogdW5kZWZpbmVkLFxuICAgICBkaXJlY3Rpb24gICAgOiBkaXJlY3Rpb24sXG4gICAgIGhhc01haW5CdXR0b246IHRydWUsXG5cbiAgICAgYnV0dG9uczogW3tcbiAgICAgICAgICBjb250ZXh0IDogQ09OVEVYVF9VSSxcbiAgICAgICAgICB0eXBlICAgIDogXCJidXR0b25cIixcbiAgICAgICAgICBpZCAgICAgIDogXCJjb25zb2xlXCIsXG4gICAgICAgICAgaWNvbiAgICA6IFwi4pqgXCIsXG4gICAgICAgICAgdGV4dCAgICA6IFwiXCIsXG4gICAgICAgICAgaGFuZGxlT246IFwiKlwiLFxuICAgICAgICAgIGNvbW1hbmQgOiBcInBhY2stdmlld1wiXG4gICAgIH1dLFxuXG4gICAgIGNoaWxkcmVuOiBbe1xuICAgICAgICAgIGNvbnRleHQgOiBDT05URVhUX1VJLFxuICAgICAgICAgIHR5cGUgICAgOiBcInNraWxsLXZpZXdlclwiLFxuICAgICAgICAgIGlkICAgICAgOiBcInNsaWRlLXNraWxsXCIsXG4gICAgICAgICAgcG9zaXRpb246IFwibGVmdFwiLFxuICAgICAgICAgIGJ1dHRvbiA6IHtcbiAgICAgICAgICAgICAgIGNvbnRleHQgOiBDT05URVhUX1VJLFxuICAgICAgICAgICAgICAgdHlwZSAgICA6IFwiYnV0dG9uXCIsXG4gICAgICAgICAgICAgICBpZCAgICAgIDogXCJza2lsbHNcIixcbiAgICAgICAgICAgICAgIGljb24gICAgOiBcIlwiLFxuICAgICAgICAgICAgICAgdGV4dCAgICA6IFwiU2tpbGxzXCIsXG4gICAgICAgICAgICAgICBoYW5kbGVPbjogXCIqXCIsXG4gICAgICAgICAgfSxcbiAgICAgfSx7XG4gICAgICAgICAgY29udGV4dCA6IENPTlRFWFRfVUksXG4gICAgICAgICAgdHlwZSAgICA6IFwicGVyc29uLXZpZXdlclwiLFxuICAgICAgICAgIGlkICAgICAgOiBcInNsaWRlLXBlcnNvblwiLFxuICAgICAgICAgIHBvc2l0aW9uOiBcImxlZnRcIixcbiAgICAgICAgICBidXR0b24gOiB7XG4gICAgICAgICAgICAgICBjb250ZXh0IDogQ09OVEVYVF9VSSxcbiAgICAgICAgICAgICAgIHR5cGUgICAgOiBcImJ1dHRvblwiLFxuICAgICAgICAgICAgICAgaWQgICAgICA6IFwicHJvcGVydGllc1wiLFxuICAgICAgICAgICAgICAgaWNvbiAgICA6IFwiXCIsXG4gICAgICAgICAgICAgICB0ZXh0ICAgIDogXCJQcm9wZXJ0aWVzXCIsXG4gICAgICAgICAgICAgICBoYW5kbGVPbjogXCIqXCIsXG4gICAgICAgICAgfSxcbiAgICAgfV1cbn0pXG5cbmRvY3VtZW50LmJvZHkuYXBwZW5kICggLi4uIHBhbmVsLmdldEh0bWwgKCkgKVxuXG4vLyBQYW5uZWxzIGNvbW1hbmRzXG5cbmNvbnN0IHNsaWRlSW5mb3MgPSB1aS5waWNrIDxTa2lsbFZpZXdlcj4gKCBcInNraWxsLXZpZXdlclwiLCBcInNsaWRlLXNraWxsXCIgKVxuXG5jb21tYW5kICggXCJvcGVuLXBhbmVsXCIsICggbmFtZSwgLi4uIGNvbnRlbnQgKSA9Plxue1xuICAgICAvLyBpZiAoIG5hbWUgKVxuICAgICAvLyAgICAgIHNsaWRlc2hvdy5zaG93ICggbmFtZSwgLi4uIGNvbnRlbnQgKVxuICAgICAvLyBlbHNlXG4gICAgIC8vICAgICAgcGFuZWwub3BlbiAoKVxufSlcblxuY29tbWFuZCAoIFwib3Blbi1pbmZvcy1wYW5lbFwiLCAoIGUgKSA9Plxue1xuICAgICBjb25zdCBhc3BlY3QgPSBnZXQgKCBBcmVhLmN1cnJlbnRFdmVudC50YXJnZXQgKVxuXG4gICAgIGlmICggYXNwZWN0IClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHNraWxsID0gZGF0YSAoIGFzcGVjdC5jb25maWcudHlwZSwgYXNwZWN0LmNvbmZpZy5pZCApXG4gICAgICAgICAgaWYgKCBza2lsbCApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgc2xpZGVJbmZvcy5kaXNwbGF5ICggc2tpbGwgYXMgYW55IClcbiAgICAgICAgICAgICAgIHBhbmVsLm9wZW4gKClcbiAgICAgICAgICB9XG4gICAgIH1cbn0pXG5cbmNvbW1hbmQgKCBcImNsb3NlLXBhbmVsXCIgLCAoKSA9Plxue1xuICAgICBwYW5lbC5jbG9zZSAoKVxufSlcblxuLy8gI2VuZHJlZ2lvblxuXG4vLyAjcmVnaW9uIEFQUExJQ0FUSU9OXG5cbmNvbW1hbmQgKCBcIm9wZW4tbWVudVwiLCAoKSA9Plxue1xuICAgICBwYW5lbC5jbG9zZSAoKVxuICAgICBjb250ZXh0dWFsTWVudS5oaWRlICgpXG59KVxuY29tbWFuZCAoIFwib3Blbi1wYW5lbFwiLCAoKSA9Plxue1xuICAgICBtZW51LmNsb3NlICgpXG4gICAgIGNvbnRleHR1YWxNZW51LmhpZGUgKClcbn0pXG5cbmV4cG9ydCBmdW5jdGlvbiB3aWR0aCAoKVxue1xuICAgICByZXR1cm4gYXJlYS5mY2FudmFzLmdldFdpZHRoICgpXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBoZWlnaHQgKClcbntcbiAgICAgcmV0dXJuIGFyZWEuZmNhbnZhcy5nZXRIZWlnaHQgKClcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlZnJlc2ggKClcbntcbiAgICAgLy8kYXJlYS5zZXRab29tICgwLjEpXG4gICAgIGFyZWEuZmNhbnZhcy5yZXF1ZXN0UmVuZGVyQWxsICgpXG59XG5cbi8vICNlbmRyZWdpb25cbiIsIi8vLyA8cmVmZXJlbmNlIHR5cGVzPVwiZmFrZXJcIiAvPlxuZGVjbGFyZSBjb25zdCBmYWtlcjogRmFrZXIuRmFrZXJTdGF0aWNcblxuaW1wb3J0ICogYXMgYXBwIGZyb20gXCJAYXBwXCJcbmltcG9ydCB7IGRhdGEsIGFsaWFzIH0gZnJvbSBcIkBhcGlcIlxuXG5jb25zdCByYW5kb21JbnQgPSAobWluOiBudW1iZXIsIG1heDogbnVtYmVyKSA9Plxue1xuICAgICByZXR1cm4gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogKG1heCAtIG1pbiArIDEpKSArIG1pbjtcbn1cblxuY29uc3QgYXJlYSA9IGFwcC5hcmVhXG5jb25zdCB2aWV3ID0gYXJlYS5jcmVhdGVWaWV3ICggXCJjb21ww6l0YW5jZXNcIiApXG5hcmVhLnVzZSAoIHZpZXcgKVxuXG5jb25zdCBwZXJzb24gPSBhbGlhcyA8JFBlcnNvbj4gKCBkYXRhLCBcInBlcnNvblwiIClcbmNvbnN0IGJhZGdlICA9IGFsaWFzIDwkQmFkZ2U+ICAoIGRhdGEsIFwiYmFkZ2VcIiApXG5jb25zdCBza2lsbCAgPSBhbGlhcyA8JFNraWxsPiAgKCBkYXRhLCBcInNraWxsXCIgKVxuXG4vLyBJY2kgb24gYWpvdXRlIGRlcyBwZXJzb25uZXMgw6AgbOKAmWFwcGxpY2F0aW9uLlxuXG5jb25zdCBwZXJzb25OYW1lcyA9IFtdXG5mb3IgKCB2YXIgaSA9IDEgOyBpIDw9IDIwIDsgaSsrIClcbntcbiAgICAgcGVyc29uICh7XG4gICAgICAgICAgaWQgICAgICAgOiBcInVzZXJcIiArIGksXG4gICAgICAgICAgZmlyc3ROYW1lOiBmYWtlci5uYW1lLmZpcnN0TmFtZSAoKSxcbiAgICAgICAgICBsYXN0TmFtZSA6IGZha2VyLm5hbWUubGFzdE5hbWUgKCksXG4gICAgICAgICAgYXZhdGFyICAgOiBgLi9hdmF0YXJzL2YgKCR7aX0pLmpwZ2AsXG4gICAgICAgICAgaXNDYXB0YWluOiByYW5kb21JbnQgKDAsNCkgPT0gMSAvL2kgJSA0ID09IDAsXG4gICAgIH0pXG5cbiAgICAgcGVyc29uICh7XG4gICAgICAgICAgaWQgICAgICAgOiBcInVzZXJcIiArICgyMCArIGkpLFxuICAgICAgICAgIGZpcnN0TmFtZTogZmFrZXIubmFtZS5maXJzdE5hbWUgKCksXG4gICAgICAgICAgbGFzdE5hbWUgOiBmYWtlci5uYW1lLmxhc3ROYW1lICgpLFxuICAgICAgICAgIGF2YXRhciAgIDogYC4vYXZhdGFycy9oICgke2l9KS5qcGdgLFxuICAgICAgICAgIGlzQ2FwdGFpbjogcmFuZG9tSW50ICgwLDQpID09IDEgLy8gKDIwICsgaSkgJSA0ID09IDAsXG4gICAgIH0pXG5cbiAgICAgcGVyc29uTmFtZXMucHVzaCAoIFwidXNlclwiICsgaSwgXCJ1c2VyXCIgKyAoMjAgKyBpKSApXG5cbiAgICAgLy8gYXJlYS5hZGQgKCBcInBlcnNvblwiLCBcInVzZXJcIiArIGkgKVxuICAgICAvLyBhcmVhLmFkZCAoIFwicGVyc29uXCIsIFwidXNlclwiICsgKGkgKyAyMCkgKVxufVxuXG4vLyBCYWRnZXNcblxuLy8gaHR0cHM6Ly9kcml2ZS5nb29nbGUuY29tL2RyaXZlL2ZvbGRlcnMvMUt3V2w5R19BOHY5MU5MWEFwalpHSENmbnhfbW5mTUU0XG4vLyBodHRwczovL3JlY29ubmFpdHJlLm9wZW5yZWNvZ25pdGlvbi5vcmcvcmVzc291cmNlcy9cbi8vIGh0dHBzOi8vd3d3LmxldHVkaWFudC5mci9lZHVjcHJvcy9hY3R1YWxpdGUvbGVzLW9wZW4tYmFkZ2VzLXVuLWNvbXBsZW1lbnQtYXV4LWRpcGxvbWVzLXVuaXZlcnNpdGFpcmVzLmh0bWxcblxuLy8gaHR0cHM6Ly93d3cuZWNob3NjaWVuY2VzLW5vcm1hbmRpZS5mci9jb21tdW5hdXRlcy9sZS1kb21lL2FydGljbGVzL2JhZGdlLWRvbWVcblxuY29uc3QgYmFkZ2VzID0gW1xuICAgICBiYWRnZSAoIFwiZGVmYXVsdFwiICAgICAgLCB7IGVtb2ppOiBcIvCfpoFcIiB9ICksXG4gICAgIGJhZGdlICggXCJoYXRcIiAgICAgICAgICAsIHsgZW1vamk6IFwi8J+OqVwiIH0gKSxcbiAgICAgYmFkZ2UgKCBcInN0YXJcIiAgICAgICAgICwgeyBlbW9qaTogXCLirZBcIiB9ICksXG4gICAgIGJhZGdlICggXCJjbG90aGVzXCIgICAgICAsIHsgZW1vamk6IFwi8J+RlVwiIH0gKSxcbiAgICAgYmFkZ2UgKCBcImVjb2xvZ3lcIiAgICAgICwgeyBlbW9qaTogXCLwn5KnXCIgfSApLFxuICAgICBiYWRnZSAoIFwicHJvZ3JhbW1pbmdcIiAgLCB7IGVtb2ppOiBcIvCfkr5cIiB9ICksXG4gICAgIGJhZGdlICggXCJjb21tdW5pY2F0aW9uXCIsIHsgZW1vamk6IFwi8J+TolwiIH0gKSxcbiAgICAgYmFkZ2UgKCBcImNvbnN0cnVjdGlvblwiICwgeyBlbW9qaTogXCLwn5SoXCIgfSApLFxuICAgICBiYWRnZSAoIFwiYmlvbG9neVwiICAgICAgLCB7IGVtb2ppOiBcIvCflKxcIiB9ICksXG4gICAgIGJhZGdlICggXCJyb2JvdGljXCIgICAgICAsIHsgZW1vamk6IFwi8J+kllwiIH0gKSxcbiAgICAgYmFkZ2UgKCBcImdhbWVcIiAgICAgICAgICwgeyBlbW9qaTogXCLwn6ShXCIgfSApLFxuICAgICBiYWRnZSAoIFwibXVzaWNcIiAgICAgICAgLCB7IGVtb2ppOiBcIvCfpYFcIiB9ICksXG4gICAgIGJhZGdlICggXCJsaW9uXCIgICAgICAgICAsIHsgZW1vamk6IFwi8J+mgVwiIH0gKSxcbiAgICAgYmFkZ2UgKCBcInZvbHRhZ2VcIiAgICAgICwgeyBlbW9qaTogXCLimqFcIiB9IClcbl1cblxuLy8gU2tpbGxzXG5cbi8vZm9yICggY29uc3QgbmFtZSBpbiBiYWRnZVByZXNldHMgKVxuZm9yICggY29uc3QgYmFkZ2Ugb2YgYmFkZ2VzIClcbntcbiAgICAgY29uc3QgcGVvcGxlID0gW10gYXMgJFBlcnNvbiBbXVxuXG4gICAgIGZvciAoIHZhciBqID0gcmFuZG9tSW50ICggMCwgNiApIDsgaiA+IDAgOyBqLS0gKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgbmFtZSA9IHBlcnNvbk5hbWVzLnNwbGljZSAoIHJhbmRvbUludCAoIDEsIHBlcnNvbk5hbWVzLmxlbmd0aCApLCAxICkgWzBdXG4gICAgICAgICAgaWYgKCBuYW1lIClcbiAgICAgICAgICAgICAgIHBlb3BsZS5wdXNoICggZGF0YSA8JFBlcnNvbj4gKCBcInBlcnNvblwiLCBuYW1lICkgKVxuICAgICB9XG5cbiAgICAgc2tpbGwgKHtcbiAgICAgICAgICBpZCAgICAgOiBiYWRnZS5pZCxcbiAgICAgICAgICBpY29uICAgOiBiYWRnZS5pZCxcbiAgICAgICAgICBpdGVtcyAgOiBwZW9wbGVcbiAgICAgfSlcblxufVxuXG4vL1xuXG5mb3IgKCBjb25zdCBiYWRnZSBvZiBiYWRnZXMgKVxuICAgICBhcmVhLmFkZCAoIFwic2tpbGxcIiwgYmFkZ2UuaWQgKVxuXG4vLyBOb3Rlc1xuXG4vLyBjb25zdCBub3RlID0gIG5ldyBCLk5vdGUgKHtcbi8vICAgICAgdGV4dDogXCJBIG5vdGUgLi4uXCIsXG4vLyB9KVxuLy8gYXJlYS5hZGQgKCBBc3BlY3QuY3JlYXRlICggbm90ZSApIClcblxuXG5hcmVhLnBhY2sgKClcbmFyZWEuem9vbSAoKVxuXG5cbi8vIENsdXN0ZXIgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vXG4vLyBjb25zdCB0MSA9IG5ldyBmYWJyaWMuVGV4dGJveCAoIFwiRWRpdGFibGUgP1wiLCB7XG4vLyAgICAgIHRvcDogNTAsXG4vLyAgICAgIGxlZnQ6IDMwMCxcbi8vICAgICAgZm9udFNpemU6IDMwLFxuLy8gICAgICBzZWxlY3RhYmxlOiB0cnVlLFxuLy8gICAgICBlZGl0YWJsZTogdHJ1ZSxcbi8vICAgICAgb3JpZ2luWDogXCJjZW50ZXJcIixcbi8vICAgICAgb3JpZ2luWTogXCJjZW50ZXJcIixcbi8vIH0pXG4vLyBjb25zdCByMSA9IG5ldyBmYWJyaWMuUmVjdCAoe1xuLy8gICAgICB0b3AgICA6IDAsXG4vLyAgICAgIGxlZnQgIDogMzAwLFxuLy8gICAgICB3aWR0aCA6IDUwLFxuLy8gICAgICBoZWlnaHQ6IDUwLFxuLy8gICAgICBmaWxsICA6IFwiYmx1ZVwiLFxuLy8gICAgICBzZWxlY3RhYmxlOiB0cnVlLFxuLy8gICAgICBvcmlnaW5YOiBcImNlbnRlclwiLFxuLy8gICAgICBvcmlnaW5ZOiBcImNlbnRlclwiLFxuLy8gfSlcbi8vICRhcHAuX2xheW91dC5hcmVhLmFkZCAodDEpXG4vLyAkYXBwLl9sYXlvdXQuYXJlYS5hZGQgKHIxKVxuLy8gdDFbXCJjbHVzdGVyXCJdID0gWyByMSBdXG4vLyByMVtcImNsdXN0ZXJcIl0gPSBbIHQxIF1cblxuIl0sIm5hbWVzIjpbIk5vZGUiLCJGYWN0b3J5IiwiR2VvbWV0cnkiLCJkYiIsImZhY3RvcnkiLCJzZXQiLCJub3JtYWxpemUiLCJkZWZpbmUiLCJkYi5kYXRhIiwiYXNwZWN0LmdldCIsIkdlb21ldHJ5LnBhY2tFbmNsb3NlIiwiZGVmYXVsdENvbmZpZyIsImRyYWdnYWJsZSIsIlVpLmRyYWdnYWJsZSIsIkNzcy5nZXRVbml0IiwiU3ZnLmNyZWF0ZVN2Z1NoYXBlIiwidWkubWFrZSIsInVpLnBpY2siLCJhcmVhIiwiYXBwLmFyZWEiXSwibWFwcGluZ3MiOiI7OzthQWdDZ0IscUJBQXFCLENBQUcsT0FBcUI7UUFFekQsTUFBTSxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsSUFBSSxDQUFBO1FBRTdCLE1BQU0sQ0FBQyxHQUFVLE9BQU8sQ0FBQyxDQUFDLElBQVcsRUFBRSxDQUFBO1FBQ3ZDLE1BQU0sS0FBSyxHQUFNLE9BQU8sQ0FBQyxLQUFLLElBQU8sRUFBRSxDQUFBO1FBQ3ZDLE1BQU0sUUFBUSxHQUFHLE9BQU8sQ0FBQyxRQUFRLElBQUksQ0FBQyxDQUFBO1FBRXRDLE1BQU0sTUFBTSxHQUFHLEVBQWEsQ0FBQTtRQUU1QixNQUFNLENBQUMsR0FBTyxDQUFDLEdBQUcsRUFBRSxHQUFHLEtBQUssQ0FBQTtRQUM1QixNQUFNLEtBQUssR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBRyxDQUFDLEdBQUcsR0FBRyxDQUFFLENBQUE7UUFDckMsTUFBTSxJQUFJLEdB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QUFHLEVBQUUsR0FBRyxFQUFFLEVBQ1osRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQ1osRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQ1osRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQ1osRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBRVosRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxFQUNoQyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxFQUNyQyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxFQUVyQyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxFQUN0QixFQUFFLEdBQUcsQ0FBRSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEtBQU8sRUFBRSxHQUFHLENBQUMsQ0FBRSxHQUFHLEVBQUUsRUFDNUMsRUFBRSxHQUFHLENBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxJQUFLLEVBQUUsRUFDL0IsRUFBRSxHQUFHLENBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxLQUFPLEVBQUUsR0FBRyxDQUFDLENBQUUsR0FBRyxFQUFFLEVBQzVDLEVBQUUsR0FBRyxDQUFFLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsSUFBSyxFQUFFLEVBRS9CLENBQUMsR0FBSSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUMxQixDQUFDLEdBQUksQ0FBQyxJQUFLLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUUsRUFDbkMsQ0FBQyxHQUFJLEVBQUUsR0FBRyxF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QUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLElBQUUsQ0FBQztRQUM1RCxXQUFXLEVBQUssQ0FBRSxDQUFTLEtBQU0sQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDO1FBQ3RDLFlBQVksRUFBSSxDQUFFLENBQVMsS0FBTSxDQUFDLEVBQUUsQ0FBQyxJQUFFLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQztRQUM1QyxjQUFjLEVBQUUsQ0FBRSxDQUFTLEtBQU0sQ0FBQyxHQUFDLEVBQUUsR0FBRyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxLQUFHLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLElBQUUsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDO1FBQ3pFLFdBQVcsRUFBSyxDQUFFLENBQVMsS0FBTSxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDO1FBQ3hDLFlBQVksRUFBSSxDQUFFLENBQVMsS0FBTSxDQUFDLEdBQUMsQ0FBQyxFQUFFLENBQUMsSUFBRSxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUM7UUFDOUMsY0FBYyxFQUFFLENBQUUsQ0FBUyxLQUFNLENBQUMsR0FBQyxFQUFFLEdBQUcsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsR0FBRyxDQUFDLEdBQUMsQ0FBQyxJQUFFLEVBQUUsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDO1FBQ25FLFdBQVcsRUFBSyxDQUFFLENBQVMsS0FBTSxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQztRQUMxQyxZQUFZLEVBQUksQ0FBRSxDQUFTLEtBQU0sQ0FBQyxHQUFDLENBQUMsRUFBRSxDQUFDLElBQUUsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQztRQUNo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
