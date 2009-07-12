FBL.ns(function() { with (FBL) {
// ************************************************************************************************

// If application isn't in debug mode, the FBTrace panel won't be loaded
if (!Application.isDebugMode) return;

// ************************************************************************************************
// FBTrace Module

Firebug.Trace = extend(Firebug.Module,
{
    getPanel: function()
    {
        return Firebug.chrome ? Firebug.chrome.getPanel("Trace") : null;
    }
});

Firebug.registerModule(Firebug.Trace);


// ************************************************************************************************
// FBTrace Panel

function TracePanel(){};

TracePanel.prototype = extend(Firebug.Panel,
{
    name: "Trace",
    title: "Trace",
    
    options: {
        //hasSidePanel: true,
        //hasCommandLine: true
    },
    
    initialize: function(){
        Firebug.Panel.initialize.apply(this, arguments);
    }
    
});

Firebug.registerPanel(TracePanel);

// ************************************************************************************************
}});