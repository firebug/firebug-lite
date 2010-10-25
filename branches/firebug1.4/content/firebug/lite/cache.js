/* See license.txt for terms of usage */

FBL.ns(function() { with (FBL) {
// ************************************************************************************************

Firebug.Lite.Cache = 
{
    ID: "firebug" + new Date().getTime()
};

// ************************************************************************************************

var cacheUID = 0;
var createCache = function()
{
    var map = {};
    var CID = Firebug.Lite.Cache.ID;
    
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
            
            element[CID] = null;
            delete element[CID];
            
            map[id] = null;
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
                
                element[CID] = null;
                delete element[CID];
                
                map[id] = null;
                delete map[id];
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
