define(['jquery','lib/view'],function($,View){
  var myGifts = new View('myGifts');
  
  myGifts.postRender(function(){
    var ids = [];
    $("#myGifts").find('.info[data-id]').each(function(){
      ids.push($(this).attr('data-id'));
    })
    
    // Commenting out for now until we have a scheme for new gifts vs. outstanding unredeemed gifts
    //$.post('/api/user/viewGifts',{'gifts' : ids},function(){
      // marked as read.
      //});
  });
  
  return myGifts;
});
