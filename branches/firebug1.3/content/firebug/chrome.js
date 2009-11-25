FBL.ns(function() { with (FBL) {
// ************************************************************************************************


FBL.chromeMap = {};

var ChromeCache = FBL.Env.Cache.Chrome = 
{
    commandLineVisible: false,
    sidePanelVisible: false,
    sidePanelWidth: 300,
    
    selectedPanel: "Console",
    selectedElement: null,
    
    consoleMessageQueue: [],    
    
    height: 250,
    
    isOpen: false,
    
    create: function()
    {
        if (FBTrace.DBG_INITIALIZE) FBTrace.sysout("Env.Cache.Chrome.create", "creating chrome window");
        
        createChrome();
    },
    
    initialize: function()
    {
        if (FBTrace.DBG_INITIALIZE) FBTrace.sysout("Env.Cache.Chrome.initialize", "initializing chrome window");
        
        if (Env.chrome.type == "frame")
            ChromeMini.create(Env.chrome);
            
        if (Env.browser.document.documentElement.getAttribute("debug") == "true")
            Env.openAtStartup = true;

        var chrome = Firebug.chrome = new Chrome(Env.chrome);
        chromeMap[chrome.type] = chrome;
        
        addGlobalEvent("keydown", onPressF12);
        
        if (Env.isPersistentMode && chrome.type == "popup")
        {
            // TODO: xxxpedro persist - revise chrome synchronization when in persistent mode
            chromeMap.frame = ChromeCache.chromeMap.frame;
            ChromeCache.chromeMap.popup = chrome;
            
            var frame = chromeMap.frame;
            if (frame)
                frame.close();
            
            // initial UI state
            ChromeCache.commandLineVisible = false;
            ChromeCache.sidePanelVisible = false;

            chrome.reattach(chromeMap.frame, chrome);
        }
    },
    
    clone: function(FBChrome)
    {
        for (var name in FBChrome)
        {
            var prop = FBChrome[name];
            if (FBChrome.hasOwnProperty(name) && typeof prop != "function")
            {
                this[name] = prop;
            }
        }
    }
};


// ************************************************************************************************
// Chrome Window Options

var ChromeDefaultOptions = 
{
    type: "frame",
    id: "FirebugChrome",
    height: 250
};

// ************************************************************************************************
// Chrome Window Creation

var createChrome = function(options)
{
    options = options || {};
    options = extend(ChromeDefaultOptions, options);
    
    var context = options.context || Env.browser;
    
    var chrome = {};
    
    chrome.type = options.type;
    
    var isChromeFrame = chrome.type == "frame";
    var isBookmarletMode = Env.isBookmarletMode;
    var url = isBookmarletMode ? "about:blank" : Env.location.skin;
    
    if (isChromeFrame)
    {
        // Create the Chrome Frame
        var node = chrome.node = createGlobalElement("iframe");
        
        node.setAttribute("id", options.id);
        node.setAttribute("frameBorder", "0");
        node.style.border = "0";
        node.style.visibility = "hidden";
        node.style.zIndex = "2147483647"; // MAX z-index = 2147483647
        node.style.position = noFixedPosition ? "absolute" : "fixed";
        node.style.width = "100%"; // "102%"; IE auto margin bug
        node.style.left = "0";
        node.style.bottom = noFixedPosition ? "-1px" : "0";
        node.style.height = options.height + "px";
        
        // avoid flickering during chrome rendering
        if (isFirefox)
            node.style.display = "none";
        
        if (!isBookmarletMode)
            node.setAttribute("src", Env.location.skin);
        
        // document.body not available in XML+XSL documents in Firefox
        context.document.getElementsByTagName("body")[0].appendChild(node);
    }
    else
    {
        // Create the Chrome Popup
        var height = ChromeCache.height || options.height;
        var options = [
                "true,top=",
                Math.max(screen.availHeight - height - 61 /* Google Chrome bug */, 0),
                ",left=0,height=",
                height,
                ",width=",
                screen.availWidth-10, // Opera opens popup in a new tab if it's too big!
                ",resizable"          
            ].join("");
        
        var node = chrome.node = context.window.open(
            url, 
            "popup", 
            options
          );
        
        if (node)
        {
            try
            {
                node.focus();
            }
            catch(E)
            {
                alert("Firebug Error: Firebug popup was blocked.");
                return;
            }
        }
        else
        {
            alert("Firebug Error: Firebug popup was blocked.");
            return;
        }
    }
    
    if (isBookmarletMode)
    {
        var tpl = getChromeTemplate(!isChromeFrame);
        var doc = isChromeFrame ? node.contentWindow.document : node.document;
        doc.write(tpl);
        doc.close();
    }
    
    var win;
    var waitDelay = !isBookmarletMode ? isChromeFrame ? 200 : 300 : 100;
    var waitForChrome = function()
    {
        if ( // Frame loaded... OR
             isChromeFrame && (win=node.contentWindow) &&
             node.contentWindow.document.getElementById("fbCommandLine") ||
             
             // Popup loaded
             !isChromeFrame && (win=node.window) && node.document &&
             node.document.getElementById("fbCommandLine") )
        {
            chrome.window = win.window;
            chrome.document = win.document;
            
            // Prevent getting the wrong chrome height in FF when opening a popup 
            setTimeout(function(){
                onChromeLoad(chrome);
            },0);
        }
        else
            setTimeout(waitForChrome, waitDelay);
    }
    
    waitForChrome();
};


var onChromeLoad = function onChromeLoad(chrome)
{
    Env.chrome = chrome;
    
    if (FBTrace.DBG_INITIALIZE) FBTrace.sysout("Chrome onChromeLoad", "chrome window loaded");
    
    if (Env.isPersistentMode)
    {
        // TODO: xxxpedro persist - make better chrome synchronization when in persistent mode
        Env.FirebugChrome = ChromeCache;
        Env.FirebugChrome.chromeMap = FBL.chromeMap;
        chrome.window.FirebugApplication = Env;
    
        if (Env.isDevelopmentMode)
        {
            Env.browser.window.FBDev.loadChromeApplication(chrome);
        }
        else
        {
            var doc = chrome.document;
            var script = doc.createElement("script");
            script.src = Env.location.app;
            doc.getElementsByTagName("head")[0].appendChild(script);
        }
    }
    else
    {
        if (chrome.type == "frame")
        {
            // initialize the chrome application
            setTimeout(function(){
                FBL.Firebug.initialize();
            },0);
        }
        else if (chrome.type == "popup")
        {
            var frame = chromeMap.frame;
            
            // initial UI state
            ChromeCache.commandLineVisible = false;
            ChromeCache.sidePanelVisible = false;
            
            var newChrome = new Chrome(chrome);
            var oldChrome = chromeMap.frame;
        
            // TODO: xxxpedro sync detach reattach attach
            dispatch(newChrome.panelMap, "detach", [frame, newChrome]);
        
            if (frame)
                frame.close();
            
            newChrome.reattach(frame, newChrome);
        }
    }
};


var getChromeTemplate = function(isPopup)
{
    var tpl = ChromeCache.injected; 
    var r = [], i = -1;
    
    r[++i] = '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/DTD/strict.dtd">';
    r[++i] = '<html><head><title>';
    r[++i] = Firebug.version;
    r[++i] = '</title><style>';
    r[++i] = tpl.CSS;
    r[++i] = (isIE6 && tpl.IE6CSS) ? tpl.IE6CSS : '';
    r[++i] = '</style>';
    r[++i] = '</head><body class=' + (isPopup ? '"FirebugPopup"' : '') + '>';
    r[++i] = tpl.HTML;
    r[++i] = '</body></html>';
    
    return r.join("");
};

// ************************************************************************************************
// Chrome Class
    
var Chrome = function Chrome(chrome)
{
    var type = chrome.type;
    var Base = type == "frame" ? ChromeFrameBase : ChromePopupBase; 
    
    append(this, chrome); // inherit chrome window properties
    append(this, Base);   // inherit chrome class properties (ChromeFrameBase or ChromePopupBase)
    
    chromeMap[type] = this;
    Firebug.chrome = this;
    
    this.create();
    
    return this;
};

// ************************************************************************************************
// ChromeBase

var ChromeBase = extend(Firebug.Controller, Firebug.PanelBar);
var ChromeBase = extend(ChromeBase, {
    
    create: function()
    {
        Firebug.PanelBar.create.apply(this);
        
        this.inspectButton = new Firebug.Button({
            type: "toggle",
            node: $("fbChrome_btInspect"),
            owner: Firebug.Inspector,
            
            onPress: Firebug.Inspector.startInspecting,
            onUnpress: Firebug.Inspector.stopInspecting          
        });
    },
    
    destroy: function()
    {
        this.shutdown();
    },
    
    initialize: function()
    {
        // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
        Firebug.Console.flush();
        
        if (Firebug.Trace)
            FBTrace.flush(Firebug.Trace);
        
        // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
        if (FBTrace.DBG_INITIALIZE) FBTrace.sysout("Firebug.chrome.initialize", "initializing chrome application");
        
        // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
        // initialize inherited classes
        Firebug.Controller.initialize.apply(this);
        Firebug.PanelBar.initialize.apply(this);
        
        // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
        // create the interface elements cache
        
        fbTop = $("fbTop");
        fbContent = $("fbContent");
        fbContentStyle = fbContent.style;
        fbBottom = $("fbBottom");
        fbBtnInspect = $("fbBtnInspect");
        
        fbToolbar = $("fbToolbar");
      
        fbPanelBox1 = $("fbPanelBox1");
        fbPanelBox1Style = fbPanelBox1.style;
        fbPanelBox2 = $("fbPanelBox2");
        fbPanelBox2Style = fbPanelBox2.style;
        fbPanelBar2Box = $("fbPanelBar2Box");
        fbPanelBar2BoxStyle = fbPanelBar2Box.style;
      
        fbHSplitter = $("fbHSplitter");
        fbVSplitter = $("fbVSplitter");
        fbVSplitterStyle = fbVSplitter.style;
      
        fbPanel1 = $("fbPanel1");
        fbPanel1Style = fbPanel1.style;
        fbPanel2 = $("fbPanel2");
        fbPanel2Style = fbPanel2.style;
      
        fbConsole = $("fbConsole");
        fbConsoleStyle = fbConsole.style;
        fbHTML = $("fbHTML");
      
        fbCommandLine = $("fbCommandLine");
        
        // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
        // static values cache
        topHeight = fbTop.offsetHeight;
        topPartialHeight = fbToolbar.offsetHeight;
        
        // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
        
        disableTextSelection($("fbToolbar"));
        disableTextSelection($("fbPanelBarBox"));
        
        // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
        // create a new instance of the CommandLine class
        commandLine = new Firebug.CommandLine(fbCommandLine);
        
        // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
        // Add the "javascript:void(0)" href attributes used to make the hover effect in IE6
        if (isIE)
        {
           var as = $$(".fbHover");
           for (var i=0, a; a=as[i]; i++)
           {
               a.setAttribute("href", "javascript:void(0)");
           }
        }
        
        // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
        // initialize all panels
        /*
        var panelMap = Firebug.panelTypes;
        for (var i=0, p; p=panelMap[i]; i++)
        {
            if (!p.parentPanel)
            {
                this.addPanel(p.prototype.name);
            }
        }
        /**/
        
        // ************************************************************************************************
        // ************************************************************************************************
        // ************************************************************************************************
        // ************************************************************************************************
        
        this.inspectButton.initialize();
        
        addEvent(fbPanel1, 'mousemove', Firebug.HTML.onListMouseMove);
        addEvent(fbContent, 'mouseout', Firebug.HTML.onListMouseMove);
        addEvent(this.node, 'mouseout', Firebug.HTML.onListMouseMove);
        // ************************************************************************************************
        // ************************************************************************************************
        // ************************************************************************************************
        // ************************************************************************************************
        
        // Select the first registered panel
        // TODO: BUG IE7
        var self = this;
        setTimeout(function(){
            self.selectPanel(ChromeCache.selectedPanel);
        },0);
        
        // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
        //this.draw();
    },
    
    shutdown: function()
    {
        // ************************************************************************************************
        // ************************************************************************************************
        // ************************************************************************************************
        // ************************************************************************************************
        this.inspectButton.shutdown();
        
        removeEvent(fbPanel1, 'mousemove', Firebug.HTML.onListMouseMove);
        removeEvent(fbContent, 'mouseout', Firebug.HTML.onListMouseMove);
        removeEvent(this.node, 'mouseout', Firebug.HTML.onListMouseMove);
        // ************************************************************************************************
        // ************************************************************************************************
        // ************************************************************************************************
        // ************************************************************************************************

        
        // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
        // Remove the interface elements cache
        
        fbTop = null;
        fbContent = null;
        fbContentStyle = null;
        fbBottom = null;
        fbBtnInspect = null;
        
        fbToolbar = null;

        fbPanelBox1 = null;
        fbPanelBox1Style = null;
        fbPanelBox2 = null;
        fbPanelBox2Style = null;
        fbPanelBar2Box = null;
        fbPanelBar2BoxStyle = null;
  
        fbHSplitter = null;
        fbVSplitter = null;
        fbVSplitterStyle = null;
  
        fbPanel1 = null;
        fbPanel1Style = null;
        fbPanel2 = null;
  
        fbConsole = null;
        fbConsoleStyle = null;
        fbHTML = null;
  
        fbCommandLine = null;
        
        // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
        // static values cache
        
        topHeight = null;
        topPartialHeight = null;
        
        
        // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
        // shutdown inherited classes
        Firebug.Controller.shutdown.apply(this);
        Firebug.PanelBar.shutdown.apply(this);
        
        // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
        // destroy the instance of the CommandLine class
        commandLine.destroy();
    },
    
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    
    toggle: function(forceOpen, popup)
    {
        if(popup)
        {
            this.detach();
        }
        else
        {
            if (isOpera && Firebug.chrome.type == "popup" && Firebug.chrome.node.closed)
            {
                var frame = chromeMap.frame;
                frame.reattach();
                
                chromeMap.popup = null;
                
                frame.open();
                
                return;
            }
                
            // If the context is a popup, ignores the toggle process
            if (Firebug.chrome.type == "popup") return;
            
            var shouldOpen = forceOpen || !ChromeCache.isOpen;
            
            if(shouldOpen)
               this.open();
            else
               this.close();
        }       
    },
    
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    
    detach: function()
    {
        //alert('detach');
        if(!chromeMap.popup)
        {     
            createChrome({type: "popup"});
        }
    },
    
    reattach: function(oldChrome, newChrome)
    {
        // chrome synchronization
        var newPanelMap = newChrome.panelMap;
        var oldPanelMap = oldChrome.panelMap;
        
        var panel;
        for(var name in newPanelMap)
        {
            // TODO: xxxpedro innerHTML
            panel = newPanelMap[name]; 
            if (panel.options.innerHTMLSync)
                panel.contentNode.innerHTML = oldPanelMap[name].contentNode.innerHTML;
        }
        
        Firebug.chrome = newChrome;
        
        // TODO: xxxpedro sync detach reattach attach
        //dispatch(Firebug.chrome.panelMap, "detach", [oldChrome, newChrome]);
        
        if (newChrome.type == "popup")
        {
            newChrome.initialize();
            dispatch(Firebug.modules, "initialize", []);
        }
        
        dispatch(newPanelMap, "reattach", [oldChrome, newChrome]);
    },
    
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

    draw: function()
    {
        var size = Firebug.chrome.getWindowSize();
        
        // Height related values
        var commandLineHeight = ChromeCache.commandLineVisible ? fbCommandLine.offsetHeight : 0,
            y = Math.max(size.height /* chrome height */, topHeight),
            
            height = Math.max(y - topHeight - commandLineHeight /* fixed height */, 0)+ "px",
            
            
            // Width related values
            sideWidth = ChromeCache.sidePanelVisible ? ChromeCache.sidePanelWidth : 0,
            
            width = Math.max(size.width /* chrome width */ - sideWidth, 0) + "px";
        
        // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
        // Height related rendering
        fbPanelBox1Style.height = height;
        fbPanel1Style.height = height;
        
        if (isIE || isOpera)
        {
            // Fix IE and Opera problems with auto resizing the verticall splitter
            fbVSplitterStyle.height = Math.max(y - topPartialHeight - commandLineHeight, 0) + "px";
        }
        //xxxpedro FF2 only?
        /*
        else if (isFirefox)
        {
            // Fix Firefox problem with table rows with 100% height (fit height)
            fbContentStyle.maxHeight = Math.max(y - fixedHeight, 0)+ "px";
        }/**/
        
        // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
        // Width related rendering
        fbPanelBox1Style.width = width;
        fbPanel1Style.width = width;
        
        // SidePanel rendering
        if (ChromeCache.sidePanelVisible)
        {
            sideWidth = Math.max(sideWidth - 6, 0) + "px";
            
            fbPanel2Style.height = height;
            fbPanel2Style.width = sideWidth;
            
            fbPanelBox2Style.width = sideWidth;
            fbPanelBar2BoxStyle.width = sideWidth;
            fbVSplitterStyle.right = sideWidth;
        }
    },
    
    resize: function()
    {
        var self = this;
        // avoid partial resize when maximizing window
        setTimeout(function(){
            self.draw();
            
            if (noFixedPosition && self.type == "frame")
                self.fixIEPosition();
        }, 0);
    },
    
    layout: function(panel)
    {
        if (FBTrace.DBG_CHROME) FBTrace.sysout("Chrome.layout", "");
        
        var options = panel.options;
        changeCommandLineVisibility(options.hasCommandLine);
        changeSidePanelVisibility(options.hasSidePanel);
        Firebug.chrome.draw();
    }
    
});

// ************************************************************************************************
// ChromeFrameBase

var ChromeContext = extend(ChromeBase, Context.prototype); 

var ChromeFrameBase = extend(ChromeContext,
{
    create: function()
    {
        ChromeBase.create.call(this);
        
        // restore display for the anti-flicker trick
        if (isFirefox)
            this.node.style.display = "block";
        
        if (Env.openAtStartup)
            this.open();
        else
        {
            ChromeCache.isOpen = true;
            this.close();
        }
        
        //if (this.node.style.visibility != "visible")
        //    this.node.style.visibility = "visible";
    },
    
    initialize: function()
    {
        //FBTrace.sysout("Frame", "initialize();")
        ChromeBase.initialize.call(this);
        
        this.addController(
            [Firebug.browser.window, "resize", this.resize],
            [Firebug.browser.window, "unload", this.destroy],
            
            [$("fbChrome_btClose"), "click", this.close],
            [$("fbChrome_btDetach"), "click", this.detach]       
        );
        
        if (noFixedPosition)
        {
            this.addController(
                [Firebug.browser.window, "scroll", this.fixIEPosition]
            );
        }
        
        fbVSplitter.onmousedown = onVSplitterMouseDown;
        fbHSplitter.onmousedown = onHSplitterMouseDown;
        
        this.isInitialized = true;
    },
    
    shutdown: function()
    {
        fbVSplitter.onmousedown = null;
        fbHSplitter.onmousedown = null;
        
        ChromeBase.shutdown.apply(this);
        
        this.isInitialized = false;
    },
    
    reattach: function()
    {
        var frame = chromeMap.frame;
        
        // last UI state
        ChromeCache.commandLineVisible = this.commandLineVisible;
        ChromeCache.sidePanelVisible = this.sidePanelVisible;
        
        ChromeBase.reattach(chromeMap.popup, this);
    },
    
    open: function()
    {
        if (!ChromeCache.isOpen)
        {
            var node = this.node;
            node.style.visibility = "hidden"; // Avoid flickering
            
            if (ChromeMini.isInitialized)
            {
                ChromeMini.shutdown();
            }
            
            var main = $("fbChrome");
            main.style.display = "block";
            
            ChromeCache.isOpen = true;
            
            var self = this;
            setTimeout(function(){
                //dispatch(Firebug.modules, "initialize", []);
                self.initialize();
                
                if (noFixedPosition)
                    self.fixIEPosition();
                
                self.draw();
        
                node.style.visibility = "visible";
            }, 10);
        }
    },
    
    close: function()
    {
        if (ChromeCache.isOpen)
        {
            var node = this.node;
            node.style.visibility = "hidden"; // Avoid flickering
            
            if (this.isInitialized)
            {
                //dispatch(Firebug.modules, "shutdown", []);
                this.shutdown();
            }
            
            // TODO: xxxpedro - persist IE fixed? 
            var main = $("fbChrome", chromeMap.frame.document);
            main.style.display = "none";
                    
            ChromeCache.isOpen = false;
            
            ChromeMini.initialize();
            
            node.style.visibility = "visible";
        }
    },
    
    fixIEPosition: function()
    {
        // fix IE problem with offset when not in fullscreen mode
        var doc = this.document;
        var offset = isIE ? doc.body.clientTop || doc.documentElement.clientTop: 0;
        
        var size = Firebug.browser.getWindowSize();
        var scroll = Firebug.browser.getWindowScrollPosition();
        var maxHeight = size.height;
        var height = this.node.offsetHeight;
        
        var bodyStyle = doc.body.currentStyle;
        
        this.node.style.top = maxHeight - height + scroll.top + "px";
        
        
        if (this.type == "frame" && (bodyStyle.marginLeft || bodyStyle.marginRight))
        {
            this.node.style.width = size.width + "px";
        }
    }

});


// ************************************************************************************************
// ChromeMini

var ChromeMini = extend(Firebug.Controller, 
{
    create: function(chrome)
    {
        append(this, chrome);
        this.type = "mini";
    },
    
    initialize: function()
    {
        Firebug.Controller.initialize.apply(this);
        
        // TODO: xxxpedro - persist IE fixed? 
        var doc = chromeMap.frame.document;
        
        var mini = $("fbMiniChrome", doc);
        mini.style.display = "block";
        
        var miniIcon = $("fbMiniIcon", doc);
        var width = miniIcon.offsetWidth + 10;
        miniIcon.title = "Open " + Firebug.version;
        
        var errors = $("fbMiniErrors", doc);
        if (errors.offsetWidth)
            width += errors.offsetWidth + 10;
        
        var node = this.node;
        node.style.height = "27px";
        node.style.width = width + "px";
        node.style.left = "";
        node.style.right = 0;
        node.setAttribute("allowTransparency", "true");

        if (noFixedPosition)
            this.fixIEPosition();
        
        this.document.body.style.backgroundColor = "transparent";
        
        
        this.addController(
            [$("fbMiniIcon", doc), "click", onMiniIconClick]       
        );
        
        if (noFixedPosition)
        {
            this.addController(
                [Firebug.browser.window, "scroll", this.fixIEPosition]
            );
        }
        
        this.isInitialized = true;
    },
    
    shutdown: function()
    {
        var node = this.node;
        node.style.height = ChromeCache.height + "px";
        node.style.width = "100%";
        node.style.left = 0;
        node.style.right = "";
        node.setAttribute("allowTransparency", "false");
        
        if (noFixedPosition)
            this.fixIEPosition();
        
        this.document.body.style.backgroundColor = "#fff";
        
        // TODO: xxxpedro - persist IE fixed? 
        var doc = chromeMap.frame.document;
        
        var mini = $("fbMiniChrome", doc);
        mini.style.display = "none";
        
        Firebug.Controller.shutdown.apply(this);
        
        this.isInitialized = false;
    },
    
    draw: function()
    {
    
    },
    
    fixIEPosition: ChromeFrameBase.fixIEPosition
    
});


// ************************************************************************************************
// ChromePopupBase

var ChromePopupBase = extend(ChromeContext, {
    
    initialize: function()
    {
        this.document.body.className = "FirebugPopup";
        
        ChromeBase.initialize.call(this)
        
        this.addController(
            [Firebug.chrome.window, "resize", this.resize],
            [Firebug.chrome.window, "unload", this.destroy],
            [Firebug.browser.window, "unload", this.close]
        );
        
        fbVSplitter.onmousedown = onVSplitterMouseDown;
    },
    
    destroy: function()
    {
        // TODO: xxxpedro sync detach reattach attach
        var frame = chromeMap.frame;
        
        dispatch(frame.panelMap, "detach", [this, frame]);
            
        if (Env.isPersistentMode)
        {
            // TODO: xxxpedro persist - revise chrome synchronization when in persistent mode
            Env.FirebugChrome.selectedElement = ChromeCache.selectedElement;
        }
        
        frame.reattach(this, frame);
        
        ChromeBase.destroy.apply(this);
        
        if (Env.isPersistentMode)
        {
            // TODO: xxxpedro persist - revise chrome synchronization when in persistent mode
            Env.FirebugChrome.chromeMap = ChromeCache.chromeMap;
            Env.FirebugChrome.chromeMap.popup = null;
        }
        chromeMap.popup = null;
        
        this.node.close();
    },
    
    close: function()
    {
        this.destroy();
    }

});



// ************************************************************************************************
// Internals


// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
//
var commandLine = null;


// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
// Interface Elements Cache

var fbTop = null;
var fbContent = null;
var fbContentStyle = null;
var fbBottom = null;
var fbBtnInspect = null;

var fbToolbar = null;

var fbPanelBox1 = null;
var fbPanelBox1Style = null;
var fbPanelBox2 = null;
var fbPanelBox2Style = null;
var fbPanelBar2Box = null;
var fbPanelBar2BoxStyle = null;

var fbHSplitter = null;
var fbVSplitter = null;
var fbVSplitterStyle = null;

var fbPanel1 = null;
var fbPanel1Style = null;
var fbPanel2 = null;

var fbConsole = null;
var fbConsoleStyle = null;
var fbHTML = null;

var fbCommandLine = null;

//* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

var topHeight = null;
var topPartialHeight = null;

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

var chromeRedrawSkipRate = isIE ? 75 : isOpera ? 80 : 75;


//************************************************************************************************
// UI helpers

var changeCommandLineVisibility = function changeCommandLineVisibility(visibility)
{
    var last = ChromeCache.commandLineVisible;
    Firebug.chrome.commandLineVisible = ChromeCache.commandLineVisible = 
        typeof visibility == "boolean" ? visibility : !ChromeCache.commandLineVisible;
    
    if (ChromeCache.commandLineVisible != last)
    {
        fbBottom.className = ChromeCache.commandLineVisible ? "" : "hide";
    }
};

var changeSidePanelVisibility = function changeSidePanelVisibility(visibility)
{
    var last = ChromeCache.sidePanelVisible;
    Firebug.chrome.sidePanelVisible = ChromeCache.sidePanelVisible = 
        typeof visibility == "boolean" ? visibility : !ChromeCache.sidePanelVisible;
    
    if (ChromeCache.sidePanelVisible != last)
    {
        fbPanelBox2.className = ChromeCache.sidePanelVisible ? "" : "hide"; 
        fbPanelBar2Box.className = ChromeCache.sidePanelVisible ? "" : "hide";
    }
};


// ************************************************************************************************
// F12 Handler

var onPressF12 = function onPressF12(event)
{
    if (event.keyCode == 123 /* F12 */ && 
        (!isFirefox && !event.shiftKey || event.shiftKey && isFirefox))
        {
            Firebug.chrome.toggle(false, event.ctrlKey);
            cancelEvent(event, true);
        }
};

var onMiniIconClick = function onMiniIconClick(event)
{
    Firebug.chrome.toggle(false, event.ctrlKey);
    cancelEvent(event, true);
}
    

// ************************************************************************************************
// Horizontal Splitter Handling

var onHSplitterMouseDown = function onHSplitterMouseDown(event)
{
    addGlobalEvent("mousemove", onHSplitterMouseMove);
    addGlobalEvent("mouseup", onHSplitterMouseUp);
    
    if (isIE)
        addEvent(Env.browser.document.documentElement, "mouseleave", onHSplitterMouseUp);
    
    fbHSplitter.className = "fbOnMovingHSplitter";
    
    return false;
};

var lastHSplitterMouseMove = 0;
var onHSplitterMouseMoveBuffer = null;
var onHSplitterMouseMoveTimer = null;

var onHSplitterMouseMove = function onHSplitterMouseMove(event)
{
    cancelEvent(event, true);
    
    var clientY = event.clientY;
    var win = isIE
        ? event.srcElement.ownerDocument.parentWindow
        : event.target.ownerDocument && event.target.ownerDocument.defaultView;
    
    if (!win)
        return;
    
    if (win != win.parent)
    {
        var frameElement = win.frameElement;
        if (frameElement)
        {
            var framePos = Firebug.browser.getElementPosition(frameElement).top;
            clientY += framePos;
            
            if (frameElement.style.position != "fixed")
                clientY -= Firebug.browser.getWindowScrollPosition().top;
        }
    }
    
    if (isOpera && isQuiksMode && win.frameElement.id == "FirebugChrome")
    {
        clientY = Firebug.browser.getWindowSize().height - win.frameElement.offsetHeight + clientY;
    }
    /*
    console.log(
            typeof win.FBL != "undefined" ? "no-Chrome" : "Chrome",
            //win.frameElement.id,
            event.target,
            clientY
        );/**/
    
    onHSplitterMouseMoveBuffer = clientY; // buffer
    
    if (new Date().getTime() - lastHSplitterMouseMove > chromeRedrawSkipRate) // frame skipping
    {
        lastHSplitterMouseMove = new Date().getTime();
        handleHSplitterMouseMove();
    }
    else
        if (!onHSplitterMouseMoveTimer)
            onHSplitterMouseMoveTimer = setTimeout(handleHSplitterMouseMove, chromeRedrawSkipRate);
    
    return false;
};

var handleHSplitterMouseMove = function()
{
    if (onHSplitterMouseMoveTimer)
    {
        clearTimeout(onHSplitterMouseMoveTimer);
        onHSplitterMouseMoveTimer = null;
    }
    
    var clientY = onHSplitterMouseMoveBuffer;
    
    var windowSize = Firebug.browser.getWindowSize();
    var scrollSize = Firebug.browser.getWindowScrollSize();
    
    // compute chrome fixed size (top bar and command line)
    var commandLineHeight = ChromeCache.commandLineVisible ? fbCommandLine.offsetHeight : 0;
    var fixedHeight = topHeight + commandLineHeight;
    var chromeNode = Firebug.chrome.node;
    
    var scrollbarSize = !isIE && (scrollSize.width > windowSize.width) ? 17 : 0;
    
    //var height = !isOpera ? chromeNode.offsetTop + chromeNode.clientHeight : windowSize.height;
    var height =  windowSize.height;
    
    // compute the min and max size of the chrome
    var chromeHeight = Math.max(height - clientY + 5 - scrollbarSize, fixedHeight);
        chromeHeight = Math.min(chromeHeight, windowSize.height - scrollbarSize);

    ChromeCache.height = chromeHeight;
    chromeNode.style.height = chromeHeight + "px";
    
    if (noFixedPosition)
        Firebug.chrome.fixIEPosition();
    
    Firebug.chrome.draw();
};

var onHSplitterMouseUp = function onHSplitterMouseUp(event)
{
    removeGlobalEvent("mousemove", onHSplitterMouseMove);
    removeGlobalEvent("mouseup", onHSplitterMouseUp);
    
    if (isIE)
        removeEvent(Env.browser.document.documentElement, "mouseleave", onHSplitterMouseUp);
    
    fbHSplitter.className = "";
    
    Firebug.chrome.draw();
    
    // avoid text selection in IE when returning to the document
    // after the mouse leaves the document during the resizing
    return false;
};


// ************************************************************************************************
// Vertical Splitter Handling

var onVSplitterMouseDown = function onVSplitterMouseDown(event)
{
    addGlobalEvent("mousemove", onVSplitterMouseMove);
    addGlobalEvent("mouseup", onVSplitterMouseUp);
    
    return false;
};

var lastVSplitterMouseMove = 0;

var onVSplitterMouseMove = function onVSplitterMouseMove(event)
{
    if (new Date().getTime() - lastVSplitterMouseMove > chromeRedrawSkipRate) // frame skipping
    {
        var target = event.target || event.srcElement;
        if (target && target.ownerDocument) // avoid error when cursor reaches out of the chrome
        {
            var clientX = event.clientX;
            var win = document.all
                ? event.srcElement.ownerDocument.parentWindow
                : event.target.ownerDocument.defaultView;
          
            if (win != win.parent)
                clientX += win.frameElement ? win.frameElement.offsetLeft : 0;
            
            var size = Firebug.chrome.getWindowSize();
            var x = Math.max(size.width - clientX + 3, 6);
            
            ChromeCache.sidePanelWidth = x;
            Firebug.chrome.draw();
        }
        
        lastVSplitterMouseMove = new Date().getTime();
    }
    
    cancelEvent(event, true);
    return false;
};

var onVSplitterMouseUp = function onVSplitterMouseUp(event)
{
    removeGlobalEvent("mousemove", onVSplitterMouseMove);
    removeGlobalEvent("mouseup", onVSplitterMouseUp);
    
    Firebug.chrome.draw();
};


// ************************************************************************************************
}});