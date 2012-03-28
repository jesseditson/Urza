define(['jquery'],function($){
  // AutoFilter
  // makes an input filter divs based on a method.
  var AutoFilter = function(options){
    // filter source element
    this.element = $(options.element);
    // selector to filter
    this.selector = options.selector || "ul li";
    // call this method every time the completer finishes filtering.
    this.done = options.done || function(){};
    // filter
    this.filter = options.filter || function(item,search){
        var r = new RegExp(search,"ig");
        return r.test($(item).html());
      };
    this.initialize();
  }
  // refresh - refreshes the target elements. These being cached sometimes might not be what the use case calls for.
  AutoFilter.prototype.refresh = function(){
    this.searchElements = $(this.selector);
  }
  // set it up
  AutoFilter.prototype.initialize = function(){
    this.refresh();
    this.element.on('keyup',_.bind(this.search,this));
  }
  // search
  AutoFilter.prototype.search = function(e){
    var search = $(e.currentTarget).val();
    this.searchElements.hide().filter(_.bind(function(index,item){
      return !!this.filter.call(this,item,search);
    },this)).show();
    this.done();
  }
  return AutoFilter;
});