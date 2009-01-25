FBL.ns(function() { with (FBL) {
// ************************************************************************************************


// ************************************************************************************************
// ChromeControl Module

var Chrome = Firebug.Control = 
{
    element: null,
    doc: null,
    win: null,
    
    controllers: null,
    references: null,
    
    drawSettings:
    {
        "vertical":
        {
            fps: { isIE: 40, other: 10 },
            timeout: 50,
            
            uses:
            [
                "vSplitter",
                "panelL"
            ],
            
            before: "",
            
            during:
            {
                isIE:
                [
                    "",
                    "",
                    ""
                ].join(""),
                
                isFirefox: "",
                other: ""
            },
            
            after: ""
        }
    },
    
    draw: null, // compiled function
    drawPart: null, // compiled object with functions
    
    
    
    
    create: function()
    {
    },
    
    destroy: function()
    {
    },
    
    addDocumentControllers: function()
    {
    },

    removeDocumentControllers: function()
    {
    },
    
    removeAllDocumentControllers: function()
    {
    },
    
    addControllers: function()
    {
    },
    
    removeControllers: function()
    {
    },
    
    addReferences: function()
    {
    },
    
    removeReferences: function()
    {
    },
    
    removeAllControllers: function()
    {
    },
    
    compile: function()
    {
    }
};


extend(Firebug.Control,
{

    draw: function()
    {
    },
	
    repaint: (function()
    {
        var fps = isIE ? 40 : 50;
        
        return isIE ?
            function()
            {
            }:
            function()
            {
            }
    })()
});



lastOnResize = null;
function onResize()
{
    if()
    {
    }
}

// ************************************************************************************************
}});