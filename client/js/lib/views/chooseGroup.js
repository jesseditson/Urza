define(['jquery','lib/view','lib/modules/autoFilter'],function($,View,AutoFilter){
  var chooseGroup = new View('chooseGroup');
  
  // make this stuff locally accessible.
  var autoFilter;
  
  // helper methods
  var getIds = function(elements){
      return elements.map(function(){
        return $(this).attr('data-userid');
      }).toArray();
    },
    updateGroups = function(){
      // check if this is in any groups, and deselect that group if it is.
      _.each($('#searchLists .group'),function(group){
        var group = $(group),
            groupFriends = getIds(group.find('[data-userid]')),
            allSelected = _.all(groupFriends,function(id){
              return $('#allFriends').find('.selected[data-userid="'+id+'"]').length;
            });
        if(allSelected){
          group.addClass('selected');
        } else {
          group.removeClass('selected');
        }
      });
    }
  
  chooseGroup.on('click #searchLists .friend',function(e){
    var friend = $(e.currentTarget);
    friend.toggleClass('selected');
    updateGroups();
  })
  chooseGroup.on('click #searchLists .group',function(e){
    var group = $(e.currentTarget),
        groupFriends = getIds(group.find('[data-userid]')),
        listFriends = $("#searchLists .friend").filter(function(){
          return _.indexOf(groupFriends,$(this).attr('data-userid')) >= 0;
        });
    if(group.is('.selected')){
      listFriends.removeClass('selected');
    } else {
      // find users in this group that are not currently selected
      var selectedUsers = getIds($('#allFriends .selected[data-userid]'));
          addUsers = _.reject(groupFriends,function(user){
            return _.indexOf(selectedUsers,user) >= 0;
          });
      listFriends.addClass('selected');
    }
    updateGroups();
  });
  chooseGroup.on('click .done',function(e){
    // update invited people
    var givenGiftId = chooseGroup.get('data').givenGiftId,
        invited = getIds($("#allFriends .selected[data-userid]"));
    if(invited.length){
      $.post('/api/givenGifts/updateInvitees/' + givenGiftId,{
        'invitedUsers' : invited,
        'public' : !$('#private').is(':checked')
      },_.bind(function(t){
        if(t==true){
          this.navigate('/addMessage/'+givenGiftId);
        } else {
          // TODO: be graceful...
          alert('error saving list!');
        }
      },this));
    } else {
      this.navigate('/giftConfirmation/'+givenGiftId);
    }
  });
  
  chooseGroup.render(function(){
    autoFilter = new AutoFilter({
      element : "#friendSearch",
      selector : "#searchLists .friend, #searchLists .group",
      filter : function(item,search){
        var string = $(item).find('.info').html(),
            r = new RegExp(search,'i');
        return r.test(string);
      },
      done : function(){
        // nothing yet
      }
    });
  });
  // post render for stuff that happens to partial data
  chooseGroup.postRender(function(){
    autoFilter.refresh();
  });
  return chooseGroup;
});