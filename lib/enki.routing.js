(function () {
    "use strict";
    var routing = {};
    var enkiContext = {};
    var routes = [];
    var components = {};
    var areas = {};

    routing.init = function (context) {
        enkiContext = context;
    };

    enki.addPlugin(routing);

    var navigate = function (url) {

    };

    enki.routing = {};

    enki.routing.go = function (url) {
        document.history.pushState({}, '', url);
    };

    enki.routing.registerRoute = function (route) {
        routes.push(route);
    };

    var registerArea = function (componentInfo) {
        if(!areas[componentInfo.area]) {
            areas[componentInfo.area] = {};
        }
        var area = areas[componentInfo.area];
        area[componentInfo.name] = componentInfo.component;
    };

    enki.routing.registerComponent = function (componentInfo) {
        if(componentInfo.area) {
            registerArea(componentInfo);
        }else{
            components[componentInfo.name] = componentInfo.component;
        }
    };
})();