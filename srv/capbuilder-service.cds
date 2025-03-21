using {mert.capbuilder as my} from '../db/schema';


service CAPBuilderService @(path: '/processor') {

    action   loadTemplate(fileContents : String) returns Service;
    action   createWithAIPrompt(prompt : String) returns Service;
    function getAIStatus()                       returns Boolean;
    action   configureAIKEY(key : String);

    entity Service           as projection on my.Service
        actions {
            function downloadTemplate()    returns Binary;
            function downloadProject()     returns Binary;
            function livePreviewUpdate()   returns String;
            action   generateData()        returns Boolean;
            function getNetworkGraphData() returns String;
        };


    entity Action            as projection on my.Action
        actions {
            action ActionPrefillLabel();

        };

    entity ActionParameter   as projection on my.ActionParameter
        actions {
            action ActionParamPrefillLabel();

        };

    entity Field             as projection on my.Field
        actions {
            action prefillLabel();
        };

    entity Facet             as projection on my.Facet
        actions {
            action FacetPrefillLabel();
        };

    entity ValueHelp         as projection on my.ValueHelp
        actions {
            action ValueHelpPrefillLabel();
        };

    entity ServiceRole       as projection on my.ServiceRole
        actions {
            action fillEntities( @(
                                     title:'Auth Type',
                                     Common:{
                                         ValueListWithFixedValues: true,
                                         ValueList               : {
                                             Label         : '{i18n>ServiceAuth}',
                                             CollectionPath: 'AuthorisationType',
                                             Parameters    : [{
                                                 $Type            : 'Common.ValueListParameterInOut',
                                                 ValueListProperty: 'AuthorisationType',
                                                 LocalDataProperty: AuthorisationType
                                             }]
                                         }
                                     }
                                 )
                                 AuthorisationType : String(30));
        };

    entity ServiceAuth       as projection on my.ServiceAuth;
    entity AssociationType   as projection on my.AssociationType;
    entity FieldType         as projection on my.FieldType;
    entity InputType         as projection on my.InputType;
    entity AuthorisationType as projection on my.AuthorisationType;

    entity DraftFacets {
        key FacetUUID            : UUID;
            FacetTechnicalName   : String(20);
            to_Entity_EntityUUID : UUID;
            FacetLabel           : String(20);
    }

    entity DraftEntity {
        key EntityUUID              : UUID;
            EntityTechnicalName     : String(30);
            EntityName              : String(30);
            to_Service_ServiceUUID  : UUID;
            to_ServiceRole_RoleUUID : UUID;
    }

    entity DraftField {
        key FieldUUID            : UUID;
            FieldTechnicalName   : String(30);
            FieldLabel           : String(30);
            to_Entity_EntityUUID : UUID;
    }

}
