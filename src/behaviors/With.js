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
