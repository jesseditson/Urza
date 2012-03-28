// Dependencies
// ------------
var assert = require('assert');

// Forms
// -----
// Examples of what a client side form would return when editing these items

module.exports.forms = {
  user : {
    "email" : "testuser@test.com"
  },
  product : {
		product_name : "test", // Name of the Product
		product_code : "test", // SKU number
		product_status : "test", // active or inactive
		product_tagline : "test", // title of Product
		product_description : "test", // description
    fake_key : "test"
  },
  shipment : {
		shipment_number : "test", // shipment number
		package_received_code : "test", // code to verify the user received package
		survey_url : "test", // surveymonkey identifier (param after http://www.surveymonkey.com/s/);
		expected_ship_date: "1/21/1987", // expected date that the shipment will ship
		ship_date : "1/12/1998", // date the package shipped (or empty if it has not shipped)
		shipment_tagline: "test", // Title of the shipment
		shipment_image: [], //URLs to the box images
		products: ["4f307b5e42192e232b000003"], // Shipment Products
		next_shipment: "test", //link to next shipment
    product_reveal_dates : ["7/20/2001"],
    product_reveal_times : ["10:30"],
    fake_key : "fake"
  },
  waitingList : {
    userInfo : {"email" : "testuser@test.com"},
    optIn : false,
    fake_key : "Test"
  },
  tracking : {
    action_type : "unknown",
    payload : {}
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
  },
  product : function(err,res){
    assert.isNull(err);
    assert.isFalse(res[0] instanceof Error);
    assert.instanceOf(res.created_at,Date);
    assert.instanceOf(res.product_reveal_time,Date);
    assert.isNumber(res.stock);
    assert.isNumber(res.shipped);
    assert.isNumber(res.reserved);
    assert.isArray(res.product_image);
    assert.isUndefined(res.fake_key);
  },
  shipment : function(err,res){
    assert.isNull(err);
    assert.isFalse(res[0] instanceof Error);
    assert.instanceOf(res.created_at,Date);
    assert.instanceOf(res.ship_date,Date);
    assert.instanceOf(res.expected_ship_date,Date);
    assert.isArray(res.shipment_image);
    assert.isArray(res.shipment_products);
    assert.isUndefined(res.fake_key);
    var revealTime = res.shipment_products[0].product_reveal_time;
    assert.instanceOf(revealTime,Date);
    assert.equal(revealTime.getMonth()+1,7);
    assert.equal(revealTime.getDate(),20);
    assert.equal(revealTime.getFullYear(),2001);
    assert.equal(revealTime.getHours(),10);
    assert.equal(revealTime.getMinutes(),30);
  },
  waitingList : function(err,res){
    assert.isNull(err);
    assert.isFalse(res[0] instanceof Error);
    assert.instanceOf(res.created_at,Date);
    assert.isUndefined(res.fake_key);
    assert.isBoolean(res.optIn);
    assert.isObject(res.userInfo);
    assert.isString(res.userInfo.email);
  },
  tracking : function(err,res){
    assert.isNull(err);
    assert.isFalse(res[0] instanceof Error);
    assert.instanceOf(res.timestamp,Date);
    assert.isObject(res.payload);
    assert.isString(res.action_type);
  }
}