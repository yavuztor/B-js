describe("observable test suite", function(){
	it("initializes with the given value", function() {
		var o = B.observable("test");
		expect(o()).toBe("test");
	});

	it("notifies subscribers in the given order", function() {
		// setup
		var o = B.observable();
		var order = 0;
		var s1time = null;
		var s1 = o.subscribe(function(newval, oldval){
			s1time = order++;
		});
		var s2time = null;
		var s2 = o.subscribe(function(newval, oldval) {
			s2time = order++;
		});

		//act
		o("changed value");

		//test
		expect(s1time).toBeLessThan(s2time);
	});

	it("does not notify subscribers when the new value is same", function(){
		var o = B.observable("test");
		var subscriberCalled = false;
		o.subscribe(function(){
			subscriberCalled = true;
		});

		o("test");

		expect(subscriberCalled).toBe(false);
	});

	it("supplies subscriber callback new value and old value", function(){
		var o = B.observable("oldval");
		var callbackTested = false;
		o.subscribe(function(newval, oldval){
			expect(newval).toBe("test");
			expect(oldval).toBe("oldval");
			callbackTested = true;
		});

		o("test");

		expect(callbackTested).toBe(true);
	});

	it("disposes all subscribers when dispose is called", function(){
		var o = B.observable();
		var s1called = false, s2called = false;
		o.subscribe(function() {
			s1called = true;
		});
		o.subscribe(function(){
			s2called = true;
		});

		o.dispose();
		o("test");

		expect(s1called).toBe(false);
		expect(s2called).toBe(false);
	});

	it("toggles the value from false to true, and from true to false when .toggle() is called", function(){
		var o = B.observable(true);
		o.toggle();
		expect(o()).toBe(false);

		o.toggle();
		expect(o()).toBe(true);

		o.toggle();
		expect(o()).toBe(false);
	});

	it("sends request and sets response to the observable value when .request() is called", function(done){
		var mock = {
			success: function(cb){ this.successcb = cb; return this; },
			failure: function(cb){ this.failurecb = cb; return this; },
			send: function() {
				setTimeout(function(self){ self.successcb("test"); }, 100, this);
				this.sendCalled = true;
				return this;
			}
		};
		var o = B.observable(null);
		o.request(mock);
		expect(mock.sendCalled).toBe(true);

		setTimeout(function(){
			expect(o()).toBe("test");
			done();
		}, 200)
	});

	it("append concats the given parameter to the array observable", function(){
		var o = B.observable([]);
		o.append(["a", "b"]);

		expect(o().length).toBe(2);
		expect(o()[0]).toBe("a");
		expect(o()[1]).toBe("b");
	});
});


describe("computed test suite", function(){
	it("executes the calculator at the time computed is created", function(){
		var fnCalled = false;
		var c = B.computed(function(){
			fnCalled = true;
			return "";
		});

		expect(fnCalled).toBe(true);
	});

	it("re-initializes the dependency list in next call, if the calculator function returns null the first time", function(){
		var o1 = B.observable("o1");
		var o2 = B.observable("o2");
		var calcCount = 0;
		var c = B.computed(function(){
			var val1 = o1();
			calcCount += 1;
			if (calcCount == 1) return null;
			var val2 = o2();
			return val1 + "->" + val2;
		});

		expect(calcCount).toBe(1);

		// Since it returns before calling o2(), this should not cause recalc..
		o2("O2");
		expect(calcCount).toBe(1);

		var s = c.subscribe(function(newValue, oldValue){
			//oldValue should reflect the last returned value from calc.
			expect(oldValue).toEqual(null);
			expect(newValue).toEqual("O1->O2");
		});

		//This should calc and re-initialize dependecy list.
		o1("O1");
		expect(calcCount).toBe(2);

		s.dispose();

		//Now, this should cause a recalc, since now c() depends on o1 and o2.
		o2("o2");
		expect(calcCount).toBe(3);
	})

	it("calculates the first time, and recalculates every time observables that it depends on change", function(){
		var o1 = B.observable("o1");
		var o2 = B.observable("o2");
		var calcCount = 0;
		var c = B.computed(function(){
			var defectingDependency = o1();
			calcCount += 1;
			return o2();
		});

		expect(calcCount).toBe(1);

		expect(c()).toBe("o2");
		expect(calcCount).toBe(1);

		o2("p2");
		expect(calcCount).toBe(2);
		expect(c()).toBe("p2");

		o1("p1");
		expect(calcCount).toBe(3);
		expect(c()).toBe("p2");
	});

	it("notifies subscribers when the calculated value is changed", function(){
		var o1 = B.observable("o1");
		var o2 = B.observable("o2");
		var sCount = 0;
		var c = B.computed(function(){
			var defectingDependency = o1();
			return o2();
		});
		c.subscribe(function(newval, oldval){
			sCount += 1;
		})

		expect(sCount).toBe(0);
		expect(c()).toBe("o2");
		expect(sCount).toBe(0);

		o2("p2");
		expect(sCount).toBe(1);
		expect(c()).toBe("p2");

		o1("p1");
		expect(sCount).toBe(1);
		expect(c()).toBe("p2");

	})
});

