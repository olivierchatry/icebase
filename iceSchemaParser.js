const STRING 					= require('string')
const PLURALIZE				= require('pluralize')
const isString = (v) => typeof v === 'string'


module.exports = (schema) => {

	const DEFINITION 		= {
		"string":			{
			validator:(val) => isString(val),
			type:	"attributes"
		},
		"numerical":	{
			validator:(val) => typeof val === 'number',
			type: "attributes"
		},
		"date":				{
			validator:(val) => STRING(val).isNumeric(),
			type: "attributes"
		},
		"many":				{
			validator:(val) => Array.isArray(val) && val.every( isString ),
			type:	"relationships"
		},
		"belongs":		{
			validator:(val) => isString(val.data.id) && schema[val.data.type],
			type:	"relationships"
		}
	}
	
	const parsedSchemata = {}
	for (let modelName in schema) {		
		const model 				= schema[modelName]				
		const parsedSchema	= {
			validators:{},
			attributes:{},
			relationships:{}			
		}	

		for (let entryName in model) {
			const entry = model[entryName]

			if (STRING(entry.type).isEmpty()) {
				throw new Error(`Schema type for ${modelName}.${entryName} is not defined`)
			}

			const type = entry.type.trim()
			const definition = DEFINITION[type]
			if (!definition) {
				throw new Error(`Schema type ${type} for ${modelName}.${entryName} is not valid, see documentation for supported types`)
			}			
			parsedSchema.validators[entryName] = definition.validator
			parsedSchema[definition.type][entryName] = type
		}	
		parsedSchemata[PLURALIZE.singular(modelName)] = parsedSchemata[modelName] = parsedSchema		
	}
	return parsedSchemata
}