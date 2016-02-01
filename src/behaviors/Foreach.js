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
