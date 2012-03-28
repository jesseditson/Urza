require([
  'jquery',
  'lib/router',
  'lib/modules/badge',
  'lib/views/main',
  'lib/views/chooseFriend',
  'lib/views/chooseGift',
  'lib/views/giftDetails',
  'lib/views/giftConfirmation',
  'lib/views/myGifts',
  'lib/views/myAccount',
  'lib/views/chooseCampaignReciever',
  'lib/views/chooseGroup',
  'lib/views/addMessage'
],function($,Router,
    Badge,
    mainView,
    chooseFriend,
    chooseGift,
    giftDetails,
    giftConfirmation,
    myGifts,
    myAccount,
    chooseCampaignReciever,
    chooseGroupView,
    addMessageView
  ){
  var app = new Router(),
      reservedRoutes = ['access_code'];
  
  // Set up my gifts badge
  var myGiftsBadge = new Badge({
    "element" : '.headerLink[href="/myGifts"]',
    "endpoint" : '/api/user/countGifts',
    "interval" : 15000
  });
  
  // Main page route
  mainView.router = app;
  app.route('*path','main',function(path){
    if(path){
      // TODO: add 404 or similar.
      console.warn('unknown route '+path);
    }
    if(_.indexOf(reservedRoutes,path) == -1){
      mainView.show();
    } else {
      // this route has been reserved for other things.
      console.warn('reserved route '+path);
    }
  })
  
  // Choose Friend Route
  chooseFriend.router = app;
  app.route('chooseFriend','chooseFriend',function(){
    chooseFriend.show();
  });

  // Choose Gift  Route
  chooseGift.router = app;
  app.route('chooseGift/:userid','chooseGift',function(userid){
    chooseGift.show({userid:userid});
  });

  // Details of giving a gift
  giftDetails.router = app;
  app.route('giftDetails/:userid/:giftid','giftDetails',function(userid, giftid){
    giftDetails.show({userid:userid, giftid:giftid});
  });
  app.route('giftDetails/:userid/:giftid/:campaignid','giftDetails',function(userid, giftid, campaignId){
    giftDetails.show({userid:userid, giftid:giftid, campaignId:campaignId});
  });

  // Confirm on giving a gift
  giftConfirmation.router = app;
  app.route('giftConfirmation/:givenGiftId','giftConfirmation',function(givenGiftId){
    giftConfirmation.show({ givenGiftId:givenGiftId });
  });
  // Choose group of friends
  chooseGroupView.router = app;
  app.route('chooseGroup/:givenGiftId','giftConfirmation',function(givenGiftId){
    chooseGroupView.show({ givenGiftId:givenGiftId });
  });
  // Add Message view.
  addMessageView.router = app;
  app.route('addMessage/:givenGiftId','addMessage',function(givenGiftId){
    $.post('/api/givenGifts/invitedUsers/'+givenGiftId,function(response){
      addMessageView.show({ receiver : response.receiver, friends: response.friends, givenGiftId:givenGiftId});
    });
  });

  // MyGifts Route
  myGifts.router = app;
  app.route('myGifts','myGifts',function(){
    myGifts.show({},function(){
      myGiftsBadge.update();
    });
  });

  // MyAccount Route
  myAccount.router = app;
  app.route('myAccount','myAccount',function(){
    myAccount.show();
  });

  // ChooseCampaignReciever Route
  chooseCampaignReciever.router = app;
  app.route('chooseCampaignReciever/:campaignId/:giftId','chooseCampaignReciever',function(campaignId,giftId){
    chooseCampaignReciever.show({campaignId:campaignId,giftId:giftId});
  });

  app.start();
});