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

      onOk: function () {
        closeDialog();
      },
      onCancel: function () {
        closeDialog();
      },
    };
  }

  return {
    showLiveDialog: function (oBindingContext) {
      this.loadFragment({
        id: "LivePreview",
        name: "mert.capbuilder.app.capbuilder.ext.view.LivePreview",
        controller: _createUploadController(this),
      }).then(function (oDialog) {
        var oModel = new sap.ui.model.json.JSONModel({
          configMessage: "No API Key is currently configured",
        });

        fetch(`/processor/${oBindingContext.getPath()}/livePreviewUpdate()`, {
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
            oModel.setProperty(
              "/directory",
              `cd "${data.value.watchDirectory}"`
            );
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
