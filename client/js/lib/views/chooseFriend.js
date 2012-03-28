define(['jquery','lib/view','lib/modules/autoFilter'],function($,View,AutoFilter){
  var chooseFriend = new View('chooseFriend');

  chooseFriend.on('click .friend',function(e){
    var friendId = $(e.target).closest("div[data-userid]").attr("data-userid");
    this.navigate('/chooseGift/'+friendId);
  })
  
  var autoFilter;
  
  chooseFriend.render(function(){
    // nada
  });
  chooseFriend.postRender(function(){
    autoFilter = new AutoFilter({
      element : "#friendSearch",
      selector : "#allFriends .friend",
      filter : function(item,search){
        var string = $(item).find('.info').html(),
            r = new RegExp(search,'i');
        return r.test(string);
      },
      done : function(){
        // nothing yet
      }
    });
  })
  
  return chooseFriend;
});
