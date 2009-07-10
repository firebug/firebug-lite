FBL.ns(function() { with (FBL) {
// ************************************************************************************************

// ************************************************************************************************
// FBTrace API

FBL.FBTrace = {

    DBG_INITIALIZE: 1,
    DBG_ERRORS: 1,
    DBG_DISPATCH: 1,
    
    sysout: function()
    {
        var now = new Date();
        var ms = ""+(now.getMilliseconds()/1000).toFixed(3);
        ms = ms.substr(2);
        
        var time = [now.toLocaleTimeString() + "." + ms + " : "];
        
        var args = Array.prototype.concat.apply(time, arguments);
        return Firebug.FBTrace.logFormatted(args, "");
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
        return Firebug.chrome ? Firebug.chrome.getPanel("FBTrace") : null;
    }
});

Firebug.FBTrace.create();

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