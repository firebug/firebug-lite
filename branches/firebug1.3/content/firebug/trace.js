FBL.ns(function() { with (FBL) {
// ************************************************************************************************

// ************************************************************************************************
// FBTrace API

FBL.FBTrace = {

    DBG_INITIALIZE: 1,
    DBG_ERRORS: 0,
    DBG_DISPATCH: 0,
    
    sysout: function()
    {
        return Firebug.FBTrace.logFormatted(arguments, "");
    },
    
    dumpProperties: function(title, object)
    {
        return Firebug.FBTrace.logFormatted("dumpProperties() not supported.", "warning");
    },
    
    dumpStack: function()
    {
        return Firebug.FBTrace.logFormatted("dumpStack() not supported.", "warning");
    }

}

// If application isn't in debug mode, the FBTrace panel won't be loaded
if (!application.isDebugMode) return;

// ************************************************************************************************
// FBTrace Module

Firebug.FBTrace = extend(Firebug.Console,
{
    getPanel: function()
    {
        return Firebug.chrome.getPanel("FBTrace");
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