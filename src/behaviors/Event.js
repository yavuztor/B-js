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
