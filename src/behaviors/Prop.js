function Prop(element, context, param) {
    this.element = element;
}

Prop.prototype.update = function(param) {
    for (var f in param) {
        this.element[f] = param[f];
    }
}

module.exports = Prop;
