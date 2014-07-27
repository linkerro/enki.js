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

    var bindElements = function (elements, bindingContext) {
        try {
            for (var i = 0; i < elements.length; i++) {
                var element = elements[i];
                var bindingInfo = parseBindingInfo(element.getAttribute('data-bind'));
                addBindings(element, bindingInfo, bindingContext.viewModel)
            }
            triggerNotifications(bindingContext.viewModel);
        } catch (ex) {
            throw 'Invalid syntax in binding: ' + element.getAttribute('data-bind');
        }
    }

    self.bindDocument = function (viewModel, elementId) {
        self.watch(viewModel);
        var bindingContext = {
            viewModel: viewModel,
            $parent: null
        };
        document.__viewModel__ = viewModel;
        var elements = document.querySelectorAll((elementId ? '#' + elementId + ' ' : '') + '[data-bind*="foreach"]');
        bindElements(elements, bindingContext);
        elements = document.querySelectorAll((elementId ? '#' + elementId + ' ' : '') + '[data-bind]');
        bindElements(elements, bindingContext);
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
            var json = bindingString.replace(/[$\w\d-]+/g, '"$&"');
            return JSON.parse('{' + json + '}');
        } catch (ex) {
            throw 'Invalid syntax in binding: ' + bindingString;
        }
    };

    var addBindings = function (element, bindingInfo, bindingContext) {
        var viewModel=bindingContext.viewModel;
        for (var binding in bindingInfo) {
            if (bindings[binding] && !element.allreadyBound) {
                bindings[binding](element, viewModel[bindingInfo[binding]], viewModel, bindingInfo[binding], bindingContext);
            }
        }
    };

    var bindings = {
        click: function (element, func) {
            if (typeof(func) === 'function') {
                element.onclick = func;
            } else {
                throw func + ' is not a function';
            }
        },
        text: function (element, propertyValue, viewModel, propertyName) {
            self.addNotification(viewModel, propertyName, function (value) {
                element.innerHTML = value;
            });
        },
        value: function (element, propertyValue, viewModel, propertyName) {
            self.addNotification(viewModel, propertyName, function (value) {
                element.value = value;
            });
            element.onchange = function () {
                viewModel[propertyName] = element.value;
            };
        },
        liveValue: function (element, propertyValue, viewModel, propertyName) {
            self.addNotification(viewModel, propertyName, function (value) {
                element.value = value;
            });
            element.onkeyup = function () {
                viewModel[propertyName] = element.value;
            };
        },
        template: function (element, propertyValue, viewModel, configuration) {
            var templateText = document.getElementById(configuration.name).innerHTML;
            element.innerHTML = templateText;
            var bindingContext = {
                viewModel:viewModel[configuration.model],
                $parent:viewModel
            };
            bindElements(element.childNodes, bindingContext);
        },
        foreach: function (element, propertyValue) {
            var templateText = element.innerHTML;
            element.innerHTML = '';
            element.allreadyBound = true;
            var div = document.createElement('div');
            var createdElements = document.createDocumentFragment();
            propertyValue.forEach(function (item, index) {
                div.innerHTML = templateText;
                var bindingContext = {
                    viewModel:item,
                    $parent:propertyValue,
                    $item:item,
                    $index:index
                };
                bindElements(div.childNodes, bindingContext);
                while (div.childNodes.length) {
                    div.childNodes[0].allreadyBound = true;
                    createdElements.appendChild(div.childNodes[0]);
                }
            });
            element.appendChild(createdElements);
        },
        visible: function (element, propertyValue, viewModel, propertyName) {
            var display = '';
            self.addListener(viewModel, propertyName, function (value) {
                if (value) {
                    element.style.display = display;
                } else {
                    display = element.style.display === 'none' ? '' : element.style.display;
                    element.style.display = 'none';
                }
            });
        },
        attributes: function (element, propertyValue, viewModel, configuration) {
            for (var attributeName in configuration) {
                self.addListener(viewModel, configuration[attributeName], function (value) {
                    element.setAttribute(attributeName, value);
                })
            }
        }
    };

})();