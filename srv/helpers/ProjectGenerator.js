const TemplateGenerator = require("../generator/TemplateGenerator.js");
const DirectoryGenerator = require("../generator/DirectoryGenerator.js");
const FileHelpers = require("./FileHelpers.js");

module.exports = class ProjectGenerator {
  /*
    Retrives the contents of a file
  */
  constructor(service) {
    this.service = service;
  }
  generate() {
    //console.log(this.service.Services[0]);
    const serviceUUID = this.service.Services[0].ServiceUUID;
    const fileHelpers = new FileHelpers();
    const projectPath = fileHelpers.getProjectPath(serviceUUID);

    const directoryGenerator = new DirectoryGenerator(
      this.service.Services[0].ServiceTechnicalName,
      false,
      projectPath
    );
    directoryGenerator.createDirectoryFromPath();

    const templateGenerator = new TemplateGenerator(
      this.service,
      false,
      false,
      projectPath
    );

    let messages = templateGenerator.validate();
    if (messages.length > 0) {
      console.log(messages[0]);
      return;
    }
    try {
      templateGenerator.enhance();
    } catch ({ name, message }) {
      console.log(message);
      return;
    }

    directoryGenerator.generate();
    templateGenerator.generate();
    return projectPath;
  }
};
