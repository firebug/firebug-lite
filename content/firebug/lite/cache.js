/* See license.txt for terms of usage */

FBL.ns(function() { with (FBL) {
// ************************************************************************************************

Firebug.Lite.Cache = 
{
    ID: "firebug" + new Date().getTime()
};

// ************************************************************************************************

/**
 * TODO: if a cached element is cloned, the expando property will be cloned too in IE
 * which will result in a bug. Firebug Lite will think the new cloned node is the old
 * one.
 * 
 * TODO: Investigate a possibility of cache validation, to be customized by each 
 * kind of cache. For ElementCache it should validate if the element still is 
 * inserted at the DOM.
 */ 
var cacheUID = 0;
var createCache = function()
{
    var map = {};
    var CID = Firebug.Lite.Cache.ID;
    
    // better detection
    var supportsDeleteExpando = !document.all;
    
    var cacheFunction = function(element)
    {
        return cacheAPI.set(element);
    };
    
    var cacheAPI =  
    {
        get: function(key)
        {
            return map.hasOwnProperty(key) ?
                    map[key] :
                    null;
        },
        
        set: function(element)
        {
            var id = element[CID];
            
            if (!id)
            {
                id = ++cacheUID;
                element[CID] = id;
            }
            
            if (!map.hasOwnProperty(id))
            {
                map[id] = element;
            }
            
            return id;
        },
        
        unset: function(element)
        {
            var id = element[CID];
            
			if (supportsDeleteExpando)
            {
				delete element[CID];
			}
            else if (element.removeAttribute)
            {
				element.removeAttribute(CID);
			}

            delete map[id];
            
        },
        
        key: function(element)
        {
            return element[CID];
        },
        
        has: function(element)
        {
            return map.hasOwnProperty(element[CID]);
        },
        
        clear: function()
        {
            for (var id in map)
            {
                var element = map[id];
                cacheAPI.unset(element);                
            }
        }
    };
    
    FBL.append(cacheFunction, cacheAPI);
    
    return cacheFunction;
};

// ************************************************************************************************

// TODO: xxxpedro : check if we need really this on FBL scope
Firebug.Lite.Cache.StyleSheet = createCache();
Firebug.Lite.Cache.Element = createCache();

// ************************************************************************************************
}});
