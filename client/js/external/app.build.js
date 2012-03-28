({
  appDir : "../../",
  baseUrl : "js",
  dir : "../../../public/",
  optimize : "false",
  paths : {
    "jquery" : "external/require-jquery"
  },
  modules : [
    {
      name : "app",
      exclude: ['jquery']
    }
  ]
})