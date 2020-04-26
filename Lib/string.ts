
// https://wprock.fr/blog/conventions-nommage-programmation/
// CamelCase  : myVariableName
// PascalCase : MyVariableName
// KebabCase  : my-variable-name
// SnakeCase  : my_variable_name


export function toKebabCase ( name: string )
{
     return name.replace ( /([a-z])([A-Z])/g, "$1-$2" ).toLowerCase()
}

export function toSnakeCase ( name: string )
{
     return name.replace ( /([a-z])([A-Z])/g, "$1_$2" ).toLowerCase()
}
