const ContentEnricher = require("../generator/ContentEnricher");
module.exports = class NetworkGraphHelpers {
  constructor(templateData) {
    this.templateData = templateData;
  }
  getNetworkJSON() {
    var enRichedJSON = this.enrichTemplate();
    var output = {
      nodes: [],
      groups: [],
      lines: [],
    };

    for (let entity of enRichedJSON.Services[0].to_Entity) {
      output.groups.push({
        key: entity.EntityTechnicalName,
        title: entity.EntityName,
      });

      var fieldList = {
        key: `field-${entity.EntityTechnicalName}`,
        title: "Fields",
        icon: "sap-icon://list",
        shape: "Box",
        group: entity.EntityTechnicalName,
        attributes: [],
      };
      for (let field of entity.to_Field) {
        if (field.FieldisKey) {
          output.nodes.push({
            key: `key-${entity.EntityTechnicalName}`,
            title: "Keys",
            icon: "sap-icon://primary-key",
            shape: "Box",
            group: entity.EntityTechnicalName,
            attributes: [
              {
                label: field.FieldLabel,
                value: field.FieldType,
              },
            ],
          });
          continue;
        }
        fieldList.attributes.push({
          label: field.FieldLabel,
          value: field.FieldType,
        });
      }
      output.nodes.push(fieldList);

      for (let valuehelp of entity.to_ValueHelp) {
        output.nodes.push({
          key: `valuehelp-${entity.EntityTechnicalName}-${valuehelp.ValueHelpTechnicalName}`,
          title: "Value Help",
          icon: "sap-icon://chain-link",
          shape: "Box",
          group: entity.EntityTechnicalName,
          attributes: [
            {
              label: valuehelp.ValueHelpLabel,
              value: valuehelp.ValueHelpEntity.EntityTechnicalName,
            },
          ],
        });
        output.lines.push({
          from: `valuehelp-${entity.EntityTechnicalName}-${valuehelp.ValueHelpTechnicalName}`,
          to: `key-${valuehelp.ValueHelpEntity.EntityTechnicalName}`,
        });
      }

      for (let relation of entity.EntityChildRelationships) {
        output.nodes.push({
          key: `assoc-${entity.EntityTechnicalName}-${relation.ChildEntityTechnicalName}`,
          title: "Association",
          icon: "sap-icon://key",
          shape: "Box",
          group: entity.EntityTechnicalName,
          attributes: [
            {
              label: relation.ChildEntityTechnicalName,
              value: relation.Type,
            },
          ],
        });
        output.lines.push({
          from: `assoc-${entity.EntityTechnicalName}-${relation.ChildEntityTechnicalName}`,
          to: `key-${relation.ChildEntityTechnicalName}`,
        });
      }
    }
    return output;
  }

  enrichTemplate() {
    var rootEntity = this.templateData.Services[0].to_Entity.find((item) => {
      return item.EntityIsRoot === true;
    });

    var contentEnricher = new ContentEnricher(
      this.templateData,
      rootEntity.EntityTechnicalName
    );
    return contentEnricher.getEnrichedTemplateData();
  }
};
