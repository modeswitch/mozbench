var fs = require('fs');

function Installer(install_dir) {
  if(!fs.existsSync(install_dir) {
    fs.mkdirSync(install_dir);
  });

  this.install_package = function install_package(package_path, install_path) {

  };

  this.create_profile = function create_profile(install_path, profile_name) {

  };
}

module.exports = Installer;