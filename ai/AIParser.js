const OpenAI = require("openai");
const fs = require("fs");
const path = require("path");
const API_KEY_FILE = "OPEN_AI_API_KEY.txt";
const SYSTEM_MESSAGE_FILE = "SystemMessage.txt";

module.exports = class AIParser {
  /*
    Retrives the contents of a file
  */

  constructor() {
    this.aiReady = true;
    this.apiKey = this.getAPIKey();
  }

  setAPIKey(apiKey) {
    fs.writeFileSync(path.join(__dirname, API_KEY_FILE), apiKey, "utf8");
    this.aiReady = true;
    this.apiKey = this.getAPIKey();
  }
  getAPIKey() {
    var key = "";
    try {
      key = fs.readFileSync(path.join(__dirname, API_KEY_FILE), "utf8");
    } catch (e) {
      this.aiReady = false;
    }
    return key;
  }

  getAIStatus() {
    return this.aiReady;
  }

  async generateData(promptText) {
    if (!this.getAIStatus()) {
      throw new Error("API KEY not configured");
    }
    const systemMessage = fs.readFileSync(
      path.join(__dirname, "data", SYSTEM_MESSAGE_FILE),
      "utf8"
    );
    const result = await this.callOpenAI(systemMessage, promptText);
    return JSON.parse(result.choices[0].message.content);
  }
  async generateProject(promptText) {
    if (!this.getAIStatus()) {
      throw new Error("API KEY not configured");
    }
    const systemMessage = fs.readFileSync(
      path.join(__dirname, "service", SYSTEM_MESSAGE_FILE),
      "utf8"
    );
    const result = await this.callOpenAI(systemMessage, promptText);
    return JSON.parse(result.choices[0].message.content);
  }

  async callOpenAI(systemMessage, promptText) {
    const openai = new OpenAI({
      apiKey: this.apiKey,
    });

    const completion = openai.chat.completions.create({
      model: "gpt-4o",
      store: true,
      messages: [
        { role: "system", content: [{ type: "text", text: systemMessage }] },
        { role: "user", content: [{ type: "text", text: promptText }] },
      ],
      response_format: {
        type: "json_object",
      },
    });
    return await completion;
  }
};
