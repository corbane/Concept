const { min, max } = Math;
export function limitedValues(min, max) {
    if (min.length < max.length)
        max = max.slice(0, min.length);
    else
        min = min.slice(0, max.length);
    const count = min.length;
    const ranges = [];
    for (var i = 0; i != count; i++)
        ranges.push(max[i] - min[i]);
    return (nums) => {
        const result = [];
        for (var i = 0; i != count; i++)
            result.push(min[i] + ranges[i] * nums);
        return result;
    };
}
export function clamp(value, start, end) {
    return min(max(value, start), end);
}
var NumberLib;
(function (NumberLib) {
    function limitedValue(value, min, max) {
        var iclamp = 0;
        const self = {
            limit,
            set,
            factor,
        };
        limit(min, max);
        return self;
        function limit(minValue, maxValue) {
            min = minValue;
            max = maxValue;
            const clampStart = Number.isFinite(min);
            const clampEnd = Number.isFinite(max);
            iclamp = clampStart && clampEnd ? 1
                : clampStart ? 2
                    : clampEnd ? 3
                        : 0;
            return self;
        }
        function set(newValue) {
            value = newValue;
            switch (iclamp) {
                case 1:
                    if (value < min)
                        value = min;
                    else if (value > max)
                        value = max;
                    break;
                case 2:
                    if (value < min)
                        value = min;
                    break;
                case 3:
                    if (value > max)
                        value = max;
                    break;
            }
            return self;
        }
        function factor(num) {
            value = min + (max - min) * num;
            return self;
        }
    }
    NumberLib.limitedValue = limitedValue;
    function multipleLimitedValues(values, min, max) {
        const ranges = [];
        var iclamp = 0;
        const self = {
            limit,
            set,
            factor
        };
        limit(min, max);
        return self;
        function limit(minValues, maxValues) {
            if (typeof minValues == "number")
                minValues = [minValues];
            if (typeof maxValues == "number")
                maxValues = [maxValues];
            const minCount = minValues.length;
            const maxCount = maxValues.length;
            const count = values.length;
            min = [];
            max = [];
            for (var i = 0; i < count; i++) {
                if (i < minCount && Number.isFinite(minValues[i]))
                    min[i] = minValues[i];
                else
                    min[i] = 0;
            }
            for (var i = 0; i < count; i++) {
                if (i < maxCount && Number.isFinite(maxValues[i]))
                    max[i] = maxValues[i];
                else
                    max[i] = values[i]; // || min [i]
            }
            // clamp
            const clampStart = minCount != 0;
            const clampEnd = maxCount != 0;
            iclamp = clampStart && clampEnd ? 1
                : clampStart ? 2
                    : clampEnd ? 3
                        : 0;
            // range
            ranges.splice(0);
            if (clampStart && clampEnd) {
                for (var i = 0; i != count; i++)
                    ranges.push(max[i] - min[i]);
            }
            // update
            set(values);
            return self;
        }
        function set(newValues) {
            if (typeof newValues == "number")
                newValues = [newValues];
            const count = values.length < newValues.length ? values.length : newValues.length;
            for (var i = 0; i != count; i++)
                values[i] = newValues[i];
            switch (iclamp) {
                case 0:
                    for (var i = 0; i != count; i++)
                        values[i] = newValues[i];
                    break;
                case 1:
                    for (var i = 0; i != count; i++) {
                        const n = newValues[i];
                        values[i] = n < min[i] ? min[i]
                            : n > max[i] ? max[i]
                                : n;
                    }
                    break;
                case 2:
                    for (var i = 0; i != count; i++) {
                        const n = newValues[i];
                        values[i] = n < min[i] ? min[i] : n;
                    }
                    break;
                case 3:
                    for (var i = 0; i != count; i++) {
                        const n = newValues[i];
                        values[i] = n > max[i] ? max[i] : n;
                    }
                    break;
            }
            return self;
        }
        function factor(factors) {
            if (typeof factors == "number") {
                if (!Number.isFinite(factors))
                    return self;
                for (var i = 0; i != values.length; i++)
                    values[i] = min[i] + ranges[i] * factors;
            }
            else if (Array.isArray(factors)) {
                const count = values.length < factors.length ? values.length : factors.length;
                if (count == 0)
                    return self;
                for (var i = 0; i != count; i++) {
                    if (isFinite(factors[i]))
                        values[i] = min[i] + ranges[i] * factors[i];
                }
            }
            return self;
        }
    }
    NumberLib.multipleLimitedValues = multipleLimitedValues;
})(NumberLib || (NumberLib = {}));
export function wrapStringValue(value, decompose, minValue, maxValue, onUpdate) {
    if (typeof decompose != "function")
        decompose == decomposeStringValue;
    var parts;
    var nums;
    const self = {
        limit,
        set,
        factor,
        reset,
        toString() { return parts.recompose(); },
        get numbers() { return parts.numbers; }
    };
    {
        const tmp = onUpdate;
        onUpdate = null;
        reset();
        if (typeof tmp == "function")
            onUpdate = tmp;
    }
    function limit(min, max) {
        minValue = min;
        maxValue = max;
        nums.limit(decompose(norm(min)).numbers, decompose(norm(max)).numbers);
        if (onUpdate)
            onUpdate();
        return self;
    }
    function reset() {
        const old = parts != undefined ? parts.recompose() : "";
        parts = decompose(norm(value));
        nums = NumberLib.multipleLimitedValues(parts.numbers, decompose(norm(minValue)).numbers, decompose(norm(maxValue)).numbers);
        if (onUpdate && old != parts.recompose())
            onUpdate();
        return self;
    }
    function set(values) {
        nums.set(typeof values == "number"
            ? [values]
            : decompose(norm(values)).numbers);
        if (onUpdate)
            onUpdate();
        return self;
    }
    function factor(factors) {
        nums.factor(factors);
        if (onUpdate)
            onUpdate();
        return self;
    }
    function norm(input) {
        if (Array.isArray(input))
            return input.join(' ');
        if (typeof input == "number")
            return input.toString();
        if (typeof input == "string")
            return input;
        return "";
    }
    return self;
}
const regex = /([+-]?\d*\.?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g;
function decomposeStringValue(value) {
    const strings = [];
    const numbers = [];
    var start = 0;
    var match;
    while ((match = regex.exec(value)) !== null) {
        strings.push(value.substring(start, match.index));
        numbers.push(parseFloat(match[1]));
        start = match.index + match[0].length;
    }
    strings.push(value.substring(start));
    const recompose = () => {
        var result = "";
        for (var i = 0; i != numbers.length; i++)
            result += strings[i] + numbers[i];
        return result + strings[i];
    };
    return {
        strings,
        numbers,
        recompose
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibnVtYmVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vTGliL251bWJlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDQSxNQUFNLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLElBQUksQ0FBQTtBQUV6QixNQUFNLFVBQVUsYUFBYSxDQUFHLEdBQWMsRUFBRSxHQUFjO0lBRXpELElBQUssR0FBRyxDQUFDLE1BQU0sR0FBRyxHQUFHLENBQUMsTUFBTTtRQUN2QixHQUFHLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBRyxDQUFDLEVBQUUsR0FBRyxDQUFDLE1BQU0sQ0FBRSxDQUFBOztRQUVqQyxHQUFHLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBRyxDQUFDLEVBQUUsR0FBRyxDQUFDLE1BQU0sQ0FBRyxDQUFBO0lBRXZDLE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUE7SUFDeEIsTUFBTSxNQUFNLEdBQUcsRUFBZSxDQUFBO0lBRTlCLEtBQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFHLENBQUMsSUFBSSxLQUFLLEVBQUcsQ0FBQyxFQUFFO1FBQzdCLE1BQU0sQ0FBQyxJQUFJLENBQUcsR0FBRyxDQUFFLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBRSxDQUFDLENBQUMsQ0FBRSxDQUFBO0lBRXRDLE9BQU8sQ0FBRSxJQUFZLEVBQUcsRUFBRTtRQUVyQixNQUFNLE1BQU0sR0FBRyxFQUFlLENBQUE7UUFFOUIsS0FBTSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUcsQ0FBQyxJQUFJLEtBQUssRUFBRyxDQUFDLEVBQUU7WUFDN0IsTUFBTSxDQUFDLElBQUksQ0FBRyxHQUFHLENBQUUsQ0FBQyxDQUFDLEdBQUcsTUFBTSxDQUFFLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBRSxDQUFBO1FBRWhELE9BQU8sTUFBTSxDQUFBO0lBQ2xCLENBQUMsQ0FBQTtBQUNOLENBQUM7QUFFRCxNQUFNLFVBQVUsS0FBSyxDQUFJLEtBQWEsRUFBRSxLQUFhLEVBQUUsR0FBVztJQUU3RCxPQUFPLEdBQUcsQ0FBRyxHQUFHLENBQUUsS0FBSyxFQUFFLEtBQUssQ0FBRSxFQUFFLEdBQUcsQ0FBRSxDQUFBO0FBQzVDLENBQUM7QUFrQ0QsSUFBTyxTQUFTLENBdU9mO0FBdk9ELFdBQU8sU0FBUztJQVNYLFNBQWdCLFlBQVksQ0FBRyxLQUFhLEVBQUUsR0FBWSxFQUFFLEdBQVk7UUFFbkUsSUFBSSxNQUFNLEdBQUcsQ0FBQyxDQUFBO1FBRWQsTUFBTSxJQUFJLEdBQWlCO1lBQ3RCLEtBQUs7WUFDTCxHQUFHO1lBQ0gsTUFBTTtTQUNWLENBQUE7UUFFRCxLQUFLLENBQUcsR0FBRyxFQUFFLEdBQUcsQ0FBRSxDQUFBO1FBRWxCLE9BQU8sSUFBSSxDQUFBO1FBRVgsU0FBUyxLQUFLLENBQUcsUUFBaUIsRUFBRSxRQUFpQjtZQUVoRCxHQUFHLEdBQUcsUUFBUSxDQUFBO1lBQ2QsR0FBRyxHQUFHLFFBQVEsQ0FBQTtZQUVkLE1BQU0sVUFBVSxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUcsR0FBRyxDQUFFLENBQUE7WUFDMUMsTUFBTSxRQUFRLEdBQUssTUFBTSxDQUFDLFFBQVEsQ0FBRyxHQUFHLENBQUUsQ0FBQTtZQUUxQyxNQUFNLEdBQUcsVUFBVSxJQUFJLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDNUIsQ0FBQyxDQUFDLFVBQVUsQ0FBYSxDQUFDLENBQUMsQ0FBQztvQkFDNUIsQ0FBQyxDQUFDLFFBQVEsQ0FBZSxDQUFDLENBQUMsQ0FBQzt3QkFDNUIsQ0FBQyxDQUFDLENBQUMsQ0FBQTtZQUVWLE9BQU8sSUFBSSxDQUFBO1FBQ2hCLENBQUM7UUFFRCxTQUFTLEdBQUcsQ0FBRyxRQUFnQjtZQUUxQixLQUFLLEdBQUcsUUFBUSxDQUFBO1lBRWhCLFFBQVMsTUFBTSxFQUNmO2dCQUNBLEtBQUssQ0FBQztvQkFDRCxJQUFLLEtBQUssR0FBRyxHQUFHO3dCQUNYLEtBQUssR0FBRyxHQUFHLENBQUE7eUJBQ1gsSUFBSyxLQUFLLEdBQUcsR0FBRzt3QkFDaEIsS0FBSyxHQUFHLEdBQUcsQ0FBQTtvQkFDaEIsTUFBSztnQkFDVixLQUFLLENBQUM7b0JBQ0QsSUFBSyxLQUFLLEdBQUcsR0FBRzt3QkFDWCxLQUFLLEdBQUcsR0FBRyxDQUFBO29CQUNoQixNQUFLO2dCQUNWLEtBQUssQ0FBQztvQkFDRCxJQUFLLEtBQUssR0FBRyxHQUFHO3dCQUNYLEtBQUssR0FBRyxHQUFHLENBQUE7b0JBQ2hCLE1BQUs7YUFDVDtZQUVELE9BQU8sSUFBSSxDQUFBO1FBQ2hCLENBQUM7UUFFRCxTQUFTLE1BQU0sQ0FBRyxHQUFXO1lBRXhCLEtBQUssR0FBRyxHQUFHLEdBQUcsQ0FBRSxHQUFHLEdBQUcsR0FBRyxDQUFFLEdBQUcsR0FBRyxDQUFBO1lBRWpDLE9BQU8sSUFBSSxDQUFBO1FBQ2hCLENBQUM7SUFDTixDQUFDO0lBN0RlLHNCQUFZLGVBNkQzQixDQUFBO0lBU0QsU0FBZ0IscUJBQXFCLENBQUcsTUFBaUIsRUFBRSxHQUFlLEVBQUUsR0FBZTtRQUV0RixNQUFNLE1BQU0sR0FBRyxFQUFlLENBQUE7UUFFOUIsSUFBSSxNQUFNLEdBQUcsQ0FBQyxDQUFBO1FBRWQsTUFBTSxJQUFJLEdBQTBCO1lBQy9CLEtBQUs7WUFDTCxHQUFHO1lBQ0gsTUFBTTtTQUNWLENBQUE7UUFFRCxLQUFLLENBQUcsR0FBRyxFQUFFLEdBQUcsQ0FBRSxDQUFBO1FBRWxCLE9BQU8sSUFBSSxDQUFBO1FBRVgsU0FBUyxLQUFLLENBQUcsU0FBOEIsRUFBRSxTQUE4QjtZQUUxRSxJQUFLLE9BQU8sU0FBUyxJQUFJLFFBQVE7Z0JBQzVCLFNBQVMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFBO1lBRTVCLElBQUssT0FBTyxTQUFTLElBQUksUUFBUTtnQkFDNUIsU0FBUyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUE7WUFFNUIsTUFBTSxRQUFRLEdBQUcsU0FBUyxDQUFDLE1BQU0sQ0FBQTtZQUNqQyxNQUFNLFFBQVEsR0FBRyxTQUFTLENBQUMsTUFBTSxDQUFBO1lBQ2pDLE1BQU0sS0FBSyxHQUFNLE1BQU0sQ0FBQyxNQUFNLENBQUE7WUFFOUIsR0FBRyxHQUFHLEVBQUUsQ0FBQTtZQUNSLEdBQUcsR0FBRyxFQUFFLENBQUE7WUFFUixLQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRyxDQUFDLEdBQUcsS0FBSyxFQUFHLENBQUMsRUFBRSxFQUNqQztnQkFDSyxJQUFLLENBQUMsR0FBRyxRQUFRLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBRyxTQUFTLENBQUUsQ0FBQyxDQUFDLENBQUU7b0JBQ2pELEdBQUcsQ0FBRSxDQUFDLENBQUMsR0FBRyxTQUFTLENBQUUsQ0FBQyxDQUFDLENBQUE7O29CQUV2QixHQUFHLENBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFBO2FBQ3BCO1lBRUQsS0FBTSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUcsQ0FBQyxHQUFHLEtBQUssRUFBRyxDQUFDLEVBQUUsRUFDakM7Z0JBQ0ssSUFBSyxDQUFDLEdBQUcsUUFBUSxJQUFJLE1BQU0sQ0FBQyxRQUFRLENBQUcsU0FBUyxDQUFFLENBQUMsQ0FBQyxDQUFFO29CQUNqRCxHQUFHLENBQUUsQ0FBQyxDQUFDLEdBQUcsU0FBUyxDQUFFLENBQUMsQ0FBQyxDQUFBOztvQkFFdkIsR0FBRyxDQUFFLENBQUMsQ0FBQyxHQUFHLE1BQU0sQ0FBRSxDQUFDLENBQUMsQ0FBQSxDQUFDLGFBQWE7YUFDM0M7WUFFRCxRQUFRO1lBRVIsTUFBTSxVQUFVLEdBQUcsUUFBUSxJQUFJLENBQUMsQ0FBQTtZQUNoQyxNQUFNLFFBQVEsR0FBSyxRQUFRLElBQUksQ0FBQyxDQUFBO1lBRWhDLE1BQU0sR0FBRyxVQUFVLElBQUksUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUM1QixDQUFDLENBQUMsVUFBVSxDQUFhLENBQUMsQ0FBQyxDQUFDO29CQUM1QixDQUFDLENBQUMsUUFBUSxDQUFlLENBQUMsQ0FBQyxDQUFDO3dCQUM1QixDQUFDLENBQUMsQ0FBQyxDQUFBO1lBRVYsUUFBUTtZQUVSLE1BQU0sQ0FBQyxNQUFNLENBQUUsQ0FBQyxDQUFDLENBQUE7WUFFakIsSUFBSyxVQUFVLElBQUksUUFBUSxFQUMzQjtnQkFDSyxLQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRyxDQUFDLElBQUksS0FBSyxFQUFHLENBQUMsRUFBRTtvQkFDN0IsTUFBTSxDQUFDLElBQUksQ0FBRyxHQUFHLENBQUUsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFFLENBQUMsQ0FBQyxDQUFFLENBQUE7YUFDMUM7WUFFRCxTQUFTO1lBRVQsR0FBRyxDQUFHLE1BQU0sQ0FBRSxDQUFBO1lBRWQsT0FBTyxJQUFJLENBQUE7UUFDaEIsQ0FBQztRQUVELFNBQVMsR0FBRyxDQUFHLFNBQTZCO1lBRXZDLElBQUssT0FBTyxTQUFTLElBQUksUUFBUTtnQkFDNUIsU0FBUyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUE7WUFFNUIsTUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLE1BQU0sR0FBRyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFBO1lBRWpGLEtBQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFHLENBQUMsSUFBSSxLQUFLLEVBQUcsQ0FBQyxFQUFFO2dCQUM3QixNQUFNLENBQUUsQ0FBQyxDQUFDLEdBQUcsU0FBUyxDQUFFLENBQUMsQ0FBQyxDQUFBO1lBRS9CLFFBQVMsTUFBTSxFQUNmO2dCQUNBLEtBQUssQ0FBQztvQkFFRCxLQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRyxDQUFDLElBQUksS0FBSyxFQUFHLENBQUMsRUFBRTt3QkFDN0IsTUFBTSxDQUFFLENBQUMsQ0FBQyxHQUFHLFNBQVMsQ0FBRSxDQUFDLENBQUMsQ0FBQTtvQkFDL0IsTUFBSztnQkFFVixLQUFLLENBQUM7b0JBRUQsS0FBTSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUcsQ0FBQyxJQUFJLEtBQUssRUFBRyxDQUFDLEVBQUUsRUFDbEM7d0JBQ0ssTUFBTSxDQUFDLEdBQUcsU0FBUyxDQUFFLENBQUMsQ0FBQyxDQUFBO3dCQUN2QixNQUFNLENBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFFLENBQUMsQ0FBQzs0QkFDdkIsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBRSxDQUFDLENBQUM7Z0NBQ3ZCLENBQUMsQ0FBQyxDQUFDLENBQUE7cUJBQ2xCO29CQUNELE1BQUs7Z0JBRVYsS0FBSyxDQUFDO29CQUVELEtBQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFHLENBQUMsSUFBSSxLQUFLLEVBQUcsQ0FBQyxFQUFFLEVBQ2xDO3dCQUNLLE1BQU0sQ0FBQyxHQUFHLFNBQVMsQ0FBRSxDQUFDLENBQUMsQ0FBQTt3QkFDdkIsTUFBTSxDQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxHQUFHLENBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBO3FCQUMxQztvQkFDRCxNQUFLO2dCQUVWLEtBQUssQ0FBQztvQkFFRCxLQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRyxDQUFDLElBQUksS0FBSyxFQUFHLENBQUMsRUFBRSxFQUNsQzt3QkFDSyxNQUFNLENBQUMsR0FBRyxTQUFTLENBQUUsQ0FBQyxDQUFDLENBQUE7d0JBQ3ZCLE1BQU0sQ0FBRSxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsR0FBRyxDQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtxQkFDMUM7b0JBQ0QsTUFBSzthQUNUO1lBRUQsT0FBTyxJQUFJLENBQUE7UUFDaEIsQ0FBQztRQUVELFNBQVMsTUFBTSxDQUFHLE9BQTJCO1lBRXhDLElBQUssT0FBTyxPQUFPLElBQUksUUFBUSxFQUMvQjtnQkFDSyxJQUFLLENBQUUsTUFBTSxDQUFDLFFBQVEsQ0FBRyxPQUFPLENBQUU7b0JBQzdCLE9BQU8sSUFBSSxDQUFBO2dCQUVoQixLQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRyxDQUFDLElBQUksTUFBTSxDQUFDLE1BQU0sRUFBRyxDQUFDLEVBQUU7b0JBQ3JDLE1BQU0sQ0FBRSxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUUsQ0FBQyxDQUFDLEdBQUcsTUFBTSxDQUFFLENBQUMsQ0FBQyxHQUFHLE9BQU8sQ0FBQTthQUNwRDtpQkFDSSxJQUFLLEtBQUssQ0FBQyxPQUFPLENBQUcsT0FBTyxDQUFFLEVBQ25DO2dCQUNLLE1BQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxNQUFNLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQTtnQkFFN0UsSUFBSyxLQUFLLElBQUksQ0FBQztvQkFDVixPQUFPLElBQUksQ0FBQTtnQkFFaEIsS0FBTSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUcsQ0FBQyxJQUFJLEtBQUssRUFBRyxDQUFDLEVBQUUsRUFDbEM7b0JBQ0ssSUFBSyxRQUFRLENBQUcsT0FBTyxDQUFFLENBQUMsQ0FBQyxDQUFFO3dCQUN4QixNQUFNLENBQUUsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFFLENBQUMsQ0FBQyxHQUFHLE1BQU0sQ0FBRSxDQUFDLENBQUMsR0FBRyxPQUFPLENBQUUsQ0FBQyxDQUFDLENBQUE7aUJBQ3hEO2FBQ0w7WUFFRCxPQUFPLElBQUksQ0FBQTtRQUNoQixDQUFDO0lBQ04sQ0FBQztJQXZKZSwrQkFBcUIsd0JBdUpwQyxDQUFBO0FBQ04sQ0FBQyxFQXZPTSxTQUFTLEtBQVQsU0FBUyxRQXVPZjtBQUlELE1BQU0sVUFBVSxlQUFlLENBQzFCLEtBQWtELEVBQ2xELFNBQWdGLEVBQ2hGLFFBQXlELEVBQ3pELFFBQXlELEVBQ3pELFFBQXNCO0lBR3RCLElBQUssT0FBTyxTQUFTLElBQUksVUFBVTtRQUM5QixTQUFTLElBQUksb0JBQW9CLENBQUE7SUFFdEMsSUFBSSxLQUFvQyxDQUFBO0lBQ3hDLElBQUksSUFBcUMsQ0FBQTtJQUV6QyxNQUFNLElBQUksR0FBd0I7UUFDN0IsS0FBSztRQUNMLEdBQUc7UUFDSCxNQUFNO1FBQ04sS0FBSztRQUNMLFFBQVEsS0FBTSxPQUFPLEtBQUssQ0FBQyxTQUFTLEVBQUcsQ0FBQSxDQUFDLENBQUM7UUFDekMsSUFBSSxPQUFPLEtBQU0sT0FBTyxLQUFLLENBQUMsT0FBTyxDQUFBLENBQUMsQ0FBQztLQUMzQyxDQUVBO0lBQUE7UUFDSSxNQUFNLEdBQUcsR0FBRyxRQUFRLENBQUE7UUFDcEIsUUFBUSxHQUFHLElBQUksQ0FBQTtRQUVmLEtBQUssRUFBRyxDQUFBO1FBRVIsSUFBSyxPQUFPLEdBQUcsSUFBSSxVQUFVO1lBQ3hCLFFBQVEsR0FBRyxHQUFHLENBQUE7S0FDdkI7SUFFRCxTQUFTLEtBQUssQ0FBRyxHQUFnQixFQUFFLEdBQWdCO1FBRTlDLFFBQVEsR0FBRyxHQUFHLENBQUE7UUFDZCxRQUFRLEdBQUcsR0FBRyxDQUFBO1FBRWQsSUFBSSxDQUFDLEtBQUssQ0FDTCxTQUFTLENBQUcsSUFBSSxDQUFHLEdBQUcsQ0FBRSxDQUFFLENBQUMsT0FBTyxFQUNsQyxTQUFTLENBQUcsSUFBSSxDQUFHLEdBQUcsQ0FBRSxDQUFFLENBQUMsT0FBTyxDQUN0QyxDQUFBO1FBRUQsSUFBSyxRQUFRO1lBQ1IsUUFBUSxFQUFHLENBQUE7UUFFaEIsT0FBTyxJQUFJLENBQUE7SUFDaEIsQ0FBQztJQUVELFNBQVMsS0FBSztRQUVULE1BQU0sR0FBRyxHQUFHLEtBQUssSUFBSSxTQUFTLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxTQUFTLEVBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFBO1FBRXhELEtBQUssR0FBRyxTQUFTLENBQUcsSUFBSSxDQUFHLEtBQUssQ0FBRSxDQUFFLENBQUE7UUFFcEMsSUFBSSxHQUFHLFNBQVMsQ0FBQyxxQkFBcUIsQ0FDakMsS0FBSyxDQUFDLE9BQU8sRUFDYixTQUFTLENBQUcsSUFBSSxDQUFHLFFBQVEsQ0FBRSxDQUFFLENBQUMsT0FBTyxFQUN2QyxTQUFTLENBQUcsSUFBSSxDQUFHLFFBQVEsQ0FBRSxDQUFFLENBQUMsT0FBTyxDQUMzQyxDQUFBO1FBRUQsSUFBSyxRQUFRLElBQUksR0FBRyxJQUFJLEtBQUssQ0FBQyxTQUFTLEVBQUc7WUFDckMsUUFBUSxFQUFHLENBQUE7UUFFaEIsT0FBTyxJQUFJLENBQUE7SUFDaEIsQ0FBQztJQUVELFNBQVMsR0FBRyxDQUFHLE1BQWtCO1FBRTVCLElBQUksQ0FBQyxHQUFHLENBQ0gsT0FBTyxNQUFNLElBQUksUUFBUTtZQUN6QixDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUM7WUFDVixDQUFDLENBQUMsU0FBUyxDQUFHLElBQUksQ0FBRyxNQUFNLENBQUUsQ0FBRSxDQUFDLE9BQU8sQ0FDM0MsQ0FBQTtRQUVELElBQUssUUFBUTtZQUNSLFFBQVEsRUFBRyxDQUFBO1FBRWhCLE9BQU8sSUFBSSxDQUFBO0lBQ2hCLENBQUM7SUFFRCxTQUFTLE1BQU0sQ0FBRyxPQUEyQjtRQUV4QyxJQUFJLENBQUMsTUFBTSxDQUFHLE9BQU8sQ0FBRSxDQUFBO1FBRXZCLElBQUssUUFBUTtZQUNSLFFBQVEsRUFBRyxDQUFBO1FBRWhCLE9BQU8sSUFBSSxDQUFBO0lBQ2hCLENBQUM7SUFFRCxTQUFTLElBQUksQ0FBRyxLQUFpQjtRQUU1QixJQUFLLEtBQUssQ0FBQyxPQUFPLENBQUcsS0FBSyxDQUFFO1lBQ3ZCLE9BQU8sS0FBSyxDQUFDLElBQUksQ0FBRSxHQUFHLENBQUMsQ0FBQTtRQUU1QixJQUFLLE9BQU8sS0FBSyxJQUFJLFFBQVE7WUFDeEIsT0FBTyxLQUFLLENBQUMsUUFBUSxFQUFHLENBQUE7UUFFN0IsSUFBSyxPQUFPLEtBQUssSUFBSSxRQUFRO1lBQ3hCLE9BQU8sS0FBSyxDQUFBO1FBRWpCLE9BQU8sRUFBRSxDQUFBO0lBQ2QsQ0FBQztJQUVELE9BQU8sSUFBSSxDQUFBO0FBQ2hCLENBQUM7QUFFRCxNQUFNLEtBQUssR0FBRyw4Q0FBOEMsQ0FBQTtBQUc1RCxTQUFTLG9CQUFvQixDQUFHLEtBQWE7SUFNeEMsTUFBTSxPQUFPLEdBQUcsRUFBZSxDQUFBO0lBQy9CLE1BQU0sT0FBTyxHQUFHLEVBQWUsQ0FBQTtJQUUvQixJQUFJLEtBQUssR0FBRyxDQUFDLENBQUE7SUFDYixJQUFJLEtBQXNCLENBQUE7SUFFMUIsT0FBUSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFHLEtBQUssQ0FBRSxDQUFDLEtBQUssSUFBSSxFQUMvQztRQUNLLE9BQU8sQ0FBQyxJQUFJLENBQUcsS0FBSyxDQUFDLFNBQVMsQ0FBRyxLQUFLLEVBQUUsS0FBSyxDQUFDLEtBQUssQ0FBRSxDQUFFLENBQUE7UUFDdkQsT0FBTyxDQUFDLElBQUksQ0FBSSxVQUFVLENBQUcsS0FBSyxDQUFFLENBQUMsQ0FBQyxDQUFFLENBQUUsQ0FBQTtRQUUxQyxLQUFLLEdBQUcsS0FBSyxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUUsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFBO0tBQzFDO0lBRUQsT0FBTyxDQUFDLElBQUksQ0FBRyxLQUFLLENBQUMsU0FBUyxDQUFHLEtBQUssQ0FBRSxDQUFFLENBQUE7SUFFMUMsTUFBTSxTQUFTLEdBQUcsR0FBRyxFQUFFO1FBRWxCLElBQUksTUFBTSxHQUFHLEVBQUUsQ0FBQTtRQUVmLEtBQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFHLENBQUMsSUFBSSxPQUFPLENBQUMsTUFBTSxFQUFHLENBQUMsRUFBRTtZQUN0QyxNQUFNLElBQUksT0FBTyxDQUFFLENBQUMsQ0FBQyxHQUFHLE9BQU8sQ0FBRSxDQUFDLENBQUMsQ0FBQTtRQUV4QyxPQUFPLE1BQU0sR0FBRyxPQUFPLENBQUUsQ0FBQyxDQUFDLENBQUE7SUFDaEMsQ0FBQyxDQUFBO0lBRUQsT0FBTztRQUNGLE9BQU87UUFDUCxPQUFPO1FBQ1AsU0FBUztLQUNiLENBQUE7QUFDTixDQUFDIn0=