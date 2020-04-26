// https://wprock.fr/blog/conventions-nommage-programmation/
// CamelCase  : myVariableName
// PascalCase : MyVariableName
// KebabCase  : my-variable-name
// SnakeCase  : my_variable_name
export function toKebabCase(name) {
    return name.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}
export function toSnakeCase(name) {
    return name.replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase();
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RyaW5nLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vTGliL3N0cmluZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDQSw0REFBNEQ7QUFDNUQsOEJBQThCO0FBQzlCLDhCQUE4QjtBQUM5QixnQ0FBZ0M7QUFDaEMsZ0NBQWdDO0FBR2hDLE1BQU0sVUFBVSxXQUFXLENBQUcsSUFBWTtJQUVyQyxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUcsaUJBQWlCLEVBQUUsT0FBTyxDQUFFLENBQUMsV0FBVyxFQUFFLENBQUE7QUFDckUsQ0FBQztBQUVELE1BQU0sVUFBVSxXQUFXLENBQUcsSUFBWTtJQUVyQyxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUcsaUJBQWlCLEVBQUUsT0FBTyxDQUFFLENBQUMsV0FBVyxFQUFFLENBQUE7QUFDckUsQ0FBQyJ9