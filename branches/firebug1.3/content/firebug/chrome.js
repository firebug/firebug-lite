FBL.ns(function() { with (FBL) {
// ************************************************************************************************

// ************************************************************************************************
// 

var ChromeDefaultOptions = 
{
    type: "frame",
    id: "FirebugChrome",
    height: 250
};

// ************************************************************************************************
// 

FBL.createChrome = function(context, options, onChromeLoad)
{
    options = options || {};
    options = extend(ChromeDefaultOptions, options);
    
    var chrome = {};
    
    chrome.type = options.type;
    
    var isChromeFrame = chrome.type == "frame";
    var isBookmarletMode = application.isBookmarletMode;
    var url = isBookmarletMode ? "" : application.location.skin;
    
    if (isChromeFrame)
    {
        // Create the Chrome Frame
        var node = chrome.node = context.document.createElement("iframe");
        
        node.setAttribute("id", options.id);
        node.setAttribute("frameBorder", "0");
        node.setAttribute("allowTransparency", "true");
        node.style.border = "0";
        node.style.visibility = "hidden";
        node.style.zIndex = "2147483647"; // MAX z-index = 2147483647
        node.style.position = isIE6 ? "absolute" : "fixed";
        node.style.width = "100%"; // "102%"; IE auto margin bug
        node.style.left = "0";
        node.style.bottom = isIE6 ? "-1px" : "0";
        node.style.height = options.height + "px";
        
        var isBookmarletMode = application.isBookmarletMode;
        if (!isBookmarletMode)
            node.setAttribute("src", application.location.skin);
        
        context.document.body.appendChild(node);
    }
    else
    {
        // Create the Chrome Popup
        var height = options.height;
        var options = [
                "true,top=",
                Math.max(screen.height - height, 0),
                ",left=0,height=",
                height,
                ",width=",
                screen.width-10, // Opera opens popup in a new tab if it's too big!
                ",resizable"          
            ].join("");
        
        var node = chrome.node = Firebug.browser.window.open(
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
            setTimeout(waitForChrome, 20);            
    }
    
    waitForChrome();    
};

var getChromeTemplate = function()
{
    var tpl = FirebugChrome.injected; 
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
// FirebugChrome Class
    
FBL.FirebugChrome = function(chrome)
{
    var Base = chrome.type == "frame" ? ChromeFrameBase : ChromePopupBase; 
    append(this, chrome);
    append(this, Base);
    
    return this;
};

// ************************************************************************************************
// ChromeBase
    
var ChromeBase = extend(Firebug.Controller, {
    
    destroy: function()
    {
        this.shutdown();
    },
    
    initialize: function()
    {
        // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
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
        
        // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
        // static values cache
        
        topHeight = fbTop.offsetHeight;
        topPartialHeight = fbToolbar.offsetHeight;
        
        // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
        
        // create a new instance of the CommandLine class
        commandLine = new Firebug.CommandLine(fbCommandLine);
        
        
        // initialize all panels here...
        
        
        flush();
        
        if (!isSafari)
            this.draw();
    },
    
    shutdown: function()
    {
        // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
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
        
        // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
        // static values cache
        
        topHeight = null;
        topPartialHeight = null;
        
        // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

        // destroy the instance of the CommandLine class
        commandLine.destroy();
        
        // shutdown the chrome instance
        Firebug.chrome.shutdown();
    },
    
    
    draw: function()
    {
        // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
        // TODO: Revise
        var frame = Firebug.chrome.node;
        var commandLineVisible = true;
        var rightPanelVisible = false;
        var sidePanelWidth = 0;
        // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
        
        
        var size = Firebug.chrome.getWindowSize();
        var chromeHeight = size.height;/**/
        //var chromeHeight = frame.clientHeight;
        var commandLineHeight = commandLineVisible ? fbCommandLine.offsetHeight : 0;
        var fixedHeight = topHeight + commandLineHeight;
        var y = Math.max(chromeHeight, topHeight);
        
        fbVSplitterStyle.height = y - topPartialHeight - commandLineHeight + "px"; 
        //frame.style.height = y + "px";
        fbContentStyle.height = Math.max(y - fixedHeight, 0)+ "px";
        fbPanel1Style.height = Math.max(y - fixedHeight, 0)+ "px";
        
        // Fix Firefox problem with table rows with 100% height (fit height)
        if (isFirefox)
        {
            fbContentStyle.maxHeight = Math.max(y - fixedHeight, 0)+ "px";
        }
  
        var chromeWidth = size.width -2 /* window borders */;
        //var chromeWidth = frame.offsetLeft + frame.clientWidth;
        var sideWidth = rightPanelVisible ? sidePanelWidth : 0;
        
        fbPanelBox1Style.width = Math.max(chromeWidth - sideWidth, 0) + "px";
        fbPanel1Style.width = Math.max(chromeWidth - sideWidth, 0) + "px";                
        
        if (rightPanelVisible)
        {
            fbPanelBox2Style.width = sideWidth + "px";
            fbPanelBar2BoxStyle.width = Math.max(sideWidth - 1, 0) + "px";
            fbVSplitterStyle.right = Math.max(sideWidth - 6, 0) + "px";
        }
    }    
    
});

// ************************************************************************************************
// ChromeFrameBase

var ChromeContext = extend(ChromeBase, Context.prototype); 

var ChromeFrameBase = extend(ChromeContext, {
    
    initialize: function()
    {
        ChromeBase.initialize.call(this)
        Firebug.Controller.initialize.call(this);
        
        this.addController(
                [Firebug.browser.window, "resize", this.draw],
                [Firebug.browser.window, "unload", this.destroy]
            );
        
        if (isIE6)
        {
            this.addController(
                    [Firebug.browser.window, "resize", this.fixPosition],
                    [Firebug.browser.window, "scroll", this.fixPosition]
                );
        }
        
        //fbVSplitter.onmousedown = onVSplitterMouseDown;
        fbHSplitter.onmousedown = onHSplitterMouseDown;
        //toggleRightPanel();
        
        // TODO: Check visibility preferences here
        this.node.style.visibility = "visible";
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
            chrome.fixPosition();
        
        var main = $("fbChrome");
        main.style.display = "none";

        chrome.document.body.style.backgroundColor = "transparent";
        
        var mini = $("fbMiniChrome");
        mini.style.display = "block";
    },
    
    shutdown: function()
    {
        Firebug.Controller.shutdown.apply(this);
    },
    
    fixPosition: function()
    {
        
        // fix IE problem with offset when not in fullscreen mode
        var offset = isIE ? this.document.body.clientTop || this.document.documentElement.clientTop: 0;
        
        var size = Firebug.Inspector.getWindowSize();
        var scroll = Firebug.Inspector.getWindowScrollPosition();
        var maxHeight = size.height;
        var height = Firebug.chrome.node.offsetHeight;
        
        Firebug.chrome.node.style.top = maxHeight - height + scroll.top + "px";
        //this.draw();
        /**/
        
        /*
        var maxHeight = document.body.clientHeight;
        var height = this.node.offsetHeight;
        
        this.node.style.top = maxHeight - height + document.body.scrollTop + "px";
        this.draw();
        /**/        
    }

});


// ************************************************************************************************
// ChromePopupBase

var ChromePopupBase = extend(ChromeContext, {
    
    initialize: function()
    {
        ChromeBase.initialize.call(this)
        Firebug.Controller.initialize.call(this);
        
        this.addController(
                [Firebug.browser.window, "resize", this.draw],
                [Firebug.browser.window, "unload", this.destroy]
            );
    },
    
    shutdown: function()
    {
        Firebug.Controller.shutdown.apply(this);
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

var topHeight = null;
var topPartialHeight = null;


// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
//

var chromeRedrawSkipRate = isIE ? 30 : isOpera ? 50 : 0;


// ************************************************************************************************
// Section

var onHSplitterMouseDown = function onHSplitterMouseDown(event)
{
    addGlobalEvent("mousemove", onHSplitterMouseMove);
    addGlobalEvent("mouseup", onHSplitterMouseUp);
    
    return false;
};

var lastHSplitterMouseMove = 0;

var onHSplitterMouseMove = function onHSplitterMouseMove(event)
{
    cancelEvent(event, true);
    
    if (new Date().getTime() - lastHSplitterMouseMove > chromeRedrawSkipRate)
    {
        var clientY = event.clientY;
        var win = document.all
            ? event.srcElement.ownerDocument.parentWindow
            : event.target.ownerDocument && event.target.ownerDocument.defaultView;
      
        if (!win)
            return;
        
        if (win != win.parent)
            clientY += win.frameElement ? win.frameElement.offsetTop : 0;

        // ****************************************************************************************
        // TODO: revise
        var commandLineVisible = true;
        // ****************************************************************************************
        
        var size = Firebug.browser.getWindowSize();
        var chrome = Firebug.chrome.node;
        var height = (isIE && win == top) ? size.height : chrome.offsetTop + chrome.clientHeight; 
        
        var commandLineHeight = commandLineVisible ? fbCommandLine.offsetHeight : 0;
        var fixedHeight = topHeight + commandLineHeight + 1;
        var y = Math.max(height - clientY + 7, fixedHeight);
            y = Math.min(y, size.height);
          
        chrome.style.height = y + "px";
        
        /*
        var t = event.srcElement || event.target;
        Firebug.Console.log(
            "event.clientY:", event.clientY,
            "y: ", y, 
            "clientY: ", clientY, 
            "  height: ", height,
            "window: ", win.FBL,
            "parent window: ", win.parent.FBL,
            "frameoff: ", win.frameElement ? win.frameElement.offsetTop : -1
            ); /**/
        
        if (isIE6)
          Firebug.chrome.fixPosition();
        
        Firebug.chrome.draw();
        
        lastHSplitterMouseMove = new Date().getTime();
    }
    
    return false;
};

var onHSplitterMouseUp = function onHSplitterMouseUp(event)
{
    removeGlobalEvent("mousemove", onHSplitterMouseMove);
    removeGlobalEvent("mouseup", onHSplitterMouseUp);
    
    Firebug.chrome.draw();
};








var toggleCommandLine = function toggleCommandLine()
{
    commandLineVisible = !commandLineVisible;
    fbBottom.className = commandLineVisible ? "" : "hide";
};

var rightPanelVisible = true;
function toggleRightPanel()
{
    rightPanelVisible = !rightPanelVisible;
    fbPanelBox2.className = rightPanelVisible ? "" : "hide"; 
    fbPanelBar2Box.className = rightPanelVisible ? "" : "hide";
};




// ************************************************************************************************
}});