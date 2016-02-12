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

var observablePlugins = {
	toggle: function(){
		this((this() == true) ? false : true);
	},
	request: function(req, errcallback){
		var self = this;
		if (typeof errcallback === "function") req.failure(errcallback);
		return req.success(self).send();
	}
}

function observable(initialValue){
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
	for (var p in observablePlugins) {
		fn[p] = observablePlugins[p].bind(fn);
	}

	return subscribeable(fn, function(){
		// If the contained value is disposable, dispose that too.
		if (value && typeof value.dispose === "function") value.dispose();
	});
};

function computed(computerFn) {
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

exports.observable = observable;
exports.computed = computed;

exports.unwrap = function unwrap(val) {
	if (typeof val === "function") return val();
	return val;
};

exports.isObservable = function(sth) {
	return (typeof sth === "function" && typeof sth.subscribe === "function");
};

function Http(url) {
	this.xhr = new XMLHttpRequest();
	this.url = url;
	this.verb = "GET";
	this.async = true;
	this.username = "";
	this.password = "";
	this.successHandlers = [];
	this.failureHandlers = [];
	this.progressHandlers = [];
	this.doneHandlers = [];
	this.serialize = Http.text;
	this.completed = false;
	this.headers = {};
}

Http.text = function(xhr) { return xhr.responseText; };
Http.json = function(xhr) { return JSON.parse(xhr.responseText); }
Http.xml = function(xhr) { return xhr.responseXML; }

Http.prototype.data = function(d){ this.body = d; return this; }
Http.prototype.credentials = function(u,p) { this.username = u; this.password = p; return this; }
Http.prototype.method = function(m) { this.verb = m; return this; }
Http.prototype.header = function(name, value) { this.headers[name] = value; return this; }
Http.prototype.contentType = function(ctype) {
	switch(ctype) {
		case "json":	return this.header("Content-Type", "application/json; charset=utf-8");
		case "xml":	return this.header("Content-Type", "application/xml; charset=utf-8");
		case "text":	return this.header("Content-Type", "text/plain");
	}
	return this.header("Content-Type", ctype);
}
Http.prototype.accept = function(rtype) {
	var h = "text/plain";
	switch(rtype) {
		case "json": h = "application/json"; this.serialize = Http.json; break;
		case "xml": h = "application/xml"; this.serialize = Http.xml; break;
		default: h = "text/plain"; this.serialize = Http.text; break;
	}
	return this.header("Accept", h);
}
Http.prototype.success = function(handler) {
	this.successHandlers.push(handler);
	return this;
}
Http.prototype.failure = function(handler){
	this.failureHandlers.push(handler);
	return this;
}
Http.prototype.done = function(handler) {
	this.doneHandlers.push(handler);
	return this;
}
Http.prototype.progress = function(handler){
	this.progressHandlers.push(handler);
	return this;
}

Http.prototype.send = function() {
	var self = this;
	this.xhr.open(this.verb, this.url, true, this.username, this.password);
	for (var h in this.headers) this.xhr.setRequestHeader(h, this.headers[h]);

	this.xhr.onreadystatechange = this.readyHandler.bind(this);
	this.xhr.onprogress = this.progressHandler.bind(this);
	this.xhr.onerror = this.errorHandler.bind(this);
	this.xhr.onabort = function(){ self.errorHandler(new Error("aborted")); }
	this.xhr.send(this.body);
	return this;
}
Http.prototype.readyHandler = function(event) {
	if (this.xhr.readyState == 4) {
		var result = this.serialize(this.xhr);
		try {
			this.successHandlers.forEach(function each(handler) {
				var r = handler(result);
				// if handler has a return value, use it when calling the next handler.
				if (r !== undefined) result = r;
			});
		}
		catch(err) {
			this.errorHandler(err);
		}
		this.completed = true;
		this.doneHandlers.forEach(function each(handler){ handler(); });
	}
}
Http.prototype.progressHandler = function(event) {
	this.progressHandlers.forEach(function each(handler) { handler(event); });
}
Http.prototype.errorHandler = function(err) {
	this.failureHandlers.forEach(function each(handler) { handler(err.message); });
	this.completed = true;
	this.doneHandlers.forEach(function each(handler){ handler(); });
}

exports.http = function(url) { return new Http(url); }

function Jsonp(url, callbackParam) {
	this.url = url;
	this.urlHasQS = this.url.indexOf("?") >= 0;
	this.callbackQS = callbackParam || "callback";
	this.successHandlers = [];
	this.failureHandlers = [];
	this.doneHandlers = [];
}

Jsonp.prototype.param = function(k, v) {
	if(this.urlHasQS) {
		this.url += "&" + k + "=" + encodeURIComponent(v);
	}
	else {
		this.url += "?" + k + "=" + encodeURIComponent(v);
		this.urlHasQS = true;
	}
	return this;
}

Jsonp.prototype.data = function(d){
	for (var k in d){
		this.param(k, d[k]);
	}
	return this;
}
Jsonp.prototype.send = function() {
	var self = this,
		callbackFnName = "Jsonp_callback_" + (new Date()).getTime(),
		script = document.createElement("SCRIPT");
	this.param(this.callbackQS, callbackFnName);
	script.src = this.url;

	this.doneHandlers.push(function(){
		document.body.removeChild(script);
		script.onerror = script.onload = null;
		script = null;
		delete window[callbackFnName];
	});
	window[callbackFnName] = function(result) {
		self.successHandlers.forEach(function each(handler){ handler(result); });
		self.doneHandlers.forEach(function each(handler){ handler(); });
	};

	script.onerror = function(evt) {
		self.failureHandlers.forEach(function each(handler){ handler(evt.message); });
		self.doneHandlers.forEach(function each(handler){ handler(); });
	}

	script.onload = function(evt) {
		return false;
	}

	document.body.appendChild(script);
}

Jsonp.prototype.failure = Http.prototype.failure;
Jsonp.prototype.success = Http.prototype.success;
Jsonp.prototype.done = Http.prototype.done;

exports.jsonp = function(url, callbackQS){ return new Jsonp(url, callbackQS); };
