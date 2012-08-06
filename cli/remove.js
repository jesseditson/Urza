// **Remove Items**
module.exports = function(program){
  program
    .command('remove type [name]')
    .description('removes a view or partial in the current Urza app.\n use `remove view <name>` or `remove partial <name`.')
    .action(function(type,info){
      throw new Error("Sorry, remove is not currently supported. Bug jesse to rewrite it.")
      // TODO: move duplicated logic up to a helper, check for uncommited changes before removing.
      var rawArgs = info.parent.rawArgs,
          name = rawArgs[rawArgs.length-1];
      if(type=='view'){
        // remove view command
        program.confirm('Are you sure you want to delete the '+name+' view?',function(yes){
          if(yes){
            removeView(name);
          } else {
            console.log('exiting');
            process.exit(0);
          }
        });
      } else if(type=='partial'){
        //remove partial command
        program.confirm('Are you sure you want to delete the '+name+' partial?',function(yes){
          if(yes){
            removePartial(name);
          } else {
            console.log('exiting');
            process.exit(0);
          }
        });
      } else {
        if(type){
          console.log("I don't know how to remove %s.",type);
        } else {
          console.log('please specify what you would like to remove.');
        }
      }
    });
}