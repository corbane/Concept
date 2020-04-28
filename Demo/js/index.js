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

    // <reference path="../typings.d.ts" />
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

    class Container extends Shape {
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

    class Container$1 extends Component {
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

    class ListView extends Container$1 {
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
    class SideMenu extends Container$1 {
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
    class Slideshow extends Container$1 {
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
    define(Container$1, [CONTEXT_UI, "slide"]);

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
    defineAspect(Container, "skill");
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzIjpbIi4uLy4uL0xpYi9nZW9tZXRyeS9kaXN0cmlidXRlLnRzIiwiLi4vLi4vTGliL2dlb21ldHJ5L2QzLWVuY2xvc2UudHMiLCIuLi8uLi9MaWIvZ2VvbWV0cnkvZDMtcGFjay50cyIsIi4uLy4uL0xpYi9jc3MvdW5pdC50cyIsIi4uLy4uL0RhdGEvbm9kZS50cyIsIi4uLy4uL0RhdGEvZGF0YS10cmVlLnRzIiwiLi4vLi4vRGF0YS9kYi50cyIsIi4uLy4uL0RhdGEvZmFjdG9yeS50cyIsIi4uLy4uL0FwcGxpY2F0aW9uL0FzcGVjdC9nZW9tZXRyeS50cyIsIi4uLy4uL0FwcGxpY2F0aW9uL0FzcGVjdC9FbGVtZW50L3NoYXBlLnRzIiwiLi4vLi4vQXBwbGljYXRpb24vQXNwZWN0L2RiLnRzIiwiLi4vLi4vQXBwbGljYXRpb24vZGF0YS50cyIsIi4uLy4uL0FwcGxpY2F0aW9uL0FzcGVjdC9FbGVtZW50L2JhZGdlLnRzIiwiLi4vLi4vQXBwbGljYXRpb24vQXNwZWN0L0VsZW1lbnQvZ3JvdXAudHMiLCIuLi8uLi9VaS9CYXNlL3hub2RlLnRzIiwiLi4vLi4vVWkvQmFzZS9kcmFnZ2FibGUudHMiLCIuLi8uLi9VaS9CYXNlL2RvbS50cyIsIi4uLy4uL1VpL0Jhc2UvZXhwZW5kYWJsZS50cyIsIi4uLy4uL1VpL0Jhc2Uvc3dpcGVhYmxlLnRzIiwiLi4vLi4vVWkvRWxlbWVudHMvYXJlYS50cyIsIi4uLy4uL1VpL2NvbW1hbmQudHMiLCIuLi8uLi9VaS9FbGVtZW50cy9jb21wb25lbnQudHN4IiwiLi4vLi4vVWkvZGIudHMiLCIuLi8uLi9VaS9FbGVtZW50cy9jb250YWluZXIudHN4IiwiLi4vLi4vVWkvRWxlbWVudHMvYnV0dG9uLnRzeCIsIi4uLy4uL1VpL0VsZW1lbnRzL3Rvb2xiYXIudHN4IiwiLi4vLi4vVWkvQmFzZS9zY3JvbGxhYmxlLnRzIiwiLi4vLi4vVWkvRWxlbWVudHMvc2lkZU1lbnUudHN4IiwiLi4vLi4vVWkvQmFzZS9zdmcudHN4IiwiLi4vLi4vVWkvRWxlbWVudHMvY2lyY2xlbWVudS50c3giLCIuLi8uLi9VaS9FbGVtZW50cy9wYW5lbC1wZXJzb24udHN4IiwiLi4vLi4vVWkvcGFuZWwudHMiLCIuLi8uLi9VaS9FbGVtZW50cy9wYW5lbC1za2lsbC50c3giLCIuLi8uLi9BcHBsaWNhdGlvbi9Bc3BlY3QvaW5kZXgudHMiLCIuLi8uLi9BcHBsaWNhdGlvbi9pbmRleC50cyIsIi4uL2luZGV4LnRzIl0sInNvdXJjZXNDb250ZW50IjpbIlxuXG5leHBvcnQgdHlwZSBSYWRpYWxPcHRpb24gPSB7XG4gICAgciAgICAgICAgOiBudW1iZXIsXG4gICAgY291bnQgICAgOiBudW1iZXIsXG4gICAgcGFkZGluZz8gOiBudW1iZXIsXG4gICAgcm90YXRpb24/OiBudW1iZXIsXG59XG5cbmV4cG9ydCB0eXBlIFJhZGlhbERlZmluaXRpb24gPSBSZXF1aXJlZCA8UmFkaWFsT3B0aW9uPiAmIHtcbiAgICBjeCAgICA6IG51bWJlcixcbiAgICBjeSAgICA6IG51bWJlcixcbiAgICB3aWR0aCA6IG51bWJlcixcbiAgICBoZWlnaHQ6IG51bWJlcixcbiAgICBwb2ludHM6IFBhcnQgW10sXG59XG5cbnR5cGUgUGFydCA9IHtcbiAgICB4IDogbnVtYmVyXG4gICAgeSA6IG51bWJlclxuICAgIGEgOiBudW1iZXJcbiAgICBhMTogbnVtYmVyXG4gICAgYTI6IG51bWJlclxuICAgIGNob3JkPzoge1xuICAgICAgICB4MSAgICA6IG51bWJlclxuICAgICAgICB5MSAgICA6IG51bWJlclxuICAgICAgICB4MiAgICA6IG51bWJlclxuICAgICAgICB5MiAgICA6IG51bWJlclxuICAgICAgICBsZW5ndGg6IG51bWJlclxuICAgIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFJhZGlhbERpc3RyaWJ1dGlvbiAoIG9wdGlvbnM6IFJhZGlhbE9wdGlvbiApXG57XG4gICAgY29uc3QgeyBQSSwgY29zLCBzaW4gfSA9IE1hdGhcblxuICAgIGNvbnN0IHIgICAgICAgID0gb3B0aW9ucy5yICAgICAgICB8fCAzMFxuICAgIGNvbnN0IGNvdW50ICAgID0gb3B0aW9ucy5jb3VudCAgICB8fCAxMFxuICAgIGNvbnN0IHJvdGF0aW9uID0gb3B0aW9ucy5yb3RhdGlvbiB8fCAwXG5cbiAgICBjb25zdCBwb2ludHMgPSBbXSBhcyBQYXJ0IFtdXG5cbiAgICBjb25zdCBhICAgICA9IDIgKiBQSSAvIGNvdW50XG4gICAgY29uc3QgY2hvcmQgPSAyICogciAqIHNpbiAoIGEgKiAwLjUgKVxuICAgIGNvbnN0IHNpemUgID0gciAqIDQgKyBjaG9yZFxuICAgIGNvbnN0IGMgICAgID0gc2l6ZSAvIDJcblxuICAgIGZvciAoIHZhciBpID0gMDsgaSA8IGNvdW50OyArK2kgKVxuICAgIHtcbiAgICAgICAgY29uc3Qgc3RhcnQgID0gYSAqIGkgKyByb3RhdGlvblxuICAgICAgICBjb25zdCBtaWRkbGUgPSBzdGFydCArIGEgKiAwLjVcbiAgICAgICAgY29uc3QgZW5kICAgID0gc3RhcnQgKyBhXG5cbiAgICAgICAgcG9pbnRzLnB1c2ggKHtcbiAgICAgICAgICAgIGExICAgOiBzdGFydCxcbiAgICAgICAgICAgIGEgICAgOiBtaWRkbGUsXG4gICAgICAgICAgICBhMiAgIDogZW5kLFxuICAgICAgICAgICAgeCAgICA6IGNvcyAobWlkZGxlKSAqIHIgKyBjLFxuICAgICAgICAgICAgeSAgICA6IHNpbiAobWlkZGxlKSAqIHIgKyBjLFxuICAgICAgICAgICAgY2hvcmQ6IHtcbiAgICAgICAgICAgICAgICB4MTogY29zIChzdGFydCkgKiByICsgYyxcbiAgICAgICAgICAgICAgICB5MTogc2luIChzdGFydCkgKiByICsgYyxcbiAgICAgICAgICAgICAgICB4MjogY29zIChlbmQpICAgKiByICsgYyxcbiAgICAgICAgICAgICAgICB5Mjogc2luIChlbmQpICAgKiByICsgYyxcbiAgICAgICAgICAgICAgICBsZW5ndGg6IGNob3JkXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgY29uc3QgcmVzdWx0OiBSYWRpYWxEZWZpbml0aW9uID0ge1xuICAgICAgICByLFxuICAgICAgICBjb3VudCxcbiAgICAgICAgcm90YXRpb24sXG4gICAgICAgIHBhZGRpbmc6IG9wdGlvbnMucGFkZGluZyB8fCAwLFxuICAgICAgICBjeCAgICAgOiBjLFxuICAgICAgICBjeSAgICAgOiBjLFxuICAgICAgICB3aWR0aCAgOiBzaXplLFxuICAgICAgICBoZWlnaHQgOiBzaXplLFxuICAgICAgICBwb2ludHNcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0XG59XG4iLCIvLyBodHRwczovL29ic2VydmFibGVocS5jb20vQGQzL2QzLXBhY2tlbmNsb3NlP2NvbGxlY3Rpb249QG9ic2VydmFibGVocS9hbGdvcml0aG1zXG4vLyBodHRwczovL29ic2VydmFibGVocS5jb20vQGQzL2NpcmNsZS1wYWNraW5nXG4vLyBodHRwczovL2dpdGh1Yi5jb20vZDMvZDMtaGllcmFyY2h5L2Jsb2IvbWFzdGVyL3NyYy9wYWNrL2VuY2xvc2UuanNcblxuXG5leHBvcnQgdHlwZSBDaXJjbGUgPSB7XG4gICAgIHg6IG51bWJlcixcbiAgICAgeTogbnVtYmVyLFxuICAgICByOiBudW1iZXJcbn1cblxuY29uc3Qgc2xpY2UgPSBBcnJheS5wcm90b3R5cGUuc2xpY2VcblxuZnVuY3Rpb24gc2h1ZmZsZSA8VD4gKCBhcnJheTogVFtdIClcbntcbiAgICAgdmFyIG0gPSBhcnJheS5sZW5ndGgsXG4gICAgICAgICAgdCxcbiAgICAgICAgICBpOiBudW1iZXJcblxuICAgICB3aGlsZSAoIG0gKVxuICAgICB7XG4gICAgICAgICAgaSA9IE1hdGgucmFuZG9tICgpICogbS0tIHwgMFxuICAgICAgICAgIHQgPSBhcnJheSBbbV1cbiAgICAgICAgICBhcnJheSBbbV0gPSBhcnJheSBbaV1cbiAgICAgICAgICBhcnJheSBbaV0gPSB0XG4gICAgIH1cblxuICAgICByZXR1cm4gYXJyYXlcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGVuY2xvc2UgKCBjaXJjbGVzOiBDaXJjbGVbXSApXG57XG4gICAgIGNpcmNsZXMgPSBzaHVmZmxlICggc2xpY2UuY2FsbCggY2lyY2xlcyApIClcblxuICAgICBjb25zdCBuID0gY2lyY2xlcy5sZW5ndGhcblxuICAgICB2YXIgaSA9IDAsXG4gICAgIEIgPSBbXSxcbiAgICAgcDogQ2lyY2xlLFxuICAgICBlOiBDaXJjbGU7XG5cbiAgICAgd2hpbGUgKCBpIDwgbiApXG4gICAgIHtcbiAgICAgICAgICBwID0gY2lyY2xlcyBbaV1cblxuICAgICAgICAgIGlmICggZSAmJiBlbmNsb3Nlc1dlYWsgKCBlLCBwICkgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGkrK1xuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgQiA9IGV4dGVuZEJhc2lzICggQiwgcCApXG4gICAgICAgICAgICAgICBlID0gZW5jbG9zZUJhc2lzICggQiApXG4gICAgICAgICAgICAgICBpID0gMFxuICAgICAgICAgIH1cbiAgICAgfVxuXG4gICAgIHJldHVybiBlXG59XG5cbmZ1bmN0aW9uIGV4dGVuZEJhc2lzICggQjogQ2lyY2xlW10sIHA6IENpcmNsZSApXG57XG4gICAgIHZhciBpOiBudW1iZXIsXG4gICAgIGo6IG51bWJlclxuXG4gICAgIGlmICggZW5jbG9zZXNXZWFrQWxsICggcCwgQiApIClcbiAgICAgICAgICByZXR1cm4gW3BdXG5cbiAgICAgLy8gSWYgd2UgZ2V0IGhlcmUgdGhlbiBCIG11c3QgaGF2ZSBhdCBsZWFzdCBvbmUgZWxlbWVudC5cbiAgICAgZm9yICggaSA9IDA7IGkgPCBCLmxlbmd0aDsgKytpIClcbiAgICAge1xuICAgICAgICAgIGlmICggZW5jbG9zZXNOb3QgKCBwLCBCIFtpXSApXG4gICAgICAgICAgJiYgZW5jbG9zZXNXZWFrQWxsICggZW5jbG9zZUJhc2lzMiAoIEIgW2ldLCBwICksIEIgKVxuICAgICAgICAgICl7XG4gICAgICAgICAgICAgICByZXR1cm4gWyBCW2ldLCBwIF1cbiAgICAgICAgICB9XG4gICAgIH1cblxuICAgICAvLyBJZiB3ZSBnZXQgaGVyZSB0aGVuIEIgbXVzdCBoYXZlIGF0IGxlYXN0IHR3byBlbGVtZW50cy5cbiAgICAgZm9yICggaSA9IDA7IGkgPCBCLmxlbmd0aCAtIDE7ICsraSApXG4gICAgIHtcbiAgICAgICAgICBmb3IgKCBqID0gaSArIDE7IGogPCBCLmxlbmd0aDsgKytqIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBpZiAoIGVuY2xvc2VzTm90ICAgICggZW5jbG9zZUJhc2lzMiAoIEIgW2ldLCBCIFtqXSAgICApLCBwIClcbiAgICAgICAgICAgICAgICYmIGVuY2xvc2VzTm90ICAgICggZW5jbG9zZUJhc2lzMiAoIEIgW2ldLCBwICAgICAgICApLCBCIFtqXSApXG4gICAgICAgICAgICAgICAmJiBlbmNsb3Nlc05vdCAgICAoIGVuY2xvc2VCYXNpczIgKCBCIFtqXSwgcCAgICAgICAgKSwgQiBbaV0gKVxuICAgICAgICAgICAgICAgJiYgZW5jbG9zZXNXZWFrQWxsKCBlbmNsb3NlQmFzaXMzICggQiBbaV0sIEIgW2pdLCBwICksIEIgKVxuICAgICAgICAgICAgICAgKXtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFsgQlsgaSBdLCBCWyBqIF0sIHAgXTtcbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgIH1cblxuICAgICAvLyBJZiB3ZSBnZXQgaGVyZSB0aGVuIHNvbWV0aGluZyBpcyB2ZXJ5IHdyb25nLlxuICAgICB0aHJvdyBuZXcgRXJyb3I7XG59XG5cbmZ1bmN0aW9uIGVuY2xvc2VzTm90ICggYTogQ2lyY2xlLCBiOiBDaXJjbGUgKVxue1xuICAgICBjb25zdCBkciA9IGEuciAtIGIuclxuICAgICBjb25zdCBkeCA9IGIueCAtIGEueFxuICAgICBjb25zdCBkeSA9IGIueSAtIGEueVxuXG4gICAgIHJldHVybiBkciA8IDAgfHwgZHIgKiBkciA8IGR4ICogZHggKyBkeSAqIGR5O1xufVxuXG5mdW5jdGlvbiBlbmNsb3Nlc1dlYWsgKCBhOiBDaXJjbGUsIGI6IENpcmNsZSApXG57XG4gICAgIHZhciBkciA9IGEuciAtIGIuciArIDFlLTYsXG4gICAgIGR4ID0gYi54IC0gYS54LFxuICAgICBkeSA9IGIueSAtIGEueVxuXG4gICAgIHJldHVybiBkciA+IDAgJiYgZHIgKiBkciA+IGR4ICogZHggKyBkeSAqIGR5XG59XG5cbmZ1bmN0aW9uIGVuY2xvc2VzV2Vha0FsbCAoIGE6IENpcmNsZSwgQjogQ2lyY2xlW10gKVxue1xuICAgICBmb3IgKCB2YXIgaSA9IDA7IGkgPCBCLmxlbmd0aDsgKytpIClcbiAgICAge1xuICAgICAgICAgIGlmICggISBlbmNsb3Nlc1dlYWsgKCBhLCBCW2ldICkgKVxuICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgIH1cbiAgICAgcmV0dXJuIHRydWVcbn1cblxuZnVuY3Rpb24gZW5jbG9zZUJhc2lzICggQjogQ2lyY2xlW10gKVxue1xuICAgICBzd2l0Y2ggKCBCLmxlbmd0aCApXG4gICAgIHtcbiAgICAgICAgICBjYXNlIDE6IHJldHVybiBlbmNsb3NlQmFzaXMxKCBCIFswXSApXG4gICAgICAgICAgY2FzZSAyOiByZXR1cm4gZW5jbG9zZUJhc2lzMiggQiBbMF0sIEIgWzFdIClcbiAgICAgICAgICBjYXNlIDM6IHJldHVybiBlbmNsb3NlQmFzaXMzKCBCIFswXSwgQiBbMV0sIEIgWzJdIClcbiAgICAgfVxufVxuXG5mdW5jdGlvbiBlbmNsb3NlQmFzaXMxICggYTogQ2lyY2xlIClcbntcbiAgICAgcmV0dXJuIHtcbiAgICAgICAgICB4OiBhLngsXG4gICAgICAgICAgeTogYS55LFxuICAgICAgICAgIHI6IGEuclxuICAgICB9O1xufVxuXG5mdW5jdGlvbiBlbmNsb3NlQmFzaXMyICggYTogQ2lyY2xlLCBiOiBDaXJjbGUgKVxue1xuICAgICBjb25zdCB7IHg6IHgxLCB5OiB5MSwgcjogcjEgfSA9IGFcbiAgICAgY29uc3QgeyB4OiB4MiwgeTogeTIsIHI6IHIyIH0gPSBiXG5cbiAgICAgdmFyIHgyMSA9IHgyIC0geDEsXG4gICAgIHkyMSA9IHkyIC0geTEsXG4gICAgIHIyMSA9IHIyIC0gcjEsXG4gICAgIGwgICA9IE1hdGguc3FydCggeDIxICogeDIxICsgeTIxICogeTIxICk7XG5cbiAgICAgcmV0dXJuIHtcbiAgICAgICAgICB4OiAoIHgxICsgeDIgKyB4MjEgLyBsICogcjIxICkgLyAyLFxuICAgICAgICAgIHk6ICggeTEgKyB5MiArIHkyMSAvIGwgKiByMjEgKSAvIDIsXG4gICAgICAgICAgcjogKCBsICsgcjEgKyByMiApIC8gMlxuICAgICB9O1xufVxuXG5mdW5jdGlvbiBlbmNsb3NlQmFzaXMzICggYTogQ2lyY2xlLCBiOiBDaXJjbGUsIGM6IENpcmNsZSApXG57XG4gICAgIGNvbnN0IHsgeDogeDEsIHk6IHkxLCByOiByMSB9ID0gYVxuICAgICBjb25zdCB7IHg6IHgyLCB5OiB5MiwgcjogcjIgfSA9IGJcbiAgICAgY29uc3QgeyB4OiB4MywgeTogeTMsIHI6IHIzIH0gPSBjXG5cbiAgICAgY29uc3QgYTIgPSB4MSAtIHgyLFxuICAgICAgICAgICAgICAgYTMgPSB4MSAtIHgzLFxuICAgICAgICAgICAgICAgYjIgPSB5MSAtIHkyLFxuICAgICAgICAgICAgICAgYjMgPSB5MSAtIHkzLFxuICAgICAgICAgICAgICAgYzIgPSByMiAtIHIxLFxuICAgICAgICAgICAgICAgYzMgPSByMyAtIHIxLFxuXG4gICAgICAgICAgICAgICBkMSA9IHgxICogeDEgKyB5MSAqIHkxIC0gcjEgKiByMSxcbiAgICAgICAgICAgICAgIGQyID0gZDEgLSB4MiAqIHgyIC0geTIgKiB5MiArIHIyICogcjIsXG4gICAgICAgICAgICAgICBkMyA9IGQxIC0geDMgKiB4MyAtIHkzICogeTMgKyByMyAqIHIzLFxuXG4gICAgICAgICAgICAgICBhYiA9IGEzICogYjIgLSBhMiAqIGIzLFxuICAgICAgICAgICAgICAgeGEgPSAoIGIyICogZDMgLSBiMyAqIGQyICkgLyAoIGFiICogMiApIC0geDEsXG4gICAgICAgICAgICAgICB4YiA9ICggYjMgKiBjMiAtIGIyICogYzMgKSAvIGFiLFxuICAgICAgICAgICAgICAgeWEgPSAoIGEzICogZDIgLSBhMiAqIGQzICkgLyAoIGFiICogMiApIC0geTEsXG4gICAgICAgICAgICAgICB5YiA9ICggYTIgKiBjMyAtIGEzICogYzIgKSAvIGFiLFxuXG4gICAgICAgICAgICAgICBBICA9IHhiICogeGIgKyB5YiAqIHliIC0gMSxcbiAgICAgICAgICAgICAgIEIgID0gMiAqICggcjEgKyB4YSAqIHhiICsgeWEgKiB5YiApLFxuICAgICAgICAgICAgICAgQyAgPSB4YSAqIHhhICsgeWEgKiB5YSAtIHIxICogcjEsXG4gICAgICAgICAgICAgICByICA9IC0oIEEgPyAoIEIgKyBNYXRoLnNxcnQoIEIgKiBCIC0gNCAqIEEgKiBDICkgKSAvICggMiAqIEEgKSA6IEMgLyBCIClcblxuICAgICByZXR1cm4ge1xuICAgICAgICAgIHg6IHgxICsgeGEgKyB4YiAqIHIsXG4gICAgICAgICAgeTogeTEgKyB5YSArIHliICogcixcbiAgICAgICAgICByOiByXG4gICAgIH07XG59XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi9kMy1lbmNsb3NlLnRzXCIgLz5cblxuLy8gaHR0cHM6Ly9naXRodWIuY29tL2QzL2QzLWhpZXJhcmNoeS9ibG9iL21hc3Rlci9zcmMvcGFjay9zaWJsaW5ncy5qc1xuXG5pbXBvcnQgeyBlbmNsb3NlLCBDaXJjbGUgfSBmcm9tIFwiLi9kMy1lbmNsb3NlLmpzXCJcblxuZnVuY3Rpb24gcGxhY2UgKCBiOiBDaXJjbGUsIGE6IENpcmNsZSwgYzogQ2lyY2xlIClcbntcbiAgICAgdmFyIGR4ID0gYi54IC0gYS54LFxuICAgICAgICAgIHg6IG51bWJlcixcbiAgICAgICAgICBhMjogbnVtYmVyLFxuICAgICAgICAgIGR5ID0gYi55IC0gYS55LFxuICAgICAgICAgIHkgOiBudW1iZXIsXG4gICAgICAgICAgYjI6IG51bWJlcixcbiAgICAgICAgICBkMiA9IGR4ICogZHggKyBkeSAqIGR5XG5cbiAgICAgaWYgKCBkMiApXG4gICAgIHtcbiAgICAgICAgICBhMiA9IGEuciArIGMuciwgYTIgKj0gYTJcbiAgICAgICAgICBiMiA9IGIuciArIGMuciwgYjIgKj0gYjJcblxuICAgICAgICAgIGlmICggYTIgPiBiMiApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgeCA9ICggZDIgKyBiMiAtIGEyICkgLyAoIDIgKiBkMiApXG4gICAgICAgICAgICAgICB5ID0gTWF0aC5zcXJ0KCBNYXRoLm1heCggMCwgYjIgLyBkMiAtIHggKiB4ICkgKVxuICAgICAgICAgICAgICAgYy54ID0gYi54IC0geCAqIGR4IC0geSAqIGR5XG4gICAgICAgICAgICAgICBjLnkgPSBiLnkgLSB4ICogZHkgKyB5ICogZHhcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHggPSAoIGQyICsgYTIgLSBiMiApIC8gKCAyICogZDIgKVxuICAgICAgICAgICAgICAgeSA9IE1hdGguc3FydCggTWF0aC5tYXgoIDAsIGEyIC8gZDIgLSB4ICogeCApIClcbiAgICAgICAgICAgICAgIGMueCA9IGEueCArIHggKiBkeCAtIHkgKiBkeVxuICAgICAgICAgICAgICAgYy55ID0gYS55ICsgeCAqIGR5ICsgeSAqIGR4XG4gICAgICAgICAgfVxuICAgICB9XG4gICAgIGVsc2VcbiAgICAge1xuICAgICAgICAgIGMueCA9IGEueCArIGMuclxuICAgICAgICAgIGMueSA9IGEueVxuICAgICB9XG59XG5cbmZ1bmN0aW9uIGludGVyc2VjdHMgKCBhOiBDaXJjbGUsIGI6IENpcmNsZSApXG57XG4gICAgIHZhciBkciA9IGEuciArIGIuciAtIDFlLTYsIGR4ID0gYi54IC0gYS54LCBkeSA9IGIueSAtIGEueTtcbiAgICAgcmV0dXJuIGRyID4gMCAmJiBkciAqIGRyID4gZHggKiBkeCArIGR5ICogZHk7XG59XG5cbmZ1bmN0aW9uIHNjb3JlICggbm9kZTogTm9kZSApXG57XG4gICAgIHZhciBhID0gbm9kZS5fLFxuICAgICAgICAgIGIgPSBub2RlLm5leHQuXyxcbiAgICAgICAgICBhYiA9IGEuciArIGIucixcbiAgICAgICAgICBkeCA9ICggYS54ICogYi5yICsgYi54ICogYS5yICkgLyBhYixcbiAgICAgICAgICBkeSA9ICggYS55ICogYi5yICsgYi55ICogYS5yICkgLyBhYjtcbiAgICAgcmV0dXJuIGR4ICogZHggKyBkeSAqIGR5O1xufVxuXG5jbGFzcyBOb2RlXG57XG4gICAgIG5leHQgICAgID0gbnVsbCBhcyBOb2RlXG4gICAgIHByZXZpb3VzID0gbnVsbCBhcyBOb2RlXG4gICAgIGNvbnN0cnVjdG9yICggcHVibGljIF86IENpcmNsZSApIHt9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYWNrRW5jbG9zZSAoIGNpcmNsZXM6IENpcmNsZVtdIClcbntcbiAgICAgaWYgKCAhKCBuID0gY2lyY2xlcy5sZW5ndGggKSApIHJldHVybiAwO1xuXG4gICAgIHZhciBhLCBiLCBjIC8qOiBOb2RlICYgQ2lyY2xlKi8sIG4sIGFhLCBjYSwgaSwgaiwgaywgc2osIHNrO1xuXG4gICAgIC8vIFBsYWNlIHRoZSBmaXJzdCBjaXJjbGUuXG4gICAgIGEgPSBjaXJjbGVzWyAwIF0sIGEueCA9IDAsIGEueSA9IDA7XG4gICAgIGlmICggISggbiA+IDEgKSApIHJldHVybiBhLnI7XG5cbiAgICAgLy8gUGxhY2UgdGhlIHNlY29uZCBjaXJjbGUuXG4gICAgIGIgPSBjaXJjbGVzWyAxIF0sIGEueCA9IC1iLnIsIGIueCA9IGEuciwgYi55ID0gMDtcbiAgICAgaWYgKCAhKCBuID4gMiApICkgcmV0dXJuIGEuciArIGIucjtcblxuICAgICAvLyBQbGFjZSB0aGUgdGhpcmQgY2lyY2xlLlxuICAgICBwbGFjZSggYiwgYSwgYyA9IGNpcmNsZXNbIDIgXSApO1xuXG4gICAgIC8vIEluaXRpYWxpemUgdGhlIGZyb250LWNoYWluIHVzaW5nIHRoZSBmaXJzdCB0aHJlZSBjaXJjbGVzIGEsIGIgYW5kIGMuXG4gICAgIGEgPSBuZXcgTm9kZSggYSApLCBiID0gbmV3IE5vZGUoIGIgKSwgYyA9IG5ldyBOb2RlKCBjICk7XG4gICAgIGEubmV4dCA9IGMucHJldmlvdXMgPSBiO1xuICAgICBiLm5leHQgPSBhLnByZXZpb3VzID0gYztcbiAgICAgYy5uZXh0ID0gYi5wcmV2aW91cyA9IGE7XG5cbiAgICAgLy8gQXR0ZW1wdCB0byBwbGFjZSBlYWNoIHJlbWFpbmluZyBjaXJjbGXigKZcbiAgICAgcGFjazogZm9yICggaSA9IDM7IGkgPCBuOyArK2kgKVxuICAgICB7XG4gICAgICAgICAgcGxhY2UoIGEuXywgYi5fLCBjID0gY2lyY2xlc1sgaSBdICksIGMgPSBuZXcgTm9kZSggYyApO1xuXG4gICAgICAgICAgLy8gRmluZCB0aGUgY2xvc2VzdCBpbnRlcnNlY3RpbmcgY2lyY2xlIG9uIHRoZSBmcm9udC1jaGFpbiwgaWYgYW55LlxuICAgICAgICAgIC8vIOKAnENsb3NlbmVzc+KAnSBpcyBkZXRlcm1pbmVkIGJ5IGxpbmVhciBkaXN0YW5jZSBhbG9uZyB0aGUgZnJvbnQtY2hhaW4uXG4gICAgICAgICAgLy8g4oCcQWhlYWTigJ0gb3Ig4oCcYmVoaW5k4oCdIGlzIGxpa2V3aXNlIGRldGVybWluZWQgYnkgbGluZWFyIGRpc3RhbmNlLlxuICAgICAgICAgIGogPSBiLm5leHQsIGsgPSBhLnByZXZpb3VzLCBzaiA9IGIuXy5yLCBzayA9IGEuXy5yO1xuICAgICAgICAgIGRvXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgaWYgKCBzaiA8PSBzayApXG4gICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGlmICggaW50ZXJzZWN0cyggai5fLCBjLl8gKSApXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICBiID0gaiwgYS5uZXh0ID0gYiwgYi5wcmV2aW91cyA9IGEsIC0taTtcbiAgICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZSBwYWNrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHNqICs9IGouXy5yLCBqID0gai5uZXh0O1xuICAgICAgICAgICAgICAgfSBlbHNlXG4gICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGlmICggaW50ZXJzZWN0cyggay5fLCBjLl8gKSApXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICBhID0gaywgYS5uZXh0ID0gYiwgYi5wcmV2aW91cyA9IGEsIC0taTtcbiAgICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZSBwYWNrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHNrICs9IGsuXy5yLCBrID0gay5wcmV2aW91cztcbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICB9IHdoaWxlICggaiAhPT0gay5uZXh0ICk7XG5cbiAgICAgICAgICAvLyBTdWNjZXNzISBJbnNlcnQgdGhlIG5ldyBjaXJjbGUgYyBiZXR3ZWVuIGEgYW5kIGIuXG4gICAgICAgICAgYy5wcmV2aW91cyA9IGEsIGMubmV4dCA9IGIsIGEubmV4dCA9IGIucHJldmlvdXMgPSBiID0gYztcblxuICAgICAgICAgIC8vIENvbXB1dGUgdGhlIG5ldyBjbG9zZXN0IGNpcmNsZSBwYWlyIHRvIHRoZSBjZW50cm9pZC5cbiAgICAgICAgICBhYSA9IHNjb3JlKCBhICk7XG4gICAgICAgICAgd2hpbGUgKCAoIGMgPSBjLm5leHQgKSAhPT0gYiApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgaWYgKCAoIGNhID0gc2NvcmUoIGMgKSApIDwgYWEgKVxuICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBhID0gYyxcbiAgICAgICAgICAgICAgICAgICAgYWEgPSBjYTtcbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgYiA9IGEubmV4dDtcbiAgICAgfVxuXG4gICAgIC8vIENvbXB1dGUgdGhlIGVuY2xvc2luZyBjaXJjbGUgb2YgdGhlIGZyb250IGNoYWluLlxuICAgICBhID0gWyBiLl8gXVxuICAgICBjID0gYlxuICAgICB3aGlsZSAoICggYyA9IGMubmV4dCApICE9PSBiIClcbiAgICAgICAgICBhLnB1c2goIGMuXyApO1xuICAgICBjID0gZW5jbG9zZSggYSApXG5cbiAgICAgLy8gVHJhbnNsYXRlIHRoZSBjaXJjbGVzIHRvIHB1dCB0aGUgZW5jbG9zaW5nIGNpcmNsZSBhcm91bmQgdGhlIG9yaWdpbi5cbiAgICAgZm9yICggaSA9IDA7IGkgPCBuOyArK2kgKVxuICAgICB7XG4gICAgICAgICAgYSA9IGNpcmNsZXNbIGkgXSxcbiAgICAgICAgICBhLnggLT0gYy54LFxuICAgICAgICAgIGEueSAtPSBjLnlcbiAgICAgfVxuXG4gICAgIHJldHVybiBjLnIgYXMgbnVtYmVyXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYWNrQ2lyY2xlcyAoIGNpcmNsZXM6IENpcmNsZVtdIClcbntcbiAgICAgcGFja0VuY2xvc2UoIGNpcmNsZXMgKTtcbiAgICAgcmV0dXJuIGNpcmNsZXMgYXMgQ2lyY2xlW107XG59XG4iLCJcclxuXHJcbmV4cG9ydCB0eXBlIFVuaXRcclxuICAgID0gXCIlXCJcclxuICAgIHwgXCJweFwiIHwgXCJwdFwiIHwgXCJlbVwiIHwgXCJyZW1cIiB8IFwiaW5cIiB8IFwiY21cIiB8IFwibW1cIlxyXG4gICAgfCBcImV4XCIgfCBcImNoXCIgfCBcInBjXCJcclxuICAgIHwgXCJ2d1wiIHwgXCJ2aFwiIHwgXCJ2bWluXCIgfCBcInZtYXhcIlxyXG4gICAgfCBcImRlZ1wiIHwgXCJyYWRcIiB8IFwidHVyblwiXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0VW5pdCAoIHZhbHVlOiBhbnkgKTogVW5pdCB8IHVuZGVmaW5lZFxyXG57XHJcbiAgICBpZiAoIHR5cGVvZiB2YWx1ZSAhPSBcInN0cmluZ1wiIClcclxuICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZFxyXG5cclxuICAgIGNvbnN0IHNwbGl0ID0gL1srLV0/XFxkKlxcLj9cXGQrKD86XFwuXFxkKyk/KD86W2VFXVsrLV0/XFxkKyk/KCV8cHh8cHR8ZW18cmVtfGlufGNtfG1tfGV4fGNofHBjfHZ3fHZofHZtaW58dm1heHxkZWd8cmFkfHR1cm4pPyQvXHJcbiAgICAgICAgICAgICAgLmV4ZWMoIHZhbHVlICk7XHJcblxyXG4gICAgaWYgKCBzcGxpdCApXHJcbiAgICAgICAgIHJldHVybiBzcGxpdCBbMV0gYXMgVW5pdFxyXG5cclxuICAgIHJldHVybiB1bmRlZmluZWRcclxufVxyXG5cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRUcmFuc2Zvcm1Vbml0ICggcHJvcE5hbWU6IHN0cmluZyApXHJcbntcclxuICAgIGlmICggcHJvcE5hbWUuaW5jbHVkZXMgKCAndHJhbnNsYXRlJyApIHx8IHByb3BOYW1lID09PSAncGVyc3BlY3RpdmUnIClcclxuICAgICAgICByZXR1cm4gJ3B4J1xyXG5cclxuICAgIGlmICggcHJvcE5hbWUuaW5jbHVkZXMgKCAncm90YXRlJyApIHx8IHByb3BOYW1lLmluY2x1ZGVzICggJ3NrZXcnICkgKVxyXG4gICAgICAgIHJldHVybiAnZGVnJ1xyXG59IiwiXG4vLyBodHRwczovL2dpdGh1Yi5jb20vcmRmanMtYmFzZS9kYXRhLW1vZGVsL3RyZWUvbWFzdGVyL2xpYlxuXG5kZWNsYXJlIGdsb2JhbFxue1xuICAgICBpbnRlcmZhY2UgJE5vZGVcbiAgICAge1xuICAgICAgICAgIHJlYWRvbmx5IGNvbnRleHQ6IHN0cmluZ1xuICAgICAgICAgIHJlYWRvbmx5IHR5cGU6IHN0cmluZ1xuICAgICAgICAgIHJlYWRvbmx5IGlkOiBzdHJpbmdcbiAgICAgfVxuXG4gICAgIGludGVyZmFjZSAkQ2x1c3RlciBleHRlbmRzICROb2RlXG4gICAgIHtcbiAgICAgICAgICBjaGlsZHJlbj86ICROb2RlIFtdXG4gICAgIH1cbn1cblxudmFyIG5leHRJZCA9IDBcblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZU5vZGUgPEQgZXh0ZW5kcyAkTm9kZSA9ICROb2RlLCBUIGV4dGVuZHMgc3RyaW5nID0gRCBbXCJ0eXBlXCJdPiAoIHR5cGU6IFQsIGlkOiBzdHJpbmcsIGRhdGE6IFBhcnRpYWwgPE9taXQgPEQsIFwidHlwZVwiIHwgXCJpZFwiPj4gKVxue1xuICAgICB0eXBlIE4gPSB7IC1yZWFkb25seSBbSyBpbiBrZXlvZiBEXTogRFtLXSB9XG5cbiAgICAgOyhkYXRhIGFzIE4pLnR5cGUgPSB0eXBlXG4gICAgIDsoZGF0YSBhcyBOKS5pZCAgID0gaWQgfHwgKCsrbmV4dElkKS50b1N0cmluZyAoKVxuICAgICByZXR1cm4gZGF0YSBhcyBEXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRVSWQgKCBub2RlOiAkTm9kZSApXG57XG4gICAgIHJldHVybiBub2RlLmNvbnRleHQgKyAnIycgKyBub2RlLnR5cGUgKyAnOicgKyBub2RlLmlkXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBlcXVhbE5vZGVzICggYTogJE5vZGUsIGI6ICROb2RlIClcbntcbiAgICAgcmV0dXJuICEhYSAmJiAhIWJcbiAgICAgICAgICAmJiBhLnR5cGUgPT09IGIudHlwZVxuICAgICAgICAgICYmIGEuaWQgICA9PT0gYi5pZFxufVxuXG4vKmV4cG9ydCBjbGFzcyBOb2RlIDxEIGV4dGVuZHMgJE5vZGUgPSAkTm9kZSwgVCBleHRlbmRzIHN0cmluZyA9IEQgW1widHlwZVwiXT5cbntcbiAgICAgc3RhdGljIG5leHRJZCA9IDBcblxuICAgICByZWFkb25seSB0eXBlOiBzdHJpbmdcblxuICAgICByZWFkb25seSBpZDogc3RyaW5nXG5cbiAgICAgcmVhZG9ubHkgdWlkOiBudW1iZXJcblxuICAgICByZWFkb25seSBkYXRhOiBEXG5cbiAgICAgZGVmYXVsdERhdGEgKCk6ICROb2RlXG4gICAgIHtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgY29udGV4dDogXCJcIixcbiAgICAgICAgICAgICAgIHR5cGUgICA6IFwibm9kZVwiLFxuICAgICAgICAgICAgICAgaWQgICAgIDogdW5kZWZpbmVkLFxuICAgICAgICAgIH1cbiAgICAgfVxuXG4gICAgIGNvbnN0cnVjdG9yICggZGF0YTogRCApXG4gICAgIHtcbiAgICAgICAgICB0aGlzLnR5cGUgPSBkYXRhLnR5cGVcbiAgICAgICAgICB0aGlzLnVpZCAgPSArK05vZGUubmV4dElkXG4gICAgICAgICAgdGhpcy5pZCAgID0gZGF0YS5pZCB8fCAoZGF0YS5pZCA9IHRoaXMudWlkLnRvU3RyaW5nICgpKVxuXG4gICAgICAgICAgdGhpcy5kYXRhID0gT2JqZWN0LmFzc2lnbiAoIHRoaXMuZGVmYXVsdERhdGEgKCksIGRhdGEgYXMgRCApXG4gICAgIH1cblxuICAgICBlcXVhbHMgKCBvdGhlcjogTm9kZSA8YW55PiApXG4gICAgIHtcbiAgICAgICAgICByZXR1cm4gISFvdGhlclxuICAgICAgICAgICAgICAgJiYgb3RoZXIudHlwZSA9PT0gdGhpcy50eXBlXG4gICAgICAgICAgICAgICAmJiBvdGhlci5pZCAgID09PSB0aGlzLmlkXG4gICAgIH1cblxuICAgICB0b0pzb24gKClcbiAgICAge1xuICAgICAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeSAoIHRoaXMuZGF0YSApXG4gICAgIH1cbn0qL1xuIiwiXG5leHBvcnQgdHlwZSBQYXRoID0ge1xuICAgICBsZW5ndGg6IG51bWJlclxuICAgICBbU3ltYm9sLml0ZXJhdG9yXSgpOiBJdGVyYWJsZUl0ZXJhdG9yPHN0cmluZz5cbn1cblxuZXhwb3J0IGNsYXNzIERhdGFUcmVlIDxUPlxue1xuICAgICByZWNvcmRzID0ge30gYXMge1xuICAgICAgICAgIFtjb250ZXh0OiBzdHJpbmddOiBUIHwge1xuICAgICAgICAgICAgICAgW3R5cGU6IHN0cmluZ106IFQgfCB7XG4gICAgICAgICAgICAgICAgICAgIFtpZDogc3RyaW5nXTogVFxuICAgICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgfVxuXG4gICAgIGhhcyAoIHBhdGg6IFBhdGggKSAgOiBib29sZWFuXG4gICAgIHtcbiAgICAgICAgICB2YXIgICByZWMgID0gdGhpcy5yZWNvcmRzIGFzIGFueVxuICAgICAgICAgIHZhciBjb3VudCA9IDBcblxuICAgICAgICAgIGZvciAoIGNvbnN0IGsgb2YgcGF0aCApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgY291bnQgKytcblxuICAgICAgICAgICAgICAgaWYgKCBrIGluIHJlYyApXG4gICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGlmICggayA9PT0gdW5kZWZpbmVkIClcbiAgICAgICAgICAgICAgICAgICAgICAgICBicmVha1xuXG4gICAgICAgICAgICAgICAgICAgIHJlYyA9IHJlYyBba11cbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIHBhdGgubGVuZ3RoID09IGNvdW50XG4gICAgIH1cblxuICAgICBjb3VudCAoIHBhdGg6IFBhdGggKVxuICAgICB7XG4gICAgICAgICAgdmFyICByZWMgPSB0aGlzLnJlY29yZHMgYXMgYW55XG5cbiAgICAgICAgICBmb3IgKCBjb25zdCBrIG9mIHBhdGggKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGlmICggayA9PT0gdW5kZWZpbmVkIClcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcblxuICAgICAgICAgICAgICAgaWYgKCBrIGluIHJlYyApXG4gICAgICAgICAgICAgICAgICAgIHJlYyA9IHJlYyBba11cbiAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDBcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvL0B0cy1pZ25vcmVcbiAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkIGluIHJlY1xuICAgICAgICAgICAgICAgPyBPYmplY3Qua2V5cyAoIHJlYyApLmxlbmd0aCAtIDFcbiAgICAgICAgICAgICAgIDogT2JqZWN0LmtleXMgKCByZWMgKS5sZW5ndGhcblxuICAgICB9XG5cbiAgICAgc2V0ICggcGF0aDogUGF0aCwgZGF0YTogVCApOiBUXG4gICAgIHtcbiAgICAgICAgICBjb25zdCB1bmQgPSB1bmRlZmluZWRcbiAgICAgICAgICB2YXIgICByZWMgID0gdGhpcy5yZWNvcmRzIGFzIGFueVxuXG4gICAgICAgICAgZm9yICggY29uc3QgayBvZiBwYXRoIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBpZiAoIGsgPT09IHVuZGVmaW5lZCApXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG5cbiAgICAgICAgICAgICAgIGlmICggayBpbiByZWMgKVxuICAgICAgICAgICAgICAgICAgICByZWMgPSByZWMgW2tdXG4gICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIHJlYyA9IHJlYyBba10gPSB7fVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiByZWMgW3VuZF0gPSBkYXRhXG4gICAgIH1cblxuICAgICBnZXQgKCBwYXRoOiBQYXRoICk6IFRcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHVuZCA9IHVuZGVmaW5lZFxuICAgICAgICAgIHZhciAgIHJlYyAgPSB0aGlzLnJlY29yZHMgYXMgYW55XG5cbiAgICAgICAgICBmb3IgKCBjb25zdCBrIG9mIHBhdGggKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGlmICggayA9PT0gdW5kZWZpbmVkIClcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcblxuICAgICAgICAgICAgICAgaWYgKCBrIGluIHJlYyApXG4gICAgICAgICAgICAgICAgICAgIHJlYyA9IHJlYyBba11cbiAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gcmVjIFt1bmRdXG4gICAgIH1cblxuICAgICBuZWFyICggcGF0aDogUGF0aCApOiBUXG4gICAgIHtcbiAgICAgICAgICB2YXIgcmVjID0gdGhpcy5yZWNvcmRzIGFzIGFueVxuICAgICAgICAgIGNvbnN0IHVuZCA9IHVuZGVmaW5lZFxuXG4gICAgICAgICAgZm9yICggY29uc3QgayBvZiBwYXRoIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBpZiAoIGsgPT09IHVuZGVmaW5lZCApXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG5cbiAgICAgICAgICAgICAgIGlmICggayBpbiByZWMgKVxuICAgICAgICAgICAgICAgICAgICByZWMgPSByZWMgW2tdXG4gICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIHJlYyBbdW5kXVxuICAgICB9XG5cbiAgICAgd2FsayAoIHBhdGg6IFBhdGgsIGNiOiAoIGRhdGE6IFQgKSA9PiB2b2lkIClcbiAgICAge1xuICAgICAgICAgIHZhciAgIHJlYyAgPSB0aGlzLnJlY29yZHMgYXMgYW55XG4gICAgICAgICAgY29uc3QgdW5kICA9IHVuZGVmaW5lZFxuXG4gICAgICAgICAgZm9yICggY29uc3QgayBvZiBwYXRoIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBpZiAoIHVuZCBpbiByZWMgKVxuICAgICAgICAgICAgICAgICAgICBjYiAoIHJlYyBbdW5kXSApXG5cbiAgICAgICAgICAgICAgIGlmICggayA9PT0gdW5kZWZpbmVkIClcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcblxuICAgICAgICAgICAgICAgaWYgKCBrIGluIHJlYyApXG4gICAgICAgICAgICAgICAgICAgIHJlYyA9IHJlYyBba11cbiAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoIHVuZCBpbiByZWMgKVxuICAgICAgICAgICAgICAgY2IgKCByZWMgW3VuZF0gKVxuXG4gICAgICAgICAgcmV0dXJuXG4gICAgIH1cbn1cbiIsIlxuaW1wb3J0IHsgT3B0aW9uYWwsIFJlcXVpcmUgfSBmcm9tIFwiLi4vTGliL3R5cGluZy5qc1wiXG5pbXBvcnQgeyBEYXRhVHJlZSB9IGZyb20gXCIuL2RhdGEtdHJlZS5qc1wiXG5cblxudHlwZSBSZWYgPE4gZXh0ZW5kcyAkTm9kZT4gPSBSZXF1aXJlIDxQYXJ0aWFsIDxOPiwgXCJjb250ZXh0XCIgfCBcInR5cGVcIiB8IFwiaWRcIj5cblxudHlwZSBEIDxOIGV4dGVuZHMgJE5vZGU+ID0gT3B0aW9uYWwgPE4sIFwiY29udGV4dFwiIHwgXCJ0eXBlXCIgfCBcImlkXCI+XG5cblxuZXhwb3J0IGNsYXNzIERhdGFiYXNlIDxOIGV4dGVuZHMgJE5vZGUgPSAkTm9kZT4gZXh0ZW5kcyBEYXRhVHJlZSA8Tj5cbntcbiAgICAgaGFzICggbm9kZTogUmVmIDxOPiApICAgICAgOiBib29sZWFuXG4gICAgIGhhcyAoIC4uLiBwYXRoOiBzdHJpbmcgW10gKTogYm9vbGVhblxuICAgICBoYXMgKCk6IGJvb2xlYW5cbiAgICAge1xuICAgICAgICAgIGlmICggYXJndW1lbnRzLmxlbmd0aCA9PSAwIClcbiAgICAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgICAgaWYgKCBhcmd1bWVudHMubGVuZ3RoID09IDEgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNvbnN0IG86IE4gPSBhcmd1bWVudHMgWzBdXG4gICAgICAgICAgICAgICByZXR1cm4gc3VwZXIubmVhciAoIFtvLmNvbnRleHQsIG8udHlwZSwgby5pZF0gKSAhPT0gdW5kZWZpbmVkXG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICByZXR1cm4gc3VwZXIubmVhciAoIGFyZ3VtZW50cyApICE9PSB1bmRlZmluZWRcbiAgICAgICAgICB9XG4gICAgIH1cblxuICAgICBjb3VudCAoIG5vZGU6IFJlZiA8Tj4gKSAgICAgIDogbnVtYmVyXG4gICAgIGNvdW50ICggLi4uIHBhdGg6IHN0cmluZyBbXSApOiBudW1iZXJcbiAgICAgY291bnQgKCk6IG51bWJlclxuICAgICB7XG4gICAgICAgICAgaWYgKCBhcmd1bWVudHMubGVuZ3RoID09IDAgKVxuICAgICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgICBpZiAoIGFyZ3VtZW50cy5sZW5ndGggPT0gMSApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgY29uc3QgbzogTiA9IGFyZ3VtZW50cyBbMF1cbiAgICAgICAgICAgICAgIHJldHVybiBzdXBlci5jb3VudCAoIFtvLmNvbnRleHQsIG8udHlwZSwgby5pZF0gKVxuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgcmV0dXJuIHN1cGVyLmNvdW50ICggYXJndW1lbnRzIClcbiAgICAgICAgICB9XG4gICAgIH1cblxuICAgICBzZXQgPCQgZXh0ZW5kcyBOPiAoIG5vZGU6ICQgKSAgICAgICAgICAgICAgICAgICAgIDogJFxuICAgICBzZXQgPCQgZXh0ZW5kcyBOPiAoIHBhdGg6IHN0cmluZyBbXSwgZGF0YTogRCA8JD4gKTogJFxuICAgICBzZXQgKCk6IE5cbiAgICAge1xuICAgICAgICAgIGlmICggYXJndW1lbnRzLmxlbmd0aCA9PSAwIClcbiAgICAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgICAgaWYgKCBhcmd1bWVudHMubGVuZ3RoID09IDEgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNvbnN0IG86IE4gPSBhcmd1bWVudHMgWzBdXG4gICAgICAgICAgICAgICByZXR1cm4gc3VwZXIuc2V0ICggW28uY29udGV4dCwgby50eXBlLCBvLmlkXSwgbyApXG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICByZXR1cm4gc3VwZXIuc2V0ICggYXJndW1lbnRzIFswXSwgYXJndW1lbnRzIFsxXSApXG4gICAgICAgICAgfVxuICAgICB9XG5cbiAgICAgZ2V0IDwkIGV4dGVuZHMgTj4gKCBub2RlOiBSZWYgPCROb2RlPiApICA6ICRcbiAgICAgZ2V0IDwkIGV4dGVuZHMgTj4gKCAuLi4gcGF0aDogc3RyaW5nIFtdICk6ICRcbiAgICAgZ2V0ICgpOiBOXG4gICAgIHtcbiAgICAgICAgICBpZiAoIGFyZ3VtZW50cy5sZW5ndGggPT0gMCApXG4gICAgICAgICAgICAgICByZXR1cm5cblxuICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHt9IGFzIE5cblxuICAgICAgICAgIGlmICggYXJndW1lbnRzLmxlbmd0aCA9PSAxIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBjb25zdCBvOiAkTm9kZSA9IGFyZ3VtZW50cyBbMF1cbiAgICAgICAgICAgICAgIHN1cGVyLndhbGsgKCBbby5jb250ZXh0LCBvLnR5cGUsIG8uaWRdLCBkYXRhID0+IHtcbiAgICAgICAgICAgICAgICAgICAgT2JqZWN0LmFzc2lnbiAoIHJlc3VsdCwgZGF0YSApXG4gICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgcmV0dXJuIE9iamVjdC5hc3NpZ24gKCByZXN1bHQsIG8gKVxuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgc3VwZXIud2FsayAoIGFyZ3VtZW50cywgZGF0YSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIE9iamVjdC5hc3NpZ24gKCByZXN1bHQsIGRhdGEgKVxuICAgICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgICAgcmV0dXJuIE9iamVjdC5hc3NpZ24gKCByZXN1bHQsIHtcbiAgICAgICAgICAgICAgICAgICAgY29udGV4dDogYXJndW1lbnRzIFswXSxcbiAgICAgICAgICAgICAgICAgICAgdHlwZSAgIDogYXJndW1lbnRzIFsxXSxcbiAgICAgICAgICAgICAgICAgICAgaWQgICAgIDogYXJndW1lbnRzIFsyXSxcbiAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgfVxuICAgICB9XG59XG4iLCJcbmltcG9ydCB7IERhdGFiYXNlIH0gZnJvbSBcIi4vZGIuanNcIlxuaW1wb3J0IHsgRGF0YVRyZWUsIFBhdGggfSBmcm9tIFwiLi9kYXRhLXRyZWUuanNcIlxuXG5pbXBvcnQgeyBPcHRpb25hbCB9IGZyb20gXCIuLi9MaWIvaW5kZXguanNcIlxuXG5cbnR5cGUgSXRlbSA8VCA9IGFueSwgJCBleHRlbmRzICROb2RlID0gJE5vZGU+ID1cbntcbiAgICAgbXVsdGlwbGU6IGJvb2xlYW5cbiAgICAgaW5zdGFuY2VzOiBUIFtdXG4gICAgIGNvbnN0cnVjdG9yOiBuZXcgKCBkYXRhOiAkICkgPT4gVFxufVxuXG50eXBlICRJbiA8TiBleHRlbmRzICROb2RlID0gJE5vZGU+ID0gT3B0aW9uYWwgPE4sIFwiY29udGV4dFwiPlxuXG4vL2V4cG9ydCB0eXBlIEN0b3IgPE4gZXh0ZW5kcyAkTm9kZSA9ICROb2RlLCBUID0gYW55PiA9IG5ldyAoIGRhdGE6IE4gKSA9PiBUXG5leHBvcnQgdHlwZSBDdG9yIDxOIGV4dGVuZHMgJE5vZGUgPSAkTm9kZSwgVCA9IGFueT4gPSBuZXcgKCBkYXRhOiBOLCBjaGlsZHJlbj86IGFueSBbXSApID0+IFRcblxudHlwZSBBcmcgPEY+ID0gRiBleHRlbmRzIG5ldyAoIGRhdGE6IGluZmVyIEQgKSA9PiBhbnkgPyBEIDogYW55XG5cblxuZXhwb3J0IGNsYXNzIEZhY3RvcnkgPEUgPSBhbnksIE4gZXh0ZW5kcyAkTm9kZSA9ICROb2RlPlxue1xuICAgICBjb25zdHJ1Y3RvciAoIHJlYWRvbmx5IGRiOiBEYXRhYmFzZSA8Tj4gKSB7fVxuXG4gICAgIHByaXZhdGUgY3RvcnMgPSBuZXcgRGF0YVRyZWUgPEN0b3IgPCROb2RlLCBFPj4gKClcbiAgICAgcHJpdmF0ZSBpbnN0cyA9ICBuZXcgRGF0YVRyZWUgPEU+ICgpXG5cblxuICAgICBnZXRQYXRoICggbm9kZTogJE5vZGUgKSAgICAgICAgOiBQYXRoXG4gICAgIGdldFBhdGggKCBwYXRoOiBQYXRoICkgICAgICAgICA6IFBhdGhcbiAgICAgZ2V0UGF0aCAoIC4uLiBwYXRoOiBzdHJpbmcgW10gKTogUGF0aFxuXG4gICAgIGdldFBhdGggKClcbiAgICAge1xuICAgICAgICAgIGlmICggYXJndW1lbnRzLmxlbmd0aCA9PSAwIClcbiAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvciAoIFwiTnVsbCBhcmd1bWVudFwiIClcblxuICAgICAgICAgIGNvbnN0IGFyZyAgPSBhcmd1bWVudHMgWzBdXG5cbiAgICAgICAgICBpZiAoIHR5cGVvZiBhcmcgPT0gXCJzdHJpbmdcIiApXG4gICAgICAgICAgICAgICByZXR1cm4gYXJndW1lbnRzIGFzIFBhdGhcblxuICAgICAgICAgIGlmICggQXJyYXkuaXNBcnJheSAoIGFyZykgKVxuICAgICAgICAgICAgICAgcmV0dXJuIGFyZy5mbGF0ICgpIGFzIFBhdGhcblxuICAgICAgICAgIHJldHVybiBbIGFyZy5jb250ZXh0LCBhcmcudHlwZSwgYXJnLmlkIF0gYXMgUGF0aFxuICAgICB9XG5cbiAgICAgaW5TdG9jayAoIG5vZGU6ICROb2RlICkgICAgICAgIDogYm9vbGVhblxuICAgICBpblN0b2NrICggcGF0aDogUGF0aCApICAgICAgICAgOiBib29sZWFuXG4gICAgIGluU3RvY2sgKCAuLi4gcGF0aDogc3RyaW5nIFtdICk6IGJvb2xlYW5cblxuICAgICBpblN0b2NrICgpOiBib29sZWFuXG4gICAgIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5pbnN0cy5oYXMgKCB0aGlzLmdldFBhdGggKCAuLi4gYXJndW1lbnRzICkgYXMgUGF0aCApXG4gICAgIH1cbiAgICAgX2luU3RvY2sgKCBwYXRoOiBQYXRoIClcbiAgICAge1xuICAgICAgICAgIHJldHVybiB0aGlzLmluc3RzLmhhcyAoIHBhdGggKVxuICAgICB9XG5cbiAgICAgZGVmaW5lIDxGIGV4dGVuZHMgQ3Rvcj4gKCBjdG9yOiBGLCBub2RlOiBBcmcgPEY+ICkgICAgICA6IHZvaWRcbiAgICAgZGVmaW5lIDxGIGV4dGVuZHMgQ3Rvcj4gKCBjdG9yOiBGLCBwYXRoOiBQYXRoICkgICAgICAgICA6IHZvaWRcbiAgICAgZGVmaW5lIDxGIGV4dGVuZHMgQ3Rvcj4gKCBjdG9yOiBGLCAuLi4gcGF0aDogc3RyaW5nIFtdICk6IHZvaWRcblxuICAgICBkZWZpbmUgKCBjdG9yOiBDdG9yLCAuLi4gcmVzdDogYW55IFtdIClcbiAgICAge1xuICAgICAgICAgIHZhciBwYXRoID0gdGhpcy5nZXRQYXRoICggLi4uIHJlc3QgKVxuXG4gICAgICAgICAgaWYgKCB0aGlzLmN0b3JzLmhhcyAoIHBhdGggKSApXG4gICAgICAgICAgICAgICB0aHJvdyBcIkJhZCBhcmd1bWVudFwiXG5cbiAgICAgICAgICByZXR1cm4gdGhpcy5jdG9ycy5zZXQgKCBwYXRoLCBjdG9yIClcbiAgICAgfVxuICAgICBfZGVmaW5lICggY3RvcjogQ3RvciwgcGF0aDogUGF0aCApXG4gICAgIHtcbiAgICAgICAgICBpZiAoIHRoaXMuY3RvcnMuaGFzICggcGF0aCApIClcbiAgICAgICAgICAgICAgIHRocm93IFwiQmFkIGFyZ3VtZW50XCJcblxuICAgICAgICAgIHJldHVybiB0aGlzLmN0b3JzLnNldCAoIHBhdGgsIGN0b3IgKVxuICAgICB9XG5cbiAgICAgcGljayA8UiBleHRlbmRzIEUsICQgZXh0ZW5kcyBOID0gTj4gKCBub2RlOiAkTm9kZSApOiBSXG4gICAgIHBpY2sgPFIgZXh0ZW5kcyBFPiAoIC4uLiBwYXRoOiBzdHJpbmcgW10gKSAgICAgICAgIDogUlxuICAgICBwaWNrIDxSIGV4dGVuZHMgRT4gKCBwYXRoOiBQYXRoICkgICAgICAgICAgICAgICAgICA6IFJcblxuICAgICBwaWNrICgpOiBFXG4gICAgIHtcbiAgICAgICAgICB2YXIgcGF0aCA9IHRoaXMuZ2V0UGF0aCAoIC4uLiBhcmd1bWVudHMgKVxuXG4gICAgICAgICAgaWYgKCB0aGlzLmluc3RzLmhhcyAoIHBhdGggKSApXG4gICAgICAgICAgICAgICByZXR1cm4gdGhpcy5pbnN0cy5nZXQgKCBwYXRoIClcblxuICAgICAgICAgIHRocm93IFwiQmFkIGFyZ3VtZW50XCJcbiAgICAgfVxuICAgICBfcGljayAoIHBhdGg6IFBhdGggKVxuICAgICB7XG4gICAgICAgICAgaWYgKCB0aGlzLmluc3RzLmhhcyAoIHBhdGggKSApXG4gICAgICAgICAgICAgICByZXR1cm4gdGhpcy5pbnN0cy5nZXQgKCBwYXRoIClcblxuICAgICAgICAgIHRocm93IFwiQmFkIGFyZ3VtZW50XCJcbiAgICAgfVxuXG4gICAgIG1ha2UgPFIgZXh0ZW5kcyBFLCAkIGV4dGVuZHMgTiA9IE4+ICggbm9kZTogJCApOiBSXG4gICAgIG1ha2UgPFIgZXh0ZW5kcyBFPiAoIHBhdGg6IFBhdGggKSAgICAgICAgICAgICAgOiBSXG4gICAgIG1ha2UgPFIgZXh0ZW5kcyBFPiAoIC4uLiBwYXRoOiBzdHJpbmcgW10gKSAgICAgOiBSXG5cbiAgICAgbWFrZSAoKTogRVxuICAgICB7XG4gICAgICAgICAgdmFyIHBhdGggPSB0aGlzLmdldFBhdGggKCAuLi4gYXJndW1lbnRzIClcblxuICAgICAgICAgIGNvbnN0IGFyZyAgPSBhcmd1bWVudHMgWzBdXG5cbiAgICAgICAgICBpZiAoIHR5cGVvZiBhcmcgPT0gXCJvYmplY3RcIiAmJiAhIEFycmF5LmlzQXJyYXkgKGFyZykgKVxuICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX21ha2UgKCBwYXRoLCBhcmcgKVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9tYWtlICggcGF0aCApXG4gICAgIH1cbiAgICAgX21ha2UgKCBwYXRoOiBQYXRoLCBkYXRhPzogUGFydGlhbCA8Tj4gKVxuICAgICB7XG4gICAgICAgICAgaWYgKCB0aGlzLmluc3RzLmhhcyAoIHBhdGggKSApXG4gICAgICAgICAgICAgICByZXR1cm4gdGhpcy5pbnN0cy5nZXQgKCBwYXRoIClcblxuICAgICAgICAgIGNvbnN0IGN0b3IgPSB0aGlzLmN0b3JzLm5lYXIgKCBwYXRoIClcblxuICAgICAgICAgIGlmICggY3RvciA9PSB1bmRlZmluZWQgKVxuICAgICAgICAgICAgICAgdGhyb3cgXCJCYWQgYXJndW1lbnRcIlxuXG4gICAgICAgICAgY29uc3QgdG1wID0gdGhpcy5kYi5nZXQgKCAuLi4gcGF0aCApXG5cbiAgICAgICAgICBkYXRhID0gZGF0YSA9PSB1bmRlZmluZWRcbiAgICAgICAgICAgICAgID8gdG1wXG4gICAgICAgICAgICAgICA6IE9iamVjdC5hc3NpZ24gKCB0bXAsIGRhdGEgKVxuXG4gICAgICAgICAgcmV0dXJuIHRoaXMuaW5zdHMuc2V0ICggcGF0aCwgbmV3IGN0b3IgKCBkYXRhIGFzIE4gKSApXG4gICAgIH1cbn1cbiIsIlxuaW1wb3J0IHsgU2hhcGUgfSBmcm9tIFwiLi9FbGVtZW50L3NoYXBlLmpzXCJcbi8vaW1wb3J0ICogYXMgRmFjdG9yeSBmcm9tIFwiLi9mYWN0b3J5LmpzXCJcblxuZGVjbGFyZSBnbG9iYWxcbntcbiAgICAgdHlwZSBHZW9tZXRyeU5hbWVzID0ga2V5b2YgdHlwZW9mIEZhY3RvcnlcblxuICAgICBpbnRlcmZhY2UgJEdlb21ldHJ5XG4gICAgIHtcbiAgICAgICAgICBzaGFwZTogR2VvbWV0cnlOYW1lc1xuICAgICAgICAgIHggICAgICAgICA6IG51bWJlclxuICAgICAgICAgIHkgICAgICAgICA6IG51bWJlclxuXG4gICAgICAgICAgYm9yZGVyV2lkdGggICAgOiBudW1iZXJcbiAgICAgICAgICBib3JkZXJDb2xvciAgICA6IHN0cmluZ1xuXG4gICAgICAgICAgYmFja2dyb3VuZENvbG9yIDogc3RyaW5nXG4gICAgICAgICAgYmFja2dyb3VuZEltYWdlIDogc3RyaW5nXG4gICAgICAgICAgYmFja2dyb3VuZFJlcGVhdDogYm9vbGVhblxuICAgICB9XG5cbiAgICAgaW50ZXJmYWNlICRUZXh0RGVmaW5pdGlvbiBleHRlbmRzICRHZW9tZXRyeVxuICAgICB7XG4gICAgICAgICAgdGV4dDogc3RyaW5nXG4gICAgIH1cblxuICAgICBpbnRlcmZhY2UgJFBhdGhEZWZpbml0aW9uIGV4dGVuZHMgJEdlb21ldHJ5XG4gICAgIHtcbiAgICAgICAgICBwYXRoOiBzdHJpbmdcbiAgICAgfVxufVxuXG5jb25zdCBmYWJyaWNfYmFzZV9vYnRpb25zOiBmYWJyaWMuSU9iamVjdE9wdGlvbnMgPSB7XG4gICAgIGxlZnQgICA6IDAsXG4gICAgIHRvcCAgICA6IDAsXG4gICAgIG9yaWdpblg6IFwiY2VudGVyXCIsXG4gICAgIG9yaWdpblk6IFwiY2VudGVyXCIsXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBncm91cCAoIGRlZjogJEdlb21ldHJ5LCBzaXplOiBudW1iZXIsIG9wdDogZmFicmljLklDaXJjbGVPcHRpb25zIClcbntcbiAgICAgcmV0dXJuIG5ldyBmYWJyaWMuR3JvdXAgKCB1bmRlZmluZWQsXG4gICAgIHtcbiAgICAgICAgICAuLi4gZmFicmljX2Jhc2Vfb2J0aW9ucyxcbiAgICAgICAgICAuLi4gb3B0LFxuICAgICAgICAgIHdpZHRoOiBzaXplLFxuICAgICAgICAgIGhlaWdodDogc2l6ZSxcbiAgICAgfSlcbn1cblxuLy8gVG8gZ2V0IHBvaW50cyBvZiB0cmlhbmdsZSwgc3F1YXJlLCBbcGFudGF8aGV4YV1nb25cbi8vXG4vLyB2YXIgYSA9IE1hdGguUEkqMi80XG4vLyBmb3IgKCB2YXIgaSA9IDAgOyBpICE9IDQgOyBpKysgKVxuLy8gICAgIGNvbnNvbGUubG9nICggYFsgJHsgTWF0aC5zaW4oYSppKSB9LCAkeyBNYXRoLmNvcyhhKmkpIH0gXWAgKVxuXG5leHBvcnQgZnVuY3Rpb24gY2lyY2xlICggZGVmOiAkR2VvbWV0cnksIHNpemU6IG51bWJlciwgb3B0OiBmYWJyaWMuSUNpcmNsZU9wdGlvbnMgKVxue1xuXG4gICAgIHJldHVybiBuZXcgZmFicmljLkNpcmNsZSAoXG4gICAgIHtcbiAgICAgICAgICAuLi4gZmFicmljX2Jhc2Vfb2J0aW9ucyxcbiAgICAgICAgICAuLi4gb3B0LFxuICAgICAgICAgIHJhZGl1czogc2l6ZSAvIDIsXG4gICAgIH0pXG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0cmlhbmdsZSAoIGRlZjogJEdlb21ldHJ5LCBzaXplOiBudW1iZXIsIG9wdDogZmFicmljLklUcmlhbmdsZU9wdGlvbnMgKVxue1xuICAgICBjb25zdCBwb2ludHMgPSBbXVxuICAgICBjb25zdCBzY2FsZSA9IDEuMlxuICAgICBjb25zdCByID0gc2l6ZSAvIDIgKiBzY2FsZVxuXG4gICAgIGZvciAoIGNvbnN0IHAgb2YgW1xuICAgICAgICAgIFsgMCwgMSBdLFxuICAgICAgICAgIFsgMC44NjYwMjU0MDM3ODQ0Mzg3LCAtMC40OTk5OTk5OTk5OTk5OTk4IF0sXG4gICAgICAgICAgWyAtMC44NjYwMjU0MDM3ODQ0Mzg1LCAtMC41MDAwMDAwMDAwMDAwMDA0IF1cbiAgICAgXSkgcG9pbnRzLnB1c2ggKHsgeDogcFswXSAqIHIsIHk6IHBbMV0gKiByIH0pXG5cbiAgICAgcmV0dXJuIG5ldyBmYWJyaWMuUG9seWdvbiAoIHBvaW50cywge1xuICAgICAgICAgIC4uLiBmYWJyaWNfYmFzZV9vYnRpb25zLFxuICAgICAgICAgIC4uLiBvcHQsXG4gICAgICAgICAgYW5nbGU6IDE4MCxcbiAgICAgfSlcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNxdWFyZSAoIGRlZjogJEdlb21ldHJ5LCBzaXplOiBudW1iZXIsIG9wdDogZmFicmljLklSZWN0T3B0aW9ucyApXG57XG4gICAgIGNvbnN0IHNjYWxlID0gMC45XG4gICAgIHJldHVybiBuZXcgZmFicmljLlJlY3QgKFxuICAgICB7XG4gICAgICAgICAgLi4uIGZhYnJpY19iYXNlX29idGlvbnMsXG4gICAgICAgICAgLi4uIG9wdCxcbiAgICAgICAgICB3aWR0aCA6IHNpemUgKiBzY2FsZSxcbiAgICAgICAgICBoZWlnaHQ6IHNpemUgKiBzY2FsZSxcbiAgICAgfSlcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhbnRhZ29uICggZGVmOiAkR2VvbWV0cnksIHNpemU6IG51bWJlciwgb3B0OiBmYWJyaWMuSU9iamVjdE9wdGlvbnMgKVxue1xuICAgICBjb25zdCBwb2ludHMgPSBbXVxuICAgICBjb25zdCBzY2FsZSA9IDEuMVxuICAgICBjb25zdCByID0gc2l6ZSAvIDIgKiBzY2FsZVxuXG4gICAgIGZvciAoIGNvbnN0IHAgb2YgW1xuICAgICAgICAgIFsgMCwgMSBdLFxuICAgICAgICAgIFsgMC45NTEwNTY1MTYyOTUxNTM1LCAwLjMwOTAxNjk5NDM3NDk0NzQ1IF0sXG4gICAgICAgICAgWyAwLjU4Nzc4NTI1MjI5MjQ3MzIsIC0wLjgwOTAxNjk5NDM3NDk0NzMgXSxcbiAgICAgICAgICBbIC0wLjU4Nzc4NTI1MjI5MjQ3MywgLTAuODA5MDE2OTk0Mzc0OTQ3NSBdLFxuICAgICAgICAgIFsgLTAuOTUxMDU2NTE2Mjk1MTUzNiwgMC4zMDkwMTY5OTQzNzQ5NDcyMyBdXG4gICAgIF0pIHBvaW50cy5wdXNoICh7IHg6IHBbMF0gKiByLCB5OiBwWzFdICogciB9KVxuXG4gICAgIHJldHVybiBuZXcgZmFicmljLlBvbHlnb24gKCBwb2ludHMsIHtcbiAgICAgICAgICAuLi4gZmFicmljX2Jhc2Vfb2J0aW9ucyxcbiAgICAgICAgICAuLi4gb3B0LFxuICAgICAgICAgIGFuZ2xlOiAxODAsXG4gICAgIH0pXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBoZXhhZ29uICggZGVmOiAkR2VvbWV0cnksIHNpemU6IG51bWJlciwgb3B0OiBmYWJyaWMuSU9iamVjdE9wdGlvbnMgKVxue1xuICAgICBjb25zdCBwb2ludHMgPSBbXVxuICAgICBjb25zdCBzY2FsZSA9IDEuMVxuICAgICBjb25zdCByID0gc2l6ZSAvIDIgKiBzY2FsZVxuXG4gICAgIGZvciAoIGNvbnN0IHAgb2YgW1xuICAgICAgICAgIFsgMCwgMSBdLFxuICAgICAgICAgIFsgMC44NjYwMjU0MDM3ODQ0Mzg2LCAwLjUwMDAwMDAwMDAwMDAwMDEgXSxcbiAgICAgICAgICBbIDAuODY2MDI1NDAzNzg0NDM4NywgLTAuNDk5OTk5OTk5OTk5OTk5OCBdLFxuICAgICAgICAgIFsgMS4yMjQ2NDY3OTkxNDczNTMyZS0xNiwgLTEgXSxcbiAgICAgICAgICBbIC0wLjg2NjAyNTQwMzc4NDQzODUsIC0wLjUwMDAwMDAwMDAwMDAwMDQgXSxcbiAgICAgICAgICBbIC0wLjg2NjAyNTQwMzc4NDQzOSwgMC40OTk5OTk5OTk5OTk5OTkzMyBdLFxuICAgICBdKSBwb2ludHMucHVzaCAoeyB4OiBwWzBdICogciwgeTogcFsxXSAqIHIgfSlcblxuICAgICByZXR1cm4gbmV3IGZhYnJpYy5Qb2x5Z29uICggcG9pbnRzLCB7XG4gICAgICAgICAgLi4uIGZhYnJpY19iYXNlX29idGlvbnMsXG4gICAgICAgICAgLi4uIG9wdCxcbiAgICAgICAgICBhbmdsZTogOTAsXG4gICAgIH0pXG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0ZXh0ICggZGVmOiAkVGV4dERlZmluaXRpb24sIHNpemU6IG51bWJlciwgb3B0OiBmYWJyaWMuVGV4dE9wdGlvbnMgKVxue1xuICAgICByZXR1cm4gbmV3IGZhYnJpYy5UZXh0ICggXCIuLi5cIiwge1xuICAgICAgICAgIC4uLiBmYWJyaWNfYmFzZV9vYnRpb25zLFxuICAgICAgICAgIC4uLiBvcHQsXG4gICAgICAgICAgZm9udFNpemU6IHNpemUsXG4gICAgIH0pXG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0ZXh0Ym94ICggZGVmOiAkVGV4dERlZmluaXRpb24sIHNpemU6IG51bWJlciwgb3B0OiBmYWJyaWMuVGV4dE9wdGlvbnMgKVxue1xuICAgICByZXR1cm4gbmV3IGZhYnJpYy5UZXh0Ym94ICggXCIuLi5cIiwge1xuICAgICAgICAgIC4uLiBmYWJyaWNfYmFzZV9vYnRpb25zLFxuICAgICAgICAgIC4uLiBvcHQsXG4gICAgICAgICAgZm9udFNpemU6IHNpemUsXG4gICAgIH0pXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXRoICggZGVmOiAkUGF0aERlZmluaXRpb24sIHNpemU6IG51bWJlciwgb3B0OiBmYWJyaWMuSU9iamVjdE9wdGlvbnMgKVxue1xuICAgICByZXR1cm4gbmV3IGZhYnJpYy5QYXRoICggZGVmLnBhdGgsXG4gICAgIHtcbiAgICAgICAgICAuLi4gZmFicmljX2Jhc2Vfb2J0aW9ucyxcbiAgICAgICAgICAuLi4gb3B0LFxuICAgICAgICAgIHNjYWxlWDogc2l6ZSAvIDEwMCwgLy8gRW4gc3VwcG9zYW50IHF1ZSBsZSB2aWV3Qm94XG4gICAgICAgICAgc2NhbGVZOiBzaXplIC8gMTAwLCAvLyBlc3QgXCIwIDAgMTAwIDEwMFwiXG4gICAgIH0pXG59XG5cbmNvbnN0IEZhY3RvcnkgPSB7XG4gICAgIGdyb3VwLFxuICAgICBjaXJjbGUsXG4gICAgIHRyaWFuZ2xlLFxuICAgICBzcXVhcmUsXG4gICAgIHBhbnRhZ29uLFxuICAgICBoZXhhZ29uICxcbiAgICAgdGV4dCxcbiAgICAgdGV4dGJveCAsXG4gICAgIHBhdGgsXG59XG5cblxuZXhwb3J0IGNsYXNzIEdlb21ldHJ5IDxUIGV4dGVuZHMgR2VvbWV0cnlOYW1lcyA9IEdlb21ldHJ5TmFtZXM+XG57XG4gICAgIGNvbmZpZzogJEdlb21ldHJ5XG4gICAgIG9iamVjdDogUmV0dXJuVHlwZSA8dHlwZW9mIEZhY3RvcnkgW1RdPlxuXG4gICAgIGNvbnN0cnVjdG9yICggcmVhZG9ubHkgb3duZXI6IFNoYXBlIClcbiAgICAge1xuICAgICAgICAgIHRoaXMuY29uZmlnID0gb3duZXIuY29uZmlnXG4gICAgICAgICAgdGhpcy51cGRhdGVTaGFwZSAoKVxuICAgICB9XG5cbiAgICAgdXBkYXRlICggb3B0aW9uczogUGFydGlhbCA8JEdlb21ldHJ5PiApXG4gICAgIHtcbiAgICAgICAgICBPYmplY3QuYXNzaWduICggdGhpcy5jb25maWcsIG9wdGlvbnMgKVxuXG4gICAgICAgICAgaWYgKCBcInNoYXBlXCIgaW4gb3B0aW9ucyApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgdGhpcy51cGRhdGVTaGFwZSAoKVxuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIGlmICggXCJiYWNrZ3JvdW5kSW1hZ2VcIiBpbiBvcHRpb25zIHx8IFwiYmFja2dyb3VuZFJlcGVhdFwiIGluIG9wdGlvbnMgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHRoaXMudXBkYXRlQmFja2dyb3VuZEltYWdlICgpXG4gICAgICAgICAgfVxuICAgICB9XG5cbiAgICAgdXBkYXRlUG9zaXRpb24gKClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHsgY29uZmlnLCBvYmplY3QgfSA9IHRoaXNcblxuICAgICAgICAgIDsob2JqZWN0IGFzIGZhYnJpYy5PYmplY3QpLnNldCAoe1xuICAgICAgICAgICAgICAgbGVmdDogY29uZmlnLngsXG4gICAgICAgICAgICAgICB0b3AgOiBjb25maWcueSxcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5zZXRDb29yZHMgKClcbiAgICAgfVxuXG4gICAgIHVwZGF0ZVNpemUgKClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHsgb3duZXIsIGNvbmZpZywgb2JqZWN0IH0gPSB0aGlzXG5cbiAgICAgICAgICBjb25zdCBzaXplID0gb3duZXIuZGlzcGxheVNpemUgKClcblxuICAgICAgICAgIGlmICggY29uZmlnLnNoYXBlID09IFwiY2lyY2xlXCIgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIChvYmplY3QgYXMgZmFicmljLkNpcmNsZSkuc2V0ICh7XG4gICAgICAgICAgICAgICAgICAgIHJhZGl1czogc2l6ZSAvIDJcbiAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICAob2JqZWN0IGFzIGZhYnJpYy5PYmplY3QpLnNldCAoe1xuICAgICAgICAgICAgICAgICAgICB3aWR0aCA6IHNpemUsXG4gICAgICAgICAgICAgICAgICAgIGhlaWdodDogc2l6ZSxcbiAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgb2JqZWN0LnNldENvb3JkcyAoKVxuICAgICB9XG5cbiAgICAgdXBkYXRlU2hhcGUgKCBzaGFwZT86IEdlb21ldHJ5TmFtZXMgKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgeyBjb25maWcsIG93bmVyIH0gPSB0aGlzXG5cbiAgICAgICAgICBpZiAoIGFyZ3VtZW50cy5sZW5ndGggPT0gMCApXG4gICAgICAgICAgICAgICBzaGFwZSA9IGNvbmZpZy5zaGFwZVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgIGNvbmZpZy5zaGFwZSA9IHNoYXBlXG5cbiAgICAgICAgICBpZiAoIG93bmVyLmdyb3VwICE9IHVuZGVmaW5lZCAmJiB0aGlzLm9iamVjdCAhPSB1bmRlZmluZWQgKVxuICAgICAgICAgICAgICAgb3duZXIuZ3JvdXAucmVtb3ZlICggdGhpcy5vYmplY3QgKVxuXG4gICAgICAgICAgY29uc3Qgb2JqID0gdGhpcy5vYmplY3RcbiAgICAgICAgICAgICAgICAgICAgPSBGYWN0b3J5IFtjb25maWcuc2hhcGUgYXMgYW55XSAoIGNvbmZpZywgb3duZXIuZGlzcGxheVNpemUgKCksIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICBsZWZ0ICAgICAgIDogMCwgLy9jb25maWcueCxcbiAgICAgICAgICAgICAgICAgICAgICAgICB0b3AgICAgICAgIDogMCwgLy9jb25maWcueSxcbiAgICAgICAgICAgICAgICAgICAgICAgICBvcmlnaW5YICAgIDogXCJjZW50ZXJcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICBvcmlnaW5ZICAgIDogXCJjZW50ZXJcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICBmaWxsICAgICAgIDogY29uZmlnLmJhY2tncm91bmRDb2xvcixcbiAgICAgICAgICAgICAgICAgICAgICAgICBzdHJva2UgICAgIDogY29uZmlnLmJvcmRlckNvbG9yLFxuICAgICAgICAgICAgICAgICAgICAgICAgIHN0cm9rZVdpZHRoOiBjb25maWcuYm9yZGVyV2lkdGgsXG4gICAgICAgICAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICBvd25lci5ncm91cC5hZGQgKCBvYmogKVxuICAgICAgICAgIG9iai5zZW5kVG9CYWNrICgpXG5cbiAgICAgICAgICBpZiAoIGNvbmZpZy5iYWNrZ3JvdW5kSW1hZ2UgIT0gdW5kZWZpbmVkIClcbiAgICAgICAgICAgICAgIHRoaXMudXBkYXRlQmFja2dyb3VuZEltYWdlICgpXG5cbiAgICAgICAgICBpZiAoIG9iai5jYW52YXMgIT0gdW5kZWZpbmVkIClcbiAgICAgICAgICAgICAgIG9iai5jYW52YXMucmVxdWVzdFJlbmRlckFsbCAoKVxuXG4gICAgIH1cblxuICAgICB1cGRhdGVCYWNrZ3JvdW5kSW1hZ2UgKCBwYXRoPzogc3RyaW5nIClcbiAgICAge1xuICAgICAgICAgIGlmICggYXJndW1lbnRzLmxlbmd0aCA9PSAwIClcbiAgICAgICAgICAgICAgIHBhdGggPSB0aGlzLmNvbmZpZy5iYWNrZ3JvdW5kSW1hZ2VcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICB0aGlzLmNvbmZpZy5iYWNrZ3JvdW5kSW1hZ2UgPSBwYXRoXG5cbiAgICAgICAgICBpZiAoIHR5cGVvZiBwYXRoID09IFwic3RyaW5nXCIgJiYgcGF0aC5sZW5ndGggPiAwIClcbiAgICAgICAgICAgICAgIGZhYnJpYy51dGlsLmxvYWRJbWFnZSAoIHBhdGgsIHRoaXMub25fcGF0dGVybi5iaW5kICh0aGlzKSApXG4gICAgIH1cblxuICAgICBwcml2YXRlIG9uX3BhdHRlcm4gKCBkaW1nOiBIVE1MSW1hZ2VFbGVtZW50IClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHsgb3duZXIgfSA9IHRoaXNcblxuICAgICAgICAgIGNvbnN0IGZhY3RvciA9IGRpbWcud2lkdGggPCBkaW1nLmhlaWdodFxuICAgICAgICAgICAgICAgICAgICAgICAgID8gb3duZXIuZGlzcGxheVNpemUgKCkgLyBkaW1nLndpZHRoXG4gICAgICAgICAgICAgICAgICAgICAgICAgOiBvd25lci5kaXNwbGF5U2l6ZSAoKSAvIGRpbWcuaGVpZ2h0XG5cbiAgICAgICAgICA7KHRoaXMub2JqZWN0IGFzIGFueSkuc2V0ICh7XG4gICAgICAgICAgICAgICBmaWxsOiBuZXcgZmFicmljLlBhdHRlcm4gKHtcbiAgICAgICAgICAgICAgICAgICAgc291cmNlOiBkaW1nLFxuICAgICAgICAgICAgICAgICAgICByZXBlYXQ6IFwibm8tcmVwZWF0XCIsXG4gICAgICAgICAgICAgICAgICAgIHBhdHRlcm5UcmFuc2Zvcm06IFtcbiAgICAgICAgICAgICAgICAgICAgICAgICBmYWN0b3IsIDAsIDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgZmFjdG9yLCAwLCAwLFxuICAgICAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgICB9KVxuICAgICAgICAgIH0pXG4gICAgICAgICAgLnNldENvb3JkcyAoKVxuXG4gICAgICAgICAgaWYgKCB0aGlzLm9iamVjdC5jYW52YXMgKVxuICAgICAgICAgICAgICAgdGhpcy5vYmplY3QuY2FudmFzLnJlbmRlckFsbCAoKVxuICAgICB9XG59XG4iLCJcbmltcG9ydCB7IEdlb21ldHJ5IH0gZnJvbSBcIi4uL2dlb21ldHJ5LmpzXCJcbmltcG9ydCB7IEN0b3IgYXMgRGF0YUN0b3IgfSBmcm9tIFwiLi4vLi4vLi4vRGF0YS9pbmRleC5qc1wiXG5cbmRlY2xhcmUgZ2xvYmFsXG57XG4gICAgIGludGVyZmFjZSAkU2hhcGVFdmVudHMgPEQgZXh0ZW5kcyAkTm9kZSA9IGFueT5cbiAgICAge1xuICAgICAgICAgIG9uQ3JlYXRlOiAoIGVudGl0eTogRCwgYXNwZWN0OiBTaGFwZSApID0+IHZvaWQsXG4gICAgICAgICAgb25EZWxldGU6ICggZW50aXR5OiBELCBzaGFwZTogU2hhcGUgKSA9PiB2b2lkLFxuICAgICAgICAgIG9uVG91Y2g6ICggYXNwZWN0OiBTaGFwZSApID0+IHZvaWRcbiAgICAgfVxuXG4gICAgIGludGVyZmFjZSAkU2hhcGUgPEQgZXh0ZW5kcyAkVGhpbmcgPSAkVGhpbmc+IGV4dGVuZHMgJE5vZGUsICRHZW9tZXRyeSwgJFNoYXBlRXZlbnRzXG4gICAgIHtcbiAgICAgICAgICBjb250ZXh0OiBcImNvbmNlcHQtYXNwZWN0XCJcblxuICAgICAgICAgIGRhdGE6IERcblxuICAgICAgICAgIG1pblNpemUgICA6IG51bWJlclxuICAgICAgICAgIHNpemVPZmZzZXQ6IG51bWJlclxuICAgICAgICAgIHNpemVGYWN0b3I6IG51bWJlclxuICAgICB9XG59XG5cbmV4cG9ydCB0eXBlIEN0b3IgPERhdGEgZXh0ZW5kcyAkU2hhcGUgPSAkU2hhcGUsIFQgZXh0ZW5kcyBTaGFwZSA9IFNoYXBlPiA9IERhdGFDdG9yIDxEYXRhLCBUPlxuXG5leHBvcnQgY2xhc3MgU2hhcGUgPCQgZXh0ZW5kcyAkU2hhcGUgPSAkU2hhcGU+XG57XG4gICAgIGRlZmF1bHRDb25maWcgKCk6ICRTaGFwZVxuICAgICB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgIGNvbnRleHQ6IFwiY29uY2VwdC1hc3BlY3RcIixcbiAgICAgICAgICAgICAgIHR5cGUgICA6IFwic2hhcGVcIixcbiAgICAgICAgICAgICAgIGlkICAgICA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgIGRhdGEgICA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgIHggICAgICA6IDAsXG4gICAgICAgICAgICAgICB5ICAgICAgOiAwLFxuICAgICAgICAgICAgICAgLy9zaXplICAgICAgOiAyMCxcbiAgICAgICAgICAgICAgIG1pblNpemUgICA6IDEsXG4gICAgICAgICAgICAgICBzaXplRmFjdG9yOiAxLFxuICAgICAgICAgICAgICAgc2l6ZU9mZnNldDogMCxcblxuICAgICAgICAgICAgICAgc2hhcGUgICAgICAgICAgIDogXCJjaXJjbGVcIixcbiAgICAgICAgICAgICAgIGJvcmRlckNvbG9yICAgICA6IFwiZ3JheVwiLFxuICAgICAgICAgICAgICAgYm9yZGVyV2lkdGggICAgIDogNSxcblxuICAgICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yIDogXCJ0cmFuc3BhcmVudFwiLFxuICAgICAgICAgICAgICAgYmFja2dyb3VuZEltYWdlIDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgYmFja2dyb3VuZFJlcGVhdDogZmFsc2UsXG5cbiAgICAgICAgICAgICAgIG9uQ3JlYXRlICAgICAgICA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgIG9uRGVsZXRlICAgICAgICA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgIG9uVG91Y2ggICAgICAgICA6IHVuZGVmaW5lZCxcbiAgICAgICAgICB9XG4gICAgIH1cblxuICAgICByZWFkb25seSBjb25maWc6ICRcblxuICAgICBncm91cCA9IHVuZGVmaW5lZCBhcyBmYWJyaWMuR3JvdXBcblxuICAgICByZWFkb25seSBiYWNrZ3JvdW5kOiBHZW9tZXRyeVxuICAgICByZWFkb25seSBib3JkZXI6IEdlb21ldHJ5XG5cbiAgICAgY29uc3RydWN0b3IgKCBkYXRhOiAkIClcbiAgICAge1xuICAgICAgICAgIHRoaXMuYmFja2dyb3VuZCA9IHVuZGVmaW5lZFxuICAgICAgICAgIHRoaXMuYm9yZGVyID0gdW5kZWZpbmVkXG4gICAgICAgICAgdGhpcy5jb25maWcgPSB7XG4gICAgICAgICAgICAgICAuLi4gdGhpcy5kZWZhdWx0Q29uZmlnICgpLFxuICAgICAgICAgICAgICAgLi4uIGRhdGFcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjb25zdCB7IGNvbmZpZyB9ID0gdGhpc1xuXG4gICAgICAgICAgY29uc3QgZ3JvdXAgPSB0aGlzLmdyb3VwID0gbmV3IGZhYnJpYy5Hcm91cCAoIFtdLFxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHdpZHRoICAgICAgOiB0aGlzLmRpc3BsYXlTaXplICgpLFxuICAgICAgICAgICAgICAgaGVpZ2h0ICAgICA6IHRoaXMuZGlzcGxheVNpemUgKCksXG4gICAgICAgICAgICAgICBsZWZ0ICAgICAgIDogY29uZmlnLngsXG4gICAgICAgICAgICAgICB0b3AgICAgICAgIDogY29uZmlnLnksXG4gICAgICAgICAgICAgICBoYXNCb3JkZXJzIDogdHJ1ZSxcbiAgICAgICAgICAgICAgIGhhc0NvbnRyb2xzOiB0cnVlLFxuICAgICAgICAgICAgICAgb3JpZ2luWCAgICA6IFwiY2VudGVyXCIsXG4gICAgICAgICAgICAgICBvcmlnaW5ZICAgIDogXCJjZW50ZXJcIixcbiAgICAgICAgICB9KVxuXG4gICAgICAgICAgOyh0aGlzLmJhY2tncm91bmQgYXMgR2VvbWV0cnkpID0gbmV3IEdlb21ldHJ5ICggdGhpcyApXG5cbiAgICAgICAgICBncm91cC5zZXRDb29yZHMgKClcbiAgICAgfVxuXG4gICAgIGRpc3BsYXlTaXplICgpXG4gICAgIHtcbiAgICAgICAgICBjb25zdCBjb25maWcgPSB0aGlzLmNvbmZpZ1xuXG4gICAgICAgICAgdmFyIHNpemUgPSAoMSArIGNvbmZpZy5zaXplT2Zmc2V0KSAqIGNvbmZpZy5zaXplRmFjdG9yXG5cbiAgICAgICAgICBpZiAoIHNpemUgPCBjb25maWcubWluU2l6ZSApXG4gICAgICAgICAgICAgICBzaXplID0gY29uZmlnLm1pblNpemVcblxuICAgICAgICAgIHJldHVybiBzaXplIHx8IDFcbiAgICAgfVxuXG4gICAgIHVwZGF0ZVNpemUgKClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHsgZ3JvdXAsIGNvbmZpZyB9ID0gdGhpc1xuXG4gICAgICAgICAgaWYgKCB0aGlzLmJhY2tncm91bmQgKVxuICAgICAgICAgICAgICAgdGhpcy5iYWNrZ3JvdW5kLnVwZGF0ZVNpemUgKClcblxuICAgICAgICAgIGlmICggdGhpcy5ib3JkZXIgKVxuICAgICAgICAgICAgICAgdGhpcy5ib3JkZXIudXBkYXRlU2l6ZSAoKVxuXG4gICAgICAgICAgZ3JvdXAuc2V0ICh7XG4gICAgICAgICAgICAgICB3aWR0aCA6IHRoaXMuZGlzcGxheVNpemUgKCksXG4gICAgICAgICAgICAgICBoZWlnaHQ6IHRoaXMuZGlzcGxheVNpemUgKCksXG4gICAgICAgICAgfSlcblxuICAgICAgICAgIGlmICggZ3JvdXAuY2FudmFzIClcbiAgICAgICAgICAgICAgIGdyb3VwLmNhbnZhcy5yZXF1ZXN0UmVuZGVyQWxsICgpXG4gICAgIH1cblxuICAgICBjb29yZHMgKClcbiAgICAge1xuICAgICAgICAgIHJldHVybiB0aGlzLmdyb3VwLmdldENvb3JkcyAoKVxuICAgICB9XG5cbiAgICAgc2V0QmFja2dyb3VuZCAoIG9wdGlvbnM6IFBhcnRpYWwgPCRHZW9tZXRyeT4gKVxuICAgICB7XG4gICAgICAgICAgT2JqZWN0LmFzc2lnbiAoIHRoaXMuY29uZmlnLCBvcHRpb25zIClcblxuICAgICAgICAgIHRoaXMuYmFja2dyb3VuZC51cGRhdGUgKCBvcHRpb25zIClcblxuICAgICAgICAgIHRoaXMudXBkYXRlU2l6ZSAoKVxuICAgICB9XG5cbiAgICAgc2V0UG9zaXRpb24gKCB4OiBudW1iZXIsIHk6IG51bWJlciApXG4gICAgIHtcbiAgICAgICAgICBjb25zdCB7IGdyb3VwLCBjb25maWcgfSA9IHRoaXNcblxuICAgICAgICAgIGNvbmZpZy54ID0geFxuICAgICAgICAgIGNvbmZpZy55ID0geVxuICAgICAgICAgIGdyb3VwLnNldCAoeyBsZWZ0OiB4LCB0b3AgOiB5IH0pLnNldENvb3JkcyAoKVxuXG4gICAgICAgICAgaWYgKCBncm91cC5jYW52YXMgKVxuICAgICAgICAgICAgICAgZ3JvdXAuY2FudmFzLnJlcXVlc3RSZW5kZXJBbGwgKClcbiAgICAgfVxuXG4gICAgIGhvdmVyICggdXA6IGJvb2xlYW4gKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgdGFyZ2V0ID0gdGhpcy5iYWNrZ3JvdW5kICE9IHVuZGVmaW5lZFxuICAgICAgICAgICAgICAgICAgICAgICAgID8gdGhpcy5iYWNrZ3JvdW5kLm9iamVjdFxuICAgICAgICAgICAgICAgICAgICAgICAgIDogdGhpcy5ncm91cFxuXG4gICAgICAgICAgdGFyZ2V0LnNldFNoYWRvdyggJ3JnYmEoMCwwLDAsMC4zKScgKVxuXG4gICAgICAgICAgZmFicmljLnV0aWwuYW5pbWF0ZSh7XG4gICAgICAgICAgICAgICBzdGFydFZhbHVlOiB1cCA/IDAgOiAxLFxuICAgICAgICAgICAgICAgZW5kVmFsdWUgIDogdXAgPyAxIDogMCxcbiAgICAgICAgICAgICAgIGVhc2luZyAgICA6IGZhYnJpYy51dGlsLmVhc2UuZWFzZU91dEN1YmljLFxuICAgICAgICAgICAgICAgYnlWYWx1ZSAgIDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgZHVyYXRpb24gIDogMTAwLFxuICAgICAgICAgICAgICAgb25DaGFuZ2UgIDogKCB2YWx1ZTogbnVtYmVyICkgPT5cbiAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgb2Zmc2V0ID0gMSAqIHZhbHVlXG5cbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0LnNldFNoYWRvdyggYCR7IG9mZnNldCB9cHggJHsgb2Zmc2V0IH1weCAkeyAxMCAqIHZhbHVlIH1weCByZ2JhKDAsMCwwLDAuMylgIClcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0LnNjYWxlKCAxICsgMC4xICogdmFsdWUgKVxuICAgICAgICAgICAgICAgICAgICB0YXJnZXQuY2FudmFzLnJlcXVlc3RSZW5kZXJBbGwgKClcbiAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSlcbiAgICAgfVxuXG4gICAgIHRvSnNvbiAoKVxuICAgICB7XG4gICAgICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5ICggdGhpcy5jb25maWcgKVxuICAgICB9XG59XG4iLCIvLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi90eXBpbmdzLmQudHNcIiAvPlxuLy9pbXBvcnQgKiBhcyBmYWJyaWMgZnJvbSBcImZhYnJpYy9mYWJyaWMtaW1wbFwiXG5cbmltcG9ydCB7IERhdGFiYXNlLCBGYWN0b3J5IH0gZnJvbSBcIi4uLy4uL0RhdGEvaW5kZXguanNcIlxuaW1wb3J0IHsgU2hhcGUgfSBmcm9tIFwiLi9FbGVtZW50L3NoYXBlLmpzXCJcbmltcG9ydCB7IFdyaXRhYmxlLCBPcHRpb25hbCB9IGZyb20gXCIuLi8uLi9MaWIvaW5kZXguanNcIlxuXG5cbmNvbnN0IENPTlRFWFQgPSBcImNvbmNlcHQtYXNwZWN0XCJcbmNvbnN0IGRiICAgICAgPSBuZXcgRGF0YWJhc2UgKClcbmNvbnN0IGZhY3RvcnkgPSBuZXcgRmFjdG9yeSA8U2hhcGU+ICggZGIgKVxuY29uc3QgQVNQRUNUICA9IFN5bWJvbC5mb3IgKCBcIkFTUEVDVFwiIClcblxuLy8gc3ZnRmFjdG9yeVxuLy8gaHRtbEZhY3Rvcnlcbi8vIGZhYnJpY0ZhY3RvcnlcblxuLy8gdWkuZmFjdG9yeS5zZXQgKCBbXCJjb25jZXB0LXVpXCIsIFwiYnV0dG9uXCIsIFwiaHRtbFwiICAsIFwiYnRuMVwiXSwgY3RvciApXG4vLyB1aS5mYWN0b3J5LnNldCAoIFtcImNvbmNlcHQtdWlcIiwgXCJidXR0b25cIiwgXCJzdmdcIiAgICwgXCJidG4xXCJdLCBjdG9yIClcbi8vIHVpLmZhY3Rvcnkuc2V0ICggW1wiY29uY2VwdC11aVwiLCBcImJ1dHRvblwiLCBcImZhYnJpY1wiLCBcImJ0bjFcIl0sIGN0b3IgKVxuXG50eXBlICRJbiA8JCBleHRlbmRzICRTaGFwZSA9ICRTaGFwZT4gPSBPcHRpb25hbCA8JCwgXCJjb250ZXh0XCI+XG5cbi8qKlxuICogQXNzaWduZSBzaSBiZXNvaW4gbGUgY29udGV4dGUgXCJhc3BlY3RcIiBhdSBub2V1ZFxuICovXG5mdW5jdGlvbiBub3JtYWxpemUgKCBub2RlOiAkSW4gKVxue1xuICAgICBpZiAoIFwiY29udGV4dFwiIGluIG5vZGUgKVxuICAgICB7XG4gICAgICAgICAgaWYgKCBub2RlLmNvbnRleHQgIT09IENPTlRFWFQgKVxuICAgICAgICAgICAgICAgdGhyb3cgXCJCYWQgY29udGV4dCB2YWx1ZVwiXG4gICAgIH1cbiAgICAgZWxzZVxuICAgICB7XG4gICAgICAgICAgKG5vZGUgYXMgV3JpdGFibGUgPCRTaGFwZT4pLmNvbnRleHQgPSBDT05URVhUXG4gICAgIH1cblxuICAgICByZXR1cm4gbm9kZSBhcyAkU2hhcGVcbn1cblxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0QXNwZWN0IDxUIGV4dGVuZHMgU2hhcGU+ICggb2JqOiAkTm9kZSB8IFNoYXBlIHwgZmFicmljLk9iamVjdCApOiBUIHwgdW5kZWZpbmVkXG57XG4gICAgIGlmICggb2JqID09IHVuZGVmaW5lZCApXG4gICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZFxuXG4gICAgIGlmICggb2JqIGluc3RhbmNlb2YgU2hhcGUgKVxuICAgICAgICAgIHJldHVybiBvYmogYXMgVFxuXG4gICAgIGlmICggb2JqIGluc3RhbmNlb2YgZmFicmljLk9iamVjdCApXG4gICAgICAgICAgcmV0dXJuIG9iaiBbQVNQRUNUXVxuXG4gICAgIGlmICggZmFjdG9yeS5pblN0b2NrICggQ09OVEVYVCwgb2JqLnR5cGUsIG9iai5pZCApIClcbiAgICAgICAgICByZXR1cm4gZmFjdG9yeS5tYWtlICggQ09OVEVYVCwgb2JqLnR5cGUsIG9iai5pZCApXG5cbiAgICAgY29uc3Qgb3B0aW9ucyAgPSBvYmouY29udGV4dCA9PSBDT05URVhUXG4gICAgICAgICAgICAgICAgICAgID8gb2JqIGFzICRTaGFwZVxuICAgICAgICAgICAgICAgICAgICA6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICBjb250ZXh0OiBDT05URVhULFxuICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGUgICA6IG9iai50eXBlLFxuICAgICAgICAgICAgICAgICAgICAgICAgIGlkICAgICA6IG9iai5pZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhICAgOiBvYmosXG4gICAgICAgICAgICAgICAgICAgIH0gYXMgJFNoYXBlXG5cbiAgICAgaWYgKCAhIGlzRmluaXRlIChvcHRpb25zLngpIClcbiAgICAgICAgICBvcHRpb25zLnggPSAwXG5cbiAgICAgaWYgKCAhIGlzRmluaXRlIChvcHRpb25zLnkpIClcbiAgICAgICAgICBvcHRpb25zLnkgPSAwXG5cbiAgICAgY29uc3Qgc2hhcGUgPSBmYWN0b3J5Lm1ha2UgKCBvcHRpb25zIClcblxuICAgICAvLyBzaGFwZS5ldmVudHMgPSBhcmd1bWVudHMuZXZlbnRzXG4gICAgIC8vIE9iamVjdC5hc3NpZ24gKCBzaGFwZSwgZXZlbnRzIClcblxuICAgICAvL3NoYXBlLmluaXQgKClcbiAgICAgc2hhcGUuZ3JvdXAgW0FTUEVDVF0gPSBzaGFwZVxuXG4gICAgIGlmICggc2hhcGUuY29uZmlnLm9uQ3JlYXRlIClcbiAgICAgICAgICBzaGFwZS5jb25maWcub25DcmVhdGUgKCBzaGFwZS5jb25maWcuZGF0YSwgc2hhcGUgKVxuXG4gICAgIHJldHVybiBzaGFwZSBhcyBUXG59XG5cblxuZXhwb3J0IGZ1bmN0aW9uIHNldEFzcGVjdCA8JCBleHRlbmRzICRTaGFwZT4gKCBub2RlOiAkSW4gPCQ+IClcbntcbiAgICAgZGIuc2V0ICggbm9ybWFsaXplICggbm9kZSApIClcbn1cblxuXG5leHBvcnQgZnVuY3Rpb24gZGVmaW5lQXNwZWN0ICggY3RvcjogbmV3ICggZGF0YTogJFNoYXBlICkgPT4gU2hhcGUsIHR5cGU6IHN0cmluZyApXG57XG4gICAgIGZhY3RvcnkuX2RlZmluZSAoIGN0b3IsIFtDT05URVhULCB0eXBlXSApXG59XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi9ub2Rlcy5kLnRzXCIgLz5cblxuaW1wb3J0IHsgRGF0YWJhc2UgfSBmcm9tIFwiLi4vRGF0YS9pbmRleC5qc1wiXG5pbXBvcnQgeyBPcHRpb25hbCB9IGZyb20gXCIuLi9MaWIvaW5kZXguanNcIlxuXG5cbmRlY2xhcmUgZ2xvYmFsXG57XG4gICAgIGNvbnN0IENPTlRFWFRfREFUQTogXCJjb25jZXB0LWRhdGFcIlxuICAgICAvLyBmdW5jdGlvbiBub2RlIDxUIGV4dGVuZHMgJElucHV0Tm9kZT4gKCB0eXBlOiBzdHJpbmcsIGlkOiBzdHJpbmcgKSAgICA6ICRPdXRwdXROb2RlIDxUPlxuICAgICAvLyBmdW5jdGlvbiBub2RlIDxUIGV4dGVuZHMgJElucHV0Tm9kZT4gKCB0eXBlOiBzdHJpbmcsIGRlc2NyaXB0aW9uOiBUICk6ICRPdXRwdXROb2RlIDxUPlxuICAgICAvLyBmdW5jdGlvbiBub2RlIDxUIGV4dGVuZHMgJElucHV0Tm9kZT4gKCBkZXNjcmlwdGlvbjogVCApICAgICAgICAgICAgICA6ICRPdXRwdXROb2RlIDxUPlxufVxuT2JqZWN0LmRlZmluZVByb3BlcnR5ICggZ2xvYmFsVGhpcywgXCJDT05URVhUX0RBVEFcIiwge1xuICAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICAgICB3cml0YWJsZTogZmFsc2UsXG4gICAgIHZhbHVlOiBcImNvbmNlcHQtZGF0YVwiXG59KVxuXG5cbnR5cGUgJElucHV0Tm9kZSA9IE9wdGlvbmFsIDwkVGhpbmcsIFwiY29udGV4dFwiIHwgXCJ0eXBlXCI+XG50eXBlICRPdXRwdXROb2RlIDxJbiBleHRlbmRzICRJbnB1dE5vZGU+ID0gUmVxdWlyZWQgPEluPlxuXG5cbmNvbnN0IGRiID0gbmV3IERhdGFiYXNlICgpXG5cblxuZXhwb3J0IGZ1bmN0aW9uIG5vZGUgPFQgZXh0ZW5kcyAkSW5wdXROb2RlPiAoIHR5cGU6IHN0cmluZywgaWQ6IHN0cmluZyApICAgIDogJE91dHB1dE5vZGUgPFQ+XG5leHBvcnQgZnVuY3Rpb24gbm9kZSA8VCBleHRlbmRzICRJbnB1dE5vZGU+ICggdHlwZTogc3RyaW5nLCBkZXNjcmlwdGlvbjogVCApOiAkT3V0cHV0Tm9kZSA8VD5cbmV4cG9ydCBmdW5jdGlvbiBub2RlIDxUIGV4dGVuZHMgJFRoaW5nPiAgICAgKCBkZXNjcmlwdGlvbjogVCApICAgICAgICAgICAgICA6ICRUaGluZ1xuXG5leHBvcnQgZnVuY3Rpb24gbm9kZSAoIGE6IHN0cmluZyB8ICRJbnB1dE5vZGUsIGI/OiBzdHJpbmcgfCAkSW5wdXROb2RlICkgOiAkVGhpbmdcbntcbiAgICAgc3dpdGNoICggYXJndW1lbnRzLmxlbmd0aCApXG4gICAgIHtcbiAgICAgY2FzZSAxOiAvLyBkYXRhICggZGVzY3JpcHRpb24gKVxuXG4gICAgICAgICAgaWYgKCB0eXBlb2YgYSAhPSBcIm9iamVjdFwiIHx8IGEgPT0gbnVsbCB8fCBBcnJheS5pc0FycmF5IChhKSApXG4gICAgICAgICAgICAgICB0aHJvdyBgQmFkIGFyZ3VtZW50IFwiZGVzY3JpcHRpb25cIiA6ICR7IGEgfWBcblxuICAgICAgICAgIGIgPSBhXG4gICAgICAgICAgYSA9IGIudHlwZVxuXG4gICAgIGNhc2UgMjogLy8gZGF0YSAoIHR5cGUsIGlkICkgfCBkYXRhICggdHlwZSwgZGVzY3JpcHRpb24gKVxuXG4gICAgICAgICAgaWYgKCB0eXBlb2YgYSAhPSBcInN0cmluZ1wiIClcbiAgICAgICAgICAgICAgIHRocm93IGBCYWQgYXJndW1lbnQgXCJ0eXBlXCIgOiAkeyBhIH1gXG5cbiAgICAgICAgICBpZiAoIHR5cGVvZiBiID09IFwic3RyaW5nXCIgKVxuICAgICAgICAgICAgICAgcmV0dXJuIGRiLmdldCAoIENPTlRFWFRfREFUQSwgYSwgYiApXG5cbiAgICAgICAgICBpZiAoIHR5cGVvZiBiICE9IFwib2JqZWN0XCIgfHwgYiA9PSBudWxsIHx8IEFycmF5LmlzQXJyYXkgKGIpIClcbiAgICAgICAgICAgICAgIHRocm93IGBCYWQgYXJndW1lbnQgXCJkZXNjcmlwdGlvblwiIDogJHsgYiB9YFxuXG4gICAgICAgICAgOyhiIGFzIGFueSkuY29udGV4dCA9IENPTlRFWFRfREFUQVxuICAgICAgICAgIDsoYiBhcyBhbnkpLnR5cGUgPSBhXG4gICAgICAgICAgcmV0dXJuIGRiLnNldCAoIGIgYXMgJFRoaW5nIClcblxuICAgICBkZWZhdWx0OlxuICAgICAgICAgIHRocm93IGBCYWQgYXJndW1lbnRzOiAyIGFyZ3VtZW50cyBleHBlY3RlZCBidXQgJHsgYXJndW1lbnRzLmxlbmd0aCB9IHJlY2VpdmVkYFxuICAgICB9XG59XG5cbiIsIlxuaW1wb3J0ICogYXMgZGIgZnJvbSBcIi4uLy4uL2RhdGEuanNcIlxuaW1wb3J0IHsgU2hhcGUgfSBmcm9tIFwiLi9zaGFwZS5qc1wiXG5cbmV4cG9ydCB0eXBlIEJhZGdlUG9zaXRpb24gPSB7IGFuZ2xlOiBudW1iZXIsIG9mZnNldDogbnVtYmVyIH1cblxuZXhwb3J0IGNsYXNzIEJhZGdlIGV4dGVuZHMgU2hhcGVcbntcbiAgICAgcmVhZG9ubHkgb3duZXIgPSB1bmRlZmluZWQgYXMgU2hhcGVcblxuICAgICByZWFkb25seSBwb3NpdGlvbiA9IHsgYW5nbGU6IDAsIG9mZnNldDogMCB9XG5cbiAgICAgY29uc3RydWN0b3IgKCBvcHRpb25zOiAkU2hhcGUgKVxuICAgICB7XG4gICAgICAgICAgc3VwZXIgKCBvcHRpb25zIClcblxuICAgICAgICAgIGNvbnN0IHsgZ3JvdXAgfSA9IHRoaXNcblxuICAgICAgICAgIGNvbnN0IHRoaXNkYXRhID0gdGhpcy5jb25maWcuZGF0YVxuICAgICAgICAgIGNvbnN0IGVudGl0eSA9IGRiLm5vZGUgPCRCYWRnZT4gKCB0aGlzZGF0YS50eXBlLCB0aGlzZGF0YS5pZCApXG5cbiAgICAgICAgICBjb25zdCB0ZXh0ID0gbmV3IGZhYnJpYy5UZXh0Ym94ICggZW50aXR5LmVtb2ppIHx8IFwiWFwiLCB7XG4gICAgICAgICAgICAgICBmb250U2l6ZTogdGhpcy5kaXNwbGF5U2l6ZSAoKSxcbiAgICAgICAgICAgICAgIG9yaWdpblggOiBcImNlbnRlclwiLFxuICAgICAgICAgICAgICAgb3JpZ2luWSA6IFwiY2VudGVyXCIsXG4gICAgICAgICAgICAgICBsZWZ0ICAgIDogZ3JvdXAubGVmdCxcbiAgICAgICAgICAgICAgIHRvcCAgICAgOiBncm91cC50b3AsXG4gICAgICAgICAgfSlcblxuICAgICAgICAgIGdyb3VwLmFkZFdpdGhVcGRhdGUgKCB0ZXh0IClcbiAgICAgfVxuXG4gICAgIGRpc3BsYXlTaXplICgpXG4gICAgIHtcbiAgICAgICAgICByZXR1cm4gMjBcbiAgICAgfVxuXG4gICAgIGF0dGFjaCAoIHRhcmdldDogU2hhcGUsIHBvcyA9IHt9IGFzIEJhZGdlUG9zaXRpb24gKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgeyByYW5kb20sIFBJIH0gPSBNYXRoXG5cbiAgICAgICAgICBpZiAoICEgaXNGaW5pdGUgKCBwb3MuYW5nbGUgKSApXG4gICAgICAgICAgICAgICBwb3MuYW5nbGUgPSByYW5kb20gKCkgKiBQSSAqIDJcblxuICAgICAgICAgIGlmICggISBpc0Zpbml0ZSAoIHBvcy5vZmZzZXQgKSApXG4gICAgICAgICAgICAgICBwb3Mub2Zmc2V0ID0gMC4xXG5cbiAgICAgICAgICA7KHRoaXMucG9zaXRpb24gYXMgQmFkZ2VQb3NpdGlvbikgPSB7IC4uLiBwb3MgfVxuXG4gICAgICAgICAgaWYgKCB0aGlzLm93bmVyICE9IHVuZGVmaW5lZCApXG4gICAgICAgICAgICAgICB0YXJnZXQuZ3JvdXAucmVtb3ZlICggdGhpcy5ncm91cCApXG5cbiAgICAgICAgICB0YXJnZXQuZ3JvdXAuYWRkICggdGhpcy5ncm91cCApXG5cbiAgICAgICAgICA7KHRoaXMub3duZXIgYXMgU2hhcGUpID0gdGFyZ2V0XG5cbiAgICAgICAgICB0aGlzLnVwZGF0ZVBvc2l0aW9uICgpXG4gICAgIH1cblxuICAgICB1cGRhdGVQb3NpdGlvbiAoKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgeyBwb3NpdGlvbjogcG9zLCBvd25lciB9ID0gdGhpc1xuXG4gICAgICAgICAgaWYgKCBvd25lciA9PSB1bmRlZmluZWQgKVxuICAgICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgICBjb25zdCB7IHJhbmRvbSwgUEksIGNvcywgc2luIH0gPSBNYXRoXG5cbiAgICAgICAgICBjb25zdCByYWQgICAgPSBwb3MuYW5nbGUgfHwgcmFuZG9tICgpICogUEkgKiAyXG4gICAgICAgICAgY29uc3QgeCAgICAgID0gc2luIChyYWQpXG4gICAgICAgICAgY29uc3QgeSAgICAgID0gY29zIChyYWQpXG4gICAgICAgICAgY29uc3QgcyAgICAgID0gb3duZXIuZGlzcGxheVNpemUgKCkgLyAyXG4gICAgICAgICAgY29uc3Qgb2Zmc2V0ID0gdHlwZW9mIHBvcy5vZmZzZXQgPT0gXCJudW1iZXJcIlxuICAgICAgICAgICAgICAgICAgICAgICAgID8gdGhpcy5kaXNwbGF5U2l6ZSAoKSAqIHBvcy5vZmZzZXRcbiAgICAgICAgICAgICAgICAgICAgICAgICA6IHRoaXMuZGlzcGxheVNpemUgKCkgKiAwLjFcblxuICAgICAgICAgIHRoaXMuc2V0UG9zaXRpb24gKCB4ICogKHMgKyBvZmZzZXQpLCB5ICogKHMgKyBvZmZzZXQpIClcbiAgICAgfVxufVxuIiwiXG5pbXBvcnQgeyBHZW9tZXRyeSB9IGZyb20gXCIuLi8uLi8uLi9MaWIvaW5kZXguanNcIlxuaW1wb3J0IHsgZ2V0QXNwZWN0IH0gZnJvbSBcIi4uL2RiLmpzXCJcbmltcG9ydCB7IFNoYXBlIH0gZnJvbSBcIi4vc2hhcGUuanNcIlxuXG5leHBvcnQgY2xhc3MgQ29udGFpbmVyIDwkIGV4dGVuZHMgJFNoYXBlIDwkR3JvdXA+ID0gJFNoYXBlIDwkR3JvdXA+PiBleHRlbmRzIFNoYXBlIDwkPlxue1xuICAgICByZWFkb25seSBjaGlsZHJlbjogU2hhcGUgW11cblxuICAgICBkaXNwbGF5X3NpemUgPSAxXG5cbiAgICAgY29uc3RydWN0b3IgKCBvcHRpb25zOiAkIClcbiAgICAge1xuICAgICAgICAgIHN1cGVyICggb3B0aW9ucyApXG4gICAgICAgICAgdGhpcy5jaGlsZHJlbiA9IFtdXG4gICAgIC8vIH1cblxuICAgICAvLyBpbml0ICgpXG4gICAgIC8vIHtcbiAgICAgLy8gICAgICBzdXBlci5pbml0ICgpXG5cbiAgICAgICAgICBjb25zdCBlbnRpdHkgPSB0aGlzLmNvbmZpZy5kYXRhXG5cbiAgICAgICAgICAvL2ZvciAoIGNvbnN0IGNoaWxkIG9mIE9iamVjdC52YWx1ZXMgKCBlbnRpdHkuY2hpbGRyZW4gKSApXG4gICAgICAgICAgZm9yICggY29uc3QgY2hpbGQgb2YgT2JqZWN0LnZhbHVlcyAoIGVudGl0eS5pdGVtcyApIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBjb25zdCBhID0gZ2V0QXNwZWN0ICggY2hpbGQgKVxuICAgICAgICAgICAgICAgLy9hLmluaXQgKClcbiAgICAgICAgICAgICAgIHRoaXMuYWRkICggYSApXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdGhpcy5wYWNrICgpXG4gICAgIH1cblxuICAgICBkaXNwbGF5U2l6ZSAoKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgY29uZmlnID0gdGhpcy5jb25maWdcblxuICAgICAgICAgIHZhciBzaXplID0gKHRoaXMuZGlzcGxheV9zaXplICsgY29uZmlnLnNpemVPZmZzZXQpICogY29uZmlnLnNpemVGYWN0b3JcblxuICAgICAgICAgIGlmICggc2l6ZSA8IGNvbmZpZy5taW5TaXplIClcbiAgICAgICAgICAgICAgIHNpemUgPSBjb25maWcubWluU2l6ZVxuXG4gICAgICAgICAgcmV0dXJuIHNpemUgfHwgMVxuICAgICB9XG5cbiAgICAgYWRkICggY2hpbGQ6IFNoYXBlIClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHsgZ3JvdXAgfSA9IHRoaXNcblxuICAgICAgICAgIHRoaXMuY2hpbGRyZW4ucHVzaCAoIGNoaWxkIClcblxuICAgICAgICAgIGlmICggZ3JvdXAgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGdyb3VwLmFkZCAoIGNoaWxkLmdyb3VwIClcbiAgICAgICAgICAgICAgIGdyb3VwLnNldENvb3JkcyAoKVxuICAgICAgICAgIH1cbiAgICAgfVxuXG4gICAgIHBhY2sgKClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHsgZ3JvdXAsIGNoaWxkcmVuLCBjb25maWcgfSA9IHRoaXNcblxuICAgICAgICAgIGNvbnN0IHBvc2l0aW9ucyA9IFtdIGFzIEdlb21ldHJ5LkNpcmNsZSBbXVxuXG4gICAgICAgICAgZm9yICggY29uc3QgYyBvZiBjaGlsZHJlbiApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgY29uc3QgZyA9IGMuZ3JvdXBcbiAgICAgICAgICAgICAgIGNvbnN0IHIgPSAoZy53aWR0aCA+IGcuaGVpZ2h0ID8gZy53aWR0aCA6IGcuaGVpZ2h0KSAvIDJcbiAgICAgICAgICAgICAgIHBvc2l0aW9ucy5wdXNoICggeyB4OiBnLmxlZnQsIHk6IGcudG9wLCByOiByICsgNiB9IClcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjb25zdCBzaXplID0gIEdlb21ldHJ5LnBhY2tFbmNsb3NlICggcG9zaXRpb25zICkgKiAyXG5cbiAgICAgICAgICBmb3IgKCB2YXIgaSA9IDAgOyBpIDwgY2hpbGRyZW4ubGVuZ3RoIDsgaSsrIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBjb25zdCBnID0gY2hpbGRyZW4gW2ldLmdyb3VwXG4gICAgICAgICAgICAgICBjb25zdCBwID0gcG9zaXRpb25zIFtpXVxuXG4gICAgICAgICAgICAgICBnLmxlZnQgPSBwLnhcbiAgICAgICAgICAgICAgIGcudG9wICA9IHAueVxuXG4gICAgICAgICAgICAgICBncm91cC5hZGQgKCBnIClcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB0aGlzLmRpc3BsYXlfc2l6ZSA9IHNpemUgKyBjb25maWcuc2l6ZU9mZnNldFxuXG4gICAgICAgICAgdGhpcy51cGRhdGVTaXplICgpXG4gICAgIH1cblxufVxuXG4iLCJcblxuXG5leHBvcnQgY29uc3QgeG5vZGUgPSAoKCkgPT5cbntcbiAgICAgY29uc3Qgc3ZnX25hbWVzID0gWyBcInN2Z1wiLCBcImdcIiwgXCJsaW5lXCIsIFwiY2lyY2xlXCIsIFwicGF0aFwiLCBcInRleHRcIiBdXG5cbiAgICAgZnVuY3Rpb24gY3JlYXRlIChcbiAgICAgICAgICBuYW1lOiBrZXlvZiBKU1guSW50cmluc2ljSFRNTEVsZW1lbnRzLFxuICAgICAgICAgIHByb3BzOiBhbnksXG4gICAgICAgICAgLi4uY2hpbGRyZW46IFsgSFRNTEVsZW1lbnQgfCBzdHJpbmcgfCBhbnlbXSBdXG4gICAgICk6IEhUTUxFbGVtZW50XG5cbiAgICAgZnVuY3Rpb24gY3JlYXRlIChcbiAgICAgICAgICBuYW1lOiBrZXlvZiBKU1guSW50cmluc2ljU1ZHRWxlbWVudHMsXG4gICAgICAgICAgcHJvcHM6IGFueSxcbiAgICAgICAgICAuLi5jaGlsZHJlbjogWyBIVE1MRWxlbWVudCB8IHN0cmluZyB8IGFueVtdIF1cbiAgICAgKTogU1ZHRWxlbWVudFxuXG4gICAgIGZ1bmN0aW9uIGNyZWF0ZSAoXG4gICAgICAgICAgbmFtZTogc3RyaW5nLFxuICAgICAgICAgIHByb3BzOiBhbnksXG4gICAgICAgICAgLi4uY2hpbGRyZW46IFsgSFRNTEVsZW1lbnQgfCBzdHJpbmcgfCBhbnlbXSBdXG4gICAgICk6IEhUTUxFbGVtZW50IHwgU1ZHRWxlbWVudFxuICAgICB7XG4gICAgICAgICAgcHJvcHMgPSBPYmplY3QuYXNzaWduICgge30sIHByb3BzIClcblxuICAgICAgICAgIGNvbnN0IGVsZW1lbnQgPSBzdmdfbmFtZXMuaW5kZXhPZiAoIG5hbWUgKSA9PT0gLTFcbiAgICAgICAgICAgICAgICAgICAgPyBkb2N1bWVudC5jcmVhdGVFbGVtZW50ICggbmFtZSApXG4gICAgICAgICAgICAgICAgICAgIDogZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TICggXCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiLCBuYW1lIClcblxuICAgICAgICAgIGNvbnN0IGNvbnRlbnQgPSBbXSBhcyBhbnlbXVxuXG4gICAgICAgICAgLy8gQ2hpbGRyZW5cblxuICAgICAgICAgIHdoaWxlICggY2hpbGRyZW4ubGVuZ3RoID4gMCApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgbGV0IGNoaWxkID0gY2hpbGRyZW4ucG9wKClcblxuICAgICAgICAgICAgICAgaWYgKCBBcnJheS5pc0FycmF5KCBjaGlsZCApIClcbiAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yICggdmFyIGkgPSAwIDsgaSAhPSBjaGlsZC5sZW5ndGggOyBpKysgKVxuICAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkcmVuLnB1c2goIGNoaWxkIFtpXSApXG4gICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnQucHVzaCggY2hpbGQgKVxuICAgICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHdoaWxlICggY29udGVudC5sZW5ndGggPiAwIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBsZXQgY2hpbGQgPSBjb250ZW50LnBvcCgpXG5cbiAgICAgICAgICAgICAgIGlmICggY2hpbGQgaW5zdGFuY2VvZiBOb2RlIClcbiAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5hcHBlbmRDaGlsZCggY2hpbGQgKVxuXG4gICAgICAgICAgICAgICBlbHNlIGlmICggdHlwZW9mIGNoaWxkID09IFwiYm9vbGVhblwiIHx8IGNoaWxkIClcbiAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5hcHBlbmRDaGlsZCggZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoIGNoaWxkLnRvU3RyaW5nKCkgKSApXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gQXR0cmlidXRlc1xuXG4gICAgICAgICAgY29uc3QgaXNBcnJheSA9IEFycmF5LmlzQXJyYXlcbiAgICAgICAgICBjb25zdCBjb252OiBSZWNvcmQgPHN0cmluZywgKHY6IGFueSkgPT4gc3RyaW5nPiA9XG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgY2xhc3M6ICggdiApID0+IGlzQXJyYXkgKHYpID8gdi5qb2luIChcIiBcIikgOiB2LFxuICAgICAgICAgICAgICAgc3R5bGU6ICggdiApID0+IGlzQXJyYXkgKHYpID8gdi5qb2luIChcIiBcIilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiB0eXBlb2YgdiA9PSBcIm9iamVjdFwiID8gb2JqZWN0VG9TdHlsZSAodilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiB2LFxuICAgICAgICAgICAgICAgLy8gc3ZnXG4gICAgICAgICAgICAgICBkOiAoIHYgKSA9PiBpc0FycmF5ICh2KSA/IHYuam9pbiAoXCIgXCIpIDogdixcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBmb3IgKCBjb25zdCBrZXkgaW4gcHJvcHMgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNvbnN0IHZhbHVlID0gcHJvcHNba2V5XVxuXG4gICAgICAgICAgICAgICBpZiAoIHR5cGVvZiB2YWx1ZSA9PSBcImZ1bmN0aW9uXCIgKVxuICAgICAgICAgICAgICAgICAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIgKCBrZXksIHZhbHVlIClcblxuICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBlbGVtZW50LnNldEF0dHJpYnV0ZSAoIGtleSwgKGNvbnZba2V5XSB8fCAodj0+dikpICh2YWx1ZSkgKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiBlbGVtZW50XG5cbiAgICAgICAgICBmdW5jdGlvbiBvYmplY3RUb1N0eWxlICggb2JqOiBvYmplY3QgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHZhciByZXN1bHQgPSBcIlwiXG5cbiAgICAgICAgICAgICAgIGZvciAoIGNvbnN0IGtleSBpbiBvYmogKVxuICAgICAgICAgICAgICAgICAgICByZXN1bHQgKz0ga2V5ICsgXCI6IFwiICsgb2JqIFtrZXldICsgXCI7IFwiXG5cbiAgICAgICAgICAgICAgIHJldHVybiByZXN1bHRcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBmdW5jdGlvbiBjYW1lbGl6ZSAoIHN0cjogc3RyaW5nIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICByZXR1cm4gc3RyLnJlcGxhY2UgKFxuICAgICAgICAgICAgICAgICAgICAvKD86W0EtWl18XFxiXFx3KS9nLFxuICAgICAgICAgICAgICAgICAgICAoIHdvcmQsIGluZGV4ICkgPT4gaW5kZXggPT0gMCA/IHdvcmQudG9Mb3dlckNhc2UoKSA6IHdvcmQudG9VcHBlckNhc2UoKVxuICAgICAgICAgICAgICAgKS5yZXBsYWNlKC9cXHMrL2csICcnKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBmdW5jdGlvbiB1bmNhbWVsaXplICggc3RyOiBzdHJpbmcgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHJldHVybiBzdHIudHJpbSAoKS5yZXBsYWNlIChcbiAgICAgICAgICAgICAgIC8vICAgLyg/PCEtKSg/OltBLVpdfFxcYlxcdykvZyxcbiAgICAgICAgICAgICAgICAgICAgLyg/OltBLVpdfFxcYlxcdykvZyxcbiAgICAgICAgICAgICAgICAgICAgKCB3b3JkLCBpbmRleCApID0+IGluZGV4ID09IDAgPyB3b3JkLnRvTG93ZXJDYXNlKCkgOiAnLScgKyB3b3JkLnRvTG93ZXJDYXNlKClcbiAgICAgICAgICAgICAgICkucmVwbGFjZSgvKD86XFxzK3xfKS9nLCAnJyk7XG4gICAgICAgICAgfVxuICAgICB9XG5cbiAgICAgcmV0dXJuIGNyZWF0ZVxuXG59KSAoKVxuXG5kZWNsYXJlIGdsb2JhbFxue1xuICAgICBleHBvcnQgbmFtZXNwYWNlIEpTWFxuICAgICB7XG4gICAgICAgICAgZXhwb3J0IHR5cGUgRWxlbWVudCA9IEhUTUxFbGVtZW50IHwgU1ZHRWxlbWVudFxuXG4gICAgICAgICAgZXhwb3J0IHR5cGUgSW50cmluc2ljRWxlbWVudHMgPSBJbnRyaW5zaWNIVE1MRWxlbWVudHMgJiBJbnRyaW5zaWNTVkdFbGVtZW50c1xuXG4gICAgICAgICAgZXhwb3J0IGludGVyZmFjZSBJbnRyaW5zaWNIVE1MRWxlbWVudHNcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBhICAgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgYWJiciAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGFkZHJlc3MgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBhcmVhICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgYXJ0aWNsZSAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGFzaWRlICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBhdWRpbyAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgYiAgICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGJhc2UgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBiZGkgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgYmRvICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGJpZyAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBibG9ja3F1b3RlOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgYm9keSAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGJyICAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBidXR0b24gICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgY2FudmFzICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGNhcHRpb24gICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBjaXRlICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgY29kZSAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGNvbCAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBjb2xncm91cCAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZGF0YSAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGRhdGFsaXN0ICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBkZCAgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZGVsICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGRldGFpbHMgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBkZm4gICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZGlhbG9nICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGRpdiAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBkbCAgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZHQgICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGVtICAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBlbWJlZCAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZmllbGRzZXQgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGZpZ2NhcHRpb246IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBmaWd1cmUgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZm9vdGVyICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGZvcm0gICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBoMSAgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgaDIgICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGgzICAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBoNCAgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgaDUgICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGg2ICAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBoZWFkICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgaGVhZGVyICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGhncm91cCAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBociAgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgaHRtbCAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGkgICAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBpZnJhbWUgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgaW1nICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGlucHV0ICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBpbnMgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAga2JkICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGtleWdlbiAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBsYWJlbCAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgbGVnZW5kICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGxpICAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBsaW5rICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgbWFpbiAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIG1hcCAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBtYXJrICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgbWVudSAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIG1lbnVpdGVtICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBtZXRhICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgbWV0ZXIgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIG5hdiAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBub3NjcmlwdCAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgb2JqZWN0ICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIG9sICAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBvcHRncm91cCAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgb3B0aW9uICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIG91dHB1dCAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBwICAgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgcGFyYW0gICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHBpY3R1cmUgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBwcmUgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgcHJvZ3Jlc3MgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHEgICAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBycCAgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgcnQgICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHJ1YnkgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBzICAgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgc2FtcCAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHNjcmlwdCAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBzZWN0aW9uICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgc2VsZWN0ICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHNsb3QgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBzbWFsbCAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgc291cmNlICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHNwYW4gICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBzdHJvbmcgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgc3R5bGUgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHN1YiAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBzdW1tYXJ5ICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgc3VwICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHRhYmxlICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICB0Ym9keSAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgdGQgICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHRleHRhcmVhICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICB0Zm9vdCAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgdGggICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHRoZWFkICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICB0aW1lICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgdGl0bGUgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHRyICAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICB0cmFjayAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgdSAgICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHVsICAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBcInZhclwiICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICB2aWRlbyAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgd2JyICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBleHBvcnQgaW50ZXJmYWNlIEludHJpbnNpY1NWR0VsZW1lbnRzXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgc3ZnICAgICAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgYW5pbWF0ZSAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgY2lyY2xlICAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgY2xpcFBhdGggICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZGVmcyAgICAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZGVzYyAgICAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZWxsaXBzZSAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZmVCbGVuZCAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZmVDb2xvck1hdHJpeCAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZmVDb21wb25lbnRUcmFuc2ZlcjogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZmVDb21wb3NpdGUgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZmVDb252b2x2ZU1hdHJpeCAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZmVEaWZmdXNlTGlnaHRpbmcgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZmVEaXNwbGFjZW1lbnRNYXAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZmVGbG9vZCAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZmVHYXVzc2lhbkJsdXIgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZmVJbWFnZSAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZmVNZXJnZSAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZmVNZXJnZU5vZGUgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZmVNb3JwaG9sb2d5ICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZmVPZmZzZXQgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZmVTcGVjdWxhckxpZ2h0aW5nIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZmVUaWxlICAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZmVUdXJidWxlbmNlICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZmlsdGVyICAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZm9yZWlnbk9iamVjdCAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZyAgICAgICAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgaW1hZ2UgICAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgbGluZSAgICAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgbGluZWFyR3JhZGllbnQgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgbWFya2VyICAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgbWFzayAgICAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgcGF0aCAgICAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgcGF0dGVybiAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgcG9seWdvbiAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgcG9seWxpbmUgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgcmFkaWFsR3JhZGllbnQgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgcmVjdCAgICAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgc3RvcCAgICAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgc3ltYm9sICAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgdGV4dCAgICAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgdHNwYW4gICAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgdXNlICAgICAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgIH1cbiAgICAgfVxuXG5cbiAgICAgaW50ZXJmYWNlIFBhdGhBdHRyaWJ1dGVzXG4gICAgIHtcbiAgICAgICAgICBkOiBzdHJpbmdcbiAgICAgfVxuXG4gICAgIHR5cGUgRXZlbnRIYW5kbGVyIDxFIGV4dGVuZHMgRXZlbnQ+ID0gKCBldmVudDogRSApID0+IHZvaWRcblxuICAgICB0eXBlIENsaXBib2FyZEV2ZW50SGFuZGxlciAgID0gRXZlbnRIYW5kbGVyPENsaXBib2FyZEV2ZW50PlxuICAgICB0eXBlIENvbXBvc2l0aW9uRXZlbnRIYW5kbGVyID0gRXZlbnRIYW5kbGVyPENvbXBvc2l0aW9uRXZlbnQ+XG4gICAgIHR5cGUgRHJhZ0V2ZW50SGFuZGxlciAgICAgICAgPSBFdmVudEhhbmRsZXI8RHJhZ0V2ZW50PlxuICAgICB0eXBlIEZvY3VzRXZlbnRIYW5kbGVyICAgICAgID0gRXZlbnRIYW5kbGVyPEZvY3VzRXZlbnQ+XG4gICAgIHR5cGUgS2V5Ym9hcmRFdmVudEhhbmRsZXIgICAgPSBFdmVudEhhbmRsZXI8S2V5Ym9hcmRFdmVudD5cbiAgICAgdHlwZSBNb3VzZUV2ZW50SGFuZGxlciAgICAgICA9IEV2ZW50SGFuZGxlcjxNb3VzZUV2ZW50PlxuICAgICB0eXBlIFRvdWNoRXZlbnRIYW5kbGVyICAgICAgID0gRXZlbnRIYW5kbGVyPFRvdWNoRXZlbnQ+XG4gICAgIHR5cGUgVUlFdmVudEhhbmRsZXIgICAgICAgICAgPSBFdmVudEhhbmRsZXI8VUlFdmVudD5cbiAgICAgdHlwZSBXaGVlbEV2ZW50SGFuZGxlciAgICAgICA9IEV2ZW50SGFuZGxlcjxXaGVlbEV2ZW50PlxuICAgICB0eXBlIEFuaW1hdGlvbkV2ZW50SGFuZGxlciAgID0gRXZlbnRIYW5kbGVyPEFuaW1hdGlvbkV2ZW50PlxuICAgICB0eXBlIFRyYW5zaXRpb25FdmVudEhhbmRsZXIgID0gRXZlbnRIYW5kbGVyPFRyYW5zaXRpb25FdmVudD5cbiAgICAgdHlwZSBHZW5lcmljRXZlbnRIYW5kbGVyICAgICA9IEV2ZW50SGFuZGxlcjxFdmVudD5cbiAgICAgdHlwZSBQb2ludGVyRXZlbnRIYW5kbGVyICAgICA9IEV2ZW50SGFuZGxlcjxQb2ludGVyRXZlbnQ+XG5cbiAgICAgaW50ZXJmYWNlIERPTUF0dHJpYnV0ZXNcbiAgICAge1xuICAgICAgICAgIFtldmVudDogc3RyaW5nXTogYW55XG5cbiAgICAgICAgICAvLyAjcmVnaW9uIEltYWdlIEV2ZW50c1xuICAgICAgICAgIG9uTG9hZD8gICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uTG9hZENhcHR1cmU/IDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRXJyb3I/ICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRXJyb3JDYXB0dXJlPzogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIC8vICNlbmRyZWdpb25cblxuICAgICAgICAgIC8vICNyZWdpb24gQ2xpcGJvYXJkIEV2ZW50c1xuICAgICAgICAgIG9uQ29weT8gICAgICAgIDogQ2xpcGJvYXJkRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Db3B5Q2FwdHVyZT8gOiBDbGlwYm9hcmRFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkN1dD8gICAgICAgICA6IENsaXBib2FyZEV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uQ3V0Q2FwdHVyZT8gIDogQ2xpcGJvYXJkRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25QYXN0ZT8gICAgICAgOiBDbGlwYm9hcmRFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblBhc3RlQ2FwdHVyZT86IENsaXBib2FyZEV2ZW50SGFuZGxlclxuICAgICAgICAgIC8vICNlbmRyZWdpb25cblxuICAgICAgICAgIC8vICNyZWdpb24gQ29tcG9zaXRpb24gRXZlbnRzXG4gICAgICAgICAgb25Db21wb3NpdGlvbkVuZD8gICAgICAgICAgOiBDb21wb3NpdGlvbkV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uQ29tcG9zaXRpb25FbmRDYXB0dXJlPyAgIDogQ29tcG9zaXRpb25FdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkNvbXBvc2l0aW9uU3RhcnQ/ICAgICAgICA6IENvbXBvc2l0aW9uRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Db21wb3NpdGlvblN0YXJ0Q2FwdHVyZT8gOiBDb21wb3NpdGlvbkV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uQ29tcG9zaXRpb25VcGRhdGU/ICAgICAgIDogQ29tcG9zaXRpb25FdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkNvbXBvc2l0aW9uVXBkYXRlQ2FwdHVyZT86IENvbXBvc2l0aW9uRXZlbnRIYW5kbGVyXG4gICAgICAgICAgLy8gI2VuZHJlZ2lvblxuXG4gICAgICAgICAgLy8gI3JlZ2lvbiBGb2N1cyBFdmVudHNcbiAgICAgICAgICBvbkZvY3VzPyAgICAgICA6IEZvY3VzRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Gb2N1c0NhcHR1cmU/OiBGb2N1c0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uQmx1cj8gICAgICAgIDogRm9jdXNFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkJsdXJDYXB0dXJlPyA6IEZvY3VzRXZlbnRIYW5kbGVyXG4gICAgICAgICAgLy8gI2VuZHJlZ2lvblxuXG4gICAgICAgICAgLy8gI3JlZ2lvbiBGb3JtIEV2ZW50c1xuICAgICAgICAgIG9uQ2hhbmdlPyAgICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25DaGFuZ2VDYXB0dXJlPyA6IEdlbmVyaWNFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbklucHV0PyAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uSW5wdXRDYXB0dXJlPyAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25TZWFyY2g/ICAgICAgICA6IEdlbmVyaWNFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblNlYXJjaENhcHR1cmU/IDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uU3VibWl0PyAgICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25TdWJtaXRDYXB0dXJlPyA6IEdlbmVyaWNFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkludmFsaWQ/ICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uSW52YWxpZENhcHR1cmU/OiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgLy8gI2VuZHJlZ2lvblxuXG4gICAgICAgICAgLy8gI3JlZ2lvbiBLZXlib2FyZCBFdmVudHNcbiAgICAgICAgICBvbktleURvd24/ICAgICAgICA6IEtleWJvYXJkRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25LZXlEb3duQ2FwdHVyZT8gOiBLZXlib2FyZEV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uS2V5UHJlc3M/ICAgICAgIDogS2V5Ym9hcmRFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbktleVByZXNzQ2FwdHVyZT86IEtleWJvYXJkRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25LZXlVcD8gICAgICAgICAgOiBLZXlib2FyZEV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uS2V5VXBDYXB0dXJlPyAgIDogS2V5Ym9hcmRFdmVudEhhbmRsZXJcbiAgICAgICAgICAvLyAjZW5kcmVnaW9uXG5cbiAgICAgICAgICAvLyAjcmVnaW9uIE1lZGlhIEV2ZW50c1xuICAgICAgICAgIG9uQWJvcnQ/ICAgICAgICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uQWJvcnRDYXB0dXJlPyAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uQ2FuUGxheT8gICAgICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uQ2FuUGxheUNhcHR1cmU/ICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uQ2FuUGxheVRocm91Z2g/ICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uQ2FuUGxheVRocm91Z2hDYXB0dXJlPzogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRHVyYXRpb25DaGFuZ2U/ICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRHVyYXRpb25DaGFuZ2VDYXB0dXJlPzogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRW1wdGllZD8gICAgICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRW1wdGllZENhcHR1cmU/ICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRW5jcnlwdGVkPyAgICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRW5jcnlwdGVkQ2FwdHVyZT8gICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRW5kZWQ/ICAgICAgICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRW5kZWRDYXB0dXJlPyAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uTG9hZGVkRGF0YT8gICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uTG9hZGVkRGF0YUNhcHR1cmU/ICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uTG9hZGVkTWV0YWRhdGE/ICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uTG9hZGVkTWV0YWRhdGFDYXB0dXJlPzogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uTG9hZFN0YXJ0PyAgICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uTG9hZFN0YXJ0Q2FwdHVyZT8gICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uUGF1c2U/ICAgICAgICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uUGF1c2VDYXB0dXJlPyAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uUGxheT8gICAgICAgICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uUGxheUNhcHR1cmU/ICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uUGxheWluZz8gICAgICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uUGxheWluZ0NhcHR1cmU/ICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uUHJvZ3Jlc3M/ICAgICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uUHJvZ3Jlc3NDYXB0dXJlPyAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uUmF0ZUNoYW5nZT8gICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uUmF0ZUNoYW5nZUNhcHR1cmU/ICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uU2Vla2VkPyAgICAgICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uU2Vla2VkQ2FwdHVyZT8gICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uU2Vla2luZz8gICAgICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uU2Vla2luZ0NhcHR1cmU/ICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uU3RhbGxlZD8gICAgICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uU3RhbGxlZENhcHR1cmU/ICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uU3VzcGVuZD8gICAgICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uU3VzcGVuZENhcHR1cmU/ICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uVGltZVVwZGF0ZT8gICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uVGltZVVwZGF0ZUNhcHR1cmU/ICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uVm9sdW1lQ2hhbmdlPyAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uVm9sdW1lQ2hhbmdlQ2FwdHVyZT8gIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uV2FpdGluZz8gICAgICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uV2FpdGluZ0NhcHR1cmU/ICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIC8vICNlbmRyZWdpb25cblxuICAgICAgICAgIC8vICNyZWdpb24gTW91c2VFdmVudHNcbiAgICAgICAgICBvbkNsaWNrPyAgICAgICAgICAgICA6IE1vdXNlRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25DbGlja0NhcHR1cmU/ICAgICAgOiBNb3VzZUV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uQ29udGV4dE1lbnU/ICAgICAgIDogTW91c2VFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkNvbnRleHRNZW51Q2FwdHVyZT86IE1vdXNlRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25EYmxDbGljaz8gICAgICAgICAgOiBNb3VzZUV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRGJsQ2xpY2tDYXB0dXJlPyAgIDogTW91c2VFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkRyYWc/ICAgICAgICAgICAgICA6IERyYWdFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkRyYWdDYXB0dXJlPyAgICAgICA6IERyYWdFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkRyYWdFbmQ/ICAgICAgICAgICA6IERyYWdFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkRyYWdFbmRDYXB0dXJlPyAgICA6IERyYWdFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkRyYWdFbnRlcj8gICAgICAgICA6IERyYWdFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkRyYWdFbnRlckNhcHR1cmU/ICA6IERyYWdFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkRyYWdFeGl0PyAgICAgICAgICA6IERyYWdFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkRyYWdFeGl0Q2FwdHVyZT8gICA6IERyYWdFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkRyYWdMZWF2ZT8gICAgICAgICA6IERyYWdFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkRyYWdMZWF2ZUNhcHR1cmU/ICA6IERyYWdFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkRyYWdPdmVyPyAgICAgICAgICA6IERyYWdFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkRyYWdPdmVyQ2FwdHVyZT8gICA6IERyYWdFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkRyYWdTdGFydD8gICAgICAgICA6IERyYWdFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkRyYWdTdGFydENhcHR1cmU/ICA6IERyYWdFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkRyb3A/ICAgICAgICAgICAgICA6IERyYWdFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkRyb3BDYXB0dXJlPyAgICAgICA6IERyYWdFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbk1vdXNlRG93bj8gICAgICAgICA6IE1vdXNlRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Nb3VzZURvd25DYXB0dXJlPyAgOiBNb3VzZUV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uTW91c2VFbnRlcj8gICAgICAgIDogTW91c2VFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbk1vdXNlRW50ZXJDYXB0dXJlPyA6IE1vdXNlRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Nb3VzZUxlYXZlPyAgICAgICAgOiBNb3VzZUV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uTW91c2VMZWF2ZUNhcHR1cmU/IDogTW91c2VFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbk1vdXNlTW92ZT8gICAgICAgICA6IE1vdXNlRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Nb3VzZU1vdmVDYXB0dXJlPyAgOiBNb3VzZUV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uTW91c2VPdXQ/ICAgICAgICAgIDogTW91c2VFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbk1vdXNlT3V0Q2FwdHVyZT8gICA6IE1vdXNlRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Nb3VzZU92ZXI/ICAgICAgICAgOiBNb3VzZUV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uTW91c2VPdmVyQ2FwdHVyZT8gIDogTW91c2VFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbk1vdXNlVXA/ICAgICAgICAgICA6IE1vdXNlRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Nb3VzZVVwQ2FwdHVyZT8gICAgOiBNb3VzZUV2ZW50SGFuZGxlclxuICAgICAgICAgIC8vICNlbmRyZWdpb25cblxuICAgICAgICAgIC8vICNyZWdpb24gU2VsZWN0aW9uIEV2ZW50c1xuICAgICAgICAgIG9uU2VsZWN0PzogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uU2VsZWN0Q2FwdHVyZT86IEdlbmVyaWNFdmVudEhhbmRsZXJcbiAgICAgICAgICAvLyAjZW5kcmVnaW9uXG5cbiAgICAgICAgICAvLyAjcmVnaW9uIFRvdWNoIEV2ZW50c1xuICAgICAgICAgIG9uVG91Y2hDYW5jZWw/OiBUb3VjaEV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uVG91Y2hDYW5jZWxDYXB0dXJlPzogVG91Y2hFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblRvdWNoRW5kPzogVG91Y2hFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblRvdWNoRW5kQ2FwdHVyZT86IFRvdWNoRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Ub3VjaE1vdmU/OiBUb3VjaEV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uVG91Y2hNb3ZlQ2FwdHVyZT86IFRvdWNoRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Ub3VjaFN0YXJ0PzogVG91Y2hFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblRvdWNoU3RhcnRDYXB0dXJlPzogVG91Y2hFdmVudEhhbmRsZXJcbiAgICAgICAgICAvLyAjZW5kcmVnaW9uXG5cbiAgICAgICAgICAvLyAjcmVnaW9uIFBvaW50ZXIgRXZlbnRzXG4gICAgICAgICAgb25Qb2ludGVyT3Zlcj8gICAgICAgICAgICAgIDogUG9pbnRlckV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uUG9pbnRlck92ZXJDYXB0dXJlPyAgICAgICA6IFBvaW50ZXJFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblBvaW50ZXJFbnRlcj8gICAgICAgICAgICAgOiBQb2ludGVyRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Qb2ludGVyRW50ZXJDYXB0dXJlPyAgICAgIDogUG9pbnRlckV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uUG9pbnRlckRvd24/ICAgICAgICAgICAgICA6IFBvaW50ZXJFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblBvaW50ZXJEb3duQ2FwdHVyZT8gICAgICAgOiBQb2ludGVyRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Qb2ludGVyTW92ZT8gICAgICAgICAgICAgIDogUG9pbnRlckV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uUG9pbnRlck1vdmVDYXB0dXJlPyAgICAgICA6IFBvaW50ZXJFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblBvaW50ZXJVcD8gICAgICAgICAgICAgICAgOiBQb2ludGVyRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Qb2ludGVyVXBDYXB0dXJlPyAgICAgICAgIDogUG9pbnRlckV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uUG9pbnRlckNhbmNlbD8gICAgICAgICAgICA6IFBvaW50ZXJFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblBvaW50ZXJDYW5jZWxDYXB0dXJlPyAgICAgOiBQb2ludGVyRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Qb2ludGVyT3V0PyAgICAgICAgICAgICAgIDogUG9pbnRlckV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uUG9pbnRlck91dENhcHR1cmU/ICAgICAgICA6IFBvaW50ZXJFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblBvaW50ZXJMZWF2ZT8gICAgICAgICAgICAgOiBQb2ludGVyRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Qb2ludGVyTGVhdmVDYXB0dXJlPyAgICAgIDogUG9pbnRlckV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uR290UG9pbnRlckNhcHR1cmU/ICAgICAgICA6IFBvaW50ZXJFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkdvdFBvaW50ZXJDYXB0dXJlQ2FwdHVyZT8gOiBQb2ludGVyRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Mb3N0UG9pbnRlckNhcHR1cmU/ICAgICAgIDogUG9pbnRlckV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uTG9zdFBvaW50ZXJDYXB0dXJlQ2FwdHVyZT86IFBvaW50ZXJFdmVudEhhbmRsZXJcbiAgICAgICAgICAvLyAjZW5kcmVnaW9uXG5cbiAgICAgICAgICAvLyAjcmVnaW9uIFVJIEV2ZW50c1xuICAgICAgICAgIG9uU2Nyb2xsPyAgICAgICA6IFVJRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25TY3JvbGxDYXB0dXJlPzogVUlFdmVudEhhbmRsZXJcbiAgICAgICAgICAvLyAjZW5kcmVnaW9uXG5cbiAgICAgICAgICAvLyAjcmVnaW9uIFdoZWVsIEV2ZW50c1xuICAgICAgICAgIG9uV2hlZWw/ICAgICAgIDogV2hlZWxFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbldoZWVsQ2FwdHVyZT86IFdoZWVsRXZlbnRIYW5kbGVyXG4gICAgICAgICAgLy8gI2VuZHJlZ2lvblxuXG4gICAgICAgICAgLy8gI3JlZ2lvbiBBbmltYXRpb24gRXZlbnRzXG4gICAgICAgICAgb25BbmltYXRpb25TdGFydD8gICAgICAgICAgIDogQW5pbWF0aW9uRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25BbmltYXRpb25TdGFydENhcHR1cmU/ICAgIDogQW5pbWF0aW9uRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25BbmltYXRpb25FbmQ/ICAgICAgICAgICAgIDogQW5pbWF0aW9uRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25BbmltYXRpb25FbmRDYXB0dXJlPyAgICAgIDogQW5pbWF0aW9uRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25BbmltYXRpb25JdGVyYXRpb24/ICAgICAgIDogQW5pbWF0aW9uRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25BbmltYXRpb25JdGVyYXRpb25DYXB0dXJlPzogQW5pbWF0aW9uRXZlbnRIYW5kbGVyXG4gICAgICAgICAgLy8gI2VuZHJlZ2lvblxuXG4gICAgICAgICAgLy8gI3JlZ2lvbiBUcmFuc2l0aW9uIEV2ZW50c1xuICAgICAgICAgIG9uVHJhbnNpdGlvbkVuZD8gICAgICAgOiBUcmFuc2l0aW9uRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25UcmFuc2l0aW9uRW5kQ2FwdHVyZT86IFRyYW5zaXRpb25FdmVudEhhbmRsZXJcbiAgICAgICAgICAvLyAjZW5kcmVnaW9uXG4gICAgIH1cblxuICAgICBpbnRlcmZhY2UgSFRNTEF0dHJpYnV0ZXMgZXh0ZW5kcyBET01BdHRyaWJ1dGVzXG4gICAgIHtcbiAgICAgICAgICAvLyBTdGFuZGFyZCBIVE1MIEF0dHJpYnV0ZXNcbiAgICAgICAgICBhY2NlcHQ/ICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGFjY2VwdENoYXJzZXQ/ICAgIDogc3RyaW5nXG4gICAgICAgICAgYWNjZXNzS2V5PyAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBhY3Rpb24/ICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGFsbG93RnVsbFNjcmVlbj8gIDogc3RyaW5nIHwgYm9vbGVhblxuICAgICAgICAgIGFsbG93VHJhbnNwYXJlbmN5Pzogc3RyaW5nIHwgYm9vbGVhblxuICAgICAgICAgIGFsdD8gICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgYXN5bmM/ICAgICAgICAgICAgOiBzdHJpbmcgfCBib29sZWFuXG4gICAgICAgICAgYXV0b2NvbXBsZXRlPyAgICAgOiBzdHJpbmdcbiAgICAgICAgICBhdXRvQ29tcGxldGU/ICAgICA6IHN0cmluZ1xuICAgICAgICAgIGF1dG9jb3JyZWN0PyAgICAgIDogc3RyaW5nXG4gICAgICAgICAgYXV0b0NvcnJlY3Q/ICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBhdXRvZm9jdXM/ICAgICAgICA6IHN0cmluZyB8IGJvb2xlYW5cbiAgICAgICAgICBhdXRvRm9jdXM/ICAgICAgICA6IHN0cmluZyB8IGJvb2xlYW5cbiAgICAgICAgICBhdXRvUGxheT8gICAgICAgICA6IHN0cmluZyB8IGJvb2xlYW5cbiAgICAgICAgICBjYXB0dXJlPyAgICAgICAgICA6IHN0cmluZyB8IGJvb2xlYW5cbiAgICAgICAgICBjZWxsUGFkZGluZz8gICAgICA6IHN0cmluZyB8IG51bWJlclxuICAgICAgICAgIGNlbGxTcGFjaW5nPyAgICAgIDogc3RyaW5nIHwgbnVtYmVyXG4gICAgICAgICAgY2hhclNldD8gICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBjaGFsbGVuZ2U/ICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGNoZWNrZWQ/ICAgICAgICAgIDogc3RyaW5nIHwgYm9vbGVhblxuICAgICAgICAgIGNsYXNzPyAgICAgICAgICAgIDogc3RyaW5nIHwgc3RyaW5nW11cbiAgICAgICAgICBjbGFzc05hbWU/ICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGNvbHM/ICAgICAgICAgICAgIDogc3RyaW5nIHwgbnVtYmVyXG4gICAgICAgICAgY29sU3Bhbj8gICAgICAgICAgOiBzdHJpbmcgfCBudW1iZXJcbiAgICAgICAgICBjb250ZW50PyAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGNvbnRlbnRFZGl0YWJsZT8gIDogc3RyaW5nIHwgYm9vbGVhblxuICAgICAgICAgIGNvbnRleHRNZW51PyAgICAgIDogc3RyaW5nXG4gICAgICAgICAgY29udHJvbHM/ICAgICAgICAgOiBzdHJpbmcgfCBib29sZWFuXG4gICAgICAgICAgY29udHJvbHNMaXN0PyAgICAgOiBzdHJpbmdcbiAgICAgICAgICBjb29yZHM/ICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGNyb3NzT3JpZ2luPyAgICAgIDogc3RyaW5nXG4gICAgICAgICAgZGF0YT8gICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBkYXRlVGltZT8gICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGRlZmF1bHQ/ICAgICAgICAgIDogc3RyaW5nIHwgYm9vbGVhblxuICAgICAgICAgIGRlZmVyPyAgICAgICAgICAgIDogc3RyaW5nIHwgYm9vbGVhblxuICAgICAgICAgIGRpcj8gICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgZGlzYWJsZWQ/ICAgICAgICAgOiBzdHJpbmcgfCBib29sZWFuXG4gICAgICAgICAgZG93bmxvYWQ/ICAgICAgICAgOiBhbnlcbiAgICAgICAgICBkcmFnZ2FibGU/ICAgICAgICA6IHN0cmluZyB8IGJvb2xlYW5cbiAgICAgICAgICBlbmNUeXBlPyAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGZvcm0/ICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgZm9ybUFjdGlvbj8gICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBmb3JtRW5jVHlwZT8gICAgICA6IHN0cmluZ1xuICAgICAgICAgIGZvcm1NZXRob2Q/ICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgZm9ybU5vVmFsaWRhdGU/ICAgOiBzdHJpbmcgfCBib29sZWFuXG4gICAgICAgICAgZm9ybVRhcmdldD8gICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBmcmFtZUJvcmRlcj8gICAgICA6IHN0cmluZyB8IG51bWJlclxuICAgICAgICAgIGhlYWRlcnM/ICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgaGVpZ2h0PyAgICAgICAgICAgOiBzdHJpbmcgfCBudW1iZXJcbiAgICAgICAgICBoaWRkZW4/ICAgICAgICAgICA6IHN0cmluZyB8IGJvb2xlYW5cbiAgICAgICAgICBoaWdoPyAgICAgICAgICAgICA6IHN0cmluZyB8IG51bWJlclxuICAgICAgICAgIGhyZWY/ICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgaHJlZkxhbmc/ICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBmb3I/ICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGh0bWxGb3I/ICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgaHR0cEVxdWl2PyAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBpY29uPyAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGlkPyAgICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgaW5wdXRNb2RlPyAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBpbnRlZ3JpdHk/ICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGlzPyAgICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAga2V5UGFyYW1zPyAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBrZXlUeXBlPyAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGtpbmQ/ICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgbGFiZWw/ICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBsYW5nPyAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGxpc3Q/ICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgbG9vcD8gICAgICAgICAgICAgOiBzdHJpbmcgfCBib29sZWFuXG4gICAgICAgICAgbG93PyAgICAgICAgICAgICAgOiBzdHJpbmcgfCBudW1iZXJcbiAgICAgICAgICBtYW5pZmVzdD8gICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIG1hcmdpbkhlaWdodD8gICAgIDogc3RyaW5nIHwgbnVtYmVyXG4gICAgICAgICAgbWFyZ2luV2lkdGg/ICAgICAgOiBzdHJpbmcgfCBudW1iZXJcbiAgICAgICAgICBtYXg/ICAgICAgICAgICAgICA6IHN0cmluZyB8IG51bWJlclxuICAgICAgICAgIG1heExlbmd0aD8gICAgICAgIDogc3RyaW5nIHwgbnVtYmVyXG4gICAgICAgICAgbWVkaWE/ICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBtZWRpYUdyb3VwPyAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIG1ldGhvZD8gICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgbWluPyAgICAgICAgICAgICAgOiBzdHJpbmcgfCBudW1iZXJcbiAgICAgICAgICBtaW5MZW5ndGg/ICAgICAgICA6IHN0cmluZyB8IG51bWJlclxuICAgICAgICAgIG11bHRpcGxlPyAgICAgICAgIDogc3RyaW5nIHwgYm9vbGVhblxuICAgICAgICAgIG11dGVkPyAgICAgICAgICAgIDogc3RyaW5nIHwgYm9vbGVhblxuICAgICAgICAgIG5hbWU/ICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgbm9WYWxpZGF0ZT8gICAgICAgOiBzdHJpbmcgfCBib29sZWFuXG4gICAgICAgICAgb3Blbj8gICAgICAgICAgICAgOiBzdHJpbmcgfCBib29sZWFuXG4gICAgICAgICAgb3B0aW11bT8gICAgICAgICAgOiBzdHJpbmcgfCBudW1iZXJcbiAgICAgICAgICBwYXR0ZXJuPyAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHBsYWNlaG9sZGVyPyAgICAgIDogc3RyaW5nXG4gICAgICAgICAgcGxheXNJbmxpbmU/ICAgICAgOiBzdHJpbmcgfCBib29sZWFuXG4gICAgICAgICAgcG9zdGVyPyAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBwcmVsb2FkPyAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHJhZGlvR3JvdXA/ICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgcmVhZE9ubHk/ICAgICAgICAgOiBzdHJpbmcgfCBib29sZWFuXG4gICAgICAgICAgcmVsPyAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICByZXF1aXJlZD8gICAgICAgICA6IHN0cmluZyB8IGJvb2xlYW5cbiAgICAgICAgICByb2xlPyAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHJvd3M/ICAgICAgICAgICAgIDogc3RyaW5nIHwgbnVtYmVyXG4gICAgICAgICAgcm93U3Bhbj8gICAgICAgICAgOiBzdHJpbmcgfCBudW1iZXJcbiAgICAgICAgICBzYW5kYm94PyAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHNjb3BlPyAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgc2NvcGVkPyAgICAgICAgICAgOiBzdHJpbmcgfCBib29sZWFuXG4gICAgICAgICAgc2Nyb2xsaW5nPyAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBzZWFtbGVzcz8gICAgICAgICA6IHN0cmluZyB8IGJvb2xlYW5cbiAgICAgICAgICBzZWxlY3RlZD8gICAgICAgICA6IHN0cmluZyB8IGJvb2xlYW5cbiAgICAgICAgICBzaGFwZT8gICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHNpemU/ICAgICAgICAgICAgIDogc3RyaW5nIHwgbnVtYmVyXG4gICAgICAgICAgc2l6ZXM/ICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBzbG90PyAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHNwYW4/ICAgICAgICAgICAgIDogc3RyaW5nIHwgbnVtYmVyXG4gICAgICAgICAgc3BlbGxjaGVjaz8gICAgICAgOiBzdHJpbmcgfCBib29sZWFuXG4gICAgICAgICAgc3JjPyAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBzcmNzZXQ/ICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHNyY0RvYz8gICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgc3JjTGFuZz8gICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBzcmNTZXQ/ICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHN0YXJ0PyAgICAgICAgICAgIDogc3RyaW5nIHwgbnVtYmVyXG4gICAgICAgICAgc3RlcD8gICAgICAgICAgICAgOiBzdHJpbmcgfCBudW1iZXJcbiAgICAgICAgICBzdHlsZT8gICAgICAgICAgICA6IHN0cmluZyB8IHsgWyBrZXk6IHN0cmluZyBdOiBzdHJpbmcgfCBudW1iZXIgfVxuICAgICAgICAgIHN1bW1hcnk/ICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgdGFiSW5kZXg/ICAgICAgICAgOiBzdHJpbmcgfCBudW1iZXJcbiAgICAgICAgICB0YXJnZXQ/ICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHRpdGxlPyAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgdHlwZT8gICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICB1c2VNYXA/ICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHZhbHVlPyAgICAgICAgICAgIDogc3RyaW5nIHwgc3RyaW5nW10gfCBudW1iZXJcbiAgICAgICAgICB3aWR0aD8gICAgICAgICAgICA6IHN0cmluZyB8IG51bWJlclxuICAgICAgICAgIHdtb2RlPyAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgd3JhcD8gICAgICAgICAgICAgOiBzdHJpbmdcblxuICAgICAgICAgIC8vIFJERmEgQXR0cmlidXRlc1xuICAgICAgICAgIGFib3V0Pzogc3RyaW5nXG4gICAgICAgICAgZGF0YXR5cGU/OiBzdHJpbmdcbiAgICAgICAgICBpbmxpc3Q/OiBhbnlcbiAgICAgICAgICBwcmVmaXg/OiBzdHJpbmdcbiAgICAgICAgICBwcm9wZXJ0eT86IHN0cmluZ1xuICAgICAgICAgIHJlc291cmNlPzogc3RyaW5nXG4gICAgICAgICAgdHlwZW9mPzogc3RyaW5nXG4gICAgICAgICAgdm9jYWI/OiBzdHJpbmdcblxuICAgICAgICAgIC8vIE1pY3JvZGF0YSBBdHRyaWJ1dGVzXG4gICAgICAgICAgaXRlbVByb3A/OiBzdHJpbmdcbiAgICAgICAgICBpdGVtU2NvcGU/OiBib29sZWFuXG4gICAgICAgICAgaXRlbVR5cGU/OiBzdHJpbmdcbiAgICAgICAgICBpdGVtSUQ/OiBzdHJpbmdcbiAgICAgICAgICBpdGVtUmVmPzogc3RyaW5nXG4gICAgIH1cblxuICAgICBpbnRlcmZhY2UgU1ZHQXR0cmlidXRlcyBleHRlbmRzIEhUTUxBdHRyaWJ1dGVzXG4gICAgIHtcbiAgICAgICAgICBhY2NlbnRIZWlnaHQ/ICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGFjY3VtdWxhdGU/ICAgICAgICAgICAgICAgIDogXCJub25lXCIgfCBcInN1bVwiXG4gICAgICAgICAgYWRkaXRpdmU/ICAgICAgICAgICAgICAgICAgOiBcInJlcGxhY2VcIiB8IFwic3VtXCJcbiAgICAgICAgICBhbGlnbm1lbnRCYXNlbGluZT8gICAgICAgICA6IFwiYXV0b1wiIHwgXCJiYXNlbGluZVwiIHwgXCJiZWZvcmUtZWRnZVwiIHwgXCJ0ZXh0LWJlZm9yZS1lZGdlXCIgfCBcIm1pZGRsZVwiIHwgXCJjZW50cmFsXCIgfCBcImFmdGVyLWVkZ2VcIiB8IFwidGV4dC1hZnRlci1lZGdlXCIgfCBcImlkZW9ncmFwaGljXCIgfCBcImFscGhhYmV0aWNcIiB8IFwiaGFuZ2luZ1wiIHwgXCJtYXRoZW1hdGljYWxcIiB8IFwiaW5oZXJpdFwiXG4gICAgICAgICAgYWxsb3dSZW9yZGVyPyAgICAgICAgICAgICAgOiBcIm5vXCIgfCBcInllc1wiXG4gICAgICAgICAgYWxwaGFiZXRpYz8gICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBhbXBsaXR1ZGU/ICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGFyYWJpY0Zvcm0/ICAgICAgICAgICAgICAgIDogXCJpbml0aWFsXCIgfCBcIm1lZGlhbFwiIHwgXCJ0ZXJtaW5hbFwiIHwgXCJpc29sYXRlZFwiXG4gICAgICAgICAgYXNjZW50PyAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBhdHRyaWJ1dGVOYW1lPyAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGF0dHJpYnV0ZVR5cGU/ICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgYXV0b1JldmVyc2U/ICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBhemltdXRoPyAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGJhc2VGcmVxdWVuY3k/ICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgYmFzZWxpbmVTaGlmdD8gICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBiYXNlUHJvZmlsZT8gICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGJib3g/ICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgYmVnaW4/ICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBiaWFzPyAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGJ5PyAgICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgY2FsY01vZGU/ICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBjYXBIZWlnaHQ/ICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGNsaXA/ICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgY2xpcFBhdGg/ICAgICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBjbGlwUGF0aFVuaXRzPyAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGNsaXBSdWxlPyAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgY29sb3JJbnRlcnBvbGF0aW9uPyAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBjb2xvckludGVycG9sYXRpb25GaWx0ZXJzPyA6IFwiYXV0b1wiIHwgXCJzUkdCXCIgfCBcImxpbmVhclJHQlwiIHwgXCJpbmhlcml0XCJcbiAgICAgICAgICBjb2xvclByb2ZpbGU/ICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGNvbG9yUmVuZGVyaW5nPyAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgY29udGVudFNjcmlwdFR5cGU/ICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBjb250ZW50U3R5bGVUeXBlPyAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGN1cnNvcj8gICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgY3g/ICAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBjeT8gICAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGQ/ICAgICAgICAgICAgICAgICAgICAgICAgIDogc3RyaW5nIHwgKG51bWJlciB8IHN0cmluZykgW11cbiAgICAgICAgICBkZWNlbGVyYXRlPyAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGRlc2NlbnQ/ICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZGlmZnVzZUNvbnN0YW50PyAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBkaXJlY3Rpb24/ICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGRpc3BsYXk/ICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZGl2aXNvcj8gICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBkb21pbmFudEJhc2VsaW5lPyAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGR1cj8gICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZHg/ICAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBkeT8gICAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGVkZ2VNb2RlPyAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZWxldmF0aW9uPyAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBlbmFibGVCYWNrZ3JvdW5kPyAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGVuZD8gICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZXhwb25lbnQ/ICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBleHRlcm5hbFJlc291cmNlc1JlcXVpcmVkPyA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGZpbGw/ICAgICAgICAgICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgZmlsbE9wYWNpdHk/ICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBmaWxsUnVsZT8gICAgICAgICAgICAgICAgICA6IFwibm9uemVyb1wiIHwgXCJldmVub2RkXCIgfCBcImluaGVyaXRcIlxuICAgICAgICAgIGZpbHRlcj8gICAgICAgICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgZmlsdGVyUmVzPyAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBmaWx0ZXJVbml0cz8gICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGZsb29kQ29sb3I/ICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZmxvb2RPcGFjaXR5PyAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBmb2N1c2FibGU/ICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGZvbnRGYW1pbHk/ICAgICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgZm9udFNpemU/ICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBmb250U2l6ZUFkanVzdD8gICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGZvbnRTdHJldGNoPyAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZm9udFN0eWxlPyAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBmb250VmFyaWFudD8gICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGZvbnRXZWlnaHQ/ICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZm9ybWF0PyAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBmcm9tPyAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGZ4PyAgICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZnk/ICAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBnMT8gICAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGcyPyAgICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZ2x5cGhOYW1lPyAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBnbHlwaE9yaWVudGF0aW9uSG9yaXpvbnRhbD86IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGdseXBoT3JpZW50YXRpb25WZXJ0aWNhbD8gIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZ2x5cGhSZWY/ICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBncmFkaWVudFRyYW5zZm9ybT8gICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGdyYWRpZW50VW5pdHM/ICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgaGFuZ2luZz8gICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBob3JpekFkdlg/ICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGhvcml6T3JpZ2luWD8gICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgaWRlb2dyYXBoaWM/ICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBpbWFnZVJlbmRlcmluZz8gICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGluMj8gICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgaW4/ICAgICAgICAgICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBpbnRlcmNlcHQ/ICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGsxPyAgICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgazI/ICAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBrMz8gICAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGs0PyAgICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgaz8gICAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBrZXJuZWxNYXRyaXg/ICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGtlcm5lbFVuaXRMZW5ndGg/ICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAga2VybmluZz8gICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBrZXlQb2ludHM/ICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGtleVNwbGluZXM/ICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAga2V5VGltZXM/ICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBsZW5ndGhBZGp1c3Q/ICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGxldHRlclNwYWNpbmc/ICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgbGlnaHRpbmdDb2xvcj8gICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBsaW1pdGluZ0NvbmVBbmdsZT8gICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGxvY2FsPyAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgbWFya2VyRW5kPyAgICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBtYXJrZXJIZWlnaHQ/ICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIG1hcmtlck1pZD8gICAgICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgbWFya2VyU3RhcnQ/ICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBtYXJrZXJVbml0cz8gICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIG1hcmtlcldpZHRoPyAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgbWFzaz8gICAgICAgICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBtYXNrQ29udGVudFVuaXRzPyAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIG1hc2tVbml0cz8gICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgbWF0aGVtYXRpY2FsPyAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBtb2RlPyAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIG51bU9jdGF2ZXM/ICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgb2Zmc2V0PyAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBvcGFjaXR5PyAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIG9wZXJhdG9yPyAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgb3JkZXI/ICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBvcmllbnQ/ICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIG9yaWVudGF0aW9uPyAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgb3JpZ2luPyAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBvdmVyZmxvdz8gICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIG92ZXJsaW5lUG9zaXRpb24/ICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgb3ZlcmxpbmVUaGlja25lc3M/ICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBwYWludE9yZGVyPyAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHBhbm9zZTE/ICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgcGF0aExlbmd0aD8gICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBwYXR0ZXJuQ29udGVudFVuaXRzPyAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHBhdHRlcm5UcmFuc2Zvcm0/ICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgcGF0dGVyblVuaXRzPyAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBwb2ludGVyRXZlbnRzPyAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHBvaW50cz8gICAgICAgICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgcG9pbnRzQXRYPyAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBwb2ludHNBdFk/ICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHBvaW50c0F0Wj8gICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgcHJlc2VydmVBbHBoYT8gICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBwcmVzZXJ2ZUFzcGVjdFJhdGlvPyAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHByaW1pdGl2ZVVuaXRzPyAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgcj8gICAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICByYWRpdXM/ICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHJlZlg/ICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgcmVmWT8gICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICByZW5kZXJpbmdJbnRlbnQ/ICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHJlcGVhdENvdW50PyAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgcmVwZWF0RHVyPyAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICByZXF1aXJlZEV4dGVuc2lvbnM/ICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHJlcXVpcmVkRmVhdHVyZXM/ICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgcmVzdGFydD8gICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICByZXN1bHQ/ICAgICAgICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHJvdGF0ZT8gICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgcng/ICAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICByeT8gICAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHNjYWxlPyAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgc2VlZD8gICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBzaGFwZVJlbmRlcmluZz8gICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHNsb3BlPyAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgc3BhY2luZz8gICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBzcGVjdWxhckNvbnN0YW50PyAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHNwZWN1bGFyRXhwb25lbnQ/ICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgc3BlZWQ/ICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBzcHJlYWRNZXRob2Q/ICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHN0YXJ0T2Zmc2V0PyAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgc3RkRGV2aWF0aW9uPyAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBzdGVtaD8gICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHN0ZW12PyAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgc3RpdGNoVGlsZXM/ICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBzdG9wQ29sb3I/ICAgICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHN0b3BPcGFjaXR5PyAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgc3RyaWtldGhyb3VnaFBvc2l0aW9uPyAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBzdHJpa2V0aHJvdWdoVGhpY2tuZXNzPyAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHN0cmluZz8gICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgc3Ryb2tlPyAgICAgICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBzdHJva2VEYXNoYXJyYXk/ICAgICAgICAgICA6IHN0cmluZyB8IG51bWJlclxuICAgICAgICAgIHN0cm9rZURhc2hvZmZzZXQ/ICAgICAgICAgIDogc3RyaW5nIHwgbnVtYmVyXG4gICAgICAgICAgc3Ryb2tlTGluZWNhcD8gICAgICAgICAgICAgOiBcImJ1dHRcIiB8IFwicm91bmRcIiB8IFwic3F1YXJlXCIgfCBcImluaGVyaXRcIlxuICAgICAgICAgIHN0cm9rZUxpbmVqb2luPyAgICAgICAgICAgIDogXCJtaXRlclwiIHwgXCJyb3VuZFwiIHwgXCJiZXZlbFwiIHwgXCJpbmhlcml0XCJcbiAgICAgICAgICBzdHJva2VNaXRlcmxpbWl0PyAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHN0cm9rZU9wYWNpdHk/ICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgc3Ryb2tlV2lkdGg/ICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBzdXJmYWNlU2NhbGU/ICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHN5c3RlbUxhbmd1YWdlPyAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgdGFibGVWYWx1ZXM/ICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB0YXJnZXRYPyAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHRhcmdldFk/ICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgdGV4dEFuY2hvcj8gICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICB0ZXh0RGVjb3JhdGlvbj8gICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHRleHRMZW5ndGg/ICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgdGV4dFJlbmRlcmluZz8gICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB0bz8gICAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHRyYW5zZm9ybT8gICAgICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgdTE/ICAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB1Mj8gICAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHVuZGVybGluZVBvc2l0aW9uPyAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgdW5kZXJsaW5lVGhpY2tuZXNzPyAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB1bmljb2RlPyAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHVuaWNvZGVCaWRpPyAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgdW5pY29kZVJhbmdlPyAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB1bml0c1BlckVtPyAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHZBbHBoYWJldGljPyAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgdmFsdWVzPyAgICAgICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICB2ZWN0b3JFZmZlY3Q/ICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHZlcnNpb24/ICAgICAgICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgdmVydEFkdlk/ICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB2ZXJ0T3JpZ2luWD8gICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHZlcnRPcmlnaW5ZPyAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgdkhhbmdpbmc/ICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB2SWRlb2dyYXBoaWM/ICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHZpZXdCb3g/ICAgICAgICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgdmlld1RhcmdldD8gICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB2aXNpYmlsaXR5PyAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHZNYXRoZW1hdGljYWw/ICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgd2lkdGhzPyAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB3b3JkU3BhY2luZz8gICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHdyaXRpbmdNb2RlPyAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgeDE/ICAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB4Mj8gICAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHg/ICAgICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgeENoYW5uZWxTZWxlY3Rvcj8gICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICB4SGVpZ2h0PyAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHhsaW5rQWN0dWF0ZT8gICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgeGxpbmtBcmNyb2xlPyAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICB4bGlua0hyZWY/ICAgICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHhsaW5rUm9sZT8gICAgICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgeGxpbmtTaG93PyAgICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICB4bGlua1RpdGxlPyAgICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHhsaW5rVHlwZT8gICAgICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgeG1sQmFzZT8gICAgICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICB4bWxMYW5nPyAgICAgICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHhtbG5zPyAgICAgICAgICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgeG1sbnNYbGluaz8gICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICB4bWxTcGFjZT8gICAgICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHkxPyAgICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgeTI/ICAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB5PyAgICAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHlDaGFubmVsU2VsZWN0b3I/ICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgej8gICAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB6b29tQW5kUGFuPyAgICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICB9XG59XG4iLCJcbmV4cG9ydCBpbnRlcmZhY2UgIERyYWdnYWJsZU9wdGlvbnNcbntcbiAgICAgaGFuZGxlcyAgICAgICAgOiBKU1guRWxlbWVudCBbXVxuICAgICBtaW5WZWxvY2l0eT8gICA6IG51bWJlclxuICAgICBtYXhWZWxvY2l0eT8gICA6IG51bWJlclxuICAgICB2ZWxvY2l0eUZhY3Rvcj86IG51bWJlclxuICAgICBvbkRyYWc/ICAgICAgICA6ICggZXZlbnQ6IERyYWdFdmVudCApID0+IHZvaWRcbiAgICAgb25TdGFydERyYWc/ICAgOiAoKSA9PiB2b2lkXG4gICAgIG9uU3RvcERyYWc/ICAgIDogKCBldmVudDogRHJhZ0V2ZW50ICkgPT4gYm9vbGVhblxuICAgICBvbkVuZEFuaW1hdGlvbj86ICggIGV2ZW50OiBEcmFnRXZlbnQgICkgPT4gdm9pZFxufVxuXG5leHBvcnQgdHlwZSBEcmFnZ2FibGVDb25maWcgPSBSZXF1aXJlZCA8RHJhZ2dhYmxlT3B0aW9ucz5cblxuZXhwb3J0IGludGVyZmFjZSBEcmFnRXZlbnRcbntcbiAgICAgeCAgICAgICAgOiBudW1iZXJcbiAgICAgeSAgICAgICAgOiBudW1iZXJcbiAgICAgb2Zmc2V0WCAgOiBudW1iZXJcbiAgICAgb2Zmc2V0WSAgOiBudW1iZXJcbiAgICAgdGFyZ2V0WDogbnVtYmVyXG4gICAgIHRhcmdldFk6IG51bWJlclxuICAgICBkZWxheSAgICA6IG51bWJlclxufVxuXG5mdW5jdGlvbiBkZWZhdWx0Q29uZmlnICgpOiBEcmFnZ2FibGVDb25maWdcbntcbiAgICAgcmV0dXJuIHtcbiAgICAgICAgICBoYW5kbGVzICAgICAgIDogW10sXG4gICAgICAgICAgbWluVmVsb2NpdHkgICA6IDAsXG4gICAgICAgICAgbWF4VmVsb2NpdHkgICA6IDEsXG4gICAgICAgICAgb25TdGFydERyYWcgICA6ICgpID0+IHt9LFxuICAgICAgICAgIG9uRHJhZyAgICAgICAgOiAoKSA9PiB7fSxcbiAgICAgICAgICBvblN0b3BEcmFnICAgIDogKCkgPT4gdHJ1ZSxcbiAgICAgICAgICBvbkVuZEFuaW1hdGlvbjogKCkgPT4ge30sXG4gICAgICAgICAgdmVsb2NpdHlGYWN0b3I6ICh3aW5kb3cuaW5uZXJIZWlnaHQgPCB3aW5kb3cuaW5uZXJXaWR0aFxuICAgICAgICAgICAgICAgICAgICAgICAgID8gd2luZG93LmlubmVySGVpZ2h0IDogd2luZG93LmlubmVyV2lkdGgpIC8gMixcbiAgICAgfVxufVxuXG52YXIgaXNfZHJhZyAgICA9IGZhbHNlXG52YXIgcG9pbnRlcjogTW91c2VFdmVudCB8IFRvdWNoXG5cbi8vIGh0dHBzOi8vZ2lzdC5naXRodWIuY29tL2dyZS8xNjUwMjk0XG52YXIgRWFzaW5nRnVuY3Rpb25zID0ge1xuICAgICBsaW5lYXIgICAgICAgIDogKCB0OiBudW1iZXIgKSA9PiB0LFxuICAgICBlYXNlSW5RdWFkICAgIDogKCB0OiBudW1iZXIgKSA9PiB0KnQsXG4gICAgIGVhc2VPdXRRdWFkICAgOiAoIHQ6IG51bWJlciApID0+IHQqKDItdCksXG4gICAgIGVhc2VJbk91dFF1YWQgOiAoIHQ6IG51bWJlciApID0+IHQ8LjUgPyAyKnQqdCA6IC0xKyg0LTIqdCkqdCxcbiAgICAgZWFzZUluQ3ViaWMgICA6ICggdDogbnVtYmVyICkgPT4gdCp0KnQsXG4gICAgIGVhc2VPdXRDdWJpYyAgOiAoIHQ6IG51bWJlciApID0+ICgtLXQpKnQqdCsxLFxuICAgICBlYXNlSW5PdXRDdWJpYzogKCB0OiBudW1iZXIgKSA9PiB0PC41ID8gNCp0KnQqdCA6ICh0LTEpKigyKnQtMikqKDIqdC0yKSsxLFxuICAgICBlYXNlSW5RdWFydCAgIDogKCB0OiBudW1iZXIgKSA9PiB0KnQqdCp0LFxuICAgICBlYXNlT3V0UXVhcnQgIDogKCB0OiBudW1iZXIgKSA9PiAxLSgtLXQpKnQqdCp0LFxuICAgICBlYXNlSW5PdXRRdWFydDogKCB0OiBudW1iZXIgKSA9PiB0PC41ID8gOCp0KnQqdCp0IDogMS04KigtLXQpKnQqdCp0LFxuICAgICBlYXNlSW5RdWludCAgIDogKCB0OiBudW1iZXIgKSA9PiB0KnQqdCp0KnQsXG4gICAgIGVhc2VPdXRRdWludCAgOiAoIHQ6IG51bWJlciApID0+IDErKC0tdCkqdCp0KnQqdCxcbiAgICAgZWFzZUluT3V0UXVpbnQ6ICggdDogbnVtYmVyICkgPT4gdDwuNSA/IDE2KnQqdCp0KnQqdCA6IDErMTYqKC0tdCkqdCp0KnQqdFxufVxuXG5leHBvcnQgZnVuY3Rpb24gZHJhZ2dhYmxlICggb3B0aW9uczogRHJhZ2dhYmxlT3B0aW9ucyApXG57XG4gICAgIGNvbnN0IGNvbmZpZyAgICAgPSBkZWZhdWx0Q29uZmlnICgpXG5cbiAgICAgdmFyIGlzX2FjdGl2ZSAgPSBmYWxzZVxuICAgICB2YXIgaXNfYW5pbWF0ZSA9IGZhbHNlXG4gICAgIHZhciBjdXJyZW50X2V2ZW50OiBEcmFnRXZlbnRcblxuICAgICB2YXIgc3RhcnRfdGltZSA9IDBcbiAgICAgdmFyIHN0YXJ0X3ggICAgPSAwXG4gICAgIHZhciBzdGFydF95ICAgID0gMFxuXG4gICAgIHZhciB2ZWxvY2l0eV9kZWxheSA9IDUwMFxuICAgICB2YXIgdmVsb2NpdHlfeDogbnVtYmVyXG4gICAgIHZhciB2ZWxvY2l0eV95OiBudW1iZXJcblxuICAgICB2YXIgY3VycmVudF9hbmltYXRpb24gPSAtMVxuXG4gICAgIHVwZGF0ZUNvbmZpZyAoIG9wdGlvbnMgKVxuXG4gICAgIGZ1bmN0aW9uIHVwZGF0ZUNvbmZpZyAoIG9wdGlvbnM6IERyYWdnYWJsZU9wdGlvbnMgKVxuICAgICB7XG4gICAgICAgICAgaWYgKCBpc19kcmFnIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoIG5hdmlnYXRvci5tYXhUb3VjaFBvaW50cyA+IDAgKVxuICAgICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5zdHlsZS50b3VjaEFjdGlvbiA9IFwibm9uZVwiXG5cbiAgICAgICAgICBkaXNhYmxlRXZlbnRzICgpXG5cbiAgICAgICAgICBPYmplY3QuYXNzaWduICggY29uZmlnLCBvcHRpb25zIClcblxuICAgICAgICAgIGVuYWJsZUV2ZW50cyAoKVxuICAgICB9XG5cbiAgICAgZnVuY3Rpb24gYWRkSGFuZGxlcyAoIC4uLiBoYW5kbGVzOiBKU1guRWxlbWVudCBbXSApXG4gICAgIHtcbiAgICAgICAgICBmb3IgKCBjb25zdCBoIG9mIGhhbmRsZXMgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGlmICggISBjb25maWcuaGFuZGxlcy5pbmNsdWRlcyAoaCkgKVxuICAgICAgICAgICAgICAgICAgICBjb25maWcuaGFuZGxlcy5wdXNoIChoKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICggaXNfYWN0aXZlIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBkZXNhY3RpdmF0ZSAoKVxuICAgICAgICAgICAgICAgYWN0aXZhdGUgKClcbiAgICAgICAgICB9XG4gICAgIH1cblxuICAgICBmdW5jdGlvbiBhY3RpdmF0ZSAoKVxuICAgICB7XG4gICAgICAgICAgZW5hYmxlRXZlbnRzICgpXG4gICAgICAgICAgaXNfYWN0aXZlID0gdHJ1ZVxuICAgICB9XG5cbiAgICAgZnVuY3Rpb24gZGVzYWN0aXZhdGUgKClcbiAgICAge1xuICAgICAgICAgIGRpc2FibGVFdmVudHMgKClcbiAgICAgICAgICBpc19hY3RpdmUgPSBmYWxzZVxuICAgICB9XG5cbiAgICAgcmV0dXJuIHtcbiAgICAgICAgICB1cGRhdGVDb25maWcsXG4gICAgICAgICAgYWRkSGFuZGxlcyxcbiAgICAgICAgICBpc0FjdGl2ZTogKCkgPT4gaXNfYWN0aXZlLFxuICAgICAgICAgIGFjdGl2YXRlLFxuICAgICAgICAgIGRlc2FjdGl2YXRlLFxuICAgICB9XG5cbiAgICAgZnVuY3Rpb24gZW5hYmxlRXZlbnRzICgpXG4gICAgIHtcbiAgICAgICAgICBmb3IgKCBjb25zdCBoIG9mIGNvbmZpZy5oYW5kbGVzIClcbiAgICAgICAgICAgICAgIGguYWRkRXZlbnRMaXN0ZW5lciAoIFwicG9pbnRlcmRvd25cIiwgb25TdGFydCwgeyBwYXNzaXZlOiB0cnVlIH0gKVxuICAgICB9XG4gICAgIGZ1bmN0aW9uIGRpc2FibGVFdmVudHMgKClcbiAgICAge1xuICAgICAgICAgIGZvciAoIGNvbnN0IGggb2YgY29uZmlnLmhhbmRsZXMgKVxuICAgICAgICAgICAgICAgaC5yZW1vdmVFdmVudExpc3RlbmVyICggXCJwb2ludGVyZG93blwiICwgb25TdGFydCApXG4gICAgIH1cblxuICAgICBmdW5jdGlvbiBvblN0YXJ0ICggZXZlbnQ6IE1vdXNlRXZlbnQgfCBUb3VjaEV2ZW50IClcbiAgICAge1xuICAgICAgICAgIGlmICggaXNfZHJhZyApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgY29uc29sZS53YXJuICggXCJUZW50YXRpdmUgZGUgZMOpbWFycmFnZSBkZXMgw6l2w6luZW1lbnRzIFwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICArIFwiXFxcImRyYWdnYWJsZSBcXFwiIGTDqWrDoCBlbiBjb3Vycy5cIiApXG4gICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoIGlzX2FuaW1hdGUgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHN0b3BWZWxvY2l0eUZyYW1lICgpXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcG9pbnRlciA9IChldmVudCBhcyBUb3VjaEV2ZW50KS50b3VjaGVzXG4gICAgICAgICAgICAgICAgICAgID8gKGV2ZW50IGFzIFRvdWNoRXZlbnQpLnRvdWNoZXMgWzBdXG4gICAgICAgICAgICAgICAgICAgIDogKGV2ZW50IGFzIE1vdXNlRXZlbnQpXG5cbiAgICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lciAoXCJwb2ludGVybW92ZVwiLCBvbk1vdmUpXG4gICAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIgKFwicG9pbnRlcnVwXCIgICwgb25FbmQpXG4gICAgICAgICAgZGlzYWJsZUV2ZW50cyAoKVxuXG4gICAgICAgICAgY3VycmVudF9hbmltYXRpb24gPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lICggb25BbmltYXRpb25TdGFydCApXG5cbiAgICAgICAgICBpc19kcmFnID0gdHJ1ZVxuICAgICB9XG4gICAgIGZ1bmN0aW9uIG9uTW92ZSAoIGV2ZW50OiBNb3VzZUV2ZW50IHwgVG91Y2hFdmVudCApXG4gICAgIHtcbiAgICAgICAgICBpZiAoIGlzX2RyYWcgPT0gZmFsc2UgKVxuICAgICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgICBwb2ludGVyID0gKGV2ZW50IGFzIFRvdWNoRXZlbnQpLnRvdWNoZXMgIT09IHVuZGVmaW5lZFxuICAgICAgICAgICAgICAgICAgICA/IChldmVudCBhcyBUb3VjaEV2ZW50KS50b3VjaGVzIFswXVxuICAgICAgICAgICAgICAgICAgICA6IChldmVudCBhcyBNb3VzZUV2ZW50KVxuICAgICB9XG4gICAgIGZ1bmN0aW9uIG9uRW5kICggZXZlbnQ6IE1vdXNlRXZlbnQgfCBUb3VjaEV2ZW50IClcbiAgICAge1xuICAgICAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyIChcInBvaW50ZXJtb3ZlXCIsIG9uTW92ZSlcbiAgICAgICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lciAoXCJwb2ludGVydXBcIiAgLCBvbkVuZClcbiAgICAgICAgICBlbmFibGVFdmVudHMgKClcblxuICAgICAgICAgIGlzX2RyYWcgPSBmYWxzZVxuICAgICB9XG5cbiAgICAgZnVuY3Rpb24gb25BbmltYXRpb25TdGFydCAoIG5vdzogbnVtYmVyIClcbiAgICAge1xuICAgICAgICAgIHN0YXJ0X3ggICAgPSBwb2ludGVyLmNsaWVudFhcbiAgICAgICAgICBzdGFydF95ICAgID0gcG9pbnRlci5jbGllbnRZXG4gICAgICAgICAgc3RhcnRfdGltZSA9IG5vd1xuXG4gICAgICAgICAgY3VycmVudF9ldmVudCA9IHtcbiAgICAgICAgICAgICAgIGRlbGF5ICAgIDogMCxcbiAgICAgICAgICAgICAgIHggICAgICAgIDogMCxcbiAgICAgICAgICAgICAgIHkgICAgICAgIDogMCxcbiAgICAgICAgICAgICAgIG9mZnNldFggIDogMCxcbiAgICAgICAgICAgICAgIG9mZnNldFkgIDogMCxcbiAgICAgICAgICAgICAgIHRhcmdldFg6IDAsXG4gICAgICAgICAgICAgICB0YXJnZXRZOiAwLFxuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbmZpZy5vblN0YXJ0RHJhZyAoKVxuXG4gICAgICAgICAgY3VycmVudF9hbmltYXRpb24gPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lICggb25BbmltYXRpb25GcmFtZSApXG4gICAgIH1cbiAgICAgZnVuY3Rpb24gb25BbmltYXRpb25GcmFtZSAoIG5vdzogbnVtYmVyIClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHsgdmVsb2NpdHlGYWN0b3IgfSA9IGNvbmZpZ1xuXG4gICAgICAgICAgY29uc3QgeCAgICAgICAgICAgPSBwb2ludGVyLmNsaWVudFggLSBzdGFydF94XG4gICAgICAgICAgY29uc3QgeSAgICAgICAgICAgPSBzdGFydF95IC0gcG9pbnRlci5jbGllbnRZXG4gICAgICAgICAgY29uc3QgZGVsYXkgICAgICAgPSBub3cgLSBzdGFydF90aW1lXG4gICAgICAgICAgY29uc3Qgb2Zmc2V0RGVsYXkgPSBkZWxheSAtIGN1cnJlbnRfZXZlbnQuZGVsYXlcbiAgICAgICAgICBjb25zdCBvZmZzZXRYICAgICA9IHggLSBjdXJyZW50X2V2ZW50LnhcbiAgICAgICAgICBjb25zdCBvZmZzZXRZICAgICA9IHkgLSBjdXJyZW50X2V2ZW50LnlcblxuICAgICAgICAgIGN1cnJlbnRfZXZlbnQgPSB7XG4gICAgICAgICAgICAgICBkZWxheSxcbiAgICAgICAgICAgICAgIHgsXG4gICAgICAgICAgICAgICB5LFxuICAgICAgICAgICAgICAgdGFyZ2V0WDogeCxcbiAgICAgICAgICAgICAgIHRhcmdldFk6IHksXG4gICAgICAgICAgICAgICBvZmZzZXRYLFxuICAgICAgICAgICAgICAgb2Zmc2V0WSxcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoIGlzX2RyYWcgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNvbmZpZy5vbkRyYWcgKCBjdXJyZW50X2V2ZW50IClcbiAgICAgICAgICAgICAgIGN1cnJlbnRfYW5pbWF0aW9uID0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSAoIG9uQW5pbWF0aW9uRnJhbWUgKVxuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgc3RhcnRfdGltZSAgICAgPSBub3dcbiAgICAgICAgICAgICAgIHN0YXJ0X3ggICAgICAgID0geFxuICAgICAgICAgICAgICAgc3RhcnRfeSAgICAgICAgPSB5XG4gICAgICAgICAgICAgICB2ZWxvY2l0eV94ICAgICAgID0gdmVsb2NpdHlGYWN0b3IgKiBub3JtICggb2Zmc2V0WCAvIG9mZnNldERlbGF5IClcbiAgICAgICAgICAgICAgIHZlbG9jaXR5X3kgICAgICAgPSB2ZWxvY2l0eUZhY3RvciAqIG5vcm0gKCBvZmZzZXRZIC8gb2Zmc2V0RGVsYXkgKVxuXG4gICAgICAgICAgICAgICBjdXJyZW50X2V2ZW50LnRhcmdldFggKz0gdmVsb2NpdHlfeFxuICAgICAgICAgICAgICAgY3VycmVudF9ldmVudC50YXJnZXRZICs9IHZlbG9jaXR5X3lcblxuICAgICAgICAgICAgICAgaWYgKCBjb25maWcub25TdG9wRHJhZyAoIGN1cnJlbnRfZXZlbnQgKSA9PT0gdHJ1ZSApXG4gICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGlzX2FuaW1hdGUgPSB0cnVlXG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnRfYW5pbWF0aW9uID0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSAoIG9uVmVsb2NpdHlGcmFtZSApXG4gICAgICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgZnVuY3Rpb24gbm9ybSAoIHZhbHVlOiBudW1iZXIgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGlmICh2YWx1ZSA8IC0xIClcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIC0xXG5cbiAgICAgICAgICAgICAgIGlmICggdmFsdWUgPiAxIClcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDFcblxuICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlXG4gICAgICAgICAgfVxuICAgICB9XG4gICAgIGZ1bmN0aW9uIG9uVmVsb2NpdHlGcmFtZSAoIG5vdzogbnVtYmVyIClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IGRlbGF5ID0gbm93IC0gc3RhcnRfdGltZVxuXG4gICAgICAgICAgY29uc3QgdCA9IGRlbGF5ID49IHZlbG9jaXR5X2RlbGF5XG4gICAgICAgICAgICAgICAgICA/IDFcbiAgICAgICAgICAgICAgICAgIDogZGVsYXkgLyB2ZWxvY2l0eV9kZWxheVxuXG4gICAgICAgICAgY29uc3QgZmFjdG9yICA9IEVhc2luZ0Z1bmN0aW9ucy5lYXNlT3V0UXVhcnQgKHQpXG4gICAgICAgICAgY29uc3Qgb2Zmc2V0WCA9IHZlbG9jaXR5X3ggKiBmYWN0b3JcbiAgICAgICAgICBjb25zdCBvZmZzZXRZID0gdmVsb2NpdHlfeSAqIGZhY3RvclxuXG4gICAgICAgICAgY3VycmVudF9ldmVudC54ICAgICAgID0gc3RhcnRfeCArIG9mZnNldFhcbiAgICAgICAgICBjdXJyZW50X2V2ZW50LnkgICAgICAgPSBzdGFydF95ICsgb2Zmc2V0WVxuICAgICAgICAgIGN1cnJlbnRfZXZlbnQub2Zmc2V0WCA9IHZlbG9jaXR5X3ggLSBvZmZzZXRYXG4gICAgICAgICAgY3VycmVudF9ldmVudC5vZmZzZXRZID0gdmVsb2NpdHlfeSAtIG9mZnNldFlcblxuICAgICAgICAgIGNvbmZpZy5vbkRyYWcgKCBjdXJyZW50X2V2ZW50IClcblxuICAgICAgICAgIGlmICggdCA9PSAxIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBpc19hbmltYXRlID0gZmFsc2VcbiAgICAgICAgICAgICAgIGNvbmZpZy5vbkVuZEFuaW1hdGlvbiAoIGN1cnJlbnRfZXZlbnQgKVxuICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY3VycmVudF9hbmltYXRpb24gPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lICggb25WZWxvY2l0eUZyYW1lIClcbiAgICAgfVxuICAgICBmdW5jdGlvbiBzdG9wVmVsb2NpdHlGcmFtZSAoKVxuICAgICB7XG4gICAgICAgICAgaXNfYW5pbWF0ZSA9IGZhbHNlXG4gICAgICAgICAgd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lICggY3VycmVudF9hbmltYXRpb24gKVxuICAgICAgICAgIGNvbmZpZy5vbkVuZEFuaW1hdGlvbiAoIGN1cnJlbnRfZXZlbnQgKVxuICAgICB9XG59XG4iLCJcbmV4cG9ydCB0eXBlIEV4dGVuZGVkQ1NTU3R5bGVEZWNsYXJhdGlvbiA9IENTU1N0eWxlRGVjbGFyYXRpb24gJlxue1xuICAgIGRpc3BsYXkgICAgICA6IFwiaW5saW5lXCIgfCBcImJsb2NrXCIgfCBcImNvbnRlbnRzXCIgfCBcImZsZXhcIiB8IFwiZ3JpZFwiIHwgXCJpbmxpbmUtYmxvY2tcIiB8IFwiaW5saW5lLWZsZXhcIiB8IFwiaW5saW5lLWdyaWRcIiB8IFwiaW5saW5lLXRhYmxlXCIgfCBcImxpc3QtaXRlbVwiIHwgXCJydW4taW5cIiB8IFwidGFibGVcIiB8IFwidGFibGUtY2FwdGlvblwiIHwgXCJ0YWJsZS1jb2x1bW4tZ3JvdXBcIiB8IFwidGFibGUtaGVhZGVyLWdyb3VwXCIgfCBcInRhYmxlLWZvb3Rlci1ncm91cFwiIHwgXCJ0YWJsZS1yb3ctZ3JvdXBcIiB8IFwidGFibGUtY2VsbFwiIHwgXCJ0YWJsZS1jb2x1bW5cIiB8IFwidGFibGUtcm93XCIgfCBcIm5vbmVcIiB8IFwiaW5pdGlhbFwiIHwgXCJpbmhlcml0XCJcbiAgICBmbGV4RGlyZWN0aW9uOiBcInJvd1wiIHwgXCJyb3ctcmV2ZXJzZVwiIHwgXCJjb2x1bW5cIiB8IFwiY29sdW1uLXJldmVyc2VcIiB8IFwiaW5pdGlhbFwiIHwgXCJpbmhlcml0XCJcbiAgICBvdmVyZmxvdyAgICAgOiBcInZpc2libGVcIiB8IFwiaGlkZGVuXCIgfCBcInNjcm9sbFwiIHwgXCJhdXRvXCIgfCBcImluaXRpYWxcIiB8IFwiaW5oZXJpdFwiXG4gICAgb3ZlcmZsb3dYICAgIDogXCJ2aXNpYmxlXCIgfCBcImhpZGRlblwiIHwgXCJzY3JvbGxcIiB8IFwiYXV0b1wiIHwgXCJpbml0aWFsXCIgfCBcImluaGVyaXRcIlxuICAgIG92ZXJmbG93WSAgICA6IFwidmlzaWJsZVwiIHwgXCJoaWRkZW5cIiB8IFwic2Nyb2xsXCIgfCBcImF1dG9cIiB8IFwiaW5pdGlhbFwiIHwgXCJpbmhlcml0XCJcbiAgICBwb3NpdGlvbiAgICAgOiBcInN0YXRpY1wiIHwgXCJhYnNvbHV0ZVwiIHwgXCJmaXhlZFwiIHwgXCJyZWxhdGl2ZVwiIHwgXCJzdGlja3lcIiB8IFwiaW5pdGlhbFwiIHwgXCJpbmhlcml0XCJcbn1cblxuLypkZWNsYXJlIGdsb2JhbHtcblxuICAgICBpbnRlcmZhY2UgV2luZG93XG4gICAgIHtcbiAgICAgICAgICBvbjogV2luZG93IFtcImFkZEV2ZW50TGlzdGVuZXJcIl1cbiAgICAgICAgICBvZmY6IFdpbmRvdyBbXCJyZW1vdmVFdmVudExpc3RlbmVyXCJdXG4gICAgIH1cblxuICAgICBpbnRlcmZhY2UgRWxlbWVudFxuICAgICB7XG4gICAgICAgICAgY3NzICggcHJvcGVydGllczogUGFydGlhbCA8RXh0ZW5kZWRDU1NTdHlsZURlY2xhcmF0aW9uPiApOiB0aGlzXG5cbiAgICAgICAgICBjc3NJbnQgICAoIHByb3BlcnR5OiBzdHJpbmcgKTogbnVtYmVyXG4gICAgICAgICAgY3NzRmxvYXQgKCBwcm9wZXJ0eTogc3RyaW5nICk6IG51bWJlclxuXG4gICAgICAgICAgb24gOiBIVE1MRWxlbWVudCBbXCJhZGRFdmVudExpc3RlbmVyXCJdXG4gICAgICAgICAgb2ZmOiBIVE1MRWxlbWVudCBbXCJyZW1vdmVFdmVudExpc3RlbmVyXCJdXG4gICAgICAgICAgJCAgOiBIVE1MRWxlbWVudCBbXCJxdWVyeVNlbGVjdG9yXCJdXG4gICAgICAgICAgJCQgOiBIVE1MRWxlbWVudCBbXCJxdWVyeVNlbGVjdG9yQWxsXCJdXG4gICAgIH1cbn1cblxuV2luZG93LnByb3RvdHlwZS5vbiAgPSBXaW5kb3cucHJvdG90eXBlLmFkZEV2ZW50TGlzdGVuZXJcbldpbmRvdy5wcm90b3R5cGUub2ZmID0gV2luZG93LnByb3RvdHlwZS5yZW1vdmVFdmVudExpc3RlbmVyXG5cbkVsZW1lbnQucHJvdG90eXBlLmNzcyA9IGZ1bmN0aW9uICggcHJvcHMgKVxue1xuT2JqZWN0LmFzc2lnbiAoIHRoaXMuc3R5bGUsIHByb3BzIClcbnJldHVybiB0aGlzXG59XG5cbkVsZW1lbnQucHJvdG90eXBlLmNzc0ludCA9IGZ1bmN0aW9uICggcHJvcGVydHk6IHN0cmluZyApXG57XG4gICAgIHZhciB2YWx1ZSA9IHBhcnNlSW50ICggdGhpcy5zdHlsZSBbIHByb3BlcnR5IF0gKVxuXG4gICAgIGlmICggTnVtYmVyLmlzTmFOICggdmFsdWUgKSApXG4gICAgIHtcbiAgICAgICAgICB2YWx1ZSA9IHBhcnNlSW50ICggd2luZG93LmdldENvbXB1dGVkU3R5bGUgKCB0aGlzICkgWyBwcm9wZXJ0eSBdIClcblxuICAgICAgICAgIGlmICggTnVtYmVyLmlzTmFOICggdmFsdWUgKSApXG4gICAgICAgICAgICAgICB2YWx1ZSA9IDBcbiAgICAgfVxuXG4gICAgIHJldHVybiB2YWx1ZVxufVxuXG5FbGVtZW50LnByb3RvdHlwZS5jc3NGbG9hdCA9IGZ1bmN0aW9uICggcHJvcGVydHk6IHN0cmluZyApXG57XG4gICAgIHZhciB2YWx1ZSA9IHBhcnNlRmxvYXQgKCB0aGlzLnN0eWxlIFsgcHJvcGVydHkgXSApXG5cbiAgICAgaWYgKCBOdW1iZXIuaXNOYU4gKCB2YWx1ZSApIClcbiAgICAge1xuICAgICAgICAgIHZhbHVlID0gcGFyc2VGbG9hdCAoIHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlICggdGhpcyApIFsgcHJvcGVydHkgXSApXG5cbiAgICAgICAgICBpZiAoIE51bWJlci5pc05hTiAoIHZhbHVlICkgKVxuICAgICAgICAgICAgICAgdmFsdWUgPSAwXG4gICAgIH1cblxuICAgICByZXR1cm4gdmFsdWVcbn1cblxuRWxlbWVudC5wcm90b3R5cGUub24gID0gRWxlbWVudC5wcm90b3R5cGUuYWRkRXZlbnRMaXN0ZW5lclxuXG5FbGVtZW50LnByb3RvdHlwZS5vZmYgPSBFbGVtZW50LnByb3RvdHlwZS5yZW1vdmVFdmVudExpc3RlbmVyXG5cbkVsZW1lbnQucHJvdG90eXBlLiQgICA9IEVsZW1lbnQucHJvdG90eXBlLnF1ZXJ5U2VsZWN0b3JcblxuRWxlbWVudC5wcm90b3R5cGUuJCQgID0gRWxlbWVudC5wcm90b3R5cGUucXVlcnlTZWxlY3RvckFsbFxuXG5cbkVsZW1lbnQucHJvdG90eXBlLmNzc0ludCA9IGZ1bmN0aW9uICggcHJvcGVydHk6IHN0cmluZyApXG57XG4gICAgIHZhciB2YWx1ZSA9IHBhcnNlSW50ICggdGhpcy5zdHlsZSBbIHByb3BlcnR5IF0gKVxuXG4gICAgIGlmICggTnVtYmVyLmlzTmFOICggdmFsdWUgKSApXG4gICAgIHtcbiAgICAgICAgICBjb25zdCBzdHlsZSA9IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlICggdGhpcyApXG5cbiAgICAgICAgICB2YWx1ZSA9IHBhcnNlSW50ICggc3R5bGUgWyBwcm9wZXJ0eSBdIClcblxuICAgICAgICAgIGlmICggTnVtYmVyLmlzTmFOICggdmFsdWUgKSApXG4gICAgICAgICAgICAgICB2YWx1ZSA9IDBcbiAgICAgfVxuXG4gICAgIHJldHVybiB2YWx1ZVxufSovXG5cbmV4cG9ydCBmdW5jdGlvbiBjc3MgKCBlbDogSFRNTEVsZW1lbnQgfCBTVkdFbGVtZW50LCBwcm9wczogUGFydGlhbCA8RXh0ZW5kZWRDU1NTdHlsZURlY2xhcmF0aW9uPiApXG57XG4gICAgIE9iamVjdC5hc3NpZ24gKCBlbC5zdHlsZSwgcHJvcHMgKVxufVxuXG5leHBvcnQgZnVuY3Rpb24gY3NzRmxvYXQgKCBlbDogSFRNTEVsZW1lbnQgfCBTVkdFbGVtZW50LCBwcm9wZXJ0eTogc3RyaW5nIClcbntcbiAgICAgdmFyIHZhbHVlID0gcGFyc2VGbG9hdCAoIGVsLnN0eWxlIFsgcHJvcGVydHkgXSApXG5cbiAgICAgaWYgKCBOdW1iZXIuaXNOYU4gKCB2YWx1ZSApIClcbiAgICAge1xuICAgICAgICAgIHZhbHVlID0gcGFyc2VGbG9hdCAoIHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlICggZWwgKSBbIHByb3BlcnR5IF0gKVxuXG4gICAgICAgICAgaWYgKCBOdW1iZXIuaXNOYU4gKCB2YWx1ZSApIClcbiAgICAgICAgICAgICAgIHZhbHVlID0gMFxuICAgICB9XG5cbiAgICAgcmV0dXJuIHZhbHVlXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjc3NJbnQgKCBlbDogSFRNTEVsZW1lbnQgfCBTVkdFbGVtZW50LCBwcm9wZXJ0eTogc3RyaW5nIClcbntcbiAgICAgdmFyIHZhbHVlID0gcGFyc2VJbnQgKCBlbC5zdHlsZSBbIHByb3BlcnR5IF0gKVxuXG4gICAgIGlmICggTnVtYmVyLmlzTmFOICggdmFsdWUgKSApXG4gICAgIHtcbiAgICAgICAgICBjb25zdCBzdHlsZSA9IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlICggZWwgKVxuXG4gICAgICAgICAgdmFsdWUgPSBwYXJzZUludCAoIHN0eWxlIFsgcHJvcGVydHkgXSApXG5cbiAgICAgICAgICBpZiAoIE51bWJlci5pc05hTiAoIHZhbHVlICkgKVxuICAgICAgICAgICAgICAgdmFsdWUgPSAwXG4gICAgIH1cblxuICAgICByZXR1cm4gdmFsdWVcbn1cblxuIiwiXG5pbXBvcnQgKiBhcyBVaSBmcm9tIFwiLi9kcmFnZ2FibGUuanNcIlxuaW1wb3J0IHsgY3NzSW50IH0gZnJvbSBcIi4vZG9tLmpzXCJcblxudHlwZSBEaXJlY3Rpb24gPSBcImxyXCIgfCBcInJsXCIgfCBcImJ0XCIgfCBcInRiXCJcblxuLy9leHBvcnQgdHlwZSBFeHBlbmRhYmxlUHJvcGVydHkgPSBcIndpZHRoXCIgfCBcImhlaWdodFwiXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8IFwidG9wXCIgfCBcImxlZnRcIiB8IFwiYm90dG9tXCIgfCBcInJpZ2h0XCJcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHwgXCJ4XCIgfCBcInlcIlxuXG5leHBvcnQgdHlwZSBFeHBlbmRhYmxlRWxlbWVudCA9IFJldHVyblR5cGUgPHR5cGVvZiBleHBhbmRhYmxlPlxuXG50eXBlIEV4cGVuZGFibGVPcHRpb25zID0gUGFydGlhbCA8RXhwZW5kYWJsZUNvbmZpZz5cblxuaW50ZXJmYWNlIEV4cGVuZGFibGVDb25maWdcbntcbiAgICAgaGFuZGxlcyAgICAgIDogSlNYLkVsZW1lbnQgW11cbiAgICAgcHJvcGVydHk/ICAgIDogc3RyaW5nLFxuICAgICBvcGVuICAgICAgICAgOiBib29sZWFuXG4gICAgIG5lYXIgICAgICAgICA6IG51bWJlclxuICAgICBkZWxheSAgICAgICAgOiBudW1iZXJcbiAgICAgZGlyZWN0aW9uICAgIDogRGlyZWN0aW9uXG4gICAgIG1pblNpemUgICAgICA6IG51bWJlclxuICAgICBtYXhTaXplICAgICAgOiBudW1iZXJcbiAgICAgdW5pdCAgICAgICAgIDogXCJweFwiIHwgXCIlXCIgfCBcIlwiLFxuICAgICBvbkJlZm9yZU9wZW4gOiAoKSA9PiB2b2lkXG4gICAgIG9uQWZ0ZXJPcGVuICA6ICgpID0+IHZvaWRcbiAgICAgb25CZWZvcmVDbG9zZTogKCkgPT4gdm9pZFxuICAgICBvbkFmdGVyQ2xvc2UgOiAoKSA9PiB2b2lkXG59XG5cbmNvbnN0IHZlcnRpY2FsUHJvcGVydGllcyA9IFsgXCJoZWlnaHRcIiwgXCJ0b3BcIiwgXCJib3R0b21cIiBdXG5cbmZ1bmN0aW9uIGRlZmF1bHRDb25maWcgKCk6IEV4cGVuZGFibGVDb25maWdcbntcbiAgICAgcmV0dXJuIHtcbiAgICAgICAgICBoYW5kbGVzICAgICAgOiBbXSxcbiAgICAgICAgICBwcm9wZXJ0eSAgICAgOiBcImhlaWdodFwiLFxuICAgICAgICAgIG9wZW4gICAgICAgICA6IGZhbHNlLFxuICAgICAgICAgIG5lYXIgICAgICAgICA6IDQwLFxuICAgICAgICAgIGRlbGF5ICAgICAgICA6IDI1MCxcbiAgICAgICAgICBtaW5TaXplICAgICAgOiAwLFxuICAgICAgICAgIG1heFNpemUgICAgICA6IHdpbmRvdy5pbm5lckhlaWdodCxcbiAgICAgICAgICB1bml0ICAgICAgICAgOiBcInB4XCIsXG4gICAgICAgICAgZGlyZWN0aW9uICAgIDogXCJ0YlwiLFxuICAgICAgICAgIG9uQmVmb3JlT3BlbiA6ICgpID0+IHt9LFxuICAgICAgICAgIG9uQWZ0ZXJPcGVuICA6ICgpID0+IHt9LFxuICAgICAgICAgIG9uQmVmb3JlQ2xvc2U6ICgpID0+IHt9LFxuICAgICAgICAgIG9uQWZ0ZXJDbG9zZSA6ICgpID0+IHt9LFxuICAgICB9XG59XG5cbmNvbnN0IHRvU2lnbiA9IHtcbiAgICAgbHIgOiAxLFxuICAgICBybCA6IC0xLFxuICAgICB0YiA6IC0xLFxuICAgICBidCA6IDEsXG59XG5jb25zdCB0b1Byb3BlcnR5IDogUmVjb3JkIDxEaXJlY3Rpb24sIHN0cmluZz4gPSB7XG4gICAgIGxyIDogXCJ3aWR0aFwiLFxuICAgICBybCA6IFwid2lkdGhcIixcbiAgICAgdGIgOiBcImhlaWdodFwiLFxuICAgICBidCA6IFwiaGVpZ2h0XCIsXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBleHBhbmRhYmxlICggZWxlbWVudDogSlNYLkVsZW1lbnQsIG9wdGlvbnM6IEV4cGVuZGFibGVPcHRpb25zID0ge30gKVxue1xuICAgICBjb25zdCBjb25maWcgPSBkZWZhdWx0Q29uZmlnICgpXG5cbiAgICAgdmFyIGlzX29wZW4gICAgOiBib29sZWFuXG4gICAgIHZhciBpc192ZXJ0aWNhbDogYm9vbGVhblxuICAgICB2YXIgc2lnbiAgICAgICA6IG51bWJlclxuICAgICB2YXIgdW5pdCAgICAgICA6IEV4cGVuZGFibGVDb25maWcgW1widW5pdFwiXVxuICAgICB2YXIgY2IgICAgICAgICA6ICgpID0+IHZvaWRcbiAgICAgdmFyIG1pblNpemUgICAgOiBudW1iZXJcbiAgICAgdmFyIG1heFNpemUgICAgOiBudW1iZXJcbiAgICAgdmFyIHN0YXJ0X3NpemUgID0gMFxuICAgICB2YXIgb3Blbl9zaXplICAgPSAxMDBcblxuICAgICBjb25zdCBkcmFnZ2FibGUgPSBVaS5kcmFnZ2FibGUgKHtcbiAgICAgICAgICBoYW5kbGVzICAgICAgIDogW10sXG4gICAgICAgICAgb25TdGFydERyYWcgICA6IG9uU3RhcnREcmFnLFxuICAgICAgICAgIG9uU3RvcERyYWcgICAgOiBvblN0b3BEcmFnLFxuICAgICAgICAgIG9uRW5kQW5pbWF0aW9uOiBvbkVuZEFuaW1hdGlvbixcbiAgICAgfSlcblxuICAgICB1cGRhdGVDb25maWcgKCBvcHRpb25zIClcblxuICAgICBmdW5jdGlvbiB1cGRhdGVDb25maWcgKCBvcHRpb25zID0ge30gYXMgRXhwZW5kYWJsZU9wdGlvbnMgKVxuICAgICB7XG4gICAgICAgICAgaWYgKCBvcHRpb25zLnByb3BlcnR5ID09IHVuZGVmaW5lZCAmJiBvcHRpb25zLmRpcmVjdGlvbiAhPSB1bmRlZmluZWQgKVxuICAgICAgICAgICAgICAgb3B0aW9ucy5wcm9wZXJ0eSA9IHRvUHJvcGVydHkgW29wdGlvbnMuZGlyZWN0aW9uXVxuXG4gICAgICAgICAgT2JqZWN0LmFzc2lnbiAoIGNvbmZpZywgb3B0aW9ucyApXG5cbiAgICAgICAgICBpc19vcGVuICAgICA9IGNvbmZpZy5vcGVuXG4gICAgICAgICAgc2lnbiAgICAgICAgPSB0b1NpZ24gW2NvbmZpZy5kaXJlY3Rpb25dXG4gICAgICAgICAgdW5pdCAgICAgICAgPSBjb25maWcudW5pdFxuICAgICAgICAgIGlzX3ZlcnRpY2FsID0gY29uZmlnLmRpcmVjdGlvbiA9PSBcImJ0XCIgfHwgY29uZmlnLmRpcmVjdGlvbiA9PSBcInRiXCIgPyB0cnVlIDogZmFsc2VcbiAgICAgICAgICBtaW5TaXplID0gY29uZmlnLm1pblNpemVcbiAgICAgICAgICBtYXhTaXplID0gY29uZmlnLm1heFNpemVcblxuICAgICAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZSAoIGlzX3ZlcnRpY2FsID8gXCJob3Jpem9udGFsXCIgOiBcInZlcnRpY2FsXCIgKVxuICAgICAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LmFkZCAgICAoIGlzX3ZlcnRpY2FsID8gXCJ2ZXJ0aWNhbFwiIDogXCJob3Jpem9udGFsXCIgKVxuXG4gICAgICAgICAgZHJhZ2dhYmxlLnVwZGF0ZUNvbmZpZyAoe1xuICAgICAgICAgICAgICAgaGFuZGxlczogY29uZmlnLmhhbmRsZXMsXG4gICAgICAgICAgICAgICBvbkRyYWcgOiBpc192ZXJ0aWNhbCA/IG9uRHJhZ1ZlcnRpY2FsOiBvbkRyYWdIb3Jpem9udGFsLFxuICAgICAgICAgIH0pXG4gICAgIH1cbiAgICAgZnVuY3Rpb24gc2l6ZSAoKVxuICAgICB7XG4gICAgICAgICAgcmV0dXJuIGlzX29wZW4gPyBjc3NJbnQgKCBlbGVtZW50LCBjb25maWcucHJvcGVydHkgKSA6IDBcbiAgICAgfVxuICAgICBmdW5jdGlvbiB0b2dnbGUgKClcbiAgICAge1xuICAgICAgICAgIGlmICggaXNfb3BlbiApXG4gICAgICAgICAgICAgICBjbG9zZSAoKVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgIG9wZW4gKClcbiAgICAgfVxuICAgICBmdW5jdGlvbiBvcGVuICgpXG4gICAgIHtcbiAgICAgICAgICBjb25maWcub25CZWZvcmVPcGVuICgpXG5cbiAgICAgICAgICBlbGVtZW50LmNsYXNzTGlzdC5hZGQgKCBcImFuaW1hdGVcIiApXG4gICAgICAgICAgZWxlbWVudC5jbGFzc0xpc3QucmVwbGFjZSAoIFwiY2xvc2VcIiwgXCJvcGVuXCIgKVxuXG4gICAgICAgICAgaWYgKCBjYiApXG4gICAgICAgICAgICAgICBvblRyYW5zaXRpb25FbmQgKClcblxuICAgICAgICAgIGNiID0gY29uZmlnLm9uQWZ0ZXJPcGVuXG4gICAgICAgICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyICggXCJ0cmFuc2l0aW9uZW5kXCIsICgpID0+IG9uVHJhbnNpdGlvbkVuZCApXG5cbiAgICAgICAgICBlbGVtZW50LnN0eWxlIFsgY29uZmlnLnByb3BlcnR5IF0gPSBvcGVuX3NpemUgKyB1bml0XG5cbiAgICAgICAgICBpc19vcGVuID0gdHJ1ZVxuICAgICB9XG4gICAgIGZ1bmN0aW9uIGNsb3NlICgpXG4gICAgIHtcbiAgICAgICAgICBjb25maWcub25CZWZvcmVDbG9zZSAoKVxuXG4gICAgICAgICAgb3Blbl9zaXplID0gc2l6ZSAoKVxuXG4gICAgICAgICAgZWxlbWVudC5jbGFzc0xpc3QuYWRkICggXCJhbmltYXRlXCIgKVxuICAgICAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LnJlcGxhY2UgKCBcIm9wZW5cIiwgXCJjbG9zZVwiIClcblxuICAgICAgICAgIGlmICggY2IgKVxuICAgICAgICAgICAgICAgb25UcmFuc2l0aW9uRW5kICgpXG5cbiAgICAgICAgICBjYiA9IGNvbmZpZy5vbkFmdGVyQ2xvc2VcbiAgICAgICAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIgKCBcInRyYW5zaXRpb25lbmRcIiwgb25UcmFuc2l0aW9uRW5kIClcblxuICAgICAgICAgIGVsZW1lbnQuc3R5bGUgWyBjb25maWcucHJvcGVydHkgXSA9IFwiMFwiICsgdW5pdFxuXG4gICAgICAgICAgaXNfb3BlbiA9IGZhbHNlXG4gICAgIH1cblxuICAgICByZXR1cm4ge1xuICAgICAgICAgIHVwZGF0ZUNvbmZpZyxcbiAgICAgICAgICBvcGVuLFxuICAgICAgICAgIGNsb3NlLFxuICAgICAgICAgIHRvZ2dsZSxcbiAgICAgICAgICBpc09wZW4gICAgIDogKCkgPT4gaXNfb3BlbixcbiAgICAgICAgICBpc0Nsb3NlICAgIDogKCkgPT4gISBpc19vcGVuLFxuICAgICAgICAgIGlzVmVydGljYWwgOiAoKSA9PiBpc192ZXJ0aWNhbCxcbiAgICAgICAgICBpc0FjdGl2ZSAgIDogKCkgPT4gZHJhZ2dhYmxlLmlzQWN0aXZlICgpLFxuICAgICAgICAgIGFjdGl2YXRlICAgOiAoKSA9PiBkcmFnZ2FibGUuYWN0aXZhdGUgKCksXG4gICAgICAgICAgZGVzYWN0aXZhdGU6ICgpID0+IGRyYWdnYWJsZS5kZXNhY3RpdmF0ZSAoKSxcbiAgICAgfVxuXG4gICAgIGZ1bmN0aW9uIG9uVHJhbnNpdGlvbkVuZCAoKVxuICAgICB7XG4gICAgICAgICAgaWYgKCBjYiApXG4gICAgICAgICAgICAgICBjYiAoKVxuICAgICAgICAgIGVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lciAoIFwidHJhbnNpdGlvbmVuZFwiLCAoKSA9PiBvblRyYW5zaXRpb25FbmQgKVxuICAgICAgICAgIGNiID0gbnVsbFxuICAgICB9XG5cbiAgICAgZnVuY3Rpb24gb25TdGFydERyYWcgKClcbiAgICAge1xuICAgICAgICAgIHN0YXJ0X3NpemUgPSBzaXplICgpXG4gICAgICAgICAgZWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlICggXCJhbmltYXRlXCIgKVxuICAgICB9XG4gICAgIGZ1bmN0aW9uIG9uRHJhZ1ZlcnRpY2FsICggZXZlbnQ6IFVpLkRyYWdFdmVudCApXG4gICAgIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyAoIG1pblNpemUsIGV2ZW50LnksIG1heFNpemUgKVxuICAgICAgICAgIGNvbnNvbGUubG9nICggY2xhbXAgKCBzdGFydF9zaXplICsgc2lnbiAqIGV2ZW50LnkgKSArIHVuaXQgKVxuICAgICAgICAgIGVsZW1lbnQuc3R5bGUgWyBjb25maWcucHJvcGVydHkgXSA9IGNsYW1wICggc3RhcnRfc2l6ZSArIHNpZ24gKiBldmVudC55ICkgKyB1bml0XG4gICAgIH1cbiAgICAgZnVuY3Rpb24gb25EcmFnSG9yaXpvbnRhbCAoIGV2ZW50OiBVaS5EcmFnRXZlbnQgKVxuICAgICB7XG4gICAgICAgICAgZWxlbWVudC5zdHlsZSBbIGNvbmZpZy5wcm9wZXJ0eSBdID0gY2xhbXAgKCBzdGFydF9zaXplICsgc2lnbiAqIGV2ZW50LnggKSArIHVuaXRcbiAgICAgfVxuICAgICBmdW5jdGlvbiBvblN0b3BEcmFnICggZXZlbnQ6IFVpLkRyYWdFdmVudCApXG4gICAgIHtcbiAgICAgICAgICB2YXIgaXNfbW92ZWQgPSBpc192ZXJ0aWNhbCA/IHNpZ24gKiBldmVudC55ID4gY29uZmlnLm5lYXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IHNpZ24gKiBldmVudC54ID4gY29uZmlnLm5lYXJcblxuICAgICAgICAgIGlmICggKGlzX21vdmVkID09IGZhbHNlKSAmJiBldmVudC5kZWxheSA8PSBjb25maWcuZGVsYXkgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHRvZ2dsZSAoKVxuICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29uc3QgdGFyZ2V0X3NpemUgPSBjbGFtcCAoXG4gICAgICAgICAgICAgICBpc192ZXJ0aWNhbCA/IHN0YXJ0X3NpemUgKyBzaWduICogZXZlbnQudGFyZ2V0WVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBzdGFydF9zaXplICsgc2lnbiAqIGV2ZW50LnRhcmdldFhcbiAgICAgICAgICApXG5cbiAgICAgICAgICBpZiAoIHRhcmdldF9zaXplIDw9IGNvbmZpZy5uZWFyIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBjbG9zZSAoKVxuICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIHRydWVcblxuICAgICB9XG4gICAgIGZ1bmN0aW9uIG9uRW5kQW5pbWF0aW9uICgpXG4gICAgIHtcbiAgICAgICAgICBvcGVuX3NpemUgPSBjc3NJbnQgKCBlbGVtZW50LCBjb25maWcucHJvcGVydHkgKVxuICAgICAgICAgIG9wZW4gKClcbiAgICAgfVxuXG4gICAgIGZ1bmN0aW9uIGNsYW1wICggdjogbnVtYmVyIClcbiAgICAge1xuICAgICAgICAgIGlmICggdiA8IG1pblNpemUgKVxuICAgICAgICAgICAgICAgcmV0dXJuIG1pblNpemVcblxuICAgICAgICAgIGlmICggdiA+IG1heFNpemUgKVxuICAgICAgICAgICAgICAgcmV0dXJuIG1heFNpemVcblxuICAgICAgICAgIHJldHVybiB2XG4gICAgIH1cbn1cbiIsIlxuaW1wb3J0IHsgQ3NzIH0gZnJvbSBcIi4uLy4uL0xpYi9pbmRleC5qc1wiXG5pbXBvcnQgeyBjc3NGbG9hdCB9IGZyb20gXCIuL2RvbS5qc1wiXG5pbXBvcnQgKiBhcyBVaSBmcm9tIFwiLi9kcmFnZ2FibGUuanNcIlxuaW1wb3J0IHsgeG5vZGUgfSBmcm9tIFwiLi94bm9kZS5qc1wiXG5cbnR5cGUgRGlyZWN0aW9uICAgPSBcImxyXCIgfCBcInJsXCIgfCBcImJ0XCIgfCBcInRiXCJcbnR5cGUgT3JpZW50YXRpb24gPSBcInZlcnRpY2FsXCIgfCBcImhvcml6b250YWxcIlxudHlwZSBVbml0cyAgICAgICA9IFwicHhcIiB8IFwiJVwiXG50eXBlIFN3aXBlYWJsZVByb3BlcnR5ID0gXCJ0b3BcIiB8IFwibGVmdFwiIHwgXCJib3R0b21cIiB8IFwicmlnaHRcIlxuICAgICAgICAgICAgICAgICAgICAgICAgIHwgXCJ4XCIgfCBcInlcIlxuXG50eXBlIFN3aXBlYWJsZU9wdGlvbnMgPSBQYXJ0aWFsIDxTd2lwZWFibGVDb25maWc+XG5cbnR5cGUgU3dpcGVhYmxlQ29uZmlnID0ge1xuICAgICBoYW5kbGVzICAgOiBKU1guRWxlbWVudCBbXVxuICAgICBkaXJlY3Rpb24gOiBEaXJlY3Rpb24sXG4gICAgIHBvcnBlcnR5PyA6IFN3aXBlYWJsZVByb3BlcnR5XG4gICAgIG1pblZhbHVlICA6IG51bWJlcixcbiAgICAgbWF4VmFsdWUgIDogbnVtYmVyLFxuICAgICB1bml0cyAgICAgOiBVbml0cyxcbiAgICAgbW91c2VXaGVlbDogYm9vbGVhblxufVxuXG5leHBvcnQgdHlwZSBTd2lwZWFibGVFbGVtZW50ID0gUmV0dXJuVHlwZSA8dHlwZW9mIHN3aXBlYWJsZT5cblxuZnVuY3Rpb24gZGVmYXVsdENvbmZpZyAoKTogU3dpcGVhYmxlQ29uZmlnXG57XG4gICAgIHJldHVybiB7XG4gICAgICAgICAgaGFuZGxlcyAgIDogW10sXG4gICAgICAgICAgZGlyZWN0aW9uIDogXCJsclwiLFxuICAgICAgICAgIHBvcnBlcnR5ICA6IFwibGVmdFwiLFxuICAgICAgICAgIG1pblZhbHVlICA6IC0xMDAsXG4gICAgICAgICAgbWF4VmFsdWUgIDogMCxcbiAgICAgICAgICB1bml0cyAgICAgOiBcIiVcIixcbiAgICAgICAgICBtb3VzZVdoZWVsOiB0cnVlLFxuICAgICB9XG59XG5cbnZhciBzdGFydF9wb3NpdGlvbiA9IDBcbnZhciBpc192ZXJ0aWNhbCAgICA9IGZhbHNlXG52YXIgcHJvcCA6IFN3aXBlYWJsZVByb3BlcnR5XG5cbmV4cG9ydCBmdW5jdGlvbiBzd2lwZWFibGUgKCBlbGVtZW50OiBKU1guRWxlbWVudCwgb3B0aW9uczogU3dpcGVhYmxlT3B0aW9ucyApXG57XG4gICAgIGNvbnN0IGNvbmZpZyA9IGRlZmF1bHRDb25maWcgKClcblxuICAgICBjb25zdCBkcmFnZ2FibGUgPSBVaS5kcmFnZ2FibGUgKHtcbiAgICAgICAgICBoYW5kbGVzOiBbXSxcbiAgICAgICAgICBvblN0YXJ0RHJhZyxcbiAgICAgICAgICBvblN0b3BEcmFnLFxuICAgICB9KVxuXG4gICAgIGVsZW1lbnQuY2xhc3NMaXN0LmFkZCAoIFwic3dpcGVhYmxlXCIgKVxuXG4gICAgIHVwZGF0ZUNvbmZpZyAoIG9wdGlvbnMgKVxuXG4gICAgIGZ1bmN0aW9uIHVwZGF0ZUNvbmZpZyAoIG9wdGlvbnM6IFN3aXBlYWJsZU9wdGlvbnMgKVxuICAgICB7XG4gICAgICAgICAgT2JqZWN0LmFzc2lnbiAoIGNvbmZpZywgb3B0aW9ucyApXG5cbiAgICAgICAgICBpc192ZXJ0aWNhbCA9IGNvbmZpZy5kaXJlY3Rpb24gPT0gXCJidFwiIHx8IGNvbmZpZy5kaXJlY3Rpb24gPT0gXCJ0YlwiXG5cbiAgICAgICAgICBpZiAoIG9wdGlvbnMucG9ycGVydHkgPT0gdW5kZWZpbmVkIClcbiAgICAgICAgICAgICAgIGNvbmZpZy5wb3JwZXJ0eSA9IGlzX3ZlcnRpY2FsID8gXCJ0b3BcIiA6IFwibGVmdFwiXG5cbiAgICAgICAgICAvLyBzd2l0Y2ggKCBjb25maWcucG9ycGVydHkgKVxuICAgICAgICAgIC8vIHtcbiAgICAgICAgICAvLyBjYXNlIFwidG9wXCI6IGNhc2UgXCJib3R0b21cIjogY2FzZSBcInlcIjogaXNfdmVydGljYWwgPSB0cnVlICA7IGJyZWFrXG4gICAgICAgICAgLy8gY2FzZSBcImxlZnRcIjogY2FzZSBcInJpZ2h0XCI6IGNhc2UgXCJ4XCI6IGlzX3ZlcnRpY2FsID0gZmFsc2UgOyBicmVha1xuICAgICAgICAgIC8vIGRlZmF1bHQ6IGRlYnVnZ2VyIDsgcmV0dXJuXG4gICAgICAgICAgLy8gfVxuXG4gICAgICAgICAgZHJhZ2dhYmxlLnVwZGF0ZUNvbmZpZyAoe1xuICAgICAgICAgICAgICAgaGFuZGxlczogY29uZmlnLmhhbmRsZXMsXG4gICAgICAgICAgICAgICBvbkRyYWc6IGlzX3ZlcnRpY2FsID8gb25EcmFnVmVydGljYWwgOiBvbkRyYWdIb3Jpem9udGFsXG4gICAgICAgICAgfSlcblxuICAgICAgICAgIHByb3AgPSBjb25maWcucG9ycGVydHlcblxuICAgICAgICAgIGlmICggZHJhZ2dhYmxlLmlzQWN0aXZlICgpIClcbiAgICAgICAgICAgICAgIGFjdGl2ZUV2ZW50cyAoKVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgIGRlc2FjdGl2ZUV2ZW50cyAoKVxuICAgICB9XG5cbiAgICAgZnVuY3Rpb24gcG9zaXRpb24gKClcbiAgICAge1xuICAgICAgICAgIHJldHVybiBjc3NGbG9hdCAoIGVsZW1lbnQsIHByb3AgKVxuICAgICB9XG5cbiAgICAgZnVuY3Rpb24gYWN0aXZhdGUgKClcbiAgICAge1xuICAgICAgICAgIGRyYWdnYWJsZS5hY3RpdmF0ZSAoKVxuICAgICAgICAgIGFjdGl2ZUV2ZW50cyAoKVxuICAgICB9XG4gICAgIGZ1bmN0aW9uIGRlc2FjdGl2YXRlICgpXG4gICAgIHtcbiAgICAgICAgICBkcmFnZ2FibGUuZGVzYWN0aXZhdGUgKClcbiAgICAgICAgICBkZXNhY3RpdmVFdmVudHMgKClcbiAgICAgfVxuXG4gICAgIGZ1bmN0aW9uIHN3aXBlICggb2Zmc2V0OiBzdHJpbmcgKTogdm9pZFxuICAgICBmdW5jdGlvbiBzd2lwZSAoIG9mZnNldDogbnVtYmVyLCB1bml0czogVW5pdHMgKTogdm9pZFxuICAgICBmdW5jdGlvbiBzd2lwZSAoIG9mZnNldDogc3RyaW5nfG51bWJlciwgdT86IFVuaXRzIClcbiAgICAge1xuICAgICAgICAgIGlmICggdHlwZW9mIG9mZnNldCA9PSBcInN0cmluZ1wiIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICB1ID0gQ3NzLmdldFVuaXQgKCBvZmZzZXQgKSBhcyBVbml0c1xuICAgICAgICAgICAgICAgb2Zmc2V0ID0gcGFyc2VGbG9hdCAoIG9mZnNldCApXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKCAhIFtcInB4XCIsIFwiJVwiXS5pbmNsdWRlcyAoIHUgKSApXG4gICAgICAgICAgICAgICB1ID0gXCJweFwiXG5cbiAgICAgICAgICBpZiAoIHUgIT0gY29uZmlnLnVuaXRzIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBpZiAoICh1ID0gY29uZmlnLnVuaXRzKSA9PSBcIiVcIiApXG4gICAgICAgICAgICAgICAgICAgIG9mZnNldCA9IHRvUGVyY2VudHMgKCBvZmZzZXQgKVxuICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBvZmZzZXQgPSB0b1BpeGVscyAoIG9mZnNldCApXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgZWxlbWVudC5zdHlsZSBbcHJvcF0gPSBjbGFtcCAoIG9mZnNldCApICsgdVxuICAgICB9XG5cbiAgICAgcmV0dXJuIHtcbiAgICAgICAgICB1cGRhdGVDb25maWcsXG4gICAgICAgICAgYWN0aXZhdGUsXG4gICAgICAgICAgZGVzYWN0aXZhdGUsXG4gICAgICAgICAgcG9zaXRpb24sXG4gICAgICAgICAgc3dpcGUsXG4gICAgIH1cblxuICAgICBmdW5jdGlvbiBhY3RpdmVFdmVudHMgKClcbiAgICAge1xuICAgICAgICAgIGlmICggY29uZmlnLm1vdXNlV2hlZWwgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGZvciAoIGNvbnN0IGggb2YgY29uZmlnLmhhbmRsZXMgKVxuICAgICAgICAgICAgICAgICAgICBoLmFkZEV2ZW50TGlzdGVuZXIgKCBcIndoZWVsXCIsIG9uV2hlZWwsIHsgcGFzc2l2ZTogdHJ1ZSB9IClcbiAgICAgICAgICB9XG4gICAgIH1cbiAgICAgZnVuY3Rpb24gZGVzYWN0aXZlRXZlbnRzICgpXG4gICAgIHtcbiAgICAgICAgICBmb3IgKCBjb25zdCBoIG9mIGNvbmZpZy5oYW5kbGVzIClcbiAgICAgICAgICAgICAgIGgucmVtb3ZlRXZlbnRMaXN0ZW5lciAoIFwid2hlZWxcIiwgb25XaGVlbCApXG4gICAgIH1cblxuICAgICBmdW5jdGlvbiB0b1BpeGVscyAoIHBlcmNlbnRhZ2U6IG51bWJlciApXG4gICAgIHtcbiAgICAgICAgICBjb25zdCB7IG1pblZhbHVlOiBtaW4sIG1heFZhbHVlOiBtYXggfSA9IGNvbmZpZ1xuXG4gICAgICAgICAgaWYgKCBwZXJjZW50YWdlIDwgMTAwIClcbiAgICAgICAgICAgICAgIHBlcmNlbnRhZ2UgPSAxMDAgKyBwZXJjZW50YWdlXG5cbiAgICAgICAgICByZXR1cm4gbWluICsgKG1heCAtIG1pbikgKiBwZXJjZW50YWdlIC8gMTAwXG4gICAgIH1cbiAgICAgZnVuY3Rpb24gdG9QZXJjZW50cyAoIHBpeGVsczogbnVtYmVyIClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHsgbWluVmFsdWU6IG1pbiwgbWF4VmFsdWU6IG1heCB9ID0gY29uZmlnXG4gICAgICAgICAgcmV0dXJuIE1hdGguYWJzICggKHBpeGVscyAtIG1pbikgLyAobWF4IC0gbWluKSAqIDEwMCApXG4gICAgIH1cblxuICAgICBmdW5jdGlvbiBvblN0YXJ0RHJhZyAoKVxuICAgICB7XG4gICAgICAgICAgZWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlICggXCJhbmltYXRlXCIgKVxuICAgICAgICAgIHN0YXJ0X3Bvc2l0aW9uID0gcG9zaXRpb24gKClcbiAgICAgfVxuICAgICBmdW5jdGlvbiBvbkRyYWdWZXJ0aWNhbCAoIGV2ZW50OiBVaS5EcmFnRXZlbnQgKVxuICAgICB7XG4gICAgICAgICAgZWxlbWVudC5zdHlsZSBbcHJvcF0gPSBjbGFtcCAoIHN0YXJ0X3Bvc2l0aW9uICsgZXZlbnQueSApICsgY29uZmlnLnVuaXRzXG4gICAgIH1cbiAgICAgZnVuY3Rpb24gb25EcmFnSG9yaXpvbnRhbCAoIGV2ZW50OiBVaS5EcmFnRXZlbnQgKVxuICAgICB7XG4gICAgICAgICAgZWxlbWVudC5zdHlsZSBbcHJvcF0gPSBjbGFtcCAoIHN0YXJ0X3Bvc2l0aW9uICsgZXZlbnQueCApICsgY29uZmlnLnVuaXRzXG4gICAgIH1cbiAgICAgZnVuY3Rpb24gb25TdG9wRHJhZyAoIGV2ZW50OiBVaS5EcmFnRXZlbnQgKVxuICAgICB7XG4gICAgICAgICAgZWxlbWVudC5jbGFzc0xpc3QuYWRkICggXCJhbmltYXRlXCIgKVxuXG4gICAgICAgICAgY29uc3Qgb2Zmc2V0ID0gaXNfdmVydGljYWxcbiAgICAgICAgICAgICAgICAgICAgICAgICA/IGV2ZW50LnkgLy8rIGV2ZW50LnZlbG9jaXR5WVxuICAgICAgICAgICAgICAgICAgICAgICAgIDogZXZlbnQueCAvLysgZXZlbnQudmVsb2NpdHlYXG5cbiAgICAgICAgICBlbGVtZW50LnN0eWxlIFtwcm9wXSA9IGNsYW1wICggc3RhcnRfcG9zaXRpb24gKyBvZmZzZXQgKSArIGNvbmZpZy51bml0c1xuICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgIH1cbiAgICAgZnVuY3Rpb24gb25XaGVlbCAoIGV2ZW50OiBXaGVlbEV2ZW50IClcbiAgICAge1xuICAgICAgICAgIGlmICggZXZlbnQuZGVsdGFNb2RlICE9IFdoZWVsRXZlbnQuRE9NX0RFTFRBX1BJWEVMIClcbiAgICAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgICAgaWYgKCBpc192ZXJ0aWNhbCApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgdmFyIGRlbHRhID0gZXZlbnQuZGVsdGFZXG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICB2YXIgZGVsdGEgPSBldmVudC5kZWx0YVhcblxuICAgICAgICAgICAgICAgaWYgKCBkZWx0YSA9PSAwIClcbiAgICAgICAgICAgICAgICAgICAgZGVsdGEgPSBldmVudC5kZWx0YVlcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBlbGVtZW50LnN0eWxlIFtwcm9wXSA9IGNsYW1wICggcG9zaXRpb24gKCkgKyBkZWx0YSApICsgY29uZmlnLnVuaXRzXG4gICAgIH1cbiAgICAgZnVuY3Rpb24gY2xhbXAgKCB2YWx1ZTogbnVtYmVyIClcbiAgICAge1xuICAgICAgICAgIHJldHVybiB2YWx1ZSA8IGNvbmZpZy5taW5WYWx1ZSA/IGNvbmZpZy5taW5WYWx1ZVxuICAgICAgICAgICAgICAgOiB2YWx1ZSA+IGNvbmZpZy5tYXhWYWx1ZSA/IGNvbmZpZy5tYXhWYWx1ZVxuICAgICAgICAgICAgICAgOiB2YWx1ZVxuICAgICB9XG59XG4iLCJcbi8qXG5leGFtcGxlOlxuaHR0cHM6Ly9wcmV6aS5jb20vcC85anFlMndrZmhoa3kvbGEtYnVsbG90ZXJpZS10cGNtbi9cbmh0dHBzOi8vbW92aWxhYi5vcmcvaW5kZXgucGhwP3RpdGxlPVV0aWxpc2F0ZXVyOkF1ciVDMyVBOWxpZW5NYXJ0eVxuKi9cblxuXG5pbXBvcnQgeyBHZW9tZXRyeSB9IGZyb20gXCIuLi8uLi9MaWIvaW5kZXguanNcIlxuXG5pbXBvcnQgeyBTaGFwZSB9ICAgZnJvbSBcIkBhcHAvQXNwZWN0L0VsZW1lbnQvc2hhcGUuanNcIlxuaW1wb3J0ICogYXMgYXNwZWN0IGZyb20gXCJAYXBwL0FzcGVjdC9kYi5qc1wiXG5pbXBvcnQgKiBhcyBkYiAgICAgZnJvbSBcIkBhcHAvZGF0YS5qc1wiXG5cbmltcG9ydCBcImZhYnJpY1wiXG5cbmZhYnJpYy5PYmplY3QucHJvdG90eXBlLnBhZGRpbmcgICAgICAgICAgICA9IDBcbmZhYnJpYy5PYmplY3QucHJvdG90eXBlLm9iamVjdENhY2hpbmcgICAgICA9IGZhbHNlXG5mYWJyaWMuT2JqZWN0LnByb3RvdHlwZS5oYXNDb250cm9scyAgICAgICAgPSB0cnVlXG5mYWJyaWMuT2JqZWN0LnByb3RvdHlwZS5oYXNCb3JkZXJzICAgICAgICAgPSB0cnVlXG5mYWJyaWMuT2JqZWN0LnByb3RvdHlwZS5oYXNSb3RhdGluZ1BvaW50ICAgPSBmYWxzZVxuZmFicmljLk9iamVjdC5wcm90b3R5cGUudHJhbnNwYXJlbnRDb3JuZXJzID0gZmFsc2VcbmZhYnJpYy5PYmplY3QucHJvdG90eXBlLmNlbnRlcmVkU2NhbGluZyAgICA9IHRydWVcbmZhYnJpYy5PYmplY3QucHJvdG90eXBlLmNvcm5lclN0eWxlICAgICAgICA9IFwiY2lyY2xlXCJcbmZhYnJpYy5PYmplY3QucHJvdG90eXBlLnNldENvbnRyb2xWaXNpYmxlICggXCJtbFwiLCBmYWxzZSApXG5mYWJyaWMuT2JqZWN0LnByb3RvdHlwZS5zZXRDb250cm9sVmlzaWJsZSAoIFwibXRcIiwgZmFsc2UgKVxuZmFicmljLk9iamVjdC5wcm90b3R5cGUuc2V0Q29udHJvbFZpc2libGUgKCBcIm1yXCIsIGZhbHNlIClcbmZhYnJpYy5PYmplY3QucHJvdG90eXBlLnNldENvbnRyb2xWaXNpYmxlICggXCJtYlwiLCBmYWxzZSApXG5mYWJyaWMuT2JqZWN0LnByb3RvdHlwZS5zZXRDb250cm9sVmlzaWJsZSAoIFwidGxcIiwgZmFsc2UgKVxuZmFicmljLk9iamVjdC5wcm90b3R5cGUuc2V0Q29udHJvbFZpc2libGUgKCBcImJsXCIsIGZhbHNlIClcbmZhYnJpYy5PYmplY3QucHJvdG90eXBlLnNldENvbnRyb2xWaXNpYmxlICggXCJiclwiLCBmYWxzZSApXG5cbmV4cG9ydCBpbnRlcmZhY2UgVmlld1xue1xuICAgICBuYW1lOiBzdHJpbmdcbiAgICAgYWN0aXZlOiBib29sZWFuXG4gICAgIGNoaWxkcmVuIDogU2hhcGUgW11cbiAgICAgdGh1bWJuYWlsOiBzdHJpbmdcbiAgICAgcGFja2luZyAgOiBcImVuY2xvc2VcIlxufVxuXG5leHBvcnQgY2xhc3MgQXJlYVxue1xuICAgICByZWFkb25seSBmY2FudmFzOiBmYWJyaWMuQ2FudmFzXG4gICAgIHByaXZhdGUgYWN0aXZlOiBWaWV3XG4gICAgIHByaXZhdGUgdmlld3MgPSB7fSBhcyBSZWNvcmQgPHN0cmluZywgVmlldz5cblxuICAgICBjb25zdHJ1Y3RvciAoIGNhbnZhczogSFRNTENhbnZhc0VsZW1lbnQgKVxuICAgICB7XG4gICAgICAgICAgdGhpcy5mY2FudmFzID0gbmV3IGZhYnJpYy5DYW52YXMgKCBjYW52YXMgKVxuICAgICAgICAgIHRoaXMuZW5hYmxlRXZlbnRzICgpXG4gICAgIH1cblxuICAgICBnZXQgdmlldyAoKVxuICAgICB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuYWN0aXZlXG4gICAgIH1cblxuICAgICBvdmVyRk9iamVjdDogZmFicmljLk9iamVjdCA9IHVuZGVmaW5lZFxuXG4gICAgIHN0YXRpYyBjdXJyZW50RXZlbnQ6IGZhYnJpYy5JRXZlbnRcbiAgICAgb25PdmVyT2JqZWN0ICA9IG51bGwgYXMgKCBvYmo6IFNoYXBlICkgPT4gdm9pZFxuICAgICBvbk91dE9iamVjdCAgID0gbnVsbCBhcyAoIG9iajogU2hhcGUgKSA9PiB2b2lkXG4gICAgIG9uVG91Y2hPYmplY3QgPSBudWxsIGFzICggb2JqOiBTaGFwZSApID0+IHZvaWRcbiAgICAgb25Eb3VibGVUb3VjaE9iamVjdCA9IG51bGwgYXMgKCBvYmo6IFNoYXBlICkgPT4gdm9pZFxuICAgICBvblRvdWNoQXJlYSAgID0gbnVsbCBhcyAoIHg6IG51bWJlciwgeTogbnVtYmVyICkgPT4gdm9pZFxuXG4gICAgIGNyZWF0ZVZpZXcgKCBuYW1lOiBzdHJpbmcgKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgeyB2aWV3cyB9ID0gdGhpc1xuXG4gICAgICAgICAgaWYgKCBuYW1lIGluIHZpZXdzIClcbiAgICAgICAgICAgICAgIHRocm93IFwiVGhlIHZpZXcgYWxyZWFkeSBleGlzdHNcIlxuXG4gICAgICAgICAgcmV0dXJuIHZpZXdzIFtuYW1lXSA9IHtcbiAgICAgICAgICAgICAgIG5hbWUsXG4gICAgICAgICAgICAgICBhY3RpdmUgICA6IGZhbHNlLFxuICAgICAgICAgICAgICAgY2hpbGRyZW4gOiBbXSxcbiAgICAgICAgICAgICAgIHBhY2tpbmcgIDogXCJlbmNsb3NlXCIsXG4gICAgICAgICAgICAgICB0aHVtYm5haWw6IG51bGwsXG4gICAgICAgICAgfVxuICAgICB9XG5cbiAgICAgdXNlICggbmFtZTogc3RyaW5nICk6IFZpZXdcbiAgICAgdXNlICggdmlldzogVmlldyApICA6IFZpZXdcbiAgICAgdXNlICggbmFtZTogc3RyaW5nIHwgVmlldyApOiBWaWV3XG4gICAgIHtcbiAgICAgICAgICBjb25zdCB7IGZjYW52YXMsIHZpZXdzIH0gPSB0aGlzXG5cbiAgICAgICAgICBpZiAoIHR5cGVvZiBuYW1lICE9IFwic3RyaW5nXCIgKVxuICAgICAgICAgICAgICAgbmFtZSA9IG5hbWUubmFtZVxuXG4gICAgICAgICAgaWYgKCB0aGlzLmFjdGl2ZSAmJiB0aGlzLmFjdGl2ZS5uYW1lID09IG5hbWUgKVxuICAgICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgICBpZiAoICEgKG5hbWUgaW4gdmlld3MpIClcbiAgICAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgICAgY29uc3QgYWN0aXZlID0gdGhpcy5hY3RpdmUgPSB2aWV3cyBbbmFtZV1cblxuICAgICAgICAgIGZjYW52YXMuY2xlYXIgKClcblxuICAgICAgICAgIGZvciAoIGNvbnN0IHNoYXBlIG9mIGFjdGl2ZS5jaGlsZHJlbiApXG4gICAgICAgICAgICAgICBmY2FudmFzLmFkZCAoIHNoYXBlLmdyb3VwIClcblxuICAgICAgICAgIHJldHVybiBhY3RpdmVcbiAgICAgfVxuXG4gICAgIGFkZCAoIC4uLiBzaGFwZXM6IChTaGFwZSB8ICROb2RlKSBbXSApOiB2b2lkXG4gICAgIGFkZCAoIC4uLiBwYXRoOiBzdHJpbmcgW10gKTogdm9pZFxuICAgICBhZGQgKClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHsgYWN0aXZlLCBmY2FudmFzIH0gPSB0aGlzXG5cbiAgICAgICAgICBpZiAoIGFyZ3VtZW50cy5sZW5ndGggPT0gMCApXG4gICAgICAgICAgICAgICByZXR1cm5cblxuICAgICAgICAgIGlmICggdHlwZW9mIGFyZ3VtZW50cyBbMF0gPT0gXCJzdHJpbmdcIiApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgLy9jb25zdCBub2RlID0gZGIuZ2V0Tm9kZSAoIC4uLiBhcmd1bWVudHMgYXMgYW55IGFzIHN0cmluZyBbXSApXG4gICAgICAgICAgICAgICBjb25zdCBub2RlID0gZGIubm9kZSAoIGFyZ3VtZW50cyBbMF0sIGFyZ3VtZW50cyBbMV0gYXMgc3RyaW5nICApXG4gICAgICAgICAgICAgICBjb25zdCBzaHAgPSBhc3BlY3QuZ2V0QXNwZWN0ICggbm9kZSApXG4gICAgICAgICAgICAgICBhY3RpdmUuY2hpbGRyZW4ucHVzaCAoIHNocCApXG4gICAgICAgICAgICAgICBmY2FudmFzLmFkZCAoIHNocC5ncm91cCApXG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2UgZm9yICggY29uc3QgcyBvZiBhcmd1bWVudHMgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNvbnN0IHNocCA9IGFzcGVjdC5nZXRBc3BlY3QgKCBzIGFzICROb2RlIHwgU2hhcGUgKVxuXG4gICAgICAgICAgICAgICAvLyBzaHAuZ2V0RmFicmljXG4gICAgICAgICAgICAgICAvLyBzaHAuZ2V0SHRtbFxuICAgICAgICAgICAgICAgLy8gc2hwLmdldFN2Z1xuXG4gICAgICAgICAgICAgICAvLyBmYWN0b3J5XG5cbiAgICAgICAgICAgICAgIGFjdGl2ZS5jaGlsZHJlbi5wdXNoICggc2hwIClcbiAgICAgICAgICAgICAgIGZjYW52YXMuYWRkICggc2hwLmdyb3VwIClcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBmY2FudmFzLnJlcXVlc3RSZW5kZXJBbGwgKClcbiAgICAgfVxuXG4gICAgIGNsZWFyICgpXG4gICAgIHtcbiAgICAgICAgICB0aGlzLmZjYW52YXMuY2xlYXIgKClcbiAgICAgfVxuXG4gICAgIHBhY2sgKClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHsgZmNhbnZhcyB9ID0gdGhpc1xuXG4gICAgICAgICAgY29uc3Qgb2JqZWN0cyA9IGZjYW52YXMuZ2V0T2JqZWN0cyAoKVxuICAgICAgICAgIGNvbnN0IHBvc2l0aW9ucyA9IFtdIGFzIEdlb21ldHJ5LkNpcmNsZSBbXVxuXG4gICAgICAgICAgZm9yICggY29uc3QgZyBvZiBvYmplY3RzIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBjb25zdCByID0gKGcud2lkdGggPiBnLmhlaWdodCA/IGcud2lkdGggOiBnLmhlaWdodCkgLyAyXG4gICAgICAgICAgICAgICBwb3NpdGlvbnMucHVzaCAoIHsgeDogZy5sZWZ0LCB5OiBnLnRvcCwgcjogciArIDIwIH0gKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIEdlb21ldHJ5LnBhY2tFbmNsb3NlICggcG9zaXRpb25zICkgKiAyXG5cbiAgICAgICAgICBmb3IgKCB2YXIgaSA9IDAgOyBpIDwgb2JqZWN0cy5sZW5ndGggOyBpKysgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNvbnN0IGcgPSBvYmplY3RzIFtpXVxuICAgICAgICAgICAgICAgY29uc3QgcCA9IHBvc2l0aW9ucyBbaV1cblxuICAgICAgICAgICAgICAgZy5sZWZ0ID0gcC54XG4gICAgICAgICAgICAgICBnLnRvcCAgPSBwLnlcbiAgICAgICAgICAgICAgIGcuc2V0Q29vcmRzICgpXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgZmNhbnZhcy5yZXF1ZXN0UmVuZGVyQWxsICgpXG4gICAgIH1cblxuICAgICB6b29tICggZmFjdG9yPzogbnVtYmVyIHwgU2hhcGUgKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgeyBmY2FudmFzIH0gPSB0aGlzXG5cbiAgICAgICAgICBpZiAoIHR5cGVvZiBmYWN0b3IgPT0gXCJudW1iZXJcIiApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29uc3Qgb2JqZWN0cyA9IGZjYW52YXMuZ2V0T2JqZWN0cyAoKVxuXG4gICAgICAgICAgaWYgKCB0eXBlb2YgZmFjdG9yID09IFwib2JqZWN0XCIgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNvbnN0IG8gPSBmYWN0b3IuZ3JvdXBcblxuICAgICAgICAgICAgICAgdmFyIGxlZnQgICA9IG8ubGVmdCAtIG8ud2lkdGhcbiAgICAgICAgICAgICAgIHZhciByaWdodCAgPSBvLmxlZnQgKyBvLndpZHRoXG4gICAgICAgICAgICAgICB2YXIgdG9wICAgID0gby50b3AgIC0gby5oZWlnaHRcbiAgICAgICAgICAgICAgIHZhciBib3R0b20gPSBvLnRvcCAgKyBvLmhlaWdodFxuXG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICB2YXIgbGVmdCAgID0gMFxuICAgICAgICAgICAgICAgdmFyIHJpZ2h0ICA9IDBcbiAgICAgICAgICAgICAgIHZhciB0b3AgICAgPSAwXG4gICAgICAgICAgICAgICB2YXIgYm90dG9tID0gMFxuXG4gICAgICAgICAgICAgICBmb3IgKCBjb25zdCBvIG9mIG9iamVjdHMgKVxuICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBsID0gby5sZWZ0IC0gby53aWR0aFxuICAgICAgICAgICAgICAgICAgICBjb25zdCByID0gby5sZWZ0ICsgby53aWR0aFxuICAgICAgICAgICAgICAgICAgICBjb25zdCB0ID0gby50b3AgIC0gby5oZWlnaHRcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYiA9IG8udG9wICArIG8uaGVpZ2h0XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCBsIDwgbGVmdCApXG4gICAgICAgICAgICAgICAgICAgICAgICAgbGVmdCA9IGxcblxuICAgICAgICAgICAgICAgICAgICBpZiAoIHIgPiByaWdodCApXG4gICAgICAgICAgICAgICAgICAgICAgICAgcmlnaHQgPSByXG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCB0IDwgdG9wIClcbiAgICAgICAgICAgICAgICAgICAgICAgICB0b3AgPSB0XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCBiID4gYm90dG9tIClcbiAgICAgICAgICAgICAgICAgICAgICAgICBib3R0b20gPSBiXG4gICAgICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29uc3QgdyAgPSByaWdodCAtIGxlZnRcbiAgICAgICAgICBjb25zdCBoICA9IGJvdHRvbSAtIHRvcFxuICAgICAgICAgIGNvbnN0IHZ3ID0gZmNhbnZhcy5nZXRXaWR0aCAgKClcbiAgICAgICAgICBjb25zdCB2aCA9IGZjYW52YXMuZ2V0SGVpZ2h0ICgpXG5cbiAgICAgICAgICBjb25zdCBmID0gdyA+IGhcbiAgICAgICAgICAgICAgICAgICAgPyAodncgPCB2aCA/IHZ3IDogdmgpIC8gd1xuICAgICAgICAgICAgICAgICAgICA6ICh2dyA8IHZoID8gdncgOiB2aCkgLyBoXG5cbiAgICAgICAgICBmY2FudmFzLnZpZXdwb3J0VHJhbnNmb3JtIFswXSA9IGZcbiAgICAgICAgICBmY2FudmFzLnZpZXdwb3J0VHJhbnNmb3JtIFszXSA9IGZcblxuICAgICAgICAgIGNvbnN0IGN4ID0gbGVmdCArIHcgLyAyXG4gICAgICAgICAgY29uc3QgY3kgPSB0b3AgICsgaCAvIDJcblxuICAgICAgICAgIGZjYW52YXMudmlld3BvcnRUcmFuc2Zvcm0gWzRdID0gLShjeCAqIGYpICsgdncgLyAyXG4gICAgICAgICAgZmNhbnZhcy52aWV3cG9ydFRyYW5zZm9ybSBbNV0gPSAtKGN5ICogZikgKyB2aCAvIDJcblxuICAgICAgICAgIGZvciAoIGNvbnN0IG8gb2Ygb2JqZWN0cyApXG4gICAgICAgICAgICAgICBvLnNldENvb3JkcyAoKVxuXG4gICAgICAgICAgZmNhbnZhcy5yZXF1ZXN0UmVuZGVyQWxsICgpXG4gICAgIH1cblxuICAgICBpc29sYXRlICggc2hhcGU6IFNoYXBlIClcbiAgICAge1xuICAgICAgICAgIGZvciAoIGNvbnN0IG8gb2YgdGhpcy5mY2FudmFzLmdldE9iamVjdHMgKCkgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIG8udmlzaWJsZSA9IGZhbHNlXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgc2hhcGUuZ3JvdXAudmlzaWJsZSA9IHRydWVcbiAgICAgfVxuXG4gICAgIGdldFRodW1ibmFpbCAoKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgeyBhY3RpdmU6IGN2aWV3IH0gPSB0aGlzXG5cbiAgICAgICAgICBjb25zdCB0aHVtYm5haWwgPSBjdmlldy50aHVtYm5haWxcblxuICAgICAgICAgIGlmICggdGh1bWJuYWlsIHx8IGN2aWV3LmFjdGl2ZSA9PSBmYWxzZSApXG4gICAgICAgICAgICAgICB0aHVtYm5haWxcblxuICAgICAgICAgIHJldHVybiBjdmlldy50aHVtYm5haWwgPSB0aGlzLmZjYW52YXMudG9EYXRhVVJMICh7IGZvcm1hdDogXCJqcGVnXCIgfSlcbiAgICAgfVxuXG4gICAgIC8vIFVJIEVWRU5UU1xuXG4gICAgIGVuYWJsZUV2ZW50cyAoKVxuICAgICB7XG4gICAgICAgICAgdGhpcy5pbml0Q2xpY2tFdmVudCAoKVxuICAgICAgICAgIHRoaXMuaW5pdE92ZXJFdmVudCAgKClcbiAgICAgICAgICB0aGlzLmluaXRQYW5FdmVudCAgICgpXG4gICAgICAgICAgdGhpcy5pbml0Wm9vbUV2ZW50ICAoKVxuICAgICAgICAgIC8vdGhpcy5pbml0TW92ZU9iamVjdCAoKVxuICAgICAgICAgIC8vdGhpcy5pbml0RHJhZ0V2ZW50ICAoKVxuXG4gICAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIgKCBcInJlc2l6ZVwiLCB0aGlzLnJlc3BvbnNpdmUuYmluZCAodGhpcykgKVxuICAgICB9XG5cbiAgICAgcHJpdmF0ZSByZXNwb25zaXZlICgpXG4gICAgIHtcbiAgICAgICAgICB2YXIgd2lkdGggICA9ICh3aW5kb3cuaW5uZXJXaWR0aCAgPiAwKSA/IHdpbmRvdy5pbm5lcldpZHRoICA6IHNjcmVlbi53aWR0aFxuICAgICAgICAgIHZhciBoZWlnaHQgID0gKHdpbmRvdy5pbm5lckhlaWdodCA+IDApID8gd2luZG93LmlubmVySGVpZ2h0IDogc2NyZWVuLmhlaWdodFxuXG4gICAgICAgICAgdGhpcy5mY2FudmFzLnNldERpbWVuc2lvbnMoe1xuICAgICAgICAgICAgICAgd2lkdGg6IHdpZHRoLFxuICAgICAgICAgICAgICAgaGVpZ2h0OiBoZWlnaHRcbiAgICAgICAgICB9KVxuICAgICB9XG5cbiAgICAgcHJpdmF0ZSBpbml0Q2xpY2tFdmVudCAoKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgcGFnZSAgICAgICAgICAgPSB0aGlzLmZjYW52YXNcbiAgICAgICAgICBjb25zdCBtYXhfY2xpY2hfYXJlYSA9IDI1ICogMjVcbiAgICAgICAgICB2YXIgICBsYXN0X2NsaWNrICAgICA9IC0xXG4gICAgICAgICAgdmFyICAgbGFzdF9wb3MgICAgICAgPSB7IHg6IC05OTk5LCB5OiAtOTk5OSB9XG5cbiAgICAgICAgICBwYWdlLm9uICggXCJtb3VzZTpkb3duXCIsIGZldmVudCA9PlxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNvbnNvbGUubG9nICggXCJtb3VzZTpkb3duXCIgKVxuICAgICAgICAgICAgICAgY29uc3Qgbm93ICAgPSBEYXRlLm5vdyAoKVxuICAgICAgICAgICAgICAgY29uc3QgcG9zICAgPSBmZXZlbnQucG9pbnRlclxuICAgICAgICAgICAgICAgY29uc3QgcmVzZXQgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGxhc3RfY2xpY2sgPSBub3dcbiAgICAgICAgICAgICAgICAgICAgbGFzdF9wb3MgICA9IHBvc1xuICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAvLyBOb3VzIHbDqXJpZmlvbnMgcXVlIHNvaXQgdW4gZG91YmxlLWNsaXF1ZS5cbiAgICAgICAgICAgICAgIGlmICggNTAwIDwgbm93IC0gbGFzdF9jbGljayApXG4gICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGlmICggdGhpcy5vblRvdWNoT2JqZWN0IClcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGVsZW1lbnQgPSBhc3BlY3QuZ2V0QXNwZWN0ICggZmV2ZW50LnRhcmdldCApXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICBBcmVhLmN1cnJlbnRFdmVudCA9IGZldmVudDtcbiAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIGVsZW1lbnQgKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5vblRvdWNoT2JqZWN0ICggZWxlbWVudCApXG4gICAgICAgICAgICAgICAgICAgICAgICAgQXJlYS5jdXJyZW50RXZlbnQgPSBudWxsO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgZmV2ZW50LmUuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uICgpXG4gICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICB7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzZXQgKClcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAvLyBOb3VzIHbDqXJpZmlvbnMgcXVlIGxlcyBkZXV4IGNsaXF1ZXMgc2UgdHJvdXZlIGRhbnMgdW5lIHLDqWdpb24gcHJvY2hlLlxuICAgICAgICAgICAgICAgY29uc3Qgem9uZSA9IChwb3MueCAtIGxhc3RfcG9zLngpICogKHBvcy55IC0gbGFzdF9wb3MueSlcbiAgICAgICAgICAgICAgIGlmICggem9uZSA8IC1tYXhfY2xpY2hfYXJlYSB8fCBtYXhfY2xpY2hfYXJlYSA8IHpvbmUgKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzZXQgKClcblxuICAgICAgICAgICAgICAgLy8gU2kgbGUgcG9pbnRlciBlc3QgYXUtZGVzc3VzIGTigJl1bmUgZm9ybWUuXG4gICAgICAgICAgICAgICBpZiAoIGZldmVudC50YXJnZXQgIT0gdW5kZWZpbmVkIClcbiAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCB0aGlzLm9uRG91YmxlVG91Y2hPYmplY3QgKVxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZWxlbWVudCA9IGFzcGVjdC5nZXRBc3BlY3QgKCBmZXZlbnQudGFyZ2V0IClcblxuICAgICAgICAgICAgICAgICAgICAgICAgIEFyZWEuY3VycmVudEV2ZW50ID0gZmV2ZW50O1xuICAgICAgICAgICAgICAgICAgICAgICAgIGlmICggZWxlbWVudCApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm9uRG91YmxlVG91Y2hPYmplY3QgKCBlbGVtZW50IClcbiAgICAgICAgICAgICAgICAgICAgICAgICBBcmVhLmN1cnJlbnRFdmVudCA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBsYXN0X2NsaWNrICAgPSAtMVxuICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgLy8gU2kgbGUgcG9pbnRlciBlc3QgYXUtZGVzc3VzIGTigJl1bmUgem9uZSB2aWRlLlxuICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBBcmVhLmN1cnJlbnRFdmVudCA9IGZldmVudDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCB0aGlzLm9uVG91Y2hBcmVhIClcbiAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm9uVG91Y2hBcmVhICggcG9zLngsIHBvcy55IClcbiAgICAgICAgICAgICAgICAgICAgQXJlYS5jdXJyZW50RXZlbnQgPSBudWxsO1xuICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICBmZXZlbnQuZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24gKClcblxuICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgfSlcbiAgICAgfVxuXG4gICAgIHByaXZhdGUgaW5pdE92ZXJFdmVudCAoKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgcGFnZSA9IHRoaXMuZmNhbnZhc1xuXG4gICAgICAgICAgcGFnZS5vbiAoIFwibW91c2U6b3ZlclwiLCBmZXZlbnQgPT5cbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICB0aGlzLm92ZXJGT2JqZWN0ID0gZmV2ZW50LnRhcmdldFxuXG4gICAgICAgICAgICAgICBpZiAoIHRoaXMub25PdmVyT2JqZWN0IClcbiAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZWxlbWVudCA9IGFzcGVjdC5nZXRBc3BlY3QgKCBmZXZlbnQudGFyZ2V0IClcblxuICAgICAgICAgICAgICAgICAgICBBcmVhLmN1cnJlbnRFdmVudCA9IGZldmVudDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBlbGVtZW50IClcbiAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm9uT3Zlck9iamVjdCAoIGVsZW1lbnQgKVxuICAgICAgICAgICAgICAgICAgICBBcmVhLmN1cnJlbnRFdmVudCA9IG51bGw7XG4gICAgICAgICAgICAgICB9XG4gICAgICAgICAgfSlcblxuICAgICAgICAgIHBhZ2Uub24gKCBcIm1vdXNlOm91dFwiLCBmZXZlbnQgPT5cbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICB0aGlzLm92ZXJGT2JqZWN0ID0gdW5kZWZpbmVkXG5cbiAgICAgICAgICAgICAgIGlmICggdGhpcy5vbk91dE9iamVjdCApXG4gICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVsZW1lbnQgPSBhc3BlY3QuZ2V0QXNwZWN0ICggZmV2ZW50LnRhcmdldCApXG5cbiAgICAgICAgICAgICAgICAgICAgQXJlYS5jdXJyZW50RXZlbnQgPSBmZXZlbnQ7XG4gICAgICAgICAgICAgICAgICAgIGlmICggZWxlbWVudCApXG4gICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5vbk91dE9iamVjdCAoIGVsZW1lbnQgKVxuICAgICAgICAgICAgICAgICAgICBBcmVhLmN1cnJlbnRFdmVudCA9IG51bGw7XG4gICAgICAgICAgICAgICB9XG4gICAgICAgICAgfSlcbiAgICAgfVxuXG4gICAgIHByaXZhdGUgaW5pdFBhbkV2ZW50ICgpXG4gICAgIHtcbiAgICAgICAgICBjb25zdCBwYWdlICAgICAgID0gdGhpcy5mY2FudmFzXG4gICAgICAgICAgdmFyICAgaXNEcmFnZ2luZyA9IGZhbHNlXG4gICAgICAgICAgdmFyICAgbGFzdFBvc1ggICA9IC0xXG4gICAgICAgICAgdmFyICAgbGFzdFBvc1kgICA9IC0xXG5cbiAgICAgICAgICBwYWdlLm9uICggXCJtb3VzZTpkb3duXCIsIGZldmVudCA9PlxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGlmICggdGhpcy5vdmVyRk9iamVjdCA9PSB1bmRlZmluZWQgKVxuICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBwYWdlLnNlbGVjdGlvbiA9IGZhbHNlXG4gICAgICAgICAgICAgICAgICAgIHBhZ2UuZGlzY2FyZEFjdGl2ZU9iamVjdCAoKVxuICAgICAgICAgICAgICAgICAgICBwYWdlLmZvckVhY2hPYmplY3QgKCBvID0+IHsgby5zZWxlY3RhYmxlID0gZmFsc2UgfSApXG5cbiAgICAgICAgICAgICAgICAgICAgaXNEcmFnZ2luZyA9IHRydWVcbiAgICAgICAgICAgICAgICAgICAgbGFzdFBvc1ggICA9IGZldmVudC5wb2ludGVyLnhcbiAgICAgICAgICAgICAgICAgICAgbGFzdFBvc1kgICA9IGZldmVudC5wb2ludGVyLnlcblxuICAgICAgICAgICAgICAgICAgICBwYWdlLnJlcXVlc3RSZW5kZXJBbGwgKClcbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICB9KVxuXG4gICAgICAgICAgcGFnZS5vbiAoIFwibW91c2U6bW92ZVwiLCBmZXZlbnQgPT5cbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBpZiAoIGlzRHJhZ2dpbmcgKVxuICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBwb2ludGVyICA9IGZldmVudC5wb2ludGVyXG5cbiAgICAgICAgICAgICAgICAgICAgcGFnZS52aWV3cG9ydFRyYW5zZm9ybSBbNF0gKz0gcG9pbnRlci54IC0gbGFzdFBvc1hcbiAgICAgICAgICAgICAgICAgICAgcGFnZS52aWV3cG9ydFRyYW5zZm9ybSBbNV0gKz0gcG9pbnRlci55IC0gbGFzdFBvc1lcblxuICAgICAgICAgICAgICAgICAgICBwYWdlLnJlcXVlc3RSZW5kZXJBbGwoKVxuXG4gICAgICAgICAgICAgICAgICAgIGxhc3RQb3NYID0gcG9pbnRlci54XG4gICAgICAgICAgICAgICAgICAgIGxhc3RQb3NZID0gcG9pbnRlci55XG4gICAgICAgICAgICAgICB9XG4gICAgICAgICAgfSlcblxuICAgICAgICAgIHBhZ2Uub24gKCBcIm1vdXNlOnVwXCIsICgpID0+XG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgcGFnZS5zZWxlY3Rpb24gPSB0cnVlXG5cbiAgICAgICAgICAgICAgIHBhZ2UuZm9yRWFjaE9iamVjdCAoIG8gPT5cbiAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgby5zZWxlY3RhYmxlID0gdHJ1ZVxuICAgICAgICAgICAgICAgICAgICBvLnNldENvb3JkcygpXG4gICAgICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICAgICBpc0RyYWdnaW5nID0gZmFsc2VcblxuICAgICAgICAgICAgICAgcGFnZS5yZXF1ZXN0UmVuZGVyQWxsICgpXG4gICAgICAgICAgfSlcbiAgICAgfVxuXG4gICAgIHByaXZhdGUgaW5pdFpvb21FdmVudCAoKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgcGFnZSA9IHRoaXMuZmNhbnZhc1xuXG4gICAgICAgICAgcGFnZS5vbiAoIFwibW91c2U6d2hlZWxcIiwgZmV2ZW50ID0+XG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgY29uc3QgZXZlbnQgICA9IGZldmVudC5lIGFzIFdoZWVsRXZlbnRcbiAgICAgICAgICAgICAgIHZhciAgIGRlbHRhICAgPSBldmVudC5kZWx0YVlcbiAgICAgICAgICAgICAgIHZhciAgIHpvb20gICAgPSBwYWdlLmdldFpvb20oKVxuICAgICAgICAgICAgICAgICAgICB6b29tICAgID0gem9vbSAtIGRlbHRhICogMC4wMDVcblxuICAgICAgICAgICAgICAgaWYgKHpvb20gPiA5KVxuICAgICAgICAgICAgICAgICAgICB6b29tID0gOVxuXG4gICAgICAgICAgICAgICBpZiAoem9vbSA8IDAuNSlcbiAgICAgICAgICAgICAgICAgICAgem9vbSA9IDAuNVxuXG4gICAgICAgICAgICAgICBwYWdlLnpvb21Ub1BvaW50KCBuZXcgZmFicmljLlBvaW50ICggZXZlbnQub2Zmc2V0WCwgZXZlbnQub2Zmc2V0WSApLCB6b29tIClcblxuICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKVxuICAgICAgICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKClcblxuICAgICAgICAgICAgICAgcGFnZS5yZXF1ZXN0UmVuZGVyQWxsICgpXG4gICAgICAgICAgfSlcbiAgICAgfVxuXG4gICAgIHByaXZhdGUgaW5pdE1vdmVPYmplY3QgKClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHBhZ2UgICAgICA9IHRoaXMuZmNhbnZhc1xuICAgICAgICAgIHZhciAgIGNsdXN0ZXIgICA9IHVuZGVmaW5lZCBhcyBmYWJyaWMuT2JqZWN0IFtdXG4gICAgICAgICAgdmFyICAgcG9zaXRpb25zID0gdW5kZWZpbmVkIGFzIG51bWJlciBbXVtdXG4gICAgICAgICAgdmFyICAgb3JpZ2luWCAgID0gMFxuICAgICAgICAgIHZhciAgIG9yaWdpblkgICA9IDBcblxuICAgICAgICAgIGZ1bmN0aW9uIG9uX3NlbGVjdGlvbiAoZmV2ZW50OiBmYWJyaWMuSUV2ZW50KVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNvbnN0IHRhcmdldCA9IGZldmVudC50YXJnZXRcbiAgICAgICAgICAgICAgIGNvbnNvbGUubG9nICggdGFyZ2V0IClcbiAgICAgICAgICAgICAgIGNsdXN0ZXIgPSB0YXJnZXQgW1wiY2x1c3RlclwiXSBhcyBmYWJyaWMuT2JqZWN0IFtdXG5cbiAgICAgICAgICAgICAgIGlmICggY2x1c3RlciA9PSB1bmRlZmluZWQgKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm5cblxuICAgICAgICAgICAgICAgb3JpZ2luWCAgID0gdGFyZ2V0LmxlZnRcbiAgICAgICAgICAgICAgIG9yaWdpblkgICA9IHRhcmdldC50b3BcbiAgICAgICAgICAgICAgIHBvc2l0aW9ucyA9IFtdXG5cbiAgICAgICAgICAgICAgIGZvciAoIGNvbnN0IG8gb2YgY2x1c3RlciApXG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9ucy5wdXNoIChbIG8ubGVmdCwgby50b3AgXSlcblxuICAgICAgICAgICAgICAgY29uc29sZS5sb2cgKFwiY3JlYXRlZFwiKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHBhZ2Uub24gKCBcInNlbGVjdGlvbjpjcmVhdGVkXCIsIG9uX3NlbGVjdGlvbiApXG4gICAgICAgICAgcGFnZS5vbiAoIFwic2VsZWN0aW9uOnVwZGF0ZWRcIiwgb25fc2VsZWN0aW9uIClcblxuICAgICAgICAgIHBhZ2Uub24gKCBcIm9iamVjdDptb3ZpbmdcIiwgZmV2ZW50ID0+XG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgaWYgKCBjbHVzdGVyID09IHVuZGVmaW5lZCApXG4gICAgICAgICAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgICAgICAgICBjb25zdCB0YXJnZXQgICA9IGZldmVudC50YXJnZXRcbiAgICAgICAgICAgICAgIGNvbnN0IG9mZnNldFggID0gdGFyZ2V0LmxlZnQgLSBvcmlnaW5YXG4gICAgICAgICAgICAgICBjb25zdCBvZmZzZXRZICA9IHRhcmdldC50b3AgIC0gb3JpZ2luWVxuXG4gICAgICAgICAgICAgICBmb3IgKCB2YXIgaSA9IDAgOyBpIDwgY2x1c3Rlci5sZW5ndGggOyBpKysgKVxuICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBvYmogPSBjbHVzdGVyIFtpXVxuICAgICAgICAgICAgICAgICAgICBjb25zdCBwb3MgPSBwb3NpdGlvbnMgW2ldXG4gICAgICAgICAgICAgICAgICAgIG9iai5zZXQgKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICBsZWZ0OiBwb3MgWzBdICsgb2Zmc2V0WCxcbiAgICAgICAgICAgICAgICAgICAgICAgICB0b3AgOiBwb3MgWzFdICsgb2Zmc2V0WVxuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgfVxuICAgICAgICAgIH0pXG5cbiAgICAgICAgICBwYWdlLm9uICggXCJzZWxlY3Rpb246Y2xlYXJlZFwiLCBmZXZlbnQgPT5cbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBjbHVzdGVyID0gdW5kZWZpbmVkXG5cbiAgICAgICAgICAgICAgIGNvbnNvbGUubG9nIChcImNsZWFyZWRcIilcbiAgICAgICAgICB9KVxuICAgICB9XG5cbiAgICAgcHJpdmF0ZSBpbml0RHJhZ0V2ZW50ICgpXG4gICAgIHtcbiAgICAgICAgICAvLyBodHRwczovL3d3dy53M3NjaG9vbHMuY29tL2h0bWwvaHRtbDVfZHJhZ2FuZGRyb3AuYXNwXG4gICAgICAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL1Nob3BpZnkvZHJhZ2dhYmxlL2Jsb2IvbWFzdGVyL3NyYy9EcmFnZ2FibGUvRHJhZ2dhYmxlLmpzXG5cbiAgICAgICAgICBjb25zdCBwYWdlICAgICAgPSB0aGlzLmZjYW52YXNcblxuICAgICAgICAgIHBhZ2Uub24gKCBcInRvdWNoOmRyYWdcIiwgZmV2ZW50ID0+XG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgLy9jb25zb2xlLmxvZyAoIGZldmVudCApXG4gICAgICAgICAgICAgICBjb25zb2xlLmxvZyAoIFwidG91Y2g6ZHJhZ1wiIClcbiAgICAgICAgICB9KVxuXG4gICAgICAgICAgcGFnZS5vbiAoIFwiZHJhZ2VudGVyXCIsIGZldmVudCA9PlxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIC8vY29uc29sZS5sb2cgKCBcIkRST1AtRU5URVJcIiwgZmV2ZW50IClcbiAgICAgICAgICB9KVxuXG4gICAgICAgICAgcGFnZS5vbiAoIFwiZHJhZ292ZXJcIiwgZmV2ZW50ID0+XG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgLy9jb25zb2xlLmxvZyAoIFwiRFJPUC1PVkVSXCIsIGZldmVudCApXG4gICAgICAgICAgfSlcblxuICAgICAgICAgIHBhZ2Uub24gKCBcImRyb3BcIiwgZmV2ZW50ID0+XG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgLy9jb25zdCBlID0gZmV2ZW50LmUgYXMgRHJhZ0V2ZW50XG4gICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nICggXCJEUk9QXCIsIGUuZGF0YVRyYW5zZmVyLmdldERhdGEgKFwidGV4dFwiKSApXG4gICAgICAgICAgfSlcbiAgICAgfVxufVxuIiwiXG5pbXBvcnQgeyBBcmVhIH0gZnJvbSBcIi4vRWxlbWVudHMvYXJlYS5qc1wiXG5jb25zdCBjbWRzID0ge30gYXMgUmVjb3JkIDxzdHJpbmcsIENvbW1hbmQ+XG5cbmNsYXNzIENvbW1hbmRcbntcbiAgICAgY29uc3RydWN0b3IgKCBwcml2YXRlIGNhbGxiYWNrOiAoIGV2ZW50OiBmYWJyaWMuSUV2ZW50ICkgPT4gdm9pZCApIHt9XG5cbiAgICAgcnVuICgpXG4gICAgIHtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgdGhpcy5jYWxsYmFjayAoIEFyZWEuY3VycmVudEV2ZW50ICk7XG4gICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcblxuICAgICAgICAgIH1cbiAgICAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gY29tbWFuZCAoIG5hbWU6IHN0cmluZywgY2FsbGJhY2s/OiAoIGV2ZW50OiBmYWJyaWMuSUV2ZW50ICkgPT4gdm9pZCApXG57XG4gICAgIGlmICggdHlwZW9mIGNhbGxiYWNrID09IFwiZnVuY3Rpb25cIiApXG4gICAgIHtcbiAgICAgICAgICBpZiAoIG5hbWUgaW4gY21kcyApIHJldHVyblxuICAgICAgICAgIGNtZHMgW25hbWVdID0gbmV3IENvbW1hbmQgKCBjYWxsYmFjayApXG4gICAgIH1cblxuICAgICByZXR1cm4gY21kcyBbbmFtZV1cbn1cbiIsIlxuaW1wb3J0IHsgY3JlYXRlTm9kZSB9IGZyb20gXCIuLi8uLi9EYXRhL2luZGV4XCJcbmltcG9ydCB7IHhub2RlIH0gZnJvbSBcIkB1aS9CYXNlL3hub2RlXCJcblxuZGVjbGFyZSBnbG9iYWxcbntcbiAgICAgaW50ZXJmYWNlICRDb21wb25lbnQgZXh0ZW5kcyAkQ2x1c3RlclxuICAgICB7XG4gICAgICAgICAgcmVhZG9ubHkgY29udGV4dDogdHlwZW9mIENPTlRFWFRfVUlcbiAgICAgICAgICB0eXBlOiBzdHJpbmdcbiAgICAgICAgICBjaGlsZHJlbj86ICRDb21wb25lbnQgW10gLy8gUmVjb3JkIDxzdHJpbmcsICRDaGlsZD5cbiAgICAgfVxufVxuXG5leHBvcnQgY2xhc3MgQ29tcG9uZW50IDwkIGV4dGVuZHMgJENvbXBvbmVudCA9ICRDb21wb25lbnQ+XG57XG4gICAgIGRhdGE6ICRcblxuICAgICBjb250YWluZXI6IEhUTUxFbGVtZW50IHwgU1ZHRWxlbWVudFxuXG4gICAgIGRlZmF1bHREYXRhICgpIDogJENvbXBvbmVudFxuICAgICB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgIGNvbnRleHQ6IENPTlRFWFRfVUksXG4gICAgICAgICAgICAgICB0eXBlICAgOiBcImNvbXBvbmVudFwiLFxuICAgICAgICAgICAgICAgaWQgICAgIDogdW5kZWZpbmVkLFxuICAgICAgICAgIH1cbiAgICAgfVxuXG4gICAgIGNvbnN0cnVjdG9yICggZGF0YTogJCApXG4gICAgIHtcbiAgICAgICAgICB0aGlzLmRhdGEgPSBPYmplY3QuYXNzaWduIChcbiAgICAgICAgICAgICAgIHRoaXMuZGVmYXVsdERhdGEgKCksXG4gICAgICAgICAgICAgICBjcmVhdGVOb2RlICggZGF0YS50eXBlLCBkYXRhLmlkLCBkYXRhICkgYXMgYW55XG4gICAgICAgICAgKVxuICAgICB9XG5cbiAgICAgZ2V0SHRtbCAoKTogKEhUTUxFbGVtZW50IHwgU1ZHRWxlbWVudCkgW11cbiAgICAge1xuICAgICAgICAgIGlmICggdGhpcy5jb250YWluZXIgPT0gdW5kZWZpbmVkIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICB0aGlzLmNvbnRhaW5lciA9IDxkaXYgY2xhc3M9eyB0aGlzLmRhdGEudHlwZSB9PjwvZGl2PlxuICAgICAgICAgICAgICAgdGhpcy5vbkNyZWF0ZSAoKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiBbdGhpcy5jb250YWluZXJdXG4gICAgIH1cblxuICAgICBvbkNyZWF0ZSAoKVxuICAgICB7XG5cbiAgICAgfVxuXG59XG5cblxuIiwiLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vRGF0YS9pbmRleC50c1wiIC8+XG5cbmRlY2xhcmUgZ2xvYmFsXG57XG4gICAgIGNvbnN0IENPTlRFWFRfVUk6IFwiY29uY2VwdC11aVwiXG59XG5PYmplY3QuZGVmaW5lUHJvcGVydHkgKCBnbG9iYWxUaGlzLCBcIkNPTlRFWFRfVUlcIiwge1xuICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICAgY29uZmlndXJhYmxlOiBmYWxzZSxcbiAgICAgd3JpdGFibGU6IGZhbHNlLFxuICAgICB2YWx1ZTogXCJjb25jZXB0LXVpXCJcbn0gKVxuXG5pbXBvcnQgeyBGYWN0b3J5LCBEYXRhYmFzZSB9IGZyb20gXCIuLi9EYXRhL2luZGV4LmpzXCJcbmltcG9ydCB7IENvbXBvbmVudCB9IGZyb20gXCIuL0VsZW1lbnRzL2NvbXBvbmVudC5qc1wiXG5cbi8vY29uc3QgQ09OVEVYVF9VSSA9IFwiY29uY2VwdC11aVwiXG5jb25zdCBkYiAgICAgID0gbmV3IERhdGFiYXNlIDwkQW55Q29tcG9uZW50cz4gKClcbmNvbnN0IGZhY3RvcnkgPSBuZXcgRmFjdG9yeSA8Q29tcG9uZW50LCAkQW55Q29tcG9uZW50cz4gKCBkYiApXG5cbmV4cG9ydCBjb25zdCBpblN0b2NrOiB0eXBlb2YgZmFjdG9yeS5pblN0b2NrID0gZnVuY3Rpb24gKClcbntcbiAgICAgY29uc3QgYXJnID0gYXJndW1lbnRzLmxlbmd0aCA9PSAxXG4gICAgICAgICAgICAgICA/IG5vcm1hbGl6ZSAoIGFyZ3VtZW50cyBbMF0gKVxuICAgICAgICAgICAgICAgOiBub3JtYWxpemUgKCBbLi4uIGFyZ3VtZW50c10gKVxuXG4gICAgIGNvbnN0IHBhdGggPSBmYWN0b3J5LmdldFBhdGggKCBhcmcgKVxuXG4gICAgIHJldHVybiBmYWN0b3J5Ll9pblN0b2NrICggcGF0aCApXG59XG5cbmV4cG9ydCBjb25zdCBwaWNrOiB0eXBlb2YgZmFjdG9yeS5waWNrID0gZnVuY3Rpb24gKCAuLi4gcmVzdDogYW55IFtdIClcbntcbiAgICAgY29uc3QgYXJnID0gYXJndW1lbnRzLmxlbmd0aCA9PSAxXG4gICAgICAgICAgICAgICA/IG5vcm1hbGl6ZSAoIGFyZ3VtZW50cyBbMF0gKVxuICAgICAgICAgICAgICAgOiBub3JtYWxpemUgKCBbLi4uIGFyZ3VtZW50c10gKVxuXG4gICAgIGNvbnN0IHBhdGggPSBmYWN0b3J5LmdldFBhdGggKCBhcmcgKVxuXG4gICAgIHJldHVybiBmYWN0b3J5Ll9waWNrICggcGF0aCApXG59XG5cbmV4cG9ydCBjb25zdCBtYWtlOiB0eXBlb2YgZmFjdG9yeS5tYWtlID0gZnVuY3Rpb24gKClcbntcbiAgICAgY29uc3QgYXJnID0gYXJndW1lbnRzLmxlbmd0aCA9PSAxXG4gICAgICAgICAgICAgICA/IG5vcm1hbGl6ZSAoIGFyZ3VtZW50cyBbMF0gKVxuICAgICAgICAgICAgICAgOiBub3JtYWxpemUgKCBbLi4uIGFyZ3VtZW50c10gKVxuXG4gICAgIGNvbnN0IHBhdGggPSBmYWN0b3J5LmdldFBhdGggKCBhcmcgKVxuXG4gICAgIGlmICggaXNOb2RlICggYXJnICkgKVxuICAgICAgICAgIHZhciBkYXRhID0gYXJnXG5cbiAgICAgcmV0dXJuIGZhY3RvcnkuX21ha2UgKCBwYXRoLCBkYXRhIClcbn1cblxuZXhwb3J0IGNvbnN0IHNldDogdHlwZW9mIGRiLnNldCA9IGZ1bmN0aW9uICgpXG57XG4gICAgIGNvbnN0IGFyZyA9IG5vcm1hbGl6ZSAoIGFyZ3VtZW50cyBbMF0gKVxuXG4gICAgIGlmICggYXJndW1lbnRzLmxlbmd0aCA9PSAxIClcbiAgICAgICAgICBkYi5zZXQgKCBhcmcgKVxuICAgICBlbHNlXG4gICAgICAgICAgZGIuc2V0ICggYXJnLCBub3JtYWxpemUgKCBhcmd1bWVudHMgWzFdICkgKVxufVxuXG5leHBvcnQgY29uc3QgZGVmaW5lID0gZmFjdG9yeS5kZWZpbmUuYmluZCAoIGZhY3RvcnkgKSBhcyB0eXBlb2YgZmFjdG9yeS5kZWZpbmVcbi8vZXhwb3J0IGNvbnN0IGRlZmluZTogdHlwZW9mIGZhY3RvcnkuZGVmaW5lID0gZnVuY3Rpb24gKCBjdG9yOiBhbnksIC4uLiByZXN0OiBhbnkgKVxuLy97XG4vLyAgICAgY29uc3QgYXJnID0gcmVzdC5sZW5ndGggPT0gMVxuLy8gICAgICAgICAgICAgICA/IG5vcm1hbGl6ZSAoIHJlc3QgWzBdIClcbi8vICAgICAgICAgICAgICAgOiBub3JtYWxpemUgKCBbLi4uIHJlc3RdIClcbi8vXG4vLyAgICAgY29uc3QgcGF0aCA9IGZhY3RvcnkuZ2V0UGF0aCAoIGFyZyApXG4vL1xuLy8gICAgIGZhY3RvcnkuX2RlZmluZSAoIGN0b3IsIHBhdGggKVxuLy99XG5cblxuZnVuY3Rpb24gaXNOb2RlICggb2JsOiBhbnkgKVxue1xuICAgICByZXR1cm4gdHlwZW9mIG9ibCA9PSBcIm9iamVjdFwiICYmICEgQXJyYXkuaXNBcnJheSAob2JsKVxufVxuXG5mdW5jdGlvbiBub3JtYWxpemUgKCBhcmc6IGFueSApXG57XG4gICAgIGlmICggQXJyYXkuaXNBcnJheSAoYXJnKSApXG4gICAgIHtcbiAgICAgICAgICBpZiAoIGFyZyBbMF0gIT09IENPTlRFWFRfVUkgKVxuICAgICAgICAgICAgICAgYXJnLnVuc2hpZnQgKCBDT05URVhUX1VJIClcbiAgICAgfVxuICAgICBlbHNlIGlmICggdHlwZW9mIGFyZyA9PSBcIm9iamVjdFwiIClcbiAgICAge1xuICAgICAgICAgIGlmICggXCJjb250ZXh0XCIgaW4gYXJnIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBpZiAoIGFyZy5jb250ZXh0ICE9PSBDT05URVhUX1VJIClcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgXCJCYWQgY29udGV4dCB2YWx1ZVwiXG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICAoYXJnIGFzIGFueSkuY29udGV4dCA9IENPTlRFWFRfVUlcbiAgICAgICAgICB9XG4gICAgIH1cblxuICAgICByZXR1cm4gYXJnXG59XG4iLCJcbmltcG9ydCB7IHBpY2ssIGluU3RvY2ssIG1ha2UgfSBmcm9tIFwiQHVpL2RiXCJcbmltcG9ydCB7IENvbXBvbmVudCB9IGZyb20gXCIuL2NvbXBvbmVudFwiXG5cbmRlY2xhcmUgZ2xvYmFsXG57XG4gICAgIGludGVyZmFjZSAkQ29udGFpbmVyIGV4dGVuZHMgJENvbXBvbmVudFxuICAgICB7XG4gICAgICAgICAgZGlyZWN0aW9uPzogXCJsclwiIHwgXCJybFwiIHwgXCJ0YlwiIHwgXCJidFwiXG4gICAgICAgICAgY2hpbGRyZW4/OiAkQW55Q29tcG9uZW50cyBbXVxuICAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBDb250YWluZXIgPCQgZXh0ZW5kcyAkQ29udGFpbmVyID0gJENvbnRhaW5lcj4gZXh0ZW5kcyBDb21wb25lbnQgPCQ+XG57XG4gICAgIGNoaWxkcmVuID0ge30gYXMgUmVjb3JkIDxzdHJpbmcsIENvbXBvbmVudD5cbiAgICAgc2xvdDogSlNYLkVsZW1lbnRcblxuICAgICByZWFkb25seSBpc192ZXJ0aWNhbDogYm9vbGVhblxuXG4gICAgIGRlZmF1bHREYXRhICgpIDogJENvbnRhaW5lclxuICAgICB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgIGNvbnRleHQ6IFwiY29uY2VwdC11aVwiLFxuICAgICAgICAgICAgICAgdHlwZSAgICAgOiBcImNvbXBvbmVudFwiLFxuICAgICAgICAgICAgICAgaWQgICAgICAgOiB1bmRlZmluZWQsXG4gICAgICAgICAgICAgICBkaXJlY3Rpb246IFwibHJcIixcbiAgICAgICAgICB9XG4gICAgIH1cblxuICAgICBjb25zdHJ1Y3RvciAoIGRhdGE6ICQgKVxuICAgICB7XG4gICAgICAgICAgc3VwZXIgKCBkYXRhIClcblxuICAgICAgICAgIGRhdGEgPSB0aGlzLmRhdGFcbiAgICAgICAgICBjb25zdCBjaGlsZHJlbiA9IGRhdGEuY2hpbGRyZW5cblxuICAgICAgICAgIGlmICggY2hpbGRyZW4gKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGZvciAoIGNvbnN0IGNoaWxkIG9mIGNoaWxkcmVuIClcbiAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCAhIGluU3RvY2sgKCBjaGlsZCApIClcbiAgICAgICAgICAgICAgICAgICAgICAgICBtYWtlICggY2hpbGQgKVxuICAgICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHRoaXMuaXNfdmVydGljYWwgPSBkYXRhLmRpcmVjdGlvbiA9PSBcImJ0XCIgfHwgZGF0YS5kaXJlY3Rpb24gPT0gXCJ0YlwiXG4gICAgIH1cblxuICAgICAvKiogQG92ZXJyaWRlICovXG4gICAgIGdldEh0bWwgKClcbiAgICAge1xuICAgICAgICAgIGlmICggdGhpcy5jb250YWluZXIgIT0gdW5kZWZpbmVkIClcbiAgICAgICAgICAgICAgIHJldHVybiBbdGhpcy5jb250YWluZXJdXG5cbiAgICAgICAgICBjb25zdCBlbGVtZW50cyAgPSBzdXBlci5nZXRIdG1sICgpXG4gICAgICAgICAgY29uc3QgY29udGFpbmVyID0gdGhpcy5jb250YWluZXJcbiAgICAgICAgICBjb25zdCBkYXRhICAgICAgPSB0aGlzLmRhdGFcbiAgICAgICAgICBjb25zdCBjaGlsZHJlbiAgPSB0aGlzLmNoaWxkcmVuXG4gICAgICAgICAgY29uc3QgdW5kID0gdW5kZWZpbmVkXG5cbiAgICAgICAgICBpZiAoIHRoaXMuaXNfdmVydGljYWwgKVxuICAgICAgICAgICAgICAgY29udGFpbmVyLmNsYXNzTGlzdC5hZGQgKCBcInZlcnRpY2FsXCIgKVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgIGNvbnRhaW5lci5jbGFzc0xpc3QucmVtb3ZlICggXCJ2ZXJ0aWNhbFwiIClcblxuICAgICAgICAgIGlmICggdGhpcy5zbG90ID09IHVuZGVmaW5lZCApXG4gICAgICAgICAgICAgICB0aGlzLnNsb3QgPSBjb250YWluZXJcblxuICAgICAgICAgIGNvbnN0IHNsb3QgPSB0aGlzLnNsb3RcblxuICAgICAgICAgIGlmICggZGF0YS5jaGlsZHJlbiApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgY29uc3QgbmV3X2NoaWxkcmVuID0gW10gYXMgQ29tcG9uZW50IFtdXG5cbiAgICAgICAgICAgICAgIGZvciAoIGNvbnN0IGNoaWxkIG9mIGRhdGEuY2hpbGRyZW4gKVxuICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBvID0gcGljayAoIGNoaWxkIClcbiAgICAgICAgICAgICAgICAgICAgc2xvdC5hcHBlbmQgKCAuLi4gby5nZXRIdG1sICgpIClcbiAgICAgICAgICAgICAgICAgICAgY2hpbGRyZW4gW28uZGF0YS5pZF0gPSBvXG4gICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgIC8vdGhpcy5vbkNoaWxkcmVuQWRkZWQgKCBuZXdfY2hpbGRyZW4gKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiBlbGVtZW50c1xuICAgICB9XG5cbiAgICAgLy9vbkNoaWxkcmVuQWRkZWQgKCBjb21wb25lbnRzOiBDb21wb25lbnQgW10gKVxuICAgICAvL3tcblxuICAgICAvL31cblxuICAgICBhcHBlbmQgKCAuLi4gZWxlbWVudHM6IChzdHJpbmcgfCBFbGVtZW50IHwgQ29tcG9uZW50IHwgJEFueUNvbXBvbmVudHMpIFtdIClcbiAgICAge1xuXG4gICAgICAgICAgaWYgKCB0aGlzLmNvbnRhaW5lciA9PSB1bmRlZmluZWQgKVxuICAgICAgICAgICAgICAgdGhpcy5nZXRIdG1sICgpXG5cbiAgICAgICAgICBjb25zdCBzbG90ICAgICAgPSB0aGlzLnNsb3RcbiAgICAgICAgICBjb25zdCBjaGlsZHJlbiAgPSB0aGlzLmNoaWxkcmVuXG4gICAgICAgICAgY29uc3QgbmV3X2NoaWxkID0gW10gYXMgQ29tcG9uZW50IFtdXG5cbiAgICAgICAgICBmb3IgKCB2YXIgZSBvZiBlbGVtZW50cyApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgaWYgKCB0eXBlb2YgZSA9PSBcInN0cmluZ1wiIClcbiAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgZSA9IG5ldyBQaGFudG9tICh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgY29udGV4dDogXCJjb25jZXB0LXVpXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgdHlwZSAgIDogXCJwaGFudG9tXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgaWQgIDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnQ6IGVcbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgIGVsc2UgaWYgKCBlIGluc3RhbmNlb2YgRWxlbWVudCApXG4gICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IFVJX0NPTVBPTkVOVCA9IFN5bWJvbC5mb3IgKCBcIlVJX0NPTVBPTkVOVFwiIClcblxuICAgICAgICAgICAgICAgICAgICBlID0gZSBbVUlfQ09NUE9ORU5UXSAhPSB1bmRlZmluZWRcbiAgICAgICAgICAgICAgICAgICAgICAgICA/IGUgW1VJX0NPTVBPTkVOVF1cbiAgICAgICAgICAgICAgICAgICAgICAgICA6IG5ldyBQaGFudG9tICh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250ZXh0OiBcImNvbmNlcHQtdWlcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGUgICA6IFwicGhhbnRvbVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWQgIDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudDogZS5vdXRlckhUTUxcbiAgICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgZWxzZSBpZiAoICEoZSBpbnN0YW5jZW9mIENvbXBvbmVudCkgKVxuICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBlID0gaW5TdG9jayAoIGUgKSA/IHBpY2sgKCBlICkgOiBtYWtlICggZSApXG4gICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgIGNoaWxkcmVuIFsoZSBhcyBDb21wb25lbnQpLmRhdGEuaWRdID0gZSBhcyBDb21wb25lbnRcbiAgICAgICAgICAgICAgIHNsb3QuYXBwZW5kICggLi4uIChlIGFzIENvbXBvbmVudCkuZ2V0SHRtbCAoKSApXG4gICAgICAgICAgICAgICBuZXdfY2hpbGQucHVzaCAoIGUgYXMgQ29tcG9uZW50IClcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvL2lmICggbmV3X2NoaWxkLmxlbmd0aCA+IDAgKVxuICAgICAgICAgIC8vICAgICB0aGlzLm9uQ2hpbGRyZW5BZGRlZCAoIG5ld19jaGlsZCApXG4gICAgIH1cblxuICAgICByZW1vdmUgKCAuLi4gZWxlbWVudHM6IENvbXBvbmVudCBbXSApXG4gICAgIHtcbiAgICAgICAgICBjb25zdCBzbG90ICAgICAgPSB0aGlzLnNsb3RcbiAgICAgICAgICBjb25zdCBjaGlsZHJlbiAgPSB0aGlzLmNoaWxkcmVuXG5cbiAgICAgICAgICBmb3IgKCB2YXIgZSBvZiBlbGVtZW50cyApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgaWYgKCBlLmRhdGEuaWQgaW4gY2hpbGRyZW4gKVxuICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBlLmNvbnRhaW5lci5yZW1vdmUgKClcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIGNoaWxkcmVuIFtlLmRhdGEuaWRdXG4gICAgICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICB9XG5cbiAgICAgY2xlYXIgKClcbiAgICAge1xuICAgICAgICAgIHRoaXMuY2hpbGRyZW4gPSB7fVxuXG4gICAgICAgICAgaWYgKCB0aGlzLmNvbnRhaW5lciApXG4gICAgICAgICAgICAgICB0aGlzLmNvbnRhaW5lci5pbm5lckhUTUwgPSBcIlwiXG4gICAgIH1cblxufVxuXG5cbmludGVyZmFjZSAkUGhhbnRvbSBleHRlbmRzICRDb21wb25lbnRcbntcbiAgICAgdHlwZTogXCJwaGFudG9tXCJcbiAgICAgY29udGVudDogc3RyaW5nXG59XG5cbmNsYXNzIFBoYW50b20gZXh0ZW5kcyBDb21wb25lbnQgPCRQaGFudG9tPlxue1xuICAgICBjb250YWluZXI6IEhUTUxFbGVtZW50IHwgU1ZHRWxlbWVudFxuXG4gICAgIC8qKiBAb3ZlcnJpZGUgKi9cbiAgICAgZ2V0SHRtbCAoKVxuICAgICB7XG4gICAgICAgICAgaWYgKCB0aGlzLmNvbnRhaW5lciA9PSB1bmRlZmluZWQgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHRoaXMuY29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCAoIFwiZGl2XCIgKVxuICAgICAgICAgICAgICAgdGhpcy5jb250YWluZXIuaW5uZXJIVE1MID0gdGhpcy5kYXRhLmNvbnRlbnRcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gdGhpcy5jb250YWluZXIuY2hpbGROb2RlcyBhcyBhbnkgYXMgSFRNTEVsZW1lbnQgW11cbiAgICAgfVxufVxuIiwiXG5cbmltcG9ydCB7IHNldCwgZGVmaW5lIH0gZnJvbSBcIi4uL2RiLmpzXCJcbmltcG9ydCB7IHhub2RlIH0gICAgICAgZnJvbSBcIi4uL0Jhc2UveG5vZGUuanNcIlxuaW1wb3J0IHsgY29tbWFuZCB9ICAgICBmcm9tIFwiLi4vY29tbWFuZC5qc1wiXG5cbmltcG9ydCB7IENvbXBvbmVudCB9ICAgZnJvbSBcIi4vY29tcG9uZW50XCJcblxuZGVjbGFyZSBnbG9iYWxcbntcbiAgICAgaW50ZXJmYWNlICRCdXR0b24gZXh0ZW5kcyAkQ29tcG9uZW50XG4gICAgIHtcbiAgICAgICAgICB0eXBlICAgICAgIDogXCJidXR0b25cIlxuICAgICAgICAgIGljb24gICAgICAgOiBzdHJpbmdcbiAgICAgICAgICB0ZXh0PyAgICAgIDogc3RyaW5nXG4gICAgICAgICAgdG9vbHRpcD8gICA6IEpTWC5FbGVtZW50XG4gICAgICAgICAgZm9udEZhbWlseT86IHN0cmluZyxcbiAgICAgICAgICBjYWxsYmFjaz8gIDogKCkgPT4gYm9vbGVhbiB8IHZvaWQsXG4gICAgICAgICAgY29tbWFuZD8gICA6IHN0cmluZyxcbiAgICAgICAgICBoYW5kbGVPbj8gIDogXCJ0b2dnbGVcIiB8IFwiZHJhZ1wiIHwgXCIqXCJcbiAgICAgfVxufVxuXG5leHBvcnQgY2xhc3MgQnV0dG9uIGV4dGVuZHMgQ29tcG9uZW50IDwkQnV0dG9uPlxue1xuICAgICAvKiogQG92ZXJyaWRlICovXG4gICAgIGdldEh0bWwgKClcbiAgICAge1xuICAgICAgICAgIGlmICggdGhpcy5jb250YWluZXIgPT0gdW5kZWZpbmVkIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBjb25zdCBkYXRhID0gdGhpcy5kYXRhXG5cbiAgICAgICAgICAgICAgIGNvbnN0IG5vZGUgPSA8ZGl2IGNsYXNzPVwiYnV0dG9uXCI+XG4gICAgICAgICAgICAgICAgICAgIHsgZGF0YS5pY29uID8gPHNwYW4gY2xhc3M9XCJpY29uXCI+eyBkYXRhLmljb24gfTwvc3Bhbj4gOiBudWxsIH1cbiAgICAgICAgICAgICAgICAgICAgeyBkYXRhLnRleHQgPyA8c3BhbiBjbGFzcz1cInRleHRcIj57IGRhdGEudGV4dCB9PC9zcGFuPiA6IG51bGwgfVxuICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgIGlmICggdGhpcy5kYXRhLmNhbGxiYWNrICE9IHVuZGVmaW5lZCB8fCB0aGlzLmRhdGEuY29tbWFuZCAhPSB1bmRlZmluZWQgKVxuICAgICAgICAgICAgICAgICAgICBub2RlLmFkZEV2ZW50TGlzdGVuZXIgKCBcImNsaWNrXCIsIHRoaXMub25Ub3VjaC5iaW5kICh0aGlzKSApXG5cbiAgICAgICAgICAgICAgIHRoaXMuY29udGFpbmVyID0gbm9kZVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiBbIHRoaXMuY29udGFpbmVyIF0gYXMgSFRNTEVsZW1lbnQgW11cbiAgICAgfVxuXG4gICAgIG9uVG91Y2ggKClcbiAgICAge1xuICAgICAgICAgIGlmICggdGhpcy5kYXRhLmNhbGxiYWNrICYmIHRoaXMuZGF0YS5jYWxsYmFjayAoKSAhPT0gdHJ1ZSApXG4gICAgICAgICAgICAgICByZXR1cm5cblxuICAgICAgICAgIGlmICggdGhpcy5kYXRhLmNvbW1hbmQgKVxuICAgICAgICAgICAgICAgLy9Db21tYW5kcy5jdXJyZW50LnJ1biAoIHRoaXMuZGF0YS5jb21tYW5kIClcbiAgICAgICAgICAgICAgIGNvbW1hbmQgKCB0aGlzLmRhdGEuY29tbWFuZCApLnJ1biAoKVxuICAgICB9XG5cbiAgICAgcHJvdGVjdGVkIG9uSG92ZXIgKClcbiAgICAge1xuXG4gICAgIH1cbn1cblxuXG5kZWZpbmUgKCBCdXR0b24sIFtDT05URVhUX1VJLCBcImJ1dHRvblwiXSApXG5cbnNldCA8JEJ1dHRvbj4gKCBbIFwiYnV0dG9uXCIgXSwge1xuICAgICB0eXBlOiBcImJ1dHRvblwiIGFzIFwiYnV0dG9uXCIsXG4gICAgIGlkICA6IHVuZGVmaW5lZCxcbiAgICAgaWNvbjogdW5kZWZpbmVkLFxufSlcbiIsIlxuaW1wb3J0IHsgeG5vZGUgfSBmcm9tIFwiLi4vQmFzZS94bm9kZS5qc1wiXG5pbXBvcnQgeyBDb250YWluZXIgfSBmcm9tIFwiLi9jb250YWluZXIuanNcIlxuaW1wb3J0IHsgRXhwZW5kYWJsZUVsZW1lbnQsIGV4cGFuZGFibGUgfSBmcm9tIFwiLi4vQmFzZS9leHBlbmRhYmxlLmpzXCJcbmltcG9ydCB7IGNzc0Zsb2F0IH0gZnJvbSBcIi4uL0Jhc2UvZG9tLmpzXCJcbmltcG9ydCB7IENvbXBvbmVudCB9IGZyb20gXCIuL2NvbXBvbmVudC5qc1wiXG5cbmltcG9ydCB7IGRlZmluZSB9IGZyb20gXCIuLi9kYi5qc1wiXG5cbmRlY2xhcmUgZ2xvYmFsXG57XG4gICAgIGludGVyZmFjZSAkVG9vbGJhciBleHRlbmRzICRFeHRlbmRzIDwkTGlzdFZpZXc+IC8vICRDb250YWluZXJcbiAgICAge1xuICAgICAgICAgIHR5cGUgICAgIDogXCJ0b29sYmFyXCJcbiAgICAgICAgICB0aXRsZSAgICA6IHN0cmluZ1xuICAgICAgICAgIGJ1dHRvbnMgIDogJEJ1dHRvbiBbXVxuICAgICB9XG5cbiAgICAgaW50ZXJmYWNlICRMaXN0VmlldyBleHRlbmRzICRDb250YWluZXJcbiAgICAge1xuICAgICAgICAgIHR5cGU6IFwibGlzdC12aWV3XCJcbiAgICAgfVxuXG59XG5cbmNsYXNzIExpc3RWaWV3IDwkIGV4dGVuZHMgJEV4dGVuZHMgPCRMaXN0Vmlldz4+IGV4dGVuZHMgQ29udGFpbmVyIDwkPlxue1xuICAgICBzd2lwZWFibGU6IEV4cGVuZGFibGVFbGVtZW50XG5cbiAgICAgLyoqIEBvdmVycmlkZSAqL1xuICAgICBnZXRIdG1sICgpXG4gICAgIHtcbiAgICAgICAgICBpZiAoIHRoaXMuY29udGFpbmVyICE9IHVuZGVmaW5lZCApXG4gICAgICAgICAgICAgICByZXR1cm4gW3RoaXMuY29udGFpbmVyXVxuXG4gICAgICAgICAgY29uc3Qgc2xvdCA9IHRoaXMuc2xvdCA9IDxkaXYgY2xhc3M9XCJsaXN0LXZpZXctc2xpZGVcIj48L2Rpdj5cblxuICAgICAgICAgIHN1cGVyLmdldEh0bWwgKClcblxuICAgICAgICAgIGNvbnN0IGNvbnRhaW5lciA9IHRoaXMuY29udGFpbmVyXG5cbiAgICAgICAgICBjb250YWluZXIuYXBwZW5kICggc2xvdCApXG4gICAgICAgICAgY29udGFpbmVyLmNsYXNzTGlzdC5hZGQgKCBcImxpc3Qtdmlld1wiIClcblxuICAgICAgICAgIHRoaXMuc3dpcGVhYmxlID0gZXhwYW5kYWJsZSAoIHNsb3QsIHtcbiAgICAgICAgICAgICAgIGhhbmRsZXMgICA6IFsgY29udGFpbmVyIF0sXG4gICAgICAgICAgICAgICBtaW5TaXplICA6IDAsXG4gICAgICAgICAgICAgICBtYXhTaXplICA6IDAsXG4gICAgICAgICAgICAgICBwcm9wZXJ0eSAgOiB0aGlzLmlzX3ZlcnRpY2FsID8gXCJ0b3BcIjogXCJsZWZ0XCIsXG4gICAgICAgICAgICAgICBkaXJlY3Rpb24gOiB0aGlzLmRhdGEuZGlyZWN0aW9uLFxuICAgICAgICAgICAgICAgdW5pdCAgICAgOiBcInB4XCIsXG4gICAgICAgICAgICAgICAvL21vdXNlV2hlZWw6IHRydWUsXG4gICAgICAgICAgfSlcbiAgICAgICAgICB0aGlzLnN3aXBlYWJsZS5hY3RpdmF0ZSAoKVxuXG4gICAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIgKCBcIkRPTUNvbnRlbnRMb2FkZWRcIiwgKCkgPT5cbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICB0aGlzLnN3aXBlYWJsZS51cGRhdGVDb25maWcgKHtcbiAgICAgICAgICAgICAgICAgICAgbWluU2l6ZTogLXRoaXMuc2xpZGVTaXplICgpLFxuICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICB9KVxuXG4gICAgICAgICAgcmV0dXJuIFt0aGlzLmNvbnRhaW5lcl1cbiAgICAgfVxuXG4gICAgIC8vIG9uQ2hpbGRyZW5BZGRlZCAoIGVsZW1lbnRzOiBDb21wb25lbnQgW10gKVxuICAgICAvLyB7XG4gICAgIC8vICAgICAgdGhpcy5zd2lwZWFibGUudXBkYXRlQ29uZmlnICh7XG4gICAgIC8vICAgICAgICAgICBtaW5TaXplICA6IC10aGlzLnNsaWRlU2l6ZSAoKSxcbiAgICAgLy8gICAgICAgICAgIHByb3BlcnR5IDogdGhpcy5pc192ZXJ0aWNhbCA/IFwidG9wXCI6IFwibGVmdFwiLFxuICAgICAvLyAgICAgICAgICAgZGlyZWN0aW9uOiB0aGlzLmRhdGEuZGlyZWN0aW9uLFxuICAgICAvLyAgICAgIH0pXG4gICAgIC8vIH1cblxuICAgICBwcml2YXRlIHNsaWRlU2l6ZSAoKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgeyBzbG90IH0gPSB0aGlzXG5cbiAgICAgICAgICByZXR1cm4gY3NzRmxvYXQgKCBzbG90LCB0aGlzLmlzX3ZlcnRpY2FsID8gXCJoZWlnaHRcIiA6IFwid2lkdGhcIiApXG4gICAgIH1cblxuICAgICBzd2lwZSAoIG9mZnNldDogc3RyaW5nfG51bWJlciwgdW5pdD86IFwicHhcIiB8IFwiJVwiIClcbiAgICAge1xuICAgICAgICAgLy8gaWYgKCB0eXBlb2Ygb2Zmc2V0ID09IFwic3RyaW5nXCIgKVxuICAgICAgICAgLy8gICAgICB0aGlzLnN3aXBlYWJsZS5zd2lwZSAoIG9mZnNldCApXG4gICAgICAgICAvLyBlbHNlXG4gICAgICAgICAvLyAgICAgIHRoaXMuc3dpcGVhYmxlLnN3aXBlICggb2Zmc2V0LCB1bml0IClcbiAgICAgfVxufVxuXG4vKipcbiAqICAgYGBgcHVnXG4gKiAgIC50b29sYmFyXG4gKiAgICAgICAgLnRvb2xiYXItYmFja2dyb3VuZ1xuICogICAgICAgIC50b29sYmFyLXNsaWRlXG4gKiAgICAgICAgICAgICBbLi4uXVxuICogICBgYGBcbiAqL1xuZXhwb3J0IGNsYXNzIFRvb2xiYXIgZXh0ZW5kcyBMaXN0VmlldyA8JFRvb2xiYXI+XG57XG4gICAgIHRhYnMgICAgICA6IEpTWC5FbGVtZW50IFtdXG4gICAgIGJhY2tncm91bmQ6IEpTWC5FbGVtZW50XG5cbiAgICAgZGVmYXVsdENvbmZpZyAoKTogJFRvb2xiYXJcbiAgICAge1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAuLi4gc3VwZXIuZGVmYXVsdERhdGEgKCksXG4gICAgICAgICAgICAgICB0eXBlICAgICA6IFwidG9vbGJhclwiLFxuICAgICAgICAgICAgICAgdGl0bGUgICAgOiBcIlRpdGxlIC4uLlwiLFxuICAgICAgICAgICAgICAgZGlyZWN0aW9uOiBcImxyXCIsXG4gICAgICAgICAgICAgICAvL3JldmVyc2UgIDogZmFsc2UsXG4gICAgICAgICAgICAgICBidXR0b25zOiBbXVxuICAgICAgICAgIH1cbiAgICAgfVxuXG4gICAgIC8qKiBAb3ZlcnJpZGUgKi9cbiAgICAgZ2V0SHRtbCAoKVxuICAgICB7XG4gICAgICAgICAgaWYgKCB0aGlzLmNvbnRhaW5lciAhPSB1bmRlZmluZWQgKVxuICAgICAgICAgICAgICAgcmV0dXJuIFt0aGlzLmNvbnRhaW5lcl1cblxuICAgICAgICAgIHN1cGVyLmdldEh0bWwgKClcblxuICAgICAgICAgIGlmICggdGhpcy5kYXRhLmJ1dHRvbnMgKVxuICAgICAgICAgICAgICAgdGhpcy5hcHBlbmQgKCAuLi4gdGhpcy5kYXRhLmJ1dHRvbnMgKVxuXG4gICAgICAgICAgcmV0dXJuIFt0aGlzLmNvbnRhaW5lcl1cbiAgICAgfVxufVxuXG5kZWZpbmUgKCBUb29sYmFyLCBbQ09OVEVYVF9VSSwgXCJ0b29sYmFyXCJdIClcblxuXG4vLyB0eXBlIERpcmVjdGlvbiA9IFwibHJcIiB8IFwicmxcIiB8IFwidGJcIiB8IFwiYnRcIlxuLy9cbi8vIHR5cGUgVW5pdHMgPSBcInB4XCIgfCBcIiVcIlxuLy9cbi8vIGNvbnN0IHRvRmxleERpcmVjdGlvbiA9IHtcbi8vICAgICAgbHI6IFwicm93XCIgICAgICAgICAgICBhcyBcInJvd1wiLFxuLy8gICAgICBybDogXCJyb3ctcmV2ZXJzZVwiICAgIGFzIFwicm93LXJldmVyc2VcIixcbi8vICAgICAgdGI6IFwiY29sdW1uXCIgICAgICAgICBhcyBcImNvbHVtblwiLFxuLy8gICAgICBidDogXCJjb2x1bW4tcmV2ZXJzZVwiIGFzIFwiY29sdW1uLXJldmVyc2VcIixcbi8vIH1cbi8vXG4vLyBjb25zdCB0b1JldmVyc2UgPSB7XG4vLyAgICAgIGxyOiBcInJsXCIgYXMgXCJybFwiLFxuLy8gICAgICBybDogXCJsclwiIGFzIFwibHJcIixcbi8vICAgICAgdGI6IFwiYnRcIiBhcyBcImJ0XCIsXG4vLyAgICAgIGJ0OiBcInRiXCIgYXMgXCJ0YlwiLFxuLy8gfVxuIiwiXG5pbXBvcnQgeyBkcmFnZ2FibGUsIERyYWdFdmVudCB9IGZyb20gXCIuL2RyYWdnYWJsZS5qc1wiXG5cbnR5cGUgRGlyZWN0aW9uID0gXCJsclwiIHwgXCJybFwiIHwgXCJidFwiIHwgXCJ0YlwiXG50eXBlIERPTUVsZW1lbnQgPSBIVE1MRWxlbWVudCB8IFNWR0VsZW1lbnRcblxuZXhwb3J0IGludGVyZmFjZSBTY29sbGFibGVDb25maWdcbntcbiAgICAgaGFuZGxlczogRE9NRWxlbWVudCBbXVxuICAgICBkaXJlY3Rpb246IERpcmVjdGlvblxufVxuXG5mdW5jdGlvbiBkZWZhdWx0Q29uZmlnICgpOiBTY29sbGFibGVDb25maWdcbntcbiAgICAgcmV0dXJuIHtcbiAgICAgICAgICBoYW5kbGVzICA6IFtdLFxuICAgICAgICAgIGRpcmVjdGlvbjogXCJ0YlwiXG4gICAgIH1cbn1cblxuZnVuY3Rpb24gc2Nyb2xsYWJsZU5hdGl2ZSAoIG9wdGlvbnM6IFNjb2xsYWJsZUNvbmZpZyApXG57XG4gICAgIGRlc2FjdGl2YXRlICgpXG5cbiAgICAgcmV0dXJuIHtcbiAgICAgICAgICBhY3RpdmF0ZSxcbiAgICAgICAgICBkZXNhY3RpdmF0ZSxcbiAgICAgfVxuXG4gICAgIGZ1bmN0aW9uIGFjdGl2YXRlICgpXG4gICAgIHtcbiAgICAgICAgICBjb25zdCBkaXIgPSBvcHRpb25zLmRpcmVjdGlvbiA9PSBcImJ0XCIgfHwgb3B0aW9ucy5kaXJlY3Rpb24gPT0gXCJ0YlwiXG4gICAgICAgICAgICAgICAgICAgID8gXCJwYW4teVwiIDogXCJwYW4teFwiXG5cbiAgICAgICAgICBmb3IgKCBjb25zdCBoIG9mIG9wdGlvbnMuaGFuZGxlcyApXG4gICAgICAgICAgICAgICBoLnN0eWxlLnRvdWNoQWN0aW9uID0gZGlyXG4gICAgIH1cblxuICAgICBmdW5jdGlvbiBkZXNhY3RpdmF0ZSAoKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgZGlyID0gb3B0aW9ucy5kaXJlY3Rpb24gPT0gXCJidFwiIHx8IG9wdGlvbnMuZGlyZWN0aW9uID09IFwidGJcIlxuICAgICAgICAgICAgICAgICAgICA/IFwicGFuLXlcIiA6IFwicGFuLXhcIlxuXG4gICAgICAgICAgZm9yICggY29uc3QgaCBvZiBvcHRpb25zLmhhbmRsZXMgKVxuICAgICAgICAgICAgICAgaC5zdHlsZS50b3VjaEFjdGlvbiA9IFwibm9uZVwiXG4gICAgIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNjb2xsYWJsZSAoIG9wdGlvbnM6IFNjb2xsYWJsZUNvbmZpZyApXG57XG4gICAgIGlmICggXCJvbnRvdWNoc3RhcnRcIiBpbiB3aW5kb3cgKVxuICAgICAgICAgIHJldHVybiBzY3JvbGxhYmxlTmF0aXZlICggb3B0aW9ucyApXG5cbiAgICAgY29uc3QgZHJhZyA9IGRyYWdnYWJsZSAoe1xuICAgICAgICAgIGhhbmRsZXMgICAgICAgOiBvcHRpb25zLmhhbmRsZXMsXG4gICAgICAgICAgdmVsb2NpdHlGYWN0b3I6IDEwMCxcbiAgICAgICAgICBvblN0YXJ0RHJhZyxcbiAgICAgICAgICBvbkRyYWcgICAgIDogb3B0aW9ucy5kaXJlY3Rpb24gPT0gXCJidFwiIHx8IG9wdGlvbnMuZGlyZWN0aW9uID09IFwidGJcIlxuICAgICAgICAgICAgICAgICAgICAgPyBvbkRyYWdWZXJ0aWNhbFxuICAgICAgICAgICAgICAgICAgICAgOiBvbkRyYWdIb3Jpem9udGFsLFxuICAgICAgICAgIG9uU3RvcERyYWc6IG9wdGlvbnMuZGlyZWN0aW9uID09IFwiYnRcIiB8fCBvcHRpb25zLmRpcmVjdGlvbiA9PSBcInRiXCJcbiAgICAgICAgICAgICAgICAgICAgPyBvblN0b3BEcmFnVmVydGljYWxcbiAgICAgICAgICAgICAgICAgICAgOiBvblN0b3BEcmFnSG9yaXpvbnRhbCxcbiAgICAgfSlcblxuICAgICByZXR1cm4ge1xuICAgICAgICAgIGFjdGl2YXRlOiAoKSA9PiB7IGRyYWcuYWN0aXZhdGUgKCkgfVxuICAgICB9XG5cbiAgICAgZnVuY3Rpb24gb25TdGFydERyYWcgKClcbiAgICAge1xuICAgICAgICAgIGZvciAoIGNvbnN0IGggb2Ygb3B0aW9ucy5oYW5kbGVzIClcbiAgICAgICAgICAgICAgIGguc3R5bGUuc2Nyb2xsQmVoYXZpb3IgPSBcInVuc2V0XCJcbiAgICAgfVxuICAgICBmdW5jdGlvbiBvbkRyYWdWZXJ0aWNhbCAoIGV2ZW50OiBEcmFnRXZlbnQgKVxuICAgICB7XG4gICAgICAgICAgZm9yICggY29uc3QgaCBvZiBvcHRpb25zLmhhbmRsZXMgKVxuICAgICAgICAgICAgICAgaC5zY3JvbGxCeSAoIDAsIGV2ZW50Lm9mZnNldFkgKVxuICAgICB9XG4gICAgIGZ1bmN0aW9uIG9uRHJhZ0hvcml6b250YWwgKCBldmVudDogRHJhZ0V2ZW50IClcbiAgICAge1xuICAgICAgICAgIGZvciAoIGNvbnN0IGggb2Ygb3B0aW9ucy5oYW5kbGVzIClcbiAgICAgICAgICAgICAgIGguc2Nyb2xsQnkgKCBldmVudC5vZmZzZXRYLCAwIClcbiAgICAgfVxuICAgICBmdW5jdGlvbiBvblN0b3BEcmFnVmVydGljYWwgKCBldmVudDogRHJhZ0V2ZW50IClcbiAgICAge1xuICAgICAgICAgIGZvciAoIGNvbnN0IGggb2Ygb3B0aW9ucy5oYW5kbGVzIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBoLnNjcm9sbEJ5ICggMCwgZXZlbnQub2Zmc2V0WSApXG4gICAgICAgICAgICAgICAvL2guc3R5bGUuc2Nyb2xsQmVoYXZpb3IgPSBcInNtb290aFwiXG4gICAgICAgICAgICAgICAvL2guc2Nyb2xsQnkgKCAwLCBldmVudC5vZmZzZXRZICsgZXZlbnQudmVsb2NpdHlZIClcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgfVxuICAgICBmdW5jdGlvbiBvblN0b3BEcmFnSG9yaXpvbnRhbCAoIGV2ZW50OiBEcmFnRXZlbnQgKVxuICAgICB7XG4gICAgICAgICAgZm9yICggY29uc3QgaCBvZiBvcHRpb25zLmhhbmRsZXMgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGguc2Nyb2xsQnkgKCBldmVudC5vZmZzZXRYLCAwIClcbiAgICAgICAgICAgICAgIC8vaC5zdHlsZS5zY3JvbGxCZWhhdmlvciA9IFwic21vb3RoXCJcbiAgICAgICAgICAgICAgIC8vaC5zY3JvbGxCeSAoIGV2ZW50Lm9mZnNldFggKyBldmVudC52ZWxvY2l0eVgsIDAgKVxuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICB9XG59XG4iLCJcbmltcG9ydCB7IENvbnRhaW5lciB9IGZyb20gXCIuL2NvbnRhaW5lclwiXG5pbXBvcnQgeyBDb21wb25lbnQgfSBmcm9tIFwiLi9jb21wb25lbnRcIlxuaW1wb3J0IHsgeG5vZGUgfSBmcm9tIFwiLi4vQmFzZS94bm9kZVwiXG5pbXBvcnQgeyBleHBhbmRhYmxlLCBFeHBlbmRhYmxlRWxlbWVudCB9IGZyb20gXCIuLi9CYXNlL2V4cGVuZGFibGVcIlxuaW1wb3J0IHsgZGVmaW5lIH0gZnJvbSBcIi4uL2RiXCJcbmltcG9ydCB7IHNjb2xsYWJsZSB9IGZyb20gXCIuLi9CYXNlL3Njcm9sbGFibGVcIlxuaW1wb3J0IHsgc3dpcGVhYmxlLCBTd2lwZWFibGVFbGVtZW50IH0gZnJvbSBcIi4uL0Jhc2Uvc3dpcGVhYmxlXCJcbmltcG9ydCB7IFRvb2xiYXIgfSBmcm9tIFwiLi90b29sYmFyXCJcblxuXG5cbmRlY2xhcmUgZ2xvYmFsXG57XG4gICAgIGludGVyZmFjZSAkU2lkZU1lbnUgZXh0ZW5kcyAkQ29udGFpbmVyXG4gICAgIHtcbiAgICAgICAgICB0eXBlOiBcInNpZGUtbWVudVwiXG4gICAgICAgICAgaGFzTWFpbkJ1dHRvbjogYm9vbGVhbixcbiAgICAgICAgICBidXR0b25zID8gOiAkQnV0dG9uIFtdXG4gICAgICAgICAgY2hpbGRyZW4/ICAgIDogJFBhbmVsIFtdXG5cbiAgICAgICAgICAvLyBoZWFkZXI/ICAgICAgOiAkQW55Q29tcG9uZW50c1xuICAgICAgICAgIC8vIGZvb3Rlcj8gICAgICA6ICRBbnlDb21wb25lbnRzXG4gICAgIH1cblxuICAgICBpbnRlcmZhY2UgJFNsaWRlc2hvdyBleHRlbmRzICRDb250YWluZXJcbiAgICAge1xuICAgICAgICAgIHR5cGUgICAgICAgIDogXCJzbGlkZXNob3dcIlxuICAgICAgICAgIGNoaWxkcmVuICAgIDogJEFueUNvbXBvbmVudHMgW11cbiAgICAgICAgICBpc1N3aXBlYWJsZT86IGJvb2xlYW5cbiAgICAgfVxuXG4gICAgIGludGVyZmFjZSAkU2xpZGUgZXh0ZW5kcyAkQ29udGFpbmVyXG4gICAgIHtcbiAgICAgICAgICB0eXBlOiBcInNsaWRlXCJcbiAgICAgfVxufVxuXG50eXBlIERpcmVjdGlvbiA9IFwibHJcIiB8IFwicmxcIiB8IFwidGJcIiB8IFwiYnRcIlxuXG5cbnZhciBsZWZ0X21lbnUgICA9IG51bGwgYXMgU2lkZU1lbnVcbnZhciByaWdodF9tZW51ICA9IG51bGwgYXMgU2lkZU1lbnVcbnZhciB0b3BfbWVudSAgICA9IG51bGwgYXMgU2lkZU1lbnVcbnZhciBib3R0b21fbWVudSA9IG51bGwgYXMgU2lkZU1lbnVcblxuY29uc3QgdG9Qb3NpdGlvbiA9IHtcbiAgICAgbHIgOiBcImxlZnRcIixcbiAgICAgcmwgOiBcInJpZ2h0XCIsXG4gICAgIHRiIDogXCJ0b3BcIixcbiAgICAgYnQgOiBcImJvdHRvbVwiLFxufVxuXG5cbmV4cG9ydCBjbGFzcyBTaWRlTWVudSBleHRlbmRzIENvbnRhaW5lciA8JFNpZGVNZW51Plxue1xuICAgICBzdGF0aWMgYXRMZWZ0OiBTaWRlTWVudVxuICAgICBzdGF0aWMgYXRSaWdodDogU2lkZU1lbnVcbiAgICAgc3RhdGljIGF0VG9wOiBTaWRlTWVudVxuICAgICBzdGF0aWMgYXRCb3R0b206IFNpZGVNZW51XG5cbiAgICAgbWFpbl9idXR0b246IEpTWC5FbGVtZW50XG4gICAgIGV4cGFuZGFibGUgOiBFeHBlbmRhYmxlRWxlbWVudFxuICAgICBzbGlkZXNob3cgIDogU2xpZGVzaG93XG4gICAgIHRvb2xiYXIgICAgIDogQ29udGFpbmVyXG5cbiAgICAgLyoqIEBvdmVycmlkZSAqL1xuICAgICBnZXRIdG1sICgpXG4gICAgIHtcbiAgICAgICAgICBjb25zdCBkYXRhID0gdGhpcy5kYXRhXG4gICAgICAgICAgY29uc3QgaGVhZGVyICAgID0gPGRpdiBjbGFzcz1cInNpZGUtbWVudS1oZWFkZXJcIiAvPlxuICAgICAgICAgIGNvbnN0IGNvbnRlbnQgICA9IDxkaXYgY2xhc3M9XCJzaWRlLW1lbnUtY29udGVudFwiIC8+XG4gICAgICAgICAgY29uc3QgY29udGFpbmVyID0gPGRpdiBjbGFzcz1cInNpZGUtbWVudSBjbG9zZVwiPlxuICAgICAgICAgICAgICAgeyBoZWFkZXIgfVxuICAgICAgICAgICAgICAgeyBjb250ZW50IH1cbiAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgIHRoaXMudG9vbGJhciA9IG5ldyBUb29sYmFyICh7XG4gICAgICAgICAgICAgICBjb250ZXh0ICA6IENPTlRFWFRfVUksXG4gICAgICAgICAgICAgICB0eXBlICAgICA6IFwidG9vbGJhclwiLFxuICAgICAgICAgICAgICAgaWQgICAgICAgOiBkYXRhLmlkICsgXCItdG9vbGJhclwiLFxuICAgICAgICAgICAgICAgZGlyZWN0aW9uOiBkYXRhLmRpcmVjdGlvbiA9PSBcImxyXCIgfHwgZGF0YS5kaXJlY3Rpb24gPT0gXCJybFwiID8gXCJ0YlwiIDogXCJsclwiLFxuICAgICAgICAgICAgICAgdGl0bGUgICAgOiBudWxsLFxuICAgICAgICAgICAgICAgYnV0dG9ucyAgOiBkYXRhLmJ1dHRvbnMsXG4gICAgICAgICAgICAgICBjaGlsZHJlbiA6IG51bGwsXG4gICAgICAgICAgICAgICAvL2NoaWxkcmVuOiBkYXRhLmNoaWxkcmVuLFxuICAgICAgICAgIH0pXG4gICAgICAgICAgaGVhZGVyLmFwcGVuZCAoIC4uLiB0aGlzLnRvb2xiYXIuZ2V0SHRtbCAoKSApXG5cbiAgICAgICAgICAvLyBkYXRhLmFkZGl0aW9uYWxCdXR0b25zXG4gICAgICAgICAgLy8gaWYgKCBkYXRhLmJ1dHRvbnMgKVxuICAgICAgICAgIC8vIHtcbiAgICAgICAgICAvLyAgICAgIGZvciAoIGNvbnN0IGNoaWxkIG9mIGRhdGEuYnV0dG9ucyApXG4gICAgICAgICAgLy8gICAgICAgICAgIHRoaXMuaGVhZGVyLmFwcGVuZCAoIGNoaWxkIClcbiAgICAgICAgICAvLyB9XG5cbiAgICAgICAgICBpZiAoIGRhdGEuaGFzTWFpbkJ1dHRvbiApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgY29uc3QgYnRuID0gPHNwYW4gY2xhc3M9XCJzaWRlLW1lbnUtbWFpbi1idXR0b25cIj5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJpY29uXCI+4oeVPC9zcGFuPlxuICAgICAgICAgICAgICAgPC9zcGFuPlxuXG4gICAgICAgICAgICAgICB0aGlzLm1haW5fYnV0dG9uID0gYnRuXG4gICAgICAgICAgICAgICBoZWFkZXIuaW5zZXJ0QWRqYWNlbnRFbGVtZW50ICggXCJhZnRlcmJlZ2luXCIsIGJ0biApXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdGhpcy5zbGlkZXNob3cgPSBuZXcgU2xpZGVzaG93ICh7XG4gICAgICAgICAgICAgICBjb250ZXh0ICAgIDogQ09OVEVYVF9VSSxcbiAgICAgICAgICAgICAgIHR5cGUgICAgICAgOiBcInNsaWRlc2hvd1wiLFxuICAgICAgICAgICAgICAgaWQgICAgICAgICA6IGRhdGEuaWQgKyBcIi1zbGlkZXNob3dcIixcbiAgICAgICAgICAgICAgIGRpcmVjdGlvbiAgOiBkYXRhLmRpcmVjdGlvbixcbiAgICAgICAgICAgICAgIGlzU3dpcGVhYmxlOiBmYWxzZSxcbiAgICAgICAgICAgICAgIGNoaWxkcmVuICAgOiBbXVxuICAgICAgICAgIH0pXG4gICAgICAgICAgY29udGVudC5hcHBlbmQgKCAuLi4gdGhpcy5zbGlkZXNob3cuZ2V0SHRtbCAoKSAgKVxuXG4gICAgICAgICAgaWYgKCBkYXRhLmNoaWxkcmVuIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBmb3IgKCBjb25zdCBjaGlsZCBvZiBkYXRhLmNoaWxkcmVuIClcbiAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zbGlkZXNob3cuYXBwZW5kICggY2hpbGQgKVxuICAgICAgICAgICAgICAgICAgICBpZiAoIGNoaWxkLmJ1dHRvbiApXG4gICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy50b29sYmFyLmFwcGVuZCAoIGNoaWxkLmJ1dHRvbiApXG4gICAgICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29udGFpbmVyLmNsYXNzTGlzdC5hZGQgKCB0b1Bvc2l0aW9uIFtkYXRhLmRpcmVjdGlvbl0gKVxuICAgICAgICAgIHNjb2xsYWJsZSAoeyBoYW5kbGVzOiBbY29udGVudF0sIGRpcmVjdGlvbjogXCJidFwiIH0pLmFjdGl2YXRlICgpXG5cbiAgICAgICAgICB0aGlzLmNvbnRhaW5lciAgPSBjb250YWluZXJcbiAgICAgICAgICB0aGlzLmV4cGFuZGFibGUgPSBleHBhbmRhYmxlICggdGhpcy5jb250YWluZXIsIHtcbiAgICAgICAgICAgICAgIGRpcmVjdGlvbiAgICA6IGRhdGEuZGlyZWN0aW9uLFxuICAgICAgICAgICAgICAgbmVhciAgICAgICAgIDogNjAsXG4gICAgICAgICAgICAgICBoYW5kbGVzICAgICAgOiBBcnJheS5vZiAoIHRoaXMubWFpbl9idXR0b24gKSxcbiAgICAgICAgICAgICAgIG9uQWZ0ZXJPcGVuICA6ICgpID0+IGNvbnRlbnQuY2xhc3NMaXN0LnJlbW92ZSAoIFwiaGlkZGVuXCIgKSxcbiAgICAgICAgICAgICAgIG9uQmVmb3JlQ2xvc2U6ICgpID0+IGNvbnRlbnQuY2xhc3NMaXN0LmFkZCAoIFwiaGlkZGVuXCIgKVxuICAgICAgICAgIH0pXG4gICAgICAgICAgdGhpcy5leHBhbmRhYmxlLmFjdGl2YXRlICgpXG5cbiAgICAgICAgICByZXR1cm4gWyB0aGlzLmNvbnRhaW5lciBdIGFzIEhUTUxFbGVtZW50IFtdXG4gICAgIH1cblxuICAgICAvKiogQG92ZXJyaWRlICovXG4gICAgIGFwcGVuZCAoIC4uLiBlbGVtZW50czogKHN0cmluZyB8IEVsZW1lbnQgfCBDb21wb25lbnQgfCAkQW55Q29tcG9uZW50cykgW10gKVxuICAgICB7XG4gICAgICAgICAgdGhpcy5zbGlkZXNob3cuYXBwZW5kICggLi4uIGVsZW1lbnRzIClcbiAgICAgfVxuXG4gICAgIC8qKiBAb3ZlcnJpZGUgKi9cbiAgICAgcmVtb3ZlICggLi4uIGVsZW1lbnRzOiBDb21wb25lbnQgW10gKVxuICAgICB7XG4gICAgICAgICAgdGhpcy5zbGlkZXNob3cucmVtb3ZlICggLi4uIGVsZW1lbnRzIClcbiAgICAgfVxuXG4gICAgIG9wZW4gKClcbiAgICAge1xuXG4gICAgIH1cblxuICAgICBjbG9zZSAoKVxuICAgICB7XG4gICAgICAgICAgdGhpcy5leHBhbmRhYmxlLmNsb3NlICgpXG5cbiAgICAgICAgICByZXR1cm4gdGhpc1xuICAgICB9XG59XG5cblxuZXhwb3J0IGNsYXNzIFNsaWRlc2hvdyBleHRlbmRzIENvbnRhaW5lciA8JFNsaWRlc2hvdz5cbntcbiAgICAgY2hpbGRyZW4gPSB7fSBhcyBSZWNvcmQgPHN0cmluZywgQ29udGFpbmVyPlxuICAgICBjdXJyZW50OiBDb21wb25lbnRcbiAgICAgcHJpdmF0ZSBzd2lwZWFibGU6IFN3aXBlYWJsZUVsZW1lbnRcblxuICAgICAvKiogQG92ZXJyaWRlICovXG4gICAgIGdldEh0bWwgKClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IGVsZW1lbnRzID0gc3VwZXIuZ2V0SHRtbCAoKVxuXG4gICAgICAgICAgY29uc3QgZGF0YSA9IHRoaXMuZGF0YVxuICAgICAgICAgIGNvbnN0IGNvbnRhaW5lciA9IHRoaXMuY29udGFpbmVyXG5cbiAgICAgICAgICBpZiAoIGRhdGEuaXNTd2lwZWFibGUgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHRoaXMuc3dpcGVhYmxlID0gc3dpcGVhYmxlICggY29udGFpbmVyLCB7XG4gICAgICAgICAgICAgICAgICAgIGhhbmRsZXMgICA6IFsgY29udGFpbmVyIF0sXG4gICAgICAgICAgICAgICAgICAgIG1pblZhbHVlICA6IC0wLFxuICAgICAgICAgICAgICAgICAgICBtYXhWYWx1ZSAgOiAwLFxuICAgICAgICAgICAgICAgICAgICBwb3JwZXJ0eSAgOiBkYXRhLmRpcmVjdGlvbiA9PSBcImJ0XCIgfHwgZGF0YS5kaXJlY3Rpb24gPT0gXCJ0YlwiID8gXCJ0b3BcIjogXCJsZWZ0XCIsXG4gICAgICAgICAgICAgICAgICAgIHVuaXRzICAgICA6IFwicHhcIixcbiAgICAgICAgICAgICAgICAgICAgbW91c2VXaGVlbDogdHJ1ZSxcbiAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICB0aGlzLnN3aXBlYWJsZS5hY3RpdmF0ZSAoKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiBlbGVtZW50c1xuICAgICB9XG59XG5cblxuZGVmaW5lICggU2lkZU1lbnUsIFtDT05URVhUX1VJLCBcInNpZGUtbWVudVwiXSApXG5kZWZpbmUgKCBTbGlkZXNob3csIFtDT05URVhUX1VJLCBcInNsaWRlc2hvd1wiXSApXG5kZWZpbmUgKCBDb250YWluZXIsIFtDT05URVhUX1VJLCBcInNsaWRlXCJdICAgICApXG4iLCJcbmltcG9ydCB7IHhub2RlIH0gZnJvbSBcIi4veG5vZGVcIlxuXG5leHBvcnQgdHlwZSBTaGFwZU5hbWVzID0ga2V5b2YgU2hhcGVEZWZpbml0aW9uc1xuXG5leHBvcnQgaW50ZXJmYWNlIFNoYXBlRGVmaW5pdGlvbnNcbntcbiAgICAgY2lyY2xlICAgOiBPYmplY3REZWZpbml0aW9uLFxuICAgICB0cmlhbmdsZSA6IE9iamVjdERlZmluaXRpb24sXG4gICAgIHNxdWFyZSAgIDogT2JqZWN0RGVmaW5pdGlvbixcbiAgICAgcGFudGFnb24gOiBPYmplY3REZWZpbml0aW9uLFxuICAgICBoZXhhZ29uICA6IE9iamVjdERlZmluaXRpb24sXG4gICAgIHRleHQgICAgIDogVGV4dERlZmluaXRpb24sXG4gICAgIHRleHRib3ggIDogVGV4dERlZmluaXRpb24sXG4gICAgIHBhdGggICAgIDogUGF0aERlZmluaXRpb24sXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgT2JqZWN0RGVmaW5pdGlvblxue1xuICAgICBzaXplOiBudW1iZXIsXG4gICAgIHg/ICA6IG51bWJlcixcbiAgICAgeT8gIDogbnVtYmVyXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgVGV4dERlZmluaXRpb24gZXh0ZW5kcyBPYmplY3REZWZpbml0aW9uXG57XG4gICAgIHRleHQ6IHN0cmluZ1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFBhdGhEZWZpbml0aW9uIGV4dGVuZHMgT2JqZWN0RGVmaW5pdGlvblxue1xuICAgICBwYXRoOiBzdHJpbmdcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVN2Z1NoYXBlIDxUIGV4dGVuZHMgU2hhcGVOYW1lcz4gKFxuICAgICB0eXBlOiBULFxuICAgICBkZWYgOiBTaGFwZURlZmluaXRpb25zIFtUXSxcbik6IFJldHVyblR5cGUgPHR5cGVvZiBTdmdGYWN0b3J5IFtUXT5cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVN2Z1NoYXBlICggdHlwZTogU2hhcGVOYW1lcywgZGVmOiBhbnkgKVxue1xuICAgICBzd2l0Y2ggKCB0eXBlIClcbiAgICAge1xuICAgICBjYXNlIFwiY2lyY2xlXCIgIDogcmV0dXJuIFN2Z0ZhY3RvcnkuY2lyY2xlICAgKCBkZWYgKVxuICAgICBjYXNlIFwidHJpYW5nbGVcIjogcmV0dXJuIFN2Z0ZhY3RvcnkudHJpYW5nbGUgKCBkZWYgKVxuICAgICBjYXNlIFwic3F1YXJlXCIgIDogcmV0dXJuIFN2Z0ZhY3Rvcnkuc3F1YXJlICAgKCBkZWYgKVxuICAgICBjYXNlIFwicGFudGFnb25cIjogcmV0dXJuIFN2Z0ZhY3RvcnkucGFudGFnb24gKCBkZWYgKVxuICAgICBjYXNlIFwiaGV4YWdvblwiIDogcmV0dXJuIFN2Z0ZhY3RvcnkuaGV4YWdvbiAgKCBkZWYgKVxuICAgICBjYXNlIFwic3F1YXJlXCIgIDogcmV0dXJuIFN2Z0ZhY3Rvcnkuc3F1YXJlICAgKCBkZWYgKVxuICAgICBjYXNlIFwidGV4dFwiICAgIDogcmV0dXJuIFN2Z0ZhY3RvcnkudGV4dCAgICAgKCBkZWYgKVxuICAgICBjYXNlIFwidGV4dGJveFwiIDogcmV0dXJuIFN2Z0ZhY3RvcnkudGV4dGJveCAgKCBkZWYgKVxuICAgICBjYXNlIFwicGF0aFwiICAgIDogcmV0dXJuIFN2Z0ZhY3RvcnkucGF0aCAgICAgKCBkZWYgKVxuICAgICB9XG59XG5cbmNsYXNzIFN2Z0ZhY3RvcnlcbntcbiAgICAgLy8gVG8gZ2V0IHRyaWFuZ2xlLCBzcXVhcmUsIFtwYW50YXxoZXhhXWdvbiBwb2ludHNcbiAgICAgLy9cbiAgICAgLy8gdmFyIGEgPSBNYXRoLlBJKjIvNFxuICAgICAvLyBmb3IgKCB2YXIgaSA9IDAgOyBpICE9IDQgOyBpKysgKVxuICAgICAvLyAgICAgY29uc29sZS5sb2cgKCBgWyAkeyBNYXRoLnNpbihhKmkpIH0sICR7IE1hdGguY29zKGEqaSkgfSBdYCApXG5cbiAgICAgc3RhdGljIGNpcmNsZSAoIGRlZjogT2JqZWN0RGVmaW5pdGlvbiApXG4gICAgIHtcbiAgICAgICAgICBjb25zdCBub2RlID0gPGNpcmNsZVxuICAgICAgICAgICAgICAgY3ggPSB7IGRlZi54IHx8IDAgfVxuICAgICAgICAgICAgICAgY3kgPSB7IGRlZi55IHx8IDAgfVxuICAgICAgICAgICAgICAgciAgPSB7IGRlZi5zaXplIC8gMiB9XG4gICAgICAgICAgLz5cblxuICAgICAgICAgIHJldHVybiBub2RlXG4gICAgIH1cblxuICAgICBzdGF0aWMgdHJpYW5nbGUgKCBkZWY6IE9iamVjdERlZmluaXRpb24gKVxuICAgICB7XG4gICAgIH1cblxuXG4gICAgIHN0YXRpYyBzcXVhcmUgKCBkZWY6IE9iamVjdERlZmluaXRpb24gKVxuICAgICB7XG4gICAgIH1cblxuICAgICBzdGF0aWMgcGFudGFnb24gKCBkZWY6IE9iamVjdERlZmluaXRpb24gKVxuICAgICB7XG4gICAgIH1cblxuICAgICBzdGF0aWMgaGV4YWdvbiAoIGRlZjogT2JqZWN0RGVmaW5pdGlvbiApXG4gICAgIHtcbiAgICAgfVxuXG5cbiAgICAgc3RhdGljIHRleHQgKCBkZWY6IFRleHREZWZpbml0aW9uIClcbiAgICAge1xuICAgICB9XG5cbiAgICAgc3RhdGljIHRleHRib3ggKCBkZWY6IFRleHREZWZpbml0aW9uIClcbiAgICAge1xuICAgICB9XG5cblxuICAgICBzdGF0aWMgcGF0aCAoIGRlZjogUGF0aERlZmluaXRpb24gKVxuICAgICB7XG4gICAgIH1cbn1cbiIsIi8qXG5Kb2xpZSBjZSBwZXRpdCBtZW51IGNvbnRleHR1ZWwsXG5tYWlzIG5pdmVhdSByYXBpZGl0w6kgZCdhZmZpY2hhZ2UgY2Ugbidlc3QgcGFzIGJvbiBkdSB0b3V0IC4uLlxuKi9cblxuaW1wb3J0IHsgR2VvbWV0cnkgfSAgZnJvbSBcIi4uLy4uL0xpYi9pbmRleFwiXG5pbXBvcnQgeyBDb21wb25lbnQgfSBmcm9tIFwiQHVpL0VsZW1lbnRzL2NvbXBvbmVudFwiXG5pbXBvcnQgKiBhcyBTdmcgICAgICBmcm9tIFwiQHVpL0Jhc2Uvc3ZnXCJcbmltcG9ydCB7IHhub2RlIH0gICAgIGZyb20gXCJAdWkvQmFzZS94bm9kZVwiXG5cbmNvbnN0IEcgPSBHZW9tZXRyeVxuXG50eXBlIFJlbmRlcmVyID0gKCBkZWZpbml0aW9uOiBSYWRpYWxEZWZpbml0aW9uICkgPT4gU1ZHRWxlbWVudCBbXVxudHlwZSBSYWRpYWxEZWZpbml0aW9uID0gR2VvbWV0cnkuUmFkaWFsRGVmaW5pdGlvblxudHlwZSBSYWRpYWxPcHRpb24gICAgID0gR2VvbWV0cnkuUmFkaWFsT3B0aW9uXG5cbmRlY2xhcmUgZ2xvYmFsXG57XG4gICAgIGludGVyZmFjZSAkUmFkaWFsTWVudSBleHRlbmRzICRDb21wb25lbnRcbiAgICAge1xuICAgICAgICAgIHR5cGU6IFwicmFkaWFsLW1lbnVcIixcbiAgICAgICAgICBidXR0b25zOiBQYXJ0aWFsIDwkQnV0dG9uPiBbXSxcbiAgICAgICAgICByb3RhdGlvbjogbnVtYmVyXG4gICAgIH1cbn1cblxuXG5leHBvcnQgY2xhc3MgUmFkaWFsTWVudSBleHRlbmRzIENvbXBvbmVudCA8JFJhZGlhbE1lbnU+XG57XG4gICAgIGNvbnRhaW5lcjogU1ZHU1ZHRWxlbWVudFxuICAgICBkZWZpbml0aW9uOiBSYWRpYWxEZWZpbml0aW9uXG5cbiAgICAgcmVhZG9ubHkgcmVuZGVyZXJzOiBSZWNvcmQgPHN0cmluZywgUmVuZGVyZXI+ID0ge1xuICAgICAgICAgIFwiY2lyY2xlXCI6IHRoaXMucmVuZGVyU3ZnQ2lyY2xlcy5iaW5kICh0aGlzKVxuICAgICB9XG5cbiAgICAgLyoqIEBvdmVycmlkZSAqL1xuICAgICBnZXRIdG1sICgpXG4gICAgIHtcbiAgICAgICAgICB0aGlzLnVwZGF0ZSAoKVxuXG4gICAgICAgICAgcmV0dXJuIFt0aGlzLmNvbnRhaW5lciBhcyBhbnldXG4gICAgIH1cblxuICAgICBhZGQgKCAuLi4gYnV0dG9uczogJEJ1dHRvbiBbXSApXG4gICAgIHtcbiAgICAgICAgICB0aGlzLmRhdGEuYnV0dG9ucy5wdXNoICggLi4uIGJ1dHRvbnMgYXMgYW55IClcblxuICAgICAgICAgIHRoaXMudXBkYXRlICgpXG4gICAgIH1cblxuICAgICB1cGRhdGUgKClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHsgZGF0YSB9ID0gdGhpc1xuXG4gICAgICAgICAgY29uc3QgZGVmOiBSYWRpYWxPcHRpb24gPSB7XG4gICAgICAgICAgICAgICBjb3VudCAgOiBkYXRhLmJ1dHRvbnMubGVuZ3RoLFxuICAgICAgICAgICAgICAgciAgICAgIDogNzUsXG4gICAgICAgICAgICAgICBwYWRkaW5nOiA2LFxuICAgICAgICAgICAgICAgcm90YXRpb246IGRhdGEucm90YXRpb24gfHwgMFxuICAgICAgICAgIH1cblxuICAgICAgICAgIHRoaXMuZGVmaW5pdGlvbiA9IEcuZ2V0UmFkaWFsRGlzdHJpYnV0aW9uICggZGVmIClcbiAgICAgICAgICB0aGlzLmNvbnRhaW5lciAgPSB0aGlzLnRvU3ZnICggXCJjaXJjbGVcIiApXG4gICAgIH1cblxuICAgICBwcml2YXRlIGVuYWJsZUV2ZW50cyAoKVxuICAgICB7XG4gICAgICAgICAgLy9jb25zdCB7IG9wdGlvbnMgfSA9IHRoaXNcbiAgICAgICAgICAvL2ZvciAoIGNvbnN0IGJ0biBvZiBvcHRpb25zLmJ1dHRvbnMgKVxuICAgICAgICAgIC8vICAgICBidG4uXG4gICAgIH1cblxuICAgICBzaG93ICggeDogbnVtYmVyLCB5OiBudW1iZXIgKTogdm9pZFxuICAgICB7XG4gICAgICAgICAgY29uc3QgbiA9IHRoaXMuY29udGFpbmVyXG4gICAgICAgICAgY29uc3Qgb2Zmc2V0ID0gdGhpcy5kZWZpbml0aW9uLndpZHRoIC8gMlxuXG4gICAgICAgICAgbi5zdHlsZS5sZWZ0ID0gKHggLSBvZmZzZXQpICsgXCJweFwiXG4gICAgICAgICAgbi5zdHlsZS50b3AgID0gKHkgLSBvZmZzZXQpICsgXCJweFwiXG4gICAgICAgICAgbi5jbGFzc0xpc3QucmVtb3ZlICggXCJjbG9zZVwiIClcbiAgICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lciAoIFwibW91c2Vkb3duXCIsIHRoaXMuaGlkZS5iaW5kICh0aGlzKSwgdHJ1ZSApXG4gICAgIH1cblxuICAgICBoaWRlICgpXG4gICAgIHtcbiAgICAgICAgICB0aGlzLmNvbnRhaW5lci5jbGFzc0xpc3QuYWRkIChcImNsb3NlXCIpXG4gICAgICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lciAoIFwibW91c2Vkb3duXCIsIHRoaXMuaGlkZSApXG4gICAgIH1cblxuICAgICB0b1N2ZyAoIHN0eWxlOiBzdHJpbmcgKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgeyBkZWZpbml0aW9uOiBkZWYsIHJlbmRlcmVycywgZGF0YSB9ID0gdGhpc1xuXG4gICAgICAgICAgY29uc3Qgc3ZnID1cbiAgICAgICAgICAgICAgIDxzdmdcbiAgICAgICAgICAgICAgICAgICAgY2xhc3MgICA9XCJyYWRpYWwtbWVudSBjbG9zZVwiXG4gICAgICAgICAgICAgICAgICAgIHdpZHRoICAgPXsgZGVmLndpZHRoICsgXCJweFwiIH1cbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0ICA9eyBkZWYuaGVpZ2h0ICsgXCJweFwiIH1cbiAgICAgICAgICAgICAgICAgICAgdmlld0JveCA9eyBgMCAwICR7IGRlZi53aWR0aCB9ICR7IGRlZi5oZWlnaHQgfWAgfVxuICAgICAgICAgICAgICAgLz4gYXMgU1ZHU1ZHRWxlbWVudFxuXG4gICAgICAgICAgY29uc3QgYnV0dG9ucyA9IHN0eWxlIGluIHJlbmRlcmVyc1xuICAgICAgICAgICAgICAgICAgICAgICAgID8gcmVuZGVyZXJzIFtzdHlsZV0gKCBkZWYgKVxuICAgICAgICAgICAgICAgICAgICAgICAgIDogdGhpcy5yZW5kZXJTdmdDaXJjbGVzICggZGVmIClcblxuICAgICAgICAgIHN2Zy5hcHBlbmQgKCAuLi4gYnV0dG9ucyBhcyBOb2RlIFtdIClcblxuICAgICAgICAgIGZvciAoIHZhciBpID0gMCA7IGkgIT0gYnV0dG9ucy5sZW5ndGggOyBpKysgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNvbnN0IG9wdCA9IGRhdGEuYnV0dG9ucyBbaV1cblxuICAgICAgICAgICAgICAgaWYgKCB0eXBlb2Ygb3B0LmNhbGxiYWNrID09IFwiZnVuY3Rpb25cIiApXG4gICAgICAgICAgICAgICAgICAgIGJ1dHRvbnMgW2ldLmFkZEV2ZW50TGlzdGVuZXIgKCBcIm1vdXNlZG93blwiLCAoKSA9PiBvcHQuY2FsbGJhY2sgKCkgKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiBzdmdcbiAgICAgfVxuXG4gICAgIHJlbmRlclN2Z0NpcmNsZXMgKCBkZWZpbml0aW9uOiBSYWRpYWxEZWZpbml0aW9uIClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHBvaW50cyAgPSBkZWZpbml0aW9uLnBvaW50c1xuICAgICAgICAgIGNvbnN0IHBhZGRpbmcgPSBkZWZpbml0aW9uLnBhZGRpbmdcbiAgICAgICAgICBjb25zdCBidXR0dW5zID0gW10gYXMgU1ZHRWxlbWVudCBbXVxuXG4gICAgICAgICAgZm9yICggdmFyIGkgPSAwOyBpIDwgcG9pbnRzLmxlbmd0aDsgKytpIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBjb25zdCBkZWYgPSBwb2ludHMgW2ldXG4gICAgICAgICAgICAgICBjb25zdCBidG4gPSB0aGlzLmRhdGEuYnV0dG9ucyBbaV1cblxuICAgICAgICAgICAgICAgY29uc3QgZ3JvdXAgPSA8ZyBjbGFzcz1cImJ1dHRvblwiIC8+XG5cbiAgICAgICAgICAgICAgIGNvbnN0IGNpcmNsZSA9IFN2Zy5jcmVhdGVTdmdTaGFwZSAoIFwiY2lyY2xlXCIsIHtcbiAgICAgICAgICAgICAgICAgICAgc2l6ZTogZGVmLmNob3JkLmxlbmd0aCAtIHBhZGRpbmcgKiAyLFxuICAgICAgICAgICAgICAgICAgICB4OiBkZWYueCxcbiAgICAgICAgICAgICAgICAgICAgeTogZGVmLnlcbiAgICAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgICAgIGNvbnN0IHRleHQgPSA8dGV4dFxuICAgICAgICAgICAgICAgICAgICB4ID0geyBkZWYueCB9XG4gICAgICAgICAgICAgICAgICAgIHkgPSB7IGRlZi55IH1cbiAgICAgICAgICAgICAgICAgICAgZm9udC1zaXplPVwiMzBcIlxuICAgICAgICAgICAgICAgICAgICBmaWxsPVwiYmxhY2tcIlxuICAgICAgICAgICAgICAgICAgICBzdHlsZT1cInVzZXItc2VsZWN0OiBub25lOyBjdXJzb3I6IHBvaW50ZXI7IGRvbWluYW50LWJhc2VsaW5lOiBjZW50cmFsOyB0ZXh0LWFuY2hvcjogbWlkZGxlO1wiXG4gICAgICAgICAgICAgICAvPlxuXG4gICAgICAgICAgICAgICBpZiAoIGJ0bi5mb250RmFtaWx5ICE9IHVuZGVmaW5lZCApXG4gICAgICAgICAgICAgICAgICAgIHRleHQuc2V0QXR0cmlidXRlICggXCJmb250LWZhbWlseVwiLCBidG4uZm9udEZhbWlseSApXG5cbiAgICAgICAgICAgICAgIHRleHQuaW5uZXJIVE1MID0gYnRuLmljb25cblxuICAgICAgICAgICAgICAgZ3JvdXAuYXBwZW5kICggY2lyY2xlIClcbiAgICAgICAgICAgICAgIGdyb3VwLmFwcGVuZCAoIHRleHQgKVxuXG4gICAgICAgICAgICAgICBidXR0dW5zLnB1c2ggKCBncm91cCBhcyBTVkdFbGVtZW50IClcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gYnV0dHVuc1xuICAgICB9XG59XG5cbiIsIlxuaW1wb3J0IHsgQ29tcG9uZW50IH0gZnJvbSBcIi4vY29tcG9uZW50LmpzXCJcbmltcG9ydCB7IHhub2RlIH0gZnJvbSBcIi4uL0Jhc2UveG5vZGUuanNcIlxuaW1wb3J0IHsgZGVmaW5lIH0gZnJvbSBcIi4uL2RiLmpzXCJcbmltcG9ydCB7IFBhbmVsIH0gZnJvbSBcIi4uL3BhbmVsLmpzXCJcblxuZGVjbGFyZSBnbG9iYWxcbntcblxuICAgICBleHBvcnQgaW50ZXJmYWNlICRQZXJzb25WaWV3ZXIgZXh0ZW5kcyAkUGFuZWxcbiAgICAge1xuICAgICAgICAgIHJlYWRvbmx5IHR5cGU6IFwicGVyc29uLXZpZXdlclwiXG4gICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFBlcnNvblZpZXdlciBleHRlbmRzIENvbXBvbmVudCA8JFBlcnNvblZpZXdlcj5cbntcbiAgICAgZGlzcGxheSAoIHBlcnNvbjogJFBlcnNvbiApXG4gICAgIHtcbiAgICAgICAgICBjb25zdCBjYXJkID0gPGRpdiBjbGFzcz1cInczLWNhcmQtNCBwZXJzb24tY2FyZFwiPlxuICAgICAgICAgICAgICAgPGltZyBzcmM9eyBwZXJzb24uYXZhdGFyIH0gYWx0PVwiQXZhdGFyXCIvPlxuICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInczLWNvbnRhaW5lclwiPlxuICAgICAgICAgICAgICAgICAgICA8aDQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgPGI+eyBwZXJzb24uZmlyc3ROYW1lIH08L2I+XG4gICAgICAgICAgICAgICAgICAgIDwvaDQ+XG4gICAgICAgICAgICAgICAgICAgIDxsYWJlbD5cbiAgICAgICAgICAgICAgICAgICAgICAgICA8Yj57IHBlcnNvbi5pc0NhcHRhaW4gPyBcIkV4cGVydFwiIDogbnVsbCB9PC9iPlxuICAgICAgICAgICAgICAgICAgICA8L2xhYmVsPlxuICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG5cblxuICAgICAgICAgIHRoaXMuY29udGFpbmVyLmlubmVySFRNTCA9IFwiXCJcbiAgICAgICAgICB0aGlzLmNvbnRhaW5lci5hcHBlbmQgKCBjYXJkIClcbiAgICAgfVxufVxuXG5kZWZpbmUgKCBQZXJzb25WaWV3ZXIsIHtcbiAgICAgY29udGV4dCA6IENPTlRFWFRfVUksXG4gICAgIHR5cGUgICAgOiBcInBlcnNvbi12aWV3ZXJcIixcbiAgICAgaWQgICAgICA6IHVuZGVmaW5lZCxcbiAgICAgcG9zaXRpb246IFwibGVmdFwiLFxuICAgICBidXR0b24gIDogbnVsbFxufSlcbiIsIlxuaW1wb3J0IFwiLi90eXBlcy5qc1wiXG5pbXBvcnQgKiBhcyB1aSBmcm9tIFwiLi9kYi5qc1wiXG5pbXBvcnQgeyBDb21wb25lbnQgfSBmcm9tIFwiLi9FbGVtZW50cy9jb21wb25lbnQuanNcIlxuaW1wb3J0IHsgU2lkZU1lbnUgfSBmcm9tIFwiLi9FbGVtZW50cy9zaWRlTWVudVwiXG5cbmRlY2xhcmUgZ2xvYmFsXG57XG4gICAgIGludGVyZmFjZSAkUGFuZWwgZXh0ZW5kcyAkQ29tcG9uZW50XG4gICAgIHtcbiAgICAgICAgICAvL3R5cGUgICAgICAgICA6IFwicGFuZWxcIlxuICAgICAgICAgIGhlYWRlcj8gICAgICA6ICRBbnlDb21wb25lbnRzLFxuICAgICAgICAgIGNoaWxkcmVuPyAgICA6ICRBbnlDb21wb25lbnRzIFtdXG4gICAgICAgICAgZm9vdGVyPyAgICAgIDogJEFueUNvbXBvbmVudHNcbiAgICAgICAgICBwb3NpdGlvbjogXCJsZWZ0XCIgfCBcInJpZ2h0XCIgfCBcInRvcFwiIHwgXCJib3R0b21cIixcbiAgICAgICAgICBidXR0b246ICRCdXR0b25cbiAgICAgfVxufVxuXG5cbnZhciBjdXJyZW50OiBQYW5lbCA9IG51bGxcbmNvbnN0IGVsZW1zID0ge30gYXMgUmVjb3JkIDxzdHJpbmcsIFBhbmVsPlxuXG5leHBvcnQgZnVuY3Rpb24gcGFuZWwgKCk6IFBhbmVsXG5leHBvcnQgZnVuY3Rpb24gcGFuZWwgKCBpZDogc3RyaW5nICk6IFBhbmVsXG5leHBvcnQgZnVuY3Rpb24gcGFuZWwgKCBkZWZpbml0aW9uOiAkUGFuZWwgKTogUGFuZWxcbmV4cG9ydCBmdW5jdGlvbiBwYW5lbCAoIGlkOiBzdHJpbmcsIGRlZmluaXRpb246ICRQYW5lbCApOiBQYW5lbFxuZXhwb3J0IGZ1bmN0aW9uIHBhbmVsICggYT86IHN0cmluZyB8ICRQYW5lbCwgYj86ICRQYW5lbCApOiBQYW5lbFxue1xuICAgICBzd2l0Y2ggKCBhcmd1bWVudHMubGVuZ3RoIClcbiAgICAge1xuICAgICBjYXNlIDA6IC8vIHBhbmVsICgpXG5cbiAgICAgICAgICByZXR1cm4gY3VycmVudDtcblxuICAgICBjYXNlIDE6IC8vIHBhbmVsICggaWQgKSB8IHBhbmVsICggZGVmaW5pdGlvbiApXG5cbiAgICAgICAgICBpZiAoIHR5cGVvZiBhID09IFwic3RyaW5nXCIgKVxuICAgICAgICAgICAgICAgcmV0dXJuIGVsZW1zIFthXTtcblxuICAgICAgICAgIGlmICggdHlwZW9mIGEgIT0gXCJvYmplY3RcIiB8fCBhID09IG51bGwgfHwgQXJyYXkuaXNBcnJheSAoYSkgKVxuICAgICAgICAgICAgICAgdGhyb3cgYEJhZCBwYW5lbCBkZWZpbml0aW9uIDogJHsgYSB9YFxuXG4gICAgICAgICAgYiA9IGE7XG4gICAgICAgICAgYSA9IGIuaWQ7XG5cbiAgICAgY2FzZSAyOiAvLyBwYW5lbCAoIGlkLCBkZWZpbml0aW9uIClcblxuICAgICAgICAgIGlmICggdHlwZW9mIGEgIT0gXCJzdHJpbmdcIiApXG4gICAgICAgICAgICAgICB0aHJvdyBgQmFkIGlkIG5hbWUgOiAkeyBhIH1gXG5cbiAgICAgICAgICBpZiAoIGEgaW4gZWxlbXMgKVxuICAgICAgICAgICAgICAgdGhyb3cgYFBhbmVsIGFscmVhZHkgZXhpc3RzIDogJHsgYSB9YFxuXG4gICAgICAgICAgaWYgKCB0eXBlb2YgYiAhPSBcIm9iamVjdFwiIHx8IGIgPT0gbnVsbCB8fCBBcnJheS5pc0FycmF5IChiKSApXG4gICAgICAgICAgICAgICB0aHJvdyBgQmFkIHBhbmVsIGRlZmluaXRpb24gOiAkeyBiIH1gXG5cbiAgICAgICAgICA7KGIgYXMgYW55KS5pZCA9IGFcbiAgICAgICAgICAvL2VsZW1zIFthXSA9IG5ldyBQYW5lbCAoIGIgKVxuICAgICAgICAgIGVsZW1zIFthXSA9IHVpLmluU3RvY2sgKCBiICkgPyB1aS5waWNrICggYiApIDogdWkubWFrZSAoIGIgKVxuICAgICAgICAgIHRoaXMucGxhY2VUbyAoIGIucG9zaXRpb24gKTtcbiAgICAgICAgICBicmVha1xuXG4gICAgIGRlZmF1bHQ6XG4gICAgICAgICAgdGhyb3cgXCJXcm9uZyBmdW5jdGlvbiBjYWxsXCJcbiAgICAgfVxuXG59XG5cblxuXG50eXBlIERpcmVjdGlvbiA9IFwibHJcIiB8IFwicmxcIiB8IFwidGJcIiB8IFwiYnRcIlxuXG5jb25zdCB0b1Bvc2l0aW9uID0ge1xuICAgICBsciA6IFwibGVmdFwiLFxuICAgICBybCA6IFwicmlnaHRcIixcbiAgICAgdGIgOiBcInRvcFwiLFxuICAgICBidCA6IFwiYm90dG9tXCIsXG59XG5cbi8vZXhwb3J0IC8qYWJzdHJhY3QqLyBjbGFzcyBQYW5lbCA8QyBleHRlbmRzICRQYW5lbCA9ICRQYW5lbD4gZXh0ZW5kcyBDb21wb25lbnQgPEM+XG5leHBvcnQgLyphYnN0cmFjdCovIGNsYXNzIFBhbmVsIDxDIGV4dGVuZHMgJFBhbmVsID0gJFBhbmVsPiBleHRlbmRzIENvbXBvbmVudCA8Qz5cbntcbiAgICAgcHJpdmF0ZSBtZW51OiBTaWRlTWVudVxuXG4gICAgIHBsYWNlVG8gKCBzaWRlOiBcImxlZnRcIiB8IFwicmlnaHRcIiB8IFwidG9wXCIgfCBcImJvdHRvbVwiIClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IGRhdGEgPSB0aGlzLmRhdGFcblxuICAgICAgICAgIGlmICggZGF0YS5wb3NpdGlvbiA9PSBzaWRlICYmIHRoaXMubWVudSAhPSBudWxsICkgcmV0dXJuXG5cbiAgICAgICAgICBjb25zdCBjZmcgPSB7XG4gICAgICAgICAgICAgICBjb250ZXh0ICAgICAgOiBcImNvbmNlcHQtdWlcIiBhcyBcImNvbmNlcHQtdWlcIixcbiAgICAgICAgICAgICAgIHR5cGUgICAgICAgICA6IFwic2lkZS1tZW51XCIgIGFzIFwic2lkZS1tZW51XCIsXG4gICAgICAgICAgICAgICBoYXNNYWluQnV0dG9uOiB0cnVlLFxuICAgICAgICAgIH1cblxuICAgICAgICAgIHZhciBtZW51OiBTaWRlTWVudVxuXG4gICAgICAgICAgc3dpdGNoICggc2lkZSApXG4gICAgICAgICAge1xuICAgICAgICAgIGNhc2UgXCJsZWZ0XCI6XG5cbiAgICAgICAgICAgICAgIGlmICggU2lkZU1lbnUuYXRMZWZ0ID09IG51bGwgKSBTaWRlTWVudS5hdExlZnQgPSBuZXcgU2lkZU1lbnUgKHtcbiAgICAgICAgICAgICAgICAgICAgaWQ6IFwic2lkZS1tZW51LWxlZnRcIixcbiAgICAgICAgICAgICAgICAgICAgZGlyZWN0aW9uOiBcImxyXCIsXG4gICAgICAgICAgICAgICAgICAgIC4uLiBjZmcsXG4gICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgbWVudSA9IFNpZGVNZW51LmF0TGVmdFxuICAgICAgICAgICAgICAgYnJlYWtcblxuICAgICAgICAgIGNhc2UgXCJyaWdodFwiOlxuXG4gICAgICAgICAgICAgICBpZiAoIFNpZGVNZW51LmF0UmlnaHQgPT0gbnVsbCApIFNpZGVNZW51LmF0UmlnaHQgPSBuZXcgU2lkZU1lbnUgKHtcbiAgICAgICAgICAgICAgICAgICAgaWQ6IFwic2lkZS1tZW51LXJpZ2h0XCIsXG4gICAgICAgICAgICAgICAgICAgIGRpcmVjdGlvbjogXCJybFwiLFxuICAgICAgICAgICAgICAgICAgICAuLi4gY2ZnLFxuICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgIG1lbnUgPSBTaWRlTWVudS5hdFJpZ2h0XG4gICAgICAgICAgICAgICBicmVha1xuXG4gICAgICAgICAgY2FzZSBcInRvcFwiOlxuXG4gICAgICAgICAgICAgICBpZiAoIFNpZGVNZW51LmF0VG9wID09IG51bGwgKSBTaWRlTWVudS5hdFRvcCA9IG5ldyBTaWRlTWVudSAoe1xuICAgICAgICAgICAgICAgICAgICBpZDogXCJzaWRlLW1lbnUtdG9wXCIsXG4gICAgICAgICAgICAgICAgICAgIGRpcmVjdGlvbjogXCJ0YlwiLFxuICAgICAgICAgICAgICAgICAgICAuLi4gY2ZnLFxuICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgIG1lbnUgPSBTaWRlTWVudS5hdFRvcFxuICAgICAgICAgICAgICAgYnJlYWtcblxuICAgICAgICAgIGNhc2UgXCJib3R0b21cIjpcblxuICAgICAgICAgICAgICAgaWYgKCBTaWRlTWVudS5hdEJvdHRvbSA9PSBudWxsICkgU2lkZU1lbnUuYXRCb3R0b20gPSBuZXcgU2lkZU1lbnUgKHtcbiAgICAgICAgICAgICAgICAgICAgaWQ6IFwic2lkZS1tZW51LWJvdHRvbVwiLFxuICAgICAgICAgICAgICAgICAgICBkaXJlY3Rpb246IFwiYnRcIixcbiAgICAgICAgICAgICAgICAgICAgLi4uIGNmZyxcbiAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICBtZW51ID0gU2lkZU1lbnUuYXRCb3R0b21cbiAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKCB0aGlzLm1lbnUgIT0gdW5kZWZpbmVkIClcbiAgICAgICAgICAgICAgIHRoaXMubWVudS5yZW1vdmUgKCB0aGlzIClcblxuICAgICAgICAgIG1lbnUuYXBwZW5kICggdGhpcyApXG4gICAgICAgICAgZGF0YS5wb3NpdGlvbiA9IHNpZGVcbiAgICAgfVxuXG4gICAgIG9wZW4gKClcbiAgICAge1xuICAgICAgICAgIHRoaXMubWVudS5jbGVhciAoKVxuICAgICAgICAgIHRoaXMubWVudS5hcHBlbmQgKCB0aGlzIClcbiAgICAgICAgICB0aGlzLm1lbnUub3BlbiAoKVxuICAgICB9XG5cbiAgICAgY2xvc2UgKClcbiAgICAge1xuICAgICAgICAgIHRoaXMubWVudS5jbG9zZSAoKVxuICAgICB9XG5cbn1cblxuIiwiXG5pbXBvcnQgeyB4bm9kZSB9IGZyb20gXCIuLi9CYXNlL3hub2RlLmpzXCJcbmltcG9ydCB7IFBhbmVsIH0gZnJvbSBcIi4uL3BhbmVsLmpzXCJcbmltcG9ydCB7IGRlZmluZSB9IGZyb20gXCIuLi9kYi5qc1wiXG5pbXBvcnQgKiBhcyBkYiBmcm9tIFwiLi4vLi4vQXBwbGljYXRpb24vZGF0YS5qc1wiXG5cblxuZGVjbGFyZSBnbG9iYWxcbntcbiAgICAgaW50ZXJmYWNlICRTa2lsbFZpZXdlciBleHRlbmRzICRQYW5lbFxuICAgICB7XG4gICAgICAgICAgdHlwZTogXCJza2lsbC12aWV3ZXJcIlxuICAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBTa2lsbFZpZXdlciBleHRlbmRzIFBhbmVsIDwkU2tpbGxWaWV3ZXI+XG57XG4gICAgIGRpc3BsYXkgKCBza2lsbDogJFNraWxsIClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHRhcmdldCA9IDxkaXYgY2xhc3M9XCJwZW9wbGVcIj48L2Rpdj5cblxuICAgICAgICAgIGZvciAoIGNvbnN0IGl0ZW0gb2Ygc2tpbGwuaXRlbXMgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNvbnN0IHBlcnNvbiA9IGRiLm5vZGUgPCRQZXJzb24+ICggaXRlbS50eXBlLCBpdGVtLmlkIClcblxuICAgICAgICAgICAgICAgY29uc3QgY2FyZCA9IDxkaXYgY2xhc3M9XCJ3My1jYXJkLTQgcGVyc29uLWNhcmRcIj5cbiAgICAgICAgICAgICAgICAgICAgPGltZyBzcmM9eyBwZXJzb24uYXZhdGFyIH0gYWx0PVwiQXZhdGFyXCIvPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwidzMtY29udGFpbmVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgPGg0PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGI+eyBwZXJzb24uZmlyc3ROYW1lIH08L2I+XG4gICAgICAgICAgICAgICAgICAgICAgICAgPC9oND5cbiAgICAgICAgICAgICAgICAgICAgICAgICA8bGFiZWw+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8Yj57IHBlcnNvbi5pc0NhcHRhaW4gPyBcIkV4cGVydFwiIDogbnVsbCB9PC9iPlxuICAgICAgICAgICAgICAgICAgICAgICAgIDwvbGFiZWw+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgIHRhcmdldC5hcHBlbmQgKCBjYXJkIClcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB0aGlzLmNvbnRhaW5lci5jbGFzc0xpc3QuYWRkICggXCJjb250YWluZXJcIiApXG4gICAgICAgICAgdGhpcy5jb250YWluZXIuaW5uZXJIVE1MID0gXCJcIlxuICAgICAgICAgIHRoaXMuY29udGFpbmVyLmFwcGVuZCAoIDxoMT57IHNraWxsLmlkIH08L2gxPiApXG4gICAgICAgICAgdGhpcy5jb250YWluZXIuYXBwZW5kICggPHA+eyBza2lsbC5kZXNjcmlwdGlvbiB9PC9wPiApXG4gICAgICAgICAgdGhpcy5jb250YWluZXIuYXBwZW5kICggdGFyZ2V0IClcblxuICAgICAgICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9Mb3JET25pWC9qc29uLXZpZXdlci9ibG9iL21hc3Rlci9zcmMvanNvbi12aWV3ZXIuanNcbiAgICAgICAgICB0aGlzLmNvbnRhaW5lci5hcHBlbmQgKCA8cHJlPnsgSlNPTi5zdHJpbmdpZnkgKCBza2lsbCwgbnVsbCwgMyApIH08L3ByZT4gKVxuICAgICB9XG59XG5cbmRlZmluZSAoIFNraWxsVmlld2VyLCB7XG4gICAgIGNvbnRleHQgOiBDT05URVhUX1VJLFxuICAgICB0eXBlICAgIDogXCJza2lsbC12aWV3ZXJcIixcbiAgICAgaWQgICAgICA6IHVuZGVmaW5lZCxcbiAgICAgcG9zaXRpb246IFwibGVmdFwiLFxuICAgICBidXR0b246IG51bGxcbn0pXG4iLCJcblxuZXhwb3J0IHsgZGVmaW5lQXNwZWN0LCBnZXRBc3BlY3QsIHNldEFzcGVjdCB9IGZyb20gXCIuL2RiLmpzXCJcblxuZXhwb3J0IHsgR2VvbWV0cnkgfSBmcm9tIFwiLi9nZW9tZXRyeS5qc1wiXG5leHBvcnQgeyBTaGFwZSB9IGZyb20gXCIuL0VsZW1lbnQvc2hhcGUuanNcIlxuZXhwb3J0IHsgTm90ZSB9ICAgICAgZnJvbSBcIi4vRWxlbWVudC9ub3RlLmpzXCJcbmV4cG9ydCB7IEJhZGdlIH0gICAgIGZyb20gXCIuL0VsZW1lbnQvYmFkZ2UuanNcIlxuZXhwb3J0IHsgQ29udGFpbmVyIH0gZnJvbSBcIi4vRWxlbWVudC9ncm91cC5qc1wiXG5cblxuaW1wb3J0IHsgbm9kZSB9IGZyb20gXCIuLi9kYXRhLmpzXCJcbmltcG9ydCB7IGdldEFzcGVjdCwgZGVmaW5lQXNwZWN0LCBzZXRBc3BlY3QgfSBmcm9tIFwiLi9kYi5qc1wiXG5pbXBvcnQgeyBTaGFwZSB9IGZyb20gXCIuL0VsZW1lbnQvc2hhcGUuanNcIlxuaW1wb3J0IHsgQ29udGFpbmVyIH0gZnJvbSBcIi4vRWxlbWVudC9ncm91cC5qc1wiXG5pbXBvcnQgeyBCYWRnZSB9ICAgICBmcm9tIFwiLi9FbGVtZW50L2JhZGdlLmpzXCJcbmltcG9ydCB7IGNvbW1hbmQgfSBmcm9tIFwiLi4vLi4vVWkvaW5kZXguanNcIlxuXG5cbmRlZmluZUFzcGVjdCAoIFNoYXBlICAgICwgXCJwZXJzb25cIiAvKiAsIHsgb25DcmVhdGU6ICgpID0+IC4uLiwgb25Ub3VjaDogKCkgPT4gLi4uIH0gKi8gKVxuZGVmaW5lQXNwZWN0ICggQ29udGFpbmVyLCBcInNraWxsXCIgKVxuZGVmaW5lQXNwZWN0ICggQmFkZ2UgICAgLCBcImJhZGdlXCIgKVxuXG5zZXRBc3BlY3QgPCRTaGFwZT4gKHtcbiAgICAgdHlwZSAgIDogXCJwZXJzb25cIixcbiAgICAgaWQgICAgIDogdW5kZWZpbmVkLFxuXG4gICAgIGRhdGEgICA6IHVuZGVmaW5lZCxcblxuICAgICBzaGFwZSAgOiBcImNpcmNsZVwiLFxuXG4gICAgIHg6IDAsXG4gICAgIHk6IDAsXG5cbiAgICAgbWluU2l6ZSAgICA6IDMwLFxuICAgICBzaXplRmFjdG9yOiAxLFxuICAgICBzaXplT2Zmc2V0OiAwLFxuXG4gICAgIGJvcmRlckNvbG9yICAgICA6IFwiIzAwYzBhYVwiLFxuICAgICBib3JkZXJXaWR0aCAgICAgOiA0LFxuICAgICBiYWNrZ3JvdW5kQ29sb3IgOiBcInRyYW5zcGFyZW50XCIsXG4gICAgIGJhY2tncm91bmRJbWFnZSA6IHVuZGVmaW5lZCxcbiAgICAgYmFja2dyb3VuZFJlcGVhdDogZmFsc2UsXG5cbiAgICAgb25DcmVhdGUgICA6ICggcGVyc29uOiAkUGVyc29uLCBhc3BlY3QgKSA9PlxuICAgICB7XG4gICAgICAgICAgYXNwZWN0LnNldEJhY2tncm91bmQgKHtcbiAgICAgICAgICAgICAgIGJhY2tncm91bmRJbWFnZTogcGVyc29uLmF2YXRhcixcbiAgICAgICAgICAgICAgIHNoYXBlOiBwZXJzb24uaXNDYXB0YWluID8gXCJzcXVhcmVcIiA6IFwiY2lyY2xlXCIsXG4gICAgICAgICAgfSBhcyBhbnkpXG4gICAgIH0sXG4gICAgIG9uRGVsZXRlOiB1bmRlZmluZWQsXG4gICAgIG9uVG91Y2g6IHVuZGVmaW5lZCxcbn0pXG5cbnNldEFzcGVjdCA8JFNoYXBlPiAoe1xuICAgICB0eXBlICAgOiBcInNraWxsXCIsXG4gICAgIGlkICAgICA6IHVuZGVmaW5lZCxcblxuICAgICBkYXRhOiB1bmRlZmluZWQsXG5cbiAgICAgc2hhcGU6IFwiY2lyY2xlXCIsXG4gICAgIHg6IDAsXG4gICAgIHk6IDAsXG5cbiAgICAgYm9yZGVyQ29sb3IgICAgIDogXCIjZjFiYzMxXCIsXG4gICAgIGJvcmRlcldpZHRoICAgICA6IDgsXG4gICAgIGJhY2tncm91bmRDb2xvciA6IFwiI0ZGRkZGRlwiLFxuICAgICBiYWNrZ3JvdW5kSW1hZ2UgOiB1bmRlZmluZWQsXG4gICAgIGJhY2tncm91bmRSZXBlYXQ6IGZhbHNlLFxuICAgICBtaW5TaXplICAgICAgICAgOiA1MCxcbiAgICAgc2l6ZU9mZnNldCAgICAgIDogMTAsXG4gICAgIHNpemVGYWN0b3IgICAgICA6IDEsXG5cbiAgICAgb25DcmVhdGUgKCBza2lsbDogJFNraWxsLCBhc3BlY3QgKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgZGF0YSA9IG5vZGUgPCRCYWRnZT4gKCBcImJhZGdlXCIsIHNraWxsLmljb24gKVxuICAgICAgICAgIGNvbnN0IGJhZGdlID0gZ2V0QXNwZWN0IDxCYWRnZT4gKCBkYXRhIClcblxuICAgICAgICAgIGJhZGdlLmF0dGFjaCAoIGFzcGVjdCApXG4gICAgIH0sXG5cbiAgICAgb25Ub3VjaCAoIHNoYXBlIClcbiAgICAge1xuICAgICAgICAgIGNvbW1hbmQgKCBcIm9wZW4taW5mb3MtcGFuZWxcIiApLnJ1biAoKVxuICAgICB9LFxuXG4gICAgIG9uRGVsZXRlOiB1bmRlZmluZWRcbn0pXG5cbnNldEFzcGVjdCA8JFNoYXBlPiAoe1xuICAgICB0eXBlICAgOiBcImJhZGdlXCIsXG4gICAgIGlkICAgICA6IHVuZGVmaW5lZCxcblxuICAgICBkYXRhOiB1bmRlZmluZWQsXG5cbiAgICAgeCAgICAgICAgIDogMCxcbiAgICAgeSAgICAgICAgIDogMCxcbiAgICAgbWluU2l6ZSAgIDogMSxcbiAgICAgc2l6ZUZhY3RvcjogMSxcbiAgICAgc2l6ZU9mZnNldDogMCxcblxuICAgICBzaGFwZSAgICAgICAgICAgOiBcImNpcmNsZVwiLFxuICAgICBib3JkZXJDb2xvciAgICAgOiBcImdyYXlcIixcbiAgICAgYm9yZGVyV2lkdGggICAgIDogMCxcblxuICAgICBiYWNrZ3JvdW5kQ29sb3IgOiBcInRyYW5zcGFyZW50XCIsXG4gICAgIGJhY2tncm91bmRJbWFnZSA6IHVuZGVmaW5lZCxcbiAgICAgYmFja2dyb3VuZFJlcGVhdDogZmFsc2UsXG5cbiAgICAgb25DcmVhdGUgICAgICAgIDogdW5kZWZpbmVkLFxuICAgICBvbkRlbGV0ZSAgICAgICAgOiB1bmRlZmluZWQsXG4gICAgIG9uVG91Y2ggICAgICAgICA6IHVuZGVmaW5lZCxcbn0pXG4iLCJcbmltcG9ydCBcIi4uL0xpYi9pbmRleC5qc1wiXG5pbXBvcnQgXCIuLi9EYXRhL2luZGV4LmpzXCJcblxuaW1wb3J0IFwiLi9Bc3BlY3QvaW5kZXguanNcIlxuaW1wb3J0IHsgZ2V0QXNwZWN0IH0gZnJvbSBcIi4vQXNwZWN0L2RiLmpzXCJcblxuZXhwb3J0ICogZnJvbSBcIi4vZGF0YS5qc1wiXG5pbXBvcnQgKiBhcyBkYiAgZnJvbSBcIi4vZGF0YS5qc1wiXG5cbmltcG9ydCAqIGFzIHVpIGZyb20gXCIuLi9VaS9pbmRleC5qc1wiXG5jb25zdCBjb21tYW5kID0gdWkuY29tbWFuZFxuXG4vLyAjcmVnaW9uIERSQVdJTkcgQVJFQVxuXG5leHBvcnQgY29uc3QgYXJlYSA9ICAoKCkgPT5cbntcbiAgICAgY29uc3QgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCAoIFwiY2FudmFzXCIgKVxuXG4gICAgIGNhbnZhcy53aWR0aCAgPSBkb2N1bWVudC5ib2R5LmNsaWVudFdpZHRoXG4gICAgIGNhbnZhcy5oZWlnaHQgPSBkb2N1bWVudC5ib2R5LmNsaWVudEhlaWdodFxuXG4gICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kICggY2FudmFzIClcblxuICAgICByZXR1cm4gbmV3IHVpLkFyZWEgKCBjYW52YXMgKVxufSkgKClcblxuZXhwb3J0IGNvbnN0IGNvbnRleHR1YWxNZW51ID0gbmV3IHVpLlJhZGlhbE1lbnUgKHtcbiAgICAgY29udGV4dDogXCJjb25jZXB0LXVpXCIsXG4gICAgIHR5cGU6IFwicmFkaWFsLW1lbnVcIixcbiAgICAgaWQ6IFwiYXJlYS1tZW51XCIsXG4gICAgIGJ1dHRvbnM6IFtcbiAgICAgICAgICAvL3sgdHlwZTogXCJidXR0b25cIiwgaWQ6IFwiYWRkLXRoaW5nXCIgLCB0ZXh0OiBcIlwiLCBpY29uOiBcIiYjeGUzYzg7XCIsIGZvbnRGYW1pbHk6IFwiTWF0ZXJpYWwgSWNvbnNcIiwgY2FsbGJhY2s6ICgpID0+IHsgcnVuQ29tbWFuZCAoIFwiem9vbS1leHRlbmRzXCIgKSB9IH0sIC8vIGRldGFpbHNcbiAgICAgICAgICB7IHR5cGU6IFwiYnV0dG9uXCIsIGlkOiBcImFkZC10aGluZ1wiICwgdGV4dDogXCJcIiwgaWNvbjogXCImI3hlM2M4O1wiLCBmb250RmFtaWx5OiBcIk1hdGVyaWFsIEljb25zXCIgfSwgLy8gZGV0YWlsc1xuICAgICAgICAgIHsgdHlwZTogXCJidXR0b25cIiwgaWQ6IFwiYWRkLWJ1YmJsZVwiLCB0ZXh0OiBcIlwiLCBpY29uOiBcIiYjeGU2ZGQ7XCIsIGZvbnRGYW1pbHk6IFwiTWF0ZXJpYWwgSWNvbnNcIiB9LFxuICAgICAgICAgIHsgdHlwZTogXCJidXR0b25cIiwgaWQ6IFwiYWRkLW5vdGVcIiAgLCB0ZXh0OiBcIlwiLCBpY29uOiBcIiYjeGUyNDQ7XCIsIGZvbnRGYW1pbHk6IFwiTWF0ZXJpYWwgSWNvbnNcIiwgY29tbWFuZDogXCJwYWNrLXZpZXdcIiB9LCAvLyBmb3JtYXRfcXVvdGVcbiAgICAgICAgICB7IHR5cGU6IFwiYnV0dG9uXCIsIGlkOiBcImFkZC1wZW9wbGVcIiwgdGV4dDogXCJcIiwgaWNvbjogXCImI3hlODdjO1wiLCBmb250RmFtaWx5OiBcIk1hdGVyaWFsIEljb25zXCIgfSwgLy8gZmFjZVxuICAgICAgICAgIHsgdHlwZTogXCJidXR0b25cIiwgaWQ6IFwiYWRkLXRhZ1wiICAgLCB0ZXh0OiBcIlwiLCBpY29uOiBcIiYjeGU4Njc7XCIsIGZvbnRGYW1pbHk6IFwiTWF0ZXJpYWwgSWNvbnNcIiB9LCAvLyBib29rbWFya19ib3JkZXJcbiAgICAgXSBhcyBhbnksXG4gICAgIHJvdGF0aW9uOiBNYXRoLlBJLzIsXG59KVxuZG9jdW1lbnQuYm9keS5hcHBlbmQgKCAuLi4gY29udGV4dHVhbE1lbnUuZ2V0SHRtbCAoKSApXG5cbi8vIEFyZWEgZXZlbnRzXG5cbmFyZWEub25Eb3VibGVUb3VjaE9iamVjdCA9ICggc2hhcGUgKSA9Plxue1xuICAgICBpZiAoIHNoYXBlLmNvbmZpZy5vblRvdWNoICE9IHVuZGVmaW5lZCApXG4gICAgICAgICAgc2hhcGUuY29uZmlnLm9uVG91Y2ggKCBzaGFwZSApXG59XG5cbmFyZWEub25Ub3VjaEFyZWEgPSAoIHgsIHkgKSA9Plxue1xuICAgICBjb21tYW5kICggXCJvcGVuLWNvbnRleHRhbC1tZW51XCIgKS5ydW4gKClcbiAgICAgLy9ydW4gQ29tbWFuZCAoIFwib3Blbi1jb250ZXh0YWwtbWVudVwiLCB4LCB5IClcbn1cblxuYXJlYS5vbk92ZXJPYmplY3QgPSAoIHNoYXBlICkgPT5cbntcbiAgICAgc2hhcGUuaG92ZXIgKCB0cnVlIClcbiAgICAgYXJlYS5mY2FudmFzLnJlcXVlc3RSZW5kZXJBbGwgKClcbn1cblxuYXJlYS5vbk91dE9iamVjdCA9ICggc2hhcGUgKSA9Plxue1xuICAgICBzaGFwZS5ob3ZlciAoIGZhbHNlIClcbiAgICAgYXJlYS5mY2FudmFzLnJlcXVlc3RSZW5kZXJBbGwgKClcbn1cblxuLy8gQXJlYSBjb21tYW5kc1xuXG5jb21tYW5kICggXCJvcGVuLWNvbnRleHRhbC1tZW51XCIsICggZTogZmFicmljLklFdmVudCApID0+XG57XG4gICAgIGNvbnRleHR1YWxNZW51LnNob3cgKCBlLnBvaW50ZXIueCwgZS5wb2ludGVyLnkgKVxufSApXG5cbmNvbW1hbmQgKCBcImNsb3NlLWNvbnRleHRhbC1tZW51XCIsICgpID0+XG57XG4gICAgIGNvbnRleHR1YWxNZW51LmhpZGUgKClcbn0pXG5cbmNvbW1hbmQgKCBcImFkZC1za2lsbFwiLCAoIHRpdGxlICkgPT5cbntcbiAgICAgY29uc29sZS5sb2cgKCBcIkFkZCBza2lsbFwiIClcbn0pXG5cbmNvbW1hbmQgKCBcImFkZC1wZXJzb25cIiwgKCBuYW1lICkgPT5cbntcblxufSlcblxuY29tbWFuZCAoIFwiem9vbS1leHRlbmRzXCIsICgpID0+XG57XG4gICAgIGFyZWEuem9vbSAoKVxufSlcblxuY29tbWFuZCAoIFwiem9vbS10b1wiLCAoIHNoYXBlICkgPT5cbntcbiAgICAgLy8gYXJlYS56b29tICggc2hhcGUgKVxuICAgICAvLyBhcmVhLmlzb2xhdGUgKCBzaGFwZSApXG59KVxuXG5jb21tYW5kICggXCJwYWNrLXZpZXdcIiwgKCkgPT5cbntcbiAgICAgYXJlYS5wYWNrICgpXG59KVxuXG4vLyB0ZXN0XG5cbmlmICggbmF2aWdhdG9yLm1heFRvdWNoUG9pbnRzID4gMCApXG57XG5cbiAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIgKCBcInBvaW50ZXJtb3ZlXCIsIGV2ZW50ID0+XG4gICAgIHtcbiAgICAgICAgICAvL2NvbnN0IHRhcmdldCA9IGFyZWEuZmNhbnZhcy5maW5kVGFyZ2V0ICggZXZlbnQsIHRydWUgKVxuICAgICAgICAgIC8vaWYgKCB0YXJnZXQgKVxuICAgICAgICAgIC8vICAgICBjb25zb2xlLmxvZyAoIHRhcmdldCApXG4gICAgIH0pXG59XG5lbHNlXG57XG4gICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyICggXCJtb3VzZW1vdmVcIiwgZXZlbnQgPT5cbiAgICAge1xuICAgICAgICAgIC8vY29uc3QgdGFyZ2V0ID0gYXJlYS5mY2FudmFzLmZpbmRUYXJnZXQgKCBldmVudCwgdHJ1ZSApXG4gICAgICAgICAgLy9pZiAoIHRhcmdldCApXG4gICAgICAgICAgLy8gICAgIGNvbnNvbGUubG9nICggdGFyZ2V0IClcbiAgICAgfSlcbn1cblxuLy8gI2VuZHJlZ2lvblxuXG4vLyAjcmVnaW9uIE1FTlVcblxuZXhwb3J0IGNvbnN0IG1lbnUgPSB1aS5tYWtlIDx1aS5TaWRlTWVudSwgJFNpZGVNZW51PiAoe1xuICAgICBjb250ZXh0ICAgICAgOiBDT05URVhUX1VJLFxuICAgICB0eXBlICAgICAgICAgOiBcInNpZGUtbWVudVwiLFxuICAgICBpZCAgICAgICAgICAgOiBcIm1lbnVcIixcbiAgICAgaGFzTWFpbkJ1dHRvbjogdHJ1ZSxcbiAgICAgZGlyZWN0aW9uICAgIDogXCJidFwiXG59KVxuZG9jdW1lbnQuYm9keS5hcHBlbmQgKCAuLi4gbWVudS5nZXRIdG1sICgpIClcblxuLy8gI2VuZHJlZ2lvblxuXG4vLyAjcmVnaW9uIFBBTkVMXG5cbnZhciBkaXJlY3Rpb24gPSBcInJsXCIgYXMgXCJybFwiIHwgXCJsclwiIHwgXCJ0YlwiIHwgXCJidFwiXG5cbmV4cG9ydCBjb25zdCBwYW5lbCA9IHVpLm1ha2UgPHVpLlNpZGVNZW51LCAkU2lkZU1lbnU+ICh7XG4gICAgIGNvbnRleHQgICAgICA6IENPTlRFWFRfVUksXG4gICAgIHR5cGUgICAgICAgICA6IFwic2lkZS1tZW51XCIsXG4gICAgIGlkICAgICAgICAgICA6IHVuZGVmaW5lZCxcbiAgICAgZGlyZWN0aW9uICAgIDogZGlyZWN0aW9uLFxuICAgICBoYXNNYWluQnV0dG9uOiB0cnVlLFxuXG4gICAgIGJ1dHRvbnM6IFt7XG4gICAgICAgICAgY29udGV4dCA6IENPTlRFWFRfVUksXG4gICAgICAgICAgdHlwZSAgICA6IFwiYnV0dG9uXCIsXG4gICAgICAgICAgaWQgICAgICA6IFwiY29uc29sZVwiLFxuICAgICAgICAgIGljb24gICAgOiBcIuKaoFwiLFxuICAgICAgICAgIHRleHQgICAgOiBcIlwiLFxuICAgICAgICAgIGhhbmRsZU9uOiBcIipcIixcbiAgICAgICAgICBjb21tYW5kIDogXCJwYWNrLXZpZXdcIlxuICAgICB9XSxcblxuICAgICBjaGlsZHJlbjogW3tcbiAgICAgICAgICBjb250ZXh0IDogQ09OVEVYVF9VSSxcbiAgICAgICAgICB0eXBlICAgIDogXCJza2lsbC12aWV3ZXJcIixcbiAgICAgICAgICBpZCAgICAgIDogXCJzbGlkZS1za2lsbFwiLFxuICAgICAgICAgIHBvc2l0aW9uOiBcImxlZnRcIixcbiAgICAgICAgICBidXR0b24gOiB7XG4gICAgICAgICAgICAgICBjb250ZXh0IDogQ09OVEVYVF9VSSxcbiAgICAgICAgICAgICAgIHR5cGUgICAgOiBcImJ1dHRvblwiLFxuICAgICAgICAgICAgICAgaWQgICAgICA6IFwic2tpbGxzXCIsXG4gICAgICAgICAgICAgICBpY29uICAgIDogXCJcIixcbiAgICAgICAgICAgICAgIHRleHQgICAgOiBcIlNraWxsc1wiLFxuICAgICAgICAgICAgICAgaGFuZGxlT246IFwiKlwiLFxuICAgICAgICAgIH0sXG4gICAgIH0se1xuICAgICAgICAgIGNvbnRleHQgOiBDT05URVhUX1VJLFxuICAgICAgICAgIHR5cGUgICAgOiBcInBlcnNvbi12aWV3ZXJcIixcbiAgICAgICAgICBpZCAgICAgIDogXCJzbGlkZS1wZXJzb25cIixcbiAgICAgICAgICBwb3NpdGlvbjogXCJsZWZ0XCIsXG4gICAgICAgICAgYnV0dG9uIDoge1xuICAgICAgICAgICAgICAgY29udGV4dCA6IENPTlRFWFRfVUksXG4gICAgICAgICAgICAgICB0eXBlICAgIDogXCJidXR0b25cIixcbiAgICAgICAgICAgICAgIGlkICAgICAgOiBcInByb3BlcnRpZXNcIixcbiAgICAgICAgICAgICAgIGljb24gICAgOiBcIlwiLFxuICAgICAgICAgICAgICAgdGV4dCAgICA6IFwiUHJvcGVydGllc1wiLFxuICAgICAgICAgICAgICAgaGFuZGxlT246IFwiKlwiLFxuICAgICAgICAgIH0sXG4gICAgIH1dXG59KVxuXG5kb2N1bWVudC5ib2R5LmFwcGVuZCAoIC4uLiBwYW5lbC5nZXRIdG1sICgpIClcblxuLy8gUGFubmVscyBjb21tYW5kc1xuXG5jb25zdCBzbGlkZUluZm9zID0gdWkucGljayA8dWkuU2tpbGxWaWV3ZXI+ICggXCJza2lsbC12aWV3ZXJcIiwgXCJzbGlkZS1za2lsbFwiIClcblxuY29tbWFuZCAoIFwib3Blbi1wYW5lbFwiLCAoIG5hbWUsIC4uLiBjb250ZW50ICkgPT5cbntcbiAgICAgLy8gaWYgKCBuYW1lIClcbiAgICAgLy8gICAgICBzbGlkZXNob3cuc2hvdyAoIG5hbWUsIC4uLiBjb250ZW50IClcbiAgICAgLy8gZWxzZVxuICAgICAvLyAgICAgIHBhbmVsLm9wZW4gKClcbn0pXG5cbmNvbW1hbmQgKCBcIm9wZW4taW5mb3MtcGFuZWxcIiwgKCBlICkgPT5cbntcbiAgICAgY29uc3QgYXNwZWN0ID0gZ2V0QXNwZWN0ICggdWkuQXJlYS5jdXJyZW50RXZlbnQudGFyZ2V0IClcblxuICAgICBpZiAoIGFzcGVjdCApXG4gICAgIHtcbiAgICAgICAgICBjb25zdCBza2lsbCA9IGRiLm5vZGUgKCBhc3BlY3QuY29uZmlnLnR5cGUsIGFzcGVjdC5jb25maWcuaWQgKVxuICAgICAgICAgIGlmICggc2tpbGwgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHNsaWRlSW5mb3MuZGlzcGxheSAoIHNraWxsIGFzIGFueSApXG4gICAgICAgICAgICAgICBwYW5lbC5vcGVuICgpXG4gICAgICAgICAgfVxuICAgICB9XG59KVxuXG5jb21tYW5kICggXCJjbG9zZS1wYW5lbFwiICwgKCkgPT5cbntcbiAgICAgcGFuZWwuY2xvc2UgKClcbn0pXG5cbi8vICNlbmRyZWdpb25cblxuLy8gI3JlZ2lvbiBBUFBMSUNBVElPTlxuXG5jb21tYW5kICggXCJvcGVuLW1lbnVcIiwgKCkgPT5cbntcbiAgICAgcGFuZWwuY2xvc2UgKClcbiAgICAgY29udGV4dHVhbE1lbnUuaGlkZSAoKVxufSlcbmNvbW1hbmQgKCBcIm9wZW4tcGFuZWxcIiwgKCkgPT5cbntcbiAgICAgbWVudS5jbG9zZSAoKVxuICAgICBjb250ZXh0dWFsTWVudS5oaWRlICgpXG59KVxuXG5leHBvcnQgZnVuY3Rpb24gd2lkdGggKClcbntcbiAgICAgcmV0dXJuIGFyZWEuZmNhbnZhcy5nZXRXaWR0aCAoKVxufVxuXG5leHBvcnQgZnVuY3Rpb24gaGVpZ2h0ICgpXG57XG4gICAgIHJldHVybiBhcmVhLmZjYW52YXMuZ2V0SGVpZ2h0ICgpXG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZWZyZXNoICgpXG57XG4gICAgIC8vJGFyZWEuc2V0Wm9vbSAoMC4xKVxuICAgICBhcmVhLmZjYW52YXMucmVxdWVzdFJlbmRlckFsbCAoKVxufVxuXG4vLyAjZW5kcmVnaW9uXG4iLCIvLy8gPHJlZmVyZW5jZSB0eXBlcz1cImZha2VyXCIgLz5cbmRlY2xhcmUgY29uc3QgZmFrZXI6IEZha2VyLkZha2VyU3RhdGljXG5cbmltcG9ydCAqIGFzIGFwcCBmcm9tIFwiLi4vQXBwbGljYXRpb24vaW5kZXguanNcIlxuXG5jb25zdCByYW5kb21JbnQgPSAobWluOiBudW1iZXIsIG1heDogbnVtYmVyKSA9Plxue1xuICAgICByZXR1cm4gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogKG1heCAtIG1pbiArIDEpKSArIG1pbjtcbn1cblxuY29uc3QgYXJlYSA9IGFwcC5hcmVhXG5jb25zdCB2aWV3ID0gYXJlYS5jcmVhdGVWaWV3ICggXCJjb21ww6l0YW5jZXNcIiApXG5hcmVhLnVzZSAoIHZpZXcgKVxuXG4vLyBJY2kgb24gYWpvdXRlIGRlcyBwZXJzb25uZXMgw6AgbOKAmWFwcGxpY2F0aW9uLlxuXG5jb25zdCBwZXJzb25OYW1lcyA9IFtdXG5mb3IgKCB2YXIgaSA9IDEgOyBpIDw9IDIwIDsgaSsrIClcbntcbiAgICAgYXBwLm5vZGUgPCRQZXJzb24+ICh7XG4gICAgICAgICAgY29udGV4dCAgOiBDT05URVhUX0RBVEEsXG4gICAgICAgICAgdHlwZSAgICAgOiBcInBlcnNvblwiLFxuICAgICAgICAgIGlkICAgICAgIDogXCJ1c2VyXCIgKyBpLFxuICAgICAgICAgIGZpcnN0TmFtZTogZmFrZXIubmFtZS5maXJzdE5hbWUgKCksXG4gICAgICAgICAgbGFzdE5hbWUgOiBmYWtlci5uYW1lLmxhc3ROYW1lICgpLFxuICAgICAgICAgIGF2YXRhciAgIDogYC4vYXZhdGFycy9mICgke2l9KS5qcGdgLFxuICAgICAgICAgIGlzQ2FwdGFpbjogcmFuZG9tSW50ICgwLDQpID09IDEgLy9pICUgNCA9PSAwLFxuICAgICB9KVxuXG4gICAgIGFwcC5ub2RlIDwkUGVyc29uPiAoe1xuICAgICAgICAgIGNvbnRleHQgIDogQ09OVEVYVF9EQVRBLFxuICAgICAgICAgIHR5cGUgICAgIDogXCJwZXJzb25cIixcbiAgICAgICAgICBpZCAgICAgICA6IFwidXNlclwiICsgKDIwICsgaSksXG4gICAgICAgICAgZmlyc3ROYW1lOiBmYWtlci5uYW1lLmZpcnN0TmFtZSAoKSxcbiAgICAgICAgICBsYXN0TmFtZSA6IGZha2VyLm5hbWUubGFzdE5hbWUgKCksXG4gICAgICAgICAgYXZhdGFyICAgOiBgLi9hdmF0YXJzL2ggKCR7aX0pLmpwZ2AsXG4gICAgICAgICAgaXNDYXB0YWluOiByYW5kb21JbnQgKDAsNCkgPT0gMSAvLyAoMjAgKyBpKSAlIDQgPT0gMCxcbiAgICAgfSlcblxuICAgICBwZXJzb25OYW1lcy5wdXNoICggXCJ1c2VyXCIgKyBpLCBcInVzZXJcIiArICgyMCArIGkpIClcblxuICAgICAvLyBhcmVhLmFkZCAoIFwicGVyc29uXCIsIFwidXNlclwiICsgaSApXG4gICAgIC8vIGFyZWEuYWRkICggXCJwZXJzb25cIiwgXCJ1c2VyXCIgKyAoaSArIDIwKSApXG59XG5cbi8vIEJhZGdlc1xuXG4vLyBodHRwczovL2RyaXZlLmdvb2dsZS5jb20vZHJpdmUvZm9sZGVycy8xS3dXbDlHX0E4djkxTkxYQXBqWkdIQ2ZueF9tbmZNRTRcbi8vIGh0dHBzOi8vcmVjb25uYWl0cmUub3BlbnJlY29nbml0aW9uLm9yZy9yZXNzb3VyY2VzL1xuLy8gaHR0cHM6Ly93d3cubGV0dWRpYW50LmZyL2VkdWNwcm9zL2FjdHVhbGl0ZS9sZXMtb3Blbi1iYWRnZXMtdW4tY29tcGxlbWVudC1hdXgtZGlwbG9tZXMtdW5pdmVyc2l0YWlyZXMuaHRtbFxuXG4vLyBodHRwczovL3d3dy5lY2hvc2NpZW5jZXMtbm9ybWFuZGllLmZyL2NvbW11bmF1dGVzL2xlLWRvbWUvYXJ0aWNsZXMvYmFkZ2UtZG9tZVxuXG5jb25zdCBiYWRnZVByZXNldHMgPSB7IC8vIFBhcnRpYWwgPCRCYWRnZT5cbiAgICAgZGVmYXVsdCAgICAgICA6IHsgaWQ6IFwiZGVmYXVsdFwiICAgICAgLCBlbW9qaTogXCLwn6aBXCIgfSxcbiAgICAgaGF0ICAgICAgICAgICA6IHsgaWQ6IFwiaGF0XCIgICAgICAgICAgLCBlbW9qaTogXCLwn46pXCIgfSxcbiAgICAgc3RhciAgICAgICAgICA6IHsgaWQ6IFwic3RhclwiICAgICAgICAgLCBlbW9qaTogXCLirZBcIiB9LFxuICAgICBjbG90aGVzICAgICAgIDogeyBpZDogXCJjbG90aGVzXCIgICAgICAsIGVtb2ppOiBcIvCfkZVcIiB9LFxuICAgICBlY29sb2d5ICAgICAgIDogeyBpZDogXCJlY29sb2d5XCIgICAgICAsIGVtb2ppOiBcIvCfkqdcIiB9LFxuICAgICBwcm9ncmFtbWluZyAgIDogeyBpZDogXCJwcm9ncmFtbWluZ1wiICAsIGVtb2ppOiBcIvCfkr5cIiB9LFxuICAgICBjb21tdW5pY2F0aW9uIDogeyBpZDogXCJjb21tdW5pY2F0aW9uXCIsIGVtb2ppOiBcIvCfk6JcIiB9LFxuICAgICBjb25zdHJ1Y3Rpb24gIDogeyBpZDogXCJjb25zdHJ1Y3Rpb25cIiAsIGVtb2ppOiBcIvCflKhcIiB9LFxuICAgICBiaW9sb2d5ICAgICAgIDogeyBpZDogXCJiaW9sb2d5XCIgICAgICAsIGVtb2ppOiBcIvCflKxcIiB9LFxuICAgICByb2JvdGljICAgICAgIDogeyBpZDogXCJyb2JvdGljXCIgICAgICAsIGVtb2ppOiBcIvCfpJZcIiB9LFxuICAgICBnYW1lICAgICAgICAgIDogeyBpZDogXCJnYW1lXCIgICAgICAgICAsIGVtb2ppOiBcIvCfpKFcIiB9LFxuICAgICBtdXNpYyAgICAgICAgIDogeyBpZDogXCJtdXNpY1wiICAgICAgICAsIGVtb2ppOiBcIvCfpYFcIiB9LFxuICAgICBsaW9uICAgICAgICAgIDogeyBpZDogXCJsaW9uXCIgICAgICAgICAsIGVtb2ppOiBcIvCfpoFcIiB9LFxuICAgICB2b2x0YWdlICAgICAgIDogeyBpZDogXCJ2b2x0YWdlXCIgICAgICAsIGVtb2ppOiBcIuKaoVwiIH0sXG59XG5cbmZvciAoIGNvbnN0IG5hbWUgaW4gYmFkZ2VQcmVzZXRzIClcbiAgICAgYXBwLm5vZGUgKHsgY29udGV4dDogQ09OVEVYVF9EQVRBLCB0eXBlOiBcImJhZGdlXCIsIC4uLiBiYWRnZVByZXNldHMgW25hbWVdIH0pXG5cbi8vIFNraWxsc1xuXG5mb3IgKCBjb25zdCBuYW1lIGluIGJhZGdlUHJlc2V0cyApXG57XG4gICAgIGNvbnN0IHBlb3BsZSA9IFtdIGFzICRQZXJzb24gW11cblxuICAgICBmb3IgKCB2YXIgaiA9IHJhbmRvbUludCAoIDAsIDYgKSA7IGogPiAwIDsgai0tIClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IG5hbWUgPSBwZXJzb25OYW1lcy5zcGxpY2UgKCByYW5kb21JbnQgKCAxLCBwZXJzb25OYW1lcy5sZW5ndGggKSwgMSApIFswXVxuXG4gICAgICAgICAgaWYgKCBuYW1lIClcbiAgICAgICAgICAgICAgIHBlb3BsZS5wdXNoICggYXBwLm5vZGUgPCRQZXJzb24+ICggXCJwZXJzb25cIiwgbmFtZSApIClcbiAgICAgfVxuXG4gICAgIGFwcC5ub2RlIDwkU2tpbGw+ICh7XG4gICAgICAgICAgY29udGV4dDogQ09OVEVYVF9EQVRBLFxuICAgICAgICAgIHR5cGUgICA6IFwic2tpbGxcIixcbiAgICAgICAgICBpZCAgICAgOiBuYW1lLFxuICAgICAgICAgIGljb24gICA6IG5hbWUsXG4gICAgICAgICAgaXRlbXMgIDogcGVvcGxlXG4gICAgIH0pXG5cbn1cblxuLy9cblxuZm9yICggY29uc3QgbmFtZSBpbiBiYWRnZVByZXNldHMgKVxuICAgICBhcmVhLmFkZCAoIFwic2tpbGxcIiwgbmFtZSApXG5cbi8vIE5vdGVzXG5cbi8vIGNvbnN0IG5vdGUgPSAgbmV3IEIuTm90ZSAoe1xuLy8gICAgICB0ZXh0OiBcIkEgbm90ZSAuLi5cIixcbi8vIH0pXG4vLyBhcmVhLmFkZCAoIEFzcGVjdC5jcmVhdGUgKCBub3RlICkgKVxuXG5cbmFyZWEucGFjayAoKVxuYXJlYS56b29tICgpXG5cblxuLy8gQ2x1c3RlciAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy9cbi8vIGNvbnN0IHQxID0gbmV3IGZhYnJpYy5UZXh0Ym94ICggXCJFZGl0YWJsZSA/XCIsIHtcbi8vICAgICAgdG9wOiA1MCxcbi8vICAgICAgbGVmdDogMzAwLFxuLy8gICAgICBmb250U2l6ZTogMzAsXG4vLyAgICAgIHNlbGVjdGFibGU6IHRydWUsXG4vLyAgICAgIGVkaXRhYmxlOiB0cnVlLFxuLy8gICAgICBvcmlnaW5YOiBcImNlbnRlclwiLFxuLy8gICAgICBvcmlnaW5ZOiBcImNlbnRlclwiLFxuLy8gfSlcbi8vIGNvbnN0IHIxID0gbmV3IGZhYnJpYy5SZWN0ICh7XG4vLyAgICAgIHRvcCAgIDogMCxcbi8vICAgICAgbGVmdCAgOiAzMDAsXG4vLyAgICAgIHdpZHRoIDogNTAsXG4vLyAgICAgIGhlaWdodDogNTAsXG4vLyAgICAgIGZpbGwgIDogXCJibHVlXCIsXG4vLyAgICAgIHNlbGVjdGFibGU6IHRydWUsXG4vLyAgICAgIG9yaWdpblg6IFwiY2VudGVyXCIsXG4vLyAgICAgIG9yaWdpblk6IFwiY2VudGVyXCIsXG4vLyB9KVxuLy8gJGFwcC5fbGF5b3V0LmFyZWEuYWRkICh0MSlcbi8vICRhcHAuX2xheW91dC5hcmVhLmFkZCAocjEpXG4vLyB0MVtcImNsdXN0ZXJcIl0gPSBbIHIxIF1cbi8vIHIxW1wiY2x1c3RlclwiXSA9IFsgdDEgXVxuXG4iXSwibmFtZXMiOlsiTm9kZSIsIkZhY3RvcnkiLCJHZW9tZXRyeSIsImRiIiwiZGIubm9kZSIsIkdlb21ldHJ5LnBhY2tFbmNsb3NlIiwiZGVmYXVsdENvbmZpZyIsImRyYWdnYWJsZSIsIlVpLmRyYWdnYWJsZSIsIkNzcy5nZXRVbml0Iiwibm9kZSIsImFzcGVjdC5nZXRBc3BlY3QiLCJmYWN0b3J5Iiwibm9ybWFsaXplIiwiQ29udGFpbmVyIiwiU3ZnLmNyZWF0ZVN2Z1NoYXBlIiwiY29tbWFuZCIsInVpLmNvbW1hbmQiLCJ1aS5BcmVhIiwidWkuUmFkaWFsTWVudSIsInVpLm1ha2UiLCJ1aS5waWNrIiwiYXJlYSIsImFwcC5hcmVhIiwiYXBwLm5vZGUiXSwibWFwcGluZ3MiOiI7OzthQWdDZ0IscUJBQXFCLENBQUcsT0FBcUI7UUFFekQsTUFBTSxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsSUFBSSxDQUFBO1FBRTdCLE1BQU0sQ0FBQyxHQUFVLE9BQU8sQ0FBQyxDQUFDLElBQVcsRUFBRSxDQUFBO1FBQ3ZDLE1BQU0sS0FBSyxHQUFNLE9BQU8sQ0FBQyxLQUFLLElBQU8sRUFBRSxDQUFBO1FBQ3ZDLE1BQU0sUUFBUSxHQUFHLE9BQU8sQ0FBQyxRQUFRLElBQUksQ0FBQyxDQUFBO1FBRXRDLE1BQU0sTUFBTSxHQUFHLEVBQWEsQ0FBQTtRQUU1QixNQUFNLENBQUMsR0FBTyxDQUFDLEdBQUcsRUFBRSxHQUFHLEtBQUssQ0FBQTtRQUM1QixNQUFNLEtBQUssR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBRyxDQUFDLEdBQUcsR0FBRyxDQUFFLENBQUE7UUFDckMsTUFBTSxJQUFJLEdBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxLQUFLLENBQUE7UUFDM0IsTUFBTSxDQUFDLEdBQU8sSUFBSSxHQUFHLENBQUMsQ0FBQTtRQUV0QixLQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsS0FBSyxFQUFFLEVBQUUsQ0FBQyxFQUMvQjtZQUNJLE1BQU0sS0FBSyxHQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsUUFBUSxDQUFBO1lBQy9CLE1BQU0sTUFBTSxHQUFHLEtBQUssR0FBRyxDQUFDLEdBQUcsR0FBRyxDQUFBO1lBQzlCLE1BQU0sR0FBRyxHQUFNLEtBQUssR0FBRyxDQUFDLENBQUE7WUFFeEIsTUFBTSxDQUFDLElBQUksQ0FBRTtnQkFDVCxFQUFFLEVBQUssS0FBSztnQkFDWixDQUFDLEVBQU0sTUFBTTtnQkFDYixFQUFFLEVBQUssR0FBRztnQkFDVixDQUFDLEVBQU0sR0FBRyxDQUFFLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDO2dCQUMzQixDQUFDLEVBQU0sR0FBRyxDQUFFLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDO2dCQUMzQixLQUFLLEVBQUU7b0JBQ0gsRUFBRSxFQUFFLEdBQUcsQ0FBRSxLQUFLLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQztvQkFDdkIsRUFBRSxFQUFFLEdBQUcsQ0FBRSxLQUFLLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQztvQkFDdkIsRUFBRSxFQUFFLEdBQUcsQ0FBRSxHQUFHLENBQUMsR0FBSyxDQUFDLEdBQUcsQ0FBQztvQkFDdkIsRUFBRSxFQUFFLEdBQUcsQ0FBRSxHQUFHLENBQUMsR0FBSyxDQUFDLEdBQUcsQ0FBQztvQkFDdkIsTUFBTSxFQUFFLEtBQUs7aUJBQ2hCO2FBQ0osQ0FBQyxDQUFBO1NBQ0w7UUFFRCxNQUFNLE1BQU0sR0FBcUI7WUFDN0IsQ0FBQztZQUNELEtBQUs7WUFDTCxRQUFRO1lBQ1IsT0FBTyxFQUFFLE9BQU8sQ0FBQyxPQUFPLElBQUksQ0FBQztZQUM3QixFQUFFLEVBQU8sQ0FBQztZQUNWLEVBQUUsRUFBTyxDQUFDO1lBQ1YsS0FBSyxFQUFJLElBQUk7WUFDYixNQUFNLEVBQUcsSUFBSTtZQUNiLE1BQU07U0FDVCxDQUFBO1FBRUQsT0FBTyxNQUFNLENBQUE7SUFDakI7O0lDbEZBO0lBQ0E7SUFDQTtJQVNBLE1BQU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFBO0lBRW5DLFNBQVMsT0FBTyxDQUFPLEtBQVU7UUFFNUIsSUFBSSxDQUFDLEdBQUcsS0FBSyxDQUFDLE1BQU0sRUFDZixDQUFDLEVBQ0QsQ0FBUyxDQUFBO1FBRWQsT0FBUSxDQUFDLEVBQ1Q7WUFDSyxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRyxHQUFHLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQTtZQUM1QixDQUFDLEdBQUcsS0FBSyxDQUFFLENBQUMsQ0FBQyxDQUFBO1lBQ2IsS0FBSyxDQUFFLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBRSxDQUFDLENBQUMsQ0FBQTtZQUNyQixLQUFLLENBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFBO1NBQ2pCO1FBRUQsT0FBTyxLQUFLLENBQUE7SUFDakIsQ0FBQztBQUVELGFBQWdCLE9BQU8sQ0FBRyxPQUFpQjtRQUV0QyxPQUFPLEdBQUcsT0FBTyxDQUFHLEtBQUssQ0FBQyxJQUFJLENBQUUsT0FBTyxDQUFFLENBQUUsQ0FBQTtRQUUzQyxNQUFNLENBQUMsR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFBO1FBRXhCLElBQUksQ0FBQyxHQUFHLENBQUMsRUFDVCxDQUFDLEdBQUcsRUFBRSxFQUNOLENBQVMsRUFDVCxDQUFTLENBQUM7UUFFVixPQUFRLENBQUMsR0FBRyxDQUFDLEVBQ2I7WUFDSyxDQUFDLEdBQUcsT0FBTyxDQUFFLENBQUMsQ0FBQyxDQUFBO1lBRWYsSUFBSyxDQUFDLElBQUksWUFBWSxDQUFHLENBQUMsRUFBRSxDQUFDLENBQUUsRUFDL0I7Z0JBQ0ssQ0FBQyxFQUFFLENBQUE7YUFDUDtpQkFFRDtnQkFDSyxDQUFDLEdBQUcsV0FBVyxDQUFHLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQTtnQkFDeEIsQ0FBQyxHQUFHLFlBQVksQ0FBRyxDQUFDLENBQUUsQ0FBQTtnQkFDdEIsQ0FBQyxHQUFHLENBQUMsQ0FBQTthQUNUO1NBQ0w7UUFFRCxPQUFPLENBQUMsQ0FBQTtJQUNiLENBQUM7SUFFRCxTQUFTLFdBQVcsQ0FBRyxDQUFXLEVBQUUsQ0FBUztRQUV4QyxJQUFJLENBQVMsRUFDYixDQUFTLENBQUE7UUFFVCxJQUFLLGVBQWUsQ0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFFO1lBQ3hCLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQTs7UUFHZixLQUFNLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLEVBQzlCO1lBQ0ssSUFBSyxXQUFXLENBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDLENBQUMsQ0FBRTttQkFDMUIsZUFBZSxDQUFHLGFBQWEsQ0FBRyxDQUFDLENBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFFLEVBQUUsQ0FBQyxDQUFFLEVBQ25EO2dCQUNJLE9BQU8sQ0FBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUE7YUFDdEI7U0FDTDs7UUFHRCxLQUFNLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUNsQztZQUNLLEtBQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLEVBQ2xDO2dCQUNLLElBQUssV0FBVyxDQUFNLGFBQWEsQ0FBRyxDQUFDLENBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUMsQ0FBQyxDQUFLLEVBQUUsQ0FBQyxDQUFFO3VCQUN6RCxXQUFXLENBQU0sYUFBYSxDQUFHLENBQUMsQ0FBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQVMsRUFBRSxDQUFDLENBQUUsQ0FBQyxDQUFDLENBQUU7dUJBQzNELFdBQVcsQ0FBTSxhQUFhLENBQUcsQ0FBQyxDQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBUyxFQUFFLENBQUMsQ0FBRSxDQUFDLENBQUMsQ0FBRTt1QkFDM0QsZUFBZSxDQUFFLGFBQWEsQ0FBRyxDQUFDLENBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBRSxFQUFFLENBQUMsQ0FBRSxFQUN6RDtvQkFDSSxPQUFPLENBQUUsQ0FBQyxDQUFFLENBQUMsQ0FBRSxFQUFFLENBQUMsQ0FBRSxDQUFDLENBQUUsRUFBRSxDQUFDLENBQUUsQ0FBQztpQkFDakM7YUFDTDtTQUNMOztRQUdELE1BQU0sSUFBSSxLQUFLLENBQUM7SUFDckIsQ0FBQztJQUVELFNBQVMsV0FBVyxDQUFHLENBQVMsRUFBRSxDQUFTO1FBRXRDLE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQTtRQUNwQixNQUFNLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUE7UUFDcEIsTUFBTSxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFBO1FBRXBCLE9BQU8sRUFBRSxHQUFHLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQztJQUNsRCxDQUFDO0lBRUQsU0FBUyxZQUFZLENBQUcsQ0FBUyxFQUFFLENBQVM7UUFFdkMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksRUFDekIsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFDZCxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFBO1FBRWQsT0FBTyxFQUFFLEdBQUcsQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFBO0lBQ2pELENBQUM7SUFFRCxTQUFTLGVBQWUsQ0FBRyxDQUFTLEVBQUUsQ0FBVztRQUU1QyxLQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsRUFDbEM7WUFDSyxJQUFLLENBQUUsWUFBWSxDQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUU7Z0JBQzFCLE9BQU8sS0FBSyxDQUFBO1NBQ3JCO1FBQ0QsT0FBTyxJQUFJLENBQUE7SUFDaEIsQ0FBQztJQUVELFNBQVMsWUFBWSxDQUFHLENBQVc7UUFFOUIsUUFBUyxDQUFDLENBQUMsTUFBTTtZQUVaLEtBQUssQ0FBQyxFQUFFLE9BQU8sYUFBYSxDQUFFLENBQUMsQ0FBRSxDQUFDLENBQUMsQ0FBRSxDQUFBO1lBQ3JDLEtBQUssQ0FBQyxFQUFFLE9BQU8sYUFBYSxDQUFFLENBQUMsQ0FBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQyxDQUFDLENBQUUsQ0FBQTtZQUM1QyxLQUFLLENBQUMsRUFBRSxPQUFPLGFBQWEsQ0FBRSxDQUFDLENBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDLENBQUMsQ0FBRSxDQUFBO1NBQ3ZEO0lBQ04sQ0FBQztJQUVELFNBQVMsYUFBYSxDQUFHLENBQVM7UUFFN0IsT0FBTztZQUNGLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNOLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNOLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztTQUNWLENBQUM7SUFDUCxDQUFDO0lBRUQsU0FBUyxhQUFhLENBQUcsQ0FBUyxFQUFFLENBQVM7UUFFeEMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLEdBQUcsQ0FBQyxDQUFBO1FBQ2pDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxHQUFHLENBQUMsQ0FBQTtRQUVqQyxJQUFJLEdBQUcsR0FBRyxFQUFFLEdBQUcsRUFBRSxFQUNqQixHQUFHLEdBQUcsRUFBRSxHQUFHLEVBQUUsRUFDYixHQUFHLEdBQUcsRUFBRSxHQUFHLEVBQUUsRUFDYixDQUFDLEdBQUssSUFBSSxDQUFDLElBQUksQ0FBRSxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLENBQUUsQ0FBQztRQUV6QyxPQUFPO1lBQ0YsQ0FBQyxFQUFFLENBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxHQUFHLEdBQUcsQ0FBQyxHQUFHLEdBQUcsSUFBSyxDQUFDO1lBQ2xDLENBQUMsRUFBRSxDQUFFLEVBQUUsR0FBRyxFQUFFLEdBQUcsR0FBRyxHQUFHLENBQUMsR0FBRyxHQUFHLElBQUssQ0FBQztZQUNsQyxDQUFDLEVBQUUsQ0FBRSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsSUFBSyxDQUFDO1NBQzFCLENBQUM7SUFDUCxDQUFDO0lBRUQsU0FBUyxhQUFhLENBQUcsQ0FBUyxFQUFFLENBQVMsRUFBRSxDQUFTO1FBRW5ELE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxHQUFHLENBQUMsQ0FBQTtRQUNqQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsR0FBRyxDQUFDLENBQUE7UUFDakMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLEdBQUcsQ0FBQyxDQUFBO1FBRWpDLE1BQU0sRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQ1IsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQ1osRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQ1osRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQ1osRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQ1osRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBRVosRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxFQUNoQyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxFQUNyQyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxFQUVyQyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxFQUN0QixFQUFFLEdBQUcsQ0FBRSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEtBQU8sRUFBRSxHQUFHLENBQUMsQ0FBRSxHQUFHLEVBQUUsRUFDNUMsRUFBRSxHQUFHLENBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxJQUFLLEVBQUUsRUFDL0IsRUFBRSxHQUFHLENBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxF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
