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
    var container;

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

    function getMatchString(tokens, routeExpression) {
        tokens.forEach(function (item) {
            routeExpression = routeExpression.replace('{' + item + '}', tokenMatch);
        });
        return routeExpression;
    }

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
        routeExpression = getMatchString(tokens, routeExpression);
        var tokenDefaults = [];
        tokens.filter(function (item) {
            return item.indexOf(':') > -1;
        }).forEach(function (item) {
            var defaults = item.split(':');
            tokenDefaults.push({name: defaults[0], value: defaults[1]});
        });
        route.defaultValues = {};
        tokenDefaults.forEach(function (item) {
            route.defaultValues[item.name] = item.value;
        });
        route.matchStrings = [];
        route.matchStrings.push(routeExpression.replace('\\', '\\\\'));
        var tempUrl = route.url;
        tokenDefaults.reverse().forEach(function (item) {
            tempUrl = tempUrl.replace('{' + item.name + ':' + item.value + '}', '');
            route.matchStrings.push(getMatchString(tokens, tempUrl));
        });

        route.tokens = tokens.map(function (item) {
            var cleanItem = item.substring(0, item.indexOf(':'));
            return cleanItem || item;
        });

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
        var tokenValues = cleanUrl.match(new RegExp(tokenMatch, 'gi')) || [];
        var tokens = {};

        for (var defaultValue in route.defaultValues) {
            tokens[defaultValue] = route.defaultValues[defaultValue];
        }

        tokenValues.forEach(function (tokenValue, index) {
            tokens[route.tokens[index]] = tokenValue;
        });
        return tokens;
    };

    var parseUrl = function (url) {
        var urlComponents;
        for (var i = 0; i < routes.length; i++) {
            for (var j = 0; j < routes[i].matchStrings.length; j++) {
                var matchString = routes[i].matchStrings[j];
                var match = url.match(new RegExp(matchString, 'gi'));
                if (match && match.length === 1 && match[0] === url) {
                    urlComponents = {
                        params: getUrlComponents(url, routes[i]),
                        route: routes[i]
                    };
                    break;
                }
            }
            if (match && match.length === 1 && match[0] === url) {
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

    var initializeTemplate = function (pageComponent) {
        var componentTemplate = window.document.getElementById(pageComponent.template);
        container.innerHTML = componentTemplate.innerHTML;
        enki.bindDocument(pageComponent.viewModel, container.id);
    };

    enki.routing.changePage = function (url) {
        try {
            window.history.pushState({}, '', rootUrl + url);
            var urlInfo = parseUrl(url);
            var componentConstructor = resolveComponent(urlInfo.params);
            if (!componentConstructor) {
                var error = new Error('No registered route matched component named: ' + urlInfo.params.component);
                throw error;
            }
            pageComponent = componentConstructor(urlInfo.params);
            initializeTemplate(pageComponent);
        } catch (ex) {
            enkiContext.logError(ex);
        }
    };

    enki.routing.clear = function () {
        routes = [];
        components = {};
        areas = {};
    };

    enki.routing.registerContainer = function (containerId) {
        container = window.document.getElementById(containerId);
    };

})();