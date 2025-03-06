sap.ui.define(['sap/fe/test/ObjectPage'], function(ObjectPage) {
    'use strict';

    var CustomPageDefinitions = {
        actions: {},
        assertions: {}
    };

    return new ObjectPage(
        {
            appId: 'mert.capbuilder.app.capbuilder',
            componentId: 'EntityObjectPage',
            contextPath: '/Service/to_Entity'
        },
        CustomPageDefinitions
    );
});