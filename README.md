#Urza
####Urza is a node.js framework for rapid, modular development.

Urza stands on the shoulders of giants, and tries to take as much of the early-stage development out of building a site as possible.

I created Urza because I had a few too many projects, and wanted a unified framework to share between them. I wanted to be able to change out the underlying components, but access them in the same way. I wanted to be able to respond to a major pivot without losing much code. I wanted my client side code to be modular, and still be able to work with SEO, and I wanted to be able to spin up a new site without duplicating pieces of 10 other projects.

**Note that Urza is still in [EXPERIMENTAL] mode, and only should be used by the daring. The API will change quite a bit before it is ready for production use - that said, it is used in active development of a few projects, and so should be relatively stable.**

===

###Basic usage of Urza:

To get things going quickly, Urza can create you a mostly client-side site very quickly. It will take care of the difficult stuff like gzipping, minification, and cluster when you put it in production mode. (more on that later.)

To get started, install [node](http://www.nodejs.org), then install Urza via the wonderful [npm](http://npmjs.org):

    npm install -g urza

You'll want this to be global, but Urza is both a local and a global dependency. The global dependency does all the scripty magic, the local one actually runs your site. Urza will list itself as a dependency for projects it creates, which is necessary. You'll want those sites to work on servers later.

Next, create a site:

    urza init myApp

This will create an Urza app called 'myApp' in the local directory.

Urza will ask you a few things about the app you're creating, then create some basic structure for you to build with.

To run your app, do this:

    $ cd myApp
    $ node server.js

By default, Urza apps listen on port 8080. You can change this in the `config/default.json` file, or override it with a `config/runtime.json` file. If you haven't figured it out yet, Urza uses a module called [node-config](https://github.com/lorenwest/node-config) to load it's config files, so you can do anything you can do with node-config files to the Urza ones. For instance, feel free to use YAML if json isn't your speed.

===

###Developing with Urza:

Once you have a boilerplate site up, you'll notice that the while the basics have been taken care of, you don't have much to look at yet.

To get started creating an application, you'll want to be familiar with the basic paradigms Urza uses for the view and data layer.

Here's the basics of an Urza application:

####Data:
---
There will be zero or more data types. These are basically Models, they have an underlying schema and database layer. The model is currently a Mongoose Schema, but will be refactored to support more data layers (specifically couchdb). I'm still deciding how much enforcement is necessary at this layer, so expect the schema spec to change.

Each data type has a **schema**. This allows for typing stored data, and validation methods. Here is an example of a Schema:

	var person = module.exports.Schema = new Schema({
	  name : { type : "String", default : ""},
	  pets : [String]
	});

Each schema has a **provider**. The provider exposes data-access methods. All providers inherit from a main provider, which provides common methods like **all**, **create**, or **update** full documentation of providers can be found here.

Here is an example of a provider.

	var Person = function(db){
		this.db = db;
	}
	Person.prototype.randomPet = function(id,callback){
		this.find({_id : id},{pets:1},function(err,person){
			if(err || !person.pets.length){
				callback(err);
			} else {
				var randomPet = person.pets[Math.floor(Math.random()*person.pets.length)];
				callback(null,randomPet);
			}
		});
	}


Every time dynamic data is retreived from Urza, it is done via an api call.

Urza's api is created by using objects, so there is a different endpoint for every action. Each endpoint can either be a deep object, or a function. If it is a function, it can be called with additional arguments by adding them between slashes. A 'default' method can be added to deep endpoints to allow it to be called without additional arguments.

Here is an example to make that more clear:

	var Person = module.exports = {
		default : function(session,body,callback){
			callback(null,"/api/person called.");
		}
		get : {
			pets : function(session,body,callback,special){
				if(special){
					callback(null,"/api/person/get/pets/"+special+" called.");
				} else {
					callback(null,"/api/person/get/pets called.");
				}
			},
			randomPet : function(session,body,callback,id){
				if(!id){
					callback(new Error("id not provided!"));
				} else {
					this.providers.person.randomPet(id,callback);
				}
			}
		}
	}

There are a few things not that the above example should make clear, but are worth going over:

- each method is passed the following arguments: `session`,`body`, and `callback`. The session is the current user session if it exists. The body is the body of a `post` if present. Callback will dispatch a json response to the request - if an error is returned, it will return the message of the error with a 503 header.

- objects can be arbitrarially deep, new endpoints will answer as deep as you want. You can also just tack on endpoints outside of the object literal using `Person.endpoint = function(){}` outside of the block. It's just a simple object. You can also add as many arguments as you want to any endpoint except the 'default' one.

- each api method is called in context of an internal api class, so you have access to `this.providers` - this allows you to look up info from any of your providers inside of these api calls.

####Views & Partials:
---

#####Creating views:

All views in Urza are parsed on the server, and rendered on the client. This allows the use of DOM manipulation in views, but also maintains the speed of rendering on the server, and has long-term SEO implications (that have yet to be implemented).

Each View usually has 2 files: a template file, and a js file. A js file is mandatory, but templates can be shared betweeen views, or js files could even just manipulate the DOM - however, this will break SEO, so definitely isn't recommended.

All views are rendered via push state, so every Urza app is a single page app as far as the browser is concerned, although your apps may behave more like a multiple-page app.

Out of the box, Urza supports multiple platforms. These are detected via the user agent, and allow you to create separate layouts for each platform. (Right now these platforms are just 'web' and 'mobile'. In the future this will be a configurable option.)

When creating a view or partial, an html file will be added to each of these platform view folders. (`client/views/<platform>/<viewname>`.)

To add a new view, just run:

    urza create view <viewname>
    
This will generate a js file and an html file with the view name, along with adding a route for the view. You can now navigate to `http://yourapp.com/viewname"`.

To create a more complicated route, you can create a view with name and a route:

    urza create view --route "/:someparam/:paramname/*splat" <viewname>

This will expose the route: `http://yourapp.com/viewname/someparam/anotherparam/stuff/stuff/stuff`. These currently conform to backbone routes (but will probably use [director](https://github.com/flatiron/director) routes in the future).

To omit the html file and just set up the route, add the `--raw` flag (maybe needs to be renamed?)

    urza create view --route ":option/:anotheroption --raw <viewname>

This will skip creating the blank html file.

#####Partial overview:

View partials are a way to load dynamic content without changing the history state. They also render on the server, using an api endpoint. You can augment the api data (if any) with an object should you choose.

Partials are automatically detected by the view, so adding a partial to a view is as easy as adding an item with a `data-partial`  and a `data-url` attribute. Here is an example of a partial:

    <div id="myPartial" data-partial="mypartial" data-url="some/api/endpoint">
      <div class="loading">This content will be replaced when the partial loads.</div>
    </div>
    
If you want to inject data from the view to the partial, you can add an optional `data-obj` attribute to the partial:

	<div id="myPartial" data-partial="mypartial" data-url="some/api/endpoint" data-obj='{"something":"somevalue"}'></div>

Creating partials is as simple as just adding the file to the `partials` folder inside the `views/<platform>` folders. However, to keep the workflow familiar, you can auto generate partials using:

	urza create partial <partialname>

This will create a partial in both the `web` and `mobile` platform folders.

#####Data in views and partials:

In both views and partials, the object passed to the template will have a `data` key that contains the data passed. The main difference between views and partials is that a view is passed data by the router, whereas a partial is tied to an api endpoint (although you can pass it data using the `data-obj` attribute as well).

####Client-Side Routing:

all routing is handled by the `client.js` file, located at: `client/js/client.js`.

Routes are triggered via push state, and will (by default) call the route method when routed to.

Each view will automatically answer to a route by calling it's own `show()` method. For instance, if we run `urza create view foo`, we can now navigate to `http://appurl/foo`, and the `foo.html` file will replace the content of the `#content` div. You don't have to add a route for this, but if you'd like to inject data or do other fancy stuff (conditional navigation, etc), you can add a route for your view.

`client.js` contains some boilerplate code that you can remove, and replace with your own routes. Views are available on the app.views object - using the above example again, you can add a route for `foo` by setting `app.views.foo.router` to a function - for instance:

	app.views.foo.route = function(){
	  this.show({key:'value'});
	}

when in the function, `this` is the view, so you can call any of the view methods from there.

After you have overridden any routes you'd like to use, you'll want to start the app to trigger the current route and listen for more routes.

make sure that the last line in `client.js` is:

	app.start();

####View Hooks & Methods:

All views expose various methods for interacting or responding to them - here's an overview:

- `view.render(<function>)`:
	- Pass this method a function to trigger when a view has started to draw. All elements in the view template will be available on the DOM, but partials are not available yet.
- `view.postRender(<function>)`:
	- The passed function is triggered after the view has completely finished rendering - you can access partials and stuff here.
- `view.get(<keyname>) and view.set(<keyname>,<value>)`
	- arbitrary key/value store on the view. Good for passing data around on views. Note that the main use for this is to access the `data` key passed when data is set on a view. For instance - if you call `view.show({foo:'bar'})`, you can then access the foo key using `view.get('data').foo`
- `view.on(<eventString>,<function>)`
	- this is basically a wrapper for backbone's `on` method - this will allow you to bind events to the view. Not sure if this is staying in long-term.
- `view.transitionIn and view.transitionOut`
	- these methods can be overriden to add transitions to views. They must be overriden with a single argument of `callback`, which must be called in order for the view to continue rendering.
- `view.showLoading and view.hideLoading`
	- these methods can be overriden to add a loading screen between pages.
- `view.remove()`
	- this will entirely remove the view and it's events from the DOM.
- `view.renderPartial(<partialname>,<callback>)`
	- this will re-render a partial (called by name), and optionally call back when the render is complete. It will request the same api endpoint it was set up with and re-draw the partial.
- `view.show(<data>)`
	- this will begin the cycle of drawing the view. You may optionally pass in data for the view to render.

