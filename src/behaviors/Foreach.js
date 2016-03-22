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
