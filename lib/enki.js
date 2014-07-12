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

    var generateGetter = function (property) {
        var getter = function () {
            return property.value;
        };
        return getter;
    }

    self.watch = function (object) {
        Object.defineProperty(object, '__values__', {
            enumerable: false,
            configurable: false,
            writable: false,
            value: {}
        });
        var values = object.__values__;

        for (var propertyName in object) {
            if(typeof(object[propertyName])==='function'){
                continue;
            }
            values[propertyName] = values[propertyName] || {};
            values[propertyName].notifications = values[propertyName].notifications || [];
            values[propertyName].value = object[propertyName];

            Object.defineProperty(object, propertyName, {
                set: generateSetter(values[propertyName]),
                get: generateGetter(values[propertyName])
            });
            object[propertyName] = values[propertyName].value;
            if (typeof(object[propertyName]) === 'object') {
                self.watch(object[propertyName]);
            }
        }
        ;
    };

    self.addListener = function (object, propertyName, func) {
        var properties = propertyName.split('.');
        if (properties.length > 1) {
            self.addListener(object[properties[0]], propertyName.replace(properties[0] + '.', ''), func);
        }
        else {
            object.__values__[propertyName].notifications.push(func);
        }
    };

    self.bindDocument = function (viewModel) {
        self.watch(viewModel);
        document.__viewModel__=viewModel;
        var elements = document.querySelectorAll('[data-bind]');
        for (var i = 0; i < elements.length; i++) {
            var element = elements[i];
            var bindingInfo = parseBindingInfo(element.getAttribute('data-bind'));
            addBindings(element, bindingInfo, viewModel)
        }
    };

    self.addNotification= function (viewModel,propertyName,func) {
        viewModel.__values__[propertyName].notifications.push(func);
    };

    self.extend= function (model, propertyName, func) {
        Object.defineProperty(model, propertyName, {
            enumerable: true,
            configurable: false,
            get: function () {
                return func(model);
            }
        });

    };

    var parseBindingInfo = function (bindingString) {
        try {
            var json = bindingString.replace(/[\w\d]+/g, '"$&"');
            return JSON.parse('{' + json + '}');
        } catch (ex) {
            throw 'Invalid syntax in binding: ' + bindingString;
        }
    };
    var addBindings = function (element, bindingInfo, viewModel) {
        for (var binding in bindingInfo) {
            if (bindings[binding] && bindings[binding].init) {
                bindings[binding].init(element, viewModel[bindingInfo[binding]], viewModel, bindingInfo[binding]);
            }
        }
    };

    var bindings = {
        click: {init: function (element, func) {
            if (typeof(func) === 'function') {
                element.onclick = func;
            } else {
                throw func + ' is not a function';
            }
        }},
        text:{init: function (element,propertyValue,viewModel,propertyName) {
            self.addNotification(viewModel, propertyName, function (value) {
                element.innerHTML = value;
            });
        }},
        value:{init: function (element,propertyValue,viewModel,propertyName) {
            self.addNotification(viewModel, propertyName, function (value) {
                element.value = value;
            });
            element.onchange=function () {
                viewModel[propertyName]=element.value;
            };
        }},
        liveValue:{init: function (element,propertyValue,viewModel,propertyName) {
            self.addNotification(viewModel, propertyName, function (value) {
                element.value = value;
            });
            element.onkeyup=function () {
                viewModel[propertyName]=element.value;
            };
        }},
        style: {init: function (element, value) {

        }}
    };

})();