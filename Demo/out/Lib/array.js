export function binaryKeyedStack(getKey, compareKey) {
    const keys = [];
    const arr = [];
    const self = typeof compareKey == "function"
        ? {
            items: arr,
            includes: includes_c,
            add: add_c,
            remove: remove_c,
            clear,
            indexOf: indexOf_c,
            get: get_c,
            search,
        }
        : {
            items: arr,
            includes,
            add,
            remove,
            clear,
            indexOf,
            get,
            search
        };
    return self;
    function add_c(items) {
        for (const item of items) {
            const key = getKey(item);
            const index = indexOf_c(key);
            if (index < 0) {
                keys.splice(~index, 0, key);
                arr.splice(~index, 0, item);
            }
        }
        return self;
    }
    function add(items) {
        for (const item of items) {
            const key = getKey(item);
            const index = indexOf(key);
            if (index < 0) {
                arr.splice(~index, 0, item);
                keys.splice(~index, 0, key);
            }
        }
        return self;
    }
    function remove_c(items) {
        for (const item of items) {
            const key = getKey(item);
            const index = indexOf_c(key);
            if (index > -1) {
                keys.splice(index, 1);
                arr.splice(index, 1);
            }
        }
        return self;
    }
    function remove(items) {
        for (const item of items) {
            const key = getKey(item);
            const index = indexOf(key);
            if (index > -1) {
                keys.splice(index, 1);
                arr.splice(index, 1);
            }
        }
        return self;
    }
    function clear() {
        keys.splice(0);
        arr.splice(0);
        return self;
    }
    function includes_c(item) {
        return indexOf_c(getKey(item)) != -1;
    }
    function includes(item) {
        return indexOf(getKey(item)) != -1;
    }
    function indexOf_c(key) {
        const floor = Math.floor;
        var mid = 0;
        var end = keys.length;
        while (mid <= end) {
            mid = floor((mid + end) / 2);
            const equal = compareKey(key, keys[mid]);
            if (equal == 0)
                return mid;
            if (equal < 0)
                mid++;
            else
                end = mid - 1;
        }
        return ~mid;
    }
    function indexOf(key) {
        const floor = Math.floor;
        var mid = 0;
        var end = keys.length;
        while (mid <= end) {
            mid = floor((mid + end) / 2);
            const cur = keys[mid];
            if (cur == key)
                return mid;
            if (cur < key)
                mid++;
            else
                end = mid - 1;
        }
        return ~mid;
    }
    function search(item, comparator) {
        const floor = Math.floor;
        const key = getKey(item);
        var mid = 0;
        var end = keys.length;
        while (mid <= end) {
            mid = floor((mid + end) / 2);
            const equal = comparator(key, keys[mid]);
            if (equal == 0)
                return arr[mid];
            if (equal < 0)
                mid++;
            else
                end = mid - 1;
        }
        return undefined;
    }
    function get_c(key) {
        const index = indexOf_c(key);
        return index < 0 ? undefined : arr[index];
    }
    function get(key) {
        const index = indexOf(key);
        return index < 0 ? undefined : arr[index];
    }
}
export function binaryStack(compare) {
    const arr = [];
    if (compare)
        return {
            items: arr,
            add: add_c,
            remove: remove_c,
            clear,
            indexOf: index_c,
        };
    else
        return {
            items: arr,
            add,
            remove,
            clear,
            indexOf,
        };
    function add_c(items) {
        for (const item of items) {
            const index = index_c(item);
            if (index < 0)
                arr.splice(~index, 0, item);
        }
    }
    function add(items) {
        for (const item of items) {
            const index = indexOf(item);
            if (index < 0)
                arr.splice(~index, 0, item);
        }
    }
    function remove_c(items) {
        for (const item of items) {
            const index = index_c(item);
            if (index > -1)
                arr.splice(index, 1);
        }
    }
    function remove(items) {
        for (const item of items) {
            const index = indexOf(item);
            if (index > -1)
                arr.splice(index, 1);
        }
    }
    function clear() {
        arr.splice(0);
    }
    function index_c(item) {
        const floor = Math.floor;
        var mid = 0;
        var end = arr.length;
        while (mid <= end) {
            mid = floor((mid + end) / 2);
            var equal = compare(item, arr[mid]);
            if (equal == 0)
                return mid;
            if (equal < 0)
                mid++;
            else
                end = mid - 1;
        }
        return ~mid;
    }
    function indexOf(item) {
        const floor = Math.floor;
        var mid = 0;
        var end = arr.length;
        while (mid <= end) {
            mid = floor((mid + end) / 2);
            var cur = arr[mid];
            if (cur == item)
                return mid;
            if (cur < item)
                mid++;
            else
                end = mid - 1;
        }
        return ~mid;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXJyYXkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9MaWIvYXJyYXkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBa0JLLE1BQU0sVUFBVSxnQkFBZ0IsQ0FBVSxNQUE2QixFQUFFLFVBQWdDO0lBRXBHLE1BQU0sSUFBSSxHQUFHLEVBQVUsQ0FBQTtJQUN2QixNQUFNLEdBQUcsR0FBSSxFQUFVLENBQUE7SUFHdkIsTUFBTSxJQUFJLEdBQXNCLE9BQU8sVUFBVSxJQUFJLFVBQVU7UUFDMUQsQ0FBQyxDQUFDO1lBQ0csS0FBSyxFQUFLLEdBQUc7WUFDYixRQUFRLEVBQUUsVUFBVTtZQUNwQixHQUFHLEVBQU8sS0FBSztZQUNmLE1BQU0sRUFBSSxRQUFRO1lBQ2xCLEtBQUs7WUFDTCxPQUFPLEVBQUUsU0FBUztZQUNsQixHQUFHLEVBQU0sS0FBSztZQUNkLE1BQU07U0FDVjtRQUNELENBQUMsQ0FBQztZQUNHLEtBQUssRUFBRSxHQUFHO1lBQ1YsUUFBUTtZQUNSLEdBQUc7WUFDSCxNQUFNO1lBQ04sS0FBSztZQUNMLE9BQU87WUFDUCxHQUFHO1lBQ0gsTUFBTTtTQUNWLENBQUE7SUFFTixPQUFPLElBQUksQ0FBQTtJQUVYLFNBQVMsS0FBSyxDQUFHLEtBQVc7UUFFdkIsS0FBTSxNQUFNLElBQUksSUFBSSxLQUFLLEVBQ3pCO1lBQ0ssTUFBTSxHQUFHLEdBQUksTUFBZ0MsQ0FBRyxJQUFJLENBQUUsQ0FBQTtZQUN0RCxNQUFNLEtBQUssR0FBRyxTQUFTLENBQUcsR0FBRyxDQUFFLENBQUE7WUFFL0IsSUFBSyxLQUFLLEdBQUcsQ0FBQyxFQUNkO2dCQUNLLElBQUksQ0FBQyxNQUFNLENBQUcsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxFQUFFLEdBQUcsQ0FBRSxDQUFBO2dCQUM5QixHQUFHLENBQUMsTUFBTSxDQUFJLENBQUMsS0FBSyxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUUsQ0FBQTthQUNuQztTQUNMO1FBRUQsT0FBTyxJQUFJLENB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