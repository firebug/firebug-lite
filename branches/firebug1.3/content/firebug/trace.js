FBL.ns(function() { with (FBL) {
// ************************************************************************************************


// ************************************************************************************************
// Console Module
Firebug.FBTrace = extend(Firebug.Console,
{

});

Firebug.registerModule(Firebug.FBTrace);


// ************************************************************************************************
// Console Panel

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
        
        fbConsole = this.panelNode;
        fbPanel1 = $("fbPanel1");
    },
    
    shutdown: function()
    {
        fbPanel1 =  null;
    }
    
});

Firebug.registerPanel(FBTracePanel);

//********************************************************************************************

var fbConsole = null;
var fbPanel1 = null;

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *


// ************************************************************************************************
}});