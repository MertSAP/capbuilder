sap.ui.define(
  ["sap/m/MessageBox", "sap/m/MessageToast"],
  function (MessageBox, MessageToast) {
    "use strict";

    function _createUploadController(oExtensionAPI) {
      var oUploadDialog;

      function setOkButtonEnabled(bOk) {
        oUploadDialog && oUploadDialog.getBeginButton().setEnabled(bOk);
      }

      function setDialogBusy(bBusy) {
        oUploadDialog.setBusy(bBusy);
      }

      function closeDialog() {
        oUploadDialog && oUploadDialog.close();
      }

      function showError(sMessage) {
        MessageBox.error(sMessage || "Upload failed");
      }

      // TODO: Better option for this?
      function byId(sId) {
        return sap.ui.core.Fragment.byId("UploadDialog", sId);
      }

      return {
        onBeforeOpen: function (oEvent) {
          oUploadDialog = oEvent.getSource();
          oExtensionAPI.addDependent(oUploadDialog);
        },

        onAfterClose: function (oEvent) {
          oExtensionAPI.removeDependent(oUploadDialog);
          oUploadDialog.destroy();
          oUploadDialog = undefined;
        },

        handleFiles: function (oEvent) {
          var oFile = oEvent.getParameters().files["0"];

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
              .catch((error) => {
                sap.m.MessageToast.show("An Error Occured!");
              });
            // Process file content (e.g., parse JSON, display, etc.)
          };

          reader.onerror = function (error) {
            sap.m.MessageToast.show("Error Reading the file!");
          };
          reader.readAsText(oFile);
        },
        onCancel: function (oEvent) {
          closeDialog();
        },

        onTypeMismatch: function (oEvent) {
          var sSupportedFileTypes = oEvent
            .getSource()
            .getFileType()
            .map(function (sFileType) {
              return "*." + sFileType;
            })
            .join(", ");

          showError(
            "The file type *." +
              oEvent.getParameter("fileType") +
              " is not supported. Choose one of the following types: " +
              sSupportedFileTypes
          );
        },

        onFileAllowed: function (oEvent) {
          setOkButtonEnabled(true);
        },

        onFileEmpty: function (oEvent) {
          setOkButtonEnabled(false);
        },

        onUploadComplete: function (oEvent) {
          var iStatus = oEvent.getParameter("status");
          var oFileUploader = oEvent.getSource();

          oFileUploader.clear();
          setOkButtonEnabled(false);
          setDialogBusy(false);

          if (iStatus >= 400) {
            var oRawResponse = JSON.parse(oEvent.getParameter("responseRaw"));
            showError(
              oRawResponse && oRawResponse.error && oRawResponse.error.message
            );
          } else {
            MessageToast.show("Uploaded successfully");
            oExtensionAPI.refresh();
            closeDialog();
          }
        },
      };
    }

    return {
      showUploadDialog: function (oBindingContext, aSelectedContexts) {
        this.loadFragment({
          id: "UploadDialog",
          name: "mert.capbuilder.app.capbuilder.ext.view.UploadFile",
          controller: _createUploadController(this),
        }).then(function (oDialog) {
          oDialog.open();
        });
      },
    };
  }
);
