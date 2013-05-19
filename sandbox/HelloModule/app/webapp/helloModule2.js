/* See license.txt for terms of usage */

define(["FBL", "Firebug", "Domplate/DomTree"], function(FBL) { with (FBL) {

//*************************************************************************************************
// The Application

function HelloModuleApp()
{
}

/**
 * The main application object.
 */
HelloModuleApp.prototype =
/** @lends HelloModuleApp */
{
    initialize: function()
    {
        var content = document.getElementById("content");
        this.domTree = new Domplate.DomTree(window);
        this.domTree.append(content);
    }
};

//*************************************************************************************************
// Initialization

var theApp = new HelloModuleApp();
theApp.initialize();

//*************************************************************************************************
}});
