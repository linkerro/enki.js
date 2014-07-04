describe('enki binder', function () {
    var testObject = {x: 1,
        t:{y:1},
        z: [1, 2, 3]
    };
    testObject = {t: {y: 1},
        x: 1};
    enki.init(testObject);

    it('should attach functioning notifiers', function () {
        var updateResult = 0;
        enki.addListener(testObject, 'x', function (value) {
            updateResult = value;
        });
        testObject.x = 'test';
        expect(updateResult).toBe('test');
    });
    it('should work for nested properties', function () {
        var updateResult = 0;
        enki.addListener(testObject, 't.y', function (value) {
            updateResult = value;
        });
        testObject.t.y = 'test';
        expect(updateResult).toBe('test');
    });
    it('should work for properties that are arrays',function(){
        var updateResult=0;
        enki.addListener(testObject, 'x.y', function (value) {
            updateResult = value;
        });
        testObject.z=[1,3,5];
        expect(updateResult).toEqual([1,3,5]);
    });
    it('shouldn\'t affect property behavior', function () {
        testObject.x = 2;
        expect(testObject.x).toBe(2);
    });
});
