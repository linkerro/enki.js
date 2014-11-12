/* eslint-disable global-strict */
'use strict';
/* eslint-enable global-strict */

describe('enki validation', function () {
    beforeEach(function () {
        setFixtures('');
    });
    describe('initialization', function () {
        it('should associate validation metadata to an object', function () {
            var viewModel = {
                stringProperty: 'test'
            };
            var validationInfo = {
                stringProperty: {
                    required: true
                }
            };
            enki.validation.addMetadata(viewModel, validationInfo);
            expect(viewModel.__values__.stringProperty.validationAttributes.required).toBe(true);
        });
        it('should trigger the validation when a property is changed', function () {
            var viewModel = {
                stringProperty: 'test'
            };
            var validationInfo = {
                stringProperty: {
                    required: true
                }
            };
            enki.validation.addMetadata(viewModel, validationInfo);
            enki.bindDocument(viewModel);
            viewModel.stringProperty = 'new value';
            expect(viewModel.__values__.stringProperty.isValid).toBe(true);
        });
    });
    describe('bindings', function () {
        var viewModel;
        var validationInfo;
        beforeEach(function () {
            viewModel = {
                textProperty: 'some text'
            };
            validationInfo = {
                textProperty: {
                    required: true
                }
            };
        });
        it('should show a validation message when model is invalid', function () {
            setFixtures('<input id="input" type="text" data-bind="value: textProperty" />' +
            '<div id="validation" data-bind="validationMessage:{for:textProperty}"></div>');
            enki.validation.addMetadata(viewModel, validationInfo);
            enki.bindDocument(viewModel);
            var input = document.getElementById('input');
            var validation = document.getElementById('validation');
            input.value = '';
            input.onchange();
            expect(validation.innerHTML).toBe('Field is required');
        });
        it('should add the required class on an element', function () {
            setFixtures('<input id="input" type="text" data-bind="value: textProperty" />');
            enki.validation.addMetadata(viewModel, validationInfo);
            enki.bindDocument(viewModel);
            var input = document.getElementById('input');
            input.value = '';
            input.onchange();
            expect(input.classList.contains('invalidField')).toBe(true);
        });
    });
});
