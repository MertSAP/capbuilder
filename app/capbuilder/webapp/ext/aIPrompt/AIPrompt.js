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
            .catch((error) => {
              sap.m.MessageToast.show("An Error Occured!");
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
      showAIDialog: function (oBindingContext, aSelectedContexts) {
        this.loadFragment({
          id: "AIPrompt",
          name: "mert.capbuilder.app.capbuilder.ext.view.AIPrompt",
          controller: _createUploadController(this),
        }).then(function (oDialog) {
          oDialog.open();
        });
      },
    };
  }
);