describe("xhr test suite", function(){
	var xhr;
	beforeEach(function(){
		xhr = {
			open: jasmine.createSpy("open"),
			send: jasmine.createSpy("send"),
			setRequestHeader: jasmine.createSpy("setRequestHeader"),
			responseText: "",
			responseXML: null,
			readyState: 0
		}
		window.XMLHttpRequest = jasmine.createSpy("XMLHttpRequest");
		window.XMLHttpRequest.and.callFake(function(){ return xhr; });

	})
	it("defaults to get method with text result, when sent without changes", function(){
		var h = B.xhr("http://www.google.com");
		expect(h.url).toBe("http://www.google.com");
		expect(h.verb).toBe("GET");
		expect(h.serialize).toBe(h.constructor.text);
	});

	it("calls xhr open with verb, method, async=true, username, and password", function(){
		var h = B.xhr("http://some.url.com").method("PUT").credentials("uname", "pass").send();
		expect(xhr.open).toHaveBeenCalledWith("PUT", "http://some.url.com", true, "uname", "pass");
		expect(xhr.send).toHaveBeenCalled();
	});

	it("calls all success handlers and done handlers on success", function(done){
		xhr.send.and.callFake(function(){ setTimeout(test, 100); })
		var scalls = 0, dcalls = 0;
		function hsuccess(r){ scalls++; expect(this).toBe(h); }
		function hdone() { dcalls++; expect(this).toBe(h);}
		var h = B.xhr("http://some.url.com").method("PUT")
				.success(hsuccess)
				.success(hsuccess)
				.done(hdone)
				.done(hdone)
				.send();

		function test() {
			xhr.readyState = 4;
			xhr.onreadystatechange({});
			expect(scalls).toBe(2);
			expect(dcalls).toBe(2);
			done();
		}
	});

	it("calls all failure handlers and done handlers on error", function(done){
		xhr.send.and.callFake(function(){ setTimeout(test, 100); })
		var fcalls = 0, dcalls = 0, failuremsg = "";
		function hfailure(msg){ fcalls++; failuremsg = msg; }
		function hdone() { dcalls++; }
		var h = B.xhr("http://some.url.com").method("PUT")
				.failure(hfailure)
				.failure(hfailure)
				.done(hdone)
				.done(hdone)
				.send();

		function test() {
			xhr.onerror({message: "error"});
			expect(fcalls).toBe(2);
			expect(dcalls).toBe(2);
			expect(failuremsg).toBe("error");
			done();
		}
	});

	it("calls all failure handlers and done handlers on abort with message 'aborted'", function(done){
		xhr.send.and.callFake(function(){ setTimeout(test, 100); });
		var fcalls = 0, dcalls = 0, failuremsg = "";
		function hfailure(msg){ fcalls++; failuremsg = msg; }
		function hdone() { dcalls++; }
		var h = B.xhr("http://some.url.com").method("PUT")
				.failure(hfailure)
				.failure(hfailure)
				.done(hdone)
				.done(hdone)
				.send();

		function test() {
			xhr.onabort({});
			expect(fcalls).toBe(2);
			expect(dcalls).toBe(2);
			expect(failuremsg).toBe("aborted");
			done();
		}
	});

	it("serializes responseText with JSON.parse when accept('json') is set", function(done){
		xhr.send.and.callFake(function(){ setTimeout(test, 100); });
		function test(){
			xhr.responseText = JSON.stringify({name1: "value1", name2: 2, name3: true});
			xhr.readyState = 4;
			xhr.onreadystatechange();
			done();
		}
		B.xhr("http://some.url.com")
			.accept("json")
			.success(function(r){
				expect(r.name1).toBe("value1");
				expect(r.name2).toBe(2);
				expect(r.name3).toBe(true);
			}).send();
	});

	it("returns responseXML when accept('xml') is set", function(done){
		xhr.send.and.callFake(function(){ setTimeout(test, 100); });
		function test(){
			xhr.responseXML = {};
			xhr.readyState = 4;
			xhr.onreadystatechange();
			done();
		}
		B.xhr("http://some.url.com")
			.accept("xml")
			.success(function(r){
				expect(r).toBe(xhr.responseXML);
			})
			.send();
	})
});

describe("jsonp suite", function(){
	var appendChild, removeChild, script;
	beforeEach(function(){
		appendChild = spyOn(document.body, "appendChild");
		removeChild = spyOn(document.body, "removeChild");
		appendChild.and.callFake(function(elem){ script = elem; });
	});
	function callbackFnName(){
		var m = /callback=([^=]+)/.exec(script.src);
		return m && m[1];
	}
	it("sends callback parameter set to callback function name", function(){
		B.jsonp("http://some.url.com", "callback").send();

		expect(script).not.toBeUndefined();
		expect(callbackFnName()).not.toBeNull();
		expect(typeof window[callbackFnName()]).toBe("function");
	});

	it("calls all success handlers with the result", function(){
		var handler = jasmine.createSpy("successHandler");
		var jp = B.jsonp("http://some.url.com", "callback")
			.success(handler)
			.success(handler)
			.send();

		var res = {};
		// Do the thing jsonp is supposed to do, manually.
		window[callbackFnName()](res);

		expect(handler.calls.count()).toBe(2);
		expect(handler.calls.argsFor(0)).toEqual([res]);
		expect(handler.calls.argsFor(1)).toEqual([res]);
		expect(handler.calls.first()).toEqual({object: jp, args:[res], returnValue:undefined});
	})

})
