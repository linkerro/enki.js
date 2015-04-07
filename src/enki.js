(function () {
    "use strict";
    var self = {};
    window.enki = self;
    var computableProperties = [];
    var isInComputableCycle = false;
    var plugins = [];
    var components = {};
    var exceptionListeners = [];

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
            if (isInComputableCycle) {
                computableProperties.push(property);
            }
            return property.value;
        };
        return getter;
    };

    var initValues = function (object) {
        if (!object.__values__) {
            Object.defineProperty(object, '__values__', {
                enumerable: false,
                configurable: false,
                writable: false,
                value: {}
            });
            for (var propertyName in object) {
                object.__values__[propertyName] = object.__values__[propertyName] || {};
            }
        }
    };

    var getPropertyValue = function (object, accessor, parts) {
        parts = parts || accessor.split('.');
        return parts.length === 1 ? object[parts[0]] : getPropertyValue(object[parts[0]], '', parts.slice(1));
    };

    /**
     * The function that does all of the databinding for a document
     * @param {object} object - the view-model object used for the binding process
     */
    self.watch = function (object) {
        initValues(object);
        var values = object.__values__;

        for (var propertyName in object) {
            if (typeof(object[propertyName]) === 'function') {
                continue;
            }
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

        /* eslint-disable no-unused-expressions */
        object.__values__.extensions && object.__values__.extensions.forEach(function (item) {
            self.addComputable(item.model, item.propertyName, item.func);
        });
        /* eslint-enable no-unused-expressions */

        if (plugins.length > 0) {
            plugins.forEach(function (plugin) {
                /* eslint-disable no-unused-expressions */
                plugin.onWatch && plugin.onWatch(object);
                /* eslint-enable no-unused-expressions */
            });
        }
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
                var attribute = element.getAttribute('data-bind');
                if (attribute) {
                    var bindingInfo = parseBindingInfo(attribute);
                    addBindings(element, bindingInfo, viewModel);
                }
            }
            triggerNotifications(viewModel);
        } catch (ex) {
            var error = new Error('Invalid binding: ' + element.getAttribute('data-bind') + '. ' + ex);
            throw error;
        }
    };

    self.bindDocument = function (viewModel, elementId) {
        try {
            var viewModelInstance = typeof(viewModel) === 'function' ? viewModel() : viewModel;
            self.watch(viewModelInstance);
            var elements = document.querySelectorAll((elementId ? '#' + elementId + ' ' : '') + '[data-bind*="if"]');
            bindElements(elements, viewModelInstance);
            elements = document.querySelectorAll((elementId ? '#' + elementId + ' ' : '') + '[data-bind*="foreach"]');
            bindElements(elements, viewModelInstance);
            elements = document.querySelectorAll((elementId ? '#' + elementId + ' ' : '') + '[data-bind]');
            bindElements(elements, viewModelInstance);
        } catch (ex) {
            logError(ex);
        }
    };

    self.addNotification = function (viewModel, propertyName, func) {
        if (!viewModel.__values__) {
            self.watch(viewModel);
        }
        viewModel.__values__[propertyName].notifications.push(func);
    };

    self.addCustomBinding = function (name, binding) {
        binding.isCustom = true;
        bindings[name] = binding;
    };

    self.removeCustomBinding = function (name) {
        /* eslint-disable no-unused-expressions */
        bindings[name] && bindings[name].isCustom && delete bindings[name];
        /* eslint-enable no-unused-expressions */
    };

    self.addCustomConverter = function (name, converter) {
        converter.isCustom = true;
        converters[name] = converter;
    };

    self.removeCustomConverter = function (name) {
        /* eslint-disable no-unused-expressions */
        converters[name] && converters[name].isCustom && delete converters[name];
        /* eslint-enable no-unused-expressions */
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

        // Magic warning: Accessing the model[propertyName] triggers its getter and logs every other observable that is
        // touched. I know it's stupid to write it like this and I'm open to suggestions.
        isInComputableCycle = true;
        /* eslint-disable no-unused-expressions */
        model[propertyName];
        /* eslint-enable no-unused-expressions */
        isInComputableCycle = false;

        var values = model.__values__;
        values[propertyName] = values[propertyName] || {};
        values[propertyName].notifications = values[propertyName].notifications || [];
        computableProperties.forEach(function (item) {
            item.computableNotifications.push(function () {
                values[propertyName].notifications.forEach(function (notification) {
                    notification(func(model));
                });
            });
        });
        computableProperties = [];
    };

    var triggerNotifications = function (viewModel) {
        for (var propertyName in viewModel) {
            /* eslint-disable no-unused-expressions */
            viewModel.__values__[propertyName] &&
            viewModel.__values__[propertyName].notifications &&
            viewModel.__values__[propertyName].notifications.forEach(function (notification) {
                notification(viewModel[propertyName]);
            });
            /* eslint-enable no-unused-expressions */
        }
    };

    var parseBindingInfo = function (bindingString) {
        try {
            var json = bindingString.replace(/[.\w\d-]+/g, '"$&"');
            return JSON.parse('{' + json + '}');
        } catch (ex) {
            var error = new Error('Invalid syntax in binding: ' + bindingString);
            throw error;
        }
    };

    var memorizeBoundElement = function (viewModel, propertyName, element) {
        if (typeof(propertyName) !== 'string') {
            return;
        }
        viewModel.__values__[propertyName].elements = viewModel.__values__[propertyName].elements || [];
        viewModel.__values__[propertyName].elements.push(element);
    };

    var addBindings = function (element, bindingInfo, viewModel) {
        var getPropertyInfo = function (model, names) {
            if (names.length === 1) {
                return {
                    value: model[names[0]],
                    model: model,
                    name: names[0]
                };
            }
            var nextModel = model[names[0]];
            return getPropertyInfo(nextModel, names.splice(1));
        };
        for (var bindingName in bindingInfo) {
            if (bindings[bindingName] && !element.allreadyBound) {
                var propertyName = bindingInfo[bindingName];
                var propertyInfo = getPropertyInfo(viewModel, propertyName.split('.'));
                var bindingContext = {
                    element: element,
                    propertyValue: propertyInfo.value,
                    viewModel: propertyInfo.model,
                    propertyName: propertyInfo.name
                };

                /* eslint-disable no-unused-expressions */
                bindings[bindingName].init && bindings[bindingName].init(bindingContext);
                /* eslint-enable no-unused-expressions */

                if (bindings[bindingName].update) {
                    if (typeof(propertyName) === 'object' && propertyName.converter) {
                        var converterContext = propertyName;
                        if (!converters[converterContext.converter]) {
                            var error = new Error('No such converter: ' + converterContext.converter);
                            throw error;
                        }
                        self.addNotification(viewModel, converterContext.value, function () {
                            bindingContext.propertyValue = converters[converterContext.converter].toView
                                .call(self, viewModel[converterContext.value], converterContext.parameter);
                            bindings[bindingName].update(bindingContext);
                        });
                    } else {
                        bindings[bindingName].update(bindingContext);
                        self.addNotification(bindingContext.viewModel, bindingContext.propertyName, function (value) {
                            bindingContext.propertyValue = value;
                            bindings[bindingName].update(bindingContext);
                        });
                    }
                }
                memorizeBoundElement(bindingContext.viewModel, bindingContext.propertyName, element);
            }
        }
    };

    var bindings = {
        click: {
            init: function (bindingContext) {
                if (typeof(bindingContext.propertyValue) === 'function') {
                    bindingContext.element.onclick = function (event) {
                        bindingContext.propertyValue(event, bindingContext.viewModel);
                    };
                } else {
                    throw new Error(bindingContext.propertyValue + ' is not a function');
                }
            }
        },
        text: {
            update: function (bindingContext) {
                bindingContext.element.innerHTML = bindingContext.propertyValue;
            }
        },
        value: {
            init: function (bindingContext) {
                bindingContext.element.onchange = function () {
                    bindingContext.viewModel[bindingContext.propertyName] = bindingContext.element.value;
                };
            },
            update: function (bindingContext) {
                bindingContext.element.value = bindingContext.propertyValue;
            }
        },
        liveValue: {
            init: function (bindingContext) {
                bindingContext.element.onkeyup = function () {
                    bindingContext.viewModel[bindingContext.propertyName] = bindingContext.element.value;
                };
            },
            update: function (bindingContext) {
                bindingContext.element.value = bindingContext.propertyValue;
            }
        },
        template: {
            init: function (bindingContext) {
                var templateText = document.getElementById(bindingContext.propertyName.name).innerHTML;
                bindingContext.element.innerHTML = templateText;
                bindElements(bindingContext.element.childNodes,
                    bindingContext.viewModel[bindingContext.propertyName.model]);
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
                configuration.forEach(function (item) {
                    div.innerHTML = templateText;
                    bindElements(div.childNodes, item);
                    while (div.childNodes.length) {
                        div.childNodes[0].allreadyBound = true;
                        createdElements.appendChild(div.childNodes[0]);
                    }
                });
                bindingContext.element.appendChild(createdElements);
            }
        },
        visible: {
            init: function (bindingContext) {
                var element = bindingContext.element;
                var display = '';
                self.addListener(bindingContext.viewModel, bindingContext.propertyName, function (value) {
                    if (value) {
                        element.style.display = display;
                    } else {
                        display = element.style.display === 'none' ? '' : element.style.display;
                        element.style.display = 'none';
                    }
                });
            }
        },
        attributes: {
            init: function (bindingContext) {
                var configuration = bindingContext.propertyName;
                for (var attributeName in configuration) {
                    self.addListener(bindingContext.viewModel, configuration[attributeName], function (value) {
                        bindingContext.element.setAttribute(attributeName, value);
                    });
                }
            }
        },
        cssClass: {
            init: function (bindingContext) {
                var configuration = bindingContext.propertyName;
                for (var className in configuration) {
                    self.addListener(bindingContext.viewModel, configuration[className], function (value) {
                        /* eslint-disable no-unused-expressions */
                        value ? bindingContext.element.classList.add(className) :
                            bindingContext.element.classList.remove(className);
                        /* eslint-enable no-unused-expressions */
                    });
                }
            }
        },
        event: {
            init: function (bindingContext) {
                var configuration = bindingContext.propertyName;
                for (var eventName in configuration) {
                    var eventCall = function (event) {
                        bindingContext.viewModel[configuration[eventName]](event, bindingContext.viewModel);
                    };
                    bindingContext.element[eventName] = eventCall;
                }
            }
        },
        checked: {
            init: function (bindingContext) {
                bindingContext.element.onclick = function () {
                    bindingContext.viewModel[bindingContext.propertyName] = bindingContext.element.checked;
                };
            },
            update: function (bindingContext) {
                bindingContext.element.checked = bindingContext.propertyValue;
            }
        },
        if: {
            init: function (bindingContext) {
                bindingContext.element.allreadyBound = true;
                var ifHtml = bindingContext.element.innerHTML;
                bindingContext.element.innerHTML = '';
                self.addListener(bindingContext.viewModel, bindingContext.propertyName, function (value) {
                    if (value) {
                        bindingContext.element.innerHTML = ifHtml;
                        bindElements(bindingContext.element.childNodes, value);
                    } else {
                        bindingContext.element.innerHTML = '';
                    }
                });
            }
        },
        component: {
            init: function (bindingContext) {
                var settings = {};
                for (var property in bindingContext.propertyName) {
                    if (property !== 'name') {
                        settings[property] = getPropertyValue(bindingContext.viewModel, property);
                    }
                }
                self.watch(settings);
                var component = components[bindingContext.propertyName.name](settings);
                bindingContext.element.innerHTML = document.getElementById(component.template).innerHTML;
                bindElements(bindingContext.element.childNodes, component.viewModel);
            }
        }
    };

    var converters = {
        fixedPrecision: {
            toView: function (value, size) {
                return value.toFixed(size);
            }
        },
        shortDate: {
            toView: function (value) {
                return value.toLocaleDateString();
            }
        },
        time: {
            toView: function (value) {
                return value.toLocaleTimeString();
            }
        }
    };

    var getMetadata = function (viewModel) {
        /* eslint-disable no-unused-expressions */
        !viewModel.__values__ && initValues(viewModel);
        /* eslint-enable no-unused-expressions */
        return viewModel.__values__;
    };

    self.addPlugin = function (plugin) {
        var pluginContext = {
            initValues: initValues,
            logError: logError,
            bindElements: bindElements,
            getMetadata: getMetadata
        };
        plugins.push(plugin);
        /* eslint-disable no-unused-expressions */
        plugin.init && plugin.init(pluginContext);
        /* eslint-enable no-unused-expressions */
    };

    self.registerComponent = function (name, initializer) {
        components[name] = initializer;
    };

    self.removeComponent = function (name) {
        delete components[name];
    };

    self.exceptions = {
        addListener: function (listener) {
            exceptionListeners.push(listener);
        },
        clearListeners: function () {
            exceptionListeners = [];
        },
        shouldHideErrors: false
    };

    var logError = function (error) {
        var errorWrapper = {
            message: error.message,
            userAgent: window.navigator.userAgent,
            stackTrace: error.stack,
            original: error,
            url: window.document.URL
        };
        exceptionListeners.forEach(function (listener) {
            /* eslint-disable no-unused-expressions */
            listener && listener(errorWrapper);
            /* eslint-enable no-unused-expressions */
        });
        if (!self.exceptions.shouldHideErrors) {
            var enkiError = new Error('Enki encountered a problem: ' + errorWrapper.message);
            enkiError.originalError = error;
            throw enkiError;
        }
    };

})();