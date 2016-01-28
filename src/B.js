/*
The MIT License (MIT)

Copyright (c) 2015 Yavuz Tor

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
var B = require("./observable.js");
B.Binding = require("./Binding.js");

B.bindData = B.Binding.bindData;
B.first = function(qs, elem) { return (elem||document).querySelector(qs); }
B.all = function(qs, elem) { return (elem||document).querySelectorAll(qs); }

B.Binding.register("text", require("./behaviors/Text.js"));
B.Binding.register("checked", require("./behaviors/Checked.js"));
B.Binding.register("attr", require("./behaviors/Attr.js"));
B.Binding.register("value", require("./behaviors/Value.js"));
B.Binding.register("log", require("./behaviors/Log.js"));
B.Binding.register("style", require("./behaviors/Style.js"));
B.Binding.register("event", require("./behaviors/Event.js"));
B.Binding.register("click", require("./behaviors/Click.js"));
B.Binding.register("foreach", require("./behaviors/Foreach.js"));
B.Binding.register("css", require("./behaviors/Css.js"));
B.Binding.register("with", require("./behaviors/With.js"));
B.Binding.register("template", require("./behaviors/Template.js"));
B.Binding.register("ghost", require("./behaviors/Ghost.js"));
B.Binding.register("prop", require("./behaviors/Prop.js"));
B.Binding.register("component", require("./behaviors/Component.js"));
B.Binding.register("comprop", require("./behaviors/Comprop.js"));
B.Binding.register("route", require("./behaviors/Route.js"));
module.exports = B;
if (typeof global.B === "undefined") global.B = B;
