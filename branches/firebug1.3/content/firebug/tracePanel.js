FBL.ns(function() { with (FBL) {
// ************************************************************************************************

// If application isn't in trace mode, the FBTrace panel won't be loaded
if (!Env.isTraceMode) return;

// ************************************************************************************************
// FBTrace Module

Firebug.Trace = extend(Firebug.Module,
{
    getPanel: function()
    {
        return Firebug.chrome ? Firebug.chrome.getPanel("Trace") : null;
    },
    
    clear: function()
    {
        this.getPanel().contentNode.innerHTML = "";
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
        hasToolButtons: true,
        innerHTMLSync: true
    },
    
    create: function(){
        Firebug.Panel.create.apply(this, arguments);
        
        this.clearButton = new Button({
            caption: "Clear",
            title: "Clear FBTrace logs",            
            module: Firebug.Trace,
            onClick: Firebug.Trace.clear
        });
    },
    
    initialize: function(){
        Firebug.Panel.initialize.apply(this, arguments);
        
        this.clearButton.initialize();
    }
    
});

Firebug.registerPanel(TracePanel);

// ************************************************************************************************
}});