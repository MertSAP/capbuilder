const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const fsExtra = require("fs-extra");
const FileHelpers = require("../helpers/FileHelpers.js");
module.exports = class DirectoryGenerator {
  constructor(ServiceName, filesOnly, projectPath) {
    this.ServiceName = ServiceName;
    this.FilesOnly = filesOnly;
    this.projectPath = projectPath;
  }

  generate() {
    if (this.FilesOnly) return;
    if (this.createDirectory("app")) return;
    if (this.createProject()) return;
    if (this.createDirectory(path.join("app", this.ServiceName))) return;
    if (this.createDirectory("_i18n")) return;
    if (this.createDirectory(path.join("app", this.ServiceName, "webapp")))
      return;
    if (
      this.createDirectory(
        path.join("app", this.ServiceName, "webapp", "changes")
      )
    )
      return;
    if (
      this.createDirectory(path.join("app", this.ServiceName, "webapp", "i18n"))
    )
      return;
    if (this.createDirectory(path.join("db", "data"))) return;
  }

  createProject() {
    execSync(
      "cds init",
      { cwd: this.projectPath, stdio: "inherit" },
      (error, stdout, stderr) => {
        if (error) {
          console.log(`error: ${error.message}`);
          return false;
        }
        if (stderr) {
          console.log(`stderr: ${stderr}`);
          return false;
        }

        return true;
      }
    );
  }
  cleanUpProjectDirectories() {
    const fileHelpers = new FileHelpers();
    const projectDir = fileHelpers.getProjectPath();

    try {
      fsExtra.emptyDirSync(projectDir);
    } catch (e) {
      //this cleanup is just best effort. If it fails its peobably because a prokect directory has a cds watch against it
    }
  }
  createDirectoryFromPath() {
    if (fs.existsSync(this.projectPath)) {
      console.log(`Directory exists: ${this.projectPath}. Deleting...`);
      // Remove the directory and its contents
      const dataFile = path.join(this.projectPath, "data.json");
      var dataContents = "";
      if (fs.existsSync(dataFile)) {
        dataContents = fs.readFileSync(dataFile, "utf-8");
      }
      fsExtra.emptyDirSync(this.projectPath);
      if (dataContents !== "") {
        fs.writeFileSync(dataFile, dataContents, "utf-8");
      }
    } else {
      fs.mkdirSync(this.projectPath, (err) => {
        if (err) {
          console.log(err);
          return false;
        }
        return true;
      });
    }
  }
  createDirectory(directory) {
    fs.mkdirSync(path.join(this.projectPath, directory), (err) => {
      if (err) {
        console.log(err);
        return false;
      }
      return true;
    });
  }
};
