#Urza
<<<<<<< Local Changes
####Urza is a node.js framework for rapid, modular development.

=======
####Urza is a node.js framework for rapid, modular development.

Urza stands on the shoulders of giants, and tries to take as much of the early-stage development out of building a site as possible.

I created Urza because I had a few too many projects, and wanted a unified framework to share between them. I wanted to be able to change out the underlying components, but access them in the same way. I wanted to be able to respond to a major pivot without losing much code. I wanted my client side code to be modular, and still be able to work with SEO, and I wanted to be able to spin up a new site without duplicating pieces of 10 other projects.

###Basic usage of Urza:

To get things going quickly, Urza can create you a mostly client-side site very quickly. It will take care of the difficult stuff like gzipping, minification, and cluster when you put it in production mode. (more on that later.)

To get started, install [node](http://www.nodejs.org), then install Urza via the wonderful [npm](http://npmjs.org):

    npm install -g urza

You'll want this to be global, but Urza is both a local and a global dependency. The global dependency does all the scripty magic, the local one actually runs your site. Urza will list itself as a dependency for projects it creates, which is necessary. You'll want those sites to work on servers later.

Next, create a site:

    urza create myApp

This will create an Urza app called 'myApp' in the local directory.

Urza will ask you a few things about the app you're creating, then create some basic structure for you to build with.

To run your app, do this:

    $ cd myApp
    $ node server.js

By default, Urza apps listen on port 8080. You can change this in the `config/default.json` file, or override it with a `config/runtime.json` file. If you haven't figured it out yet, Urza uses a module called [node-config](https://github.com/lorenwest/node-config) to load it's config files, so you can do anything you can do with node-config files to the Urza ones. For instance, feel free to use YAML if json isn't your speed.>>>>>>> External Changes
