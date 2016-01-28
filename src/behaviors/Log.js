function Log(element, context, param) {
    this.context = context;
    console.log("Log: initialized");
}

Log.prototype.update = function(data) {
    console.log("Log: param update");
    console.log(data);
};

Log.prototype.managesContent = false;

module.exports = Log;
