const FS 				= require("fs")
const ICE_UTILS = require("./iceUtils")

module.exports = (function() {
	let 	DATA = {}
	let 	CONFIGURATION = null
	return {
		DATA,
		initialize(configuration) {					
			ICE_UTILS.mkdirp(configuration.snapShotPath)
			ICE_UTILS.mkdirp(configuration.revisionPath)

			CONFIGURATION = configuration
			const snapShots = FS.readdirSync(CONFIGURATION.snapShotPath).sort()			
			if (snapShots.length) {
				DATA = require(CONFIGURATION.snapShotPath + snapShots[snapShots.length - 1])
			}
			const revisions = FS.readdirSync(CONFIGURATION.revisionPath).sort()
			revisions.forEach(
				revisionFile => {
					const revision = require(CONFIGURATION.dataPath + revisionFile)
					revision.id = file.replace('.json', '')
					execute(revision)
				}
			)
		},	
		execute(revision) {

		}
	}
	
	
})()