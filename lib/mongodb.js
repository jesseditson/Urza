// Dependencies
// ------------
var mongoose = require('mongoose'),
  walk = require('../helpers/walk.js');

// Local Variables
// ---------------
var mongo;

// MongoDB Class
// -------------

var MongoDB = module.exports = function(options){
  var options = options || {};
	// require db name
	if(!options.dbName) throw new Error("MongoDB class requires dbName option. Please add it.");
	// set up this class
	this.dbName = options.dbName;
	this.host = options.host || options.dbHost || "localhost";
	this.port = options.port || options.dbPort || 27017;
  this.maxConnections = options.maxConnections || 200;
  // connect the db. Mongoose handles queueing of incoming requests, so we don't need to worry about updates before this finishes.
  mongoose.connect('mongodb://' + this.host + ":" + this.port + "/" + this.dbName);
  // load schemas into models
  this.models = {};
  this.collections = {};
  walk(__dirname + "/models",function(file,folder){
    if(file.match(/\.js$/)){
      // grab the filename, uppercase it.
      var modelName = file.replace(/\.js$/,''),
        modelName = modelName.charAt(0).toUpperCase() + modelName.slice(1),
        // load in the model.
        module = require(folder + '/' + file);
      // store as model.
      this.models[modelName] = mongoose.model(modelName,prepareModel(module),module.Collection);
      this.collections[module.Collection] = modelName;
    }
  }.bind(this),false);
	// make this available outside of the class scope.
	mongo = this;
}

// Helpers
// -------

// all models are passed through here. Add Statics and such in this method.
var prepareModel = function(module){
  var model = module.Schema;
  if(module.mapReduce){
    model.statics.mapReduce = {};
    for(var mr in module.mapReduce){
      var mapReduce = module.mapReduce[mr];
        command = {
          mapreduce : module.Collection,
          map : mapReduce.map.toString(),
          reduce : mapReduce.reduce.toString(),
          out : mr
        };
      model.statics.mapReduce[mr] = function(query,callback){
        if(query){
          command.query = query;
        } else {
          callback = query;
        }
        mongoose.connection.db.executeDbCommand(command,function(err,res){
          if(err || !res.documents[0].ok){
            callback(err || documents[0].errmsg);
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
  return mongo.models[mongo.collections[collection]];
}

// Public CRUD Methods
// -------------------

// **MapReduce**
MongoDB.prototype.mapReduce = function(collection,mrName,query,callback){
  getModel(collection).mapReduce[mrName](query,callback);
}

// **Read Methods**

// get all documents by a find object
MongoDB.prototype.find = function(collection,find,options,callback){
  if(!callback){
    callback = options;
    options = {};
  }
  getModel(collection).find(find,[],options,function(e,r){
    doCallback(e,r,callback);
  });
}

// get document by id
MongoDB.prototype.findById = function(collection,id,callback){
  getModel(collection).findById(id,function(e,r){
    doCallback(e,r,callback);
  });
}

// get a single document
MongoDB.prototype.findOne = function(collection,find,callback){
  getModel(collection).findOne(find,function(e,r){
    doCallback(e,r,callback);
  });
}

// count items
MongoDB.prototype.count = function(collection,find,callback){
  getModel(collection).count(find,function(e,r){
    doCallback(e,r,callback);
  });
}

// **Read Sugar**

// get a single document by a field
MongoDB.prototype.findByField = function(collection,field,val,callback){
  var find = {};
  find[field] = val;
  this.findOne(collection,find,callback);
}
// get multiple docuemnts by a field
MongoDB.prototype.findAllByField = function(collection,field,val,callback){
  var find = {};
  find[field] = val;
  this.find(collection,find,callback);
}
// get documents whose 'field' is in 'vals'
MongoDB.prototype.findInArray = function(collection,field,vals,callback){
  var find = {};
  find[field] = {$in:vals};
  this.find(collection,find,callback);
}

// get documents which have an id in the passed array
MongoDB.prototype.findByIds = function(collection,ids,limit,callback){
  var options = {};
  if(!callback){
    callback = limit;
  } else {
    var lim = parseInt(limit);
    if(typeof lim == "number") options.limit = lim;
  }
  this.find(collection,{ "_id" : { $in : ids } },options,callback);
}

// get all documents from a collection
MongoDB.prototype.all = function(collection,sort,callback){
  if(!callback){
    callback = sort;
    sort = [];
  }
  this.find(collection,sort,{},callback);
}

// get latest documents in a collection
MongoDB.prototype.latest = function(collection,num,callback){
  if(!callback){
    callback = num;
    num = [];
  }
  this.find(collection,['_id','asc'],callback);
}

// **Update Methods**

// update a the first item to match the find
MongoDB.prototype.update = function(collection,find,update,callback){
  getModel(collection).update(find,update,function(e,r){
    doCallback(e,r,callback);
  });
}

// update a all items that match the find
MongoDB.prototype.updateAll = function(collection,find,update,callback){
  getModel(collection).update(find,update,{multi:true},function(e,r){
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

MongoDB.prototype.deleteById = function(collection,id,update,callback){
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
  getModel(collection).findAndModify(find,{ $set : data }, {upsert:true,new:true},function(e,r){
    doCallback(e,r,callback);
  });
}

// Private Methods
// ---------------

// all calls repsond through this.
var doCallback = function(err,res,callback){
  var getObject = function(i){
    if(!i) return i;
    return typeof i.toObject === "function" ? i.toObject() : i;
  }
  if(Array.isArray(res)){
    res = res.map(getObject);
  } else if(typeof res === 'object'){
    res = getObject(res);
  }
  // TODO: handle error?
  callback(err,res);
}