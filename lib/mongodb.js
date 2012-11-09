// Dependencies
// ------------
var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  ObjectId = mongoose.Types.ObjectId,
  walk = require('./helpers/walk.js');

// Local Variables
// ---------------
var mongo;

// Helpers
// -------

// all models are passed through here. Add Statics and such in this method.
var prepareModel = function(module){
  var model = new Schema(module.Fields);
  if(typeof module.setup == 'function'){
    model = module.setup(model);
  }
  if(module.mapReduce){
    model.statics.mapReduce = {};
    for(var mr in module.mapReduce){
      if(module.mapReduce.hasOwnProperty(mr)){
        var mapReduce = module.mapReduce[mr],
            command = {
              mapreduce : module.Collection,
              map : mapReduce.map.toString(),
              reduce : mapReduce.reduce.toString(),
              out : mr
            };
        (function(mr){
          model.statics.mapReduce[mr] = function(query,callback){
            if(query){
              command.query = query;
            } else {
              callback = query;
            }
            mongoose.connection.db.executeDbCommand(command,function(err,res){
              if(err || !res.documents[0].ok){
                callback(err || res.documents[0].errmsg);
              } else {
                mongoose.connection.db.collection(mr,function(err,collection){
                  if(err){
                    callback(err);
                  } else {
                    collection.find({}).toArray(callback);
                  }
                });
              }
            });
          }
        }(mr))
      }
    }
  }
  // add the findAndModify method
  model.statics.findAndModify = function (query, sort, doc, options, callback) {
    // make sort optional
    if(!callback && typeof options==="function"){
      callback = options;
      options = doc;
      doc = sort;
      sort = [];
    }
    return this.collection.findAndModify(query, sort, doc, options, callback);
  };
  return model;
}

var getModel = function(collection){
  var model = mongo.models[mongo.collections[collection]];
  if(!model){
    console.error("ERROR: attempted access of non-existant model %s",collection);
    return false;
  } else {
    return model;
  }
}

// Private Methods
// ---------------

// all calls repsond through this.
var doCallback = function(err,res,callback){
  var getObject = function(i){
    if(!i) return i;
    try {
      return i.toObject()
    } catch(e){
      console.error(i," is not a valid model")
      return i
    }
  }
  if(Array.isArray(res)){
    res = res.map(getObject);
  } else if(typeof res === 'object'){
    res = getObject(res);
  }
  if(typeof callback != 'function'){
    throw new Error('Invalid callback passed to MongoDB.');
  } else {
    // TODO: handle error?
    callback(err,res);
  }
}

// MongoDB Class
// -------------

var MongoDB = module.exports = function(options){
  options = options || {};
  // require db name
  if(!options.db || !options.db.name) throw new Error("MongoDB class requires db.name option. Please add it.");
  // set up this class
  this.dbName = options.db.name;
  this.host = options.host || options.db.host || "localhost";
  this.port = options.port || options.db.port || 27017;
  this.maxConnections = options.maxConnections || 200;
  this.schemadir = (options.schemadir) ? process.cwd()+options.schemadir : process.cwd() + "/lib/providers/schemas";
  // connect the db. Mongoose handles queueing of incoming requests, so we don't need to worry about updates before this finishes.
  var connectString = 'mongodb://';
  if(options.db.auth) connectString += options.db.user + ":" + options.db.pass + "@";
  connectString += this.host + ":" + this.port + "/" + this.dbName;
  mongoose.connect(connectString,options.dbConfig || options.db.config || {});
  // load schemas into models
  this.models = {};
  this.collections = {};
  walk(this.schemadir,function(file,folder){
    if(file.match(/\.js$/)){
      // grab the filename, uppercase it.
      var modelName = file.replace(/\.js$/,''),
          // load in the model.
          module = require(folder + '/' + file);
      modelName = modelName.charAt(0).toUpperCase() + modelName.slice(1)
      // store as model.
      this.models[modelName] = mongoose.model(modelName,prepareModel(module),module.Collection);
      this.collections[module.Collection] = modelName;
    }
  }.bind(this),false);
  // make this available outside of the class scope.
  mongo = this;
}

// Public CRUD Methods
// -------------------

// **MapReduce**
MongoDB.prototype.mapReduce = function(collection,mrName,query,callback){
  getModel(collection).mapReduce[mrName](query,callback);
}

// **FindAndModify**
MongoDB.prototype.findAndModify = function(collection,query,sort,doc,options,callback){
  if(query._id){
    query._id = new ObjectId(query._id);
  } else if(query.$query && query.$query._id){
    query.$query._id = new ObjectId(query.$query._id);
  }
  getModel(collection).findAndModify(query,sort,doc,options,callback);
}

// **Read Methods**

// all find operaionts go through this one:

