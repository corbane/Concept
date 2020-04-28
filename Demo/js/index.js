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
    const db = new Database();
    const factory = new Factory(db);
    const ASPECT = Symbol.for("ASPECT");
    /**
     * Assigne si besoin le contexte "aspect" au noeud
     */
    function normalize(node) {
        if ("context" in node) {
            if (node.context !== CONTEXT)
                throw "Bad context value";
        }
        else {
            node.context = CONTEXT;
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
        if (factory.inStock(CONTEXT, obj.type, obj.id))
            return factory.make(CONTEXT, obj.type, obj.id);
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
        const shape = factory.make(options);
        // shape.events = arguments.events
        // Object.assign ( shape, events )
        //shape.init ()
        shape.group[ASPECT] = shape;
        if (shape.config.onCreate)
            shape.config.onCreate(shape.config.data, shape);
        return shape;
    }
    function setAspect(node) {
        db.set(normalize(node));
    }
    function defineAspect(ctor, type) {
        factory._define(ctor, [CONTEXT, type]);
    }

    /// <reference path="./nodes.d.ts" />
    Object.defineProperty(globalThis, "CONTEXT_DATA", {
        configurable: false,
        writable: false,
        value: "concept-data"
    });
    const db$1 = new Database();
    function node(a, b) {
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
                    return db$1.get(CONTEXT_DATA, a, b);
                if (typeof b != "object" || b == null || Array.isArray(b))
                    throw `Bad argument "description" : ${b}`;
                b.context = CONTEXT_DATA;
                b.type = a;
                return db$1.set(b);
            default:
                throw `Bad arguments: 2 arguments expected but ${arguments.length} received`;
        }
    }

    class Badge extends Shape {
        constructor(options) {
            super(options);
            this.owner = undefined;
            this.position = { angle: 0, offset: 0 };
            const { group } = this;
            const thisdata = this.config.data;
            const entity = node(thisdata.type, thisdata.id);
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
                const node$1 = node(arguments[0], arguments[1]);
                const shp = getAspect(node$1);
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
                        const element = getAspect(fevent.target);
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
                    const element = getAspect(fevent.target);
                    Area.currentEvent = fevent;
                    if (element)
                        this.onOverObject(element);
                    Area.currentEvent = null;
                }
            });
            page.on("mouse:out", fevent => {
                this.overFObject = undefined;
                if (this.onOutObject) {
                    const element = getAspect(fevent.target);
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

    // <reference path="../Data/index.ts" />
    Object.defineProperty(globalThis, "CONTEXT_UI", {
        enumerable: false,
        configurable: false,
        writable: false,
        value: "concept-ui"
    });
    //const CONTEXT_UI = "concept-ui"
    const db$2 = new Database();
    const factory$1 = new Factory(db$2);
    const inStock = function () {
        const arg = arguments.length == 1
            ? normalize$1(arguments[0])
            : normalize$1([...arguments]);
        const path = factory$1.getPath(arg);
        return factory$1._inStock(path);
    };
    const pick = function (...rest) {
        const arg = arguments.length == 1
            ? normalize$1(arguments[0])
            : normalize$1([...arguments]);
        const path = factory$1.getPath(arg);
        return factory$1._pick(path);
    };
    const make = function () {
        const arg = arguments.length == 1
            ? normalize$1(arguments[0])
            : normalize$1([...arguments]);
        const path = factory$1.getPath(arg);
        if (isNode(arg))
            var data = arg;
        return factory$1._make(path, data);
    };
    const set = function () {
        const arg = normalize$1(arguments[0]);
        if (arguments.length == 1)
            db$2.set(arg);
        else
            db$2.set(arg, normalize$1(arguments[1]));
    };
    const define = factory$1.define.bind(factory$1);
    //export const define: typeof factory.define = function ( ctor: any, ... rest: any )
    //{
    //     const arg = rest.length == 1
    //               ? normalize ( rest [0] )
    //               : normalize ( [... rest] )
    //
    //     const path = factory.getPath ( arg )
    //
    //     factory._define ( ctor, path )
    //}
    function isNode(obl) {
        return typeof obl == "object" && !Array.isArray(obl);
    }
    function normalize$1(arg) {
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

    //export /*abstract*/ class Panel <C extends $Panel = $Panel> extends Component <C>
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
                const person = node(item.type, item.id);
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

    defineAspect(Shape, "person" /* , { onCreate: () => ..., onTouch: () => ... } */);
    defineAspect(Group, "skill");
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
            const data = node("badge", skill.icon);
            const badge = getAspect(data);
            badge.attach(aspect);
        },
        onTouch(shape) {
            command("open-infos-panel").run();
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

    const command$1 = command;
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
        command$1("open-contextal-menu").run();
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
    command$1("open-contextal-menu", (e) => {
        contextualMenu.show(e.pointer.x, e.pointer.y);
    });
    command$1("close-contextal-menu", () => {
        contextualMenu.hide();
    });
    command$1("add-skill", (title) => {
        console.log("Add skill");
    });
    command$1("add-person", (name) => {
    });
    command$1("zoom-extends", () => {
        area.zoom();
    });
    command$1("zoom-to", (shape) => {
        // area.zoom ( shape )
        // area.isolate ( shape )
    });
    command$1("pack-view", () => {
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
    command$1("open-panel", (name, ...content) => {
        // if ( name )
        //      slideshow.show ( name, ... content )
        // else
        //      panel.open ()
    });
    command$1("open-infos-panel", (e) => {
        const aspect = getAspect(Area.currentEvent.target);
        if (aspect) {
            const skill = node(aspect.config.type, aspect.config.id);
            if (skill) {
                slideInfos.display(skill);
                panel.open();
            }
        }
    });
    command$1("close-panel", () => {
        panel.close();
    });
    // #endregion
    // #region APPLICATION
    command$1("open-menu", () => {
        panel.close();
        contextualMenu.hide();
    });
    command$1("open-panel", () => {
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
    // Ici on ajoute des personnes à l’application.
    const personNames = [];
    for (var i = 1; i <= 20; i++) {
        node({
            context: CONTEXT_DATA,
            type: "person",
            id: "user" + i,
            firstName: faker.name.firstName(),
            lastName: faker.name.lastName(),
            avatar: `./avatars/f (${i}).jpg`,
            isCaptain: randomInt(0, 4) == 1 //i % 4 == 0,
        });
        node({
            context: CONTEXT_DATA,
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
        node(Object.assign({ context: CONTEXT_DATA, type: "badge" }, badgePresets[name]));
    // Skills
    for (const name in badgePresets) {
        const people = [];
        for (var j = randomInt(0, 6); j > 0; j--) {
            const name = personNames.splice(randomInt(1, personNames.length), 1)[0];
            if (name)
                people.push(node("person", name));
        }
        node({
            context: CONTEXT_DATA,
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzIjpbIi4uLy4uL0xpYi9nZW9tZXRyeS9kaXN0cmlidXRlLnRzIiwiLi4vLi4vTGliL2dlb21ldHJ5L2QzLWVuY2xvc2UudHMiLCIuLi8uLi9MaWIvZ2VvbWV0cnkvZDMtcGFjay50cyIsIi4uLy4uL0xpYi9jc3MvdW5pdC50cyIsIi4uLy4uL0RhdGEvbm9kZS50cyIsIi4uLy4uL0RhdGEvZGF0YS10cmVlLnRzIiwiLi4vLi4vRGF0YS9kYi50cyIsIi4uLy4uL0RhdGEvZmFjdG9yeS50cyIsIi4uLy4uL0FzcGVjdC9nZW9tZXRyeS50cyIsIi4uLy4uL0FzcGVjdC9zaGFwZS50cyIsIi4uLy4uL0FzcGVjdC9kYi50cyIsIi4uLy4uL0FwcGxpY2F0aW9uL2RhdGEudHMiLCIuLi8uLi9Bc3BlY3QvYmFkZ2UudHMiLCIuLi8uLi9Bc3BlY3QvZ3JvdXAudHMiLCIuLi8uLi9VaS9CYXNlL3hub2RlLnRzIiwiLi4vLi4vVWkvQmFzZS9kcmFnZ2FibGUudHMiLCIuLi8uLi9VaS9CYXNlL2RvbS50cyIsIi4uLy4uL1VpL0Jhc2UvZXhwZW5kYWJsZS50cyIsIi4uLy4uL1VpL0Jhc2Uvc3dpcGVhYmxlLnRzIiwiLi4vLi4vVWkvRWxlbWVudHMvYXJlYS50cyIsIi4uLy4uL1VpL2NvbW1hbmQudHMiLCIuLi8uLi9VaS9FbGVtZW50cy9jb21wb25lbnQudHN4IiwiLi4vLi4vVWkvZGIudHMiLCIuLi8uLi9VaS9FbGVtZW50cy9jb250YWluZXIudHN4IiwiLi4vLi4vVWkvRWxlbWVudHMvYnV0dG9uLnRzeCIsIi4uLy4uL1VpL0VsZW1lbnRzL3Rvb2xiYXIudHN4IiwiLi4vLi4vVWkvQmFzZS9zY3JvbGxhYmxlLnRzIiwiLi4vLi4vVWkvRWxlbWVudHMvc2lkZU1lbnUudHN4IiwiLi4vLi4vVWkvQmFzZS9zdmcudHN4IiwiLi4vLi4vVWkvRWxlbWVudHMvY2lyY2xlbWVudS50c3giLCIuLi8uLi9VaS9FbGVtZW50cy9wYW5lbC1wZXJzb24udHN4IiwiLi4vLi4vVWkvcGFuZWwudHMiLCIuLi8uLi9VaS9FbGVtZW50cy9wYW5lbC1za2lsbC50c3giLCIuLi8uLi9Bc3BlY3QvaW5kZXgudHMiLCIuLi8uLi9BcHBsaWNhdGlvbi9pbmRleC50cyIsIi4uL2luZGV4LnRzIl0sInNvdXJjZXNDb250ZW50IjpbIlxuXG5leHBvcnQgdHlwZSBSYWRpYWxPcHRpb24gPSB7XG4gICAgciAgICAgICAgOiBudW1iZXIsXG4gICAgY291bnQgICAgOiBudW1iZXIsXG4gICAgcGFkZGluZz8gOiBudW1iZXIsXG4gICAgcm90YXRpb24/OiBudW1iZXIsXG59XG5cbmV4cG9ydCB0eXBlIFJhZGlhbERlZmluaXRpb24gPSBSZXF1aXJlZCA8UmFkaWFsT3B0aW9uPiAmIHtcbiAgICBjeCAgICA6IG51bWJlcixcbiAgICBjeSAgICA6IG51bWJlcixcbiAgICB3aWR0aCA6IG51bWJlcixcbiAgICBoZWlnaHQ6IG51bWJlcixcbiAgICBwb2ludHM6IFBhcnQgW10sXG59XG5cbnR5cGUgUGFydCA9IHtcbiAgICB4IDogbnVtYmVyXG4gICAgeSA6IG51bWJlclxuICAgIGEgOiBudW1iZXJcbiAgICBhMTogbnVtYmVyXG4gICAgYTI6IG51bWJlclxuICAgIGNob3JkPzoge1xuICAgICAgICB4MSAgICA6IG51bWJlclxuICAgICAgICB5MSAgICA6IG51bWJlclxuICAgICAgICB4MiAgICA6IG51bWJlclxuICAgICAgICB5MiAgICA6IG51bWJlclxuICAgICAgICBsZW5ndGg6IG51bWJlclxuICAgIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFJhZGlhbERpc3RyaWJ1dGlvbiAoIG9wdGlvbnM6IFJhZGlhbE9wdGlvbiApXG57XG4gICAgY29uc3QgeyBQSSwgY29zLCBzaW4gfSA9IE1hdGhcblxuICAgIGNvbnN0IHIgICAgICAgID0gb3B0aW9ucy5yICAgICAgICB8fCAzMFxuICAgIGNvbnN0IGNvdW50ICAgID0gb3B0aW9ucy5jb3VudCAgICB8fCAxMFxuICAgIGNvbnN0IHJvdGF0aW9uID0gb3B0aW9ucy5yb3RhdGlvbiB8fCAwXG5cbiAgICBjb25zdCBwb2ludHMgPSBbXSBhcyBQYXJ0IFtdXG5cbiAgICBjb25zdCBhICAgICA9IDIgKiBQSSAvIGNvdW50XG4gICAgY29uc3QgY2hvcmQgPSAyICogciAqIHNpbiAoIGEgKiAwLjUgKVxuICAgIGNvbnN0IHNpemUgID0gciAqIDQgKyBjaG9yZFxuICAgIGNvbnN0IGMgICAgID0gc2l6ZSAvIDJcblxuICAgIGZvciAoIHZhciBpID0gMDsgaSA8IGNvdW50OyArK2kgKVxuICAgIHtcbiAgICAgICAgY29uc3Qgc3RhcnQgID0gYSAqIGkgKyByb3RhdGlvblxuICAgICAgICBjb25zdCBtaWRkbGUgPSBzdGFydCArIGEgKiAwLjVcbiAgICAgICAgY29uc3QgZW5kICAgID0gc3RhcnQgKyBhXG5cbiAgICAgICAgcG9pbnRzLnB1c2ggKHtcbiAgICAgICAgICAgIGExICAgOiBzdGFydCxcbiAgICAgICAgICAgIGEgICAgOiBtaWRkbGUsXG4gICAgICAgICAgICBhMiAgIDogZW5kLFxuICAgICAgICAgICAgeCAgICA6IGNvcyAobWlkZGxlKSAqIHIgKyBjLFxuICAgICAgICAgICAgeSAgICA6IHNpbiAobWlkZGxlKSAqIHIgKyBjLFxuICAgICAgICAgICAgY2hvcmQ6IHtcbiAgICAgICAgICAgICAgICB4MTogY29zIChzdGFydCkgKiByICsgYyxcbiAgICAgICAgICAgICAgICB5MTogc2luIChzdGFydCkgKiByICsgYyxcbiAgICAgICAgICAgICAgICB4MjogY29zIChlbmQpICAgKiByICsgYyxcbiAgICAgICAgICAgICAgICB5Mjogc2luIChlbmQpICAgKiByICsgYyxcbiAgICAgICAgICAgICAgICBsZW5ndGg6IGNob3JkXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgY29uc3QgcmVzdWx0OiBSYWRpYWxEZWZpbml0aW9uID0ge1xuICAgICAgICByLFxuICAgICAgICBjb3VudCxcbiAgICAgICAgcm90YXRpb24sXG4gICAgICAgIHBhZGRpbmc6IG9wdGlvbnMucGFkZGluZyB8fCAwLFxuICAgICAgICBjeCAgICAgOiBjLFxuICAgICAgICBjeSAgICAgOiBjLFxuICAgICAgICB3aWR0aCAgOiBzaXplLFxuICAgICAgICBoZWlnaHQgOiBzaXplLFxuICAgICAgICBwb2ludHNcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0XG59XG4iLCIvLyBodHRwczovL29ic2VydmFibGVocS5jb20vQGQzL2QzLXBhY2tlbmNsb3NlP2NvbGxlY3Rpb249QG9ic2VydmFibGVocS9hbGdvcml0aG1zXG4vLyBodHRwczovL29ic2VydmFibGVocS5jb20vQGQzL2NpcmNsZS1wYWNraW5nXG4vLyBodHRwczovL2dpdGh1Yi5jb20vZDMvZDMtaGllcmFyY2h5L2Jsb2IvbWFzdGVyL3NyYy9wYWNrL2VuY2xvc2UuanNcblxuXG5leHBvcnQgdHlwZSBDaXJjbGUgPSB7XG4gICAgIHg6IG51bWJlcixcbiAgICAgeTogbnVtYmVyLFxuICAgICByOiBudW1iZXJcbn1cblxuY29uc3Qgc2xpY2UgPSBBcnJheS5wcm90b3R5cGUuc2xpY2VcblxuZnVuY3Rpb24gc2h1ZmZsZSA8VD4gKCBhcnJheTogVFtdIClcbntcbiAgICAgdmFyIG0gPSBhcnJheS5sZW5ndGgsXG4gICAgICAgICAgdCxcbiAgICAgICAgICBpOiBudW1iZXJcblxuICAgICB3aGlsZSAoIG0gKVxuICAgICB7XG4gICAgICAgICAgaSA9IE1hdGgucmFuZG9tICgpICogbS0tIHwgMFxuICAgICAgICAgIHQgPSBhcnJheSBbbV1cbiAgICAgICAgICBhcnJheSBbbV0gPSBhcnJheSBbaV1cbiAgICAgICAgICBhcnJheSBbaV0gPSB0XG4gICAgIH1cblxuICAgICByZXR1cm4gYXJyYXlcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGVuY2xvc2UgKCBjaXJjbGVzOiBDaXJjbGVbXSApXG57XG4gICAgIGNpcmNsZXMgPSBzaHVmZmxlICggc2xpY2UuY2FsbCggY2lyY2xlcyApIClcblxuICAgICBjb25zdCBuID0gY2lyY2xlcy5sZW5ndGhcblxuICAgICB2YXIgaSA9IDAsXG4gICAgIEIgPSBbXSxcbiAgICAgcDogQ2lyY2xlLFxuICAgICBlOiBDaXJjbGU7XG5cbiAgICAgd2hpbGUgKCBpIDwgbiApXG4gICAgIHtcbiAgICAgICAgICBwID0gY2lyY2xlcyBbaV1cblxuICAgICAgICAgIGlmICggZSAmJiBlbmNsb3Nlc1dlYWsgKCBlLCBwICkgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGkrK1xuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgQiA9IGV4dGVuZEJhc2lzICggQiwgcCApXG4gICAgICAgICAgICAgICBlID0gZW5jbG9zZUJhc2lzICggQiApXG4gICAgICAgICAgICAgICBpID0gMFxuICAgICAgICAgIH1cbiAgICAgfVxuXG4gICAgIHJldHVybiBlXG59XG5cbmZ1bmN0aW9uIGV4dGVuZEJhc2lzICggQjogQ2lyY2xlW10sIHA6IENpcmNsZSApXG57XG4gICAgIHZhciBpOiBudW1iZXIsXG4gICAgIGo6IG51bWJlclxuXG4gICAgIGlmICggZW5jbG9zZXNXZWFrQWxsICggcCwgQiApIClcbiAgICAgICAgICByZXR1cm4gW3BdXG5cbiAgICAgLy8gSWYgd2UgZ2V0IGhlcmUgdGhlbiBCIG11c3QgaGF2ZSBhdCBsZWFzdCBvbmUgZWxlbWVudC5cbiAgICAgZm9yICggaSA9IDA7IGkgPCBCLmxlbmd0aDsgKytpIClcbiAgICAge1xuICAgICAgICAgIGlmICggZW5jbG9zZXNOb3QgKCBwLCBCIFtpXSApXG4gICAgICAgICAgJiYgZW5jbG9zZXNXZWFrQWxsICggZW5jbG9zZUJhc2lzMiAoIEIgW2ldLCBwICksIEIgKVxuICAgICAgICAgICl7XG4gICAgICAgICAgICAgICByZXR1cm4gWyBCW2ldLCBwIF1cbiAgICAgICAgICB9XG4gICAgIH1cblxuICAgICAvLyBJZiB3ZSBnZXQgaGVyZSB0aGVuIEIgbXVzdCBoYXZlIGF0IGxlYXN0IHR3byBlbGVtZW50cy5cbiAgICAgZm9yICggaSA9IDA7IGkgPCBCLmxlbmd0aCAtIDE7ICsraSApXG4gICAgIHtcbiAgICAgICAgICBmb3IgKCBqID0gaSArIDE7IGogPCBCLmxlbmd0aDsgKytqIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBpZiAoIGVuY2xvc2VzTm90ICAgICggZW5jbG9zZUJhc2lzMiAoIEIgW2ldLCBCIFtqXSAgICApLCBwIClcbiAgICAgICAgICAgICAgICYmIGVuY2xvc2VzTm90ICAgICggZW5jbG9zZUJhc2lzMiAoIEIgW2ldLCBwICAgICAgICApLCBCIFtqXSApXG4gICAgICAgICAgICAgICAmJiBlbmNsb3Nlc05vdCAgICAoIGVuY2xvc2VCYXNpczIgKCBCIFtqXSwgcCAgICAgICAgKSwgQiBbaV0gKVxuICAgICAgICAgICAgICAgJiYgZW5jbG9zZXNXZWFrQWxsKCBlbmNsb3NlQmFzaXMzICggQiBbaV0sIEIgW2pdLCBwICksIEIgKVxuICAgICAgICAgICAgICAgKXtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFsgQlsgaSBdLCBCWyBqIF0sIHAgXTtcbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgIH1cblxuICAgICAvLyBJZiB3ZSBnZXQgaGVyZSB0aGVuIHNvbWV0aGluZyBpcyB2ZXJ5IHdyb25nLlxuICAgICB0aHJvdyBuZXcgRXJyb3I7XG59XG5cbmZ1bmN0aW9uIGVuY2xvc2VzTm90ICggYTogQ2lyY2xlLCBiOiBDaXJjbGUgKVxue1xuICAgICBjb25zdCBkciA9IGEuciAtIGIuclxuICAgICBjb25zdCBkeCA9IGIueCAtIGEueFxuICAgICBjb25zdCBkeSA9IGIueSAtIGEueVxuXG4gICAgIHJldHVybiBkciA8IDAgfHwgZHIgKiBkciA8IGR4ICogZHggKyBkeSAqIGR5O1xufVxuXG5mdW5jdGlvbiBlbmNsb3Nlc1dlYWsgKCBhOiBDaXJjbGUsIGI6IENpcmNsZSApXG57XG4gICAgIHZhciBkciA9IGEuciAtIGIuciArIDFlLTYsXG4gICAgIGR4ID0gYi54IC0gYS54LFxuICAgICBkeSA9IGIueSAtIGEueVxuXG4gICAgIHJldHVybiBkciA+IDAgJiYgZHIgKiBkciA+IGR4ICogZHggKyBkeSAqIGR5XG59XG5cbmZ1bmN0aW9uIGVuY2xvc2VzV2Vha0FsbCAoIGE6IENpcmNsZSwgQjogQ2lyY2xlW10gKVxue1xuICAgICBmb3IgKCB2YXIgaSA9IDA7IGkgPCBCLmxlbmd0aDsgKytpIClcbiAgICAge1xuICAgICAgICAgIGlmICggISBlbmNsb3Nlc1dlYWsgKCBhLCBCW2ldICkgKVxuICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgIH1cbiAgICAgcmV0dXJuIHRydWVcbn1cblxuZnVuY3Rpb24gZW5jbG9zZUJhc2lzICggQjogQ2lyY2xlW10gKVxue1xuICAgICBzd2l0Y2ggKCBCLmxlbmd0aCApXG4gICAgIHtcbiAgICAgICAgICBjYXNlIDE6IHJldHVybiBlbmNsb3NlQmFzaXMxKCBCIFswXSApXG4gICAgICAgICAgY2FzZSAyOiByZXR1cm4gZW5jbG9zZUJhc2lzMiggQiBbMF0sIEIgWzFdIClcbiAgICAgICAgICBjYXNlIDM6IHJldHVybiBlbmNsb3NlQmFzaXMzKCBCIFswXSwgQiBbMV0sIEIgWzJdIClcbiAgICAgfVxufVxuXG5mdW5jdGlvbiBlbmNsb3NlQmFzaXMxICggYTogQ2lyY2xlIClcbntcbiAgICAgcmV0dXJuIHtcbiAgICAgICAgICB4OiBhLngsXG4gICAgICAgICAgeTogYS55LFxuICAgICAgICAgIHI6IGEuclxuICAgICB9O1xufVxuXG5mdW5jdGlvbiBlbmNsb3NlQmFzaXMyICggYTogQ2lyY2xlLCBiOiBDaXJjbGUgKVxue1xuICAgICBjb25zdCB7IHg6IHgxLCB5OiB5MSwgcjogcjEgfSA9IGFcbiAgICAgY29uc3QgeyB4OiB4MiwgeTogeTIsIHI6IHIyIH0gPSBiXG5cbiAgICAgdmFyIHgyMSA9IHgyIC0geDEsXG4gICAgIHkyMSA9IHkyIC0geTEsXG4gICAgIHIyMSA9IHIyIC0gcjEsXG4gICAgIGwgICA9IE1hdGguc3FydCggeDIxICogeDIxICsgeTIxICogeTIxICk7XG5cbiAgICAgcmV0dXJuIHtcbiAgICAgICAgICB4OiAoIHgxICsgeDIgKyB4MjEgLyBsICogcjIxICkgLyAyLFxuICAgICAgICAgIHk6ICggeTEgKyB5MiArIHkyMSAvIGwgKiByMjEgKSAvIDIsXG4gICAgICAgICAgcjogKCBsICsgcjEgKyByMiApIC8gMlxuICAgICB9O1xufVxuXG5mdW5jdGlvbiBlbmNsb3NlQmFzaXMzICggYTogQ2lyY2xlLCBiOiBDaXJjbGUsIGM6IENpcmNsZSApXG57XG4gICAgIGNvbnN0IHsgeDogeDEsIHk6IHkxLCByOiByMSB9ID0gYVxuICAgICBjb25zdCB7IHg6IHgyLCB5OiB5MiwgcjogcjIgfSA9IGJcbiAgICAgY29uc3QgeyB4OiB4MywgeTogeTMsIHI6IHIzIH0gPSBjXG5cbiAgICAgY29uc3QgYTIgPSB4MSAtIHgyLFxuICAgICAgICAgICAgICAgYTMgPSB4MSAtIHgzLFxuICAgICAgICAgICAgICAgYjIgPSB5MSAtIHkyLFxuICAgICAgICAgICAgICAgYjMgPSB5MSAtIHkzLFxuICAgICAgICAgICAgICAgYzIgPSByMiAtIHIxLFxuICAgICAgICAgICAgICAgYzMgPSByMyAtIHIxLFxuXG4gICAgICAgICAgICAgICBkMSA9IHgxICogeDEgKyB5MSAqIHkxIC0gcjEgKiByMSxcbiAgICAgICAgICAgICAgIGQyID0gZDEgLSB4MiAqIHgyIC0geTIgKiB5MiArIHIyICogcjIsXG4gICAgICAgICAgICAgICBkMyA9IGQxIC0geDMgKiB4MyAtIHkzICogeTMgKyByMyAqIHIzLFxuXG4gICAgICAgICAgICAgICBhYiA9IGEzICogYjIgLSBhMiAqIGIzLFxuICAgICAgICAgICAgICAgeGEgPSAoIGIyICogZDMgLSBiMyAqIGQyICkgLyAoIGFiICogMiApIC0geDEsXG4gICAgICAgICAgICAgICB4YiA9ICggYjMgKiBjMiAtIGIyICogYzMgKSAvIGFiLFxuICAgICAgICAgICAgICAgeWEgPSAoIGEzICogZDIgLSBhMiAqIGQzICkgLyAoIGFiICogMiApIC0geTEsXG4gICAgICAgICAgICAgICB5YiA9ICggYTIgKiBjMyAtIGEzICogYzIgKSAvIGFiLFxuXG4gICAgICAgICAgICAgICBBICA9IHhiICogeGIgKyB5YiAqIHliIC0gMSxcbiAgICAgICAgICAgICAgIEIgID0gMiAqICggcjEgKyB4YSAqIHhiICsgeWEgKiB5YiApLFxuICAgICAgICAgICAgICAgQyAgPSB4YSAqIHhhICsgeWEgKiB5YSAtIHIxICogcjEsXG4gICAgICAgICAgICAgICByICA9IC0oIEEgPyAoIEIgKyBNYXRoLnNxcnQoIEIgKiBCIC0gNCAqIEEgKiBDICkgKSAvICggMiAqIEEgKSA6IEMgLyBCIClcblxuICAgICByZXR1cm4ge1xuICAgICAgICAgIHg6IHgxICsgeGEgKyB4YiAqIHIsXG4gICAgICAgICAgeTogeTEgKyB5YSArIHliICogcixcbiAgICAgICAgICByOiByXG4gICAgIH07XG59XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi9kMy1lbmNsb3NlLnRzXCIgLz5cblxuLy8gaHR0cHM6Ly9naXRodWIuY29tL2QzL2QzLWhpZXJhcmNoeS9ibG9iL21hc3Rlci9zcmMvcGFjay9zaWJsaW5ncy5qc1xuXG5pbXBvcnQgeyBlbmNsb3NlLCBDaXJjbGUgfSBmcm9tIFwiLi9kMy1lbmNsb3NlLmpzXCJcblxuZnVuY3Rpb24gcGxhY2UgKCBiOiBDaXJjbGUsIGE6IENpcmNsZSwgYzogQ2lyY2xlIClcbntcbiAgICAgdmFyIGR4ID0gYi54IC0gYS54LFxuICAgICAgICAgIHg6IG51bWJlcixcbiAgICAgICAgICBhMjogbnVtYmVyLFxuICAgICAgICAgIGR5ID0gYi55IC0gYS55LFxuICAgICAgICAgIHkgOiBudW1iZXIsXG4gICAgICAgICAgYjI6IG51bWJlcixcbiAgICAgICAgICBkMiA9IGR4ICogZHggKyBkeSAqIGR5XG5cbiAgICAgaWYgKCBkMiApXG4gICAgIHtcbiAgICAgICAgICBhMiA9IGEuciArIGMuciwgYTIgKj0gYTJcbiAgICAgICAgICBiMiA9IGIuciArIGMuciwgYjIgKj0gYjJcblxuICAgICAgICAgIGlmICggYTIgPiBiMiApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgeCA9ICggZDIgKyBiMiAtIGEyICkgLyAoIDIgKiBkMiApXG4gICAgICAgICAgICAgICB5ID0gTWF0aC5zcXJ0KCBNYXRoLm1heCggMCwgYjIgLyBkMiAtIHggKiB4ICkgKVxuICAgICAgICAgICAgICAgYy54ID0gYi54IC0geCAqIGR4IC0geSAqIGR5XG4gICAgICAgICAgICAgICBjLnkgPSBiLnkgLSB4ICogZHkgKyB5ICogZHhcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHggPSAoIGQyICsgYTIgLSBiMiApIC8gKCAyICogZDIgKVxuICAgICAgICAgICAgICAgeSA9IE1hdGguc3FydCggTWF0aC5tYXgoIDAsIGEyIC8gZDIgLSB4ICogeCApIClcbiAgICAgICAgICAgICAgIGMueCA9IGEueCArIHggKiBkeCAtIHkgKiBkeVxuICAgICAgICAgICAgICAgYy55ID0gYS55ICsgeCAqIGR5ICsgeSAqIGR4XG4gICAgICAgICAgfVxuICAgICB9XG4gICAgIGVsc2VcbiAgICAge1xuICAgICAgICAgIGMueCA9IGEueCArIGMuclxuICAgICAgICAgIGMueSA9IGEueVxuICAgICB9XG59XG5cbmZ1bmN0aW9uIGludGVyc2VjdHMgKCBhOiBDaXJjbGUsIGI6IENpcmNsZSApXG57XG4gICAgIHZhciBkciA9IGEuciArIGIuciAtIDFlLTYsIGR4ID0gYi54IC0gYS54LCBkeSA9IGIueSAtIGEueTtcbiAgICAgcmV0dXJuIGRyID4gMCAmJiBkciAqIGRyID4gZHggKiBkeCArIGR5ICogZHk7XG59XG5cbmZ1bmN0aW9uIHNjb3JlICggbm9kZTogTm9kZSApXG57XG4gICAgIHZhciBhID0gbm9kZS5fLFxuICAgICAgICAgIGIgPSBub2RlLm5leHQuXyxcbiAgICAgICAgICBhYiA9IGEuciArIGIucixcbiAgICAgICAgICBkeCA9ICggYS54ICogYi5yICsgYi54ICogYS5yICkgLyBhYixcbiAgICAgICAgICBkeSA9ICggYS55ICogYi5yICsgYi55ICogYS5yICkgLyBhYjtcbiAgICAgcmV0dXJuIGR4ICogZHggKyBkeSAqIGR5O1xufVxuXG5jbGFzcyBOb2RlXG57XG4gICAgIG5leHQgICAgID0gbnVsbCBhcyBOb2RlXG4gICAgIHByZXZpb3VzID0gbnVsbCBhcyBOb2RlXG4gICAgIGNvbnN0cnVjdG9yICggcHVibGljIF86IENpcmNsZSApIHt9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYWNrRW5jbG9zZSAoIGNpcmNsZXM6IENpcmNsZVtdIClcbntcbiAgICAgaWYgKCAhKCBuID0gY2lyY2xlcy5sZW5ndGggKSApIHJldHVybiAwO1xuXG4gICAgIHZhciBhLCBiLCBjIC8qOiBOb2RlICYgQ2lyY2xlKi8sIG4sIGFhLCBjYSwgaSwgaiwgaywgc2osIHNrO1xuXG4gICAgIC8vIFBsYWNlIHRoZSBmaXJzdCBjaXJjbGUuXG4gICAgIGEgPSBjaXJjbGVzWyAwIF0sIGEueCA9IDAsIGEueSA9IDA7XG4gICAgIGlmICggISggbiA+IDEgKSApIHJldHVybiBhLnI7XG5cbiAgICAgLy8gUGxhY2UgdGhlIHNlY29uZCBjaXJjbGUuXG4gICAgIGIgPSBjaXJjbGVzWyAxIF0sIGEueCA9IC1iLnIsIGIueCA9IGEuciwgYi55ID0gMDtcbiAgICAgaWYgKCAhKCBuID4gMiApICkgcmV0dXJuIGEuciArIGIucjtcblxuICAgICAvLyBQbGFjZSB0aGUgdGhpcmQgY2lyY2xlLlxuICAgICBwbGFjZSggYiwgYSwgYyA9IGNpcmNsZXNbIDIgXSApO1xuXG4gICAgIC8vIEluaXRpYWxpemUgdGhlIGZyb250LWNoYWluIHVzaW5nIHRoZSBmaXJzdCB0aHJlZSBjaXJjbGVzIGEsIGIgYW5kIGMuXG4gICAgIGEgPSBuZXcgTm9kZSggYSApLCBiID0gbmV3IE5vZGUoIGIgKSwgYyA9IG5ldyBOb2RlKCBjICk7XG4gICAgIGEubmV4dCA9IGMucHJldmlvdXMgPSBiO1xuICAgICBiLm5leHQgPSBhLnByZXZpb3VzID0gYztcbiAgICAgYy5uZXh0ID0gYi5wcmV2aW91cyA9IGE7XG5cbiAgICAgLy8gQXR0ZW1wdCB0byBwbGFjZSBlYWNoIHJlbWFpbmluZyBjaXJjbGXigKZcbiAgICAgcGFjazogZm9yICggaSA9IDM7IGkgPCBuOyArK2kgKVxuICAgICB7XG4gICAgICAgICAgcGxhY2UoIGEuXywgYi5fLCBjID0gY2lyY2xlc1sgaSBdICksIGMgPSBuZXcgTm9kZSggYyApO1xuXG4gICAgICAgICAgLy8gRmluZCB0aGUgY2xvc2VzdCBpbnRlcnNlY3RpbmcgY2lyY2xlIG9uIHRoZSBmcm9udC1jaGFpbiwgaWYgYW55LlxuICAgICAgICAgIC8vIOKAnENsb3NlbmVzc+KAnSBpcyBkZXRlcm1pbmVkIGJ5IGxpbmVhciBkaXN0YW5jZSBhbG9uZyB0aGUgZnJvbnQtY2hhaW4uXG4gICAgICAgICAgLy8g4oCcQWhlYWTigJ0gb3Ig4oCcYmVoaW5k4oCdIGlzIGxpa2V3aXNlIGRldGVybWluZWQgYnkgbGluZWFyIGRpc3RhbmNlLlxuICAgICAgICAgIGogPSBiLm5leHQsIGsgPSBhLnByZXZpb3VzLCBzaiA9IGIuXy5yLCBzayA9IGEuXy5yO1xuICAgICAgICAgIGRvXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgaWYgKCBzaiA8PSBzayApXG4gICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGlmICggaW50ZXJzZWN0cyggai5fLCBjLl8gKSApXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICBiID0gaiwgYS5uZXh0ID0gYiwgYi5wcmV2aW91cyA9IGEsIC0taTtcbiAgICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZSBwYWNrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHNqICs9IGouXy5yLCBqID0gai5uZXh0O1xuICAgICAgICAgICAgICAgfSBlbHNlXG4gICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGlmICggaW50ZXJzZWN0cyggay5fLCBjLl8gKSApXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICBhID0gaywgYS5uZXh0ID0gYiwgYi5wcmV2aW91cyA9IGEsIC0taTtcbiAgICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZSBwYWNrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHNrICs9IGsuXy5yLCBrID0gay5wcmV2aW91cztcbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICB9IHdoaWxlICggaiAhPT0gay5uZXh0ICk7XG5cbiAgICAgICAgICAvLyBTdWNjZXNzISBJbnNlcnQgdGhlIG5ldyBjaXJjbGUgYyBiZXR3ZWVuIGEgYW5kIGIuXG4gICAgICAgICAgYy5wcmV2aW91cyA9IGEsIGMubmV4dCA9IGIsIGEubmV4dCA9IGIucHJldmlvdXMgPSBiID0gYztcblxuICAgICAgICAgIC8vIENvbXB1dGUgdGhlIG5ldyBjbG9zZXN0IGNpcmNsZSBwYWlyIHRvIHRoZSBjZW50cm9pZC5cbiAgICAgICAgICBhYSA9IHNjb3JlKCBhICk7XG4gICAgICAgICAgd2hpbGUgKCAoIGMgPSBjLm5leHQgKSAhPT0gYiApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgaWYgKCAoIGNhID0gc2NvcmUoIGMgKSApIDwgYWEgKVxuICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBhID0gYyxcbiAgICAgICAgICAgICAgICAgICAgYWEgPSBjYTtcbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgYiA9IGEubmV4dDtcbiAgICAgfVxuXG4gICAgIC8vIENvbXB1dGUgdGhlIGVuY2xvc2luZyBjaXJjbGUgb2YgdGhlIGZyb250IGNoYWluLlxuICAgICBhID0gWyBiLl8gXVxuICAgICBjID0gYlxuICAgICB3aGlsZSAoICggYyA9IGMubmV4dCApICE9PSBiIClcbiAgICAgICAgICBhLnB1c2goIGMuXyApO1xuICAgICBjID0gZW5jbG9zZSggYSApXG5cbiAgICAgLy8gVHJhbnNsYXRlIHRoZSBjaXJjbGVzIHRvIHB1dCB0aGUgZW5jbG9zaW5nIGNpcmNsZSBhcm91bmQgdGhlIG9yaWdpbi5cbiAgICAgZm9yICggaSA9IDA7IGkgPCBuOyArK2kgKVxuICAgICB7XG4gICAgICAgICAgYSA9IGNpcmNsZXNbIGkgXSxcbiAgICAgICAgICBhLnggLT0gYy54LFxuICAgICAgICAgIGEueSAtPSBjLnlcbiAgICAgfVxuXG4gICAgIHJldHVybiBjLnIgYXMgbnVtYmVyXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYWNrQ2lyY2xlcyAoIGNpcmNsZXM6IENpcmNsZVtdIClcbntcbiAgICAgcGFja0VuY2xvc2UoIGNpcmNsZXMgKTtcbiAgICAgcmV0dXJuIGNpcmNsZXMgYXMgQ2lyY2xlW107XG59XG4iLCJcclxuXHJcbmV4cG9ydCB0eXBlIFVuaXRcclxuICAgID0gXCIlXCJcclxuICAgIHwgXCJweFwiIHwgXCJwdFwiIHwgXCJlbVwiIHwgXCJyZW1cIiB8IFwiaW5cIiB8IFwiY21cIiB8IFwibW1cIlxyXG4gICAgfCBcImV4XCIgfCBcImNoXCIgfCBcInBjXCJcclxuICAgIHwgXCJ2d1wiIHwgXCJ2aFwiIHwgXCJ2bWluXCIgfCBcInZtYXhcIlxyXG4gICAgfCBcImRlZ1wiIHwgXCJyYWRcIiB8IFwidHVyblwiXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0VW5pdCAoIHZhbHVlOiBhbnkgKTogVW5pdCB8IHVuZGVmaW5lZFxyXG57XHJcbiAgICBpZiAoIHR5cGVvZiB2YWx1ZSAhPSBcInN0cmluZ1wiIClcclxuICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZFxyXG5cclxuICAgIGNvbnN0IHNwbGl0ID0gL1srLV0/XFxkKlxcLj9cXGQrKD86XFwuXFxkKyk/KD86W2VFXVsrLV0/XFxkKyk/KCV8cHh8cHR8ZW18cmVtfGlufGNtfG1tfGV4fGNofHBjfHZ3fHZofHZtaW58dm1heHxkZWd8cmFkfHR1cm4pPyQvXHJcbiAgICAgICAgICAgICAgLmV4ZWMoIHZhbHVlICk7XHJcblxyXG4gICAgaWYgKCBzcGxpdCApXHJcbiAgICAgICAgIHJldHVybiBzcGxpdCBbMV0gYXMgVW5pdFxyXG5cclxuICAgIHJldHVybiB1bmRlZmluZWRcclxufVxyXG5cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRUcmFuc2Zvcm1Vbml0ICggcHJvcE5hbWU6IHN0cmluZyApXHJcbntcclxuICAgIGlmICggcHJvcE5hbWUuaW5jbHVkZXMgKCAndHJhbnNsYXRlJyApIHx8IHByb3BOYW1lID09PSAncGVyc3BlY3RpdmUnIClcclxuICAgICAgICByZXR1cm4gJ3B4J1xyXG5cclxuICAgIGlmICggcHJvcE5hbWUuaW5jbHVkZXMgKCAncm90YXRlJyApIHx8IHByb3BOYW1lLmluY2x1ZGVzICggJ3NrZXcnICkgKVxyXG4gICAgICAgIHJldHVybiAnZGVnJ1xyXG59IiwiXG4vLyBodHRwczovL2dpdGh1Yi5jb20vcmRmanMtYmFzZS9kYXRhLW1vZGVsL3RyZWUvbWFzdGVyL2xpYlxuXG5kZWNsYXJlIGdsb2JhbFxue1xuICAgICBpbnRlcmZhY2UgJE5vZGVcbiAgICAge1xuICAgICAgICAgIHJlYWRvbmx5IGNvbnRleHQ6IHN0cmluZ1xuICAgICAgICAgIHJlYWRvbmx5IHR5cGU6IHN0cmluZ1xuICAgICAgICAgIHJlYWRvbmx5IGlkOiBzdHJpbmdcbiAgICAgfVxuXG4gICAgIGludGVyZmFjZSAkQ2x1c3RlciBleHRlbmRzICROb2RlXG4gICAgIHtcbiAgICAgICAgICBjaGlsZHJlbj86ICROb2RlIFtdXG4gICAgIH1cbn1cblxudmFyIG5leHRJZCA9IDBcblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZU5vZGUgPEQgZXh0ZW5kcyAkTm9kZSA9ICROb2RlLCBUIGV4dGVuZHMgc3RyaW5nID0gRCBbXCJ0eXBlXCJdPiAoIHR5cGU6IFQsIGlkOiBzdHJpbmcsIGRhdGE6IFBhcnRpYWwgPE9taXQgPEQsIFwidHlwZVwiIHwgXCJpZFwiPj4gKVxue1xuICAgICB0eXBlIE4gPSB7IC1yZWFkb25seSBbSyBpbiBrZXlvZiBEXTogRFtLXSB9XG5cbiAgICAgOyhkYXRhIGFzIE4pLnR5cGUgPSB0eXBlXG4gICAgIDsoZGF0YSBhcyBOKS5pZCAgID0gaWQgfHwgKCsrbmV4dElkKS50b1N0cmluZyAoKVxuICAgICByZXR1cm4gZGF0YSBhcyBEXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRVSWQgKCBub2RlOiAkTm9kZSApXG57XG4gICAgIHJldHVybiBub2RlLmNvbnRleHQgKyAnIycgKyBub2RlLnR5cGUgKyAnOicgKyBub2RlLmlkXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBlcXVhbE5vZGVzICggYTogJE5vZGUsIGI6ICROb2RlIClcbntcbiAgICAgcmV0dXJuICEhYSAmJiAhIWJcbiAgICAgICAgICAmJiBhLnR5cGUgPT09IGIudHlwZVxuICAgICAgICAgICYmIGEuaWQgICA9PT0gYi5pZFxufVxuXG4vKmV4cG9ydCBjbGFzcyBOb2RlIDxEIGV4dGVuZHMgJE5vZGUgPSAkTm9kZSwgVCBleHRlbmRzIHN0cmluZyA9IEQgW1widHlwZVwiXT5cbntcbiAgICAgc3RhdGljIG5leHRJZCA9IDBcblxuICAgICByZWFkb25seSB0eXBlOiBzdHJpbmdcblxuICAgICByZWFkb25seSBpZDogc3RyaW5nXG5cbiAgICAgcmVhZG9ubHkgdWlkOiBudW1iZXJcblxuICAgICByZWFkb25seSBkYXRhOiBEXG5cbiAgICAgZGVmYXVsdERhdGEgKCk6ICROb2RlXG4gICAgIHtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgY29udGV4dDogXCJcIixcbiAgICAgICAgICAgICAgIHR5cGUgICA6IFwibm9kZVwiLFxuICAgICAgICAgICAgICAgaWQgICAgIDogdW5kZWZpbmVkLFxuICAgICAgICAgIH1cbiAgICAgfVxuXG4gICAgIGNvbnN0cnVjdG9yICggZGF0YTogRCApXG4gICAgIHtcbiAgICAgICAgICB0aGlzLnR5cGUgPSBkYXRhLnR5cGVcbiAgICAgICAgICB0aGlzLnVpZCAgPSArK05vZGUubmV4dElkXG4gICAgICAgICAgdGhpcy5pZCAgID0gZGF0YS5pZCB8fCAoZGF0YS5pZCA9IHRoaXMudWlkLnRvU3RyaW5nICgpKVxuXG4gICAgICAgICAgdGhpcy5kYXRhID0gT2JqZWN0LmFzc2lnbiAoIHRoaXMuZGVmYXVsdERhdGEgKCksIGRhdGEgYXMgRCApXG4gICAgIH1cblxuICAgICBlcXVhbHMgKCBvdGhlcjogTm9kZSA8YW55PiApXG4gICAgIHtcbiAgICAgICAgICByZXR1cm4gISFvdGhlclxuICAgICAgICAgICAgICAgJiYgb3RoZXIudHlwZSA9PT0gdGhpcy50eXBlXG4gICAgICAgICAgICAgICAmJiBvdGhlci5pZCAgID09PSB0aGlzLmlkXG4gICAgIH1cblxuICAgICB0b0pzb24gKClcbiAgICAge1xuICAgICAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeSAoIHRoaXMuZGF0YSApXG4gICAgIH1cbn0qL1xuIiwiXG5leHBvcnQgdHlwZSBQYXRoID0ge1xuICAgICBsZW5ndGg6IG51bWJlclxuICAgICBbU3ltYm9sLml0ZXJhdG9yXSgpOiBJdGVyYWJsZUl0ZXJhdG9yPHN0cmluZz5cbn1cblxuZXhwb3J0IGNsYXNzIERhdGFUcmVlIDxUPlxue1xuICAgICByZWNvcmRzID0ge30gYXMge1xuICAgICAgICAgIFtjb250ZXh0OiBzdHJpbmddOiBUIHwge1xuICAgICAgICAgICAgICAgW3R5cGU6IHN0cmluZ106IFQgfCB7XG4gICAgICAgICAgICAgICAgICAgIFtpZDogc3RyaW5nXTogVFxuICAgICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgfVxuXG4gICAgIGhhcyAoIHBhdGg6IFBhdGggKSAgOiBib29sZWFuXG4gICAgIHtcbiAgICAgICAgICB2YXIgICByZWMgID0gdGhpcy5yZWNvcmRzIGFzIGFueVxuICAgICAgICAgIHZhciBjb3VudCA9IDBcblxuICAgICAgICAgIGZvciAoIGNvbnN0IGsgb2YgcGF0aCApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgY291bnQgKytcblxuICAgICAgICAgICAgICAgaWYgKCBrIGluIHJlYyApXG4gICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGlmICggayA9PT0gdW5kZWZpbmVkIClcbiAgICAgICAgICAgICAgICAgICAgICAgICBicmVha1xuXG4gICAgICAgICAgICAgICAgICAgIHJlYyA9IHJlYyBba11cbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIHBhdGgubGVuZ3RoID09IGNvdW50XG4gICAgIH1cblxuICAgICBjb3VudCAoIHBhdGg6IFBhdGggKVxuICAgICB7XG4gICAgICAgICAgdmFyICByZWMgPSB0aGlzLnJlY29yZHMgYXMgYW55XG5cbiAgICAgICAgICBmb3IgKCBjb25zdCBrIG9mIHBhdGggKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGlmICggayA9PT0gdW5kZWZpbmVkIClcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcblxuICAgICAgICAgICAgICAgaWYgKCBrIGluIHJlYyApXG4gICAgICAgICAgICAgICAgICAgIHJlYyA9IHJlYyBba11cbiAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDBcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvL0B0cy1pZ25vcmVcbiAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkIGluIHJlY1xuICAgICAgICAgICAgICAgPyBPYmplY3Qua2V5cyAoIHJlYyApLmxlbmd0aCAtIDFcbiAgICAgICAgICAgICAgIDogT2JqZWN0LmtleXMgKCByZWMgKS5sZW5ndGhcblxuICAgICB9XG5cbiAgICAgc2V0ICggcGF0aDogUGF0aCwgZGF0YTogVCApOiBUXG4gICAgIHtcbiAgICAgICAgICBjb25zdCB1bmQgPSB1bmRlZmluZWRcbiAgICAgICAgICB2YXIgICByZWMgID0gdGhpcy5yZWNvcmRzIGFzIGFueVxuXG4gICAgICAgICAgZm9yICggY29uc3QgayBvZiBwYXRoIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBpZiAoIGsgPT09IHVuZGVmaW5lZCApXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG5cbiAgICAgICAgICAgICAgIGlmICggayBpbiByZWMgKVxuICAgICAgICAgICAgICAgICAgICByZWMgPSByZWMgW2tdXG4gICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIHJlYyA9IHJlYyBba10gPSB7fVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiByZWMgW3VuZF0gPSBkYXRhXG4gICAgIH1cblxuICAgICBnZXQgKCBwYXRoOiBQYXRoICk6IFRcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHVuZCA9IHVuZGVmaW5lZFxuICAgICAgICAgIHZhciAgIHJlYyAgPSB0aGlzLnJlY29yZHMgYXMgYW55XG5cbiAgICAgICAgICBmb3IgKCBjb25zdCBrIG9mIHBhdGggKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGlmICggayA9PT0gdW5kZWZpbmVkIClcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcblxuICAgICAgICAgICAgICAgaWYgKCBrIGluIHJlYyApXG4gICAgICAgICAgICAgICAgICAgIHJlYyA9IHJlYyBba11cbiAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gcmVjIFt1bmRdXG4gICAgIH1cblxuICAgICBuZWFyICggcGF0aDogUGF0aCApOiBUXG4gICAgIHtcbiAgICAgICAgICB2YXIgcmVjID0gdGhpcy5yZWNvcmRzIGFzIGFueVxuICAgICAgICAgIGNvbnN0IHVuZCA9IHVuZGVmaW5lZFxuXG4gICAgICAgICAgZm9yICggY29uc3QgayBvZiBwYXRoIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBpZiAoIGsgPT09IHVuZGVmaW5lZCApXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG5cbiAgICAgICAgICAgICAgIGlmICggayBpbiByZWMgKVxuICAgICAgICAgICAgICAgICAgICByZWMgPSByZWMgW2tdXG4gICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIHJlYyBbdW5kXVxuICAgICB9XG5cbiAgICAgd2FsayAoIHBhdGg6IFBhdGgsIGNiOiAoIGRhdGE6IFQgKSA9PiB2b2lkIClcbiAgICAge1xuICAgICAgICAgIHZhciAgIHJlYyAgPSB0aGlzLnJlY29yZHMgYXMgYW55XG4gICAgICAgICAgY29uc3QgdW5kICA9IHVuZGVmaW5lZFxuXG4gICAgICAgICAgZm9yICggY29uc3QgayBvZiBwYXRoIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBpZiAoIHVuZCBpbiByZWMgKVxuICAgICAgICAgICAgICAgICAgICBjYiAoIHJlYyBbdW5kXSApXG5cbiAgICAgICAgICAgICAgIGlmICggayA9PT0gdW5kZWZpbmVkIClcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcblxuICAgICAgICAgICAgICAgaWYgKCBrIGluIHJlYyApXG4gICAgICAgICAgICAgICAgICAgIHJlYyA9IHJlYyBba11cbiAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoIHVuZCBpbiByZWMgKVxuICAgICAgICAgICAgICAgY2IgKCByZWMgW3VuZF0gKVxuXG4gICAgICAgICAgcmV0dXJuXG4gICAgIH1cbn1cbiIsIlxuaW1wb3J0IHsgT3B0aW9uYWwsIFJlcXVpcmUgfSBmcm9tIFwiLi4vTGliL3R5cGluZy5qc1wiXG5pbXBvcnQgeyBEYXRhVHJlZSB9IGZyb20gXCIuL2RhdGEtdHJlZS5qc1wiXG5cblxudHlwZSBSZWYgPE4gZXh0ZW5kcyAkTm9kZT4gPSBSZXF1aXJlIDxQYXJ0aWFsIDxOPiwgXCJjb250ZXh0XCIgfCBcInR5cGVcIiB8IFwiaWRcIj5cblxudHlwZSBEIDxOIGV4dGVuZHMgJE5vZGU+ID0gT3B0aW9uYWwgPE4sIFwiY29udGV4dFwiIHwgXCJ0eXBlXCIgfCBcImlkXCI+XG5cblxuZXhwb3J0IGNsYXNzIERhdGFiYXNlIDxOIGV4dGVuZHMgJE5vZGUgPSAkTm9kZT4gZXh0ZW5kcyBEYXRhVHJlZSA8Tj5cbntcbiAgICAgaGFzICggbm9kZTogUmVmIDxOPiApICAgICAgOiBib29sZWFuXG4gICAgIGhhcyAoIC4uLiBwYXRoOiBzdHJpbmcgW10gKTogYm9vbGVhblxuICAgICBoYXMgKCk6IGJvb2xlYW5cbiAgICAge1xuICAgICAgICAgIGlmICggYXJndW1lbnRzLmxlbmd0aCA9PSAwIClcbiAgICAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgICAgaWYgKCBhcmd1bWVudHMubGVuZ3RoID09IDEgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNvbnN0IG86IE4gPSBhcmd1bWVudHMgWzBdXG4gICAgICAgICAgICAgICByZXR1cm4gc3VwZXIubmVhciAoIFtvLmNvbnRleHQsIG8udHlwZSwgby5pZF0gKSAhPT0gdW5kZWZpbmVkXG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICByZXR1cm4gc3VwZXIubmVhciAoIGFyZ3VtZW50cyApICE9PSB1bmRlZmluZWRcbiAgICAgICAgICB9XG4gICAgIH1cblxuICAgICBjb3VudCAoIG5vZGU6IFJlZiA8Tj4gKSAgICAgIDogbnVtYmVyXG4gICAgIGNvdW50ICggLi4uIHBhdGg6IHN0cmluZyBbXSApOiBudW1iZXJcbiAgICAgY291bnQgKCk6IG51bWJlclxuICAgICB7XG4gICAgICAgICAgaWYgKCBhcmd1bWVudHMubGVuZ3RoID09IDAgKVxuICAgICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgICBpZiAoIGFyZ3VtZW50cy5sZW5ndGggPT0gMSApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgY29uc3QgbzogTiA9IGFyZ3VtZW50cyBbMF1cbiAgICAgICAgICAgICAgIHJldHVybiBzdXBlci5jb3VudCAoIFtvLmNvbnRleHQsIG8udHlwZSwgby5pZF0gKVxuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgcmV0dXJuIHN1cGVyLmNvdW50ICggYXJndW1lbnRzIClcbiAgICAgICAgICB9XG4gICAgIH1cblxuICAgICBzZXQgPCQgZXh0ZW5kcyBOPiAoIG5vZGU6ICQgKSAgICAgICAgICAgICAgICAgICAgIDogJFxuICAgICBzZXQgPCQgZXh0ZW5kcyBOPiAoIHBhdGg6IHN0cmluZyBbXSwgZGF0YTogRCA8JD4gKTogJFxuICAgICBzZXQgKCk6IE5cbiAgICAge1xuICAgICAgICAgIGlmICggYXJndW1lbnRzLmxlbmd0aCA9PSAwIClcbiAgICAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgICAgaWYgKCBhcmd1bWVudHMubGVuZ3RoID09IDEgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNvbnN0IG86IE4gPSBhcmd1bWVudHMgWzBdXG4gICAgICAgICAgICAgICByZXR1cm4gc3VwZXIuc2V0ICggW28uY29udGV4dCwgby50eXBlLCBvLmlkXSwgbyApXG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICByZXR1cm4gc3VwZXIuc2V0ICggYXJndW1lbnRzIFswXSwgYXJndW1lbnRzIFsxXSApXG4gICAgICAgICAgfVxuICAgICB9XG5cbiAgICAgZ2V0IDwkIGV4dGVuZHMgTj4gKCBub2RlOiBSZWYgPCROb2RlPiApICA6ICRcbiAgICAgZ2V0IDwkIGV4dGVuZHMgTj4gKCAuLi4gcGF0aDogc3RyaW5nIFtdICk6ICRcbiAgICAgZ2V0ICgpOiBOXG4gICAgIHtcbiAgICAgICAgICBpZiAoIGFyZ3VtZW50cy5sZW5ndGggPT0gMCApXG4gICAgICAgICAgICAgICByZXR1cm5cblxuICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHt9IGFzIE5cblxuICAgICAgICAgIGlmICggYXJndW1lbnRzLmxlbmd0aCA9PSAxIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBjb25zdCBvOiAkTm9kZSA9IGFyZ3VtZW50cyBbMF1cbiAgICAgICAgICAgICAgIHN1cGVyLndhbGsgKCBbby5jb250ZXh0LCBvLnR5cGUsIG8uaWRdLCBkYXRhID0+IHtcbiAgICAgICAgICAgICAgICAgICAgT2JqZWN0LmFzc2lnbiAoIHJlc3VsdCwgZGF0YSApXG4gICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgcmV0dXJuIE9iamVjdC5hc3NpZ24gKCByZXN1bHQsIG8gKVxuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgc3VwZXIud2FsayAoIGFyZ3VtZW50cywgZGF0YSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIE9iamVjdC5hc3NpZ24gKCByZXN1bHQsIGRhdGEgKVxuICAgICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgICAgcmV0dXJuIE9iamVjdC5hc3NpZ24gKCByZXN1bHQsIHtcbiAgICAgICAgICAgICAgICAgICAgY29udGV4dDogYXJndW1lbnRzIFswXSxcbiAgICAgICAgICAgICAgICAgICAgdHlwZSAgIDogYXJndW1lbnRzIFsxXSxcbiAgICAgICAgICAgICAgICAgICAgaWQgICAgIDogYXJndW1lbnRzIFsyXSxcbiAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgfVxuICAgICB9XG59XG4iLCJcbmltcG9ydCB7IERhdGFiYXNlIH0gZnJvbSBcIi4vZGIuanNcIlxuaW1wb3J0IHsgRGF0YVRyZWUsIFBhdGggfSBmcm9tIFwiLi9kYXRhLXRyZWUuanNcIlxuXG5pbXBvcnQgeyBPcHRpb25hbCB9IGZyb20gXCIuLi9MaWIvaW5kZXguanNcIlxuXG5cbnR5cGUgSXRlbSA8VCA9IGFueSwgJCBleHRlbmRzICROb2RlID0gJE5vZGU+ID1cbntcbiAgICAgbXVsdGlwbGU6IGJvb2xlYW5cbiAgICAgaW5zdGFuY2VzOiBUIFtdXG4gICAgIGNvbnN0cnVjdG9yOiBuZXcgKCBkYXRhOiAkICkgPT4gVFxufVxuXG50eXBlICRJbiA8TiBleHRlbmRzICROb2RlID0gJE5vZGU+ID0gT3B0aW9uYWwgPE4sIFwiY29udGV4dFwiPlxuXG4vL2V4cG9ydCB0eXBlIEN0b3IgPE4gZXh0ZW5kcyAkTm9kZSA9ICROb2RlLCBUID0gYW55PiA9IG5ldyAoIGRhdGE6IE4gKSA9PiBUXG5leHBvcnQgdHlwZSBDdG9yIDxOIGV4dGVuZHMgJE5vZGUgPSAkTm9kZSwgVCA9IGFueT4gPSBuZXcgKCBkYXRhOiBOLCBjaGlsZHJlbj86IGFueSBbXSApID0+IFRcblxudHlwZSBBcmcgPEY+ID0gRiBleHRlbmRzIG5ldyAoIGRhdGE6IGluZmVyIEQgKSA9PiBhbnkgPyBEIDogYW55XG5cblxuZXhwb3J0IGNsYXNzIEZhY3RvcnkgPEUgPSBhbnksIE4gZXh0ZW5kcyAkTm9kZSA9ICROb2RlPlxue1xuICAgICBjb25zdHJ1Y3RvciAoIHJlYWRvbmx5IGRiOiBEYXRhYmFzZSA8Tj4gKSB7fVxuXG4gICAgIHByaXZhdGUgY3RvcnMgPSBuZXcgRGF0YVRyZWUgPEN0b3IgPCROb2RlLCBFPj4gKClcbiAgICAgcHJpdmF0ZSBpbnN0cyA9ICBuZXcgRGF0YVRyZWUgPEU+ICgpXG5cblxuICAgICBnZXRQYXRoICggbm9kZTogJE5vZGUgKSAgICAgICAgOiBQYXRoXG4gICAgIGdldFBhdGggKCBwYXRoOiBQYXRoICkgICAgICAgICA6IFBhdGhcbiAgICAgZ2V0UGF0aCAoIC4uLiBwYXRoOiBzdHJpbmcgW10gKTogUGF0aFxuXG4gICAgIGdldFBhdGggKClcbiAgICAge1xuICAgICAgICAgIGlmICggYXJndW1lbnRzLmxlbmd0aCA9PSAwIClcbiAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvciAoIFwiTnVsbCBhcmd1bWVudFwiIClcblxuICAgICAgICAgIGNvbnN0IGFyZyAgPSBhcmd1bWVudHMgWzBdXG5cbiAgICAgICAgICBpZiAoIHR5cGVvZiBhcmcgPT0gXCJzdHJpbmdcIiApXG4gICAgICAgICAgICAgICByZXR1cm4gYXJndW1lbnRzIGFzIFBhdGhcblxuICAgICAgICAgIGlmICggQXJyYXkuaXNBcnJheSAoIGFyZykgKVxuICAgICAgICAgICAgICAgcmV0dXJuIGFyZy5mbGF0ICgpIGFzIFBhdGhcblxuICAgICAgICAgIHJldHVybiBbIGFyZy5jb250ZXh0LCBhcmcudHlwZSwgYXJnLmlkIF0gYXMgUGF0aFxuICAgICB9XG5cbiAgICAgaW5TdG9jayAoIG5vZGU6ICROb2RlICkgICAgICAgIDogYm9vbGVhblxuICAgICBpblN0b2NrICggcGF0aDogUGF0aCApICAgICAgICAgOiBib29sZWFuXG4gICAgIGluU3RvY2sgKCAuLi4gcGF0aDogc3RyaW5nIFtdICk6IGJvb2xlYW5cblxuICAgICBpblN0b2NrICgpOiBib29sZWFuXG4gICAgIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5pbnN0cy5oYXMgKCB0aGlzLmdldFBhdGggKCAuLi4gYXJndW1lbnRzICkgYXMgUGF0aCApXG4gICAgIH1cbiAgICAgX2luU3RvY2sgKCBwYXRoOiBQYXRoIClcbiAgICAge1xuICAgICAgICAgIHJldHVybiB0aGlzLmluc3RzLmhhcyAoIHBhdGggKVxuICAgICB9XG5cbiAgICAgZGVmaW5lIDxGIGV4dGVuZHMgQ3Rvcj4gKCBjdG9yOiBGLCBub2RlOiBBcmcgPEY+ICkgICAgICA6IHZvaWRcbiAgICAgZGVmaW5lIDxGIGV4dGVuZHMgQ3Rvcj4gKCBjdG9yOiBGLCBwYXRoOiBQYXRoICkgICAgICAgICA6IHZvaWRcbiAgICAgZGVmaW5lIDxGIGV4dGVuZHMgQ3Rvcj4gKCBjdG9yOiBGLCAuLi4gcGF0aDogc3RyaW5nIFtdICk6IHZvaWRcblxuICAgICBkZWZpbmUgKCBjdG9yOiBDdG9yLCAuLi4gcmVzdDogYW55IFtdIClcbiAgICAge1xuICAgICAgICAgIHZhciBwYXRoID0gdGhpcy5nZXRQYXRoICggLi4uIHJlc3QgKVxuXG4gICAgICAgICAgaWYgKCB0aGlzLmN0b3JzLmhhcyAoIHBhdGggKSApXG4gICAgICAgICAgICAgICB0aHJvdyBcIkJhZCBhcmd1bWVudFwiXG5cbiAgICAgICAgICByZXR1cm4gdGhpcy5jdG9ycy5zZXQgKCBwYXRoLCBjdG9yIClcbiAgICAgfVxuICAgICBfZGVmaW5lICggY3RvcjogQ3RvciwgcGF0aDogUGF0aCApXG4gICAgIHtcbiAgICAgICAgICBpZiAoIHRoaXMuY3RvcnMuaGFzICggcGF0aCApIClcbiAgICAgICAgICAgICAgIHRocm93IFwiQmFkIGFyZ3VtZW50XCJcblxuICAgICAgICAgIHJldHVybiB0aGlzLmN0b3JzLnNldCAoIHBhdGgsIGN0b3IgKVxuICAgICB9XG5cbiAgICAgcGljayA8UiBleHRlbmRzIEUsICQgZXh0ZW5kcyBOID0gTj4gKCBub2RlOiAkTm9kZSApOiBSXG4gICAgIHBpY2sgPFIgZXh0ZW5kcyBFPiAoIC4uLiBwYXRoOiBzdHJpbmcgW10gKSAgICAgICAgIDogUlxuICAgICBwaWNrIDxSIGV4dGVuZHMgRT4gKCBwYXRoOiBQYXRoICkgICAgICAgICAgICAgICAgICA6IFJcblxuICAgICBwaWNrICgpOiBFXG4gICAgIHtcbiAgICAgICAgICB2YXIgcGF0aCA9IHRoaXMuZ2V0UGF0aCAoIC4uLiBhcmd1bWVudHMgKVxuXG4gICAgICAgICAgaWYgKCB0aGlzLmluc3RzLmhhcyAoIHBhdGggKSApXG4gICAgICAgICAgICAgICByZXR1cm4gdGhpcy5pbnN0cy5nZXQgKCBwYXRoIClcblxuICAgICAgICAgIHRocm93IFwiQmFkIGFyZ3VtZW50XCJcbiAgICAgfVxuICAgICBfcGljayAoIHBhdGg6IFBhdGggKVxuICAgICB7XG4gICAgICAgICAgaWYgKCB0aGlzLmluc3RzLmhhcyAoIHBhdGggKSApXG4gICAgICAgICAgICAgICByZXR1cm4gdGhpcy5pbnN0cy5nZXQgKCBwYXRoIClcblxuICAgICAgICAgIHRocm93IFwiQmFkIGFyZ3VtZW50XCJcbiAgICAgfVxuXG4gICAgIG1ha2UgPFIgZXh0ZW5kcyBFLCAkIGV4dGVuZHMgTiA9IE4+ICggbm9kZTogJCApOiBSXG4gICAgIG1ha2UgPFIgZXh0ZW5kcyBFPiAoIHBhdGg6IFBhdGggKSAgICAgICAgICAgICAgOiBSXG4gICAgIG1ha2UgPFIgZXh0ZW5kcyBFPiAoIC4uLiBwYXRoOiBzdHJpbmcgW10gKSAgICAgOiBSXG5cbiAgICAgbWFrZSAoKTogRVxuICAgICB7XG4gICAgICAgICAgdmFyIHBhdGggPSB0aGlzLmdldFBhdGggKCAuLi4gYXJndW1lbnRzIClcblxuICAgICAgICAgIGNvbnN0IGFyZyAgPSBhcmd1bWVudHMgWzBdXG5cbiAgICAgICAgICBpZiAoIHR5cGVvZiBhcmcgPT0gXCJvYmplY3RcIiAmJiAhIEFycmF5LmlzQXJyYXkgKGFyZykgKVxuICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX21ha2UgKCBwYXRoLCBhcmcgKVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9tYWtlICggcGF0aCApXG4gICAgIH1cbiAgICAgX21ha2UgKCBwYXRoOiBQYXRoLCBkYXRhPzogUGFydGlhbCA8Tj4gKVxuICAgICB7XG4gICAgICAgICAgaWYgKCB0aGlzLmluc3RzLmhhcyAoIHBhdGggKSApXG4gICAgICAgICAgICAgICByZXR1cm4gdGhpcy5pbnN0cy5nZXQgKCBwYXRoIClcblxuICAgICAgICAgIGNvbnN0IGN0b3IgPSB0aGlzLmN0b3JzLm5lYXIgKCBwYXRoIClcblxuICAgICAgICAgIGlmICggY3RvciA9PSB1bmRlZmluZWQgKVxuICAgICAgICAgICAgICAgdGhyb3cgXCJCYWQgYXJndW1lbnRcIlxuXG4gICAgICAgICAgY29uc3QgdG1wID0gdGhpcy5kYi5nZXQgKCAuLi4gcGF0aCApXG5cbiAgICAgICAgICBkYXRhID0gZGF0YSA9PSB1bmRlZmluZWRcbiAgICAgICAgICAgICAgID8gdG1wXG4gICAgICAgICAgICAgICA6IE9iamVjdC5hc3NpZ24gKCB0bXAsIGRhdGEgKVxuXG4gICAgICAgICAgcmV0dXJuIHRoaXMuaW5zdHMuc2V0ICggcGF0aCwgbmV3IGN0b3IgKCBkYXRhIGFzIE4gKSApXG4gICAgIH1cbn1cbiIsIlxuaW1wb3J0IHsgU2hhcGUgfSBmcm9tIFwiLi9zaGFwZVwiXG5cbmRlY2xhcmUgZ2xvYmFsXG57XG4gICAgIHR5cGUgR2VvbWV0cnlOYW1lcyA9IGtleW9mIHR5cGVvZiBGYWN0b3J5XG5cbiAgICAgaW50ZXJmYWNlICRHZW9tZXRyeVxuICAgICB7XG4gICAgICAgICAgc2hhcGU6IEdlb21ldHJ5TmFtZXNcbiAgICAgICAgICB4ICAgICAgICAgOiBudW1iZXJcbiAgICAgICAgICB5ICAgICAgICAgOiBudW1iZXJcblxuICAgICAgICAgIGJvcmRlcldpZHRoICAgIDogbnVtYmVyXG4gICAgICAgICAgYm9yZGVyQ29sb3IgICAgOiBzdHJpbmdcblxuICAgICAgICAgIGJhY2tncm91bmRDb2xvciA6IHN0cmluZ1xuICAgICAgICAgIGJhY2tncm91bmRJbWFnZSA6IHN0cmluZ1xuICAgICAgICAgIGJhY2tncm91bmRSZXBlYXQ6IGJvb2xlYW5cbiAgICAgfVxuXG4gICAgIGludGVyZmFjZSAkVGV4dERlZmluaXRpb24gZXh0ZW5kcyAkR2VvbWV0cnlcbiAgICAge1xuICAgICAgICAgIHRleHQ6IHN0cmluZ1xuICAgICB9XG5cbiAgICAgaW50ZXJmYWNlICRQYXRoRGVmaW5pdGlvbiBleHRlbmRzICRHZW9tZXRyeVxuICAgICB7XG4gICAgICAgICAgcGF0aDogc3RyaW5nXG4gICAgIH1cbn1cblxuY29uc3QgZmFicmljX2Jhc2Vfb2J0aW9uczogZmFicmljLklPYmplY3RPcHRpb25zID0ge1xuICAgICBsZWZ0ICAgOiAwLFxuICAgICB0b3AgICAgOiAwLFxuICAgICBvcmlnaW5YOiBcImNlbnRlclwiLFxuICAgICBvcmlnaW5ZOiBcImNlbnRlclwiLFxufVxuXG5leHBvcnQgZnVuY3Rpb24gZ3JvdXAgKCBkZWY6ICRHZW9tZXRyeSwgc2l6ZTogbnVtYmVyLCBvcHQ6IGZhYnJpYy5JQ2lyY2xlT3B0aW9ucyApXG57XG4gICAgIHJldHVybiBuZXcgZmFicmljLkdyb3VwICggdW5kZWZpbmVkLFxuICAgICB7XG4gICAgICAgICAgLi4uIGZhYnJpY19iYXNlX29idGlvbnMsXG4gICAgICAgICAgLi4uIG9wdCxcbiAgICAgICAgICB3aWR0aDogc2l6ZSxcbiAgICAgICAgICBoZWlnaHQ6IHNpemUsXG4gICAgIH0pXG59XG5cbi8vIFRvIGdldCBwb2ludHMgb2YgdHJpYW5nbGUsIHNxdWFyZSwgW3BhbnRhfGhleGFdZ29uXG4vL1xuLy8gdmFyIGEgPSBNYXRoLlBJKjIvNFxuLy8gZm9yICggdmFyIGkgPSAwIDsgaSAhPSA0IDsgaSsrIClcbi8vICAgICBjb25zb2xlLmxvZyAoIGBbICR7IE1hdGguc2luKGEqaSkgfSwgJHsgTWF0aC5jb3MoYSppKSB9IF1gIClcblxuZXhwb3J0IGZ1bmN0aW9uIGNpcmNsZSAoIGRlZjogJEdlb21ldHJ5LCBzaXplOiBudW1iZXIsIG9wdDogZmFicmljLklDaXJjbGVPcHRpb25zIClcbntcblxuICAgICByZXR1cm4gbmV3IGZhYnJpYy5DaXJjbGUgKFxuICAgICB7XG4gICAgICAgICAgLi4uIGZhYnJpY19iYXNlX29idGlvbnMsXG4gICAgICAgICAgLi4uIG9wdCxcbiAgICAgICAgICByYWRpdXM6IHNpemUgLyAyLFxuICAgICB9KVxufVxuXG5leHBvcnQgZnVuY3Rpb24gdHJpYW5nbGUgKCBkZWY6ICRHZW9tZXRyeSwgc2l6ZTogbnVtYmVyLCBvcHQ6IGZhYnJpYy5JVHJpYW5nbGVPcHRpb25zIClcbntcbiAgICAgY29uc3QgcG9pbnRzID0gW11cbiAgICAgY29uc3Qgc2NhbGUgPSAxLjJcbiAgICAgY29uc3QgciA9IHNpemUgLyAyICogc2NhbGVcblxuICAgICBmb3IgKCBjb25zdCBwIG9mIFtcbiAgICAgICAgICBbIDAsIDEgXSxcbiAgICAgICAgICBbIDAuODY2MDI1NDAzNzg0NDM4NywgLTAuNDk5OTk5OTk5OTk5OTk5OCBdLFxuICAgICAgICAgIFsgLTAuODY2MDI1NDAzNzg0NDM4NSwgLTAuNTAwMDAwMDAwMDAwMDAwNCBdXG4gICAgIF0pIHBvaW50cy5wdXNoICh7IHg6IHBbMF0gKiByLCB5OiBwWzFdICogciB9KVxuXG4gICAgIHJldHVybiBuZXcgZmFicmljLlBvbHlnb24gKCBwb2ludHMsIHtcbiAgICAgICAgICAuLi4gZmFicmljX2Jhc2Vfb2J0aW9ucyxcbiAgICAgICAgICAuLi4gb3B0LFxuICAgICAgICAgIGFuZ2xlOiAxODAsXG4gICAgIH0pXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzcXVhcmUgKCBkZWY6ICRHZW9tZXRyeSwgc2l6ZTogbnVtYmVyLCBvcHQ6IGZhYnJpYy5JUmVjdE9wdGlvbnMgKVxue1xuICAgICBjb25zdCBzY2FsZSA9IDAuOVxuICAgICByZXR1cm4gbmV3IGZhYnJpYy5SZWN0IChcbiAgICAge1xuICAgICAgICAgIC4uLiBmYWJyaWNfYmFzZV9vYnRpb25zLFxuICAgICAgICAgIC4uLiBvcHQsXG4gICAgICAgICAgd2lkdGggOiBzaXplICogc2NhbGUsXG4gICAgICAgICAgaGVpZ2h0OiBzaXplICogc2NhbGUsXG4gICAgIH0pXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYW50YWdvbiAoIGRlZjogJEdlb21ldHJ5LCBzaXplOiBudW1iZXIsIG9wdDogZmFicmljLklPYmplY3RPcHRpb25zIClcbntcbiAgICAgY29uc3QgcG9pbnRzID0gW11cbiAgICAgY29uc3Qgc2NhbGUgPSAxLjFcbiAgICAgY29uc3QgciA9IHNpemUgLyAyICogc2NhbGVcblxuICAgICBmb3IgKCBjb25zdCBwIG9mIFtcbiAgICAgICAgICBbIDAsIDEgXSxcbiAgICAgICAgICBbIDAuOTUxMDU2NTE2Mjk1MTUzNSwgMC4zMDkwMTY5OTQzNzQ5NDc0NSBdLFxuICAgICAgICAgIFsgMC41ODc3ODUyNTIyOTI0NzMyLCAtMC44MDkwMTY5OTQzNzQ5NDczIF0sXG4gICAgICAgICAgWyAtMC41ODc3ODUyNTIyOTI0NzMsIC0wLjgwOTAxNjk5NDM3NDk0NzUgXSxcbiAgICAgICAgICBbIC0wLjk1MTA1NjUxNjI5NTE1MzYsIDAuMzA5MDE2OTk0Mzc0OTQ3MjMgXVxuICAgICBdKSBwb2ludHMucHVzaCAoeyB4OiBwWzBdICogciwgeTogcFsxXSAqIHIgfSlcblxuICAgICByZXR1cm4gbmV3IGZhYnJpYy5Qb2x5Z29uICggcG9pbnRzLCB7XG4gICAgICAgICAgLi4uIGZhYnJpY19iYXNlX29idGlvbnMsXG4gICAgICAgICAgLi4uIG9wdCxcbiAgICAgICAgICBhbmdsZTogMTgwLFxuICAgICB9KVxufVxuXG5leHBvcnQgZnVuY3Rpb24gaGV4YWdvbiAoIGRlZjogJEdlb21ldHJ5LCBzaXplOiBudW1iZXIsIG9wdDogZmFicmljLklPYmplY3RPcHRpb25zIClcbntcbiAgICAgY29uc3QgcG9pbnRzID0gW11cbiAgICAgY29uc3Qgc2NhbGUgPSAxLjFcbiAgICAgY29uc3QgciA9IHNpemUgLyAyICogc2NhbGVcblxuICAgICBmb3IgKCBjb25zdCBwIG9mIFtcbiAgICAgICAgICBbIDAsIDEgXSxcbiAgICAgICAgICBbIDAuODY2MDI1NDAzNzg0NDM4NiwgMC41MDAwMDAwMDAwMDAwMDAxIF0sXG4gICAgICAgICAgWyAwLjg2NjAyNTQwMzc4NDQzODcsIC0wLjQ5OTk5OTk5OTk5OTk5OTggXSxcbiAgICAgICAgICBbIDEuMjI0NjQ2Nzk5MTQ3MzUzMmUtMTYsIC0xIF0sXG4gICAgICAgICAgWyAtMC44NjYwMjU0MDM3ODQ0Mzg1LCAtMC41MDAwMDAwMDAwMDAwMDA0IF0sXG4gICAgICAgICAgWyAtMC44NjYwMjU0MDM3ODQ0MzksIDAuNDk5OTk5OTk5OTk5OTk5MzMgXSxcbiAgICAgXSkgcG9pbnRzLnB1c2ggKHsgeDogcFswXSAqIHIsIHk6IHBbMV0gKiByIH0pXG5cbiAgICAgcmV0dXJuIG5ldyBmYWJyaWMuUG9seWdvbiAoIHBvaW50cywge1xuICAgICAgICAgIC4uLiBmYWJyaWNfYmFzZV9vYnRpb25zLFxuICAgICAgICAgIC4uLiBvcHQsXG4gICAgICAgICAgYW5nbGU6IDkwLFxuICAgICB9KVxufVxuXG5leHBvcnQgZnVuY3Rpb24gdGV4dCAoIGRlZjogJFRleHREZWZpbml0aW9uLCBzaXplOiBudW1iZXIsIG9wdDogZmFicmljLlRleHRPcHRpb25zIClcbntcbiAgICAgcmV0dXJuIG5ldyBmYWJyaWMuVGV4dCAoIFwiLi4uXCIsIHtcbiAgICAgICAgICAuLi4gZmFicmljX2Jhc2Vfb2J0aW9ucyxcbiAgICAgICAgICAuLi4gb3B0LFxuICAgICAgICAgIGZvbnRTaXplOiBzaXplLFxuICAgICB9KVxufVxuXG5leHBvcnQgZnVuY3Rpb24gdGV4dGJveCAoIGRlZjogJFRleHREZWZpbml0aW9uLCBzaXplOiBudW1iZXIsIG9wdDogZmFicmljLlRleHRPcHRpb25zIClcbntcbiAgICAgcmV0dXJuIG5ldyBmYWJyaWMuVGV4dGJveCAoIFwiLi4uXCIsIHtcbiAgICAgICAgICAuLi4gZmFicmljX2Jhc2Vfb2J0aW9ucyxcbiAgICAgICAgICAuLi4gb3B0LFxuICAgICAgICAgIGZvbnRTaXplOiBzaXplLFxuICAgICB9KVxufVxuXG5leHBvcnQgZnVuY3Rpb24gcGF0aCAoIGRlZjogJFBhdGhEZWZpbml0aW9uLCBzaXplOiBudW1iZXIsIG9wdDogZmFicmljLklPYmplY3RPcHRpb25zIClcbntcbiAgICAgcmV0dXJuIG5ldyBmYWJyaWMuUGF0aCAoIGRlZi5wYXRoLFxuICAgICB7XG4gICAgICAgICAgLi4uIGZhYnJpY19iYXNlX29idGlvbnMsXG4gICAgICAgICAgLi4uIG9wdCxcbiAgICAgICAgICBzY2FsZVg6IHNpemUgLyAxMDAsIC8vIEVuIHN1cHBvc2FudCBxdWUgbGUgdmlld0JveFxuICAgICAgICAgIHNjYWxlWTogc2l6ZSAvIDEwMCwgLy8gZXN0IFwiMCAwIDEwMCAxMDBcIlxuICAgICB9KVxufVxuXG5jb25zdCBGYWN0b3J5ID0ge1xuICAgICBncm91cCxcbiAgICAgY2lyY2xlLFxuICAgICB0cmlhbmdsZSxcbiAgICAgc3F1YXJlLFxuICAgICBwYW50YWdvbixcbiAgICAgaGV4YWdvbiAsXG4gICAgIHRleHQsXG4gICAgIHRleHRib3ggLFxuICAgICBwYXRoLFxufVxuXG5cbmV4cG9ydCBjbGFzcyBHZW9tZXRyeSA8VCBleHRlbmRzIEdlb21ldHJ5TmFtZXMgPSBHZW9tZXRyeU5hbWVzPlxue1xuICAgICBjb25maWc6ICRHZW9tZXRyeVxuICAgICBvYmplY3Q6IFJldHVyblR5cGUgPHR5cGVvZiBGYWN0b3J5IFtUXT5cblxuICAgICBjb25zdHJ1Y3RvciAoIHJlYWRvbmx5IG93bmVyOiBTaGFwZSApXG4gICAgIHtcbiAgICAgICAgICB0aGlzLmNvbmZpZyA9IG93bmVyLmNvbmZpZ1xuICAgICAgICAgIHRoaXMudXBkYXRlU2hhcGUgKClcbiAgICAgfVxuXG4gICAgIHVwZGF0ZSAoIG9wdGlvbnM6IFBhcnRpYWwgPCRHZW9tZXRyeT4gKVxuICAgICB7XG4gICAgICAgICAgT2JqZWN0LmFzc2lnbiAoIHRoaXMuY29uZmlnLCBvcHRpb25zIClcblxuICAgICAgICAgIGlmICggXCJzaGFwZVwiIGluIG9wdGlvbnMgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHRoaXMudXBkYXRlU2hhcGUgKClcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZSBpZiAoIFwiYmFja2dyb3VuZEltYWdlXCIgaW4gb3B0aW9ucyB8fCBcImJhY2tncm91bmRSZXBlYXRcIiBpbiBvcHRpb25zIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICB0aGlzLnVwZGF0ZUJhY2tncm91bmRJbWFnZSAoKVxuICAgICAgICAgIH1cbiAgICAgfVxuXG4gICAgIHVwZGF0ZVBvc2l0aW9uICgpXG4gICAgIHtcbiAgICAgICAgICBjb25zdCB7IGNvbmZpZywgb2JqZWN0IH0gPSB0aGlzXG5cbiAgICAgICAgICA7KG9iamVjdCBhcyBmYWJyaWMuT2JqZWN0KS5zZXQgKHtcbiAgICAgICAgICAgICAgIGxlZnQ6IGNvbmZpZy54LFxuICAgICAgICAgICAgICAgdG9wIDogY29uZmlnLnksXG4gICAgICAgICAgfSlcbiAgICAgICAgICAuc2V0Q29vcmRzICgpXG4gICAgIH1cblxuICAgICB1cGRhdGVTaXplICgpXG4gICAgIHtcbiAgICAgICAgICBjb25zdCB7IG93bmVyLCBjb25maWcsIG9iamVjdCB9ID0gdGhpc1xuXG4gICAgICAgICAgY29uc3Qgc2l6ZSA9IG93bmVyLmRpc3BsYXlTaXplICgpXG5cbiAgICAgICAgICBpZiAoIGNvbmZpZy5zaGFwZSA9PSBcImNpcmNsZVwiIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICAob2JqZWN0IGFzIGZhYnJpYy5DaXJjbGUpLnNldCAoe1xuICAgICAgICAgICAgICAgICAgICByYWRpdXM6IHNpemUgLyAyXG4gICAgICAgICAgICAgICB9KVxuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgKG9iamVjdCBhcyBmYWJyaWMuT2JqZWN0KS5zZXQgKHtcbiAgICAgICAgICAgICAgICAgICAgd2lkdGggOiBzaXplLFxuICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IHNpemUsXG4gICAgICAgICAgICAgICB9KVxuICAgICAgICAgIH1cblxuICAgICAgICAgIG9iamVjdC5zZXRDb29yZHMgKClcbiAgICAgfVxuXG4gICAgIHVwZGF0ZVNoYXBlICggc2hhcGU/OiBHZW9tZXRyeU5hbWVzIClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHsgY29uZmlnLCBvd25lciB9ID0gdGhpc1xuXG4gICAgICAgICAgaWYgKCBhcmd1bWVudHMubGVuZ3RoID09IDAgKVxuICAgICAgICAgICAgICAgc2hhcGUgPSBjb25maWcuc2hhcGVcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICBjb25maWcuc2hhcGUgPSBzaGFwZVxuXG4gICAgICAgICAgaWYgKCBvd25lci5ncm91cCAhPSB1bmRlZmluZWQgJiYgdGhpcy5vYmplY3QgIT0gdW5kZWZpbmVkIClcbiAgICAgICAgICAgICAgIG93bmVyLmdyb3VwLnJlbW92ZSAoIHRoaXMub2JqZWN0IClcblxuICAgICAgICAgIGNvbnN0IG9iaiA9IHRoaXMub2JqZWN0XG4gICAgICAgICAgICAgICAgICAgID0gRmFjdG9yeSBbY29uZmlnLnNoYXBlIGFzIGFueV0gKCBjb25maWcsIG93bmVyLmRpc3BsYXlTaXplICgpLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgbGVmdCAgICAgICA6IDAsIC8vY29uZmlnLngsXG4gICAgICAgICAgICAgICAgICAgICAgICAgdG9wICAgICAgICA6IDAsIC8vY29uZmlnLnksXG4gICAgICAgICAgICAgICAgICAgICAgICAgb3JpZ2luWCAgICA6IFwiY2VudGVyXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgb3JpZ2luWSAgICA6IFwiY2VudGVyXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgZmlsbCAgICAgICA6IGNvbmZpZy5iYWNrZ3JvdW5kQ29sb3IsXG4gICAgICAgICAgICAgICAgICAgICAgICAgc3Ryb2tlICAgICA6IGNvbmZpZy5ib3JkZXJDb2xvcixcbiAgICAgICAgICAgICAgICAgICAgICAgICBzdHJva2VXaWR0aDogY29uZmlnLmJvcmRlcldpZHRoLFxuICAgICAgICAgICAgICAgICAgICB9KVxuXG4gICAgICAgICAgb3duZXIuZ3JvdXAuYWRkICggb2JqIClcbiAgICAgICAgICBvYmouc2VuZFRvQmFjayAoKVxuXG4gICAgICAgICAgaWYgKCBjb25maWcuYmFja2dyb3VuZEltYWdlICE9IHVuZGVmaW5lZCApXG4gICAgICAgICAgICAgICB0aGlzLnVwZGF0ZUJhY2tncm91bmRJbWFnZSAoKVxuXG4gICAgICAgICAgaWYgKCBvYmouY2FudmFzICE9IHVuZGVmaW5lZCApXG4gICAgICAgICAgICAgICBvYmouY2FudmFzLnJlcXVlc3RSZW5kZXJBbGwgKClcblxuICAgICB9XG5cbiAgICAgdXBkYXRlQmFja2dyb3VuZEltYWdlICggcGF0aD86IHN0cmluZyApXG4gICAgIHtcbiAgICAgICAgICBpZiAoIGFyZ3VtZW50cy5sZW5ndGggPT0gMCApXG4gICAgICAgICAgICAgICBwYXRoID0gdGhpcy5jb25maWcuYmFja2dyb3VuZEltYWdlXG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgdGhpcy5jb25maWcuYmFja2dyb3VuZEltYWdlID0gcGF0aFxuXG4gICAgICAgICAgaWYgKCB0eXBlb2YgcGF0aCA9PSBcInN0cmluZ1wiICYmIHBhdGgubGVuZ3RoID4gMCApXG4gICAgICAgICAgICAgICBmYWJyaWMudXRpbC5sb2FkSW1hZ2UgKCBwYXRoLCB0aGlzLm9uX3BhdHRlcm4uYmluZCAodGhpcykgKVxuICAgICB9XG5cbiAgICAgcHJpdmF0ZSBvbl9wYXR0ZXJuICggZGltZzogSFRNTEltYWdlRWxlbWVudCApXG4gICAgIHtcbiAgICAgICAgICBjb25zdCB7IG93bmVyIH0gPSB0aGlzXG5cbiAgICAgICAgICBjb25zdCBmYWN0b3IgPSBkaW1nLndpZHRoIDwgZGltZy5oZWlnaHRcbiAgICAgICAgICAgICAgICAgICAgICAgICA/IG93bmVyLmRpc3BsYXlTaXplICgpIC8gZGltZy53aWR0aFxuICAgICAgICAgICAgICAgICAgICAgICAgIDogb3duZXIuZGlzcGxheVNpemUgKCkgLyBkaW1nLmhlaWdodFxuXG4gICAgICAgICAgOyh0aGlzLm9iamVjdCBhcyBhbnkpLnNldCAoe1xuICAgICAgICAgICAgICAgZmlsbDogbmV3IGZhYnJpYy5QYXR0ZXJuICh7XG4gICAgICAgICAgICAgICAgICAgIHNvdXJjZTogZGltZyxcbiAgICAgICAgICAgICAgICAgICAgcmVwZWF0OiBcIm5vLXJlcGVhdFwiLFxuICAgICAgICAgICAgICAgICAgICBwYXR0ZXJuVHJhbnNmb3JtOiBbXG4gICAgICAgICAgICAgICAgICAgICAgICAgZmFjdG9yLCAwLCAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgIGZhY3RvciwgMCwgMCxcbiAgICAgICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5zZXRDb29yZHMgKClcblxuICAgICAgICAgIGlmICggdGhpcy5vYmplY3QuY2FudmFzIClcbiAgICAgICAgICAgICAgIHRoaXMub2JqZWN0LmNhbnZhcy5yZW5kZXJBbGwgKClcbiAgICAgfVxufVxuIiwiXG5pbXBvcnQgeyBHZW9tZXRyeSB9IGZyb20gXCIuL2dlb21ldHJ5XCJcbmltcG9ydCB7IEN0b3IgYXMgRGF0YUN0b3IgfSBmcm9tIFwiLi4vRGF0YS9pbmRleFwiXG5cbmRlY2xhcmUgZ2xvYmFsXG57XG4gICAgIGludGVyZmFjZSAkU2hhcGVFdmVudHMgPEQgZXh0ZW5kcyAkTm9kZSA9IGFueT5cbiAgICAge1xuICAgICAgICAgIG9uQ3JlYXRlOiAoIGVudGl0eTogRCwgYXNwZWN0OiBTaGFwZSApID0+IHZvaWQsXG4gICAgICAgICAgb25EZWxldGU6ICggZW50aXR5OiBELCBzaGFwZTogU2hhcGUgKSA9PiB2b2lkLFxuICAgICAgICAgIG9uVG91Y2g6ICggYXNwZWN0OiBTaGFwZSApID0+IHZvaWRcbiAgICAgfVxuXG4gICAgIGludGVyZmFjZSAkU2hhcGUgPEQgZXh0ZW5kcyAkVGhpbmcgPSAkVGhpbmc+IGV4dGVuZHMgJE5vZGUsICRHZW9tZXRyeSwgJFNoYXBlRXZlbnRzXG4gICAgIHtcbiAgICAgICAgICBjb250ZXh0OiBcImNvbmNlcHQtYXNwZWN0XCJcblxuICAgICAgICAgIGRhdGE6IERcblxuICAgICAgICAgIG1pblNpemUgICA6IG51bWJlclxuICAgICAgICAgIHNpemVPZmZzZXQ6IG51bWJlclxuICAgICAgICAgIHNpemVGYWN0b3I6IG51bWJlclxuICAgICB9XG59XG5cbmV4cG9ydCB0eXBlIEN0b3IgPERhdGEgZXh0ZW5kcyAkU2hhcGUgPSAkU2hhcGUsIFQgZXh0ZW5kcyBTaGFwZSA9IFNoYXBlPiA9IERhdGFDdG9yIDxEYXRhLCBUPlxuXG5leHBvcnQgY2xhc3MgU2hhcGUgPCQgZXh0ZW5kcyAkU2hhcGUgPSAkU2hhcGU+XG57XG4gICAgIGRlZmF1bHRDb25maWcgKCk6ICRTaGFwZVxuICAgICB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgIGNvbnRleHQ6IFwiY29uY2VwdC1hc3BlY3RcIixcbiAgICAgICAgICAgICAgIHR5cGUgICA6IFwic2hhcGVcIixcbiAgICAgICAgICAgICAgIGlkICAgICA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgIGRhdGEgICA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgIHggICAgICA6IDAsXG4gICAgICAgICAgICAgICB5ICAgICAgOiAwLFxuICAgICAgICAgICAgICAgLy9zaXplICAgICAgOiAyMCxcbiAgICAgICAgICAgICAgIG1pblNpemUgICA6IDEsXG4gICAgICAgICAgICAgICBzaXplRmFjdG9yOiAxLFxuICAgICAgICAgICAgICAgc2l6ZU9mZnNldDogMCxcblxuICAgICAgICAgICAgICAgc2hhcGUgICAgICAgICAgIDogXCJjaXJjbGVcIixcbiAgICAgICAgICAgICAgIGJvcmRlckNvbG9yICAgICA6IFwiZ3JheVwiLFxuICAgICAgICAgICAgICAgYm9yZGVyV2lkdGggICAgIDogNSxcblxuICAgICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yIDogXCJ0cmFuc3BhcmVudFwiLFxuICAgICAgICAgICAgICAgYmFja2dyb3VuZEltYWdlIDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgYmFja2dyb3VuZFJlcGVhdDogZmFsc2UsXG5cbiAgICAgICAgICAgICAgIG9uQ3JlYXRlICAgICAgICA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgIG9uRGVsZXRlICAgICAgICA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgIG9uVG91Y2ggICAgICAgICA6IHVuZGVmaW5lZCxcbiAgICAgICAgICB9XG4gICAgIH1cblxuICAgICByZWFkb25seSBjb25maWc6ICRcblxuICAgICBncm91cCA9IHVuZGVmaW5lZCBhcyBmYWJyaWMuR3JvdXBcblxuICAgICByZWFkb25seSBiYWNrZ3JvdW5kOiBHZW9tZXRyeVxuICAgICByZWFkb25seSBib3JkZXI6IEdlb21ldHJ5XG5cbiAgICAgY29uc3RydWN0b3IgKCBkYXRhOiAkIClcbiAgICAge1xuICAgICAgICAgIHRoaXMuYmFja2dyb3VuZCA9IHVuZGVmaW5lZFxuICAgICAgICAgIHRoaXMuYm9yZGVyID0gdW5kZWZpbmVkXG4gICAgICAgICAgdGhpcy5jb25maWcgPSB7XG4gICAgICAgICAgICAgICAuLi4gdGhpcy5kZWZhdWx0Q29uZmlnICgpLFxuICAgICAgICAgICAgICAgLi4uIGRhdGFcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjb25zdCB7IGNvbmZpZyB9ID0gdGhpc1xuXG4gICAgICAgICAgY29uc3QgZ3JvdXAgPSB0aGlzLmdyb3VwID0gbmV3IGZhYnJpYy5Hcm91cCAoIFtdLFxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHdpZHRoICAgICAgOiB0aGlzLmRpc3BsYXlTaXplICgpLFxuICAgICAgICAgICAgICAgaGVpZ2h0ICAgICA6IHRoaXMuZGlzcGxheVNpemUgKCksXG4gICAgICAgICAgICAgICBsZWZ0ICAgICAgIDogY29uZmlnLngsXG4gICAgICAgICAgICAgICB0b3AgICAgICAgIDogY29uZmlnLnksXG4gICAgICAgICAgICAgICBoYXNCb3JkZXJzIDogdHJ1ZSxcbiAgICAgICAgICAgICAgIGhhc0NvbnRyb2xzOiB0cnVlLFxuICAgICAgICAgICAgICAgb3JpZ2luWCAgICA6IFwiY2VudGVyXCIsXG4gICAgICAgICAgICAgICBvcmlnaW5ZICAgIDogXCJjZW50ZXJcIixcbiAgICAgICAgICB9KVxuXG4gICAgICAgICAgOyh0aGlzLmJhY2tncm91bmQgYXMgR2VvbWV0cnkpID0gbmV3IEdlb21ldHJ5ICggdGhpcyApXG5cbiAgICAgICAgICBncm91cC5zZXRDb29yZHMgKClcbiAgICAgfVxuXG4gICAgIGRpc3BsYXlTaXplICgpXG4gICAgIHtcbiAgICAgICAgICBjb25zdCBjb25maWcgPSB0aGlzLmNvbmZpZ1xuXG4gICAgICAgICAgdmFyIHNpemUgPSAoMSArIGNvbmZpZy5zaXplT2Zmc2V0KSAqIGNvbmZpZy5zaXplRmFjdG9yXG5cbiAgICAgICAgICBpZiAoIHNpemUgPCBjb25maWcubWluU2l6ZSApXG4gICAgICAgICAgICAgICBzaXplID0gY29uZmlnLm1pblNpemVcblxuICAgICAgICAgIHJldHVybiBzaXplIHx8IDFcbiAgICAgfVxuXG4gICAgIHVwZGF0ZVNpemUgKClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHsgZ3JvdXAsIGNvbmZpZyB9ID0gdGhpc1xuXG4gICAgICAgICAgaWYgKCB0aGlzLmJhY2tncm91bmQgKVxuICAgICAgICAgICAgICAgdGhpcy5iYWNrZ3JvdW5kLnVwZGF0ZVNpemUgKClcblxuICAgICAgICAgIGlmICggdGhpcy5ib3JkZXIgKVxuICAgICAgICAgICAgICAgdGhpcy5ib3JkZXIudXBkYXRlU2l6ZSAoKVxuXG4gICAgICAgICAgZ3JvdXAuc2V0ICh7XG4gICAgICAgICAgICAgICB3aWR0aCA6IHRoaXMuZGlzcGxheVNpemUgKCksXG4gICAgICAgICAgICAgICBoZWlnaHQ6IHRoaXMuZGlzcGxheVNpemUgKCksXG4gICAgICAgICAgfSlcblxuICAgICAgICAgIGlmICggZ3JvdXAuY2FudmFzIClcbiAgICAgICAgICAgICAgIGdyb3VwLmNhbnZhcy5yZXF1ZXN0UmVuZGVyQWxsICgpXG4gICAgIH1cblxuICAgICBjb29yZHMgKClcbiAgICAge1xuICAgICAgICAgIHJldHVybiB0aGlzLmdyb3VwLmdldENvb3JkcyAoKVxuICAgICB9XG5cbiAgICAgc2V0QmFja2dyb3VuZCAoIG9wdGlvbnM6IFBhcnRpYWwgPCRHZW9tZXRyeT4gKVxuICAgICB7XG4gICAgICAgICAgT2JqZWN0LmFzc2lnbiAoIHRoaXMuY29uZmlnLCBvcHRpb25zIClcblxuICAgICAgICAgIHRoaXMuYmFja2dyb3VuZC51cGRhdGUgKCBvcHRpb25zIClcblxuICAgICAgICAgIHRoaXMudXBkYXRlU2l6ZSAoKVxuICAgICB9XG5cbiAgICAgc2V0UG9zaXRpb24gKCB4OiBudW1iZXIsIHk6IG51bWJlciApXG4gICAgIHtcbiAgICAgICAgICBjb25zdCB7IGdyb3VwLCBjb25maWcgfSA9IHRoaXNcblxuICAgICAgICAgIGNvbmZpZy54ID0geFxuICAgICAgICAgIGNvbmZpZy55ID0geVxuICAgICAgICAgIGdyb3VwLnNldCAoeyBsZWZ0OiB4LCB0b3AgOiB5IH0pLnNldENvb3JkcyAoKVxuXG4gICAgICAgICAgaWYgKCBncm91cC5jYW52YXMgKVxuICAgICAgICAgICAgICAgZ3JvdXAuY2FudmFzLnJlcXVlc3RSZW5kZXJBbGwgKClcbiAgICAgfVxuXG4gICAgIGhvdmVyICggdXA6IGJvb2xlYW4gKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgdGFyZ2V0ID0gdGhpcy5iYWNrZ3JvdW5kICE9IHVuZGVmaW5lZFxuICAgICAgICAgICAgICAgICAgICAgICAgID8gdGhpcy5iYWNrZ3JvdW5kLm9iamVjdFxuICAgICAgICAgICAgICAgICAgICAgICAgIDogdGhpcy5ncm91cFxuXG4gICAgICAgICAgdGFyZ2V0LnNldFNoYWRvdyggJ3JnYmEoMCwwLDAsMC4zKScgKVxuXG4gICAgICAgICAgZmFicmljLnV0aWwuYW5pbWF0ZSh7XG4gICAgICAgICAgICAgICBzdGFydFZhbHVlOiB1cCA/IDAgOiAxLFxuICAgICAgICAgICAgICAgZW5kVmFsdWUgIDogdXAgPyAxIDogMCxcbiAgICAgICAgICAgICAgIGVhc2luZyAgICA6IGZhYnJpYy51dGlsLmVhc2UuZWFzZU91dEN1YmljLFxuICAgICAgICAgICAgICAgYnlWYWx1ZSAgIDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgZHVyYXRpb24gIDogMTAwLFxuICAgICAgICAgICAgICAgb25DaGFuZ2UgIDogKCB2YWx1ZTogbnVtYmVyICkgPT5cbiAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgb2Zmc2V0ID0gMSAqIHZhbHVlXG5cbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0LnNldFNoYWRvdyggYCR7IG9mZnNldCB9cHggJHsgb2Zmc2V0IH1weCAkeyAxMCAqIHZhbHVlIH1weCByZ2JhKDAsMCwwLDAuMylgIClcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0LnNjYWxlKCAxICsgMC4xICogdmFsdWUgKVxuICAgICAgICAgICAgICAgICAgICB0YXJnZXQuY2FudmFzLnJlcXVlc3RSZW5kZXJBbGwgKClcbiAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSlcbiAgICAgfVxuXG4gICAgIHRvSnNvbiAoKVxuICAgICB7XG4gICAgICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5ICggdGhpcy5jb25maWcgKVxuICAgICB9XG59XG4iLCJcbmltcG9ydCB7IERhdGFiYXNlLCBGYWN0b3J5IH0gZnJvbSBcIi4uL0RhdGEvaW5kZXhcIlxuaW1wb3J0IHsgU2hhcGUgfSBmcm9tIFwiLi9zaGFwZVwiXG5pbXBvcnQgeyBXcml0YWJsZSwgT3B0aW9uYWwgfSBmcm9tIFwiLi4vTGliL2luZGV4XCJcblxuXG5jb25zdCBDT05URVhUID0gXCJjb25jZXB0LWFzcGVjdFwiXG5jb25zdCBkYiAgICAgID0gbmV3IERhdGFiYXNlICgpXG5jb25zdCBmYWN0b3J5ID0gbmV3IEZhY3RvcnkgPFNoYXBlPiAoIGRiIClcbmNvbnN0IEFTUEVDVCAgPSBTeW1ib2wuZm9yICggXCJBU1BFQ1RcIiApXG5cbnR5cGUgJEluIDwkIGV4dGVuZHMgJFNoYXBlID0gJFNoYXBlPiA9IE9wdGlvbmFsIDwkLCBcImNvbnRleHRcIj5cblxuLyoqXG4gKiBBc3NpZ25lIHNpIGJlc29pbiBsZSBjb250ZXh0ZSBcImFzcGVjdFwiIGF1IG5vZXVkXG4gKi9cbmZ1bmN0aW9uIG5vcm1hbGl6ZSAoIG5vZGU6ICRJbiApXG57XG4gICAgIGlmICggXCJjb250ZXh0XCIgaW4gbm9kZSApXG4gICAgIHtcbiAgICAgICAgICBpZiAoIG5vZGUuY29udGV4dCAhPT0gQ09OVEVYVCApXG4gICAgICAgICAgICAgICB0aHJvdyBcIkJhZCBjb250ZXh0IHZhbHVlXCJcbiAgICAgfVxuICAgICBlbHNlXG4gICAgIHtcbiAgICAgICAgICAobm9kZSBhcyBXcml0YWJsZSA8JFNoYXBlPikuY29udGV4dCA9IENPTlRFWFRcbiAgICAgfVxuXG4gICAgIHJldHVybiBub2RlIGFzICRTaGFwZVxufVxuXG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRBc3BlY3QgPFQgZXh0ZW5kcyBTaGFwZT4gKCBvYmo6ICROb2RlIHwgU2hhcGUgfCBmYWJyaWMuT2JqZWN0ICk6IFQgfCB1bmRlZmluZWRcbntcbiAgICAgaWYgKCBvYmogPT0gdW5kZWZpbmVkIClcbiAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkXG5cbiAgICAgaWYgKCBvYmogaW5zdGFuY2VvZiBTaGFwZSApXG4gICAgICAgICAgcmV0dXJuIG9iaiBhcyBUXG5cbiAgICAgaWYgKCBvYmogaW5zdGFuY2VvZiBmYWJyaWMuT2JqZWN0IClcbiAgICAgICAgICByZXR1cm4gb2JqIFtBU1BFQ1RdXG5cbiAgICAgaWYgKCBmYWN0b3J5LmluU3RvY2sgKCBDT05URVhULCBvYmoudHlwZSwgb2JqLmlkICkgKVxuICAgICAgICAgIHJldHVybiBmYWN0b3J5Lm1ha2UgKCBDT05URVhULCBvYmoudHlwZSwgb2JqLmlkIClcblxuICAgICBjb25zdCBvcHRpb25zICA9IG9iai5jb250ZXh0ID09IENPTlRFWFRcbiAgICAgICAgICAgICAgICAgICAgPyBvYmogYXMgJFNoYXBlXG4gICAgICAgICAgICAgICAgICAgIDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRleHQ6IENPTlRFWFQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgdHlwZSAgIDogb2JqLnR5cGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgaWQgICAgIDogb2JqLmlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGEgICA6IG9iaixcbiAgICAgICAgICAgICAgICAgICAgfSBhcyAkU2hhcGVcblxuICAgICBpZiAoICEgaXNGaW5pdGUgKG9wdGlvbnMueCkgKVxuICAgICAgICAgIG9wdGlvbnMueCA9IDBcblxuICAgICBpZiAoICEgaXNGaW5pdGUgKG9wdGlvbnMueSkgKVxuICAgICAgICAgIG9wdGlvbnMueSA9IDBcblxuICAgICBjb25zdCBzaGFwZSA9IGZhY3RvcnkubWFrZSAoIG9wdGlvbnMgKVxuXG4gICAgIC8vIHNoYXBlLmV2ZW50cyA9IGFyZ3VtZW50cy5ldmVudHNcbiAgICAgLy8gT2JqZWN0LmFzc2lnbiAoIHNoYXBlLCBldmVudHMgKVxuXG4gICAgIC8vc2hhcGUuaW5pdCAoKVxuICAgICBzaGFwZS5ncm91cCBbQVNQRUNUXSA9IHNoYXBlXG5cbiAgICAgaWYgKCBzaGFwZS5jb25maWcub25DcmVhdGUgKVxuICAgICAgICAgIHNoYXBlLmNvbmZpZy5vbkNyZWF0ZSAoIHNoYXBlLmNvbmZpZy5kYXRhLCBzaGFwZSApXG5cbiAgICAgcmV0dXJuIHNoYXBlIGFzIFRcbn1cblxuXG5leHBvcnQgZnVuY3Rpb24gc2V0QXNwZWN0IDwkIGV4dGVuZHMgJFNoYXBlPiAoIG5vZGU6ICRJbiA8JD4gKVxue1xuICAgICBkYi5zZXQgKCBub3JtYWxpemUgKCBub2RlICkgKVxufVxuXG5cbmV4cG9ydCBmdW5jdGlvbiBkZWZpbmVBc3BlY3QgKCBjdG9yOiBuZXcgKCBkYXRhOiAkU2hhcGUgKSA9PiBTaGFwZSwgdHlwZTogc3RyaW5nIClcbntcbiAgICAgZmFjdG9yeS5fZGVmaW5lICggY3RvciwgW0NPTlRFWFQsIHR5cGVdIClcbn1cbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuL25vZGVzLmQudHNcIiAvPlxuXG5pbXBvcnQgeyBEYXRhYmFzZSB9IGZyb20gXCIuLi9EYXRhL2luZGV4XCJcbmltcG9ydCB7IE9wdGlvbmFsIH0gZnJvbSBcIi4uL0xpYi9pbmRleFwiXG5cblxuZGVjbGFyZSBnbG9iYWxcbntcbiAgICAgY29uc3QgQ09OVEVYVF9EQVRBOiBcImNvbmNlcHQtZGF0YVwiXG4gICAgIC8vIGZ1bmN0aW9uIG5vZGUgPFQgZXh0ZW5kcyAkSW5wdXROb2RlPiAoIHR5cGU6IHN0cmluZywgaWQ6IHN0cmluZyApICAgIDogJE91dHB1dE5vZGUgPFQ+XG4gICAgIC8vIGZ1bmN0aW9uIG5vZGUgPFQgZXh0ZW5kcyAkSW5wdXROb2RlPiAoIHR5cGU6IHN0cmluZywgZGVzY3JpcHRpb246IFQgKTogJE91dHB1dE5vZGUgPFQ+XG4gICAgIC8vIGZ1bmN0aW9uIG5vZGUgPFQgZXh0ZW5kcyAkSW5wdXROb2RlPiAoIGRlc2NyaXB0aW9uOiBUICkgICAgICAgICAgICAgIDogJE91dHB1dE5vZGUgPFQ+XG59XG5PYmplY3QuZGVmaW5lUHJvcGVydHkgKCBnbG9iYWxUaGlzLCBcIkNPTlRFWFRfREFUQVwiLCB7XG4gICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICAgdmFsdWU6IFwiY29uY2VwdC1kYXRhXCJcbn0pXG5cblxudHlwZSAkSW5wdXROb2RlID0gT3B0aW9uYWwgPCRUaGluZywgXCJjb250ZXh0XCIgfCBcInR5cGVcIj5cbnR5cGUgJE91dHB1dE5vZGUgPEluIGV4dGVuZHMgJElucHV0Tm9kZT4gPSBSZXF1aXJlZCA8SW4+XG5cblxuY29uc3QgZGIgPSBuZXcgRGF0YWJhc2UgKClcblxuXG5leHBvcnQgZnVuY3Rpb24gbm9kZSA8VCBleHRlbmRzICRJbnB1dE5vZGU+ICggdHlwZTogc3RyaW5nLCBpZDogc3RyaW5nICkgICAgOiAkT3V0cHV0Tm9kZSA8VD5cbmV4cG9ydCBmdW5jdGlvbiBub2RlIDxUIGV4dGVuZHMgJElucHV0Tm9kZT4gKCB0eXBlOiBzdHJpbmcsIGRlc2NyaXB0aW9uOiBUICk6ICRPdXRwdXROb2RlIDxUPlxuZXhwb3J0IGZ1bmN0aW9uIG5vZGUgPFQgZXh0ZW5kcyAkVGhpbmc+ICAgICAoIGRlc2NyaXB0aW9uOiBUICkgICAgICAgICAgICAgIDogJFRoaW5nXG5cbmV4cG9ydCBmdW5jdGlvbiBub2RlICggYTogc3RyaW5nIHwgJElucHV0Tm9kZSwgYj86IHN0cmluZyB8ICRJbnB1dE5vZGUgKSA6ICRUaGluZ1xue1xuICAgICBzd2l0Y2ggKCBhcmd1bWVudHMubGVuZ3RoIClcbiAgICAge1xuICAgICBjYXNlIDE6IC8vIGRhdGEgKCBkZXNjcmlwdGlvbiApXG5cbiAgICAgICAgICBpZiAoIHR5cGVvZiBhICE9IFwib2JqZWN0XCIgfHwgYSA9PSBudWxsIHx8IEFycmF5LmlzQXJyYXkgKGEpIClcbiAgICAgICAgICAgICAgIHRocm93IGBCYWQgYXJndW1lbnQgXCJkZXNjcmlwdGlvblwiIDogJHsgYSB9YFxuXG4gICAgICAgICAgYiA9IGFcbiAgICAgICAgICBhID0gYi50eXBlXG5cbiAgICAgY2FzZSAyOiAvLyBkYXRhICggdHlwZSwgaWQgKSB8IGRhdGEgKCB0eXBlLCBkZXNjcmlwdGlvbiApXG5cbiAgICAgICAgICBpZiAoIHR5cGVvZiBhICE9IFwic3RyaW5nXCIgKVxuICAgICAgICAgICAgICAgdGhyb3cgYEJhZCBhcmd1bWVudCBcInR5cGVcIiA6ICR7IGEgfWBcblxuICAgICAgICAgIGlmICggdHlwZW9mIGIgPT0gXCJzdHJpbmdcIiApXG4gICAgICAgICAgICAgICByZXR1cm4gZGIuZ2V0ICggQ09OVEVYVF9EQVRBLCBhLCBiIClcblxuICAgICAgICAgIGlmICggdHlwZW9mIGIgIT0gXCJvYmplY3RcIiB8fCBiID09IG51bGwgfHwgQXJyYXkuaXNBcnJheSAoYikgKVxuICAgICAgICAgICAgICAgdGhyb3cgYEJhZCBhcmd1bWVudCBcImRlc2NyaXB0aW9uXCIgOiAkeyBiIH1gXG5cbiAgICAgICAgICA7KGIgYXMgYW55KS5jb250ZXh0ID0gQ09OVEVYVF9EQVRBXG4gICAgICAgICAgOyhiIGFzIGFueSkudHlwZSA9IGFcbiAgICAgICAgICByZXR1cm4gZGIuc2V0ICggYiBhcyAkVGhpbmcgKVxuXG4gICAgIGRlZmF1bHQ6XG4gICAgICAgICAgdGhyb3cgYEJhZCBhcmd1bWVudHM6IDIgYXJndW1lbnRzIGV4cGVjdGVkIGJ1dCAkeyBhcmd1bWVudHMubGVuZ3RoIH0gcmVjZWl2ZWRgXG4gICAgIH1cbn1cblxuIiwiXG5pbXBvcnQgKiBhcyBkYiBmcm9tIFwiLi4vQXBwbGljYXRpb24vZGF0YVwiXG5pbXBvcnQgeyBTaGFwZSB9IGZyb20gXCIuL3NoYXBlXCJcblxuZXhwb3J0IHR5cGUgQmFkZ2VQb3NpdGlvbiA9IHsgYW5nbGU6IG51bWJlciwgb2Zmc2V0OiBudW1iZXIgfVxuXG5leHBvcnQgY2xhc3MgQmFkZ2UgZXh0ZW5kcyBTaGFwZVxue1xuICAgICByZWFkb25seSBvd25lciA9IHVuZGVmaW5lZCBhcyBTaGFwZVxuXG4gICAgIHJlYWRvbmx5IHBvc2l0aW9uID0geyBhbmdsZTogMCwgb2Zmc2V0OiAwIH1cblxuICAgICBjb25zdHJ1Y3RvciAoIG9wdGlvbnM6ICRTaGFwZSApXG4gICAgIHtcbiAgICAgICAgICBzdXBlciAoIG9wdGlvbnMgKVxuXG4gICAgICAgICAgY29uc3QgeyBncm91cCB9ID0gdGhpc1xuXG4gICAgICAgICAgY29uc3QgdGhpc2RhdGEgPSB0aGlzLmNvbmZpZy5kYXRhXG4gICAgICAgICAgY29uc3QgZW50aXR5ID0gZGIubm9kZSA8JEJhZGdlPiAoIHRoaXNkYXRhLnR5cGUsIHRoaXNkYXRhLmlkIClcblxuICAgICAgICAgIGNvbnN0IHRleHQgPSBuZXcgZmFicmljLlRleHRib3ggKCBlbnRpdHkuZW1vamkgfHwgXCJYXCIsIHtcbiAgICAgICAgICAgICAgIGZvbnRTaXplOiB0aGlzLmRpc3BsYXlTaXplICgpLFxuICAgICAgICAgICAgICAgb3JpZ2luWCA6IFwiY2VudGVyXCIsXG4gICAgICAgICAgICAgICBvcmlnaW5ZIDogXCJjZW50ZXJcIixcbiAgICAgICAgICAgICAgIGxlZnQgICAgOiBncm91cC5sZWZ0LFxuICAgICAgICAgICAgICAgdG9wICAgICA6IGdyb3VwLnRvcCxcbiAgICAgICAgICB9KVxuXG4gICAgICAgICAgZ3JvdXAuYWRkV2l0aFVwZGF0ZSAoIHRleHQgKVxuICAgICB9XG5cbiAgICAgZGlzcGxheVNpemUgKClcbiAgICAge1xuICAgICAgICAgIHJldHVybiAyMFxuICAgICB9XG5cbiAgICAgYXR0YWNoICggdGFyZ2V0OiBTaGFwZSwgcG9zID0ge30gYXMgQmFkZ2VQb3NpdGlvbiApXG4gICAgIHtcbiAgICAgICAgICBjb25zdCB7IHJhbmRvbSwgUEkgfSA9IE1hdGhcblxuICAgICAgICAgIGlmICggISBpc0Zpbml0ZSAoIHBvcy5hbmdsZSApIClcbiAgICAgICAgICAgICAgIHBvcy5hbmdsZSA9IHJhbmRvbSAoKSAqIFBJICogMlxuXG4gICAgICAgICAgaWYgKCAhIGlzRmluaXRlICggcG9zLm9mZnNldCApIClcbiAgICAgICAgICAgICAgIHBvcy5vZmZzZXQgPSAwLjFcblxuICAgICAgICAgIDsodGhpcy5wb3NpdGlvbiBhcyBCYWRnZVBvc2l0aW9uKSA9IHsgLi4uIHBvcyB9XG5cbiAgICAgICAgICBpZiAoIHRoaXMub3duZXIgIT0gdW5kZWZpbmVkIClcbiAgICAgICAgICAgICAgIHRhcmdldC5ncm91cC5yZW1vdmUgKCB0aGlzLmdyb3VwIClcblxuICAgICAgICAgIHRhcmdldC5ncm91cC5hZGQgKCB0aGlzLmdyb3VwIClcblxuICAgICAgICAgIDsodGhpcy5vd25lciBhcyBTaGFwZSkgPSB0YXJnZXRcblxuICAgICAgICAgIHRoaXMudXBkYXRlUG9zaXRpb24gKClcbiAgICAgfVxuXG4gICAgIHVwZGF0ZVBvc2l0aW9uICgpXG4gICAgIHtcbiAgICAgICAgICBjb25zdCB7IHBvc2l0aW9uOiBwb3MsIG93bmVyIH0gPSB0aGlzXG5cbiAgICAgICAgICBpZiAoIG93bmVyID09IHVuZGVmaW5lZCApXG4gICAgICAgICAgICAgICByZXR1cm5cblxuICAgICAgICAgIGNvbnN0IHsgcmFuZG9tLCBQSSwgY29zLCBzaW4gfSA9IE1hdGhcblxuICAgICAgICAgIGNvbnN0IHJhZCAgICA9IHBvcy5hbmdsZSB8fCByYW5kb20gKCkgKiBQSSAqIDJcbiAgICAgICAgICBjb25zdCB4ICAgICAgPSBzaW4gKHJhZClcbiAgICAgICAgICBjb25zdCB5ICAgICAgPSBjb3MgKHJhZClcbiAgICAgICAgICBjb25zdCBzICAgICAgPSBvd25lci5kaXNwbGF5U2l6ZSAoKSAvIDJcbiAgICAgICAgICBjb25zdCBvZmZzZXQgPSB0eXBlb2YgcG9zLm9mZnNldCA9PSBcIm51bWJlclwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgPyB0aGlzLmRpc3BsYXlTaXplICgpICogcG9zLm9mZnNldFxuICAgICAgICAgICAgICAgICAgICAgICAgIDogdGhpcy5kaXNwbGF5U2l6ZSAoKSAqIDAuMVxuXG4gICAgICAgICAgdGhpcy5zZXRQb3NpdGlvbiAoIHggKiAocyArIG9mZnNldCksIHkgKiAocyArIG9mZnNldCkgKVxuICAgICB9XG59XG4iLCJcbmltcG9ydCB7IEdlb21ldHJ5IH0gZnJvbSBcIi4uL0xpYi9pbmRleFwiXG5pbXBvcnQgeyBnZXRBc3BlY3QgfSBmcm9tIFwiLi9kYlwiXG5pbXBvcnQgeyBTaGFwZSB9IGZyb20gXCIuL3NoYXBlXCJcblxuZXhwb3J0IGNsYXNzIEdyb3VwIDwkIGV4dGVuZHMgJFNoYXBlIDwkR3JvdXA+ID0gJFNoYXBlIDwkR3JvdXA+PiBleHRlbmRzIFNoYXBlIDwkPlxue1xuICAgICByZWFkb25seSBjaGlsZHJlbjogU2hhcGUgW11cblxuICAgICBkaXNwbGF5X3NpemUgPSAxXG5cbiAgICAgY29uc3RydWN0b3IgKCBvcHRpb25zOiAkIClcbiAgICAge1xuICAgICAgICAgIHN1cGVyICggb3B0aW9ucyApXG4gICAgICAgICAgdGhpcy5jaGlsZHJlbiA9IFtdXG4gICAgIC8vIH1cblxuICAgICAvLyBpbml0ICgpXG4gICAgIC8vIHtcbiAgICAgLy8gICAgICBzdXBlci5pbml0ICgpXG5cbiAgICAgICAgICBjb25zdCBlbnRpdHkgPSB0aGlzLmNvbmZpZy5kYXRhXG5cbiAgICAgICAgICAvL2ZvciAoIGNvbnN0IGNoaWxkIG9mIE9iamVjdC52YWx1ZXMgKCBlbnRpdHkuY2hpbGRyZW4gKSApXG4gICAgICAgICAgZm9yICggY29uc3QgY2hpbGQgb2YgT2JqZWN0LnZhbHVlcyAoIGVudGl0eS5pdGVtcyApIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBjb25zdCBhID0gZ2V0QXNwZWN0ICggY2hpbGQgKVxuICAgICAgICAgICAgICAgLy9hLmluaXQgKClcbiAgICAgICAgICAgICAgIHRoaXMuYWRkICggYSApXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdGhpcy5wYWNrICgpXG4gICAgIH1cblxuICAgICBkaXNwbGF5U2l6ZSAoKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgY29uZmlnID0gdGhpcy5jb25maWdcblxuICAgICAgICAgIHZhciBzaXplID0gKHRoaXMuZGlzcGxheV9zaXplICsgY29uZmlnLnNpemVPZmZzZXQpICogY29uZmlnLnNpemVGYWN0b3JcblxuICAgICAgICAgIGlmICggc2l6ZSA8IGNvbmZpZy5taW5TaXplIClcbiAgICAgICAgICAgICAgIHNpemUgPSBjb25maWcubWluU2l6ZVxuXG4gICAgICAgICAgcmV0dXJuIHNpemUgfHwgMVxuICAgICB9XG5cbiAgICAgYWRkICggY2hpbGQ6IFNoYXBlIClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHsgZ3JvdXAgfSA9IHRoaXNcblxuICAgICAgICAgIHRoaXMuY2hpbGRyZW4ucHVzaCAoIGNoaWxkIClcblxuICAgICAgICAgIGlmICggZ3JvdXAgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGdyb3VwLmFkZCAoIGNoaWxkLmdyb3VwIClcbiAgICAgICAgICAgICAgIGdyb3VwLnNldENvb3JkcyAoKVxuICAgICAgICAgIH1cbiAgICAgfVxuXG4gICAgIHBhY2sgKClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHsgZ3JvdXAsIGNoaWxkcmVuLCBjb25maWcgfSA9IHRoaXNcblxuICAgICAgICAgIGNvbnN0IHBvc2l0aW9ucyA9IFtdIGFzIEdlb21ldHJ5LkNpcmNsZSBbXVxuXG4gICAgICAgICAgZm9yICggY29uc3QgYyBvZiBjaGlsZHJlbiApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgY29uc3QgZyA9IGMuZ3JvdXBcbiAgICAgICAgICAgICAgIGNvbnN0IHIgPSAoZy53aWR0aCA+IGcuaGVpZ2h0ID8gZy53aWR0aCA6IGcuaGVpZ2h0KSAvIDJcbiAgICAgICAgICAgICAgIHBvc2l0aW9ucy5wdXNoICggeyB4OiBnLmxlZnQsIHk6IGcudG9wLCByOiByICsgNiB9IClcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjb25zdCBzaXplID0gIEdlb21ldHJ5LnBhY2tFbmNsb3NlICggcG9zaXRpb25zICkgKiAyXG5cbiAgICAgICAgICBmb3IgKCB2YXIgaSA9IDAgOyBpIDwgY2hpbGRyZW4ubGVuZ3RoIDsgaSsrIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBjb25zdCBnID0gY2hpbGRyZW4gW2ldLmdyb3VwXG4gICAgICAgICAgICAgICBjb25zdCBwID0gcG9zaXRpb25zIFtpXVxuXG4gICAgICAgICAgICAgICBnLmxlZnQgPSBwLnhcbiAgICAgICAgICAgICAgIGcudG9wICA9IHAueVxuXG4gICAgICAgICAgICAgICBncm91cC5hZGQgKCBnIClcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB0aGlzLmRpc3BsYXlfc2l6ZSA9IHNpemUgKyBjb25maWcuc2l6ZU9mZnNldFxuXG4gICAgICAgICAgdGhpcy51cGRhdGVTaXplICgpXG4gICAgIH1cblxufVxuXG4iLCJcblxuXG5leHBvcnQgY29uc3QgeG5vZGUgPSAoKCkgPT5cbntcbiAgICAgY29uc3Qgc3ZnX25hbWVzID0gWyBcInN2Z1wiLCBcImdcIiwgXCJsaW5lXCIsIFwiY2lyY2xlXCIsIFwicGF0aFwiLCBcInRleHRcIiBdXG5cbiAgICAgZnVuY3Rpb24gY3JlYXRlIChcbiAgICAgICAgICBuYW1lOiBrZXlvZiBKU1guSW50cmluc2ljSFRNTEVsZW1lbnRzLFxuICAgICAgICAgIHByb3BzOiBhbnksXG4gICAgICAgICAgLi4uY2hpbGRyZW46IFsgSFRNTEVsZW1lbnQgfCBzdHJpbmcgfCBhbnlbXSBdXG4gICAgICk6IEhUTUxFbGVtZW50XG5cbiAgICAgZnVuY3Rpb24gY3JlYXRlIChcbiAgICAgICAgICBuYW1lOiBrZXlvZiBKU1guSW50cmluc2ljU1ZHRWxlbWVudHMsXG4gICAgICAgICAgcHJvcHM6IGFueSxcbiAgICAgICAgICAuLi5jaGlsZHJlbjogWyBIVE1MRWxlbWVudCB8IHN0cmluZyB8IGFueVtdIF1cbiAgICAgKTogU1ZHRWxlbWVudFxuXG4gICAgIGZ1bmN0aW9uIGNyZWF0ZSAoXG4gICAgICAgICAgbmFtZTogc3RyaW5nLFxuICAgICAgICAgIHByb3BzOiBhbnksXG4gICAgICAgICAgLi4uY2hpbGRyZW46IFsgSFRNTEVsZW1lbnQgfCBzdHJpbmcgfCBhbnlbXSBdXG4gICAgICk6IEhUTUxFbGVtZW50IHwgU1ZHRWxlbWVudFxuICAgICB7XG4gICAgICAgICAgcHJvcHMgPSBPYmplY3QuYXNzaWduICgge30sIHByb3BzIClcblxuICAgICAgICAgIGNvbnN0IGVsZW1lbnQgPSBzdmdfbmFtZXMuaW5kZXhPZiAoIG5hbWUgKSA9PT0gLTFcbiAgICAgICAgICAgICAgICAgICAgPyBkb2N1bWVudC5jcmVhdGVFbGVtZW50ICggbmFtZSApXG4gICAgICAgICAgICAgICAgICAgIDogZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TICggXCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiLCBuYW1lIClcblxuICAgICAgICAgIGNvbnN0IGNvbnRlbnQgPSBbXSBhcyBhbnlbXVxuXG4gICAgICAgICAgLy8gQ2hpbGRyZW5cblxuICAgICAgICAgIHdoaWxlICggY2hpbGRyZW4ubGVuZ3RoID4gMCApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgbGV0IGNoaWxkID0gY2hpbGRyZW4ucG9wKClcblxuICAgICAgICAgICAgICAgaWYgKCBBcnJheS5pc0FycmF5KCBjaGlsZCApIClcbiAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yICggdmFyIGkgPSAwIDsgaSAhPSBjaGlsZC5sZW5ndGggOyBpKysgKVxuICAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkcmVuLnB1c2goIGNoaWxkIFtpXSApXG4gICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnQucHVzaCggY2hpbGQgKVxuICAgICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHdoaWxlICggY29udGVudC5sZW5ndGggPiAwIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBsZXQgY2hpbGQgPSBjb250ZW50LnBvcCgpXG5cbiAgICAgICAgICAgICAgIGlmICggY2hpbGQgaW5zdGFuY2VvZiBOb2RlIClcbiAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5hcHBlbmRDaGlsZCggY2hpbGQgKVxuXG4gICAgICAgICAgICAgICBlbHNlIGlmICggdHlwZW9mIGNoaWxkID09IFwiYm9vbGVhblwiIHx8IGNoaWxkIClcbiAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5hcHBlbmRDaGlsZCggZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoIGNoaWxkLnRvU3RyaW5nKCkgKSApXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gQXR0cmlidXRlc1xuXG4gICAgICAgICAgY29uc3QgaXNBcnJheSA9IEFycmF5LmlzQXJyYXlcbiAgICAgICAgICBjb25zdCBjb252OiBSZWNvcmQgPHN0cmluZywgKHY6IGFueSkgPT4gc3RyaW5nPiA9XG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgY2xhc3M6ICggdiApID0+IGlzQXJyYXkgKHYpID8gdi5qb2luIChcIiBcIikgOiB2LFxuICAgICAgICAgICAgICAgc3R5bGU6ICggdiApID0+IGlzQXJyYXkgKHYpID8gdi5qb2luIChcIiBcIilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiB0eXBlb2YgdiA9PSBcIm9iamVjdFwiID8gb2JqZWN0VG9TdHlsZSAodilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiB2LFxuICAgICAgICAgICAgICAgLy8gc3ZnXG4gICAgICAgICAgICAgICBkOiAoIHYgKSA9PiBpc0FycmF5ICh2KSA/IHYuam9pbiAoXCIgXCIpIDogdixcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBmb3IgKCBjb25zdCBrZXkgaW4gcHJvcHMgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNvbnN0IHZhbHVlID0gcHJvcHNba2V5XVxuXG4gICAgICAgICAgICAgICBpZiAoIHR5cGVvZiB2YWx1ZSA9PSBcImZ1bmN0aW9uXCIgKVxuICAgICAgICAgICAgICAgICAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIgKCBrZXksIHZhbHVlIClcblxuICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBlbGVtZW50LnNldEF0dHJpYnV0ZSAoIGtleSwgKGNvbnZba2V5XSB8fCAodj0+dikpICh2YWx1ZSkgKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiBlbGVtZW50XG5cbiAgICAgICAgICBmdW5jdGlvbiBvYmplY3RUb1N0eWxlICggb2JqOiBvYmplY3QgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHZhciByZXN1bHQgPSBcIlwiXG5cbiAgICAgICAgICAgICAgIGZvciAoIGNvbnN0IGtleSBpbiBvYmogKVxuICAgICAgICAgICAgICAgICAgICByZXN1bHQgKz0ga2V5ICsgXCI6IFwiICsgb2JqIFtrZXldICsgXCI7IFwiXG5cbiAgICAgICAgICAgICAgIHJldHVybiByZXN1bHRcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBmdW5jdGlvbiBjYW1lbGl6ZSAoIHN0cjogc3RyaW5nIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICByZXR1cm4gc3RyLnJlcGxhY2UgKFxuICAgICAgICAgICAgICAgICAgICAvKD86W0EtWl18XFxiXFx3KS9nLFxuICAgICAgICAgICAgICAgICAgICAoIHdvcmQsIGluZGV4ICkgPT4gaW5kZXggPT0gMCA/IHdvcmQudG9Mb3dlckNhc2UoKSA6IHdvcmQudG9VcHBlckNhc2UoKVxuICAgICAgICAgICAgICAgKS5yZXBsYWNlKC9cXHMrL2csICcnKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBmdW5jdGlvbiB1bmNhbWVsaXplICggc3RyOiBzdHJpbmcgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHJldHVybiBzdHIudHJpbSAoKS5yZXBsYWNlIChcbiAgICAgICAgICAgICAgIC8vICAgLyg/PCEtKSg/OltBLVpdfFxcYlxcdykvZyxcbiAgICAgICAgICAgICAgICAgICAgLyg/OltBLVpdfFxcYlxcdykvZyxcbiAgICAgICAgICAgICAgICAgICAgKCB3b3JkLCBpbmRleCApID0+IGluZGV4ID09IDAgPyB3b3JkLnRvTG93ZXJDYXNlKCkgOiAnLScgKyB3b3JkLnRvTG93ZXJDYXNlKClcbiAgICAgICAgICAgICAgICkucmVwbGFjZSgvKD86XFxzK3xfKS9nLCAnJyk7XG4gICAgICAgICAgfVxuICAgICB9XG5cbiAgICAgcmV0dXJuIGNyZWF0ZVxuXG59KSAoKVxuXG5kZWNsYXJlIGdsb2JhbFxue1xuICAgICBleHBvcnQgbmFtZXNwYWNlIEpTWFxuICAgICB7XG4gICAgICAgICAgZXhwb3J0IHR5cGUgRWxlbWVudCA9IEhUTUxFbGVtZW50IHwgU1ZHRWxlbWVudFxuXG4gICAgICAgICAgZXhwb3J0IHR5cGUgSW50cmluc2ljRWxlbWVudHMgPSBJbnRyaW5zaWNIVE1MRWxlbWVudHMgJiBJbnRyaW5zaWNTVkdFbGVtZW50c1xuXG4gICAgICAgICAgZXhwb3J0IGludGVyZmFjZSBJbnRyaW5zaWNIVE1MRWxlbWVudHNcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBhICAgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgYWJiciAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGFkZHJlc3MgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBhcmVhICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgYXJ0aWNsZSAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGFzaWRlICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBhdWRpbyAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgYiAgICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGJhc2UgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBiZGkgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgYmRvICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGJpZyAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBibG9ja3F1b3RlOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgYm9keSAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGJyICAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBidXR0b24gICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgY2FudmFzICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGNhcHRpb24gICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBjaXRlICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgY29kZSAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGNvbCAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBjb2xncm91cCAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZGF0YSAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGRhdGFsaXN0ICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBkZCAgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZGVsICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGRldGFpbHMgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBkZm4gICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZGlhbG9nICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGRpdiAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBkbCAgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZHQgICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGVtICAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBlbWJlZCAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZmllbGRzZXQgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGZpZ2NhcHRpb246IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBmaWd1cmUgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZm9vdGVyICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGZvcm0gICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBoMSAgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgaDIgICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGgzICAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBoNCAgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgaDUgICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGg2ICAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBoZWFkICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgaGVhZGVyICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGhncm91cCAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBociAgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgaHRtbCAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGkgICAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBpZnJhbWUgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgaW1nICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGlucHV0ICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBpbnMgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAga2JkICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGtleWdlbiAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBsYWJlbCAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgbGVnZW5kICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGxpICAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBsaW5rICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgbWFpbiAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIG1hcCAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBtYXJrICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgbWVudSAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIG1lbnVpdGVtICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBtZXRhICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgbWV0ZXIgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIG5hdiAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBub3NjcmlwdCAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgb2JqZWN0ICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIG9sICAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBvcHRncm91cCAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgb3B0aW9uICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIG91dHB1dCAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBwICAgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgcGFyYW0gICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHBpY3R1cmUgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBwcmUgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgcHJvZ3Jlc3MgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHEgICAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBycCAgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgcnQgICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHJ1YnkgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBzICAgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgc2FtcCAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHNjcmlwdCAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBzZWN0aW9uICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgc2VsZWN0ICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHNsb3QgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBzbWFsbCAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgc291cmNlICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHNwYW4gICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBzdHJvbmcgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgc3R5bGUgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHN1YiAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBzdW1tYXJ5ICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgc3VwICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHRhYmxlICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICB0Ym9keSAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgdGQgICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHRleHRhcmVhICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICB0Zm9vdCAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgdGggICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHRoZWFkICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICB0aW1lICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgdGl0bGUgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHRyICAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICB0cmFjayAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgdSAgICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHVsICAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBcInZhclwiICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICB2aWRlbyAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgd2JyICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBleHBvcnQgaW50ZXJmYWNlIEludHJpbnNpY1NWR0VsZW1lbnRzXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgc3ZnICAgICAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgYW5pbWF0ZSAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgY2lyY2xlICAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgY2xpcFBhdGggICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZGVmcyAgICAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZGVzYyAgICAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZWxsaXBzZSAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZmVCbGVuZCAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZmVDb2xvck1hdHJpeCAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZmVDb21wb25lbnRUcmFuc2ZlcjogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZmVDb21wb3NpdGUgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZmVDb252b2x2ZU1hdHJpeCAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZmVEaWZmdXNlTGlnaHRpbmcgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZmVEaXNwbGFjZW1lbnRNYXAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZmVGbG9vZCAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZmVHYXVzc2lhbkJsdXIgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZmVJbWFnZSAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZmVNZXJnZSAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZmVNZXJnZU5vZGUgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZmVNb3JwaG9sb2d5ICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZmVPZmZzZXQgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZmVTcGVjdWxhckxpZ2h0aW5nIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZmVUaWxlICAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZmVUdXJidWxlbmNlICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZmlsdGVyICAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZm9yZWlnbk9iamVjdCAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZyAgICAgICAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgaW1hZ2UgICAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgbGluZSAgICAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgbGluZWFyR3JhZGllbnQgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgbWFya2VyICAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgbWFzayAgICAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgcGF0aCAgICAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgcGF0dGVybiAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgcG9seWdvbiAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgcG9seWxpbmUgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgcmFkaWFsR3JhZGllbnQgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgcmVjdCAgICAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgc3RvcCAgICAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgc3ltYm9sICAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgdGV4dCAgICAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgdHNwYW4gICAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgdXNlICAgICAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgIH1cbiAgICAgfVxuXG5cbiAgICAgaW50ZXJmYWNlIFBhdGhBdHRyaWJ1dGVzXG4gICAgIHtcbiAgICAgICAgICBkOiBzdHJpbmdcbiAgICAgfVxuXG4gICAgIHR5cGUgRXZlbnRIYW5kbGVyIDxFIGV4dGVuZHMgRXZlbnQ+ID0gKCBldmVudDogRSApID0+IHZvaWRcblxuICAgICB0eXBlIENsaXBib2FyZEV2ZW50SGFuZGxlciAgID0gRXZlbnRIYW5kbGVyPENsaXBib2FyZEV2ZW50PlxuICAgICB0eXBlIENvbXBvc2l0aW9uRXZlbnRIYW5kbGVyID0gRXZlbnRIYW5kbGVyPENvbXBvc2l0aW9uRXZlbnQ+XG4gICAgIHR5cGUgRHJhZ0V2ZW50SGFuZGxlciAgICAgICAgPSBFdmVudEhhbmRsZXI8RHJhZ0V2ZW50PlxuICAgICB0eXBlIEZvY3VzRXZlbnRIYW5kbGVyICAgICAgID0gRXZlbnRIYW5kbGVyPEZvY3VzRXZlbnQ+XG4gICAgIHR5cGUgS2V5Ym9hcmRFdmVudEhhbmRsZXIgICAgPSBFdmVudEhhbmRsZXI8S2V5Ym9hcmRFdmVudD5cbiAgICAgdHlwZSBNb3VzZUV2ZW50SGFuZGxlciAgICAgICA9IEV2ZW50SGFuZGxlcjxNb3VzZUV2ZW50PlxuICAgICB0eXBlIFRvdWNoRXZlbnRIYW5kbGVyICAgICAgID0gRXZlbnRIYW5kbGVyPFRvdWNoRXZlbnQ+XG4gICAgIHR5cGUgVUlFdmVudEhhbmRsZXIgICAgICAgICAgPSBFdmVudEhhbmRsZXI8VUlFdmVudD5cbiAgICAgdHlwZSBXaGVlbEV2ZW50SGFuZGxlciAgICAgICA9IEV2ZW50SGFuZGxlcjxXaGVlbEV2ZW50PlxuICAgICB0eXBlIEFuaW1hdGlvbkV2ZW50SGFuZGxlciAgID0gRXZlbnRIYW5kbGVyPEFuaW1hdGlvbkV2ZW50PlxuICAgICB0eXBlIFRyYW5zaXRpb25FdmVudEhhbmRsZXIgID0gRXZlbnRIYW5kbGVyPFRyYW5zaXRpb25FdmVudD5cbiAgICAgdHlwZSBHZW5lcmljRXZlbnRIYW5kbGVyICAgICA9IEV2ZW50SGFuZGxlcjxFdmVudD5cbiAgICAgdHlwZSBQb2ludGVyRXZlbnRIYW5kbGVyICAgICA9IEV2ZW50SGFuZGxlcjxQb2ludGVyRXZlbnQ+XG5cbiAgICAgaW50ZXJmYWNlIERPTUF0dHJpYnV0ZXNcbiAgICAge1xuICAgICAgICAgIFtldmVudDogc3RyaW5nXTogYW55XG5cbiAgICAgICAgICAvLyAjcmVnaW9uIEltYWdlIEV2ZW50c1xuICAgICAgICAgIG9uTG9hZD8gICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uTG9hZENhcHR1cmU/IDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRXJyb3I/ICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRXJyb3JDYXB0dXJlPzogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIC8vICNlbmRyZWdpb25cblxuICAgICAgICAgIC8vICNyZWdpb24gQ2xpcGJvYXJkIEV2ZW50c1xuICAgICAgICAgIG9uQ29weT8gICAgICAgIDogQ2xpcGJvYXJkRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Db3B5Q2FwdHVyZT8gOiBDbGlwYm9hcmRFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkN1dD8gICAgICAgICA6IENsaXBib2FyZEV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uQ3V0Q2FwdHVyZT8gIDogQ2xpcGJvYXJkRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25QYXN0ZT8gICAgICAgOiBDbGlwYm9hcmRFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblBhc3RlQ2FwdHVyZT86IENsaXBib2FyZEV2ZW50SGFuZGxlclxuICAgICAgICAgIC8vICNlbmRyZWdpb25cblxuICAgICAgICAgIC8vICNyZWdpb24gQ29tcG9zaXRpb24gRXZlbnRzXG4gICAgICAgICAgb25Db21wb3NpdGlvbkVuZD8gICAgICAgICAgOiBDb21wb3NpdGlvbkV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uQ29tcG9zaXRpb25FbmRDYXB0dXJlPyAgIDogQ29tcG9zaXRpb25FdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkNvbXBvc2l0aW9uU3RhcnQ/ICAgICAgICA6IENvbXBvc2l0aW9uRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Db21wb3NpdGlvblN0YXJ0Q2FwdHVyZT8gOiBDb21wb3NpdGlvbkV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uQ29tcG9zaXRpb25VcGRhdGU/ICAgICAgIDogQ29tcG9zaXRpb25FdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkNvbXBvc2l0aW9uVXBkYXRlQ2FwdHVyZT86IENvbXBvc2l0aW9uRXZlbnRIYW5kbGVyXG4gICAgICAgICAgLy8gI2VuZHJlZ2lvblxuXG4gICAgICAgICAgLy8gI3JlZ2lvbiBGb2N1cyBFdmVudHNcbiAgICAgICAgICBvbkZvY3VzPyAgICAgICA6IEZvY3VzRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Gb2N1c0NhcHR1cmU/OiBGb2N1c0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uQmx1cj8gICAgICAgIDogRm9jdXNFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkJsdXJDYXB0dXJlPyA6IEZvY3VzRXZlbnRIYW5kbGVyXG4gICAgICAgICAgLy8gI2VuZHJlZ2lvblxuXG4gICAgICAgICAgLy8gI3JlZ2lvbiBGb3JtIEV2ZW50c1xuICAgICAgICAgIG9uQ2hhbmdlPyAgICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25DaGFuZ2VDYXB0dXJlPyA6IEdlbmVyaWNFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbklucHV0PyAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uSW5wdXRDYXB0dXJlPyAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25TZWFyY2g/ICAgICAgICA6IEdlbmVyaWNFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblNlYXJjaENhcHR1cmU/IDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uU3VibWl0PyAgICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25TdWJtaXRDYXB0dXJlPyA6IEdlbmVyaWNFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkludmFsaWQ/ICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uSW52YWxpZENhcHR1cmU/OiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgLy8gI2VuZHJlZ2lvblxuXG4gICAgICAgICAgLy8gI3JlZ2lvbiBLZXlib2FyZCBFdmVudHNcbiAgICAgICAgICBvbktleURvd24/ICAgICAgICA6IEtleWJvYXJkRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25LZXlEb3duQ2FwdHVyZT8gOiBLZXlib2FyZEV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uS2V5UHJlc3M/ICAgICAgIDogS2V5Ym9hcmRFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbktleVByZXNzQ2FwdHVyZT86IEtleWJvYXJkRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25LZXlVcD8gICAgICAgICAgOiBLZXlib2FyZEV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uS2V5VXBDYXB0dXJlPyAgIDogS2V5Ym9hcmRFdmVudEhhbmRsZXJcbiAgICAgICAgICAvLyAjZW5kcmVnaW9uXG5cbiAgICAgICAgICAvLyAjcmVnaW9uIE1lZGlhIEV2ZW50c1xuICAgICAgICAgIG9uQWJvcnQ/ICAgICAgICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uQWJvcnRDYXB0dXJlPyAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uQ2FuUGxheT8gICAgICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uQ2FuUGxheUNhcHR1cmU/ICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uQ2FuUGxheVRocm91Z2g/ICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uQ2FuUGxheVRocm91Z2hDYXB0dXJlPzogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRHVyYXRpb25DaGFuZ2U/ICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRHVyYXRpb25DaGFuZ2VDYXB0dXJlPzogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRW1wdGllZD8gICAgICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRW1wdGllZENhcHR1cmU/ICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRW5jcnlwdGVkPyAgICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRW5jcnlwdGVkQ2FwdHVyZT8gICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRW5kZWQ/ICAgICAgICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRW5kZWRDYXB0dXJlPyAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uTG9hZGVkRGF0YT8gICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uTG9hZGVkRGF0YUNhcHR1cmU/ICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uTG9hZGVkTWV0YWRhdGE/ICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uTG9hZGVkTWV0YWRhdGFDYXB0dXJlPzogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uTG9hZFN0YXJ0PyAgICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uTG9hZFN0YXJ0Q2FwdHVyZT8gICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uUGF1c2U/ICAgICAgICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uUGF1c2VDYXB0dXJlPyAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uUGxheT8gICAgICAgICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uUGxheUNhcHR1cmU/ICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uUGxheWluZz8gICAgICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uUGxheWluZ0NhcHR1cmU/ICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uUHJvZ3Jlc3M/ICAgICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uUHJvZ3Jlc3NDYXB0dXJlPyAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uUmF0ZUNoYW5nZT8gICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uUmF0ZUNoYW5nZUNhcHR1cmU/ICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uU2Vla2VkPyAgICAgICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uU2Vla2VkQ2FwdHVyZT8gICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uU2Vla2luZz8gICAgICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uU2Vla2luZ0NhcHR1cmU/ICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uU3RhbGxlZD8gICAgICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uU3RhbGxlZENhcHR1cmU/ICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uU3VzcGVuZD8gICAgICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uU3VzcGVuZENhcHR1cmU/ICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uVGltZVVwZGF0ZT8gICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uVGltZVVwZGF0ZUNhcHR1cmU/ICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uVm9sdW1lQ2hhbmdlPyAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uVm9sdW1lQ2hhbmdlQ2FwdHVyZT8gIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uV2FpdGluZz8gICAgICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uV2FpdGluZ0NhcHR1cmU/ICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIC8vICNlbmRyZWdpb25cblxuICAgICAgICAgIC8vICNyZWdpb24gTW91c2VFdmVudHNcbiAgICAgICAgICBvbkNsaWNrPyAgICAgICAgICAgICA6IE1vdXNlRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25DbGlja0NhcHR1cmU/ICAgICAgOiBNb3VzZUV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uQ29udGV4dE1lbnU/ICAgICAgIDogTW91c2VFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkNvbnRleHRNZW51Q2FwdHVyZT86IE1vdXNlRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25EYmxDbGljaz8gICAgICAgICAgOiBNb3VzZUV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRGJsQ2xpY2tDYXB0dXJlPyAgIDogTW91c2VFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkRyYWc/ICAgICAgICAgICAgICA6IERyYWdFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkRyYWdDYXB0dXJlPyAgICAgICA6IERyYWdFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkRyYWdFbmQ/ICAgICAgICAgICA6IERyYWdFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkRyYWdFbmRDYXB0dXJlPyAgICA6IERyYWdFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkRyYWdFbnRlcj8gICAgICAgICA6IERyYWdFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkRyYWdFbnRlckNhcHR1cmU/ICA6IERyYWdFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkRyYWdFeGl0PyAgICAgICAgICA6IERyYWdFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkRyYWdFeGl0Q2FwdHVyZT8gICA6IERyYWdFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkRyYWdMZWF2ZT8gICAgICAgICA6IERyYWdFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkRyYWdMZWF2ZUNhcHR1cmU/ICA6IERyYWdFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkRyYWdPdmVyPyAgICAgICAgICA6IERyYWdFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkRyYWdPdmVyQ2FwdHVyZT8gICA6IERyYWdFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkRyYWdTdGFydD8gICAgICAgICA6IERyYWdFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkRyYWdTdGFydENhcHR1cmU/ICA6IERyYWdFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkRyb3A/ICAgICAgICAgICAgICA6IERyYWdFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkRyb3BDYXB0dXJlPyAgICAgICA6IERyYWdFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbk1vdXNlRG93bj8gICAgICAgICA6IE1vdXNlRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Nb3VzZURvd25DYXB0dXJlPyAgOiBNb3VzZUV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uTW91c2VFbnRlcj8gICAgICAgIDogTW91c2VFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbk1vdXNlRW50ZXJDYXB0dXJlPyA6IE1vdXNlRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Nb3VzZUxlYXZlPyAgICAgICAgOiBNb3VzZUV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uTW91c2VMZWF2ZUNhcHR1cmU/IDogTW91c2VFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbk1vdXNlTW92ZT8gICAgICAgICA6IE1vdXNlRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Nb3VzZU1vdmVDYXB0dXJlPyAgOiBNb3VzZUV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uTW91c2VPdXQ/ICAgICAgICAgIDogTW91c2VFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbk1vdXNlT3V0Q2FwdHVyZT8gICA6IE1vdXNlRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Nb3VzZU92ZXI/ICAgICAgICAgOiBNb3VzZUV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uTW91c2VPdmVyQ2FwdHVyZT8gIDogTW91c2VFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbk1vdXNlVXA/ICAgICAgICAgICA6IE1vdXNlRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Nb3VzZVVwQ2FwdHVyZT8gICAgOiBNb3VzZUV2ZW50SGFuZGxlclxuICAgICAgICAgIC8vICNlbmRyZWdpb25cblxuICAgICAgICAgIC8vICNyZWdpb24gU2VsZWN0aW9uIEV2ZW50c1xuICAgICAgICAgIG9uU2VsZWN0PzogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uU2VsZWN0Q2FwdHVyZT86IEdlbmVyaWNFdmVudEhhbmRsZXJcbiAgICAgICAgICAvLyAjZW5kcmVnaW9uXG5cbiAgICAgICAgICAvLyAjcmVnaW9uIFRvdWNoIEV2ZW50c1xuICAgICAgICAgIG9uVG91Y2hDYW5jZWw/OiBUb3VjaEV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uVG91Y2hDYW5jZWxDYXB0dXJlPzogVG91Y2hFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblRvdWNoRW5kPzogVG91Y2hFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblRvdWNoRW5kQ2FwdHVyZT86IFRvdWNoRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Ub3VjaE1vdmU/OiBUb3VjaEV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uVG91Y2hNb3ZlQ2FwdHVyZT86IFRvdWNoRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Ub3VjaFN0YXJ0PzogVG91Y2hFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblRvdWNoU3RhcnRDYXB0dXJlPzogVG91Y2hFdmVudEhhbmRsZXJcbiAgICAgICAgICAvLyAjZW5kcmVnaW9uXG5cbiAgICAgICAgICAvLyAjcmVnaW9uIFBvaW50ZXIgRXZlbnRzXG4gICAgICAgICAgb25Qb2ludGVyT3Zlcj8gICAgICAgICAgICAgIDogUG9pbnRlckV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uUG9pbnRlck92ZXJDYXB0dXJlPyAgICAgICA6IFBvaW50ZXJFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblBvaW50ZXJFbnRlcj8gICAgICAgICAgICAgOiBQb2ludGVyRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Qb2ludGVyRW50ZXJDYXB0dXJlPyAgICAgIDogUG9pbnRlckV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uUG9pbnRlckRvd24/ICAgICAgICAgICAgICA6IFBvaW50ZXJFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblBvaW50ZXJEb3duQ2FwdHVyZT8gICAgICAgOiBQb2ludGVyRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Qb2ludGVyTW92ZT8gICAgICAgICAgICAgIDogUG9pbnRlckV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uUG9pbnRlck1vdmVDYXB0dXJlPyAgICAgICA6IFBvaW50ZXJFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblBvaW50ZXJVcD8gICAgICAgICAgICAgICAgOiBQb2ludGVyRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Qb2ludGVyVXBDYXB0dXJlPyAgICAgICAgIDogUG9pbnRlckV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uUG9pbnRlckNhbmNlbD8gICAgICAgICAgICA6IFBvaW50ZXJFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblBvaW50ZXJDYW5jZWxDYXB0dXJlPyAgICAgOiBQb2ludGVyRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Qb2ludGVyT3V0PyAgICAgICAgICAgICAgIDogUG9pbnRlckV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uUG9pbnRlck91dENhcHR1cmU/ICAgICAgICA6IFBvaW50ZXJFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblBvaW50ZXJMZWF2ZT8gICAgICAgICAgICAgOiBQb2ludGVyRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Qb2ludGVyTGVhdmVDYXB0dXJlPyAgICAgIDogUG9pbnRlckV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uR290UG9pbnRlckNhcHR1cmU/ICAgICAgICA6IFBvaW50ZXJFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkdvdFBvaW50ZXJDYXB0dXJlQ2FwdHVyZT8gOiBQb2ludGVyRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Mb3N0UG9pbnRlckNhcHR1cmU/ICAgICAgIDogUG9pbnRlckV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uTG9zdFBvaW50ZXJDYXB0dXJlQ2FwdHVyZT86IFBvaW50ZXJFdmVudEhhbmRsZXJcbiAgICAgICAgICAvLyAjZW5kcmVnaW9uXG5cbiAgICAgICAgICAvLyAjcmVnaW9uIFVJIEV2ZW50c1xuICAgICAgICAgIG9uU2Nyb2xsPyAgICAgICA6IFVJRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25TY3JvbGxDYXB0dXJlPzogVUlFdmVudEhhbmRsZXJcbiAgICAgICAgICAvLyAjZW5kcmVnaW9uXG5cbiAgICAgICAgICAvLyAjcmVnaW9uIFdoZWVsIEV2ZW50c1xuICAgICAgICAgIG9uV2hlZWw/ICAgICAgIDogV2hlZWxFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbldoZWVsQ2FwdHVyZT86IFdoZWVsRXZlbnRIYW5kbGVyXG4gICAgICAgICAgLy8gI2VuZHJlZ2lvblxuXG4gICAgICAgICAgLy8gI3JlZ2lvbiBBbmltYXRpb24gRXZlbnRzXG4gICAgICAgICAgb25BbmltYXRpb25TdGFydD8gICAgICAgICAgIDogQW5pbWF0aW9uRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25BbmltYXRpb25TdGFydENhcHR1cmU/ICAgIDogQW5pbWF0aW9uRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25BbmltYXRpb25FbmQ/ICAgICAgICAgICAgIDogQW5pbWF0aW9uRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25BbmltYXRpb25FbmRDYXB0dXJlPyAgICAgIDogQW5pbWF0aW9uRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25BbmltYXRpb25JdGVyYXRpb24/ICAgICAgIDogQW5pbWF0aW9uRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25BbmltYXRpb25JdGVyYXRpb25DYXB0dXJlPzogQW5pbWF0aW9uRXZlbnRIYW5kbGVyXG4gICAgICAgICAgLy8gI2VuZHJlZ2lvblxuXG4gICAgICAgICAgLy8gI3JlZ2lvbiBUcmFuc2l0aW9uIEV2ZW50c1xuICAgICAgICAgIG9uVHJhbnNpdGlvbkVuZD8gICAgICAgOiBUcmFuc2l0aW9uRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25UcmFuc2l0aW9uRW5kQ2FwdHVyZT86IFRyYW5zaXRpb25FdmVudEhhbmRsZXJcbiAgICAgICAgICAvLyAjZW5kcmVnaW9uXG4gICAgIH1cblxuICAgICBpbnRlcmZhY2UgSFRNTEF0dHJpYnV0ZXMgZXh0ZW5kcyBET01BdHRyaWJ1dGVzXG4gICAgIHtcbiAgICAgICAgICAvLyBTdGFuZGFyZCBIVE1MIEF0dHJpYnV0ZXNcbiAgICAgICAgICBhY2NlcHQ/ICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGFjY2VwdENoYXJzZXQ/ICAgIDogc3RyaW5nXG4gICAgICAgICAgYWNjZXNzS2V5PyAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBhY3Rpb24/ICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGFsbG93RnVsbFNjcmVlbj8gIDogc3RyaW5nIHwgYm9vbGVhblxuICAgICAgICAgIGFsbG93VHJhbnNwYXJlbmN5Pzogc3RyaW5nIHwgYm9vbGVhblxuICAgICAgICAgIGFsdD8gICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgYXN5bmM/ICAgICAgICAgICAgOiBzdHJpbmcgfCBib29sZWFuXG4gICAgICAgICAgYXV0b2NvbXBsZXRlPyAgICAgOiBzdHJpbmdcbiAgICAgICAgICBhdXRvQ29tcGxldGU/ICAgICA6IHN0cmluZ1xuICAgICAgICAgIGF1dG9jb3JyZWN0PyAgICAgIDogc3RyaW5nXG4gICAgICAgICAgYXV0b0NvcnJlY3Q/ICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBhdXRvZm9jdXM/ICAgICAgICA6IHN0cmluZyB8IGJvb2xlYW5cbiAgICAgICAgICBhdXRvRm9jdXM/ICAgICAgICA6IHN0cmluZyB8IGJvb2xlYW5cbiAgICAgICAgICBhdXRvUGxheT8gICAgICAgICA6IHN0cmluZyB8IGJvb2xlYW5cbiAgICAgICAgICBjYXB0dXJlPyAgICAgICAgICA6IHN0cmluZyB8IGJvb2xlYW5cbiAgICAgICAgICBjZWxsUGFkZGluZz8gICAgICA6IHN0cmluZyB8IG51bWJlclxuICAgICAgICAgIGNlbGxTcGFjaW5nPyAgICAgIDogc3RyaW5nIHwgbnVtYmVyXG4gICAgICAgICAgY2hhclNldD8gICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBjaGFsbGVuZ2U/ICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGNoZWNrZWQ/ICAgICAgICAgIDogc3RyaW5nIHwgYm9vbGVhblxuICAgICAgICAgIGNsYXNzPyAgICAgICAgICAgIDogc3RyaW5nIHwgc3RyaW5nW11cbiAgICAgICAgICBjbGFzc05hbWU/ICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGNvbHM/ICAgICAgICAgICAgIDogc3RyaW5nIHwgbnVtYmVyXG4gICAgICAgICAgY29sU3Bhbj8gICAgICAgICAgOiBzdHJpbmcgfCBudW1iZXJcbiAgICAgICAgICBjb250ZW50PyAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGNvbnRlbnRFZGl0YWJsZT8gIDogc3RyaW5nIHwgYm9vbGVhblxuICAgICAgICAgIGNvbnRleHRNZW51PyAgICAgIDogc3RyaW5nXG4gICAgICAgICAgY29udHJvbHM/ICAgICAgICAgOiBzdHJpbmcgfCBib29sZWFuXG4gICAgICAgICAgY29udHJvbHNMaXN0PyAgICAgOiBzdHJpbmdcbiAgICAgICAgICBjb29yZHM/ICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGNyb3NzT3JpZ2luPyAgICAgIDogc3RyaW5nXG4gICAgICAgICAgZGF0YT8gICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBkYXRlVGltZT8gICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGRlZmF1bHQ/ICAgICAgICAgIDogc3RyaW5nIHwgYm9vbGVhblxuICAgICAgICAgIGRlZmVyPyAgICAgICAgICAgIDogc3RyaW5nIHwgYm9vbGVhblxuICAgICAgICAgIGRpcj8gICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgZGlzYWJsZWQ/ICAgICAgICAgOiBzdHJpbmcgfCBib29sZWFuXG4gICAgICAgICAgZG93bmxvYWQ/ICAgICAgICAgOiBhbnlcbiAgICAgICAgICBkcmFnZ2FibGU/ICAgICAgICA6IHN0cmluZyB8IGJvb2xlYW5cbiAgICAgICAgICBlbmNUeXBlPyAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGZvcm0/ICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgZm9ybUFjdGlvbj8gICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBmb3JtRW5jVHlwZT8gICAgICA6IHN0cmluZ1xuICAgICAgICAgIGZvcm1NZXRob2Q/ICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgZm9ybU5vVmFsaWRhdGU/ICAgOiBzdHJpbmcgfCBib29sZWFuXG4gICAgICAgICAgZm9ybVRhcmdldD8gICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBmcmFtZUJvcmRlcj8gICAgICA6IHN0cmluZyB8IG51bWJlclxuICAgICAgICAgIGhlYWRlcnM/ICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgaGVpZ2h0PyAgICAgICAgICAgOiBzdHJpbmcgfCBudW1iZXJcbiAgICAgICAgICBoaWRkZW4/ICAgICAgICAgICA6IHN0cmluZyB8IGJvb2xlYW5cbiAgICAgICAgICBoaWdoPyAgICAgICAgICAgICA6IHN0cmluZyB8IG51bWJlclxuICAgICAgICAgIGhyZWY/ICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgaHJlZkxhbmc/ICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBmb3I/ICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGh0bWxGb3I/ICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgaHR0cEVxdWl2PyAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBpY29uPyAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGlkPyAgICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgaW5wdXRNb2RlPyAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBpbnRlZ3JpdHk/ICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGlzPyAgICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAga2V5UGFyYW1zPyAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBrZXlUeXBlPyAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGtpbmQ/ICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgbGFiZWw/ICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBsYW5nPyAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGxpc3Q/ICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgbG9vcD8gICAgICAgICAgICAgOiBzdHJpbmcgfCBib29sZWFuXG4gICAgICAgICAgbG93PyAgICAgICAgICAgICAgOiBzdHJpbmcgfCBudW1iZXJcbiAgICAgICAgICBtYW5pZmVzdD8gICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIG1hcmdpbkhlaWdodD8gICAgIDogc3RyaW5nIHwgbnVtYmVyXG4gICAgICAgICAgbWFyZ2luV2lkdGg/ICAgICAgOiBzdHJpbmcgfCBudW1iZXJcbiAgICAgICAgICBtYXg/ICAgICAgICAgICAgICA6IHN0cmluZyB8IG51bWJlclxuICAgICAgICAgIG1heExlbmd0aD8gICAgICAgIDogc3RyaW5nIHwgbnVtYmVyXG4gICAgICAgICAgbWVkaWE/ICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBtZWRpYUdyb3VwPyAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIG1ldGhvZD8gICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgbWluPyAgICAgICAgICAgICAgOiBzdHJpbmcgfCBudW1iZXJcbiAgICAgICAgICBtaW5MZW5ndGg/ICAgICAgICA6IHN0cmluZyB8IG51bWJlclxuICAgICAgICAgIG11bHRpcGxlPyAgICAgICAgIDogc3RyaW5nIHwgYm9vbGVhblxuICAgICAgICAgIG11dGVkPyAgICAgICAgICAgIDogc3RyaW5nIHwgYm9vbGVhblxuICAgICAgICAgIG5hbWU/ICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgbm9WYWxpZGF0ZT8gICAgICAgOiBzdHJpbmcgfCBib29sZWFuXG4gICAgICAgICAgb3Blbj8gICAgICAgICAgICAgOiBzdHJpbmcgfCBib29sZWFuXG4gICAgICAgICAgb3B0aW11bT8gICAgICAgICAgOiBzdHJpbmcgfCBudW1iZXJcbiAgICAgICAgICBwYXR0ZXJuPyAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHBsYWNlaG9sZGVyPyAgICAgIDogc3RyaW5nXG4gICAgICAgICAgcGxheXNJbmxpbmU/ICAgICAgOiBzdHJpbmcgfCBib29sZWFuXG4gICAgICAgICAgcG9zdGVyPyAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBwcmVsb2FkPyAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHJhZGlvR3JvdXA/ICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgcmVhZE9ubHk/ICAgICAgICAgOiBzdHJpbmcgfCBib29sZWFuXG4gICAgICAgICAgcmVsPyAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICByZXF1aXJlZD8gICAgICAgICA6IHN0cmluZyB8IGJvb2xlYW5cbiAgICAgICAgICByb2xlPyAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHJvd3M/ICAgICAgICAgICAgIDogc3RyaW5nIHwgbnVtYmVyXG4gICAgICAgICAgcm93U3Bhbj8gICAgICAgICAgOiBzdHJpbmcgfCBudW1iZXJcbiAgICAgICAgICBzYW5kYm94PyAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHNjb3BlPyAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgc2NvcGVkPyAgICAgICAgICAgOiBzdHJpbmcgfCBib29sZWFuXG4gICAgICAgICAgc2Nyb2xsaW5nPyAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBzZWFtbGVzcz8gICAgICAgICA6IHN0cmluZyB8IGJvb2xlYW5cbiAgICAgICAgICBzZWxlY3RlZD8gICAgICAgICA6IHN0cmluZyB8IGJvb2xlYW5cbiAgICAgICAgICBzaGFwZT8gICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHNpemU/ICAgICAgICAgICAgIDogc3RyaW5nIHwgbnVtYmVyXG4gICAgICAgICAgc2l6ZXM/ICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBzbG90PyAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHNwYW4/ICAgICAgICAgICAgIDogc3RyaW5nIHwgbnVtYmVyXG4gICAgICAgICAgc3BlbGxjaGVjaz8gICAgICAgOiBzdHJpbmcgfCBib29sZWFuXG4gICAgICAgICAgc3JjPyAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBzcmNzZXQ/ICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHNyY0RvYz8gICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgc3JjTGFuZz8gICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBzcmNTZXQ/ICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHN0YXJ0PyAgICAgICAgICAgIDogc3RyaW5nIHwgbnVtYmVyXG4gICAgICAgICAgc3RlcD8gICAgICAgICAgICAgOiBzdHJpbmcgfCBudW1iZXJcbiAgICAgICAgICBzdHlsZT8gICAgICAgICAgICA6IHN0cmluZyB8IHsgWyBrZXk6IHN0cmluZyBdOiBzdHJpbmcgfCBudW1iZXIgfVxuICAgICAgICAgIHN1bW1hcnk/ICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgdGFiSW5kZXg/ICAgICAgICAgOiBzdHJpbmcgfCBudW1iZXJcbiAgICAgICAgICB0YXJnZXQ/ICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHRpdGxlPyAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgdHlwZT8gICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICB1c2VNYXA/ICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHZhbHVlPyAgICAgICAgICAgIDogc3RyaW5nIHwgc3RyaW5nW10gfCBudW1iZXJcbiAgICAgICAgICB3aWR0aD8gICAgICAgICAgICA6IHN0cmluZyB8IG51bWJlclxuICAgICAgICAgIHdtb2RlPyAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgd3JhcD8gICAgICAgICAgICAgOiBzdHJpbmdcblxuICAgICAgICAgIC8vIFJERmEgQXR0cmlidXRlc1xuICAgICAgICAgIGFib3V0Pzogc3RyaW5nXG4gICAgICAgICAgZGF0YXR5cGU/OiBzdHJpbmdcbiAgICAgICAgICBpbmxpc3Q/OiBhbnlcbiAgICAgICAgICBwcmVmaXg/OiBzdHJpbmdcbiAgICAgICAgICBwcm9wZXJ0eT86IHN0cmluZ1xuICAgICAgICAgIHJlc291cmNlPzogc3RyaW5nXG4gICAgICAgICAgdHlwZW9mPzogc3RyaW5nXG4gICAgICAgICAgdm9jYWI/OiBzdHJpbmdcblxuICAgICAgICAgIC8vIE1pY3JvZGF0YSBBdHRyaWJ1dGVzXG4gICAgICAgICAgaXRlbVByb3A/OiBzdHJpbmdcbiAgICAgICAgICBpdGVtU2NvcGU/OiBib29sZWFuXG4gICAgICAgICAgaXRlbVR5cGU/OiBzdHJpbmdcbiAgICAgICAgICBpdGVtSUQ/OiBzdHJpbmdcbiAgICAgICAgICBpdGVtUmVmPzogc3RyaW5nXG4gICAgIH1cblxuICAgICBpbnRlcmZhY2UgU1ZHQXR0cmlidXRlcyBleHRlbmRzIEhUTUxBdHRyaWJ1dGVzXG4gICAgIHtcbiAgICAgICAgICBhY2NlbnRIZWlnaHQ/ICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGFjY3VtdWxhdGU/ICAgICAgICAgICAgICAgIDogXCJub25lXCIgfCBcInN1bVwiXG4gICAgICAgICAgYWRkaXRpdmU/ICAgICAgICAgICAgICAgICAgOiBcInJlcGxhY2VcIiB8IFwic3VtXCJcbiAgICAgICAgICBhbGlnbm1lbnRCYXNlbGluZT8gICAgICAgICA6IFwiYXV0b1wiIHwgXCJiYXNlbGluZVwiIHwgXCJiZWZvcmUtZWRnZVwiIHwgXCJ0ZXh0LWJlZm9yZS1lZGdlXCIgfCBcIm1pZGRsZVwiIHwgXCJjZW50cmFsXCIgfCBcImFmdGVyLWVkZ2VcIiB8IFwidGV4dC1hZnRlci1lZGdlXCIgfCBcImlkZW9ncmFwaGljXCIgfCBcImFscGhhYmV0aWNcIiB8IFwiaGFuZ2luZ1wiIHwgXCJtYXRoZW1hdGljYWxcIiB8IFwiaW5oZXJpdFwiXG4gICAgICAgICAgYWxsb3dSZW9yZGVyPyAgICAgICAgICAgICAgOiBcIm5vXCIgfCBcInllc1wiXG4gICAgICAgICAgYWxwaGFiZXRpYz8gICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBhbXBsaXR1ZGU/ICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGFyYWJpY0Zvcm0/ICAgICAgICAgICAgICAgIDogXCJpbml0aWFsXCIgfCBcIm1lZGlhbFwiIHwgXCJ0ZXJtaW5hbFwiIHwgXCJpc29sYXRlZFwiXG4gICAgICAgICAgYXNjZW50PyAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBhdHRyaWJ1dGVOYW1lPyAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGF0dHJpYnV0ZVR5cGU/ICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgYXV0b1JldmVyc2U/ICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBhemltdXRoPyAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGJhc2VGcmVxdWVuY3k/ICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgYmFzZWxpbmVTaGlmdD8gICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBiYXNlUHJvZmlsZT8gICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGJib3g/ICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgYmVnaW4/ICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBiaWFzPyAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGJ5PyAgICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgY2FsY01vZGU/ICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBjYXBIZWlnaHQ/ICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGNsaXA/ICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgY2xpcFBhdGg/ICAgICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBjbGlwUGF0aFVuaXRzPyAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGNsaXBSdWxlPyAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgY29sb3JJbnRlcnBvbGF0aW9uPyAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBjb2xvckludGVycG9sYXRpb25GaWx0ZXJzPyA6IFwiYXV0b1wiIHwgXCJzUkdCXCIgfCBcImxpbmVhclJHQlwiIHwgXCJpbmhlcml0XCJcbiAgICAgICAgICBjb2xvclByb2ZpbGU/ICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGNvbG9yUmVuZGVyaW5nPyAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgY29udGVudFNjcmlwdFR5cGU/ICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBjb250ZW50U3R5bGVUeXBlPyAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGN1cnNvcj8gICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgY3g/ICAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBjeT8gICAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGQ/ICAgICAgICAgICAgICAgICAgICAgICAgIDogc3RyaW5nIHwgKG51bWJlciB8IHN0cmluZykgW11cbiAgICAgICAgICBkZWNlbGVyYXRlPyAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGRlc2NlbnQ/ICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZGlmZnVzZUNvbnN0YW50PyAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBkaXJlY3Rpb24/ICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGRpc3BsYXk/ICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZGl2aXNvcj8gICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBkb21pbmFudEJhc2VsaW5lPyAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGR1cj8gICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZHg/ICAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBkeT8gICAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGVkZ2VNb2RlPyAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZWxldmF0aW9uPyAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBlbmFibGVCYWNrZ3JvdW5kPyAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGVuZD8gICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZXhwb25lbnQ/ICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBleHRlcm5hbFJlc291cmNlc1JlcXVpcmVkPyA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGZpbGw/ICAgICAgICAgICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgZmlsbE9wYWNpdHk/ICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBmaWxsUnVsZT8gICAgICAgICAgICAgICAgICA6IFwibm9uemVyb1wiIHwgXCJldmVub2RkXCIgfCBcImluaGVyaXRcIlxuICAgICAgICAgIGZpbHRlcj8gICAgICAgICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgZmlsdGVyUmVzPyAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBmaWx0ZXJVbml0cz8gICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGZsb29kQ29sb3I/ICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZmxvb2RPcGFjaXR5PyAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBmb2N1c2FibGU/ICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGZvbnRGYW1pbHk/ICAgICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgZm9udFNpemU/ICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBmb250U2l6ZUFkanVzdD8gICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGZvbnRTdHJldGNoPyAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZm9udFN0eWxlPyAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBmb250VmFyaWFudD8gICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGZvbnRXZWlnaHQ/ICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZm9ybWF0PyAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBmcm9tPyAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGZ4PyAgICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZnk/ICAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBnMT8gICAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGcyPyAgICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZ2x5cGhOYW1lPyAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBnbHlwaE9yaWVudGF0aW9uSG9yaXpvbnRhbD86IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGdseXBoT3JpZW50YXRpb25WZXJ0aWNhbD8gIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZ2x5cGhSZWY/ICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBncmFkaWVudFRyYW5zZm9ybT8gICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGdyYWRpZW50VW5pdHM/ICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgaGFuZ2luZz8gICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBob3JpekFkdlg/ICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGhvcml6T3JpZ2luWD8gICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgaWRlb2dyYXBoaWM/ICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBpbWFnZVJlbmRlcmluZz8gICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGluMj8gICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgaW4/ICAgICAgICAgICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBpbnRlcmNlcHQ/ICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGsxPyAgICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgazI/ICAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBrMz8gICAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGs0PyAgICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgaz8gICAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBrZXJuZWxNYXRyaXg/ICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGtlcm5lbFVuaXRMZW5ndGg/ICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAga2VybmluZz8gICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBrZXlQb2ludHM/ICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGtleVNwbGluZXM/ICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAga2V5VGltZXM/ICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBsZW5ndGhBZGp1c3Q/ICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGxldHRlclNwYWNpbmc/ICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgbGlnaHRpbmdDb2xvcj8gICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBsaW1pdGluZ0NvbmVBbmdsZT8gICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGxvY2FsPyAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgbWFya2VyRW5kPyAgICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBtYXJrZXJIZWlnaHQ/ICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIG1hcmtlck1pZD8gICAgICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgbWFya2VyU3RhcnQ/ICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBtYXJrZXJVbml0cz8gICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIG1hcmtlcldpZHRoPyAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgbWFzaz8gICAgICAgICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBtYXNrQ29udGVudFVuaXRzPyAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIG1hc2tVbml0cz8gICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgbWF0aGVtYXRpY2FsPyAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBtb2RlPyAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIG51bU9jdGF2ZXM/ICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgb2Zmc2V0PyAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBvcGFjaXR5PyAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIG9wZXJhdG9yPyAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgb3JkZXI/ICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBvcmllbnQ/ICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIG9yaWVudGF0aW9uPyAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgb3JpZ2luPyAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBvdmVyZmxvdz8gICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIG92ZXJsaW5lUG9zaXRpb24/ICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgb3ZlcmxpbmVUaGlja25lc3M/ICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBwYWludE9yZGVyPyAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHBhbm9zZTE/ICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgcGF0aExlbmd0aD8gICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBwYXR0ZXJuQ29udGVudFVuaXRzPyAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHBhdHRlcm5UcmFuc2Zvcm0/ICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgcGF0dGVyblVuaXRzPyAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBwb2ludGVyRXZlbnRzPyAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHBvaW50cz8gICAgICAgICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgcG9pbnRzQXRYPyAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBwb2ludHNBdFk/ICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHBvaW50c0F0Wj8gICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgcHJlc2VydmVBbHBoYT8gICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBwcmVzZXJ2ZUFzcGVjdFJhdGlvPyAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHByaW1pdGl2ZVVuaXRzPyAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgcj8gICAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICByYWRpdXM/ICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHJlZlg/ICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgcmVmWT8gICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICByZW5kZXJpbmdJbnRlbnQ/ICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHJlcGVhdENvdW50PyAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgcmVwZWF0RHVyPyAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICByZXF1aXJlZEV4dGVuc2lvbnM/ICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHJlcXVpcmVkRmVhdHVyZXM/ICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgcmVzdGFydD8gICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICByZXN1bHQ/ICAgICAgICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHJvdGF0ZT8gICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgcng/ICAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICByeT8gICAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHNjYWxlPyAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgc2VlZD8gICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBzaGFwZVJlbmRlcmluZz8gICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHNsb3BlPyAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgc3BhY2luZz8gICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBzcGVjdWxhckNvbnN0YW50PyAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHNwZWN1bGFyRXhwb25lbnQ/ICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgc3BlZWQ/ICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBzcHJlYWRNZXRob2Q/ICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHN0YXJ0T2Zmc2V0PyAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgc3RkRGV2aWF0aW9uPyAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBzdGVtaD8gICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHN0ZW12PyAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgc3RpdGNoVGlsZXM/ICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBzdG9wQ29sb3I/ICAgICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHN0b3BPcGFjaXR5PyAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgc3RyaWtldGhyb3VnaFBvc2l0aW9uPyAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBzdHJpa2V0aHJvdWdoVGhpY2tuZXNzPyAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHN0cmluZz8gICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgc3Ryb2tlPyAgICAgICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBzdHJva2VEYXNoYXJyYXk/ICAgICAgICAgICA6IHN0cmluZyB8IG51bWJlclxuICAgICAgICAgIHN0cm9rZURhc2hvZmZzZXQ/ICAgICAgICAgIDogc3RyaW5nIHwgbnVtYmVyXG4gICAgICAgICAgc3Ryb2tlTGluZWNhcD8gICAgICAgICAgICAgOiBcImJ1dHRcIiB8IFwicm91bmRcIiB8IFwic3F1YXJlXCIgfCBcImluaGVyaXRcIlxuICAgICAgICAgIHN0cm9rZUxpbmVqb2luPyAgICAgICAgICAgIDogXCJtaXRlclwiIHwgXCJyb3VuZFwiIHwgXCJiZXZlbFwiIHwgXCJpbmhlcml0XCJcbiAgICAgICAgICBzdHJva2VNaXRlcmxpbWl0PyAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHN0cm9rZU9wYWNpdHk/ICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgc3Ryb2tlV2lkdGg/ICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBzdXJmYWNlU2NhbGU/ICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHN5c3RlbUxhbmd1YWdlPyAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgdGFibGVWYWx1ZXM/ICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB0YXJnZXRYPyAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHRhcmdldFk/ICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgdGV4dEFuY2hvcj8gICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICB0ZXh0RGVjb3JhdGlvbj8gICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHRleHRMZW5ndGg/ICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgdGV4dFJlbmRlcmluZz8gICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB0bz8gICAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHRyYW5zZm9ybT8gICAgICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgdTE/ICAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB1Mj8gICAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHVuZGVybGluZVBvc2l0aW9uPyAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgdW5kZXJsaW5lVGhpY2tuZXNzPyAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB1bmljb2RlPyAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHVuaWNvZGVCaWRpPyAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgdW5pY29kZVJhbmdlPyAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB1bml0c1BlckVtPyAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHZBbHBoYWJldGljPyAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgdmFsdWVzPyAgICAgICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICB2ZWN0b3JFZmZlY3Q/ICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHZlcnNpb24/ICAgICAgICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgdmVydEFkdlk/ICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB2ZXJ0T3JpZ2luWD8gICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHZlcnRPcmlnaW5ZPyAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgdkhhbmdpbmc/ICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB2SWRlb2dyYXBoaWM/ICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHZpZXdCb3g/ICAgICAgICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgdmlld1RhcmdldD8gICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB2aXNpYmlsaXR5PyAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHZNYXRoZW1hdGljYWw/ICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgd2lkdGhzPyAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB3b3JkU3BhY2luZz8gICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHdyaXRpbmdNb2RlPyAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgeDE/ICAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB4Mj8gICAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHg/ICAgICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgeENoYW5uZWxTZWxlY3Rvcj8gICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICB4SGVpZ2h0PyAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHhsaW5rQWN0dWF0ZT8gICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgeGxpbmtBcmNyb2xlPyAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICB4bGlua0hyZWY/ICAgICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHhsaW5rUm9sZT8gICAgICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgeGxpbmtTaG93PyAgICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICB4bGlua1RpdGxlPyAgICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHhsaW5rVHlwZT8gICAgICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgeG1sQmFzZT8gICAgICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICB4bWxMYW5nPyAgICAgICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHhtbG5zPyAgICAgICAgICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgeG1sbnNYbGluaz8gICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICB4bWxTcGFjZT8gICAgICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHkxPyAgICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgeTI/ICAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB5PyAgICAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHlDaGFubmVsU2VsZWN0b3I/ICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgej8gICAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB6b29tQW5kUGFuPyAgICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICB9XG59XG4iLCJcbmV4cG9ydCBpbnRlcmZhY2UgIERyYWdnYWJsZU9wdGlvbnNcbntcbiAgICAgaGFuZGxlcyAgICAgICAgOiBKU1guRWxlbWVudCBbXVxuICAgICBtaW5WZWxvY2l0eT8gICA6IG51bWJlclxuICAgICBtYXhWZWxvY2l0eT8gICA6IG51bWJlclxuICAgICB2ZWxvY2l0eUZhY3Rvcj86IG51bWJlclxuICAgICBvbkRyYWc/ICAgICAgICA6ICggZXZlbnQ6IERyYWdFdmVudCApID0+IHZvaWRcbiAgICAgb25TdGFydERyYWc/ICAgOiAoKSA9PiB2b2lkXG4gICAgIG9uU3RvcERyYWc/ICAgIDogKCBldmVudDogRHJhZ0V2ZW50ICkgPT4gYm9vbGVhblxuICAgICBvbkVuZEFuaW1hdGlvbj86ICggIGV2ZW50OiBEcmFnRXZlbnQgICkgPT4gdm9pZFxufVxuXG5leHBvcnQgdHlwZSBEcmFnZ2FibGVDb25maWcgPSBSZXF1aXJlZCA8RHJhZ2dhYmxlT3B0aW9ucz5cblxuZXhwb3J0IGludGVyZmFjZSBEcmFnRXZlbnRcbntcbiAgICAgeCAgICAgICAgOiBudW1iZXJcbiAgICAgeSAgICAgICAgOiBudW1iZXJcbiAgICAgb2Zmc2V0WCAgOiBudW1iZXJcbiAgICAgb2Zmc2V0WSAgOiBudW1iZXJcbiAgICAgdGFyZ2V0WDogbnVtYmVyXG4gICAgIHRhcmdldFk6IG51bWJlclxuICAgICBkZWxheSAgICA6IG51bWJlclxufVxuXG5mdW5jdGlvbiBkZWZhdWx0Q29uZmlnICgpOiBEcmFnZ2FibGVDb25maWdcbntcbiAgICAgcmV0dXJuIHtcbiAgICAgICAgICBoYW5kbGVzICAgICAgIDogW10sXG4gICAgICAgICAgbWluVmVsb2NpdHkgICA6IDAsXG4gICAgICAgICAgbWF4VmVsb2NpdHkgICA6IDEsXG4gICAgICAgICAgb25TdGFydERyYWcgICA6ICgpID0+IHt9LFxuICAgICAgICAgIG9uRHJhZyAgICAgICAgOiAoKSA9PiB7fSxcbiAgICAgICAgICBvblN0b3BEcmFnICAgIDogKCkgPT4gdHJ1ZSxcbiAgICAgICAgICBvbkVuZEFuaW1hdGlvbjogKCkgPT4ge30sXG4gICAgICAgICAgdmVsb2NpdHlGYWN0b3I6ICh3aW5kb3cuaW5uZXJIZWlnaHQgPCB3aW5kb3cuaW5uZXJXaWR0aFxuICAgICAgICAgICAgICAgICAgICAgICAgID8gd2luZG93LmlubmVySGVpZ2h0IDogd2luZG93LmlubmVyV2lkdGgpIC8gMixcbiAgICAgfVxufVxuXG52YXIgaXNfZHJhZyAgICA9IGZhbHNlXG52YXIgcG9pbnRlcjogTW91c2VFdmVudCB8IFRvdWNoXG5cbi8vIGh0dHBzOi8vZ2lzdC5naXRodWIuY29tL2dyZS8xNjUwMjk0XG52YXIgRWFzaW5nRnVuY3Rpb25zID0ge1xuICAgICBsaW5lYXIgICAgICAgIDogKCB0OiBudW1iZXIgKSA9PiB0LFxuICAgICBlYXNlSW5RdWFkICAgIDogKCB0OiBudW1iZXIgKSA9PiB0KnQsXG4gICAgIGVhc2VPdXRRdWFkICAgOiAoIHQ6IG51bWJlciApID0+IHQqKDItdCksXG4gICAgIGVhc2VJbk91dFF1YWQgOiAoIHQ6IG51bWJlciApID0+IHQ8LjUgPyAyKnQqdCA6IC0xKyg0LTIqdCkqdCxcbiAgICAgZWFzZUluQ3ViaWMgICA6ICggdDogbnVtYmVyICkgPT4gdCp0KnQsXG4gICAgIGVhc2VPdXRDdWJpYyAgOiAoIHQ6IG51bWJlciApID0+ICgtLXQpKnQqdCsxLFxuICAgICBlYXNlSW5PdXRDdWJpYzogKCB0OiBudW1iZXIgKSA9PiB0PC41ID8gNCp0KnQqdCA6ICh0LTEpKigyKnQtMikqKDIqdC0yKSsxLFxuICAgICBlYXNlSW5RdWFydCAgIDogKCB0OiBudW1iZXIgKSA9PiB0KnQqdCp0LFxuICAgICBlYXNlT3V0UXVhcnQgIDogKCB0OiBudW1iZXIgKSA9PiAxLSgtLXQpKnQqdCp0LFxuICAgICBlYXNlSW5PdXRRdWFydDogKCB0OiBudW1iZXIgKSA9PiB0PC41ID8gOCp0KnQqdCp0IDogMS04KigtLXQpKnQqdCp0LFxuICAgICBlYXNlSW5RdWludCAgIDogKCB0OiBudW1iZXIgKSA9PiB0KnQqdCp0KnQsXG4gICAgIGVhc2VPdXRRdWludCAgOiAoIHQ6IG51bWJlciApID0+IDErKC0tdCkqdCp0KnQqdCxcbiAgICAgZWFzZUluT3V0UXVpbnQ6ICggdDogbnVtYmVyICkgPT4gdDwuNSA/IDE2KnQqdCp0KnQqdCA6IDErMTYqKC0tdCkqdCp0KnQqdFxufVxuXG5leHBvcnQgZnVuY3Rpb24gZHJhZ2dhYmxlICggb3B0aW9uczogRHJhZ2dhYmxlT3B0aW9ucyApXG57XG4gICAgIGNvbnN0IGNvbmZpZyAgICAgPSBkZWZhdWx0Q29uZmlnICgpXG5cbiAgICAgdmFyIGlzX2FjdGl2ZSAgPSBmYWxzZVxuICAgICB2YXIgaXNfYW5pbWF0ZSA9IGZhbHNlXG4gICAgIHZhciBjdXJyZW50X2V2ZW50OiBEcmFnRXZlbnRcblxuICAgICB2YXIgc3RhcnRfdGltZSA9IDBcbiAgICAgdmFyIHN0YXJ0X3ggICAgPSAwXG4gICAgIHZhciBzdGFydF95ICAgID0gMFxuXG4gICAgIHZhciB2ZWxvY2l0eV9kZWxheSA9IDUwMFxuICAgICB2YXIgdmVsb2NpdHlfeDogbnVtYmVyXG4gICAgIHZhciB2ZWxvY2l0eV95OiBudW1iZXJcblxuICAgICB2YXIgY3VycmVudF9hbmltYXRpb24gPSAtMVxuXG4gICAgIHVwZGF0ZUNvbmZpZyAoIG9wdGlvbnMgKVxuXG4gICAgIGZ1bmN0aW9uIHVwZGF0ZUNvbmZpZyAoIG9wdGlvbnM6IERyYWdnYWJsZU9wdGlvbnMgKVxuICAgICB7XG4gICAgICAgICAgaWYgKCBpc19kcmFnIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoIG5hdmlnYXRvci5tYXhUb3VjaFBvaW50cyA+IDAgKVxuICAgICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5zdHlsZS50b3VjaEFjdGlvbiA9IFwibm9uZVwiXG5cbiAgICAgICAgICBkaXNhYmxlRXZlbnRzICgpXG5cbiAgICAgICAgICBPYmplY3QuYXNzaWduICggY29uZmlnLCBvcHRpb25zIClcblxuICAgICAgICAgIGVuYWJsZUV2ZW50cyAoKVxuICAgICB9XG5cbiAgICAgZnVuY3Rpb24gYWRkSGFuZGxlcyAoIC4uLiBoYW5kbGVzOiBKU1guRWxlbWVudCBbXSApXG4gICAgIHtcbiAgICAgICAgICBmb3IgKCBjb25zdCBoIG9mIGhhbmRsZXMgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGlmICggISBjb25maWcuaGFuZGxlcy5pbmNsdWRlcyAoaCkgKVxuICAgICAgICAgICAgICAgICAgICBjb25maWcuaGFuZGxlcy5wdXNoIChoKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICggaXNfYWN0aXZlIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBkZXNhY3RpdmF0ZSAoKVxuICAgICAgICAgICAgICAgYWN0aXZhdGUgKClcbiAgICAgICAgICB9XG4gICAgIH1cblxuICAgICBmdW5jdGlvbiBhY3RpdmF0ZSAoKVxuICAgICB7XG4gICAgICAgICAgZW5hYmxlRXZlbnRzICgpXG4gICAgICAgICAgaXNfYWN0aXZlID0gdHJ1ZVxuICAgICB9XG5cbiAgICAgZnVuY3Rpb24gZGVzYWN0aXZhdGUgKClcbiAgICAge1xuICAgICAgICAgIGRpc2FibGVFdmVudHMgKClcbiAgICAgICAgICBpc19hY3RpdmUgPSBmYWxzZVxuICAgICB9XG5cbiAgICAgcmV0dXJuIHtcbiAgICAgICAgICB1cGRhdGVDb25maWcsXG4gICAgICAgICAgYWRkSGFuZGxlcyxcbiAgICAgICAgICBpc0FjdGl2ZTogKCkgPT4gaXNfYWN0aXZlLFxuICAgICAgICAgIGFjdGl2YXRlLFxuICAgICAgICAgIGRlc2FjdGl2YXRlLFxuICAgICB9XG5cbiAgICAgZnVuY3Rpb24gZW5hYmxlRXZlbnRzICgpXG4gICAgIHtcbiAgICAgICAgICBmb3IgKCBjb25zdCBoIG9mIGNvbmZpZy5oYW5kbGVzIClcbiAgICAgICAgICAgICAgIGguYWRkRXZlbnRMaXN0ZW5lciAoIFwicG9pbnRlcmRvd25cIiwgb25TdGFydCwgeyBwYXNzaXZlOiB0cnVlIH0gKVxuICAgICB9XG4gICAgIGZ1bmN0aW9uIGRpc2FibGVFdmVudHMgKClcbiAgICAge1xuICAgICAgICAgIGZvciAoIGNvbnN0IGggb2YgY29uZmlnLmhhbmRsZXMgKVxuICAgICAgICAgICAgICAgaC5yZW1vdmVFdmVudExpc3RlbmVyICggXCJwb2ludGVyZG93blwiICwgb25TdGFydCApXG4gICAgIH1cblxuICAgICBmdW5jdGlvbiBvblN0YXJ0ICggZXZlbnQ6IE1vdXNlRXZlbnQgfCBUb3VjaEV2ZW50IClcbiAgICAge1xuICAgICAgICAgIGlmICggaXNfZHJhZyApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgY29uc29sZS53YXJuICggXCJUZW50YXRpdmUgZGUgZMOpbWFycmFnZSBkZXMgw6l2w6luZW1lbnRzIFwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICArIFwiXFxcImRyYWdnYWJsZSBcXFwiIGTDqWrDoCBlbiBjb3Vycy5cIiApXG4gICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoIGlzX2FuaW1hdGUgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHN0b3BWZWxvY2l0eUZyYW1lICgpXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcG9pbnRlciA9IChldmVudCBhcyBUb3VjaEV2ZW50KS50b3VjaGVzXG4gICAgICAgICAgICAgICAgICAgID8gKGV2ZW50IGFzIFRvdWNoRXZlbnQpLnRvdWNoZXMgWzBdXG4gICAgICAgICAgICAgICAgICAgIDogKGV2ZW50IGFzIE1vdXNlRXZlbnQpXG5cbiAgICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lciAoXCJwb2ludGVybW92ZVwiLCBvbk1vdmUpXG4gICAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIgKFwicG9pbnRlcnVwXCIgICwgb25FbmQpXG4gICAgICAgICAgZGlzYWJsZUV2ZW50cyAoKVxuXG4gICAgICAgICAgY3VycmVudF9hbmltYXRpb24gPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lICggb25BbmltYXRpb25TdGFydCApXG5cbiAgICAgICAgICBpc19kcmFnID0gdHJ1ZVxuICAgICB9XG4gICAgIGZ1bmN0aW9uIG9uTW92ZSAoIGV2ZW50OiBNb3VzZUV2ZW50IHwgVG91Y2hFdmVudCApXG4gICAgIHtcbiAgICAgICAgICBpZiAoIGlzX2RyYWcgPT0gZmFsc2UgKVxuICAgICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgICBwb2ludGVyID0gKGV2ZW50IGFzIFRvdWNoRXZlbnQpLnRvdWNoZXMgIT09IHVuZGVmaW5lZFxuICAgICAgICAgICAgICAgICAgICA/IChldmVudCBhcyBUb3VjaEV2ZW50KS50b3VjaGVzIFswXVxuICAgICAgICAgICAgICAgICAgICA6IChldmVudCBhcyBNb3VzZUV2ZW50KVxuICAgICB9XG4gICAgIGZ1bmN0aW9uIG9uRW5kICggZXZlbnQ6IE1vdXNlRXZlbnQgfCBUb3VjaEV2ZW50IClcbiAgICAge1xuICAgICAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyIChcInBvaW50ZXJtb3ZlXCIsIG9uTW92ZSlcbiAgICAgICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lciAoXCJwb2ludGVydXBcIiAgLCBvbkVuZClcbiAgICAgICAgICBlbmFibGVFdmVudHMgKClcblxuICAgICAgICAgIGlzX2RyYWcgPSBmYWxzZVxuICAgICB9XG5cbiAgICAgZnVuY3Rpb24gb25BbmltYXRpb25TdGFydCAoIG5vdzogbnVtYmVyIClcbiAgICAge1xuICAgICAgICAgIHN0YXJ0X3ggICAgPSBwb2ludGVyLmNsaWVudFhcbiAgICAgICAgICBzdGFydF95ICAgID0gcG9pbnRlci5jbGllbnRZXG4gICAgICAgICAgc3RhcnRfdGltZSA9IG5vd1xuXG4gICAgICAgICAgY3VycmVudF9ldmVudCA9IHtcbiAgICAgICAgICAgICAgIGRlbGF5ICAgIDogMCxcbiAgICAgICAgICAgICAgIHggICAgICAgIDogMCxcbiAgICAgICAgICAgICAgIHkgICAgICAgIDogMCxcbiAgICAgICAgICAgICAgIG9mZnNldFggIDogMCxcbiAgICAgICAgICAgICAgIG9mZnNldFkgIDogMCxcbiAgICAgICAgICAgICAgIHRhcmdldFg6IDAsXG4gICAgICAgICAgICAgICB0YXJnZXRZOiAwLFxuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbmZpZy5vblN0YXJ0RHJhZyAoKVxuXG4gICAgICAgICAgY3VycmVudF9hbmltYXRpb24gPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lICggb25BbmltYXRpb25GcmFtZSApXG4gICAgIH1cbiAgICAgZnVuY3Rpb24gb25BbmltYXRpb25GcmFtZSAoIG5vdzogbnVtYmVyIClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHsgdmVsb2NpdHlGYWN0b3IgfSA9IGNvbmZpZ1xuXG4gICAgICAgICAgY29uc3QgeCAgICAgICAgICAgPSBwb2ludGVyLmNsaWVudFggLSBzdGFydF94XG4gICAgICAgICAgY29uc3QgeSAgICAgICAgICAgPSBzdGFydF95IC0gcG9pbnRlci5jbGllbnRZXG4gICAgICAgICAgY29uc3QgZGVsYXkgICAgICAgPSBub3cgLSBzdGFydF90aW1lXG4gICAgICAgICAgY29uc3Qgb2Zmc2V0RGVsYXkgPSBkZWxheSAtIGN1cnJlbnRfZXZlbnQuZGVsYXlcbiAgICAgICAgICBjb25zdCBvZmZzZXRYICAgICA9IHggLSBjdXJyZW50X2V2ZW50LnhcbiAgICAgICAgICBjb25zdCBvZmZzZXRZICAgICA9IHkgLSBjdXJyZW50X2V2ZW50LnlcblxuICAgICAgICAgIGN1cnJlbnRfZXZlbnQgPSB7XG4gICAgICAgICAgICAgICBkZWxheSxcbiAgICAgICAgICAgICAgIHgsXG4gICAgICAgICAgICAgICB5LFxuICAgICAgICAgICAgICAgdGFyZ2V0WDogeCxcbiAgICAgICAgICAgICAgIHRhcmdldFk6IHksXG4gICAgICAgICAgICAgICBvZmZzZXRYLFxuICAgICAgICAgICAgICAgb2Zmc2V0WSxcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoIGlzX2RyYWcgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNvbmZpZy5vbkRyYWcgKCBjdXJyZW50X2V2ZW50IClcbiAgICAgICAgICAgICAgIGN1cnJlbnRfYW5pbWF0aW9uID0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSAoIG9uQW5pbWF0aW9uRnJhbWUgKVxuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgc3RhcnRfdGltZSAgICAgPSBub3dcbiAgICAgICAgICAgICAgIHN0YXJ0X3ggICAgICAgID0geFxuICAgICAgICAgICAgICAgc3RhcnRfeSAgICAgICAgPSB5XG4gICAgICAgICAgICAgICB2ZWxvY2l0eV94ICAgICAgID0gdmVsb2NpdHlGYWN0b3IgKiBub3JtICggb2Zmc2V0WCAvIG9mZnNldERlbGF5IClcbiAgICAgICAgICAgICAgIHZlbG9jaXR5X3kgICAgICAgPSB2ZWxvY2l0eUZhY3RvciAqIG5vcm0gKCBvZmZzZXRZIC8gb2Zmc2V0RGVsYXkgKVxuXG4gICAgICAgICAgICAgICBjdXJyZW50X2V2ZW50LnRhcmdldFggKz0gdmVsb2NpdHlfeFxuICAgICAgICAgICAgICAgY3VycmVudF9ldmVudC50YXJnZXRZICs9IHZlbG9jaXR5X3lcblxuICAgICAgICAgICAgICAgaWYgKCBjb25maWcub25TdG9wRHJhZyAoIGN1cnJlbnRfZXZlbnQgKSA9PT0gdHJ1ZSApXG4gICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGlzX2FuaW1hdGUgPSB0cnVlXG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnRfYW5pbWF0aW9uID0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSAoIG9uVmVsb2NpdHlGcmFtZSApXG4gICAgICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgZnVuY3Rpb24gbm9ybSAoIHZhbHVlOiBudW1iZXIgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGlmICh2YWx1ZSA8IC0xIClcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIC0xXG5cbiAgICAgICAgICAgICAgIGlmICggdmFsdWUgPiAxIClcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDFcblxuICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlXG4gICAgICAgICAgfVxuICAgICB9XG4gICAgIGZ1bmN0aW9uIG9uVmVsb2NpdHlGcmFtZSAoIG5vdzogbnVtYmVyIClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IGRlbGF5ID0gbm93IC0gc3RhcnRfdGltZVxuXG4gICAgICAgICAgY29uc3QgdCA9IGRlbGF5ID49IHZlbG9jaXR5X2RlbGF5XG4gICAgICAgICAgICAgICAgICA/IDFcbiAgICAgICAgICAgICAgICAgIDogZGVsYXkgLyB2ZWxvY2l0eV9kZWxheVxuXG4gICAgICAgICAgY29uc3QgZmFjdG9yICA9IEVhc2luZ0Z1bmN0aW9ucy5lYXNlT3V0UXVhcnQgKHQpXG4gICAgICAgICAgY29uc3Qgb2Zmc2V0WCA9IHZlbG9jaXR5X3ggKiBmYWN0b3JcbiAgICAgICAgICBjb25zdCBvZmZzZXRZID0gdmVsb2NpdHlfeSAqIGZhY3RvclxuXG4gICAgICAgICAgY3VycmVudF9ldmVudC54ICAgICAgID0gc3RhcnRfeCArIG9mZnNldFhcbiAgICAgICAgICBjdXJyZW50X2V2ZW50LnkgICAgICAgPSBzdGFydF95ICsgb2Zmc2V0WVxuICAgICAgICAgIGN1cnJlbnRfZXZlbnQub2Zmc2V0WCA9IHZlbG9jaXR5X3ggLSBvZmZzZXRYXG4gICAgICAgICAgY3VycmVudF9ldmVudC5vZmZzZXRZID0gdmVsb2NpdHlfeSAtIG9mZnNldFlcblxuICAgICAgICAgIGNvbmZpZy5vbkRyYWcgKCBjdXJyZW50X2V2ZW50IClcblxuICAgICAgICAgIGlmICggdCA9PSAxIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBpc19hbmltYXRlID0gZmFsc2VcbiAgICAgICAgICAgICAgIGNvbmZpZy5vbkVuZEFuaW1hdGlvbiAoIGN1cnJlbnRfZXZlbnQgKVxuICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY3VycmVudF9hbmltYXRpb24gPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lICggb25WZWxvY2l0eUZyYW1lIClcbiAgICAgfVxuICAgICBmdW5jdGlvbiBzdG9wVmVsb2NpdHlGcmFtZSAoKVxuICAgICB7XG4gICAgICAgICAgaXNfYW5pbWF0ZSA9IGZhbHNlXG4gICAgICAgICAgd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lICggY3VycmVudF9hbmltYXRpb24gKVxuICAgICAgICAgIGNvbmZpZy5vbkVuZEFuaW1hdGlvbiAoIGN1cnJlbnRfZXZlbnQgKVxuICAgICB9XG59XG4iLCJcbmV4cG9ydCB0eXBlIEV4dGVuZGVkQ1NTU3R5bGVEZWNsYXJhdGlvbiA9IENTU1N0eWxlRGVjbGFyYXRpb24gJlxue1xuICAgIGRpc3BsYXkgICAgICA6IFwiaW5saW5lXCIgfCBcImJsb2NrXCIgfCBcImNvbnRlbnRzXCIgfCBcImZsZXhcIiB8IFwiZ3JpZFwiIHwgXCJpbmxpbmUtYmxvY2tcIiB8IFwiaW5saW5lLWZsZXhcIiB8IFwiaW5saW5lLWdyaWRcIiB8IFwiaW5saW5lLXRhYmxlXCIgfCBcImxpc3QtaXRlbVwiIHwgXCJydW4taW5cIiB8IFwidGFibGVcIiB8IFwidGFibGUtY2FwdGlvblwiIHwgXCJ0YWJsZS1jb2x1bW4tZ3JvdXBcIiB8IFwidGFibGUtaGVhZGVyLWdyb3VwXCIgfCBcInRhYmxlLWZvb3Rlci1ncm91cFwiIHwgXCJ0YWJsZS1yb3ctZ3JvdXBcIiB8IFwidGFibGUtY2VsbFwiIHwgXCJ0YWJsZS1jb2x1bW5cIiB8IFwidGFibGUtcm93XCIgfCBcIm5vbmVcIiB8IFwiaW5pdGlhbFwiIHwgXCJpbmhlcml0XCJcbiAgICBmbGV4RGlyZWN0aW9uOiBcInJvd1wiIHwgXCJyb3ctcmV2ZXJzZVwiIHwgXCJjb2x1bW5cIiB8IFwiY29sdW1uLXJldmVyc2VcIiB8IFwiaW5pdGlhbFwiIHwgXCJpbmhlcml0XCJcbiAgICBvdmVyZmxvdyAgICAgOiBcInZpc2libGVcIiB8IFwiaGlkZGVuXCIgfCBcInNjcm9sbFwiIHwgXCJhdXRvXCIgfCBcImluaXRpYWxcIiB8IFwiaW5oZXJpdFwiXG4gICAgb3ZlcmZsb3dYICAgIDogXCJ2aXNpYmxlXCIgfCBcImhpZGRlblwiIHwgXCJzY3JvbGxcIiB8IFwiYXV0b1wiIHwgXCJpbml0aWFsXCIgfCBcImluaGVyaXRcIlxuICAgIG92ZXJmbG93WSAgICA6IFwidmlzaWJsZVwiIHwgXCJoaWRkZW5cIiB8IFwic2Nyb2xsXCIgfCBcImF1dG9cIiB8IFwiaW5pdGlhbFwiIHwgXCJpbmhlcml0XCJcbiAgICBwb3NpdGlvbiAgICAgOiBcInN0YXRpY1wiIHwgXCJhYnNvbHV0ZVwiIHwgXCJmaXhlZFwiIHwgXCJyZWxhdGl2ZVwiIHwgXCJzdGlja3lcIiB8IFwiaW5pdGlhbFwiIHwgXCJpbmhlcml0XCJcbn1cblxuLypkZWNsYXJlIGdsb2JhbHtcblxuICAgICBpbnRlcmZhY2UgV2luZG93XG4gICAgIHtcbiAgICAgICAgICBvbjogV2luZG93IFtcImFkZEV2ZW50TGlzdGVuZXJcIl1cbiAgICAgICAgICBvZmY6IFdpbmRvdyBbXCJyZW1vdmVFdmVudExpc3RlbmVyXCJdXG4gICAgIH1cblxuICAgICBpbnRlcmZhY2UgRWxlbWVudFxuICAgICB7XG4gICAgICAgICAgY3NzICggcHJvcGVydGllczogUGFydGlhbCA8RXh0ZW5kZWRDU1NTdHlsZURlY2xhcmF0aW9uPiApOiB0aGlzXG5cbiAgICAgICAgICBjc3NJbnQgICAoIHByb3BlcnR5OiBzdHJpbmcgKTogbnVtYmVyXG4gICAgICAgICAgY3NzRmxvYXQgKCBwcm9wZXJ0eTogc3RyaW5nICk6IG51bWJlclxuXG4gICAgICAgICAgb24gOiBIVE1MRWxlbWVudCBbXCJhZGRFdmVudExpc3RlbmVyXCJdXG4gICAgICAgICAgb2ZmOiBIVE1MRWxlbWVudCBbXCJyZW1vdmVFdmVudExpc3RlbmVyXCJdXG4gICAgICAgICAgJCAgOiBIVE1MRWxlbWVudCBbXCJxdWVyeVNlbGVjdG9yXCJdXG4gICAgICAgICAgJCQgOiBIVE1MRWxlbWVudCBbXCJxdWVyeVNlbGVjdG9yQWxsXCJdXG4gICAgIH1cbn1cblxuV2luZG93LnByb3RvdHlwZS5vbiAgPSBXaW5kb3cucHJvdG90eXBlLmFkZEV2ZW50TGlzdGVuZXJcbldpbmRvdy5wcm90b3R5cGUub2ZmID0gV2luZG93LnByb3RvdHlwZS5yZW1vdmVFdmVudExpc3RlbmVyXG5cbkVsZW1lbnQucHJvdG90eXBlLmNzcyA9IGZ1bmN0aW9uICggcHJvcHMgKVxue1xuT2JqZWN0LmFzc2lnbiAoIHRoaXMuc3R5bGUsIHByb3BzIClcbnJldHVybiB0aGlzXG59XG5cbkVsZW1lbnQucHJvdG90eXBlLmNzc0ludCA9IGZ1bmN0aW9uICggcHJvcGVydHk6IHN0cmluZyApXG57XG4gICAgIHZhciB2YWx1ZSA9IHBhcnNlSW50ICggdGhpcy5zdHlsZSBbIHByb3BlcnR5IF0gKVxuXG4gICAgIGlmICggTnVtYmVyLmlzTmFOICggdmFsdWUgKSApXG4gICAgIHtcbiAgICAgICAgICB2YWx1ZSA9IHBhcnNlSW50ICggd2luZG93LmdldENvbXB1dGVkU3R5bGUgKCB0aGlzICkgWyBwcm9wZXJ0eSBdIClcblxuICAgICAgICAgIGlmICggTnVtYmVyLmlzTmFOICggdmFsdWUgKSApXG4gICAgICAgICAgICAgICB2YWx1ZSA9IDBcbiAgICAgfVxuXG4gICAgIHJldHVybiB2YWx1ZVxufVxuXG5FbGVtZW50LnByb3RvdHlwZS5jc3NGbG9hdCA9IGZ1bmN0aW9uICggcHJvcGVydHk6IHN0cmluZyApXG57XG4gICAgIHZhciB2YWx1ZSA9IHBhcnNlRmxvYXQgKCB0aGlzLnN0eWxlIFsgcHJvcGVydHkgXSApXG5cbiAgICAgaWYgKCBOdW1iZXIuaXNOYU4gKCB2YWx1ZSApIClcbiAgICAge1xuICAgICAgICAgIHZhbHVlID0gcGFyc2VGbG9hdCAoIHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlICggdGhpcyApIFsgcHJvcGVydHkgXSApXG5cbiAgICAgICAgICBpZiAoIE51bWJlci5pc05hTiAoIHZhbHVlICkgKVxuICAgICAgICAgICAgICAgdmFsdWUgPSAwXG4gICAgIH1cblxuICAgICByZXR1cm4gdmFsdWVcbn1cblxuRWxlbWVudC5wcm90b3R5cGUub24gID0gRWxlbWVudC5wcm90b3R5cGUuYWRkRXZlbnRMaXN0ZW5lclxuXG5FbGVtZW50LnByb3RvdHlwZS5vZmYgPSBFbGVtZW50LnByb3RvdHlwZS5yZW1vdmVFdmVudExpc3RlbmVyXG5cbkVsZW1lbnQucHJvdG90eXBlLiQgICA9IEVsZW1lbnQucHJvdG90eXBlLnF1ZXJ5U2VsZWN0b3JcblxuRWxlbWVudC5wcm90b3R5cGUuJCQgID0gRWxlbWVudC5wcm90b3R5cGUucXVlcnlTZWxlY3RvckFsbFxuXG5cbkVsZW1lbnQucHJvdG90eXBlLmNzc0ludCA9IGZ1bmN0aW9uICggcHJvcGVydHk6IHN0cmluZyApXG57XG4gICAgIHZhciB2YWx1ZSA9IHBhcnNlSW50ICggdGhpcy5zdHlsZSBbIHByb3BlcnR5IF0gKVxuXG4gICAgIGlmICggTnVtYmVyLmlzTmFOICggdmFsdWUgKSApXG4gICAgIHtcbiAgICAgICAgICBjb25zdCBzdHlsZSA9IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlICggdGhpcyApXG5cbiAgICAgICAgICB2YWx1ZSA9IHBhcnNlSW50ICggc3R5bGUgWyBwcm9wZXJ0eSBdIClcblxuICAgICAgICAgIGlmICggTnVtYmVyLmlzTmFOICggdmFsdWUgKSApXG4gICAgICAgICAgICAgICB2YWx1ZSA9IDBcbiAgICAgfVxuXG4gICAgIHJldHVybiB2YWx1ZVxufSovXG5cbmV4cG9ydCBmdW5jdGlvbiBjc3MgKCBlbDogSFRNTEVsZW1lbnQgfCBTVkdFbGVtZW50LCBwcm9wczogUGFydGlhbCA8RXh0ZW5kZWRDU1NTdHlsZURlY2xhcmF0aW9uPiApXG57XG4gICAgIE9iamVjdC5hc3NpZ24gKCBlbC5zdHlsZSwgcHJvcHMgKVxufVxuXG5leHBvcnQgZnVuY3Rpb24gY3NzRmxvYXQgKCBlbDogSFRNTEVsZW1lbnQgfCBTVkdFbGVtZW50LCBwcm9wZXJ0eTogc3RyaW5nIClcbntcbiAgICAgdmFyIHZhbHVlID0gcGFyc2VGbG9hdCAoIGVsLnN0eWxlIFsgcHJvcGVydHkgXSApXG5cbiAgICAgaWYgKCBOdW1iZXIuaXNOYU4gKCB2YWx1ZSApIClcbiAgICAge1xuICAgICAgICAgIHZhbHVlID0gcGFyc2VGbG9hdCAoIHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlICggZWwgKSBbIHByb3BlcnR5IF0gKVxuXG4gICAgICAgICAgaWYgKCBOdW1iZXIuaXNOYU4gKCB2YWx1ZSApIClcbiAgICAgICAgICAgICAgIHZhbHVlID0gMFxuICAgICB9XG5cbiAgICAgcmV0dXJuIHZhbHVlXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjc3NJbnQgKCBlbDogSFRNTEVsZW1lbnQgfCBTVkdFbGVtZW50LCBwcm9wZXJ0eTogc3RyaW5nIClcbntcbiAgICAgdmFyIHZhbHVlID0gcGFyc2VJbnQgKCBlbC5zdHlsZSBbIHByb3BlcnR5IF0gKVxuXG4gICAgIGlmICggTnVtYmVyLmlzTmFOICggdmFsdWUgKSApXG4gICAgIHtcbiAgICAgICAgICBjb25zdCBzdHlsZSA9IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlICggZWwgKVxuXG4gICAgICAgICAgdmFsdWUgPSBwYXJzZUludCAoIHN0eWxlIFsgcHJvcGVydHkgXSApXG5cbiAgICAgICAgICBpZiAoIE51bWJlci5pc05hTiAoIHZhbHVlICkgKVxuICAgICAgICAgICAgICAgdmFsdWUgPSAwXG4gICAgIH1cblxuICAgICByZXR1cm4gdmFsdWVcbn1cblxuIiwiXG5pbXBvcnQgKiBhcyBVaSBmcm9tIFwiLi9kcmFnZ2FibGUuanNcIlxuaW1wb3J0IHsgY3NzSW50IH0gZnJvbSBcIi4vZG9tLmpzXCJcblxudHlwZSBEaXJlY3Rpb24gPSBcImxyXCIgfCBcInJsXCIgfCBcImJ0XCIgfCBcInRiXCJcblxuLy9leHBvcnQgdHlwZSBFeHBlbmRhYmxlUHJvcGVydHkgPSBcIndpZHRoXCIgfCBcImhlaWdodFwiXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8IFwidG9wXCIgfCBcImxlZnRcIiB8IFwiYm90dG9tXCIgfCBcInJpZ2h0XCJcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHwgXCJ4XCIgfCBcInlcIlxuXG5leHBvcnQgdHlwZSBFeHBlbmRhYmxlRWxlbWVudCA9IFJldHVyblR5cGUgPHR5cGVvZiBleHBhbmRhYmxlPlxuXG50eXBlIEV4cGVuZGFibGVPcHRpb25zID0gUGFydGlhbCA8RXhwZW5kYWJsZUNvbmZpZz5cblxuaW50ZXJmYWNlIEV4cGVuZGFibGVDb25maWdcbntcbiAgICAgaGFuZGxlcyAgICAgIDogSlNYLkVsZW1lbnQgW11cbiAgICAgcHJvcGVydHk/ICAgIDogc3RyaW5nLFxuICAgICBvcGVuICAgICAgICAgOiBib29sZWFuXG4gICAgIG5lYXIgICAgICAgICA6IG51bWJlclxuICAgICBkZWxheSAgICAgICAgOiBudW1iZXJcbiAgICAgZGlyZWN0aW9uICAgIDogRGlyZWN0aW9uXG4gICAgIG1pblNpemUgICAgICA6IG51bWJlclxuICAgICBtYXhTaXplICAgICAgOiBudW1iZXJcbiAgICAgdW5pdCAgICAgICAgIDogXCJweFwiIHwgXCIlXCIgfCBcIlwiLFxuICAgICBvbkJlZm9yZU9wZW4gOiAoKSA9PiB2b2lkXG4gICAgIG9uQWZ0ZXJPcGVuICA6ICgpID0+IHZvaWRcbiAgICAgb25CZWZvcmVDbG9zZTogKCkgPT4gdm9pZFxuICAgICBvbkFmdGVyQ2xvc2UgOiAoKSA9PiB2b2lkXG59XG5cbmNvbnN0IHZlcnRpY2FsUHJvcGVydGllcyA9IFsgXCJoZWlnaHRcIiwgXCJ0b3BcIiwgXCJib3R0b21cIiBdXG5cbmZ1bmN0aW9uIGRlZmF1bHRDb25maWcgKCk6IEV4cGVuZGFibGVDb25maWdcbntcbiAgICAgcmV0dXJuIHtcbiAgICAgICAgICBoYW5kbGVzICAgICAgOiBbXSxcbiAgICAgICAgICBwcm9wZXJ0eSAgICAgOiBcImhlaWdodFwiLFxuICAgICAgICAgIG9wZW4gICAgICAgICA6IGZhbHNlLFxuICAgICAgICAgIG5lYXIgICAgICAgICA6IDQwLFxuICAgICAgICAgIGRlbGF5ICAgICAgICA6IDI1MCxcbiAgICAgICAgICBtaW5TaXplICAgICAgOiAwLFxuICAgICAgICAgIG1heFNpemUgICAgICA6IHdpbmRvdy5pbm5lckhlaWdodCxcbiAgICAgICAgICB1bml0ICAgICAgICAgOiBcInB4XCIsXG4gICAgICAgICAgZGlyZWN0aW9uICAgIDogXCJ0YlwiLFxuICAgICAgICAgIG9uQmVmb3JlT3BlbiA6ICgpID0+IHt9LFxuICAgICAgICAgIG9uQWZ0ZXJPcGVuICA6ICgpID0+IHt9LFxuICAgICAgICAgIG9uQmVmb3JlQ2xvc2U6ICgpID0+IHt9LFxuICAgICAgICAgIG9uQWZ0ZXJDbG9zZSA6ICgpID0+IHt9LFxuICAgICB9XG59XG5cbmNvbnN0IHRvU2lnbiA9IHtcbiAgICAgbHIgOiAxLFxuICAgICBybCA6IC0xLFxuICAgICB0YiA6IC0xLFxuICAgICBidCA6IDEsXG59XG5jb25zdCB0b1Byb3BlcnR5IDogUmVjb3JkIDxEaXJlY3Rpb24sIHN0cmluZz4gPSB7XG4gICAgIGxyIDogXCJ3aWR0aFwiLFxuICAgICBybCA6IFwid2lkdGhcIixcbiAgICAgdGIgOiBcImhlaWdodFwiLFxuICAgICBidCA6IFwiaGVpZ2h0XCIsXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBleHBhbmRhYmxlICggZWxlbWVudDogSlNYLkVsZW1lbnQsIG9wdGlvbnM6IEV4cGVuZGFibGVPcHRpb25zID0ge30gKVxue1xuICAgICBjb25zdCBjb25maWcgPSBkZWZhdWx0Q29uZmlnICgpXG5cbiAgICAgdmFyIGlzX29wZW4gICAgOiBib29sZWFuXG4gICAgIHZhciBpc192ZXJ0aWNhbDogYm9vbGVhblxuICAgICB2YXIgc2lnbiAgICAgICA6IG51bWJlclxuICAgICB2YXIgdW5pdCAgICAgICA6IEV4cGVuZGFibGVDb25maWcgW1widW5pdFwiXVxuICAgICB2YXIgY2IgICAgICAgICA6ICgpID0+IHZvaWRcbiAgICAgdmFyIG1pblNpemUgICAgOiBudW1iZXJcbiAgICAgdmFyIG1heFNpemUgICAgOiBudW1iZXJcbiAgICAgdmFyIHN0YXJ0X3NpemUgID0gMFxuICAgICB2YXIgb3Blbl9zaXplICAgPSAxMDBcblxuICAgICBjb25zdCBkcmFnZ2FibGUgPSBVaS5kcmFnZ2FibGUgKHtcbiAgICAgICAgICBoYW5kbGVzICAgICAgIDogW10sXG4gICAgICAgICAgb25TdGFydERyYWcgICA6IG9uU3RhcnREcmFnLFxuICAgICAgICAgIG9uU3RvcERyYWcgICAgOiBvblN0b3BEcmFnLFxuICAgICAgICAgIG9uRW5kQW5pbWF0aW9uOiBvbkVuZEFuaW1hdGlvbixcbiAgICAgfSlcblxuICAgICB1cGRhdGVDb25maWcgKCBvcHRpb25zIClcblxuICAgICBmdW5jdGlvbiB1cGRhdGVDb25maWcgKCBvcHRpb25zID0ge30gYXMgRXhwZW5kYWJsZU9wdGlvbnMgKVxuICAgICB7XG4gICAgICAgICAgaWYgKCBvcHRpb25zLnByb3BlcnR5ID09IHVuZGVmaW5lZCAmJiBvcHRpb25zLmRpcmVjdGlvbiAhPSB1bmRlZmluZWQgKVxuICAgICAgICAgICAgICAgb3B0aW9ucy5wcm9wZXJ0eSA9IHRvUHJvcGVydHkgW29wdGlvbnMuZGlyZWN0aW9uXVxuXG4gICAgICAgICAgT2JqZWN0LmFzc2lnbiAoIGNvbmZpZywgb3B0aW9ucyApXG5cbiAgICAgICAgICBpc19vcGVuICAgICA9IGNvbmZpZy5vcGVuXG4gICAgICAgICAgc2lnbiAgICAgICAgPSB0b1NpZ24gW2NvbmZpZy5kaXJlY3Rpb25dXG4gICAgICAgICAgdW5pdCAgICAgICAgPSBjb25maWcudW5pdFxuICAgICAgICAgIGlzX3ZlcnRpY2FsID0gY29uZmlnLmRpcmVjdGlvbiA9PSBcImJ0XCIgfHwgY29uZmlnLmRpcmVjdGlvbiA9PSBcInRiXCIgPyB0cnVlIDogZmFsc2VcbiAgICAgICAgICBtaW5TaXplID0gY29uZmlnLm1pblNpemVcbiAgICAgICAgICBtYXhTaXplID0gY29uZmlnLm1heFNpemVcblxuICAgICAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZSAoIGlzX3ZlcnRpY2FsID8gXCJob3Jpem9udGFsXCIgOiBcInZlcnRpY2FsXCIgKVxuICAgICAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LmFkZCAgICAoIGlzX3ZlcnRpY2FsID8gXCJ2ZXJ0aWNhbFwiIDogXCJob3Jpem9udGFsXCIgKVxuXG4gICAgICAgICAgZHJhZ2dhYmxlLnVwZGF0ZUNvbmZpZyAoe1xuICAgICAgICAgICAgICAgaGFuZGxlczogY29uZmlnLmhhbmRsZXMsXG4gICAgICAgICAgICAgICBvbkRyYWcgOiBpc192ZXJ0aWNhbCA/IG9uRHJhZ1ZlcnRpY2FsOiBvbkRyYWdIb3Jpem9udGFsLFxuICAgICAgICAgIH0pXG4gICAgIH1cbiAgICAgZnVuY3Rpb24gc2l6ZSAoKVxuICAgICB7XG4gICAgICAgICAgcmV0dXJuIGlzX29wZW4gPyBjc3NJbnQgKCBlbGVtZW50LCBjb25maWcucHJvcGVydHkgKSA6IDBcbiAgICAgfVxuICAgICBmdW5jdGlvbiB0b2dnbGUgKClcbiAgICAge1xuICAgICAgICAgIGlmICggaXNfb3BlbiApXG4gICAgICAgICAgICAgICBjbG9zZSAoKVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgIG9wZW4gKClcbiAgICAgfVxuICAgICBmdW5jdGlvbiBvcGVuICgpXG4gICAgIHtcbiAgICAgICAgICBjb25maWcub25CZWZvcmVPcGVuICgpXG5cbiAgICAgICAgICBlbGVtZW50LmNsYXNzTGlzdC5hZGQgKCBcImFuaW1hdGVcIiApXG4gICAgICAgICAgZWxlbWVudC5jbGFzc0xpc3QucmVwbGFjZSAoIFwiY2xvc2VcIiwgXCJvcGVuXCIgKVxuXG4gICAgICAgICAgaWYgKCBjYiApXG4gICAgICAgICAgICAgICBvblRyYW5zaXRpb25FbmQgKClcblxuICAgICAgICAgIGNiID0gY29uZmlnLm9uQWZ0ZXJPcGVuXG4gICAgICAgICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyICggXCJ0cmFuc2l0aW9uZW5kXCIsICgpID0+IG9uVHJhbnNpdGlvbkVuZCApXG5cbiAgICAgICAgICBlbGVtZW50LnN0eWxlIFsgY29uZmlnLnByb3BlcnR5IF0gPSBvcGVuX3NpemUgKyB1bml0XG5cbiAgICAgICAgICBpc19vcGVuID0gdHJ1ZVxuICAgICB9XG4gICAgIGZ1bmN0aW9uIGNsb3NlICgpXG4gICAgIHtcbiAgICAgICAgICBjb25maWcub25CZWZvcmVDbG9zZSAoKVxuXG4gICAgICAgICAgb3Blbl9zaXplID0gc2l6ZSAoKVxuXG4gICAgICAgICAgZWxlbWVudC5jbGFzc0xpc3QuYWRkICggXCJhbmltYXRlXCIgKVxuICAgICAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LnJlcGxhY2UgKCBcIm9wZW5cIiwgXCJjbG9zZVwiIClcblxuICAgICAgICAgIGlmICggY2IgKVxuICAgICAgICAgICAgICAgb25UcmFuc2l0aW9uRW5kICgpXG5cbiAgICAgICAgICBjYiA9IGNvbmZpZy5vbkFmdGVyQ2xvc2VcbiAgICAgICAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIgKCBcInRyYW5zaXRpb25lbmRcIiwgb25UcmFuc2l0aW9uRW5kIClcblxuICAgICAgICAgIGVsZW1lbnQuc3R5bGUgWyBjb25maWcucHJvcGVydHkgXSA9IFwiMFwiICsgdW5pdFxuXG4gICAgICAgICAgaXNfb3BlbiA9IGZhbHNlXG4gICAgIH1cblxuICAgICByZXR1cm4ge1xuICAgICAgICAgIHVwZGF0ZUNvbmZpZyxcbiAgICAgICAgICBvcGVuLFxuICAgICAgICAgIGNsb3NlLFxuICAgICAgICAgIHRvZ2dsZSxcbiAgICAgICAgICBpc09wZW4gICAgIDogKCkgPT4gaXNfb3BlbixcbiAgICAgICAgICBpc0Nsb3NlICAgIDogKCkgPT4gISBpc19vcGVuLFxuICAgICAgICAgIGlzVmVydGljYWwgOiAoKSA9PiBpc192ZXJ0aWNhbCxcbiAgICAgICAgICBpc0FjdGl2ZSAgIDogKCkgPT4gZHJhZ2dhYmxlLmlzQWN0aXZlICgpLFxuICAgICAgICAgIGFjdGl2YXRlICAgOiAoKSA9PiBkcmFnZ2FibGUuYWN0aXZhdGUgKCksXG4gICAgICAgICAgZGVzYWN0aXZhdGU6ICgpID0+IGRyYWdnYWJsZS5kZXNhY3RpdmF0ZSAoKSxcbiAgICAgfVxuXG4gICAgIGZ1bmN0aW9uIG9uVHJhbnNpdGlvbkVuZCAoKVxuICAgICB7XG4gICAgICAgICAgaWYgKCBjYiApXG4gICAgICAgICAgICAgICBjYiAoKVxuICAgICAgICAgIGVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lciAoIFwidHJhbnNpdGlvbmVuZFwiLCAoKSA9PiBvblRyYW5zaXRpb25FbmQgKVxuICAgICAgICAgIGNiID0gbnVsbFxuICAgICB9XG5cbiAgICAgZnVuY3Rpb24gb25TdGFydERyYWcgKClcbiAgICAge1xuICAgICAgICAgIHN0YXJ0X3NpemUgPSBzaXplICgpXG4gICAgICAgICAgZWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlICggXCJhbmltYXRlXCIgKVxuICAgICB9XG4gICAgIGZ1bmN0aW9uIG9uRHJhZ1ZlcnRpY2FsICggZXZlbnQ6IFVpLkRyYWdFdmVudCApXG4gICAgIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyAoIG1pblNpemUsIGV2ZW50LnksIG1heFNpemUgKVxuICAgICAgICAgIGNvbnNvbGUubG9nICggY2xhbXAgKCBzdGFydF9zaXplICsgc2lnbiAqIGV2ZW50LnkgKSArIHVuaXQgKVxuICAgICAgICAgIGVsZW1lbnQuc3R5bGUgWyBjb25maWcucHJvcGVydHkgXSA9IGNsYW1wICggc3RhcnRfc2l6ZSArIHNpZ24gKiBldmVudC55ICkgKyB1bml0XG4gICAgIH1cbiAgICAgZnVuY3Rpb24gb25EcmFnSG9yaXpvbnRhbCAoIGV2ZW50OiBVaS5EcmFnRXZlbnQgKVxuICAgICB7XG4gICAgICAgICAgZWxlbWVudC5zdHlsZSBbIGNvbmZpZy5wcm9wZXJ0eSBdID0gY2xhbXAgKCBzdGFydF9zaXplICsgc2lnbiAqIGV2ZW50LnggKSArIHVuaXRcbiAgICAgfVxuICAgICBmdW5jdGlvbiBvblN0b3BEcmFnICggZXZlbnQ6IFVpLkRyYWdFdmVudCApXG4gICAgIHtcbiAgICAgICAgICB2YXIgaXNfbW92ZWQgPSBpc192ZXJ0aWNhbCA/IHNpZ24gKiBldmVudC55ID4gY29uZmlnLm5lYXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IHNpZ24gKiBldmVudC54ID4gY29uZmlnLm5lYXJcblxuICAgICAgICAgIGlmICggKGlzX21vdmVkID09IGZhbHNlKSAmJiBldmVudC5kZWxheSA8PSBjb25maWcuZGVsYXkgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHRvZ2dsZSAoKVxuICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29uc3QgdGFyZ2V0X3NpemUgPSBjbGFtcCAoXG4gICAgICAgICAgICAgICBpc192ZXJ0aWNhbCA/IHN0YXJ0X3NpemUgKyBzaWduICogZXZlbnQudGFyZ2V0WVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBzdGFydF9zaXplICsgc2lnbiAqIGV2ZW50LnRhcmdldFhcbiAgICAgICAgICApXG5cbiAgICAgICAgICBpZiAoIHRhcmdldF9zaXplIDw9IGNvbmZpZy5uZWFyIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBjbG9zZSAoKVxuICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIHRydWVcblxuICAgICB9XG4gICAgIGZ1bmN0aW9uIG9uRW5kQW5pbWF0aW9uICgpXG4gICAgIHtcbiAgICAgICAgICBvcGVuX3NpemUgPSBjc3NJbnQgKCBlbGVtZW50LCBjb25maWcucHJvcGVydHkgKVxuICAgICAgICAgIG9wZW4gKClcbiAgICAgfVxuXG4gICAgIGZ1bmN0aW9uIGNsYW1wICggdjogbnVtYmVyIClcbiAgICAge1xuICAgICAgICAgIGlmICggdiA8IG1pblNpemUgKVxuICAgICAgICAgICAgICAgcmV0dXJuIG1pblNpemVcblxuICAgICAgICAgIGlmICggdiA+IG1heFNpemUgKVxuICAgICAgICAgICAgICAgcmV0dXJuIG1heFNpemVcblxuICAgICAgICAgIHJldHVybiB2XG4gICAgIH1cbn1cbiIsIlxuaW1wb3J0IHsgQ3NzIH0gZnJvbSBcIi4uLy4uL0xpYi9pbmRleC5qc1wiXG5pbXBvcnQgeyBjc3NGbG9hdCB9IGZyb20gXCIuL2RvbS5qc1wiXG5pbXBvcnQgKiBhcyBVaSBmcm9tIFwiLi9kcmFnZ2FibGUuanNcIlxuaW1wb3J0IHsgeG5vZGUgfSBmcm9tIFwiLi94bm9kZS5qc1wiXG5cbnR5cGUgRGlyZWN0aW9uICAgPSBcImxyXCIgfCBcInJsXCIgfCBcImJ0XCIgfCBcInRiXCJcbnR5cGUgT3JpZW50YXRpb24gPSBcInZlcnRpY2FsXCIgfCBcImhvcml6b250YWxcIlxudHlwZSBVbml0cyAgICAgICA9IFwicHhcIiB8IFwiJVwiXG50eXBlIFN3aXBlYWJsZVByb3BlcnR5ID0gXCJ0b3BcIiB8IFwibGVmdFwiIHwgXCJib3R0b21cIiB8IFwicmlnaHRcIlxuICAgICAgICAgICAgICAgICAgICAgICAgIHwgXCJ4XCIgfCBcInlcIlxuXG50eXBlIFN3aXBlYWJsZU9wdGlvbnMgPSBQYXJ0aWFsIDxTd2lwZWFibGVDb25maWc+XG5cbnR5cGUgU3dpcGVhYmxlQ29uZmlnID0ge1xuICAgICBoYW5kbGVzICAgOiBKU1guRWxlbWVudCBbXVxuICAgICBkaXJlY3Rpb24gOiBEaXJlY3Rpb24sXG4gICAgIHBvcnBlcnR5PyA6IFN3aXBlYWJsZVByb3BlcnR5XG4gICAgIG1pblZhbHVlICA6IG51bWJlcixcbiAgICAgbWF4VmFsdWUgIDogbnVtYmVyLFxuICAgICB1bml0cyAgICAgOiBVbml0cyxcbiAgICAgbW91c2VXaGVlbDogYm9vbGVhblxufVxuXG5leHBvcnQgdHlwZSBTd2lwZWFibGVFbGVtZW50ID0gUmV0dXJuVHlwZSA8dHlwZW9mIHN3aXBlYWJsZT5cblxuZnVuY3Rpb24gZGVmYXVsdENvbmZpZyAoKTogU3dpcGVhYmxlQ29uZmlnXG57XG4gICAgIHJldHVybiB7XG4gICAgICAgICAgaGFuZGxlcyAgIDogW10sXG4gICAgICAgICAgZGlyZWN0aW9uIDogXCJsclwiLFxuICAgICAgICAgIHBvcnBlcnR5ICA6IFwibGVmdFwiLFxuICAgICAgICAgIG1pblZhbHVlICA6IC0xMDAsXG4gICAgICAgICAgbWF4VmFsdWUgIDogMCxcbiAgICAgICAgICB1bml0cyAgICAgOiBcIiVcIixcbiAgICAgICAgICBtb3VzZVdoZWVsOiB0cnVlLFxuICAgICB9XG59XG5cbnZhciBzdGFydF9wb3NpdGlvbiA9IDBcbnZhciBpc192ZXJ0aWNhbCAgICA9IGZhbHNlXG52YXIgcHJvcCA6IFN3aXBlYWJsZVByb3BlcnR5XG5cbmV4cG9ydCBmdW5jdGlvbiBzd2lwZWFibGUgKCBlbGVtZW50OiBKU1guRWxlbWVudCwgb3B0aW9uczogU3dpcGVhYmxlT3B0aW9ucyApXG57XG4gICAgIGNvbnN0IGNvbmZpZyA9IGRlZmF1bHRDb25maWcgKClcblxuICAgICBjb25zdCBkcmFnZ2FibGUgPSBVaS5kcmFnZ2FibGUgKHtcbiAgICAgICAgICBoYW5kbGVzOiBbXSxcbiAgICAgICAgICBvblN0YXJ0RHJhZyxcbiAgICAgICAgICBvblN0b3BEcmFnLFxuICAgICB9KVxuXG4gICAgIGVsZW1lbnQuY2xhc3NMaXN0LmFkZCAoIFwic3dpcGVhYmxlXCIgKVxuXG4gICAgIHVwZGF0ZUNvbmZpZyAoIG9wdGlvbnMgKVxuXG4gICAgIGZ1bmN0aW9uIHVwZGF0ZUNvbmZpZyAoIG9wdGlvbnM6IFN3aXBlYWJsZU9wdGlvbnMgKVxuICAgICB7XG4gICAgICAgICAgT2JqZWN0LmFzc2lnbiAoIGNvbmZpZywgb3B0aW9ucyApXG5cbiAgICAgICAgICBpc192ZXJ0aWNhbCA9IGNvbmZpZy5kaXJlY3Rpb24gPT0gXCJidFwiIHx8IGNvbmZpZy5kaXJlY3Rpb24gPT0gXCJ0YlwiXG5cbiAgICAgICAgICBpZiAoIG9wdGlvbnMucG9ycGVydHkgPT0gdW5kZWZpbmVkIClcbiAgICAgICAgICAgICAgIGNvbmZpZy5wb3JwZXJ0eSA9IGlzX3ZlcnRpY2FsID8gXCJ0b3BcIiA6IFwibGVmdFwiXG5cbiAgICAgICAgICAvLyBzd2l0Y2ggKCBjb25maWcucG9ycGVydHkgKVxuICAgICAgICAgIC8vIHtcbiAgICAgICAgICAvLyBjYXNlIFwidG9wXCI6IGNhc2UgXCJib3R0b21cIjogY2FzZSBcInlcIjogaXNfdmVydGljYWwgPSB0cnVlICA7IGJyZWFrXG4gICAgICAgICAgLy8gY2FzZSBcImxlZnRcIjogY2FzZSBcInJpZ2h0XCI6IGNhc2UgXCJ4XCI6IGlzX3ZlcnRpY2FsID0gZmFsc2UgOyBicmVha1xuICAgICAgICAgIC8vIGRlZmF1bHQ6IGRlYnVnZ2VyIDsgcmV0dXJuXG4gICAgICAgICAgLy8gfVxuXG4gICAgICAgICAgZHJhZ2dhYmxlLnVwZGF0ZUNvbmZpZyAoe1xuICAgICAgICAgICAgICAgaGFuZGxlczogY29uZmlnLmhhbmRsZXMsXG4gICAgICAgICAgICAgICBvbkRyYWc6IGlzX3ZlcnRpY2FsID8gb25EcmFnVmVydGljYWwgOiBvbkRyYWdIb3Jpem9udGFsXG4gICAgICAgICAgfSlcblxuICAgICAgICAgIHByb3AgPSBjb25maWcucG9ycGVydHlcblxuICAgICAgICAgIGlmICggZHJhZ2dhYmxlLmlzQWN0aXZlICgpIClcbiAgICAgICAgICAgICAgIGFjdGl2ZUV2ZW50cyAoKVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgIGRlc2FjdGl2ZUV2ZW50cyAoKVxuICAgICB9XG5cbiAgICAgZnVuY3Rpb24gcG9zaXRpb24gKClcbiAgICAge1xuICAgICAgICAgIHJldHVybiBjc3NGbG9hdCAoIGVsZW1lbnQsIHByb3AgKVxuICAgICB9XG5cbiAgICAgZnVuY3Rpb24gYWN0aXZhdGUgKClcbiAgICAge1xuICAgICAgICAgIGRyYWdnYWJsZS5hY3RpdmF0ZSAoKVxuICAgICAgICAgIGFjdGl2ZUV2ZW50cyAoKVxuICAgICB9XG4gICAgIGZ1bmN0aW9uIGRlc2FjdGl2YXRlICgpXG4gICAgIHtcbiAgICAgICAgICBkcmFnZ2FibGUuZGVzYWN0aXZhdGUgKClcbiAgICAgICAgICBkZXNhY3RpdmVFdmVudHMgKClcbiAgICAgfVxuXG4gICAgIGZ1bmN0aW9uIHN3aXBlICggb2Zmc2V0OiBzdHJpbmcgKTogdm9pZFxuICAgICBmdW5jdGlvbiBzd2lwZSAoIG9mZnNldDogbnVtYmVyLCB1bml0czogVW5pdHMgKTogdm9pZFxuICAgICBmdW5jdGlvbiBzd2lwZSAoIG9mZnNldDogc3RyaW5nfG51bWJlciwgdT86IFVuaXRzIClcbiAgICAge1xuICAgICAgICAgIGlmICggdHlwZW9mIG9mZnNldCA9PSBcInN0cmluZ1wiIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICB1ID0gQ3NzLmdldFVuaXQgKCBvZmZzZXQgKSBhcyBVbml0c1xuICAgICAgICAgICAgICAgb2Zmc2V0ID0gcGFyc2VGbG9hdCAoIG9mZnNldCApXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKCAhIFtcInB4XCIsIFwiJVwiXS5pbmNsdWRlcyAoIHUgKSApXG4gICAgICAgICAgICAgICB1ID0gXCJweFwiXG5cbiAgICAgICAgICBpZiAoIHUgIT0gY29uZmlnLnVuaXRzIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBpZiAoICh1ID0gY29uZmlnLnVuaXRzKSA9PSBcIiVcIiApXG4gICAgICAgICAgICAgICAgICAgIG9mZnNldCA9IHRvUGVyY2VudHMgKCBvZmZzZXQgKVxuICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBvZmZzZXQgPSB0b1BpeGVscyAoIG9mZnNldCApXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgZWxlbWVudC5zdHlsZSBbcHJvcF0gPSBjbGFtcCAoIG9mZnNldCApICsgdVxuICAgICB9XG5cbiAgICAgcmV0dXJuIHtcbiAgICAgICAgICB1cGRhdGVDb25maWcsXG4gICAgICAgICAgYWN0aXZhdGUsXG4gICAgICAgICAgZGVzYWN0aXZhdGUsXG4gICAgICAgICAgcG9zaXRpb24sXG4gICAgICAgICAgc3dpcGUsXG4gICAgIH1cblxuICAgICBmdW5jdGlvbiBhY3RpdmVFdmVudHMgKClcbiAgICAge1xuICAgICAgICAgIGlmICggY29uZmlnLm1vdXNlV2hlZWwgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGZvciAoIGNvbnN0IGggb2YgY29uZmlnLmhhbmRsZXMgKVxuICAgICAgICAgICAgICAgICAgICBoLmFkZEV2ZW50TGlzdGVuZXIgKCBcIndoZWVsXCIsIG9uV2hlZWwsIHsgcGFzc2l2ZTogdHJ1ZSB9IClcbiAgICAgICAgICB9XG4gICAgIH1cbiAgICAgZnVuY3Rpb24gZGVzYWN0aXZlRXZlbnRzICgpXG4gICAgIHtcbiAgICAgICAgICBmb3IgKCBjb25zdCBoIG9mIGNvbmZpZy5oYW5kbGVzIClcbiAgICAgICAgICAgICAgIGgucmVtb3ZlRXZlbnRMaXN0ZW5lciAoIFwid2hlZWxcIiwgb25XaGVlbCApXG4gICAgIH1cblxuICAgICBmdW5jdGlvbiB0b1BpeGVscyAoIHBlcmNlbnRhZ2U6IG51bWJlciApXG4gICAgIHtcbiAgICAgICAgICBjb25zdCB7IG1pblZhbHVlOiBtaW4sIG1heFZhbHVlOiBtYXggfSA9IGNvbmZpZ1xuXG4gICAgICAgICAgaWYgKCBwZXJjZW50YWdlIDwgMTAwIClcbiAgICAgICAgICAgICAgIHBlcmNlbnRhZ2UgPSAxMDAgKyBwZXJjZW50YWdlXG5cbiAgICAgICAgICByZXR1cm4gbWluICsgKG1heCAtIG1pbikgKiBwZXJjZW50YWdlIC8gMTAwXG4gICAgIH1cbiAgICAgZnVuY3Rpb24gdG9QZXJjZW50cyAoIHBpeGVsczogbnVtYmVyIClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHsgbWluVmFsdWU6IG1pbiwgbWF4VmFsdWU6IG1heCB9ID0gY29uZmlnXG4gICAgICAgICAgcmV0dXJuIE1hdGguYWJzICggKHBpeGVscyAtIG1pbikgLyAobWF4IC0gbWluKSAqIDEwMCApXG4gICAgIH1cblxuICAgICBmdW5jdGlvbiBvblN0YXJ0RHJhZyAoKVxuICAgICB7XG4gICAgICAgICAgZWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlICggXCJhbmltYXRlXCIgKVxuICAgICAgICAgIHN0YXJ0X3Bvc2l0aW9uID0gcG9zaXRpb24gKClcbiAgICAgfVxuICAgICBmdW5jdGlvbiBvbkRyYWdWZXJ0aWNhbCAoIGV2ZW50OiBVaS5EcmFnRXZlbnQgKVxuICAgICB7XG4gICAgICAgICAgZWxlbWVudC5zdHlsZSBbcHJvcF0gPSBjbGFtcCAoIHN0YXJ0X3Bvc2l0aW9uICsgZXZlbnQueSApICsgY29uZmlnLnVuaXRzXG4gICAgIH1cbiAgICAgZnVuY3Rpb24gb25EcmFnSG9yaXpvbnRhbCAoIGV2ZW50OiBVaS5EcmFnRXZlbnQgKVxuICAgICB7XG4gICAgICAgICAgZWxlbWVudC5zdHlsZSBbcHJvcF0gPSBjbGFtcCAoIHN0YXJ0X3Bvc2l0aW9uICsgZXZlbnQueCApICsgY29uZmlnLnVuaXRzXG4gICAgIH1cbiAgICAgZnVuY3Rpb24gb25TdG9wRHJhZyAoIGV2ZW50OiBVaS5EcmFnRXZlbnQgKVxuICAgICB7XG4gICAgICAgICAgZWxlbWVudC5jbGFzc0xpc3QuYWRkICggXCJhbmltYXRlXCIgKVxuXG4gICAgICAgICAgY29uc3Qgb2Zmc2V0ID0gaXNfdmVydGljYWxcbiAgICAgICAgICAgICAgICAgICAgICAgICA/IGV2ZW50LnkgLy8rIGV2ZW50LnZlbG9jaXR5WVxuICAgICAgICAgICAgICAgICAgICAgICAgIDogZXZlbnQueCAvLysgZXZlbnQudmVsb2NpdHlYXG5cbiAgICAgICAgICBlbGVtZW50LnN0eWxlIFtwcm9wXSA9IGNsYW1wICggc3RhcnRfcG9zaXRpb24gKyBvZmZzZXQgKSArIGNvbmZpZy51bml0c1xuICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgIH1cbiAgICAgZnVuY3Rpb24gb25XaGVlbCAoIGV2ZW50OiBXaGVlbEV2ZW50IClcbiAgICAge1xuICAgICAgICAgIGlmICggZXZlbnQuZGVsdGFNb2RlICE9IFdoZWVsRXZlbnQuRE9NX0RFTFRBX1BJWEVMIClcbiAgICAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgICAgaWYgKCBpc192ZXJ0aWNhbCApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgdmFyIGRlbHRhID0gZXZlbnQuZGVsdGFZXG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICB2YXIgZGVsdGEgPSBldmVudC5kZWx0YVhcblxuICAgICAgICAgICAgICAgaWYgKCBkZWx0YSA9PSAwIClcbiAgICAgICAgICAgICAgICAgICAgZGVsdGEgPSBldmVudC5kZWx0YVlcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBlbGVtZW50LnN0eWxlIFtwcm9wXSA9IGNsYW1wICggcG9zaXRpb24gKCkgKyBkZWx0YSApICsgY29uZmlnLnVuaXRzXG4gICAgIH1cbiAgICAgZnVuY3Rpb24gY2xhbXAgKCB2YWx1ZTogbnVtYmVyIClcbiAgICAge1xuICAgICAgICAgIHJldHVybiB2YWx1ZSA8IGNvbmZpZy5taW5WYWx1ZSA/IGNvbmZpZy5taW5WYWx1ZVxuICAgICAgICAgICAgICAgOiB2YWx1ZSA+IGNvbmZpZy5tYXhWYWx1ZSA/IGNvbmZpZy5tYXhWYWx1ZVxuICAgICAgICAgICAgICAgOiB2YWx1ZVxuICAgICB9XG59XG4iLCJcbi8qXG5leGFtcGxlOlxuaHR0cHM6Ly9wcmV6aS5jb20vcC85anFlMndrZmhoa3kvbGEtYnVsbG90ZXJpZS10cGNtbi9cbmh0dHBzOi8vbW92aWxhYi5vcmcvaW5kZXgucGhwP3RpdGxlPVV0aWxpc2F0ZXVyOkF1ciVDMyVBOWxpZW5NYXJ0eVxuKi9cblxuXG5pbXBvcnQgeyBHZW9tZXRyeSB9IGZyb20gXCIuLi8uLi9MaWIvaW5kZXhcIlxuXG5pbXBvcnQgeyBTaGFwZSB9ICAgZnJvbSBcIkBhc3BlY3Qvc2hhcGVcIlxuaW1wb3J0ICogYXMgYXNwZWN0IGZyb20gXCJAYXNwZWN0L2RiXCJcbmltcG9ydCAqIGFzIGRiICAgICBmcm9tIFwiQGFwcC9kYXRhXCJcblxuaW1wb3J0IFwiZmFicmljXCJcblxuZmFicmljLk9iamVjdC5wcm90b3R5cGUucGFkZGluZyAgICAgICAgICAgID0gMFxuZmFicmljLk9iamVjdC5wcm90b3R5cGUub2JqZWN0Q2FjaGluZyAgICAgID0gZmFsc2VcbmZhYnJpYy5PYmplY3QucHJvdG90eXBlLmhhc0NvbnRyb2xzICAgICAgICA9IHRydWVcbmZhYnJpYy5PYmplY3QucHJvdG90eXBlLmhhc0JvcmRlcnMgICAgICAgICA9IHRydWVcbmZhYnJpYy5PYmplY3QucHJvdG90eXBlLmhhc1JvdGF0aW5nUG9pbnQgICA9IGZhbHNlXG5mYWJyaWMuT2JqZWN0LnByb3RvdHlwZS50cmFuc3BhcmVudENvcm5lcnMgPSBmYWxzZVxuZmFicmljLk9iamVjdC5wcm90b3R5cGUuY2VudGVyZWRTY2FsaW5nICAgID0gdHJ1ZVxuZmFicmljLk9iamVjdC5wcm90b3R5cGUuY29ybmVyU3R5bGUgICAgICAgID0gXCJjaXJjbGVcIlxuZmFicmljLk9iamVjdC5wcm90b3R5cGUuc2V0Q29udHJvbFZpc2libGUgKCBcIm1sXCIsIGZhbHNlIClcbmZhYnJpYy5PYmplY3QucHJvdG90eXBlLnNldENvbnRyb2xWaXNpYmxlICggXCJtdFwiLCBmYWxzZSApXG5mYWJyaWMuT2JqZWN0LnByb3RvdHlwZS5zZXRDb250cm9sVmlzaWJsZSAoIFwibXJcIiwgZmFsc2UgKVxuZmFicmljLk9iamVjdC5wcm90b3R5cGUuc2V0Q29udHJvbFZpc2libGUgKCBcIm1iXCIsIGZhbHNlIClcbmZhYnJpYy5PYmplY3QucHJvdG90eXBlLnNldENvbnRyb2xWaXNpYmxlICggXCJ0bFwiLCBmYWxzZSApXG5mYWJyaWMuT2JqZWN0LnByb3RvdHlwZS5zZXRDb250cm9sVmlzaWJsZSAoIFwiYmxcIiwgZmFsc2UgKVxuZmFicmljLk9iamVjdC5wcm90b3R5cGUuc2V0Q29udHJvbFZpc2libGUgKCBcImJyXCIsIGZhbHNlIClcblxuZXhwb3J0IGludGVyZmFjZSBWaWV3XG57XG4gICAgIG5hbWU6IHN0cmluZ1xuICAgICBhY3RpdmU6IGJvb2xlYW5cbiAgICAgY2hpbGRyZW4gOiBTaGFwZSBbXVxuICAgICB0aHVtYm5haWw6IHN0cmluZ1xuICAgICBwYWNraW5nICA6IFwiZW5jbG9zZVwiXG59XG5cbmV4cG9ydCBjbGFzcyBBcmVhXG57XG4gICAgIHJlYWRvbmx5IGZjYW52YXM6IGZhYnJpYy5DYW52YXNcbiAgICAgcHJpdmF0ZSBhY3RpdmU6IFZpZXdcbiAgICAgcHJpdmF0ZSB2aWV3cyA9IHt9IGFzIFJlY29yZCA8c3RyaW5nLCBWaWV3PlxuXG4gICAgIGNvbnN0cnVjdG9yICggY2FudmFzOiBIVE1MQ2FudmFzRWxlbWVudCApXG4gICAgIHtcbiAgICAgICAgICB0aGlzLmZjYW52YXMgPSBuZXcgZmFicmljLkNhbnZhcyAoIGNhbnZhcyApXG4gICAgICAgICAgdGhpcy5lbmFibGVFdmVudHMgKClcbiAgICAgfVxuXG4gICAgIGdldCB2aWV3ICgpXG4gICAgIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5hY3RpdmVcbiAgICAgfVxuXG4gICAgIG92ZXJGT2JqZWN0OiBmYWJyaWMuT2JqZWN0ID0gdW5kZWZpbmVkXG5cbiAgICAgc3RhdGljIGN1cnJlbnRFdmVudDogZmFicmljLklFdmVudFxuICAgICBvbk92ZXJPYmplY3QgID0gbnVsbCBhcyAoIG9iajogU2hhcGUgKSA9PiB2b2lkXG4gICAgIG9uT3V0T2JqZWN0ICAgPSBudWxsIGFzICggb2JqOiBTaGFwZSApID0+IHZvaWRcbiAgICAgb25Ub3VjaE9iamVjdCA9IG51bGwgYXMgKCBvYmo6IFNoYXBlICkgPT4gdm9pZFxuICAgICBvbkRvdWJsZVRvdWNoT2JqZWN0ID0gbnVsbCBhcyAoIG9iajogU2hhcGUgKSA9PiB2b2lkXG4gICAgIG9uVG91Y2hBcmVhICAgPSBudWxsIGFzICggeDogbnVtYmVyLCB5OiBudW1iZXIgKSA9PiB2b2lkXG5cbiAgICAgY3JlYXRlVmlldyAoIG5hbWU6IHN0cmluZyApXG4gICAgIHtcbiAgICAgICAgICBjb25zdCB7IHZpZXdzIH0gPSB0aGlzXG5cbiAgICAgICAgICBpZiAoIG5hbWUgaW4gdmlld3MgKVxuICAgICAgICAgICAgICAgdGhyb3cgXCJUaGUgdmlldyBhbHJlYWR5IGV4aXN0c1wiXG5cbiAgICAgICAgICByZXR1cm4gdmlld3MgW25hbWVdID0ge1xuICAgICAgICAgICAgICAgbmFtZSxcbiAgICAgICAgICAgICAgIGFjdGl2ZSAgIDogZmFsc2UsXG4gICAgICAgICAgICAgICBjaGlsZHJlbiA6IFtdLFxuICAgICAgICAgICAgICAgcGFja2luZyAgOiBcImVuY2xvc2VcIixcbiAgICAgICAgICAgICAgIHRodW1ibmFpbDogbnVsbCxcbiAgICAgICAgICB9XG4gICAgIH1cblxuICAgICB1c2UgKCBuYW1lOiBzdHJpbmcgKTogVmlld1xuICAgICB1c2UgKCB2aWV3OiBWaWV3ICkgIDogVmlld1xuICAgICB1c2UgKCBuYW1lOiBzdHJpbmcgfCBWaWV3ICk6IFZpZXdcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHsgZmNhbnZhcywgdmlld3MgfSA9IHRoaXNcblxuICAgICAgICAgIGlmICggdHlwZW9mIG5hbWUgIT0gXCJzdHJpbmdcIiApXG4gICAgICAgICAgICAgICBuYW1lID0gbmFtZS5uYW1lXG5cbiAgICAgICAgICBpZiAoIHRoaXMuYWN0aXZlICYmIHRoaXMuYWN0aXZlLm5hbWUgPT0gbmFtZSApXG4gICAgICAgICAgICAgICByZXR1cm5cblxuICAgICAgICAgIGlmICggISAobmFtZSBpbiB2aWV3cykgKVxuICAgICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgICBjb25zdCBhY3RpdmUgPSB0aGlzLmFjdGl2ZSA9IHZpZXdzIFtuYW1lXVxuXG4gICAgICAgICAgZmNhbnZhcy5jbGVhciAoKVxuXG4gICAgICAgICAgZm9yICggY29uc3Qgc2hhcGUgb2YgYWN0aXZlLmNoaWxkcmVuIClcbiAgICAgICAgICAgICAgIGZjYW52YXMuYWRkICggc2hhcGUuZ3JvdXAgKVxuXG4gICAgICAgICAgcmV0dXJuIGFjdGl2ZVxuICAgICB9XG5cbiAgICAgYWRkICggLi4uIHNoYXBlczogKFNoYXBlIHwgJE5vZGUpIFtdICk6IHZvaWRcbiAgICAgYWRkICggLi4uIHBhdGg6IHN0cmluZyBbXSApOiB2b2lkXG4gICAgIGFkZCAoKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgeyBhY3RpdmUsIGZjYW52YXMgfSA9IHRoaXNcblxuICAgICAgICAgIGlmICggYXJndW1lbnRzLmxlbmd0aCA9PSAwIClcbiAgICAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgICAgaWYgKCB0eXBlb2YgYXJndW1lbnRzIFswXSA9PSBcInN0cmluZ1wiIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICAvL2NvbnN0IG5vZGUgPSBkYi5nZXROb2RlICggLi4uIGFyZ3VtZW50cyBhcyBhbnkgYXMgc3RyaW5nIFtdIClcbiAgICAgICAgICAgICAgIGNvbnN0IG5vZGUgPSBkYi5ub2RlICggYXJndW1lbnRzIFswXSwgYXJndW1lbnRzIFsxXSBhcyBzdHJpbmcgIClcbiAgICAgICAgICAgICAgIGNvbnN0IHNocCA9IGFzcGVjdC5nZXRBc3BlY3QgKCBub2RlIClcbiAgICAgICAgICAgICAgIGFjdGl2ZS5jaGlsZHJlbi5wdXNoICggc2hwIClcbiAgICAgICAgICAgICAgIGZjYW52YXMuYWRkICggc2hwLmdyb3VwIClcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZSBmb3IgKCBjb25zdCBzIG9mIGFyZ3VtZW50cyApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgY29uc3Qgc2hwID0gYXNwZWN0LmdldEFzcGVjdCAoIHMgYXMgJE5vZGUgfCBTaGFwZSApXG5cbiAgICAgICAgICAgICAgIC8vIHNocC5nZXRGYWJyaWNcbiAgICAgICAgICAgICAgIC8vIHNocC5nZXRIdG1sXG4gICAgICAgICAgICAgICAvLyBzaHAuZ2V0U3ZnXG5cbiAgICAgICAgICAgICAgIC8vIGZhY3RvcnlcblxuICAgICAgICAgICAgICAgYWN0aXZlLmNoaWxkcmVuLnB1c2ggKCBzaHAgKVxuICAgICAgICAgICAgICAgZmNhbnZhcy5hZGQgKCBzaHAuZ3JvdXAgKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGZjYW52YXMucmVxdWVzdFJlbmRlckFsbCAoKVxuICAgICB9XG5cbiAgICAgY2xlYXIgKClcbiAgICAge1xuICAgICAgICAgIHRoaXMuZmNhbnZhcy5jbGVhciAoKVxuICAgICB9XG5cbiAgICAgcGFjayAoKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgeyBmY2FudmFzIH0gPSB0aGlzXG5cbiAgICAgICAgICBjb25zdCBvYmplY3RzID0gZmNhbnZhcy5nZXRPYmplY3RzICgpXG4gICAgICAgICAgY29uc3QgcG9zaXRpb25zID0gW10gYXMgR2VvbWV0cnkuQ2lyY2xlIFtdXG5cbiAgICAgICAgICBmb3IgKCBjb25zdCBnIG9mIG9iamVjdHMgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNvbnN0IHIgPSAoZy53aWR0aCA+IGcuaGVpZ2h0ID8gZy53aWR0aCA6IGcuaGVpZ2h0KSAvIDJcbiAgICAgICAgICAgICAgIHBvc2l0aW9ucy5wdXNoICggeyB4OiBnLmxlZnQsIHk6IGcudG9wLCByOiByICsgMjAgfSApXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgR2VvbWV0cnkucGFja0VuY2xvc2UgKCBwb3NpdGlvbnMgKSAqIDJcblxuICAgICAgICAgIGZvciAoIHZhciBpID0gMCA7IGkgPCBvYmplY3RzLmxlbmd0aCA7IGkrKyApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgY29uc3QgZyA9IG9iamVjdHMgW2ldXG4gICAgICAgICAgICAgICBjb25zdCBwID0gcG9zaXRpb25zIFtpXVxuXG4gICAgICAgICAgICAgICBnLmxlZnQgPSBwLnhcbiAgICAgICAgICAgICAgIGcudG9wICA9IHAueVxuICAgICAgICAgICAgICAgZy5zZXRDb29yZHMgKClcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBmY2FudmFzLnJlcXVlc3RSZW5kZXJBbGwgKClcbiAgICAgfVxuXG4gICAgIHpvb20gKCBmYWN0b3I/OiBudW1iZXIgfCBTaGFwZSApXG4gICAgIHtcbiAgICAgICAgICBjb25zdCB7IGZjYW52YXMgfSA9IHRoaXNcblxuICAgICAgICAgIGlmICggdHlwZW9mIGZhY3RvciA9PSBcIm51bWJlclwiIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjb25zdCBvYmplY3RzID0gZmNhbnZhcy5nZXRPYmplY3RzICgpXG5cbiAgICAgICAgICBpZiAoIHR5cGVvZiBmYWN0b3IgPT0gXCJvYmplY3RcIiApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgY29uc3QgbyA9IGZhY3Rvci5ncm91cFxuXG4gICAgICAgICAgICAgICB2YXIgbGVmdCAgID0gby5sZWZ0IC0gby53aWR0aFxuICAgICAgICAgICAgICAgdmFyIHJpZ2h0ICA9IG8ubGVmdCArIG8ud2lkdGhcbiAgICAgICAgICAgICAgIHZhciB0b3AgICAgPSBvLnRvcCAgLSBvLmhlaWdodFxuICAgICAgICAgICAgICAgdmFyIGJvdHRvbSA9IG8udG9wICArIG8uaGVpZ2h0XG5cbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHZhciBsZWZ0ICAgPSAwXG4gICAgICAgICAgICAgICB2YXIgcmlnaHQgID0gMFxuICAgICAgICAgICAgICAgdmFyIHRvcCAgICA9IDBcbiAgICAgICAgICAgICAgIHZhciBib3R0b20gPSAwXG5cbiAgICAgICAgICAgICAgIGZvciAoIGNvbnN0IG8gb2Ygb2JqZWN0cyApXG4gICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGwgPSBvLmxlZnQgLSBvLndpZHRoXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHIgPSBvLmxlZnQgKyBvLndpZHRoXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHQgPSBvLnRvcCAgLSBvLmhlaWdodFxuICAgICAgICAgICAgICAgICAgICBjb25zdCBiID0gby50b3AgICsgby5oZWlnaHRcblxuICAgICAgICAgICAgICAgICAgICBpZiAoIGwgPCBsZWZ0IClcbiAgICAgICAgICAgICAgICAgICAgICAgICBsZWZ0ID0gbFxuXG4gICAgICAgICAgICAgICAgICAgIGlmICggciA+IHJpZ2h0IClcbiAgICAgICAgICAgICAgICAgICAgICAgICByaWdodCA9IHJcblxuICAgICAgICAgICAgICAgICAgICBpZiAoIHQgPCB0b3AgKVxuICAgICAgICAgICAgICAgICAgICAgICAgIHRvcCA9IHRcblxuICAgICAgICAgICAgICAgICAgICBpZiAoIGIgPiBib3R0b20gKVxuICAgICAgICAgICAgICAgICAgICAgICAgIGJvdHRvbSA9IGJcbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjb25zdCB3ICA9IHJpZ2h0IC0gbGVmdFxuICAgICAgICAgIGNvbnN0IGggID0gYm90dG9tIC0gdG9wXG4gICAgICAgICAgY29uc3QgdncgPSBmY2FudmFzLmdldFdpZHRoICAoKVxuICAgICAgICAgIGNvbnN0IHZoID0gZmNhbnZhcy5nZXRIZWlnaHQgKClcblxuICAgICAgICAgIGNvbnN0IGYgPSB3ID4gaFxuICAgICAgICAgICAgICAgICAgICA/ICh2dyA8IHZoID8gdncgOiB2aCkgLyB3XG4gICAgICAgICAgICAgICAgICAgIDogKHZ3IDwgdmggPyB2dyA6IHZoKSAvIGhcblxuICAgICAgICAgIGZjYW52YXMudmlld3BvcnRUcmFuc2Zvcm0gWzBdID0gZlxuICAgICAgICAgIGZjYW52YXMudmlld3BvcnRUcmFuc2Zvcm0gWzNdID0gZlxuXG4gICAgICAgICAgY29uc3QgY3ggPSBsZWZ0ICsgdyAvIDJcbiAgICAgICAgICBjb25zdCBjeSA9IHRvcCAgKyBoIC8gMlxuXG4gICAgICAgICAgZmNhbnZhcy52aWV3cG9ydFRyYW5zZm9ybSBbNF0gPSAtKGN4ICogZikgKyB2dyAvIDJcbiAgICAgICAgICBmY2FudmFzLnZpZXdwb3J0VHJhbnNmb3JtIFs1XSA9IC0oY3kgKiBmKSArIHZoIC8gMlxuXG4gICAgICAgICAgZm9yICggY29uc3QgbyBvZiBvYmplY3RzIClcbiAgICAgICAgICAgICAgIG8uc2V0Q29vcmRzICgpXG5cbiAgICAgICAgICBmY2FudmFzLnJlcXVlc3RSZW5kZXJBbGwgKClcbiAgICAgfVxuXG4gICAgIGlzb2xhdGUgKCBzaGFwZTogU2hhcGUgKVxuICAgICB7XG4gICAgICAgICAgZm9yICggY29uc3QgbyBvZiB0aGlzLmZjYW52YXMuZ2V0T2JqZWN0cyAoKSApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgby52aXNpYmxlID0gZmFsc2VcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBzaGFwZS5ncm91cC52aXNpYmxlID0gdHJ1ZVxuICAgICB9XG5cbiAgICAgZ2V0VGh1bWJuYWlsICgpXG4gICAgIHtcbiAgICAgICAgICBjb25zdCB7IGFjdGl2ZTogY3ZpZXcgfSA9IHRoaXNcblxuICAgICAgICAgIGNvbnN0IHRodW1ibmFpbCA9IGN2aWV3LnRodW1ibmFpbFxuXG4gICAgICAgICAgaWYgKCB0aHVtYm5haWwgfHwgY3ZpZXcuYWN0aXZlID09IGZhbHNlIClcbiAgICAgICAgICAgICAgIHRodW1ibmFpbFxuXG4gICAgICAgICAgcmV0dXJuIGN2aWV3LnRodW1ibmFpbCA9IHRoaXMuZmNhbnZhcy50b0RhdGFVUkwgKHsgZm9ybWF0OiBcImpwZWdcIiB9KVxuICAgICB9XG5cbiAgICAgLy8gVUkgRVZFTlRTXG5cbiAgICAgZW5hYmxlRXZlbnRzICgpXG4gICAgIHtcbiAgICAgICAgICB0aGlzLmluaXRDbGlja0V2ZW50ICgpXG4gICAgICAgICAgdGhpcy5pbml0T3ZlckV2ZW50ICAoKVxuICAgICAgICAgIHRoaXMuaW5pdFBhbkV2ZW50ICAgKClcbiAgICAgICAgICB0aGlzLmluaXRab29tRXZlbnQgICgpXG4gICAgICAgICAgLy90aGlzLmluaXRNb3ZlT2JqZWN0ICgpXG4gICAgICAgICAgLy90aGlzLmluaXREcmFnRXZlbnQgICgpXG5cbiAgICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lciAoIFwicmVzaXplXCIsIHRoaXMucmVzcG9uc2l2ZS5iaW5kICh0aGlzKSApXG4gICAgIH1cblxuICAgICBwcml2YXRlIHJlc3BvbnNpdmUgKClcbiAgICAge1xuICAgICAgICAgIHZhciB3aWR0aCAgID0gKHdpbmRvdy5pbm5lcldpZHRoICA+IDApID8gd2luZG93LmlubmVyV2lkdGggIDogc2NyZWVuLndpZHRoXG4gICAgICAgICAgdmFyIGhlaWdodCAgPSAod2luZG93LmlubmVySGVpZ2h0ID4gMCkgPyB3aW5kb3cuaW5uZXJIZWlnaHQgOiBzY3JlZW4uaGVpZ2h0XG5cbiAgICAgICAgICB0aGlzLmZjYW52YXMuc2V0RGltZW5zaW9ucyh7XG4gICAgICAgICAgICAgICB3aWR0aDogd2lkdGgsXG4gICAgICAgICAgICAgICBoZWlnaHQ6IGhlaWdodFxuICAgICAgICAgIH0pXG4gICAgIH1cblxuICAgICBwcml2YXRlIGluaXRDbGlja0V2ZW50ICgpXG4gICAgIHtcbiAgICAgICAgICBjb25zdCBwYWdlICAgICAgICAgICA9IHRoaXMuZmNhbnZhc1xuICAgICAgICAgIGNvbnN0IG1heF9jbGljaF9hcmVhID0gMjUgKiAyNVxuICAgICAgICAgIHZhciAgIGxhc3RfY2xpY2sgICAgID0gLTFcbiAgICAgICAgICB2YXIgICBsYXN0X3BvcyAgICAgICA9IHsgeDogLTk5OTksIHk6IC05OTk5IH1cblxuICAgICAgICAgIHBhZ2Uub24gKCBcIm1vdXNlOmRvd25cIiwgZmV2ZW50ID0+XG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgY29uc29sZS5sb2cgKCBcIm1vdXNlOmRvd25cIiApXG4gICAgICAgICAgICAgICBjb25zdCBub3cgICA9IERhdGUubm93ICgpXG4gICAgICAgICAgICAgICBjb25zdCBwb3MgICA9IGZldmVudC5wb2ludGVyXG4gICAgICAgICAgICAgICBjb25zdCByZXNldCA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgbGFzdF9jbGljayA9IG5vd1xuICAgICAgICAgICAgICAgICAgICBsYXN0X3BvcyAgID0gcG9zXG4gICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgIC8vIE5vdXMgdsOpcmlmaW9ucyBxdWUgc29pdCB1biBkb3VibGUtY2xpcXVlLlxuICAgICAgICAgICAgICAgaWYgKCA1MDAgPCBub3cgLSBsYXN0X2NsaWNrIClcbiAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCB0aGlzLm9uVG91Y2hPYmplY3QgKVxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZWxlbWVudCA9IGFzcGVjdC5nZXRBc3BlY3QgKCBmZXZlbnQudGFyZ2V0IClcblxuICAgICAgICAgICAgICAgICAgICAgICAgIEFyZWEuY3VycmVudEV2ZW50ID0gZmV2ZW50O1xuICAgICAgICAgICAgICAgICAgICAgICAgIGlmICggZWxlbWVudCApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm9uVG91Y2hPYmplY3QgKCBlbGVtZW50IClcbiAgICAgICAgICAgICAgICAgICAgICAgICBBcmVhLmN1cnJlbnRFdmVudCA9IG51bGw7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICBmZXZlbnQuZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24gKClcbiAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXNldCAoKVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgIC8vIE5vdXMgdsOpcmlmaW9ucyBxdWUgbGVzIGRldXggY2xpcXVlcyBzZSB0cm91dmUgZGFucyB1bmUgcsOpZ2lvbiBwcm9jaGUuXG4gICAgICAgICAgICAgICBjb25zdCB6b25lID0gKHBvcy54IC0gbGFzdF9wb3MueCkgKiAocG9zLnkgLSBsYXN0X3Bvcy55KVxuICAgICAgICAgICAgICAgaWYgKCB6b25lIDwgLW1heF9jbGljaF9hcmVhIHx8IG1heF9jbGljaF9hcmVhIDwgem9uZSApXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXNldCAoKVxuXG4gICAgICAgICAgICAgICAvLyBTaSBsZSBwb2ludGVyIGVzdCBhdS1kZXNzdXMgZOKAmXVuZSBmb3JtZS5cbiAgICAgICAgICAgICAgIGlmICggZmV2ZW50LnRhcmdldCAhPSB1bmRlZmluZWQgKVxuICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIHRoaXMub25Eb3VibGVUb3VjaE9iamVjdCApXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBlbGVtZW50ID0gYXNwZWN0LmdldEFzcGVjdCAoIGZldmVudC50YXJnZXQgKVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgQXJlYS5jdXJyZW50RXZlbnQgPSBmZXZlbnQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCBlbGVtZW50IClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMub25Eb3VibGVUb3VjaE9iamVjdCAoIGVsZW1lbnQgKVxuICAgICAgICAgICAgICAgICAgICAgICAgIEFyZWEuY3VycmVudEV2ZW50ID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGxhc3RfY2xpY2sgICA9IC0xXG4gICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAvLyBTaSBsZSBwb2ludGVyIGVzdCBhdS1kZXNzdXMgZOKAmXVuZSB6b25lIHZpZGUuXG4gICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIEFyZWEuY3VycmVudEV2ZW50ID0gZmV2ZW50O1xuICAgICAgICAgICAgICAgICAgICBpZiAoIHRoaXMub25Ub3VjaEFyZWEgKVxuICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMub25Ub3VjaEFyZWEgKCBwb3MueCwgcG9zLnkgKVxuICAgICAgICAgICAgICAgICAgICBBcmVhLmN1cnJlbnRFdmVudCA9IG51bGw7XG4gICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgIGZldmVudC5lLnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbiAoKVxuXG4gICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICB9KVxuICAgICB9XG5cbiAgICAgcHJpdmF0ZSBpbml0T3ZlckV2ZW50ICgpXG4gICAgIHtcbiAgICAgICAgICBjb25zdCBwYWdlID0gdGhpcy5mY2FudmFzXG5cbiAgICAgICAgICBwYWdlLm9uICggXCJtb3VzZTpvdmVyXCIsIGZldmVudCA9PlxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHRoaXMub3ZlckZPYmplY3QgPSBmZXZlbnQudGFyZ2V0XG5cbiAgICAgICAgICAgICAgIGlmICggdGhpcy5vbk92ZXJPYmplY3QgKVxuICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBlbGVtZW50ID0gYXNwZWN0LmdldEFzcGVjdCAoIGZldmVudC50YXJnZXQgKVxuXG4gICAgICAgICAgICAgICAgICAgIEFyZWEuY3VycmVudEV2ZW50ID0gZmV2ZW50O1xuICAgICAgICAgICAgICAgICAgICBpZiAoIGVsZW1lbnQgKVxuICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMub25PdmVyT2JqZWN0ICggZWxlbWVudCApXG4gICAgICAgICAgICAgICAgICAgIEFyZWEuY3VycmVudEV2ZW50ID0gbnVsbDtcbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICB9KVxuXG4gICAgICAgICAgcGFnZS5vbiAoIFwibW91c2U6b3V0XCIsIGZldmVudCA9PlxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHRoaXMub3ZlckZPYmplY3QgPSB1bmRlZmluZWRcblxuICAgICAgICAgICAgICAgaWYgKCB0aGlzLm9uT3V0T2JqZWN0IClcbiAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZWxlbWVudCA9IGFzcGVjdC5nZXRBc3BlY3QgKCBmZXZlbnQudGFyZ2V0IClcblxuICAgICAgICAgICAgICAgICAgICBBcmVhLmN1cnJlbnRFdmVudCA9IGZldmVudDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBlbGVtZW50IClcbiAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm9uT3V0T2JqZWN0ICggZWxlbWVudCApXG4gICAgICAgICAgICAgICAgICAgIEFyZWEuY3VycmVudEV2ZW50ID0gbnVsbDtcbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICB9KVxuICAgICB9XG5cbiAgICAgcHJpdmF0ZSBpbml0UGFuRXZlbnQgKClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHBhZ2UgICAgICAgPSB0aGlzLmZjYW52YXNcbiAgICAgICAgICB2YXIgICBpc0RyYWdnaW5nID0gZmFsc2VcbiAgICAgICAgICB2YXIgICBsYXN0UG9zWCAgID0gLTFcbiAgICAgICAgICB2YXIgICBsYXN0UG9zWSAgID0gLTFcblxuICAgICAgICAgIHBhZ2Uub24gKCBcIm1vdXNlOmRvd25cIiwgZmV2ZW50ID0+XG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgaWYgKCB0aGlzLm92ZXJGT2JqZWN0ID09IHVuZGVmaW5lZCApXG4gICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHBhZ2Uuc2VsZWN0aW9uID0gZmFsc2VcbiAgICAgICAgICAgICAgICAgICAgcGFnZS5kaXNjYXJkQWN0aXZlT2JqZWN0ICgpXG4gICAgICAgICAgICAgICAgICAgIHBhZ2UuZm9yRWFjaE9iamVjdCAoIG8gPT4geyBvLnNlbGVjdGFibGUgPSBmYWxzZSB9IClcblxuICAgICAgICAgICAgICAgICAgICBpc0RyYWdnaW5nID0gdHJ1ZVxuICAgICAgICAgICAgICAgICAgICBsYXN0UG9zWCAgID0gZmV2ZW50LnBvaW50ZXIueFxuICAgICAgICAgICAgICAgICAgICBsYXN0UG9zWSAgID0gZmV2ZW50LnBvaW50ZXIueVxuXG4gICAgICAgICAgICAgICAgICAgIHBhZ2UucmVxdWVzdFJlbmRlckFsbCAoKVxuICAgICAgICAgICAgICAgfVxuICAgICAgICAgIH0pXG5cbiAgICAgICAgICBwYWdlLm9uICggXCJtb3VzZTptb3ZlXCIsIGZldmVudCA9PlxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGlmICggaXNEcmFnZ2luZyApXG4gICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHBvaW50ZXIgID0gZmV2ZW50LnBvaW50ZXJcblxuICAgICAgICAgICAgICAgICAgICBwYWdlLnZpZXdwb3J0VHJhbnNmb3JtIFs0XSArPSBwb2ludGVyLnggLSBsYXN0UG9zWFxuICAgICAgICAgICAgICAgICAgICBwYWdlLnZpZXdwb3J0VHJhbnNmb3JtIFs1XSArPSBwb2ludGVyLnkgLSBsYXN0UG9zWVxuXG4gICAgICAgICAgICAgICAgICAgIHBhZ2UucmVxdWVzdFJlbmRlckFsbCgpXG5cbiAgICAgICAgICAgICAgICAgICAgbGFzdFBvc1ggPSBwb2ludGVyLnhcbiAgICAgICAgICAgICAgICAgICAgbGFzdFBvc1kgPSBwb2ludGVyLnlcbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICB9KVxuXG4gICAgICAgICAgcGFnZS5vbiAoIFwibW91c2U6dXBcIiwgKCkgPT5cbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBwYWdlLnNlbGVjdGlvbiA9IHRydWVcblxuICAgICAgICAgICAgICAgcGFnZS5mb3JFYWNoT2JqZWN0ICggbyA9PlxuICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBvLnNlbGVjdGFibGUgPSB0cnVlXG4gICAgICAgICAgICAgICAgICAgIG8uc2V0Q29vcmRzKClcbiAgICAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgICAgIGlzRHJhZ2dpbmcgPSBmYWxzZVxuXG4gICAgICAgICAgICAgICBwYWdlLnJlcXVlc3RSZW5kZXJBbGwgKClcbiAgICAgICAgICB9KVxuICAgICB9XG5cbiAgICAgcHJpdmF0ZSBpbml0Wm9vbUV2ZW50ICgpXG4gICAgIHtcbiAgICAgICAgICBjb25zdCBwYWdlID0gdGhpcy5mY2FudmFzXG5cbiAgICAgICAgICBwYWdlLm9uICggXCJtb3VzZTp3aGVlbFwiLCBmZXZlbnQgPT5cbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBjb25zdCBldmVudCAgID0gZmV2ZW50LmUgYXMgV2hlZWxFdmVudFxuICAgICAgICAgICAgICAgdmFyICAgZGVsdGEgICA9IGV2ZW50LmRlbHRhWVxuICAgICAgICAgICAgICAgdmFyICAgem9vbSAgICA9IHBhZ2UuZ2V0Wm9vbSgpXG4gICAgICAgICAgICAgICAgICAgIHpvb20gICAgPSB6b29tIC0gZGVsdGEgKiAwLjAwNVxuXG4gICAgICAgICAgICAgICBpZiAoem9vbSA+IDkpXG4gICAgICAgICAgICAgICAgICAgIHpvb20gPSA5XG5cbiAgICAgICAgICAgICAgIGlmICh6b29tIDwgMC41KVxuICAgICAgICAgICAgICAgICAgICB6b29tID0gMC41XG5cbiAgICAgICAgICAgICAgIHBhZ2Uuem9vbVRvUG9pbnQoIG5ldyBmYWJyaWMuUG9pbnQgKCBldmVudC5vZmZzZXRYLCBldmVudC5vZmZzZXRZICksIHpvb20gKVxuXG4gICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKVxuXG4gICAgICAgICAgICAgICBwYWdlLnJlcXVlc3RSZW5kZXJBbGwgKClcbiAgICAgICAgICB9KVxuICAgICB9XG5cbiAgICAgcHJpdmF0ZSBpbml0TW92ZU9iamVjdCAoKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgcGFnZSAgICAgID0gdGhpcy5mY2FudmFzXG4gICAgICAgICAgdmFyICAgY2x1c3RlciAgID0gdW5kZWZpbmVkIGFzIGZhYnJpYy5PYmplY3QgW11cbiAgICAgICAgICB2YXIgICBwb3NpdGlvbnMgPSB1bmRlZmluZWQgYXMgbnVtYmVyIFtdW11cbiAgICAgICAgICB2YXIgICBvcmlnaW5YICAgPSAwXG4gICAgICAgICAgdmFyICAgb3JpZ2luWSAgID0gMFxuXG4gICAgICAgICAgZnVuY3Rpb24gb25fc2VsZWN0aW9uIChmZXZlbnQ6IGZhYnJpYy5JRXZlbnQpXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgY29uc3QgdGFyZ2V0ID0gZmV2ZW50LnRhcmdldFxuICAgICAgICAgICAgICAgY29uc29sZS5sb2cgKCB0YXJnZXQgKVxuICAgICAgICAgICAgICAgY2x1c3RlciA9IHRhcmdldCBbXCJjbHVzdGVyXCJdIGFzIGZhYnJpYy5PYmplY3QgW11cblxuICAgICAgICAgICAgICAgaWYgKCBjbHVzdGVyID09IHVuZGVmaW5lZCApXG4gICAgICAgICAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgICAgICAgICBvcmlnaW5YICAgPSB0YXJnZXQubGVmdFxuICAgICAgICAgICAgICAgb3JpZ2luWSAgID0gdGFyZ2V0LnRvcFxuICAgICAgICAgICAgICAgcG9zaXRpb25zID0gW11cblxuICAgICAgICAgICAgICAgZm9yICggY29uc3QgbyBvZiBjbHVzdGVyIClcbiAgICAgICAgICAgICAgICAgICAgcG9zaXRpb25zLnB1c2ggKFsgby5sZWZ0LCBvLnRvcCBdKVxuXG4gICAgICAgICAgICAgICBjb25zb2xlLmxvZyAoXCJjcmVhdGVkXCIpXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcGFnZS5vbiAoIFwic2VsZWN0aW9uOmNyZWF0ZWRcIiwgb25fc2VsZWN0aW9uIClcbiAgICAgICAgICBwYWdlLm9uICggXCJzZWxlY3Rpb246dXBkYXRlZFwiLCBvbl9zZWxlY3Rpb24gKVxuXG4gICAgICAgICAgcGFnZS5vbiAoIFwib2JqZWN0Om1vdmluZ1wiLCBmZXZlbnQgPT5cbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBpZiAoIGNsdXN0ZXIgPT0gdW5kZWZpbmVkIClcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgICAgICAgIGNvbnN0IHRhcmdldCAgID0gZmV2ZW50LnRhcmdldFxuICAgICAgICAgICAgICAgY29uc3Qgb2Zmc2V0WCAgPSB0YXJnZXQubGVmdCAtIG9yaWdpblhcbiAgICAgICAgICAgICAgIGNvbnN0IG9mZnNldFkgID0gdGFyZ2V0LnRvcCAgLSBvcmlnaW5ZXG5cbiAgICAgICAgICAgICAgIGZvciAoIHZhciBpID0gMCA7IGkgPCBjbHVzdGVyLmxlbmd0aCA7IGkrKyApXG4gICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG9iaiA9IGNsdXN0ZXIgW2ldXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHBvcyA9IHBvc2l0aW9ucyBbaV1cbiAgICAgICAgICAgICAgICAgICAgb2JqLnNldCAoe1xuICAgICAgICAgICAgICAgICAgICAgICAgIGxlZnQ6IHBvcyBbMF0gKyBvZmZzZXRYLFxuICAgICAgICAgICAgICAgICAgICAgICAgIHRvcCA6IHBvcyBbMV0gKyBvZmZzZXRZXG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICB9XG4gICAgICAgICAgfSlcblxuICAgICAgICAgIHBhZ2Uub24gKCBcInNlbGVjdGlvbjpjbGVhcmVkXCIsIGZldmVudCA9PlxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNsdXN0ZXIgPSB1bmRlZmluZWRcblxuICAgICAgICAgICAgICAgY29uc29sZS5sb2cgKFwiY2xlYXJlZFwiKVxuICAgICAgICAgIH0pXG4gICAgIH1cblxuICAgICBwcml2YXRlIGluaXREcmFnRXZlbnQgKClcbiAgICAge1xuICAgICAgICAgIC8vIGh0dHBzOi8vd3d3Lnczc2Nob29scy5jb20vaHRtbC9odG1sNV9kcmFnYW5kZHJvcC5hc3BcbiAgICAgICAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vU2hvcGlmeS9kcmFnZ2FibGUvYmxvYi9tYXN0ZXIvc3JjL0RyYWdnYWJsZS9EcmFnZ2FibGUuanNcblxuICAgICAgICAgIGNvbnN0IHBhZ2UgICAgICA9IHRoaXMuZmNhbnZhc1xuXG4gICAgICAgICAgcGFnZS5vbiAoIFwidG91Y2g6ZHJhZ1wiLCBmZXZlbnQgPT5cbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nICggZmV2ZW50IClcbiAgICAgICAgICAgICAgIGNvbnNvbGUubG9nICggXCJ0b3VjaDpkcmFnXCIgKVxuICAgICAgICAgIH0pXG5cbiAgICAgICAgICBwYWdlLm9uICggXCJkcmFnZW50ZXJcIiwgZmV2ZW50ID0+XG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgLy9jb25zb2xlLmxvZyAoIFwiRFJPUC1FTlRFUlwiLCBmZXZlbnQgKVxuICAgICAgICAgIH0pXG5cbiAgICAgICAgICBwYWdlLm9uICggXCJkcmFnb3ZlclwiLCBmZXZlbnQgPT5cbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nICggXCJEUk9QLU9WRVJcIiwgZmV2ZW50IClcbiAgICAgICAgICB9KVxuXG4gICAgICAgICAgcGFnZS5vbiAoIFwiZHJvcFwiLCBmZXZlbnQgPT5cbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICAvL2NvbnN0IGUgPSBmZXZlbnQuZSBhcyBEcmFnRXZlbnRcbiAgICAgICAgICAgICAgIC8vY29uc29sZS5sb2cgKCBcIkRST1BcIiwgZS5kYXRhVHJhbnNmZXIuZ2V0RGF0YSAoXCJ0ZXh0XCIpIClcbiAgICAgICAgICB9KVxuICAgICB9XG59XG4iLCJcbmltcG9ydCB7IEFyZWEgfSBmcm9tIFwiLi9FbGVtZW50cy9hcmVhLmpzXCJcbmNvbnN0IGNtZHMgPSB7fSBhcyBSZWNvcmQgPHN0cmluZywgQ29tbWFuZD5cblxuY2xhc3MgQ29tbWFuZFxue1xuICAgICBjb25zdHJ1Y3RvciAoIHByaXZhdGUgY2FsbGJhY2s6ICggZXZlbnQ6IGZhYnJpYy5JRXZlbnQgKSA9PiB2b2lkICkge31cblxuICAgICBydW4gKClcbiAgICAge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICB0aGlzLmNhbGxiYWNrICggQXJlYS5jdXJyZW50RXZlbnQgKTtcbiAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuXG4gICAgICAgICAgfVxuICAgICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjb21tYW5kICggbmFtZTogc3RyaW5nLCBjYWxsYmFjaz86ICggZXZlbnQ6IGZhYnJpYy5JRXZlbnQgKSA9PiB2b2lkIClcbntcbiAgICAgaWYgKCB0eXBlb2YgY2FsbGJhY2sgPT0gXCJmdW5jdGlvblwiIClcbiAgICAge1xuICAgICAgICAgIGlmICggbmFtZSBpbiBjbWRzICkgcmV0dXJuXG4gICAgICAgICAgY21kcyBbbmFtZV0gPSBuZXcgQ29tbWFuZCAoIGNhbGxiYWNrIClcbiAgICAgfVxuXG4gICAgIHJldHVybiBjbWRzIFtuYW1lXVxufVxuIiwiXG5pbXBvcnQgeyBjcmVhdGVOb2RlIH0gZnJvbSBcIi4uLy4uL0RhdGEvaW5kZXhcIlxuaW1wb3J0IHsgeG5vZGUgfSBmcm9tIFwiQHVpL0Jhc2UveG5vZGVcIlxuXG5kZWNsYXJlIGdsb2JhbFxue1xuICAgICBpbnRlcmZhY2UgJENvbXBvbmVudCBleHRlbmRzICRDbHVzdGVyXG4gICAgIHtcbiAgICAgICAgICByZWFkb25seSBjb250ZXh0OiB0eXBlb2YgQ09OVEVYVF9VSVxuICAgICAgICAgIHR5cGU6IHN0cmluZ1xuICAgICAgICAgIGNoaWxkcmVuPzogJENvbXBvbmVudCBbXSAvLyBSZWNvcmQgPHN0cmluZywgJENoaWxkPlxuICAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBDb21wb25lbnQgPCQgZXh0ZW5kcyAkQ29tcG9uZW50ID0gJENvbXBvbmVudD5cbntcbiAgICAgZGF0YTogJFxuXG4gICAgIGNvbnRhaW5lcjogSFRNTEVsZW1lbnQgfCBTVkdFbGVtZW50XG5cbiAgICAgZGVmYXVsdERhdGEgKCkgOiAkQ29tcG9uZW50XG4gICAgIHtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgY29udGV4dDogQ09OVEVYVF9VSSxcbiAgICAgICAgICAgICAgIHR5cGUgICA6IFwiY29tcG9uZW50XCIsXG4gICAgICAgICAgICAgICBpZCAgICAgOiB1bmRlZmluZWQsXG4gICAgICAgICAgfVxuICAgICB9XG5cbiAgICAgY29uc3RydWN0b3IgKCBkYXRhOiAkIClcbiAgICAge1xuICAgICAgICAgIHRoaXMuZGF0YSA9IE9iamVjdC5hc3NpZ24gKFxuICAgICAgICAgICAgICAgdGhpcy5kZWZhdWx0RGF0YSAoKSxcbiAgICAgICAgICAgICAgIGNyZWF0ZU5vZGUgKCBkYXRhLnR5cGUsIGRhdGEuaWQsIGRhdGEgKSBhcyBhbnlcbiAgICAgICAgICApXG4gICAgIH1cblxuICAgICBnZXRIdG1sICgpOiAoSFRNTEVsZW1lbnQgfCBTVkdFbGVtZW50KSBbXVxuICAgICB7XG4gICAgICAgICAgaWYgKCB0aGlzLmNvbnRhaW5lciA9PSB1bmRlZmluZWQgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHRoaXMuY29udGFpbmVyID0gPGRpdiBjbGFzcz17IHRoaXMuZGF0YS50eXBlIH0+PC9kaXY+XG4gICAgICAgICAgICAgICB0aGlzLm9uQ3JlYXRlICgpXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIFt0aGlzLmNvbnRhaW5lcl1cbiAgICAgfVxuXG4gICAgIG9uQ3JlYXRlICgpXG4gICAgIHtcblxuICAgICB9XG5cbn1cblxuXG4iLCIvLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi9EYXRhL2luZGV4LnRzXCIgLz5cblxuZGVjbGFyZSBnbG9iYWxcbntcbiAgICAgY29uc3QgQ09OVEVYVF9VSTogXCJjb25jZXB0LXVpXCJcbn1cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eSAoIGdsb2JhbFRoaXMsIFwiQ09OVEVYVF9VSVwiLCB7XG4gICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICAgICB3cml0YWJsZTogZmFsc2UsXG4gICAgIHZhbHVlOiBcImNvbmNlcHQtdWlcIlxufSApXG5cbmltcG9ydCB7IEZhY3RvcnksIERhdGFiYXNlIH0gZnJvbSBcIi4uL0RhdGEvaW5kZXguanNcIlxuaW1wb3J0IHsgQ29tcG9uZW50IH0gZnJvbSBcIi4vRWxlbWVudHMvY29tcG9uZW50LmpzXCJcblxuLy9jb25zdCBDT05URVhUX1VJID0gXCJjb25jZXB0LXVpXCJcbmNvbnN0IGRiICAgICAgPSBuZXcgRGF0YWJhc2UgPCRBbnlDb21wb25lbnRzPiAoKVxuY29uc3QgZmFjdG9yeSA9IG5ldyBGYWN0b3J5IDxDb21wb25lbnQsICRBbnlDb21wb25lbnRzPiAoIGRiIClcblxuZXhwb3J0IGNvbnN0IGluU3RvY2s6IHR5cGVvZiBmYWN0b3J5LmluU3RvY2sgPSBmdW5jdGlvbiAoKVxue1xuICAgICBjb25zdCBhcmcgPSBhcmd1bWVudHMubGVuZ3RoID09IDFcbiAgICAgICAgICAgICAgID8gbm9ybWFsaXplICggYXJndW1lbnRzIFswXSApXG4gICAgICAgICAgICAgICA6IG5vcm1hbGl6ZSAoIFsuLi4gYXJndW1lbnRzXSApXG5cbiAgICAgY29uc3QgcGF0aCA9IGZhY3RvcnkuZ2V0UGF0aCAoIGFyZyApXG5cbiAgICAgcmV0dXJuIGZhY3RvcnkuX2luU3RvY2sgKCBwYXRoIClcbn1cblxuZXhwb3J0IGNvbnN0IHBpY2s6IHR5cGVvZiBmYWN0b3J5LnBpY2sgPSBmdW5jdGlvbiAoIC4uLiByZXN0OiBhbnkgW10gKVxue1xuICAgICBjb25zdCBhcmcgPSBhcmd1bWVudHMubGVuZ3RoID09IDFcbiAgICAgICAgICAgICAgID8gbm9ybWFsaXplICggYXJndW1lbnRzIFswXSApXG4gICAgICAgICAgICAgICA6IG5vcm1hbGl6ZSAoIFsuLi4gYXJndW1lbnRzXSApXG5cbiAgICAgY29uc3QgcGF0aCA9IGZhY3RvcnkuZ2V0UGF0aCAoIGFyZyApXG5cbiAgICAgcmV0dXJuIGZhY3RvcnkuX3BpY2sgKCBwYXRoIClcbn1cblxuZXhwb3J0IGNvbnN0IG1ha2U6IHR5cGVvZiBmYWN0b3J5Lm1ha2UgPSBmdW5jdGlvbiAoKVxue1xuICAgICBjb25zdCBhcmcgPSBhcmd1bWVudHMubGVuZ3RoID09IDFcbiAgICAgICAgICAgICAgID8gbm9ybWFsaXplICggYXJndW1lbnRzIFswXSApXG4gICAgICAgICAgICAgICA6IG5vcm1hbGl6ZSAoIFsuLi4gYXJndW1lbnRzXSApXG5cbiAgICAgY29uc3QgcGF0aCA9IGZhY3RvcnkuZ2V0UGF0aCAoIGFyZyApXG5cbiAgICAgaWYgKCBpc05vZGUgKCBhcmcgKSApXG4gICAgICAgICAgdmFyIGRhdGEgPSBhcmdcblxuICAgICByZXR1cm4gZmFjdG9yeS5fbWFrZSAoIHBhdGgsIGRhdGEgKVxufVxuXG5leHBvcnQgY29uc3Qgc2V0OiB0eXBlb2YgZGIuc2V0ID0gZnVuY3Rpb24gKClcbntcbiAgICAgY29uc3QgYXJnID0gbm9ybWFsaXplICggYXJndW1lbnRzIFswXSApXG5cbiAgICAgaWYgKCBhcmd1bWVudHMubGVuZ3RoID09IDEgKVxuICAgICAgICAgIGRiLnNldCAoIGFyZyApXG4gICAgIGVsc2VcbiAgICAgICAgICBkYi5zZXQgKCBhcmcsIG5vcm1hbGl6ZSAoIGFyZ3VtZW50cyBbMV0gKSApXG59XG5cbmV4cG9ydCBjb25zdCBkZWZpbmUgPSBmYWN0b3J5LmRlZmluZS5iaW5kICggZmFjdG9yeSApIGFzIHR5cGVvZiBmYWN0b3J5LmRlZmluZVxuLy9leHBvcnQgY29uc3QgZGVmaW5lOiB0eXBlb2YgZmFjdG9yeS5kZWZpbmUgPSBmdW5jdGlvbiAoIGN0b3I6IGFueSwgLi4uIHJlc3Q6IGFueSApXG4vL3tcbi8vICAgICBjb25zdCBhcmcgPSByZXN0Lmxlbmd0aCA9PSAxXG4vLyAgICAgICAgICAgICAgID8gbm9ybWFsaXplICggcmVzdCBbMF0gKVxuLy8gICAgICAgICAgICAgICA6IG5vcm1hbGl6ZSAoIFsuLi4gcmVzdF0gKVxuLy9cbi8vICAgICBjb25zdCBwYXRoID0gZmFjdG9yeS5nZXRQYXRoICggYXJnIClcbi8vXG4vLyAgICAgZmFjdG9yeS5fZGVmaW5lICggY3RvciwgcGF0aCApXG4vL31cblxuXG5mdW5jdGlvbiBpc05vZGUgKCBvYmw6IGFueSApXG57XG4gICAgIHJldHVybiB0eXBlb2Ygb2JsID09IFwib2JqZWN0XCIgJiYgISBBcnJheS5pc0FycmF5IChvYmwpXG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZSAoIGFyZzogYW55IClcbntcbiAgICAgaWYgKCBBcnJheS5pc0FycmF5IChhcmcpIClcbiAgICAge1xuICAgICAgICAgIGlmICggYXJnIFswXSAhPT0gQ09OVEVYVF9VSSApXG4gICAgICAgICAgICAgICBhcmcudW5zaGlmdCAoIENPTlRFWFRfVUkgKVxuICAgICB9XG4gICAgIGVsc2UgaWYgKCB0eXBlb2YgYXJnID09IFwib2JqZWN0XCIgKVxuICAgICB7XG4gICAgICAgICAgaWYgKCBcImNvbnRleHRcIiBpbiBhcmcgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGlmICggYXJnLmNvbnRleHQgIT09IENPTlRFWFRfVUkgKVxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBcIkJhZCBjb250ZXh0IHZhbHVlXCJcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIChhcmcgYXMgYW55KS5jb250ZXh0ID0gQ09OVEVYVF9VSVxuICAgICAgICAgIH1cbiAgICAgfVxuXG4gICAgIHJldHVybiBhcmdcbn1cbiIsIlxuaW1wb3J0IHsgcGljaywgaW5TdG9jaywgbWFrZSB9IGZyb20gXCJAdWkvZGJcIlxuaW1wb3J0IHsgQ29tcG9uZW50IH0gZnJvbSBcIi4vY29tcG9uZW50XCJcblxuZGVjbGFyZSBnbG9iYWxcbntcbiAgICAgaW50ZXJmYWNlICRDb250YWluZXIgZXh0ZW5kcyAkQ29tcG9uZW50XG4gICAgIHtcbiAgICAgICAgICBkaXJlY3Rpb24/OiBcImxyXCIgfCBcInJsXCIgfCBcInRiXCIgfCBcImJ0XCJcbiAgICAgICAgICBjaGlsZHJlbj86ICRBbnlDb21wb25lbnRzIFtdXG4gICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIENvbnRhaW5lciA8JCBleHRlbmRzICRDb250YWluZXIgPSAkQ29udGFpbmVyPiBleHRlbmRzIENvbXBvbmVudCA8JD5cbntcbiAgICAgY2hpbGRyZW4gPSB7fSBhcyBSZWNvcmQgPHN0cmluZywgQ29tcG9uZW50PlxuICAgICBzbG90OiBKU1guRWxlbWVudFxuXG4gICAgIHJlYWRvbmx5IGlzX3ZlcnRpY2FsOiBib29sZWFuXG5cbiAgICAgZGVmYXVsdERhdGEgKCkgOiAkQ29udGFpbmVyXG4gICAgIHtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgY29udGV4dDogXCJjb25jZXB0LXVpXCIsXG4gICAgICAgICAgICAgICB0eXBlICAgICA6IFwiY29tcG9uZW50XCIsXG4gICAgICAgICAgICAgICBpZCAgICAgICA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgIGRpcmVjdGlvbjogXCJsclwiLFxuICAgICAgICAgIH1cbiAgICAgfVxuXG4gICAgIGNvbnN0cnVjdG9yICggZGF0YTogJCApXG4gICAgIHtcbiAgICAgICAgICBzdXBlciAoIGRhdGEgKVxuXG4gICAgICAgICAgZGF0YSA9IHRoaXMuZGF0YVxuICAgICAgICAgIGNvbnN0IGNoaWxkcmVuID0gZGF0YS5jaGlsZHJlblxuXG4gICAgICAgICAgaWYgKCBjaGlsZHJlbiApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgZm9yICggY29uc3QgY2hpbGQgb2YgY2hpbGRyZW4gKVxuICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBpZiAoICEgaW5TdG9jayAoIGNoaWxkICkgKVxuICAgICAgICAgICAgICAgICAgICAgICAgIG1ha2UgKCBjaGlsZCApXG4gICAgICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdGhpcy5pc192ZXJ0aWNhbCA9IGRhdGEuZGlyZWN0aW9uID09IFwiYnRcIiB8fCBkYXRhLmRpcmVjdGlvbiA9PSBcInRiXCJcbiAgICAgfVxuXG4gICAgIC8qKiBAb3ZlcnJpZGUgKi9cbiAgICAgZ2V0SHRtbCAoKVxuICAgICB7XG4gICAgICAgICAgaWYgKCB0aGlzLmNvbnRhaW5lciAhPSB1bmRlZmluZWQgKVxuICAgICAgICAgICAgICAgcmV0dXJuIFt0aGlzLmNvbnRhaW5lcl1cblxuICAgICAgICAgIGNvbnN0IGVsZW1lbnRzICA9IHN1cGVyLmdldEh0bWwgKClcbiAgICAgICAgICBjb25zdCBjb250YWluZXIgPSB0aGlzLmNvbnRhaW5lclxuICAgICAgICAgIGNvbnN0IGRhdGEgICAgICA9IHRoaXMuZGF0YVxuICAgICAgICAgIGNvbnN0IGNoaWxkcmVuICA9IHRoaXMuY2hpbGRyZW5cbiAgICAgICAgICBjb25zdCB1bmQgPSB1bmRlZmluZWRcblxuICAgICAgICAgIGlmICggdGhpcy5pc192ZXJ0aWNhbCApXG4gICAgICAgICAgICAgICBjb250YWluZXIuY2xhc3NMaXN0LmFkZCAoIFwidmVydGljYWxcIiApXG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgY29udGFpbmVyLmNsYXNzTGlzdC5yZW1vdmUgKCBcInZlcnRpY2FsXCIgKVxuXG4gICAgICAgICAgaWYgKCB0aGlzLnNsb3QgPT0gdW5kZWZpbmVkIClcbiAgICAgICAgICAgICAgIHRoaXMuc2xvdCA9IGNvbnRhaW5lclxuXG4gICAgICAgICAgY29uc3Qgc2xvdCA9IHRoaXMuc2xvdFxuXG4gICAgICAgICAgaWYgKCBkYXRhLmNoaWxkcmVuIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBjb25zdCBuZXdfY2hpbGRyZW4gPSBbXSBhcyBDb21wb25lbnQgW11cblxuICAgICAgICAgICAgICAgZm9yICggY29uc3QgY2hpbGQgb2YgZGF0YS5jaGlsZHJlbiApXG4gICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG8gPSBwaWNrICggY2hpbGQgKVxuICAgICAgICAgICAgICAgICAgICBzbG90LmFwcGVuZCAoIC4uLiBvLmdldEh0bWwgKCkgKVxuICAgICAgICAgICAgICAgICAgICBjaGlsZHJlbiBbby5kYXRhLmlkXSA9IG9cbiAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgLy90aGlzLm9uQ2hpbGRyZW5BZGRlZCAoIG5ld19jaGlsZHJlbiApXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIGVsZW1lbnRzXG4gICAgIH1cblxuICAgICAvL29uQ2hpbGRyZW5BZGRlZCAoIGNvbXBvbmVudHM6IENvbXBvbmVudCBbXSApXG4gICAgIC8ve1xuXG4gICAgIC8vfVxuXG4gICAgIGFwcGVuZCAoIC4uLiBlbGVtZW50czogKHN0cmluZyB8IEVsZW1lbnQgfCBDb21wb25lbnQgfCAkQW55Q29tcG9uZW50cykgW10gKVxuICAgICB7XG5cbiAgICAgICAgICBpZiAoIHRoaXMuY29udGFpbmVyID09IHVuZGVmaW5lZCApXG4gICAgICAgICAgICAgICB0aGlzLmdldEh0bWwgKClcblxuICAgICAgICAgIGNvbnN0IHNsb3QgICAgICA9IHRoaXMuc2xvdFxuICAgICAgICAgIGNvbnN0IGNoaWxkcmVuICA9IHRoaXMuY2hpbGRyZW5cbiAgICAgICAgICBjb25zdCBuZXdfY2hpbGQgPSBbXSBhcyBDb21wb25lbnQgW11cblxuICAgICAgICAgIGZvciAoIHZhciBlIG9mIGVsZW1lbnRzIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBpZiAoIHR5cGVvZiBlID09IFwic3RyaW5nXCIgKVxuICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBlID0gbmV3IFBoYW50b20gKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICBjb250ZXh0OiBcImNvbmNlcHQtdWlcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlICAgOiBcInBoYW50b21cIixcbiAgICAgICAgICAgICAgICAgICAgICAgICBpZCAgOiB1bmRlZmluZWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudDogZVxuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgZWxzZSBpZiAoIGUgaW5zdGFuY2VvZiBFbGVtZW50IClcbiAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgVUlfQ09NUE9ORU5UID0gU3ltYm9sLmZvciAoIFwiVUlfQ09NUE9ORU5UXCIgKVxuXG4gICAgICAgICAgICAgICAgICAgIGUgPSBlIFtVSV9DT01QT05FTlRdICE9IHVuZGVmaW5lZFxuICAgICAgICAgICAgICAgICAgICAgICAgID8gZSBbVUlfQ09NUE9ORU5UXVxuICAgICAgICAgICAgICAgICAgICAgICAgIDogbmV3IFBoYW50b20gKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRleHQ6IFwiY29uY2VwdC11aVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZSAgIDogXCJwaGFudG9tXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZCAgOiB1bmRlZmluZWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50OiBlLm91dGVySFRNTFxuICAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICBlbHNlIGlmICggIShlIGluc3RhbmNlb2YgQ29tcG9uZW50KSApXG4gICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGUgPSBpblN0b2NrICggZSApID8gcGljayAoIGUgKSA6IG1ha2UgKCBlIClcbiAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgY2hpbGRyZW4gWyhlIGFzIENvbXBvbmVudCkuZGF0YS5pZF0gPSBlIGFzIENvbXBvbmVudFxuICAgICAgICAgICAgICAgc2xvdC5hcHBlbmQgKCAuLi4gKGUgYXMgQ29tcG9uZW50KS5nZXRIdG1sICgpIClcbiAgICAgICAgICAgICAgIG5ld19jaGlsZC5wdXNoICggZSBhcyBDb21wb25lbnQgKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vaWYgKCBuZXdfY2hpbGQubGVuZ3RoID4gMCApXG4gICAgICAgICAgLy8gICAgIHRoaXMub25DaGlsZHJlbkFkZGVkICggbmV3X2NoaWxkIClcbiAgICAgfVxuXG4gICAgIHJlbW92ZSAoIC4uLiBlbGVtZW50czogQ29tcG9uZW50IFtdIClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHNsb3QgICAgICA9IHRoaXMuc2xvdFxuICAgICAgICAgIGNvbnN0IGNoaWxkcmVuICA9IHRoaXMuY2hpbGRyZW5cblxuICAgICAgICAgIGZvciAoIHZhciBlIG9mIGVsZW1lbnRzIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBpZiAoIGUuZGF0YS5pZCBpbiBjaGlsZHJlbiApXG4gICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGUuY29udGFpbmVyLnJlbW92ZSAoKVxuICAgICAgICAgICAgICAgICAgICBkZWxldGUgY2hpbGRyZW4gW2UuZGF0YS5pZF1cbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgIH1cblxuICAgICBjbGVhciAoKVxuICAgICB7XG4gICAgICAgICAgdGhpcy5jaGlsZHJlbiA9IHt9XG5cbiAgICAgICAgICBpZiAoIHRoaXMuY29udGFpbmVyIClcbiAgICAgICAgICAgICAgIHRoaXMuY29udGFpbmVyLmlubmVySFRNTCA9IFwiXCJcbiAgICAgfVxuXG59XG5cblxuaW50ZXJmYWNlICRQaGFudG9tIGV4dGVuZHMgJENvbXBvbmVudFxue1xuICAgICB0eXBlOiBcInBoYW50b21cIlxuICAgICBjb250ZW50OiBzdHJpbmdcbn1cblxuY2xhc3MgUGhhbnRvbSBleHRlbmRzIENvbXBvbmVudCA8JFBoYW50b20+XG57XG4gICAgIGNvbnRhaW5lcjogSFRNTEVsZW1lbnQgfCBTVkdFbGVtZW50XG5cbiAgICAgLyoqIEBvdmVycmlkZSAqL1xuICAgICBnZXRIdG1sICgpXG4gICAgIHtcbiAgICAgICAgICBpZiAoIHRoaXMuY29udGFpbmVyID09IHVuZGVmaW5lZCApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgdGhpcy5jb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50ICggXCJkaXZcIiApXG4gICAgICAgICAgICAgICB0aGlzLmNvbnRhaW5lci5pbm5lckhUTUwgPSB0aGlzLmRhdGEuY29udGVudFxuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiB0aGlzLmNvbnRhaW5lci5jaGlsZE5vZGVzIGFzIGFueSBhcyBIVE1MRWxlbWVudCBbXVxuICAgICB9XG59XG4iLCJcblxuaW1wb3J0IHsgc2V0LCBkZWZpbmUgfSBmcm9tIFwiLi4vZGIuanNcIlxuaW1wb3J0IHsgeG5vZGUgfSAgICAgICBmcm9tIFwiLi4vQmFzZS94bm9kZS5qc1wiXG5pbXBvcnQgeyBjb21tYW5kIH0gICAgIGZyb20gXCIuLi9jb21tYW5kLmpzXCJcblxuaW1wb3J0IHsgQ29tcG9uZW50IH0gICBmcm9tIFwiLi9jb21wb25lbnRcIlxuXG5kZWNsYXJlIGdsb2JhbFxue1xuICAgICBpbnRlcmZhY2UgJEJ1dHRvbiBleHRlbmRzICRDb21wb25lbnRcbiAgICAge1xuICAgICAgICAgIHR5cGUgICAgICAgOiBcImJ1dHRvblwiXG4gICAgICAgICAgaWNvbiAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHRleHQ/ICAgICAgOiBzdHJpbmdcbiAgICAgICAgICB0b29sdGlwPyAgIDogSlNYLkVsZW1lbnRcbiAgICAgICAgICBmb250RmFtaWx5Pzogc3RyaW5nLFxuICAgICAgICAgIGNhbGxiYWNrPyAgOiAoKSA9PiBib29sZWFuIHwgdm9pZCxcbiAgICAgICAgICBjb21tYW5kPyAgIDogc3RyaW5nLFxuICAgICAgICAgIGhhbmRsZU9uPyAgOiBcInRvZ2dsZVwiIHwgXCJkcmFnXCIgfCBcIipcIlxuICAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBCdXR0b24gZXh0ZW5kcyBDb21wb25lbnQgPCRCdXR0b24+XG57XG4gICAgIC8qKiBAb3ZlcnJpZGUgKi9cbiAgICAgZ2V0SHRtbCAoKVxuICAgICB7XG4gICAgICAgICAgaWYgKCB0aGlzLmNvbnRhaW5lciA9PSB1bmRlZmluZWQgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNvbnN0IGRhdGEgPSB0aGlzLmRhdGFcblxuICAgICAgICAgICAgICAgY29uc3Qgbm9kZSA9IDxkaXYgY2xhc3M9XCJidXR0b25cIj5cbiAgICAgICAgICAgICAgICAgICAgeyBkYXRhLmljb24gPyA8c3BhbiBjbGFzcz1cImljb25cIj57IGRhdGEuaWNvbiB9PC9zcGFuPiA6IG51bGwgfVxuICAgICAgICAgICAgICAgICAgICB7IGRhdGEudGV4dCA/IDxzcGFuIGNsYXNzPVwidGV4dFwiPnsgZGF0YS50ZXh0IH08L3NwYW4+IDogbnVsbCB9XG4gICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgaWYgKCB0aGlzLmRhdGEuY2FsbGJhY2sgIT0gdW5kZWZpbmVkIHx8IHRoaXMuZGF0YS5jb21tYW5kICE9IHVuZGVmaW5lZCApXG4gICAgICAgICAgICAgICAgICAgIG5vZGUuYWRkRXZlbnRMaXN0ZW5lciAoIFwiY2xpY2tcIiwgdGhpcy5vblRvdWNoLmJpbmQgKHRoaXMpIClcblxuICAgICAgICAgICAgICAgdGhpcy5jb250YWluZXIgPSBub2RlXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIFsgdGhpcy5jb250YWluZXIgXSBhcyBIVE1MRWxlbWVudCBbXVxuICAgICB9XG5cbiAgICAgb25Ub3VjaCAoKVxuICAgICB7XG4gICAgICAgICAgaWYgKCB0aGlzLmRhdGEuY2FsbGJhY2sgJiYgdGhpcy5kYXRhLmNhbGxiYWNrICgpICE9PSB0cnVlIClcbiAgICAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgICAgaWYgKCB0aGlzLmRhdGEuY29tbWFuZCApXG4gICAgICAgICAgICAgICAvL0NvbW1hbmRzLmN1cnJlbnQucnVuICggdGhpcy5kYXRhLmNvbW1hbmQgKVxuICAgICAgICAgICAgICAgY29tbWFuZCAoIHRoaXMuZGF0YS5jb21tYW5kICkucnVuICgpXG4gICAgIH1cblxuICAgICBwcm90ZWN0ZWQgb25Ib3ZlciAoKVxuICAgICB7XG5cbiAgICAgfVxufVxuXG5cbmRlZmluZSAoIEJ1dHRvbiwgW0NPTlRFWFRfVUksIFwiYnV0dG9uXCJdIClcblxuc2V0IDwkQnV0dG9uPiAoIFsgXCJidXR0b25cIiBdLCB7XG4gICAgIHR5cGU6IFwiYnV0dG9uXCIgYXMgXCJidXR0b25cIixcbiAgICAgaWQgIDogdW5kZWZpbmVkLFxuICAgICBpY29uOiB1bmRlZmluZWQsXG59KVxuIiwiXG5pbXBvcnQgeyB4bm9kZSB9IGZyb20gXCIuLi9CYXNlL3hub2RlLmpzXCJcbmltcG9ydCB7IENvbnRhaW5lciB9IGZyb20gXCIuL2NvbnRhaW5lci5qc1wiXG5pbXBvcnQgeyBFeHBlbmRhYmxlRWxlbWVudCwgZXhwYW5kYWJsZSB9IGZyb20gXCIuLi9CYXNlL2V4cGVuZGFibGUuanNcIlxuaW1wb3J0IHsgY3NzRmxvYXQgfSBmcm9tIFwiLi4vQmFzZS9kb20uanNcIlxuaW1wb3J0IHsgQ29tcG9uZW50IH0gZnJvbSBcIi4vY29tcG9uZW50LmpzXCJcblxuaW1wb3J0IHsgZGVmaW5lIH0gZnJvbSBcIi4uL2RiLmpzXCJcblxuZGVjbGFyZSBnbG9iYWxcbntcbiAgICAgaW50ZXJmYWNlICRUb29sYmFyIGV4dGVuZHMgJEV4dGVuZHMgPCRMaXN0Vmlldz4gLy8gJENvbnRhaW5lclxuICAgICB7XG4gICAgICAgICAgdHlwZSAgICAgOiBcInRvb2xiYXJcIlxuICAgICAgICAgIHRpdGxlICAgIDogc3RyaW5nXG4gICAgICAgICAgYnV0dG9ucyAgOiAkQnV0dG9uIFtdXG4gICAgIH1cblxuICAgICBpbnRlcmZhY2UgJExpc3RWaWV3IGV4dGVuZHMgJENvbnRhaW5lclxuICAgICB7XG4gICAgICAgICAgdHlwZTogXCJsaXN0LXZpZXdcIlxuICAgICB9XG5cbn1cblxuY2xhc3MgTGlzdFZpZXcgPCQgZXh0ZW5kcyAkRXh0ZW5kcyA8JExpc3RWaWV3Pj4gZXh0ZW5kcyBDb250YWluZXIgPCQ+XG57XG4gICAgIHN3aXBlYWJsZTogRXhwZW5kYWJsZUVsZW1lbnRcblxuICAgICAvKiogQG92ZXJyaWRlICovXG4gICAgIGdldEh0bWwgKClcbiAgICAge1xuICAgICAgICAgIGlmICggdGhpcy5jb250YWluZXIgIT0gdW5kZWZpbmVkIClcbiAgICAgICAgICAgICAgIHJldHVybiBbdGhpcy5jb250YWluZXJdXG5cbiAgICAgICAgICBjb25zdCBzbG90ID0gdGhpcy5zbG90ID0gPGRpdiBjbGFzcz1cImxpc3Qtdmlldy1zbGlkZVwiPjwvZGl2PlxuXG4gICAgICAgICAgc3VwZXIuZ2V0SHRtbCAoKVxuXG4gICAgICAgICAgY29uc3QgY29udGFpbmVyID0gdGhpcy5jb250YWluZXJcblxuICAgICAgICAgIGNvbnRhaW5lci5hcHBlbmQgKCBzbG90IClcbiAgICAgICAgICBjb250YWluZXIuY2xhc3NMaXN0LmFkZCAoIFwibGlzdC12aWV3XCIgKVxuXG4gICAgICAgICAgdGhpcy5zd2lwZWFibGUgPSBleHBhbmRhYmxlICggc2xvdCwge1xuICAgICAgICAgICAgICAgaGFuZGxlcyAgIDogWyBjb250YWluZXIgXSxcbiAgICAgICAgICAgICAgIG1pblNpemUgIDogMCxcbiAgICAgICAgICAgICAgIG1heFNpemUgIDogMCxcbiAgICAgICAgICAgICAgIHByb3BlcnR5ICA6IHRoaXMuaXNfdmVydGljYWwgPyBcInRvcFwiOiBcImxlZnRcIixcbiAgICAgICAgICAgICAgIGRpcmVjdGlvbiA6IHRoaXMuZGF0YS5kaXJlY3Rpb24sXG4gICAgICAgICAgICAgICB1bml0ICAgICA6IFwicHhcIixcbiAgICAgICAgICAgICAgIC8vbW91c2VXaGVlbDogdHJ1ZSxcbiAgICAgICAgICB9KVxuICAgICAgICAgIHRoaXMuc3dpcGVhYmxlLmFjdGl2YXRlICgpXG5cbiAgICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lciAoIFwiRE9NQ29udGVudExvYWRlZFwiLCAoKSA9PlxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHRoaXMuc3dpcGVhYmxlLnVwZGF0ZUNvbmZpZyAoe1xuICAgICAgICAgICAgICAgICAgICBtaW5TaXplOiAtdGhpcy5zbGlkZVNpemUgKCksXG4gICAgICAgICAgICAgICB9KVxuICAgICAgICAgIH0pXG5cbiAgICAgICAgICByZXR1cm4gW3RoaXMuY29udGFpbmVyXVxuICAgICB9XG5cbiAgICAgLy8gb25DaGlsZHJlbkFkZGVkICggZWxlbWVudHM6IENvbXBvbmVudCBbXSApXG4gICAgIC8vIHtcbiAgICAgLy8gICAgICB0aGlzLnN3aXBlYWJsZS51cGRhdGVDb25maWcgKHtcbiAgICAgLy8gICAgICAgICAgIG1pblNpemUgIDogLXRoaXMuc2xpZGVTaXplICgpLFxuICAgICAvLyAgICAgICAgICAgcHJvcGVydHkgOiB0aGlzLmlzX3ZlcnRpY2FsID8gXCJ0b3BcIjogXCJsZWZ0XCIsXG4gICAgIC8vICAgICAgICAgICBkaXJlY3Rpb246IHRoaXMuZGF0YS5kaXJlY3Rpb24sXG4gICAgIC8vICAgICAgfSlcbiAgICAgLy8gfVxuXG4gICAgIHByaXZhdGUgc2xpZGVTaXplICgpXG4gICAgIHtcbiAgICAgICAgICBjb25zdCB7IHNsb3QgfSA9IHRoaXNcblxuICAgICAgICAgIHJldHVybiBjc3NGbG9hdCAoIHNsb3QsIHRoaXMuaXNfdmVydGljYWwgPyBcImhlaWdodFwiIDogXCJ3aWR0aFwiIClcbiAgICAgfVxuXG4gICAgIHN3aXBlICggb2Zmc2V0OiBzdHJpbmd8bnVtYmVyLCB1bml0PzogXCJweFwiIHwgXCIlXCIgKVxuICAgICB7XG4gICAgICAgICAvLyBpZiAoIHR5cGVvZiBvZmZzZXQgPT0gXCJzdHJpbmdcIiApXG4gICAgICAgICAvLyAgICAgIHRoaXMuc3dpcGVhYmxlLnN3aXBlICggb2Zmc2V0IClcbiAgICAgICAgIC8vIGVsc2VcbiAgICAgICAgIC8vICAgICAgdGhpcy5zd2lwZWFibGUuc3dpcGUgKCBvZmZzZXQsIHVuaXQgKVxuICAgICB9XG59XG5cbi8qKlxuICogICBgYGBwdWdcbiAqICAgLnRvb2xiYXJcbiAqICAgICAgICAudG9vbGJhci1iYWNrZ3JvdW5nXG4gKiAgICAgICAgLnRvb2xiYXItc2xpZGVcbiAqICAgICAgICAgICAgIFsuLi5dXG4gKiAgIGBgYFxuICovXG5leHBvcnQgY2xhc3MgVG9vbGJhciBleHRlbmRzIExpc3RWaWV3IDwkVG9vbGJhcj5cbntcbiAgICAgdGFicyAgICAgIDogSlNYLkVsZW1lbnQgW11cbiAgICAgYmFja2dyb3VuZDogSlNYLkVsZW1lbnRcblxuICAgICBkZWZhdWx0Q29uZmlnICgpOiAkVG9vbGJhclxuICAgICB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgIC4uLiBzdXBlci5kZWZhdWx0RGF0YSAoKSxcbiAgICAgICAgICAgICAgIHR5cGUgICAgIDogXCJ0b29sYmFyXCIsXG4gICAgICAgICAgICAgICB0aXRsZSAgICA6IFwiVGl0bGUgLi4uXCIsXG4gICAgICAgICAgICAgICBkaXJlY3Rpb246IFwibHJcIixcbiAgICAgICAgICAgICAgIC8vcmV2ZXJzZSAgOiBmYWxzZSxcbiAgICAgICAgICAgICAgIGJ1dHRvbnM6IFtdXG4gICAgICAgICAgfVxuICAgICB9XG5cbiAgICAgLyoqIEBvdmVycmlkZSAqL1xuICAgICBnZXRIdG1sICgpXG4gICAgIHtcbiAgICAgICAgICBpZiAoIHRoaXMuY29udGFpbmVyICE9IHVuZGVmaW5lZCApXG4gICAgICAgICAgICAgICByZXR1cm4gW3RoaXMuY29udGFpbmVyXVxuXG4gICAgICAgICAgc3VwZXIuZ2V0SHRtbCAoKVxuXG4gICAgICAgICAgaWYgKCB0aGlzLmRhdGEuYnV0dG9ucyApXG4gICAgICAgICAgICAgICB0aGlzLmFwcGVuZCAoIC4uLiB0aGlzLmRhdGEuYnV0dG9ucyApXG5cbiAgICAgICAgICByZXR1cm4gW3RoaXMuY29udGFpbmVyXVxuICAgICB9XG59XG5cbmRlZmluZSAoIFRvb2xiYXIsIFtDT05URVhUX1VJLCBcInRvb2xiYXJcIl0gKVxuXG5cbi8vIHR5cGUgRGlyZWN0aW9uID0gXCJsclwiIHwgXCJybFwiIHwgXCJ0YlwiIHwgXCJidFwiXG4vL1xuLy8gdHlwZSBVbml0cyA9IFwicHhcIiB8IFwiJVwiXG4vL1xuLy8gY29uc3QgdG9GbGV4RGlyZWN0aW9uID0ge1xuLy8gICAgICBscjogXCJyb3dcIiAgICAgICAgICAgIGFzIFwicm93XCIsXG4vLyAgICAgIHJsOiBcInJvdy1yZXZlcnNlXCIgICAgYXMgXCJyb3ctcmV2ZXJzZVwiLFxuLy8gICAgICB0YjogXCJjb2x1bW5cIiAgICAgICAgIGFzIFwiY29sdW1uXCIsXG4vLyAgICAgIGJ0OiBcImNvbHVtbi1yZXZlcnNlXCIgYXMgXCJjb2x1bW4tcmV2ZXJzZVwiLFxuLy8gfVxuLy9cbi8vIGNvbnN0IHRvUmV2ZXJzZSA9IHtcbi8vICAgICAgbHI6IFwicmxcIiBhcyBcInJsXCIsXG4vLyAgICAgIHJsOiBcImxyXCIgYXMgXCJsclwiLFxuLy8gICAgICB0YjogXCJidFwiIGFzIFwiYnRcIixcbi8vICAgICAgYnQ6IFwidGJcIiBhcyBcInRiXCIsXG4vLyB9XG4iLCJcbmltcG9ydCB7IGRyYWdnYWJsZSwgRHJhZ0V2ZW50IH0gZnJvbSBcIi4vZHJhZ2dhYmxlLmpzXCJcblxudHlwZSBEaXJlY3Rpb24gPSBcImxyXCIgfCBcInJsXCIgfCBcImJ0XCIgfCBcInRiXCJcbnR5cGUgRE9NRWxlbWVudCA9IEhUTUxFbGVtZW50IHwgU1ZHRWxlbWVudFxuXG5leHBvcnQgaW50ZXJmYWNlIFNjb2xsYWJsZUNvbmZpZ1xue1xuICAgICBoYW5kbGVzOiBET01FbGVtZW50IFtdXG4gICAgIGRpcmVjdGlvbjogRGlyZWN0aW9uXG59XG5cbmZ1bmN0aW9uIGRlZmF1bHRDb25maWcgKCk6IFNjb2xsYWJsZUNvbmZpZ1xue1xuICAgICByZXR1cm4ge1xuICAgICAgICAgIGhhbmRsZXMgIDogW10sXG4gICAgICAgICAgZGlyZWN0aW9uOiBcInRiXCJcbiAgICAgfVxufVxuXG5mdW5jdGlvbiBzY3JvbGxhYmxlTmF0aXZlICggb3B0aW9uczogU2NvbGxhYmxlQ29uZmlnIClcbntcbiAgICAgZGVzYWN0aXZhdGUgKClcblxuICAgICByZXR1cm4ge1xuICAgICAgICAgIGFjdGl2YXRlLFxuICAgICAgICAgIGRlc2FjdGl2YXRlLFxuICAgICB9XG5cbiAgICAgZnVuY3Rpb24gYWN0aXZhdGUgKClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IGRpciA9IG9wdGlvbnMuZGlyZWN0aW9uID09IFwiYnRcIiB8fCBvcHRpb25zLmRpcmVjdGlvbiA9PSBcInRiXCJcbiAgICAgICAgICAgICAgICAgICAgPyBcInBhbi15XCIgOiBcInBhbi14XCJcblxuICAgICAgICAgIGZvciAoIGNvbnN0IGggb2Ygb3B0aW9ucy5oYW5kbGVzIClcbiAgICAgICAgICAgICAgIGguc3R5bGUudG91Y2hBY3Rpb24gPSBkaXJcbiAgICAgfVxuXG4gICAgIGZ1bmN0aW9uIGRlc2FjdGl2YXRlICgpXG4gICAgIHtcbiAgICAgICAgICBjb25zdCBkaXIgPSBvcHRpb25zLmRpcmVjdGlvbiA9PSBcImJ0XCIgfHwgb3B0aW9ucy5kaXJlY3Rpb24gPT0gXCJ0YlwiXG4gICAgICAgICAgICAgICAgICAgID8gXCJwYW4teVwiIDogXCJwYW4teFwiXG5cbiAgICAgICAgICBmb3IgKCBjb25zdCBoIG9mIG9wdGlvbnMuaGFuZGxlcyApXG4gICAgICAgICAgICAgICBoLnN0eWxlLnRvdWNoQWN0aW9uID0gXCJub25lXCJcbiAgICAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gc2NvbGxhYmxlICggb3B0aW9uczogU2NvbGxhYmxlQ29uZmlnIClcbntcbiAgICAgaWYgKCBcIm9udG91Y2hzdGFydFwiIGluIHdpbmRvdyApXG4gICAgICAgICAgcmV0dXJuIHNjcm9sbGFibGVOYXRpdmUgKCBvcHRpb25zIClcblxuICAgICBjb25zdCBkcmFnID0gZHJhZ2dhYmxlICh7XG4gICAgICAgICAgaGFuZGxlcyAgICAgICA6IG9wdGlvbnMuaGFuZGxlcyxcbiAgICAgICAgICB2ZWxvY2l0eUZhY3RvcjogMTAwLFxuICAgICAgICAgIG9uU3RhcnREcmFnLFxuICAgICAgICAgIG9uRHJhZyAgICAgOiBvcHRpb25zLmRpcmVjdGlvbiA9PSBcImJ0XCIgfHwgb3B0aW9ucy5kaXJlY3Rpb24gPT0gXCJ0YlwiXG4gICAgICAgICAgICAgICAgICAgICA/IG9uRHJhZ1ZlcnRpY2FsXG4gICAgICAgICAgICAgICAgICAgICA6IG9uRHJhZ0hvcml6b250YWwsXG4gICAgICAgICAgb25TdG9wRHJhZzogb3B0aW9ucy5kaXJlY3Rpb24gPT0gXCJidFwiIHx8IG9wdGlvbnMuZGlyZWN0aW9uID09IFwidGJcIlxuICAgICAgICAgICAgICAgICAgICA/IG9uU3RvcERyYWdWZXJ0aWNhbFxuICAgICAgICAgICAgICAgICAgICA6IG9uU3RvcERyYWdIb3Jpem9udGFsLFxuICAgICB9KVxuXG4gICAgIHJldHVybiB7XG4gICAgICAgICAgYWN0aXZhdGU6ICgpID0+IHsgZHJhZy5hY3RpdmF0ZSAoKSB9XG4gICAgIH1cblxuICAgICBmdW5jdGlvbiBvblN0YXJ0RHJhZyAoKVxuICAgICB7XG4gICAgICAgICAgZm9yICggY29uc3QgaCBvZiBvcHRpb25zLmhhbmRsZXMgKVxuICAgICAgICAgICAgICAgaC5zdHlsZS5zY3JvbGxCZWhhdmlvciA9IFwidW5zZXRcIlxuICAgICB9XG4gICAgIGZ1bmN0aW9uIG9uRHJhZ1ZlcnRpY2FsICggZXZlbnQ6IERyYWdFdmVudCApXG4gICAgIHtcbiAgICAgICAgICBmb3IgKCBjb25zdCBoIG9mIG9wdGlvbnMuaGFuZGxlcyApXG4gICAgICAgICAgICAgICBoLnNjcm9sbEJ5ICggMCwgZXZlbnQub2Zmc2V0WSApXG4gICAgIH1cbiAgICAgZnVuY3Rpb24gb25EcmFnSG9yaXpvbnRhbCAoIGV2ZW50OiBEcmFnRXZlbnQgKVxuICAgICB7XG4gICAgICAgICAgZm9yICggY29uc3QgaCBvZiBvcHRpb25zLmhhbmRsZXMgKVxuICAgICAgICAgICAgICAgaC5zY3JvbGxCeSAoIGV2ZW50Lm9mZnNldFgsIDAgKVxuICAgICB9XG4gICAgIGZ1bmN0aW9uIG9uU3RvcERyYWdWZXJ0aWNhbCAoIGV2ZW50OiBEcmFnRXZlbnQgKVxuICAgICB7XG4gICAgICAgICAgZm9yICggY29uc3QgaCBvZiBvcHRpb25zLmhhbmRsZXMgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGguc2Nyb2xsQnkgKCAwLCBldmVudC5vZmZzZXRZIClcbiAgICAgICAgICAgICAgIC8vaC5zdHlsZS5zY3JvbGxCZWhhdmlvciA9IFwic21vb3RoXCJcbiAgICAgICAgICAgICAgIC8vaC5zY3JvbGxCeSAoIDAsIGV2ZW50Lm9mZnNldFkgKyBldmVudC52ZWxvY2l0eVkgKVxuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICB9XG4gICAgIGZ1bmN0aW9uIG9uU3RvcERyYWdIb3Jpem9udGFsICggZXZlbnQ6IERyYWdFdmVudCApXG4gICAgIHtcbiAgICAgICAgICBmb3IgKCBjb25zdCBoIG9mIG9wdGlvbnMuaGFuZGxlcyApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgaC5zY3JvbGxCeSAoIGV2ZW50Lm9mZnNldFgsIDAgKVxuICAgICAgICAgICAgICAgLy9oLnN0eWxlLnNjcm9sbEJlaGF2aW9yID0gXCJzbW9vdGhcIlxuICAgICAgICAgICAgICAgLy9oLnNjcm9sbEJ5ICggZXZlbnQub2Zmc2V0WCArIGV2ZW50LnZlbG9jaXR5WCwgMCApXG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgIH1cbn1cbiIsIlxuaW1wb3J0IHsgQ29udGFpbmVyIH0gZnJvbSBcIi4vY29udGFpbmVyXCJcbmltcG9ydCB7IENvbXBvbmVudCB9IGZyb20gXCIuL2NvbXBvbmVudFwiXG5pbXBvcnQgeyB4bm9kZSB9IGZyb20gXCIuLi9CYXNlL3hub2RlXCJcbmltcG9ydCB7IGV4cGFuZGFibGUsIEV4cGVuZGFibGVFbGVtZW50IH0gZnJvbSBcIi4uL0Jhc2UvZXhwZW5kYWJsZVwiXG5pbXBvcnQgeyBkZWZpbmUgfSBmcm9tIFwiLi4vZGJcIlxuaW1wb3J0IHsgc2NvbGxhYmxlIH0gZnJvbSBcIi4uL0Jhc2Uvc2Nyb2xsYWJsZVwiXG5pbXBvcnQgeyBzd2lwZWFibGUsIFN3aXBlYWJsZUVsZW1lbnQgfSBmcm9tIFwiLi4vQmFzZS9zd2lwZWFibGVcIlxuaW1wb3J0IHsgVG9vbGJhciB9IGZyb20gXCIuL3Rvb2xiYXJcIlxuXG5cblxuZGVjbGFyZSBnbG9iYWxcbntcbiAgICAgaW50ZXJmYWNlICRTaWRlTWVudSBleHRlbmRzICRDb250YWluZXJcbiAgICAge1xuICAgICAgICAgIHR5cGU6IFwic2lkZS1tZW51XCJcbiAgICAgICAgICBoYXNNYWluQnV0dG9uOiBib29sZWFuLFxuICAgICAgICAgIGJ1dHRvbnMgPyA6ICRCdXR0b24gW11cbiAgICAgICAgICBjaGlsZHJlbj8gICAgOiAkUGFuZWwgW11cblxuICAgICAgICAgIC8vIGhlYWRlcj8gICAgICA6ICRBbnlDb21wb25lbnRzXG4gICAgICAgICAgLy8gZm9vdGVyPyAgICAgIDogJEFueUNvbXBvbmVudHNcbiAgICAgfVxuXG4gICAgIGludGVyZmFjZSAkU2xpZGVzaG93IGV4dGVuZHMgJENvbnRhaW5lclxuICAgICB7XG4gICAgICAgICAgdHlwZSAgICAgICAgOiBcInNsaWRlc2hvd1wiXG4gICAgICAgICAgY2hpbGRyZW4gICAgOiAkQW55Q29tcG9uZW50cyBbXVxuICAgICAgICAgIGlzU3dpcGVhYmxlPzogYm9vbGVhblxuICAgICB9XG5cbiAgICAgaW50ZXJmYWNlICRTbGlkZSBleHRlbmRzICRDb250YWluZXJcbiAgICAge1xuICAgICAgICAgIHR5cGU6IFwic2xpZGVcIlxuICAgICB9XG59XG5cbnR5cGUgRGlyZWN0aW9uID0gXCJsclwiIHwgXCJybFwiIHwgXCJ0YlwiIHwgXCJidFwiXG5cblxudmFyIGxlZnRfbWVudSAgID0gbnVsbCBhcyBTaWRlTWVudVxudmFyIHJpZ2h0X21lbnUgID0gbnVsbCBhcyBTaWRlTWVudVxudmFyIHRvcF9tZW51ICAgID0gbnVsbCBhcyBTaWRlTWVudVxudmFyIGJvdHRvbV9tZW51ID0gbnVsbCBhcyBTaWRlTWVudVxuXG5jb25zdCB0b1Bvc2l0aW9uID0ge1xuICAgICBsciA6IFwibGVmdFwiLFxuICAgICBybCA6IFwicmlnaHRcIixcbiAgICAgdGIgOiBcInRvcFwiLFxuICAgICBidCA6IFwiYm90dG9tXCIsXG59XG5cblxuZXhwb3J0IGNsYXNzIFNpZGVNZW51IGV4dGVuZHMgQ29udGFpbmVyIDwkU2lkZU1lbnU+XG57XG4gICAgIHN0YXRpYyBhdExlZnQ6IFNpZGVNZW51XG4gICAgIHN0YXRpYyBhdFJpZ2h0OiBTaWRlTWVudVxuICAgICBzdGF0aWMgYXRUb3A6IFNpZGVNZW51XG4gICAgIHN0YXRpYyBhdEJvdHRvbTogU2lkZU1lbnVcblxuICAgICBtYWluX2J1dHRvbjogSlNYLkVsZW1lbnRcbiAgICAgZXhwYW5kYWJsZSA6IEV4cGVuZGFibGVFbGVtZW50XG4gICAgIHNsaWRlc2hvdyAgOiBTbGlkZXNob3dcbiAgICAgdG9vbGJhciAgICAgOiBDb250YWluZXJcblxuICAgICAvKiogQG92ZXJyaWRlICovXG4gICAgIGdldEh0bWwgKClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IGRhdGEgPSB0aGlzLmRhdGFcbiAgICAgICAgICBjb25zdCBoZWFkZXIgICAgPSA8ZGl2IGNsYXNzPVwic2lkZS1tZW51LWhlYWRlclwiIC8+XG4gICAgICAgICAgY29uc3QgY29udGVudCAgID0gPGRpdiBjbGFzcz1cInNpZGUtbWVudS1jb250ZW50XCIgLz5cbiAgICAgICAgICBjb25zdCBjb250YWluZXIgPSA8ZGl2IGNsYXNzPVwic2lkZS1tZW51IGNsb3NlXCI+XG4gICAgICAgICAgICAgICB7IGhlYWRlciB9XG4gICAgICAgICAgICAgICB7IGNvbnRlbnQgfVxuICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgdGhpcy50b29sYmFyID0gbmV3IFRvb2xiYXIgKHtcbiAgICAgICAgICAgICAgIGNvbnRleHQgIDogQ09OVEVYVF9VSSxcbiAgICAgICAgICAgICAgIHR5cGUgICAgIDogXCJ0b29sYmFyXCIsXG4gICAgICAgICAgICAgICBpZCAgICAgICA6IGRhdGEuaWQgKyBcIi10b29sYmFyXCIsXG4gICAgICAgICAgICAgICBkaXJlY3Rpb246IGRhdGEuZGlyZWN0aW9uID09IFwibHJcIiB8fCBkYXRhLmRpcmVjdGlvbiA9PSBcInJsXCIgPyBcInRiXCIgOiBcImxyXCIsXG4gICAgICAgICAgICAgICB0aXRsZSAgICA6IG51bGwsXG4gICAgICAgICAgICAgICBidXR0b25zICA6IGRhdGEuYnV0dG9ucyxcbiAgICAgICAgICAgICAgIGNoaWxkcmVuIDogbnVsbCxcbiAgICAgICAgICAgICAgIC8vY2hpbGRyZW46IGRhdGEuY2hpbGRyZW4sXG4gICAgICAgICAgfSlcbiAgICAgICAgICBoZWFkZXIuYXBwZW5kICggLi4uIHRoaXMudG9vbGJhci5nZXRIdG1sICgpIClcblxuICAgICAgICAgIC8vIGRhdGEuYWRkaXRpb25hbEJ1dHRvbnNcbiAgICAgICAgICAvLyBpZiAoIGRhdGEuYnV0dG9ucyApXG4gICAgICAgICAgLy8ge1xuICAgICAgICAgIC8vICAgICAgZm9yICggY29uc3QgY2hpbGQgb2YgZGF0YS5idXR0b25zIClcbiAgICAgICAgICAvLyAgICAgICAgICAgdGhpcy5oZWFkZXIuYXBwZW5kICggY2hpbGQgKVxuICAgICAgICAgIC8vIH1cblxuICAgICAgICAgIGlmICggZGF0YS5oYXNNYWluQnV0dG9uIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBjb25zdCBidG4gPSA8c3BhbiBjbGFzcz1cInNpZGUtbWVudS1tYWluLWJ1dHRvblwiPlxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cImljb25cIj7ih5U8L3NwYW4+XG4gICAgICAgICAgICAgICA8L3NwYW4+XG5cbiAgICAgICAgICAgICAgIHRoaXMubWFpbl9idXR0b24gPSBidG5cbiAgICAgICAgICAgICAgIGhlYWRlci5pbnNlcnRBZGphY2VudEVsZW1lbnQgKCBcImFmdGVyYmVnaW5cIiwgYnRuIClcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB0aGlzLnNsaWRlc2hvdyA9IG5ldyBTbGlkZXNob3cgKHtcbiAgICAgICAgICAgICAgIGNvbnRleHQgICAgOiBDT05URVhUX1VJLFxuICAgICAgICAgICAgICAgdHlwZSAgICAgICA6IFwic2xpZGVzaG93XCIsXG4gICAgICAgICAgICAgICBpZCAgICAgICAgIDogZGF0YS5pZCArIFwiLXNsaWRlc2hvd1wiLFxuICAgICAgICAgICAgICAgZGlyZWN0aW9uICA6IGRhdGEuZGlyZWN0aW9uLFxuICAgICAgICAgICAgICAgaXNTd2lwZWFibGU6IGZhbHNlLFxuICAgICAgICAgICAgICAgY2hpbGRyZW4gICA6IFtdXG4gICAgICAgICAgfSlcbiAgICAgICAgICBjb250ZW50LmFwcGVuZCAoIC4uLiB0aGlzLnNsaWRlc2hvdy5nZXRIdG1sICgpICApXG5cbiAgICAgICAgICBpZiAoIGRhdGEuY2hpbGRyZW4gKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGZvciAoIGNvbnN0IGNoaWxkIG9mIGRhdGEuY2hpbGRyZW4gKVxuICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNsaWRlc2hvdy5hcHBlbmQgKCBjaGlsZCApXG4gICAgICAgICAgICAgICAgICAgIGlmICggY2hpbGQuYnV0dG9uIClcbiAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnRvb2xiYXIuYXBwZW5kICggY2hpbGQuYnV0dG9uIClcbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjb250YWluZXIuY2xhc3NMaXN0LmFkZCAoIHRvUG9zaXRpb24gW2RhdGEuZGlyZWN0aW9uXSApXG4gICAgICAgICAgc2NvbGxhYmxlICh7IGhhbmRsZXM6IFtjb250ZW50XSwgZGlyZWN0aW9uOiBcImJ0XCIgfSkuYWN0aXZhdGUgKClcblxuICAgICAgICAgIHRoaXMuY29udGFpbmVyICA9IGNvbnRhaW5lclxuICAgICAgICAgIHRoaXMuZXhwYW5kYWJsZSA9IGV4cGFuZGFibGUgKCB0aGlzLmNvbnRhaW5lciwge1xuICAgICAgICAgICAgICAgZGlyZWN0aW9uICAgIDogZGF0YS5kaXJlY3Rpb24sXG4gICAgICAgICAgICAgICBuZWFyICAgICAgICAgOiA2MCxcbiAgICAgICAgICAgICAgIGhhbmRsZXMgICAgICA6IEFycmF5Lm9mICggdGhpcy5tYWluX2J1dHRvbiApLFxuICAgICAgICAgICAgICAgb25BZnRlck9wZW4gIDogKCkgPT4gY29udGVudC5jbGFzc0xpc3QucmVtb3ZlICggXCJoaWRkZW5cIiApLFxuICAgICAgICAgICAgICAgb25CZWZvcmVDbG9zZTogKCkgPT4gY29udGVudC5jbGFzc0xpc3QuYWRkICggXCJoaWRkZW5cIiApXG4gICAgICAgICAgfSlcbiAgICAgICAgICB0aGlzLmV4cGFuZGFibGUuYWN0aXZhdGUgKClcblxuICAgICAgICAgIHJldHVybiBbIHRoaXMuY29udGFpbmVyIF0gYXMgSFRNTEVsZW1lbnQgW11cbiAgICAgfVxuXG4gICAgIC8qKiBAb3ZlcnJpZGUgKi9cbiAgICAgYXBwZW5kICggLi4uIGVsZW1lbnRzOiAoc3RyaW5nIHwgRWxlbWVudCB8IENvbXBvbmVudCB8ICRBbnlDb21wb25lbnRzKSBbXSApXG4gICAgIHtcbiAgICAgICAgICB0aGlzLnNsaWRlc2hvdy5hcHBlbmQgKCAuLi4gZWxlbWVudHMgKVxuICAgICB9XG5cbiAgICAgLyoqIEBvdmVycmlkZSAqL1xuICAgICByZW1vdmUgKCAuLi4gZWxlbWVudHM6IENvbXBvbmVudCBbXSApXG4gICAgIHtcbiAgICAgICAgICB0aGlzLnNsaWRlc2hvdy5yZW1vdmUgKCAuLi4gZWxlbWVudHMgKVxuICAgICB9XG5cbiAgICAgb3BlbiAoKVxuICAgICB7XG5cbiAgICAgfVxuXG4gICAgIGNsb3NlICgpXG4gICAgIHtcbiAgICAgICAgICB0aGlzLmV4cGFuZGFibGUuY2xvc2UgKClcblxuICAgICAgICAgIHJldHVybiB0aGlzXG4gICAgIH1cbn1cblxuXG5leHBvcnQgY2xhc3MgU2xpZGVzaG93IGV4dGVuZHMgQ29udGFpbmVyIDwkU2xpZGVzaG93Plxue1xuICAgICBjaGlsZHJlbiA9IHt9IGFzIFJlY29yZCA8c3RyaW5nLCBDb250YWluZXI+XG4gICAgIGN1cnJlbnQ6IENvbXBvbmVudFxuICAgICBwcml2YXRlIHN3aXBlYWJsZTogU3dpcGVhYmxlRWxlbWVudFxuXG4gICAgIC8qKiBAb3ZlcnJpZGUgKi9cbiAgICAgZ2V0SHRtbCAoKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgZWxlbWVudHMgPSBzdXBlci5nZXRIdG1sICgpXG5cbiAgICAgICAgICBjb25zdCBkYXRhID0gdGhpcy5kYXRhXG4gICAgICAgICAgY29uc3QgY29udGFpbmVyID0gdGhpcy5jb250YWluZXJcblxuICAgICAgICAgIGlmICggZGF0YS5pc1N3aXBlYWJsZSApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgdGhpcy5zd2lwZWFibGUgPSBzd2lwZWFibGUgKCBjb250YWluZXIsIHtcbiAgICAgICAgICAgICAgICAgICAgaGFuZGxlcyAgIDogWyBjb250YWluZXIgXSxcbiAgICAgICAgICAgICAgICAgICAgbWluVmFsdWUgIDogLTAsXG4gICAgICAgICAgICAgICAgICAgIG1heFZhbHVlICA6IDAsXG4gICAgICAgICAgICAgICAgICAgIHBvcnBlcnR5ICA6IGRhdGEuZGlyZWN0aW9uID09IFwiYnRcIiB8fCBkYXRhLmRpcmVjdGlvbiA9PSBcInRiXCIgPyBcInRvcFwiOiBcImxlZnRcIixcbiAgICAgICAgICAgICAgICAgICAgdW5pdHMgICAgIDogXCJweFwiLFxuICAgICAgICAgICAgICAgICAgICBtb3VzZVdoZWVsOiB0cnVlLFxuICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgIHRoaXMuc3dpcGVhYmxlLmFjdGl2YXRlICgpXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIGVsZW1lbnRzXG4gICAgIH1cbn1cblxuXG5kZWZpbmUgKCBTaWRlTWVudSwgW0NPTlRFWFRfVUksIFwic2lkZS1tZW51XCJdIClcbmRlZmluZSAoIFNsaWRlc2hvdywgW0NPTlRFWFRfVUksIFwic2xpZGVzaG93XCJdIClcbmRlZmluZSAoIENvbnRhaW5lciwgW0NPTlRFWFRfVUksIFwic2xpZGVcIl0gICAgIClcbiIsIlxuaW1wb3J0IHsgeG5vZGUgfSBmcm9tIFwiLi94bm9kZVwiXG5cbmV4cG9ydCB0eXBlIFNoYXBlTmFtZXMgPSBrZXlvZiBTaGFwZURlZmluaXRpb25zXG5cbmV4cG9ydCBpbnRlcmZhY2UgU2hhcGVEZWZpbml0aW9uc1xue1xuICAgICBjaXJjbGUgICA6IE9iamVjdERlZmluaXRpb24sXG4gICAgIHRyaWFuZ2xlIDogT2JqZWN0RGVmaW5pdGlvbixcbiAgICAgc3F1YXJlICAgOiBPYmplY3REZWZpbml0aW9uLFxuICAgICBwYW50YWdvbiA6IE9iamVjdERlZmluaXRpb24sXG4gICAgIGhleGFnb24gIDogT2JqZWN0RGVmaW5pdGlvbixcbiAgICAgdGV4dCAgICAgOiBUZXh0RGVmaW5pdGlvbixcbiAgICAgdGV4dGJveCAgOiBUZXh0RGVmaW5pdGlvbixcbiAgICAgcGF0aCAgICAgOiBQYXRoRGVmaW5pdGlvbixcbn1cblxuZXhwb3J0IGludGVyZmFjZSBPYmplY3REZWZpbml0aW9uXG57XG4gICAgIHNpemU6IG51bWJlcixcbiAgICAgeD8gIDogbnVtYmVyLFxuICAgICB5PyAgOiBudW1iZXJcbn1cblxuZXhwb3J0IGludGVyZmFjZSBUZXh0RGVmaW5pdGlvbiBleHRlbmRzIE9iamVjdERlZmluaXRpb25cbntcbiAgICAgdGV4dDogc3RyaW5nXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUGF0aERlZmluaXRpb24gZXh0ZW5kcyBPYmplY3REZWZpbml0aW9uXG57XG4gICAgIHBhdGg6IHN0cmluZ1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlU3ZnU2hhcGUgPFQgZXh0ZW5kcyBTaGFwZU5hbWVzPiAoXG4gICAgIHR5cGU6IFQsXG4gICAgIGRlZiA6IFNoYXBlRGVmaW5pdGlvbnMgW1RdLFxuKTogUmV0dXJuVHlwZSA8dHlwZW9mIFN2Z0ZhY3RvcnkgW1RdPlxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlU3ZnU2hhcGUgKCB0eXBlOiBTaGFwZU5hbWVzLCBkZWY6IGFueSApXG57XG4gICAgIHN3aXRjaCAoIHR5cGUgKVxuICAgICB7XG4gICAgIGNhc2UgXCJjaXJjbGVcIiAgOiByZXR1cm4gU3ZnRmFjdG9yeS5jaXJjbGUgICAoIGRlZiApXG4gICAgIGNhc2UgXCJ0cmlhbmdsZVwiOiByZXR1cm4gU3ZnRmFjdG9yeS50cmlhbmdsZSAoIGRlZiApXG4gICAgIGNhc2UgXCJzcXVhcmVcIiAgOiByZXR1cm4gU3ZnRmFjdG9yeS5zcXVhcmUgICAoIGRlZiApXG4gICAgIGNhc2UgXCJwYW50YWdvblwiOiByZXR1cm4gU3ZnRmFjdG9yeS5wYW50YWdvbiAoIGRlZiApXG4gICAgIGNhc2UgXCJoZXhhZ29uXCIgOiByZXR1cm4gU3ZnRmFjdG9yeS5oZXhhZ29uICAoIGRlZiApXG4gICAgIGNhc2UgXCJzcXVhcmVcIiAgOiByZXR1cm4gU3ZnRmFjdG9yeS5zcXVhcmUgICAoIGRlZiApXG4gICAgIGNhc2UgXCJ0ZXh0XCIgICAgOiByZXR1cm4gU3ZnRmFjdG9yeS50ZXh0ICAgICAoIGRlZiApXG4gICAgIGNhc2UgXCJ0ZXh0Ym94XCIgOiByZXR1cm4gU3ZnRmFjdG9yeS50ZXh0Ym94ICAoIGRlZiApXG4gICAgIGNhc2UgXCJwYXRoXCIgICAgOiByZXR1cm4gU3ZnRmFjdG9yeS5wYXRoICAgICAoIGRlZiApXG4gICAgIH1cbn1cblxuY2xhc3MgU3ZnRmFjdG9yeVxue1xuICAgICAvLyBUbyBnZXQgdHJpYW5nbGUsIHNxdWFyZSwgW3BhbnRhfGhleGFdZ29uIHBvaW50c1xuICAgICAvL1xuICAgICAvLyB2YXIgYSA9IE1hdGguUEkqMi80XG4gICAgIC8vIGZvciAoIHZhciBpID0gMCA7IGkgIT0gNCA7IGkrKyApXG4gICAgIC8vICAgICBjb25zb2xlLmxvZyAoIGBbICR7IE1hdGguc2luKGEqaSkgfSwgJHsgTWF0aC5jb3MoYSppKSB9IF1gIClcblxuICAgICBzdGF0aWMgY2lyY2xlICggZGVmOiBPYmplY3REZWZpbml0aW9uIClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IG5vZGUgPSA8Y2lyY2xlXG4gICAgICAgICAgICAgICBjeCA9IHsgZGVmLnggfHwgMCB9XG4gICAgICAgICAgICAgICBjeSA9IHsgZGVmLnkgfHwgMCB9XG4gICAgICAgICAgICAgICByICA9IHsgZGVmLnNpemUgLyAyIH1cbiAgICAgICAgICAvPlxuXG4gICAgICAgICAgcmV0dXJuIG5vZGVcbiAgICAgfVxuXG4gICAgIHN0YXRpYyB0cmlhbmdsZSAoIGRlZjogT2JqZWN0RGVmaW5pdGlvbiApXG4gICAgIHtcbiAgICAgfVxuXG5cbiAgICAgc3RhdGljIHNxdWFyZSAoIGRlZjogT2JqZWN0RGVmaW5pdGlvbiApXG4gICAgIHtcbiAgICAgfVxuXG4gICAgIHN0YXRpYyBwYW50YWdvbiAoIGRlZjogT2JqZWN0RGVmaW5pdGlvbiApXG4gICAgIHtcbiAgICAgfVxuXG4gICAgIHN0YXRpYyBoZXhhZ29uICggZGVmOiBPYmplY3REZWZpbml0aW9uIClcbiAgICAge1xuICAgICB9XG5cblxuICAgICBzdGF0aWMgdGV4dCAoIGRlZjogVGV4dERlZmluaXRpb24gKVxuICAgICB7XG4gICAgIH1cblxuICAgICBzdGF0aWMgdGV4dGJveCAoIGRlZjogVGV4dERlZmluaXRpb24gKVxuICAgICB7XG4gICAgIH1cblxuXG4gICAgIHN0YXRpYyBwYXRoICggZGVmOiBQYXRoRGVmaW5pdGlvbiApXG4gICAgIHtcbiAgICAgfVxufVxuIiwiLypcbkpvbGllIGNlIHBldGl0IG1lbnUgY29udGV4dHVlbCxcbm1haXMgbml2ZWF1IHJhcGlkaXTDqSBkJ2FmZmljaGFnZSBjZSBuJ2VzdCBwYXMgYm9uIGR1IHRvdXQgLi4uXG4qL1xuXG5pbXBvcnQgeyBHZW9tZXRyeSB9ICBmcm9tIFwiLi4vLi4vTGliL2luZGV4XCJcbmltcG9ydCB7IENvbXBvbmVudCB9IGZyb20gXCJAdWkvRWxlbWVudHMvY29tcG9uZW50XCJcbmltcG9ydCAqIGFzIFN2ZyAgICAgIGZyb20gXCJAdWkvQmFzZS9zdmdcIlxuaW1wb3J0IHsgeG5vZGUgfSAgICAgZnJvbSBcIkB1aS9CYXNlL3hub2RlXCJcblxuY29uc3QgRyA9IEdlb21ldHJ5XG5cbnR5cGUgUmVuZGVyZXIgPSAoIGRlZmluaXRpb246IFJhZGlhbERlZmluaXRpb24gKSA9PiBTVkdFbGVtZW50IFtdXG50eXBlIFJhZGlhbERlZmluaXRpb24gPSBHZW9tZXRyeS5SYWRpYWxEZWZpbml0aW9uXG50eXBlIFJhZGlhbE9wdGlvbiAgICAgPSBHZW9tZXRyeS5SYWRpYWxPcHRpb25cblxuZGVjbGFyZSBnbG9iYWxcbntcbiAgICAgaW50ZXJmYWNlICRSYWRpYWxNZW51IGV4dGVuZHMgJENvbXBvbmVudFxuICAgICB7XG4gICAgICAgICAgdHlwZTogXCJyYWRpYWwtbWVudVwiLFxuICAgICAgICAgIGJ1dHRvbnM6IFBhcnRpYWwgPCRCdXR0b24+IFtdLFxuICAgICAgICAgIHJvdGF0aW9uOiBudW1iZXJcbiAgICAgfVxufVxuXG5cbmV4cG9ydCBjbGFzcyBSYWRpYWxNZW51IGV4dGVuZHMgQ29tcG9uZW50IDwkUmFkaWFsTWVudT5cbntcbiAgICAgY29udGFpbmVyOiBTVkdTVkdFbGVtZW50XG4gICAgIGRlZmluaXRpb246IFJhZGlhbERlZmluaXRpb25cblxuICAgICByZWFkb25seSByZW5kZXJlcnM6IFJlY29yZCA8c3RyaW5nLCBSZW5kZXJlcj4gPSB7XG4gICAgICAgICAgXCJjaXJjbGVcIjogdGhpcy5yZW5kZXJTdmdDaXJjbGVzLmJpbmQgKHRoaXMpXG4gICAgIH1cblxuICAgICAvKiogQG92ZXJyaWRlICovXG4gICAgIGdldEh0bWwgKClcbiAgICAge1xuICAgICAgICAgIHRoaXMudXBkYXRlICgpXG5cbiAgICAgICAgICByZXR1cm4gW3RoaXMuY29udGFpbmVyIGFzIGFueV1cbiAgICAgfVxuXG4gICAgIGFkZCAoIC4uLiBidXR0b25zOiAkQnV0dG9uIFtdIClcbiAgICAge1xuICAgICAgICAgIHRoaXMuZGF0YS5idXR0b25zLnB1c2ggKCAuLi4gYnV0dG9ucyBhcyBhbnkgKVxuXG4gICAgICAgICAgdGhpcy51cGRhdGUgKClcbiAgICAgfVxuXG4gICAgIHVwZGF0ZSAoKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgeyBkYXRhIH0gPSB0aGlzXG5cbiAgICAgICAgICBjb25zdCBkZWY6IFJhZGlhbE9wdGlvbiA9IHtcbiAgICAgICAgICAgICAgIGNvdW50ICA6IGRhdGEuYnV0dG9ucy5sZW5ndGgsXG4gICAgICAgICAgICAgICByICAgICAgOiA3NSxcbiAgICAgICAgICAgICAgIHBhZGRpbmc6IDYsXG4gICAgICAgICAgICAgICByb3RhdGlvbjogZGF0YS5yb3RhdGlvbiB8fCAwXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdGhpcy5kZWZpbml0aW9uID0gRy5nZXRSYWRpYWxEaXN0cmlidXRpb24gKCBkZWYgKVxuICAgICAgICAgIHRoaXMuY29udGFpbmVyICA9IHRoaXMudG9TdmcgKCBcImNpcmNsZVwiIClcbiAgICAgfVxuXG4gICAgIHByaXZhdGUgZW5hYmxlRXZlbnRzICgpXG4gICAgIHtcbiAgICAgICAgICAvL2NvbnN0IHsgb3B0aW9ucyB9ID0gdGhpc1xuICAgICAgICAgIC8vZm9yICggY29uc3QgYnRuIG9mIG9wdGlvbnMuYnV0dG9ucyApXG4gICAgICAgICAgLy8gICAgIGJ0bi5cbiAgICAgfVxuXG4gICAgIHNob3cgKCB4OiBudW1iZXIsIHk6IG51bWJlciApOiB2b2lkXG4gICAgIHtcbiAgICAgICAgICBjb25zdCBuID0gdGhpcy5jb250YWluZXJcbiAgICAgICAgICBjb25zdCBvZmZzZXQgPSB0aGlzLmRlZmluaXRpb24ud2lkdGggLyAyXG5cbiAgICAgICAgICBuLnN0eWxlLmxlZnQgPSAoeCAtIG9mZnNldCkgKyBcInB4XCJcbiAgICAgICAgICBuLnN0eWxlLnRvcCAgPSAoeSAtIG9mZnNldCkgKyBcInB4XCJcbiAgICAgICAgICBuLmNsYXNzTGlzdC5yZW1vdmUgKCBcImNsb3NlXCIgKVxuICAgICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyICggXCJtb3VzZWRvd25cIiwgdGhpcy5oaWRlLmJpbmQgKHRoaXMpLCB0cnVlIClcbiAgICAgfVxuXG4gICAgIGhpZGUgKClcbiAgICAge1xuICAgICAgICAgIHRoaXMuY29udGFpbmVyLmNsYXNzTGlzdC5hZGQgKFwiY2xvc2VcIilcbiAgICAgICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyICggXCJtb3VzZWRvd25cIiwgdGhpcy5oaWRlIClcbiAgICAgfVxuXG4gICAgIHRvU3ZnICggc3R5bGU6IHN0cmluZyApXG4gICAgIHtcbiAgICAgICAgICBjb25zdCB7IGRlZmluaXRpb246IGRlZiwgcmVuZGVyZXJzLCBkYXRhIH0gPSB0aGlzXG5cbiAgICAgICAgICBjb25zdCBzdmcgPVxuICAgICAgICAgICAgICAgPHN2Z1xuICAgICAgICAgICAgICAgICAgICBjbGFzcyAgID1cInJhZGlhbC1tZW51IGNsb3NlXCJcbiAgICAgICAgICAgICAgICAgICAgd2lkdGggICA9eyBkZWYud2lkdGggKyBcInB4XCIgfVxuICAgICAgICAgICAgICAgICAgICBoZWlnaHQgID17IGRlZi5oZWlnaHQgKyBcInB4XCIgfVxuICAgICAgICAgICAgICAgICAgICB2aWV3Qm94ID17IGAwIDAgJHsgZGVmLndpZHRoIH0gJHsgZGVmLmhlaWdodCB9YCB9XG4gICAgICAgICAgICAgICAvPiBhcyBTVkdTVkdFbGVtZW50XG5cbiAgICAgICAgICBjb25zdCBidXR0b25zID0gc3R5bGUgaW4gcmVuZGVyZXJzXG4gICAgICAgICAgICAgICAgICAgICAgICAgPyByZW5kZXJlcnMgW3N0eWxlXSAoIGRlZiApXG4gICAgICAgICAgICAgICAgICAgICAgICAgOiB0aGlzLnJlbmRlclN2Z0NpcmNsZXMgKCBkZWYgKVxuXG4gICAgICAgICAgc3ZnLmFwcGVuZCAoIC4uLiBidXR0b25zIGFzIE5vZGUgW10gKVxuXG4gICAgICAgICAgZm9yICggdmFyIGkgPSAwIDsgaSAhPSBidXR0b25zLmxlbmd0aCA7IGkrKyApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgY29uc3Qgb3B0ID0gZGF0YS5idXR0b25zIFtpXVxuXG4gICAgICAgICAgICAgICBpZiAoIHR5cGVvZiBvcHQuY2FsbGJhY2sgPT0gXCJmdW5jdGlvblwiIClcbiAgICAgICAgICAgICAgICAgICAgYnV0dG9ucyBbaV0uYWRkRXZlbnRMaXN0ZW5lciAoIFwibW91c2Vkb3duXCIsICgpID0+IG9wdC5jYWxsYmFjayAoKSApXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIHN2Z1xuICAgICB9XG5cbiAgICAgcmVuZGVyU3ZnQ2lyY2xlcyAoIGRlZmluaXRpb246IFJhZGlhbERlZmluaXRpb24gKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgcG9pbnRzICA9IGRlZmluaXRpb24ucG9pbnRzXG4gICAgICAgICAgY29uc3QgcGFkZGluZyA9IGRlZmluaXRpb24ucGFkZGluZ1xuICAgICAgICAgIGNvbnN0IGJ1dHR1bnMgPSBbXSBhcyBTVkdFbGVtZW50IFtdXG5cbiAgICAgICAgICBmb3IgKCB2YXIgaSA9IDA7IGkgPCBwb2ludHMubGVuZ3RoOyArK2kgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNvbnN0IGRlZiA9IHBvaW50cyBbaV1cbiAgICAgICAgICAgICAgIGNvbnN0IGJ0biA9IHRoaXMuZGF0YS5idXR0b25zIFtpXVxuXG4gICAgICAgICAgICAgICBjb25zdCBncm91cCA9IDxnIGNsYXNzPVwiYnV0dG9uXCIgLz5cblxuICAgICAgICAgICAgICAgY29uc3QgY2lyY2xlID0gU3ZnLmNyZWF0ZVN2Z1NoYXBlICggXCJjaXJjbGVcIiwge1xuICAgICAgICAgICAgICAgICAgICBzaXplOiBkZWYuY2hvcmQubGVuZ3RoIC0gcGFkZGluZyAqIDIsXG4gICAgICAgICAgICAgICAgICAgIHg6IGRlZi54LFxuICAgICAgICAgICAgICAgICAgICB5OiBkZWYueVxuICAgICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgICAgY29uc3QgdGV4dCA9IDx0ZXh0XG4gICAgICAgICAgICAgICAgICAgIHggPSB7IGRlZi54IH1cbiAgICAgICAgICAgICAgICAgICAgeSA9IHsgZGVmLnkgfVxuICAgICAgICAgICAgICAgICAgICBmb250LXNpemU9XCIzMFwiXG4gICAgICAgICAgICAgICAgICAgIGZpbGw9XCJibGFja1wiXG4gICAgICAgICAgICAgICAgICAgIHN0eWxlPVwidXNlci1zZWxlY3Q6IG5vbmU7IGN1cnNvcjogcG9pbnRlcjsgZG9taW5hbnQtYmFzZWxpbmU6IGNlbnRyYWw7IHRleHQtYW5jaG9yOiBtaWRkbGU7XCJcbiAgICAgICAgICAgICAgIC8+XG5cbiAgICAgICAgICAgICAgIGlmICggYnRuLmZvbnRGYW1pbHkgIT0gdW5kZWZpbmVkIClcbiAgICAgICAgICAgICAgICAgICAgdGV4dC5zZXRBdHRyaWJ1dGUgKCBcImZvbnQtZmFtaWx5XCIsIGJ0bi5mb250RmFtaWx5IClcblxuICAgICAgICAgICAgICAgdGV4dC5pbm5lckhUTUwgPSBidG4uaWNvblxuXG4gICAgICAgICAgICAgICBncm91cC5hcHBlbmQgKCBjaXJjbGUgKVxuICAgICAgICAgICAgICAgZ3JvdXAuYXBwZW5kICggdGV4dCApXG5cbiAgICAgICAgICAgICAgIGJ1dHR1bnMucHVzaCAoIGdyb3VwIGFzIFNWR0VsZW1lbnQgKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiBidXR0dW5zXG4gICAgIH1cbn1cblxuIiwiXG5pbXBvcnQgeyBDb21wb25lbnQgfSBmcm9tIFwiLi9jb21wb25lbnQuanNcIlxuaW1wb3J0IHsgeG5vZGUgfSBmcm9tIFwiLi4vQmFzZS94bm9kZS5qc1wiXG5pbXBvcnQgeyBkZWZpbmUgfSBmcm9tIFwiLi4vZGIuanNcIlxuaW1wb3J0IHsgUGFuZWwgfSBmcm9tIFwiLi4vcGFuZWwuanNcIlxuXG5kZWNsYXJlIGdsb2JhbFxue1xuXG4gICAgIGV4cG9ydCBpbnRlcmZhY2UgJFBlcnNvblZpZXdlciBleHRlbmRzICRQYW5lbFxuICAgICB7XG4gICAgICAgICAgcmVhZG9ubHkgdHlwZTogXCJwZXJzb24tdmlld2VyXCJcbiAgICAgfVxufVxuXG5leHBvcnQgY2xhc3MgUGVyc29uVmlld2VyIGV4dGVuZHMgQ29tcG9uZW50IDwkUGVyc29uVmlld2VyPlxue1xuICAgICBkaXNwbGF5ICggcGVyc29uOiAkUGVyc29uIClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IGNhcmQgPSA8ZGl2IGNsYXNzPVwidzMtY2FyZC00IHBlcnNvbi1jYXJkXCI+XG4gICAgICAgICAgICAgICA8aW1nIHNyYz17IHBlcnNvbi5hdmF0YXIgfSBhbHQ9XCJBdmF0YXJcIi8+XG4gICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwidzMtY29udGFpbmVyXCI+XG4gICAgICAgICAgICAgICAgICAgIDxoND5cbiAgICAgICAgICAgICAgICAgICAgICAgICA8Yj57IHBlcnNvbi5maXJzdE5hbWUgfTwvYj5cbiAgICAgICAgICAgICAgICAgICAgPC9oND5cbiAgICAgICAgICAgICAgICAgICAgPGxhYmVsPlxuICAgICAgICAgICAgICAgICAgICAgICAgIDxiPnsgcGVyc29uLmlzQ2FwdGFpbiA/IFwiRXhwZXJ0XCIgOiBudWxsIH08L2I+XG4gICAgICAgICAgICAgICAgICAgIDwvbGFiZWw+XG4gICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cblxuXG4gICAgICAgICAgdGhpcy5jb250YWluZXIuaW5uZXJIVE1MID0gXCJcIlxuICAgICAgICAgIHRoaXMuY29udGFpbmVyLmFwcGVuZCAoIGNhcmQgKVxuICAgICB9XG59XG5cbmRlZmluZSAoIFBlcnNvblZpZXdlciwge1xuICAgICBjb250ZXh0IDogQ09OVEVYVF9VSSxcbiAgICAgdHlwZSAgICA6IFwicGVyc29uLXZpZXdlclwiLFxuICAgICBpZCAgICAgIDogdW5kZWZpbmVkLFxuICAgICBwb3NpdGlvbjogXCJsZWZ0XCIsXG4gICAgIGJ1dHRvbiAgOiBudWxsXG59KVxuIiwiXG5pbXBvcnQgXCIuL3R5cGVzLmpzXCJcbmltcG9ydCAqIGFzIHVpIGZyb20gXCIuL2RiLmpzXCJcbmltcG9ydCB7IENvbXBvbmVudCB9IGZyb20gXCIuL0VsZW1lbnRzL2NvbXBvbmVudC5qc1wiXG5pbXBvcnQgeyBTaWRlTWVudSB9IGZyb20gXCIuL0VsZW1lbnRzL3NpZGVNZW51XCJcblxuZGVjbGFyZSBnbG9iYWxcbntcbiAgICAgaW50ZXJmYWNlICRQYW5lbCBleHRlbmRzICRDb21wb25lbnRcbiAgICAge1xuICAgICAgICAgIC8vdHlwZSAgICAgICAgIDogXCJwYW5lbFwiXG4gICAgICAgICAgaGVhZGVyPyAgICAgIDogJEFueUNvbXBvbmVudHMsXG4gICAgICAgICAgY2hpbGRyZW4/ICAgIDogJEFueUNvbXBvbmVudHMgW11cbiAgICAgICAgICBmb290ZXI/ICAgICAgOiAkQW55Q29tcG9uZW50c1xuICAgICAgICAgIHBvc2l0aW9uOiBcImxlZnRcIiB8IFwicmlnaHRcIiB8IFwidG9wXCIgfCBcImJvdHRvbVwiLFxuICAgICAgICAgIGJ1dHRvbjogJEJ1dHRvblxuICAgICB9XG59XG5cblxudmFyIGN1cnJlbnQ6IFBhbmVsID0gbnVsbFxuY29uc3QgZWxlbXMgPSB7fSBhcyBSZWNvcmQgPHN0cmluZywgUGFuZWw+XG5cbmV4cG9ydCBmdW5jdGlvbiBwYW5lbCAoKTogUGFuZWxcbmV4cG9ydCBmdW5jdGlvbiBwYW5lbCAoIGlkOiBzdHJpbmcgKTogUGFuZWxcbmV4cG9ydCBmdW5jdGlvbiBwYW5lbCAoIGRlZmluaXRpb246ICRQYW5lbCApOiBQYW5lbFxuZXhwb3J0IGZ1bmN0aW9uIHBhbmVsICggaWQ6IHN0cmluZywgZGVmaW5pdGlvbjogJFBhbmVsICk6IFBhbmVsXG5leHBvcnQgZnVuY3Rpb24gcGFuZWwgKCBhPzogc3RyaW5nIHwgJFBhbmVsLCBiPzogJFBhbmVsICk6IFBhbmVsXG57XG4gICAgIHN3aXRjaCAoIGFyZ3VtZW50cy5sZW5ndGggKVxuICAgICB7XG4gICAgIGNhc2UgMDogLy8gcGFuZWwgKClcblxuICAgICAgICAgIHJldHVybiBjdXJyZW50O1xuXG4gICAgIGNhc2UgMTogLy8gcGFuZWwgKCBpZCApIHwgcGFuZWwgKCBkZWZpbml0aW9uIClcblxuICAgICAgICAgIGlmICggdHlwZW9mIGEgPT0gXCJzdHJpbmdcIiApXG4gICAgICAgICAgICAgICByZXR1cm4gZWxlbXMgW2FdO1xuXG4gICAgICAgICAgaWYgKCB0eXBlb2YgYSAhPSBcIm9iamVjdFwiIHx8IGEgPT0gbnVsbCB8fCBBcnJheS5pc0FycmF5IChhKSApXG4gICAgICAgICAgICAgICB0aHJvdyBgQmFkIHBhbmVsIGRlZmluaXRpb24gOiAkeyBhIH1gXG5cbiAgICAgICAgICBiID0gYTtcbiAgICAgICAgICBhID0gYi5pZDtcblxuICAgICBjYXNlIDI6IC8vIHBhbmVsICggaWQsIGRlZmluaXRpb24gKVxuXG4gICAgICAgICAgaWYgKCB0eXBlb2YgYSAhPSBcInN0cmluZ1wiIClcbiAgICAgICAgICAgICAgIHRocm93IGBCYWQgaWQgbmFtZSA6ICR7IGEgfWBcblxuICAgICAgICAgIGlmICggYSBpbiBlbGVtcyApXG4gICAgICAgICAgICAgICB0aHJvdyBgUGFuZWwgYWxyZWFkeSBleGlzdHMgOiAkeyBhIH1gXG5cbiAgICAgICAgICBpZiAoIHR5cGVvZiBiICE9IFwib2JqZWN0XCIgfHwgYiA9PSBudWxsIHx8IEFycmF5LmlzQXJyYXkgKGIpIClcbiAgICAgICAgICAgICAgIHRocm93IGBCYWQgcGFuZWwgZGVmaW5pdGlvbiA6ICR7IGIgfWBcblxuICAgICAgICAgIDsoYiBhcyBhbnkpLmlkID0gYVxuICAgICAgICAgIC8vZWxlbXMgW2FdID0gbmV3IFBhbmVsICggYiApXG4gICAgICAgICAgZWxlbXMgW2FdID0gdWkuaW5TdG9jayAoIGIgKSA/IHVpLnBpY2sgKCBiICkgOiB1aS5tYWtlICggYiApXG4gICAgICAgICAgdGhpcy5wbGFjZVRvICggYi5wb3NpdGlvbiApO1xuICAgICAgICAgIGJyZWFrXG5cbiAgICAgZGVmYXVsdDpcbiAgICAgICAgICB0aHJvdyBcIldyb25nIGZ1bmN0aW9uIGNhbGxcIlxuICAgICB9XG5cbn1cblxuXG5cbnR5cGUgRGlyZWN0aW9uID0gXCJsclwiIHwgXCJybFwiIHwgXCJ0YlwiIHwgXCJidFwiXG5cbmNvbnN0IHRvUG9zaXRpb24gPSB7XG4gICAgIGxyIDogXCJsZWZ0XCIsXG4gICAgIHJsIDogXCJyaWdodFwiLFxuICAgICB0YiA6IFwidG9wXCIsXG4gICAgIGJ0IDogXCJib3R0b21cIixcbn1cblxuLy9leHBvcnQgLyphYnN0cmFjdCovIGNsYXNzIFBhbmVsIDxDIGV4dGVuZHMgJFBhbmVsID0gJFBhbmVsPiBleHRlbmRzIENvbXBvbmVudCA8Qz5cbmV4cG9ydCAvKmFic3RyYWN0Ki8gY2xhc3MgUGFuZWwgPEMgZXh0ZW5kcyAkUGFuZWwgPSAkUGFuZWw+IGV4dGVuZHMgQ29tcG9uZW50IDxDPlxue1xuICAgICBwcml2YXRlIG1lbnU6IFNpZGVNZW51XG5cbiAgICAgcGxhY2VUbyAoIHNpZGU6IFwibGVmdFwiIHwgXCJyaWdodFwiIHwgXCJ0b3BcIiB8IFwiYm90dG9tXCIgKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgZGF0YSA9IHRoaXMuZGF0YVxuXG4gICAgICAgICAgaWYgKCBkYXRhLnBvc2l0aW9uID09IHNpZGUgJiYgdGhpcy5tZW51ICE9IG51bGwgKSByZXR1cm5cblxuICAgICAgICAgIGNvbnN0IGNmZyA9IHtcbiAgICAgICAgICAgICAgIGNvbnRleHQgICAgICA6IFwiY29uY2VwdC11aVwiIGFzIFwiY29uY2VwdC11aVwiLFxuICAgICAgICAgICAgICAgdHlwZSAgICAgICAgIDogXCJzaWRlLW1lbnVcIiAgYXMgXCJzaWRlLW1lbnVcIixcbiAgICAgICAgICAgICAgIGhhc01haW5CdXR0b246IHRydWUsXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdmFyIG1lbnU6IFNpZGVNZW51XG5cbiAgICAgICAgICBzd2l0Y2ggKCBzaWRlIClcbiAgICAgICAgICB7XG4gICAgICAgICAgY2FzZSBcImxlZnRcIjpcblxuICAgICAgICAgICAgICAgaWYgKCBTaWRlTWVudS5hdExlZnQgPT0gbnVsbCApIFNpZGVNZW51LmF0TGVmdCA9IG5ldyBTaWRlTWVudSAoe1xuICAgICAgICAgICAgICAgICAgICBpZDogXCJzaWRlLW1lbnUtbGVmdFwiLFxuICAgICAgICAgICAgICAgICAgICBkaXJlY3Rpb246IFwibHJcIixcbiAgICAgICAgICAgICAgICAgICAgLi4uIGNmZyxcbiAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICBtZW51ID0gU2lkZU1lbnUuYXRMZWZ0XG4gICAgICAgICAgICAgICBicmVha1xuXG4gICAgICAgICAgY2FzZSBcInJpZ2h0XCI6XG5cbiAgICAgICAgICAgICAgIGlmICggU2lkZU1lbnUuYXRSaWdodCA9PSBudWxsICkgU2lkZU1lbnUuYXRSaWdodCA9IG5ldyBTaWRlTWVudSAoe1xuICAgICAgICAgICAgICAgICAgICBpZDogXCJzaWRlLW1lbnUtcmlnaHRcIixcbiAgICAgICAgICAgICAgICAgICAgZGlyZWN0aW9uOiBcInJsXCIsXG4gICAgICAgICAgICAgICAgICAgIC4uLiBjZmcsXG4gICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgbWVudSA9IFNpZGVNZW51LmF0UmlnaHRcbiAgICAgICAgICAgICAgIGJyZWFrXG5cbiAgICAgICAgICBjYXNlIFwidG9wXCI6XG5cbiAgICAgICAgICAgICAgIGlmICggU2lkZU1lbnUuYXRUb3AgPT0gbnVsbCApIFNpZGVNZW51LmF0VG9wID0gbmV3IFNpZGVNZW51ICh7XG4gICAgICAgICAgICAgICAgICAgIGlkOiBcInNpZGUtbWVudS10b3BcIixcbiAgICAgICAgICAgICAgICAgICAgZGlyZWN0aW9uOiBcInRiXCIsXG4gICAgICAgICAgICAgICAgICAgIC4uLiBjZmcsXG4gICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgbWVudSA9IFNpZGVNZW51LmF0VG9wXG4gICAgICAgICAgICAgICBicmVha1xuXG4gICAgICAgICAgY2FzZSBcImJvdHRvbVwiOlxuXG4gICAgICAgICAgICAgICBpZiAoIFNpZGVNZW51LmF0Qm90dG9tID09IG51bGwgKSBTaWRlTWVudS5hdEJvdHRvbSA9IG5ldyBTaWRlTWVudSAoe1xuICAgICAgICAgICAgICAgICAgICBpZDogXCJzaWRlLW1lbnUtYm90dG9tXCIsXG4gICAgICAgICAgICAgICAgICAgIGRpcmVjdGlvbjogXCJidFwiLFxuICAgICAgICAgICAgICAgICAgICAuLi4gY2ZnLFxuICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgIG1lbnUgPSBTaWRlTWVudS5hdEJvdHRvbVxuICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoIHRoaXMubWVudSAhPSB1bmRlZmluZWQgKVxuICAgICAgICAgICAgICAgdGhpcy5tZW51LnJlbW92ZSAoIHRoaXMgKVxuXG4gICAgICAgICAgbWVudS5hcHBlbmQgKCB0aGlzIClcbiAgICAgICAgICBkYXRhLnBvc2l0aW9uID0gc2lkZVxuICAgICB9XG5cbiAgICAgb3BlbiAoKVxuICAgICB7XG4gICAgICAgICAgdGhpcy5tZW51LmNsZWFyICgpXG4gICAgICAgICAgdGhpcy5tZW51LmFwcGVuZCAoIHRoaXMgKVxuICAgICAgICAgIHRoaXMubWVudS5vcGVuICgpXG4gICAgIH1cblxuICAgICBjbG9zZSAoKVxuICAgICB7XG4gICAgICAgICAgdGhpcy5tZW51LmNsb3NlICgpXG4gICAgIH1cblxufVxuXG4iLCJcbmltcG9ydCB7IHhub2RlIH0gZnJvbSBcIi4uL0Jhc2UveG5vZGUuanNcIlxuaW1wb3J0IHsgUGFuZWwgfSBmcm9tIFwiLi4vcGFuZWwuanNcIlxuaW1wb3J0IHsgZGVmaW5lIH0gZnJvbSBcIi4uL2RiLmpzXCJcbmltcG9ydCAqIGFzIGRiIGZyb20gXCIuLi8uLi9BcHBsaWNhdGlvbi9kYXRhLmpzXCJcblxuXG5kZWNsYXJlIGdsb2JhbFxue1xuICAgICBpbnRlcmZhY2UgJFNraWxsVmlld2VyIGV4dGVuZHMgJFBhbmVsXG4gICAgIHtcbiAgICAgICAgICB0eXBlOiBcInNraWxsLXZpZXdlclwiXG4gICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFNraWxsVmlld2VyIGV4dGVuZHMgUGFuZWwgPCRTa2lsbFZpZXdlcj5cbntcbiAgICAgZGlzcGxheSAoIHNraWxsOiAkU2tpbGwgKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgdGFyZ2V0ID0gPGRpdiBjbGFzcz1cInBlb3BsZVwiPjwvZGl2PlxuXG4gICAgICAgICAgZm9yICggY29uc3QgaXRlbSBvZiBza2lsbC5pdGVtcyApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgY29uc3QgcGVyc29uID0gZGIubm9kZSA8JFBlcnNvbj4gKCBpdGVtLnR5cGUsIGl0ZW0uaWQgKVxuXG4gICAgICAgICAgICAgICBjb25zdCBjYXJkID0gPGRpdiBjbGFzcz1cInczLWNhcmQtNCBwZXJzb24tY2FyZFwiPlxuICAgICAgICAgICAgICAgICAgICA8aW1nIHNyYz17IHBlcnNvbi5hdmF0YXIgfSBhbHQ9XCJBdmF0YXJcIi8+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJ3My1jb250YWluZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICA8aDQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8Yj57IHBlcnNvbi5maXJzdE5hbWUgfTwvYj5cbiAgICAgICAgICAgICAgICAgICAgICAgICA8L2g0PlxuICAgICAgICAgICAgICAgICAgICAgICAgIDxsYWJlbD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxiPnsgcGVyc29uLmlzQ2FwdGFpbiA/IFwiRXhwZXJ0XCIgOiBudWxsIH08L2I+XG4gICAgICAgICAgICAgICAgICAgICAgICAgPC9sYWJlbD5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgdGFyZ2V0LmFwcGVuZCAoIGNhcmQgKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHRoaXMuY29udGFpbmVyLmNsYXNzTGlzdC5hZGQgKCBcImNvbnRhaW5lclwiIClcbiAgICAgICAgICB0aGlzLmNvbnRhaW5lci5pbm5lckhUTUwgPSBcIlwiXG4gICAgICAgICAgdGhpcy5jb250YWluZXIuYXBwZW5kICggPGgxPnsgc2tpbGwuaWQgfTwvaDE+IClcbiAgICAgICAgICB0aGlzLmNvbnRhaW5lci5hcHBlbmQgKCA8cD57IHNraWxsLmRlc2NyaXB0aW9uIH08L3A+IClcbiAgICAgICAgICB0aGlzLmNvbnRhaW5lci5hcHBlbmQgKCB0YXJnZXQgKVxuXG4gICAgICAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL0xvckRPbmlYL2pzb24tdmlld2VyL2Jsb2IvbWFzdGVyL3NyYy9qc29uLXZpZXdlci5qc1xuICAgICAgICAgIHRoaXMuY29udGFpbmVyLmFwcGVuZCAoIDxwcmU+eyBKU09OLnN0cmluZ2lmeSAoIHNraWxsLCBudWxsLCAzICkgfTwvcHJlPiApXG4gICAgIH1cbn1cblxuZGVmaW5lICggU2tpbGxWaWV3ZXIsIHtcbiAgICAgY29udGV4dCA6IENPTlRFWFRfVUksXG4gICAgIHR5cGUgICAgOiBcInNraWxsLXZpZXdlclwiLFxuICAgICBpZCAgICAgIDogdW5kZWZpbmVkLFxuICAgICBwb3NpdGlvbjogXCJsZWZ0XCIsXG4gICAgIGJ1dHRvbjogbnVsbFxufSlcbiIsIlxuXG5leHBvcnQgeyBkZWZpbmVBc3BlY3QsIGdldEFzcGVjdCwgc2V0QXNwZWN0IH0gZnJvbSBcIi4vZGJcIlxuXG5leHBvcnQgeyBHZW9tZXRyeSB9IGZyb20gXCIuL2dlb21ldHJ5XCJcbmV4cG9ydCB7IFNoYXBlIH0gICAgZnJvbSBcIi4vc2hhcGVcIlxuZXhwb3J0IHsgTm90ZSB9ICAgICBmcm9tIFwiLi9ub3RlXCJcbmV4cG9ydCB7IEJhZGdlIH0gICAgZnJvbSBcIi4vYmFkZ2VcIlxuZXhwb3J0IHsgR3JvdXAgfSAgICBmcm9tIFwiLi9ncm91cFwiXG5cblxuaW1wb3J0IHsgbm9kZSB9IGZyb20gXCIuLi9BcHBsaWNhdGlvbi9kYXRhXCJcbmltcG9ydCB7IGdldEFzcGVjdCwgZGVmaW5lQXNwZWN0LCBzZXRBc3BlY3QgfSBmcm9tIFwiLi9kYlwiXG5pbXBvcnQgeyBTaGFwZSB9ICAgZnJvbSBcIi4vc2hhcGVcIlxuaW1wb3J0IHsgR3JvdXAgfSAgIGZyb20gXCIuL2dyb3VwXCJcbmltcG9ydCB7IEJhZGdlIH0gICBmcm9tIFwiLi9iYWRnZVwiXG5pbXBvcnQgeyBjb21tYW5kIH0gZnJvbSBcIi4uL1VpL2luZGV4XCJcblxuXG5kZWZpbmVBc3BlY3QgKCBTaGFwZSAgICAsIFwicGVyc29uXCIgLyogLCB7IG9uQ3JlYXRlOiAoKSA9PiAuLi4sIG9uVG91Y2g6ICgpID0+IC4uLiB9ICovIClcbmRlZmluZUFzcGVjdCAoIEdyb3VwLCBcInNraWxsXCIgKVxuZGVmaW5lQXNwZWN0ICggQmFkZ2UgICAgLCBcImJhZGdlXCIgKVxuXG5zZXRBc3BlY3QgPCRTaGFwZT4gKHtcbiAgICAgdHlwZSAgIDogXCJwZXJzb25cIixcbiAgICAgaWQgICAgIDogdW5kZWZpbmVkLFxuXG4gICAgIGRhdGEgICA6IHVuZGVmaW5lZCxcblxuICAgICBzaGFwZSAgOiBcImNpcmNsZVwiLFxuXG4gICAgIHg6IDAsXG4gICAgIHk6IDAsXG5cbiAgICAgbWluU2l6ZSAgICA6IDMwLFxuICAgICBzaXplRmFjdG9yOiAxLFxuICAgICBzaXplT2Zmc2V0OiAwLFxuXG4gICAgIGJvcmRlckNvbG9yICAgICA6IFwiIzAwYzBhYVwiLFxuICAgICBib3JkZXJXaWR0aCAgICAgOiA0LFxuICAgICBiYWNrZ3JvdW5kQ29sb3IgOiBcInRyYW5zcGFyZW50XCIsXG4gICAgIGJhY2tncm91bmRJbWFnZSA6IHVuZGVmaW5lZCxcbiAgICAgYmFja2dyb3VuZFJlcGVhdDogZmFsc2UsXG5cbiAgICAgb25DcmVhdGUgICA6ICggcGVyc29uOiAkUGVyc29uLCBhc3BlY3QgKSA9PlxuICAgICB7XG4gICAgICAgICAgYXNwZWN0LnNldEJhY2tncm91bmQgKHtcbiAgICAgICAgICAgICAgIGJhY2tncm91bmRJbWFnZTogcGVyc29uLmF2YXRhcixcbiAgICAgICAgICAgICAgIHNoYXBlOiBwZXJzb24uaXNDYXB0YWluID8gXCJzcXVhcmVcIiA6IFwiY2lyY2xlXCIsXG4gICAgICAgICAgfSBhcyBhbnkpXG4gICAgIH0sXG4gICAgIG9uRGVsZXRlOiB1bmRlZmluZWQsXG4gICAgIG9uVG91Y2g6IHVuZGVmaW5lZCxcbn0pXG5cbnNldEFzcGVjdCA8JFNoYXBlPiAoe1xuICAgICB0eXBlICAgOiBcInNraWxsXCIsXG4gICAgIGlkICAgICA6IHVuZGVmaW5lZCxcblxuICAgICBkYXRhOiB1bmRlZmluZWQsXG5cbiAgICAgc2hhcGU6IFwiY2lyY2xlXCIsXG4gICAgIHg6IDAsXG4gICAgIHk6IDAsXG5cbiAgICAgYm9yZGVyQ29sb3IgICAgIDogXCIjZjFiYzMxXCIsXG4gICAgIGJvcmRlcldpZHRoICAgICA6IDgsXG4gICAgIGJhY2tncm91bmRDb2xvciA6IFwiI0ZGRkZGRlwiLFxuICAgICBiYWNrZ3JvdW5kSW1hZ2UgOiB1bmRlZmluZWQsXG4gICAgIGJhY2tncm91bmRSZXBlYXQ6IGZhbHNlLFxuICAgICBtaW5TaXplICAgICAgICAgOiA1MCxcbiAgICAgc2l6ZU9mZnNldCAgICAgIDogMTAsXG4gICAgIHNpemVGYWN0b3IgICAgICA6IDEsXG5cbiAgICAgb25DcmVhdGUgKCBza2lsbDogJFNraWxsLCBhc3BlY3QgKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgZGF0YSA9IG5vZGUgPCRCYWRnZT4gKCBcImJhZGdlXCIsIHNraWxsLmljb24gKVxuICAgICAgICAgIGNvbnN0IGJhZGdlID0gZ2V0QXNwZWN0IDxCYWRnZT4gKCBkYXRhIClcblxuICAgICAgICAgIGJhZGdlLmF0dGFjaCAoIGFzcGVjdCApXG4gICAgIH0sXG5cbiAgICAgb25Ub3VjaCAoIHNoYXBlIClcbiAgICAge1xuICAgICAgICAgIGNvbW1hbmQgKCBcIm9wZW4taW5mb3MtcGFuZWxcIiApLnJ1biAoKVxuICAgICB9LFxuXG4gICAgIG9uRGVsZXRlOiB1bmRlZmluZWRcbn0pXG5cbnNldEFzcGVjdCA8JFNoYXBlPiAoe1xuICAgICB0eXBlICAgOiBcImJhZGdlXCIsXG4gICAgIGlkICAgICA6IHVuZGVmaW5lZCxcblxuICAgICBkYXRhOiB1bmRlZmluZWQsXG5cbiAgICAgeCAgICAgICAgIDogMCxcbiAgICAgeSAgICAgICAgIDogMCxcbiAgICAgbWluU2l6ZSAgIDogMSxcbiAgICAgc2l6ZUZhY3RvcjogMSxcbiAgICAgc2l6ZU9mZnNldDogMCxcblxuICAgICBzaGFwZSAgICAgICAgICAgOiBcImNpcmNsZVwiLFxuICAgICBib3JkZXJDb2xvciAgICAgOiBcImdyYXlcIixcbiAgICAgYm9yZGVyV2lkdGggICAgIDogMCxcblxuICAgICBiYWNrZ3JvdW5kQ29sb3IgOiBcInRyYW5zcGFyZW50XCIsXG4gICAgIGJhY2tncm91bmRJbWFnZSA6IHVuZGVmaW5lZCxcbiAgICAgYmFja2dyb3VuZFJlcGVhdDogZmFsc2UsXG5cbiAgICAgb25DcmVhdGUgICAgICAgIDogdW5kZWZpbmVkLFxuICAgICBvbkRlbGV0ZSAgICAgICAgOiB1bmRlZmluZWQsXG4gICAgIG9uVG91Y2ggICAgICAgICA6IHVuZGVmaW5lZCxcbn0pXG4iLCJcbmltcG9ydCBcIi4uL0xpYi9pbmRleFwiXG5pbXBvcnQgXCIuLi9EYXRhL2luZGV4XCJcblxuaW1wb3J0IFwiLi4vQXNwZWN0L2luZGV4XCJcbmltcG9ydCB7IGdldEFzcGVjdCB9IGZyb20gXCIuLi9Bc3BlY3QvZGJcIlxuXG5leHBvcnQgKiBmcm9tIFwiLi9kYXRhLmpzXCJcbmltcG9ydCAqIGFzIGRiICBmcm9tIFwiLi9kYXRhXCJcblxuaW1wb3J0ICogYXMgdWkgZnJvbSBcIi4uL1VpL2luZGV4XCJcbmNvbnN0IGNvbW1hbmQgPSB1aS5jb21tYW5kXG5cbi8vICNyZWdpb24gRFJBV0lORyBBUkVBXG5cbmV4cG9ydCBjb25zdCBhcmVhID0gICgoKSA9Plxue1xuICAgICBjb25zdCBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50ICggXCJjYW52YXNcIiApXG5cbiAgICAgY2FudmFzLndpZHRoICA9IGRvY3VtZW50LmJvZHkuY2xpZW50V2lkdGhcbiAgICAgY2FudmFzLmhlaWdodCA9IGRvY3VtZW50LmJvZHkuY2xpZW50SGVpZ2h0XG5cbiAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmQgKCBjYW52YXMgKVxuXG4gICAgIHJldHVybiBuZXcgdWkuQXJlYSAoIGNhbnZhcyApXG59KSAoKVxuXG5leHBvcnQgY29uc3QgY29udGV4dHVhbE1lbnUgPSBuZXcgdWkuUmFkaWFsTWVudSAoe1xuICAgICBjb250ZXh0OiBcImNvbmNlcHQtdWlcIixcbiAgICAgdHlwZTogXCJyYWRpYWwtbWVudVwiLFxuICAgICBpZDogXCJhcmVhLW1lbnVcIixcbiAgICAgYnV0dG9uczogW1xuICAgICAgICAgIC8veyB0eXBlOiBcImJ1dHRvblwiLCBpZDogXCJhZGQtdGhpbmdcIiAsIHRleHQ6IFwiXCIsIGljb246IFwiJiN4ZTNjODtcIiwgZm9udEZhbWlseTogXCJNYXRlcmlhbCBJY29uc1wiLCBjYWxsYmFjazogKCkgPT4geyBydW5Db21tYW5kICggXCJ6b29tLWV4dGVuZHNcIiApIH0gfSwgLy8gZGV0YWlsc1xuICAgICAgICAgIHsgdHlwZTogXCJidXR0b25cIiwgaWQ6IFwiYWRkLXRoaW5nXCIgLCB0ZXh0OiBcIlwiLCBpY29uOiBcIiYjeGUzYzg7XCIsIGZvbnRGYW1pbHk6IFwiTWF0ZXJpYWwgSWNvbnNcIiB9LCAvLyBkZXRhaWxzXG4gICAgICAgICAgeyB0eXBlOiBcImJ1dHRvblwiLCBpZDogXCJhZGQtYnViYmxlXCIsIHRleHQ6IFwiXCIsIGljb246IFwiJiN4ZTZkZDtcIiwgZm9udEZhbWlseTogXCJNYXRlcmlhbCBJY29uc1wiIH0sXG4gICAgICAgICAgeyB0eXBlOiBcImJ1dHRvblwiLCBpZDogXCJhZGQtbm90ZVwiICAsIHRleHQ6IFwiXCIsIGljb246IFwiJiN4ZTI0NDtcIiwgZm9udEZhbWlseTogXCJNYXRlcmlhbCBJY29uc1wiLCBjb21tYW5kOiBcInBhY2stdmlld1wiIH0sIC8vIGZvcm1hdF9xdW90ZVxuICAgICAgICAgIHsgdHlwZTogXCJidXR0b25cIiwgaWQ6IFwiYWRkLXBlb3BsZVwiLCB0ZXh0OiBcIlwiLCBpY29uOiBcIiYjeGU4N2M7XCIsIGZvbnRGYW1pbHk6IFwiTWF0ZXJpYWwgSWNvbnNcIiB9LCAvLyBmYWNlXG4gICAgICAgICAgeyB0eXBlOiBcImJ1dHRvblwiLCBpZDogXCJhZGQtdGFnXCIgICAsIHRleHQ6IFwiXCIsIGljb246IFwiJiN4ZTg2NztcIiwgZm9udEZhbWlseTogXCJNYXRlcmlhbCBJY29uc1wiIH0sIC8vIGJvb2ttYXJrX2JvcmRlclxuICAgICBdIGFzIGFueSxcbiAgICAgcm90YXRpb246IE1hdGguUEkvMixcbn0pXG5kb2N1bWVudC5ib2R5LmFwcGVuZCAoIC4uLiBjb250ZXh0dWFsTWVudS5nZXRIdG1sICgpIClcblxuLy8gQXJlYSBldmVudHNcblxuYXJlYS5vbkRvdWJsZVRvdWNoT2JqZWN0ID0gKCBzaGFwZSApID0+XG57XG4gICAgIGlmICggc2hhcGUuY29uZmlnLm9uVG91Y2ggIT0gdW5kZWZpbmVkIClcbiAgICAgICAgICBzaGFwZS5jb25maWcub25Ub3VjaCAoIHNoYXBlIClcbn1cblxuYXJlYS5vblRvdWNoQXJlYSA9ICggeCwgeSApID0+XG57XG4gICAgIGNvbW1hbmQgKCBcIm9wZW4tY29udGV4dGFsLW1lbnVcIiApLnJ1biAoKVxuICAgICAvL3J1biBDb21tYW5kICggXCJvcGVuLWNvbnRleHRhbC1tZW51XCIsIHgsIHkgKVxufVxuXG5hcmVhLm9uT3Zlck9iamVjdCA9ICggc2hhcGUgKSA9Plxue1xuICAgICBzaGFwZS5ob3ZlciAoIHRydWUgKVxuICAgICBhcmVhLmZjYW52YXMucmVxdWVzdFJlbmRlckFsbCAoKVxufVxuXG5hcmVhLm9uT3V0T2JqZWN0ID0gKCBzaGFwZSApID0+XG57XG4gICAgIHNoYXBlLmhvdmVyICggZmFsc2UgKVxuICAgICBhcmVhLmZjYW52YXMucmVxdWVzdFJlbmRlckFsbCAoKVxufVxuXG4vLyBBcmVhIGNvbW1hbmRzXG5cbmNvbW1hbmQgKCBcIm9wZW4tY29udGV4dGFsLW1lbnVcIiwgKCBlOiBmYWJyaWMuSUV2ZW50ICkgPT5cbntcbiAgICAgY29udGV4dHVhbE1lbnUuc2hvdyAoIGUucG9pbnRlci54LCBlLnBvaW50ZXIueSApXG59IClcblxuY29tbWFuZCAoIFwiY2xvc2UtY29udGV4dGFsLW1lbnVcIiwgKCkgPT5cbntcbiAgICAgY29udGV4dHVhbE1lbnUuaGlkZSAoKVxufSlcblxuY29tbWFuZCAoIFwiYWRkLXNraWxsXCIsICggdGl0bGUgKSA9Plxue1xuICAgICBjb25zb2xlLmxvZyAoIFwiQWRkIHNraWxsXCIgKVxufSlcblxuY29tbWFuZCAoIFwiYWRkLXBlcnNvblwiLCAoIG5hbWUgKSA9Plxue1xuXG59KVxuXG5jb21tYW5kICggXCJ6b29tLWV4dGVuZHNcIiwgKCkgPT5cbntcbiAgICAgYXJlYS56b29tICgpXG59KVxuXG5jb21tYW5kICggXCJ6b29tLXRvXCIsICggc2hhcGUgKSA9Plxue1xuICAgICAvLyBhcmVhLnpvb20gKCBzaGFwZSApXG4gICAgIC8vIGFyZWEuaXNvbGF0ZSAoIHNoYXBlIClcbn0pXG5cbmNvbW1hbmQgKCBcInBhY2stdmlld1wiLCAoKSA9Plxue1xuICAgICBhcmVhLnBhY2sgKClcbn0pXG5cbi8vIHRlc3RcblxuaWYgKCBuYXZpZ2F0b3IubWF4VG91Y2hQb2ludHMgPiAwIClcbntcblxuICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lciAoIFwicG9pbnRlcm1vdmVcIiwgZXZlbnQgPT5cbiAgICAge1xuICAgICAgICAgIC8vY29uc3QgdGFyZ2V0ID0gYXJlYS5mY2FudmFzLmZpbmRUYXJnZXQgKCBldmVudCwgdHJ1ZSApXG4gICAgICAgICAgLy9pZiAoIHRhcmdldCApXG4gICAgICAgICAgLy8gICAgIGNvbnNvbGUubG9nICggdGFyZ2V0IClcbiAgICAgfSlcbn1cbmVsc2VcbntcbiAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIgKCBcIm1vdXNlbW92ZVwiLCBldmVudCA9PlxuICAgICB7XG4gICAgICAgICAgLy9jb25zdCB0YXJnZXQgPSBhcmVhLmZjYW52YXMuZmluZFRhcmdldCAoIGV2ZW50LCB0cnVlIClcbiAgICAgICAgICAvL2lmICggdGFyZ2V0IClcbiAgICAgICAgICAvLyAgICAgY29uc29sZS5sb2cgKCB0YXJnZXQgKVxuICAgICB9KVxufVxuXG4vLyAjZW5kcmVnaW9uXG5cbi8vICNyZWdpb24gTUVOVVxuXG5leHBvcnQgY29uc3QgbWVudSA9IHVpLm1ha2UgPHVpLlNpZGVNZW51LCAkU2lkZU1lbnU+ICh7XG4gICAgIGNvbnRleHQgICAgICA6IENPTlRFWFRfVUksXG4gICAgIHR5cGUgICAgICAgICA6IFwic2lkZS1tZW51XCIsXG4gICAgIGlkICAgICAgICAgICA6IFwibWVudVwiLFxuICAgICBoYXNNYWluQnV0dG9uOiB0cnVlLFxuICAgICBkaXJlY3Rpb24gICAgOiBcImJ0XCJcbn0pXG5kb2N1bWVudC5ib2R5LmFwcGVuZCAoIC4uLiBtZW51LmdldEh0bWwgKCkgKVxuXG4vLyAjZW5kcmVnaW9uXG5cbi8vICNyZWdpb24gUEFORUxcblxudmFyIGRpcmVjdGlvbiA9IFwicmxcIiBhcyBcInJsXCIgfCBcImxyXCIgfCBcInRiXCIgfCBcImJ0XCJcblxuZXhwb3J0IGNvbnN0IHBhbmVsID0gdWkubWFrZSA8dWkuU2lkZU1lbnUsICRTaWRlTWVudT4gKHtcbiAgICAgY29udGV4dCAgICAgIDogQ09OVEVYVF9VSSxcbiAgICAgdHlwZSAgICAgICAgIDogXCJzaWRlLW1lbnVcIixcbiAgICAgaWQgICAgICAgICAgIDogdW5kZWZpbmVkLFxuICAgICBkaXJlY3Rpb24gICAgOiBkaXJlY3Rpb24sXG4gICAgIGhhc01haW5CdXR0b246IHRydWUsXG5cbiAgICAgYnV0dG9uczogW3tcbiAgICAgICAgICBjb250ZXh0IDogQ09OVEVYVF9VSSxcbiAgICAgICAgICB0eXBlICAgIDogXCJidXR0b25cIixcbiAgICAgICAgICBpZCAgICAgIDogXCJjb25zb2xlXCIsXG4gICAgICAgICAgaWNvbiAgICA6IFwi4pqgXCIsXG4gICAgICAgICAgdGV4dCAgICA6IFwiXCIsXG4gICAgICAgICAgaGFuZGxlT246IFwiKlwiLFxuICAgICAgICAgIGNvbW1hbmQgOiBcInBhY2stdmlld1wiXG4gICAgIH1dLFxuXG4gICAgIGNoaWxkcmVuOiBbe1xuICAgICAgICAgIGNvbnRleHQgOiBDT05URVhUX1VJLFxuICAgICAgICAgIHR5cGUgICAgOiBcInNraWxsLXZpZXdlclwiLFxuICAgICAgICAgIGlkICAgICAgOiBcInNsaWRlLXNraWxsXCIsXG4gICAgICAgICAgcG9zaXRpb246IFwibGVmdFwiLFxuICAgICAgICAgIGJ1dHRvbiA6IHtcbiAgICAgICAgICAgICAgIGNvbnRleHQgOiBDT05URVhUX1VJLFxuICAgICAgICAgICAgICAgdHlwZSAgICA6IFwiYnV0dG9uXCIsXG4gICAgICAgICAgICAgICBpZCAgICAgIDogXCJza2lsbHNcIixcbiAgICAgICAgICAgICAgIGljb24gICAgOiBcIlwiLFxuICAgICAgICAgICAgICAgdGV4dCAgICA6IFwiU2tpbGxzXCIsXG4gICAgICAgICAgICAgICBoYW5kbGVPbjogXCIqXCIsXG4gICAgICAgICAgfSxcbiAgICAgfSx7XG4gICAgICAgICAgY29udGV4dCA6IENPTlRFWFRfVUksXG4gICAgICAgICAgdHlwZSAgICA6IFwicGVyc29uLXZpZXdlclwiLFxuICAgICAgICAgIGlkICAgICAgOiBcInNsaWRlLXBlcnNvblwiLFxuICAgICAgICAgIHBvc2l0aW9uOiBcImxlZnRcIixcbiAgICAgICAgICBidXR0b24gOiB7XG4gICAgICAgICAgICAgICBjb250ZXh0IDogQ09OVEVYVF9VSSxcbiAgICAgICAgICAgICAgIHR5cGUgICAgOiBcImJ1dHRvblwiLFxuICAgICAgICAgICAgICAgaWQgICAgICA6IFwicHJvcGVydGllc1wiLFxuICAgICAgICAgICAgICAgaWNvbiAgICA6IFwiXCIsXG4gICAgICAgICAgICAgICB0ZXh0ICAgIDogXCJQcm9wZXJ0aWVzXCIsXG4gICAgICAgICAgICAgICBoYW5kbGVPbjogXCIqXCIsXG4gICAgICAgICAgfSxcbiAgICAgfV1cbn0pXG5cbmRvY3VtZW50LmJvZHkuYXBwZW5kICggLi4uIHBhbmVsLmdldEh0bWwgKCkgKVxuXG4vLyBQYW5uZWxzIGNvbW1hbmRzXG5cbmNvbnN0IHNsaWRlSW5mb3MgPSB1aS5waWNrIDx1aS5Ta2lsbFZpZXdlcj4gKCBcInNraWxsLXZpZXdlclwiLCBcInNsaWRlLXNraWxsXCIgKVxuXG5jb21tYW5kICggXCJvcGVuLXBhbmVsXCIsICggbmFtZSwgLi4uIGNvbnRlbnQgKSA9Plxue1xuICAgICAvLyBpZiAoIG5hbWUgKVxuICAgICAvLyAgICAgIHNsaWRlc2hvdy5zaG93ICggbmFtZSwgLi4uIGNvbnRlbnQgKVxuICAgICAvLyBlbHNlXG4gICAgIC8vICAgICAgcGFuZWwub3BlbiAoKVxufSlcblxuY29tbWFuZCAoIFwib3Blbi1pbmZvcy1wYW5lbFwiLCAoIGUgKSA9Plxue1xuICAgICBjb25zdCBhc3BlY3QgPSBnZXRBc3BlY3QgKCB1aS5BcmVhLmN1cnJlbnRFdmVudC50YXJnZXQgKVxuXG4gICAgIGlmICggYXNwZWN0IClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHNraWxsID0gZGIubm9kZSAoIGFzcGVjdC5jb25maWcudHlwZSwgYXNwZWN0LmNvbmZpZy5pZCApXG4gICAgICAgICAgaWYgKCBza2lsbCApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgc2xpZGVJbmZvcy5kaXNwbGF5ICggc2tpbGwgYXMgYW55IClcbiAgICAgICAgICAgICAgIHBhbmVsLm9wZW4gKClcbiAgICAgICAgICB9XG4gICAgIH1cbn0pXG5cbmNvbW1hbmQgKCBcImNsb3NlLXBhbmVsXCIgLCAoKSA9Plxue1xuICAgICBwYW5lbC5jbG9zZSAoKVxufSlcblxuLy8gI2VuZHJlZ2lvblxuXG4vLyAjcmVnaW9uIEFQUExJQ0FUSU9OXG5cbmNvbW1hbmQgKCBcIm9wZW4tbWVudVwiLCAoKSA9Plxue1xuICAgICBwYW5lbC5jbG9zZSAoKVxuICAgICBjb250ZXh0dWFsTWVudS5oaWRlICgpXG59KVxuY29tbWFuZCAoIFwib3Blbi1wYW5lbFwiLCAoKSA9Plxue1xuICAgICBtZW51LmNsb3NlICgpXG4gICAgIGNvbnRleHR1YWxNZW51LmhpZGUgKClcbn0pXG5cbmV4cG9ydCBmdW5jdGlvbiB3aWR0aCAoKVxue1xuICAgICByZXR1cm4gYXJlYS5mY2FudmFzLmdldFdpZHRoICgpXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBoZWlnaHQgKClcbntcbiAgICAgcmV0dXJuIGFyZWEuZmNhbnZhcy5nZXRIZWlnaHQgKClcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlZnJlc2ggKClcbntcbiAgICAgLy8kYXJlYS5zZXRab29tICgwLjEpXG4gICAgIGFyZWEuZmNhbnZhcy5yZXF1ZXN0UmVuZGVyQWxsICgpXG59XG5cbi8vICNlbmRyZWdpb25cbiIsIi8vLyA8cmVmZXJlbmNlIHR5cGVzPVwiZmFrZXJcIiAvPlxuZGVjbGFyZSBjb25zdCBmYWtlcjogRmFrZXIuRmFrZXJTdGF0aWNcblxuaW1wb3J0ICogYXMgYXBwIGZyb20gXCIuLi9BcHBsaWNhdGlvbi9pbmRleC5qc1wiXG5cbmNvbnN0IHJhbmRvbUludCA9IChtaW46IG51bWJlciwgbWF4OiBudW1iZXIpID0+XG57XG4gICAgIHJldHVybiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAobWF4IC0gbWluICsgMSkpICsgbWluO1xufVxuXG5jb25zdCBhcmVhID0gYXBwLmFyZWFcbmNvbnN0IHZpZXcgPSBhcmVhLmNyZWF0ZVZpZXcgKCBcImNvbXDDqXRhbmNlc1wiIClcbmFyZWEudXNlICggdmlldyApXG5cbi8vIEljaSBvbiBham91dGUgZGVzIHBlcnNvbm5lcyDDoCBs4oCZYXBwbGljYXRpb24uXG5cbmNvbnN0IHBlcnNvbk5hbWVzID0gW11cbmZvciAoIHZhciBpID0gMSA7IGkgPD0gMjAgOyBpKysgKVxue1xuICAgICBhcHAubm9kZSA8JFBlcnNvbj4gKHtcbiAgICAgICAgICBjb250ZXh0ICA6IENPTlRFWFRfREFUQSxcbiAgICAgICAgICB0eXBlICAgICA6IFwicGVyc29uXCIsXG4gICAgICAgICAgaWQgICAgICAgOiBcInVzZXJcIiArIGksXG4gICAgICAgICAgZmlyc3ROYW1lOiBmYWtlci5uYW1lLmZpcnN0TmFtZSAoKSxcbiAgICAgICAgICBsYXN0TmFtZSA6IGZha2VyLm5hbWUubGFzdE5hbWUgKCksXG4gICAgICAgICAgYXZhdGFyICAgOiBgLi9hdmF0YXJzL2YgKCR7aX0pLmpwZ2AsXG4gICAgICAgICAgaXNDYXB0YWluOiByYW5kb21JbnQgKDAsNCkgPT0gMSAvL2kgJSA0ID09IDAsXG4gICAgIH0pXG5cbiAgICAgYXBwLm5vZGUgPCRQZXJzb24+ICh7XG4gICAgICAgICAgY29udGV4dCAgOiBDT05URVhUX0RBVEEsXG4gICAgICAgICAgdHlwZSAgICAgOiBcInBlcnNvblwiLFxuICAgICAgICAgIGlkICAgICAgIDogXCJ1c2VyXCIgKyAoMjAgKyBpKSxcbiAgICAgICAgICBmaXJzdE5hbWU6IGZha2VyLm5hbWUuZmlyc3ROYW1lICgpLFxuICAgICAgICAgIGxhc3ROYW1lIDogZmFrZXIubmFtZS5sYXN0TmFtZSAoKSxcbiAgICAgICAgICBhdmF0YXIgICA6IGAuL2F2YXRhcnMvaCAoJHtpfSkuanBnYCxcbiAgICAgICAgICBpc0NhcHRhaW46IHJhbmRvbUludCAoMCw0KSA9PSAxIC8vICgyMCArIGkpICUgNCA9PSAwLFxuICAgICB9KVxuXG4gICAgIHBlcnNvbk5hbWVzLnB1c2ggKCBcInVzZXJcIiArIGksIFwidXNlclwiICsgKDIwICsgaSkgKVxuXG4gICAgIC8vIGFyZWEuYWRkICggXCJwZXJzb25cIiwgXCJ1c2VyXCIgKyBpIClcbiAgICAgLy8gYXJlYS5hZGQgKCBcInBlcnNvblwiLCBcInVzZXJcIiArIChpICsgMjApIClcbn1cblxuLy8gQmFkZ2VzXG5cbi8vIGh0dHBzOi8vZHJpdmUuZ29vZ2xlLmNvbS9kcml2ZS9mb2xkZXJzLzFLd1dsOUdfQTh2OTFOTFhBcGpaR0hDZm54X21uZk1FNFxuLy8gaHR0cHM6Ly9yZWNvbm5haXRyZS5vcGVucmVjb2duaXRpb24ub3JnL3Jlc3NvdXJjZXMvXG4vLyBodHRwczovL3d3dy5sZXR1ZGlhbnQuZnIvZWR1Y3Byb3MvYWN0dWFsaXRlL2xlcy1vcGVuLWJhZGdlcy11bi1jb21wbGVtZW50LWF1eC1kaXBsb21lcy11bml2ZXJzaXRhaXJlcy5odG1sXG5cbi8vIGh0dHBzOi8vd3d3LmVjaG9zY2llbmNlcy1ub3JtYW5kaWUuZnIvY29tbXVuYXV0ZXMvbGUtZG9tZS9hcnRpY2xlcy9iYWRnZS1kb21lXG5cbmNvbnN0IGJhZGdlUHJlc2V0cyA9IHsgLy8gUGFydGlhbCA8JEJhZGdlPlxuICAgICBkZWZhdWx0ICAgICAgIDogeyBpZDogXCJkZWZhdWx0XCIgICAgICAsIGVtb2ppOiBcIvCfpoFcIiB9LFxuICAgICBoYXQgICAgICAgICAgIDogeyBpZDogXCJoYXRcIiAgICAgICAgICAsIGVtb2ppOiBcIvCfjqlcIiB9LFxuICAgICBzdGFyICAgICAgICAgIDogeyBpZDogXCJzdGFyXCIgICAgICAgICAsIGVtb2ppOiBcIuKtkFwiIH0sXG4gICAgIGNsb3RoZXMgICAgICAgOiB7IGlkOiBcImNsb3RoZXNcIiAgICAgICwgZW1vamk6IFwi8J+RlVwiIH0sXG4gICAgIGVjb2xvZ3kgICAgICAgOiB7IGlkOiBcImVjb2xvZ3lcIiAgICAgICwgZW1vamk6IFwi8J+Sp1wiIH0sXG4gICAgIHByb2dyYW1taW5nICAgOiB7IGlkOiBcInByb2dyYW1taW5nXCIgICwgZW1vamk6IFwi8J+SvlwiIH0sXG4gICAgIGNvbW11bmljYXRpb24gOiB7IGlkOiBcImNvbW11bmljYXRpb25cIiwgZW1vamk6IFwi8J+TolwiIH0sXG4gICAgIGNvbnN0cnVjdGlvbiAgOiB7IGlkOiBcImNvbnN0cnVjdGlvblwiICwgZW1vamk6IFwi8J+UqFwiIH0sXG4gICAgIGJpb2xvZ3kgICAgICAgOiB7IGlkOiBcImJpb2xvZ3lcIiAgICAgICwgZW1vamk6IFwi8J+UrFwiIH0sXG4gICAgIHJvYm90aWMgICAgICAgOiB7IGlkOiBcInJvYm90aWNcIiAgICAgICwgZW1vamk6IFwi8J+kllwiIH0sXG4gICAgIGdhbWUgICAgICAgICAgOiB7IGlkOiBcImdhbWVcIiAgICAgICAgICwgZW1vamk6IFwi8J+koVwiIH0sXG4gICAgIG11c2ljICAgICAgICAgOiB7IGlkOiBcIm11c2ljXCIgICAgICAgICwgZW1vamk6IFwi8J+lgVwiIH0sXG4gICAgIGxpb24gICAgICAgICAgOiB7IGlkOiBcImxpb25cIiAgICAgICAgICwgZW1vamk6IFwi8J+mgVwiIH0sXG4gICAgIHZvbHRhZ2UgICAgICAgOiB7IGlkOiBcInZvbHRhZ2VcIiAgICAgICwgZW1vamk6IFwi4pqhXCIgfSxcbn1cblxuZm9yICggY29uc3QgbmFtZSBpbiBiYWRnZVByZXNldHMgKVxuICAgICBhcHAubm9kZSAoeyBjb250ZXh0OiBDT05URVhUX0RBVEEsIHR5cGU6IFwiYmFkZ2VcIiwgLi4uIGJhZGdlUHJlc2V0cyBbbmFtZV0gfSlcblxuLy8gU2tpbGxzXG5cbmZvciAoIGNvbnN0IG5hbWUgaW4gYmFkZ2VQcmVzZXRzIClcbntcbiAgICAgY29uc3QgcGVvcGxlID0gW10gYXMgJFBlcnNvbiBbXVxuXG4gICAgIGZvciAoIHZhciBqID0gcmFuZG9tSW50ICggMCwgNiApIDsgaiA+IDAgOyBqLS0gKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgbmFtZSA9IHBlcnNvbk5hbWVzLnNwbGljZSAoIHJhbmRvbUludCAoIDEsIHBlcnNvbk5hbWVzLmxlbmd0aCApLCAxICkgWzBdXG5cbiAgICAgICAgICBpZiAoIG5hbWUgKVxuICAgICAgICAgICAgICAgcGVvcGxlLnB1c2ggKCBhcHAubm9kZSA8JFBlcnNvbj4gKCBcInBlcnNvblwiLCBuYW1lICkgKVxuICAgICB9XG5cbiAgICAgYXBwLm5vZGUgPCRTa2lsbD4gKHtcbiAgICAgICAgICBjb250ZXh0OiBDT05URVhUX0RBVEEsXG4gICAgICAgICAgdHlwZSAgIDogXCJza2lsbFwiLFxuICAgICAgICAgIGlkICAgICA6IG5hbWUsXG4gICAgICAgICAgaWNvbiAgIDogbmFtZSxcbiAgICAgICAgICBpdGVtcyAgOiBwZW9wbGVcbiAgICAgfSlcblxufVxuXG4vL1xuXG5mb3IgKCBjb25zdCBuYW1lIGluIGJhZGdlUHJlc2V0cyApXG4gICAgIGFyZWEuYWRkICggXCJza2lsbFwiLCBuYW1lIClcblxuLy8gTm90ZXNcblxuLy8gY29uc3Qgbm90ZSA9ICBuZXcgQi5Ob3RlICh7XG4vLyAgICAgIHRleHQ6IFwiQSBub3RlIC4uLlwiLFxuLy8gfSlcbi8vIGFyZWEuYWRkICggQXNwZWN0LmNyZWF0ZSAoIG5vdGUgKSApXG5cblxuYXJlYS5wYWNrICgpXG5hcmVhLnpvb20gKClcblxuXG4vLyBDbHVzdGVyIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vL1xuLy8gY29uc3QgdDEgPSBuZXcgZmFicmljLlRleHRib3ggKCBcIkVkaXRhYmxlID9cIiwge1xuLy8gICAgICB0b3A6IDUwLFxuLy8gICAgICBsZWZ0OiAzMDAsXG4vLyAgICAgIGZvbnRTaXplOiAzMCxcbi8vICAgICAgc2VsZWN0YWJsZTogdHJ1ZSxcbi8vICAgICAgZWRpdGFibGU6IHRydWUsXG4vLyAgICAgIG9yaWdpblg6IFwiY2VudGVyXCIsXG4vLyAgICAgIG9yaWdpblk6IFwiY2VudGVyXCIsXG4vLyB9KVxuLy8gY29uc3QgcjEgPSBuZXcgZmFicmljLlJlY3QgKHtcbi8vICAgICAgdG9wICAgOiAwLFxuLy8gICAgICBsZWZ0ICA6IDMwMCxcbi8vICAgICAgd2lkdGggOiA1MCxcbi8vICAgICAgaGVpZ2h0OiA1MCxcbi8vICAgICAgZmlsbCAgOiBcImJsdWVcIixcbi8vICAgICAgc2VsZWN0YWJsZTogdHJ1ZSxcbi8vICAgICAgb3JpZ2luWDogXCJjZW50ZXJcIixcbi8vICAgICAgb3JpZ2luWTogXCJjZW50ZXJcIixcbi8vIH0pXG4vLyAkYXBwLl9sYXlvdXQuYXJlYS5hZGQgKHQxKVxuLy8gJGFwcC5fbGF5b3V0LmFyZWEuYWRkIChyMSlcbi8vIHQxW1wiY2x1c3RlclwiXSA9IFsgcjEgXVxuLy8gcjFbXCJjbHVzdGVyXCJdID0gWyB0MSBdXG5cbiJdLCJuYW1lcyI6WyJOb2RlIiwiRmFjdG9yeSIsIkdlb21ldHJ5IiwiZGIiLCJkYi5ub2RlIiwiR2VvbWV0cnkucGFja0VuY2xvc2UiLCJkZWZhdWx0Q29uZmlnIiwiZHJhZ2dhYmxlIiwiVWkuZHJhZ2dhYmxlIiwiQ3NzLmdldFVuaXQiLCJub2RlIiwiYXNwZWN0LmdldEFzcGVjdCIsImZhY3RvcnkiLCJub3JtYWxpemUiLCJTdmcuY3JlYXRlU3ZnU2hhcGUiLCJjb21tYW5kIiwidWkuY29tbWFuZCIsInVpLkFyZWEiLCJ1aS5SYWRpYWxNZW51IiwidWkubWFrZSIsInVpLnBpY2siLCJhcmVhIiwiYXBwLmFyZWEiLCJhcHAu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
