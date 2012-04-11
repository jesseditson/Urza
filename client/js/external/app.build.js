({
  appDir : "../../../../../client",
  baseUrl : "js",
  dir : "../../../../../public",
  optimize : "none",
  paths : {
    "jquery" : "../../node_modules/urza/client/js/external/require-jquery",
    "amplify" : "../../node_modules/urza/client/js/external/amplify",
    "app" : "../../node_modules/urza/client/js/external/app",
    "Router" : "../../node_modules/urza/client/js/lib/router",
    "View" : "../../node_modules/urza/client/js/lib/view",
    "Backbone" : "../../node_modules/urza/client/js/external/require-backbone"
  },
  modules : [
    {
      name : "client",
      exclude: ['jquery']
    }
  ]
})