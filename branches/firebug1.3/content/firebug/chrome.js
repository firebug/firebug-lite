FBL.ns(function() { with (FBL) {

    
FBL.FirebugChrome = 
{
    commandLineVisible: true,
    sidePanelVisible: false,
    sidePanelWidth: 300,
    selectedPanel: "Console",
    
    
    initialize: function()
    {
        var options = FBL.extend({}, WindowDefaultOptions);
        
        FBL.createChrome(Application.browser, options, onChromeLoad);
    }
};
    

// ************************************************************************************************
// Application Chromes

var WindowDefaultOptions = 
{
    type: "frame"
};

var FrameDefaultOptions = 
{
    id: "FirebugChrome",
    height: 250
};

var PopupDefaultOptions = 
{
    id: "FirebugChromePopup",
    height: 250
};





// ************************************************************************************************
var onPopupChromeLoad = function(chromeContext)
{
    var chrome = Firebug.chrome = new Chrome(chromeContext);
    Firebug.chromeMap[chrome.type] = chrome;
    chrome.initialize();
    
    dispatch(Firebug.modules, "initialize", []);
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

FBL.createChrome = function(context, options, onChromeLoad)
{
    options = options || {};
    options = extend(ChromeDefaultOptions, options);
    
    var chrome = {};
    
    chrome.type = options.type;
    
    var isChromeFrame = chrome.type == "frame";
    var isBookmarletMode = Application.isBookmarletMode;
    var url = isBookmarletMode ? "" : Application.location.skin;
    
    if (isChromeFrame)
    {
        // Create the Chrome Frame
        var node = chrome.node = context.document.createElement("iframe");
        
        node.setAttribute("id", options.id);
        node.setAttribute("frameBorder", "0");
        //node.setAttribute("allowTransparency", "true"); // bug in IE in some pages
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
        
        var isBookmarletMode = Application.isBookmarletMode;
        if (!isBookmarletMode)
            node.setAttribute("src", Application.location.skin);
        
        context.document.body.appendChild(node);
    }
    else
    {
        // Create the Chrome Popup
        var height = options.height;
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
        
        /*
        if (node)
        {
            node.focus();
        }
        else
        {
            //Chrome.Popup.element = null;
            alert("Disable the popup blocker to open the console in another window!")
        }
        /**/
    }
    
    if (isBookmarletMode)
    {
        var tpl = getChromeTemplate();
        var doc = isChromeFrame ? node.contentWindow.document : node.document;
        doc.write(tpl);
        doc.close();
    }
    
    var win;
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
            
            if (onChromeLoad)
                onChromeLoad(chrome);
        }
        else
            setTimeout(waitForChrome, 10);
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
    var tpl = Chrome.injected; 
    var r = [], i = -1;
    
    r[++i] = '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/DTD/strict.dtd">';
    r[++i] = '<head><style>';
    r[++i] = tpl.CSS;
    r[++i] = (isIE6 && tpl.IE6CSS) ? tpl.IE6CSS : '';
    r[++i] = '</style>';
    r[++i] = '</head><body>';
    r[++i] = tpl.HTML;
    r[++i] = '</body>';
    
    return r.join("");
};

// ************************************************************************************************
// Chrome Class
    
FBL.Chrome = function(chrome)
{
    var Base = chrome.type == "frame" ? ChromeFrameBase : ChromePopupBase; 
    
    append(this, chrome); // inherit chrome window properties
    append(this, Base);   // inherit chrome class properties (ChromeFrameBase or ChromePopupBase)
    
    return this;
};

// ************************************************************************************************
// ChromeBase

var ChromeBase = extend(new Firebug.Controller(), Firebug.PanelBar);
var ChromeBase = extend(ChromeBase, {
    
    destroy: function()
    {
        this.shutdown();
    },
    
    initialize: function()
    {
        if (FBTrace.DBG_INITIALIZE) FBTrace.sysout("Firebug.chrome.initialize", "initializing chrome");
        
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
        // initialize inherited classes
        Firebug.Controller.prototype.initialize.apply(this);
        Firebug.PanelBar.initialize.apply(this);
        
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
        
        var panelMap = Firebug.panelTypes;
        for (var i=0, p; p=panelMap[i]; i++)
        {
            if (!p.parentPanel)
            {
                this.addPanel(p.prototype.name);
            }
        }
        
        // Select the first registered panel
        this.selectPanel(FirebugChrome.selectedPanel);
        
        // ************************************************************************************************
        // ************************************************************************************************
        // ************************************************************************************************
        // ************************************************************************************************
        var toolButton = new Firebug.ToolButton({
            type: "toggle",
            panel: Firebug.chrome.panelMap.Console, 
            module: Firebug.Console
        });
        toolButton.initialize();
        
        Firebug.Inspector.initialize();
        Firebug.Inspector.onChromeReady();
        
        addEvent(fbPanel1, 'mousemove', Firebug.HTML.onListMouseMove);
        addEvent(fbPanel1, 'mouseout', Firebug.HTML.onListMouseMove);
        // ************************************************************************************************
        // ************************************************************************************************
        // ************************************************************************************************
        // ************************************************************************************************
        
        
        // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
        Firebug.Console.flush();
        
        if (Firebug.Trace)
            FBTrace.flush(Firebug.Trace);
        
        // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
        this.draw();
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
        Firebug.Controller.prototype.shutdown.apply(this);
        Firebug.PanelBar.shutdown.apply(this);
        
        // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
        // destroy the instance of the CommandLine class
        commandLine.destroy();
    },
    
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    
    show: function()
    {
        
    },
    
    hide: function()
    {
        
    },
    
    toggle: function(forceOpen, popup)
    {
        if(popup)
        {
            var context = Firebug.chrome = Firebug.chromeMap.popup;
            
            var chromeReady = true;
            if(chromeReady)
            {
                if(!context)
                {     
                    if (Firebug.chromeMap.frame)
                    {
                        Firebug.chromeMap.frame.isVisible = false;
                        Firebug.chromeMap.frame.node.style.visibility = "hidden";
                    }
                    
                    chromeReady = false;
                    FBTrace.module = null;
                    
                    createChrome(Application.browser, {id:"i",type:"popup"}, onPopupChromeLoad);
                    //context.create();
                    //waitForChrome();
                }
            }
            //else
            //    waitForDocument();
        }
        else
        {
            // If the context is a popup, ignores the toggle process
            if (Firebug.chrome.type == "popup") return;
            
            var context = Firebug.chrome = Firebug.chromeMap.frame;
            context.isVisible = forceOpen || !context.isVisible;
            
            var chromeReady = true;
            if(chromeReady)
            { 
                if(context.node)
                {
                    if(context.isVisible)
                    {
                        context.node.style.visibility = "visible";
                        //waitForChrome();
                        
                    } else {
                        context.node.style.visibility = "hidden";
                    }
                }
                else
                {
                    //context.create();
                    //waitForChrome();
                }
                    
            }
            //else
            //    waitForDocument();
            
        }       
    },
    
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    
    detach: function()
    {
        
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
        setTimeout(function(){
            self.draw();
            
            if (isIE && self.type == "frame")
                self.fixIEPosition();
        }, 0);
    },
    
    layout: function(panel)
    {
        var options = panel.options;
        changeCommandLineVisibility(options.hasCommandLine);
        changeSidePanelVisibility(options.hasSidePanel);
        Firebug.chrome.draw();
    }
    
});

// ************************************************************************************************
// ChromeFrameBase

var ChromeContext = extend(ChromeBase, Context.prototype); 

var ChromeFrameBase = extend(ChromeContext, {
    
    initialize: function()
    {
        // restore display for the anti-flicker trick
        if (isFirefox)
            this.node.style.display = "block";        
        
        // TODO: Check visibility preferences here
        this.isVisible = true;
        this.node.style.visibility = "visible";
        
        ChromeBase.initialize.call(this);
        
        this.addController(
            [Firebug.browser.window, "resize", this.resize],
            [Firebug.browser.window, "unload", this.destroy]
        );
        
        if (isIE6)
        {
            this.addController(
                //[Firebug.browser.window, "resize", this.fixIEPosition],
                [Firebug.browser.window, "scroll", this.fixIEPosition]
            );
        }
        
        fbVSplitter.onmousedown = onVSplitterMouseDown;
        fbHSplitter.onmousedown = onHSplitterMouseDown;
    },
    
    shutdown: function()
    {
        ChromeBase.shutdown.apply(this);
    },
    
    show: function()
    {
        
    },
    
    hide: function()
    {
        var chrome = Firebug.chrome;
        var node = chrome.node;
        node.style.height = "27px";
        node.style.width = "100px";
        node.style.left = "";        
        node.style.right = 0;

        if (isIE6)
            chrome.fixIEPosition();
        
        var main = $("fbChrome");
        main.style.display = "none";

        chrome.document.body.style.backgroundColor = "transparent";
        
        var mini = $("fbMiniChrome");
        mini.style.display = "block";
    },
    
    fixIEPosition: function()
    {
        // fix IE problem with offset when not in fullscreen mode
        var offset = isIE ? this.document.body.clientTop || this.document.documentElement.clientTop: 0;
        
        var size = Firebug.browser.getWindowSize();
        var scroll = Firebug.browser.getWindowScrollPosition();
        var maxHeight = size.height;
        var height = Firebug.chrome.node.offsetHeight;
        
        Firebug.chrome.node.style.top = maxHeight - height + scroll.top + "px";
    }

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
            [Firebug.chrome.window, "unload", this.destroy]
        );
        
        fbVSplitter.onmousedown = onVSplitterMouseDown;
    },
    
    shutdown: function()
    {
        ChromeBase.shutdown.apply(this);
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