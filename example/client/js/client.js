require([
  'jquery',
  'external/app'
],function($,app){
  // this is only loaded once, from here on out it's push state.
  var reservedRoutes = ['noRender'];
  
  // This is where you can put routes.
  // Your views are available on app - since each app must define a main route, it's already available.
  // You can override the app's routes by overriding app['viewName'].route, like this:
  app.views.main.route = function(path){
    // set up the main catchall route and point it to the 'main' template.
    // the path argument comes from what is defined when you created the view. (in this case it defaults to '*path'.)
    // You can look at the viewObject in client/js/external/app.js for a reminder.
    
    // this will be hit if none of the other routes match.
    if(path){
      // TODO: add 404 or similar.
      console.warn('unknown route '+path);
    }
    // you can add conditions before rendering, show() is not implicit on all routes.
    // for instance you can check to see if this path exists in an array and skip it if it does.
    if(~_.indexOf(reservedRoutes,path)){
      // this route has been reserved for other things (like a server-side only route).
      console.warn('reserved route '+path);
    } else {
      // this is now the view. to show the view, just call it's show() method.
      this.show({message:'hello world'});
    }
  }
  // This line will fire off the first navigation and start the app.
  app.start();
});