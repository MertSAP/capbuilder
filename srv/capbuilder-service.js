const cds = require("@sap/cds");
var archiver = require("archiver");

require("./workarounds");
const LoadFileGenerator = require("./helpers/LoadFileGenerator.js");
const LoadFileProcessor = require("./helpers/LoadFileProcessor.js");
const FileHelpers = require("./helpers/FileHelpers");
const GeneralHelpers = require("./helpers/GeneralHelpers");
const ProjectGenerator = require("./helpers/ProjectGenerator");
const DirectoryGenerator = require("./generator/DirectoryGenerator.js");
const DataGenerator = require("./generator/DataGenerator.js");
const AIParser = require("../ai/AIParser.js");
const NetworkGraphHelpers = require("./helpers/NetworkGraphHelpers.js");

cds.on("served", async () => {
  const directoryGenerator = new DirectoryGenerator();
  directoryGenerator.cleanUpProjectDirectories();
});

class CAPBuilderService extends cds.ApplicationService {
  init() {
    const {
      Service,
      Entity,
      Field,
      Facet,
      ValueHelp,
      Action,
      ServiceRole,
      ServiceAuth,
      FieldType,
    } = this.entities;
    /*
      Perform various validations before saving
    */

    this.before("SAVE", "Service", async (req) => {
      const { to_Entity, to_Association, to_ServiceRole } = req.data;

      if (to_Entity !== undefined) {
        var entityRootCount = 0;
        for (const entityRow of to_Entity) {
          if (entityRow.to_Field.length === 0) {
            req.error(
              400,
              `Entity: ${entityRow.EntityTechnicalName} must have fields`,
              `in/to_Entity(EntityUUID=${entityRow.EntityUUID},IsActiveEntity=false)/`
            );
          }

          if (entityRow.EntityIsRoot !== null && entityRow.EntityIsRoot) {
            if (
              entityRow.EntityMasterData === null ||
              !entityRow.EntityMasterData
            ) {
              entityRootCount++;
            }
          }

          let keyFieldCount = 0;

          for (const fieldRow of entityRow.to_Field) {
            if (fieldRow.FieldisKey) {
              keyFieldCount++;
            }
          }
          if (keyFieldCount === 0) {
            req.error(
              400,
              `Entity: ${entityRow.EntityTechnicalName}: A Key must be defined`,
              `in/to_Entity(EntityUUID=${entityRow.EntityUUID},IsActiveEntity=false)/to_Field`
            );
          } else if (keyFieldCount > 1) {
            req.error(
              400,
              `Entity: ${entityRow.EntityTechnicalName}: Only 1 Key may be defined`,
              `in/to_Entity(EntityUUID=${entityRow.EntityUUID},IsActiveEntity=false)/to_Field`
            );
          }

          for (const fieldRow of entityRow.to_Field) {
            if (
              fieldRow.InputType_InputTypeCode === "SemanticKey" &&
              fieldRow.FieldType_TypeCode !== "Integer"
            ) {
              req.error(
                400,
                `Field: ${fieldRow.FieldTechnicalName}: A Semantic Auto Increment Key must be an Integer`,
                `in/to_Entity(EntityUUID=${entityRow.EntityUUID},IsActiveEntity=false)/to_Field(FieldUUID=${fieldRow.FieldUUID},IsActiveEntity=false)`
              );
            }

            const fieldTypeResult = await SELECT`TypeArgs,TypeArgsStatus`
              .from(FieldType)
              .where({ TypeCode: fieldRow.FieldType_TypeCode });

            // Not required but provided
            if (
              fieldTypeResult[0].TypeArgsStatus === "N" &&
              fieldRow.FieldLength !== "" &&
              fieldRow.FieldLength !== null
            ) {
              req.error(
                400,
                `Field: ${fieldRow.FieldTechnicalName}: Length provided but not allowed for ${fieldRow.FieldType_TypeCode}`,
                `in/to_Entity(EntityUUID=${entityRow.EntityUUID},IsActiveEntity=false)/to_Field(FieldUUID=${fieldRow.FieldUUID},IsActiveEntity=false)`
              );
            }

            // Required and not provided
            if (
              fieldTypeResult[0].TypeArgsStatus === "M" &&
              (fieldRow.FieldLength === "" || fieldRow.FieldLength === null)
            ) {
              req.error(
                400,
                `Field: ${fieldRow.FieldTechnicalName}: Length not provided but required for ${fieldRow.FieldType_TypeCode}`,
                `in/to_Entity(EntityUUID=${entityRow.EntityUUID},IsActiveEntity=false)/to_Field(FieldUUID=${fieldRow.FieldUUID},IsActiveEntity=false)`
              );
            }

            if (
              (fieldTypeResult[0].TypeArgsStatus === "M" ||
                fieldTypeResult[0].TypeArgsStatus === "O") &&
              fieldRow.FieldLength !== "" &&
              fieldRow.FieldLength !== null
            ) {
              // Length needs to be an Integer
              if (fieldTypeResult[0].TypeArgs === "L") {
                const regExpInt = new RegExp("^\\d+$");
                if (!regExpInt.test(fieldRow.FieldLength)) {
                  req.error(
                    400,
                    `Field: ${fieldRow.FieldTechnicalName}: Length must be an Integer`,
                    `in/to_Entity(EntityUUID=${entityRow.EntityUUID},IsActiveEntity=false)/to_Field(FieldUUID=${fieldRow.FieldUUID},IsActiveEntity=false)`
                  );
                }
              }
              // Length needs to contain precison and scale
              if (fieldTypeResult[0].TypeArgs === "PC") {
                const regExpPC = new RegExp("^\\d+,\\d+$");
                if (!regExpPC.test(fieldRow.FieldLength)) {
                  req.error(
                    400,
                    `Field: ${fieldRow.FieldTechnicalName}: Length must be an format: Precision,Scale (i.e. 16,3)`,
                    `in/to_Entity(EntityUUID=${entityRow.EntityUUID},IsActiveEntity=false)/to_Field(FieldUUID=${fieldRow.FieldUUID},IsActiveEntity=false)`
                  );
                }
              }
            }
          }
        }
        if (entityRootCount !== 1) {
          req.error(
            400,
            "The must be 1 and only 1 Root Entity(and not a Master Data Entity"
          );
        }
      }

      if (to_Association !== undefined) {
        for (const associationRow of to_Association) {
          if (
            associationRow.AssociationParentEntity_EntityUUID ===
            associationRow.AssociationChildEntity_EntityUUID
          ) {
            req.error(
              400,
              "Association can not be to itself",
              `in/to_Association(AssociationUUID=${associationRow.AssociationUUID},IsActiveEntity=false)/`
            );
          }
          const parentEntity = to_Entity.find((item) => {
            return (
              item.EntityUUID ===
              associationRow.AssociationParentEntity_EntityUUID
            );
          });
          const childEntity = to_Entity.find((item) => {
            return (
              item.EntityUUID ===
              associationRow.AssociationChildEntity_EntityUUID
            );
          });

          if (
            (parentEntity.EntityMasterData && !childEntity.EntityMasterData) ||
            (!parentEntity.EntityMasterData && childEntity.EntityMasterData)
          ) {
            req.error(
              400,
              "Master Data Entities can not be used in non Master Data Associations",
              `in/to_Association(AssociationUUID=${associationRow.AssociationUUID},IsActiveEntity=false)/`
            );
          }
        }
      }

      if (to_ServiceRole !== undefined) {
        for (const roleRow of to_ServiceRole) {
          if (roleRow.to_ServiceAuth.length === 0) {
            req.error(
              400,
              "Authorisations must be defined if a Role is defined ",
              `in/to_ServiceRole(RoleUUID=${roleRow.RoleUUID},IsActiveEntity=false)/`
            );
          }
        }
      }
    });
    /*
      Load a template file
    */

    this.on("loadTemplate", async (req) => {
      const fileContent = JSON.parse(req.data.fileContents);
      const serviceUUID = await insertTempalte(fileContent.Services[0], req);

      return {
        ServiceUUID: serviceUUID,
      };
    });

    /*
      Populate the DraftFields Entity. This is used in Value Helps so the user
      does not need to acitvate changes first
    */
    this.on("READ", "DraftField", async (req) => {
      let result = {};
      delete req.query.count;

      if (req.query.SELECT.where === undefined) {
        return req.error(
          400,
          "Query Parameter to_Entity_EntityUUID is required"
        );
      }

      let fieldResult = {};
      if (req.query.SELECT.where[0].ref[0] === "to_Entity_EntityUUID") {
        fieldResult = await SELECT`EntityUUID`
          .from(Entity.drafts)
          .where({ EntityUUID: req.query.SELECT.where[2].val });
      }

      if (fieldResult.length === 0) {
        result =
          await SELECT`FieldTechnicalName,FieldUUID,to_Entity_EntityUUID, FieldLabel`
            .from(Field)
            .where(req.query.SELECT.where)
            .orderBy("FieldSortOrder");
        req.query.count = true;
        result.$count = result.length;
      } else {
        result =
          await SELECT`FieldTechnicalName,FieldUUID,to_Entity_EntityUUID, FieldLabel`
            .from(Field.drafts)
            .where(req.query.SELECT.where)
            .orderBy("FieldSortOrder");
        req.query.count = true;
        result.$count = result.length;
      }
      return result;
    });

    /*
      Populate the DraftFacets Entity. This is used in Value Helps so the user
      does not need to acitvate changes first
    */
    this.on("READ", "DraftFacets", async (req) => {
      let result = {};
      delete req.query.count;

      let fieldResult = {};

      if (req.query.SELECT.where === undefined) {
        return req.error(
          400,
          "Query Parameter to_Entity_EntityUUID is required"
        );
      }

      if (req.query.SELECT.where[0].ref[0] === "to_Entity_EntityUUID") {
        fieldResult = await SELECT`EntityUUID`
          .from(Entity.drafts)
          .where({ EntityUUID: req.query.SELECT.where[2].val });
      }

      if (fieldResult.length === 0) {
        result =
          await SELECT`FacetTechnicalName,FacetUUID,to_Entity_EntityUUID, FacetLabel`
            .from(Facet)
            .where(req.query.SELECT.where);
        req.query.count = true;
        result.$count = result.length;
      } else {
        result =
          await SELECT`FacetTechnicalName,FacetUUID,to_Entity_EntityUUID, FacetLabel`
            .from(Facet.drafts)
            .where(req.query.SELECT.where);
        req.query.count = true;
        result.$count = result.length;
      }
      return result;
    });

    /*
      Populate the ServiceUUID for Valuehelp on Save
    */
    this.before("CREATE", ValueHelp.drafts, async (req) => {
      const serviceUUID = await SELECT`to_Service_ServiceUUID as ServiceUUID`
        .from(Entity.drafts)
        .where({ EntityUUID: req.data.to_Entity_EntityUUID });
      req.data.to_Service_ServiceUUID = serviceUUID[0].ServiceUUID;
      return req;
    });

    this.before("CREATE", Field.drafts, async (req) => {
      const fields = await SELECT.from(Field.drafts).where({
        to_Entity_EntityUUID: req.data.to_Entity_EntityUUID,
      });
      req.data.FieldSortOrder = fields.length + 1;
      req.data.InputType_InputTypeCode = "Optional";
    });

    this.before("CREATE", Facet.drafts, async (req) => {
      const facets = await SELECT.from(Facet.drafts).where({
        to_Entity_EntityUUID: req.data.to_Entity_EntityUUID,
      });
      req.data.FacetSortOrder = facets.length + 1;
    });

    this.before("CREATE", Action.drafts, async (req) => {
      const actions = await SELECT.from(Action.drafts).where({
        to_Entity_EntityUUID: req.data.to_Entity_EntityUUID,
      });
      req.data.ActionSortOrder = actions.length + 1;
    });

    this.before("CREATE", ValueHelp.drafts, async (req) => {
      const valueHelps = await SELECT.from(ValueHelp.drafts).where({
        to_Entity_EntityUUID: req.data.to_Entity_EntityUUID,
      });
      req.data.ValueHelpSortOrder = valueHelps.length + 1;
    });

    /*
      Populate the ServiceUUID for ServiceAuth on Save
    */
    this.before("CREATE", ServiceAuth.drafts, async (req) => {
      const serviceUUID =
        await SELECT`to_Service_ServiceUUID as ServiceUUID, RoleUUID`
          .from(ServiceRole.drafts)
          .where({ RoleUUID: req.data.to_ServiceRole_RoleUUID });
      req.data.to_Service_ServiceUUID = serviceUUID[0].ServiceUUID;
      return req;
    });

    /*
      Populate the DraftEntity Entity. This is used in Value Helps so the user
      does not need to acitvate changes first
    */

    this.on("READ", "DraftEntity", async (req) => {
      let result = {};
      delete req.query.count;

      let fieldResult = {};

      if (req.query.SELECT.where === undefined) {
        return req.error(400, "Query Parameter is required");
      }
      let serviceUUID = "";
      /// // ServiceUUID is provided

      if (req.query.SELECT.where[0].ref[0] === "to_Service_ServiceUUID") {
        serviceUUID = req.query.SELECT.where[2].val;
      } else if (
        req.query.SELECT.where[0].ref[0] === "to_ServiceRole_RoleUUID"
      ) {
        const serviceRole = await SELECT`to_Service_ServiceUUID`
          .from(ServiceRole.drafts)
          .where({ RoleUUID: req.query.SELECT.where[2].val });
        serviceUUID = serviceRole[0].to_Service_ServiceUUID;
      }

      fieldResult = await SELECT`ServiceUUID`
        .from(Service.drafts)
        .where({ ServiceUUID: serviceUUID });
      if (fieldResult.length === 0) {
        result =
          await SELECT`EntityUUID,EntityTechnicalName,EntityName, to_Service_ServiceUUID`
            .from(Entity)
            .where({ to_Service_ServiceUUID: serviceUUID });
        req.query.count = true;
        result.$count = result.length;
      } else {
        result =
          await SELECT`EntityUUID,EntityTechnicalName,EntityName, to_Service_ServiceUUID`
            .from(Entity.drafts)
            .where({ to_Service_ServiceUUID: serviceUUID });
        req.query.count = true;
        result.$count = result.length;
      }

      return result;
    });

    this.on("ActionPrefillLabel", async (req) => {
      const actions = await SELECT.from(req.subject);
      if (actions[0].ActionLabel === "" || actions[0].ActionLabel == null) {
        const labelHelper = new GeneralHelpers();
        await UPDATE(req.subject).with({
          ActionLabel: labelHelper.getLabel(actions[0].ActionTechnicalName),
        });
      }
    });

    this.on("FacetPrefillLabel", async (req) => {
      const facets = await SELECT.from(req.subject);
      if (facets[0].ActionLabel === "" || facets[0].ActionLabel == null) {
        const labelHelper = new GeneralHelpers();
        await UPDATE(req.subject).with({
          FacetLabel: labelHelper.getLabel(facets[0].FacetTechnicalName),
        });
      }
    });

    this.on("ValueHelpPrefillLabel", async (req) => {
      const valueHelp = await SELECT.from(req.subject);
      if (valueHelp[0].ActionLabel === "" || valueHelp[0].ActionLabel == null) {
        const labelHelper = new GeneralHelpers();
        await UPDATE(req.subject).with({
          ValueHelpLabel: labelHelper.getLabel(
            valueHelp[0].ValueHelpTechnicalName
          ),
        });
      }
    });

    this.on("fillEntities", async (req) => {
      let ServiceUUID = "";
      let RoleUUID = "";

      for (const param of req.params) {
        if (param.ServiceUUID !== undefined) {
          ServiceUUID = param.ServiceUUID;
        }

        if (param.RoleUUID !== undefined) {
          RoleUUID = param.RoleUUID;
        }
      }

      const entities =
        await SELECT`EntityUUID,DraftAdministrativeData_DraftUUID,EntityMasterData`
          .from(Entity.drafts)
          .where({ to_Service_ServiceUUID: ServiceUUID });
      for (const entity of entities) {
        if (entity.EntityMasterData === null || !entity.EntityMasterData) {
          await this.create(ServiceAuth.drafts).entries({
            to_ServiceRole_RoleUUID: RoleUUID,
            AuthType_AuthorisationType: req.data.AuthorisationType,
            DraftAdministrativeData_DraftUUID:
              entity.DraftAdministrativeData_DraftUUID,
            AuthEntity_EntityUUID: entity.EntityUUID,
          });
        }
      }
    });

    this.on("prefillLabel", async (req) => {
      const fields = await SELECT.from(req.subject);
      if (fields[0].FieldLabel === "" || fields[0].FieldLabel == null) {
        const labelHelper = new GeneralHelpers();
        await UPDATE(req.subject).with({
          FieldLabel: labelHelper.getLabel(fields[0].FieldTechnicalName),
        });
      }
    });

    this.on("ActionParamPrefillLabel", async (req) => {
      const fields = await SELECT.from(req.subject);
      if (
        fields[0].ActionParameterLabel === "" ||
        fields[0].ActionParameterLabel == null
      ) {
        const labelHelper = new GeneralHelpers();
        await UPDATE(req.subject).with({
          ActionParameterLabel: labelHelper.getLabel(
            fields[0].ActionParameterTechnicalName
          ),
        });
      }
    });

    this.on("configureAIKEY", async (req) => {
      const aIParser = new AIParser();
      aIParser.setAPIKey(req.data.key);
    });

    this.on("getAIStatus", async () => {
      const aIParser = new AIParser();
      return {
        configured: aIParser.getAIStatus(),
      };
    });

    this.on("createWithAIPrompt", async (req) => {
      const aIParser = new AIParser();
      const promptText = req.data.prompt;
      var serviceUUID = "";
      try {
        let response = await aIParser.generateProject(promptText);
        const data = response["data"];
        delete response["data"];
        serviceUUID = await insertTempalte(response.Services[0], req);

        const fileHelpers = new FileHelpers();
        const projectPath = fileHelpers.getProjectPath(serviceUUID);

        const directoryGenerator = new DirectoryGenerator(
          response.Services[0].ServiceTechnicalName,
          false,
          projectPath
        );
        directoryGenerator.createDirectoryFromPath();

        const dataGenerator = new DataGenerator(projectPath);
        await dataGenerator.saveData(data);
      } catch (e) {
        return req.error(400, e.toString());
      }

      return {
        ServiceUUID: serviceUUID,
      };
    });

    this.on("livePreviewUpdate", async (req) => {
      const ServiceUUID = req.params[0].ServiceUUID;

      try {
        await generateProject(ServiceUUID);
      } catch (e) {
        return req.error(400, e.toString());
      }

      const fileHelper = new FileHelpers();
      return {
        watchDirectory: fileHelper.getProjectPath(ServiceUUID),
      };
    });

    this.on("downloadProject", async (req) => {
      const ServiceUUID = req.params[0].ServiceUUID;
      const fileHelper = new FileHelpers();
      var content = "";
      try {
        content = await generateProject(ServiceUUID);
      } catch (e) {
        return req.error(400, e.toString());
      }

      req.res.setHeader("Content-Type", "application/zip");
      req.res.setHeader(
        "Content-Disposition",
        `attachment; filename="${content.Services[0].ServiceTechnicalName}.zip"`
      );

      // Create ZIP archive
      const archive = archiver("zip", { zlib: { level: 9 } });
      archive.pipe(req.res);

      // Add directory to ZIP
      archive.directory(fileHelper.getProjectPath(ServiceUUID), false);

      // Finalize and send ZIP file
      await archive.finalize();
    });

    this.on("generateData", async (req) => {
      const serviceUUID = req.params[0].ServiceUUID;
      const serviceResult = await SELECT.one
        .from(Service.drafts)
        .where({ ServiceUUID: serviceUUID });
      if (serviceResult !== undefined) {
        return req.error(400, "Please Apply your changes first");
      }
      try {
        await generateProject(serviceUUID, false);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (e) {
        return req.error(400, e.toString());
      }

      const fileHelper = new FileHelpers();
      const directoryPath = fileHelper.getProjectPath(serviceUUID);
      const dataGenerator = new DataGenerator(directoryPath);
      await dataGenerator.makeRequest();
      return {
        success: true,
      };
    });

    this.on("getNetworkGraphData", async (req) => {
      var content = "";
      try {
        content = await generateTemplate(req.params[0].ServiceUUID);
      } catch (e) {
        return req.error(400, e.toString());
      }
      const networkGraphHelpers = new NetworkGraphHelpers(content);
      return networkGraphHelpers.getNetworkJSON();
    });

    this.on("downloadTemplate", async (req) => {
      var content = "";
      try {
        content = await generateTemplate(req.params[0].ServiceUUID);
      } catch (e) {
        return req.error(400, e.toString());
      }

      const fileName = "template.json";
      // Convert to Buffer
      const fileBuffer = Buffer.from(JSON.stringify(content), "utf-8");

      // Set response headers
      req.res.setHeader(
        "Content-Disposition",
        `attachment; filename="${fileName}"`
      );
      req.res.setHeader("Content-Type", "text/plain");
      req.res.setHeader("Content-Length", fileBuffer.length);

      // Send the file response
      req.res.end(fileBuffer);
    });

    async function insertTempalte(template, req) {
      const fileProcessor = new LoadFileProcessor(template);
      const service = await fileProcessor.prepareEntities();
      service.ServiceUUID = cds.utils.uuid();
      await cds.tx(req).run(INSERT.into(Service).entries(service));
      return service.ServiceUUID;
    }
    async function generateProject(ServiceUUID, reGenerateData = true) {
      var content = await generateTemplate(ServiceUUID);
      content.Services[0]["ServiceUUID"] = ServiceUUID;
      const projectGenerator = new ProjectGenerator(content);
      projectGenerator.generate();

      if (reGenerateData) {
        const fileHelper = new FileHelpers();
        const directoryPath = fileHelper.getProjectPath(ServiceUUID);
        const dataGenerator = new DataGenerator(directoryPath);
        await dataGenerator.reGenerateData();
      }

      return content;
    }

    async function generateTemplate(ServiceUUID) {
      var content = "";
      const serviceResult = await SELECT.one
        .from(Service.drafts)
        .where({ ServiceUUID: ServiceUUID });
      if (serviceResult !== undefined) {
        throw new Error("Please Apply your changes first");
      }

      const fileGenerator = new LoadFileGenerator(ServiceUUID);

      try {
        content = await fileGenerator.generateJSON();
      } catch (Circular) {
        throw new Error("Generatation Error");
      }
      return content;
    }

    return super.init();
  }
}
module.exports = { CAPBuilderService };
