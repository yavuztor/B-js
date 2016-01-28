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
