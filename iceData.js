const FS 				= require("fs")
const PATH			= require("path")
const ICE_UTILS = require("./iceUtils")
const ICE 			= require("./ice")

module.exports = (function() {
	let 		DATA = {}
	const		COMMAND = {
		set:0,
		update:1,
		delete:2		
	}
	
	return {
		CONFIGURATION:{},
		COMMAND,
		DATA,
		initialize(configuration) {					
			ICE_UTILS.mkdirp(configuration.snapShotPath)
			ICE_UTILS.mkdirp(configuration.revisionPath)

			this.CONFIGURATION = configuration
			const snapShots = FS.readdirSync(configuration.snapShotPath).sort()			
			if (snapShots.length) {
				DATA = require(configuration.snapShotPath + snapShots[snapShots.length - 1])
			}
			const revisions = FS.readdirSync(configuration.revisionPath).sort()
			revisions.forEach(
				revisionFile => {
					try {						
						this.execute(
							require(`${configuration.revisionPath}${revisionFile}`)					
						)
					} catch(e) {
						console.error(`Invalid revision file ${revisionFile}`)
					}
				}
			)
		},	
		execute(revision) {
			switch (revision.cmd) {
				case COMMAND.set: {
					this.DATA[revision.type] = DATA[revision.path] || {}
					this.DATA[revision.type][revision.id] = revision.data
				}						
				break;
				case COMMAND.update:
				break;
				case COMMAND.delete:
				break;
			}
		},
		snapShot(callback) {			
			FS.writeFile(
				`${this.CONFIGURATION.snapShotPath}${ICE.iceGenerateId()}.json`, 
				JSON.stringify(revision),
				callback
			)
		},
		executeAndSave(revision) {
			FS.writeFile(
				`${this.CONFIGURATION.revisionPath}${ICE.iceGenerateId()}.json`, 
				JSON.stringify(revision), 
				() => this.execute(revision)
			)
		}
	}
	
	
})()