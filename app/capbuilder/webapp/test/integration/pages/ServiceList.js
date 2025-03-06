sap.ui.define(['sap/fe/test/ListReport'], function(ListReport) {
    'use strict';

    var CustomPageDefinitions = {
        actions: {},
        assertions: {}
    };

    return new ListReport(
        {
            appId: 'mert.capbuilder.app.capbuilder',
            componentId: 'ServiceList',
            contextPath: '/Service'
        },
        CustomPageDefinitions
    );
});