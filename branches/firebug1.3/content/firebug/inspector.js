FBL.ns(function() { with (FBL) {
// ************************************************************************************************

// ************************************************************************************************
// Inspector Module

Firebug.Inspector =
{  
  
    initialize: function()
    {
        offlineFragment = document.createDocumentFragment();
        
        calculatePixelsPerInch();
        createBoxModelInspector();
        createOutlineInspector();
    },
    
    onChromeReady: function()
    {
        fbBtnInspect = $U("fbBtnInspect");
    },    
  
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // Inspect functions
    
    startInspecting: function()
    {
        createInspectorFrame();
        
        var size = this.getWindowScrollSize();
        
        fbInspectFrame.style.width = size.width + "px";
        fbInspectFrame.style.height = size.height + "px";

        fbBtnInspect.href = "javascript:FB.stopInspecting(this)";
        fbBtnInspect.className = "fbBtnInspectActive";
        
        addEvent(fbInspectFrame, "mousemove", Firebug.Inspector.onInspecting)
        addEvent(fbInspectFrame, "mousedown", Firebug.Inspector.onInspectingClick)
    },
    
    stopInspecting: function()
    {
        destroyInspectorFrame();
        
        fbBtnInspect.href = "javascript:FB.startInspecting(this)";
        fbBtnInspect.className = "";
        
        if (outlineVisible) this.hideOutline();
        removeEvent(fbInspectFrame, "mousemove", Firebug.Inspector.onInspecting)
        removeEvent(fbInspectFrame, "mousedown", Firebug.Inspector.onInspectingClick)
    },
    
    
    onInspectingClick: function(e)
    {
        fbInspectFrame.style.display = "none";    
        var targ = Firebug.Inspector.getElementFromPoint(e.clientX, e.clientY);
        fbInspectFrame.style.display = "block";    

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
            fbInspectFrame.style.display = "none";
            var targ = Firebug.Inspector.getElementFromPoint(e.clientX, e.clientY);
            fbInspectFrame.style.display = "block";    
    
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
        
        var box = this.getElementBox(el);
        
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
    },
    
    showOutline: function()
    {
        if (outlineVisible) return;
        
        for (var name in outline)
            document.body.appendChild(outlineElements[name]);
        
        outlineVisible = true;
    },
  
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // Box Model
    
    drawBoxModel: function(el)
    {
        if (!boxModelVisible) this.showBoxModel();
        
        var box = this.getElementBox(el);
        
        var top = box.top;
        var left = box.left;
        var height = box.height;
        var width = box.width;
        
        var margin = this.getMeasurementBox(el, "margin");
        var padding = this.getMeasurementBox(el, "padding");

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
        offlineFragment.appendChild(boxModel);
        boxModelVisible = false;
    },
    
    showBoxModel: function()
    {
        document.body.appendChild(boxModel);
        boxModelVisible = true;
    },
     
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // Measurement Funtions
    
    getMeasurement: function(el, name)
    {
        var result = {value: 0, unit: "px"};
        
        var cssValue = this.getCSS(el, name);
        if (!cssValue) return result;
        if (cssValue.toLowerCase() == "auto") return result;
        
        var reMeasure = /(\d+\.?\d*)(.*)/;
        var m = cssValue.match(reMeasure);
        
        if (m)
        {
            result.value = m[1]-0;
            result.unit = m[2].toLowerCase();
        }
        
        return result;        
    },
    
    getMeasurementInPixels: function(el, name)
    {
        if (!el) return null;
        
        var m = this.getMeasurement(el, name);
        var value = m.value;
        var unit = m.unit;
        
        if (unit == "px")
            return value;
          
        else if (unit == "pt")
            return this.pointsToPixels(name, value);
          
        if (unit == "em")
            return this.emToPixels(el, value);
          
        else if (unit == "%")
            return this.percentToPixels(el, value);
    },

    getElementPosition: function(el)
    {
        var left = 0
        var top = 0;
        
        if (el.offsetParent)
        {
            do
            {
                left += el.offsetLeft;
                top += el.offsetTop;
            }
            while (el = el.offsetParent);
        }
        return {left:left, top:top};      
    },
    
    getWindowSize: function()
    {
        var width=0, height=0, el;
        
        if (typeof window.innerWidth == 'number')
        {
            width = window.innerWidth;
            height = window.innerHeight;
        }
        else if ((el=document.documentElement) && (el.clientHeight || el.clientWidth))
        {
            width = el.clientWidth;
            height = el.clientHeight;
        }
        else if ((el=document.body) && (el.clientHeight || el.clientWidth))
        {
            width = el.clientWidth;
            height = el.clientHeight;
        }
        
        return {width: width, height: height};
    },
    
    getWindowScrollSize: function()
    {
        var width=0, height=0, el;

        if (!isIEQuiksMode && (el=document.documentElement) && 
           (el.scrollHeight || el.scrollWidth))
        {
            width = el.scrollWidth;
            height = el.scrollHeight;
        }
        else if ((el=document.body) && (el.scrollHeight || el.scrollWidth))
        {
            width = el.scrollWidth;
            height = el.scrollHeight;
        }
        
        return {width: width, height: height};
    },
    
    getWindowScrollPosition: function()
    {
        var top=0, left=0, el;
        
        if(typeof window.pageYOffset == 'number')
        {
            top = window.pageYOffset;
            left = window.pageXOffset;
        }
        else if((el=document.body) && (el.scrollTop || el.scrollLeft))
        {
            top = el.scrollTop;
            left = el.scrollLeft;
        }
        else if((el=document.documentElement) && (el.scrollTop || el.scrollLeft))
        {
            top = el.scrollTop;
            left = el.scrollLeft;
        }
        
        return {top:top, left:left};
    },
    
    getElementBox: function(el)
    {
        var result = {};
        
        if (el.getBoundingClientRect)
        {
            var rect = el.getBoundingClientRect();
            
            // fix IE problem with offset when not in fullscreen mode
            var offset = isIE ? document.body.clientTop || document.documentElement.clientTop: 0;
            
            var scroll = this.getWindowScrollPosition();
            
            result.top = Math.round(rect.top - offset + scroll.top);
            result.left = Math.round(rect.left - offset + scroll.left);
            result.height = Math.round(rect.bottom - rect.top);
            result.width = Math.round(rect.right - rect.left);
        }
        else 
        {
            var position = this.getElementPosition(el);
            
            result.top = position.top;
            result.left = position.left;
            result.height = el.offsetHeight;
            result.width = el.offsetWidth;
        }
        
        return result;
    },
    
    getElementFromPoint: function(x, y)
    {
        if (isOpera || isSafari)
        {
            var scroll = this.getWindowScrollPosition();
            return document.elementFromPoint(x + scroll.left, y + scroll.top);
        }
        else
            return document.elementFromPoint(x, y);
    },
    
    getMeasurementBox: function(el, name)
    {
        var sufixes = ["Top", "Left", "Bottom", "Right"];
        var result = [];
        
        for(var i=0, sufix; sufix=sufixes[i]; i++)
            result[i] = Math.round(this.getMeasurementInPixels(el, name + sufix));
        
        return {top:result[0], left:result[1], bottom:result[2], right:result[3]};
    }, 
    
    getFontSizeInPixels: function(el)
    {
        var size = this.getMeasurement(el, "fontSize");
        
        if (size.unit == "px") return size.value;
        
        // get font size, the dirty way
        var computeDirtyFontSize = function(el, calibration)
        {
            var div = document.createElement("div");
            var divStyle = offscreenStyle;

            if (calibration)
                divStyle +=  " font-size:"+calibration+"px;";
            
            div.style.cssText = divStyle;
            div.innerHTML = "A";
            el.appendChild(div);
            
            var value = div.offsetHeight;
            el.removeChild(div);
            return value;
        }
        
        // Calibration fails in some environments, so we're using a static value
        // based in the test case result.
        var rate = 200 / 225;
        //var calibrationBase = 200;
        //var calibrationValue = computeDirtyFontSize(el, calibrationBase);
        //var rate = calibrationBase / calibrationValue;
        
        var value = computeDirtyFontSize(el);

        return value * rate;
    },
    
    
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // Unit Funtions
  
    pointsToPixels: function(name, value)
    {
        var axis = /Top$|Bottom$/.test(name) ? "y" : "x";
        
        var result = value * pixelsPerInch[axis] / 72;
        
        return returnFloat ? result : Math.round(result);
    },
    
    emToPixels: function(el, value)
    {
        if (!el) return null;
        
        var fontSize = this.getFontSizeInPixels(el);
        
        return Math.round(value * fontSize);
    },
    
    exToPixels: function(el, value)
    {
        if (!el) return null;
        
        // get ex value, the dirty way
        var div = document.createElement("div");
        div.style.cssText = offscreenStyle + "width:"+value + "ex;";
        
        el.appendChild(div);
        var value = div.offsetWidth;
        el.removeChild(div);
        
        return value;
    },
      
    percentToPixels: function(el, value)
    {
        if (!el) return null;
        
        // get % value, the dirty way
        var div = document.createElement("div");
        div.style.cssText = offscreenStyle + "width:"+value + "%;";
        
        el.appendChild(div);
        var value = div.offsetWidth;
        el.removeChild(div);
        
        return value;
    },
    
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    
    getCSS: isIE ? function(el, name)
    {
        return el.currentStyle[name] || el.style[name] || undefined;
    }
    : function(el, name)
    {
        return document.defaultView.getComputedStyle(el,null)[name] 
            || el.style[name] || undefined;
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
var inspectFrameStyle = resetStyle + "z-index: 2147483550; top:0; left:0; background:url(http://pedrosimonetti.googlepages.com/pixel_transparent.gif);";
//var inspectFrameStyle = resetStyle + "z-index: 2147483550; top: 0; left: 0; background: #ff0; opacity: 0.1; _filter: alpha(opacity=10);";

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
var fbBtnInspect = null;


// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

var outlineVisible = false;
var outlineElements = {};
var outline = {
  "fbOutlineT": "fbHorizontalLine",
  "fbOutlineL": "fbVerticalLine",
  "fbOutlineB": "fbHorizontalLine",
  "fbOutlineR": "fbVerticalLine"
};


// ************************************************************************************************
// Measurement Functions

var calculatePixelsPerInch = function calculatePixelsPerInch()
{
    var inch = document.createElement("div");
    inch.style.cssText = resetStyle + "width:1in; height:1in; position:absolute; top:-1234px; left:-1234px;";
    document.body.appendChild(inch);
    
    pixelsPerInch = {
        x: inch.offsetWidth,
        y: inch.offsetHeight
    };
    
    document.body.removeChild(inch);
};


// ************************************************************************************************
// Section

var createInspectorFrame = function createInspectorFrame()
{
    fbInspectFrame = document.createElement("div");
    fbInspectFrame.id = "fbInspectFrame";
    fbInspectFrame.style.cssText = inspectFrameStyle;
    document.body.appendChild(fbInspectFrame);
}

var destroyInspectorFrame = function createInspectorFrame()
{
    document.body.removeChild(fbInspectFrame);
}

var createOutlineInspector = function createOutlineInspector()
{
    for (var name in outline)
    {
        var el = outlineElements[name] = document.createElement("div");
        el.id = name;
        el.style.cssText = inspectStyle + outlineStyle[outline[name]];
        offlineFragment.appendChild(el);
    }
};

var createBoxModelInspector = function createBoxModelInspector()
{
    boxModel = document.createElement("div");
    boxModel.id = "fbBoxModel";
    boxModelStyle = boxModel.style;
    boxModelStyle.cssText = inspectModelStyle;
    
    boxMargin = document.createElement("div");
    boxMargin.id = "fbBoxMargin";
    boxMarginStyle = boxMargin.style;
    boxMarginStyle.cssText = inspectMarginStyle;
    boxModel.appendChild(boxMargin);
    
    boxPadding = document.createElement("div");
    boxPadding.id = "fbBoxPadding";
    boxPaddingStyle = boxPadding.style;
    boxPaddingStyle.cssText = inspectPaddingStyle;
    boxModel.appendChild(boxPadding);
    
    boxContent = document.createElement("div");
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