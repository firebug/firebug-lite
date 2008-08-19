(function(_scope){
	
	/*
	 * pi.js
	 * 1.1
	 * Azer Koçulu <http://azer.kodfabrik.com>
	 * http://pi.kodfabrik.com
	 */
	
	_scope.pi = Object(3.14159265358979323846);
	var pi  = _scope.pi; pi.version = [1.1,2008081313];

	pi.env = {
		ie: /MSIE/i.test(navigator.userAgent),
		ie6: /MSIE 6/i.test(navigator.userAgent),
		ie7: /MSIE 7/i.test(navigator.userAgent),
		ie8: /MSIE 8/i.test(navigator.userAgent),
		firefox: /Firefox/i.test(navigator.userAgent),
		opera: /Opera/i.test(navigator.userAgent),
		webkit: /Webkit/i.test(navigator.userAgent)
	};
	
	pi.util = {
		Array:{
			clone:function(_array,_undeep){
				var tmp = [];
				Array.prototype.push.apply(tmp,_array);
				pi.util.Array.forEach(tmp,function(_item,_index,_source){
					if(_item instanceof Array&&!_undeep)
						_source[_index] = pi.util.Array.clone(_source[_index]);
				});
				return tmp;
			},
			count:function(_array,_value){
				var count = 0;
				pi.util.Array.forEach(_array,function(){
					count+=Number(arguments[0]==_value);
				});
				return count;
			},
			getLatest:function(_array){
				return _array[_array.length-1];
			},
			indexOf:function(_array,_value){
				if(_array.indexOf)
					return _array.indexOf(_value);
				var index = -1;
				for(var i=0, len=_array.length; i<len; i++){
					if(_array[i]==_value){
						index = i;
						break;
					}
				}
				return index;
			},
			forEach:function(_array,_function){
				if(_array.forEach)
					return _array.forEach(_function);
				for(var i=0,len=_array.length; i<len; i++)
					_function.apply(_array,[_array[i],i,_array]);	
			},
			remove:function(_array,_index){
				var result = _array.slice(0,_index);
				_array = Array.prototype.push.apply(result,_array.slice(_index+1));
				return result;
			},
			rotate:function(_array,_value){
				var source = _array;
				pi.util.Array.forEach( pi.util.Array.clone(_array,true), function(_v,_i,_s){
					var index = _i+_value;
						index = index<0?_s.length+index:index;
						index = index>=_s.length?Math.abs(index-_s.length):index;
					source[index] = _v;
				});
				return source;
			}
		},
		Curry:function(_fn,_scope){
			var fn = _fn, scope = _scope||window, args = Array.prototype.slice.call(arguments,2);
			return function(){ 
				return fn.apply(scope,args.concat( Array.prototype.slice.call(arguments,0) )); 
			};
		},
		IsArray:function(_object){
			if(window.NodeList&&window.NamedNodeMap){
				if(_object instanceof Array||_object instanceof NodeList||_object instanceof NamedNodeMap||(window.HTMLCollection&&_object instanceof HTMLCollection))
					return true;
			};
			if(!_object||_object==window||typeof _object=="function"||typeof _object=="string"||typeof _object.length!="number"){
				return false
			}
			var len = _object.length;
			if(len>0&&_object[0]!=undefined&&_object[len-1]!=undefined){
				return true;
			} else {
				for(var key in _object){
					if(key!="item"&&key!="length"&&key!="setNamedItemNS"&&key!="setNamedItem"&&key!="getNamedItem"&&key!="removeNamedItem"&&key!="getNamedItemNS"&&key!="removeNamedItemNS"&&key!="tags"){
						return false;
					}
				}
				return true
			}
		},
		IsHash:function(_object){
			return _object && typeof _object=="object"&&(_object==window||_object instanceof Object)&&!_object.nodeName&&!pi.util.IsArray(_object)
		},
		Init:[],
		AddEvent: function(_element,_eventName,_fn,_useCapture){
			_element[pi.env.ie?"attachEvent":"addEventListener"]((pi.env.ie?"on":"")+_eventName,_fn,_useCapture||false);
			return pi.util.Curry(pi.util.AddEvent,this,_element);
		},
		RemoveEvent: function(_element,_eventName,_fn,_useCapture){
			_element[pi.env.ie?"detachEvent":"removeEventListener"]((pi.env.ie?"on":"")+_eventName,_fn,_useCapture||false);
			return pi.util.Curry(pi.util.RemoveEvent,this,_element);
		},
		Include:function(_url,_callback){
			var script = new pi.element("script").attribute.set("src",_url), callback = _callback||new Function, done = false, head = pi.get.byTag("head")[0];
			script.element[pi.env.ie?"onreadystatechange":"onload"] = function(){
				if(!done && (!pi.env.ie || this.readyState == "complete")){
					callback.call(this);
					done = true;
					head.removeChild(script.element);
				}
			};
			script.insert(head);
		},
		Element:{
			addClass:function(_element,_class){
				if( !pi.util.Element.hasClass(_element,_class) )
					pi.util.Element.setClass(_element, pi.util.Element.getClass(_element) + " " + _class );
			},
			getClass:function(_element){
				return _element.getAttribute(pi.env.ie?"className":"class")||"";
			},
			hasClass:function(_element,_class){
				return pi.util.Array.indexOf(pi.util.Element.getClass(_element).split(" "),_class)>-1;
			},
			removeClass:function(_element,_class){
				if( pi.util.Element.hasClass(_element,_class) ){
					var names = pi.util.Element.getClass(_element,_class).split(" ");
					pi.util.Element.setClass(
						_element, 
						pi.util.Array.remove(names,pi.util.Array.indexOf(names,_class)).join(" ")
					);
				}
			},
			setClass:function(_element,_value){
				_element.setAttribute(pi.env.ie?"className":"class", _value );
			},
			toggleClass:function(){
				if(pi.util.Element.hasClass.apply(this,arguments))
					pi.util.Element.removeClass.apply(this,arguments);
				else
					pi.util.Element.addClass.apply(this,arguments);
			},
			getOpacity:function(_styleObject){
				var styleObject = _styleObject;
				if(!pi.env.ie)
					return styleObject["opacity"];
					
				var alpha = styleObject["filter"].match(/opacity\=(\d+)/i);
				return alpha?alpha[1]/100:1;
			},
			setOpacity:function(_element,_value){
				if(!pi.env.ie)
					return pi.util.Element.addStyle(_element,{ "opacity":_value });
				_value*=100;
				pi.util.Element.addStyle(_element,{ "filter":"alpha(opacity="+_value+")" });
				return this._parent_;
			},
			getPosition:function(_element){
				var parent = _element,offsetLeft = document.body.offsetLeft, offsetTop = document.body.offsetTop, view = pi.util.Element.getView(_element);
				while(parent&&parent!=document.body&&parent!=document.firstChild){
					offsetLeft +=parseInt(parent.offsetLeft);
					offsetTop += parseInt(parent.offsetTop);
					parent = parent.offsetParent;
				};
				return {
					"bottom":view["bottom"],
					"clientLeft":_element.clientLeft,
					"clientTop":_element.clientTop,
					"left":view["left"],
					"marginTop":view["marginTop"],
					"marginLeft":view["marginLeft"],
					"offsetLeft":offsetLeft,
					"offsetTop":offsetTop,
					"position":view["position"],
					"right":view["right"],
					"top":view["top"],
					"zIndex":view["zIndex"]
				};
			},
			getSize:function(_element){
				var view = pi.util.Element.getView(_element);
				return {
					"height":view["height"],
					"clientHeight":_element.clientHeight,
					"clientWidth":_element.clientWidth,
					"offsetHeight":_element.offsetHeight,
					"offsetWidth":_element.offsetWidth,
					"width":view["width"]
				}
			},
			addStyle:function(_element,_style){
				for(var key in _style){
					key = key=="float"?pi.env.ie?"styleFloat":"cssFloat":key;
					if (key == "opacity" && pi.env.ie) {
						pi.util.Element.setOpacity(_element,_style[key]);
						continue;
					}
					try {
						_element.style[key] = _style[key];
					}catch(e){}					
				}
			},
			getStyle:function(_element,_property){
				_property = _property=="float"?pi.env.ie?"styleFloat":"cssFloat":_property;
				if(_property=="opacity"&&pi.env.ie)
					return pi.util.Element.getOpacity(_element.style);
				return typeof _property=="string"?_element.style[_property]:_element.style;
			},
			getView:function(_element,_property){
				var view = document.defaultView?document.defaultView.getComputedStyle(_element,null):_element.currentStyle;
				_property = _property=="float"?pi.env.ie?"styleFloat":"cssFloat":_property;
				if(_property=="opacity"&&pi.env.ie)
					return pi.util.Element.getOpacity(_element,view);
				return typeof _property=="string"?view[_property]:view;
			}
		},
		Hash: {
			clone:function(_hash,_undeep){
				var tmp = {};
				for(var key in _hash){
					if( !_undeep&&pi.util.IsArray( _hash[key] ) ){
						tmp[key] = pi.util.Array.clone( _hash[key] );
					} else if( !_undeep&&pi.util.IsHash( _hash[key] ) ){
						tmp[ key ] = pi.util.Hash.clone(_hash[key]);
					} else
						tmp[key] = _hash[key];
				}
				return tmp;
			},
			merge:function(_hash,_source,_undeep){
				for(var key in _source){
					var value = _source[key];
					if (!_undeep&&pi.util.IsArray(_source[key])) {
						if(pi.util.IsArray( _hash[key] )){
							Array.prototype.push.apply( _source[key], _hash[key] )
						}
						else
							value = pi.util.Array.clone(_source[key]);
					}
					else if (!_undeep&&pi.util.IsHash(_source[key])) {
						if (pi.util.IsHash(_hash[key])) {
							value = pi.util.Hash.merge(_hash[key], _source[key]);
						} else {
							value = pi.util.Hash.clone( _source[key] );
						}
					} else if( _hash[key] )
						value = _hash[ key ];
					_hash[key] = value;
				};
				return _hash;
			}
		},
		Number:{
			range:function(_from,_to){
				for(var i=arguments.length>1?_from:0, array=[], len=(arguments.length>1?_to:arguments[0]); i<len; i++)
					array.push(i);
				return array;
			},
			base:function(_number,_system){
				var remain = _number%_system;
				if(_number==remain)return String.fromCharCode(_number+(_number>9?87:48));
				return ((_number-remain)/_system).base(_system)+String.fromCharCode(remain+(remain>9?87:48));
			},
			decimal:function(_number,_system){
				var result = 0, digit = String(_number).split("");
				for(var i=0,len=digit.length; i<len; i++){
					digit[i]=parseInt((digit[i].charCodeAt(0)>58)?digit[i].charCodeAt(0)-87:digit[i]);
					result += digit[i]*(Math.pow(_system,digit.length-1-i));
				}
				return result;
			},
			random:function(_min,_max){
				while(true){
					var val = Math.round(Math.random()*(_max||0xfffffffffffffffff));
					if(!_min||val>=_min)
						break;
				}
				return val;
			}
		},
		String:{
			format:function(_str){
				var values = Array.prototype.slice.call(arguments,1);
				return _str.replace(/\{(\d)\}/g,function(){
					return values[arguments[1]];
				})
			},
			leftpad:function(_str,_len,_ch){
				var ch = Boolean(_ch)==false?" ":_ch;
				while(_str.length<_len)
					_str=ch+_str;
				return _str;
			},
			unicode:function(_str){
				var str="", obj = _str.split("");
				var i=obj.length;
				while(i--)
					str="\\u{0}{1}".format(pi.util.String.leftpad(String(pi.util.Number.base(obj[i].charCodeAt(0),16)),4,"0"),str);
				return str;
			}
		},
		GetViewport:function(){
			return {
				height:document.documentElement.clientHeight||document.body.clientHeight,
				width:document.documentElement.clientWidth||document.body.clientWidth
			}
		}
	};
	
	pi.get = function(){
		return document.getElementById(arguments[0]);
	};
	pi.get.byTag = function(){
		return document.getElementsByTagName(arguments[0]);
	};
	pi.get.byClass = function(){ return document.getElementsByClassName.apply(document,arguments); };
	
	pi.base = function(){
		this.body = {};
		this.init = null;
		
		this.build = function(_skipClonning){
			var base = this, skipClonning = _skipClonning||false, _private = {},
				fn = function(){
					var _p = pi.util.Hash.clone(_private);
					if(!skipClonning){
						for(var key in this){
							if(pi.util.IsArray( this[ key ] ) ){
								this[key] = pi.util.Array.clone( this[key] );
							} else
								if( pi.util.IsHash(this[key]) ){
									this[key] = pi.util.Hash.clone( 
										this[ key ],
										function(_key,_object){
											this[ _key ]._parent_ = this;
										}
									);
									this[key]._parent_ = this;
								}
						}
					};
					base.createAccessors( _p, this );
					if(base.init)
						return base.init.apply(this,arguments);
					return this;
				};
			this.movePrivateMembers(this.body,_private);
			if(this.init){
				fn["$Init"] = this.init;
			};
			fn.prototype = this.body;
			return fn;
		};
		
		this.createAccessors = function(_p, _branch){
			var getter = function(_property){ return this[_property]; },
			setter = function(_property,_value){ this[_property] = _value; return _branch._parent_||_branch; };
	
			for (var name in _p) {
				var isPrivate = name.substring(0, 1) == "_", title = name.substring(1, 2).toUpperCase() + name.substring(2);
				
				if (isPrivate) {
					_branch[(_branch["get" + title]?"_":"")+"get" + title] = pi.util.Curry(getter,_p,name);
					_branch[(_branch["set" + title]?"_":"")+"set" + title] = pi.util.Curry(setter,_p,name);
				}
				else 
					if (pi.util.IsHash(_p[name])){
						if(!_branch[name])
							_branch[name] = {};
						this.createAccessors(_p[name], _branch[name]);
					}	
			};
		};
		
		this.movePrivateMembers = function(_object, _branch){
			for (var name in _object) {
				var isPrivate = name.substring(0, 1) == "_";
				
				if (isPrivate) {
					_branch[name] = _object[name];
					delete _object[name];
				}
				else 
					if (pi.util.IsHash(_object[name])){
						_branch[name] = {};
						this.movePrivateMembers(_object[name], _branch[name]);
					}
			};
		};
	};
	
	pi.element = new pi.base;
	pi.element.init = function(_val){
		this.environment.setElement(
			typeof _val=="string"||!_val?
				document.createElement(_val||"DIV"):
				_val
		);
		return this;
	};
	
	pi.element.body = {
		"clean":function(){
			var childs = this.child.get();
			while(childs.length){
				childs[0].parentNode.removeChild(childs[0]);
			}
		},
		"clone":function(_deep){
			return this.environment.getElement().cloneNode(_deep);
		},
		"insert":function(_element){
			_element = _element.environment?_element.environment.getElement():_element;
			_element.appendChild(this.environment.getElement());
			return this;
		},
		"insertAfter":function(_referenceElement){			_referenceElement = _referenceElement.environment?_referenceElement.environment.getElement():_referenceElement;
			_referenceElement.nextSibling?this.insertBefore(_referenceElement.nextSibling):this.insert(_referenceElement.parentNode);
			return this;
		},
		"insertBefore":function(_referenceElement){
			_referenceElement = _referenceElement.environment?_referenceElement.environment.getElement():_referenceElement;
			_referenceElement.parentNode.insertBefore(this.environment.getElement(),_referenceElement);
			return this;
		},
		"query":function(_expression,_resultType,namespaceResolver,_result){
			return pi.xpath(_expression,_resultType||"ORDERED_NODE_SNAPSHOT_TYPE",this.environment.getElement(),_namespaceResolver,_result);
		},
		"remove":function(){
			if (this.environment.getParent()) {
				this.environment.getParent().removeChild(this.environment.getElement());
			}
		},
		"update":function(_value){
				pi.util.Array.indexOf(["TEXTAREA","INPUT"],this.environment.getName())>-1?
				(this.environment.getElement().value = _value):
				(this.environment.getElement().innerHTML = _value);
				return this;
		},
		"attribute":{
			"getAll":function(){
				return this._parent_.environment.getElement().attributes;
			},
			"clear":function(_name){
				this.set(_name,"");
				return this._parent_;
			},
			"get":function(_name){
				return this._parent_.environment.getElement().getAttribute(_name);
			},
			"has":function(_name){
				return pi.env.ie?(this.get(_name)!=null):this._parent_.environment.getElement().hasAttribute(_name);
			},
			"remove":function(_name){
				this._parent_.environment.getElement().removeAttribute(_name);
				return this._parent_;
			},
			"set":function(_name,_value){
				this._parent_.environment.getElement().setAttribute(_name,_value);
				return this._parent_;
			},
			"addClass":function(_classes){
				for(var i=0,len=arguments.length; i<len; i++){
					pi.util.Element.addClass(this._parent_.environment.getElement(),arguments[i]);
				};
				return this._parent_;
			},
			"clearClass":function(){
				this.setClass("");
				this._parent_;
			},
			"getClass":function(){
				return pi.util.Element.getClass( this._parent_.environment.getElement() );
			},
			"hasClass":function(_class){
				return pi.util.Element.hasClass( this._parent_.environment.getElement(), _class );
			},
			"setClass":function(_value){
				return pi.util.Element.setClass( this._parent_.environment.getElement(), _value );
			},
			"removeClass":function(_class){
				pi.util.Element.removeClass( this._parent_.environment.getElement(), _class );
				return this._parent_;
			},
			"toggleClass":function(_class){
				pi.util.Element.toggleClass( this._parent_.environment.getElement(), _class );
			}
		},
		"child":{
			"get":function(){
				return this._parent_.environment.getElement().childNodes;
			},
			"add":function(_elements){
				for (var i = 0; i < arguments.length; i++) {
					var el = arguments[i];
					this._parent_.environment.getElement().appendChild(
						el.environment ? el.environment.getElement() : el
					);
				}
				return this._parent_;
			},
			"addAfter":function(_element,_referenceElement){
				this.addBefore(
					_element.environment?_element.environment.getElement():_element,
					(_referenceElement.environment?_referenceElement.environment.getElement():_referenceElement).nextSibling
				);
				return this._parent_;
			},
			"addBefore":function(_element,_referenceElement){
				this._parent_.environment.getElement().insertBefore(
					_element.environment?_element.environment.getElement():_element,
					_referenceElement.environment?_referenceElement.environment.getElement():_referenceElement
				);
				return this._parent_;
			},
			"remove":function(_element){
				this._parent_.environment.getElement().removeChild(_element.environment?_element.environment.getElement():_element);
			}
		},
		"environment":{
			"_element":null,
			"setElement":function(_value){
				this._parent_.element = _value;
				this._parent_.element.pi = this._parent_;
				this._setElement(_value);
			},
			"getParent":function(){
				return this.getElement().parentNode;
			},
			"getPosition":function(){
				return pi.util.Element.getPosition(this.getElement());
			},
			"getSize":function(){
				return pi.util.Element.getSize( this.getElement() );
			},
			"addStyle":function(_styleObject){
				pi.util.Element.addStyle(this.getElement(),_styleObject);
				return this._parent_;
			},
			"getStyle":function(_property){
				return pi.util.Element.getStyle(_property);
			},
			"getName":function(){
				return this.getElement().nodeName;
			},
			"getType":function(){
				return this.getElement().nodeType;
			},
			"getView":function(_property){
				return pi.util.Element.getView(this.getElement(),_property);
			}
		},
		"event":{
			"addListener":function(_event,_fn,_useCapture){
				pi.util.AddEvent(this._parent_.environment.getElement(),_event,_fn,_useCapture);
				return this._parent_;
			},
			"removeListener":function(_event,_fn,_useCapture){
				pi.util.RemoveEvent(this._parent_.environment.getElement(),_event,_fn,_useCapture);
				return this._parent_;
			}
		}
	};
	pi.element = pi.element.build();
	
	pi.xhr = new pi.base;
	pi.xhr.init = function(_url){
		if(!window.XMLHttpRequest){
			var names = ["Msxml2.XMLHTTP.6.0","Msxml2.XMLHTTP.3.0","Msxml2.XMLHTTP","Microsoft.XMLHTTP"];
			for (var i = 0; i < names.length; i++) {
				try {
					this.environment.setApi(new ActiveXObject(names[i]));
					break;
				} catch (e) { continue; }
			}
		}
		else
			this.environment.setApi(new XMLHttpRequest());
		this.environment.getApi().onreadystatechange=pi.util.Curry(this.event.readystatechange,this);
		
		this.environment.setUrl(_url);
		
		return this;
	};
	pi.xhr.body = {
		"abort":function(){
			this.environment.getApi().abort();
			return this;
		},
		"send":function(){
			var url = this.environment.getUrl(), data = this.environment.getData(),dataUrl = ""; 

			for (var key in data)
				dataUrl += pi.util.String.format("{0}={1}&",key, data[key]);
			
			if (this.environment.getType()=="GET")
				url += (url.search("\\?")==-1?"?":"&")+pi.util.String.format("{0}",dataUrl);
			
			this.environment.getApi().open(this.environment.getType(),url,this.environment.getAsync());
			
			for(var key in this.environment.getHeader())
				this.environment.getApi().setRequestHeader(key,this.environment.getHeader()[key]);

			this.environment.getApi().send(this.environment.getType()=="GET"?"":dataUrl);
			return this;
		}
	};
	pi.xhr.body.environment = {
		"_async":true, "_api":null, "_cache":true, "_callback":[], "_data":{}, "_header":{}, "_type":"GET", "_url":"",
		"addCallback": function(_readyState,_fn){
			this.getCallback().push({ "fn":_fn, "readyState":_readyState  });
			return this._parent_;
		},
		"addHeader": function(_key,_value){
			this.getHeader()[_key] = _value;
			return this._parent_;
		},
		"addData": function(_key,_value){
			this.getData()[_key] = _value;
			return this._parent_;
		},
		"setCache":function(_value){
			delete this.getData()["forceCache"];
			if(!_value){
				this.addData("forceCache",Number(new Date));
			};
			this._setCache(_value);
			return this._parent_;
		},
		"setType": function(_value){
			if(_value=="POST"){
				this.addHeader("Content-Type","application/x-www-form-urlencoded");
			};
			this._setType(_value);
			return this._parent_;
		}
	};
	pi.xhr.body.event = {
		"readystatechange":function(){
			var readyState = this.environment.getApi().readyState, callback=this.environment.getCallback();
			for (var i = 0, len=callback.length; i < len; i++) {
				if(pi.util.Array.indexOf(callback[i].readyState,readyState)>-1){
					callback[i].fn.apply(this);
				}
			}
		}
	};
	pi.xhr = pi.xhr.build();
	
	/*
	 * xml.xhr.get
	 */
	
	pi.xhr.get = function(_url,_returnPiObject){
		var request = new pi.xhr();
		request.environment.setAsync(false);
		request.environment.setUrl(_url);
		request.send();
		return _returnPiObject?request:request.environment.getApi();
	};
	
	/*
	 * registering onload event for init functions
	 */
	pi.util.AddEvent(
		pi.env.ie?window:document,
		pi.env.ie?"load":"DOMContentLoaded",
		function(){
			for(var i=0,len=pi.util.Init.length; i<len; i++){
				pi.util.Init[ i ]();
			}
		}
	);
	
})(window);