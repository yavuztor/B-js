function subscribeable(fn, ondisposeHandler) {
	(function(){
		var subscribers = [];
		fn.subscribe = function(callback, disposeCallback){
			var subscription = {callback: callback, disposeCallback: disposeCallback};
			subscribers.push(subscription);
			return {
				dispose:function(){
					subscribers = subscribers.filter(function(itm){ return (itm != subscription); });
				}
			};
		};

		fn.dispose = function(){
			if (ondisposeHandler) ondisposeHandler.call(fn);
			subscribers.forEach(function(subscription) {
				if (subscription.disposeCallback) subscription.disposeCallback(fn);
			});
			subscribers = [];
		}

		/**
		 * Order of the callbacks are important. The callbacks should be called in the order
		 * they are registered. Other Binding and behaviors depend on this order for proper function.
		 */
		fn.notifySubscribers = function(value, oldValue){
			subscribers.forEach(function(subscription){
				try {
					subscription.callback(value, oldValue);
				}
				catch(err) {
					console.log("Subscribed function threw an error!");
					console.log(err);
					console.log(subscription);
				}
			})
		}

	})();
	return fn;
}

var trace = [];

function addToTrace(fn) {
	var len = trace.length;
	if (len > 0) {
		var t=  trace[len-1];
		if (t.indexOf(fn) < 0) t.push(fn);
	}
}

function computeAndTrace(computerFn) {
	var newValue = null;
	var dependencies = [];
	var error = null;
	trace.push(dependencies);
	try {
		newValue = computerFn();
	}
	catch(err) {
		error = err;
	}
	trace.pop();
	if (error != null) throw error;
	return {value: newValue, dependencies: dependencies};
};

exports.observable = function(initialValue){
	var value = initialValue;

	var fn = function() {
		if (arguments.length == 0) {
			addToTrace(arguments.callee);
			return value;
		}
		else {
			var newValueIsDifferent = (value != arguments[0]),
				oldValue = value;

			value = arguments[0];
			if (newValueIsDifferent) {
				fn.notifySubscribers(value, oldValue);
			}
		}
	};

	return subscribeable(fn, function(){
		// If the contained value is disposable, dispose that too.
		if (value && typeof value.dispose === "function") value.dispose();
	});
};

exports.computed = function(computerFn) {
	var initialized = false;
	var value = null;
	var dependencySubscriptions = [];

	function initialize() {
		var init = computeAndTrace(computerFn);
		value = init.value;
		stopListeningForChanges();
		dependencySubscriptions = init.dependencies.map(function(d){
			return d.subscribe(computeAndNotify, stopListeningForChanges);
		});
		return (value != null);
	}

	function stopListeningForChanges() {
		while (dependencySubscriptions.length > 0) dependencySubscriptions.pop().dispose();
	}
	function computeAndNotify() {
		if (initialized) {
			var newValue = computerFn();
			if (value !== newValue) {
				var oldValue = value;
				value = newValue;
				fn.notifySubscribers(value, oldValue);
			}
		}
		else {
			oldValue = value;
			initialized = initialize();
			fn.notifySubscribers(value, oldValue);
		}
	}
	initialized = initialize();

	var fn = function(){
		addToTrace(arguments.callee);
		if (!initialized) {
			initialized = initialize();
		}
		return value;
	};
	return subscribeable(fn, stopListeningForChanges);
}

exports.unwrap = function unwrap(val) {
	if (typeof val === "function") return val();
	return val;
};

exports.isObservable = function(sth) {
	return (typeof sth === "function" && typeof sth.subscribe === "function");
};
