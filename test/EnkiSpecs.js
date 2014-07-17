describe('enki object initializer', function () {
    var viewModel1 = {normalProperty: 1,
        objectProperty: {nestedProperty: 1},
        arrayProperty: [1, 2, 3],
        testFunction: function () {
            return true;
        }
    };
    enki.watch(viewModel1);

    it('should attach functioning notifiers', function () {
        var updateResult = 0;
        enki.addListener(viewModel1, 'normalProperty', function (value) {
            updateResult = value;
        });
        viewModel1.normalProperty = 'test';
        expect(updateResult).toBe('test');
    });

    it('should work for nested properties', function () {
        var updateResult = 0;
        enki.addListener(viewModel1, 'objectProperty.nestedProperty', function (value) {
            updateResult = value;
        });
        viewModel1.objectProperty.nestedProperty = 'test';
        expect(updateResult).toBe('test');
    });

    it('should work for properties that are arrays', function () {
        var updateResult = 0;
        enki.addListener(viewModel1, 'arrayProperty', function (value) {
            updateResult = value;
        });
        viewModel1.arrayProperty = [1, 3, 5];
        expect(updateResult).toEqual([1, 3, 5]);
        viewModel1.arrayProperty.push(7);
        expect(updateResult).toEqual([1, 3, 5, 7]);
    });

    it('should attach computable properties', function () {
        enki.addComputable(viewModel1, 'computable', function (model) {
            return model.objectProperty.nestedProperty + model.normalProperty;
        });
        viewModel1.objectProperty.nestedProperty = 1;
        viewModel1.normalProperty = 20;
        expect(viewModel1.computable).toBe(21);
    });

    it('should notify computables of changes in tracked properties', function () {
        var callCount = 0;
        enki.addComputable(viewModel1, 'computable2', function (model) {
            return model.objectProperty.nestedProperty + model.normalProperty;
        });
        enki.addListener(viewModel1, 'computable2', function () {
            callCount += 1;
        });
        viewModel1.objectProperty.nestedProperty = 203;
        viewModel1.normalProperty = 3;
        expect(callCount).toBe(2);
    });

    it('shouldn\'t affect property behavior', function () {
        viewModel1.normalProperty = 2;
        expect(viewModel1.normalProperty).toBe(2);
    });
});

describe('enki document binder', function () {
    var viewModel1 = {normalProperty: 1,
        objectProperty: {nestedProperty: 1},
        arrayProperty: [1, 2, 3],
        testFunction: function () {
            return true;
        }
    };
    it('should fail on bad databinding information', function () {
        setFixtures(sandbox('<div data-bind="click: ,lakjsdflkjf"></div>'));
        expect(enki.bindDocument).toThrow();
    });

    xit('should parse data-bound items', function () {
        setFixtures(sandbox('<div data-bind="click: testFunction"></div>'));
        enki.bindDocument();
        expect(enki.bindingInfo).toEqual({click: 'testFunction'});
    });

    xit('should parse nested objects', function () {
        setFixtures(sandbox('<div data-bind="style: {backgroundColor:test,padding:5px}"></div>'));
        enki.bindDocument();
        expect(enki.bindingInfo).toEqual({style: {backgroundColor: 'test', padding: '5px'}})
    });
});

