define(['jquery'],function($){
  // Badge - creates a badge based on an api call.
  // TODO: change this to use push, not pull. Needs socket.io to work.
  var Badge = function(options){
    var options = options || {};
    if(!$(options.element).length){
      throw new Error('tried to set up badge on non-existant element' + element);
    } else {
      this.element = $(options.element);
      this.endpoint = options.endpoint;
      this.class = options.class || "badge";
      this.interval = options.interval || 15000; // default interval is 15 seconds
      this.updating = false;
      this.start();
    }
  }
  // start - makes initial call, sets up listener or timer.
  Badge.prototype.start = function(){
    this.update();
    this.updateInterval = setInterval(_.bind(function(){
      this.update();
    },this),this.interval);
  }
  // stop updating - makes badge stop updating.
  Badge.prototype.stop = function(){
    clearInterval(this.updateInterval);
  }
  // update - updates the badge based on an api call.
  Badge.prototype.update = function(){
    if(this.updating) return false;
    this.updating = true;
    $.post(this.endpoint,_.bind(function(data){
      this.updating = false;
      var num = parseInt(data);
      if(num==0){
        this.element.find('.badge').remove();
      } else if(!isNaN(num)){
        var badge = this.getBadge(num),
            badgeEl = this.element.find('.badge');
        if(!badgeEl.length){
          this.element.append(badge);
        } else {
          badgeEl.replaceWith(badge);
        }        
      } else {
        throw new Error('Badge call returned non-number value ' + data);
      }
    },this));
  }
  // getBadge - returns an element based on a number.
  Badge.prototype.getBadge = function(num){
    return '<div class="'+this.class+'">'+num+'</div>';
  }
  // return the badge class.
  return Badge;
});