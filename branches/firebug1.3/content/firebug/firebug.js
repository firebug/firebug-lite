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
var reps = [];

var parentPanelMap = {};


// ************************************************************************************************
// Firebug

window.Firebug = FBL.Firebug =  
{
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    version: "Firebug Lite 1.3.0a3",
    revision: "$Revision$",
    
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    modules: modules,
    panelTypes: panelTypes,
    panelTypeMap: panelTypeMap,
    reps: reps,
    
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // Initialization
    
    initialize: function()
    {
        if (FBTrace.DBG_INITIALIZE) FBTrace.sysout("Firebug.initialize", "initializing application");
        
        Firebug.browser = new Context(Env.browser);
        Firebug.context = Firebug.browser;
        
        // Document must be cached before chrome initialization
        cacheDocument();
        
        if (Firebug.Inspector)
            Firebug.Inspector.create();
        
        FirebugChrome.initialize();
        
        dispatch(modules, "initialize", []);
    },
  
    shutdown: function()
    {
        if (Firebug.Inspector)
            Firebug.Inspector.destroy();
        
        dispatch(modules, "shutdown", []);
        
        var chromeMap = FirebugChrome.chromeMap;
        
        if (chromeMap.popup)
            chromeMap.popup.destroy();
        
        chromeMap.frame.destroy();
        
        for(var name in documentCache)
        {
            documentCache[name].removeAttribute(cacheID);
            documentCache[name] = null;
            delete documentCache[name];
        }
        
        documentCache = null;
        delete FBL.documentCache;
        
        Firebug.browser = null;
        Firebug.context = null;
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

        for (var i = 0, panelType; panelType = arguments[i]; ++i)
        {
            panelTypeMap[panelType.prototype.name] = arguments[i];
            
            if (panelType.prototype.parentPanel)
                parentPanelMap[panelType.prototype.parentPanel] = 1;
        }
        
        if (FBTrace.DBG_INITIALIZE)
            for (var i = 0; i < arguments.length; ++i)
                FBTrace.sysout("Firebug.registerPanel", arguments[i].prototype.name);
    },
    
    registerRep: function()
    {
        reps.push.apply(reps, arguments);
    },

    unregisterRep: function()
    {
        for (var i = 0; i < arguments.length; ++i)
            remove(reps, arguments[i]);
    },

    setDefaultReps: function(funcRep, rep)
    {
        FBL.defaultRep = rep;
        FBL.defaultFuncRep = funcRep;
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // Reps

    getRep: function(object)
    {
        var type = typeof object;
        if (isIE && isFunction(object))
            type = "function";
        
        for (var i = 0; i < reps.length; ++i)
        {
            var rep = reps[i];
            try
            {
                if (rep.supportsObject(object, type))
                {
                    if (FBTrace.DBG_DOM)
                        FBTrace.sysout("getRep type: "+type+" object: "+object, rep);
                    return rep;
                }
            }
            catch (exc)
            {
                if (FBTrace.DBG_ERRORS)
                {
                    FBTrace.sysout("firebug.getRep FAILS: ", exc.message || exc);
                    FBTrace.sysout("firebug.getRep reps["+i+"/"+reps.length+"]: Rep="+reps[i].className);
                }
            }
        }

        return (type == 'function') ? defaultFuncRep : defaultRep;
    },

    getRepObject: function(node)
    {
        var target = null;
        for (var child = node; child; child = child.parentNode)
        {
            if (hasClass(child, "repTarget"))
                target = child;

            if (child.repObject)
            {
                if (!target && hasClass(child, "repIgnore"))
                    break;
                else
                    return child.repObject;
            }
        }
    },

    getRepNode: function(node)
    {
        for (var child = node; child; child = child.parentNode)
        {
            if (child.repObject)
                return child;
        }
    },

    getElementByRepObject: function(element, object)
    {
        for (var child = element.firstChild; child; child = child.nextSibling)
        {
            if (child.repObject == object)
                return child;
        }
    },
    
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // Preferences
    
    getPref: function(name)
    {
        return Firebug[name];
    },
    
    setPref: function(name, value)
    {
        Firebug[name] = value;
        
        this.savePrefs();
    },
    
    loadPrefs: function(prefs)
    {
        prefs = prefs || eval("(" + readCookie("FirebugLite") + ")");
        
        for (var name in prefs)
        {
            Firebug[name] = prefs[name];
        }
    },
    
    savePrefs: function()
    {
        var json = ['{'], jl = 0;
        
        for (var name in preferences)
        {
            if (preferences.hasOwnProperty(name))
            {
                var value = Firebug[name];
                
                json[++jl] = '"'; 
                json[++jl] = name;
                
                var type = typeof value;
                if (type == "boolean" || type == "number")
                {
                    json[++jl] = '":';
                    json[++jl] = value 
                    json[++jl] = ',';
                }
                else
                {
                    json[++jl] = '":"';
                    json[++jl] = value 
                    json[++jl] = '",';
                }
            }
        }
        
        json.length = jl--;
        json[++jl] = '}';
        
        createCookie("FirebugLite", json.join(""));
    },
    
    restorePrefs: function()
    {
        for (var name in preferences)
        {
            Firebug[name] = preferences[name];
        }
    },
    
    removePrefs: function()
    {
        removeCookie("FirebugLite");
    }
};

var preferences =
{
    saveCookies: false,
    startOpened: false,
    startInNewWindow: false,
    overrideConsole: true,
    enableTrace: false,
    enablePersistent: false
};

Firebug.restorePrefs();

if (!Env.isPersistentMode || 
     Env.isPersistentMode && Env.isChromeContext || 
     Env.isDevelopmentMode )
        Env.browser.window.Firebug = FBL.Firebug; 


// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
// Other methods

FBL.cacheDocument = function cacheDocument()
{
    var els = Firebug.browser.document.getElementsByTagName("*");
    for (var i=0, l=els.length, el; i<l; i++)
    {
        el = els[i];
        el[cacheID] = i;
        documentCache[i] = el;
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
        innerHTMLSync: false
        
        /*
        // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
        // To be used by external extensions
        panelHTML: "",
        panelCSS: "",
        
        toolButtonsHTML: ""
        /**/
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
        if (parentPanelMap.hasOwnProperty(this.name))
        {
            this.sidePanelBar = extend({}, PanelBar);
            this.sidePanelBar.create(true);
        }
        
        var options = this.options = extend(Firebug.Panel.options, this.options);
        var panelId = "fb" + this.name;
        
        if (options.isPreRendered)
        {
            this.panelNode = $(panelId);
            
            this.tabNode = $(panelId + "Tab");
            this.tabNode.style.display = "block";
            
            if (options.hasToolButtons)
            {
                this.toolButtonsNode = $(panelId + "Buttons");
            }
            
            if (options.hasStatusBar)
            {
                this.statusBarBox = $("fbStatusBarBox");
                this.statusBarNode = $(panelId + "StatusBar");
            }
            
            if (options.hasSidePanel)
            {
                //this.sidePanelNode = $(panelId + "StatusBar");
            }        
        }
        else
        {
            var containerSufix = this.parentPanel ? "2" : "1";
            
            // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
            // Create Panel
            var panelNode = this.panelNode = createElement("div", {
                id: panelId,
                className: "fbPanel"
            });

            $("fbPanel" + containerSufix).appendChild(panelNode);
            
            // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
            // Create Panel Tab
            var tabHTML = '<span class="fbTabL"></span><span class="fbTabText">' +
                    this.title + '</span><span class="fbTabR"></span>';            
            
            var tabNode = this.tabNode = createElement("a", {
                id: panelId + "Tab",
                className: "fbTab fbHover",
                innerHTML: tabHTML
            });
            
            if (isIE6)
            {
                tabNode.href = "javascript:void(0)";
            }
            
            $("fbPanelBar" + containerSufix).appendChild(tabNode);
            tabNode.style.display = "block";
            
            // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
            // create ToolButtons
            if (options.hasToolButtons)
            {
                this.toolButtonsNode = createElement("span", {
                    id: panelId + "Buttons",
                    className: "fbToolbarButtons"
                });
                
                $("fbToolbarButtons").appendChild(this.toolButtonsNode);
            }
            
            /**/
            
            // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
            // create StatusBar
            if (options.hasStatusBar)
            {
                this.statusBarBox = $("fbStatusBarBox");
                
                this.statusBarNode = createElement("span", {
                    id: panelId + "StatusBar",
                    className: "fbToolbarButtons fbStatusBar"
                });
                
                this.statusBarBox.appendChild(this.statusBarNode);
            }
            
            // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
            // create SidePanel
        }
        
        var contentNode = this.contentNode = createElement("div");
        this.panelNode.appendChild(contentNode);
        
        this.containerNode = this.panelNode.parentNode;
        
        if (FBTrace.DBG_INITIALIZE) FBTrace.sysout("Firebug.Panel.create", this.name);
        
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
        if (FBTrace.DBG_INITIALIZE) FBTrace.sysout("Firebug.Panel.destroy", this.name);
        
        if (parentPanelMap.hasOwnProperty(this.name))
        {
            this.sidePanelBar.destroy();
            this.sidePanelBar = null;
        }
        
        this.options = null;
        this.name = null;
        this.parentPanel = null;
        
        this.tabNode = null;
        this.panelNode = null;
        this.contentNode = null;
        this.containerNode = null;
        
        //if (this.panelNode)
        //    delete this.panelNode.ownerPanel;

        //this.destroyNode();
    },
    
    initialize: function()
    {
        if (FBTrace.DBG_INITIALIZE) FBTrace.sysout("Firebug.Panel.initialize", this.name);
        
        // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
        if (parentPanelMap.hasOwnProperty(this.name))
        {
            this.sidePanelBar.initialize();
        }
        
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
            
        this.containerNode = this.panelNode.parentNode;
        
        // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
        // store persistent state
        this.containerNode.scrollTop = this.lastScrollTop;
    },
    
    shutdown: function()
    {
        if (FBTrace.DBG_INITIALIZE) FBTrace.sysout("Firebug.Panel.shutdown", this.name);
        
        // store persistent state
        this.lastScrollTop = this.containerNode.scrollTop;
        
        this.toolButtonsNode = null;
        this.statusBarBox = null;
        this.statusBarNode = null;
    },

    detach: function(oldChrome, newChrome)
    {
        if (oldChrome.selectedPanel.name == this.name)
            this.lastScrollTop = oldChrome.selectedPanel.containerNode.scrollTop;
    },

    reattach: function(doc)
    {
        if (this.options.innerHTMLSync)
            this.synchronizeUI();
    },
    
    synchronizeUI: function()
    {
        this.containerNode.scrollTop = this.lastScrollTop || 0;
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
        
        if (!this.parentPanel)
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

    hasObject: function(object)  // beyond type testing, is this object selectable?
    {
        return false;
    },

    select: function(object, forceUpdate)
    {
        if (!object)
            object = this.getDefaultSelection(this.context);

        if(FBTrace.DBG_PANELS)
            FBTrace.sysout("firebug.select "+this.name+" forceUpdate: "+forceUpdate+" "+object+((object==this.selection)?"==":"!=")+this.selection);

        if (forceUpdate || object != this.selection)
        {
            this.selection = object;
            this.updateSelection(object);

            // TODO: xxxpedro
            // XXXjoe This is kind of cheating, but, feh.
            //Firebug.chrome.onPanelSelect(object, this);
            //if (uiListeners.length > 0)
            //    dispatch(uiListeners, "onPanelSelect", [object, this]);  // TODO: make Firebug.chrome a uiListener
        }
    },


    updateSelection: function(object)
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

    getDefaultSelection: function(context)
    {
        return null;
    },
    
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

    search: function(text)
    {
    }

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *


};


// ************************************************************************************************
if (FBL.domplate) Firebug.Rep = domplate(
{
    className: "",
    inspectable: true,

    supportsObject: function(object, type)
    {
        return false;
    },

    inspectObject: function(object, context)
    {
        Firebug.chrome.select(object);
    },

    browseObject: function(object, context)
    {
    },

    persistObject: function(object, context)
    {
    },

    getRealObject: function(object, context)
    {
        return object;
    },

    getTitle: function(object)
    {
        var label = safeToString(object);

        var re = /\[object (.*?)\]/;
        var m = re.exec(label);
        return m ? m[1] : label;
    },

    getTooltip: function(object)
    {
        return null;
    },

    getContextMenuItems: function(object, target, context)
    {
        return [];
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // Convenience for domplates

    STR: function(name)
    {
        return $STR(name);
    },

    cropString: function(text)
    {
        return cropString(text);
    },

    cropMultipleLines: function(text, limit)
    {
        return cropMultipleLines(text, limit);
    },

    toLowerCase: function(text)
    {
        return text ? text.toLowerCase() : text;
    },

    plural: function(n)
    {
        return n == 1 ? "" : "s";
    }
});

// ************************************************************************************************


// ************************************************************************************************
}});