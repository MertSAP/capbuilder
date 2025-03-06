const fs = require("fs");
const path = require("path");

module.exports = class FileHelpers {
  /*
    Retrives the contents of a file
  */
  readContentsStream(file, folder) {
    const directoryPath = path.join(__dirname, "..", "..", folder, file);
    return fs.createReadStream(directoryPath);
  }

  readContents(file, folder) {
    const directoryPath = path.join(__dirname, "..", "..", folder, file);
    const fileContents = fs.readFileSync(directoryPath, "utf8");
    const fileContentsJSON = JSON.parse(fileContents);
    return fileContentsJSON;
  }
  readText(file, folder) {
    const directoryPath = path.join(__dirname, "..", "..", folder, file);
    const fileContents = fs.readFileSync(directoryPath, "utf8");
    return fileContents;
  }
  writeText(file, folder, contents) {
    const directoryPath = path.join(__dirname, "..", "..", folder, file);
    fs.writeFileSync(directoryPath, contents, "utf8");
  }

  getProjectPath(ServiceUUID = "") {
    return path.join(
      __filename,
      "..",
      "..",
      "generator",
      "projects",
      ServiceUUID
    );
  }

  /*
    Retrives a list of files in the template folder
  */

  /*
    Writes a files to the template folder
  */
  outputFile(fileName, contents) {
    const reqPath = path.join(__dirname, "..", "..", "templateFiles", fileName);

    fs.writeFile(reqPath, JSON.stringify(contents, null, 4), function (err) {
      if (err) {
        return false;
      }
      return true;
    });
  }
};
