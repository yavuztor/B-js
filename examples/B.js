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
B.Binding.register("route", require("./behaviors/Route.js"));
B.Binding.register("dropFiles", require("./behaviors/DropFiles.js"));
module.exports = B;
if (typeof global.B === "undefined") global.B = B;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./Binding.js":2,"./behaviors/Attr.js":3,"./behaviors/Checked.js":4,"./behaviors/Click.js":5,"./behaviors/Component.js":6,"./behaviors/Comprop.js":7,"./behaviors/Css.js":8,"./behaviors/DropFiles.js":9,"./behaviors/Event.js":10,"./behaviors/Foreach.js":11,"./behaviors/Ghost.js":12,"./behaviors/Log.js":13,"./behaviors/Prop.js":14,"./behaviors/Route.js":15,"./behaviors/Style.js":16,"./behaviors/Template.js":17,"./behaviors/Text.js":18,"./behaviors/Value.js":19,"./behaviors/With.js":20,"./observable.js":21}],2:[function(require,module,exports){
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
Binding.prototype.getbehavior = function(nameOrClass) {
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

},{"./observable.js":21}],3:[function(require,module,exports){
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

},{}],4:[function(require,module,exports){
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

},{"../observable.js":21}],5:[function(require,module,exports){
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

},{}],6:[function(require,module,exports){
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

},{}],7:[function(require,module,exports){
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

},{"../observable.js":21,"./Component.js":6}],8:[function(require,module,exports){
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

},{}],9:[function(require,module,exports){
var B = require("../B");
function DropFiles(element, context, param) {
	this.element = element;
	this.context = context;
	this.param = param;
	this.files = B.observable([]);
	this.handlers = {
		focus: this.focus.bind(this),
		blur: this.blur.bind(this),
		files: this.files.bind(this)
	};
	element.addEventListener("dragover", this.handlers.focus);
	element.addEventListener("dragleave", this.handlers.blur);
	element.addEventListener("dragend", this.handlers.blur);
	element.addEventListener("drop", this.handlers.files);
	window.addEventListener("blur", this.handlers.blur);
}

DropFiles.prototype.focus = function(event) {
	event.preventDefault();
	var h = this.param().onfocus;
	if (h) h(this.context.$data, event);
}

DropFiles.prototype.blur = function(event) {
	var h = this.param().onblur;
	if (h) h(this.context.$data, event);
}

DropFiles.prototype.files = function(e) {
	e.preventDefault();
	var files = (e.dataTransfer || e.target).files;
	var h = this.param().onfiles;
	this.files(files);
	if (h) h(files);
}

DropFiles.prototype.dispose = function() {
	var e = this.element, h = handlers;
	e.removeEventListener("dragover", h.focus);
	e.removeEventListener("dragend", h.blur);
	e.removeEventListener("dragleave", h.blur);
	e.removeEventListener("drop", h.files);
	window.removeEventListener("blur", h.blur);
}
module.exports = DropFiles;

},{"../B":1}],10:[function(require,module,exports){
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
	element.normalize();
	this.template = this.element.innerHTML.trim();
	this.element.innerHTML = "";
	this.childContexts = [];
}

Foreach.prototype.update = function Foreach_update(data, olddata) {
	var i,
	    context = this.context,
		element = this.element;

	if (data == null || data.length == 0) {
		for (i = 0, len=element.childNodes.length; i<len; i++) {
			Binding.remove(element.children.item(i));
	    }
		element.innerHTML = "";
		return;
	}

	// Now, reset the html content and apply bindings.
	// First, remove all extra elements in the end.
	var existing = 0;
	if (olddata) {
		childCount = element.childNodes.length / olddata.length;
		while (element.childNodes.length > data.length * childCount) {
			Binding.remove(element.lastChild);
			element.removeChild(element.lastChild);
		}
		existing = olddata.length;
	}
	// Then, add html if necessary to match the data.length * childCount
	if (existing < data.length) element.innerHTML += repeat(this.template, data.length - existing);

	childCount = element.childNodes.length / data.length;
	data.forEach(function(item, index){
		var childContext = Binding.createChildContext(context, item, index);
		for (var i = index * childCount, len = i + childCount; i<len; i++) {
			Binding.bindContext(element.children.item(i), childContext);
		}
	});
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
var B = require("../Binding.js");

/**
 * Watches for hashchange and parses the route, and sets the observable given in param.
 */
function Route(element, context, param) {
	this.route = param();
	observables.push(this.route);
	this.route(parseRoute(location.hash));
}

Route.prototype.dispose = function(){
	var self = this;
	observables = observables.filter(function(item){
		return (item != self.route);
	});
	this.route = null;
}

var observables = [];

function rootHandler() {
	var route = parseRoute(location.hash);
	observables.forEach(function(obs){
		obs(route);
	});
}

/**
 * route.paths is the path split by / and route.params is the querystring style parameters.
 */
function parseRoute(fullpath) {
	var paths = [], params = {};
	if (fullpath != null && fullpath.length > 1) {
		fullpath = fullpath.substring(1);
		var query = fullpath.split("?");
		paths = query[0].split("/");
		if (query.length > 1) {
			query[1].split("&").forEach(function(part){
				var p = part.split("=");
				params[p[0]] = p[1];
			});
		}
	}
	return {paths: paths, params: params};
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
			handler();
			oldHash = newHash;
		}
	}, 200);
})(rootHandler);

module.exports = Route;

},{"../Binding.js":2}],16:[function(require,module,exports){
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

},{}],17:[function(require,module,exports){
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
        // detach the element to reduce the amount of re-draws.
        var nafter = this.element.nextSibling, nparent = this.element.parentNode;
        if (nparent) nparent.removeChild(this.element);

		this.element.innerHTML = template;
		children = this.element.children;
		var childContext = Binding.createChildContext(this.context, data, 0);
		for (i = 0; i < children.length; i++) {
			Binding.bindContext(children.item(i), childContext);
		}
		this.lastData = data;

        // attach it back
        if (nafter) nparent.insertBefore(this.element, nafter);
        else if (nparent) nparent.appendChild(this.element);

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

},{"../Binding.js":2}],18:[function(require,module,exports){
function Text(element, context, param) {
    this.element = element;
}

Text.prototype.update = function(data) {
    this.element.textContent = (data == null) ? "" : data;
};

Text.prototype.managesContent = true;

module.exports = Text;

},{}],19:[function(require,module,exports){
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

},{"../observable.js":21}],20:[function(require,module,exports){
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

},{"../Binding.js":2}],21:[function(require,module,exports){
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

},{}]},{},[1]);
