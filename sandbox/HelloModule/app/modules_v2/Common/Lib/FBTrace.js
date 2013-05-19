/* See license.txt for terms of usage */

define("Lib/FBTrace", ["FBL"], function(FBL) {

// ********************************************************************************************* //
// Module Implementation

// We need to use the console object in case of the web page that doesn't have proper
// privileges to use Components.utils

var FBTrace = FBL.FBTrace =
{
    sysout: function()
    {
        if (typeof(console.log) == "function")
            console.log.apply(console, arguments);
    }
};

try
{
    var FirebugTrace = {};
    Components.utils["import"]("resource://firebug/firebug-trace-service.js", FirebugTrace);
    FBTrace = FBL.FBTrace = FirebugTrace.traceConsoleService.getTracer("extensions.firebug");
}
catch (e)
{
}

// ********************************************************************************************* //
// Exported Symbols

return FBL;

// ********************************************************************************************* //
});