describe('enki bindings', function () {
    describe('text and value bindings', function () {
        it('should trigger one way binding', function () {
            var viewModel = {normalProperty: 1};
            setFixtures(sandbox('<div id="bindingTest" data-bind="text: normalProperty"></div>'));
            enki.bindDocument(viewModel);
            viewModel.normalProperty = 'lkajsdflkjsf';
            var element = document.getElementById('bindingTest');
            expect(element.innerHTML).toBe(viewModel.normalProperty);
        });
        it('should trigger two way binding', function () {
            var viewModel = {normalProperty: 1};
            setFixtures(sandbox('<div id="bindingTest" data-bind="text: normalProperty"></div>' +
                '<input id="bindingTest2" type="text" data-bind="value: normalProperty" />'));
            enki.bindDocument(viewModel);
            var element = document.getElementById('bindingTest');
            var input = document.getElementById('bindingTest2');
            input.value = 'asfasdfasfd';
            input.onchange();
            expect(element.innerHTML).toBe(input.value);
        });
        it('should trigger two way live binding', function () {
            var viewModel = {normalProperty: 1};
            setFixtures(sandbox('<div id="bindingTest" data-bind="text: normalProperty"></div>' +
                '<input id="bindingTest2" type="text" data-bind="liveValue: normalProperty" />'));
            enki.bindDocument(viewModel);
            var element = document.getElementById('bindingTest');
            var input = document.getElementById('bindingTest2');
            input.value = 'asfasdfasfd';
            input.onkeyup();
            expect(element.innerHTML).toBe(input.value);
        });
        it('should trigger bindings for computed properties', function () {
            var viewModel = {property1: 'sdf',
                property2: 'sdf'};
            enki.extend(viewModel, 'computed', function (model) {
                return model.property1 + model.property2;
            });
            setFixtures('<div id="bindingTest" data-bind="text: computed"></div>' +
                '<input id="input1" type="text" data-bind="liveValue: property1" />' +
                '<input id="input2" type="text" data-bind="value: property2" />');
            enki.bindDocument(viewModel);
            var element = document.getElementById('bindingTest');
            var input1 = document.getElementById('input1');
            var input2 = document.getElementById('input2');
            var value = 'alfalfa';
            input1.value = value;
            input2.value = value;
            input1.onkeyup();
            input2.onchange();
            expect(element.innerHTML).toBe(value + value);
        });
        it('should trigger bindings for multiple computed properties', function () {
            var viewModel = {property1: 'sdf',
                property2: 'sdf'};
            enki.extend(viewModel, 'computed', function (model) {
                return model.property1 + model.property2;
            });
            enki.extend(viewModel, 'computed2', function (model) {
                return model.property2 + model.property1;
            });
            setFixtures('<div id="bindingTest" data-bind="text: computed"></div>' +
                '<div id="bindingTest2" data-bind="text: computed2"></div>' +
                '<input id="input1" type="text" data-bind="liveValue: property1" />' +
                '<input id="input2" type="text" data-bind="value: property2" />');
            enki.bindDocument(viewModel);
            var element1 = document.getElementById('bindingTest');
            var element2 = document.getElementById('bindingTest2');
            var input1 = document.getElementById('input1');
            var input2 = document.getElementById('input2');
            var value1 = 'alfalfa';
            var value2 = 'lksjdfk';
            input1.value = value1;
            input2.value = value2;
            input1.onkeyup();
            input2.onchange();
            expect(element1.innerHTML).toBe(value1 + value2);
            expect(element2.innerHTML).toBe(value2 + value1);
        });
    });
    describe('click binding', function () {
        it('should trigger the clicked event', function () {
            setFixtures(sandbox('<div id="clickTest" data-bind="click: testFunction"></div>'));
            var hasClicked = false;
            var viewModel = {testFunction: function () {
                hasClicked = true;
            }};
            enki.bindDocument(viewModel);
            document.getElementById('clickTest').onclick();
            expect(hasClicked).toBe(true);
        });
    });
    describe('specific element binding', function () {
        it('should bind text and value fields', function () {
            var viewModel = {prop1: 'lkjlkj',
                prop2: 'dfvbnmngtyh'};
            setFixtures('<div id="view"><div id="textTest" data-bind="text:prop1"></div>' +
                '<input type="text" id="valueTest" data-bind="value:prop2" /></div>' +
                '<div id="outsideView" data-bind="textTest"></div>');
            enki.bindDocument(viewModel, 'view');
            var div = document.getElementById('textTest');
            var div2 = document.getElementById('outsideView');
            var input = document.getElementById('valueTest');
            expect(div.innerHTML).toBe(viewModel.prop1);
            expect(input.value).toBe(viewModel.prop2);
            expect(div2.innerHTML).toBe('');
        });
    })
    describe('multiple specific elements binding', function () {
        it('should bind text and value fields', function () {
            var viewModel = {prop1: 'lkjlkj',
                prop2: 'dfvbnmngtyh'};
            var viewModel2 = {prop3: 'ljsdflkj'};
            setFixtures('<div id="view"><div id="textTest" data-bind="text:prop1"></div>' +
                '<input type="text" id="valueTest" data-bind="value:prop2" /></div>' +
                '<div id="outsideView" data-bind="textTest"></div>' +
                '<div id="view2"><div id="prop3" data-bind="text:prop3"></div></div>');
            enki.bindDocument(viewModel, 'view');
            enki.bindDocument(viewModel2, 'view2');
            var div = document.getElementById('textTest');
            var div2 = document.getElementById('outsideView');
            var input = document.getElementById('valueTest');
            var prop3 = document.getElementById('prop3');
            expect(div.innerHTML).toBe(viewModel.prop1);
            expect(input.value).toBe(viewModel.prop2);
            expect(div2.innerHTML).toBe('');
            expect(prop3.innerHTML).toBe(viewModel2.prop3);
        });
    })
});