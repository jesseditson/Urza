define(['jquery','lib/view'],function($,View){
  var chooseGift = new View('chooseGift');
  
  chooseGift.on('click .gift:not(.unavailable)',function(e){
    var giftId = $(e.target).closest(".gift").attr("data-giftid");
    var friendId = $(e.target).closest(".sectionBody").attr("data-userid");
    this.navigate('/giftDetails/'+friendId+'/'+giftId);
  })

  chooseGift.on('click .campaign',function(e){
    var giftId = $(e.target).closest("div[data-giftid]").attr("data-giftid"),
        friendId = $(e.target).closest("div[data-userid]").attr("data-userid"),
        campaignId = $(e.target).closest("div[data-campaignid]").attr("data-campaignid");
    this.navigate('/giftDetails/'+friendId+'/'+giftId+'/'+campaignId);
  })
  
  chooseGift.render(function(){
    // do logic
  });
  
  return chooseGift;
});
