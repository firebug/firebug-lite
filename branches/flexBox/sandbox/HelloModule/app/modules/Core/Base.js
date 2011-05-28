/* See license.txt for terms of usage */

define("Core/Base", ["FBL"], function(FBL) {

// ********************************************************************************************* //

FBL.extend = function(l, r)
{
    var newOb = {};
    for (var n in l)
        newOb[n] = l[n];
    for (var n in r)
        newOb[n] = r[n];
    return newOb;
};

FBL.append = function(l, r)
{
    for (var n in r)
        l[n] = r[n];

    return l;
};


// ********************************************************************************************* //
// Public

return FBL;

// ********************************************************************************************* //
});
