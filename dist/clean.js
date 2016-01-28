var fs = require("fs");
var path = require("path");



var scriptdir = path.dirname(process.argv[1]),
	B_path = path.join(scriptdir, "B.js"),
	B_min_path = path.join(scriptdir, "B.min.js"),
	B_info_path = path.join(scriptdir, "B.info.js"),
	info = {
		build: process.env.TRAVIS_BUILD_NUMBER || "<N/A>",
		commit: process.env.TRAVIS_COMMIT || "<N/A>"
	};


if (fs.existsSync(B_path)) fs.unlinkSync(B_path);
if (fs.existsSync(B_min_path)) fs.unlinkSync(B_min_path);
if (fs.existsSync(B_info_path)) fs.unlinkSync(B_info_path);

var fd = fs.openSync(B_info_path, "w");
fs.writeSync(fd, JSON.stringify(info));
fs.closeSync(fd);
