/*
example:
https://prezi.com/p/9jqe2wkfhhky/la-bulloterie-tpcmn/
https://movilab.org/index.php?title=Utilisateur:Aur%C3%A9lienMarty
*/
//import * as fabric from "fabric/fabric-impl.js"
import { Geometry } from "../../../Lib/index.js";
import * as aspect from "../../../Application/Aspect/db.js";
import * as db from "../../../Application/Data/db.js";
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
export class Area {
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
            const node = db.getData(...arguments);
            const shp = aspect.getAspect(node);
            active.children.push(shp);
            fcanvas.add(shp.group);
        }
        else
            for (const s of arguments) {
                const shp = aspect.getAspect(s);
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
        Geometry.packEnclose(positions) * 2;
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
            thumbnail;
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
                    const element = aspect.getAspect(fevent.target);
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
                    const element = aspect.getAspect(fevent.target);
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
                const element = aspect.getAspect(fevent.target);
                if (element)
                    this.onOverObject(element);
            }
        });
        page.on("mouse:out", fevent => {
            this.overFObject = undefined;
            if (this.onOutObject) {
                const element = aspect.getAspect(fevent.target);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXJlYS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL1VpL0NvbXBvbmVudC9BcmVhL2FyZWEudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0E7Ozs7RUFJRTtBQUVGLGlEQUFpRDtBQUVqRCxPQUFPLEVBQUUsUUFBUSxFQUFFLE1BQU0sdUJBQXVCLENBQUE7QUFHaEQsT0FBTyxLQUFLLE1BQU0sTUFBTSxtQ0FBbUMsQ0FBQTtBQUMzRCxPQUFPLEtBQUssRUFBRSxNQUFNLGlDQUFpQyxDQUFBO0FBRXJELE1BQU0sQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLE9BQU8sR0FBYyxDQUFDLENBQUE7QUFDOUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsYUFBYSxHQUFRLEtBQUssQ0FBQTtBQUNsRCxNQUFNLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxXQUFXLEdBQVUsSUFBSSxDQUFBO0FBQ2pELE1BQU0sQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLFVBQVUsR0FBVyxJQUFJLENBQUE7QUFDakQsTUFBTSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsZ0JBQWdCLEdBQUssS0FBSyxDQUFBO0FBQ2xELE1BQU0sQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLGtCQUFrQixHQUFHLEtBQUssQ0FBQTtBQUNsRCxNQUFNLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxlQUFlLEdBQU0sSUFBSSxDQUFBO0FBQ2pELE1BQU0sQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLFdBQVcsR0FBVSxRQUFRLENBQUE7QUFDckQsTUFBTSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsaUJBQWlCLENBQUcsSUFBSSxFQUFFLEtBQUssQ0FBRSxDQUFBO0FBQ3pELE1BQU0sQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLGlCQUFpQixDQUFHLElBQUksRUFBRSxLQUFLLENBQUUsQ0FBQTtBQUN6RCxNQUFNLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FB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