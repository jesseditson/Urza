// Dependencies
// ------------
var config = require('config'),
  reporter = require('../../logging/reporter.js'),
  logger = require('../../logging/logger.js'),
  // TODO: this breaks the idea of a single mongodb. Move elsewhere.
  users = new (require('../../providers/users.js'))(new (require('../../providers/mongodb.js'))(config));
  
// Authenticate Middleware
// -----------------------

var authenticate = module.exports = function(req,res,next){
  var user = req.session.user,
    auth = req.session.auth,
    access_code = req.body.access_code || req.session.access_code,
    done = function(status){
      req.authenticated = status;
      next();
    }
  if(user){
		// already logged in
		users.refresh(user,function(err,result){
			if(!err) req.session.user = result;
			done(true);
		});
  } else if(access_code || req.cookies.fb_ref){
    if(auth){
			// in with a facebook send reference or access code and registering
			// create the facebook user.
			users.createFacebookUser(auth.facebook, req.session.facebookInvite, function(error, fbuser, failMsg) {
              if(fbuser._id){
  				users.setLastLogin(fbuser._id, function(error){});
  				req.session.user = fbuser;
  				done(true);
              } else {
                done(false);
              }
			},function(){
        // TODO: inform the client that the server has updated the user.
			  logger.debug("user updated");
			});
    } else {
			// got in via access code or facebook send link but not yet logged in
      req.session.access_code = access_code;
      if(access_code==config.access_code){
  			done(true);
      } else {
        done(false);
      }
		}
	} else if (auth) {
		    // facebook login from public page or from within private pages
			users.loginFacebookUser(auth.facebook, function(error, fbuser){
				if (fbuser) {
					// does user already exists then login
					reporter.event("userLogin",{user:fbuser._id.toString(), user_name:fbuser.first_name + " " + fbuser.last_name});
					users.setLastLogin(fbuser._id, function(error){});
					req.session.user = fbuser;
					done(true);
				} else {
					// logged in via facebook, but was not invited and didn't have access code.
					// TODO: implement waiting list functionality
					done(false);
				}
			});
	} else {
		// user is not logged in.
		done(false);
	}
}