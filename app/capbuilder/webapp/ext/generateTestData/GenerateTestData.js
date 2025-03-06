sap.ui.define(["sap/m/MessageToast"], function (MessageToast) {
  "use strict";

  return {
    generateTestData: function (oEvent) {
      if (!oEvent.getProperty("IsActiveEntity")) {
        sap.m.MessageToast.show("Please save before generating test data!");
        return;
      }

      var sUrl = "/processor" + oEvent.getPath() + "/generateData"; // Adjust this URL based on your CAP service
      sap.m.MessageToast.show(
        "Sending Request, This can take several minutes!"
      );
      fetch(sUrl, {
        method: "POST",
        body: {},
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
          if (data.value.success) {
            sap.m.MessageToast.show("Data Created Successfully!");
          } else {
            sap.m.MessageToast.show("Data error occured!");
          }
        })
        .catch((error) => {
          sap.m.MessageToast.show("An Error Occured!");
        });
    },
  };
});
