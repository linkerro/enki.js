(function () {
    "use strict";
    var validation = {};
    var enkiContext = {};
    var defaultErrorClass = 'invalidField';

    validation.init = function (context) {
        enkiContext = context;
    };

    validation.onWatch = function (viewModel) {
        var values = viewModel.__values__;
        for (var propertyName in values) {
            values[propertyName].validationMessages = []; //reset the messages for a property
            for (var attribute in values[propertyName].validationAttributes) {
                attributes[attribute] && enki.addListener(viewModel,propertyName, function (value) {
                    var isValid = attributes[attribute].validator(value);
                    values[propertyName].isValid = isValid;
                    if(!isValid) {
                        values[propertyName].validationMessages.push(attributes[attribute].message);
                        values[propertyName].elements.forEach(function (item) {
                            item.classList.add(defaultErrorClass);
                        })
                    }
                });
            }
        }
    };

    enki.validation = {};

    enki.validation.addMetadata = function (viewModel, validationInformation) {
        if (!viewModel.__values__) {
            enkiContext.initValues(viewModel);
        }
        for (var propertyName in validationInformation) {
            viewModel.__values__[propertyName].validationAttributes = validationInformation[propertyName];
        }
    };

    var attributes = {
        required:{
            validator:function (value) {
                return !!value;
            },
            message:'Field is required'
        }
    };

    enki.addPlugin(validation);

    enki.addCustomBinding('validationMessage', {
        init: function (bindingContext) {
            var settings = bindingContext.propertyName;
            var propertyName = settings.for;
            enki.addListener(bindingContext.viewModel, propertyName, function () {
                var propertyInfo = bindingContext.viewModel.__values__[propertyName];
                var isValid = propertyInfo.isValid;
                if(!isValid) {
                    bindingContext.element.innerHTML = propertyInfo.validationMessages.join(' ');
                }
            });
        }
    });
})();