// Dependencies
// ------------

// **User Routes**
// routes to manipulate users.
var User = module.exports = {
  'default' : function(session,body,callback){
    callback(null,"done");
  },
  'something' : function(session,body,callback){
    callback(null,"HELLO");
  }
}