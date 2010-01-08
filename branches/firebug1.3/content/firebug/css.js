/* See license.txt for terms of usage */

FBL.ns(function() { with (FBL) {
// ************************************************************************************************

// ************************************************************************************************
// CSS Module

Firebug.CSS = extend(Firebug.Module, 
{
    getPanel: function()
    {
        return Firebug.chrome ? Firebug.chrome.getPanel("CSS") : null;
    },
    
    renderStyleSheet: function(index)
    {
        var panel = this.getPanel();
        
        if (panel.lastStyleSheetIndex != index)
        {
            var str = renderStyleSheet(index);
            
            panel.contentNode.innerHTML = str.join("");
            
            // IE needs this timeout, otherwise the panel won't scroll
            setTimeout(function(){
                panel.synchronizeUI();
            },0);
            
            panel.styleSheetIndex = index;
            panel.lastStyleSheetIndex = index;
        }
    }
});

Firebug.registerModule(Firebug.CSS);


// ************************************************************************************************
// CSS Panel

function CSSStyleSheetPanel(){};

CSSStyleSheetPanel.prototype = extend(Firebug.Panel,
{
    name: "CSS",
    title: "CSS",
    
    styleSheetIndex: 0,
    lastStyleSheetIndex: -1,
    
    options: {
        hasToolButtons: true
    },

    create: function()
    {
        Firebug.Panel.create.apply(this, arguments);
        
        this.onChangeSelect = bind(this.onChangeSelect, this);
        
        var doc = Firebug.browser.document;
        var styleSheets = doc.styleSheets;
        var selectNode = this.selectNode = createElement("select");
        
        for(var i=0, length=styleSheets.length; i<length; i++)
        {
            var styleSheet = styleSheets[i];
            var fileName = getFileName(styleSheet.href) || getFileName(doc.location.href);
            var option = createElement("option", {value:i});
            
            option.appendChild(Firebug.chrome.document.createTextNode(fileName));
            selectNode.appendChild(option);
        };
        
        this.toolButtonsNode.appendChild(selectNode);
    },
    
    initialize: function()
    {
        Firebug.Panel.initialize.apply(this, arguments);
        
        addEvent(this.selectNode, "change", this.onChangeSelect);
        
        this.selectStyleSheet(this.styleSheetIndex);
    },
    
    detach: function(oldChrome, newChrome)
    {
        Firebug.Panel.detach.apply(this, arguments);
        
        var oldPanel = oldChrome.getPanel("CSS");
        var index = oldPanel.styleSheetIndex;
        
        this.selectNode.selectedIndex = index;
        this.styleSheetIndex = index;
        this.lastStyleSheetIndex = -1;
    },
    
    onChangeSelect: function(event)
    {
        event = event || window.event;
        var target = event.srcElement || event.currentTarget;
        var index = target.selectedIndex;
        
        Firebug.CSS.renderStyleSheet(index);
    },
    
    selectStyleSheet: function(index)
    {
        this.selectNode.selectedIndex = index;
        Firebug.CSS.renderStyleSheet(index);
    }    
});

Firebug.registerPanel(CSSStyleSheetPanel);


// ************************************************************************************************
// CSS Panel

function CSSElementPanel(){};

CSSElementPanel.prototype = extend(Firebug.Panel,
{
    name: "CSSElementPanel",
    parentPanel: "HTML",
    title: "CSS",
    
    options: {
        hasToolButtons: true
    },

    create: function()
    {
        Firebug.Panel.create.apply(this, arguments);
        
        var style = this.contentNode.style;
        style.padding = "4px 8px";
        style.fontFamily = "Monaco,monospace";        
    },
    
    initialize: function()
    {
        Firebug.Panel.initialize.apply(this, arguments);
        
        var target = documentCache[FirebugChrome.selectedHTMLElementId];
        if (!target) return;
        
        var str = renderStyles(target);
        
        var panel = this;
        panel.contentNode.innerHTML = str.join("");
        panel.containerNode.scrollTop = 0;
    },
    
    select: function(node)
    {
        var str = renderStyles(node);
        
        var panel = this;
        panel.contentNode.innerHTML = str.join("");
        panel.containerNode.scrollTop = 0;        
    }
});

//Firebug.registerPanel(CSSElementPanel);

// ************************************************************************************************


// ************************************************************************************************
// CSS Panel

function CSSEditPanel(){};

CSSEditPanel.prototype = extend(Firebug.Panel,
{
    name: "CSSEditPanel",
    parentPanel: "HTML",
    title: "Style",
    
    options: {
        hasToolButtons: true
    },

    create: function()
    {
        Firebug.Panel.create.apply(this, arguments);
        
        var style = this.contentNode.style;
        style.margin = "0";
        //style.padding = "4px 8px";
        style.fontFamily = "Monaco,monospace";        
        
        var doc = Firebug.chrome.document;
        
        var el = doc.createElement("pre");
        el.innerHTML = "element.style {";
        el.style.margin = "4px 0 0";
        el.style.padding = "0 0 1px 8px";
        this.contentNode.appendChild(el);
        
        var el = doc.createElement("textarea");
        el.rows = 1;
        el.style.width = "80%";
        //el.style.height = "100%";
        //el.style.position = "absolute";
        el.style.fontSize = "11px";
        el.style.resize = "none";
        el.style.overflow = "hidden";
        el.style.outline = "0";
        el.style.border = "0";
        el.style.padding = "0";
        el.style.margin = "0 10%";
        el.style.color = "darkblue";
        
        this.contentNode.appendChild(el);
        
        this.editNode = el;
        
        var el = doc.createElement("pre");
        el.innerHTML = "}";
        el.style.margin = "0";
        el.style.padding = "0 0 10px 8px";
        this.contentNode.appendChild(el);
        
        var el = doc.createElement("div");
        el.innerHTML = "Computed Styles";
        el.style.background = "#eee url(group.gif)";
        el.style.fontWeight = "bold";
        el.style.margin = "0 0 4px";
        el.style.padding = "2px 5px";
        el.style.border = "1px solid #ccc";
        el.style.borderWidth = "1px 0";
        this.contentNode.appendChild(el);
        
        var el = doc.createElement("div");
        this.computedStylesNode = this.contentNode.appendChild(el);
        
        this.onKeyUp = bind(this.onKeyUp, this);
        this.onKeyDown = bind(this.onKeyDown, this);
        
        addEvent(this.editNode, "keydown", this.onKeyDown);
        addEvent(this.editNode, "keyup", this.onKeyUp);
        
    },
    
    initialize: function()
    {
        Firebug.Panel.initialize.apply(this, arguments);
        
        var target = documentCache[FirebugChrome.selectedHTMLElementId];
        if (!target) return;
        
        var str = renderStyles2(target);
        this.editNode.value = str;
        
        var str2 = renderStyles(target);
        this.computedStylesNode.innerHTML = str2.join("");
        
        this.adjustEditSize();
        /*
        var panel = this;
        panel.contentNode.innerHTML = str.join("");
        panel.containerNode.scrollTop = 0;
        /**/
    },
    
    select: function(node)
    {
        var str = renderStyles2(node);
        this.editNode.value = str;
        this.adjustEditSize();
        /*
        var panel = this;
        panel.contentNode.innerHTML = str.join("");
        panel.containerNode.scrollTop = 0;
        /**/        
    },
    
    adjustEditSize: function(add)
    {
        add = add || 0;
        var nodeValue = this.editNode.value + " ";
        nodeValue = nodeValue.replace(/\n\r|\r\n/g, "\n");
        var lines = nodeValue.split(/\n/)
        var num = lines.length + add
        this.editNode.rows = num;
    },
    
    onKeyDown: function(event)
    {
        if (event.keyCode == 13 /* enter */)
        {
            this.adjustEditSize(1);
        }
        
    },
    
    onKeyUp: function()
    {
        var nodeValue = this.editNode.value;
        
        var selectedElement = documentCache[FirebugChrome.selectedHTMLElementId];
        
        try
        {
            selectedElement.style.cssText = nodeValue;
        }
        catch(e)
        {
        }
        
        this.adjustEditSize();
        
        /*
        var lines = nodeValue.split(/[\n\r]/);
        
        var reValue = /\s*([\w-]+):\s*(.*)/;
        
        for (var i=0, length=lines.length; i<length; i++)
        {
            var line = lines[i];
            var value = line.match(reValue);
            
            if (value)
            {
                alert(value[1]);
            }
        }
        /**/
        
        //Firebug.Console.log("jhi");
    }
});

Firebug.registerPanel(CSSEditPanel);


// ************************************************************************************************

var renderStyleSheet = function renderStyleSheet(index)
{
    var styleSheet = Firebug.browser.document.styleSheets[index],
        str = [], 
        sl = -1;
    
    try
    {
        var rules = styleSheet[isIE ? "rules" : "cssRules"];
        
        for (var i=0, rule; rule = rules[i]; i++)
        {
            var selector = rule.selectorText;
            var cssText = isIE ? 
                    rule.style.cssText :
                    rule.cssText.match(/\{(.*)\}/)[1];
            
            str[++sl] = renderRule(selector, cssText.split(";"));
        }
    }
    catch(e)
    {
        str[++sl] = "<em>Access to restricted URI denied</em>";
    }
    
    return str;
};

var renderRule = function renderRule(selector, styles)
{
    var str = "<div class='Selector'>"+ selector.toLowerCase()+ " {</div>";
    
    for(var i=0, len=styles.length; i<len; i++)
    {
        var rule = styles[i];
        str += rule.replace(/(.+)\:(.+)/, renderRuleReplacer);
    }
    
    str += "<div class='SelectorEnd'>}</div>";
    return str;
};

var renderRuleReplacer = function renderRuleReplacer(m, g1, g2)
{
    return "<div class='CSSText'><span class='CSSProperty'>" +
        g1.toLowerCase() +
        ": </span><span class='CSSValue'>" +
        g2.replace(/\s*$/, "") +
        ";</span></div>"; 
};

var getFileName = function getFileName(path)
{
    if (!path) return "";
    
    var match = path && path.match(/[^\/]+(\?.*)?(#.*)?$/);
    
    return match && match[0] || path;
};

// ************************************************************************************************

var renderStyles = function renderStyles(node)
{
    var property = ["opacity","filter","azimuth","background","backgroundAttachment","backgroundColor","backgroundImage","backgroundPosition","backgroundRepeat","border","borderCollapse","borderColor","borderSpacing","borderStyle","borderTop","borderRight","borderBottom","borderLeft","borderTopColor","borderRightColor","borderBottomColor","borderLeftColor","borderTopStyle","borderRightStyle","borderBottomStyle","borderLeftStyle","borderTopWidth","borderRightWidth","borderBottomWidth","borderLeftWidth","borderWidth","bottom","captionSide","clear","clip","color","content","counterIncrement","counterReset","cue","cueAfter","cueBefore","cursor","direction","display","elevation","emptyCells","cssFloat","font","fontFamily","fontSize","fontSizeAdjust","fontStretch","fontStyle","fontVariant","fontWeight","height","left","letterSpacing","lineHeight","listStyle","listStyleImage","listStylePosition","listStyleType","margin","marginTop","marginRight","marginBottom","marginLeft","markerOffset","marks","maxHeight","maxWidth","minHeight","minWidth","orphans","outline","outlineColor","outlineStyle","outlineWidth","overflow","padding","paddingTop","paddingRight","paddingBottom","paddingLeft","page","pageBreakAfter","pageBreakBefore","pageBreakInside","pause","pauseAfter","pauseBefore","pitch","pitchRange","playDuring","position","quotes","richness","right","size","speak","speakHeader","speakNumeral","speakPunctuation","speechRate","stress","tableLayout","textAlign","textDecoration","textIndent","textShadow","textTransform","top","unicodeBidi","verticalAlign","visibility","voiceFamily","volume","whiteSpace","widows","width","wordSpacing","zIndex"].sort();
    
    var view = document.defaultView ? 
            document.defaultView.getComputedStyle(node, null) :
            node.currentStyle;

    var str = [], sl = -1;
    for(var i=0,len=property.length; i<len; i++)
    {
        var item = property[i];
        if(!view[item]) continue;
        
        str[++sl] = "<div class='CSSItem'><span class='CSSProperty'>"; 
        str[++sl] = toSelectorCase(item);
        str[++sl] = "</span>:<span class='CSSValue'>"; 
        str[++sl] = view[item];
        str[++sl] = "</span>;</div>";
    }
    
    return str;
};

var renderStyles2 = function renderStyles(node)
{
    var property = ["opacity","filter","azimuth","background","backgroundAttachment","backgroundColor","backgroundImage","backgroundPosition","backgroundRepeat","border","borderCollapse","borderColor","borderSpacing","borderStyle","borderTop","borderRight","borderBottom","borderLeft","borderTopColor","borderRightColor","borderBottomColor","borderLeftColor","borderTopStyle","borderRightStyle","borderBottomStyle","borderLeftStyle","borderTopWidth","borderRightWidth","borderBottomWidth","borderLeftWidth","borderWidth","bottom","captionSide","clear","clip","color","content","counterIncrement","counterReset","cue","cueAfter","cueBefore","cursor","direction","display","elevation","emptyCells","cssFloat","font","fontFamily","fontSize","fontSizeAdjust","fontStretch","fontStyle","fontVariant","fontWeight","height","left","letterSpacing","lineHeight","listStyle","listStyleImage","listStylePosition","listStyleType","margin","marginTop","marginRight","marginBottom","marginLeft","markerOffset","marks","maxHeight","maxWidth","minHeight","minWidth","orphans","outline","outlineColor","outlineStyle","outlineWidth","overflow","padding","paddingTop","paddingRight","paddingBottom","paddingLeft","page","pageBreakAfter","pageBreakBefore","pageBreakInside","pause","pauseAfter","pauseBefore","pitch","pitchRange","playDuring","position","quotes","richness","right","size","speak","speakHeader","speakNumeral","speakPunctuation","speechRate","stress","tableLayout","textAlign","textDecoration","textIndent","textShadow","textTransform","top","unicodeBidi","verticalAlign","visibility","voiceFamily","volume","whiteSpace","widows","width","wordSpacing","zIndex"].sort();
    
    var view = node.style;

    var str = [], sl = -1;
    for(var i=0,len=property.length; i<len; i++)
    {
        var item = property[i];
        if(!view[item]) continue;
        
        str[++sl] = toSelectorCase(item);
        str[++sl] = ": "; 
        str[++sl] = view[item];
        str[++sl] = ";\n";
    }
    
    str = str.join("");
    return str.substr(0, str.length-1);
};

// ************************************************************************************************

var toCamelCase = function toCamelCase(s)
{
    return s.replace(reSelectorCase, toCamelCaseReplaceFn);
}

var toSelectorCase = function toSelectorCase(s)
{
  return s.replace(reCamelCase, "-$1").toLowerCase();
  
}

var reCamelCase = /([A-Z])/g;
var reSelectorCase = /\-(.)/g; 
var toCamelCaseReplaceFn = function toCamelCaseReplaceFn(m,g)
{
    return g.toUpperCase();
}

// ************************************************************************************************
}});