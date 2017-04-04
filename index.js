const WEBSOCKET				= require("nodejs-websocket")
const HTTP 						= require('http')
const URL 						= require('url')
const PATH						= require('path')
const FS							= require('fs')
const QS							= require('querystring')
const ARGV 						= require('minimist')(process.argv.slice(2))
const STRING 					= require('string')
const TIMESYNCSERVER	= require('timesync/server')
const PLURALIZE				= require('pluralize')

const ICE							= require('./ice')


if (STRING(ARGV.configuration).isEmpty()) {
	ARGV.configuration = `.${PATH.sep}configuration.json`	
}

const CONFIGURATION		= require(ARGV.configuration)

CONFIGURATION.schema  = ICE.iceSchemaParser(require(CONFIGURATION.schema)) 

const COMMAND					= {
	set:0,
	update:1,
	delete:2
}

const GLOBAL_DATA 		= {
}


const	iceGetData = (paths) => {
	const obj = GLOBAL_DATA
	const path = path.split('/').forEach(
		(sub) => {
			obj = obj[sub] = obj[sub] || {}
		}
	)	
	return obj
}

const iceValidateData = (model, key, data, errors) => {
	const schema = CONFIGURATION.schema[model]		
	if (!schema) {
		errors.push(`schema for ${model} is not defined`)
		return false
	} else {	
		const validator = schema[key]
		if (!validator || !validator(data)) {
			errors.push(`${key} is not defined in schema or is not valid`)
			return false
		}
	}
	return true
}

const iceValidateAttributes = (model, data, errors) => {
	const schema = CONFIGURATION.schema[model]		
	if (!schema) {
		errors.push(`Schema for ${model} is not defined`)
	} else {
		for (let key in data) {
			iceValidateData(model, key, data[key], errors)
		}
	}
	return errors
}


const	iceSetData = (id, paths, query, callback) => {
	const model = paths.shift()
	const errors = []

	if (query.data.attributes) {
		iceValidateAttributes(model, query.data.attributes, errors)
	}	

	query.data.relationships = query.data.relationships || {}
	if (!GLOBAL_DATA[model]) {
		GLOBAL_DATA[model] = {}
	}		
	GLOBAL_DATA[model][id] = query.data.attributes

	for (let key in query.data.relationships) {
		const relationship = query.data.relationships[key]
		GLOBAL_DATA[model][id][key] = {}

		const fun = (data) => {
			if (iceValidateData(model, key, relationship, errors)) {
				GLOBAL_DATA[model][id][key][data.id] = true
			}
		}
		if (Array.isArray(relationship.data)) {
			relationship.data.forEach(fun)			
		} else {
			fun(relationship.data)			
		}
	}
	if (callback) {
		if (errors.length) {
		} else {
			const data = query.data
			data.type = PLURALIZE.singular(data.type)
			data.id = id

			callback(null, 201, data)
		}
	}
	return errors
}

const iceExecute = (revision, callback) => {
	const paths = revision.path.split('/').filter(
		s => !STRING(s).isEmpty()
	)
	switch (revision.cmd) {
		case COMMAND.set:						
			return iceSetData(revision.id, paths, revision.data, callback)
		break;
		case COMMAND.update:
			const existing = iceGetData(revision.path)
			Object.assign(existing, revision.data)
		break;
		case COMMAND.delete:
			return iceSetData(paths, null, callback)
		break;
	}								
}


const iceExecuteAndSave = (cmd, path, data, callback) => {
	const id = ICE.iceGenerateId()
	const revision = {
		cmd,
		path,
		data,		
	}
	FS.writeFile(
		`${CONFIGURATION.dataPath}${id}.json`,
		JSON.stringify(revision),
		(err) => {
			if (!err) {
				revision.id = id
				iceExecute(revision, callback)
			}			
		}
	)
}

const iceProcessRequest = function (request, response) {
	const url = URL.parse(request.url)
	const path = url.path
	let		cmd = COMMAND.set
	const callback = (err, status, result) => {
		if (err) {
			// internal error
			response.writeHead(500, err.message,  {"Content-Type": "application/vnd.api+json", "Access-Control-Allow-Origin":"*"})
		} else {
			response.writeHead(status, {"Content-Type": "application/vnd.api+json", "Access-Control-Allow-Origin":"*"})			
			response.write(JSON.stringify({data:result}))			
		}
		response.end()					
	}
	switch (request.method) {
		case 'GET': {			
			response.writeHead(200, {'Content-Type':'application/json', "Access-Control-Allow-Origin":"*"})					
			response.pipe(iceGetData(path))
		}
		break;
		case 'PATCH':
			cmd = COMMAND.update
		case 'POST':{
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
		case 'OPTIONS':{
			response.writeHead(200, {
				'Access-Control-Allow-Origin':'*',
				'Access-Control-Allow-Headers':'Content-Type'
			})					
			response.end()
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

const revisions = FS.readdirSync(CONFIGURATION.dataPath).sort()

revisions.forEach(
	(file) => {
		try {
			const revision = require(CONFIGURATION.dataPath + file)
			revision.id = file.replace('.json', '')
			iceExecute(revision)
		} catch(err) {
			console.error(err)
		}		
	}
)

// const timeServer = TIMESYNCSERVER.attachServer(server, '/timesync')

server.listen(
	CONFIGURATION.port, 
	function() {    
    console.log("Server listening on: http://localhost:%s", CONFIGURATION.port);	
	}
);
