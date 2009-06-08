FBL.ns(function() { with (FBL) {
// ************************************************************************************************


// ************************************************************************************************
// Console

var ConsoleAPI = 
{
    firebug: FBL.version,

    log: function()
    {
        return logFormatted(arguments, "");
    },
    
    debug: function()
    {
        return logFormatted(arguments, "debug");
    },
    
    info: function()
    {
        return logFormatted(arguments, "info");
    },
    
    warn: function()
    {
        return logFormatted(arguments, "warning");
    },
    
    error: function()
    {
        return logFormatted(arguments, "error");
    },
    
    assert: function(truth, message)
    {
        if (!truth)
        {
            var args = [];
            for (var i = 1; i < arguments.length; ++i)
                args.push(arguments[i]);
            
            logFormatted(args.length ? args : ["Assertion Failure"], "error");
            throw message ? message : "Assertion Failure";
        }
        
        return Firebug.Console.LOG_COMMAND;        
    },
    
    dir: function(object)
    {
        var html = [];
                    
        var pairs = [];
        for (var name in object)
        {
            try
            {
                pairs.push([name, object[name]]);
            }
            catch (exc)
            {
            }
        }
        
        pairs.sort(function(a, b) { return a[0] < b[0] ? -1 : 1; });
        
        html.push('<div class="log-object">');
        for (var i = 0; i < pairs.length; ++i)
        {
            var name = pairs[i][0], value = pairs[i][1];
            
            html.push('<div class="property">', 
                '<div class="propertyValueCell"><span class="propertyValue">');
                
            appendObject(value, html);
            
            html.push('</span></div><div class="propertyNameCell"><span class="propertyName">',
                escapeHTML(name), '</span></div>'); 
            
            html.push('</div>');
        }
        html.push('</div>');
        
        return logRow(html, "dir");
    },
    
    dirxml: function(node)
    {
        var html = [];
        
        appendNode(node, html);
        return logRow(html, "dirxml");
    },
    
    group: function()
    {
        return logRow(arguments, "group", pushGroup);
    },
    
    groupEnd: function()
    {
        return logRow(arguments, "", popGroup);
    },
    
    time: function(name)
    {
        timeMap[name] = (new Date()).getTime();
        return Firebug.Console.LOG_COMMAND;
    },
    
    timeEnd: function(name)
    {
        if (name in timeMap)
        {
            var delta = (new Date()).getTime() - timeMap[name];
            logFormatted([name+ ":", delta+"ms"]);
            delete timeMap[name];
        }
        return Firebug.Console.LOG_COMMAND;
    },
    
    count: function()
    {
        return this.warn(["count() not supported."]);
    },
    
    trace: function()
    {
        return this.warn(["trace() not supported."]);
    },
    
    profile: function()
    {
        return this.warn(["profile() not supported."]);
    },
    
    profileEnd: function()
    {
        return Firebug.Console.LOG_COMMAND;
    },
    
    clear: function()
    {
        fbConsole.innerHTML = "";
        return Firebug.Console.LOG_COMMAND;
    },

    open: function()
    {
        toggleConsole(true);
        return Firebug.Console.LOG_COMMAND;
    },
    
    close: function()
    {
        if (frameVisible)
            toggleConsole();
        return Firebug.Console.LOG_COMMAND;
    }
};


// ************************************************************************************************
// Console Module

var ConsoleModule = extend(Firebug.Module, ConsoleAPI);

Firebug.Console = extend(ConsoleModule,
{

    LOG_COMMAND: {},

    initialize: function(){
        fbConsole = $("fbConsole");
        fbPanel1 =  $("fbPanel1");       
    },
    
    shutdown: function()
    {
        fbConsole = null;
        fbPanel1 =  null;     
    },
    
    returnDir: function(object)
    {
        var html = [];
                    
        var pairs = [];
        for (var name in object)
        {
            try
            {
                pairs.push([name, object[name]]);
            }
            catch (exc)
            {
            }
        }
        
        pairs.sort(function(a, b) { return a[0] < b[0] ? -1 : 1; });
        
        html.push('<table>');
        for (var i = 0; i < pairs.length; ++i)
        {
            var name = pairs[i][0], value = pairs[i][1];
            
            html.push('<tr>', 
            '<td class="propertyNameCell"><span class="propertyName">',
                escapeHTML(name), '</span></td>', '<td><span class="propertyValue">');
                
            appendObject(value, html);
            html.push('</span></td></tr>');
        }
        html.push('</table>');
        
        return html;
    }
});

Firebug.registerModule(Firebug.Console);


// ************************************************************************************************
// Console Panel

var ConsolePanel = function ConsolePanel(){};

ConsolePanel.prototype = extend(Firebug.Panel,
{
    initialize: function(){
        fbConsole = $("fbConsole");
        fbPanel1 =  $("fbPanel1");       
    },
    
    shutdown: function()
    {
        fbConsole = null;
        fbPanel1 =  null;     
    }
    
});


// ********************************************************************************************

var fbConsole = null;
var fbPanel1 = null;

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

Firebug.cache.messageQueue = [];
var groupStack = [];
var timeMap = {};

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *



// ********************************************************************************************

FBL.logRow = function(message, className, handler)
{
    if (fbConsole)
        writeMessage(message, className, handler);
    else
    {
        Firebug.cache.messageQueue.push([message, className, handler]);
    }
    
    return Firebug.Console.LOG_COMMAND;
};

FBL.flush = function()
{
    var queue = Firebug.cache.messageQueue;
    Firebug.cache.messageQueue = [];
    
    for (var i = 0; i < queue.length; ++i)
        writeMessage(queue[i][0], queue[i][1], queue[i][2]);
};

FBL.writeMessage = function(message, className, handler)
{
    var isScrolledToBottom =
        fbPanel1.scrollTop + fbPanel1.offsetHeight >= fbPanel1.scrollHeight;

    if (!handler)
        handler = writeRow;
    
    handler(message, className);
    
    if (isScrolledToBottom)
        fbPanel1.scrollTop = fbPanel1.scrollHeight - fbPanel1.offsetHeight;
};

FBL.appendRow = function(row)
{
    var container = groupStack.length ? groupStack[groupStack.length-1] : fbConsole;
    container.appendChild(row);
};

FBL.writeRow = function(message, className)
{
    var row = fbConsole.ownerDocument.createElement("div");
    row.className = "logRow" + (className ? " logRow-"+className : "");
    row.innerHTML = message.join("");
    appendRow(row);
};

FBL.pushGroup = function(message, className)
{
    logFormatted(message, className);

    var groupRow = fbConsole.ownerDocument.createElement("div");
    groupRow.className = "logGroup";
    var groupRowBox = fbConsole.ownerDocument.createElement("div");
    groupRowBox.className = "logGroupBox";
    groupRow.appendChild(groupRowBox);
    appendRow(groupRowBox);
    groupStack.push(groupRowBox);
};

FBL.popGroup = function()
{
    groupStack.pop();
};

// ********************************************************************************************

FBL.logFormatted = function(objects, className)
{
    var html = [];

    var format = objects[0];
    var objIndex = 0;

    if (typeof(format) != "string")
    {
        format = "";
        objIndex = -1;
    }

    var parts = parseFormat(format);
    for (var i = 0; i < parts.length; ++i)
    {
        var part = parts[i];
        if (part && typeof(part) == "object")
        {
            var object = objects[++objIndex];
            part.appender(object, html);
        }
        else
            appendText(part, html);
    }

    for (var i = objIndex+1; i < objects.length; ++i)
    {
        appendText(" ", html);
        
        var object = objects[i];
        if (typeof(object) == "string")
            appendText(object, html);
        else
            appendObject(object, html);
    }
    
    return logRow(html, className);    
};

FBL.parseFormat = function(format)
{
    var parts = [];

    var reg = /((^%|[^\\]%)(\d+)?(\.)([a-zA-Z]))|((^%|[^\\]%)([a-zA-Z]))/;    
    var appenderMap = {s: appendText, d: appendInteger, i: appendInteger, f: appendFloat};

    for (var m = reg.exec(format); m; m = reg.exec(format))
    {
        var type = m[8] ? m[8] : m[5];
        var appender = type in appenderMap ? appenderMap[type] : appendObject;
        var precision = m[3] ? parseInt(m[3]) : (m[4] == "." ? -1 : 0);

        parts.push(format.substr(0, m[0][0] == "%" ? m.index : m.index+1));
        parts.push({appender: appender, precision: precision});

        format = format.substr(m.index+m[0].length);
    }

    parts.push(format);

    return parts;
};

FBL.objectToString = function(object)
{
    try
    {
        return object+"";
    }
    catch (exc)
    {
        return null;
    }
};

// ********************************************************************************************
FBL.onError = function(msg, href, lineNo)
{
    var html = [];
    
    var lastSlash = href.lastIndexOf("/");
    var fileName = lastSlash == -1 ? href : href.substr(lastSlash+1);
    
    html.push(
        '<span class="errorMessage">', msg, '</span>', 
        '<div class="objectBox-sourceLink">', fileName, ' (line ', lineNo, ')</div>'
    );
    
    logRow(html, "error");
};


// ********************************************************************************************
// Register console API

var alternateNS = "FB";
var consoleNS = "console";
var namespace = isFirefox ? alternateNS : consoleNS;
application.global[namespace] = ConsoleAPI;


// ************************************************************************************************
}});