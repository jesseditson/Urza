
// set up config dir so tests will use the config fixture.
process.env['NODE_CONFIG_DIR'] = __dirname + '/../fixtures/config';

// Dependencies
// ------------

var path = require('path'),
  	exec = require('child_process').exec,
    vows = require('vows'),
    config = require('config'),
    assert = require('assert'),
    _ = require('underscore'),
    MongoDB = require('../../lib/mongodb.js');

// Local Variables & Helpers
// -------------------------

var helpers = require('../fixtures/helpers.js');

// MongoDB Tests
// -------------
vows.describe('MongoDB Module').addBatch({
  'A MongoDB Module' : {
    topic: function(){
      var mongo = new MongoDB(config);
      exec('mongorestore --drop test/fixtures/test_db/test',function(err,stderr,stdout){
        this.callback(null,mongo);
      }.bind(this));
    },
    'autoloads schemas from the fixtures path' : function(mongo){
      assert(mongo.models['User']);
      assert.equal(mongo.collections['users'],'User');
    },
    'decorates loaded models with findAndModify' : function(mongo){
      assert.equal(typeof mongo.models[mongo.collections['users']].findAndModify,'function');
    },
    'when trying to get a user by Quinn Wilhelmi Reilly\'s ID' : {
      topic:function(mongo){
        mongo.findById('users',"4f4ed63f571c15cdd331ef0d",this.callback); // Quinn Wilhelmi Reilly's ID
      },
      'calls back with Quinn Wilhelmi Reilly' : function(err,user){
        assert.isNull(err);
        assert.equal(user.name,"Quinn Wilhelmi Reilly");
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
    'when trying to find users with last name "Ditson"' : {
      topic : function(mongo){
        mongo.find('users',{"last_name": "Ditson"},this.callback);
      },
      'calls back with an array of 6 users' : function(err,users){
        assert.isNull(err);
        assert.isArray(users);
        assert.equal(users.length,6);
      }
    },
    'when trying to find with an array of 2 _ids' : {
      topic : function(mongo){
        mongo.findByIds('users',["4f4ed63f571c15cdd331ef0d","4f4ed63e571c15cdd331ef0c"],this.callback);
      },
      'calls back with an array of 2 users' : function(err,users){
        assert.isNull(err);
        assert.isFalse(users[0] instanceof Error);
        assert.isFalse(users[0] instanceof TypeError);
        assert.isArray(users);
        assert.equal(users.length,2);
      }
    },
    'when trying to update via ID' : {
      topic : function(mongo){
        mongo.updateById('users',"4f4ed63f571c15cdd331ef0d",{ $set : {"updateOne" : "yes"} },this.callback);
      },
      'the update reports success' : function(err,user){
        assert.isNull(err);
        assert.isFalse(user[0] instanceof Error);
        assert.isFalse(user[0] instanceof TypeError);
      },
      'and when looking up the record' : {
        topic : function(a,mongo){
          mongo.findById('users',"4f4ed63f571c15cdd331ef0d",this.callback);
        },
        'it has been updated' : function(err,user){
          assert.isNull(err);
          if(Array.isArray(user)){
            assert.isFalse(user[0] instanceof Error);
            assert.isFalse(user[0] instanceof TypeError);
          }
          assert.isObject(user);
          assert.equal(user.updateOne,"yes");
        }
      }
    },
    'when trying to update via 2 IDs' : {
      topic : function(mongo){
        mongo.updateAll('users',{_id:{$in:["4f87645b12ed3b480cdd77df","4f87645b12ed3b480cdd77e3"]}},{$set:{"updateAll":"yes"}},this.callback);
      },
      'the update reports success' : function(err,users){
        assert.isNull(err);
        if(Array.isArray(users)){
          assert.isFalse(users[0] instanceof Error);
          assert.isFalse(users[0] instanceof TypeError);
        }
      },
      'and when querying by the updated field' : {
        topic : function(a,mongo){
          mongo.findAllByField('users',"updateAll","yes",this.callback);
        },
        'we find 2 records' : function(err,users){
          assert.isNull(err);
          assert.isArray(users);
          assert.isFalse(users[0] instanceof Error);
          assert.isFalse(users[0] instanceof TypeError);
          assert.strictEqual()
        }
      }
    },
    'when trying to delete by ID' : {
      topic : function(mongo){
        mongo.deleteById('users',"4f87645b12ed3b480cdd77df",this.callback);
      },
      'item reports it is deleted' : function(err,result){
        assert.isNull(err);
        if(result){
          assert.isFalse(result[0] instanceof Error);
        }
      },
      'and when checking for the item' : {
        topic : function(a,mongo){
          mongo.findById('users',"4f87645b12ed3b480cdd77df",this.callback);
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
    }
  }
}).export(module);