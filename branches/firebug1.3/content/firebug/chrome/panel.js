FBL.ns(function() { with (FBL) {
// ************************************************************************************************

Firebug.Chrome.Panel = 
{
    element: null,
    
    initialize: function()
    {
    },
    
    draw: null,
    drawX: null,
    drawY: null
};

Firebug.Panel = 
{
    Left: null,
    Right: null,

    name: "HelloWorld",
    title: "Hello World!",
    
    initialize: function()
    {
        //Firebug.Panel.initialize.apply(this, arguments);
    },
    
    toggleCommandLine: function()
    {
    },

    toggleRightPanel: function()
    {
    }
    
};


Firebug.PanelManager = 
{
    register: function()
    {
    },
    
    open: function()
    {
    },
    
    clone: function()
    {
    }
    
};

Firebug.registerPanel = Firebug.PanelManager.register;

// ************************************************************************************************
}});