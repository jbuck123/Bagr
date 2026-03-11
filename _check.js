const d = require('./src/data/discs.json');
const ids = d.discs.map(x => x.id);
const sampleIds = [189,200,54,502,18,352,190,249,268,799,660,720,263,789,379,652,204,205,279,555,141,191,1130,334,777,86,346,390,361,707,102,248,161,261,123,350,1079,364,214,563];
const missing = sampleIds.filter(id => ids.indexOf(id) === -1);
console.log('Missing IDs:', missing);
console.log('Total disc types:', [...new Set(d.discs.map(x => x.type))]);
console.log('Total discs:', d.discs.length);
