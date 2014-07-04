(function () {
    var self = {};
    this.enki = self;

    self.init = function (object) {
        Object.defineProperty(object, '__values__', {
            enumerable: false,
            configurable: false,
            writable: false,
            value: {}
        });
        var values = object.__values__;

        for (var propertyName in object) {
            values[propertyName] = values[propertyName] || {};
            values[propertyName].notifications = values[propertyName].notifications || [];
            values[propertyName].value = object[propertyName];

            var setter = function (value) {
                if (values[propertyName].value !== value) {
                    values[propertyName].notifications.forEach(function (notification) {
                        notification(value, values[propertyName].value);
                    });
                    values[propertyName].value = value;
                }
            };
            var getter = function () {
                console.log(propertyName);
                return values[propertyName].value;
            };
            Object.defineProperty(object, propertyName, {
                set: setter,
                get: getter
            });
            object[propertyName] = values[propertyName].value;
            if (typeof(object[propertyName]) === 'object') {
                self.init(object[propertyName]);
            }
        };
    };

    self.addListener = function (object, propertyName, func) {
        var dotIndex = propertyName.indexOf('.');
        if (dotIndex !== -1) {
            self.addListener(object, propertyName.substr(0, dotIndex), func);
        }
        else {
            object.__values__[propertyName].notifications.push(func);
        }
    };

    var extend = function (element, object) {
        element.getAttribute('data-bind')
    };
})();