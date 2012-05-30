define(['jquery','external/require-backbone'],function($,Backbone){
  // Local Helpers
  // Render - renders partials from the server
  var render = function(partial,api,data,el,callback){
    $.ajax({
      url : '/partial/' + partial + '/' + api,
      data : data,
      type : 'post',
      success : function(res){
        if(el) $(el).html(res);
        if(callback) callback(res);
      }
    });
  };
  var addMethods = function(view){
    // expose the navigate function on views
    view.navigate = this.navigate
    view.back = this.back
  }
  var hijackLinks = function(view){
    view.$el.find('a[href]').each(function(){
      var link = $(this),
          href = link.attr('href');
      if(!href.match(/^http/) && !link.is('.external')){
        link.click(function(){
          view.navigate(href);
          return false;
        });
      }
    });
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
    this.initialized = false
  }
  // perform initialization 
  View.prototype.initialize = function(){
    if(!this.router){
      throw new Error("Tried to initialize view, but it is missing a router.")
    } else if(!this.initialized) {
      this.navigate = _.bind(function(page,replace,trigger){
        var refresh = (page==this.router.history[this.router.history.length-1])
        if(refresh){
          // don't navigate to the exact same page twice.
          return false
        } else {
          if(typeof replace == 'object'){
            // allow passing of object
            trigger = replace.trigger
            replace = replace.replace
          }
          this.transitionOut(_.bind(function(){
            this.router.navigate(page, {trigger: trigger===false || true, replace:replace===false || false});
          },this));
        }
      },this);
      this.back = _.bind(function(){
        this.router.back();
      },this);
      this.initialized = true
    }
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
  View.prototype.set = function(key,val){
    if(!this.attributes) this.attributes = {};
    this.attributes[key] = val;
  }
  View.prototype.get = function(attr){
    return this.attributes && this.attributes[attr];
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
    var done = _.after(2,_.bind(function(data){
      this.hideLoading();
      hijackLinks(this.view);
      if(callback) callback();
      if(this.view.postRender) this.view.postRender(data);
    },this,data));
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
        if(!this.initialized) this.initialize()
        var view = this.view = new (Backbone.View.extend(this.obj))()
        addMethods.call(this,view)
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
              obj : _.extend(data,getJSON(p.attr('data-obj'))),
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
        view.render(data);
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
  // render a view or partial and return it
  View.prototype.getView = function(partial,api,data,el,callback){
    if(!el && !callback){
      callback = data;
      el = null;
      data = {};
    }
    render(partial,api,data,el,callback);
  }
  // remove the whole view.
  View.prototype.remove = function(){
    // only remove once.
    this.view.remove();
  }
  return View;
});
