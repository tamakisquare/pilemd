const fs = require('fs');
const path = require('path');


function pathToFile(notePath) {
  var fileContent = fs.readFileSync(notePath);
  return new File(
    [fileContent],
    path.basename(notePath),
    {type: 'image/' + path.extname(notePath)}
  );
}


module.exports = {
  pathToFile: pathToFile
};
