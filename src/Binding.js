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
