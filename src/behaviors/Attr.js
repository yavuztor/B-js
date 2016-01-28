function Attr(element, context, param) {
    this.element = element;
}

Attr.prototype.update = function(data) {
    for (var attr in data) {
    		if (data[attr] !== null) {
			this.element.setAttribute(attr, data[attr]);
		}
		else {
			this.element.removeAttribute(attr);
		}
			
    }
};

Attr.prototype.managesContent = false;

module.exports = Attr;
