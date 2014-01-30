var fs = require('fs');

function Installer(install_dir) {
  if(!fs.existsSync(install_dir) {
    fs.mkdirSync(install_dir);
  })
}

module.exports = Installer;