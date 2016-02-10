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
