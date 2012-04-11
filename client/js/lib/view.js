define(['jquery','Backbone'],function($,Backbone){
  // Local Helpers
  // Render - renders partials from the server
  var render = function(partial,api,data,el,callback){
    $.ajax({
      url : '/partial/' + partial + '/' + api,
      data : data,
      type : 'post',
      success : function(res){
        $(el).html(res);
        if(callback) callback();
      }
    });
  };
  var addMethods = function(view){
    // expose the navigate function on views
    view.navigate = _.bind(function(page,replace){
      this.transitionOut(_.bind(function(){
        this.router.navigate(page, {trigger: true, replace:replace===false || false});
      },this));
    },this);
  }
  var getJSON = function(string){
    var d = {};
    try {
      d = JSON.parse(string);
    } catch(e){}
    return d;
  }
  // View class
  // mostly just a wrapper for backbone's view, obscures the annoying syntax.
  var View = function(name,obj){
    // require name
    if(!name) throw new Error('View instantiated without name. All views must be named.');
    this.name = name;
    // all views will render in this container
    this.container = '#content';
    // obj can just be a regular backbone object, or empty.
    this.obj = obj || { events : {} };
    this.attributes = {};
  }
  // accessor for post render 
  View.prototype.postRender = function(postRender){
    this.obj.postRender = postRender;
  }
  // accessor for the render method
  View.prototype.render = function(render){
    this.obj.render = render;
  }
  // setter and getter for attribute data
  View.prototype.get = function(attr){
    return this.attributes[attr];
  }
  View.prototype.set = function(attr,data){
    this.attributes[attr] = data;
  }
  // on - adds a method to an event.
  // uses same syntax as backbone's view events 
  View.prototype.on = function(ev,method){
    var newEvents = {};
    newEvents[ev] = method;
    this.obj.events = _.extend(this.obj.events,newEvents);
  }
  // **transitions**
  // in
  View.prototype.transitionIn = function(callback){
    callback();
  }
  // out
  View.prototype.transitionOut = function(callback){
    callback();
  }
  // loading handlers
  View.prototype.showLoading = function(){
    // override this to add a loading screen
  }
  View.prototype.hideLoading = function(){
    // override this to add a hide screen
  }
  // show - this starts the view.
  View.prototype.show = function(data,callback){
    data = data || {};
    // when this has been called twice (once from the post, once from the transition)
    var done = _.after(2,_.bind(function(){
      this.hideLoading();
      if(callback) callback();
      if(this.view.postRender) this.view.postRender();
    },this));
    // change UI to show that this is transitioning.
    this.transitionIn(_.bind(function(){
      this.showLoading();
      done();
    },this));
    
    $.ajax({
      url : '/view/' + this.name,
      data : data,
      type : 'post',
      success : _.bind(function(html){
        // Set up or create the element. if it exists, move it inside the container.
        var el = '<div id="'+this.name+'">',
          container = $(this.container);
        if($('#'+this.name)) $('#'+this.name).remove();
        container.html(el);
        this.obj.el = container.find("#"+this.name)[0];
        $(this.obj.el).html(html);
        // set up the view.
        var view = this.view = new (Backbone.View.extend(this.obj))();
        addMethods.call(this,view);
        // set up partials based on data attributes
        view.partials = {};
        var partials = view.$el.find('[data-partial]'),
            partialsRendered = 0;
        partials.each(function(){
          // move all the partials to the partials object, and render them initially
          var p = $(this),
            partial = view.partials[p.attr('data-partial')] = {
              name : p.attr('data-partial'),
              url : p.attr('data-url'),
              obj : getJSON(p.attr('data-obj')),
              el : p
            }
          p.removeAttr('data-partial');
          p.removeAttr('data-url');
          p.removeAttr('data-obj');
          render(partial.name,partial.url,partial.obj,partial.el,function(){
            partialsRendered ++;
            if(partialsRendered==partials.length){
              done();
            }
          });
        });
        // make data accessible.
        this.set("data",data);
        // finally, render the view
        view.render();
        if(partials.length==0){
          done();
        }
      },this)
    });
  }
  // render a view partial by name.
  View.prototype.renderPartial = function(name,callback){
    var partial = this.view.partials[name];
    if(partial){
      render(partial.name,partial.url,partial.obj,partial.el,callback);
    }
  }
  // remove the whole view.
  View.prototype.remove = function(){
    // only remove once.
    this.view.remove();
  }
  return View;
});
