// Dependencies
// ------------
var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  ObjectId = Schema.ObjectId;

// Export the Collection Name
module.exports.Collection = "users";

// Map/Reduce Methods
// ------------------

var mapReduce = module.exports.mapReduce = {
  "countOffers" : {
    "map" : function(){
      if(!this.offers){
        return;
      }
      for(var offer in this.offers) {
        emit(this.offers[offer],1);
      }
    },
    "reduce" : function(prev,current){
      var count = 0;
      for(var index in current) {
        count += current[index];
      }
      return count;
    }
  },
  "usersWithOffers" : {
    "map" : function(){
      if(!this.offers || !this.offers.length){
        return;
      } else {
        emit(this._id,this);
      }
    },
    "reduce" : function(prev,current){
      return current;
    }
  }
}

// User Schema
// -----------

var Fields = module.exports.Fields = {
  "offers" : [ { type : String } ],
  "campaigns" : [ { type : String } ],
  "id" : {type : String, index : true},
  "signed_up" : { type : Boolean, 'default' : false },
  "about" : String,
  "bio" : String,
  "birthday" : String,
  "created_at" : { type : Date, 'default' : Date.now },
  "email" : String,
  "first_name" : String,
  "middle_name" : String,
  "last_name" : String,
  "friends" : Array,
  "gender" : String,
  "hometown" : {
    "id" : String,
    "name" : String
  },
  "last_login" : { type : Date, 'default' : Date.now },
  "link" : String,
  "locale" : String,
  "location" : {
    "id" : String,
    "name" : String,
    "loc" : { type : Array, index : '2d'}
  },
  "political" : String,
  "quotes" : String,
  "religion" : String,
  "timezone" : Number,
  "updated_time" : { type : Date, 'default' : Date.now },
  "updating" : { type : Boolean, 'default' : false },
  "username" : String,
  "verified" : Boolean,
  "work" : [
    {
      "employer" : {
        "id" : String,
        "name" : String
      },
      "location" : {
        "id" : String,
        "name" : String
      },
      "position" : {
        "id" : String,
        "name" : String
      },
      "start_date" : String
    }
  ]
};

var User = module.exports.Schema = new Schema(Fields);

// Getters and Setters
// -------------------


// Middleware
// ----------

User.pre('save',function(next){
  // Preprocess
  next();
});