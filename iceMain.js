const EXPRESS 				= require('express')
const PATH 						= require('path')
const STRING 					= require('string')
const MORGAN 					= require('morgan');
const COOKIE_PARSER 	= require('cookie-parser');
const BODY_PARSER 		= require('body-parser');
const ARGV 						= require('minimist')(process.argv.slice(2))
const ICE							= require('./ice');
const ICE_DATA 				= require('./iceData')

if (STRING(ARGV.configuration).isEmpty()) {
	ARGV.configuration = `./configuration.dev.json`	
}

const CONFIGURATION				= require(ARGV.configuration)
CONFIGURATION.schema  		= ICE.iceSchemaParser(require(CONFIGURATION.schema)) 
CONFIGURATION.serverPath	= ""



const app = EXPRESS()

app.use(MORGAN('dev'));
app.use(BODY_PARSER.json());
app.use(BODY_PARSER.urlencoded({ extended: false }));
app.use(COOKIE_PARSER());

const generateExpressError = (text, status) => {
	const error = new Error(text)
	error.status = status
	return error
}

const ICE_ERROR = {	
	invalid_model:generateExpressError("Invalid model", 404),	
	invalid_content_type:generateExpressError("Invalid content type", 415)
}

ICE_DATA.initialize(CONFIGURATION)

app.use(function (err, req, res, next) {  
	res.status(err.status || 500).send(err.message || 'Unknow error !')  
})

app.use(`${CONFIGURATION.serverPath}`, function(req, res, next) {
	const contentType = req.get('content-type')
	if (!contentType) {
		 return next()
	}
	if (!contentType.match(/^application\/vnd\.api\+json$/)) {
		return next(ICE_ERROR.invalid_content_type)
	}
	req.set('content-type', 'application/json')
	return next()
})

app.param("type", function(req, res, next, typeName) {
	req._schema = CONFIGURATION.schema[typeName]
	if (!req._schema) {
		next(ICE_ERROR.invalid_model)
	} 
	next()
})

app.post(`${CONFIGURATION.serverPath}/:type`, function(req, res, next) {
	if (req.body && req.body.data) {
		const data = req.body.data		
		for (let key in data.attributes) {
			const datum = data[key]
			if (datum) {

			}
		}
	}
})

app.patch(`${CONFIGURATION.serverPath}/:type`, function(req, res, next) {

})

app.delete(`${CONFIGURATION.serverPath}/:type/:id`, function(req, res, next) {

})

app.get(`${CONFIGURATION.serverPath}/:type`, function(req, res, next) {

})

app.get(`${CONFIGURATION.serverPath}/:type/:id`, function(req, res, next) {

})

app.get(`${CONFIGURATION.serverPath}/:type/:id/:attribute`, function(req, res, next) {

})

app.get(`${CONFIGURATION.serverPath}/:type/:id/relationships/`, function(req, res, next) {

})

app.listen(CONFIGURATION.port);