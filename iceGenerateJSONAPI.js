module.exports = function (data, schema) {
	const result = {}
	result.type = schema.type
	result.id = data.id
	const attributes = {}
	for (let key in schema.attributes) {
		attributes[key] = data[key]
	} 
	const relationships = {}
	for (let key in schema.relationships) {

	}
	result.attributes = attributes
	result.relationships = relationships
	return {
		data:result
	}
}
