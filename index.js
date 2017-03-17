const WEBSOCKET				= require("nodejs-websocket")
const HTTP 						= require('http');
const URL 						= require('url');
const PATH						= require('path')
const FS							= require('fs')
const QS							= require('querystring');
const CONFIGURATION		= {
	port:80,
	currentRevision:0,
	dataPath:"./data/"
}

const COMMAND					= {
	set:0,
	update:1,
	delete:2
}

const GLOBAL_DATA 					= {

}

const createRevision = (path, data) => {
	
}

const	iceGetData = (path) => {
	let obj = GLOBAL_DATA
	path.split('/').forEach(
		(sub) => {
			obj = obj[sub] = obj[sub] || {}
		}
	)
	return obj
}

const	iceSetData = (path, data) => {
	const subs = path.split('/')
	const len = subs.length - 1
	let		obj = GLOBAL_DATA, i = 0
	
	for (i = 0; i < len; ++i) {
		const sub = subs[i]
		obj = obj[sub] = obj[sub] || {}
	}

	return obj[ subs[i] ] = data
}

const iceExecute = (cmd, path, data) => {
	switch (revision.cmd) {
		case COMMAND.set:			
			iceSetData(path, data)
		break;
		case COMMAND.update:
			const existing = iceGetData(revision.path)		
			Object.assign(existing, data)
		break;
		case COMMAND.delete:
			iceSetData(path, null)
		break;
	}								
}

const iceExecuteAndSave = (cmd, path, data, callback) => {
	const revision = {
		cmd,
		path,
		data
	}
	FS.writeFile(
		PATH.join(GLOBAL_DATA.data, `${GLOBAL_DATA.revision++}`),
		revision,
		(err) => {
			if (!err) {
				iceExecute(cmd, path, data)
			}
			callback(err)
		}
	)
}

const iceProcessRequest = function (request, response) {
	const url = URL.parse(request.url)
	const path = PATH.join(CONFIGURATION.dataPath, url.path)
	let		cmd = COMMAND.set
	const callback = (err) => {
		if (err) {
			response.writeHead(500, err.message,  {'Content-Type':'application/json'})
		} else {
			response.writeHead(200)
		}
		response.end()
	}
	switch (request.method) {
		case 'GET': {			
			response.writeHead(200, {'Content-Type':'application/json'})					
			response.pipe(iceGetData(path))
		}
		break;
		case 'PATCH':{
			cmd = COMMAND.update
		}
		case 'PUT':{
			let body = ""
			request.on('data', function (data) {
					body += data;
					if (body.length > 1e6) {
						request.connection.destroy();
					}							
			});			
			request.on('end', function () {
				try {
					const post = JSON.parse(body);
					iceExecuteAndSave(cmd, path, post, callback)
				} catch (err) {
					callback(err)
				}
			});			
		}		
		break;
		case 'DELETE':{
			iceExecuteAndSave(COMMAND.delete, path, null, callback)
		}
		break;
	}
}


const server = HTTP.createServer(
	iceProcessRequest
)

CONFIGURATION.dataPath = CONFIGURATION.dataPath.replace('\\', PATH.sep).replace('/', PATH.sep)

const mkdirp = (fullPath) => {
	fullPath.split(PATH.sep).reduce((current, folder) => {
		current += folder + PATH.sep;
		if (!FS.existsSync(current)){
			FS.mkdirSync(current);
		}
		return current;
	}, '');
}

mkdirp(CONFIGURATION.dataPath)

const revisions = FS.readdirSync(CONFIGURATION.dataPath ).sort()

revisions.forEach(
	(file) => {
		try {
			const revision = require(file)
		} catch(err) {
			console.error(err)
		}		
	}
)


server.listen(
	CONFIGURATION.port, 
	function() {    
    console.log("Server listening on: http://localhost:%s", CONFIGURATION.port);
	}
);
