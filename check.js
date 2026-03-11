var d = require('./src/data/discs.json');
var s = require('./src/data/sample-bags.json');
var idSet = {};
d.discs.forEach(function(x){idSet[x.id]=true});
var missing = [];
s.bags.forEach(function(bag){
  bag.slots.forEach(function(slot){
    if(idSet[slot.discId] === undefined) missing.push(slot.discId);
  });
});
console.log('Missing disc IDs from sample-bags:', missing);
