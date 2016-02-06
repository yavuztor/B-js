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
