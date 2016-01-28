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
