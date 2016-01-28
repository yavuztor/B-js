var Binding = require("../Binding.js");

function Ghost(element, context, param) {
    var behaviors = Binding.get(element).behaviors;
    var contentMaker = last(behaviors, function(b){ return b.managesContent; });
    this.subscription = contentMaker.param.subscribe(this.contentChange.bind(this));
    this.oldDisplay = element.style.display;
    element.style.display = "none";
    this.lastChildCount = 0;
    this.element = element;
    this.contentChange();
}

Ghost.prototype.contentChange = function () {
    this.cleanup();
    this.lastChildCount = this.element.childNodes.length;
    for (i = 0; i < this.lastChildCount; i++) {
        this.element.parentNode.insertBefore( clone(this.element.childNodes.item(i)), this.element );
    }
}

Ghost.prototype.cleanup = function(){
    for (var i = 0; i < this.lastChildCount; i++) {
        this.element.parentNode.removeChild(this.element.previousSibling);
    }
    this.lastChildCount = 0;
}

Ghost.prototype.dispose = function() {
    this.cleanup();
    this.element.style.display = this.oldDisplay;
}

function last(arr, criteria) {
    for (var i = arr.length - 1; i >= 0; i--) {
        if (criteria(arr[i], i)) return arr[i];
    }
    return null;
}

function clone(node) {
    return node.cloneNode(true);
}



module.exports = Ghost;
