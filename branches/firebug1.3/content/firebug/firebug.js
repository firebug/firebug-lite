FBL.ns(function() { with (FBL) {
// ************************************************************************************************

FBL.version = "FirebugLite-1.3.0a";

// ************************************************************************************************
// Globals

var modules = [];
var panelTypes = [];

var panelTypeMap = {};


// ************************************************************************************************
// Firebug

FBL.cacheID = "___FBL_";
FBL.documentCache = {};

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

FBL.Firebug =  
{
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    modules: modules,
    panelTypes: panelTypes,
    
    cache: {},
    
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // Initialization
    
    initialize: function()
    {
        Firebug.browser = new Context(application.global);
        Firebug.context = Firebug.browser;
        
        Firebug.chrome = new FirebugChrome(application.chrome);
        Firebug.chrome.initialize();
        
        Firebug.cacheDocument();
        
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

        //for (var i = 0; i < arguments.length; ++i)
        //    TabWatcher.addListener(arguments[i]);
        
        //                                                                                          /*@explore*/
        //if (FBTrace.DBG_INITIALIZE) FBTrace.dumpProperties("registerModule", arguments);          /*@explore*/
    },

    registerPanel: function()
    {
        panelTypes.push.apply(panelTypes, arguments);

        for (var i = 0; i < arguments.length; ++i)
            panelTypeMap[arguments[i].prototype.name] = arguments[i];
        
        //                                                                                          /*@explore*/
        //if (FBTrace.DBG_INITIALIZE)                                                               /*@explore*/
        //    for (var i = 0; i < arguments.length; ++i)                                            /*@explore*/
        //        FBTrace.sysout("registerPanel "+arguments[i].prototype.name+"\n");                /*@explore*/
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
        
    _controllers: null,
        
    initialize: function(node)
    {
        this._controllers = [];
        this.node = this.node || node;
    },
    
    shutdown: function()
    {
        this.removeControllers();
    },
    
    /**
     * 
     */
    addController: function()
    {
        for (var i=0, arg; arg=arguments[i]; i++)
        {
            // If the first argument is a string, make a selector query 
            // within the controller node context
            if (typeof arg[0] == "string")
            {
                arg[0] = $$(arg[0], this.node);
            }
            
            // bind the handler to the proper context
            var handler = arg[2];
            arg[2] = bind(this, handler);
            // save the original handler as an extra-argument, so we can
            // look for it later, when removing a particular controller            
            arg[3] = handler;
            
            this._controllers.push(arg);
            addEvent.apply(this, arg);
        }
    },
    
    removeController: function()
    {
        for (var i=0, arg; arg=arguments[i]; i++)
        {
            for (var j=0, c; c=this._controllers[j]; j++)
            {
                if (arg[0] == c[0] && arg[1] == c[1] && arg[2] == c[3])
                    removeEvent.apply(this, c);
            }
        }
    },
    
    removeControllers: function()
    {
        for (var i=0, c; c=this._controllers[i]; i++)
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
    
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    
    options: {
        hasCommandLine: false,
        hasSidePanel: false,
        hasStatusBar: false,
        hasToolButtons: false,
        
        // Pre-rendered panels are those included in the skin file (firebug.html)
        isPreRendered: true,
        
        // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
        // To be used by external extensions
        panelHTML: "",
        panelCSS: "",
        
        toolButtonsHTML: ""
    },
    
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    
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

    initialize: function(context, doc)
    {
        var options = this.options;
        var panelId = "fb" + this.name;
        
        if (options.isPreRendered)
        {
            this.panelNode = $(panelId);
            
            if (options.hasSidePanel)
            {
                //this.sidePanelNode = $(panelId + "StatusBar");
            }
            
            if (options.hasStatusBar)
            {
                this.statusBarNode = $(panelId + "StatusBar");
            }
            
            if (options.hasToolButtons)
            {
                this.toolButtonsNode = $(panelId + "Buttons");
            }
            
        }
        else
        {
            //create Panel
        }
        
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
            FBTrace.sysout("firebug.destroy panelNode for "+this.name+"\n");

        if (this.panelNode)
            delete this.panelNode.ownerPanel;

        this.destroyNode();
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

    // Called after module.initialize; addEventListener-s here
    initializeNode: function(myPanelNode)
    {
    },

    // removeEventListener-s here.
    destroyNode: function()
    {
    },

    show: function(state)  // persistedPanelState plus non-persisted hide() values
    {
    },

    hide: function(state)  // store info on state for next show.
    {
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

Firebug.PanelBar = function(panelBarNode, chrome)
{
    this.panelTypes = [];
    this.panelTypeMap = {};
    
    this.panelBarNode = panelBarNode;    
    this.chrome = chrome;
};

Firebug.PanelBar.prototype = 
{
    
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    panelTypes: null,
    panelTypeMap: null,
    
    selectedPanel: null,
    
    panelBarNode: null,
    context: null,
    
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    destroy: function()
    {
    
    },
    
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    showTabs: function()
    {
        
    },
    
    hideTabs: function()
    {
        
    },
    
    
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    addTab: function(title, parentPanel)
    {
        var panel = Firebug.panelTypeMap[title];
        
        
        
        //isInternal
    
        /*
        var panelTypes = [];
        var panelTypeMap = {};
        /**/

    },
    
    removeTab: function()
    {
        
    },
    
    selectPanel: function()
    {
        
    },
    
    getSelectedPanel: function()
    {
        
    }    
   
};


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