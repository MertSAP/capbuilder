using CAPBuilderService as service from '../../srv/capbuilder-service';

annotate CAPBuilderService.Field with @() actions {
    prefillLabel                      @(Common.SideEffects.TargetProperties: ['in/FieldLabel'], );
}

annotate CAPBuilderService.Action with @() actions {
    ActionPrefillLabel                 @(Common.SideEffects.TargetProperties: ['in/ActionLabel'], );
}

annotate CAPBuilderService.ActionParameter with @() actions {
    ActionParamPrefillLabel                     @(Common.SideEffects.TargetProperties: ['in/ActionParameterLabel'], );
}

annotate CAPBuilderService.Facet with @() actions {
    FacetPrefillLabel                 @(Common.SideEffects.TargetProperties: ['in/FacetLabel'], );
}


annotate CAPBuilderService.ValueHelp with @() actions {
    ValueHelpPrefillLabel                 @(Common.SideEffects.TargetProperties: ['in/ValueHelpLabel'], );
}

annotate CAPBuilderService.ServiceRole with @() actions {
    fillEntities                            @(Common.SideEffects.TargetProperties: ['in/to_ServiceAuth'], );
}


annotate CAPBuilderService.Entity with @(Common.SideEffects: {
    SourceEntities: [
        to_Field,
        to_Action,
        to_Facet,
        to_ValueHelp
    ],
    TargetEntities: [
        to_Field,
        to_Action,
        to_Facet,
        to_ValueHelp
    ]
});
