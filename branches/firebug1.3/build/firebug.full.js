var FBL = {};

(function() {
// ************************************************************************************************

// ************************************************************************************************
// Namespaces

var namespaces = [];

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

this.ns = function(fn)
{
    var ns = {};
    namespaces.push(fn, ns);
    return ns;
};

this.initialize = function()
{
    //if (FBTrace.DBG_INITIALIZE) FBTrace.sysout("FBL.initialize BEGIN "+namespaces.length+" namespaces\n");

    for (var i = 0; i < namespaces.length; i += 2)
    {
        var fn = namespaces[i];
        var ns = namespaces[i+1];
        fn.apply(ns);
    }
    
    this.waitForInit();

    //if (FBTrace.DBG_INITIALIZE) FBTrace.sysout("FBL.initialize END "+namespaces.length+" namespaces\n");
};

this.waitForInit = function()
{
    if (document.body && FBL && FBL.Firebug)
      FBL.Firebug.initialize();
    else
        setTimeout(FBL.waitForInit, 200);
}


// ************************************************************************************************
// Basics

this.extend = function(l, r)
{
	r = r || {};
    var newOb = {};
    for (var n in l)
        newOb[n] = l[n];
    for (var n in r)
        newOb[n] = r[n];

    return newOb;
};


this.append = function(l, r)
{
    for (var n in r)
        l[n] = r[n];
        
    return l;
};


// ************************************************************************************************
// Browser detection

var userAgent = navigator.userAgent;
this.isFirefox = userAgent.indexOf("Firefox") != -1;
this.isIE      = userAgent.indexOf("MSIE") != -1;
this.isIE6     = /msie 6/i.test(navigator.appVersion);
this.isOpera   = userAgent.indexOf("Opera") != -1;
this.isSafari  = userAgent.indexOf("AppleWebKit") != -1;
this.isIEStantandMode = document.all && document.compatMode == "CSS1Compat";
this.isIEQuiksMode = document.all && document.compatMode == "BackCompat";


// ************************************************************************************************
// Util

var HTMLtoEntity =
{
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    "'": "&#39;",
    '"': "&quot;"
};

function replaceChars(ch)
{
    return HTMLtoEntity[ch];
};

this.escapeHTML = function(value)
{
    return (value+"").replace(/[<>&"']/g, replaceChars);
};



// ************************************************************************************************
// Empty

this.emptyFn = function(){};



//************************************************************************************************
// DOM

this.$ = function(id, doc)
{
    if (doc)
        return doc.getElementById(id);
    else
        return document.getElementById(id);
};

this.$U = function(id)
{
    if (FBL.Firebug.Chrome.document)
        return FBL.Firebug.Chrome.document.getElementById(id);
    else
        return undefined
};

// ************************************************************************************************
// Event

this.bind = function(object, fn)
{
    return function(){return fn.apply(object, arguments);};
}

this.addEvent = function(object, name, handler)
{
    if (document.all)
        object.attachEvent("on"+name, handler);
    else
        object.addEventListener(name, handler, false);
};

this.removeEvent = function(object, name, handler)
{
    if (document.all)
        object.detachEvent("on"+name, handler);
    else
        object.removeEventListener(name, handler, false);
};

this.cancelEvent = function(e, preventDefault)
{
    if (!e) return;
    
    if (preventDefault)
    {
				if (e.preventDefault)
    				e.preventDefault();
				else
		    		e.returnValue = false;
    }
    
    if (document.all)
        e.cancelBubble = true;
    else
        e.stopPropagation();
                
};


//************************************************************************************************
// class Names

this.hasClass = function(object, name) {
    return (' '+object.className+' ').indexOf(' '+name+' ') != -1;
}

this.addClass = function(object, name) {
    if ((' '+object.className+' ').indexOf(' '+name+' ') == -1)
        object.className = object.className ? object.className + ' ' + name : name; 
}

this.removeClass = function(object, name) {
    object.className = (' ' + object.className + ' ').
        replace(new RegExp('(\\S*)\\s+'+name+'\\s+(\\S*)', 'g'), '$1 $2').
        replace(/^\s*|\s*$/g, '');
}

this.toggleClass = function(object, name) {
    if ((' '+object.className+' ').indexOf(' '+name+' ') >= 0)
        this.removeClass(object, name)
    else
        this.addClass(object, name);
}


//************************************************************************************************
// Opera Tab Fix

function onOperaTabBlur(e)
{
    if (this.lastKey == 9)
      this.focus();
};

function onOperaTabKeyDown(e)
{
  this.lastKey = e.keyCode;
};

function onOperaTabFocus(e)
{
    this.lastKey = null;
};

this.fixOperaTabKey = function(el)
{
    el.onfocus = onOperaTabFocus;
    el.onblur = onOperaTabBlur;
    el.onkeydown = onOperaTabKeyDown;
};


// ************************************************************************************************
// Ajax

this.Ajax =
  {
  
    requests: [],
    transport: null,
    states: ["Uninitialized","Loading","Loaded","Interactive","Complete"],
  
    initialize: function()
    {
        this.transport = this.getXHRObject();
    },
    
    getXHRObject: function()
    {
        var xhrObj = false;
        try
        {
            xhrObj = new XMLHttpRequest();
        }
        catch(e)
        {
            var progid = [
                    "MSXML2.XMLHTTP.5.0", "MSXML2.XMLHTTP.4.0", 
                    "MSXML2.XMLHTTP.3.0", "MSXML2.XMLHTTP", "Microsoft.XMLHTTP"
                ];
              
            for ( var i=0; i < progid.length; ++i ) {
                try
                {
                    xhrObj = new ActiveXObject(progid[i]);
                }
                catch(e)
                {
                    continue;
                }
                break;
            }
        }
        finally
        {
            return xhrObj;
        }
    },
    
    
    /**
     * Realiza uma requisição ajax.
     * 
     * @name request
     * @param {Object}   options               Opções da requisição.  
     * @param {String}   options.url           URL a ser requisitada.
     * @param {String}   options.type          Tipo de requisição ("get" ou "post"). O padrão é "get".
     * @param {Boolean}  options.async         Indica se a requisição é assíncrona. O padrão é "true".   
     * @param {String}   options.dataType      Dado requisitado ("text", "html", "xml" ou "json"). O padrão é "text".
     * @param {String}   options.contentType   ContentType a ser usado. O padrão é "application/x-www-form-urlencoded".  
     * @param {Function} options.onLoading     Função a ser executada antes da requisição ser enviada.
     * @param {Function} options.onLoaded      Função a ser executada logo que a requisição for enviada.
     * @param {Function} options.onInteractive Função a ser executada durante o recebimento da requisição.
     * @param {Function} options.onComplete    Função a ser executada ao completar a requisição.
     * @param {Function} options.onUpdate      Função a ser executada após completar a requisição.
     * @param {Function} options.onSuccess     Função a ser executada ao completar a requisição com sucesso.
     * @param {Function} options.onError       Função a ser executada ao completar a requisição com erro.
     */      
    request: function(options)
    {
        var o = options || {};
    
        // Configura as opções que não foram definidas para o seu valor padrão
        o.type = o.type && o.type.toLowerCase() || "get";
        o.async = o.async || true;
        o.dataType = o.dataType || "text"; 
        o.contentType = o.contentType || "application/x-www-form-urlencoded";
    
        this.requests.push(o);
    
        var s = this.getState();
        if (s == "Uninitialized" || s == "Complete") 
            this.sendRequest();
    },
    
    serialize: function(data)
    {
        var r = [""], rl = 0;
        if (data) {
            if (typeof data == "string")  r[rl++] = data
              
            else if (data.innerHTML && data.elements) {
                for (var i=0,el,l=(el=data.elements).length; i < l; i++)
                    if (el[i].name) {
                        r[rl++] = encodeURIComponent(el[i].name); 
                        r[rl++] = "=";
                        r[rl++] = encodeURIComponent(el[i].value);
                        r[rl++] = "&";
                    }
                    
            } else 
                for(param in data) {
                    r[rl++] = encodeURIComponent(param); 
                    r[rl++] = "=";
                    r[rl++] = encodeURIComponent(data[param]);
                    r[rl++] = "&";
                }
        }
        return r.join("").replace(/&$/, "");
    },
  
    sendRequest: function()
    {
        var t = FBL.Ajax.transport, r = FBL.Ajax.requests.shift(), data;
    
        // Abre o objeto XMLHttpRequest
        t.open(r.type, r.url, r.async);
    
        //setRequestHeaders();
    
        // Registra o objeto para que o servidor saiba que é uma requisição AJAX
        t.setRequestHeader("X-Requested-With", "XMLHttpRequest");
    
        // Caso tenha sido informado algum dado
        if (data = FBL.Ajax.serialize(r.data))
          t.setRequestHeader("Content-Type", r.contentType);
    
        /** @ignore */
        // Tratamento de evento de mudança de estado
        t.onreadystatechange = function()
        { 
            FBL.Ajax.onStateChange(r); 
        }; 
    
        // Envia a requisição
        t.send(data);
    },
  
    /**
     * Função de tratamento da mudança de estado da requisição ajax.
     */     
    onStateChange: function(options)
    {
        var fn, o = options, t = this.transport;
        var state = this.getState(t); 
    
        if (fn = o["on" + state]) fn(this.getResponse(o), o);
    
        if (state == "Complete")
        {
            var success = t.status == 200, response = this.getResponse(o);
      
            if (fn = o["onUpdate"])
              fn(response, o);
      
            if (fn = o["on" + (success ? "Success" : "Failure")])
              fn(response, o);
      
            t.onreadystatechange = FBL.emptyFn;
      
            if (this.requests.length > 0) 
                setTimeout(this.sendRequest, 10);
        }
    },
  
    /**
     * Retorna a resposta de acordo com o tipo de dado requisitado.
     */  
    getResponse: function(options)
    {
        var t = this.transport, type = options.dataType;
    
        if      (t.status != 200) return t.statusText
        else if (type == "text")  return t.responseText
        else if (type == "html")  return t.responseText
        else if (type == "xml")   return t.responseXML
        else if (type == "json")  return eval("(" + t.responseText + ")");
    },
  
    /**
     * Retorna o atual estado da requisição ajax.
     */     
    getState: function()
    {
        return this.states[this.transport.readyState];
    }
  
};

this.Ajax.initialize();



// ************************************************************************************************
// Cookie, from http://www.quirksmode.org/js/cookies.html

this.createCookie = function(name,value,days)
{
    if (days) {
        var date = new Date();
        date.setTime(date.getTime()+(days*24*60*60*1000));
        var expires = "; expires="+date.toGMTString();
    }
    else var expires = "";
    document.cookie = name+"="+value+expires+"; path=/";
};

this.readCookie = function (name)
{
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++)
    {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
};

this.eraseCookie = function(name)
{
    createCookie(name,"",-1);
};



// ************************************************************************************************
// http://www.mister-pixel.com/#Content__state=is_that_simple
this.fixIE6BackgroundImageCache = function(doc)
{
    doc = doc || document;
    try {
        doc.execCommand("BackgroundImageCache", false, true);
    } catch(err) {}
};


// ************************************************************************************************
}).apply(FBL);

FBL.ns(function() { with (FBL) {
// ************************************************************************************************

FBL.version = "1.3.0a";


// ************************************************************************************************
// Firebug

FBL.Firebug = 
{
    firebuglite: FBL.version
};

// ************************************************************************************************
// APIs

FBL.ConsoleAPI = extend(FBL.Firebug);
 
FBL.ChromeAPI = extend(FBL.Firebug); 


// ************************************************************************************************
// Internal variables

FBL.cacheID = "___FBL_";
FBL.alternateNS = "console2";
FBL.consoleNS = "console";
FBL.documentCache = {};
FBL.sourceURL = null;
FBL.baseURL = null;
FBL.skinURL = null;


// ************************************************************************************************
// Internal functions

append(FBL.Firebug,  
{
    initialize: function()
    {
        this.cacheDocument();
        this.findLocation();
        this.registerPublicNamespaces();
        
        var module;
        for(var name in Firebug)
        {
            module = Firebug[name];
            if(typeof module.initialize == "function")
                module.initialize();
        }
        
        if (isIE6)
            fixIE6BackgroundImageCache();
    },
  
    cacheDocument: function()
    {
        var els = document.getElementsByTagName("*");
        for (var i=0, l=els.length, el; i<l; i++)
        {
            el = els[i];
            el[cacheID] = i;
            documentCache[i] = el;
        }
    },
    
    findLocation: function() 
    {
        var reFirebugFile = /(firebug(\.\w+)?\.js|devmode\.js)$/;
        var rePath = /^(.*\/)/;
        var reProtocol = /^\w+:\/\//;
        var head = document.documentElement.firstChild;
        var path = null;
        
        for(var i=0, c=head.childNodes, ci; ci=c[i]; i++)
        {
            if ( ci.nodeName == "SCRIPT" && 
                 reFirebugFile.test(ci.src) )
            {
              
                if (reProtocol.test(ci.src)) {
                    // absolute path
                    path = rePath.exec(ci.src)[1];
                  
                }
                else
                {
                    // relative path
                    var r = rePath.exec(ci.src);
                    var src = r ? r[1] : ci.src;
                    var rel = /^((?:\.\.\/)+)(.*)/.exec(src);
                    var lastFolder = /^(.*\/)[^\/]+\/$/;
                    path = rePath.exec(location.href)[1];
                    
                    if (rel)
                    {
                        var j = rel[1].length/3;
                        var p;
                        while (j-- > 0)
                            path = lastFolder.exec(path)[1];
  
                        path += rel[2];
                    }
                }
                
                break;
            }
        }
        
        var m = path.match(/([^\/]+)\/$/);
        
        if (path && m)
        {
            sourceURL = path;
            baseURL = path.substr(0, path.length - m[1].length - 1);
            skinURL = baseURL + "skin/classic/";
        }
        else
        {
            throw "Firebug error: Library path not found";
        }
    },
    
    registerPublicNamespaces: function()
    {
        FBL.NS = isFirefox ? FBL.alternateNS : FBL.consoleNS;
      
        window[NS] = ConsoleAPI;
        FBL.loaded = true;
    }
  
});


// ************************************************************************************************
}});

FBL.ns(function() { with (FBL) {
// ************************************************************************************************

append(FBL, {

    appendText: function(object, html)
    {
        html.push(escapeHTML(objectToString(object)));
    },
    
    appendNull: function(object, html)
    {
        html.push('<span class="objectBox-null">', escapeHTML(objectToString(object)), '</span>');
    },
    
    appendString: function(object, html)
    {
        html.push('<span class="objectBox-string">&quot;', escapeHTML(objectToString(object)),
            '&quot;</span>');
    },
    
    appendInteger: function(object, html)
    {
        html.push('<span class="objectBox-number">', escapeHTML(objectToString(object)), '</span>');
    },
    
    appendFloat: function(object, html)
    {
        html.push('<span class="objectBox-number">', escapeHTML(objectToString(object)), '</span>');
    },
    
    appendFunction: function(object, html)
    {
        var reName = /function ?(.*?)\(/;
        var m = reName.exec(objectToString(object));
        var name = m && m[1] ? m[1] : "function";
        html.push('<span class="objectBox-function">', escapeHTML(name), '()</span>');
    },
    
    appendObject: function(object, html)
    {
        try
        {
            if (object == undefined)
                appendNull("undefined", html);
            else if (object == null)
                appendNull("null", html);
            else if (typeof object == "string")
                appendString(object, html);
            else if (typeof object == "number")
                appendInteger(object, html);
            else if (typeof object == "boolean")
                appendInteger(object, html);
            else if (typeof object == "function")
                appendFunction(object, html);
            else if (object.nodeType == 1)
                appendSelector(object, html);
            else if (typeof object == "object")
            {
                if (typeof object.length != "undefined")
                    appendArray(object, html);
                else
                    appendObjectFormatted(object, html);
            }
            else
                appendText(object, html);
        }
        catch (exc)
        {
        }
    },
        
    appendObjectFormatted: function(object, html)
    {
        var text = objectToString(object);
        var reObject = /\[object (.*?)\]/;
    
        var m = reObject.exec(text);
        html.push('<span class="objectBox-object">', m ? m[1] : text, '</span>')
    },
    
    appendSelector: function(object, html)
    {
        var uid = object[cacheID];
        var uidString = uid ? [cacheID, '="', uid, '" id="', uid, '"'].join("") : "";
                        
        html.push('<span class="objectBox-selector"', uidString, '>');
    
        html.push('<span class="selectorTag">', escapeHTML(object.nodeName.toLowerCase()), '</span>');
        if (object.id)
            html.push('<span class="selectorId">#', escapeHTML(object.id), '</span>');
        if (object.className)
            html.push('<span class="selectorClass">.', escapeHTML(object.className), '</span>');
    
        html.push('</span>');
    },
    
    appendNode: function(node, html)
    {
        if (node.nodeType == 1)
        {
            var uid = node[cacheID];
            var uidString = uid ? [cacheID, '="', uid, '" id="', uid, '"'].join("") : "";                
            
            html.push(
                '<div class="objectBox-element"', uidString, '">',
                    '&lt;<span class="nodeTag">', node.nodeName.toLowerCase(), '</span>');
    
            for (var i = 0; i < node.attributes.length; ++i)
            {
                var attr = node.attributes[i];
                if (!attr.specified)
                    continue;
                
                html.push('&nbsp;<span class="nodeName">', attr.nodeName.toLowerCase(),
                    '</span>=&quot;<span class="nodeValue">', escapeHTML(attr.nodeValue),
                    '</span>&quot;')
            }
    
            if (node.firstChild)
            {
                html.push('&gt;</div><div class="nodeChildren">');
    
                for (var child = node.firstChild; child; child = child.nextSibling)
                    appendNode(child, html);
                    
                html.push('</div><div class="objectBox-element">&lt;/<span class="nodeTag">', 
                    node.nodeName.toLowerCase(), '&gt;</span></div>');
            }
            else
                html.push('/&gt;</div>');
        }
        else if (node.nodeType == 3)
        {
            html.push('<div class="nodeText">', escapeHTML(node.nodeValue),
                '</div>');
        }
    },
    
    appendArray: function(object, html)
    {
        html.push('<span class="objectBox-array"><b>[</b> ');
        
        for (var i = 0, l = object.length, obj; i < l; ++i)
        {
            appendObject(object[i], html);
            
            if (i < l-1)
            html.push(', ');
        }
    
        html.push(' <b>]</b></span>');
    }

});



/*
From firebug


    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // Reps

    registerRep: function()
    {
        reps.push.apply(reps, arguments);
    },

    setDefaultRep: function(rep)
    {
        defaultRep = rep;
    },


    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // Reps

    getRep: function(object)
    {
        var type = typeof(object);
        for (var i = 0; i < reps.length; ++i)
        {
            var rep = reps[i];
            try
            {
                if (rep.supportsObject(object, type))
                    return rep;
            }
            catch (exc)
            {
                if (FBTrace.dumpProperties)
                {
                    FBTrace.dumpProperties("firebug.getRep FAILS at i/reps.length: "+i+"/"+reps.length+" type:"+type+" exc:", exc);
                    FBTrace.dumpProperties("firebug.getRep reps[i]", reps[i]);
                    FBTrace.dumpStack("firebug.getRep");
                }
            }
        }

        return defaultRep;
    },

    getRepObject: function(node)
    {
        var target = null;
        for (var child = node; child; child = child.parentNode)
        {
            if (hasClass(child, "repTarget"))
                target = child;

            if (child.repObject)
            {
                if (!target && hasClass(child, "repIgnore"))
                    break;
                else
                    return child.repObject;
            }
        }
    },

    getRepNode: function(node)
    {
        for (var child = node; child; child = child.parentNode)
        {
            if (child.repObject)
                return child;
        }
    },

    getElementByRepObject: function(element, object)
    {
        for (var child = element.firstChild; child; child = child.nextSibling)
        {
            if (child.repObject == object)
                return child;
        }
    },
/**/


// ************************************************************************************************
}});

FBL.ns(function() { with (FBL) {
// ************************************************************************************************

/*
 * Sizzle CSS Selector Engine - v0.9
 *  Copyright 2009, John Resig (http://ejohn.org/)
 *  released under the MIT License
 */

var chunker = /((?:\((?:\([^()]+\)|[^()]+)+\)|\[(?:\[[^[\]]+\]|[^[\]]+)+\]|\\.|[^ >+~,(\[]+)+|[>+~])(\s*,\s*)?/g;

var done = 0;

var Sizzle = function(selector, context, results, seed) {
	var doCache = !results;
	results = results || [];
	context = context || document;

	if ( context.nodeType !== 1 && context.nodeType !== 9 )
		return [];
	
	if ( !selector || typeof selector !== "string" ) {
		return results;
	}

	var parts = [], m, set, checkSet, check, mode, extra;
	
	// Reset the position of the chunker regexp (start from head)
	chunker.lastIndex = 0;
	
	while ( (m = chunker.exec(selector)) !== null ) {
		parts.push( m[1] );
		
		if ( m[2] ) {
			extra = RegExp.rightContext;
			break;
		}
	}

	if ( parts.length > 1 && Expr.match.POS.exec( selector ) ) {
		if ( parts.length === 2 && Expr.relative[ parts[0] ] ) {
			var later = "", match;

			// Position selectors must be done after the filter
			while ( (match = Expr.match.POS.exec( selector )) ) {
				later += match[0];
				selector = selector.replace( Expr.match.POS, "" );
			}

			set = Sizzle.filter( later, Sizzle( selector, context ) );
		} else {
			set = Expr.relative[ parts[0] ] ?
				[ context ] :
				Sizzle( parts.shift(), context );

			while ( parts.length ) {
				var tmpSet = [];

				selector = parts.shift();
				if ( Expr.relative[ selector ] )
					selector += parts.shift();

				for ( var i = 0, l = set.length; i < l; i++ ) {
					Sizzle( selector, set[i], tmpSet );
				}

				set = tmpSet;
			}
		}
	} else {
		var ret = seed ?
			{ expr: parts.pop(), set: makeArray(seed) } :
			Sizzle.find( parts.pop(), parts.length === 1 && context.parentNode ? context.parentNode : context );
		set = Sizzle.filter( ret.expr, ret.set );

		if ( parts.length > 0 ) {
			checkSet = makeArray(set);
		}

		while ( parts.length ) {
			var cur = parts.pop(), pop = cur;

			if ( !Expr.relative[ cur ] ) {
				cur = "";
			} else {
				pop = parts.pop();
			}

			if ( pop == null ) {
				pop = context;
			}

			Expr.relative[ cur ]( checkSet, pop );
		}
	}

	if ( !checkSet ) {
		checkSet = set;
	}

	if ( !checkSet ) {
		throw "Syntax error, unrecognized expression: " + (cur || selector);
	}

	if ( checkSet instanceof Array ) {
		if ( context.nodeType === 1 ) {
			for ( var i = 0; checkSet[i] != null; i++ ) {
				if ( checkSet[i] && (checkSet[i] === true || checkSet[i].nodeType === 1 && contains(context, checkSet[i])) ) {
					results.push( set[i] );
				}
			}
		} else {
			for ( var i = 0; checkSet[i] != null; i++ ) {
				if ( checkSet[i] && checkSet[i].nodeType === 1 ) {
					results.push( set[i] );
				}
			}
		}
	} else {
		makeArray( checkSet, results );
	}

	if ( extra ) {
		Sizzle( extra, context, results );
	}

	return results;
};

Sizzle.matches = function(expr, set){
	return Sizzle(expr, null, null, set);
};

Sizzle.find = function(expr, context){
	var set, match;

	if ( !expr ) {
		return [];
	}

	var later = "", match;

	// Pseudo-selectors could contain other selectors (like :not)
	while ( (match = Expr.match.PSEUDO.exec( expr )) ) {
		var left = RegExp.leftContext;

		if ( left.substr( left.length - 1 ) !== "\\" ) {
			later += match[0];
			expr = expr.replace( Expr.match.PSEUDO, "" );
		} else {
			// TODO: Need a better solution, fails: .class\:foo:realfoo(#id)
			break;
		}
	}

	for ( var i = 0, l = Expr.order.length; i < l; i++ ) {
		var type = Expr.order[i];
		
		if ( (match = Expr.match[ type ].exec( expr )) ) {
			var left = RegExp.leftContext;

			if ( left.substr( left.length - 1 ) !== "\\" ) {
				match[1] = (match[1] || "").replace(/\\/g, "");
				set = Expr.find[ type ]( match, context );

				if ( set != null ) {
					expr = expr.replace( Expr.match[ type ], "" );
					break;
				}
			}
		}
	}

	if ( !set ) {
		set = context.getElementsByTagName("*");
	}

	expr += later;

	return {set: set, expr: expr};
};

Sizzle.filter = function(expr, set, inplace){
	var old = expr, result = [], curLoop = set, match;

	while ( expr && set.length ) {
		for ( var type in Expr.filter ) {
			if ( (match = Expr.match[ type ].exec( expr )) != null ) {
				var anyFound = false, filter = Expr.filter[ type ], goodArray = null;

				if ( curLoop == result ) {
					result = [];
				}

				if ( Expr.preFilter[ type ] ) {
					match = Expr.preFilter[ type ]( match, curLoop );

					if ( match[0] === true ) {
						goodArray = [];
						var last = null, elem;
						for ( var i = 0; (elem = curLoop[i]) !== undefined; i++ ) {
							if ( elem && last !== elem ) {
								goodArray.push( elem );
								last = elem;
							}
						}
					}

				}

				var goodPos = 0, found, item;

				for ( var i = 0; (item = curLoop[i]) !== undefined; i++ ) {
					if ( item ) {
						if ( goodArray && item != goodArray[goodPos] ) {
							goodPos++;
						}

						found = filter( item, match, goodPos, goodArray );
						if ( inplace && found != null ) {
							curLoop[i] = found ? curLoop[i] : false;
							if ( found ) {
								anyFound = true;
							}
						} else if ( found ) {
							result.push( item );
							anyFound = true;
						}
					}
				}

				if ( found !== undefined ) {
					if ( !inplace ) {
						curLoop = result;
					}

					expr = expr.replace( Expr.match[ type ], "" );

					if ( !anyFound ) {
						return [];
					}

					break;
				}
			}
		}


		expr = expr.replace(/\s*,\s*/, "");

		// Improper expression
		if ( expr == old ) {
			throw "Syntax error, unrecognized expression: " + expr;
		}

		old = expr;
	}

	return curLoop;
};

var Expr = Sizzle.selectors = {
	order: [ "ID", "NAME", "TAG" ],
	match: {
		ID: /#((?:[\w\u0128-\uFFFF_-]|\\.)+)/,
		CLASS: /\.((?:[\w\u0128-\uFFFF_-]|\\.)+)/,
		NAME: /\[name=((?:[\w\u0128-\uFFFF_-]|\\.)+)\]/,
		ATTR: /\[((?:[\w\u0128-\uFFFF_-]|\\.)+)\s*(?:(\S{0,1}=)\s*(['"]*)(.*?)\3|)\]/,
		TAG: /^((?:[\w\u0128-\uFFFF\*_-]|\\.)+)/,
		CHILD: /:(only|nth|last|first)-child\(?(even|odd|[\dn+-]*)\)?/,
		POS: /:(nth|eq|gt|lt|first|last|even|odd)\(?(\d*)\)?(?:[^-]|$)/,
		PSEUDO: /:((?:[\w\u0128-\uFFFF_-]|\\.)+)(?:\((['"]*)((?:\([^\)]+\)|[^\2\(\)]*)+)\2\))?/
	},
	attrMap: {
		"class": "className"
	},
	relative: {
		"+": function(checkSet, part){
			for ( var i = 0, l = checkSet.length; i < l; i++ ) {
				var elem = checkSet[i];
				if ( elem ) {
					var cur = elem.previousSibling;
					while ( cur && cur.nodeType !== 1 ) {
						cur = cur.previousSibling;
					}
					checkSet[i] = typeof part === "string" ?
						cur || false :
						cur === part;
				}
			}

			if ( typeof part === "string" ) {
				Sizzle.filter( part, checkSet, true );
			}
		},
		">": function(checkSet, part){
			if ( typeof part === "string" && !/\W/.test(part) ) {
				part = part.toUpperCase();

				for ( var i = 0, l = checkSet.length; i < l; i++ ) {
					var elem = checkSet[i];
					if ( elem ) {
						var parent = elem.parentNode;
						checkSet[i] = parent.nodeName === part ? parent : false;
					}
				}
			} else {
				for ( var i = 0, l = checkSet.length; i < l; i++ ) {
					var elem = checkSet[i];
					if ( elem ) {
						checkSet[i] = typeof part === "string" ?
							elem.parentNode :
							elem.parentNode === part;
					}
				}

				if ( typeof part === "string" ) {
					Sizzle.filter( part, checkSet, true );
				}
			}
		},
		"": function(checkSet, part){
			var doneName = "done" + (done++), checkFn = dirCheck;

			if ( !part.match(/\W/) ) {
				var nodeCheck = part = part.toUpperCase();
				checkFn = dirNodeCheck;
			}

			checkFn("parentNode", part, doneName, checkSet, nodeCheck);
		},
		"~": function(checkSet, part){
			var doneName = "done" + (done++), checkFn = dirCheck;

			if ( typeof part === "string" && !part.match(/\W/) ) {
				var nodeCheck = part = part.toUpperCase();
				checkFn = dirNodeCheck;
			}

			checkFn("previousSibling", part, doneName, checkSet, nodeCheck);
		}
	},
	find: {
		ID: function(match, context){
			if ( context.getElementById ) {
				var m = context.getElementById(match[1]);
				return m ? [m] : [];
			}
		},
		NAME: function(match, context){
			return context.getElementsByName(match[1]);
		},
		TAG: function(match, context){
			return context.getElementsByTagName(match[1]);
		}
	},
	preFilter: {
		CLASS: function(match){
			return new RegExp( "(?:^|\\s)" + match[1] + "(?:\\s|$)" );
		},
		ID: function(match){
			return match[1];
		},
		TAG: function(match){
			return match[1].toUpperCase();
		},
		CHILD: function(match){
			if ( match[1] == "nth" ) {
				// parse equations like 'even', 'odd', '5', '2n', '3n+2', '4n-1', '-n+6'
				var test = /(-?)(\d*)n((?:\+|-)?\d*)/.exec(
					match[2] == "even" && "2n" || match[2] == "odd" && "2n+1" ||
					!/\D/.test( match[2] ) && "0n+" + match[2] || match[2]);

				// calculate the numbers (first)n+(last) including if they are negative
				match[2] = (test[1] + (test[2] || 1)) - 0;
				match[3] = test[3] - 0;
			}

			// TODO: Move to normal caching system
			match[0] = "done" + (done++);

			return match;
		},
		ATTR: function(match){
			var name = match[1];
			
			if ( Expr.attrMap[name] ) {
				match[1] = Expr.attrMap[name];
			}

			if ( match[2] === "~=" ) {
				match[4] = " " + match[4] + " ";
			}

			return match;
		},
		PSEUDO: function(match){
			if ( match[1] === "not" ) {
				match[3] = match[3].split(/\s*,\s*/);
			}
			
			return match;
		},
		POS: function(match){
			match.unshift( true );
			return match;
		}
	},
	filters: {
		enabled: function(elem){
			return elem.disabled === false && elem.type !== "hidden";
		},
		disabled: function(elem){
			return elem.disabled === true;
		},
		checked: function(elem){
			return elem.checked === true;
		},
		selected: function(elem){
			// Accessing this property makes selected-by-default
			// options in Safari work properly
			elem.parentNode.selectedIndex;
			return elem.selected === true;
		},
		parent: function(elem){
			return !!elem.firstChild;
		},
		empty: function(elem){
			return !elem.firstChild;
		},
		has: function(elem, i, match){
			return !!Sizzle( match[3], elem ).length;
		},
		header: function(elem){
			return /h\d/i.test( elem.nodeName );
		},
		text: function(elem){
			return "text" === elem.type;
		},
		radio: function(elem){
			return "radio" === elem.type;
		},
		checkbox: function(elem){
			return "checkbox" === elem.type;
		},
		file: function(elem){
			return "file" === elem.type;
		},
		password: function(elem){
			return "password" === elem.type;
		},
		submit: function(elem){
			return "submit" === elem.type;
		},
		image: function(elem){
			return "image" === elem.type;
		},
		reset: function(elem){
			return "reset" === elem.type;
		},
		button: function(elem){
			return "button" === elem.type || elem.nodeName.toUpperCase() === "BUTTON";
		},
		input: function(elem){
			return /input|select|textarea|button/i.test(elem.nodeName);
		}
	},
	setFilters: {
		first: function(elem, i){
			return i === 0;
		},
		last: function(elem, i, match, array){
			return i === array.length - 1;
		},
		even: function(elem, i){
			return i % 2 === 0;
		},
		odd: function(elem, i){
			return i % 2 === 1;
		},
		lt: function(elem, i, match){
			return i < match[3] - 0;
		},
		gt: function(elem, i, match){
			return i > match[3] - 0;
		},
		nth: function(elem, i, match){
			return match[3] - 0 == i;
		},
		eq: function(elem, i, match){
			return match[3] - 0 == i;
		}
	},
	filter: {
		CHILD: function(elem, match){
			var type = match[1], parent = elem.parentNode;

			var doneName = match[0];
			
			if ( parent && !parent[ doneName ] ) {
				var count = 1;

				for ( var node = parent.firstChild; node; node = node.nextSibling ) {
					if ( node.nodeType == 1 ) {
						node.nodeIndex = count++;
					}
				}

				parent[ doneName ] = count - 1;
			}

			if ( type == "first" ) {
				return elem.nodeIndex == 1;
			} else if ( type == "last" ) {
				return elem.nodeIndex == parent[ doneName ];
			} else if ( type == "only" ) {
				return parent[ doneName ] == 1;
			} else if ( type == "nth" ) {
				var add = false, first = match[2], last = match[3];

				if ( first == 1 && last == 0 ) {
					return true;
				}

				if ( first == 0 ) {
					if ( elem.nodeIndex == last ) {
						add = true;
					}
				} else if ( (elem.nodeIndex - last) % first == 0 && (elem.nodeIndex - last) / first >= 0 ) {
					add = true;
				}

				return add;
			}
		},
		PSEUDO: function(elem, match, i, array){
			var name = match[1], filter = Expr.filters[ name ];

			if ( filter ) {
				return filter( elem, i, match, array )
			} else if ( name === "contains" ) {
				return (elem.textContent || elem.innerText || "").indexOf(match[3]) >= 0;
			} else if ( name === "not" ) {
				var not = match[3];

				for ( var i = 0, l = not.length; i < l; i++ ) {
					if ( Sizzle.filter(not[i], [elem]).length > 0 ) {
						return false;
					}
				}

				return true;
			}
		},
		ID: function(elem, match){
			return elem.nodeType === 1 && elem.getAttribute("id") === match;
		},
		TAG: function(elem, match){
			return (match === "*" && elem.nodeType === 1) || elem.nodeName === match;
		},
		CLASS: function(elem, match){
			return match.test( elem.className );
		},
		ATTR: function(elem, match){
			var result = elem[ match[1] ] || elem.getAttribute( match[1] ), value = result + "", type = match[2], check = match[4];
			return result == null ?
				false :
				type === "=" ?
				value === check :
				type === "*=" ?
				value.indexOf(check) >= 0 :
				type === "~=" ?
				(" " + value + " ").indexOf(check) >= 0 :
				!match[4] ?
				result :
				type === "!=" ?
				value != check :
				type === "^=" ?
				value.indexOf(check) === 0 :
				type === "$=" ?
				value.substr(value.length - check.length) === check :
				type === "|=" ?
				value === check || value.substr(0, check.length + 1) === check + "-" :
				false;
		},
		POS: function(elem, match, i, array){
			var name = match[2], filter = Expr.setFilters[ name ];

			if ( filter ) {
				return filter( elem, i, match, array );
			}
		}
	}
};

var makeArray = function(array, results) {
	array = Array.prototype.slice.call( array );

	if ( results ) {
		results.push.apply( results, array );
		return results;
	}
	
	return array;
};

// Perform a simple check to determine if the browser is capable of
// converting a NodeList to an array using builtin methods.
try {
	Array.prototype.slice.call( document.documentElement.childNodes );

// Provide a fallback method if it does not work
} catch(e){
	makeArray = function(array, results) {
		var ret = results || [];

		if ( array instanceof Array ) {
			Array.prototype.push.apply( ret, array );
		} else {
			if ( typeof array.length === "number" ) {
				for ( var i = 0, l = array.length; i < l; i++ ) {
					ret.push( array[i] );
				}
			} else {
				for ( var i = 0; array[i]; i++ ) {
					ret.push( array[i] );
				}
			}
		}

		return ret;
	};
}

// Check to see if the browser returns elements by name when
// querying by getElementById (and provide a workaround)
(function(){
	// We're going to inject a fake input element with a specified name
	var form = document.createElement("form"),
		id = "script" + (new Date).getTime();
	form.innerHTML = "<input name='" + id + "'/>";

	// Inject it into the root element, check its status, and remove it quickly
	var root = document.documentElement;
	root.insertBefore( form, root.firstChild );

	// The workaround has to do additional checks after a getElementById
	// Which slows things down for other browsers (hence the branching)
	if ( !!document.getElementById( id ) ) {
		Expr.find.ID = function(match, context){
			if ( context.getElementById ) {
				var m = context.getElementById(match[1]);
				return m ? m.id === match[1] || m.getAttributeNode && m.getAttributeNode("id").nodeValue === match[1] ? [m] : undefined : [];
			}
		};

		Expr.filter.ID = function(elem, match){
			var node = elem.getAttributeNode && elem.getAttributeNode("id");
			return elem.nodeType === 1 && node && node.nodeValue === match;
		};
	}

	root.removeChild( form );
})();

// Check to see if the browser returns only elements
// when doing getElementsByTagName("*")
(function(){
	// Create a fake element
	var div = document.createElement("div");
	div.appendChild( document.createComment("") );

	// Make sure no comments are found
	if ( div.getElementsByTagName("*").length > 0 ) {
		Expr.find.TAG = function(match, context){
			var results = context.getElementsByTagName(match[1]);

			// Filter out possible comments
			if ( match[1] === "*" ) {
				var tmp = [];

				for ( var i = 0; results[i]; i++ ) {
					if ( results[i].nodeType === 1 ) {
						tmp.push( results[i] );
					}
				}

				results = tmp;
			}

			return results;
		};
	}
})();

if ( document.querySelectorAll ) (function(){
	var oldSizzle = Sizzle;
	
	Sizzle = function(query, context, extra){
		context = context || document;

		if ( context.nodeType === 9 ) {
			try {
				return makeArray( context.querySelectorAll(query) );
			} catch(e){}
		}
		
		return oldSizzle(query, context, extra);
	};

	Sizzle.find = oldSizzle.find;
	Sizzle.filter = oldSizzle.filter;
	Sizzle.selectors = oldSizzle.selectors;
})();

if ( document.documentElement.getElementsByClassName ) {
	Expr.order.splice(1, 0, "CLASS");
	Expr.find.CLASS = function(match, context) {
		return context.getElementsByClassName(match[1]);
	};
}

function dirNodeCheck( dir, cur, doneName, checkSet, nodeCheck ) {
	for ( var i = 0, l = checkSet.length; i < l; i++ ) {
		var elem = checkSet[i];
		if ( elem ) {
			elem = elem[dir]
			var match = false;

			while ( elem && elem.nodeType ) {
				var done = elem[doneName];
				if ( done ) {
					match = checkSet[ done ];
					break;
				}

				if ( elem.nodeType === 1 )
					elem[doneName] = i;

				if ( elem.nodeName === cur ) {
					match = elem;
					break;
				}

				elem = elem[dir];
			}

			checkSet[i] = match;
		}
	}
}

function dirCheck( dir, cur, doneName, checkSet, nodeCheck ) {
	for ( var i = 0, l = checkSet.length; i < l; i++ ) {
		var elem = checkSet[i];
		if ( elem ) {
			elem = elem[dir]
			var match = false;

			while ( elem && elem.nodeType ) {
				if ( elem[doneName] ) {
					match = checkSet[ elem[doneName] ];
					break;
				}

				if ( elem.nodeType === 1 ) {
					elem[doneName] = i;

					if ( typeof cur !== "string" ) {
						if ( elem === cur ) {
							match = true;
							break;
						}

					} else if ( Sizzle.filter( cur, [elem] ).length > 0 ) {
						match = elem;
						break;
					}
				}

				elem = elem[dir];
			}

			checkSet[i] = match;
		}
	}
}

var contains = document.compareDocumentPosition ?  function(a, b){
	return a.compareDocumentPosition(b) & 16;
} : function(a, b){
	return a !== b && a.contains(b);
};

// EXPOSE

Firebug.Selector = Sizzle;

// ************************************************************************************************
}});

FBL.ns(function() { with (FBL) {
// ************************************************************************************************


// ************************************************************************************************
// Console

append(ConsoleAPI,
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

var Console = Firebug.Console = extend(ConsoleAPI,
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

FBL.ns(function() { with (FBL) {
// ************************************************************************************************

var Console = Firebug.Console;


// ************************************************************************************************
// CommandLine


Firebug.CommandLine = function(element)
{
    this.element = element;
    
    if (isOpera)
      fixOperaTabKey(this.element);
    
    this.onKeyDown = bind(this, this.onKeyDown);
    addEvent(this.element, "keydown", this.onKeyDown);
    window.onerror = this.onError;
};

Firebug.CommandLine.prototype = 
{
    element: null,
  
    _buffer: [],
    _bi: -1,
    
    _completing: null,
    _completePrefix: null,
    _completeExpr: null,
    _completeBuffer: null,
    _ci: null,
    
    _completion:
    {
        window:
        [
            "console"
        ],
        
        document:
        [
            "getElementById", 
            "getElementsByTagName"
        ]
    },
  
    _stack: function(command)
    {
        this._buffer.push(command);
        this._bi = this._buffer.length;
    },
    
    initialize: function(doc)
    {
    },
    
    destroy: function()
    {
      removeEvent(this.element, "keydown", this.onKeyDown);
      window.onerror = null;
      this.element = null
    },

    execute: function()
    {
        var cmd = this.element;
        var command = cmd.value;
        
        this._stack(command);
        writeMessage(['<span>&gt;&gt;&gt;</span> ',command], "command");
        
        try
        {
            
            var result = this.evaluate(command);
            // evita que seja repetido o log, caso o comando executado
            // j� seja um log via linha de comando
            if (result != Console.logID)
            {
                var html = [];
                appendObject(result, html)
                writeMessage(html, "command");
            }
                
        }
        catch (e)
        {
            writeMessage([e.message || e], "error");
        }
        
        cmd.value = "";
    },
    
    evaluate: function(expr)
    {
      var cmd = "(function() { with(FBL.CommandLineAPI){ return " + expr + " } }).apply(window)";
      var r;
      
      // Try executing the command, expecting that it returns a value
      try
      {
          r = this.eval(cmd);
      }
      // If syntax error happens, it may be a command (if, for, while) that
      // can't be returned by a function, so try it again without the return
      catch(E)
      {
          cmd = "(function() { with(FBL.CommandLineAPI){ " + expr + " } }).apply(window)";
          r = this.eval(cmd);
      }
      
      return r;
    },
    
    eval: new Function("return window.eval.apply(window, arguments)"),
    
    prevCommand: function()
    {
        var cmd = this.element;
        var buffer = this._buffer;
        
        if (this._bi > 0 && buffer.length > 0)
            cmd.value = buffer[--this._bi];
    },
  
    nextCommand: function()
    {
        var cmd = this.element;
        
        var buffer = this._buffer;
        var limit = buffer.length -1;
        var i = this._bi;
        
        if (i < limit)
          cmd.value = buffer[++this._bi];
          
        else if (i == limit)
        {
            ++this._bi;
            cmd.value = "";
        }
    },
  
    autocomplete: function(reverse)
    {
        var cmd = this.element;
        
        var command = cmd.value;
        var offset = getExpressionOffset(command);

        var valBegin = offset ? command.substr(0, offset) : "";
        var val = command.substr(offset);
        
        var buffer, obj, objName, commandBegin, result, prefix;
        
        // if it is the beginning of the completion
        if(!this._completing)
        {
            
            // group1 - command begin
            // group2 - base object
            // group3 - property prefix
            var reObj = /(.*[^_$\w\d\.])?((?:[_$\w][_$\w\d]*\.)*)([_$\w][_$\w\d]*)?$/;
            var r = reObj.exec(val);
            
            // parse command
            if (r[1] || r[2] || r[3])
            {
                commandBegin = r[1] || "";
                objName = r[2] || "";
                prefix = r[3] || "";
            }
            else if (val == "")
            {
                commandBegin = objName = prefix = "";
            } else
                return;
            
            this._completing = true;
      
            // find base object
            if(objName == "")
                obj = window;
              
            else
            {
                objName = objName.replace(/\.$/, "");
        
                var n = objName.split(".");
                var target = window, o;
                
                for (var i=0, ni; ni = n[i]; i++)
                {
                    if (o = target[ni])
                      target = o;
                      
                    else
                    {
                        target = null;
                        break;
                    }
                }
                obj = target;
            }
            
            // map base object
            if(obj)
            {
                this._completePrefix = prefix;
                this._completeExpr = valBegin + commandBegin + (objName ? objName + "." : "");
                this._ci = -1;
                
                buffer = this._completeBuffer = isIE ?
                    this._completion[objName || "window"] || [] : [];
                
                for(var p in obj)
                    buffer.push(p);
            }
    
        // if it is the continuation of the last completion
        } else
          buffer = this._completeBuffer;
        
        if (buffer)
        {
            prefix = this._completePrefix;
            
            var diff = reverse ? -1 : 1;
            
            for(var i=this._ci+diff, l=buffer.length, bi; i>=0 && i<l; i+=diff)
            {
                bi = buffer[i];
                
                if (bi.indexOf(prefix) == 0)
                {
                    this._ci = i;
                    result = bi;
                    break;
                }
            }
        }
        
        if (result)
            cmd.value = this._completeExpr + result;
    },
    
    onError: function(msg, href, lineNo)
    {
        var html = [];
        
        var lastSlash = href.lastIndexOf("/");
        var fileName = lastSlash == -1 ? href : href.substr(lastSlash+1);
        
        html.push(
            '<span class="errorMessage">', msg, '</span>', 
            '<div class="objectBox-sourceLink">', fileName, ' (line ', lineNo, ')</div>'
          );
        
        writeRow(html, "error");
    },
    
    clear: function()
    {
        this.element.value = "";
    },
    
    onKeyDown: function(e)
    {
        e = e || event;
        
        var code = e.keyCode;
        
        /*tab, shift, control, alt*/
        if (code != 9 && code != 16 && code != 17 && code != 18)
            this._completing = false;
    
        if (code == 13 /* enter */)
            this.execute();

        else if (code == 27 /* ESC */)
            setTimeout(this.clear, 0);
          
        else if (code == 38 /* up */)
            this.prevCommand();
          
        else if (code == 40 /* down */)
            this.nextCommand();
          
        else if (code == 9 /* tab */)
            this.autocomplete(e.shiftKey);
          
        else
            return;
        
        cancelEvent(e, true);
        return false;
    }
};

Firebug.CommandLine.API =
{
    $: function(id)
    {
        return document.getElementById(id)
    },

    $$: Firebug.Selector,
    
    dir: ConsoleAPI.dir,

    dirxml: ConsoleAPI.dirxml
}

FBL.CommandLineAPI = {};
function initializeCommandLineAPI()
{
    var api = FBL.Firebug.CommandLine.API;
    for (var m in api)
        if (!window[m])
            FBL.CommandLineAPI[m] = api[m];
}


var reOpenBracket = /[\[\(\{]/;
var reCloseBracket = /[\]\)\}]/;

function getExpressionOffset(command)
{
    // XXXjoe This is kind of a poor-man's JavaScript parser - trying
    // to find the start of the expression that the cursor is inside.
    // Not 100% fool proof, but hey...

    var bracketCount = 0;

    var start = command.length-1;
    for (; start >= 0; --start)
    {
        var c = command[start];
        if ((c == "," || c == ";" || c == " ") && !bracketCount)
            break;
        if (reOpenBracket.test(c))
        {
            if (bracketCount)
                --bracketCount;
            else
                break;
        }
        else if (reCloseBracket.test(c))
            ++bracketCount;
    }

    return start + 1;
}


// ************************************************************************************************
}});

FBL.ns(function() { with (FBL) {
// ************************************************************************************************

  
// ************************************************************************************************
// Chrome API

append(ChromeAPI,
{
    close: function()
    {
        var context = Chrome.context;
        
        if (context)
        {
            if (context.element && context.element.opener)
                context.element.close();
                
            if (context.isVisible)
                Chrome.toggle();
        }
    },
    
    detach: function()
    {
        Chrome.toggle(true, true);
    },    
    
    showTab: function(tabName)
    {
        if (tabName == 0 && tabName != selectedTab)
        {
            selectedTab = 0;
            tabL = fbConsole;
            tabLStyle = tabL.style;
            
            fbConsole.style.display = "block";
            fbHTML.style.display = "none";
            
            Chrome.document.getElementById("tc").className = "tab selectedTab";
            Chrome.document.getElementById("th").className = "tab";
            
            toggleCommandLine();
            toggleRightPanel();
            Chrome.draw();

        }
        else if (tabName == 1 && tabName != selectedTab)
        {
            selectedTab = 1;
            tabL = fbHTML;
            tabLStyle = tabL.style;
            
            fbHTML.style.display = "block";
            fbConsole.style.display = "none";

            Chrome.document.getElementById("tc").className = "tab";
            Chrome.document.getElementById("th").className = "tab selectedTab";

            toggleRightPanel();
            toggleCommandLine();
            Chrome.draw();
        }
        
    },
    
    startInspecting: function()
    {
        if (selectedTab != 1)
            this.showTab(1);
          
        Firebug.Inspector.startInspecting();
    },
    
    stopInspecting: function(el)
    {
        Firebug.Inspector.stopInspecting();
    },
    
    clear: function()
    {
        ConsoleAPI.clear();
        Chrome.draw();
    }
    
});


// ************************************************************************************************
// Chrome Module

var Chrome = Firebug.Chrome = 
{
    chromeHeight: 250,
    interfaceFile: "firebug.html",
    injectedMode: true,
    
    context: null,
    
    initialize: function()
    {
        addEvent(
            document, 
            isIE || isSafari ? "keydown" : "keypress", 
            onPressF12
        );
    },
    
    destroy: function()
    {
        if (Chrome.context == Chrome.Popup)
        {
            destroyContext(Chrome.Popup);

            var last = Chrome.Frame;
            if(last.element)
            {
                createContext(last.document, last);
                last.isVisible = false;
                frame.style.visibility = "hidden";
            }
            else
            {
              chromeReady = false;
            }
        }
        else if (Chrome.context == Chrome.Frame)
        {
            chromeReady = false;
            destroyContext(Chrome.Frame);
        }
    },
    
    toggle: function(forceOpen, popup)
    {
        if(popup)
        {
            var context = Chrome.context = this.Popup;
            
            if(chromeReady)
            {
                if(!context.element)
                {     
                    if (this.Frame.element)
                    {
                        this.Frame.isVisible = false;
                        frame.style.visibility = "hidden";
                    }
                    
                    chromeReady = false;
                    context.create();
                    waitForChrome();
                }
            }
            else
                waitForDocument();
        }
        else
        {
            // If the context is a popup, ignores the toggle process
            if (Chrome.context == Chrome.Popup) return;
            
            var context = Chrome.context = this.Frame; 
            context.isVisible = forceOpen || !context.isVisible;
            
            if(chromeReady)
            { 
                if(context.element)
                {
                    if(context.isVisible)
                    {
                        frame.style.visibility = "visible";
                        waitForChrome();
                        
                    } else {
                        frame.style.visibility = "hidden";
                    }
                }
                else
                {
                    context.create();
                    waitForChrome();
                }
                    
            }
            else
                waitForDocument();
            
        }
    },

    draw: function()
    {
        var height = frame.clientHeight;
        var cmdHeight = commandLineVisible ? fbCommandLine.offsetHeight : 0;
        var fixedHeight = topHeight + cmdHeight;
        var y = Math.max(height, topHeight);
        
        fbVSplitterStyle.height = y - 27 - cmdHeight + "px"; 
        frame.style.height = y + "px";
        fbContentStyle.height = Math.max(y - fixedHeight, 0)+ "px";

        // Fix Firefox problem with table rows with 100% height (fit height)
        if (isFirefox)
        {
            fbContentStyle.maxHeight = Math.max(y - fixedHeight, 0)+ "px";
        }
  
        var width = frame.offsetLeft + frame.clientWidth;
        var x = rightPanelVisible ? sidePanelWidth : 0;
        
        fbPanelBox1Style.width = Math.max(width - x, 0) + "px";
        fbPanel1Style.width = Math.max(width - x, 0) + "px";                
        
        if (rightPanelVisible)
        {
            fbPanelBox2Style.width = x + "px";
            fbPanelBar2BoxStyle.width = Math.max(x -1, 0) + "px";
            fbVSplitterStyle.right = Math.max(x - 6, 0) + "px";
        }
        
        // Avoid horizontal scrollbar problem in IE
        if (isIE)
        {
            var isScrolled = tabL.offsetHeight > fbPanel1.offsetHeight;
            var scrollFix = isScrolled ? 18 : 0;
            tabLStyle.width = Math.max(width -2 - scrollFix - x, 0) + "px";
        }
    },
    
    saveSettings: function()
    {
    },
    
    restoreSettings: function()
    {
    },
    
    focusCommandLine: function()
    {
        //toggleConsole(true);
        //if (commandLine)
        //    commandLine.focus();
    }    

};



// ************************************************************************************************
// Chrome Internals


//* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
// Shared variables
FBL.frame = null;
FBL.frameStyle = null;

FBL.consoleBody = null;
FBL.consoleBodyFrame = null;

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
var sidePanelWidth = 300;
var commandLineModule = null;

// Internal variables
var chromeRedrawSkipRate = isIE ? 30 : isOpera ? 50 : 0;
  
var chromeReady = false;
var selectedTab = 0; //Console

var commandLineVisible = true;
var rightPanelVisible = false;

// Internal Cache
var fbTop = null;
var fbContent = null;
var fbContentStyle = null;
var fbBottom = null;

var fbBtnInspect = null;

var fbPanelBox1 = null;
var fbPanelBox1Style = null;
var fbPanelBox2 = null;
var fbPanelBox2Style = null;
var fbPanelBar2Box = null;
var fbPanelBar2BoxStyle = null;

var fbHSplitter = null;
var fbVSplitter = null;
var fbVSplitterStyle = null;

var fbPanel1 = null;
var fbPanel1Style = null;
var fbPanel2 = null;

var fbConsole = null;
var fbConsoleStyle = null;
var fbHTML = null;

var fbCommandLine = null;

var tabL = null;
var tabLStyle = null;
var tabR = null;

//* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

var topHeight = null;

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *


// ************************************************************************************************
// Interface Loading


function waitForDocument()
{
    if (document.body && FBL && typeof FBL.loaded != "undefined")
        onDocumentLoad();
    else
        setTimeout(waitForDocument, 100);
};

function onDocumentLoad()
{
    Chrome.context.create();
    waitForChrome();
};

function waitForChrome()
{
    var f = FBL.frame;
    if (f && (Chrome.context == Chrome.Frame) && f.contentWindow &&  
        f.contentWindow.document.getElementById("fbCommandLine") || // frame loaded
        
        f && (Chrome.context == Chrome.Popup) &&  f.document && 
        f.document.getElementById("fbCommandLine")) // popup loaded
    {
        if (!chromeReady)
            onChromeReady();
    }
    else
        setTimeout(waitForChrome, 100);
};

function onChromeReady()
{
    chromeReady = true;
    
    var frame = FBL.frame;
        
    if (Chrome.context == Chrome.Frame) // frame
    {
        Chrome.document = frame.contentWindow.document;
        Chrome.window = frame.contentWindow.window;
    }
    else // popup
    {
        Chrome.document = frame.document;
        Chrome.window = frame.window;
    }
    
    // Create the global variable in the chrome window for the interface API 
    Chrome.window.FB = FBL.ChromeAPI;
    
    // Dispatch the onChromeReady event in the current context
    Chrome.context.onChromeReady(Chrome.document);
    
    // Create the new context
    createContext(Chrome.document, Chrome.context);
    
    Chrome.draw();
};


//************************************************************************************************
// Interface

function toggleCommandLine()
{
    commandLineVisible = !commandLineVisible;
    fbBottom.className = commandLineVisible ? "" : "hide";
};

function toggleRightPanel()
{
    rightPanelVisible = !rightPanelVisible;
    fbPanelBox2.className = rightPanelVisible ? "" : "hide"; 
    fbPanelBar2Box.className = rightPanelVisible ? "" : "hide";
};



// ************************************************************************************************
// Contexts


var createContext = function createContext(doc, context)
{
    fbCommandLine = $U("fbCommandLine");
    if (Firebug.CommandLine)
        commandLineModule = new Firebug.CommandLine(fbCommandLine);
        
    Chrome.context = context;
    Chrome.context.document = doc;
    Chrome.document = doc;
    
    fbTop = $U("fbTop");
    fbContent = $U("fbContent");
    fbContentStyle = fbContent.style;
    fbBottom = $U("fbBottom");
    
    fbBtnInspect = $U("fbBtnInspect");
    
    fbPanelBox1 = $U("fbPanelBox1");
    fbPanelBox1Style = fbPanelBox1.style;
    fbPanelBox2 = $U("fbPanelBox2");
    fbPanelBox2Style = fbPanelBox2.style;
    fbPanelBar2Box = $U("fbPanelBar2Box");
    fbPanelBar2BoxStyle = fbPanelBar2Box.style;
    
    fbHSplitter = $U("fbHSplitter");
    fbVSplitter = $U("fbVSplitter");
    fbVSplitterStyle = fbVSplitter.style;
    
    fbPanel1 = $U("fbPanel1");
    fbPanel1Style = fbPanel1.style;
    tabR = fbPanel2 = $U("fbPanel2");

    tabL = fbConsole = $U("fbConsole");
    tabLStyle = fbConsoleStyle = fbConsole.style;
    
    fbHTML = $U("fbHTML");

    consoleBody = fbConsole;
    consoleBodyFrame = fbPanel1;
    
    topHeight = fbTop.offsetHeight;

    fbVSplitter.onmousedown = onVSplitterMouseDown;
    fbHSplitter.onmousedown = onHSplitterMouseDown;
    
    // TODO: refactor
    selectedTab = 0; //Console
    rightPanelVisible = false;
    // TODO: refactor

    if (context == Chrome.Popup)
    {
        frame = doc.body;
        
        if (isIE)
        {
            Chrome.draw();
          
            var fbChrome = $U("fbChrome");
            fbChrome.style.position = "absolute";
            fbChrome.style.marginTop = "-1px";
        }
    }
    else
    {
        frame = document.getElementById("FirebugChrome");
        frameStyle = frame.style;
        
        // TODO: If the document body has some margin (IE default behaviour), the 
        // window won't fit correctly, so an event handler should be added
        if (isIE)
        {
          Chrome.draw();
          
          var margin = document.body.currentStyle.marginRight;
          
          if (margin == "10px")
              frameStyle.width = "102%";
          //else
          //  alert(margin + "TODO: need to add a onresize event to adjust the window width");

        }
    }
    
    var controllers = context.controllers;
    
    controllers.push([   
        Chrome.document, 
        isIE || isSafari ? "keydown" : "keypress", 
        onPressF12
    ]);
    
    if(controllers)
        for(var i=0, ci; ci=controllers[i]; i++)
            addEvent.apply(Chrome, ci);
            

    if (isOpera) Chrome.draw();

        
    // TODO: integrate code
    if(!!chromeLoad) chromeLoad(doc);
    /**/
    
};

var destroyContext = function destroyContext(context)
{
    fbCommandLine = null;
    if (Firebug.CommandLine)
        commandLineModule.destroy;
      
    chromeReady = false;
    Chrome.context.element = null;
    Chrome.frame = null;
    
    fbContent = null;
    fbTop = null;
    fbBtnInspect = null;
    fbVSplitter = null;
    fbHSplitter = null;
    fbBottom = null;
    fbPanelBox2 = null;
    
    fbPanelBox2Style = null;
    fbContentStyle = null;

    topHeight = null;
    
    var controllers = context.controllers;
    if(controllers)
        for(var i=0, ci; ci=controllers[i]; i++)
          removeEvent.apply(Chrome, ci);
};


// ************************************************************************************************
// Event Handlers


var onPressF12 = function onPressF12(event)
{
    if (event.keyCode == 123 /* F12 */ && 
        (!isFirefox && !event.shiftKey || event.shiftKey && isFirefox))
        {
            Firebug.Chrome.toggle(false, event.ctrlKey);
            cancelEvent(event, true);
        }
}


// ************************************************************************************************
// Section

function onHSplitterMouseDown(event)
{
    FBL.addEvent(document, "mousemove", onHSplitterMouseMove);
    FBL.addEvent(document, "mouseup", onHSplitterMouseUp);
  
    for (var i = 0; i < frames.length; ++i)
    {
        try
        {
            FBL.addEvent(frames[i].document, "mousemove", onHSplitterMouseMove);
            FBL.addEvent(frames[i].document, "mouseup", onHSplitterMouseUp);
        }
        catch(E)
        {
            // Avoid acess denied
        }
    }
    
    return false;
};

var lastHSplitterMouseMove = 0;

var onHSplitterMouseMove = function onHSplitterMouseMove(event)
{
    cancelEvent(event, true);
    
    if (new Date().getTime() - lastHSplitterMouseMove > chromeRedrawSkipRate)
    {
        var clientY = event.clientY;
        var win = document.all
            ? event.srcElement.ownerDocument.parentWindow
            : event.target.ownerDocument && event.target.ownerDocument.defaultView;
      
        if (!win)
            return;
        
        if (win != win.parent)
            clientY += win.frameElement ? win.frameElement.offsetTop : 0;
        
        var size = Firebug.Inspector.getWindowSize();
        
        var height = (isIE && win == top) ? height = size.height :
                      frame.offsetTop + frame.clientHeight; 
        
        var fixedHeight = topHeight + fbCommandLine.offsetHeight + 1;
        var y = Math.max(height - clientY + 7, topHeight);
            y = Math.min(y, size.height);
          
        frameStyle.height = y + "px";
        
        /*
        var t = event.srcElement || event.target;
        Firebug.Console.log(
            "event.clientY:", event.clientY,
            "y: ", y, 
            "clientY: ", clientY, 
            "  height: ", height,
            "window: ", win.FBL,
            "parent window: ", win.parent.FBL,
            "frameoff: ", win.frameElement ? win.frameElement.offsetTop : -1
            ); /**/
        
        if (isIE && Chrome.context.fixIEPosition)
          Chrome.context.fixIEPosition();
        
        Chrome.draw();
        
        lastHSplitterMouseMove = new Date().getTime();
    }
    
    return false;
};

function onHSplitterMouseUp(event)
{
    FBL.removeEvent(document, "mousemove", onHSplitterMouseMove);
    FBL.removeEvent(document, "mouseup", onHSplitterMouseUp);
  
    for (var i = 0; i < frames.length; ++i)
    {
        try
        {
            FBL.removeEvent(frames[i].document, "mousemove", onHSplitterMouseMove);
            FBL.removeEvent(frames[i].document, "mouseup", onHSplitterMouseUp);
        }
        catch(E)
        {
            // Avoid acess denied
        }
    }
    
    Chrome.draw();
};


// ************************************************************************************************
// Section

function onVSplitterMouseDown(event)
{
    FBL.addEvent(Chrome.context.document, "mousemove", onVSplitterMouseMove);
    FBL.addEvent(Chrome.context.document, "mouseup", onVSplitterMouseUp);
  
    for (var i = 0; i < frames.length; ++i)
    {
        FBL.addEvent(frames[i].document, "mousemove", onVSplitterMouseMove);
        FBL.addEvent(frames[i].document, "mouseup", onVSplitterMouseUp);
    }

    FBL.cancelEvent(event, true);
    return false; 
};


var lastVSplitterMouseMove = 0;

var onVSplitterMouseMove = function onVSplitterMouseMove(event)
{
    if (new Date().getTime() - lastVSplitterMouseMove > chromeRedrawSkipRate)
    {
        var clientX = event.clientX;
        var win = document.all
            ? event.srcElement.ownerDocument.parentWindow
            : event.target.ownerDocument.defaultView;
      
        if (win != win.parent)
            clientX += win.frameElement ? win.frameElement.offsetLeft : 0;
        
        var width = frame.offsetLeft + frame.clientWidth;
        var x = Math.max(width - clientX + 3, 7);
        
        sidePanelWidth = x;
        Chrome.draw();
        
        lastVSplitterMouseMove = new Date().getTime();
    }
    
    cancelEvent(event, true);
    return false;
};


function onVSplitterMouseUp(event)
{
    //Chrome.draw();
    FBL.removeEvent(Chrome.context.document, "mousemove", onVSplitterMouseMove);
    FBL.removeEvent(Chrome.context.document, "mouseup", onVSplitterMouseUp);
  
    for (var i = 0; i < frames.length; ++i)
    {
        FBL.removeEvent(frames[i].document, "mousemove", onVSplitterMouseMove);
        FBL.removeEvent(frames[i].document, "mouseup", onVSplitterMouseUp);
    }
};


// ************************************************************************************************
// ***  TODO:  ORGANIZE  **************************************************************************
// ************************************************************************************************
var chromeLoad = function chromeLoad(doc)
{
  
    var rootNode = document.documentElement;
    
    /* Console event handlers */
    addEvent(fbConsole, 'mousemove', onListMouseMove);
    addEvent(fbConsole, 'mouseout', onListMouseOut);
    
    fbHTML.style.display = "none";
    
    Firebug.Inspector.onChromeReady();
    
  /*
     TODO: Organize 
     
    #treeInput {
      position: absolute;
      font: 11px Monaco, monospace;
      margin: 0;
      padding: 0;
      border: 1px solid #777;
    }
    
    */
    
    var html = [];
    Firebug.HTML.appendTreeNode(rootNode, html);
    fbHTML.innerHTML = '';
    fbHTML.innerHTML = html.join('');
    fbHTML.style.padding = "4px 3px 0 15px";
    fbHTML.style.display = "none";

    var doc = Firebug.Chrome.document;
    var input = doc.createElement("input");
    input.id = "treeInput"
    input.style.cssText = "position: absolute; font: 11px Monaco, monospace; margin: 0; padding: 0; border: 1px solid #777;"
    input.style.display = "none";
    doc.body.appendChild(input);

    // HTML event handlers
    input.onblur = fbHTML.onscroll = function()
    {
        input.style.display = "none";
    };
    addEvent(fbHTML, 'click', Firebug.HTML.onTreeClick);
    addEvent(fbHTML, 'mousemove', onListMouseMove);
    addEvent(fbHTML, 'mouseout', onListMouseOut);
    /**/
    
}

function onListMouseOut(e)
{
    e = e || event || window;
    var targ;
    
    if (e.target) targ = e.target;
    else if (e.srcElement) targ = e.srcElement;
    if (targ.nodeType == 3) // defeat Safari bug
      targ = targ.parentNode;
        
      if (targ.id == "fbConsole") {
          FBL.Firebug.Inspector.hideBoxModel();
          hoverElement = null;        
      }
};
    
var hoverElement = null;
var hoverElementTS = 0;

function onListMouseMove(e)
{
    try
    {
        e = e || event || window;
        var targ;
        
        if (e.target) targ = e.target;
        else if (e.srcElement) targ = e.srcElement;
        if (targ.nodeType == 3) // defeat Safari bug
            targ = targ.parentNode;
            
        var found = false;
        while (targ && !found) {
            if (!/\sobjectBox-element\s|\sobjectBox-selector\s/.test(" " + targ.className + " "))
                targ = targ.parentNode;
            else
                found = true;
        }
        
        if (!targ)
        {
            FBL.Firebug.Inspector.hideBoxModel();
            hoverElement = null;
            return;
        }
        
        if (typeof targ.attributes[FBL.cacheID] == 'undefined') return;
        
        var uid = targ.attributes[FBL.cacheID];
        if (!uid) return;
        
        var el = FBL.documentCache[uid.value];
        
        if (el.id == "FirebugChrome") return false;  
    
        var nodeName = el.nodeName.toLowerCase();
        
    
        if (FBL.isIE && " meta title script link ".indexOf(" "+nodeName+" ") != -1)
            return;
    
        if (!/\sobjectBox-element\s|\sobjectBox-selector\s/.test(" " + targ.className + " ")) return;
        
        if (" html head body br script link ".indexOf(" "+nodeName+" ") != -1) { 
            FBL.Firebug.Inspector.hideBoxModel();
            hoverElement = null;
            return;
        }
      
        if ((new Date().getTime() - hoverElementTS > 40) && hoverElement != el) {
            hoverElementTS = new Date().getTime();
            hoverElement = el;
            FBL.Firebug.Inspector.drawBoxModel(el);
        }
    }
    catch(E)
    {
    }
}


// ************************************************************************************************
// ************************************************************************************************
// ************************************************************************************************


// ************************************************************************************************
}});

FBL.ns(function() { with (FBL) {
// ************************************************************************************************

var Chrome = Firebug.Chrome;

//----------------------------------------------------------------------------
// Frame Chrome
//----------------------------------------------------------------------------
Firebug.Chrome.Frame = 
{
    element: null,
    viewport: null,
    document: null,
    
    isVisible: false, 
    scrollHandler: null,
    
    onChromeReady: function(doc)
    {
        var context = Chrome.Frame;
        
        context.controllers = [
            [window, "resize", Chrome.draw],
            [window, "unload", Chrome.destroy]
          ];
          
        if (isIE) {
            context.controllers.push([window, "scroll", context.fixIEPosition]);
            context.controllers.push([window, "resize", context.fixIEPosition]);
            //context.controllers.push([Chrome.document, "mousewheel", function(e){FBL.cancelEvent(e, true);}]);
        }
    
        frame.style.visibility = context.isVisible ? "visible" : "hidden";    
    },

    create: function(){
    
        if (Chrome.Frame.element)
            return;
    
        var injectedMode = Chrome.injectedMode;
        
        frame = Chrome.element = Chrome.Frame.element = document.createElement("iframe");
        
        Chrome.element = Chrome.Frame.element = frame;
        frame.id = "Firebug";
        frame.setAttribute("id", "FirebugChrome");
        frame.setAttribute("frameBorder", "0");
        frame.style.visibility = "hidden";
        frame.style.zIndex = "2147483647"; // MAX z-index = 2147483647
        frame.style.position = document.all ? "absolute" : "fixed";
        frame.style.width = "100%"; // "102%"; IE auto margin bug
        frame.style.left = "0";
        frame.style.bottom = "-1px";
        frame.style.height = Chrome.chromeHeight + "px";
        
        
        if (!injectedMode)
            frame.setAttribute("src", skinURL+"firebug.html");

        document.body.appendChild(frame);
        
        if (injectedMode)
        {
            var doc = frame.contentWindow.document;
            doc.write('<style>'+ Chrome.Injected.CSS + '</style>');
            doc.write(Chrome.Injected.HTML);
            doc.close();
        }
    },
    
    
    fixIEPosition: function()
    {
        var size = Firebug.Inspector.getWindowSize();
        var scroll = Firebug.Inspector.getWindowScrollPosition();
        var maxHeight = size.height;
        var height = frame.offsetHeight;
        
        frame.style.top = maxHeight - height + scroll.top + "px";
        Chrome.draw();
        
        /*
        var maxHeight = document.body.clientHeight;
        var height = frame.offsetHeight;
        
        frame.style.top = maxHeight - height + document.body.scrollTop + "px";
        Chrome.draw();
        /**/
    }
};

// TODO: inspect
FBL.createFrame = Chrome.Frame.create;

// ************************************************************************************************
}});

FBL.ns(function() { with (FBL) {
// ************************************************************************************************

var Chrome = Firebug.Chrome;

//----------------------------------------------------------------------------
// Popup Chrome
//----------------------------------------------------------------------------
Firebug.Chrome.Popup =
{
    element: null,
    viewport: null,
    document: null,
    
    controllers: null,
    
    onChromeReady: function(doc)
    {
        if (isIE6)
            fixIE6BackgroundImageCache(doc);

        var context = Chrome.Popup;
        
        doc.body.className = "FirebugPopup";
        
        context.controllers = [
            [Chrome.window, "resize", Chrome.draw],
            [Chrome.window, "unload", Chrome.destroy]
          ];
    },

    create: function()
    {
        var injectedMode = Chrome.injectedMode;
        
        var url = injectedMode ? "" : (skinURL + Chrome.interfaceFile);
        
        var height = Chrome.chromeHeight;
        var options = [
            "true,top=",
            Math.max(screen.height - height, 0),
            ",left=0,height=",
            height,
            ",width=",
            screen.width-10, // Opera opens popup in a new tab if it's too big
            ",resizable"          
          ].join("");
        
        var popup = Chrome.Popup.element = window.open(
            url, 
            "popup", 
            options
          );
        
        if (injectedMode)
        {
            var doc = popup.document;
            doc.write("<style>"+ Chrome.Injected.CSS + "</style>");
            doc.write(Chrome.Injected.HTML);
            doc.close();
        }
        
        // TODO: inspect
        FBL.frame = popup;
        
        if (popup)
            popup.focus();
        else
        {
            Chrome.Popup.element = null;
            alert("Disable the popup blocker to open the console in another window!")
        }
    }
};


Chrome.context = Chrome.Frame;
if (document.documentElement.getAttribute("debug") == "true")
    Chrome.toggle(true);


// ************************************************************************************************
}});

FBL.ns(function() { with (FBL) {
// ************************************************************************************************

//----------------------------------------------------------------------------
// Injected Chrome
//----------------------------------------------------------------------------
Firebug.Chrome.Injected = 
{
    CSS: '.fbBtnInspectActive{background:#aaa;color:#fff !important;}html,body{margin:0;padding:0;overflow:hidden;background:#fff;font-family:Lucida Grande,Tahoma,sans-serif;font-size:11px;}.clear{clear:both;}#fbChrome{position:fixed;overflow:hidden;height:100%;width:100%;border-collapse:collapse;background:#fff;}#fbTop{height:50px;}#fbToolbar{position:absolute;z-index:5;width:100%;top:0;background:url(http://fbug.googlecode.com/svn/trunk/lite/1.3/skin/classic/sprite.png) #d4d0c8 0 0;height:28px;font-size:11px;}#fbPanelBarBox{top:28px;position:absolute;z-index:8;width:100%;background:url(http://fbug.googlecode.com/svn/trunk/lite/1.3/skin/classic/sprite.png) #c5c1ba 0 -28px;height:22px;}#fbContent{height:100%;vertical-align:top;}#fbBottom{height:18px;background:#fff;}#fbToolbarIcon{float:left;padding:6px 5px 0;}#fbToolbarIcon a{display:block;height:20px;width:20px;background:url(http://fbug.googlecode.com/svn/trunk/lite/1.3/skin/classic/sprite.png) 0 -135px;text-decoration:none;cursor:default;}#fbToolbarButtons{float:left;padding:6px 2px 0 5px;}#fbToolbarButtons span{margin:0;padding:0;}#fbToolbarButtons a{text-decoration:none;display:block;float:left;color:#000;padding:4px 8px 4px;cursor:default;}#fbToolbarButtons a:hover{color:#333;padding:3px 7px 3px;border:1px solid #fff;border-bottom:1px solid #bbb;border-right:1px solid #bbb;}#fbStatusBarBox{float:left;padding:10px 0 0;}.fbToolbarSeparator{overflow:hidden;border:1px solid;border-color:transparent #fff transparent #777;_border-color:#d4d0c8 #fff #d4d0c8 #777;height:7px;margin:2px 6px 0 0;float:left;}.fbStatusBar span{color:#808080;cursor:default;padding:0 4px 0 0;}.fbStatusBar span a{text-decoration:none;color:black;cursor:default;}.fbStatusBar span a:hover{color:blue;cursor:pointer;}#mainButtons{position:absolute;right:4px;top:8px;z-index:11;}#fbPanelBar1{width:255px; z-index:8;left:0;white-space:nowrap;background:url(http://fbug.googlecode.com/svn/trunk/lite/1.3/skin/classic/sprite.png) #c5c1ba 0 -28px;position:absolute;left:4px;}#fbPanelBar2Box{background:url(http://fbug.googlecode.com/svn/trunk/lite/1.3/skin/classic/sprite.png) #c5c1ba 0 -28px;position:absolute;height:22px;width:300px; z-index:9;right:0;}#fbPanelBar2{position:absolute;width:290px; height:22px;padding-left:10px;}#fbPanelBox1,#fbPanelBox2{max-height:inherit;height:100%;font-size:11px;}#fbPanelBox2{background:#fff;}#fbPanelBox2{width:300px;background:#fff;}* html #fbPanel1{position:absolute;}#fbPanel2{padding-left:6px;background:#fff;}.hide{overflow:hidden !important;position:fixed !important;display:none !important;visibility:hidden !important;}#fbCommand{height:18px;}#fbCommandBox{position:absolute;width:100%;height:18px;bottom:0;overflow:hidden;z-index:9;background:#fff;border:0;border-top:1px solid #ccc;}#fbCommandIcon{position:absolute;color:#00f;top:2px;left:7px;display:inline;font:11px Monaco,monospace;z-index:10;}#fbCommandLine{position:absolute;width:100%;top:0;left:0;border:0;margin:0;padding:2px 0 2px 32px;font:11px Monaco,monospace;z-index:9;}#fbBottom[fixFirefox]{position:fixed;bottom:0;left:0;width:100%;z-index:10;}#fbBottom[fixFirefox] #fbCommand{display:block;}div.fbFitHeight{padding:0 1px;max-height:inherit;height:100%;overflow:auto;}#mainButtons a{font-size:1px;width:16px;height:16px;display:block;float:left;text-decoration:none;cursor:default;}#close{background:url(http://fbug.googlecode.com/svn/trunk/lite/1.3/skin/classic/sprite.png) 0 -119px;}#close:hover{background:url(http://fbug.googlecode.com/svn/trunk/lite/1.3/skin/classic/sprite.png) -16px -119px;}#detach{background:url(http://fbug.googlecode.com/svn/trunk/lite/1.3/skin/classic/sprite.png) -32px -119px;}#detach:hover{background:url(http://fbug.googlecode.com/svn/trunk/lite/1.3/skin/classic/sprite.png) -48px -119px;}.tab{text-decoration:none;display:block;float:left;width:auto;float:left;cursor:default;font-family:Lucida Grande,Tahoma,sans-serif;font-size:11px;font-weight:bold;height:22px;color:#565656;}.fbPanelBar span{display:block;float:left;}.fbPanelBar .tabL,.fbPanelBar .tabR{height:22px;width:8px;}.fbPanelBar .tabText{padding:4px 1px 0;}.tab:hover{background:url(http://fbug.googlecode.com/svn/trunk/lite/1.3/skin/classic/sprite.png) 0 -73px;}.tab:hover .tabL{background:url(http://fbug.googlecode.com/svn/trunk/lite/1.3/skin/classic/sprite.png) -16px -96px;}.tab:hover .tabR{background:url(http://fbug.googlecode.com/svn/trunk/lite/1.3/skin/classic/sprite.png) -24px -96px;}.selectedTab{background:url(http://fbug.googlecode.com/svn/trunk/lite/1.3/skin/classic/sprite.png) #d4d0c8 0 -50px !important;color:#000;}.selectedTab .tabL{background:url(http://fbug.googlecode.com/svn/trunk/lite/1.3/skin/classic/sprite.png) 0 -96px !important;}.selectedTab .tabR{background:url(http://fbug.googlecode.com/svn/trunk/lite/1.3/skin/classic/sprite.png) -8px -96px !important;}#fbHSplitter{position:absolute;left:0;top:0;width:100%;height:5px;overflow:hidden;cursor:n-resize !important;background:url(http://fbug.googlecode.com/svn/trunk/lite/1.3/skin/classic/pixel_transparent.gif);z-index:9;}.fbVSplitter{background:#eee;color:#000;border:1px solid #777;border-width:0 1px;width:4px;cursor:e-resize;overflow:hidden;right:294px;text-decoration:none;z-index:9;position:absolute;height:100%;top:28px;}div.lineNo{font:11px Monaco,monospace;float:left;display:inline;position:relative;margin:0;padding:0 5px 0 20px;background:#eee;color:#888;border-right:1px solid #ccc;text-align:right;}pre.nodeCode{font:11px Monaco,monospace;margin:0;padding-left:10px;overflow:hidden;}.nodeControl{margin-top:3px;margin-left:-14px;float:left;width:9px;height:9px;overflow:hidden;cursor:default;background:url(http://fbug.googlecode.com/svn/trunk/lite/1.3/skin/classic/tree_open.gif);}div.nodeMaximized{background:url(http://fbug.googlecode.com/svn/trunk/lite/1.3/skin/classic/tree_close.gif);}div.objectBox-element{padding:1px 3px;}.objectBox-selector{cursor:default;}.selectedElement{background:highlight;color:#fff !important;}.selectedElement span{color:#fff !important;}@media screen and (-webkit-min-device-pixel-ratio:0){.selectedElement{background:#316AC5;color:#fff !important;}}.logRow *{font-size:11px;}.logRow{position:relative;border-bottom:1px solid #D7D7D7;padding:2px 4px 1px 6px;background-color:#FFFFFF;}.logRow-command{font-family:Monaco,monospace;color:blue;}.objectBox-string,.objectBox-text,.objectBox-number,.objectBox-function,.objectLink-element,.objectLink-textNode,.objectLink-function,.objectBox-stackTrace,.objectLink-profile{font-family:Monaco,monospace;}.objectBox-null{padding:0 2px;border:1px solid #666666;background-color:#888888;color:#FFFFFF;}.objectBox-string{color:red;white-space:pre;}.objectBox-number{color:#000088;}.objectBox-function{color:DarkGreen;}.objectBox-object{color:DarkGreen;font-weight:bold;font-family:Lucida Grande,sans-serif;}.objectBox-array{color:#000;}.logRow-info,.logRow-error,.logRow-warning{background:#fff no-repeat 2px 2px;padding-left:20px;padding-bottom:3px;}.logRow-info{background-image:url(http://fbug.googlecode.com/svn/trunk/lite/1.3/skin/classic/infoIcon.png);}.logRow-warning{background-color:cyan;background-image:url(http://fbug.googlecode.com/svn/trunk/lite/1.3/skin/classic/warningIcon.png);}.logRow-error{background-color:LightYellow;background-image:url(http://fbug.googlecode.com/svn/trunk/lite/1.3/skin/classic/errorIcon.png);color:#f00;}.errorMessage{vertical-align:top;color:#f00;}.objectBox-sourceLink{position:absolute;right:4px;top:2px;padding-left:8px;font-family:Lucida Grande,sans-serif;font-weight:bold;color:#0000FF;}.logRow-group{background:#EEEEEE;border-bottom:none;}.logGroup{background:#EEEEEE;}.logGroupBox{margin-left:24px;border-top:1px solid #D7D7D7;border-left:1px solid #D7D7D7;}.selectorTag,.selectorId,.selectorClass{font-family:Monaco,monospace;font-weight:normal;}.selectorTag{color:#0000FF;}.selectorId{color:DarkBlue;}.selectorClass{color:red;}.objectBox-element{font-family:Monaco,monospace;color:#000088;}.nodeChildren{padding-left:26px;}.nodeTag{color:blue;cursor:pointer;}.nodeValue{color:#FF0000;font-weight:normal;}.nodeText,.nodeComment{margin:0 2px;vertical-align:top;}.nodeText{color:#333333;}.nodeComment{color:DarkGreen;}.log-object{}.property{position:relative;clear:both;height:15px;}.propertyNameCell{vertical-align:top;float:left;width:28%;position:absolute;left:0;z-index:0;}.propertyValueCell{float:right;width:68%;background:#fff;position:absolute;padding-left:5px;display:table-cell;right:0;z-index:1;}.propertyName{font-weight:bold;}.FirebugPopup{height:100% !important;}.FirebugPopup #mainButtons{display:none !important;}.FirebugPopup #mainButtons{display:none !important;}.FirebugPopup #fbHSplitter{display:none !important;}.FirebugPopup #fbCommandBox{height:18px !important;}',
    HTML: '<table id="fbChrome" cellpadding="0" cellspacing="0" border="0"><tbody><tr><td id="fbTop" colspan="2"><div id="mainButtons"><a id="detach" href="javascript:FB.detach()">&nbsp;</a><a id="close" href="javascript:FB.close()">&nbsp;</a></div><div id="fbHSplitter">&nbsp;</div><div id="fbToolbar"><span id="fbToolbarIcon"><a title="Firebug Lite Homepage" href="http://getfirebug.com/lite.html">&nbsp;</a></span><span id="fbToolbarButtons"><span><a id="fbBtnInspect" href="javascript:FB.startInspecting(this)">Inspect</a></span><span id="fbConsoleButtons"><span><a href="javascript:FB.clear()">Clear</a></span></span><span id="fbHTMLButtons"><span><a href="#">Edit</a></span></span></span><span id="fbStatusBarBox"><span class="fbToolbarSeparator"></span><span id="fbHTMLStatusBar" class="fbStatusBar"><span><a href="#"><b>body</b></a></span><span>&lt;</span><span><a href="#">html</a></span></span></span></div><div id="fbPanelBarBox"><div id="fbPanelBar1" class="fbPanelBar"><a id="tc" class="tab selectedTab" href="javascript:FB.showTab(0)"><span class="tabL"></span><span class="tabText">Console</span><span class="tabR"></span></a><a id="th" class="tab" href="javascript:FB.showTab(1)"><span class="tabL"></span><span class="tabText">HTML</span><span class="tabR"></span></a><a class="tab" href="javascript:void(0)"><span class="tabL"></span><span class="tabText">CSS</span><span class="tabR"></span></a><a class="tab" href="javascript:void(0)"><span class="tabL"></span><span class="tabText">Script</span><span class="tabR"></span></a><a class="tab" href="javascript:void(0)"><span class="tabL"></span><span class="tabText">DOM</span><span class="tabR"></span></a></div><div id="fbPanelBar2Box" class="hide"><div id="fbPanelBar2" class="fbPanelBar"><a class="tab selectedTab" href="javascript:void(0);"><span class="tabL"></span><span class="tabText">Style</span><span class="tabR"></span></a><a class="tab" href="javascript:void(0)"><span class="tabL"></span><span class="tabText">Layout</span><span class="tabR"></span></a><a class="tab" href="javascript:void(0)"><span class="tabL"></span><span class="tabText">DOM</span><span class="tabR"></span></a></div></div></div></td></tr><tr id="fbContent"><td id="fbPanelBox1"><div id="fbPanel1" class="fbFitHeight"><div id="fbConsole"></div><div id="fbHTML"></div></div></td><td id="fbPanelBox2" class="hide"><div id="fbVSplitter" class="fbVSplitter">&nbsp;</div><div id="fbPanel2" class="fbFitHeight"><div id="fbHTML_Style"></div><div id="fbHTML_Layout"></div><div id="fbHTML_DOM"></div></div></td></tr><tr id="fbBottom"><td id="fbCommand" colspan="2"><div id="fbCommandBox"><div id="fbCommandIcon">&gt;&gt;&gt;</div><input id="fbCommandLine" name="fbCommandLine" type="text"/></div></td></tr></tbody></table>'
};

// ************************************************************************************************
}});


FBL.ns(function() { with (FBL) {
// ************************************************************************************************

// ************************************************************************************************

Firebug.Panel =
{
    panelNode: null,
    panelBar: null,
    commandLine: null,
    
    toolButtons: null,
    statusBar: null,

    name: "HelloWorld",
    title: "Hello World!",
    
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    
    searchable: false,
    editable: true,
    order: 2147483647,
    statusSeparator: "<",

    initialize: function(context, doc)
    {
        /*
        this.context = context;
        this.document = doc;

        this.panelNode = doc.createElement("div");
        this.panelNode.ownerPanel = this;

        setClass(this.panelNode, "panelNode panelNode-"+this.name+" contextUID="+context.uid);
        doc.body.appendChild(this.panelNode);

        if (FBTrace.DBG_INITIALIZE)
            FBTrace.sysout("firebug.initialize panelNode for "+this.name+"\n");

        this.initializeNode(this.panelNode);
        /**/
    },

    destroy: function(state) // Panel may store info on state
    {
        if (FBTrace.DBG_INITIALIZE)
            FBTrace.sysout("firebug.destroy panelNode for "+this.name+"\n");

        if (this.panelNode)
            delete this.panelNode.ownerPanel;

        this.destroyNode();
    },

    detach: function(oldChrome, newChrome)
    {
        this.lastScrollTop = this.panelNode.scrollTop;
    },

    reattach: function(doc)
    {
        this.document = doc;

        if (this.panelNode)
        {
            this.panelNode = doc.adoptNode(this.panelNode, true);
            this.panelNode.ownerPanel = this;
            doc.body.appendChild(this.panelNode);
            this.panelNode.scrollTop = this.lastScrollTop;
            delete this.lastScrollTop;
        }
    },

    // Called after module.initialize; addEventListener-s here
    initializeNode: function(myPanelNode)
    {
    },

    // removeEventListener-s here.
    destroyNode: function()
    {
    },

    show: function(state)  // persistedPanelState plus non-persisted hide() values
    {
    },

    hide: function(state)  // store info on state for next show.
    {
    },

    watchWindow: function(win)
    {
    },

    unwatchWindow: function(win)
    {
    },

    updateOption: function(name, value)
    {
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

    /**
     * Toolbar helpers
     */
    showToolbarButtons: function(buttonsId, show)
    {
        try
        {
            if (!this.context.browser) // XXXjjb this is bug. Somehow the panel context is not FirebugContext.
            {
              if (FBTrace.DBG_ERRORS)
                FBTrace.sysout("firebug.Panel showToolbarButtons this.context has no browser, this:", this)
                return;
            }
            var buttons = this.context.browser.chrome.$(buttonsId);
            if (buttons)
                collapse(buttons, show ? "false" : "true");
        }
        catch (exc)
        {
            if (FBTrace.DBG_ERRORS)
            {
                FBTrace.dumpProperties("firebug.Panel showToolbarButtons FAILS", exc);
                if (!this.context.browser)FBTrace.dumpStack("firebug.Panel showToolbarButtons no browser");
            }
        }
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

    /**
     * Returns a number indicating the view's ability to inspect the object.
     *
     * Zero means not supported, and higher numbers indicate specificity.
     */
    supportsObject: function(object)
    {
        return 0;
    },

    refresh: function()
    {

    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

    startInspecting: function()
    {
    },

    stopInspecting: function(object, cancelled)
    {
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

    search: function(text)
    {
    }

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *


};

//************************************************************************************************


//************************************************************************************************

Firebug.Module =
{
  /**
   * Called when the window is opened.
   */
  initialize: function()
  {
  },

  /**
   * Called when the window is closed.
   */
  shutdown: function()
  {

  },

  // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

  /**
   * Called when a new context is created but before the page is loaded.
   */
  initContext: function(context)
  {
  },

  /**
   * Called after a context is detached to a separate window;
   */
  reattachContext: function(browser, context)
  {
  },

  /**
   * Called when a context is destroyed. Module may store info on persistedState for reloaded pages.
   */
  destroyContext: function(context, persistedState)
  {
  },

  // Called when a FF tab is create or activated (user changes FF tab)
  // Called after context is created or with context == null (to abort?)
  showContext: function(browser, context)
  {
  },

  /**
   * Called after a context's page gets DOMContentLoaded
   */
  loadedContext: function(context)
  {
  },

  // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

  showPanel: function(browser, panel)
  {
  },

  showSidePanel: function(browser, panel)
  {
  },

  // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

  updateOption: function(name, value)
  {
  },

  getObjectByURL: function(context, url)
  {
  }
};




//************************************************************************************************
//Panel Management

Firebug.registerPanel = function()
{

};




/*



From Honza Tutorial
----------------------------------------------------
FBL.ns(function() { with (FBL) {
var panelName = "HelloWorld";
Firebug.HelloWorldModel = extend(Firebug.Module,
{
    showPanel: function(browser, panel) {
        var isHwPanel = panel && panel.name == panelName;
        var hwButtons = browser.chrome.$("fbHelloWorldButtons");
        collapse(hwButtons, !isHwPanel);
    },
    onMyButton: function(context) {
        alert("Hello World!");
    }
});

function HelloWorldPanel() {}
HelloWorldPanel.prototype = extend(Firebug.Panel,
{
    name: panelName,
    title: "Hello World!",

    initialize: function() {
        Firebug.Panel.initialize.apply(this, arguments);
    }
});

Firebug.registerModule(Firebug.HelloWorldModel);
Firebug.registerPanel(HelloWorldPanel);

}});
----------------------------------------------------



  */  
  


// ************************************************************************************************
}});

FBL.ns(function() { with (FBL) {
// ************************************************************************************************

//************************************************************************************************
// Inspector Module
Firebug.Context = function(window){
  
    this.window = window.window;
    this.document = window.document;
  
};

Firebug.Context.prototype =
{  
  
    //* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // Window Methods
    
    getWindowSize: function()
    {
        var width=0, height=0, el;
        
        if (typeof this.window.innerWidth == 'number')
        {
            width = this.window.innerWidth;
            height = this.window.innerHeight;
        }
        else if ((el=this.document.documentElement) && (el.clientHeight || el.clientWidth))
        {
            width = el.clientWidth;
            height = el.clientHeight;
        }
        else if ((el=this.document.body) && (el.clientHeight || el.clientWidth))
        {
            width = el.clientWidth;
            height = el.clientHeight;
        }
        
        return {width: width, height: height};
    },
    
    getWindowScrollSize: function()
    {
        var width=0, height=0, el;

        if (!isIEQuiksMode && (el=this.document.documentElement) && 
           (el.scrollHeight || el.scrollWidth))
        {
            width = el.scrollWidth;
            height = el.scrollHeight;
        }
        else if ((el=this.document.body) && (el.scrollHeight || el.scrollWidth))
        {
            width = el.scrollWidth;
            height = el.scrollHeight;
        }
        
        return {width: width, height: height};
    },
    
    getWindowScrollPosition: function()
    {
        var top=0, left=0, el;
        
        if(typeof this.window.pageYOffset == 'number')
        {
            top = this.window.pageYOffset;
            left = this.window.pageXOffset;
        }
        else if((el=this.document.body) && (el.scrollTop || el.scrollLeft))
        {
            top = el.scrollTop;
            left = el.scrollLeft;
        }
        else if((el=this.document.documentElement) && (el.scrollTop || el.scrollLeft))
        {
            top = el.scrollTop;
            left = el.scrollLeft;
        }
        
        return {top:top, left:left};
    },
    

    //* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // Element Methods

    getElementFromPoint: function(x, y)
    {
        if (isOpera || isSafari)
        {
            var scroll = this.getWindowScrollPosition();
            return this.document.elementFromPoint(x + scroll.left, y + scroll.top);
        }
        else
            return this.document.elementFromPoint(x, y);
    },
    
    getElementPosition: function(el)
    {
        var left = 0
        var top = 0;
        
        if (el.offsetParent)
        {
            do
            {
                left += el.offsetLeft;
                top += el.offsetTop;
            }
            while (el = el.offsetParent);
        }
        return {left:left, top:top};      
    },
    
    getElementBox: function(el)
    {
        var result = {};
        
        if (el.getBoundingClientRect)
        {
            var rect = el.getBoundingClientRect();
            
            // fix IE problem with offset when not in fullscreen mode
            var offset = isIE ? this.document.body.clientTop || this.document.documentElement.clientTop: 0;
            
            var scroll = this.getWindowScrollPosition();
            
            result.top = Math.round(rect.top - offset + scroll.top);
            result.left = Math.round(rect.left - offset + scroll.left);
            result.height = Math.round(rect.bottom - rect.top);
            result.width = Math.round(rect.right - rect.left);
        }
        else 
        {
            var position = this.getElementPosition(el);
            
            result.top = position.top;
            result.left = position.left;
            result.height = el.offsetHeight;
            result.width = el.offsetWidth;
        }
        
        return result;
    },
    

    //* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // Measurement Methods
    
    getMeasurement: function(el, name)
    {
        var result = {value: 0, unit: "px"};
        
        var cssValue = this.getCSS(el, name);
        if (!cssValue) return result;
        if (cssValue.toLowerCase() == "auto") return result;
        
        var reMeasure = /(\d+\.?\d*)(.*)/;
        var m = cssValue.match(reMeasure);
        
        if (m)
        {
            result.value = m[1]-0;
            result.unit = m[2].toLowerCase();
        }
        
        return result;        
    },
    
    getMeasurementInPixels: function(el, name)
    {
        if (!el) return null;
        
        var m = this.getMeasurement(el, name);
        var value = m.value;
        var unit = m.unit;
        
        if (unit == "px")
            return value;
          
        else if (unit == "pt")
            return this.pointsToPixels(name, value);
          
        if (unit == "em")
            return this.emToPixels(el, value);
          
        else if (unit == "%")
            return this.percentToPixels(el, value);
    },

    getMeasurementBox: function(el, name)
    {
        var sufixes = ["Top", "Left", "Bottom", "Right"];
        var result = [];
        
        for(var i=0, sufix; sufix=sufixes[i]; i++)
            result[i] = Math.round(this.getMeasurementInPixels(el, name + sufix));
        
        return {top:result[0], left:result[1], bottom:result[2], right:result[3]};
    }, 
    
    getFontSizeInPixels: function(el)
    {
        var size = this.getMeasurement(el, "fontSize");
        
        if (size.unit == "px") return size.value;
        
        // get font size, the dirty way
        var computeDirtyFontSize = function(el, calibration)
        {
            var div = this.document.createElement("div");
            var divStyle = offscreenStyle;

            if (calibration)
                divStyle +=  " font-size:"+calibration+"px;";
            
            div.style.cssText = divStyle;
            div.innerHTML = "A";
            el.appendChild(div);
            
            var value = div.offsetHeight;
            el.removeChild(div);
            return value;
        }
        
        // Calibration fails in some environments, so we're using a static value
        // based in the test case result.
        var rate = 200 / 225;
        //var calibrationBase = 200;
        //var calibrationValue = computeDirtyFontSize(el, calibrationBase);
        //var rate = calibrationBase / calibrationValue;
        
        var value = computeDirtyFontSize(el);

        return value * rate;
    },
    
    
    //* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // Unit Funtions
  
    pointsToPixels: function(name, value)
    {
        var axis = /Top$|Bottom$/.test(name) ? "y" : "x";
        
        var result = value * pixelsPerInch[axis] / 72;
        
        return returnFloat ? result : Math.round(result);
    },
    
    emToPixels: function(el, value)
    {
        if (!el) return null;
        
        var fontSize = this.getFontSizeInPixels(el);
        
        return Math.round(value * fontSize);
    },
    
    exToPixels: function(el, value)
    {
        if (!el) return null;
        
        // get ex value, the dirty way
        var div = this.document.createElement("div");
        div.style.cssText = offscreenStyle + "width:"+value + "ex;";
        
        el.appendChild(div);
        var value = div.offsetWidth;
        el.removeChild(div);
        
        return value;
    },
      
    percentToPixels: function(el, value)
    {
        if (!el) return null;
        
        // get % value, the dirty way
        var div = this.document.createElement("div");
        div.style.cssText = offscreenStyle + "width:"+value + "%;";
        
        el.appendChild(div);
        var value = div.offsetWidth;
        el.removeChild(div);
        
        return value;
    },
    
    //* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    
    getCSS: isIE ? function(el, name)
    {
        return el.currentStyle[name] || el.style[name] || undefined;
    }
    : function(el, name)
    {
        return this.document.defaultView.getComputedStyle(el,null)[name] 
            || el.style[name] || undefined;
    }

};

//************************************************************************************************
// Inspector Internals


//* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
// Shared variables

FBL.offlineFragment = null;


//* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
// Internal variables

var boxModelVisible = false;

var pixelsPerInch, boxModel, boxModelStyle, boxMargin, boxMarginStyle, 
boxPadding, boxPaddingStyle, boxContent, boxContentStyle;

//* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

var resetStyle = "margin:0; padding:0; border:0; position:absolute; overflow:hidden; display:block;";
var offscreenStyle = resetStyle + "top:-1234px; left:-1234px;";

var inspectStyle = resetStyle + "z-index: 2147483500;";
var inspectFrameStyle = resetStyle + "z-index: 2147483550; top:0; left:0; background:url(http://pedrosimonetti.googlepages.com/pixel_transparent.gif);";
//var inspectFrameStyle = resetStyle + "z-index: 2147483550; top: 0; left: 0; background: #ff0; opacity: 0.1; _filter: alpha(opacity=10);";

var inspectModelStyle = inspectStyle + "opacity:0.8; _filter:alpha(opacity=80);";
var inspectMarginStyle = inspectStyle + "background: #EDFF64; height:100%; width:100%;";
var inspectPaddingStyle = inspectStyle + "background: SlateBlue;";
var inspectContentStyle = inspectStyle + "background: SkyBlue;";


var outlineStyle = { 
    fbHorizontalLine: "background: #3875D7; height: 2px;",
    fbVerticalLine: "background: #3875D7; width: 2px;"
}

//* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

var lastInspecting = 0;
var fbInspectFrame = null;
var fbBtnInspect = null;


//* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

var outlineVisible = false;
var outlineElements = {};
var outline = {
  "fbOutlineT": "fbHorizontalLine",
  "fbOutlineL": "fbVerticalLine",
  "fbOutlineB": "fbHorizontalLine",
  "fbOutlineR": "fbVerticalLine"
};


//************************************************************************************************
// Measurement Functions

var calculatePixelsPerInch = function calculatePixelsPerInch()
{
    var inch = this.document.createElement("div");
    inch.style.cssText = resetStyle + "width:1in; height:1in; position:absolute; top:-1234px; left:-1234px;";
    this.document.body.appendChild(inch);
    
    pixelsPerInch = {
        x: inch.offsetWidth,
        y: inch.offsetHeight
    };
    
    this.document.body.removeChild(inch);
};




//************************************************************************************************
// Section




// ************************************************************************************************
}});

FBL.ns(function() { with (FBL) {
// ************************************************************************************************

//************************************************************************************************
// Inspector Module

Firebug.Inspector =
{  
  
    initialize: function()
    {
        offlineFragment = document.createDocumentFragment();
        
        calculatePixelsPerInch();
        createBoxModelInspector();
        createOutlineInspector();
    },
    
    onChromeReady: function()
    {
        fbBtnInspect = $U("fbBtnInspect");
    },    
  
    //* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // Inspect functions
    
    startInspecting: function()
    {
        createInspectorFrame();
        
        var size = this.getWindowScrollSize();
        
        fbInspectFrame.style.width = size.width + "px";
        fbInspectFrame.style.height = size.height + "px";

        fbBtnInspect.href = "javascript:FB.stopInspecting(this)";
        fbBtnInspect.className = "fbBtnInspectActive";
        
        addEvent(fbInspectFrame, "mousemove", Firebug.Inspector.onInspecting)
        addEvent(fbInspectFrame, "mousedown", Firebug.Inspector.onInspectingClick)
    },
    
    stopInspecting: function()
    {
        destroyInspectorFrame();
        
        fbBtnInspect.href = "javascript:FB.startInspecting(this)";
        fbBtnInspect.className = "";
        
        if (outlineVisible) this.hideOutline();
        removeEvent(fbInspectFrame, "mousemove", Firebug.Inspector.onInspecting)
        removeEvent(fbInspectFrame, "mousedown", Firebug.Inspector.onInspectingClick)
    },
    
    
    onInspectingClick: function(e)
    {
        fbInspectFrame.style.display = "none";    
        var targ = Firebug.Inspector.getElementFromPoint(e.clientX, e.clientY);
        fbInspectFrame.style.display = "block";    

        // Avoid inspecting the outline, and the FirebugChrome
        var id = targ.id;
        if (id && /^fbOutline\w$/.test(id)) return;
        if (id == "FirebugChrome") return;

        // Avoid looking at text nodes in Opera
        while (targ.nodeType != 1) targ = targ.parentNode;
        
        //Firebug.Console.log(targ);
        Firebug.Inspector.stopInspecting();
    },
    
    onInspecting: function(e)
    {
        if (new Date().getTime() - lastInspecting > 30)
        {
            fbInspectFrame.style.display = "none";
            var targ = Firebug.Inspector.getElementFromPoint(e.clientX, e.clientY);
            fbInspectFrame.style.display = "block";    
    
            // Avoid inspecting the outline, and the FirebugChrome
            var id = targ.id;
            if (id && /^fbOutline\w$/.test(id)) return;
            if (id == "FirebugChrome") return;
            
            // Avoid looking at text nodes in Opera
            while (targ.nodeType != 1) targ = targ.parentNode;
    
            if (targ.nodeName.toLowerCase() == "body") return;
    
            //Firebug.Console.log(e.clientX, e.clientY, targ);
            Firebug.Inspector.drawOutline(targ);
            
            if (targ[cacheID])
                FBL.Firebug.HTML.selectTreeNode(""+targ[cacheID])
            
            lastInspecting = new Date().getTime();
        }
    },
    
    //* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // Inspector Outline
    
    drawOutline: function(el)
    {
        if (!outlineVisible) this.showOutline();
        
        var box = this.getElementBox(el);
        
        var top = box.top;
        var left = box.left;
        var height = box.height;
        var width = box.width;
        
        var border = 2;
        var o = outlineElements;
        
        o.fbOutlineT.style.top = top-border + "px";
        o.fbOutlineT.style.left = left + "px";
        o.fbOutlineT.style.width = width + "px";
  
        o.fbOutlineB.style.top = top+height + "px";
        o.fbOutlineB.style.left = left + "px";
        o.fbOutlineB.style.width = width + "px";
        
        o.fbOutlineL.style.top = top-border + "px";
        o.fbOutlineL.style.left = left-border + "px";
        o.fbOutlineL.style.height = height+2*border + "px";

        o.fbOutlineR.style.top = top-border + "px";
        o.fbOutlineR.style.left = left+width + "px";
        o.fbOutlineR.style.height = height+2*border + "px";
    },
    
    hideOutline: function()
    {
        if (!outlineVisible) return;
        
        for (var name in outline)
            offlineFragment.appendChild(outlineElements[name]);

        outlineVisible = false;
    },
    
    showOutline: function()
    {
        if (outlineVisible) return;
        
        for (var name in outline)
            document.body.appendChild(outlineElements[name]);
        
        outlineVisible = true;
    },
  
    //* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // Box Model
    
    drawBoxModel: function(el)
    {
        if (!boxModelVisible) this.showBoxModel();
        
        var box = this.getElementBox(el);
        
        var top = box.top;
        var left = box.left;
        var height = box.height;
        var width = box.width;
        
        var margin = this.getMeasurementBox(el, "margin");
        var padding = this.getMeasurementBox(el, "padding");

        boxModelStyle.top = top - margin.top + "px";
        boxModelStyle.left = left - margin.left + "px";
        boxModelStyle.height = height + margin.top + margin.bottom + "px";
        boxModelStyle.width = width + margin.left + margin.right + "px";
      
        boxPaddingStyle.top = margin.top + "px";
        boxPaddingStyle.left = margin.left + "px";
        boxPaddingStyle.height = height + "px";
        boxPaddingStyle.width = width + "px";
      
        boxContentStyle.top = margin.top + padding.top + "px";
        boxContentStyle.left = margin.left + padding.left + "px";
        boxContentStyle.height = height - padding.top - padding.bottom + "px";
        boxContentStyle.width = width - padding.left - padding.right + "px";
    },
  
    hideBoxModel: function()
    {  
        offlineFragment.appendChild(boxModel);
        boxModelVisible = false;
    },
    
    showBoxModel: function()
    {
        document.body.appendChild(boxModel);
        boxModelVisible = true;
    },
     
    //* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // Measurement Funtions
    
    getMeasurement: function(el, name)
    {
        var result = {value: 0, unit: "px"};
        
        var cssValue = this.getCSS(el, name);
        if (!cssValue) return result;
        if (cssValue.toLowerCase() == "auto") return result;
        
        var reMeasure = /(\d+\.?\d*)(.*)/;
        var m = cssValue.match(reMeasure);
        
        if (m)
        {
            result.value = m[1]-0;
            result.unit = m[2].toLowerCase();
        }
        
        return result;        
    },
    
    getMeasurementInPixels: function(el, name)
    {
        if (!el) return null;
        
        var m = this.getMeasurement(el, name);
        var value = m.value;
        var unit = m.unit;
        
        if (unit == "px")
            return value;
          
        else if (unit == "pt")
            return this.pointsToPixels(name, value);
          
        if (unit == "em")
            return this.emToPixels(el, value);
          
        else if (unit == "%")
            return this.percentToPixels(el, value);
    },

    getElementPosition: function(el)
    {
        var left = 0
        var top = 0;
        
        if (el.offsetParent)
        {
            do
            {
                left += el.offsetLeft;
                top += el.offsetTop;
            }
            while (el = el.offsetParent);
        }
        return {left:left, top:top};      
    },
    
    getWindowSize: function()
    {
        var width=0, height=0, el;
        
        if (typeof window.innerWidth == 'number')
        {
            width = window.innerWidth;
            height = window.innerHeight;
        }
        else if ((el=document.documentElement) && (el.clientHeight || el.clientWidth))
        {
            width = el.clientWidth;
            height = el.clientHeight;
        }
        else if ((el=document.body) && (el.clientHeight || el.clientWidth))
        {
            width = el.clientWidth;
            height = el.clientHeight;
        }
        
        return {width: width, height: height};
    },
    
    getWindowScrollSize: function()
    {
        var width=0, height=0, el;

        if (!isIEQuiksMode && (el=document.documentElement) && 
           (el.scrollHeight || el.scrollWidth))
        {
            width = el.scrollWidth;
            height = el.scrollHeight;
        }
        else if ((el=document.body) && (el.scrollHeight || el.scrollWidth))
        {
            width = el.scrollWidth;
            height = el.scrollHeight;
        }
        
        return {width: width, height: height};
    },
    
    getWindowScrollPosition: function()
    {
        var top=0, left=0, el;
        
        if(typeof window.pageYOffset == 'number')
        {
            top = window.pageYOffset;
            left = window.pageXOffset;
        }
        else if((el=document.body) && (el.scrollTop || el.scrollLeft))
        {
            top = el.scrollTop;
            left = el.scrollLeft;
        }
        else if((el=document.documentElement) && (el.scrollTop || el.scrollLeft))
        {
            top = el.scrollTop;
            left = el.scrollLeft;
        }
        
        return {top:top, left:left};
    },
    
    getElementBox: function(el)
    {
        var result = {};
        
        if (el.getBoundingClientRect)
        {
            var rect = el.getBoundingClientRect();
            
            // fix IE problem with offset when not in fullscreen mode
            var offset = isIE ? document.body.clientTop || document.documentElement.clientTop: 0;
            
            var scroll = this.getWindowScrollPosition();
            
            result.top = Math.round(rect.top - offset + scroll.top);
            result.left = Math.round(rect.left - offset + scroll.left);
            result.height = Math.round(rect.bottom - rect.top);
            result.width = Math.round(rect.right - rect.left);
        }
        else 
        {
            var position = this.getElementPosition(el);
            
            result.top = position.top;
            result.left = position.left;
            result.height = el.offsetHeight;
            result.width = el.offsetWidth;
        }
        
        return result;
    },
    
    getElementFromPoint: function(x, y)
    {
        if (isOpera || isSafari)
        {
            var scroll = this.getWindowScrollPosition();
            return document.elementFromPoint(x + scroll.left, y + scroll.top);
        }
        else
            return document.elementFromPoint(x, y);
    },
    
    getMeasurementBox: function(el, name)
    {
        var sufixes = ["Top", "Left", "Bottom", "Right"];
        var result = [];
        
        for(var i=0, sufix; sufix=sufixes[i]; i++)
            result[i] = Math.round(this.getMeasurementInPixels(el, name + sufix));
        
        return {top:result[0], left:result[1], bottom:result[2], right:result[3]};
    }, 
    
    getFontSizeInPixels: function(el)
    {
        var size = this.getMeasurement(el, "fontSize");
        
        if (size.unit == "px") return size.value;
        
        // get font size, the dirty way
        var computeDirtyFontSize = function(el, calibration)
        {
            var div = document.createElement("div");
            var divStyle = offscreenStyle;

            if (calibration)
                divStyle +=  " font-size:"+calibration+"px;";
            
            div.style.cssText = divStyle;
            div.innerHTML = "A";
            el.appendChild(div);
            
            var value = div.offsetHeight;
            el.removeChild(div);
            return value;
        }
        
        // Calibration fails in some environments, so we're using a static value
        // based in the test case result.
        var rate = 200 / 225;
        //var calibrationBase = 200;
        //var calibrationValue = computeDirtyFontSize(el, calibrationBase);
        //var rate = calibrationBase / calibrationValue;
        
        var value = computeDirtyFontSize(el);

        return value * rate;
    },
    
    
    //* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // Unit Funtions
  
    pointsToPixels: function(name, value)
    {
        var axis = /Top$|Bottom$/.test(name) ? "y" : "x";
        
        var result = value * pixelsPerInch[axis] / 72;
        
        return returnFloat ? result : Math.round(result);
    },
    
    emToPixels: function(el, value)
    {
        if (!el) return null;
        
        var fontSize = this.getFontSizeInPixels(el);
        
        return Math.round(value * fontSize);
    },
    
    exToPixels: function(el, value)
    {
        if (!el) return null;
        
        // get ex value, the dirty way
        var div = document.createElement("div");
        div.style.cssText = offscreenStyle + "width:"+value + "ex;";
        
        el.appendChild(div);
        var value = div.offsetWidth;
        el.removeChild(div);
        
        return value;
    },
      
    percentToPixels: function(el, value)
    {
        if (!el) return null;
        
        // get % value, the dirty way
        var div = document.createElement("div");
        div.style.cssText = offscreenStyle + "width:"+value + "%;";
        
        el.appendChild(div);
        var value = div.offsetWidth;
        el.removeChild(div);
        
        return value;
    },
    
    //* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    
    getCSS: isIE ? function(el, name)
    {
        return el.currentStyle[name] || el.style[name] || undefined;
    }
    : function(el, name)
    {
        return document.defaultView.getComputedStyle(el,null)[name] 
            || el.style[name] || undefined;
    }

};

//************************************************************************************************
// Inspector Internals


//* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
// Shared variables

FBL.offlineFragment = null;


//* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
// Internal variables

var boxModelVisible = false;

var pixelsPerInch, boxModel, boxModelStyle, boxMargin, boxMarginStyle, 
boxPadding, boxPaddingStyle, boxContent, boxContentStyle;

//* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

var resetStyle = "margin:0; padding:0; border:0; position:absolute; overflow:hidden; display:block;";
var offscreenStyle = resetStyle + "top:-1234px; left:-1234px;";

var inspectStyle = resetStyle + "z-index: 2147483500;";
var inspectFrameStyle = resetStyle + "z-index: 2147483550; top:0; left:0; background:url(http://pedrosimonetti.googlepages.com/pixel_transparent.gif);";
//var inspectFrameStyle = resetStyle + "z-index: 2147483550; top: 0; left: 0; background: #ff0; opacity: 0.1; _filter: alpha(opacity=10);";

var inspectModelStyle = inspectStyle + "opacity:0.8; _filter:alpha(opacity=80);";
var inspectMarginStyle = inspectStyle + "background: #EDFF64; height:100%; width:100%;";
var inspectPaddingStyle = inspectStyle + "background: SlateBlue;";
var inspectContentStyle = inspectStyle + "background: SkyBlue;";


var outlineStyle = { 
    fbHorizontalLine: "background: #3875D7; height: 2px;",
    fbVerticalLine: "background: #3875D7; width: 2px;"
}

//* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

var lastInspecting = 0;
var fbInspectFrame = null;
var fbBtnInspect = null;


//* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

var outlineVisible = false;
var outlineElements = {};
var outline = {
  "fbOutlineT": "fbHorizontalLine",
  "fbOutlineL": "fbVerticalLine",
  "fbOutlineB": "fbHorizontalLine",
  "fbOutlineR": "fbVerticalLine"
};


//************************************************************************************************
// Measurement Functions

var calculatePixelsPerInch = function calculatePixelsPerInch()
{
    var inch = document.createElement("div");
    inch.style.cssText = resetStyle + "width:1in; height:1in; position:absolute; top:-1234px; left:-1234px;";
    document.body.appendChild(inch);
    
    pixelsPerInch = {
        x: inch.offsetWidth,
        y: inch.offsetHeight
    };
    
    document.body.removeChild(inch);
};


//************************************************************************************************
// Section

var createInspectorFrame = function createInspectorFrame()
{
    fbInspectFrame = document.createElement("div");
    fbInspectFrame.id = "fbInspectFrame";
    fbInspectFrame.style.cssText = inspectFrameStyle;
    document.body.appendChild(fbInspectFrame);
}

var destroyInspectorFrame = function createInspectorFrame()
{
    document.body.removeChild(fbInspectFrame);
}

var createOutlineInspector = function createOutlineInspector()
{
    for (var name in outline)
    {
        var el = outlineElements[name] = document.createElement("div");
        el.id = name;
        el.style.cssText = inspectStyle + outlineStyle[outline[name]];
        offlineFragment.appendChild(el);
    }
};

var createBoxModelInspector = function createBoxModelInspector()
{
    boxModel = document.createElement("div");
    boxModel.id = "fbBoxModel";
    boxModelStyle = boxModel.style;
    boxModelStyle.cssText = inspectModelStyle;
    
    boxMargin = document.createElement("div");
    boxMargin.id = "fbBoxMargin";
    boxMarginStyle = boxMargin.style;
    boxMarginStyle.cssText = inspectMarginStyle;
    boxModel.appendChild(boxMargin);
    
    boxPadding = document.createElement("div");
    boxPadding.id = "fbBoxPadding";
    boxPaddingStyle = boxPadding.style;
    boxPaddingStyle.cssText = inspectPaddingStyle;
    boxModel.appendChild(boxPadding);
    
    boxContent = document.createElement("div");
    boxContent.id = "fbBoxContent";
    boxContentStyle = boxContent.style;
    boxContentStyle.cssText = inspectContentStyle;
    boxModel.appendChild(boxContent);
    
    offlineFragment.appendChild(boxModel);
};



//************************************************************************************************
// Section




// ************************************************************************************************
}});

FBL.ns(function() { with (FBL) {
// ************************************************************************************************


/*============================================================================
  html
*===========================================================================*/
Firebug.HTML =
{

    appendTreeNode: function(nodeArray, html)
    {
        var reTrim = /^\s+|\s+$/g;
      
        if (!nodeArray.length) nodeArray = [nodeArray];
        
        for (var n=0, node; node=nodeArray[n]; n++)
        {
        
            if (node.nodeType == 1)
            {
              
                var uid = node[cacheID];
                var child = node.childNodes;
                var childLength = child.length;
                var hasSingleTextChild = childLength == 1 && node.firstChild.nodeType == 3;
                
                var nodeName = node.nodeName.toLowerCase();
                
                var nodeControl = !hasSingleTextChild && childLength > 0 ? 
                    ('<div class="nodeControl"></div>') : '';

                
                if(isIE && nodeControl)
                  html.push(nodeControl);
              
                if (typeof uid != 'undefined')
                    html.push(
                        '<div class="objectBox-element" ',
                        cacheID, '="', uid,
                        '" id="', uid,                                                                                        
                        '">',
                        !isIE && nodeControl ? nodeControl: "",                        
                        '&lt;<span class="nodeTag">', nodeName, '</span>'
                      );
                else
                    html.push(
                        '<div class="objectBox-element">&lt;<span class="nodeTag">', 
                        nodeName, '</span>'
                      );
            
                for (var i = 0; i < node.attributes.length; ++i)
                {
                    var attr = node.attributes[i];
                    if (!attr.specified || attr.nodeName == cacheID)
                        continue;
                    
                    html.push('&nbsp;<span class="nodeName">', attr.nodeName.toLowerCase(),
                        '</span>=&quot;<span class="nodeValue">', escapeHTML(attr.nodeValue),
                        '</span>&quot;')
                }
            

                /*
                // source code nodes
                if (nodeName == 'script' || nodeName == 'style')
                {
                  
                    if(document.all){
                        var src = node.innerHTML+'\n';
                       
                    }else {
                        var src = '\n'+node.innerHTML+'\n';
                    }
                    
                    var match = src.match(/\n/g);
                    var num = match ? match.length : 0;
                    var s = [], sl = 0;
                    
                    for(var c=1; c<num; c++){
                        s[sl++] = '<div line="'+c+'">' + c + '</div>';
                    }
                    
                    html.push('&gt;</div><div class="nodeGroup"><div class="nodeChildren"><div class="lineNo">',
                            s.join(''),
                            '</div><pre class="nodeCode">',
                            escapeHTML(src),
                            '</pre>',
                            '</div><div class="objectBox-element">&lt;/<span class="nodeTag">',
                            nodeName,
                            '</span>&gt;</div>',
                            '</div>'
                        );
                      
                
                }/**/
                
                
                // Just a single text node child
                if (hasSingleTextChild)
                {
                    var value = child[0].nodeValue.replace(reTrim, '');
                    if(value)
                    {
                        html.push(
                                '&gt;<span class="nodeText">',
                                escapeHTML(value),
                                '</span>&lt;/<span class="nodeTag">',
                                nodeName,
                                '</span>&gt;</div>'
                            );
                    }
                    else
                      html.push('/&gt;</div>'); // blank text, print as childless node
                
                }
                else if (childLength > 0)
                {
                    html.push('&gt;</div>');
                }
                else 
                    html.push('/&gt;</div>');
          
            } 
            else if (node.nodeType == 3)
            {
                var value = node.nodeValue.replace(reTrim, '');
                if (value)
                    html.push('<div class="nodeText">', escapeHTML(value),
                        '</div>');
            }
          
        }
    },
    
    appendTreeChildren: function(treeNode)
    {
        var doc = Firebug.Chrome.document;
        
        var uid = treeNode.attributes[cacheID].value;
        var parentNode = documentCache[uid];
        
        if (parentNode.childNodes.length == 0) return;
        
        var treeNext = treeNode.nextSibling;
        var treeParent = treeNode.parentNode;
        
        var control = isIE ? treeNode.previousSibling : treeNode.firstChild;
        control.className = 'nodeControl nodeMaximized';
        
        var html = [];
        var children = doc.createElement("div");
        children.className = "nodeChildren";
        this.appendTreeNode(parentNode.childNodes, html);
        children.innerHTML = html.join("");
        
        treeParent.insertBefore(children, treeNext);
        
        var closeElement = doc.createElement("div");
        closeElement.className = "objectBox-element";
        closeElement.innerHTML = '&lt;/<span class="nodeTag">' + 
            parentNode.nodeName.toLowerCase() + '&gt;</span>'
        
        treeParent.insertBefore(closeElement, treeNext);
        
    },
    
    removeTreeChildren: function(treeNode)
    {
        var children = treeNode.nextSibling;
        var closeTag = children.nextSibling;
        
        var control = isIE ? treeNode.previousSibling : treeNode.firstChild;
        control.className = 'nodeControl';
        
        children.parentNode.removeChild(children);  
        closeTag.parentNode.removeChild(closeTag);  
    },
    
    isTreeNodeVisible: function(id)
    {
        return $U(id);
    },
    
    selectTreeNode: function(id)
    {
        id = ""+id;
        var node, stack = [];
        while(id && !this.isTreeNodeVisible(id))
        {
            stack.push(id);
            
            var node = documentCache[id].parentNode;

            if (node && typeof node[cacheID] != "undefined")
                id = ""+node[cacheID];
            else
                break;
        }
        
        stack.push(id);
        
        while(stack.length > 0)
        {
            id = stack.pop();
            node = $U(id);
            
            if (stack.length > 0 && documentCache[id].childNodes.length > 0)
              this.appendTreeChildren(node);
        }
        
        selectElement(node);
        
        consoleBodyFrame.scrollTop = Math.round(node.offsetTop - consoleBodyFrame.clientHeight/2);
    }
    
}

var selectedElement = null
function selectElement(e)
{
    if (e != selectedElement)
    {
        if (selectedElement)
            selectedElement.className = "objectBox-element";
            
        
        e.className = e.className + " selectedElement";

        if (FBL.isFirefox)
            e.style.MozBorderRadius = "2px";
        
        else if (FBL.isSafari)
            e.style.WebkitBorderRadius = "2px";
        
        selectedElement = e;
    }
}

// TODO : Refactor
Firebug.HTML.onTreeClick = function (e)
{
    e = e || event;
    var targ;
    
    if (e.target) targ = e.target;
    else if (e.srcElement) targ = e.srcElement;
    if (targ.nodeType == 3) // defeat Safari bug
        targ = targ.parentNode;
        
    
    if (targ.className.indexOf('nodeControl') != -1 || targ.className == 'nodeTag')
    {
        if(targ.className == 'nodeTag')
        {
            var control = FBL.isIE ? (targ.parentNode.previousSibling || targ) :
                          (targ.previousSibling.previousSibling || targ);

            selectElement(targ.parentNode);
            
            if (control.className.indexOf('nodeControl') == -1)
                return;
            
        } else
            control = targ;
        
        FBL.cancelEvent(e);
        
        var treeNode = FBL.isIE ? control.nextSibling : control.parentNode;
        
        //FBL.Firebug.Console.log(treeNode);
        
        if (control.className.indexOf(' nodeMaximized') != -1) {
            FBL.Firebug.HTML.removeTreeChildren(treeNode);
        } else {
            FBL.Firebug.HTML.appendTreeChildren(treeNode);
        }
    }
    else if (targ.className == 'nodeValue' || targ.className == 'nodeName')
    {
        var input = FBL.Firebug.Chrome.document.getElementById('treeInput');
        
        input.style.display = "block";
        input.style.left = targ.offsetLeft + 'px';
        input.style.top = FBL.topHeight + targ.offsetTop - FBL.fbPanel1.scrollTop + 'px';
        input.style.width = targ.offsetWidth + 6 + 'px';
        input.value = targ.textContent || targ.innerText;
        input.focus(); 
    }
}

// ************************************************************************************************
}});

FBL.initialize();
FBL.Firebug.Chrome.toggle(true);