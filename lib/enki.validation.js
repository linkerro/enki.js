(function () {
    var validation = {};
    var enkiContext = [];

    validation.init = function (context) {
        enkiContext = context;
    };

    validation.onWatch = function (viewModel) {
        var values = viewModel.__values__;
        for (var propertyName in values) {
            for (var attribute in values[propertyName].validationAttributes) {
                attributes[attribute] && enki.addListener(viewModel,propertyName, function (value) {
                    values[propertyName].isValid = attributes[attribute].validator(value);
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
})();