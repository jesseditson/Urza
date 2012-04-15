// Dependencies
// ------------
var assert = require('assert');

// Forms
// -----
// Examples of what a client side form would return when editing these items

module.exports.forms = {
  user : {
    "email" : "testuser@test.com"
  }
}

// Assertions
// ----------
// Assertions to validate that the parsed version of these items is correct

module.exports.assertions = {
  user : function(err,res){
    assert.isNull(err);
    assert.isFalse(res[0] instanceof Error);
    assert.instanceOf(res.created_at,Date);
  }
}