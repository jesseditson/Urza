define(['jquery'],function($){
  // StickyScroll 
  // ------------
  // constrains an element from scrolling above or below certain elements.
  
  var StickyScroll = function(options){
    // the element to constrain
    this.element = $(options.element);
    // the element to stick to. Item will stick to this element when scrolling up.
    // optional - this will default to the top of the page or closest positioned element.
    this.stick = $(options.stick || 'header');
    // top item - the child of element that will never be scrolled past.
    this.topItem = this.element.find(options.topItem || '*').first();
    // set it up
    this.initialize();
  }
  
  // remove - removes stickyscroll, restores element status before it existed.
  StickyScroll.prototype.remove = function(){
    $(window).unbind('scroll',_.bind(this.scroll,this));
    this.element.removeAttr('style');//.attr('style',this.restoreCss.element);
    this.element.offsetParent().removeAttr('style');//.attr('style',this.restoreCss.parent);
  }
  
  StickyScroll.prototype.initialize = function(){
    this.restoreCss = {
      element : this.element.attr('style'),
      parent : this.element.offsetParent().attr('style')
    }
    this.offset = this.stick.offset().top;
    this.stuck = false;
    // space out siblings to account for fixed/absolute positioning.
    // makes some assumptions about layout. May need help.
    this.scroll();
    $(window).scroll(_.bind(this.scroll,this));
  }
  
  // reflow - updates the offset parent content, call this when the stickyscroll content changes size to push content below it (or pull it up to it.)
  StickyScroll.prototype.reflow = function(){
    var parent = this.element.offsetParent(),
        parentTop = isNaN(parseInt(parentTop)) ? 0 : parseInt(parentTop),
        prevOffset = this.reverseOffset || 0;
    this.reverseOffset = parentTop + this.offset + this.element.height() + this.stick.height();
    var offsetDifference = prevOffset - this.reverseOffset;
    if(prevOffset != this.reverseOffset){
      window.scroll(0,$(window).scrollTop() - offsetDifference);
      parent.css({'top' : this.reverseOffset + 'px'});
    }
  }
  
  // scroll - triggered whenever the screen is scrolled.
  StickyScroll.prototype.scroll = function(){
    var currentScroll = $(window).scrollTop(),
        fixedPos = this.topItem.position().top,
        maxScroll = fixedPos + this.offset;
    this.resetPos = this.offset + this.stick.height() - fixedPos;
    this.stuck = currentScroll >= maxScroll;
    this.reflow();
    if(this.stuck){
      this.element.css({
        position: 'fixed',
        top : this.resetPos + 'px',
        width: this.element.width()
      })
    } else {
      this.element.css({
        position:'absolute',
        top:(this.offset - this.reverseOffset) + 'px'
      })
    }
  }
  
  return StickyScroll;
});