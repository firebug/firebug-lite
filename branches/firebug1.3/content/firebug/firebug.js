FBL.ns(function() { with (FBL) {
// ************************************************************************************************

// ************************************************************************************************
// Globals

FBL.cacheID = "___FBL_";
FBL.documentCache = {};

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
// Internals

var modules = [];
var panelTypes = [];

var panelTypeMap = {};


// ************************************************************************************************
// Firebug

FBL.Firebug =  
{
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    version: "Firebug Lite 1.3.0a",
    revision: "$Revision$",
    
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    modules: modules,
    panelTypes: panelTypes,
    chromeMap: {},
    
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // Initialization
    
    initializeContext: function(chrome)
    {
        
    },
    
    initialize: function()
    {
        if (FBTrace.DBG_INITIALIZE) FBTrace.sysout("Firebug.initialize", "initializing application");
        
        Firebug.browser = new Context(Application.browser);
        Firebug.context = Firebug.browser;
        
        // Document must be cached before chrome initialization
        Firebug.cacheDocument();
        
        FirebugChrome.initialize();
        
        dispatch(modules, "initialize", []);
    },
  
    shutdown: function()
    {
        documentCache = {};
        
        dispatch(modules, "shutdown", []);
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // Registration

    registerModule: function()
    {
        modules.push.apply(modules, arguments);

        if (FBTrace.DBG_INITIALIZE) FBTrace.sysout("Firebug.registerModule");
    },

    registerPanel: function()
    {
        panelTypes.push.apply(panelTypes, arguments);

        for (var i = 0; i < arguments.length; ++i)
            panelTypeMap[arguments[i].prototype.name] = arguments[i];
        
        if (FBTrace.DBG_INITIALIZE)
            for (var i = 0; i < arguments.length; ++i)
                FBTrace.sysout("Firebug.registerPanel", arguments[i].prototype.name);
    },
    
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // Other methods
    
    cacheDocument: function()
    {
        var els = Firebug.browser.document.getElementsByTagName("*");
        for (var i=0, l=els.length, el; i<l; i++)
        {
            el = els[i];
            el[cacheID] = i;
            documentCache[i] = el;
        }
    }
};

// ************************************************************************************************
// Controller

Firebug.Controller = {
        
    controllers: null,
    controllerContext: null,
    
    initialize: function(context)
    {
        this.controllers = [];
        this.controllerContext = context || Firebug.chrome;
    },
    
    shutdown: function()
    {
        this.removeControllers();
    },
    
    addController: function()
    {
        for (var i=0, arg; arg=arguments[i]; i++)
        {
            // If the first argument is a string, make a selector query 
            // within the controller node context
            if (typeof arg[0] == "string")
            {
                arg[0] = $$(arg[0], this.controllerContext);
            }
            
            // bind the handler to the proper context
            var handler = arg[2];
            arg[2] = bind(this, handler);
            // save the original handler as an extra-argument, so we can
            // look for it later, when removing a particular controller            
            arg[3] = handler;
            
            this.controllers.push(arg);
            addEvent.apply(this, arg);
        }
    },
    
    removeController: function()
    {
        for (var i=0, arg; arg=arguments[i]; i++)
        {
            for (var j=0, c; c=this.controllers[j]; j++)
            {
                if (arg[0] == c[0] && arg[1] == c[1] && arg[2] == c[3])
                    removeEvent.apply(this, c);
            }
        }
    },
    
    removeControllers: function()
    {
        for (var i=0, c; c=this.controllers[i]; i++)
        {
            removeEvent.apply(this, c);
        }
    }
};


// ************************************************************************************************
// Module

Firebug.Module =
{
    /**
     * Called when the window is opened.
     */
    initialize: function()
    {
    },
  
    /**
     * Called when the window is closed.
     */
    shutdown: function()
    {
    },
  
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
  
    /**
     * Called when a new context is created but before the page is loaded.
     */
    initContext: function(context)
    {
    },
  
    /**
     * Called after a context is detached to a separate window;
     */
    reattachContext: function(browser, context)
    {
    },
  
    /**
     * Called when a context is destroyed. Module may store info on persistedState for reloaded pages.
     */
    destroyContext: function(context, persistedState)
    {
    },
  
    // Called when a FF tab is create or activated (user changes FF tab)
    // Called after context is created or with context == null (to abort?)
    showContext: function(browser, context)
    {
    },
  
    /**
     * Called after a context's page gets DOMContentLoaded
     */
    loadedContext: function(context)
    {
    },
  
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
  
    showPanel: function(browser, panel)
    {
    },
  
    showSidePanel: function(browser, panel)
    {
    },
  
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
  
    updateOption: function(name, value)
    {
    },
  
    getObjectByURL: function(context, url)
    {
    }
};

// ************************************************************************************************
// Panel

Firebug.Panel =
{
    name: "HelloWorld",
    title: "Hello World!",
    parentPanel: null,
    
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    
    options: {
        hasCommandLine: false,
        hasSidePanel: false,
        hasStatusBar: false,
        hasToolButtons: false,
        
        // Pre-rendered panels are those included in the skin file (firebug.html)
        isPreRendered: false,
        
        // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
        // To be used by external extensions
        panelHTML: "",
        panelCSS: "",
        
        toolButtonsHTML: ""
    },
    
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    
    tabNode: null,
    panelNode: null,
    sidePanelNode: null,
    statusBarNode: null,
    toolButtonsNode: null,

    panelBarNode: null,
    
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    
    panelBar: null,
    
    commandLine: null,
    
    toolButtons: null,
    statusBar: null,

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    
    searchable: false,
    editable: true,
    order: 2147483647,
    statusSeparator: "<",
    
    create: function(context, doc)
    {
        var options = this.options = extend(Firebug.Panel.options, this.options);
        var panelId = "fb" + this.name;
        
        if (options.isPreRendered)
        {
            this.panelNode = $(panelId);
            
            this.tabNode = $(panelId + "Tab");
            this.tabNode.style.display = "block";
            
            if (options.hasSidePanel)
            {
                //this.sidePanelNode = $(panelId + "StatusBar");
            }
            
            if (options.hasStatusBar)
            {
                this.statusBarBox = $("fbStatusBarBox");
                this.statusBarNode = $(panelId + "StatusBar");
            }
            
            if (options.hasToolButtons)
            {
                this.toolButtonsNode = $(panelId + "Buttons");
            }
            
        }
        else
        {
            // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
            // Create Panel
            var panelNode = this.panelNode = createElement("div", {
                id: panelId,
                className: "fbPanel"
            });

            $("fbPanel1").appendChild(panelNode);
            
            // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
            // Create Panel Tab
            var tabHTML = '<span class="fbTabL"></span><span class="fbTabText">' +
                    this.title + '</span><span class="fbTabR"></span>';            
            
            var tabNode = this.tabNode = createElement("a", {
                id: panelId + "Tab",
                className: "fbTab",
                innerHTML: tabHTML
            });
            
            if (isIE6)
            {
                tabNode.href = "javascript:void(0)";
            }
            
            $("fbPanelBar1").appendChild(tabNode);
            this.tabNode.style.display = "block";
            
            // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
            // create SidePanel
            
            // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
            // create StatusBar
            
            // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
            // create ToolButtons
        }
        
        var panelContent = this.panelContent = createElement("div");
        this.panelNode.appendChild(panelContent);
        
        this.panelContainer = this.panelNode.parentNode;
        
        if (FBTrace.DBG_INITIALIZE)
            FBTrace.sysout("Firebug.Panel.initialize", this.name);
        
        /*
        this.context = context;
        this.document = doc;

        this.panelNode = doc.createElement("div");
        this.panelNode.ownerPanel = this;

        setClass(this.panelNode, "panelNode panelNode-"+this.name+" contextUID="+context.uid);
        doc.body.appendChild(this.panelNode);

        if (FBTrace.DBG_INITIALIZE)
            FBTrace.sysout("firebug.initialize panelNode for "+this.name+"\n");

        this.initializeNode(this.panelNode);
        /**/
    },

    destroy: function(state) // Panel may store info on state
    {
        if (FBTrace.DBG_INITIALIZE)
            FBTrace.sysout("Firebug.Panel.destroy", this.name);

        if (this.panelNode)
            delete this.panelNode.ownerPanel;

        this.destroyNode();
    },
    
    initialize: function()
    {
        var options = this.options = extend(Firebug.Panel.options, this.options);
        var panelId = "fb" + this.name;
        
        this.panelNode = $(panelId);
        
        this.tabNode = $(panelId + "Tab");
        this.tabNode.style.display = "block";
        
        if (options.hasSidePanel)
        {
            //this.sidePanelNode = $(panelId + "StatusBar");
        }
        
        if (options.hasStatusBar)
        {
            this.statusBarBox = $("fbStatusBarBox");
            this.statusBarNode = $(panelId + "StatusBar");
        }
        
        if (options.hasToolButtons)
        {
            this.toolButtonsNode = $(panelId + "Buttons");
        }
            
        this.panelContainer = this.panelNode.parentNode;
    },
    
    shutdown: function()
    {
        
    },

    detach: function(oldChrome, newChrome)
    {
        this.lastScrollTop = this.panelNode.scrollTop;
    },

    reattach: function(doc)
    {
        this.document = doc;

        if (this.panelNode)
        {
            this.panelNode = doc.adoptNode(this.panelNode, true);
            this.panelNode.ownerPanel = this;
            doc.body.appendChild(this.panelNode);
            this.panelNode.scrollTop = this.lastScrollTop;
            delete this.lastScrollTop;
        }
    },

    show: function(state)
    {
        var options = this.options;
        
        if (options.hasSidePanel)
        {
            //this.sidePanelNode = $(panelId + "StatusBar");
        }
        
        if (options.hasStatusBar)
        {
            this.statusBarBox.style.display = "inline";
            this.statusBarNode.style.display = "inline";
        }
        
        if (options.hasToolButtons)
        {
            this.toolButtonsNode.style.display = "inline";
        }
        
        this.panelNode.style.display = "block";
        
        Firebug.chrome.layout(this);
    },

    hide: function(state)
    {
        var options = this.options;
        
        if (options.hasSidePanel)
        {
            //this.sidePanelNode = $(panelId + "StatusBar");
        }
        
        if (options.hasStatusBar)
        {
            this.statusBarBox.style.display = "none";
            this.statusBarNode.style.display = "none";
        }
        
        if (options.hasToolButtons)
        {
            this.toolButtonsNode.style.display = "none";
        }
        
        this.panelNode.style.display = "none";
    },

    watchWindow: function(win)
    {
    },

    unwatchWindow: function(win)
    {
    },

    updateOption: function(name, value)
    {
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

    /**
     * Toolbar helpers
     */
    showToolbarButtons: function(buttonsId, show)
    {
        try
        {
            if (!this.context.browser) // XXXjjb this is bug. Somehow the panel context is not FirebugContext.
            {
              if (FBTrace.DBG_ERRORS)
                FBTrace.sysout("firebug.Panel showToolbarButtons this.context has no browser, this:", this)
                return;
            }
            var buttons = this.context.browser.chrome.$(buttonsId);
            if (buttons)
                collapse(buttons, show ? "false" : "true");
        }
        catch (exc)
        {
            if (FBTrace.DBG_ERRORS)
            {
                FBTrace.dumpProperties("firebug.Panel showToolbarButtons FAILS", exc);
                if (!this.context.browser)FBTrace.dumpStack("firebug.Panel showToolbarButtons no browser");
            }
        }
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

    /**
     * Returns a number indicating the view's ability to inspect the object.
     *
     * Zero means not supported, and higher numbers indicate specificity.
     */
    supportsObject: function(object)
    {
        return 0;
    },

    refresh: function()
    {

    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

    startInspecting: function()
    {
    },

    stopInspecting: function(object, cancelled)
    {
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

    search: function(text)
    {
    }

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *


};

// ************************************************************************************************
// PanelBar

Firebug.PanelBar = 
{
    
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    selectedPanel: null,
    
    //panelBarNode: null,
    //context: null,
    
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    
    create: function()
    {
        this.panelMap = {};
    },
    
    initialize: function()
    {
        for(var name in this.panelMap)
        {
            (function(self, name){
                
                // tab click handler
                var onTabClick = function onTabClick()
                { 
                    self.selectPanel(name);
                    return false;
                };
                
                Firebug.chrome.addController([self.panelMap[name].tabNode, "mousedown", onTabClick]);
                
            })(this, name);
        }
    },
    
    shutdown: function()
    {
    },
    
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

    addPanel: function(panelName, parentPanel)
    {
        var PanelType = panelTypeMap[panelName];
        var panel = new PanelType();
        panel.create();
        
        this.panelMap[panelName] = panel;
    },
    
    removePanel: function(panelName)
    {
        
    },
    
    selectPanel: function(panelName)
    {
        var selectedPanel = this.selectedPanel;
        var panel = this.panelMap[panelName];
        
        if (panel && selectedPanel != panel)
        {
            if (selectedPanel)
            {
                removeClass(selectedPanel.tabNode, "fbSelectedTab");
                selectedPanel.hide();
                panel.shutdown();
            }
            
            if (!panel.parentPanel)
                FirebugChrome.selectedPanel = panelName;
            
            this.selectedPanel = panel;
            
            addClass(panel.tabNode, "fbSelectedTab");
            panel.initialize();
            panel.show();
        }
    },
    
    getPanel: function(panelName)
    {
        var panel = this.panelMap[panelName];
        
        return panel;
    },
    
    getSelectedPanel: function()
    {
        return this.selectedPanel;
    }    
   
};

//************************************************************************************************
// ToolButton

/*

bt = new ToolButton({
    parentNode: node,
    context: Panel,
    click: handler
}):

bt = new ToolButton({
    type: "toggle",
    parentNode: node,
    context: Panel,
    on: handler,
    off: handler
}):
 
 */


Firebug.ToolButton = function(options)
{
    this.module = options.module;
    this.panel = options.panel;
    this.container = this.panel.toolButtonsNode;
    
    this.caption = options.caption || "caption";
    this.title = options.title || "title";
    
    this.type = options.type || "normal";
    this.state = "unpressed";
    this.display = "unpressed";
    
    this.node = createElement("a", {
        className: "fbHover",
        title: this.title,
        innerHTML: this.caption
    });
    
    this.container.appendChild(this.node);
};

Firebug.ToolButton.prototype = extend(Firebug.Controller,
{
    title: null,
    caption: null,
    
    module: null,
    panel: null,
    container: null,
    node: null,
    
    type: null,
    state: null,
    display: null,
    
    destroy: function()
    {
        this.shutdown();
        
        this.container.removeChild(this.node);
    },
    
    initialize: function()
    {
        Firebug.Controller.initialize.apply(this);
        var node = this.node;
        
        this.addController([node, "mousedown", this.handlePress]);
        
        if (this.type == "normal")
            this.addController(
                [node, "mouseup", this.handleUnpress],
                [node, "mouseout", this.handleUnpress],
                [node, "click", this.handleClick]
            );
    },
    
    shutdown: function()
    {
        Firebug.Controller.shutdown.apply(this);
    },
    
    restore: function()
    {
        this.changeState("unpressed");        
    },
    
    changeState: function(state)
    {
        this.state = state;
        this.changeDisplay(state);
    },
    
    changeDisplay: function(display)
    {
        if (display != this.display)
        {
            if (display == "pressed")
            {
                addClass(this.node, "fbBtnPressed");
            }
            else if (display == "unpressed")
            {
                removeClass(this.node, "fbBtnPressed");
            }
            this.display = display;
        }
    },
    
    handlePress: function()
    {
        if (this.type == "normal")
        {
            this.changeDisplay("pressed");
            this.beforeClick = true;
        }
        else if (this.type == "toggle")
        {
            if (this.state == "pressed")
            {
                this.changeState("unpressed");
            }
            else
            {
                this.changeState("pressed");
            }
        }
    },
    
    handleUnpress: function()
    {
        if (this.beforeClick)
            this.changeDisplay("unpressed");
    },
    
    handleClick: function()
    {
        if (this.type == "normal")
        {
            if (this.click)
                this.click.apply(this.module);
            
            this.changeState("unpressed");
        }
        
        this.beforeClick = false;
    },
    
    // should be place inside module
    addButton: function(caption, title, handler)
    {
    },
    
    removeAllButtons: function()
    {
        
    }
    
});


function StatusBar(){};

StatusBar.prototype = extend(Firebug.Controller, {
    
});

function PanelOptions(){};

PanelOptions.prototype = extend(Firebug.Controller, {
    
});


// ************************************************************************************************
// ************************************************************************************************
// ************************************************************************************************


/*

From Honza Tutorial
----------------------------------------------------
FBL.ns(function() { with (FBL) {
var panelName = "HelloWorld";
Firebug.HelloWorldModel = extend(Firebug.Module,
{
    showPanel: function(browser, panel) {
        var isHwPanel = panel && panel.name == panelName;
        var hwButtons = browser.chrome.$("fbHelloWorldButtons");
        collapse(hwButtons, !isHwPanel);
    },
    onMyButton: function(context) {
        alert("Hello World!");
    }
});

function HelloWorldPanel() {}
HelloWorldPanel.prototype = extend(Firebug.Panel,
{
    name: panelName,
    title: "Hello World!",

    initialize: function() {
        Firebug.Panel.initialize.apply(this, arguments);
    }
});

Firebug.registerModule(Firebug.HelloWorldModel);
Firebug.registerPanel(HelloWorldPanel);

}});
----------------------------------------------------

/**/  
  



// ************************************************************************************************
}});