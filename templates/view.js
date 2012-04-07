define(['jquery','lib/view'],function($,View){
  var [[NAME]] = new View('[[NAME]]');
  
  [[NAME]].render(function(){
    // do [[NAME]] logic before partials render
  });
  [[NAME]].postRender(function(){
    // do [[NAME]] logic after partials have rendered
  });
  
  return [[NAME]];
});