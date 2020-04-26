// https://github.com/rdfjs-base/data-model/tree/master/lib
var nextId = 0;
export function createNode(type, id, data) {
    data.type = type;
    data.id = id || (++nextId).toString();
    return data;
}
export function getUId(node) {
    return node.context + '#' + node.type + ':' + node.id;
}
export function equalNodes(a, b) {
    return !!a && !!b
        && a.type === b.type
        && a.id === b.id;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL0RhdGEvRGF0YS9ub2RlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBLDJEQUEyRDtBQWlCM0QsSUFBSSxNQUFNLEdBQUcsQ0FBQyxDQUFBO0FBRWQsTUFBTSxVQUFVLFVBQVUsQ0FBNEQsSUFBTyxFQUFFLEVBQVUsRUFBRSxJQUF1QztJQUkzSSxJQUFVLENBQUMsSUFBSSxHQUFHLElBQUksQ0FDdkI7SUFBQyxJQUFVLENBQUMsRUFBRSxHQUFLLEVBQUUsSUFBSSxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUMsUUFBUSxFQUFHLENBQUE7SUFDaEQsT0FBTyxJQUFTLENBQUE7QUFDckIsQ0FBQztBQUVELE1BQU0sVUFBVSxNQUFNLENBQUcsSUFBVztJQUUvQixPQUFPLElBQUksQ0FBQyxPQUFPLEdBQUcsR0FBRyxHQUFHLElBQUksQ0FBQyxJQUFJLEdBQUcsR0FBRyxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUE7QUFDMUQsQ0FBQztBQUVELE1BQU0sVUFBVSxVQUFVLENBQUcsQ0FBUSxFQUFFLENBQVE7SUFFMUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1dBQ1QsQ0FBQyxDQUFDLElBQUksS0FBSyxDQUFDLENBQUMsSUFBSTtXQUNqQixDQUFDLENBQUMsRUFBRSxLQUFPLENBQUMsQ0FBQyxFQUFFLENBQUE7QUFDNUIsQ0FBQztBQUVEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQXlDRyJ9