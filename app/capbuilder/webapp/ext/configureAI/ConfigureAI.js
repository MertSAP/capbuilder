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

        var sText = sap.ui.core.Fragment.byId("APIKey", "keyInput");

        var body = {
          key: sText.getValue(),
        };
        var sUrl = "/processor/configureAIKEY";
        fetch(sUrl, {
          method: "POST",
          body: JSON.stringify(body),
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }).then((response) => {
          if (response.ok) {
            sap.m.MessageToast.show("Configured successfully!");
            closeDialog();
          } else {
            sap.m.MessageToast.show("Configuration failed!");
            setDialogBusy(false);
          }
        });
      },
      onCancel: function () {
        closeDialog();
      },
    };
  }

  return {
    showAIKeyDialog: function () {
      this.loadFragment({
        id: "APIKey",
        name: "mert.capbuilder.app.capbuilder.ext.view.APIKey",
        controller: _createUploadController(this),
      }).then(function (oDialog) {
        var oModel = new sap.ui.model.json.JSONModel({
          configMessage: "No API Key is currently configured",
        });

        fetch("/processor/getAIStatus()", {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        })
          .then((response) => {
            if (response.ok) {
              return response.json(); // Parse the response as JSON
            } else {
              throw new Error(`HTTP error! Status: ${response.status}`);
            }
          })
          .then((data) => {
            if (data.value.configured) {
              oModel.setProperty(
                "/configMessage",
                "API Key has been successfully configured"
              );
            }
          })
          .catch((error) => {
            console.error("Fetch Error:", error); // Handle errors
          });

        oDialog.setModel(oModel, "customModel");
        oDialog.open();
      });
    },
  };
});
