function Style(element, context, param) {
    this.element = element;
}

Style.prototype.update = function(data) {
    for (var style in data) {
        this.element.style[style] = data[style];
    }
};

Style.prototype.managesContent = false;

module.exports = Style;
