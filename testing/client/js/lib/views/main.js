define(['jquery','lib/view'],function($,View){
  var main = new View('main');
  
  main.on('click .user',function(e){
    var friendId = $(e.target).closest(".user").attr("data-userid");
    this.navigate('/chooseGift/'+friendId);
  })
  
  main.on('click .event',function(e){
    var friendId = $(e.target).closest(".event").attr("data-userid");
    this.navigate('/chooseGift/'+friendId);
  })
  
  main.on('click .someoneSpecific',function(e){
    this.navigate('/chooseFriend');
  })
  
  main.on('click .reloadJustBecause', function(e){
    main.renderPartial('justBecause');
  })
  
  main.on('click .campaign', function(e){
    var campaignId = $(e.target).closest("div[data-campaignid]").attr("data-campaignid");
    var giftId = $(e.target).closest("div[data-giftId]").attr("data-giftId");
    this.navigate('/chooseCampaignReciever/'+campaignId+'/'+giftId);
  });
  
  main.render(function(){
    // do main logic
  });
  
  return main;
});