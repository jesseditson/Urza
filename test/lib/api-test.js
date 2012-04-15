// Dependencies
// ------------

// set up config dir so tests will use the config fixture.
process.env['NODE_CONFIG_DIR'] = __dirname + '/../fixtures/config';

var vows = require('vows'),
    assert = require('assert'),
    Api = require('../../lib/api.js');

// Local Variables & Helpers
// -------------------------

var helpers = require('../fixtures/helpers.js');

// Api Tests
// -------------
vows.describe('Api Module').addBatch({
  'The Api Module' : {
    topic:function(){
      var api = new Api({apidir : __dirname + "/../fixtures/api"});
      this.callback(null,api);
    },
    'with a readycallback' : {
      topic : function(api){
        if(!api.ready){
          api.readycallback = this.callback.bind(this,null);
        } else {
          this.callback(null,api);
        }
      },
      'calls the callback when ready or if it is already ready' : function(api){
        assert(api.ready);
      },
      'api endpoints from the apidir have been autoloaded' : function(api){
        assert.isObject(api.endpoints.user);
      },
      'when calling a route from a loaded endpoint' : {
        topic : function(api){
          api.route(['user','something'],{},{},this.callback);
        },
        'the route returns what we expected' : function(data){
          assert.strictEqual(data,'HELLO');
        }
      }
    }
  }
}).export(module);