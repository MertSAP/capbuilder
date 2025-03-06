sap.ui.define(["sap/m/MessageToast"], function (MessageToast) {
  "use strict";

  return {
    onDownloadPress: function (oEvent) {
      if (oEvent.getProperty("IsActiveEntity")) {
        var sUrl = "/processor" + oEvent.getPath() + "/downloadTemplate()"; // Adjust this URL based on your CAP service

        // Create a hidden link element
        var oLink = document.createElement("a");
        oLink.href = sUrl;
        oLink.download = "downloadTemplate.json"; // Suggested file name
        document.body.appendChild(oLink);
        oLink.click();
        document.body.removeChild(oLink);
      } else {
        sap.m.MessageToast.show("Please save before downloading!");
      }
    },
  };
});
