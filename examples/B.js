(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
/*
The MIT License (MIT)

Copyright (c) 2015 Yavuz Tor

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
var B = require("./observable.js");
B.Binding = require("./Binding.js");
B.Router = require("./Router.js");

B.bindData = B.Binding.bindData;
B.first = function(qs, elem) { return (elem||document).querySelector(qs); }
B.all = function(qs, elem) { return (elem||document).querySelectorAll(qs); }

B.Binding.register("text", require("./behaviors/Text.js"));
B.Binding.register("checked", require("./behaviors/Checked.js"));
B.Binding.register("attr", require("./behaviors/Attr.js"));
B.Binding.register("value", require("./behaviors/Value.js"));
B.Binding.register("log", require("./behaviors/Log.js"));
B.Binding.register("style", require("./behaviors/Style.js"));
B.Binding.register("event", require("./behaviors/Event.js"));
B.Binding.register("click", require("./behaviors/Click.js"));
B.Binding.register("foreach", require("./behaviors/Foreach.js"));
B.Binding.register("css", require("./behaviors/Css.js"));
B.Binding.register("with", require("./behaviors/With.js"));
B.Binding.register("template", require("./behaviors/Template.js"));
B.Binding.register("ghost", require("./behaviors/Ghost.js"));
B.Binding.register("prop", require("./behaviors/Prop.js"));
B.Binding.register("component", require("./behaviors/Component.js"));
B.Binding.register("comprop", require("./behaviors/Comprop.js"));
module.exports = B;
if (typeof global.B === "undefined") global.B = B;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./Binding.js":2,"./Router.js":3,"./behaviors/Attr.js":4,"./behaviors/Checked.js":5,"./behaviors/Click.js":6,"./behaviors/Component.js":7,"./behaviors/Comprop.js":8,"./behaviors/Css.js":9,"./behaviors/Event.js":10,"./behaviors/Foreach.js":11,"./behaviors/Ghost.js":12,"./behaviors/Log.js":13,"./behaviors/Prop.js":14,"./behaviors/Style.js":15,"./behaviors/Template.js":16,"./behaviors/Text.js":17,"./behaviors/Value.js":18,"./behaviors/With.js":19,"./observable.js":20}],2:[function(require,module,exports){
var B = require("./observable.js");

var NO_DESCEND = {"SCRIPT": 1, "TEMPLATE": 1}

function Binding(element, context, behaviorPairs) {
	this.element = element;
	//this.context = context;
	this.behaviorPairs = behaviorPairs;
	Binding.set(element, this); // This has to be before setContext, to enable binding classes get binding object through Binding.get(element).
	this.setContext(context);
}

function sameContext(ctx1, ctx2) {
	if (ctx1 == ctx2) return true;
	return (ctx1
		&& ctx2
		&& ctx1.$data == ctx2.$data
		&& ctx1.$index == ctx2.$index
		&& ctx1.$root == ctx2.$root
		&& ctx1.$parent == ctx2.$parent
	);
}

Binding.prototype.setContext = function(context){
	// Check context is the same. if so, no need to touch it. just return.
	 if (sameContext(this.context, context)) return null;

	if (this.behaviors) {
	    //Start disposing from the end. So, it provides a last-in-first-out order, like a stack.
	    //This is to make sure the order-based relations among behaviors. Like, one behavior depends on another, so
	    //its execution should wrap the other one. Biggest example is GhostBinding, which copies the existing html
	    //inside the element, and inserts it to the parent before the element. Therefore, it should initialize after other behaviors
	    //and dispose before other behaviors.
	    while(this.behaviors.length > 0) {
	        var behavior = this.behaviors.pop();
			if (typeof behavior.dispose === "function") behavior.dispose();
			if (behavior.param) behavior.param.dispose();
		}
		this.behaviors = null;
	}
	this.managesContent = false;
	this.context = context;
	if (context == null) return;
	var self = this;
	this.behaviors = []; //Instead of using a map function, we need to add each new binding in order, to maintain order.
	this.behaviorPairs.forEach(function(item){
		try {
			var behaviorClass = item[0], paramFunc = item[1];
			var param = (paramFunc) ? paramFunc(context) : null;
			var behavior = Binding.applyBehavior(behaviorClass, self.element, self.context, param);
			if (behavior.managesContent) self.managesContent = true;
			self.behaviors.push(behavior);
		}
		catch(err) {
			console.log("Error while binding " + behaviorClass.name +": " + err.message);
			console.log(self.element);
		}
	});
};

Binding.applyBehavior = function(behaviorClass, element, context, param) {
	var behavior = new behaviorClass(element, context, param);
	behavior.param = param;
	if (param && typeof behavior.update == "function") {
		var updater = behavior.update.bind(behavior);
		param.subscribe(updater);
		updater(param())
	}
	return behavior;
}

/**
 * Return the first behavior that is instance of the given behavior class.
 * The behavior class or its registered name can be used.
 */
Binding.prototype.getBehavior = function(nameOrClass) {
    var cl = (typeof nameOrClass == "string") ? Binding.types[nameOrClass] : nameOrClass;
    if (this.behaviors) {
        for (var i = 0, len = this.behaviors.length; i < len; i++) {
            if (this.behaviors[i] instanceof cl) return this.behaviors[i];
        }
    }
    return null;
}

Binding.prototype.dispose = function() {
	this.setContext(null);
};

Binding.cache = {};
Binding.nextId = 0;
Binding.ID_ATTR = "data-bindingid";
Binding.ATTR = "data-binding";

Binding.existsOn = function(element) {
    return (element.nodeType == 1 && element.hasAttribute(Binding.ATTR));
}

Binding.get = function(elementOrSelector) {
    var element = (typeof elementOrSelector === "string") ? document.querySelector(elementOrSelector) : elementOrSelector;
	if (element == null) return null;
	var key = element.getAttribute(Binding.ID_ATTR);
	return Binding.cache[key];
}

Binding.set = function(element, obj) {
	var key = Binding.nextId++;
	element.setAttribute(Binding.ID_ATTR, key);
	Binding.cache[key] = obj;
};

Binding.remove = function(element) {
	if (element == null || element.nodeType != 1 || !element.hasAttribute(Binding.ID_ATTR)) return;
	var key = element.getAttribute(Binding.ID_ATTR);
	element.removeAttribute(Binding.ID_ATTR);

	Binding.cache[key].dispose();
	delete Binding.cache[key];
	for (var i=0, len=element.children.length; i < len; i++) {
		Binding.remove(element.children.item(i));
	}
};

Binding.types = {};
Binding.register = function(behaviorName, behaviorClass) {
	if (behaviorName.length == 0) return;
	if (Binding.types[behaviorName]) {
		throw new Error("Binding " + behaviorName + " is already defined!");
	}

	Binding.types[behaviorName] = behaviorClass;
};

/**
 * Bindings should be in the form, <binding-name>:<binding-params>[,<binding-name>:<binding-params>]...
 * text: $data.name() + ' ' + $data.title(),
 */
Binding.parseCache = {};
Binding.parse = function(element) {
	var bindingString = element.getAttribute(Binding.ATTR);
	if (Binding.parseCache[bindingString]) return Binding.parseCache[bindingString];
	var results = Binding.parseString(bindingString).map(function(item){
		var name = item[0];
		var paramString = item[1];
		if (Binding.types[name] === undefined) return null;

		var behaviorClass = Binding.types[name];
		var paramFunc = Binding.paramFunc(paramString);
		return [behaviorClass, paramFunc]
	}).filter(function(item){
	    return (item !== null);
	});
	Binding.parseCache[bindingString] = results;
	return results;
};

Binding.paramFunc = function(paramString) {
	if (paramString){
		var fnsource = "(function($){ return B.computed(function(){ var $data=$.$data, $index = $.$index, $parent = $.$parent, $root = $.$root; return "
			+ paramString + "; }); })";
		return eval(fnsource);
	}
	return null;

}

/**
 * returns an array of tuples, with each tuple being like [name, param], where name and param are both strings
 */
Binding.parseString = function (defString) {
	var result = [];
	var re = /\{|\(|\[|\]|\)|\}|'|"|:|,/g;
	var start = 0;
	var match;
	while ( start < defString.length && (match = re.exec(defString)) !== null ) {
		var name = defString.substring(start, match.index).trim();
		var param = null;
		if (match[0] == ":") {
			start = endOfParam(re, defString);
			param = defString.substring(match.index + 1, start).trim();
			start += 1;
		}
		else {
			start = match.index + 1;
		}
		result.push([name, param]);
	}
	if (start < defString.length) result.push([defString.substring(start).trim(), null]);
	return result;
}

function endOfParam(re, defString) {
	var depth = 0, inquotes = false, quotechar;
	while((match = re.exec(defString)) !== null) {
		if (!inquotes && match[0] == "," && depth == 0) break;
		switch(match[0]) {
			case "(":
			case "[":
			case "{":
				if (!inquotes) depth++;
				break;

			case "}":
			case "]":
			case ")":
				if (!inquotes) depth--;
				break;

			case "\"":
			case "'":
				if (!inquotes) {
					inquotes = true;
					quotechar = match[0];
				}
				else if (quotechar == match[0] && defString.charAt(match.index - 1) !== "\\") inquotes = false;
				break;
		}
	}
	if (depth != 0) throw new Error("Cannot parse " + defString + ". Unclosed {} [] or ()");
	if (match !== null) return match.index;
	return defString.length;
}

Binding.bindData = function(data, elem) {
    // root binding. bind data to the page.
    var context = {$parent: null, $root: data, $index: null, $data: data};
    Binding.bindContext((elem||document.body), context);
}

Binding.bindContext = function(element, context) {
	var descendToChildren = element.nodeType == 1 && !NO_DESCEND.hasOwnProperty(element.tagName);
	if (Binding.existsOn(element)) {
		var binding = Binding.get(element);
		if (binding != null) {
			binding.setContext(context);
		}
		else {
			binding = new Binding(element, context, Binding.parse(element));
		}
		if (descendToChildren) descendToChildren = !binding.managesContent;
	}
	if (descendToChildren) {
		var node= element.firstElementChild;
		while (node) {
			if (node.nodeType == 1) Binding.bindContext(node, context);
			node = node.nextElementSibling;
		}
	}
};

Binding.createChildContext = function(context, data, index) {
    return {
        $parent: context.$data,
        $root: context.$root,
        $data: data,
        $index: index
    };
}
module.exports = Binding;

},{"./observable.js":20}],3:[function(require,module,exports){
var B = require("./observable.js");

/**
 * Router objects watch haschange on window and activates the corresponding route. Possible routes
 * should be supplied to the Router when constructing.
 * @param routes should be an array of route definition objects: {path:String, view:Object = Component instance, viewfn:Function = a function that will have thisArg as the route and path variables as arguments, defaults:Object = Dictionary of properties to set on view}
 * @param parent should be the parent router, if there is any. If not given, or supplied null, this Router will be considered root,
 * 		and therefore will watch hash changes on the window. Root router always activates the router defined in the view object when it is picked.
 */
function Router(routes) {
	var self = this;
	this.view = B.observable();
	this.routes = routes;
	this.defaultRoute = routes[0];
}

Router.prototype.start = function(skipCurrent){
	Router.rootRouters.push(this);
	if (!skipCurrent) this.goto(Router.parseRoute(location.hash));
}

Router.prototype.initRoutes = function Router_initRoutes() {
	this.routes.forEach(function(routedef) {
		if (routedef.paths == undefined) routedef.paths = Router.parsePath(routedef.path);
	});
}

Router.prototype.goto = function Router_goto(routeData) {
	if (typeof this.beforeFilter === "function" && !this.beforeFilter(routeData)) return;
	var route;
	this.initRoutes();
	//find the first longest match
	this.routes.forEach(function(routedef) {
		for (var i = 0; i < routedef.paths.length; i++) {
			if (routedef.paths[i].charAt(0) != ":" && routeData.paths[i] != routedef.paths[i]) return;
		}
		if (route == null || routedef.paths.length > route.paths.length) route = routedef;
	});
	if (route == null) route = this.defaultRoute;

	this.routeData = routeData;
	this.route = route;
	var comp = (route.viewfn) ? route.viewfn.apply(this, this.pathVars()) : route.view;
	if (comp) {
		this.initComponent(comp);
		if (comp.router) {
			comp.router.goto({
				parentRouter: this,
				paths: routeData.paths.slice(route.paths.length),
				params: routeData.params
			});
		}
	}
	this.view(comp);
}

/**
 * Sets default values, path variables, and querystring parameters in order on the view object.
 * @param route the route definition that is activated. Only properties defined on the route.view object are set.
 * @param routeData the parsed route data that has the values.
 */
Router.prototype.initComponent = function Router_initComponent(comp) {
	var self = this, route = this.route, routeData = this.routeData;

	// set route defaults.
	for (var f in route.defaults) {
		setCompValue(f, route.defaults[f]);
	}
	// set path variables
	routeData.paths.forEach(function(val, i){
		if (i < route.paths.length && route.paths[i].charAt(0) == ":") {
			var name = route.paths[i].substring(1);
			setCompValue(name, val);
		}
	});

	// set params
	for (var f in routeData.params) {
		setCompValue(f, routeData.params[f]);
	}

	function setCompValue(f, val) {
		if(typeof comp[f] === "function") comp[f](val);
		else if (typeof comp[f] !== "undefined") comp[f] = val;
	}

}

Router.prototype.pathVars = function Router_pathVars() {
	var routedef = this.route;
	return this.routeData.paths.filter(function(v, i){
		return (i < routedef.paths.length && routedef.paths[i].charAt(0) == ":");
	});
}

Router.rootRouters = [];

/**
 * route.paths is the path split by / and route.params is the querystring style parameters.
 */
Router.parseRoute = function parseRoute(fullpath) {
	var paths = [], params = {};
	if (fullpath != null && fullpath.length > 0) {
		var query = fullpath.split("?");
		paths = Router.parsePath(query[0]);
		if (query.length > 1) {
			query[1].split("&").forEach(function(part){
				var p = part.split("=");
				params[p[0]] = p[1];
			});
		}
	}
	return {paths: paths, params: params};
}

Router.buildHash = function(routeData, prefix) {
	var hash = prefix + routeData.paths.join("/");
	var ch = "?";
	for (var f in routeData.params) {
		hash += ch + f + "=" + routeData.params[f];
		if (ch == "?") ch = "&";
	}
	return hash;
}

Router.parsePath = function parsePath(path) {
	//remove leading characters # and !
	var re = /#!?/g;
	if (re.exec(path)) path = path.substring(re.lastIndex);

	var paths = path.split("/");

	//trim the path so no empty path is left.
	while (paths.length > 0 && paths[0] == "") paths.shift();
	while (paths.length> 0 && paths[paths.length - 1] == "") paths.pop();

	return paths;
}

function rootHandler() {
	var route = Router.parseRoute(location.hash);
	Router.rootRouters.forEach(function(h){
		h.goto(route);
	});
}

(function watchHashchange(handler) {
	if (window.onhashchange) {
		window.onhashchange = handler;
		return;
	}
	var oldHash = location.hash;
	setInterval(function(){
		var newHash = location.hash;
		if (newHash != oldHash) {
			try {
				handler();
			}
			finally {
				oldHash = newHash;
			}
		}
	}, 200);
})(rootHandler);

module.exports = Router;

},{"./observable.js":20}],4:[function(require,module,exports){
function Attr(element, context, param) {
    this.element = element;
}

Attr.prototype.update = function(data) {
    for (var attr in data) {
    		if (data[attr] !== null) {
			this.element.setAttribute(attr, data[attr]);
		}
		else {
			this.element.removeAttribute(attr);
		}
			
    }
};

Attr.prototype.managesContent = false;

module.exports = Attr;

},{}],5:[function(require,module,exports){
var B = require("../observable.js")
function Checked(element, context, param) {
    this.element = element;
    var data = param();
    this.clickListener = function() {
        if (B.isObservable(data)) data(element.checked);
    };
    this.element.addEventListener("click", this.clickListener);
}

Checked.prototype.update = function(data) {
	if (this.lastSub) {
        this.lastSub.dispose();
        this.lastSub = null;
    }
	this.setValue(B.unwrap(data))
	if (B.isObservable(data)) {
		this.lastSub = data.subscribe(this.setValue.bind(this));
	}
};

Checked.prototype.setValue = function(newval) {
	if (newval) {
		this.element.setAttribute("checked", "checked");
	}
	else {
		this.element.removeAttribute("checked");
	}
};

Checked.prototype.dispose = function() {
	this.element.removeEventListener(this.clickListener);
}

Checked.prototype.managesContent = false;

module.exports = Checked;

},{"../observable.js":20}],6:[function(require,module,exports){
function Click(element, context, param) {
	var self = this;
    this.element = element;
    this.context = context;
    function handler(event){
    		var callback = param();
    		if (typeof callback == "function") callback(context.$data, event);
    }
    this.element.addEventListener("click", handler);
    this.dispose = function() {
    		self.element.removeEventListener("click", handler);
    }
}


Click.prototype.managesContent = false;

module.exports = Click;

},{}],7:[function(require,module,exports){
function Component(element, context, param) {
	this.element = element;
	this.context = context;
}

Component.prototype.update = function(param, oldparam) {
	if (param == oldparam) return;
	if (this.component) {
		this.component.detach();
		if (typeof oldparam === "function") this.component.dispose();
		this.component = null;
	}
	if (param) {
		this.component = (typeof param === "function") ? new param() : param;
		this.component.attach(this.element, this.context);
	}
}

Component.prototype.dispose = function() {
	this.update(null, this.param());
}

Component.prototype.managesContent = true;

module.exports = Component;

},{}],8:[function(require,module,exports){
var B = require("../observable.js");
var Component = require("./Component.js");

function Comprop(element, context, param) {
	this.element = element;
	this.context = context;
}

Comprop.prototype.update = function(param, oldparam) {
	if (param == oldparam) return;
	var behaviors = B.Binding.get(this.element).behaviors;
	var behavior = lastComponent(behaviors);
	if (param == null || behavior == null) return;
	var comp = behavior.component;
	if (comp == null) return;

	for (var f in param) {
		if (B.isObservable(comp[f])) comp[f](param[f]);
		else comp[f] = param[f];
	}
}

function lastComponent(behaviors) {
	for (var i = behaviors.length - 1; i >= 0; i--) {
		if (behaviors[i] instanceof Component) return behaviors[i];
	}
	return null;
}

module.exports = Comprop;

},{"../observable.js":20,"./Component.js":7}],9:[function(require,module,exports){
function Css(element, context, param) {
    this.element = element;
    this.context = context;
}

Css.prototype.update = function(data) {
    var model = this.context.$data;
    var classes;
    if (this.element.hasAttribute("class")) {
		classes = this.element.getAttribute("class").split(/\s+/).filter(function(item) {
			return (!data.hasOwnProperty(item));
		});
	}
	else {
		classes = []
	}
    for (var cssName in data) {
        if (data[cssName]) classes.push(cssName);
    }
    this.element.setAttribute("class", classes.join(" "));
};

Css.prototype.dispose = function() {
};

Css.prototype.managesContent = false;

module.exports = Css;

},{}],10:[function(require,module,exports){
function Event(element, context, param) {
    this.element = element;
    this.context = context;
}

Event.prototype.update = function(param) {
	var eventName;
	if (this.handlers) {
		for (eventName in this.handlers) {
			this.element.removeEventListener(eventName, this.handlers[eventName]);
		}
		this.handlers = null;
	}
	if (param == null) return;
	this.handlers = {};
    var model = this.context.$data;
    for (eventName in param) {
    		this.handlers[eventName] = function(evt){ return param[eventName](model, evt); };
        this.element.addEventListener(eventName, this.handlers[eventName]);
    }
};

Event.prototype.dispose = function() {
	this.update(null);
};

Event.prototype.managesContent = false;

module.exports = Event;

},{}],11:[function(require,module,exports){
var Binding = require("../Binding.js");

function repeat(text, times) {
	var a = text;
	for (var i = 1; i < times; i++) a += text;
	return a;
}

function Foreach(element, context, param) {
	this.element = element;
	this.context = context;
	element.innerHTML = element.innerHTML.trim();
	this.template = this.element.innerHTML;
	var childCount = element.childNodes.length;
	var wrappedByText = (element.firstChild.nodeType == 3) && (element.lastChild.nodeType == 3);
	if (wrappedByText) {
		this.getChildCount = function(len) {
			if (len == 0) return 0;
			return (len - 1) * (childCount - 1) + childCount;
		};
	}
	else {
		this.getChildCount = function(len){
			if (len == 0) return 0;
			return len * childCount;
		}
	}
	this.element.innerHTML = "";
}

Foreach.prototype.update = function Foreach_update(data, olddata) {
	var i, self = this,
	    context = this.context,
		element = this.element;

	if (data == null || data.length == 0) {
		for (i = 0, len=element.childNodes.length; i<len; i++) {
			Binding.remove(element.children.item(i));
	    }
		element.innerHTML = "";
		return;
	}

	this.resetInnerHtml(data, olddata);

	var elemIndex = 0;
	data.forEach(function(item, index){
		//if (olddata && index < olddata.length && olddata[index] == data[index]) return;
		var childContext = Binding.createChildContext(context, item, index);
		for (var elemCount = self.getChildCount(index + 1);elemIndex < elemCount; elemIndex++) {
			Binding.bindContext(element.childNodes.item(elemIndex), childContext);
		}
	});
};

Foreach.prototype.resetInnerHtml = function Foreach_resetInnerHtml(data, olddata) {
	for (var i = 0, len=this.element.childNodes.length;i<len;i++) {
		Binding.remove(this.element.childNodes.item(i));
	}
	this.element.innerHTML = repeat(this.template, data.length);
	/*
	// First, remove all extra elements in the end.
	var existing = 0, element = this.element;
	if (olddata) {
		while (this.element.childNodes.length > this.getChildCount(data.length)) {
			Binding.remove(this.element.lastChild);
			element.removeChild(this.element.lastChild);
		}
		existing = olddata.length;
	}
	// Then, add html in the end, if necessary
	if (existing < data.length) this.element.innerHTML += repeat(this.template, data.length - existing);
	*/
};

Foreach.prototype.dispose = function() {
	this.update([]);
	this.element.innerHTML = this.template;
};

Foreach.prototype.managesContent = true;

module.exports = Foreach;

},{"../Binding.js":2}],12:[function(require,module,exports){
var Binding = require("../Binding.js");

function Ghost(element, context, param) {
    var behaviors = Binding.get(element).behaviors;
    var contentMaker = last(behaviors, function(b){ return b.managesContent; });
    this.subscription = contentMaker.param.subscribe(this.contentChange.bind(this));
    this.oldDisplay = element.style.display;
    element.style.display = "none";
    this.lastChildCount = 0;
    this.element = element;
    this.contentChange();
}

Ghost.prototype.contentChange = function () {
    this.cleanup();
    this.lastChildCount = this.element.childNodes.length;
    for (i = 0; i < this.lastChildCount; i++) {
        this.element.parentNode.insertBefore( clone(this.element.childNodes.item(i)), this.element );
    }
}

Ghost.prototype.cleanup = function(){
    for (var i = 0; i < this.lastChildCount; i++) {
        this.element.parentNode.removeChild(this.element.previousSibling);
    }
    this.lastChildCount = 0;
}

Ghost.prototype.dispose = function() {
    this.cleanup();
    this.element.style.display = this.oldDisplay;
}

function last(arr, criteria) {
    for (var i = arr.length - 1; i >= 0; i--) {
        if (criteria(arr[i], i)) return arr[i];
    }
    return null;
}

function clone(node) {
    return node.cloneNode(true);
}



module.exports = Ghost;

},{"../Binding.js":2}],13:[function(require,module,exports){
function Log(element, context, param) {
    this.context = context;
    console.log("Log: initialized");
}

Log.prototype.update = function(data) {
    console.log("Log: param update");
    console.log(data);
};

Log.prototype.managesContent = false;

module.exports = Log;

},{}],14:[function(require,module,exports){
function Prop(element, context, param) {
    this.element = element;
}

Prop.prototype.update = function(param) {
    for (var f in param) {
        this.element[f] = param[f];
    }
}

module.exports = Prop;

},{}],15:[function(require,module,exports){
function Style(element, context, param) {
    this.element = element;
}

Style.prototype.update = function(data) {
    for (var style in data) {
        this.element.style[style] = data[style];
    }
};

Style.prototype.managesContent = false;

module.exports = Style;

},{}],16:[function(require,module,exports){
var Binding = require("../Binding.js");


function Template(element, context, param) {
    this.element = element;
    this.context = context;
}

Template.cache = {};

Template.prototype.update = function(param) {
	var name = param.name,
		data = param.data,
		onlyIf = param["if"],
		self = this;
	if (name == null || name.length == 0 || (typeof onlyIf !== "undefined" && onlyIf == false)) {
	    // template name is null/empty or onlyIf parameter is given and it evaluates to false, show empty view.
	    this.applyTemplate(name, null);
	}
	else if (name.charAt(0) == "#") {
		this.applyTemplate(document.querySelector(name).innerHTML, data);
	}
	else {
		this.applyTemplate(name, data);
	}


};

Template.prototype.applyTemplate = function(template, data) {
	if (this.lastData) {
		if (typeof this.lastData.ondetach === "function") this.lastData.ondetach(this.element);
		this.lastData = null;
	}
	var i, children = this.element.children;
	for (i = 0; i < children.length; i++) {
		Binding.remove(children.item(i));
	}
	if (data != null) {
		this.element.innerHTML = template;
		children = this.element.children;
		var childContext = Binding.createChildContext(this.context, data, 0);
		for (i = 0; i < children.length; i++) {
			Binding.bindContext(children.item(i), childContext);
		}
		this.lastData = data;

		if (typeof data.onattach === "function") data.onattach(this.element);
	}
	else {
		this.element.innerHTML = "";
	}

}

Template.prototype.dispose = function(){
	this.applyTemplate("", null);
};

Template.prototype.managesContent = true;

module.exports = Template;

},{"../Binding.js":2}],17:[function(require,module,exports){
function Text(element, context, param) {
    this.element = element;
}

Text.prototype.update = function(data) {
    this.element.textContent = (data == null) ? "" : data;
};

Text.prototype.managesContent = true;

module.exports = Text;

},{}],18:[function(require,module,exports){
var B = require("../observable.js")
function Value(element, context, param) {
    this.element = element;
}

Value.prototype.update = function(data) {
	var element = this.element;
	if (this.lastDataDispose) this.lastDataDispose();
	element.value = B.unwrap(data);
	if (B.isObservable(data)) {
		var s = data.subscribe(function(newval) {
			element.value = newval;
		});
		this.lastDataDispose = function(){
			s.dispose();
		};
		this.element.onchange = function() {
			data(element.value);
		};
	}
};

Value.prototype.dispose = function() {
	this.element.onchange = null;
}

Value.prototype.managesContent = false;

module.exports = Value;

},{"../observable.js":20}],19:[function(require,module,exports){
var Binding = require("../Binding.js");

function With(element, context, param) {
    this.element = element;
    this.context = context;
    this.template = element.innerHTML;
    this.childElementCount = element.children.length;
}

With.prototype.update = function(data) {
    if (this.element.children.length == 0) {
    	this.element.innerHTML = this.template;
    }
    if (data == null) {
        this.element.innerHTML = "";
        return;
    }
    var children = this.element.children;
    var childContext = Binding.createChildContext(this.context, data, 0);
    for (var i=0; i < children.length; i++) {
    	Binding.bindContext(children.item(i), childContext);
    }
};

With.prototype.dispose = function(){
    var children = this.element.children;
    for (var i=0, len = children.length; i < len; i++) {
    	Binding.remove(children.item(i));
    }
	this.innerHTML = this.template;
};

With.prototype.managesContent = true;

module.exports = With;

},{"../Binding.js":2}],20:[function(require,module,exports){
function subscribeable(fn, ondisposeHandler) {
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
	 * they are registered. Binding and behaviors depend on this order for proper function.
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
	},
	append: function(arr) {
		if (Array.isArray(this())) {
			if (Array.isArray(arr)) this(this().concat(arr));
			else this(this().concat([arr]));
		}
	},
	prepend: function(arr) {
		if (Array.isArray(this())) {
			if (Array.isArray(arr)) this(arr.concat(this()));
			else this([arr].concat(this()));
		}
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
	var self = this;
	if (this.xhr.readyState == 4) {
		var result = this.serialize(this.xhr);
		try {
			this.successHandlers.forEach(function each(handler) {
				var r = handler.call(self, result);
				// if handler has a return value, use it when calling the next handler.
				if (r !== undefined) result = r;
			});
		}
		catch(err) {
			this.errorHandler(err);
		}
		this.completed = true;
		this.doneHandlers.forEach(function each(handler){ handler.call(self); });
	}
}
Http.prototype.progressHandler = function(event) {
	var self = this;
	this.progressHandlers.forEach(function each(handler) { handler.call(self, event); });
}
Http.prototype.errorHandler = function(err) {
	var self = this;
	this.failureHandlers.forEach(function each(handler) { handler.call(self, err.message); });
	this.completed = true;
	this.doneHandlers.forEach(function each(handler){ handler.call(self); });
}

exports.xhr = function(url) { return new Http(url); }

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
Jsonp.prototype.createCallback = function(){
	Jsonp.order = Jsonp.order || 0;
	var self = this,
		fname = "Jsonp_callback_" +  Jsonp.order++;
	window[fname] = function(result) {
		self.successHandlers.forEach(function each(handler){ handler.call(self, result); });
		self.doneHandlers.forEach(function each(handler){ handler.call(self); });
	};
	return fname;
}
Jsonp.prototype.send = function() {
	var self = this,
		callbackFnName = this.createCallback(),
		script = document.createElement("SCRIPT");
	this.param(this.callbackQS, callbackFnName);
	script.src = this.url;

	this.doneHandlers.push(function(){
		document.body.removeChild(script);
		script.onerror = script.onload = null;
		script = null;
		delete window[callbackFnName];
	});

	script.onerror = function(evt) {
		self.failureHandlers.forEach(function each(handler){ handler.call(self, evt.message); });
		self.doneHandlers.forEach(function each(handler){ handler.call(self); });
	}

	script.onload = function(evt) {
		return false;
	}

	document.body.appendChild(script);
	return this;
}

Jsonp.prototype.failure = Http.prototype.failure;
Jsonp.prototype.success = Http.prototype.success;
Jsonp.prototype.done = Http.prototype.done;

exports.jsonp = function(url, callbackQS){ return new Jsonp(url, callbackQS); };

},{}]},{},[1]);
