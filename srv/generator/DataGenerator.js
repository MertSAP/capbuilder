const fs = require("fs");
const path = require("path");
const { EOL } = require("os");
const AIParser = require("../../ai/AIParser.js");
const readline = require("readline");

module.exports = class DataGenerator {
  constructor(projectDir) {
    this.projectDir = projectDir;
  }

  getPromptText() {
    const dbPath = path.join(this.projectDir, "db");
    const schemaText = fs.readFileSync(path.join(dbPath, "schema.cds"), "utf8");
    try {
      const masterDatatext = fs.readFileSync(
        path.join(dbPath, "master-data.cds"),
        "utf8"
      );
      return schemaText + EOL + masterDatatext;
    } catch (e) {
      return schemaText;
    }
  }

  writeFile(contents, file) {
    const dataFolder = path.join("db", "data");
    const directoryPath = path.join(this.projectDir, dataFolder, file);
    fs.writeFileSync(directoryPath, contents, "utf8");
  }

  async readFirstLine(filePath) {
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    for await (const line of rl) {
      rl.close(); // Close immediately after reading the first line
      return line; // Return the first line
    }
  }

  async reGenerateData() {
    const dataFile = path.join(this.projectDir, "data.json");

    if (fs.existsSync(dataFile)) {
      const dataText = fs.readFileSync(dataFile);
      const dataJSON = JSON.parse(dataText);
      await this.generateContents(dataJSON, true);
    }
  }
  async generateContents(files, validateStructure = false) {
    var namespace = "";
    for (var fileName in files) {
      if (fileName === "namespace") {
        namespace = files[fileName];
        continue;
      }
      var firstRow = true;
      var headerRow = "";
      var fileContents = "";
      for (var row of files[fileName]) {
        var dataRow = "";
        for (var key in row) {
          if (firstRow) {
            headerRow = headerRow + key + ";";
          }
          dataRow = dataRow + row[key] + ";";
        }
        if (firstRow) {
          fileContents = headerRow;
          firstRow = false;
        }

        dataRow = dataRow.substring(0, dataRow.length - 1);
        fileContents = fileContents + EOL + dataRow;
      }

      var isValid = true;
      const completeFileName = namespace + "-" + fileName + ".csv";

      if (validateStructure) {
        var existingHeaderRow = await this.readFirstLine(
          path.join(this.projectDir, "db", "data", completeFileName)
        );

        isValid = this.headersEqual(existingHeaderRow, headerRow);
      }

      if (isValid) {
        this.writeFile(fileContents, completeFileName);
      }
    }
  }
  headersEqual(firstHeaderString, secondHeaderString) {
    const firstHeader = firstHeaderString.split(";").sort();
    const secondHeader = secondHeaderString.split(";").sort();
    return JSON.stringify(firstHeader) === JSON.stringify(secondHeader);
  }

  saveData(data) {
    fs.writeFileSync(
      path.join(this.projectDir, "data.json"),
      JSON.stringify(data, null, 4),
      "utf8"
    );
  }
  async makeRequest() {
    const promptText = this.getPromptText();
    const aIParser = new AIParser();

    let response = await aIParser.generateData(promptText);

    this.saveData(response);

    await this.generateContents(response);
  }
};
