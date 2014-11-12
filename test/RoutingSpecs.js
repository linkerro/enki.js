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

    var params;

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
    });

    afterEach(function () {
        enki.routing.goToRoot();
    });

    it('should add simple routes', function () {
        enki.routing.registerRoute(defaultRoute);
    });

    it('should add complex routes', function () {
        enki.routing.registerRoute(complexRoute);
    });

    it('should register components', function () {
        enki.routing.registerComponent({
            name: 'default',
            component: component
        });
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
});