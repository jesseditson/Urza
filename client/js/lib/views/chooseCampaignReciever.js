define(['jquery','lib/view'],function($,View){
  var chooseCampaignReciever = new View('chooseCampaignReciever');

  chooseCampaignReciever.on('click .friend',function(e){
    var friendId = $(e.target).closest("div[data-userid]").attr("data-userid");
    var campaignId =  $(e.target).closest("div[data-campaignId]").attr('data-campaignId');
    var giftId =  $(e.target).closest("div[data-giftId]").attr('data-giftId');
    
    this.navigate('/giftDetails/'+friendId+'/'+giftId+'/'+campaignId);
  })
  
  chooseCampaignReciever.render(function(){
    // do logic
  });
  
  return chooseCampaignReciever;
});
