FBL.ns(function() { with (FBL) {
// ************************************************************************************************

var Script = Firebug.Script =
{
    debugFn: function(object, fnName)
    {
        if (!debugging)
        {
            originalFn = object[fnName];
            object[fnName] = debugHandler;
        }
    }
};
 
var originalFn = null;
var debugging = false;
var debuggingFn = null;

function debugHandler()
{
    var fn = originalFn;
    var context = this;
    var args = arguments;
    
    startDebuggin(fn, context, args);
    
    
    var reFn = /function\s*([\w_$]?[\w\d_$]*)([\s\S]*)/; // [name, body]
    var reFnBody = /\s*\(([^\)]*)\)\s*\{([\s\S]*)\}/;   // [args, content]
    
    var script = fn+"";
    
    var mf = script.match(reFn);

    var fnName = mf[1];
    var fnBody = mf[2];
    
    var mb = fnBody.match(reFnBody);
    var fnArgs = mb[1];
    var fnContent = mb[2];
    
    var out = document.getElementById("out");
    
    out.innerHTML += fnContent + "<br/>";
    

    try {
        var parse = make_parse();
    
        var source = fnContent;
        tree = parse(source);
        if (tree) {
            out.innerHTML += JSON.stringify(tree, ['key', 'name', 'message',
                'value', 'arity', 'first', 'second', 'third', 'fourth'], 4) + 
                "<br/>";
        }
    
    } catch (e) {
        out.innerHTML += JSON.stringify(e, ['name', 'message', 'from', 'to', 'key',
                'value', 'arity', 'first', 'second', 'third', 'fourth'], 4) +
                "<br/>";
    }
    
    
    /*
    var commands = fnContent.split(";");
    //window.cmd = commands;
    for(var i=0, command; command=commands[i]; i++)
    {
        command = command.replace(/^\s+|\s+$/, "");
        if (command)
        {
            var s = "";
            s = "command: " + command +
                "\nresult: " + eval(commands[i]);
            
            console.log(s);
            
            alert(s); 
        }
    }
    /**/
        
    //alert("Press ok to stop debugging");
    
    
    
    endDebuggin();
};

// DEBUG

// Make a new object that inherits members from an existing object.

if (typeof Object.create !== 'function') {
    Object.create = function (o) {
        function F() {}
        F.prototype = o;
        return new F();
    };
}

// Transform a token object into an exception object and throw it.

Object.prototype.error = function (message, t) {
    t = t || this;
    t.name = "SyntaxError";
    t.message = message;
    throw t;
};


//var console = Firebug.Console;

window.s = Script;
Firebug.Script.debugHandler = debugHandler;

window.test = function()
{
    var x = 1;
    var z = this;
}

Script.debugFn(window, "test");
/**/

/*


Crockford's sample:

try {
    parse = make_parse();

// We are going to make the parse function parse itself.

    source = make_parse.toSource ?
            make_parse.toSource() : make_parse.toString();
    source = "var make_parse = " + source + ";";
    tree = parse(source);
    if (tree) {
        document.write(JSON.stringify(tree, ['key', 'name', 'message',
            'value', 'arity', 'first', 'second', 'third', 'fourth'], 4));
    }

} catch (e) {
    document.write(JSON.stringify(e, ['name', 'message', 'from', 'to', 'key',
            'value', 'arity', 'first', 'second', 'third', 'fourth'], 4));
}



*/

function startDebuggin(fn, context, args)
{
    debugging = true;
    debuggingFn = fn;
    debuggingContext = context;
};

function endDebuggin()
{
    fn = originalFn;
    
    debugging = false;
    debuggingFn = null;
    debuggingContext = null;
    originalFn = null;
};


// ************************************************************************************************
}});