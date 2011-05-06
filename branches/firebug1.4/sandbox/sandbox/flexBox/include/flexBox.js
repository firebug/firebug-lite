/**
 * TODO: addEvent?
 * TODO: divide process in two: 
 *      reflow() (read fixed size, pre-compute flex sizes) and 
 *      render() (compute flex sizes, apply styles)
 *      invalidate/refresh() (reflow() + render()) 
 * 
 * TODO: change name of boxFixHideContents class (it is not hiding)
 *                      boxFixCleanContents?
 *                      boxFixShiftContents?
 *                      boxFixHack?
 */  

(function(){

// ************************************************************************************************

var debug = false;

// TODO: better browser detection
var supportsFlexBox = !document.all;
var _isIE6 = navigator.userAgent.indexOf("MSIE 6") != -1

// ************************************************************************************************

function FlexBox(root, listenWindowResize)
{
    if (supportsFlexBox && !debug)
    {
        return;
    }
    
    setClass(root, "boxFix");

    var win = root.contentWindow || window;
    var measure = new Measure(win);
    
    var reflowTimer;
    var lastReflow = 0;

    var reflow = this.reflow = function()
    {
        var result;
        var object;
        var objects =
            [
                {
                    element: root,
                    flex: null,
                    extra: {}
                }
            ];
        
        while (object = objects.shift())
        {
            result = reflowBox(root, object, measure);
            
            if (result.length > 0)
            {
                objects = objects.concat(result);
            }
        }
    }
    
    this.resizeHandler = function()
    {
        if (new Date().getTime() - lastReflow > 50)
        {
            if (reflowTimer)
            {
                clearTimeout(reflowTimer);
                reflowTimer = null;
            }

            reflow();

            lastReflow = new Date().getTime();
        }
        else
        {
            if (reflowTimer)
            {
                clearTimeout(reflowTimer);
                reflowTimer = null;
            }

            reflowTimer = setTimeout(reflow, 50);
        }
    }
    
    if (listenWindowResize)
    {
        var onunload = function(){
            removeEvent(win, "resize", this.resizeHandler);
            removeEvent(win, "unload", onunload);
        };
        
        addEvent(win, "resize", this.resizeHandler);
        addEvent(win, "unload", onunload);
    }
    
    reflow();
}

FlexBox.prototype.reflow = function(){};

FlexBox.prototype.resizeHandler = function(){};

// ************************************************************************************************

function reflowBox(root, boxObject, measure)
{
    var isIE6 = _isIE6;
    
    var box = boxObject.element;
    
    var result = [];
    
    var objects = [];
    var object;
    
    var element;
    var boxSpace;
    var space;
    var flex;
    var flexSum = 0;
    var fixedSpace = 0;
    var computedSpace = 0;
    var remainingPixels = 0;
    
    var padding;
    var border;
    var extraSpace;
    var totalSpace;
    var freeSpace;
    
    var className;
    var match;
    var reFlex = /\sboxFlex(\d?)\s/;
    var reBox = /\s(v|h)box\s/;
    
    var isVertical;
    var isHorizontal;
    
    var dimensionProperty;
    var measureProperty;
    var measureBeforeProperty;
    var measureAfterProperty;
    
    if (isIE6)
    {
        fixIE6BackgroundImageCache();
    }
    
    if (hasClass(box, "vbox"))
    {
        isVertical = true;
        
        dimensionProperty = "height";
        measureProperty = "offsetHeight";
        measureBeforeProperty = "top";
        measureAfterProperty = "bottom";
    }
    else if (hasClass(box, "hbox"))
    {
        isHorizontal = true;
        
        dimensionProperty = "width";
        measureProperty = "offsetWidth";
        measureBeforeProperty = "left";
        measureAfterProperty = "right";
    }
    else
    {
        return result;
    }

    for (var i = 0, childs = box.childNodes, length = childs.length; i < length; i++)
    {
        element = childs[i];
        
        // ignore non-element nodes
        if (element.nodeType != 1) continue;
        
        className = " " + element.className + " ";
        
        padding = measure.getMeasureBox(element, "padding");
        border = measure.getMeasureBox(element, "border");
        
        extraSpace = padding[measureBeforeProperty] + padding[measureAfterProperty] +
                     border[measureBeforeProperty] + border[measureAfterProperty];
            
        if (match = reFlex.exec(className))
        {
            flex = match[1]-0 || 1;
            space = null;
        
            flexSum += flex;
        }
        else
        {
            boxSpace = element[measureProperty];
            
            space = boxSpace - extraSpace;
            space = Math.max(space, 0);
            
            flex = null;
            
            fixedSpace += boxSpace;
        }
        
        object =
        {
            element: element,
            flex: flex,
            extra: {}
        };
        
        object[dimensionProperty] = space;
        object.extra[dimensionProperty] = extraSpace;
        
        objects.push(object);
        
        // it is a box, so we need to layout it
        if (reBox.test(className))
        {
            result.push(object);
        }
    }
    
    if (!totalSpace)
    {
        extraSpace = boxObject.extra[dimensionProperty];
        
        if (!extraSpace)
        {
            padding = measure.getMeasureBox(box, "padding");
            border = measure.getMeasureBox(box, "border");
            
            extraSpace = padding[measureBeforeProperty] + padding[measureAfterProperty] +
                         border[measureBeforeProperty] + border[measureAfterProperty];
        }
        
        // We are setting the height of horizontal boxes in IE6, so we need to 
        // temporary hide the elements otherwise we will get the wrong measures
        if (isIE6)
        {
            className = box.className;
            box.className = className + " boxFixHideContents";
            space = box[measureProperty];
            box.className = className;
        }
        else
        {
            space = box[measureProperty];
        }
        
        totalSpace = space - extraSpace;
        
    }
    
    freeSpace = totalSpace - fixedSpace;
    
    var minimumSpace = 0;
    
    for (var i = 0, length = objects.length; i < length; i++)
    {
        object = objects[i];
        
        element = object.element;
        flex = object.flex;
        
        extraSpace = object.extra[dimensionProperty];
        
        if (flex)
        {
            space = Math.floor(freeSpace * flex / flexSum);
            
            space = space - extraSpace;
            space = Math.max(space, 0);
            
            // distribute remaining pixels
            remainingPixels = freeSpace * flex % flexSum;
            if (remainingPixels > 0 && computedSpace + space + remainingPixels <= totalSpace)
            {
                space++;
            }
            
            object[dimensionProperty] = space;
        }
        else
        {
            space = object[dimensionProperty];
        }

        if (isHorizontal || flex)
        {
            if (isVertical)
            {
                element.style.height = space + "px";
                
                // xxxpedro in IE6 the 100% width of an iframe with border will exceede
                // the with of its offsetParent... don't ask me why
                // not sure though if this is the best way to solve it
                if (isIE6 && element.nodeName.toLowerCase() == "iframe")
                {
                    // reusing className variable for the sake of saving memory
                    className = element.currentStyle.position;
                    element.style.display = "none";
                    // reusing boxSpace variable for the sake of saving memory
                    boxSpace = element.offsetParent.offsetWidth;
                    element.style.display = "block";

                    border = measure.getMeasureBox(element, "border");
                    
                    element.style.width = (boxSpace - 2*border.left - 2*border.right) + "px";
                }
            }
            else
            {
                setClass(element, "boxFixPos")
                
                element.style.left = computedSpace + "px";
                element.style.width = space + "px";
                
                // boxObject.height IE6 only
                if (isIE6)
                {
                    // TODO: figure out how to solve the problem with minimumSpace
                    object.height = boxObject.height || box.offsetHeight;
                    element.style.height = object.height + "px";
                }
            }
        }
        
        computedSpace += space;
        minimumSpace += extraSpace + space;
    }
    
    if (box != root && isVertical)
    {
        // TODO: check for "deeper" parents
        box.parentNode.style[dimensionProperty] = Math.max(box.parentNode[measureProperty], minimumSpace) + "px";
    }
    
    
    return result;
}

// ************************************************************************************************

var hasClass = function(node, name)
{
    return (' '+node.className+' ').indexOf(' '+name+' ') != -1;
};

var setClass = function(node, name)
{
    if (node && (' '+node.className+' ').indexOf(' '+name+' ') == -1)
        node.className += " " + name;
};

var addEvent = function(object, name, handler, useCapture)
{
    if (object.addEventListener)
        object.addEventListener(name, handler, useCapture);
    else
        object.attachEvent("on"+name, handler);
};

var removeEvent = function(object, name, handler, useCapture)
{
    if (object.removeEventListener)
        object.removeEventListener(name, handler, useCapture);
    else
        object.detachEvent("on"+name, handler);
};

// ************************************************************************************************

// http://www.mister-pixel.com/#Content__state=is_that_simple
var fixIE6BackgroundImageCache = function(doc)
{
    doc = doc || document;
    try
    {
        doc.execCommand("BackgroundImageCache", false, true);
    } 
    catch(E)
    {
        
    }
};

// ************************************************************************************************

window.FlexBox = FlexBox;

// ************************************************************************************************
})();