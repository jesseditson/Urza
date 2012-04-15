// Dependencies
// ------------

// set up config dir so tests will use the config fixture.
process.env['NODE_CONFIG_DIR'] = __dirname + '/../fixtures/config';

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
    }
  }
}).export(module);
