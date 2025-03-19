sap.ui.define([], function () {
  "use strict";

  function _createUploadController(oExtensionAPI) {
    var oUploadDialog;

    function setDialogBusy(bBusy) {
      oUploadDialog.setBusy(bBusy);
    }

    function closeDialog() {
      oUploadDialog && oUploadDialog.close();
    }

    return {
      onBeforeOpen: function (oEvent) {
        oUploadDialog = oEvent.getSource();
        oExtensionAPI.addDependent(oUploadDialog);
      },

      onAfterClose: function () {
        oExtensionAPI.removeDependent(oUploadDialog);
        oUploadDialog.destroy();
        oUploadDialog = undefined;
      },

      onOk: function () {
        setDialogBusy(true);

        var sText = sap.ui.core.Fragment.byId("AIPrompt", "promptText");

        var textPrompt = sText.getValue();
        var textPromptCleaned = textPrompt
          .replace(/\\n/g, "\\n")
          .replace(/\\'/g, "\\'")
          .replace(/\\"/g, '\\"')
          .replace(/\\&/g, "\\&")
          .replace(/\\r/g, "\\r")
          .replace(/\\t/g, "\\t")
          .replace(/\\b/g, "\\b")
          .replace(/\\f/g, "\\f");

        var body = {
          prompt: textPromptCleaned,
        };
        var sUrl = "/processor/createWithAIPrompt";
        sap.m.MessageToast.show(
          "Sending Request. This can take several minutes!"
        );
        fetch(sUrl, {
          method: "POST",
          body: JSON.stringify(body),
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        })
          .then((response) => {
            if (response.ok) {
              return response.json(); // Parse the response as JSON
            } else {
              sap.m.MessageToast.show("An Error Occured!");
            }
          })
          .then((data) => {
            sap.m.MessageToast.show("Service Created Successfully!");
            sap.m.URLHelper.redirect(
              `#/Service(ServiceUUID=${data.ServiceUUID},IsActiveEntity=true)`,
              false
            );
          })
          .catch(() => {
            sap.m.MessageToast.show("An Error Occured!");
          });
      },
      onCancel: function () {
        closeDialog();
      },
    };
  }

  return {
    showAIDialog: function () {
      this.loadFragment({
        id: "AIPrompt",
        name: "mert.capbuilder.app.capbuilder.ext.view.AIPrompt",
        controller: _createUploadController(this),
      }).then(function (oDialog) {
        oDialog.open();
      });
    },
  };
});
