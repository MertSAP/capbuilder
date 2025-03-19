sap.ui.define([], function () {
  "use strict";

  function _createUploadController(oExtensionAPI) {
    var oUploadDialog;

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

      handleFiles: function (oEvent) {
        var oFile = oEvent.getParameters().files["0"];

        // eslint-disable-next-line no-undef
        var reader = new FileReader();

        reader.onload = function (e) {
          var fileContent = e.target.result; // File content as a string

          var body = {
            fileContents: fileContent,
          };
          var sUrl = "/processor/loadTemplate";
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
              sap.m.URLHelper.redirect(
                `#/Service(ServiceUUID=${data.ServiceUUID},IsActiveEntity=true)`,
                false
              );
              sap.m.MessageToast.show("Service Created Successfully!");
            })
            .catch(() => {
              sap.m.MessageToast.show("An Error Occured!");
            });
        };

        reader.onerror = function () {
          sap.m.MessageToast.show("Error Reading the file!");
        };
        reader.readAsText(oFile);
      },
      onCancel: function () {
        closeDialog();
      },
    };
  }

  return {
    showUploadDialog: function () {
      this.loadFragment({
        id: "UploadDialog",
        name: "mert.capbuilder.app.capbuilder.ext.view.UploadFile",
        controller: _createUploadController(this),
      }).then(function (oDialog) {
        oDialog.open();
      });
    },
  };
});
