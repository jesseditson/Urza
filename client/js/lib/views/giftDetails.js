define(['jquery','lib/view'],function($,View){
  var giftDetails = new View('giftDetails');

  // Submit gift
  giftDetails.on('click .giftIt',function(e){
    var button = $(e.currentTarget),
      campaignDetails = $('#campaignGiftDetails'),
      invite =  $("#invite").is(':checked'),
      givenGift = {
        giftId: button.attr('data-giftid'),
        receiverId: button.attr('data-userid'),
        giftMessage:$('#giftMessage').val(),
        giftAddedValue:$('#giftAddedValue').html(),
        freeValue:($('#freeValue').length) ? $('#freeValue').html() : 0,
        giftDeliveryTime:$('#giftDeliveryTime').val() || false,
        campaignId: campaignDetails.length ? campaignDetails.attr('data-campaignId') : false,
      },
      givenId = $("#customizeGift").attr('data-givenid');
    if(givenId) givenGift.givenId = givenId;
    $.ajax({
      type: 'POST', 
      url:"/api/givenGifts/save",
      data:givenGift,
      success: _.bind(function(resp){
        var page = invite ? 'chooseGroup' : 'giftConfirmation';
        this.navigate('/' + page +'/'+resp._id);
      },this)
    });
  });
  
  // Add remove value buttons + / -
  giftDetails.on('mousedown #addValue, #removeValue',function(e){
    var currentTotal = $("#totalValue").html();
    var currentAdded = $("#giftAddedValue").html();
    var increment = $("#incrementBy").html();
    
    // multiply by increasing or decreasing value
    increment *= ( $(e.target).closest(".button").attr("id") =="removeValue") ? -1 : 1;
    
    // exit if decreasing and we haven't added any funds
    if (currentAdded == 0 && increment < 0) return;
  
    // update values
    var newAdded = currentAdded*1 + increment;
    $("#totalValue").html( currentTotal*1 + increment );
    $("#giftAddedValue").html( newAdded );
    
    // update button states
    if ( newAdded > 0 ) {
      $("#removeValue").removeClass("disabled");
    } else {
      $("#removeValue").addClass("disabled");
    }
  });
  
  // Show contributors overlay
  giftDetails.on('click .otherContributors', function(e){
    $("#contributorsOverlay").show();
  });
  giftDetails.on('click #contributorsOverlay',function(e){
    $("#contributorsOverlay").hide();
  });
  
  giftDetails.render(function(){
    // do logic
  });

  return giftDetails;
});  