MongoDB.prototype.findOperation = function(operation,collection,find,fields,options,callback){
  // allow passing args in pretty much any order except first 2
  var args = Array.prototype.slice.call(arguments)
  args.slice(3).forEach(function(arg){
    switch(typeof arg){
      case 'object' :
        if(Array.isArray(arg)){
          fields = arg
        } else {
          options = arg
        }
        break
      case 'function' :
        callback = arg
        break
    }
  })
  if(typeof find == "function"){
    callback = find
    find = {}
  }
  // guarantee callback
  if(!callback) return callback(new Error("No callback passed to findOperation"))
  // default find, options & fields
  fields = (fields && Array.isArray(fields)) ? fields : []
  options = (options && typeof options === 'object' ) ? options : {}
  // load in default fields
  var defaults = (this.collectionDefaults || {})[collection];
  if(!fields.length && Array.isArray(defaults) && defaults.length){
    fields = defaults;
  }
  // build our find args
  var opArgs = [find,fields,options,function(e,r){
        doCallback(e,r,callback);
      }],
      model = getModel(collection)
  operation = model[operation]
  // only complicate things with cursors if necessary
  if(options.limit || options.skip || options.slaveOk){
    var cb = opArgs.pop()
    var op = operation.apply(model,opArgs)
    if(options.limit) op = op.skip(options.skip || 0)
    if(options.skip) op = op.limit(options.limit || 0)
    if(options.slaveOk) op = op.slaveOk()
    op.execFind(cb)
  } else {
    operation.apply(model,opArgs)
  }
}

// get all documents by a find object
MongoDB.prototype.find = function(collection,find,fields,options,callback){
  this.findOperation('find',collection,find,fields,options,callback);
}

// get document by id
MongoDB.prototype.findById = function(collection,id,fields,options,callback){
  var find = {};
  find._id = id;
  this.findOperation('findOne',collection,find,fields,options,callback);
}

// get a single document
MongoDB.prototype.findOne = function(collection,find,fields,options,callback){
  this.findOperation('findOne',collection,find,fields,options,callback);
}

// count items
MongoDB.prototype.count = function(collection,find,callback){
  getModel(collection).count(find,function(e,r){
    doCallback(e,r,callback);
  });
}

// **Read Sugar**

// get a single document by a field
MongoDB.prototype.findByField = function(collection,field,val,fields,callback){
  var find = {};
  find[field] = val;
  this.findOne(collection,find,fields,callback);
}
// get multiple docuemnts by a field
MongoDB.prototype.findAllByField = function(collection,field,val,fields,callback){
  var find = {};
  find[field] = val;
  this.find(collection,find,fields,callback);
}
// get documents whose 'field' is in 'vals'
MongoDB.prototype.findInArray = function(collection,field,vals,fields,callback){
  var find = {};
  find[field] = {$in:vals};
  this.find(collection,find,fields,callback);
}

// get documents which have an id in the passed array
MongoDB.prototype.findByIds = function(collection,ids,fields,limit,callback){
  var options = {};
  if(!callback && !limit){
    callback = fields;
    fields = [];
  } else if(!callback){
    limit = fields;
    callback = limit;
    fields = [];
  } else {
    var lim = parseInt(limit,10);
    if(!isNaN(lim)) options.limit = lim;
  }
  //  var ids = ids.map(function(i){ return new ObjectId(i); });
  this.find(collection,{ _id : { $in : ids } },fields,options,callback);
}

// get all documents from a collection
MongoDB.prototype.all = function(collection,fields,options,callback){
  this.find(collection,{},fields,options,callback);
}

// get latest documents in a collection
MongoDB.prototype.latest = function(collection,num,fields,callback){
  if(!callback && !fields){
    callback = num;
    fields = [];
    num = 1;
  } else if(!callback){
    callback = fields;
    fields = [];
  }
  this.find(collection,['_id','asc'],fields,{limit:num},callback);
}

// **Update Methods**

// update a the first item to match the find
MongoDB.prototype.update = function(collection,find,update,options,callback){
  if(!callback){
    callback = options;
    options = {};
  }
  getModel(collection).update(find,update,options,function(e,r){
    doCallback(e,r,callback);
  });
}

// update a all items that match the find
MongoDB.prototype.updateAll = function(collection,find,update,opts,callback){
  var options = {multi:true};
  if(!callback){
    callback = opts;
  } else {
    for(var o in opts){
      if(opts.hasOwnProperty(o)){
        options[o] = opts[o];
      }
    }
  }
  getModel(collection).update(find,update,options,function(e,r){
    doCallback(e,r,callback);
  });
}

// **Update Sugar***

// update a single item by ID
MongoDB.prototype.updateById = function(collection,id,update,callback){
  this.update(collection,{ "_id" : id },update,callback);
}

// update a bunch of items By ID
MongoDB.prototype.updateByIds = function(collection,ids,update,callback){
  this.updateAll(collection,{ "_id" : { $in : ids } },update,callback);
}

// **Delete Methods**

MongoDB.prototype.deleteById = function(collection,id,callback){
  getModel(collection).remove({ "_id" : id, "deleted" : null},function(e,r){
    doCallback(e,r,callback);
  });
}

// **Create Methods**

MongoDB.prototype.create = function(collection,data,callback){
  // TODO: this appears to be busted for users (at least). item does not get _id set on it.
  var item = new (getModel(collection))(data);
  item.save(function(err){
    if(err){
      doCallback(err,null,callback);
    } else {
      this.findById(collection,item._id.toString(),callback);
    }
  }.bind(this));
}

MongoDB.prototype.upsert = function(collection,find,data,callback){
  getModel(collection).findAndModify(find,{ $set : data }, {upsert:true,'new':true},callback);
}
