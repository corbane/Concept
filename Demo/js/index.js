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
    function getNode() {
        if (arguments.length == 0)
            return;
        if (arguments.length == 1)
            return Data.get(normalize$1(arguments[0]));
        else
            return Data.get(CONTEXT$1, ...arguments);
    }
    function setNode(node) {
        Data.set(normalize$1(node));
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
                const node = getNode(...arguments);
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
    }

    /// <reference path="../Data/index.ts" />
    const CONTEXT$2 = "concept-ui";
    const db$1 = new Database();
    const factory$1 = new Factory(db$1);
    const inStock = function () {
        const arg = arguments.length == 1
            ? normalize$2(arguments[0])
            : normalize$2([...arguments]);
        const path = factory$1.getPath(arg);
        return factory$1._inStock(path);
    };
    const pick = function (...rest) {
        const arg = arguments.length == 1
            ? normalize$2(arguments[0])
            : normalize$2([...arguments]);
        const path = factory$1.getPath(arg);
        return factory$1._pick(path);
    };
    const make = function () {
        const arg = arguments.length == 1
            ? normalize$2(arguments[0])
            : normalize$2([...arguments]);
        const path = factory$1.getPath(arg);
        if (isNode(arg))
            var data = arg;
        return factory$1._make(path, data);
    };
    const set = function () {
        const arg = normalize$2(arguments[0]);
        if (arguments.length == 1)
            db$1.set(arg);
        else
            db$1.set(arg, normalize$2(arguments[1]));
    };
    const define = function (ctor, ...rest) {
        const arg = rest.length == 1
            ? normalize$2(rest[0])
            : normalize$2([...rest]);
        const path = factory$1.getPath(arg);
        factory$1._define(ctor, path);
    };
    function isNode(obl) {
        return typeof obl == "object" && !Array.isArray(obl);
    }
    function normalize$2(arg) {
        if (Array.isArray(arg)) {
            if (arg[0] !== CONTEXT$2)
                arg.unshift(CONTEXT$2);
        }
        else if (typeof arg == "object") {
            if ("context" in arg) {
                if (arg.context !== CONTEXT$2)
                    throw "Bad context value";
            }
            else {
                arg.context = CONTEXT$2;
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
                else {
                    throw `Unable to add a child of type ${typeof e}`;
                }
                children[e.data.id] = e;
                slot.append(...e.getHtml());
                new_child.push(e);
            }
            if (new_child.length > 0)
                this.onChildrenAdded(new_child);
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
    define(Slideshow, ["slideshow"]);
    define(Container, ["slide"]);

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
    class SideMenu extends Container {
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

    class SkillViewer extends Component {
        display(skill) {
            const target = xnode("div", { class: "people" });
            for (const name of skill.items) {
                const person = getNode(name);
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
    //export type MenuCommands = {
    //     "open-menu": () => void,
    //     "close-menu": () => void,
    //}
    //addCommand ( "open-menu", () => { menu.open () })
    //addCommand ( "close-menu", () => { menu.close () })

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

    //import * as Aspect from "./Aspect/index.js"
    //import { addCommand, runCommand } from "./command.js"
    //import { command } from "./command.js"
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
    // CLICK EVENTS
    // area.onTouchObject = ( shape ) =>
    // {
    //      run Command ( "zoom-to", shape )
    // }
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

    command("open-menu", () => {
        panel.close();
        contextualMenu.hide();
    });
    command("open-panel", () => {
        menu.close();
        contextualMenu.hide();
    });
    const slideshow = pick("slideshow", "panel-slideshow");
    const slideInfos = pick("skill-viewer", "slide-skill");
    command("open-panel", (name, ...content) => {
        // if ( name )
        //      slideshow.show ( name, ... content )
        // else
        //      panel.open ()
    });
    command("open-infos-panel", (e) => {
        const aspect = getAspect(Area.currentEvent.target);
        if (aspect) {
            const skill = getNode({
                type: aspect.config.type,
                id: aspect.config.id
            });
            if (skill) {
                slideInfos.display(skill);
                panel.open();
            }
        }
    });
    command("close-panel", () => {
        panel.close();
    });
    // AREA EVENTS
    area.onDoubleTouchObject = (shape) => {
        if (shape.config.onTouch != undefined)
            shape.config.onTouch(shape);
    };
    area.onTouchArea = (x, y) => {
        command("open-contextal-menu").run();
        //run Command ( "open-contextal-menu", x, y )
    };
    // AREA COMMANDS
    //export type AreaCommands =
    //{
    //     "add-skill"           : ( title: string ) => void,
    //     "add-person"          : ( name: string ) => void,
    //     "zoom-extends"        : () => void,
    //     "zoom-to"             : ( shape: Aspect.Shape ) => void,
    //     "pack-view"           : () => void,
    //     "open-contextal-menu" : ( x: number, y: number ) => void,
    //     "close-contextal-menu": () => void,
    //}
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
            const entity = getNode(this.config.data);
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
            const data = getNode({
                type: "badge",
                id: skill.icon,
            });
            const badge = getAspect(data);
            //badge.init ()
            badge.attach(aspect);
        },
        onTouch(shape) {
            // const skill = getNode <$Skill> ({
            //      type: shape.config.type,
            //      id  : shape.config.id
            // })
            // command ( "open-infos-panel", skill ).run ()
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
        setNode({
            type: "person",
            id: "user" + i,
            firstName: faker.name.firstName(),
            lastName: faker.name.lastName(),
            avatar: `./avatars/f (${i}).jpg`,
            isCaptain: randomInt(0, 4) == 1 //i % 4 == 0,
        });
        setNode({
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
        setNode(Object.assign({ context: "concept-data", type: "badge" }, badgePresets[name]));
    // Skills
    for (const name in badgePresets) {
        const people = [];
        for (var j = randomInt(0, 6); j > 0; j--) {
            const name = personNames.splice(randomInt(1, personNames.length), 1)[0];
            if (name)
                people.push(getNode("person", name));
        }
        setNode({
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzIjpbIi4uLy4uL0xpYi9nZW9tZXRyeS9kaXN0cmlidXRlLnRzIiwiLi4vLi4vTGliL2dlb21ldHJ5L2QzLWVuY2xvc2UudHMiLCIuLi8uLi9MaWIvZ2VvbWV0cnkvZDMtcGFjay50cyIsIi4uLy4uL0xpYi9jc3MvdW5pdC50cyIsIi4uLy4uL0RhdGEvRGF0YS9ub2RlLnRzIiwiLi4vLi4vRGF0YS9EYi9kYXRhLXRyZWUudHMiLCIuLi8uLi9EYXRhL0RiL2RiLnRzIiwiLi4vLi4vRGF0YS9EYi9mYWN0b3J5LnRzIiwiLi4vLi4vVWkvQmFzZS94bm9kZS50cyIsIi4uLy4uL1VpL0Jhc2UvZHJhZ2dhYmxlLnRzIiwiLi4vLi4vVWkvQmFzZS9kb20udHMiLCIuLi8uLi9VaS9CYXNlL2V4cGVuZGFibGUudHMiLCIuLi8uLi9VaS9CYXNlL3N3aXBlYWJsZS50cyIsIi4uLy4uL0FwcGxpY2F0aW9uL0FzcGVjdC9nZW9tZXRyeS50cyIsIi4uLy4uL0FwcGxpY2F0aW9uL0FzcGVjdC9FbGVtZW50L3NoYXBlLnRzIiwiLi4vLi4vQXBwbGljYXRpb24vQXNwZWN0L2RiLnRzIiwiLi4vLi4vQXBwbGljYXRpb24vZGF0YS50cyIsIi4uLy4uL1VpL0NvbXBvbmVudC9BcmVhL2FyZWEudHMiLCIuLi8uLi9VaS9jb21tYW5kLnRzIiwiLi4vLi4vVWkvQmFzZS9Db21wb25lbnQvaW5kZXgudHN4IiwiLi4vLi4vVWkvZGIudHMiLCIuLi8uLi9VaS9CYXNlL0NvbnRhaW5lci9pbmRleC50c3giLCIuLi8uLi9VaS9Db21wb25lbnQvQnV0dG9uL2h0bWwudHN4IiwiLi4vLi4vVWkvQ29tcG9uZW50L0J1dHRvbi9pbmRleC50c3giLCIuLi8uLi9VaS9Db21wb25lbnQvU2xpZGVTaG93L2luZGV4LnRzeCIsIi4uLy4uL1VpL0NvbXBvbmVudC9MaXN0L2luZGV4LnRzeCIsIi4uLy4uL1VpL0NvbXBvbmVudC9Ub29sYmFyL2luZGV4LnRzeCIsIi4uLy4uL1VpL0Jhc2Uvc2Nyb2xsYWJsZS50cyIsIi4uLy4uL1VpL0NvbXBvbmVudC9TaWRlTWVudS9pbmRleC50c3giLCIuLi8uLi9VaS9CYXNlL1N2Zy9pbmRleC50c3giLCIuLi8uLi9VaS9Db21wb25lbnQvQ2lyY3VsYXJNZW51L2luZGV4LnRzeCIsIi4uLy4uL1VpL0NvbXBvbmVudC9QYW5lbC9wZXJzb24udHN4IiwiLi4vLi4vVWkvQ29tcG9uZW50L1BhbmVsL3NraWxsLnRzeCIsIi4uLy4uL0FwcGxpY2F0aW9uL21lbnUudHMiLCIuLi8uLi9BcHBsaWNhdGlvbi9wYW5lbC50cyIsIi4uLy4uL0FwcGxpY2F0aW9uL2FyZWEudHMiLCIuLi8uLi9BcHBsaWNhdGlvbi9jb21tYW5kLnRzIiwiLi4vLi4vQXBwbGljYXRpb24vQXNwZWN0L0VsZW1lbnQvYmFkZ2UudHMiLCIuLi8uLi9BcHBsaWNhdGlvbi9Bc3BlY3QvRWxlbWVudC9ncm91cC50cyIsIi4uLy4uL0FwcGxpY2F0aW9uL0FzcGVjdC9pbmRleC50cyIsIi4uL2luZGV4LnRzIl0sInNvdXJjZXNDb250ZW50IjpbIlxuXG5leHBvcnQgdHlwZSBSYWRpYWxPcHRpb24gPSB7XG4gICAgciAgICAgICAgOiBudW1iZXIsXG4gICAgY291bnQgICAgOiBudW1iZXIsXG4gICAgcGFkZGluZz8gOiBudW1iZXIsXG4gICAgcm90YXRpb24/OiBudW1iZXIsXG59XG5cbmV4cG9ydCB0eXBlIFJhZGlhbERlZmluaXRpb24gPSBSZXF1aXJlZCA8UmFkaWFsT3B0aW9uPiAmIHtcbiAgICBjeCAgICA6IG51bWJlcixcbiAgICBjeSAgICA6IG51bWJlcixcbiAgICB3aWR0aCA6IG51bWJlcixcbiAgICBoZWlnaHQ6IG51bWJlcixcbiAgICBwb2ludHM6IFBhcnQgW10sXG59XG5cbnR5cGUgUGFydCA9IHtcbiAgICB4IDogbnVtYmVyXG4gICAgeSA6IG51bWJlclxuICAgIGEgOiBudW1iZXJcbiAgICBhMTogbnVtYmVyXG4gICAgYTI6IG51bWJlclxuICAgIGNob3JkPzoge1xuICAgICAgICB4MSAgICA6IG51bWJlclxuICAgICAgICB5MSAgICA6IG51bWJlclxuICAgICAgICB4MiAgICA6IG51bWJlclxuICAgICAgICB5MiAgICA6IG51bWJlclxuICAgICAgICBsZW5ndGg6IG51bWJlclxuICAgIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFJhZGlhbERpc3RyaWJ1dGlvbiAoIG9wdGlvbnM6IFJhZGlhbE9wdGlvbiApXG57XG4gICAgY29uc3QgeyBQSSwgY29zLCBzaW4gfSA9IE1hdGhcblxuICAgIGNvbnN0IHIgICAgICAgID0gb3B0aW9ucy5yICAgICAgICB8fCAzMFxuICAgIGNvbnN0IGNvdW50ICAgID0gb3B0aW9ucy5jb3VudCAgICB8fCAxMFxuICAgIGNvbnN0IHJvdGF0aW9uID0gb3B0aW9ucy5yb3RhdGlvbiB8fCAwXG5cbiAgICBjb25zdCBwb2ludHMgPSBbXSBhcyBQYXJ0IFtdXG5cbiAgICBjb25zdCBhICAgICA9IDIgKiBQSSAvIGNvdW50XG4gICAgY29uc3QgY2hvcmQgPSAyICogciAqIHNpbiAoIGEgKiAwLjUgKVxuICAgIGNvbnN0IHNpemUgID0gciAqIDQgKyBjaG9yZFxuICAgIGNvbnN0IGMgICAgID0gc2l6ZSAvIDJcblxuICAgIGZvciAoIHZhciBpID0gMDsgaSA8IGNvdW50OyArK2kgKVxuICAgIHtcbiAgICAgICAgY29uc3Qgc3RhcnQgID0gYSAqIGkgKyByb3RhdGlvblxuICAgICAgICBjb25zdCBtaWRkbGUgPSBzdGFydCArIGEgKiAwLjVcbiAgICAgICAgY29uc3QgZW5kICAgID0gc3RhcnQgKyBhXG5cbiAgICAgICAgcG9pbnRzLnB1c2ggKHtcbiAgICAgICAgICAgIGExICAgOiBzdGFydCxcbiAgICAgICAgICAgIGEgICAgOiBtaWRkbGUsXG4gICAgICAgICAgICBhMiAgIDogZW5kLFxuICAgICAgICAgICAgeCAgICA6IGNvcyAobWlkZGxlKSAqIHIgKyBjLFxuICAgICAgICAgICAgeSAgICA6IHNpbiAobWlkZGxlKSAqIHIgKyBjLFxuICAgICAgICAgICAgY2hvcmQ6IHtcbiAgICAgICAgICAgICAgICB4MTogY29zIChzdGFydCkgKiByICsgYyxcbiAgICAgICAgICAgICAgICB5MTogc2luIChzdGFydCkgKiByICsgYyxcbiAgICAgICAgICAgICAgICB4MjogY29zIChlbmQpICAgKiByICsgYyxcbiAgICAgICAgICAgICAgICB5Mjogc2luIChlbmQpICAgKiByICsgYyxcbiAgICAgICAgICAgICAgICBsZW5ndGg6IGNob3JkXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgY29uc3QgcmVzdWx0OiBSYWRpYWxEZWZpbml0aW9uID0ge1xuICAgICAgICByLFxuICAgICAgICBjb3VudCxcbiAgICAgICAgcm90YXRpb24sXG4gICAgICAgIHBhZGRpbmc6IG9wdGlvbnMucGFkZGluZyB8fCAwLFxuICAgICAgICBjeCAgICAgOiBjLFxuICAgICAgICBjeSAgICAgOiBjLFxuICAgICAgICB3aWR0aCAgOiBzaXplLFxuICAgICAgICBoZWlnaHQgOiBzaXplLFxuICAgICAgICBwb2ludHNcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0XG59XG4iLCIvLyBodHRwczovL29ic2VydmFibGVocS5jb20vQGQzL2QzLXBhY2tlbmNsb3NlP2NvbGxlY3Rpb249QG9ic2VydmFibGVocS9hbGdvcml0aG1zXG4vLyBodHRwczovL29ic2VydmFibGVocS5jb20vQGQzL2NpcmNsZS1wYWNraW5nXG4vLyBodHRwczovL2dpdGh1Yi5jb20vZDMvZDMtaGllcmFyY2h5L2Jsb2IvbWFzdGVyL3NyYy9wYWNrL2VuY2xvc2UuanNcblxuXG5leHBvcnQgdHlwZSBDaXJjbGUgPSB7XG4gICAgIHg6IG51bWJlcixcbiAgICAgeTogbnVtYmVyLFxuICAgICByOiBudW1iZXJcbn1cblxuY29uc3Qgc2xpY2UgPSBBcnJheS5wcm90b3R5cGUuc2xpY2VcblxuZnVuY3Rpb24gc2h1ZmZsZSA8VD4gKCBhcnJheTogVFtdIClcbntcbiAgICAgdmFyIG0gPSBhcnJheS5sZW5ndGgsXG4gICAgICAgICAgdCxcbiAgICAgICAgICBpOiBudW1iZXJcblxuICAgICB3aGlsZSAoIG0gKVxuICAgICB7XG4gICAgICAgICAgaSA9IE1hdGgucmFuZG9tICgpICogbS0tIHwgMFxuICAgICAgICAgIHQgPSBhcnJheSBbbV1cbiAgICAgICAgICBhcnJheSBbbV0gPSBhcnJheSBbaV1cbiAgICAgICAgICBhcnJheSBbaV0gPSB0XG4gICAgIH1cblxuICAgICByZXR1cm4gYXJyYXlcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGVuY2xvc2UgKCBjaXJjbGVzOiBDaXJjbGVbXSApXG57XG4gICAgIGNpcmNsZXMgPSBzaHVmZmxlICggc2xpY2UuY2FsbCggY2lyY2xlcyApIClcblxuICAgICBjb25zdCBuID0gY2lyY2xlcy5sZW5ndGhcblxuICAgICB2YXIgaSA9IDAsXG4gICAgIEIgPSBbXSxcbiAgICAgcDogQ2lyY2xlLFxuICAgICBlOiBDaXJjbGU7XG5cbiAgICAgd2hpbGUgKCBpIDwgbiApXG4gICAgIHtcbiAgICAgICAgICBwID0gY2lyY2xlcyBbaV1cblxuICAgICAgICAgIGlmICggZSAmJiBlbmNsb3Nlc1dlYWsgKCBlLCBwICkgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGkrK1xuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgQiA9IGV4dGVuZEJhc2lzICggQiwgcCApXG4gICAgICAgICAgICAgICBlID0gZW5jbG9zZUJhc2lzICggQiApXG4gICAgICAgICAgICAgICBpID0gMFxuICAgICAgICAgIH1cbiAgICAgfVxuXG4gICAgIHJldHVybiBlXG59XG5cbmZ1bmN0aW9uIGV4dGVuZEJhc2lzICggQjogQ2lyY2xlW10sIHA6IENpcmNsZSApXG57XG4gICAgIHZhciBpOiBudW1iZXIsXG4gICAgIGo6IG51bWJlclxuXG4gICAgIGlmICggZW5jbG9zZXNXZWFrQWxsICggcCwgQiApIClcbiAgICAgICAgICByZXR1cm4gW3BdXG5cbiAgICAgLy8gSWYgd2UgZ2V0IGhlcmUgdGhlbiBCIG11c3QgaGF2ZSBhdCBsZWFzdCBvbmUgZWxlbWVudC5cbiAgICAgZm9yICggaSA9IDA7IGkgPCBCLmxlbmd0aDsgKytpIClcbiAgICAge1xuICAgICAgICAgIGlmICggZW5jbG9zZXNOb3QgKCBwLCBCIFtpXSApXG4gICAgICAgICAgJiYgZW5jbG9zZXNXZWFrQWxsICggZW5jbG9zZUJhc2lzMiAoIEIgW2ldLCBwICksIEIgKVxuICAgICAgICAgICl7XG4gICAgICAgICAgICAgICByZXR1cm4gWyBCW2ldLCBwIF1cbiAgICAgICAgICB9XG4gICAgIH1cblxuICAgICAvLyBJZiB3ZSBnZXQgaGVyZSB0aGVuIEIgbXVzdCBoYXZlIGF0IGxlYXN0IHR3byBlbGVtZW50cy5cbiAgICAgZm9yICggaSA9IDA7IGkgPCBCLmxlbmd0aCAtIDE7ICsraSApXG4gICAgIHtcbiAgICAgICAgICBmb3IgKCBqID0gaSArIDE7IGogPCBCLmxlbmd0aDsgKytqIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBpZiAoIGVuY2xvc2VzTm90ICAgICggZW5jbG9zZUJhc2lzMiAoIEIgW2ldLCBCIFtqXSAgICApLCBwIClcbiAgICAgICAgICAgICAgICYmIGVuY2xvc2VzTm90ICAgICggZW5jbG9zZUJhc2lzMiAoIEIgW2ldLCBwICAgICAgICApLCBCIFtqXSApXG4gICAgICAgICAgICAgICAmJiBlbmNsb3Nlc05vdCAgICAoIGVuY2xvc2VCYXNpczIgKCBCIFtqXSwgcCAgICAgICAgKSwgQiBbaV0gKVxuICAgICAgICAgICAgICAgJiYgZW5jbG9zZXNXZWFrQWxsKCBlbmNsb3NlQmFzaXMzICggQiBbaV0sIEIgW2pdLCBwICksIEIgKVxuICAgICAgICAgICAgICAgKXtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFsgQlsgaSBdLCBCWyBqIF0sIHAgXTtcbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgIH1cblxuICAgICAvLyBJZiB3ZSBnZXQgaGVyZSB0aGVuIHNvbWV0aGluZyBpcyB2ZXJ5IHdyb25nLlxuICAgICB0aHJvdyBuZXcgRXJyb3I7XG59XG5cbmZ1bmN0aW9uIGVuY2xvc2VzTm90ICggYTogQ2lyY2xlLCBiOiBDaXJjbGUgKVxue1xuICAgICBjb25zdCBkciA9IGEuciAtIGIuclxuICAgICBjb25zdCBkeCA9IGIueCAtIGEueFxuICAgICBjb25zdCBkeSA9IGIueSAtIGEueVxuXG4gICAgIHJldHVybiBkciA8IDAgfHwgZHIgKiBkciA8IGR4ICogZHggKyBkeSAqIGR5O1xufVxuXG5mdW5jdGlvbiBlbmNsb3Nlc1dlYWsgKCBhOiBDaXJjbGUsIGI6IENpcmNsZSApXG57XG4gICAgIHZhciBkciA9IGEuciAtIGIuciArIDFlLTYsXG4gICAgIGR4ID0gYi54IC0gYS54LFxuICAgICBkeSA9IGIueSAtIGEueVxuXG4gICAgIHJldHVybiBkciA+IDAgJiYgZHIgKiBkciA+IGR4ICogZHggKyBkeSAqIGR5XG59XG5cbmZ1bmN0aW9uIGVuY2xvc2VzV2Vha0FsbCAoIGE6IENpcmNsZSwgQjogQ2lyY2xlW10gKVxue1xuICAgICBmb3IgKCB2YXIgaSA9IDA7IGkgPCBCLmxlbmd0aDsgKytpIClcbiAgICAge1xuICAgICAgICAgIGlmICggISBlbmNsb3Nlc1dlYWsgKCBhLCBCW2ldICkgKVxuICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgIH1cbiAgICAgcmV0dXJuIHRydWVcbn1cblxuZnVuY3Rpb24gZW5jbG9zZUJhc2lzICggQjogQ2lyY2xlW10gKVxue1xuICAgICBzd2l0Y2ggKCBCLmxlbmd0aCApXG4gICAgIHtcbiAgICAgICAgICBjYXNlIDE6IHJldHVybiBlbmNsb3NlQmFzaXMxKCBCIFswXSApXG4gICAgICAgICAgY2FzZSAyOiByZXR1cm4gZW5jbG9zZUJhc2lzMiggQiBbMF0sIEIgWzFdIClcbiAgICAgICAgICBjYXNlIDM6IHJldHVybiBlbmNsb3NlQmFzaXMzKCBCIFswXSwgQiBbMV0sIEIgWzJdIClcbiAgICAgfVxufVxuXG5mdW5jdGlvbiBlbmNsb3NlQmFzaXMxICggYTogQ2lyY2xlIClcbntcbiAgICAgcmV0dXJuIHtcbiAgICAgICAgICB4OiBhLngsXG4gICAgICAgICAgeTogYS55LFxuICAgICAgICAgIHI6IGEuclxuICAgICB9O1xufVxuXG5mdW5jdGlvbiBlbmNsb3NlQmFzaXMyICggYTogQ2lyY2xlLCBiOiBDaXJjbGUgKVxue1xuICAgICBjb25zdCB7IHg6IHgxLCB5OiB5MSwgcjogcjEgfSA9IGFcbiAgICAgY29uc3QgeyB4OiB4MiwgeTogeTIsIHI6IHIyIH0gPSBiXG5cbiAgICAgdmFyIHgyMSA9IHgyIC0geDEsXG4gICAgIHkyMSA9IHkyIC0geTEsXG4gICAgIHIyMSA9IHIyIC0gcjEsXG4gICAgIGwgICA9IE1hdGguc3FydCggeDIxICogeDIxICsgeTIxICogeTIxICk7XG5cbiAgICAgcmV0dXJuIHtcbiAgICAgICAgICB4OiAoIHgxICsgeDIgKyB4MjEgLyBsICogcjIxICkgLyAyLFxuICAgICAgICAgIHk6ICggeTEgKyB5MiArIHkyMSAvIGwgKiByMjEgKSAvIDIsXG4gICAgICAgICAgcjogKCBsICsgcjEgKyByMiApIC8gMlxuICAgICB9O1xufVxuXG5mdW5jdGlvbiBlbmNsb3NlQmFzaXMzICggYTogQ2lyY2xlLCBiOiBDaXJjbGUsIGM6IENpcmNsZSApXG57XG4gICAgIGNvbnN0IHsgeDogeDEsIHk6IHkxLCByOiByMSB9ID0gYVxuICAgICBjb25zdCB7IHg6IHgyLCB5OiB5MiwgcjogcjIgfSA9IGJcbiAgICAgY29uc3QgeyB4OiB4MywgeTogeTMsIHI6IHIzIH0gPSBjXG5cbiAgICAgY29uc3QgYTIgPSB4MSAtIHgyLFxuICAgICAgICAgICAgICAgYTMgPSB4MSAtIHgzLFxuICAgICAgICAgICAgICAgYjIgPSB5MSAtIHkyLFxuICAgICAgICAgICAgICAgYjMgPSB5MSAtIHkzLFxuICAgICAgICAgICAgICAgYzIgPSByMiAtIHIxLFxuICAgICAgICAgICAgICAgYzMgPSByMyAtIHIxLFxuXG4gICAgICAgICAgICAgICBkMSA9IHgxICogeDEgKyB5MSAqIHkxIC0gcjEgKiByMSxcbiAgICAgICAgICAgICAgIGQyID0gZDEgLSB4MiAqIHgyIC0geTIgKiB5MiArIHIyICogcjIsXG4gICAgICAgICAgICAgICBkMyA9IGQxIC0geDMgKiB4MyAtIHkzICogeTMgKyByMyAqIHIzLFxuXG4gICAgICAgICAgICAgICBhYiA9IGEzICogYjIgLSBhMiAqIGIzLFxuICAgICAgICAgICAgICAgeGEgPSAoIGIyICogZDMgLSBiMyAqIGQyICkgLyAoIGFiICogMiApIC0geDEsXG4gICAgICAgICAgICAgICB4YiA9ICggYjMgKiBjMiAtIGIyICogYzMgKSAvIGFiLFxuICAgICAgICAgICAgICAgeWEgPSAoIGEzICogZDIgLSBhMiAqIGQzICkgLyAoIGFiICogMiApIC0geTEsXG4gICAgICAgICAgICAgICB5YiA9ICggYTIgKiBjMyAtIGEzICogYzIgKSAvIGFiLFxuXG4gICAgICAgICAgICAgICBBICA9IHhiICogeGIgKyB5YiAqIHliIC0gMSxcbiAgICAgICAgICAgICAgIEIgID0gMiAqICggcjEgKyB4YSAqIHhiICsgeWEgKiB5YiApLFxuICAgICAgICAgICAgICAgQyAgPSB4YSAqIHhhICsgeWEgKiB5YSAtIHIxICogcjEsXG4gICAgICAgICAgICAgICByICA9IC0oIEEgPyAoIEIgKyBNYXRoLnNxcnQoIEIgKiBCIC0gNCAqIEEgKiBDICkgKSAvICggMiAqIEEgKSA6IEMgLyBCIClcblxuICAgICByZXR1cm4ge1xuICAgICAgICAgIHg6IHgxICsgeGEgKyB4YiAqIHIsXG4gICAgICAgICAgeTogeTEgKyB5YSArIHliICogcixcbiAgICAgICAgICByOiByXG4gICAgIH07XG59XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi9kMy1lbmNsb3NlLnRzXCIgLz5cblxuLy8gaHR0cHM6Ly9naXRodWIuY29tL2QzL2QzLWhpZXJhcmNoeS9ibG9iL21hc3Rlci9zcmMvcGFjay9zaWJsaW5ncy5qc1xuXG5pbXBvcnQgeyBlbmNsb3NlLCBDaXJjbGUgfSBmcm9tIFwiLi9kMy1lbmNsb3NlLmpzXCJcblxuZnVuY3Rpb24gcGxhY2UgKCBiOiBDaXJjbGUsIGE6IENpcmNsZSwgYzogQ2lyY2xlIClcbntcbiAgICAgdmFyIGR4ID0gYi54IC0gYS54LFxuICAgICAgICAgIHg6IG51bWJlcixcbiAgICAgICAgICBhMjogbnVtYmVyLFxuICAgICAgICAgIGR5ID0gYi55IC0gYS55LFxuICAgICAgICAgIHkgOiBudW1iZXIsXG4gICAgICAgICAgYjI6IG51bWJlcixcbiAgICAgICAgICBkMiA9IGR4ICogZHggKyBkeSAqIGR5XG5cbiAgICAgaWYgKCBkMiApXG4gICAgIHtcbiAgICAgICAgICBhMiA9IGEuciArIGMuciwgYTIgKj0gYTJcbiAgICAgICAgICBiMiA9IGIuciArIGMuciwgYjIgKj0gYjJcblxuICAgICAgICAgIGlmICggYTIgPiBiMiApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgeCA9ICggZDIgKyBiMiAtIGEyICkgLyAoIDIgKiBkMiApXG4gICAgICAgICAgICAgICB5ID0gTWF0aC5zcXJ0KCBNYXRoLm1heCggMCwgYjIgLyBkMiAtIHggKiB4ICkgKVxuICAgICAgICAgICAgICAgYy54ID0gYi54IC0geCAqIGR4IC0geSAqIGR5XG4gICAgICAgICAgICAgICBjLnkgPSBiLnkgLSB4ICogZHkgKyB5ICogZHhcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHggPSAoIGQyICsgYTIgLSBiMiApIC8gKCAyICogZDIgKVxuICAgICAgICAgICAgICAgeSA9IE1hdGguc3FydCggTWF0aC5tYXgoIDAsIGEyIC8gZDIgLSB4ICogeCApIClcbiAgICAgICAgICAgICAgIGMueCA9IGEueCArIHggKiBkeCAtIHkgKiBkeVxuICAgICAgICAgICAgICAgYy55ID0gYS55ICsgeCAqIGR5ICsgeSAqIGR4XG4gICAgICAgICAgfVxuICAgICB9XG4gICAgIGVsc2VcbiAgICAge1xuICAgICAgICAgIGMueCA9IGEueCArIGMuclxuICAgICAgICAgIGMueSA9IGEueVxuICAgICB9XG59XG5cbmZ1bmN0aW9uIGludGVyc2VjdHMgKCBhOiBDaXJjbGUsIGI6IENpcmNsZSApXG57XG4gICAgIHZhciBkciA9IGEuciArIGIuciAtIDFlLTYsIGR4ID0gYi54IC0gYS54LCBkeSA9IGIueSAtIGEueTtcbiAgICAgcmV0dXJuIGRyID4gMCAmJiBkciAqIGRyID4gZHggKiBkeCArIGR5ICogZHk7XG59XG5cbmZ1bmN0aW9uIHNjb3JlICggbm9kZTogTm9kZSApXG57XG4gICAgIHZhciBhID0gbm9kZS5fLFxuICAgICAgICAgIGIgPSBub2RlLm5leHQuXyxcbiAgICAgICAgICBhYiA9IGEuciArIGIucixcbiAgICAgICAgICBkeCA9ICggYS54ICogYi5yICsgYi54ICogYS5yICkgLyBhYixcbiAgICAgICAgICBkeSA9ICggYS55ICogYi5yICsgYi55ICogYS5yICkgLyBhYjtcbiAgICAgcmV0dXJuIGR4ICogZHggKyBkeSAqIGR5O1xufVxuXG5jbGFzcyBOb2RlXG57XG4gICAgIG5leHQgICAgID0gbnVsbCBhcyBOb2RlXG4gICAgIHByZXZpb3VzID0gbnVsbCBhcyBOb2RlXG4gICAgIGNvbnN0cnVjdG9yICggcHVibGljIF86IENpcmNsZSApIHt9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYWNrRW5jbG9zZSAoIGNpcmNsZXM6IENpcmNsZVtdIClcbntcbiAgICAgaWYgKCAhKCBuID0gY2lyY2xlcy5sZW5ndGggKSApIHJldHVybiAwO1xuXG4gICAgIHZhciBhLCBiLCBjIC8qOiBOb2RlICYgQ2lyY2xlKi8sIG4sIGFhLCBjYSwgaSwgaiwgaywgc2osIHNrO1xuXG4gICAgIC8vIFBsYWNlIHRoZSBmaXJzdCBjaXJjbGUuXG4gICAgIGEgPSBjaXJjbGVzWyAwIF0sIGEueCA9IDAsIGEueSA9IDA7XG4gICAgIGlmICggISggbiA+IDEgKSApIHJldHVybiBhLnI7XG5cbiAgICAgLy8gUGxhY2UgdGhlIHNlY29uZCBjaXJjbGUuXG4gICAgIGIgPSBjaXJjbGVzWyAxIF0sIGEueCA9IC1iLnIsIGIueCA9IGEuciwgYi55ID0gMDtcbiAgICAgaWYgKCAhKCBuID4gMiApICkgcmV0dXJuIGEuciArIGIucjtcblxuICAgICAvLyBQbGFjZSB0aGUgdGhpcmQgY2lyY2xlLlxuICAgICBwbGFjZSggYiwgYSwgYyA9IGNpcmNsZXNbIDIgXSApO1xuXG4gICAgIC8vIEluaXRpYWxpemUgdGhlIGZyb250LWNoYWluIHVzaW5nIHRoZSBmaXJzdCB0aHJlZSBjaXJjbGVzIGEsIGIgYW5kIGMuXG4gICAgIGEgPSBuZXcgTm9kZSggYSApLCBiID0gbmV3IE5vZGUoIGIgKSwgYyA9IG5ldyBOb2RlKCBjICk7XG4gICAgIGEubmV4dCA9IGMucHJldmlvdXMgPSBiO1xuICAgICBiLm5leHQgPSBhLnByZXZpb3VzID0gYztcbiAgICAgYy5uZXh0ID0gYi5wcmV2aW91cyA9IGE7XG5cbiAgICAgLy8gQXR0ZW1wdCB0byBwbGFjZSBlYWNoIHJlbWFpbmluZyBjaXJjbGXigKZcbiAgICAgcGFjazogZm9yICggaSA9IDM7IGkgPCBuOyArK2kgKVxuICAgICB7XG4gICAgICAgICAgcGxhY2UoIGEuXywgYi5fLCBjID0gY2lyY2xlc1sgaSBdICksIGMgPSBuZXcgTm9kZSggYyApO1xuXG4gICAgICAgICAgLy8gRmluZCB0aGUgY2xvc2VzdCBpbnRlcnNlY3RpbmcgY2lyY2xlIG9uIHRoZSBmcm9udC1jaGFpbiwgaWYgYW55LlxuICAgICAgICAgIC8vIOKAnENsb3NlbmVzc+KAnSBpcyBkZXRlcm1pbmVkIGJ5IGxpbmVhciBkaXN0YW5jZSBhbG9uZyB0aGUgZnJvbnQtY2hhaW4uXG4gICAgICAgICAgLy8g4oCcQWhlYWTigJ0gb3Ig4oCcYmVoaW5k4oCdIGlzIGxpa2V3aXNlIGRldGVybWluZWQgYnkgbGluZWFyIGRpc3RhbmNlLlxuICAgICAgICAgIGogPSBiLm5leHQsIGsgPSBhLnByZXZpb3VzLCBzaiA9IGIuXy5yLCBzayA9IGEuXy5yO1xuICAgICAgICAgIGRvXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgaWYgKCBzaiA8PSBzayApXG4gICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGlmICggaW50ZXJzZWN0cyggai5fLCBjLl8gKSApXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICBiID0gaiwgYS5uZXh0ID0gYiwgYi5wcmV2aW91cyA9IGEsIC0taTtcbiAgICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZSBwYWNrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHNqICs9IGouXy5yLCBqID0gai5uZXh0O1xuICAgICAgICAgICAgICAgfSBlbHNlXG4gICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGlmICggaW50ZXJzZWN0cyggay5fLCBjLl8gKSApXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICBhID0gaywgYS5uZXh0ID0gYiwgYi5wcmV2aW91cyA9IGEsIC0taTtcbiAgICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZSBwYWNrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHNrICs9IGsuXy5yLCBrID0gay5wcmV2aW91cztcbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICB9IHdoaWxlICggaiAhPT0gay5uZXh0ICk7XG5cbiAgICAgICAgICAvLyBTdWNjZXNzISBJbnNlcnQgdGhlIG5ldyBjaXJjbGUgYyBiZXR3ZWVuIGEgYW5kIGIuXG4gICAgICAgICAgYy5wcmV2aW91cyA9IGEsIGMubmV4dCA9IGIsIGEubmV4dCA9IGIucHJldmlvdXMgPSBiID0gYztcblxuICAgICAgICAgIC8vIENvbXB1dGUgdGhlIG5ldyBjbG9zZXN0IGNpcmNsZSBwYWlyIHRvIHRoZSBjZW50cm9pZC5cbiAgICAgICAgICBhYSA9IHNjb3JlKCBhICk7XG4gICAgICAgICAgd2hpbGUgKCAoIGMgPSBjLm5leHQgKSAhPT0gYiApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgaWYgKCAoIGNhID0gc2NvcmUoIGMgKSApIDwgYWEgKVxuICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBhID0gYyxcbiAgICAgICAgICAgICAgICAgICAgYWEgPSBjYTtcbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgYiA9IGEubmV4dDtcbiAgICAgfVxuXG4gICAgIC8vIENvbXB1dGUgdGhlIGVuY2xvc2luZyBjaXJjbGUgb2YgdGhlIGZyb250IGNoYWluLlxuICAgICBhID0gWyBiLl8gXVxuICAgICBjID0gYlxuICAgICB3aGlsZSAoICggYyA9IGMubmV4dCApICE9PSBiIClcbiAgICAgICAgICBhLnB1c2goIGMuXyApO1xuICAgICBjID0gZW5jbG9zZSggYSApXG5cbiAgICAgLy8gVHJhbnNsYXRlIHRoZSBjaXJjbGVzIHRvIHB1dCB0aGUgZW5jbG9zaW5nIGNpcmNsZSBhcm91bmQgdGhlIG9yaWdpbi5cbiAgICAgZm9yICggaSA9IDA7IGkgPCBuOyArK2kgKVxuICAgICB7XG4gICAgICAgICAgYSA9IGNpcmNsZXNbIGkgXSxcbiAgICAgICAgICBhLnggLT0gYy54LFxuICAgICAgICAgIGEueSAtPSBjLnlcbiAgICAgfVxuXG4gICAgIHJldHVybiBjLnIgYXMgbnVtYmVyXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYWNrQ2lyY2xlcyAoIGNpcmNsZXM6IENpcmNsZVtdIClcbntcbiAgICAgcGFja0VuY2xvc2UoIGNpcmNsZXMgKTtcbiAgICAgcmV0dXJuIGNpcmNsZXMgYXMgQ2lyY2xlW107XG59XG4iLCJcclxuXHJcbmV4cG9ydCB0eXBlIFVuaXRcclxuICAgID0gXCIlXCJcclxuICAgIHwgXCJweFwiIHwgXCJwdFwiIHwgXCJlbVwiIHwgXCJyZW1cIiB8IFwiaW5cIiB8IFwiY21cIiB8IFwibW1cIlxyXG4gICAgfCBcImV4XCIgfCBcImNoXCIgfCBcInBjXCJcclxuICAgIHwgXCJ2d1wiIHwgXCJ2aFwiIHwgXCJ2bWluXCIgfCBcInZtYXhcIlxyXG4gICAgfCBcImRlZ1wiIHwgXCJyYWRcIiB8IFwidHVyblwiXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0VW5pdCAoIHZhbHVlOiBhbnkgKTogVW5pdCB8IHVuZGVmaW5lZFxyXG57XHJcbiAgICBpZiAoIHR5cGVvZiB2YWx1ZSAhPSBcInN0cmluZ1wiIClcclxuICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZFxyXG5cclxuICAgIGNvbnN0IHNwbGl0ID0gL1srLV0/XFxkKlxcLj9cXGQrKD86XFwuXFxkKyk/KD86W2VFXVsrLV0/XFxkKyk/KCV8cHh8cHR8ZW18cmVtfGlufGNtfG1tfGV4fGNofHBjfHZ3fHZofHZtaW58dm1heHxkZWd8cmFkfHR1cm4pPyQvXHJcbiAgICAgICAgICAgICAgLmV4ZWMoIHZhbHVlICk7XHJcblxyXG4gICAgaWYgKCBzcGxpdCApXHJcbiAgICAgICAgIHJldHVybiBzcGxpdCBbMV0gYXMgVW5pdFxyXG5cclxuICAgIHJldHVybiB1bmRlZmluZWRcclxufVxyXG5cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRUcmFuc2Zvcm1Vbml0ICggcHJvcE5hbWU6IHN0cmluZyApXHJcbntcclxuICAgIGlmICggcHJvcE5hbWUuaW5jbHVkZXMgKCAndHJhbnNsYXRlJyApIHx8IHByb3BOYW1lID09PSAncGVyc3BlY3RpdmUnIClcclxuICAgICAgICByZXR1cm4gJ3B4J1xyXG5cclxuICAgIGlmICggcHJvcE5hbWUuaW5jbHVkZXMgKCAncm90YXRlJyApIHx8IHByb3BOYW1lLmluY2x1ZGVzICggJ3NrZXcnICkgKVxyXG4gICAgICAgIHJldHVybiAnZGVnJ1xyXG59IiwiXG4vLyBodHRwczovL2dpdGh1Yi5jb20vcmRmanMtYmFzZS9kYXRhLW1vZGVsL3RyZWUvbWFzdGVyL2xpYlxuXG5kZWNsYXJlIGdsb2JhbFxue1xuICAgICBpbnRlcmZhY2UgJE5vZGVcbiAgICAge1xuICAgICAgICAgIHJlYWRvbmx5IGNvbnRleHQ6IHN0cmluZ1xuICAgICAgICAgIHJlYWRvbmx5IHR5cGU6IHN0cmluZ1xuICAgICAgICAgIHJlYWRvbmx5IGlkOiBzdHJpbmdcbiAgICAgfVxuXG4gICAgIGludGVyZmFjZSAkQ2x1c3RlciBleHRlbmRzICROb2RlXG4gICAgIHtcbiAgICAgICAgICBjaGlsZHJlbj86ICROb2RlIFtdXG4gICAgIH1cbn1cblxudmFyIG5leHRJZCA9IDBcblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZU5vZGUgPEQgZXh0ZW5kcyAkTm9kZSA9ICROb2RlLCBUIGV4dGVuZHMgc3RyaW5nID0gRCBbXCJ0eXBlXCJdPiAoIHR5cGU6IFQsIGlkOiBzdHJpbmcsIGRhdGE6IFBhcnRpYWwgPE9taXQgPEQsIFwidHlwZVwiIHwgXCJpZFwiPj4gKVxue1xuICAgICB0eXBlIE4gPSB7IC1yZWFkb25seSBbSyBpbiBrZXlvZiBEXTogRFtLXSB9XG5cbiAgICAgOyhkYXRhIGFzIE4pLnR5cGUgPSB0eXBlXG4gICAgIDsoZGF0YSBhcyBOKS5pZCAgID0gaWQgfHwgKCsrbmV4dElkKS50b1N0cmluZyAoKVxuICAgICByZXR1cm4gZGF0YSBhcyBEXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRVSWQgKCBub2RlOiAkTm9kZSApXG57XG4gICAgIHJldHVybiBub2RlLmNvbnRleHQgKyAnIycgKyBub2RlLnR5cGUgKyAnOicgKyBub2RlLmlkXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBlcXVhbE5vZGVzICggYTogJE5vZGUsIGI6ICROb2RlIClcbntcbiAgICAgcmV0dXJuICEhYSAmJiAhIWJcbiAgICAgICAgICAmJiBhLnR5cGUgPT09IGIudHlwZVxuICAgICAgICAgICYmIGEuaWQgICA9PT0gYi5pZFxufVxuXG4vKmV4cG9ydCBjbGFzcyBOb2RlIDxEIGV4dGVuZHMgJE5vZGUgPSAkTm9kZSwgVCBleHRlbmRzIHN0cmluZyA9IEQgW1widHlwZVwiXT5cbntcbiAgICAgc3RhdGljIG5leHRJZCA9IDBcblxuICAgICByZWFkb25seSB0eXBlOiBzdHJpbmdcblxuICAgICByZWFkb25seSBpZDogc3RyaW5nXG5cbiAgICAgcmVhZG9ubHkgdWlkOiBudW1iZXJcblxuICAgICByZWFkb25seSBkYXRhOiBEXG5cbiAgICAgZGVmYXVsdERhdGEgKCk6ICROb2RlXG4gICAgIHtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgY29udGV4dDogXCJcIixcbiAgICAgICAgICAgICAgIHR5cGUgICA6IFwibm9kZVwiLFxuICAgICAgICAgICAgICAgaWQgICAgIDogdW5kZWZpbmVkLFxuICAgICAgICAgIH1cbiAgICAgfVxuXG4gICAgIGNvbnN0cnVjdG9yICggZGF0YTogRCApXG4gICAgIHtcbiAgICAgICAgICB0aGlzLnR5cGUgPSBkYXRhLnR5cGVcbiAgICAgICAgICB0aGlzLnVpZCAgPSArK05vZGUubmV4dElkXG4gICAgICAgICAgdGhpcy5pZCAgID0gZGF0YS5pZCB8fCAoZGF0YS5pZCA9IHRoaXMudWlkLnRvU3RyaW5nICgpKVxuXG4gICAgICAgICAgdGhpcy5kYXRhID0gT2JqZWN0LmFzc2lnbiAoIHRoaXMuZGVmYXVsdERhdGEgKCksIGRhdGEgYXMgRCApXG4gICAgIH1cblxuICAgICBlcXVhbHMgKCBvdGhlcjogTm9kZSA8YW55PiApXG4gICAgIHtcbiAgICAgICAgICByZXR1cm4gISFvdGhlclxuICAgICAgICAgICAgICAgJiYgb3RoZXIudHlwZSA9PT0gdGhpcy50eXBlXG4gICAgICAgICAgICAgICAmJiBvdGhlci5pZCAgID09PSB0aGlzLmlkXG4gICAgIH1cblxuICAgICB0b0pzb24gKClcbiAgICAge1xuICAgICAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeSAoIHRoaXMuZGF0YSApXG4gICAgIH1cbn0qL1xuIiwiXG5leHBvcnQgdHlwZSBQYXRoID0ge1xuICAgICBsZW5ndGg6IG51bWJlclxuICAgICBbU3ltYm9sLml0ZXJhdG9yXSgpOiBJdGVyYWJsZUl0ZXJhdG9yPHN0cmluZz5cbn1cblxuZXhwb3J0IGNsYXNzIERhdGFUcmVlIDxUPlxue1xuICAgICByZWNvcmRzID0ge30gYXMge1xuICAgICAgICAgIFtjb250ZXh0OiBzdHJpbmddOiBUIHwge1xuICAgICAgICAgICAgICAgW3R5cGU6IHN0cmluZ106IFQgfCB7XG4gICAgICAgICAgICAgICAgICAgIFtpZDogc3RyaW5nXTogVFxuICAgICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgfVxuXG4gICAgIGhhcyAoIHBhdGg6IFBhdGggKSAgOiBib29sZWFuXG4gICAgIHtcbiAgICAgICAgICB2YXIgICByZWMgID0gdGhpcy5yZWNvcmRzIGFzIGFueVxuICAgICAgICAgIHZhciBjb3VudCA9IDBcblxuICAgICAgICAgIGZvciAoIGNvbnN0IGsgb2YgcGF0aCApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgY291bnQgKytcblxuICAgICAgICAgICAgICAgaWYgKCBrIGluIHJlYyApXG4gICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGlmICggayA9PT0gdW5kZWZpbmVkIClcbiAgICAgICAgICAgICAgICAgICAgICAgICBicmVha1xuXG4gICAgICAgICAgICAgICAgICAgIHJlYyA9IHJlYyBba11cbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIHBhdGgubGVuZ3RoID09IGNvdW50XG4gICAgIH1cblxuICAgICBjb3VudCAoIHBhdGg6IFBhdGggKVxuICAgICB7XG4gICAgICAgICAgdmFyICByZWMgPSB0aGlzLnJlY29yZHMgYXMgYW55XG5cbiAgICAgICAgICBmb3IgKCBjb25zdCBrIG9mIHBhdGggKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGlmICggayA9PT0gdW5kZWZpbmVkIClcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcblxuICAgICAgICAgICAgICAgaWYgKCBrIGluIHJlYyApXG4gICAgICAgICAgICAgICAgICAgIHJlYyA9IHJlYyBba11cbiAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDBcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvL0B0cy1pZ25vcmVcbiAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkIGluIHJlY1xuICAgICAgICAgICAgICAgPyBPYmplY3Qua2V5cyAoIHJlYyApLmxlbmd0aCAtIDFcbiAgICAgICAgICAgICAgIDogT2JqZWN0LmtleXMgKCByZWMgKS5sZW5ndGhcblxuICAgICB9XG5cbiAgICAgc2V0ICggcGF0aDogUGF0aCwgZGF0YTogVCApOiBUXG4gICAgIHtcbiAgICAgICAgICBjb25zdCB1bmQgPSB1bmRlZmluZWRcbiAgICAgICAgICB2YXIgICByZWMgID0gdGhpcy5yZWNvcmRzIGFzIGFueVxuXG4gICAgICAgICAgZm9yICggY29uc3QgayBvZiBwYXRoIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBpZiAoIGsgPT09IHVuZGVmaW5lZCApXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG5cbiAgICAgICAgICAgICAgIGlmICggayBpbiByZWMgKVxuICAgICAgICAgICAgICAgICAgICByZWMgPSByZWMgW2tdXG4gICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIHJlYyA9IHJlYyBba10gPSB7fVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiByZWMgW3VuZF0gPSBkYXRhXG4gICAgIH1cblxuICAgICBnZXQgKCBwYXRoOiBQYXRoICk6IFRcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHVuZCA9IHVuZGVmaW5lZFxuICAgICAgICAgIHZhciAgIHJlYyAgPSB0aGlzLnJlY29yZHMgYXMgYW55XG5cbiAgICAgICAgICBmb3IgKCBjb25zdCBrIG9mIHBhdGggKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGlmICggayA9PT0gdW5kZWZpbmVkIClcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcblxuICAgICAgICAgICAgICAgaWYgKCBrIGluIHJlYyApXG4gICAgICAgICAgICAgICAgICAgIHJlYyA9IHJlYyBba11cbiAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gcmVjIFt1bmRdXG4gICAgIH1cblxuICAgICBuZWFyICggcGF0aDogUGF0aCApOiBUXG4gICAgIHtcbiAgICAgICAgICB2YXIgcmVjID0gdGhpcy5yZWNvcmRzIGFzIGFueVxuICAgICAgICAgIGNvbnN0IHVuZCA9IHVuZGVmaW5lZFxuXG4gICAgICAgICAgZm9yICggY29uc3QgayBvZiBwYXRoIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBpZiAoIGsgPT09IHVuZGVmaW5lZCApXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG5cbiAgICAgICAgICAgICAgIGlmICggayBpbiByZWMgKVxuICAgICAgICAgICAgICAgICAgICByZWMgPSByZWMgW2tdXG4gICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIHJlYyBbdW5kXVxuICAgICB9XG5cbiAgICAgd2FsayAoIHBhdGg6IFBhdGgsIGNiOiAoIGRhdGE6IFQgKSA9PiB2b2lkIClcbiAgICAge1xuICAgICAgICAgIHZhciAgIHJlYyAgPSB0aGlzLnJlY29yZHMgYXMgYW55XG4gICAgICAgICAgY29uc3QgdW5kICA9IHVuZGVmaW5lZFxuXG4gICAgICAgICAgZm9yICggY29uc3QgayBvZiBwYXRoIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBpZiAoIHVuZCBpbiByZWMgKVxuICAgICAgICAgICAgICAgICAgICBjYiAoIHJlYyBbdW5kXSApXG5cbiAgICAgICAgICAgICAgIGlmICggayA9PT0gdW5kZWZpbmVkIClcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcblxuICAgICAgICAgICAgICAgaWYgKCBrIGluIHJlYyApXG4gICAgICAgICAgICAgICAgICAgIHJlYyA9IHJlYyBba11cbiAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoIHVuZCBpbiByZWMgKVxuICAgICAgICAgICAgICAgY2IgKCByZWMgW3VuZF0gKVxuXG4gICAgICAgICAgcmV0dXJuXG4gICAgIH1cbn1cbiIsIlxuaW1wb3J0IHsgT3B0aW9uYWwsIFJlcXVpcmUgfSBmcm9tIFwiLi4vLi4vTGliL3R5cGluZy5qc1wiXG5pbXBvcnQgeyBEYXRhVHJlZSB9IGZyb20gXCIuL2RhdGEtdHJlZS5qc1wiXG5cblxudHlwZSBSZWYgPE4gZXh0ZW5kcyAkTm9kZT4gPSBSZXF1aXJlIDxQYXJ0aWFsIDxOPiwgXCJjb250ZXh0XCIgfCBcInR5cGVcIiB8IFwiaWRcIj5cblxudHlwZSBEIDxOIGV4dGVuZHMgJE5vZGU+ID0gT3B0aW9uYWwgPE4sIFwiY29udGV4dFwiIHwgXCJ0eXBlXCIgfCBcImlkXCI+XG5cblxuZXhwb3J0IGNsYXNzIERhdGFiYXNlIDxOIGV4dGVuZHMgJE5vZGUgPSAkTm9kZT4gZXh0ZW5kcyBEYXRhVHJlZSA8Tj5cbntcbiAgICAgaGFzICggbm9kZTogUmVmIDxOPiApICAgICAgOiBib29sZWFuXG4gICAgIGhhcyAoIC4uLiBwYXRoOiBzdHJpbmcgW10gKTogYm9vbGVhblxuICAgICBoYXMgKCk6IGJvb2xlYW5cbiAgICAge1xuICAgICAgICAgIGlmICggYXJndW1lbnRzLmxlbmd0aCA9PSAwIClcbiAgICAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgICAgaWYgKCBhcmd1bWVudHMubGVuZ3RoID09IDEgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNvbnN0IG86IE4gPSBhcmd1bWVudHMgWzBdXG4gICAgICAgICAgICAgICByZXR1cm4gc3VwZXIubmVhciAoIFtvLmNvbnRleHQsIG8udHlwZSwgby5pZF0gKSAhPT0gdW5kZWZpbmVkXG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICByZXR1cm4gc3VwZXIubmVhciAoIGFyZ3VtZW50cyApICE9PSB1bmRlZmluZWRcbiAgICAgICAgICB9XG4gICAgIH1cblxuICAgICBjb3VudCAoIG5vZGU6IFJlZiA8Tj4gKSAgICAgIDogbnVtYmVyXG4gICAgIGNvdW50ICggLi4uIHBhdGg6IHN0cmluZyBbXSApOiBudW1iZXJcbiAgICAgY291bnQgKCk6IG51bWJlclxuICAgICB7XG4gICAgICAgICAgaWYgKCBhcmd1bWVudHMubGVuZ3RoID09IDAgKVxuICAgICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgICBpZiAoIGFyZ3VtZW50cy5sZW5ndGggPT0gMSApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgY29uc3QgbzogTiA9IGFyZ3VtZW50cyBbMF1cbiAgICAgICAgICAgICAgIHJldHVybiBzdXBlci5jb3VudCAoIFtvLmNvbnRleHQsIG8udHlwZSwgby5pZF0gKVxuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgcmV0dXJuIHN1cGVyLmNvdW50ICggYXJndW1lbnRzIClcbiAgICAgICAgICB9XG4gICAgIH1cblxuICAgICBzZXQgPCQgZXh0ZW5kcyBOPiAoIG5vZGU6ICQgKSAgICAgICAgICAgICAgICAgICAgIDogJFxuICAgICBzZXQgPCQgZXh0ZW5kcyBOPiAoIHBhdGg6IHN0cmluZyBbXSwgZGF0YTogRCA8JD4gKTogJFxuICAgICBzZXQgKCk6IE5cbiAgICAge1xuICAgICAgICAgIGlmICggYXJndW1lbnRzLmxlbmd0aCA9PSAwIClcbiAgICAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgICAgaWYgKCBhcmd1bWVudHMubGVuZ3RoID09IDEgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNvbnN0IG86IE4gPSBhcmd1bWVudHMgWzBdXG4gICAgICAgICAgICAgICByZXR1cm4gc3VwZXIuc2V0ICggW28uY29udGV4dCwgby50eXBlLCBvLmlkXSwgbyApXG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICByZXR1cm4gc3VwZXIuc2V0ICggYXJndW1lbnRzIFswXSwgYXJndW1lbnRzIFsxXSApXG4gICAgICAgICAgfVxuICAgICB9XG5cbiAgICAgZ2V0IDwkIGV4dGVuZHMgTj4gKCBub2RlOiBSZWYgPCROb2RlPiApICA6ICRcbiAgICAgZ2V0IDwkIGV4dGVuZHMgTj4gKCAuLi4gcGF0aDogc3RyaW5nIFtdICk6ICRcbiAgICAgZ2V0ICgpOiBOXG4gICAgIHtcbiAgICAgICAgICBpZiAoIGFyZ3VtZW50cy5sZW5ndGggPT0gMCApXG4gICAgICAgICAgICAgICByZXR1cm5cblxuICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHt9IGFzIE5cblxuICAgICAgICAgIGlmICggYXJndW1lbnRzLmxlbmd0aCA9PSAxIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBjb25zdCBvOiAkTm9kZSA9IGFyZ3VtZW50cyBbMF1cbiAgICAgICAgICAgICAgIHN1cGVyLndhbGsgKCBbby5jb250ZXh0LCBvLnR5cGUsIG8uaWRdLCBkYXRhID0+IHtcbiAgICAgICAgICAgICAgICAgICAgT2JqZWN0LmFzc2lnbiAoIHJlc3VsdCwgZGF0YSApXG4gICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgcmV0dXJuIE9iamVjdC5hc3NpZ24gKCByZXN1bHQsIG8gKVxuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgc3VwZXIud2FsayAoIGFyZ3VtZW50cywgZGF0YSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIE9iamVjdC5hc3NpZ24gKCByZXN1bHQsIGRhdGEgKVxuICAgICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgICAgcmV0dXJuIE9iamVjdC5hc3NpZ24gKCByZXN1bHQsIHtcbiAgICAgICAgICAgICAgICAgICAgY29udGV4dDogYXJndW1lbnRzIFswXSxcbiAgICAgICAgICAgICAgICAgICAgdHlwZSAgIDogYXJndW1lbnRzIFsxXSxcbiAgICAgICAgICAgICAgICAgICAgaWQgICAgIDogYXJndW1lbnRzIFsyXSxcbiAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgfVxuICAgICB9XG59XG4iLCJcbmltcG9ydCB7IERhdGFiYXNlIH0gZnJvbSBcIi4vZGIuanNcIlxuaW1wb3J0IHsgRGF0YVRyZWUsIFBhdGggfSBmcm9tIFwiLi9kYXRhLXRyZWUuanNcIlxuXG5pbXBvcnQgeyBPcHRpb25hbCB9IGZyb20gXCIuLi8uLi9MaWIvaW5kZXguanNcIlxuXG5cbnR5cGUgSXRlbSA8VCA9IGFueSwgJCBleHRlbmRzICROb2RlID0gJE5vZGU+ID1cbntcbiAgICAgbXVsdGlwbGU6IGJvb2xlYW5cbiAgICAgaW5zdGFuY2VzOiBUIFtdXG4gICAgIGNvbnN0cnVjdG9yOiBuZXcgKCBkYXRhOiAkICkgPT4gVFxufVxuXG50eXBlICRJbiA8TiBleHRlbmRzICROb2RlID0gJE5vZGU+ID0gT3B0aW9uYWwgPE4sIFwiY29udGV4dFwiPlxuXG4vL2V4cG9ydCB0eXBlIEN0b3IgPE4gZXh0ZW5kcyAkTm9kZSA9ICROb2RlLCBUID0gYW55PiA9IG5ldyAoIGRhdGE6IE4gKSA9PiBUXG5leHBvcnQgdHlwZSBDdG9yIDxOIGV4dGVuZHMgJE5vZGUgPSAkTm9kZSwgVCA9IGFueT4gPSBuZXcgKCBkYXRhOiBOLCBjaGlsZHJlbj86IGFueSBbXSApID0+IFRcblxudHlwZSBBcmcgPEY+ID0gRiBleHRlbmRzIG5ldyAoIGRhdGE6IGluZmVyIEQgKSA9PiBhbnkgPyBEIDogYW55XG5cblxuZXhwb3J0IGNsYXNzIEZhY3RvcnkgPEUgPSBhbnksIE4gZXh0ZW5kcyAkTm9kZSA9ICROb2RlPlxue1xuICAgICBjb25zdHJ1Y3RvciAoIHJlYWRvbmx5IGRiOiBEYXRhYmFzZSA8Tj4gKSB7fVxuXG4gICAgIHByaXZhdGUgY3RvcnMgPSBuZXcgRGF0YVRyZWUgPEN0b3IgPCROb2RlLCBFPj4gKClcbiAgICAgcHJpdmF0ZSBpbnN0cyA9ICBuZXcgRGF0YVRyZWUgPEU+ICgpXG5cblxuICAgICBnZXRQYXRoICggbm9kZTogJE5vZGUgKSAgICAgICAgOiBQYXRoXG4gICAgIGdldFBhdGggKCBwYXRoOiBQYXRoICkgICAgICAgICA6IFBhdGhcbiAgICAgZ2V0UGF0aCAoIC4uLiBwYXRoOiBzdHJpbmcgW10gKTogUGF0aFxuXG4gICAgIGdldFBhdGggKClcbiAgICAge1xuICAgICAgICAgIGlmICggYXJndW1lbnRzLmxlbmd0aCA9PSAwIClcbiAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvciAoIFwiTnVsbCBhcmd1bWVudFwiIClcblxuICAgICAgICAgIGNvbnN0IGFyZyAgPSBhcmd1bWVudHMgWzBdXG5cbiAgICAgICAgICBpZiAoIHR5cGVvZiBhcmcgPT0gXCJzdHJpbmdcIiApXG4gICAgICAgICAgICAgICByZXR1cm4gYXJndW1lbnRzIGFzIFBhdGhcblxuICAgICAgICAgIGlmICggQXJyYXkuaXNBcnJheSAoIGFyZykgKVxuICAgICAgICAgICAgICAgcmV0dXJuIGFyZy5mbGF0ICgpIGFzIFBhdGhcblxuICAgICAgICAgIHJldHVybiBbIGFyZy5jb250ZXh0LCBhcmcudHlwZSwgYXJnLmlkIF0gYXMgUGF0aFxuICAgICB9XG5cbiAgICAgaW5TdG9jayAoIG5vZGU6ICROb2RlICkgICAgICAgIDogYm9vbGVhblxuICAgICBpblN0b2NrICggcGF0aDogUGF0aCApICAgICAgICAgOiBib29sZWFuXG4gICAgIGluU3RvY2sgKCAuLi4gcGF0aDogc3RyaW5nIFtdICk6IGJvb2xlYW5cblxuICAgICBpblN0b2NrICgpOiBib29sZWFuXG4gICAgIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5pbnN0cy5oYXMgKCB0aGlzLmdldFBhdGggKCAuLi4gYXJndW1lbnRzICkgYXMgUGF0aCApXG4gICAgIH1cbiAgICAgX2luU3RvY2sgKCBwYXRoOiBQYXRoIClcbiAgICAge1xuICAgICAgICAgIHJldHVybiB0aGlzLmluc3RzLmhhcyAoIHBhdGggKVxuICAgICB9XG5cbiAgICAgZGVmaW5lIDxGIGV4dGVuZHMgQ3Rvcj4gKCBjdG9yOiBGLCBub2RlOiBBcmcgPEY+ICkgICAgICA6IHZvaWRcbiAgICAgZGVmaW5lIDxGIGV4dGVuZHMgQ3Rvcj4gKCBjdG9yOiBGLCBwYXRoOiBQYXRoICkgICAgICAgICA6IHZvaWRcbiAgICAgZGVmaW5lIDxGIGV4dGVuZHMgQ3Rvcj4gKCBjdG9yOiBGLCAuLi4gcGF0aDogc3RyaW5nIFtdICk6IHZvaWRcblxuICAgICBkZWZpbmUgKCBjdG9yOiBDdG9yLCAuLi4gcmVzdDogYW55IFtdIClcbiAgICAge1xuICAgICAgICAgIHZhciBwYXRoID0gdGhpcy5nZXRQYXRoICggLi4uIHJlc3QgKVxuXG4gICAgICAgICAgaWYgKCB0aGlzLmN0b3JzLmhhcyAoIHBhdGggKSApXG4gICAgICAgICAgICAgICB0aHJvdyBcIkJhZCBhcmd1bWVudFwiXG5cbiAgICAgICAgICByZXR1cm4gdGhpcy5jdG9ycy5zZXQgKCBwYXRoLCBjdG9yIClcbiAgICAgfVxuICAgICBfZGVmaW5lICggY3RvcjogQ3RvciwgcGF0aDogUGF0aCApXG4gICAgIHtcbiAgICAgICAgICBpZiAoIHRoaXMuY3RvcnMuaGFzICggcGF0aCApIClcbiAgICAgICAgICAgICAgIHRocm93IFwiQmFkIGFyZ3VtZW50XCJcblxuICAgICAgICAgIHJldHVybiB0aGlzLmN0b3JzLnNldCAoIHBhdGgsIGN0b3IgKVxuICAgICB9XG5cbiAgICAgcGljayA8UiBleHRlbmRzIEUsICQgZXh0ZW5kcyBOID0gTj4gKCBub2RlOiAkTm9kZSApOiBSXG4gICAgIHBpY2sgPFIgZXh0ZW5kcyBFPiAoIC4uLiBwYXRoOiBzdHJpbmcgW10gKSAgICAgICAgIDogUlxuICAgICBwaWNrIDxSIGV4dGVuZHMgRT4gKCBwYXRoOiBQYXRoICkgICAgICAgICAgICAgICAgICA6IFJcblxuICAgICBwaWNrICgpOiBFXG4gICAgIHtcbiAgICAgICAgICB2YXIgcGF0aCA9IHRoaXMuZ2V0UGF0aCAoIC4uLiBhcmd1bWVudHMgKVxuXG4gICAgICAgICAgaWYgKCB0aGlzLmluc3RzLmhhcyAoIHBhdGggKSApXG4gICAgICAgICAgICAgICByZXR1cm4gdGhpcy5pbnN0cy5nZXQgKCBwYXRoIClcblxuICAgICAgICAgIHRocm93IFwiQmFkIGFyZ3VtZW50XCJcbiAgICAgfVxuICAgICBfcGljayAoIHBhdGg6IFBhdGggKVxuICAgICB7XG4gICAgICAgICAgaWYgKCB0aGlzLmluc3RzLmhhcyAoIHBhdGggKSApXG4gICAgICAgICAgICAgICByZXR1cm4gdGhpcy5pbnN0cy5nZXQgKCBwYXRoIClcblxuICAgICAgICAgIHRocm93IFwiQmFkIGFyZ3VtZW50XCJcbiAgICAgfVxuXG4gICAgIG1ha2UgPFIgZXh0ZW5kcyBFLCAkIGV4dGVuZHMgTiA9IE4+ICggbm9kZTogJCApOiBSXG4gICAgIG1ha2UgPFIgZXh0ZW5kcyBFPiAoIHBhdGg6IFBhdGggKSAgICAgICAgICAgICAgOiBSXG4gICAgIG1ha2UgPFIgZXh0ZW5kcyBFPiAoIC4uLiBwYXRoOiBzdHJpbmcgW10gKSAgICAgOiBSXG5cbiAgICAgbWFrZSAoKTogRVxuICAgICB7XG4gICAgICAgICAgdmFyIHBhdGggPSB0aGlzLmdldFBhdGggKCAuLi4gYXJndW1lbnRzIClcblxuICAgICAgICAgIGNvbnN0IGFyZyAgPSBhcmd1bWVudHMgWzBdXG5cbiAgICAgICAgICBpZiAoIHR5cGVvZiBhcmcgPT0gXCJvYmplY3RcIiAmJiAhIEFycmF5LmlzQXJyYXkgKGFyZykgKVxuICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX21ha2UgKCBwYXRoLCBhcmcgKVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9tYWtlICggcGF0aCApXG4gICAgIH1cbiAgICAgX21ha2UgKCBwYXRoOiBQYXRoLCBkYXRhPzogUGFydGlhbCA8Tj4gKVxuICAgICB7XG4gICAgICAgICAgaWYgKCB0aGlzLmluc3RzLmhhcyAoIHBhdGggKSApXG4gICAgICAgICAgICAgICByZXR1cm4gdGhpcy5pbnN0cy5nZXQgKCBwYXRoIClcblxuICAgICAgICAgIGNvbnN0IGN0b3IgPSB0aGlzLmN0b3JzLm5lYXIgKCBwYXRoIClcblxuICAgICAgICAgIGlmICggY3RvciA9PSB1bmRlZmluZWQgKVxuICAgICAgICAgICAgICAgdGhyb3cgXCJCYWQgYXJndW1lbnRcIlxuXG4gICAgICAgICAgY29uc3QgdG1wID0gdGhpcy5kYi5nZXQgKCAuLi4gcGF0aCApXG5cbiAgICAgICAgICBkYXRhID0gZGF0YSA9PSB1bmRlZmluZWRcbiAgICAgICAgICAgICAgID8gdG1wXG4gICAgICAgICAgICAgICA6IE9iamVjdC5hc3NpZ24gKCB0bXAsIGRhdGEgKVxuXG4gICAgICAgICAgcmV0dXJuIHRoaXMuaW5zdHMuc2V0ICggcGF0aCwgbmV3IGN0b3IgKCBkYXRhIGFzIE4gKSApXG4gICAgIH1cbn1cbiIsIlxuXG5cbmV4cG9ydCBjb25zdCB4bm9kZSA9ICgoKSA9Plxue1xuICAgICBjb25zdCBzdmdfbmFtZXMgPSBbIFwic3ZnXCIsIFwiZ1wiLCBcImxpbmVcIiwgXCJjaXJjbGVcIiwgXCJwYXRoXCIsIFwidGV4dFwiIF1cblxuICAgICBmdW5jdGlvbiBjcmVhdGUgKFxuICAgICAgICAgIG5hbWU6IGtleW9mIEpTWC5JbnRyaW5zaWNIVE1MRWxlbWVudHMsXG4gICAgICAgICAgcHJvcHM6IGFueSxcbiAgICAgICAgICAuLi5jaGlsZHJlbjogWyBIVE1MRWxlbWVudCB8IHN0cmluZyB8IGFueVtdIF1cbiAgICAgKTogSFRNTEVsZW1lbnRcblxuICAgICBmdW5jdGlvbiBjcmVhdGUgKFxuICAgICAgICAgIG5hbWU6IGtleW9mIEpTWC5JbnRyaW5zaWNTVkdFbGVtZW50cyxcbiAgICAgICAgICBwcm9wczogYW55LFxuICAgICAgICAgIC4uLmNoaWxkcmVuOiBbIEhUTUxFbGVtZW50IHwgc3RyaW5nIHwgYW55W10gXVxuICAgICApOiBTVkdFbGVtZW50XG5cbiAgICAgZnVuY3Rpb24gY3JlYXRlIChcbiAgICAgICAgICBuYW1lOiBzdHJpbmcsXG4gICAgICAgICAgcHJvcHM6IGFueSxcbiAgICAgICAgICAuLi5jaGlsZHJlbjogWyBIVE1MRWxlbWVudCB8IHN0cmluZyB8IGFueVtdIF1cbiAgICAgKTogSFRNTEVsZW1lbnQgfCBTVkdFbGVtZW50XG4gICAgIHtcbiAgICAgICAgICBwcm9wcyA9IE9iamVjdC5hc3NpZ24gKCB7fSwgcHJvcHMgKVxuXG4gICAgICAgICAgY29uc3QgZWxlbWVudCA9IHN2Z19uYW1lcy5pbmRleE9mICggbmFtZSApID09PSAtMVxuICAgICAgICAgICAgICAgICAgICA/IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgKCBuYW1lIClcbiAgICAgICAgICAgICAgICAgICAgOiBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMgKCBcImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIsIG5hbWUgKVxuXG4gICAgICAgICAgY29uc3QgY29udGVudCA9IFtdIGFzIGFueVtdXG5cbiAgICAgICAgICAvLyBDaGlsZHJlblxuXG4gICAgICAgICAgd2hpbGUgKCBjaGlsZHJlbi5sZW5ndGggPiAwIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBsZXQgY2hpbGQgPSBjaGlsZHJlbi5wb3AoKVxuXG4gICAgICAgICAgICAgICBpZiAoIEFycmF5LmlzQXJyYXkoIGNoaWxkICkgKVxuICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKCB2YXIgaSA9IDAgOyBpICE9IGNoaWxkLmxlbmd0aCA7IGkrKyApXG4gICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGRyZW4ucHVzaCggY2hpbGQgW2ldIClcbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgY29udGVudC5wdXNoKCBjaGlsZCApXG4gICAgICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgd2hpbGUgKCBjb250ZW50Lmxlbmd0aCA+IDAgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGxldCBjaGlsZCA9IGNvbnRlbnQucG9wKClcblxuICAgICAgICAgICAgICAgaWYgKCBjaGlsZCBpbnN0YW5jZW9mIE5vZGUgKVxuICAgICAgICAgICAgICAgICAgICBlbGVtZW50LmFwcGVuZENoaWxkKCBjaGlsZCApXG5cbiAgICAgICAgICAgICAgIGVsc2UgaWYgKCB0eXBlb2YgY2hpbGQgPT0gXCJib29sZWFuXCIgfHwgY2hpbGQgKVxuICAgICAgICAgICAgICAgICAgICBlbGVtZW50LmFwcGVuZENoaWxkKCBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSggY2hpbGQudG9TdHJpbmcoKSApIClcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBBdHRyaWJ1dGVzXG5cbiAgICAgICAgICBjb25zdCBpc0FycmF5ID0gQXJyYXkuaXNBcnJheVxuICAgICAgICAgIGNvbnN0IGNvbnY6IFJlY29yZCA8c3RyaW5nLCAodjogYW55KSA9PiBzdHJpbmc+ID1cbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBjbGFzczogKCB2ICkgPT4gaXNBcnJheSAodikgPyB2LmpvaW4gKFwiIFwiKSA6IHYsXG4gICAgICAgICAgICAgICBzdHlsZTogKCB2ICkgPT4gaXNBcnJheSAodikgPyB2LmpvaW4gKFwiIFwiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IHR5cGVvZiB2ID09IFwib2JqZWN0XCIgPyBvYmplY3RUb1N0eWxlICh2KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IHYsXG4gICAgICAgICAgICAgICAvLyBzdmdcbiAgICAgICAgICAgICAgIGQ6ICggdiApID0+IGlzQXJyYXkgKHYpID8gdi5qb2luIChcIiBcIikgOiB2LFxuICAgICAgICAgIH1cblxuICAgICAgICAgIGZvciAoIGNvbnN0IGtleSBpbiBwcm9wcyApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgY29uc3QgdmFsdWUgPSBwcm9wc1trZXldXG5cbiAgICAgICAgICAgICAgIGlmICggdHlwZW9mIHZhbHVlID09IFwiZnVuY3Rpb25cIiApXG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lciAoIGtleSwgdmFsdWUgKVxuXG4gICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlICgga2V5LCAoY29udltrZXldIHx8ICh2PT52KSkgKHZhbHVlKSApXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIGVsZW1lbnRcblxuICAgICAgICAgIGZ1bmN0aW9uIG9iamVjdFRvU3R5bGUgKCBvYmo6IG9iamVjdCApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IFwiXCJcblxuICAgICAgICAgICAgICAgZm9yICggY29uc3Qga2V5IGluIG9iaiApXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdCArPSBrZXkgKyBcIjogXCIgKyBvYmogW2tleV0gKyBcIjsgXCJcblxuICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdFxuICAgICAgICAgIH1cblxuICAgICAgICAgIGZ1bmN0aW9uIGNhbWVsaXplICggc3RyOiBzdHJpbmcgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHJldHVybiBzdHIucmVwbGFjZSAoXG4gICAgICAgICAgICAgICAgICAgIC8oPzpbQS1aXXxcXGJcXHcpL2csXG4gICAgICAgICAgICAgICAgICAgICggd29yZCwgaW5kZXggKSA9PiBpbmRleCA9PSAwID8gd29yZC50b0xvd2VyQ2FzZSgpIDogd29yZC50b1VwcGVyQ2FzZSgpXG4gICAgICAgICAgICAgICApLnJlcGxhY2UoL1xccysvZywgJycpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGZ1bmN0aW9uIHVuY2FtZWxpemUgKCBzdHI6IHN0cmluZyApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgcmV0dXJuIHN0ci50cmltICgpLnJlcGxhY2UgKFxuICAgICAgICAgICAgICAgLy8gICAvKD88IS0pKD86W0EtWl18XFxiXFx3KS9nLFxuICAgICAgICAgICAgICAgICAgICAvKD86W0EtWl18XFxiXFx3KS9nLFxuICAgICAgICAgICAgICAgICAgICAoIHdvcmQsIGluZGV4ICkgPT4gaW5kZXggPT0gMCA/IHdvcmQudG9Mb3dlckNhc2UoKSA6ICctJyArIHdvcmQudG9Mb3dlckNhc2UoKVxuICAgICAgICAgICAgICAgKS5yZXBsYWNlKC8oPzpcXHMrfF8pL2csICcnKTtcbiAgICAgICAgICB9XG4gICAgIH1cblxuICAgICByZXR1cm4gY3JlYXRlXG5cbn0pICgpXG5cbmRlY2xhcmUgZ2xvYmFsXG57XG4gICAgIGV4cG9ydCBuYW1lc3BhY2UgSlNYXG4gICAgIHtcbiAgICAgICAgICBleHBvcnQgdHlwZSBFbGVtZW50ID0gSFRNTEVsZW1lbnQgfCBTVkdFbGVtZW50XG5cbiAgICAgICAgICBleHBvcnQgdHlwZSBJbnRyaW5zaWNFbGVtZW50cyA9IEludHJpbnNpY0hUTUxFbGVtZW50cyAmIEludHJpbnNpY1NWR0VsZW1lbnRzXG5cbiAgICAgICAgICBleHBvcnQgaW50ZXJmYWNlIEludHJpbnNpY0hUTUxFbGVtZW50c1xuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGEgICAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBhYmJyICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgYWRkcmVzcyAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGFyZWEgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBhcnRpY2xlICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgYXNpZGUgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGF1ZGlvICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBiICAgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgYmFzZSAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGJkaSAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBiZG8gICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgYmlnICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGJsb2NrcXVvdGU6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBib2R5ICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgYnIgICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGJ1dHRvbiAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBjYW52YXMgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgY2FwdGlvbiAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGNpdGUgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBjb2RlICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgY29sICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGNvbGdyb3VwICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBkYXRhICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZGF0YWxpc3QgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGRkICAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBkZWwgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZGV0YWlscyAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGRmbiAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBkaWFsb2cgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZGl2ICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGRsICAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBkdCAgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZW0gICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGVtYmVkICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBmaWVsZHNldCAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZmlnY2FwdGlvbjogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGZpZ3VyZSAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBmb290ZXIgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZm9ybSAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGgxICAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBoMiAgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgaDMgICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGg0ICAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBoNSAgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgaDYgICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGhlYWQgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBoZWFkZXIgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgaGdyb3VwICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGhyICAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBodG1sICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgaSAgICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGlmcmFtZSAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBpbWcgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgaW5wdXQgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGlucyAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBrYmQgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAga2V5Z2VuICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGxhYmVsICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBsZWdlbmQgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgbGkgICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGxpbmsgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBtYWluICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgbWFwICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIG1hcmsgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBtZW51ICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgbWVudWl0ZW0gIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIG1ldGEgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBtZXRlciAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgbmF2ICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIG5vc2NyaXB0ICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBvYmplY3QgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgb2wgICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIG9wdGdyb3VwICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBvcHRpb24gICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgb3V0cHV0ICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHAgICAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBwYXJhbSAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgcGljdHVyZSAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHByZSAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBwcm9ncmVzcyAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgcSAgICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHJwICAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBydCAgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgcnVieSAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHMgICAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBzYW1wICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgc2NyaXB0ICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHNlY3Rpb24gICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBzZWxlY3QgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgc2xvdCAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHNtYWxsICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBzb3VyY2UgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgc3BhbiAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHN0cm9uZyAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBzdHlsZSAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgc3ViICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHN1bW1hcnkgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBzdXAgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgdGFibGUgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHRib2R5ICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICB0ZCAgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgdGV4dGFyZWEgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHRmb290ICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICB0aCAgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgdGhlYWQgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHRpbWUgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICB0aXRsZSAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgdHIgICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHRyYWNrICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICB1ICAgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgdWwgICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIFwidmFyXCIgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHZpZGVvICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICB3YnIgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGV4cG9ydCBpbnRlcmZhY2UgSW50cmluc2ljU1ZHRWxlbWVudHNcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBzdmcgICAgICAgICAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBhbmltYXRlICAgICAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBjaXJjbGUgICAgICAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBjbGlwUGF0aCAgICAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBkZWZzICAgICAgICAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBkZXNjICAgICAgICAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBlbGxpcHNlICAgICAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBmZUJsZW5kICAgICAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBmZUNvbG9yTWF0cml4ICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBmZUNvbXBvbmVudFRyYW5zZmVyOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBmZUNvbXBvc2l0ZSAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBmZUNvbnZvbHZlTWF0cml4ICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBmZURpZmZ1c2VMaWdodGluZyAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBmZURpc3BsYWNlbWVudE1hcCAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBmZUZsb29kICAgICAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBmZUdhdXNzaWFuQmx1ciAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBmZUltYWdlICAgICAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBmZU1lcmdlICAgICAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBmZU1lcmdlTm9kZSAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBmZU1vcnBob2xvZ3kgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBmZU9mZnNldCAgICAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBmZVNwZWN1bGFyTGlnaHRpbmcgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBmZVRpbGUgICAgICAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBmZVR1cmJ1bGVuY2UgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBmaWx0ZXIgICAgICAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBmb3JlaWduT2JqZWN0ICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBnICAgICAgICAgICAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBpbWFnZSAgICAgICAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBsaW5lICAgICAgICAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBsaW5lYXJHcmFkaWVudCAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBtYXJrZXIgICAgICAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBtYXNrICAgICAgICAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBwYXRoICAgICAgICAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBwYXR0ZXJuICAgICAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBwb2x5Z29uICAgICAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBwb2x5bGluZSAgICAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICByYWRpYWxHcmFkaWVudCAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICByZWN0ICAgICAgICAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBzdG9wICAgICAgICAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBzeW1ib2wgICAgICAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICB0ZXh0ICAgICAgICAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICB0c3BhbiAgICAgICAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICB1c2UgICAgICAgICAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgfVxuICAgICB9XG5cblxuICAgICBpbnRlcmZhY2UgUGF0aEF0dHJpYnV0ZXNcbiAgICAge1xuICAgICAgICAgIGQ6IHN0cmluZ1xuICAgICB9XG5cbiAgICAgdHlwZSBFdmVudEhhbmRsZXIgPEUgZXh0ZW5kcyBFdmVudD4gPSAoIGV2ZW50OiBFICkgPT4gdm9pZFxuXG4gICAgIHR5cGUgQ2xpcGJvYXJkRXZlbnRIYW5kbGVyICAgPSBFdmVudEhhbmRsZXI8Q2xpcGJvYXJkRXZlbnQ+XG4gICAgIHR5cGUgQ29tcG9zaXRpb25FdmVudEhhbmRsZXIgPSBFdmVudEhhbmRsZXI8Q29tcG9zaXRpb25FdmVudD5cbiAgICAgdHlwZSBEcmFnRXZlbnRIYW5kbGVyICAgICAgICA9IEV2ZW50SGFuZGxlcjxEcmFnRXZlbnQ+XG4gICAgIHR5cGUgRm9jdXNFdmVudEhhbmRsZXIgICAgICAgPSBFdmVudEhhbmRsZXI8Rm9jdXNFdmVudD5cbiAgICAgdHlwZSBLZXlib2FyZEV2ZW50SGFuZGxlciAgICA9IEV2ZW50SGFuZGxlcjxLZXlib2FyZEV2ZW50PlxuICAgICB0eXBlIE1vdXNlRXZlbnRIYW5kbGVyICAgICAgID0gRXZlbnRIYW5kbGVyPE1vdXNlRXZlbnQ+XG4gICAgIHR5cGUgVG91Y2hFdmVudEhhbmRsZXIgICAgICAgPSBFdmVudEhhbmRsZXI8VG91Y2hFdmVudD5cbiAgICAgdHlwZSBVSUV2ZW50SGFuZGxlciAgICAgICAgICA9IEV2ZW50SGFuZGxlcjxVSUV2ZW50PlxuICAgICB0eXBlIFdoZWVsRXZlbnRIYW5kbGVyICAgICAgID0gRXZlbnRIYW5kbGVyPFdoZWVsRXZlbnQ+XG4gICAgIHR5cGUgQW5pbWF0aW9uRXZlbnRIYW5kbGVyICAgPSBFdmVudEhhbmRsZXI8QW5pbWF0aW9uRXZlbnQ+XG4gICAgIHR5cGUgVHJhbnNpdGlvbkV2ZW50SGFuZGxlciAgPSBFdmVudEhhbmRsZXI8VHJhbnNpdGlvbkV2ZW50PlxuICAgICB0eXBlIEdlbmVyaWNFdmVudEhhbmRsZXIgICAgID0gRXZlbnRIYW5kbGVyPEV2ZW50PlxuICAgICB0eXBlIFBvaW50ZXJFdmVudEhhbmRsZXIgICAgID0gRXZlbnRIYW5kbGVyPFBvaW50ZXJFdmVudD5cblxuICAgICBpbnRlcmZhY2UgRE9NQXR0cmlidXRlc1xuICAgICB7XG4gICAgICAgICAgW2V2ZW50OiBzdHJpbmddOiBhbnlcblxuICAgICAgICAgIC8vICNyZWdpb24gSW1hZ2UgRXZlbnRzXG4gICAgICAgICAgb25Mb2FkPyAgICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Mb2FkQ2FwdHVyZT8gOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25FcnJvcj8gICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25FcnJvckNhcHR1cmU/OiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgLy8gI2VuZHJlZ2lvblxuXG4gICAgICAgICAgLy8gI3JlZ2lvbiBDbGlwYm9hcmQgRXZlbnRzXG4gICAgICAgICAgb25Db3B5PyAgICAgICAgOiBDbGlwYm9hcmRFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkNvcHlDYXB0dXJlPyA6IENsaXBib2FyZEV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uQ3V0PyAgICAgICAgIDogQ2xpcGJvYXJkRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25DdXRDYXB0dXJlPyAgOiBDbGlwYm9hcmRFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblBhc3RlPyAgICAgICA6IENsaXBib2FyZEV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uUGFzdGVDYXB0dXJlPzogQ2xpcGJvYXJkRXZlbnRIYW5kbGVyXG4gICAgICAgICAgLy8gI2VuZHJlZ2lvblxuXG4gICAgICAgICAgLy8gI3JlZ2lvbiBDb21wb3NpdGlvbiBFdmVudHNcbiAgICAgICAgICBvbkNvbXBvc2l0aW9uRW5kPyAgICAgICAgICA6IENvbXBvc2l0aW9uRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Db21wb3NpdGlvbkVuZENhcHR1cmU/ICAgOiBDb21wb3NpdGlvbkV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uQ29tcG9zaXRpb25TdGFydD8gICAgICAgIDogQ29tcG9zaXRpb25FdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkNvbXBvc2l0aW9uU3RhcnRDYXB0dXJlPyA6IENvbXBvc2l0aW9uRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Db21wb3NpdGlvblVwZGF0ZT8gICAgICAgOiBDb21wb3NpdGlvbkV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uQ29tcG9zaXRpb25VcGRhdGVDYXB0dXJlPzogQ29tcG9zaXRpb25FdmVudEhhbmRsZXJcbiAgICAgICAgICAvLyAjZW5kcmVnaW9uXG5cbiAgICAgICAgICAvLyAjcmVnaW9uIEZvY3VzIEV2ZW50c1xuICAgICAgICAgIG9uRm9jdXM/ICAgICAgIDogRm9jdXNFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkZvY3VzQ2FwdHVyZT86IEZvY3VzRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25CbHVyPyAgICAgICAgOiBGb2N1c0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uQmx1ckNhcHR1cmU/IDogRm9jdXNFdmVudEhhbmRsZXJcbiAgICAgICAgICAvLyAjZW5kcmVnaW9uXG5cbiAgICAgICAgICAvLyAjcmVnaW9uIEZvcm0gRXZlbnRzXG4gICAgICAgICAgb25DaGFuZ2U/ICAgICAgICA6IEdlbmVyaWNFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkNoYW5nZUNhcHR1cmU/IDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uSW5wdXQ/ICAgICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25JbnB1dENhcHR1cmU/ICA6IEdlbmVyaWNFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblNlYXJjaD8gICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uU2VhcmNoQ2FwdHVyZT8gOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25TdWJtaXQ/ICAgICAgICA6IEdlbmVyaWNFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblN1Ym1pdENhcHR1cmU/IDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uSW52YWxpZD8gICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25JbnZhbGlkQ2FwdHVyZT86IEdlbmVyaWNFdmVudEhhbmRsZXJcbiAgICAgICAgICAvLyAjZW5kcmVnaW9uXG5cbiAgICAgICAgICAvLyAjcmVnaW9uIEtleWJvYXJkIEV2ZW50c1xuICAgICAgICAgIG9uS2V5RG93bj8gICAgICAgIDogS2V5Ym9hcmRFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbktleURvd25DYXB0dXJlPyA6IEtleWJvYXJkRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25LZXlQcmVzcz8gICAgICAgOiBLZXlib2FyZEV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uS2V5UHJlc3NDYXB0dXJlPzogS2V5Ym9hcmRFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbktleVVwPyAgICAgICAgICA6IEtleWJvYXJkRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25LZXlVcENhcHR1cmU/ICAgOiBLZXlib2FyZEV2ZW50SGFuZGxlclxuICAgICAgICAgIC8vICNlbmRyZWdpb25cblxuICAgICAgICAgIC8vICNyZWdpb24gTWVkaWEgRXZlbnRzXG4gICAgICAgICAgb25BYm9ydD8gICAgICAgICAgICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25BYm9ydENhcHR1cmU/ICAgICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25DYW5QbGF5PyAgICAgICAgICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25DYW5QbGF5Q2FwdHVyZT8gICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25DYW5QbGF5VGhyb3VnaD8gICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25DYW5QbGF5VGhyb3VnaENhcHR1cmU/OiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25EdXJhdGlvbkNoYW5nZT8gICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25EdXJhdGlvbkNoYW5nZUNhcHR1cmU/OiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25FbXB0aWVkPyAgICAgICAgICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25FbXB0aWVkQ2FwdHVyZT8gICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25FbmNyeXB0ZWQ/ICAgICAgICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25FbmNyeXB0ZWRDYXB0dXJlPyAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25FbmRlZD8gICAgICAgICAgICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25FbmRlZENhcHR1cmU/ICAgICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Mb2FkZWREYXRhPyAgICAgICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Mb2FkZWREYXRhQ2FwdHVyZT8gICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Mb2FkZWRNZXRhZGF0YT8gICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Mb2FkZWRNZXRhZGF0YUNhcHR1cmU/OiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Mb2FkU3RhcnQ/ICAgICAgICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Mb2FkU3RhcnRDYXB0dXJlPyAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25QYXVzZT8gICAgICAgICAgICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25QYXVzZUNhcHR1cmU/ICAgICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25QbGF5PyAgICAgICAgICAgICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25QbGF5Q2FwdHVyZT8gICAgICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25QbGF5aW5nPyAgICAgICAgICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25QbGF5aW5nQ2FwdHVyZT8gICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Qcm9ncmVzcz8gICAgICAgICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Qcm9ncmVzc0NhcHR1cmU/ICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25SYXRlQ2hhbmdlPyAgICAgICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25SYXRlQ2hhbmdlQ2FwdHVyZT8gICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25TZWVrZWQ/ICAgICAgICAgICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25TZWVrZWRDYXB0dXJlPyAgICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25TZWVraW5nPyAgICAgICAgICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25TZWVraW5nQ2FwdHVyZT8gICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25TdGFsbGVkPyAgICAgICAgICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25TdGFsbGVkQ2FwdHVyZT8gICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25TdXNwZW5kPyAgICAgICAgICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25TdXNwZW5kQ2FwdHVyZT8gICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25UaW1lVXBkYXRlPyAgICAgICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25UaW1lVXBkYXRlQ2FwdHVyZT8gICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Wb2x1bWVDaGFuZ2U/ICAgICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Wb2x1bWVDaGFuZ2VDYXB0dXJlPyAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25XYWl0aW5nPyAgICAgICAgICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25XYWl0aW5nQ2FwdHVyZT8gICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgLy8gI2VuZHJlZ2lvblxuXG4gICAgICAgICAgLy8gI3JlZ2lvbiBNb3VzZUV2ZW50c1xuICAgICAgICAgIG9uQ2xpY2s/ICAgICAgICAgICAgIDogTW91c2VFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkNsaWNrQ2FwdHVyZT8gICAgICA6IE1vdXNlRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Db250ZXh0TWVudT8gICAgICAgOiBNb3VzZUV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uQ29udGV4dE1lbnVDYXB0dXJlPzogTW91c2VFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkRibENsaWNrPyAgICAgICAgICA6IE1vdXNlRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25EYmxDbGlja0NhcHR1cmU/ICAgOiBNb3VzZUV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRHJhZz8gICAgICAgICAgICAgIDogRHJhZ0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRHJhZ0NhcHR1cmU/ICAgICAgIDogRHJhZ0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRHJhZ0VuZD8gICAgICAgICAgIDogRHJhZ0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRHJhZ0VuZENhcHR1cmU/ICAgIDogRHJhZ0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRHJhZ0VudGVyPyAgICAgICAgIDogRHJhZ0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRHJhZ0VudGVyQ2FwdHVyZT8gIDogRHJhZ0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRHJhZ0V4aXQ/ICAgICAgICAgIDogRHJhZ0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRHJhZ0V4aXRDYXB0dXJlPyAgIDogRHJhZ0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRHJhZ0xlYXZlPyAgICAgICAgIDogRHJhZ0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRHJhZ0xlYXZlQ2FwdHVyZT8gIDogRHJhZ0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRHJhZ092ZXI/ICAgICAgICAgIDogRHJhZ0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRHJhZ092ZXJDYXB0dXJlPyAgIDogRHJhZ0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRHJhZ1N0YXJ0PyAgICAgICAgIDogRHJhZ0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRHJhZ1N0YXJ0Q2FwdHVyZT8gIDogRHJhZ0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRHJvcD8gICAgICAgICAgICAgIDogRHJhZ0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRHJvcENhcHR1cmU/ICAgICAgIDogRHJhZ0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uTW91c2VEb3duPyAgICAgICAgIDogTW91c2VFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbk1vdXNlRG93bkNhcHR1cmU/ICA6IE1vdXNlRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Nb3VzZUVudGVyPyAgICAgICAgOiBNb3VzZUV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uTW91c2VFbnRlckNhcHR1cmU/IDogTW91c2VFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbk1vdXNlTGVhdmU/ICAgICAgICA6IE1vdXNlRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Nb3VzZUxlYXZlQ2FwdHVyZT8gOiBNb3VzZUV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uTW91c2VNb3ZlPyAgICAgICAgIDogTW91c2VFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbk1vdXNlTW92ZUNhcHR1cmU/ICA6IE1vdXNlRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Nb3VzZU91dD8gICAgICAgICAgOiBNb3VzZUV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uTW91c2VPdXRDYXB0dXJlPyAgIDogTW91c2VFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbk1vdXNlT3Zlcj8gICAgICAgICA6IE1vdXNlRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Nb3VzZU92ZXJDYXB0dXJlPyAgOiBNb3VzZUV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uTW91c2VVcD8gICAgICAgICAgIDogTW91c2VFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbk1vdXNlVXBDYXB0dXJlPyAgICA6IE1vdXNlRXZlbnRIYW5kbGVyXG4gICAgICAgICAgLy8gI2VuZHJlZ2lvblxuXG4gICAgICAgICAgLy8gI3JlZ2lvbiBTZWxlY3Rpb24gRXZlbnRzXG4gICAgICAgICAgb25TZWxlY3Q/OiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25TZWxlY3RDYXB0dXJlPzogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIC8vICNlbmRyZWdpb25cblxuICAgICAgICAgIC8vICNyZWdpb24gVG91Y2ggRXZlbnRzXG4gICAgICAgICAgb25Ub3VjaENhbmNlbD86IFRvdWNoRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Ub3VjaENhbmNlbENhcHR1cmU/OiBUb3VjaEV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uVG91Y2hFbmQ/OiBUb3VjaEV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uVG91Y2hFbmRDYXB0dXJlPzogVG91Y2hFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblRvdWNoTW92ZT86IFRvdWNoRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Ub3VjaE1vdmVDYXB0dXJlPzogVG91Y2hFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblRvdWNoU3RhcnQ/OiBUb3VjaEV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uVG91Y2hTdGFydENhcHR1cmU/OiBUb3VjaEV2ZW50SGFuZGxlclxuICAgICAgICAgIC8vICNlbmRyZWdpb25cblxuICAgICAgICAgIC8vICNyZWdpb24gUG9pbnRlciBFdmVudHNcbiAgICAgICAgICBvblBvaW50ZXJPdmVyPyAgICAgICAgICAgICAgOiBQb2ludGVyRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Qb2ludGVyT3ZlckNhcHR1cmU/ICAgICAgIDogUG9pbnRlckV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uUG9pbnRlckVudGVyPyAgICAgICAgICAgICA6IFBvaW50ZXJFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblBvaW50ZXJFbnRlckNhcHR1cmU/ICAgICAgOiBQb2ludGVyRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Qb2ludGVyRG93bj8gICAgICAgICAgICAgIDogUG9pbnRlckV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uUG9pbnRlckRvd25DYXB0dXJlPyAgICAgICA6IFBvaW50ZXJFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblBvaW50ZXJNb3ZlPyAgICAgICAgICAgICAgOiBQb2ludGVyRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Qb2ludGVyTW92ZUNhcHR1cmU/ICAgICAgIDogUG9pbnRlckV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uUG9pbnRlclVwPyAgICAgICAgICAgICAgICA6IFBvaW50ZXJFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblBvaW50ZXJVcENhcHR1cmU/ICAgICAgICAgOiBQb2ludGVyRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Qb2ludGVyQ2FuY2VsPyAgICAgICAgICAgIDogUG9pbnRlckV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uUG9pbnRlckNhbmNlbENhcHR1cmU/ICAgICA6IFBvaW50ZXJFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblBvaW50ZXJPdXQ/ICAgICAgICAgICAgICAgOiBQb2ludGVyRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Qb2ludGVyT3V0Q2FwdHVyZT8gICAgICAgIDogUG9pbnRlckV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uUG9pbnRlckxlYXZlPyAgICAgICAgICAgICA6IFBvaW50ZXJFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblBvaW50ZXJMZWF2ZUNhcHR1cmU/ICAgICAgOiBQb2ludGVyRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Hb3RQb2ludGVyQ2FwdHVyZT8gICAgICAgIDogUG9pbnRlckV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uR290UG9pbnRlckNhcHR1cmVDYXB0dXJlPyA6IFBvaW50ZXJFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkxvc3RQb2ludGVyQ2FwdHVyZT8gICAgICAgOiBQb2ludGVyRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Mb3N0UG9pbnRlckNhcHR1cmVDYXB0dXJlPzogUG9pbnRlckV2ZW50SGFuZGxlclxuICAgICAgICAgIC8vICNlbmRyZWdpb25cblxuICAgICAgICAgIC8vICNyZWdpb24gVUkgRXZlbnRzXG4gICAgICAgICAgb25TY3JvbGw/ICAgICAgIDogVUlFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblNjcm9sbENhcHR1cmU/OiBVSUV2ZW50SGFuZGxlclxuICAgICAgICAgIC8vICNlbmRyZWdpb25cblxuICAgICAgICAgIC8vICNyZWdpb24gV2hlZWwgRXZlbnRzXG4gICAgICAgICAgb25XaGVlbD8gICAgICAgOiBXaGVlbEV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uV2hlZWxDYXB0dXJlPzogV2hlZWxFdmVudEhhbmRsZXJcbiAgICAgICAgICAvLyAjZW5kcmVnaW9uXG5cbiAgICAgICAgICAvLyAjcmVnaW9uIEFuaW1hdGlvbiBFdmVudHNcbiAgICAgICAgICBvbkFuaW1hdGlvblN0YXJ0PyAgICAgICAgICAgOiBBbmltYXRpb25FdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkFuaW1hdGlvblN0YXJ0Q2FwdHVyZT8gICAgOiBBbmltYXRpb25FdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkFuaW1hdGlvbkVuZD8gICAgICAgICAgICAgOiBBbmltYXRpb25FdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkFuaW1hdGlvbkVuZENhcHR1cmU/ICAgICAgOiBBbmltYXRpb25FdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkFuaW1hdGlvbkl0ZXJhdGlvbj8gICAgICAgOiBBbmltYXRpb25FdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkFuaW1hdGlvbkl0ZXJhdGlvbkNhcHR1cmU/OiBBbmltYXRpb25FdmVudEhhbmRsZXJcbiAgICAgICAgICAvLyAjZW5kcmVnaW9uXG5cbiAgICAgICAgICAvLyAjcmVnaW9uIFRyYW5zaXRpb24gRXZlbnRzXG4gICAgICAgICAgb25UcmFuc2l0aW9uRW5kPyAgICAgICA6IFRyYW5zaXRpb25FdmVudEhhbmRsZXJcbiAgICAgICAgICBvblRyYW5zaXRpb25FbmRDYXB0dXJlPzogVHJhbnNpdGlvbkV2ZW50SGFuZGxlclxuICAgICAgICAgIC8vICNlbmRyZWdpb25cbiAgICAgfVxuXG4gICAgIGludGVyZmFjZSBIVE1MQXR0cmlidXRlcyBleHRlbmRzIERPTUF0dHJpYnV0ZXNcbiAgICAge1xuICAgICAgICAgIC8vIFN0YW5kYXJkIEhUTUwgQXR0cmlidXRlc1xuICAgICAgICAgIGFjY2VwdD8gICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgYWNjZXB0Q2hhcnNldD8gICAgOiBzdHJpbmdcbiAgICAgICAgICBhY2Nlc3NLZXk/ICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGFjdGlvbj8gICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgYWxsb3dGdWxsU2NyZWVuPyAgOiBzdHJpbmcgfCBib29sZWFuXG4gICAgICAgICAgYWxsb3dUcmFuc3BhcmVuY3k/OiBzdHJpbmcgfCBib29sZWFuXG4gICAgICAgICAgYWx0PyAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBhc3luYz8gICAgICAgICAgICA6IHN0cmluZyB8IGJvb2xlYW5cbiAgICAgICAgICBhdXRvY29tcGxldGU/ICAgICA6IHN0cmluZ1xuICAgICAgICAgIGF1dG9Db21wbGV0ZT8gICAgIDogc3RyaW5nXG4gICAgICAgICAgYXV0b2NvcnJlY3Q/ICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBhdXRvQ29ycmVjdD8gICAgICA6IHN0cmluZ1xuICAgICAgICAgIGF1dG9mb2N1cz8gICAgICAgIDogc3RyaW5nIHwgYm9vbGVhblxuICAgICAgICAgIGF1dG9Gb2N1cz8gICAgICAgIDogc3RyaW5nIHwgYm9vbGVhblxuICAgICAgICAgIGF1dG9QbGF5PyAgICAgICAgIDogc3RyaW5nIHwgYm9vbGVhblxuICAgICAgICAgIGNhcHR1cmU/ICAgICAgICAgIDogc3RyaW5nIHwgYm9vbGVhblxuICAgICAgICAgIGNlbGxQYWRkaW5nPyAgICAgIDogc3RyaW5nIHwgbnVtYmVyXG4gICAgICAgICAgY2VsbFNwYWNpbmc/ICAgICAgOiBzdHJpbmcgfCBudW1iZXJcbiAgICAgICAgICBjaGFyU2V0PyAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGNoYWxsZW5nZT8gICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgY2hlY2tlZD8gICAgICAgICAgOiBzdHJpbmcgfCBib29sZWFuXG4gICAgICAgICAgY2xhc3M/ICAgICAgICAgICAgOiBzdHJpbmcgfCBzdHJpbmdbXVxuICAgICAgICAgIGNsYXNzTmFtZT8gICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgY29scz8gICAgICAgICAgICAgOiBzdHJpbmcgfCBudW1iZXJcbiAgICAgICAgICBjb2xTcGFuPyAgICAgICAgICA6IHN0cmluZyB8IG51bWJlclxuICAgICAgICAgIGNvbnRlbnQ/ICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgY29udGVudEVkaXRhYmxlPyAgOiBzdHJpbmcgfCBib29sZWFuXG4gICAgICAgICAgY29udGV4dE1lbnU/ICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBjb250cm9scz8gICAgICAgICA6IHN0cmluZyB8IGJvb2xlYW5cbiAgICAgICAgICBjb250cm9sc0xpc3Q/ICAgICA6IHN0cmluZ1xuICAgICAgICAgIGNvb3Jkcz8gICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgY3Jvc3NPcmlnaW4/ICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBkYXRhPyAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGRhdGVUaW1lPyAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgZGVmYXVsdD8gICAgICAgICAgOiBzdHJpbmcgfCBib29sZWFuXG4gICAgICAgICAgZGVmZXI/ICAgICAgICAgICAgOiBzdHJpbmcgfCBib29sZWFuXG4gICAgICAgICAgZGlyPyAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBkaXNhYmxlZD8gICAgICAgICA6IHN0cmluZyB8IGJvb2xlYW5cbiAgICAgICAgICBkb3dubG9hZD8gICAgICAgICA6IGFueVxuICAgICAgICAgIGRyYWdnYWJsZT8gICAgICAgIDogc3RyaW5nIHwgYm9vbGVhblxuICAgICAgICAgIGVuY1R5cGU/ICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgZm9ybT8gICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBmb3JtQWN0aW9uPyAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGZvcm1FbmNUeXBlPyAgICAgIDogc3RyaW5nXG4gICAgICAgICAgZm9ybU1ldGhvZD8gICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBmb3JtTm9WYWxpZGF0ZT8gICA6IHN0cmluZyB8IGJvb2xlYW5cbiAgICAgICAgICBmb3JtVGFyZ2V0PyAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGZyYW1lQm9yZGVyPyAgICAgIDogc3RyaW5nIHwgbnVtYmVyXG4gICAgICAgICAgaGVhZGVycz8gICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBoZWlnaHQ/ICAgICAgICAgICA6IHN0cmluZyB8IG51bWJlclxuICAgICAgICAgIGhpZGRlbj8gICAgICAgICAgIDogc3RyaW5nIHwgYm9vbGVhblxuICAgICAgICAgIGhpZ2g/ICAgICAgICAgICAgIDogc3RyaW5nIHwgbnVtYmVyXG4gICAgICAgICAgaHJlZj8gICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBocmVmTGFuZz8gICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGZvcj8gICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgaHRtbEZvcj8gICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBodHRwRXF1aXY/ICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGljb24/ICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgaWQ/ICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBpbnB1dE1vZGU/ICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGludGVncml0eT8gICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgaXM/ICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBrZXlQYXJhbXM/ICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGtleVR5cGU/ICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAga2luZD8gICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBsYWJlbD8gICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGxhbmc/ICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgbGlzdD8gICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBsb29wPyAgICAgICAgICAgICA6IHN0cmluZyB8IGJvb2xlYW5cbiAgICAgICAgICBsb3c/ICAgICAgICAgICAgICA6IHN0cmluZyB8IG51bWJlclxuICAgICAgICAgIG1hbmlmZXN0PyAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgbWFyZ2luSGVpZ2h0PyAgICAgOiBzdHJpbmcgfCBudW1iZXJcbiAgICAgICAgICBtYXJnaW5XaWR0aD8gICAgICA6IHN0cmluZyB8IG51bWJlclxuICAgICAgICAgIG1heD8gICAgICAgICAgICAgIDogc3RyaW5nIHwgbnVtYmVyXG4gICAgICAgICAgbWF4TGVuZ3RoPyAgICAgICAgOiBzdHJpbmcgfCBudW1iZXJcbiAgICAgICAgICBtZWRpYT8gICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIG1lZGlhR3JvdXA/ICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgbWV0aG9kPyAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBtaW4/ICAgICAgICAgICAgICA6IHN0cmluZyB8IG51bWJlclxuICAgICAgICAgIG1pbkxlbmd0aD8gICAgICAgIDogc3RyaW5nIHwgbnVtYmVyXG4gICAgICAgICAgbXVsdGlwbGU/ICAgICAgICAgOiBzdHJpbmcgfCBib29sZWFuXG4gICAgICAgICAgbXV0ZWQ/ICAgICAgICAgICAgOiBzdHJpbmcgfCBib29sZWFuXG4gICAgICAgICAgbmFtZT8gICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBub1ZhbGlkYXRlPyAgICAgICA6IHN0cmluZyB8IGJvb2xlYW5cbiAgICAgICAgICBvcGVuPyAgICAgICAgICAgICA6IHN0cmluZyB8IGJvb2xlYW5cbiAgICAgICAgICBvcHRpbXVtPyAgICAgICAgICA6IHN0cmluZyB8IG51bWJlclxuICAgICAgICAgIHBhdHRlcm4/ICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgcGxhY2Vob2xkZXI/ICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBwbGF5c0lubGluZT8gICAgICA6IHN0cmluZyB8IGJvb2xlYW5cbiAgICAgICAgICBwb3N0ZXI/ICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHByZWxvYWQ/ICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgcmFkaW9Hcm91cD8gICAgICAgOiBzdHJpbmdcbiAgICAgICAgICByZWFkT25seT8gICAgICAgICA6IHN0cmluZyB8IGJvb2xlYW5cbiAgICAgICAgICByZWw/ICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHJlcXVpcmVkPyAgICAgICAgIDogc3RyaW5nIHwgYm9vbGVhblxuICAgICAgICAgIHJvbGU/ICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgcm93cz8gICAgICAgICAgICAgOiBzdHJpbmcgfCBudW1iZXJcbiAgICAgICAgICByb3dTcGFuPyAgICAgICAgICA6IHN0cmluZyB8IG51bWJlclxuICAgICAgICAgIHNhbmRib3g/ICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgc2NvcGU/ICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBzY29wZWQ/ICAgICAgICAgICA6IHN0cmluZyB8IGJvb2xlYW5cbiAgICAgICAgICBzY3JvbGxpbmc/ICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHNlYW1sZXNzPyAgICAgICAgIDogc3RyaW5nIHwgYm9vbGVhblxuICAgICAgICAgIHNlbGVjdGVkPyAgICAgICAgIDogc3RyaW5nIHwgYm9vbGVhblxuICAgICAgICAgIHNoYXBlPyAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgc2l6ZT8gICAgICAgICAgICAgOiBzdHJpbmcgfCBudW1iZXJcbiAgICAgICAgICBzaXplcz8gICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHNsb3Q/ICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgc3Bhbj8gICAgICAgICAgICAgOiBzdHJpbmcgfCBudW1iZXJcbiAgICAgICAgICBzcGVsbGNoZWNrPyAgICAgICA6IHN0cmluZyB8IGJvb2xlYW5cbiAgICAgICAgICBzcmM/ICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHNyY3NldD8gICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgc3JjRG9jPyAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBzcmNMYW5nPyAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHNyY1NldD8gICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgc3RhcnQ/ICAgICAgICAgICAgOiBzdHJpbmcgfCBudW1iZXJcbiAgICAgICAgICBzdGVwPyAgICAgICAgICAgICA6IHN0cmluZyB8IG51bWJlclxuICAgICAgICAgIHN0eWxlPyAgICAgICAgICAgIDogc3RyaW5nIHwgeyBbIGtleTogc3RyaW5nIF06IHN0cmluZyB8IG51bWJlciB9XG4gICAgICAgICAgc3VtbWFyeT8gICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICB0YWJJbmRleD8gICAgICAgICA6IHN0cmluZyB8IG51bWJlclxuICAgICAgICAgIHRhcmdldD8gICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgdGl0bGU/ICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICB0eXBlPyAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHVzZU1hcD8gICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgdmFsdWU/ICAgICAgICAgICAgOiBzdHJpbmcgfCBzdHJpbmdbXSB8IG51bWJlclxuICAgICAgICAgIHdpZHRoPyAgICAgICAgICAgIDogc3RyaW5nIHwgbnVtYmVyXG4gICAgICAgICAgd21vZGU/ICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICB3cmFwPyAgICAgICAgICAgICA6IHN0cmluZ1xuXG4gICAgICAgICAgLy8gUkRGYSBBdHRyaWJ1dGVzXG4gICAgICAgICAgYWJvdXQ/OiBzdHJpbmdcbiAgICAgICAgICBkYXRhdHlwZT86IHN0cmluZ1xuICAgICAgICAgIGlubGlzdD86IGFueVxuICAgICAgICAgIHByZWZpeD86IHN0cmluZ1xuICAgICAgICAgIHByb3BlcnR5Pzogc3RyaW5nXG4gICAgICAgICAgcmVzb3VyY2U/OiBzdHJpbmdcbiAgICAgICAgICB0eXBlb2Y/OiBzdHJpbmdcbiAgICAgICAgICB2b2NhYj86IHN0cmluZ1xuXG4gICAgICAgICAgLy8gTWljcm9kYXRhIEF0dHJpYnV0ZXNcbiAgICAgICAgICBpdGVtUHJvcD86IHN0cmluZ1xuICAgICAgICAgIGl0ZW1TY29wZT86IGJvb2xlYW5cbiAgICAgICAgICBpdGVtVHlwZT86IHN0cmluZ1xuICAgICAgICAgIGl0ZW1JRD86IHN0cmluZ1xuICAgICAgICAgIGl0ZW1SZWY/OiBzdHJpbmdcbiAgICAgfVxuXG4gICAgIGludGVyZmFjZSBTVkdBdHRyaWJ1dGVzIGV4dGVuZHMgSFRNTEF0dHJpYnV0ZXNcbiAgICAge1xuICAgICAgICAgIGFjY2VudEhlaWdodD8gICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgYWNjdW11bGF0ZT8gICAgICAgICAgICAgICAgOiBcIm5vbmVcIiB8IFwic3VtXCJcbiAgICAgICAgICBhZGRpdGl2ZT8gICAgICAgICAgICAgICAgICA6IFwicmVwbGFjZVwiIHwgXCJzdW1cIlxuICAgICAgICAgIGFsaWdubWVudEJhc2VsaW5lPyAgICAgICAgIDogXCJhdXRvXCIgfCBcImJhc2VsaW5lXCIgfCBcImJlZm9yZS1lZGdlXCIgfCBcInRleHQtYmVmb3JlLWVkZ2VcIiB8IFwibWlkZGxlXCIgfCBcImNlbnRyYWxcIiB8IFwiYWZ0ZXItZWRnZVwiIHwgXCJ0ZXh0LWFmdGVyLWVkZ2VcIiB8IFwiaWRlb2dyYXBoaWNcIiB8IFwiYWxwaGFiZXRpY1wiIHwgXCJoYW5naW5nXCIgfCBcIm1hdGhlbWF0aWNhbFwiIHwgXCJpbmhlcml0XCJcbiAgICAgICAgICBhbGxvd1Jlb3JkZXI/ICAgICAgICAgICAgICA6IFwibm9cIiB8IFwieWVzXCJcbiAgICAgICAgICBhbHBoYWJldGljPyAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGFtcGxpdHVkZT8gICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgYXJhYmljRm9ybT8gICAgICAgICAgICAgICAgOiBcImluaXRpYWxcIiB8IFwibWVkaWFsXCIgfCBcInRlcm1pbmFsXCIgfCBcImlzb2xhdGVkXCJcbiAgICAgICAgICBhc2NlbnQ/ICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGF0dHJpYnV0ZU5hbWU/ICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgYXR0cmlidXRlVHlwZT8gICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBhdXRvUmV2ZXJzZT8gICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGF6aW11dGg/ICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgYmFzZUZyZXF1ZW5jeT8gICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBiYXNlbGluZVNoaWZ0PyAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGJhc2VQcm9maWxlPyAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgYmJveD8gICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBiZWdpbj8gICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGJpYXM/ICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgYnk/ICAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBjYWxjTW9kZT8gICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGNhcEhlaWdodD8gICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgY2xpcD8gICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBjbGlwUGF0aD8gICAgICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGNsaXBQYXRoVW5pdHM/ICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgY2xpcFJ1bGU/ICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBjb2xvckludGVycG9sYXRpb24/ICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGNvbG9ySW50ZXJwb2xhdGlvbkZpbHRlcnM/IDogXCJhdXRvXCIgfCBcInNSR0JcIiB8IFwibGluZWFyUkdCXCIgfCBcImluaGVyaXRcIlxuICAgICAgICAgIGNvbG9yUHJvZmlsZT8gICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgY29sb3JSZW5kZXJpbmc/ICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBjb250ZW50U2NyaXB0VHlwZT8gICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGNvbnRlbnRTdHlsZVR5cGU/ICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgY3Vyc29yPyAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBjeD8gICAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGN5PyAgICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZD8gICAgICAgICAgICAgICAgICAgICAgICAgOiBzdHJpbmcgfCAobnVtYmVyIHwgc3RyaW5nKSBbXVxuICAgICAgICAgIGRlY2VsZXJhdGU/ICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZGVzY2VudD8gICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBkaWZmdXNlQ29uc3RhbnQ/ICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGRpcmVjdGlvbj8gICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZGlzcGxheT8gICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBkaXZpc29yPyAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGRvbWluYW50QmFzZWxpbmU/ICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZHVyPyAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBkeD8gICAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGR5PyAgICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZWRnZU1vZGU/ICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBlbGV2YXRpb24/ICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGVuYWJsZUJhY2tncm91bmQ/ICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZW5kPyAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBleHBvbmVudD8gICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGV4dGVybmFsUmVzb3VyY2VzUmVxdWlyZWQ/IDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZmlsbD8gICAgICAgICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBmaWxsT3BhY2l0eT8gICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGZpbGxSdWxlPyAgICAgICAgICAgICAgICAgIDogXCJub256ZXJvXCIgfCBcImV2ZW5vZGRcIiB8IFwiaW5oZXJpdFwiXG4gICAgICAgICAgZmlsdGVyPyAgICAgICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBmaWx0ZXJSZXM/ICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGZpbHRlclVuaXRzPyAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZmxvb2RDb2xvcj8gICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBmbG9vZE9wYWNpdHk/ICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGZvY3VzYWJsZT8gICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZm9udEZhbWlseT8gICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBmb250U2l6ZT8gICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGZvbnRTaXplQWRqdXN0PyAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZm9udFN0cmV0Y2g/ICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBmb250U3R5bGU/ICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGZvbnRWYXJpYW50PyAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZm9udFdlaWdodD8gICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBmb3JtYXQ/ICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGZyb20/ICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZng/ICAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBmeT8gICAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGcxPyAgICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZzI/ICAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBnbHlwaE5hbWU/ICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGdseXBoT3JpZW50YXRpb25Ib3Jpem9udGFsPzogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZ2x5cGhPcmllbnRhdGlvblZlcnRpY2FsPyAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBnbHlwaFJlZj8gICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGdyYWRpZW50VHJhbnNmb3JtPyAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgZ3JhZGllbnRVbml0cz8gICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBoYW5naW5nPyAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGhvcml6QWR2WD8gICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgaG9yaXpPcmlnaW5YPyAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBpZGVvZ3JhcGhpYz8gICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGltYWdlUmVuZGVyaW5nPyAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgaW4yPyAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBpbj8gICAgICAgICAgICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGludGVyY2VwdD8gICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgazE/ICAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBrMj8gICAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGszPyAgICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgazQ/ICAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBrPyAgICAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGtlcm5lbE1hdHJpeD8gICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAga2VybmVsVW5pdExlbmd0aD8gICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBrZXJuaW5nPyAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGtleVBvaW50cz8gICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAga2V5U3BsaW5lcz8gICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBrZXlUaW1lcz8gICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGxlbmd0aEFkanVzdD8gICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgbGV0dGVyU3BhY2luZz8gICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBsaWdodGluZ0NvbG9yPyAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGxpbWl0aW5nQ29uZUFuZ2xlPyAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgbG9jYWw/ICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBtYXJrZXJFbmQ/ICAgICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIG1hcmtlckhlaWdodD8gICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgbWFya2VyTWlkPyAgICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBtYXJrZXJTdGFydD8gICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIG1hcmtlclVuaXRzPyAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgbWFya2VyV2lkdGg/ICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBtYXNrPyAgICAgICAgICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIG1hc2tDb250ZW50VW5pdHM/ICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgbWFza1VuaXRzPyAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBtYXRoZW1hdGljYWw/ICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIG1vZGU/ICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgbnVtT2N0YXZlcz8gICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBvZmZzZXQ/ICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIG9wYWNpdHk/ICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgb3BlcmF0b3I/ICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBvcmRlcj8gICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIG9yaWVudD8gICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgb3JpZW50YXRpb24/ICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBvcmlnaW4/ICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIG92ZXJmbG93PyAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgb3ZlcmxpbmVQb3NpdGlvbj8gICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBvdmVybGluZVRoaWNrbmVzcz8gICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHBhaW50T3JkZXI/ICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgcGFub3NlMT8gICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBwYXRoTGVuZ3RoPyAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHBhdHRlcm5Db250ZW50VW5pdHM/ICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgcGF0dGVyblRyYW5zZm9ybT8gICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBwYXR0ZXJuVW5pdHM/ICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHBvaW50ZXJFdmVudHM/ICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgcG9pbnRzPyAgICAgICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBwb2ludHNBdFg/ICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHBvaW50c0F0WT8gICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgcG9pbnRzQXRaPyAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBwcmVzZXJ2ZUFscGhhPyAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHByZXNlcnZlQXNwZWN0UmF0aW8/ICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgcHJpbWl0aXZlVW5pdHM/ICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICByPyAgICAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHJhZGl1cz8gICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgcmVmWD8gICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICByZWZZPyAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHJlbmRlcmluZ0ludGVudD8gICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgcmVwZWF0Q291bnQ/ICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICByZXBlYXREdXI/ICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHJlcXVpcmVkRXh0ZW5zaW9ucz8gICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgcmVxdWlyZWRGZWF0dXJlcz8gICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICByZXN0YXJ0PyAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHJlc3VsdD8gICAgICAgICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgcm90YXRlPyAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICByeD8gICAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHJ5PyAgICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgc2NhbGU/ICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBzZWVkPyAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHNoYXBlUmVuZGVyaW5nPyAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgc2xvcGU/ICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBzcGFjaW5nPyAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHNwZWN1bGFyQ29uc3RhbnQ/ICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgc3BlY3VsYXJFeHBvbmVudD8gICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBzcGVlZD8gICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHNwcmVhZE1ldGhvZD8gICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgc3RhcnRPZmZzZXQ/ICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBzdGREZXZpYXRpb24/ICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHN0ZW1oPyAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgc3RlbXY/ICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBzdGl0Y2hUaWxlcz8gICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHN0b3BDb2xvcj8gICAgICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgc3RvcE9wYWNpdHk/ICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBzdHJpa2V0aHJvdWdoUG9zaXRpb24/ICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHN0cmlrZXRocm91Z2hUaGlja25lc3M/ICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgc3RyaW5nPyAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBzdHJva2U/ICAgICAgICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHN0cm9rZURhc2hhcnJheT8gICAgICAgICAgIDogc3RyaW5nIHwgbnVtYmVyXG4gICAgICAgICAgc3Ryb2tlRGFzaG9mZnNldD8gICAgICAgICAgOiBzdHJpbmcgfCBudW1iZXJcbiAgICAgICAgICBzdHJva2VMaW5lY2FwPyAgICAgICAgICAgICA6IFwiYnV0dFwiIHwgXCJyb3VuZFwiIHwgXCJzcXVhcmVcIiB8IFwiaW5oZXJpdFwiXG4gICAgICAgICAgc3Ryb2tlTGluZWpvaW4/ICAgICAgICAgICAgOiBcIm1pdGVyXCIgfCBcInJvdW5kXCIgfCBcImJldmVsXCIgfCBcImluaGVyaXRcIlxuICAgICAgICAgIHN0cm9rZU1pdGVybGltaXQ/ICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgc3Ryb2tlT3BhY2l0eT8gICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBzdHJva2VXaWR0aD8gICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHN1cmZhY2VTY2FsZT8gICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgc3lzdGVtTGFuZ3VhZ2U/ICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB0YWJsZVZhbHVlcz8gICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHRhcmdldFg/ICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgdGFyZ2V0WT8gICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB0ZXh0QW5jaG9yPyAgICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHRleHREZWNvcmF0aW9uPyAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgdGV4dExlbmd0aD8gICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB0ZXh0UmVuZGVyaW5nPyAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHRvPyAgICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgdHJhbnNmb3JtPyAgICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICB1MT8gICAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHUyPyAgICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgdW5kZXJsaW5lUG9zaXRpb24/ICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB1bmRlcmxpbmVUaGlja25lc3M/ICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHVuaWNvZGU/ICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgdW5pY29kZUJpZGk/ICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB1bmljb2RlUmFuZ2U/ICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHVuaXRzUGVyRW0/ICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgdkFscGhhYmV0aWM/ICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB2YWx1ZXM/ICAgICAgICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHZlY3RvckVmZmVjdD8gICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgdmVyc2lvbj8gICAgICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICB2ZXJ0QWR2WT8gICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHZlcnRPcmlnaW5YPyAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgdmVydE9yaWdpblk/ICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB2SGFuZ2luZz8gICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHZJZGVvZ3JhcGhpYz8gICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgdmlld0JveD8gICAgICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICB2aWV3VGFyZ2V0PyAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHZpc2liaWxpdHk/ICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgdk1hdGhlbWF0aWNhbD8gICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB3aWR0aHM/ICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHdvcmRTcGFjaW5nPyAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgd3JpdGluZ01vZGU/ICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB4MT8gICAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHgyPyAgICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgeD8gICAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB4Q2hhbm5lbFNlbGVjdG9yPyAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHhIZWlnaHQ/ICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgeGxpbmtBY3R1YXRlPyAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICB4bGlua0FyY3JvbGU/ICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHhsaW5rSHJlZj8gICAgICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgeGxpbmtSb2xlPyAgICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICB4bGlua1Nob3c/ICAgICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHhsaW5rVGl0bGU/ICAgICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgeGxpbmtUeXBlPyAgICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICB4bWxCYXNlPyAgICAgICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHhtbExhbmc/ICAgICAgICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgeG1sbnM/ICAgICAgICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICB4bWxuc1hsaW5rPyAgICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHhtbFNwYWNlPyAgICAgICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgeTE/ICAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB5Mj8gICAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHk/ICAgICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgeUNoYW5uZWxTZWxlY3Rvcj8gICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICB6PyAgICAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHpvb21BbmRQYW4/ICAgICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgIH1cbn1cbiIsIlxuZXhwb3J0IGludGVyZmFjZSAgRHJhZ2dhYmxlT3B0aW9uc1xue1xuICAgICBoYW5kbGVzICAgICAgICA6IEpTWC5FbGVtZW50IFtdXG4gICAgIG1pblZlbG9jaXR5PyAgIDogbnVtYmVyXG4gICAgIG1heFZlbG9jaXR5PyAgIDogbnVtYmVyXG4gICAgIHZlbG9jaXR5RmFjdG9yPzogbnVtYmVyXG4gICAgIG9uRHJhZz8gICAgICAgIDogKCBldmVudDogRHJhZ0V2ZW50ICkgPT4gdm9pZFxuICAgICBvblN0YXJ0RHJhZz8gICA6ICgpID0+IHZvaWRcbiAgICAgb25TdG9wRHJhZz8gICAgOiAoIGV2ZW50OiBEcmFnRXZlbnQgKSA9PiBib29sZWFuXG4gICAgIG9uRW5kQW5pbWF0aW9uPzogKCAgZXZlbnQ6IERyYWdFdmVudCAgKSA9PiB2b2lkXG59XG5cbmV4cG9ydCB0eXBlIERyYWdnYWJsZUNvbmZpZyA9IFJlcXVpcmVkIDxEcmFnZ2FibGVPcHRpb25zPlxuXG5leHBvcnQgaW50ZXJmYWNlIERyYWdFdmVudFxue1xuICAgICB4ICAgICAgICA6IG51bWJlclxuICAgICB5ICAgICAgICA6IG51bWJlclxuICAgICBvZmZzZXRYICA6IG51bWJlclxuICAgICBvZmZzZXRZICA6IG51bWJlclxuICAgICB0YXJnZXRYOiBudW1iZXJcbiAgICAgdGFyZ2V0WTogbnVtYmVyXG4gICAgIGRlbGF5ICAgIDogbnVtYmVyXG59XG5cbmZ1bmN0aW9uIGRlZmF1bHRDb25maWcgKCk6IERyYWdnYWJsZUNvbmZpZ1xue1xuICAgICByZXR1cm4ge1xuICAgICAgICAgIGhhbmRsZXMgICAgICAgOiBbXSxcbiAgICAgICAgICBtaW5WZWxvY2l0eSAgIDogMCxcbiAgICAgICAgICBtYXhWZWxvY2l0eSAgIDogMSxcbiAgICAgICAgICBvblN0YXJ0RHJhZyAgIDogKCkgPT4ge30sXG4gICAgICAgICAgb25EcmFnICAgICAgICA6ICgpID0+IHt9LFxuICAgICAgICAgIG9uU3RvcERyYWcgICAgOiAoKSA9PiB0cnVlLFxuICAgICAgICAgIG9uRW5kQW5pbWF0aW9uOiAoKSA9PiB7fSxcbiAgICAgICAgICB2ZWxvY2l0eUZhY3RvcjogKHdpbmRvdy5pbm5lckhlaWdodCA8IHdpbmRvdy5pbm5lcldpZHRoXG4gICAgICAgICAgICAgICAgICAgICAgICAgPyB3aW5kb3cuaW5uZXJIZWlnaHQgOiB3aW5kb3cuaW5uZXJXaWR0aCkgLyAyLFxuICAgICB9XG59XG5cbnZhciBpc19kcmFnICAgID0gZmFsc2VcbnZhciBwb2ludGVyOiBNb3VzZUV2ZW50IHwgVG91Y2hcblxuLy8gaHR0cHM6Ly9naXN0LmdpdGh1Yi5jb20vZ3JlLzE2NTAyOTRcbnZhciBFYXNpbmdGdW5jdGlvbnMgPSB7XG4gICAgIGxpbmVhciAgICAgICAgOiAoIHQ6IG51bWJlciApID0+IHQsXG4gICAgIGVhc2VJblF1YWQgICAgOiAoIHQ6IG51bWJlciApID0+IHQqdCxcbiAgICAgZWFzZU91dFF1YWQgICA6ICggdDogbnVtYmVyICkgPT4gdCooMi10KSxcbiAgICAgZWFzZUluT3V0UXVhZCA6ICggdDogbnVtYmVyICkgPT4gdDwuNSA/IDIqdCp0IDogLTErKDQtMip0KSp0LFxuICAgICBlYXNlSW5DdWJpYyAgIDogKCB0OiBudW1iZXIgKSA9PiB0KnQqdCxcbiAgICAgZWFzZU91dEN1YmljICA6ICggdDogbnVtYmVyICkgPT4gKC0tdCkqdCp0KzEsXG4gICAgIGVhc2VJbk91dEN1YmljOiAoIHQ6IG51bWJlciApID0+IHQ8LjUgPyA0KnQqdCp0IDogKHQtMSkqKDIqdC0yKSooMip0LTIpKzEsXG4gICAgIGVhc2VJblF1YXJ0ICAgOiAoIHQ6IG51bWJlciApID0+IHQqdCp0KnQsXG4gICAgIGVhc2VPdXRRdWFydCAgOiAoIHQ6IG51bWJlciApID0+IDEtKC0tdCkqdCp0KnQsXG4gICAgIGVhc2VJbk91dFF1YXJ0OiAoIHQ6IG51bWJlciApID0+IHQ8LjUgPyA4KnQqdCp0KnQgOiAxLTgqKC0tdCkqdCp0KnQsXG4gICAgIGVhc2VJblF1aW50ICAgOiAoIHQ6IG51bWJlciApID0+IHQqdCp0KnQqdCxcbiAgICAgZWFzZU91dFF1aW50ICA6ICggdDogbnVtYmVyICkgPT4gMSsoLS10KSp0KnQqdCp0LFxuICAgICBlYXNlSW5PdXRRdWludDogKCB0OiBudW1iZXIgKSA9PiB0PC41ID8gMTYqdCp0KnQqdCp0IDogMSsxNiooLS10KSp0KnQqdCp0XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBkcmFnZ2FibGUgKCBvcHRpb25zOiBEcmFnZ2FibGVPcHRpb25zIClcbntcbiAgICAgY29uc3QgY29uZmlnICAgICA9IGRlZmF1bHRDb25maWcgKClcblxuICAgICB2YXIgaXNfYWN0aXZlICA9IGZhbHNlXG4gICAgIHZhciBpc19hbmltYXRlID0gZmFsc2VcbiAgICAgdmFyIGN1cnJlbnRfZXZlbnQ6IERyYWdFdmVudFxuXG4gICAgIHZhciBzdGFydF90aW1lID0gMFxuICAgICB2YXIgc3RhcnRfeCAgICA9IDBcbiAgICAgdmFyIHN0YXJ0X3kgICAgPSAwXG5cbiAgICAgdmFyIHZlbG9jaXR5X2RlbGF5ID0gNTAwXG4gICAgIHZhciB2ZWxvY2l0eV94OiBudW1iZXJcbiAgICAgdmFyIHZlbG9jaXR5X3k6IG51bWJlclxuXG4gICAgIHZhciBjdXJyZW50X2FuaW1hdGlvbiA9IC0xXG5cbiAgICAgdXBkYXRlQ29uZmlnICggb3B0aW9ucyApXG5cbiAgICAgZnVuY3Rpb24gdXBkYXRlQ29uZmlnICggb3B0aW9uczogRHJhZ2dhYmxlT3B0aW9ucyApXG4gICAgIHtcbiAgICAgICAgICBpZiAoIGlzX2RyYWcgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICggbmF2aWdhdG9yLm1heFRvdWNoUG9pbnRzID4gMCApXG4gICAgICAgICAgICAgICBkb2N1bWVudC5ib2R5LnN0eWxlLnRvdWNoQWN0aW9uID0gXCJub25lXCJcblxuICAgICAgICAgIGRpc2FibGVFdmVudHMgKClcblxuICAgICAgICAgIE9iamVjdC5hc3NpZ24gKCBjb25maWcsIG9wdGlvbnMgKVxuXG4gICAgICAgICAgZW5hYmxlRXZlbnRzICgpXG4gICAgIH1cblxuICAgICBmdW5jdGlvbiBhZGRIYW5kbGVzICggLi4uIGhhbmRsZXM6IEpTWC5FbGVtZW50IFtdIClcbiAgICAge1xuICAgICAgICAgIGZvciAoIGNvbnN0IGggb2YgaGFuZGxlcyApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgaWYgKCAhIGNvbmZpZy5oYW5kbGVzLmluY2x1ZGVzIChoKSApXG4gICAgICAgICAgICAgICAgICAgIGNvbmZpZy5oYW5kbGVzLnB1c2ggKGgpXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKCBpc19hY3RpdmUgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGRlc2FjdGl2YXRlICgpXG4gICAgICAgICAgICAgICBhY3RpdmF0ZSAoKVxuICAgICAgICAgIH1cbiAgICAgfVxuXG4gICAgIGZ1bmN0aW9uIGFjdGl2YXRlICgpXG4gICAgIHtcbiAgICAgICAgICBlbmFibGVFdmVudHMgKClcbiAgICAgICAgICBpc19hY3RpdmUgPSB0cnVlXG4gICAgIH1cblxuICAgICBmdW5jdGlvbiBkZXNhY3RpdmF0ZSAoKVxuICAgICB7XG4gICAgICAgICAgZGlzYWJsZUV2ZW50cyAoKVxuICAgICAgICAgIGlzX2FjdGl2ZSA9IGZhbHNlXG4gICAgIH1cblxuICAgICByZXR1cm4ge1xuICAgICAgICAgIHVwZGF0ZUNvbmZpZyxcbiAgICAgICAgICBhZGRIYW5kbGVzLFxuICAgICAgICAgIGlzQWN0aXZlOiAoKSA9PiBpc19hY3RpdmUsXG4gICAgICAgICAgYWN0aXZhdGUsXG4gICAgICAgICAgZGVzYWN0aXZhdGUsXG4gICAgIH1cblxuICAgICBmdW5jdGlvbiBlbmFibGVFdmVudHMgKClcbiAgICAge1xuICAgICAgICAgIGZvciAoIGNvbnN0IGggb2YgY29uZmlnLmhhbmRsZXMgKVxuICAgICAgICAgICAgICAgaC5hZGRFdmVudExpc3RlbmVyICggXCJwb2ludGVyZG93blwiLCBvblN0YXJ0LCB7IHBhc3NpdmU6IHRydWUgfSApXG4gICAgIH1cbiAgICAgZnVuY3Rpb24gZGlzYWJsZUV2ZW50cyAoKVxuICAgICB7XG4gICAgICAgICAgZm9yICggY29uc3QgaCBvZiBjb25maWcuaGFuZGxlcyApXG4gICAgICAgICAgICAgICBoLnJlbW92ZUV2ZW50TGlzdGVuZXIgKCBcInBvaW50ZXJkb3duXCIgLCBvblN0YXJ0IClcbiAgICAgfVxuXG4gICAgIGZ1bmN0aW9uIG9uU3RhcnQgKCBldmVudDogTW91c2VFdmVudCB8IFRvdWNoRXZlbnQgKVxuICAgICB7XG4gICAgICAgICAgaWYgKCBpc19kcmFnIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBjb25zb2xlLndhcm4gKCBcIlRlbnRhdGl2ZSBkZSBkw6ltYXJyYWdlIGRlcyDDqXbDqW5lbWVudHMgXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgXCJcXFwiZHJhZ2dhYmxlIFxcXCIgZMOpasOgIGVuIGNvdXJzLlwiIClcbiAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICggaXNfYW5pbWF0ZSApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgc3RvcFZlbG9jaXR5RnJhbWUgKClcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBwb2ludGVyID0gKGV2ZW50IGFzIFRvdWNoRXZlbnQpLnRvdWNoZXNcbiAgICAgICAgICAgICAgICAgICAgPyAoZXZlbnQgYXMgVG91Y2hFdmVudCkudG91Y2hlcyBbMF1cbiAgICAgICAgICAgICAgICAgICAgOiAoZXZlbnQgYXMgTW91c2VFdmVudClcblxuICAgICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyIChcInBvaW50ZXJtb3ZlXCIsIG9uTW92ZSlcbiAgICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lciAoXCJwb2ludGVydXBcIiAgLCBvbkVuZClcbiAgICAgICAgICBkaXNhYmxlRXZlbnRzICgpXG5cbiAgICAgICAgICBjdXJyZW50X2FuaW1hdGlvbiA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgKCBvbkFuaW1hdGlvblN0YXJ0IClcblxuICAgICAgICAgIGlzX2RyYWcgPSB0cnVlXG4gICAgIH1cbiAgICAgZnVuY3Rpb24gb25Nb3ZlICggZXZlbnQ6IE1vdXNlRXZlbnQgfCBUb3VjaEV2ZW50IClcbiAgICAge1xuICAgICAgICAgIGlmICggaXNfZHJhZyA9PSBmYWxzZSApXG4gICAgICAgICAgICAgICByZXR1cm5cblxuICAgICAgICAgIHBvaW50ZXIgPSAoZXZlbnQgYXMgVG91Y2hFdmVudCkudG91Y2hlcyAhPT0gdW5kZWZpbmVkXG4gICAgICAgICAgICAgICAgICAgID8gKGV2ZW50IGFzIFRvdWNoRXZlbnQpLnRvdWNoZXMgWzBdXG4gICAgICAgICAgICAgICAgICAgIDogKGV2ZW50IGFzIE1vdXNlRXZlbnQpXG4gICAgIH1cbiAgICAgZnVuY3Rpb24gb25FbmQgKCBldmVudDogTW91c2VFdmVudCB8IFRvdWNoRXZlbnQgKVxuICAgICB7XG4gICAgICAgICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIgKFwicG9pbnRlcm1vdmVcIiwgb25Nb3ZlKVxuICAgICAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyIChcInBvaW50ZXJ1cFwiICAsIG9uRW5kKVxuICAgICAgICAgIGVuYWJsZUV2ZW50cyAoKVxuXG4gICAgICAgICAgaXNfZHJhZyA9IGZhbHNlXG4gICAgIH1cblxuICAgICBmdW5jdGlvbiBvbkFuaW1hdGlvblN0YXJ0ICggbm93OiBudW1iZXIgKVxuICAgICB7XG4gICAgICAgICAgc3RhcnRfeCAgICA9IHBvaW50ZXIuY2xpZW50WFxuICAgICAgICAgIHN0YXJ0X3kgICAgPSBwb2ludGVyLmNsaWVudFlcbiAgICAgICAgICBzdGFydF90aW1lID0gbm93XG5cbiAgICAgICAgICBjdXJyZW50X2V2ZW50ID0ge1xuICAgICAgICAgICAgICAgZGVsYXkgICAgOiAwLFxuICAgICAgICAgICAgICAgeCAgICAgICAgOiAwLFxuICAgICAgICAgICAgICAgeSAgICAgICAgOiAwLFxuICAgICAgICAgICAgICAgb2Zmc2V0WCAgOiAwLFxuICAgICAgICAgICAgICAgb2Zmc2V0WSAgOiAwLFxuICAgICAgICAgICAgICAgdGFyZ2V0WDogMCxcbiAgICAgICAgICAgICAgIHRhcmdldFk6IDAsXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29uZmlnLm9uU3RhcnREcmFnICgpXG5cbiAgICAgICAgICBjdXJyZW50X2FuaW1hdGlvbiA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgKCBvbkFuaW1hdGlvbkZyYW1lIClcbiAgICAgfVxuICAgICBmdW5jdGlvbiBvbkFuaW1hdGlvbkZyYW1lICggbm93OiBudW1iZXIgKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgeyB2ZWxvY2l0eUZhY3RvciB9ID0gY29uZmlnXG5cbiAgICAgICAgICBjb25zdCB4ICAgICAgICAgICA9IHBvaW50ZXIuY2xpZW50WCAtIHN0YXJ0X3hcbiAgICAgICAgICBjb25zdCB5ICAgICAgICAgICA9IHN0YXJ0X3kgLSBwb2ludGVyLmNsaWVudFlcbiAgICAgICAgICBjb25zdCBkZWxheSAgICAgICA9IG5vdyAtIHN0YXJ0X3RpbWVcbiAgICAgICAgICBjb25zdCBvZmZzZXREZWxheSA9IGRlbGF5IC0gY3VycmVudF9ldmVudC5kZWxheVxuICAgICAgICAgIGNvbnN0IG9mZnNldFggICAgID0geCAtIGN1cnJlbnRfZXZlbnQueFxuICAgICAgICAgIGNvbnN0IG9mZnNldFkgICAgID0geSAtIGN1cnJlbnRfZXZlbnQueVxuXG4gICAgICAgICAgY3VycmVudF9ldmVudCA9IHtcbiAgICAgICAgICAgICAgIGRlbGF5LFxuICAgICAgICAgICAgICAgeCxcbiAgICAgICAgICAgICAgIHksXG4gICAgICAgICAgICAgICB0YXJnZXRYOiB4LFxuICAgICAgICAgICAgICAgdGFyZ2V0WTogeSxcbiAgICAgICAgICAgICAgIG9mZnNldFgsXG4gICAgICAgICAgICAgICBvZmZzZXRZLFxuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICggaXNfZHJhZyApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgY29uZmlnLm9uRHJhZyAoIGN1cnJlbnRfZXZlbnQgKVxuICAgICAgICAgICAgICAgY3VycmVudF9hbmltYXRpb24gPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lICggb25BbmltYXRpb25GcmFtZSApXG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBzdGFydF90aW1lICAgICA9IG5vd1xuICAgICAgICAgICAgICAgc3RhcnRfeCAgICAgICAgPSB4XG4gICAgICAgICAgICAgICBzdGFydF95ICAgICAgICA9IHlcbiAgICAgICAgICAgICAgIHZlbG9jaXR5X3ggICAgICAgPSB2ZWxvY2l0eUZhY3RvciAqIG5vcm0gKCBvZmZzZXRYIC8gb2Zmc2V0RGVsYXkgKVxuICAgICAgICAgICAgICAgdmVsb2NpdHlfeSAgICAgICA9IHZlbG9jaXR5RmFjdG9yICogbm9ybSAoIG9mZnNldFkgLyBvZmZzZXREZWxheSApXG5cbiAgICAgICAgICAgICAgIGN1cnJlbnRfZXZlbnQudGFyZ2V0WCArPSB2ZWxvY2l0eV94XG4gICAgICAgICAgICAgICBjdXJyZW50X2V2ZW50LnRhcmdldFkgKz0gdmVsb2NpdHlfeVxuXG4gICAgICAgICAgICAgICBpZiAoIGNvbmZpZy5vblN0b3BEcmFnICggY3VycmVudF9ldmVudCApID09PSB0cnVlIClcbiAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgaXNfYW5pbWF0ZSA9IHRydWVcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudF9hbmltYXRpb24gPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lICggb25WZWxvY2l0eUZyYW1lIClcbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBmdW5jdGlvbiBub3JtICggdmFsdWU6IG51bWJlciApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgaWYgKHZhbHVlIDwgLTEgKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gLTFcblxuICAgICAgICAgICAgICAgaWYgKCB2YWx1ZSA+IDEgKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gMVxuXG4gICAgICAgICAgICAgICByZXR1cm4gdmFsdWVcbiAgICAgICAgICB9XG4gICAgIH1cbiAgICAgZnVuY3Rpb24gb25WZWxvY2l0eUZyYW1lICggbm93OiBudW1iZXIgKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgZGVsYXkgPSBub3cgLSBzdGFydF90aW1lXG5cbiAgICAgICAgICBjb25zdCB0ID0gZGVsYXkgPj0gdmVsb2NpdHlfZGVsYXlcbiAgICAgICAgICAgICAgICAgID8gMVxuICAgICAgICAgICAgICAgICAgOiBkZWxheSAvIHZlbG9jaXR5X2RlbGF5XG5cbiAgICAgICAgICBjb25zdCBmYWN0b3IgID0gRWFzaW5nRnVuY3Rpb25zLmVhc2VPdXRRdWFydCAodClcbiAgICAgICAgICBjb25zdCBvZmZzZXRYID0gdmVsb2NpdHlfeCAqIGZhY3RvclxuICAgICAgICAgIGNvbnN0IG9mZnNldFkgPSB2ZWxvY2l0eV95ICogZmFjdG9yXG5cbiAgICAgICAgICBjdXJyZW50X2V2ZW50LnggICAgICAgPSBzdGFydF94ICsgb2Zmc2V0WFxuICAgICAgICAgIGN1cnJlbnRfZXZlbnQueSAgICAgICA9IHN0YXJ0X3kgKyBvZmZzZXRZXG4gICAgICAgICAgY3VycmVudF9ldmVudC5vZmZzZXRYID0gdmVsb2NpdHlfeCAtIG9mZnNldFhcbiAgICAgICAgICBjdXJyZW50X2V2ZW50Lm9mZnNldFkgPSB2ZWxvY2l0eV95IC0gb2Zmc2V0WVxuXG4gICAgICAgICAgY29uZmlnLm9uRHJhZyAoIGN1cnJlbnRfZXZlbnQgKVxuXG4gICAgICAgICAgaWYgKCB0ID09IDEgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGlzX2FuaW1hdGUgPSBmYWxzZVxuICAgICAgICAgICAgICAgY29uZmlnLm9uRW5kQW5pbWF0aW9uICggY3VycmVudF9ldmVudCApXG4gICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjdXJyZW50X2FuaW1hdGlvbiA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgKCBvblZlbG9jaXR5RnJhbWUgKVxuICAgICB9XG4gICAgIGZ1bmN0aW9uIHN0b3BWZWxvY2l0eUZyYW1lICgpXG4gICAgIHtcbiAgICAgICAgICBpc19hbmltYXRlID0gZmFsc2VcbiAgICAgICAgICB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUgKCBjdXJyZW50X2FuaW1hdGlvbiApXG4gICAgICAgICAgY29uZmlnLm9uRW5kQW5pbWF0aW9uICggY3VycmVudF9ldmVudCApXG4gICAgIH1cbn1cbiIsIlxuZXhwb3J0IHR5cGUgRXh0ZW5kZWRDU1NTdHlsZURlY2xhcmF0aW9uID0gQ1NTU3R5bGVEZWNsYXJhdGlvbiAmXG57XG4gICAgZGlzcGxheSAgICAgIDogXCJpbmxpbmVcIiB8IFwiYmxvY2tcIiB8IFwiY29udGVudHNcIiB8IFwiZmxleFwiIHwgXCJncmlkXCIgfCBcImlubGluZS1ibG9ja1wiIHwgXCJpbmxpbmUtZmxleFwiIHwgXCJpbmxpbmUtZ3JpZFwiIHwgXCJpbmxpbmUtdGFibGVcIiB8IFwibGlzdC1pdGVtXCIgfCBcInJ1bi1pblwiIHwgXCJ0YWJsZVwiIHwgXCJ0YWJsZS1jYXB0aW9uXCIgfCBcInRhYmxlLWNvbHVtbi1ncm91cFwiIHwgXCJ0YWJsZS1oZWFkZXItZ3JvdXBcIiB8IFwidGFibGUtZm9vdGVyLWdyb3VwXCIgfCBcInRhYmxlLXJvdy1ncm91cFwiIHwgXCJ0YWJsZS1jZWxsXCIgfCBcInRhYmxlLWNvbHVtblwiIHwgXCJ0YWJsZS1yb3dcIiB8IFwibm9uZVwiIHwgXCJpbml0aWFsXCIgfCBcImluaGVyaXRcIlxuICAgIGZsZXhEaXJlY3Rpb246IFwicm93XCIgfCBcInJvdy1yZXZlcnNlXCIgfCBcImNvbHVtblwiIHwgXCJjb2x1bW4tcmV2ZXJzZVwiIHwgXCJpbml0aWFsXCIgfCBcImluaGVyaXRcIlxuICAgIG92ZXJmbG93ICAgICA6IFwidmlzaWJsZVwiIHwgXCJoaWRkZW5cIiB8IFwic2Nyb2xsXCIgfCBcImF1dG9cIiB8IFwiaW5pdGlhbFwiIHwgXCJpbmhlcml0XCJcbiAgICBvdmVyZmxvd1ggICAgOiBcInZpc2libGVcIiB8IFwiaGlkZGVuXCIgfCBcInNjcm9sbFwiIHwgXCJhdXRvXCIgfCBcImluaXRpYWxcIiB8IFwiaW5oZXJpdFwiXG4gICAgb3ZlcmZsb3dZICAgIDogXCJ2aXNpYmxlXCIgfCBcImhpZGRlblwiIHwgXCJzY3JvbGxcIiB8IFwiYXV0b1wiIHwgXCJpbml0aWFsXCIgfCBcImluaGVyaXRcIlxuICAgIHBvc2l0aW9uICAgICA6IFwic3RhdGljXCIgfCBcImFic29sdXRlXCIgfCBcImZpeGVkXCIgfCBcInJlbGF0aXZlXCIgfCBcInN0aWNreVwiIHwgXCJpbml0aWFsXCIgfCBcImluaGVyaXRcIlxufVxuXG4vKmRlY2xhcmUgZ2xvYmFse1xuXG4gICAgIGludGVyZmFjZSBXaW5kb3dcbiAgICAge1xuICAgICAgICAgIG9uOiBXaW5kb3cgW1wiYWRkRXZlbnRMaXN0ZW5lclwiXVxuICAgICAgICAgIG9mZjogV2luZG93IFtcInJlbW92ZUV2ZW50TGlzdGVuZXJcIl1cbiAgICAgfVxuXG4gICAgIGludGVyZmFjZSBFbGVtZW50XG4gICAgIHtcbiAgICAgICAgICBjc3MgKCBwcm9wZXJ0aWVzOiBQYXJ0aWFsIDxFeHRlbmRlZENTU1N0eWxlRGVjbGFyYXRpb24+ICk6IHRoaXNcblxuICAgICAgICAgIGNzc0ludCAgICggcHJvcGVydHk6IHN0cmluZyApOiBudW1iZXJcbiAgICAgICAgICBjc3NGbG9hdCAoIHByb3BlcnR5OiBzdHJpbmcgKTogbnVtYmVyXG5cbiAgICAgICAgICBvbiA6IEhUTUxFbGVtZW50IFtcImFkZEV2ZW50TGlzdGVuZXJcIl1cbiAgICAgICAgICBvZmY6IEhUTUxFbGVtZW50IFtcInJlbW92ZUV2ZW50TGlzdGVuZXJcIl1cbiAgICAgICAgICAkICA6IEhUTUxFbGVtZW50IFtcInF1ZXJ5U2VsZWN0b3JcIl1cbiAgICAgICAgICAkJCA6IEhUTUxFbGVtZW50IFtcInF1ZXJ5U2VsZWN0b3JBbGxcIl1cbiAgICAgfVxufVxuXG5XaW5kb3cucHJvdG90eXBlLm9uICA9IFdpbmRvdy5wcm90b3R5cGUuYWRkRXZlbnRMaXN0ZW5lclxuV2luZG93LnByb3RvdHlwZS5vZmYgPSBXaW5kb3cucHJvdG90eXBlLnJlbW92ZUV2ZW50TGlzdGVuZXJcblxuRWxlbWVudC5wcm90b3R5cGUuY3NzID0gZnVuY3Rpb24gKCBwcm9wcyApXG57XG5PYmplY3QuYXNzaWduICggdGhpcy5zdHlsZSwgcHJvcHMgKVxucmV0dXJuIHRoaXNcbn1cblxuRWxlbWVudC5wcm90b3R5cGUuY3NzSW50ID0gZnVuY3Rpb24gKCBwcm9wZXJ0eTogc3RyaW5nIClcbntcbiAgICAgdmFyIHZhbHVlID0gcGFyc2VJbnQgKCB0aGlzLnN0eWxlIFsgcHJvcGVydHkgXSApXG5cbiAgICAgaWYgKCBOdW1iZXIuaXNOYU4gKCB2YWx1ZSApIClcbiAgICAge1xuICAgICAgICAgIHZhbHVlID0gcGFyc2VJbnQgKCB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZSAoIHRoaXMgKSBbIHByb3BlcnR5IF0gKVxuXG4gICAgICAgICAgaWYgKCBOdW1iZXIuaXNOYU4gKCB2YWx1ZSApIClcbiAgICAgICAgICAgICAgIHZhbHVlID0gMFxuICAgICB9XG5cbiAgICAgcmV0dXJuIHZhbHVlXG59XG5cbkVsZW1lbnQucHJvdG90eXBlLmNzc0Zsb2F0ID0gZnVuY3Rpb24gKCBwcm9wZXJ0eTogc3RyaW5nIClcbntcbiAgICAgdmFyIHZhbHVlID0gcGFyc2VGbG9hdCAoIHRoaXMuc3R5bGUgWyBwcm9wZXJ0eSBdIClcblxuICAgICBpZiAoIE51bWJlci5pc05hTiAoIHZhbHVlICkgKVxuICAgICB7XG4gICAgICAgICAgdmFsdWUgPSBwYXJzZUZsb2F0ICggd2luZG93LmdldENvbXB1dGVkU3R5bGUgKCB0aGlzICkgWyBwcm9wZXJ0eSBdIClcblxuICAgICAgICAgIGlmICggTnVtYmVyLmlzTmFOICggdmFsdWUgKSApXG4gICAgICAgICAgICAgICB2YWx1ZSA9IDBcbiAgICAgfVxuXG4gICAgIHJldHVybiB2YWx1ZVxufVxuXG5FbGVtZW50LnByb3RvdHlwZS5vbiAgPSBFbGVtZW50LnByb3RvdHlwZS5hZGRFdmVudExpc3RlbmVyXG5cbkVsZW1lbnQucHJvdG90eXBlLm9mZiA9IEVsZW1lbnQucHJvdG90eXBlLnJlbW92ZUV2ZW50TGlzdGVuZXJcblxuRWxlbWVudC5wcm90b3R5cGUuJCAgID0gRWxlbWVudC5wcm90b3R5cGUucXVlcnlTZWxlY3RvclxuXG5FbGVtZW50LnByb3RvdHlwZS4kJCAgPSBFbGVtZW50LnByb3RvdHlwZS5xdWVyeVNlbGVjdG9yQWxsXG5cblxuRWxlbWVudC5wcm90b3R5cGUuY3NzSW50ID0gZnVuY3Rpb24gKCBwcm9wZXJ0eTogc3RyaW5nIClcbntcbiAgICAgdmFyIHZhbHVlID0gcGFyc2VJbnQgKCB0aGlzLnN0eWxlIFsgcHJvcGVydHkgXSApXG5cbiAgICAgaWYgKCBOdW1iZXIuaXNOYU4gKCB2YWx1ZSApIClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHN0eWxlID0gd2luZG93LmdldENvbXB1dGVkU3R5bGUgKCB0aGlzIClcblxuICAgICAgICAgIHZhbHVlID0gcGFyc2VJbnQgKCBzdHlsZSBbIHByb3BlcnR5IF0gKVxuXG4gICAgICAgICAgaWYgKCBOdW1iZXIuaXNOYU4gKCB2YWx1ZSApIClcbiAgICAgICAgICAgICAgIHZhbHVlID0gMFxuICAgICB9XG5cbiAgICAgcmV0dXJuIHZhbHVlXG59Ki9cblxuZXhwb3J0IGZ1bmN0aW9uIGNzcyAoIGVsOiBIVE1MRWxlbWVudCB8IFNWR0VsZW1lbnQsIHByb3BzOiBQYXJ0aWFsIDxFeHRlbmRlZENTU1N0eWxlRGVjbGFyYXRpb24+IClcbntcbiAgICAgT2JqZWN0LmFzc2lnbiAoIGVsLnN0eWxlLCBwcm9wcyApXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjc3NGbG9hdCAoIGVsOiBIVE1MRWxlbWVudCB8IFNWR0VsZW1lbnQsIHByb3BlcnR5OiBzdHJpbmcgKVxue1xuICAgICB2YXIgdmFsdWUgPSBwYXJzZUZsb2F0ICggZWwuc3R5bGUgWyBwcm9wZXJ0eSBdIClcblxuICAgICBpZiAoIE51bWJlci5pc05hTiAoIHZhbHVlICkgKVxuICAgICB7XG4gICAgICAgICAgdmFsdWUgPSBwYXJzZUZsb2F0ICggd2luZG93LmdldENvbXB1dGVkU3R5bGUgKCBlbCApIFsgcHJvcGVydHkgXSApXG5cbiAgICAgICAgICBpZiAoIE51bWJlci5pc05hTiAoIHZhbHVlICkgKVxuICAgICAgICAgICAgICAgdmFsdWUgPSAwXG4gICAgIH1cblxuICAgICByZXR1cm4gdmFsdWVcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNzc0ludCAoIGVsOiBIVE1MRWxlbWVudCB8IFNWR0VsZW1lbnQsIHByb3BlcnR5OiBzdHJpbmcgKVxue1xuICAgICB2YXIgdmFsdWUgPSBwYXJzZUludCAoIGVsLnN0eWxlIFsgcHJvcGVydHkgXSApXG5cbiAgICAgaWYgKCBOdW1iZXIuaXNOYU4gKCB2YWx1ZSApIClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHN0eWxlID0gd2luZG93LmdldENvbXB1dGVkU3R5bGUgKCBlbCApXG5cbiAgICAgICAgICB2YWx1ZSA9IHBhcnNlSW50ICggc3R5bGUgWyBwcm9wZXJ0eSBdIClcblxuICAgICAgICAgIGlmICggTnVtYmVyLmlzTmFOICggdmFsdWUgKSApXG4gICAgICAgICAgICAgICB2YWx1ZSA9IDBcbiAgICAgfVxuXG4gICAgIHJldHVybiB2YWx1ZVxufVxuXG4iLCJcbmltcG9ydCAqIGFzIFVpIGZyb20gXCIuL2RyYWdnYWJsZS5qc1wiXG5pbXBvcnQgeyBjc3NJbnQgfSBmcm9tIFwiLi9kb20uanNcIlxuXG50eXBlIERpcmVjdGlvbiA9IFwibHJcIiB8IFwicmxcIiB8IFwiYnRcIiB8IFwidGJcIlxuXG4vL2V4cG9ydCB0eXBlIEV4cGVuZGFibGVQcm9wZXJ0eSA9IFwid2lkdGhcIiB8IFwiaGVpZ2h0XCJcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHwgXCJ0b3BcIiB8IFwibGVmdFwiIHwgXCJib3R0b21cIiB8IFwicmlnaHRcIlxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfCBcInhcIiB8IFwieVwiXG5cbmV4cG9ydCB0eXBlIEV4cGVuZGFibGVFbGVtZW50ID0gUmV0dXJuVHlwZSA8dHlwZW9mIGV4cGFuZGFibGU+XG5cbnR5cGUgRXhwZW5kYWJsZU9wdGlvbnMgPSBQYXJ0aWFsIDxFeHBlbmRhYmxlQ29uZmlnPlxuXG5pbnRlcmZhY2UgRXhwZW5kYWJsZUNvbmZpZ1xue1xuICAgICBoYW5kbGVzICAgICAgOiBKU1guRWxlbWVudCBbXVxuICAgICBwcm9wZXJ0eT8gICAgOiBzdHJpbmcsXG4gICAgIG9wZW4gICAgICAgICA6IGJvb2xlYW5cbiAgICAgbmVhciAgICAgICAgIDogbnVtYmVyXG4gICAgIGRlbGF5ICAgICAgICA6IG51bWJlclxuICAgICBkaXJlY3Rpb24gICAgOiBEaXJlY3Rpb25cbiAgICAgbWluU2l6ZSAgICAgIDogbnVtYmVyXG4gICAgIG1heFNpemUgICAgICA6IG51bWJlclxuICAgICB1bml0ICAgICAgICAgOiBcInB4XCIgfCBcIiVcIiB8IFwiXCIsXG4gICAgIG9uQmVmb3JlT3BlbiA6ICgpID0+IHZvaWRcbiAgICAgb25BZnRlck9wZW4gIDogKCkgPT4gdm9pZFxuICAgICBvbkJlZm9yZUNsb3NlOiAoKSA9PiB2b2lkXG4gICAgIG9uQWZ0ZXJDbG9zZSA6ICgpID0+IHZvaWRcbn1cblxuY29uc3QgdmVydGljYWxQcm9wZXJ0aWVzID0gWyBcImhlaWdodFwiLCBcInRvcFwiLCBcImJvdHRvbVwiIF1cblxuZnVuY3Rpb24gZGVmYXVsdENvbmZpZyAoKTogRXhwZW5kYWJsZUNvbmZpZ1xue1xuICAgICByZXR1cm4ge1xuICAgICAgICAgIGhhbmRsZXMgICAgICA6IFtdLFxuICAgICAgICAgIHByb3BlcnR5ICAgICA6IFwiaGVpZ2h0XCIsXG4gICAgICAgICAgb3BlbiAgICAgICAgIDogZmFsc2UsXG4gICAgICAgICAgbmVhciAgICAgICAgIDogNDAsXG4gICAgICAgICAgZGVsYXkgICAgICAgIDogMjUwLFxuICAgICAgICAgIG1pblNpemUgICAgICA6IDAsXG4gICAgICAgICAgbWF4U2l6ZSAgICAgIDogd2luZG93LmlubmVySGVpZ2h0LFxuICAgICAgICAgIHVuaXQgICAgICAgICA6IFwicHhcIixcbiAgICAgICAgICBkaXJlY3Rpb24gICAgOiBcInRiXCIsXG4gICAgICAgICAgb25CZWZvcmVPcGVuIDogKCkgPT4ge30sXG4gICAgICAgICAgb25BZnRlck9wZW4gIDogKCkgPT4ge30sXG4gICAgICAgICAgb25CZWZvcmVDbG9zZTogKCkgPT4ge30sXG4gICAgICAgICAgb25BZnRlckNsb3NlIDogKCkgPT4ge30sXG4gICAgIH1cbn1cblxuY29uc3QgdG9TaWduID0ge1xuICAgICBsciA6IDEsXG4gICAgIHJsIDogLTEsXG4gICAgIHRiIDogLTEsXG4gICAgIGJ0IDogMSxcbn1cbmNvbnN0IHRvUHJvcGVydHkgOiBSZWNvcmQgPERpcmVjdGlvbiwgc3RyaW5nPiA9IHtcbiAgICAgbHIgOiBcIndpZHRoXCIsXG4gICAgIHJsIDogXCJ3aWR0aFwiLFxuICAgICB0YiA6IFwiaGVpZ2h0XCIsXG4gICAgIGJ0IDogXCJoZWlnaHRcIixcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGV4cGFuZGFibGUgKCBlbGVtZW50OiBKU1guRWxlbWVudCwgb3B0aW9uczogRXhwZW5kYWJsZU9wdGlvbnMgPSB7fSApXG57XG4gICAgIGNvbnN0IGNvbmZpZyA9IGRlZmF1bHRDb25maWcgKClcblxuICAgICB2YXIgaXNfb3BlbiAgICA6IGJvb2xlYW5cbiAgICAgdmFyIGlzX3ZlcnRpY2FsOiBib29sZWFuXG4gICAgIHZhciBzaWduICAgICAgIDogbnVtYmVyXG4gICAgIHZhciB1bml0ICAgICAgIDogRXhwZW5kYWJsZUNvbmZpZyBbXCJ1bml0XCJdXG4gICAgIHZhciBjYiAgICAgICAgIDogKCkgPT4gdm9pZFxuICAgICB2YXIgbWluU2l6ZSAgICA6IG51bWJlclxuICAgICB2YXIgbWF4U2l6ZSAgICA6IG51bWJlclxuICAgICB2YXIgc3RhcnRfc2l6ZSAgPSAwXG4gICAgIHZhciBvcGVuX3NpemUgICA9IDEwMFxuXG4gICAgIGNvbnN0IGRyYWdnYWJsZSA9IFVpLmRyYWdnYWJsZSAoe1xuICAgICAgICAgIGhhbmRsZXMgICAgICAgOiBbXSxcbiAgICAgICAgICBvblN0YXJ0RHJhZyAgIDogb25TdGFydERyYWcsXG4gICAgICAgICAgb25TdG9wRHJhZyAgICA6IG9uU3RvcERyYWcsXG4gICAgICAgICAgb25FbmRBbmltYXRpb246IG9uRW5kQW5pbWF0aW9uLFxuICAgICB9KVxuXG4gICAgIHVwZGF0ZUNvbmZpZyAoIG9wdGlvbnMgKVxuXG4gICAgIGZ1bmN0aW9uIHVwZGF0ZUNvbmZpZyAoIG9wdGlvbnMgPSB7fSBhcyBFeHBlbmRhYmxlT3B0aW9ucyApXG4gICAgIHtcbiAgICAgICAgICBpZiAoIG9wdGlvbnMucHJvcGVydHkgPT0gdW5kZWZpbmVkICYmIG9wdGlvbnMuZGlyZWN0aW9uICE9IHVuZGVmaW5lZCApXG4gICAgICAgICAgICAgICBvcHRpb25zLnByb3BlcnR5ID0gdG9Qcm9wZXJ0eSBbb3B0aW9ucy5kaXJlY3Rpb25dXG5cbiAgICAgICAgICBPYmplY3QuYXNzaWduICggY29uZmlnLCBvcHRpb25zIClcblxuICAgICAgICAgIGlzX29wZW4gICAgID0gY29uZmlnLm9wZW5cbiAgICAgICAgICBzaWduICAgICAgICA9IHRvU2lnbiBbY29uZmlnLmRpcmVjdGlvbl1cbiAgICAgICAgICB1bml0ICAgICAgICA9IGNvbmZpZy51bml0XG4gICAgICAgICAgaXNfdmVydGljYWwgPSBjb25maWcuZGlyZWN0aW9uID09IFwiYnRcIiB8fCBjb25maWcuZGlyZWN0aW9uID09IFwidGJcIiA/IHRydWUgOiBmYWxzZVxuICAgICAgICAgIG1pblNpemUgPSBjb25maWcubWluU2l6ZVxuICAgICAgICAgIG1heFNpemUgPSBjb25maWcubWF4U2l6ZVxuXG4gICAgICAgICAgZWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlICggaXNfdmVydGljYWwgPyBcImhvcml6b250YWxcIiA6IFwidmVydGljYWxcIiApXG4gICAgICAgICAgZWxlbWVudC5jbGFzc0xpc3QuYWRkICAgICggaXNfdmVydGljYWwgPyBcInZlcnRpY2FsXCIgOiBcImhvcml6b250YWxcIiApXG5cbiAgICAgICAgICBkcmFnZ2FibGUudXBkYXRlQ29uZmlnICh7XG4gICAgICAgICAgICAgICBoYW5kbGVzOiBjb25maWcuaGFuZGxlcyxcbiAgICAgICAgICAgICAgIG9uRHJhZyA6IGlzX3ZlcnRpY2FsID8gb25EcmFnVmVydGljYWw6IG9uRHJhZ0hvcml6b250YWwsXG4gICAgICAgICAgfSlcbiAgICAgfVxuICAgICBmdW5jdGlvbiBzaXplICgpXG4gICAgIHtcbiAgICAgICAgICByZXR1cm4gaXNfb3BlbiA/IGNzc0ludCAoIGVsZW1lbnQsIGNvbmZpZy5wcm9wZXJ0eSApIDogMFxuICAgICB9XG4gICAgIGZ1bmN0aW9uIHRvZ2dsZSAoKVxuICAgICB7XG4gICAgICAgICAgaWYgKCBpc19vcGVuIClcbiAgICAgICAgICAgICAgIGNsb3NlICgpXG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgb3BlbiAoKVxuICAgICB9XG4gICAgIGZ1bmN0aW9uIG9wZW4gKClcbiAgICAge1xuICAgICAgICAgIGNvbmZpZy5vbkJlZm9yZU9wZW4gKClcblxuICAgICAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LmFkZCAoIFwiYW5pbWF0ZVwiIClcbiAgICAgICAgICBlbGVtZW50LmNsYXNzTGlzdC5yZXBsYWNlICggXCJjbG9zZVwiLCBcIm9wZW5cIiApXG5cbiAgICAgICAgICBpZiAoIGNiIClcbiAgICAgICAgICAgICAgIG9uVHJhbnNpdGlvbkVuZCAoKVxuXG4gICAgICAgICAgY2IgPSBjb25maWcub25BZnRlck9wZW5cbiAgICAgICAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIgKCBcInRyYW5zaXRpb25lbmRcIiwgKCkgPT4gb25UcmFuc2l0aW9uRW5kIClcblxuICAgICAgICAgIGVsZW1lbnQuc3R5bGUgWyBjb25maWcucHJvcGVydHkgXSA9IG9wZW5fc2l6ZSArIHVuaXRcblxuICAgICAgICAgIGlzX29wZW4gPSB0cnVlXG4gICAgIH1cbiAgICAgZnVuY3Rpb24gY2xvc2UgKClcbiAgICAge1xuICAgICAgICAgIGNvbmZpZy5vbkJlZm9yZUNsb3NlICgpXG5cbiAgICAgICAgICBvcGVuX3NpemUgPSBzaXplICgpXG5cbiAgICAgICAgICBlbGVtZW50LmNsYXNzTGlzdC5hZGQgKCBcImFuaW1hdGVcIiApXG4gICAgICAgICAgZWxlbWVudC5jbGFzc0xpc3QucmVwbGFjZSAoIFwib3BlblwiLCBcImNsb3NlXCIgKVxuXG4gICAgICAgICAgaWYgKCBjYiApXG4gICAgICAgICAgICAgICBvblRyYW5zaXRpb25FbmQgKClcblxuICAgICAgICAgIGNiID0gY29uZmlnLm9uQWZ0ZXJDbG9zZVxuICAgICAgICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lciAoIFwidHJhbnNpdGlvbmVuZFwiLCBvblRyYW5zaXRpb25FbmQgKVxuXG4gICAgICAgICAgZWxlbWVudC5zdHlsZSBbIGNvbmZpZy5wcm9wZXJ0eSBdID0gXCIwXCIgKyB1bml0XG5cbiAgICAgICAgICBpc19vcGVuID0gZmFsc2VcbiAgICAgfVxuXG4gICAgIHJldHVybiB7XG4gICAgICAgICAgdXBkYXRlQ29uZmlnLFxuICAgICAgICAgIG9wZW4sXG4gICAgICAgICAgY2xvc2UsXG4gICAgICAgICAgdG9nZ2xlLFxuICAgICAgICAgIGlzT3BlbiAgICAgOiAoKSA9PiBpc19vcGVuLFxuICAgICAgICAgIGlzQ2xvc2UgICAgOiAoKSA9PiAhIGlzX29wZW4sXG4gICAgICAgICAgaXNWZXJ0aWNhbCA6ICgpID0+IGlzX3ZlcnRpY2FsLFxuICAgICAgICAgIGlzQWN0aXZlICAgOiAoKSA9PiBkcmFnZ2FibGUuaXNBY3RpdmUgKCksXG4gICAgICAgICAgYWN0aXZhdGUgICA6ICgpID0+IGRyYWdnYWJsZS5hY3RpdmF0ZSAoKSxcbiAgICAgICAgICBkZXNhY3RpdmF0ZTogKCkgPT4gZHJhZ2dhYmxlLmRlc2FjdGl2YXRlICgpLFxuICAgICB9XG5cbiAgICAgZnVuY3Rpb24gb25UcmFuc2l0aW9uRW5kICgpXG4gICAgIHtcbiAgICAgICAgICBpZiAoIGNiIClcbiAgICAgICAgICAgICAgIGNiICgpXG4gICAgICAgICAgZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyICggXCJ0cmFuc2l0aW9uZW5kXCIsICgpID0+IG9uVHJhbnNpdGlvbkVuZCApXG4gICAgICAgICAgY2IgPSBudWxsXG4gICAgIH1cblxuICAgICBmdW5jdGlvbiBvblN0YXJ0RHJhZyAoKVxuICAgICB7XG4gICAgICAgICAgc3RhcnRfc2l6ZSA9IHNpemUgKClcbiAgICAgICAgICBlbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUgKCBcImFuaW1hdGVcIiApXG4gICAgIH1cbiAgICAgZnVuY3Rpb24gb25EcmFnVmVydGljYWwgKCBldmVudDogVWkuRHJhZ0V2ZW50IClcbiAgICAge1xuICAgICAgICAgIGNvbnNvbGUubG9nICggbWluU2l6ZSwgZXZlbnQueSwgbWF4U2l6ZSApXG4gICAgICAgICAgY29uc29sZS5sb2cgKCBjbGFtcCAoIHN0YXJ0X3NpemUgKyBzaWduICogZXZlbnQueSApICsgdW5pdCApXG4gICAgICAgICAgZWxlbWVudC5zdHlsZSBbIGNvbmZpZy5wcm9wZXJ0eSBdID0gY2xhbXAgKCBzdGFydF9zaXplICsgc2lnbiAqIGV2ZW50LnkgKSArIHVuaXRcbiAgICAgfVxuICAgICBmdW5jdGlvbiBvbkRyYWdIb3Jpem9udGFsICggZXZlbnQ6IFVpLkRyYWdFdmVudCApXG4gICAgIHtcbiAgICAgICAgICBlbGVtZW50LnN0eWxlIFsgY29uZmlnLnByb3BlcnR5IF0gPSBjbGFtcCAoIHN0YXJ0X3NpemUgKyBzaWduICogZXZlbnQueCApICsgdW5pdFxuICAgICB9XG4gICAgIGZ1bmN0aW9uIG9uU3RvcERyYWcgKCBldmVudDogVWkuRHJhZ0V2ZW50IClcbiAgICAge1xuICAgICAgICAgIHZhciBpc19tb3ZlZCA9IGlzX3ZlcnRpY2FsID8gc2lnbiAqIGV2ZW50LnkgPiBjb25maWcubmVhclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogc2lnbiAqIGV2ZW50LnggPiBjb25maWcubmVhclxuXG4gICAgICAgICAgaWYgKCAoaXNfbW92ZWQgPT0gZmFsc2UpICYmIGV2ZW50LmRlbGF5IDw9IGNvbmZpZy5kZWxheSApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgdG9nZ2xlICgpXG4gICAgICAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjb25zdCB0YXJnZXRfc2l6ZSA9IGNsYW1wIChcbiAgICAgICAgICAgICAgIGlzX3ZlcnRpY2FsID8gc3RhcnRfc2l6ZSArIHNpZ24gKiBldmVudC50YXJnZXRZXG4gICAgICAgICAgICAgICAgICAgICAgICAgICA6IHN0YXJ0X3NpemUgKyBzaWduICogZXZlbnQudGFyZ2V0WFxuICAgICAgICAgIClcblxuICAgICAgICAgIGlmICggdGFyZ2V0X3NpemUgPD0gY29uZmlnLm5lYXIgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNsb3NlICgpXG4gICAgICAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gdHJ1ZVxuXG4gICAgIH1cbiAgICAgZnVuY3Rpb24gb25FbmRBbmltYXRpb24gKClcbiAgICAge1xuICAgICAgICAgIG9wZW5fc2l6ZSA9IGNzc0ludCAoIGVsZW1lbnQsIGNvbmZpZy5wcm9wZXJ0eSApXG4gICAgICAgICAgb3BlbiAoKVxuICAgICB9XG5cbiAgICAgZnVuY3Rpb24gY2xhbXAgKCB2OiBudW1iZXIgKVxuICAgICB7XG4gICAgICAgICAgaWYgKCB2IDwgbWluU2l6ZSApXG4gICAgICAgICAgICAgICByZXR1cm4gbWluU2l6ZVxuXG4gICAgICAgICAgaWYgKCB2ID4gbWF4U2l6ZSApXG4gICAgICAgICAgICAgICByZXR1cm4gbWF4U2l6ZVxuXG4gICAgICAgICAgcmV0dXJuIHZcbiAgICAgfVxufVxuIiwiXG5pbXBvcnQgeyBDc3MgfSBmcm9tIFwiLi4vLi4vTGliL2luZGV4LmpzXCJcbmltcG9ydCB7IGNzc0Zsb2F0IH0gZnJvbSBcIi4vZG9tLmpzXCJcbmltcG9ydCAqIGFzIFVpIGZyb20gXCIuL2RyYWdnYWJsZS5qc1wiXG5pbXBvcnQgeyB4bm9kZSB9IGZyb20gXCIuL3hub2RlLmpzXCJcblxudHlwZSBEaXJlY3Rpb24gICA9IFwibHJcIiB8IFwicmxcIiB8IFwiYnRcIiB8IFwidGJcIlxudHlwZSBPcmllbnRhdGlvbiA9IFwidmVydGljYWxcIiB8IFwiaG9yaXpvbnRhbFwiXG50eXBlIFVuaXRzICAgICAgID0gXCJweFwiIHwgXCIlXCJcbnR5cGUgU3dpcGVhYmxlUHJvcGVydHkgPSBcInRvcFwiIHwgXCJsZWZ0XCIgfCBcImJvdHRvbVwiIHwgXCJyaWdodFwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgfCBcInhcIiB8IFwieVwiXG5cbnR5cGUgU3dpcGVhYmxlT3B0aW9ucyA9IFBhcnRpYWwgPFN3aXBlYWJsZUNvbmZpZz5cblxudHlwZSBTd2lwZWFibGVDb25maWcgPSB7XG4gICAgIGhhbmRsZXMgICA6IEpTWC5FbGVtZW50IFtdXG4gICAgIGRpcmVjdGlvbiA6IERpcmVjdGlvbixcbiAgICAgcG9ycGVydHk/IDogU3dpcGVhYmxlUHJvcGVydHlcbiAgICAgbWluVmFsdWUgIDogbnVtYmVyLFxuICAgICBtYXhWYWx1ZSAgOiBudW1iZXIsXG4gICAgIHVuaXRzICAgICA6IFVuaXRzLFxuICAgICBtb3VzZVdoZWVsOiBib29sZWFuXG59XG5cbmV4cG9ydCB0eXBlIFN3aXBlYWJsZUVsZW1lbnQgPSBSZXR1cm5UeXBlIDx0eXBlb2Ygc3dpcGVhYmxlPlxuXG5mdW5jdGlvbiBkZWZhdWx0Q29uZmlnICgpOiBTd2lwZWFibGVDb25maWdcbntcbiAgICAgcmV0dXJuIHtcbiAgICAgICAgICBoYW5kbGVzICAgOiBbXSxcbiAgICAgICAgICBkaXJlY3Rpb24gOiBcImxyXCIsXG4gICAgICAgICAgcG9ycGVydHkgIDogXCJsZWZ0XCIsXG4gICAgICAgICAgbWluVmFsdWUgIDogLTEwMCxcbiAgICAgICAgICBtYXhWYWx1ZSAgOiAwLFxuICAgICAgICAgIHVuaXRzICAgICA6IFwiJVwiLFxuICAgICAgICAgIG1vdXNlV2hlZWw6IHRydWUsXG4gICAgIH1cbn1cblxudmFyIHN0YXJ0X3Bvc2l0aW9uID0gMFxudmFyIGlzX3ZlcnRpY2FsICAgID0gZmFsc2VcbnZhciBwcm9wIDogU3dpcGVhYmxlUHJvcGVydHlcblxuZXhwb3J0IGZ1bmN0aW9uIHN3aXBlYWJsZSAoIGVsZW1lbnQ6IEpTWC5FbGVtZW50LCBvcHRpb25zOiBTd2lwZWFibGVPcHRpb25zIClcbntcbiAgICAgY29uc3QgY29uZmlnID0gZGVmYXVsdENvbmZpZyAoKVxuXG4gICAgIGNvbnN0IGRyYWdnYWJsZSA9IFVpLmRyYWdnYWJsZSAoe1xuICAgICAgICAgIGhhbmRsZXM6IFtdLFxuICAgICAgICAgIG9uU3RhcnREcmFnLFxuICAgICAgICAgIG9uU3RvcERyYWcsXG4gICAgIH0pXG5cbiAgICAgZWxlbWVudC5jbGFzc0xpc3QuYWRkICggXCJzd2lwZWFibGVcIiApXG5cbiAgICAgdXBkYXRlQ29uZmlnICggb3B0aW9ucyApXG5cbiAgICAgZnVuY3Rpb24gdXBkYXRlQ29uZmlnICggb3B0aW9uczogU3dpcGVhYmxlT3B0aW9ucyApXG4gICAgIHtcbiAgICAgICAgICBPYmplY3QuYXNzaWduICggY29uZmlnLCBvcHRpb25zIClcblxuICAgICAgICAgIGlzX3ZlcnRpY2FsID0gY29uZmlnLmRpcmVjdGlvbiA9PSBcImJ0XCIgfHwgY29uZmlnLmRpcmVjdGlvbiA9PSBcInRiXCJcblxuICAgICAgICAgIGlmICggb3B0aW9ucy5wb3JwZXJ0eSA9PSB1bmRlZmluZWQgKVxuICAgICAgICAgICAgICAgY29uZmlnLnBvcnBlcnR5ID0gaXNfdmVydGljYWwgPyBcInRvcFwiIDogXCJsZWZ0XCJcblxuICAgICAgICAgIC8vIHN3aXRjaCAoIGNvbmZpZy5wb3JwZXJ0eSApXG4gICAgICAgICAgLy8ge1xuICAgICAgICAgIC8vIGNhc2UgXCJ0b3BcIjogY2FzZSBcImJvdHRvbVwiOiBjYXNlIFwieVwiOiBpc192ZXJ0aWNhbCA9IHRydWUgIDsgYnJlYWtcbiAgICAgICAgICAvLyBjYXNlIFwibGVmdFwiOiBjYXNlIFwicmlnaHRcIjogY2FzZSBcInhcIjogaXNfdmVydGljYWwgPSBmYWxzZSA7IGJyZWFrXG4gICAgICAgICAgLy8gZGVmYXVsdDogZGVidWdnZXIgOyByZXR1cm5cbiAgICAgICAgICAvLyB9XG5cbiAgICAgICAgICBkcmFnZ2FibGUudXBkYXRlQ29uZmlnICh7XG4gICAgICAgICAgICAgICBoYW5kbGVzOiBjb25maWcuaGFuZGxlcyxcbiAgICAgICAgICAgICAgIG9uRHJhZzogaXNfdmVydGljYWwgPyBvbkRyYWdWZXJ0aWNhbCA6IG9uRHJhZ0hvcml6b250YWxcbiAgICAgICAgICB9KVxuXG4gICAgICAgICAgcHJvcCA9IGNvbmZpZy5wb3JwZXJ0eVxuXG4gICAgICAgICAgaWYgKCBkcmFnZ2FibGUuaXNBY3RpdmUgKCkgKVxuICAgICAgICAgICAgICAgYWN0aXZlRXZlbnRzICgpXG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgZGVzYWN0aXZlRXZlbnRzICgpXG4gICAgIH1cblxuICAgICBmdW5jdGlvbiBwb3NpdGlvbiAoKVxuICAgICB7XG4gICAgICAgICAgcmV0dXJuIGNzc0Zsb2F0ICggZWxlbWVudCwgcHJvcCApXG4gICAgIH1cblxuICAgICBmdW5jdGlvbiBhY3RpdmF0ZSAoKVxuICAgICB7XG4gICAgICAgICAgZHJhZ2dhYmxlLmFjdGl2YXRlICgpXG4gICAgICAgICAgYWN0aXZlRXZlbnRzICgpXG4gICAgIH1cbiAgICAgZnVuY3Rpb24gZGVzYWN0aXZhdGUgKClcbiAgICAge1xuICAgICAgICAgIGRyYWdnYWJsZS5kZXNhY3RpdmF0ZSAoKVxuICAgICAgICAgIGRlc2FjdGl2ZUV2ZW50cyAoKVxuICAgICB9XG5cbiAgICAgZnVuY3Rpb24gc3dpcGUgKCBvZmZzZXQ6IHN0cmluZyApOiB2b2lkXG4gICAgIGZ1bmN0aW9uIHN3aXBlICggb2Zmc2V0OiBudW1iZXIsIHVuaXRzOiBVbml0cyApOiB2b2lkXG4gICAgIGZ1bmN0aW9uIHN3aXBlICggb2Zmc2V0OiBzdHJpbmd8bnVtYmVyLCB1PzogVW5pdHMgKVxuICAgICB7XG4gICAgICAgICAgaWYgKCB0eXBlb2Ygb2Zmc2V0ID09IFwic3RyaW5nXCIgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHUgPSBDc3MuZ2V0VW5pdCAoIG9mZnNldCApIGFzIFVuaXRzXG4gICAgICAgICAgICAgICBvZmZzZXQgPSBwYXJzZUZsb2F0ICggb2Zmc2V0IClcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoICEgW1wicHhcIiwgXCIlXCJdLmluY2x1ZGVzICggdSApIClcbiAgICAgICAgICAgICAgIHUgPSBcInB4XCJcblxuICAgICAgICAgIGlmICggdSAhPSBjb25maWcudW5pdHMgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGlmICggKHUgPSBjb25maWcudW5pdHMpID09IFwiJVwiIClcbiAgICAgICAgICAgICAgICAgICAgb2Zmc2V0ID0gdG9QZXJjZW50cyAoIG9mZnNldCApXG4gICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIG9mZnNldCA9IHRvUGl4ZWxzICggb2Zmc2V0IClcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBlbGVtZW50LnN0eWxlIFtwcm9wXSA9IGNsYW1wICggb2Zmc2V0ICkgKyB1XG4gICAgIH1cblxuICAgICByZXR1cm4ge1xuICAgICAgICAgIHVwZGF0ZUNvbmZpZyxcbiAgICAgICAgICBhY3RpdmF0ZSxcbiAgICAgICAgICBkZXNhY3RpdmF0ZSxcbiAgICAgICAgICBwb3NpdGlvbixcbiAgICAgICAgICBzd2lwZSxcbiAgICAgfVxuXG4gICAgIGZ1bmN0aW9uIGFjdGl2ZUV2ZW50cyAoKVxuICAgICB7XG4gICAgICAgICAgaWYgKCBjb25maWcubW91c2VXaGVlbCApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgZm9yICggY29uc3QgaCBvZiBjb25maWcuaGFuZGxlcyApXG4gICAgICAgICAgICAgICAgICAgIGguYWRkRXZlbnRMaXN0ZW5lciAoIFwid2hlZWxcIiwgb25XaGVlbCwgeyBwYXNzaXZlOiB0cnVlIH0gKVxuICAgICAgICAgIH1cbiAgICAgfVxuICAgICBmdW5jdGlvbiBkZXNhY3RpdmVFdmVudHMgKClcbiAgICAge1xuICAgICAgICAgIGZvciAoIGNvbnN0IGggb2YgY29uZmlnLmhhbmRsZXMgKVxuICAgICAgICAgICAgICAgaC5yZW1vdmVFdmVudExpc3RlbmVyICggXCJ3aGVlbFwiLCBvbldoZWVsIClcbiAgICAgfVxuXG4gICAgIGZ1bmN0aW9uIHRvUGl4ZWxzICggcGVyY2VudGFnZTogbnVtYmVyIClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHsgbWluVmFsdWU6IG1pbiwgbWF4VmFsdWU6IG1heCB9ID0gY29uZmlnXG5cbiAgICAgICAgICBpZiAoIHBlcmNlbnRhZ2UgPCAxMDAgKVxuICAgICAgICAgICAgICAgcGVyY2VudGFnZSA9IDEwMCArIHBlcmNlbnRhZ2VcblxuICAgICAgICAgIHJldHVybiBtaW4gKyAobWF4IC0gbWluKSAqIHBlcmNlbnRhZ2UgLyAxMDBcbiAgICAgfVxuICAgICBmdW5jdGlvbiB0b1BlcmNlbnRzICggcGl4ZWxzOiBudW1iZXIgKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgeyBtaW5WYWx1ZTogbWluLCBtYXhWYWx1ZTogbWF4IH0gPSBjb25maWdcbiAgICAgICAgICByZXR1cm4gTWF0aC5hYnMgKCAocGl4ZWxzIC0gbWluKSAvIChtYXggLSBtaW4pICogMTAwIClcbiAgICAgfVxuXG4gICAgIGZ1bmN0aW9uIG9uU3RhcnREcmFnICgpXG4gICAgIHtcbiAgICAgICAgICBlbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUgKCBcImFuaW1hdGVcIiApXG4gICAgICAgICAgc3RhcnRfcG9zaXRpb24gPSBwb3NpdGlvbiAoKVxuICAgICB9XG4gICAgIGZ1bmN0aW9uIG9uRHJhZ1ZlcnRpY2FsICggZXZlbnQ6IFVpLkRyYWdFdmVudCApXG4gICAgIHtcbiAgICAgICAgICBlbGVtZW50LnN0eWxlIFtwcm9wXSA9IGNsYW1wICggc3RhcnRfcG9zaXRpb24gKyBldmVudC55ICkgKyBjb25maWcudW5pdHNcbiAgICAgfVxuICAgICBmdW5jdGlvbiBvbkRyYWdIb3Jpem9udGFsICggZXZlbnQ6IFVpLkRyYWdFdmVudCApXG4gICAgIHtcbiAgICAgICAgICBlbGVtZW50LnN0eWxlIFtwcm9wXSA9IGNsYW1wICggc3RhcnRfcG9zaXRpb24gKyBldmVudC54ICkgKyBjb25maWcudW5pdHNcbiAgICAgfVxuICAgICBmdW5jdGlvbiBvblN0b3BEcmFnICggZXZlbnQ6IFVpLkRyYWdFdmVudCApXG4gICAgIHtcbiAgICAgICAgICBlbGVtZW50LmNsYXNzTGlzdC5hZGQgKCBcImFuaW1hdGVcIiApXG5cbiAgICAgICAgICBjb25zdCBvZmZzZXQgPSBpc192ZXJ0aWNhbFxuICAgICAgICAgICAgICAgICAgICAgICAgID8gZXZlbnQueSAvLysgZXZlbnQudmVsb2NpdHlZXG4gICAgICAgICAgICAgICAgICAgICAgICAgOiBldmVudC54IC8vKyBldmVudC52ZWxvY2l0eVhcblxuICAgICAgICAgIGVsZW1lbnQuc3R5bGUgW3Byb3BdID0gY2xhbXAgKCBzdGFydF9wb3NpdGlvbiArIG9mZnNldCApICsgY29uZmlnLnVuaXRzXG4gICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgfVxuICAgICBmdW5jdGlvbiBvbldoZWVsICggZXZlbnQ6IFdoZWVsRXZlbnQgKVxuICAgICB7XG4gICAgICAgICAgaWYgKCBldmVudC5kZWx0YU1vZGUgIT0gV2hlZWxFdmVudC5ET01fREVMVEFfUElYRUwgKVxuICAgICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgICBpZiAoIGlzX3ZlcnRpY2FsIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICB2YXIgZGVsdGEgPSBldmVudC5kZWx0YVlcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHZhciBkZWx0YSA9IGV2ZW50LmRlbHRhWFxuXG4gICAgICAgICAgICAgICBpZiAoIGRlbHRhID09IDAgKVxuICAgICAgICAgICAgICAgICAgICBkZWx0YSA9IGV2ZW50LmRlbHRhWVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGVsZW1lbnQuc3R5bGUgW3Byb3BdID0gY2xhbXAgKCBwb3NpdGlvbiAoKSArIGRlbHRhICkgKyBjb25maWcudW5pdHNcbiAgICAgfVxuICAgICBmdW5jdGlvbiBjbGFtcCAoIHZhbHVlOiBudW1iZXIgKVxuICAgICB7XG4gICAgICAgICAgcmV0dXJuIHZhbHVlIDwgY29uZmlnLm1pblZhbHVlID8gY29uZmlnLm1pblZhbHVlXG4gICAgICAgICAgICAgICA6IHZhbHVlID4gY29uZmlnLm1heFZhbHVlID8gY29uZmlnLm1heFZhbHVlXG4gICAgICAgICAgICAgICA6IHZhbHVlXG4gICAgIH1cbn1cbiIsIlxuaW1wb3J0IHsgU2hhcGUgfSBmcm9tIFwiLi9FbGVtZW50L3NoYXBlLmpzXCJcbi8vaW1wb3J0ICogYXMgRmFjdG9yeSBmcm9tIFwiLi9mYWN0b3J5LmpzXCJcblxuZGVjbGFyZSBnbG9iYWxcbntcbiAgICAgdHlwZSBHZW9tZXRyeU5hbWVzID0ga2V5b2YgdHlwZW9mIEZhY3RvcnlcblxuICAgICBpbnRlcmZhY2UgJEdlb21ldHJ5XG4gICAgIHtcbiAgICAgICAgICBzaGFwZTogR2VvbWV0cnlOYW1lc1xuICAgICAgICAgIHggICAgICAgICA6IG51bWJlclxuICAgICAgICAgIHkgICAgICAgICA6IG51bWJlclxuXG4gICAgICAgICAgYm9yZGVyV2lkdGggICAgOiBudW1iZXJcbiAgICAgICAgICBib3JkZXJDb2xvciAgICA6IHN0cmluZ1xuXG4gICAgICAgICAgYmFja2dyb3VuZENvbG9yIDogc3RyaW5nXG4gICAgICAgICAgYmFja2dyb3VuZEltYWdlIDogc3RyaW5nXG4gICAgICAgICAgYmFja2dyb3VuZFJlcGVhdDogYm9vbGVhblxuICAgICB9XG5cbiAgICAgaW50ZXJmYWNlICRUZXh0RGVmaW5pdGlvbiBleHRlbmRzICRHZW9tZXRyeVxuICAgICB7XG4gICAgICAgICAgdGV4dDogc3RyaW5nXG4gICAgIH1cblxuICAgICBpbnRlcmZhY2UgJFBhdGhEZWZpbml0aW9uIGV4dGVuZHMgJEdlb21ldHJ5XG4gICAgIHtcbiAgICAgICAgICBwYXRoOiBzdHJpbmdcbiAgICAgfVxufVxuXG5jb25zdCBmYWJyaWNfYmFzZV9vYnRpb25zOiBmYWJyaWMuSU9iamVjdE9wdGlvbnMgPSB7XG4gICAgIGxlZnQgICA6IDAsXG4gICAgIHRvcCAgICA6IDAsXG4gICAgIG9yaWdpblg6IFwiY2VudGVyXCIsXG4gICAgIG9yaWdpblk6IFwiY2VudGVyXCIsXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBncm91cCAoIGRlZjogJEdlb21ldHJ5LCBzaXplOiBudW1iZXIsIG9wdDogZmFicmljLklDaXJjbGVPcHRpb25zIClcbntcbiAgICAgcmV0dXJuIG5ldyBmYWJyaWMuR3JvdXAgKCB1bmRlZmluZWQsXG4gICAgIHtcbiAgICAgICAgICAuLi4gZmFicmljX2Jhc2Vfb2J0aW9ucyxcbiAgICAgICAgICAuLi4gb3B0LFxuICAgICAgICAgIHdpZHRoOiBzaXplLFxuICAgICAgICAgIGhlaWdodDogc2l6ZSxcbiAgICAgfSlcbn1cblxuLy8gVG8gZ2V0IHBvaW50cyBvZiB0cmlhbmdsZSwgc3F1YXJlLCBbcGFudGF8aGV4YV1nb25cbi8vXG4vLyB2YXIgYSA9IE1hdGguUEkqMi80XG4vLyBmb3IgKCB2YXIgaSA9IDAgOyBpICE9IDQgOyBpKysgKVxuLy8gICAgIGNvbnNvbGUubG9nICggYFsgJHsgTWF0aC5zaW4oYSppKSB9LCAkeyBNYXRoLmNvcyhhKmkpIH0gXWAgKVxuXG5leHBvcnQgZnVuY3Rpb24gY2lyY2xlICggZGVmOiAkR2VvbWV0cnksIHNpemU6IG51bWJlciwgb3B0OiBmYWJyaWMuSUNpcmNsZU9wdGlvbnMgKVxue1xuXG4gICAgIHJldHVybiBuZXcgZmFicmljLkNpcmNsZSAoXG4gICAgIHtcbiAgICAgICAgICAuLi4gZmFicmljX2Jhc2Vfb2J0aW9ucyxcbiAgICAgICAgICAuLi4gb3B0LFxuICAgICAgICAgIHJhZGl1czogc2l6ZSAvIDIsXG4gICAgIH0pXG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0cmlhbmdsZSAoIGRlZjogJEdlb21ldHJ5LCBzaXplOiBudW1iZXIsIG9wdDogZmFicmljLklUcmlhbmdsZU9wdGlvbnMgKVxue1xuICAgICBjb25zdCBwb2ludHMgPSBbXVxuICAgICBjb25zdCBzY2FsZSA9IDEuMlxuICAgICBjb25zdCByID0gc2l6ZSAvIDIgKiBzY2FsZVxuXG4gICAgIGZvciAoIGNvbnN0IHAgb2YgW1xuICAgICAgICAgIFsgMCwgMSBdLFxuICAgICAgICAgIFsgMC44NjYwMjU0MDM3ODQ0Mzg3LCAtMC40OTk5OTk5OTk5OTk5OTk4IF0sXG4gICAgICAgICAgWyAtMC44NjYwMjU0MDM3ODQ0Mzg1LCAtMC41MDAwMDAwMDAwMDAwMDA0IF1cbiAgICAgXSkgcG9pbnRzLnB1c2ggKHsgeDogcFswXSAqIHIsIHk6IHBbMV0gKiByIH0pXG5cbiAgICAgcmV0dXJuIG5ldyBmYWJyaWMuUG9seWdvbiAoIHBvaW50cywge1xuICAgICAgICAgIC4uLiBmYWJyaWNfYmFzZV9vYnRpb25zLFxuICAgICAgICAgIC4uLiBvcHQsXG4gICAgICAgICAgYW5nbGU6IDE4MCxcbiAgICAgfSlcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNxdWFyZSAoIGRlZjogJEdlb21ldHJ5LCBzaXplOiBudW1iZXIsIG9wdDogZmFicmljLklSZWN0T3B0aW9ucyApXG57XG4gICAgIGNvbnN0IHNjYWxlID0gMC45XG4gICAgIHJldHVybiBuZXcgZmFicmljLlJlY3QgKFxuICAgICB7XG4gICAgICAgICAgLi4uIGZhYnJpY19iYXNlX29idGlvbnMsXG4gICAgICAgICAgLi4uIG9wdCxcbiAgICAgICAgICB3aWR0aCA6IHNpemUgKiBzY2FsZSxcbiAgICAgICAgICBoZWlnaHQ6IHNpemUgKiBzY2FsZSxcbiAgICAgfSlcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhbnRhZ29uICggZGVmOiAkR2VvbWV0cnksIHNpemU6IG51bWJlciwgb3B0OiBmYWJyaWMuSU9iamVjdE9wdGlvbnMgKVxue1xuICAgICBjb25zdCBwb2ludHMgPSBbXVxuICAgICBjb25zdCBzY2FsZSA9IDEuMVxuICAgICBjb25zdCByID0gc2l6ZSAvIDIgKiBzY2FsZVxuXG4gICAgIGZvciAoIGNvbnN0IHAgb2YgW1xuICAgICAgICAgIFsgMCwgMSBdLFxuICAgICAgICAgIFsgMC45NTEwNTY1MTYyOTUxNTM1LCAwLjMwOTAxNjk5NDM3NDk0NzQ1IF0sXG4gICAgICAgICAgWyAwLjU4Nzc4NTI1MjI5MjQ3MzIsIC0wLjgwOTAxNjk5NDM3NDk0NzMgXSxcbiAgICAgICAgICBbIC0wLjU4Nzc4NTI1MjI5MjQ3MywgLTAuODA5MDE2OTk0Mzc0OTQ3NSBdLFxuICAgICAgICAgIFsgLTAuOTUxMDU2NTE2Mjk1MTUzNiwgMC4zMDkwMTY5OTQzNzQ5NDcyMyBdXG4gICAgIF0pIHBvaW50cy5wdXNoICh7IHg6IHBbMF0gKiByLCB5OiBwWzFdICogciB9KVxuXG4gICAgIHJldHVybiBuZXcgZmFicmljLlBvbHlnb24gKCBwb2ludHMsIHtcbiAgICAgICAgICAuLi4gZmFicmljX2Jhc2Vfb2J0aW9ucyxcbiAgICAgICAgICAuLi4gb3B0LFxuICAgICAgICAgIGFuZ2xlOiAxODAsXG4gICAgIH0pXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBoZXhhZ29uICggZGVmOiAkR2VvbWV0cnksIHNpemU6IG51bWJlciwgb3B0OiBmYWJyaWMuSU9iamVjdE9wdGlvbnMgKVxue1xuICAgICBjb25zdCBwb2ludHMgPSBbXVxuICAgICBjb25zdCBzY2FsZSA9IDEuMVxuICAgICBjb25zdCByID0gc2l6ZSAvIDIgKiBzY2FsZVxuXG4gICAgIGZvciAoIGNvbnN0IHAgb2YgW1xuICAgICAgICAgIFsgMCwgMSBdLFxuICAgICAgICAgIFsgMC44NjYwMjU0MDM3ODQ0Mzg2LCAwLjUwMDAwMDAwMDAwMDAwMDEgXSxcbiAgICAgICAgICBbIDAuODY2MDI1NDAzNzg0NDM4NywgLTAuNDk5OTk5OTk5OTk5OTk5OCBdLFxuICAgICAgICAgIFsgMS4yMjQ2NDY3OTkxNDczNTMyZS0xNiwgLTEgXSxcbiAgICAgICAgICBbIC0wLjg2NjAyNTQwMzc4NDQzODUsIC0wLjUwMDAwMDAwMDAwMDAwMDQgXSxcbiAgICAgICAgICBbIC0wLjg2NjAyNTQwMzc4NDQzOSwgMC40OTk5OTk5OTk5OTk5OTkzMyBdLFxuICAgICBdKSBwb2ludHMucHVzaCAoeyB4OiBwWzBdICogciwgeTogcFsxXSAqIHIgfSlcblxuICAgICByZXR1cm4gbmV3IGZhYnJpYy5Qb2x5Z29uICggcG9pbnRzLCB7XG4gICAgICAgICAgLi4uIGZhYnJpY19iYXNlX29idGlvbnMsXG4gICAgICAgICAgLi4uIG9wdCxcbiAgICAgICAgICBhbmdsZTogOTAsXG4gICAgIH0pXG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0ZXh0ICggZGVmOiAkVGV4dERlZmluaXRpb24sIHNpemU6IG51bWJlciwgb3B0OiBmYWJyaWMuVGV4dE9wdGlvbnMgKVxue1xuICAgICByZXR1cm4gbmV3IGZhYnJpYy5UZXh0ICggXCIuLi5cIiwge1xuICAgICAgICAgIC4uLiBmYWJyaWNfYmFzZV9vYnRpb25zLFxuICAgICAgICAgIC4uLiBvcHQsXG4gICAgICAgICAgZm9udFNpemU6IHNpemUsXG4gICAgIH0pXG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0ZXh0Ym94ICggZGVmOiAkVGV4dERlZmluaXRpb24sIHNpemU6IG51bWJlciwgb3B0OiBmYWJyaWMuVGV4dE9wdGlvbnMgKVxue1xuICAgICByZXR1cm4gbmV3IGZhYnJpYy5UZXh0Ym94ICggXCIuLi5cIiwge1xuICAgICAgICAgIC4uLiBmYWJyaWNfYmFzZV9vYnRpb25zLFxuICAgICAgICAgIC4uLiBvcHQsXG4gICAgICAgICAgZm9udFNpemU6IHNpemUsXG4gICAgIH0pXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXRoICggZGVmOiAkUGF0aERlZmluaXRpb24sIHNpemU6IG51bWJlciwgb3B0OiBmYWJyaWMuSU9iamVjdE9wdGlvbnMgKVxue1xuICAgICByZXR1cm4gbmV3IGZhYnJpYy5QYXRoICggZGVmLnBhdGgsXG4gICAgIHtcbiAgICAgICAgICAuLi4gZmFicmljX2Jhc2Vfb2J0aW9ucyxcbiAgICAgICAgICAuLi4gb3B0LFxuICAgICAgICAgIHNjYWxlWDogc2l6ZSAvIDEwMCwgLy8gRW4gc3VwcG9zYW50IHF1ZSBsZSB2aWV3Qm94XG4gICAgICAgICAgc2NhbGVZOiBzaXplIC8gMTAwLCAvLyBlc3QgXCIwIDAgMTAwIDEwMFwiXG4gICAgIH0pXG59XG5cbmNvbnN0IEZhY3RvcnkgPSB7XG4gICAgIGdyb3VwLFxuICAgICBjaXJjbGUsXG4gICAgIHRyaWFuZ2xlLFxuICAgICBzcXVhcmUsXG4gICAgIHBhbnRhZ29uLFxuICAgICBoZXhhZ29uICxcbiAgICAgdGV4dCxcbiAgICAgdGV4dGJveCAsXG4gICAgIHBhdGgsXG59XG5cblxuZXhwb3J0IGNsYXNzIEdlb21ldHJ5IDxUIGV4dGVuZHMgR2VvbWV0cnlOYW1lcyA9IEdlb21ldHJ5TmFtZXM+XG57XG4gICAgIGNvbmZpZzogJEdlb21ldHJ5XG4gICAgIG9iamVjdDogUmV0dXJuVHlwZSA8dHlwZW9mIEZhY3RvcnkgW1RdPlxuXG4gICAgIGNvbnN0cnVjdG9yICggcmVhZG9ubHkgb3duZXI6IFNoYXBlIClcbiAgICAge1xuICAgICAgICAgIHRoaXMuY29uZmlnID0gb3duZXIuY29uZmlnXG4gICAgICAgICAgdGhpcy51cGRhdGVTaGFwZSAoKVxuICAgICB9XG5cbiAgICAgdXBkYXRlICggb3B0aW9uczogUGFydGlhbCA8JEdlb21ldHJ5PiApXG4gICAgIHtcbiAgICAgICAgICBPYmplY3QuYXNzaWduICggdGhpcy5jb25maWcsIG9wdGlvbnMgKVxuXG4gICAgICAgICAgaWYgKCBcInNoYXBlXCIgaW4gb3B0aW9ucyApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgdGhpcy51cGRhdGVTaGFwZSAoKVxuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIGlmICggXCJiYWNrZ3JvdW5kSW1hZ2VcIiBpbiBvcHRpb25zIHx8IFwiYmFja2dyb3VuZFJlcGVhdFwiIGluIG9wdGlvbnMgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHRoaXMudXBkYXRlQmFja2dyb3VuZEltYWdlICgpXG4gICAgICAgICAgfVxuICAgICB9XG5cbiAgICAgdXBkYXRlUG9zaXRpb24gKClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHsgY29uZmlnLCBvYmplY3QgfSA9IHRoaXNcblxuICAgICAgICAgIDsob2JqZWN0IGFzIGZhYnJpYy5PYmplY3QpLnNldCAoe1xuICAgICAgICAgICAgICAgbGVmdDogY29uZmlnLngsXG4gICAgICAgICAgICAgICB0b3AgOiBjb25maWcueSxcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5zZXRDb29yZHMgKClcbiAgICAgfVxuXG4gICAgIHVwZGF0ZVNpemUgKClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHsgb3duZXIsIGNvbmZpZywgb2JqZWN0IH0gPSB0aGlzXG5cbiAgICAgICAgICBjb25zdCBzaXplID0gb3duZXIuZGlzcGxheVNpemUgKClcblxuICAgICAgICAgIGlmICggY29uZmlnLnNoYXBlID09IFwiY2lyY2xlXCIgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIChvYmplY3QgYXMgZmFicmljLkNpcmNsZSkuc2V0ICh7XG4gICAgICAgICAgICAgICAgICAgIHJhZGl1czogc2l6ZSAvIDJcbiAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICAob2JqZWN0IGFzIGZhYnJpYy5PYmplY3QpLnNldCAoe1xuICAgICAgICAgICAgICAgICAgICB3aWR0aCA6IHNpemUsXG4gICAgICAgICAgICAgICAgICAgIGhlaWdodDogc2l6ZSxcbiAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgb2JqZWN0LnNldENvb3JkcyAoKVxuICAgICB9XG5cbiAgICAgdXBkYXRlU2hhcGUgKCBzaGFwZT86IEdlb21ldHJ5TmFtZXMgKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgeyBjb25maWcsIG93bmVyIH0gPSB0aGlzXG5cbiAgICAgICAgICBpZiAoIGFyZ3VtZW50cy5sZW5ndGggPT0gMCApXG4gICAgICAgICAgICAgICBzaGFwZSA9IGNvbmZpZy5zaGFwZVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgIGNvbmZpZy5zaGFwZSA9IHNoYXBlXG5cbiAgICAgICAgICBpZiAoIG93bmVyLmdyb3VwICE9IHVuZGVmaW5lZCAmJiB0aGlzLm9iamVjdCAhPSB1bmRlZmluZWQgKVxuICAgICAgICAgICAgICAgb3duZXIuZ3JvdXAucmVtb3ZlICggdGhpcy5vYmplY3QgKVxuXG4gICAgICAgICAgY29uc3Qgb2JqID0gdGhpcy5vYmplY3RcbiAgICAgICAgICAgICAgICAgICAgPSBGYWN0b3J5IFtjb25maWcuc2hhcGUgYXMgYW55XSAoIGNvbmZpZywgb3duZXIuZGlzcGxheVNpemUgKCksIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICBsZWZ0ICAgICAgIDogMCwgLy9jb25maWcueCxcbiAgICAgICAgICAgICAgICAgICAgICAgICB0b3AgICAgICAgIDogMCwgLy9jb25maWcueSxcbiAgICAgICAgICAgICAgICAgICAgICAgICBvcmlnaW5YICAgIDogXCJjZW50ZXJcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICBvcmlnaW5ZICAgIDogXCJjZW50ZXJcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICBmaWxsICAgICAgIDogY29uZmlnLmJhY2tncm91bmRDb2xvcixcbiAgICAgICAgICAgICAgICAgICAgICAgICBzdHJva2UgICAgIDogY29uZmlnLmJvcmRlckNvbG9yLFxuICAgICAgICAgICAgICAgICAgICAgICAgIHN0cm9rZVdpZHRoOiBjb25maWcuYm9yZGVyV2lkdGgsXG4gICAgICAgICAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICBvd25lci5ncm91cC5hZGQgKCBvYmogKVxuICAgICAgICAgIG9iai5zZW5kVG9CYWNrICgpXG5cbiAgICAgICAgICBpZiAoIGNvbmZpZy5iYWNrZ3JvdW5kSW1hZ2UgIT0gdW5kZWZpbmVkIClcbiAgICAgICAgICAgICAgIHRoaXMudXBkYXRlQmFja2dyb3VuZEltYWdlICgpXG5cbiAgICAgICAgICBpZiAoIG9iai5jYW52YXMgIT0gdW5kZWZpbmVkIClcbiAgICAgICAgICAgICAgIG9iai5jYW52YXMucmVxdWVzdFJlbmRlckFsbCAoKVxuXG4gICAgIH1cblxuICAgICB1cGRhdGVCYWNrZ3JvdW5kSW1hZ2UgKCBwYXRoPzogc3RyaW5nIClcbiAgICAge1xuICAgICAgICAgIGlmICggYXJndW1lbnRzLmxlbmd0aCA9PSAwIClcbiAgICAgICAgICAgICAgIHBhdGggPSB0aGlzLmNvbmZpZy5iYWNrZ3JvdW5kSW1hZ2VcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICB0aGlzLmNvbmZpZy5iYWNrZ3JvdW5kSW1hZ2UgPSBwYXRoXG5cbiAgICAgICAgICBpZiAoIHR5cGVvZiBwYXRoID09IFwic3RyaW5nXCIgJiYgcGF0aC5sZW5ndGggPiAwIClcbiAgICAgICAgICAgICAgIGZhYnJpYy51dGlsLmxvYWRJbWFnZSAoIHBhdGgsIHRoaXMub25fcGF0dGVybi5iaW5kICh0aGlzKSApXG4gICAgIH1cblxuICAgICBwcml2YXRlIG9uX3BhdHRlcm4gKCBkaW1nOiBIVE1MSW1hZ2VFbGVtZW50IClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHsgb3duZXIgfSA9IHRoaXNcblxuICAgICAgICAgIGNvbnN0IGZhY3RvciA9IGRpbWcud2lkdGggPCBkaW1nLmhlaWdodFxuICAgICAgICAgICAgICAgICAgICAgICAgID8gb3duZXIuZGlzcGxheVNpemUgKCkgLyBkaW1nLndpZHRoXG4gICAgICAgICAgICAgICAgICAgICAgICAgOiBvd25lci5kaXNwbGF5U2l6ZSAoKSAvIGRpbWcuaGVpZ2h0XG5cbiAgICAgICAgICA7KHRoaXMub2JqZWN0IGFzIGFueSkuc2V0ICh7XG4gICAgICAgICAgICAgICBmaWxsOiBuZXcgZmFicmljLlBhdHRlcm4gKHtcbiAgICAgICAgICAgICAgICAgICAgc291cmNlOiBkaW1nLFxuICAgICAgICAgICAgICAgICAgICByZXBlYXQ6IFwibm8tcmVwZWF0XCIsXG4gICAgICAgICAgICAgICAgICAgIHBhdHRlcm5UcmFuc2Zvcm06IFtcbiAgICAgICAgICAgICAgICAgICAgICAgICBmYWN0b3IsIDAsIDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgZmFjdG9yLCAwLCAwLFxuICAgICAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgICB9KVxuICAgICAgICAgIH0pXG4gICAgICAgICAgLnNldENvb3JkcyAoKVxuXG4gICAgICAgICAgaWYgKCB0aGlzLm9iamVjdC5jYW52YXMgKVxuICAgICAgICAgICAgICAgdGhpcy5vYmplY3QuY2FudmFzLnJlbmRlckFsbCAoKVxuICAgICB9XG59XG4iLCJcbmltcG9ydCB7IEdlb21ldHJ5IH0gZnJvbSBcIi4uL2dlb21ldHJ5LmpzXCJcbmltcG9ydCB7IEN0b3IgYXMgRGF0YUN0b3IgfSBmcm9tIFwiLi4vLi4vLi4vRGF0YS9pbmRleC5qc1wiXG5cbmRlY2xhcmUgZ2xvYmFsXG57XG4gICAgIGludGVyZmFjZSAkU2hhcGVFdmVudHMgPEQgZXh0ZW5kcyAkTm9kZSA9IGFueT5cbiAgICAge1xuICAgICAgICAgIG9uQ3JlYXRlOiAoIGVudGl0eTogRCwgYXNwZWN0OiBTaGFwZSApID0+IHZvaWQsXG4gICAgICAgICAgb25EZWxldGU6ICggZW50aXR5OiBELCBzaGFwZTogU2hhcGUgKSA9PiB2b2lkLFxuICAgICAgICAgIG9uVG91Y2g6ICggYXNwZWN0OiBTaGFwZSApID0+IHZvaWRcbiAgICAgfVxuXG4gICAgIGludGVyZmFjZSAkU2hhcGUgPEQgZXh0ZW5kcyAkVGhpbmcgPSAkVGhpbmc+IGV4dGVuZHMgJE5vZGUsICRHZW9tZXRyeSwgJFNoYXBlRXZlbnRzXG4gICAgIHtcbiAgICAgICAgICBjb250ZXh0OiBcImNvbmNlcHQtYXNwZWN0XCJcblxuICAgICAgICAgIGRhdGE6IERcblxuICAgICAgICAgIG1pblNpemUgICA6IG51bWJlclxuICAgICAgICAgIHNpemVPZmZzZXQ6IG51bWJlclxuICAgICAgICAgIHNpemVGYWN0b3I6IG51bWJlclxuICAgICB9XG59XG5cbmV4cG9ydCB0eXBlIEN0b3IgPERhdGEgZXh0ZW5kcyAkU2hhcGUgPSAkU2hhcGUsIFQgZXh0ZW5kcyBTaGFwZSA9IFNoYXBlPiA9IERhdGFDdG9yIDxEYXRhLCBUPlxuXG5leHBvcnQgY2xhc3MgU2hhcGUgPCQgZXh0ZW5kcyAkU2hhcGUgPSAkU2hhcGU+XG57XG4gICAgIGRlZmF1bHRDb25maWcgKCk6ICRTaGFwZVxuICAgICB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgIGNvbnRleHQ6IFwiY29uY2VwdC1hc3BlY3RcIixcbiAgICAgICAgICAgICAgIHR5cGUgICA6IFwic2hhcGVcIixcbiAgICAgICAgICAgICAgIGlkICAgICA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgIGRhdGEgICA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgIHggICAgICA6IDAsXG4gICAgICAgICAgICAgICB5ICAgICAgOiAwLFxuICAgICAgICAgICAgICAgLy9zaXplICAgICAgOiAyMCxcbiAgICAgICAgICAgICAgIG1pblNpemUgICA6IDEsXG4gICAgICAgICAgICAgICBzaXplRmFjdG9yOiAxLFxuICAgICAgICAgICAgICAgc2l6ZU9mZnNldDogMCxcblxuICAgICAgICAgICAgICAgc2hhcGUgICAgICAgICAgIDogXCJjaXJjbGVcIixcbiAgICAgICAgICAgICAgIGJvcmRlckNvbG9yICAgICA6IFwiZ3JheVwiLFxuICAgICAgICAgICAgICAgYm9yZGVyV2lkdGggICAgIDogNSxcblxuICAgICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yIDogXCJ0cmFuc3BhcmVudFwiLFxuICAgICAgICAgICAgICAgYmFja2dyb3VuZEltYWdlIDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgYmFja2dyb3VuZFJlcGVhdDogZmFsc2UsXG5cbiAgICAgICAgICAgICAgIG9uQ3JlYXRlICAgICAgICA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgIG9uRGVsZXRlICAgICAgICA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgIG9uVG91Y2ggICAgICAgICA6IHVuZGVmaW5lZCxcbiAgICAgICAgICB9XG4gICAgIH1cblxuICAgICByZWFkb25seSBjb25maWc6ICRcblxuICAgICBncm91cCA9IHVuZGVmaW5lZCBhcyBmYWJyaWMuR3JvdXBcblxuICAgICByZWFkb25seSBiYWNrZ3JvdW5kOiBHZW9tZXRyeVxuICAgICByZWFkb25seSBib3JkZXI6IEdlb21ldHJ5XG5cbiAgICAgY29uc3RydWN0b3IgKCBkYXRhOiAkIClcbiAgICAge1xuICAgICAgICAgIHRoaXMuYmFja2dyb3VuZCA9IHVuZGVmaW5lZFxuICAgICAgICAgIHRoaXMuYm9yZGVyID0gdW5kZWZpbmVkXG4gICAgICAgICAgdGhpcy5jb25maWcgPSB7XG4gICAgICAgICAgICAgICAuLi4gdGhpcy5kZWZhdWx0Q29uZmlnICgpLFxuICAgICAgICAgICAgICAgLi4uIGRhdGFcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjb25zdCB7IGNvbmZpZyB9ID0gdGhpc1xuXG4gICAgICAgICAgY29uc3QgZ3JvdXAgPSB0aGlzLmdyb3VwID0gbmV3IGZhYnJpYy5Hcm91cCAoIFtdLFxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHdpZHRoICAgICAgOiB0aGlzLmRpc3BsYXlTaXplICgpLFxuICAgICAgICAgICAgICAgaGVpZ2h0ICAgICA6IHRoaXMuZGlzcGxheVNpemUgKCksXG4gICAgICAgICAgICAgICBsZWZ0ICAgICAgIDogY29uZmlnLngsXG4gICAgICAgICAgICAgICB0b3AgICAgICAgIDogY29uZmlnLnksXG4gICAgICAgICAgICAgICBoYXNCb3JkZXJzIDogdHJ1ZSxcbiAgICAgICAgICAgICAgIGhhc0NvbnRyb2xzOiB0cnVlLFxuICAgICAgICAgICAgICAgb3JpZ2luWCAgICA6IFwiY2VudGVyXCIsXG4gICAgICAgICAgICAgICBvcmlnaW5ZICAgIDogXCJjZW50ZXJcIixcbiAgICAgICAgICB9KVxuXG4gICAgICAgICAgOyh0aGlzLmJhY2tncm91bmQgYXMgR2VvbWV0cnkpID0gbmV3IEdlb21ldHJ5ICggdGhpcyApXG5cbiAgICAgICAgICBncm91cC5zZXRDb29yZHMgKClcbiAgICAgfVxuXG4gICAgIGRpc3BsYXlTaXplICgpXG4gICAgIHtcbiAgICAgICAgICBjb25zdCBjb25maWcgPSB0aGlzLmNvbmZpZ1xuXG4gICAgICAgICAgdmFyIHNpemUgPSAoMSArIGNvbmZpZy5zaXplT2Zmc2V0KSAqIGNvbmZpZy5zaXplRmFjdG9yXG5cbiAgICAgICAgICBpZiAoIHNpemUgPCBjb25maWcubWluU2l6ZSApXG4gICAgICAgICAgICAgICBzaXplID0gY29uZmlnLm1pblNpemVcblxuICAgICAgICAgIHJldHVybiBzaXplIHx8IDFcbiAgICAgfVxuXG4gICAgIHVwZGF0ZVNpemUgKClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHsgZ3JvdXAsIGNvbmZpZyB9ID0gdGhpc1xuXG4gICAgICAgICAgaWYgKCB0aGlzLmJhY2tncm91bmQgKVxuICAgICAgICAgICAgICAgdGhpcy5iYWNrZ3JvdW5kLnVwZGF0ZVNpemUgKClcblxuICAgICAgICAgIGlmICggdGhpcy5ib3JkZXIgKVxuICAgICAgICAgICAgICAgdGhpcy5ib3JkZXIudXBkYXRlU2l6ZSAoKVxuXG4gICAgICAgICAgZ3JvdXAuc2V0ICh7XG4gICAgICAgICAgICAgICB3aWR0aCA6IHRoaXMuZGlzcGxheVNpemUgKCksXG4gICAgICAgICAgICAgICBoZWlnaHQ6IHRoaXMuZGlzcGxheVNpemUgKCksXG4gICAgICAgICAgfSlcblxuICAgICAgICAgIGlmICggZ3JvdXAuY2FudmFzIClcbiAgICAgICAgICAgICAgIGdyb3VwLmNhbnZhcy5yZXF1ZXN0UmVuZGVyQWxsICgpXG4gICAgIH1cblxuICAgICBjb29yZHMgKClcbiAgICAge1xuICAgICAgICAgIHJldHVybiB0aGlzLmdyb3VwLmdldENvb3JkcyAoKVxuICAgICB9XG5cbiAgICAgc2V0QmFja2dyb3VuZCAoIG9wdGlvbnM6IFBhcnRpYWwgPCRHZW9tZXRyeT4gKVxuICAgICB7XG4gICAgICAgICAgT2JqZWN0LmFzc2lnbiAoIHRoaXMuY29uZmlnLCBvcHRpb25zIClcblxuICAgICAgICAgIHRoaXMuYmFja2dyb3VuZC51cGRhdGUgKCBvcHRpb25zIClcblxuICAgICAgICAgIHRoaXMudXBkYXRlU2l6ZSAoKVxuICAgICB9XG5cbiAgICAgc2V0UG9zaXRpb24gKCB4OiBudW1iZXIsIHk6IG51bWJlciApXG4gICAgIHtcbiAgICAgICAgICBjb25zdCB7IGdyb3VwLCBjb25maWcgfSA9IHRoaXNcblxuICAgICAgICAgIGNvbmZpZy54ID0geFxuICAgICAgICAgIGNvbmZpZy55ID0geVxuICAgICAgICAgIGdyb3VwLnNldCAoeyBsZWZ0OiB4LCB0b3AgOiB5IH0pLnNldENvb3JkcyAoKVxuXG4gICAgICAgICAgaWYgKCBncm91cC5jYW52YXMgKVxuICAgICAgICAgICAgICAgZ3JvdXAuY2FudmFzLnJlcXVlc3RSZW5kZXJBbGwgKClcbiAgICAgfVxuXG4gICAgIGhvdmVyICggdXA6IGJvb2xlYW4gKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgdGFyZ2V0ID0gdGhpcy5iYWNrZ3JvdW5kICE9IHVuZGVmaW5lZFxuICAgICAgICAgICAgICAgICAgICAgICAgID8gdGhpcy5iYWNrZ3JvdW5kLm9iamVjdFxuICAgICAgICAgICAgICAgICAgICAgICAgIDogdGhpcy5ncm91cFxuXG4gICAgICAgICAgdGFyZ2V0LnNldFNoYWRvdyggJ3JnYmEoMCwwLDAsMC4zKScgKVxuXG4gICAgICAgICAgZmFicmljLnV0aWwuYW5pbWF0ZSh7XG4gICAgICAgICAgICAgICBzdGFydFZhbHVlOiB1cCA/IDAgOiAxLFxuICAgICAgICAgICAgICAgZW5kVmFsdWUgIDogdXAgPyAxIDogMCxcbiAgICAgICAgICAgICAgIGVhc2luZyAgICA6IGZhYnJpYy51dGlsLmVhc2UuZWFzZU91dEN1YmljLFxuICAgICAgICAgICAgICAgYnlWYWx1ZSAgIDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgZHVyYXRpb24gIDogMTAwLFxuICAgICAgICAgICAgICAgb25DaGFuZ2UgIDogKCB2YWx1ZTogbnVtYmVyICkgPT5cbiAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgb2Zmc2V0ID0gMSAqIHZhbHVlXG5cbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0LnNldFNoYWRvdyggYCR7IG9mZnNldCB9cHggJHsgb2Zmc2V0IH1weCAkeyAxMCAqIHZhbHVlIH1weCByZ2JhKDAsMCwwLDAuMylgIClcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0LnNjYWxlKCAxICsgMC4xICogdmFsdWUgKVxuICAgICAgICAgICAgICAgICAgICB0YXJnZXQuY2FudmFzLnJlcXVlc3RSZW5kZXJBbGwgKClcbiAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSlcbiAgICAgfVxuXG4gICAgIHRvSnNvbiAoKVxuICAgICB7XG4gICAgICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5ICggdGhpcy5jb25maWcgKVxuICAgICB9XG59XG4iLCIvLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi90eXBpbmdzLmQudHNcIiAvPlxuLy9pbXBvcnQgKiBhcyBmYWJyaWMgZnJvbSBcImZhYnJpYy9mYWJyaWMtaW1wbFwiXG5cbmltcG9ydCB7IERhdGFiYXNlLCBGYWN0b3J5IH0gZnJvbSBcIi4uLy4uL0RhdGEvaW5kZXguanNcIlxuaW1wb3J0IHsgU2hhcGUgfSBmcm9tIFwiLi9FbGVtZW50L3NoYXBlLmpzXCJcbmltcG9ydCB7IFdyaXRhYmxlLCBPcHRpb25hbCB9IGZyb20gXCIuLi8uLi9MaWIvaW5kZXguanNcIlxuXG5cbmNvbnN0IENPTlRFWFQgPSBcImNvbmNlcHQtYXNwZWN0XCJcbmNvbnN0IGRiICAgICAgPSBuZXcgRGF0YWJhc2UgKClcbmNvbnN0IGZhY3RvcnkgPSBuZXcgRmFjdG9yeSA8U2hhcGU+ICggZGIgKVxuY29uc3QgQVNQRUNUICA9IFN5bWJvbC5mb3IgKCBcIkFTUEVDVFwiIClcblxuLy8gc3ZnRmFjdG9yeVxuLy8gaHRtbEZhY3Rvcnlcbi8vIGZhYnJpY0ZhY3RvcnlcblxuLy8gdWkuZmFjdG9yeS5zZXQgKCBbXCJjb25jZXB0LXVpXCIsIFwiYnV0dG9uXCIsIFwiaHRtbFwiICAsIFwiYnRuMVwiXSwgY3RvciApXG4vLyB1aS5mYWN0b3J5LnNldCAoIFtcImNvbmNlcHQtdWlcIiwgXCJidXR0b25cIiwgXCJzdmdcIiAgICwgXCJidG4xXCJdLCBjdG9yIClcbi8vIHVpLmZhY3Rvcnkuc2V0ICggW1wiY29uY2VwdC11aVwiLCBcImJ1dHRvblwiLCBcImZhYnJpY1wiLCBcImJ0bjFcIl0sIGN0b3IgKVxuXG50eXBlICRJbiA8JCBleHRlbmRzICRTaGFwZSA9ICRTaGFwZT4gPSBPcHRpb25hbCA8JCwgXCJjb250ZXh0XCI+XG5cbi8qKlxuICogQXNzaWduZSBzaSBiZXNvaW4gbGUgY29udGV4dGUgXCJhc3BlY3RcIiBhdSBub2V1ZFxuICovXG5mdW5jdGlvbiBub3JtYWxpemUgKCBub2RlOiAkSW4gKVxue1xuICAgICBpZiAoIFwiY29udGV4dFwiIGluIG5vZGUgKVxuICAgICB7XG4gICAgICAgICAgaWYgKCBub2RlLmNvbnRleHQgIT09IENPTlRFWFQgKVxuICAgICAgICAgICAgICAgdGhyb3cgXCJCYWQgY29udGV4dCB2YWx1ZVwiXG4gICAgIH1cbiAgICAgZWxzZVxuICAgICB7XG4gICAgICAgICAgKG5vZGUgYXMgV3JpdGFibGUgPCRTaGFwZT4pLmNvbnRleHQgPSBDT05URVhUXG4gICAgIH1cblxuICAgICByZXR1cm4gbm9kZSBhcyAkU2hhcGVcbn1cblxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0QXNwZWN0IDxUIGV4dGVuZHMgU2hhcGU+ICggb2JqOiAkTm9kZSB8IFNoYXBlIHwgZmFicmljLk9iamVjdCApOiBUIHwgdW5kZWZpbmVkXG57XG4gICAgIGlmICggb2JqID09IHVuZGVmaW5lZCApXG4gICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZFxuXG4gICAgIGlmICggb2JqIGluc3RhbmNlb2YgU2hhcGUgKVxuICAgICAgICAgIHJldHVybiBvYmogYXMgVFxuXG4gICAgIGlmICggb2JqIGluc3RhbmNlb2YgZmFicmljLk9iamVjdCApXG4gICAgICAgICAgcmV0dXJuIG9iaiBbQVNQRUNUXVxuXG4gICAgIGlmICggZmFjdG9yeS5pblN0b2NrICggQ09OVEVYVCwgb2JqLnR5cGUsIG9iai5pZCApIClcbiAgICAgICAgICByZXR1cm4gZmFjdG9yeS5tYWtlICggQ09OVEVYVCwgb2JqLnR5cGUsIG9iai5pZCApXG5cbiAgICAgY29uc3Qgb3B0aW9ucyAgPSBvYmouY29udGV4dCA9PSBDT05URVhUXG4gICAgICAgICAgICAgICAgICAgID8gb2JqIGFzICRTaGFwZVxuICAgICAgICAgICAgICAgICAgICA6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICBjb250ZXh0OiBDT05URVhULFxuICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGUgICA6IG9iai50eXBlLFxuICAgICAgICAgICAgICAgICAgICAgICAgIGlkICAgICA6IG9iai5pZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhICAgOiBvYmosXG4gICAgICAgICAgICAgICAgICAgIH0gYXMgJFNoYXBlXG5cbiAgICAgaWYgKCAhIGlzRmluaXRlIChvcHRpb25zLngpIClcbiAgICAgICAgICBvcHRpb25zLnggPSAwXG5cbiAgICAgaWYgKCAhIGlzRmluaXRlIChvcHRpb25zLnkpIClcbiAgICAgICAgICBvcHRpb25zLnkgPSAwXG5cbiAgICAgY29uc3Qgc2hhcGUgPSBmYWN0b3J5Lm1ha2UgKCBvcHRpb25zIClcblxuICAgICAvLyBzaGFwZS5ldmVudHMgPSBhcmd1bWVudHMuZXZlbnRzXG4gICAgIC8vIE9iamVjdC5hc3NpZ24gKCBzaGFwZSwgZXZlbnRzIClcblxuICAgICAvL3NoYXBlLmluaXQgKClcbiAgICAgc2hhcGUuZ3JvdXAgW0FTUEVDVF0gPSBzaGFwZVxuXG4gICAgIGlmICggc2hhcGUuY29uZmlnLm9uQ3JlYXRlIClcbiAgICAgICAgICBzaGFwZS5jb25maWcub25DcmVhdGUgKCBzaGFwZS5jb25maWcuZGF0YSwgc2hhcGUgKVxuXG4gICAgIHJldHVybiBzaGFwZSBhcyBUXG59XG5cblxuZXhwb3J0IGZ1bmN0aW9uIHNldEFzcGVjdCA8JCBleHRlbmRzICRTaGFwZT4gKCBub2RlOiAkSW4gPCQ+IClcbntcbiAgICAgZGIuc2V0ICggbm9ybWFsaXplICggbm9kZSApIClcbn1cblxuXG5leHBvcnQgZnVuY3Rpb24gZGVmaW5lQXNwZWN0ICggY3RvcjogbmV3ICggZGF0YTogJFNoYXBlICkgPT4gU2hhcGUsIHR5cGU6IHN0cmluZyApXG57XG4gICAgIGZhY3RvcnkuX2RlZmluZSAoIGN0b3IsIFtDT05URVhULCB0eXBlXSApXG59XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi9ub2Rlcy5kLnRzXCIgLz5cblxuaW1wb3J0IHsgRGF0YWJhc2UgfSBmcm9tIFwiLi4vRGF0YS9pbmRleC5qc1wiXG5pbXBvcnQgeyBXcml0YWJsZSwgT3B0aW9uYWwgfSBmcm9tIFwiLi4vTGliL2luZGV4LmpzXCJcblxuY29uc3QgQ09OVEVYVCA9IFwiY29uY2VwdC1kYXRhXCJcbmNvbnN0IERhdGEgPSBuZXcgRGF0YWJhc2UgKClcblxudHlwZSAkSW4gPCQgZXh0ZW5kcyAkVGhpbmcgPSAkVGhpbmc+ID0gT3B0aW9uYWwgPCQsIFwiY29udGV4dFwiPlxuXG5mdW5jdGlvbiBub3JtYWxpemUgKCBub2RlOiAkSW4gKVxue1xuICAgICBpZiAoIFwiY29udGV4dFwiIGluIG5vZGUgKVxuICAgICB7XG4gICAgICAgICAgaWYgKCBub2RlLmNvbnRleHQgIT09IENPTlRFWFQgKVxuICAgICAgICAgICAgICAgdGhyb3cgXCJCYWQgY29udGV4dCB2YWx1ZVwiXG4gICAgIH1cbiAgICAgZWxzZVxuICAgICB7XG4gICAgICAgICAgKG5vZGUgYXMgV3JpdGFibGUgPCROb2RlPikuY29udGV4dCA9IENPTlRFWFRcbiAgICAgfVxuXG4gICAgIHJldHVybiBub2RlIGFzICROb2RlXG59XG5cblxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Tm9kZSA8JCBleHRlbmRzICRUaGluZz4gKCBub2RlOiAkSW4gKTogJFxuZXhwb3J0IGZ1bmN0aW9uIGdldE5vZGUgPCQgZXh0ZW5kcyAkVGhpbmc+ICggLi4uIHBhdGg6IHN0cmluZyBbXSApOiAkXG5leHBvcnQgZnVuY3Rpb24gZ2V0Tm9kZSAoKVxue1xuICAgICBpZiAoIGFyZ3VtZW50cy5sZW5ndGggPT0gMCApXG4gICAgICAgICAgcmV0dXJuXG5cbiAgICAgaWYgKCBhcmd1bWVudHMubGVuZ3RoID09IDEgKVxuICAgICAgICAgIHJldHVybiBEYXRhLmdldCAoIG5vcm1hbGl6ZSAoIGFyZ3VtZW50cyBbMF0gKSApXG4gICAgIGVsc2VcbiAgICAgICAgICByZXR1cm4gRGF0YS5nZXQgKCBDT05URVhULCAuLi4gYXJndW1lbnRzIClcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldE5vZGUgPCQgZXh0ZW5kcyAkVGhpbmc+ICggbm9kZTogJEluIDwkPiApXG57XG4gICAgIERhdGEuc2V0ICggbm9ybWFsaXplICggbm9kZSApIClcbn1cblxuXG5leHBvcnQgZnVuY3Rpb24gY291bnREYXRhICggdHlwZTogc3RyaW5nIClcbntcbiAgICAgcmV0dXJuIERhdGEuY291bnQgKCBcImNvbmNlcHQtZGF0YVwiLCB0eXBlIClcbn1cbiIsIlxuLypcbmV4YW1wbGU6XG5odHRwczovL3ByZXppLmNvbS9wLzlqcWUyd2tmaGhreS9sYS1idWxsb3RlcmllLXRwY21uL1xuaHR0cHM6Ly9tb3ZpbGFiLm9yZy9pbmRleC5waHA/dGl0bGU9VXRpbGlzYXRldXI6QXVyJUMzJUE5bGllbk1hcnR5XG4qL1xuXG5cbmltcG9ydCB7IEdlb21ldHJ5IH0gZnJvbSBcIi4uLy4uLy4uL0xpYi9pbmRleC5qc1wiXG5cbmltcG9ydCB7IFNoYXBlIH0gZnJvbSBcIi4uLy4uLy4uL0FwcGxpY2F0aW9uL0FzcGVjdC9FbGVtZW50L3NoYXBlLmpzXCJcbmltcG9ydCAqIGFzIGFzcGVjdCBmcm9tIFwiLi4vLi4vLi4vQXBwbGljYXRpb24vQXNwZWN0L2RiLmpzXCJcbmltcG9ydCAqIGFzIGRiIGZyb20gXCIuLi8uLi8uLi9BcHBsaWNhdGlvbi9kYXRhLmpzXCJcblxuaW1wb3J0IFwiZmFicmljXCJcblxuZmFicmljLk9iamVjdC5wcm90b3R5cGUucGFkZGluZyAgICAgICAgICAgID0gMFxuZmFicmljLk9iamVjdC5wcm90b3R5cGUub2JqZWN0Q2FjaGluZyAgICAgID0gZmFsc2VcbmZhYnJpYy5PYmplY3QucHJvdG90eXBlLmhhc0NvbnRyb2xzICAgICAgICA9IHRydWVcbmZhYnJpYy5PYmplY3QucHJvdG90eXBlLmhhc0JvcmRlcnMgICAgICAgICA9IHRydWVcbmZhYnJpYy5PYmplY3QucHJvdG90eXBlLmhhc1JvdGF0aW5nUG9pbnQgICA9IGZhbHNlXG5mYWJyaWMuT2JqZWN0LnByb3RvdHlwZS50cmFuc3BhcmVudENvcm5lcnMgPSBmYWxzZVxuZmFicmljLk9iamVjdC5wcm90b3R5cGUuY2VudGVyZWRTY2FsaW5nICAgID0gdHJ1ZVxuZmFicmljLk9iamVjdC5wcm90b3R5cGUuY29ybmVyU3R5bGUgICAgICAgID0gXCJjaXJjbGVcIlxuZmFicmljLk9iamVjdC5wcm90b3R5cGUuc2V0Q29udHJvbFZpc2libGUgKCBcIm1sXCIsIGZhbHNlIClcbmZhYnJpYy5PYmplY3QucHJvdG90eXBlLnNldENvbnRyb2xWaXNpYmxlICggXCJtdFwiLCBmYWxzZSApXG5mYWJyaWMuT2JqZWN0LnByb3RvdHlwZS5zZXRDb250cm9sVmlzaWJsZSAoIFwibXJcIiwgZmFsc2UgKVxuZmFicmljLk9iamVjdC5wcm90b3R5cGUuc2V0Q29udHJvbFZpc2libGUgKCBcIm1iXCIsIGZhbHNlIClcbmZhYnJpYy5PYmplY3QucHJvdG90eXBlLnNldENvbnRyb2xWaXNpYmxlICggXCJ0bFwiLCBmYWxzZSApXG5mYWJyaWMuT2JqZWN0LnByb3RvdHlwZS5zZXRDb250cm9sVmlzaWJsZSAoIFwiYmxcIiwgZmFsc2UgKVxuZmFicmljLk9iamVjdC5wcm90b3R5cGUuc2V0Q29udHJvbFZpc2libGUgKCBcImJyXCIsIGZhbHNlIClcblxuZXhwb3J0IGludGVyZmFjZSBWaWV3XG57XG4gICAgIG5hbWU6IHN0cmluZ1xuICAgICBhY3RpdmU6IGJvb2xlYW5cbiAgICAgY2hpbGRyZW4gOiBTaGFwZSBbXVxuICAgICB0aHVtYm5haWw6IHN0cmluZ1xuICAgICBwYWNraW5nICA6IFwiZW5jbG9zZVwiXG59XG5cbmV4cG9ydCBjbGFzcyBBcmVhXG57XG4gICAgIHJlYWRvbmx5IGZjYW52YXM6IGZhYnJpYy5DYW52YXNcbiAgICAgcHJpdmF0ZSBhY3RpdmU6IFZpZXdcbiAgICAgcHJpdmF0ZSB2aWV3cyA9IHt9IGFzIFJlY29yZCA8c3RyaW5nLCBWaWV3PlxuXG4gICAgIGNvbnN0cnVjdG9yICggY2FudmFzOiBIVE1MQ2FudmFzRWxlbWVudCApXG4gICAgIHtcbiAgICAgICAgICB0aGlzLmZjYW52YXMgPSBuZXcgZmFicmljLkNhbnZhcyAoIGNhbnZhcyApXG4gICAgICAgICAgdGhpcy5lbmFibGVFdmVudHMgKClcbiAgICAgfVxuXG4gICAgIGdldCB2aWV3ICgpXG4gICAgIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5hY3RpdmVcbiAgICAgfVxuXG4gICAgIG92ZXJGT2JqZWN0OiBmYWJyaWMuT2JqZWN0ID0gdW5kZWZpbmVkXG5cbiAgICAgc3RhdGljIGN1cnJlbnRFdmVudDogZmFicmljLklFdmVudFxuICAgICBvbk92ZXJPYmplY3QgID0gbnVsbCBhcyAoIG9iajogU2hhcGUgKSA9PiB2b2lkXG4gICAgIG9uT3V0T2JqZWN0ICAgPSBudWxsIGFzICggb2JqOiBTaGFwZSApID0+IHZvaWRcbiAgICAgb25Ub3VjaE9iamVjdCA9IG51bGwgYXMgKCBvYmo6IFNoYXBlICkgPT4gdm9pZFxuICAgICBvbkRvdWJsZVRvdWNoT2JqZWN0ID0gbnVsbCBhcyAoIG9iajogU2hhcGUgKSA9PiB2b2lkXG4gICAgIG9uVG91Y2hBcmVhICAgPSBudWxsIGFzICggeDogbnVtYmVyLCB5OiBudW1iZXIgKSA9PiB2b2lkXG5cbiAgICAgY3JlYXRlVmlldyAoIG5hbWU6IHN0cmluZyApXG4gICAgIHtcbiAgICAgICAgICBjb25zdCB7IHZpZXdzIH0gPSB0aGlzXG5cbiAgICAgICAgICBpZiAoIG5hbWUgaW4gdmlld3MgKVxuICAgICAgICAgICAgICAgdGhyb3cgXCJUaGUgdmlldyBhbHJlYWR5IGV4aXN0c1wiXG5cbiAgICAgICAgICByZXR1cm4gdmlld3MgW25hbWVdID0ge1xuICAgICAgICAgICAgICAgbmFtZSxcbiAgICAgICAgICAgICAgIGFjdGl2ZSAgIDogZmFsc2UsXG4gICAgICAgICAgICAgICBjaGlsZHJlbiA6IFtdLFxuICAgICAgICAgICAgICAgcGFja2luZyAgOiBcImVuY2xvc2VcIixcbiAgICAgICAgICAgICAgIHRodW1ibmFpbDogbnVsbCxcbiAgICAgICAgICB9XG4gICAgIH1cblxuICAgICB1c2UgKCBuYW1lOiBzdHJpbmcgKTogVmlld1xuICAgICB1c2UgKCB2aWV3OiBWaWV3ICkgIDogVmlld1xuICAgICB1c2UgKCBuYW1lOiBzdHJpbmcgfCBWaWV3ICk6IFZpZXdcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHsgZmNhbnZhcywgdmlld3MgfSA9IHRoaXNcblxuICAgICAgICAgIGlmICggdHlwZW9mIG5hbWUgIT0gXCJzdHJpbmdcIiApXG4gICAgICAgICAgICAgICBuYW1lID0gbmFtZS5uYW1lXG5cbiAgICAgICAgICBpZiAoIHRoaXMuYWN0aXZlICYmIHRoaXMuYWN0aXZlLm5hbWUgPT0gbmFtZSApXG4gICAgICAgICAgICAgICByZXR1cm5cblxuICAgICAgICAgIGlmICggISAobmFtZSBpbiB2aWV3cykgKVxuICAgICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgICBjb25zdCBhY3RpdmUgPSB0aGlzLmFjdGl2ZSA9IHZpZXdzIFtuYW1lXVxuXG4gICAgICAgICAgZmNhbnZhcy5jbGVhciAoKVxuXG4gICAgICAgICAgZm9yICggY29uc3Qgc2hhcGUgb2YgYWN0aXZlLmNoaWxkcmVuIClcbiAgICAgICAgICAgICAgIGZjYW52YXMuYWRkICggc2hhcGUuZ3JvdXAgKVxuXG4gICAgICAgICAgcmV0dXJuIGFjdGl2ZVxuICAgICB9XG5cbiAgICAgYWRkICggLi4uIHNoYXBlczogKFNoYXBlIHwgJE5vZGUpIFtdICk6IHZvaWRcbiAgICAgYWRkICggLi4uIHBhdGg6IHN0cmluZyBbXSApOiB2b2lkXG4gICAgIGFkZCAoKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgeyBhY3RpdmUsIGZjYW52YXMgfSA9IHRoaXNcblxuICAgICAgICAgIGlmICggYXJndW1lbnRzLmxlbmd0aCA9PSAwIClcbiAgICAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgICAgaWYgKCB0eXBlb2YgYXJndW1lbnRzIFswXSA9PSBcInN0cmluZ1wiIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBjb25zdCBub2RlID0gZGIuZ2V0Tm9kZSAoIC4uLiBhcmd1bWVudHMgYXMgYW55IGFzIHN0cmluZyBbXSApXG4gICAgICAgICAgICAgICBjb25zdCBzaHAgPSBhc3BlY3QuZ2V0QXNwZWN0ICggbm9kZSApXG4gICAgICAgICAgICAgICBhY3RpdmUuY2hpbGRyZW4ucHVzaCAoIHNocCApXG4gICAgICAgICAgICAgICBmY2FudmFzLmFkZCAoIHNocC5ncm91cCApXG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2UgZm9yICggY29uc3QgcyBvZiBhcmd1bWVudHMgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNvbnN0IHNocCA9IGFzcGVjdC5nZXRBc3BlY3QgKCBzIGFzICROb2RlIHwgU2hhcGUgKVxuXG4gICAgICAgICAgICAgICAvLyBzaHAuZ2V0RmFicmljXG4gICAgICAgICAgICAgICAvLyBzaHAuZ2V0SHRtbFxuICAgICAgICAgICAgICAgLy8gc2hwLmdldFN2Z1xuXG4gICAgICAgICAgICAgICAvLyBmYWN0b3J5XG5cbiAgICAgICAgICAgICAgIGFjdGl2ZS5jaGlsZHJlbi5wdXNoICggc2hwIClcbiAgICAgICAgICAgICAgIGZjYW52YXMuYWRkICggc2hwLmdyb3VwIClcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBmY2FudmFzLnJlcXVlc3RSZW5kZXJBbGwgKClcbiAgICAgfVxuXG4gICAgIGNsZWFyICgpXG4gICAgIHtcbiAgICAgICAgICB0aGlzLmZjYW52YXMuY2xlYXIgKClcbiAgICAgfVxuXG4gICAgIHBhY2sgKClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHsgZmNhbnZhcyB9ID0gdGhpc1xuXG4gICAgICAgICAgY29uc3Qgb2JqZWN0cyA9IGZjYW52YXMuZ2V0T2JqZWN0cyAoKVxuICAgICAgICAgIGNvbnN0IHBvc2l0aW9ucyA9IFtdIGFzIEdlb21ldHJ5LkNpcmNsZSBbXVxuXG4gICAgICAgICAgZm9yICggY29uc3QgZyBvZiBvYmplY3RzIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBjb25zdCByID0gKGcud2lkdGggPiBnLmhlaWdodCA/IGcud2lkdGggOiBnLmhlaWdodCkgLyAyXG4gICAgICAgICAgICAgICBwb3NpdGlvbnMucHVzaCAoIHsgeDogZy5sZWZ0LCB5OiBnLnRvcCwgcjogciArIDIwIH0gKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIEdlb21ldHJ5LnBhY2tFbmNsb3NlICggcG9zaXRpb25zICkgKiAyXG5cbiAgICAgICAgICBmb3IgKCB2YXIgaSA9IDAgOyBpIDwgb2JqZWN0cy5sZW5ndGggOyBpKysgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNvbnN0IGcgPSBvYmplY3RzIFtpXVxuICAgICAgICAgICAgICAgY29uc3QgcCA9IHBvc2l0aW9ucyBbaV1cblxuICAgICAgICAgICAgICAgZy5sZWZ0ID0gcC54XG4gICAgICAgICAgICAgICBnLnRvcCAgPSBwLnlcbiAgICAgICAgICAgICAgIGcuc2V0Q29vcmRzICgpXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgZmNhbnZhcy5yZXF1ZXN0UmVuZGVyQWxsICgpXG4gICAgIH1cblxuICAgICB6b29tICggZmFjdG9yPzogbnVtYmVyIHwgU2hhcGUgKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgeyBmY2FudmFzIH0gPSB0aGlzXG5cbiAgICAgICAgICBpZiAoIHR5cGVvZiBmYWN0b3IgPT0gXCJudW1iZXJcIiApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29uc3Qgb2JqZWN0cyA9IGZjYW52YXMuZ2V0T2JqZWN0cyAoKVxuXG4gICAgICAgICAgaWYgKCB0eXBlb2YgZmFjdG9yID09IFwib2JqZWN0XCIgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNvbnN0IG8gPSBmYWN0b3IuZ3JvdXBcblxuICAgICAgICAgICAgICAgdmFyIGxlZnQgICA9IG8ubGVmdCAtIG8ud2lkdGhcbiAgICAgICAgICAgICAgIHZhciByaWdodCAgPSBvLmxlZnQgKyBvLndpZHRoXG4gICAgICAgICAgICAgICB2YXIgdG9wICAgID0gby50b3AgIC0gby5oZWlnaHRcbiAgICAgICAgICAgICAgIHZhciBib3R0b20gPSBvLnRvcCAgKyBvLmhlaWdodFxuXG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICB2YXIgbGVmdCAgID0gMFxuICAgICAgICAgICAgICAgdmFyIHJpZ2h0ICA9IDBcbiAgICAgICAgICAgICAgIHZhciB0b3AgICAgPSAwXG4gICAgICAgICAgICAgICB2YXIgYm90dG9tID0gMFxuXG4gICAgICAgICAgICAgICBmb3IgKCBjb25zdCBvIG9mIG9iamVjdHMgKVxuICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBsID0gby5sZWZ0IC0gby53aWR0aFxuICAgICAgICAgICAgICAgICAgICBjb25zdCByID0gby5sZWZ0ICsgby53aWR0aFxuICAgICAgICAgICAgICAgICAgICBjb25zdCB0ID0gby50b3AgIC0gby5oZWlnaHRcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYiA9IG8udG9wICArIG8uaGVpZ2h0XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCBsIDwgbGVmdCApXG4gICAgICAgICAgICAgICAgICAgICAgICAgbGVmdCA9IGxcblxuICAgICAgICAgICAgICAgICAgICBpZiAoIHIgPiByaWdodCApXG4gICAgICAgICAgICAgICAgICAgICAgICAgcmlnaHQgPSByXG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCB0IDwgdG9wIClcbiAgICAgICAgICAgICAgICAgICAgICAgICB0b3AgPSB0XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCBiID4gYm90dG9tIClcbiAgICAgICAgICAgICAgICAgICAgICAgICBib3R0b20gPSBiXG4gICAgICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29uc3QgdyAgPSByaWdodCAtIGxlZnRcbiAgICAgICAgICBjb25zdCBoICA9IGJvdHRvbSAtIHRvcFxuICAgICAgICAgIGNvbnN0IHZ3ID0gZmNhbnZhcy5nZXRXaWR0aCAgKClcbiAgICAgICAgICBjb25zdCB2aCA9IGZjYW52YXMuZ2V0SGVpZ2h0ICgpXG5cbiAgICAgICAgICBjb25zdCBmID0gdyA+IGhcbiAgICAgICAgICAgICAgICAgICAgPyAodncgPCB2aCA/IHZ3IDogdmgpIC8gd1xuICAgICAgICAgICAgICAgICAgICA6ICh2dyA8IHZoID8gdncgOiB2aCkgLyBoXG5cbiAgICAgICAgICBmY2FudmFzLnZpZXdwb3J0VHJhbnNmb3JtIFswXSA9IGZcbiAgICAgICAgICBmY2FudmFzLnZpZXdwb3J0VHJhbnNmb3JtIFszXSA9IGZcblxuICAgICAgICAgIGNvbnN0IGN4ID0gbGVmdCArIHcgLyAyXG4gICAgICAgICAgY29uc3QgY3kgPSB0b3AgICsgaCAvIDJcblxuICAgICAgICAgIGZjYW52YXMudmlld3BvcnRUcmFuc2Zvcm0gWzRdID0gLShjeCAqIGYpICsgdncgLyAyXG4gICAgICAgICAgZmNhbnZhcy52aWV3cG9ydFRyYW5zZm9ybSBbNV0gPSAtKGN5ICogZikgKyB2aCAvIDJcblxuICAgICAgICAgIGZvciAoIGNvbnN0IG8gb2Ygb2JqZWN0cyApXG4gICAgICAgICAgICAgICBvLnNldENvb3JkcyAoKVxuXG4gICAgICAgICAgZmNhbnZhcy5yZXF1ZXN0UmVuZGVyQWxsICgpXG4gICAgIH1cblxuICAgICBpc29sYXRlICggc2hhcGU6IFNoYXBlIClcbiAgICAge1xuICAgICAgICAgIGZvciAoIGNvbnN0IG8gb2YgdGhpcy5mY2FudmFzLmdldE9iamVjdHMgKCkgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIG8udmlzaWJsZSA9IGZhbHNlXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgc2hhcGUuZ3JvdXAudmlzaWJsZSA9IHRydWVcbiAgICAgfVxuXG4gICAgIGdldFRodW1ibmFpbCAoKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgeyBhY3RpdmU6IGN2aWV3IH0gPSB0aGlzXG5cbiAgICAgICAgICBjb25zdCB0aHVtYm5haWwgPSBjdmlldy50aHVtYm5haWxcblxuICAgICAgICAgIGlmICggdGh1bWJuYWlsIHx8IGN2aWV3LmFjdGl2ZSA9PSBmYWxzZSApXG4gICAgICAgICAgICAgICB0aHVtYm5haWxcblxuICAgICAgICAgIHJldHVybiBjdmlldy50aHVtYm5haWwgPSB0aGlzLmZjYW52YXMudG9EYXRhVVJMICh7IGZvcm1hdDogXCJqcGVnXCIgfSlcbiAgICAgfVxuXG4gICAgIC8vIFVJIEVWRU5UU1xuXG4gICAgIGVuYWJsZUV2ZW50cyAoKVxuICAgICB7XG4gICAgICAgICAgdGhpcy5pbml0Q2xpY2tFdmVudCAoKVxuICAgICAgICAgIHRoaXMuaW5pdE92ZXJFdmVudCAgKClcbiAgICAgICAgICB0aGlzLmluaXRQYW5FdmVudCAgICgpXG4gICAgICAgICAgdGhpcy5pbml0Wm9vbUV2ZW50ICAoKVxuICAgICAgICAgIC8vdGhpcy5pbml0TW92ZU9iamVjdCAoKVxuICAgICAgICAgIC8vdGhpcy5pbml0RHJhZ0V2ZW50ICAoKVxuXG4gICAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIgKCBcInJlc2l6ZVwiLCB0aGlzLnJlc3BvbnNpdmUuYmluZCAodGhpcykgKVxuICAgICB9XG5cbiAgICAgcHJpdmF0ZSByZXNwb25zaXZlICgpXG4gICAgIHtcbiAgICAgICAgICB2YXIgd2lkdGggICA9ICh3aW5kb3cuaW5uZXJXaWR0aCAgPiAwKSA/IHdpbmRvdy5pbm5lcldpZHRoICA6IHNjcmVlbi53aWR0aFxuICAgICAgICAgIHZhciBoZWlnaHQgID0gKHdpbmRvdy5pbm5lckhlaWdodCA+IDApID8gd2luZG93LmlubmVySGVpZ2h0IDogc2NyZWVuLmhlaWdodFxuXG4gICAgICAgICAgdGhpcy5mY2FudmFzLnNldERpbWVuc2lvbnMoe1xuICAgICAgICAgICAgICAgd2lkdGg6IHdpZHRoLFxuICAgICAgICAgICAgICAgaGVpZ2h0OiBoZWlnaHRcbiAgICAgICAgICB9KVxuICAgICB9XG5cbiAgICAgcHJpdmF0ZSBpbml0Q2xpY2tFdmVudCAoKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgcGFnZSAgICAgICAgICAgPSB0aGlzLmZjYW52YXNcbiAgICAgICAgICBjb25zdCBtYXhfY2xpY2hfYXJlYSA9IDI1ICogMjVcbiAgICAgICAgICB2YXIgICBsYXN0X2NsaWNrICAgICA9IC0xXG4gICAgICAgICAgdmFyICAgbGFzdF9wb3MgICAgICAgPSB7IHg6IC05OTk5LCB5OiAtOTk5OSB9XG5cbiAgICAgICAgICBwYWdlLm9uICggXCJtb3VzZTpkb3duXCIsIGZldmVudCA9PlxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNvbnNvbGUubG9nICggXCJtb3VzZTpkb3duXCIgKVxuICAgICAgICAgICAgICAgY29uc3Qgbm93ICAgPSBEYXRlLm5vdyAoKVxuICAgICAgICAgICAgICAgY29uc3QgcG9zICAgPSBmZXZlbnQucG9pbnRlclxuICAgICAgICAgICAgICAgY29uc3QgcmVzZXQgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGxhc3RfY2xpY2sgPSBub3dcbiAgICAgICAgICAgICAgICAgICAgbGFzdF9wb3MgICA9IHBvc1xuICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAvLyBOb3VzIHbDqXJpZmlvbnMgcXVlIHNvaXQgdW4gZG91YmxlLWNsaXF1ZS5cbiAgICAgICAgICAgICAgIGlmICggNTAwIDwgbm93IC0gbGFzdF9jbGljayApXG4gICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGlmICggdGhpcy5vblRvdWNoT2JqZWN0IClcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGVsZW1lbnQgPSBhc3BlY3QuZ2V0QXNwZWN0ICggZmV2ZW50LnRhcmdldCApXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICBBcmVhLmN1cnJlbnRFdmVudCA9IGZldmVudDtcbiAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIGVsZW1lbnQgKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5vblRvdWNoT2JqZWN0ICggZWxlbWVudCApXG4gICAgICAgICAgICAgICAgICAgICAgICAgQXJlYS5jdXJyZW50RXZlbnQgPSBudWxsO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgZmV2ZW50LmUuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uICgpXG4gICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICB7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzZXQgKClcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAvLyBOb3VzIHbDqXJpZmlvbnMgcXVlIGxlcyBkZXV4IGNsaXF1ZXMgc2UgdHJvdXZlIGRhbnMgdW5lIHLDqWdpb24gcHJvY2hlLlxuICAgICAgICAgICAgICAgY29uc3Qgem9uZSA9IChwb3MueCAtIGxhc3RfcG9zLngpICogKHBvcy55IC0gbGFzdF9wb3MueSlcbiAgICAgICAgICAgICAgIGlmICggem9uZSA8IC1tYXhfY2xpY2hfYXJlYSB8fCBtYXhfY2xpY2hfYXJlYSA8IHpvbmUgKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzZXQgKClcblxuICAgICAgICAgICAgICAgLy8gU2kgbGUgcG9pbnRlciBlc3QgYXUtZGVzc3VzIGTigJl1bmUgZm9ybWUuXG4gICAgICAgICAgICAgICBpZiAoIGZldmVudC50YXJnZXQgIT0gdW5kZWZpbmVkIClcbiAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCB0aGlzLm9uRG91YmxlVG91Y2hPYmplY3QgKVxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZWxlbWVudCA9IGFzcGVjdC5nZXRBc3BlY3QgKCBmZXZlbnQudGFyZ2V0IClcblxuICAgICAgICAgICAgICAgICAgICAgICAgIEFyZWEuY3VycmVudEV2ZW50ID0gZmV2ZW50O1xuICAgICAgICAgICAgICAgICAgICAgICAgIGlmICggZWxlbWVudCApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm9uRG91YmxlVG91Y2hPYmplY3QgKCBlbGVtZW50IClcbiAgICAgICAgICAgICAgICAgICAgICAgICBBcmVhLmN1cnJlbnRFdmVudCA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBsYXN0X2NsaWNrICAgPSAtMVxuICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgLy8gU2kgbGUgcG9pbnRlciBlc3QgYXUtZGVzc3VzIGTigJl1bmUgem9uZSB2aWRlLlxuICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBBcmVhLmN1cnJlbnRFdmVudCA9IGZldmVudDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCB0aGlzLm9uVG91Y2hBcmVhIClcbiAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm9uVG91Y2hBcmVhICggcG9zLngsIHBvcy55IClcbiAgICAgICAgICAgICAgICAgICAgQXJlYS5jdXJyZW50RXZlbnQgPSBudWxsO1xuICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICBmZXZlbnQuZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24gKClcblxuICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgfSlcbiAgICAgfVxuXG4gICAgIHByaXZhdGUgaW5pdE92ZXJFdmVudCAoKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgcGFnZSA9IHRoaXMuZmNhbnZhc1xuXG4gICAgICAgICAgcGFnZS5vbiAoIFwibW91c2U6b3ZlclwiLCBmZXZlbnQgPT5cbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICB0aGlzLm92ZXJGT2JqZWN0ID0gZmV2ZW50LnRhcmdldFxuXG4gICAgICAgICAgICAgICBpZiAoIHRoaXMub25PdmVyT2JqZWN0IClcbiAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZWxlbWVudCA9IGFzcGVjdC5nZXRBc3BlY3QgKCBmZXZlbnQudGFyZ2V0IClcblxuICAgICAgICAgICAgICAgICAgICBBcmVhLmN1cnJlbnRFdmVudCA9IGZldmVudDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBlbGVtZW50IClcbiAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm9uT3Zlck9iamVjdCAoIGVsZW1lbnQgKVxuICAgICAgICAgICAgICAgICAgICBBcmVhLmN1cnJlbnRFdmVudCA9IG51bGw7XG4gICAgICAgICAgICAgICB9XG4gICAgICAgICAgfSlcblxuICAgICAgICAgIHBhZ2Uub24gKCBcIm1vdXNlOm91dFwiLCBmZXZlbnQgPT5cbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICB0aGlzLm92ZXJGT2JqZWN0ID0gdW5kZWZpbmVkXG5cbiAgICAgICAgICAgICAgIGlmICggdGhpcy5vbk91dE9iamVjdCApXG4gICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVsZW1lbnQgPSBhc3BlY3QuZ2V0QXNwZWN0ICggZmV2ZW50LnRhcmdldCApXG5cbiAgICAgICAgICAgICAgICAgICAgQXJlYS5jdXJyZW50RXZlbnQgPSBmZXZlbnQ7XG4gICAgICAgICAgICAgICAgICAgIGlmICggZWxlbWVudCApXG4gICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5vbk91dE9iamVjdCAoIGVsZW1lbnQgKVxuICAgICAgICAgICAgICAgICAgICBBcmVhLmN1cnJlbnRFdmVudCA9IG51bGw7XG4gICAgICAgICAgICAgICB9XG4gICAgICAgICAgfSlcbiAgICAgfVxuXG4gICAgIHByaXZhdGUgaW5pdFBhbkV2ZW50ICgpXG4gICAgIHtcbiAgICAgICAgICBjb25zdCBwYWdlICAgICAgID0gdGhpcy5mY2FudmFzXG4gICAgICAgICAgdmFyICAgaXNEcmFnZ2luZyA9IGZhbHNlXG4gICAgICAgICAgdmFyICAgbGFzdFBvc1ggICA9IC0xXG4gICAgICAgICAgdmFyICAgbGFzdFBvc1kgICA9IC0xXG5cbiAgICAgICAgICBwYWdlLm9uICggXCJtb3VzZTpkb3duXCIsIGZldmVudCA9PlxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGlmICggdGhpcy5vdmVyRk9iamVjdCA9PSB1bmRlZmluZWQgKVxuICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBwYWdlLnNlbGVjdGlvbiA9IGZhbHNlXG4gICAgICAgICAgICAgICAgICAgIHBhZ2UuZGlzY2FyZEFjdGl2ZU9iamVjdCAoKVxuICAgICAgICAgICAgICAgICAgICBwYWdlLmZvckVhY2hPYmplY3QgKCBvID0+IHsgby5zZWxlY3RhYmxlID0gZmFsc2UgfSApXG5cbiAgICAgICAgICAgICAgICAgICAgaXNEcmFnZ2luZyA9IHRydWVcbiAgICAgICAgICAgICAgICAgICAgbGFzdFBvc1ggICA9IGZldmVudC5wb2ludGVyLnhcbiAgICAgICAgICAgICAgICAgICAgbGFzdFBvc1kgICA9IGZldmVudC5wb2ludGVyLnlcblxuICAgICAgICAgICAgICAgICAgICBwYWdlLnJlcXVlc3RSZW5kZXJBbGwgKClcbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICB9KVxuXG4gICAgICAgICAgcGFnZS5vbiAoIFwibW91c2U6bW92ZVwiLCBmZXZlbnQgPT5cbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBpZiAoIGlzRHJhZ2dpbmcgKVxuICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBwb2ludGVyICA9IGZldmVudC5wb2ludGVyXG5cbiAgICAgICAgICAgICAgICAgICAgcGFnZS52aWV3cG9ydFRyYW5zZm9ybSBbNF0gKz0gcG9pbnRlci54IC0gbGFzdFBvc1hcbiAgICAgICAgICAgICAgICAgICAgcGFnZS52aWV3cG9ydFRyYW5zZm9ybSBbNV0gKz0gcG9pbnRlci55IC0gbGFzdFBvc1lcblxuICAgICAgICAgICAgICAgICAgICBwYWdlLnJlcXVlc3RSZW5kZXJBbGwoKVxuXG4gICAgICAgICAgICAgICAgICAgIGxhc3RQb3NYID0gcG9pbnRlci54XG4gICAgICAgICAgICAgICAgICAgIGxhc3RQb3NZID0gcG9pbnRlci55XG4gICAgICAgICAgICAgICB9XG4gICAgICAgICAgfSlcblxuICAgICAgICAgIHBhZ2Uub24gKCBcIm1vdXNlOnVwXCIsICgpID0+XG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgcGFnZS5zZWxlY3Rpb24gPSB0cnVlXG5cbiAgICAgICAgICAgICAgIHBhZ2UuZm9yRWFjaE9iamVjdCAoIG8gPT5cbiAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgby5zZWxlY3RhYmxlID0gdHJ1ZVxuICAgICAgICAgICAgICAgICAgICBvLnNldENvb3JkcygpXG4gICAgICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICAgICBpc0RyYWdnaW5nID0gZmFsc2VcblxuICAgICAgICAgICAgICAgcGFnZS5yZXF1ZXN0UmVuZGVyQWxsICgpXG4gICAgICAgICAgfSlcbiAgICAgfVxuXG4gICAgIHByaXZhdGUgaW5pdFpvb21FdmVudCAoKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgcGFnZSA9IHRoaXMuZmNhbnZhc1xuXG4gICAgICAgICAgcGFnZS5vbiAoIFwibW91c2U6d2hlZWxcIiwgZmV2ZW50ID0+XG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgY29uc3QgZXZlbnQgICA9IGZldmVudC5lIGFzIFdoZWVsRXZlbnRcbiAgICAgICAgICAgICAgIHZhciAgIGRlbHRhICAgPSBldmVudC5kZWx0YVlcbiAgICAgICAgICAgICAgIHZhciAgIHpvb20gICAgPSBwYWdlLmdldFpvb20oKVxuICAgICAgICAgICAgICAgICAgICB6b29tICAgID0gem9vbSAtIGRlbHRhICogMC4wMDVcblxuICAgICAgICAgICAgICAgaWYgKHpvb20gPiA5KVxuICAgICAgICAgICAgICAgICAgICB6b29tID0gOVxuXG4gICAgICAgICAgICAgICBpZiAoem9vbSA8IDAuNSlcbiAgICAgICAgICAgICAgICAgICAgem9vbSA9IDAuNVxuXG4gICAgICAgICAgICAgICBwYWdlLnpvb21Ub1BvaW50KCBuZXcgZmFicmljLlBvaW50ICggZXZlbnQub2Zmc2V0WCwgZXZlbnQub2Zmc2V0WSApLCB6b29tIClcblxuICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKVxuICAgICAgICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKClcblxuICAgICAgICAgICAgICAgcGFnZS5yZXF1ZXN0UmVuZGVyQWxsICgpXG4gICAgICAgICAgfSlcbiAgICAgfVxuXG4gICAgIHByaXZhdGUgaW5pdE1vdmVPYmplY3QgKClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHBhZ2UgICAgICA9IHRoaXMuZmNhbnZhc1xuICAgICAgICAgIHZhciAgIGNsdXN0ZXIgICA9IHVuZGVmaW5lZCBhcyBmYWJyaWMuT2JqZWN0IFtdXG4gICAgICAgICAgdmFyICAgcG9zaXRpb25zID0gdW5kZWZpbmVkIGFzIG51bWJlciBbXVtdXG4gICAgICAgICAgdmFyICAgb3JpZ2luWCAgID0gMFxuICAgICAgICAgIHZhciAgIG9yaWdpblkgICA9IDBcblxuICAgICAgICAgIGZ1bmN0aW9uIG9uX3NlbGVjdGlvbiAoZmV2ZW50OiBmYWJyaWMuSUV2ZW50KVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNvbnN0IHRhcmdldCA9IGZldmVudC50YXJnZXRcbiAgICAgICAgICAgICAgIGNvbnNvbGUubG9nICggdGFyZ2V0IClcbiAgICAgICAgICAgICAgIGNsdXN0ZXIgPSB0YXJnZXQgW1wiY2x1c3RlclwiXSBhcyBmYWJyaWMuT2JqZWN0IFtdXG5cbiAgICAgICAgICAgICAgIGlmICggY2x1c3RlciA9PSB1bmRlZmluZWQgKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm5cblxuICAgICAgICAgICAgICAgb3JpZ2luWCAgID0gdGFyZ2V0LmxlZnRcbiAgICAgICAgICAgICAgIG9yaWdpblkgICA9IHRhcmdldC50b3BcbiAgICAgICAgICAgICAgIHBvc2l0aW9ucyA9IFtdXG5cbiAgICAgICAgICAgICAgIGZvciAoIGNvbnN0IG8gb2YgY2x1c3RlciApXG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9ucy5wdXNoIChbIG8ubGVmdCwgby50b3AgXSlcblxuICAgICAgICAgICAgICAgY29uc29sZS5sb2cgKFwiY3JlYXRlZFwiKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHBhZ2Uub24gKCBcInNlbGVjdGlvbjpjcmVhdGVkXCIsIG9uX3NlbGVjdGlvbiApXG4gICAgICAgICAgcGFnZS5vbiAoIFwic2VsZWN0aW9uOnVwZGF0ZWRcIiwgb25fc2VsZWN0aW9uIClcblxuICAgICAgICAgIHBhZ2Uub24gKCBcIm9iamVjdDptb3ZpbmdcIiwgZmV2ZW50ID0+XG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgaWYgKCBjbHVzdGVyID09IHVuZGVmaW5lZCApXG4gICAgICAgICAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgICAgICAgICBjb25zdCB0YXJnZXQgICA9IGZldmVudC50YXJnZXRcbiAgICAgICAgICAgICAgIGNvbnN0IG9mZnNldFggID0gdGFyZ2V0LmxlZnQgLSBvcmlnaW5YXG4gICAgICAgICAgICAgICBjb25zdCBvZmZzZXRZICA9IHRhcmdldC50b3AgIC0gb3JpZ2luWVxuXG4gICAgICAgICAgICAgICBmb3IgKCB2YXIgaSA9IDAgOyBpIDwgY2x1c3Rlci5sZW5ndGggOyBpKysgKVxuICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBvYmogPSBjbHVzdGVyIFtpXVxuICAgICAgICAgICAgICAgICAgICBjb25zdCBwb3MgPSBwb3NpdGlvbnMgW2ldXG4gICAgICAgICAgICAgICAgICAgIG9iai5zZXQgKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICBsZWZ0OiBwb3MgWzBdICsgb2Zmc2V0WCxcbiAgICAgICAgICAgICAgICAgICAgICAgICB0b3AgOiBwb3MgWzFdICsgb2Zmc2V0WVxuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgfVxuICAgICAgICAgIH0pXG5cbiAgICAgICAgICBwYWdlLm9uICggXCJzZWxlY3Rpb246Y2xlYXJlZFwiLCBmZXZlbnQgPT5cbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBjbHVzdGVyID0gdW5kZWZpbmVkXG5cbiAgICAgICAgICAgICAgIGNvbnNvbGUubG9nIChcImNsZWFyZWRcIilcbiAgICAgICAgICB9KVxuICAgICB9XG5cbiAgICAgcHJpdmF0ZSBpbml0RHJhZ0V2ZW50ICgpXG4gICAgIHtcbiAgICAgICAgICAvLyBodHRwczovL3d3dy53M3NjaG9vbHMuY29tL2h0bWwvaHRtbDVfZHJhZ2FuZGRyb3AuYXNwXG4gICAgICAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL1Nob3BpZnkvZHJhZ2dhYmxlL2Jsb2IvbWFzdGVyL3NyYy9EcmFnZ2FibGUvRHJhZ2dhYmxlLmpzXG5cbiAgICAgICAgICBjb25zdCBwYWdlICAgICAgPSB0aGlzLmZjYW52YXNcblxuICAgICAgICAgIHBhZ2Uub24gKCBcInRvdWNoOmRyYWdcIiwgZmV2ZW50ID0+XG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgLy9jb25zb2xlLmxvZyAoIGZldmVudCApXG4gICAgICAgICAgICAgICBjb25zb2xlLmxvZyAoIFwidG91Y2g6ZHJhZ1wiIClcbiAgICAgICAgICB9KVxuXG4gICAgICAgICAgcGFnZS5vbiAoIFwiZHJhZ2VudGVyXCIsIGZldmVudCA9PlxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIC8vY29uc29sZS5sb2cgKCBcIkRST1AtRU5URVJcIiwgZmV2ZW50IClcbiAgICAgICAgICB9KVxuXG4gICAgICAgICAgcGFnZS5vbiAoIFwiZHJhZ292ZXJcIiwgZmV2ZW50ID0+XG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgLy9jb25zb2xlLmxvZyAoIFwiRFJPUC1PVkVSXCIsIGZldmVudCApXG4gICAgICAgICAgfSlcblxuICAgICAgICAgIHBhZ2Uub24gKCBcImRyb3BcIiwgZmV2ZW50ID0+XG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgLy9jb25zdCBlID0gZmV2ZW50LmUgYXMgRHJhZ0V2ZW50XG4gICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nICggXCJEUk9QXCIsIGUuZGF0YVRyYW5zZmVyLmdldERhdGEgKFwidGV4dFwiKSApXG4gICAgICAgICAgfSlcbiAgICAgfVxufVxuIiwiXG5pbXBvcnQgeyBBcmVhIH0gZnJvbSBcIi4vQ29tcG9uZW50L0FyZWEvYXJlYS5qc1wiXG5jb25zdCBjbWRzID0ge30gYXMgUmVjb3JkIDxzdHJpbmcsIENvbW1hbmQ+XG5cbmNsYXNzIENvbW1hbmRcbntcbiAgICAgY29uc3RydWN0b3IgKCBwcml2YXRlIGNhbGxiYWNrOiAoIGV2ZW50OiBmYWJyaWMuSUV2ZW50ICkgPT4gdm9pZCApIHt9XG5cbiAgICAgcnVuICgpXG4gICAgIHtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgdGhpcy5jYWxsYmFjayAoIEFyZWEuY3VycmVudEV2ZW50ICk7XG4gICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcblxuICAgICAgICAgIH1cbiAgICAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gY29tbWFuZCAoIG5hbWU6IHN0cmluZywgY2FsbGJhY2s/OiAoIGV2ZW50OiBmYWJyaWMuSUV2ZW50ICkgPT4gdm9pZCApXG57XG4gICAgIGlmICggdHlwZW9mIGNhbGxiYWNrID09IFwiZnVuY3Rpb25cIiApXG4gICAgIHtcbiAgICAgICAgICBpZiAoIG5hbWUgaW4gY21kcyApIHJldHVyblxuICAgICAgICAgIGNtZHMgW25hbWVdID0gbmV3IENvbW1hbmQgKCBjYWxsYmFjayApXG4gICAgIH1cblxuICAgICByZXR1cm4gY21kcyBbbmFtZV1cbn1cbiIsIlxuaW1wb3J0IHsgY3JlYXRlTm9kZSB9IGZyb20gXCIuLi8uLi8uLi9EYXRhL2luZGV4LmpzXCJcbmltcG9ydCB7IHhub2RlIH0gZnJvbSBcIi4uL3hub2RlLmpzXCJcblxuZGVjbGFyZSBnbG9iYWxcbntcbiAgICAgaW50ZXJmYWNlICRDb21wb25lbnQgZXh0ZW5kcyAkQ2x1c3RlclxuICAgICB7XG4gICAgICAgICAgcmVhZG9ubHkgY29udGV4dDogXCJjb25jZXB0LXVpXCJcbiAgICAgICAgICB0eXBlOiBzdHJpbmdcbiAgICAgICAgICBjaGlsZHJlbj86ICRDb21wb25lbnQgW10gLy8gUmVjb3JkIDxzdHJpbmcsICRDaGlsZD5cbiAgICAgfVxufVxuXG5leHBvcnQgY2xhc3MgQ29tcG9uZW50IDwkIGV4dGVuZHMgJENvbXBvbmVudCA9ICRDb21wb25lbnQ+XG57XG4gICAgIGRhdGE6ICRcblxuICAgICBjb250YWluZXI6IEhUTUxFbGVtZW50IHwgU1ZHRWxlbWVudFxuXG4gICAgIGRlZmF1bHREYXRhICgpIDogJENvbXBvbmVudFxuICAgICB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgIGNvbnRleHQ6IFwiY29uY2VwdC11aVwiLFxuICAgICAgICAgICAgICAgdHlwZSAgIDogXCJjb21wb25lbnRcIixcbiAgICAgICAgICAgICAgIGlkICAgICA6IHVuZGVmaW5lZCxcbiAgICAgICAgICB9XG4gICAgIH1cblxuICAgICBjb25zdHJ1Y3RvciAoIGRhdGE6ICQgKVxuICAgICB7XG4gICAgICAgICAgdGhpcy5kYXRhID0gT2JqZWN0LmFzc2lnbiAoXG4gICAgICAgICAgICAgICB0aGlzLmRlZmF1bHREYXRhICgpLFxuICAgICAgICAgICAgICAgY3JlYXRlTm9kZSAoIGRhdGEudHlwZSwgZGF0YS5pZCwgZGF0YSApIGFzIGFueVxuICAgICAgICAgIClcbiAgICAgfVxuXG4gICAgIGdldEh0bWwgKCk6IChIVE1MRWxlbWVudCB8IFNWR0VsZW1lbnQpIFtdXG4gICAgIHtcbiAgICAgICAgICBpZiAoIHRoaXMuY29udGFpbmVyID09IHVuZGVmaW5lZCApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgdGhpcy5jb250YWluZXIgPSA8ZGl2IGNsYXNzPXsgdGhpcy5kYXRhLnR5cGUgfT48L2Rpdj5cbiAgICAgICAgICAgICAgIHRoaXMub25DcmVhdGUgKClcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gW3RoaXMuY29udGFpbmVyXVxuICAgICB9XG5cbiAgICAgb25DcmVhdGUgKClcbiAgICAge1xuXG4gICAgIH1cblxufVxuXG5cbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi9EYXRhL2luZGV4LnRzXCIgLz5cblxuaW1wb3J0IHsgRmFjdG9yeSwgRGF0YWJhc2UgfSBmcm9tIFwiLi4vRGF0YS9pbmRleC5qc1wiXG5pbXBvcnQgeyBDb21wb25lbnQgfSBmcm9tIFwiLi9CYXNlL0NvbXBvbmVudC9pbmRleC5qc1wiXG5cbmNvbnN0IENPTlRFWFQgPSBcImNvbmNlcHQtdWlcIlxuY29uc3QgZGIgICAgICA9IG5ldyBEYXRhYmFzZSA8JEFueUNvbXBvbmVudHM+ICgpXG5jb25zdCBmYWN0b3J5ID0gbmV3IEZhY3RvcnkgPENvbXBvbmVudCwgJEFueUNvbXBvbmVudHM+ICggZGIgKVxuXG5leHBvcnQgY29uc3QgaW5TdG9jazogdHlwZW9mIGZhY3RvcnkuaW5TdG9jayA9IGZ1bmN0aW9uICgpXG57XG4gICAgIGNvbnN0IGFyZyA9IGFyZ3VtZW50cy5sZW5ndGggPT0gMVxuICAgICAgICAgICAgICAgPyBub3JtYWxpemUgKCBhcmd1bWVudHMgWzBdIClcbiAgICAgICAgICAgICAgIDogbm9ybWFsaXplICggWy4uLiBhcmd1bWVudHNdIClcblxuICAgICBjb25zdCBwYXRoID0gZmFjdG9yeS5nZXRQYXRoICggYXJnIClcblxuICAgICByZXR1cm4gZmFjdG9yeS5faW5TdG9jayAoIHBhdGggKVxufVxuXG5leHBvcnQgY29uc3QgcGljazogdHlwZW9mIGZhY3RvcnkucGljayA9IGZ1bmN0aW9uICggLi4uIHJlc3Q6IGFueSBbXSApXG57XG4gICAgIGNvbnN0IGFyZyA9IGFyZ3VtZW50cy5sZW5ndGggPT0gMVxuICAgICAgICAgICAgICAgPyBub3JtYWxpemUgKCBhcmd1bWVudHMgWzBdIClcbiAgICAgICAgICAgICAgIDogbm9ybWFsaXplICggWy4uLiBhcmd1bWVudHNdIClcblxuICAgICBjb25zdCBwYXRoID0gZmFjdG9yeS5nZXRQYXRoICggYXJnIClcblxuICAgICByZXR1cm4gZmFjdG9yeS5fcGljayAoIHBhdGggKVxufVxuXG5leHBvcnQgY29uc3QgbWFrZTogdHlwZW9mIGZhY3RvcnkubWFrZSA9IGZ1bmN0aW9uICgpXG57XG4gICAgIGNvbnN0IGFyZyA9IGFyZ3VtZW50cy5sZW5ndGggPT0gMVxuICAgICAgICAgICAgICAgPyBub3JtYWxpemUgKCBhcmd1bWVudHMgWzBdIClcbiAgICAgICAgICAgICAgIDogbm9ybWFsaXplICggWy4uLiBhcmd1bWVudHNdIClcblxuICAgICBjb25zdCBwYXRoID0gZmFjdG9yeS5nZXRQYXRoICggYXJnIClcblxuICAgICBpZiAoIGlzTm9kZSAoIGFyZyApIClcbiAgICAgICAgICB2YXIgZGF0YSA9IGFyZ1xuXG4gICAgIHJldHVybiBmYWN0b3J5Ll9tYWtlICggcGF0aCwgZGF0YSApXG59XG5cbmV4cG9ydCBjb25zdCBzZXQ6IHR5cGVvZiBkYi5zZXQgPSBmdW5jdGlvbiAoKVxue1xuICAgICBjb25zdCBhcmcgPSBub3JtYWxpemUgKCBhcmd1bWVudHMgWzBdIClcblxuICAgICBpZiAoIGFyZ3VtZW50cy5sZW5ndGggPT0gMSApXG4gICAgICAgICAgZGIuc2V0ICggYXJnIClcbiAgICAgZWxzZVxuICAgICAgICAgIGRiLnNldCAoIGFyZywgbm9ybWFsaXplICggYXJndW1lbnRzIFsxXSApIClcbn1cblxuZXhwb3J0IGNvbnN0IGRlZmluZTogdHlwZW9mIGZhY3RvcnkuZGVmaW5lID0gZnVuY3Rpb24gKCBjdG9yOiBhbnksIC4uLiByZXN0OiBhbnkgKVxue1xuICAgICBjb25zdCBhcmcgPSByZXN0Lmxlbmd0aCA9PSAxXG4gICAgICAgICAgICAgICA/IG5vcm1hbGl6ZSAoIHJlc3QgWzBdIClcbiAgICAgICAgICAgICAgIDogbm9ybWFsaXplICggWy4uLiByZXN0XSApXG5cbiAgICAgY29uc3QgcGF0aCA9IGZhY3RvcnkuZ2V0UGF0aCAoIGFyZyApXG5cbiAgICAgZmFjdG9yeS5fZGVmaW5lICggY3RvciwgcGF0aCApXG59XG5cblxuZnVuY3Rpb24gaXNOb2RlICggb2JsOiBhbnkgKVxue1xuICAgICByZXR1cm4gdHlwZW9mIG9ibCA9PSBcIm9iamVjdFwiICYmICEgQXJyYXkuaXNBcnJheSAob2JsKVxufVxuXG5mdW5jdGlvbiBub3JtYWxpemUgKCBhcmc6IGFueSApXG57XG4gICAgIGlmICggQXJyYXkuaXNBcnJheSAoYXJnKSApXG4gICAgIHtcbiAgICAgICAgICBpZiAoIGFyZyBbMF0gIT09IENPTlRFWFQgKVxuICAgICAgICAgICAgICAgYXJnLnVuc2hpZnQgKCBDT05URVhUIClcbiAgICAgfVxuICAgICBlbHNlIGlmICggdHlwZW9mIGFyZyA9PSBcIm9iamVjdFwiIClcbiAgICAge1xuICAgICAgICAgIGlmICggXCJjb250ZXh0XCIgaW4gYXJnIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBpZiAoIGFyZy5jb250ZXh0ICE9PSBDT05URVhUIClcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgXCJCYWQgY29udGV4dCB2YWx1ZVwiXG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICAoYXJnIGFzIGFueSkuY29udGV4dCA9IENPTlRFWFRcbiAgICAgICAgICB9XG4gICAgIH1cblxuICAgICByZXR1cm4gYXJnXG59XG4iLCJcbmltcG9ydCB7IHBpY2ssIGluU3RvY2ssIG1ha2UgfSBmcm9tIFwiLi4vLi4vZGIuanNcIlxuaW1wb3J0IHsgQ29tcG9uZW50IH0gZnJvbSBcIi4uL0NvbXBvbmVudC9pbmRleC5qc1wiXG5cbmRlY2xhcmUgZ2xvYmFsXG57XG4gICAgIGludGVyZmFjZSAkQ29udGFpbmVyIGV4dGVuZHMgJENvbXBvbmVudFxuICAgICB7XG4gICAgICAgICAgZGlyZWN0aW9uPzogXCJsclwiIHwgXCJybFwiIHwgXCJ0YlwiIHwgXCJidFwiXG4gICAgICAgICAgY2hpbGRyZW4/OiAkQW55Q29tcG9uZW50cyBbXVxuICAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBDb250YWluZXIgPCQgZXh0ZW5kcyAkQ29udGFpbmVyID0gJENvbnRhaW5lcj4gZXh0ZW5kcyBDb21wb25lbnQgPCQ+XG57XG4gICAgIGNoaWxkcmVuID0ge30gYXMgUmVjb3JkIDxzdHJpbmcsIENvbXBvbmVudD5cbiAgICAgc2xvdDogSlNYLkVsZW1lbnRcblxuICAgICByZWFkb25seSBpc192ZXJ0aWNhbDogYm9vbGVhblxuXG4gICAgIGRlZmF1bHREYXRhICgpIDogJENvbnRhaW5lclxuICAgICB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgIGNvbnRleHQ6IFwiY29uY2VwdC11aVwiLFxuICAgICAgICAgICAgICAgdHlwZSAgICAgOiBcImNvbXBvbmVudFwiLFxuICAgICAgICAgICAgICAgaWQgICAgICAgOiB1bmRlZmluZWQsXG4gICAgICAgICAgICAgICBkaXJlY3Rpb246IFwibHJcIixcbiAgICAgICAgICB9XG4gICAgIH1cblxuICAgICBjb25zdHJ1Y3RvciAoIGRhdGE6ICQgKVxuICAgICB7XG4gICAgICAgICAgc3VwZXIgKCBkYXRhIClcblxuICAgICAgICAgIGRhdGEgPSB0aGlzLmRhdGFcbiAgICAgICAgICBjb25zdCBjaGlsZHJlbiA9IGRhdGEuY2hpbGRyZW5cblxuICAgICAgICAgIGlmICggY2hpbGRyZW4gKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGZvciAoIGNvbnN0IGNoaWxkIG9mIGNoaWxkcmVuIClcbiAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCAhIGluU3RvY2sgKCBjaGlsZCApIClcbiAgICAgICAgICAgICAgICAgICAgICAgICBtYWtlICggY2hpbGQgKVxuICAgICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHRoaXMuaXNfdmVydGljYWwgPSBkYXRhLmRpcmVjdGlvbiA9PSBcImJ0XCIgfHwgZGF0YS5kaXJlY3Rpb24gPT0gXCJ0YlwiXG4gICAgIH1cblxuICAgICAvKiogQG92ZXJyaWRlICovXG4gICAgIGdldEh0bWwgKClcbiAgICAge1xuICAgICAgICAgIGlmICggdGhpcy5jb250YWluZXIgIT0gdW5kZWZpbmVkIClcbiAgICAgICAgICAgICAgIHJldHVybiBbdGhpcy5jb250YWluZXJdXG5cbiAgICAgICAgICBjb25zdCBlbGVtZW50cyAgPSBzdXBlci5nZXRIdG1sICgpXG4gICAgICAgICAgY29uc3QgY29udGFpbmVyID0gdGhpcy5jb250YWluZXJcbiAgICAgICAgICBjb25zdCBkYXRhICAgICAgPSB0aGlzLmRhdGFcbiAgICAgICAgICBjb25zdCBjaGlsZHJlbiAgPSB0aGlzLmNoaWxkcmVuXG4gICAgICAgICAgY29uc3QgdW5kID0gdW5kZWZpbmVkXG5cbiAgICAgICAgICBpZiAoIHRoaXMuaXNfdmVydGljYWwgKVxuICAgICAgICAgICAgICAgY29udGFpbmVyLmNsYXNzTGlzdC5hZGQgKCBcInZlcnRpY2FsXCIgKVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgIGNvbnRhaW5lci5jbGFzc0xpc3QucmVtb3ZlICggXCJ2ZXJ0aWNhbFwiIClcblxuICAgICAgICAgIGlmICggdGhpcy5zbG90ID09IHVuZGVmaW5lZCApXG4gICAgICAgICAgICAgICB0aGlzLnNsb3QgPSBjb250YWluZXJcblxuICAgICAgICAgIGNvbnN0IHNsb3QgPSB0aGlzLnNsb3RcblxuICAgICAgICAgIGlmICggZGF0YS5jaGlsZHJlbiApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgY29uc3QgbmV3X2NoaWxkcmVuID0gW10gYXMgQ29tcG9uZW50IFtdXG5cbiAgICAgICAgICAgICAgIGZvciAoIGNvbnN0IGNoaWxkIG9mIGRhdGEuY2hpbGRyZW4gKVxuICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBvID0gcGljayAoIGNoaWxkIClcbiAgICAgICAgICAgICAgICAgICAgc2xvdC5hcHBlbmQgKCAuLi4gby5nZXRIdG1sICgpIClcbiAgICAgICAgICAgICAgICAgICAgY2hpbGRyZW4gW28uZGF0YS5pZF0gPSBvXG4gICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgIHRoaXMub25DaGlsZHJlbkFkZGVkICggbmV3X2NoaWxkcmVuIClcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gZWxlbWVudHNcbiAgICAgfVxuXG4gICAgIG9uQ2hpbGRyZW5BZGRlZCAoIGNvbXBvbmVudHM6IENvbXBvbmVudCBbXSApXG4gICAgIHtcblxuICAgICB9XG5cbiAgICAgYXBwZW5kICggLi4uIGVsZW1lbnRzOiAoc3RyaW5nIHwgRWxlbWVudCB8IENvbXBvbmVudCB8ICRBbnlDb21wb25lbnRzKSBbXSApXG4gICAgIHtcblxuICAgICAgICAgIGlmICggdGhpcy5jb250YWluZXIgPT0gdW5kZWZpbmVkIClcbiAgICAgICAgICAgICAgIHRoaXMuZ2V0SHRtbCAoKVxuXG4gICAgICAgICAgY29uc3Qgc2xvdCAgICAgID0gdGhpcy5zbG90XG4gICAgICAgICAgY29uc3QgY2hpbGRyZW4gID0gdGhpcy5jaGlsZHJlblxuICAgICAgICAgIGNvbnN0IG5ld19jaGlsZCA9IFtdIGFzIENvbXBvbmVudCBbXVxuXG4gICAgICAgICAgZm9yICggdmFyIGUgb2YgZWxlbWVudHMgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGlmICggdHlwZW9mIGUgPT0gXCJzdHJpbmdcIiApXG4gICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGUgPSBuZXcgUGhhbnRvbSAoe1xuICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRleHQ6IFwiY29uY2VwdC11aVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGUgICA6IFwicGhhbnRvbVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgIGlkICA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50OiBlXG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICBlbHNlIGlmICggZSBpbnN0YW5jZW9mIEVsZW1lbnQgKVxuICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBVSV9DT01QT05FTlQgPSBTeW1ib2wuZm9yICggXCJVSV9DT01QT05FTlRcIiApXG5cbiAgICAgICAgICAgICAgICAgICAgZSA9IGUgW1VJX0NPTVBPTkVOVF0gIT0gdW5kZWZpbmVkXG4gICAgICAgICAgICAgICAgICAgICAgICAgPyBlIFtVSV9DT01QT05FTlRdXG4gICAgICAgICAgICAgICAgICAgICAgICAgOiBuZXcgUGhhbnRvbSAoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGV4dDogXCJjb25jZXB0LXVpXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlICAgOiBcInBoYW50b21cIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkICA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnQ6IGUub3V0ZXJIVE1MXG4gICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgIGVsc2UgaWYgKCAhKGUgaW5zdGFuY2VvZiBDb21wb25lbnQpIClcbiAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgZSA9IGluU3RvY2sgKCBlICkgPyBwaWNrICggZSApIDogbWFrZSAoIGUgKVxuICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBgVW5hYmxlIHRvIGFkZCBhIGNoaWxkIG9mIHR5cGUgJHsgdHlwZW9mIGUgfWBcbiAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgY2hpbGRyZW4gWyhlIGFzIENvbXBvbmVudCkuZGF0YS5pZF0gPSBlIGFzIENvbXBvbmVudFxuICAgICAgICAgICAgICAgc2xvdC5hcHBlbmQgKCAuLi4gKGUgYXMgQ29tcG9uZW50KS5nZXRIdG1sICgpIClcbiAgICAgICAgICAgICAgIG5ld19jaGlsZC5wdXNoICggZSBhcyBDb21wb25lbnQgKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICggbmV3X2NoaWxkLmxlbmd0aCA+IDAgKVxuICAgICAgICAgICAgICAgdGhpcy5vbkNoaWxkcmVuQWRkZWQgKCBuZXdfY2hpbGQgKVxuICAgICB9XG5cbiAgICAgY2xlYXIgKClcbiAgICAge1xuICAgICAgICAgIHRoaXMuY2hpbGRyZW4gPSB7fVxuXG4gICAgICAgICAgaWYgKCB0aGlzLmNvbnRhaW5lciApXG4gICAgICAgICAgICAgICB0aGlzLmNvbnRhaW5lci5pbm5lckhUTUwgPSBcIlwiXG4gICAgIH1cblxufVxuXG5cbmludGVyZmFjZSAkUGhhbnRvbSBleHRlbmRzICRDb21wb25lbnRcbntcbiAgICAgdHlwZTogXCJwaGFudG9tXCJcbiAgICAgY29udGVudDogc3RyaW5nXG59XG5cbmNsYXNzIFBoYW50b20gZXh0ZW5kcyBDb21wb25lbnQgPCRQaGFudG9tPlxue1xuICAgICBjb250YWluZXI6IEhUTUxFbGVtZW50IHwgU1ZHRWxlbWVudFxuXG4gICAgIC8qKiBAb3ZlcnJpZGUgKi9cbiAgICAgZ2V0SHRtbCAoKVxuICAgICB7XG4gICAgICAgICAgaWYgKCB0aGlzLmNvbnRhaW5lciA9PSB1bmRlZmluZWQgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHRoaXMuY29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCAoIFwiZGl2XCIgKVxuICAgICAgICAgICAgICAgdGhpcy5jb250YWluZXIuaW5uZXJIVE1MID0gdGhpcy5kYXRhLmNvbnRlbnRcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gdGhpcy5jb250YWluZXIuY2hpbGROb2RlcyBhcyBhbnkgYXMgSFRNTEVsZW1lbnQgW11cbiAgICAgfVxufVxuIiwiXG5pbXBvcnQgeyBDb21wb25lbnQgfSBmcm9tIFwiLi4vLi4vQmFzZS9Db21wb25lbnQvaW5kZXguanNcIlxuaW1wb3J0IHsgeG5vZGUgfSAgICAgZnJvbSBcIi4uLy4uL0Jhc2UveG5vZGUuanNcIlxuLy9pbXBvcnQgeyBDb21tYW5kcyB9ICBmcm9tIFwiLi4vLi4vQmFzZS9jb21tYW5kLmpzXCJcbmltcG9ydCB7IGRlZmluZSB9ICAgIGZyb20gXCIuLi8uLi9kYi5qc1wiXG5pbXBvcnQgeyBjb21tYW5kIH0gZnJvbSBcIi4uLy4uL2NvbW1hbmQuanNcIlxuXG5leHBvcnQgY2xhc3MgQnV0dG9uIGV4dGVuZHMgQ29tcG9uZW50IDwkQnV0dG9uPlxue1xuICAgICAvKiogQG92ZXJyaWRlICovXG4gICAgIGdldEh0bWwgKClcbiAgICAge1xuICAgICAgICAgIGlmICggdGhpcy5jb250YWluZXIgPT0gdW5kZWZpbmVkIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBjb25zdCBkYXRhID0gdGhpcy5kYXRhXG5cbiAgICAgICAgICAgICAgIGNvbnN0IG5vZGUgPSA8ZGl2IGNsYXNzPVwiYnV0dG9uXCI+XG4gICAgICAgICAgICAgICAgICAgIHsgZGF0YS5pY29uID8gPHNwYW4gY2xhc3M9XCJpY29uXCI+eyBkYXRhLmljb24gfTwvc3Bhbj4gOiBudWxsIH1cbiAgICAgICAgICAgICAgICAgICAgeyBkYXRhLnRleHQgPyA8c3BhbiBjbGFzcz1cInRleHRcIj57IGRhdGEudGV4dCB9PC9zcGFuPiA6IG51bGwgfVxuICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgIGlmICggdGhpcy5kYXRhLmNhbGxiYWNrICE9IHVuZGVmaW5lZCB8fCB0aGlzLmRhdGEuY29tbWFuZCAhPSB1bmRlZmluZWQgKVxuICAgICAgICAgICAgICAgICAgICBub2RlLmFkZEV2ZW50TGlzdGVuZXIgKCBcImNsaWNrXCIsIHRoaXMub25Ub3VjaC5iaW5kICh0aGlzKSApXG5cbiAgICAgICAgICAgICAgIHRoaXMuY29udGFpbmVyID0gbm9kZVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiBbIHRoaXMuY29udGFpbmVyIF0gYXMgSFRNTEVsZW1lbnQgW11cbiAgICAgfVxuXG4gICAgIG9uVG91Y2ggKClcbiAgICAge1xuICAgICAgICAgIGlmICggdGhpcy5kYXRhLmNhbGxiYWNrICYmIHRoaXMuZGF0YS5jYWxsYmFjayAoKSAhPT0gdHJ1ZSApXG4gICAgICAgICAgICAgICByZXR1cm5cblxuICAgICAgICAgIGlmICggdGhpcy5kYXRhLmNvbW1hbmQgKVxuICAgICAgICAgICAgICAgLy9Db21tYW5kcy5jdXJyZW50LnJ1biAoIHRoaXMuZGF0YS5jb21tYW5kIClcbiAgICAgICAgICAgICAgIGNvbW1hbmQgKCB0aGlzLmRhdGEuY29tbWFuZCApLnJ1biAoKVxuICAgICB9XG5cbiAgICAgcHJvdGVjdGVkIG9uSG92ZXIgKClcbiAgICAge1xuXG4gICAgIH1cbn1cblxuXG5kZWZpbmUgKCBCdXR0b24sIFtcImJ1dHRvblwiXSApXG4iLCJcblxuaW1wb3J0IHsgc2V0IH0gICAgICBmcm9tIFwiLi4vLi4vZGIuanNcIlxuLy9pbXBvcnQgeyBDb21tYW5kcyB9IGZyb20gXCIuLi8uLi9CYXNlL2NvbW1hbmQuanNcIlxuaW1wb3J0IHsgeG5vZGUgfSAgICBmcm9tIFwiLi4vLi4vQmFzZS94bm9kZS5qc1wiXG5pbXBvcnQgeyBjb21tYW5kIH0gZnJvbSBcIi4uLy4uL2NvbW1hbmQuanNcIlxuXG5kZWNsYXJlIGdsb2JhbFxue1xuICAgICBleHBvcnQgaW50ZXJmYWNlICRCdXR0b24gZXh0ZW5kcyAkQ29tcG9uZW50XG4gICAgIHtcbiAgICAgICAgICB0eXBlICAgICAgIDogXCJidXR0b25cIlxuICAgICAgICAgIGljb24gICAgICAgOiBzdHJpbmdcbiAgICAgICAgICB0ZXh0PyAgICAgIDogc3RyaW5nXG4gICAgICAgICAgdG9vbHRpcD8gICA6IEpTWC5FbGVtZW50XG4gICAgICAgICAgZm9udEZhbWlseT86IHN0cmluZyxcbiAgICAgICAgICBjYWxsYmFjaz8gIDogKCkgPT4gYm9vbGVhbiB8IHZvaWQsXG4gICAgICAgICAgY29tbWFuZD8gICA6IHN0cmluZyxcbiAgICAgICAgICBoYW5kbGVPbj8gIDogXCJ0b2dnbGVcIiB8IFwiZHJhZ1wiIHwgXCIqXCJcbiAgICAgfVxufVxuXG5jb25zdCBfQnV0dG9uID0gKCBkYXRhOiAkQnV0dG9uICkgPT5cbntcbiAgICAgY29uc3Qgb25Ub3VjaCA9ICgpID0+XG4gICAgIHtcbiAgICAgICAgICBpZiAoIGRhdGEuY2FsbGJhY2sgJiYgZGF0YS5jYWxsYmFjayAoKSAhPT0gdHJ1ZSApXG4gICAgICAgICAgICAgICByZXR1cm5cblxuICAgICAgICAgIGlmICggZGF0YS5jb21tYW5kIClcbiAgICAgICAgICAgICAgIC8vQ29tbWFuZHMuY3VycmVudC5ydW4gKCBkYXRhLmNvbW1hbmQgKVxuICAgICAgICAgICAgICAgY29tbWFuZCAoIGRhdGEuY29tbWFuZCApXG4gICAgIH1cblxuICAgICBjb25zdCBub2RlID1cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwiYnV0dG9uXCIgb25DbGljaz17IGRhdGEuY2FsbGJhY2sgfHwgZGF0YS5jb21tYW5kID8gb25Ub3VjaCA6IG51bGwgfT5cbiAgICAgICAgICAgICAgIHsgZGF0YS5pY29uID8gPHNwYW4gY2xhc3M9XCJpY29uXCI+eyBkYXRhLmljb24gfTwvc3Bhbj4gOiBudWxsIH1cbiAgICAgICAgICAgICAgIHsgZGF0YS50ZXh0ID8gPHNwYW4gY2xhc3M9XCJ0ZXh0XCI+eyBkYXRhLnRleHQgfTwvc3Bhbj4gOiBudWxsIH1cbiAgICAgICAgICA8L2Rpdj5cblxuICAgICByZXR1cm4gbm9kZVxufVxuXG5cbmV4cG9ydCB7IEJ1dHRvbiB9IGZyb20gXCIuL2h0bWwuanNcIlxuXG5leHBvcnQgY29uc3QgJGRlZmF1bHQgPSB7XG4gICAgIHR5cGU6IFwiYnV0dG9uXCIgYXMgXCJidXR0b25cIixcbiAgICAgaWQgIDogdW5kZWZpbmVkLFxuICAgICBpY29uOiB1bmRlZmluZWQsXG59XG5cbnNldCA8JEJ1dHRvbj4gKCBbIFwiYnV0dG9uXCIgXSwgJGRlZmF1bHQgKVxuIiwiaW1wb3J0IHsgQ29tcG9uZW50IH0gZnJvbSBcIi4uLy4uL0Jhc2UvQ29tcG9uZW50L2luZGV4LmpzXCJcbmltcG9ydCB7IENvbnRhaW5lciB9IGZyb20gXCIuLi8uLi9CYXNlL0NvbnRhaW5lci9pbmRleC5qc1wiXG5pbXBvcnQgeyBzd2lwZWFibGUsIFN3aXBlYWJsZUVsZW1lbnQgfSBmcm9tIFwiLi4vLi4vQmFzZS9zd2lwZWFibGUuanNcIlxuaW1wb3J0IHsgZGVmaW5lIH0gZnJvbSBcIi4uLy4uL2RiLmpzXCJcblxuZGVjbGFyZSBnbG9iYWxcbntcbiAgICAgZXhwb3J0IGludGVyZmFjZSAkU2xpZGVzaG93IGV4dGVuZHMgJENvbnRhaW5lclxuICAgICB7XG4gICAgICAgICAgdHlwZSAgICAgICAgOiBcInNsaWRlc2hvd1wiXG4gICAgICAgICAgY2hpbGRyZW4gICAgOiAkQW55Q29tcG9uZW50cyBbXVxuICAgICAgICAgIGlzU3dpcGVhYmxlPzogYm9vbGVhblxuICAgICB9XG5cbiAgICAgZXhwb3J0IGludGVyZmFjZSAkU2xpZGUgZXh0ZW5kcyAkQ29udGFpbmVyXG4gICAgIHtcbiAgICAgICAgICB0eXBlOiBcInNsaWRlXCJcbiAgICAgfVxufVxuXG4vLyAgIGBgYFxuLy8gICAuc2xpZGVzaG93XG4vLyAgICAgICAgWy4uLl1cbi8vICAgYGBgXG5leHBvcnQgY2xhc3MgU2xpZGVzaG93IGV4dGVuZHMgQ29udGFpbmVyIDwkU2xpZGVzaG93Plxue1xuICAgICBjaGlsZHJlbiA9IHt9IGFzIFJlY29yZCA8c3RyaW5nLCBDb250YWluZXI+XG4gICAgIGN1cnJlbnQ6IENvbXBvbmVudFxuICAgICBwcml2YXRlIHN3aXBlYWJsZTogU3dpcGVhYmxlRWxlbWVudFxuXG4gICAgIC8qKiBAb3ZlcnJpZGUgKi9cbiAgICAgZ2V0SHRtbCAoKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgZWxlbWVudHMgPSBzdXBlci5nZXRIdG1sICgpXG5cbiAgICAgICAgICBjb25zdCBkYXRhID0gdGhpcy5kYXRhXG4gICAgICAgICAgY29uc3QgY29udGFpbmVyID0gdGhpcy5jb250YWluZXJcblxuICAgICAgICAgIGlmICggZGF0YS5pc1N3aXBlYWJsZSApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgdGhpcy5zd2lwZWFibGUgPSBzd2lwZWFibGUgKCBjb250YWluZXIsIHtcbiAgICAgICAgICAgICAgICAgICAgaGFuZGxlcyAgIDogWyBjb250YWluZXIgXSxcbiAgICAgICAgICAgICAgICAgICAgbWluVmFsdWUgIDogLTAsXG4gICAgICAgICAgICAgICAgICAgIG1heFZhbHVlICA6IDAsXG4gICAgICAgICAgICAgICAgICAgIHBvcnBlcnR5ICA6IGRhdGEuZGlyZWN0aW9uID09IFwiYnRcIiB8fCBkYXRhLmRpcmVjdGlvbiA9PSBcInRiXCIgPyBcInRvcFwiOiBcImxlZnRcIixcbiAgICAgICAgICAgICAgICAgICAgdW5pdHMgICAgIDogXCJweFwiLFxuICAgICAgICAgICAgICAgICAgICBtb3VzZVdoZWVsOiB0cnVlLFxuICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgIHRoaXMuc3dpcGVhYmxlLmFjdGl2YXRlICgpXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIGVsZW1lbnRzXG4gICAgIH1cblxuICAgICBzaG93ICggaWQ6IHN0cmluZywgLi4uIGNvbnRlbnQ6IChzdHJpbmcgfCBFbGVtZW50IHwgQ29tcG9uZW50IHwgJEFueUNvbXBvbmVudHMgKSBbXSApXG4gICAgIHtcbiAgICAgICAgICBjb25zdCBjaGlsZCA9IHRoaXMuY2hpbGRyZW4gW2lkXVxuXG4gICAgICAgICAgaWYgKCBjaGlsZCA9PSB1bmRlZmluZWQgKVxuICAgICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgICBpZiAoIHRoaXMuY3VycmVudCApXG4gICAgICAgICAgICAgICB0aGlzLmN1cnJlbnQgPSBjaGlsZFxuXG4gICAgICAgICAgaWYgKCBjb250ZW50IClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBjaGlsZC5jbGVhciAoKVxuICAgICAgICAgICAgICAgY29uc29sZS5sb2cgKCBjb250ZW50IClcbiAgICAgICAgICAgICAgIGNoaWxkLmFwcGVuZCAoIC4uLiBjb250ZW50IClcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjaGlsZC5jb250YWluZXIuc3R5bGUuZGlzcGxheSA9IFwiYmxvY2tcIlxuICAgICB9XG59XG5cbmRlZmluZSAoIFNsaWRlc2hvdywgW1wic2xpZGVzaG93XCJdIClcbmRlZmluZSAoIENvbnRhaW5lciwgW1wic2xpZGVcIl0gICAgIClcbiIsIlxuaW1wb3J0IHsgeG5vZGUgfSBmcm9tIFwiLi4vLi4vQmFzZS94bm9kZS5qc1wiXG5pbXBvcnQgeyBVbml0IH0gZnJvbSBcIi4uLy4uLy4uL0xpYi9jc3MvdW5pdC5qc1wiXG5pbXBvcnQgeyBDb250YWluZXIgfSBmcm9tIFwiLi4vLi4vQmFzZS9Db250YWluZXIvaW5kZXguanNcIlxuaW1wb3J0IHsgU3dpcGVhYmxlRWxlbWVudCwgc3dpcGVhYmxlIH0gZnJvbSBcIi4uLy4uL0Jhc2Uvc3dpcGVhYmxlLmpzXCJcbmltcG9ydCB7IEV4cGVuZGFibGVFbGVtZW50LCBleHBhbmRhYmxlIH0gZnJvbSBcIi4uLy4uL0Jhc2UvZXhwZW5kYWJsZS5qc1wiXG5pbXBvcnQgeyBjc3NGbG9hdCB9IGZyb20gXCIuLi8uLi9CYXNlL2RvbS5qc1wiXG5pbXBvcnQgeyBDb21wb25lbnQgfSBmcm9tIFwiLi4vLi4vQmFzZS9Db21wb25lbnQvaW5kZXguanNcIlxuXG5kZWNsYXJlIGdsb2JhbFxue1xuICAgICBpbnRlcmZhY2UgJExpc3RWaWV3IGV4dGVuZHMgJENvbnRhaW5lclxuICAgICB7XG4gICAgICAgICAgdHlwZTogXCJsaXN0LXZpZXdcIlxuICAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBMaXN0VmlldyA8JCBleHRlbmRzICRFeHRlbmRzIDwkTGlzdFZpZXc+PiBleHRlbmRzIENvbnRhaW5lciA8JD5cbntcbiAgICAgc3dpcGVhYmxlOiBFeHBlbmRhYmxlRWxlbWVudFxuXG4gICAgIC8qKiBAb3ZlcnJpZGUgKi9cbiAgICAgZ2V0SHRtbCAoKVxuICAgICB7XG4gICAgICAgICAgaWYgKCB0aGlzLmNvbnRhaW5lciAhPSB1bmRlZmluZWQgKVxuICAgICAgICAgICAgICAgcmV0dXJuIFt0aGlzLmNvbnRhaW5lcl1cblxuICAgICAgICAgIGNvbnN0IHNsb3QgPSB0aGlzLnNsb3QgPSA8ZGl2IGNsYXNzPVwibGlzdC12aWV3LXNsaWRlXCI+PC9kaXY+XG5cbiAgICAgICAgICBzdXBlci5nZXRIdG1sICgpXG5cbiAgICAgICAgICBjb25zdCBjb250YWluZXIgPSB0aGlzLmNvbnRhaW5lclxuXG4gICAgICAgICAgY29udGFpbmVyLmFwcGVuZCAoIHNsb3QgKVxuICAgICAgICAgIGNvbnRhaW5lci5jbGFzc0xpc3QuYWRkICggXCJsaXN0LXZpZXdcIiApXG5cbiAgICAgICAgICB0aGlzLnN3aXBlYWJsZSA9IGV4cGFuZGFibGUgKCBzbG90LCB7XG4gICAgICAgICAgICAgICBoYW5kbGVzICAgOiBbIGNvbnRhaW5lciBdLFxuICAgICAgICAgICAgICAgbWluU2l6ZSAgOiAwLFxuICAgICAgICAgICAgICAgbWF4U2l6ZSAgOiAwLFxuICAgICAgICAgICAgICAgcHJvcGVydHkgIDogdGhpcy5pc192ZXJ0aWNhbCA/IFwidG9wXCI6IFwibGVmdFwiLFxuICAgICAgICAgICAgICAgZGlyZWN0aW9uIDogdGhpcy5kYXRhLmRpcmVjdGlvbixcbiAgICAgICAgICAgICAgIHVuaXQgICAgIDogXCJweFwiLFxuICAgICAgICAgICAgICAgLy9tb3VzZVdoZWVsOiB0cnVlLFxuICAgICAgICAgIH0pXG4gICAgICAgICAgdGhpcy5zd2lwZWFibGUuYWN0aXZhdGUgKClcblxuICAgICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyICggXCJET01Db250ZW50TG9hZGVkXCIsICgpID0+XG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgdGhpcy5zd2lwZWFibGUudXBkYXRlQ29uZmlnICh7XG4gICAgICAgICAgICAgICAgICAgIG1pblNpemU6IC10aGlzLnNsaWRlU2l6ZSAoKSxcbiAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgfSlcblxuICAgICAgICAgIHJldHVybiBbdGhpcy5jb250YWluZXJdXG4gICAgIH1cblxuICAgICBvbkNoaWxkcmVuQWRkZWQgKCBlbGVtZW50czogQ29tcG9uZW50IFtdIClcbiAgICAge1xuICAgICAgICAgIHRoaXMuc3dpcGVhYmxlLnVwZGF0ZUNvbmZpZyAoe1xuICAgICAgICAgICAgICAgbWluU2l6ZSAgOiAtdGhpcy5zbGlkZVNpemUgKCksXG4gICAgICAgICAgICAgICBwcm9wZXJ0eSA6IHRoaXMuaXNfdmVydGljYWwgPyBcInRvcFwiOiBcImxlZnRcIixcbiAgICAgICAgICAgICAgIGRpcmVjdGlvbjogdGhpcy5kYXRhLmRpcmVjdGlvbixcbiAgICAgICAgICB9KVxuICAgICB9XG5cbiAgICAgcHJpdmF0ZSBzbGlkZVNpemUgKClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHsgc2xvdCB9ID0gdGhpc1xuXG4gICAgICAgICAgcmV0dXJuIGNzc0Zsb2F0ICggc2xvdCwgdGhpcy5pc192ZXJ0aWNhbCA/IFwiaGVpZ2h0XCIgOiBcIndpZHRoXCIgKVxuICAgICB9XG5cbiAgICAgc3dpcGUgKCBvZmZzZXQ6IHN0cmluZ3xudW1iZXIsIHVuaXQ/OiBcInB4XCIgfCBcIiVcIiApXG4gICAgIHtcbiAgICAgICAgIC8vIGlmICggdHlwZW9mIG9mZnNldCA9PSBcInN0cmluZ1wiIClcbiAgICAgICAgIC8vICAgICAgdGhpcy5zd2lwZWFibGUuc3dpcGUgKCBvZmZzZXQgKVxuICAgICAgICAgLy8gZWxzZVxuICAgICAgICAgLy8gICAgICB0aGlzLnN3aXBlYWJsZS5zd2lwZSAoIG9mZnNldCwgdW5pdCApXG4gICAgIH1cbn1cbiIsIlxuaW1wb3J0IHsgTGlzdFZpZXcgfSBmcm9tIFwiLi4vTGlzdC9pbmRleC5qc1wiXG5pbXBvcnQgeyBkZWZpbmUgfSBmcm9tIFwiLi4vLi4vZGIuanNcIlxuXG50eXBlIERpcmVjdGlvbiA9IFwibHJcIiB8IFwicmxcIiB8IFwidGJcIiB8IFwiYnRcIlxuXG50eXBlIFVuaXRzID0gXCJweFwiIHwgXCIlXCJcblxuZGVjbGFyZSBnbG9iYWxcbntcbiAgICAgZXhwb3J0IGludGVyZmFjZSAkVG9vbGJhciBleHRlbmRzICRFeHRlbmRzIDwkTGlzdFZpZXc+IC8vICRDb250YWluZXJcbiAgICAge1xuICAgICAgICAgIHR5cGUgICAgIDogXCJ0b29sYmFyXCJcbiAgICAgICAgICB0aXRsZSAgICA6IHN0cmluZ1xuICAgICAgICAgIGJ1dHRvbnMgIDogJEJ1dHRvbiBbXVxuICAgICB9XG59XG5cbmNvbnN0IHRvRmxleERpcmVjdGlvbiA9IHtcbiAgICAgbHI6IFwicm93XCIgICAgICAgICAgICBhcyBcInJvd1wiLFxuICAgICBybDogXCJyb3ctcmV2ZXJzZVwiICAgIGFzIFwicm93LXJldmVyc2VcIixcbiAgICAgdGI6IFwiY29sdW1uXCIgICAgICAgICBhcyBcImNvbHVtblwiLFxuICAgICBidDogXCJjb2x1bW4tcmV2ZXJzZVwiIGFzIFwiY29sdW1uLXJldmVyc2VcIixcbn1cblxuY29uc3QgdG9SZXZlcnNlID0ge1xuICAgICBscjogXCJybFwiIGFzIFwicmxcIixcbiAgICAgcmw6IFwibHJcIiBhcyBcImxyXCIsXG4gICAgIHRiOiBcImJ0XCIgYXMgXCJidFwiLFxuICAgICBidDogXCJ0YlwiIGFzIFwidGJcIixcbn1cblxuLyoqXG4gKiAgIGBgYHB1Z1xuICogICAudG9vbGJhclxuICogICAgICAgIC50b29sYmFyLWJhY2tncm91bmdcbiAqICAgICAgICAudG9vbGJhci1zbGlkZVxuICogICAgICAgICAgICAgWy4uLl1cbiAqICAgYGBgXG4gKi9cbmV4cG9ydCBjbGFzcyBUb29sYmFyIGV4dGVuZHMgTGlzdFZpZXcgPCRUb29sYmFyPlxue1xuICAgICB0YWJzICAgICAgOiBKU1guRWxlbWVudCBbXVxuICAgICBiYWNrZ3JvdW5kOiBKU1guRWxlbWVudFxuXG4gICAgIGRlZmF1bHRDb25maWcgKCk6ICRUb29sYmFyXG4gICAgIHtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgLi4uIHN1cGVyLmRlZmF1bHREYXRhICgpLFxuICAgICAgICAgICAgICAgdHlwZSAgICAgOiBcInRvb2xiYXJcIixcbiAgICAgICAgICAgICAgIHRpdGxlICAgIDogXCJUaXRsZSAuLi5cIixcbiAgICAgICAgICAgICAgIGRpcmVjdGlvbjogXCJsclwiLFxuICAgICAgICAgICAgICAgLy9yZXZlcnNlICA6IGZhbHNlLFxuICAgICAgICAgICAgICAgYnV0dG9uczogW11cbiAgICAgICAgICB9XG4gICAgIH1cblxuICAgICAvKiogQG92ZXJyaWRlICovXG4gICAgIGdldEh0bWwgKClcbiAgICAge1xuICAgICAgICAgIGlmICggdGhpcy5jb250YWluZXIgIT0gdW5kZWZpbmVkIClcbiAgICAgICAgICAgICAgIHJldHVybiBbdGhpcy5jb250YWluZXJdXG5cbiAgICAgICAgICBzdXBlci5nZXRIdG1sICgpXG5cbiAgICAgICAgICBpZiAoIHRoaXMuZGF0YS5idXR0b25zIClcbiAgICAgICAgICAgICAgIHRoaXMuYXBwZW5kICggLi4uIHRoaXMuZGF0YS5idXR0b25zIClcblxuICAgICAgICAgIHJldHVybiBbdGhpcy5jb250YWluZXJdXG4gICAgIH1cbn1cblxuZGVmaW5lICggVG9vbGJhciwgW1widG9vbGJhclwiXSApXG4iLCJcbmltcG9ydCB7IGRyYWdnYWJsZSwgRHJhZ0V2ZW50IH0gZnJvbSBcIi4vZHJhZ2dhYmxlLmpzXCJcblxudHlwZSBEaXJlY3Rpb24gPSBcImxyXCIgfCBcInJsXCIgfCBcImJ0XCIgfCBcInRiXCJcbnR5cGUgRE9NRWxlbWVudCA9IEhUTUxFbGVtZW50IHwgU1ZHRWxlbWVudFxuXG5leHBvcnQgaW50ZXJmYWNlIFNjb2xsYWJsZUNvbmZpZ1xue1xuICAgICBoYW5kbGVzOiBET01FbGVtZW50IFtdXG4gICAgIGRpcmVjdGlvbjogRGlyZWN0aW9uXG59XG5cbmZ1bmN0aW9uIGRlZmF1bHRDb25maWcgKCk6IFNjb2xsYWJsZUNvbmZpZ1xue1xuICAgICByZXR1cm4ge1xuICAgICAgICAgIGhhbmRsZXMgIDogW10sXG4gICAgICAgICAgZGlyZWN0aW9uOiBcInRiXCJcbiAgICAgfVxufVxuXG5mdW5jdGlvbiBzY3JvbGxhYmxlTmF0aXZlICggb3B0aW9uczogU2NvbGxhYmxlQ29uZmlnIClcbntcbiAgICAgZGVzYWN0aXZhdGUgKClcblxuICAgICByZXR1cm4ge1xuICAgICAgICAgIGFjdGl2YXRlLFxuICAgICAgICAgIGRlc2FjdGl2YXRlLFxuICAgICB9XG5cbiAgICAgZnVuY3Rpb24gYWN0aXZhdGUgKClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IGRpciA9IG9wdGlvbnMuZGlyZWN0aW9uID09IFwiYnRcIiB8fCBvcHRpb25zLmRpcmVjdGlvbiA9PSBcInRiXCJcbiAgICAgICAgICAgICAgICAgICAgPyBcInBhbi15XCIgOiBcInBhbi14XCJcblxuICAgICAgICAgIGZvciAoIGNvbnN0IGggb2Ygb3B0aW9ucy5oYW5kbGVzIClcbiAgICAgICAgICAgICAgIGguc3R5bGUudG91Y2hBY3Rpb24gPSBkaXJcbiAgICAgfVxuXG4gICAgIGZ1bmN0aW9uIGRlc2FjdGl2YXRlICgpXG4gICAgIHtcbiAgICAgICAgICBjb25zdCBkaXIgPSBvcHRpb25zLmRpcmVjdGlvbiA9PSBcImJ0XCIgfHwgb3B0aW9ucy5kaXJlY3Rpb24gPT0gXCJ0YlwiXG4gICAgICAgICAgICAgICAgICAgID8gXCJwYW4teVwiIDogXCJwYW4teFwiXG5cbiAgICAgICAgICBmb3IgKCBjb25zdCBoIG9mIG9wdGlvbnMuaGFuZGxlcyApXG4gICAgICAgICAgICAgICBoLnN0eWxlLnRvdWNoQWN0aW9uID0gXCJub25lXCJcbiAgICAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gc2NvbGxhYmxlICggb3B0aW9uczogU2NvbGxhYmxlQ29uZmlnIClcbntcbiAgICAgaWYgKCBcIm9udG91Y2hzdGFydFwiIGluIHdpbmRvdyApXG4gICAgICAgICAgcmV0dXJuIHNjcm9sbGFibGVOYXRpdmUgKCBvcHRpb25zIClcblxuICAgICBjb25zdCBkcmFnID0gZHJhZ2dhYmxlICh7XG4gICAgICAgICAgaGFuZGxlcyAgICAgICA6IG9wdGlvbnMuaGFuZGxlcyxcbiAgICAgICAgICB2ZWxvY2l0eUZhY3RvcjogMTAwLFxuICAgICAgICAgIG9uU3RhcnREcmFnLFxuICAgICAgICAgIG9uRHJhZyAgICAgOiBvcHRpb25zLmRpcmVjdGlvbiA9PSBcImJ0XCIgfHwgb3B0aW9ucy5kaXJlY3Rpb24gPT0gXCJ0YlwiXG4gICAgICAgICAgICAgICAgICAgICA/IG9uRHJhZ1ZlcnRpY2FsXG4gICAgICAgICAgICAgICAgICAgICA6IG9uRHJhZ0hvcml6b250YWwsXG4gICAgICAgICAgb25TdG9wRHJhZzogb3B0aW9ucy5kaXJlY3Rpb24gPT0gXCJidFwiIHx8IG9wdGlvbnMuZGlyZWN0aW9uID09IFwidGJcIlxuICAgICAgICAgICAgICAgICAgICA/IG9uU3RvcERyYWdWZXJ0aWNhbFxuICAgICAgICAgICAgICAgICAgICA6IG9uU3RvcERyYWdIb3Jpem9udGFsLFxuICAgICB9KVxuXG4gICAgIHJldHVybiB7XG4gICAgICAgICAgYWN0aXZhdGU6ICgpID0+IHsgZHJhZy5hY3RpdmF0ZSAoKSB9XG4gICAgIH1cblxuICAgICBmdW5jdGlvbiBvblN0YXJ0RHJhZyAoKVxuICAgICB7XG4gICAgICAgICAgZm9yICggY29uc3QgaCBvZiBvcHRpb25zLmhhbmRsZXMgKVxuICAgICAgICAgICAgICAgaC5zdHlsZS5zY3JvbGxCZWhhdmlvciA9IFwidW5zZXRcIlxuICAgICB9XG4gICAgIGZ1bmN0aW9uIG9uRHJhZ1ZlcnRpY2FsICggZXZlbnQ6IERyYWdFdmVudCApXG4gICAgIHtcbiAgICAgICAgICBmb3IgKCBjb25zdCBoIG9mIG9wdGlvbnMuaGFuZGxlcyApXG4gICAgICAgICAgICAgICBoLnNjcm9sbEJ5ICggMCwgZXZlbnQub2Zmc2V0WSApXG4gICAgIH1cbiAgICAgZnVuY3Rpb24gb25EcmFnSG9yaXpvbnRhbCAoIGV2ZW50OiBEcmFnRXZlbnQgKVxuICAgICB7XG4gICAgICAgICAgZm9yICggY29uc3QgaCBvZiBvcHRpb25zLmhhbmRsZXMgKVxuICAgICAgICAgICAgICAgaC5zY3JvbGxCeSAoIGV2ZW50Lm9mZnNldFgsIDAgKVxuICAgICB9XG4gICAgIGZ1bmN0aW9uIG9uU3RvcERyYWdWZXJ0aWNhbCAoIGV2ZW50OiBEcmFnRXZlbnQgKVxuICAgICB7XG4gICAgICAgICAgZm9yICggY29uc3QgaCBvZiBvcHRpb25zLmhhbmRsZXMgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGguc2Nyb2xsQnkgKCAwLCBldmVudC5vZmZzZXRZIClcbiAgICAgICAgICAgICAgIC8vaC5zdHlsZS5zY3JvbGxCZWhhdmlvciA9IFwic21vb3RoXCJcbiAgICAgICAgICAgICAgIC8vaC5zY3JvbGxCeSAoIDAsIGV2ZW50Lm9mZnNldFkgKyBldmVudC52ZWxvY2l0eVkgKVxuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICB9XG4gICAgIGZ1bmN0aW9uIG9uU3RvcERyYWdIb3Jpem9udGFsICggZXZlbnQ6IERyYWdFdmVudCApXG4gICAgIHtcbiAgICAgICAgICBmb3IgKCBjb25zdCBoIG9mIG9wdGlvbnMuaGFuZGxlcyApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgaC5zY3JvbGxCeSAoIGV2ZW50Lm9mZnNldFgsIDAgKVxuICAgICAgICAgICAgICAgLy9oLnN0eWxlLnNjcm9sbEJlaGF2aW9yID0gXCJzbW9vdGhcIlxuICAgICAgICAgICAgICAgLy9oLnNjcm9sbEJ5ICggZXZlbnQub2Zmc2V0WCArIGV2ZW50LnZlbG9jaXR5WCwgMCApXG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgIH1cbn1cbiIsIlxuaW1wb3J0IHsgeG5vZGUgfSBmcm9tIFwiLi4vLi4vQmFzZS94bm9kZS5qc1wiXG5pbXBvcnQgeyBDb250YWluZXIgfSBmcm9tIFwiLi4vLi4vQmFzZS9Db250YWluZXIvaW5kZXguanNcIlxuaW1wb3J0IHsgQ29tcG9uZW50IH0gZnJvbSBcIi4uLy4uL0Jhc2UvQ29tcG9uZW50L2luZGV4LmpzXCJcbmltcG9ydCB7IGV4cGFuZGFibGUsIEV4cGVuZGFibGVFbGVtZW50IH0gZnJvbSBcIi4uLy4uL0Jhc2UvZXhwZW5kYWJsZS5qc1wiXG5pbXBvcnQgeyBwaWNrLCBkZWZpbmUsIGluU3RvY2ssIG1ha2UgfSBmcm9tIFwiLi4vLi4vZGIuanNcIlxuaW1wb3J0IHsgc2NvbGxhYmxlIH0gZnJvbSBcIi4uLy4uL0Jhc2Uvc2Nyb2xsYWJsZS5qc1wiXG5cbmRlY2xhcmUgZ2xvYmFsXG57XG4gICAgIGludGVyZmFjZSAkU2lkZU1lbnUgZXh0ZW5kcyAkQ29udGFpbmVyXG4gICAgIHtcbiAgICAgICAgICB0eXBlOiBcInNpZGUtbWVudVwiXG4gICAgICAgICAgaGFzTWFpbkJ1dHRvbjogYm9vbGVhbixcbiAgICAgICAgICBoZWFkZXI/ICAgICAgOiAkQW55Q29tcG9uZW50cyxcbiAgICAgICAgICBjaGlsZHJlbj8gICAgOiAkQW55Q29tcG9uZW50cyBbXSxcbiAgICAgICAgICBmb290ZXI/ICAgICAgOiAkQW55Q29tcG9uZW50cyxcbiAgICAgfVxufVxuXG50eXBlIERpcmVjdGlvbiA9IFwibHJcIiB8IFwicmxcIiB8IFwidGJcIiB8IFwiYnRcIlxuXG5jb25zdCB0b1Bvc2l0aW9uID0ge1xuICAgICBsciA6IFwibGVmdFwiLFxuICAgICBybCA6IFwicmlnaHRcIixcbiAgICAgdGIgOiBcInRvcFwiLFxuICAgICBidCA6IFwiYm90dG9tXCIsXG59XG5cbnZhciBsZWZ0X21lbnUgICA9IG51bGwgYXMgU2lkZU1lbnVcbnZhciByaWdodF9tZW51ICA9IG51bGwgYXMgU2lkZU1lbnVcbnZhciB0b3BfbWVudSAgICA9IG51bGwgYXMgU2lkZU1lbnVcbnZhciBib3R0b21fbWVudSA9IG51bGwgYXMgU2lkZU1lbnVcblxuZXhwb3J0IGNsYXNzIFNpZGVNZW51IGV4dGVuZHMgQ29udGFpbmVyIDwkU2lkZU1lbnU+XG57XG4gICAgIHN0YXRpYyBhdExlZnQ6IFNpZGVNZW51XG4gICAgIHN0YXRpYyBhdFJpZ2h0OiBTaWRlTWVudVxuICAgICBzdGF0aWMgYXRUb3A6IFNpZGVNZW51XG4gICAgIHN0YXRpYyBhdEJvdHRvbTogU2lkZU1lbnVcblxuICAgICBtYWluX2J1dHRvbjogSlNYLkVsZW1lbnRcbiAgICAgZXhwYW5kYWJsZTogRXhwZW5kYWJsZUVsZW1lbnRcbiAgICAgY29udGVudCAgICA6IENvbXBvbmVudFxuICAgICBoZWFkZXIgICAgIDogQ29tcG9uZW50XG5cbiAgICAgLyoqIEBvdmVycmlkZSAqL1xuICAgICBnZXRIdG1sICgpXG4gICAgIHtcbiAgICAgICAgICBjb25zdCBkYXRhID0gdGhpcy5kYXRhXG4gICAgICAgICAgY29uc3QgaGVhZGVyICAgID0gPGRpdiBjbGFzcz1cInNpZGUtbWVudS1oZWFkZXJcIiAvPlxuICAgICAgICAgIGNvbnN0IGNvbnRlbnQgICA9IDxkaXYgY2xhc3M9XCJzaWRlLW1lbnUtY29udGVudFwiIC8+XG4gICAgICAgICAgY29uc3QgY29udGFpbmVyID0gPGRpdiBjbGFzcz1cInNpZGUtbWVudSBjbG9zZVwiPlxuICAgICAgICAgICAgICAgeyBoZWFkZXIgfVxuICAgICAgICAgICAgICAgeyBjb250ZW50IH1cbiAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgIGlmICggZGF0YS5oZWFkZXIgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHRoaXMuaGVhZGVyID0gaW5TdG9jayAoIGRhdGEuaGVhZGVyIClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgID8gcGljayAoIGRhdGEuaGVhZGVyIClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIDogbWFrZSAoIGRhdGEuaGVhZGVyIClcblxuICAgICAgICAgICAgICAgaGVhZGVyLmFwcGVuZCAoIC4uLiB0aGlzLmhlYWRlci5nZXRIdG1sICgpIClcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoIGRhdGEuaGFzTWFpbkJ1dHRvbiApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgY29uc3QgYnRuID0gPHNwYW4gY2xhc3M9XCJzaWRlLW1lbnUtbWFpbi1idXR0b25cIj5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJpY29uXCI+4oeVPC9zcGFuPlxuICAgICAgICAgICAgICAgPC9zcGFuPlxuXG4gICAgICAgICAgICAgICB0aGlzLm1haW5fYnV0dG9uID0gYnRuXG4gICAgICAgICAgICAgICBoZWFkZXIuaW5zZXJ0QWRqYWNlbnRFbGVtZW50ICggXCJhZnRlcmJlZ2luXCIsIGJ0biApXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKCBkYXRhLmNoaWxkcmVuIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBmb3IgKCBjb25zdCBjaGlsZCBvZiBkYXRhLmNoaWxkcmVuIClcbiAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jb250ZW50ID0gaW5TdG9jayAoIGNoaWxkICkgPyBwaWNrICggY2hpbGQgKSA6IG1ha2UgKCBjaGlsZCApXG5cbiAgICAgICAgICAgICAgICAgICAgY29udGVudC5hcHBlbmQgKCAuLi4gdGhpcy5jb250ZW50LmdldEh0bWwgKCkgKVxuICAgICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbnRhaW5lci5jbGFzc0xpc3QuYWRkICggdG9Qb3NpdGlvbiBbZGF0YS5kaXJlY3Rpb25dIClcbiAgICAgICAgICBzY29sbGFibGUgKHsgaGFuZGxlczogW2NvbnRlbnRdLCBkaXJlY3Rpb246IFwiYnRcIiB9KS5hY3RpdmF0ZSAoKVxuXG4gICAgICAgICAgdGhpcy5jb250YWluZXIgID0gY29udGFpbmVyXG4gICAgICAgICAgdGhpcy5leHBhbmRhYmxlID0gZXhwYW5kYWJsZSAoIHRoaXMuY29udGFpbmVyLCB7XG4gICAgICAgICAgICAgICBkaXJlY3Rpb24gICAgOiBkYXRhLmRpcmVjdGlvbixcbiAgICAgICAgICAgICAgIG5lYXIgICAgICAgICA6IDYwLFxuICAgICAgICAgICAgICAgaGFuZGxlcyAgICAgIDogQXJyYXkub2YgKCB0aGlzLm1haW5fYnV0dG9uICksXG4gICAgICAgICAgICAgICBvbkFmdGVyT3BlbiAgOiAoKSA9PiBjb250ZW50LmNsYXNzTGlzdC5yZW1vdmUgKCBcImhpZGRlblwiICksXG4gICAgICAgICAgICAgICBvbkJlZm9yZUNsb3NlOiAoKSA9PiBjb250ZW50LmNsYXNzTGlzdC5hZGQgKCBcImhpZGRlblwiIClcbiAgICAgICAgICB9KVxuICAgICAgICAgIHRoaXMuZXhwYW5kYWJsZS5hY3RpdmF0ZSAoKVxuXG4gICAgICAgICAgcmV0dXJuIFsgdGhpcy5jb250YWluZXIgXSBhcyBIVE1MRWxlbWVudCBbXVxuICAgICB9XG5cbiAgICAgaXNPcGVuICgpXG4gICAgIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5leHBhbmRhYmxlLmlzT3BlbiAoKVxuICAgICB9XG5cbiAgICAgaXNDbG9zZSAoKVxuICAgICB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuZXhwYW5kYWJsZS5pc0Nsb3NlICgpXG4gICAgIH1cblxuICAgICBvcGVuICgpXG4gICAgIHtcblxuICAgICB9XG5cbiAgICAgY2xvc2UgKClcbiAgICAge1xuICAgICAgICAgIHRoaXMuZXhwYW5kYWJsZS5jbG9zZSAoKVxuXG4gICAgICAgICAgcmV0dXJuIHRoaXNcbiAgICAgfVxufVxuXG5kZWZpbmUgKCBTaWRlTWVudSwgW1wic2lkZS1tZW51XCJdIClcbiIsIlxuaW1wb3J0IHsgeG5vZGUgfSBmcm9tIFwiLi4veG5vZGUuanNcIlxuXG5leHBvcnQgdHlwZSBTaGFwZU5hbWVzID0ga2V5b2YgU2hhcGVEZWZpbml0aW9uc1xuXG5leHBvcnQgaW50ZXJmYWNlIFNoYXBlRGVmaW5pdGlvbnNcbntcbiAgICAgY2lyY2xlICAgOiBPYmplY3REZWZpbml0aW9uLFxuICAgICB0cmlhbmdsZSA6IE9iamVjdERlZmluaXRpb24sXG4gICAgIHNxdWFyZSAgIDogT2JqZWN0RGVmaW5pdGlvbixcbiAgICAgcGFudGFnb24gOiBPYmplY3REZWZpbml0aW9uLFxuICAgICBoZXhhZ29uICA6IE9iamVjdERlZmluaXRpb24sXG4gICAgIHRleHQgICAgIDogVGV4dERlZmluaXRpb24sXG4gICAgIHRleHRib3ggIDogVGV4dERlZmluaXRpb24sXG4gICAgIHBhdGggICAgIDogUGF0aERlZmluaXRpb24sXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgT2JqZWN0RGVmaW5pdGlvblxue1xuICAgICBzaXplOiBudW1iZXIsXG4gICAgIHg/ICA6IG51bWJlcixcbiAgICAgeT8gIDogbnVtYmVyXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgVGV4dERlZmluaXRpb24gZXh0ZW5kcyBPYmplY3REZWZpbml0aW9uXG57XG4gICAgIHRleHQ6IHN0cmluZ1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFBhdGhEZWZpbml0aW9uIGV4dGVuZHMgT2JqZWN0RGVmaW5pdGlvblxue1xuICAgICBwYXRoOiBzdHJpbmdcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVN2Z1NoYXBlIDxUIGV4dGVuZHMgU2hhcGVOYW1lcz4gKFxuICAgICB0eXBlOiBULFxuICAgICBkZWYgOiBTaGFwZURlZmluaXRpb25zIFtUXSxcbik6IFJldHVyblR5cGUgPHR5cGVvZiBTdmdGYWN0b3J5IFtUXT5cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVN2Z1NoYXBlICggdHlwZTogU2hhcGVOYW1lcywgZGVmOiBhbnkgKVxue1xuICAgICBzd2l0Y2ggKCB0eXBlIClcbiAgICAge1xuICAgICBjYXNlIFwiY2lyY2xlXCIgIDogcmV0dXJuIFN2Z0ZhY3RvcnkuY2lyY2xlICAgKCBkZWYgKVxuICAgICBjYXNlIFwidHJpYW5nbGVcIjogcmV0dXJuIFN2Z0ZhY3RvcnkudHJpYW5nbGUgKCBkZWYgKVxuICAgICBjYXNlIFwic3F1YXJlXCIgIDogcmV0dXJuIFN2Z0ZhY3Rvcnkuc3F1YXJlICAgKCBkZWYgKVxuICAgICBjYXNlIFwicGFudGFnb25cIjogcmV0dXJuIFN2Z0ZhY3RvcnkucGFudGFnb24gKCBkZWYgKVxuICAgICBjYXNlIFwiaGV4YWdvblwiIDogcmV0dXJuIFN2Z0ZhY3RvcnkuaGV4YWdvbiAgKCBkZWYgKVxuICAgICBjYXNlIFwic3F1YXJlXCIgIDogcmV0dXJuIFN2Z0ZhY3Rvcnkuc3F1YXJlICAgKCBkZWYgKVxuICAgICBjYXNlIFwidGV4dFwiICAgIDogcmV0dXJuIFN2Z0ZhY3RvcnkudGV4dCAgICAgKCBkZWYgKVxuICAgICBjYXNlIFwidGV4dGJveFwiIDogcmV0dXJuIFN2Z0ZhY3RvcnkudGV4dGJveCAgKCBkZWYgKVxuICAgICBjYXNlIFwicGF0aFwiICAgIDogcmV0dXJuIFN2Z0ZhY3RvcnkucGF0aCAgICAgKCBkZWYgKVxuICAgICB9XG59XG5cbmNsYXNzIFN2Z0ZhY3RvcnlcbntcbiAgICAgLy8gVG8gZ2V0IHRyaWFuZ2xlLCBzcXVhcmUsIFtwYW50YXxoZXhhXWdvbiBwb2ludHNcbiAgICAgLy9cbiAgICAgLy8gdmFyIGEgPSBNYXRoLlBJKjIvNFxuICAgICAvLyBmb3IgKCB2YXIgaSA9IDAgOyBpICE9IDQgOyBpKysgKVxuICAgICAvLyAgICAgY29uc29sZS5sb2cgKCBgWyAkeyBNYXRoLnNpbihhKmkpIH0sICR7IE1hdGguY29zKGEqaSkgfSBdYCApXG5cbiAgICAgc3RhdGljIGNpcmNsZSAoIGRlZjogT2JqZWN0RGVmaW5pdGlvbiApXG4gICAgIHtcbiAgICAgICAgICBjb25zdCBub2RlID0gPGNpcmNsZVxuICAgICAgICAgICAgICAgY3ggPSB7IGRlZi54IHx8IDAgfVxuICAgICAgICAgICAgICAgY3kgPSB7IGRlZi55IHx8IDAgfVxuICAgICAgICAgICAgICAgciAgPSB7IGRlZi5zaXplIC8gMiB9XG4gICAgICAgICAgLz5cblxuICAgICAgICAgIHJldHVybiBub2RlXG4gICAgIH1cblxuICAgICBzdGF0aWMgdHJpYW5nbGUgKCBkZWY6IE9iamVjdERlZmluaXRpb24gKVxuICAgICB7XG4gICAgIH1cblxuXG4gICAgIHN0YXRpYyBzcXVhcmUgKCBkZWY6IE9iamVjdERlZmluaXRpb24gKVxuICAgICB7XG4gICAgIH1cblxuICAgICBzdGF0aWMgcGFudGFnb24gKCBkZWY6IE9iamVjdERlZmluaXRpb24gKVxuICAgICB7XG4gICAgIH1cblxuICAgICBzdGF0aWMgaGV4YWdvbiAoIGRlZjogT2JqZWN0RGVmaW5pdGlvbiApXG4gICAgIHtcbiAgICAgfVxuXG5cbiAgICAgc3RhdGljIHRleHQgKCBkZWY6IFRleHREZWZpbml0aW9uIClcbiAgICAge1xuICAgICB9XG5cbiAgICAgc3RhdGljIHRleHRib3ggKCBkZWY6IFRleHREZWZpbml0aW9uIClcbiAgICAge1xuICAgICB9XG5cblxuICAgICBzdGF0aWMgcGF0aCAoIGRlZjogUGF0aERlZmluaXRpb24gKVxuICAgICB7XG4gICAgIH1cbn1cbiIsImltcG9ydCB7IEdlb21ldHJ5IH0gZnJvbSBcIi4uLy4uLy4uL0xpYi9pbmRleC5qc1wiXG5pbXBvcnQgeyBDb21wb25lbnQgfSBmcm9tIFwiLi4vLi4vQmFzZS9Db21wb25lbnQvaW5kZXguanNcIlxuaW1wb3J0ICogYXMgU3ZnIGZyb20gXCIuLi8uLi9CYXNlL1N2Zy9pbmRleC5qc1wiXG5pbXBvcnQgeyB4bm9kZSB9IGZyb20gXCIuLi8uLi9CYXNlL3hub2RlLmpzXCJcblxuY29uc3QgRyA9IEdlb21ldHJ5XG5cbnR5cGUgUmVuZGVyZXIgPSAoIGRlZmluaXRpb246IFJhZGlhbERlZmluaXRpb24gKSA9PiBTVkdFbGVtZW50IFtdXG50eXBlIFJhZGlhbERlZmluaXRpb24gPSBHZW9tZXRyeS5SYWRpYWxEZWZpbml0aW9uXG50eXBlIFJhZGlhbE9wdGlvbiAgICAgPSBHZW9tZXRyeS5SYWRpYWxPcHRpb25cblxuZGVjbGFyZSBnbG9iYWxcbntcbiAgICAgaW50ZXJmYWNlICRSYWRpYWxNZW51IGV4dGVuZHMgJENvbXBvbmVudFxuICAgICB7XG4gICAgICAgICAgdHlwZTogXCJyYWRpYWwtbWVudVwiLFxuICAgICAgICAgIGJ1dHRvbnM6IFBhcnRpYWwgPCRCdXR0b24+IFtdLFxuICAgICAgICAgIHJvdGF0aW9uOiBudW1iZXJcbiAgICAgfVxufVxuXG5cbmV4cG9ydCBjbGFzcyBSYWRpYWxNZW51IGV4dGVuZHMgQ29tcG9uZW50IDwkUmFkaWFsTWVudT5cbntcbiAgICAgY29udGFpbmVyOiBTVkdTVkdFbGVtZW50XG4gICAgIGRlZmluaXRpb246IFJhZGlhbERlZmluaXRpb25cblxuICAgICByZWFkb25seSByZW5kZXJlcnM6IFJlY29yZCA8c3RyaW5nLCBSZW5kZXJlcj4gPSB7XG4gICAgICAgICAgXCJjaXJjbGVcIjogdGhpcy5yZW5kZXJTdmdDaXJjbGVzLmJpbmQgKHRoaXMpXG4gICAgIH1cblxuICAgICAvKiogQG92ZXJyaWRlICovXG4gICAgIGdldEh0bWwgKClcbiAgICAge1xuICAgICAgICAgIHRoaXMudXBkYXRlICgpXG5cbiAgICAgICAgICByZXR1cm4gW3RoaXMuY29udGFpbmVyIGFzIGFueV1cbiAgICAgfVxuXG4gICAgIGFkZCAoIC4uLiBidXR0b25zOiAkQnV0dG9uIFtdIClcbiAgICAge1xuICAgICAgICAgIHRoaXMuZGF0YS5idXR0b25zLnB1c2ggKCAuLi4gYnV0dG9ucyBhcyBhbnkgKVxuXG4gICAgICAgICAgdGhpcy51cGRhdGUgKClcbiAgICAgfVxuXG4gICAgIHVwZGF0ZSAoKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgeyBkYXRhIH0gPSB0aGlzXG5cbiAgICAgICAgICBjb25zdCBkZWY6IFJhZGlhbE9wdGlvbiA9IHtcbiAgICAgICAgICAgICAgIGNvdW50ICA6IGRhdGEuYnV0dG9ucy5sZW5ndGgsXG4gICAgICAgICAgICAgICByICAgICAgOiA3NSxcbiAgICAgICAgICAgICAgIHBhZGRpbmc6IDYsXG4gICAgICAgICAgICAgICByb3RhdGlvbjogZGF0YS5yb3RhdGlvbiB8fCAwXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdGhpcy5kZWZpbml0aW9uID0gRy5nZXRSYWRpYWxEaXN0cmlidXRpb24gKCBkZWYgKVxuICAgICAgICAgIHRoaXMuY29udGFpbmVyICA9IHRoaXMudG9TdmcgKCBcImNpcmNsZVwiIClcbiAgICAgfVxuXG4gICAgIHByaXZhdGUgZW5hYmxlRXZlbnRzICgpXG4gICAgIHtcbiAgICAgICAgICAvL2NvbnN0IHsgb3B0aW9ucyB9ID0gdGhpc1xuICAgICAgICAgIC8vZm9yICggY29uc3QgYnRuIG9mIG9wdGlvbnMuYnV0dG9ucyApXG4gICAgICAgICAgLy8gICAgIGJ0bi5cbiAgICAgfVxuXG4gICAgIHNob3cgKCB4OiBudW1iZXIsIHk6IG51bWJlciApOiB2b2lkXG4gICAgIHtcbiAgICAgICAgICBjb25zdCBuID0gdGhpcy5jb250YWluZXJcbiAgICAgICAgICBjb25zdCBvZmZzZXQgPSB0aGlzLmRlZmluaXRpb24ud2lkdGggLyAyXG5cbiAgICAgICAgICBuLnN0eWxlLmxlZnQgPSAoeCAtIG9mZnNldCkgKyBcInB4XCJcbiAgICAgICAgICBuLnN0eWxlLnRvcCAgPSAoeSAtIG9mZnNldCkgKyBcInB4XCJcbiAgICAgICAgICBuLmNsYXNzTGlzdC5yZW1vdmUgKCBcImNsb3NlXCIgKVxuICAgICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyICggXCJtb3VzZWRvd25cIiwgdGhpcy5oaWRlLmJpbmQgKHRoaXMpLCB0cnVlIClcbiAgICAgfVxuXG4gICAgIGhpZGUgKClcbiAgICAge1xuICAgICAgICAgIHRoaXMuY29udGFpbmVyLmNsYXNzTGlzdC5hZGQgKFwiY2xvc2VcIilcbiAgICAgICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyICggXCJtb3VzZWRvd25cIiwgdGhpcy5oaWRlIClcbiAgICAgfVxuXG4gICAgIHRvU3ZnICggc3R5bGU6IHN0cmluZyApXG4gICAgIHtcbiAgICAgICAgICBjb25zdCB7IGRlZmluaXRpb246IGRlZiwgcmVuZGVyZXJzLCBkYXRhIH0gPSB0aGlzXG5cbiAgICAgICAgICBjb25zdCBzdmcgPVxuICAgICAgICAgICAgICAgPHN2Z1xuICAgICAgICAgICAgICAgICAgICBjbGFzcyAgID1cInJhZGlhbC1tZW51IGNsb3NlXCJcbiAgICAgICAgICAgICAgICAgICAgd2lkdGggICA9eyBkZWYud2lkdGggKyBcInB4XCIgfVxuICAgICAgICAgICAgICAgICAgICBoZWlnaHQgID17IGRlZi5oZWlnaHQgKyBcInB4XCIgfVxuICAgICAgICAgICAgICAgICAgICB2aWV3Qm94ID17IGAwIDAgJHsgZGVmLndpZHRoIH0gJHsgZGVmLmhlaWdodCB9YCB9XG4gICAgICAgICAgICAgICAvPiBhcyBTVkdTVkdFbGVtZW50XG5cbiAgICAgICAgICBjb25zdCBidXR0b25zID0gc3R5bGUgaW4gcmVuZGVyZXJzXG4gICAgICAgICAgICAgICAgICAgICAgICAgPyByZW5kZXJlcnMgW3N0eWxlXSAoIGRlZiApXG4gICAgICAgICAgICAgICAgICAgICAgICAgOiB0aGlzLnJlbmRlclN2Z0NpcmNsZXMgKCBkZWYgKVxuXG4gICAgICAgICAgc3ZnLmFwcGVuZCAoIC4uLiBidXR0b25zIGFzIE5vZGUgW10gKVxuXG4gICAgICAgICAgZm9yICggdmFyIGkgPSAwIDsgaSAhPSBidXR0b25zLmxlbmd0aCA7IGkrKyApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgY29uc3Qgb3B0ID0gZGF0YS5idXR0b25zIFtpXVxuXG4gICAgICAgICAgICAgICBpZiAoIHR5cGVvZiBvcHQuY2FsbGJhY2sgPT0gXCJmdW5jdGlvblwiIClcbiAgICAgICAgICAgICAgICAgICAgYnV0dG9ucyBbaV0uYWRkRXZlbnRMaXN0ZW5lciAoIFwibW91c2Vkb3duXCIsICgpID0+IG9wdC5jYWxsYmFjayAoKSApXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIHN2Z1xuICAgICB9XG5cbiAgICAgcmVuZGVyU3ZnQ2lyY2xlcyAoIGRlZmluaXRpb246IFJhZGlhbERlZmluaXRpb24gKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgcG9pbnRzICA9IGRlZmluaXRpb24ucG9pbnRzXG4gICAgICAgICAgY29uc3QgcGFkZGluZyA9IGRlZmluaXRpb24ucGFkZGluZ1xuICAgICAgICAgIGNvbnN0IGJ1dHR1bnMgPSBbXSBhcyBTVkdFbGVtZW50IFtdXG5cbiAgICAgICAgICBmb3IgKCB2YXIgaSA9IDA7IGkgPCBwb2ludHMubGVuZ3RoOyArK2kgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNvbnN0IGRlZiA9IHBvaW50cyBbaV1cbiAgICAgICAgICAgICAgIGNvbnN0IGJ0biA9IHRoaXMuZGF0YS5idXR0b25zIFtpXVxuXG4gICAgICAgICAgICAgICBjb25zdCBncm91cCA9IDxnIGNsYXNzPVwiYnV0dG9uXCIgLz5cblxuICAgICAgICAgICAgICAgY29uc3QgY2lyY2xlID0gU3ZnLmNyZWF0ZVN2Z1NoYXBlICggXCJjaXJjbGVcIiwge1xuICAgICAgICAgICAgICAgICAgICBzaXplOiBkZWYuY2hvcmQubGVuZ3RoIC0gcGFkZGluZyAqIDIsXG4gICAgICAgICAgICAgICAgICAgIHg6IGRlZi54LFxuICAgICAgICAgICAgICAgICAgICB5OiBkZWYueVxuICAgICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgICAgY29uc3QgdGV4dCA9IDx0ZXh0XG4gICAgICAgICAgICAgICAgICAgIHggPSB7IGRlZi54IH1cbiAgICAgICAgICAgICAgICAgICAgeSA9IHsgZGVmLnkgfVxuICAgICAgICAgICAgICAgICAgICBmb250LXNpemU9XCIzMFwiXG4gICAgICAgICAgICAgICAgICAgIGZpbGw9XCJibGFja1wiXG4gICAgICAgICAgICAgICAgICAgIHN0eWxlPVwidXNlci1zZWxlY3Q6IG5vbmU7IGN1cnNvcjogcG9pbnRlcjsgZG9taW5hbnQtYmFzZWxpbmU6IGNlbnRyYWw7IHRleHQtYW5jaG9yOiBtaWRkbGU7XCJcbiAgICAgICAgICAgICAgIC8+XG5cbiAgICAgICAgICAgICAgIGlmICggYnRuLmZvbnRGYW1pbHkgIT0gdW5kZWZpbmVkIClcbiAgICAgICAgICAgICAgICAgICAgdGV4dC5zZXRBdHRyaWJ1dGUgKCBcImZvbnQtZmFtaWx5XCIsIGJ0bi5mb250RmFtaWx5IClcblxuICAgICAgICAgICAgICAgdGV4dC5pbm5lckhUTUwgPSBidG4uaWNvblxuXG4gICAgICAgICAgICAgICBncm91cC5hcHBlbmQgKCBjaXJjbGUgKVxuICAgICAgICAgICAgICAgZ3JvdXAuYXBwZW5kICggdGV4dCApXG5cbiAgICAgICAgICAgICAgIGJ1dHR1bnMucHVzaCAoIGdyb3VwIGFzIFNWR0VsZW1lbnQgKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiBidXR0dW5zXG4gICAgIH1cbn1cblxuIiwiXG5pbXBvcnQgeyBDb21wb25lbnQgfSBmcm9tIFwiLi4vLi4vQmFzZS9Db21wb25lbnQvaW5kZXguanNcIlxuaW1wb3J0IHsgeG5vZGUgfSBmcm9tIFwiLi4vLi4vQmFzZS94bm9kZS5qc1wiXG5pbXBvcnQgeyBkZWZpbmUgfSBmcm9tIFwiLi4vLi4vZGIuanNcIlxuXG5kZWNsYXJlIGdsb2JhbFxue1xuXG4gICAgIGV4cG9ydCBpbnRlcmZhY2UgJFBlcnNvblZpZXdlciBleHRlbmRzICRDb21wb25lbnRcbiAgICAge1xuICAgICAgICAgIHR5cGU6IFwicGVyc29uLXZpZXdlclwiXG4gICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFBlcnNvblZpZXdlZXIgZXh0ZW5kcyBDb21wb25lbnQgPCRQZXJzb25WaWV3ZXI+XG57XG4gICAgIGRpc3BsYXkgKCBwZXJzb246ICRQZXJzb24gKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgY2FyZCA9IDxkaXYgY2xhc3M9XCJ3My1jYXJkLTQgcGVyc29uLWNhcmRcIj5cbiAgICAgICAgICAgICAgIDxpbWcgc3JjPXsgcGVyc29uLmF2YXRhciB9IGFsdD1cIkF2YXRhclwiLz5cbiAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJ3My1jb250YWluZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgPGg0PlxuICAgICAgICAgICAgICAgICAgICAgICAgIDxiPnsgcGVyc29uLmZpcnN0TmFtZSB9PC9iPlxuICAgICAgICAgICAgICAgICAgICA8L2g0PlxuICAgICAgICAgICAgICAgICAgICA8bGFiZWw+XG4gICAgICAgICAgICAgICAgICAgICAgICAgPGI+eyBwZXJzb24uaXNDYXB0YWluID8gXCJFeHBlcnRcIiA6IG51bGwgfTwvYj5cbiAgICAgICAgICAgICAgICAgICAgPC9sYWJlbD5cbiAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuXG5cbiAgICAgICAgICB0aGlzLmNvbnRhaW5lci5pbm5lckhUTUwgPSBcIlwiXG4gICAgICAgICAgdGhpcy5jb250YWluZXIuYXBwZW5kICggY2FyZCApXG4gICAgIH1cbn1cblxuZGVmaW5lICggUGVyc29uVmlld2Vlciwge1xuICAgICBjb250ZXh0OiBcImNvbmNlcHQtdWlcIixcbiAgICAgdHlwZSAgIDogXCJwZXJzb24tdmlld2VyXCIsXG4gICAgIGlkICAgICA6IHVuZGVmaW5lZCxcbn0pXG4iLCJcbmltcG9ydCB7IENvbXBvbmVudCB9IGZyb20gXCIuLi8uLi9CYXNlL0NvbXBvbmVudC9pbmRleC5qc1wiXG5pbXBvcnQgeyB4bm9kZSB9IGZyb20gXCIuLi8uLi9CYXNlL3hub2RlLmpzXCJcbmltcG9ydCB7IGRlZmluZSB9IGZyb20gXCIuLi8uLi9kYi5qc1wiXG5pbXBvcnQgKiBhcyBkYiBmcm9tIFwiLi4vLi4vLi4vQXBwbGljYXRpb24vZGF0YS5qc1wiXG5cblxuZGVjbGFyZSBnbG9iYWxcbntcbiAgICAgaW50ZXJmYWNlICRTa2lsbFZpZXdlciBleHRlbmRzICRDb21wb25lbnRcbiAgICAge1xuICAgICAgICAgIHR5cGU6IFwic2tpbGwtdmlld2VyXCJcbiAgICAgfVxufVxuXG5leHBvcnQgY2xhc3MgU2tpbGxWaWV3ZXIgZXh0ZW5kcyBDb21wb25lbnQgPCRTa2lsbFZpZXdlcj5cbntcbiAgICAgZGlzcGxheSAoIHNraWxsOiAkU2tpbGwgKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgdGFyZ2V0ID0gPGRpdiBjbGFzcz1cInBlb3BsZVwiPjwvZGl2PlxuXG4gICAgICAgICAgZm9yICggY29uc3QgbmFtZSBvZiBza2lsbC5pdGVtcyApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgY29uc3QgcGVyc29uID0gZGIuZ2V0Tm9kZSA8JFBlcnNvbj4gKCBuYW1lIClcblxuICAgICAgICAgICAgICAgY29uc3QgY2FyZCA9IDxkaXYgY2xhc3M9XCJ3My1jYXJkLTQgcGVyc29uLWNhcmRcIj5cbiAgICAgICAgICAgICAgICAgICAgPGltZyBzcmM9eyBwZXJzb24uYXZhdGFyIH0gYWx0PVwiQXZhdGFyXCIvPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwidzMtY29udGFpbmVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgPGg0PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGI+eyBwZXJzb24uZmlyc3ROYW1lIH08L2I+XG4gICAgICAgICAgICAgICAgICAgICAgICAgPC9oND5cbiAgICAgICAgICAgICAgICAgICAgICAgICA8bGFiZWw+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8Yj57IHBlcnNvbi5pc0NhcHRhaW4gPyBcIkV4cGVydFwiIDogbnVsbCB9PC9iPlxuICAgICAgICAgICAgICAgICAgICAgICAgIDwvbGFiZWw+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgIHRhcmdldC5hcHBlbmQgKCBjYXJkIClcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB0aGlzLmNvbnRhaW5lci5jbGFzc0xpc3QuYWRkICggXCJjb250YWluZXJcIiApXG4gICAgICAgICAgdGhpcy5jb250YWluZXIuaW5uZXJIVE1MID0gXCJcIlxuICAgICAgICAgIHRoaXMuY29udGFpbmVyLmFwcGVuZCAoIDxoMT57IHNraWxsLmlkIH08L2gxPiApXG4gICAgICAgICAgdGhpcy5jb250YWluZXIuYXBwZW5kICggPHA+eyBza2lsbC5kZXNjcmlwdGlvbiB9PC9wPiApXG4gICAgICAgICAgdGhpcy5jb250YWluZXIuYXBwZW5kICggdGFyZ2V0IClcblxuICAgICAgICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9Mb3JET25pWC9qc29uLXZpZXdlci9ibG9iL21hc3Rlci9zcmMvanNvbi12aWV3ZXIuanNcbiAgICAgICAgICB0aGlzLmNvbnRhaW5lci5hcHBlbmQgKCA8cHJlPnsgSlNPTi5zdHJpbmdpZnkgKCBza2lsbCwgbnVsbCwgMyApIH08L3ByZT4gKVxuICAgICB9XG59XG5cbmRlZmluZSAoIFNraWxsVmlld2VyLCB7XG4gICAgIGNvbnRleHQ6IFwiY29uY2VwdC11aVwiLFxuICAgICB0eXBlICAgOiBcInNraWxsLXZpZXdlclwiLFxuICAgICBpZCAgICAgOiB1bmRlZmluZWQsXG59KVxuIiwiXG5cbmltcG9ydCAqIGFzIHVpIGZyb20gXCIuLi9VaS9pbmRleC5qc1wiXG5pbXBvcnQgeyBTaWRlTWVudSB9IGZyb20gXCIuLi9VaS9pbmRleC5qc1wiXG5cblxuLy9leHBvcnQgY29uc3QgbWVudSA9IGNyZWF0ZU1lbnUgKClcblxuLy9kb2N1bWVudC5ib2R5LmFwcGVuZCAoIC4uLiBtZW51LmVsZW1lbnRzICgpIClcblxuZXhwb3J0IGNvbnN0IG1lbnUgPSB1aS5tYWtlIDxTaWRlTWVudSwgJFNpZGVNZW51PiAoe1xuICAgICBjb250ZXh0ICAgICAgOiBcImNvbmNlcHQtdWlcIixcbiAgICAgdHlwZSAgICAgICAgIDogXCJzaWRlLW1lbnVcIixcbiAgICAgaWQgICAgICAgICAgIDogXCJtZW51XCIsXG4gICAgIGhhc01haW5CdXR0b246IHRydWUsXG4gICAgIGRpcmVjdGlvbiAgICA6IFwibHJcIlxufSlcbmRvY3VtZW50LmJvZHkuYXBwZW5kICggLi4uIG1lbnUuZ2V0SHRtbCAoKSApXG5cbi8vZXhwb3J0IHR5cGUgTWVudUNvbW1hbmRzID0ge1xuLy8gICAgIFwib3Blbi1tZW51XCI6ICgpID0+IHZvaWQsXG4vLyAgICAgXCJjbG9zZS1tZW51XCI6ICgpID0+IHZvaWQsXG4vL31cblxuLy9hZGRDb21tYW5kICggXCJvcGVuLW1lbnVcIiwgKCkgPT4geyBtZW51Lm9wZW4gKCkgfSlcbi8vYWRkQ29tbWFuZCAoIFwiY2xvc2UtbWVudVwiLCAoKSA9PiB7IG1lbnUuY2xvc2UgKCkgfSlcbiIsIlxuaW1wb3J0IFwiLi4vVWkvZGIuanNcIlxuaW1wb3J0IFwiLi4vVWkvQ29tcG9uZW50L1NsaWRlU2hvdy9pbmRleC5qc1wiXG5pbXBvcnQgXCIuLi9VaS9Db21wb25lbnQvUGFuZWwvc2tpbGwuanNcIlxuXG5pbXBvcnQgKiBhcyB1aSBmcm9tIFwiLi4vVWkvaW5kZXguanNcIlxuaW1wb3J0IHsgU2lkZU1lbnUgfSBmcm9tIFwiLi4vVWkvaW5kZXguanNcIlxuXG52YXIgZGlyZWN0aW9uID0gXCJybFwiIGFzIFwicmxcIiB8IFwibHJcIiB8IFwidGJcIiB8IFwiYnRcIlxuXG5leHBvcnQgY29uc3QgcGFuZWwgPSB1aS5tYWtlIDxTaWRlTWVudSwgJFNpZGVNZW51PiAoe1xuICAgICBjb250ZXh0ICAgICAgOiBcImNvbmNlcHQtdWlcIixcbiAgICAgdHlwZSAgICAgICAgIDogXCJzaWRlLW1lbnVcIixcbiAgICAgaWQgICAgICAgICAgIDogdW5kZWZpbmVkLFxuICAgICBkaXJlY3Rpb24gICAgOiBkaXJlY3Rpb24sXG4gICAgIGhhc01haW5CdXR0b246IHRydWUsXG5cbiAgICAgaGVhZGVyOiB7XG4gICAgICAgICAgY29udGV4dCAgOiBcImNvbmNlcHQtdWlcIixcbiAgICAgICAgICB0eXBlICAgICA6IFwidG9vbGJhclwiLFxuICAgICAgICAgIGlkICAgICAgIDogdW5kZWZpbmVkLFxuICAgICAgICAgIHRpdGxlICAgIDogXCJUaXRsZSAuLlwiLFxuICAgICAgICAgIGRpcmVjdGlvbjogZGlyZWN0aW9uID09IFwibHJcIiB8fCBkaXJlY3Rpb24gPT0gXCJybFwiID8gXCJ0YlwiIDogXCJsclwiLFxuXG4gICAgICAgICAgYnV0dG9uczogW3tcbiAgICAgICAgICAgICAgIGNvbnRleHQgOiBcImNvbmNlcHQtdWlcIixcbiAgICAgICAgICAgICAgIHR5cGUgICAgOiBcImJ1dHRvblwiLFxuICAgICAgICAgICAgICAgaWQgICAgICA6IFwiY29uc29sZVwiLFxuICAgICAgICAgICAgICAgaWNvbiAgICA6IFwi4pqgXCIsXG4gICAgICAgICAgICAgICB0ZXh0ICAgIDogXCJcIixcbiAgICAgICAgICAgICAgIGhhbmRsZU9uOiBcIipcIixcbiAgICAgICAgICAgICAgIGNvbW1hbmQgOiBcInBhY2stdmlld1wiXG4gICAgICAgICAgfSx7XG4gICAgICAgICAgICAgICBjb250ZXh0IDogXCJjb25jZXB0LXVpXCIsXG4gICAgICAgICAgICAgICB0eXBlICAgIDogXCJidXR0b25cIixcbiAgICAgICAgICAgICAgIGlkICAgICAgOiBcInByb3BlcnRpZXNcIixcbiAgICAgICAgICAgICAgIGljb24gICAgOiBcIlwiLFxuICAgICAgICAgICAgICAgdGV4dCAgICA6IFwicGFuZWwgcHJvcGVydGllc1wiLFxuICAgICAgICAgICAgICAgaGFuZGxlT246IFwiKlwiLFxuICAgICAgICAgIH1dXG4gICAgIH0sXG5cbiAgICAgY2hpbGRyZW46IFt7XG4gICAgICAgICAgY29udGV4dDogXCJjb25jZXB0LXVpXCIsXG4gICAgICAgICAgdHlwZSAgIDogXCJzbGlkZXNob3dcIixcbiAgICAgICAgICBpZCAgICAgOiBcInBhbmVsLXNsaWRlc2hvd1wiLFxuXG4gICAgICAgICAgY2hpbGRyZW46IFt7XG4gICAgICAgICAgICAgICBjb250ZXh0OiBcImNvbmNlcHQtdWlcIixcbiAgICAgICAgICAgICAgIHR5cGUgICA6IFwic2tpbGwtdmlld2VyXCIsXG4gICAgICAgICAgICAgICBpZCAgICAgOiBcInNsaWRlLXNraWxsXCJcbiAgICAgICAgICB9LHtcbiAgICAgICAgICAgICAgIGNvbnRleHQ6IFwiY29uY2VwdC11aVwiLFxuICAgICAgICAgICAgICAgdHlwZSAgIDogXCJwZXJzb24tdmlld2VyXCIsXG4gICAgICAgICAgICAgICBpZCAgICAgOiBcInNsaWRlLXBlcnNvblwiXG4gICAgICAgICAgfV1cbiAgICAgfV1cbn0pXG5cbmRvY3VtZW50LmJvZHkuYXBwZW5kICggLi4uIHBhbmVsLmdldEh0bWwgKCkgKVxuXG4iLCJcbmltcG9ydCB7IFJhZGlhbE1lbnUgfSBmcm9tIFwiLi4vVWkvQ29tcG9uZW50L0NpcmN1bGFyTWVudS9pbmRleC5qc1wiXG5pbXBvcnQgeyBBcmVhIH0gZnJvbSBcIi4uL1VpL0NvbXBvbmVudC9BcmVhL2FyZWEuanNcIlxuLy9pbXBvcnQgKiBhcyBBc3BlY3QgZnJvbSBcIi4vQXNwZWN0L2luZGV4LmpzXCJcblxuLy9pbXBvcnQgeyBhZGRDb21tYW5kLCBydW5Db21tYW5kIH0gZnJvbSBcIi4vY29tbWFuZC5qc1wiXG4vL2ltcG9ydCB7IGNvbW1hbmQgfSBmcm9tIFwiLi9jb21tYW5kLmpzXCJcblxuZXhwb3J0IGNvbnN0IGFyZWEgPSAgKCgpID0+XG57XG4gICAgIGNvbnN0IGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgKCBcImNhbnZhc1wiIClcblxuICAgICBjYW52YXMud2lkdGggID0gZG9jdW1lbnQuYm9keS5jbGllbnRXaWR0aFxuICAgICBjYW52YXMuaGVpZ2h0ID0gZG9jdW1lbnQuYm9keS5jbGllbnRIZWlnaHRcblxuICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZCAoIGNhbnZhcyApXG5cbiAgICAgcmV0dXJuIG5ldyBBcmVhICggY2FudmFzIClcbn0pICgpXG5cbmV4cG9ydCBjb25zdCBjb250ZXh0dWFsTWVudSA9IG5ldyBSYWRpYWxNZW51ICh7XG4gICAgIGNvbnRleHQ6IFwiY29uY2VwdC11aVwiLFxuICAgICB0eXBlOiBcInJhZGlhbC1tZW51XCIsXG4gICAgIGlkOiBcImFyZWEtbWVudVwiLFxuICAgICBidXR0b25zOiBbXG4gICAgICAgICAgLy97IHR5cGU6IFwiYnV0dG9uXCIsIGlkOiBcImFkZC10aGluZ1wiICwgdGV4dDogXCJcIiwgaWNvbjogXCImI3hlM2M4O1wiLCBmb250RmFtaWx5OiBcIk1hdGVyaWFsIEljb25zXCIsIGNhbGxiYWNrOiAoKSA9PiB7IHJ1bkNvbW1hbmQgKCBcInpvb20tZXh0ZW5kc1wiICkgfSB9LCAvLyBkZXRhaWxzXG4gICAgICAgICAgeyB0eXBlOiBcImJ1dHRvblwiLCBpZDogXCJhZGQtdGhpbmdcIiAsIHRleHQ6IFwiXCIsIGljb246IFwiJiN4ZTNjODtcIiwgZm9udEZhbWlseTogXCJNYXRlcmlhbCBJY29uc1wiIH0sIC8vIGRldGFpbHNcbiAgICAgICAgICB7IHR5cGU6IFwiYnV0dG9uXCIsIGlkOiBcImFkZC1idWJibGVcIiwgdGV4dDogXCJcIiwgaWNvbjogXCImI3hlNmRkO1wiLCBmb250RmFtaWx5OiBcIk1hdGVyaWFsIEljb25zXCIgfSxcbiAgICAgICAgICB7IHR5cGU6IFwiYnV0dG9uXCIsIGlkOiBcImFkZC1ub3RlXCIgICwgdGV4dDogXCJcIiwgaWNvbjogXCImI3hlMjQ0O1wiLCBmb250RmFtaWx5OiBcIk1hdGVyaWFsIEljb25zXCIsIGNvbW1hbmQ6IFwicGFjay12aWV3XCIgfSwgLy8gZm9ybWF0X3F1b3RlXG4gICAgICAgICAgeyB0eXBlOiBcImJ1dHRvblwiLCBpZDogXCJhZGQtcGVvcGxlXCIsIHRleHQ6IFwiXCIsIGljb246IFwiJiN4ZTg3YztcIiwgZm9udEZhbWlseTogXCJNYXRlcmlhbCBJY29uc1wiIH0sIC8vIGZhY2VcbiAgICAgICAgICB7IHR5cGU6IFwiYnV0dG9uXCIsIGlkOiBcImFkZC10YWdcIiAgICwgdGV4dDogXCJcIiwgaWNvbjogXCImI3hlODY3O1wiLCBmb250RmFtaWx5OiBcIk1hdGVyaWFsIEljb25zXCIgfSwgLy8gYm9va21hcmtfYm9yZGVyXG4gICAgIF0gYXMgYW55LFxuICAgICByb3RhdGlvbjogTWF0aC5QSS8yLFxufSlcblxuZG9jdW1lbnQuYm9keS5hcHBlbmQgKCAuLi4gY29udGV4dHVhbE1lbnUuZ2V0SHRtbCAoKSApXG5cblxuLy8gQ0xJQ0sgRVZFTlRTXG5cbi8vIGFyZWEub25Ub3VjaE9iamVjdCA9ICggc2hhcGUgKSA9PlxuLy8ge1xuLy8gICAgICBydW4gQ29tbWFuZCAoIFwiem9vbS10b1wiLCBzaGFwZSApXG4vLyB9XG5cbi8vIEhPVkVSIEVWRU5UU1xuXG5hcmVhLm9uT3Zlck9iamVjdCA9ICggc2hhcGUgKSA9Plxue1xuICAgICBzaGFwZS5ob3ZlciAoIHRydWUgKVxuICAgICBhcmVhLmZjYW52YXMucmVxdWVzdFJlbmRlckFsbCAoKVxufVxuXG5hcmVhLm9uT3V0T2JqZWN0ID0gKCBzaGFwZSApID0+XG57XG4gICAgIHNoYXBlLmhvdmVyICggZmFsc2UgKVxuICAgICBhcmVhLmZjYW52YXMucmVxdWVzdFJlbmRlckFsbCAoKVxufVxuXG4vLyBURVNUXG5cbmlmICggbmF2aWdhdG9yLm1heFRvdWNoUG9pbnRzID4gMCApXG57XG5cbiAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIgKCBcInBvaW50ZXJtb3ZlXCIsIGV2ZW50ID0+XG4gICAgIHtcbiAgICAgICAgICAvL2NvbnN0IHRhcmdldCA9IGFyZWEuZmNhbnZhcy5maW5kVGFyZ2V0ICggZXZlbnQsIHRydWUgKVxuICAgICAgICAgIC8vaWYgKCB0YXJnZXQgKVxuICAgICAgICAgIC8vICAgICBjb25zb2xlLmxvZyAoIHRhcmdldCApXG4gICAgIH0pXG59XG5lbHNlXG57XG4gICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyICggXCJtb3VzZW1vdmVcIiwgZXZlbnQgPT5cbiAgICAge1xuICAgICAgICAgIC8vY29uc3QgdGFyZ2V0ID0gYXJlYS5mY2FudmFzLmZpbmRUYXJnZXQgKCBldmVudCwgdHJ1ZSApXG4gICAgICAgICAgLy9pZiAoIHRhcmdldCApXG4gICAgICAgICAgLy8gICAgIGNvbnNvbGUubG9nICggdGFyZ2V0IClcbiAgICAgfSlcbn1cbiIsIlxuaW1wb3J0IHsgbWVudSAsIH0gZnJvbSBcIi4vbWVudS5qc1wiXG5pbXBvcnQgeyBwYW5lbCwgfSBmcm9tIFwiLi9wYW5lbC5qc1wiXG5pbXBvcnQgeyBhcmVhICwgY29udGV4dHVhbE1lbnUgfSBmcm9tIFwiLi9hcmVhLmpzXCJcbmltcG9ydCB7IGNvbW1hbmQgfSBmcm9tIFwiLi4vVWkvY29tbWFuZC5qc1wiXG5cblxuY29tbWFuZCAoIFwib3Blbi1tZW51XCIsICgpID0+XG57XG4gICAgIHBhbmVsLmNsb3NlICgpXG4gICAgIGNvbnRleHR1YWxNZW51LmhpZGUgKClcbn0pXG5jb21tYW5kICggXCJvcGVuLXBhbmVsXCIsICgpID0+XG57XG4gICAgIG1lbnUuY2xvc2UgKClcbiAgICAgY29udGV4dHVhbE1lbnUuaGlkZSAoKVxufSlcblxuXG4vLyBQQU5FTFMgQ09NTUFORFNcblxuaW1wb3J0ICogYXMgdWkgZnJvbSBcIi4uL1VpL2luZGV4LmpzXCJcbmltcG9ydCB7IFNsaWRlc2hvdyB9IGZyb20gXCIuLi9VaS9pbmRleC5qc1wiXG5pbXBvcnQgeyBTa2lsbFZpZXdlciB9IGZyb20gXCIuLi9VaS9Db21wb25lbnQvUGFuZWwvc2tpbGwuanNcIlxuaW1wb3J0IHsgZ2V0Tm9kZSB9IGZyb20gXCIuL2RhdGEuanNcIjtcbmltcG9ydCB7IGdldEFzcGVjdCB9IGZyb20gXCIuL0FzcGVjdC9kYi5qc1wiO1xuaW1wb3J0IHsgQXJlYSB9IGZyb20gXCIuLi9VaS9Db21wb25lbnQvQXJlYS9hcmVhLmpzXCJcblxuY29uc3Qgc2xpZGVzaG93ICA9IHVpLnBpY2sgPFNsaWRlc2hvdz4gICAoIFwic2xpZGVzaG93XCIsIFwicGFuZWwtc2xpZGVzaG93XCIgKVxuY29uc3Qgc2xpZGVJbmZvcyA9IHVpLnBpY2sgPFNraWxsVmlld2VyPiAoIFwic2tpbGwtdmlld2VyXCIsIFwic2xpZGUtc2tpbGxcIiApXG5cbmNvbW1hbmQgKCBcIm9wZW4tcGFuZWxcIiwgKCBuYW1lLCAuLi4gY29udGVudCApID0+XG57XG4gICAgIC8vIGlmICggbmFtZSApXG4gICAgIC8vICAgICAgc2xpZGVzaG93LnNob3cgKCBuYW1lLCAuLi4gY29udGVudCApXG4gICAgIC8vIGVsc2VcbiAgICAgLy8gICAgICBwYW5lbC5vcGVuICgpXG59KVxuXG5jb21tYW5kICggXCJvcGVuLWluZm9zLXBhbmVsXCIsICggZSApID0+XG57XG4gICAgIGNvbnN0IGFzcGVjdCA9IGdldEFzcGVjdCAoIEFyZWEuY3VycmVudEV2ZW50LnRhcmdldCApXG5cbiAgICAgaWYgKCBhc3BlY3QgKVxuICAgICB7XG4gICAgICAgICAgY29uc3Qgc2tpbGwgPSBnZXROb2RlIDwkU2tpbGw+ICh7XG4gICAgICAgICAgICAgICB0eXBlOiBhc3BlY3QuY29uZmlnLnR5cGUsXG4gICAgICAgICAgICAgICBpZCAgOiBhc3BlY3QuY29uZmlnLmlkXG4gICAgICAgICAgfSlcblxuICAgICAgICAgIGlmICggc2tpbGwgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHNsaWRlSW5mb3MuZGlzcGxheSAoIHNraWxsIGFzIGFueSApXG4gICAgICAgICAgICAgICBwYW5lbC5vcGVuICgpXG4gICAgICAgICAgfVxuICAgICB9XG59KVxuXG5jb21tYW5kICggXCJjbG9zZS1wYW5lbFwiICwgKCkgPT5cbntcbiAgICAgcGFuZWwuY2xvc2UgKClcbn0pXG5cbi8vIEFSRUEgRVZFTlRTXG5cbmFyZWEub25Eb3VibGVUb3VjaE9iamVjdCA9ICggc2hhcGUgKSA9Plxue1xuICAgICBpZiAoIHNoYXBlLmNvbmZpZy5vblRvdWNoICE9IHVuZGVmaW5lZCApXG4gICAgICAgICAgc2hhcGUuY29uZmlnLm9uVG91Y2ggKCBzaGFwZSApXG59XG5cbmFyZWEub25Ub3VjaEFyZWEgPSAoIHgsIHkgKSA9Plxue1xuICAgICBjb21tYW5kICggXCJvcGVuLWNvbnRleHRhbC1tZW51XCIgKS5ydW4gKClcbiAgICAgLy9ydW4gQ29tbWFuZCAoIFwib3Blbi1jb250ZXh0YWwtbWVudVwiLCB4LCB5IClcbn1cblxuXG4vLyBBUkVBIENPTU1BTkRTXG5cbi8vZXhwb3J0IHR5cGUgQXJlYUNvbW1hbmRzID1cbi8ve1xuLy8gICAgIFwiYWRkLXNraWxsXCIgICAgICAgICAgIDogKCB0aXRsZTogc3RyaW5nICkgPT4gdm9pZCxcbi8vICAgICBcImFkZC1wZXJzb25cIiAgICAgICAgICA6ICggbmFtZTogc3RyaW5nICkgPT4gdm9pZCxcbi8vICAgICBcInpvb20tZXh0ZW5kc1wiICAgICAgICA6ICgpID0+IHZvaWQsXG4vLyAgICAgXCJ6b29tLXRvXCIgICAgICAgICAgICAgOiAoIHNoYXBlOiBBc3BlY3QuU2hhcGUgKSA9PiB2b2lkLFxuLy8gICAgIFwicGFjay12aWV3XCIgICAgICAgICAgIDogKCkgPT4gdm9pZCxcbi8vICAgICBcIm9wZW4tY29udGV4dGFsLW1lbnVcIiA6ICggeDogbnVtYmVyLCB5OiBudW1iZXIgKSA9PiB2b2lkLFxuLy8gICAgIFwiY2xvc2UtY29udGV4dGFsLW1lbnVcIjogKCkgPT4gdm9pZCxcbi8vfVxuXG5cbmNvbW1hbmQgKCBcIm9wZW4tY29udGV4dGFsLW1lbnVcIiwgKCBlOiBmYWJyaWMuSUV2ZW50ICkgPT5cbntcbiAgICAgY29udGV4dHVhbE1lbnUuc2hvdyAoIGUucG9pbnRlci54LCBlLnBvaW50ZXIueSApXG59IClcblxuY29tbWFuZCAoIFwiY2xvc2UtY29udGV4dGFsLW1lbnVcIiwgKCkgPT5cbntcbiAgICAgY29udGV4dHVhbE1lbnUuaGlkZSAoKVxufSlcblxuY29tbWFuZCAoIFwiYWRkLXNraWxsXCIsICggdGl0bGUgKSA9Plxue1xuICAgICBjb25zb2xlLmxvZyAoIFwiQWRkIHNraWxsXCIgKVxufSlcblxuY29tbWFuZCAoIFwiYWRkLXBlcnNvblwiLCAoIG5hbWUgKSA9Plxue1xuXG59KVxuXG5jb21tYW5kICggXCJ6b29tLWV4dGVuZHNcIiwgKCkgPT5cbntcbiAgICAgYXJlYS56b29tICgpXG59KVxuXG5jb21tYW5kICggXCJ6b29tLXRvXCIsICggc2hhcGUgKSA9Plxue1xuICAgICAvLyBhcmVhLnpvb20gKCBzaGFwZSApXG4gICAgIC8vIGFyZWEuaXNvbGF0ZSAoIHNoYXBlIClcbn0pXG5cbmNvbW1hbmQgKCBcInBhY2stdmlld1wiLCAoKSA9Plxue1xuICAgICBhcmVhLnBhY2sgKClcbn0pXG4iLCJcbmltcG9ydCAqIGFzIGRiIGZyb20gXCIuLi8uLi9kYXRhLmpzXCJcbmltcG9ydCB7IFNoYXBlIH0gZnJvbSBcIi4vc2hhcGUuanNcIlxuXG5leHBvcnQgdHlwZSBCYWRnZVBvc2l0aW9uID0geyBhbmdsZTogbnVtYmVyLCBvZmZzZXQ6IG51bWJlciB9XG5cbmV4cG9ydCBjbGFzcyBCYWRnZSBleHRlbmRzIFNoYXBlXG57XG4gICAgIHJlYWRvbmx5IG93bmVyID0gdW5kZWZpbmVkIGFzIFNoYXBlXG5cbiAgICAgcmVhZG9ubHkgcG9zaXRpb24gPSB7IGFuZ2xlOiAwLCBvZmZzZXQ6IDAgfVxuXG4gICAgIGNvbnN0cnVjdG9yICggb3B0aW9uczogJFNoYXBlIClcbiAgICAge1xuICAgICAgICAgIHN1cGVyICggb3B0aW9ucyApXG4gICAgIC8vIH1cbiAgICAgLy8gaW5pdCAoKVxuICAgICAvLyB7XG4gICAgIC8vICAgICAgc3VwZXIuaW5pdCAoKVxuXG4gICAgICAgICAgY29uc3QgeyBncm91cCB9ID0gdGhpc1xuXG4gICAgICAgICAgY29uc3QgZW50aXR5ID0gZGIuZ2V0Tm9kZSA8JEJhZGdlPiAoIHRoaXMuY29uZmlnLmRhdGEgKVxuXG4gICAgICAgICAgY29uc3QgdGV4dCA9IG5ldyBmYWJyaWMuVGV4dGJveCAoIGVudGl0eS5lbW9qaSB8fCBcIlhcIiwge1xuICAgICAgICAgICAgICAgZm9udFNpemU6IHRoaXMuZGlzcGxheVNpemUgKCksXG4gICAgICAgICAgICAgICBvcmlnaW5YIDogXCJjZW50ZXJcIixcbiAgICAgICAgICAgICAgIG9yaWdpblkgOiBcImNlbnRlclwiLFxuICAgICAgICAgICAgICAgbGVmdCAgICA6IGdyb3VwLmxlZnQsXG4gICAgICAgICAgICAgICB0b3AgICAgIDogZ3JvdXAudG9wLFxuICAgICAgICAgIH0pXG5cbiAgICAgICAgICBncm91cC5hZGRXaXRoVXBkYXRlICggdGV4dCApXG4gICAgIH1cblxuICAgICBkaXNwbGF5U2l6ZSAoKVxuICAgICB7XG4gICAgICAgICAgcmV0dXJuIDIwXG4gICAgIH1cblxuICAgICBhdHRhY2ggKCB0YXJnZXQ6IFNoYXBlLCBwb3MgPSB7fSBhcyBCYWRnZVBvc2l0aW9uIClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHsgcmFuZG9tLCBQSSB9ID0gTWF0aFxuXG4gICAgICAgICAgaWYgKCAhIGlzRmluaXRlICggcG9zLmFuZ2xlICkgKVxuICAgICAgICAgICAgICAgcG9zLmFuZ2xlID0gcmFuZG9tICgpICogUEkgKiAyXG5cbiAgICAgICAgICBpZiAoICEgaXNGaW5pdGUgKCBwb3Mub2Zmc2V0ICkgKVxuICAgICAgICAgICAgICAgcG9zLm9mZnNldCA9IDAuMVxuXG4gICAgICAgICAgOyh0aGlzLnBvc2l0aW9uIGFzIEJhZGdlUG9zaXRpb24pID0geyAuLi4gcG9zIH1cblxuICAgICAgICAgIGlmICggdGhpcy5vd25lciAhPSB1bmRlZmluZWQgKVxuICAgICAgICAgICAgICAgdGFyZ2V0Lmdyb3VwLnJlbW92ZSAoIHRoaXMuZ3JvdXAgKVxuXG4gICAgICAgICAgdGFyZ2V0Lmdyb3VwLmFkZCAoIHRoaXMuZ3JvdXAgKVxuXG4gICAgICAgICAgOyh0aGlzLm93bmVyIGFzIFNoYXBlKSA9IHRhcmdldFxuXG4gICAgICAgICAgdGhpcy51cGRhdGVQb3NpdGlvbiAoKVxuICAgICB9XG5cbiAgICAgdXBkYXRlUG9zaXRpb24gKClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHsgcG9zaXRpb246IHBvcywgb3duZXIgfSA9IHRoaXNcblxuICAgICAgICAgIGlmICggb3duZXIgPT0gdW5kZWZpbmVkIClcbiAgICAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgICAgY29uc3QgeyByYW5kb20sIFBJLCBjb3MsIHNpbiB9ID0gTWF0aFxuXG4gICAgICAgICAgY29uc3QgcmFkICAgID0gcG9zLmFuZ2xlIHx8IHJhbmRvbSAoKSAqIFBJICogMlxuICAgICAgICAgIGNvbnN0IHggICAgICA9IHNpbiAocmFkKVxuICAgICAgICAgIGNvbnN0IHkgICAgICA9IGNvcyAocmFkKVxuICAgICAgICAgIGNvbnN0IHMgICAgICA9IG93bmVyLmRpc3BsYXlTaXplICgpIC8gMlxuICAgICAgICAgIGNvbnN0IG9mZnNldCA9IHR5cGVvZiBwb3Mub2Zmc2V0ID09IFwibnVtYmVyXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICA/IHRoaXMuZGlzcGxheVNpemUgKCkgKiBwb3Mub2Zmc2V0XG4gICAgICAgICAgICAgICAgICAgICAgICAgOiB0aGlzLmRpc3BsYXlTaXplICgpICogMC4xXG5cbiAgICAgICAgICB0aGlzLnNldFBvc2l0aW9uICggeCAqIChzICsgb2Zmc2V0KSwgeSAqIChzICsgb2Zmc2V0KSApXG4gICAgIH1cbn1cbiIsIlxuaW1wb3J0IHsgR2VvbWV0cnkgfSBmcm9tIFwiLi4vLi4vLi4vTGliL2luZGV4LmpzXCJcbmltcG9ydCB7IGdldEFzcGVjdCB9IGZyb20gXCIuLi9kYi5qc1wiXG5pbXBvcnQgeyBTaGFwZSB9IGZyb20gXCIuL3NoYXBlLmpzXCJcblxuZXhwb3J0IGNsYXNzIENvbnRhaW5lciA8JCBleHRlbmRzICRTaGFwZSA8JEdyb3VwPiA9ICRTaGFwZSA8JEdyb3VwPj4gZXh0ZW5kcyBTaGFwZSA8JD5cbntcbiAgICAgcmVhZG9ubHkgY2hpbGRyZW46IFNoYXBlIFtdXG5cbiAgICAgZGlzcGxheV9zaXplID0gMVxuXG4gICAgIGNvbnN0cnVjdG9yICggb3B0aW9uczogJCApXG4gICAgIHtcbiAgICAgICAgICBzdXBlciAoIG9wdGlvbnMgKVxuICAgICAgICAgIHRoaXMuY2hpbGRyZW4gPSBbXVxuICAgICAvLyB9XG5cbiAgICAgLy8gaW5pdCAoKVxuICAgICAvLyB7XG4gICAgIC8vICAgICAgc3VwZXIuaW5pdCAoKVxuXG4gICAgICAgICAgY29uc3QgZW50aXR5ID0gdGhpcy5jb25maWcuZGF0YVxuXG4gICAgICAgICAgLy9mb3IgKCBjb25zdCBjaGlsZCBvZiBPYmplY3QudmFsdWVzICggZW50aXR5LmNoaWxkcmVuICkgKVxuICAgICAgICAgIGZvciAoIGNvbnN0IGNoaWxkIG9mIE9iamVjdC52YWx1ZXMgKCBlbnRpdHkuaXRlbXMgKSApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgY29uc3QgYSA9IGdldEFzcGVjdCAoIGNoaWxkIClcbiAgICAgICAgICAgICAgIC8vYS5pbml0ICgpXG4gICAgICAgICAgICAgICB0aGlzLmFkZCAoIGEgKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHRoaXMucGFjayAoKVxuICAgICB9XG5cbiAgICAgZGlzcGxheVNpemUgKClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IHRoaXMuY29uZmlnXG5cbiAgICAgICAgICB2YXIgc2l6ZSA9ICh0aGlzLmRpc3BsYXlfc2l6ZSArIGNvbmZpZy5zaXplT2Zmc2V0KSAqIGNvbmZpZy5zaXplRmFjdG9yXG5cbiAgICAgICAgICBpZiAoIHNpemUgPCBjb25maWcubWluU2l6ZSApXG4gICAgICAgICAgICAgICBzaXplID0gY29uZmlnLm1pblNpemVcblxuICAgICAgICAgIHJldHVybiBzaXplIHx8IDFcbiAgICAgfVxuXG4gICAgIGFkZCAoIGNoaWxkOiBTaGFwZSApXG4gICAgIHtcbiAgICAgICAgICBjb25zdCB7IGdyb3VwIH0gPSB0aGlzXG5cbiAgICAgICAgICB0aGlzLmNoaWxkcmVuLnB1c2ggKCBjaGlsZCApXG5cbiAgICAgICAgICBpZiAoIGdyb3VwIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBncm91cC5hZGQgKCBjaGlsZC5ncm91cCApXG4gICAgICAgICAgICAgICBncm91cC5zZXRDb29yZHMgKClcbiAgICAgICAgICB9XG4gICAgIH1cblxuICAgICBwYWNrICgpXG4gICAgIHtcbiAgICAgICAgICBjb25zdCB7IGdyb3VwLCBjaGlsZHJlbiwgY29uZmlnIH0gPSB0aGlzXG5cbiAgICAgICAgICBjb25zdCBwb3NpdGlvbnMgPSBbXSBhcyBHZW9tZXRyeS5DaXJjbGUgW11cblxuICAgICAgICAgIGZvciAoIGNvbnN0IGMgb2YgY2hpbGRyZW4gKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNvbnN0IGcgPSBjLmdyb3VwXG4gICAgICAgICAgICAgICBjb25zdCByID0gKGcud2lkdGggPiBnLmhlaWdodCA/IGcud2lkdGggOiBnLmhlaWdodCkgLyAyXG4gICAgICAgICAgICAgICBwb3NpdGlvbnMucHVzaCAoIHsgeDogZy5sZWZ0LCB5OiBnLnRvcCwgcjogciArIDYgfSApXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29uc3Qgc2l6ZSA9ICBHZW9tZXRyeS5wYWNrRW5jbG9zZSAoIHBvc2l0aW9ucyApICogMlxuXG4gICAgICAgICAgZm9yICggdmFyIGkgPSAwIDsgaSA8IGNoaWxkcmVuLmxlbmd0aCA7IGkrKyApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgY29uc3QgZyA9IGNoaWxkcmVuIFtpXS5ncm91cFxuICAgICAgICAgICAgICAgY29uc3QgcCA9IHBvc2l0aW9ucyBbaV1cblxuICAgICAgICAgICAgICAgZy5sZWZ0ID0gcC54XG4gICAgICAgICAgICAgICBnLnRvcCAgPSBwLnlcblxuICAgICAgICAgICAgICAgZ3JvdXAuYWRkICggZyApXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdGhpcy5kaXNwbGF5X3NpemUgPSBzaXplICsgY29uZmlnLnNpemVPZmZzZXRcblxuICAgICAgICAgIHRoaXMudXBkYXRlU2l6ZSAoKVxuICAgICB9XG5cbn1cblxuIiwiXG5cbmV4cG9ydCB7IGRlZmluZUFzcGVjdCwgZ2V0QXNwZWN0LCBzZXRBc3BlY3QgfSBmcm9tIFwiLi9kYi5qc1wiXG5cbmV4cG9ydCB7IEdlb21ldHJ5IH0gZnJvbSBcIi4vZ2VvbWV0cnkuanNcIlxuZXhwb3J0IHsgU2hhcGUgfSBmcm9tIFwiLi9FbGVtZW50L3NoYXBlLmpzXCJcbmV4cG9ydCB7IE5vdGUgfSAgICAgIGZyb20gXCIuL0VsZW1lbnQvbm90ZS5qc1wiXG5leHBvcnQgeyBCYWRnZSB9ICAgICBmcm9tIFwiLi9FbGVtZW50L2JhZGdlLmpzXCJcbmV4cG9ydCB7IENvbnRhaW5lciB9IGZyb20gXCIuL0VsZW1lbnQvZ3JvdXAuanNcIlxuXG5cbmltcG9ydCB7IGdldE5vZGV9IGZyb20gXCIuLi9kYXRhLmpzXCJcbmltcG9ydCB7IGdldEFzcGVjdCwgZGVmaW5lQXNwZWN0LCBzZXRBc3BlY3QgfSBmcm9tIFwiLi9kYi5qc1wiXG5pbXBvcnQgeyBTaGFwZSB9IGZyb20gXCIuL0VsZW1lbnQvc2hhcGUuanNcIlxuaW1wb3J0IHsgQ29udGFpbmVyIH0gZnJvbSBcIi4vRWxlbWVudC9ncm91cC5qc1wiXG5pbXBvcnQgeyBCYWRnZSB9ICAgICBmcm9tIFwiLi9FbGVtZW50L2JhZGdlLmpzXCJcbmltcG9ydCB7IGNvbW1hbmQgfSBmcm9tIFwiLi4vLi4vVWkvaW5kZXguanNcIlxuXG5cbmRlZmluZUFzcGVjdCAoIFNoYXBlICAgICwgXCJwZXJzb25cIiAvKiAsIHsgb25DcmVhdGU6ICgpID0+IC4uLiwgb25Ub3VjaDogKCkgPT4gLi4uIH0gKi8gKVxuZGVmaW5lQXNwZWN0ICggQ29udGFpbmVyLCBcInNraWxsXCIgKVxuZGVmaW5lQXNwZWN0ICggQmFkZ2UgICAgLCBcImJhZGdlXCIgKVxuXG5zZXRBc3BlY3QgPCRTaGFwZT4gKHtcbiAgICAgdHlwZSAgIDogXCJwZXJzb25cIixcbiAgICAgaWQgICAgIDogdW5kZWZpbmVkLFxuXG4gICAgIGRhdGEgICA6IHVuZGVmaW5lZCxcblxuICAgICBzaGFwZSAgOiBcImNpcmNsZVwiLFxuXG4gICAgIHg6IDAsXG4gICAgIHk6IDAsXG5cbiAgICAgbWluU2l6ZSAgICA6IDMwLFxuICAgICBzaXplRmFjdG9yOiAxLFxuICAgICBzaXplT2Zmc2V0OiAwLFxuXG4gICAgIGJvcmRlckNvbG9yICAgICA6IFwiIzAwYzBhYVwiLFxuICAgICBib3JkZXJXaWR0aCAgICAgOiA0LFxuICAgICBiYWNrZ3JvdW5kQ29sb3IgOiBcInRyYW5zcGFyZW50XCIsXG4gICAgIGJhY2tncm91bmRJbWFnZSA6IHVuZGVmaW5lZCxcbiAgICAgYmFja2dyb3VuZFJlcGVhdDogZmFsc2UsXG5cbiAgICAgb25DcmVhdGUgICA6ICggcGVyc29uOiAkUGVyc29uLCBhc3BlY3QgKSA9PlxuICAgICB7XG4gICAgICAgICAgYXNwZWN0LnNldEJhY2tncm91bmQgKHtcbiAgICAgICAgICAgICAgIGJhY2tncm91bmRJbWFnZTogcGVyc29uLmF2YXRhcixcbiAgICAgICAgICAgICAgIHNoYXBlOiBwZXJzb24uaXNDYXB0YWluID8gXCJzcXVhcmVcIiA6IFwiY2lyY2xlXCIsXG4gICAgICAgICAgfSBhcyBhbnkpXG4gICAgIH0sXG4gICAgIG9uRGVsZXRlOiB1bmRlZmluZWQsXG4gICAgIG9uVG91Y2g6IHVuZGVmaW5lZCxcbn0pXG5cbnNldEFzcGVjdCA8JFNoYXBlPiAoe1xuICAgICB0eXBlICAgOiBcInNraWxsXCIsXG4gICAgIGlkICAgICA6IHVuZGVmaW5lZCxcblxuICAgICBkYXRhOiB1bmRlZmluZWQsXG5cbiAgICAgc2hhcGU6IFwiY2lyY2xlXCIsXG4gICAgIHg6IDAsXG4gICAgIHk6IDAsXG5cbiAgICAgYm9yZGVyQ29sb3IgICAgIDogXCIjZjFiYzMxXCIsXG4gICAgIGJvcmRlcldpZHRoICAgICA6IDgsXG4gICAgIGJhY2tncm91bmRDb2xvciA6IFwiI0ZGRkZGRlwiLFxuICAgICBiYWNrZ3JvdW5kSW1hZ2UgOiB1bmRlZmluZWQsXG4gICAgIGJhY2tncm91bmRSZXBlYXQ6IGZhbHNlLFxuICAgICBtaW5TaXplICAgICAgICAgOiA1MCxcbiAgICAgc2l6ZU9mZnNldCAgICAgIDogMTAsXG4gICAgIHNpemVGYWN0b3IgICAgICA6IDEsXG5cbiAgICAgb25DcmVhdGUgKCBza2lsbDogJFNraWxsLCBhc3BlY3QgKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgZGF0YSA9IGdldE5vZGUgKHtcbiAgICAgICAgICAgICAgIHR5cGU6IFwiYmFkZ2VcIixcbiAgICAgICAgICAgICAgIGlkICA6IHNraWxsLmljb24sXG4gICAgICAgICAgfSlcblxuICAgICAgICAgIGNvbnN0IGJhZGdlID0gZ2V0QXNwZWN0IDxCYWRnZT4gKCBkYXRhIClcblxuICAgICAgICAgIC8vYmFkZ2UuaW5pdCAoKVxuICAgICAgICAgIGJhZGdlLmF0dGFjaCAoIGFzcGVjdCApXG4gICAgIH0sXG5cbiAgICAgb25Ub3VjaCAoIHNoYXBlIClcbiAgICAge1xuICAgICAgICAgIC8vIGNvbnN0IHNraWxsID0gZ2V0Tm9kZSA8JFNraWxsPiAoe1xuICAgICAgICAgIC8vICAgICAgdHlwZTogc2hhcGUuY29uZmlnLnR5cGUsXG4gICAgICAgICAgLy8gICAgICBpZCAgOiBzaGFwZS5jb25maWcuaWRcbiAgICAgICAgICAvLyB9KVxuICAgICAgICAgIC8vIGNvbW1hbmQgKCBcIm9wZW4taW5mb3MtcGFuZWxcIiwgc2tpbGwgKS5ydW4gKClcblxuICAgICAgICAgIGNvbW1hbmQgKCBcIm9wZW4taW5mb3MtcGFuZWxcIiApLnJ1biAoKVxuICAgICB9LFxuXG4gICAgIG9uRGVsZXRlOiB1bmRlZmluZWRcbn0pXG5cbnNldEFzcGVjdCA8JFNoYXBlPiAoe1xuICAgICB0eXBlICAgOiBcImJhZGdlXCIsXG4gICAgIGlkICAgICA6IHVuZGVmaW5lZCxcblxuICAgICBkYXRhOiB1bmRlZmluZWQsXG5cbiAgICAgeCAgICAgICAgIDogMCxcbiAgICAgeSAgICAgICAgIDogMCxcbiAgICAgbWluU2l6ZSAgIDogMSxcbiAgICAgc2l6ZUZhY3RvcjogMSxcbiAgICAgc2l6ZU9mZnNldDogMCxcblxuICAgICBzaGFwZSAgICAgICAgICAgOiBcImNpcmNsZVwiLFxuICAgICBib3JkZXJDb2xvciAgICAgOiBcImdyYXlcIixcbiAgICAgYm9yZGVyV2lkdGggICAgIDogMCxcblxuICAgICBiYWNrZ3JvdW5kQ29sb3IgOiBcInRyYW5zcGFyZW50XCIsXG4gICAgIGJhY2tncm91bmRJbWFnZSA6IHVuZGVmaW5lZCxcbiAgICAgYmFja2dyb3VuZFJlcGVhdDogZmFsc2UsXG5cbiAgICAgb25DcmVhdGUgICAgICAgIDogdW5kZWZpbmVkLFxuICAgICBvbkRlbGV0ZSAgICAgICAgOiB1bmRlZmluZWQsXG4gICAgIG9uVG91Y2ggICAgICAgICA6IHVuZGVmaW5lZCxcbn0pXG4iLCIvLy8gPHJlZmVyZW5jZSB0eXBlcz1cImZha2VyXCIgLz5cbmRlY2xhcmUgY29uc3QgZmFrZXI6IEZha2VyLkZha2VyU3RhdGljXG5cbmltcG9ydCAqIGFzIGFwcCBmcm9tIFwiLi4vQXBwbGljYXRpb24vaW5kZXguanNcIlxuXG5jb25zdCByYW5kb21JbnQgPSAobWluOiBudW1iZXIsIG1heDogbnVtYmVyKSA9Plxue1xuICAgICByZXR1cm4gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogKG1heCAtIG1pbiArIDEpKSArIG1pbjtcbn1cblxuY29uc3QgYXJlYSA9IGFwcC5hcmVhXG5jb25zdCB2aWV3ID0gYXJlYS5jcmVhdGVWaWV3ICggXCJjb21ww6l0YW5jZXNcIiApXG5hcmVhLnVzZSAoIHZpZXcgKVxuXG4vLyBJY2kgb24gYWpvdXRlIGRlcyBwZXJzb25uZXMgw6AgbOKAmWFwcGxpY2F0aW9uLlxuXG5jb25zdCBwZXJzb25OYW1lcyA9IFtdXG5mb3IgKCB2YXIgaSA9IDEgOyBpIDw9IDIwIDsgaSsrIClcbntcbiAgICAgYXBwLnNldE5vZGUgPCRQZXJzb24+ICh7XG4gICAgICAgICAgdHlwZSAgICAgOiBcInBlcnNvblwiLFxuICAgICAgICAgIGlkICAgICAgIDogXCJ1c2VyXCIgKyBpLFxuICAgICAgICAgIGZpcnN0TmFtZTogZmFrZXIubmFtZS5maXJzdE5hbWUgKCksXG4gICAgICAgICAgbGFzdE5hbWUgOiBmYWtlci5uYW1lLmxhc3ROYW1lICgpLFxuICAgICAgICAgIGF2YXRhciAgIDogYC4vYXZhdGFycy9mICgke2l9KS5qcGdgLFxuICAgICAgICAgIGlzQ2FwdGFpbjogcmFuZG9tSW50ICgwLDQpID09IDEgLy9pICUgNCA9PSAwLFxuICAgICB9KVxuXG4gICAgIGFwcC5zZXROb2RlIDwkUGVyc29uPiAoe1xuICAgICAgICAgIHR5cGUgICAgIDogXCJwZXJzb25cIixcbiAgICAgICAgICBpZCAgICAgICA6IFwidXNlclwiICsgKDIwICsgaSksXG4gICAgICAgICAgZmlyc3ROYW1lOiBmYWtlci5uYW1lLmZpcnN0TmFtZSAoKSxcbiAgICAgICAgICBsYXN0TmFtZSA6IGZha2VyLm5hbWUubGFzdE5hbWUgKCksXG4gICAgICAgICAgYXZhdGFyICAgOiBgLi9hdmF0YXJzL2ggKCR7aX0pLmpwZ2AsXG4gICAgICAgICAgaXNDYXB0YWluOiByYW5kb21JbnQgKDAsNCkgPT0gMSAvLyAoMjAgKyBpKSAlIDQgPT0gMCxcbiAgICAgfSlcblxuICAgICBwZXJzb25OYW1lcy5wdXNoICggXCJ1c2VyXCIgKyBpLCBcInVzZXJcIiArICgyMCArIGkpIClcblxuICAgICAvLyBhcmVhLmFkZCAoIFwicGVyc29uXCIsIFwidXNlclwiICsgaSApXG4gICAgIC8vIGFyZWEuYWRkICggXCJwZXJzb25cIiwgXCJ1c2VyXCIgKyAoaSArIDIwKSApXG59XG5cbi8vIEJhZGdlc1xuXG4vLyBodHRwczovL2RyaXZlLmdvb2dsZS5jb20vZHJpdmUvZm9sZGVycy8xS3dXbDlHX0E4djkxTkxYQXBqWkdIQ2ZueF9tbmZNRTRcbi8vIGh0dHBzOi8vcmVjb25uYWl0cmUub3BlbnJlY29nbml0aW9uLm9yZy9yZXNzb3VyY2VzL1xuLy8gaHR0cHM6Ly93d3cubGV0dWRpYW50LmZyL2VkdWNwcm9zL2FjdHVhbGl0ZS9sZXMtb3Blbi1iYWRnZXMtdW4tY29tcGxlbWVudC1hdXgtZGlwbG9tZXMtdW5pdmVyc2l0YWlyZXMuaHRtbFxuXG4vLyBodHRwczovL3d3dy5lY2hvc2NpZW5jZXMtbm9ybWFuZGllLmZyL2NvbW11bmF1dGVzL2xlLWRvbWUvYXJ0aWNsZXMvYmFkZ2UtZG9tZVxuXG5jb25zdCBiYWRnZVByZXNldHMgPSB7IC8vIFBhcnRpYWwgPCRCYWRnZT5cbiAgICAgZGVmYXVsdCAgICAgICA6IHsgaWQ6IFwiZGVmYXVsdFwiICAgICAgLCBlbW9qaTogXCLwn6aBXCIgfSxcbiAgICAgaGF0ICAgICAgICAgICA6IHsgaWQ6IFwiaGF0XCIgICAgICAgICAgLCBlbW9qaTogXCLwn46pXCIgfSxcbiAgICAgc3RhciAgICAgICAgICA6IHsgaWQ6IFwic3RhclwiICAgICAgICAgLCBlbW9qaTogXCLirZBcIiB9LFxuICAgICBjbG90aGVzICAgICAgIDogeyBpZDogXCJjbG90aGVzXCIgICAgICAsIGVtb2ppOiBcIvCfkZVcIiB9LFxuICAgICBlY29sb2d5ICAgICAgIDogeyBpZDogXCJlY29sb2d5XCIgICAgICAsIGVtb2ppOiBcIvCfkqdcIiB9LFxuICAgICBwcm9ncmFtbWluZyAgIDogeyBpZDogXCJwcm9ncmFtbWluZ1wiICAsIGVtb2ppOiBcIvCfkr5cIiB9LFxuICAgICBjb21tdW5pY2F0aW9uIDogeyBpZDogXCJjb21tdW5pY2F0aW9uXCIsIGVtb2ppOiBcIvCfk6JcIiB9LFxuICAgICBjb25zdHJ1Y3Rpb24gIDogeyBpZDogXCJjb25zdHJ1Y3Rpb25cIiAsIGVtb2ppOiBcIvCflKhcIiB9LFxuICAgICBiaW9sb2d5ICAgICAgIDogeyBpZDogXCJiaW9sb2d5XCIgICAgICAsIGVtb2ppOiBcIvCflKxcIiB9LFxuICAgICByb2JvdGljICAgICAgIDogeyBpZDogXCJyb2JvdGljXCIgICAgICAsIGVtb2ppOiBcIvCfpJZcIiB9LFxuICAgICBnYW1lICAgICAgICAgIDogeyBpZDogXCJnYW1lXCIgICAgICAgICAsIGVtb2ppOiBcIvCfpKFcIiB9LFxuICAgICBtdXNpYyAgICAgICAgIDogeyBpZDogXCJtdXNpY1wiICAgICAgICAsIGVtb2ppOiBcIvCfpYFcIiB9LFxuICAgICBsaW9uICAgICAgICAgIDogeyBpZDogXCJsaW9uXCIgICAgICAgICAsIGVtb2ppOiBcIvCfpoFcIiB9LFxuICAgICB2b2x0YWdlICAgICAgIDogeyBpZDogXCJ2b2x0YWdlXCIgICAgICAsIGVtb2ppOiBcIuKaoVwiIH0sXG59XG5cbmZvciAoIGNvbnN0IG5hbWUgaW4gYmFkZ2VQcmVzZXRzIClcbiAgICAgYXBwLnNldE5vZGUgKHsgY29udGV4dDogXCJjb25jZXB0LWRhdGFcIiwgdHlwZTogXCJiYWRnZVwiLCAuLi4gYmFkZ2VQcmVzZXRzIFtuYW1lXSB9KVxuXG4vLyBTa2lsbHNcblxuZm9yICggY29uc3QgbmFtZSBpbiBiYWRnZVByZXNldHMgKVxue1xuICAgICBjb25zdCBwZW9wbGUgPSBbXSBhcyAkUGVyc29uIFtdXG5cbiAgICAgZm9yICggdmFyIGogPSByYW5kb21JbnQgKCAwLCA2ICkgOyBqID4gMCA7IGotLSApXG4gICAgIHtcbiAgICAgICAgICBjb25zdCBuYW1lID0gcGVyc29uTmFtZXMuc3BsaWNlICggcmFuZG9tSW50ICggMSwgcGVyc29uTmFtZXMubGVuZ3RoICksIDEgKSBbMF1cblxuICAgICAgICAgIGlmICggbmFtZSApXG4gICAgICAgICAgICAgICBwZW9wbGUucHVzaCAoIGFwcC5nZXROb2RlIDwkUGVyc29uPiAoIFwicGVyc29uXCIsIG5hbWUgKSApXG4gICAgIH1cblxuICAgICBhcHAuc2V0Tm9kZSA8JFNraWxsPiAoe1xuICAgICAgICAgIGNvbnRleHQ6IFwiY29uY2VwdC1kYXRhXCIsXG4gICAgICAgICAgdHlwZSAgIDogXCJza2lsbFwiLFxuICAgICAgICAgIGlkICAgICA6IG5hbWUsXG4gICAgICAgICAgaWNvbiAgIDogbmFtZSxcbiAgICAgICAgICBpdGVtcyAgOiBwZW9wbGVcbiAgICAgfSlcblxufVxuXG4vL1xuXG5mb3IgKCBjb25zdCBuYW1lIGluIGJhZGdlUHJlc2V0cyApXG4gICAgIGFyZWEuYWRkICggXCJza2lsbFwiLCBuYW1lIClcblxuLy8gTm90ZXNcblxuLy8gY29uc3Qgbm90ZSA9ICBuZXcgQi5Ob3RlICh7XG4vLyAgICAgIHRleHQ6IFwiQSBub3RlIC4uLlwiLFxuLy8gfSlcbi8vIGFyZWEuYWRkICggQXNwZWN0LmNyZWF0ZSAoIG5vdGUgKSApXG5cblxuYXJlYS5wYWNrICgpXG5hcmVhLnpvb20gKClcblxuXG4vLyBDbHVzdGVyIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vL1xuLy8gY29uc3QgdDEgPSBuZXcgZmFicmljLlRleHRib3ggKCBcIkVkaXRhYmxlID9cIiwge1xuLy8gICAgICB0b3A6IDUwLFxuLy8gICAgICBsZWZ0OiAzMDAsXG4vLyAgICAgIGZvbnRTaXplOiAzMCxcbi8vICAgICAgc2VsZWN0YWJsZTogdHJ1ZSxcbi8vICAgICAgZWRpdGFibGU6IHRydWUsXG4vLyAgICAgIG9yaWdpblg6IFwiY2VudGVyXCIsXG4vLyAgICAgIG9yaWdpblk6IFwiY2VudGVyXCIsXG4vLyB9KVxuLy8gY29uc3QgcjEgPSBuZXcgZmFicmljLlJlY3QgKHtcbi8vICAgICAgdG9wICAgOiAwLFxuLy8gICAgICBsZWZ0ICA6IDMwMCxcbi8vICAgICAgd2lkdGggOiA1MCxcbi8vICAgICAgaGVpZ2h0OiA1MCxcbi8vICAgICAgZmlsbCAgOiBcImJsdWVcIixcbi8vICAgICAgc2VsZWN0YWJsZTogdHJ1ZSxcbi8vICAgICAgb3JpZ2luWDogXCJjZW50ZXJcIixcbi8vICAgICAgb3JpZ2luWTogXCJjZW50ZXJcIixcbi8vIH0pXG4vLyAkYXBwLl9sYXlvdXQuYXJlYS5hZGQgKHQxKVxuLy8gJGFwcC5fbGF5b3V0LmFyZWEuYWRkIChyMSlcbi8vIHQxW1wiY2x1c3RlclwiXSA9IFsgcjEgXVxuLy8gcjFbXCJjbHVzdGVyXCJdID0gWyB0MSBdXG5cbiJdLCJuYW1lcyI6WyJOb2RlIiwiZGVmYXVsdENvbmZpZyIsImRyYWdnYWJsZSIsIlVpLmRyYWdnYWJsZSIsIkNzcy5nZXRVbml0IiwiRmFjdG9yeSIsIkdlb21ldHJ5IiwiQ09OVEVYVCIsIm5vcm1hbGl6ZSIsImRiLmdldE5vZGUiLCJhc3BlY3QuZ2V0QXNwZWN0IiwiR2VvbWV0cnkucGFja0VuY2xvc2UiLCJkYiIsImZhY3RvcnkiLCJTdmcuY3JlYXRlU3ZnU2hhcGUiLCJ1aS5tYWtlIiwidWkucGljayIsIkNvbnRhaW5lciIsImFyZWEiLCJhcHAuYXJlYSIsImFwcC5zZXROb2RlIiwiYXBwLmdldE5vZGUiXSwibWFwcGluZ3MiOiI7OzthQWdDZ0IscUJBQXFCLENBQUcsT0FBcUI7UUFFekQsTUFBTSxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsSUFBSSxDQUFBO1FBRTdCLE1BQU0sQ0FBQyxHQUFVLE9BQU8sQ0FBQyxDQUFDLElBQVcsRUFBRSxDQUFBO1FBQ3ZDLE1BQU0sS0FBSyxHQUFNLE9BQU8sQ0FBQyxLQUFLLElBQU8sRUFBRSxDQUFBO1FBQ3ZDLE1BQU0sUUFBUSxHQUFHLE9BQU8sQ0FBQyxRQUFRLElBQUksQ0FBQyxDQUFBO1FBRXRDLE1BQU0sTUFBTSxHQUFHLEVBQWEsQ0FBQTtRQUU1QixNQUFNLENBQUMsR0FBTyxDQUFDLEdBQUcsRUFBRSxHQUFHLEtBQUssQ0FBQTtRQUM1QixNQUFNLEtBQUssR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBRyxDQUFDLEdBQUcsR0FBRyxDQUFFLENBQUE7UUFDckMsTUFBTSxJQUFJLEdBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxLQUFLLENBQUE7UUFDM0Is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R0FBRyxFQUFFLEVBQ1osRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQ1osRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQ1osRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBRVosRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxFQUNoQyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxFQUNyQyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxFQUVyQyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxFQUN0QixFQUFFLEdBQUcsQ0FBRSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEtBQU8sRUFBRSxHQUFHLENBQUMsQ0FBRSxHQUFHLEVBQUUsRUFDNUMsRUFBRSxHQUFHLENBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxJQUFLLEVBQUUsRUFDL0IsRUFBRSxHQUFHLENBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxLQUFPLEVBQUUsR0FBRyxDQUFDLENBQUUsR0FBRyxFQUFFLEVBQzVDLEVBQUUsR0FBRyxDQUFFLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsSUFBSyxFQUFFLEVBRS9CLENBQUMsR0FBSSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUMxQixDQUFDLEdBQUksQ0FBQyxJQUFLLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUUsRUFDbkMsQ0FBQyxHQUFJLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcs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
