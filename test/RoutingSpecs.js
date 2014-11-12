/* eslint-disable global-strict */
'use strict';
/* eslint-enable global-strict */

describe('enki routing', function () {

    var defaultRoute = {
        name: 'default',
        url: '{area}/{component}'
    };

    var defaultUrlExample = 'products/reviews';

    var complexRoute = {
        url: '{area}/{component}/{id}/reviews/{reviewId}',
        name: 'complexRoute'
    };

    /* eslint-disable no-unused-vars */
    var complexRouteBadExample = 'buy/products/1234/reviews/244/fghjk';
    /* eslint-enable no-unused-vars */
    var complexRouteExample = 'buy/products/1234/reviews/244';

    var params,error;

    var component = function (componentContext) {
        params = componentContext;

        return {
            viewModel: {},
            template: 'templateName'
        };
    };


    beforeEach(function () {
        enki.routing.clear();
        params = undefined;

        enki.exceptions.addListener(function (errorInfo) {
            error = errorInfo;
        });
    });

    afterEach(function () {
        enki.routing.goToRoot();
        enki.exceptions.clearListeners();
        error = undefined;
    });

    it('should add simple routes', function () {
        enki.routing.registerRoute(defaultRoute);
        expect(error).toBe(undefined);
    });

    it('should add complex routes', function () {
        enki.routing.registerRoute(complexRoute);
        expect(error).toBe(undefined);
    });

    it('should register components', function () {
        enki.routing.registerComponent({
            name: 'default',
            component: component
        });
        expect(error).toBe(undefined);
    });

    it('should identify route specified components', function () {
        enki.routing.registerRoute(complexRoute);
        enki.routing.registerComponent({
            name: 'products',
            area: 'buy',
            component: component
        });
        enki.routing.changePage(complexRouteExample);
        expect(params.area).toBe('buy');
        expect(params.id).toBe('1234');
        expect(params.reviewId).toBe('244');
        expect(error).toBe(undefined);
    });

    it('should identify the correct route', function () {
        enki.routing.registerRoute(complexRoute);
        enki.routing.registerRoute(defaultRoute);
        enki.routing.registerComponent({
            name: 'reviews',
            area: 'products',
            component: component
        });
        enki.routing.changePage(defaultUrlExample);
        expect(params.area).toBe('products');
        //expect(params.component)
    });

    it('should fail if no route is matched', function () {
        enki.routing.registerRoute(complexRoute);
        enki.routing.registerComponent({
            area: 'someAreaName',
            name: 'whatever',
            component: component
        });
        enki.routing.changePage(complexRouteBadExample);
        expect(error).toBeDefined();
        expect(error.message.indexOf('No registered route matched this url')>-1).toBe(true);
    });
});