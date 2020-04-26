export function getUnit(value) {
    if (typeof value != "string")
        return undefined;
    const split = /[+-]?\d*\.?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?(%|px|pt|em|rem|in|cm|mm|ex|ch|pc|vw|vh|vmin|vmax|deg|rad|turn)?$/
        .exec(value);
    if (split)
        return split[1];
    return undefined;
}
export function getTransformUnit(propName) {
    if (propName.includes('translate') || propName === 'perspective')
        return 'px';
    if (propName.includes('rotate') || propName.includes('skew'))
        return 'deg';
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidW5pdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL0xpYi9jc3MvdW5pdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFTQSxNQUFNLFVBQVUsT0FBTyxDQUFHLEtBQVU7SUFFaEMsSUFBSyxPQUFPLEtBQUssSUFBSSxRQUFRO1FBQ3hCLE9BQU8sU0FBUyxDQUFBO0lBRXJCLE1BQU0sS0FBSyxHQUFHLDRHQUE0RztTQUMvRyxJQUFJLENBQUUsS0FBSyxDQUFFLENBQUM7SUFFekIsSUFBSyxLQUFLO1FBQ0wsT0FBTyxLQUFLLENBQUUsQ0FBQyxDQUFTLENBQUE7SUFFN0IsT0FBTyxTQUFTLENBQUE7QUFDcEIsQ0FBQztBQUdELE1BQU0sVUFBVSxnQkFBZ0IsQ0FBRyxRQUFnQjtJQUUvQyxJQUFLLFFBQVEsQ0FBQyxRQUFRLENBQUcsV0FBVyxDQUFFLElBQUksUUFBUSxLQUFLLGFBQWE7UUFDaEUsT0FBTyxJQUFJLENBQUE7SUFFZixJQUFLLFFBQVEsQ0FBQyxRQUFRLENBQUcsUUFBUSxDQUFFLElBQUksUUFBUSxDQUFDLFFBQVEsQ0FBRyxNQUFNLENBQUU7UUFDL0QsT0FBTyxLQUFLLENBQUE7QUFDcEIsQ0FBQyJ9