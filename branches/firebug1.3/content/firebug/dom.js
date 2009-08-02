FBL.ns(function() { with (FBL) {
// ************************************************************************************************

// ************************************************************************************************
// DOM Module

Firebug.DOM = extend(Firebug.Module,
{
    getPanel: function()
    {
        return Firebug.chrome ? Firebug.chrome.getPanel("DOM") : null;
    },
    
    dir: function(object)
    {
        var html = [];
                    
        var pairs = [];
        for (var name in object)
        {
            try
            {
                pairs.push([name, object[name]]);
            }
            catch (exc)
            {
            }
        }
        
        pairs.sort(function(a, b) { return a[0] < b[0] ? -1 : 1; });
        
        html.push('<div class="log-object">');
        for (var i = 0; i < pairs.length; ++i)
        {
            var name = pairs[i][0], value = pairs[i][1];
            
            html.push('<div class="property">', 
                '<div class="propertyValueCell"><span class="propertyValue">');
                
            Firebug.Reps.appendObject(value, html);
            
            html.push('</span></div><div class="propertyNameCell"><span class="propertyName">',
                escapeHTML(name), '</span></div>'); 
            
            html.push('</div>');
        }
        html.push('</div>');
        
        this.getPanel().contentNode.innerHTML = html.join("");
    }    
});

Firebug.registerModule(Firebug.DOM);


// ************************************************************************************************
// FBTrace Panel

function DOMPanel(){};

DOMPanel.prototype = extend(Firebug.Panel,
{
    name: "DOM",
    title: "DOM",
    
    options: {
        hasToolButtons: true
    },
    
    create: function(){
        Firebug.Panel.create.apply(this, arguments);
        /*
        this.clearButton = new Firebug.Button({
            caption: "Clear",
            title: "Clear FBTrace logs",            
            module: Firebug.Trace,
            onClick: Firebug.Trace.clear
        });
        /**/
        
        this.panelNode.style.padding = "4px 3px 1px 15px";
        
        Firebug.DOM.dir(window);
    },
    
    initialize: function(){
        Firebug.Panel.initialize.apply(this, arguments);
        
        //this.clearButton.initialize();
    }
    
});

Firebug.registerPanel(DOMPanel);

// ************************************************************************************************
}});