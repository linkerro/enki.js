describe('enki routing', function () {
    it('should add routes', function () {
        var route={
            name:'default',
            url:'{area}/{component}'
        }
        enki.routing.registerRoute(route);
    });

    it('should register components', function () {
        var component = function (componentContext) {
            return {
                viewModel: {},
                template: 'templateName'
            }
        };
        enki.routing.registerComponent({
            name: 'default',
            component:component
        });
    });

    xit('should identify route specified components', function () {

    });
});