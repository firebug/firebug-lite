/* See license.txt for terms of usage */

define("Core/DOM", ["FBL"], function(FBL) {

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

// ********************************************************************************************* //
// Public

return FBL;

// ********************************************************************************************* //
});
