/* eslint-disable global-strict */
'use strict';
/* eslint-enable global-strict */

describe('enki object initializer', function () {
    var viewModel1 = {
        normalProperty: 1,
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
    afterEach(function () {
        enki.exceptions.shouldHideErrors = false;
    })
    it('should fail on bad databinding information', function () {
        setFixtures('<div data-bind="click: ,lakjsdflkjf"></div>');
        var hasError;
        enki.exceptions.addListener(function (error) {
            hasError = error;
        });
        enki.bindDocument();
        expect(hasError).toBeDefined();
    });

    it('should execute viewModel constructors', function () {
        setFixtures('<div id="div" data-bind="text:title"></div>');
        var div = document.getElementById('div');
        var viewModel = function () {
            return {
                title:'it works'
            }
        };
        enki.exceptions.shouldHideErrors = false;
        enki.bindDocument(viewModel);
        expect(div.innerHTML).toBe('it works');
    });

    xit('should parse data-bound items', function () {
        setFixtures('<div data-bind="click: testFunction"></div>');
        enki.bindDocument();
        expect(enki.bindingInfo).toEqual({click: 'testFunction'});
    });

    xit('should parse nested objects', function () {
        setFixtures('<div data-bind="style: {backgroundColor:test,padding:5px}"></div>');
        enki.bindDocument();
        expect(enki.bindingInfo).toEqual({style: {backgroundColor: 'test', padding: '5px'}});
    });
});

describe('enki bindings', function () {
    describe('text and value bindings', function () {
        it('should trigger one way binding', function () {
            var viewModel = {normalProperty: 1};
            setFixtures('<div id="bindingTest" data-bind="text: normalProperty"></div>');
            enki.bindDocument(viewModel);
            viewModel.normalProperty = 'lkajsdflkjsf';
            var element = document.getElementById('bindingTest');
            expect(element.innerHTML).toBe(viewModel.normalProperty);
        });
        it('should trigger two way binding', function () {
            var viewModel = {normalProperty: 1};
            setFixtures('<div id="bindingTest" data-bind="text: normalProperty"></div>' +
            '<input id="bindingTest2" type="text" data-bind="value: normalProperty" />');
            enki.bindDocument(viewModel);
            var element = document.getElementById('bindingTest');
            var input = document.getElementById('bindingTest2');
            input.value = 'asfasdfasfd';
            input.onchange();
            expect(element.innerHTML).toBe(input.value);
        });
        it('should trigger two way live binding', function () {
            var viewModel = {normalProperty: 1};
            setFixtures('<div id="bindingTest" data-bind="text: normalProperty"></div>' +
            '<input id="bindingTest2" type="text" data-bind="liveValue: normalProperty" />');
            enki.bindDocument(viewModel);
            var element = document.getElementById('bindingTest');
            var input = document.getElementById('bindingTest2');
            input.value = 'asfasdfasfd';
            input.onkeyup();
            expect(element.innerHTML).toBe(input.value);
        });
        it('should trigger bindings for computed properties', function () {
            var viewModel = {
                property1: 'sdf',
                property2: 'sdf'
            };
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
            var viewModel = {
                property1: 'sdf',
                property2: 'sdf'
            };
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
            setFixtures('<div id="clickTest" data-bind="click: testFunction"></div>');
            var hasClicked = false;
            var viewModel = {
                testFunction: function () {
                    hasClicked = true;
                }
            };
            enki.bindDocument(viewModel);
            document.getElementById('clickTest').onclick();
            expect(hasClicked).toBe(true);
        });
    });
    describe('visible binding', function () {
        it('should hide and show the given element', function () {
            setFixtures('<div id="hidable" data-bind="visible: isVisible"></div>');
            var viewModel = {isVisible: false};
            enki.bindDocument(viewModel);
            var div = document.getElementById('hidable');
            expect(div.style.display).toBe('none');
            viewModel.isVisible = true;
            expect(div.style.display).toBe('');
        });
        it('should keep the original display mode', function () {
            setFixtures('<div id="hidable" data-bind="visible: isVisible" style="display: inline"></div>');
            var viewModel = {isVisible: false};
            enki.bindDocument(viewModel);
            var div = document.getElementById('hidable');
            expect(div.style.display).toBe('none');
            viewModel.isVisible = true;
            expect(div.style.display).toBe('inline');
        });
    });

    describe('foreach binding', function () {
        it('should render and bind the foreach template', function () {
            setFixtures('<div id="div" data-bind="foreach:arrayProperty">' +
            '<div class="test" data-bind="text: prop"></div>' +
            '</div>');
            var viewModel = {
                arrayProperty: [
                    {prop: 1},
                    {prop: 2}
                ]
            };
            enki.bindDocument(viewModel);
            var divs = document.getElementsByClassName('test');
            expect(divs.length).toBe(2);
            expect(divs[0].innerHTML).toBe('1');
            expect(divs[1].innerHTML).toBe('2');
        });
        it('should render and bind a foreach template containing multiple elements', function () {
            setFixtures('<div id="div" data-bind="foreach:arrayProperty">' +
            '<div class="test" data-bind="text: prop"></div>' +
            '<div class="test" data-bind="text: prop"></div>' +
            '</div>');
            var viewModel = {
                arrayProperty: [
                    {prop: 1},
                    {prop: 2}
                ]
            };
            enki.bindDocument(viewModel);
            var divs = document.getElementsByClassName('test');
            expect(divs.length).toBe(4);
            expect(divs[0].innerHTML).toBe('1');
            expect(divs[1].innerHTML).toBe('1');
            expect(divs[2].innerHTML).toBe('2');
            expect(divs[3].innerHTML).toBe('2');
        });
    });
    describe('attributes binding', function () {
        it('should bind to element attributes', function () {
            setFixtures('<div id="attributes" data-bind="attributes:{airplane:isAirplane}"></div>');
            var viewModel = {isAirplane: false};
            enki.bindDocument(viewModel);
            var div = document.getElementById('attributes');
            expect(div.getAttribute('airplane')).toBe('false');
            viewModel.isAirplane = true;
            expect(div.getAttribute('airplane')).toBe('true');
        });
        it('should bind to attributs that have invalid javascript names', function () {
            setFixtures('<div id="attributes" data-bind="attributes:{data-manipulation:isManipulated}"></div>');
            var viewModel = {isManipulated: false};
            enki.bindDocument(viewModel);
            var div = document.getElementById('attributes');
            expect(div.getAttribute('data-manipulation')).toBe('false');
        });
    });
    describe('css class binding', function () {
        it('should bind css classes', function () {
            setFixtures('<div id="bound" data-bind="cssClass:{selected:isSelected,disabled:isDisabled}"></div>');
            var viewModel = {
                isSelected: false,
                isDisabled: true
            };
            enki.bindDocument(viewModel);
            var div = document.getElementById('bound');
            expect(div.classList.toString()).toBe('disabled');
        });
        it('should maintain old classes', function () {
            setFixtures('<div id="bound" class="oldClass" data-bind="cssClass:{selected:isSelected,disabled:isDisabled}"></div>');
            var viewModel = {
                isSelected: false,
                isDisabled: true
            };
            enki.bindDocument(viewModel);
            var div = document.getElementById('bound');
            expect(div.classList.toString()).toBe('oldClass disabled');
        });
    });
    describe('event binding', function () {
        it('should propagate the attached event', function () {
            setFixtures('<div id="div" data-bind="event:{onclick:click}"></div>');
            var wasClicked = false;
            var viewModel = {
                click: function () {
                    wasClicked = true;
                }
            };
            enki.bindDocument(viewModel);
            var div = document.getElementById('div');
            div.onclick();
            expect(wasClicked).toBe(true);
        });
    });

    describe('checked binding', function () {
        it('should set the clicked property of a checkbox', function () {
            setFixtures('<input type="checkbox" id="checkbox" data-bind="checked:isChecked" />');
            var viewModel = {
                isChecked: true
            };
            enki.bindDocument(viewModel);
            var input = document.getElementById('checkbox');
            expect(input.checked).toBe(true);
            input.checked = false;
            input.onclick();
            expect(viewModel.isChecked).toBe(false);
        });

    });

    describe('if binding', function () {
        it('should hide the content in case of falsey value', function () {
            setFixtures('<div id="container" data-bind="if:falseyProperty"><span>this shouldn\'t be here</span></div>');
            var viewModel = {
                falseyProperty: 0
            };
            enki.bindDocument(viewModel);
            var div = document.getElementById('container');
            expect(div.innerHTML).toBe('');
        });

        it('should show the content in case of truthy value', function () {
            setFixtures('<div id="container" data-bind="if:property"><span>this should be here</span></div>');
            var viewModel = {
                property: false
            };
            enki.bindDocument(viewModel);
            var div = document.getElementById('container');
            expect(div.innerHTML).toBe('');
            viewModel.property = true;
            expect(div.innerHTML).toBe('<span>this should be here</span>');
        });

        it('should stop binding inside the if bound element', function () {
            setFixtures('<div id="container" data-bind="if:property">' +
            '<span id="bound" data-bind="text:prop1"></span>' +
            '</div>');
            var viewModel = {
                property: undefined
            };
            enki.bindDocument(viewModel);
            var div = document.getElementById('container');
            expect(div.innerHTML).toBe('');
            viewModel.property = {prop1: 'test'};
            expect(div.innerHTML).toBe('<span id="bound" data-bind="text:prop1">test</span>');
        });


    });

    describe('binding on elements instead of document', function () {
        it('should bind text and value fields', function () {
            var viewModel = {
                prop1: 'lkjlkj',
                prop2: 'dfvbnmngtyh'
            };
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
        it('should apply multiple specific elements binding', function () {
            var viewModel = {
                prop1: 'lkjlkj',
                prop2: 'dfvbnmngtyh'
            };
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
    });
});

describe('templating system', function () {
    it('should bind a template', function () {
        setFixtures('<script type="text/html" id="template"><div id="testDiv" data-bind="text: prop"></div></script>' +
        '<div data-bind="template: {name: template,model:model}"></div>');
        var viewModel = {model: {prop: 'propertyValue'}};
        enki.bindDocument(viewModel);
        var div = document.getElementById('testDiv');
        expect(div.innerHTML).toBe(viewModel.model.prop);
    });
    it('should bind multiple templates', function () {
        setFixtures('<script type="text/html" id="template"><div class="testDiv" data-bind="text: prop"></div></script>' +
        '<div id="div1" data-bind="template: {name: template,model:model}"></div>' +
        '<div id="div2" data-bind="template: {name: template,model:model2}"></div>');
        var viewModel = {
            model: {prop: 'propertyValue'},
            model2: {prop: 'ftyuk,mnbftyj'}
        };
        enki.bindDocument(viewModel);
        var div1 = document.getElementById('div1').getElementsByClassName('testDiv')[0];
        var div2 = document.getElementById('div2').getElementsByClassName('testDiv')[0];
        expect(div1.innerHTML).toBe(viewModel.model.prop);
        expect(div2.innerHTML).toBe(viewModel.model2.prop);
    });
});

describe('component system', function () {
    it('should bind components', function () {
        setFixtures('<script type="text/html" id="componentTemplate"><div class="testDiv" data-bind="text:prop"></div></script>' +
        '<div id="div" data-bind="component: {name: component, model:model}"></div>');
        enki.registerComponent('component', function (componentContext) {
            return {
                viewModel: {prop: componentContext.model},
                template: 'componentTemplate'
            };
        });
        var viewModel = {model: 'test'};
        enki.bindDocument(viewModel);
        var div = document.getElementById('div');
        var componentDivs = div.getElementsByClassName('testDiv');
        expect(componentDivs.length).toBe(1);
        expect(componentDivs[0].innerHTML).toBe('test');
        enki.removeComponent('component');
    });
});

describe('converter system', function () {
    it('should format numbers to fixed precision', function () {
        setFixtures('<div id="formatted" data-bind="text:{value:number,converter:fixedPrecision,parameter:2}"></div>');
        var viewModel = {
            number: 23.4567
        };
        enki.bindDocument(viewModel);
        var div = document.getElementById('formatted');
        expect(div.innerHTML).toBe('23.46');
    });
    it('should format short dates', function () {
        setFixtures('<div id="formatted" data-bind="text:{value:date, converter:shortDate}"></div>');
        var viewModel = {
            date: new Date(1406795490414)
        };
        enki.bindDocument(viewModel);
        var div = document.getElementById('formatted');
        expect(div.innerHTML).toBe(viewModel.date.toLocaleDateString());
    });
    it('should format time', function () {
        setFixtures('<div id="formatted" data-bind="text:{value:date, converter:time}"></div>');
        var viewModel = {
            date: new Date(1406795490414)
        };
        enki.bindDocument(viewModel);
        var div = document.getElementById('formatted');
        expect(div.innerHTML).toBe(viewModel.date.toLocaleTimeString());
    });
});

describe('error system', function () {
    beforeEach(function () {
        enki.exceptions.shouldHideErrors = true;
    });
    afterEach(function () {
        enki.exceptions.shouldHideErrors = true;
    });

    it('should offer you a place to attach an error logger', function () {
        var error;
        setFixtures('<div id="test" data-bind="text:lkajsdflkj"></div>');
        enki.exceptions.addListener(function (exception) {
            error = exception;
        });
        enki.bindDocument({});
        expect(error).toBeDefined();
        expect(error.stackTrace).toBeDefined();
        expect(error.message.indexOf('Invalid binding') >= 0).toBe(true);
        expect(error.original).toBeDefined();
        expect(error.url).toBeDefined();
    });

    it('should not do error hiding if asked to do so', function () {
        var error;
        setFixtures('<div id="test" data-bind="text:lkajsdflkj"></div>');
        enki.exceptions.addListener(function (exception) {
            error = exception;
        });
        enki.exceptions.shouldHideErrors = false;

        expect(enki.bindDocument).toThrow();
    });
});