(function () {
    "use strict";
    var routing = {};
    var enkiContext;
    var routes = [];
    var components = {};
    var areas = {};
    var rootUrl = window.document.URL;
    var tokenMatch = '([a-z0-9]+)';
    /* eslint-disable no-unused-vars */
    var pageComponent;
    /* eslint-enable no-unused-vars */

    routing.init = function (context) {
        enkiContext = context;
    };

    enki.addPlugin(routing);

    enki.routing = {};


    enki.routing.registerRoot = function (url) {
        rootUrl = url;
    };

    enki.routing.goToRoot = function () {
        window.history.pushState({}, '', rootUrl);
    };

    enki.routing.registerRoute = function (route) {
        var routeInfo = route.url.split('/').filter(function (item) {
            return item;
        });
        var routeExpression = route.url;
        var tokens = routeInfo.filter(function (item) {
            return item.indexOf('{') >= 0 && item.indexOf('}') >= 0;
        }).map(function (item) {
            return item.replace('{', '').replace('}', '');
        });
        tokens.forEach(function (item) {
            routeExpression = routeExpression.replace('{' + item + '}', tokenMatch);
        });
        route.matchString = routeExpression.replace('\\', '\\\\');
        route.tokens = tokens;
        var flatParts = routeInfo.filter(function (item) {
            return item.indexOf('{') < 0 || item.indexOf('}') < 0;
        });
        route.flatTokens = flatParts;
        routes.push(route);
    };

    var registerArea = function (componentInfo) {
        if (!areas[componentInfo.area]) {
            areas[componentInfo.area] = {};
        }
        var area = areas[componentInfo.area];
        area[componentInfo.name] = componentInfo.component;
    };

    enki.routing.registerComponent = function (componentInfo) {
        if (componentInfo.area) {
            registerArea(componentInfo);
        } else {
            components[componentInfo.name] = componentInfo.component;
        }
    };

    var getUrlComponents = function (url, route) {
        var cleanUrl = url;
        route.flatTokens.forEach(function (token) {
            cleanUrl = cleanUrl.replace(token + '/', '');
            cleanUrl = cleanUrl.replace(token, '');
        });
        var tokenValues = cleanUrl.match(new RegExp(tokenMatch, 'gi'));
        var tokens = {};
        tokenValues.forEach(function (tokenValue, index) {
            tokens[route.tokens[index]] = tokenValue;
        });
        return tokens;
    };
    var parseUrl = function (url) {
        var urlComponents;
        for (var i = 0; i < routes.length; i++) {
            var match = url.match(new RegExp(routes[i].matchString, 'gi'));
            if (match && match.length === 1 && match[0] === url) {
                urlComponents = {
                    params: getUrlComponents(url, routes[i]),
                    route: routes[i]
                };
                break;
            }
        }
        if (!urlComponents) {
            var error = new Error('No registered route matched this url: ' + url);
            throw error;
        }
        return urlComponents;
    };

    var resolveComponent = function (params) {
        var componentLocation = components;
        if (params.area) {
            componentLocation = areas[params.area];
        }
        return componentLocation[params.component];
    };

    enki.routing.changePage = function (url) {
        try{
            window.history.pushState({}, '', url);
            var urlInfo = parseUrl(url);
            var componentConstructor = resolveComponent(urlInfo.params);
            pageComponent = componentConstructor(urlInfo.params);
        }catch(ex){
            enkiContext.logError(ex);
        }
    };

    enki.routing.clear = function () {
        routes = [];
        components = {};
        areas = {};
    };

})();