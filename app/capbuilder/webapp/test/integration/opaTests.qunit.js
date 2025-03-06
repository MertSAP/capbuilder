sap.ui.require(
    [
        'sap/fe/test/JourneyRunner',
        'mert/capbuilder/app/capbuilder/test/integration/FirstJourney',
		'mert/capbuilder/app/capbuilder/test/integration/pages/ServiceList',
		'mert/capbuilder/app/capbuilder/test/integration/pages/ServiceObjectPage',
		'mert/capbuilder/app/capbuilder/test/integration/pages/EntityObjectPage'
    ],
    function(JourneyRunner, opaJourney, ServiceList, ServiceObjectPage, EntityObjectPage) {
        'use strict';
        var JourneyRunner = new JourneyRunner({
            // start index.html in web folder
            launchUrl: sap.ui.require.toUrl('mert/capbuilder/app/capbuilder') + '/index.html'
        });

       
        JourneyRunner.run(
            {
                pages: { 
					onTheServiceList: ServiceList,
					onTheServiceObjectPage: ServiceObjectPage,
					onTheEntityObjectPage: EntityObjectPage
                }
            },
            opaJourney.run
        );
    }
);