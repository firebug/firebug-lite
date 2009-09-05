FBL.ns(function() { with (FBL) {
// ************************************************************************************************

// ************************************************************************************************
// Inspector Module

Firebug.Inspector =
{  
  
    create: function()
    {
        //offlineFragment = Firebug.browser.document.createDocumentFragment();
        createInspectorIFrame();
        // TODO: xxxpedro use createGlobalElement 
        if (!this.NS)
        {
            //createBoxModelInspector();
            //createOutlineInspector();
        }
    },
    
    destroy: function()
    {
        
    },
    
  
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // Inspect functions
    
    startInspecting: function()
    {
        Firebug.chrome.selectPanel("HTML");
        /*
        createInspectorFrame();
        
        var size = Firebug.browser.getWindowScrollSize();
        
        fbInspectFrame.style.width = size.width + "px";
        fbInspectFrame.style.height = size.height + "px";
        /**/

        //fbBtnInspect.href = "javascript:FB.stopInspecting(this)";
        //fbBtnInspect.className = "fbBtnInspectActive";
        //fbInspectIFrame.style.display = "block";
        
        if(!inspectIFrameVisible)
            showInspectIFrame();
            
        fbInspectFrame = fbInspectIFrame.contentWindow.document.documentElement;
        fbInspectIFrameDoc = fbInspectIFrame.contentWindow.document;
        fbInspectIFrameDoc.body.style.overflow = "hidden";
        
        addEvent(fbInspectFrame, "mousemove", Firebug.Inspector.onInspecting);
        addEvent(fbInspectFrame, "mousedown", Firebug.Inspector.onInspectingClick);
    },
    
    stopInspecting: function()
    {
        fbInspectFrame = fbInspectIFrame.contentWindow.document.documentElement;
        removeEvent(fbInspectFrame, "mousemove", Firebug.Inspector.onInspecting);
        removeEvent(fbInspectFrame, "mousedown", Firebug.Inspector.onInspectingClick);
        
        Firebug.chrome.inspectButton.restore();
        
        if (outlineVisible) this.hideOutline();
        
        if(inspectIFrameVisible)
            hideInspectIFrame();
    },
    
    
    onInspectingClick: function(e)
    {
        //fbInspectIFrame.style.display = "none";
        hideInspectIFrame();
        var targ = getElementFromPoint(e.clientX, e.clientY);
        showInspectIFrame();
        //fbInspectIFrame.style.display = "block";

        // Avoid inspecting the outline, and the FirebugChrome
        var id = targ.id;
        if (id && /^fbOutline\w$/.test(id)) return;
        if (id == "FirebugChrome") return;

        // Avoid looking at text nodes in Opera
        while (targ.nodeType != 1) targ = targ.parentNode;
        
        //Firebug.Console.log(targ);
        Firebug.Inspector.stopInspecting();
    },
    
    onInspecting: function(e)
    {
        if (new Date().getTime() - lastInspecting > 30)
        {
            //fbInspectIFrame.style.display = "none";
            hideInspectIFrame();
            var targ = getElementFromPoint(e.clientX, e.clientY);
            showInspectIFrame();
            //fbInspectIFrame.style.display = "block";
    
            // Avoid inspecting the outline, and the FirebugChrome
            var id = targ.id;
            if (id && /^fbOutline\w$/.test(id)) return;
            if (id == "FirebugChrome") return;
            
            // Avoid looking at text nodes in Opera
            while (targ.nodeType != 1) targ = targ.parentNode;
    
            if (targ.nodeName.toLowerCase() == "body") return;
    
            //Firebug.Console.log(e.clientX, e.clientY, targ);
            Firebug.Inspector.drawOutline(targ);
            
            if (targ[cacheID])
                FBL.Firebug.HTML.selectTreeNode(""+targ[cacheID])
            
            lastInspecting = new Date().getTime();
        }
    },
    
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // Inspector Outline
    
    drawOutline: function(el)
    {
        if (!outlineVisible) this.showOutline();
        
        var box = Firebug.browser.getElementBox(el);
        
        var top = box.top;
        var left = box.left;
        var height = box.height;
        var width = box.width;
        
        var border = 2;
        var o = outlineElements;
        
        o.fbOutlineT.style.top = top-border + "px";
        o.fbOutlineT.style.left = left + "px";
        o.fbOutlineT.style.width = width + "px";
  
        o.fbOutlineB.style.top = top+height + "px";
        o.fbOutlineB.style.left = left + "px";
        o.fbOutlineB.style.width = width + "px";
        
        o.fbOutlineL.style.top = top-border + "px";
        o.fbOutlineL.style.left = left-border + "px";
        o.fbOutlineL.style.height = height+2*border + "px";

        o.fbOutlineR.style.top = top-border + "px";
        o.fbOutlineR.style.left = left+width + "px";
        o.fbOutlineR.style.height = height+2*border + "px";
    },
    
    hideOutline: function()
    {
        if (!outlineVisible) return;
        
        for (var name in outline)
            offlineFragment.appendChild(outlineElements[name]);

        outlineVisible = false;
        
        if(inspectIFrameVisible)
            hideInspectIFrame();
    },
    
    showOutline: function()
    {
        if (outlineVisible) return;
        
        if(!inspectIFrameVisible)
            showInspectIFrame();
        
        for (var name in outline)
            //Firebug.browser.document.body.appendChild(outlineElements[name]);
            fbInspectIFrameDoc.body.appendChild(outlineElements[name]);
        
        outlineVisible = true;
    },
  
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // Box Model
    
    drawBoxModel: function(el)
    {
        if (!boxModelVisible) this.showBoxModel();
        
        var box = Firebug.browser.getElementBox(el);
        
        var top = box.top;
        var left = box.left;
        var height = box.height;
        var width = box.width;
        
        var margin = Firebug.browser.getMeasurementBox(el, "margin");
        var padding = Firebug.browser.getMeasurementBox(el, "padding");

        boxModelStyle.top = top - margin.top + "px";
        boxModelStyle.left = left - margin.left + "px";
        boxModelStyle.height = height + margin.top + margin.bottom + "px";
        boxModelStyle.width = width + margin.left + margin.right + "px";
      
        boxPaddingStyle.top = margin.top + "px";
        boxPaddingStyle.left = margin.left + "px";
        boxPaddingStyle.height = height + "px";
        boxPaddingStyle.width = width + "px";
      
        boxContentStyle.top = margin.top + padding.top + "px";
        boxContentStyle.left = margin.left + padding.left + "px";
        boxContentStyle.height = height - padding.top - padding.bottom + "px";
        boxContentStyle.width = width - padding.left - padding.right + "px";
    },
  
    hideBoxModel: function()
    {
        if (boxModelVisible)
        {
            offlineFragment.appendChild(boxModel);
            boxModelVisible = false;
            
            if(inspectIFrameVisible)
                hideInspectIFrame();
        }
    },
    
    showBoxModel: function()
    {
        if (!boxModelVisible)
        {
            if(!inspectIFrameVisible)
                showInspectIFrame();
            
            fbInspectIFrameDoc.body.appendChild(boxModel);
            boxModelVisible = true;
        }
    }

};

// ************************************************************************************************
// Inspector Internals


// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
// Shared variables



// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
// Internal variables

var offlineFragment = null;

var boxModelVisible = false;

var pixelsPerInch, boxModel, boxModelStyle, boxMargin, boxMarginStyle, 
boxPadding, boxPaddingStyle, boxContent, boxContentStyle;

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

var resetStyle = "margin:0; padding:0; border:0; position:absolute; overflow:hidden; display:block;";
var offscreenStyle = resetStyle + "top:-1234px; left:-1234px;";

var inspectStyle = resetStyle + "z-index: 2147483500;";
var inspectFrameStyle = resetStyle + "z-index: 2147483550; top:0; left:0; background:url(" +
                        Application.location.skinDir + "pixel_transparent.gif);";

//if (Application.isTraceMode) inspectFrameStyle = resetStyle + "z-index: 2147483550; top: 0; left: 0; background: #ff0; opacity: 0.05; _filter: alpha(opacity=5);";

var inspectModelStyle = inspectStyle + "opacity:0.8; _filter:alpha(opacity=80);";
var inspectMarginStyle = inspectStyle + "background: #EDFF64; height:100%; width:100%;";
var inspectPaddingStyle = inspectStyle + "background: SlateBlue;";
var inspectContentStyle = inspectStyle + "background: SkyBlue;";


var outlineStyle = { 
    fbHorizontalLine: "background: #3875D7; height: 2px;",
    fbVerticalLine: "background: #3875D7; width: 2px;"
}

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

var lastInspecting = 0;
var fbInspectFrame = null;


// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

var outlineVisible = false;
var outlineElements = {};
var outline = {
  "fbOutlineT": "fbHorizontalLine",
  "fbOutlineL": "fbVerticalLine",
  "fbOutlineB": "fbHorizontalLine",
  "fbOutlineR": "fbVerticalLine"
};


var inspectIFrameVisible = false;

var showInspectIFrame = function()
{
    if (!inspectIFrameVisible || force)
    {
        fbInspectIFrame.style.display = "block";
        
        var size = Firebug.browser.getWindowScrollSize();
        
        fbInspectIFrame.style.width = size.width + "px";
        fbInspectIFrame.style.height = size.height + "px";
    
        inspectIFrameVisible = true;
    }    
};
var hideInspectIFrame = function(force)
{
    if (inspectIFrameVisible || force)
    {
        fbInspectIFrame.style.display = "none";
        inspectIFrameVisible = false;
    }    
};

var getElementFromPoint = function getElementFromPoint(x, y)
{
    var scroll = Firebug.browser.getWindowScrollPosition();
    
    if (!isSafari)
        return Firebug.browser.document.elementFromPoint(x - scroll.left, y - scroll.top);
    else
        return Firebug.browser.document.elementFromPoint(x, y);    
};

// ************************************************************************************************
// Section
var fbInspectIFrame = null;
var fbInspectIFrameDoc = null;

var createInspectorIFrame = function createInspectorIFrame()
{
    fbInspectIFrame = createGlobalElement("iframe");
    fbInspectIFrame.id = "FirebugInspectIFrame";
    //fbInspectIFrame.style.cssText = inspectFrameStyle;
    fbInspectIFrame.setAttribute("frameBorder", "0");
    fbInspectIFrame.style.border = "0";
    fbInspectIFrame.setAttribute("allowTransparency", "true");
    fbInspectIFrame.style.position = "absolute";
    fbInspectIFrame.style.top = "0";
    fbInspectIFrame.style.left = "0";
    fbInspectIFrame.style.zIndex = "2147483550";
    fbInspectIFrame.style.backgroundColor = "transparent";
    fbInspectIFrame.style.display = "none";
    fbInspectIFrame.setAttribute("src", "about:blank");
    
    var size = Firebug.browser.getWindowScrollSize();
    
    fbInspectIFrame.style.width = size.width + "px";
    fbInspectIFrame.style.height = size.height + "px";
    
    Firebug.browser.document.getElementsByTagName("body")[0].appendChild(fbInspectIFrame);
    
    var doc = fbInspectIFrame.contentWindow.document;
    
    var wait = function()
    {
        if (doc && doc.body)
        {
            doc.body.style.backgroundColor = "transparent";
            doc.body.style.backgroundImage = "url("+Application.location.skinDir+"pixel_transparent.gif)";
            doc.body.style.overflow = "hidden";
            doc.body.style.width = "100%";
            doc.body.style.height = "100%";
            doc.body.style.margin = "0";
            
            offlineFragment = doc.createDocumentFragment();
            
            fbInspectIFrameDoc = doc;
            
            fbInspectFrame = doc.documentElement;
            
            createBoxModelInspector2();
            createOutlineInspector2();
        }
        else
            setTimeout(wait, 50);
    }
    wait();
}

        

var createOutlineInspector2 = function createOutlineInspector()
{
    for (var name in outline)
    {
        var el = outlineElements[name] = fbInspectIFrameDoc.createElement("div");
        el.id = name;
        el.style.cssText = inspectStyle + outlineStyle[outline[name]];
        offlineFragment.appendChild(el);
    }
};

var createBoxModelInspector2 = function createBoxModelInspector()
{
    boxModel = fbInspectIFrameDoc.createElement("div");
    boxModel.id = "fbBoxModel";
    boxModelStyle = boxModel.style;
    boxModelStyle.cssText = inspectModelStyle;
    
    boxMargin = fbInspectIFrameDoc.createElement("div");
    boxMargin.id = "fbBoxMargin";
    boxMarginStyle = boxMargin.style;
    boxMarginStyle.cssText = inspectMarginStyle;
    boxModel.appendChild(boxMargin);
    
    boxPadding = fbInspectIFrameDoc.createElement("div");
    boxPadding.id = "fbBoxPadding";
    boxPaddingStyle = boxPadding.style;
    boxPaddingStyle.cssText = inspectPaddingStyle;
    boxModel.appendChild(boxPadding);
    
    boxContent = fbInspectIFrameDoc.createElement("div");
    boxContent.id = "fbBoxContent";
    boxContentStyle = boxContent.style;
    boxContentStyle.cssText = inspectContentStyle;
    boxModel.appendChild(boxContent);
    
    offlineFragment.appendChild(boxModel);
};

var createInspectorFrame = function createInspectorFrame()
{
    fbInspectFrame = Firebug.browser.document.createElement("div");
    fbInspectFrame.id = "fbInspectFrame";
    fbInspectFrame.style.cssText = inspectFrameStyle;
    Firebug.browser.document.body.appendChild(fbInspectFrame);
}

var destroyInspectorFrame = function destroyInspectorFrame()
{
    Firebug.browser.document.body.removeChild(fbInspectFrame);
}

var createOutlineInspector = function createOutlineInspector()
{
    for (var name in outline)
    {
        var el = outlineElements[name] = Firebug.browser.document.createElement("div");
        el.id = name;
        el.style.cssText = inspectStyle + outlineStyle[outline[name]];
        offlineFragment.appendChild(el);
    }
};

var createBoxModelInspector = function createBoxModelInspector()
{
    boxModel = Firebug.browser.document.createElement("div");
    boxModel.id = "fbBoxModel";
    boxModelStyle = boxModel.style;
    boxModelStyle.cssText = inspectModelStyle;
    
    boxMargin = Firebug.browser.document.createElement("div");
    boxMargin.id = "fbBoxMargin";
    boxMarginStyle = boxMargin.style;
    boxMarginStyle.cssText = inspectMarginStyle;
    boxModel.appendChild(boxMargin);
    
    boxPadding = Firebug.browser.document.createElement("div");
    boxPadding.id = "fbBoxPadding";
    boxPaddingStyle = boxPadding.style;
    boxPaddingStyle.cssText = inspectPaddingStyle;
    boxModel.appendChild(boxPadding);
    
    boxContent = Firebug.browser.document.createElement("div");
    boxContent.id = "fbBoxContent";
    boxContentStyle = boxContent.style;
    boxContentStyle.cssText = inspectContentStyle;
    boxModel.appendChild(boxContent);
    
    offlineFragment.appendChild(boxModel);
};



// ************************************************************************************************
// Section




// ************************************************************************************************
}});