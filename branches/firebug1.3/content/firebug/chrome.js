FBL.ns(function() { with (FBL) {

    
FBL.FirebugChrome = 
{
    commandLineVisible: true,
    sidePanelVisible: false,
    sidePanelWidth: 300,
    selectedPanel: "Console",
    
    height: 250,
    
    isOpen: false,
    
    create: function()
    {
        createChrome({onLoad: onChromeLoad});
    },
    
    initialize: function()
    {
        var chrome = Firebug.chrome = new Chrome(Application.chrome);
        Firebug.chromeMap[chrome.type] = chrome;
        //chrome.initialize();    
    }
};
    
// ************************************************************************************************
var onPopupChromeLoad = function(chromeContext)
{
    FBTrace.sysout("onPopupChromeLoad", "-------------------------");
    
    var frame = Firebug.chromeMap.frame;
    
    if (frame)
    {
        frame.close();
    }
    
    FBL.FirebugChrome.commandLineVisible = true;
    FBL.FirebugChrome.sidePanelVisible = false;
       
    
    var popup = Firebug.chrome = new Chrome(chromeContext);
    
    // chrome synchronization
    var framePanelMap = frame.panelMap;
    var popupPanelMap = popup.panelMap;
    for(var name in framePanelMap)
    {
        popupPanelMap[name].contentNode.innerHTML = framePanelMap[name].contentNode.innerHTML;
    }
    
    popup.initialize();    
    dispatch(Firebug.modules, "initialize", []);
    
    if(FirebugChrome.selectedElement)
        Firebug.HTML.selectTreeNode(FirebugChrome.selectedElement);
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
    
    var context = options.context || Application.browser;
    var onLoad = options.onLoad;
    
    var chrome = {};
    
    chrome.type = options.type;
    
    var isChromeFrame = chrome.type == "frame";
    var isBookmarletMode = Application.isBookmarletMode;
    var url = isBookmarletMode ? "about:blank" : Application.location.skin;
    
    if (isChromeFrame)
    {
        // Create the Chrome Frame
        var node = chrome.node = context.document.createElement("iframe");
        
        node.setAttribute("id", options.id);
        node.setAttribute("frameBorder", "0");
        node.style.border = "0";
        node.style.visibility = "hidden";
        node.style.zIndex = "2147483647"; // MAX z-index = 2147483647
        node.style.position = isIE6 ? "absolute" : "fixed";
        node.style.width = "100%"; // "102%"; IE auto margin bug
        node.style.left = "0";
        node.style.bottom = isIE6 ? "-1px" : "0";
        node.style.height = options.height + "px";
        
         // avoid flickering during chrome rendering
        if (isFirefox)
            node.style.display = "none";
        
        if (!isBookmarletMode)
            node.setAttribute("src", Application.location.skin);
        
        context.document.body.appendChild(node);
    }
    else
    {
        // Create the Chrome Popup
        var height = FirebugChrome.height || options.height;
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
    }
    
    if (isBookmarletMode)
    {
        var tpl = getChromeTemplate();
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
            
            if (isChromeFrame)
                ChromeMini.create(chrome);            
            
            if (onLoad)
                onLoad(chrome);
        }
        else
            setTimeout(waitForChrome, waitDelay);
    }
    
    waitForChrome();
};


var onChromeLoad = function onChromeLoad(chrome)
{
    Application.chrome = chrome;
    
    if (FBTrace.DBG_INITIALIZE) FBTrace.sysout("Chrome onChromeLoad", "chrome loaded");
    
    if (Application.isPersistentMode)
    {
        chrome.window.FirebugApplication = Application;
    
        if (Application.isDevelopmentMode)
        {
            FBDev.loadChromeApplication(chrome);
        }
        else
        {
            var doc = chrome.document;
            var script = doc.createElement("script");
            script.src = Application.location.app;
            doc.getElementsByTagName("head")[0].appendChild(script);
        }
    }
    else
        // initialize the chrome application
        setTimeout(function(){
            FBL.Firebug.initialize();
        },100);
};


var getChromeTemplate = function()
{
    var tpl = FirebugChrome.injected; 
    var r = [], i = -1;
    
    r[++i] = '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/DTD/strict.dtd">';
    r[++i] = '<html><head><title>';
    r[++i] = Firebug.version;
    r[++i] = '</title><style>';
    r[++i] = tpl.CSS;
    r[++i] = (isIE6 && tpl.IE6CSS) ? tpl.IE6CSS : '';
    r[++i] = '</style>';
    r[++i] = '</head><body>';
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
    
    Firebug.chromeMap[type] = this;
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
        addGlobalEvent("keydown", onPressF12);
    
        Firebug.PanelBar.create.apply(this);
        var panelMap = Firebug.panelTypes;
        for (var i=0, p; p=panelMap[i]; i++)
        {
            if (!p.parentPanel)
            {
                this.addPanel(p.prototype.name);
            }
        }
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
        if (FBTrace.DBG_INITIALIZE) FBTrace.sysout("Firebug.chrome.initialize", "initializing chrome");
        
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
        if (isIE6)
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
        
        // Select the first registered panel
        this.selectPanel(FirebugChrome.selectedPanel);
        
        // ************************************************************************************************
        // ************************************************************************************************
        // ************************************************************************************************
        // ************************************************************************************************
        this.inspectButton = new Firebug.Button({
            type: "toggle",
            node: $("fbChrome_btInspect"),
            owner: Firebug.Inspector,
            
            onPress: Firebug.Inspector.startInspecting,
            onUnpress: Firebug.Inspector.stopInspecting          
        });
        
        this.inspectButton.initialize();
        
        Firebug.Inspector.initialize();
        Firebug.Inspector.onChromeReady();
        
        addEvent(fbPanel1, 'mousemove', Firebug.HTML.onListMouseMove);
        addEvent(fbPanel1, 'mouseout', Firebug.HTML.onListMouseMove);
        // ************************************************************************************************
        // ************************************************************************************************
        // ************************************************************************************************
        // ************************************************************************************************
        
        
        // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
        //this.draw();
    },
    
    shutdown: function()
    {
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
            // If the context is a popup, ignores the toggle process
            if (Firebug.chrome.type == "popup") return;
            
            var shouldOpen = forceOpen || !FirebugChrome.isOpen;
            
            if(shouldOpen)
               this.open();
            else
               this.close();
        }       
    },
    
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    
    detach: function()
    {
        if(!Firebug.chromeMap.popup)
        {     
            createChrome({type: "popup", onLoad: onPopupChromeLoad});
        }
    },
    
    reattach: function()
    {
        
    },
    
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

    draw: function()
    {
        var size = Firebug.chrome.getWindowSize();
        
        // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
        // Height related drawings
        var chromeHeight = size.height;
        var commandLineHeight = FirebugChrome.commandLineVisible ? fbCommandLine.offsetHeight : 0;
        var fixedHeight = topHeight + commandLineHeight;
        var y = Math.max(chromeHeight, topHeight);
        
        fbPanel1Style.height = Math.max(y - fixedHeight, 0)+ "px";
        fbPanelBox1Style.height = Math.max(y - fixedHeight, 0)+ "px";
        
        if (isIE || isOpera)
        {
            // Fix IE and Opera problems with auto resizing the verticall splitter
            fbVSplitterStyle.height = Math.max(y - topPartialHeight - commandLineHeight, 0) + "px";
        }
        else if (isFirefox)
        {
            // Fix Firefox problem with table rows with 100% height (fit height)
            fbContentStyle.maxHeight = Math.max(y - fixedHeight, 0)+ "px";
        }
        
        // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
        // Width related drawings
        var chromeWidth = size.width /* window borders */;
        var sideWidth = FirebugChrome.sidePanelVisible ? FirebugChrome.sidePanelWidth : 0;
        
        fbPanelBox1Style.width = Math.max(chromeWidth - sideWidth, 0) + "px";
        fbPanel1Style.width = Math.max(chromeWidth - sideWidth, 0) + "px";                
        
        if (FirebugChrome.sidePanelVisible)
        {
            fbPanelBox2Style.width = sideWidth + "px";
            fbPanelBar2BoxStyle.width = Math.max(sideWidth, 0) + "px";
            fbVSplitterStyle.right = Math.max(sideWidth - 6, 0) + "px";
        }
    },
    
    resize: function()
    {
        var self = this;
        // avoid partial resize when maximizing window
        setTimeout(function(){
            self.draw();
            
            if (isIE && self.type == "frame")
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
        
        if (FirebugChrome.isOpen)
            this.open();
        else
        {
            FirebugChrome.isOpen = true;
            this.close();
        }
        
        if (this.node.style.visibility != "visible")
            this.node.style.visibility = "visible";
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
        
        if (isIE6)
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
    },
    
    open: function()
    {
        //debugger;
        if (!FirebugChrome.isOpen)
        {
            var node = this.node;
            node.style.visibility = "hidden"; // Avoid flickering
            
            ChromeMini.shutdown();
            
            var main = $("fbChrome");
            main.style.display = "block";
            
            FirebugChrome.isOpen = true;
            
            var self = this;
            setTimeout(function(){
                dispatch(Firebug.modules, "initialize", []);
                self.initialize();
                
                self.draw();
                node.style.visibility = "visible";            
            }, 10);
        }
    },
    
    close: function()
    {
        //debugger;
        if (FirebugChrome.isOpen)
        {
            var main = $("fbChrome");
            main.style.display = "none";
                    
            FirebugChrome.isOpen = false;
            
            // TODO: handle inside chrome.close()
            if (this.isInitialized)
            {
                dispatch(Firebug.modules, "shutdown", []);
                this.shutdown();
            }
            
            ChromeMini.initialize();
        }
    },
    
    fixIEPosition: function()
    {
        // fix IE problem with offset when not in fullscreen mode
        var offset = isIE ? this.document.body.clientTop || this.document.documentElement.clientTop: 0;
        
        var size = Firebug.browser.getWindowSize();
        var scroll = Firebug.browser.getWindowScrollPosition();
        var maxHeight = size.height;
        var height = this.node.offsetHeight;
        
        this.node.style.top = maxHeight - height + scroll.top + "px";
    }

});


// ************************************************************************************************
// ChromeMini

var ChromeMini = extend(Firebug.Controller, 
{
    create: function(chrome)
    {
        append(this, chrome);
    },
    
    initialize: function()
    {
        Firebug.Controller.initialize.apply(this);
        
        var mini = $("fbMiniChrome");
        mini.style.display = "block";
        
        var width = $("fbMiniIcon").offsetWidth + 10;
        var errors = $("fbMiniErrors");
        if (errors.offsetWidth)
            width += errors.offsetWidth + 10;
        
        var node = this.node;
        node.style.height = "27px";
        node.style.width = width + "px";
        node.style.left = "";
        node.style.right = 0;
        node.setAttribute("allowTransparency", "true");

        if (isIE6)
            this.fixIEPosition();
        
        this.document.body.style.backgroundColor = "transparent";
        
        
        this.addController(
            [$("fbMiniIcon"), "click", onMiniIconClick]       
        );
        
        if (isIE6)
        {
            this.addController(
                [Firebug.browser.window, "scroll", this.fixIEPosition]
            );
        }        
    },
    
    shutdown: function()
    {
        var node = this.node;
        node.style.height = FirebugChrome.height + "px";
        node.style.width = "100%";
        node.style.left = 0;
        node.style.right = "";
        node.setAttribute("allowTransparency", "false");
        
        if (isIE6)
            this.fixIEPosition();
        
        this.document.body.style.backgroundColor = "#fff";
        
        var mini = $("fbMiniChrome");
        mini.style.display = "none";
        
        Firebug.Controller.shutdown.apply(this);
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
    
    shutdown: function()
    {
        ChromeBase.shutdown.apply(this);
    },
    
    close: function()
    {
        this.shutdown();
        this.node.close();
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

var chromeRedrawSkipRate = isIE ? 30 : isOpera ? 50 : 75;


//************************************************************************************************
// UI helpers

var changeCommandLineVisibility = function changeCommandLineVisibility(visibility)
{
    var last = FirebugChrome.commandLineVisible;
    FirebugChrome.commandLineVisible = typeof visibility == "boolean" ? visibility : !FirebugChrome.commandLineVisible;
    
    if (FirebugChrome.commandLineVisible != last)
    {
        fbBottom.className = FirebugChrome.commandLineVisible ? "" : "hide";
    }
};

var changeSidePanelVisibility = function changeSidePanelVisibility(visibility)
{
    var last = FirebugChrome.sidePanelVisible;
    FirebugChrome.sidePanelVisible = typeof visibility == "boolean" ? visibility : !FirebugChrome.sidePanelVisible;
    
    if (FirebugChrome.sidePanelVisible != last)
    {
        fbPanelBox2.className = FirebugChrome.sidePanelVisible ? "" : "hide"; 
        fbPanelBar2Box.className = FirebugChrome.sidePanelVisible ? "" : "hide";
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
            var framePos = Firebug.Inspector.getElementPosition(frameElement).top;
            clientY += framePos;
            
            if (frameElement.style.position != "fixed")
                clientY -= Firebug.browser.getWindowScrollPosition().top;
        }
    }
    
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
    var commandLineHeight = FirebugChrome.commandLineVisible ? fbCommandLine.offsetHeight : 0;
    var fixedHeight = topHeight + commandLineHeight;
    var chromeNode = Firebug.chrome.node;
    
    var scrollbarSize = !isIE && (scrollSize.width > windowSize.width) ? 17 : 0;
    
    var height = isOpera ? chromeNode.offsetTop + chromeNode.clientHeight : windowSize.height; 
     
    // compute the min and max size of the chrome
    var chromeHeight = Math.max(height - clientY + 5 - scrollbarSize, fixedHeight);
        chromeHeight = Math.min(chromeHeight, windowSize.height - scrollbarSize);

    FirebugChrome.height = chromeHeight;
    chromeNode.style.height = chromeHeight + "px";
    
    if (isIE6)
        Firebug.chrome.fixIEPosition();
    
    Firebug.chrome.draw();
};

var onHSplitterMouseUp = function onHSplitterMouseUp(event)
{
    removeGlobalEvent("mousemove", onHSplitterMouseMove);
    removeGlobalEvent("mouseup", onHSplitterMouseUp);
    
    fbHSplitter.className = "";
    
    Firebug.chrome.draw();
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
            
            FirebugChrome.sidePanelWidth = x;
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