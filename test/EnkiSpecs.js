describe('enki binder', function () {
    var testObject = {normalProperty: 1,
        objectProperty:{nestedProperty:1},
        arrayProperty: [1, 2, 3]
    };
    enki.init(testObject);

    it('should attach functioning notifiers', function () {
        var updateResult = 0;
        enki.addListener(testObject, 'normalProperty', function (value) {
            updateResult = value;
        });
        testObject.normalProperty = 'test';
        expect(updateResult).toBe('test');
    });

    it('should work for nested properties', function () {
        var updateResult = 0;
        enki.addListener(testObject, 'objectProperty.nestedProperty', function (value) {
            updateResult = value;
        });
        testObject.objectProperty.nestedProperty = 'test';
        expect(updateResult).toBe('test');
    });

    it('should work for properties that are arrays',function(){
        var updateResult=0;
        enki.addListener(testObject, 'normalProperty.nestedProperty', function (value) {
            updateResult = value;
        });
        testObject.arrayProperty=[1,3,5];
        expect(updateResult).toEqual([1,3,5]);
    });

    it('shouldn\'t affect property behavior', function () {
        testObject.normalProperty = 2;
        expect(testObject.normalProperty).toBe(2);
    });
});
