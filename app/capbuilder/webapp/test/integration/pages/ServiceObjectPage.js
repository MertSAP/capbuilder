sap.ui.define(['sap/fe/test/ObjectPage'], function(ObjectPage) {
    'use strict';

    var CustomPageDefinitions = {
        actions: {},
        assertions: {}
    };

    return new ObjectPage(
        {
            appId: 'mert.capbuilder.app.capbuilder',
            componentId: 'ServiceObjectPage',
            contextPath: '/Service'
        },
        CustomPageDefinitions
    );
});