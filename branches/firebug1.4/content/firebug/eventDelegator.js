/* See license.txt for terms of usage */

FBL.ns(function() { with (FBL) {

/**

Problems
    - cross-browser compatibily (addEventListener versus attachEvent, event object differences)
    - performance (we need to reduce the number of events attached to elements --> event delegation)
    
Related-problems
    - memory leak (we need to avoid circular references between DOM and JS worlds --> cache)
    - remote object identification (we can't use XPATH for JavaScript objects)

Goals
  - Define an API to handle event-related problems (event handling, event delegation, key listening)


Questions


Using expando property to cache elements
  - we need this to optimize cache lookup time and avoid attaching JavaScript objects into DOM Elements (no circular references problem, less prone to memory leaks)
  - Is this ok in Firebug code? Firebug Lite currently uses this

Controller definition using CSS selectors or classes-only
  - How to verify if a particular element matches a CSS selector in FF?




Control is an visual component that respond to user actions

Controller is a special kind of Control that operates several sub-components (internal Controls)
using a single Control component




Event

Action

Controller











http://docwiki.embarcadero.com/VCL/en/Controls.TControl

API

Firebug.Inspector::click


----------------------------------------------------------------------------------------------------
Lib/Event Module
----------------------------------------------------------------------------------------------------
    Lib.addEvent(element, namespace-type, callback, capture)
    Lib.removeEvent(element, namespace-type, callback, capture)
    Lib.removeEvents(namespace)

    Lib.cancelEvent(event, preventDefault) ?

    // KeyEvent object for non-FF browsers
    Lib.KeyEvent = window.KeyEvent ||
    {
        DOM_VK_CANCEL: 3,
        DOM_VK_HELP: 6,
        DOM_VK_BACK_SPACE: 8,
        DOM_VK_TAB: 9,
        DOM_VK_CLEAR: 12,
        DOM_VK_RETURN: 13,
        DOM_VK_ENTER: 14,
        ...
    }

----------------------------------------------------------------------------------------------------
Lib/Event Module (currently in Lib)
----------------------------------------------------------------------------------------------------
    Lib.noKeyModifiers(event)

    Lib.isControl(event)
    Lib.isShift(event)
    Lib.isAlt(event)
    Lib.isControlShift(event)

    Lib.isLeftClick(event)
    Lib.isMiddleClick(event)
    Lib.isRightClick(event)
    Lib.isControlClick(event)
    Lib.isShiftClick(event)
    Lib.isAltClick(event)


----------------------------------------------------------------------------------------------------
Firebug.Control(context?, element)
----------------------------------------------------------------------------------------------------
    addEvent(namespace-type, callback, capture)
    removeEvent(namespace-type, callback, capture)
    removeEvents(namespace)


----------------------------------------------------------------------------------------------------
Firebug.Controller(context?, element)
----------------------------------------------------------------------------------------------------
    addController(selector, namespace-type, callback, capture)
    removeController(selector, namespace-type, callback, capture)
    removeControllers(namespace)

    addKeyController(key, filter, listener, capture, priority?)
    removeKeyController(key)
    removeKeyControllers()

    addCharController(character, filter, listener, capture, priority?)
    removeCharController(character)
    removeCharControllers()
















    ++filters
    ++keyConstants




    - all mouse events should be delegated
    - all keyboard events should be delegated
    - all resize events should be delegated
    - all scroll events should be delegated


    - avoid using addEvent directly. Use it only for specific cases such as:
        - load
        - focus
        - blur




*/




// ************************************************************************************************
// Globals

var EventCache = Firebug.Lite.Cache.Event;


window.addEvent = function(element, type, callback, capture)
{
    var id = EventCache(element);
    
    if (!id) return;
    
    // read namespaces
    var info = readEventNamespace(type);
    var namespaces = info.namespaces;
    type = info.type;

    // event data
    var eventMap = EventCache.data(element, "eventMap");
    
    if (!eventMap)
    {
        eventMap = EventCache.data(element, "eventMap", {});
    }
    
    var eventData = eventMap[type];

    if (!eventData)
    {
        eventMap = eventMap[type] = {
            callbacks: [],
            handler: null
        };
    }
    
    // callback queue
    var eventCallbacks = eventData.callbacks;

    // event handler
    var eventHandler = eventData.handler;

    if (!eventHandler)
    {
        eventHandler = eventData.handler = function(event)
        {
            event = fixEvent(event);

            for (var i = 0, length = eventCallbacks.length; i < length; i++)
            {
                var item = eventCallbacks[i];

                item.callback.call(element, event);
            }
        };
    }
    
    // add event to the queue
    eventCallbacks.push({
        type: type, // redundant.... remove this?
        callback: callback,
        capture: capture,
        namespaces: namespaces
    });

    if (eventCallbacks.length == 1)
    {
        if (element.addEventListener)
            element.addEventListener(type, eventHandler, capture);
        else
            element.attachEvent("on"+type, eventHandler);
    }
};

window.removeEvent = function(element, type, callback, capture)
{
    var id = EventCache(element);

    if (!id) return;

    // read namespaces
    var info = readEventNamespace(type);
    var namespaces = info.namespaces;
    type = info.type;

    // event map data
    var eventMap = EventCache.data(element, "eventMap");
    if (!eventMap) return;
    
    var types = [];
    
    if (type)
    {
        types = [type];
    }
    else
    {
        for (var name in eventData)
        {
            types.push(name);
        }
    }
    
    for (var t = 0, tlength = types.length; t < tlength; t++)
    {
        type = types[t];
        
        // event data
        var eventData = eventMap[type];

        // callback queue
        var eventCallbacks = eventData.callbacks;
        if (!eventCallbacks) return;

        // event handler
        var eventHandler = eventData.handler;


        for (var i = 0;
            // we cannot store the length as a way to improve the performance because
            // we're removing elements from the array, so we need to actually read
            // the length in every loop iteration to make sure we have reached the end
            i < eventCallbacks.length;
            )
        {
            var item = eventCallbacks[i];

            /*

            cases
                - click
                - click.namespace
                - click.namespace.plus
                - .namespace



            has type --> look for 1 type
            has no type --> look for all types

                has namespace --> compare

                has callback --> compare

                no namespace, no callback (case removeEvent(el, "click")) --> remove all events with the given type


            */

            if (
              (callback && item.callback == callback || !callback) &&
              (namespaces && compareEventNamespace(namespaces, item.namespaces) || !namespaces)
            )
            {
                eventCallbacks.splice(i, 1);
            }
            else
            {
                // we must advance the cursor only if current item wasn't removed
                i++;
            }
        }

        if (eventCallbacks.length == 0)
        {
            if (element.removeEventListener)
                element.removeEventListener(type, eventHandler, capture);
            else
                element.detachEvent("on"+type, eventHandler);
        }

    }
};



// ************************************************************************************************
// Locals

var readEventNamespace = function(type)
{
    var info = {};

    if (type.indexOf(".") != -1)
    {
        var parts = type.split(".");

        // type is the first name
        info.type = parts.shift();
        // namespaces are all remaining parts (eg: click.MyPanel.MyPanelAction)
        info.namespaces = parts.length > 0 ? parts : null;
    }
    else
    {
        info.type = type;
    }

    return info;
};


var compareEventNamespace = function(namespaces, baseNamespaces)
{
    if (!namespaces || !baseNamespaces) return false;
    
    var base = " " + baseNamespaces.join(" ") + " ";
    var count = 0;
    var ns;
    
    for (var i = 0, length = namespaces.length; i < length; i++)
    {
        ns = namespaces[i];
        
        if ( base.indexOf(" " + ns + " ") != -1 )
        {
            count++;
        }
    }
    
    return count == length;
};

// ************************************************************************************************

/**
 * Support for cross-browser compatible event.
 */
var expando = "helloModule";
var fixEvent = function(event)
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


// ************************************************************************************************

}});
