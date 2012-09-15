// Dependencies
// ------------
var config = require('config-heroku'),
    Server = require('urza').Server;

// If you want to use authentication, add it to the config here, or in your config file.
// Just point 'authenticate' to a js file that exports some authentication middleware:
// config.authenticate = './lib/helpers/authenticate.js'

// Local Variables
// ---------------
var server = new Server(config);

// Put your routes here.
// you can treat server similarly to express when it comes to routes.
// for instance, you can add a hello world route:
// server.get('helloWorld',function(req,res,next){
//   res.send('Hello World!');
// });


// When you have finished configuring the server, start it up:
server.start();