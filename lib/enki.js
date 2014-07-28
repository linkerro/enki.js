(function () {
    var self = {};
    this.enki = self;
    var computableProperties = [];
    var isInComputableCicle = false;

    var generateSetter = function (property) {
        var setter = function (value) {
            if (property.value !== value) {
                property.notifications.forEach(function (notification) {
                    notification(value, property.value);
                });
                property.value = value;
                property.computableNotifications.forEach(function (notification) {
                    notification(value, property.value);
                });
            }
        };
        return setter;
    };

    var generateGetter = function (property) {
        var getter = function () {
            if (isInComputableCicle) {
                computableProperties.push(property);
            }
            return property.value;
        };
        return getter;
    }

    function initValues(object) {
        if (!object['__values__']) {
            Object.defineProperty(object, '__values__', {
                enumerable: false,
                configurable: false,
                writable: false,
                value: {}
            });
        }
    }

    self.watch = function (object) {
        initValues(object);
        var values = object.__values__;

        for (var propertyName in object) {
            if (typeof(object[propertyName]) === 'function') {
                continue;
            }
            values[propertyName] = values[propertyName] || {};
            values[propertyName].notifications = values[propertyName].notifications || [];
            values[propertyName].computableNotifications = values[propertyName].computableNotifications || [];
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
        object.__values__.extensions && object.__values__.extensions.forEach(function (item) {
            self.addComputable(item.model, item.propertyName, item.func);
        });
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

    var bindElements = function (elements, viewModel) {
        try {
            for (var i = 0; i < elements.length; i++) {
                var element = elements[i];
                var bindingInfo = parseBindingInfo(element.getAttribute('data-bind'));
                addBindings(element, bindingInfo, viewModel)
            }
            triggerNotifications(viewModel);
        } catch (ex) {
            throw 'Invalid syntax in binding: ' + element.getAttribute('data-bind');
        }
    }

    self.bindDocument = function (viewModel, elementId) {
        self.watch(viewModel);
        document.__viewModel__ = viewModel;
        var elements = document.querySelectorAll((elementId ? '#' + elementId + ' ' : '') + '[data-bind*="foreach"]');
        bindElements(elements, viewModel);
        elements = document.querySelectorAll((elementId ? '#' + elementId + ' ' : '') + '[data-bind]');
        bindElements(elements, viewModel);
    };

    self.addNotification = function (viewModel, propertyName, func) {
        viewModel.__values__[propertyName].notifications.push(func);
    };

    self.extend = function (model, propertyName, func) {
        initValues(model);
        model.__values__.extensions = model.__values__.extensions || [];
        model.__values__.extensions.push({model: model, propertyName: propertyName, func: func});
    };

    self.addComputable = function (model, propertyName, func) {
        Object.defineProperty(model, propertyName, {
            enumerable: true,
            configurable: true,
            get: function () {
                return func(model);
            }
        });

        isInComputableCicle = true;
        model[propertyName];
        isInComputableCicle = false;

        var values = model.__values__;
        values[propertyName] = values[propertyName] || {};
        values[propertyName].notifications = values[propertyName].notifications || [];
        computableProperties.forEach(function (item) {
            item.computableNotifications.push(function () {
                values[propertyName].notifications.forEach(function (notification) {
                    notification(func(model));
                })
            });
        });
        computableProperties = [];
    };

    var triggerNotifications = function (viewModel) {
        for (var propertyName in viewModel) {
            viewModel.__values__[propertyName] &&
            viewModel.__values__[propertyName].notifications.forEach(function (notification) {
                notification(viewModel[propertyName]);
            });
        }
    };

    var parseBindingInfo = function (bindingString) {
        try {
            var json = bindingString.replace(/[\w\d-]+/g, '"$&"');
            return JSON.parse('{' + json + '}');
        } catch (ex) {
            throw 'Invalid syntax in binding: ' + bindingString;
        }
    };

    var addBindings = function (element, bindingInfo, viewModel) {
        for (var binding in bindingInfo) {
            if (bindings[binding] && !element.allreadyBound) {
                var propertyName = bindingInfo[binding];
                var propertyValue = viewModel[propertyName];
                var bindingContext={
                    element:element,
                    propertyValue:propertyValue,
                    viewModel:viewModel,
                    propertyName:propertyName
                }
                bindings[binding].init(bindingContext);
            }
        }
    };

    var bindings = {
        click: {
            init: function (bindingContext) {
                if (typeof(bindingContext.propertyValue) === 'function') {
                    bindingContext.element.onclick = bindingContext.propertyValue;
                } else {
                    throw bindingContext.propertyValue + ' is not a function';
                }
            }
        },
        text: {
            init: function (bindingContext) {
                self.addNotification(bindingContext.viewModel, bindingContext.propertyName, function (value) {
                    bindingContext.element.innerHTML = value;
                });
            },
            update: function () {

            }
        },
        value: {
            init: function (bindingContext) {
                self.addNotification(bindingContext.viewModel, bindingContext.propertyName, function (value) {
                    bindingContext.element.value = value;
                });
                bindingContext.element.onchange = function () {
                    bindingContext.viewModel[bindingContext.propertyName] = bindingContext.element.value;
                };
            },
            update: function () {

            }
        },
        liveValue: {
            init: function (bindingContext) {
                self.addNotification(bindingContext.viewModel, bindingContext.propertyName, function (value) {
                    bindingContext.element.value = value;
                });
                bindingContext.element.onkeyup = function () {
                    bindingContext.viewModel[bindingContext.propertyName] = bindingContext.element.value;
                };
            },
            update: function () {

            }
        },
        template: {
            init: function (bindingContext) {
                var templateText = document.getElementById(bindingContext.propertyName.name).innerHTML;
                bindingContext.element.innerHTML = templateText;
                bindElements(bindingContext.element.childNodes,
                    bindingContext.viewModel[bindingContext.propertyName.model]);
            },
            update: function () {

            }
        },
        foreach: {
            init: function (bindingContext) {
                var templateText = bindingContext.element.innerHTML;
                bindingContext.element.innerHTML = '';
                bindingContext.element.allreadyBound = true;
                var div = document.createElement('div');
                var createdElements = document.createDocumentFragment();
                var configuration = bindingContext.propertyValue;
                configuration.forEach(function (item, index) {
                    div.innerHTML = templateText;
                    bindElements(div.childNodes, item);
                    while (div.childNodes.length) {
                        div.childNodes[0].allreadyBound = true;
                        createdElements.appendChild(div.childNodes[0]);
                    }
                });
                bindingContext.element.appendChild(createdElements);
            },
            update: function () {

            }
        },
        visible: {
            init: function (bindingContext) {
                var element=bindingContext.element;
                var display = '';
                self.addListener(bindingContext.viewModel, bindingContext.propertyName, function (value) {
                    if (value) {
                        element.style.display = display;
                    } else {
                        display = element.style.display === 'none' ? '' : element.style.display;
                        element.style.display = 'none';
                    }
                });
            },
            update: function () {

            }
        },
        attributes: {
            init: function (bindingContext) {
                var configuration=bindingContext.propertyName;
                for (var attributeName in configuration) {
                    self.addListener(bindingContext.viewModel, configuration[attributeName], function (value) {
                        bindingContext.element.setAttribute(attributeName, value);
                    })
                }
            },
            update: function () {

            }
        }
    };

})();