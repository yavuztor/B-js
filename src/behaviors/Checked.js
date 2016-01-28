var B = require("../observable.js")
function Checked(element, context, param) {
    this.element = element;
    var data = param();
    this.clickListener = function() {
        if (B.isObservable(data)) data(element.checked);
    };
    this.element.addEventListener("click", this.clickListener);
}

Checked.prototype.update = function(data) {
	if (this.lastSub) {
        this.lastSub.dispose();
        this.lastSub = null;
    }
	this.setValue(B.unwrap(data))
	if (B.isObservable(data)) {
		this.lastSub = data.subscribe(this.setValue.bind(this));
	}
};

Checked.prototype.setValue = function(newval) {
	if (newval) {
		this.element.setAttribute("checked", "checked");
	}
	else {
		this.element.removeAttribute("checked");
	}
};

Checked.prototype.dispose = function() {
	this.element.removeEventListener(this.clickListener);
}

Checked.prototype.managesContent = false;

module.exports = Checked;
