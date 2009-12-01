FBL.ns(function() { with (FBL) {
// ************************************************************************************************

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

var insertSliceSize = 18;
var insertInterval = 40;

var ignoreVars =
{
    "__firebug__": 1,
    "eval": 1,

    // We are forced to ignore Java-related variables, because
    // trying to access them causes browser freeze
    "java": 1,
    "sun": 1,
    "Packages": 1,
    "JavaArray": 1,
    "JavaMember": 1,
    "JavaObject": 1,
    "JavaClass": 1,
    "JavaPackage": 1,
    "_firebug": 1,
    "_FirebugConsole": 1,
    "_FirebugCommandLine": 1
};

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

var RowTag =
    TR({"class": "memberRow $member.open $member.type\\Row", $hasChildren: "$member.hasChildren", role : 'presentation',
        level: "$member.level"},
        TD({"class": "memberLabelCell", style: "padding-left: $member.indent\\px", role : 'presentation'},
            DIV({"class": "memberLabel $member.type\\Label"},
                SPAN({}, "$member.name")
            )
        ),
        TD({"class": "memberValueCell", role : 'presentation'},
            TAG("$member.tag", {object: "$member.value"})
        )
    );

var $STR = function(){};

var WatchRowTag =
    TR({"class": "watchNewRow", level: 0},
        TD({"class": "watchEditCell", colspan: 2},
            DIV({"class": "watchEditBox a11yFocusNoTab", role: "button", 'tabindex' : '0',
                'aria-label' : $STR('press enter to add new watch expression')},
                    $STR("NewWatch")
            )
        )
    );

var SizerRow =
    TR({role : 'presentation'},
        TD({width: "30%"}),
        TD({width: "70%"})
    );

Firebug.Rep={};  // TODO: xxxpedro

var DirTablePlate = domplate(Firebug.Rep,
{
    tag:
        TABLE({"class": "domTable", cellpadding: 0, cellspacing: 0, onclick: "$onClick", role :"tree"},
            TBODY({role: 'presentation'},
                SizerRow,
                FOR("member", "$object|memberIterator", RowTag)
            )
        ),
        
    watchTag:
        TABLE({"class": "domTable", cellpadding: 0, cellspacing: 0,
               _toggles: "$toggles", _domPanel: "$domPanel", onclick: "$onClick", role : 'tree'},
            TBODY({role : 'presentation'},
                SizerRow,
                WatchRowTag
            )
        ),

    tableTag:
        TABLE({"class": "domTable", cellpadding: 0, cellspacing: 0,
            _toggles: "$toggles", _domPanel: "$domPanel", onclick: "$onClick", role : 'tree'},
            TBODY({role : 'presentation'},
                SizerRow
            )
        ),

    rowTag:
        FOR("member", "$members", RowTag),

    memberIterator: function(object, level)
    {
        return getMembers(object, level);
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

    onClick: function(event)
    {
        if (!isLeftClick(event))
            return;
        
        var target = event.target || event.srcElement;

        var row = getAncestorByClass(target, "memberRow");
        var label = getAncestorByClass(target, "memberLabel");
        if (label && hasClass(row, "hasChildren"))
        {
            var row = label.parentNode.parentNode;
            this.toggleRow(row);
        }
        else
        {
            var object = Firebug.getRepObject(target);
            if (typeof(object) == "function")
            {
                Firebug.chrome.select(object, "script");
                cancelEvent(event);
            }
            else if (event.detail == 2 && !object)
            {
                var panel = row.parentNode.parentNode.domPanel;
                if (panel)
                {
                    var rowValue = panel.getRowPropertyValue(row);
                    if (typeof(rowValue) == "boolean")
                        panel.setPropertyValue(row, !rowValue);
                    else
                        panel.editProperty(row);

                    cancelEvent(event);
                }
            }
        }
    },

    toggleRow: function(row)
    {
        var level = parseInt(row.getAttribute("level"));
        var toggles = row.parentNode.parentNode.toggles;

        if (hasClass(row, "opened"))
        {
            removeClass(row, "opened");

            if (toggles)
            {
                var path = getPath(row);

                // Remove the path from the toggle tree
                for (var i = 0; i < path.length; ++i)
                {
                    if (i == path.length-1)
                        delete toggles[path[i]];
                    else
                        toggles = toggles[path[i]];
                }
            }

            var rowTag = this.rowTag;
            var tbody = row.parentNode;

            setTimeout(function()
            {
                for (var firstRow = row.nextSibling; firstRow; firstRow = row.nextSibling)
                {
                    if (parseInt(firstRow.getAttribute("level")) <= level)
                        break;

                    tbody.removeChild(firstRow);
                }
            }, row.insertTimeout ? row.insertTimeout : 0);
        }
        else
        {
            setClass(row, "opened");

            if (toggles)
            {
                var path = getPath(row);

                // Mark the path in the toggle tree
                for (var i = 0; i < path.length; ++i)
                {
                    var name = path[i];
                    if (toggles.hasOwnProperty(name))
                        toggles = toggles[name];
                    else
                        toggles = toggles[name] = {};
                }
            }

            var value = row.lastChild.firstChild.repObject;
            var members = getMembers(value, level+1);

            var rowTag = this.rowTag;
            var lastRow = row;

            var delay = 0;
            var setSize = members.length;
            var rowCount = 1;
            while (members.length)
            {
                with({slice: members.splice(0, insertSliceSize), isLast: !members.length})
                {
                    setTimeout(function()
                    {
                        if (lastRow.parentNode)
                        {
                            var result = rowTag.insertRows({members: slice}, lastRow);
                            lastRow = result[1];
                            //dispatch([Firebug.A11yModel], 'onMemberRowSliceAdded', [null, result, rowCount, setSize]);
                            rowCount += insertSliceSize;
                        }
                        if (isLast)
                            delete row.insertTimeout;
                    }, delay);
                }

                delay += insertInterval;
            }

            row.insertTimeout = delay;
        }
    }
});




// ************************************************************************************************
// Local Helpers

var getMembers = function getMembers(object, level)  // we expect object to be user-level object wrapped in security blanket
{
    if (!level)
        level = 0;

    var ordinals = [], userProps = [], userClasses = [], userFuncs = [],
        domProps = [], domFuncs = [], domConstants = [];

    try
    {
        var domMembers = getDOMMembers(object);
        //var domMembers = {}; // TODO: xxxpedro
        //var domConstantMap = {};  // TODO: xxxpedro

        if (object.wrappedJSObject)
            var insecureObject = object.wrappedJSObject;
        else
            var insecureObject = object;

        // IE function prototype is not listed in (for..in)
        if (isIE && isFunction(object))
            addMember("user", userProps, "prototype", object.prototype, level);            
            
        for (var name in insecureObject)  // enumeration is safe
        {
            if (ignoreVars[name] == 1)  // javascript.options.strict says ignoreVars is undefined.
                continue;

            var val;
            try
            {
                val = insecureObject[name];  // getter is safe
            }
            catch (exc)
            {
                // Sometimes we get exceptions trying to access certain members
                if (FBTrace.DBG_ERRORS && FBTrace.DBG_DOM)
                    FBTrace.sysout("dom.getMembers cannot access "+name, exc);
            }

            var ordinal = parseInt(name);
            if (ordinal || ordinal == 0)
            {
                addMember("ordinal", ordinals, name, val, level);
            }
            else if (isFunction(val))
            {
                if (isClassFunction(val))
                    addMember("userClass", userClasses, name, val, level);
                else if (name in domMembers)
                    addMember("domFunction", domFuncs, name, val, level, domMembers[name]);
                else
                    addMember("userFunction", userFuncs, name, val, level);
            }
            else
            {
                //TODO: xxxpedro
                /*
                var getterFunction = insecureObject.__lookupGetter__(name),
                    setterFunction = insecureObject.__lookupSetter__(name),
                    prefix = "";

                if(getterFunction && !setterFunction)
                    prefix = "get ";
                /**/
                
                var prefix = "";

                if (name in domMembers)
                    addMember("dom", domProps, (prefix+name), val, level, domMembers[name]);
                else if (name in domConstantMap)
                    addMember("dom", domConstants, (prefix+name), val, level);
                else
                    addMember("user", userProps, (prefix+name), val, level);
            }
        }
    }
    catch (exc)
    {
        // Sometimes we get exceptions just from trying to iterate the members
        // of certain objects, like StorageList, but don't let that gum up the works
        throw exc;
        if (FBTrace.DBG_ERRORS && FBTrace.DBG_DOM)
            FBTrace.sysout("dom.getMembers FAILS: ", exc);
        //throw exc;
    }

    function sortName(a, b) { return a.name > b.name ? 1 : -1; }
    function sortOrder(a, b) { return a.order > b.order ? 1 : -1; }

    var members = [];

    members.push.apply(members, ordinals);

    Firebug.showUserProps = true; // TODO: xxxpedro
    Firebug.showUserFuncs = true; // TODO: xxxpedro
    Firebug.showDOMProps = true;
    Firebug.showDOMFuncs = true;
    Firebug.showDOMConstants = true;
    
    if (Firebug.showUserProps)
    {
        userProps.sort(sortName);
        members.push.apply(members, userProps);
    }

    if (Firebug.showUserFuncs)
    {
        userClasses.sort(sortName);
        members.push.apply(members, userClasses);

        userFuncs.sort(sortName);
        members.push.apply(members, userFuncs);
    }

    if (Firebug.showDOMProps)
    {
        domProps.sort(sortName);
        members.push.apply(members, domProps);
    }

    if (Firebug.showDOMFuncs)
    {
        domFuncs.sort(sortName);
        members.push.apply(members, domFuncs);
    }

    if (Firebug.showDOMConstants)
        members.push.apply(members, domConstants);

    return members;
}

function expandMembers(members, toggles, offset, level)  // recursion starts with offset=0, level=0
{
    var expanded = 0;
    for (var i = offset; i < members.length; ++i)
    {
        var member = members[i];
        if (member.level > level)
            break;

        if ( toggles.hasOwnProperty(member.name) )
        {
            member.open = "opened";  // member.level <= level && member.name in toggles.

            var newMembers = getMembers(member.value, level+1);  // sets newMembers.level to level+1

            var args = [i+1, 0];
            args.push.apply(args, newMembers);
            members.splice.apply(members, args);
            
            /*
            if (FBTrace.DBG_DOM)
            {
                FBTrace.sysout("expandMembers member.name", member.name);
                FBTrace.sysout("expandMembers toggles", toggles);
                FBTrace.sysout("expandMembers toggles[member.name]", toggles[member.name]);
                FBTrace.sysout("dom.expandedMembers level: "+level+" member", member);
            }
            /**/

            expanded += newMembers.length;
            i += newMembers.length + expandMembers(members, toggles[member.name], i+1, level+1);
        }
    }

    return expanded;
}

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *


function isClassFunction(fn)
{
    try
    {
        for (var name in fn.prototype)
            return true;
    } catch (exc) {}
    return false;
}

var hasProperties = function hasProperties(ob)
{
    try
    {
        for (var name in ob)
            return true;
    } catch (exc) {}
    
    // IE function prototype is not listed in (for..in)
    if (isFunction(ob)) return true;
    
    return false;
}

FBL.ErrorCopy = function(message)
{
    this.message = message;
};

var addMember = function addMember(type, props, name, value, level, order)
{
    var rep = Firebug.getRep(value);    // do this first in case a call to instanceof reveals contents
    var tag = rep.shortTag ? rep.shortTag : rep.tag;

    var ErrorCopy = function(){}; //TODO: xxxpedro
    
    var valueType = typeof(value);
    var hasChildren = hasProperties(value) && !(value instanceof ErrorCopy) &&
        (isFunction(value) || (valueType == "object" && value != null)
        || (valueType == "string" && value.length > Firebug.stringCropLength));

    props.push({
        name: name,
        value: value,
        type: type,
        rowClass: "memberRow-"+type,
        open: "",
        order: order,
        level: level,
        indent: level*16,
        hasChildren: hasChildren,
        tag: tag
    });
}

function getWatchRowIndex(row)
{
    var index = -1;
    for (; row && hasClass(row, "watchRow"); row = row.previousSibling)
        ++index;
    return index;
}

function getRowName(row)
{
    return row.firstChild.textContent;
}

function getRowValue(row)
{
    return row.lastChild.firstChild.repObject;
}

function getRowOwnerObject(row)
{
    var parentRow = getParentRow(row);
    if (parentRow)
        return getRowValue(parentRow);
}

function getParentRow(row)
{
    var level = parseInt(row.getAttribute("level"))-1;
    for (row = row.previousSibling; row; row = row.previousSibling)
    {
        if (parseInt(row.getAttribute("level")) == level)
            return row;
    }
}

function getPath(row)
{
    var name = getRowName(row);
    var path = [name];

    var level = parseInt(row.getAttribute("level"))-1;
    for (row = row.previousSibling; row; row = row.previousSibling)
    {
        if (parseInt(row.getAttribute("level")) == level)
        {
            var name = getRowName(row);
            path.splice(0, 0, name);

            --level;
        }
    }

    return path;
}

// ************************************************************************************************


// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *


// ************************************************************************************************
// DOM Module

Firebug.DOM = extend(Firebug.Module,
{
    getPanel: function()
    {
        return Firebug.chrome ? Firebug.chrome.getPanel("DOM") : null;
    }
});

Firebug.registerModule(Firebug.DOM);


// ************************************************************************************************
// FBTrace Panel

function DOMPanel(){};

DOMPanel.prototype = extend(Firebug.Panel,
{
    name: "DOM",
    title: "DOM",
    
    options: {
        hasToolButtons: true
    },
    
    isInitialized: false,
    
    create: function()
    {
        Firebug.Panel.create.apply(this, arguments);
        
        this.toggles = this.toggles || {};
        this.panelNode.style.padding = "0 1px";
    },
    
    initialize: function(){
        Firebug.Panel.initialize.apply(this, arguments);
        
        /*
        var target = this.contentNode;
        var template = DirTablePlate;
        
        var panel = {};
        var toggles = {};
        
        template.tag.replace({domPanel: panel, toggles: toggles, object: window}, target);
        /**/
        
        //if (this.isInitialized) return;
        
        var target = this.contentNode;
        var template = DirTablePlate;
        
        var panel = {};
        var toggles = this.toggles;
        
        template.tableTag.replace({domPanel: panel, toggles: toggles, object: {}}, target);
        
        var row = $$("tr", target)[0];
        
        var value = Firebug.browser.window;
        var members = getMembers(value, 0);
        expandMembers(members, toggles, 0, 0);

        var rowTag = template.rowTag;
        var lastRow = row;

        var delay = 30;
        var setSize = members.length;
        var rowCount = 1;
        
        while (members.length)
        {
            with({slice: members.splice(0, insertSliceSize), isLast: !members.length})
            {
                setTimeout(function()
                {
                    if (lastRow.parentNode)
                    {
                        var result = rowTag.insertRows({members: slice}, lastRow);
                        lastRow = result[1];
                        //dispatch([Firebug.A11yModel], 'onMemberRowSliceAdded', [null, result, rowCount, setSize]);
                        rowCount += insertSliceSize;
                    }
                    if (isLast)
                        delete row.insertTimeout;
                }, delay);
            }

            delay += insertInterval;
        }

        row.insertTimeout = delay;
        
        this.isInitialized = true;
        /**/
    },
    
    reattach: function(oldChrome)
    {
        //this.isInitialized = oldChrome.getPanel("DOM").isInitialized;
        this.toggles = oldChrome.getPanel("DOM").toggles;
    }
    
});

Firebug.registerPanel(DOMPanel);


// ************************************************************************************************
// DOM Panel

function DOMPanel2(){};

DOMPanel2.prototype = extend(Firebug.Panel,
{
    name: "DOM2",
    parentPanel: "HTML",
    title: "DOM",
    
    options: {
        hasToolButtons: true
    },
    
    isInitialized: false,
    
    create: function()
    {
        Firebug.Panel.create.apply(this, arguments);
        
        this.toggles = this.toggles || {};
        this.panelNode.style.padding = "0 1px";
    },
    
    initialize: function(){
        Firebug.Panel.initialize.apply(this, arguments);
        
        /*
        var target = this.contentNode;
        var template = DirTablePlate;
        
        var panel = {};
        var toggles = {};
        
        template.tag.replace({domPanel: panel, toggles: toggles, object: window}, target);
        /**/
        
        //if (this.isInitialized) return;
        
        var target = this.contentNode;
        var template = DirTablePlate;
        
        var panel = {};
        var toggles = this.toggles;
        
        template.tableTag.replace({domPanel: panel, toggles: toggles, object: {}}, target);
        
        var row = $$("tr", target)[0];
        
        var value = Firebug.browser.window;
        var members = getMembers(value, 0);
        expandMembers(members, toggles, 0, 0);

        var rowTag = template.rowTag;
        var lastRow = row;

        var delay = 30;
        var setSize = members.length;
        var rowCount = 1;
        
        while (members.length)
        {
            with({slice: members.splice(0, insertSliceSize), isLast: !members.length})
            {
                setTimeout(function()
                {
                    if (lastRow.parentNode)
                    {
                        var result = rowTag.insertRows({members: slice}, lastRow);
                        lastRow = result[1];
                        //dispatch([Firebug.A11yModel], 'onMemberRowSliceAdded', [null, result, rowCount, setSize]);
                        rowCount += insertSliceSize;
                    }
                    if (isLast)
                        delete row.insertTimeout;
                }, delay);
            }

            delay += insertInterval;
        }

        row.insertTimeout = delay;
        
        this.isInitialized = true;
        /**/
    },
    
    reattach: function(oldChrome)
    {
        //this.isInitialized = oldChrome.getPanel("DOM").isInitialized;
        this.toggles = oldChrome.getPanel("DOM2").toggles;
    }
    
});

Firebug.registerPanel(DOMPanel2);


// ************************************************************************************************
}});