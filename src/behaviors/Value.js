var B = require("../observable.js")
function Value(element, context, param) {
    this.element = element;
}

Value.prototype.update = function(data) {
	var element = this.element;
	if (this.lastDataDispose) this.lastDataDispose();
	element.value = B.unwrap(data);
	if (B.isObservable(data)) {
		var s = data.subscribe(function(newval) {
			element.value = newval;
		});
		this.lastDataDispose = function(){
			s.dispose();
		};
		this.element.onchange = function() {
			data(element.value);
		};
	}
};

Value.prototype.dispose = function() {
	this.element.onchange = null;
}

Value.prototype.managesContent = false;

module.exports = Value;
