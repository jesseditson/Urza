// Dependencies
// ------------

// set up config dir so tests will use the config fixture.
process.env.NODE_CONFIG_DIR = __dirname + '/../fixtures/config';

var vows = require('vows'),
    exec = require('child_process').exec,
    assert = require('assert'),
    Providers = require('../../lib/providers.js');

// Local Variables & Helpers
// -------------------------

var helpers = require('../fixtures/helpers.js');

// Providers Tests
// -------------
vows.describe('Providers Module').addBatch({
  'The Providers Module' : {
    topic:function(){
      exec('mongorestore --drop test/fixtures/test_db/test',function(err,stderr,stdout){
        var providers = new Providers({providerdir : __dirname + '/../fixtures/providers' },function(err){
          this.callback(null,providers);
        }.bind(this));
      }.bind(this));
    },
    'calls back when it\'s ready' : function(providers){
      assert(providers);
    },
    'autoloads providers from passed providerdir' : function(providers){
      assert(!!providers.users);
    },
    'when calling method on users provider' : {
      topic : function(providers){
        providers.users.updateAndReturn("4f4ed63f571c15cdd331ef0d",{"updated":true},this.callback);
      },
      'it was successful' : function(err,user){
        assert.isNull(err);
        assert.isFalse(user[0] instanceof Error);
        assert.isFalse(user[0] instanceof TypeError);
        assert.isObject(user);
        assert(user.updated);
      }
    },
    'when calling an overriden method on users provider' : {
      topic : function(providers){
        providers.users.create({id:"test","foo":"bar","old":"yes"},this.callback);
      },
      'it calls the new method' : function(err,user){
        assert.isNull(err);
        assert.isFalse(user[0] instanceof Error);
        assert.isFalse(user[0] instanceof TypeError);
        assert.isObject(user);
        assert.equal(user.id,'test');
      },
      'and when upserting on that id' : {
        topic : function(a,providers){
          providers.users.create({id:"test","foo":"bar","old":"no"},this.callback);
        },
        'it has updated the field' : function(err,user){
          assert.isNull(err);
          assert.isFalse(user[0] instanceof Error);
          assert.isFalse(user[0] instanceof TypeError);
          assert.isObject(user);
          assert.equal(user.old,'no');
        },
        'and when looking up by a common field' : {
          topic : function(a,b,providers){
            providers.users.findAllByField('foo','bar',this.callback);
          },
          'it has not created a new record' : function(err,users){
            assert.isNull(err);
            assert.isFalse(users[0] instanceof Error);
            assert.isFalse(users[0] instanceof TypeError);
            assert.isArray(users);
            assert.equal(users.length,1);
          },
          'and it does not return the foo field because it is not in the defaultFields.' : function(err,users){
            assert.isNull(err);
            assert.isFalse(users[0] instanceof Error);
            assert.isFalse(users[0] instanceof TypeError);
            assert.isArray(users);
            assert.isUndefined(users[0].foo);
          },
          'but if asked for' : {
            topic:function(a,b,c,providers){
              providers.users.findAllByField('foo','bar',['foo'],this.callback);
            },
            'it does return the field' : function(err,users){
              assert.isNull(err);
              assert.isFalse(users[0] instanceof Error);
              assert.isFalse(users[0] instanceof TypeError);
              assert.isArray(users);
              assert(users[0].foo);
            },
            'it returns no other fields except the id' : function(err,users){
              assert.isNull(err);
              assert.isFalse(users[0] instanceof Error);
              assert.isFalse(users[0] instanceof TypeError);
              assert.isArray(users);
              assert.isUndefined(users[0].id);
              assert(users[0]._id);
            }
          }
        }
      }
    }
  }
})['export'](module);
