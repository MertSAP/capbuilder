sap.ui.define(
  ["sap/m/MessageBox", "sap/m/MessageToast"],
  function (MessageBox, MessageToast) {
    "use strict";

    function _createUploadController(oExtensionAPI) {
      var oUploadDialog;
      var oTextArea;
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
        return sap.ui.core.Fragment.byId("AIPrompt", sId);
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

        onOk: function (oEvent) {
          setDialogBusy(true);
          // var oTextArea = this.byId("largeTextInput");
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
      showAIKeyDialog: function (oBindingContext, aSelectedContexts) {
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
  }
);
