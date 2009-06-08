FBL.ns(function() { with (FBL) {
// ************************************************************************************************

  
// ************************************************************************************************
// Chrome API

var ChromeAPI =
{
    close: function()
    {
        var context = Chrome.context;
        
        if (context)
        {
            if (context.element && context.element.opener)
                context.element.close();
                
            if (context.isVisible)
                Chrome.toggle();
        }
    },
    
    detach: function()
    {
        Chrome.toggle(true, true);
    },    
    
    showTab: function(tabName)
    {
        if (tabName == 0 && tabName != selectedTab)
        {
            selectedTab = 0;
            tabL = fbConsole;
            tabLStyle = tabL.style;
            
            fbConsole.style.display = "block";
            fbHTML.style.display = "none";
            
            Chrome.document.getElementById("tc").className = "tab selectedTab";
            Chrome.document.getElementById("th").className = "tab";
            
            toggleCommandLine();
            toggleRightPanel();
            Chrome.draw();

        }
        else if (tabName == 1 && tabName != selectedTab)
        {
            selectedTab = 1;
            tabL = fbHTML;
            tabLStyle = tabL.style;
            
            fbHTML.style.display = "block";
            fbConsole.style.display = "none";

            Chrome.document.getElementById("tc").className = "tab";
            Chrome.document.getElementById("th").className = "tab selectedTab";

            toggleRightPanel();
            toggleCommandLine();
            Chrome.draw();
        }
        
    },
    
    startInspecting: function()
    {
        if (selectedTab != 1)
            this.showTab(1);
          
        Firebug.Inspector.startInspecting();
    },
    
    stopInspecting: function(el)
    {
        Firebug.Inspector.stopInspecting();
    },
    
    clear: function()
    {
        ConsoleAPI.clear();
        Chrome.draw();
    }
    
};


// ************************************************************************************************
// Chrome Module

var Chrome = Firebug.Chrome = 
{
    chromeHeight: 250,
    interfaceFile: "firebug.html",
    injectedMode: true,
    
    context: null,
    
    initialize: function()
    {
        addEvent(
            document, 
            isIE || isSafari ? "keydown" : "keypress", 
            onPressF12
        );
    },
    
    shutdown: function()
    {
      
    },
    
    destroy: function()
    {
        if (Chrome.context == Chrome.Popup)
        {
            destroyContext(Chrome.Popup);

            var last = Chrome.Frame;
            if(last.element)
            {
                createContext(last.document, last);
                last.isVisible = false;
                frame.style.visibility = "hidden";
            }
            else
            {
              chromeReady = false;
            }
        }
        else if (Chrome.context == Chrome.Frame)
        {
            chromeReady = false;
            destroyContext(Chrome.Frame);
        }
    },
    
    toggle: function(forceOpen, popup)
    {
        if(popup)
        {
            var context = Chrome.context = this.Popup;
            
            if(chromeReady)
            {
                if(!context.element)
                {     
                    if (this.Frame.element)
                    {
                        this.Frame.isVisible = false;
                        frame.style.visibility = "hidden";
                    }
                    
                    chromeReady = false;
                    context.create();
                    waitForChrome();
                }
            }
            else
                waitForDocument();
        }
        else
        {
            // If the context is a popup, ignores the toggle process
            if (Chrome.context == Chrome.Popup) return;
            
            var context = Chrome.context = this.Frame; 
            context.isVisible = forceOpen || !context.isVisible;
            
            if(chromeReady)
            { 
                if(context.element)
                {
                    if(context.isVisible)
                    {
                        frame.style.visibility = "visible";
                        waitForChrome();
                        
                    } else {
                        frame.style.visibility = "hidden";
                    }
                }
                else
                {
                    context.create();
                    waitForChrome();
                }
                    
            }
            else
                waitForDocument();
            
        }
    },

    draw: function()
    {
        var height = frame.clientHeight;
        var cmdHeight = commandLineVisible ? fbCommandLine.offsetHeight : 0;
        var fixedHeight = topHeight + cmdHeight;
        var y = Math.max(height, topHeight);
        
        fbVSplitterStyle.height = y - 27 - cmdHeight + "px"; 
        frame.style.height = y + "px";
        fbContentStyle.height = Math.max(y - fixedHeight, 0)+ "px";

        // Fix Firefox problem with table rows with 100% height (fit height)
        if (isFirefox)
        {
            fbContentStyle.maxHeight = Math.max(y - fixedHeight, 0)+ "px";
        }
  
        var width = frame.offsetLeft + frame.clientWidth;
        var x = rightPanelVisible ? sidePanelWidth : 0;
        
        fbPanelBox1Style.width = Math.max(width - x, 0) + "px";
        fbPanel1Style.width = Math.max(width - x, 0) + "px";                
        
        if (rightPanelVisible)
        {
            fbPanelBox2Style.width = x + "px";
            fbPanelBar2BoxStyle.width = Math.max(x -1, 0) + "px";
            fbVSplitterStyle.right = Math.max(x - 6, 0) + "px";
        }
        
        // Avoid horizontal scrollbar problem in IE
        if (isIE)
        {
            var isScrolled = tabL.offsetHeight > fbPanel1.offsetHeight;
            var scrollFix = isScrolled ? 18 : 0;
            tabLStyle.width = Math.max(width -2 - scrollFix - x, 0) + "px";
        }
    },
    
    saveSettings: function()
    {
    },
    
    restoreSettings: function()
    {
    },
    
    focusCommandLine: function()
    {
        //toggleConsole(true);
        //if (commandLine)
        //    commandLine.focus();
    }    

};



// ************************************************************************************************
// Chrome Internals


// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
// Shared variables
FBL.frame = null;
FBL.frameStyle = null;

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
var sidePanelWidth = 300;
var commandLineModule = null;

// Internal variables
var chromeRedrawSkipRate = isIE ? 30 : isOpera ? 50 : 0;
  
var chromeReady = false;
var selectedTab = 0; //Console

var commandLineVisible = true;
var rightPanelVisible = false;

// Internal Cache
var fbTop = null;
var fbContent = null;
var fbContentStyle = null;
var fbBottom = null;

var fbBtnInspect = null;

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

var tabL = null;
var tabLStyle = null;
var tabR = null;

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

var topHeight = null;

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *


// ************************************************************************************************
// Interface Loading


function waitForDocument()
{
    if (document.body && FBL && typeof FBL.loaded != "undefined")
        onDocumentLoad();
    else
        setTimeout(waitForDocument, 100);
};

function onDocumentLoad()
{
    Chrome.context.create();
    waitForChrome();
};

function waitForChrome()
{
    var f = FBL.frame;
    if (f && (Chrome.context == Chrome.Frame) && f.contentWindow &&  
        f.contentWindow.document.getElementById("fbCommandLine") || // frame loaded
        
        f && (Chrome.context == Chrome.Popup) &&  f.document && 
        f.document.getElementById("fbCommandLine")) // popup loaded
    {
        if (!chromeReady)
            onChromeReady();
    }
    else
        setTimeout(waitForChrome, 100);
};

function onChromeReady()
{
    chromeReady = true;
    
    var frame = FBL.frame;
        
    if (Chrome.context == Chrome.Frame) // frame
    {
        Chrome.document = frame.contentWindow.document;
        Chrome.window = frame.contentWindow.window;
    }
    else // popup
    {
        Chrome.document = frame.document;
        Chrome.window = frame.window;
    }
    
    // Create the global variable in the chrome window for the interface API 
    Chrome.window.FB = FBL.ChromeAPI;
    
    // Dispatch the onChromeReady event in the current context
    Chrome.context.onChromeReady(Chrome.document);
    
    // Create the new context
    createContext(Chrome.document, Chrome.context);
    
    Chrome.draw();
};


// ************************************************************************************************
// Interface

function toggleCommandLine()
{
    commandLineVisible = !commandLineVisible;
    fbBottom.className = commandLineVisible ? "" : "hide";
};

function toggleRightPanel()
{
    rightPanelVisible = !rightPanelVisible;
    fbPanelBox2.className = rightPanelVisible ? "" : "hide"; 
    fbPanelBar2Box.className = rightPanelVisible ? "" : "hide";
};



// ************************************************************************************************
// Contexts


var createContext = function createContext(doc, context)
{
    fbCommandLine = $U("fbCommandLine");
    if (Firebug.CommandLine)
        commandLineModule = new Firebug.CommandLine(fbCommandLine);
        
    Chrome.context = context;
    Chrome.context.document = doc;
    Chrome.document = doc;
    
    fbTop = $U("fbTop");
    fbContent = $U("fbContent");
    fbContentStyle = fbContent.style;
    fbBottom = $U("fbBottom");
    
    fbBtnInspect = $U("fbBtnInspect");
    
    fbPanelBox1 = $U("fbPanelBox1");
    fbPanelBox1Style = fbPanelBox1.style;
    fbPanelBox2 = $U("fbPanelBox2");
    fbPanelBox2Style = fbPanelBox2.style;
    fbPanelBar2Box = $U("fbPanelBar2Box");
    fbPanelBar2BoxStyle = fbPanelBar2Box.style;
    
    fbHSplitter = $U("fbHSplitter");
    fbVSplitter = $U("fbVSplitter");
    fbVSplitterStyle = fbVSplitter.style;
    
    fbPanel1 = $U("fbPanel1");
    fbPanel1Style = fbPanel1.style;
    tabR = fbPanel2 = $U("fbPanel2");

    tabL = fbConsole = $U("fbConsole");
    tabLStyle = fbConsoleStyle = fbConsole.style;
    
    fbHTML = $U("fbHTML");

    topHeight = fbTop.offsetHeight;

    fbVSplitter.onmousedown = onVSplitterMouseDown;
    fbHSplitter.onmousedown = onHSplitterMouseDown;
    
    // TODO: refactor
    selectedTab = 0; //Console
    rightPanelVisible = false;
    // TODO: refactor

    if (context == Chrome.Popup)
    {
        frame = doc.body;
        
        if (isIE)
        {
            Chrome.draw();
          
            var fbChrome = $U("fbChrome");
            fbChrome.style.position = "absolute";
            fbChrome.style.marginTop = "-1px";
        }
    }
    else
    {
        frame = document.getElementById("FirebugChrome");
        frameStyle = frame.style;
        
        // TODO: If the document body has some margin (IE default behaviour), the 
        // window won't fit correctly, so an event handler should be added
        if (isIE)
        {
          Chrome.draw();
          
          var margin = document.body.currentStyle.marginRight;
          
          if (margin == "10px")
              frameStyle.width = "102%";
          //else
          //  alert(margin + "TODO: need to add a onresize event to adjust the window width");

        }
    }
    
    var controllers = context.controllers;
    
    controllers.push([   
        Chrome.document, 
        isIE || isSafari ? "keydown" : "keypress", 
        onPressF12
    ]);
    
    if(controllers)
        for(var i=0, ci; ci=controllers[i]; i++)
            addEvent.apply(Chrome, ci);
            

    if (isOpera) Chrome.draw();

        
    // TODO: integrate code
    if(!!chromeLoad) chromeLoad(doc);
    /**/
    
};

var destroyContext = function destroyContext(context)
{
    fbCommandLine = null;
    if (Firebug.CommandLine)
        commandLineModule.destroy;
      
    chromeReady = false;
    Chrome.context.element = null;
    Chrome.frame = null;
    
    fbContent = null;
    fbTop = null;
    fbBtnInspect = null;
    fbVSplitter = null;
    fbHSplitter = null;
    fbBottom = null;
    fbPanelBox2 = null;
    
    fbPanelBox2Style = null;
    fbContentStyle = null;

    topHeight = null;
    
    var controllers = context.controllers;
    if(controllers)
        for(var i=0, ci; ci=controllers[i]; i++)
            removeEvent.apply(Chrome, ci);
};


// ************************************************************************************************
// Event Handlers


var onPressF12 = function onPressF12(event)
{
    if (event.keyCode == 123 /* F12 */ && 
        (!isFirefox && !event.shiftKey || event.shiftKey && isFirefox))
        {
            Firebug.Chrome.toggle(false, event.ctrlKey);
            cancelEvent(event, true);
        }
}


// ************************************************************************************************
// Section

function onHSplitterMouseDown(event)
{
    FBL.addEvent(document, "mousemove", onHSplitterMouseMove);
    FBL.addEvent(document, "mouseup", onHSplitterMouseUp);
  
    for (var i = 0; i < frames.length; ++i)
    {
        try
        {
            FBL.addEvent(frames[i].document, "mousemove", onHSplitterMouseMove);
            FBL.addEvent(frames[i].document, "mouseup", onHSplitterMouseUp);
        }
        catch(E)
        {
            // Avoid acess denied
        }
    }
    
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
        
        var size = Firebug.Inspector.getWindowSize();
        
        var height = (isIE && win == top) ? height = size.height :
                      frame.offsetTop + frame.clientHeight; 
        
        var fixedHeight = topHeight + fbCommandLine.offsetHeight + 1;
        var y = Math.max(height - clientY + 7, topHeight);
            y = Math.min(y, size.height);
          
        frameStyle.height = y + "px";
        
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
        
        if (isIE && Chrome.context.fixIEPosition)
          Chrome.context.fixIEPosition();
        
        Chrome.draw();
        
        lastHSplitterMouseMove = new Date().getTime();
    }
    
    return false;
};

function onHSplitterMouseUp(event)
{
    FBL.removeEvent(document, "mousemove", onHSplitterMouseMove);
    FBL.removeEvent(document, "mouseup", onHSplitterMouseUp);
  
    for (var i = 0; i < frames.length; ++i)
    {
        try
        {
            FBL.removeEvent(frames[i].document, "mousemove", onHSplitterMouseMove);
            FBL.removeEvent(frames[i].document, "mouseup", onHSplitterMouseUp);
        }
        catch(E)
        {
            // Avoid acess denied
        }
    }
    
    Chrome.draw();
};


// ************************************************************************************************
// Section

function onVSplitterMouseDown(event)
{
    FBL.addEvent(Chrome.context.document, "mousemove", onVSplitterMouseMove);
    FBL.addEvent(Chrome.context.document, "mouseup", onVSplitterMouseUp);
  
    for (var i = 0; i < frames.length; ++i)
    {
        FBL.addEvent(frames[i].document, "mousemove", onVSplitterMouseMove);
        FBL.addEvent(frames[i].document, "mouseup", onVSplitterMouseUp);
    }

    FBL.cancelEvent(event, true);
    return false; 
};


var lastVSplitterMouseMove = 0;

var onVSplitterMouseMove = function onVSplitterMouseMove(event)
{
    if (new Date().getTime() - lastVSplitterMouseMove > chromeRedrawSkipRate)
    {
        var clientX = event.clientX;
        var win = document.all
            ? event.srcElement.ownerDocument.parentWindow
            : event.target.ownerDocument.defaultView;
      
        if (win != win.parent)
            clientX += win.frameElement ? win.frameElement.offsetLeft : 0;
        
        var width = frame.offsetLeft + frame.clientWidth;
        var x = Math.max(width - clientX + 3, 7);
        
        sidePanelWidth = x;
        Chrome.draw();
        
        lastVSplitterMouseMove = new Date().getTime();
    }
    
    cancelEvent(event, true);
    return false;
};


function onVSplitterMouseUp(event)
{
    //Chrome.draw();
    FBL.removeEvent(Chrome.context.document, "mousemove", onVSplitterMouseMove);
    FBL.removeEvent(Chrome.context.document, "mouseup", onVSplitterMouseUp);
  
    for (var i = 0; i < frames.length; ++i)
    {
        FBL.removeEvent(frames[i].document, "mousemove", onVSplitterMouseMove);
        FBL.removeEvent(frames[i].document, "mouseup", onVSplitterMouseUp);
    }
};


// ************************************************************************************************
// ***  TODO:  ORGANIZE  **************************************************************************
// ************************************************************************************************
var chromeLoad = function chromeLoad(doc)
{
  
    var rootNode = document.documentElement;
    
    /* Console event handlers */
    addEvent(fbConsole, 'mousemove', onListMouseMove);
    addEvent(fbConsole, 'mouseout', onListMouseOut);
    
    fbHTML.style.display = "none";
    
    Firebug.Inspector.onChromeReady();
    
  /*
     TODO: Organize 
     
    #treeInput {
      position: absolute;
      font: 11px Monaco, monospace;
      margin: 0;
      padding: 0;
      border: 1px solid #777;
    }
    
    */
    
    var html = [];
    Firebug.HTML.appendTreeNode(rootNode, html);
    fbHTML.innerHTML = '';
    fbHTML.innerHTML = html.join('');
    fbHTML.style.padding = "4px 3px 0 15px";
    fbHTML.style.display = "none";

    var doc = Firebug.Chrome.document;
    var input = doc.createElement("input");
    input.id = "treeInput"
    input.style.cssText = "position: absolute; font: 11px Monaco, monospace; margin: 0; padding: 0; border: 1px solid #777;"
    input.style.display = "none";
    doc.body.appendChild(input);

    // HTML event handlers
    input.onblur = fbHTML.onscroll = function()
    {
        input.style.display = "none";
    };
    addEvent(fbHTML, 'click', Firebug.HTML.onTreeClick);
    addEvent(fbHTML, 'mousemove', onListMouseMove);
    addEvent(fbHTML, 'mouseout', onListMouseOut);
    /**/
    
}

function onListMouseOut(e)
{
    e = e || event || window;
    var targ;
    
    if (e.target) targ = e.target;
    else if (e.srcElement) targ = e.srcElement;
    if (targ.nodeType == 3) // defeat Safari bug
      targ = targ.parentNode;
        
      if (targ.id == "fbConsole") {
          FBL.Firebug.Inspector.hideBoxModel();
          hoverElement = null;        
      }
};
    
var hoverElement = null;
var hoverElementTS = 0;

function onListMouseMove(e)
{
    try
    {
        e = e || event || window;
        var targ;
        
        if (e.target) targ = e.target;
        else if (e.srcElement) targ = e.srcElement;
        if (targ.nodeType == 3) // defeat Safari bug
            targ = targ.parentNode;
            
        var found = false;
        while (targ && !found) {
            if (!/\sobjectBox-element\s|\sobjectBox-selector\s/.test(" " + targ.className + " "))
                targ = targ.parentNode;
            else
                found = true;
        }
        
        if (!targ)
        {
            FBL.Firebug.Inspector.hideBoxModel();
            hoverElement = null;
            return;
        }
        
        if (typeof targ.attributes[FBL.cacheID] == 'undefined') return;
        
        var uid = targ.attributes[FBL.cacheID];
        if (!uid) return;
        
        var el = FBL.documentCache[uid.value];
        
        if (el.id == "FirebugChrome") return false;  
    
        var nodeName = el.nodeName.toLowerCase();
        
    
        if (FBL.isIE && " meta title script link ".indexOf(" "+nodeName+" ") != -1)
            return;
    
        if (!/\sobjectBox-element\s|\sobjectBox-selector\s/.test(" " + targ.className + " ")) return;
        
        if (" html head body br script link ".indexOf(" "+nodeName+" ") != -1) { 
            FBL.Firebug.Inspector.hideBoxModel();
            hoverElement = null;
            return;
        }
      
        if ((new Date().getTime() - hoverElementTS > 40) && hoverElement != el) {
            hoverElementTS = new Date().getTime();
            hoverElement = el;
            FBL.Firebug.Inspector.drawBoxModel(el);
        }
    }
    catch(E)
    {
    }
}


// ************************************************************************************************
// ************************************************************************************************
// ************************************************************************************************


// ************************************************************************************************
}});