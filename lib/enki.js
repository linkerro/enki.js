(function () {
    var self = {};
    this.enki = self;

    var generateSetter = function (property) {
        var setter = function (value) {
            if (property.value !== value) {
                property.notifications.forEach(function (notification) {
                    notification(value, property.value);
                });
                property.value = value;
            }
        };
        return setter;
    };

    var generateGetter=function(property){
        var getter = function () {
            console.log(property);
            return property.value;
        };
        return getter;
    }
    
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

            Object.defineProperty(object, propertyName, {
                set: generateSetter(values[propertyName]),
                get: generateGetter(values[propertyName])
            });
            object[propertyName] = values[propertyName].value;
            if (typeof(object[propertyName]) === 'object') {
                self.init(object[propertyName]);
            }
        };
    };

    self.addListener = function (object, propertyName, func) {
        var properties=propertyName.split('.');
        if (properties.length>1) {
            self.addListener(object[properties[0]], propertyName.replace(properties[0]+'.',''), func);
        }
        else {
            object.__values__[propertyName].notifications.push(func);
        }
    };

    var extend = function (element, object) {
        element.getAttribute('data-bind')
    };
})();