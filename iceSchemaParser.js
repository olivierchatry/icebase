const STRING 					= require('string')
const PLURALIZE				= require('pluralize')
const isString = (v) => typeof v === 'string'


module.exports = (schema) => {

	const VALIDATOR_FOR_TYPE 		= {
		"string":(val) => isString(val),
		"numerical":(val) => typeof val === 'number',
		"date":(val) => STRING(val).isNumeric(),
		"many":(val) => Array.isArray(val) && val.every( isString ),
		"belongs":(val) => isString(val.data.id) && schema[val.data.type]
	}
	
	const validatorsForModel = {}
	for (let modelName in schema) {		
		const model = schema[modelName]				
		const validators = {}
		for (let entryName in model) {
			const entry = model[entryName]
			if (STRING(entry.type).isEmpty()) {
				throw new Error(`Schema type for ${modelName}.${entryName} is not defined`)
			}
			const type = entry.type.trim()
			const validator = VALIDATOR_FOR_TYPE[type]
			if (!validator) {
				throw new Error(`Schema type ${type} for ${modelName}.${entryName} is not valid, see documentation for supported types`)
			}
			validators[entryName] = validator
		}
		validatorsForModel[modelName] = validators
		validatorsForModel[PLURALIZE.singular(modelName)] = validators
	}
	return validatorsForModel
}