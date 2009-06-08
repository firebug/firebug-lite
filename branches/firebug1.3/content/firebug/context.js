FBL.ns(function() { with (FBL) {
// ************************************************************************************************


// ************************************************************************************************
// Context
  
FBL.Context = function(win){
    this.window = win.window;
    this.document = win.document;
    
    // Some windows in IE, like iframe, doesn't have the eval() method
    if (isIE && !this.window.eval)
    {
        // But after executing the following line the method magically appears!
        this.window.execScript("null");
        // Just to make sure the "magic" really happened
        if (!this.window.eval)
            throw new Error("Firebug Error: eval() method not found in this window");
    }
    
    // Create a new "black-box" eval() method that runs in the global namespace
    // of the context window, without exposing the local variables declared
    // by the function that calls it
    this.eval = this.window.eval("new Function('" +
            "try{ return window.eval.apply(window,arguments) }catch(E){ E."+evalError+"=true; return E }" +
        "')");
};

FBL.Context.prototype =
{  
  
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // Evalutation Method
    
    /**
     * Evaluates an expression in the current context window.
     * 
     * @param {String}   expr           expression to be evaluated
     * 
     * @param {String}   context        string indicating the global location
     *                                  of the object that will be used as the
     *                                  context. The context is referred in
     *                                  the expression as the "this" keyword.
     *                                  If no context is informed, the "window"
     *                                  context is used.
     *                                  
     * @param {String}   api            string indicating the global location
     *                                  of the object that will be used as the
     *                                  api of the evaluation.
     *                                  
     * @param {Function} errorHandler(message) error handler to be called
     *                                         if the evaluation fails.
     */
    evaluate: function(expr, context, api, errorHandler)
    {
        context = context || "window";

        var cmd = api ?
            "(function(arguments){ with("+api+"){ return "+expr+" } }).call("+context+",undefined)" :
            "(function(arguments){ return "+expr+" }).call("+context+",undefined)" ;
        
        var r = this.eval(cmd);
        if (r && r[evalError])
        {
            cmd = api ?
                "(function(arguments){ with("+api+"){ "+expr+" } }).call("+context+",undefined)" :
                "(function(arguments){ "+expr+" }).call("+context+",undefined)" ;
                
            r = this.eval(cmd);
            if (r && r[evalError])
            {
                if (errorHandler)
                    r = errorHandler(r.message || r)
                else
                    r = r.message || r;
            }
        }
        
        return r;
    },
    

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // Window Methods
    
    getWindowSize: function()
    {
        var width=0, height=0, el;
        
        if (typeof this.window.innerWidth == "number")
        {
            width = this.window.innerWidth;
            height = this.window.innerHeight;
        }
        else if ((el=this.document.documentElement) && (el.clientHeight || el.clientWidth))
        {
            width = el.clientWidth;
            height = el.clientHeight;
        }
        else if ((el=this.document.body) && (el.clientHeight || el.clientWidth))
        {
            width = el.clientWidth;
            height = el.clientHeight;
        }
        
        return {width: width, height: height};
    },
    
    getWindowScrollSize: function()
    {
        var width=0, height=0, el;

        if (!isIEQuiksMode && (el=this.document.documentElement) && 
           (el.scrollHeight || el.scrollWidth))
        {
            width = el.scrollWidth;
            height = el.scrollHeight;
        }
        else if ((el=this.document.body) && (el.scrollHeight || el.scrollWidth))
        {
            width = el.scrollWidth;
            height = el.scrollHeight;
        }
        
        return {width: width, height: height};
    },
    
    getWindowScrollPosition: function()
    {
        var top=0, left=0, el;
        
        if(typeof this.window.pageYOffset == "number")
        {
            top = this.window.pageYOffset;
            left = this.window.pageXOffset;
        }
        else if((el=this.document.body) && (el.scrollTop || el.scrollLeft))
        {
            top = el.scrollTop;
            left = el.scrollLeft;
        }
        else if((el=this.document.documentElement) && (el.scrollTop || el.scrollLeft))
        {
            top = el.scrollTop;
            left = el.scrollLeft;
        }
        
        return {top:top, left:left};
    },
    

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // Element Methods

    getElementFromPoint: function(x, y)
    {
        if (isOpera || isSafari)
        {
            var scroll = this.getWindowScrollPosition();
            return this.document.elementFromPoint(x + scroll.left, y + scroll.top);
        }
        else
            return this.document.elementFromPoint(x, y);
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
    
    getElementBox: function(el)
    {
        var result = {};
        
        if (el.getBoundingClientRect)
        {
            var rect = el.getBoundingClientRect();
            
            // fix IE problem with offset when not in fullscreen mode
            var offset = isIE ? this.document.body.clientTop || this.document.documentElement.clientTop: 0;
            
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
    

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // Measurement Methods
    
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
            var div = this.document.createElement("div");
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
        var div = this.document.createElement("div");
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
        var div = this.document.createElement("div");
        div.style.cssText = offscreenStyle + "width:"+value + "%;";
        
        el.appendChild(div);
        var value = div.offsetWidth;
        el.removeChild(div);
        
        return value;
    },
    
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    
    getCSS: this.isIE ? function(el, name)
    {
        return el.currentStyle[name] || el.style[name] || undefined;
    }
    : function(el, name)
    {
        return this.document.defaultView.getComputedStyle(el,null)[name] 
            || el.style[name] || undefined;
    }

};

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
// Internal variables

var evalError = "___firebug_evaluation_error___";
var pixelsPerInch;

// ************************************************************************************************
// Measurement Functions

var calculatePixelsPerInch = function calculatePixelsPerInch()
{
    var inch = this.document.createElement("div");
    inch.style.cssText = resetStyle + "width:1in; height:1in; position:absolute; top:-1234px; left:-1234px;";
    this.document.body.appendChild(inch);
    
    pixelsPerInch = {
        x: inch.offsetWidth,
        y: inch.offsetHeight
    };
    
    this.document.body.removeChild(inch);
};


// ************************************************************************************************
}});