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
        
        for(var i=0, styleSheet; styleSheet=styleSheets[i]; i++)
        {
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

Firebug.registerPanel(CSSElementPanel);

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