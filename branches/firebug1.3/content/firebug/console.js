FBL.ns(function() { with (FBL) {
// ************************************************************************************************


// ************************************************************************************************
// Console

extend(ConsoleAPI,
{
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
        return Console.logID;        
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
    
    old_dir: function(object)
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
        return Console.logID;
    },
    
    timeEnd: function(name)
    {
        if (name in timeMap)
        {
            var delta = (new Date()).getTime() - timeMap[name];
            logFormatted([name+ ":", delta+"ms"]);
            delete timeMap[name];
        }
        return Console.logID;
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
        return Console.logID;
    },
    
    clear: function()
    {
        consoleBody.innerHTML = "";
        return Console.logID;
    },

    open: function()
    {
        toggleConsole(true);
        return Console.logID;
    },
    
    close: function()
    {
        if (frameVisible)
            toggleConsole();
        return Console.logID;
    }
});


// ********************************************************************************************

var consoleFrame = null;
var consoleBody = null;
var commandLine = null;

var frameVisible = false;
var messageQueue = [];
var groupStack = [];
var timeMap = {};

var clPrefix = ">>> ";

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *



// ************************************************************************************************
// Console Module

var Console = Firebug.Console = inherit(ConsoleAPI,
{

    logID: "(_____FIREBUG_LOG_____)",

    
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
    



// ********************************************************************************************

function focusCommandLine()
{
    toggleConsole(true);
    if (commandLine)
        commandLine.focus();
};

function evalCommandLine()
{
    var text = commandLine.value;
    commandLine.value = "";

    logRow([clPrefix, text], "command");
    
    var value;
    try
    {
        value = eval(text);
    }
    catch (exc)
    {
    }

    console.log(value);
};

FBL.logRow = function(message, className, handler)
{
    if (consoleBody)
        writeMessage(message, className, handler);
    else
    {
        messageQueue.push([message, className, handler]);
        waitForDocument();
    }
    
    return Console.logID;
};

FBL.flush = function()
{
    var queue = messageQueue;
    messageQueue = [];
    
    for (var i = 0; i < queue.length; ++i)
        writeMessage(queue[i][0], queue[i][1], queue[i][2]);
};

FBL.writeMessage = function(message, className, handler)
{
    //var consoleFrame = consoleBodyFrame.offsetParent; 
    var consoleFrame = consoleBodyFrame; 
    var isScrolledToBottom =
        consoleFrame.scrollTop + consoleFrame.offsetHeight >= consoleFrame.scrollHeight;

    if (!handler)
        handler = writeRow;
    
    handler(message, className);
    
    if (isScrolledToBottom)
        consoleFrame.scrollTop = consoleFrame.scrollHeight - consoleFrame.offsetHeight;
};

FBL.appendRow = function(row)
{
    var container = groupStack.length ? groupStack[groupStack.length-1] : consoleBody;
    container.appendChild(row);
};

FBL.writeRow = function(message, className)
{
    var row = consoleBody.ownerDocument.createElement("div");
    row.className = "logRow" + (className ? " logRow-"+className : "");
    row.innerHTML = message.join("");
    appendRow(row);
};

FBL.pushGroup = function(message, className)
{
    logFormatted(message, className);

    var groupRow = consoleBody.ownerDocument.createElement("div");
    groupRow.className = "logGroup";
    var groupRowBox = consoleBody.ownerDocument.createElement("div");
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


// ************************************************************************************************
}});