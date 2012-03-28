define(['jquery','lib/view'],function($,View){
  var addMessage = new View('addMessage');
  
  addMessage.on('click .sendIt',function(e){
    var data = addMessage.get('data'),
        groupName = $("#groupName").val(),
        next = _.bind(function(){
          this.navigate('/giftConfirmation/'+data.givenGiftId);
        },this);
    if(groupName){
    var members = _.map(data.friends,function(u){ return u._id; }),
        groupData = {
          groupName : groupName, 
          members : members,
          givenGift : data.givenGiftId
        };
      $.post('/api/groups/addGroup',groupData,_.bind(function(response){
        next();
      },this));
    } else {
      next();
    }
  });
  
  addMessage.render(function(){
    
  });
  
  return addMessage;
});
