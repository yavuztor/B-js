# B-js: A Simple and Fast Library for Behavior Binding #

[![Build Status](https://travis-ci.org/yavuztor/B-js.svg?branch=master)](https://travis-ci.org/yavuztor/B-js)

B-js is a simple and fast behavior binding library inspired by KnockoutJS. It is created due to problems that the author has noticed within the implementation and conceptual framework of KnockoutJS, which results friction in development of simple and effective user interfaces. Here are a few highlights about how B-js differs from KnockoutJS:

* B-js dependency management is much simpler, and faster. It does much less to accomplish the same goal. There are only two concepts to know: **_observable_** is a property that we can watch over,  and **_computed_** is an observable whose value is calculated with a given function.

* Main concept in B-js is binding behaviors to HTML elements. This enables limitless possibilities without deviating from the conceptual design of the library. KnockoutJS simply focuses on templating and data binding, which create friction when developing reusable components.

* In B-js, the behaviors are attached in the same order they are supplied, and they are detached in the reverse order (LIFO). This enables B-js to manage behavior dependency easily. In KnockoutJS there is no such guarantee, and thus it is harder to add behaviors that depend on order.

### How do I use it? ###

1. Download B-js and source it via script tag.

2. Define your model in javascript.

	```javascript
	var minions = [
		{name: B.observable("Stuart"), likes:["banana"]},
		{name: B.observable("Kevin"), likes:["banana", "apple"]}
	];
	```
3. Register your custom behaviors, if there are any.

	```javascript
	function CustomBehavior(element, context, param) {
		this.element = element;
		//Any other initialization code here..
	}

	//Called when param changes.
	CustomBehavior.prototype.update = function(newparam, oldparam){
		this.element.title = oldparam + " --> " + newparam;
		//Any other tasks to perform when param is updated.
	}

	//Called when element is about to be removed.
	CustomBehavior.prototype.dispose = function(){
		// TODO: clean up if necessary.
	}

	//Register the behavior
	B.Binding.register("custom", CustomBehavior)
	```

4. Add binding statements in your html. This is just like KnockoutJS, but the binding attribute is called `data-binding`.

	```html
	<ul data-binding="foreach: $data">
		<li><b data-binding="text: $data.name(), custom: $data.name()"></b>
		likes
		<span data-binding="text: $data.likes.join(', ')"></span>
	</ul>
	```

5. Call B.bindData with your model and optionally the root element that the binding will start from. If you don't provide the second parameter, the whole page will be processed for binding.

	```javascript
	B.bindData(mymodel);
	```

That's it. After this point, the changes you will make to observable values will be updated automatically.

### How does it work? ###

1. `B.bindData()` creates the root context and uses it to process all elements that has `data-binding` attribute.

2. `data-binding` attribute is parsed on each element. The format is like `name: param [, name: param ...]`:
	* _name_ refers to the name used for the behavior in registration.
	* _param_ is a valid javascript expression that is evaluated within the element context. Context has four properties:
		* `$data` is the model that is bound to the element.
		* `$parent` is the model of the parent context, or null if root.
		* `$root` is the root model that was bound with `B.bindData`
		* `$index` is the index of `$data` within `$parent`.

3. A new `B.Binding` object is created for each element and all behaviors are created and updated via call to `update` method in the order they are listed in `data-binding` attribute.

4. When a _param_ value for a behavior changes, B-js calls the `update` method  on that behavior to let it process the change.

### Behaviors out of the box

There are a list of behaviors that B-js provides out of the box.

* `css` takes an object hash where each key is a css class name and the value is a boolean indicating existence of class name. When true, the class name is added to the element, when false it is removed.
* `style` takes an object hash where each key is a style name *in camelCase*, as you would call it on DOM, like `element.style.backgroundColor = 'red'`. In this case the behavior parameter will be `{backgroundColor: "red"}`.

* `attr` takes an object hash where each key corresponds to an html attribute which will be set with the value. For instance, if the parameter is `{title: "Hello"}`, then it will be like calling `element.setAttribute("title", "Hello")`.
* `prop` takes an object hash where each key is a property on the DOM node to be set. This uses the DOM object to set the value, instead of setAttribute.
* `event` takes an object hash where each key corresponds to an event to listen and the value corresponds to the event handler function for that event. The event handler is called with two arguments: $data and the event, like `handler($data, event)`. This allows writing your view models without DOM ties, unless you need to view the event object.
* `click` takes an event handler function as a parameter and calls it when the element is clicked. As with all event handler calls in B-js, the first parameter sent to the handler is `$data`.
* `foreach` takes an array parameter and applies the inner html as a template to each item in the array.
* `text` sets the textContent of the element with the given parameter.
* `checked` takes a boolean parameter and sets the checked attribute on a check box.
* `log` simply logs the given parameter to console, using `console.log`. This can be used to troubleshoot your bindings.
* `value` takes a B.observable and uses it for two-way binding to a form element. Initially, the parameter value is set on the input. Then, when user changes the value of the input element, the observable parameter is updated with the new value.
* `with` takes a parameter and makes it the `$data` value for the template in its html.
* `template` takes an object like `{name: ..., data: ...}`. `data` is any value that will be used as `$data` in the template processing. `name` parameter could be
	* a reference like `"#LoginVM"` where template will be obtained from innerHTML of the element with id `LoginVM`
	* a relative url, where template will be obtained from a given url. Note that `XMLHttpRequest` will be used for download, so Cross-Origin requests should be considered.
	* a template string, which will be used as the template for generating content.

### Performance ###

B-js was created with performance in mind. A more formal performance test will be created in near future, but initial tests show B-js is about 4 times faster than KnockoutJS, and about 2 times faster than AngularJS, when processing bindings for an array with 1000 elements. [View the test page to see the performance comparison](http://yavuztor.github.io/B-js/examples/perftest.html).

### Contribution guidelines ###

* #### Writing tests ####

	Jasmine 2.4 is used for test specifications. Default html SpecRunner from Jasmine is used. For bugs and issues, please specify the issue number in the test with a short description in the `it()` function.

* #### Code review ####

	*TBD*
