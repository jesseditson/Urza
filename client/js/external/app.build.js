({
  appDir : "../../../../../client",
  baseUrl : "js",
  dir : "../../../../../public",
  optimize : "uglify",
  paths : {
    "jquery" : "../../node_modules/urza/client/js/external/require-jquery",
    "external/amplify" : "../../node_modules/urza/client/js/external/amplify",
    "external/app" : "../../node_modules/urza/client/js/external/app",
    "lib/router" : "../../node_modules/urza/client/js/lib/router",
    "lib/view" : "../../node_modules/urza/client/js/lib/view",
    "external/require-backbone" : "../../node_modules/urza/client/js/external/require-backbone"
  },
  modules : [
    {
      name : "client",
      exclude: ['jquery']
    }
  ]
})