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
    
    renderStylesheet: function(index)
    {
        var str = renderStylesheet(index);
        
        var panel = this.getPanel();
        panel.contentNode.innerHTML = str.join("");
        panel.containerNode.scrollTop = 0;
    }
      
});

Firebug.registerModule(Firebug.CSS);


// ************************************************************************************************
// CSS Panel

function CSSPanel(){};

CSSPanel.prototype = extend(Firebug.Panel,
{
    name: "CSS",
    title: "CSS",
    
    options: {
        hasToolButtons: true
    },

    create: function()
    {
        Firebug.Panel.create.apply(this, arguments);
        
        var selectNode = createElement("select");
        
        var doc = Firebug.browser.document;
        var collection = doc.styleSheets;
        var options = "";
        
        for(var i=0,len=collection.length; i<len; i++)
        {
            var uri = getFileName(collection[i].href) ||  getFileName(doc.location.href);
            
            var option = createElement("option", {value:i});
            option.appendChild(Firebug.chrome.document.createTextNode(uri));
            selectNode.appendChild(option);
        };
        
        this.toolButtonsNode.appendChild(selectNode);
    },
    
    initialize: function()
    {
        Firebug.Panel.initialize.apply(this, arguments);
        
        Firebug.CSS.renderStylesheet(0);
    }
    
});

Firebug.registerPanel(CSSPanel);


// ************************************************************************************************
// CSS Panel

function CSSPanel2(){};

CSSPanel2.prototype = extend(Firebug.Panel,
{
    name: "CSS2",
    parentPanel: "HTML",
    title: "CSS",
    
    options: {
        hasToolButtons: true
    },

    create: function()
    {
        Firebug.Panel.create.apply(this, arguments);
        
    },
    
    initialize: function()
    {
        Firebug.Panel.initialize.apply(this, arguments);
        
        var str = renderStylesheet(0);
        
        var panel = this;
        panel.contentNode.innerHTML = str.join("");
        panel.containerNode.scrollTop = 0;
    }
});

Firebug.registerPanel(CSSPanel2);

// ************************************************************************************************

var renderStylesheet = function renderStylesheet(index)
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

var getFileName = function getFileName(_path)
{
    if (!_path) return "";
    
    var match = _path&&_path.match(/[^\/]+(\?.*)?(#.*)?$/);
    
    return match&&match[0]||_path;
};


// ************************************************************************************************
}});