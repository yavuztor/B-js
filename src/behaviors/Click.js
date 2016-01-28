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
