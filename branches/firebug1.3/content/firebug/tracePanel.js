FBL.ns(function() { with (FBL) {
// ************************************************************************************************

// If application isn't in debug mode, the FBTrace panel won't be loaded
if (!application.isDebugMode) return;

// ************************************************************************************************
// FBTrace Module

Firebug.FBTrace = extend(Firebug.Module,
{
    getPanel: function()
    {
        return Firebug.chrome ? Firebug.chrome.getPanel("FBTrace") : null;
    }
});

Firebug.registerModule(Firebug.FBTrace);


// ************************************************************************************************
// FBTrace Panel

function FBTracePanel(){};

FBTracePanel.prototype = extend(Firebug.Panel,
{
    name: "FBTrace",
    title: "FBTrace",
    
    options: {
        hasCommandLine: true,
        hasSidePanel: true
    },
    
    initialize: function(){
        Firebug.Panel.initialize.apply(this, arguments);
    }
    
});

Firebug.registerPanel(FBTracePanel);

// ************************************************************************************************
}});