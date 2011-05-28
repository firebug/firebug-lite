/* See license.txt for terms of usage */

define("Lib/Event", ["FBL"], function(FBL) {

// ********************************************************************************************* //
// Events

FBL.isLeftClick = function(event)
{
    return event.button == 0 && FBL.noKeyModifiers(event);
};

FBL.noKeyModifiers = function(event)
{
    return !event.ctrlKey && !event.shiftKey && !event.altKey && !event.metaKey;
};

/**
 * Support for cross-browser compatible event.
 */
var expando = "helloModule";
FBL.eventFix = function(event)
{
    if ( event[expando] == true )
        return event;

    // store a copy of the original event object
    // and "clone" to set read-only properties
    var originalEvent = event;
    event = { originalEvent: originalEvent };
    var props = "altKey attrChange attrName bubbles button cancelable charCode clientX clientY ctrlKey currentTarget data detail eventPhase fromElement handler keyCode metaKey newValue originalTarget pageX pageY prevValue relatedNode relatedTarget screenX screenY shiftKey srcElement target timeStamp toElement type view wheelDelta which".split(" ");
    for ( var i=props.length; i; i-- )
        event[ props[i] ] = originalEvent[ props[i] ];

    // Mark it as fixed
    event[expando] = true;

    // add preventDefault and stopPropagation since
    // they will not work on the clone
    event.preventDefault = function() {
        // if preventDefault exists run it on the original event
        if (originalEvent.preventDefault)
            originalEvent.preventDefault();
        // otherwise set the returnValue property of the original event to false (IE)
        originalEvent.returnValue = false;
    };
    event.stopPropagation = function() {
        // if stopPropagation exists run it on the original event
        if (originalEvent.stopPropagation)
            originalEvent.stopPropagation();
        // otherwise set the cancelBubble property of the original event to true (IE)
        originalEvent.cancelBubble = true;
    };

    // Fix timeStamp
    event.timeStamp = event.timeStamp || this.now();

    // Fix target property, if necessary
    if ( !event.target )
        event.target = event.srcElement || document; // Fixes #1925 where srcElement might not be defined either

    // check if target is a textnode (safari)
    if ( event.target.nodeType == 3 )
        event.target = event.target.parentNode;

    // Add relatedTarget, if necessary
    if ( !event.relatedTarget && event.fromElement )
        event.relatedTarget = event.fromElement == event.target ? event.toElement : event.fromElement;

    // Calculate pageX/Y if missing and clientX/Y available
    if ( event.pageX == null && event.clientX != null ) {
        var doc = document.documentElement, body = document.body;
        event.pageX = event.clientX + (doc && doc.scrollLeft || body && body.scrollLeft || 0) - (doc.clientLeft || 0);
        event.pageY = event.clientY + (doc && doc.scrollTop || body && body.scrollTop || 0) - (doc.clientTop || 0);
    }

    // Add which for key events
    if ( !event.which && ((event.charCode || event.charCode === 0) ? event.charCode : event.keyCode) )
        event.which = event.charCode || event.keyCode;

    // Add metaKey to non-Mac browsers (use ctrl for PC's and Meta for Macs)
    if ( !event.metaKey && event.ctrlKey )
        event.metaKey = event.ctrlKey;

    // Add which for click: 1 == left; 2 == middle; 3 == right
    // Note: button is not normalized, so don't use it
    if ( !event.which && event.button )
        event.which = (event.button & 1 ? 1 : ( event.button & 2 ? 3 : ( event.button & 4 ? 2 : 0 ) ));

    return event;
}

// ********************************************************************************************* //
// DOM

FBL.getAncestorByClass = function(node, className)
{
    for (var parent = node; parent; parent = parent.parentNode)
    {
        if (FBL.hasClass(parent, className))
            return parent;
    }

    return null;
};

//***********************************************************************************************//
// CSS

FBL.hasClass = function(node, name) // className, className, ...
{
    if (!node || node.nodeType != 1)
        return false;
    else
    {
        for (var i=1; i<arguments.length; ++i)
        {
            var name = arguments[i];
            //var re = new RegExp("(^|\\s)"+name+"($|\\s)");
            //if (!re.exec(node.getAttribute("class")))
            //    return false;
            var className = node.className;//node.getAttribute("class");
            if (!className || className.indexOf(name + " ") == -1)
                return false;
        }

        return true;
    }
};

FBL.setClass = function(node, name)
{
    if (node && !FBL.hasClass(node, name))
        node.className += " " + name + " ";
};

FBL.removeClass = function(node, name)
{
    if (node && node.className)
    {
        var index = node.className.indexOf(name);
        if (index >= 0)
        {
            var size = name.length;
            node.className = node.className.substr(0,index-1) + node.className.substr(index+size);
        }
    }
};

FBL.toggleClass = function(elt, name)
{
    if (FBL.hasClass(elt, name))
    {
        FBL.removeClass(elt, name);
        return false;
    }
    else
    {
        FBL.setClass(elt, name);
        return true;
    }
};

// ********************************************************************************************* //
// Public

return FBL;

// ********************************************************************************************* //
});
