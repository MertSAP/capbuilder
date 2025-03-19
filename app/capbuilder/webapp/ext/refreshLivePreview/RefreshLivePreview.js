sap.ui.define(["sap/m/MessageToast"], function (MessageToast) {
  "use strict";

  return {
    refreshLivePreview: function (oEvent) {
      fetch(`/processor/${oEvent.getPath()}/livePreviewUpdate()`, {
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
        .then(() => {
          MessageToast.show("Preview Refreshed");
        })
        .catch((error) => {
          console.error("Fetch Error:", error); // Handle errors
        });
    },
  };
});
