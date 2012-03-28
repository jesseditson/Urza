// Dependencies
// ------------

var CONFIG = require('config').generalEnvironment,
	exec = require('child_process').exec,
  vows = require('vows'),
  assert = require('assert'),
  _ = require('underscore'),
  MongoDB = require('../../lib/providers/mongodb.js');

// Local Variables & Helpers
// -------------------------

var helpers = require('../fixtures/helpers.js')

var dbConfig = {
		"dbName" : "test",
		"host" : "localhost",
		"port" : 27017
	};

// MongoDB Tests
// -------------
vows.describe('MongoDB Provider').addBatch({
  'A MongoDB Class' : {
    topic: function(){
      var mongo = new MongoDB(dbConfig);
      exec('mongorestore --drop test/fixtures/test_db/test',function(err,stderr,stdout){
        this.callback(null,mongo);
      }.bind(this));
    },
    'when trying to get a user by ID' : {
      topic:function(mongo){
        mongo.findById('users',"4f4ed643571c15cdd331efc5",this.callback); // Cat Hoch's ID
      },
      'calls back with a user' : function(err,user){
        assert.isNull(err);
        assert.equal(user.name,"Cat Hoch");
        assert.isObject(user);
      }
    },
    'when trying to get all items in a users collection with a sort' : {
      topic: function(mongo){
        mongo.all('users',['_id','desc'],this.callback);
      },
      'calls back with an array of users' : function(err,users){
        assert.isNull(err);
        assert.isArray(users);
      }
    },
    'when trying to get all items in a users collection without a sort' : {
      topic: function(mongo){
        mongo.all('users',this.callback);
      },
      'calls back with an array of users' : function(err,users){
        assert.isNull(err);
        assert.isArray(users);
      }
    },
    'when trying to get the latest 5 users' : {
      topic: function(mongo){
        mongo.latest('users',5,this.callback);
      },
      'calls back with an array of 5 users' : function(err,users){
        assert.isNull(err);
        assert.isArray(users);
        assert.equal(users.length,5);
      },
      'and that array is sorted by created_at' : function(err,users){
        // sort by created date, check that it matches.
        var dateSorted = users.sort(function(a,b){
          return b.created_at - a.created_at;
        });
        assert.equal(dateSorted,users);
      }
    },
    'when trying to get all users with field zipcode == 94920' : {
      topic : function(mongo){
        mongo.allWithField("users",'zipcode',"94920",this.callback); // there are 4 users in this zipcode
      },
      'calls back with an array of 4 users' : function(err,users){
        assert.isNull(err);
        assert.isArray(users);
        assert.equal(users.length,4);
      }
    },
    'when trying to find with a mongo search object' : {
      topic : function(mongo){
        mongo.find('users',{"shipments._id": "4f3d74ab285069fb73000001"},this.callback);
      },
      'calls back with an array of 25 users' : function(err,users){
        assert.isNull(err);
        assert.isArray(users);
        assert.equal(users.length,25);
      }
    },
    'when trying to find with an array of IDs' : {
      topic : function(mongo){
        mongo.findByIds('users',["4f32fe5f6de5c10d57000001",
                                  "4f32fec802388f0057000001",
                                  "4f32ff5e6de5c10d57000003",
                                  "4f33000802388f0057000003",
                                  "4f3310d415e3464924000003",
                                  "4f331d7d3b4de47159000001",
                                  "4f3320203b4de47159000003",
                                  "4f333d7f37184f6459000001",
                                  "4f3364d93b4de47159000005",
                                  "4f341b8637184f6459000003",
                                  "4f3429fa37184f6459000005",
                                  "4f342c8b37184f6459000007",
                                  "4f342cb43b4de47159000007",
                                  "4f342d3537184f6459000009",
                                  "4f34369237184f645900000b",
                                  "4f35191237184f645900000d",
                                  "4f343e923b4de47159000009",
                                  "4f352d5d37184f645900000f",
                                  "4f353a1137184f6459000011",
                                  "4f355a5890f172dc5d000002"],this.callback);
      },
      'calls back with an array of 25 users' : function(err,users){
        assert.isNull(err);
        assert.isFalse(users[0] instanceof Error);
        assert.isArray(users);
        assert.equal(users.length,20);
      },
    },
    'when trying to update via ID' : {
      topic : function(mongo){
        mongo.updateById('users',"4f355a5890f172dc5d000002",{ $set : {"updateOne" : "yes"} },this.callback);
      },
      'successfully updates the record' : function(err,user){
        assert.isNull(err);
        assert.isFalse(user[0] instanceof Error);
        assert.isObject(user);
        assert.equal(user.updateOne,"yes");
      }
    },
    'when trying to update via multiple IDs' : {
      topic : function(mongo){
        mongo.updateAll('users',["4f32fe5f6de5c10d57000001",
                                  "4f32fec802388f0057000001",
                                  "4f32ff5e6de5c10d57000003",
                                  "4f33000802388f0057000003",
                                  "4f3310d415e3464924000003",
                                  "4f331d7d3b4de47159000001",
                                  "4f3320203b4de47159000003",
                                  "4f333d7f37184f6459000001",
                                  "4f3364d93b4de47159000005",
                                  "4f341b8637184f6459000003",
                                  "4f3429fa37184f6459000005",
                                  "4f342c8b37184f6459000007",
                                  "4f342cb43b4de47159000007",
                                  "4f342d3537184f6459000009",
                                  "4f34369237184f645900000b",
                                  "4f35191237184f645900000d",
                                  "4f343e923b4de47159000009",
                                  "4f352d5d37184f645900000f",
                                  "4f353a1137184f6459000011",
                                  "4f355a5890f172dc5d000002"],{ $set : {"updateAll":"yes"} },this.callback);
      },
      'successfully updates all records' : function(err,users){
        assert.isNull(err);
        assert.isFalse(users[0] instanceof Error);
        assert.isArray(users);
        assert.equal(users.length,20);
        users.forEach(function(u){
          assert.equal(u.updateAll,"yes");
        });
      }
    },
    'when trying to update via a find object and asking for all records' : {
      topic : function(mongo){
        mongo.update('users',{'zipcode':"94920"},{ $set : {"updateReturnAll":"yes"} },true,this.callback);
      },
      'successfully updates all records' : function(err,users){
        assert.isNull(err);
        assert.isFalse(users[0] instanceof Error);
        assert.isArray(users);
        assert.equal(users.length,4);
        users.forEach(function(u){
          assert.equal(u.updateReturnAll,"yes");
        });
      }
    },
    'when trying to update via a find object and asking for first record' : {
      topic : function(mongo){
        mongo.update('users',{'zipcode':"94920"},{ $set : {"updateReturnOne":"yes"} },false,this.callback);
      },
      'successfully updates all records' : function(err,user){
        assert.isNull(err);
        assert.isFalse(user[0] instanceof Error);
        assert.isObject(user);
        assert.equal(user.updateReturnOne,"yes");
      }
    },
    'when trying to delete by ID' : {
      topic : function(mongo){
        mongo.deleteById('users',"4f38997490f172dc5d00000a",function(err,result){
          this.callback(err,result,mongo);
        }.bind(this));
      },
      'item reports it is deleted' : function(err,result){
        assert.isNull(err);
        if(result){
          assert.isFalse(result[0] instanceof Error);
        }
      },
      'and when checking for the item' : {
        topic : function(err,result,mongo){
          mongo.findById('users',"4f38997490f172dc5d00000a",this.callback);
        },
        'it does not exist in the database' : function(err,result){
          assert.isNull(err);
          assert.isNull(result);
        }
      }
    },
    'when trying to create a user item' : {
      topic : function(mongo){
        mongo.create('users',helpers.forms.user,this.callback);
      },
      'the user was created and valid' : helpers.assertions.user
    },
    'when trying to create a product item' : {
      topic : function(mongo){
        mongo.create('products',helpers.forms.product,this.callback);
      },
      'the product was created and valid' : helpers.assertions.product
    },
    'when trying to create a shipment item' : {
      topic : function(mongo){
        mongo.create('shipments',helpers.forms.shipment,this.callback);
      },
      'the shipment was created and valid' : helpers.assertions.shipment
    },
    'when trying to create a waiting list item' : {
      topic : function(mongo){
        mongo.create('waitingList',helpers.forms.waitingList,this.callback);
      },
      'the waiting list item was created and valid' : helpers.assertions.waitingList
    },
    'when trying to create a tracking item' : {
      topic : function(mongo){
        mongo.create('tracking',helpers.forms.tracking,this.callback);
      },
      'the tracking item was created and valid' : helpers.assertions.tracking
    },
    'when validating a user item' : {
      topic : function(mongo){
        mongo.defaultObject('users',helpers.forms.user,function(val){ this.callback(null,val); }.bind(this));
      },
      'the user is valid' : helpers.assertions.user
    },
    'when validating a product item' : {
      topic : function(mongo){
        mongo.defaultObject('products',helpers.forms.product,function(val){ this.callback(null,val); }.bind(this));
      },
      'the product is valid' : helpers.assertions.product
    },
    'when validating a shipment item' : {
      topic : function(mongo){
        mongo.defaultObject('shipments',helpers.forms.shipment,function(val){ this.callback(null,val); }.bind(this));
      },
      'the shipment is valid' : helpers.assertions.shipment
    },
    'when trying to create a waiting list item' : {
      topic : function(mongo){
        mongo.defaultObject('waitingList',helpers.forms.waitingList,function(val){ this.callback(null,val); }.bind(this));
      },
      'the waiting list is valid' : helpers.assertions.waitingList
    },
    'when validating a tracking item' : {
      topic : function(mongo){
        mongo.defaultObject('tracking',helpers.forms.tracking,function(val){ this.callback(null,val); }.bind(this));
      },
      'the tracking item is valid' : helpers.assertions.tracking
    }
  }
}).export(module);