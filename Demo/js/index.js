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
                    e = inStock(e) ? pick(e) : make(e);
                }
                children[e.data.id] = e;
                slot.append(...e.getHtml());
                new_child.push(e);
            }
            if (new_child.length > 0)
                this.onChildrenAdded(new_child);
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
    define(Slideshow, [CONTEXT_UI, "slideshow"]);
    define(Container$1, [CONTEXT_UI, "slide"]);

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
            if (data.header) {
                this.header = inStock(data.header)
                    ? pick(data.header)
                    : make(data.header);
                header.append(...this.header.getHtml());
            }
            if (data.hasMainButton) {
                const btn = xnode("span", { class: "side-menu-main-button" },
                    xnode("span", { class: "icon" }, "\u21D5"));
                this.main_button = btn;
                header.insertAdjacentElement("afterbegin", btn);
            }
            if (data.children) {
                for (const child of data.children) {
                    this.content = inStock(child) ? pick(child) : make(child);
                    content.append(...this.content.getHtml());
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
    define(SideMenu, [CONTEXT_UI, "side-menu"]);

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
        position: "left"
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
        position: "left"
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
        direction: "lr"
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
        header: {
            context: CONTEXT_UI,
            type: "toolbar",
            id: undefined,
            title: "Title ..",
            direction:  "tb" ,
            buttons: [{
                    context: CONTEXT_UI,
                    type: "button",
                    id: "console",
                    icon: "⚠",
                    text: "",
                    handleOn: "*",
                    command: "pack-view"
                }, {
                    context: CONTEXT_UI,
                    type: "button",
                    id: "properties",
                    icon: "",
                    text: "panel properties",
                    handleOn: "*",
                }]
        },
        children: [{
                context: CONTEXT_UI,
                type: "slideshow",
                id: "panel-slideshow",
                children: [{
                        context: CONTEXT_UI,
                        type: "skill-viewer",
                        id: "slide-skill",
                        position: "left"
                    }, {
                        context: CONTEXT_UI,
                        type: "person-viewer",
                        id: "slide-person",
                        position: "left"
                    }]
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzIjpbIi4uLy4uL0xpYi9nZW9tZXRyeS9kaXN0cmlidXRlLnRzIiwiLi4vLi4vTGliL2dlb21ldHJ5L2QzLWVuY2xvc2UudHMiLCIuLi8uLi9MaWIvZ2VvbWV0cnkvZDMtcGFjay50cyIsIi4uLy4uL0xpYi9jc3MvdW5pdC50cyIsIi4uLy4uL0RhdGEvbm9kZS50cyIsIi4uLy4uL0RhdGEvZGF0YS10cmVlLnRzIiwiLi4vLi4vRGF0YS9kYi50cyIsIi4uLy4uL0RhdGEvZmFjdG9yeS50cyIsIi4uLy4uL0FwcGxpY2F0aW9uL0FzcGVjdC9nZW9tZXRyeS50cyIsIi4uLy4uL0FwcGxpY2F0aW9uL0FzcGVjdC9FbGVtZW50L3NoYXBlLnRzIiwiLi4vLi4vQXBwbGljYXRpb24vQXNwZWN0L2RiLnRzIiwiLi4vLi4vQXBwbGljYXRpb24vZGF0YS50cyIsIi4uLy4uL0FwcGxpY2F0aW9uL0FzcGVjdC9FbGVtZW50L2JhZGdlLnRzIiwiLi4vLi4vQXBwbGljYXRpb24vQXNwZWN0L0VsZW1lbnQvZ3JvdXAudHMiLCIuLi8uLi9VaS9CYXNlL3hub2RlLnRzIiwiLi4vLi4vVWkvQmFzZS9kcmFnZ2FibGUudHMiLCIuLi8uLi9VaS9CYXNlL2RvbS50cyIsIi4uLy4uL1VpL0Jhc2UvZXhwZW5kYWJsZS50cyIsIi4uLy4uL1VpL0Jhc2Uvc3dpcGVhYmxlLnRzIiwiLi4vLi4vVWkvQ29tcG9uZW50L0FyZWEvYXJlYS50cyIsIi4uLy4uL1VpL2NvbW1hbmQudHMiLCIuLi8uLi9VaS9CYXNlL0NvbXBvbmVudC9pbmRleC50c3giLCIuLi8uLi9VaS9kYi50cyIsIi4uLy4uL1VpL0Jhc2UvQ29udGFpbmVyL2luZGV4LnRzeCIsIi4uLy4uL1VpL0NvbXBvbmVudC9CdXR0b24vaHRtbC50c3giLCIuLi8uLi9VaS9Db21wb25lbnQvQnV0dG9uL2luZGV4LnRzeCIsIi4uLy4uL1VpL0NvbXBvbmVudC9TbGlkZVNob3cvaW5kZXgudHN4IiwiLi4vLi4vVWkvQ29tcG9uZW50L1Rvb2xiYXIvaW5kZXgudHN4IiwiLi4vLi4vVWkvQmFzZS9zY3JvbGxhYmxlLnRzIiwiLi4vLi4vVWkvQ29tcG9uZW50L1NpZGVNZW51L2luZGV4LnRzeCIsIi4uLy4uL1VpL0Jhc2UvU3ZnL2luZGV4LnRzeCIsIi4uLy4uL1VpL0NvbXBvbmVudC9DaXJjdWxhck1lbnUvaW5kZXgudHN4IiwiLi4vLi4vVWkvQ29tcG9uZW50L1BhbmVsL3BlcnNvbi50c3giLCIuLi8uLi9VaS9Db21wb25lbnQvUGFuZWwvaW5kZXgudHN4IiwiLi4vLi4vVWkvQ29tcG9uZW50L1BhbmVsL3NraWxsLnRzeCIsIi4uLy4uL0FwcGxpY2F0aW9uL0FzcGVjdC9pbmRleC50cyIsIi4uLy4uL0FwcGxpY2F0aW9uL2luZGV4LnRzIiwiLi4vaW5kZXgudHMiXSwic291cmNlc0NvbnRlbnQiOlsiXG5cbmV4cG9ydCB0eXBlIFJhZGlhbE9wdGlvbiA9IHtcbiAgICByICAgICAgICA6IG51bWJlcixcbiAgICBjb3VudCAgICA6IG51bWJlcixcbiAgICBwYWRkaW5nPyA6IG51bWJlcixcbiAgICByb3RhdGlvbj86IG51bWJlcixcbn1cblxuZXhwb3J0IHR5cGUgUmFkaWFsRGVmaW5pdGlvbiA9IFJlcXVpcmVkIDxSYWRpYWxPcHRpb24+ICYge1xuICAgIGN4ICAgIDogbnVtYmVyLFxuICAgIGN5ICAgIDogbnVtYmVyLFxuICAgIHdpZHRoIDogbnVtYmVyLFxuICAgIGhlaWdodDogbnVtYmVyLFxuICAgIHBvaW50czogUGFydCBbXSxcbn1cblxudHlwZSBQYXJ0ID0ge1xuICAgIHggOiBudW1iZXJcbiAgICB5IDogbnVtYmVyXG4gICAgYSA6IG51bWJlclxuICAgIGExOiBudW1iZXJcbiAgICBhMjogbnVtYmVyXG4gICAgY2hvcmQ/OiB7XG4gICAgICAgIHgxICAgIDogbnVtYmVyXG4gICAgICAgIHkxICAgIDogbnVtYmVyXG4gICAgICAgIHgyICAgIDogbnVtYmVyXG4gICAgICAgIHkyICAgIDogbnVtYmVyXG4gICAgICAgIGxlbmd0aDogbnVtYmVyXG4gICAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0UmFkaWFsRGlzdHJpYnV0aW9uICggb3B0aW9uczogUmFkaWFsT3B0aW9uIClcbntcbiAgICBjb25zdCB7IFBJLCBjb3MsIHNpbiB9ID0gTWF0aFxuXG4gICAgY29uc3QgciAgICAgICAgPSBvcHRpb25zLnIgICAgICAgIHx8IDMwXG4gICAgY29uc3QgY291bnQgICAgPSBvcHRpb25zLmNvdW50ICAgIHx8IDEwXG4gICAgY29uc3Qgcm90YXRpb24gPSBvcHRpb25zLnJvdGF0aW9uIHx8IDBcblxuICAgIGNvbnN0IHBvaW50cyA9IFtdIGFzIFBhcnQgW11cblxuICAgIGNvbnN0IGEgICAgID0gMiAqIFBJIC8gY291bnRcbiAgICBjb25zdCBjaG9yZCA9IDIgKiByICogc2luICggYSAqIDAuNSApXG4gICAgY29uc3Qgc2l6ZSAgPSByICogNCArIGNob3JkXG4gICAgY29uc3QgYyAgICAgPSBzaXplIC8gMlxuXG4gICAgZm9yICggdmFyIGkgPSAwOyBpIDwgY291bnQ7ICsraSApXG4gICAge1xuICAgICAgICBjb25zdCBzdGFydCAgPSBhICogaSArIHJvdGF0aW9uXG4gICAgICAgIGNvbnN0IG1pZGRsZSA9IHN0YXJ0ICsgYSAqIDAuNVxuICAgICAgICBjb25zdCBlbmQgICAgPSBzdGFydCArIGFcblxuICAgICAgICBwb2ludHMucHVzaCAoe1xuICAgICAgICAgICAgYTEgICA6IHN0YXJ0LFxuICAgICAgICAgICAgYSAgICA6IG1pZGRsZSxcbiAgICAgICAgICAgIGEyICAgOiBlbmQsXG4gICAgICAgICAgICB4ICAgIDogY29zIChtaWRkbGUpICogciArIGMsXG4gICAgICAgICAgICB5ICAgIDogc2luIChtaWRkbGUpICogciArIGMsXG4gICAgICAgICAgICBjaG9yZDoge1xuICAgICAgICAgICAgICAgIHgxOiBjb3MgKHN0YXJ0KSAqIHIgKyBjLFxuICAgICAgICAgICAgICAgIHkxOiBzaW4gKHN0YXJ0KSAqIHIgKyBjLFxuICAgICAgICAgICAgICAgIHgyOiBjb3MgKGVuZCkgICAqIHIgKyBjLFxuICAgICAgICAgICAgICAgIHkyOiBzaW4gKGVuZCkgICAqIHIgKyBjLFxuICAgICAgICAgICAgICAgIGxlbmd0aDogY2hvcmRcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICB9XG5cbiAgICBjb25zdCByZXN1bHQ6IFJhZGlhbERlZmluaXRpb24gPSB7XG4gICAgICAgIHIsXG4gICAgICAgIGNvdW50LFxuICAgICAgICByb3RhdGlvbixcbiAgICAgICAgcGFkZGluZzogb3B0aW9ucy5wYWRkaW5nIHx8IDAsXG4gICAgICAgIGN4ICAgICA6IGMsXG4gICAgICAgIGN5ICAgICA6IGMsXG4gICAgICAgIHdpZHRoICA6IHNpemUsXG4gICAgICAgIGhlaWdodCA6IHNpemUsXG4gICAgICAgIHBvaW50c1xuICAgIH1cblxuICAgIHJldHVybiByZXN1bHRcbn1cbiIsIi8vIGh0dHBzOi8vb2JzZXJ2YWJsZWhxLmNvbS9AZDMvZDMtcGFja2VuY2xvc2U/Y29sbGVjdGlvbj1Ab2JzZXJ2YWJsZWhxL2FsZ29yaXRobXNcbi8vIGh0dHBzOi8vb2JzZXJ2YWJsZWhxLmNvbS9AZDMvY2lyY2xlLXBhY2tpbmdcbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9kMy9kMy1oaWVyYXJjaHkvYmxvYi9tYXN0ZXIvc3JjL3BhY2svZW5jbG9zZS5qc1xuXG5cbmV4cG9ydCB0eXBlIENpcmNsZSA9IHtcbiAgICAgeDogbnVtYmVyLFxuICAgICB5OiBudW1iZXIsXG4gICAgIHI6IG51bWJlclxufVxuXG5jb25zdCBzbGljZSA9IEFycmF5LnByb3RvdHlwZS5zbGljZVxuXG5mdW5jdGlvbiBzaHVmZmxlIDxUPiAoIGFycmF5OiBUW10gKVxue1xuICAgICB2YXIgbSA9IGFycmF5Lmxlbmd0aCxcbiAgICAgICAgICB0LFxuICAgICAgICAgIGk6IG51bWJlclxuXG4gICAgIHdoaWxlICggbSApXG4gICAgIHtcbiAgICAgICAgICBpID0gTWF0aC5yYW5kb20gKCkgKiBtLS0gfCAwXG4gICAgICAgICAgdCA9IGFycmF5IFttXVxuICAgICAgICAgIGFycmF5IFttXSA9IGFycmF5IFtpXVxuICAgICAgICAgIGFycmF5IFtpXSA9IHRcbiAgICAgfVxuXG4gICAgIHJldHVybiBhcnJheVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZW5jbG9zZSAoIGNpcmNsZXM6IENpcmNsZVtdIClcbntcbiAgICAgY2lyY2xlcyA9IHNodWZmbGUgKCBzbGljZS5jYWxsKCBjaXJjbGVzICkgKVxuXG4gICAgIGNvbnN0IG4gPSBjaXJjbGVzLmxlbmd0aFxuXG4gICAgIHZhciBpID0gMCxcbiAgICAgQiA9IFtdLFxuICAgICBwOiBDaXJjbGUsXG4gICAgIGU6IENpcmNsZTtcblxuICAgICB3aGlsZSAoIGkgPCBuIClcbiAgICAge1xuICAgICAgICAgIHAgPSBjaXJjbGVzIFtpXVxuXG4gICAgICAgICAgaWYgKCBlICYmIGVuY2xvc2VzV2VhayAoIGUsIHAgKSApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgaSsrXG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBCID0gZXh0ZW5kQmFzaXMgKCBCLCBwIClcbiAgICAgICAgICAgICAgIGUgPSBlbmNsb3NlQmFzaXMgKCBCIClcbiAgICAgICAgICAgICAgIGkgPSAwXG4gICAgICAgICAgfVxuICAgICB9XG5cbiAgICAgcmV0dXJuIGVcbn1cblxuZnVuY3Rpb24gZXh0ZW5kQmFzaXMgKCBCOiBDaXJjbGVbXSwgcDogQ2lyY2xlIClcbntcbiAgICAgdmFyIGk6IG51bWJlcixcbiAgICAgajogbnVtYmVyXG5cbiAgICAgaWYgKCBlbmNsb3Nlc1dlYWtBbGwgKCBwLCBCICkgKVxuICAgICAgICAgIHJldHVybiBbcF1cblxuICAgICAvLyBJZiB3ZSBnZXQgaGVyZSB0aGVuIEIgbXVzdCBoYXZlIGF0IGxlYXN0IG9uZSBlbGVtZW50LlxuICAgICBmb3IgKCBpID0gMDsgaSA8IEIubGVuZ3RoOyArK2kgKVxuICAgICB7XG4gICAgICAgICAgaWYgKCBlbmNsb3Nlc05vdCAoIHAsIEIgW2ldIClcbiAgICAgICAgICAmJiBlbmNsb3Nlc1dlYWtBbGwgKCBlbmNsb3NlQmFzaXMyICggQiBbaV0sIHAgKSwgQiApXG4gICAgICAgICAgKXtcbiAgICAgICAgICAgICAgIHJldHVybiBbIEJbaV0sIHAgXVxuICAgICAgICAgIH1cbiAgICAgfVxuXG4gICAgIC8vIElmIHdlIGdldCBoZXJlIHRoZW4gQiBtdXN0IGhhdmUgYXQgbGVhc3QgdHdvIGVsZW1lbnRzLlxuICAgICBmb3IgKCBpID0gMDsgaSA8IEIubGVuZ3RoIC0gMTsgKytpIClcbiAgICAge1xuICAgICAgICAgIGZvciAoIGogPSBpICsgMTsgaiA8IEIubGVuZ3RoOyArK2ogKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGlmICggZW5jbG9zZXNOb3QgICAgKCBlbmNsb3NlQmFzaXMyICggQiBbaV0sIEIgW2pdICAgICksIHAgKVxuICAgICAgICAgICAgICAgJiYgZW5jbG9zZXNOb3QgICAgKCBlbmNsb3NlQmFzaXMyICggQiBbaV0sIHAgICAgICAgICksIEIgW2pdIClcbiAgICAgICAgICAgICAgICYmIGVuY2xvc2VzTm90ICAgICggZW5jbG9zZUJhc2lzMiAoIEIgW2pdLCBwICAgICAgICApLCBCIFtpXSApXG4gICAgICAgICAgICAgICAmJiBlbmNsb3Nlc1dlYWtBbGwoIGVuY2xvc2VCYXNpczMgKCBCIFtpXSwgQiBbal0sIHAgKSwgQiApXG4gICAgICAgICAgICAgICApe1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gWyBCWyBpIF0sIEJbIGogXSwgcCBdO1xuICAgICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgfVxuXG4gICAgIC8vIElmIHdlIGdldCBoZXJlIHRoZW4gc29tZXRoaW5nIGlzIHZlcnkgd3JvbmcuXG4gICAgIHRocm93IG5ldyBFcnJvcjtcbn1cblxuZnVuY3Rpb24gZW5jbG9zZXNOb3QgKCBhOiBDaXJjbGUsIGI6IENpcmNsZSApXG57XG4gICAgIGNvbnN0IGRyID0gYS5yIC0gYi5yXG4gICAgIGNvbnN0IGR4ID0gYi54IC0gYS54XG4gICAgIGNvbnN0IGR5ID0gYi55IC0gYS55XG5cbiAgICAgcmV0dXJuIGRyIDwgMCB8fCBkciAqIGRyIDwgZHggKiBkeCArIGR5ICogZHk7XG59XG5cbmZ1bmN0aW9uIGVuY2xvc2VzV2VhayAoIGE6IENpcmNsZSwgYjogQ2lyY2xlIClcbntcbiAgICAgdmFyIGRyID0gYS5yIC0gYi5yICsgMWUtNixcbiAgICAgZHggPSBiLnggLSBhLngsXG4gICAgIGR5ID0gYi55IC0gYS55XG5cbiAgICAgcmV0dXJuIGRyID4gMCAmJiBkciAqIGRyID4gZHggKiBkeCArIGR5ICogZHlcbn1cblxuZnVuY3Rpb24gZW5jbG9zZXNXZWFrQWxsICggYTogQ2lyY2xlLCBCOiBDaXJjbGVbXSApXG57XG4gICAgIGZvciAoIHZhciBpID0gMDsgaSA8IEIubGVuZ3RoOyArK2kgKVxuICAgICB7XG4gICAgICAgICAgaWYgKCAhIGVuY2xvc2VzV2VhayAoIGEsIEJbaV0gKSApXG4gICAgICAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgfVxuICAgICByZXR1cm4gdHJ1ZVxufVxuXG5mdW5jdGlvbiBlbmNsb3NlQmFzaXMgKCBCOiBDaXJjbGVbXSApXG57XG4gICAgIHN3aXRjaCAoIEIubGVuZ3RoIClcbiAgICAge1xuICAgICAgICAgIGNhc2UgMTogcmV0dXJuIGVuY2xvc2VCYXNpczEoIEIgWzBdIClcbiAgICAgICAgICBjYXNlIDI6IHJldHVybiBlbmNsb3NlQmFzaXMyKCBCIFswXSwgQiBbMV0gKVxuICAgICAgICAgIGNhc2UgMzogcmV0dXJuIGVuY2xvc2VCYXNpczMoIEIgWzBdLCBCIFsxXSwgQiBbMl0gKVxuICAgICB9XG59XG5cbmZ1bmN0aW9uIGVuY2xvc2VCYXNpczEgKCBhOiBDaXJjbGUgKVxue1xuICAgICByZXR1cm4ge1xuICAgICAgICAgIHg6IGEueCxcbiAgICAgICAgICB5OiBhLnksXG4gICAgICAgICAgcjogYS5yXG4gICAgIH07XG59XG5cbmZ1bmN0aW9uIGVuY2xvc2VCYXNpczIgKCBhOiBDaXJjbGUsIGI6IENpcmNsZSApXG57XG4gICAgIGNvbnN0IHsgeDogeDEsIHk6IHkxLCByOiByMSB9ID0gYVxuICAgICBjb25zdCB7IHg6IHgyLCB5OiB5MiwgcjogcjIgfSA9IGJcblxuICAgICB2YXIgeDIxID0geDIgLSB4MSxcbiAgICAgeTIxID0geTIgLSB5MSxcbiAgICAgcjIxID0gcjIgLSByMSxcbiAgICAgbCAgID0gTWF0aC5zcXJ0KCB4MjEgKiB4MjEgKyB5MjEgKiB5MjEgKTtcblxuICAgICByZXR1cm4ge1xuICAgICAgICAgIHg6ICggeDEgKyB4MiArIHgyMSAvIGwgKiByMjEgKSAvIDIsXG4gICAgICAgICAgeTogKCB5MSArIHkyICsgeTIxIC8gbCAqIHIyMSApIC8gMixcbiAgICAgICAgICByOiAoIGwgKyByMSArIHIyICkgLyAyXG4gICAgIH07XG59XG5cbmZ1bmN0aW9uIGVuY2xvc2VCYXNpczMgKCBhOiBDaXJjbGUsIGI6IENpcmNsZSwgYzogQ2lyY2xlIClcbntcbiAgICAgY29uc3QgeyB4OiB4MSwgeTogeTEsIHI6IHIxIH0gPSBhXG4gICAgIGNvbnN0IHsgeDogeDIsIHk6IHkyLCByOiByMiB9ID0gYlxuICAgICBjb25zdCB7IHg6IHgzLCB5OiB5MywgcjogcjMgfSA9IGNcblxuICAgICBjb25zdCBhMiA9IHgxIC0geDIsXG4gICAgICAgICAgICAgICBhMyA9IHgxIC0geDMsXG4gICAgICAgICAgICAgICBiMiA9IHkxIC0geTIsXG4gICAgICAgICAgICAgICBiMyA9IHkxIC0geTMsXG4gICAgICAgICAgICAgICBjMiA9IHIyIC0gcjEsXG4gICAgICAgICAgICAgICBjMyA9IHIzIC0gcjEsXG5cbiAgICAgICAgICAgICAgIGQxID0geDEgKiB4MSArIHkxICogeTEgLSByMSAqIHIxLFxuICAgICAgICAgICAgICAgZDIgPSBkMSAtIHgyICogeDIgLSB5MiAqIHkyICsgcjIgKiByMixcbiAgICAgICAgICAgICAgIGQzID0gZDEgLSB4MyAqIHgzIC0geTMgKiB5MyArIHIzICogcjMsXG5cbiAgICAgICAgICAgICAgIGFiID0gYTMgKiBiMiAtIGEyICogYjMsXG4gICAgICAgICAgICAgICB4YSA9ICggYjIgKiBkMyAtIGIzICogZDIgKSAvICggYWIgKiAyICkgLSB4MSxcbiAgICAgICAgICAgICAgIHhiID0gKCBiMyAqIGMyIC0gYjIgKiBjMyApIC8gYWIsXG4gICAgICAgICAgICAgICB5YSA9ICggYTMgKiBkMiAtIGEyICogZDMgKSAvICggYWIgKiAyICkgLSB5MSxcbiAgICAgICAgICAgICAgIHliID0gKCBhMiAqIGMzIC0gYTMgKiBjMiApIC8gYWIsXG5cbiAgICAgICAgICAgICAgIEEgID0geGIgKiB4YiArIHliICogeWIgLSAxLFxuICAgICAgICAgICAgICAgQiAgPSAyICogKCByMSArIHhhICogeGIgKyB5YSAqIHliICksXG4gICAgICAgICAgICAgICBDICA9IHhhICogeGEgKyB5YSAqIHlhIC0gcjEgKiByMSxcbiAgICAgICAgICAgICAgIHIgID0gLSggQSA/ICggQiArIE1hdGguc3FydCggQiAqIEIgLSA0ICogQSAqIEMgKSApIC8gKCAyICogQSApIDogQyAvIEIgKVxuXG4gICAgIHJldHVybiB7XG4gICAgICAgICAgeDogeDEgKyB4YSArIHhiICogcixcbiAgICAgICAgICB5OiB5MSArIHlhICsgeWIgKiByLFxuICAgICAgICAgIHI6IHJcbiAgICAgfTtcbn1cbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuL2QzLWVuY2xvc2UudHNcIiAvPlxuXG4vLyBodHRwczovL2dpdGh1Yi5jb20vZDMvZDMtaGllcmFyY2h5L2Jsb2IvbWFzdGVyL3NyYy9wYWNrL3NpYmxpbmdzLmpzXG5cbmltcG9ydCB7IGVuY2xvc2UsIENpcmNsZSB9IGZyb20gXCIuL2QzLWVuY2xvc2UuanNcIlxuXG5mdW5jdGlvbiBwbGFjZSAoIGI6IENpcmNsZSwgYTogQ2lyY2xlLCBjOiBDaXJjbGUgKVxue1xuICAgICB2YXIgZHggPSBiLnggLSBhLngsXG4gICAgICAgICAgeDogbnVtYmVyLFxuICAgICAgICAgIGEyOiBudW1iZXIsXG4gICAgICAgICAgZHkgPSBiLnkgLSBhLnksXG4gICAgICAgICAgeSA6IG51bWJlcixcbiAgICAgICAgICBiMjogbnVtYmVyLFxuICAgICAgICAgIGQyID0gZHggKiBkeCArIGR5ICogZHlcblxuICAgICBpZiAoIGQyIClcbiAgICAge1xuICAgICAgICAgIGEyID0gYS5yICsgYy5yLCBhMiAqPSBhMlxuICAgICAgICAgIGIyID0gYi5yICsgYy5yLCBiMiAqPSBiMlxuXG4gICAgICAgICAgaWYgKCBhMiA+IGIyIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICB4ID0gKCBkMiArIGIyIC0gYTIgKSAvICggMiAqIGQyIClcbiAgICAgICAgICAgICAgIHkgPSBNYXRoLnNxcnQoIE1hdGgubWF4KCAwLCBiMiAvIGQyIC0geCAqIHggKSApXG4gICAgICAgICAgICAgICBjLnggPSBiLnggLSB4ICogZHggLSB5ICogZHlcbiAgICAgICAgICAgICAgIGMueSA9IGIueSAtIHggKiBkeSArIHkgKiBkeFxuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgeCA9ICggZDIgKyBhMiAtIGIyICkgLyAoIDIgKiBkMiApXG4gICAgICAgICAgICAgICB5ID0gTWF0aC5zcXJ0KCBNYXRoLm1heCggMCwgYTIgLyBkMiAtIHggKiB4ICkgKVxuICAgICAgICAgICAgICAgYy54ID0gYS54ICsgeCAqIGR4IC0geSAqIGR5XG4gICAgICAgICAgICAgICBjLnkgPSBhLnkgKyB4ICogZHkgKyB5ICogZHhcbiAgICAgICAgICB9XG4gICAgIH1cbiAgICAgZWxzZVxuICAgICB7XG4gICAgICAgICAgYy54ID0gYS54ICsgYy5yXG4gICAgICAgICAgYy55ID0gYS55XG4gICAgIH1cbn1cblxuZnVuY3Rpb24gaW50ZXJzZWN0cyAoIGE6IENpcmNsZSwgYjogQ2lyY2xlIClcbntcbiAgICAgdmFyIGRyID0gYS5yICsgYi5yIC0gMWUtNiwgZHggPSBiLnggLSBhLngsIGR5ID0gYi55IC0gYS55O1xuICAgICByZXR1cm4gZHIgPiAwICYmIGRyICogZHIgPiBkeCAqIGR4ICsgZHkgKiBkeTtcbn1cblxuZnVuY3Rpb24gc2NvcmUgKCBub2RlOiBOb2RlIClcbntcbiAgICAgdmFyIGEgPSBub2RlLl8sXG4gICAgICAgICAgYiA9IG5vZGUubmV4dC5fLFxuICAgICAgICAgIGFiID0gYS5yICsgYi5yLFxuICAgICAgICAgIGR4ID0gKCBhLnggKiBiLnIgKyBiLnggKiBhLnIgKSAvIGFiLFxuICAgICAgICAgIGR5ID0gKCBhLnkgKiBiLnIgKyBiLnkgKiBhLnIgKSAvIGFiO1xuICAgICByZXR1cm4gZHggKiBkeCArIGR5ICogZHk7XG59XG5cbmNsYXNzIE5vZGVcbntcbiAgICAgbmV4dCAgICAgPSBudWxsIGFzIE5vZGVcbiAgICAgcHJldmlvdXMgPSBudWxsIGFzIE5vZGVcbiAgICAgY29uc3RydWN0b3IgKCBwdWJsaWMgXzogQ2lyY2xlICkge31cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhY2tFbmNsb3NlICggY2lyY2xlczogQ2lyY2xlW10gKVxue1xuICAgICBpZiAoICEoIG4gPSBjaXJjbGVzLmxlbmd0aCApICkgcmV0dXJuIDA7XG5cbiAgICAgdmFyIGEsIGIsIGMgLyo6IE5vZGUgJiBDaXJjbGUqLywgbiwgYWEsIGNhLCBpLCBqLCBrLCBzaiwgc2s7XG5cbiAgICAgLy8gUGxhY2UgdGhlIGZpcnN0IGNpcmNsZS5cbiAgICAgYSA9IGNpcmNsZXNbIDAgXSwgYS54ID0gMCwgYS55ID0gMDtcbiAgICAgaWYgKCAhKCBuID4gMSApICkgcmV0dXJuIGEucjtcblxuICAgICAvLyBQbGFjZSB0aGUgc2Vjb25kIGNpcmNsZS5cbiAgICAgYiA9IGNpcmNsZXNbIDEgXSwgYS54ID0gLWIuciwgYi54ID0gYS5yLCBiLnkgPSAwO1xuICAgICBpZiAoICEoIG4gPiAyICkgKSByZXR1cm4gYS5yICsgYi5yO1xuXG4gICAgIC8vIFBsYWNlIHRoZSB0aGlyZCBjaXJjbGUuXG4gICAgIHBsYWNlKCBiLCBhLCBjID0gY2lyY2xlc1sgMiBdICk7XG5cbiAgICAgLy8gSW5pdGlhbGl6ZSB0aGUgZnJvbnQtY2hhaW4gdXNpbmcgdGhlIGZpcnN0IHRocmVlIGNpcmNsZXMgYSwgYiBhbmQgYy5cbiAgICAgYSA9IG5ldyBOb2RlKCBhICksIGIgPSBuZXcgTm9kZSggYiApLCBjID0gbmV3IE5vZGUoIGMgKTtcbiAgICAgYS5uZXh0ID0gYy5wcmV2aW91cyA9IGI7XG4gICAgIGIubmV4dCA9IGEucHJldmlvdXMgPSBjO1xuICAgICBjLm5leHQgPSBiLnByZXZpb3VzID0gYTtcblxuICAgICAvLyBBdHRlbXB0IHRvIHBsYWNlIGVhY2ggcmVtYWluaW5nIGNpcmNsZeKAplxuICAgICBwYWNrOiBmb3IgKCBpID0gMzsgaSA8IG47ICsraSApXG4gICAgIHtcbiAgICAgICAgICBwbGFjZSggYS5fLCBiLl8sIGMgPSBjaXJjbGVzWyBpIF0gKSwgYyA9IG5ldyBOb2RlKCBjICk7XG5cbiAgICAgICAgICAvLyBGaW5kIHRoZSBjbG9zZXN0IGludGVyc2VjdGluZyBjaXJjbGUgb24gdGhlIGZyb250LWNoYWluLCBpZiBhbnkuXG4gICAgICAgICAgLy8g4oCcQ2xvc2VuZXNz4oCdIGlzIGRldGVybWluZWQgYnkgbGluZWFyIGRpc3RhbmNlIGFsb25nIHRoZSBmcm9udC1jaGFpbi5cbiAgICAgICAgICAvLyDigJxBaGVhZOKAnSBvciDigJxiZWhpbmTigJ0gaXMgbGlrZXdpc2UgZGV0ZXJtaW5lZCBieSBsaW5lYXIgZGlzdGFuY2UuXG4gICAgICAgICAgaiA9IGIubmV4dCwgayA9IGEucHJldmlvdXMsIHNqID0gYi5fLnIsIHNrID0gYS5fLnI7XG4gICAgICAgICAgZG9cbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBpZiAoIHNqIDw9IHNrIClcbiAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBpbnRlcnNlY3RzKCBqLl8sIGMuXyApIClcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgIGIgPSBqLCBhLm5leHQgPSBiLCBiLnByZXZpb3VzID0gYSwgLS1pO1xuICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlIHBhY2s7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgc2ogKz0gai5fLnIsIGogPSBqLm5leHQ7XG4gICAgICAgICAgICAgICB9IGVsc2VcbiAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBpbnRlcnNlY3RzKCBrLl8sIGMuXyApIClcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgIGEgPSBrLCBhLm5leHQgPSBiLCBiLnByZXZpb3VzID0gYSwgLS1pO1xuICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlIHBhY2s7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgc2sgKz0gay5fLnIsIGsgPSBrLnByZXZpb3VzO1xuICAgICAgICAgICAgICAgfVxuICAgICAgICAgIH0gd2hpbGUgKCBqICE9PSBrLm5leHQgKTtcblxuICAgICAgICAgIC8vIFN1Y2Nlc3MhIEluc2VydCB0aGUgbmV3IGNpcmNsZSBjIGJldHdlZW4gYSBhbmQgYi5cbiAgICAgICAgICBjLnByZXZpb3VzID0gYSwgYy5uZXh0ID0gYiwgYS5uZXh0ID0gYi5wcmV2aW91cyA9IGIgPSBjO1xuXG4gICAgICAgICAgLy8gQ29tcHV0ZSB0aGUgbmV3IGNsb3Nlc3QgY2lyY2xlIHBhaXIgdG8gdGhlIGNlbnRyb2lkLlxuICAgICAgICAgIGFhID0gc2NvcmUoIGEgKTtcbiAgICAgICAgICB3aGlsZSAoICggYyA9IGMubmV4dCApICE9PSBiIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBpZiAoICggY2EgPSBzY29yZSggYyApICkgPCBhYSApXG4gICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGEgPSBjLFxuICAgICAgICAgICAgICAgICAgICBhYSA9IGNhO1xuICAgICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBiID0gYS5uZXh0O1xuICAgICB9XG5cbiAgICAgLy8gQ29tcHV0ZSB0aGUgZW5jbG9zaW5nIGNpcmNsZSBvZiB0aGUgZnJvbnQgY2hhaW4uXG4gICAgIGEgPSBbIGIuXyBdXG4gICAgIGMgPSBiXG4gICAgIHdoaWxlICggKCBjID0gYy5uZXh0ICkgIT09IGIgKVxuICAgICAgICAgIGEucHVzaCggYy5fICk7XG4gICAgIGMgPSBlbmNsb3NlKCBhIClcblxuICAgICAvLyBUcmFuc2xhdGUgdGhlIGNpcmNsZXMgdG8gcHV0IHRoZSBlbmNsb3NpbmcgY2lyY2xlIGFyb3VuZCB0aGUgb3JpZ2luLlxuICAgICBmb3IgKCBpID0gMDsgaSA8IG47ICsraSApXG4gICAgIHtcbiAgICAgICAgICBhID0gY2lyY2xlc1sgaSBdLFxuICAgICAgICAgIGEueCAtPSBjLngsXG4gICAgICAgICAgYS55IC09IGMueVxuICAgICB9XG5cbiAgICAgcmV0dXJuIGMuciBhcyBudW1iZXJcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhY2tDaXJjbGVzICggY2lyY2xlczogQ2lyY2xlW10gKVxue1xuICAgICBwYWNrRW5jbG9zZSggY2lyY2xlcyApO1xuICAgICByZXR1cm4gY2lyY2xlcyBhcyBDaXJjbGVbXTtcbn1cbiIsIlxyXG5cclxuZXhwb3J0IHR5cGUgVW5pdFxyXG4gICAgPSBcIiVcIlxyXG4gICAgfCBcInB4XCIgfCBcInB0XCIgfCBcImVtXCIgfCBcInJlbVwiIHwgXCJpblwiIHwgXCJjbVwiIHwgXCJtbVwiXHJcbiAgICB8IFwiZXhcIiB8IFwiY2hcIiB8IFwicGNcIlxyXG4gICAgfCBcInZ3XCIgfCBcInZoXCIgfCBcInZtaW5cIiB8IFwidm1heFwiXHJcbiAgICB8IFwiZGVnXCIgfCBcInJhZFwiIHwgXCJ0dXJuXCJcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRVbml0ICggdmFsdWU6IGFueSApOiBVbml0IHwgdW5kZWZpbmVkXHJcbntcclxuICAgIGlmICggdHlwZW9mIHZhbHVlICE9IFwic3RyaW5nXCIgKVxyXG4gICAgICAgICByZXR1cm4gdW5kZWZpbmVkXHJcblxyXG4gICAgY29uc3Qgc3BsaXQgPSAvWystXT9cXGQqXFwuP1xcZCsoPzpcXC5cXGQrKT8oPzpbZUVdWystXT9cXGQrKT8oJXxweHxwdHxlbXxyZW18aW58Y218bW18ZXh8Y2h8cGN8dnd8dmh8dm1pbnx2bWF4fGRlZ3xyYWR8dHVybik/JC9cclxuICAgICAgICAgICAgICAuZXhlYyggdmFsdWUgKTtcclxuXHJcbiAgICBpZiAoIHNwbGl0IClcclxuICAgICAgICAgcmV0dXJuIHNwbGl0IFsxXSBhcyBVbml0XHJcblxyXG4gICAgcmV0dXJuIHVuZGVmaW5lZFxyXG59XHJcblxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldFRyYW5zZm9ybVVuaXQgKCBwcm9wTmFtZTogc3RyaW5nIClcclxue1xyXG4gICAgaWYgKCBwcm9wTmFtZS5pbmNsdWRlcyAoICd0cmFuc2xhdGUnICkgfHwgcHJvcE5hbWUgPT09ICdwZXJzcGVjdGl2ZScgKVxyXG4gICAgICAgIHJldHVybiAncHgnXHJcblxyXG4gICAgaWYgKCBwcm9wTmFtZS5pbmNsdWRlcyAoICdyb3RhdGUnICkgfHwgcHJvcE5hbWUuaW5jbHVkZXMgKCAnc2tldycgKSApXHJcbiAgICAgICAgcmV0dXJuICdkZWcnXHJcbn0iLCJcbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9yZGZqcy1iYXNlL2RhdGEtbW9kZWwvdHJlZS9tYXN0ZXIvbGliXG5cbmRlY2xhcmUgZ2xvYmFsXG57XG4gICAgIGludGVyZmFjZSAkTm9kZVxuICAgICB7XG4gICAgICAgICAgcmVhZG9ubHkgY29udGV4dDogc3RyaW5nXG4gICAgICAgICAgcmVhZG9ubHkgdHlwZTogc3RyaW5nXG4gICAgICAgICAgcmVhZG9ubHkgaWQ6IHN0cmluZ1xuICAgICB9XG5cbiAgICAgaW50ZXJmYWNlICRDbHVzdGVyIGV4dGVuZHMgJE5vZGVcbiAgICAge1xuICAgICAgICAgIGNoaWxkcmVuPzogJE5vZGUgW11cbiAgICAgfVxufVxuXG52YXIgbmV4dElkID0gMFxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTm9kZSA8RCBleHRlbmRzICROb2RlID0gJE5vZGUsIFQgZXh0ZW5kcyBzdHJpbmcgPSBEIFtcInR5cGVcIl0+ICggdHlwZTogVCwgaWQ6IHN0cmluZywgZGF0YTogUGFydGlhbCA8T21pdCA8RCwgXCJ0eXBlXCIgfCBcImlkXCI+PiApXG57XG4gICAgIHR5cGUgTiA9IHsgLXJlYWRvbmx5IFtLIGluIGtleW9mIERdOiBEW0tdIH1cblxuICAgICA7KGRhdGEgYXMgTikudHlwZSA9IHR5cGVcbiAgICAgOyhkYXRhIGFzIE4pLmlkICAgPSBpZCB8fCAoKytuZXh0SWQpLnRvU3RyaW5nICgpXG4gICAgIHJldHVybiBkYXRhIGFzIERcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFVJZCAoIG5vZGU6ICROb2RlIClcbntcbiAgICAgcmV0dXJuIG5vZGUuY29udGV4dCArICcjJyArIG5vZGUudHlwZSArICc6JyArIG5vZGUuaWRcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGVxdWFsTm9kZXMgKCBhOiAkTm9kZSwgYjogJE5vZGUgKVxue1xuICAgICByZXR1cm4gISFhICYmICEhYlxuICAgICAgICAgICYmIGEudHlwZSA9PT0gYi50eXBlXG4gICAgICAgICAgJiYgYS5pZCAgID09PSBiLmlkXG59XG5cbi8qZXhwb3J0IGNsYXNzIE5vZGUgPEQgZXh0ZW5kcyAkTm9kZSA9ICROb2RlLCBUIGV4dGVuZHMgc3RyaW5nID0gRCBbXCJ0eXBlXCJdPlxue1xuICAgICBzdGF0aWMgbmV4dElkID0gMFxuXG4gICAgIHJlYWRvbmx5IHR5cGU6IHN0cmluZ1xuXG4gICAgIHJlYWRvbmx5IGlkOiBzdHJpbmdcblxuICAgICByZWFkb25seSB1aWQ6IG51bWJlclxuXG4gICAgIHJlYWRvbmx5IGRhdGE6IERcblxuICAgICBkZWZhdWx0RGF0YSAoKTogJE5vZGVcbiAgICAge1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICBjb250ZXh0OiBcIlwiLFxuICAgICAgICAgICAgICAgdHlwZSAgIDogXCJub2RlXCIsXG4gICAgICAgICAgICAgICBpZCAgICAgOiB1bmRlZmluZWQsXG4gICAgICAgICAgfVxuICAgICB9XG5cbiAgICAgY29uc3RydWN0b3IgKCBkYXRhOiBEIClcbiAgICAge1xuICAgICAgICAgIHRoaXMudHlwZSA9IGRhdGEudHlwZVxuICAgICAgICAgIHRoaXMudWlkICA9ICsrTm9kZS5uZXh0SWRcbiAgICAgICAgICB0aGlzLmlkICAgPSBkYXRhLmlkIHx8IChkYXRhLmlkID0gdGhpcy51aWQudG9TdHJpbmcgKCkpXG5cbiAgICAgICAgICB0aGlzLmRhdGEgPSBPYmplY3QuYXNzaWduICggdGhpcy5kZWZhdWx0RGF0YSAoKSwgZGF0YSBhcyBEIClcbiAgICAgfVxuXG4gICAgIGVxdWFscyAoIG90aGVyOiBOb2RlIDxhbnk+IClcbiAgICAge1xuICAgICAgICAgIHJldHVybiAhIW90aGVyXG4gICAgICAgICAgICAgICAmJiBvdGhlci50eXBlID09PSB0aGlzLnR5cGVcbiAgICAgICAgICAgICAgICYmIG90aGVyLmlkICAgPT09IHRoaXMuaWRcbiAgICAgfVxuXG4gICAgIHRvSnNvbiAoKVxuICAgICB7XG4gICAgICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5ICggdGhpcy5kYXRhIClcbiAgICAgfVxufSovXG4iLCJcbmV4cG9ydCB0eXBlIFBhdGggPSB7XG4gICAgIGxlbmd0aDogbnVtYmVyXG4gICAgIFtTeW1ib2wuaXRlcmF0b3JdKCk6IEl0ZXJhYmxlSXRlcmF0b3I8c3RyaW5nPlxufVxuXG5leHBvcnQgY2xhc3MgRGF0YVRyZWUgPFQ+XG57XG4gICAgIHJlY29yZHMgPSB7fSBhcyB7XG4gICAgICAgICAgW2NvbnRleHQ6IHN0cmluZ106IFQgfCB7XG4gICAgICAgICAgICAgICBbdHlwZTogc3RyaW5nXTogVCB8IHtcbiAgICAgICAgICAgICAgICAgICAgW2lkOiBzdHJpbmddOiBUXG4gICAgICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICB9XG5cbiAgICAgaGFzICggcGF0aDogUGF0aCApICA6IGJvb2xlYW5cbiAgICAge1xuICAgICAgICAgIHZhciAgIHJlYyAgPSB0aGlzLnJlY29yZHMgYXMgYW55XG4gICAgICAgICAgdmFyIGNvdW50ID0gMFxuXG4gICAgICAgICAgZm9yICggY29uc3QgayBvZiBwYXRoIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBjb3VudCArK1xuXG4gICAgICAgICAgICAgICBpZiAoIGsgaW4gcmVjIClcbiAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBrID09PSB1bmRlZmluZWQgKVxuICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrXG5cbiAgICAgICAgICAgICAgICAgICAgcmVjID0gcmVjIFtrXVxuICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gcGF0aC5sZW5ndGggPT0gY291bnRcbiAgICAgfVxuXG4gICAgIGNvdW50ICggcGF0aDogUGF0aCApXG4gICAgIHtcbiAgICAgICAgICB2YXIgIHJlYyA9IHRoaXMucmVjb3JkcyBhcyBhbnlcblxuICAgICAgICAgIGZvciAoIGNvbnN0IGsgb2YgcGF0aCApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgaWYgKCBrID09PSB1bmRlZmluZWQgKVxuICAgICAgICAgICAgICAgICAgICBicmVha1xuXG4gICAgICAgICAgICAgICBpZiAoIGsgaW4gcmVjIClcbiAgICAgICAgICAgICAgICAgICAgcmVjID0gcmVjIFtrXVxuICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gMFxuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vQHRzLWlnbm9yZVxuICAgICAgICAgIHJldHVybiB1bmRlZmluZWQgaW4gcmVjXG4gICAgICAgICAgICAgICA/IE9iamVjdC5rZXlzICggcmVjICkubGVuZ3RoIC0gMVxuICAgICAgICAgICAgICAgOiBPYmplY3Qua2V5cyAoIHJlYyApLmxlbmd0aFxuXG4gICAgIH1cblxuICAgICBzZXQgKCBwYXRoOiBQYXRoLCBkYXRhOiBUICk6IFRcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHVuZCA9IHVuZGVmaW5lZFxuICAgICAgICAgIHZhciAgIHJlYyAgPSB0aGlzLnJlY29yZHMgYXMgYW55XG5cbiAgICAgICAgICBmb3IgKCBjb25zdCBrIG9mIHBhdGggKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGlmICggayA9PT0gdW5kZWZpbmVkIClcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcblxuICAgICAgICAgICAgICAgaWYgKCBrIGluIHJlYyApXG4gICAgICAgICAgICAgICAgICAgIHJlYyA9IHJlYyBba11cbiAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgcmVjID0gcmVjIFtrXSA9IHt9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIHJlYyBbdW5kXSA9IGRhdGFcbiAgICAgfVxuXG4gICAgIGdldCAoIHBhdGg6IFBhdGggKTogVFxuICAgICB7XG4gICAgICAgICAgY29uc3QgdW5kID0gdW5kZWZpbmVkXG4gICAgICAgICAgdmFyICAgcmVjICA9IHRoaXMucmVjb3JkcyBhcyBhbnlcblxuICAgICAgICAgIGZvciAoIGNvbnN0IGsgb2YgcGF0aCApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgaWYgKCBrID09PSB1bmRlZmluZWQgKVxuICAgICAgICAgICAgICAgICAgICBicmVha1xuXG4gICAgICAgICAgICAgICBpZiAoIGsgaW4gcmVjIClcbiAgICAgICAgICAgICAgICAgICAgcmVjID0gcmVjIFtrXVxuICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiByZWMgW3VuZF1cbiAgICAgfVxuXG4gICAgIG5lYXIgKCBwYXRoOiBQYXRoICk6IFRcbiAgICAge1xuICAgICAgICAgIHZhciByZWMgPSB0aGlzLnJlY29yZHMgYXMgYW55XG4gICAgICAgICAgY29uc3QgdW5kID0gdW5kZWZpbmVkXG5cbiAgICAgICAgICBmb3IgKCBjb25zdCBrIG9mIHBhdGggKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGlmICggayA9PT0gdW5kZWZpbmVkIClcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcblxuICAgICAgICAgICAgICAgaWYgKCBrIGluIHJlYyApXG4gICAgICAgICAgICAgICAgICAgIHJlYyA9IHJlYyBba11cbiAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gcmVjIFt1bmRdXG4gICAgIH1cblxuICAgICB3YWxrICggcGF0aDogUGF0aCwgY2I6ICggZGF0YTogVCApID0+IHZvaWQgKVxuICAgICB7XG4gICAgICAgICAgdmFyICAgcmVjICA9IHRoaXMucmVjb3JkcyBhcyBhbnlcbiAgICAgICAgICBjb25zdCB1bmQgID0gdW5kZWZpbmVkXG5cbiAgICAgICAgICBmb3IgKCBjb25zdCBrIG9mIHBhdGggKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGlmICggdW5kIGluIHJlYyApXG4gICAgICAgICAgICAgICAgICAgIGNiICggcmVjIFt1bmRdIClcblxuICAgICAgICAgICAgICAgaWYgKCBrID09PSB1bmRlZmluZWQgKVxuICAgICAgICAgICAgICAgICAgICBicmVha1xuXG4gICAgICAgICAgICAgICBpZiAoIGsgaW4gcmVjIClcbiAgICAgICAgICAgICAgICAgICAgcmVjID0gcmVjIFtrXVxuICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICggdW5kIGluIHJlYyApXG4gICAgICAgICAgICAgICBjYiAoIHJlYyBbdW5kXSApXG5cbiAgICAgICAgICByZXR1cm5cbiAgICAgfVxufVxuIiwiXG5pbXBvcnQgeyBPcHRpb25hbCwgUmVxdWlyZSB9IGZyb20gXCIuLi9MaWIvdHlwaW5nLmpzXCJcbmltcG9ydCB7IERhdGFUcmVlIH0gZnJvbSBcIi4vZGF0YS10cmVlLmpzXCJcblxuXG50eXBlIFJlZiA8TiBleHRlbmRzICROb2RlPiA9IFJlcXVpcmUgPFBhcnRpYWwgPE4+LCBcImNvbnRleHRcIiB8IFwidHlwZVwiIHwgXCJpZFwiPlxuXG50eXBlIEQgPE4gZXh0ZW5kcyAkTm9kZT4gPSBPcHRpb25hbCA8TiwgXCJjb250ZXh0XCIgfCBcInR5cGVcIiB8IFwiaWRcIj5cblxuXG5leHBvcnQgY2xhc3MgRGF0YWJhc2UgPE4gZXh0ZW5kcyAkTm9kZSA9ICROb2RlPiBleHRlbmRzIERhdGFUcmVlIDxOPlxue1xuICAgICBoYXMgKCBub2RlOiBSZWYgPE4+ICkgICAgICA6IGJvb2xlYW5cbiAgICAgaGFzICggLi4uIHBhdGg6IHN0cmluZyBbXSApOiBib29sZWFuXG4gICAgIGhhcyAoKTogYm9vbGVhblxuICAgICB7XG4gICAgICAgICAgaWYgKCBhcmd1bWVudHMubGVuZ3RoID09IDAgKVxuICAgICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgICBpZiAoIGFyZ3VtZW50cy5sZW5ndGggPT0gMSApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgY29uc3QgbzogTiA9IGFyZ3VtZW50cyBbMF1cbiAgICAgICAgICAgICAgIHJldHVybiBzdXBlci5uZWFyICggW28uY29udGV4dCwgby50eXBlLCBvLmlkXSApICE9PSB1bmRlZmluZWRcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHJldHVybiBzdXBlci5uZWFyICggYXJndW1lbnRzICkgIT09IHVuZGVmaW5lZFxuICAgICAgICAgIH1cbiAgICAgfVxuXG4gICAgIGNvdW50ICggbm9kZTogUmVmIDxOPiApICAgICAgOiBudW1iZXJcbiAgICAgY291bnQgKCAuLi4gcGF0aDogc3RyaW5nIFtdICk6IG51bWJlclxuICAgICBjb3VudCAoKTogbnVtYmVyXG4gICAgIHtcbiAgICAgICAgICBpZiAoIGFyZ3VtZW50cy5sZW5ndGggPT0gMCApXG4gICAgICAgICAgICAgICByZXR1cm5cblxuICAgICAgICAgIGlmICggYXJndW1lbnRzLmxlbmd0aCA9PSAxIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBjb25zdCBvOiBOID0gYXJndW1lbnRzIFswXVxuICAgICAgICAgICAgICAgcmV0dXJuIHN1cGVyLmNvdW50ICggW28uY29udGV4dCwgby50eXBlLCBvLmlkXSApXG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICByZXR1cm4gc3VwZXIuY291bnQgKCBhcmd1bWVudHMgKVxuICAgICAgICAgIH1cbiAgICAgfVxuXG4gICAgIHNldCA8JCBleHRlbmRzIE4+ICggbm9kZTogJCApICAgICAgICAgICAgICAgICAgICAgOiAkXG4gICAgIHNldCA8JCBleHRlbmRzIE4+ICggcGF0aDogc3RyaW5nIFtdLCBkYXRhOiBEIDwkPiApOiAkXG4gICAgIHNldCAoKTogTlxuICAgICB7XG4gICAgICAgICAgaWYgKCBhcmd1bWVudHMubGVuZ3RoID09IDAgKVxuICAgICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgICBpZiAoIGFyZ3VtZW50cy5sZW5ndGggPT0gMSApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgY29uc3QgbzogTiA9IGFyZ3VtZW50cyBbMF1cbiAgICAgICAgICAgICAgIHJldHVybiBzdXBlci5zZXQgKCBbby5jb250ZXh0LCBvLnR5cGUsIG8uaWRdLCBvIClcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHJldHVybiBzdXBlci5zZXQgKCBhcmd1bWVudHMgWzBdLCBhcmd1bWVudHMgWzFdIClcbiAgICAgICAgICB9XG4gICAgIH1cblxuICAgICBnZXQgPCQgZXh0ZW5kcyBOPiAoIG5vZGU6IFJlZiA8JE5vZGU+ICkgIDogJFxuICAgICBnZXQgPCQgZXh0ZW5kcyBOPiAoIC4uLiBwYXRoOiBzdHJpbmcgW10gKTogJFxuICAgICBnZXQgKCk6IE5cbiAgICAge1xuICAgICAgICAgIGlmICggYXJndW1lbnRzLmxlbmd0aCA9PSAwIClcbiAgICAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgICAgY29uc3QgcmVzdWx0ID0ge30gYXMgTlxuXG4gICAgICAgICAgaWYgKCBhcmd1bWVudHMubGVuZ3RoID09IDEgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNvbnN0IG86ICROb2RlID0gYXJndW1lbnRzIFswXVxuICAgICAgICAgICAgICAgc3VwZXIud2FsayAoIFtvLmNvbnRleHQsIG8udHlwZSwgby5pZF0sIGRhdGEgPT4ge1xuICAgICAgICAgICAgICAgICAgICBPYmplY3QuYXNzaWduICggcmVzdWx0LCBkYXRhIClcbiAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICByZXR1cm4gT2JqZWN0LmFzc2lnbiAoIHJlc3VsdCwgbyApXG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBzdXBlci53YWxrICggYXJndW1lbnRzLCBkYXRhID0+IHtcbiAgICAgICAgICAgICAgICAgICAgT2JqZWN0LmFzc2lnbiAoIHJlc3VsdCwgZGF0YSApXG4gICAgICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICAgICByZXR1cm4gT2JqZWN0LmFzc2lnbiAoIHJlc3VsdCwge1xuICAgICAgICAgICAgICAgICAgICBjb250ZXh0OiBhcmd1bWVudHMgWzBdLFxuICAgICAgICAgICAgICAgICAgICB0eXBlICAgOiBhcmd1bWVudHMgWzFdLFxuICAgICAgICAgICAgICAgICAgICBpZCAgICAgOiBhcmd1bWVudHMgWzJdLFxuICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICB9XG4gICAgIH1cbn1cbiIsIlxuaW1wb3J0IHsgRGF0YWJhc2UgfSBmcm9tIFwiLi9kYi5qc1wiXG5pbXBvcnQgeyBEYXRhVHJlZSwgUGF0aCB9IGZyb20gXCIuL2RhdGEtdHJlZS5qc1wiXG5cbmltcG9ydCB7IE9wdGlvbmFsIH0gZnJvbSBcIi4uL0xpYi9pbmRleC5qc1wiXG5cblxudHlwZSBJdGVtIDxUID0gYW55LCAkIGV4dGVuZHMgJE5vZGUgPSAkTm9kZT4gPVxue1xuICAgICBtdWx0aXBsZTogYm9vbGVhblxuICAgICBpbnN0YW5jZXM6IFQgW11cbiAgICAgY29uc3RydWN0b3I6IG5ldyAoIGRhdGE6ICQgKSA9PiBUXG59XG5cbnR5cGUgJEluIDxOIGV4dGVuZHMgJE5vZGUgPSAkTm9kZT4gPSBPcHRpb25hbCA8TiwgXCJjb250ZXh0XCI+XG5cbi8vZXhwb3J0IHR5cGUgQ3RvciA8TiBleHRlbmRzICROb2RlID0gJE5vZGUsIFQgPSBhbnk+ID0gbmV3ICggZGF0YTogTiApID0+IFRcbmV4cG9ydCB0eXBlIEN0b3IgPE4gZXh0ZW5kcyAkTm9kZSA9ICROb2RlLCBUID0gYW55PiA9IG5ldyAoIGRhdGE6IE4sIGNoaWxkcmVuPzogYW55IFtdICkgPT4gVFxuXG50eXBlIEFyZyA8Rj4gPSBGIGV4dGVuZHMgbmV3ICggZGF0YTogaW5mZXIgRCApID0+IGFueSA/IEQgOiBhbnlcblxuXG5leHBvcnQgY2xhc3MgRmFjdG9yeSA8RSA9IGFueSwgTiBleHRlbmRzICROb2RlID0gJE5vZGU+XG57XG4gICAgIGNvbnN0cnVjdG9yICggcmVhZG9ubHkgZGI6IERhdGFiYXNlIDxOPiApIHt9XG5cbiAgICAgcHJpdmF0ZSBjdG9ycyA9IG5ldyBEYXRhVHJlZSA8Q3RvciA8JE5vZGUsIEU+PiAoKVxuICAgICBwcml2YXRlIGluc3RzID0gIG5ldyBEYXRhVHJlZSA8RT4gKClcblxuXG4gICAgIGdldFBhdGggKCBub2RlOiAkTm9kZSApICAgICAgICA6IFBhdGhcbiAgICAgZ2V0UGF0aCAoIHBhdGg6IFBhdGggKSAgICAgICAgIDogUGF0aFxuICAgICBnZXRQYXRoICggLi4uIHBhdGg6IHN0cmluZyBbXSApOiBQYXRoXG5cbiAgICAgZ2V0UGF0aCAoKVxuICAgICB7XG4gICAgICAgICAgaWYgKCBhcmd1bWVudHMubGVuZ3RoID09IDAgKVxuICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yICggXCJOdWxsIGFyZ3VtZW50XCIgKVxuXG4gICAgICAgICAgY29uc3QgYXJnICA9IGFyZ3VtZW50cyBbMF1cblxuICAgICAgICAgIGlmICggdHlwZW9mIGFyZyA9PSBcInN0cmluZ1wiIClcbiAgICAgICAgICAgICAgIHJldHVybiBhcmd1bWVudHMgYXMgUGF0aFxuXG4gICAgICAgICAgaWYgKCBBcnJheS5pc0FycmF5ICggYXJnKSApXG4gICAgICAgICAgICAgICByZXR1cm4gYXJnLmZsYXQgKCkgYXMgUGF0aFxuXG4gICAgICAgICAgcmV0dXJuIFsgYXJnLmNvbnRleHQsIGFyZy50eXBlLCBhcmcuaWQgXSBhcyBQYXRoXG4gICAgIH1cblxuICAgICBpblN0b2NrICggbm9kZTogJE5vZGUgKSAgICAgICAgOiBib29sZWFuXG4gICAgIGluU3RvY2sgKCBwYXRoOiBQYXRoICkgICAgICAgICA6IGJvb2xlYW5cbiAgICAgaW5TdG9jayAoIC4uLiBwYXRoOiBzdHJpbmcgW10gKTogYm9vbGVhblxuXG4gICAgIGluU3RvY2sgKCk6IGJvb2xlYW5cbiAgICAge1xuICAgICAgICAgIHJldHVybiB0aGlzLmluc3RzLmhhcyAoIHRoaXMuZ2V0UGF0aCAoIC4uLiBhcmd1bWVudHMgKSBhcyBQYXRoIClcbiAgICAgfVxuICAgICBfaW5TdG9jayAoIHBhdGg6IFBhdGggKVxuICAgICB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuaW5zdHMuaGFzICggcGF0aCApXG4gICAgIH1cblxuICAgICBkZWZpbmUgPEYgZXh0ZW5kcyBDdG9yPiAoIGN0b3I6IEYsIG5vZGU6IEFyZyA8Rj4gKSAgICAgIDogdm9pZFxuICAgICBkZWZpbmUgPEYgZXh0ZW5kcyBDdG9yPiAoIGN0b3I6IEYsIHBhdGg6IFBhdGggKSAgICAgICAgIDogdm9pZFxuICAgICBkZWZpbmUgPEYgZXh0ZW5kcyBDdG9yPiAoIGN0b3I6IEYsIC4uLiBwYXRoOiBzdHJpbmcgW10gKTogdm9pZFxuXG4gICAgIGRlZmluZSAoIGN0b3I6IEN0b3IsIC4uLiByZXN0OiBhbnkgW10gKVxuICAgICB7XG4gICAgICAgICAgdmFyIHBhdGggPSB0aGlzLmdldFBhdGggKCAuLi4gcmVzdCApXG5cbiAgICAgICAgICBpZiAoIHRoaXMuY3RvcnMuaGFzICggcGF0aCApIClcbiAgICAgICAgICAgICAgIHRocm93IFwiQmFkIGFyZ3VtZW50XCJcblxuICAgICAgICAgIHJldHVybiB0aGlzLmN0b3JzLnNldCAoIHBhdGgsIGN0b3IgKVxuICAgICB9XG4gICAgIF9kZWZpbmUgKCBjdG9yOiBDdG9yLCBwYXRoOiBQYXRoIClcbiAgICAge1xuICAgICAgICAgIGlmICggdGhpcy5jdG9ycy5oYXMgKCBwYXRoICkgKVxuICAgICAgICAgICAgICAgdGhyb3cgXCJCYWQgYXJndW1lbnRcIlxuXG4gICAgICAgICAgcmV0dXJuIHRoaXMuY3RvcnMuc2V0ICggcGF0aCwgY3RvciApXG4gICAgIH1cblxuICAgICBwaWNrIDxSIGV4dGVuZHMgRSwgJCBleHRlbmRzIE4gPSBOPiAoIG5vZGU6ICROb2RlICk6IFJcbiAgICAgcGljayA8UiBleHRlbmRzIEU+ICggLi4uIHBhdGg6IHN0cmluZyBbXSApICAgICAgICAgOiBSXG4gICAgIHBpY2sgPFIgZXh0ZW5kcyBFPiAoIHBhdGg6IFBhdGggKSAgICAgICAgICAgICAgICAgIDogUlxuXG4gICAgIHBpY2sgKCk6IEVcbiAgICAge1xuICAgICAgICAgIHZhciBwYXRoID0gdGhpcy5nZXRQYXRoICggLi4uIGFyZ3VtZW50cyApXG5cbiAgICAgICAgICBpZiAoIHRoaXMuaW5zdHMuaGFzICggcGF0aCApIClcbiAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmluc3RzLmdldCAoIHBhdGggKVxuXG4gICAgICAgICAgdGhyb3cgXCJCYWQgYXJndW1lbnRcIlxuICAgICB9XG4gICAgIF9waWNrICggcGF0aDogUGF0aCApXG4gICAgIHtcbiAgICAgICAgICBpZiAoIHRoaXMuaW5zdHMuaGFzICggcGF0aCApIClcbiAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmluc3RzLmdldCAoIHBhdGggKVxuXG4gICAgICAgICAgdGhyb3cgXCJCYWQgYXJndW1lbnRcIlxuICAgICB9XG5cbiAgICAgbWFrZSA8UiBleHRlbmRzIEUsICQgZXh0ZW5kcyBOID0gTj4gKCBub2RlOiAkICk6IFJcbiAgICAgbWFrZSA8UiBleHRlbmRzIEU+ICggcGF0aDogUGF0aCApICAgICAgICAgICAgICA6IFJcbiAgICAgbWFrZSA8UiBleHRlbmRzIEU+ICggLi4uIHBhdGg6IHN0cmluZyBbXSApICAgICA6IFJcblxuICAgICBtYWtlICgpOiBFXG4gICAgIHtcbiAgICAgICAgICB2YXIgcGF0aCA9IHRoaXMuZ2V0UGF0aCAoIC4uLiBhcmd1bWVudHMgKVxuXG4gICAgICAgICAgY29uc3QgYXJnICA9IGFyZ3VtZW50cyBbMF1cblxuICAgICAgICAgIGlmICggdHlwZW9mIGFyZyA9PSBcIm9iamVjdFwiICYmICEgQXJyYXkuaXNBcnJheSAoYXJnKSApXG4gICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fbWFrZSAoIHBhdGgsIGFyZyApXG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX21ha2UgKCBwYXRoIClcbiAgICAgfVxuICAgICBfbWFrZSAoIHBhdGg6IFBhdGgsIGRhdGE/OiBQYXJ0aWFsIDxOPiApXG4gICAgIHtcbiAgICAgICAgICBpZiAoIHRoaXMuaW5zdHMuaGFzICggcGF0aCApIClcbiAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmluc3RzLmdldCAoIHBhdGggKVxuXG4gICAgICAgICAgY29uc3QgY3RvciA9IHRoaXMuY3RvcnMubmVhciAoIHBhdGggKVxuXG4gICAgICAgICAgaWYgKCBjdG9yID09IHVuZGVmaW5lZCApXG4gICAgICAgICAgICAgICB0aHJvdyBcIkJhZCBhcmd1bWVudFwiXG5cbiAgICAgICAgICBjb25zdCB0bXAgPSB0aGlzLmRiLmdldCAoIC4uLiBwYXRoIClcblxuICAgICAgICAgIGRhdGEgPSBkYXRhID09IHVuZGVmaW5lZFxuICAgICAgICAgICAgICAgPyB0bXBcbiAgICAgICAgICAgICAgIDogT2JqZWN0LmFzc2lnbiAoIHRtcCwgZGF0YSApXG5cbiAgICAgICAgICByZXR1cm4gdGhpcy5pbnN0cy5zZXQgKCBwYXRoLCBuZXcgY3RvciAoIGRhdGEgYXMgTiApIClcbiAgICAgfVxufVxuIiwiXG5pbXBvcnQgeyBTaGFwZSB9IGZyb20gXCIuL0VsZW1lbnQvc2hhcGUuanNcIlxuLy9pbXBvcnQgKiBhcyBGYWN0b3J5IGZyb20gXCIuL2ZhY3RvcnkuanNcIlxuXG5kZWNsYXJlIGdsb2JhbFxue1xuICAgICB0eXBlIEdlb21ldHJ5TmFtZXMgPSBrZXlvZiB0eXBlb2YgRmFjdG9yeVxuXG4gICAgIGludGVyZmFjZSAkR2VvbWV0cnlcbiAgICAge1xuICAgICAgICAgIHNoYXBlOiBHZW9tZXRyeU5hbWVzXG4gICAgICAgICAgeCAgICAgICAgIDogbnVtYmVyXG4gICAgICAgICAgeSAgICAgICAgIDogbnVtYmVyXG5cbiAgICAgICAgICBib3JkZXJXaWR0aCAgICA6IG51bWJlclxuICAgICAgICAgIGJvcmRlckNvbG9yICAgIDogc3RyaW5nXG5cbiAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3IgOiBzdHJpbmdcbiAgICAgICAgICBiYWNrZ3JvdW5kSW1hZ2UgOiBzdHJpbmdcbiAgICAgICAgICBiYWNrZ3JvdW5kUmVwZWF0OiBib29sZWFuXG4gICAgIH1cblxuICAgICBpbnRlcmZhY2UgJFRleHREZWZpbml0aW9uIGV4dGVuZHMgJEdlb21ldHJ5XG4gICAgIHtcbiAgICAgICAgICB0ZXh0OiBzdHJpbmdcbiAgICAgfVxuXG4gICAgIGludGVyZmFjZSAkUGF0aERlZmluaXRpb24gZXh0ZW5kcyAkR2VvbWV0cnlcbiAgICAge1xuICAgICAgICAgIHBhdGg6IHN0cmluZ1xuICAgICB9XG59XG5cbmNvbnN0IGZhYnJpY19iYXNlX29idGlvbnM6IGZhYnJpYy5JT2JqZWN0T3B0aW9ucyA9IHtcbiAgICAgbGVmdCAgIDogMCxcbiAgICAgdG9wICAgIDogMCxcbiAgICAgb3JpZ2luWDogXCJjZW50ZXJcIixcbiAgICAgb3JpZ2luWTogXCJjZW50ZXJcIixcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdyb3VwICggZGVmOiAkR2VvbWV0cnksIHNpemU6IG51bWJlciwgb3B0OiBmYWJyaWMuSUNpcmNsZU9wdGlvbnMgKVxue1xuICAgICByZXR1cm4gbmV3IGZhYnJpYy5Hcm91cCAoIHVuZGVmaW5lZCxcbiAgICAge1xuICAgICAgICAgIC4uLiBmYWJyaWNfYmFzZV9vYnRpb25zLFxuICAgICAgICAgIC4uLiBvcHQsXG4gICAgICAgICAgd2lkdGg6IHNpemUsXG4gICAgICAgICAgaGVpZ2h0OiBzaXplLFxuICAgICB9KVxufVxuXG4vLyBUbyBnZXQgcG9pbnRzIG9mIHRyaWFuZ2xlLCBzcXVhcmUsIFtwYW50YXxoZXhhXWdvblxuLy9cbi8vIHZhciBhID0gTWF0aC5QSSoyLzRcbi8vIGZvciAoIHZhciBpID0gMCA7IGkgIT0gNCA7IGkrKyApXG4vLyAgICAgY29uc29sZS5sb2cgKCBgWyAkeyBNYXRoLnNpbihhKmkpIH0sICR7IE1hdGguY29zKGEqaSkgfSBdYCApXG5cbmV4cG9ydCBmdW5jdGlvbiBjaXJjbGUgKCBkZWY6ICRHZW9tZXRyeSwgc2l6ZTogbnVtYmVyLCBvcHQ6IGZhYnJpYy5JQ2lyY2xlT3B0aW9ucyApXG57XG5cbiAgICAgcmV0dXJuIG5ldyBmYWJyaWMuQ2lyY2xlIChcbiAgICAge1xuICAgICAgICAgIC4uLiBmYWJyaWNfYmFzZV9vYnRpb25zLFxuICAgICAgICAgIC4uLiBvcHQsXG4gICAgICAgICAgcmFkaXVzOiBzaXplIC8gMixcbiAgICAgfSlcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRyaWFuZ2xlICggZGVmOiAkR2VvbWV0cnksIHNpemU6IG51bWJlciwgb3B0OiBmYWJyaWMuSVRyaWFuZ2xlT3B0aW9ucyApXG57XG4gICAgIGNvbnN0IHBvaW50cyA9IFtdXG4gICAgIGNvbnN0IHNjYWxlID0gMS4yXG4gICAgIGNvbnN0IHIgPSBzaXplIC8gMiAqIHNjYWxlXG5cbiAgICAgZm9yICggY29uc3QgcCBvZiBbXG4gICAgICAgICAgWyAwLCAxIF0sXG4gICAgICAgICAgWyAwLjg2NjAyNTQwMzc4NDQzODcsIC0wLjQ5OTk5OTk5OTk5OTk5OTggXSxcbiAgICAgICAgICBbIC0wLjg2NjAyNTQwMzc4NDQzODUsIC0wLjUwMDAwMDAwMDAwMDAwMDQgXVxuICAgICBdKSBwb2ludHMucHVzaCAoeyB4OiBwWzBdICogciwgeTogcFsxXSAqIHIgfSlcblxuICAgICByZXR1cm4gbmV3IGZhYnJpYy5Qb2x5Z29uICggcG9pbnRzLCB7XG4gICAgICAgICAgLi4uIGZhYnJpY19iYXNlX29idGlvbnMsXG4gICAgICAgICAgLi4uIG9wdCxcbiAgICAgICAgICBhbmdsZTogMTgwLFxuICAgICB9KVxufVxuXG5leHBvcnQgZnVuY3Rpb24gc3F1YXJlICggZGVmOiAkR2VvbWV0cnksIHNpemU6IG51bWJlciwgb3B0OiBmYWJyaWMuSVJlY3RPcHRpb25zIClcbntcbiAgICAgY29uc3Qgc2NhbGUgPSAwLjlcbiAgICAgcmV0dXJuIG5ldyBmYWJyaWMuUmVjdCAoXG4gICAgIHtcbiAgICAgICAgICAuLi4gZmFicmljX2Jhc2Vfb2J0aW9ucyxcbiAgICAgICAgICAuLi4gb3B0LFxuICAgICAgICAgIHdpZHRoIDogc2l6ZSAqIHNjYWxlLFxuICAgICAgICAgIGhlaWdodDogc2l6ZSAqIHNjYWxlLFxuICAgICB9KVxufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFudGFnb24gKCBkZWY6ICRHZW9tZXRyeSwgc2l6ZTogbnVtYmVyLCBvcHQ6IGZhYnJpYy5JT2JqZWN0T3B0aW9ucyApXG57XG4gICAgIGNvbnN0IHBvaW50cyA9IFtdXG4gICAgIGNvbnN0IHNjYWxlID0gMS4xXG4gICAgIGNvbnN0IHIgPSBzaXplIC8gMiAqIHNjYWxlXG5cbiAgICAgZm9yICggY29uc3QgcCBvZiBbXG4gICAgICAgICAgWyAwLCAxIF0sXG4gICAgICAgICAgWyAwLjk1MTA1NjUxNjI5NTE1MzUsIDAuMzA5MDE2OTk0Mzc0OTQ3NDUgXSxcbiAgICAgICAgICBbIDAuNTg3Nzg1MjUyMjkyNDczMiwgLTAuODA5MDE2OTk0Mzc0OTQ3MyBdLFxuICAgICAgICAgIFsgLTAuNTg3Nzg1MjUyMjkyNDczLCAtMC44MDkwMTY5OTQzNzQ5NDc1IF0sXG4gICAgICAgICAgWyAtMC45NTEwNTY1MTYyOTUxNTM2LCAwLjMwOTAxNjk5NDM3NDk0NzIzIF1cbiAgICAgXSkgcG9pbnRzLnB1c2ggKHsgeDogcFswXSAqIHIsIHk6IHBbMV0gKiByIH0pXG5cbiAgICAgcmV0dXJuIG5ldyBmYWJyaWMuUG9seWdvbiAoIHBvaW50cywge1xuICAgICAgICAgIC4uLiBmYWJyaWNfYmFzZV9vYnRpb25zLFxuICAgICAgICAgIC4uLiBvcHQsXG4gICAgICAgICAgYW5nbGU6IDE4MCxcbiAgICAgfSlcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGhleGFnb24gKCBkZWY6ICRHZW9tZXRyeSwgc2l6ZTogbnVtYmVyLCBvcHQ6IGZhYnJpYy5JT2JqZWN0T3B0aW9ucyApXG57XG4gICAgIGNvbnN0IHBvaW50cyA9IFtdXG4gICAgIGNvbnN0IHNjYWxlID0gMS4xXG4gICAgIGNvbnN0IHIgPSBzaXplIC8gMiAqIHNjYWxlXG5cbiAgICAgZm9yICggY29uc3QgcCBvZiBbXG4gICAgICAgICAgWyAwLCAxIF0sXG4gICAgICAgICAgWyAwLjg2NjAyNTQwMzc4NDQzODYsIDAuNTAwMDAwMDAwMDAwMDAwMSBdLFxuICAgICAgICAgIFsgMC44NjYwMjU0MDM3ODQ0Mzg3LCAtMC40OTk5OTk5OTk5OTk5OTk4IF0sXG4gICAgICAgICAgWyAxLjIyNDY0Njc5OTE0NzM1MzJlLTE2LCAtMSBdLFxuICAgICAgICAgIFsgLTAuODY2MDI1NDAzNzg0NDM4NSwgLTAuNTAwMDAwMDAwMDAwMDAwNCBdLFxuICAgICAgICAgIFsgLTAuODY2MDI1NDAzNzg0NDM5LCAwLjQ5OTk5OTk5OTk5OTk5OTMzIF0sXG4gICAgIF0pIHBvaW50cy5wdXNoICh7IHg6IHBbMF0gKiByLCB5OiBwWzFdICogciB9KVxuXG4gICAgIHJldHVybiBuZXcgZmFicmljLlBvbHlnb24gKCBwb2ludHMsIHtcbiAgICAgICAgICAuLi4gZmFicmljX2Jhc2Vfb2J0aW9ucyxcbiAgICAgICAgICAuLi4gb3B0LFxuICAgICAgICAgIGFuZ2xlOiA5MCxcbiAgICAgfSlcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRleHQgKCBkZWY6ICRUZXh0RGVmaW5pdGlvbiwgc2l6ZTogbnVtYmVyLCBvcHQ6IGZhYnJpYy5UZXh0T3B0aW9ucyApXG57XG4gICAgIHJldHVybiBuZXcgZmFicmljLlRleHQgKCBcIi4uLlwiLCB7XG4gICAgICAgICAgLi4uIGZhYnJpY19iYXNlX29idGlvbnMsXG4gICAgICAgICAgLi4uIG9wdCxcbiAgICAgICAgICBmb250U2l6ZTogc2l6ZSxcbiAgICAgfSlcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRleHRib3ggKCBkZWY6ICRUZXh0RGVmaW5pdGlvbiwgc2l6ZTogbnVtYmVyLCBvcHQ6IGZhYnJpYy5UZXh0T3B0aW9ucyApXG57XG4gICAgIHJldHVybiBuZXcgZmFicmljLlRleHRib3ggKCBcIi4uLlwiLCB7XG4gICAgICAgICAgLi4uIGZhYnJpY19iYXNlX29idGlvbnMsXG4gICAgICAgICAgLi4uIG9wdCxcbiAgICAgICAgICBmb250U2l6ZTogc2l6ZSxcbiAgICAgfSlcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhdGggKCBkZWY6ICRQYXRoRGVmaW5pdGlvbiwgc2l6ZTogbnVtYmVyLCBvcHQ6IGZhYnJpYy5JT2JqZWN0T3B0aW9ucyApXG57XG4gICAgIHJldHVybiBuZXcgZmFicmljLlBhdGggKCBkZWYucGF0aCxcbiAgICAge1xuICAgICAgICAgIC4uLiBmYWJyaWNfYmFzZV9vYnRpb25zLFxuICAgICAgICAgIC4uLiBvcHQsXG4gICAgICAgICAgc2NhbGVYOiBzaXplIC8gMTAwLCAvLyBFbiBzdXBwb3NhbnQgcXVlIGxlIHZpZXdCb3hcbiAgICAgICAgICBzY2FsZVk6IHNpemUgLyAxMDAsIC8vIGVzdCBcIjAgMCAxMDAgMTAwXCJcbiAgICAgfSlcbn1cblxuY29uc3QgRmFjdG9yeSA9IHtcbiAgICAgZ3JvdXAsXG4gICAgIGNpcmNsZSxcbiAgICAgdHJpYW5nbGUsXG4gICAgIHNxdWFyZSxcbiAgICAgcGFudGFnb24sXG4gICAgIGhleGFnb24gLFxuICAgICB0ZXh0LFxuICAgICB0ZXh0Ym94ICxcbiAgICAgcGF0aCxcbn1cblxuXG5leHBvcnQgY2xhc3MgR2VvbWV0cnkgPFQgZXh0ZW5kcyBHZW9tZXRyeU5hbWVzID0gR2VvbWV0cnlOYW1lcz5cbntcbiAgICAgY29uZmlnOiAkR2VvbWV0cnlcbiAgICAgb2JqZWN0OiBSZXR1cm5UeXBlIDx0eXBlb2YgRmFjdG9yeSBbVF0+XG5cbiAgICAgY29uc3RydWN0b3IgKCByZWFkb25seSBvd25lcjogU2hhcGUgKVxuICAgICB7XG4gICAgICAgICAgdGhpcy5jb25maWcgPSBvd25lci5jb25maWdcbiAgICAgICAgICB0aGlzLnVwZGF0ZVNoYXBlICgpXG4gICAgIH1cblxuICAgICB1cGRhdGUgKCBvcHRpb25zOiBQYXJ0aWFsIDwkR2VvbWV0cnk+IClcbiAgICAge1xuICAgICAgICAgIE9iamVjdC5hc3NpZ24gKCB0aGlzLmNvbmZpZywgb3B0aW9ucyApXG5cbiAgICAgICAgICBpZiAoIFwic2hhcGVcIiBpbiBvcHRpb25zIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVNoYXBlICgpXG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2UgaWYgKCBcImJhY2tncm91bmRJbWFnZVwiIGluIG9wdGlvbnMgfHwgXCJiYWNrZ3JvdW5kUmVwZWF0XCIgaW4gb3B0aW9ucyApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgdGhpcy51cGRhdGVCYWNrZ3JvdW5kSW1hZ2UgKClcbiAgICAgICAgICB9XG4gICAgIH1cblxuICAgICB1cGRhdGVQb3NpdGlvbiAoKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgeyBjb25maWcsIG9iamVjdCB9ID0gdGhpc1xuXG4gICAgICAgICAgOyhvYmplY3QgYXMgZmFicmljLk9iamVjdCkuc2V0ICh7XG4gICAgICAgICAgICAgICBsZWZ0OiBjb25maWcueCxcbiAgICAgICAgICAgICAgIHRvcCA6IGNvbmZpZy55LFxuICAgICAgICAgIH0pXG4gICAgICAgICAgLnNldENvb3JkcyAoKVxuICAgICB9XG5cbiAgICAgdXBkYXRlU2l6ZSAoKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgeyBvd25lciwgY29uZmlnLCBvYmplY3QgfSA9IHRoaXNcblxuICAgICAgICAgIGNvbnN0IHNpemUgPSBvd25lci5kaXNwbGF5U2l6ZSAoKVxuXG4gICAgICAgICAgaWYgKCBjb25maWcuc2hhcGUgPT0gXCJjaXJjbGVcIiApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgKG9iamVjdCBhcyBmYWJyaWMuQ2lyY2xlKS5zZXQgKHtcbiAgICAgICAgICAgICAgICAgICAgcmFkaXVzOiBzaXplIC8gMlxuICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIChvYmplY3QgYXMgZmFicmljLk9iamVjdCkuc2V0ICh7XG4gICAgICAgICAgICAgICAgICAgIHdpZHRoIDogc2l6ZSxcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiBzaXplLFxuICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBvYmplY3Quc2V0Q29vcmRzICgpXG4gICAgIH1cblxuICAgICB1cGRhdGVTaGFwZSAoIHNoYXBlPzogR2VvbWV0cnlOYW1lcyApXG4gICAgIHtcbiAgICAgICAgICBjb25zdCB7IGNvbmZpZywgb3duZXIgfSA9IHRoaXNcblxuICAgICAgICAgIGlmICggYXJndW1lbnRzLmxlbmd0aCA9PSAwIClcbiAgICAgICAgICAgICAgIHNoYXBlID0gY29uZmlnLnNoYXBlXG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgY29uZmlnLnNoYXBlID0gc2hhcGVcblxuICAgICAgICAgIGlmICggb3duZXIuZ3JvdXAgIT0gdW5kZWZpbmVkICYmIHRoaXMub2JqZWN0ICE9IHVuZGVmaW5lZCApXG4gICAgICAgICAgICAgICBvd25lci5ncm91cC5yZW1vdmUgKCB0aGlzLm9iamVjdCApXG5cbiAgICAgICAgICBjb25zdCBvYmogPSB0aGlzLm9iamVjdFxuICAgICAgICAgICAgICAgICAgICA9IEZhY3RvcnkgW2NvbmZpZy5zaGFwZSBhcyBhbnldICggY29uZmlnLCBvd25lci5kaXNwbGF5U2l6ZSAoKSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgIGxlZnQgICAgICAgOiAwLCAvL2NvbmZpZy54LFxuICAgICAgICAgICAgICAgICAgICAgICAgIHRvcCAgICAgICAgOiAwLCAvL2NvbmZpZy55LFxuICAgICAgICAgICAgICAgICAgICAgICAgIG9yaWdpblggICAgOiBcImNlbnRlclwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgIG9yaWdpblkgICAgOiBcImNlbnRlclwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgIGZpbGwgICAgICAgOiBjb25maWcuYmFja2dyb3VuZENvbG9yLFxuICAgICAgICAgICAgICAgICAgICAgICAgIHN0cm9rZSAgICAgOiBjb25maWcuYm9yZGVyQ29sb3IsXG4gICAgICAgICAgICAgICAgICAgICAgICAgc3Ryb2tlV2lkdGg6IGNvbmZpZy5ib3JkZXJXaWR0aCxcbiAgICAgICAgICAgICAgICAgICAgfSlcblxuICAgICAgICAgIG93bmVyLmdyb3VwLmFkZCAoIG9iaiApXG4gICAgICAgICAgb2JqLnNlbmRUb0JhY2sgKClcblxuICAgICAgICAgIGlmICggY29uZmlnLmJhY2tncm91bmRJbWFnZSAhPSB1bmRlZmluZWQgKVxuICAgICAgICAgICAgICAgdGhpcy51cGRhdGVCYWNrZ3JvdW5kSW1hZ2UgKClcblxuICAgICAgICAgIGlmICggb2JqLmNhbnZhcyAhPSB1bmRlZmluZWQgKVxuICAgICAgICAgICAgICAgb2JqLmNhbnZhcy5yZXF1ZXN0UmVuZGVyQWxsICgpXG5cbiAgICAgfVxuXG4gICAgIHVwZGF0ZUJhY2tncm91bmRJbWFnZSAoIHBhdGg/OiBzdHJpbmcgKVxuICAgICB7XG4gICAgICAgICAgaWYgKCBhcmd1bWVudHMubGVuZ3RoID09IDAgKVxuICAgICAgICAgICAgICAgcGF0aCA9IHRoaXMuY29uZmlnLmJhY2tncm91bmRJbWFnZVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgIHRoaXMuY29uZmlnLmJhY2tncm91bmRJbWFnZSA9IHBhdGhcblxuICAgICAgICAgIGlmICggdHlwZW9mIHBhdGggPT0gXCJzdHJpbmdcIiAmJiBwYXRoLmxlbmd0aCA+IDAgKVxuICAgICAgICAgICAgICAgZmFicmljLnV0aWwubG9hZEltYWdlICggcGF0aCwgdGhpcy5vbl9wYXR0ZXJuLmJpbmQgKHRoaXMpIClcbiAgICAgfVxuXG4gICAgIHByaXZhdGUgb25fcGF0dGVybiAoIGRpbWc6IEhUTUxJbWFnZUVsZW1lbnQgKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgeyBvd25lciB9ID0gdGhpc1xuXG4gICAgICAgICAgY29uc3QgZmFjdG9yID0gZGltZy53aWR0aCA8IGRpbWcuaGVpZ2h0XG4gICAgICAgICAgICAgICAgICAgICAgICAgPyBvd25lci5kaXNwbGF5U2l6ZSAoKSAvIGRpbWcud2lkdGhcbiAgICAgICAgICAgICAgICAgICAgICAgICA6IG93bmVyLmRpc3BsYXlTaXplICgpIC8gZGltZy5oZWlnaHRcblxuICAgICAgICAgIDsodGhpcy5vYmplY3QgYXMgYW55KS5zZXQgKHtcbiAgICAgICAgICAgICAgIGZpbGw6IG5ldyBmYWJyaWMuUGF0dGVybiAoe1xuICAgICAgICAgICAgICAgICAgICBzb3VyY2U6IGRpbWcsXG4gICAgICAgICAgICAgICAgICAgIHJlcGVhdDogXCJuby1yZXBlYXRcIixcbiAgICAgICAgICAgICAgICAgICAgcGF0dGVyblRyYW5zZm9ybTogW1xuICAgICAgICAgICAgICAgICAgICAgICAgIGZhY3RvciwgMCwgMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICBmYWN0b3IsIDAsIDAsXG4gICAgICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgfSlcbiAgICAgICAgICAuc2V0Q29vcmRzICgpXG5cbiAgICAgICAgICBpZiAoIHRoaXMub2JqZWN0LmNhbnZhcyApXG4gICAgICAgICAgICAgICB0aGlzLm9iamVjdC5jYW52YXMucmVuZGVyQWxsICgpXG4gICAgIH1cbn1cbiIsIlxuaW1wb3J0IHsgR2VvbWV0cnkgfSBmcm9tIFwiLi4vZ2VvbWV0cnkuanNcIlxuaW1wb3J0IHsgQ3RvciBhcyBEYXRhQ3RvciB9IGZyb20gXCIuLi8uLi8uLi9EYXRhL2luZGV4LmpzXCJcblxuZGVjbGFyZSBnbG9iYWxcbntcbiAgICAgaW50ZXJmYWNlICRTaGFwZUV2ZW50cyA8RCBleHRlbmRzICROb2RlID0gYW55PlxuICAgICB7XG4gICAgICAgICAgb25DcmVhdGU6ICggZW50aXR5OiBELCBhc3BlY3Q6IFNoYXBlICkgPT4gdm9pZCxcbiAgICAgICAgICBvbkRlbGV0ZTogKCBlbnRpdHk6IEQsIHNoYXBlOiBTaGFwZSApID0+IHZvaWQsXG4gICAgICAgICAgb25Ub3VjaDogKCBhc3BlY3Q6IFNoYXBlICkgPT4gdm9pZFxuICAgICB9XG5cbiAgICAgaW50ZXJmYWNlICRTaGFwZSA8RCBleHRlbmRzICRUaGluZyA9ICRUaGluZz4gZXh0ZW5kcyAkTm9kZSwgJEdlb21ldHJ5LCAkU2hhcGVFdmVudHNcbiAgICAge1xuICAgICAgICAgIGNvbnRleHQ6IFwiY29uY2VwdC1hc3BlY3RcIlxuXG4gICAgICAgICAgZGF0YTogRFxuXG4gICAgICAgICAgbWluU2l6ZSAgIDogbnVtYmVyXG4gICAgICAgICAgc2l6ZU9mZnNldDogbnVtYmVyXG4gICAgICAgICAgc2l6ZUZhY3RvcjogbnVtYmVyXG4gICAgIH1cbn1cblxuZXhwb3J0IHR5cGUgQ3RvciA8RGF0YSBleHRlbmRzICRTaGFwZSA9ICRTaGFwZSwgVCBleHRlbmRzIFNoYXBlID0gU2hhcGU+ID0gRGF0YUN0b3IgPERhdGEsIFQ+XG5cbmV4cG9ydCBjbGFzcyBTaGFwZSA8JCBleHRlbmRzICRTaGFwZSA9ICRTaGFwZT5cbntcbiAgICAgZGVmYXVsdENvbmZpZyAoKTogJFNoYXBlXG4gICAgIHtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgY29udGV4dDogXCJjb25jZXB0LWFzcGVjdFwiLFxuICAgICAgICAgICAgICAgdHlwZSAgIDogXCJzaGFwZVwiLFxuICAgICAgICAgICAgICAgaWQgICAgIDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgZGF0YSAgIDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgeCAgICAgIDogMCxcbiAgICAgICAgICAgICAgIHkgICAgICA6IDAsXG4gICAgICAgICAgICAgICAvL3NpemUgICAgICA6IDIwLFxuICAgICAgICAgICAgICAgbWluU2l6ZSAgIDogMSxcbiAgICAgICAgICAgICAgIHNpemVGYWN0b3I6IDEsXG4gICAgICAgICAgICAgICBzaXplT2Zmc2V0OiAwLFxuXG4gICAgICAgICAgICAgICBzaGFwZSAgICAgICAgICAgOiBcImNpcmNsZVwiLFxuICAgICAgICAgICAgICAgYm9yZGVyQ29sb3IgICAgIDogXCJncmF5XCIsXG4gICAgICAgICAgICAgICBib3JkZXJXaWR0aCAgICAgOiA1LFxuXG4gICAgICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3IgOiBcInRyYW5zcGFyZW50XCIsXG4gICAgICAgICAgICAgICBiYWNrZ3JvdW5kSW1hZ2UgOiB1bmRlZmluZWQsXG4gICAgICAgICAgICAgICBiYWNrZ3JvdW5kUmVwZWF0OiBmYWxzZSxcblxuICAgICAgICAgICAgICAgb25DcmVhdGUgICAgICAgIDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgb25EZWxldGUgICAgICAgIDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgb25Ub3VjaCAgICAgICAgIDogdW5kZWZpbmVkLFxuICAgICAgICAgIH1cbiAgICAgfVxuXG4gICAgIHJlYWRvbmx5IGNvbmZpZzogJFxuXG4gICAgIGdyb3VwID0gdW5kZWZpbmVkIGFzIGZhYnJpYy5Hcm91cFxuXG4gICAgIHJlYWRvbmx5IGJhY2tncm91bmQ6IEdlb21ldHJ5XG4gICAgIHJlYWRvbmx5IGJvcmRlcjogR2VvbWV0cnlcblxuICAgICBjb25zdHJ1Y3RvciAoIGRhdGE6ICQgKVxuICAgICB7XG4gICAgICAgICAgdGhpcy5iYWNrZ3JvdW5kID0gdW5kZWZpbmVkXG4gICAgICAgICAgdGhpcy5ib3JkZXIgPSB1bmRlZmluZWRcbiAgICAgICAgICB0aGlzLmNvbmZpZyA9IHtcbiAgICAgICAgICAgICAgIC4uLiB0aGlzLmRlZmF1bHRDb25maWcgKCksXG4gICAgICAgICAgICAgICAuLi4gZGF0YVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbnN0IHsgY29uZmlnIH0gPSB0aGlzXG5cbiAgICAgICAgICBjb25zdCBncm91cCA9IHRoaXMuZ3JvdXAgPSBuZXcgZmFicmljLkdyb3VwICggW10sXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgd2lkdGggICAgICA6IHRoaXMuZGlzcGxheVNpemUgKCksXG4gICAgICAgICAgICAgICBoZWlnaHQgICAgIDogdGhpcy5kaXNwbGF5U2l6ZSAoKSxcbiAgICAgICAgICAgICAgIGxlZnQgICAgICAgOiBjb25maWcueCxcbiAgICAgICAgICAgICAgIHRvcCAgICAgICAgOiBjb25maWcueSxcbiAgICAgICAgICAgICAgIGhhc0JvcmRlcnMgOiB0cnVlLFxuICAgICAgICAgICAgICAgaGFzQ29udHJvbHM6IHRydWUsXG4gICAgICAgICAgICAgICBvcmlnaW5YICAgIDogXCJjZW50ZXJcIixcbiAgICAgICAgICAgICAgIG9yaWdpblkgICAgOiBcImNlbnRlclwiLFxuICAgICAgICAgIH0pXG5cbiAgICAgICAgICA7KHRoaXMuYmFja2dyb3VuZCBhcyBHZW9tZXRyeSkgPSBuZXcgR2VvbWV0cnkgKCB0aGlzIClcblxuICAgICAgICAgIGdyb3VwLnNldENvb3JkcyAoKVxuICAgICB9XG5cbiAgICAgZGlzcGxheVNpemUgKClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IHRoaXMuY29uZmlnXG5cbiAgICAgICAgICB2YXIgc2l6ZSA9ICgxICsgY29uZmlnLnNpemVPZmZzZXQpICogY29uZmlnLnNpemVGYWN0b3JcblxuICAgICAgICAgIGlmICggc2l6ZSA8IGNvbmZpZy5taW5TaXplIClcbiAgICAgICAgICAgICAgIHNpemUgPSBjb25maWcubWluU2l6ZVxuXG4gICAgICAgICAgcmV0dXJuIHNpemUgfHwgMVxuICAgICB9XG5cbiAgICAgdXBkYXRlU2l6ZSAoKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgeyBncm91cCwgY29uZmlnIH0gPSB0aGlzXG5cbiAgICAgICAgICBpZiAoIHRoaXMuYmFja2dyb3VuZCApXG4gICAgICAgICAgICAgICB0aGlzLmJhY2tncm91bmQudXBkYXRlU2l6ZSAoKVxuXG4gICAgICAgICAgaWYgKCB0aGlzLmJvcmRlciApXG4gICAgICAgICAgICAgICB0aGlzLmJvcmRlci51cGRhdGVTaXplICgpXG5cbiAgICAgICAgICBncm91cC5zZXQgKHtcbiAgICAgICAgICAgICAgIHdpZHRoIDogdGhpcy5kaXNwbGF5U2l6ZSAoKSxcbiAgICAgICAgICAgICAgIGhlaWdodDogdGhpcy5kaXNwbGF5U2l6ZSAoKSxcbiAgICAgICAgICB9KVxuXG4gICAgICAgICAgaWYgKCBncm91cC5jYW52YXMgKVxuICAgICAgICAgICAgICAgZ3JvdXAuY2FudmFzLnJlcXVlc3RSZW5kZXJBbGwgKClcbiAgICAgfVxuXG4gICAgIGNvb3JkcyAoKVxuICAgICB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuZ3JvdXAuZ2V0Q29vcmRzICgpXG4gICAgIH1cblxuICAgICBzZXRCYWNrZ3JvdW5kICggb3B0aW9uczogUGFydGlhbCA8JEdlb21ldHJ5PiApXG4gICAgIHtcbiAgICAgICAgICBPYmplY3QuYXNzaWduICggdGhpcy5jb25maWcsIG9wdGlvbnMgKVxuXG4gICAgICAgICAgdGhpcy5iYWNrZ3JvdW5kLnVwZGF0ZSAoIG9wdGlvbnMgKVxuXG4gICAgICAgICAgdGhpcy51cGRhdGVTaXplICgpXG4gICAgIH1cblxuICAgICBzZXRQb3NpdGlvbiAoIHg6IG51bWJlciwgeTogbnVtYmVyIClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHsgZ3JvdXAsIGNvbmZpZyB9ID0gdGhpc1xuXG4gICAgICAgICAgY29uZmlnLnggPSB4XG4gICAgICAgICAgY29uZmlnLnkgPSB5XG4gICAgICAgICAgZ3JvdXAuc2V0ICh7IGxlZnQ6IHgsIHRvcCA6IHkgfSkuc2V0Q29vcmRzICgpXG5cbiAgICAgICAgICBpZiAoIGdyb3VwLmNhbnZhcyApXG4gICAgICAgICAgICAgICBncm91cC5jYW52YXMucmVxdWVzdFJlbmRlckFsbCAoKVxuICAgICB9XG5cbiAgICAgaG92ZXIgKCB1cDogYm9vbGVhbiApXG4gICAgIHtcbiAgICAgICAgICBjb25zdCB0YXJnZXQgPSB0aGlzLmJhY2tncm91bmQgIT0gdW5kZWZpbmVkXG4gICAgICAgICAgICAgICAgICAgICAgICAgPyB0aGlzLmJhY2tncm91bmQub2JqZWN0XG4gICAgICAgICAgICAgICAgICAgICAgICAgOiB0aGlzLmdyb3VwXG5cbiAgICAgICAgICB0YXJnZXQuc2V0U2hhZG93KCAncmdiYSgwLDAsMCwwLjMpJyApXG5cbiAgICAgICAgICBmYWJyaWMudXRpbC5hbmltYXRlKHtcbiAgICAgICAgICAgICAgIHN0YXJ0VmFsdWU6IHVwID8gMCA6IDEsXG4gICAgICAgICAgICAgICBlbmRWYWx1ZSAgOiB1cCA/IDEgOiAwLFxuICAgICAgICAgICAgICAgZWFzaW5nICAgIDogZmFicmljLnV0aWwuZWFzZS5lYXNlT3V0Q3ViaWMsXG4gICAgICAgICAgICAgICBieVZhbHVlICAgOiB1bmRlZmluZWQsXG4gICAgICAgICAgICAgICBkdXJhdGlvbiAgOiAxMDAsXG4gICAgICAgICAgICAgICBvbkNoYW5nZSAgOiAoIHZhbHVlOiBudW1iZXIgKSA9PlxuICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBvZmZzZXQgPSAxICogdmFsdWVcblxuICAgICAgICAgICAgICAgICAgICB0YXJnZXQuc2V0U2hhZG93KCBgJHsgb2Zmc2V0IH1weCAkeyBvZmZzZXQgfXB4ICR7IDEwICogdmFsdWUgfXB4IHJnYmEoMCwwLDAsMC4zKWAgKVxuICAgICAgICAgICAgICAgICAgICB0YXJnZXQuc2NhbGUoIDEgKyAwLjEgKiB2YWx1ZSApXG4gICAgICAgICAgICAgICAgICAgIHRhcmdldC5jYW52YXMucmVxdWVzdFJlbmRlckFsbCAoKVxuICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICB9KVxuICAgICB9XG5cbiAgICAgdG9Kc29uICgpXG4gICAgIHtcbiAgICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkgKCB0aGlzLmNvbmZpZyApXG4gICAgIH1cbn1cbiIsIi8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uL3R5cGluZ3MuZC50c1wiIC8+XG4vL2ltcG9ydCAqIGFzIGZhYnJpYyBmcm9tIFwiZmFicmljL2ZhYnJpYy1pbXBsXCJcblxuaW1wb3J0IHsgRGF0YWJhc2UsIEZhY3RvcnkgfSBmcm9tIFwiLi4vLi4vRGF0YS9pbmRleC5qc1wiXG5pbXBvcnQgeyBTaGFwZSB9IGZyb20gXCIuL0VsZW1lbnQvc2hhcGUuanNcIlxuaW1wb3J0IHsgV3JpdGFibGUsIE9wdGlvbmFsIH0gZnJvbSBcIi4uLy4uL0xpYi9pbmRleC5qc1wiXG5cblxuY29uc3QgQ09OVEVYVCA9IFwiY29uY2VwdC1hc3BlY3RcIlxuY29uc3QgZGIgICAgICA9IG5ldyBEYXRhYmFzZSAoKVxuY29uc3QgZmFjdG9yeSA9IG5ldyBGYWN0b3J5IDxTaGFwZT4gKCBkYiApXG5jb25zdCBBU1BFQ1QgID0gU3ltYm9sLmZvciAoIFwiQVNQRUNUXCIgKVxuXG4vLyBzdmdGYWN0b3J5XG4vLyBodG1sRmFjdG9yeVxuLy8gZmFicmljRmFjdG9yeVxuXG4vLyB1aS5mYWN0b3J5LnNldCAoIFtcImNvbmNlcHQtdWlcIiwgXCJidXR0b25cIiwgXCJodG1sXCIgICwgXCJidG4xXCJdLCBjdG9yIClcbi8vIHVpLmZhY3Rvcnkuc2V0ICggW1wiY29uY2VwdC11aVwiLCBcImJ1dHRvblwiLCBcInN2Z1wiICAgLCBcImJ0bjFcIl0sIGN0b3IgKVxuLy8gdWkuZmFjdG9yeS5zZXQgKCBbXCJjb25jZXB0LXVpXCIsIFwiYnV0dG9uXCIsIFwiZmFicmljXCIsIFwiYnRuMVwiXSwgY3RvciApXG5cbnR5cGUgJEluIDwkIGV4dGVuZHMgJFNoYXBlID0gJFNoYXBlPiA9IE9wdGlvbmFsIDwkLCBcImNvbnRleHRcIj5cblxuLyoqXG4gKiBBc3NpZ25lIHNpIGJlc29pbiBsZSBjb250ZXh0ZSBcImFzcGVjdFwiIGF1IG5vZXVkXG4gKi9cbmZ1bmN0aW9uIG5vcm1hbGl6ZSAoIG5vZGU6ICRJbiApXG57XG4gICAgIGlmICggXCJjb250ZXh0XCIgaW4gbm9kZSApXG4gICAgIHtcbiAgICAgICAgICBpZiAoIG5vZGUuY29udGV4dCAhPT0gQ09OVEVYVCApXG4gICAgICAgICAgICAgICB0aHJvdyBcIkJhZCBjb250ZXh0IHZhbHVlXCJcbiAgICAgfVxuICAgICBlbHNlXG4gICAgIHtcbiAgICAgICAgICAobm9kZSBhcyBXcml0YWJsZSA8JFNoYXBlPikuY29udGV4dCA9IENPTlRFWFRcbiAgICAgfVxuXG4gICAgIHJldHVybiBub2RlIGFzICRTaGFwZVxufVxuXG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRBc3BlY3QgPFQgZXh0ZW5kcyBTaGFwZT4gKCBvYmo6ICROb2RlIHwgU2hhcGUgfCBmYWJyaWMuT2JqZWN0ICk6IFQgfCB1bmRlZmluZWRcbntcbiAgICAgaWYgKCBvYmogPT0gdW5kZWZpbmVkIClcbiAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkXG5cbiAgICAgaWYgKCBvYmogaW5zdGFuY2VvZiBTaGFwZSApXG4gICAgICAgICAgcmV0dXJuIG9iaiBhcyBUXG5cbiAgICAgaWYgKCBvYmogaW5zdGFuY2VvZiBmYWJyaWMuT2JqZWN0IClcbiAgICAgICAgICByZXR1cm4gb2JqIFtBU1BFQ1RdXG5cbiAgICAgaWYgKCBmYWN0b3J5LmluU3RvY2sgKCBDT05URVhULCBvYmoudHlwZSwgb2JqLmlkICkgKVxuICAgICAgICAgIHJldHVybiBmYWN0b3J5Lm1ha2UgKCBDT05URVhULCBvYmoudHlwZSwgb2JqLmlkIClcblxuICAgICBjb25zdCBvcHRpb25zICA9IG9iai5jb250ZXh0ID09IENPTlRFWFRcbiAgICAgICAgICAgICAgICAgICAgPyBvYmogYXMgJFNoYXBlXG4gICAgICAgICAgICAgICAgICAgIDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRleHQ6IENPTlRFWFQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgdHlwZSAgIDogb2JqLnR5cGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgaWQgICAgIDogb2JqLmlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGEgICA6IG9iaixcbiAgICAgICAgICAgICAgICAgICAgfSBhcyAkU2hhcGVcblxuICAgICBpZiAoICEgaXNGaW5pdGUgKG9wdGlvbnMueCkgKVxuICAgICAgICAgIG9wdGlvbnMueCA9IDBcblxuICAgICBpZiAoICEgaXNGaW5pdGUgKG9wdGlvbnMueSkgKVxuICAgICAgICAgIG9wdGlvbnMueSA9IDBcblxuICAgICBjb25zdCBzaGFwZSA9IGZhY3RvcnkubWFrZSAoIG9wdGlvbnMgKVxuXG4gICAgIC8vIHNoYXBlLmV2ZW50cyA9IGFyZ3VtZW50cy5ldmVudHNcbiAgICAgLy8gT2JqZWN0LmFzc2lnbiAoIHNoYXBlLCBldmVudHMgKVxuXG4gICAgIC8vc2hhcGUuaW5pdCAoKVxuICAgICBzaGFwZS5ncm91cCBbQVNQRUNUXSA9IHNoYXBlXG5cbiAgICAgaWYgKCBzaGFwZS5jb25maWcub25DcmVhdGUgKVxuICAgICAgICAgIHNoYXBlLmNvbmZpZy5vbkNyZWF0ZSAoIHNoYXBlLmNvbmZpZy5kYXRhLCBzaGFwZSApXG5cbiAgICAgcmV0dXJuIHNoYXBlIGFzIFRcbn1cblxuXG5leHBvcnQgZnVuY3Rpb24gc2V0QXNwZWN0IDwkIGV4dGVuZHMgJFNoYXBlPiAoIG5vZGU6ICRJbiA8JD4gKVxue1xuICAgICBkYi5zZXQgKCBub3JtYWxpemUgKCBub2RlICkgKVxufVxuXG5cbmV4cG9ydCBmdW5jdGlvbiBkZWZpbmVBc3BlY3QgKCBjdG9yOiBuZXcgKCBkYXRhOiAkU2hhcGUgKSA9PiBTaGFwZSwgdHlwZTogc3RyaW5nIClcbntcbiAgICAgZmFjdG9yeS5fZGVmaW5lICggY3RvciwgW0NPTlRFWFQsIHR5cGVdIClcbn1cbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuL25vZGVzLmQudHNcIiAvPlxuXG5pbXBvcnQgeyBEYXRhYmFzZSB9IGZyb20gXCIuLi9EYXRhL2luZGV4LmpzXCJcbmltcG9ydCB7IE9wdGlvbmFsIH0gZnJvbSBcIi4uL0xpYi9pbmRleC5qc1wiXG5cblxuZGVjbGFyZSBnbG9iYWxcbntcbiAgICAgY29uc3QgQ09OVEVYVF9EQVRBOiBcImNvbmNlcHQtZGF0YVwiXG4gICAgIC8vIGZ1bmN0aW9uIG5vZGUgPFQgZXh0ZW5kcyAkSW5wdXROb2RlPiAoIHR5cGU6IHN0cmluZywgaWQ6IHN0cmluZyApICAgIDogJE91dHB1dE5vZGUgPFQ+XG4gICAgIC8vIGZ1bmN0aW9uIG5vZGUgPFQgZXh0ZW5kcyAkSW5wdXROb2RlPiAoIHR5cGU6IHN0cmluZywgZGVzY3JpcHRpb246IFQgKTogJE91dHB1dE5vZGUgPFQ+XG4gICAgIC8vIGZ1bmN0aW9uIG5vZGUgPFQgZXh0ZW5kcyAkSW5wdXROb2RlPiAoIGRlc2NyaXB0aW9uOiBUICkgICAgICAgICAgICAgIDogJE91dHB1dE5vZGUgPFQ+XG59XG5PYmplY3QuZGVmaW5lUHJvcGVydHkgKCBnbG9iYWxUaGlzLCBcIkNPTlRFWFRfREFUQVwiLCB7XG4gICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICAgdmFsdWU6IFwiY29uY2VwdC1kYXRhXCJcbn0pXG5cblxudHlwZSAkSW5wdXROb2RlID0gT3B0aW9uYWwgPCRUaGluZywgXCJjb250ZXh0XCIgfCBcInR5cGVcIj5cbnR5cGUgJE91dHB1dE5vZGUgPEluIGV4dGVuZHMgJElucHV0Tm9kZT4gPSBSZXF1aXJlZCA8SW4+XG5cblxuY29uc3QgZGIgPSBuZXcgRGF0YWJhc2UgKClcblxuXG5leHBvcnQgZnVuY3Rpb24gbm9kZSA8VCBleHRlbmRzICRJbnB1dE5vZGU+ICggdHlwZTogc3RyaW5nLCBpZDogc3RyaW5nICkgICAgOiAkT3V0cHV0Tm9kZSA8VD5cbmV4cG9ydCBmdW5jdGlvbiBub2RlIDxUIGV4dGVuZHMgJElucHV0Tm9kZT4gKCB0eXBlOiBzdHJpbmcsIGRlc2NyaXB0aW9uOiBUICk6ICRPdXRwdXROb2RlIDxUPlxuZXhwb3J0IGZ1bmN0aW9uIG5vZGUgPFQgZXh0ZW5kcyAkVGhpbmc+ICAgICAoIGRlc2NyaXB0aW9uOiBUICkgICAgICAgICAgICAgIDogJFRoaW5nXG5cbmV4cG9ydCBmdW5jdGlvbiBub2RlICggYTogc3RyaW5nIHwgJElucHV0Tm9kZSwgYj86IHN0cmluZyB8ICRJbnB1dE5vZGUgKSA6ICRUaGluZ1xue1xuICAgICBzd2l0Y2ggKCBhcmd1bWVudHMubGVuZ3RoIClcbiAgICAge1xuICAgICBjYXNlIDE6IC8vIGRhdGEgKCBkZXNjcmlwdGlvbiApXG5cbiAgICAgICAgICBpZiAoIHR5cGVvZiBhICE9IFwib2JqZWN0XCIgfHwgYSA9PSBudWxsIHx8IEFycmF5LmlzQXJyYXkgKGEpIClcbiAgICAgICAgICAgICAgIHRocm93IGBCYWQgYXJndW1lbnQgXCJkZXNjcmlwdGlvblwiIDogJHsgYSB9YFxuXG4gICAgICAgICAgYiA9IGFcbiAgICAgICAgICBhID0gYi50eXBlXG5cbiAgICAgY2FzZSAyOiAvLyBkYXRhICggdHlwZSwgaWQgKSB8IGRhdGEgKCB0eXBlLCBkZXNjcmlwdGlvbiApXG5cbiAgICAgICAgICBpZiAoIHR5cGVvZiBhICE9IFwic3RyaW5nXCIgKVxuICAgICAgICAgICAgICAgdGhyb3cgYEJhZCBhcmd1bWVudCBcInR5cGVcIiA6ICR7IGEgfWBcblxuICAgICAgICAgIGlmICggdHlwZW9mIGIgPT0gXCJzdHJpbmdcIiApXG4gICAgICAgICAgICAgICByZXR1cm4gZGIuZ2V0ICggQ09OVEVYVF9EQVRBLCBhLCBiIClcblxuICAgICAgICAgIGlmICggdHlwZW9mIGIgIT0gXCJvYmplY3RcIiB8fCBiID09IG51bGwgfHwgQXJyYXkuaXNBcnJheSAoYikgKVxuICAgICAgICAgICAgICAgdGhyb3cgYEJhZCBhcmd1bWVudCBcImRlc2NyaXB0aW9uXCIgOiAkeyBiIH1gXG5cbiAgICAgICAgICA7KGIgYXMgYW55KS5jb250ZXh0ID0gQ09OVEVYVF9EQVRBXG4gICAgICAgICAgOyhiIGFzIGFueSkudHlwZSA9IGFcbiAgICAgICAgICByZXR1cm4gZGIuc2V0ICggYiBhcyAkVGhpbmcgKVxuXG4gICAgIGRlZmF1bHQ6XG4gICAgICAgICAgdGhyb3cgYEJhZCBhcmd1bWVudHM6IDIgYXJndW1lbnRzIGV4cGVjdGVkIGJ1dCAkeyBhcmd1bWVudHMubGVuZ3RoIH0gcmVjZWl2ZWRgXG4gICAgIH1cbn1cblxuIiwiXG5pbXBvcnQgKiBhcyBkYiBmcm9tIFwiLi4vLi4vZGF0YS5qc1wiXG5pbXBvcnQgeyBTaGFwZSB9IGZyb20gXCIuL3NoYXBlLmpzXCJcblxuZXhwb3J0IHR5cGUgQmFkZ2VQb3NpdGlvbiA9IHsgYW5nbGU6IG51bWJlciwgb2Zmc2V0OiBudW1iZXIgfVxuXG5leHBvcnQgY2xhc3MgQmFkZ2UgZXh0ZW5kcyBTaGFwZVxue1xuICAgICByZWFkb25seSBvd25lciA9IHVuZGVmaW5lZCBhcyBTaGFwZVxuXG4gICAgIHJlYWRvbmx5IHBvc2l0aW9uID0geyBhbmdsZTogMCwgb2Zmc2V0OiAwIH1cblxuICAgICBjb25zdHJ1Y3RvciAoIG9wdGlvbnM6ICRTaGFwZSApXG4gICAgIHtcbiAgICAgICAgICBzdXBlciAoIG9wdGlvbnMgKVxuXG4gICAgICAgICAgY29uc3QgeyBncm91cCB9ID0gdGhpc1xuXG4gICAgICAgICAgY29uc3QgdGhpc2RhdGEgPSB0aGlzLmNvbmZpZy5kYXRhXG4gICAgICAgICAgY29uc3QgZW50aXR5ID0gZGIubm9kZSA8JEJhZGdlPiAoIHRoaXNkYXRhLnR5cGUsIHRoaXNkYXRhLmlkIClcblxuICAgICAgICAgIGNvbnN0IHRleHQgPSBuZXcgZmFicmljLlRleHRib3ggKCBlbnRpdHkuZW1vamkgfHwgXCJYXCIsIHtcbiAgICAgICAgICAgICAgIGZvbnRTaXplOiB0aGlzLmRpc3BsYXlTaXplICgpLFxuICAgICAgICAgICAgICAgb3JpZ2luWCA6IFwiY2VudGVyXCIsXG4gICAgICAgICAgICAgICBvcmlnaW5ZIDogXCJjZW50ZXJcIixcbiAgICAgICAgICAgICAgIGxlZnQgICAgOiBncm91cC5sZWZ0LFxuICAgICAgICAgICAgICAgdG9wICAgICA6IGdyb3VwLnRvcCxcbiAgICAgICAgICB9KVxuXG4gICAgICAgICAgZ3JvdXAuYWRkV2l0aFVwZGF0ZSAoIHRleHQgKVxuICAgICB9XG5cbiAgICAgZGlzcGxheVNpemUgKClcbiAgICAge1xuICAgICAgICAgIHJldHVybiAyMFxuICAgICB9XG5cbiAgICAgYXR0YWNoICggdGFyZ2V0OiBTaGFwZSwgcG9zID0ge30gYXMgQmFkZ2VQb3NpdGlvbiApXG4gICAgIHtcbiAgICAgICAgICBjb25zdCB7IHJhbmRvbSwgUEkgfSA9IE1hdGhcblxuICAgICAgICAgIGlmICggISBpc0Zpbml0ZSAoIHBvcy5hbmdsZSApIClcbiAgICAgICAgICAgICAgIHBvcy5hbmdsZSA9IHJhbmRvbSAoKSAqIFBJICogMlxuXG4gICAgICAgICAgaWYgKCAhIGlzRmluaXRlICggcG9zLm9mZnNldCApIClcbiAgICAgICAgICAgICAgIHBvcy5vZmZzZXQgPSAwLjFcblxuICAgICAgICAgIDsodGhpcy5wb3NpdGlvbiBhcyBCYWRnZVBvc2l0aW9uKSA9IHsgLi4uIHBvcyB9XG5cbiAgICAgICAgICBpZiAoIHRoaXMub3duZXIgIT0gdW5kZWZpbmVkIClcbiAgICAgICAgICAgICAgIHRhcmdldC5ncm91cC5yZW1vdmUgKCB0aGlzLmdyb3VwIClcblxuICAgICAgICAgIHRhcmdldC5ncm91cC5hZGQgKCB0aGlzLmdyb3VwIClcblxuICAgICAgICAgIDsodGhpcy5vd25lciBhcyBTaGFwZSkgPSB0YXJnZXRcblxuICAgICAgICAgIHRoaXMudXBkYXRlUG9zaXRpb24gKClcbiAgICAgfVxuXG4gICAgIHVwZGF0ZVBvc2l0aW9uICgpXG4gICAgIHtcbiAgICAgICAgICBjb25zdCB7IHBvc2l0aW9uOiBwb3MsIG93bmVyIH0gPSB0aGlzXG5cbiAgICAgICAgICBpZiAoIG93bmVyID09IHVuZGVmaW5lZCApXG4gICAgICAgICAgICAgICByZXR1cm5cblxuICAgICAgICAgIGNvbnN0IHsgcmFuZG9tLCBQSSwgY29zLCBzaW4gfSA9IE1hdGhcblxuICAgICAgICAgIGNvbnN0IHJhZCAgICA9IHBvcy5hbmdsZSB8fCByYW5kb20gKCkgKiBQSSAqIDJcbiAgICAgICAgICBjb25zdCB4ICAgICAgPSBzaW4gKHJhZClcbiAgICAgICAgICBjb25zdCB5ICAgICAgPSBjb3MgKHJhZClcbiAgICAgICAgICBjb25zdCBzICAgICAgPSBvd25lci5kaXNwbGF5U2l6ZSAoKSAvIDJcbiAgICAgICAgICBjb25zdCBvZmZzZXQgPSB0eXBlb2YgcG9zLm9mZnNldCA9PSBcIm51bWJlclwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgPyB0aGlzLmRpc3BsYXlTaXplICgpICogcG9zLm9mZnNldFxuICAgICAgICAgICAgICAgICAgICAgICAgIDogdGhpcy5kaXNwbGF5U2l6ZSAoKSAqIDAuMVxuXG4gICAgICAgICAgdGhpcy5zZXRQb3NpdGlvbiAoIHggKiAocyArIG9mZnNldCksIHkgKiAocyArIG9mZnNldCkgKVxuICAgICB9XG59XG4iLCJcbmltcG9ydCB7IEdlb21ldHJ5IH0gZnJvbSBcIi4uLy4uLy4uL0xpYi9pbmRleC5qc1wiXG5pbXBvcnQgeyBnZXRBc3BlY3QgfSBmcm9tIFwiLi4vZGIuanNcIlxuaW1wb3J0IHsgU2hhcGUgfSBmcm9tIFwiLi9zaGFwZS5qc1wiXG5cbmV4cG9ydCBjbGFzcyBDb250YWluZXIgPCQgZXh0ZW5kcyAkU2hhcGUgPCRHcm91cD4gPSAkU2hhcGUgPCRHcm91cD4+IGV4dGVuZHMgU2hhcGUgPCQ+XG57XG4gICAgIHJlYWRvbmx5IGNoaWxkcmVuOiBTaGFwZSBbXVxuXG4gICAgIGRpc3BsYXlfc2l6ZSA9IDFcblxuICAgICBjb25zdHJ1Y3RvciAoIG9wdGlvbnM6ICQgKVxuICAgICB7XG4gICAgICAgICAgc3VwZXIgKCBvcHRpb25zIClcbiAgICAgICAgICB0aGlzLmNoaWxkcmVuID0gW11cbiAgICAgLy8gfVxuXG4gICAgIC8vIGluaXQgKClcbiAgICAgLy8ge1xuICAgICAvLyAgICAgIHN1cGVyLmluaXQgKClcblxuICAgICAgICAgIGNvbnN0IGVudGl0eSA9IHRoaXMuY29uZmlnLmRhdGFcblxuICAgICAgICAgIC8vZm9yICggY29uc3QgY2hpbGQgb2YgT2JqZWN0LnZhbHVlcyAoIGVudGl0eS5jaGlsZHJlbiApIClcbiAgICAgICAgICBmb3IgKCBjb25zdCBjaGlsZCBvZiBPYmplY3QudmFsdWVzICggZW50aXR5Lml0ZW1zICkgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNvbnN0IGEgPSBnZXRBc3BlY3QgKCBjaGlsZCApXG4gICAgICAgICAgICAgICAvL2EuaW5pdCAoKVxuICAgICAgICAgICAgICAgdGhpcy5hZGQgKCBhIClcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB0aGlzLnBhY2sgKClcbiAgICAgfVxuXG4gICAgIGRpc3BsYXlTaXplICgpXG4gICAgIHtcbiAgICAgICAgICBjb25zdCBjb25maWcgPSB0aGlzLmNvbmZpZ1xuXG4gICAgICAgICAgdmFyIHNpemUgPSAodGhpcy5kaXNwbGF5X3NpemUgKyBjb25maWcuc2l6ZU9mZnNldCkgKiBjb25maWcuc2l6ZUZhY3RvclxuXG4gICAgICAgICAgaWYgKCBzaXplIDwgY29uZmlnLm1pblNpemUgKVxuICAgICAgICAgICAgICAgc2l6ZSA9IGNvbmZpZy5taW5TaXplXG5cbiAgICAgICAgICByZXR1cm4gc2l6ZSB8fCAxXG4gICAgIH1cblxuICAgICBhZGQgKCBjaGlsZDogU2hhcGUgKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgeyBncm91cCB9ID0gdGhpc1xuXG4gICAgICAgICAgdGhpcy5jaGlsZHJlbi5wdXNoICggY2hpbGQgKVxuXG4gICAgICAgICAgaWYgKCBncm91cCApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgZ3JvdXAuYWRkICggY2hpbGQuZ3JvdXAgKVxuICAgICAgICAgICAgICAgZ3JvdXAuc2V0Q29vcmRzICgpXG4gICAgICAgICAgfVxuICAgICB9XG5cbiAgICAgcGFjayAoKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgeyBncm91cCwgY2hpbGRyZW4sIGNvbmZpZyB9ID0gdGhpc1xuXG4gICAgICAgICAgY29uc3QgcG9zaXRpb25zID0gW10gYXMgR2VvbWV0cnkuQ2lyY2xlIFtdXG5cbiAgICAgICAgICBmb3IgKCBjb25zdCBjIG9mIGNoaWxkcmVuIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBjb25zdCBnID0gYy5ncm91cFxuICAgICAgICAgICAgICAgY29uc3QgciA9IChnLndpZHRoID4gZy5oZWlnaHQgPyBnLndpZHRoIDogZy5oZWlnaHQpIC8gMlxuICAgICAgICAgICAgICAgcG9zaXRpb25zLnB1c2ggKCB7IHg6IGcubGVmdCwgeTogZy50b3AsIHI6IHIgKyA2IH0gKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbnN0IHNpemUgPSAgR2VvbWV0cnkucGFja0VuY2xvc2UgKCBwb3NpdGlvbnMgKSAqIDJcblxuICAgICAgICAgIGZvciAoIHZhciBpID0gMCA7IGkgPCBjaGlsZHJlbi5sZW5ndGggOyBpKysgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNvbnN0IGcgPSBjaGlsZHJlbiBbaV0uZ3JvdXBcbiAgICAgICAgICAgICAgIGNvbnN0IHAgPSBwb3NpdGlvbnMgW2ldXG5cbiAgICAgICAgICAgICAgIGcubGVmdCA9IHAueFxuICAgICAgICAgICAgICAgZy50b3AgID0gcC55XG5cbiAgICAgICAgICAgICAgIGdyb3VwLmFkZCAoIGcgKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHRoaXMuZGlzcGxheV9zaXplID0gc2l6ZSArIGNvbmZpZy5zaXplT2Zmc2V0XG5cbiAgICAgICAgICB0aGlzLnVwZGF0ZVNpemUgKClcbiAgICAgfVxuXG59XG5cbiIsIlxuXG5cbmV4cG9ydCBjb25zdCB4bm9kZSA9ICgoKSA9Plxue1xuICAgICBjb25zdCBzdmdfbmFtZXMgPSBbIFwic3ZnXCIsIFwiZ1wiLCBcImxpbmVcIiwgXCJjaXJjbGVcIiwgXCJwYXRoXCIsIFwidGV4dFwiIF1cblxuICAgICBmdW5jdGlvbiBjcmVhdGUgKFxuICAgICAgICAgIG5hbWU6IGtleW9mIEpTWC5JbnRyaW5zaWNIVE1MRWxlbWVudHMsXG4gICAgICAgICAgcHJvcHM6IGFueSxcbiAgICAgICAgICAuLi5jaGlsZHJlbjogWyBIVE1MRWxlbWVudCB8IHN0cmluZyB8IGFueVtdIF1cbiAgICAgKTogSFRNTEVsZW1lbnRcblxuICAgICBmdW5jdGlvbiBjcmVhdGUgKFxuICAgICAgICAgIG5hbWU6IGtleW9mIEpTWC5JbnRyaW5zaWNTVkdFbGVtZW50cyxcbiAgICAgICAgICBwcm9wczogYW55LFxuICAgICAgICAgIC4uLmNoaWxkcmVuOiBbIEhUTUxFbGVtZW50IHwgc3RyaW5nIHwgYW55W10gXVxuICAgICApOiBTVkdFbGVtZW50XG5cbiAgICAgZnVuY3Rpb24gY3JlYXRlIChcbiAgICAgICAgICBuYW1lOiBzdHJpbmcsXG4gICAgICAgICAgcHJvcHM6IGFueSxcbiAgICAgICAgICAuLi5jaGlsZHJlbjogWyBIVE1MRWxlbWVudCB8IHN0cmluZyB8IGFueVtdIF1cbiAgICAgKTogSFRNTEVsZW1lbnQgfCBTVkdFbGVtZW50XG4gICAgIHtcbiAgICAgICAgICBwcm9wcyA9IE9iamVjdC5hc3NpZ24gKCB7fSwgcHJvcHMgKVxuXG4gICAgICAgICAgY29uc3QgZWxlbWVudCA9IHN2Z19uYW1lcy5pbmRleE9mICggbmFtZSApID09PSAtMVxuICAgICAgICAgICAgICAgICAgICA/IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgKCBuYW1lIClcbiAgICAgICAgICAgICAgICAgICAgOiBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMgKCBcImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIsIG5hbWUgKVxuXG4gICAgICAgICAgY29uc3QgY29udGVudCA9IFtdIGFzIGFueVtdXG5cbiAgICAgICAgICAvLyBDaGlsZHJlblxuXG4gICAgICAgICAgd2hpbGUgKCBjaGlsZHJlbi5sZW5ndGggPiAwIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBsZXQgY2hpbGQgPSBjaGlsZHJlbi5wb3AoKVxuXG4gICAgICAgICAgICAgICBpZiAoIEFycmF5LmlzQXJyYXkoIGNoaWxkICkgKVxuICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKCB2YXIgaSA9IDAgOyBpICE9IGNoaWxkLmxlbmd0aCA7IGkrKyApXG4gICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGRyZW4ucHVzaCggY2hpbGQgW2ldIClcbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgY29udGVudC5wdXNoKCBjaGlsZCApXG4gICAgICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgd2hpbGUgKCBjb250ZW50Lmxlbmd0aCA+IDAgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGxldCBjaGlsZCA9IGNvbnRlbnQucG9wKClcblxuICAgICAgICAgICAgICAgaWYgKCBjaGlsZCBpbnN0YW5jZW9mIE5vZGUgKVxuICAgICAgICAgICAgICAgICAgICBlbGVtZW50LmFwcGVuZENoaWxkKCBjaGlsZCApXG5cbiAgICAgICAgICAgICAgIGVsc2UgaWYgKCB0eXBlb2YgY2hpbGQgPT0gXCJib29sZWFuXCIgfHwgY2hpbGQgKVxuICAgICAgICAgICAgICAgICAgICBlbGVtZW50LmFwcGVuZENoaWxkKCBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSggY2hpbGQudG9TdHJpbmcoKSApIClcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBBdHRyaWJ1dGVzXG5cbiAgICAgICAgICBjb25zdCBpc0FycmF5ID0gQXJyYXkuaXNBcnJheVxuICAgICAgICAgIGNvbnN0IGNvbnY6IFJlY29yZCA8c3RyaW5nLCAodjogYW55KSA9PiBzdHJpbmc+ID1cbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBjbGFzczogKCB2ICkgPT4gaXNBcnJheSAodikgPyB2LmpvaW4gKFwiIFwiKSA6IHYsXG4gICAgICAgICAgICAgICBzdHlsZTogKCB2ICkgPT4gaXNBcnJheSAodikgPyB2LmpvaW4gKFwiIFwiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IHR5cGVvZiB2ID09IFwib2JqZWN0XCIgPyBvYmplY3RUb1N0eWxlICh2KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IHYsXG4gICAgICAgICAgICAgICAvLyBzdmdcbiAgICAgICAgICAgICAgIGQ6ICggdiApID0+IGlzQXJyYXkgKHYpID8gdi5qb2luIChcIiBcIikgOiB2LFxuICAgICAgICAgIH1cblxuICAgICAgICAgIGZvciAoIGNvbnN0IGtleSBpbiBwcm9wcyApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgY29uc3QgdmFsdWUgPSBwcm9wc1trZXldXG5cbiAgICAgICAgICAgICAgIGlmICggdHlwZW9mIHZhbHVlID09IFwiZnVuY3Rpb25cIiApXG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lciAoIGtleSwgdmFsdWUgKVxuXG4gICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlICgga2V5LCAoY29udltrZXldIHx8ICh2PT52KSkgKHZhbHVlKSApXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIGVsZW1lbnRcblxuICAgICAgICAgIGZ1bmN0aW9uIG9iamVjdFRvU3R5bGUgKCBvYmo6IG9iamVjdCApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IFwiXCJcblxuICAgICAgICAgICAgICAgZm9yICggY29uc3Qga2V5IGluIG9iaiApXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdCArPSBrZXkgKyBcIjogXCIgKyBvYmogW2tleV0gKyBcIjsgXCJcblxuICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdFxuICAgICAgICAgIH1cblxuICAgICAgICAgIGZ1bmN0aW9uIGNhbWVsaXplICggc3RyOiBzdHJpbmcgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHJldHVybiBzdHIucmVwbGFjZSAoXG4gICAgICAgICAgICAgICAgICAgIC8oPzpbQS1aXXxcXGJcXHcpL2csXG4gICAgICAgICAgICAgICAgICAgICggd29yZCwgaW5kZXggKSA9PiBpbmRleCA9PSAwID8gd29yZC50b0xvd2VyQ2FzZSgpIDogd29yZC50b1VwcGVyQ2FzZSgpXG4gICAgICAgICAgICAgICApLnJlcGxhY2UoL1xccysvZywgJycpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGZ1bmN0aW9uIHVuY2FtZWxpemUgKCBzdHI6IHN0cmluZyApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgcmV0dXJuIHN0ci50cmltICgpLnJlcGxhY2UgKFxuICAgICAgICAgICAgICAgLy8gICAvKD88IS0pKD86W0EtWl18XFxiXFx3KS9nLFxuICAgICAgICAgICAgICAgICAgICAvKD86W0EtWl18XFxiXFx3KS9nLFxuICAgICAgICAgICAgICAgICAgICAoIHdvcmQsIGluZGV4ICkgPT4gaW5kZXggPT0gMCA/IHdvcmQudG9Mb3dlckNhc2UoKSA6ICctJyArIHdvcmQudG9Mb3dlckNhc2UoKVxuICAgICAgICAgICAgICAgKS5yZXBsYWNlKC8oPzpcXHMrfF8pL2csICcnKTtcbiAgICAgICAgICB9XG4gICAgIH1cblxuICAgICByZXR1cm4gY3JlYXRlXG5cbn0pICgpXG5cbmRlY2xhcmUgZ2xvYmFsXG57XG4gICAgIGV4cG9ydCBuYW1lc3BhY2UgSlNYXG4gICAgIHtcbiAgICAgICAgICBleHBvcnQgdHlwZSBFbGVtZW50ID0gSFRNTEVsZW1lbnQgfCBTVkdFbGVtZW50XG5cbiAgICAgICAgICBleHBvcnQgdHlwZSBJbnRyaW5zaWNFbGVtZW50cyA9IEludHJpbnNpY0hUTUxFbGVtZW50cyAmIEludHJpbnNpY1NWR0VsZW1lbnRzXG5cbiAgICAgICAgICBleHBvcnQgaW50ZXJmYWNlIEludHJpbnNpY0hUTUxFbGVtZW50c1xuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGEgICAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBhYmJyICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgYWRkcmVzcyAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGFyZWEgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBhcnRpY2xlICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgYXNpZGUgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGF1ZGlvICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBiICAgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgYmFzZSAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGJkaSAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBiZG8gICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgYmlnICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGJsb2NrcXVvdGU6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBib2R5ICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgYnIgICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGJ1dHRvbiAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBjYW52YXMgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgY2FwdGlvbiAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGNpdGUgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBjb2RlICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgY29sICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGNvbGdyb3VwICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBkYXRhICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZGF0YWxpc3QgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGRkICAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBkZWwgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZGV0YWlscyAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGRmbiAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBkaWFsb2cgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZGl2ICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGRsICAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBkdCAgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZW0gICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGVtYmVkICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBmaWVsZHNldCAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZmlnY2FwdGlvbjogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGZpZ3VyZSAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBmb290ZXIgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZm9ybSAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGgxICAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBoMiAgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgaDMgICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGg0ICAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBoNSAgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgaDYgICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGhlYWQgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBoZWFkZXIgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgaGdyb3VwICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGhyICAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBodG1sICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgaSAgICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGlmcmFtZSAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBpbWcgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgaW5wdXQgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGlucyAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBrYmQgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAga2V5Z2VuICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGxhYmVsICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBsZWdlbmQgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgbGkgICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGxpbmsgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBtYWluICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgbWFwICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIG1hcmsgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBtZW51ICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgbWVudWl0ZW0gIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIG1ldGEgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBtZXRlciAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgbmF2ICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIG5vc2NyaXB0ICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBvYmplY3QgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgb2wgICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIG9wdGdyb3VwICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBvcHRpb24gICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgb3V0cHV0ICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHAgICAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBwYXJhbSAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgcGljdHVyZSAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHByZSAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBwcm9ncmVzcyAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgcSAgICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHJwICAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBydCAgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgcnVieSAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHMgICAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBzYW1wICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgc2NyaXB0ICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHNlY3Rpb24gICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBzZWxlY3QgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgc2xvdCAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHNtYWxsICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBzb3VyY2UgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgc3BhbiAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHN0cm9uZyAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBzdHlsZSAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgc3ViICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHN1bW1hcnkgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBzdXAgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgdGFibGUgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHRib2R5ICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICB0ZCAgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgdGV4dGFyZWEgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHRmb290ICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICB0aCAgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgdGhlYWQgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHRpbWUgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICB0aXRsZSAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgdHIgICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHRyYWNrICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICB1ICAgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgdWwgICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIFwidmFyXCIgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHZpZGVvICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICB3YnIgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGV4cG9ydCBpbnRlcmZhY2UgSW50cmluc2ljU1ZHRWxlbWVudHNcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBzdmcgICAgICAgICAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBhbmltYXRlICAgICAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBjaXJjbGUgICAgICAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBjbGlwUGF0aCAgICAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBkZWZzICAgICAgICAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBkZXNjICAgICAgICAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBlbGxpcHNlICAgICAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBmZUJsZW5kICAgICAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBmZUNvbG9yTWF0cml4ICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBmZUNvbXBvbmVudFRyYW5zZmVyOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBmZUNvbXBvc2l0ZSAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBmZUNvbnZvbHZlTWF0cml4ICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBmZURpZmZ1c2VMaWdodGluZyAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBmZURpc3BsYWNlbWVudE1hcCAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBmZUZsb29kICAgICAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBmZUdhdXNzaWFuQmx1ciAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBmZUltYWdlICAgICAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBmZU1lcmdlICAgICAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBmZU1lcmdlTm9kZSAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBmZU1vcnBob2xvZ3kgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBmZU9mZnNldCAgICAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBmZVNwZWN1bGFyTGlnaHRpbmcgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBmZVRpbGUgICAgICAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBmZVR1cmJ1bGVuY2UgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBmaWx0ZXIgICAgICAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBmb3JlaWduT2JqZWN0ICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBnICAgICAgICAgICAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBpbWFnZSAgICAgICAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBsaW5lICAgICAgICAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBsaW5lYXJHcmFkaWVudCAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBtYXJrZXIgICAgICAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBtYXNrICAgICAgICAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBwYXRoICAgICAgICAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBwYXR0ZXJuICAgICAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBwb2x5Z29uICAgICAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBwb2x5bGluZSAgICAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICByYWRpYWxHcmFkaWVudCAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICByZWN0ICAgICAgICAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBzdG9wICAgICAgICAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBzeW1ib2wgICAgICAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICB0ZXh0ICAgICAgICAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICB0c3BhbiAgICAgICAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICB1c2UgICAgICAgICAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgfVxuICAgICB9XG5cblxuICAgICBpbnRlcmZhY2UgUGF0aEF0dHJpYnV0ZXNcbiAgICAge1xuICAgICAgICAgIGQ6IHN0cmluZ1xuICAgICB9XG5cbiAgICAgdHlwZSBFdmVudEhhbmRsZXIgPEUgZXh0ZW5kcyBFdmVudD4gPSAoIGV2ZW50OiBFICkgPT4gdm9pZFxuXG4gICAgIHR5cGUgQ2xpcGJvYXJkRXZlbnRIYW5kbGVyICAgPSBFdmVudEhhbmRsZXI8Q2xpcGJvYXJkRXZlbnQ+XG4gICAgIHR5cGUgQ29tcG9zaXRpb25FdmVudEhhbmRsZXIgPSBFdmVudEhhbmRsZXI8Q29tcG9zaXRpb25FdmVudD5cbiAgICAgdHlwZSBEcmFnRXZlbnRIYW5kbGVyICAgICAgICA9IEV2ZW50SGFuZGxlcjxEcmFnRXZlbnQ+XG4gICAgIHR5cGUgRm9jdXNFdmVudEhhbmRsZXIgICAgICAgPSBFdmVudEhhbmRsZXI8Rm9jdXNFdmVudD5cbiAgICAgdHlwZSBLZXlib2FyZEV2ZW50SGFuZGxlciAgICA9IEV2ZW50SGFuZGxlcjxLZXlib2FyZEV2ZW50PlxuICAgICB0eXBlIE1vdXNlRXZlbnRIYW5kbGVyICAgICAgID0gRXZlbnRIYW5kbGVyPE1vdXNlRXZlbnQ+XG4gICAgIHR5cGUgVG91Y2hFdmVudEhhbmRsZXIgICAgICAgPSBFdmVudEhhbmRsZXI8VG91Y2hFdmVudD5cbiAgICAgdHlwZSBVSUV2ZW50SGFuZGxlciAgICAgICAgICA9IEV2ZW50SGFuZGxlcjxVSUV2ZW50PlxuICAgICB0eXBlIFdoZWVsRXZlbnRIYW5kbGVyICAgICAgID0gRXZlbnRIYW5kbGVyPFdoZWVsRXZlbnQ+XG4gICAgIHR5cGUgQW5pbWF0aW9uRXZlbnRIYW5kbGVyICAgPSBFdmVudEhhbmRsZXI8QW5pbWF0aW9uRXZlbnQ+XG4gICAgIHR5cGUgVHJhbnNpdGlvbkV2ZW50SGFuZGxlciAgPSBFdmVudEhhbmRsZXI8VHJhbnNpdGlvbkV2ZW50PlxuICAgICB0eXBlIEdlbmVyaWNFdmVudEhhbmRsZXIgICAgID0gRXZlbnRIYW5kbGVyPEV2ZW50PlxuICAgICB0eXBlIFBvaW50ZXJFdmVudEhhbmRsZXIgICAgID0gRXZlbnRIYW5kbGVyPFBvaW50ZXJFdmVudD5cblxuICAgICBpbnRlcmZhY2UgRE9NQXR0cmlidXRlc1xuICAgICB7XG4gICAgICAgICAgW2V2ZW50OiBzdHJpbmddOiBhbnlcblxuICAgICAgICAgIC8vICNyZWdpb24gSW1hZ2UgRXZlbnRzXG4gICAgICAgICAgb25Mb2FkPyAgICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Mb2FkQ2FwdHVyZT8gOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25FcnJvcj8gICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25FcnJvckNhcHR1cmU/OiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgLy8gI2VuZHJlZ2lvblxuXG4gICAgICAgICAgLy8gI3JlZ2lvbiBDbGlwYm9hcmQgRXZlbnRzXG4gICAgICAgICAgb25Db3B5PyAgICAgICAgOiBDbGlwYm9hcmRFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkNvcHlDYXB0dXJlPyA6IENsaXBib2FyZEV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uQ3V0PyAgICAgICAgIDogQ2xpcGJvYXJkRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25DdXRDYXB0dXJlPyAgOiBDbGlwYm9hcmRFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblBhc3RlPyAgICAgICA6IENsaXBib2FyZEV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uUGFzdGVDYXB0dXJlPzogQ2xpcGJvYXJkRXZlbnRIYW5kbGVyXG4gICAgICAgICAgLy8gI2VuZHJlZ2lvblxuXG4gICAgICAgICAgLy8gI3JlZ2lvbiBDb21wb3NpdGlvbiBFdmVudHNcbiAgICAgICAgICBvbkNvbXBvc2l0aW9uRW5kPyAgICAgICAgICA6IENvbXBvc2l0aW9uRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Db21wb3NpdGlvbkVuZENhcHR1cmU/ICAgOiBDb21wb3NpdGlvbkV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uQ29tcG9zaXRpb25TdGFydD8gICAgICAgIDogQ29tcG9zaXRpb25FdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkNvbXBvc2l0aW9uU3RhcnRDYXB0dXJlPyA6IENvbXBvc2l0aW9uRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Db21wb3NpdGlvblVwZGF0ZT8gICAgICAgOiBDb21wb3NpdGlvbkV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uQ29tcG9zaXRpb25VcGRhdGVDYXB0dXJlPzogQ29tcG9zaXRpb25FdmVudEhhbmRsZXJcbiAgICAgICAgICAvLyAjZW5kcmVnaW9uXG5cbiAgICAgICAgICAvLyAjcmVnaW9uIEZvY3VzIEV2ZW50c1xuICAgICAgICAgIG9uRm9jdXM/ICAgICAgIDogRm9jdXNFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkZvY3VzQ2FwdHVyZT86IEZvY3VzRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25CbHVyPyAgICAgICAgOiBGb2N1c0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uQmx1ckNhcHR1cmU/IDogRm9jdXNFdmVudEhhbmRsZXJcbiAgICAgICAgICAvLyAjZW5kcmVnaW9uXG5cbiAgICAgICAgICAvLyAjcmVnaW9uIEZvcm0gRXZlbnRzXG4gICAgICAgICAgb25DaGFuZ2U/ICAgICAgICA6IEdlbmVyaWNFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkNoYW5nZUNhcHR1cmU/IDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uSW5wdXQ/ICAgICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25JbnB1dENhcHR1cmU/ICA6IEdlbmVyaWNFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblNlYXJjaD8gICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uU2VhcmNoQ2FwdHVyZT8gOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25TdWJtaXQ/ICAgICAgICA6IEdlbmVyaWNFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblN1Ym1pdENhcHR1cmU/IDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uSW52YWxpZD8gICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25JbnZhbGlkQ2FwdHVyZT86IEdlbmVyaWNFdmVudEhhbmRsZXJcbiAgICAgICAgICAvLyAjZW5kcmVnaW9uXG5cbiAgICAgICAgICAvLyAjcmVnaW9uIEtleWJvYXJkIEV2ZW50c1xuICAgICAgICAgIG9uS2V5RG93bj8gICAgICAgIDogS2V5Ym9hcmRFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbktleURvd25DYXB0dXJlPyA6IEtleWJvYXJkRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25LZXlQcmVzcz8gICAgICAgOiBLZXlib2FyZEV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uS2V5UHJlc3NDYXB0dXJlPzogS2V5Ym9hcmRFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbktleVVwPyAgICAgICAgICA6IEtleWJvYXJkRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25LZXlVcENhcHR1cmU/ICAgOiBLZXlib2FyZEV2ZW50SGFuZGxlclxuICAgICAgICAgIC8vICNlbmRyZWdpb25cblxuICAgICAgICAgIC8vICNyZWdpb24gTWVkaWEgRXZlbnRzXG4gICAgICAgICAgb25BYm9ydD8gICAgICAgICAgICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25BYm9ydENhcHR1cmU/ICAgICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25DYW5QbGF5PyAgICAgICAgICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25DYW5QbGF5Q2FwdHVyZT8gICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25DYW5QbGF5VGhyb3VnaD8gICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25DYW5QbGF5VGhyb3VnaENhcHR1cmU/OiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25EdXJhdGlvbkNoYW5nZT8gICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25EdXJhdGlvbkNoYW5nZUNhcHR1cmU/OiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25FbXB0aWVkPyAgICAgICAgICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25FbXB0aWVkQ2FwdHVyZT8gICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25FbmNyeXB0ZWQ/ICAgICAgICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25FbmNyeXB0ZWRDYXB0dXJlPyAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25FbmRlZD8gICAgICAgICAgICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25FbmRlZENhcHR1cmU/ICAgICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Mb2FkZWREYXRhPyAgICAgICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Mb2FkZWREYXRhQ2FwdHVyZT8gICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Mb2FkZWRNZXRhZGF0YT8gICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Mb2FkZWRNZXRhZGF0YUNhcHR1cmU/OiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Mb2FkU3RhcnQ/ICAgICAgICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Mb2FkU3RhcnRDYXB0dXJlPyAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25QYXVzZT8gICAgICAgICAgICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25QYXVzZUNhcHR1cmU/ICAgICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25QbGF5PyAgICAgICAgICAgICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25QbGF5Q2FwdHVyZT8gICAgICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25QbGF5aW5nPyAgICAgICAgICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25QbGF5aW5nQ2FwdHVyZT8gICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Qcm9ncmVzcz8gICAgICAgICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Qcm9ncmVzc0NhcHR1cmU/ICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25SYXRlQ2hhbmdlPyAgICAgICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25SYXRlQ2hhbmdlQ2FwdHVyZT8gICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25TZWVrZWQ/ICAgICAgICAgICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25TZWVrZWRDYXB0dXJlPyAgICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25TZWVraW5nPyAgICAgICAgICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25TZWVraW5nQ2FwdHVyZT8gICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25TdGFsbGVkPyAgICAgICAgICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25TdGFsbGVkQ2FwdHVyZT8gICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25TdXNwZW5kPyAgICAgICAgICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25TdXNwZW5kQ2FwdHVyZT8gICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25UaW1lVXBkYXRlPyAgICAgICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25UaW1lVXBkYXRlQ2FwdHVyZT8gICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Wb2x1bWVDaGFuZ2U/ICAgICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Wb2x1bWVDaGFuZ2VDYXB0dXJlPyAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25XYWl0aW5nPyAgICAgICAgICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25XYWl0aW5nQ2FwdHVyZT8gICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgLy8gI2VuZHJlZ2lvblxuXG4gICAgICAgICAgLy8gI3JlZ2lvbiBNb3VzZUV2ZW50c1xuICAgICAgICAgIG9uQ2xpY2s/ICAgICAgICAgICAgIDogTW91c2VFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkNsaWNrQ2FwdHVyZT8gICAgICA6IE1vdXNlRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Db250ZXh0TWVudT8gICAgICAgOiBNb3VzZUV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uQ29udGV4dE1lbnVDYXB0dXJlPzogTW91c2VFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkRibENsaWNrPyAgICAgICAgICA6IE1vdXNlRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25EYmxDbGlja0NhcHR1cmU/ICAgOiBNb3VzZUV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRHJhZz8gICAgICAgICAgICAgIDogRHJhZ0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRHJhZ0NhcHR1cmU/ICAgICAgIDogRHJhZ0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRHJhZ0VuZD8gICAgICAgICAgIDogRHJhZ0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRHJhZ0VuZENhcHR1cmU/ICAgIDogRHJhZ0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRHJhZ0VudGVyPyAgICAgICAgIDogRHJhZ0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRHJhZ0VudGVyQ2FwdHVyZT8gIDogRHJhZ0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRHJhZ0V4aXQ/ICAgICAgICAgIDogRHJhZ0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRHJhZ0V4aXRDYXB0dXJlPyAgIDogRHJhZ0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRHJhZ0xlYXZlPyAgICAgICAgIDogRHJhZ0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRHJhZ0xlYXZlQ2FwdHVyZT8gIDogRHJhZ0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRHJhZ092ZXI/ICAgICAgICAgIDogRHJhZ0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRHJhZ092ZXJDYXB0dXJlPyAgIDogRHJhZ0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRHJhZ1N0YXJ0PyAgICAgICAgIDogRHJhZ0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRHJhZ1N0YXJ0Q2FwdHVyZT8gIDogRHJhZ0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRHJvcD8gICAgICAgICAgICAgIDogRHJhZ0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRHJvcENhcHR1cmU/ICAgICAgIDogRHJhZ0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uTW91c2VEb3duPyAgICAgICAgIDogTW91c2VFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbk1vdXNlRG93bkNhcHR1cmU/ICA6IE1vdXNlRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Nb3VzZUVudGVyPyAgICAgICAgOiBNb3VzZUV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uTW91c2VFbnRlckNhcHR1cmU/IDogTW91c2VFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbk1vdXNlTGVhdmU/ICAgICAgICA6IE1vdXNlRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Nb3VzZUxlYXZlQ2FwdHVyZT8gOiBNb3VzZUV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uTW91c2VNb3ZlPyAgICAgICAgIDogTW91c2VFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbk1vdXNlTW92ZUNhcHR1cmU/ICA6IE1vdXNlRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Nb3VzZU91dD8gICAgICAgICAgOiBNb3VzZUV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uTW91c2VPdXRDYXB0dXJlPyAgIDogTW91c2VFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbk1vdXNlT3Zlcj8gICAgICAgICA6IE1vdXNlRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Nb3VzZU92ZXJDYXB0dXJlPyAgOiBNb3VzZUV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uTW91c2VVcD8gICAgICAgICAgIDogTW91c2VFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbk1vdXNlVXBDYXB0dXJlPyAgICA6IE1vdXNlRXZlbnRIYW5kbGVyXG4gICAgICAgICAgLy8gI2VuZHJlZ2lvblxuXG4gICAgICAgICAgLy8gI3JlZ2lvbiBTZWxlY3Rpb24gRXZlbnRzXG4gICAgICAgICAgb25TZWxlY3Q/OiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25TZWxlY3RDYXB0dXJlPzogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIC8vICNlbmRyZWdpb25cblxuICAgICAgICAgIC8vICNyZWdpb24gVG91Y2ggRXZlbnRzXG4gICAgICAgICAgb25Ub3VjaENhbmNlbD86IFRvdWNoRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Ub3VjaENhbmNlbENhcHR1cmU/OiBUb3VjaEV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uVG91Y2hFbmQ/OiBUb3VjaEV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uVG91Y2hFbmRDYXB0dXJlPzogVG91Y2hFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblRvdWNoTW92ZT86IFRvdWNoRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Ub3VjaE1vdmVDYXB0dXJlPzogVG91Y2hFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblRvdWNoU3RhcnQ/OiBUb3VjaEV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uVG91Y2hTdGFydENhcHR1cmU/OiBUb3VjaEV2ZW50SGFuZGxlclxuICAgICAgICAgIC8vICNlbmRyZWdpb25cblxuICAgICAgICAgIC8vICNyZWdpb24gUG9pbnRlciBFdmVudHNcbiAgICAgICAgICBvblBvaW50ZXJPdmVyPyAgICAgICAgICAgICAgOiBQb2ludGVyRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Qb2ludGVyT3ZlckNhcHR1cmU/ICAgICAgIDogUG9pbnRlckV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uUG9pbnRlckVudGVyPyAgICAgICAgICAgICA6IFBvaW50ZXJFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblBvaW50ZXJFbnRlckNhcHR1cmU/ICAgICAgOiBQb2ludGVyRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Qb2ludGVyRG93bj8gICAgICAgICAgICAgIDogUG9pbnRlckV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uUG9pbnRlckRvd25DYXB0dXJlPyAgICAgICA6IFBvaW50ZXJFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblBvaW50ZXJNb3ZlPyAgICAgICAgICAgICAgOiBQb2ludGVyRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Qb2ludGVyTW92ZUNhcHR1cmU/ICAgICAgIDogUG9pbnRlckV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uUG9pbnRlclVwPyAgICAgICAgICAgICAgICA6IFBvaW50ZXJFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblBvaW50ZXJVcENhcHR1cmU/ICAgICAgICAgOiBQb2ludGVyRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Qb2ludGVyQ2FuY2VsPyAgICAgICAgICAgIDogUG9pbnRlckV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uUG9pbnRlckNhbmNlbENhcHR1cmU/ICAgICA6IFBvaW50ZXJFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblBvaW50ZXJPdXQ/ICAgICAgICAgICAgICAgOiBQb2ludGVyRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Qb2ludGVyT3V0Q2FwdHVyZT8gICAgICAgIDogUG9pbnRlckV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uUG9pbnRlckxlYXZlPyAgICAgICAgICAgICA6IFBvaW50ZXJFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblBvaW50ZXJMZWF2ZUNhcHR1cmU/ICAgICAgOiBQb2ludGVyRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Hb3RQb2ludGVyQ2FwdHVyZT8gICAgICAgIDogUG9pbnRlckV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uR290UG9pbnRlckNhcHR1cmVDYXB0dXJlPyA6IFBvaW50ZXJFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkxvc3RQb2ludGVyQ2FwdHVyZT8gICAgICAgOiBQb2ludGVyRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Mb3N0UG9pbnRlckNhcHR1cmVDYXB0dXJlPzogUG9pbnRlckV2ZW50SGFuZGxlclxuICAgICAgICAgIC8vICNlbmRyZWdpb25cblxuICAgICAgICAgIC8vICNyZWdpb24gVUkgRXZlbnRzXG4gICAgICAgICAgb25TY3JvbGw/ICAgICAgIDogVUlFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblNjcm9sbENhcHR1cmU/OiBVSUV2ZW50SGFuZGxlclxuICAgICAgICAgIC8vICNlbmRyZWdpb25cblxuICAgICAgICAgIC8vICNyZWdpb24gV2hlZWwgRXZlbnRzXG4gICAgICAgICAgb25XaGVlbD8gICAgICAgOiBXaGVlbEV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uV2hlZWxDYXB0dXJlPzogV2hlZWxFdmVudEhhbmRsZXJcbiAgICAgICAgICAvLyAjZW5kcmVnaW9uXG5cbiAgICAgICAgICAvLyAjcmVnaW9uIEFuaW1hdGlvbiBFdmVudHNcbiAgICAgICAgICBvbkFuaW1hdGlvblN0YXJ0PyAgICAgICAgICAgOiBBbmltYXRpb25FdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkFuaW1hdGlvblN0YXJ0Q2FwdHVyZT8gICAgOiBBbmltYXRpb25FdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkFuaW1hdGlvbkVuZD8gICAgICAgICAgICAgOiBBbmltYXRpb25FdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkFuaW1hdGlvbkVuZENhcHR1cmU/ICAgICAgOiBBbmltYXRpb25FdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkFuaW1hdGlvbkl0ZXJhdGlvbj8gICAgICAgOiBBbmltYXRpb25FdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkFuaW1hdGlvbkl0ZXJhdGlvbkNhcHR1cmU/OiBBbmltYXRpb25FdmVudEhhbmRsZXJcbiAgICAgICAgICAvLyAjZW5kcmVnaW9uXG5cbiAgICAgICAgICAvLyAjcmVnaW9uIFRyYW5zaXRpb24gRXZlbnRzXG4gICAgICAgICAgb25UcmFuc2l0aW9uRW5kPyAgICAgICA6IFRyYW5zaXRpb25FdmVudEhhbmRsZXJcbiAgICAgICAgICBvblRyYW5zaXRpb25FbmRDYXB0dXJlPzogVHJhbnNpdGlvbkV2ZW50SGFuZGxlclxuICAgICAgICAgIC8vICNlbmRyZWdpb25cbiAgICAgfVxuXG4gICAgIGludGVyZmFjZSBIVE1MQXR0cmlidXRlcyBleHRlbmRzIERPTUF0dHJpYnV0ZXNcbiAgICAge1xuICAgICAgICAgIC8vIFN0YW5kYXJkIEhUTUwgQXR0cmlidXRlc1xuICAgICAgICAgIGFjY2VwdD8gICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgYWNjZXB0Q2hhcnNldD8gICAgOiBzdHJpbmdcbiAgICAgICAgICBhY2Nlc3NLZXk/ICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGFjdGlvbj8gICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgYWxsb3dGdWxsU2NyZWVuPyAgOiBzdHJpbmcgfCBib29sZWFuXG4gICAgICAgICAgYWxsb3dUcmFuc3BhcmVuY3k/OiBzdHJpbmcgfCBib29sZWFuXG4gICAgICAgICAgYWx0PyAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBhc3luYz8gICAgICAgICAgICA6IHN0cmluZyB8IGJvb2xlYW5cbiAgICAgICAgICBhdXRvY29tcGxldGU/ICAgICA6IHN0cmluZ1xuICAgICAgICAgIGF1dG9Db21wbGV0ZT8gICAgIDogc3RyaW5nXG4gICAgICAgICAgYXV0b2NvcnJlY3Q/ICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBhdXRvQ29ycmVjdD8gICAgICA6IHN0cmluZ1xuICAgICAgICAgIGF1dG9mb2N1cz8gICAgICAgIDogc3RyaW5nIHwgYm9vbGVhblxuICAgICAgICAgIGF1dG9Gb2N1cz8gICAgICAgIDogc3RyaW5nIHwgYm9vbGVhblxuICAgICAgICAgIGF1dG9QbGF5PyAgICAgICAgIDogc3RyaW5nIHwgYm9vbGVhblxuICAgICAgICAgIGNhcHR1cmU/ICAgICAgICAgIDogc3RyaW5nIHwgYm9vbGVhblxuICAgICAgICAgIGNlbGxQYWRkaW5nPyAgICAgIDogc3RyaW5nIHwgbnVtYmVyXG4gICAgICAgICAgY2VsbFNwYWNpbmc/ICAgICAgOiBzdHJpbmcgfCBudW1iZXJcbiAgICAgICAgICBjaGFyU2V0PyAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGNoYWxsZW5nZT8gICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgY2hlY2tlZD8gICAgICAgICAgOiBzdHJpbmcgfCBib29sZWFuXG4gICAgICAgICAgY2xhc3M/ICAgICAgICAgICAgOiBzdHJpbmcgfCBzdHJpbmdbXVxuICAgICAgICAgIGNsYXNzTmFtZT8gICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgY29scz8gICAgICAgICAgICAgOiBzdHJpbmcgfCBudW1iZXJcbiAgICAgICAgICBjb2xTcGFuPyAgICAgICAgICA6IHN0cmluZyB8IG51bWJlclxuICAgICAgICAgIGNvbnRlbnQ/ICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgY29udGVudEVkaXRhYmxlPyAgOiBzdHJpbmcgfCBib29sZWFuXG4gICAgICAgICAgY29udGV4dE1lbnU/ICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBjb250cm9scz8gICAgICAgICA6IHN0cmluZyB8IGJvb2xlYW5cbiAgICAgICAgICBjb250cm9sc0xpc3Q/ICAgICA6IHN0cmluZ1xuICAgICAgICAgIGNvb3Jkcz8gICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgY3Jvc3NPcmlnaW4/ICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBkYXRhPyAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGRhdGVUaW1lPyAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgZGVmYXVsdD8gICAgICAgICAgOiBzdHJpbmcgfCBib29sZWFuXG4gICAgICAgICAgZGVmZXI/ICAgICAgICAgICAgOiBzdHJpbmcgfCBib29sZWFuXG4gICAgICAgICAgZGlyPyAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBkaXNhYmxlZD8gICAgICAgICA6IHN0cmluZyB8IGJvb2xlYW5cbiAgICAgICAgICBkb3dubG9hZD8gICAgICAgICA6IGFueVxuICAgICAgICAgIGRyYWdnYWJsZT8gICAgICAgIDogc3RyaW5nIHwgYm9vbGVhblxuICAgICAgICAgIGVuY1R5cGU/ICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgZm9ybT8gICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBmb3JtQWN0aW9uPyAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGZvcm1FbmNUeXBlPyAgICAgIDogc3RyaW5nXG4gICAgICAgICAgZm9ybU1ldGhvZD8gICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBmb3JtTm9WYWxpZGF0ZT8gICA6IHN0cmluZyB8IGJvb2xlYW5cbiAgICAgICAgICBmb3JtVGFyZ2V0PyAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGZyYW1lQm9yZGVyPyAgICAgIDogc3RyaW5nIHwgbnVtYmVyXG4gICAgICAgICAgaGVhZGVycz8gICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBoZWlnaHQ/ICAgICAgICAgICA6IHN0cmluZyB8IG51bWJlclxuICAgICAgICAgIGhpZGRlbj8gICAgICAgICAgIDogc3RyaW5nIHwgYm9vbGVhblxuICAgICAgICAgIGhpZ2g/ICAgICAgICAgICAgIDogc3RyaW5nIHwgbnVtYmVyXG4gICAgICAgICAgaHJlZj8gICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBocmVmTGFuZz8gICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGZvcj8gICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgaHRtbEZvcj8gICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBodHRwRXF1aXY/ICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGljb24/ICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgaWQ/ICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBpbnB1dE1vZGU/ICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGludGVncml0eT8gICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgaXM/ICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBrZXlQYXJhbXM/ICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGtleVR5cGU/ICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAga2luZD8gICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBsYWJlbD8gICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGxhbmc/ICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgbGlzdD8gICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBsb29wPyAgICAgICAgICAgICA6IHN0cmluZyB8IGJvb2xlYW5cbiAgICAgICAgICBsb3c/ICAgICAgICAgICAgICA6IHN0cmluZyB8IG51bWJlclxuICAgICAgICAgIG1hbmlmZXN0PyAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgbWFyZ2luSGVpZ2h0PyAgICAgOiBzdHJpbmcgfCBudW1iZXJcbiAgICAgICAgICBtYXJnaW5XaWR0aD8gICAgICA6IHN0cmluZyB8IG51bWJlclxuICAgICAgICAgIG1heD8gICAgICAgICAgICAgIDogc3RyaW5nIHwgbnVtYmVyXG4gICAgICAgICAgbWF4TGVuZ3RoPyAgICAgICAgOiBzdHJpbmcgfCBudW1iZXJcbiAgICAgICAgICBtZWRpYT8gICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIG1lZGlhR3JvdXA/ICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgbWV0aG9kPyAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBtaW4/ICAgICAgICAgICAgICA6IHN0cmluZyB8IG51bWJlclxuICAgICAgICAgIG1pbkxlbmd0aD8gICAgICAgIDogc3RyaW5nIHwgbnVtYmVyXG4gICAgICAgICAgbXVsdGlwbGU/ICAgICAgICAgOiBzdHJpbmcgfCBib29sZWFuXG4gICAgICAgICAgbXV0ZWQ/ICAgICAgICAgICAgOiBzdHJpbmcgfCBib29sZWFuXG4gICAgICAgICAgbmFtZT8gICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBub1ZhbGlkYXRlPyAgICAgICA6IHN0cmluZyB8IGJvb2xlYW5cbiAgICAgICAgICBvcGVuPyAgICAgICAgICAgICA6IHN0cmluZyB8IGJvb2xlYW5cbiAgICAgICAgICBvcHRpbXVtPyAgICAgICAgICA6IHN0cmluZyB8IG51bWJlclxuICAgICAgICAgIHBhdHRlcm4/ICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgcGxhY2Vob2xkZXI/ICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBwbGF5c0lubGluZT8gICAgICA6IHN0cmluZyB8IGJvb2xlYW5cbiAgICAgICAgICBwb3N0ZXI/ICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHByZWxvYWQ/ICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgcmFkaW9Hcm91cD8gICAgICAgOiBzdHJpbmdcbiAgICAgICAgICByZWFkT25seT8gICAgICAgICA6IHN0cmluZyB8IGJvb2xlYW5cbiAgICAgICAgICByZWw/ICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHJlcXVpcmVkPyAgICAgICAgIDogc3RyaW5nIHwgYm9vbGVhblxuICAgICAgICAgIHJvbGU/ICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgcm93cz8gICAgICAgICAgICAgOiBzdHJpbmcgfCBudW1iZXJcbiAgICAgICAgICByb3dTcGFuPyAgICAgICAgICA6IHN0cmluZyB8IG51bWJlclxuICAgICAgICAgIHNhbmRib3g/ICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgc2NvcGU/ICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBzY29wZWQ/ICAgICAgICAgICA6IHN0cmluZyB8IGJvb2xlYW5cbiAgICAgICAgICBzY3JvbGxpbmc/ICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHNlYW1sZXNzPyAgICAgICAgIDogc3RyaW5nIHwgYm9vbGVhblxuICAgICAgICAgIHNlbGVjdGVkPyAgICAgICAgIDogc3RyaW5nIHwgYm9vbGVhblxuICAgICAgICAgIHNoYXBlPyAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgc2l6ZT8gICAgICAgICAgICAgOiBzdHJpbmcgfCBudW1iZXJcbiAgICAgICAgICBzaXplcz8gICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHNsb3Q/ICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgc3Bhbj8gICAgICAgICAgICAgOiBzdHJpbmcgfCBudW1iZXJcbiAgICAgICAgICBzcGVsbGNoZWNrPyAgICAgICA6IHN0cmluZyB8IGJvb2xlYW5cbiAgICAgICAgICBzcmM/ICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHNyY3NldD8gICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgc3JjRG9jPyAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBzcmNMYW5nPyAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHNyY1NldD8gICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgc3RhcnQ/ICAgICAgICAgICAgOiBzdHJpbmcgfCBudW1iZXJcbiAgICAgICAgICBzdGVwPyAgICAgICAgICAgICA6IHN0cmluZyB8IG51bWJlclxuICAgICAgICAgIHN0eWxlPyAgICAgICAgICAgIDogc3RyaW5nIHwgeyBbIGtleTogc3RyaW5nIF06IHN0cmluZyB8IG51bWJlciB9XG4gICAgICAgICAgc3VtbWFyeT8gICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICB0YWJJbmRleD8gICAgICAgICA6IHN0cmluZyB8IG51bWJlclxuICAgICAgICAgIHRhcmdldD8gICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgdGl0bGU/ICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICB0eXBlPyAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHVzZU1hcD8gICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgdmFsdWU/ICAgICAgICAgICAgOiBzdHJpbmcgfCBzdHJpbmdbXSB8IG51bWJlclxuICAgICAgICAgIHdpZHRoPyAgICAgICAgICAgIDogc3RyaW5nIHwgbnVtYmVyXG4gICAgICAgICAgd21vZGU/ICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICB3cmFwPyAgICAgICAgICAgICA6IHN0cmluZ1xuXG4gICAgICAgICAgLy8gUkRGYSBBdHRyaWJ1dGVzXG4gICAgICAgICAgYWJvdXQ/OiBzdHJpbmdcbiAgICAgICAgICBkYXRhdHlwZT86IHN0cmluZ1xuICAgICAgICAgIGlubGlzdD86IGFueVxuICAgICAgICAgIHByZWZpeD86IHN0cmluZ1xuICAgICAgICAgIHByb3BlcnR5Pzogc3RyaW5nXG4gICAgICAgICAgcmVzb3VyY2U/OiBzdHJpbmdcbiAgICAgICAgICB0eXBlb2Y/OiBzdHJpbmdcbiAgICAgICAgICB2b2NhYj86IHN0cmluZ1xuXG4gICAgICAgICAgLy8gTWljcm9kYXRhIEF0dHJpYnV0ZXNcbiAgICAgICAgICBpdGVtUHJvcD86IHN0cmluZ1xuICAgICAgICAgIGl0ZW1TY29wZT86IGJvb2xlYW5cbiAgICAgICAgICBpdGVtVHlwZT86IHN0cmluZ1xuICAgICAgICAgIGl0ZW1JRD86IHN0cmluZ1xuICAgICAgICAgIGl0ZW1SZWY/OiBzdHJpbmdcbiAgICAgfVxuXG4gICAgIGludGVyZmFjZSBTVkdBdHRyaWJ1dGVzIGV4dGVuZHMgSFRNTEF0dHJpYnV0ZXNcbiAgICAge1xuICAgICAgICAgIGFjY2VudEhlaWdodD8gICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgYWNjdW11bGF0ZT8gICAgICAgICAgICAgICAgOiBcIm5vbmVcIiB8IFwic3VtXCJcbiAgICAgICAgICBhZGRpdGl2ZT8gICAgICAgICAgICAgICAgICA6IFwicmVwbGFjZVwiIHwgXCJzdW1cIlxuICAgICAgICAgIGFsaWdubWVudEJhc2VsaW5lPyAgICAgICAgIDogXCJhdXRvXCIgfCBcImJhc2VsaW5lXCIgfCBcImJlZm9yZS1lZGdlXCIgfCBcInRleHQtYmVmb3JlLWVkZ2VcIiB8IFwibWlkZGxlXCIgfCBcImNlbnRyYWxcIiB8IFwiYWZ0ZXItZWRnZVwiIHwgXCJ0ZXh0LWFmdGVyLWVkZ2VcIiB8IFwiaWRlb2dyYXBoaWNcIiB8IFwiYWxwaGFiZXRpY1wiIHwgXCJoYW5naW5nXCIgfCBcIm1hdGhlbWF0aWNhbFwiIHwgXCJpbmhlcml0XCJcbiAgICAgICAgICBhbGxvd1Jlb3JkZXI/ICAgICAgICAgICAgICA6IFwibm9cIiB8IFwieWVzXCJcbiAgICAgICAgICBhbHBoYWJldGljPyAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGFtcGxpdHVkZT8gICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgYXJhYmljRm9ybT8gICAgICAgICAgICAgICAgOiBcImluaXRpYWxcIiB8IFwibWVkaWFsXCIgfCBcInRlcm1pbmFsXCIgfCBcImlzb2xhdGVkXCJcbiAgICAgICAgICBhc2NlbnQ/ICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGF0dHJpYnV0ZU5hbWU/ICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgYXR0cmlidXRlVHlwZT8gICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBhdXRvUmV2ZXJzZT8gICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGF6aW11dGg/ICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgYmFzZUZyZXF1ZW5jeT8gICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBiYXNlbGluZVNoaWZ0PyAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGJhc2VQcm9maWxlPyAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgYmJveD8gICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBiZWdpbj8gICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGJpYXM/ICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgYnk/ICAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBjYWxjTW9kZT8gICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGNhcEhlaWdodD8gICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgY2xpcD8gICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBjbGlwUGF0aD8gICAgICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGNsaXBQYXRoVW5pdHM/ICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgY2xpcFJ1bGU/ICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBjb2xvckludGVycG9sYXRpb24/ICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGNvbG9ySW50ZXJwb2xhdGlvbkZpbHRlcnM/IDogXCJhdXRvXCIgfCBcInNSR0JcIiB8IFwibGluZWFyUkdCXCIgfCBcImluaGVyaXRcIlxuICAgICAgICAgIGNvbG9yUHJvZmlsZT8gICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgY29sb3JSZW5kZXJpbmc/ICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBjb250ZW50U2NyaXB0VHlwZT8gICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGNvbnRlbnRTdHlsZVR5cGU/ICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgY3Vyc29yPyAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBjeD8gICAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGN5PyAgICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZD8gICAgICAgICAgICAgICAgICAgICAgICAgOiBzdHJpbmcgfCAobnVtYmVyIHwgc3RyaW5nKSBbXVxuICAgICAgICAgIGRlY2VsZXJhdGU/ICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZGVzY2VudD8gICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBkaWZmdXNlQ29uc3RhbnQ/ICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGRpcmVjdGlvbj8gICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZGlzcGxheT8gICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBkaXZpc29yPyAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGRvbWluYW50QmFzZWxpbmU/ICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZHVyPyAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBkeD8gICAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGR5PyAgICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZWRnZU1vZGU/ICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBlbGV2YXRpb24/ICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGVuYWJsZUJhY2tncm91bmQ/ICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZW5kPyAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBleHBvbmVudD8gICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGV4dGVybmFsUmVzb3VyY2VzUmVxdWlyZWQ/IDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZmlsbD8gICAgICAgICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBmaWxsT3BhY2l0eT8gICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGZpbGxSdWxlPyAgICAgICAgICAgICAgICAgIDogXCJub256ZXJvXCIgfCBcImV2ZW5vZGRcIiB8IFwiaW5oZXJpdFwiXG4gICAgICAgICAgZmlsdGVyPyAgICAgICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBmaWx0ZXJSZXM/ICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGZpbHRlclVuaXRzPyAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZmxvb2RDb2xvcj8gICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBmbG9vZE9wYWNpdHk/ICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGZvY3VzYWJsZT8gICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZm9udEZhbWlseT8gICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBmb250U2l6ZT8gICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGZvbnRTaXplQWRqdXN0PyAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZm9udFN0cmV0Y2g/ICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBmb250U3R5bGU/ICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGZvbnRWYXJpYW50PyAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZm9udFdlaWdodD8gICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBmb3JtYXQ/ICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGZyb20/ICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZng/ICAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBmeT8gICAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGcxPyAgICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZzI/ICAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBnbHlwaE5hbWU/ICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGdseXBoT3JpZW50YXRpb25Ib3Jpem9udGFsPzogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZ2x5cGhPcmllbnRhdGlvblZlcnRpY2FsPyAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBnbHlwaFJlZj8gICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGdyYWRpZW50VHJhbnNmb3JtPyAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgZ3JhZGllbnRVbml0cz8gICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBoYW5naW5nPyAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGhvcml6QWR2WD8gICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgaG9yaXpPcmlnaW5YPyAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBpZGVvZ3JhcGhpYz8gICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGltYWdlUmVuZGVyaW5nPyAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgaW4yPyAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBpbj8gICAgICAgICAgICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGludGVyY2VwdD8gICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgazE/ICAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBrMj8gICAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGszPyAgICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgazQ/ICAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBrPyAgICAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGtlcm5lbE1hdHJpeD8gICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAga2VybmVsVW5pdExlbmd0aD8gICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBrZXJuaW5nPyAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGtleVBvaW50cz8gICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAga2V5U3BsaW5lcz8gICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBrZXlUaW1lcz8gICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGxlbmd0aEFkanVzdD8gICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgbGV0dGVyU3BhY2luZz8gICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBsaWdodGluZ0NvbG9yPyAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGxpbWl0aW5nQ29uZUFuZ2xlPyAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgbG9jYWw/ICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBtYXJrZXJFbmQ/ICAgICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIG1hcmtlckhlaWdodD8gICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgbWFya2VyTWlkPyAgICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBtYXJrZXJTdGFydD8gICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIG1hcmtlclVuaXRzPyAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgbWFya2VyV2lkdGg/ICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBtYXNrPyAgICAgICAgICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIG1hc2tDb250ZW50VW5pdHM/ICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgbWFza1VuaXRzPyAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBtYXRoZW1hdGljYWw/ICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIG1vZGU/ICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgbnVtT2N0YXZlcz8gICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBvZmZzZXQ/ICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIG9wYWNpdHk/ICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgb3BlcmF0b3I/ICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBvcmRlcj8gICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIG9yaWVudD8gICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgb3JpZW50YXRpb24/ICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBvcmlnaW4/ICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIG92ZXJmbG93PyAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgb3ZlcmxpbmVQb3NpdGlvbj8gICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBvdmVybGluZVRoaWNrbmVzcz8gICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHBhaW50T3JkZXI/ICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgcGFub3NlMT8gICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBwYXRoTGVuZ3RoPyAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHBhdHRlcm5Db250ZW50VW5pdHM/ICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgcGF0dGVyblRyYW5zZm9ybT8gICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBwYXR0ZXJuVW5pdHM/ICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHBvaW50ZXJFdmVudHM/ICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgcG9pbnRzPyAgICAgICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBwb2ludHNBdFg/ICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHBvaW50c0F0WT8gICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgcG9pbnRzQXRaPyAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBwcmVzZXJ2ZUFscGhhPyAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHByZXNlcnZlQXNwZWN0UmF0aW8/ICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgcHJpbWl0aXZlVW5pdHM/ICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICByPyAgICAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHJhZGl1cz8gICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgcmVmWD8gICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICByZWZZPyAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHJlbmRlcmluZ0ludGVudD8gICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgcmVwZWF0Q291bnQ/ICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICByZXBlYXREdXI/ICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHJlcXVpcmVkRXh0ZW5zaW9ucz8gICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgcmVxdWlyZWRGZWF0dXJlcz8gICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICByZXN0YXJ0PyAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHJlc3VsdD8gICAgICAgICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgcm90YXRlPyAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICByeD8gICAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHJ5PyAgICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgc2NhbGU/ICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBzZWVkPyAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHNoYXBlUmVuZGVyaW5nPyAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgc2xvcGU/ICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBzcGFjaW5nPyAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHNwZWN1bGFyQ29uc3RhbnQ/ICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgc3BlY3VsYXJFeHBvbmVudD8gICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBzcGVlZD8gICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHNwcmVhZE1ldGhvZD8gICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgc3RhcnRPZmZzZXQ/ICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBzdGREZXZpYXRpb24/ICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHN0ZW1oPyAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgc3RlbXY/ICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBzdGl0Y2hUaWxlcz8gICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHN0b3BDb2xvcj8gICAgICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgc3RvcE9wYWNpdHk/ICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBzdHJpa2V0aHJvdWdoUG9zaXRpb24/ICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHN0cmlrZXRocm91Z2hUaGlja25lc3M/ICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgc3RyaW5nPyAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBzdHJva2U/ICAgICAgICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHN0cm9rZURhc2hhcnJheT8gICAgICAgICAgIDogc3RyaW5nIHwgbnVtYmVyXG4gICAgICAgICAgc3Ryb2tlRGFzaG9mZnNldD8gICAgICAgICAgOiBzdHJpbmcgfCBudW1iZXJcbiAgICAgICAgICBzdHJva2VMaW5lY2FwPyAgICAgICAgICAgICA6IFwiYnV0dFwiIHwgXCJyb3VuZFwiIHwgXCJzcXVhcmVcIiB8IFwiaW5oZXJpdFwiXG4gICAgICAgICAgc3Ryb2tlTGluZWpvaW4/ICAgICAgICAgICAgOiBcIm1pdGVyXCIgfCBcInJvdW5kXCIgfCBcImJldmVsXCIgfCBcImluaGVyaXRcIlxuICAgICAgICAgIHN0cm9rZU1pdGVybGltaXQ/ICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgc3Ryb2tlT3BhY2l0eT8gICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBzdHJva2VXaWR0aD8gICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHN1cmZhY2VTY2FsZT8gICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgc3lzdGVtTGFuZ3VhZ2U/ICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB0YWJsZVZhbHVlcz8gICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHRhcmdldFg/ICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgdGFyZ2V0WT8gICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB0ZXh0QW5jaG9yPyAgICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHRleHREZWNvcmF0aW9uPyAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgdGV4dExlbmd0aD8gICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB0ZXh0UmVuZGVyaW5nPyAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHRvPyAgICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgdHJhbnNmb3JtPyAgICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICB1MT8gICAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHUyPyAgICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgdW5kZXJsaW5lUG9zaXRpb24/ICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB1bmRlcmxpbmVUaGlja25lc3M/ICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHVuaWNvZGU/ICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgdW5pY29kZUJpZGk/ICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB1bmljb2RlUmFuZ2U/ICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHVuaXRzUGVyRW0/ICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgdkFscGhhYmV0aWM/ICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB2YWx1ZXM/ICAgICAgICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHZlY3RvckVmZmVjdD8gICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgdmVyc2lvbj8gICAgICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICB2ZXJ0QWR2WT8gICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHZlcnRPcmlnaW5YPyAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgdmVydE9yaWdpblk/ICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB2SGFuZ2luZz8gICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHZJZGVvZ3JhcGhpYz8gICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgdmlld0JveD8gICAgICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICB2aWV3VGFyZ2V0PyAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHZpc2liaWxpdHk/ICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgdk1hdGhlbWF0aWNhbD8gICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB3aWR0aHM/ICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHdvcmRTcGFjaW5nPyAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgd3JpdGluZ01vZGU/ICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB4MT8gICAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHgyPyAgICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgeD8gICAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB4Q2hhbm5lbFNlbGVjdG9yPyAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHhIZWlnaHQ/ICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgeGxpbmtBY3R1YXRlPyAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICB4bGlua0FyY3JvbGU/ICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHhsaW5rSHJlZj8gICAgICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgeGxpbmtSb2xlPyAgICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICB4bGlua1Nob3c/ICAgICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHhsaW5rVGl0bGU/ICAgICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgeGxpbmtUeXBlPyAgICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICB4bWxCYXNlPyAgICAgICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHhtbExhbmc/ICAgICAgICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgeG1sbnM/ICAgICAgICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICB4bWxuc1hsaW5rPyAgICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHhtbFNwYWNlPyAgICAgICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgeTE/ICAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB5Mj8gICAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHk/ICAgICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgeUNoYW5uZWxTZWxlY3Rvcj8gICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICB6PyAgICAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHpvb21BbmRQYW4/ICAgICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgIH1cbn1cbiIsIlxuZXhwb3J0IGludGVyZmFjZSAgRHJhZ2dhYmxlT3B0aW9uc1xue1xuICAgICBoYW5kbGVzICAgICAgICA6IEpTWC5FbGVtZW50IFtdXG4gICAgIG1pblZlbG9jaXR5PyAgIDogbnVtYmVyXG4gICAgIG1heFZlbG9jaXR5PyAgIDogbnVtYmVyXG4gICAgIHZlbG9jaXR5RmFjdG9yPzogbnVtYmVyXG4gICAgIG9uRHJhZz8gICAgICAgIDogKCBldmVudDogRHJhZ0V2ZW50ICkgPT4gdm9pZFxuICAgICBvblN0YXJ0RHJhZz8gICA6ICgpID0+IHZvaWRcbiAgICAgb25TdG9wRHJhZz8gICAgOiAoIGV2ZW50OiBEcmFnRXZlbnQgKSA9PiBib29sZWFuXG4gICAgIG9uRW5kQW5pbWF0aW9uPzogKCAgZXZlbnQ6IERyYWdFdmVudCAgKSA9PiB2b2lkXG59XG5cbmV4cG9ydCB0eXBlIERyYWdnYWJsZUNvbmZpZyA9IFJlcXVpcmVkIDxEcmFnZ2FibGVPcHRpb25zPlxuXG5leHBvcnQgaW50ZXJmYWNlIERyYWdFdmVudFxue1xuICAgICB4ICAgICAgICA6IG51bWJlclxuICAgICB5ICAgICAgICA6IG51bWJlclxuICAgICBvZmZzZXRYICA6IG51bWJlclxuICAgICBvZmZzZXRZICA6IG51bWJlclxuICAgICB0YXJnZXRYOiBudW1iZXJcbiAgICAgdGFyZ2V0WTogbnVtYmVyXG4gICAgIGRlbGF5ICAgIDogbnVtYmVyXG59XG5cbmZ1bmN0aW9uIGRlZmF1bHRDb25maWcgKCk6IERyYWdnYWJsZUNvbmZpZ1xue1xuICAgICByZXR1cm4ge1xuICAgICAgICAgIGhhbmRsZXMgICAgICAgOiBbXSxcbiAgICAgICAgICBtaW5WZWxvY2l0eSAgIDogMCxcbiAgICAgICAgICBtYXhWZWxvY2l0eSAgIDogMSxcbiAgICAgICAgICBvblN0YXJ0RHJhZyAgIDogKCkgPT4ge30sXG4gICAgICAgICAgb25EcmFnICAgICAgICA6ICgpID0+IHt9LFxuICAgICAgICAgIG9uU3RvcERyYWcgICAgOiAoKSA9PiB0cnVlLFxuICAgICAgICAgIG9uRW5kQW5pbWF0aW9uOiAoKSA9PiB7fSxcbiAgICAgICAgICB2ZWxvY2l0eUZhY3RvcjogKHdpbmRvdy5pbm5lckhlaWdodCA8IHdpbmRvdy5pbm5lcldpZHRoXG4gICAgICAgICAgICAgICAgICAgICAgICAgPyB3aW5kb3cuaW5uZXJIZWlnaHQgOiB3aW5kb3cuaW5uZXJXaWR0aCkgLyAyLFxuICAgICB9XG59XG5cbnZhciBpc19kcmFnICAgID0gZmFsc2VcbnZhciBwb2ludGVyOiBNb3VzZUV2ZW50IHwgVG91Y2hcblxuLy8gaHR0cHM6Ly9naXN0LmdpdGh1Yi5jb20vZ3JlLzE2NTAyOTRcbnZhciBFYXNpbmdGdW5jdGlvbnMgPSB7XG4gICAgIGxpbmVhciAgICAgICAgOiAoIHQ6IG51bWJlciApID0+IHQsXG4gICAgIGVhc2VJblF1YWQgICAgOiAoIHQ6IG51bWJlciApID0+IHQqdCxcbiAgICAgZWFzZU91dFF1YWQgICA6ICggdDogbnVtYmVyICkgPT4gdCooMi10KSxcbiAgICAgZWFzZUluT3V0UXVhZCA6ICggdDogbnVtYmVyICkgPT4gdDwuNSA/IDIqdCp0IDogLTErKDQtMip0KSp0LFxuICAgICBlYXNlSW5DdWJpYyAgIDogKCB0OiBudW1iZXIgKSA9PiB0KnQqdCxcbiAgICAgZWFzZU91dEN1YmljICA6ICggdDogbnVtYmVyICkgPT4gKC0tdCkqdCp0KzEsXG4gICAgIGVhc2VJbk91dEN1YmljOiAoIHQ6IG51bWJlciApID0+IHQ8LjUgPyA0KnQqdCp0IDogKHQtMSkqKDIqdC0yKSooMip0LTIpKzEsXG4gICAgIGVhc2VJblF1YXJ0ICAgOiAoIHQ6IG51bWJlciApID0+IHQqdCp0KnQsXG4gICAgIGVhc2VPdXRRdWFydCAgOiAoIHQ6IG51bWJlciApID0+IDEtKC0tdCkqdCp0KnQsXG4gICAgIGVhc2VJbk91dFF1YXJ0OiAoIHQ6IG51bWJlciApID0+IHQ8LjUgPyA4KnQqdCp0KnQgOiAxLTgqKC0tdCkqdCp0KnQsXG4gICAgIGVhc2VJblF1aW50ICAgOiAoIHQ6IG51bWJlciApID0+IHQqdCp0KnQqdCxcbiAgICAgZWFzZU91dFF1aW50ICA6ICggdDogbnVtYmVyICkgPT4gMSsoLS10KSp0KnQqdCp0LFxuICAgICBlYXNlSW5PdXRRdWludDogKCB0OiBudW1iZXIgKSA9PiB0PC41ID8gMTYqdCp0KnQqdCp0IDogMSsxNiooLS10KSp0KnQqdCp0XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBkcmFnZ2FibGUgKCBvcHRpb25zOiBEcmFnZ2FibGVPcHRpb25zIClcbntcbiAgICAgY29uc3QgY29uZmlnICAgICA9IGRlZmF1bHRDb25maWcgKClcblxuICAgICB2YXIgaXNfYWN0aXZlICA9IGZhbHNlXG4gICAgIHZhciBpc19hbmltYXRlID0gZmFsc2VcbiAgICAgdmFyIGN1cnJlbnRfZXZlbnQ6IERyYWdFdmVudFxuXG4gICAgIHZhciBzdGFydF90aW1lID0gMFxuICAgICB2YXIgc3RhcnRfeCAgICA9IDBcbiAgICAgdmFyIHN0YXJ0X3kgICAgPSAwXG5cbiAgICAgdmFyIHZlbG9jaXR5X2RlbGF5ID0gNTAwXG4gICAgIHZhciB2ZWxvY2l0eV94OiBudW1iZXJcbiAgICAgdmFyIHZlbG9jaXR5X3k6IG51bWJlclxuXG4gICAgIHZhciBjdXJyZW50X2FuaW1hdGlvbiA9IC0xXG5cbiAgICAgdXBkYXRlQ29uZmlnICggb3B0aW9ucyApXG5cbiAgICAgZnVuY3Rpb24gdXBkYXRlQ29uZmlnICggb3B0aW9uczogRHJhZ2dhYmxlT3B0aW9ucyApXG4gICAgIHtcbiAgICAgICAgICBpZiAoIGlzX2RyYWcgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICggbmF2aWdhdG9yLm1heFRvdWNoUG9pbnRzID4gMCApXG4gICAgICAgICAgICAgICBkb2N1bWVudC5ib2R5LnN0eWxlLnRvdWNoQWN0aW9uID0gXCJub25lXCJcblxuICAgICAgICAgIGRpc2FibGVFdmVudHMgKClcblxuICAgICAgICAgIE9iamVjdC5hc3NpZ24gKCBjb25maWcsIG9wdGlvbnMgKVxuXG4gICAgICAgICAgZW5hYmxlRXZlbnRzICgpXG4gICAgIH1cblxuICAgICBmdW5jdGlvbiBhZGRIYW5kbGVzICggLi4uIGhhbmRsZXM6IEpTWC5FbGVtZW50IFtdIClcbiAgICAge1xuICAgICAgICAgIGZvciAoIGNvbnN0IGggb2YgaGFuZGxlcyApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgaWYgKCAhIGNvbmZpZy5oYW5kbGVzLmluY2x1ZGVzIChoKSApXG4gICAgICAgICAgICAgICAgICAgIGNvbmZpZy5oYW5kbGVzLnB1c2ggKGgpXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKCBpc19hY3RpdmUgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGRlc2FjdGl2YXRlICgpXG4gICAgICAgICAgICAgICBhY3RpdmF0ZSAoKVxuICAgICAgICAgIH1cbiAgICAgfVxuXG4gICAgIGZ1bmN0aW9uIGFjdGl2YXRlICgpXG4gICAgIHtcbiAgICAgICAgICBlbmFibGVFdmVudHMgKClcbiAgICAgICAgICBpc19hY3RpdmUgPSB0cnVlXG4gICAgIH1cblxuICAgICBmdW5jdGlvbiBkZXNhY3RpdmF0ZSAoKVxuICAgICB7XG4gICAgICAgICAgZGlzYWJsZUV2ZW50cyAoKVxuICAgICAgICAgIGlzX2FjdGl2ZSA9IGZhbHNlXG4gICAgIH1cblxuICAgICByZXR1cm4ge1xuICAgICAgICAgIHVwZGF0ZUNvbmZpZyxcbiAgICAgICAgICBhZGRIYW5kbGVzLFxuICAgICAgICAgIGlzQWN0aXZlOiAoKSA9PiBpc19hY3RpdmUsXG4gICAgICAgICAgYWN0aXZhdGUsXG4gICAgICAgICAgZGVzYWN0aXZhdGUsXG4gICAgIH1cblxuICAgICBmdW5jdGlvbiBlbmFibGVFdmVudHMgKClcbiAgICAge1xuICAgICAgICAgIGZvciAoIGNvbnN0IGggb2YgY29uZmlnLmhhbmRsZXMgKVxuICAgICAgICAgICAgICAgaC5hZGRFdmVudExpc3RlbmVyICggXCJwb2ludGVyZG93blwiLCBvblN0YXJ0LCB7IHBhc3NpdmU6IHRydWUgfSApXG4gICAgIH1cbiAgICAgZnVuY3Rpb24gZGlzYWJsZUV2ZW50cyAoKVxuICAgICB7XG4gICAgICAgICAgZm9yICggY29uc3QgaCBvZiBjb25maWcuaGFuZGxlcyApXG4gICAgICAgICAgICAgICBoLnJlbW92ZUV2ZW50TGlzdGVuZXIgKCBcInBvaW50ZXJkb3duXCIgLCBvblN0YXJ0IClcbiAgICAgfVxuXG4gICAgIGZ1bmN0aW9uIG9uU3RhcnQgKCBldmVudDogTW91c2VFdmVudCB8IFRvdWNoRXZlbnQgKVxuICAgICB7XG4gICAgICAgICAgaWYgKCBpc19kcmFnIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBjb25zb2xlLndhcm4gKCBcIlRlbnRhdGl2ZSBkZSBkw6ltYXJyYWdlIGRlcyDDqXbDqW5lbWVudHMgXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgXCJcXFwiZHJhZ2dhYmxlIFxcXCIgZMOpasOgIGVuIGNvdXJzLlwiIClcbiAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICggaXNfYW5pbWF0ZSApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgc3RvcFZlbG9jaXR5RnJhbWUgKClcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBwb2ludGVyID0gKGV2ZW50IGFzIFRvdWNoRXZlbnQpLnRvdWNoZXNcbiAgICAgICAgICAgICAgICAgICAgPyAoZXZlbnQgYXMgVG91Y2hFdmVudCkudG91Y2hlcyBbMF1cbiAgICAgICAgICAgICAgICAgICAgOiAoZXZlbnQgYXMgTW91c2VFdmVudClcblxuICAgICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyIChcInBvaW50ZXJtb3ZlXCIsIG9uTW92ZSlcbiAgICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lciAoXCJwb2ludGVydXBcIiAgLCBvbkVuZClcbiAgICAgICAgICBkaXNhYmxlRXZlbnRzICgpXG5cbiAgICAgICAgICBjdXJyZW50X2FuaW1hdGlvbiA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgKCBvbkFuaW1hdGlvblN0YXJ0IClcblxuICAgICAgICAgIGlzX2RyYWcgPSB0cnVlXG4gICAgIH1cbiAgICAgZnVuY3Rpb24gb25Nb3ZlICggZXZlbnQ6IE1vdXNlRXZlbnQgfCBUb3VjaEV2ZW50IClcbiAgICAge1xuICAgICAgICAgIGlmICggaXNfZHJhZyA9PSBmYWxzZSApXG4gICAgICAgICAgICAgICByZXR1cm5cblxuICAgICAgICAgIHBvaW50ZXIgPSAoZXZlbnQgYXMgVG91Y2hFdmVudCkudG91Y2hlcyAhPT0gdW5kZWZpbmVkXG4gICAgICAgICAgICAgICAgICAgID8gKGV2ZW50IGFzIFRvdWNoRXZlbnQpLnRvdWNoZXMgWzBdXG4gICAgICAgICAgICAgICAgICAgIDogKGV2ZW50IGFzIE1vdXNlRXZlbnQpXG4gICAgIH1cbiAgICAgZnVuY3Rpb24gb25FbmQgKCBldmVudDogTW91c2VFdmVudCB8IFRvdWNoRXZlbnQgKVxuICAgICB7XG4gICAgICAgICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIgKFwicG9pbnRlcm1vdmVcIiwgb25Nb3ZlKVxuICAgICAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyIChcInBvaW50ZXJ1cFwiICAsIG9uRW5kKVxuICAgICAgICAgIGVuYWJsZUV2ZW50cyAoKVxuXG4gICAgICAgICAgaXNfZHJhZyA9IGZhbHNlXG4gICAgIH1cblxuICAgICBmdW5jdGlvbiBvbkFuaW1hdGlvblN0YXJ0ICggbm93OiBudW1iZXIgKVxuICAgICB7XG4gICAgICAgICAgc3RhcnRfeCAgICA9IHBvaW50ZXIuY2xpZW50WFxuICAgICAgICAgIHN0YXJ0X3kgICAgPSBwb2ludGVyLmNsaWVudFlcbiAgICAgICAgICBzdGFydF90aW1lID0gbm93XG5cbiAgICAgICAgICBjdXJyZW50X2V2ZW50ID0ge1xuICAgICAgICAgICAgICAgZGVsYXkgICAgOiAwLFxuICAgICAgICAgICAgICAgeCAgICAgICAgOiAwLFxuICAgICAgICAgICAgICAgeSAgICAgICAgOiAwLFxuICAgICAgICAgICAgICAgb2Zmc2V0WCAgOiAwLFxuICAgICAgICAgICAgICAgb2Zmc2V0WSAgOiAwLFxuICAgICAgICAgICAgICAgdGFyZ2V0WDogMCxcbiAgICAgICAgICAgICAgIHRhcmdldFk6IDAsXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29uZmlnLm9uU3RhcnREcmFnICgpXG5cbiAgICAgICAgICBjdXJyZW50X2FuaW1hdGlvbiA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgKCBvbkFuaW1hdGlvbkZyYW1lIClcbiAgICAgfVxuICAgICBmdW5jdGlvbiBvbkFuaW1hdGlvbkZyYW1lICggbm93OiBudW1iZXIgKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgeyB2ZWxvY2l0eUZhY3RvciB9ID0gY29uZmlnXG5cbiAgICAgICAgICBjb25zdCB4ICAgICAgICAgICA9IHBvaW50ZXIuY2xpZW50WCAtIHN0YXJ0X3hcbiAgICAgICAgICBjb25zdCB5ICAgICAgICAgICA9IHN0YXJ0X3kgLSBwb2ludGVyLmNsaWVudFlcbiAgICAgICAgICBjb25zdCBkZWxheSAgICAgICA9IG5vdyAtIHN0YXJ0X3RpbWVcbiAgICAgICAgICBjb25zdCBvZmZzZXREZWxheSA9IGRlbGF5IC0gY3VycmVudF9ldmVudC5kZWxheVxuICAgICAgICAgIGNvbnN0IG9mZnNldFggICAgID0geCAtIGN1cnJlbnRfZXZlbnQueFxuICAgICAgICAgIGNvbnN0IG9mZnNldFkgICAgID0geSAtIGN1cnJlbnRfZXZlbnQueVxuXG4gICAgICAgICAgY3VycmVudF9ldmVudCA9IHtcbiAgICAgICAgICAgICAgIGRlbGF5LFxuICAgICAgICAgICAgICAgeCxcbiAgICAgICAgICAgICAgIHksXG4gICAgICAgICAgICAgICB0YXJnZXRYOiB4LFxuICAgICAgICAgICAgICAgdGFyZ2V0WTogeSxcbiAgICAgICAgICAgICAgIG9mZnNldFgsXG4gICAgICAgICAgICAgICBvZmZzZXRZLFxuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICggaXNfZHJhZyApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgY29uZmlnLm9uRHJhZyAoIGN1cnJlbnRfZXZlbnQgKVxuICAgICAgICAgICAgICAgY3VycmVudF9hbmltYXRpb24gPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lICggb25BbmltYXRpb25GcmFtZSApXG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBzdGFydF90aW1lICAgICA9IG5vd1xuICAgICAgICAgICAgICAgc3RhcnRfeCAgICAgICAgPSB4XG4gICAgICAgICAgICAgICBzdGFydF95ICAgICAgICA9IHlcbiAgICAgICAgICAgICAgIHZlbG9jaXR5X3ggICAgICAgPSB2ZWxvY2l0eUZhY3RvciAqIG5vcm0gKCBvZmZzZXRYIC8gb2Zmc2V0RGVsYXkgKVxuICAgICAgICAgICAgICAgdmVsb2NpdHlfeSAgICAgICA9IHZlbG9jaXR5RmFjdG9yICogbm9ybSAoIG9mZnNldFkgLyBvZmZzZXREZWxheSApXG5cbiAgICAgICAgICAgICAgIGN1cnJlbnRfZXZlbnQudGFyZ2V0WCArPSB2ZWxvY2l0eV94XG4gICAgICAgICAgICAgICBjdXJyZW50X2V2ZW50LnRhcmdldFkgKz0gdmVsb2NpdHlfeVxuXG4gICAgICAgICAgICAgICBpZiAoIGNvbmZpZy5vblN0b3BEcmFnICggY3VycmVudF9ldmVudCApID09PSB0cnVlIClcbiAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgaXNfYW5pbWF0ZSA9IHRydWVcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudF9hbmltYXRpb24gPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lICggb25WZWxvY2l0eUZyYW1lIClcbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBmdW5jdGlvbiBub3JtICggdmFsdWU6IG51bWJlciApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgaWYgKHZhbHVlIDwgLTEgKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gLTFcblxuICAgICAgICAgICAgICAgaWYgKCB2YWx1ZSA+IDEgKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gMVxuXG4gICAgICAgICAgICAgICByZXR1cm4gdmFsdWVcbiAgICAgICAgICB9XG4gICAgIH1cbiAgICAgZnVuY3Rpb24gb25WZWxvY2l0eUZyYW1lICggbm93OiBudW1iZXIgKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgZGVsYXkgPSBub3cgLSBzdGFydF90aW1lXG5cbiAgICAgICAgICBjb25zdCB0ID0gZGVsYXkgPj0gdmVsb2NpdHlfZGVsYXlcbiAgICAgICAgICAgICAgICAgID8gMVxuICAgICAgICAgICAgICAgICAgOiBkZWxheSAvIHZlbG9jaXR5X2RlbGF5XG5cbiAgICAgICAgICBjb25zdCBmYWN0b3IgID0gRWFzaW5nRnVuY3Rpb25zLmVhc2VPdXRRdWFydCAodClcbiAgICAgICAgICBjb25zdCBvZmZzZXRYID0gdmVsb2NpdHlfeCAqIGZhY3RvclxuICAgICAgICAgIGNvbnN0IG9mZnNldFkgPSB2ZWxvY2l0eV95ICogZmFjdG9yXG5cbiAgICAgICAgICBjdXJyZW50X2V2ZW50LnggICAgICAgPSBzdGFydF94ICsgb2Zmc2V0WFxuICAgICAgICAgIGN1cnJlbnRfZXZlbnQueSAgICAgICA9IHN0YXJ0X3kgKyBvZmZzZXRZXG4gICAgICAgICAgY3VycmVudF9ldmVudC5vZmZzZXRYID0gdmVsb2NpdHlfeCAtIG9mZnNldFhcbiAgICAgICAgICBjdXJyZW50X2V2ZW50Lm9mZnNldFkgPSB2ZWxvY2l0eV95IC0gb2Zmc2V0WVxuXG4gICAgICAgICAgY29uZmlnLm9uRHJhZyAoIGN1cnJlbnRfZXZlbnQgKVxuXG4gICAgICAgICAgaWYgKCB0ID09IDEgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGlzX2FuaW1hdGUgPSBmYWxzZVxuICAgICAgICAgICAgICAgY29uZmlnLm9uRW5kQW5pbWF0aW9uICggY3VycmVudF9ldmVudCApXG4gICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjdXJyZW50X2FuaW1hdGlvbiA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgKCBvblZlbG9jaXR5RnJhbWUgKVxuICAgICB9XG4gICAgIGZ1bmN0aW9uIHN0b3BWZWxvY2l0eUZyYW1lICgpXG4gICAgIHtcbiAgICAgICAgICBpc19hbmltYXRlID0gZmFsc2VcbiAgICAgICAgICB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUgKCBjdXJyZW50X2FuaW1hdGlvbiApXG4gICAgICAgICAgY29uZmlnLm9uRW5kQW5pbWF0aW9uICggY3VycmVudF9ldmVudCApXG4gICAgIH1cbn1cbiIsIlxuZXhwb3J0IHR5cGUgRXh0ZW5kZWRDU1NTdHlsZURlY2xhcmF0aW9uID0gQ1NTU3R5bGVEZWNsYXJhdGlvbiAmXG57XG4gICAgZGlzcGxheSAgICAgIDogXCJpbmxpbmVcIiB8IFwiYmxvY2tcIiB8IFwiY29udGVudHNcIiB8IFwiZmxleFwiIHwgXCJncmlkXCIgfCBcImlubGluZS1ibG9ja1wiIHwgXCJpbmxpbmUtZmxleFwiIHwgXCJpbmxpbmUtZ3JpZFwiIHwgXCJpbmxpbmUtdGFibGVcIiB8IFwibGlzdC1pdGVtXCIgfCBcInJ1bi1pblwiIHwgXCJ0YWJsZVwiIHwgXCJ0YWJsZS1jYXB0aW9uXCIgfCBcInRhYmxlLWNvbHVtbi1ncm91cFwiIHwgXCJ0YWJsZS1oZWFkZXItZ3JvdXBcIiB8IFwidGFibGUtZm9vdGVyLWdyb3VwXCIgfCBcInRhYmxlLXJvdy1ncm91cFwiIHwgXCJ0YWJsZS1jZWxsXCIgfCBcInRhYmxlLWNvbHVtblwiIHwgXCJ0YWJsZS1yb3dcIiB8IFwibm9uZVwiIHwgXCJpbml0aWFsXCIgfCBcImluaGVyaXRcIlxuICAgIGZsZXhEaXJlY3Rpb246IFwicm93XCIgfCBcInJvdy1yZXZlcnNlXCIgfCBcImNvbHVtblwiIHwgXCJjb2x1bW4tcmV2ZXJzZVwiIHwgXCJpbml0aWFsXCIgfCBcImluaGVyaXRcIlxuICAgIG92ZXJmbG93ICAgICA6IFwidmlzaWJsZVwiIHwgXCJoaWRkZW5cIiB8IFwic2Nyb2xsXCIgfCBcImF1dG9cIiB8IFwiaW5pdGlhbFwiIHwgXCJpbmhlcml0XCJcbiAgICBvdmVyZmxvd1ggICAgOiBcInZpc2libGVcIiB8IFwiaGlkZGVuXCIgfCBcInNjcm9sbFwiIHwgXCJhdXRvXCIgfCBcImluaXRpYWxcIiB8IFwiaW5oZXJpdFwiXG4gICAgb3ZlcmZsb3dZICAgIDogXCJ2aXNpYmxlXCIgfCBcImhpZGRlblwiIHwgXCJzY3JvbGxcIiB8IFwiYXV0b1wiIHwgXCJpbml0aWFsXCIgfCBcImluaGVyaXRcIlxuICAgIHBvc2l0aW9uICAgICA6IFwic3RhdGljXCIgfCBcImFic29sdXRlXCIgfCBcImZpeGVkXCIgfCBcInJlbGF0aXZlXCIgfCBcInN0aWNreVwiIHwgXCJpbml0aWFsXCIgfCBcImluaGVyaXRcIlxufVxuXG4vKmRlY2xhcmUgZ2xvYmFse1xuXG4gICAgIGludGVyZmFjZSBXaW5kb3dcbiAgICAge1xuICAgICAgICAgIG9uOiBXaW5kb3cgW1wiYWRkRXZlbnRMaXN0ZW5lclwiXVxuICAgICAgICAgIG9mZjogV2luZG93IFtcInJlbW92ZUV2ZW50TGlzdGVuZXJcIl1cbiAgICAgfVxuXG4gICAgIGludGVyZmFjZSBFbGVtZW50XG4gICAgIHtcbiAgICAgICAgICBjc3MgKCBwcm9wZXJ0aWVzOiBQYXJ0aWFsIDxFeHRlbmRlZENTU1N0eWxlRGVjbGFyYXRpb24+ICk6IHRoaXNcblxuICAgICAgICAgIGNzc0ludCAgICggcHJvcGVydHk6IHN0cmluZyApOiBudW1iZXJcbiAgICAgICAgICBjc3NGbG9hdCAoIHByb3BlcnR5OiBzdHJpbmcgKTogbnVtYmVyXG5cbiAgICAgICAgICBvbiA6IEhUTUxFbGVtZW50IFtcImFkZEV2ZW50TGlzdGVuZXJcIl1cbiAgICAgICAgICBvZmY6IEhUTUxFbGVtZW50IFtcInJlbW92ZUV2ZW50TGlzdGVuZXJcIl1cbiAgICAgICAgICAkICA6IEhUTUxFbGVtZW50IFtcInF1ZXJ5U2VsZWN0b3JcIl1cbiAgICAgICAgICAkJCA6IEhUTUxFbGVtZW50IFtcInF1ZXJ5U2VsZWN0b3JBbGxcIl1cbiAgICAgfVxufVxuXG5XaW5kb3cucHJvdG90eXBlLm9uICA9IFdpbmRvdy5wcm90b3R5cGUuYWRkRXZlbnRMaXN0ZW5lclxuV2luZG93LnByb3RvdHlwZS5vZmYgPSBXaW5kb3cucHJvdG90eXBlLnJlbW92ZUV2ZW50TGlzdGVuZXJcblxuRWxlbWVudC5wcm90b3R5cGUuY3NzID0gZnVuY3Rpb24gKCBwcm9wcyApXG57XG5PYmplY3QuYXNzaWduICggdGhpcy5zdHlsZSwgcHJvcHMgKVxucmV0dXJuIHRoaXNcbn1cblxuRWxlbWVudC5wcm90b3R5cGUuY3NzSW50ID0gZnVuY3Rpb24gKCBwcm9wZXJ0eTogc3RyaW5nIClcbntcbiAgICAgdmFyIHZhbHVlID0gcGFyc2VJbnQgKCB0aGlzLnN0eWxlIFsgcHJvcGVydHkgXSApXG5cbiAgICAgaWYgKCBOdW1iZXIuaXNOYU4gKCB2YWx1ZSApIClcbiAgICAge1xuICAgICAgICAgIHZhbHVlID0gcGFyc2VJbnQgKCB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZSAoIHRoaXMgKSBbIHByb3BlcnR5IF0gKVxuXG4gICAgICAgICAgaWYgKCBOdW1iZXIuaXNOYU4gKCB2YWx1ZSApIClcbiAgICAgICAgICAgICAgIHZhbHVlID0gMFxuICAgICB9XG5cbiAgICAgcmV0dXJuIHZhbHVlXG59XG5cbkVsZW1lbnQucHJvdG90eXBlLmNzc0Zsb2F0ID0gZnVuY3Rpb24gKCBwcm9wZXJ0eTogc3RyaW5nIClcbntcbiAgICAgdmFyIHZhbHVlID0gcGFyc2VGbG9hdCAoIHRoaXMuc3R5bGUgWyBwcm9wZXJ0eSBdIClcblxuICAgICBpZiAoIE51bWJlci5pc05hTiAoIHZhbHVlICkgKVxuICAgICB7XG4gICAgICAgICAgdmFsdWUgPSBwYXJzZUZsb2F0ICggd2luZG93LmdldENvbXB1dGVkU3R5bGUgKCB0aGlzICkgWyBwcm9wZXJ0eSBdIClcblxuICAgICAgICAgIGlmICggTnVtYmVyLmlzTmFOICggdmFsdWUgKSApXG4gICAgICAgICAgICAgICB2YWx1ZSA9IDBcbiAgICAgfVxuXG4gICAgIHJldHVybiB2YWx1ZVxufVxuXG5FbGVtZW50LnByb3RvdHlwZS5vbiAgPSBFbGVtZW50LnByb3RvdHlwZS5hZGRFdmVudExpc3RlbmVyXG5cbkVsZW1lbnQucHJvdG90eXBlLm9mZiA9IEVsZW1lbnQucHJvdG90eXBlLnJlbW92ZUV2ZW50TGlzdGVuZXJcblxuRWxlbWVudC5wcm90b3R5cGUuJCAgID0gRWxlbWVudC5wcm90b3R5cGUucXVlcnlTZWxlY3RvclxuXG5FbGVtZW50LnByb3RvdHlwZS4kJCAgPSBFbGVtZW50LnByb3RvdHlwZS5xdWVyeVNlbGVjdG9yQWxsXG5cblxuRWxlbWVudC5wcm90b3R5cGUuY3NzSW50ID0gZnVuY3Rpb24gKCBwcm9wZXJ0eTogc3RyaW5nIClcbntcbiAgICAgdmFyIHZhbHVlID0gcGFyc2VJbnQgKCB0aGlzLnN0eWxlIFsgcHJvcGVydHkgXSApXG5cbiAgICAgaWYgKCBOdW1iZXIuaXNOYU4gKCB2YWx1ZSApIClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHN0eWxlID0gd2luZG93LmdldENvbXB1dGVkU3R5bGUgKCB0aGlzIClcblxuICAgICAgICAgIHZhbHVlID0gcGFyc2VJbnQgKCBzdHlsZSBbIHByb3BlcnR5IF0gKVxuXG4gICAgICAgICAgaWYgKCBOdW1iZXIuaXNOYU4gKCB2YWx1ZSApIClcbiAgICAgICAgICAgICAgIHZhbHVlID0gMFxuICAgICB9XG5cbiAgICAgcmV0dXJuIHZhbHVlXG59Ki9cblxuZXhwb3J0IGZ1bmN0aW9uIGNzcyAoIGVsOiBIVE1MRWxlbWVudCB8IFNWR0VsZW1lbnQsIHByb3BzOiBQYXJ0aWFsIDxFeHRlbmRlZENTU1N0eWxlRGVjbGFyYXRpb24+IClcbntcbiAgICAgT2JqZWN0LmFzc2lnbiAoIGVsLnN0eWxlLCBwcm9wcyApXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjc3NGbG9hdCAoIGVsOiBIVE1MRWxlbWVudCB8IFNWR0VsZW1lbnQsIHByb3BlcnR5OiBzdHJpbmcgKVxue1xuICAgICB2YXIgdmFsdWUgPSBwYXJzZUZsb2F0ICggZWwuc3R5bGUgWyBwcm9wZXJ0eSBdIClcblxuICAgICBpZiAoIE51bWJlci5pc05hTiAoIHZhbHVlICkgKVxuICAgICB7XG4gICAgICAgICAgdmFsdWUgPSBwYXJzZUZsb2F0ICggd2luZG93LmdldENvbXB1dGVkU3R5bGUgKCBlbCApIFsgcHJvcGVydHkgXSApXG5cbiAgICAgICAgICBpZiAoIE51bWJlci5pc05hTiAoIHZhbHVlICkgKVxuICAgICAgICAgICAgICAgdmFsdWUgPSAwXG4gICAgIH1cblxuICAgICByZXR1cm4gdmFsdWVcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNzc0ludCAoIGVsOiBIVE1MRWxlbWVudCB8IFNWR0VsZW1lbnQsIHByb3BlcnR5OiBzdHJpbmcgKVxue1xuICAgICB2YXIgdmFsdWUgPSBwYXJzZUludCAoIGVsLnN0eWxlIFsgcHJvcGVydHkgXSApXG5cbiAgICAgaWYgKCBOdW1iZXIuaXNOYU4gKCB2YWx1ZSApIClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHN0eWxlID0gd2luZG93LmdldENvbXB1dGVkU3R5bGUgKCBlbCApXG5cbiAgICAgICAgICB2YWx1ZSA9IHBhcnNlSW50ICggc3R5bGUgWyBwcm9wZXJ0eSBdIClcblxuICAgICAgICAgIGlmICggTnVtYmVyLmlzTmFOICggdmFsdWUgKSApXG4gICAgICAgICAgICAgICB2YWx1ZSA9IDBcbiAgICAgfVxuXG4gICAgIHJldHVybiB2YWx1ZVxufVxuXG4iLCJcbmltcG9ydCAqIGFzIFVpIGZyb20gXCIuL2RyYWdnYWJsZS5qc1wiXG5pbXBvcnQgeyBjc3NJbnQgfSBmcm9tIFwiLi9kb20uanNcIlxuXG50eXBlIERpcmVjdGlvbiA9IFwibHJcIiB8IFwicmxcIiB8IFwiYnRcIiB8IFwidGJcIlxuXG4vL2V4cG9ydCB0eXBlIEV4cGVuZGFibGVQcm9wZXJ0eSA9IFwid2lkdGhcIiB8IFwiaGVpZ2h0XCJcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHwgXCJ0b3BcIiB8IFwibGVmdFwiIHwgXCJib3R0b21cIiB8IFwicmlnaHRcIlxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfCBcInhcIiB8IFwieVwiXG5cbmV4cG9ydCB0eXBlIEV4cGVuZGFibGVFbGVtZW50ID0gUmV0dXJuVHlwZSA8dHlwZW9mIGV4cGFuZGFibGU+XG5cbnR5cGUgRXhwZW5kYWJsZU9wdGlvbnMgPSBQYXJ0aWFsIDxFeHBlbmRhYmxlQ29uZmlnPlxuXG5pbnRlcmZhY2UgRXhwZW5kYWJsZUNvbmZpZ1xue1xuICAgICBoYW5kbGVzICAgICAgOiBKU1guRWxlbWVudCBbXVxuICAgICBwcm9wZXJ0eT8gICAgOiBzdHJpbmcsXG4gICAgIG9wZW4gICAgICAgICA6IGJvb2xlYW5cbiAgICAgbmVhciAgICAgICAgIDogbnVtYmVyXG4gICAgIGRlbGF5ICAgICAgICA6IG51bWJlclxuICAgICBkaXJlY3Rpb24gICAgOiBEaXJlY3Rpb25cbiAgICAgbWluU2l6ZSAgICAgIDogbnVtYmVyXG4gICAgIG1heFNpemUgICAgICA6IG51bWJlclxuICAgICB1bml0ICAgICAgICAgOiBcInB4XCIgfCBcIiVcIiB8IFwiXCIsXG4gICAgIG9uQmVmb3JlT3BlbiA6ICgpID0+IHZvaWRcbiAgICAgb25BZnRlck9wZW4gIDogKCkgPT4gdm9pZFxuICAgICBvbkJlZm9yZUNsb3NlOiAoKSA9PiB2b2lkXG4gICAgIG9uQWZ0ZXJDbG9zZSA6ICgpID0+IHZvaWRcbn1cblxuY29uc3QgdmVydGljYWxQcm9wZXJ0aWVzID0gWyBcImhlaWdodFwiLCBcInRvcFwiLCBcImJvdHRvbVwiIF1cblxuZnVuY3Rpb24gZGVmYXVsdENvbmZpZyAoKTogRXhwZW5kYWJsZUNvbmZpZ1xue1xuICAgICByZXR1cm4ge1xuICAgICAgICAgIGhhbmRsZXMgICAgICA6IFtdLFxuICAgICAgICAgIHByb3BlcnR5ICAgICA6IFwiaGVpZ2h0XCIsXG4gICAgICAgICAgb3BlbiAgICAgICAgIDogZmFsc2UsXG4gICAgICAgICAgbmVhciAgICAgICAgIDogNDAsXG4gICAgICAgICAgZGVsYXkgICAgICAgIDogMjUwLFxuICAgICAgICAgIG1pblNpemUgICAgICA6IDAsXG4gICAgICAgICAgbWF4U2l6ZSAgICAgIDogd2luZG93LmlubmVySGVpZ2h0LFxuICAgICAgICAgIHVuaXQgICAgICAgICA6IFwicHhcIixcbiAgICAgICAgICBkaXJlY3Rpb24gICAgOiBcInRiXCIsXG4gICAgICAgICAgb25CZWZvcmVPcGVuIDogKCkgPT4ge30sXG4gICAgICAgICAgb25BZnRlck9wZW4gIDogKCkgPT4ge30sXG4gICAgICAgICAgb25CZWZvcmVDbG9zZTogKCkgPT4ge30sXG4gICAgICAgICAgb25BZnRlckNsb3NlIDogKCkgPT4ge30sXG4gICAgIH1cbn1cblxuY29uc3QgdG9TaWduID0ge1xuICAgICBsciA6IDEsXG4gICAgIHJsIDogLTEsXG4gICAgIHRiIDogLTEsXG4gICAgIGJ0IDogMSxcbn1cbmNvbnN0IHRvUHJvcGVydHkgOiBSZWNvcmQgPERpcmVjdGlvbiwgc3RyaW5nPiA9IHtcbiAgICAgbHIgOiBcIndpZHRoXCIsXG4gICAgIHJsIDogXCJ3aWR0aFwiLFxuICAgICB0YiA6IFwiaGVpZ2h0XCIsXG4gICAgIGJ0IDogXCJoZWlnaHRcIixcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGV4cGFuZGFibGUgKCBlbGVtZW50OiBKU1guRWxlbWVudCwgb3B0aW9uczogRXhwZW5kYWJsZU9wdGlvbnMgPSB7fSApXG57XG4gICAgIGNvbnN0IGNvbmZpZyA9IGRlZmF1bHRDb25maWcgKClcblxuICAgICB2YXIgaXNfb3BlbiAgICA6IGJvb2xlYW5cbiAgICAgdmFyIGlzX3ZlcnRpY2FsOiBib29sZWFuXG4gICAgIHZhciBzaWduICAgICAgIDogbnVtYmVyXG4gICAgIHZhciB1bml0ICAgICAgIDogRXhwZW5kYWJsZUNvbmZpZyBbXCJ1bml0XCJdXG4gICAgIHZhciBjYiAgICAgICAgIDogKCkgPT4gdm9pZFxuICAgICB2YXIgbWluU2l6ZSAgICA6IG51bWJlclxuICAgICB2YXIgbWF4U2l6ZSAgICA6IG51bWJlclxuICAgICB2YXIgc3RhcnRfc2l6ZSAgPSAwXG4gICAgIHZhciBvcGVuX3NpemUgICA9IDEwMFxuXG4gICAgIGNvbnN0IGRyYWdnYWJsZSA9IFVpLmRyYWdnYWJsZSAoe1xuICAgICAgICAgIGhhbmRsZXMgICAgICAgOiBbXSxcbiAgICAgICAgICBvblN0YXJ0RHJhZyAgIDogb25TdGFydERyYWcsXG4gICAgICAgICAgb25TdG9wRHJhZyAgICA6IG9uU3RvcERyYWcsXG4gICAgICAgICAgb25FbmRBbmltYXRpb246IG9uRW5kQW5pbWF0aW9uLFxuICAgICB9KVxuXG4gICAgIHVwZGF0ZUNvbmZpZyAoIG9wdGlvbnMgKVxuXG4gICAgIGZ1bmN0aW9uIHVwZGF0ZUNvbmZpZyAoIG9wdGlvbnMgPSB7fSBhcyBFeHBlbmRhYmxlT3B0aW9ucyApXG4gICAgIHtcbiAgICAgICAgICBpZiAoIG9wdGlvbnMucHJvcGVydHkgPT0gdW5kZWZpbmVkICYmIG9wdGlvbnMuZGlyZWN0aW9uICE9IHVuZGVmaW5lZCApXG4gICAgICAgICAgICAgICBvcHRpb25zLnByb3BlcnR5ID0gdG9Qcm9wZXJ0eSBbb3B0aW9ucy5kaXJlY3Rpb25dXG5cbiAgICAgICAgICBPYmplY3QuYXNzaWduICggY29uZmlnLCBvcHRpb25zIClcblxuICAgICAgICAgIGlzX29wZW4gICAgID0gY29uZmlnLm9wZW5cbiAgICAgICAgICBzaWduICAgICAgICA9IHRvU2lnbiBbY29uZmlnLmRpcmVjdGlvbl1cbiAgICAgICAgICB1bml0ICAgICAgICA9IGNvbmZpZy51bml0XG4gICAgICAgICAgaXNfdmVydGljYWwgPSBjb25maWcuZGlyZWN0aW9uID09IFwiYnRcIiB8fCBjb25maWcuZGlyZWN0aW9uID09IFwidGJcIiA/IHRydWUgOiBmYWxzZVxuICAgICAgICAgIG1pblNpemUgPSBjb25maWcubWluU2l6ZVxuICAgICAgICAgIG1heFNpemUgPSBjb25maWcubWF4U2l6ZVxuXG4gICAgICAgICAgZWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlICggaXNfdmVydGljYWwgPyBcImhvcml6b250YWxcIiA6IFwidmVydGljYWxcIiApXG4gICAgICAgICAgZWxlbWVudC5jbGFzc0xpc3QuYWRkICAgICggaXNfdmVydGljYWwgPyBcInZlcnRpY2FsXCIgOiBcImhvcml6b250YWxcIiApXG5cbiAgICAgICAgICBkcmFnZ2FibGUudXBkYXRlQ29uZmlnICh7XG4gICAgICAgICAgICAgICBoYW5kbGVzOiBjb25maWcuaGFuZGxlcyxcbiAgICAgICAgICAgICAgIG9uRHJhZyA6IGlzX3ZlcnRpY2FsID8gb25EcmFnVmVydGljYWw6IG9uRHJhZ0hvcml6b250YWwsXG4gICAgICAgICAgfSlcbiAgICAgfVxuICAgICBmdW5jdGlvbiBzaXplICgpXG4gICAgIHtcbiAgICAgICAgICByZXR1cm4gaXNfb3BlbiA/IGNzc0ludCAoIGVsZW1lbnQsIGNvbmZpZy5wcm9wZXJ0eSApIDogMFxuICAgICB9XG4gICAgIGZ1bmN0aW9uIHRvZ2dsZSAoKVxuICAgICB7XG4gICAgICAgICAgaWYgKCBpc19vcGVuIClcbiAgICAgICAgICAgICAgIGNsb3NlICgpXG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgb3BlbiAoKVxuICAgICB9XG4gICAgIGZ1bmN0aW9uIG9wZW4gKClcbiAgICAge1xuICAgICAgICAgIGNvbmZpZy5vbkJlZm9yZU9wZW4gKClcblxuICAgICAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LmFkZCAoIFwiYW5pbWF0ZVwiIClcbiAgICAgICAgICBlbGVtZW50LmNsYXNzTGlzdC5yZXBsYWNlICggXCJjbG9zZVwiLCBcIm9wZW5cIiApXG5cbiAgICAgICAgICBpZiAoIGNiIClcbiAgICAgICAgICAgICAgIG9uVHJhbnNpdGlvbkVuZCAoKVxuXG4gICAgICAgICAgY2IgPSBjb25maWcub25BZnRlck9wZW5cbiAgICAgICAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIgKCBcInRyYW5zaXRpb25lbmRcIiwgKCkgPT4gb25UcmFuc2l0aW9uRW5kIClcblxuICAgICAgICAgIGVsZW1lbnQuc3R5bGUgWyBjb25maWcucHJvcGVydHkgXSA9IG9wZW5fc2l6ZSArIHVuaXRcblxuICAgICAgICAgIGlzX29wZW4gPSB0cnVlXG4gICAgIH1cbiAgICAgZnVuY3Rpb24gY2xvc2UgKClcbiAgICAge1xuICAgICAgICAgIGNvbmZpZy5vbkJlZm9yZUNsb3NlICgpXG5cbiAgICAgICAgICBvcGVuX3NpemUgPSBzaXplICgpXG5cbiAgICAgICAgICBlbGVtZW50LmNsYXNzTGlzdC5hZGQgKCBcImFuaW1hdGVcIiApXG4gICAgICAgICAgZWxlbWVudC5jbGFzc0xpc3QucmVwbGFjZSAoIFwib3BlblwiLCBcImNsb3NlXCIgKVxuXG4gICAgICAgICAgaWYgKCBjYiApXG4gICAgICAgICAgICAgICBvblRyYW5zaXRpb25FbmQgKClcblxuICAgICAgICAgIGNiID0gY29uZmlnLm9uQWZ0ZXJDbG9zZVxuICAgICAgICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lciAoIFwidHJhbnNpdGlvbmVuZFwiLCBvblRyYW5zaXRpb25FbmQgKVxuXG4gICAgICAgICAgZWxlbWVudC5zdHlsZSBbIGNvbmZpZy5wcm9wZXJ0eSBdID0gXCIwXCIgKyB1bml0XG5cbiAgICAgICAgICBpc19vcGVuID0gZmFsc2VcbiAgICAgfVxuXG4gICAgIHJldHVybiB7XG4gICAgICAgICAgdXBkYXRlQ29uZmlnLFxuICAgICAgICAgIG9wZW4sXG4gICAgICAgICAgY2xvc2UsXG4gICAgICAgICAgdG9nZ2xlLFxuICAgICAgICAgIGlzT3BlbiAgICAgOiAoKSA9PiBpc19vcGVuLFxuICAgICAgICAgIGlzQ2xvc2UgICAgOiAoKSA9PiAhIGlzX29wZW4sXG4gICAgICAgICAgaXNWZXJ0aWNhbCA6ICgpID0+IGlzX3ZlcnRpY2FsLFxuICAgICAgICAgIGlzQWN0aXZlICAgOiAoKSA9PiBkcmFnZ2FibGUuaXNBY3RpdmUgKCksXG4gICAgICAgICAgYWN0aXZhdGUgICA6ICgpID0+IGRyYWdnYWJsZS5hY3RpdmF0ZSAoKSxcbiAgICAgICAgICBkZXNhY3RpdmF0ZTogKCkgPT4gZHJhZ2dhYmxlLmRlc2FjdGl2YXRlICgpLFxuICAgICB9XG5cbiAgICAgZnVuY3Rpb24gb25UcmFuc2l0aW9uRW5kICgpXG4gICAgIHtcbiAgICAgICAgICBpZiAoIGNiIClcbiAgICAgICAgICAgICAgIGNiICgpXG4gICAgICAgICAgZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyICggXCJ0cmFuc2l0aW9uZW5kXCIsICgpID0+IG9uVHJhbnNpdGlvbkVuZCApXG4gICAgICAgICAgY2IgPSBudWxsXG4gICAgIH1cblxuICAgICBmdW5jdGlvbiBvblN0YXJ0RHJhZyAoKVxuICAgICB7XG4gICAgICAgICAgc3RhcnRfc2l6ZSA9IHNpemUgKClcbiAgICAgICAgICBlbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUgKCBcImFuaW1hdGVcIiApXG4gICAgIH1cbiAgICAgZnVuY3Rpb24gb25EcmFnVmVydGljYWwgKCBldmVudDogVWkuRHJhZ0V2ZW50IClcbiAgICAge1xuICAgICAgICAgIGNvbnNvbGUubG9nICggbWluU2l6ZSwgZXZlbnQueSwgbWF4U2l6ZSApXG4gICAgICAgICAgY29uc29sZS5sb2cgKCBjbGFtcCAoIHN0YXJ0X3NpemUgKyBzaWduICogZXZlbnQueSApICsgdW5pdCApXG4gICAgICAgICAgZWxlbWVudC5zdHlsZSBbIGNvbmZpZy5wcm9wZXJ0eSBdID0gY2xhbXAgKCBzdGFydF9zaXplICsgc2lnbiAqIGV2ZW50LnkgKSArIHVuaXRcbiAgICAgfVxuICAgICBmdW5jdGlvbiBvbkRyYWdIb3Jpem9udGFsICggZXZlbnQ6IFVpLkRyYWdFdmVudCApXG4gICAgIHtcbiAgICAgICAgICBlbGVtZW50LnN0eWxlIFsgY29uZmlnLnByb3BlcnR5IF0gPSBjbGFtcCAoIHN0YXJ0X3NpemUgKyBzaWduICogZXZlbnQueCApICsgdW5pdFxuICAgICB9XG4gICAgIGZ1bmN0aW9uIG9uU3RvcERyYWcgKCBldmVudDogVWkuRHJhZ0V2ZW50IClcbiAgICAge1xuICAgICAgICAgIHZhciBpc19tb3ZlZCA9IGlzX3ZlcnRpY2FsID8gc2lnbiAqIGV2ZW50LnkgPiBjb25maWcubmVhclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogc2lnbiAqIGV2ZW50LnggPiBjb25maWcubmVhclxuXG4gICAgICAgICAgaWYgKCAoaXNfbW92ZWQgPT0gZmFsc2UpICYmIGV2ZW50LmRlbGF5IDw9IGNvbmZpZy5kZWxheSApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgdG9nZ2xlICgpXG4gICAgICAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjb25zdCB0YXJnZXRfc2l6ZSA9IGNsYW1wIChcbiAgICAgICAgICAgICAgIGlzX3ZlcnRpY2FsID8gc3RhcnRfc2l6ZSArIHNpZ24gKiBldmVudC50YXJnZXRZXG4gICAgICAgICAgICAgICAgICAgICAgICAgICA6IHN0YXJ0X3NpemUgKyBzaWduICogZXZlbnQudGFyZ2V0WFxuICAgICAgICAgIClcblxuICAgICAgICAgIGlmICggdGFyZ2V0X3NpemUgPD0gY29uZmlnLm5lYXIgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNsb3NlICgpXG4gICAgICAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gdHJ1ZVxuXG4gICAgIH1cbiAgICAgZnVuY3Rpb24gb25FbmRBbmltYXRpb24gKClcbiAgICAge1xuICAgICAgICAgIG9wZW5fc2l6ZSA9IGNzc0ludCAoIGVsZW1lbnQsIGNvbmZpZy5wcm9wZXJ0eSApXG4gICAgICAgICAgb3BlbiAoKVxuICAgICB9XG5cbiAgICAgZnVuY3Rpb24gY2xhbXAgKCB2OiBudW1iZXIgKVxuICAgICB7XG4gICAgICAgICAgaWYgKCB2IDwgbWluU2l6ZSApXG4gICAgICAgICAgICAgICByZXR1cm4gbWluU2l6ZVxuXG4gICAgICAgICAgaWYgKCB2ID4gbWF4U2l6ZSApXG4gICAgICAgICAgICAgICByZXR1cm4gbWF4U2l6ZVxuXG4gICAgICAgICAgcmV0dXJuIHZcbiAgICAgfVxufVxuIiwiXG5pbXBvcnQgeyBDc3MgfSBmcm9tIFwiLi4vLi4vTGliL2luZGV4LmpzXCJcbmltcG9ydCB7IGNzc0Zsb2F0IH0gZnJvbSBcIi4vZG9tLmpzXCJcbmltcG9ydCAqIGFzIFVpIGZyb20gXCIuL2RyYWdnYWJsZS5qc1wiXG5pbXBvcnQgeyB4bm9kZSB9IGZyb20gXCIuL3hub2RlLmpzXCJcblxudHlwZSBEaXJlY3Rpb24gICA9IFwibHJcIiB8IFwicmxcIiB8IFwiYnRcIiB8IFwidGJcIlxudHlwZSBPcmllbnRhdGlvbiA9IFwidmVydGljYWxcIiB8IFwiaG9yaXpvbnRhbFwiXG50eXBlIFVuaXRzICAgICAgID0gXCJweFwiIHwgXCIlXCJcbnR5cGUgU3dpcGVhYmxlUHJvcGVydHkgPSBcInRvcFwiIHwgXCJsZWZ0XCIgfCBcImJvdHRvbVwiIHwgXCJyaWdodFwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgfCBcInhcIiB8IFwieVwiXG5cbnR5cGUgU3dpcGVhYmxlT3B0aW9ucyA9IFBhcnRpYWwgPFN3aXBlYWJsZUNvbmZpZz5cblxudHlwZSBTd2lwZWFibGVDb25maWcgPSB7XG4gICAgIGhhbmRsZXMgICA6IEpTWC5FbGVtZW50IFtdXG4gICAgIGRpcmVjdGlvbiA6IERpcmVjdGlvbixcbiAgICAgcG9ycGVydHk/IDogU3dpcGVhYmxlUHJvcGVydHlcbiAgICAgbWluVmFsdWUgIDogbnVtYmVyLFxuICAgICBtYXhWYWx1ZSAgOiBudW1iZXIsXG4gICAgIHVuaXRzICAgICA6IFVuaXRzLFxuICAgICBtb3VzZVdoZWVsOiBib29sZWFuXG59XG5cbmV4cG9ydCB0eXBlIFN3aXBlYWJsZUVsZW1lbnQgPSBSZXR1cm5UeXBlIDx0eXBlb2Ygc3dpcGVhYmxlPlxuXG5mdW5jdGlvbiBkZWZhdWx0Q29uZmlnICgpOiBTd2lwZWFibGVDb25maWdcbntcbiAgICAgcmV0dXJuIHtcbiAgICAgICAgICBoYW5kbGVzICAgOiBbXSxcbiAgICAgICAgICBkaXJlY3Rpb24gOiBcImxyXCIsXG4gICAgICAgICAgcG9ycGVydHkgIDogXCJsZWZ0XCIsXG4gICAgICAgICAgbWluVmFsdWUgIDogLTEwMCxcbiAgICAgICAgICBtYXhWYWx1ZSAgOiAwLFxuICAgICAgICAgIHVuaXRzICAgICA6IFwiJVwiLFxuICAgICAgICAgIG1vdXNlV2hlZWw6IHRydWUsXG4gICAgIH1cbn1cblxudmFyIHN0YXJ0X3Bvc2l0aW9uID0gMFxudmFyIGlzX3ZlcnRpY2FsICAgID0gZmFsc2VcbnZhciBwcm9wIDogU3dpcGVhYmxlUHJvcGVydHlcblxuZXhwb3J0IGZ1bmN0aW9uIHN3aXBlYWJsZSAoIGVsZW1lbnQ6IEpTWC5FbGVtZW50LCBvcHRpb25zOiBTd2lwZWFibGVPcHRpb25zIClcbntcbiAgICAgY29uc3QgY29uZmlnID0gZGVmYXVsdENvbmZpZyAoKVxuXG4gICAgIGNvbnN0IGRyYWdnYWJsZSA9IFVpLmRyYWdnYWJsZSAoe1xuICAgICAgICAgIGhhbmRsZXM6IFtdLFxuICAgICAgICAgIG9uU3RhcnREcmFnLFxuICAgICAgICAgIG9uU3RvcERyYWcsXG4gICAgIH0pXG5cbiAgICAgZWxlbWVudC5jbGFzc0xpc3QuYWRkICggXCJzd2lwZWFibGVcIiApXG5cbiAgICAgdXBkYXRlQ29uZmlnICggb3B0aW9ucyApXG5cbiAgICAgZnVuY3Rpb24gdXBkYXRlQ29uZmlnICggb3B0aW9uczogU3dpcGVhYmxlT3B0aW9ucyApXG4gICAgIHtcbiAgICAgICAgICBPYmplY3QuYXNzaWduICggY29uZmlnLCBvcHRpb25zIClcblxuICAgICAgICAgIGlzX3ZlcnRpY2FsID0gY29uZmlnLmRpcmVjdGlvbiA9PSBcImJ0XCIgfHwgY29uZmlnLmRpcmVjdGlvbiA9PSBcInRiXCJcblxuICAgICAgICAgIGlmICggb3B0aW9ucy5wb3JwZXJ0eSA9PSB1bmRlZmluZWQgKVxuICAgICAgICAgICAgICAgY29uZmlnLnBvcnBlcnR5ID0gaXNfdmVydGljYWwgPyBcInRvcFwiIDogXCJsZWZ0XCJcblxuICAgICAgICAgIC8vIHN3aXRjaCAoIGNvbmZpZy5wb3JwZXJ0eSApXG4gICAgICAgICAgLy8ge1xuICAgICAgICAgIC8vIGNhc2UgXCJ0b3BcIjogY2FzZSBcImJvdHRvbVwiOiBjYXNlIFwieVwiOiBpc192ZXJ0aWNhbCA9IHRydWUgIDsgYnJlYWtcbiAgICAgICAgICAvLyBjYXNlIFwibGVmdFwiOiBjYXNlIFwicmlnaHRcIjogY2FzZSBcInhcIjogaXNfdmVydGljYWwgPSBmYWxzZSA7IGJyZWFrXG4gICAgICAgICAgLy8gZGVmYXVsdDogZGVidWdnZXIgOyByZXR1cm5cbiAgICAgICAgICAvLyB9XG5cbiAgICAgICAgICBkcmFnZ2FibGUudXBkYXRlQ29uZmlnICh7XG4gICAgICAgICAgICAgICBoYW5kbGVzOiBjb25maWcuaGFuZGxlcyxcbiAgICAgICAgICAgICAgIG9uRHJhZzogaXNfdmVydGljYWwgPyBvbkRyYWdWZXJ0aWNhbCA6IG9uRHJhZ0hvcml6b250YWxcbiAgICAgICAgICB9KVxuXG4gICAgICAgICAgcHJvcCA9IGNvbmZpZy5wb3JwZXJ0eVxuXG4gICAgICAgICAgaWYgKCBkcmFnZ2FibGUuaXNBY3RpdmUgKCkgKVxuICAgICAgICAgICAgICAgYWN0aXZlRXZlbnRzICgpXG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgZGVzYWN0aXZlRXZlbnRzICgpXG4gICAgIH1cblxuICAgICBmdW5jdGlvbiBwb3NpdGlvbiAoKVxuICAgICB7XG4gICAgICAgICAgcmV0dXJuIGNzc0Zsb2F0ICggZWxlbWVudCwgcHJvcCApXG4gICAgIH1cblxuICAgICBmdW5jdGlvbiBhY3RpdmF0ZSAoKVxuICAgICB7XG4gICAgICAgICAgZHJhZ2dhYmxlLmFjdGl2YXRlICgpXG4gICAgICAgICAgYWN0aXZlRXZlbnRzICgpXG4gICAgIH1cbiAgICAgZnVuY3Rpb24gZGVzYWN0aXZhdGUgKClcbiAgICAge1xuICAgICAgICAgIGRyYWdnYWJsZS5kZXNhY3RpdmF0ZSAoKVxuICAgICAgICAgIGRlc2FjdGl2ZUV2ZW50cyAoKVxuICAgICB9XG5cbiAgICAgZnVuY3Rpb24gc3dpcGUgKCBvZmZzZXQ6IHN0cmluZyApOiB2b2lkXG4gICAgIGZ1bmN0aW9uIHN3aXBlICggb2Zmc2V0OiBudW1iZXIsIHVuaXRzOiBVbml0cyApOiB2b2lkXG4gICAgIGZ1bmN0aW9uIHN3aXBlICggb2Zmc2V0OiBzdHJpbmd8bnVtYmVyLCB1PzogVW5pdHMgKVxuICAgICB7XG4gICAgICAgICAgaWYgKCB0eXBlb2Ygb2Zmc2V0ID09IFwic3RyaW5nXCIgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHUgPSBDc3MuZ2V0VW5pdCAoIG9mZnNldCApIGFzIFVuaXRzXG4gICAgICAgICAgICAgICBvZmZzZXQgPSBwYXJzZUZsb2F0ICggb2Zmc2V0IClcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoICEgW1wicHhcIiwgXCIlXCJdLmluY2x1ZGVzICggdSApIClcbiAgICAgICAgICAgICAgIHUgPSBcInB4XCJcblxuICAgICAgICAgIGlmICggdSAhPSBjb25maWcudW5pdHMgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGlmICggKHUgPSBjb25maWcudW5pdHMpID09IFwiJVwiIClcbiAgICAgICAgICAgICAgICAgICAgb2Zmc2V0ID0gdG9QZXJjZW50cyAoIG9mZnNldCApXG4gICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIG9mZnNldCA9IHRvUGl4ZWxzICggb2Zmc2V0IClcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBlbGVtZW50LnN0eWxlIFtwcm9wXSA9IGNsYW1wICggb2Zmc2V0ICkgKyB1XG4gICAgIH1cblxuICAgICByZXR1cm4ge1xuICAgICAgICAgIHVwZGF0ZUNvbmZpZyxcbiAgICAgICAgICBhY3RpdmF0ZSxcbiAgICAgICAgICBkZXNhY3RpdmF0ZSxcbiAgICAgICAgICBwb3NpdGlvbixcbiAgICAgICAgICBzd2lwZSxcbiAgICAgfVxuXG4gICAgIGZ1bmN0aW9uIGFjdGl2ZUV2ZW50cyAoKVxuICAgICB7XG4gICAgICAgICAgaWYgKCBjb25maWcubW91c2VXaGVlbCApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgZm9yICggY29uc3QgaCBvZiBjb25maWcuaGFuZGxlcyApXG4gICAgICAgICAgICAgICAgICAgIGguYWRkRXZlbnRMaXN0ZW5lciAoIFwid2hlZWxcIiwgb25XaGVlbCwgeyBwYXNzaXZlOiB0cnVlIH0gKVxuICAgICAgICAgIH1cbiAgICAgfVxuICAgICBmdW5jdGlvbiBkZXNhY3RpdmVFdmVudHMgKClcbiAgICAge1xuICAgICAgICAgIGZvciAoIGNvbnN0IGggb2YgY29uZmlnLmhhbmRsZXMgKVxuICAgICAgICAgICAgICAgaC5yZW1vdmVFdmVudExpc3RlbmVyICggXCJ3aGVlbFwiLCBvbldoZWVsIClcbiAgICAgfVxuXG4gICAgIGZ1bmN0aW9uIHRvUGl4ZWxzICggcGVyY2VudGFnZTogbnVtYmVyIClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHsgbWluVmFsdWU6IG1pbiwgbWF4VmFsdWU6IG1heCB9ID0gY29uZmlnXG5cbiAgICAgICAgICBpZiAoIHBlcmNlbnRhZ2UgPCAxMDAgKVxuICAgICAgICAgICAgICAgcGVyY2VudGFnZSA9IDEwMCArIHBlcmNlbnRhZ2VcblxuICAgICAgICAgIHJldHVybiBtaW4gKyAobWF4IC0gbWluKSAqIHBlcmNlbnRhZ2UgLyAxMDBcbiAgICAgfVxuICAgICBmdW5jdGlvbiB0b1BlcmNlbnRzICggcGl4ZWxzOiBudW1iZXIgKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgeyBtaW5WYWx1ZTogbWluLCBtYXhWYWx1ZTogbWF4IH0gPSBjb25maWdcbiAgICAgICAgICByZXR1cm4gTWF0aC5hYnMgKCAocGl4ZWxzIC0gbWluKSAvIChtYXggLSBtaW4pICogMTAwIClcbiAgICAgfVxuXG4gICAgIGZ1bmN0aW9uIG9uU3RhcnREcmFnICgpXG4gICAgIHtcbiAgICAgICAgICBlbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUgKCBcImFuaW1hdGVcIiApXG4gICAgICAgICAgc3RhcnRfcG9zaXRpb24gPSBwb3NpdGlvbiAoKVxuICAgICB9XG4gICAgIGZ1bmN0aW9uIG9uRHJhZ1ZlcnRpY2FsICggZXZlbnQ6IFVpLkRyYWdFdmVudCApXG4gICAgIHtcbiAgICAgICAgICBlbGVtZW50LnN0eWxlIFtwcm9wXSA9IGNsYW1wICggc3RhcnRfcG9zaXRpb24gKyBldmVudC55ICkgKyBjb25maWcudW5pdHNcbiAgICAgfVxuICAgICBmdW5jdGlvbiBvbkRyYWdIb3Jpem9udGFsICggZXZlbnQ6IFVpLkRyYWdFdmVudCApXG4gICAgIHtcbiAgICAgICAgICBlbGVtZW50LnN0eWxlIFtwcm9wXSA9IGNsYW1wICggc3RhcnRfcG9zaXRpb24gKyBldmVudC54ICkgKyBjb25maWcudW5pdHNcbiAgICAgfVxuICAgICBmdW5jdGlvbiBvblN0b3BEcmFnICggZXZlbnQ6IFVpLkRyYWdFdmVudCApXG4gICAgIHtcbiAgICAgICAgICBlbGVtZW50LmNsYXNzTGlzdC5hZGQgKCBcImFuaW1hdGVcIiApXG5cbiAgICAgICAgICBjb25zdCBvZmZzZXQgPSBpc192ZXJ0aWNhbFxuICAgICAgICAgICAgICAgICAgICAgICAgID8gZXZlbnQueSAvLysgZXZlbnQudmVsb2NpdHlZXG4gICAgICAgICAgICAgICAgICAgICAgICAgOiBldmVudC54IC8vKyBldmVudC52ZWxvY2l0eVhcblxuICAgICAgICAgIGVsZW1lbnQuc3R5bGUgW3Byb3BdID0gY2xhbXAgKCBzdGFydF9wb3NpdGlvbiArIG9mZnNldCApICsgY29uZmlnLnVuaXRzXG4gICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgfVxuICAgICBmdW5jdGlvbiBvbldoZWVsICggZXZlbnQ6IFdoZWVsRXZlbnQgKVxuICAgICB7XG4gICAgICAgICAgaWYgKCBldmVudC5kZWx0YU1vZGUgIT0gV2hlZWxFdmVudC5ET01fREVMVEFfUElYRUwgKVxuICAgICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgICBpZiAoIGlzX3ZlcnRpY2FsIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICB2YXIgZGVsdGEgPSBldmVudC5kZWx0YVlcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHZhciBkZWx0YSA9IGV2ZW50LmRlbHRhWFxuXG4gICAgICAgICAgICAgICBpZiAoIGRlbHRhID09IDAgKVxuICAgICAgICAgICAgICAgICAgICBkZWx0YSA9IGV2ZW50LmRlbHRhWVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGVsZW1lbnQuc3R5bGUgW3Byb3BdID0gY2xhbXAgKCBwb3NpdGlvbiAoKSArIGRlbHRhICkgKyBjb25maWcudW5pdHNcbiAgICAgfVxuICAgICBmdW5jdGlvbiBjbGFtcCAoIHZhbHVlOiBudW1iZXIgKVxuICAgICB7XG4gICAgICAgICAgcmV0dXJuIHZhbHVlIDwgY29uZmlnLm1pblZhbHVlID8gY29uZmlnLm1pblZhbHVlXG4gICAgICAgICAgICAgICA6IHZhbHVlID4gY29uZmlnLm1heFZhbHVlID8gY29uZmlnLm1heFZhbHVlXG4gICAgICAgICAgICAgICA6IHZhbHVlXG4gICAgIH1cbn1cbiIsIlxuLypcbmV4YW1wbGU6XG5odHRwczovL3ByZXppLmNvbS9wLzlqcWUyd2tmaGhreS9sYS1idWxsb3RlcmllLXRwY21uL1xuaHR0cHM6Ly9tb3ZpbGFiLm9yZy9pbmRleC5waHA/dGl0bGU9VXRpbGlzYXRldXI6QXVyJUMzJUE5bGllbk1hcnR5XG4qL1xuXG5cbmltcG9ydCB7IEdlb21ldHJ5IH0gZnJvbSBcIi4uLy4uLy4uL0xpYi9pbmRleC5qc1wiXG5cbmltcG9ydCB7IFNoYXBlIH0gZnJvbSBcIi4uLy4uLy4uL0FwcGxpY2F0aW9uL0FzcGVjdC9FbGVtZW50L3NoYXBlLmpzXCJcbmltcG9ydCAqIGFzIGFzcGVjdCBmcm9tIFwiLi4vLi4vLi4vQXBwbGljYXRpb24vQXNwZWN0L2RiLmpzXCJcbmltcG9ydCAqIGFzIGRiIGZyb20gXCIuLi8uLi8uLi9BcHBsaWNhdGlvbi9kYXRhLmpzXCJcblxuaW1wb3J0IFwiZmFicmljXCJcblxuZmFicmljLk9iamVjdC5wcm90b3R5cGUucGFkZGluZyAgICAgICAgICAgID0gMFxuZmFicmljLk9iamVjdC5wcm90b3R5cGUub2JqZWN0Q2FjaGluZyAgICAgID0gZmFsc2VcbmZhYnJpYy5PYmplY3QucHJvdG90eXBlLmhhc0NvbnRyb2xzICAgICAgICA9IHRydWVcbmZhYnJpYy5PYmplY3QucHJvdG90eXBlLmhhc0JvcmRlcnMgICAgICAgICA9IHRydWVcbmZhYnJpYy5PYmplY3QucHJvdG90eXBlLmhhc1JvdGF0aW5nUG9pbnQgICA9IGZhbHNlXG5mYWJyaWMuT2JqZWN0LnByb3RvdHlwZS50cmFuc3BhcmVudENvcm5lcnMgPSBmYWxzZVxuZmFicmljLk9iamVjdC5wcm90b3R5cGUuY2VudGVyZWRTY2FsaW5nICAgID0gdHJ1ZVxuZmFicmljLk9iamVjdC5wcm90b3R5cGUuY29ybmVyU3R5bGUgICAgICAgID0gXCJjaXJjbGVcIlxuZmFicmljLk9iamVjdC5wcm90b3R5cGUuc2V0Q29udHJvbFZpc2libGUgKCBcIm1sXCIsIGZhbHNlIClcbmZhYnJpYy5PYmplY3QucHJvdG90eXBlLnNldENvbnRyb2xWaXNpYmxlICggXCJtdFwiLCBmYWxzZSApXG5mYWJyaWMuT2JqZWN0LnByb3RvdHlwZS5zZXRDb250cm9sVmlzaWJsZSAoIFwibXJcIiwgZmFsc2UgKVxuZmFicmljLk9iamVjdC5wcm90b3R5cGUuc2V0Q29udHJvbFZpc2libGUgKCBcIm1iXCIsIGZhbHNlIClcbmZhYnJpYy5PYmplY3QucHJvdG90eXBlLnNldENvbnRyb2xWaXNpYmxlICggXCJ0bFwiLCBmYWxzZSApXG5mYWJyaWMuT2JqZWN0LnByb3RvdHlwZS5zZXRDb250cm9sVmlzaWJsZSAoIFwiYmxcIiwgZmFsc2UgKVxuZmFicmljLk9iamVjdC5wcm90b3R5cGUuc2V0Q29udHJvbFZpc2libGUgKCBcImJyXCIsIGZhbHNlIClcblxuZXhwb3J0IGludGVyZmFjZSBWaWV3XG57XG4gICAgIG5hbWU6IHN0cmluZ1xuICAgICBhY3RpdmU6IGJvb2xlYW5cbiAgICAgY2hpbGRyZW4gOiBTaGFwZSBbXVxuICAgICB0aHVtYm5haWw6IHN0cmluZ1xuICAgICBwYWNraW5nICA6IFwiZW5jbG9zZVwiXG59XG5cbmV4cG9ydCBjbGFzcyBBcmVhXG57XG4gICAgIHJlYWRvbmx5IGZjYW52YXM6IGZhYnJpYy5DYW52YXNcbiAgICAgcHJpdmF0ZSBhY3RpdmU6IFZpZXdcbiAgICAgcHJpdmF0ZSB2aWV3cyA9IHt9IGFzIFJlY29yZCA8c3RyaW5nLCBWaWV3PlxuXG4gICAgIGNvbnN0cnVjdG9yICggY2FudmFzOiBIVE1MQ2FudmFzRWxlbWVudCApXG4gICAgIHtcbiAgICAgICAgICB0aGlzLmZjYW52YXMgPSBuZXcgZmFicmljLkNhbnZhcyAoIGNhbnZhcyApXG4gICAgICAgICAgdGhpcy5lbmFibGVFdmVudHMgKClcbiAgICAgfVxuXG4gICAgIGdldCB2aWV3ICgpXG4gICAgIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5hY3RpdmVcbiAgICAgfVxuXG4gICAgIG92ZXJGT2JqZWN0OiBmYWJyaWMuT2JqZWN0ID0gdW5kZWZpbmVkXG5cbiAgICAgc3RhdGljIGN1cnJlbnRFdmVudDogZmFicmljLklFdmVudFxuICAgICBvbk92ZXJPYmplY3QgID0gbnVsbCBhcyAoIG9iajogU2hhcGUgKSA9PiB2b2lkXG4gICAgIG9uT3V0T2JqZWN0ICAgPSBudWxsIGFzICggb2JqOiBTaGFwZSApID0+IHZvaWRcbiAgICAgb25Ub3VjaE9iamVjdCA9IG51bGwgYXMgKCBvYmo6IFNoYXBlICkgPT4gdm9pZFxuICAgICBvbkRvdWJsZVRvdWNoT2JqZWN0ID0gbnVsbCBhcyAoIG9iajogU2hhcGUgKSA9PiB2b2lkXG4gICAgIG9uVG91Y2hBcmVhICAgPSBudWxsIGFzICggeDogbnVtYmVyLCB5OiBudW1iZXIgKSA9PiB2b2lkXG5cbiAgICAgY3JlYXRlVmlldyAoIG5hbWU6IHN0cmluZyApXG4gICAgIHtcbiAgICAgICAgICBjb25zdCB7IHZpZXdzIH0gPSB0aGlzXG5cbiAgICAgICAgICBpZiAoIG5hbWUgaW4gdmlld3MgKVxuICAgICAgICAgICAgICAgdGhyb3cgXCJUaGUgdmlldyBhbHJlYWR5IGV4aXN0c1wiXG5cbiAgICAgICAgICByZXR1cm4gdmlld3MgW25hbWVdID0ge1xuICAgICAgICAgICAgICAgbmFtZSxcbiAgICAgICAgICAgICAgIGFjdGl2ZSAgIDogZmFsc2UsXG4gICAgICAgICAgICAgICBjaGlsZHJlbiA6IFtdLFxuICAgICAgICAgICAgICAgcGFja2luZyAgOiBcImVuY2xvc2VcIixcbiAgICAgICAgICAgICAgIHRodW1ibmFpbDogbnVsbCxcbiAgICAgICAgICB9XG4gICAgIH1cblxuICAgICB1c2UgKCBuYW1lOiBzdHJpbmcgKTogVmlld1xuICAgICB1c2UgKCB2aWV3OiBWaWV3ICkgIDogVmlld1xuICAgICB1c2UgKCBuYW1lOiBzdHJpbmcgfCBWaWV3ICk6IFZpZXdcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHsgZmNhbnZhcywgdmlld3MgfSA9IHRoaXNcblxuICAgICAgICAgIGlmICggdHlwZW9mIG5hbWUgIT0gXCJzdHJpbmdcIiApXG4gICAgICAgICAgICAgICBuYW1lID0gbmFtZS5uYW1lXG5cbiAgICAgICAgICBpZiAoIHRoaXMuYWN0aXZlICYmIHRoaXMuYWN0aXZlLm5hbWUgPT0gbmFtZSApXG4gICAgICAgICAgICAgICByZXR1cm5cblxuICAgICAgICAgIGlmICggISAobmFtZSBpbiB2aWV3cykgKVxuICAgICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgICBjb25zdCBhY3RpdmUgPSB0aGlzLmFjdGl2ZSA9IHZpZXdzIFtuYW1lXVxuXG4gICAgICAgICAgZmNhbnZhcy5jbGVhciAoKVxuXG4gICAgICAgICAgZm9yICggY29uc3Qgc2hhcGUgb2YgYWN0aXZlLmNoaWxkcmVuIClcbiAgICAgICAgICAgICAgIGZjYW52YXMuYWRkICggc2hhcGUuZ3JvdXAgKVxuXG4gICAgICAgICAgcmV0dXJuIGFjdGl2ZVxuICAgICB9XG5cbiAgICAgYWRkICggLi4uIHNoYXBlczogKFNoYXBlIHwgJE5vZGUpIFtdICk6IHZvaWRcbiAgICAgYWRkICggLi4uIHBhdGg6IHN0cmluZyBbXSApOiB2b2lkXG4gICAgIGFkZCAoKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgeyBhY3RpdmUsIGZjYW52YXMgfSA9IHRoaXNcblxuICAgICAgICAgIGlmICggYXJndW1lbnRzLmxlbmd0aCA9PSAwIClcbiAgICAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgICAgaWYgKCB0eXBlb2YgYXJndW1lbnRzIFswXSA9PSBcInN0cmluZ1wiIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICAvL2NvbnN0IG5vZGUgPSBkYi5nZXROb2RlICggLi4uIGFyZ3VtZW50cyBhcyBhbnkgYXMgc3RyaW5nIFtdIClcbiAgICAgICAgICAgICAgIGNvbnN0IG5vZGUgPSBkYi5ub2RlICggYXJndW1lbnRzIFswXSwgYXJndW1lbnRzIFsxXSBhcyBzdHJpbmcgIClcbiAgICAgICAgICAgICAgIGNvbnN0IHNocCA9IGFzcGVjdC5nZXRBc3BlY3QgKCBub2RlIClcbiAgICAgICAgICAgICAgIGFjdGl2ZS5jaGlsZHJlbi5wdXNoICggc2hwIClcbiAgICAgICAgICAgICAgIGZjYW52YXMuYWRkICggc2hwLmdyb3VwIClcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZSBmb3IgKCBjb25zdCBzIG9mIGFyZ3VtZW50cyApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgY29uc3Qgc2hwID0gYXNwZWN0LmdldEFzcGVjdCAoIHMgYXMgJE5vZGUgfCBTaGFwZSApXG5cbiAgICAgICAgICAgICAgIC8vIHNocC5nZXRGYWJyaWNcbiAgICAgICAgICAgICAgIC8vIHNocC5nZXRIdG1sXG4gICAgICAgICAgICAgICAvLyBzaHAuZ2V0U3ZnXG5cbiAgICAgICAgICAgICAgIC8vIGZhY3RvcnlcblxuICAgICAgICAgICAgICAgYWN0aXZlLmNoaWxkcmVuLnB1c2ggKCBzaHAgKVxuICAgICAgICAgICAgICAgZmNhbnZhcy5hZGQgKCBzaHAuZ3JvdXAgKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGZjYW52YXMucmVxdWVzdFJlbmRlckFsbCAoKVxuICAgICB9XG5cbiAgICAgY2xlYXIgKClcbiAgICAge1xuICAgICAgICAgIHRoaXMuZmNhbnZhcy5jbGVhciAoKVxuICAgICB9XG5cbiAgICAgcGFjayAoKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgeyBmY2FudmFzIH0gPSB0aGlzXG5cbiAgICAgICAgICBjb25zdCBvYmplY3RzID0gZmNhbnZhcy5nZXRPYmplY3RzICgpXG4gICAgICAgICAgY29uc3QgcG9zaXRpb25zID0gW10gYXMgR2VvbWV0cnkuQ2lyY2xlIFtdXG5cbiAgICAgICAgICBmb3IgKCBjb25zdCBnIG9mIG9iamVjdHMgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNvbnN0IHIgPSAoZy53aWR0aCA+IGcuaGVpZ2h0ID8gZy53aWR0aCA6IGcuaGVpZ2h0KSAvIDJcbiAgICAgICAgICAgICAgIHBvc2l0aW9ucy5wdXNoICggeyB4OiBnLmxlZnQsIHk6IGcudG9wLCByOiByICsgMjAgfSApXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgR2VvbWV0cnkucGFja0VuY2xvc2UgKCBwb3NpdGlvbnMgKSAqIDJcblxuICAgICAgICAgIGZvciAoIHZhciBpID0gMCA7IGkgPCBvYmplY3RzLmxlbmd0aCA7IGkrKyApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgY29uc3QgZyA9IG9iamVjdHMgW2ldXG4gICAgICAgICAgICAgICBjb25zdCBwID0gcG9zaXRpb25zIFtpXVxuXG4gICAgICAgICAgICAgICBnLmxlZnQgPSBwLnhcbiAgICAgICAgICAgICAgIGcudG9wICA9IHAueVxuICAgICAgICAgICAgICAgZy5zZXRDb29yZHMgKClcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBmY2FudmFzLnJlcXVlc3RSZW5kZXJBbGwgKClcbiAgICAgfVxuXG4gICAgIHpvb20gKCBmYWN0b3I/OiBudW1iZXIgfCBTaGFwZSApXG4gICAgIHtcbiAgICAgICAgICBjb25zdCB7IGZjYW52YXMgfSA9IHRoaXNcblxuICAgICAgICAgIGlmICggdHlwZW9mIGZhY3RvciA9PSBcIm51bWJlclwiIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjb25zdCBvYmplY3RzID0gZmNhbnZhcy5nZXRPYmplY3RzICgpXG5cbiAgICAgICAgICBpZiAoIHR5cGVvZiBmYWN0b3IgPT0gXCJvYmplY3RcIiApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgY29uc3QgbyA9IGZhY3Rvci5ncm91cFxuXG4gICAgICAgICAgICAgICB2YXIgbGVmdCAgID0gby5sZWZ0IC0gby53aWR0aFxuICAgICAgICAgICAgICAgdmFyIHJpZ2h0ICA9IG8ubGVmdCArIG8ud2lkdGhcbiAgICAgICAgICAgICAgIHZhciB0b3AgICAgPSBvLnRvcCAgLSBvLmhlaWdodFxuICAgICAgICAgICAgICAgdmFyIGJvdHRvbSA9IG8udG9wICArIG8uaGVpZ2h0XG5cbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHZhciBsZWZ0ICAgPSAwXG4gICAgICAgICAgICAgICB2YXIgcmlnaHQgID0gMFxuICAgICAgICAgICAgICAgdmFyIHRvcCAgICA9IDBcbiAgICAgICAgICAgICAgIHZhciBib3R0b20gPSAwXG5cbiAgICAgICAgICAgICAgIGZvciAoIGNvbnN0IG8gb2Ygb2JqZWN0cyApXG4gICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGwgPSBvLmxlZnQgLSBvLndpZHRoXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHIgPSBvLmxlZnQgKyBvLndpZHRoXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHQgPSBvLnRvcCAgLSBvLmhlaWdodFxuICAgICAgICAgICAgICAgICAgICBjb25zdCBiID0gby50b3AgICsgby5oZWlnaHRcblxuICAgICAgICAgICAgICAgICAgICBpZiAoIGwgPCBsZWZ0IClcbiAgICAgICAgICAgICAgICAgICAgICAgICBsZWZ0ID0gbFxuXG4gICAgICAgICAgICAgICAgICAgIGlmICggciA+IHJpZ2h0IClcbiAgICAgICAgICAgICAgICAgICAgICAgICByaWdodCA9IHJcblxuICAgICAgICAgICAgICAgICAgICBpZiAoIHQgPCB0b3AgKVxuICAgICAgICAgICAgICAgICAgICAgICAgIHRvcCA9IHRcblxuICAgICAgICAgICAgICAgICAgICBpZiAoIGIgPiBib3R0b20gKVxuICAgICAgICAgICAgICAgICAgICAgICAgIGJvdHRvbSA9IGJcbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjb25zdCB3ICA9IHJpZ2h0IC0gbGVmdFxuICAgICAgICAgIGNvbnN0IGggID0gYm90dG9tIC0gdG9wXG4gICAgICAgICAgY29uc3QgdncgPSBmY2FudmFzLmdldFdpZHRoICAoKVxuICAgICAgICAgIGNvbnN0IHZoID0gZmNhbnZhcy5nZXRIZWlnaHQgKClcblxuICAgICAgICAgIGNvbnN0IGYgPSB3ID4gaFxuICAgICAgICAgICAgICAgICAgICA/ICh2dyA8IHZoID8gdncgOiB2aCkgLyB3XG4gICAgICAgICAgICAgICAgICAgIDogKHZ3IDwgdmggPyB2dyA6IHZoKSAvIGhcblxuICAgICAgICAgIGZjYW52YXMudmlld3BvcnRUcmFuc2Zvcm0gWzBdID0gZlxuICAgICAgICAgIGZjYW52YXMudmlld3BvcnRUcmFuc2Zvcm0gWzNdID0gZlxuXG4gICAgICAgICAgY29uc3QgY3ggPSBsZWZ0ICsgdyAvIDJcbiAgICAgICAgICBjb25zdCBjeSA9IHRvcCAgKyBoIC8gMlxuXG4gICAgICAgICAgZmNhbnZhcy52aWV3cG9ydFRyYW5zZm9ybSBbNF0gPSAtKGN4ICogZikgKyB2dyAvIDJcbiAgICAgICAgICBmY2FudmFzLnZpZXdwb3J0VHJhbnNmb3JtIFs1XSA9IC0oY3kgKiBmKSArIHZoIC8gMlxuXG4gICAgICAgICAgZm9yICggY29uc3QgbyBvZiBvYmplY3RzIClcbiAgICAgICAgICAgICAgIG8uc2V0Q29vcmRzICgpXG5cbiAgICAgICAgICBmY2FudmFzLnJlcXVlc3RSZW5kZXJBbGwgKClcbiAgICAgfVxuXG4gICAgIGlzb2xhdGUgKCBzaGFwZTogU2hhcGUgKVxuICAgICB7XG4gICAgICAgICAgZm9yICggY29uc3QgbyBvZiB0aGlzLmZjYW52YXMuZ2V0T2JqZWN0cyAoKSApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgby52aXNpYmxlID0gZmFsc2VcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBzaGFwZS5ncm91cC52aXNpYmxlID0gdHJ1ZVxuICAgICB9XG5cbiAgICAgZ2V0VGh1bWJuYWlsICgpXG4gICAgIHtcbiAgICAgICAgICBjb25zdCB7IGFjdGl2ZTogY3ZpZXcgfSA9IHRoaXNcblxuICAgICAgICAgIGNvbnN0IHRodW1ibmFpbCA9IGN2aWV3LnRodW1ibmFpbFxuXG4gICAgICAgICAgaWYgKCB0aHVtYm5haWwgfHwgY3ZpZXcuYWN0aXZlID09IGZhbHNlIClcbiAgICAgICAgICAgICAgIHRodW1ibmFpbFxuXG4gICAgICAgICAgcmV0dXJuIGN2aWV3LnRodW1ibmFpbCA9IHRoaXMuZmNhbnZhcy50b0RhdGFVUkwgKHsgZm9ybWF0OiBcImpwZWdcIiB9KVxuICAgICB9XG5cbiAgICAgLy8gVUkgRVZFTlRTXG5cbiAgICAgZW5hYmxlRXZlbnRzICgpXG4gICAgIHtcbiAgICAgICAgICB0aGlzLmluaXRDbGlja0V2ZW50ICgpXG4gICAgICAgICAgdGhpcy5pbml0T3ZlckV2ZW50ICAoKVxuICAgICAgICAgIHRoaXMuaW5pdFBhbkV2ZW50ICAgKClcbiAgICAgICAgICB0aGlzLmluaXRab29tRXZlbnQgICgpXG4gICAgICAgICAgLy90aGlzLmluaXRNb3ZlT2JqZWN0ICgpXG4gICAgICAgICAgLy90aGlzLmluaXREcmFnRXZlbnQgICgpXG5cbiAgICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lciAoIFwicmVzaXplXCIsIHRoaXMucmVzcG9uc2l2ZS5iaW5kICh0aGlzKSApXG4gICAgIH1cblxuICAgICBwcml2YXRlIHJlc3BvbnNpdmUgKClcbiAgICAge1xuICAgICAgICAgIHZhciB3aWR0aCAgID0gKHdpbmRvdy5pbm5lcldpZHRoICA+IDApID8gd2luZG93LmlubmVyV2lkdGggIDogc2NyZWVuLndpZHRoXG4gICAgICAgICAgdmFyIGhlaWdodCAgPSAod2luZG93LmlubmVySGVpZ2h0ID4gMCkgPyB3aW5kb3cuaW5uZXJIZWlnaHQgOiBzY3JlZW4uaGVpZ2h0XG5cbiAgICAgICAgICB0aGlzLmZjYW52YXMuc2V0RGltZW5zaW9ucyh7XG4gICAgICAgICAgICAgICB3aWR0aDogd2lkdGgsXG4gICAgICAgICAgICAgICBoZWlnaHQ6IGhlaWdodFxuICAgICAgICAgIH0pXG4gICAgIH1cblxuICAgICBwcml2YXRlIGluaXRDbGlja0V2ZW50ICgpXG4gICAgIHtcbiAgICAgICAgICBjb25zdCBwYWdlICAgICAgICAgICA9IHRoaXMuZmNhbnZhc1xuICAgICAgICAgIGNvbnN0IG1heF9jbGljaF9hcmVhID0gMjUgKiAyNVxuICAgICAgICAgIHZhciAgIGxhc3RfY2xpY2sgICAgID0gLTFcbiAgICAgICAgICB2YXIgICBsYXN0X3BvcyAgICAgICA9IHsgeDogLTk5OTksIHk6IC05OTk5IH1cblxuICAgICAgICAgIHBhZ2Uub24gKCBcIm1vdXNlOmRvd25cIiwgZmV2ZW50ID0+XG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgY29uc29sZS5sb2cgKCBcIm1vdXNlOmRvd25cIiApXG4gICAgICAgICAgICAgICBjb25zdCBub3cgICA9IERhdGUubm93ICgpXG4gICAgICAgICAgICAgICBjb25zdCBwb3MgICA9IGZldmVudC5wb2ludGVyXG4gICAgICAgICAgICAgICBjb25zdCByZXNldCA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgbGFzdF9jbGljayA9IG5vd1xuICAgICAgICAgICAgICAgICAgICBsYXN0X3BvcyAgID0gcG9zXG4gICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgIC8vIE5vdXMgdsOpcmlmaW9ucyBxdWUgc29pdCB1biBkb3VibGUtY2xpcXVlLlxuICAgICAgICAgICAgICAgaWYgKCA1MDAgPCBub3cgLSBsYXN0X2NsaWNrIClcbiAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCB0aGlzLm9uVG91Y2hPYmplY3QgKVxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZWxlbWVudCA9IGFzcGVjdC5nZXRBc3BlY3QgKCBmZXZlbnQudGFyZ2V0IClcblxuICAgICAgICAgICAgICAgICAgICAgICAgIEFyZWEuY3VycmVudEV2ZW50ID0gZmV2ZW50O1xuICAgICAgICAgICAgICAgICAgICAgICAgIGlmICggZWxlbWVudCApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm9uVG91Y2hPYmplY3QgKCBlbGVtZW50IClcbiAgICAgICAgICAgICAgICAgICAgICAgICBBcmVhLmN1cnJlbnRFdmVudCA9IG51bGw7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICBmZXZlbnQuZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24gKClcbiAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXNldCAoKVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgIC8vIE5vdXMgdsOpcmlmaW9ucyBxdWUgbGVzIGRldXggY2xpcXVlcyBzZSB0cm91dmUgZGFucyB1bmUgcsOpZ2lvbiBwcm9jaGUuXG4gICAgICAgICAgICAgICBjb25zdCB6b25lID0gKHBvcy54IC0gbGFzdF9wb3MueCkgKiAocG9zLnkgLSBsYXN0X3Bvcy55KVxuICAgICAgICAgICAgICAgaWYgKCB6b25lIDwgLW1heF9jbGljaF9hcmVhIHx8IG1heF9jbGljaF9hcmVhIDwgem9uZSApXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXNldCAoKVxuXG4gICAgICAgICAgICAgICAvLyBTaSBsZSBwb2ludGVyIGVzdCBhdS1kZXNzdXMgZOKAmXVuZSBmb3JtZS5cbiAgICAgICAgICAgICAgIGlmICggZmV2ZW50LnRhcmdldCAhPSB1bmRlZmluZWQgKVxuICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIHRoaXMub25Eb3VibGVUb3VjaE9iamVjdCApXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBlbGVtZW50ID0gYXNwZWN0LmdldEFzcGVjdCAoIGZldmVudC50YXJnZXQgKVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgQXJlYS5jdXJyZW50RXZlbnQgPSBmZXZlbnQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCBlbGVtZW50IClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMub25Eb3VibGVUb3VjaE9iamVjdCAoIGVsZW1lbnQgKVxuICAgICAgICAgICAgICAgICAgICAgICAgIEFyZWEuY3VycmVudEV2ZW50ID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGxhc3RfY2xpY2sgICA9IC0xXG4gICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAvLyBTaSBsZSBwb2ludGVyIGVzdCBhdS1kZXNzdXMgZOKAmXVuZSB6b25lIHZpZGUuXG4gICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIEFyZWEuY3VycmVudEV2ZW50ID0gZmV2ZW50O1xuICAgICAgICAgICAgICAgICAgICBpZiAoIHRoaXMub25Ub3VjaEFyZWEgKVxuICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMub25Ub3VjaEFyZWEgKCBwb3MueCwgcG9zLnkgKVxuICAgICAgICAgICAgICAgICAgICBBcmVhLmN1cnJlbnRFdmVudCA9IG51bGw7XG4gICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgIGZldmVudC5lLnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbiAoKVxuXG4gICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICB9KVxuICAgICB9XG5cbiAgICAgcHJpdmF0ZSBpbml0T3ZlckV2ZW50ICgpXG4gICAgIHtcbiAgICAgICAgICBjb25zdCBwYWdlID0gdGhpcy5mY2FudmFzXG5cbiAgICAgICAgICBwYWdlLm9uICggXCJtb3VzZTpvdmVyXCIsIGZldmVudCA9PlxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHRoaXMub3ZlckZPYmplY3QgPSBmZXZlbnQudGFyZ2V0XG5cbiAgICAgICAgICAgICAgIGlmICggdGhpcy5vbk92ZXJPYmplY3QgKVxuICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBlbGVtZW50ID0gYXNwZWN0LmdldEFzcGVjdCAoIGZldmVudC50YXJnZXQgKVxuXG4gICAgICAgICAgICAgICAgICAgIEFyZWEuY3VycmVudEV2ZW50ID0gZmV2ZW50O1xuICAgICAgICAgICAgICAgICAgICBpZiAoIGVsZW1lbnQgKVxuICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMub25PdmVyT2JqZWN0ICggZWxlbWVudCApXG4gICAgICAgICAgICAgICAgICAgIEFyZWEuY3VycmVudEV2ZW50ID0gbnVsbDtcbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICB9KVxuXG4gICAgICAgICAgcGFnZS5vbiAoIFwibW91c2U6b3V0XCIsIGZldmVudCA9PlxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHRoaXMub3ZlckZPYmplY3QgPSB1bmRlZmluZWRcblxuICAgICAgICAgICAgICAgaWYgKCB0aGlzLm9uT3V0T2JqZWN0IClcbiAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZWxlbWVudCA9IGFzcGVjdC5nZXRBc3BlY3QgKCBmZXZlbnQudGFyZ2V0IClcblxuICAgICAgICAgICAgICAgICAgICBBcmVhLmN1cnJlbnRFdmVudCA9IGZldmVudDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBlbGVtZW50IClcbiAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm9uT3V0T2JqZWN0ICggZWxlbWVudCApXG4gICAgICAgICAgICAgICAgICAgIEFyZWEuY3VycmVudEV2ZW50ID0gbnVsbDtcbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICB9KVxuICAgICB9XG5cbiAgICAgcHJpdmF0ZSBpbml0UGFuRXZlbnQgKClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHBhZ2UgICAgICAgPSB0aGlzLmZjYW52YXNcbiAgICAgICAgICB2YXIgICBpc0RyYWdnaW5nID0gZmFsc2VcbiAgICAgICAgICB2YXIgICBsYXN0UG9zWCAgID0gLTFcbiAgICAgICAgICB2YXIgICBsYXN0UG9zWSAgID0gLTFcblxuICAgICAgICAgIHBhZ2Uub24gKCBcIm1vdXNlOmRvd25cIiwgZmV2ZW50ID0+XG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgaWYgKCB0aGlzLm92ZXJGT2JqZWN0ID09IHVuZGVmaW5lZCApXG4gICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHBhZ2Uuc2VsZWN0aW9uID0gZmFsc2VcbiAgICAgICAgICAgICAgICAgICAgcGFnZS5kaXNjYXJkQWN0aXZlT2JqZWN0ICgpXG4gICAgICAgICAgICAgICAgICAgIHBhZ2UuZm9yRWFjaE9iamVjdCAoIG8gPT4geyBvLnNlbGVjdGFibGUgPSBmYWxzZSB9IClcblxuICAgICAgICAgICAgICAgICAgICBpc0RyYWdnaW5nID0gdHJ1ZVxuICAgICAgICAgICAgICAgICAgICBsYXN0UG9zWCAgID0gZmV2ZW50LnBvaW50ZXIueFxuICAgICAgICAgICAgICAgICAgICBsYXN0UG9zWSAgID0gZmV2ZW50LnBvaW50ZXIueVxuXG4gICAgICAgICAgICAgICAgICAgIHBhZ2UucmVxdWVzdFJlbmRlckFsbCAoKVxuICAgICAgICAgICAgICAgfVxuICAgICAgICAgIH0pXG5cbiAgICAgICAgICBwYWdlLm9uICggXCJtb3VzZTptb3ZlXCIsIGZldmVudCA9PlxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGlmICggaXNEcmFnZ2luZyApXG4gICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHBvaW50ZXIgID0gZmV2ZW50LnBvaW50ZXJcblxuICAgICAgICAgICAgICAgICAgICBwYWdlLnZpZXdwb3J0VHJhbnNmb3JtIFs0XSArPSBwb2ludGVyLnggLSBsYXN0UG9zWFxuICAgICAgICAgICAgICAgICAgICBwYWdlLnZpZXdwb3J0VHJhbnNmb3JtIFs1XSArPSBwb2ludGVyLnkgLSBsYXN0UG9zWVxuXG4gICAgICAgICAgICAgICAgICAgIHBhZ2UucmVxdWVzdFJlbmRlckFsbCgpXG5cbiAgICAgICAgICAgICAgICAgICAgbGFzdFBvc1ggPSBwb2ludGVyLnhcbiAgICAgICAgICAgICAgICAgICAgbGFzdFBvc1kgPSBwb2ludGVyLnlcbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICB9KVxuXG4gICAgICAgICAgcGFnZS5vbiAoIFwibW91c2U6dXBcIiwgKCkgPT5cbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBwYWdlLnNlbGVjdGlvbiA9IHRydWVcblxuICAgICAgICAgICAgICAgcGFnZS5mb3JFYWNoT2JqZWN0ICggbyA9PlxuICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBvLnNlbGVjdGFibGUgPSB0cnVlXG4gICAgICAgICAgICAgICAgICAgIG8uc2V0Q29vcmRzKClcbiAgICAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgICAgIGlzRHJhZ2dpbmcgPSBmYWxzZVxuXG4gICAgICAgICAgICAgICBwYWdlLnJlcXVlc3RSZW5kZXJBbGwgKClcbiAgICAgICAgICB9KVxuICAgICB9XG5cbiAgICAgcHJpdmF0ZSBpbml0Wm9vbUV2ZW50ICgpXG4gICAgIHtcbiAgICAgICAgICBjb25zdCBwYWdlID0gdGhpcy5mY2FudmFzXG5cbiAgICAgICAgICBwYWdlLm9uICggXCJtb3VzZTp3aGVlbFwiLCBmZXZlbnQgPT5cbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBjb25zdCBldmVudCAgID0gZmV2ZW50LmUgYXMgV2hlZWxFdmVudFxuICAgICAgICAgICAgICAgdmFyICAgZGVsdGEgICA9IGV2ZW50LmRlbHRhWVxuICAgICAgICAgICAgICAgdmFyICAgem9vbSAgICA9IHBhZ2UuZ2V0Wm9vbSgpXG4gICAgICAgICAgICAgICAgICAgIHpvb20gICAgPSB6b29tIC0gZGVsdGEgKiAwLjAwNVxuXG4gICAgICAgICAgICAgICBpZiAoem9vbSA+IDkpXG4gICAgICAgICAgICAgICAgICAgIHpvb20gPSA5XG5cbiAgICAgICAgICAgICAgIGlmICh6b29tIDwgMC41KVxuICAgICAgICAgICAgICAgICAgICB6b29tID0gMC41XG5cbiAgICAgICAgICAgICAgIHBhZ2Uuem9vbVRvUG9pbnQoIG5ldyBmYWJyaWMuUG9pbnQgKCBldmVudC5vZmZzZXRYLCBldmVudC5vZmZzZXRZICksIHpvb20gKVxuXG4gICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKVxuXG4gICAgICAgICAgICAgICBwYWdlLnJlcXVlc3RSZW5kZXJBbGwgKClcbiAgICAgICAgICB9KVxuICAgICB9XG5cbiAgICAgcHJpdmF0ZSBpbml0TW92ZU9iamVjdCAoKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgcGFnZSAgICAgID0gdGhpcy5mY2FudmFzXG4gICAgICAgICAgdmFyICAgY2x1c3RlciAgID0gdW5kZWZpbmVkIGFzIGZhYnJpYy5PYmplY3QgW11cbiAgICAgICAgICB2YXIgICBwb3NpdGlvbnMgPSB1bmRlZmluZWQgYXMgbnVtYmVyIFtdW11cbiAgICAgICAgICB2YXIgICBvcmlnaW5YICAgPSAwXG4gICAgICAgICAgdmFyICAgb3JpZ2luWSAgID0gMFxuXG4gICAgICAgICAgZnVuY3Rpb24gb25fc2VsZWN0aW9uIChmZXZlbnQ6IGZhYnJpYy5JRXZlbnQpXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgY29uc3QgdGFyZ2V0ID0gZmV2ZW50LnRhcmdldFxuICAgICAgICAgICAgICAgY29uc29sZS5sb2cgKCB0YXJnZXQgKVxuICAgICAgICAgICAgICAgY2x1c3RlciA9IHRhcmdldCBbXCJjbHVzdGVyXCJdIGFzIGZhYnJpYy5PYmplY3QgW11cblxuICAgICAgICAgICAgICAgaWYgKCBjbHVzdGVyID09IHVuZGVmaW5lZCApXG4gICAgICAgICAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgICAgICAgICBvcmlnaW5YICAgPSB0YXJnZXQubGVmdFxuICAgICAgICAgICAgICAgb3JpZ2luWSAgID0gdGFyZ2V0LnRvcFxuICAgICAgICAgICAgICAgcG9zaXRpb25zID0gW11cblxuICAgICAgICAgICAgICAgZm9yICggY29uc3QgbyBvZiBjbHVzdGVyIClcbiAgICAgICAgICAgICAgICAgICAgcG9zaXRpb25zLnB1c2ggKFsgby5sZWZ0LCBvLnRvcCBdKVxuXG4gICAgICAgICAgICAgICBjb25zb2xlLmxvZyAoXCJjcmVhdGVkXCIpXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcGFnZS5vbiAoIFwic2VsZWN0aW9uOmNyZWF0ZWRcIiwgb25fc2VsZWN0aW9uIClcbiAgICAgICAgICBwYWdlLm9uICggXCJzZWxlY3Rpb246dXBkYXRlZFwiLCBvbl9zZWxlY3Rpb24gKVxuXG4gICAgICAgICAgcGFnZS5vbiAoIFwib2JqZWN0Om1vdmluZ1wiLCBmZXZlbnQgPT5cbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBpZiAoIGNsdXN0ZXIgPT0gdW5kZWZpbmVkIClcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgICAgICAgIGNvbnN0IHRhcmdldCAgID0gZmV2ZW50LnRhcmdldFxuICAgICAgICAgICAgICAgY29uc3Qgb2Zmc2V0WCAgPSB0YXJnZXQubGVmdCAtIG9yaWdpblhcbiAgICAgICAgICAgICAgIGNvbnN0IG9mZnNldFkgID0gdGFyZ2V0LnRvcCAgLSBvcmlnaW5ZXG5cbiAgICAgICAgICAgICAgIGZvciAoIHZhciBpID0gMCA7IGkgPCBjbHVzdGVyLmxlbmd0aCA7IGkrKyApXG4gICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG9iaiA9IGNsdXN0ZXIgW2ldXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHBvcyA9IHBvc2l0aW9ucyBbaV1cbiAgICAgICAgICAgICAgICAgICAgb2JqLnNldCAoe1xuICAgICAgICAgICAgICAgICAgICAgICAgIGxlZnQ6IHBvcyBbMF0gKyBvZmZzZXRYLFxuICAgICAgICAgICAgICAgICAgICAgICAgIHRvcCA6IHBvcyBbMV0gKyBvZmZzZXRZXG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICB9XG4gICAgICAgICAgfSlcblxuICAgICAgICAgIHBhZ2Uub24gKCBcInNlbGVjdGlvbjpjbGVhcmVkXCIsIGZldmVudCA9PlxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNsdXN0ZXIgPSB1bmRlZmluZWRcblxuICAgICAgICAgICAgICAgY29uc29sZS5sb2cgKFwiY2xlYXJlZFwiKVxuICAgICAgICAgIH0pXG4gICAgIH1cblxuICAgICBwcml2YXRlIGluaXREcmFnRXZlbnQgKClcbiAgICAge1xuICAgICAgICAgIC8vIGh0dHBzOi8vd3d3Lnczc2Nob29scy5jb20vaHRtbC9odG1sNV9kcmFnYW5kZHJvcC5hc3BcbiAgICAgICAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vU2hvcGlmeS9kcmFnZ2FibGUvYmxvYi9tYXN0ZXIvc3JjL0RyYWdnYWJsZS9EcmFnZ2FibGUuanNcblxuICAgICAgICAgIGNvbnN0IHBhZ2UgICAgICA9IHRoaXMuZmNhbnZhc1xuXG4gICAgICAgICAgcGFnZS5vbiAoIFwidG91Y2g6ZHJhZ1wiLCBmZXZlbnQgPT5cbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nICggZmV2ZW50IClcbiAgICAgICAgICAgICAgIGNvbnNvbGUubG9nICggXCJ0b3VjaDpkcmFnXCIgKVxuICAgICAgICAgIH0pXG5cbiAgICAgICAgICBwYWdlLm9uICggXCJkcmFnZW50ZXJcIiwgZmV2ZW50ID0+XG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgLy9jb25zb2xlLmxvZyAoIFwiRFJPUC1FTlRFUlwiLCBmZXZlbnQgKVxuICAgICAgICAgIH0pXG5cbiAgICAgICAgICBwYWdlLm9uICggXCJkcmFnb3ZlclwiLCBmZXZlbnQgPT5cbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nICggXCJEUk9QLU9WRVJcIiwgZmV2ZW50IClcbiAgICAgICAgICB9KVxuXG4gICAgICAgICAgcGFnZS5vbiAoIFwiZHJvcFwiLCBmZXZlbnQgPT5cbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICAvL2NvbnN0IGUgPSBmZXZlbnQuZSBhcyBEcmFnRXZlbnRcbiAgICAgICAgICAgICAgIC8vY29uc29sZS5sb2cgKCBcIkRST1BcIiwgZS5kYXRhVHJhbnNmZXIuZ2V0RGF0YSAoXCJ0ZXh0XCIpIClcbiAgICAgICAgICB9KVxuICAgICB9XG59XG4iLCJcbmltcG9ydCB7IEFyZWEgfSBmcm9tIFwiLi9Db21wb25lbnQvQXJlYS9hcmVhLmpzXCJcbmNvbnN0IGNtZHMgPSB7fSBhcyBSZWNvcmQgPHN0cmluZywgQ29tbWFuZD5cblxuY2xhc3MgQ29tbWFuZFxue1xuICAgICBjb25zdHJ1Y3RvciAoIHByaXZhdGUgY2FsbGJhY2s6ICggZXZlbnQ6IGZhYnJpYy5JRXZlbnQgKSA9PiB2b2lkICkge31cblxuICAgICBydW4gKClcbiAgICAge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICB0aGlzLmNhbGxiYWNrICggQXJlYS5jdXJyZW50RXZlbnQgKTtcbiAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuXG4gICAgICAgICAgfVxuICAgICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjb21tYW5kICggbmFtZTogc3RyaW5nLCBjYWxsYmFjaz86ICggZXZlbnQ6IGZhYnJpYy5JRXZlbnQgKSA9PiB2b2lkIClcbntcbiAgICAgaWYgKCB0eXBlb2YgY2FsbGJhY2sgPT0gXCJmdW5jdGlvblwiIClcbiAgICAge1xuICAgICAgICAgIGlmICggbmFtZSBpbiBjbWRzICkgcmV0dXJuXG4gICAgICAgICAgY21kcyBbbmFtZV0gPSBuZXcgQ29tbWFuZCAoIGNhbGxiYWNrIClcbiAgICAgfVxuXG4gICAgIHJldHVybiBjbWRzIFtuYW1lXVxufVxuIiwiXG5pbXBvcnQgeyBjcmVhdGVOb2RlIH0gZnJvbSBcIi4uLy4uLy4uL0RhdGEvaW5kZXguanNcIlxuaW1wb3J0IHsgeG5vZGUgfSBmcm9tIFwiLi4veG5vZGUuanNcIlxuXG5kZWNsYXJlIGdsb2JhbFxue1xuICAgICBpbnRlcmZhY2UgJENvbXBvbmVudCBleHRlbmRzICRDbHVzdGVyXG4gICAgIHtcbiAgICAgICAgICByZWFkb25seSBjb250ZXh0OiB0eXBlb2YgQ09OVEVYVF9VSVxuICAgICAgICAgIHR5cGU6IHN0cmluZ1xuICAgICAgICAgIGNoaWxkcmVuPzogJENvbXBvbmVudCBbXSAvLyBSZWNvcmQgPHN0cmluZywgJENoaWxkPlxuICAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBDb21wb25lbnQgPCQgZXh0ZW5kcyAkQ29tcG9uZW50ID0gJENvbXBvbmVudD5cbntcbiAgICAgZGF0YTogJFxuXG4gICAgIGNvbnRhaW5lcjogSFRNTEVsZW1lbnQgfCBTVkdFbGVtZW50XG5cbiAgICAgZGVmYXVsdERhdGEgKCkgOiAkQ29tcG9uZW50XG4gICAgIHtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgY29udGV4dDogQ09OVEVYVF9VSSxcbiAgICAgICAgICAgICAgIHR5cGUgICA6IFwiY29tcG9uZW50XCIsXG4gICAgICAgICAgICAgICBpZCAgICAgOiB1bmRlZmluZWQsXG4gICAgICAgICAgfVxuICAgICB9XG5cbiAgICAgY29uc3RydWN0b3IgKCBkYXRhOiAkIClcbiAgICAge1xuICAgICAgICAgIHRoaXMuZGF0YSA9IE9iamVjdC5hc3NpZ24gKFxuICAgICAgICAgICAgICAgdGhpcy5kZWZhdWx0RGF0YSAoKSxcbiAgICAgICAgICAgICAgIGNyZWF0ZU5vZGUgKCBkYXRhLnR5cGUsIGRhdGEuaWQsIGRhdGEgKSBhcyBhbnlcbiAgICAgICAgICApXG4gICAgIH1cblxuICAgICBnZXRIdG1sICgpOiAoSFRNTEVsZW1lbnQgfCBTVkdFbGVtZW50KSBbXVxuICAgICB7XG4gICAgICAgICAgaWYgKCB0aGlzLmNvbnRhaW5lciA9PSB1bmRlZmluZWQgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHRoaXMuY29udGFpbmVyID0gPGRpdiBjbGFzcz17IHRoaXMuZGF0YS50eXBlIH0+PC9kaXY+XG4gICAgICAgICAgICAgICB0aGlzLm9uQ3JlYXRlICgpXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIFt0aGlzLmNvbnRhaW5lcl1cbiAgICAgfVxuXG4gICAgIG9uQ3JlYXRlICgpXG4gICAgIHtcblxuICAgICB9XG5cbn1cblxuXG4iLCIvLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi9EYXRhL2luZGV4LnRzXCIgLz5cblxuZGVjbGFyZSBnbG9iYWxcbntcbiAgICAgY29uc3QgQ09OVEVYVF9VSTogXCJjb25jZXB0LXVpXCJcbn1cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eSAoIGdsb2JhbFRoaXMsIFwiQ09OVEVYVF9VSVwiLCB7XG4gICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICAgICB3cml0YWJsZTogZmFsc2UsXG4gICAgIHZhbHVlOiBcImNvbmNlcHQtdWlcIlxufSApXG5cbmltcG9ydCB7IEZhY3RvcnksIERhdGFiYXNlIH0gZnJvbSBcIi4uL0RhdGEvaW5kZXguanNcIlxuaW1wb3J0IHsgQ29tcG9uZW50IH0gZnJvbSBcIi4vQmFzZS9Db21wb25lbnQvaW5kZXguanNcIlxuXG4vL2NvbnN0IENPTlRFWFRfVUkgPSBcImNvbmNlcHQtdWlcIlxuY29uc3QgZGIgICAgICA9IG5ldyBEYXRhYmFzZSA8JEFueUNvbXBvbmVudHM+ICgpXG5jb25zdCBmYWN0b3J5ID0gbmV3IEZhY3RvcnkgPENvbXBvbmVudCwgJEFueUNvbXBvbmVudHM+ICggZGIgKVxuXG5leHBvcnQgY29uc3QgaW5TdG9jazogdHlwZW9mIGZhY3RvcnkuaW5TdG9jayA9IGZ1bmN0aW9uICgpXG57XG4gICAgIGNvbnN0IGFyZyA9IGFyZ3VtZW50cy5sZW5ndGggPT0gMVxuICAgICAgICAgICAgICAgPyBub3JtYWxpemUgKCBhcmd1bWVudHMgWzBdIClcbiAgICAgICAgICAgICAgIDogbm9ybWFsaXplICggWy4uLiBhcmd1bWVudHNdIClcblxuICAgICBjb25zdCBwYXRoID0gZmFjdG9yeS5nZXRQYXRoICggYXJnIClcblxuICAgICByZXR1cm4gZmFjdG9yeS5faW5TdG9jayAoIHBhdGggKVxufVxuXG5leHBvcnQgY29uc3QgcGljazogdHlwZW9mIGZhY3RvcnkucGljayA9IGZ1bmN0aW9uICggLi4uIHJlc3Q6IGFueSBbXSApXG57XG4gICAgIGNvbnN0IGFyZyA9IGFyZ3VtZW50cy5sZW5ndGggPT0gMVxuICAgICAgICAgICAgICAgPyBub3JtYWxpemUgKCBhcmd1bWVudHMgWzBdIClcbiAgICAgICAgICAgICAgIDogbm9ybWFsaXplICggWy4uLiBhcmd1bWVudHNdIClcblxuICAgICBjb25zdCBwYXRoID0gZmFjdG9yeS5nZXRQYXRoICggYXJnIClcblxuICAgICByZXR1cm4gZmFjdG9yeS5fcGljayAoIHBhdGggKVxufVxuXG5leHBvcnQgY29uc3QgbWFrZTogdHlwZW9mIGZhY3RvcnkubWFrZSA9IGZ1bmN0aW9uICgpXG57XG4gICAgIGNvbnN0IGFyZyA9IGFyZ3VtZW50cy5sZW5ndGggPT0gMVxuICAgICAgICAgICAgICAgPyBub3JtYWxpemUgKCBhcmd1bWVudHMgWzBdIClcbiAgICAgICAgICAgICAgIDogbm9ybWFsaXplICggWy4uLiBhcmd1bWVudHNdIClcblxuICAgICBjb25zdCBwYXRoID0gZmFjdG9yeS5nZXRQYXRoICggYXJnIClcblxuICAgICBpZiAoIGlzTm9kZSAoIGFyZyApIClcbiAgICAgICAgICB2YXIgZGF0YSA9IGFyZ1xuXG4gICAgIHJldHVybiBmYWN0b3J5Ll9tYWtlICggcGF0aCwgZGF0YSApXG59XG5cbmV4cG9ydCBjb25zdCBzZXQ6IHR5cGVvZiBkYi5zZXQgPSBmdW5jdGlvbiAoKVxue1xuICAgICBjb25zdCBhcmcgPSBub3JtYWxpemUgKCBhcmd1bWVudHMgWzBdIClcblxuICAgICBpZiAoIGFyZ3VtZW50cy5sZW5ndGggPT0gMSApXG4gICAgICAgICAgZGIuc2V0ICggYXJnIClcbiAgICAgZWxzZVxuICAgICAgICAgIGRiLnNldCAoIGFyZywgbm9ybWFsaXplICggYXJndW1lbnRzIFsxXSApIClcbn1cblxuZXhwb3J0IGNvbnN0IGRlZmluZSA9IGZhY3RvcnkuZGVmaW5lLmJpbmQgKCBmYWN0b3J5ICkgYXMgdHlwZW9mIGZhY3RvcnkuZGVmaW5lXG4vL2V4cG9ydCBjb25zdCBkZWZpbmU6IHR5cGVvZiBmYWN0b3J5LmRlZmluZSA9IGZ1bmN0aW9uICggY3RvcjogYW55LCAuLi4gcmVzdDogYW55IClcbi8ve1xuLy8gICAgIGNvbnN0IGFyZyA9IHJlc3QubGVuZ3RoID09IDFcbi8vICAgICAgICAgICAgICAgPyBub3JtYWxpemUgKCByZXN0IFswXSApXG4vLyAgICAgICAgICAgICAgIDogbm9ybWFsaXplICggWy4uLiByZXN0XSApXG4vL1xuLy8gICAgIGNvbnN0IHBhdGggPSBmYWN0b3J5LmdldFBhdGggKCBhcmcgKVxuLy9cbi8vICAgICBmYWN0b3J5Ll9kZWZpbmUgKCBjdG9yLCBwYXRoIClcbi8vfVxuXG5cbmZ1bmN0aW9uIGlzTm9kZSAoIG9ibDogYW55IClcbntcbiAgICAgcmV0dXJuIHR5cGVvZiBvYmwgPT0gXCJvYmplY3RcIiAmJiAhIEFycmF5LmlzQXJyYXkgKG9ibClcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplICggYXJnOiBhbnkgKVxue1xuICAgICBpZiAoIEFycmF5LmlzQXJyYXkgKGFyZykgKVxuICAgICB7XG4gICAgICAgICAgaWYgKCBhcmcgWzBdICE9PSBDT05URVhUX1VJIClcbiAgICAgICAgICAgICAgIGFyZy51bnNoaWZ0ICggQ09OVEVYVF9VSSApXG4gICAgIH1cbiAgICAgZWxzZSBpZiAoIHR5cGVvZiBhcmcgPT0gXCJvYmplY3RcIiApXG4gICAgIHtcbiAgICAgICAgICBpZiAoIFwiY29udGV4dFwiIGluIGFyZyApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgaWYgKCBhcmcuY29udGV4dCAhPT0gQ09OVEVYVF9VSSApXG4gICAgICAgICAgICAgICAgICAgIHRocm93IFwiQmFkIGNvbnRleHQgdmFsdWVcIlxuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgKGFyZyBhcyBhbnkpLmNvbnRleHQgPSBDT05URVhUX1VJXG4gICAgICAgICAgfVxuICAgICB9XG5cbiAgICAgcmV0dXJuIGFyZ1xufVxuIiwiXG5pbXBvcnQgeyBwaWNrLCBpblN0b2NrLCBtYWtlIH0gZnJvbSBcIi4uLy4uL2RiLmpzXCJcbmltcG9ydCB7IENvbXBvbmVudCB9IGZyb20gXCIuLi9Db21wb25lbnQvaW5kZXguanNcIlxuXG5kZWNsYXJlIGdsb2JhbFxue1xuICAgICBpbnRlcmZhY2UgJENvbnRhaW5lciBleHRlbmRzICRDb21wb25lbnRcbiAgICAge1xuICAgICAgICAgIGRpcmVjdGlvbj86IFwibHJcIiB8IFwicmxcIiB8IFwidGJcIiB8IFwiYnRcIlxuICAgICAgICAgIGNoaWxkcmVuPzogJEFueUNvbXBvbmVudHMgW11cbiAgICAgfVxufVxuXG5leHBvcnQgY2xhc3MgQ29udGFpbmVyIDwkIGV4dGVuZHMgJENvbnRhaW5lciA9ICRDb250YWluZXI+IGV4dGVuZHMgQ29tcG9uZW50IDwkPlxue1xuICAgICBjaGlsZHJlbiA9IHt9IGFzIFJlY29yZCA8c3RyaW5nLCBDb21wb25lbnQ+XG4gICAgIHNsb3Q6IEpTWC5FbGVtZW50XG5cbiAgICAgcmVhZG9ubHkgaXNfdmVydGljYWw6IGJvb2xlYW5cblxuICAgICBkZWZhdWx0RGF0YSAoKSA6ICRDb250YWluZXJcbiAgICAge1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICBjb250ZXh0OiBcImNvbmNlcHQtdWlcIixcbiAgICAgICAgICAgICAgIHR5cGUgICAgIDogXCJjb21wb25lbnRcIixcbiAgICAgICAgICAgICAgIGlkICAgICAgIDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgZGlyZWN0aW9uOiBcImxyXCIsXG4gICAgICAgICAgfVxuICAgICB9XG5cbiAgICAgY29uc3RydWN0b3IgKCBkYXRhOiAkIClcbiAgICAge1xuICAgICAgICAgIHN1cGVyICggZGF0YSApXG5cbiAgICAgICAgICBkYXRhID0gdGhpcy5kYXRhXG4gICAgICAgICAgY29uc3QgY2hpbGRyZW4gPSBkYXRhLmNoaWxkcmVuXG5cbiAgICAgICAgICBpZiAoIGNoaWxkcmVuIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBmb3IgKCBjb25zdCBjaGlsZCBvZiBjaGlsZHJlbiApXG4gICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGlmICggISBpblN0b2NrICggY2hpbGQgKSApXG4gICAgICAgICAgICAgICAgICAgICAgICAgbWFrZSAoIGNoaWxkIClcbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICB0aGlzLmlzX3ZlcnRpY2FsID0gZGF0YS5kaXJlY3Rpb24gPT0gXCJidFwiIHx8IGRhdGEuZGlyZWN0aW9uID09IFwidGJcIlxuICAgICB9XG5cbiAgICAgLyoqIEBvdmVycmlkZSAqL1xuICAgICBnZXRIdG1sICgpXG4gICAgIHtcbiAgICAgICAgICBpZiAoIHRoaXMuY29udGFpbmVyICE9IHVuZGVmaW5lZCApXG4gICAgICAgICAgICAgICByZXR1cm4gW3RoaXMuY29udGFpbmVyXVxuXG4gICAgICAgICAgY29uc3QgZWxlbWVudHMgID0gc3VwZXIuZ2V0SHRtbCAoKVxuICAgICAgICAgIGNvbnN0IGNvbnRhaW5lciA9IHRoaXMuY29udGFpbmVyXG4gICAgICAgICAgY29uc3QgZGF0YSAgICAgID0gdGhpcy5kYXRhXG4gICAgICAgICAgY29uc3QgY2hpbGRyZW4gID0gdGhpcy5jaGlsZHJlblxuICAgICAgICAgIGNvbnN0IHVuZCA9IHVuZGVmaW5lZFxuXG4gICAgICAgICAgaWYgKCB0aGlzLmlzX3ZlcnRpY2FsIClcbiAgICAgICAgICAgICAgIGNvbnRhaW5lci5jbGFzc0xpc3QuYWRkICggXCJ2ZXJ0aWNhbFwiIClcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICBjb250YWluZXIuY2xhc3NMaXN0LnJlbW92ZSAoIFwidmVydGljYWxcIiApXG5cbiAgICAgICAgICBpZiAoIHRoaXMuc2xvdCA9PSB1bmRlZmluZWQgKVxuICAgICAgICAgICAgICAgdGhpcy5zbG90ID0gY29udGFpbmVyXG5cbiAgICAgICAgICBjb25zdCBzbG90ID0gdGhpcy5zbG90XG5cbiAgICAgICAgICBpZiAoIGRhdGEuY2hpbGRyZW4gKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNvbnN0IG5ld19jaGlsZHJlbiA9IFtdIGFzIENvbXBvbmVudCBbXVxuXG4gICAgICAgICAgICAgICBmb3IgKCBjb25zdCBjaGlsZCBvZiBkYXRhLmNoaWxkcmVuIClcbiAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbyA9IHBpY2sgKCBjaGlsZCApXG4gICAgICAgICAgICAgICAgICAgIHNsb3QuYXBwZW5kICggLi4uIG8uZ2V0SHRtbCAoKSApXG4gICAgICAgICAgICAgICAgICAgIGNoaWxkcmVuIFtvLmRhdGEuaWRdID0gb1xuICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICB0aGlzLm9uQ2hpbGRyZW5BZGRlZCAoIG5ld19jaGlsZHJlbiApXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIGVsZW1lbnRzXG4gICAgIH1cblxuICAgICBvbkNoaWxkcmVuQWRkZWQgKCBjb21wb25lbnRzOiBDb21wb25lbnQgW10gKVxuICAgICB7XG5cbiAgICAgfVxuXG4gICAgIGFwcGVuZCAoIC4uLiBlbGVtZW50czogKHN0cmluZyB8IEVsZW1lbnQgfCBDb21wb25lbnQgfCAkQW55Q29tcG9uZW50cykgW10gKVxuICAgICB7XG5cbiAgICAgICAgICBpZiAoIHRoaXMuY29udGFpbmVyID09IHVuZGVmaW5lZCApXG4gICAgICAgICAgICAgICB0aGlzLmdldEh0bWwgKClcblxuICAgICAgICAgIGNvbnN0IHNsb3QgICAgICA9IHRoaXMuc2xvdFxuICAgICAgICAgIGNvbnN0IGNoaWxkcmVuICA9IHRoaXMuY2hpbGRyZW5cbiAgICAgICAgICBjb25zdCBuZXdfY2hpbGQgPSBbXSBhcyBDb21wb25lbnQgW11cblxuICAgICAgICAgIGZvciAoIHZhciBlIG9mIGVsZW1lbnRzIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBpZiAoIHR5cGVvZiBlID09IFwic3RyaW5nXCIgKVxuICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBlID0gbmV3IFBoYW50b20gKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICBjb250ZXh0OiBcImNvbmNlcHQtdWlcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlICAgOiBcInBoYW50b21cIixcbiAgICAgICAgICAgICAgICAgICAgICAgICBpZCAgOiB1bmRlZmluZWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudDogZVxuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgZWxzZSBpZiAoIGUgaW5zdGFuY2VvZiBFbGVtZW50IClcbiAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgVUlfQ09NUE9ORU5UID0gU3ltYm9sLmZvciAoIFwiVUlfQ09NUE9ORU5UXCIgKVxuXG4gICAgICAgICAgICAgICAgICAgIGUgPSBlIFtVSV9DT01QT05FTlRdICE9IHVuZGVmaW5lZFxuICAgICAgICAgICAgICAgICAgICAgICAgID8gZSBbVUlfQ09NUE9ORU5UXVxuICAgICAgICAgICAgICAgICAgICAgICAgIDogbmV3IFBoYW50b20gKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRleHQ6IFwiY29uY2VwdC11aVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZSAgIDogXCJwaGFudG9tXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZCAgOiB1bmRlZmluZWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50OiBlLm91dGVySFRNTFxuICAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICBlbHNlIGlmICggIShlIGluc3RhbmNlb2YgQ29tcG9uZW50KSApXG4gICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGUgPSBpblN0b2NrICggZSApID8gcGljayAoIGUgKSA6IG1ha2UgKCBlIClcbiAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgY2hpbGRyZW4gWyhlIGFzIENvbXBvbmVudCkuZGF0YS5pZF0gPSBlIGFzIENvbXBvbmVudFxuICAgICAgICAgICAgICAgc2xvdC5hcHBlbmQgKCAuLi4gKGUgYXMgQ29tcG9uZW50KS5nZXRIdG1sICgpIClcbiAgICAgICAgICAgICAgIG5ld19jaGlsZC5wdXNoICggZSBhcyBDb21wb25lbnQgKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICggbmV3X2NoaWxkLmxlbmd0aCA+IDAgKVxuICAgICAgICAgICAgICAgdGhpcy5vbkNoaWxkcmVuQWRkZWQgKCBuZXdfY2hpbGQgKVxuICAgICB9XG5cbiAgICAgcmVtb3ZlICggLi4uIGVsZW1lbnRzOiBDb21wb25lbnQgW10gKVxuICAgICB7XG4gICAgICAgICAgY29uc3Qgc2xvdCAgICAgID0gdGhpcy5zbG90XG4gICAgICAgICAgY29uc3QgY2hpbGRyZW4gID0gdGhpcy5jaGlsZHJlblxuXG4gICAgICAgICAgZm9yICggdmFyIGUgb2YgZWxlbWVudHMgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGlmICggZS5kYXRhLmlkIGluIGNoaWxkcmVuIClcbiAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgZS5jb250YWluZXIucmVtb3ZlICgpXG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBjaGlsZHJlbiBbZS5kYXRhLmlkXVxuICAgICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgfVxuXG4gICAgIGNsZWFyICgpXG4gICAgIHtcbiAgICAgICAgICB0aGlzLmNoaWxkcmVuID0ge31cblxuICAgICAgICAgIGlmICggdGhpcy5jb250YWluZXIgKVxuICAgICAgICAgICAgICAgdGhpcy5jb250YWluZXIuaW5uZXJIVE1MID0gXCJcIlxuICAgICB9XG5cbn1cblxuXG5pbnRlcmZhY2UgJFBoYW50b20gZXh0ZW5kcyAkQ29tcG9uZW50XG57XG4gICAgIHR5cGU6IFwicGhhbnRvbVwiXG4gICAgIGNvbnRlbnQ6IHN0cmluZ1xufVxuXG5jbGFzcyBQaGFudG9tIGV4dGVuZHMgQ29tcG9uZW50IDwkUGhhbnRvbT5cbntcbiAgICAgY29udGFpbmVyOiBIVE1MRWxlbWVudCB8IFNWR0VsZW1lbnRcblxuICAgICAvKiogQG92ZXJyaWRlICovXG4gICAgIGdldEh0bWwgKClcbiAgICAge1xuICAgICAgICAgIGlmICggdGhpcy5jb250YWluZXIgPT0gdW5kZWZpbmVkIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICB0aGlzLmNvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgKCBcImRpdlwiIClcbiAgICAgICAgICAgICAgIHRoaXMuY29udGFpbmVyLmlubmVySFRNTCA9IHRoaXMuZGF0YS5jb250ZW50XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIHRoaXMuY29udGFpbmVyLmNoaWxkTm9kZXMgYXMgYW55IGFzIEhUTUxFbGVtZW50IFtdXG4gICAgIH1cbn1cbiIsIlxuaW1wb3J0IHsgQ29tcG9uZW50IH0gZnJvbSBcIi4uLy4uL0Jhc2UvQ29tcG9uZW50L2luZGV4LmpzXCJcbmltcG9ydCB7IHhub2RlIH0gICAgIGZyb20gXCIuLi8uLi9CYXNlL3hub2RlLmpzXCJcbi8vaW1wb3J0IHsgQ29tbWFuZHMgfSAgZnJvbSBcIi4uLy4uL0Jhc2UvY29tbWFuZC5qc1wiXG5pbXBvcnQgeyBkZWZpbmUgfSAgICBmcm9tIFwiLi4vLi4vZGIuanNcIlxuaW1wb3J0IHsgY29tbWFuZCB9IGZyb20gXCIuLi8uLi9jb21tYW5kLmpzXCJcblxuZXhwb3J0IGNsYXNzIEJ1dHRvbiBleHRlbmRzIENvbXBvbmVudCA8JEJ1dHRvbj5cbntcbiAgICAgLyoqIEBvdmVycmlkZSAqL1xuICAgICBnZXRIdG1sICgpXG4gICAgIHtcbiAgICAgICAgICBpZiAoIHRoaXMuY29udGFpbmVyID09IHVuZGVmaW5lZCApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgY29uc3QgZGF0YSA9IHRoaXMuZGF0YVxuXG4gICAgICAgICAgICAgICBjb25zdCBub2RlID0gPGRpdiBjbGFzcz1cImJ1dHRvblwiPlxuICAgICAgICAgICAgICAgICAgICB7IGRhdGEuaWNvbiA/IDxzcGFuIGNsYXNzPVwiaWNvblwiPnsgZGF0YS5pY29uIH08L3NwYW4+IDogbnVsbCB9XG4gICAgICAgICAgICAgICAgICAgIHsgZGF0YS50ZXh0ID8gPHNwYW4gY2xhc3M9XCJ0ZXh0XCI+eyBkYXRhLnRleHQgfTwvc3Bhbj4gOiBudWxsIH1cbiAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgICBpZiAoIHRoaXMuZGF0YS5jYWxsYmFjayAhPSB1bmRlZmluZWQgfHwgdGhpcy5kYXRhLmNvbW1hbmQgIT0gdW5kZWZpbmVkIClcbiAgICAgICAgICAgICAgICAgICAgbm9kZS5hZGRFdmVudExpc3RlbmVyICggXCJjbGlja1wiLCB0aGlzLm9uVG91Y2guYmluZCAodGhpcykgKVxuXG4gICAgICAgICAgICAgICB0aGlzLmNvbnRhaW5lciA9IG5vZGVcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gWyB0aGlzLmNvbnRhaW5lciBdIGFzIEhUTUxFbGVtZW50IFtdXG4gICAgIH1cblxuICAgICBvblRvdWNoICgpXG4gICAgIHtcbiAgICAgICAgICBpZiAoIHRoaXMuZGF0YS5jYWxsYmFjayAmJiB0aGlzLmRhdGEuY2FsbGJhY2sgKCkgIT09IHRydWUgKVxuICAgICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgICBpZiAoIHRoaXMuZGF0YS5jb21tYW5kIClcbiAgICAgICAgICAgICAgIC8vQ29tbWFuZHMuY3VycmVudC5ydW4gKCB0aGlzLmRhdGEuY29tbWFuZCApXG4gICAgICAgICAgICAgICBjb21tYW5kICggdGhpcy5kYXRhLmNvbW1hbmQgKS5ydW4gKClcbiAgICAgfVxuXG4gICAgIHByb3RlY3RlZCBvbkhvdmVyICgpXG4gICAgIHtcblxuICAgICB9XG59XG5cblxuZGVmaW5lICggQnV0dG9uLCBbQ09OVEVYVF9VSSwgXCJidXR0b25cIl0gKVxuIiwiXG5cbmltcG9ydCB7IHNldCB9ICAgICAgZnJvbSBcIi4uLy4uL2RiLmpzXCJcbi8vaW1wb3J0IHsgQ29tbWFuZHMgfSBmcm9tIFwiLi4vLi4vQmFzZS9jb21tYW5kLmpzXCJcbmltcG9ydCB7IHhub2RlIH0gICAgZnJvbSBcIi4uLy4uL0Jhc2UveG5vZGUuanNcIlxuaW1wb3J0IHsgY29tbWFuZCB9IGZyb20gXCIuLi8uLi9jb21tYW5kLmpzXCJcblxuZGVjbGFyZSBnbG9iYWxcbntcbiAgICAgZXhwb3J0IGludGVyZmFjZSAkQnV0dG9uIGV4dGVuZHMgJENvbXBvbmVudFxuICAgICB7XG4gICAgICAgICAgdHlwZSAgICAgICA6IFwiYnV0dG9uXCJcbiAgICAgICAgICBpY29uICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgdGV4dD8gICAgICA6IHN0cmluZ1xuICAgICAgICAgIHRvb2x0aXA/ICAgOiBKU1guRWxlbWVudFxuICAgICAgICAgIGZvbnRGYW1pbHk/OiBzdHJpbmcsXG4gICAgICAgICAgY2FsbGJhY2s/ICA6ICgpID0+IGJvb2xlYW4gfCB2b2lkLFxuICAgICAgICAgIGNvbW1hbmQ/ICAgOiBzdHJpbmcsXG4gICAgICAgICAgaGFuZGxlT24/ICA6IFwidG9nZ2xlXCIgfCBcImRyYWdcIiB8IFwiKlwiXG4gICAgIH1cbn1cblxuY29uc3QgX0J1dHRvbiA9ICggZGF0YTogJEJ1dHRvbiApID0+XG57XG4gICAgIGNvbnN0IG9uVG91Y2ggPSAoKSA9PlxuICAgICB7XG4gICAgICAgICAgaWYgKCBkYXRhLmNhbGxiYWNrICYmIGRhdGEuY2FsbGJhY2sgKCkgIT09IHRydWUgKVxuICAgICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgICBpZiAoIGRhdGEuY29tbWFuZCApXG4gICAgICAgICAgICAgICAvL0NvbW1hbmRzLmN1cnJlbnQucnVuICggZGF0YS5jb21tYW5kIClcbiAgICAgICAgICAgICAgIGNvbW1hbmQgKCBkYXRhLmNvbW1hbmQgKVxuICAgICB9XG5cbiAgICAgY29uc3Qgbm9kZSA9XG4gICAgICAgICAgPGRpdiBjbGFzcz1cImJ1dHRvblwiIG9uQ2xpY2s9eyBkYXRhLmNhbGxiYWNrIHx8IGRhdGEuY29tbWFuZCA/IG9uVG91Y2ggOiBudWxsIH0+XG4gICAgICAgICAgICAgICB7IGRhdGEuaWNvbiA/IDxzcGFuIGNsYXNzPVwiaWNvblwiPnsgZGF0YS5pY29uIH08L3NwYW4+IDogbnVsbCB9XG4gICAgICAgICAgICAgICB7IGRhdGEudGV4dCA/IDxzcGFuIGNsYXNzPVwidGV4dFwiPnsgZGF0YS50ZXh0IH08L3NwYW4+IDogbnVsbCB9XG4gICAgICAgICAgPC9kaXY+XG5cbiAgICAgcmV0dXJuIG5vZGVcbn1cblxuXG5leHBvcnQgeyBCdXR0b24gfSBmcm9tIFwiLi9odG1sLmpzXCJcblxuZXhwb3J0IGNvbnN0ICRkZWZhdWx0ID0ge1xuICAgICB0eXBlOiBcImJ1dHRvblwiIGFzIFwiYnV0dG9uXCIsXG4gICAgIGlkICA6IHVuZGVmaW5lZCxcbiAgICAgaWNvbjogdW5kZWZpbmVkLFxufVxuXG5zZXQgPCRCdXR0b24+ICggWyBcImJ1dHRvblwiIF0sICRkZWZhdWx0IClcbiIsImltcG9ydCB7IENvbXBvbmVudCB9IGZyb20gXCIuLi8uLi9CYXNlL0NvbXBvbmVudC9pbmRleC5qc1wiXG5pbXBvcnQgeyBDb250YWluZXIgfSBmcm9tIFwiLi4vLi4vQmFzZS9Db250YWluZXIvaW5kZXguanNcIlxuaW1wb3J0IHsgc3dpcGVhYmxlLCBTd2lwZWFibGVFbGVtZW50IH0gZnJvbSBcIi4uLy4uL0Jhc2Uvc3dpcGVhYmxlLmpzXCJcbmltcG9ydCB7IGRlZmluZSB9IGZyb20gXCIuLi8uLi9kYi5qc1wiXG5cbmRlY2xhcmUgZ2xvYmFsXG57XG4gICAgIGludGVyZmFjZSAkU2xpZGVzaG93IGV4dGVuZHMgJENvbnRhaW5lclxuICAgICB7XG4gICAgICAgICAgdHlwZSAgICAgICAgOiBcInNsaWRlc2hvd1wiXG4gICAgICAgICAgY2hpbGRyZW4gICAgOiAkQW55Q29tcG9uZW50cyBbXVxuICAgICAgICAgIGlzU3dpcGVhYmxlPzogYm9vbGVhblxuICAgICB9XG5cbiAgICAgaW50ZXJmYWNlICRTbGlkZSBleHRlbmRzICRDb250YWluZXJcbiAgICAge1xuICAgICAgICAgIHR5cGU6IFwic2xpZGVcIlxuICAgICB9XG59XG5cbi8vICAgYGBgXG4vLyAgIC5zbGlkZXNob3dcbi8vICAgICAgICBbLi4uXVxuLy8gICBgYGBcbmV4cG9ydCBjbGFzcyBTbGlkZXNob3cgZXh0ZW5kcyBDb250YWluZXIgPCRTbGlkZXNob3c+XG57XG4gICAgIGNoaWxkcmVuID0ge30gYXMgUmVjb3JkIDxzdHJpbmcsIENvbnRhaW5lcj5cbiAgICAgY3VycmVudDogQ29tcG9uZW50XG4gICAgIHByaXZhdGUgc3dpcGVhYmxlOiBTd2lwZWFibGVFbGVtZW50XG5cbiAgICAgLyoqIEBvdmVycmlkZSAqL1xuICAgICBnZXRIdG1sICgpXG4gICAgIHtcbiAgICAgICAgICBjb25zdCBlbGVtZW50cyA9IHN1cGVyLmdldEh0bWwgKClcblxuICAgICAgICAgIGNvbnN0IGRhdGEgPSB0aGlzLmRhdGFcbiAgICAgICAgICBjb25zdCBjb250YWluZXIgPSB0aGlzLmNvbnRhaW5lclxuXG4gICAgICAgICAgaWYgKCBkYXRhLmlzU3dpcGVhYmxlIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICB0aGlzLnN3aXBlYWJsZSA9IHN3aXBlYWJsZSAoIGNvbnRhaW5lciwge1xuICAgICAgICAgICAgICAgICAgICBoYW5kbGVzICAgOiBbIGNvbnRhaW5lciBdLFxuICAgICAgICAgICAgICAgICAgICBtaW5WYWx1ZSAgOiAtMCxcbiAgICAgICAgICAgICAgICAgICAgbWF4VmFsdWUgIDogMCxcbiAgICAgICAgICAgICAgICAgICAgcG9ycGVydHkgIDogZGF0YS5kaXJlY3Rpb24gPT0gXCJidFwiIHx8IGRhdGEuZGlyZWN0aW9uID09IFwidGJcIiA/IFwidG9wXCI6IFwibGVmdFwiLFxuICAgICAgICAgICAgICAgICAgICB1bml0cyAgICAgOiBcInB4XCIsXG4gICAgICAgICAgICAgICAgICAgIG1vdXNlV2hlZWw6IHRydWUsXG4gICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgdGhpcy5zd2lwZWFibGUuYWN0aXZhdGUgKClcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gZWxlbWVudHNcbiAgICAgfVxuXG4gICAgIHNob3cgKCBpZDogc3RyaW5nLCAuLi4gY29udGVudDogKHN0cmluZyB8IEVsZW1lbnQgfCBDb21wb25lbnQgfCAkQW55Q29tcG9uZW50cyApIFtdIClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IGNoaWxkID0gdGhpcy5jaGlsZHJlbiBbaWRdXG5cbiAgICAgICAgICBpZiAoIGNoaWxkID09IHVuZGVmaW5lZCApXG4gICAgICAgICAgICAgICByZXR1cm5cblxuICAgICAgICAgIGlmICggdGhpcy5jdXJyZW50IClcbiAgICAgICAgICAgICAgIHRoaXMuY3VycmVudCA9IGNoaWxkXG5cbiAgICAgICAgICBpZiAoIGNvbnRlbnQgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNoaWxkLmNsZWFyICgpXG4gICAgICAgICAgICAgICBjb25zb2xlLmxvZyAoIGNvbnRlbnQgKVxuICAgICAgICAgICAgICAgY2hpbGQuYXBwZW5kICggLi4uIGNvbnRlbnQgKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGNoaWxkLmNvbnRhaW5lci5zdHlsZS5kaXNwbGF5ID0gXCJibG9ja1wiXG4gICAgIH1cbn1cblxuZGVmaW5lICggU2xpZGVzaG93LCBbQ09OVEVYVF9VSSwgXCJzbGlkZXNob3dcIl0gKVxuZGVmaW5lICggQ29udGFpbmVyLCBbQ09OVEVYVF9VSSwgXCJzbGlkZVwiXSAgICAgKVxuIiwiXG5pbXBvcnQgeyB4bm9kZSB9IGZyb20gXCIuLi8uLi9CYXNlL3hub2RlLmpzXCJcbmltcG9ydCB7IENvbnRhaW5lciB9IGZyb20gXCIuLi8uLi9CYXNlL0NvbnRhaW5lci9pbmRleC5qc1wiXG5pbXBvcnQgeyBFeHBlbmRhYmxlRWxlbWVudCwgZXhwYW5kYWJsZSB9IGZyb20gXCIuLi8uLi9CYXNlL2V4cGVuZGFibGUuanNcIlxuaW1wb3J0IHsgY3NzRmxvYXQgfSBmcm9tIFwiLi4vLi4vQmFzZS9kb20uanNcIlxuaW1wb3J0IHsgQ29tcG9uZW50IH0gZnJvbSBcIi4uLy4uL0Jhc2UvQ29tcG9uZW50L2luZGV4LmpzXCJcblxuaW1wb3J0IHsgZGVmaW5lIH0gZnJvbSBcIi4uLy4uL2RiLmpzXCJcblxuaW50ZXJmYWNlICRMaXN0VmlldyBleHRlbmRzICRDb250YWluZXJcbntcbiAgICAgdHlwZTogXCJsaXN0LXZpZXdcIlxufVxuXG5kZWNsYXJlIGdsb2JhbFxue1xuICAgICBpbnRlcmZhY2UgJFRvb2xiYXIgZXh0ZW5kcyAkRXh0ZW5kcyA8JExpc3RWaWV3PiAvLyAkQ29udGFpbmVyXG4gICAgIHtcbiAgICAgICAgICB0eXBlICAgICA6IFwidG9vbGJhclwiXG4gICAgICAgICAgdGl0bGUgICAgOiBzdHJpbmdcbiAgICAgICAgICBidXR0b25zICA6ICRCdXR0b24gW11cbiAgICAgfVxuXG59XG5cbmNsYXNzIExpc3RWaWV3IDwkIGV4dGVuZHMgJEV4dGVuZHMgPCRMaXN0Vmlldz4+IGV4dGVuZHMgQ29udGFpbmVyIDwkPlxue1xuICAgICBzd2lwZWFibGU6IEV4cGVuZGFibGVFbGVtZW50XG5cbiAgICAgLyoqIEBvdmVycmlkZSAqL1xuICAgICBnZXRIdG1sICgpXG4gICAgIHtcbiAgICAgICAgICBpZiAoIHRoaXMuY29udGFpbmVyICE9IHVuZGVmaW5lZCApXG4gICAgICAgICAgICAgICByZXR1cm4gW3RoaXMuY29udGFpbmVyXVxuXG4gICAgICAgICAgY29uc3Qgc2xvdCA9IHRoaXMuc2xvdCA9IDxkaXYgY2xhc3M9XCJsaXN0LXZpZXctc2xpZGVcIj48L2Rpdj5cblxuICAgICAgICAgIHN1cGVyLmdldEh0bWwgKClcblxuICAgICAgICAgIGNvbnN0IGNvbnRhaW5lciA9IHRoaXMuY29udGFpbmVyXG5cbiAgICAgICAgICBjb250YWluZXIuYXBwZW5kICggc2xvdCApXG4gICAgICAgICAgY29udGFpbmVyLmNsYXNzTGlzdC5hZGQgKCBcImxpc3Qtdmlld1wiIClcblxuICAgICAgICAgIHRoaXMuc3dpcGVhYmxlID0gZXhwYW5kYWJsZSAoIHNsb3QsIHtcbiAgICAgICAgICAgICAgIGhhbmRsZXMgICA6IFsgY29udGFpbmVyIF0sXG4gICAgICAgICAgICAgICBtaW5TaXplICA6IDAsXG4gICAgICAgICAgICAgICBtYXhTaXplICA6IDAsXG4gICAgICAgICAgICAgICBwcm9wZXJ0eSAgOiB0aGlzLmlzX3ZlcnRpY2FsID8gXCJ0b3BcIjogXCJsZWZ0XCIsXG4gICAgICAgICAgICAgICBkaXJlY3Rpb24gOiB0aGlzLmRhdGEuZGlyZWN0aW9uLFxuICAgICAgICAgICAgICAgdW5pdCAgICAgOiBcInB4XCIsXG4gICAgICAgICAgICAgICAvL21vdXNlV2hlZWw6IHRydWUsXG4gICAgICAgICAgfSlcbiAgICAgICAgICB0aGlzLnN3aXBlYWJsZS5hY3RpdmF0ZSAoKVxuXG4gICAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIgKCBcIkRPTUNvbnRlbnRMb2FkZWRcIiwgKCkgPT5cbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICB0aGlzLnN3aXBlYWJsZS51cGRhdGVDb25maWcgKHtcbiAgICAgICAgICAgICAgICAgICAgbWluU2l6ZTogLXRoaXMuc2xpZGVTaXplICgpLFxuICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICB9KVxuXG4gICAgICAgICAgcmV0dXJuIFt0aGlzLmNvbnRhaW5lcl1cbiAgICAgfVxuXG4gICAgIG9uQ2hpbGRyZW5BZGRlZCAoIGVsZW1lbnRzOiBDb21wb25lbnQgW10gKVxuICAgICB7XG4gICAgICAgICAgdGhpcy5zd2lwZWFibGUudXBkYXRlQ29uZmlnICh7XG4gICAgICAgICAgICAgICBtaW5TaXplICA6IC10aGlzLnNsaWRlU2l6ZSAoKSxcbiAgICAgICAgICAgICAgIHByb3BlcnR5IDogdGhpcy5pc192ZXJ0aWNhbCA/IFwidG9wXCI6IFwibGVmdFwiLFxuICAgICAgICAgICAgICAgZGlyZWN0aW9uOiB0aGlzLmRhdGEuZGlyZWN0aW9uLFxuICAgICAgICAgIH0pXG4gICAgIH1cblxuICAgICBwcml2YXRlIHNsaWRlU2l6ZSAoKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgeyBzbG90IH0gPSB0aGlzXG5cbiAgICAgICAgICByZXR1cm4gY3NzRmxvYXQgKCBzbG90LCB0aGlzLmlzX3ZlcnRpY2FsID8gXCJoZWlnaHRcIiA6IFwid2lkdGhcIiApXG4gICAgIH1cblxuICAgICBzd2lwZSAoIG9mZnNldDogc3RyaW5nfG51bWJlciwgdW5pdD86IFwicHhcIiB8IFwiJVwiIClcbiAgICAge1xuICAgICAgICAgLy8gaWYgKCB0eXBlb2Ygb2Zmc2V0ID09IFwic3RyaW5nXCIgKVxuICAgICAgICAgLy8gICAgICB0aGlzLnN3aXBlYWJsZS5zd2lwZSAoIG9mZnNldCApXG4gICAgICAgICAvLyBlbHNlXG4gICAgICAgICAvLyAgICAgIHRoaXMuc3dpcGVhYmxlLnN3aXBlICggb2Zmc2V0LCB1bml0IClcbiAgICAgfVxufVxuXG4vKipcbiAqICAgYGBgcHVnXG4gKiAgIC50b29sYmFyXG4gKiAgICAgICAgLnRvb2xiYXItYmFja2dyb3VuZ1xuICogICAgICAgIC50b29sYmFyLXNsaWRlXG4gKiAgICAgICAgICAgICBbLi4uXVxuICogICBgYGBcbiAqL1xuZXhwb3J0IGNsYXNzIFRvb2xiYXIgZXh0ZW5kcyBMaXN0VmlldyA8JFRvb2xiYXI+XG57XG4gICAgIHRhYnMgICAgICA6IEpTWC5FbGVtZW50IFtdXG4gICAgIGJhY2tncm91bmQ6IEpTWC5FbGVtZW50XG5cbiAgICAgZGVmYXVsdENvbmZpZyAoKTogJFRvb2xiYXJcbiAgICAge1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAuLi4gc3VwZXIuZGVmYXVsdERhdGEgKCksXG4gICAgICAgICAgICAgICB0eXBlICAgICA6IFwidG9vbGJhclwiLFxuICAgICAgICAgICAgICAgdGl0bGUgICAgOiBcIlRpdGxlIC4uLlwiLFxuICAgICAgICAgICAgICAgZGlyZWN0aW9uOiBcImxyXCIsXG4gICAgICAgICAgICAgICAvL3JldmVyc2UgIDogZmFsc2UsXG4gICAgICAgICAgICAgICBidXR0b25zOiBbXVxuICAgICAgICAgIH1cbiAgICAgfVxuXG4gICAgIC8qKiBAb3ZlcnJpZGUgKi9cbiAgICAgZ2V0SHRtbCAoKVxuICAgICB7XG4gICAgICAgICAgaWYgKCB0aGlzLmNvbnRhaW5lciAhPSB1bmRlZmluZWQgKVxuICAgICAgICAgICAgICAgcmV0dXJuIFt0aGlzLmNvbnRhaW5lcl1cblxuICAgICAgICAgIHN1cGVyLmdldEh0bWwgKClcblxuICAgICAgICAgIGlmICggdGhpcy5kYXRhLmJ1dHRvbnMgKVxuICAgICAgICAgICAgICAgdGhpcy5hcHBlbmQgKCAuLi4gdGhpcy5kYXRhLmJ1dHRvbnMgKVxuXG4gICAgICAgICAgcmV0dXJuIFt0aGlzLmNvbnRhaW5lcl1cbiAgICAgfVxufVxuXG5kZWZpbmUgKCBUb29sYmFyLCBbQ09OVEVYVF9VSSwgXCJ0b29sYmFyXCJdIClcblxuXG4vLyB0eXBlIERpcmVjdGlvbiA9IFwibHJcIiB8IFwicmxcIiB8IFwidGJcIiB8IFwiYnRcIlxuLy9cbi8vIHR5cGUgVW5pdHMgPSBcInB4XCIgfCBcIiVcIlxuLy9cbi8vIGNvbnN0IHRvRmxleERpcmVjdGlvbiA9IHtcbi8vICAgICAgbHI6IFwicm93XCIgICAgICAgICAgICBhcyBcInJvd1wiLFxuLy8gICAgICBybDogXCJyb3ctcmV2ZXJzZVwiICAgIGFzIFwicm93LXJldmVyc2VcIixcbi8vICAgICAgdGI6IFwiY29sdW1uXCIgICAgICAgICBhcyBcImNvbHVtblwiLFxuLy8gICAgICBidDogXCJjb2x1bW4tcmV2ZXJzZVwiIGFzIFwiY29sdW1uLXJldmVyc2VcIixcbi8vIH1cbi8vXG4vLyBjb25zdCB0b1JldmVyc2UgPSB7XG4vLyAgICAgIGxyOiBcInJsXCIgYXMgXCJybFwiLFxuLy8gICAgICBybDogXCJsclwiIGFzIFwibHJcIixcbi8vICAgICAgdGI6IFwiYnRcIiBhcyBcImJ0XCIsXG4vLyAgICAgIGJ0OiBcInRiXCIgYXMgXCJ0YlwiLFxuLy8gfVxuIiwiXG5pbXBvcnQgeyBkcmFnZ2FibGUsIERyYWdFdmVudCB9IGZyb20gXCIuL2RyYWdnYWJsZS5qc1wiXG5cbnR5cGUgRGlyZWN0aW9uID0gXCJsclwiIHwgXCJybFwiIHwgXCJidFwiIHwgXCJ0YlwiXG50eXBlIERPTUVsZW1lbnQgPSBIVE1MRWxlbWVudCB8IFNWR0VsZW1lbnRcblxuZXhwb3J0IGludGVyZmFjZSBTY29sbGFibGVDb25maWdcbntcbiAgICAgaGFuZGxlczogRE9NRWxlbWVudCBbXVxuICAgICBkaXJlY3Rpb246IERpcmVjdGlvblxufVxuXG5mdW5jdGlvbiBkZWZhdWx0Q29uZmlnICgpOiBTY29sbGFibGVDb25maWdcbntcbiAgICAgcmV0dXJuIHtcbiAgICAgICAgICBoYW5kbGVzICA6IFtdLFxuICAgICAgICAgIGRpcmVjdGlvbjogXCJ0YlwiXG4gICAgIH1cbn1cblxuZnVuY3Rpb24gc2Nyb2xsYWJsZU5hdGl2ZSAoIG9wdGlvbnM6IFNjb2xsYWJsZUNvbmZpZyApXG57XG4gICAgIGRlc2FjdGl2YXRlICgpXG5cbiAgICAgcmV0dXJuIHtcbiAgICAgICAgICBhY3RpdmF0ZSxcbiAgICAgICAgICBkZXNhY3RpdmF0ZSxcbiAgICAgfVxuXG4gICAgIGZ1bmN0aW9uIGFjdGl2YXRlICgpXG4gICAgIHtcbiAgICAgICAgICBjb25zdCBkaXIgPSBvcHRpb25zLmRpcmVjdGlvbiA9PSBcImJ0XCIgfHwgb3B0aW9ucy5kaXJlY3Rpb24gPT0gXCJ0YlwiXG4gICAgICAgICAgICAgICAgICAgID8gXCJwYW4teVwiIDogXCJwYW4teFwiXG5cbiAgICAgICAgICBmb3IgKCBjb25zdCBoIG9mIG9wdGlvbnMuaGFuZGxlcyApXG4gICAgICAgICAgICAgICBoLnN0eWxlLnRvdWNoQWN0aW9uID0gZGlyXG4gICAgIH1cblxuICAgICBmdW5jdGlvbiBkZXNhY3RpdmF0ZSAoKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgZGlyID0gb3B0aW9ucy5kaXJlY3Rpb24gPT0gXCJidFwiIHx8IG9wdGlvbnMuZGlyZWN0aW9uID09IFwidGJcIlxuICAgICAgICAgICAgICAgICAgICA/IFwicGFuLXlcIiA6IFwicGFuLXhcIlxuXG4gICAgICAgICAgZm9yICggY29uc3QgaCBvZiBvcHRpb25zLmhhbmRsZXMgKVxuICAgICAgICAgICAgICAgaC5zdHlsZS50b3VjaEFjdGlvbiA9IFwibm9uZVwiXG4gICAgIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNjb2xsYWJsZSAoIG9wdGlvbnM6IFNjb2xsYWJsZUNvbmZpZyApXG57XG4gICAgIGlmICggXCJvbnRvdWNoc3RhcnRcIiBpbiB3aW5kb3cgKVxuICAgICAgICAgIHJldHVybiBzY3JvbGxhYmxlTmF0aXZlICggb3B0aW9ucyApXG5cbiAgICAgY29uc3QgZHJhZyA9IGRyYWdnYWJsZSAoe1xuICAgICAgICAgIGhhbmRsZXMgICAgICAgOiBvcHRpb25zLmhhbmRsZXMsXG4gICAgICAgICAgdmVsb2NpdHlGYWN0b3I6IDEwMCxcbiAgICAgICAgICBvblN0YXJ0RHJhZyxcbiAgICAgICAgICBvbkRyYWcgICAgIDogb3B0aW9ucy5kaXJlY3Rpb24gPT0gXCJidFwiIHx8IG9wdGlvbnMuZGlyZWN0aW9uID09IFwidGJcIlxuICAgICAgICAgICAgICAgICAgICAgPyBvbkRyYWdWZXJ0aWNhbFxuICAgICAgICAgICAgICAgICAgICAgOiBvbkRyYWdIb3Jpem9udGFsLFxuICAgICAgICAgIG9uU3RvcERyYWc6IG9wdGlvbnMuZGlyZWN0aW9uID09IFwiYnRcIiB8fCBvcHRpb25zLmRpcmVjdGlvbiA9PSBcInRiXCJcbiAgICAgICAgICAgICAgICAgICAgPyBvblN0b3BEcmFnVmVydGljYWxcbiAgICAgICAgICAgICAgICAgICAgOiBvblN0b3BEcmFnSG9yaXpvbnRhbCxcbiAgICAgfSlcblxuICAgICByZXR1cm4ge1xuICAgICAgICAgIGFjdGl2YXRlOiAoKSA9PiB7IGRyYWcuYWN0aXZhdGUgKCkgfVxuICAgICB9XG5cbiAgICAgZnVuY3Rpb24gb25TdGFydERyYWcgKClcbiAgICAge1xuICAgICAgICAgIGZvciAoIGNvbnN0IGggb2Ygb3B0aW9ucy5oYW5kbGVzIClcbiAgICAgICAgICAgICAgIGguc3R5bGUuc2Nyb2xsQmVoYXZpb3IgPSBcInVuc2V0XCJcbiAgICAgfVxuICAgICBmdW5jdGlvbiBvbkRyYWdWZXJ0aWNhbCAoIGV2ZW50OiBEcmFnRXZlbnQgKVxuICAgICB7XG4gICAgICAgICAgZm9yICggY29uc3QgaCBvZiBvcHRpb25zLmhhbmRsZXMgKVxuICAgICAgICAgICAgICAgaC5zY3JvbGxCeSAoIDAsIGV2ZW50Lm9mZnNldFkgKVxuICAgICB9XG4gICAgIGZ1bmN0aW9uIG9uRHJhZ0hvcml6b250YWwgKCBldmVudDogRHJhZ0V2ZW50IClcbiAgICAge1xuICAgICAgICAgIGZvciAoIGNvbnN0IGggb2Ygb3B0aW9ucy5oYW5kbGVzIClcbiAgICAgICAgICAgICAgIGguc2Nyb2xsQnkgKCBldmVudC5vZmZzZXRYLCAwIClcbiAgICAgfVxuICAgICBmdW5jdGlvbiBvblN0b3BEcmFnVmVydGljYWwgKCBldmVudDogRHJhZ0V2ZW50IClcbiAgICAge1xuICAgICAgICAgIGZvciAoIGNvbnN0IGggb2Ygb3B0aW9ucy5oYW5kbGVzIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBoLnNjcm9sbEJ5ICggMCwgZXZlbnQub2Zmc2V0WSApXG4gICAgICAgICAgICAgICAvL2guc3R5bGUuc2Nyb2xsQmVoYXZpb3IgPSBcInNtb290aFwiXG4gICAgICAgICAgICAgICAvL2guc2Nyb2xsQnkgKCAwLCBldmVudC5vZmZzZXRZICsgZXZlbnQudmVsb2NpdHlZIClcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgfVxuICAgICBmdW5jdGlvbiBvblN0b3BEcmFnSG9yaXpvbnRhbCAoIGV2ZW50OiBEcmFnRXZlbnQgKVxuICAgICB7XG4gICAgICAgICAgZm9yICggY29uc3QgaCBvZiBvcHRpb25zLmhhbmRsZXMgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGguc2Nyb2xsQnkgKCBldmVudC5vZmZzZXRYLCAwIClcbiAgICAgICAgICAgICAgIC8vaC5zdHlsZS5zY3JvbGxCZWhhdmlvciA9IFwic21vb3RoXCJcbiAgICAgICAgICAgICAgIC8vaC5zY3JvbGxCeSAoIGV2ZW50Lm9mZnNldFggKyBldmVudC52ZWxvY2l0eVgsIDAgKVxuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICB9XG59XG4iLCJcbmltcG9ydCB7IHhub2RlIH0gZnJvbSBcIi4uLy4uL0Jhc2UveG5vZGUuanNcIlxuaW1wb3J0IHsgQ29udGFpbmVyIH0gZnJvbSBcIi4uLy4uL0Jhc2UvQ29udGFpbmVyL2luZGV4LmpzXCJcbmltcG9ydCB7IENvbXBvbmVudCB9IGZyb20gXCIuLi8uLi9CYXNlL0NvbXBvbmVudC9pbmRleC5qc1wiXG5pbXBvcnQgeyBleHBhbmRhYmxlLCBFeHBlbmRhYmxlRWxlbWVudCB9IGZyb20gXCIuLi8uLi9CYXNlL2V4cGVuZGFibGUuanNcIlxuaW1wb3J0IHsgcGljaywgZGVmaW5lLCBpblN0b2NrLCBtYWtlIH0gZnJvbSBcIi4uLy4uL2RiLmpzXCJcbmltcG9ydCB7IHNjb2xsYWJsZSB9IGZyb20gXCIuLi8uLi9CYXNlL3Njcm9sbGFibGUuanNcIlxuXG5kZWNsYXJlIGdsb2JhbFxue1xuICAgICBpbnRlcmZhY2UgJFNpZGVNZW51IGV4dGVuZHMgJENvbnRhaW5lclxuICAgICB7XG4gICAgICAgICAgdHlwZTogXCJzaWRlLW1lbnVcIlxuICAgICAgICAgIGhhc01haW5CdXR0b246IGJvb2xlYW4sXG4gICAgICAgICAgaGVhZGVyPyAgICAgIDogJEFueUNvbXBvbmVudHMsXG4gICAgICAgICAgY2hpbGRyZW4/ICAgIDogJEFueUNvbXBvbmVudHMgW10sXG4gICAgICAgICAgZm9vdGVyPyAgICAgIDogJEFueUNvbXBvbmVudHMsXG4gICAgIH1cbn1cblxudHlwZSBEaXJlY3Rpb24gPSBcImxyXCIgfCBcInJsXCIgfCBcInRiXCIgfCBcImJ0XCJcblxuY29uc3QgdG9Qb3NpdGlvbiA9IHtcbiAgICAgbHIgOiBcImxlZnRcIixcbiAgICAgcmwgOiBcInJpZ2h0XCIsXG4gICAgIHRiIDogXCJ0b3BcIixcbiAgICAgYnQgOiBcImJvdHRvbVwiLFxufVxuXG52YXIgbGVmdF9tZW51ICAgPSBudWxsIGFzIFNpZGVNZW51XG52YXIgcmlnaHRfbWVudSAgPSBudWxsIGFzIFNpZGVNZW51XG52YXIgdG9wX21lbnUgICAgPSBudWxsIGFzIFNpZGVNZW51XG52YXIgYm90dG9tX21lbnUgPSBudWxsIGFzIFNpZGVNZW51XG5cbmV4cG9ydCBjbGFzcyBTaWRlTWVudSBleHRlbmRzIENvbnRhaW5lciA8JFNpZGVNZW51Plxue1xuICAgICBzdGF0aWMgYXRMZWZ0OiBTaWRlTWVudVxuICAgICBzdGF0aWMgYXRSaWdodDogU2lkZU1lbnVcbiAgICAgc3RhdGljIGF0VG9wOiBTaWRlTWVudVxuICAgICBzdGF0aWMgYXRCb3R0b206IFNpZGVNZW51XG5cbiAgICAgbWFpbl9idXR0b246IEpTWC5FbGVtZW50XG4gICAgIGV4cGFuZGFibGU6IEV4cGVuZGFibGVFbGVtZW50XG4gICAgIGNvbnRlbnQgICAgOiBDb21wb25lbnRcbiAgICAgaGVhZGVyICAgICA6IENvbXBvbmVudFxuXG4gICAgIC8qKiBAb3ZlcnJpZGUgKi9cbiAgICAgZ2V0SHRtbCAoKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgZGF0YSA9IHRoaXMuZGF0YVxuICAgICAgICAgIGNvbnN0IGhlYWRlciAgICA9IDxkaXYgY2xhc3M9XCJzaWRlLW1lbnUtaGVhZGVyXCIgLz5cbiAgICAgICAgICBjb25zdCBjb250ZW50ICAgPSA8ZGl2IGNsYXNzPVwic2lkZS1tZW51LWNvbnRlbnRcIiAvPlxuICAgICAgICAgIGNvbnN0IGNvbnRhaW5lciA9IDxkaXYgY2xhc3M9XCJzaWRlLW1lbnUgY2xvc2VcIj5cbiAgICAgICAgICAgICAgIHsgaGVhZGVyIH1cbiAgICAgICAgICAgICAgIHsgY29udGVudCB9XG4gICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICBpZiAoIGRhdGEuaGVhZGVyIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICB0aGlzLmhlYWRlciA9IGluU3RvY2sgKCBkYXRhLmhlYWRlciApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICA/IHBpY2sgKCBkYXRhLmhlYWRlciApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICA6IG1ha2UgKCBkYXRhLmhlYWRlciApXG5cbiAgICAgICAgICAgICAgIGhlYWRlci5hcHBlbmQgKCAuLi4gdGhpcy5oZWFkZXIuZ2V0SHRtbCAoKSApXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKCBkYXRhLmhhc01haW5CdXR0b24gKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNvbnN0IGJ0biA9IDxzcGFuIGNsYXNzPVwic2lkZS1tZW51LW1haW4tYnV0dG9uXCI+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwiaWNvblwiPuKHlTwvc3Bhbj5cbiAgICAgICAgICAgICAgIDwvc3Bhbj5cblxuICAgICAgICAgICAgICAgdGhpcy5tYWluX2J1dHRvbiA9IGJ0blxuICAgICAgICAgICAgICAgaGVhZGVyLmluc2VydEFkamFjZW50RWxlbWVudCAoIFwiYWZ0ZXJiZWdpblwiLCBidG4gKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICggZGF0YS5jaGlsZHJlbiApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgZm9yICggY29uc3QgY2hpbGQgb2YgZGF0YS5jaGlsZHJlbiApXG4gICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY29udGVudCA9IGluU3RvY2sgKCBjaGlsZCApID8gcGljayAoIGNoaWxkICkgOiBtYWtlICggY2hpbGQgKVxuXG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnQuYXBwZW5kICggLi4uIHRoaXMuY29udGVudC5nZXRIdG1sICgpIClcbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjb250YWluZXIuY2xhc3NMaXN0LmFkZCAoIHRvUG9zaXRpb24gW2RhdGEuZGlyZWN0aW9uXSApXG4gICAgICAgICAgc2NvbGxhYmxlICh7IGhhbmRsZXM6IFtjb250ZW50XSwgZGlyZWN0aW9uOiBcImJ0XCIgfSkuYWN0aXZhdGUgKClcblxuICAgICAgICAgIHRoaXMuY29udGFpbmVyICA9IGNvbnRhaW5lclxuICAgICAgICAgIHRoaXMuZXhwYW5kYWJsZSA9IGV4cGFuZGFibGUgKCB0aGlzLmNvbnRhaW5lciwge1xuICAgICAgICAgICAgICAgZGlyZWN0aW9uICAgIDogZGF0YS5kaXJlY3Rpb24sXG4gICAgICAgICAgICAgICBuZWFyICAgICAgICAgOiA2MCxcbiAgICAgICAgICAgICAgIGhhbmRsZXMgICAgICA6IEFycmF5Lm9mICggdGhpcy5tYWluX2J1dHRvbiApLFxuICAgICAgICAgICAgICAgb25BZnRlck9wZW4gIDogKCkgPT4gY29udGVudC5jbGFzc0xpc3QucmVtb3ZlICggXCJoaWRkZW5cIiApLFxuICAgICAgICAgICAgICAgb25CZWZvcmVDbG9zZTogKCkgPT4gY29udGVudC5jbGFzc0xpc3QuYWRkICggXCJoaWRkZW5cIiApXG4gICAgICAgICAgfSlcbiAgICAgICAgICB0aGlzLmV4cGFuZGFibGUuYWN0aXZhdGUgKClcblxuICAgICAgICAgIHJldHVybiBbIHRoaXMuY29udGFpbmVyIF0gYXMgSFRNTEVsZW1lbnQgW11cbiAgICAgfVxuXG4gICAgIGlzT3BlbiAoKVxuICAgICB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuZXhwYW5kYWJsZS5pc09wZW4gKClcbiAgICAgfVxuXG4gICAgIGlzQ2xvc2UgKClcbiAgICAge1xuICAgICAgICAgIHJldHVybiB0aGlzLmV4cGFuZGFibGUuaXNDbG9zZSAoKVxuICAgICB9XG5cbiAgICAgb3BlbiAoKVxuICAgICB7XG5cbiAgICAgfVxuXG4gICAgIGNsb3NlICgpXG4gICAgIHtcbiAgICAgICAgICB0aGlzLmV4cGFuZGFibGUuY2xvc2UgKClcblxuICAgICAgICAgIHJldHVybiB0aGlzXG4gICAgIH1cbn1cblxuZGVmaW5lICggU2lkZU1lbnUsIFtDT05URVhUX1VJLCBcInNpZGUtbWVudVwiXSApXG4iLCJcbmltcG9ydCB7IHhub2RlIH0gZnJvbSBcIi4uL3hub2RlLmpzXCJcblxuZXhwb3J0IHR5cGUgU2hhcGVOYW1lcyA9IGtleW9mIFNoYXBlRGVmaW5pdGlvbnNcblxuZXhwb3J0IGludGVyZmFjZSBTaGFwZURlZmluaXRpb25zXG57XG4gICAgIGNpcmNsZSAgIDogT2JqZWN0RGVmaW5pdGlvbixcbiAgICAgdHJpYW5nbGUgOiBPYmplY3REZWZpbml0aW9uLFxuICAgICBzcXVhcmUgICA6IE9iamVjdERlZmluaXRpb24sXG4gICAgIHBhbnRhZ29uIDogT2JqZWN0RGVmaW5pdGlvbixcbiAgICAgaGV4YWdvbiAgOiBPYmplY3REZWZpbml0aW9uLFxuICAgICB0ZXh0ICAgICA6IFRleHREZWZpbml0aW9uLFxuICAgICB0ZXh0Ym94ICA6IFRleHREZWZpbml0aW9uLFxuICAgICBwYXRoICAgICA6IFBhdGhEZWZpbml0aW9uLFxufVxuXG5leHBvcnQgaW50ZXJmYWNlIE9iamVjdERlZmluaXRpb25cbntcbiAgICAgc2l6ZTogbnVtYmVyLFxuICAgICB4PyAgOiBudW1iZXIsXG4gICAgIHk/ICA6IG51bWJlclxufVxuXG5leHBvcnQgaW50ZXJmYWNlIFRleHREZWZpbml0aW9uIGV4dGVuZHMgT2JqZWN0RGVmaW5pdGlvblxue1xuICAgICB0ZXh0OiBzdHJpbmdcbn1cblxuZXhwb3J0IGludGVyZmFjZSBQYXRoRGVmaW5pdGlvbiBleHRlbmRzIE9iamVjdERlZmluaXRpb25cbntcbiAgICAgcGF0aDogc3RyaW5nXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVTdmdTaGFwZSA8VCBleHRlbmRzIFNoYXBlTmFtZXM+IChcbiAgICAgdHlwZTogVCxcbiAgICAgZGVmIDogU2hhcGVEZWZpbml0aW9ucyBbVF0sXG4pOiBSZXR1cm5UeXBlIDx0eXBlb2YgU3ZnRmFjdG9yeSBbVF0+XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVTdmdTaGFwZSAoIHR5cGU6IFNoYXBlTmFtZXMsIGRlZjogYW55IClcbntcbiAgICAgc3dpdGNoICggdHlwZSApXG4gICAgIHtcbiAgICAgY2FzZSBcImNpcmNsZVwiICA6IHJldHVybiBTdmdGYWN0b3J5LmNpcmNsZSAgICggZGVmIClcbiAgICAgY2FzZSBcInRyaWFuZ2xlXCI6IHJldHVybiBTdmdGYWN0b3J5LnRyaWFuZ2xlICggZGVmIClcbiAgICAgY2FzZSBcInNxdWFyZVwiICA6IHJldHVybiBTdmdGYWN0b3J5LnNxdWFyZSAgICggZGVmIClcbiAgICAgY2FzZSBcInBhbnRhZ29uXCI6IHJldHVybiBTdmdGYWN0b3J5LnBhbnRhZ29uICggZGVmIClcbiAgICAgY2FzZSBcImhleGFnb25cIiA6IHJldHVybiBTdmdGYWN0b3J5LmhleGFnb24gICggZGVmIClcbiAgICAgY2FzZSBcInNxdWFyZVwiICA6IHJldHVybiBTdmdGYWN0b3J5LnNxdWFyZSAgICggZGVmIClcbiAgICAgY2FzZSBcInRleHRcIiAgICA6IHJldHVybiBTdmdGYWN0b3J5LnRleHQgICAgICggZGVmIClcbiAgICAgY2FzZSBcInRleHRib3hcIiA6IHJldHVybiBTdmdGYWN0b3J5LnRleHRib3ggICggZGVmIClcbiAgICAgY2FzZSBcInBhdGhcIiAgICA6IHJldHVybiBTdmdGYWN0b3J5LnBhdGggICAgICggZGVmIClcbiAgICAgfVxufVxuXG5jbGFzcyBTdmdGYWN0b3J5XG57XG4gICAgIC8vIFRvIGdldCB0cmlhbmdsZSwgc3F1YXJlLCBbcGFudGF8aGV4YV1nb24gcG9pbnRzXG4gICAgIC8vXG4gICAgIC8vIHZhciBhID0gTWF0aC5QSSoyLzRcbiAgICAgLy8gZm9yICggdmFyIGkgPSAwIDsgaSAhPSA0IDsgaSsrIClcbiAgICAgLy8gICAgIGNvbnNvbGUubG9nICggYFsgJHsgTWF0aC5zaW4oYSppKSB9LCAkeyBNYXRoLmNvcyhhKmkpIH0gXWAgKVxuXG4gICAgIHN0YXRpYyBjaXJjbGUgKCBkZWY6IE9iamVjdERlZmluaXRpb24gKVxuICAgICB7XG4gICAgICAgICAgY29uc3Qgbm9kZSA9IDxjaXJjbGVcbiAgICAgICAgICAgICAgIGN4ID0geyBkZWYueCB8fCAwIH1cbiAgICAgICAgICAgICAgIGN5ID0geyBkZWYueSB8fCAwIH1cbiAgICAgICAgICAgICAgIHIgID0geyBkZWYuc2l6ZSAvIDIgfVxuICAgICAgICAgIC8+XG5cbiAgICAgICAgICByZXR1cm4gbm9kZVxuICAgICB9XG5cbiAgICAgc3RhdGljIHRyaWFuZ2xlICggZGVmOiBPYmplY3REZWZpbml0aW9uIClcbiAgICAge1xuICAgICB9XG5cblxuICAgICBzdGF0aWMgc3F1YXJlICggZGVmOiBPYmplY3REZWZpbml0aW9uIClcbiAgICAge1xuICAgICB9XG5cbiAgICAgc3RhdGljIHBhbnRhZ29uICggZGVmOiBPYmplY3REZWZpbml0aW9uIClcbiAgICAge1xuICAgICB9XG5cbiAgICAgc3RhdGljIGhleGFnb24gKCBkZWY6IE9iamVjdERlZmluaXRpb24gKVxuICAgICB7XG4gICAgIH1cblxuXG4gICAgIHN0YXRpYyB0ZXh0ICggZGVmOiBUZXh0RGVmaW5pdGlvbiApXG4gICAgIHtcbiAgICAgfVxuXG4gICAgIHN0YXRpYyB0ZXh0Ym94ICggZGVmOiBUZXh0RGVmaW5pdGlvbiApXG4gICAgIHtcbiAgICAgfVxuXG5cbiAgICAgc3RhdGljIHBhdGggKCBkZWY6IFBhdGhEZWZpbml0aW9uIClcbiAgICAge1xuICAgICB9XG59XG4iLCJpbXBvcnQgeyBHZW9tZXRyeSB9IGZyb20gXCIuLi8uLi8uLi9MaWIvaW5kZXguanNcIlxuaW1wb3J0IHsgQ29tcG9uZW50IH0gZnJvbSBcIi4uLy4uL0Jhc2UvQ29tcG9uZW50L2luZGV4LmpzXCJcbmltcG9ydCAqIGFzIFN2ZyBmcm9tIFwiLi4vLi4vQmFzZS9TdmcvaW5kZXguanNcIlxuaW1wb3J0IHsgeG5vZGUgfSBmcm9tIFwiLi4vLi4vQmFzZS94bm9kZS5qc1wiXG5cbmNvbnN0IEcgPSBHZW9tZXRyeVxuXG50eXBlIFJlbmRlcmVyID0gKCBkZWZpbml0aW9uOiBSYWRpYWxEZWZpbml0aW9uICkgPT4gU1ZHRWxlbWVudCBbXVxudHlwZSBSYWRpYWxEZWZpbml0aW9uID0gR2VvbWV0cnkuUmFkaWFsRGVmaW5pdGlvblxudHlwZSBSYWRpYWxPcHRpb24gICAgID0gR2VvbWV0cnkuUmFkaWFsT3B0aW9uXG5cbmRlY2xhcmUgZ2xvYmFsXG57XG4gICAgIGludGVyZmFjZSAkUmFkaWFsTWVudSBleHRlbmRzICRDb21wb25lbnRcbiAgICAge1xuICAgICAgICAgIHR5cGU6IFwicmFkaWFsLW1lbnVcIixcbiAgICAgICAgICBidXR0b25zOiBQYXJ0aWFsIDwkQnV0dG9uPiBbXSxcbiAgICAgICAgICByb3RhdGlvbjogbnVtYmVyXG4gICAgIH1cbn1cblxuXG5leHBvcnQgY2xhc3MgUmFkaWFsTWVudSBleHRlbmRzIENvbXBvbmVudCA8JFJhZGlhbE1lbnU+XG57XG4gICAgIGNvbnRhaW5lcjogU1ZHU1ZHRWxlbWVudFxuICAgICBkZWZpbml0aW9uOiBSYWRpYWxEZWZpbml0aW9uXG5cbiAgICAgcmVhZG9ubHkgcmVuZGVyZXJzOiBSZWNvcmQgPHN0cmluZywgUmVuZGVyZXI+ID0ge1xuICAgICAgICAgIFwiY2lyY2xlXCI6IHRoaXMucmVuZGVyU3ZnQ2lyY2xlcy5iaW5kICh0aGlzKVxuICAgICB9XG5cbiAgICAgLyoqIEBvdmVycmlkZSAqL1xuICAgICBnZXRIdG1sICgpXG4gICAgIHtcbiAgICAgICAgICB0aGlzLnVwZGF0ZSAoKVxuXG4gICAgICAgICAgcmV0dXJuIFt0aGlzLmNvbnRhaW5lciBhcyBhbnldXG4gICAgIH1cblxuICAgICBhZGQgKCAuLi4gYnV0dG9uczogJEJ1dHRvbiBbXSApXG4gICAgIHtcbiAgICAgICAgICB0aGlzLmRhdGEuYnV0dG9ucy5wdXNoICggLi4uIGJ1dHRvbnMgYXMgYW55IClcblxuICAgICAgICAgIHRoaXMudXBkYXRlICgpXG4gICAgIH1cblxuICAgICB1cGRhdGUgKClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHsgZGF0YSB9ID0gdGhpc1xuXG4gICAgICAgICAgY29uc3QgZGVmOiBSYWRpYWxPcHRpb24gPSB7XG4gICAgICAgICAgICAgICBjb3VudCAgOiBkYXRhLmJ1dHRvbnMubGVuZ3RoLFxuICAgICAgICAgICAgICAgciAgICAgIDogNzUsXG4gICAgICAgICAgICAgICBwYWRkaW5nOiA2LFxuICAgICAgICAgICAgICAgcm90YXRpb246IGRhdGEucm90YXRpb24gfHwgMFxuICAgICAgICAgIH1cblxuICAgICAgICAgIHRoaXMuZGVmaW5pdGlvbiA9IEcuZ2V0UmFkaWFsRGlzdHJpYnV0aW9uICggZGVmIClcbiAgICAgICAgICB0aGlzLmNvbnRhaW5lciAgPSB0aGlzLnRvU3ZnICggXCJjaXJjbGVcIiApXG4gICAgIH1cblxuICAgICBwcml2YXRlIGVuYWJsZUV2ZW50cyAoKVxuICAgICB7XG4gICAgICAgICAgLy9jb25zdCB7IG9wdGlvbnMgfSA9IHRoaXNcbiAgICAgICAgICAvL2ZvciAoIGNvbnN0IGJ0biBvZiBvcHRpb25zLmJ1dHRvbnMgKVxuICAgICAgICAgIC8vICAgICBidG4uXG4gICAgIH1cblxuICAgICBzaG93ICggeDogbnVtYmVyLCB5OiBudW1iZXIgKTogdm9pZFxuICAgICB7XG4gICAgICAgICAgY29uc3QgbiA9IHRoaXMuY29udGFpbmVyXG4gICAgICAgICAgY29uc3Qgb2Zmc2V0ID0gdGhpcy5kZWZpbml0aW9uLndpZHRoIC8gMlxuXG4gICAgICAgICAgbi5zdHlsZS5sZWZ0ID0gKHggLSBvZmZzZXQpICsgXCJweFwiXG4gICAgICAgICAgbi5zdHlsZS50b3AgID0gKHkgLSBvZmZzZXQpICsgXCJweFwiXG4gICAgICAgICAgbi5jbGFzc0xpc3QucmVtb3ZlICggXCJjbG9zZVwiIClcbiAgICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lciAoIFwibW91c2Vkb3duXCIsIHRoaXMuaGlkZS5iaW5kICh0aGlzKSwgdHJ1ZSApXG4gICAgIH1cblxuICAgICBoaWRlICgpXG4gICAgIHtcbiAgICAgICAgICB0aGlzLmNvbnRhaW5lci5jbGFzc0xpc3QuYWRkIChcImNsb3NlXCIpXG4gICAgICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lciAoIFwibW91c2Vkb3duXCIsIHRoaXMuaGlkZSApXG4gICAgIH1cblxuICAgICB0b1N2ZyAoIHN0eWxlOiBzdHJpbmcgKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgeyBkZWZpbml0aW9uOiBkZWYsIHJlbmRlcmVycywgZGF0YSB9ID0gdGhpc1xuXG4gICAgICAgICAgY29uc3Qgc3ZnID1cbiAgICAgICAgICAgICAgIDxzdmdcbiAgICAgICAgICAgICAgICAgICAgY2xhc3MgICA9XCJyYWRpYWwtbWVudSBjbG9zZVwiXG4gICAgICAgICAgICAgICAgICAgIHdpZHRoICAgPXsgZGVmLndpZHRoICsgXCJweFwiIH1cbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0ICA9eyBkZWYuaGVpZ2h0ICsgXCJweFwiIH1cbiAgICAgICAgICAgICAgICAgICAgdmlld0JveCA9eyBgMCAwICR7IGRlZi53aWR0aCB9ICR7IGRlZi5oZWlnaHQgfWAgfVxuICAgICAgICAgICAgICAgLz4gYXMgU1ZHU1ZHRWxlbWVudFxuXG4gICAgICAgICAgY29uc3QgYnV0dG9ucyA9IHN0eWxlIGluIHJlbmRlcmVyc1xuICAgICAgICAgICAgICAgICAgICAgICAgID8gcmVuZGVyZXJzIFtzdHlsZV0gKCBkZWYgKVxuICAgICAgICAgICAgICAgICAgICAgICAgIDogdGhpcy5yZW5kZXJTdmdDaXJjbGVzICggZGVmIClcblxuICAgICAgICAgIHN2Zy5hcHBlbmQgKCAuLi4gYnV0dG9ucyBhcyBOb2RlIFtdIClcblxuICAgICAgICAgIGZvciAoIHZhciBpID0gMCA7IGkgIT0gYnV0dG9ucy5sZW5ndGggOyBpKysgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNvbnN0IG9wdCA9IGRhdGEuYnV0dG9ucyBbaV1cblxuICAgICAgICAgICAgICAgaWYgKCB0eXBlb2Ygb3B0LmNhbGxiYWNrID09IFwiZnVuY3Rpb25cIiApXG4gICAgICAgICAgICAgICAgICAgIGJ1dHRvbnMgW2ldLmFkZEV2ZW50TGlzdGVuZXIgKCBcIm1vdXNlZG93blwiLCAoKSA9PiBvcHQuY2FsbGJhY2sgKCkgKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiBzdmdcbiAgICAgfVxuXG4gICAgIHJlbmRlclN2Z0NpcmNsZXMgKCBkZWZpbml0aW9uOiBSYWRpYWxEZWZpbml0aW9uIClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHBvaW50cyAgPSBkZWZpbml0aW9uLnBvaW50c1xuICAgICAgICAgIGNvbnN0IHBhZGRpbmcgPSBkZWZpbml0aW9uLnBhZGRpbmdcbiAgICAgICAgICBjb25zdCBidXR0dW5zID0gW10gYXMgU1ZHRWxlbWVudCBbXVxuXG4gICAgICAgICAgZm9yICggdmFyIGkgPSAwOyBpIDwgcG9pbnRzLmxlbmd0aDsgKytpIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBjb25zdCBkZWYgPSBwb2ludHMgW2ldXG4gICAgICAgICAgICAgICBjb25zdCBidG4gPSB0aGlzLmRhdGEuYnV0dG9ucyBbaV1cblxuICAgICAgICAgICAgICAgY29uc3QgZ3JvdXAgPSA8ZyBjbGFzcz1cImJ1dHRvblwiIC8+XG5cbiAgICAgICAgICAgICAgIGNvbnN0IGNpcmNsZSA9IFN2Zy5jcmVhdGVTdmdTaGFwZSAoIFwiY2lyY2xlXCIsIHtcbiAgICAgICAgICAgICAgICAgICAgc2l6ZTogZGVmLmNob3JkLmxlbmd0aCAtIHBhZGRpbmcgKiAyLFxuICAgICAgICAgICAgICAgICAgICB4OiBkZWYueCxcbiAgICAgICAgICAgICAgICAgICAgeTogZGVmLnlcbiAgICAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgICAgIGNvbnN0IHRleHQgPSA8dGV4dFxuICAgICAgICAgICAgICAgICAgICB4ID0geyBkZWYueCB9XG4gICAgICAgICAgICAgICAgICAgIHkgPSB7IGRlZi55IH1cbiAgICAgICAgICAgICAgICAgICAgZm9udC1zaXplPVwiMzBcIlxuICAgICAgICAgICAgICAgICAgICBmaWxsPVwiYmxhY2tcIlxuICAgICAgICAgICAgICAgICAgICBzdHlsZT1cInVzZXItc2VsZWN0OiBub25lOyBjdXJzb3I6IHBvaW50ZXI7IGRvbWluYW50LWJhc2VsaW5lOiBjZW50cmFsOyB0ZXh0LWFuY2hvcjogbWlkZGxlO1wiXG4gICAgICAgICAgICAgICAvPlxuXG4gICAgICAgICAgICAgICBpZiAoIGJ0bi5mb250RmFtaWx5ICE9IHVuZGVmaW5lZCApXG4gICAgICAgICAgICAgICAgICAgIHRleHQuc2V0QXR0cmlidXRlICggXCJmb250LWZhbWlseVwiLCBidG4uZm9udEZhbWlseSApXG5cbiAgICAgICAgICAgICAgIHRleHQuaW5uZXJIVE1MID0gYnRuLmljb25cblxuICAgICAgICAgICAgICAgZ3JvdXAuYXBwZW5kICggY2lyY2xlIClcbiAgICAgICAgICAgICAgIGdyb3VwLmFwcGVuZCAoIHRleHQgKVxuXG4gICAgICAgICAgICAgICBidXR0dW5zLnB1c2ggKCBncm91cCBhcyBTVkdFbGVtZW50IClcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gYnV0dHVuc1xuICAgICB9XG59XG5cbiIsIlxuaW1wb3J0IHsgQ29tcG9uZW50IH0gZnJvbSBcIi4uLy4uL0Jhc2UvQ29tcG9uZW50L2luZGV4LmpzXCJcbmltcG9ydCB7IHhub2RlIH0gZnJvbSBcIi4uLy4uL0Jhc2UveG5vZGUuanNcIlxuaW1wb3J0IHsgZGVmaW5lIH0gZnJvbSBcIi4uLy4uL2RiLmpzXCJcbmltcG9ydCB7IFBhbmVsIH0gZnJvbSBcIi4vaW5kZXguanNcIlxuXG5kZWNsYXJlIGdsb2JhbFxue1xuXG4gICAgIGV4cG9ydCBpbnRlcmZhY2UgJFBlcnNvblZpZXdlciBleHRlbmRzICRQYW5lbFxuICAgICB7XG4gICAgICAgICAgcmVhZG9ubHkgdHlwZTogXCJwZXJzb24tdmlld2VyXCJcbiAgICAgfVxufVxuXG5leHBvcnQgY2xhc3MgUGVyc29uVmlld2VyIGV4dGVuZHMgQ29tcG9uZW50IDwkUGVyc29uVmlld2VyPlxue1xuICAgICBkaXNwbGF5ICggcGVyc29uOiAkUGVyc29uIClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IGNhcmQgPSA8ZGl2IGNsYXNzPVwidzMtY2FyZC00IHBlcnNvbi1jYXJkXCI+XG4gICAgICAgICAgICAgICA8aW1nIHNyYz17IHBlcnNvbi5hdmF0YXIgfSBhbHQ9XCJBdmF0YXJcIi8+XG4gICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwidzMtY29udGFpbmVyXCI+XG4gICAgICAgICAgICAgICAgICAgIDxoND5cbiAgICAgICAgICAgICAgICAgICAgICAgICA8Yj57IHBlcnNvbi5maXJzdE5hbWUgfTwvYj5cbiAgICAgICAgICAgICAgICAgICAgPC9oND5cbiAgICAgICAgICAgICAgICAgICAgPGxhYmVsPlxuICAgICAgICAgICAgICAgICAgICAgICAgIDxiPnsgcGVyc29uLmlzQ2FwdGFpbiA/IFwiRXhwZXJ0XCIgOiBudWxsIH08L2I+XG4gICAgICAgICAgICAgICAgICAgIDwvbGFiZWw+XG4gICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cblxuXG4gICAgICAgICAgdGhpcy5jb250YWluZXIuaW5uZXJIVE1MID0gXCJcIlxuICAgICAgICAgIHRoaXMuY29udGFpbmVyLmFwcGVuZCAoIGNhcmQgKVxuICAgICB9XG59XG5cbmRlZmluZSAoIFBlcnNvblZpZXdlciwge1xuICAgICBjb250ZXh0IDogQ09OVEVYVF9VSSxcbiAgICAgdHlwZSAgICA6IFwicGVyc29uLXZpZXdlclwiLFxuICAgICBpZCAgICAgIDogdW5kZWZpbmVkLFxuICAgICBwb3NpdGlvbjogXCJsZWZ0XCJcbn0pXG4iLCJcbmltcG9ydCBcIi4uLy4uL3R5cGVzLmpzXCJcbmltcG9ydCAqIGFzIHVpIGZyb20gXCIuLi8uLi9kYi5qc1wiXG5pbXBvcnQgeyBDb21wb25lbnQgfSBmcm9tIFwiLi4vLi4vQmFzZS9Db21wb25lbnQvaW5kZXguanNcIlxuaW1wb3J0IHsgU2lkZU1lbnUgfSBmcm9tIFwiLi4vU2lkZU1lbnUvaW5kZXguanNcIlxuXG5kZWNsYXJlIGdsb2JhbFxue1xuICAgICBpbnRlcmZhY2UgJFBhbmVsIGV4dGVuZHMgJENvbXBvbmVudFxuICAgICB7XG4gICAgICAgICAgLy90eXBlICAgICAgICAgOiBcInBhbmVsXCJcbiAgICAgICAgICBoZWFkZXI/ICAgICAgOiAkQW55Q29tcG9uZW50cyxcbiAgICAgICAgICBjaGlsZHJlbj8gICAgOiAkQW55Q29tcG9uZW50cyBbXVxuICAgICAgICAgIGZvb3Rlcj8gICAgICA6ICRBbnlDb21wb25lbnRzXG4gICAgICAgICAgcG9zaXRpb246IFwibGVmdFwiIHwgXCJyaWdodFwiIHwgXCJ0b3BcIiB8IFwiYm90dG9tXCJcbiAgICAgfVxufVxuXG5cbnZhciBjdXJyZW50OiBQYW5lbCA9IG51bGxcbmNvbnN0IGVsZW1zID0ge30gYXMgUmVjb3JkIDxzdHJpbmcsIFBhbmVsPlxuXG5leHBvcnQgZnVuY3Rpb24gcGFuZWwgKCk6IFBhbmVsXG5leHBvcnQgZnVuY3Rpb24gcGFuZWwgKCBpZDogc3RyaW5nICk6IFBhbmVsXG5leHBvcnQgZnVuY3Rpb24gcGFuZWwgKCBkZWZpbml0aW9uOiAkUGFuZWwgKTogUGFuZWxcbmV4cG9ydCBmdW5jdGlvbiBwYW5lbCAoIGlkOiBzdHJpbmcsIGRlZmluaXRpb246ICRQYW5lbCApOiBQYW5lbFxuZXhwb3J0IGZ1bmN0aW9uIHBhbmVsICggYT86IHN0cmluZyB8ICRQYW5lbCwgYj86ICRQYW5lbCApOiBQYW5lbFxue1xuICAgICBzd2l0Y2ggKCBhcmd1bWVudHMubGVuZ3RoIClcbiAgICAge1xuICAgICBjYXNlIDA6IC8vIHBhbmVsICgpXG5cbiAgICAgICAgICByZXR1cm4gY3VycmVudDtcblxuICAgICBjYXNlIDE6IC8vIHBhbmVsICggaWQgKSB8IHBhbmVsICggZGVmaW5pdGlvbiApXG5cbiAgICAgICAgICBpZiAoIHR5cGVvZiBhID09IFwic3RyaW5nXCIgKVxuICAgICAgICAgICAgICAgcmV0dXJuIGVsZW1zIFthXTtcblxuICAgICAgICAgIGlmICggdHlwZW9mIGEgIT0gXCJvYmplY3RcIiB8fCBhID09IG51bGwgfHwgQXJyYXkuaXNBcnJheSAoYSkgKVxuICAgICAgICAgICAgICAgdGhyb3cgYEJhZCBwYW5lbCBkZWZpbml0aW9uIDogJHsgYSB9YFxuXG4gICAgICAgICAgYiA9IGE7XG4gICAgICAgICAgYSA9IGIuaWQ7XG5cbiAgICAgY2FzZSAyOiAvLyBwYW5lbCAoIGlkLCBkZWZpbml0aW9uIClcblxuICAgICAgICAgIGlmICggdHlwZW9mIGEgIT0gXCJzdHJpbmdcIiApXG4gICAgICAgICAgICAgICB0aHJvdyBgQmFkIGlkIG5hbWUgOiAkeyBhIH1gXG5cbiAgICAgICAgICBpZiAoIGEgaW4gZWxlbXMgKVxuICAgICAgICAgICAgICAgdGhyb3cgYFBhbmVsIGFscmVhZHkgZXhpc3RzIDogJHsgYSB9YFxuXG4gICAgICAgICAgaWYgKCB0eXBlb2YgYiAhPSBcIm9iamVjdFwiIHx8IGIgPT0gbnVsbCB8fCBBcnJheS5pc0FycmF5IChiKSApXG4gICAgICAgICAgICAgICB0aHJvdyBgQmFkIHBhbmVsIGRlZmluaXRpb24gOiAkeyBiIH1gXG5cbiAgICAgICAgICA7KGIgYXMgYW55KS5pZCA9IGFcbiAgICAgICAgICAvL2VsZW1zIFthXSA9IG5ldyBQYW5lbCAoIGIgKVxuICAgICAgICAgIGVsZW1zIFthXSA9IHVpLmluU3RvY2sgKCBiICkgPyB1aS5waWNrICggYiApIDogdWkubWFrZSAoIGIgKVxuICAgICAgICAgIHRoaXMucGxhY2VUbyAoIGIucG9zaXRpb24gKTtcbiAgICAgICAgICBicmVha1xuXG4gICAgIGRlZmF1bHQ6XG4gICAgICAgICAgdGhyb3cgXCJXcm9uZyBmdW5jdGlvbiBjYWxsXCJcbiAgICAgfVxuXG59XG5cblxuXG50eXBlIERpcmVjdGlvbiA9IFwibHJcIiB8IFwicmxcIiB8IFwidGJcIiB8IFwiYnRcIlxuXG5jb25zdCB0b1Bvc2l0aW9uID0ge1xuICAgICBsciA6IFwibGVmdFwiLFxuICAgICBybCA6IFwicmlnaHRcIixcbiAgICAgdGIgOiBcInRvcFwiLFxuICAgICBidCA6IFwiYm90dG9tXCIsXG59XG5cbi8vZXhwb3J0IC8qYWJzdHJhY3QqLyBjbGFzcyBQYW5lbCA8QyBleHRlbmRzICRQYW5lbCA9ICRQYW5lbD4gZXh0ZW5kcyBDb21wb25lbnQgPEM+XG5leHBvcnQgLyphYnN0cmFjdCovIGNsYXNzIFBhbmVsIDxDIGV4dGVuZHMgJFBhbmVsID0gJFBhbmVsPiBleHRlbmRzIENvbXBvbmVudCA8Qz5cbntcbiAgICAgcHJpdmF0ZSBtZW51OiBTaWRlTWVudVxuXG4gICAgIHBsYWNlVG8gKCBzaWRlOiBcImxlZnRcIiB8IFwicmlnaHRcIiB8IFwidG9wXCIgfCBcImJvdHRvbVwiIClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IGRhdGEgPSB0aGlzLmRhdGFcblxuICAgICAgICAgIGlmICggZGF0YS5wb3NpdGlvbiA9PSBzaWRlICYmIHRoaXMubWVudSAhPSBudWxsICkgcmV0dXJuXG5cbiAgICAgICAgICBjb25zdCBjZmcgPSB7XG4gICAgICAgICAgICAgICBjb250ZXh0ICAgICAgOiBcImNvbmNlcHQtdWlcIiBhcyBcImNvbmNlcHQtdWlcIixcbiAgICAgICAgICAgICAgIHR5cGUgICAgICAgICA6IFwic2lkZS1tZW51XCIgIGFzIFwic2lkZS1tZW51XCIsXG4gICAgICAgICAgICAgICBoYXNNYWluQnV0dG9uOiB0cnVlLFxuICAgICAgICAgIH1cblxuICAgICAgICAgIHZhciBtZW51OiBTaWRlTWVudVxuXG4gICAgICAgICAgc3dpdGNoICggc2lkZSApXG4gICAgICAgICAge1xuICAgICAgICAgIGNhc2UgXCJsZWZ0XCI6XG5cbiAgICAgICAgICAgICAgIGlmICggU2lkZU1lbnUuYXRMZWZ0ID09IG51bGwgKSBTaWRlTWVudS5hdExlZnQgPSBuZXcgU2lkZU1lbnUgKHtcbiAgICAgICAgICAgICAgICAgICAgaWQ6IFwic2lkZS1tZW51LWxlZnRcIixcbiAgICAgICAgICAgICAgICAgICAgZGlyZWN0aW9uOiBcImxyXCIsXG4gICAgICAgICAgICAgICAgICAgIC4uLiBjZmcsXG4gICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgbWVudSA9IFNpZGVNZW51LmF0TGVmdFxuICAgICAgICAgICAgICAgYnJlYWtcblxuICAgICAgICAgIGNhc2UgXCJyaWdodFwiOlxuXG4gICAgICAgICAgICAgICBpZiAoIFNpZGVNZW51LmF0UmlnaHQgPT0gbnVsbCApIFNpZGVNZW51LmF0UmlnaHQgPSBuZXcgU2lkZU1lbnUgKHtcbiAgICAgICAgICAgICAgICAgICAgaWQ6IFwic2lkZS1tZW51LXJpZ2h0XCIsXG4gICAgICAgICAgICAgICAgICAgIGRpcmVjdGlvbjogXCJybFwiLFxuICAgICAgICAgICAgICAgICAgICAuLi4gY2ZnLFxuICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgIG1lbnUgPSBTaWRlTWVudS5hdFJpZ2h0XG4gICAgICAgICAgICAgICBicmVha1xuXG4gICAgICAgICAgY2FzZSBcInRvcFwiOlxuXG4gICAgICAgICAgICAgICBpZiAoIFNpZGVNZW51LmF0VG9wID09IG51bGwgKSBTaWRlTWVudS5hdFRvcCA9IG5ldyBTaWRlTWVudSAoe1xuICAgICAgICAgICAgICAgICAgICBpZDogXCJzaWRlLW1lbnUtdG9wXCIsXG4gICAgICAgICAgICAgICAgICAgIGRpcmVjdGlvbjogXCJ0YlwiLFxuICAgICAgICAgICAgICAgICAgICAuLi4gY2ZnLFxuICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgIG1lbnUgPSBTaWRlTWVudS5hdFRvcFxuICAgICAgICAgICAgICAgYnJlYWtcblxuICAgICAgICAgIGNhc2UgXCJib3R0b21cIjpcblxuICAgICAgICAgICAgICAgaWYgKCBTaWRlTWVudS5hdEJvdHRvbSA9PSBudWxsICkgU2lkZU1lbnUuYXRCb3R0b20gPSBuZXcgU2lkZU1lbnUgKHtcbiAgICAgICAgICAgICAgICAgICAgaWQ6IFwic2lkZS1tZW51LWJvdHRvbVwiLFxuICAgICAgICAgICAgICAgICAgICBkaXJlY3Rpb246IFwiYnRcIixcbiAgICAgICAgICAgICAgICAgICAgLi4uIGNmZyxcbiAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICBtZW51ID0gU2lkZU1lbnUuYXRCb3R0b21cbiAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKCB0aGlzLm1lbnUgIT0gdW5kZWZpbmVkIClcbiAgICAgICAgICAgICAgIHRoaXMubWVudS5yZW1vdmUgKCB0aGlzIClcblxuICAgICAgICAgIG1lbnUuYXBwZW5kICggdGhpcyApXG4gICAgICAgICAgZGF0YS5wb3NpdGlvbiA9IHNpZGVcbiAgICAgfVxuXG4gICAgIG9wZW4gKClcbiAgICAge1xuICAgICAgICAgIHRoaXMubWVudS5jbGVhciAoKVxuICAgICAgICAgIHRoaXMubWVudS5hcHBlbmQgKCB0aGlzIClcbiAgICAgICAgICB0aGlzLm1lbnUub3BlbiAoKVxuICAgICB9XG5cbiAgICAgY2xvc2UgKClcbiAgICAge1xuICAgICAgICAgIHRoaXMubWVudS5jbG9zZSAoKVxuICAgICB9XG5cbn1cblxuIiwiXG5pbXBvcnQgeyB4bm9kZSB9IGZyb20gXCIuLi8uLi9CYXNlL3hub2RlLmpzXCJcbmltcG9ydCB7IFBhbmVsIH0gZnJvbSBcIi4vaW5kZXguanNcIlxuaW1wb3J0IHsgZGVmaW5lIH0gZnJvbSBcIi4uLy4uL2RiLmpzXCJcbmltcG9ydCAqIGFzIGRiIGZyb20gXCIuLi8uLi8uLi9BcHBsaWNhdGlvbi9kYXRhLmpzXCJcblxuXG5kZWNsYXJlIGdsb2JhbFxue1xuICAgICBpbnRlcmZhY2UgJFNraWxsVmlld2VyIGV4dGVuZHMgJFBhbmVsXG4gICAgIHtcbiAgICAgICAgICB0eXBlOiBcInNraWxsLXZpZXdlclwiXG4gICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFNraWxsVmlld2VyIGV4dGVuZHMgUGFuZWwgPCRTa2lsbFZpZXdlcj5cbntcbiAgICAgZGlzcGxheSAoIHNraWxsOiAkU2tpbGwgKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgdGFyZ2V0ID0gPGRpdiBjbGFzcz1cInBlb3BsZVwiPjwvZGl2PlxuXG4gICAgICAgICAgZm9yICggY29uc3QgaXRlbSBvZiBza2lsbC5pdGVtcyApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgY29uc3QgcGVyc29uID0gZGIubm9kZSA8JFBlcnNvbj4gKCBpdGVtLnR5cGUsIGl0ZW0uaWQgKVxuXG4gICAgICAgICAgICAgICBjb25zdCBjYXJkID0gPGRpdiBjbGFzcz1cInczLWNhcmQtNCBwZXJzb24tY2FyZFwiPlxuICAgICAgICAgICAgICAgICAgICA8aW1nIHNyYz17IHBlcnNvbi5hdmF0YXIgfSBhbHQ9XCJBdmF0YXJcIi8+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJ3My1jb250YWluZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICA8aDQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8Yj57IHBlcnNvbi5maXJzdE5hbWUgfTwvYj5cbiAgICAgICAgICAgICAgICAgICAgICAgICA8L2g0PlxuICAgICAgICAgICAgICAgICAgICAgICAgIDxsYWJlbD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxiPnsgcGVyc29uLmlzQ2FwdGFpbiA/IFwiRXhwZXJ0XCIgOiBudWxsIH08L2I+XG4gICAgICAgICAgICAgICAgICAgICAgICAgPC9sYWJlbD5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgdGFyZ2V0LmFwcGVuZCAoIGNhcmQgKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHRoaXMuY29udGFpbmVyLmNsYXNzTGlzdC5hZGQgKCBcImNvbnRhaW5lclwiIClcbiAgICAgICAgICB0aGlzLmNvbnRhaW5lci5pbm5lckhUTUwgPSBcIlwiXG4gICAgICAgICAgdGhpcy5jb250YWluZXIuYXBwZW5kICggPGgxPnsgc2tpbGwuaWQgfTwvaDE+IClcbiAgICAgICAgICB0aGlzLmNvbnRhaW5lci5hcHBlbmQgKCA8cD57IHNraWxsLmRlc2NyaXB0aW9uIH08L3A+IClcbiAgICAgICAgICB0aGlzLmNvbnRhaW5lci5hcHBlbmQgKCB0YXJnZXQgKVxuXG4gICAgICAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL0xvckRPbmlYL2pzb24tdmlld2VyL2Jsb2IvbWFzdGVyL3NyYy9qc29uLXZpZXdlci5qc1xuICAgICAgICAgIHRoaXMuY29udGFpbmVyLmFwcGVuZCAoIDxwcmU+eyBKU09OLnN0cmluZ2lmeSAoIHNraWxsLCBudWxsLCAzICkgfTwvcHJlPiApXG4gICAgIH1cbn1cblxuZGVmaW5lICggU2tpbGxWaWV3ZXIsIHtcbiAgICAgY29udGV4dCA6IENPTlRFWFRfVUksXG4gICAgIHR5cGUgICAgOiBcInNraWxsLXZpZXdlclwiLFxuICAgICBpZCAgICAgIDogdW5kZWZpbmVkLFxuICAgICBwb3NpdGlvbjogXCJsZWZ0XCJcbn0pXG4iLCJcblxuZXhwb3J0IHsgZGVmaW5lQXNwZWN0LCBnZXRBc3BlY3QsIHNldEFzcGVjdCB9IGZyb20gXCIuL2RiLmpzXCJcblxuZXhwb3J0IHsgR2VvbWV0cnkgfSBmcm9tIFwiLi9nZW9tZXRyeS5qc1wiXG5leHBvcnQgeyBTaGFwZSB9IGZyb20gXCIuL0VsZW1lbnQvc2hhcGUuanNcIlxuZXhwb3J0IHsgTm90ZSB9ICAgICAgZnJvbSBcIi4vRWxlbWVudC9ub3RlLmpzXCJcbmV4cG9ydCB7IEJhZGdlIH0gICAgIGZyb20gXCIuL0VsZW1lbnQvYmFkZ2UuanNcIlxuZXhwb3J0IHsgQ29udGFpbmVyIH0gZnJvbSBcIi4vRWxlbWVudC9ncm91cC5qc1wiXG5cblxuaW1wb3J0IHsgbm9kZSB9IGZyb20gXCIuLi9kYXRhLmpzXCJcbmltcG9ydCB7IGdldEFzcGVjdCwgZGVmaW5lQXNwZWN0LCBzZXRBc3BlY3QgfSBmcm9tIFwiLi9kYi5qc1wiXG5pbXBvcnQgeyBTaGFwZSB9IGZyb20gXCIuL0VsZW1lbnQvc2hhcGUuanNcIlxuaW1wb3J0IHsgQ29udGFpbmVyIH0gZnJvbSBcIi4vRWxlbWVudC9ncm91cC5qc1wiXG5pbXBvcnQgeyBCYWRnZSB9ICAgICBmcm9tIFwiLi9FbGVtZW50L2JhZGdlLmpzXCJcbmltcG9ydCB7IGNvbW1hbmQgfSBmcm9tIFwiLi4vLi4vVWkvaW5kZXguanNcIlxuXG5cbmRlZmluZUFzcGVjdCAoIFNoYXBlICAgICwgXCJwZXJzb25cIiAvKiAsIHsgb25DcmVhdGU6ICgpID0+IC4uLiwgb25Ub3VjaDogKCkgPT4gLi4uIH0gKi8gKVxuZGVmaW5lQXNwZWN0ICggQ29udGFpbmVyLCBcInNraWxsXCIgKVxuZGVmaW5lQXNwZWN0ICggQmFkZ2UgICAgLCBcImJhZGdlXCIgKVxuXG5zZXRBc3BlY3QgPCRTaGFwZT4gKHtcbiAgICAgdHlwZSAgIDogXCJwZXJzb25cIixcbiAgICAgaWQgICAgIDogdW5kZWZpbmVkLFxuXG4gICAgIGRhdGEgICA6IHVuZGVmaW5lZCxcblxuICAgICBzaGFwZSAgOiBcImNpcmNsZVwiLFxuXG4gICAgIHg6IDAsXG4gICAgIHk6IDAsXG5cbiAgICAgbWluU2l6ZSAgICA6IDMwLFxuICAgICBzaXplRmFjdG9yOiAxLFxuICAgICBzaXplT2Zmc2V0OiAwLFxuXG4gICAgIGJvcmRlckNvbG9yICAgICA6IFwiIzAwYzBhYVwiLFxuICAgICBib3JkZXJXaWR0aCAgICAgOiA0LFxuICAgICBiYWNrZ3JvdW5kQ29sb3IgOiBcInRyYW5zcGFyZW50XCIsXG4gICAgIGJhY2tncm91bmRJbWFnZSA6IHVuZGVmaW5lZCxcbiAgICAgYmFja2dyb3VuZFJlcGVhdDogZmFsc2UsXG5cbiAgICAgb25DcmVhdGUgICA6ICggcGVyc29uOiAkUGVyc29uLCBhc3BlY3QgKSA9PlxuICAgICB7XG4gICAgICAgICAgYXNwZWN0LnNldEJhY2tncm91bmQgKHtcbiAgICAgICAgICAgICAgIGJhY2tncm91bmRJbWFnZTogcGVyc29uLmF2YXRhcixcbiAgICAgICAgICAgICAgIHNoYXBlOiBwZXJzb24uaXNDYXB0YWluID8gXCJzcXVhcmVcIiA6IFwiY2lyY2xlXCIsXG4gICAgICAgICAgfSBhcyBhbnkpXG4gICAgIH0sXG4gICAgIG9uRGVsZXRlOiB1bmRlZmluZWQsXG4gICAgIG9uVG91Y2g6IHVuZGVmaW5lZCxcbn0pXG5cbnNldEFzcGVjdCA8JFNoYXBlPiAoe1xuICAgICB0eXBlICAgOiBcInNraWxsXCIsXG4gICAgIGlkICAgICA6IHVuZGVmaW5lZCxcblxuICAgICBkYXRhOiB1bmRlZmluZWQsXG5cbiAgICAgc2hhcGU6IFwiY2lyY2xlXCIsXG4gICAgIHg6IDAsXG4gICAgIHk6IDAsXG5cbiAgICAgYm9yZGVyQ29sb3IgICAgIDogXCIjZjFiYzMxXCIsXG4gICAgIGJvcmRlcldpZHRoICAgICA6IDgsXG4gICAgIGJhY2tncm91bmRDb2xvciA6IFwiI0ZGRkZGRlwiLFxuICAgICBiYWNrZ3JvdW5kSW1hZ2UgOiB1bmRlZmluZWQsXG4gICAgIGJhY2tncm91bmRSZXBlYXQ6IGZhbHNlLFxuICAgICBtaW5TaXplICAgICAgICAgOiA1MCxcbiAgICAgc2l6ZU9mZnNldCAgICAgIDogMTAsXG4gICAgIHNpemVGYWN0b3IgICAgICA6IDEsXG5cbiAgICAgb25DcmVhdGUgKCBza2lsbDogJFNraWxsLCBhc3BlY3QgKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgZGF0YSA9IG5vZGUgPCRCYWRnZT4gKCBcImJhZGdlXCIsIHNraWxsLmljb24gKVxuICAgICAgICAgIGNvbnN0IGJhZGdlID0gZ2V0QXNwZWN0IDxCYWRnZT4gKCBkYXRhIClcblxuICAgICAgICAgIGJhZGdlLmF0dGFjaCAoIGFzcGVjdCApXG4gICAgIH0sXG5cbiAgICAgb25Ub3VjaCAoIHNoYXBlIClcbiAgICAge1xuICAgICAgICAgIGNvbW1hbmQgKCBcIm9wZW4taW5mb3MtcGFuZWxcIiApLnJ1biAoKVxuICAgICB9LFxuXG4gICAgIG9uRGVsZXRlOiB1bmRlZmluZWRcbn0pXG5cbnNldEFzcGVjdCA8JFNoYXBlPiAoe1xuICAgICB0eXBlICAgOiBcImJhZGdlXCIsXG4gICAgIGlkICAgICA6IHVuZGVmaW5lZCxcblxuICAgICBkYXRhOiB1bmRlZmluZWQsXG5cbiAgICAgeCAgICAgICAgIDogMCxcbiAgICAgeSAgICAgICAgIDogMCxcbiAgICAgbWluU2l6ZSAgIDogMSxcbiAgICAgc2l6ZUZhY3RvcjogMSxcbiAgICAgc2l6ZU9mZnNldDogMCxcblxuICAgICBzaGFwZSAgICAgICAgICAgOiBcImNpcmNsZVwiLFxuICAgICBib3JkZXJDb2xvciAgICAgOiBcImdyYXlcIixcbiAgICAgYm9yZGVyV2lkdGggICAgIDogMCxcblxuICAgICBiYWNrZ3JvdW5kQ29sb3IgOiBcInRyYW5zcGFyZW50XCIsXG4gICAgIGJhY2tncm91bmRJbWFnZSA6IHVuZGVmaW5lZCxcbiAgICAgYmFja2dyb3VuZFJlcGVhdDogZmFsc2UsXG5cbiAgICAgb25DcmVhdGUgICAgICAgIDogdW5kZWZpbmVkLFxuICAgICBvbkRlbGV0ZSAgICAgICAgOiB1bmRlZmluZWQsXG4gICAgIG9uVG91Y2ggICAgICAgICA6IHVuZGVmaW5lZCxcbn0pXG4iLCJcbmltcG9ydCBcIi4uL0xpYi9pbmRleC5qc1wiXG5pbXBvcnQgXCIuLi9EYXRhL2luZGV4LmpzXCJcblxuaW1wb3J0IFwiLi9Bc3BlY3QvaW5kZXguanNcIlxuaW1wb3J0IHsgZ2V0QXNwZWN0IH0gZnJvbSBcIi4vQXNwZWN0L2RiLmpzXCJcblxuZXhwb3J0ICogZnJvbSBcIi4vZGF0YS5qc1wiXG5pbXBvcnQgKiBhcyBkYiAgZnJvbSBcIi4vZGF0YS5qc1wiXG5cbmltcG9ydCAqIGFzIHVpIGZyb20gXCIuLi9VaS9pbmRleC5qc1wiXG5jb25zdCBjb21tYW5kID0gdWkuY29tbWFuZFxuXG4vLyAjcmVnaW9uIERSQVdJTkcgQVJFQVxuXG5leHBvcnQgY29uc3QgYXJlYSA9ICAoKCkgPT5cbntcbiAgICAgY29uc3QgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCAoIFwiY2FudmFzXCIgKVxuXG4gICAgIGNhbnZhcy53aWR0aCAgPSBkb2N1bWVudC5ib2R5LmNsaWVudFdpZHRoXG4gICAgIGNhbnZhcy5oZWlnaHQgPSBkb2N1bWVudC5ib2R5LmNsaWVudEhlaWdodFxuXG4gICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kICggY2FudmFzIClcblxuICAgICByZXR1cm4gbmV3IHVpLkFyZWEgKCBjYW52YXMgKVxufSkgKClcblxuZXhwb3J0IGNvbnN0IGNvbnRleHR1YWxNZW51ID0gbmV3IHVpLlJhZGlhbE1lbnUgKHtcbiAgICAgY29udGV4dDogXCJjb25jZXB0LXVpXCIsXG4gICAgIHR5cGU6IFwicmFkaWFsLW1lbnVcIixcbiAgICAgaWQ6IFwiYXJlYS1tZW51XCIsXG4gICAgIGJ1dHRvbnM6IFtcbiAgICAgICAgICAvL3sgdHlwZTogXCJidXR0b25cIiwgaWQ6IFwiYWRkLXRoaW5nXCIgLCB0ZXh0OiBcIlwiLCBpY29uOiBcIiYjeGUzYzg7XCIsIGZvbnRGYW1pbHk6IFwiTWF0ZXJpYWwgSWNvbnNcIiwgY2FsbGJhY2s6ICgpID0+IHsgcnVuQ29tbWFuZCAoIFwiem9vbS1leHRlbmRzXCIgKSB9IH0sIC8vIGRldGFpbHNcbiAgICAgICAgICB7IHR5cGU6IFwiYnV0dG9uXCIsIGlkOiBcImFkZC10aGluZ1wiICwgdGV4dDogXCJcIiwgaWNvbjogXCImI3hlM2M4O1wiLCBmb250RmFtaWx5OiBcIk1hdGVyaWFsIEljb25zXCIgfSwgLy8gZGV0YWlsc1xuICAgICAgICAgIHsgdHlwZTogXCJidXR0b25cIiwgaWQ6IFwiYWRkLWJ1YmJsZVwiLCB0ZXh0OiBcIlwiLCBpY29uOiBcIiYjeGU2ZGQ7XCIsIGZvbnRGYW1pbHk6IFwiTWF0ZXJpYWwgSWNvbnNcIiB9LFxuICAgICAgICAgIHsgdHlwZTogXCJidXR0b25cIiwgaWQ6IFwiYWRkLW5vdGVcIiAgLCB0ZXh0OiBcIlwiLCBpY29uOiBcIiYjeGUyNDQ7XCIsIGZvbnRGYW1pbHk6IFwiTWF0ZXJpYWwgSWNvbnNcIiwgY29tbWFuZDogXCJwYWNrLXZpZXdcIiB9LCAvLyBmb3JtYXRfcXVvdGVcbiAgICAgICAgICB7IHR5cGU6IFwiYnV0dG9uXCIsIGlkOiBcImFkZC1wZW9wbGVcIiwgdGV4dDogXCJcIiwgaWNvbjogXCImI3hlODdjO1wiLCBmb250RmFtaWx5OiBcIk1hdGVyaWFsIEljb25zXCIgfSwgLy8gZmFjZVxuICAgICAgICAgIHsgdHlwZTogXCJidXR0b25cIiwgaWQ6IFwiYWRkLXRhZ1wiICAgLCB0ZXh0OiBcIlwiLCBpY29uOiBcIiYjeGU4Njc7XCIsIGZvbnRGYW1pbHk6IFwiTWF0ZXJpYWwgSWNvbnNcIiB9LCAvLyBib29rbWFya19ib3JkZXJcbiAgICAgXSBhcyBhbnksXG4gICAgIHJvdGF0aW9uOiBNYXRoLlBJLzIsXG59KVxuZG9jdW1lbnQuYm9keS5hcHBlbmQgKCAuLi4gY29udGV4dHVhbE1lbnUuZ2V0SHRtbCAoKSApXG5cbi8vIEFyZWEgZXZlbnRzXG5cbmFyZWEub25Eb3VibGVUb3VjaE9iamVjdCA9ICggc2hhcGUgKSA9Plxue1xuICAgICBpZiAoIHNoYXBlLmNvbmZpZy5vblRvdWNoICE9IHVuZGVmaW5lZCApXG4gICAgICAgICAgc2hhcGUuY29uZmlnLm9uVG91Y2ggKCBzaGFwZSApXG59XG5cbmFyZWEub25Ub3VjaEFyZWEgPSAoIHgsIHkgKSA9Plxue1xuICAgICBjb21tYW5kICggXCJvcGVuLWNvbnRleHRhbC1tZW51XCIgKS5ydW4gKClcbiAgICAgLy9ydW4gQ29tbWFuZCAoIFwib3Blbi1jb250ZXh0YWwtbWVudVwiLCB4LCB5IClcbn1cblxuYXJlYS5vbk92ZXJPYmplY3QgPSAoIHNoYXBlICkgPT5cbntcbiAgICAgc2hhcGUuaG92ZXIgKCB0cnVlIClcbiAgICAgYXJlYS5mY2FudmFzLnJlcXVlc3RSZW5kZXJBbGwgKClcbn1cblxuYXJlYS5vbk91dE9iamVjdCA9ICggc2hhcGUgKSA9Plxue1xuICAgICBzaGFwZS5ob3ZlciAoIGZhbHNlIClcbiAgICAgYXJlYS5mY2FudmFzLnJlcXVlc3RSZW5kZXJBbGwgKClcbn1cblxuLy8gQXJlYSBjb21tYW5kc1xuXG5jb21tYW5kICggXCJvcGVuLWNvbnRleHRhbC1tZW51XCIsICggZTogZmFicmljLklFdmVudCApID0+XG57XG4gICAgIGNvbnRleHR1YWxNZW51LnNob3cgKCBlLnBvaW50ZXIueCwgZS5wb2ludGVyLnkgKVxufSApXG5cbmNvbW1hbmQgKCBcImNsb3NlLWNvbnRleHRhbC1tZW51XCIsICgpID0+XG57XG4gICAgIGNvbnRleHR1YWxNZW51LmhpZGUgKClcbn0pXG5cbmNvbW1hbmQgKCBcImFkZC1za2lsbFwiLCAoIHRpdGxlICkgPT5cbntcbiAgICAgY29uc29sZS5sb2cgKCBcIkFkZCBza2lsbFwiIClcbn0pXG5cbmNvbW1hbmQgKCBcImFkZC1wZXJzb25cIiwgKCBuYW1lICkgPT5cbntcblxufSlcblxuY29tbWFuZCAoIFwiem9vbS1leHRlbmRzXCIsICgpID0+XG57XG4gICAgIGFyZWEuem9vbSAoKVxufSlcblxuY29tbWFuZCAoIFwiem9vbS10b1wiLCAoIHNoYXBlICkgPT5cbntcbiAgICAgLy8gYXJlYS56b29tICggc2hhcGUgKVxuICAgICAvLyBhcmVhLmlzb2xhdGUgKCBzaGFwZSApXG59KVxuXG5jb21tYW5kICggXCJwYWNrLXZpZXdcIiwgKCkgPT5cbntcbiAgICAgYXJlYS5wYWNrICgpXG59KVxuXG4vLyB0ZXN0XG5cbmlmICggbmF2aWdhdG9yLm1heFRvdWNoUG9pbnRzID4gMCApXG57XG5cbiAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIgKCBcInBvaW50ZXJtb3ZlXCIsIGV2ZW50ID0+XG4gICAgIHtcbiAgICAgICAgICAvL2NvbnN0IHRhcmdldCA9IGFyZWEuZmNhbnZhcy5maW5kVGFyZ2V0ICggZXZlbnQsIHRydWUgKVxuICAgICAgICAgIC8vaWYgKCB0YXJnZXQgKVxuICAgICAgICAgIC8vICAgICBjb25zb2xlLmxvZyAoIHRhcmdldCApXG4gICAgIH0pXG59XG5lbHNlXG57XG4gICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyICggXCJtb3VzZW1vdmVcIiwgZXZlbnQgPT5cbiAgICAge1xuICAgICAgICAgIC8vY29uc3QgdGFyZ2V0ID0gYXJlYS5mY2FudmFzLmZpbmRUYXJnZXQgKCBldmVudCwgdHJ1ZSApXG4gICAgICAgICAgLy9pZiAoIHRhcmdldCApXG4gICAgICAgICAgLy8gICAgIGNvbnNvbGUubG9nICggdGFyZ2V0IClcbiAgICAgfSlcbn1cblxuLy8gI2VuZHJlZ2lvblxuXG4vLyAjcmVnaW9uIE1FTlVcblxuZXhwb3J0IGNvbnN0IG1lbnUgPSB1aS5tYWtlIDx1aS5TaWRlTWVudSwgJFNpZGVNZW51PiAoe1xuICAgICBjb250ZXh0ICAgICAgOiBDT05URVhUX1VJLFxuICAgICB0eXBlICAgICAgICAgOiBcInNpZGUtbWVudVwiLFxuICAgICBpZCAgICAgICAgICAgOiBcIm1lbnVcIixcbiAgICAgaGFzTWFpbkJ1dHRvbjogdHJ1ZSxcbiAgICAgZGlyZWN0aW9uICAgIDogXCJsclwiXG59KVxuZG9jdW1lbnQuYm9keS5hcHBlbmQgKCAuLi4gbWVudS5nZXRIdG1sICgpIClcblxuLy8gI2VuZHJlZ2lvblxuXG4vLyAjcmVnaW9uIFBBTkVMXG5cbnZhciBkaXJlY3Rpb24gPSBcInJsXCIgYXMgXCJybFwiIHwgXCJsclwiIHwgXCJ0YlwiIHwgXCJidFwiXG5cbmV4cG9ydCBjb25zdCBwYW5lbCA9IHVpLm1ha2UgPHVpLlNpZGVNZW51LCAkU2lkZU1lbnU+ICh7XG4gICAgIGNvbnRleHQgICAgICA6IENPTlRFWFRfVUksXG4gICAgIHR5cGUgICAgICAgICA6IFwic2lkZS1tZW51XCIsXG4gICAgIGlkICAgICAgICAgICA6IHVuZGVmaW5lZCxcbiAgICAgZGlyZWN0aW9uICAgIDogZGlyZWN0aW9uLFxuICAgICBoYXNNYWluQnV0dG9uOiB0cnVlLFxuXG4gICAgIGhlYWRlcjoge1xuICAgICAgICAgIGNvbnRleHQgIDogQ09OVEVYVF9VSSxcbiAgICAgICAgICB0eXBlICAgICA6IFwidG9vbGJhclwiLFxuICAgICAgICAgIGlkICAgICAgIDogdW5kZWZpbmVkLFxuICAgICAgICAgIHRpdGxlICAgIDogXCJUaXRsZSAuLlwiLFxuICAgICAgICAgIGRpcmVjdGlvbjogZGlyZWN0aW9uID09IFwibHJcIiB8fCBkaXJlY3Rpb24gPT0gXCJybFwiID8gXCJ0YlwiIDogXCJsclwiLFxuXG4gICAgICAgICAgYnV0dG9uczogW3tcbiAgICAgICAgICAgICAgIGNvbnRleHQgOiBDT05URVhUX1VJLFxuICAgICAgICAgICAgICAgdHlwZSAgICA6IFwiYnV0dG9uXCIsXG4gICAgICAgICAgICAgICBpZCAgICAgIDogXCJjb25zb2xlXCIsXG4gICAgICAgICAgICAgICBpY29uICAgIDogXCLimqBcIixcbiAgICAgICAgICAgICAgIHRleHQgICAgOiBcIlwiLFxuICAgICAgICAgICAgICAgaGFuZGxlT246IFwiKlwiLFxuICAgICAgICAgICAgICAgY29tbWFuZCA6IFwicGFjay12aWV3XCJcbiAgICAgICAgICB9LHtcbiAgICAgICAgICAgICAgIGNvbnRleHQgOiBDT05URVhUX1VJLFxuICAgICAgICAgICAgICAgdHlwZSAgICA6IFwiYnV0dG9uXCIsXG4gICAgICAgICAgICAgICBpZCAgICAgIDogXCJwcm9wZXJ0aWVzXCIsXG4gICAgICAgICAgICAgICBpY29uICAgIDogXCJcIixcbiAgICAgICAgICAgICAgIHRleHQgICAgOiBcInBhbmVsIHByb3BlcnRpZXNcIixcbiAgICAgICAgICAgICAgIGhhbmRsZU9uOiBcIipcIixcbiAgICAgICAgICB9XVxuICAgICB9LFxuXG4gICAgIGNoaWxkcmVuOiBbe1xuICAgICAgICAgIGNvbnRleHQ6IENPTlRFWFRfVUksXG4gICAgICAgICAgdHlwZSAgIDogXCJzbGlkZXNob3dcIixcbiAgICAgICAgICBpZCAgICAgOiBcInBhbmVsLXNsaWRlc2hvd1wiLFxuXG4gICAgICAgICAgY2hpbGRyZW46IFt7XG4gICAgICAgICAgICAgICBjb250ZXh0IDogQ09OVEVYVF9VSSxcbiAgICAgICAgICAgICAgIHR5cGUgICAgOiBcInNraWxsLXZpZXdlclwiLFxuICAgICAgICAgICAgICAgaWQgICAgICA6IFwic2xpZGUtc2tpbGxcIixcbiAgICAgICAgICAgICAgIHBvc2l0aW9uOiBcImxlZnRcIlxuICAgICAgICAgIH0se1xuICAgICAgICAgICAgICAgY29udGV4dCA6IENPTlRFWFRfVUksXG4gICAgICAgICAgICAgICB0eXBlICAgIDogXCJwZXJzb24tdmlld2VyXCIsXG4gICAgICAgICAgICAgICBpZCAgICAgIDogXCJzbGlkZS1wZXJzb25cIixcbiAgICAgICAgICAgICAgIHBvc2l0aW9uOiBcImxlZnRcIlxuICAgICAgICAgIH1dXG4gICAgIH1dXG59KVxuXG5kb2N1bWVudC5ib2R5LmFwcGVuZCAoIC4uLiBwYW5lbC5nZXRIdG1sICgpIClcblxuLy8gUGFubmVscyBjb21tYW5kc1xuXG5jb25zdCBzbGlkZUluZm9zID0gdWkucGljayA8dWkuU2tpbGxWaWV3ZXI+ICggXCJza2lsbC12aWV3ZXJcIiwgXCJzbGlkZS1za2lsbFwiIClcblxuY29tbWFuZCAoIFwib3Blbi1wYW5lbFwiLCAoIG5hbWUsIC4uLiBjb250ZW50ICkgPT5cbntcbiAgICAgLy8gaWYgKCBuYW1lIClcbiAgICAgLy8gICAgICBzbGlkZXNob3cuc2hvdyAoIG5hbWUsIC4uLiBjb250ZW50IClcbiAgICAgLy8gZWxzZVxuICAgICAvLyAgICAgIHBhbmVsLm9wZW4gKClcbn0pXG5cbmNvbW1hbmQgKCBcIm9wZW4taW5mb3MtcGFuZWxcIiwgKCBlICkgPT5cbntcbiAgICAgY29uc3QgYXNwZWN0ID0gZ2V0QXNwZWN0ICggdWkuQXJlYS5jdXJyZW50RXZlbnQudGFyZ2V0IClcblxuICAgICBpZiAoIGFzcGVjdCApXG4gICAgIHtcbiAgICAgICAgICBjb25zdCBza2lsbCA9IGRiLm5vZGUgKCBhc3BlY3QuY29uZmlnLnR5cGUsIGFzcGVjdC5jb25maWcuaWQgKVxuICAgICAgICAgIGlmICggc2tpbGwgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHNsaWRlSW5mb3MuZGlzcGxheSAoIHNraWxsIGFzIGFueSApXG4gICAgICAgICAgICAgICBwYW5lbC5vcGVuICgpXG4gICAgICAgICAgfVxuICAgICB9XG59KVxuXG5jb21tYW5kICggXCJjbG9zZS1wYW5lbFwiICwgKCkgPT5cbntcbiAgICAgcGFuZWwuY2xvc2UgKClcbn0pXG5cbi8vICNlbmRyZWdpb25cblxuLy8gI3JlZ2lvbiBBUFBMSUNBVElPTlxuXG5jb21tYW5kICggXCJvcGVuLW1lbnVcIiwgKCkgPT5cbntcbiAgICAgcGFuZWwuY2xvc2UgKClcbiAgICAgY29udGV4dHVhbE1lbnUuaGlkZSAoKVxufSlcbmNvbW1hbmQgKCBcIm9wZW4tcGFuZWxcIiwgKCkgPT5cbntcbiAgICAgbWVudS5jbG9zZSAoKVxuICAgICBjb250ZXh0dWFsTWVudS5oaWRlICgpXG59KVxuXG5leHBvcnQgZnVuY3Rpb24gd2lkdGggKClcbntcbiAgICAgcmV0dXJuIGFyZWEuZmNhbnZhcy5nZXRXaWR0aCAoKVxufVxuXG5leHBvcnQgZnVuY3Rpb24gaGVpZ2h0ICgpXG57XG4gICAgIHJldHVybiBhcmVhLmZjYW52YXMuZ2V0SGVpZ2h0ICgpXG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZWZyZXNoICgpXG57XG4gICAgIC8vJGFyZWEuc2V0Wm9vbSAoMC4xKVxuICAgICBhcmVhLmZjYW52YXMucmVxdWVzdFJlbmRlckFsbCAoKVxufVxuXG4vLyAjZW5kcmVnaW9uXG4iLCIvLy8gPHJlZmVyZW5jZSB0eXBlcz1cImZha2VyXCIgLz5cbmRlY2xhcmUgY29uc3QgZmFrZXI6IEZha2VyLkZha2VyU3RhdGljXG5cbmltcG9ydCAqIGFzIGFwcCBmcm9tIFwiLi4vQXBwbGljYXRpb24vaW5kZXguanNcIlxuXG5jb25zdCByYW5kb21JbnQgPSAobWluOiBudW1iZXIsIG1heDogbnVtYmVyKSA9Plxue1xuICAgICByZXR1cm4gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogKG1heCAtIG1pbiArIDEpKSArIG1pbjtcbn1cblxuY29uc3QgYXJlYSA9IGFwcC5hcmVhXG5jb25zdCB2aWV3ID0gYXJlYS5jcmVhdGVWaWV3ICggXCJjb21ww6l0YW5jZXNcIiApXG5hcmVhLnVzZSAoIHZpZXcgKVxuXG4vLyBJY2kgb24gYWpvdXRlIGRlcyBwZXJzb25uZXMgw6AgbOKAmWFwcGxpY2F0aW9uLlxuXG5jb25zdCBwZXJzb25OYW1lcyA9IFtdXG5mb3IgKCB2YXIgaSA9IDEgOyBpIDw9IDIwIDsgaSsrIClcbntcbiAgICAgYXBwLm5vZGUgPCRQZXJzb24+ICh7XG4gICAgICAgICAgY29udGV4dCAgOiBDT05URVhUX0RBVEEsXG4gICAgICAgICAgdHlwZSAgICAgOiBcInBlcnNvblwiLFxuICAgICAgICAgIGlkICAgICAgIDogXCJ1c2VyXCIgKyBpLFxuICAgICAgICAgIGZpcnN0TmFtZTogZmFrZXIubmFtZS5maXJzdE5hbWUgKCksXG4gICAgICAgICAgbGFzdE5hbWUgOiBmYWtlci5uYW1lLmxhc3ROYW1lICgpLFxuICAgICAgICAgIGF2YXRhciAgIDogYC4vYXZhdGFycy9mICgke2l9KS5qcGdgLFxuICAgICAgICAgIGlzQ2FwdGFpbjogcmFuZG9tSW50ICgwLDQpID09IDEgLy9pICUgNCA9PSAwLFxuICAgICB9KVxuXG4gICAgIGFwcC5ub2RlIDwkUGVyc29uPiAoe1xuICAgICAgICAgIGNvbnRleHQgIDogQ09OVEVYVF9EQVRBLFxuICAgICAgICAgIHR5cGUgICAgIDogXCJwZXJzb25cIixcbiAgICAgICAgICBpZCAgICAgICA6IFwidXNlclwiICsgKDIwICsgaSksXG4gICAgICAgICAgZmlyc3ROYW1lOiBmYWtlci5uYW1lLmZpcnN0TmFtZSAoKSxcbiAgICAgICAgICBsYXN0TmFtZSA6IGZha2VyLm5hbWUubGFzdE5hbWUgKCksXG4gICAgICAgICAgYXZhdGFyICAgOiBgLi9hdmF0YXJzL2ggKCR7aX0pLmpwZ2AsXG4gICAgICAgICAgaXNDYXB0YWluOiByYW5kb21JbnQgKDAsNCkgPT0gMSAvLyAoMjAgKyBpKSAlIDQgPT0gMCxcbiAgICAgfSlcblxuICAgICBwZXJzb25OYW1lcy5wdXNoICggXCJ1c2VyXCIgKyBpLCBcInVzZXJcIiArICgyMCArIGkpIClcblxuICAgICAvLyBhcmVhLmFkZCAoIFwicGVyc29uXCIsIFwidXNlclwiICsgaSApXG4gICAgIC8vIGFyZWEuYWRkICggXCJwZXJzb25cIiwgXCJ1c2VyXCIgKyAoaSArIDIwKSApXG59XG5cbi8vIEJhZGdlc1xuXG4vLyBodHRwczovL2RyaXZlLmdvb2dsZS5jb20vZHJpdmUvZm9sZGVycy8xS3dXbDlHX0E4djkxTkxYQXBqWkdIQ2ZueF9tbmZNRTRcbi8vIGh0dHBzOi8vcmVjb25uYWl0cmUub3BlbnJlY29nbml0aW9uLm9yZy9yZXNzb3VyY2VzL1xuLy8gaHR0cHM6Ly93d3cubGV0dWRpYW50LmZyL2VkdWNwcm9zL2FjdHVhbGl0ZS9sZXMtb3Blbi1iYWRnZXMtdW4tY29tcGxlbWVudC1hdXgtZGlwbG9tZXMtdW5pdmVyc2l0YWlyZXMuaHRtbFxuXG4vLyBodHRwczovL3d3dy5lY2hvc2NpZW5jZXMtbm9ybWFuZGllLmZyL2NvbW11bmF1dGVzL2xlLWRvbWUvYXJ0aWNsZXMvYmFkZ2UtZG9tZVxuXG5jb25zdCBiYWRnZVByZXNldHMgPSB7IC8vIFBhcnRpYWwgPCRCYWRnZT5cbiAgICAgZGVmYXVsdCAgICAgICA6IHsgaWQ6IFwiZGVmYXVsdFwiICAgICAgLCBlbW9qaTogXCLwn6aBXCIgfSxcbiAgICAgaGF0ICAgICAgICAgICA6IHsgaWQ6IFwiaGF0XCIgICAgICAgICAgLCBlbW9qaTogXCLwn46pXCIgfSxcbiAgICAgc3RhciAgICAgICAgICA6IHsgaWQ6IFwic3RhclwiICAgICAgICAgLCBlbW9qaTogXCLirZBcIiB9LFxuICAgICBjbG90aGVzICAgICAgIDogeyBpZDogXCJjbG90aGVzXCIgICAgICAsIGVtb2ppOiBcIvCfkZVcIiB9LFxuICAgICBlY29sb2d5ICAgICAgIDogeyBpZDogXCJlY29sb2d5XCIgICAgICAsIGVtb2ppOiBcIvCfkqdcIiB9LFxuICAgICBwcm9ncmFtbWluZyAgIDogeyBpZDogXCJwcm9ncmFtbWluZ1wiICAsIGVtb2ppOiBcIvCfkr5cIiB9LFxuICAgICBjb21tdW5pY2F0aW9uIDogeyBpZDogXCJjb21tdW5pY2F0aW9uXCIsIGVtb2ppOiBcIvCfk6JcIiB9LFxuICAgICBjb25zdHJ1Y3Rpb24gIDogeyBpZDogXCJjb25zdHJ1Y3Rpb25cIiAsIGVtb2ppOiBcIvCflKhcIiB9LFxuICAgICBiaW9sb2d5ICAgICAgIDogeyBpZDogXCJiaW9sb2d5XCIgICAgICAsIGVtb2ppOiBcIvCflKxcIiB9LFxuICAgICByb2JvdGljICAgICAgIDogeyBpZDogXCJyb2JvdGljXCIgICAgICAsIGVtb2ppOiBcIvCfpJZcIiB9LFxuICAgICBnYW1lICAgICAgICAgIDogeyBpZDogXCJnYW1lXCIgICAgICAgICAsIGVtb2ppOiBcIvCfpKFcIiB9LFxuICAgICBtdXNpYyAgICAgICAgIDogeyBpZDogXCJtdXNpY1wiICAgICAgICAsIGVtb2ppOiBcIvCfpYFcIiB9LFxuICAgICBsaW9uICAgICAgICAgIDogeyBpZDogXCJsaW9uXCIgICAgICAgICAsIGVtb2ppOiBcIvCfpoFcIiB9LFxuICAgICB2b2x0YWdlICAgICAgIDogeyBpZDogXCJ2b2x0YWdlXCIgICAgICAsIGVtb2ppOiBcIuKaoVwiIH0sXG59XG5cbmZvciAoIGNvbnN0IG5hbWUgaW4gYmFkZ2VQcmVzZXRzIClcbiAgICAgYXBwLm5vZGUgKHsgY29udGV4dDogQ09OVEVYVF9EQVRBLCB0eXBlOiBcImJhZGdlXCIsIC4uLiBiYWRnZVByZXNldHMgW25hbWVdIH0pXG5cbi8vIFNraWxsc1xuXG5mb3IgKCBjb25zdCBuYW1lIGluIGJhZGdlUHJlc2V0cyApXG57XG4gICAgIGNvbnN0IHBlb3BsZSA9IFtdIGFzICRQZXJzb24gW11cblxuICAgICBmb3IgKCB2YXIgaiA9IHJhbmRvbUludCAoIDAsIDYgKSA7IGogPiAwIDsgai0tIClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IG5hbWUgPSBwZXJzb25OYW1lcy5zcGxpY2UgKCByYW5kb21JbnQgKCAxLCBwZXJzb25OYW1lcy5sZW5ndGggKSwgMSApIFswXVxuXG4gICAgICAgICAgaWYgKCBuYW1lIClcbiAgICAgICAgICAgICAgIHBlb3BsZS5wdXNoICggYXBwLm5vZGUgPCRQZXJzb24+ICggXCJwZXJzb25cIiwgbmFtZSApIClcbiAgICAgfVxuXG4gICAgIGFwcC5ub2RlIDwkU2tpbGw+ICh7XG4gICAgICAgICAgY29udGV4dDogQ09OVEVYVF9EQVRBLFxuICAgICAgICAgIHR5cGUgICA6IFwic2tpbGxcIixcbiAgICAgICAgICBpZCAgICAgOiBuYW1lLFxuICAgICAgICAgIGljb24gICA6IG5hbWUsXG4gICAgICAgICAgaXRlbXMgIDogcGVvcGxlXG4gICAgIH0pXG5cbn1cblxuLy9cblxuZm9yICggY29uc3QgbmFtZSBpbiBiYWRnZVByZXNldHMgKVxuICAgICBhcmVhLmFkZCAoIFwic2tpbGxcIiwgbmFtZSApXG5cbi8vIE5vdGVzXG5cbi8vIGNvbnN0IG5vdGUgPSAgbmV3IEIuTm90ZSAoe1xuLy8gICAgICB0ZXh0OiBcIkEgbm90ZSAuLi5cIixcbi8vIH0pXG4vLyBhcmVhLmFkZCAoIEFzcGVjdC5jcmVhdGUgKCBub3RlICkgKVxuXG5cbmFyZWEucGFjayAoKVxuYXJlYS56b29tICgpXG5cblxuLy8gQ2x1c3RlciAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy9cbi8vIGNvbnN0IHQxID0gbmV3IGZhYnJpYy5UZXh0Ym94ICggXCJFZGl0YWJsZSA/XCIsIHtcbi8vICAgICAgdG9wOiA1MCxcbi8vICAgICAgbGVmdDogMzAwLFxuLy8gICAgICBmb250U2l6ZTogMzAsXG4vLyAgICAgIHNlbGVjdGFibGU6IHRydWUsXG4vLyAgICAgIGVkaXRhYmxlOiB0cnVlLFxuLy8gICAgICBvcmlnaW5YOiBcImNlbnRlclwiLFxuLy8gICAgICBvcmlnaW5ZOiBcImNlbnRlclwiLFxuLy8gfSlcbi8vIGNvbnN0IHIxID0gbmV3IGZhYnJpYy5SZWN0ICh7XG4vLyAgICAgIHRvcCAgIDogMCxcbi8vICAgICAgbGVmdCAgOiAzMDAsXG4vLyAgICAgIHdpZHRoIDogNTAsXG4vLyAgICAgIGhlaWdodDogNTAsXG4vLyAgICAgIGZpbGwgIDogXCJibHVlXCIsXG4vLyAgICAgIHNlbGVjdGFibGU6IHRydWUsXG4vLyAgICAgIG9yaWdpblg6IFwiY2VudGVyXCIsXG4vLyAgICAgIG9yaWdpblk6IFwiY2VudGVyXCIsXG4vLyB9KVxuLy8gJGFwcC5fbGF5b3V0LmFyZWEuYWRkICh0MSlcbi8vICRhcHAuX2xheW91dC5hcmVhLmFkZCAocjEpXG4vLyB0MVtcImNsdXN0ZXJcIl0gPSBbIHIxIF1cbi8vIHIxW1wiY2x1c3RlclwiXSA9IFsgdDEgXVxuXG4iXSwibmFtZXMiOlsiTm9kZSIsIkZhY3RvcnkiLCJHZW9tZXRyeSIsImRiIiwiZGIubm9kZSIsIkdlb21ldHJ5LnBhY2tFbmNsb3NlIiwiZGVmYXVsdENvbmZpZyIsImRyYWdnYWJsZSIsIlVpLmRyYWdnYWJsZSIsIkNzcy5nZXRVbml0Iiwibm9kZSIsImFzcGVjdC5nZXRBc3BlY3QiLCJmYWN0b3J5Iiwibm9ybWFsaXplIiwiQ29udGFpbmVyIiwiU3ZnLmNyZWF0ZVN2Z1NoYXBlIiwiY29tbWFuZCIsInVpLmNvbW1hbmQiLCJ1aS5BcmVhIiwidWkuUmFkaWFsTWVudSIsInVpLm1ha2UiLCJ1aS5waWNrIiwi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RyxHQUFHLElBQUssQ0FBQztZQUNsQyxDQUFDLEVBQUUsQ0FBRSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsSUFBSyxDQUFDO1NBQzFCLENBQUM7SUFDUCxDQUFDO0lBRUQsU0FBUyxhQUFhLENBQUcsQ0FBUyxFQUFFLENBQVMsRUFBRSxDQUFTO1FBRW5ELE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxHQUFHLENBQUMsQ0FBQTtRQUNqQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsR0FBRyxDQUFDLENBQUE7UUFDakMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLEdBQUcsQ0FBQyxDQUFBO1FBRWpDLE1BQU0sRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQ1IsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQ1osRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQ1osRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQ1osRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQ1osRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBRVosRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxFQUNoQyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxFQUNyQyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxFQUVyQyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxFQUN0QixFQUFFLEdBQUcsQ0FBRSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEtBQU8sRUFBRSxHQUFHLENBQUMsQ0FBRSxHQUFHLEVBQUUsRUFDNUMsRUFBRSxHQUFHLENBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxJQUFLLEVBQUUsRUFDL0IsRUFBRSxHQUFHLENBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxLQUFPLEVBQUUsR0FBRyxDQUFDLENBQUUsR0FBRyxFQUFFLEVBQzVDLEVBQUUsR0FBRyxDQUFFLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsSUFBSyxFQUFFLEVBRS9CLENBQUMsR0FBSSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUMxQixDQUFDLEdBQUksQ0FBQyxJQUFLLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUUsRUFDbkMsQ0FBQyxHQUFJLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxFQUNoQyxDQUFDLEdBQUksRUFBRyxDQUFDLEdBQUcsQ0FBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFFLEtBQU8sQ0FBQyxHQUFHLENBQUMsQ0FBRSxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUUsQ0FBQTtRQUVsRixPQUFPO1lBQ0YsQ0FBQyxFQUFFLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUM7WUFDbkIsQ0FBQyxFQUFFLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUM7WUFDbkIsQ0FBQyxFQUFFLENBQUM7U0FDUixDQUFDO0lBQ1AsQ0FBQzs7SUNsTUQ7QUFFQSxJQUlBLFNBQVMsS0FBSyxDQUFHLENBQVMsRUFBRSxDQUFTLEVBQUUsQ0FBUztRQUUzQyxJQUFJLEVBQUUs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
