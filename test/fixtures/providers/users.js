// *Users provider*
// provides manipulation methods for the users db.

// Dependencies
// ------------

var async = require('async'),
    _ = require('underscore'),
    config = require('config');

// Users Class
// -----------------

var Users = module.exports = function(mongodb){
  this.db = mongodb;
}

// default fields
Users.prototype.defaultFields = [
  '_id',
  'offers',
  'campaigns',
  'signed_up',
  'birthday',
  'created_at',
  'email',
  'name',
  'first_name',
  'middle_name',
  'last_name',
  'friends',
  'gender',
  'last_login',
  'location',
  'id',
  'name',
  'updated_time',
  'updating',
  'username',
  'picture'
  ];

Users.prototype.create = function(data,callback){
  this.db.upsert('users',{id:data.id},data,callback);
}

// Helpers/Non-DB Methods
// ----------------------

// Public Methods
// --------------

Users.prototype.refresh = function(user,callback){
	if(user._id){
		this.db.findById('users',user._id,callback);
	} else {
		callback(null,user);
	}
};

Users.prototype.updateAndReturn = function(id,data,callback){
  this.db.update('users',{_id : id},{$set : data},function(err){
    this.findById(id,['updated'],function(err,user){
      callback(err,user);
    });
  }.bind(this));
}