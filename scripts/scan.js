var data = require('./export');
var _    = require('lodash');

var type = process.argv[2];
if (!type) {
  console.log("You must specify a type");
  return;
}

var checkSchema = function(schema, key, value) {
      if (_.isArray(value)) {
        if (!schema.hasOwnProperty(key)) {
          schema[key] = {};
        };
        _.forEach(value, function(subValue) {
          checkSchema(schema, key, subValue);
        });
      }
      else if (_.isObject(value)) {
        if (!schema.hasOwnProperty(key)) {
          schema[key] = {};
        };
        _.forEach(value, function(subValue, subKey) {
          checkSchema(schema[key], subKey, subValue);
        });
      }
      else {
        if (!schema.hasOwnProperty(key)) {

          schema[key] = {
            "length": 0,
            "type": "string"
          };
        }

        schema[key].length = (value.length > schema[key].length ? value.length : schema[key].length);
        schema[key].type = typeof(value);
      }

};

var types = {};
var schema = {};
_.forEach(data.docs, function(doc) {
  types[doc.doc.type] = doc.doc.type;
  if(doc.doc.type == type) {
    _.forEach(doc.doc, function(value, key) {
      checkSchema(schema, key, value);
//      console.log(key + ":", value);
    });
  }
});
console.log("Types");
console.log(types);
console.log("*********************");
console.log(type, schema);
//console.log(data.doc);
