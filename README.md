# B-js: A Simple and Fast Library for Behavior Binding #

[![Build Status](https://travis-ci.org/yavuztor/B-js.svg?branch=master)](https://travis-ci.org/yavuztor/B-js)

B-js is a simple and fast behavior binding library inspired by KnockoutJS.
It resembles KnockoutJS in many ways, but it is fundamentally different in implementation. It is much smaller and more performant than KnockoutJS, AngularJS, and in some cases even ReactJS.

### Quick Links ###


### How do I use it? ###

1. Download B-js and source it via script tag.

* Define your model in javascript.
	```
	var minions = [
		{name: B.observable("Stuart"), likes:["banana"]},
		{name: B.observable("Kevin"), likes:["banana", "apple"]}
	];
	```

* Add binding statements in your html. This is just like KnockoutJS, but the binding attribute is called `data-binding`. More on this later.
	```
	<ul data-binding="foreach: $data">
		<li><b data-binding="text: $data.name()"></b>
		likes
		<span data-binding="text: $data.likes.join(', ')"></span>
	</ul>
	```

* Call B.bindData with your model and optionally the root element that the binding will start from. If you don't provide the second parameter, the whole page will be processed for binding.

	```
	B.bindData(mymodel);
	```

That's it. After this point, the changes you will make to observable values will be updated automatically.

### How does it work? ###

1. `B.bindData()` creates the root context and uses it to process all elements that has `data-binding` attribute.
* For each element B:
	* Parses the data-binding attribute, if not parsed already. Yes, parsed bindings are cached for supreme performance.

*TODO: Continue to describe briefly the mechanism that makes it all work.*

### Performance ###

In order to see how B-js compares in performance against KnockoutJS and raw html manipulation, see the examples/perftest.html file in the repository, which includes a side-by-side comparison. It's not a comprehensive comparison, but it gives you an idea about how fast B-js is in comparison. The performance test code was shamelessly copied from an article by  [CodeMentor](https://www.codementor.io/reactjs/tutorial/reactjs-vs-angular-js-performance-comparison-knockout) as noted in the page. You can follow the links at the top of the page to see performance comparisons against AngularJS and ReactJS.

### Contribution guidelines ###

* #### Writing tests ####

	Jasmine 2.4 is used for test specifications. Default html SpecRunner from Jasmine is used. For bugs and issues, please specify the issue number in the test with a short description in the `it()` function.

* #### Code review ####

	*TBD*
