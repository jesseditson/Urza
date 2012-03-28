

var Utilities = module.exports = function() {
}

// quick little curry method for doing async stuff
// prefills arguments on a method and calls it in the passed context when the returned method is called.
Utilities.prototype.curry = function(/* context,method,arguments */){
  var args = Array.prototype.slice.call(arguments),
      context = args.shift(),
      method = args.shift();
  return function(){
    var subargs = Array.prototype.slice.call(arguments);
    args = args.concat(subargs);
    method.apply(context,args);
  }
}

Date.prototype.getTimestamp = function(){
    return Math.floor(this.getTime() / 1000);
};

Utilities.prototype.getFriendlyDate = function(date) {
  // create a day in the past to assign to dates without years set
//  var past = new Date();
//  past.setDate(past.getDate() - 365);

  var friendlyDate = "far away";
  var today = new Date();
  today.setHours(0,0,0,0);

  // ignoring the actual year of the date a date in THIS year to compare to today
  var parts = date.split('/'),
    day = parts[0],
    month = parts[1],
    year = today.getFullYear(); // make them all use this year.
  var dateThisYear = new Date([day,month,year].join('/'));
  var dateNextYear = new Date([day,month,year+1].join('/'));
  dateThisYear.setHours(0,0,0,0);
  dateNextYear.setHours(0,0,0,0);

  var diff = 0;
  var beforeToday = (dateThisYear - today) < 0;
  if (beforeToday) {
    diff = dateNextYear.getTimestamp() - today.getTimestamp(); 
  } else {
    diff = dateThisYear.getTimestamp() - today.getTimestamp();    
  }
  
  var oneDay = 60*60*24;
  
  if (diff < oneDay) {
    friendlyDate = "TODAY!";
  } else if (diff < oneDay*2) {
    friendlyDate = "Tomorrow";
  } else if (diff < oneDay*30) {
    friendlyDate = "in " + Math.ceil(diff/oneDay) + " days";
  }
   
  return friendlyDate;
};