function Text(element, context, param) {
    this.element = element;
}

Text.prototype.update = function(data) {
    this.element.textContent = (data == null) ? "" : data;
};

Text.prototype.managesContent = true;

module.exports = Text;
