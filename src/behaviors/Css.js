function Css(element, context, param) {
    this.element = element;
    this.context = context;
}

Css.prototype.update = function(data) {
    var model = this.context.$data;
    var classes;
    if (this.element.hasAttribute("class")) {
		classes = this.element.getAttribute("class").split(/\s+/).filter(function(item) {
			return (!data.hasOwnProperty(item));
		});
	}
	else {
		classes = []
	}
    for (var cssName in data) {
        if (data[cssName]) classes.push(cssName);
    }
    this.element.setAttribute("class", classes.join(" "));
};

Css.prototype.dispose = function() {
};

Css.prototype.managesContent = false;

module.exports = Css;
