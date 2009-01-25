FBL.ns(function() { with (FBL) {
// ************************************************************************************************

/*


TODO: Better handling of switching tab contexts (selectedTab, rightPanelVisible)

TODO: CommandLineAPI --> $, $$, dir, dirxml...

TODO: apply the onGlobalKeyDown handler to the Chrome Frame

TODO: problem when resizing with the vSplitter, when it reaches the side of
      the screen. Problem with negative pixel numbers.

TODO: vSplitter is bigger than the frame in firefox. Problem with mouse scroll.

TODO: problem with the new Firebug for FF3, it seems that it doesn't allow 
      extending the console namespace anymore.
      
TODO: handle disble mouse wheel in IE

TODO: handle disble text selection in IE

TODO: opera problem with the TAB key in commandLine


FIXED: isScrolledToBottom is not working in Firefox, it seems that this is 
      happening because the scrollable panel is some pixels higher than
      it should be.

FIXED: better handling of scope of commandLine.eval(), if you type "this" it will
      refer to the CommandLine module, and it should refer to "window" instead


<script language="JavaScript1.2">

function disabletext(e){
return false
}

function reEnable(){
return true
}

//if the browser is IE4+
document.onselectstart=new Function ("return false")

//if the browser is NS6
if (window.sidebar){
document.onmousedown=disabletext
document.onclick=reEnable
}
</script>




*/

/*



function getXPath(node, path) {
  path = path || [];
  if(node.parentNode) {
    path = getXPath(node.parentNode, path);
  }

  if(node.previousSibling) {
    var count = 1;
    var sibling = node.previousSibling
    do {
      if(sibling.nodeType == 1 && sibling.nodeName == node.nodeName) {count++;}
      sibling = sibling.previousSibling;
    } while(sibling);
    if(count == 1) {count = null;}
  } else if(node.nextSibling) {
    var sibling = node.nextSibling;
    do {
      if(sibling.nodeType == 1 && sibling.nodeName == node.nodeName) {
        var count = 1;
        sibling = null;
      } else {
        var count = null;
        sibling = sibling.previousSibling;
      }
    } while(sibling);
  }

  if(node.nodeType == 1) {
    path.push(node.nodeName.toLowerCase() + (node.id ? "[@id='"+node.id+"']" : count > 0 ? "["+count+"]" : ''));
  }
  return path;
};


// Getting result
document.evaluate("/html/body/div/ul/li[2]", document, null, XPathResult.ANY_TYPE, null ).iterateNext()




*/


// ************************************************************************************************
// Chrome API

extend(ChromeAPI,
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
    
    toggleCommandLine: function()
    {
        bottomVisible = !bottomVisible;
        bottom.className = bottomVisible ? "" : "hide";
        
        if (isFirefox)
            setTimeout(Chrome.draw, 0);
            
        frame.focus();
    },
    
    
    toggleRightPanel: function()
    {
        rightPanelVisible = !rightPanelVisible;
        
        bodyR.className = rightPanelVisible ? "" : "hide"; 
        toolbarRFrame.className = rightPanelVisible ? "" : "hide";
         
        if (isIE) 
        {
            if (rightPanelVisible)
                vSplitterStyle.right = 300 + "px";
                
            Chrome.draw();
        }
        
    },
    
    
    showTab: function(tabName)
    {
        if (tabName == 0 && tabName != selectedTab)
        {
            ChromeAPI.toggleRightPanel();
            ChromeAPI.toggleCommandLine();

            selectedTab = 0;
            tabL = consoleL;
            tabLStyle = tabL.style;
            
            consoleL.style.display = "block";
            HTMLL.style.display = "none";
            
            Chrome.doc.getElementById("tc").className = "tab selectedTab";
            Chrome.doc.getElementById("th").className = "tab";

            Chrome.draw();
        }
        else if (tabName == 1 && tabName != selectedTab)
        {
            selectedTab = 1;
            tabL = HTMLL;
            tabLStyle = tabL.style;
            
            HTMLL.style.display = "block";
            consoleL.style.display = "none";

            Chrome.doc.getElementById("tc").className = "tab";
            Chrome.doc.getElementById("th").className = "tab selectedTab";

            ChromeAPI.toggleRightPanel();
            ChromeAPI.toggleCommandLine();

            Chrome.draw();
        }
    },
    
    clear: function()
    {
        ConsoleAPI.clear();
    }
    
});


// ************************************************************************************************
// Chrome Module

var Chrome = Firebug.Chrome = 
{
    chromeHeight: 250,
    interfaceFile: "firebug.html",
    injectedMode: true,
    
    context: null,
    
    onReady: function() {
        addEvent(
            document, 
            isIE || isSafari ? "keydown" : "keypress", 
            onGlobalKeyDown
        );
    },
    
    onChromeReady: function()
    {
        chromeReady = true;
        
  	    var frame = FBL.frame;
  	        
  	    if (Chrome.context == Chrome.Frame)
  	    {
  	        Chrome.doc = frame.contentWindow.document;
  	        Chrome.win = frame.contentWindow.window;
  	    }
  	    else
  	    {
  	        Chrome.doc = frame.document;
  	        Chrome.win = frame.window;
  	    }
  	    
  	    Chrome.win.FB = FBL.ChromeAPI;
        
  	    Chrome.context.onReady(Chrome.doc);
  	    Chrome.initializeContext(Chrome.doc, Chrome.context);
  	    
  	    Chrome.draw();    
	  },
    
    
    destroy: function()
    {
        if (Chrome.context == Chrome.Popup)
        {
            Chrome.finalizeContext(Chrome.Popup);

            var last = Chrome.Frame;
            if(last.element)
            {
                Chrome.initializeContext(last.document, last);
                last.isVisible = false;
                frame.style.visibility = "hidden";
            }
	            
        }
        else if (Chrome.context == Chrome.Frame)
        {
            chromeReady = false;
            Chrome.finalizeContext(Chrome.Frame);
        }
    },
    
    initializeContext: function(doc, context)
    {
        if (Firebug.CommandLine)
            Firebug.CommandLine.initialize(doc);
            
        this.context = context;
        this.context.document = doc;
        this.doc = doc;
        
        body = doc.getElementById("body");
        cmdLine = doc.getElementById("commandLine");
        header = doc.getElementById("header");
        bottom = doc.getElementById("bottom");
        bodyL = doc.getElementById("bodyL");
        bodyR = doc.getElementById("bodyR");
        hSplitter = doc.getElementById("hSplitter");
        vSplitter = doc.getElementById("vSplitter");
        toolbarRFrame = doc.getElementById("toolbarRFrame");
        toolbarRFrameStyle = toolbarRFrame.style;
        
        vSplitterStyle = vSplitter.style;
        
        bodyStyle  = body.style;
        bodyLStyle = bodyL.style;
        bodyRStyle = bodyR.style;
        
        panelL = doc.getElementById("panelL");
        panelLStyle = panelL.style;

        tabL = consoleL = doc.getElementById("consoleL");
        tabLStyle = consoleLStyle = consoleL.style;
        
        tabR = consoleR = doc.getElementById("consoleR");
        
        HTMLL = doc.getElementById("HTMLL");
    
        consoleBody = consoleL;
        consoleBody = consoleL;
        consoleBodyFrame = panelL;
        
        topHeight = header.offsetHeight;
    
        vSplitter.onmousedown = onVSplitterMouseDown;
        hSplitter.onmousedown = onHSplitterMouseDown;
        
        // TODO: refactor
        selectedTab = 0; //Console
        rightPanelVisible = false;
        // TODO: refactor
    
        if (context == this.Popup)
        {
            frame = doc.body;
            
            if (isIE)
            {
                this.adjustPanelWitdh();
              
                var table = doc.getElementById("table");
                table.style.position = "absolute";
                table.style.marginTop = "-1px";
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
              this.adjustPanelWitdh();
              
              var margin = document.body.currentStyle.marginRight;
              
              if (margin == "10px")
                  frameStyle.width = "102%";
              //else
              //  alert(margin + "TODO: need to add a onresize event to adjust the window width");

            }
        }
        
        var controllers = context.controllers;
        if(controllers)
            for(var i=0, ci; ci=controllers[i]; i++)
                addEvent.apply(this, ci);
                

        if (isOpera) this.draw();

            
        // TODO: integrate code
        
        //OUT      = doc.getElementById("consoleL");
        //OUT.style.padding = "4px 4px 4px 7px";
        if(!!chromeLoad) chromeLoad(doc);
        /**/
        
    },

    finalizeContext: function(context)
    {
        chromeReady = false;
        this.context.element = null;
        this.frame = null;
        
        body      = null;
        cmdLine   = null;
        header    = null;
        vSplitter = null;
        hSplitter = null;
        bottom    = null;
        bodyR     = null;
        
        bodyRStyle = null;
        bodyStyle = null;
    
        topHeight = null;
        
        var controllers = context.controllers;
        if(controllers)
            for(var i=0, ci; ci=controllers[i]; i++)
              removeEvent.apply(this, ci);
    },
    
    //
    toggle: function(forceOpen, popup)
    {
        if(popup)
        {
            var context = Chrome.context = this.Popup; 
            if(frame)
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
            var context = Chrome.context = this.Frame; 
            context.isVisible = forceOpen || !context.isVisible;
            
            if(frame)
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
        //var height = frame.ownerDocument.defaultView.innerHeight;
        
        var cmdHeight = cmdLine.offsetHeight;
        var fixedHeight = topHeight + cmdHeight;
        var y = Math.max(height, topHeight);
        



        //console.log("draw() -- height: %d", height, frame);
        
        if (isFirefox)
            setTimeout(function(){
                y = Chrome.win.innerHeight;
                frame.style.height = y + "px";
                body.style.maxHeight = Math.max(y -1 - fixedHeight, 0)+ "px";



        /*
        var width = frame.offsetLeft + frame.clientWidth;
        var x = width - vSplitter.offsetLeft;
        
        bodyRStyle.width = x + "px";
        vSplitterStyle.right = x - 6 + "px";
        toolbarRFrameStyle.width = x + "px";
        bodyLStyle.width = width - x + "px";                
        panelLStyle.width = width - x + "px";
        consoleLStyle.width = width -20 - x + "px";        
        /**/
        
                //vSplitterStyle.height = y - 23-cmdHeight + "px"; 
            }, 0);
        else
            setTimeout(function(){ 
                vSplitterStyle.height = y - 25 - cmdHeight + "px"; 
                frame.style.height = y + "px";
                body.style.height = Math.max(y - fixedHeight, 0)+ "px";

        var width = frame.offsetLeft + frame.clientWidth;
        var x = rightPanelVisible ? (width - vSplitter.offsetLeft) : 0;
        
        bodyRStyle.width = x + "px";
        //vSplitterStyle.right = x - 6 + "px";
        toolbarRFrameStyle.width = x + "px";
        bodyLStyle.width = width - x + "px";                
        panelLStyle.width = width - x + "px";
        tabLStyle.width = width -20 - x + "px";        
                
            }, 40);
    
        
        //if(isIE) 
        //  Chrome.adjustPanelWitdh();
        
    },
    
    adjustPanelWitdh: function()
    {
        var width = frame.offsetLeft + frame.clientWidth;
        var x = bodyR.offsetWidth - (rightPanelVisible ? 20 : 0);
        
        bodyLStyle.width = width - x + "px";
        panelLStyle.width = width - x + "px";
    },
    
    saveSettings: function()
    {
    },
    
    restoreSettings: function()
    {
    }
    

};


// ************************************************************************************************
// Chrome Internals


// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
var chromeReady = false;
var selectedTab = 0; //Console

FBL.frame = null;
FBL.frameStyle = null;

FBL.bottomVisible = true;
FBL.rightPanelVisible = false;

FBL.body = null;
FBL.cmdLine = null;
FBL.header = null;
FBL.vSplitter = null;
FBL.hSplitter = null;
FBL.bottom = null;
FBL.bodyL = null;
FBL.bodyR = null;
FBL.toolbarRFrame = null;
FBL.toolbarRFrameStyle = null;

FBL.vSplitterStyle = null;

FBL.bodyStyle = null;
FBL.bodyLStyle = null;
FBL.bodyRStyle = null;

FBL.consoleL = null;
FBL.consoleR = null;

FBL.HTMLL = null;

FBL.tabL = null;
FBL.tabR = null;

FBL.consoleLStyle = null;
FBL.tabLStyle = null;

FBL.panelL = null;
FBL.panelLStyle = null;

FBL.consoleBody = null;
FBL.consoleBody = null;
FBL.consoleBodyFrame = null;

FBL.topHeight = null;

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *


// ************************************************************************************************
// Section
function waitForDocument()
{
    var console = window[FBL.consoleNS];
    if (document.body && console && typeof window.FBL.loaded != "undefined")
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
        f.contentWindow.document.getElementById("commandLine") || // frame loaded
        
        f && (Chrome.context == Chrome.Popup) &&  f.document && 
        f.document.getElementById("commandLine")) // popup loaded
    {
        if (!chromeReady)
            Chrome.onChromeReady();
    }
    else
        setTimeout(waitForChrome, 100);
};
    
/*
function onChromeLoad()
{
    var frame = FBL.frame;
        
    if (Chrome.context == Chrome.Frame)
    {
        Chrome.doc = frame.contentWindow.document;
        Chrome.win = frame.contentWindow.window;
    }
    else
    {
        Chrome.doc = frame.document;
        Chrome.win = frame.window;
    }
    
    Chrome.win.FB = FBL.ChromeAPI;

    Chrome.context.onReady(Chrome.doc);
    Chrome.initializeContext(Chrome.doc, Chrome.context);
    
    Chrome.draw();    
};
/**/


function focusCommandLine()
{
    //toggleConsole(true);
    //if (commandLine)
    //    commandLine.focus();
};





// ************************************************************************************************
// Section

function onGlobalKeyDown(event)
{
    if (event.keyCode == 123 /* F12 */)
        if (!FBL.isFirefox && !event.shiftKey || event.shiftKey && FBL.isFirefox)
        {
            FBL.Firebug.Chrome.toggle(false, event.ctrlKey);
            FBL.cancelEvent(event, true);
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
        FBL.addEvent(frames[i].document, "mousemove", onHSplitterMouseMove);
        FBL.addEvent(frames[i].document, "mouseup", onHSplitterMouseUp);
    }
    
    return false;
};


function onHSplitterMouseMove(event)
{
    var frame = FBL.frame;
    var frameStyle = FBL.frameStyle;
    var topHeight = FBL.topHeight;
    var cmdLine = FBL.cmdLine;
    var vSplitterStyle = FBL.vSplitterStyle;
    
    var clientY = event.clientY;
    var win = document.all
        ? event.srcElement.ownerDocument.parentWindow
        : event.target.ownerDocument && event.target.ownerDocument.defaultView;
  
    if (!win)
        return;
    
    if (win != win.parent)
        clientY += win.frameElement ? win.frameElement.offsetTop : 0;
    
    var height = frame.offsetTop + frame.clientHeight;
    var fixedHeight = topHeight + cmdLine.offsetHeight + 1;
    var y = Math.max(height - clientY + 7, topHeight);
        y = Math.min(y, document.body.scrollHeight);
      

    if(FBL.isIE)
        setTimeout(function(){ 
            //vSplitterStyle.height = y - 147 + "px";
            frameStyle.height = y + "px";
        }, 25);
      
    else if (FBL.isOpera)
        setTimeout(function(){ 
            frameStyle.height = y + "px";
            bodyStyle.height = Math.max(y - fixedHeight, 0)+ "px";
        }, 75);
      
    else if (FBL.isFirefox)
    {
        frameStyle.height = y + "px";
        setTimeout(function(){ 
            bodyStyle.maxHeight = Math.max(y - fixedHeight, 0)+ "px";
        }, 50);
    }  
    else
    {
        frameStyle.height = y + "px";
    }
    
    return false;
};

function onHSplitterMouseUp(event)
{
    FBL.removeEvent(document, "mousemove", onHSplitterMouseMove);
    FBL.removeEvent(document, "mouseup", onHSplitterMouseUp);
  
    for (var i = 0; i < frames.length; ++i)
    {
        FBL.removeEvent(frames[i].document, "mousemove", onHSplitterMouseMove);
        FBL.removeEvent(frames[i].document, "mouseup", onHSplitterMouseUp);
    }
    
    setTimeout(Chrome.draw, 0);
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

function onVSplitterMouseMove(event)
{
    var frame = FBL.frame;
    var bodyRStyle = FBL.bodyRStyle;
    var bodyLStyle = FBL.bodyLStyle;
    var panelLStyle = FBL.panelLStyle;
    var tabLStyle = FBL.tabLStyle;
    var toolbarRFrameStyle = FBL.toolbarRFrameStyle;
    var vSplitterStyle = FBL.vSplitterStyle;
    
    if (new Date().getTime() - lastVSplitterMouseMove > 40)
    {
        lastVSplitterMouseMove = new Date().getTime();
    
        var clientX = event.clientX;
        var win = document.all
            ? event.srcElement.ownerDocument.parentWindow
            : event.target.ownerDocument.defaultView;
      
        if (win != win.parent)
            clientX += win.frameElement ? win.frameElement.offsetLeft : 0;
        
        var width = frame.offsetLeft + frame.clientWidth;
        var x = Math.max(width - clientX + 3, 7);
        
        if (FBL.isIE)
            setTimeout(function(){
                bodyRStyle.width = x + "px";
                vSplitterStyle.right = x - 6 + "px";
                toolbarRFrameStyle.width = x + "px";
                bodyLStyle.width = width - x + "px";                
                panelLStyle.width = width - x + "px";
                tabLStyle.width = width -20 - x + "px";
            },25);

        // TODO: Chrome bug - confirm if this happens on safari
        else
        {
            if (FBL.isSafari)
                setTimeout(function(){
                    bodyRStyle.width = x + "px";
                    toolbarRFrameStyle.width = x -1 + "px";
                    vSplitterStyle.right = x - 6 + "px";
                    bodyLStyle.width = width - x + "px";
                    panelLStyle.width = width - 2 - x + "px";
                },0);
            else
            {
                bodyRStyle.width = x + "px";
                toolbarRFrameStyle.width = x -1 + "px";
                vSplitterStyle.right = x -6 + "px";
            }
        }
    }
    
    FBL.cancelEvent(event, true);
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
function chromeLoad(doc)
{
  
    var rootNode = document.documentElement;
    
    /* Console event handlers */
    FBL.addEvent(FBL.consoleL, 'mousemove', onListMouseMove);
    FBL.addEvent(FBL.consoleL, 'mouseout', onListMouseOut);

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
    FBL.Firebug.HTML.appendTreeNode(rootNode, html);
    FBL.HTMLL.innerHTML = '';
    FBL.HTMLL.innerHTML = html.join('');
    FBL.HTMLL.style.padding = "0 10px 0 15px";
    FBL.HTMLL.style.display = "none";

    var doc = FBL.Firebug.Chrome.doc;
    var input = doc.createElement("input");
    input.id = "treeInput"
    input.style.cssText = "position: absolute; font: 11px Monaco, monospace; margin: 0; padding: 0; border: 1px solid #777;"
    input.style.display = "none";
    doc.body.appendChild(input);

    /* HTML event handlers */
    input.onblur = FBL.HTMLL.onscroll = function()
    {
        input.style.display = "none";
    };
    FBL.addEvent(FBL.HTMLL, 'click', onTreeClick);
    FBL.addEvent(FBL.HTMLL, 'mousemove', onListMouseMove);
    FBL.addEvent(FBL.HTMLL, 'mouseout', onListMouseOut);
    
}

function onListMouseOut(e)
{
    e = e || event || window;
    var targ;
    
    if (e.target) targ = e.target;
    else if (e.srcElement) targ = e.srcElement;
    if (targ.nodeType == 3) // defeat Safari bug
      targ = targ.parentNode;
        
      if (targ.id == "consoleL") {
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
            if (" objectBox-element objectBox-selector ".indexOf(" " + targ.className + " ") == -1)
            //if (!/\sobjectBox-element\s|\sobjectBox-selector\s/.test(" " + targ.className + " "))
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
    
        //if (!/\sobjectBox-element\s|\sobjectBox-selector\s/.test(" " + targ.className + " ")) return;
        if (" objectBox-element objectBox-selector ".indexOf(" " + targ.className + " ") == -1) return;
        
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

var selectedElement = null
function selectElement(e)
{
    if (e != selectedElement)
    {
        if (selectedElement)
            selectedElement.className = "objectBox-element";
            
        
        e.className = e.className + " selectedElement";

        if (FBL.isFirefox)
            e.style.MozBorderRadius = "3px";
        
        selectedElement = e;
    }
}

function onTreeClick(e)
{
    e = e || event;
    var targ;
    
    if (e.target) targ = e.target;
    else if (e.srcElement) targ = e.srcElement;
    if (targ.nodeType == 3) // defeat Safari bug
        targ = targ.parentNode;
        
    
    if (targ.className.indexOf('nodeControl') != -1 || targ.className == 'nodeTag')
    {
        if(targ.className == 'nodeTag')
        {
            var control = FBL.isIE ? (targ.parentNode.previousSibling || targ) :
                          (targ.previousSibling.previousSibling || targ);
            
            if (control.className.indexOf('nodeControl') == -1)
                return;
            
            selectElement(targ.parentNode);
        } else
            control = targ;
        
        FBL.cancelEvent(e);
        
        var treeNode = FBL.isIE ? control.nextSibling : control.parentNode;
        
        if (control.className.indexOf(' nodeMaximized') != -1) {
            control.className = 'nodeControl';
            FBL.Firebug.HTML.removeTreeChildren(treeNode);
        } else {
            control.className = 'nodeControl nodeMaximized';
            FBL.Firebug.HTML.appendTreeChildren(treeNode);
        }
    }
    else if (targ.className == 'nodeValue' || targ.className == 'nodeName')
    {
        var input = FBL.Firebug.Chrome.doc.getElementById('treeInput');
        
        input.style.display = "block";
        input.style.left = targ.offsetLeft + 'px';
        input.style.top = FBL.topHeight + targ.offsetTop - FBL.panelL.scrollTop + 'px';
        input.style.width = targ.offsetWidth + 6 + 'px';
        input.value = targ.textContent || targ.innerText;
        input.focus(); 
    }
}
// ************************************************************************************************
// ************************************************************************************************
// ************************************************************************************************


// ************************************************************************************************
}});