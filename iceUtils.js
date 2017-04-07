const PATH			= require("path")
const FS				= require("fs")

module.exports = {
	mkdirp:	function (fullPath) {
		fullPath.split(PATH.sep).reduce((current, folder) => {
			current += folder + PATH.sep;
			if (!FS.existsSync(current)){
				FS.mkdirSync(current);
			}
			return current;
		}, '');
	}
}