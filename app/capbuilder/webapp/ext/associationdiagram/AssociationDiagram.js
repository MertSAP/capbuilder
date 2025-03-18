sap.ui.define(
  ["sap/m/MessageToast", "sap/ui/model/json/JSONModel"],
  function (MessageToast, JSONModel) {
    "use strict";

    return {
      onLoaded: function (oEvent) {
        var sUrl =
          "/processor" +
          oEvent.getBindingContext().getPath() +
          "/getNetworkGraphData()";
        var oSettingModel = new JSONModel({ displayGraph: false });
        if (sUrl.includes("IsActiveEntity=true")) {
          fetch(sUrl, {
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
              if (data.value) {
                var oModel = new JSONModel();
                oModel.setData(data.value);
                oEvent.setModel(oModel, "graph");
                oSettingModel.setProperty("/displayGraph", true);
                oEvent.setModel(oSettingModel, "settings");
              }
            })
            .catch((error) => {
              console.error("Fetch Error:", error); // Handle errors
            });
        } else {
          oEvent.setModel(oSettingModel, "settings");
        }
      },
    };
  }
);
