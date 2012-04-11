({
  appDir : "../../../../../client",
  baseUrl : "js",
  dir : "../../../../../public",
  optimize : "uglify",
  paths : {
    "jquery" : "node_modules/urza/client/js/external/require-jquery.js",
    "amplify" : "node_modules/urza/client/js/external/amplify.js",
    "app" : "node_modules/urza/client/js/external/app.js",
    "View" : "node_modules/urza/client/js/lib/view.js"
  },
  modules : [
    {
      name : "client",
      exclude: []
    }
  ]
})