var system = require('system');

var page = require('webpage').create();
var specutils = require("./lib/specutils.js");

// Route "console.log()" calls from within the Page context to the main Phantom context (i.e. current "this")
page.onConsoleMessage = function(msg) {
    console.log(msg);
};

page.open("spec/SpecRunner.html", function(status){
    if (status !== "success") {
        console.log("Unable to access network");
        phantom.exit();
    } else {
		specutils.waitFor(function(){
            return page.evaluate(function(){
				try {
					return document.querySelector(".jasmine-alert .jasmine-bar") !== null;
				}
				catch(err){
					console.log("Error while waiting: " + err.message);
				}
				return false;
            });
        }, 20000)
		.then(function(){
            var exitCode = page.evaluate(function(){
                console.log('Evaluating jasmine page...');
				console.log(document.querySelector(".jasmine-alert .jasmine-bar").textContent);
                var list = document.body.querySelectorAll('.jasmine-spec-detail.jasmine-failed');
                if (list && list.length > 0) {
					console.log('\n\n')
                  for (i = 0; i < list.length; ++i) {
                      var el = list[i],
                          desc = el.querySelector('.jasmine-description'),
                          msg = el.querySelector('.jasmine-result-message');
                      console.log('\n' + desc.textContent);
                      console.log('\tFailure: ' + msg.textContent);
                      console.log('');
                  }
				  console.log("Failure!");
                  return 1;
                } else {
					console.log("Success!");
                  return 0;
                }
            });
            phantom.exit(exitCode);
        });
    }
});
