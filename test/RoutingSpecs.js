describe('enki routing', function () {

    var defaultRoute = {
        name: 'default',
        url: '{area}/{component}'
    };

    var defaultUrlExample = 'products/reviews';

    var complexRoute = {
        url:'{area}/{component}/{id}/reviews/{reviewId}',
        name:'complexRoute'
    };

    var complexRouteBadExample = 'buy/products/1234/reviews/244/fghjk';
    var complexRouteExample = 'buy/products/1234/reviews/244';

    var area,params;

    var component = function (componentContext) {
        area = componentContext.area;

        return {
            viewModel: {},
            template: 'templateName'
        }
    };


    beforeEach(function () {
        enki.routing.clear();
        area = undefined;
        params = undefined;
    });

    afterEach(function () {
        enki.routing.goToRoot();
    });

    xit('should add simple routes', function () {
        enki.routing.registerRoute(defaultRoute);
    });

    xit('should add complex routes', function () {
        enki.routing.registerRoute(complexRoute);
    });

    it('should register components', function () {
        enki.routing.registerComponent({
            name: 'default',
            component:component
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
        expect(area).toBe('buy');
    });
});