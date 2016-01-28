var Binding = require("../Binding.js");

function repeat(text, times) {
	var a = text;
	for (var i = 1; i < times; i++) a += text;
	return a;
}

function Foreach(element, context, param) {
	this.element = element;
	this.context = context;
	this.template = this.element.innerHTML;
	this.childElementCount = this.element.children.length;
	this.element.innerHTML = "";
	this.childContexts = [];
}

Foreach.prototype.update = function(data) {
	var i,
	    context = this.context,
		element = this.element,
		ghost = this.ghost,
		childElementCount = this.childElementCount;

	if (data == null || data.length == 0) {
		for (i = 0, len=element.children.length; i<len; i++) {
	        Binding.remove(element.children.item(i));
	    }
		element.innerHTML = "";
		return;
	}

	// Now, reset the html content and apply bindings.
	var nafter = element.nextSibling, nparent = element.parentNode;
	if (nparent) nparent.removeChild(element);
	element.innerHTML = repeat(this.template, data.length);
	data.forEach(function(item, index){
		var childContext = Binding.createChildContext(context, item, index);
		for (var i = index * childElementCount, len = i + childElementCount; i<len; i++) {
			Binding.bindContext(element.children.item(i), childContext);
		}
	});
	if (nafter) nparent.insertBefore(element, nafter);
	else if (nparent) nparent.appendChild(element);
};

Foreach.prototype.dispose = function() {
	this.update([]);
	this.element.innerHTML = this.template;
};

Foreach.prototype.managesContent = true;

module.exports = Foreach;
