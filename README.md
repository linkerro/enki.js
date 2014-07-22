enki.js
=======

##Big notice, still in alpha
This library is still in alpha stage and is subject to change. Things that have a high risk of changing without
backwards compatibility are: the templating system, the custom binding system.

##MVVM javascript library for ES5+

**New to MVVM?** No problem. If you've worked with any of the major frontend libraries that are advertised as MV* you've
allready worked with it. It's just a new spin on the old standard approach of MVC, by adding two way binding.

##Cut the chatter. Show me some code!
Here's the javascript bit:

    var viewModel={property: 'Hello world!'};
    enki.bindDocument(viewModel);
    
And the HTML to go with it:

    <div data-bind="text: property"></div>
    
**Ok, how it works:**

The `viewModel` object describes the properties that will be used in your view (the HTML). When you call
`enki.bindDocument` Enki takes a look over your HTML document and makes sure that the elements that have `data-bind`
attributes and the properties in your `viewModel` object are linked, so changes in one are reflected in the other.

##Advantages over similar frameworks
First off, it uses events for it's wiring. This makes it super fast since it doesn't have to always diff your variables.
This is similar to how Backbone.js and Knockout.js operate. Unlike them though, Enki doesn't rely on you wrapping
your objects and properties with framework specific objects, or for you to notify the framework of changes. This results
in very dense, declarative code, that runs super fast.

Second, it's super small. We're still in alpha but you can already see it's orders of magnitude smaller than anything
out there.

Third, it was built from the ground up to take advantage of the latest browser capabilities offered by EcmaScript 5
(latest version&trade;). This also means it only runs on modern browsers: IE9+, Chrome, Firefox, etc.

##Examples
**text binding**

    <h1 data-bind="text: title"></h1>
    <script type="application/javascript" src="lib/enki.js"></script>
    <script type="application/javascript">
        var viewModel = {
            title:'This is your page title'
        };
        enki.bindDocument(viewModel);
    </script>

The `text` binding is for displaying properties in your HTML. It works by inserting whatever is contained in its tracked
property inside your tag. Since the `text` binding doesn't update your property if the content of the HTML tag changes,
this is called one way binding.

**value binding**

    <input type="text" data-bind="value: userName"/>
    <script type="application/javascript">
        var viewModel = {
            userName:''
        };
    </script>

The `value` binding is for binding properties to input elements. It works by setting and reading the value of the
element. Since this binding also updates the JavaScript object, not just the HTML element, it is called two way binding.