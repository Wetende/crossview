import{a as tn,r as an}from"./vendor-dnd-JWc9MNSn.js";import{H as uf}from"./vendor-hls-Cp2x8l1r.js";import{C as An,M as cf}from"./mixin-D3UDm--6.js";var hf=Object.create,Xh=Object.defineProperty,mf=Object.getOwnPropertyDescriptor,pf=Object.getOwnPropertyNames,vf=Object.getPrototypeOf,ff=Object.prototype.hasOwnProperty,Jh=function(t,e){return function(){return t&&(e=t(t=0)),e}},We=function(t,e){return function(){return e||t((e={exports:{}}).exports,e),e.exports}},Ef=function(t,e,i,a){if(e&&typeof e=="object"||typeof e=="function")for(var r=pf(e),n=0,s=r.length,o;n<s;n++)o=r[n],!ff.call(t,o)&&o!==i&&Xh(t,o,{get:(function(l){return e[l]}).bind(null,o),enumerable:!(a=mf(e,o))||a.enumerable});return t},Xe=function(t,e,i){return i=t!=null?hf(vf(t)):{},Ef(!t||!t.__esModule?Xh(i,"default",{value:t,enumerable:!0}):i,t)},yt=We(function(t,e){var i;typeof window<"u"?i=window:typeof global<"u"?i=global:typeof self<"u"?i=self:i={},e.exports=i});function aa(t,e){return e!=null&&typeof Symbol<"u"&&e[Symbol.hasInstance]?!!e[Symbol.hasInstance](t):aa(t,e)}var ra=Jh(function(){ra()});function em(t){"@swc/helpers - typeof";return t&&typeof Symbol<"u"&&t.constructor===Symbol?"symbol":typeof t}var tm=Jh(function(){}),im=We(function(t,e){var i=Array.prototype.slice;e.exports=a;function a(r,n){for(("length"in r)||(r=[r]),r=i.call(r);r.length;){var s=r.shift(),o=n(s);if(o)return o;s.childNodes&&s.childNodes.length&&(r=i.call(s.childNodes).concat(r))}}}),_f=We(function(t,e){ra(),e.exports=i;function i(a,r){if(!aa(this,i))return new i(a,r);this.data=a,this.nodeValue=a,this.length=a.length,this.ownerDocument=r||null}i.prototype.nodeType=8,i.prototype.nodeName="#comment",i.prototype.toString=function(){return"[object Comment]"}}),bf=We(function(t,e){ra(),e.exports=i;function i(a,r){if(!aa(this,i))return new i(a);this.data=a||"",this.length=this.data.length,this.ownerDocument=r||null}i.prototype.type="DOMTextNode",i.prototype.nodeType=3,i.prototype.nodeName="#text",i.prototype.toString=function(){return this.data},i.prototype.replaceData=function(a,r,n){var s=this.data,o=s.substring(0,a),l=s.substring(a+r,s.length);this.data=o+n+l,this.length=this.data.length}}),am=We(function(t,e){e.exports=i;function i(a){var r=this,n=a.type;a.target||(a.target=r),r.listeners||(r.listeners={});var s=r.listeners[n];if(s)return s.forEach(function(o){a.currentTarget=r,typeof o=="function"?o(a):o.handleEvent(a)});r.parentNode&&r.parentNode.dispatchEvent(a)}}),rm=We(function(t,e){e.exports=i;function i(a,r){var n=this;n.listeners||(n.listeners={}),n.listeners[a]||(n.listeners[a]=[]),n.listeners[a].indexOf(r)===-1&&n.listeners[a].push(r)}}),nm=We(function(t,e){e.exports=i;function i(a,r){var n=this;if(n.listeners&&n.listeners[a]){var s=n.listeners[a],o=s.indexOf(r);o!==-1&&s.splice(o,1)}}}),gf=We(function(t,e){tm(),e.exports=a;var i=["area","base","br","col","embed","hr","img","input","keygen","link","menuitem","meta","param","source","track","wbr"];function a(h){switch(h.nodeType){case 3:return m(h.data);case 8:return"<!--"+h.data+"-->";default:return r(h)}}function r(h){var c=[],v=h.tagName;return h.namespaceURI==="http://www.w3.org/1999/xhtml"&&(v=v.toLowerCase()),c.push("<"+v+d(h)+o(h)),i.indexOf(v)>-1?c.push(" />"):(c.push(">"),h.childNodes.length?c.push.apply(c,h.childNodes.map(a)):h.textContent||h.innerText?c.push(m(h.textContent||h.innerText)):h.innerHTML&&c.push(h.innerHTML),c.push("</"+v+">")),c.join("")}function n(h,c){var v=em(h[c]);return c==="style"&&Object.keys(h.style).length>0?!0:h.hasOwnProperty(c)&&(v==="string"||v==="boolean"||v==="number")&&c!=="nodeName"&&c!=="className"&&c!=="tagName"&&c!=="textContent"&&c!=="innerText"&&c!=="namespaceURI"&&c!=="innerHTML"}function s(h){if(typeof h=="string")return h;var c="";return Object.keys(h).forEach(function(v){var E=h[v];v=v.replace(/[A-Z]/g,function(g){return"-"+g.toLowerCase()}),c+=v+":"+E+";"}),c}function o(h){var c=h.dataset,v=[];for(var E in c)v.push({name:"data-"+E,value:c[E]});return v.length?l(v):""}function l(h){var c=[];return h.forEach(function(v){var E=v.name,g=v.value;E==="style"&&(g=s(g)),c.push(E+'="'+p(g)+'"')}),c.length?" "+c.join(" "):""}function d(h){var c=[];for(var v in h)n(h,v)&&c.push({name:v,value:h[v]});for(var E in h._attributes)for(var g in h._attributes[E]){var y=h._attributes[E][g],T=(y.prefix?y.prefix+":":"")+g;c.push({name:T,value:y.value})}return h.className&&c.push({name:"class",value:h.className}),c.length?l(c):""}function m(h){var c="";return typeof h=="string"?c=h:h&&(c=h.toString()),c.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function p(h){return m(h).replace(/"/g,"&quot;")}}),sm=We(function(t,e){ra();var i=im(),a=am(),r=rm(),n=nm(),s=gf(),o="http://www.w3.org/1999/xhtml";e.exports=l;function l(d,m,p){if(!aa(this,l))return new l(d);var h=p===void 0?o:p||null;this.tagName=h===o?String(d).toUpperCase():d,this.nodeName=this.tagName,this.className="",this.dataset={},this.childNodes=[],this.parentNode=null,this.style={},this.ownerDocument=m||null,this.namespaceURI=h,this._attributes={},this.tagName==="INPUT"&&(this.type="text")}l.prototype.type="DOMElement",l.prototype.nodeType=1,l.prototype.appendChild=function(d){return d.parentNode&&d.parentNode.removeChild(d),this.childNodes.push(d),d.parentNode=this,d},l.prototype.replaceChild=function(d,m){d.parentNode&&d.parentNode.removeChild(d);var p=this.childNodes.indexOf(m);return m.parentNode=null,this.childNodes[p]=d,d.parentNode=this,m},l.prototype.removeChild=function(d){var m=this.childNodes.indexOf(d);return this.childNodes.splice(m,1),d.parentNode=null,d},l.prototype.insertBefore=function(d,m){d.parentNode&&d.parentNode.removeChild(d);var p=m==null?-1:this.childNodes.indexOf(m);return p>-1?this.childNodes.splice(p,0,d):this.childNodes.push(d),d.parentNode=this,d},l.prototype.setAttributeNS=function(d,m,p){var h=null,c=m,v=m.indexOf(":");if(v>-1&&(h=m.substr(0,v),c=m.substr(v+1)),this.tagName==="INPUT"&&m==="type")this.type=p;else{var E=this._attributes[d]||(this._attributes[d]={});E[c]={value:p,prefix:h}}},l.prototype.getAttributeNS=function(d,m){var p=this._attributes[d],h=p&&p[m]&&p[m].value;return this.tagName==="INPUT"&&m==="type"?this.type:typeof h!="string"?null:h},l.prototype.removeAttributeNS=function(d,m){var p=this._attributes[d];p&&delete p[m]},l.prototype.hasAttributeNS=function(d,m){var p=this._attributes[d];return!!p&&m in p},l.prototype.setAttribute=function(d,m){return this.setAttributeNS(null,d,m)},l.prototype.getAttribute=function(d){return this.getAttributeNS(null,d)},l.prototype.removeAttribute=function(d){return this.removeAttributeNS(null,d)},l.prototype.hasAttribute=function(d){return this.hasAttributeNS(null,d)},l.prototype.removeEventListener=n,l.prototype.addEventListener=r,l.prototype.dispatchEvent=a,l.prototype.focus=function(){},l.prototype.toString=function(){return s(this)},l.prototype.getElementsByClassName=function(d){var m=d.split(" "),p=[];return i(this,function(h){if(h.nodeType===1){var c=h.className||"",v=c.split(" ");m.every(function(E){return v.indexOf(E)!==-1})&&p.push(h)}}),p},l.prototype.getElementsByTagName=function(d){d=d.toLowerCase();var m=[];return i(this.childNodes,function(p){p.nodeType===1&&(d==="*"||p.tagName.toLowerCase()===d)&&m.push(p)}),m},l.prototype.contains=function(d){return i(this,function(m){return d===m})||!1}}),yf=We(function(t,e){ra();var i=sm();e.exports=a;function a(r){if(!aa(this,a))return new a;this.childNodes=[],this.parentNode=null,this.ownerDocument=r||null}a.prototype.type="DocumentFragment",a.prototype.nodeType=11,a.prototype.nodeName="#document-fragment",a.prototype.appendChild=i.prototype.appendChild,a.prototype.replaceChild=i.prototype.replaceChild,a.prototype.removeChild=i.prototype.removeChild,a.prototype.toString=function(){return this.childNodes.map(function(r){return String(r)}).join("")}}),Tf=We(function(t,e){e.exports=i;function i(a){}i.prototype.initEvent=function(a,r,n){this.type=a,this.bubbles=r,this.cancelable=n},i.prototype.preventDefault=function(){}}),Af=We(function(t,e){ra();var i=im(),a=_f(),r=bf(),n=sm(),s=yf(),o=Tf(),l=am(),d=rm(),m=nm();e.exports=p;function p(){if(!aa(this,p))return new p;this.head=this.createElement("head"),this.body=this.createElement("body"),this.documentElement=this.createElement("html"),this.documentElement.appendChild(this.head),this.documentElement.appendChild(this.body),this.childNodes=[this.documentElement],this.nodeType=9}var h=p.prototype;h.createTextNode=function(c){return new r(c,this)},h.createElementNS=function(c,v){var E=c===null?null:String(c);return new n(v,this,E)},h.createElement=function(c){return new n(c,this)},h.createDocumentFragment=function(){return new s(this)},h.createEvent=function(c){return new o(c)},h.createComment=function(c){return new a(c,this)},h.getElementById=function(c){c=String(c);var v=i(this.childNodes,function(E){if(String(E.id)===c)return E});return v||null},h.getElementsByClassName=n.prototype.getElementsByClassName,h.getElementsByTagName=n.prototype.getElementsByTagName,h.contains=n.prototype.contains,h.removeEventListener=m,h.addEventListener=d,h.dispatchEvent=l}),kf=We(function(t,e){var i=Af();e.exports=new i}),om=We(function(t,e){var i=typeof global<"u"?global:typeof window<"u"?window:{},a=kf(),r;typeof document<"u"?r=document:(r=i["__GLOBAL_DOCUMENT_CACHE@4"],r||(r=i["__GLOBAL_DOCUMENT_CACHE@4"]=a)),e.exports=r});function Sf(t){if(Array.isArray(t))return t}function wf(t,e){var i=t==null?null:typeof Symbol<"u"&&t[Symbol.iterator]||t["@@iterator"];if(i!=null){var a=[],r=!0,n=!1,s,o;try{for(i=i.call(t);!(r=(s=i.next()).done)&&(a.push(s.value),!(e&&a.length===e));r=!0);}catch(l){n=!0,o=l}finally{try{!r&&i.return!=null&&i.return()}finally{if(n)throw o}}return a}}function If(){throw new TypeError(`Invalid attempt to destructure non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)}function bl(t,e){(e==null||e>t.length)&&(e=t.length);for(var i=0,a=new Array(e);i<e;i++)a[i]=t[i];return a}function lm(t,e){if(t){if(typeof t=="string")return bl(t,e);var i=Object.prototype.toString.call(t).slice(8,-1);if(i==="Object"&&t.constructor&&(i=t.constructor.name),i==="Map"||i==="Set")return Array.from(i);if(i==="Arguments"||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(i))return bl(t,e)}}function ai(t,e){return Sf(t)||wf(t,e)||lm(t,e)||If()}var qr=Xe(yt()),_c=Xe(yt()),Rf=Xe(yt()),Cf={now:function(){var t=Rf.default.performance,e=t&&t.timing,i=e&&e.navigationStart,a=typeof i=="number"&&typeof t.now=="function"?i+t.now():Date.now();return Math.round(a)}},be=Cf,rn=function(){var t,e,i;if(typeof((t=_c.default.crypto)===null||t===void 0?void 0:t.getRandomValues)=="function"){i=new Uint8Array(32),_c.default.crypto.getRandomValues(i);for(var a=0;a<32;a++)i[a]=i[a]%16}else{i=[];for(var r=0;r<32;r++)i[r]=Math.random()*16|0}var n=0;e="xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,function(l){var d=l==="x"?i[n]:i[n]&3|8;return n++,d.toString(16)});var s=be.now(),o=s?.toString(16).substring(3);return o?e.substring(0,28)+o:e},dm=function(){return("000000"+(Math.random()*Math.pow(36,6)<<0).toString(36)).slice(-6)},ht=function(t){if(t&&typeof t.nodeName<"u")return t.muxId||(t.muxId=dm()),t.muxId;var e;try{e=document.querySelector(t)}catch{}return e&&!e.muxId&&(e.muxId=t),e?.muxId||t},js=function(t){var e;t&&typeof t.nodeName<"u"?(e=t,t=ht(e)):e=document.querySelector(t);var i=e&&e.nodeName?e.nodeName.toLowerCase():"";return[e,t,i]};function Lf(t){if(Array.isArray(t))return bl(t)}function Df(t){if(typeof Symbol<"u"&&t[Symbol.iterator]!=null||t["@@iterator"]!=null)return Array.from(t)}function Mf(){throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)}function mt(t){return Lf(t)||Df(t)||lm(t)||Mf()}var Wi={TRACE:0,DEBUG:1,INFO:2,WARN:3,ERROR:4},xf=function(t){var e=arguments.length>1&&arguments[1]!==void 0?arguments[1]:3,i,a,r,n,s,o=[console,t],l=(i=console.trace).bind.apply(i,mt(o)),d=(a=console.info).bind.apply(a,mt(o)),m=(r=console.debug).bind.apply(r,mt(o)),p=(n=console.warn).bind.apply(n,mt(o)),h=(s=console.error).bind.apply(s,mt(o)),c=e;return{trace:function(){for(var v=arguments.length,E=new Array(v),g=0;g<v;g++)E[g]=arguments[g];if(!(c>Wi.TRACE))return l.apply(void 0,mt(E))},debug:function(){for(var v=arguments.length,E=new Array(v),g=0;g<v;g++)E[g]=arguments[g];if(!(c>Wi.DEBUG))return m.apply(void 0,mt(E))},info:function(){for(var v=arguments.length,E=new Array(v),g=0;g<v;g++)E[g]=arguments[g];if(!(c>Wi.INFO))return d.apply(void 0,mt(E))},warn:function(){for(var v=arguments.length,E=new Array(v),g=0;g<v;g++)E[g]=arguments[g];if(!(c>Wi.WARN))return p.apply(void 0,mt(E))},error:function(){for(var v=arguments.length,E=new Array(v),g=0;g<v;g++)E[g]=arguments[g];if(!(c>Wi.ERROR))return h.apply(void 0,mt(E))},get level(){return c},set level(v){v!==this.level&&(c=v??e)}}},ee=xf("[mux]"),zo=Xe(yt());function gl(){var t=zo.default.doNotTrack||zo.default.navigator&&zo.default.navigator.doNotTrack;return t==="1"}function P(t){if(t===void 0)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return t}ra();function Re(t,e){if(!aa(t,e))throw new TypeError("Cannot call a class as a function")}function Of(t,e){for(var i=0;i<e.length;i++){var a=e[i];a.enumerable=a.enumerable||!1,a.configurable=!0,"value"in a&&(a.writable=!0),Object.defineProperty(t,a.key,a)}}function Gt(t,e,i){return e&&Of(t.prototype,e),t}function w(t,e,i){return e in t?Object.defineProperty(t,e,{value:i,enumerable:!0,configurable:!0,writable:!0}):t[e]=i,t}function ja(t){return ja=Object.setPrototypeOf?Object.getPrototypeOf:function(e){return e.__proto__||Object.getPrototypeOf(e)},ja(t)}function Nf(t,e){for(;!Object.prototype.hasOwnProperty.call(t,e)&&(t=ja(t),t!==null););return t}function Kn(t,e,i){return typeof Reflect<"u"&&Reflect.get?Kn=Reflect.get:Kn=function(a,r,n){var s=Nf(a,r);if(s){var o=Object.getOwnPropertyDescriptor(s,r);return o.get?o.get.call(n||a):o.value}},Kn(t,e,i||t)}function yl(t,e){return yl=Object.setPrototypeOf||function(i,a){return i.__proto__=a,i},yl(t,e)}function Pf(t,e){if(typeof e!="function"&&e!==null)throw new TypeError("Super expression must either be null or a function");t.prototype=Object.create(e&&e.prototype,{constructor:{value:t,writable:!0,configurable:!0}}),e&&yl(t,e)}function Uf(){if(typeof Reflect>"u"||!Reflect.construct||Reflect.construct.sham)return!1;if(typeof Proxy=="function")return!0;try{return Boolean.prototype.valueOf.call(Reflect.construct(Boolean,[],function(){})),!0}catch{return!1}}tm();function $f(t,e){return e&&(em(e)==="object"||typeof e=="function")?e:P(t)}function Hf(t){var e=Uf();return function(){var i=ja(t),a;if(e){var r=ja(this).constructor;a=Reflect.construct(i,arguments,r)}else a=i.apply(this,arguments);return $f(this,a)}}var _t=function(t){return nn(t)[0]},nn=function(t){if(typeof t!="string"||t==="")return["localhost"];var e=/^(([^:\/?#]+):)?(\/\/([^\/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?/,i=t.match(e)||[],a=i[4],r;return a&&(r=(a.match(/[^\.]+\.[^\.]+$/)||[])[0]),[a,r]},Zo=Xe(yt()),Bf={exists:function(){var t=Zo.default.performance,e=t&&t.timing;return e!==void 0},domContentLoadedEventEnd:function(){var t=Zo.default.performance,e=t&&t.timing;return e&&e.domContentLoadedEventEnd},navigationStart:function(){var t=Zo.default.performance,e=t&&t.timing;return e&&e.navigationStart}},Xs=Bf;function _e(t,e,i){i=i===void 0?1:i,t[e]=t[e]||0,t[e]+=i}function Js(t){for(var e=1;e<arguments.length;e++){var i=arguments[e]!=null?arguments[e]:{},a=Object.keys(i);typeof Object.getOwnPropertySymbols=="function"&&(a=a.concat(Object.getOwnPropertySymbols(i).filter(function(r){return Object.getOwnPropertyDescriptor(i,r).enumerable}))),a.forEach(function(r){w(t,r,i[r])})}return t}function Wf(t,e){var i=Object.keys(t);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(t);i.push.apply(i,a)}return i}function Pd(t,e){return e=e??{},Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(e)):Wf(Object(e)).forEach(function(i){Object.defineProperty(t,i,Object.getOwnPropertyDescriptor(e,i))}),t}var Ff=["x-cdn","content-type"],um=["x-request-id","cf-ray","x-amz-cf-id","x-akamai-request-id"],Kf=Ff.concat(um);function Ud(t){t=t||"";var e={},i=t.trim().split(/[\r\n]+/);return i.forEach(function(a){if(a){var r=a.split(": "),n=r.shift();n&&(Kf.indexOf(n.toLowerCase())>=0||n.toLowerCase().indexOf("x-litix-")===0)&&(e[n]=r.join(": "))}}),e}function eo(t){if(t){var e=um.find(function(i){return t[i]!==void 0});return e?t[e]:void 0}}var Vf=function(t){var e={};for(var i in t){var a=t[i],r=a["DATA-ID"].search("io.litix.data.");if(r!==-1){var n=a["DATA-ID"].replace("io.litix.data.","");e[n]=a.VALUE}}return e},cm=Vf,kn=function(t){if(!t)return{};var e=Xs.navigationStart(),i=t.loading,a=i?i.start:t.trequest,r=i?i.first:t.tfirst,n=i?i.end:t.tload;return{bytesLoaded:t.total,requestStart:Math.round(e+a),responseStart:Math.round(e+r),responseEnd:Math.round(e+n)}},ur=function(t){if(!(!t||typeof t.getAllResponseHeaders!="function"))return Ud(t.getAllResponseHeaders())},qf=function(t,e,i){var a=arguments.length>4?arguments[4]:void 0,r=t.log,n=t.utils.secondsToMs,s=function(g){var y=parseInt(a.version),T;return y===1&&g.programDateTime!==null&&(T=g.programDateTime),y===0&&g.pdt!==null&&(T=g.pdt),T};if(!Xs.exists()){r.warn("performance timing not supported. Not tracking HLS.js.");return}var o=function(g,y){return t.emit(e,g,y)},l=function(g,y){var T=y.levels,_=y.audioTracks,S=y.url,C=y.stats,N=y.networkDetails,$=y.sessionData,G={},J={};T.forEach(function(he,Pe){G[Pe]={width:he.width,height:he.height,bitrate:he.bitrate,attrs:he.attrs}}),_.forEach(function(he,Pe){J[Pe]={name:he.name,language:he.lang,bitrate:he.bitrate}});var K=kn(C),U=K.bytesLoaded,Me=K.requestStart,Fe=K.responseStart,Ke=K.responseEnd;o("requestcompleted",Pd(Js({},cm($)),{request_event_type:g,request_bytes_loaded:U,request_start:Me,request_response_start:Fe,request_response_end:Ke,request_type:"manifest",request_hostname:_t(S),request_response_headers:ur(N),request_rendition_lists:{media:G,audio:J,video:{}}}))};i.on(a.Events.MANIFEST_LOADED,l);var d=function(g,y){var T=y.details,_=y.level,S=y.networkDetails,C=y.stats,N=kn(C),$=N.bytesLoaded,G=N.requestStart,J=N.responseStart,K=N.responseEnd,U=T.fragments[T.fragments.length-1],Me=s(U)+n(U.duration);o("requestcompleted",{request_event_type:g,request_bytes_loaded:$,request_start:G,request_response_start:J,request_response_end:K,request_current_level:_,request_type:"manifest",request_hostname:_t(T.url),request_response_headers:ur(S),video_holdback:T.holdBack&&n(T.holdBack),video_part_holdback:T.partHoldBack&&n(T.partHoldBack),video_part_target_duration:T.partTarget&&n(T.partTarget),video_target_duration:T.targetduration&&n(T.targetduration),video_source_is_live:T.live,player_manifest_newest_program_time:isNaN(Me)?void 0:Me})};i.on(a.Events.LEVEL_LOADED,d);var m=function(g,y){var T=y.details,_=y.networkDetails,S=y.stats,C=kn(S),N=C.bytesLoaded,$=C.requestStart,G=C.responseStart,J=C.responseEnd;o("requestcompleted",{request_event_type:g,request_bytes_loaded:N,request_start:$,request_response_start:G,request_response_end:J,request_type:"manifest",request_hostname:_t(T.url),request_response_headers:ur(_)})};i.on(a.Events.AUDIO_TRACK_LOADED,m);var p=function(g,y){var T=y.stats,_=y.networkDetails,S=y.frag;T=T||S.stats;var C=kn(T),N=C.bytesLoaded,$=C.requestStart,G=C.responseStart,J=C.responseEnd,K=_?ur(_):void 0,U={request_event_type:g,request_bytes_loaded:N,request_start:$,request_response_start:G,request_response_end:J,request_hostname:_?_t(_.responseURL):void 0,request_id:K?eo(K):void 0,request_response_headers:K,request_media_duration:S.duration,request_url:_?.responseURL};S.type==="main"?(U.request_type="media",U.request_current_level=S.level,U.request_video_width=(i.levels[S.level]||{}).width,U.request_video_height=(i.levels[S.level]||{}).height,U.request_labeled_bitrate=(i.levels[S.level]||{}).bitrate):U.request_type=S.type,o("requestcompleted",U)};i.on(a.Events.FRAG_LOADED,p);var h=function(g,y){var T=y.frag,_=T.start,S=s(T),C={currentFragmentPDT:S,currentFragmentStart:n(_)};o("fragmentchange",C)};i.on(a.Events.FRAG_CHANGED,h);var c=function(g,y){var T=y.type,_=y.details,S=y.response,C=y.fatal,N=y.frag,$=y.networkDetails,G=N?.url||y.url||"",J=$?ur($):void 0;if((_===a.ErrorDetails.MANIFEST_LOAD_ERROR||_===a.ErrorDetails.MANIFEST_LOAD_TIMEOUT||_===a.ErrorDetails.FRAG_LOAD_ERROR||_===a.ErrorDetails.FRAG_LOAD_TIMEOUT||_===a.ErrorDetails.LEVEL_LOAD_ERROR||_===a.ErrorDetails.LEVEL_LOAD_TIMEOUT||_===a.ErrorDetails.AUDIO_TRACK_LOAD_ERROR||_===a.ErrorDetails.AUDIO_TRACK_LOAD_TIMEOUT||_===a.ErrorDetails.SUBTITLE_LOAD_ERROR||_===a.ErrorDetails.SUBTITLE_LOAD_TIMEOUT||_===a.ErrorDetails.KEY_LOAD_ERROR||_===a.ErrorDetails.KEY_LOAD_TIMEOUT)&&o("requestfailed",{request_error:_,request_url:G,request_hostname:_t(G),request_id:J?eo(J):void 0,request_type:_===a.ErrorDetails.FRAG_LOAD_ERROR||_===a.ErrorDetails.FRAG_LOAD_TIMEOUT?"media":_===a.ErrorDetails.AUDIO_TRACK_LOAD_ERROR||_===a.ErrorDetails.AUDIO_TRACK_LOAD_TIMEOUT?"audio":_===a.ErrorDetails.SUBTITLE_LOAD_ERROR||_===a.ErrorDetails.SUBTITLE_LOAD_TIMEOUT?"subtitle":_===a.ErrorDetails.KEY_LOAD_ERROR||_===a.ErrorDetails.KEY_LOAD_TIMEOUT?"encryption":"manifest",request_error_code:S?.code,request_error_text:S?.text}),C){var K,U="".concat(G?"url: ".concat(G,`
`):"")+"".concat(S&&(S.code||S.text)?"response: ".concat(S.code,", ").concat(S.text,`
`):"")+"".concat(y.reason?"failure reason: ".concat(y.reason,`
`):"")+"".concat(y.level?"level: ".concat(y.level,`
`):"")+"".concat(y.parent?"parent stream controller: ".concat(y.parent,`
`):"")+"".concat(y.buffer?"buffer length: ".concat(y.buffer,`
`):"")+"".concat(y.error?"error: ".concat(y.error,`
`):"")+"".concat(y.event?"event: ".concat(y.event,`
`):"")+"".concat(y.err?"error message: ".concat((K=y.err)===null||K===void 0?void 0:K.message,`
`):"");o("error",{player_error_code:T,player_error_message:_,player_error_context:U})}};i.on(a.Events.ERROR,c);var v=function(g,y){var T=y.frag,_=T&&T._url||"";o("requestcanceled",{request_event_type:g,request_url:_,request_type:"media",request_hostname:_t(_)})};i.on(a.Events.FRAG_LOAD_EMERGENCY_ABORTED,v);var E=function(g,y){var T=y.level,_=i.levels[T];if(_&&_.attrs&&_.attrs.BANDWIDTH){var S=_.attrs.BANDWIDTH,C,N=parseFloat(_.attrs["FRAME-RATE"]);isNaN(N)||(C=N),S?o("renditionchange",{video_source_fps:C,video_source_bitrate:S,video_source_width:_.width,video_source_height:_.height,video_source_rendition_name:_.name,video_source_codec:_?.videoCodec}):r.warn("missing BANDWIDTH from HLS manifest parsed by HLS.js")}};i.on(a.Events.LEVEL_SWITCHED,E),i._stopMuxMonitor=function(){i.off(a.Events.MANIFEST_LOADED,l),i.off(a.Events.LEVEL_LOADED,d),i.off(a.Events.AUDIO_TRACK_LOADED,m),i.off(a.Events.FRAG_LOADED,p),i.off(a.Events.FRAG_CHANGED,h),i.off(a.Events.ERROR,c),i.off(a.Events.FRAG_LOAD_EMERGENCY_ABORTED,v),i.off(a.Events.LEVEL_SWITCHED,E),i.off(a.Events.DESTROYING,i._stopMuxMonitor),delete i._stopMuxMonitor},i.on(a.Events.DESTROYING,i._stopMuxMonitor)},Yf=function(t){t&&typeof t._stopMuxMonitor=="function"&&t._stopMuxMonitor()},bc=function(t,e){if(!t||!t.requestEndDate)return{};var i=_t(t.url),a=t.url,r=t.bytesLoaded,n=new Date(t.requestStartDate).getTime(),s=new Date(t.firstByteDate).getTime(),o=new Date(t.requestEndDate).getTime(),l=isNaN(t.duration)?0:t.duration,d=typeof e.getMetricsFor=="function"?e.getMetricsFor(t.mediaType).HttpList:e.getDashMetrics().getHttpRequests(t.mediaType),m;d.length>0&&(m=Ud(d[d.length-1]._responseHeaders||""));var p=m?eo(m):void 0;return{requestStart:n,requestResponseStart:s,requestResponseEnd:o,requestBytesLoaded:r,requestResponseHeaders:m,requestMediaDuration:l,requestHostname:i,requestUrl:a,requestId:p}},Gf=function(t,e){var i=e.getQualityFor(t),a=e.getCurrentTrackFor(t).bitrateList;return a?{currentLevel:i,renditionWidth:a[i].width||null,renditionHeight:a[i].height||null,renditionBitrate:a[i].bandwidth}:{}},Qf=function(t){var e;return(e=t.match(/.*codecs\*?="(.*)"/))===null||e===void 0?void 0:e[1]},zf=function(t){try{var e,i,a=(i=t.getVersion)===null||i===void 0||(e=i.call(t))===null||e===void 0?void 0:e.split(".").map(function(r){return parseInt(r)})[0];return a}catch{return!1}},Zf=function(t,e,i){var a=t.log;if(!i||!i.on){a.warn("Invalid dash.js player reference. Monitoring blocked.");return}var r=zf(i),n=function(T,_){return t.emit(e,T,_)},s=function(T){var _=T.type,S=T.data,C=(S||{}).url;n("requestcompleted",{request_event_type:_,request_start:0,request_response_start:0,request_response_end:0,request_bytes_loaded:-1,request_type:"manifest",request_hostname:_t(C),request_url:C})};i.on("manifestLoaded",s);var o={},l=function(T){if(typeof T.getRequests!="function")return null;var _=T.getRequests({state:"executed"});return _.length===0?null:_[_.length-1]},d=function(T){var _=T.type,S=T.fragmentModel,C=T.chunk,N=l(S);m({type:_,request:N,chunk:C})},m=function(T){var _=T.type,S=T.chunk,C=T.request,N=(S||{}).mediaInfo,$=N||{},G=$.type,J=$.bitrateList;J=J||[];var K={};J.forEach(function(Ve,ke){K[ke]={},K[ke].width=Ve.width,K[ke].height=Ve.height,K[ke].bitrate=Ve.bandwidth,K[ke].attrs={}}),G==="video"?o.video=K:G==="audio"?o.audio=K:o.media=K;var U=bc(C,i),Me=U.requestStart,Fe=U.requestResponseStart,Ke=U.requestResponseEnd,he=U.requestResponseHeaders,Pe=U.requestMediaDuration,Tt=U.requestHostname,Ue=U.requestUrl,dt=U.requestId;n("requestcompleted",{request_event_type:_,request_start:Me,request_response_start:Fe,request_response_end:Ke,request_bytes_loaded:-1,request_type:G+"_init",request_response_headers:he,request_hostname:Tt,request_id:dt,request_url:Ue,request_media_duration:Pe,request_rendition_lists:o})};r>=4?i.on("initFragmentLoaded",m):i.on("initFragmentLoaded",d);var p=function(T){var _=T.type,S=T.fragmentModel,C=T.chunk,N=l(S);h({type:_,request:N,chunk:C})},h=function(T){var _=T.type,S=T.chunk,C=T.request,N=S||{},$=N.mediaInfo,G=N.start,J=$||{},K=J.type,U=bc(C,i),Me=U.requestStart,Fe=U.requestResponseStart,Ke=U.requestResponseEnd,he=U.requestBytesLoaded,Pe=U.requestResponseHeaders,Tt=U.requestMediaDuration,Ue=U.requestHostname,dt=U.requestUrl,Ve=U.requestId,ke=Gf(K,i),xe=ke.currentLevel,et=ke.renditionWidth,na=ke.renditionHeight,yn=ke.renditionBitrate;n("requestcompleted",{request_event_type:_,request_start:Me,request_response_start:Fe,request_response_end:Ke,request_bytes_loaded:he,request_type:K,request_response_headers:Pe,request_hostname:Ue,request_id:Ve,request_url:dt,request_media_start_time:G,request_media_duration:Tt,request_current_level:xe,request_labeled_bitrate:yn,request_video_width:et,request_video_height:na})};r>=4?i.on("mediaFragmentLoaded",h):i.on("mediaFragmentLoaded",p);var c={video:void 0,audio:void 0,totalBitrate:void 0},v=function(){if(c.video&&typeof c.video.bitrate=="number"){if(!(c.video.width&&c.video.height)){a.warn("have bitrate info for video but missing width/height");return}var T=c.video.bitrate;if(c.audio&&typeof c.audio.bitrate=="number"&&(T+=c.audio.bitrate),T!==c.totalBitrate)return c.totalBitrate=T,{video_source_bitrate:T,video_source_height:c.video.height,video_source_width:c.video.width,video_source_codec:Qf(c.video.codec)}}},E=function(T,_,S){if(typeof T.newQuality!="number"){a.warn("missing evt.newQuality in qualityChangeRendered event",T);return}var C=T.mediaType;if(C==="audio"||C==="video"){var N=i.getBitrateInfoListFor(C).find(function(G){var J=G.qualityIndex;return J===T.newQuality});if(!(N&&typeof N.bitrate=="number")){a.warn("missing bitrate info for ".concat(C));return}c[C]=Pd(Js({},N),{codec:i.getCurrentTrackFor(C).codec});var $=v();$&&n("renditionchange",$)}};i.on("qualityChangeRendered",E);var g=function(T){var _=T.request,S=T.mediaType;_=_||{},n("requestcanceled",{request_event_type:_.type+"_"+_.action,request_url:_.url,request_type:S,request_hostname:_t(_.url)})};i.on("fragmentLoadingAbandoned",g);var y=function(T){var _=T.error,S,C,N=(_==null||(S=_.data)===null||S===void 0?void 0:S.request)||{},$=(_==null||(C=_.data)===null||C===void 0?void 0:C.response)||{};_?.code===27&&n("requestfailed",{request_error:N.type+"_"+N.action,request_url:N.url,request_hostname:_t(N.url),request_type:N.mediaType,request_error_code:$.status,request_error_text:$.statusText});var G="".concat(N!=null&&N.url?"url: ".concat(N.url,`
`):"")+"".concat($!=null&&$.status||$!=null&&$.statusText?"response: ".concat($?.status,", ").concat($?.statusText,`
`):"");n("error",{player_error_code:_?.code,player_error_message:_?.message,player_error_context:G})};i.on("error",y),i._stopMuxMonitor=function(){i.off("manifestLoaded",s),i.off("initFragmentLoaded",m),i.off("mediaFragmentLoaded",h),i.off("qualityChangeRendered",E),i.off("error",y),i.off("fragmentLoadingAbandoned",g),delete i._stopMuxMonitor}},jf=function(t){t&&typeof t._stopMuxMonitor=="function"&&t._stopMuxMonitor()},gc=0,Xf=(function(){function t(){Re(this,t),w(this,"_listeners",void 0)}return Gt(t,[{key:"on",value:function(e,i,a){return i._eventEmitterGuid=i._eventEmitterGuid||++gc,this._listeners=this._listeners||{},this._listeners[e]=this._listeners[e]||[],a&&(i=i.bind(a)),this._listeners[e].push(i),i}},{key:"off",value:function(e,i){var a=this._listeners&&this._listeners[e];a&&a.forEach(function(r,n){r._eventEmitterGuid===i._eventEmitterGuid&&a.splice(n,1)})}},{key:"one",value:function(e,i,a){var r=this;i._eventEmitterGuid=i._eventEmitterGuid||++gc;var n=function(){r.off(e,n),i.apply(a||this,arguments)};n._eventEmitterGuid=i._eventEmitterGuid,this.on(e,n)}},{key:"emit",value:function(e,i){var a=this;if(this._listeners){i=i||{};var r=this._listeners["before*"]||[],n=this._listeners[e]||[],s=this._listeners["after"+e]||[],o=function(l,d){l=l.slice(),l.forEach(function(m){m.call(a,{type:e},d)})};o(r,i),o(n,i),o(s,i)}}}]),t})(),Jf=Xf,jo=Xe(yt()),eE=(function(){function t(e){var i=this;Re(this,t),w(this,"_playbackHeartbeatInterval",void 0),w(this,"_playheadShouldBeProgressing",void 0),w(this,"pm",void 0),this.pm=e,this._playbackHeartbeatInterval=null,this._playheadShouldBeProgressing=!1,e.on("playing",function(){i._playheadShouldBeProgressing=!0}),e.on("play",this._startPlaybackHeartbeatInterval.bind(this)),e.on("playing",this._startPlaybackHeartbeatInterval.bind(this)),e.on("adbreakstart",this._startPlaybackHeartbeatInterval.bind(this)),e.on("adplay",this._startPlaybackHeartbeatInterval.bind(this)),e.on("adplaying",this._startPlaybackHeartbeatInterval.bind(this)),e.on("devicewake",this._startPlaybackHeartbeatInterval.bind(this)),e.on("viewstart",this._startPlaybackHeartbeatInterval.bind(this)),e.on("rebufferstart",this._startPlaybackHeartbeatInterval.bind(this)),e.on("pause",this._stopPlaybackHeartbeatInterval.bind(this)),e.on("ended",this._stopPlaybackHeartbeatInterval.bind(this)),e.on("viewend",this._stopPlaybackHeartbeatInterval.bind(this)),e.on("error",this._stopPlaybackHeartbeatInterval.bind(this)),e.on("aderror",this._stopPlaybackHeartbeatInterval.bind(this)),e.on("adpause",this._stopPlaybackHeartbeatInterval.bind(this)),e.on("adended",this._stopPlaybackHeartbeatInterval.bind(this)),e.on("adbreakend",this._stopPlaybackHeartbeatInterval.bind(this)),e.on("seeked",function(){e.data.player_is_paused?i._stopPlaybackHeartbeatInterval():i._startPlaybackHeartbeatInterval()}),e.on("timeupdate",function(){i._playbackHeartbeatInterval!==null&&e.emit("playbackheartbeat")}),e.on("devicesleep",function(a,r){i._playbackHeartbeatInterval!==null&&(jo.default.clearInterval(i._playbackHeartbeatInterval),e.emit("playbackheartbeatend",{viewer_time:r.viewer_time}),i._playbackHeartbeatInterval=null)})}return Gt(t,[{key:"_startPlaybackHeartbeatInterval",value:function(){var e=this;this._playbackHeartbeatInterval===null&&(this.pm.emit("playbackheartbeat"),this._playbackHeartbeatInterval=jo.default.setInterval(function(){e.pm.emit("playbackheartbeat")},this.pm.playbackHeartbeatTime))}},{key:"_stopPlaybackHeartbeatInterval",value:function(){this._playheadShouldBeProgressing=!1,this._playbackHeartbeatInterval!==null&&(jo.default.clearInterval(this._playbackHeartbeatInterval),this.pm.emit("playbackheartbeatend"),this._playbackHeartbeatInterval=null)}}]),t})(),tE=eE,iE=function t(e){var i=this;Re(this,t),w(this,"viewErrored",void 0),e.on("viewinit",function(){i.viewErrored=!1}),e.on("error",function(a,r){try{var n=e.errorTranslator({player_error_code:r.player_error_code,player_error_message:r.player_error_message,player_error_context:r.player_error_context,player_error_severity:r.player_error_severity,player_error_business_exception:r.player_error_business_exception});n&&(e.data.player_error_code=n.player_error_code||r.player_error_code,e.data.player_error_message=n.player_error_message||r.player_error_message,e.data.player_error_context=n.player_error_context||r.player_error_context,e.data.player_error_severity=n.player_error_severity||r.player_error_severity,e.data.player_error_business_exception=n.player_error_business_exception||r.player_error_business_exception,i.viewErrored=!0)}catch(s){e.mux.log.warn("Exception in error translator callback.",s),i.viewErrored=!0}}),e.on("aftererror",function(){var a,r,n,s,o;(a=e.data)===null||a===void 0||delete a.player_error_code,(r=e.data)===null||r===void 0||delete r.player_error_message,(n=e.data)===null||n===void 0||delete n.player_error_context,(s=e.data)===null||s===void 0||delete s.player_error_severity,(o=e.data)===null||o===void 0||delete o.player_error_business_exception})},aE=iE,rE=(function(){function t(e){Re(this,t),w(this,"_watchTimeTrackerLastCheckedTime",void 0),w(this,"pm",void 0),this.pm=e,this._watchTimeTrackerLastCheckedTime=null,e.on("playbackheartbeat",this._updateWatchTime.bind(this)),e.on("playbackheartbeatend",this._clearWatchTimeState.bind(this))}return Gt(t,[{key:"_updateWatchTime",value:function(e,i){var a=i.viewer_time;this._watchTimeTrackerLastCheckedTime===null&&(this._watchTimeTrackerLastCheckedTime=a),_e(this.pm.data,"view_watch_time",a-this._watchTimeTrackerLastCheckedTime),this._watchTimeTrackerLastCheckedTime=a}},{key:"_clearWatchTimeState",value:function(e,i){this._updateWatchTime(e,i),this._watchTimeTrackerLastCheckedTime=null}}]),t})(),nE=rE,sE=(function(){function t(e){var i=this;Re(this,t),w(this,"_playbackTimeTrackerLastPlayheadPosition",void 0),w(this,"_lastTime",void 0),w(this,"_isAdPlaying",void 0),w(this,"_callbackUpdatePlaybackTime",void 0),w(this,"pm",void 0),this.pm=e,this._playbackTimeTrackerLastPlayheadPosition=-1,this._lastTime=be.now(),this._isAdPlaying=!1,this._callbackUpdatePlaybackTime=null;var a=this._startPlaybackTimeTracking.bind(this);e.on("playing",a),e.on("adplaying",a),e.on("seeked",a);var r=this._stopPlaybackTimeTracking.bind(this);e.on("playbackheartbeatend",r),e.on("seeking",r),e.on("adplaying",function(){i._isAdPlaying=!0}),e.on("adended",function(){i._isAdPlaying=!1}),e.on("adpause",function(){i._isAdPlaying=!1}),e.on("adbreakstart",function(){i._isAdPlaying=!1}),e.on("adbreakend",function(){i._isAdPlaying=!1}),e.on("adplay",function(){i._isAdPlaying=!1}),e.on("viewinit",function(){i._playbackTimeTrackerLastPlayheadPosition=-1,i._lastTime=be.now(),i._isAdPlaying=!1,i._callbackUpdatePlaybackTime=null})}return Gt(t,[{key:"_startPlaybackTimeTracking",value:function(){this._callbackUpdatePlaybackTime===null&&(this._callbackUpdatePlaybackTime=this._updatePlaybackTime.bind(this),this._playbackTimeTrackerLastPlayheadPosition=this.pm.data.player_playhead_time,this.pm.on("playbackheartbeat",this._callbackUpdatePlaybackTime))}},{key:"_stopPlaybackTimeTracking",value:function(){this._callbackUpdatePlaybackTime&&(this._updatePlaybackTime(),this.pm.off("playbackheartbeat",this._callbackUpdatePlaybackTime),this._callbackUpdatePlaybackTime=null,this._playbackTimeTrackerLastPlayheadPosition=-1)}},{key:"_updatePlaybackTime",value:function(){var e=this.pm.data.player_playhead_time,i=be.now(),a=-1;this._playbackTimeTrackerLastPlayheadPosition>=0&&e>this._playbackTimeTrackerLastPlayheadPosition?a=e-this._playbackTimeTrackerLastPlayheadPosition:this._isAdPlaying&&(a=i-this._lastTime),a>0&&a<=1e3&&_e(this.pm.data,"view_content_playback_time",a),this._playbackTimeTrackerLastPlayheadPosition=e,this._lastTime=i}}]),t})(),oE=sE,lE=(function(){function t(e){Re(this,t),w(this,"pm",void 0),this.pm=e;var i=this._updatePlayheadTime.bind(this);e.on("playbackheartbeat",i),e.on("playbackheartbeatend",i),e.on("timeupdate",i),e.on("destroy",function(){e.off("timeupdate",i)})}return Gt(t,[{key:"_updateMaxPlayheadPosition",value:function(){this.pm.data.view_max_playhead_position=typeof this.pm.data.view_max_playhead_position>"u"?this.pm.data.player_playhead_time:Math.max(this.pm.data.view_max_playhead_position,this.pm.data.player_playhead_time)}},{key:"_updatePlayheadTime",value:function(e,i){var a=this,r=function(){a.pm.currentFragmentPDT&&a.pm.currentFragmentStart&&(a.pm.data.player_program_time=a.pm.currentFragmentPDT+a.pm.data.player_playhead_time-a.pm.currentFragmentStart)};if(i&&i.player_playhead_time)this.pm.data.player_playhead_time=i.player_playhead_time,r(),this._updateMaxPlayheadPosition();else if(this.pm.getPlayheadTime){var n=this.pm.getPlayheadTime();typeof n<"u"&&(this.pm.data.player_playhead_time=n,r(),this._updateMaxPlayheadPosition())}}}]),t})(),dE=lE,yc=300*1e3,uE=function t(e){if(Re(this,t),!e.disableRebufferTracking){var i,a=function(n,s){r(s),i=void 0},r=function(n){if(i){var s=n.viewer_time-i;_e(e.data,"view_rebuffer_duration",s),i=n.viewer_time,e.data.view_rebuffer_duration>yc&&(e.emit("viewend"),e.send("viewend"),e.mux.log.warn("Ending view after rebuffering for longer than ".concat(yc,"ms, future events will be ignored unless a programchange or videochange occurs.")))}e.data.view_watch_time>=0&&e.data.view_rebuffer_count>0&&(e.data.view_rebuffer_frequency=e.data.view_rebuffer_count/e.data.view_watch_time,e.data.view_rebuffer_percentage=e.data.view_rebuffer_duration/e.data.view_watch_time)};e.on("playbackheartbeat",function(n,s){return r(s)}),e.on("rebufferstart",function(n,s){i||(_e(e.data,"view_rebuffer_count",1),i=s.viewer_time,e.one("rebufferend",a))}),e.on("viewinit",function(){i=void 0,e.off("rebufferend",a)})}},cE=uE,hE=(function(){function t(e){var i=this;Re(this,t),w(this,"_lastCheckedTime",void 0),w(this,"_lastPlayheadTime",void 0),w(this,"_lastPlayheadTimeUpdatedTime",void 0),w(this,"_rebuffering",void 0),w(this,"pm",void 0),this.pm=e,!(e.disableRebufferTracking||e.disablePlayheadRebufferTracking)&&(this._lastCheckedTime=null,this._lastPlayheadTime=null,this._lastPlayheadTimeUpdatedTime=null,e.on("playbackheartbeat",this._checkIfRebuffering.bind(this)),e.on("playbackheartbeatend",this._cleanupRebufferTracker.bind(this)),e.on("seeking",function(){i._cleanupRebufferTracker(null,{viewer_time:be.now()})}))}return Gt(t,[{key:"_checkIfRebuffering",value:function(e,i){if(this.pm.seekingTracker.isSeeking||this.pm.adTracker.isAdBreak||!this.pm.playbackHeartbeat._playheadShouldBeProgressing){this._cleanupRebufferTracker(e,i);return}if(this._lastCheckedTime===null){this._prepareRebufferTrackerState(i.viewer_time);return}if(this._lastPlayheadTime!==this.pm.data.player_playhead_time){this._cleanupRebufferTracker(e,i,!0);return}var a=i.viewer_time-this._lastPlayheadTimeUpdatedTime;typeof this.pm.sustainedRebufferThreshold=="number"&&a>=this.pm.sustainedRebufferThreshold&&(this._rebuffering||(this._rebuffering=!0,this.pm.emit("rebufferstart",{viewer_time:this._lastPlayheadTimeUpdatedTime}))),this._lastCheckedTime=i.viewer_time}},{key:"_clearRebufferTrackerState",value:function(){this._lastCheckedTime=null,this._lastPlayheadTime=null,this._lastPlayheadTimeUpdatedTime=null}},{key:"_prepareRebufferTrackerState",value:function(e){this._lastCheckedTime=e,this._lastPlayheadTime=this.pm.data.player_playhead_time,this._lastPlayheadTimeUpdatedTime=e}},{key:"_cleanupRebufferTracker",value:function(e,i){var a=arguments.length>2&&arguments[2]!==void 0?arguments[2]:!1;if(this._rebuffering)this._rebuffering=!1,this.pm.emit("rebufferend",{viewer_time:i.viewer_time});else{if(this._lastCheckedTime===null)return;var r=this.pm.data.player_playhead_time-this._lastPlayheadTime,n=i.viewer_time-this._lastPlayheadTimeUpdatedTime;typeof this.pm.minimumRebufferDuration=="number"&&r>0&&n-r>this.pm.minimumRebufferDuration&&(this._lastCheckedTime=null,this.pm.emit("rebufferstart",{viewer_time:this._lastPlayheadTimeUpdatedTime}),this.pm.emit("rebufferend",{viewer_time:this._lastPlayheadTimeUpdatedTime+n-r}))}a?this._prepareRebufferTrackerState(i.viewer_time):this._clearRebufferTrackerState()}}]),t})(),mE=hE,pE=(function(){function t(e){var i=this;Re(this,t),w(this,"NAVIGATION_START",void 0),w(this,"pm",void 0),this.pm=e,e.on("viewinit",function(){var a=e.data,r=a.view_id;if(!a.view_program_changed){var n=function(s,o){var l=o.viewer_time;(s.type==="playing"&&typeof e.data.view_time_to_first_frame>"u"||s.type==="adplaying"&&(typeof e.data.view_time_to_first_frame>"u"||i._inPrerollPosition()))&&i.calculateTimeToFirstFrame(l||be.now(),r)};e.one("playing",n),e.one("adplaying",n),e.one("viewend",function(){e.off("playing",n),e.off("adplaying",n)})}})}return Gt(t,[{key:"_inPrerollPosition",value:function(){return typeof this.pm.data.view_content_playback_time>"u"||this.pm.data.view_content_playback_time<=1e3}},{key:"calculateTimeToFirstFrame",value:function(e,i){i===this.pm.data.view_id&&(this.pm.watchTimeTracker._updateWatchTime(null,{viewer_time:e}),this.pm.data.view_time_to_first_frame=this.pm.data.view_watch_time,(this.pm.data.player_autoplay_on||this.pm.data.video_is_autoplay)&&this.NAVIGATION_START&&(this.pm.data.view_aggregate_startup_time=this.pm.data.view_start+this.pm.data.view_watch_time-this.NAVIGATION_START))}}]),t})(),vE=pE,fE=function t(e){var i=this;Re(this,t),w(this,"_lastPlayerHeight",void 0),w(this,"_lastPlayerWidth",void 0),w(this,"_lastPlayheadPosition",void 0),w(this,"_lastSourceHeight",void 0),w(this,"_lastSourceWidth",void 0),e.on("viewinit",function(){i._lastPlayheadPosition=-1});var a=["pause","rebufferstart","seeking","error","adbreakstart","hb","renditionchange","orientationchange","viewend"],r=["playing","hb","renditionchange","orientationchange"];a.forEach(function(n){e.on(n,function(){if(i._lastPlayheadPosition>=0&&e.data.player_playhead_time>=0&&i._lastPlayerWidth>=0&&i._lastSourceWidth>0&&i._lastPlayerHeight>=0&&i._lastSourceHeight>0){var s=e.data.player_playhead_time-i._lastPlayheadPosition;if(s<0){i._lastPlayheadPosition=-1;return}var o=Math.min(i._lastPlayerWidth/i._lastSourceWidth,i._lastPlayerHeight/i._lastSourceHeight),l=Math.max(0,o-1),d=Math.max(0,1-o);e.data.view_max_upscale_percentage=Math.max(e.data.view_max_upscale_percentage||0,l),e.data.view_max_downscale_percentage=Math.max(e.data.view_max_downscale_percentage||0,d),_e(e.data,"view_total_content_playback_time",s),_e(e.data,"view_total_upscaling",l*s),_e(e.data,"view_total_downscaling",d*s)}i._lastPlayheadPosition=-1})}),r.forEach(function(n){e.on(n,function(){i._lastPlayheadPosition=e.data.player_playhead_time,i._lastPlayerWidth=e.data.player_width,i._lastPlayerHeight=e.data.player_height,i._lastSourceWidth=e.data.video_source_width,i._lastSourceHeight=e.data.video_source_height})})},EE=fE,_E=2e3,bE=function t(e){var i=this;Re(this,t),w(this,"isSeeking",void 0),this.isSeeking=!1;var a=-1,r=function(){var n=be.now(),s=(e.data.viewer_time||n)-(a||n);_e(e.data,"view_seek_duration",s),e.data.view_max_seek_time=Math.max(e.data.view_max_seek_time||0,s),i.isSeeking=!1,a=-1};e.on("seeking",function(n,s){if(Object.assign(e.data,s),i.isSeeking&&s.viewer_time-a<=_E){a=s.viewer_time;return}i.isSeeking&&r(),i.isSeeking=!0,a=s.viewer_time,_e(e.data,"view_seek_count",1),e.send("seeking")}),e.on("seeked",function(){r()}),e.on("viewend",function(){i.isSeeking&&(r(),e.send("seeked")),i.isSeeking=!1,a=-1})},gE=bE,Tc=function(t,e){t.push(e),t.sort(function(i,a){return i.viewer_time-a.viewer_time})},yE=["adbreakstart","adrequest","adresponse","adplay","adplaying","adpause","adended","adbreakend","aderror","adclicked","adskipped"],TE=(function(){function t(e){var i=this;Re(this,t),w(this,"_adHasPlayed",void 0),w(this,"_adRequests",void 0),w(this,"_adResponses",void 0),w(this,"_currentAdRequestNumber",void 0),w(this,"_currentAdResponseNumber",void 0),w(this,"_prerollPlayTime",void 0),w(this,"_wouldBeNewAdPlay",void 0),w(this,"isAdBreak",void 0),w(this,"pm",void 0),this.pm=e,e.on("viewinit",function(){i.isAdBreak=!1,i._currentAdRequestNumber=0,i._currentAdResponseNumber=0,i._adRequests=[],i._adResponses=[],i._adHasPlayed=!1,i._wouldBeNewAdPlay=!0,i._prerollPlayTime=void 0}),yE.forEach(function(r){return e.on(r,i._updateAdData.bind(i))});var a=function(){i.isAdBreak=!1};e.on("adbreakstart",function(){i.isAdBreak=!0}),e.on("play",a),e.on("playing",a),e.on("viewend",a),e.on("adrequest",function(r,n){n=Object.assign({ad_request_id:"generatedAdRequestId"+i._currentAdRequestNumber++},n),Tc(i._adRequests,n),_e(e.data,"view_ad_request_count"),i.inPrerollPosition()&&(e.data.view_preroll_requested=!0,i._adHasPlayed||_e(e.data,"view_preroll_request_count"))}),e.on("adresponse",function(r,n){n=Object.assign({ad_request_id:"generatedAdRequestId"+i._currentAdResponseNumber++},n),Tc(i._adResponses,n);var s=i.findAdRequest(n.ad_request_id);s&&_e(e.data,"view_ad_request_time",Math.max(0,n.viewer_time-s.viewer_time))}),e.on("adplay",function(r,n){i._adHasPlayed=!0,i._wouldBeNewAdPlay&&(i._wouldBeNewAdPlay=!1,_e(e.data,"view_ad_played_count")),i.inPrerollPosition()&&!e.data.view_preroll_played&&(e.data.view_preroll_played=!0,i._adRequests.length>0&&(e.data.view_preroll_request_time=Math.max(0,n.viewer_time-i._adRequests[0].viewer_time)),e.data.view_start&&(e.data.view_startup_preroll_request_time=Math.max(0,n.viewer_time-e.data.view_start)),i._prerollPlayTime=n.viewer_time)}),e.on("adplaying",function(r,n){i.inPrerollPosition()&&typeof e.data.view_preroll_load_time>"u"&&typeof i._prerollPlayTime<"u"&&(e.data.view_preroll_load_time=n.viewer_time-i._prerollPlayTime,e.data.view_startup_preroll_load_time=n.viewer_time-i._prerollPlayTime)}),e.on("adclicked",function(r,n){i._wouldBeNewAdPlay||_e(e.data,"view_ad_clicked_count")}),e.on("adskipped",function(r,n){i._wouldBeNewAdPlay||_e(e.data,"view_ad_skipped_count")}),e.on("adended",function(){i._wouldBeNewAdPlay=!0}),e.on("aderror",function(){i._wouldBeNewAdPlay=!0})}return Gt(t,[{key:"inPrerollPosition",value:function(){return typeof this.pm.data.view_content_playback_time>"u"||this.pm.data.view_content_playback_time<=1e3}},{key:"findAdRequest",value:function(e){for(var i=0;i<this._adRequests.length;i++)if(this._adRequests[i].ad_request_id===e)return this._adRequests[i]}},{key:"_updateAdData",value:function(e,i){if(this.inPrerollPosition()){if(!this.pm.data.view_preroll_ad_tag_hostname&&i.ad_tag_url){var a=ai(nn(i.ad_tag_url),2),r=a[0],n=a[1];this.pm.data.view_preroll_ad_tag_domain=n,this.pm.data.view_preroll_ad_tag_hostname=r}if(!this.pm.data.view_preroll_ad_asset_hostname&&i.ad_asset_url){var s=ai(nn(i.ad_asset_url),2),o=s[0],l=s[1];this.pm.data.view_preroll_ad_asset_domain=l,this.pm.data.view_preroll_ad_asset_hostname=o}}this.pm.data.ad_asset_url=i?.ad_asset_url,this.pm.data.ad_tag_url=i?.ad_tag_url,this.pm.data.ad_creative_id=i?.ad_creative_id,this.pm.data.ad_id=i?.ad_id,this.pm.data.ad_universal_id=i?.ad_universal_id}}]),t})(),AE=TE,Ac=Xe(yt()),kE=function t(e){Re(this,t);var i,a,r=function(){e.disableRebufferTracking||(_e(e.data,"view_waiting_rebuffer_count",1),i=be.now(),a=Ac.default.setInterval(function(){if(i){var d=be.now();_e(e.data,"view_waiting_rebuffer_duration",d-i),i=d}},250))},n=function(){e.disableRebufferTracking||i&&(_e(e.data,"view_waiting_rebuffer_duration",be.now()-i),i=!1,Ac.default.clearInterval(a))},s=!1,o=function(){s=!0},l=function(){s=!1,n()};e.on("waiting",function(){s&&r()}),e.on("playing",function(){n(),o()}),e.on("pause",l),e.on("seeking",l)},SE=kE,wE=function t(e){var i=this;Re(this,t),w(this,"lastWallClockTime",void 0);var a=function(){i.lastWallClockTime=be.now(),e.on("before*",r)},r=function(n){var s=be.now(),o=i.lastWallClockTime;i.lastWallClockTime=s,s-o>3e4&&(e.emit("devicesleep",{viewer_time:o}),Object.assign(e.data,{viewer_time:o}),e.send("devicesleep"),e.emit("devicewake",{viewer_time:s}),Object.assign(e.data,{viewer_time:s}),e.send("devicewake"))};e.one("playbackheartbeat",a),e.on("playbackheartbeatend",function(){e.off("before*",r),e.one("playbackheartbeat",a)})},IE=wE,Xo=Xe(yt()),hm=(function(t){return t()})(function(){var t=function(){for(var i=0,a={};i<arguments.length;i++){var r=arguments[i];for(var n in r)a[n]=r[n]}return a};function e(i){function a(r,n,s){var o;if(typeof document<"u"){if(arguments.length>1){if(s=t({path:"/"},a.defaults,s),typeof s.expires=="number"){var l=new Date;l.setMilliseconds(l.getMilliseconds()+s.expires*864e5),s.expires=l}try{o=JSON.stringify(n),/^[\{\[]/.test(o)&&(n=o)}catch{}return i.write?n=i.write(n,r):n=encodeURIComponent(String(n)).replace(/%(23|24|26|2B|3A|3C|3E|3D|2F|3F|40|5B|5D|5E|60|7B|7D|7C)/g,decodeURIComponent),r=encodeURIComponent(String(r)),r=r.replace(/%(23|24|26|2B|5E|60|7C)/g,decodeURIComponent),r=r.replace(/[\(\)]/g,escape),document.cookie=[r,"=",n,s.expires?"; expires="+s.expires.toUTCString():"",s.path?"; path="+s.path:"",s.domain?"; domain="+s.domain:"",s.secure?"; secure":""].join("")}r||(o={});for(var d=document.cookie?document.cookie.split("; "):[],m=/(%[0-9A-Z]{2})+/g,p=0;p<d.length;p++){var h=d[p].split("="),c=h.slice(1).join("=");c.charAt(0)==='"'&&(c=c.slice(1,-1));try{var v=h[0].replace(m,decodeURIComponent);if(c=i.read?i.read(c,v):i(c,v)||c.replace(m,decodeURIComponent),this.json)try{c=JSON.parse(c)}catch{}if(r===v){o=c;break}r||(o[v]=c)}catch{}}return o}}return a.set=a,a.get=function(r){return a.call(a,r)},a.getJSON=function(){return a.apply({json:!0},[].slice.call(arguments))},a.defaults={},a.remove=function(r,n){a(r,"",t(n,{expires:-1}))},a.withConverter=e,a}return e(function(){})}),mm="muxData",RE=function(t){return Object.entries(t).map(function(e){var i=ai(e,2),a=i[0],r=i[1];return"".concat(a,"=").concat(r)}).join("&")},CE=function(t){return t.split("&").reduce(function(e,i){var a=ai(i.split("="),2),r=a[0],n=a[1],s=+n,o=n&&s==n?s:n;return e[r]=o,e},{})},pm=function(){var t;try{t=CE(hm.get(mm)||"")}catch{t={}}return t},vm=function(t){try{hm.set(mm,RE(t),{expires:365})}catch{}},LE=function(){var t=pm();return t.mux_viewer_id=t.mux_viewer_id||rn(),t.msn=t.msn||Math.random(),vm(t),{mux_viewer_id:t.mux_viewer_id,mux_sample_number:t.msn}},DE=function(){var t=pm(),e=be.now();return t.session_start&&(t.sst=t.session_start,delete t.session_start),t.session_id&&(t.sid=t.session_id,delete t.session_id),t.session_expires&&(t.sex=t.session_expires,delete t.session_expires),(!t.sex||t.sex<e)&&(t.sid=rn(),t.sst=e),t.sex=e+1500*1e3,vm(t),{session_id:t.sid,session_start:t.sst,session_expires:t.sex}};function ME(t,e){var i=e.beaconCollectionDomain,a=e.beaconDomain;if(i)return"https://"+i;t=t||"inferred";var r=a||"litix.io";return t.match(/^[a-z0-9]+$/)?"https://"+t+"."+r:"https://img.litix.io/a.gif"}var xE=Xe(yt()),fm=function(){var t;switch(Em()){case"cellular":t="cellular";break;case"ethernet":t="wired";break;case"wifi":t="wifi";break;case void 0:break;default:t="other"}return t},Em=function(){var t=xE.default.navigator,e=t&&(t.connection||t.mozConnection||t.webkitConnection);return e&&e.type};fm.getConnectionFromAPI=Em;var OE=fm,NE={a:"env",b:"beacon",c:"custom",d:"ad",e:"event",f:"experiment",i:"internal",m:"mux",n:"response",p:"player",q:"request",r:"retry",s:"session",t:"timestamp",u:"viewer",v:"video",w:"page",x:"view",y:"sub"},PE=_m(NE),UE={ad:"ad",af:"affiliate",ag:"aggregate",ap:"api",al:"application",ao:"audio",ar:"architecture",as:"asset",au:"autoplay",av:"average",bi:"bitrate",bn:"brand",br:"break",bw:"browser",by:"bytes",bz:"business",ca:"cached",cb:"cancel",cc:"codec",cd:"code",cg:"category",ch:"changed",ci:"client",ck:"clicked",cl:"canceled",cn:"config",co:"count",ce:"counter",cp:"complete",cq:"creator",cr:"creative",cs:"captions",ct:"content",cu:"current",cx:"connection",cz:"context",dg:"downscaling",dm:"domain",dn:"cdn",do:"downscale",dr:"drm",dp:"dropped",du:"duration",dv:"device",dy:"dynamic",eb:"enabled",ec:"encoding",ed:"edge",en:"end",eg:"engine",em:"embed",er:"error",ep:"experiments",es:"errorcode",et:"errortext",ee:"event",ev:"events",ex:"expires",ez:"exception",fa:"failed",fi:"first",fm:"family",ft:"format",fp:"fps",fq:"frequency",fr:"frame",fs:"fullscreen",ha:"has",hb:"holdback",he:"headers",ho:"host",hn:"hostname",ht:"height",id:"id",ii:"init",in:"instance",ip:"ip",is:"is",ke:"key",la:"language",lb:"labeled",le:"level",li:"live",ld:"loaded",lo:"load",ls:"lists",lt:"latency",ma:"max",md:"media",me:"message",mf:"manifest",mi:"mime",ml:"midroll",mm:"min",mn:"manufacturer",mo:"model",mx:"mux",ne:"newest",nm:"name",no:"number",on:"on",or:"origin",os:"os",pa:"paused",pb:"playback",pd:"producer",pe:"percentage",pf:"played",pg:"program",ph:"playhead",pi:"plugin",pl:"preroll",pn:"playing",po:"poster",pp:"pip",pr:"preload",ps:"position",pt:"part",py:"property",px:"pop",pz:"plan",ra:"rate",rd:"requested",re:"rebuffer",rf:"rendition",rg:"range",rm:"remote",ro:"ratio",rp:"response",rq:"request",rs:"requests",sa:"sample",sd:"skipped",se:"session",sh:"shift",sk:"seek",sm:"stream",so:"source",sq:"sequence",sr:"series",ss:"status",st:"start",su:"startup",sv:"server",sw:"software",sy:"severity",ta:"tag",tc:"tech",te:"text",tg:"target",th:"throughput",ti:"time",tl:"total",to:"to",tt:"title",ty:"type",ug:"upscaling",un:"universal",up:"upscale",ur:"url",us:"user",va:"variant",vd:"viewed",vi:"video",ve:"version",vw:"view",vr:"viewer",wd:"width",wa:"watch",wt:"waiting"},kc=_m(UE);function _m(t){var e={};for(var i in t)t.hasOwnProperty(i)&&(e[t[i]]=i);return e}function Tl(t){var e={},i={};return Object.keys(t).forEach(function(a){var r=!1;if(t.hasOwnProperty(a)&&t[a]!==void 0){var n=a.split("_"),s=n[0],o=PE[s];o||(ee.info("Data key word `"+n[0]+"` not expected in "+a),o=s+"_"),n.splice(1).forEach(function(l){l==="url"&&(r=!0),kc[l]?o+=kc[l]:Number.isInteger(Number(l))?o+=l:(ee.info("Data key word `"+l+"` not expected in "+a),o+="_"+l+"_")}),r?i[o]=t[a]:e[o]=t[a]}}),Object.assign(e,i)}var Ki=Xe(yt()),$E=Xe(om()),HE={maxBeaconSize:300,maxQueueLength:3600,baseTimeBetweenBeacons:1e4,maxPayloadKBSize:500},BE=56*1024,WE=["hb","requestcompleted","requestfailed","requestcanceled"],FE="https://img.litix.io",ni=function(t){var e=arguments.length>1&&arguments[1]!==void 0?arguments[1]:{};this._beaconUrl=t||FE,this._eventQueue=[],this._postInFlight=!1,this._resendAfterPost=!1,this._failureCount=0,this._sendTimeout=!1,this._options=Object.assign({},HE,e)};ni.prototype.queueEvent=function(t,e){var i=Object.assign({},e);return this._eventQueue.length<=this._options.maxQueueLength||t==="eventrateexceeded"?(this._eventQueue.push(i),this._sendTimeout||this._startBeaconSending(),this._eventQueue.length<=this._options.maxQueueLength):!1};ni.prototype.flushEvents=function(){var t=arguments.length>0&&arguments[0]!==void 0?arguments[0]:!1;if(t&&this._eventQueue.length===1){this._eventQueue.pop();return}this._eventQueue.length&&this._sendBeaconQueue(),this._startBeaconSending()};ni.prototype.destroy=function(){var t=arguments.length>0&&arguments[0]!==void 0?arguments[0]:!1;this.destroyed=!0,t?this._clearBeaconQueue():this.flushEvents(),Ki.default.clearTimeout(this._sendTimeout)};ni.prototype._clearBeaconQueue=function(){var t=this._eventQueue.length>this._options.maxBeaconSize?this._eventQueue.length-this._options.maxBeaconSize:0,e=this._eventQueue.slice(t);t>0&&Object.assign(e[e.length-1],Tl({mux_view_message:"event queue truncated"}));var i=this._createPayload(e);bm(this._beaconUrl,i,!0,function(){})};ni.prototype._sendBeaconQueue=function(){var t=this;if(this._postInFlight){this._resendAfterPost=!0;return}var e=this._eventQueue.slice(0,this._options.maxBeaconSize);this._eventQueue=this._eventQueue.slice(this._options.maxBeaconSize),this._postInFlight=!0;var i=this._createPayload(e),a=be.now();bm(this._beaconUrl,i,!1,function(r,n){n?(t._eventQueue=e.concat(t._eventQueue),t._failureCount+=1,ee.info("Error sending beacon: "+n)):t._failureCount=0,t._roundTripTime=be.now()-a,t._postInFlight=!1,t._resendAfterPost&&(t._resendAfterPost=!1,t._eventQueue.length>0&&t._sendBeaconQueue())})};ni.prototype._getNextBeaconTime=function(){if(!this._failureCount)return this._options.baseTimeBetweenBeacons;var t=Math.pow(2,this._failureCount-1);return t=t*Math.random(),(1+t)*this._options.baseTimeBetweenBeacons};ni.prototype._startBeaconSending=function(){var t=this;Ki.default.clearTimeout(this._sendTimeout),!this.destroyed&&(this._sendTimeout=Ki.default.setTimeout(function(){t._eventQueue.length&&t._sendBeaconQueue(),t._startBeaconSending()},this._getNextBeaconTime()))};ni.prototype._createPayload=function(t){var e=this,i={transmission_timestamp:Math.round(be.now())};this._roundTripTime&&(i.rtt_ms=Math.round(this._roundTripTime));var a,r,n,s=function(){a=JSON.stringify({metadata:i,events:r||t}),n=a.length/1024},o=function(){return n<=e._options.maxPayloadKBSize};return s(),o()||(ee.info("Payload size is too big ("+n+" kb). Removing unnecessary events."),r=t.filter(function(l){return WE.indexOf(l.e)===-1}),s()),o()||(ee.info("Payload size still too big ("+n+" kb). Cropping fields.."),r.forEach(function(l){for(var d in l){var m=l[d],p=50*1024;typeof m=="string"&&m.length>p&&(l[d]=m.substring(0,p))}}),s()),a};var KE=typeof $E.default.exitPictureInPicture=="function"?function(t){return t.length<=BE}:function(t){return!1},bm=function(t,e,i,a){if(i&&navigator&&navigator.sendBeacon&&navigator.sendBeacon(t,e)){a();return}if(Ki.default.fetch){Ki.default.fetch(t,{method:"POST",body:e,headers:{"Content-Type":"text/plain"},keepalive:KE(e)}).then(function(n){return a(null,n.ok?null:"Error")}).catch(function(n){return a(null,n)});return}if(Ki.default.XMLHttpRequest){var r=new Ki.default.XMLHttpRequest;r.onreadystatechange=function(){if(r.readyState===4)return a(null,r.status!==200?"error":void 0)},r.open("POST",t),r.setRequestHeader("Content-Type","text/plain"),r.send(e);return}a()},VE=ni,qE=["env_key","view_id","view_sequence_number","player_sequence_number","beacon_domain","player_playhead_time","viewer_time","mux_api_version","event","video_id","player_instance_id","player_error_code","player_error_message","player_error_context","player_error_severity","player_error_business_exception"],YE=["adplay","adplaying","adpause","adfirstquartile","admidpoint","adthirdquartile","adended","adresponse","adrequest"],GE=["ad_id","ad_creative_id","ad_universal_id"],QE=["viewstart","error","ended","viewend"],zE=600*1e3,ZE=(function(){function t(e,i){var a=arguments.length>2&&arguments[2]!==void 0?arguments[2]:{};Re(this,t);var r,n,s,o,l,d,m,p,h,c,v,E;w(this,"mux",void 0),w(this,"envKey",void 0),w(this,"options",void 0),w(this,"eventQueue",void 0),w(this,"sampleRate",void 0),w(this,"disableCookies",void 0),w(this,"respectDoNotTrack",void 0),w(this,"previousBeaconData",void 0),w(this,"lastEventTime",void 0),w(this,"rateLimited",void 0),w(this,"pageLevelData",void 0),w(this,"viewerData",void 0),this.mux=e,this.envKey=i,this.options=a,this.previousBeaconData=null,this.lastEventTime=0,this.rateLimited=!1,this.eventQueue=new VE(ME(this.envKey,this.options));var g;this.sampleRate=(g=this.options.sampleRate)!==null&&g!==void 0?g:1;var y;this.disableCookies=(y=this.options.disableCookies)!==null&&y!==void 0?y:!1;var T;this.respectDoNotTrack=(T=this.options.respectDoNotTrack)!==null&&T!==void 0?T:!1,this.previousBeaconData=null,this.lastEventTime=0,this.rateLimited=!1,this.pageLevelData={mux_api_version:this.mux.API_VERSION,mux_embed:this.mux.NAME,mux_embed_version:this.mux.VERSION,viewer_application_name:(r=this.options.platform)===null||r===void 0?void 0:r.name,viewer_application_version:(n=this.options.platform)===null||n===void 0?void 0:n.version,viewer_application_engine:(s=this.options.platform)===null||s===void 0?void 0:s.layout,viewer_device_name:(o=this.options.platform)===null||o===void 0?void 0:o.product,viewer_device_category:"",viewer_device_manufacturer:(l=this.options.platform)===null||l===void 0?void 0:l.manufacturer,viewer_os_family:(m=this.options.platform)===null||m===void 0||(d=m.os)===null||d===void 0?void 0:d.family,viewer_os_architecture:(h=this.options.platform)===null||h===void 0||(p=h.os)===null||p===void 0?void 0:p.architecture,viewer_os_version:(v=this.options.platform)===null||v===void 0||(c=v.os)===null||c===void 0?void 0:c.version,viewer_connection_type:OE(),page_url:Xo.default===null||Xo.default===void 0||(E=Xo.default.location)===null||E===void 0?void 0:E.href},this.viewerData=this.disableCookies?{}:LE()}return Gt(t,[{key:"send",value:function(e,i){if(!(!e||!(i!=null&&i.view_id))){if(this.respectDoNotTrack&&gl())return ee.info("Not sending `"+e+"` because Do Not Track is enabled");if(!i||typeof i!="object")return ee.error("A data object was expected in send() but was not provided");var a=this.disableCookies?{}:DE(),r=Pd(Js({},this.pageLevelData,i,a,this.viewerData),{event:e,env_key:this.envKey});r.user_id&&(r.viewer_user_id=r.user_id,delete r.user_id);var n,s=((n=r.mux_sample_number)!==null&&n!==void 0?n:0)>=this.sampleRate,o=this._deduplicateBeaconData(e,r),l=Tl(o);if(this.lastEventTime=this.mux.utils.now(),s)return ee.info("Not sending event due to sample rate restriction",e,r,l);if(this.envKey||ee.info("Missing environment key (envKey) - beacons will be dropped if the video source is not a valid mux video URL",e,r,l),!this.rateLimited){if(ee.info("Sending event",e,r,l),this.rateLimited=!this.eventQueue.queueEvent(e,l),this.mux.WINDOW_UNLOADING&&e==="viewend")this.eventQueue.destroy(!0);else if(this.mux.WINDOW_HIDDEN&&e==="hb"?this.eventQueue.flushEvents(!0):QE.indexOf(e)>=0&&this.eventQueue.flushEvents(),this.rateLimited)return r.event="eventrateexceeded",l=Tl(r),this.eventQueue.queueEvent(r.event,l),ee.error("Beaconing disabled due to rate limit.")}}}},{key:"destroy",value:function(){this.eventQueue.destroy(!1)}},{key:"_deduplicateBeaconData",value:function(e,i){var a=this,r={},n=i.view_id;if(n==="-1"||e==="viewstart"||e==="viewend"||!this.previousBeaconData||this.mux.utils.now()-this.lastEventTime>=zE)r=Js({},i),n&&(this.previousBeaconData=r),n&&e==="viewend"&&(this.previousBeaconData=null);else{var s=e.indexOf("request")===0;Object.entries(i).forEach(function(o){var l=ai(o,2),d=l[0],m=l[1];a.previousBeaconData&&(m!==a.previousBeaconData[d]||qE.indexOf(d)>-1||a.objectHasChanged(s,d,m,a.previousBeaconData[d])||a.eventRequiresKey(e,d))&&(r[d]=m,a.previousBeaconData[d]=m)})}return r}},{key:"objectHasChanged",value:function(e,i,a,r){return!e||i.indexOf("request_")!==0?!1:i==="request_response_headers"||typeof a!="object"||typeof r!="object"?!0:Object.keys(a||{}).length!==Object.keys(r||{}).length}},{key:"eventRequiresKey",value:function(e,i){return!!(e==="renditionchange"&&i.indexOf("video_source_")===0||GE.includes(i)&&YE.includes(e))}}]),t})(),jE=function t(e){Re(this,t);var i=0,a=0,r=0,n=0,s=0,o=0,l=0,d=function(h,c){var v=c.request_start,E=c.request_response_start,g=c.request_response_end,y=c.request_bytes_loaded;n++;var T,_;if(E?(T=E-(v??0),_=(g??0)-E):_=(g??0)-(v??0),_>0&&y&&y>0){var S=y/_*8e3;s++,a+=y,r+=_,e.data.view_min_request_throughput=Math.min(e.data.view_min_request_throughput||1/0,S),e.data.view_average_request_throughput=a/r*8e3,e.data.view_request_count=n,T>0&&(i+=T,e.data.view_max_request_latency=Math.max(e.data.view_max_request_latency||0,T),e.data.view_average_request_latency=i/s)}},m=function(h,c){n++,o++,e.data.view_request_count=n,e.data.view_request_failed_count=o},p=function(h,c){n++,l++,e.data.view_request_count=n,e.data.view_request_canceled_count=l};e.on("requestcompleted",d),e.on("requestfailed",m),e.on("requestcanceled",p)},XE=jE,JE=3600*1e3,e_=function t(e){var i=this;Re(this,t),w(this,"_lastEventTime",void 0),e.on("before*",function(a,r){var n=r.viewer_time,s=be.now(),o=i._lastEventTime;if(i._lastEventTime=s,o&&s-o>JE){var l=Object.keys(e.data).reduce(function(m,p){return p.indexOf("video_")===0?Object.assign(m,w({},p,e.data[p])):m},{});e.mux.log.info("Received event after at least an hour inactivity, creating a new view");var d=e.playbackHeartbeat._playheadShouldBeProgressing;e._resetView(Object.assign({viewer_time:n},l)),e.playbackHeartbeat._playheadShouldBeProgressing=d,e.playbackHeartbeat._playheadShouldBeProgressing&&a.type!=="play"&&a.type!=="adbreakstart"&&(e.emit("play",{viewer_time:n}),a.type!=="playing"&&e.emit("playing",{viewer_time:n}))}})},t_=e_,i_=["viewstart","ended","loadstart","pause","play","playing","ratechange","waiting","adplay","adpause","adended","aderror","adplaying","adrequest","adresponse","adbreakstart","adbreakend","adfirstquartile","admidpoint","adthirdquartile","rebufferstart","rebufferend","seeked","error","hb","requestcompleted","requestfailed","requestcanceled","renditionchange"],a_=new Set(["requestcompleted","requestfailed","requestcanceled"]),r_=(function(t){Pf(i,t);var e=Hf(i);function i(a,r,n){Re(this,i);var s;s=e.call(this),w(P(s),"DOM_CONTENT_LOADED_EVENT_END",void 0),w(P(s),"NAVIGATION_START",void 0),w(P(s),"_destroyed",void 0),w(P(s),"_heartBeatTimeout",void 0),w(P(s),"adTracker",void 0),w(P(s),"dashjs",void 0),w(P(s),"data",void 0),w(P(s),"disablePlayheadRebufferTracking",void 0),w(P(s),"disableRebufferTracking",void 0),w(P(s),"errorTracker",void 0),w(P(s),"errorTranslator",void 0),w(P(s),"emitTranslator",void 0),w(P(s),"getAdData",void 0),w(P(s),"getPlayheadTime",void 0),w(P(s),"getStateData",void 0),w(P(s),"stateDataTranslator",void 0),w(P(s),"hlsjs",void 0),w(P(s),"id",void 0),w(P(s),"longResumeTracker",void 0),w(P(s),"minimumRebufferDuration",void 0),w(P(s),"mux",void 0),w(P(s),"playbackEventDispatcher",void 0),w(P(s),"playbackHeartbeat",void 0),w(P(s),"playbackHeartbeatTime",void 0),w(P(s),"playheadTime",void 0),w(P(s),"seekingTracker",void 0),w(P(s),"sustainedRebufferThreshold",void 0),w(P(s),"watchTimeTracker",void 0),w(P(s),"currentFragmentPDT",void 0),w(P(s),"currentFragmentStart",void 0),s.DOM_CONTENT_LOADED_EVENT_END=Xs.domContentLoadedEventEnd(),s.NAVIGATION_START=Xs.navigationStart();var o={debug:!1,minimumRebufferDuration:250,sustainedRebufferThreshold:1e3,playbackHeartbeatTime:25,beaconDomain:"litix.io",sampleRate:1,disableCookies:!1,respectDoNotTrack:!1,disableRebufferTracking:!1,disablePlayheadRebufferTracking:!1,errorTranslator:function(h){return h},emitTranslator:function(){for(var h=arguments.length,c=new Array(h),v=0;v<h;v++)c[v]=arguments[v];return c},stateDataTranslator:function(h){return h}};s.mux=a,s.id=r,n!=null&&n.beaconDomain&&s.mux.log.warn("The `beaconDomain` setting has been deprecated in favor of `beaconCollectionDomain`. Please change your integration to use `beaconCollectionDomain` instead of `beaconDomain`."),n=Object.assign(o,n),n.data=n.data||{},n.data.property_key&&(n.data.env_key=n.data.property_key,delete n.data.property_key),ee.level=n.debug?Wi.DEBUG:Wi.WARN,s.getPlayheadTime=n.getPlayheadTime,s.getStateData=n.getStateData||function(){return{}},s.getAdData=n.getAdData||function(){},s.minimumRebufferDuration=n.minimumRebufferDuration,s.sustainedRebufferThreshold=n.sustainedRebufferThreshold,s.playbackHeartbeatTime=n.playbackHeartbeatTime,s.disableRebufferTracking=n.disableRebufferTracking,s.disableRebufferTracking&&s.mux.log.warn("Disabling rebuffer tracking. This should only be used in specific circumstances as a last resort when your player is known to unreliably track rebuffering."),s.disablePlayheadRebufferTracking=n.disablePlayheadRebufferTracking,s.errorTranslator=n.errorTranslator,s.emitTranslator=n.emitTranslator,s.stateDataTranslator=n.stateDataTranslator,s.playbackEventDispatcher=new ZE(a,n.data.env_key,n),s.data={player_instance_id:rn(),mux_sample_rate:n.sampleRate,beacon_domain:n.beaconCollectionDomain||n.beaconDomain},s.data.view_sequence_number=1,s.data.player_sequence_number=1;var l=(function(){typeof this.data.view_start>"u"&&(this.data.view_start=this.mux.utils.now(),this.emit("viewstart"))}).bind(P(s));if(s.on("viewinit",function(h,c){this._resetVideoData(),this._resetViewData(),this._resetErrorData(),this._updateStateData(),Object.assign(this.data,c),this._initializeViewData(),this.one("play",l),this.one("adbreakstart",l)}),s.on("videochange",function(h,c){this._resetView(c)}),s.on("programchange",function(h,c){this.data.player_is_paused&&this.mux.log.warn("The `programchange` event is intended to be used when the content changes mid playback without the video source changing, however the video is not currently playing. If the video source is changing please use the videochange event otherwise you will lose startup time information."),this._resetView(Object.assign(c,{view_program_changed:!0})),l(),this.emit("play"),this.emit("playing")}),s.on("fragmentchange",function(h,c){this.currentFragmentPDT=c.currentFragmentPDT,this.currentFragmentStart=c.currentFragmentStart}),s.on("destroy",s.destroy),typeof window<"u"&&typeof window.addEventListener=="function"&&typeof window.removeEventListener=="function"){var d=function(){var h=typeof s.data.view_start<"u";s.mux.WINDOW_HIDDEN=document.visibilityState==="hidden",h&&s.mux.WINDOW_HIDDEN&&(s.data.player_is_paused||s.emit("hb"))};window.addEventListener("visibilitychange",d,!1);var m=function(h){h.persisted||s.destroy()};window.addEventListener("pagehide",m,!1),s.on("destroy",function(){window.removeEventListener("visibilitychange",d),window.removeEventListener("pagehide",m)})}s.on("playerready",function(h,c){Object.assign(this.data,c)}),i_.forEach(function(h){s.on(h,function(c,v){h.indexOf("ad")!==0&&this._updateStateData(),Object.assign(this.data,v),this._sanitizeData()}),s.on("after"+h,function(){(h!=="error"||this.errorTracker.viewErrored)&&this.send(h)})}),s.on("viewend",function(h,c){Object.assign(s.data,c)});var p=function(h){var c=this.mux.utils.now();this.data.player_init_time&&(this.data.player_startup_time=c-this.data.player_init_time),!this.mux.PLAYER_TRACKED&&this.NAVIGATION_START&&(this.mux.PLAYER_TRACKED=!0,(this.data.player_init_time||this.DOM_CONTENT_LOADED_EVENT_END)&&(this.data.page_load_time=Math.min(this.data.player_init_time||1/0,this.DOM_CONTENT_LOADED_EVENT_END||1/0)-this.NAVIGATION_START)),this.send("playerready"),delete this.data.player_startup_time,delete this.data.page_load_time};return s.one("playerready",p),s.longResumeTracker=new t_(P(s)),s.errorTracker=new aE(P(s)),new IE(P(s)),s.seekingTracker=new gE(P(s)),s.playheadTime=new dE(P(s)),s.playbackHeartbeat=new tE(P(s)),new EE(P(s)),s.watchTimeTracker=new nE(P(s)),new oE(P(s)),s.adTracker=new AE(P(s)),new mE(P(s)),new cE(P(s)),new vE(P(s)),new SE(P(s)),new XE(P(s)),n.hlsjs&&s.addHLSJS(n),n.dashjs&&s.addDashJS(n),s.emit("viewinit",n.data),s}return Gt(i,[{key:"emit",value:function(a,r){var n,s=Object.assign({viewer_time:this.mux.utils.now()},r),o=[a,s];if(this.emitTranslator)try{o=this.emitTranslator(a,s)}catch(l){this.mux.log.warn("Exception in emit translator callback.",l)}o!=null&&o.length&&(n=Kn(ja(i.prototype),"emit",this)).call.apply(n,[this].concat(mt(o)))}},{key:"destroy",value:function(){this._destroyed||(this._destroyed=!0,typeof this.data.view_start<"u"&&(this.emit("viewend"),this.send("viewend")),this.playbackEventDispatcher.destroy(),this.removeHLSJS(),this.removeDashJS(),window.clearTimeout(this._heartBeatTimeout))}},{key:"send",value:function(a){if(this.data.view_id){var r=Object.assign({},this.data),n=["player_program_time","player_manifest_newest_program_time","player_live_edge_program_time","player_program_time","video_holdback","video_part_holdback","video_target_duration","video_part_target_duration"];if(r.video_source_is_live===void 0&&(r.player_source_duration===1/0||r.video_source_duration===1/0?r.video_source_is_live=!0:(r.player_source_duration>0||r.video_source_duration>0)&&(r.video_source_is_live=!1)),r.video_source_is_live||n.forEach(function(d){r[d]=void 0}),r.video_source_url=r.video_source_url||r.player_source_url,r.video_source_url){var s=ai(nn(r.video_source_url),2),o=s[0],l=s[1];r.video_source_domain=l,r.video_source_hostname=o}delete r.ad_request_id,this.playbackEventDispatcher.send(a,r),this.data.view_sequence_number++,this.data.player_sequence_number++,a_.has(a)||this._restartHeartBeat(),a==="viewend"&&delete this.data.view_id}}},{key:"_resetView",value:function(a){this.emit("viewend"),this.send("viewend"),this.emit("viewinit",a)}},{key:"_updateStateData",value:function(){var a=this.getStateData();if(typeof this.stateDataTranslator=="function")try{a=this.stateDataTranslator(a)}catch(r){this.mux.log.warn("Exception in stateDataTranslator translator callback.",r)}Object.assign(this.data,a),this.playheadTime._updatePlayheadTime(),this._sanitizeData()}},{key:"_sanitizeData",value:function(){var a=this,r=["player_width","player_height","video_source_width","video_source_height","player_playhead_time","video_source_bitrate"];r.forEach(function(s){var o=parseInt(a.data[s],10);a.data[s]=isNaN(o)?void 0:o});var n=["player_source_url","video_source_url"];n.forEach(function(s){if(a.data[s]){var o=a.data[s].toLowerCase();(o.indexOf("data:")===0||o.indexOf("blob:")===0)&&(a.data[s]="MSE style URL")}})}},{key:"_resetVideoData",value:function(){var a=this;Object.keys(this.data).forEach(function(r){r.indexOf("video_")===0&&delete a.data[r]})}},{key:"_resetViewData",value:function(){var a=this;Object.keys(this.data).forEach(function(r){r.indexOf("view_")===0&&delete a.data[r]}),this.data.view_sequence_number=1}},{key:"_resetErrorData",value:function(){delete this.data.player_error_code,delete this.data.player_error_message,delete this.data.player_error_context,delete this.data.player_error_severity,delete this.data.player_error_business_exception}},{key:"_initializeViewData",value:function(){var a=this,r=this.data.view_id=rn(),n=function(){r===a.data.view_id&&_e(a.data,"player_view_count",1)};this.data.player_is_paused?this.one("play",n):n()}},{key:"_restartHeartBeat",value:function(){var a=this;window.clearTimeout(this._heartBeatTimeout),this._heartBeatTimeout=window.setTimeout(function(){a.data.player_is_paused||a.emit("hb")},1e4)}},{key:"addHLSJS",value:function(a){if(!a.hlsjs){this.mux.log.warn("You must pass a valid hlsjs instance in order to track it.");return}if(this.hlsjs){this.mux.log.warn("An instance of HLS.js is already being monitored for this player.");return}this.hlsjs=a.hlsjs,qf(this.mux,this.id,a.hlsjs,{},a.Hls||window.Hls)}},{key:"removeHLSJS",value:function(){this.hlsjs&&(Yf(this.hlsjs),this.hlsjs=void 0)}},{key:"addDashJS",value:function(a){if(!a.dashjs){this.mux.log.warn("You must pass a valid dashjs instance in order to track it.");return}if(this.dashjs){this.mux.log.warn("An instance of Dash.js is already being monitored for this player.");return}this.dashjs=a.dashjs,Zf(this.mux,this.id,a.dashjs)}},{key:"removeDashJS",value:function(){this.dashjs&&(jf(this.dashjs),this.dashjs=void 0)}}]),i})(Jf),n_=r_,cr=Xe(om());function s_(){return cr.default&&!!(cr.default.fullscreenElement||cr.default.webkitFullscreenElement||cr.default.mozFullScreenElement||cr.default.msFullscreenElement)}var o_=["loadstart","pause","play","playing","seeking","seeked","timeupdate","ratechange","stalled","waiting","error","ended"],l_={1:"MEDIA_ERR_ABORTED",2:"MEDIA_ERR_NETWORK",3:"MEDIA_ERR_DECODE",4:"MEDIA_ERR_SRC_NOT_SUPPORTED"};function d_(t,e,i){var a=ai(js(e),3),r=a[0],n=a[1],s=a[2],o=t.log,l=t.utils.getComputedStyle,d=t.utils.secondsToMs,m={automaticErrorTracking:!0};if(r){if(s!=="video"&&s!=="audio")return o.error("The element of `"+n+"` was not a media element.")}else return o.error("No element was found with the `"+n+"` query selector.");r.mux&&(r.mux.destroy(),delete r.mux,o.warn("Already monitoring this video element, replacing existing event listeners"));var p={getPlayheadTime:function(){return d(r.currentTime)},getStateData:function(){var c,v,E,g=((c=(v=this).getPlayheadTime)===null||c===void 0?void 0:c.call(v))||d(r.currentTime),y=this.hlsjs&&this.hlsjs.url,T=this.dashjs&&typeof this.dashjs.getSource=="function"&&this.dashjs.getSource(),_={player_is_paused:r.paused,player_width:parseInt(l(r,"width")),player_height:parseInt(l(r,"height")),player_autoplay_on:r.autoplay,player_preload_on:r.preload,player_language_code:r.lang,player_is_fullscreen:s_(),video_poster_url:r.poster,video_source_url:y||T||r.currentSrc,video_source_duration:d(r.duration),video_source_height:r.videoHeight,video_source_width:r.videoWidth,view_dropped_frame_count:r==null||(E=r.getVideoPlaybackQuality)===null||E===void 0?void 0:E.call(r).droppedVideoFrames};if(r.getStartDate&&g>0){var S=r.getStartDate();if(S&&typeof S.getTime=="function"&&S.getTime()){var C=S.getTime();if(_.player_program_time=C+g,r.seekable.length>0){var N=C+r.seekable.end(r.seekable.length-1);_.player_live_edge_program_time=N}}}return _}};i=Object.assign(m,i,p),i.data=Object.assign({player_software:"HTML5 Video Element",player_mux_plugin_name:"VideoElementMonitor",player_mux_plugin_version:t.VERSION},i.data),r.mux=r.mux||{},r.mux.deleted=!1,r.mux.emit=function(c,v){t.emit(n,c,v)},r.mux.updateData=function(c){r.mux.emit("hb",c)};var h=function(){o.error("The monitor for this video element has already been destroyed.")};r.mux.destroy=function(){Object.keys(r.mux.listeners).forEach(function(c){r.removeEventListener(c,r.mux.listeners[c],!1)}),delete r.mux.listeners,r.mux.destroy=h,r.mux.swapElement=h,r.mux.emit=h,r.mux.addHLSJS=h,r.mux.addDashJS=h,r.mux.removeHLSJS=h,r.mux.removeDashJS=h,r.mux.updateData=h,r.mux.setEmitTranslator=h,r.mux.setStateDataTranslator=h,r.mux.setGetPlayheadTime=h,r.mux.deleted=!0,t.emit(n,"destroy")},r.mux.swapElement=function(c){var v=ai(js(c),3),E=v[0],g=v[1],y=v[2];if(E){if(y!=="video"&&y!=="audio")return t.log.error("The element of `"+g+"` was not a media element.")}else return t.log.error("No element was found with the `"+g+"` query selector.");E.muxId=r.muxId,delete r.muxId,E.mux=E.mux||{},E.mux.listeners=Object.assign({},r.mux.listeners),delete r.mux.listeners,Object.keys(E.mux.listeners).forEach(function(T){r.removeEventListener(T,E.mux.listeners[T],!1),E.addEventListener(T,E.mux.listeners[T],!1)}),E.mux.swapElement=r.mux.swapElement,E.mux.destroy=r.mux.destroy,delete r.mux,r=E},r.mux.addHLSJS=function(c){t.addHLSJS(n,c)},r.mux.addDashJS=function(c){t.addDashJS(n,c)},r.mux.removeHLSJS=function(){t.removeHLSJS(n)},r.mux.removeDashJS=function(){t.removeDashJS(n)},r.mux.setEmitTranslator=function(c){t.setEmitTranslator(n,c)},r.mux.setStateDataTranslator=function(c){t.setStateDataTranslator(n,c)},r.mux.setGetPlayheadTime=function(c){c||(c=i.getPlayheadTime),t.setGetPlayheadTime(n,c)},t.init(n,i),t.emit(n,"playerready"),r.paused||(t.emit(n,"play"),r.readyState>2&&t.emit(n,"playing")),r.mux.listeners={},o_.forEach(function(c){c==="error"&&!i.automaticErrorTracking||(r.mux.listeners[c]=function(){var v={};if(c==="error"){if(!r.error||r.error.code===1)return;v.player_error_code=r.error.code,v.player_error_message=l_[r.error.code]||r.error.message}t.emit(n,c,v)},r.addEventListener(c,r.mux.listeners[c],!1))})}function u_(t,e,i,a){var r=a;if(t&&typeof t[e]=="function")try{r=t[e].apply(t,i)}catch(n){ee.info("safeCall error",n)}return r}var Yr=Xe(yt()),pa;Yr.default&&Yr.default.WeakMap&&(pa=new WeakMap);function c_(t,e){if(!t||!e||!Yr.default||typeof Yr.default.getComputedStyle!="function")return"";var i;return pa&&pa.has(t)&&(i=pa.get(t)),i||(i=Yr.default.getComputedStyle(t,null),pa&&pa.set(t,i)),i.getPropertyValue(e)}function h_(t){return Math.floor(t*1e3)}var Ri={TARGET_DURATION:"#EXT-X-TARGETDURATION",PART_INF:"#EXT-X-PART-INF",SERVER_CONTROL:"#EXT-X-SERVER-CONTROL",INF:"#EXTINF",PROGRAM_DATE_TIME:"#EXT-X-PROGRAM-DATE-TIME",VERSION:"#EXT-X-VERSION",SESSION_DATA:"#EXT-X-SESSION-DATA"},Ro=function(t){return this.buffer="",this.manifest={segments:[],serverControl:{},sessionData:{}},this.currentUri={},this.process(t),this.manifest};Ro.prototype.process=function(t){var e;for(this.buffer+=t,e=this.buffer.indexOf(`
`);e>-1;e=this.buffer.indexOf(`
`))this.processLine(this.buffer.substring(0,e)),this.buffer=this.buffer.substring(e+1)};Ro.prototype.processLine=function(t){var e=t.indexOf(":"),i=f_(t,e),a=i[0],r=i.length===2?$d(i[1]):void 0;if(a[0]!=="#")this.currentUri.uri=a,this.manifest.segments.push(this.currentUri),this.manifest.targetDuration&&!("duration"in this.currentUri)&&(this.currentUri.duration=this.manifest.targetDuration),this.currentUri={};else switch(a){case Ri.TARGET_DURATION:{if(!isFinite(r)||r<0)return;this.manifest.targetDuration=r,this.setHoldBack();break}case Ri.PART_INF:{Jo(this.manifest,i),this.manifest.partInf.partTarget&&(this.manifest.partTargetDuration=this.manifest.partInf.partTarget),this.setHoldBack();break}case Ri.SERVER_CONTROL:{Jo(this.manifest,i),this.setHoldBack();break}case Ri.INF:{r===0?this.currentUri.duration=.01:r>0&&(this.currentUri.duration=r);break}case Ri.PROGRAM_DATE_TIME:{var n=r,s=new Date(n);this.manifest.dateTimeString||(this.manifest.dateTimeString=n,this.manifest.dateTimeObject=s),this.currentUri.dateTimeString=n,this.currentUri.dateTimeObject=s;break}case Ri.VERSION:{Jo(this.manifest,i);break}case Ri.SESSION_DATA:{var o=E_(i[1]),l=cm(o);Object.assign(this.manifest.sessionData,l)}}};Ro.prototype.setHoldBack=function(){var t=this.manifest,e=t.serverControl,i=t.targetDuration,a=t.partTargetDuration;if(e){var r="holdBack",n="partHoldBack",s=i&&i*3,o=a&&a*2;i&&!e.hasOwnProperty(r)&&(e[r]=s),s&&e[r]<s&&(e[r]=s),a&&!e.hasOwnProperty(n)&&(e[n]=a*3),a&&e[n]<o&&(e[n]=o)}};var Jo=function(t,e){var i=gm(e[0].replace("#EXT-X-","")),a;v_(e[1])?(a={},a=Object.assign(p_(e[1]),a)):a=$d(e[1]),t[i]=a},gm=function(t){return t.toLowerCase().replace(/-(\w)/g,function(e){return e[1].toUpperCase()})},$d=function(t){if(t.toLowerCase()==="yes"||t.toLowerCase()==="no")return t.toLowerCase()==="yes";var e=t.indexOf(":")!==-1?t:parseFloat(t);return isNaN(e)?t:e},m_=function(t){var e={},i=t.split("=");if(i.length>1){var a=gm(i[0]);e[a]=$d(i[1])}return e},p_=function(t){for(var e=t.split(","),i={},a=0;e.length>a;a++){var r=e[a],n=m_(r);i=Object.assign(n,i)}return i},v_=function(t){return t.indexOf("=")>-1},f_=function(t,e){return e===-1?[t]:[t.substring(0,e),t.substring(e+1)]},E_=function(t){var e={};if(t){var i=t.search(","),a=t.slice(0,i),r=t.slice(i+1),n=[a,r];return n.forEach(function(s,o){for(var l=s.replace(/['"]+/g,"").split("="),d=0;d<l.length;d++)l[d]==="DATA-ID"&&(e["DATA-ID"]=l[1-d]),l[d]==="VALUE"&&(e.VALUE=l[1-d])}),{data:e}}},__=Ro,b_={safeCall:u_,safeIncrement:_e,getComputedStyle:c_,secondsToMs:h_,assign:Object.assign,headersStringToObject:Ud,cdnHeadersToRequestId:eo,extractHostnameAndDomain:nn,extractHostname:_t,manifestParser:__,generateShortID:dm,generateUUID:rn,now:be.now,findMediaElement:js},g_=b_,y_={PLAYER_READY:"playerready",VIEW_INIT:"viewinit",VIDEO_CHANGE:"videochange",PLAY:"play",PAUSE:"pause",PLAYING:"playing",TIME_UPDATE:"timeupdate",SEEKING:"seeking",SEEKED:"seeked",REBUFFER_START:"rebufferstart",REBUFFER_END:"rebufferend",ERROR:"error",ENDED:"ended",RENDITION_CHANGE:"renditionchange",ORIENTATION_CHANGE:"orientationchange",AD_REQUEST:"adrequest",AD_RESPONSE:"adresponse",AD_BREAK_START:"adbreakstart",AD_PLAY:"adplay",AD_PLAYING:"adplaying",AD_PAUSE:"adpause",AD_FIRST_QUARTILE:"adfirstquartile",AD_MID_POINT:"admidpoint",AD_THIRD_QUARTILE:"adthirdquartile",AD_ENDED:"adended",AD_BREAK_END:"adbreakend",AD_ERROR:"aderror",REQUEST_COMPLETED:"requestcompleted",REQUEST_FAILED:"requestfailed",REQUEST_CANCELLED:"requestcanceled",HEARTBEAT:"hb",DESTROY:"destroy"},T_=y_,A_="mux-embed",k_="5.9.0",S_="2.1",pe={},Ai=function(t){var e=arguments;typeof t=="string"?Ai.hasOwnProperty(t)?qr.default.setTimeout(function(){e=Array.prototype.splice.call(e,1),Ai[t].apply(null,e)},0):ee.warn("`"+t+"` is an unknown task"):typeof t=="function"?qr.default.setTimeout(function(){t(Ai)},0):ee.warn("`"+t+"` is invalid.")},w_={loaded:be.now(),NAME:A_,VERSION:k_,API_VERSION:S_,PLAYER_TRACKED:!1,monitor:function(t,e){return d_(Ai,t,e)},destroyMonitor:function(t){var e=ai(js(t),1),i=e[0];i&&i.mux&&typeof i.mux.destroy=="function"?i.mux.destroy():ee.error("A video element monitor for `"+t+"` has not been initialized via `mux.monitor`.")},addHLSJS:function(t,e){var i=ht(t);pe[i]?pe[i].addHLSJS(e):ee.error("A monitor for `"+i+"` has not been initialized.")},addDashJS:function(t,e){var i=ht(t);pe[i]?pe[i].addDashJS(e):ee.error("A monitor for `"+i+"` has not been initialized.")},removeHLSJS:function(t){var e=ht(t);pe[e]?pe[e].removeHLSJS():ee.error("A monitor for `"+e+"` has not been initialized.")},removeDashJS:function(t){var e=ht(t);pe[e]?pe[e].removeDashJS():ee.error("A monitor for `"+e+"` has not been initialized.")},init:function(t,e){gl()&&e&&e.respectDoNotTrack&&ee.info("The browser's Do Not Track flag is enabled - Mux beaconing is disabled.");var i=ht(t);pe[i]=new n_(Ai,i,e)},emit:function(t,e,i){var a=ht(t);pe[a]?(pe[a].emit(e,i),e==="destroy"&&delete pe[a]):ee.error("A monitor for `"+a+"` has not been initialized.")},updateData:function(t,e){var i=ht(t);pe[i]?pe[i].emit("hb",e):ee.error("A monitor for `"+i+"` has not been initialized.")},setEmitTranslator:function(t,e){var i=ht(t);pe[i]?pe[i].emitTranslator=e:ee.error("A monitor for `"+i+"` has not been initialized.")},setStateDataTranslator:function(t,e){var i=ht(t);pe[i]?pe[i].stateDataTranslator=e:ee.error("A monitor for `"+i+"` has not been initialized.")},setGetPlayheadTime:function(t,e){var i=ht(t);pe[i]?pe[i].getPlayheadTime=e:ee.error("A monitor for `"+i+"` has not been initialized.")},checkDoNotTrack:gl,log:ee,utils:g_,events:T_,WINDOW_HIDDEN:!1,WINDOW_UNLOADING:!1};Object.assign(Ai,w_);typeof qr.default<"u"&&typeof qr.default.addEventListener=="function"&&qr.default.addEventListener("pagehide",function(t){t.persisted||(Ai.WINDOW_UNLOADING=!0)},!1);var Hd=Ai;var B=uf,te={VIDEO:"video",THUMBNAIL:"thumbnail",STORYBOARD:"storyboard",DRM:"drm"},x={NOT_AN_ERROR:0,NETWORK_OFFLINE:2000002,NETWORK_UNKNOWN_ERROR:2e6,NETWORK_NO_STATUS:2000001,NETWORK_INVALID_URL:24e5,NETWORK_NOT_FOUND:2404e3,NETWORK_NOT_READY:2412e3,NETWORK_GENERIC_SERVER_FAIL:25e5,NETWORK_TOKEN_MISSING:2403201,NETWORK_TOKEN_MALFORMED:2412202,NETWORK_TOKEN_EXPIRED:2403210,NETWORK_TOKEN_AUD_MISSING:2403221,NETWORK_TOKEN_AUD_MISMATCH:2403222,NETWORK_TOKEN_SUB_MISMATCH:2403232,ENCRYPTED_ERROR:5e6,ENCRYPTED_UNSUPPORTED_KEY_SYSTEM:5000001,ENCRYPTED_GENERATE_REQUEST_FAILED:5000002,ENCRYPTED_UPDATE_LICENSE_FAILED:5000003,ENCRYPTED_UPDATE_SERVER_CERT_FAILED:5000004,ENCRYPTED_CDM_ERROR:5000005,ENCRYPTED_OUTPUT_RESTRICTED:5000006,ENCRYPTED_MISSING_TOKEN:5000002},Co=t=>t===te.VIDEO?"playback":t,ci=class Tr extends Error{constructor(e,i=Tr.MEDIA_ERR_CUSTOM,a,r){var n;super(e),this.name="MediaError",this.code=i,this.context=r,this.fatal=a??(i>=Tr.MEDIA_ERR_NETWORK&&i<=Tr.MEDIA_ERR_ENCRYPTED),this.message||(this.message=(n=Tr.defaultMessages[this.code])!=null?n:"")}};ci.MEDIA_ERR_ABORTED=1,ci.MEDIA_ERR_NETWORK=2,ci.MEDIA_ERR_DECODE=3,ci.MEDIA_ERR_SRC_NOT_SUPPORTED=4,ci.MEDIA_ERR_ENCRYPTED=5,ci.MEDIA_ERR_CUSTOM=100,ci.defaultMessages={1:"You aborted the media playback",2:"A network error caused the media download to fail.",3:"A media error caused playback to be aborted. The media could be corrupt or your browser does not support this format.",4:"An unsupported error occurred. The server or network failed, or your browser does not support this format.",5:"The media is encrypted and there are no keys to decrypt it."};var R=ci,I_=t=>t==null,Bd=(t,e)=>I_(e)?!1:t in e,Al={ANY:"any",MUTED:"muted"},Q={ON_DEMAND:"on-demand",LIVE:"live",UNKNOWN:"unknown"},Ft={MSE:"mse",NATIVE:"native"},Ar={HEADER:"header",QUERY:"query",NONE:"none"},to=Object.values(Ar),ti={M3U8:"application/vnd.apple.mpegurl",MP4:"video/mp4"},Sc={HLS:ti.M3U8};[...Object.values(ti)];var AA={upTo720p:"720p",upTo1080p:"1080p",upTo1440p:"1440p",upTo2160p:"2160p"},kA={noLessThan480p:"480p",noLessThan540p:"540p",noLessThan720p:"720p",noLessThan1080p:"1080p",noLessThan1440p:"1440p",noLessThan2160p:"2160p"},SA={DESCENDING:"desc"},R_="en",kl={code:R_},fe=(t,e,i,a,r=t)=>{r.addEventListener(e,i,a),t.addEventListener("teardown",()=>{r.removeEventListener(e,i)},{once:!0})};function C_(t,e,i){e&&i>e&&(i=e);for(let a=0;a<t.length;a++)if(t.start(a)<=i&&t.end(a)>=i)return!0;return!1}var Wd=t=>{let e=t.indexOf("?");if(e<0)return[t];let i=t.slice(0,e),a=t.slice(e);return[i,a]},Lo=t=>{let{type:e}=t;if(e){let i=e.toUpperCase();return Bd(i,Sc)?Sc[i]:e}return L_(t)},ym=t=>t==="VOD"?Q.ON_DEMAND:Q.LIVE,Tm=t=>t==="EVENT"?Number.POSITIVE_INFINITY:t==="VOD"?Number.NaN:0,L_=t=>{let{src:e}=t;if(!e)return"";let i="";try{i=new URL(e).pathname}catch{console.error("invalid url")}let a=i.lastIndexOf(".");if(a<0)return M_(t)?ti.M3U8:"";let r=i.slice(a+1).toUpperCase();return Bd(r,ti)?ti[r]:""},D_="mux.com",M_=({src:t,customDomain:e=D_})=>{let i;try{i=new URL(`${t}`)}catch{return!1}let a=i.protocol==="https:",r=i.hostname===`stream.${e}`.toLowerCase(),n=i.pathname.split("/"),s=n.length===2,o=!(n!=null&&n[1].includes("."));return a&&r&&s&&o},Fa=t=>{let e=(t??"").split(".")[1];if(e)try{let i=e.replace(/-/g,"+").replace(/_/g,"/"),a=decodeURIComponent(atob(i).split("").map(function(r){return"%"+("00"+r.charCodeAt(0).toString(16)).slice(-2)}).join(""));return JSON.parse(a)}catch{return}},x_=({exp:t},e=Date.now())=>!t||t*1e3<e,O_=({sub:t},e)=>t!==e,N_=({aud:t},e)=>!t,P_=({aud:t},e)=>t!==e,Am="en";function D(t,e=!0){var i,a;let r=e&&(a=(i=kl)==null?void 0:i[t])!=null?a:t,n=e?kl.code:Am;return new U_(r,n)}var U_=class{constructor(t,e=(i=>(i=kl)!=null?i:Am)()){this.message=t,this.locale=e}format(t){return this.message.replace(/\{(\w+)\}/g,(e,i)=>{var a;return(a=t[i])!=null?a:""})}toString(){return this.message}},$_=Object.values(Al),wc=t=>typeof t=="boolean"||typeof t=="string"&&$_.includes(t),H_=(t,e,i)=>{let{autoplay:a}=t,r=!1,n=!1,s=wc(a)?a:!!a,o=()=>{r||fe(e,"playing",()=>{r=!0},{once:!0})};if(o(),fe(e,"loadstart",()=>{r=!1,o(),el(e,s)},{once:!0}),fe(e,"loadstart",()=>{i||(t.streamType&&t.streamType!==Q.UNKNOWN?n=t.streamType===Q.LIVE:n=!Number.isFinite(e.duration)),el(e,s)},{once:!0}),i&&i.once(B.Events.LEVEL_LOADED,(l,d)=>{var m;t.streamType&&t.streamType!==Q.UNKNOWN?n=t.streamType===Q.LIVE:n=(m=d.details.live)!=null?m:!1}),!s){let l=()=>{!n||Number.isFinite(t.startTime)||(i!=null&&i.liveSyncPosition?e.currentTime=i.liveSyncPosition:Number.isFinite(e.seekable.end(0))&&(e.currentTime=e.seekable.end(0)))};i&&fe(e,"play",()=>{e.preload==="metadata"?i.once(B.Events.LEVEL_UPDATED,l):l()},{once:!0})}return l=>{r||(s=wc(l)?l:!!l,el(e,s))}},el=(t,e)=>{if(!e)return;let i=t.muted,a=()=>t.muted=i;switch(e){case Al.ANY:t.play().catch(()=>{t.muted=!0,t.play().catch(a)});break;case Al.MUTED:t.muted=!0,t.play().catch(a);break;default:t.play().catch(()=>{});break}},B_=({preload:t,src:e},i,a)=>{let r=p=>{p!=null&&["","none","metadata","auto"].includes(p)?i.setAttribute("preload",p):i.removeAttribute("preload")};if(!a)return r(t),r;let n=!1,s=!1,o=a.config.maxBufferLength,l=a.config.maxBufferSize,d=p=>{r(p);let h=p??i.preload;s||h==="none"||(h==="metadata"?(a.config.maxBufferLength=1,a.config.maxBufferSize=1):(a.config.maxBufferLength=o,a.config.maxBufferSize=l),m())},m=()=>{!n&&e&&(n=!0,a.loadSource(e))};return fe(i,"play",()=>{s=!0,a.config.maxBufferLength=o,a.config.maxBufferSize=l,m()},{once:!0}),d(t),d};function W_(t,e){var i;if(!("videoTracks"in t))return;let a=new WeakMap;e.on(B.Events.MANIFEST_PARSED,function(l,d){o();let m=t.addVideoTrack("main");m.selected=!0;for(let[p,h]of d.levels.entries()){let c=m.addRendition(h.url[0],h.width,h.height,h.videoCodec,h.bitrate);a.set(h,`${p}`),c.id=`${p}`}}),e.on(B.Events.AUDIO_TRACKS_UPDATED,function(l,d){s();for(let m of d.audioTracks){let p=m.default?"main":"alternative",h=t.addAudioTrack(p,m.name,m.lang);h.id=`${m.id}`,m.default&&(h.enabled=!0)}}),t.audioTracks.addEventListener("change",()=>{var l;let d=+((l=[...t.audioTracks].find(p=>p.enabled))==null?void 0:l.id),m=e.audioTracks.map(p=>p.id);d!=e.audioTrack&&m.includes(d)&&(e.audioTrack=d)}),e.on(B.Events.LEVELS_UPDATED,function(l,d){var m;let p=t.videoTracks[(m=t.videoTracks.selectedIndex)!=null?m:0];if(!p)return;let h=d.levels.map(c=>a.get(c));for(let c of t.videoRenditions)c.id&&!h.includes(c.id)&&p.removeRendition(c)});let r=l=>{let d=l.target.selectedIndex;d!=e.nextLevel&&(e.nextLevel=d)};(i=t.videoRenditions)==null||i.addEventListener("change",r);let n=()=>{for(let l of t.videoTracks)t.removeVideoTrack(l)},s=()=>{for(let l of t.audioTracks)t.removeAudioTrack(l)},o=()=>{n(),s()};e.once(B.Events.DESTROYING,o)}var tl=t=>"time"in t?t.time:t.startTime;function F_(t,e){e.on(B.Events.NON_NATIVE_TEXT_TRACKS_FOUND,(r,{tracks:n})=>{n.forEach(s=>{var o,l;let d=(o=s.subtitleTrack)!=null?o:s.closedCaptions,m=e.subtitleTracks.findIndex(({lang:h,name:c,type:v})=>h==d?.lang&&c===s.label&&v.toLowerCase()===s.kind),p=((l=s._id)!=null?l:s.default)?"default":`${s.kind}${m}`;Fd(t,s.kind,s.label,d?.lang,p,s.default)})});let i=()=>{if(!e.subtitleTracks.length)return;let r=Array.from(t.textTracks).find(o=>o.id&&o.mode==="showing"&&["subtitles","captions"].includes(o.kind));if(!r)return;let n=e.subtitleTracks[e.subtitleTrack],s=n?n.default?"default":`${e.subtitleTracks[e.subtitleTrack].type.toLowerCase()}${e.subtitleTrack}`:void 0;if(e.subtitleTrack<0||r?.id!==s){let o=e.subtitleTracks.findIndex(({lang:l,name:d,type:m,default:p})=>r.id==="default"&&p||l==r.language&&d===r.label&&m.toLowerCase()===r.kind);e.subtitleTrack=o}r?.id===s&&r.cues&&Array.from(r.cues).forEach(o=>{r.addCue(o)})};t.textTracks.addEventListener("change",i),e.on(B.Events.CUES_PARSED,(r,{track:n,cues:s})=>{let o=t.textTracks.getTrackById(n);if(!o)return;let l=o.mode==="disabled";l&&(o.mode="hidden"),s.forEach(d=>{var m;(m=o.cues)!=null&&m.getCueById(d.id)||o.addCue(d)}),l&&(o.mode="disabled")}),e.once(B.Events.DESTROYING,()=>{t.textTracks.removeEventListener("change",i),t.querySelectorAll("track[data-removeondestroy]").forEach(r=>{r.remove()})});let a=()=>{Array.from(t.textTracks).forEach(r=>{var n,s;if(!["subtitles","caption"].includes(r.kind)&&(r.label==="thumbnails"||r.kind==="chapters")){if(!((n=r.cues)!=null&&n.length)){let o="track";r.kind&&(o+=`[kind="${r.kind}"]`),r.label&&(o+=`[label="${r.label}"]`);let l=t.querySelector(o),d=(s=l?.getAttribute("src"))!=null?s:"";l?.removeAttribute("src"),setTimeout(()=>{l?.setAttribute("src",d)},0)}r.mode!=="hidden"&&(r.mode="hidden")}})};e.once(B.Events.MANIFEST_LOADED,a),e.once(B.Events.MEDIA_ATTACHED,a)}function Fd(t,e,i,a,r,n){let s=document.createElement("track");return s.kind=e,s.label=i,a&&(s.srclang=a),r&&(s.id=r),n&&(s.default=!0),s.track.mode=["subtitles","captions"].includes(e)?"disabled":"hidden",s.setAttribute("data-removeondestroy",""),t.append(s),s.track}function K_(t,e){let i=Array.prototype.find.call(t.querySelectorAll("track"),a=>a.track===e);i?.remove()}function gn(t,e,i){var a;return(a=Array.from(t.querySelectorAll("track")).find(r=>r.track.label===e&&r.track.kind===i))==null?void 0:a.track}async function km(t,e,i,a){let r=gn(t,i,a);return r||(r=Fd(t,a,i),r.mode="hidden",await new Promise(n=>setTimeout(()=>n(void 0),0))),r.mode!=="hidden"&&(r.mode="hidden"),[...e].sort((n,s)=>tl(s)-tl(n)).forEach(n=>{var s,o;let l=n.value,d=tl(n);if("endTime"in n&&n.endTime!=null)r?.addCue(new VTTCue(d,n.endTime,a==="chapters"?l:JSON.stringify(l??null)));else{let m=Array.prototype.findIndex.call(r?.cues,v=>v.startTime>=d),p=(s=r?.cues)==null?void 0:s[m],h=p?p.startTime:Number.isFinite(t.duration)?t.duration:Number.MAX_SAFE_INTEGER,c=(o=r?.cues)==null?void 0:o[m-1];c&&(c.endTime=d),r?.addCue(new VTTCue(d,h,a==="chapters"?l:JSON.stringify(l??null)))}}),t.textTracks.dispatchEvent(new Event("change",{bubbles:!0,composed:!0})),r}var Kd="cuepoints",Sm=Object.freeze({label:Kd});async function wm(t,e,i=Sm){return km(t,e,i.label,"metadata")}var Sl=t=>({time:t.startTime,value:JSON.parse(t.text)});function V_(t,e={label:Kd}){let i=gn(t,e.label,"metadata");return i!=null&&i.cues?Array.from(i.cues,a=>Sl(a)):[]}function Im(t,e={label:Kd}){var i,a;let r=gn(t,e.label,"metadata");if(!((i=r?.activeCues)!=null&&i.length))return;if(r.activeCues.length===1)return Sl(r.activeCues[0]);let{currentTime:n}=t,s=Array.prototype.find.call((a=r.activeCues)!=null?a:[],({startTime:o,endTime:l})=>o<=n&&l>n);return Sl(s||r.activeCues[0])}async function q_(t,e=Sm){return new Promise(i=>{fe(t,"loadstart",async()=>{let a=await wm(t,[],e);fe(t,"cuechange",()=>{let r=Im(t);if(r){let n=new CustomEvent("cuepointchange",{composed:!0,bubbles:!0,detail:r});t.dispatchEvent(n)}},{},a),i(a)})})}var Vd="chapters",Rm=Object.freeze({label:Vd}),wl=t=>({startTime:t.startTime,endTime:t.endTime,value:t.text});async function Cm(t,e,i=Rm){return km(t,e,i.label,"chapters")}function Y_(t,e={label:Vd}){var i;let a=gn(t,e.label,"chapters");return(i=a?.cues)!=null&&i.length?Array.from(a.cues,r=>wl(r)):[]}function Lm(t,e={label:Vd}){var i,a;let r=gn(t,e.label,"chapters");if(!((i=r?.activeCues)!=null&&i.length))return;if(r.activeCues.length===1)return wl(r.activeCues[0]);let{currentTime:n}=t,s=Array.prototype.find.call((a=r.activeCues)!=null?a:[],({startTime:o,endTime:l})=>o<=n&&l>n);return wl(s||r.activeCues[0])}async function G_(t,e=Rm){return new Promise(i=>{fe(t,"loadstart",async()=>{let a=await Cm(t,[],e);fe(t,"cuechange",()=>{let r=Lm(t);if(r){let n=new CustomEvent("chapterchange",{composed:!0,bubbles:!0,detail:r});t.dispatchEvent(n)}},{},a),i(a)})})}function Q_(t,e){if(e){let i=e.playingDate;if(i!=null)return new Date(i.getTime()-t.currentTime*1e3)}return typeof t.getStartDate=="function"?t.getStartDate():new Date(NaN)}function z_(t,e){if(e&&e.playingDate)return e.playingDate;if(typeof t.getStartDate=="function"){let i=t.getStartDate();return new Date(i.getTime()+t.currentTime*1e3)}return new Date(NaN)}var Gr={VIDEO:"v",THUMBNAIL:"t",STORYBOARD:"s",DRM:"d"},Z_=t=>{if(t===te.VIDEO)return Gr.VIDEO;if(t===te.DRM)return Gr.DRM},j_=(t,e)=>{var i,a;let r=Co(t),n=`${r}Token`;return(i=e.tokens)!=null&&i[r]?(a=e.tokens)==null?void 0:a[r]:Bd(n,e)?e[n]:void 0},io=(t,e,i,a,r=!1,n=!(s=>(s=globalThis.navigator)==null?void 0:s.onLine)())=>{var s,o;if(n){let y=D("Your device appears to be offline",r),T,_=R.MEDIA_ERR_NETWORK,S=new R(y,_,!1,T);return S.errorCategory=e,S.muxCode=x.NETWORK_OFFLINE,S.data=t,S}let l="status"in t?t.status:t.code,d=Date.now(),m=R.MEDIA_ERR_NETWORK;if(l===200)return;let p=Co(e),h=j_(e,i),c=Z_(e),[v]=Wd((s=i.playbackId)!=null?s:"");if(!l||!v)return;let E=Fa(h);if(h&&!E){let y=D("The {tokenNamePrefix}-token provided is invalid or malformed.",r).format({tokenNamePrefix:p}),T=D("Compact JWT string: {token}",r).format({token:h}),_=new R(y,m,!0,T);return _.errorCategory=e,_.muxCode=x.NETWORK_TOKEN_MALFORMED,_.data=t,_}if(l>=500){let y=new R("",m,a??!0);return y.errorCategory=e,y.muxCode=x.NETWORK_UNKNOWN_ERROR,y}if(l===403)if(E){if(x_(E,d)){let y={timeStyle:"medium",dateStyle:"medium"},T=D("The video’s secured {tokenNamePrefix}-token has expired.",r).format({tokenNamePrefix:p}),_=D("Expired at: {expiredDate}. Current time: {currentDate}.",r).format({expiredDate:new Intl.DateTimeFormat("en",y).format((o=E.exp)!=null?o:0*1e3),currentDate:new Intl.DateTimeFormat("en",y).format(d)}),S=new R(T,m,!0,_);return S.errorCategory=e,S.muxCode=x.NETWORK_TOKEN_EXPIRED,S.data=t,S}if(O_(E,v)){let y=D("The video’s playback ID does not match the one encoded in the {tokenNamePrefix}-token.",r).format({tokenNamePrefix:p}),T=D("Specified playback ID: {playbackId} and the playback ID encoded in the {tokenNamePrefix}-token: {tokenPlaybackId}",r).format({tokenNamePrefix:p,playbackId:v,tokenPlaybackId:E.sub}),_=new R(y,m,!0,T);return _.errorCategory=e,_.muxCode=x.NETWORK_TOKEN_SUB_MISMATCH,_.data=t,_}if(N_(E)){let y=D("The {tokenNamePrefix}-token is formatted with incorrect information.",r).format({tokenNamePrefix:p}),T=D("The {tokenNamePrefix}-token has no aud value. aud value should be {expectedAud}.",r).format({tokenNamePrefix:p,expectedAud:c}),_=new R(y,m,!0,T);return _.errorCategory=e,_.muxCode=x.NETWORK_TOKEN_AUD_MISSING,_.data=t,_}if(P_(E,c)){let y=D("The {tokenNamePrefix}-token is formatted with incorrect information.",r).format({tokenNamePrefix:p}),T=D("The {tokenNamePrefix}-token has an incorrect aud value: {aud}. aud value should be {expectedAud}.",r).format({tokenNamePrefix:p,expectedAud:c,aud:E.aud}),_=new R(y,m,!0,T);return _.errorCategory=e,_.muxCode=x.NETWORK_TOKEN_AUD_MISMATCH,_.data=t,_}}else{let y=D("Authorization error trying to access this {category} URL. If this is a signed URL, you might need to provide a {tokenNamePrefix}-token.",r).format({tokenNamePrefix:p,category:e}),T=D("Specified playback ID: {playbackId}",r).format({playbackId:v}),_=new R(y,m,a??!0,T);return _.errorCategory=e,_.muxCode=x.NETWORK_TOKEN_MISSING,_.data=t,_}if(l===412){let y=D("This playback-id may belong to a live stream that is not currently active or an asset that is not ready.",r),T=D("Specified playback ID: {playbackId}",r).format({playbackId:v}),_=new R(y,m,a??!0,T);return _.errorCategory=e,_.muxCode=x.NETWORK_NOT_READY,_.streamType=i.streamType===Q.LIVE?"live":i.streamType===Q.ON_DEMAND?"on-demand":"unknown",_.data=t,_}if(l===404){let y=D("This URL or playback-id does not exist. You may have used an Asset ID or an ID from a different resource.",r),T=D("Specified playback ID: {playbackId}",r).format({playbackId:v}),_=new R(y,m,a??!0,T);return _.errorCategory=e,_.muxCode=x.NETWORK_NOT_FOUND,_.data=t,_}if(l===400){let y=D("The URL or playback-id was invalid. You may have used an invalid value as a playback-id."),T=D("Specified playback ID: {playbackId}",r).format({playbackId:v}),_=new R(y,m,a??!0,T);return _.errorCategory=e,_.muxCode=x.NETWORK_INVALID_URL,_.data=t,_}let g=new R("",m,a??!0);return g.errorCategory=e,g.muxCode=x.NETWORK_UNKNOWN_ERROR,g.data=t,g},Ic=B.DefaultConfig.capLevelController,X_={"720p":921600,"1080p":2073600,"1440p":4194304,"2160p":8294400};function J_(t){let e=t.toLowerCase().trim();return X_[e]}var Il=class kr extends Ic{constructor(e){super(e)}static setMaxAutoResolution(e,i){i?kr.maxAutoResolution.set(e,i):kr.maxAutoResolution.delete(e)}getMaxAutoResolution(){var e;let i=this.hls;return(e=kr.maxAutoResolution.get(i))!=null?e:void 0}get levels(){var e;return(e=this.hls.levels)!=null?e:[]}getValidLevels(e){return this.levels.filter((i,a)=>this.isLevelAllowed(i)&&a<=e)}getMaxLevelCapped(e){let i=this.getValidLevels(e),a=this.getMaxAutoResolution();if(!a)return super.getMaxLevel(e);let r=J_(a);if(!r)return super.getMaxLevel(e);let n=i.filter(l=>l.width*l.height<=r),s=n.findIndex(l=>l.width*l.height===r);if(s!==-1){let l=n[s];return i.findIndex(d=>d===l)}if(n.length===0)return 0;let o=n[n.length-1];return i.findIndex(l=>l===o)}getMaxLevel(e){if(this.getMaxAutoResolution()!==void 0)return this.getMaxLevelCapped(e);let i=super.getMaxLevel(e),a=this.getValidLevels(e);if(!a[i])return i;let r=Math.min(a[i].width,a[i].height),n=kr.minMaxResolution;return r>=n?i:Ic.getMaxLevelByMediaSize(a,n*(16/9),n)}};Il.minMaxResolution=720,Il.maxAutoResolution=new WeakMap;var eb=Il,il=eb,Vn={FAIRPLAY:"fairplay",PLAYREADY:"playready",WIDEVINE:"widevine"},tb=t=>{if(t.includes("fps"))return Vn.FAIRPLAY;if(t.includes("playready"))return Vn.PLAYREADY;if(t.includes("widevine"))return Vn.WIDEVINE},ib=t=>{let e=t.split(`
`).find((i,a,r)=>a&&r[a-1].startsWith("#EXT-X-STREAM-INF"));return fetch(e).then(i=>i.status!==200?Promise.reject(i):i.text())},ab=t=>{let e=t.split(`
`).filter(a=>a.startsWith("#EXT-X-SESSION-DATA"));if(!e.length)return{};let i={};for(let a of e){let r=nb(a),n=r["DATA-ID"];n&&(i[n]={...r})}return{sessionData:i}},rb=/([A-Z0-9-]+)="?(.*?)"?(?:,|$)/g;function nb(t){let e=[...t.matchAll(rb)];return Object.fromEntries(e.map(([,i,a])=>[i,a]))}var sb=t=>{var e,i,a;let r=t.split(`
`),n=(i=((e=r.find(d=>d.startsWith("#EXT-X-PLAYLIST-TYPE")))!=null?e:"").split(":")[1])==null?void 0:i.trim(),s=ym(n),o=Tm(n),l;if(s===Q.LIVE){let d=r.find(m=>m.startsWith("#EXT-X-PART-INF"));if(d)l=+d.split(":")[1].split("=")[1]*2;else{let m=r.find(h=>h.startsWith("#EXT-X-TARGETDURATION")),p=(a=m?.split(":"))==null?void 0:a[1];l=+(p??6)*3}}return{streamType:s,targetLiveWindow:o,liveEdgeStartOffset:l}},ob=async(t,e)=>{if(e===ti.MP4)return{streamType:Q.ON_DEMAND,targetLiveWindow:Number.NaN,liveEdgeStartOffset:void 0,sessionData:void 0};if(e===ti.M3U8){let i=await fetch(t);if(!i.ok)return Promise.reject(i);let a=await i.text(),r=await ib(a);return{...ab(a),...sb(r)}}return console.error(`Media type ${e} is an unrecognized or unsupported type for src ${t}.`),{streamType:void 0,targetLiveWindow:void 0,liveEdgeStartOffset:void 0,sessionData:void 0}},lb=async(t,e,i=Lo({src:t}))=>{var a,r,n,s;let{streamType:o,targetLiveWindow:l,liveEdgeStartOffset:d,sessionData:m}=await ob(t,i),p=m?.["com.apple.hls.chapters"];(p!=null&&p.URI||p!=null&&p.VALUE.toLocaleLowerCase().startsWith("http"))&&qd((a=p.URI)!=null?a:p.VALUE,e),((r=de.get(e))!=null?r:{}).liveEdgeStartOffset=d,((n=de.get(e))!=null?n:{}).targetLiveWindow=l,e.dispatchEvent(new CustomEvent("targetlivewindowchange",{composed:!0,bubbles:!0})),((s=de.get(e))!=null?s:{}).streamType=o,e.dispatchEvent(new CustomEvent("streamtypechange",{composed:!0,bubbles:!0}))},qd=async(t,e)=>{var i,a;try{let r=await fetch(t);if(!r.ok)throw new Error(`Failed to fetch Mux metadata: ${r.status} ${r.statusText}`);let n=await r.json(),s={};if(!((i=n?.[0])!=null&&i.metadata))return;for(let l of n[0].metadata)l.key&&l.value&&(s[l.key]=l.value);((a=de.get(e))!=null?a:{}).metadata=s;let o=new CustomEvent("muxmetadata");e.dispatchEvent(o)}catch(r){console.error(r)}},db=t=>{var e;let i=t.type,a=ym(i),r=Tm(i),n,s=!!((e=t.partList)!=null&&e.length);return a===Q.LIVE&&(n=s?t.partTarget*2:t.targetduration*3),{streamType:a,targetLiveWindow:r,liveEdgeStartOffset:n,lowLatency:s}},ub=(t,e,i)=>{var a,r,n,s,o,l,d,m;let{streamType:p,targetLiveWindow:h,liveEdgeStartOffset:c,lowLatency:v}=db(t);if(p===Q.LIVE){v?(i.config.backBufferLength=(a=i.userConfig.backBufferLength)!=null?a:4,i.config.maxFragLookUpTolerance=(r=i.userConfig.maxFragLookUpTolerance)!=null?r:.001,i.config.abrBandWidthUpFactor=(n=i.userConfig.abrBandWidthUpFactor)!=null?n:i.config.abrBandWidthFactor):i.config.backBufferLength=(s=i.userConfig.backBufferLength)!=null?s:8;let E=Object.freeze({get length(){return e.seekable.length},start(g){return e.seekable.start(g)},end(g){var y;return g>this.length||g<0||Number.isFinite(e.duration)?e.seekable.end(g):(y=i.liveSyncPosition)!=null?y:e.seekable.end(g)}});((o=de.get(e))!=null?o:{}).seekable=E}((l=de.get(e))!=null?l:{}).liveEdgeStartOffset=c,((d=de.get(e))!=null?d:{}).targetLiveWindow=h,e.dispatchEvent(new CustomEvent("targetlivewindowchange",{composed:!0,bubbles:!0})),((m=de.get(e))!=null?m:{}).streamType=p,e.dispatchEvent(new CustomEvent("streamtypechange",{composed:!0,bubbles:!0}))},Rc,Cc,Dm=(Cc=(Rc=globalThis?.navigator)==null?void 0:Rc.userAgent)!=null?Cc:"",Lc,Dc,Mc,cb=(Mc=(Dc=(Lc=globalThis?.navigator)==null?void 0:Lc.userAgentData)==null?void 0:Dc.platform)!=null?Mc:"",hb=Dm.toLowerCase().includes("android")||["x11","android"].some(t=>cb.toLowerCase().includes(t)),mb=t=>/^((?!chrome|android).)*safari/i.test(Dm)&&!!t.canPlayType("application/vnd.apple.mpegurl"),de=new WeakMap,ii="mux.com",xc,Oc,Mm=(Oc=(xc=B).isSupported)==null?void 0:Oc.call(xc),pb=t=>hb||!mb(t),Yd=()=>{if(typeof window<"u")return Hd.utils.now()},vb=Hd.utils.generateUUID,Rl=({playbackId:t,customDomain:e=ii,maxResolution:i,minResolution:a,renditionOrder:r,programStartTime:n,programEndTime:s,assetStartTime:o,assetEndTime:l,playbackToken:d,tokens:{playback:m=d}={},extraSourceParams:p={}}={})=>{if(!t)return;let[h,c=""]=Wd(t),v=new URL(`https://stream.${e}/${h}.m3u8${c}`);return m||v.searchParams.has("token")?(v.searchParams.forEach((E,g)=>{g!="token"&&v.searchParams.delete(g)}),m&&v.searchParams.set("token",m)):(i&&v.searchParams.set("max_resolution",i),a&&(v.searchParams.set("min_resolution",a),i&&+i.slice(0,-1)<+a.slice(0,-1)&&console.error("minResolution must be <= maxResolution","minResolution",a,"maxResolution",i)),r&&v.searchParams.set("rendition_order",r),n&&v.searchParams.set("program_start_time",`${n}`),s&&v.searchParams.set("program_end_time",`${s}`),o&&v.searchParams.set("asset_start_time",`${o}`),l&&v.searchParams.set("asset_end_time",`${l}`),Object.entries(p).forEach(([E,g])=>{g!=null&&v.searchParams.set(E,g)})),v.toString()},Do=t=>{if(!t)return;let[e]=t.split("?");return e||void 0},Gd=t=>{if(!t||!t.startsWith("https://stream."))return;let[e]=new URL(t).pathname.slice(1).split(/\.m3u8|\//);return e||void 0},fb=t=>{var e,i,a;return(e=t?.metadata)!=null&&e.video_id?t.metadata.video_id:Bm(t)&&(a=(i=Do(t.playbackId))!=null?i:Gd(t.src))!=null?a:t.src},xm=t=>{var e;return(e=de.get(t))==null?void 0:e.error},Eb=t=>{var e;return(e=de.get(t))==null?void 0:e.metadata},Cl=t=>{var e,i;return(i=(e=de.get(t))==null?void 0:e.streamType)!=null?i:Q.UNKNOWN},_b=t=>{var e,i;return(i=(e=de.get(t))==null?void 0:e.targetLiveWindow)!=null?i:Number.NaN},Qd=t=>{var e,i;return(i=(e=de.get(t))==null?void 0:e.seekable)!=null?i:t.seekable},bb=t=>{var e;let i=(e=de.get(t))==null?void 0:e.liveEdgeStartOffset;if(typeof i!="number")return Number.NaN;let a=Qd(t);return a.length?a.end(a.length-1)-i:Number.NaN},zd=.034,gb=(t,e,i=zd)=>Math.abs(t-e)<=i,Om=(t,e,i=zd)=>t>e||gb(t,e,i),yb=(t,e=zd)=>t.paused&&Om(t.currentTime,t.duration,e),Nm=(t,e)=>{var i,a,r;if(!e||!t.buffered.length)return;if(t.readyState>2)return!1;let n=e.currentLevel>=0?(a=(i=e.levels)==null?void 0:i[e.currentLevel])==null?void 0:a.details:(r=e.levels.find(p=>!!p.details))==null?void 0:r.details;if(!n||n.live)return;let{fragments:s}=n;if(!(s!=null&&s.length))return;if(t.currentTime<t.duration-(n.targetduration+.5))return!1;let o=s[s.length-1];if(t.currentTime<=o.start)return!1;let l=o.start+o.duration/2,d=t.buffered.start(t.buffered.length-1),m=t.buffered.end(t.buffered.length-1);return l>d&&l<m},Pm=(t,e)=>t.ended||t.loop?t.ended:e&&Nm(t,e)?!0:yb(t),Tb=(t,e,i)=>{Um(e,i,t);let{metadata:a={}}=t,{view_session_id:r=vb()}=a,n=fb(t);a.view_session_id=r,a.video_id=n,t.metadata=a;let s=m=>{var p;(p=e.mux)==null||p.emit("hb",{view_drm_type:m})};t.drmTypeCb=s,de.set(e,{retryCount:0});let o=Ab(t,e),l=B_(t,e,o);t!=null&&t.muxDataKeepSession&&e!=null&&e.mux&&!e.mux.deleted?o&&e.mux.addHLSJS({hlsjs:o,Hls:o?B:void 0}):Cb(t,e,o),Lb(t,e,o),q_(e),G_(e);let d=H_(t,e,o);return{engine:o,setAutoplay:d,setPreload:l}},Um=(t,e,i)=>{let a=e?.engine;t!=null&&t.mux&&!t.mux.deleted&&(i!=null&&i.muxDataKeepSession?a&&t.mux.removeHLSJS():(t.mux.destroy(),delete t.mux)),a&&(a.detachMedia(),a.destroy()),t&&(t.hasAttribute("src")&&(t.removeAttribute("src"),t.load()),t.removeEventListener("error",Fm),t.removeEventListener("error",Ll),t.removeEventListener("durationchange",Wm),de.delete(t),t.dispatchEvent(new Event("teardown")))};function $m(t,e){var i;let a=Lo(t);if(a!==ti.M3U8)return!0;let r=!a||((i=e.canPlayType(a))!=null?i:!0),{preferPlayback:n}=t,s=n===Ft.MSE,o=n===Ft.NATIVE,l=Mm&&(s||pb(e));return r&&(o||!l)}var Ab=(t,e)=>{let{debug:i,streamType:a,startTime:r=-1,metadata:n,preferCmcd:s,_hlsConfig:o={},maxAutoResolution:l}=t,d=Lo(t)===ti.M3U8,m=$m(t,e);if(d&&!m&&Mm){let p={backBufferLength:30,renderTextTracksNatively:!1,liveDurationInfinity:!0,capLevelToPlayerSize:!0,capLevelOnFPSDrop:!0},h=kb(a),c=Sb(t),v=[Ar.QUERY,Ar.HEADER].includes(s)?{useHeaders:s===Ar.HEADER,sessionId:n?.view_session_id,contentId:n?.video_id}:void 0,E=o.capLevelToPlayerSize==null?{capLevelController:il}:{},g=new B({debug:i,startPosition:r,cmcd:v,xhrSetup:(y,T)=>{var _,S;if(s&&s!==Ar.QUERY)return;let C=new URL(T);if(!C.searchParams.has("CMCD"))return;let N=((S=(_=C.searchParams.get("CMCD"))==null?void 0:_.split(","))!=null?S:[]).filter($=>$.startsWith("sid")||$.startsWith("cid")).join(",");C.searchParams.set("CMCD",N),y.open("GET",C)},...E,...p,...h,...c,...o});return E.capLevelController===il&&l!==void 0&&il.setMaxAutoResolution(g,l),g.on(B.Events.MANIFEST_PARSED,async function(y,T){var _,S;let C=(_=T.sessionData)==null?void 0:_["com.apple.hls.chapters"];(C!=null&&C.URI||C!=null&&C.VALUE.toLocaleLowerCase().startsWith("http"))&&qd((S=C?.URI)!=null?S:C?.VALUE,e)}),g}},kb=t=>t===Q.LIVE?{backBufferLength:8}:{},Sb=t=>{let{tokens:{drm:e}={},playbackId:i,drmTypeCb:a}=t,r=Do(i);return!e||!r?{}:{emeEnabled:!0,drmSystems:{"com.apple.fps":{licenseUrl:qn(t,"fairplay"),serverCertificateUrl:Hm(t,"fairplay")},"com.widevine.alpha":{licenseUrl:qn(t,"widevine")},"com.microsoft.playready":{licenseUrl:qn(t,"playready")}},requestMediaKeySystemAccessFunc:(n,s)=>(n==="com.widevine.alpha"&&(s=[...s.map(o=>{var l;let d=(l=o.videoCapabilities)==null?void 0:l.map(m=>({...m,robustness:"HW_SECURE_ALL"}));return{...o,videoCapabilities:d}}),...s]),navigator.requestMediaKeySystemAccess(n,s).then(o=>{let l=tb(n);return a?.(l),o}))}},wb=async t=>{let e=await fetch(t);return e.status!==200?Promise.reject(e):await e.arrayBuffer()},Ib=async(t,e)=>{let i=await fetch(e,{method:"POST",headers:{"Content-type":"application/octet-stream"},body:t});if(i.status!==200)return Promise.reject(i);let a=await i.arrayBuffer();return new Uint8Array(a)},Rb=(t,e)=>{let i=async n=>{let s=await navigator.requestMediaKeySystemAccess("com.apple.fps",[{initDataTypes:[n],videoCapabilities:[{contentType:"application/vnd.apple.mpegurl",robustness:""}],distinctiveIdentifier:"not-allowed",persistentState:"not-allowed",sessionTypes:["temporary"]}]).then(l=>{var d;return(d=t.drmTypeCb)==null||d.call(t,Vn.FAIRPLAY),l}).catch(()=>{let l=D("Cannot play DRM-protected content with current security configuration on this browser. Try playing in another browser."),d=new R(l,R.MEDIA_ERR_ENCRYPTED,!0);d.errorCategory=te.DRM,d.muxCode=x.ENCRYPTED_UNSUPPORTED_KEY_SYSTEM,je(e,d)});if(!s)return;let o=await s.createMediaKeys();try{let l=await wb(Hm(t,"fairplay")).catch(d=>{if(d instanceof Response){let m=io(d,te.DRM,t);return console.error("mediaError",m?.message,m?.context),m?Promise.reject(m):Promise.reject(new Error("Unexpected error in app cert request"))}return Promise.reject(d)});await o.setServerCertificate(l).catch(()=>{let d=D("Your server certificate failed when attempting to set it. This may be an issue with a no longer valid certificate."),m=new R(d,R.MEDIA_ERR_ENCRYPTED,!0);return m.errorCategory=te.DRM,m.muxCode=x.ENCRYPTED_UPDATE_SERVER_CERT_FAILED,Promise.reject(m)})}catch(l){je(e,l);return}await e.setMediaKeys(o)},a=n=>{let s;if(n==="internal-error"){let o=D("The DRM Content Decryption Module system had an internal failure. Try reloading the page, upading your browser, or playing in another browser.");s=new R(o,R.MEDIA_ERR_ENCRYPTED,!0),s.errorCategory=te.DRM,s.muxCode=x.ENCRYPTED_CDM_ERROR}else if(n==="output-restricted"||n==="output-downscaled"){let o=D("DRM playback is being attempted in an environment that is not sufficiently secure. User may see black screen.");s=new R(o,R.MEDIA_ERR_ENCRYPTED,!1),s.errorCategory=te.DRM,s.muxCode=x.ENCRYPTED_OUTPUT_RESTRICTED}s&&je(e,s)},r=async(n,s)=>{let o=e.mediaKeys.createSession(),l=()=>{o.keyStatuses.forEach(m=>a(m))},d=async m=>{let p=m.message;try{let h=await Ib(p,qn(t,"fairplay"));try{await o.update(h)}catch{let c=D("Failed to update DRM license. This may be an issue with the player or your protected content."),v=new R(c,R.MEDIA_ERR_ENCRYPTED,!0);v.errorCategory=te.DRM,v.muxCode=x.ENCRYPTED_UPDATE_LICENSE_FAILED,je(e,v)}}catch(h){if(h instanceof Response){let c=io(h,te.DRM,t);if(console.error("mediaError",c?.message,c?.context),c){je(e,c);return}console.error("Unexpected error in license key request",h);return}console.error(h)}};o.addEventListener("keystatuseschange",l),o.addEventListener("message",d),e.addEventListener("teardown",()=>{o.removeEventListener("keystatuseschange",l),o.removeEventListener("message",d),o.close()},{once:!0}),await o.generateRequest(n,s).catch(m=>{console.error("Failed to generate license request",m);let p=D("Failed to generate a DRM license request. This may be an issue with the player or your protected content."),h=new R(p,R.MEDIA_ERR_ENCRYPTED,!0);return h.errorCategory=te.DRM,h.muxCode=x.ENCRYPTED_GENERATE_REQUEST_FAILED,Promise.reject(h)})};fe(e,"encrypted",async n=>{try{let s=n.initDataType;if(s!=="skd"){console.error(`Received unexpected initialization data type "${s}"`);return}e.mediaKeys||await i(s);let o=n.initData;if(o==null){console.error(`Could not start encrypted playback due to missing initData in ${n.type} event`);return}await r(s,o)}catch(s){je(e,s);return}})},qn=({playbackId:t,tokens:{drm:e}={},customDomain:i=ii},a)=>{let r=Do(t);return`https://license.${i.toLocaleLowerCase().endsWith(ii)?i:ii}/license/${a}/${r}?token=${e}`},Hm=({playbackId:t,tokens:{drm:e}={},customDomain:i=ii},a)=>{let r=Do(t);return`https://license.${i.toLocaleLowerCase().endsWith(ii)?i:ii}/appcert/${a}/${r}?token=${e}`},Bm=({playbackId:t,src:e,customDomain:i})=>{if(t)return!0;if(typeof e!="string")return!1;let a=window?.location.href,r=new URL(e,a).hostname.toLocaleLowerCase();return r.includes(ii)||!!i&&r.includes(i.toLocaleLowerCase())},Cb=(t,e,i)=>{var a;let{envKey:r,disableTracking:n,muxDataSDK:s=Hd,muxDataSDKOptions:o={}}=t,l=Bm(t);if(!n&&(r||l)){let{playerInitTime:d,playerSoftwareName:m,playerSoftwareVersion:p,beaconCollectionDomain:h,debug:c,disableCookies:v}=t,E={...t.metadata,video_title:((a=t?.metadata)==null?void 0:a.video_title)||void 0},g=y=>typeof y.player_error_code=="string"?!1:typeof t.errorTranslator=="function"?t.errorTranslator(y):y;s.monitor(e,{debug:c,beaconCollectionDomain:h,hlsjs:i,Hls:i?B:void 0,automaticErrorTracking:!1,errorTranslator:g,disableCookies:v,...o,data:{...r?{env_key:r}:{},player_software_name:m,player_software:m,player_software_version:p,player_init_time:d,...E}})}},Lb=(t,e,i)=>{var a,r;let n=$m(t,e),{src:s,customDomain:o=ii}=t,l=()=>{e.ended||t.disablePseudoEnded||!Pm(e,i)||(Nm(e,i)?e.currentTime=e.buffered.end(e.buffered.length-1):e.dispatchEvent(new Event("ended")))},d,m,p=()=>{let h=Qd(e),c,v;h.length>0&&(c=h.start(0),v=h.end(0)),(m!==v||d!==c)&&e.dispatchEvent(new CustomEvent("seekablechange",{composed:!0})),d=c,m=v};if(fe(e,"durationchange",p),e&&n){let h=Lo(t);if(typeof s=="string"){if(s.endsWith(".mp4")&&s.includes(o)){let E=Gd(s),g=new URL(`https://stream.${o}/${E}/metadata.json`);qd(g.toString(),e)}let c=()=>{if(Cl(e)!==Q.LIVE||Number.isFinite(e.duration))return;let E=setInterval(p,1e3);e.addEventListener("teardown",()=>{clearInterval(E)},{once:!0}),fe(e,"durationchange",()=>{Number.isFinite(e.duration)&&clearInterval(E)})},v=async()=>lb(s,e,h).then(c).catch(E=>{if(E instanceof Response){let g=io(E,te.VIDEO,t);if(g){je(e,g);return}}});if(e.preload==="none"){let E=()=>{v(),e.removeEventListener("loadedmetadata",g)},g=()=>{v(),e.removeEventListener("play",E)};fe(e,"play",E,{once:!0}),fe(e,"loadedmetadata",g,{once:!0})}else v();(a=t.tokens)!=null&&a.drm?Rb(t,e):fe(e,"encrypted",()=>{let E=D("Attempting to play DRM-protected content without providing a DRM token."),g=new R(E,R.MEDIA_ERR_ENCRYPTED,!0);g.errorCategory=te.DRM,g.muxCode=x.ENCRYPTED_MISSING_TOKEN,je(e,g)},{once:!0}),e.setAttribute("src",s),t.startTime&&(((r=de.get(e))!=null?r:{}).startTime=t.startTime,e.addEventListener("durationchange",Wm,{once:!0}))}else e.removeAttribute("src");e.addEventListener("error",Fm),e.addEventListener("error",Ll),e.addEventListener("emptied",()=>{e.querySelectorAll("track[data-removeondestroy]").forEach(c=>{c.remove()})},{once:!0}),fe(e,"pause",l),fe(e,"seeked",l),fe(e,"play",()=>{e.ended||Om(e.currentTime,e.duration)&&(e.currentTime=e.seekable.length?e.seekable.start(0):0)})}else i&&s?(i.once(B.Events.LEVEL_LOADED,(h,c)=>{ub(c.details,e,i),p(),Cl(e)===Q.LIVE&&!Number.isFinite(e.duration)&&(i.on(B.Events.LEVEL_UPDATED,p),fe(e,"durationchange",()=>{Number.isFinite(e.duration)&&i.off(B.Events.LEVELS_UPDATED,p)}))}),i.on(B.Events.ERROR,(h,c)=>{var v,E;let g=Db(c,t);if(g.muxCode===x.NETWORK_NOT_READY){let y=(v=de.get(e))!=null?v:{},T=(E=y.retryCount)!=null?E:0;if(T<6){let _=T===0?5e3:6e4,S=new R(`Retrying in ${_/1e3} seconds...`,g.code,g.fatal);Object.assign(S,g),je(e,S),setTimeout(()=>{y.retryCount=T+1,c.details==="manifestLoadError"&&c.url&&i.loadSource(c.url)},_);return}else{y.retryCount=0;let _=new R('Try again later or <a href="#" onclick="window.location.reload(); return false;" style="color: #4a90e2;">click here to retry</a>',g.code,g.fatal);Object.assign(_,g),je(e,_);return}}je(e,g)}),i.on(B.Events.MANIFEST_LOADED,()=>{let h=de.get(e);h&&h.error&&(h.error=null,h.retryCount=0,e.dispatchEvent(new Event("emptied")),e.dispatchEvent(new Event("loadstart")))}),e.addEventListener("error",Ll),fe(e,"waiting",l),W_(t,i),F_(e,i),i.attachMedia(e)):console.error("It looks like the video you're trying to play will not work on this system! If possible, try upgrading to the newest versions of your browser or software.")};function Wm(t){var e;let i=t.target,a=(e=de.get(i))==null?void 0:e.startTime;if(a&&C_(i.seekable,i.duration,a)){let r=i.preload==="auto";r&&(i.preload="none"),i.currentTime=a,r&&(i.preload="auto")}}async function Fm(t){if(!t.isTrusted)return;t.stopImmediatePropagation();let e=t.target;if(!(e!=null&&e.error))return;let{message:i,code:a}=e.error,r=new R(i,a);if(e.src&&a===R.MEDIA_ERR_SRC_NOT_SUPPORTED&&e.readyState===HTMLMediaElement.HAVE_NOTHING){setTimeout(()=>{var n;let s=(n=xm(e))!=null?n:e.error;s?.code===R.MEDIA_ERR_SRC_NOT_SUPPORTED&&je(e,r)},500);return}if(e.src&&(a!==R.MEDIA_ERR_DECODE||a!==void 0))try{let{status:n}=await fetch(e.src);r.data={response:{code:n}}}catch{}je(e,r)}function je(t,e){var i;e.fatal&&(((i=de.get(t))!=null?i:{}).error=e,t.dispatchEvent(new CustomEvent("error",{detail:e})))}function Ll(t){var e,i;if(!(t instanceof CustomEvent)||!(t.detail instanceof R))return;let a=t.target,r=t.detail;!r||!r.fatal||(((e=de.get(a))!=null?e:{}).error=r,(i=a.mux)==null||i.emit("error",{player_error_code:r.code,player_error_message:r.message,player_error_context:r.context}))}var Db=(t,e)=>{var i,a,r;t.fatal?console.error("getErrorFromHlsErrorData()",t):e.debug&&console.warn("getErrorFromHlsErrorData() (non-fatal)",t);let n={[B.ErrorTypes.NETWORK_ERROR]:R.MEDIA_ERR_NETWORK,[B.ErrorTypes.MEDIA_ERROR]:R.MEDIA_ERR_DECODE,[B.ErrorTypes.KEY_SYSTEM_ERROR]:R.MEDIA_ERR_ENCRYPTED},s=m=>[B.ErrorDetails.KEY_SYSTEM_LICENSE_REQUEST_FAILED,B.ErrorDetails.KEY_SYSTEM_SERVER_CERTIFICATE_REQUEST_FAILED].includes(m.details)?R.MEDIA_ERR_NETWORK:n[m.type],o=m=>{if(m.type===B.ErrorTypes.KEY_SYSTEM_ERROR)return te.DRM;if(m.type===B.ErrorTypes.NETWORK_ERROR)return te.VIDEO},l,d=s(t);if(d===R.MEDIA_ERR_NETWORK&&t.response){let m=(i=o(t))!=null?i:te.VIDEO;l=(a=io(t.response,m,e,t.fatal))!=null?a:new R("",d,t.fatal)}else if(d===R.MEDIA_ERR_ENCRYPTED)if(t.details===B.ErrorDetails.KEY_SYSTEM_NO_CONFIGURED_LICENSE){let m=D("Attempting to play DRM-protected content without providing a DRM token.");l=new R(m,R.MEDIA_ERR_ENCRYPTED,t.fatal),l.errorCategory=te.DRM,l.muxCode=x.ENCRYPTED_MISSING_TOKEN}else if(t.details===B.ErrorDetails.KEY_SYSTEM_NO_ACCESS){let m=D("Cannot play DRM-protected content with current security configuration on this browser. Try playing in another browser.");l=new R(m,R.MEDIA_ERR_ENCRYPTED,t.fatal),l.errorCategory=te.DRM,l.muxCode=x.ENCRYPTED_UNSUPPORTED_KEY_SYSTEM}else if(t.details===B.ErrorDetails.KEY_SYSTEM_NO_SESSION){let m=D("Failed to generate a DRM license request. This may be an issue with the player or your protected content.");l=new R(m,R.MEDIA_ERR_ENCRYPTED,!0),l.errorCategory=te.DRM,l.muxCode=x.ENCRYPTED_GENERATE_REQUEST_FAILED}else if(t.details===B.ErrorDetails.KEY_SYSTEM_SESSION_UPDATE_FAILED){let m=D("Failed to update DRM license. This may be an issue with the player or your protected content.");l=new R(m,R.MEDIA_ERR_ENCRYPTED,t.fatal),l.errorCategory=te.DRM,l.muxCode=x.ENCRYPTED_UPDATE_LICENSE_FAILED}else if(t.details===B.ErrorDetails.KEY_SYSTEM_SERVER_CERTIFICATE_UPDATE_FAILED){let m=D("Your server certificate failed when attempting to set it. This may be an issue with a no longer valid certificate.");l=new R(m,R.MEDIA_ERR_ENCRYPTED,t.fatal),l.errorCategory=te.DRM,l.muxCode=x.ENCRYPTED_UPDATE_SERVER_CERT_FAILED}else if(t.details===B.ErrorDetails.KEY_SYSTEM_STATUS_INTERNAL_ERROR){let m=D("The DRM Content Decryption Module system had an internal failure. Try reloading the page, upading your browser, or playing in another browser.");l=new R(m,R.MEDIA_ERR_ENCRYPTED,t.fatal),l.errorCategory=te.DRM,l.muxCode=x.ENCRYPTED_CDM_ERROR}else if(t.details===B.ErrorDetails.KEY_SYSTEM_STATUS_OUTPUT_RESTRICTED){let m=D("DRM playback is being attempted in an environment that is not sufficiently secure. User may see black screen.");l=new R(m,R.MEDIA_ERR_ENCRYPTED,!1),l.errorCategory=te.DRM,l.muxCode=x.ENCRYPTED_OUTPUT_RESTRICTED}else l=new R(t.error.message,R.MEDIA_ERR_ENCRYPTED,t.fatal),l.errorCategory=te.DRM,l.muxCode=x.ENCRYPTED_ERROR;else l=new R("",d,t.fatal);return l.context||(l.context=`${t.url?`url: ${t.url}
`:""}${t.response&&(t.response.code||t.response.text)?`response: ${t.response.code}, ${t.response.text}
`:""}${t.reason?`failure reason: ${t.reason}
`:""}${t.level?`level: ${t.level}
`:""}${t.parent?`parent stream controller: ${t.parent}
`:""}${t.buffer?`buffer length: ${t.buffer}
`:""}${t.error?`error: ${t.error}
`:""}${t.event?`event: ${t.event}
`:""}${t.err?`error message: ${(r=t.err)==null?void 0:r.message}
`:""}`),l.data=t,l},Km=t=>{throw TypeError(t)},Zd=(t,e,i)=>e.has(t)||Km("Cannot "+i),De=(t,e,i)=>(Zd(t,e,"read from private field"),i?i.call(t):e.get(t)),ct=(t,e,i)=>e.has(t)?Km("Cannot add the same private member more than once"):e instanceof WeakSet?e.add(t):e.set(t,i),rt=(t,e,i,a)=>(Zd(t,e,"write to private field"),e.set(t,i),i),Sn=(t,e,i)=>(Zd(t,e,"access private method"),i),Mb=()=>{try{return"0.29.2"}catch{}return"UNKNOWN"},xb=Mb(),Ob=()=>xb,Nb=`
<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" part="logo" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2" viewBox="0 0 1600 500"><g fill="#fff"><path d="M994.287 93.486c-17.121 0-31-13.879-31-31 0-17.121 13.879-31 31-31 17.121 0 31 13.879 31 31 0 17.121-13.879 31-31 31m0-93.486c-34.509 0-62.484 27.976-62.484 62.486v187.511c0 68.943-56.09 125.033-125.032 125.033s-125.03-56.09-125.03-125.033V62.486C681.741 27.976 653.765 0 619.256 0s-62.484 27.976-62.484 62.486v187.511C556.772 387.85 668.921 500 806.771 500c137.851 0 250.001-112.15 250.001-250.003V62.486c0-34.51-27.976-62.486-62.485-62.486M1537.51 468.511c-17.121 0-31-13.879-31-31 0-17.121 13.879-31 31-31 17.121 0 31 13.879 31 31 0 17.121-13.879 31-31 31m-275.883-218.509-143.33 143.329c-24.402 24.402-24.402 63.966 0 88.368 24.402 24.402 63.967 24.402 88.369 0l143.33-143.329 143.328 143.329c24.402 24.4 63.967 24.402 88.369 0 24.403-24.402 24.403-63.966.001-88.368l-143.33-143.329.001-.004 143.329-143.329c24.402-24.402 24.402-63.965 0-88.367s-63.967-24.402-88.369 0L1349.996 161.63 1206.667 18.302c-24.402-24.401-63.967-24.402-88.369 0s-24.402 63.965 0 88.367l143.329 143.329v.004ZM437.511 468.521c-17.121 0-31-13.879-31-31 0-17.121 13.879-31 31-31 17.121 0 31 13.879 31 31 0 17.121-13.879 31-31 31M461.426 4.759C438.078-4.913 411.2.432 393.33 18.303L249.999 161.632 106.669 18.303C88.798.432 61.922-4.913 38.573 4.759 15.224 14.43-.001 37.214-.001 62.488v375.026c0 34.51 27.977 62.486 62.487 62.486 34.51 0 62.486-27.976 62.486-62.486V213.341l80.843 80.844c24.404 24.402 63.965 24.402 88.369 0l80.843-80.844v224.173c0 34.51 27.976 62.486 62.486 62.486s62.486-27.976 62.486-62.486V62.488c0-25.274-15.224-48.058-38.573-57.729" style="fill-rule:nonzero"/></g></svg>`,b={BEACON_COLLECTION_DOMAIN:"beacon-collection-domain",CUSTOM_DOMAIN:"custom-domain",DEBUG:"debug",DISABLE_TRACKING:"disable-tracking",DISABLE_COOKIES:"disable-cookies",DISABLE_PSEUDO_ENDED:"disable-pseudo-ended",DRM_TOKEN:"drm-token",PLAYBACK_TOKEN:"playback-token",ENV_KEY:"env-key",MAX_RESOLUTION:"max-resolution",MIN_RESOLUTION:"min-resolution",MAX_AUTO_RESOLUTION:"max-auto-resolution",RENDITION_ORDER:"rendition-order",PROGRAM_START_TIME:"program-start-time",PROGRAM_END_TIME:"program-end-time",ASSET_START_TIME:"asset-start-time",ASSET_END_TIME:"asset-end-time",METADATA_URL:"metadata-url",PLAYBACK_ID:"playback-id",PLAYER_SOFTWARE_NAME:"player-software-name",PLAYER_SOFTWARE_VERSION:"player-software-version",PLAYER_INIT_TIME:"player-init-time",PREFER_CMCD:"prefer-cmcd",PREFER_PLAYBACK:"prefer-playback",START_TIME:"start-time",STREAM_TYPE:"stream-type",TARGET_LIVE_WINDOW:"target-live-window",LIVE_EDGE_OFFSET:"live-edge-offset",TYPE:"type",LOGO:"logo"},Pb=Object.values(b),Nc=Ob(),Pc="mux-video",It,Sr,Yn,wr,Gn,Qn,zn,Zn,jn,Ir,va,Rr,Ub=class extends An{constructor(){super(),ct(this,va),ct(this,It),ct(this,Sr),ct(this,Yn),ct(this,wr,{}),ct(this,Gn,{}),ct(this,Qn),ct(this,zn),ct(this,Zn),ct(this,jn),ct(this,Ir,""),rt(this,Yn,Yd()),this.nativeEl.addEventListener("muxmetadata",e=>{var i;let a=Eb(this.nativeEl),r=(i=this.metadata)!=null?i:{};this.metadata={...a,...r},a?.["com.mux.video.branding"]==="mux-free-plan"&&(rt(this,Ir,"default"),this.updateLogo())})}static get NAME(){return Pc}static get VERSION(){return Nc}static get observedAttributes(){var e;return[...Pb,...(e=An.observedAttributes)!=null?e:[]]}static getLogoHTML(e){return!e||e==="false"?"":e==="default"?Nb:`<img part="logo" src="${e}" />`}static getTemplateHTML(e={}){var i;return`
      ${An.getTemplateHTML(e)}
      <style>
        :host {
          position: relative;
        }
        slot[name="logo"] {
          display: flex;
          justify-content: end;
          position: absolute;
          top: 1rem;
          right: 1rem;
          opacity: 0;
          transition: opacity 0.25s ease-in-out;
          z-index: 1;
        }
        slot[name="logo"]:has([part="logo"]) {
          opacity: 1;
        }
        slot[name="logo"] [part="logo"] {
          width: 5rem;
          pointer-events: none;
          user-select: none;
        }
      </style>
      <slot name="logo">
        ${this.getLogoHTML((i=e[b.LOGO])!=null?i:"")}
      </slot>
    `}get preferCmcd(){var e;return(e=this.getAttribute(b.PREFER_CMCD))!=null?e:void 0}set preferCmcd(e){e!==this.preferCmcd&&(e?to.includes(e)?this.setAttribute(b.PREFER_CMCD,e):console.warn(`Invalid value for preferCmcd. Must be one of ${to.join()}`):this.removeAttribute(b.PREFER_CMCD))}get playerInitTime(){return this.hasAttribute(b.PLAYER_INIT_TIME)?+this.getAttribute(b.PLAYER_INIT_TIME):De(this,Yn)}set playerInitTime(e){e!=this.playerInitTime&&(e==null?this.removeAttribute(b.PLAYER_INIT_TIME):this.setAttribute(b.PLAYER_INIT_TIME,`${+e}`))}get playerSoftwareName(){var e;return(e=De(this,Zn))!=null?e:Pc}set playerSoftwareName(e){rt(this,Zn,e)}get playerSoftwareVersion(){var e;return(e=De(this,zn))!=null?e:Nc}set playerSoftwareVersion(e){rt(this,zn,e)}get _hls(){var e;return(e=De(this,It))==null?void 0:e.engine}get mux(){var e;return(e=this.nativeEl)==null?void 0:e.mux}get error(){var e;return(e=xm(this.nativeEl))!=null?e:null}get errorTranslator(){return De(this,jn)}set errorTranslator(e){rt(this,jn,e)}get src(){return this.getAttribute("src")}set src(e){e!==this.src&&(e==null?this.removeAttribute("src"):this.setAttribute("src",e))}get type(){var e;return(e=this.getAttribute(b.TYPE))!=null?e:void 0}set type(e){e!==this.type&&(e?this.setAttribute(b.TYPE,e):this.removeAttribute(b.TYPE))}get preload(){let e=this.getAttribute("preload");return e===""?"auto":["none","metadata","auto"].includes(e)?e:super.preload}set preload(e){e!=this.getAttribute("preload")&&(["","none","metadata","auto"].includes(e)?this.setAttribute("preload",e):this.removeAttribute("preload"))}get debug(){return this.getAttribute(b.DEBUG)!=null}set debug(e){e!==this.debug&&(e?this.setAttribute(b.DEBUG,""):this.removeAttribute(b.DEBUG))}get disableTracking(){return this.hasAttribute(b.DISABLE_TRACKING)}set disableTracking(e){e!==this.disableTracking&&this.toggleAttribute(b.DISABLE_TRACKING,!!e)}get disableCookies(){return this.hasAttribute(b.DISABLE_COOKIES)}set disableCookies(e){e!==this.disableCookies&&(e?this.setAttribute(b.DISABLE_COOKIES,""):this.removeAttribute(b.DISABLE_COOKIES))}get disablePseudoEnded(){return this.hasAttribute(b.DISABLE_PSEUDO_ENDED)}set disablePseudoEnded(e){e!==this.disablePseudoEnded&&(e?this.setAttribute(b.DISABLE_PSEUDO_ENDED,""):this.removeAttribute(b.DISABLE_PSEUDO_ENDED))}get startTime(){let e=this.getAttribute(b.START_TIME);if(e==null)return;let i=+e;return Number.isNaN(i)?void 0:i}set startTime(e){e!==this.startTime&&(e==null?this.removeAttribute(b.START_TIME):this.setAttribute(b.START_TIME,`${e}`))}get playbackId(){var e;return this.hasAttribute(b.PLAYBACK_ID)?this.getAttribute(b.PLAYBACK_ID):(e=Gd(this.src))!=null?e:void 0}set playbackId(e){e!==this.playbackId&&(e?this.setAttribute(b.PLAYBACK_ID,e):this.removeAttribute(b.PLAYBACK_ID))}get maxResolution(){var e;return(e=this.getAttribute(b.MAX_RESOLUTION))!=null?e:void 0}set maxResolution(e){e!==this.maxResolution&&(e?this.setAttribute(b.MAX_RESOLUTION,e):this.removeAttribute(b.MAX_RESOLUTION))}get minResolution(){var e;return(e=this.getAttribute(b.MIN_RESOLUTION))!=null?e:void 0}set minResolution(e){e!==this.minResolution&&(e?this.setAttribute(b.MIN_RESOLUTION,e):this.removeAttribute(b.MIN_RESOLUTION))}get maxAutoResolution(){var e;return(e=this.getAttribute(b.MAX_AUTO_RESOLUTION))!=null?e:void 0}set maxAutoResolution(e){e==null?this.removeAttribute(b.MAX_AUTO_RESOLUTION):this.setAttribute(b.MAX_AUTO_RESOLUTION,e)}get renditionOrder(){var e;return(e=this.getAttribute(b.RENDITION_ORDER))!=null?e:void 0}set renditionOrder(e){e!==this.renditionOrder&&(e?this.setAttribute(b.RENDITION_ORDER,e):this.removeAttribute(b.RENDITION_ORDER))}get programStartTime(){let e=this.getAttribute(b.PROGRAM_START_TIME);if(e==null)return;let i=+e;return Number.isNaN(i)?void 0:i}set programStartTime(e){e==null?this.removeAttribute(b.PROGRAM_START_TIME):this.setAttribute(b.PROGRAM_START_TIME,`${e}`)}get programEndTime(){let e=this.getAttribute(b.PROGRAM_END_TIME);if(e==null)return;let i=+e;return Number.isNaN(i)?void 0:i}set programEndTime(e){e==null?this.removeAttribute(b.PROGRAM_END_TIME):this.setAttribute(b.PROGRAM_END_TIME,`${e}`)}get assetStartTime(){let e=this.getAttribute(b.ASSET_START_TIME);if(e==null)return;let i=+e;return Number.isNaN(i)?void 0:i}set assetStartTime(e){e==null?this.removeAttribute(b.ASSET_START_TIME):this.setAttribute(b.ASSET_START_TIME,`${e}`)}get assetEndTime(){let e=this.getAttribute(b.ASSET_END_TIME);if(e==null)return;let i=+e;return Number.isNaN(i)?void 0:i}set assetEndTime(e){e==null?this.removeAttribute(b.ASSET_END_TIME):this.setAttribute(b.ASSET_END_TIME,`${e}`)}get customDomain(){var e;return(e=this.getAttribute(b.CUSTOM_DOMAIN))!=null?e:void 0}set customDomain(e){e!==this.customDomain&&(e?this.setAttribute(b.CUSTOM_DOMAIN,e):this.removeAttribute(b.CUSTOM_DOMAIN))}get drmToken(){var e;return(e=this.getAttribute(b.DRM_TOKEN))!=null?e:void 0}set drmToken(e){e!==this.drmToken&&(e?this.setAttribute(b.DRM_TOKEN,e):this.removeAttribute(b.DRM_TOKEN))}get playbackToken(){var e,i,a,r;if(this.hasAttribute(b.PLAYBACK_TOKEN))return(e=this.getAttribute(b.PLAYBACK_TOKEN))!=null?e:void 0;if(this.hasAttribute(b.PLAYBACK_ID)){let[,n]=Wd((i=this.playbackId)!=null?i:"");return(a=new URLSearchParams(n).get("token"))!=null?a:void 0}if(this.src)return(r=new URLSearchParams(this.src).get("token"))!=null?r:void 0}set playbackToken(e){e!==this.playbackToken&&(e?this.setAttribute(b.PLAYBACK_TOKEN,e):this.removeAttribute(b.PLAYBACK_TOKEN))}get tokens(){let e=this.getAttribute(b.PLAYBACK_TOKEN),i=this.getAttribute(b.DRM_TOKEN);return{...De(this,Gn),...e!=null?{playback:e}:{},...i!=null?{drm:i}:{}}}set tokens(e){rt(this,Gn,e??{})}get ended(){return Pm(this.nativeEl,this._hls)}get envKey(){var e;return(e=this.getAttribute(b.ENV_KEY))!=null?e:void 0}set envKey(e){e!==this.envKey&&(e?this.setAttribute(b.ENV_KEY,e):this.removeAttribute(b.ENV_KEY))}get beaconCollectionDomain(){var e;return(e=this.getAttribute(b.BEACON_COLLECTION_DOMAIN))!=null?e:void 0}set beaconCollectionDomain(e){e!==this.beaconCollectionDomain&&(e?this.setAttribute(b.BEACON_COLLECTION_DOMAIN,e):this.removeAttribute(b.BEACON_COLLECTION_DOMAIN))}get streamType(){var e;return(e=this.getAttribute(b.STREAM_TYPE))!=null?e:Cl(this.nativeEl)}set streamType(e){e!==this.streamType&&(e?this.setAttribute(b.STREAM_TYPE,e):this.removeAttribute(b.STREAM_TYPE))}get targetLiveWindow(){return this.hasAttribute(b.TARGET_LIVE_WINDOW)?+this.getAttribute(b.TARGET_LIVE_WINDOW):_b(this.nativeEl)}set targetLiveWindow(e){e!=this.targetLiveWindow&&(e==null?this.removeAttribute(b.TARGET_LIVE_WINDOW):this.setAttribute(b.TARGET_LIVE_WINDOW,`${+e}`))}get liveEdgeStart(){var e,i;if(this.hasAttribute(b.LIVE_EDGE_OFFSET)){let{liveEdgeOffset:a}=this,r=(e=this.nativeEl.seekable.end(0))!=null?e:0,n=(i=this.nativeEl.seekable.start(0))!=null?i:0;return Math.max(n,r-a)}return bb(this.nativeEl)}get liveEdgeOffset(){if(this.hasAttribute(b.LIVE_EDGE_OFFSET))return+this.getAttribute(b.LIVE_EDGE_OFFSET)}set liveEdgeOffset(e){e!=this.liveEdgeOffset&&(e==null?this.removeAttribute(b.LIVE_EDGE_OFFSET):this.setAttribute(b.LIVE_EDGE_OFFSET,`${+e}`))}get seekable(){return Qd(this.nativeEl)}async addCuePoints(e){return wm(this.nativeEl,e)}get activeCuePoint(){return Im(this.nativeEl)}get cuePoints(){return V_(this.nativeEl)}async addChapters(e){return Cm(this.nativeEl,e)}get activeChapter(){return Lm(this.nativeEl)}get chapters(){return Y_(this.nativeEl)}getStartDate(){return Q_(this.nativeEl,this._hls)}get currentPdt(){return z_(this.nativeEl,this._hls)}get preferPlayback(){let e=this.getAttribute(b.PREFER_PLAYBACK);if(e===Ft.MSE||e===Ft.NATIVE)return e}set preferPlayback(e){e!==this.preferPlayback&&(e===Ft.MSE||e===Ft.NATIVE?this.setAttribute(b.PREFER_PLAYBACK,e):this.removeAttribute(b.PREFER_PLAYBACK))}get metadata(){return{...this.getAttributeNames().filter(e=>e.startsWith("metadata-")&&![b.METADATA_URL].includes(e)).reduce((e,i)=>{let a=this.getAttribute(i);return a!=null&&(e[i.replace(/^metadata-/,"").replace(/-/g,"_")]=a),e},{}),...De(this,wr)}}set metadata(e){rt(this,wr,e??{}),this.mux&&this.mux.emit("hb",De(this,wr))}get _hlsConfig(){return De(this,Qn)}set _hlsConfig(e){rt(this,Qn,e)}get logo(){var e;return(e=this.getAttribute(b.LOGO))!=null?e:De(this,Ir)}set logo(e){e?this.setAttribute(b.LOGO,e):this.removeAttribute(b.LOGO)}load(){rt(this,It,Tb(this,this.nativeEl,De(this,It)))}unload(){Um(this.nativeEl,De(this,It),this),rt(this,It,void 0)}attributeChangedCallback(e,i,a){var r,n;switch(An.observedAttributes.includes(e)&&!["src","autoplay","preload"].includes(e)&&super.attributeChangedCallback(e,i,a),e){case b.PLAYER_SOFTWARE_NAME:this.playerSoftwareName=a??void 0;break;case b.PLAYER_SOFTWARE_VERSION:this.playerSoftwareVersion=a??void 0;break;case"src":{let s=!!i,o=!!a;!s&&o?Sn(this,va,Rr).call(this):s&&!o?this.unload():s&&o&&(this.unload(),Sn(this,va,Rr).call(this));break}case"autoplay":if(a===i)break;(r=De(this,It))==null||r.setAutoplay(this.autoplay);break;case"preload":if(a===i)break;(n=De(this,It))==null||n.setPreload(a);break;case b.PLAYBACK_ID:this.src=Rl(this);break;case b.DEBUG:{let s=this.debug;this.mux&&console.info("Cannot toggle debug mode of mux data after initialization. Make sure you set all metadata to override before setting the src."),this._hls&&(this._hls.config.debug=s);break}case b.METADATA_URL:a&&fetch(a).then(s=>s.json()).then(s=>this.metadata=s).catch(()=>console.error(`Unable to load or parse metadata JSON from metadata-url ${a}!`));break;case b.STREAM_TYPE:(a==null||a!==i)&&this.dispatchEvent(new CustomEvent("streamtypechange",{composed:!0,bubbles:!0}));break;case b.TARGET_LIVE_WINDOW:(a==null||a!==i)&&this.dispatchEvent(new CustomEvent("targetlivewindowchange",{composed:!0,bubbles:!0,detail:this.targetLiveWindow}));break;case b.LOGO:(a==null||a!==i)&&this.updateLogo();break;case b.DISABLE_TRACKING:{if(a==null||a!==i){let s=this.currentTime,o=this.paused;this.unload(),Sn(this,va,Rr).call(this).then(()=>{this.currentTime=s,o||this.play()})}break}case b.DISABLE_COOKIES:{(a==null||a!==i)&&this.disableCookies&&document.cookie.split(";").forEach(s=>{s.trim().startsWith("muxData")&&(document.cookie=s.replace(/^ +/,"").replace(/=.*/,"=;expires="+new Date().toUTCString()+";path=/"))});break}}}updateLogo(){if(!this.shadowRoot)return;let e=this.shadowRoot.querySelector('slot[name="logo"]');if(!e)return;let i=this.constructor.getLogoHTML(De(this,Ir)||this.logo);e.innerHTML=i}connectedCallback(){var e;(e=super.connectedCallback)==null||e.call(this),this.nativeEl&&this.src&&!De(this,It)&&Sn(this,va,Rr).call(this)}disconnectedCallback(){this.unload()}handleEvent(e){e.target===this.nativeEl&&this.dispatchEvent(new CustomEvent(e.type,{composed:!0,detail:e.detail}))}};It=new WeakMap,Sr=new WeakMap,Yn=new WeakMap,wr=new WeakMap,Gn=new WeakMap,Qn=new WeakMap,zn=new WeakMap,Zn=new WeakMap,jn=new WeakMap,Ir=new WeakMap,va=new WeakSet,Rr=async function(){De(this,Sr)||(await rt(this,Sr,Promise.resolve()),rt(this,Sr,null),this.load())};const zi=new WeakMap;class al extends Error{}class $b extends Error{}const Hb=["application/x-mpegURL","application/vnd.apple.mpegurl","audio/mpegurl"],Bb=globalThis.WeakRef?class extends Set{add(t){super.add(new WeakRef(t))}forEach(t){super.forEach(e=>{const i=e.deref();i&&t(i)})}}:Set;function Wb(t){globalThis.chrome?.cast?.isAvailable?globalThis.cast?.framework?t():customElements.whenDefined("google-cast-button").then(t):globalThis.__onGCastApiAvailable=()=>{customElements.whenDefined("google-cast-button").then(t)}}function Fb(){return globalThis.chrome}function Kb(){const t="https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1";if(globalThis.chrome?.cast||document.querySelector(`script[src="${t}"]`))return;const e=document.createElement("script");e.src=t,document.head.append(e)}function Ti(){return globalThis.cast?.framework?.CastContext.getInstance()}function jd(){return Ti()?.getCurrentSession()}function Xd(){return jd()?.getSessionObj().media[0]}function Vb(t){return new Promise((e,i)=>{Xd().editTracksInfo(t,e,i)})}function qb(t){return new Promise((e,i)=>{Xd().getStatus(t,e,i)})}function Uc(t){return Ti().setOptions({...Vm(),...t})}function Vm(){return{receiverApplicationId:"CC1AD845",autoJoinPolicy:"origin_scoped",androidReceiverCompatible:!1,language:"en-US",resumeSavedSession:!0}}function Yb(t){if(!t)return;const e=/\.([a-zA-Z0-9]+)(?:\?.*)?$/,i=t.match(e);return i?i[1]:null}function Gb(t){const e=t.split(`
`),i=[];for(let a=0;a<e.length;a++)if(e[a].trim().startsWith("#EXT-X-STREAM-INF")){const n=e[a+1]?e[a+1].trim():"";n&&!n.startsWith("#")&&i.push(n)}return i}function Qb(t){return t.split(`
`).find(a=>!a.trim().startsWith("#")&&a.trim()!=="")}async function zb(t){try{const i=(await fetch(t,{method:"HEAD"})).headers.get("Content-Type");return Hb.some(a=>i===a)}catch(e){return console.error("Error while trying to get the Content-Type of the manifest",e),!1}}async function Zb(t){try{const e=await(await fetch(t)).text();let i=e;const a=Gb(e);if(a.length>0){const s=new URL(a[0],t).toString();i=await(await fetch(s)).text()}const r=Qb(i);return Yb(r)}catch(e){console.error("Error while trying to parse the manifest playlist",e);return}}const Xn=new Bb,oi=new WeakSet;let Te;Wb(()=>{if(!globalThis.chrome?.cast?.isAvailable){console.debug("chrome.cast.isAvailable",globalThis.chrome?.cast?.isAvailable);return}Te||(Te=cast.framework,Ti().addEventListener(Te.CastContextEventType.CAST_STATE_CHANGED,t=>{Xn.forEach(e=>zi.get(e).onCastStateChanged?.(t))}),Ti().addEventListener(Te.CastContextEventType.SESSION_STATE_CHANGED,t=>{Xn.forEach(e=>zi.get(e).onSessionStateChanged?.(t))}),Xn.forEach(t=>zi.get(t).init?.()))});let $c=0;class jb extends EventTarget{#t;#s;#i;#a;#e="disconnected";#r=!1;#o=new Set;#c=new WeakMap;constructor(e){super(),this.#t=e,Xn.add(this),zi.set(this,{init:()=>this.#d(),onCastStateChanged:()=>this.#l(),onSessionStateChanged:()=>this.#p(),getCastPlayer:()=>this.#n}),this.#d()}get#n(){if(oi.has(this.#t))return this.#i}get state(){return this.#e}async watchAvailability(e){if(this.#t.disableRemotePlayback)throw new al("disableRemotePlayback attribute is present.");return this.#c.set(e,++$c),this.#o.add(e),queueMicrotask(()=>e(this.#m())),$c}async cancelWatchAvailability(e){if(this.#t.disableRemotePlayback)throw new al("disableRemotePlayback attribute is present.");e?this.#o.delete(e):this.#o.clear()}async prompt(){if(this.#t.disableRemotePlayback)throw new al("disableRemotePlayback attribute is present.");if(!globalThis.chrome?.cast?.isAvailable)throw new $b("The RemotePlayback API is disabled on this platform.");const e=oi.has(this.#t);oi.add(this.#t),Uc(this.#t.castOptions),Object.entries(this.#a).forEach(([i,a])=>{this.#i.controller.addEventListener(i,a)});try{await Ti().requestSession()}catch(i){if(e||oi.delete(this.#t),i==="cancel")return;throw new Error(i)}zi.get(this.#t)?.loadOnPrompt?.()}#h(){oi.has(this.#t)&&(Object.entries(this.#a).forEach(([e,i])=>{this.#i.controller.removeEventListener(e,i)}),oi.delete(this.#t),this.#t.muted=this.#i.isMuted,this.#t.currentTime=this.#i.savedPlayerState.currentTime,this.#i.savedPlayerState.isPaused===!1&&this.#t.play())}#m(){const e=Ti()?.getCastState();return e&&e!=="NO_DEVICES_AVAILABLE"}#l(){const e=Ti().getCastState();if(oi.has(this.#t)&&e==="CONNECTING"&&(this.#e="connecting",this.dispatchEvent(new Event("connecting"))),!this.#r&&e?.includes("CONNECT")){this.#r=!0;for(let i of this.#o)i(!0)}else if(this.#r&&(!e||e==="NO_DEVICES_AVAILABLE")){this.#r=!1;for(let i of this.#o)i(!1)}}async#p(){const{SESSION_RESUMED:e}=Te.SessionState;if(Ti().getSessionState()===e&&this.#t.castSrc===Xd()?.media.contentId){oi.add(this.#t),Object.entries(this.#a).forEach(([i,a])=>{this.#i.controller.addEventListener(i,a)});try{await qb(new chrome.cast.media.GetStatusRequest)}catch(i){console.error(i)}this.#a[Te.RemotePlayerEventType.IS_PAUSED_CHANGED](),this.#a[Te.RemotePlayerEventType.PLAYER_STATE_CHANGED]()}}#d(){!Te||this.#s||(this.#s=!0,Uc(this.#t.castOptions),this.#t.textTracks.addEventListener("change",()=>this.#u()),this.#l(),this.#i=new Te.RemotePlayer,new Te.RemotePlayerController(this.#i),this.#a={[Te.RemotePlayerEventType.IS_CONNECTED_CHANGED]:({value:e})=>{e===!0?(this.#e="connected",this.dispatchEvent(new Event("connect"))):(this.#h(),this.#e="disconnected",this.dispatchEvent(new Event("disconnect")))},[Te.RemotePlayerEventType.DURATION_CHANGED]:()=>{this.#t.dispatchEvent(new Event("durationchange"))},[Te.RemotePlayerEventType.VOLUME_LEVEL_CHANGED]:()=>{this.#t.dispatchEvent(new Event("volumechange"))},[Te.RemotePlayerEventType.IS_MUTED_CHANGED]:()=>{this.#t.dispatchEvent(new Event("volumechange"))},[Te.RemotePlayerEventType.CURRENT_TIME_CHANGED]:()=>{this.#n?.isMediaLoaded&&this.#t.dispatchEvent(new Event("timeupdate"))},[Te.RemotePlayerEventType.VIDEO_INFO_CHANGED]:()=>{this.#t.dispatchEvent(new Event("resize"))},[Te.RemotePlayerEventType.IS_PAUSED_CHANGED]:()=>{this.#t.dispatchEvent(new Event(this.paused?"pause":"play"))},[Te.RemotePlayerEventType.PLAYER_STATE_CHANGED]:()=>{this.#n?.playerState!==chrome.cast.media.PlayerState.PAUSED&&this.#t.dispatchEvent(new Event({[chrome.cast.media.PlayerState.PLAYING]:"playing",[chrome.cast.media.PlayerState.BUFFERING]:"waiting",[chrome.cast.media.PlayerState.IDLE]:"emptied"}[this.#n?.playerState]))},[Te.RemotePlayerEventType.IS_MEDIA_LOADED_CHANGED]:async()=>{this.#n?.isMediaLoaded&&(await Promise.resolve(),this.#v())}})}#v(){this.#u()}async#u(){if(!this.#n)return;const i=(this.#i.mediaInfo?.tracks??[]).filter(({type:p})=>p===chrome.cast.media.TrackType.TEXT),a=[...this.#t.textTracks].filter(({kind:p})=>p==="subtitles"||p==="captions"),r=i.map(({language:p,name:h,trackId:c})=>{const{mode:v}=a.find(E=>E.language===p&&E.label===h)??{};return v?{mode:v,trackId:c}:!1}).filter(Boolean),s=r.filter(({mode:p})=>p!=="showing").map(({trackId:p})=>p),o=r.find(({mode:p})=>p==="showing"),l=jd()?.getSessionObj().media[0]?.activeTrackIds??[];let d=l;if(l.length&&(d=d.filter(p=>!s.includes(p))),o?.trackId&&(d=[...d,o.trackId]),d=[...new Set(d)],!((p,h)=>p.length===h.length&&p.every(c=>h.includes(c)))(l,d))try{const p=new chrome.cast.media.EditTracksInfoRequest(d);await Vb(p)}catch(p){console.error(p)}}}const Xb=t=>class extends t{static observedAttributes=[...t.observedAttributes??[],"cast-src","cast-content-type","cast-stream-type","cast-receiver"];#t={paused:!1};#s=Vm();#i;#a;get remote(){return this.#a?this.#a:Fb()?(this.disableRemotePlayback||Kb(),zi.set(this,{loadOnPrompt:()=>this.#r()}),this.#a=new jb(this)):super.remote}get#e(){return zi.get(this.remote)?.getCastPlayer?.()}attributeChangedCallback(i,a,r){if(super.attributeChangedCallback(i,a,r),i==="cast-receiver"&&r){this.#s.receiverApplicationId=r;return}if(this.#e)switch(i){case"cast-stream-type":case"cast-src":this.load();break}}async#r(){this.#t.paused=super.paused,super.pause(),this.muted=super.muted;try{await this.load()}catch(i){console.error(i)}}async load(){if(!this.#e)return super.load();const i=new chrome.cast.media.MediaInfo(this.castSrc,this.castContentType);i.customData=this.castCustomData;const a=[...this.querySelectorAll("track")].filter(({kind:o,src:l})=>l&&(o==="subtitles"||o==="captions")),r=[];let n=0;if(a.length&&(i.tracks=a.map(o=>{const l=++n;r.length===0&&o.track.mode==="showing"&&r.push(l);const d=new chrome.cast.media.Track(l,chrome.cast.media.TrackType.TEXT);return d.trackContentId=o.src,d.trackContentType="text/vtt",d.subtype=o.kind==="captions"?chrome.cast.media.TextTrackType.CAPTIONS:chrome.cast.media.TextTrackType.SUBTITLES,d.name=o.label,d.language=o.srclang,d})),this.castStreamType==="live"?i.streamType=chrome.cast.media.StreamType.LIVE:i.streamType=chrome.cast.media.StreamType.BUFFERED,i.metadata=new chrome.cast.media.GenericMediaMetadata,i.metadata.title=this.title,i.metadata.images=[{url:this.poster}],zb(this.castSrc)){const o=await Zb(this.castSrc);o?.includes("m4s")||o?.includes("mp4")?(i.hlsSegmentFormat=chrome.cast.media.HlsSegmentFormat.FMP4,i.hlsVideoSegmentFormat=chrome.cast.media.HlsVideoSegmentFormat.FMP4):o?.includes("ts")&&(i.hlsSegmentFormat=chrome.cast.media.HlsSegmentFormat.TS,i.hlsVideoSegmentFormat=chrome.cast.media.HlsVideoSegmentFormat.TS)}const s=new chrome.cast.media.LoadRequest(i);s.currentTime=super.currentTime??0,s.autoplay=!this.#t.paused,s.activeTrackIds=r,await jd()?.loadMedia(s),this.dispatchEvent(new Event("volumechange"))}play(){if(this.#e){this.#e.isPaused&&this.#e.controller?.playOrPause();return}return super.play()}pause(){if(this.#e){this.#e.isPaused||this.#e.controller?.playOrPause();return}super.pause()}get castOptions(){return this.#s}get castReceiver(){return this.getAttribute("cast-receiver")??void 0}set castReceiver(i){this.castReceiver!=i&&this.setAttribute("cast-receiver",`${i}`)}get castSrc(){return this.getAttribute("cast-src")??this.querySelector("source")?.src??this.currentSrc}set castSrc(i){this.castSrc!=i&&this.setAttribute("cast-src",`${i}`)}get castContentType(){return this.getAttribute("cast-content-type")??void 0}set castContentType(i){this.setAttribute("cast-content-type",`${i}`)}get castStreamType(){return this.getAttribute("cast-stream-type")??this.streamType??void 0}set castStreamType(i){this.setAttribute("cast-stream-type",`${i}`)}get castCustomData(){return this.#i}set castCustomData(i){const a=typeof i;if(!["object","undefined"].includes(a)){console.error(`castCustomData must be nullish or an object but value was of type ${a}`);return}this.#i=i}get readyState(){if(this.#e)switch(this.#e.playerState){case chrome.cast.media.PlayerState.IDLE:return 0;case chrome.cast.media.PlayerState.BUFFERING:return 2;default:return 3}return super.readyState}get paused(){return this.#e?this.#e.isPaused:super.paused}get muted(){return this.#e?this.#e?.isMuted:super.muted}set muted(i){if(this.#e){(i&&!this.#e.isMuted||!i&&this.#e.isMuted)&&this.#e.controller?.muteOrUnmute();return}super.muted=i}get volume(){return this.#e?this.#e?.volumeLevel??1:super.volume}set volume(i){if(this.#e){this.#e.volumeLevel=+i,this.#e.controller?.setVolumeLevel();return}super.volume=i}get duration(){return this.#e&&this.#e?.isMediaLoaded?this.#e?.duration??NaN:super.duration}get currentTime(){return this.#e&&this.#e?.isMediaLoaded?this.#e?.currentTime??0:super.currentTime}set currentTime(i){if(this.#e){this.#e.currentTime=i,this.#e.controller?.seek();return}super.currentTime=i}};var qm=t=>{throw TypeError(t)},Ym=(t,e,i)=>e.has(t)||qm("Cannot "+i),Jb=(t,e,i)=>(Ym(t,e,"read from private field"),i?i.call(t):e.get(t)),eg=(t,e,i)=>e.has(t)?qm("Cannot add the same private member more than once"):e instanceof WeakSet?e.add(t):e.set(t,i),tg=(t,e,i,a)=>(Ym(t,e,"write to private field"),e.set(t,i),i),Gm=class{addEventListener(){}removeEventListener(){}dispatchEvent(e){return!0}};if(typeof DocumentFragment>"u"){class t extends Gm{}globalThis.DocumentFragment=t}var ig=class extends Gm{},ag={get(t){},define(t,e,i){},getName(t){return null},upgrade(t){},whenDefined(t){return Promise.resolve(ig)}},rg={customElements:ag},ng=typeof window>"u"||typeof globalThis.customElements>"u",rl=ng?rg:globalThis,Jn,Hc=class extends Xb(cf(Ub)){constructor(){super(...arguments),eg(this,Jn)}get autoplay(){let t=this.getAttribute("autoplay");return t===null?!1:t===""?!0:t}set autoplay(t){let e=this.autoplay;t!==e&&(t?this.setAttribute("autoplay",typeof t=="string"?t:""):this.removeAttribute("autoplay"))}get muxCastCustomData(){return{mux:{playbackId:this.playbackId,minResolution:this.minResolution,maxResolution:this.maxResolution,renditionOrder:this.renditionOrder,customDomain:this.customDomain,tokens:{drm:this.drmToken},envKey:this.envKey,metadata:this.metadata,disableCookies:this.disableCookies,disableTracking:this.disableTracking,beaconCollectionDomain:this.beaconCollectionDomain,startTime:this.startTime,preferCmcd:this.preferCmcd}}}get castCustomData(){var t;return(t=Jb(this,Jn))!=null?t:this.muxCastCustomData}set castCustomData(t){tg(this,Jn,t)}};Jn=new WeakMap;rl.customElements.get("mux-video")||(rl.customElements.define("mux-video",Hc),rl.MuxVideoElement=Hc);const I={MEDIA_PLAY_REQUEST:"mediaplayrequest",MEDIA_PAUSE_REQUEST:"mediapauserequest",MEDIA_MUTE_REQUEST:"mediamuterequest",MEDIA_UNMUTE_REQUEST:"mediaunmuterequest",MEDIA_LOOP_REQUEST:"medialooprequest",MEDIA_VOLUME_REQUEST:"mediavolumerequest",MEDIA_SEEK_REQUEST:"mediaseekrequest",MEDIA_AIRPLAY_REQUEST:"mediaairplayrequest",MEDIA_ENTER_FULLSCREEN_REQUEST:"mediaenterfullscreenrequest",MEDIA_EXIT_FULLSCREEN_REQUEST:"mediaexitfullscreenrequest",MEDIA_PREVIEW_REQUEST:"mediapreviewrequest",MEDIA_ENTER_PIP_REQUEST:"mediaenterpiprequest",MEDIA_EXIT_PIP_REQUEST:"mediaexitpiprequest",MEDIA_ENTER_CAST_REQUEST:"mediaentercastrequest",MEDIA_EXIT_CAST_REQUEST:"mediaexitcastrequest",MEDIA_SHOW_TEXT_TRACKS_REQUEST:"mediashowtexttracksrequest",MEDIA_HIDE_TEXT_TRACKS_REQUEST:"mediahidetexttracksrequest",MEDIA_SHOW_SUBTITLES_REQUEST:"mediashowsubtitlesrequest",MEDIA_DISABLE_SUBTITLES_REQUEST:"mediadisablesubtitlesrequest",MEDIA_TOGGLE_SUBTITLES_REQUEST:"mediatogglesubtitlesrequest",MEDIA_PLAYBACK_RATE_REQUEST:"mediaplaybackraterequest",MEDIA_RENDITION_REQUEST:"mediarenditionrequest",MEDIA_AUDIO_TRACK_REQUEST:"mediaaudiotrackrequest",MEDIA_SEEK_TO_LIVE_REQUEST:"mediaseektoliverequest",REGISTER_MEDIA_STATE_RECEIVER:"registermediastatereceiver",UNREGISTER_MEDIA_STATE_RECEIVER:"unregistermediastatereceiver"},Y={MEDIA_CHROME_ATTRIBUTES:"mediachromeattributes",MEDIA_CONTROLLER:"mediacontroller"},Qm={MEDIA_AIRPLAY_UNAVAILABLE:"mediaAirplayUnavailable",MEDIA_AUDIO_TRACK_ENABLED:"mediaAudioTrackEnabled",MEDIA_AUDIO_TRACK_LIST:"mediaAudioTrackList",MEDIA_AUDIO_TRACK_UNAVAILABLE:"mediaAudioTrackUnavailable",MEDIA_BUFFERED:"mediaBuffered",MEDIA_CAST_UNAVAILABLE:"mediaCastUnavailable",MEDIA_CHAPTERS_CUES:"mediaChaptersCues",MEDIA_CURRENT_TIME:"mediaCurrentTime",MEDIA_DURATION:"mediaDuration",MEDIA_ENDED:"mediaEnded",MEDIA_ERROR:"mediaError",MEDIA_ERROR_CODE:"mediaErrorCode",MEDIA_ERROR_MESSAGE:"mediaErrorMessage",MEDIA_FULLSCREEN_UNAVAILABLE:"mediaFullscreenUnavailable",MEDIA_HAS_PLAYED:"mediaHasPlayed",MEDIA_HEIGHT:"mediaHeight",MEDIA_IS_AIRPLAYING:"mediaIsAirplaying",MEDIA_IS_CASTING:"mediaIsCasting",MEDIA_IS_FULLSCREEN:"mediaIsFullscreen",MEDIA_IS_PIP:"mediaIsPip",MEDIA_LOADING:"mediaLoading",MEDIA_MUTED:"mediaMuted",MEDIA_LOOP:"mediaLoop",MEDIA_PAUSED:"mediaPaused",MEDIA_PIP_UNAVAILABLE:"mediaPipUnavailable",MEDIA_PLAYBACK_RATE:"mediaPlaybackRate",MEDIA_PREVIEW_CHAPTER:"mediaPreviewChapter",MEDIA_PREVIEW_COORDS:"mediaPreviewCoords",MEDIA_PREVIEW_IMAGE:"mediaPreviewImage",MEDIA_PREVIEW_TIME:"mediaPreviewTime",MEDIA_RENDITION_LIST:"mediaRenditionList",MEDIA_RENDITION_SELECTED:"mediaRenditionSelected",MEDIA_RENDITION_UNAVAILABLE:"mediaRenditionUnavailable",MEDIA_SEEKABLE:"mediaSeekable",MEDIA_STREAM_TYPE:"mediaStreamType",MEDIA_SUBTITLES_LIST:"mediaSubtitlesList",MEDIA_SUBTITLES_SHOWING:"mediaSubtitlesShowing",MEDIA_TARGET_LIVE_WINDOW:"mediaTargetLiveWindow",MEDIA_TIME_IS_LIVE:"mediaTimeIsLive",MEDIA_VOLUME:"mediaVolume",MEDIA_VOLUME_LEVEL:"mediaVolumeLevel",MEDIA_VOLUME_UNAVAILABLE:"mediaVolumeUnavailable",MEDIA_LANG:"mediaLang",MEDIA_WIDTH:"mediaWidth"},zm=Object.entries(Qm),u=zm.reduce((t,[e,i])=>(t[e]=i.toLowerCase(),t),{}),sg={USER_INACTIVE_CHANGE:"userinactivechange",BREAKPOINTS_CHANGE:"breakpointchange",BREAKPOINTS_COMPUTED:"breakpointscomputed"},ri=zm.reduce((t,[e,i])=>(t[e]=i.toLowerCase(),t),{...sg});Object.entries(ri).reduce((t,[e,i])=>{const a=u[e];return a&&(t[i]=a),t},{userinactivechange:"userinactive"});const og=Object.entries(u).reduce((t,[e,i])=>{const a=ri[e];return a&&(t[i]=a),t},{userinactive:"userinactivechange"}),qt={SUBTITLES:"subtitles",CAPTIONS:"captions",CHAPTERS:"chapters",METADATA:"metadata"},Ka={DISABLED:"disabled",SHOWING:"showing"},nl={MOUSE:"mouse",PEN:"pen",TOUCH:"touch"},Ye={UNAVAILABLE:"unavailable",UNSUPPORTED:"unsupported"},Xt={LIVE:"live",ON_DEMAND:"on-demand",UNKNOWN:"unknown"},lg={FULLSCREEN:"fullscreen"};function dg(t){return t?.map(cg).join(" ")}function ug(t){return t?.split(/\s+/).map(hg)}function cg(t){if(t){const{id:e,width:i,height:a}=t;return[e,i,a].filter(r=>r!=null).join(":")}}function hg(t){if(t){const[e,i,a]=t.split(":");return{id:e,width:+i,height:+a}}}function mg(t){return t?.map(vg).join(" ")}function pg(t){return t?.split(/\s+/).map(fg)}function vg(t){if(t){const{id:e,kind:i,language:a,label:r}=t;return[e,i,a,r].filter(n=>n!=null).join(":")}}function fg(t){if(t){const[e,i,a,r]=t.split(":");return{id:e,kind:i,language:a,label:r}}}function Eg(t){return t.replace(/[-_]([a-z])/g,(e,i)=>i.toUpperCase())}function Jd(t){return typeof t=="number"&&!Number.isNaN(t)&&Number.isFinite(t)}function Zm(t){return typeof t!="string"?!1:!isNaN(t)&&!isNaN(parseFloat(t))}const jm=t=>new Promise(e=>setTimeout(e,t)),Bc=[{singular:"hour",plural:"hours"},{singular:"minute",plural:"minutes"},{singular:"second",plural:"seconds"}],_g=(t,e)=>{const i=t===1?Bc[e].singular:Bc[e].plural;return`${t} ${i}`},Qr=t=>{if(!Jd(t))return"";const e=Math.abs(t),i=e!==t,a=new Date(0,0,0,0,0,e,0);return`${[a.getHours(),a.getMinutes(),a.getSeconds()].map((o,l)=>o&&_g(o,l)).filter(o=>o).join(", ")}${i?" remaining":""}`};function ki(t,e){let i=!1;t<0&&(i=!0,t=0-t),t=t<0?0:t;let a=Math.floor(t%60),r=Math.floor(t/60%60),n=Math.floor(t/3600);const s=Math.floor(e/60%60),o=Math.floor(e/3600);return(isNaN(t)||t===1/0)&&(n=r=a="0"),n=n>0||o>0?n+":":"",r=((n||s>=10)&&r<10?"0"+r:r)+":",a=a<10?"0"+a:a,(i?"-":"")+n+r+a}const bg={"Start airplay":"Start airplay","Stop airplay":"Stop airplay",Audio:"Audio",Captions:"Captions","Enable captions":"Enable captions","Disable captions":"Disable captions","Start casting":"Start casting","Stop casting":"Stop casting","Enter fullscreen mode":"Enter fullscreen mode","Exit fullscreen mode":"Exit fullscreen mode",Mute:"Mute",Unmute:"Unmute",Loop:"Loop","Enter picture in picture mode":"Enter picture in picture mode","Exit picture in picture mode":"Exit picture in picture mode",Play:"Play",Pause:"Pause","Playback rate":"Playback rate","Playback rate {playbackRate}":"Playback rate {playbackRate}",Quality:"Quality","Seek backward":"Seek backward","Seek forward":"Seek forward",Settings:"Settings",Auto:"Auto","audio player":"audio player","video player":"video player",volume:"volume",seek:"seek","closed captions":"closed captions","current playback rate":"current playback rate","playback time":"playback time","media loading":"media loading",settings:"settings","audio tracks":"audio tracks",quality:"quality",play:"play",pause:"pause",mute:"mute",unmute:"unmute","chapter: {chapterName}":"chapter: {chapterName}",live:"live",Off:"Off","start airplay":"start airplay","stop airplay":"stop airplay","start casting":"start casting","stop casting":"stop casting","enter fullscreen mode":"enter fullscreen mode","exit fullscreen mode":"exit fullscreen mode","enter picture in picture mode":"enter picture in picture mode","exit picture in picture mode":"exit picture in picture mode","seek to live":"seek to live","playing live":"playing live","seek back {seekOffset} seconds":"seek back {seekOffset} seconds","seek forward {seekOffset} seconds":"seek forward {seekOffset} seconds","Network Error":"Network Error","Decode Error":"Decode Error","Source Not Supported":"Source Not Supported","Encryption Error":"Encryption Error","A network error caused the media download to fail.":"A network error caused the media download to fail.","A media error caused playback to be aborted. The media could be corrupt or your browser does not support this format.":"A media error caused playback to be aborted. The media could be corrupt or your browser does not support this format.","An unsupported error occurred. The server or network failed, or your browser does not support this format.":"An unsupported error occurred. The server or network failed, or your browser does not support this format.","The media is encrypted and there are no keys to decrypt it.":"The media is encrypted and there are no keys to decrypt it."};var Wc;const sl={en:bg};let Dl=((Wc=globalThis.navigator)==null?void 0:Wc.language)||"en";const gg=t=>{Dl=t},yg=t=>{var e,i,a;const[r]=Dl.split("-");return((e=sl[Dl])==null?void 0:e[t])||((i=sl[r])==null?void 0:i[t])||((a=sl.en)==null?void 0:a[t])||t},L=(t,e={})=>yg(t).replace(/\{(\w+)\}/g,(i,a)=>a in e?String(e[a]):`{${a}}`);let Xm=class{addEventListener(){}removeEventListener(){}dispatchEvent(){return!0}};class Jm extends Xm{}let Fc=class extends Jm{constructor(){super(...arguments),this.role=null}};class Tg{observe(){}unobserve(){}disconnect(){}}const ep={createElement:function(){return new sn.HTMLElement},createElementNS:function(){return new sn.HTMLElement},addEventListener(){},removeEventListener(){},dispatchEvent(t){return!1}},sn={ResizeObserver:Tg,document:ep,Node:Jm,Element:Fc,HTMLElement:class extends Fc{constructor(){super(...arguments),this.innerHTML=""}get content(){return new sn.DocumentFragment}},DocumentFragment:class extends Xm{},customElements:{get:function(){},define:function(){},whenDefined:function(){}},localStorage:{getItem(t){return null},setItem(t,e){},removeItem(t){}},CustomEvent:function(){},getComputedStyle:function(){},navigator:{languages:[],get userAgent(){return""}},matchMedia(t){return{matches:!1,media:t}},DOMParser:class{parseFromString(e,i){return{body:{textContent:e}}}}},tp="global"in globalThis&&globalThis?.global===globalThis||typeof window>"u"||typeof window.customElements>"u",ip=Object.keys(sn).every(t=>t in globalThis),f=tp&&!ip?sn:globalThis,ge=tp&&!ip?ep:globalThis.document,Kc=new WeakMap,eu=t=>{let e=Kc.get(t);return e||Kc.set(t,e=new Set),e},ap=new f.ResizeObserver(t=>{for(const e of t)for(const i of eu(e.target))i(e)});function Xa(t,e){eu(t).add(e),ap.observe(t)}function Ja(t,e){const i=eu(t);i.delete(e),i.size||ap.unobserve(t)}function Je(t){const e={};for(const i of t)e[i.name]=i.value;return e}function Be(t){var e;return(e=Ml(t))!=null?e:rr(t,"media-controller")}function Ml(t){var e;const{MEDIA_CONTROLLER:i}=Y,a=t.getAttribute(i);if(a)return(e=Mo(t))==null?void 0:e.getElementById(a)}const rp=(t,e,i=".value")=>{const a=t.querySelector(i);a&&(a.textContent=e)},Ag=(t,e)=>{const i=`slot[name="${e}"]`,a=t.shadowRoot.querySelector(i);return a?a.children:[]},np=(t,e)=>Ag(t,e)[0],si=(t,e)=>!t||!e?!1:t?.contains(e)?!0:si(t,e.getRootNode().host),rr=(t,e)=>{if(!t)return null;const i=t.closest(e);return i||rr(t.getRootNode().host,e)};function tu(t=document){var e;const i=t?.activeElement;return i?(e=tu(i.shadowRoot))!=null?e:i:null}function Mo(t){var e;const i=(e=t?.getRootNode)==null?void 0:e.call(t);return i instanceof ShadowRoot||i instanceof Document?i:null}function sp(t,{depth:e=3,checkOpacity:i=!0,checkVisibilityCSS:a=!0}={}){if(t.checkVisibility)return t.checkVisibility({checkOpacity:i,checkVisibilityCSS:a});let r=t;for(;r&&e>0;){const n=getComputedStyle(r);if(i&&n.opacity==="0"||a&&n.visibility==="hidden"||n.display==="none")return!1;r=r.parentElement,e--}return!0}function kg(t,e,i,a){const r=a.x-i.x,n=a.y-i.y,s=r*r+n*n;if(s===0)return 0;const o=((t-i.x)*r+(e-i.y)*n)/s;return Math.max(0,Math.min(1,o))}function Ae(t,e){const i=Sg(t,a=>a===e);return i||iu(t,e)}function Sg(t,e){var i,a;let r;for(r of(i=t.querySelectorAll("style:not([media])"))!=null?i:[]){let n;try{n=(a=r.sheet)==null?void 0:a.cssRules}catch{continue}for(const s of n??[])if(e(s.selectorText))return s}}function iu(t,e){var i,a;const r=(i=t.querySelectorAll("style:not([media])"))!=null?i:[],n=r?.[r.length-1];return n?.sheet?(n?.sheet.insertRule(`${e}{}`,n.sheet.cssRules.length),(a=n.sheet.cssRules)==null?void 0:a[n.sheet.cssRules.length-1]):(console.warn("Media Chrome: No style sheet found on style tag of",t),{style:{setProperty:()=>{},removeProperty:()=>"",getPropertyValue:()=>""}})}function ie(t,e,i=Number.NaN){const a=t.getAttribute(e);return a!=null?+a:i}function ue(t,e,i){const a=+i;if(i==null||Number.isNaN(a)){t.hasAttribute(e)&&t.removeAttribute(e);return}ie(t,e,void 0)!==a&&t.setAttribute(e,`${a}`)}function W(t,e){return t.hasAttribute(e)}function F(t,e,i){if(i==null){t.hasAttribute(e)&&t.removeAttribute(e);return}W(t,e)!=i&&t.toggleAttribute(e,i)}function ae(t,e,i=null){var a;return(a=t.getAttribute(e))!=null?a:i}function re(t,e,i){if(i==null){t.hasAttribute(e)&&t.removeAttribute(e);return}const a=`${i}`;ae(t,e,void 0)!==a&&t.setAttribute(e,a)}var op=(t,e,i)=>{if(!e.has(t))throw TypeError("Cannot "+i)},li=(t,e,i)=>(op(t,e,"read from private field"),i?i.call(t):e.get(t)),wg=(t,e,i)=>{if(e.has(t))throw TypeError("Cannot add the same private member more than once");e instanceof WeakSet?e.add(t):e.set(t,i)},wn=(t,e,i,a)=>(op(t,e,"write to private field"),e.set(t,i),i),$e;function Ig(t){return`
    <style>
      :host {
        display: var(--media-control-display, var(--media-gesture-receiver-display, inline-block));
        box-sizing: border-box;
      }
    </style>
  `}class xo extends f.HTMLElement{constructor(){if(super(),wg(this,$e,void 0),!this.shadowRoot){this.attachShadow(this.constructor.shadowRootOptions);const e=Je(this.attributes);this.shadowRoot.innerHTML=this.constructor.getTemplateHTML(e)}}static get observedAttributes(){return[Y.MEDIA_CONTROLLER,u.MEDIA_PAUSED]}attributeChangedCallback(e,i,a){var r,n,s,o,l;e===Y.MEDIA_CONTROLLER&&(i&&((n=(r=li(this,$e))==null?void 0:r.unassociateElement)==null||n.call(r,this),wn(this,$e,null)),a&&this.isConnected&&(wn(this,$e,(s=this.getRootNode())==null?void 0:s.getElementById(a)),(l=(o=li(this,$e))==null?void 0:o.associateElement)==null||l.call(o,this)))}connectedCallback(){var e,i,a,r;this.tabIndex=-1,this.setAttribute("aria-hidden","true"),wn(this,$e,Rg(this)),this.getAttribute(Y.MEDIA_CONTROLLER)&&((i=(e=li(this,$e))==null?void 0:e.associateElement)==null||i.call(e,this)),(a=li(this,$e))==null||a.addEventListener("pointerdown",this),(r=li(this,$e))==null||r.addEventListener("click",this)}disconnectedCallback(){var e,i,a,r;this.getAttribute(Y.MEDIA_CONTROLLER)&&((i=(e=li(this,$e))==null?void 0:e.unassociateElement)==null||i.call(e,this)),(a=li(this,$e))==null||a.removeEventListener("pointerdown",this),(r=li(this,$e))==null||r.removeEventListener("click",this),wn(this,$e,null)}handleEvent(e){var i;const a=(i=e.composedPath())==null?void 0:i[0];if(["video","media-controller"].includes(a?.localName)){if(e.type==="pointerdown")this._pointerType=e.pointerType;else if(e.type==="click"){const{clientX:n,clientY:s}=e,{left:o,top:l,width:d,height:m}=this.getBoundingClientRect(),p=n-o,h=s-l;if(p<0||h<0||p>d||h>m||d===0&&m===0)return;const c=this._pointerType||"mouse";if(this._pointerType=void 0,c===nl.TOUCH){this.handleTap(e);return}else if(c===nl.MOUSE||c===nl.PEN){this.handleMouseClick(e);return}}}}get mediaPaused(){return W(this,u.MEDIA_PAUSED)}set mediaPaused(e){F(this,u.MEDIA_PAUSED,e)}handleTap(e){}handleMouseClick(e){const i=this.mediaPaused?I.MEDIA_PLAY_REQUEST:I.MEDIA_PAUSE_REQUEST;this.dispatchEvent(new f.CustomEvent(i,{composed:!0,bubbles:!0}))}}$e=new WeakMap;xo.shadowRootOptions={mode:"open"};xo.getTemplateHTML=Ig;function Rg(t){var e;const i=t.getAttribute(Y.MEDIA_CONTROLLER);return i?(e=t.getRootNode())==null?void 0:e.getElementById(i):rr(t,"media-controller")}f.customElements.get("media-gesture-receiver")||f.customElements.define("media-gesture-receiver",xo);var Vc=xo,au=(t,e,i)=>{if(!e.has(t))throw TypeError("Cannot "+i)},Ze=(t,e,i)=>(au(t,e,"read from private field"),i?i.call(t):e.get(t)),Ge=(t,e,i)=>{if(e.has(t))throw TypeError("Cannot add the same private member more than once");e instanceof WeakSet?e.add(t):e.set(t,i)},Mi=(t,e,i,a)=>(au(t,e,"write to private field"),e.set(t,i),i),ot=(t,e,i)=>(au(t,e,"access private method"),i),ao,fa,on,Ua,es,xl,lp,Cr,ts,Ol,dp,Nl,up,ln,Oo,No,ru,er,dn;const M={AUDIO:"audio",AUTOHIDE:"autohide",BREAKPOINTS:"breakpoints",GESTURES_DISABLED:"gesturesdisabled",KEYBOARD_CONTROL:"keyboardcontrol",NO_AUTOHIDE:"noautohide",USER_INACTIVE:"userinactive",AUTOHIDE_OVER_CONTROLS:"autohideovercontrols"};function Cg(t){return`
    <style>
      
      :host([${u.MEDIA_IS_FULLSCREEN}]) ::slotted([slot=media]) {
        outline: none;
      }

      :host {
        box-sizing: border-box;
        position: relative;
        display: inline-block;
        line-height: 0;
        background-color: var(--media-background-color, #000);
        overflow: hidden;
      }

      :host(:not([${M.AUDIO}])) [part~=layer]:not([part~=media-layer]) {
        position: absolute;
        top: 0;
        left: 0;
        bottom: 0;
        right: 0;
        display: flex;
        flex-flow: column nowrap;
        align-items: start;
        pointer-events: none;
        background: none;
      }

      slot[name=media] {
        display: var(--media-slot-display, contents);
      }

      
      :host([${M.AUDIO}]) slot[name=media] {
        display: var(--media-slot-display, none);
      }

      
      :host([${M.AUDIO}]) [part~=layer][part~=gesture-layer] {
        height: 0;
        display: block;
      }

      
      :host(:not([${M.AUDIO}])[${M.GESTURES_DISABLED}]) ::slotted([slot=gestures-chrome]),
          :host(:not([${M.AUDIO}])[${M.GESTURES_DISABLED}]) media-gesture-receiver[slot=gestures-chrome] {
        display: none;
      }

      
      ::slotted(:not([slot=media]):not([slot=poster]):not(media-loading-indicator):not([role=dialog]):not([hidden])) {
        pointer-events: auto;
      }

      :host(:not([${M.AUDIO}])) *[part~=layer][part~=centered-layer] {
        align-items: center;
        justify-content: center;
      }

      :host(:not([${M.AUDIO}])) ::slotted(media-gesture-receiver[slot=gestures-chrome]),
      :host(:not([${M.AUDIO}])) media-gesture-receiver[slot=gestures-chrome] {
        align-self: stretch;
        flex-grow: 1;
      }

      slot[name=middle-chrome] {
        display: inline;
        flex-grow: 1;
        pointer-events: none;
        background: none;
      }

      
      ::slotted([slot=media]),
      ::slotted([slot=poster]) {
        width: 100%;
        height: 100%;
      }

      
      :host(:not([${M.AUDIO}])) .spacer {
        flex-grow: 1;
      }

      
      :host(:-webkit-full-screen) {
        
        width: 100% !important;
        height: 100% !important;
      }

      
      ::slotted(:not([slot=media]):not([slot=poster]):not([${M.NO_AUTOHIDE}]):not([hidden]):not([role=dialog])) {
        opacity: 1;
        transition: var(--media-control-transition-in, opacity 0.25s);
      }

      
      :host([${M.USER_INACTIVE}]:not([${u.MEDIA_PAUSED}]):not([${u.MEDIA_IS_AIRPLAYING}]):not([${u.MEDIA_IS_CASTING}]):not([${M.AUDIO}])) ::slotted(:not([slot=media]):not([slot=poster]):not([${M.NO_AUTOHIDE}]):not([role=dialog])) {
        opacity: 0;
        transition: var(--media-control-transition-out, opacity 1s);
      }

      :host([${M.USER_INACTIVE}]:not([${M.NO_AUTOHIDE}]):not([${u.MEDIA_PAUSED}]):not([${u.MEDIA_IS_CASTING}]):not([${M.AUDIO}])) ::slotted([slot=media]) {
        cursor: none;
      }

      :host([${M.USER_INACTIVE}][${M.AUTOHIDE_OVER_CONTROLS}]:not([${M.NO_AUTOHIDE}]):not([${u.MEDIA_PAUSED}]):not([${u.MEDIA_IS_CASTING}]):not([${M.AUDIO}])) * {
        --media-cursor: none;
        cursor: none;
      }


      ::slotted(media-control-bar)  {
        align-self: stretch;
      }

      
      :host(:not([${M.AUDIO}])[${u.MEDIA_HAS_PLAYED}]) slot[name=poster] {
        display: none;
      }

      ::slotted([role=dialog]) {
        width: 100%;
        height: 100%;
        align-self: center;
      }

      ::slotted([role=menu]) {
        align-self: end;
      }
    </style>

    <slot name="media" part="layer media-layer"></slot>
    <slot name="poster" part="layer poster-layer"></slot>
    <slot name="gestures-chrome" part="layer gesture-layer">
      <media-gesture-receiver slot="gestures-chrome">
        <template shadowrootmode="${Vc.shadowRootOptions.mode}">
          ${Vc.getTemplateHTML({})}
        </template>
      </media-gesture-receiver>
    </slot>
    <span part="layer vertical-layer">
      <slot name="top-chrome" part="top chrome"></slot>
      <slot name="middle-chrome" part="middle chrome"></slot>
      <slot name="centered-chrome" part="layer centered-layer center centered chrome"></slot>
      
      <slot part="bottom chrome"></slot>
    </span>
    <slot name="dialog" part="layer dialog-layer"></slot>
  `}const Lg=Object.values(u),Dg="sm:384 md:576 lg:768 xl:960";function Mg(t){cp(t.target,t.contentRect.width)}function cp(t,e){var i;if(!t.isConnected)return;const a=(i=t.getAttribute(M.BREAKPOINTS))!=null?i:Dg,r=xg(a),n=Og(r,e);let s=!1;if(Object.keys(r).forEach(o=>{if(n.includes(o)){t.hasAttribute(`breakpoint${o}`)||(t.setAttribute(`breakpoint${o}`,""),s=!0);return}t.hasAttribute(`breakpoint${o}`)&&(t.removeAttribute(`breakpoint${o}`),s=!0)}),s){const o=new CustomEvent(ri.BREAKPOINTS_CHANGE,{detail:n});t.dispatchEvent(o)}t.breakpointsComputed||(t.breakpointsComputed=!0,t.dispatchEvent(new CustomEvent(ri.BREAKPOINTS_COMPUTED,{bubbles:!0,composed:!0})))}function xg(t){const e=t.split(/\s+/);return Object.fromEntries(e.map(i=>i.split(":")))}function Og(t,e){return Object.keys(t).filter(i=>e>=parseInt(t[i]))}class Po extends f.HTMLElement{constructor(){if(super(),Ge(this,xl),Ge(this,Ol),Ge(this,Nl),Ge(this,ln),Ge(this,No),Ge(this,er),Ge(this,ao,0),Ge(this,fa,null),Ge(this,on,null),Ge(this,Ua,void 0),this.breakpointsComputed=!1,Ge(this,es,new MutationObserver(ot(this,xl,lp).bind(this))),Ge(this,Cr,!1),Ge(this,ts,i=>{Ze(this,Cr)||(setTimeout(()=>{Mg(i),Mi(this,Cr,!1)},0),Mi(this,Cr,!0))}),!this.shadowRoot){this.attachShadow(this.constructor.shadowRootOptions);const i=Je(this.attributes),a=this.constructor.getTemplateHTML(i);this.shadowRoot.setHTMLUnsafe?this.shadowRoot.setHTMLUnsafe(a):this.shadowRoot.innerHTML=a}const e=this.querySelector(":scope > slot[slot=media]");e&&e.addEventListener("slotchange",()=>{if(!e.assignedElements({flatten:!0}).length){Ze(this,fa)&&this.mediaUnsetCallback(Ze(this,fa));return}this.handleMediaUpdated(this.media)})}static get observedAttributes(){return[M.AUTOHIDE,M.GESTURES_DISABLED].concat(Lg).filter(e=>![u.MEDIA_RENDITION_LIST,u.MEDIA_AUDIO_TRACK_LIST,u.MEDIA_CHAPTERS_CUES,u.MEDIA_WIDTH,u.MEDIA_HEIGHT,u.MEDIA_ERROR,u.MEDIA_ERROR_MESSAGE].includes(e))}attributeChangedCallback(e,i,a){e.toLowerCase()==M.AUTOHIDE&&(this.autohide=a)}get media(){let e=this.querySelector(":scope > [slot=media]");return e?.nodeName=="SLOT"&&(e=e.assignedElements({flatten:!0})[0]),e}async handleMediaUpdated(e){e&&(Mi(this,fa,e),e.localName.includes("-")&&await f.customElements.whenDefined(e.localName),this.mediaSetCallback(e))}connectedCallback(){var e;Ze(this,es).observe(this,{childList:!0,subtree:!0}),Xa(this,Ze(this,ts));const i=this.getAttribute(M.AUDIO)!=null,a=L(i?"audio player":"video player");this.setAttribute("role","region"),this.setAttribute("aria-label",a),this.handleMediaUpdated(this.media),this.setAttribute(M.USER_INACTIVE,""),cp(this,this.getBoundingClientRect().width),this.addEventListener("pointerdown",this),this.addEventListener("pointermove",this),this.addEventListener("pointerup",this),this.addEventListener("mouseleave",this),this.addEventListener("keyup",this),(e=f.window)==null||e.addEventListener("mouseup",this)}disconnectedCallback(){var e;Ze(this,es).disconnect(),Ja(this,Ze(this,ts)),this.media&&this.mediaUnsetCallback(this.media),(e=f.window)==null||e.removeEventListener("mouseup",this)}mediaSetCallback(e){}mediaUnsetCallback(e){Mi(this,fa,null)}handleEvent(e){switch(e.type){case"pointerdown":Mi(this,ao,e.timeStamp);break;case"pointermove":ot(this,Ol,dp).call(this,e);break;case"pointerup":ot(this,Nl,up).call(this,e);break;case"mouseleave":ot(this,ln,Oo).call(this);break;case"mouseup":this.removeAttribute(M.KEYBOARD_CONTROL);break;case"keyup":ot(this,er,dn).call(this),this.setAttribute(M.KEYBOARD_CONTROL,"");break}}set autohide(e){const i=Number(e);Mi(this,Ua,isNaN(i)?0:i)}get autohide(){return(Ze(this,Ua)===void 0?2:Ze(this,Ua)).toString()}get breakpoints(){return ae(this,M.BREAKPOINTS)}set breakpoints(e){re(this,M.BREAKPOINTS,e)}get audio(){return W(this,M.AUDIO)}set audio(e){F(this,M.AUDIO,e)}get gesturesDisabled(){return W(this,M.GESTURES_DISABLED)}set gesturesDisabled(e){F(this,M.GESTURES_DISABLED,e)}get keyboardControl(){return W(this,M.KEYBOARD_CONTROL)}set keyboardControl(e){F(this,M.KEYBOARD_CONTROL,e)}get noAutohide(){return W(this,M.NO_AUTOHIDE)}set noAutohide(e){F(this,M.NO_AUTOHIDE,e)}get autohideOverControls(){return W(this,M.AUTOHIDE_OVER_CONTROLS)}set autohideOverControls(e){F(this,M.AUTOHIDE_OVER_CONTROLS,e)}get userInteractive(){return W(this,M.USER_INACTIVE)}set userInteractive(e){F(this,M.USER_INACTIVE,e)}}ao=new WeakMap;fa=new WeakMap;on=new WeakMap;Ua=new WeakMap;es=new WeakMap;xl=new WeakSet;lp=function(t){const e=this.media;for(const i of t){if(i.type!=="childList")continue;const a=i.removedNodes;for(const r of a){if(r.slot!="media"||i.target!=this)continue;let n=i.previousSibling&&i.previousSibling.previousElementSibling;if(!n||!e)this.mediaUnsetCallback(r);else{let s=n.slot!=="media";for(;(n=n.previousSibling)!==null;)n.slot=="media"&&(s=!1);s&&this.mediaUnsetCallback(r)}}if(e)for(const r of i.addedNodes)r===e&&this.handleMediaUpdated(e)}};Cr=new WeakMap;ts=new WeakMap;Ol=new WeakSet;dp=function(t){if(t.pointerType!=="mouse"&&t.timeStamp-Ze(this,ao)<250)return;ot(this,No,ru).call(this),clearTimeout(Ze(this,on));const e=this.hasAttribute(M.AUTOHIDE_OVER_CONTROLS);([this,this.media].includes(t.target)||e)&&ot(this,er,dn).call(this)};Nl=new WeakSet;up=function(t){if(t.pointerType==="touch"){const e=!this.hasAttribute(M.USER_INACTIVE);[this,this.media].includes(t.target)&&e?ot(this,ln,Oo).call(this):ot(this,er,dn).call(this)}else t.composedPath().some(e=>["media-play-button","media-fullscreen-button"].includes(e?.localName))&&ot(this,er,dn).call(this)};ln=new WeakSet;Oo=function(){if(Ze(this,Ua)<0||this.hasAttribute(M.USER_INACTIVE))return;this.setAttribute(M.USER_INACTIVE,"");const t=new f.CustomEvent(ri.USER_INACTIVE_CHANGE,{composed:!0,bubbles:!0,detail:!0});this.dispatchEvent(t)};No=new WeakSet;ru=function(){if(!this.hasAttribute(M.USER_INACTIVE))return;this.removeAttribute(M.USER_INACTIVE);const t=new f.CustomEvent(ri.USER_INACTIVE_CHANGE,{composed:!0,bubbles:!0,detail:!1});this.dispatchEvent(t)};er=new WeakSet;dn=function(){ot(this,No,ru).call(this),clearTimeout(Ze(this,on));const t=parseInt(this.autohide);t<0||Mi(this,on,setTimeout(()=>{ot(this,ln,Oo).call(this)},t*1e3))};Po.shadowRootOptions={mode:"open"};Po.getTemplateHTML=Cg;f.customElements.get("media-container")||f.customElements.define("media-container",Po);var hp=(t,e,i)=>{if(!e.has(t))throw TypeError("Cannot "+i)},Ie=(t,e,i)=>(hp(t,e,"read from private field"),i?i.call(t):e.get(t)),hr=(t,e,i)=>{if(e.has(t))throw TypeError("Cannot add the same private member more than once");e instanceof WeakSet?e.add(t):e.set(t,i)},In=(t,e,i,a)=>(hp(t,e,"write to private field"),e.set(t,i),i),Ea,_a,ro,Vi,Zt,hi;class nu{constructor(e,i,{defaultValue:a}={defaultValue:void 0}){hr(this,Zt),hr(this,Ea,void 0),hr(this,_a,void 0),hr(this,ro,void 0),hr(this,Vi,new Set),In(this,Ea,e),In(this,_a,i),In(this,ro,new Set(a))}[Symbol.iterator](){return Ie(this,Zt,hi).values()}get length(){return Ie(this,Zt,hi).size}get value(){var e;return(e=[...Ie(this,Zt,hi)].join(" "))!=null?e:""}set value(e){var i;e!==this.value&&(In(this,Vi,new Set),this.add(...(i=e?.split(" "))!=null?i:[]))}toString(){return this.value}item(e){return[...Ie(this,Zt,hi)][e]}values(){return Ie(this,Zt,hi).values()}forEach(e,i){Ie(this,Zt,hi).forEach(e,i)}add(...e){var i,a;e.forEach(r=>Ie(this,Vi).add(r)),!(this.value===""&&!((i=Ie(this,Ea))!=null&&i.hasAttribute(`${Ie(this,_a)}`)))&&((a=Ie(this,Ea))==null||a.setAttribute(`${Ie(this,_a)}`,`${this.value}`))}remove(...e){var i;e.forEach(a=>Ie(this,Vi).delete(a)),(i=Ie(this,Ea))==null||i.setAttribute(`${Ie(this,_a)}`,`${this.value}`)}contains(e){return Ie(this,Zt,hi).has(e)}toggle(e,i){return typeof i<"u"?i?(this.add(e),!0):(this.remove(e),!1):this.contains(e)?(this.remove(e),!1):(this.add(e),!0)}replace(e,i){return this.remove(e),this.add(i),e===i}}Ea=new WeakMap;_a=new WeakMap;ro=new WeakMap;Vi=new WeakMap;Zt=new WeakSet;hi=function(){return Ie(this,Vi).size?Ie(this,Vi):Ie(this,ro)};const Ng=(t="")=>t.split(/\s+/),mp=(t="")=>{const[e,i,a]=t.split(":"),r=a?decodeURIComponent(a):void 0;return{kind:e==="cc"?qt.CAPTIONS:qt.SUBTITLES,language:i,label:r}},Uo=(t="",e={})=>Ng(t).map(i=>{const a=mp(i);return{...e,...a}}),pp=t=>t?Array.isArray(t)?t.map(e=>typeof e=="string"?mp(e):e):typeof t=="string"?Uo(t):[t]:[],Pl=({kind:t,label:e,language:i}={kind:"subtitles"})=>e?`${t==="captions"?"cc":"sb"}:${i}:${encodeURIComponent(e)}`:i,un=(t=[])=>Array.prototype.map.call(t,Pl).join(" "),Pg=(t,e)=>i=>i[t]===e,vp=t=>{const e=Object.entries(t).map(([i,a])=>Pg(i,a));return i=>e.every(a=>a(i))},zr=(t,e=[],i=[])=>{const a=pp(i).map(vp),r=n=>a.some(s=>s(n));Array.from(e).filter(r).forEach(n=>{n.mode=t})},$o=(t,e=()=>!0)=>{if(!t?.textTracks)return[];const i=typeof e=="function"?e:vp(e);return Array.from(t.textTracks).filter(i)},fp=t=>{var e;return!!((e=t.mediaSubtitlesShowing)!=null&&e.length)||t.hasAttribute(u.MEDIA_SUBTITLES_SHOWING)},Ug=t=>{var e;const{media:i,fullscreenElement:a}=t;try{const r=a&&"requestFullscreen"in a?"requestFullscreen":a&&"webkitRequestFullScreen"in a?"webkitRequestFullScreen":void 0;if(r){const n=(e=a[r])==null?void 0:e.call(a);if(n instanceof Promise)return n.catch(()=>{})}else i?.webkitEnterFullscreen?i.webkitEnterFullscreen():i?.requestFullscreen&&i.requestFullscreen()}catch(r){console.error(r)}},qc="exitFullscreen"in ge?"exitFullscreen":"webkitExitFullscreen"in ge?"webkitExitFullscreen":"webkitCancelFullScreen"in ge?"webkitCancelFullScreen":void 0,$g=t=>{var e;const{documentElement:i}=t;if(qc){const a=(e=i?.[qc])==null?void 0:e.call(i);if(a instanceof Promise)return a.catch(()=>{})}},Lr="fullscreenElement"in ge?"fullscreenElement":"webkitFullscreenElement"in ge?"webkitFullscreenElement":void 0,Hg=t=>{const{documentElement:e,media:i}=t,a=e?.[Lr];return!a&&"webkitDisplayingFullscreen"in i&&"webkitPresentationMode"in i&&i.webkitDisplayingFullscreen&&i.webkitPresentationMode===lg.FULLSCREEN?i:a},Bg=t=>{var e;const{media:i,documentElement:a,fullscreenElement:r=i}=t;if(!i||!a)return!1;const n=Hg(t);if(!n)return!1;if(n===r||n===i)return!0;if(n.localName.includes("-")){let s=n.shadowRoot;if(!(Lr in s))return si(n,r);for(;s?.[Lr];){if(s[Lr]===r)return!0;s=(e=s[Lr])==null?void 0:e.shadowRoot}}return!1},Wg="fullscreenEnabled"in ge?"fullscreenEnabled":"webkitFullscreenEnabled"in ge?"webkitFullscreenEnabled":void 0,Fg=t=>{const{documentElement:e,media:i}=t;return!!e?.[Wg]||i&&"webkitSupportsFullscreen"in i};let Rn;const su=()=>{var t,e;return Rn||(Rn=(e=(t=ge)==null?void 0:t.createElement)==null?void 0:e.call(t,"video"),Rn)},Kg=async(t=su())=>{if(!t)return!1;const e=t.volume;t.volume=e/2+.1;const i=new AbortController,a=await Promise.race([Vg(t,i.signal),qg(t,e)]);return i.abort(),a},Vg=(t,e)=>new Promise(i=>{t.addEventListener("volumechange",()=>i(!0),{signal:e})}),qg=async(t,e)=>{for(let i=0;i<10;i++){if(t.volume===e)return!1;await jm(10)}return t.volume!==e},Yg=/.*Version\/.*Safari\/.*/.test(f.navigator.userAgent),Ep=(t=su())=>f.matchMedia("(display-mode: standalone)").matches&&Yg?!1:typeof t?.requestPictureInPicture=="function",_p=(t=su())=>Fg({documentElement:ge,media:t}),Gg=_p(),Qg=Ep(),zg=!!f.WebKitPlaybackTargetAvailabilityEvent,Zg=!!f.chrome,no=t=>$o(t.media,e=>[qt.SUBTITLES,qt.CAPTIONS].includes(e.kind)).sort((e,i)=>e.kind>=i.kind?1:-1),bp=t=>$o(t.media,e=>e.mode===Ka.SHOWING&&[qt.SUBTITLES,qt.CAPTIONS].includes(e.kind)),gp=(t,e)=>{const i=no(t),a=bp(t),r=!!a.length;if(i.length){if(e===!1||r&&e!==!0)zr(Ka.DISABLED,i,a);else if(e===!0||!r&&e!==!1){let n=i[0];const{options:s}=t;if(!s?.noSubtitlesLangPref){const m=globalThis.localStorage.getItem("media-chrome-pref-subtitles-lang"),p=m?[m,...globalThis.navigator.languages]:globalThis.navigator.languages,h=i.filter(c=>p.some(v=>c.language.toLowerCase().startsWith(v.split("-")[0]))).sort((c,v)=>{const E=p.findIndex(y=>c.language.toLowerCase().startsWith(y.split("-")[0])),g=p.findIndex(y=>v.language.toLowerCase().startsWith(y.split("-")[0]));return E-g});h[0]&&(n=h[0])}const{language:o,label:l,kind:d}=n;zr(Ka.DISABLED,i,a),zr(Ka.SHOWING,i,[{language:o,label:l,kind:d}])}}},ou=(t,e)=>t===e?!0:t==null||e==null||typeof t!=typeof e?!1:typeof t=="number"&&Number.isNaN(t)&&Number.isNaN(e)?!0:typeof t!="object"?!1:Array.isArray(t)?jg(t,e):Object.entries(t).every(([i,a])=>i in e&&ou(a,e[i])),jg=(t,e)=>{const i=Array.isArray(t),a=Array.isArray(e);return i!==a?!1:i||a?t.length!==e.length?!1:t.every((r,n)=>ou(r,e[n])):!0},Xg=Object.values(Xt);let so;const Jg=Kg().then(t=>(so=t,so)),e0=async(...t)=>{await Promise.all(t.filter(e=>e).map(async e=>{if(!("localName"in e&&e instanceof f.HTMLElement))return;const i=e.localName;if(!i.includes("-"))return;const a=f.customElements.get(i);a&&e instanceof a||(await f.customElements.whenDefined(i),f.customElements.upgrade(e))}))},t0=new f.DOMParser,i0=t=>t&&(t0.parseFromString(t,"text/html").body.textContent||t),Dr={mediaError:{get(t,e){const{media:i}=t;if(e?.type!=="playing")return i?.error},mediaEvents:["emptied","error","playing"]},mediaErrorCode:{get(t,e){var i;const{media:a}=t;if(e?.type!=="playing")return(i=a?.error)==null?void 0:i.code},mediaEvents:["emptied","error","playing"]},mediaErrorMessage:{get(t,e){var i,a;const{media:r}=t;if(e?.type!=="playing")return(a=(i=r?.error)==null?void 0:i.message)!=null?a:""},mediaEvents:["emptied","error","playing"]},mediaWidth:{get(t){var e;const{media:i}=t;return(e=i?.videoWidth)!=null?e:0},mediaEvents:["resize"]},mediaHeight:{get(t){var e;const{media:i}=t;return(e=i?.videoHeight)!=null?e:0},mediaEvents:["resize"]},mediaPaused:{get(t){var e;const{media:i}=t;return(e=i?.paused)!=null?e:!0},set(t,e){var i;const{media:a}=e;a&&(t?a.pause():(i=a.play())==null||i.catch(()=>{}))},mediaEvents:["play","playing","pause","emptied"]},mediaHasPlayed:{get(t,e){const{media:i}=t;return i?e?e.type==="playing":!i.paused:!1},mediaEvents:["playing","emptied"]},mediaEnded:{get(t){var e;const{media:i}=t;return(e=i?.ended)!=null?e:!1},mediaEvents:["seeked","ended","emptied"]},mediaPlaybackRate:{get(t){var e;const{media:i}=t;return(e=i?.playbackRate)!=null?e:1},set(t,e){const{media:i}=e;i&&Number.isFinite(+t)&&(i.playbackRate=+t)},mediaEvents:["ratechange","loadstart"]},mediaMuted:{get(t){var e;const{media:i}=t;return(e=i?.muted)!=null?e:!1},set(t,e){const{media:i,options:{noMutedPref:a}={}}=e;if(i){i.muted=t;try{const r=f.localStorage.getItem("media-chrome-pref-muted")!==null,n=i.hasAttribute("muted");if(a){r&&f.localStorage.removeItem("media-chrome-pref-muted");return}if(n&&!r)return;f.localStorage.setItem("media-chrome-pref-muted",t?"true":"false")}catch(r){console.debug("Error setting muted pref",r)}}},mediaEvents:["volumechange"],stateOwnersUpdateHandlers:[(t,e)=>{const{options:{noMutedPref:i}}=e,{media:a}=e;if(!(!a||a.muted||i))try{const r=f.localStorage.getItem("media-chrome-pref-muted")==="true";Dr.mediaMuted.set(r,e),t(r)}catch(r){console.debug("Error getting muted pref",r)}}]},mediaLoop:{get(t){const{media:e}=t;return e?.loop},set(t,e){const{media:i}=e;i&&(i.loop=t)},mediaEvents:["medialooprequest"]},mediaVolume:{get(t){var e;const{media:i}=t;return(e=i?.volume)!=null?e:1},set(t,e){const{media:i,options:{noVolumePref:a}={}}=e;if(i){try{t==null?f.localStorage.removeItem("media-chrome-pref-volume"):!i.hasAttribute("muted")&&!a&&f.localStorage.setItem("media-chrome-pref-volume",t.toString())}catch(r){console.debug("Error setting volume pref",r)}Number.isFinite(+t)&&(i.volume=+t)}},mediaEvents:["volumechange"],stateOwnersUpdateHandlers:[(t,e)=>{const{options:{noVolumePref:i}}=e;if(!i)try{const{media:a}=e;if(!a)return;const r=f.localStorage.getItem("media-chrome-pref-volume");if(r==null)return;Dr.mediaVolume.set(+r,e),t(+r)}catch(a){console.debug("Error getting volume pref",a)}}]},mediaVolumeLevel:{get(t){const{media:e}=t;return typeof e?.volume>"u"?"high":e.muted||e.volume===0?"off":e.volume<.5?"low":e.volume<.75?"medium":"high"},mediaEvents:["volumechange"]},mediaCurrentTime:{get(t){var e;const{media:i}=t;return(e=i?.currentTime)!=null?e:0},set(t,e){const{media:i}=e;!i||!Jd(t)||(i.currentTime=t)},mediaEvents:["timeupdate","loadedmetadata"]},mediaDuration:{get(t){const{media:e,options:{defaultDuration:i}={}}=t;return i&&(!e||!e.duration||Number.isNaN(e.duration)||!Number.isFinite(e.duration))?i:Number.isFinite(e?.duration)?e.duration:Number.NaN},mediaEvents:["durationchange","loadedmetadata","emptied"]},mediaLoading:{get(t){const{media:e}=t;return e?.readyState<3},mediaEvents:["waiting","playing","emptied"]},mediaSeekable:{get(t){var e;const{media:i}=t;if(!((e=i?.seekable)!=null&&e.length))return;const a=i.seekable.start(0),r=i.seekable.end(i.seekable.length-1);if(!(!a&&!r))return[Number(a.toFixed(3)),Number(r.toFixed(3))]},mediaEvents:["loadedmetadata","emptied","progress","seekablechange"]},mediaBuffered:{get(t){var e;const{media:i}=t,a=(e=i?.buffered)!=null?e:[];return Array.from(a).map((r,n)=>[Number(a.start(n).toFixed(3)),Number(a.end(n).toFixed(3))])},mediaEvents:["progress","emptied"]},mediaStreamType:{get(t){const{media:e,options:{defaultStreamType:i}={}}=t,a=[Xt.LIVE,Xt.ON_DEMAND].includes(i)?i:void 0;if(!e)return a;const{streamType:r}=e;if(Xg.includes(r))return r===Xt.UNKNOWN?a:r;const n=e.duration;return n===1/0?Xt.LIVE:Number.isFinite(n)?Xt.ON_DEMAND:a},mediaEvents:["emptied","durationchange","loadedmetadata","streamtypechange"]},mediaTargetLiveWindow:{get(t){const{media:e}=t;if(!e)return Number.NaN;const{targetLiveWindow:i}=e,a=Dr.mediaStreamType.get(t);return(i==null||Number.isNaN(i))&&a===Xt.LIVE?0:i},mediaEvents:["emptied","durationchange","loadedmetadata","streamtypechange","targetlivewindowchange"]},mediaTimeIsLive:{get(t){const{media:e,options:{liveEdgeOffset:i=10}={}}=t;if(!e)return!1;if(typeof e.liveEdgeStart=="number")return Number.isNaN(e.liveEdgeStart)?!1:e.currentTime>=e.liveEdgeStart;if(!(Dr.mediaStreamType.get(t)===Xt.LIVE))return!1;const r=e.seekable;if(!r)return!0;if(!r.length)return!1;const n=r.end(r.length-1)-i;return e.currentTime>=n},mediaEvents:["playing","timeupdate","progress","waiting","emptied"]},mediaSubtitlesList:{get(t){return no(t).map(({kind:e,label:i,language:a})=>({kind:e,label:i,language:a}))},mediaEvents:["loadstart"],textTracksEvents:["addtrack","removetrack"]},mediaSubtitlesShowing:{get(t){return bp(t).map(({kind:e,label:i,language:a})=>({kind:e,label:i,language:a}))},mediaEvents:["loadstart"],textTracksEvents:["addtrack","removetrack","change"],stateOwnersUpdateHandlers:[(t,e)=>{var i,a;const{media:r,options:n}=e;if(!r)return;const s=o=>{var l;!n.defaultSubtitles||o&&![qt.CAPTIONS,qt.SUBTITLES].includes((l=o?.track)==null?void 0:l.kind)||gp(e,!0)};return r.addEventListener("loadstart",s),(i=r.textTracks)==null||i.addEventListener("addtrack",s),(a=r.textTracks)==null||a.addEventListener("removetrack",s),()=>{var o,l;r.removeEventListener("loadstart",s),(o=r.textTracks)==null||o.removeEventListener("addtrack",s),(l=r.textTracks)==null||l.removeEventListener("removetrack",s)}}]},mediaChaptersCues:{get(t){var e;const{media:i}=t;if(!i)return[];const[a]=$o(i,{kind:qt.CHAPTERS});return Array.from((e=a?.cues)!=null?e:[]).map(({text:r,startTime:n,endTime:s})=>({text:i0(r),startTime:n,endTime:s}))},mediaEvents:["loadstart","loadedmetadata"],textTracksEvents:["addtrack","removetrack","change"],stateOwnersUpdateHandlers:[(t,e)=>{var i;const{media:a}=e;if(!a)return;const r=a.querySelector('track[kind="chapters"][default][src]'),n=(i=a.shadowRoot)==null?void 0:i.querySelector(':is(video,audio) > track[kind="chapters"][default][src]');return r?.addEventListener("load",t),n?.addEventListener("load",t),()=>{r?.removeEventListener("load",t),n?.removeEventListener("load",t)}}]},mediaIsPip:{get(t){var e,i;const{media:a,documentElement:r}=t;if(!a||!r||!r.pictureInPictureElement)return!1;if(r.pictureInPictureElement===a)return!0;if(r.pictureInPictureElement instanceof HTMLMediaElement)return(e=a.localName)!=null&&e.includes("-")?si(a,r.pictureInPictureElement):!1;if(r.pictureInPictureElement.localName.includes("-")){let n=r.pictureInPictureElement.shadowRoot;for(;n?.pictureInPictureElement;){if(n.pictureInPictureElement===a)return!0;n=(i=n.pictureInPictureElement)==null?void 0:i.shadowRoot}}return!1},set(t,e){const{media:i}=e;if(i)if(t){if(!ge.pictureInPictureEnabled){console.warn("MediaChrome: Picture-in-picture is not enabled");return}if(!i.requestPictureInPicture){console.warn("MediaChrome: The current media does not support picture-in-picture");return}const a=()=>{console.warn("MediaChrome: The media is not ready for picture-in-picture. It must have a readyState > 0.")};i.requestPictureInPicture().catch(r=>{if(r.code===11){if(!i.src){console.warn("MediaChrome: The media is not ready for picture-in-picture. It must have a src set.");return}if(i.readyState===0&&i.preload==="none"){const n=()=>{i.removeEventListener("loadedmetadata",s),i.preload="none"},s=()=>{i.requestPictureInPicture().catch(a),n()};i.addEventListener("loadedmetadata",s),i.preload="metadata",setTimeout(()=>{i.readyState===0&&a(),n()},1e3)}else throw r}else throw r})}else ge.pictureInPictureElement&&ge.exitPictureInPicture()},mediaEvents:["enterpictureinpicture","leavepictureinpicture"]},mediaRenditionList:{get(t){var e;const{media:i}=t;return[...(e=i?.videoRenditions)!=null?e:[]].map(a=>({...a}))},mediaEvents:["emptied","loadstart"],videoRenditionsEvents:["addrendition","removerendition"]},mediaRenditionSelected:{get(t){var e,i,a;const{media:r}=t;return(a=(i=r?.videoRenditions)==null?void 0:i[(e=r.videoRenditions)==null?void 0:e.selectedIndex])==null?void 0:a.id},set(t,e){const{media:i}=e;if(!i?.videoRenditions){console.warn("MediaController: Rendition selection not supported by this media.");return}const a=t,r=Array.prototype.findIndex.call(i.videoRenditions,n=>n.id==a);i.videoRenditions.selectedIndex!=r&&(i.videoRenditions.selectedIndex=r)},mediaEvents:["emptied"],videoRenditionsEvents:["addrendition","removerendition","change"]},mediaAudioTrackList:{get(t){var e;const{media:i}=t;return[...(e=i?.audioTracks)!=null?e:[]]},mediaEvents:["emptied","loadstart"],audioTracksEvents:["addtrack","removetrack"]},mediaAudioTrackEnabled:{get(t){var e,i;const{media:a}=t;return(i=[...(e=a?.audioTracks)!=null?e:[]].find(r=>r.enabled))==null?void 0:i.id},set(t,e){const{media:i}=e;if(!i?.audioTracks){console.warn("MediaChrome: Audio track selection not supported by this media.");return}const a=t;for(const r of i.audioTracks)r.enabled=a==r.id},mediaEvents:["emptied"],audioTracksEvents:["addtrack","removetrack","change"]},mediaIsFullscreen:{get(t){return Bg(t)},set(t,e,i){var a;t?(Ug(e),i.detail&&((a=e.media)==null||a.focus())):$g(e)},rootEvents:["fullscreenchange","webkitfullscreenchange"],mediaEvents:["webkitbeginfullscreen","webkitendfullscreen","webkitpresentationmodechanged"]},mediaIsCasting:{get(t){var e;const{media:i}=t;return!i?.remote||((e=i.remote)==null?void 0:e.state)==="disconnected"?!1:!!i.remote.state},set(t,e){var i,a;const{media:r}=e;if(r&&!(t&&((i=r.remote)==null?void 0:i.state)!=="disconnected")&&!(!t&&((a=r.remote)==null?void 0:a.state)!=="connected")){if(typeof r.remote.prompt!="function"){console.warn("MediaChrome: Casting is not supported in this environment");return}r.remote.prompt().catch(()=>{})}},remoteEvents:["connect","connecting","disconnect"]},mediaIsAirplaying:{get(){return!1},set(t,e){const{media:i}=e;if(i){if(!(i.webkitShowPlaybackTargetPicker&&f.WebKitPlaybackTargetAvailabilityEvent)){console.error("MediaChrome: received a request to select AirPlay but AirPlay is not supported in this environment");return}i.webkitShowPlaybackTargetPicker()}},mediaEvents:["webkitcurrentplaybacktargetiswirelesschanged"]},mediaFullscreenUnavailable:{get(t){const{media:e}=t;if(!Gg||!_p(e))return Ye.UNSUPPORTED}},mediaPipUnavailable:{get(t){const{media:e}=t;if(!Qg||!Ep(e))return Ye.UNSUPPORTED;if(e?.disablePictureInPicture)return Ye.UNAVAILABLE}},mediaVolumeUnavailable:{get(t){const{media:e}=t;if(so===!1||e?.volume==null)return Ye.UNSUPPORTED},stateOwnersUpdateHandlers:[t=>{so==null&&Jg.then(e=>t(e?void 0:Ye.UNSUPPORTED))}]},mediaCastUnavailable:{get(t,{availability:e="not-available"}={}){var i;const{media:a}=t;if(!Zg||!((i=a?.remote)!=null&&i.state))return Ye.UNSUPPORTED;if(!(e==null||e==="available"))return Ye.UNAVAILABLE},stateOwnersUpdateHandlers:[(t,e)=>{var i;const{media:a}=e;return a?(a.disableRemotePlayback||a.hasAttribute("disableremoteplayback")||(i=a?.remote)==null||i.watchAvailability(n=>{t({availability:n?"available":"not-available"})}).catch(n=>{n.name==="NotSupportedError"?t({availability:null}):t({availability:"not-available"})}),()=>{var n;(n=a?.remote)==null||n.cancelWatchAvailability().catch(()=>{})}):void 0}]},mediaAirplayUnavailable:{get(t,e){if(!zg)return Ye.UNSUPPORTED;if(e?.availability==="not-available")return Ye.UNAVAILABLE},mediaEvents:["webkitplaybacktargetavailabilitychanged"],stateOwnersUpdateHandlers:[(t,e)=>{var i;const{media:a}=e;return a?(a.disableRemotePlayback||a.hasAttribute("disableremoteplayback")||(i=a?.remote)==null||i.watchAvailability(n=>{t({availability:n?"available":"not-available"})}).catch(n=>{n.name==="NotSupportedError"?t({availability:null}):t({availability:"not-available"})}),()=>{var n;(n=a?.remote)==null||n.cancelWatchAvailability().catch(()=>{})}):void 0}]},mediaRenditionUnavailable:{get(t){var e;const{media:i}=t;if(!i?.videoRenditions)return Ye.UNSUPPORTED;if(!((e=i.videoRenditions)!=null&&e.length))return Ye.UNAVAILABLE},mediaEvents:["emptied","loadstart"],videoRenditionsEvents:["addrendition","removerendition"]},mediaAudioTrackUnavailable:{get(t){var e,i;const{media:a}=t;if(!a?.audioTracks)return Ye.UNSUPPORTED;if(((i=(e=a.audioTracks)==null?void 0:e.length)!=null?i:0)<=1)return Ye.UNAVAILABLE},mediaEvents:["emptied","loadstart"],audioTracksEvents:["addtrack","removetrack"]},mediaLang:{get(t){const{options:{mediaLang:e}={}}=t;return e??"en"}}},a0={[I.MEDIA_PREVIEW_REQUEST](t,e,{detail:i}){var a,r,n;const{media:s}=e,o=i??void 0;let l,d;if(s&&o!=null){const[c]=$o(s,{kind:qt.METADATA,label:"thumbnails"}),v=Array.prototype.find.call((a=c?.cues)!=null?a:[],(E,g,y)=>g===0?E.endTime>o:g===y.length-1?E.startTime<=o:E.startTime<=o&&E.endTime>o);if(v){const E=/'^(?:[a-z]+:)?\/\//i.test(v.text)||(r=s?.querySelector('track[label="thumbnails"]'))==null?void 0:r.src,g=new URL(v.text,E);d=new URLSearchParams(g.hash).get("#xywh").split(",").map(T=>+T),l=g.href}}const m=t.mediaDuration.get(e);let h=(n=t.mediaChaptersCues.get(e).find((c,v,E)=>v===E.length-1&&m===c.endTime?c.startTime<=o&&c.endTime>=o:c.startTime<=o&&c.endTime>o))==null?void 0:n.text;return i!=null&&h==null&&(h=""),{mediaPreviewTime:o,mediaPreviewImage:l,mediaPreviewCoords:d,mediaPreviewChapter:h}},[I.MEDIA_PAUSE_REQUEST](t,e){t["mediaPaused"].set(!0,e)},[I.MEDIA_PLAY_REQUEST](t,e){var i,a,r,n;const s="mediaPaused",l=t.mediaStreamType.get(e)===Xt.LIVE,d=!((i=e.options)!=null&&i.noAutoSeekToLive),m=t.mediaTargetLiveWindow.get(e)>0;if(l&&d&&!m){const p=(a=t.mediaSeekable.get(e))==null?void 0:a[1];if(p){const h=(n=(r=e.options)==null?void 0:r.seekToLiveOffset)!=null?n:0,c=p-h;t.mediaCurrentTime.set(c,e)}}t[s].set(!1,e)},[I.MEDIA_PLAYBACK_RATE_REQUEST](t,e,{detail:i}){const a="mediaPlaybackRate",r=i;t[a].set(r,e)},[I.MEDIA_MUTE_REQUEST](t,e){t["mediaMuted"].set(!0,e)},[I.MEDIA_UNMUTE_REQUEST](t,e){const i="mediaMuted";t.mediaVolume.get(e)||t.mediaVolume.set(.25,e),t[i].set(!1,e)},[I.MEDIA_LOOP_REQUEST](t,e,{detail:i}){const a="mediaLoop",r=!!i;return t[a].set(r,e),{mediaLoop:r}},[I.MEDIA_VOLUME_REQUEST](t,e,{detail:i}){const a="mediaVolume",r=i;r&&t.mediaMuted.get(e)&&t.mediaMuted.set(!1,e),t[a].set(r,e)},[I.MEDIA_SEEK_REQUEST](t,e,{detail:i}){const a="mediaCurrentTime",r=i;t[a].set(r,e)},[I.MEDIA_SEEK_TO_LIVE_REQUEST](t,e){var i,a,r;const n="mediaCurrentTime",s=(i=t.mediaSeekable.get(e))==null?void 0:i[1];if(Number.isNaN(Number(s)))return;const o=(r=(a=e.options)==null?void 0:a.seekToLiveOffset)!=null?r:0,l=s-o;t[n].set(l,e)},[I.MEDIA_SHOW_SUBTITLES_REQUEST](t,e,{detail:i}){var a;const{options:r}=e,n=no(e),s=pp(i),o=(a=s[0])==null?void 0:a.language;o&&!r.noSubtitlesLangPref&&f.localStorage.setItem("media-chrome-pref-subtitles-lang",o),zr(Ka.SHOWING,n,s)},[I.MEDIA_DISABLE_SUBTITLES_REQUEST](t,e,{detail:i}){const a=no(e),r=i??[];zr(Ka.DISABLED,a,r)},[I.MEDIA_TOGGLE_SUBTITLES_REQUEST](t,e,{detail:i}){gp(e,i)},[I.MEDIA_RENDITION_REQUEST](t,e,{detail:i}){const a="mediaRenditionSelected",r=i;t[a].set(r,e)},[I.MEDIA_AUDIO_TRACK_REQUEST](t,e,{detail:i}){const a="mediaAudioTrackEnabled",r=i;t[a].set(r,e)},[I.MEDIA_ENTER_PIP_REQUEST](t,e){const i="mediaIsPip";t.mediaIsFullscreen.get(e)&&t.mediaIsFullscreen.set(!1,e),t[i].set(!0,e)},[I.MEDIA_EXIT_PIP_REQUEST](t,e){t["mediaIsPip"].set(!1,e)},[I.MEDIA_ENTER_FULLSCREEN_REQUEST](t,e,i){const a="mediaIsFullscreen";t.mediaIsPip.get(e)&&t.mediaIsPip.set(!1,e),t[a].set(!0,e,i)},[I.MEDIA_EXIT_FULLSCREEN_REQUEST](t,e){t["mediaIsFullscreen"].set(!1,e)},[I.MEDIA_ENTER_CAST_REQUEST](t,e){const i="mediaIsCasting";t.mediaIsFullscreen.get(e)&&t.mediaIsFullscreen.set(!1,e),t[i].set(!0,e)},[I.MEDIA_EXIT_CAST_REQUEST](t,e){t["mediaIsCasting"].set(!1,e)},[I.MEDIA_AIRPLAY_REQUEST](t,e){t["mediaIsAirplaying"].set(!0,e)}},r0=({media:t,fullscreenElement:e,documentElement:i,stateMediator:a=Dr,requestMap:r=a0,options:n={},monitorStateOwnersOnlyWithSubscriptions:s=!0})=>{const o=[],l={options:{...n}};let d=Object.freeze({mediaPreviewTime:void 0,mediaPreviewImage:void 0,mediaPreviewCoords:void 0,mediaPreviewChapter:void 0});const m=E=>{E!=null&&(ou(E,d)||(d=Object.freeze({...d,...E}),o.forEach(g=>g(d))))},p=()=>{const E=Object.entries(a).reduce((g,[y,{get:T}])=>(g[y]=T(l),g),{});m(E)},h={};let c;const v=async(E,g)=>{var y,T,_,S,C,N,$,G,J,K,U,Me,Fe,Ke,he,Pe;const Tt=!!c;if(c={...l,...c??{},...E},Tt)return;await e0(...Object.values(E));const Ue=o.length>0&&g===0&&s,dt=l.media!==c.media,Ve=((y=l.media)==null?void 0:y.textTracks)!==((T=c.media)==null?void 0:T.textTracks),ke=((_=l.media)==null?void 0:_.videoRenditions)!==((S=c.media)==null?void 0:S.videoRenditions),xe=((C=l.media)==null?void 0:C.audioTracks)!==((N=c.media)==null?void 0:N.audioTracks),et=(($=l.media)==null?void 0:$.remote)!==((G=c.media)==null?void 0:G.remote),na=l.documentElement!==c.documentElement,yn=!!l.media&&(dt||Ue),sc=!!((J=l.media)!=null&&J.textTracks)&&(Ve||Ue),oc=!!((K=l.media)!=null&&K.videoRenditions)&&(ke||Ue),lc=!!((U=l.media)!=null&&U.audioTracks)&&(xe||Ue),dc=!!((Me=l.media)!=null&&Me.remote)&&(et||Ue),uc=!!l.documentElement&&(na||Ue),Qo=yn||sc||oc||lc||dc||uc,sa=o.length===0&&g===1&&s,cc=!!c.media&&(dt||sa),hc=!!((Fe=c.media)!=null&&Fe.textTracks)&&(Ve||sa),mc=!!((Ke=c.media)!=null&&Ke.videoRenditions)&&(ke||sa),pc=!!((he=c.media)!=null&&he.audioTracks)&&(xe||sa),vc=!!((Pe=c.media)!=null&&Pe.remote)&&(et||sa),fc=!!c.documentElement&&(na||sa),Ec=cc||hc||mc||pc||vc||fc;if(!(Qo||Ec)){Object.entries(c).forEach(([Z,dr])=>{l[Z]=dr}),p(),c=void 0;return}Object.entries(a).forEach(([Z,{get:dr,mediaEvents:af=[],textTracksEvents:rf=[],videoRenditionsEvents:nf=[],audioTracksEvents:sf=[],remoteEvents:of=[],rootEvents:lf=[],stateOwnersUpdateHandlers:df=[]}])=>{h[Z]||(h[Z]={});const qe=se=>{const me=dr(l,se);m({[Z]:me})};let Se;Se=h[Z].mediaEvents,af.forEach(se=>{Se&&yn&&(l.media.removeEventListener(se,Se),h[Z].mediaEvents=void 0),cc&&(c.media.addEventListener(se,qe),h[Z].mediaEvents=qe)}),Se=h[Z].textTracksEvents,rf.forEach(se=>{var me,ut;Se&&sc&&((me=l.media.textTracks)==null||me.removeEventListener(se,Se),h[Z].textTracksEvents=void 0),hc&&((ut=c.media.textTracks)==null||ut.addEventListener(se,qe),h[Z].textTracksEvents=qe)}),Se=h[Z].videoRenditionsEvents,nf.forEach(se=>{var me,ut;Se&&oc&&((me=l.media.videoRenditions)==null||me.removeEventListener(se,Se),h[Z].videoRenditionsEvents=void 0),mc&&((ut=c.media.videoRenditions)==null||ut.addEventListener(se,qe),h[Z].videoRenditionsEvents=qe)}),Se=h[Z].audioTracksEvents,sf.forEach(se=>{var me,ut;Se&&lc&&((me=l.media.audioTracks)==null||me.removeEventListener(se,Se),h[Z].audioTracksEvents=void 0),pc&&((ut=c.media.audioTracks)==null||ut.addEventListener(se,qe),h[Z].audioTracksEvents=qe)}),Se=h[Z].remoteEvents,of.forEach(se=>{var me,ut;Se&&dc&&((me=l.media.remote)==null||me.removeEventListener(se,Se),h[Z].remoteEvents=void 0),vc&&((ut=c.media.remote)==null||ut.addEventListener(se,qe),h[Z].remoteEvents=qe)}),Se=h[Z].rootEvents,lf.forEach(se=>{Se&&uc&&(l.documentElement.removeEventListener(se,Se),h[Z].rootEvents=void 0),fc&&(c.documentElement.addEventListener(se,qe),h[Z].rootEvents=qe)});const Tn=h[Z].stateOwnersUpdateHandlers;if(Tn&&Qo&&(Array.isArray(Tn)?Tn:[Tn]).forEach(me=>{typeof me=="function"&&me()}),Ec){const se=df.map(me=>me(qe,c)).filter(me=>typeof me=="function");h[Z].stateOwnersUpdateHandlers=se.length===1?se[0]:se}else Qo&&(h[Z].stateOwnersUpdateHandlers=void 0)}),Object.entries(c).forEach(([Z,dr])=>{l[Z]=dr}),p(),c=void 0};return v({media:t,fullscreenElement:e,documentElement:i,options:n}),{dispatch(E){const{type:g,detail:y}=E;if(r[g]&&d.mediaErrorCode==null){m(r[g](a,l,E));return}g==="mediaelementchangerequest"?v({media:y}):g==="fullscreenelementchangerequest"?v({fullscreenElement:y}):g==="documentelementchangerequest"?v({documentElement:y}):g==="optionschangerequest"&&(Object.entries(y??{}).forEach(([T,_])=>{l.options[T]=_}),p())},getState(){return d},subscribe(E){return v({},o.length+1),o.push(E),E(d),()=>{const g=o.indexOf(E);g>=0&&(v({},o.length-1),o.splice(g,1))}}}};var lu=(t,e,i)=>{if(!e.has(t))throw TypeError("Cannot "+i)},O=(t,e,i)=>(lu(t,e,"read from private field"),i?i.call(t):e.get(t)),tt=(t,e,i)=>{if(e.has(t))throw TypeError("Cannot add the same private member more than once");e instanceof WeakSet?e.add(t):e.set(t,i)},Rt=(t,e,i,a)=>(lu(t,e,"write to private field"),e.set(t,i),i),Ht=(t,e,i)=>(lu(t,e,"access private method"),i),gi,Mr,V,qi,xr,Ct,is,Or,as,Ul,Zi,Va,rs,$l,Hl,yp;const Tp=["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Enter"," ","f","m","k","c","l","j",">","<","p"],Yc=10,Gc=.025,Qc=.25,n0=.25,s0=2,k={DEFAULT_SUBTITLES:"defaultsubtitles",DEFAULT_STREAM_TYPE:"defaultstreamtype",DEFAULT_DURATION:"defaultduration",FULLSCREEN_ELEMENT:"fullscreenelement",HOTKEYS:"hotkeys",KEYBOARD_BACKWARD_SEEK_OFFSET:"keyboardbackwardseekoffset",KEYBOARD_FORWARD_SEEK_OFFSET:"keyboardforwardseekoffset",KEYBOARD_DOWN_VOLUME_STEP:"keyboarddownvolumestep",KEYBOARD_UP_VOLUME_STEP:"keyboardupvolumestep",KEYS_USED:"keysused",LANG:"lang",LOOP:"loop",LIVE_EDGE_OFFSET:"liveedgeoffset",NO_AUTO_SEEK_TO_LIVE:"noautoseektolive",NO_DEFAULT_STORE:"nodefaultstore",NO_HOTKEYS:"nohotkeys",NO_MUTED_PREF:"nomutedpref",NO_SUBTITLES_LANG_PREF:"nosubtitleslangpref",NO_VOLUME_PREF:"novolumepref",SEEK_TO_LIVE_OFFSET:"seektoliveoffset"};class Ap extends Po{constructor(){super(),tt(this,as),tt(this,Zi),tt(this,rs),tt(this,Hl),this.mediaStateReceivers=[],this.associatedElementSubscriptions=new Map,tt(this,gi,new nu(this,k.HOTKEYS)),tt(this,Mr,void 0),tt(this,V,void 0),tt(this,qi,null),tt(this,xr,void 0),tt(this,Ct,void 0),tt(this,is,i=>{var a;(a=O(this,V))==null||a.dispatch(i)}),tt(this,Or,void 0),this.associateElement(this);let e={};Rt(this,xr,i=>{Object.entries(i).forEach(([a,r])=>{if(a in e&&e[a]===r)return;this.propagateMediaState(a,r);const n=a.toLowerCase(),s=new f.CustomEvent(og[n],{composed:!0,detail:r});this.dispatchEvent(s)}),e=i}),this.hasAttribute(k.NO_HOTKEYS)?this.disableHotkeys():this.enableHotkeys()}static get observedAttributes(){return super.observedAttributes.concat(k.NO_HOTKEYS,k.HOTKEYS,k.DEFAULT_STREAM_TYPE,k.DEFAULT_SUBTITLES,k.DEFAULT_DURATION,k.NO_MUTED_PREF,k.NO_VOLUME_PREF,k.LANG,k.LOOP)}get mediaStore(){return O(this,V)}set mediaStore(e){var i,a;if(O(this,V)&&((i=O(this,Ct))==null||i.call(this),Rt(this,Ct,void 0)),Rt(this,V,e),!O(this,V)&&!this.hasAttribute(k.NO_DEFAULT_STORE)){Ht(this,as,Ul).call(this);return}Rt(this,Ct,(a=O(this,V))==null?void 0:a.subscribe(O(this,xr)))}get fullscreenElement(){var e;return(e=O(this,Mr))!=null?e:this}set fullscreenElement(e){var i;this.hasAttribute(k.FULLSCREEN_ELEMENT)&&this.removeAttribute(k.FULLSCREEN_ELEMENT),Rt(this,Mr,e),(i=O(this,V))==null||i.dispatch({type:"fullscreenelementchangerequest",detail:this.fullscreenElement})}get defaultSubtitles(){return W(this,k.DEFAULT_SUBTITLES)}set defaultSubtitles(e){F(this,k.DEFAULT_SUBTITLES,e)}get defaultStreamType(){return ae(this,k.DEFAULT_STREAM_TYPE)}set defaultStreamType(e){re(this,k.DEFAULT_STREAM_TYPE,e)}get defaultDuration(){return ie(this,k.DEFAULT_DURATION)}set defaultDuration(e){ue(this,k.DEFAULT_DURATION,e)}get noHotkeys(){return W(this,k.NO_HOTKEYS)}set noHotkeys(e){F(this,k.NO_HOTKEYS,e)}get keysUsed(){return ae(this,k.KEYS_USED)}set keysUsed(e){re(this,k.KEYS_USED,e)}get liveEdgeOffset(){return ie(this,k.LIVE_EDGE_OFFSET)}set liveEdgeOffset(e){ue(this,k.LIVE_EDGE_OFFSET,e)}get noAutoSeekToLive(){return W(this,k.NO_AUTO_SEEK_TO_LIVE)}set noAutoSeekToLive(e){F(this,k.NO_AUTO_SEEK_TO_LIVE,e)}get noVolumePref(){return W(this,k.NO_VOLUME_PREF)}set noVolumePref(e){F(this,k.NO_VOLUME_PREF,e)}get noMutedPref(){return W(this,k.NO_MUTED_PREF)}set noMutedPref(e){F(this,k.NO_MUTED_PREF,e)}get noSubtitlesLangPref(){return W(this,k.NO_SUBTITLES_LANG_PREF)}set noSubtitlesLangPref(e){F(this,k.NO_SUBTITLES_LANG_PREF,e)}get noDefaultStore(){return W(this,k.NO_DEFAULT_STORE)}set noDefaultStore(e){F(this,k.NO_DEFAULT_STORE,e)}attributeChangedCallback(e,i,a){var r,n,s,o,l,d,m,p,h,c,v,E;if(super.attributeChangedCallback(e,i,a),e===k.NO_HOTKEYS)a!==i&&a===""?(this.hasAttribute(k.HOTKEYS)&&console.warn("Media Chrome: Both `hotkeys` and `nohotkeys` have been set. All hotkeys will be disabled."),this.disableHotkeys()):a!==i&&a===null&&this.enableHotkeys();else if(e===k.HOTKEYS)O(this,gi).value=a;else if(e===k.DEFAULT_SUBTITLES&&a!==i)(r=O(this,V))==null||r.dispatch({type:"optionschangerequest",detail:{defaultSubtitles:this.hasAttribute(k.DEFAULT_SUBTITLES)}});else if(e===k.DEFAULT_STREAM_TYPE)(s=O(this,V))==null||s.dispatch({type:"optionschangerequest",detail:{defaultStreamType:(n=this.getAttribute(k.DEFAULT_STREAM_TYPE))!=null?n:void 0}});else if(e===k.LIVE_EDGE_OFFSET)(o=O(this,V))==null||o.dispatch({type:"optionschangerequest",detail:{liveEdgeOffset:this.hasAttribute(k.LIVE_EDGE_OFFSET)?+this.getAttribute(k.LIVE_EDGE_OFFSET):void 0,seekToLiveOffset:this.hasAttribute(k.SEEK_TO_LIVE_OFFSET)?void 0:+this.getAttribute(k.LIVE_EDGE_OFFSET)}});else if(e===k.SEEK_TO_LIVE_OFFSET)(l=O(this,V))==null||l.dispatch({type:"optionschangerequest",detail:{seekToLiveOffset:this.hasAttribute(k.SEEK_TO_LIVE_OFFSET)?+this.getAttribute(k.SEEK_TO_LIVE_OFFSET):void 0}});else if(e===k.NO_AUTO_SEEK_TO_LIVE)(d=O(this,V))==null||d.dispatch({type:"optionschangerequest",detail:{noAutoSeekToLive:this.hasAttribute(k.NO_AUTO_SEEK_TO_LIVE)}});else if(e===k.FULLSCREEN_ELEMENT){const g=a?(m=this.getRootNode())==null?void 0:m.getElementById(a):void 0;Rt(this,Mr,g),(p=O(this,V))==null||p.dispatch({type:"fullscreenelementchangerequest",detail:this.fullscreenElement})}else e===k.LANG&&a!==i?(gg(a),(h=O(this,V))==null||h.dispatch({type:"optionschangerequest",detail:{mediaLang:a}})):e===k.LOOP&&a!==i?(c=O(this,V))==null||c.dispatch({type:I.MEDIA_LOOP_REQUEST,detail:a!=null}):e===k.NO_VOLUME_PREF&&a!==i?(v=O(this,V))==null||v.dispatch({type:"optionschangerequest",detail:{noVolumePref:this.hasAttribute(k.NO_VOLUME_PREF)}}):e===k.NO_MUTED_PREF&&a!==i&&((E=O(this,V))==null||E.dispatch({type:"optionschangerequest",detail:{noMutedPref:this.hasAttribute(k.NO_MUTED_PREF)}}))}connectedCallback(){var e,i;!O(this,V)&&!this.hasAttribute(k.NO_DEFAULT_STORE)&&Ht(this,as,Ul).call(this),(e=O(this,V))==null||e.dispatch({type:"documentelementchangerequest",detail:ge}),super.connectedCallback(),O(this,V)&&!O(this,Ct)&&Rt(this,Ct,(i=O(this,V))==null?void 0:i.subscribe(O(this,xr))),O(this,Or)!==void 0&&O(this,V)&&this.media&&setTimeout(()=>{var a,r,n;(r=(a=this.media)==null?void 0:a.textTracks)!=null&&r.length&&((n=O(this,V))==null||n.dispatch({type:I.MEDIA_TOGGLE_SUBTITLES_REQUEST,detail:O(this,Or)}))},0),this.hasAttribute(k.NO_HOTKEYS)?this.disableHotkeys():this.enableHotkeys()}disconnectedCallback(){var e,i,a,r,n;if((e=super.disconnectedCallback)==null||e.call(this),O(this,V)){const s=O(this,V).getState();Rt(this,Or,!!((i=s.mediaSubtitlesShowing)!=null&&i.length)),(a=O(this,V))==null||a.dispatch({type:"documentelementchangerequest",detail:void 0}),(r=O(this,V))==null||r.dispatch({type:I.MEDIA_TOGGLE_SUBTITLES_REQUEST,detail:!1})}O(this,Ct)&&((n=O(this,Ct))==null||n.call(this),Rt(this,Ct,void 0))}mediaSetCallback(e){var i;super.mediaSetCallback(e),(i=O(this,V))==null||i.dispatch({type:"mediaelementchangerequest",detail:e}),e.hasAttribute("tabindex")||(e.tabIndex=-1)}mediaUnsetCallback(e){var i;super.mediaUnsetCallback(e),(i=O(this,V))==null||i.dispatch({type:"mediaelementchangerequest",detail:void 0})}propagateMediaState(e,i){jc(this.mediaStateReceivers,e,i)}associateElement(e){if(!e)return;const{associatedElementSubscriptions:i}=this;if(i.has(e))return;const a=this.registerMediaStateReceiver.bind(this),r=this.unregisterMediaStateReceiver.bind(this),n=h0(e,a,r);Object.values(I).forEach(s=>{e.addEventListener(s,O(this,is))}),i.set(e,n)}unassociateElement(e){if(!e)return;const{associatedElementSubscriptions:i}=this;if(!i.has(e))return;i.get(e)(),i.delete(e),Object.values(I).forEach(r=>{e.removeEventListener(r,O(this,is))})}registerMediaStateReceiver(e){if(!e)return;const i=this.mediaStateReceivers;i.indexOf(e)>-1||(i.push(e),O(this,V)&&Object.entries(O(this,V).getState()).forEach(([r,n])=>{jc([e],r,n)}))}unregisterMediaStateReceiver(e){const i=this.mediaStateReceivers,a=i.indexOf(e);a<0||i.splice(a,1)}enableHotkeys(){this.addEventListener("keydown",Ht(this,rs,$l))}disableHotkeys(){this.removeEventListener("keydown",Ht(this,rs,$l)),this.removeEventListener("keyup",Ht(this,Zi,Va))}get hotkeys(){return ae(this,k.HOTKEYS)}set hotkeys(e){re(this,k.HOTKEYS,e)}keyboardShortcutHandler(e){var i,a,r,n,s,o,l,d,m;const p=e.target;if(((r=(a=(i=p.getAttribute(k.KEYS_USED))==null?void 0:i.split(" "))!=null?a:p?.keysUsed)!=null?r:[]).map(y=>y==="Space"?" ":y).filter(Boolean).includes(e.key))return;let c,v,E;if(!(O(this,gi).contains(`no${e.key.toLowerCase()}`)||e.key===" "&&O(this,gi).contains("nospace")||e.shiftKey&&(e.key==="/"||e.key==="?")&&O(this,gi).contains("noshift+/")))switch(e.key){case" ":case"k":c=O(this,V).getState().mediaPaused?I.MEDIA_PLAY_REQUEST:I.MEDIA_PAUSE_REQUEST,this.dispatchEvent(new f.CustomEvent(c,{composed:!0,bubbles:!0}));break;case"m":c=this.mediaStore.getState().mediaVolumeLevel==="off"?I.MEDIA_UNMUTE_REQUEST:I.MEDIA_MUTE_REQUEST,this.dispatchEvent(new f.CustomEvent(c,{composed:!0,bubbles:!0}));break;case"f":c=this.mediaStore.getState().mediaIsFullscreen?I.MEDIA_EXIT_FULLSCREEN_REQUEST:I.MEDIA_ENTER_FULLSCREEN_REQUEST,this.dispatchEvent(new f.CustomEvent(c,{composed:!0,bubbles:!0}));break;case"c":this.dispatchEvent(new f.CustomEvent(I.MEDIA_TOGGLE_SUBTITLES_REQUEST,{composed:!0,bubbles:!0}));break;case"ArrowLeft":case"j":{const y=this.hasAttribute(k.KEYBOARD_BACKWARD_SEEK_OFFSET)?+this.getAttribute(k.KEYBOARD_BACKWARD_SEEK_OFFSET):Yc;v=Math.max(((n=this.mediaStore.getState().mediaCurrentTime)!=null?n:0)-y,0),E=new f.CustomEvent(I.MEDIA_SEEK_REQUEST,{composed:!0,bubbles:!0,detail:v}),this.dispatchEvent(E);break}case"ArrowRight":case"l":{const y=this.hasAttribute(k.KEYBOARD_FORWARD_SEEK_OFFSET)?+this.getAttribute(k.KEYBOARD_FORWARD_SEEK_OFFSET):Yc;v=Math.max(((s=this.mediaStore.getState().mediaCurrentTime)!=null?s:0)+y,0),E=new f.CustomEvent(I.MEDIA_SEEK_REQUEST,{composed:!0,bubbles:!0,detail:v}),this.dispatchEvent(E);break}case"ArrowUp":{const y=this.hasAttribute(k.KEYBOARD_UP_VOLUME_STEP)?+this.getAttribute(k.KEYBOARD_UP_VOLUME_STEP):Gc;v=Math.min(((o=this.mediaStore.getState().mediaVolume)!=null?o:1)+y,1),E=new f.CustomEvent(I.MEDIA_VOLUME_REQUEST,{composed:!0,bubbles:!0,detail:v}),this.dispatchEvent(E);break}case"ArrowDown":{const y=this.hasAttribute(k.KEYBOARD_DOWN_VOLUME_STEP)?+this.getAttribute(k.KEYBOARD_DOWN_VOLUME_STEP):Gc;v=Math.max(((l=this.mediaStore.getState().mediaVolume)!=null?l:1)-y,0),E=new f.CustomEvent(I.MEDIA_VOLUME_REQUEST,{composed:!0,bubbles:!0,detail:v}),this.dispatchEvent(E);break}case"<":{const y=(d=this.mediaStore.getState().mediaPlaybackRate)!=null?d:1;v=Math.max(y-Qc,n0).toFixed(2),E=new f.CustomEvent(I.MEDIA_PLAYBACK_RATE_REQUEST,{composed:!0,bubbles:!0,detail:v}),this.dispatchEvent(E);break}case">":{const y=(m=this.mediaStore.getState().mediaPlaybackRate)!=null?m:1;v=Math.min(y+Qc,s0).toFixed(2),E=new f.CustomEvent(I.MEDIA_PLAYBACK_RATE_REQUEST,{composed:!0,bubbles:!0,detail:v}),this.dispatchEvent(E);break}case"/":case"?":{e.shiftKey&&Ht(this,Hl,yp).call(this);break}case"p":{c=this.mediaStore.getState().mediaIsPip?I.MEDIA_EXIT_PIP_REQUEST:I.MEDIA_ENTER_PIP_REQUEST,E=new f.CustomEvent(c,{composed:!0,bubbles:!0}),this.dispatchEvent(E);break}}}}gi=new WeakMap;Mr=new WeakMap;V=new WeakMap;qi=new WeakMap;xr=new WeakMap;Ct=new WeakMap;is=new WeakMap;Or=new WeakMap;as=new WeakSet;Ul=function(){var t;this.mediaStore=r0({media:this.media,fullscreenElement:this.fullscreenElement,options:{defaultSubtitles:this.hasAttribute(k.DEFAULT_SUBTITLES),defaultDuration:this.hasAttribute(k.DEFAULT_DURATION)?+this.getAttribute(k.DEFAULT_DURATION):void 0,defaultStreamType:(t=this.getAttribute(k.DEFAULT_STREAM_TYPE))!=null?t:void 0,liveEdgeOffset:this.hasAttribute(k.LIVE_EDGE_OFFSET)?+this.getAttribute(k.LIVE_EDGE_OFFSET):void 0,seekToLiveOffset:this.hasAttribute(k.SEEK_TO_LIVE_OFFSET)?+this.getAttribute(k.SEEK_TO_LIVE_OFFSET):this.hasAttribute(k.LIVE_EDGE_OFFSET)?+this.getAttribute(k.LIVE_EDGE_OFFSET):void 0,noAutoSeekToLive:this.hasAttribute(k.NO_AUTO_SEEK_TO_LIVE),noVolumePref:this.hasAttribute(k.NO_VOLUME_PREF),noMutedPref:this.hasAttribute(k.NO_MUTED_PREF),noSubtitlesLangPref:this.hasAttribute(k.NO_SUBTITLES_LANG_PREF)}})};Zi=new WeakSet;Va=function(t){const{key:e,shiftKey:i}=t;if(!(i&&(e==="/"||e==="?")||Tp.includes(e))){this.removeEventListener("keyup",Ht(this,Zi,Va));return}this.keyboardShortcutHandler(t)};rs=new WeakSet;$l=function(t){var e;const{metaKey:i,altKey:a,key:r,shiftKey:n}=t,s=n&&(r==="/"||r==="?");if(s&&((e=O(this,qi))!=null&&e.open)){this.removeEventListener("keyup",Ht(this,Zi,Va));return}if(i||a||!s&&!Tp.includes(r)){this.removeEventListener("keyup",Ht(this,Zi,Va));return}const o=t.target,l=o instanceof HTMLElement&&(o.tagName.toLowerCase()==="media-volume-range"||o.tagName.toLowerCase()==="media-time-range");[" ","ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(r)&&!(O(this,gi).contains(`no${r.toLowerCase()}`)||r===" "&&O(this,gi).contains("nospace"))&&!l&&t.preventDefault(),this.addEventListener("keyup",Ht(this,Zi,Va),{once:!0})};Hl=new WeakSet;yp=function(){O(this,qi)||(Rt(this,qi,ge.createElement("media-keyboard-shortcuts-dialog")),this.appendChild(O(this,qi))),O(this,qi).open=!0};const o0=Object.values(u),l0=Object.values(Qm),kp=t=>{var e,i,a,r;let{observedAttributes:n}=t.constructor;!n&&((e=t.nodeName)!=null&&e.includes("-"))&&(f.customElements.upgrade(t),{observedAttributes:n}=t.constructor);const s=(r=(a=(i=t?.getAttribute)==null?void 0:i.call(t,Y.MEDIA_CHROME_ATTRIBUTES))==null?void 0:a.split)==null?void 0:r.call(a,/\s+/);return Array.isArray(n||s)?(n||s).filter(o=>o0.includes(o)):[]},d0=t=>{var e,i;return(e=t.nodeName)!=null&&e.includes("-")&&f.customElements.get((i=t.nodeName)==null?void 0:i.toLowerCase())&&!(t instanceof f.customElements.get(t.nodeName.toLowerCase()))&&f.customElements.upgrade(t),l0.some(a=>a in t)},Bl=t=>d0(t)||!!kp(t).length,zc=t=>{var e;return(e=t?.join)==null?void 0:e.call(t,":")},Zc={[u.MEDIA_SUBTITLES_LIST]:un,[u.MEDIA_SUBTITLES_SHOWING]:un,[u.MEDIA_SEEKABLE]:zc,[u.MEDIA_BUFFERED]:t=>t?.map(zc).join(" "),[u.MEDIA_PREVIEW_COORDS]:t=>t?.join(" "),[u.MEDIA_RENDITION_LIST]:dg,[u.MEDIA_AUDIO_TRACK_LIST]:mg},u0=async(t,e,i)=>{var a,r;if(t.isConnected||await jm(0),typeof i=="boolean"||i==null)return F(t,e,i);if(typeof i=="number")return ue(t,e,i);if(typeof i=="string")return re(t,e,i);if(Array.isArray(i)&&!i.length)return t.removeAttribute(e);const n=(r=(a=Zc[e])==null?void 0:a.call(Zc,i))!=null?r:i;return t.setAttribute(e,n)},c0=t=>{var e;return!!((e=t.closest)!=null&&e.call(t,'*[slot="media"]'))},xi=(t,e)=>{if(c0(t))return;const i=(r,n)=>{var s,o;Bl(r)&&n(r);const{children:l=[]}=r??{},d=(o=(s=r?.shadowRoot)==null?void 0:s.children)!=null?o:[];[...l,...d].forEach(p=>xi(p,n))},a=t?.nodeName.toLowerCase();if(a.includes("-")&&!Bl(t)){f.customElements.whenDefined(a).then(()=>{i(t,e)});return}i(t,e)},jc=(t,e,i)=>{t.forEach(a=>{if(e in a){a[e]=i;return}const r=kp(a),n=e.toLowerCase();r.includes(n)&&u0(a,n,i)})},h0=(t,e,i)=>{xi(t,e);const a=m=>{var p;const h=(p=m?.composedPath()[0])!=null?p:m.target;e(h)},r=m=>{var p;const h=(p=m?.composedPath()[0])!=null?p:m.target;i(h)};t.addEventListener(I.REGISTER_MEDIA_STATE_RECEIVER,a),t.addEventListener(I.UNREGISTER_MEDIA_STATE_RECEIVER,r);const n=m=>{m.forEach(p=>{const{addedNodes:h=[],removedNodes:c=[],type:v,target:E,attributeName:g}=p;v==="childList"?(Array.prototype.forEach.call(h,y=>xi(y,e)),Array.prototype.forEach.call(c,y=>xi(y,i))):v==="attributes"&&g===Y.MEDIA_CHROME_ATTRIBUTES&&(Bl(E)?e(E):i(E))})};let s=[];const o=m=>{const p=m.target;p.name!=="media"&&(s.forEach(h=>xi(h,i)),s=[...p.assignedElements({flatten:!0})],s.forEach(h=>xi(h,e)))};t.addEventListener("slotchange",o);const l=new MutationObserver(n);return l.observe(t,{childList:!0,attributes:!0,subtree:!0}),()=>{xi(t,i),t.removeEventListener("slotchange",o),l.disconnect(),t.removeEventListener(I.REGISTER_MEDIA_STATE_RECEIVER,a),t.removeEventListener(I.UNREGISTER_MEDIA_STATE_RECEIVER,r)}};f.customElements.get("media-controller")||f.customElements.define("media-controller",Ap);var m0=Ap;const oa={PLACEMENT:"placement",BOUNDS:"bounds"};function p0(t){return`
    <style>
      :host {
        --_tooltip-background-color: var(--media-tooltip-background-color, var(--media-secondary-color, rgba(20, 20, 30, .7)));
        --_tooltip-background: var(--media-tooltip-background, var(--_tooltip-background-color));
        --_tooltip-arrow-half-width: calc(var(--media-tooltip-arrow-width, 12px) / 2);
        --_tooltip-arrow-height: var(--media-tooltip-arrow-height, 5px);
        --_tooltip-arrow-background: var(--media-tooltip-arrow-color, var(--_tooltip-background-color));
        position: relative;
        pointer-events: none;
        display: var(--media-tooltip-display, inline-flex);
        justify-content: center;
        align-items: center;
        box-sizing: border-box;
        z-index: var(--media-tooltip-z-index, 1);
        background: var(--_tooltip-background);
        color: var(--media-text-color, var(--media-primary-color, rgb(238 238 238)));
        font: var(--media-font,
          var(--media-font-weight, 400)
          var(--media-font-size, 13px) /
          var(--media-text-content-height, var(--media-control-height, 18px))
          var(--media-font-family, helvetica neue, segoe ui, roboto, arial, sans-serif));
        padding: var(--media-tooltip-padding, .35em .7em);
        border: var(--media-tooltip-border, none);
        border-radius: var(--media-tooltip-border-radius, 5px);
        filter: var(--media-tooltip-filter, drop-shadow(0 0 4px rgba(0, 0, 0, .2)));
        white-space: var(--media-tooltip-white-space, nowrap);
      }

      :host([hidden]) {
        display: none;
      }

      img, svg {
        display: inline-block;
      }

      #arrow {
        position: absolute;
        width: 0px;
        height: 0px;
        border-style: solid;
        display: var(--media-tooltip-arrow-display, block);
      }

      :host(:not([placement])),
      :host([placement="top"]) {
        position: absolute;
        bottom: calc(100% + var(--media-tooltip-distance, 12px));
        left: 50%;
        transform: translate(calc(-50% - var(--media-tooltip-offset-x, 0px)), 0);
      }
      :host(:not([placement])) #arrow,
      :host([placement="top"]) #arrow {
        top: 100%;
        left: 50%;
        border-width: var(--_tooltip-arrow-height) var(--_tooltip-arrow-half-width) 0 var(--_tooltip-arrow-half-width);
        border-color: var(--_tooltip-arrow-background) transparent transparent transparent;
        transform: translate(calc(-50% + var(--media-tooltip-offset-x, 0px)), 0);
      }

      :host([placement="right"]) {
        position: absolute;
        left: calc(100% + var(--media-tooltip-distance, 12px));
        top: 50%;
        transform: translate(0, -50%);
      }
      :host([placement="right"]) #arrow {
        top: 50%;
        right: 100%;
        border-width: var(--_tooltip-arrow-half-width) var(--_tooltip-arrow-height) var(--_tooltip-arrow-half-width) 0;
        border-color: transparent var(--_tooltip-arrow-background) transparent transparent;
        transform: translate(0, -50%);
      }

      :host([placement="bottom"]) {
        position: absolute;
        top: calc(100% + var(--media-tooltip-distance, 12px));
        left: 50%;
        transform: translate(calc(-50% - var(--media-tooltip-offset-x, 0px)), 0);
      }
      :host([placement="bottom"]) #arrow {
        bottom: 100%;
        left: 50%;
        border-width: 0 var(--_tooltip-arrow-half-width) var(--_tooltip-arrow-height) var(--_tooltip-arrow-half-width);
        border-color: transparent transparent var(--_tooltip-arrow-background) transparent;
        transform: translate(calc(-50% + var(--media-tooltip-offset-x, 0px)), 0);
      }

      :host([placement="left"]) {
        position: absolute;
        right: calc(100% + var(--media-tooltip-distance, 12px));
        top: 50%;
        transform: translate(0, -50%);
      }
      :host([placement="left"]) #arrow {
        top: 50%;
        left: 100%;
        border-width: var(--_tooltip-arrow-half-width) 0 var(--_tooltip-arrow-half-width) var(--_tooltip-arrow-height);
        border-color: transparent transparent transparent var(--_tooltip-arrow-background);
        transform: translate(0, -50%);
      }
      
      :host([placement="none"]) #arrow {
        display: none;
      }
    </style>
    <slot></slot>
    <div id="arrow"></div>
  `}class Ho extends f.HTMLElement{constructor(){if(super(),this.updateXOffset=()=>{var e;if(!sp(this,{checkOpacity:!1,checkVisibilityCSS:!1}))return;const i=this.placement;if(i==="left"||i==="right"){this.style.removeProperty("--media-tooltip-offset-x");return}const a=getComputedStyle(this),r=(e=rr(this,"#"+this.bounds))!=null?e:Be(this);if(!r)return;const{x:n,width:s}=r.getBoundingClientRect(),{x:o,width:l}=this.getBoundingClientRect(),d=o+l,m=n+s,p=a.getPropertyValue("--media-tooltip-offset-x"),h=p?parseFloat(p.replace("px","")):0,c=a.getPropertyValue("--media-tooltip-container-margin"),v=c?parseFloat(c.replace("px","")):0,E=o-n+h-v,g=d-m+h+v;if(E<0){this.style.setProperty("--media-tooltip-offset-x",`${E}px`);return}if(g>0){this.style.setProperty("--media-tooltip-offset-x",`${g}px`);return}this.style.removeProperty("--media-tooltip-offset-x")},!this.shadowRoot){this.attachShadow(this.constructor.shadowRootOptions);const e=Je(this.attributes);this.shadowRoot.innerHTML=this.constructor.getTemplateHTML(e)}if(this.arrowEl=this.shadowRoot.querySelector("#arrow"),Object.prototype.hasOwnProperty.call(this,"placement")){const e=this.placement;delete this.placement,this.placement=e}}static get observedAttributes(){return[oa.PLACEMENT,oa.BOUNDS]}get placement(){return ae(this,oa.PLACEMENT)}set placement(e){re(this,oa.PLACEMENT,e)}get bounds(){return ae(this,oa.BOUNDS)}set bounds(e){re(this,oa.BOUNDS,e)}}Ho.shadowRootOptions={mode:"open"};Ho.getTemplateHTML=p0;f.customElements.get("media-tooltip")||f.customElements.define("media-tooltip",Ho);var Xc=Ho,du=(t,e,i)=>{if(!e.has(t))throw TypeError("Cannot "+i)},ve=(t,e,i)=>(du(t,e,"read from private field"),i?i.call(t):e.get(t)),la=(t,e,i)=>{if(e.has(t))throw TypeError("Cannot add the same private member more than once");e instanceof WeakSet?e.add(t):e.set(t,i)},Cn=(t,e,i,a)=>(du(t,e,"write to private field"),e.set(t,i),i),v0=(t,e,i)=>(du(t,e,"access private method"),i),Lt,$a,yi,ba,ns,Wl,Sp;const di={TOOLTIP_PLACEMENT:"tooltipplacement",DISABLED:"disabled",NO_TOOLTIP:"notooltip"};function f0(t,e={}){return`
    <style>
      :host {
        position: relative;
        font: var(--media-font,
          var(--media-font-weight, bold)
          var(--media-font-size, 14px) /
          var(--media-text-content-height, var(--media-control-height, 24px))
          var(--media-font-family, helvetica neue, segoe ui, roboto, arial, sans-serif));
        color: var(--media-text-color, var(--media-primary-color, rgb(238 238 238)));
        background: var(--media-control-background, var(--media-secondary-color, rgb(20 20 30 / .7)));
        padding: var(--media-button-padding, var(--media-control-padding, 10px));
        justify-content: var(--media-button-justify-content, center);
        display: inline-flex;
        align-items: center;
        vertical-align: middle;
        box-sizing: border-box;
        transition: background .15s linear;
        pointer-events: auto;
        cursor: var(--media-cursor, pointer);
        -webkit-tap-highlight-color: transparent;
      }

      
      :host(:focus-visible) {
        box-shadow: var(--media-focus-box-shadow, inset 0 0 0 2px rgb(27 127 204 / .9));
        outline: 0;
      }
      
      :host(:where(:focus)) {
        box-shadow: none;
        outline: 0;
      }

      :host(:hover) {
        background: var(--media-control-hover-background, rgba(50 50 70 / .7));
      }

      svg, img, ::slotted(svg), ::slotted(img) {
        width: var(--media-button-icon-width);
        height: var(--media-button-icon-height, var(--media-control-height, 24px));
        transform: var(--media-button-icon-transform);
        transition: var(--media-button-icon-transition);
        fill: var(--media-icon-color, var(--media-primary-color, rgb(238 238 238)));
        vertical-align: middle;
        max-width: 100%;
        max-height: 100%;
        min-width: 100%;
      }

      media-tooltip {
        
        max-width: 0;
        overflow-x: clip;
        opacity: 0;
        transition: opacity .3s, max-width 0s 9s;
      }

      :host(:hover) media-tooltip,
      :host(:focus-visible) media-tooltip {
        max-width: 100vw;
        opacity: 1;
        transition: opacity .3s;
      }

      :host([notooltip]) slot[name="tooltip"] {
        display: none;
      }
    </style>

    ${this.getSlotTemplateHTML(t,e)}

    <slot name="tooltip">
      <media-tooltip part="tooltip" aria-hidden="true">
        <template shadowrootmode="${Xc.shadowRootOptions.mode}">
          ${Xc.getTemplateHTML({})}
        </template>
        <slot name="tooltip-content">
          ${this.getTooltipContentHTML(t)}
        </slot>
      </media-tooltip>
    </slot>
  `}function E0(t,e){return`
    <slot></slot>
  `}function _0(){return""}class Ce extends f.HTMLElement{constructor(){if(super(),la(this,Wl),la(this,Lt,void 0),this.preventClick=!1,this.tooltipEl=null,la(this,$a,e=>{this.preventClick||this.handleClick(e),setTimeout(ve(this,yi),0)}),la(this,yi,()=>{var e,i;(i=(e=this.tooltipEl)==null?void 0:e.updateXOffset)==null||i.call(e)}),la(this,ba,e=>{const{key:i}=e;if(!this.keysUsed.includes(i)){this.removeEventListener("keyup",ve(this,ba));return}this.preventClick||this.handleClick(e)}),la(this,ns,e=>{const{metaKey:i,altKey:a,key:r}=e;if(i||a||!this.keysUsed.includes(r)){this.removeEventListener("keyup",ve(this,ba));return}this.addEventListener("keyup",ve(this,ba),{once:!0})}),!this.shadowRoot){this.attachShadow(this.constructor.shadowRootOptions);const e=Je(this.attributes),i=this.constructor.getTemplateHTML(e);this.shadowRoot.setHTMLUnsafe?this.shadowRoot.setHTMLUnsafe(i):this.shadowRoot.innerHTML=i}this.tooltipEl=this.shadowRoot.querySelector("media-tooltip")}static get observedAttributes(){return["disabled",di.TOOLTIP_PLACEMENT,Y.MEDIA_CONTROLLER,u.MEDIA_LANG]}enable(){this.addEventListener("click",ve(this,$a)),this.addEventListener("keydown",ve(this,ns)),this.tabIndex=0}disable(){this.removeEventListener("click",ve(this,$a)),this.removeEventListener("keydown",ve(this,ns)),this.removeEventListener("keyup",ve(this,ba)),this.tabIndex=-1}attributeChangedCallback(e,i,a){var r,n,s,o,l;e===Y.MEDIA_CONTROLLER?(i&&((n=(r=ve(this,Lt))==null?void 0:r.unassociateElement)==null||n.call(r,this),Cn(this,Lt,null)),a&&this.isConnected&&(Cn(this,Lt,(s=this.getRootNode())==null?void 0:s.getElementById(a)),(l=(o=ve(this,Lt))==null?void 0:o.associateElement)==null||l.call(o,this))):e==="disabled"&&a!==i?a==null?this.enable():this.disable():e===di.TOOLTIP_PLACEMENT&&this.tooltipEl&&a!==i?this.tooltipEl.placement=a:e===u.MEDIA_LANG&&(this.shadowRoot.querySelector('slot[name="tooltip-content"]').innerHTML=this.constructor.getTooltipContentHTML()),ve(this,yi).call(this)}connectedCallback(){var e,i,a;const{style:r}=Ae(this.shadowRoot,":host");r.setProperty("display",`var(--media-control-display, var(--${this.localName}-display, inline-flex))`),this.hasAttribute("disabled")?this.disable():this.enable(),this.setAttribute("role","button");const n=this.getAttribute(Y.MEDIA_CONTROLLER);n&&(Cn(this,Lt,(e=this.getRootNode())==null?void 0:e.getElementById(n)),(a=(i=ve(this,Lt))==null?void 0:i.associateElement)==null||a.call(i,this)),f.customElements.whenDefined("media-tooltip").then(()=>v0(this,Wl,Sp).call(this))}disconnectedCallback(){var e,i;this.disable(),(i=(e=ve(this,Lt))==null?void 0:e.unassociateElement)==null||i.call(e,this),Cn(this,Lt,null),this.removeEventListener("mouseenter",ve(this,yi)),this.removeEventListener("focus",ve(this,yi)),this.removeEventListener("click",ve(this,$a))}get keysUsed(){return["Enter"," "]}get tooltipPlacement(){return ae(this,di.TOOLTIP_PLACEMENT)}set tooltipPlacement(e){re(this,di.TOOLTIP_PLACEMENT,e)}get mediaController(){return ae(this,Y.MEDIA_CONTROLLER)}set mediaController(e){re(this,Y.MEDIA_CONTROLLER,e)}get disabled(){return W(this,di.DISABLED)}set disabled(e){F(this,di.DISABLED,e)}get noTooltip(){return W(this,di.NO_TOOLTIP)}set noTooltip(e){F(this,di.NO_TOOLTIP,e)}handleClick(e){}}Lt=new WeakMap;$a=new WeakMap;yi=new WeakMap;ba=new WeakMap;ns=new WeakMap;Wl=new WeakSet;Sp=function(){this.addEventListener("mouseenter",ve(this,yi)),this.addEventListener("focus",ve(this,yi)),this.addEventListener("click",ve(this,$a));const t=this.tooltipPlacement;t&&this.tooltipEl&&(this.tooltipEl.placement=t)};Ce.shadowRootOptions={mode:"open"};Ce.getTemplateHTML=f0;Ce.getSlotTemplateHTML=E0;Ce.getTooltipContentHTML=_0;f.customElements.get("media-chrome-button")||f.customElements.define("media-chrome-button",Ce);const Jc=`<svg aria-hidden="true" viewBox="0 0 26 24">
  <path d="M22.13 3H3.87a.87.87 0 0 0-.87.87v13.26a.87.87 0 0 0 .87.87h3.4L9 16H5V5h16v11h-4l1.72 2h3.4a.87.87 0 0 0 .87-.87V3.87a.87.87 0 0 0-.86-.87Zm-8.75 11.44a.5.5 0 0 0-.76 0l-4.91 5.73a.5.5 0 0 0 .38.83h9.82a.501.501 0 0 0 .38-.83l-4.91-5.73Z"/>
</svg>
`;function b0(t){return`
    <style>
      :host([${u.MEDIA_IS_AIRPLAYING}]) slot[name=icon] slot:not([name=exit]) {
        display: none !important;
      }

      
      :host(:not([${u.MEDIA_IS_AIRPLAYING}])) slot[name=icon] slot:not([name=enter]) {
        display: none !important;
      }

      :host([${u.MEDIA_IS_AIRPLAYING}]) slot[name=tooltip-enter],
      :host(:not([${u.MEDIA_IS_AIRPLAYING}])) slot[name=tooltip-exit] {
        display: none;
      }
    </style>

    <slot name="icon">
      <slot name="enter">${Jc}</slot>
      <slot name="exit">${Jc}</slot>
    </slot>
  `}function g0(){return`
    <slot name="tooltip-enter">${L("start airplay")}</slot>
    <slot name="tooltip-exit">${L("stop airplay")}</slot>
  `}const eh=t=>{const e=t.mediaIsAirplaying?L("stop airplay"):L("start airplay");t.setAttribute("aria-label",e)};class uu extends Ce{static get observedAttributes(){return[...super.observedAttributes,u.MEDIA_IS_AIRPLAYING,u.MEDIA_AIRPLAY_UNAVAILABLE]}connectedCallback(){super.connectedCallback(),eh(this)}attributeChangedCallback(e,i,a){super.attributeChangedCallback(e,i,a),e===u.MEDIA_IS_AIRPLAYING&&eh(this)}get mediaIsAirplaying(){return W(this,u.MEDIA_IS_AIRPLAYING)}set mediaIsAirplaying(e){F(this,u.MEDIA_IS_AIRPLAYING,e)}get mediaAirplayUnavailable(){return ae(this,u.MEDIA_AIRPLAY_UNAVAILABLE)}set mediaAirplayUnavailable(e){re(this,u.MEDIA_AIRPLAY_UNAVAILABLE,e)}handleClick(){const e=new f.CustomEvent(I.MEDIA_AIRPLAY_REQUEST,{composed:!0,bubbles:!0});this.dispatchEvent(e)}}uu.getSlotTemplateHTML=b0;uu.getTooltipContentHTML=g0;f.customElements.get("media-airplay-button")||f.customElements.define("media-airplay-button",uu);const y0=`<svg aria-hidden="true" viewBox="0 0 26 24">
  <path d="M22.83 5.68a2.58 2.58 0 0 0-2.3-2.5c-3.62-.24-11.44-.24-15.06 0a2.58 2.58 0 0 0-2.3 2.5c-.23 4.21-.23 8.43 0 12.64a2.58 2.58 0 0 0 2.3 2.5c3.62.24 11.44.24 15.06 0a2.58 2.58 0 0 0 2.3-2.5c.23-4.21.23-8.43 0-12.64Zm-11.39 9.45a3.07 3.07 0 0 1-1.91.57 3.06 3.06 0 0 1-2.34-1 3.75 3.75 0 0 1-.92-2.67 3.92 3.92 0 0 1 .92-2.77 3.18 3.18 0 0 1 2.43-1 2.94 2.94 0 0 1 2.13.78c.364.359.62.813.74 1.31l-1.43.35a1.49 1.49 0 0 0-1.51-1.17 1.61 1.61 0 0 0-1.29.58 2.79 2.79 0 0 0-.5 1.89 3 3 0 0 0 .49 1.93 1.61 1.61 0 0 0 1.27.58 1.48 1.48 0 0 0 1-.37 2.1 2.1 0 0 0 .59-1.14l1.4.44a3.23 3.23 0 0 1-1.07 1.69Zm7.22 0a3.07 3.07 0 0 1-1.91.57 3.06 3.06 0 0 1-2.34-1 3.75 3.75 0 0 1-.92-2.67 3.88 3.88 0 0 1 .93-2.77 3.14 3.14 0 0 1 2.42-1 3 3 0 0 1 2.16.82 2.8 2.8 0 0 1 .73 1.31l-1.43.35a1.49 1.49 0 0 0-1.51-1.21 1.61 1.61 0 0 0-1.29.58A2.79 2.79 0 0 0 15 12a3 3 0 0 0 .49 1.93 1.61 1.61 0 0 0 1.27.58 1.44 1.44 0 0 0 1-.37 2.1 2.1 0 0 0 .6-1.15l1.4.44a3.17 3.17 0 0 1-1.1 1.7Z"/>
</svg>`,T0=`<svg aria-hidden="true" viewBox="0 0 26 24">
  <path d="M17.73 14.09a1.4 1.4 0 0 1-1 .37 1.579 1.579 0 0 1-1.27-.58A3 3 0 0 1 15 12a2.8 2.8 0 0 1 .5-1.85 1.63 1.63 0 0 1 1.29-.57 1.47 1.47 0 0 1 1.51 1.2l1.43-.34A2.89 2.89 0 0 0 19 9.07a3 3 0 0 0-2.14-.78 3.14 3.14 0 0 0-2.42 1 3.91 3.91 0 0 0-.93 2.78 3.74 3.74 0 0 0 .92 2.66 3.07 3.07 0 0 0 2.34 1 3.07 3.07 0 0 0 1.91-.57 3.17 3.17 0 0 0 1.07-1.74l-1.4-.45c-.083.43-.3.822-.62 1.12Zm-7.22 0a1.43 1.43 0 0 1-1 .37 1.58 1.58 0 0 1-1.27-.58A3 3 0 0 1 7.76 12a2.8 2.8 0 0 1 .5-1.85 1.63 1.63 0 0 1 1.29-.57 1.47 1.47 0 0 1 1.51 1.2l1.43-.34a2.81 2.81 0 0 0-.74-1.32 2.94 2.94 0 0 0-2.13-.78 3.18 3.18 0 0 0-2.43 1 4 4 0 0 0-.92 2.78 3.74 3.74 0 0 0 .92 2.66 3.07 3.07 0 0 0 2.34 1 3.07 3.07 0 0 0 1.91-.57 3.23 3.23 0 0 0 1.07-1.74l-1.4-.45a2.06 2.06 0 0 1-.6 1.07Zm12.32-8.41a2.59 2.59 0 0 0-2.3-2.51C18.72 3.05 15.86 3 13 3c-2.86 0-5.72.05-7.53.17a2.59 2.59 0 0 0-2.3 2.51c-.23 4.207-.23 8.423 0 12.63a2.57 2.57 0 0 0 2.3 2.5c1.81.13 4.67.19 7.53.19 2.86 0 5.72-.06 7.53-.19a2.57 2.57 0 0 0 2.3-2.5c.23-4.207.23-8.423 0-12.63Zm-1.49 12.53a1.11 1.11 0 0 1-.91 1.11c-1.67.11-4.45.18-7.43.18-2.98 0-5.76-.07-7.43-.18a1.11 1.11 0 0 1-.91-1.11c-.21-4.14-.21-8.29 0-12.43a1.11 1.11 0 0 1 .91-1.11C7.24 4.56 10 4.49 13 4.49s5.76.07 7.43.18a1.11 1.11 0 0 1 .91 1.11c.21 4.14.21 8.29 0 12.43Z"/>
</svg>`;function A0(t){return`
    <style>
      :host([aria-checked="true"]) slot[name=off] {
        display: none !important;
      }

      
      :host(:not([aria-checked="true"])) slot[name=on] {
        display: none !important;
      }

      :host([aria-checked="true"]) slot[name=tooltip-enable],
      :host(:not([aria-checked="true"])) slot[name=tooltip-disable] {
        display: none;
      }
    </style>

    <slot name="icon">
      <slot name="on">${y0}</slot>
      <slot name="off">${T0}</slot>
    </slot>
  `}function k0(){return`
    <slot name="tooltip-enable">${L("Enable captions")}</slot>
    <slot name="tooltip-disable">${L("Disable captions")}</slot>
  `}const th=t=>{t.setAttribute("aria-checked",fp(t).toString())};class cu extends Ce{static get observedAttributes(){return[...super.observedAttributes,u.MEDIA_SUBTITLES_LIST,u.MEDIA_SUBTITLES_SHOWING]}connectedCallback(){super.connectedCallback(),this.setAttribute("role","switch"),this.setAttribute("aria-label",L("closed captions")),th(this)}attributeChangedCallback(e,i,a){super.attributeChangedCallback(e,i,a),e===u.MEDIA_SUBTITLES_SHOWING&&th(this)}get mediaSubtitlesList(){return ih(this,u.MEDIA_SUBTITLES_LIST)}set mediaSubtitlesList(e){ah(this,u.MEDIA_SUBTITLES_LIST,e)}get mediaSubtitlesShowing(){return ih(this,u.MEDIA_SUBTITLES_SHOWING)}set mediaSubtitlesShowing(e){ah(this,u.MEDIA_SUBTITLES_SHOWING,e)}handleClick(){this.dispatchEvent(new f.CustomEvent(I.MEDIA_TOGGLE_SUBTITLES_REQUEST,{composed:!0,bubbles:!0}))}}cu.getSlotTemplateHTML=A0;cu.getTooltipContentHTML=k0;const ih=(t,e)=>{const i=t.getAttribute(e);return i?Uo(i):[]},ah=(t,e,i)=>{if(!i?.length){t.removeAttribute(e);return}const a=un(i);t.getAttribute(e)!==a&&t.setAttribute(e,a)};f.customElements.get("media-captions-button")||f.customElements.define("media-captions-button",cu);const S0='<svg aria-hidden="true" viewBox="0 0 24 24"><g><path class="cast_caf_icon_arch0" d="M1,18 L1,21 L4,21 C4,19.3 2.66,18 1,18 L1,18 Z"/><path class="cast_caf_icon_arch1" d="M1,14 L1,16 C3.76,16 6,18.2 6,21 L8,21 C8,17.13 4.87,14 1,14 L1,14 Z"/><path class="cast_caf_icon_arch2" d="M1,10 L1,12 C5.97,12 10,16.0 10,21 L12,21 C12,14.92 7.07,10 1,10 L1,10 Z"/><path class="cast_caf_icon_box" d="M21,3 L3,3 C1.9,3 1,3.9 1,5 L1,8 L3,8 L3,5 L21,5 L21,19 L14,19 L14,21 L21,21 C22.1,21 23,20.1 23,19 L23,5 C23,3.9 22.1,3 21,3 L21,3 Z"/></g></svg>',w0='<svg aria-hidden="true" viewBox="0 0 24 24"><g><path class="cast_caf_icon_arch0" d="M1,18 L1,21 L4,21 C4,19.3 2.66,18 1,18 L1,18 Z"/><path class="cast_caf_icon_arch1" d="M1,14 L1,16 C3.76,16 6,18.2 6,21 L8,21 C8,17.13 4.87,14 1,14 L1,14 Z"/><path class="cast_caf_icon_arch2" d="M1,10 L1,12 C5.97,12 10,16.0 10,21 L12,21 C12,14.92 7.07,10 1,10 L1,10 Z"/><path class="cast_caf_icon_box" d="M21,3 L3,3 C1.9,3 1,3.9 1,5 L1,8 L3,8 L3,5 L21,5 L21,19 L14,19 L14,21 L21,21 C22.1,21 23,20.1 23,19 L23,5 C23,3.9 22.1,3 21,3 L21,3 Z"/><path class="cast_caf_icon_boxfill" d="M5,7 L5,8.63 C8,8.6 13.37,14 13.37,17 L19,17 L19,7 Z"/></g></svg>';function I0(t){return`
    <style>
      :host([${u.MEDIA_IS_CASTING}]) slot[name=icon] slot:not([name=exit]) {
        display: none !important;
      }

      
      :host(:not([${u.MEDIA_IS_CASTING}])) slot[name=icon] slot:not([name=enter]) {
        display: none !important;
      }

      :host([${u.MEDIA_IS_CASTING}]) slot[name=tooltip-enter],
      :host(:not([${u.MEDIA_IS_CASTING}])) slot[name=tooltip-exit] {
        display: none;
      }
    </style>

    <slot name="icon">
      <slot name="enter">${S0}</slot>
      <slot name="exit">${w0}</slot>
    </slot>
  `}function R0(){return`
    <slot name="tooltip-enter">${L("Start casting")}</slot>
    <slot name="tooltip-exit">${L("Stop casting")}</slot>
  `}const rh=t=>{const e=t.mediaIsCasting?L("stop casting"):L("start casting");t.setAttribute("aria-label",e)};class hu extends Ce{static get observedAttributes(){return[...super.observedAttributes,u.MEDIA_IS_CASTING,u.MEDIA_CAST_UNAVAILABLE]}connectedCallback(){super.connectedCallback(),rh(this)}attributeChangedCallback(e,i,a){super.attributeChangedCallback(e,i,a),e===u.MEDIA_IS_CASTING&&rh(this)}get mediaIsCasting(){return W(this,u.MEDIA_IS_CASTING)}set mediaIsCasting(e){F(this,u.MEDIA_IS_CASTING,e)}get mediaCastUnavailable(){return ae(this,u.MEDIA_CAST_UNAVAILABLE)}set mediaCastUnavailable(e){re(this,u.MEDIA_CAST_UNAVAILABLE,e)}handleClick(){const e=this.mediaIsCasting?I.MEDIA_EXIT_CAST_REQUEST:I.MEDIA_ENTER_CAST_REQUEST;this.dispatchEvent(new f.CustomEvent(e,{composed:!0,bubbles:!0}))}}hu.getSlotTemplateHTML=I0;hu.getTooltipContentHTML=R0;f.customElements.get("media-cast-button")||f.customElements.define("media-cast-button",hu);var mu=(t,e,i)=>{if(!e.has(t))throw TypeError("Cannot "+i)},ji=(t,e,i)=>(mu(t,e,"read from private field"),e.get(t)),Qt=(t,e,i)=>{if(e.has(t))throw TypeError("Cannot add the same private member more than once");e instanceof WeakSet?e.add(t):e.set(t,i)},pu=(t,e,i,a)=>(mu(t,e,"write to private field"),e.set(t,i),i),Ci=(t,e,i)=>(mu(t,e,"access private method"),i),oo,cn,ia,ss,Fl,Kl,wp,Vl,Ip,ql,Rp,Yl,Cp,Gl,Lp;function C0(t){return`
    <style>
      :host {
        font: var(--media-font,
          var(--media-font-weight, normal)
          var(--media-font-size, 14px) /
          var(--media-text-content-height, var(--media-control-height, 24px))
          var(--media-font-family, helvetica neue, segoe ui, roboto, arial, sans-serif));
        color: var(--media-text-color, var(--media-primary-color, rgb(238 238 238)));
        display: var(--media-dialog-display, inline-flex);
        justify-content: center;
        align-items: center;
        
        transition-behavior: allow-discrete;
        visibility: hidden;
        opacity: 0;
        transform: translateY(2px) scale(.99);
        pointer-events: none;
      }

      :host([open]) {
        transition: display .2s, visibility 0s, opacity .2s ease-out, transform .15s ease-out;
        visibility: visible;
        opacity: 1;
        transform: translateY(0) scale(1);
        pointer-events: auto;
      }

      #content {
        display: flex;
        position: relative;
        box-sizing: border-box;
        width: min(320px, 100%);
        word-wrap: break-word;
        max-height: 100%;
        overflow: auto;
        text-align: center;
        line-height: 1.4;
      }
    </style>
    ${this.getSlotTemplateHTML(t)}
  `}function L0(t){return`
    <slot id="content"></slot>
  `}const mr={OPEN:"open",ANCHOR:"anchor"};class nr extends f.HTMLElement{constructor(){super(),Qt(this,ss),Qt(this,Kl),Qt(this,Vl),Qt(this,ql),Qt(this,Yl),Qt(this,Gl),Qt(this,oo,!1),Qt(this,cn,null),Qt(this,ia,null),this.addEventListener("invoke",this),this.addEventListener("focusout",this),this.addEventListener("keydown",this)}static get observedAttributes(){return[mr.OPEN,mr.ANCHOR]}get open(){return W(this,mr.OPEN)}set open(e){F(this,mr.OPEN,e)}handleEvent(e){switch(e.type){case"invoke":Ci(this,ql,Rp).call(this,e);break;case"focusout":Ci(this,Yl,Cp).call(this,e);break;case"keydown":Ci(this,Gl,Lp).call(this,e);break}}connectedCallback(){Ci(this,ss,Fl).call(this),this.role||(this.role="dialog")}attributeChangedCallback(e,i,a){Ci(this,ss,Fl).call(this),e===mr.OPEN&&a!==i&&(this.open?Ci(this,Kl,wp).call(this):Ci(this,Vl,Ip).call(this))}focus(){pu(this,cn,tu());const e=!this.dispatchEvent(new Event("focus",{composed:!0,cancelable:!0})),i=!this.dispatchEvent(new Event("focusin",{composed:!0,bubbles:!0,cancelable:!0}));if(e||i)return;const a=this.querySelector('[autofocus], [tabindex]:not([tabindex="-1"]), [role="menu"]');a?.focus()}get keysUsed(){return["Escape","Tab"]}}oo=new WeakMap;cn=new WeakMap;ia=new WeakMap;ss=new WeakSet;Fl=function(){if(!ji(this,oo)&&(pu(this,oo,!0),!this.shadowRoot)){this.attachShadow(this.constructor.shadowRootOptions);const t=Je(this.attributes);this.shadowRoot.innerHTML=this.constructor.getTemplateHTML(t),queueMicrotask(()=>{const{style:e}=Ae(this.shadowRoot,":host");e.setProperty("transition","display .15s, visibility .15s, opacity .15s ease-in, transform .15s ease-in")})}};Kl=new WeakSet;wp=function(){var t;(t=ji(this,ia))==null||t.setAttribute("aria-expanded","true"),this.dispatchEvent(new Event("open",{composed:!0,bubbles:!0})),this.addEventListener("transitionend",()=>this.focus(),{once:!0})};Vl=new WeakSet;Ip=function(){var t;(t=ji(this,ia))==null||t.setAttribute("aria-expanded","false"),this.dispatchEvent(new Event("close",{composed:!0,bubbles:!0}))};ql=new WeakSet;Rp=function(t){pu(this,ia,t.relatedTarget),si(this,t.relatedTarget)||(this.open=!this.open)};Yl=new WeakSet;Cp=function(t){var e;si(this,t.relatedTarget)||((e=ji(this,cn))==null||e.focus(),ji(this,ia)&&ji(this,ia)!==t.relatedTarget&&this.open&&(this.open=!1))};Gl=new WeakSet;Lp=function(t){var e,i,a,r,n;const{key:s,ctrlKey:o,altKey:l,metaKey:d}=t;o||l||d||this.keysUsed.includes(s)&&(t.preventDefault(),t.stopPropagation(),s==="Tab"?(t.shiftKey?(i=(e=this.previousElementSibling)==null?void 0:e.focus)==null||i.call(e):(r=(a=this.nextElementSibling)==null?void 0:a.focus)==null||r.call(a),this.blur()):s==="Escape"&&((n=ji(this,cn))==null||n.focus(),this.open=!1))};nr.shadowRootOptions={mode:"open"};nr.getTemplateHTML=C0;nr.getSlotTemplateHTML=L0;f.customElements.get("media-chrome-dialog")||f.customElements.define("media-chrome-dialog",nr);var vu=(t,e,i)=>{if(!e.has(t))throw TypeError("Cannot "+i)},oe=(t,e,i)=>(vu(t,e,"read from private field"),i?i.call(t):e.get(t)),Le=(t,e,i)=>{if(e.has(t))throw TypeError("Cannot add the same private member more than once");e instanceof WeakSet?e.add(t):e.set(t,i)},mi=(t,e,i,a)=>(vu(t,e,"write to private field"),e.set(t,i),i),vt=(t,e,i)=>(vu(t,e,"access private method"),i),Dt,Bo,os,ls,ft,lo,ds,us,cs,fu,Dp,hs,Ql,ms,zl,uo,Eu,Zl,Mp,jl,xp,Xl,Op,Jl,Np;function D0(t){return`
    <style>
      :host {
        --_focus-box-shadow: var(--media-focus-box-shadow, inset 0 0 0 2px rgb(27 127 204 / .9));
        --_media-range-padding: var(--media-range-padding, var(--media-control-padding, 10px));

        box-shadow: var(--_focus-visible-box-shadow, none);
        background: var(--media-control-background, var(--media-secondary-color, rgb(20 20 30 / .7)));
        height: calc(var(--media-control-height, 24px) + 2 * var(--_media-range-padding));
        display: inline-flex;
        align-items: center;
        
        vertical-align: middle;
        box-sizing: border-box;
        position: relative;
        width: 100px;
        transition: background .15s linear;
        cursor: var(--media-cursor, pointer);
        pointer-events: auto;
        touch-action: none; 
      }

      
      input[type=range]:focus {
        outline: 0;
      }
      input[type=range]:focus::-webkit-slider-runnable-track {
        outline: 0;
      }

      :host(:hover) {
        background: var(--media-control-hover-background, rgb(50 50 70 / .7));
      }

      #leftgap {
        padding-left: var(--media-range-padding-left, var(--_media-range-padding));
      }

      #rightgap {
        padding-right: var(--media-range-padding-right, var(--_media-range-padding));
      }

      #startpoint,
      #endpoint {
        position: absolute;
      }

      #endpoint {
        right: 0;
      }

      #container {
        
        width: var(--media-range-track-width, 100%);
        transform: translate(var(--media-range-track-translate-x, 0px), var(--media-range-track-translate-y, 0px));
        position: relative;
        height: 100%;
        display: flex;
        align-items: center;
        min-width: 40px;
      }

      #range {
        
        display: var(--media-time-range-hover-display, block);
        bottom: var(--media-time-range-hover-bottom, -7px);
        height: var(--media-time-range-hover-height, max(100% + 7px, 25px));
        width: 100%;
        position: absolute;
        cursor: var(--media-cursor, pointer);

        -webkit-appearance: none; 
        -webkit-tap-highlight-color: transparent;
        background: transparent; 
        margin: 0;
        z-index: 1;
      }

      @media (hover: hover) {
        #range {
          bottom: var(--media-time-range-hover-bottom, -5px);
          height: var(--media-time-range-hover-height, max(100% + 5px, 20px));
        }
      }

      
      
      #range::-webkit-slider-thumb {
        -webkit-appearance: none;
        background: transparent;
        width: .1px;
        height: .1px;
      }

      
      #range::-moz-range-thumb {
        background: transparent;
        border: transparent;
        width: .1px;
        height: .1px;
      }

      #appearance {
        height: var(--media-range-track-height, 4px);
        display: flex;
        flex-direction: column;
        justify-content: center;
        width: 100%;
        position: absolute;
        
        will-change: transform;
      }

      #track {
        background: var(--media-range-track-background, rgb(255 255 255 / .2));
        border-radius: var(--media-range-track-border-radius, 1px);
        border: var(--media-range-track-border, none);
        outline: var(--media-range-track-outline);
        outline-offset: var(--media-range-track-outline-offset);
        backdrop-filter: var(--media-range-track-backdrop-filter);
        -webkit-backdrop-filter: var(--media-range-track-backdrop-filter);
        box-shadow: var(--media-range-track-box-shadow, none);
        position: absolute;
        width: 100%;
        height: 100%;
        overflow: hidden;
      }

      #progress,
      #pointer {
        position: absolute;
        height: 100%;
        will-change: width;
      }

      #progress {
        background: var(--media-range-bar-color, var(--media-primary-color, rgb(238 238 238)));
        transition: var(--media-range-track-transition);
      }

      #pointer {
        background: var(--media-range-track-pointer-background);
        border-right: var(--media-range-track-pointer-border-right);
        transition: visibility .25s, opacity .25s;
        visibility: hidden;
        opacity: 0;
      }

      @media (hover: hover) {
        :host(:hover) #pointer {
          transition: visibility .5s, opacity .5s;
          visibility: visible;
          opacity: 1;
        }
      }

      #thumb,
      ::slotted([slot=thumb]) {
        width: var(--media-range-thumb-width, 10px);
        height: var(--media-range-thumb-height, 10px);
        transition: var(--media-range-thumb-transition);
        transform: var(--media-range-thumb-transform, none);
        opacity: var(--media-range-thumb-opacity, 1);
        translate: -50%;
        position: absolute;
        left: 0;
        cursor: var(--media-cursor, pointer);
      }

      #thumb {
        border-radius: var(--media-range-thumb-border-radius, 10px);
        background: var(--media-range-thumb-background, var(--media-primary-color, rgb(238 238 238)));
        box-shadow: var(--media-range-thumb-box-shadow, 1px 1px 1px transparent);
        border: var(--media-range-thumb-border, none);
      }

      :host([disabled]) #thumb {
        background-color: #777;
      }

      .segments #appearance {
        height: var(--media-range-segment-hover-height, 7px);
      }

      #track {
        clip-path: url(#segments-clipping);
      }

      #segments {
        --segments-gap: var(--media-range-segments-gap, 2px);
        position: absolute;
        width: 100%;
        height: 100%;
      }

      #segments-clipping {
        transform: translateX(calc(var(--segments-gap) / 2));
      }

      #segments-clipping:empty {
        display: none;
      }

      #segments-clipping rect {
        height: var(--media-range-track-height, 4px);
        y: calc((var(--media-range-segment-hover-height, 7px) - var(--media-range-track-height, 4px)) / 2);
        transition: var(--media-range-segment-transition, transform .1s ease-in-out);
        transform: var(--media-range-segment-transform, scaleY(1));
        transform-origin: center;
      }
    </style>
    <div id="leftgap"></div>
    <div id="container">
      <div id="startpoint"></div>
      <div id="endpoint"></div>
      <div id="appearance">
        <div id="track" part="track">
          <div id="pointer"></div>
          <div id="progress" part="progress"></div>
        </div>
        <slot name="thumb">
          <div id="thumb" part="thumb"></div>
        </slot>
        <svg id="segments"><clipPath id="segments-clipping"></clipPath></svg>
      </div>
      <input id="range" type="range" min="0" max="1" step="any" value="0">

      ${this.getContainerTemplateHTML(t)}
    </div>
    <div id="rightgap"></div>
  `}function M0(t){return""}class sr extends f.HTMLElement{constructor(){if(super(),Le(this,fu),Le(this,hs),Le(this,ms),Le(this,uo),Le(this,Zl),Le(this,jl),Le(this,Xl),Le(this,Jl),Le(this,Dt,void 0),Le(this,Bo,void 0),Le(this,os,void 0),Le(this,ls,void 0),Le(this,ft,{}),Le(this,lo,[]),Le(this,ds,()=>{if(this.range.matches(":focus-visible")){const{style:e}=Ae(this.shadowRoot,":host");e.setProperty("--_focus-visible-box-shadow","var(--_focus-box-shadow)")}}),Le(this,us,()=>{const{style:e}=Ae(this.shadowRoot,":host");e.removeProperty("--_focus-visible-box-shadow")}),Le(this,cs,()=>{const e=this.shadowRoot.querySelector("#segments-clipping");e&&e.parentNode.append(e)}),!this.shadowRoot){this.attachShadow(this.constructor.shadowRootOptions);const e=Je(this.attributes),i=this.constructor.getTemplateHTML(e);this.shadowRoot.setHTMLUnsafe?this.shadowRoot.setHTMLUnsafe(i):this.shadowRoot.innerHTML=i}this.container=this.shadowRoot.querySelector("#container"),mi(this,os,this.shadowRoot.querySelector("#startpoint")),mi(this,ls,this.shadowRoot.querySelector("#endpoint")),this.range=this.shadowRoot.querySelector("#range"),this.appearance=this.shadowRoot.querySelector("#appearance")}static get observedAttributes(){return["disabled","aria-disabled",Y.MEDIA_CONTROLLER]}attributeChangedCallback(e,i,a){var r,n,s,o,l;e===Y.MEDIA_CONTROLLER?(i&&((n=(r=oe(this,Dt))==null?void 0:r.unassociateElement)==null||n.call(r,this),mi(this,Dt,null)),a&&this.isConnected&&(mi(this,Dt,(s=this.getRootNode())==null?void 0:s.getElementById(a)),(l=(o=oe(this,Dt))==null?void 0:o.associateElement)==null||l.call(o,this))):(e==="disabled"||e==="aria-disabled"&&i!==a)&&(a==null?(this.range.removeAttribute(e),vt(this,hs,Ql).call(this)):(this.range.setAttribute(e,a),vt(this,ms,zl).call(this)))}connectedCallback(){var e,i,a;const{style:r}=Ae(this.shadowRoot,":host");r.setProperty("display",`var(--media-control-display, var(--${this.localName}-display, inline-flex))`),oe(this,ft).pointer=Ae(this.shadowRoot,"#pointer"),oe(this,ft).progress=Ae(this.shadowRoot,"#progress"),oe(this,ft).thumb=Ae(this.shadowRoot,'#thumb, ::slotted([slot="thumb"])'),oe(this,ft).activeSegment=Ae(this.shadowRoot,"#segments-clipping rect:nth-child(0)");const n=this.getAttribute(Y.MEDIA_CONTROLLER);n&&(mi(this,Dt,(e=this.getRootNode())==null?void 0:e.getElementById(n)),(a=(i=oe(this,Dt))==null?void 0:i.associateElement)==null||a.call(i,this)),this.updateBar(),this.shadowRoot.addEventListener("focusin",oe(this,ds)),this.shadowRoot.addEventListener("focusout",oe(this,us)),vt(this,hs,Ql).call(this),Xa(this.container,oe(this,cs))}disconnectedCallback(){var e,i;vt(this,ms,zl).call(this),(i=(e=oe(this,Dt))==null?void 0:e.unassociateElement)==null||i.call(e,this),mi(this,Dt,null),this.shadowRoot.removeEventListener("focusin",oe(this,ds)),this.shadowRoot.removeEventListener("focusout",oe(this,us)),Ja(this.container,oe(this,cs))}updatePointerBar(e){var i;(i=oe(this,ft).pointer)==null||i.style.setProperty("width",`${this.getPointerRatio(e)*100}%`)}updateBar(){var e,i;const a=this.range.valueAsNumber*100;(e=oe(this,ft).progress)==null||e.style.setProperty("width",`${a}%`),(i=oe(this,ft).thumb)==null||i.style.setProperty("left",`${a}%`)}updateSegments(e){const i=this.shadowRoot.querySelector("#segments-clipping");if(i.textContent="",this.container.classList.toggle("segments",!!e?.length),!e?.length)return;const a=[...new Set([+this.range.min,...e.flatMap(n=>[n.start,n.end]),+this.range.max])];mi(this,lo,[...a]);const r=a.pop();for(const[n,s]of a.entries()){const[o,l]=[n===0,n===a.length-1],d=o?"calc(var(--segments-gap) / -1)":`${s*100}%`,p=`calc(${((l?r:a[n+1])-s)*100}%${o||l?"":" - var(--segments-gap)"})`,h=ge.createElementNS("http://www.w3.org/2000/svg","rect"),c=iu(this.shadowRoot,`#segments-clipping rect:nth-child(${n+1})`);c.style.setProperty("x",d),c.style.setProperty("width",p),i.append(h)}}getPointerRatio(e){return kg(e.clientX,e.clientY,oe(this,os).getBoundingClientRect(),oe(this,ls).getBoundingClientRect())}get dragging(){return this.hasAttribute("dragging")}handleEvent(e){switch(e.type){case"pointermove":vt(this,Jl,Np).call(this,e);break;case"input":this.updateBar();break;case"pointerenter":vt(this,Zl,Mp).call(this,e);break;case"pointerdown":vt(this,uo,Eu).call(this,e);break;case"pointerup":vt(this,jl,xp).call(this);break;case"pointerleave":vt(this,Xl,Op).call(this);break}}get keysUsed(){return["ArrowUp","ArrowRight","ArrowDown","ArrowLeft"]}}Dt=new WeakMap;Bo=new WeakMap;os=new WeakMap;ls=new WeakMap;ft=new WeakMap;lo=new WeakMap;ds=new WeakMap;us=new WeakMap;cs=new WeakMap;fu=new WeakSet;Dp=function(t){const e=oe(this,ft).activeSegment;if(!e)return;const i=this.getPointerRatio(t),r=`#segments-clipping rect:nth-child(${oe(this,lo).findIndex((n,s,o)=>{const l=o[s+1];return l!=null&&i>=n&&i<=l})+1})`;(e.selectorText!=r||!e.style.transform)&&(e.selectorText=r,e.style.setProperty("transform","var(--media-range-segment-hover-transform, scaleY(2))"))};hs=new WeakSet;Ql=function(){this.hasAttribute("disabled")||(this.addEventListener("input",this),this.addEventListener("pointerdown",this),this.addEventListener("pointerenter",this))};ms=new WeakSet;zl=function(){var t,e;this.removeEventListener("input",this),this.removeEventListener("pointerdown",this),this.removeEventListener("pointerenter",this),(t=f.window)==null||t.removeEventListener("pointerup",this),(e=f.window)==null||e.removeEventListener("pointermove",this)};uo=new WeakSet;Eu=function(t){var e;mi(this,Bo,t.composedPath().includes(this.range)),(e=f.window)==null||e.addEventListener("pointerup",this)};Zl=new WeakSet;Mp=function(t){var e;t.pointerType!=="mouse"&&vt(this,uo,Eu).call(this,t),this.addEventListener("pointerleave",this),(e=f.window)==null||e.addEventListener("pointermove",this)};jl=new WeakSet;xp=function(){var t;(t=f.window)==null||t.removeEventListener("pointerup",this),this.toggleAttribute("dragging",!1),this.range.disabled=this.hasAttribute("disabled")};Xl=new WeakSet;Op=function(){var t,e;this.removeEventListener("pointerleave",this),(t=f.window)==null||t.removeEventListener("pointermove",this),this.toggleAttribute("dragging",!1),this.range.disabled=this.hasAttribute("disabled"),(e=oe(this,ft).activeSegment)==null||e.style.removeProperty("transform")};Jl=new WeakSet;Np=function(t){t.pointerType==="pen"&&t.buttons===0||(this.toggleAttribute("dragging",t.buttons===1||t.pointerType!=="mouse"),this.updatePointerBar(t),vt(this,fu,Dp).call(this,t),this.dragging&&(t.pointerType!=="mouse"||!oe(this,Bo))&&(this.range.disabled=!0,this.range.valueAsNumber=this.getPointerRatio(t),this.range.dispatchEvent(new Event("input",{bubbles:!0,composed:!0}))))};sr.shadowRootOptions={mode:"open"};sr.getTemplateHTML=D0;sr.getContainerTemplateHTML=M0;f.customElements.get("media-chrome-range")||f.customElements.define("media-chrome-range",sr);var Pp=(t,e,i)=>{if(!e.has(t))throw TypeError("Cannot "+i)},Ln=(t,e,i)=>(Pp(t,e,"read from private field"),i?i.call(t):e.get(t)),x0=(t,e,i)=>{if(e.has(t))throw TypeError("Cannot add the same private member more than once");e instanceof WeakSet?e.add(t):e.set(t,i)},Dn=(t,e,i,a)=>(Pp(t,e,"write to private field"),e.set(t,i),i),Mt;function O0(t){return`
    <style>
      :host {
        
        box-sizing: border-box;
        display: var(--media-control-display, var(--media-control-bar-display, inline-flex));
        color: var(--media-text-color, var(--media-primary-color, rgb(238 238 238)));
        --media-loading-indicator-icon-height: 44px;
      }

      ::slotted(media-time-range),
      ::slotted(media-volume-range) {
        min-height: 100%;
      }

      ::slotted(media-time-range),
      ::slotted(media-clip-selector) {
        flex-grow: 1;
      }

      ::slotted([role="menu"]) {
        position: absolute;
      }
    </style>

    <slot></slot>
  `}class _u extends f.HTMLElement{constructor(){if(super(),x0(this,Mt,void 0),!this.shadowRoot){this.attachShadow(this.constructor.shadowRootOptions);const e=Je(this.attributes);this.shadowRoot.innerHTML=this.constructor.getTemplateHTML(e)}}static get observedAttributes(){return[Y.MEDIA_CONTROLLER]}attributeChangedCallback(e,i,a){var r,n,s,o,l;e===Y.MEDIA_CONTROLLER&&(i&&((n=(r=Ln(this,Mt))==null?void 0:r.unassociateElement)==null||n.call(r,this),Dn(this,Mt,null)),a&&this.isConnected&&(Dn(this,Mt,(s=this.getRootNode())==null?void 0:s.getElementById(a)),(l=(o=Ln(this,Mt))==null?void 0:o.associateElement)==null||l.call(o,this)))}connectedCallback(){var e,i,a;const r=this.getAttribute(Y.MEDIA_CONTROLLER);r&&(Dn(this,Mt,(e=this.getRootNode())==null?void 0:e.getElementById(r)),(a=(i=Ln(this,Mt))==null?void 0:i.associateElement)==null||a.call(i,this))}disconnectedCallback(){var e,i;(i=(e=Ln(this,Mt))==null?void 0:e.unassociateElement)==null||i.call(e,this),Dn(this,Mt,null)}}Mt=new WeakMap;_u.shadowRootOptions={mode:"open"};_u.getTemplateHTML=O0;f.customElements.get("media-control-bar")||f.customElements.define("media-control-bar",_u);var Up=(t,e,i)=>{if(!e.has(t))throw TypeError("Cannot "+i)},Mn=(t,e,i)=>(Up(t,e,"read from private field"),i?i.call(t):e.get(t)),N0=(t,e,i)=>{if(e.has(t))throw TypeError("Cannot add the same private member more than once");e instanceof WeakSet?e.add(t):e.set(t,i)},xn=(t,e,i,a)=>(Up(t,e,"write to private field"),e.set(t,i),i),xt;function P0(t,e={}){return`
    <style>
      :host {
        font: var(--media-font,
          var(--media-font-weight, normal)
          var(--media-font-size, 14px) /
          var(--media-text-content-height, var(--media-control-height, 24px))
          var(--media-font-family, helvetica neue, segoe ui, roboto, arial, sans-serif));
        color: var(--media-text-color, var(--media-primary-color, rgb(238 238 238)));
        background: var(--media-text-background, var(--media-control-background, var(--media-secondary-color, rgb(20 20 30 / .7))));
        padding: var(--media-control-padding, 10px);
        display: inline-flex;
        justify-content: center;
        align-items: center;
        vertical-align: middle;
        box-sizing: border-box;
        text-align: center;
        pointer-events: auto;
      }

      
      :host(:focus-visible) {
        box-shadow: inset 0 0 0 2px rgb(27 127 204 / .9);
        outline: 0;
      }

      
      :host(:where(:focus)) {
        box-shadow: none;
        outline: 0;
      }
    </style>

    ${this.getSlotTemplateHTML(t,e)}
  `}function U0(t,e){return`
    <slot></slot>
  `}class wi extends f.HTMLElement{constructor(){if(super(),N0(this,xt,void 0),!this.shadowRoot){this.attachShadow(this.constructor.shadowRootOptions);const e=Je(this.attributes);this.shadowRoot.innerHTML=this.constructor.getTemplateHTML(e)}}static get observedAttributes(){return[Y.MEDIA_CONTROLLER]}attributeChangedCallback(e,i,a){var r,n,s,o,l;e===Y.MEDIA_CONTROLLER&&(i&&((n=(r=Mn(this,xt))==null?void 0:r.unassociateElement)==null||n.call(r,this),xn(this,xt,null)),a&&this.isConnected&&(xn(this,xt,(s=this.getRootNode())==null?void 0:s.getElementById(a)),(l=(o=Mn(this,xt))==null?void 0:o.associateElement)==null||l.call(o,this)))}connectedCallback(){var e,i,a;const{style:r}=Ae(this.shadowRoot,":host");r.setProperty("display",`var(--media-control-display, var(--${this.localName}-display, inline-flex))`);const n=this.getAttribute(Y.MEDIA_CONTROLLER);n&&(xn(this,xt,(e=this.getRootNode())==null?void 0:e.getElementById(n)),(a=(i=Mn(this,xt))==null?void 0:i.associateElement)==null||a.call(i,this))}disconnectedCallback(){var e,i;(i=(e=Mn(this,xt))==null?void 0:e.unassociateElement)==null||i.call(e,this),xn(this,xt,null)}}xt=new WeakMap;wi.shadowRootOptions={mode:"open"};wi.getTemplateHTML=P0;wi.getSlotTemplateHTML=U0;f.customElements.get("media-text-display")||f.customElements.define("media-text-display",wi);var $p=(t,e,i)=>{if(!e.has(t))throw TypeError("Cannot "+i)},nh=(t,e,i)=>($p(t,e,"read from private field"),i?i.call(t):e.get(t)),$0=(t,e,i)=>{if(e.has(t))throw TypeError("Cannot add the same private member more than once");e instanceof WeakSet?e.add(t):e.set(t,i)},H0=(t,e,i,a)=>($p(t,e,"write to private field"),e.set(t,i),i),Nr;function B0(t,e){return`
    <slot>${ki(e.mediaDuration)}</slot>
  `}class Hp extends wi{constructor(){var e;super(),$0(this,Nr,void 0),H0(this,Nr,this.shadowRoot.querySelector("slot")),nh(this,Nr).textContent=ki((e=this.mediaDuration)!=null?e:0)}static get observedAttributes(){return[...super.observedAttributes,u.MEDIA_DURATION]}attributeChangedCallback(e,i,a){e===u.MEDIA_DURATION&&(nh(this,Nr).textContent=ki(+a)),super.attributeChangedCallback(e,i,a)}get mediaDuration(){return ie(this,u.MEDIA_DURATION)}set mediaDuration(e){ue(this,u.MEDIA_DURATION,e)}}Nr=new WeakMap;Hp.getSlotTemplateHTML=B0;f.customElements.get("media-duration-display")||f.customElements.define("media-duration-display",Hp);const W0={2:L("Network Error"),3:L("Decode Error"),4:L("Source Not Supported"),5:L("Encryption Error")},F0={2:L("A network error caused the media download to fail."),3:L("A media error caused playback to be aborted. The media could be corrupt or your browser does not support this format."),4:L("An unsupported error occurred. The server or network failed, or your browser does not support this format."),5:L("The media is encrypted and there are no keys to decrypt it.")},Bp=t=>{var e,i;return t.code===1?null:{title:(e=W0[t.code])!=null?e:`Error ${t.code}`,message:(i=F0[t.code])!=null?i:t.message}};var Wp=(t,e,i)=>{if(!e.has(t))throw TypeError("Cannot "+i)},K0=(t,e,i)=>(Wp(t,e,"read from private field"),i?i.call(t):e.get(t)),V0=(t,e,i)=>{if(e.has(t))throw TypeError("Cannot add the same private member more than once");e instanceof WeakSet?e.add(t):e.set(t,i)},q0=(t,e,i,a)=>(Wp(t,e,"write to private field"),e.set(t,i),i),ps;function Y0(t){return`
    <style>
      :host {
        background: rgb(20 20 30 / .8);
      }

      #content {
        display: block;
        padding: 1.2em 1.5em;
      }

      h3,
      p {
        margin-block: 0 .3em;
      }
    </style>
    <slot name="error-${t.mediaerrorcode}" id="content">
      ${Fp({code:+t.mediaerrorcode,message:t.mediaerrormessage})}
    </slot>
  `}function G0(t){return t.code&&Bp(t)!==null}function Fp(t){var e;const{title:i,message:a}=(e=Bp(t))!=null?e:{};let r="";return i&&(r+=`<slot name="error-${t.code}-title"><h3>${i}</h3></slot>`),a&&(r+=`<slot name="error-${t.code}-message"><p>${a}</p></slot>`),r}const sh=[u.MEDIA_ERROR_CODE,u.MEDIA_ERROR_MESSAGE];class Wo extends nr{constructor(){super(...arguments),V0(this,ps,null)}static get observedAttributes(){return[...super.observedAttributes,...sh]}formatErrorMessage(e){return this.constructor.formatErrorMessage(e)}attributeChangedCallback(e,i,a){var r;if(super.attributeChangedCallback(e,i,a),!sh.includes(e))return;const n=(r=this.mediaError)!=null?r:{code:this.mediaErrorCode,message:this.mediaErrorMessage};this.open=G0(n),this.open&&(this.shadowRoot.querySelector("slot").name=`error-${this.mediaErrorCode}`,this.shadowRoot.querySelector("#content").innerHTML=this.formatErrorMessage(n))}get mediaError(){return K0(this,ps)}set mediaError(e){q0(this,ps,e)}get mediaErrorCode(){return ie(this,"mediaerrorcode")}set mediaErrorCode(e){ue(this,"mediaerrorcode",e)}get mediaErrorMessage(){return ae(this,"mediaerrormessage")}set mediaErrorMessage(e){re(this,"mediaerrormessage",e)}}ps=new WeakMap;Wo.getSlotTemplateHTML=Y0;Wo.formatErrorMessage=Fp;f.customElements.get("media-error-dialog")||f.customElements.define("media-error-dialog",Wo);var Kp=Wo,Q0=(t,e,i)=>{if(!e.has(t))throw TypeError("Cannot "+i)},ui=(t,e,i)=>(Q0(t,e,"read from private field"),i?i.call(t):e.get(t)),oh=(t,e,i)=>{if(e.has(t))throw TypeError("Cannot add the same private member more than once");e instanceof WeakSet?e.add(t):e.set(t,i)},ga,ya;function z0(t){return`
    <style>
      :host {
        position: fixed;
        top: 0;
        left: 0;
        z-index: 9999;
        background: rgb(20 20 30 / .8);
        backdrop-filter: blur(10px);
      }

      #content {
        display: block;
        width: clamp(400px, 40vw, 700px);
        max-width: 90vw;
        text-align: left;
      }

      h2 {
        margin: 0 0 1.5rem 0;
        font-size: 1.5rem;
        font-weight: 500;
        text-align: center;
      }

      .shortcuts-table {
        width: 100%;
        border-collapse: collapse;
      }

      .shortcuts-table tr {
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }

      .shortcuts-table tr:last-child {
        border-bottom: none;
      }

      .shortcuts-table td {
        padding: 0.75rem 0.5rem;
      }

      .shortcuts-table td:first-child {
        text-align: right;
        padding-right: 1rem;
        width: 40%;
        min-width: 120px;
      }

      .shortcuts-table td:last-child {
        padding-left: 1rem;
      }

      .key {
        display: inline-block;
        background: rgba(255, 255, 255, 0.15);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 4px;
        padding: 0.25rem 0.5rem;
        font-family: 'Courier New', monospace;
        font-size: 0.9rem;
        font-weight: 500;
        min-width: 1.5rem;
        text-align: center;
        margin: 0 0.2rem;
      }

      .description {
        color: rgba(255, 255, 255, 0.9);
        font-size: 0.95rem;
      }

      .key-combo {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 0.3rem;
      }

      .key-separator {
        color: rgba(255, 255, 255, 0.5);
        font-size: 0.9rem;
      }
    </style>
    <slot id="content">
      ${Z0()}
    </slot>
  `}function Z0(){return`
    <h2>Keyboard Shortcuts</h2>
    <table class="shortcuts-table">${[{keys:["Space","k"],description:"Toggle Playback"},{keys:["m"],description:"Toggle mute"},{keys:["f"],description:"Toggle fullscreen"},{keys:["c"],description:"Toggle captions or subtitles, if available"},{keys:["p"],description:"Toggle Picture in Picture"},{keys:["←","j"],description:"Seek back 10s"},{keys:["→","l"],description:"Seek forward 10s"},{keys:["↑"],description:"Turn volume up"},{keys:["↓"],description:"Turn volume down"},{keys:["< (SHIFT+,)"],description:"Decrease playback rate"},{keys:["> (SHIFT+.)"],description:"Increase playback rate"}].map(({keys:i,description:a})=>`
      <tr>
        <td>
          <div class="key-combo">${i.map((n,s)=>s>0?`<span class="key-separator">or</span><span class="key">${n}</span>`:`<span class="key">${n}</span>`).join("")}</div>
        </td>
        <td class="description">${a}</td>
      </tr>
    `).join("")}</table>
  `}class Vp extends nr{constructor(){super(...arguments),oh(this,ga,e=>{var i;if(!this.open)return;const a=(i=this.shadowRoot)==null?void 0:i.querySelector("#content");if(!a)return;const r=e.composedPath(),n=r[0]===this||r.includes(this),s=r.includes(a);n&&!s&&(this.open=!1)}),oh(this,ya,e=>{if(!this.open)return;const i=e.shiftKey&&(e.key==="/"||e.key==="?");(e.key==="Escape"||i)&&!e.ctrlKey&&!e.altKey&&!e.metaKey&&(this.open=!1,e.preventDefault(),e.stopPropagation())})}connectedCallback(){super.connectedCallback(),this.open&&(this.addEventListener("click",ui(this,ga)),document.addEventListener("keydown",ui(this,ya)))}disconnectedCallback(){this.removeEventListener("click",ui(this,ga)),document.removeEventListener("keydown",ui(this,ya))}attributeChangedCallback(e,i,a){super.attributeChangedCallback(e,i,a),e==="open"&&(this.open?(this.addEventListener("click",ui(this,ga)),document.addEventListener("keydown",ui(this,ya))):(this.removeEventListener("click",ui(this,ga)),document.removeEventListener("keydown",ui(this,ya))))}}ga=new WeakMap;ya=new WeakMap;Vp.getSlotTemplateHTML=z0;f.customElements.get("media-keyboard-shortcuts-dialog")||f.customElements.define("media-keyboard-shortcuts-dialog",Vp);var qp=(t,e,i)=>{if(!e.has(t))throw TypeError("Cannot "+i)},j0=(t,e,i)=>(qp(t,e,"read from private field"),e.get(t)),X0=(t,e,i)=>{if(e.has(t))throw TypeError("Cannot add the same private member more than once");e instanceof WeakSet?e.add(t):e.set(t,i)},J0=(t,e,i,a)=>(qp(t,e,"write to private field"),e.set(t,i),i),vs;const e1=`<svg aria-hidden="true" viewBox="0 0 26 24">
  <path d="M16 3v2.5h3.5V9H22V3h-6ZM4 9h2.5V5.5H10V3H4v6Zm15.5 9.5H16V21h6v-6h-2.5v3.5ZM6.5 15H4v6h6v-2.5H6.5V15Z"/>
</svg>`,t1=`<svg aria-hidden="true" viewBox="0 0 26 24">
  <path d="M18.5 6.5V3H16v6h6V6.5h-3.5ZM16 21h2.5v-3.5H22V15h-6v6ZM4 17.5h3.5V21H10v-6H4v2.5Zm3.5-11H4V9h6V3H7.5v3.5Z"/>
</svg>`;function i1(t){return`
    <style>
      :host([${u.MEDIA_IS_FULLSCREEN}]) slot[name=icon] slot:not([name=exit]) {
        display: none !important;
      }

      
      :host(:not([${u.MEDIA_IS_FULLSCREEN}])) slot[name=icon] slot:not([name=enter]) {
        display: none !important;
      }

      :host([${u.MEDIA_IS_FULLSCREEN}]) slot[name=tooltip-enter],
      :host(:not([${u.MEDIA_IS_FULLSCREEN}])) slot[name=tooltip-exit] {
        display: none;
      }
    </style>

    <slot name="icon">
      <slot name="enter">${e1}</slot>
      <slot name="exit">${t1}</slot>
    </slot>
  `}function a1(){return`
    <slot name="tooltip-enter">${L("Enter fullscreen mode")}</slot>
    <slot name="tooltip-exit">${L("Exit fullscreen mode")}</slot>
  `}const lh=t=>{const e=t.mediaIsFullscreen?L("exit fullscreen mode"):L("enter fullscreen mode");t.setAttribute("aria-label",e)};class bu extends Ce{constructor(){super(...arguments),X0(this,vs,null)}static get observedAttributes(){return[...super.observedAttributes,u.MEDIA_IS_FULLSCREEN,u.MEDIA_FULLSCREEN_UNAVAILABLE]}connectedCallback(){super.connectedCallback(),lh(this)}attributeChangedCallback(e,i,a){super.attributeChangedCallback(e,i,a),e===u.MEDIA_IS_FULLSCREEN&&lh(this)}get mediaFullscreenUnavailable(){return ae(this,u.MEDIA_FULLSCREEN_UNAVAILABLE)}set mediaFullscreenUnavailable(e){re(this,u.MEDIA_FULLSCREEN_UNAVAILABLE,e)}get mediaIsFullscreen(){return W(this,u.MEDIA_IS_FULLSCREEN)}set mediaIsFullscreen(e){F(this,u.MEDIA_IS_FULLSCREEN,e)}handleClick(e){J0(this,vs,e);const i=j0(this,vs)instanceof PointerEvent,a=this.mediaIsFullscreen?new f.CustomEvent(I.MEDIA_EXIT_FULLSCREEN_REQUEST,{composed:!0,bubbles:!0}):new f.CustomEvent(I.MEDIA_ENTER_FULLSCREEN_REQUEST,{composed:!0,bubbles:!0,detail:i});this.dispatchEvent(a)}}vs=new WeakMap;bu.getSlotTemplateHTML=i1;bu.getTooltipContentHTML=a1;f.customElements.get("media-fullscreen-button")||f.customElements.define("media-fullscreen-button",bu);const{MEDIA_TIME_IS_LIVE:fs,MEDIA_PAUSED:Zr}=u,{MEDIA_SEEK_TO_LIVE_REQUEST:r1,MEDIA_PLAY_REQUEST:n1}=I,s1='<svg viewBox="0 0 6 12"><circle cx="3" cy="6" r="2"></circle></svg>';function o1(t){return`
    <style>
      :host { --media-tooltip-display: none; }
      
      slot[name=indicator] > *,
      :host ::slotted([slot=indicator]) {
        
        min-width: auto;
        fill: var(--media-live-button-icon-color, rgb(140, 140, 140));
        color: var(--media-live-button-icon-color, rgb(140, 140, 140));
      }

      :host([${fs}]:not([${Zr}])) slot[name=indicator] > *,
      :host([${fs}]:not([${Zr}])) ::slotted([slot=indicator]) {
        fill: var(--media-live-button-indicator-color, rgb(255, 0, 0));
        color: var(--media-live-button-indicator-color, rgb(255, 0, 0));
      }

      :host([${fs}]:not([${Zr}])) {
        cursor: var(--media-cursor, not-allowed);
      }

      slot[name=text]{
        text-transform: uppercase;
      }

    </style>

    <slot name="indicator">${s1}</slot>
    
    <slot name="spacer">&nbsp;</slot><slot name="text">${L("live")}</slot>
  `}const dh=t=>{var e;const i=t.mediaPaused||!t.mediaTimeIsLive,a=L(i?"seek to live":"playing live");t.setAttribute("aria-label",a);const r=(e=t.shadowRoot)==null?void 0:e.querySelector('slot[name="text"]');r&&(r.textContent=L("live")),i?t.removeAttribute("aria-disabled"):t.setAttribute("aria-disabled","true")};class Yp extends Ce{static get observedAttributes(){return[...super.observedAttributes,fs,Zr]}connectedCallback(){super.connectedCallback(),dh(this)}attributeChangedCallback(e,i,a){super.attributeChangedCallback(e,i,a),dh(this)}get mediaPaused(){return W(this,u.MEDIA_PAUSED)}set mediaPaused(e){F(this,u.MEDIA_PAUSED,e)}get mediaTimeIsLive(){return W(this,u.MEDIA_TIME_IS_LIVE)}set mediaTimeIsLive(e){F(this,u.MEDIA_TIME_IS_LIVE,e)}handleClick(){!this.mediaPaused&&this.mediaTimeIsLive||(this.dispatchEvent(new f.CustomEvent(r1,{composed:!0,bubbles:!0})),this.hasAttribute(Zr)&&this.dispatchEvent(new f.CustomEvent(n1,{composed:!0,bubbles:!0})))}}Yp.getSlotTemplateHTML=o1;f.customElements.get("media-live-button")||f.customElements.define("media-live-button",Yp);var Gp=(t,e,i)=>{if(!e.has(t))throw TypeError("Cannot "+i)},pr=(t,e,i)=>(Gp(t,e,"read from private field"),i?i.call(t):e.get(t)),uh=(t,e,i)=>{if(e.has(t))throw TypeError("Cannot add the same private member more than once");e instanceof WeakSet?e.add(t):e.set(t,i)},vr=(t,e,i,a)=>(Gp(t,e,"write to private field"),e.set(t,i),i),Ot,Es;const On={LOADING_DELAY:"loadingdelay",NO_AUTOHIDE:"noautohide"},Qp=500,l1=`
<svg aria-hidden="true" viewBox="0 0 100 100">
  <path d="M73,50c0-12.7-10.3-23-23-23S27,37.3,27,50 M30.9,50c0-10.5,8.5-19.1,19.1-19.1S69.1,39.5,69.1,50">
    <animateTransform
       attributeName="transform"
       attributeType="XML"
       type="rotate"
       dur="1s"
       from="0 50 50"
       to="360 50 50"
       repeatCount="indefinite" />
  </path>
</svg>
`;function d1(t){return`
    <style>
      :host {
        display: var(--media-control-display, var(--media-loading-indicator-display, inline-block));
        vertical-align: middle;
        box-sizing: border-box;
        --_loading-indicator-delay: var(--media-loading-indicator-transition-delay, ${Qp}ms);
      }

      #status {
        color: rgba(0,0,0,0);
        width: 0px;
        height: 0px;
      }

      :host slot[name=icon] > *,
      :host ::slotted([slot=icon]) {
        opacity: var(--media-loading-indicator-opacity, 0);
        transition: opacity 0.15s;
      }

      :host([${u.MEDIA_LOADING}]:not([${u.MEDIA_PAUSED}])) slot[name=icon] > *,
      :host([${u.MEDIA_LOADING}]:not([${u.MEDIA_PAUSED}])) ::slotted([slot=icon]) {
        opacity: var(--media-loading-indicator-opacity, 1);
        transition: opacity 0.15s var(--_loading-indicator-delay);
      }

      :host #status {
        visibility: var(--media-loading-indicator-opacity, hidden);
        transition: visibility 0.15s;
      }

      :host([${u.MEDIA_LOADING}]:not([${u.MEDIA_PAUSED}])) #status {
        visibility: var(--media-loading-indicator-opacity, visible);
        transition: visibility 0.15s var(--_loading-indicator-delay);
      }

      svg, img, ::slotted(svg), ::slotted(img) {
        width: var(--media-loading-indicator-icon-width);
        height: var(--media-loading-indicator-icon-height, 100px);
        fill: var(--media-icon-color, var(--media-primary-color, rgb(238 238 238)));
        vertical-align: middle;
      }
    </style>

    <slot name="icon">${l1}</slot>
    <div id="status" role="status" aria-live="polite">${L("media loading")}</div>
  `}class gu extends f.HTMLElement{constructor(){if(super(),uh(this,Ot,void 0),uh(this,Es,Qp),!this.shadowRoot){this.attachShadow(this.constructor.shadowRootOptions);const e=Je(this.attributes);this.shadowRoot.innerHTML=this.constructor.getTemplateHTML(e)}}static get observedAttributes(){return[Y.MEDIA_CONTROLLER,u.MEDIA_PAUSED,u.MEDIA_LOADING,On.LOADING_DELAY]}attributeChangedCallback(e,i,a){var r,n,s,o,l;e===On.LOADING_DELAY&&i!==a?this.loadingDelay=Number(a):e===Y.MEDIA_CONTROLLER&&(i&&((n=(r=pr(this,Ot))==null?void 0:r.unassociateElement)==null||n.call(r,this),vr(this,Ot,null)),a&&this.isConnected&&(vr(this,Ot,(s=this.getRootNode())==null?void 0:s.getElementById(a)),(l=(o=pr(this,Ot))==null?void 0:o.associateElement)==null||l.call(o,this)))}connectedCallback(){var e,i,a;const r=this.getAttribute(Y.MEDIA_CONTROLLER);r&&(vr(this,Ot,(e=this.getRootNode())==null?void 0:e.getElementById(r)),(a=(i=pr(this,Ot))==null?void 0:i.associateElement)==null||a.call(i,this))}disconnectedCallback(){var e,i;(i=(e=pr(this,Ot))==null?void 0:e.unassociateElement)==null||i.call(e,this),vr(this,Ot,null)}get loadingDelay(){return pr(this,Es)}set loadingDelay(e){vr(this,Es,e);const{style:i}=Ae(this.shadowRoot,":host");i.setProperty("--_loading-indicator-delay",`var(--media-loading-indicator-transition-delay, ${e}ms)`)}get mediaPaused(){return W(this,u.MEDIA_PAUSED)}set mediaPaused(e){F(this,u.MEDIA_PAUSED,e)}get mediaLoading(){return W(this,u.MEDIA_LOADING)}set mediaLoading(e){F(this,u.MEDIA_LOADING,e)}get mediaController(){return ae(this,Y.MEDIA_CONTROLLER)}set mediaController(e){re(this,Y.MEDIA_CONTROLLER,e)}get noAutohide(){return W(this,On.NO_AUTOHIDE)}set noAutohide(e){F(this,On.NO_AUTOHIDE,e)}}Ot=new WeakMap;Es=new WeakMap;gu.shadowRootOptions={mode:"open"};gu.getTemplateHTML=d1;f.customElements.get("media-loading-indicator")||f.customElements.define("media-loading-indicator",gu);const u1=`<svg aria-hidden="true" viewBox="0 0 24 24">
  <path d="M16.5 12A4.5 4.5 0 0 0 14 8v2.18l2.45 2.45a4.22 4.22 0 0 0 .05-.63Zm2.5 0a6.84 6.84 0 0 1-.54 2.64L20 16.15A8.8 8.8 0 0 0 21 12a9 9 0 0 0-7-8.77v2.06A7 7 0 0 1 19 12ZM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25A6.92 6.92 0 0 1 14 18.7v2.06A9 9 0 0 0 17.69 19l2 2.05L21 19.73l-9-9L4.27 3ZM12 4 9.91 6.09 12 8.18V4Z"/>
</svg>`,ch=`<svg aria-hidden="true" viewBox="0 0 24 24">
  <path d="M3 9v6h4l5 5V4L7 9H3Zm13.5 3A4.5 4.5 0 0 0 14 8v8a4.47 4.47 0 0 0 2.5-4Z"/>
</svg>`,c1=`<svg aria-hidden="true" viewBox="0 0 24 24">
  <path d="M3 9v6h4l5 5V4L7 9H3Zm13.5 3A4.5 4.5 0 0 0 14 8v8a4.47 4.47 0 0 0 2.5-4ZM14 3.23v2.06a7 7 0 0 1 0 13.42v2.06a9 9 0 0 0 0-17.54Z"/>
</svg>`;function h1(t){return`
    <style>
      :host(:not([${u.MEDIA_VOLUME_LEVEL}])) slot[name=icon] slot:not([name=high]),
      :host([${u.MEDIA_VOLUME_LEVEL}=high]) slot[name=icon] slot:not([name=high]) {
        display: none !important;
      }

      :host([${u.MEDIA_VOLUME_LEVEL}=off]) slot[name=icon] slot:not([name=off]) {
        display: none !important;
      }

      :host([${u.MEDIA_VOLUME_LEVEL}=low]) slot[name=icon] slot:not([name=low]) {
        display: none !important;
      }

      :host([${u.MEDIA_VOLUME_LEVEL}=medium]) slot[name=icon] slot:not([name=medium]) {
        display: none !important;
      }

      :host(:not([${u.MEDIA_VOLUME_LEVEL}=off])) slot[name=tooltip-unmute],
      :host([${u.MEDIA_VOLUME_LEVEL}=off]) slot[name=tooltip-mute] {
        display: none;
      }
    </style>

    <slot name="icon">
      <slot name="off">${u1}</slot>
      <slot name="low">${ch}</slot>
      <slot name="medium">${ch}</slot>
      <slot name="high">${c1}</slot>
    </slot>
  `}function m1(){return`
    <slot name="tooltip-mute">${L("Mute")}</slot>
    <slot name="tooltip-unmute">${L("Unmute")}</slot>
  `}const hh=t=>{const e=t.mediaVolumeLevel==="off",i=L(e?"unmute":"mute");t.setAttribute("aria-label",i)};class yu extends Ce{static get observedAttributes(){return[...super.observedAttributes,u.MEDIA_VOLUME_LEVEL]}connectedCallback(){super.connectedCallback(),hh(this)}attributeChangedCallback(e,i,a){super.attributeChangedCallback(e,i,a),e===u.MEDIA_VOLUME_LEVEL&&hh(this)}get mediaVolumeLevel(){return ae(this,u.MEDIA_VOLUME_LEVEL)}set mediaVolumeLevel(e){re(this,u.MEDIA_VOLUME_LEVEL,e)}handleClick(){const e=this.mediaVolumeLevel==="off"?I.MEDIA_UNMUTE_REQUEST:I.MEDIA_MUTE_REQUEST;this.dispatchEvent(new f.CustomEvent(e,{composed:!0,bubbles:!0}))}}yu.getSlotTemplateHTML=h1;yu.getTooltipContentHTML=m1;f.customElements.get("media-mute-button")||f.customElements.define("media-mute-button",yu);const mh=`<svg aria-hidden="true" viewBox="0 0 28 24">
  <path d="M24 3H4a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h20a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1Zm-1 16H5V5h18v14Zm-3-8h-7v5h7v-5Z"/>
</svg>`;function p1(t){return`
    <style>
      :host([${u.MEDIA_IS_PIP}]) slot[name=icon] slot:not([name=exit]) {
        display: none !important;
      }

      :host(:not([${u.MEDIA_IS_PIP}])) slot[name=icon] slot:not([name=enter]) {
        display: none !important;
      }

      :host([${u.MEDIA_IS_PIP}]) slot[name=tooltip-enter],
      :host(:not([${u.MEDIA_IS_PIP}])) slot[name=tooltip-exit] {
        display: none;
      }
    </style>

    <slot name="icon">
      <slot name="enter">${mh}</slot>
      <slot name="exit">${mh}</slot>
    </slot>
  `}function v1(){return`
    <slot name="tooltip-enter">${L("Enter picture in picture mode")}</slot>
    <slot name="tooltip-exit">${L("Exit picture in picture mode")}</slot>
  `}const ph=t=>{const e=t.mediaIsPip?L("exit picture in picture mode"):L("enter picture in picture mode");t.setAttribute("aria-label",e)};class Tu extends Ce{static get observedAttributes(){return[...super.observedAttributes,u.MEDIA_IS_PIP,u.MEDIA_PIP_UNAVAILABLE]}connectedCallback(){super.connectedCallback(),ph(this)}attributeChangedCallback(e,i,a){super.attributeChangedCallback(e,i,a),e===u.MEDIA_IS_PIP&&ph(this)}get mediaPipUnavailable(){return ae(this,u.MEDIA_PIP_UNAVAILABLE)}set mediaPipUnavailable(e){re(this,u.MEDIA_PIP_UNAVAILABLE,e)}get mediaIsPip(){return W(this,u.MEDIA_IS_PIP)}set mediaIsPip(e){F(this,u.MEDIA_IS_PIP,e)}handleClick(){const e=this.mediaIsPip?I.MEDIA_EXIT_PIP_REQUEST:I.MEDIA_ENTER_PIP_REQUEST;this.dispatchEvent(new f.CustomEvent(e,{composed:!0,bubbles:!0}))}}Tu.getSlotTemplateHTML=p1;Tu.getTooltipContentHTML=v1;f.customElements.get("media-pip-button")||f.customElements.define("media-pip-button",Tu);var f1=(t,e,i)=>{if(!e.has(t))throw TypeError("Cannot "+i)},da=(t,e,i)=>(f1(t,e,"read from private field"),i?i.call(t):e.get(t)),E1=(t,e,i)=>{if(e.has(t))throw TypeError("Cannot add the same private member more than once");e instanceof WeakSet?e.add(t):e.set(t,i)},pi;const ol={RATES:"rates"},zp=[1,1.2,1.5,1.7,2],Ha=1;function _1(t){return`
    <style>
      :host {
        min-width: 5ch;
        padding: var(--media-button-padding, var(--media-control-padding, 10px 5px));
      }
    </style>
    <slot name="icon">${t.mediaplaybackrate||Ha}x</slot>
  `}function b1(){return L("Playback rate")}class Au extends Ce{constructor(){var e;super(),E1(this,pi,new nu(this,ol.RATES,{defaultValue:zp})),this.container=this.shadowRoot.querySelector('slot[name="icon"]'),this.container.innerHTML=`${(e=this.mediaPlaybackRate)!=null?e:Ha}x`}static get observedAttributes(){return[...super.observedAttributes,u.MEDIA_PLAYBACK_RATE,ol.RATES]}attributeChangedCallback(e,i,a){if(super.attributeChangedCallback(e,i,a),e===ol.RATES&&(da(this,pi).value=a),e===u.MEDIA_PLAYBACK_RATE){const r=a?+a:Number.NaN,n=Number.isNaN(r)?Ha:r;this.container.innerHTML=`${n}x`,this.setAttribute("aria-label",L("Playback rate {playbackRate}",{playbackRate:n}))}}get rates(){return da(this,pi)}set rates(e){e?Array.isArray(e)?da(this,pi).value=e.join(" "):typeof e=="string"&&(da(this,pi).value=e):da(this,pi).value=""}get mediaPlaybackRate(){return ie(this,u.MEDIA_PLAYBACK_RATE,Ha)}set mediaPlaybackRate(e){ue(this,u.MEDIA_PLAYBACK_RATE,e)}handleClick(){var e,i;const a=Array.from(da(this,pi).values(),s=>+s).sort((s,o)=>s-o),r=(i=(e=a.find(s=>s>this.mediaPlaybackRate))!=null?e:a[0])!=null?i:Ha,n=new f.CustomEvent(I.MEDIA_PLAYBACK_RATE_REQUEST,{composed:!0,bubbles:!0,detail:r});this.dispatchEvent(n)}}pi=new WeakMap;Au.getSlotTemplateHTML=_1;Au.getTooltipContentHTML=b1;f.customElements.get("media-playback-rate-button")||f.customElements.define("media-playback-rate-button",Au);const g1=`<svg aria-hidden="true" viewBox="0 0 24 24">
  <path d="m6 21 15-9L6 3v18Z"/>
</svg>`,y1=`<svg aria-hidden="true" viewBox="0 0 24 24">
  <path d="M6 20h4V4H6v16Zm8-16v16h4V4h-4Z"/>
</svg>`;function T1(t){return`
    <style>
      :host([${u.MEDIA_PAUSED}]) slot[name=pause],
      :host(:not([${u.MEDIA_PAUSED}])) slot[name=play] {
        display: none !important;
      }

      :host([${u.MEDIA_PAUSED}]) slot[name=tooltip-pause],
      :host(:not([${u.MEDIA_PAUSED}])) slot[name=tooltip-play] {
        display: none;
      }
    </style>

    <slot name="icon">
      <slot name="play">${g1}</slot>
      <slot name="pause">${y1}</slot>
    </slot>
  `}function A1(){return`
    <slot name="tooltip-play">${L("Play")}</slot>
    <slot name="tooltip-pause">${L("Pause")}</slot>
  `}const vh=t=>{const e=t.mediaPaused?L("play"):L("pause");t.setAttribute("aria-label",e)};class ku extends Ce{static get observedAttributes(){return[...super.observedAttributes,u.MEDIA_PAUSED,u.MEDIA_ENDED]}connectedCallback(){super.connectedCallback(),vh(this)}attributeChangedCallback(e,i,a){super.attributeChangedCallback(e,i,a),(e===u.MEDIA_PAUSED||e===u.MEDIA_LANG)&&vh(this)}get mediaPaused(){return W(this,u.MEDIA_PAUSED)}set mediaPaused(e){F(this,u.MEDIA_PAUSED,e)}handleClick(){const e=this.mediaPaused?I.MEDIA_PLAY_REQUEST:I.MEDIA_PAUSE_REQUEST;this.dispatchEvent(new f.CustomEvent(e,{composed:!0,bubbles:!0}))}}ku.getSlotTemplateHTML=T1;ku.getTooltipContentHTML=A1;f.customElements.get("media-play-button")||f.customElements.define("media-play-button",ku);const At={PLACEHOLDER_SRC:"placeholdersrc",SRC:"src"};function k1(t){return`
    <style>
      :host {
        pointer-events: none;
        display: var(--media-poster-image-display, inline-block);
        box-sizing: border-box;
      }

      img {
        max-width: 100%;
        max-height: 100%;
        min-width: 100%;
        min-height: 100%;
        background-repeat: no-repeat;
        background-position: var(--media-poster-image-background-position, var(--media-object-position, center));
        background-size: var(--media-poster-image-background-size, var(--media-object-fit, contain));
        object-fit: var(--media-object-fit, contain);
        object-position: var(--media-object-position, center);
      }
    </style>

    <img part="poster img" aria-hidden="true" id="image"/>
  `}const S1=t=>{t.style.removeProperty("background-image")},w1=(t,e)=>{t.style["background-image"]=`url('${e}')`};class Su extends f.HTMLElement{static get observedAttributes(){return[At.PLACEHOLDER_SRC,At.SRC]}constructor(){if(super(),!this.shadowRoot){this.attachShadow(this.constructor.shadowRootOptions);const e=Je(this.attributes);this.shadowRoot.innerHTML=this.constructor.getTemplateHTML(e)}this.image=this.shadowRoot.querySelector("#image")}attributeChangedCallback(e,i,a){e===At.SRC&&(a==null?this.image.removeAttribute(At.SRC):this.image.setAttribute(At.SRC,a)),e===At.PLACEHOLDER_SRC&&(a==null?S1(this.image):w1(this.image,a))}get placeholderSrc(){return ae(this,At.PLACEHOLDER_SRC)}set placeholderSrc(e){re(this,At.SRC,e)}get src(){return ae(this,At.SRC)}set src(e){re(this,At.SRC,e)}}Su.shadowRootOptions={mode:"open"};Su.getTemplateHTML=k1;f.customElements.get("media-poster-image")||f.customElements.define("media-poster-image",Su);var Zp=(t,e,i)=>{if(!e.has(t))throw TypeError("Cannot "+i)},I1=(t,e,i)=>(Zp(t,e,"read from private field"),i?i.call(t):e.get(t)),R1=(t,e,i)=>{if(e.has(t))throw TypeError("Cannot add the same private member more than once");e instanceof WeakSet?e.add(t):e.set(t,i)},C1=(t,e,i,a)=>(Zp(t,e,"write to private field"),e.set(t,i),i),_s;class L1 extends wi{constructor(){super(),R1(this,_s,void 0),C1(this,_s,this.shadowRoot.querySelector("slot"))}static get observedAttributes(){return[...super.observedAttributes,u.MEDIA_PREVIEW_CHAPTER,u.MEDIA_LANG]}attributeChangedCallback(e,i,a){if(super.attributeChangedCallback(e,i,a),(e===u.MEDIA_PREVIEW_CHAPTER||e===u.MEDIA_LANG)&&a!==i&&a!=null)if(I1(this,_s).textContent=a,a!==""){const r=L("chapter: {chapterName}",{chapterName:a});this.setAttribute("aria-valuetext",r)}else this.removeAttribute("aria-valuetext")}get mediaPreviewChapter(){return ae(this,u.MEDIA_PREVIEW_CHAPTER)}set mediaPreviewChapter(e){re(this,u.MEDIA_PREVIEW_CHAPTER,e)}}_s=new WeakMap;f.customElements.get("media-preview-chapter-display")||f.customElements.define("media-preview-chapter-display",L1);var jp=(t,e,i)=>{if(!e.has(t))throw TypeError("Cannot "+i)},Nn=(t,e,i)=>(jp(t,e,"read from private field"),i?i.call(t):e.get(t)),D1=(t,e,i)=>{if(e.has(t))throw TypeError("Cannot add the same private member more than once");e instanceof WeakSet?e.add(t):e.set(t,i)},Pn=(t,e,i,a)=>(jp(t,e,"write to private field"),e.set(t,i),i),Nt;function M1(t){return`
    <style>
      :host {
        box-sizing: border-box;
        display: var(--media-control-display, var(--media-preview-thumbnail-display, inline-block));
        overflow: hidden;
      }

      img {
        display: none;
        position: relative;
      }
    </style>
    <img crossorigin loading="eager" decoding="async">
  `}class Fo extends f.HTMLElement{constructor(){if(super(),D1(this,Nt,void 0),!this.shadowRoot){this.attachShadow(this.constructor.shadowRootOptions);const e=Je(this.attributes);this.shadowRoot.innerHTML=this.constructor.getTemplateHTML(e)}}static get observedAttributes(){return[Y.MEDIA_CONTROLLER,u.MEDIA_PREVIEW_IMAGE,u.MEDIA_PREVIEW_COORDS]}connectedCallback(){var e,i,a;const r=this.getAttribute(Y.MEDIA_CONTROLLER);r&&(Pn(this,Nt,(e=this.getRootNode())==null?void 0:e.getElementById(r)),(a=(i=Nn(this,Nt))==null?void 0:i.associateElement)==null||a.call(i,this))}disconnectedCallback(){var e,i;(i=(e=Nn(this,Nt))==null?void 0:e.unassociateElement)==null||i.call(e,this),Pn(this,Nt,null)}attributeChangedCallback(e,i,a){var r,n,s,o,l;[u.MEDIA_PREVIEW_IMAGE,u.MEDIA_PREVIEW_COORDS].includes(e)&&this.update(),e===Y.MEDIA_CONTROLLER&&(i&&((n=(r=Nn(this,Nt))==null?void 0:r.unassociateElement)==null||n.call(r,this),Pn(this,Nt,null)),a&&this.isConnected&&(Pn(this,Nt,(s=this.getRootNode())==null?void 0:s.getElementById(a)),(l=(o=Nn(this,Nt))==null?void 0:o.associateElement)==null||l.call(o,this)))}get mediaPreviewImage(){return ae(this,u.MEDIA_PREVIEW_IMAGE)}set mediaPreviewImage(e){re(this,u.MEDIA_PREVIEW_IMAGE,e)}get mediaPreviewCoords(){const e=this.getAttribute(u.MEDIA_PREVIEW_COORDS);if(e)return e.split(/\s+/).map(i=>+i)}set mediaPreviewCoords(e){if(!e){this.removeAttribute(u.MEDIA_PREVIEW_COORDS);return}this.setAttribute(u.MEDIA_PREVIEW_COORDS,e.join(" "))}update(){const e=this.mediaPreviewCoords,i=this.mediaPreviewImage;if(!(e&&i))return;const[a,r,n,s]=e,o=i.split("#")[0],l=getComputedStyle(this),{maxWidth:d,maxHeight:m,minWidth:p,minHeight:h}=l,c=Math.min(parseInt(d)/n,parseInt(m)/s),v=Math.max(parseInt(p)/n,parseInt(h)/s),E=c<1,g=E?c:v>1?v:1,{style:y}=Ae(this.shadowRoot,":host"),T=Ae(this.shadowRoot,"img").style,_=this.shadowRoot.querySelector("img"),S=E?"min":"max";y.setProperty(`${S}-width`,"initial","important"),y.setProperty(`${S}-height`,"initial","important"),y.width=`${n*g}px`,y.height=`${s*g}px`;const C=()=>{T.width=`${this.imgWidth*g}px`,T.height=`${this.imgHeight*g}px`,T.display="block"};_.src!==o&&(_.onload=()=>{this.imgWidth=_.naturalWidth,this.imgHeight=_.naturalHeight,C()},_.src=o,C()),C(),T.transform=`translate(-${a*g}px, -${r*g}px)`}}Nt=new WeakMap;Fo.shadowRootOptions={mode:"open"};Fo.getTemplateHTML=M1;f.customElements.get("media-preview-thumbnail")||f.customElements.define("media-preview-thumbnail",Fo);var fh=Fo,Xp=(t,e,i)=>{if(!e.has(t))throw TypeError("Cannot "+i)},Eh=(t,e,i)=>(Xp(t,e,"read from private field"),i?i.call(t):e.get(t)),x1=(t,e,i)=>{if(e.has(t))throw TypeError("Cannot add the same private member more than once");e instanceof WeakSet?e.add(t):e.set(t,i)},O1=(t,e,i,a)=>(Xp(t,e,"write to private field"),e.set(t,i),i),Pr;class N1 extends wi{constructor(){super(),x1(this,Pr,void 0),O1(this,Pr,this.shadowRoot.querySelector("slot")),Eh(this,Pr).textContent=ki(0)}static get observedAttributes(){return[...super.observedAttributes,u.MEDIA_PREVIEW_TIME]}attributeChangedCallback(e,i,a){super.attributeChangedCallback(e,i,a),e===u.MEDIA_PREVIEW_TIME&&a!=null&&(Eh(this,Pr).textContent=ki(parseFloat(a)))}get mediaPreviewTime(){return ie(this,u.MEDIA_PREVIEW_TIME)}set mediaPreviewTime(e){ue(this,u.MEDIA_PREVIEW_TIME,e)}}Pr=new WeakMap;f.customElements.get("media-preview-time-display")||f.customElements.define("media-preview-time-display",N1);const ua={SEEK_OFFSET:"seekoffset"},ll=30,P1=t=>`
  <svg aria-hidden="true" viewBox="0 0 20 24">
    <defs>
      <style>.text{font-size:8px;font-family:Arial-BoldMT, Arial;font-weight:700;}</style>
    </defs>
    <text class="text value" transform="translate(2.18 19.87)">${t}</text>
    <path d="M10 6V3L4.37 7 10 10.94V8a5.54 5.54 0 0 1 1.9 10.48v2.12A7.5 7.5 0 0 0 10 6Z"/>
  </svg>`;function U1(t,e){return`
    <slot name="icon">${P1(e.seekOffset)}</slot>
  `}function $1(){return L("Seek backward")}const H1=0;class wu extends Ce{static get observedAttributes(){return[...super.observedAttributes,u.MEDIA_CURRENT_TIME,ua.SEEK_OFFSET]}connectedCallback(){super.connectedCallback(),this.seekOffset=ie(this,ua.SEEK_OFFSET,ll)}attributeChangedCallback(e,i,a){super.attributeChangedCallback(e,i,a),e===ua.SEEK_OFFSET&&(this.seekOffset=ie(this,ua.SEEK_OFFSET,ll))}get seekOffset(){return ie(this,ua.SEEK_OFFSET,ll)}set seekOffset(e){ue(this,ua.SEEK_OFFSET,e),this.setAttribute("aria-label",L("seek back {seekOffset} seconds",{seekOffset:this.seekOffset})),rp(np(this,"icon"),this.seekOffset)}get mediaCurrentTime(){return ie(this,u.MEDIA_CURRENT_TIME,H1)}set mediaCurrentTime(e){ue(this,u.MEDIA_CURRENT_TIME,e)}handleClick(){const e=Math.max(this.mediaCurrentTime-this.seekOffset,0),i=new f.CustomEvent(I.MEDIA_SEEK_REQUEST,{composed:!0,bubbles:!0,detail:e});this.dispatchEvent(i)}}wu.getSlotTemplateHTML=U1;wu.getTooltipContentHTML=$1;f.customElements.get("media-seek-backward-button")||f.customElements.define("media-seek-backward-button",wu);const ca={SEEK_OFFSET:"seekoffset"},dl=30,B1=t=>`
  <svg aria-hidden="true" viewBox="0 0 20 24">
    <defs>
      <style>.text{font-size:8px;font-family:Arial-BoldMT, Arial;font-weight:700;}</style>
    </defs>
    <text class="text value" transform="translate(8.9 19.87)">${t}</text>
    <path d="M10 6V3l5.61 4L10 10.94V8a5.54 5.54 0 0 0-1.9 10.48v2.12A7.5 7.5 0 0 1 10 6Z"/>
  </svg>`;function W1(t,e){return`
    <slot name="icon">${B1(e.seekOffset)}</slot>
  `}function F1(){return L("Seek forward")}const K1=0;class Iu extends Ce{static get observedAttributes(){return[...super.observedAttributes,u.MEDIA_CURRENT_TIME,ca.SEEK_OFFSET]}connectedCallback(){super.connectedCallback(),this.seekOffset=ie(this,ca.SEEK_OFFSET,dl)}attributeChangedCallback(e,i,a){super.attributeChangedCallback(e,i,a),e===ca.SEEK_OFFSET&&(this.seekOffset=ie(this,ca.SEEK_OFFSET,dl))}get seekOffset(){return ie(this,ca.SEEK_OFFSET,dl)}set seekOffset(e){ue(this,ca.SEEK_OFFSET,e),this.setAttribute("aria-label",L("seek forward {seekOffset} seconds",{seekOffset:this.seekOffset})),rp(np(this,"icon"),this.seekOffset)}get mediaCurrentTime(){return ie(this,u.MEDIA_CURRENT_TIME,K1)}set mediaCurrentTime(e){ue(this,u.MEDIA_CURRENT_TIME,e)}handleClick(){const e=this.mediaCurrentTime+this.seekOffset,i=new f.CustomEvent(I.MEDIA_SEEK_REQUEST,{composed:!0,bubbles:!0,detail:e});this.dispatchEvent(i)}}Iu.getSlotTemplateHTML=W1;Iu.getTooltipContentHTML=F1;f.customElements.get("media-seek-forward-button")||f.customElements.define("media-seek-forward-button",Iu);var Jp=(t,e,i)=>{if(!e.has(t))throw TypeError("Cannot "+i)},ul=(t,e,i)=>(Jp(t,e,"read from private field"),i?i.call(t):e.get(t)),V1=(t,e,i)=>{if(e.has(t))throw TypeError("Cannot add the same private member more than once");e instanceof WeakSet?e.add(t):e.set(t,i)},q1=(t,e,i,a)=>(Jp(t,e,"write to private field"),e.set(t,i),i),Ta;const Oi={REMAINING:"remaining",SHOW_DURATION:"showduration",NO_TOGGLE:"notoggle"},_h=[...Object.values(Oi),u.MEDIA_CURRENT_TIME,u.MEDIA_DURATION,u.MEDIA_SEEKABLE],bh=["Enter"," "],Y1="&nbsp;/&nbsp;",ed=(t,{timesSep:e=Y1}={})=>{var i,a;const r=(i=t.mediaCurrentTime)!=null?i:0,[,n]=(a=t.mediaSeekable)!=null?a:[];let s=0;Number.isFinite(t.mediaDuration)?s=t.mediaDuration:Number.isFinite(n)&&(s=n);const o=t.remaining?ki(0-(s-r)):ki(r);return t.showDuration?`${o}${e}${ki(s)}`:o},G1="video not loaded, unknown time.",Q1=t=>{var e;const i=t.mediaCurrentTime,[,a]=(e=t.mediaSeekable)!=null?e:[];let r=null;if(Number.isFinite(t.mediaDuration)?r=t.mediaDuration:Number.isFinite(a)&&(r=a),i==null||r===null){t.setAttribute("aria-valuetext",G1);return}const n=t.remaining?Qr(0-(r-i)):Qr(i);if(!t.showDuration){t.setAttribute("aria-valuetext",n);return}const s=Qr(r),o=`${n} of ${s}`;t.setAttribute("aria-valuetext",o)};function z1(t,e){return`
    <slot>${ed(e)}</slot>
  `}class ev extends wi{constructor(){super(),V1(this,Ta,void 0),q1(this,Ta,this.shadowRoot.querySelector("slot")),ul(this,Ta).innerHTML=`${ed(this)}`}static get observedAttributes(){return[...super.observedAttributes,..._h,"disabled"]}connectedCallback(){const{style:e}=Ae(this.shadowRoot,":host(:hover:not([notoggle]))");e.setProperty("cursor","var(--media-cursor, pointer)"),e.setProperty("background","var(--media-control-hover-background, rgba(50 50 70 / .7))"),this.hasAttribute("disabled")||this.enable(),this.setAttribute("role","progressbar"),this.setAttribute("aria-label",L("playback time"));const i=a=>{const{key:r}=a;if(!bh.includes(r)){this.removeEventListener("keyup",i);return}this.toggleTimeDisplay()};this.addEventListener("keydown",a=>{const{metaKey:r,altKey:n,key:s}=a;if(r||n||!bh.includes(s)){this.removeEventListener("keyup",i);return}this.addEventListener("keyup",i)}),this.addEventListener("click",this.toggleTimeDisplay),super.connectedCallback()}toggleTimeDisplay(){this.noToggle||(this.hasAttribute("remaining")?this.removeAttribute("remaining"):this.setAttribute("remaining",""))}disconnectedCallback(){this.disable(),super.disconnectedCallback()}attributeChangedCallback(e,i,a){_h.includes(e)?this.update():e==="disabled"&&a!==i&&(a==null?this.enable():this.disable()),super.attributeChangedCallback(e,i,a)}enable(){this.tabIndex=0}disable(){this.tabIndex=-1}get remaining(){return W(this,Oi.REMAINING)}set remaining(e){F(this,Oi.REMAINING,e)}get showDuration(){return W(this,Oi.SHOW_DURATION)}set showDuration(e){F(this,Oi.SHOW_DURATION,e)}get noToggle(){return W(this,Oi.NO_TOGGLE)}set noToggle(e){F(this,Oi.NO_TOGGLE,e)}get mediaDuration(){return ie(this,u.MEDIA_DURATION)}set mediaDuration(e){ue(this,u.MEDIA_DURATION,e)}get mediaCurrentTime(){return ie(this,u.MEDIA_CURRENT_TIME)}set mediaCurrentTime(e){ue(this,u.MEDIA_CURRENT_TIME,e)}get mediaSeekable(){const e=this.getAttribute(u.MEDIA_SEEKABLE);if(e)return e.split(":").map(i=>+i)}set mediaSeekable(e){if(e==null){this.removeAttribute(u.MEDIA_SEEKABLE);return}this.setAttribute(u.MEDIA_SEEKABLE,e.join(":"))}update(){const e=ed(this);Q1(this),e!==ul(this,Ta).innerHTML&&(ul(this,Ta).innerHTML=e)}}Ta=new WeakMap;ev.getSlotTemplateHTML=z1;f.customElements.get("media-time-display")||f.customElements.define("media-time-display",ev);var tv=(t,e,i)=>{if(!e.has(t))throw TypeError("Cannot "+i)},we=(t,e,i)=>(tv(t,e,"read from private field"),e.get(t)),kt=(t,e,i)=>{if(e.has(t))throw TypeError("Cannot add the same private member more than once");e instanceof WeakSet?e.add(t):e.set(t,i)},Qe=(t,e,i,a)=>(tv(t,e,"write to private field"),e.set(t,i),i),Z1=(t,e,i,a)=>({set _(r){Qe(t,e,r)},get _(){return we(t,e)}}),Aa,bs,ka,Ur,gs,ys,Ts,Sa,Ni,As;class j1{constructor(e,i,a){kt(this,Aa,void 0),kt(this,bs,void 0),kt(this,ka,void 0),kt(this,Ur,void 0),kt(this,gs,void 0),kt(this,ys,void 0),kt(this,Ts,void 0),kt(this,Sa,void 0),kt(this,Ni,0),kt(this,As,(r=performance.now())=>{Qe(this,Ni,requestAnimationFrame(we(this,As))),Qe(this,Ur,performance.now()-we(this,ka));const n=1e3/this.fps;if(we(this,Ur)>n){Qe(this,ka,r-we(this,Ur)%n);const s=1e3/((r-we(this,bs))/++Z1(this,gs)._),o=(r-we(this,ys))/1e3/this.duration;let l=we(this,Ts)+o*this.playbackRate;l-we(this,Aa).valueAsNumber>0?Qe(this,Sa,this.playbackRate/this.duration/s):(Qe(this,Sa,.995*we(this,Sa)),l=we(this,Aa).valueAsNumber+we(this,Sa)),this.callback(l)}}),Qe(this,Aa,e),this.callback=i,this.fps=a}start(){we(this,Ni)===0&&(Qe(this,ka,performance.now()),Qe(this,bs,we(this,ka)),Qe(this,gs,0),we(this,As).call(this))}stop(){we(this,Ni)!==0&&(cancelAnimationFrame(we(this,Ni)),Qe(this,Ni,0))}update({start:e,duration:i,playbackRate:a}){const r=e-we(this,Aa).valueAsNumber,n=Math.abs(i-this.duration);(r>0||r<-.03||n>=.5)&&this.callback(e),Qe(this,Ts,e),Qe(this,ys,performance.now()),this.duration=i,this.playbackRate=a}}Aa=new WeakMap;bs=new WeakMap;ka=new WeakMap;Ur=new WeakMap;gs=new WeakMap;ys=new WeakMap;Ts=new WeakMap;Sa=new WeakMap;Ni=new WeakMap;As=new WeakMap;var Ru=(t,e,i)=>{if(!e.has(t))throw TypeError("Cannot "+i)},ce=(t,e,i)=>(Ru(t,e,"read from private field"),i?i.call(t):e.get(t)),ye=(t,e,i)=>{if(e.has(t))throw TypeError("Cannot add the same private member more than once");e instanceof WeakSet?e.add(t):e.set(t,i)},at=(t,e,i,a)=>(Ru(t,e,"write to private field"),e.set(t,i),i),Ne=(t,e,i)=>(Ru(t,e,"access private method"),i),wa,Xi,co,jr,ho,ks,hn,mn,Ia,Ra,Ca,$r,Cu,iv,td,mo,Lu,po,Du,vo,Mu,id,av,pn,fo,ad,rv;const X1="video not loaded, unknown time.",J1=t=>{const e=t.range,i=Qr(+nv(t)),a=Qr(+t.mediaSeekableEnd),r=i&&a?`${i} of ${a}`:X1;e.setAttribute("aria-valuetext",r)};function ey(t){return`
    <style>
      :host {
        --media-box-border-radius: 4px;
        --media-box-padding-left: 10px;
        --media-box-padding-right: 10px;
        --media-preview-border-radius: var(--media-box-border-radius);
        --media-box-arrow-offset: var(--media-box-border-radius);
        --_control-background: var(--media-control-background, var(--media-secondary-color, rgb(20 20 30 / .7)));
        --_preview-background: var(--media-preview-background, var(--_control-background));

        
        contain: layout;
      }

      #buffered {
        background: var(--media-time-range-buffered-color, rgb(255 255 255 / .4));
        position: absolute;
        height: 100%;
        will-change: width;
      }

      #preview-rail,
      #current-rail {
        width: 100%;
        position: absolute;
        left: 0;
        bottom: 100%;
        pointer-events: none;
        will-change: transform;
      }

      [part~="box"] {
        width: min-content;
        
        position: absolute;
        bottom: 100%;
        flex-direction: column;
        align-items: center;
        transform: translateX(-50%);
      }

      [part~="current-box"] {
        display: var(--media-current-box-display, var(--media-box-display, flex));
        margin: var(--media-current-box-margin, var(--media-box-margin, 0 0 5px));
        visibility: hidden;
      }

      [part~="preview-box"] {
        display: var(--media-preview-box-display, var(--media-box-display, flex));
        margin: var(--media-preview-box-margin, var(--media-box-margin, 0 0 5px));
        transition-property: var(--media-preview-transition-property, visibility, opacity);
        transition-duration: var(--media-preview-transition-duration-out, .25s);
        transition-delay: var(--media-preview-transition-delay-out, 0s);
        visibility: hidden;
        opacity: 0;
      }

      :host(:is([${u.MEDIA_PREVIEW_IMAGE}], [${u.MEDIA_PREVIEW_TIME}])[dragging]) [part~="preview-box"] {
        transition-duration: var(--media-preview-transition-duration-in, .5s);
        transition-delay: var(--media-preview-transition-delay-in, .25s);
        visibility: visible;
        opacity: 1;
      }

      @media (hover: hover) {
        :host(:is([${u.MEDIA_PREVIEW_IMAGE}], [${u.MEDIA_PREVIEW_TIME}]):hover) [part~="preview-box"] {
          transition-duration: var(--media-preview-transition-duration-in, .5s);
          transition-delay: var(--media-preview-transition-delay-in, .25s);
          visibility: visible;
          opacity: 1;
        }
      }

      media-preview-thumbnail,
      ::slotted(media-preview-thumbnail) {
        visibility: hidden;
        
        transition: visibility 0s .25s;
        transition-delay: calc(var(--media-preview-transition-delay-out, 0s) + var(--media-preview-transition-duration-out, .25s));
        background: var(--media-preview-thumbnail-background, var(--_preview-background));
        box-shadow: var(--media-preview-thumbnail-box-shadow, 0 0 4px rgb(0 0 0 / .2));
        max-width: var(--media-preview-thumbnail-max-width, 180px);
        max-height: var(--media-preview-thumbnail-max-height, 160px);
        min-width: var(--media-preview-thumbnail-min-width, 120px);
        min-height: var(--media-preview-thumbnail-min-height, 80px);
        border: var(--media-preview-thumbnail-border);
        border-radius: var(--media-preview-thumbnail-border-radius,
          var(--media-preview-border-radius) var(--media-preview-border-radius) 0 0);
      }

      :host([${u.MEDIA_PREVIEW_IMAGE}][dragging]) media-preview-thumbnail,
      :host([${u.MEDIA_PREVIEW_IMAGE}][dragging]) ::slotted(media-preview-thumbnail) {
        transition-delay: var(--media-preview-transition-delay-in, .25s);
        visibility: visible;
      }

      @media (hover: hover) {
        :host([${u.MEDIA_PREVIEW_IMAGE}]:hover) media-preview-thumbnail,
        :host([${u.MEDIA_PREVIEW_IMAGE}]:hover) ::slotted(media-preview-thumbnail) {
          transition-delay: var(--media-preview-transition-delay-in, .25s);
          visibility: visible;
        }

        :host([${u.MEDIA_PREVIEW_TIME}]:hover) {
          --media-time-range-hover-display: block;
        }
      }

      media-preview-chapter-display,
      ::slotted(media-preview-chapter-display) {
        font-size: var(--media-font-size, 13px);
        line-height: 17px;
        min-width: 0;
        visibility: hidden;
        
        transition: min-width 0s, border-radius 0s, margin 0s, padding 0s, visibility 0s;
        transition-delay: calc(var(--media-preview-transition-delay-out, 0s) + var(--media-preview-transition-duration-out, .25s));
        background: var(--media-preview-chapter-background, var(--_preview-background));
        border-radius: var(--media-preview-chapter-border-radius,
          var(--media-preview-border-radius) var(--media-preview-border-radius)
          var(--media-preview-border-radius) var(--media-preview-border-radius));
        padding: var(--media-preview-chapter-padding, 3.5px 9px);
        margin: var(--media-preview-chapter-margin, 0 0 5px);
        text-shadow: var(--media-preview-chapter-text-shadow, 0 0 4px rgb(0 0 0 / .75));
      }

      :host([${u.MEDIA_PREVIEW_IMAGE}]) media-preview-chapter-display,
      :host([${u.MEDIA_PREVIEW_IMAGE}]) ::slotted(media-preview-chapter-display) {
        transition-delay: var(--media-preview-transition-delay-in, .25s);
        border-radius: var(--media-preview-chapter-border-radius, 0);
        padding: var(--media-preview-chapter-padding, 3.5px 9px 0);
        margin: var(--media-preview-chapter-margin, 0);
        min-width: 100%;
      }

      media-preview-chapter-display[${u.MEDIA_PREVIEW_CHAPTER}],
      ::slotted(media-preview-chapter-display[${u.MEDIA_PREVIEW_CHAPTER}]) {
        visibility: visible;
      }

      media-preview-chapter-display:not([aria-valuetext]),
      ::slotted(media-preview-chapter-display:not([aria-valuetext])) {
        display: none;
      }

      media-preview-time-display,
      ::slotted(media-preview-time-display),
      media-time-display,
      ::slotted(media-time-display) {
        font-size: var(--media-font-size, 13px);
        line-height: 17px;
        min-width: 0;
        
        transition: min-width 0s, border-radius 0s;
        transition-delay: calc(var(--media-preview-transition-delay-out, 0s) + var(--media-preview-transition-duration-out, .25s));
        background: var(--media-preview-time-background, var(--_preview-background));
        border-radius: var(--media-preview-time-border-radius,
          var(--media-preview-border-radius) var(--media-preview-border-radius)
          var(--media-preview-border-radius) var(--media-preview-border-radius));
        padding: var(--media-preview-time-padding, 3.5px 9px);
        margin: var(--media-preview-time-margin, 0);
        text-shadow: var(--media-preview-time-text-shadow, 0 0 4px rgb(0 0 0 / .75));
        transform: translateX(min(
          max(calc(50% - var(--_box-width) / 2),
          calc(var(--_box-shift, 0))),
          calc(var(--_box-width) / 2 - 50%)
        ));
      }

      :host([${u.MEDIA_PREVIEW_IMAGE}]) media-preview-time-display,
      :host([${u.MEDIA_PREVIEW_IMAGE}]) ::slotted(media-preview-time-display) {
        transition-delay: var(--media-preview-transition-delay-in, .25s);
        border-radius: var(--media-preview-time-border-radius,
          0 0 var(--media-preview-border-radius) var(--media-preview-border-radius));
        min-width: 100%;
      }

      :host([${u.MEDIA_PREVIEW_TIME}]:hover) {
        --media-time-range-hover-display: block;
      }

      [part~="arrow"],
      ::slotted([part~="arrow"]) {
        display: var(--media-box-arrow-display, inline-block);
        transform: translateX(min(
          max(calc(50% - var(--_box-width) / 2 + var(--media-box-arrow-offset)),
          calc(var(--_box-shift, 0))),
          calc(var(--_box-width) / 2 - 50% - var(--media-box-arrow-offset))
        ));
        
        border-color: transparent;
        border-top-color: var(--media-box-arrow-background, var(--_control-background));
        border-width: var(--media-box-arrow-border-width,
          var(--media-box-arrow-height, 5px) var(--media-box-arrow-width, 6px) 0);
        border-style: solid;
        justify-content: center;
        height: 0;
      }
    </style>
    <div id="preview-rail">
      <slot name="preview" part="box preview-box">
        <media-preview-thumbnail>
          <template shadowrootmode="${fh.shadowRootOptions.mode}">
            ${fh.getTemplateHTML({})}
          </template>
        </media-preview-thumbnail>
        <media-preview-chapter-display></media-preview-chapter-display>
        <media-preview-time-display></media-preview-time-display>
        <slot name="preview-arrow"><div part="arrow"></div></slot>
      </slot>
    </div>
    <div id="current-rail">
      <slot name="current" part="box current-box">
        
      </slot>
    </div>
  `}const Un=(t,e=t.mediaCurrentTime)=>{const i=Number.isFinite(t.mediaSeekableStart)?t.mediaSeekableStart:0,a=Number.isFinite(t.mediaDuration)?t.mediaDuration:t.mediaSeekableEnd;if(Number.isNaN(a))return 0;const r=(e-i)/(a-i);return Math.max(0,Math.min(r,1))},nv=(t,e=t.range.valueAsNumber)=>{const i=Number.isFinite(t.mediaSeekableStart)?t.mediaSeekableStart:0,a=Number.isFinite(t.mediaDuration)?t.mediaDuration:t.mediaSeekableEnd;return Number.isNaN(a)?0:e*(a-i)+i};class xu extends sr{constructor(){super(),ye(this,Ca),ye(this,Cu),ye(this,mo),ye(this,po),ye(this,vo),ye(this,id),ye(this,pn),ye(this,ad),ye(this,wa,void 0),ye(this,Xi,void 0),ye(this,co,void 0),ye(this,jr,void 0),ye(this,ho,void 0),ye(this,ks,void 0),ye(this,hn,void 0),ye(this,mn,void 0),ye(this,Ia,void 0),ye(this,Ra,void 0),ye(this,td,a=>{this.dragging||(Jd(a)&&(this.range.valueAsNumber=a),ce(this,Ra)||this.updateBar())}),this.shadowRoot.querySelector("#track").insertAdjacentHTML("afterbegin",'<div id="buffered" part="buffered"></div>'),at(this,co,this.shadowRoot.querySelectorAll('[part~="box"]')),at(this,ho,this.shadowRoot.querySelector('[part~="preview-box"]')),at(this,ks,this.shadowRoot.querySelector('[part~="current-box"]'));const i=getComputedStyle(this);at(this,hn,parseInt(i.getPropertyValue("--media-box-padding-left"))),at(this,mn,parseInt(i.getPropertyValue("--media-box-padding-right"))),at(this,Xi,new j1(this.range,ce(this,td),60))}static get observedAttributes(){return[...super.observedAttributes,u.MEDIA_PAUSED,u.MEDIA_DURATION,u.MEDIA_SEEKABLE,u.MEDIA_CURRENT_TIME,u.MEDIA_PREVIEW_IMAGE,u.MEDIA_PREVIEW_TIME,u.MEDIA_PREVIEW_CHAPTER,u.MEDIA_BUFFERED,u.MEDIA_PLAYBACK_RATE,u.MEDIA_LOADING,u.MEDIA_ENDED]}connectedCallback(){var e;super.connectedCallback(),this.range.setAttribute("aria-label",L("seek")),Ne(this,Ca,$r).call(this),at(this,wa,this.getRootNode()),(e=ce(this,wa))==null||e.addEventListener("transitionstart",this)}disconnectedCallback(){var e;super.disconnectedCallback(),Ne(this,Ca,$r).call(this),(e=ce(this,wa))==null||e.removeEventListener("transitionstart",this),at(this,wa,null)}attributeChangedCallback(e,i,a){super.attributeChangedCallback(e,i,a),i!=a&&(e===u.MEDIA_CURRENT_TIME||e===u.MEDIA_PAUSED||e===u.MEDIA_ENDED||e===u.MEDIA_LOADING||e===u.MEDIA_DURATION||e===u.MEDIA_SEEKABLE?(ce(this,Xi).update({start:Un(this),duration:this.mediaSeekableEnd-this.mediaSeekableStart,playbackRate:this.mediaPlaybackRate}),Ne(this,Ca,$r).call(this),J1(this)):e===u.MEDIA_BUFFERED&&this.updateBufferedBar(),(e===u.MEDIA_DURATION||e===u.MEDIA_SEEKABLE)&&(this.mediaChaptersCues=ce(this,Ia),this.updateBar()))}get mediaChaptersCues(){return ce(this,Ia)}set mediaChaptersCues(e){var i;at(this,Ia,e),this.updateSegments((i=ce(this,Ia))==null?void 0:i.map(a=>({start:Un(this,a.startTime),end:Un(this,a.endTime)})))}get mediaPaused(){return W(this,u.MEDIA_PAUSED)}set mediaPaused(e){F(this,u.MEDIA_PAUSED,e)}get mediaLoading(){return W(this,u.MEDIA_LOADING)}set mediaLoading(e){F(this,u.MEDIA_LOADING,e)}get mediaDuration(){return ie(this,u.MEDIA_DURATION)}set mediaDuration(e){ue(this,u.MEDIA_DURATION,e)}get mediaCurrentTime(){return ie(this,u.MEDIA_CURRENT_TIME)}set mediaCurrentTime(e){ue(this,u.MEDIA_CURRENT_TIME,e)}get mediaPlaybackRate(){return ie(this,u.MEDIA_PLAYBACK_RATE,1)}set mediaPlaybackRate(e){ue(this,u.MEDIA_PLAYBACK_RATE,e)}get mediaBuffered(){const e=this.getAttribute(u.MEDIA_BUFFERED);return e?e.split(" ").map(i=>i.split(":").map(a=>+a)):[]}set mediaBuffered(e){if(!e){this.removeAttribute(u.MEDIA_BUFFERED);return}const i=e.map(a=>a.join(":")).join(" ");this.setAttribute(u.MEDIA_BUFFERED,i)}get mediaSeekable(){const e=this.getAttribute(u.MEDIA_SEEKABLE);if(e)return e.split(":").map(i=>+i)}set mediaSeekable(e){if(e==null){this.removeAttribute(u.MEDIA_SEEKABLE);return}this.setAttribute(u.MEDIA_SEEKABLE,e.join(":"))}get mediaSeekableEnd(){var e;const[,i=this.mediaDuration]=(e=this.mediaSeekable)!=null?e:[];return i}get mediaSeekableStart(){var e;const[i=0]=(e=this.mediaSeekable)!=null?e:[];return i}get mediaPreviewImage(){return ae(this,u.MEDIA_PREVIEW_IMAGE)}set mediaPreviewImage(e){re(this,u.MEDIA_PREVIEW_IMAGE,e)}get mediaPreviewTime(){return ie(this,u.MEDIA_PREVIEW_TIME)}set mediaPreviewTime(e){ue(this,u.MEDIA_PREVIEW_TIME,e)}get mediaEnded(){return W(this,u.MEDIA_ENDED)}set mediaEnded(e){F(this,u.MEDIA_ENDED,e)}updateBar(){super.updateBar(),this.updateBufferedBar(),this.updateCurrentBox()}updateBufferedBar(){var e;const i=this.mediaBuffered;if(!i.length)return;let a;if(this.mediaEnded)a=1;else{const n=this.mediaCurrentTime,[,s=this.mediaSeekableStart]=(e=i.find(([o,l])=>o<=n&&n<=l))!=null?e:[];a=Un(this,s)}const{style:r}=Ae(this.shadowRoot,"#buffered");r.setProperty("width",`${a*100}%`)}updateCurrentBox(){if(!this.shadowRoot.querySelector('slot[name="current"]').assignedElements().length)return;const i=Ae(this.shadowRoot,"#current-rail"),a=Ae(this.shadowRoot,'[part~="current-box"]'),r=Ne(this,mo,Lu).call(this,ce(this,ks)),n=Ne(this,po,Du).call(this,r,this.range.valueAsNumber),s=Ne(this,vo,Mu).call(this,r,this.range.valueAsNumber);i.style.transform=`translateX(${n})`,i.style.setProperty("--_range-width",`${r.range.width}`),a.style.setProperty("--_box-shift",`${s}`),a.style.setProperty("--_box-width",`${r.box.width}px`),a.style.setProperty("visibility","initial")}handleEvent(e){switch(super.handleEvent(e),e.type){case"input":Ne(this,ad,rv).call(this);break;case"pointermove":Ne(this,id,av).call(this,e);break;case"pointerup":ce(this,Ra)&&at(this,Ra,!1);break;case"pointerdown":at(this,Ra,!0);break;case"pointerleave":Ne(this,pn,fo).call(this,null);break;case"transitionstart":si(e.target,this)&&setTimeout(()=>Ne(this,Ca,$r).call(this),0);break}}}wa=new WeakMap;Xi=new WeakMap;co=new WeakMap;jr=new WeakMap;ho=new WeakMap;ks=new WeakMap;hn=new WeakMap;mn=new WeakMap;Ia=new WeakMap;Ra=new WeakMap;Ca=new WeakSet;$r=function(){Ne(this,Cu,iv).call(this)?ce(this,Xi).start():ce(this,Xi).stop()};Cu=new WeakSet;iv=function(){return this.isConnected&&!this.mediaPaused&&!this.mediaLoading&&!this.mediaEnded&&this.mediaSeekableEnd>0&&sp(this)};td=new WeakMap;mo=new WeakSet;Lu=function(t){var e;const a=((e=this.getAttribute("bounds")?rr(this,`#${this.getAttribute("bounds")}`):this.parentElement)!=null?e:this).getBoundingClientRect(),r=this.range.getBoundingClientRect(),n=t.offsetWidth,s=-(r.left-a.left-n/2),o=a.right-r.left-n/2;return{box:{width:n,min:s,max:o},bounds:a,range:r}};po=new WeakSet;Du=function(t,e){let i=`${e*100}%`;const{width:a,min:r,max:n}=t.box;if(!a)return i;if(Number.isNaN(r)||(i=`max(${`calc(1 / var(--_range-width) * 100 * ${r}% + var(--media-box-padding-left))`}, ${i})`),!Number.isNaN(n)){const o=`calc(1 / var(--_range-width) * 100 * ${n}% - var(--media-box-padding-right))`;i=`min(${i}, ${o})`}return i};vo=new WeakSet;Mu=function(t,e){const{width:i,min:a,max:r}=t.box,n=e*t.range.width;if(n<a+ce(this,hn)){const s=t.range.left-t.bounds.left-ce(this,hn);return`${n-i/2+s}px`}if(n>r-ce(this,mn)){const s=t.bounds.right-t.range.right-ce(this,mn);return`${n+i/2-s-t.range.width}px`}return 0};id=new WeakSet;av=function(t){const e=[...ce(this,co)].some(m=>t.composedPath().includes(m));if(!this.dragging&&(e||!t.composedPath().includes(this))){Ne(this,pn,fo).call(this,null);return}const i=this.mediaSeekableEnd;if(!i)return;const a=Ae(this.shadowRoot,"#preview-rail"),r=Ae(this.shadowRoot,'[part~="preview-box"]'),n=Ne(this,mo,Lu).call(this,ce(this,ho));let s=(t.clientX-n.range.left)/n.range.width;s=Math.max(0,Math.min(1,s));const o=Ne(this,po,Du).call(this,n,s),l=Ne(this,vo,Mu).call(this,n,s);a.style.transform=`translateX(${o})`,a.style.setProperty("--_range-width",`${n.range.width}`),r.style.setProperty("--_box-shift",`${l}`),r.style.setProperty("--_box-width",`${n.box.width}px`);const d=Math.round(ce(this,jr))-Math.round(s*i);Math.abs(d)<1&&s>.01&&s<.99||(at(this,jr,s*i),Ne(this,pn,fo).call(this,ce(this,jr)))};pn=new WeakSet;fo=function(t){this.dispatchEvent(new f.CustomEvent(I.MEDIA_PREVIEW_REQUEST,{composed:!0,bubbles:!0,detail:t}))};ad=new WeakSet;rv=function(){ce(this,Xi).stop();const t=nv(this);this.dispatchEvent(new f.CustomEvent(I.MEDIA_SEEK_REQUEST,{composed:!0,bubbles:!0,detail:t}))};xu.shadowRootOptions={mode:"open"};xu.getContainerTemplateHTML=ey;f.customElements.get("media-time-range")||f.customElements.define("media-time-range",xu);const ty=1,iy=t=>t.mediaMuted?0:t.mediaVolume,ay=t=>`${Math.round(t*100)}%`;class ry extends sr{static get observedAttributes(){return[...super.observedAttributes,u.MEDIA_VOLUME,u.MEDIA_MUTED,u.MEDIA_VOLUME_UNAVAILABLE]}constructor(){super(),this.range.addEventListener("input",()=>{const e=this.range.value,i=new f.CustomEvent(I.MEDIA_VOLUME_REQUEST,{composed:!0,bubbles:!0,detail:e});this.dispatchEvent(i)})}connectedCallback(){super.connectedCallback(),this.range.setAttribute("aria-label",L("volume"))}attributeChangedCallback(e,i,a){super.attributeChangedCallback(e,i,a),(e===u.MEDIA_VOLUME||e===u.MEDIA_MUTED)&&(this.range.valueAsNumber=iy(this),this.range.setAttribute("aria-valuetext",ay(this.range.valueAsNumber)),this.updateBar())}get mediaVolume(){return ie(this,u.MEDIA_VOLUME,ty)}set mediaVolume(e){ue(this,u.MEDIA_VOLUME,e)}get mediaMuted(){return W(this,u.MEDIA_MUTED)}set mediaMuted(e){F(this,u.MEDIA_MUTED,e)}get mediaVolumeUnavailable(){return ae(this,u.MEDIA_VOLUME_UNAVAILABLE)}set mediaVolumeUnavailable(e){re(this,u.MEDIA_VOLUME_UNAVAILABLE,e)}}f.customElements.get("media-volume-range")||f.customElements.define("media-volume-range",ry);function ny(t){return`
      <style>
        :host {
          min-width: 4ch;
          padding: var(--media-button-padding, var(--media-control-padding, 10px 5px));
          width: 100%;
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 1rem;
          font-weight: var(--media-button-font-weight, normal);
        }

        #checked-indicator {
          display: none;
        }

        :host([${u.MEDIA_LOOP}]) #checked-indicator {
          display: block;
        }
      </style>
      
      <span id="icon">
     </span>

      <div id="checked-indicator">
        <svg aria-hidden="true" viewBox="0 1 24 24" part="checked-indicator indicator">
          <path d="m10 15.17 9.193-9.191 1.414 1.414-10.606 10.606-6.364-6.364 1.414-1.414 4.95 4.95Z"/>
        </svg>
      </div>
    `}function sy(){return L("Loop")}class Ou extends Ce{constructor(){super(...arguments),this.container=null}static get observedAttributes(){return[...super.observedAttributes,u.MEDIA_LOOP]}connectedCallback(){var e;super.connectedCallback(),this.container=((e=this.shadowRoot)==null?void 0:e.querySelector("#icon"))||null,this.container&&(this.container.textContent=L("Loop"))}attributeChangedCallback(e,i,a){super.attributeChangedCallback(e,i,a),e===u.MEDIA_LOOP&&this.container&&this.setAttribute("aria-checked",this.mediaLoop?"true":"false")}get mediaLoop(){return W(this,u.MEDIA_LOOP)}set mediaLoop(e){F(this,u.MEDIA_LOOP,e)}handleClick(){const e=!this.mediaLoop,i=new f.CustomEvent(I.MEDIA_LOOP_REQUEST,{composed:!0,bubbles:!0,detail:e});this.dispatchEvent(i)}}Ou.getSlotTemplateHTML=ny;Ou.getTooltipContentHTML=sy;f.customElements.get("media-loop-button")||f.customElements.define("media-loop-button",Ou);var sv=(t,e,i)=>{if(!e.has(t))throw TypeError("Cannot "+i)},H=(t,e,i)=>(sv(t,e,"read from private field"),i?i.call(t):e.get(t)),Bt=(t,e,i)=>{if(e.has(t))throw TypeError("Cannot add the same private member more than once");e instanceof WeakSet?e.add(t):e.set(t,i)},ei=(t,e,i,a)=>(sv(t,e,"write to private field"),e.set(t,i),i),La,Ss,Pi,Hr,vi,fi,Ei,Ui,Da,ws,pt;const gh=1,yh=0,oy=1,ly={processCallback(t,e,i){if(i){for(const[a,r]of e)if(a in i){const n=i[a];typeof n=="boolean"&&r instanceof gt&&typeof r.element[r.attributeName]=="boolean"?r.booleanValue=n:typeof n=="function"&&r instanceof gt?r.element[r.attributeName]=n:r.value=n}}}};class Ko extends f.DocumentFragment{constructor(e,i,a=ly){var r;super(),Bt(this,La,void 0),Bt(this,Ss,void 0),this.append(e.content.cloneNode(!0)),ei(this,La,ov(this)),ei(this,Ss,a),(r=a.createCallback)==null||r.call(a,this,H(this,La),i),a.processCallback(this,H(this,La),i)}update(e){H(this,Ss).processCallback(this,H(this,La),e)}}La=new WeakMap;Ss=new WeakMap;const ov=(t,e=[])=>{let i,a;for(const r of t.attributes||[])if(r.value.includes("{{")){const n=new uy;for([i,a]of Ah(r.value))if(!i)n.append(a);else{const s=new gt(t,r.name,r.namespaceURI);n.append(s),e.push([a,s])}r.value=n.toString()}for(const r of t.childNodes)if(r.nodeType===gh&&!(r instanceof HTMLTemplateElement))ov(r,e);else{const n=r.data;if(r.nodeType===gh||n.includes("{{")){const s=[];if(n)for([i,a]of Ah(n))if(!i)s.push(new Text(a));else{const o=new or(t);s.push(o),e.push([a,o])}else if(r instanceof HTMLTemplateElement){const o=new uv(t,r);s.push(o),e.push([o.expression,o])}r.replaceWith(...s.flatMap(o=>o.replacementNodes||[o]))}}return e},Th={},Ah=t=>{let e="",i=0,a=Th[t],r=0,n;if(a)return a;for(a=[];n=t[r];r++)n==="{"&&t[r+1]==="{"&&t[r-1]!=="\\"&&t[r+2]&&++i==1?(e&&a.push([yh,e]),e="",r++):n==="}"&&t[r+1]==="}"&&t[r-1]!=="\\"&&!--i?(a.push([oy,e.trim()]),e="",r++):e+=n||"";return e&&a.push([yh,(i>0?"{{":"")+e]),Th[t]=a},dy=11;class lv{get value(){return""}set value(e){}toString(){return this.value}}const dv=new WeakMap;class uy{constructor(){Bt(this,Pi,[])}[Symbol.iterator](){return H(this,Pi).values()}get length(){return H(this,Pi).length}item(e){return H(this,Pi)[e]}append(...e){for(const i of e)i instanceof gt&&dv.set(i,this),H(this,Pi).push(i)}toString(){return H(this,Pi).join("")}}Pi=new WeakMap;class gt extends lv{constructor(e,i,a){super(),Bt(this,Ui),Bt(this,Hr,""),Bt(this,vi,void 0),Bt(this,fi,void 0),Bt(this,Ei,void 0),ei(this,vi,e),ei(this,fi,i),ei(this,Ei,a)}get attributeName(){return H(this,fi)}get attributeNamespace(){return H(this,Ei)}get element(){return H(this,vi)}get value(){return H(this,Hr)}set value(e){H(this,Hr)!==e&&(ei(this,Hr,e),!H(this,Ui,Da)||H(this,Ui,Da).length===1?e==null?H(this,vi).removeAttributeNS(H(this,Ei),H(this,fi)):H(this,vi).setAttributeNS(H(this,Ei),H(this,fi),e):H(this,vi).setAttributeNS(H(this,Ei),H(this,fi),H(this,Ui,Da).toString()))}get booleanValue(){return H(this,vi).hasAttributeNS(H(this,Ei),H(this,fi))}set booleanValue(e){if(!H(this,Ui,Da)||H(this,Ui,Da).length===1)this.value=e?"":null;else throw new DOMException("Value is not fully templatized")}}Hr=new WeakMap;vi=new WeakMap;fi=new WeakMap;Ei=new WeakMap;Ui=new WeakSet;Da=function(){return dv.get(this)};class or extends lv{constructor(e,i){super(),Bt(this,ws,void 0),Bt(this,pt,void 0),ei(this,ws,e),ei(this,pt,i?[...i]:[new Text])}get replacementNodes(){return H(this,pt)}get parentNode(){return H(this,ws)}get nextSibling(){return H(this,pt)[H(this,pt).length-1].nextSibling}get previousSibling(){return H(this,pt)[0].previousSibling}get value(){return H(this,pt).map(e=>e.textContent).join("")}set value(e){this.replace(e)}replace(...e){const i=e.flat().flatMap(a=>a==null?[new Text]:a.forEach?[...a]:a.nodeType===dy?[...a.childNodes]:a.nodeType?[a]:[new Text(a)]);i.length||i.push(new Text),ei(this,pt,cy(H(this,pt)[0].parentNode,H(this,pt),i,this.nextSibling))}}ws=new WeakMap;pt=new WeakMap;class uv extends or{constructor(e,i){const a=i.getAttribute("directive")||i.getAttribute("type");let r=i.getAttribute("expression")||i.getAttribute(a)||"";r.startsWith("{{")&&(r=r.trim().slice(2,-2).trim()),super(e),this.expression=r,this.template=i,this.directive=a}}function cy(t,e,i,a=null){let r=0,n,s,o,l=i.length,d=e.length;for(;r<l&&r<d&&e[r]==i[r];)r++;for(;r<l&&r<d&&i[l-1]==e[d-1];)a=i[--d,--l];if(r==d)for(;r<l;)t.insertBefore(i[r++],a);if(r==l)for(;r<d;)t.removeChild(e[r++]);else{for(n=e[r];r<l;)o=i[r++],s=n?n.nextSibling:a,n==o?n=s:r<l&&i[r]==s?(t.replaceChild(o,n),n=s):t.insertBefore(o,n);for(;n!=a;)s=n.nextSibling,t.removeChild(n),n=s}return i}const kh={string:t=>String(t)};class cv{constructor(e){this.template=e,this.state=void 0}}const Yi=new WeakMap,Gi=new WeakMap,rd={partial:(t,e)=>{e[t.expression]=new cv(t.template)},if:(t,e)=>{var i;if(hv(t.expression,e))if(Yi.get(t)!==t.template){Yi.set(t,t.template);const a=new Ko(t.template,e,Nu);t.replace(a),Gi.set(t,a)}else(i=Gi.get(t))==null||i.update(e);else t.replace(""),Yi.delete(t),Gi.delete(t)}},hy=Object.keys(rd),Nu={processCallback(t,e,i){var a,r;if(i)for(const[n,s]of e){if(s instanceof uv){if(!s.directive){const l=hy.find(d=>s.template.hasAttribute(d));l&&(s.directive=l,s.expression=s.template.getAttribute(l))}(a=rd[s.directive])==null||a.call(rd,s,i);continue}let o=hv(n,i);if(o instanceof cv){Yi.get(s)!==o.template?(Yi.set(s,o.template),o=new Ko(o.template,o.state,Nu),s.value=o,Gi.set(s,o)):(r=Gi.get(s))==null||r.update(o.state);continue}o?(s instanceof gt&&s.attributeName.startsWith("aria-")&&(o=String(o)),s instanceof gt?typeof o=="boolean"?s.booleanValue=o:typeof o=="function"?s.element[s.attributeName]=o:s.value=o:(s.value=o,Yi.delete(s),Gi.delete(s))):s instanceof gt?s.value=void 0:(s.value=void 0,Yi.delete(s),Gi.delete(s))}}},Sh={"!":t=>!t,"!!":t=>!!t,"==":(t,e)=>t==e,"!=":(t,e)=>t!=e,">":(t,e)=>t>e,">=":(t,e)=>t>=e,"<":(t,e)=>t<e,"<=":(t,e)=>t<=e,"??":(t,e)=>t??e,"|":(t,e)=>{var i;return(i=kh[e])==null?void 0:i.call(kh,t)}};function my(t){return py(t,{boolean:/true|false/,number:/-?\d+\.?\d*/,string:/(["'])((?:\\.|[^\\])*?)\1/,operator:/[!=><][=!]?|\?\?|\|/,ws:/\s+/,param:/[$a-z_][$\w]*/i}).filter(({type:e})=>e!=="ws")}function hv(t,e={}){var i,a,r,n,s,o,l;const d=my(t);if(d.length===0||d.some(({type:m})=>!m))return fr(t);if(((i=d[0])==null?void 0:i.token)===">"){const m=e[(a=d[1])==null?void 0:a.token];if(!m)return fr(t);const p={...e};m.state=p;const h=d.slice(2);for(let c=0;c<h.length;c+=3){const v=(r=h[c])==null?void 0:r.token,E=(n=h[c+1])==null?void 0:n.token,g=(s=h[c+2])==null?void 0:s.token;v&&E==="="&&(p[v]=Er(g,e))}return m}if(d.length===1)return $n(d[0])?Er(d[0].token,e):fr(t);if(d.length===2){const m=(o=d[0])==null?void 0:o.token,p=Sh[m];if(!p||!$n(d[1]))return fr(t);const h=Er(d[1].token,e);return p(h)}if(d.length===3){const m=(l=d[1])==null?void 0:l.token,p=Sh[m];if(!p||!$n(d[0])||!$n(d[2]))return fr(t);const h=Er(d[0].token,e);if(m==="|")return p(h,d[2].token);const c=Er(d[2].token,e);return p(h,c)}}function fr(t){return console.warn(`Warning: invalid expression \`${t}\``),!1}function $n({type:t}){return["number","boolean","string","param"].includes(t)}function Er(t,e){const i=t[0],a=t.slice(-1);return t==="true"||t==="false"?t==="true":i===a&&["'",'"'].includes(i)?t.slice(1,-1):Zm(t)?parseFloat(t):e[t]}function py(t,e){let i,a,r;const n=[];for(;t;){r=null,i=t.length;for(const s in e)a=e[s].exec(t),a&&a.index<i&&(r={token:a[0],type:s,matches:a.slice(1)},i=a.index);i&&n.push({token:t.substr(0,i),type:void 0}),r&&n.push(r),t=t.substr(i+(r?r.token.length:0))}return n}var Pu=(t,e,i)=>{if(!e.has(t))throw TypeError("Cannot "+i)},nd=(t,e,i)=>(Pu(t,e,"read from private field"),i?i.call(t):e.get(t)),_r=(t,e,i)=>{if(e.has(t))throw TypeError("Cannot add the same private member more than once");e instanceof WeakSet?e.add(t):e.set(t,i)},Qi=(t,e,i,a)=>(Pu(t,e,"write to private field"),e.set(t,i),i),cl=(t,e,i)=>(Pu(t,e,"access private method"),i),qa,Is,Ya,sd,mv,Rs,od;const hl={mediatargetlivewindow:"targetlivewindow",mediastreamtype:"streamtype"},pv=ge.createElement("template");pv.innerHTML=`
  <style>
    :host {
      display: inline-block;
      line-height: 0;
    }

    media-controller {
      width: 100%;
      height: 100%;
    }

    media-captions-button:not([mediasubtitleslist]),
    media-captions-menu:not([mediasubtitleslist]),
    media-captions-menu-button:not([mediasubtitleslist]),
    media-audio-track-menu[mediaaudiotrackunavailable],
    media-audio-track-menu-button[mediaaudiotrackunavailable],
    media-rendition-menu[mediarenditionunavailable],
    media-rendition-menu-button[mediarenditionunavailable],
    media-volume-range[mediavolumeunavailable],
    media-airplay-button[mediaairplayunavailable],
    media-fullscreen-button[mediafullscreenunavailable],
    media-cast-button[mediacastunavailable],
    media-pip-button[mediapipunavailable] {
      display: none;
    }
  </style>
`;class Vo extends f.HTMLElement{constructor(){super(),_r(this,sd),_r(this,Rs),_r(this,qa,void 0),_r(this,Is,void 0),_r(this,Ya,void 0),this.shadowRoot?this.renderRoot=this.shadowRoot:(this.renderRoot=this.attachShadow({mode:"open"}),this.createRenderer());const e=new MutationObserver(i=>{var a;this.mediaController&&!((a=this.mediaController)!=null&&a.breakpointsComputed)||i.some(r=>{const n=r.target;return n===this?!0:n.localName!=="media-controller"?!1:!!(hl[r.attributeName]||r.attributeName.startsWith("breakpoint"))})&&this.render()});e.observe(this,{attributes:!0}),e.observe(this.renderRoot,{attributes:!0,subtree:!0}),this.addEventListener(ri.BREAKPOINTS_COMPUTED,this.render),cl(this,sd,mv).call(this,"template")}get mediaController(){return this.renderRoot.querySelector("media-controller")}get template(){var e;return(e=nd(this,qa))!=null?e:this.constructor.template}set template(e){if(e===null){this.removeAttribute("template");return}typeof e=="string"?this.setAttribute("template",e):e instanceof HTMLTemplateElement&&(Qi(this,qa,e),Qi(this,Ya,null),this.createRenderer())}get props(){var e,i,a;const r=[...Array.from((i=(e=this.mediaController)==null?void 0:e.attributes)!=null?i:[]).filter(({name:s})=>hl[s]||s.startsWith("breakpoint")),...Array.from(this.attributes)],n={};for(const s of r){const o=(a=hl[s.name])!=null?a:Eg(s.name);let{value:l}=s;l!=null?(Zm(l)&&(l=parseFloat(l)),n[o]=l===""?!0:l):n[o]=!1}return n}attributeChangedCallback(e,i,a){e==="template"&&i!=a&&cl(this,Rs,od).call(this)}connectedCallback(){cl(this,Rs,od).call(this)}createRenderer(){this.template instanceof HTMLTemplateElement&&this.template!==nd(this,Is)&&(Qi(this,Is,this.template),this.renderer=new Ko(this.template,this.props,this.constructor.processor),this.renderRoot.textContent="",this.renderRoot.append(pv.content.cloneNode(!0),this.renderer))}render(){var e;(e=this.renderer)==null||e.update(this.props)}}qa=new WeakMap;Is=new WeakMap;Ya=new WeakMap;sd=new WeakSet;mv=function(t){if(Object.prototype.hasOwnProperty.call(this,t)){const e=this[t];delete this[t],this[t]=e}};Rs=new WeakSet;od=function(){var t;const e=this.getAttribute("template");if(!e||e===nd(this,Ya))return;const i=this.getRootNode(),a=(t=i?.getElementById)==null?void 0:t.call(i,e);if(a){Qi(this,Ya,e),Qi(this,qa,a),this.createRenderer();return}vy(e)&&(Qi(this,Ya,e),fy(e).then(r=>{const n=ge.createElement("template");n.innerHTML=r,Qi(this,qa,n),this.createRenderer()}).catch(console.error))};Vo.observedAttributes=["template"];Vo.processor=Nu;function vy(t){if(!/^(\/|\.\/|https?:\/\/)/.test(t))return!1;const e=/^https?:\/\//.test(t)?void 0:location.origin;try{new URL(t,e)}catch{return!1}return!0}async function fy(t){const e=await fetch(t);if(e.status!==200)throw new Error(`Failed to load resource: the server responded with a status of ${e.status}`);return e.text()}f.customElements.get("media-theme")||f.customElements.define("media-theme",Vo);function Ey({anchor:t,floating:e,placement:i}){const a=_y({anchor:t,floating:e}),{x:r,y:n}=gy(a,i);return{x:r,y:n}}function _y({anchor:t,floating:e}){return{anchor:by(t,e.offsetParent),floating:{x:0,y:0,width:e.offsetWidth,height:e.offsetHeight}}}function by(t,e){var i;const a=t.getBoundingClientRect(),r=(i=e?.getBoundingClientRect())!=null?i:{x:0,y:0};return{x:a.x-r.x,y:a.y-r.y,width:a.width,height:a.height}}function gy({anchor:t,floating:e},i){const a=yy(i)==="x"?"y":"x",r=a==="y"?"height":"width",n=vv(i),s=t.x+t.width/2-e.width/2,o=t.y+t.height/2-e.height/2,l=t[r]/2-e[r]/2;let d;switch(n){case"top":d={x:s,y:t.y-e.height};break;case"bottom":d={x:s,y:t.y+t.height};break;case"right":d={x:t.x+t.width,y:o};break;case"left":d={x:t.x-e.width,y:o};break;default:d={x:t.x,y:t.y}}switch(i.split("-")[1]){case"start":d[a]-=l;break;case"end":d[a]+=l;break}return d}function vv(t){return t.split("-")[0]}function yy(t){return["top","bottom"].includes(vv(t))?"y":"x"}class Uu extends Event{constructor({action:e="auto",relatedTarget:i,...a}){super("invoke",a),this.action=e,this.relatedTarget=i}}class Ty extends Event{constructor({newState:e,oldState:i,...a}){super("toggle",a),this.newState=e,this.oldState=i}}var $u=(t,e,i)=>{if(!e.has(t))throw TypeError("Cannot "+i)},q=(t,e,i)=>($u(t,e,"read from private field"),i?i.call(t):e.get(t)),j=(t,e,i)=>{if(e.has(t))throw TypeError("Cannot add the same private member more than once");e instanceof WeakSet?e.add(t):e.set(t,i)},Pt=(t,e,i,a)=>($u(t,e,"write to private field"),e.set(t,i),i),X=(t,e,i)=>($u(t,e,"access private method"),i),Ut,Ji,Si,Cs,Ls,ea,vn,ld,fv,Eo,Hu,_o,Ds,dd,ud,Ev,cd,_v,hd,bv,Ga,Qa,za,fn,bo,Bu,md,gv,Wu,yv,pd,Tv,Fu,Av,vd,kv,fd,Sv,Xr,go,Ed,wv,Jr,yo,Ms,_d;function tr({type:t,text:e,value:i,checked:a}){const r=ge.createElement("media-chrome-menu-item");r.type=t,r.part.add("menu-item"),r.part.add(t),r.value=i,r.checked=a;const n=ge.createElement("span");return n.textContent=e,r.append(n),r}function ta(t,e){let i=t.querySelector(`:scope > [slot="${e}"]`);if(i?.nodeName=="SLOT"&&(i=i.assignedElements({flatten:!0})[0]),i)return i=i.cloneNode(!0),i;const a=t.shadowRoot.querySelector(`[name="${e}"] > svg`);return a?a.cloneNode(!0):""}function Ay(t){return`
    <style>
      :host {
        font: var(--media-font,
          var(--media-font-weight, normal)
          var(--media-font-size, 14px) /
          var(--media-text-content-height, var(--media-control-height, 24px))
          var(--media-font-family, helvetica neue, segoe ui, roboto, arial, sans-serif));
        color: var(--media-text-color, var(--media-primary-color, rgb(238 238 238)));
        --_menu-bg: rgb(20 20 30 / .8);
        background: var(--media-menu-background, var(--media-control-background, var(--media-secondary-color, var(--_menu-bg))));
        border-radius: var(--media-menu-border-radius);
        border: var(--media-menu-border, none);
        display: var(--media-menu-display, inline-flex) !important;
        
        transition: var(--media-menu-transition-in,
          visibility 0s,
          opacity .2s ease-out,
          transform .15s ease-out,
          left .2s ease-in-out,
          min-width .2s ease-in-out,
          min-height .2s ease-in-out
        ) !important;
        
        visibility: var(--media-menu-visibility, visible);
        opacity: var(--media-menu-opacity, 1);
        max-height: var(--media-menu-max-height, var(--_menu-max-height, 300px));
        transform: var(--media-menu-transform-in, translateY(0) scale(1));
        flex-direction: column;
        
        min-height: 0;
        position: relative;
        bottom: var(--_menu-bottom);
        box-sizing: border-box;
      } 

      @-moz-document url-prefix() {
        :host{
          --_menu-bg: rgb(20 20 30);
        }
      }

      :host([hidden]) {
        transition: var(--media-menu-transition-out,
          visibility .15s ease-in,
          opacity .15s ease-in,
          transform .15s ease-in
        ) !important;
        visibility: var(--media-menu-hidden-visibility, hidden);
        opacity: var(--media-menu-hidden-opacity, 0);
        max-height: var(--media-menu-hidden-max-height,
          var(--media-menu-max-height, var(--_menu-max-height, 300px)));
        transform: var(--media-menu-transform-out, translateY(2px) scale(.99));
        pointer-events: none;
      }

      :host([slot="submenu"]) {
        background: none;
        width: 100%;
        min-height: 100%;
        position: absolute;
        bottom: 0;
        right: -100%;
      }

      #container {
        display: flex;
        flex-direction: column;
        min-height: 0;
        transition: transform .2s ease-out;
        transform: translate(0, 0);
      }

      #container.has-expanded {
        transition: transform .2s ease-in;
        transform: translate(-100%, 0);
      }

      button {
        background: none;
        color: inherit;
        border: none;
        padding: 0;
        font: inherit;
        outline: inherit;
        display: inline-flex;
        align-items: center;
      }

      slot[name="header"][hidden] {
        display: none;
      }

      slot[name="header"] > *,
      slot[name="header"]::slotted(*) {
        padding: .4em .7em;
        border-bottom: 1px solid rgb(255 255 255 / .25);
        cursor: var(--media-cursor, default);
      }

      slot[name="header"] > button[part~="back"],
      slot[name="header"]::slotted(button[part~="back"]) {
        cursor: var(--media-cursor, pointer);
      }

      svg[part~="back"] {
        height: var(--media-menu-icon-height, var(--media-control-height, 24px));
        fill: var(--media-icon-color, var(--media-primary-color, rgb(238 238 238)));
        display: block;
        margin-right: .5ch;
      }

      slot:not([name]) {
        gap: var(--media-menu-gap);
        flex-direction: var(--media-menu-flex-direction, column);
        overflow: var(--media-menu-overflow, hidden auto);
        display: flex;
        min-height: 0;
      }

      :host([role="menu"]) slot:not([name]) {
        padding-block: .4em;
      }

      slot:not([name])::slotted([role="menu"]) {
        background: none;
      }

      media-chrome-menu-item > span {
        margin-right: .5ch;
        max-width: var(--media-menu-item-max-width);
        text-overflow: ellipsis;
        overflow: hidden;
      }
    </style>
    <style id="layout-row" media="width:0">

      slot[name="header"] > *,
      slot[name="header"]::slotted(*) {
        padding: .4em .5em;
      }

      slot:not([name]) {
        gap: var(--media-menu-gap, .25em);
        flex-direction: var(--media-menu-flex-direction, row);
        padding-inline: .5em;
      }

      media-chrome-menu-item {
        padding: .3em .5em;
      }

      media-chrome-menu-item[aria-checked="true"] {
        background: var(--media-menu-item-checked-background, rgb(255 255 255 / .2));
      }

      
      media-chrome-menu-item::part(checked-indicator) {
        display: var(--media-menu-item-checked-indicator-display, none);
      }
    </style>
    <div id="container" part="container">
      <slot name="header" hidden>
        <button part="back button" aria-label="Back to previous menu">
          <slot name="back-icon">
            <svg aria-hidden="true" viewBox="0 0 20 24" part="back indicator">
              <path d="m11.88 17.585.742-.669-4.2-4.665 4.2-4.666-.743-.669-4.803 5.335 4.803 5.334Z"/>
            </svg>
          </slot>
          <slot name="title"></slot>
        </button>
      </slot>
      <slot></slot>
    </div>
    <slot name="checked-indicator" hidden></slot>
  `}const Li={STYLE:"style",HIDDEN:"hidden",DISABLED:"disabled",ANCHOR:"anchor"};class lt extends f.HTMLElement{constructor(){if(super(),j(this,ld),j(this,Eo),j(this,Ds),j(this,ud),j(this,cd),j(this,hd),j(this,za),j(this,bo),j(this,md),j(this,Wu),j(this,pd),j(this,Fu),j(this,vd),j(this,fd),j(this,Xr),j(this,Ed),j(this,Jr),j(this,Ms),j(this,Ut,null),j(this,Ji,null),j(this,Si,null),j(this,Cs,new Set),j(this,Ls,void 0),j(this,ea,!1),j(this,vn,null),j(this,_o,()=>{const e=q(this,Cs),i=new Set(this.items);for(const a of e)i.has(a)||this.dispatchEvent(new CustomEvent("removemenuitem",{detail:a}));for(const a of i)e.has(a)||this.dispatchEvent(new CustomEvent("addmenuitem",{detail:a}));Pt(this,Cs,i)}),j(this,Ga,()=>{X(this,za,fn).call(this),X(this,bo,Bu).call(this,!1)}),j(this,Qa,()=>{X(this,za,fn).call(this)}),!this.shadowRoot){this.attachShadow(this.constructor.shadowRootOptions);const e=Je(this.attributes);this.shadowRoot.innerHTML=this.constructor.getTemplateHTML(e)}this.container=this.shadowRoot.querySelector("#container"),this.defaultSlot=this.shadowRoot.querySelector("slot:not([name])"),this.shadowRoot.addEventListener("slotchange",this),Pt(this,Ls,new MutationObserver(q(this,_o))),q(this,Ls).observe(this.defaultSlot,{childList:!0})}static get observedAttributes(){return[Li.DISABLED,Li.HIDDEN,Li.STYLE,Li.ANCHOR,Y.MEDIA_CONTROLLER]}static formatMenuItemText(e,i){return e}enable(){this.addEventListener("click",this),this.addEventListener("focusout",this),this.addEventListener("keydown",this),this.addEventListener("invoke",this),this.addEventListener("toggle",this)}disable(){this.removeEventListener("click",this),this.removeEventListener("focusout",this),this.removeEventListener("keyup",this),this.removeEventListener("invoke",this),this.removeEventListener("toggle",this)}handleEvent(e){switch(e.type){case"slotchange":X(this,ld,fv).call(this,e);break;case"invoke":X(this,ud,Ev).call(this,e);break;case"click":X(this,md,gv).call(this,e);break;case"toggle":X(this,pd,Tv).call(this,e);break;case"focusout":X(this,vd,kv).call(this,e);break;case"keydown":X(this,fd,Sv).call(this,e);break}}connectedCallback(){var e,i;Pt(this,vn,iu(this.shadowRoot,":host")),X(this,Ds,dd).call(this),this.hasAttribute("disabled")||this.enable(),this.role||(this.role="menu"),Pt(this,Ut,Ml(this)),(i=(e=q(this,Ut))==null?void 0:e.associateElement)==null||i.call(e,this),this.hidden||(Xa(En(this),q(this,Ga)),Xa(this,q(this,Qa))),X(this,Eo,Hu).call(this)}disconnectedCallback(){var e,i;Ja(En(this),q(this,Ga)),Ja(this,q(this,Qa)),this.disable(),(i=(e=q(this,Ut))==null?void 0:e.unassociateElement)==null||i.call(e,this),Pt(this,Ut,null)}attributeChangedCallback(e,i,a){var r,n,s,o;e===Li.HIDDEN&&a!==i?(q(this,ea)||Pt(this,ea,!0),this.hidden?X(this,hd,bv).call(this):X(this,cd,_v).call(this),this.dispatchEvent(new Ty({oldState:this.hidden?"open":"closed",newState:this.hidden?"closed":"open",bubbles:!0}))):e===Y.MEDIA_CONTROLLER?(i&&((n=(r=q(this,Ut))==null?void 0:r.unassociateElement)==null||n.call(r,this),Pt(this,Ut,null)),a&&this.isConnected&&(Pt(this,Ut,Ml(this)),(o=(s=q(this,Ut))==null?void 0:s.associateElement)==null||o.call(s,this))):e===Li.DISABLED&&a!==i?a==null?this.enable():this.disable():e===Li.STYLE&&a!==i&&X(this,Ds,dd).call(this)}formatMenuItemText(e,i){return this.constructor.formatMenuItemText(e,i)}get anchor(){return this.getAttribute("anchor")}set anchor(e){this.setAttribute("anchor",`${e}`)}get anchorElement(){var e;return this.anchor?(e=Mo(this))==null?void 0:e.querySelector(`#${this.anchor}`):null}get items(){return this.defaultSlot.assignedElements({flatten:!0}).filter(ky)}get radioGroupItems(){return this.items.filter(e=>e.role==="menuitemradio")}get checkedItems(){return this.items.filter(e=>e.checked)}get value(){var e,i;return(i=(e=this.checkedItems[0])==null?void 0:e.value)!=null?i:""}set value(e){const i=this.items.find(a=>a.value===e);i&&X(this,Ms,_d).call(this,i)}focus(){if(Pt(this,Ji,tu()),this.items.length){X(this,Jr,yo).call(this,this.items[0]),this.items[0].focus();return}const e=this.querySelector('[autofocus], [tabindex]:not([tabindex="-1"]), [role="menu"]');e?.focus()}handleSelect(e){var i;const a=X(this,Xr,go).call(this,e);a&&(X(this,Ms,_d).call(this,a,a.type==="checkbox"),q(this,Si)&&!this.hidden&&((i=q(this,Ji))==null||i.focus(),this.hidden=!0))}get keysUsed(){return["Enter","Escape","Tab"," ","ArrowDown","ArrowUp","Home","End"]}handleMove(e){var i,a;const{key:r}=e,n=this.items,s=(a=(i=X(this,Xr,go).call(this,e))!=null?i:X(this,Ed,wv).call(this))!=null?a:n[0],o=n.indexOf(s);let l=Math.max(0,o);r==="ArrowDown"?l++:r==="ArrowUp"?l--:e.key==="Home"?l=0:e.key==="End"&&(l=n.length-1),l<0&&(l=n.length-1),l>n.length-1&&(l=0),X(this,Jr,yo).call(this,n[l]),n[l].focus()}}Ut=new WeakMap;Ji=new WeakMap;Si=new WeakMap;Cs=new WeakMap;Ls=new WeakMap;ea=new WeakMap;vn=new WeakMap;ld=new WeakSet;fv=function(t){const e=t.target;for(const i of e.assignedNodes({flatten:!0}))i.nodeType===3&&i.textContent.trim()===""&&i.remove();["header","title"].includes(e.name)&&X(this,Eo,Hu).call(this),e.name||q(this,_o).call(this)};Eo=new WeakSet;Hu=function(){const t=this.shadowRoot.querySelector('slot[name="header"]'),e=this.shadowRoot.querySelector('slot[name="title"]');t.hidden=e.assignedNodes().length===0&&t.assignedNodes().length===0};_o=new WeakMap;Ds=new WeakSet;dd=function(){var t;const e=this.shadowRoot.querySelector("#layout-row"),i=(t=getComputedStyle(this).getPropertyValue("--media-menu-layout"))==null?void 0:t.trim();e.setAttribute("media",i==="row"?"":"width:0")};ud=new WeakSet;Ev=function(t){Pt(this,Si,t.relatedTarget),si(this,t.relatedTarget)||(this.hidden=!this.hidden)};cd=new WeakSet;_v=function(){var t;(t=q(this,Si))==null||t.setAttribute("aria-expanded","true"),this.addEventListener("transitionend",()=>this.focus(),{once:!0}),Xa(En(this),q(this,Ga)),Xa(this,q(this,Qa))};hd=new WeakSet;bv=function(){var t;(t=q(this,Si))==null||t.setAttribute("aria-expanded","false"),Ja(En(this),q(this,Ga)),Ja(this,q(this,Qa))};Ga=new WeakMap;Qa=new WeakMap;za=new WeakSet;fn=function(t){if(this.hasAttribute("mediacontroller")&&!this.anchor||this.hidden||!this.anchorElement)return;const{x:e,y:i}=Ey({anchor:this.anchorElement,floating:this,placement:"top-start"});t??(t=this.offsetWidth);const r=En(this).getBoundingClientRect(),n=r.width-e-t,s=r.height-i-this.offsetHeight,{style:o}=q(this,vn);o.setProperty("position","absolute"),o.setProperty("right",`${Math.max(0,n)}px`),o.setProperty("--_menu-bottom",`${s}px`);const l=getComputedStyle(this),m=o.getPropertyValue("--_menu-bottom")===l.bottom?s:parseFloat(l.bottom),p=r.height-m-parseFloat(l.marginBottom);this.style.setProperty("--_menu-max-height",`${p}px`)};bo=new WeakSet;Bu=function(t){const e=this.querySelector('[role="menuitem"][aria-haspopup][aria-expanded="true"]'),i=e?.querySelector('[role="menu"]'),{style:a}=q(this,vn);if(t||a.setProperty("--media-menu-transition-in","none"),i){const r=i.offsetHeight,n=Math.max(i.offsetWidth,e.offsetWidth);this.style.setProperty("min-width",`${n}px`),this.style.setProperty("min-height",`${r}px`),X(this,za,fn).call(this,n)}else this.style.removeProperty("min-width"),this.style.removeProperty("min-height"),X(this,za,fn).call(this);a.removeProperty("--media-menu-transition-in")};md=new WeakSet;gv=function(t){var e;if(t.stopPropagation(),t.composedPath().includes(q(this,Wu,yv))){(e=q(this,Ji))==null||e.focus(),this.hidden=!0;return}const i=X(this,Xr,go).call(this,t);!i||i.hasAttribute("disabled")||(X(this,Jr,yo).call(this,i),this.handleSelect(t))};Wu=new WeakSet;yv=function(){var t;return(t=this.shadowRoot.querySelector('slot[name="header"]').assignedElements({flatten:!0}))==null?void 0:t.find(i=>i.matches('button[part~="back"]'))};pd=new WeakSet;Tv=function(t){if(t.target===this)return;X(this,Fu,Av).call(this);const e=Array.from(this.querySelectorAll('[role="menuitem"][aria-haspopup]'));for(const i of e)i.invokeTargetElement!=t.target&&t.newState=="open"&&i.getAttribute("aria-expanded")=="true"&&!i.invokeTargetElement.hidden&&i.invokeTargetElement.dispatchEvent(new Uu({relatedTarget:i}));for(const i of e)i.setAttribute("aria-expanded",`${!i.submenuElement.hidden}`);X(this,bo,Bu).call(this,!0)};Fu=new WeakSet;Av=function(){const e=this.querySelector('[role="menuitem"] > [role="menu"]:not([hidden])');this.container.classList.toggle("has-expanded",!!e)};vd=new WeakSet;kv=function(t){var e;si(this,t.relatedTarget)||(q(this,ea)&&((e=q(this,Ji))==null||e.focus()),q(this,Si)&&q(this,Si)!==t.relatedTarget&&!this.hidden&&(this.hidden=!0))};fd=new WeakSet;Sv=function(t){var e,i,a,r,n;const{key:s,ctrlKey:o,altKey:l,metaKey:d}=t;if(!(o||l||d)&&this.keysUsed.includes(s))if(t.preventDefault(),t.stopPropagation(),s==="Tab"){if(q(this,ea)){this.hidden=!0;return}t.shiftKey?(i=(e=this.previousElementSibling)==null?void 0:e.focus)==null||i.call(e):(r=(a=this.nextElementSibling)==null?void 0:a.focus)==null||r.call(a),this.blur()}else s==="Escape"?((n=q(this,Ji))==null||n.focus(),q(this,ea)&&(this.hidden=!0)):s==="Enter"||s===" "?this.handleSelect(t):this.handleMove(t)};Xr=new WeakSet;go=function(t){return t.composedPath().find(e=>["menuitemradio","menuitemcheckbox"].includes(e.role))};Ed=new WeakSet;wv=function(){return this.items.find(t=>t.tabIndex===0)};Jr=new WeakSet;yo=function(t){for(const e of this.items)e.tabIndex=e===t?0:-1};Ms=new WeakSet;_d=function(t,e){const i=[...this.checkedItems];t.type==="radio"&&this.radioGroupItems.forEach(a=>a.checked=!1),e?t.checked=!t.checked:t.checked=!0,this.checkedItems.some((a,r)=>a!=i[r])&&this.dispatchEvent(new Event("change",{bubbles:!0,composed:!0}))};lt.shadowRootOptions={mode:"open"};lt.getTemplateHTML=Ay;function ky(t){return["menuitem","menuitemradio","menuitemcheckbox"].includes(t?.role)}function En(t){var e;return(e=t.getAttribute("bounds")?rr(t,`#${t.getAttribute("bounds")}`):Be(t)||t.parentElement)!=null?e:t}f.customElements.get("media-chrome-menu")||f.customElements.define("media-chrome-menu",lt);var Ku=(t,e,i)=>{if(!e.has(t))throw TypeError("Cannot "+i)},Kt=(t,e,i)=>(Ku(t,e,"read from private field"),i?i.call(t):e.get(t)),zt=(t,e,i)=>{if(e.has(t))throw TypeError("Cannot add the same private member more than once");e instanceof WeakSet?e.add(t):e.set(t,i)},ml=(t,e,i,a)=>(Ku(t,e,"write to private field"),e.set(t,i),i),bt=(t,e,i)=>(Ku(t,e,"access private method"),i),xs,en,bd,Iv,To,Vu,qu,Rv,Vt,ir,_n,gd,Cv,Os,yd;function Sy(t){return`
    <style>
      :host {
        transition: var(--media-menu-item-transition,
          background .15s linear,
          opacity .2s ease-in-out
        );
        outline: var(--media-menu-item-outline, 0);
        outline-offset: var(--media-menu-item-outline-offset, -1px);
        cursor: var(--media-cursor, pointer);
        display: flex;
        align-items: center;
        align-self: stretch;
        justify-self: stretch;
        white-space: nowrap;
        white-space-collapse: collapse;
        text-wrap: nowrap;
        padding: .4em .8em .4em 1em;
      }

      :host(:focus-visible) {
        box-shadow: var(--media-menu-item-focus-shadow, inset 0 0 0 2px rgb(27 127 204 / .9));
        outline: var(--media-menu-item-hover-outline, 0);
        outline-offset: var(--media-menu-item-hover-outline-offset,  var(--media-menu-item-outline-offset, -1px));
      }

      :host(:hover) {
        cursor: var(--media-cursor, pointer);
        background: var(--media-menu-item-hover-background, rgb(92 92 102 / .5));
        outline: var(--media-menu-item-hover-outline);
        outline-offset: var(--media-menu-item-hover-outline-offset,  var(--media-menu-item-outline-offset, -1px));
      }

      :host([aria-checked="true"]) {
        background: var(--media-menu-item-checked-background);
      }

      :host([hidden]) {
        display: none;
      }

      :host([disabled]) {
        pointer-events: none;
        color: rgba(255, 255, 255, .3);
      }

      slot:not([name]) {
        width: 100%;
      }

      slot:not([name="submenu"]) {
        display: inline-flex;
        align-items: center;
        transition: inherit;
        opacity: var(--media-menu-item-opacity, 1);
      }

      slot[name="description"] {
        justify-content: end;
      }

      slot[name="description"] > span {
        display: inline-block;
        margin-inline: 1em .2em;
        max-width: var(--media-menu-item-description-max-width, 100px);
        text-overflow: ellipsis;
        overflow: hidden;
        font-size: .8em;
        font-weight: 400;
        text-align: right;
        position: relative;
        top: .04em;
      }

      slot[name="checked-indicator"] {
        display: none;
      }

      :host(:is([role="menuitemradio"],[role="menuitemcheckbox"])) slot[name="checked-indicator"] {
        display: var(--media-menu-item-checked-indicator-display, inline-block);
      }

      
      svg, img, ::slotted(svg), ::slotted(img) {
        height: var(--media-menu-item-icon-height, var(--media-control-height, 24px));
        fill: var(--media-icon-color, var(--media-primary-color, rgb(238 238 238)));
        display: block;
      }

      
      [part~="indicator"],
      ::slotted([part~="indicator"]) {
        fill: var(--media-menu-item-indicator-fill,
          var(--media-icon-color, var(--media-primary-color, rgb(238 238 238))));
        height: var(--media-menu-item-indicator-height, 1.25em);
        margin-right: .5ch;
      }

      [part~="checked-indicator"] {
        visibility: hidden;
      }

      :host([aria-checked="true"]) [part~="checked-indicator"] {
        visibility: visible;
      }
    </style>
    <slot name="checked-indicator">
      <svg aria-hidden="true" viewBox="0 1 24 24" part="checked-indicator indicator">
        <path d="m10 15.17 9.193-9.191 1.414 1.414-10.606 10.606-6.364-6.364 1.414-1.414 4.95 4.95Z"/>
      </svg>
    </slot>
    <slot name="prefix"></slot>
    <slot></slot>
    <slot name="description"></slot>
    <slot name="suffix">
      ${this.getSuffixSlotInnerHTML(t)}
    </slot>
    <slot name="submenu"></slot>
  `}function wy(t){return""}const it={TYPE:"type",VALUE:"value",CHECKED:"checked",DISABLED:"disabled"};class Ii extends f.HTMLElement{constructor(){if(super(),zt(this,bd),zt(this,To),zt(this,qu),zt(this,ir),zt(this,gd),zt(this,Os),zt(this,xs,!1),zt(this,en,void 0),zt(this,Vt,()=>{var e,i;this.submenuElement.items&&this.setAttribute("submenusize",`${this.submenuElement.items.length}`);const a=this.shadowRoot.querySelector('slot[name="description"]'),r=(e=this.submenuElement.checkedItems)==null?void 0:e[0],n=(i=r?.dataset.description)!=null?i:r?.text,s=ge.createElement("span");s.textContent=n??"",a.replaceChildren(s)}),!this.shadowRoot){this.attachShadow(this.constructor.shadowRootOptions);const e=Je(this.attributes);this.shadowRoot.innerHTML=this.constructor.getTemplateHTML(e)}this.shadowRoot.addEventListener("slotchange",this)}static get observedAttributes(){return[it.TYPE,it.DISABLED,it.CHECKED,it.VALUE]}enable(){this.hasAttribute("tabindex")||this.setAttribute("tabindex","-1"),br(this)&&!this.hasAttribute("aria-checked")&&this.setAttribute("aria-checked","false"),this.addEventListener("click",this),this.addEventListener("keydown",this)}disable(){this.removeAttribute("tabindex"),this.removeEventListener("click",this),this.removeEventListener("keydown",this),this.removeEventListener("keyup",this)}handleEvent(e){switch(e.type){case"slotchange":bt(this,bd,Iv).call(this,e);break;case"click":this.handleClick(e);break;case"keydown":bt(this,gd,Cv).call(this,e);break;case"keyup":bt(this,ir,_n).call(this,e);break}}attributeChangedCallback(e,i,a){e===it.CHECKED&&br(this)&&!Kt(this,xs)?this.setAttribute("aria-checked",a!=null?"true":"false"):e===it.TYPE&&a!==i?this.role="menuitem"+a:e===it.DISABLED&&a!==i&&(a==null?this.enable():this.disable())}connectedCallback(){this.hasAttribute(it.DISABLED)||this.enable(),this.role="menuitem"+this.type,ml(this,en,Td(this,this.parentNode)),bt(this,Os,yd).call(this),this.submenuElement&&bt(this,To,Vu).call(this)}disconnectedCallback(){this.disable(),bt(this,Os,yd).call(this),ml(this,en,null)}get invokeTarget(){return this.getAttribute("invoketarget")}set invokeTarget(e){this.setAttribute("invoketarget",`${e}`)}get invokeTargetElement(){var e;return this.invokeTarget?(e=Mo(this))==null?void 0:e.querySelector(`#${this.invokeTarget}`):this.submenuElement}get submenuElement(){return this.shadowRoot.querySelector('slot[name="submenu"]').assignedElements({flatten:!0})[0]}get type(){var e;return(e=this.getAttribute(it.TYPE))!=null?e:""}set type(e){this.setAttribute(it.TYPE,`${e}`)}get value(){var e;return(e=this.getAttribute(it.VALUE))!=null?e:this.text}set value(e){this.setAttribute(it.VALUE,e)}get text(){var e;return((e=this.textContent)!=null?e:"").trim()}get checked(){if(br(this))return this.getAttribute("aria-checked")==="true"}set checked(e){br(this)&&(ml(this,xs,!0),this.setAttribute("aria-checked",e?"true":"false"),e?this.part.add("checked"):this.part.remove("checked"))}handleClick(e){br(this)||this.invokeTargetElement&&si(this,e.target)&&this.invokeTargetElement.dispatchEvent(new Uu({relatedTarget:this}))}get keysUsed(){return["Enter"," "]}}xs=new WeakMap;en=new WeakMap;bd=new WeakSet;Iv=function(t){const e=t.target;if(!e?.name)for(const a of e.assignedNodes({flatten:!0}))a instanceof Text&&a.textContent.trim()===""&&a.remove();e.name==="submenu"&&(this.submenuElement?bt(this,To,Vu).call(this):bt(this,qu,Rv).call(this))};To=new WeakSet;Vu=async function(){this.setAttribute("aria-haspopup","menu"),this.setAttribute("aria-expanded",`${!this.submenuElement.hidden}`),this.submenuElement.addEventListener("change",Kt(this,Vt)),this.submenuElement.addEventListener("addmenuitem",Kt(this,Vt)),this.submenuElement.addEventListener("removemenuitem",Kt(this,Vt)),Kt(this,Vt).call(this)};qu=new WeakSet;Rv=function(){this.removeAttribute("aria-haspopup"),this.removeAttribute("aria-expanded"),this.submenuElement.removeEventListener("change",Kt(this,Vt)),this.submenuElement.removeEventListener("addmenuitem",Kt(this,Vt)),this.submenuElement.removeEventListener("removemenuitem",Kt(this,Vt)),Kt(this,Vt).call(this)};Vt=new WeakMap;ir=new WeakSet;_n=function(t){const{key:e}=t;if(!this.keysUsed.includes(e)){this.removeEventListener("keyup",bt(this,ir,_n));return}this.handleClick(t)};gd=new WeakSet;Cv=function(t){const{metaKey:e,altKey:i,key:a}=t;if(e||i||!this.keysUsed.includes(a)){this.removeEventListener("keyup",bt(this,ir,_n));return}this.addEventListener("keyup",bt(this,ir,_n),{once:!0})};Os=new WeakSet;yd=function(){var t;const e=(t=Kt(this,en))==null?void 0:t.radioGroupItems;if(!e)return;let i=e.filter(a=>a.getAttribute("aria-checked")==="true").pop();i||(i=e[0]);for(const a of e)a.setAttribute("aria-checked","false");i?.setAttribute("aria-checked","true")};Ii.shadowRootOptions={mode:"open"};Ii.getTemplateHTML=Sy;Ii.getSuffixSlotInnerHTML=wy;function br(t){return t.type==="radio"||t.type==="checkbox"}function Td(t,e){if(!t)return null;const{host:i}=t.getRootNode();return!e&&i?Td(t,i):e?.items?e:Td(e,e?.parentNode)}f.customElements.get("media-chrome-menu-item")||f.customElements.define("media-chrome-menu-item",Ii);function Iy(t){return`
    ${lt.getTemplateHTML(t)}
    <style>
      :host {
        --_menu-bg: rgb(20 20 30 / .8);
        background: var(--media-settings-menu-background,
            var(--media-menu-background,
              var(--media-control-background,
                var(--media-secondary-color, var(--_menu-bg)))));
        min-width: var(--media-settings-menu-min-width, 170px);
        border-radius: 2px 2px 0 0;
        overflow: hidden;
      }

      @-moz-document url-prefix() {
        :host{
          --_menu-bg: rgb(20 20 30);
        }
      }

      :host([role="menu"]) {
        
        justify-content: end;
      }

      slot:not([name]) {
        justify-content: var(--media-settings-menu-justify-content);
        flex-direction: var(--media-settings-menu-flex-direction, column);
        overflow: visible;
      }

      #container.has-expanded {
        --media-settings-menu-item-opacity: 0;
      }
    </style>
  `}class Lv extends lt{get anchorElement(){return this.anchor!=="auto"?super.anchorElement:Be(this).querySelector("media-settings-menu-button")}}Lv.getTemplateHTML=Iy;f.customElements.get("media-settings-menu")||f.customElements.define("media-settings-menu",Lv);function Ry(t){return`
    ${Ii.getTemplateHTML.call(this,t)}
    <style>
      slot:not([name="submenu"]) {
        opacity: var(--media-settings-menu-item-opacity, var(--media-menu-item-opacity));
      }

      :host([aria-expanded="true"]:hover) {
        background: transparent;
      }
    </style>
  `}function Cy(t){return`
    <svg aria-hidden="true" viewBox="0 0 20 24">
      <path d="m8.12 17.585-.742-.669 4.2-4.665-4.2-4.666.743-.669 4.803 5.335-4.803 5.334Z"/>
    </svg>
  `}class qo extends Ii{}qo.shadowRootOptions={mode:"open"};qo.getTemplateHTML=Ry;qo.getSuffixSlotInnerHTML=Cy;f.customElements.get("media-settings-menu-item")||f.customElements.define("media-settings-menu-item",qo);class lr extends Ce{connectedCallback(){super.connectedCallback(),this.invokeTargetElement&&this.setAttribute("aria-haspopup","menu")}get invokeTarget(){return this.getAttribute("invoketarget")}set invokeTarget(e){this.setAttribute("invoketarget",`${e}`)}get invokeTargetElement(){var e;return this.invokeTarget?(e=Mo(this))==null?void 0:e.querySelector(`#${this.invokeTarget}`):null}handleClick(){var e;(e=this.invokeTargetElement)==null||e.dispatchEvent(new Uu({relatedTarget:this}))}}f.customElements.get("media-chrome-menu-button")||f.customElements.define("media-chrome-menu-button",lr);function Ly(){return`
    <style>
      :host([aria-expanded="true"]) slot[name=tooltip] {
        display: none;
      }
    </style>
    <slot name="icon">
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M4.5 14.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Zm7.5 0a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Zm7.5 0a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"/>
      </svg>
    </slot>
  `}function Dy(){return L("Settings")}class Yu extends lr{static get observedAttributes(){return[...super.observedAttributes,"target"]}connectedCallback(){super.connectedCallback(),this.setAttribute("aria-label",L("settings"))}get invokeTargetElement(){return this.invokeTarget!=null?super.invokeTargetElement:Be(this).querySelector("media-settings-menu")}}Yu.getSlotTemplateHTML=Ly;Yu.getTooltipContentHTML=Dy;f.customElements.get("media-settings-menu-button")||f.customElements.define("media-settings-menu-button",Yu);var Gu=(t,e,i)=>{if(!e.has(t))throw TypeError("Cannot "+i)},Dv=(t,e,i)=>(Gu(t,e,"read from private field"),i?i.call(t):e.get(t)),Hn=(t,e,i)=>{if(e.has(t))throw TypeError("Cannot add the same private member more than once");e instanceof WeakSet?e.add(t):e.set(t,i)},Ad=(t,e,i,a)=>(Gu(t,e,"write to private field"),e.set(t,i),i),Bn=(t,e,i)=>(Gu(t,e,"access private method"),i),Br,Ao,Ns,kd,Ps,Sd;class My extends lt{constructor(){super(...arguments),Hn(this,Ns),Hn(this,Ps),Hn(this,Br,[]),Hn(this,Ao,void 0)}static get observedAttributes(){return[...super.observedAttributes,u.MEDIA_AUDIO_TRACK_LIST,u.MEDIA_AUDIO_TRACK_ENABLED,u.MEDIA_AUDIO_TRACK_UNAVAILABLE]}attributeChangedCallback(e,i,a){super.attributeChangedCallback(e,i,a),e===u.MEDIA_AUDIO_TRACK_ENABLED&&i!==a?this.value=a:e===u.MEDIA_AUDIO_TRACK_LIST&&i!==a&&(Ad(this,Br,pg(a??"")),Bn(this,Ns,kd).call(this))}connectedCallback(){super.connectedCallback(),this.addEventListener("change",Bn(this,Ps,Sd))}disconnectedCallback(){super.disconnectedCallback(),this.removeEventListener("change",Bn(this,Ps,Sd))}get anchorElement(){var e;return this.anchor!=="auto"?super.anchorElement:(e=Be(this))==null?void 0:e.querySelector("media-audio-track-menu-button")}get mediaAudioTrackList(){return Dv(this,Br)}set mediaAudioTrackList(e){Ad(this,Br,e),Bn(this,Ns,kd).call(this)}get mediaAudioTrackEnabled(){var e;return(e=ae(this,u.MEDIA_AUDIO_TRACK_ENABLED))!=null?e:""}set mediaAudioTrackEnabled(e){re(this,u.MEDIA_AUDIO_TRACK_ENABLED,e)}}Br=new WeakMap;Ao=new WeakMap;Ns=new WeakSet;kd=function(){if(Dv(this,Ao)===JSON.stringify(this.mediaAudioTrackList))return;Ad(this,Ao,JSON.stringify(this.mediaAudioTrackList));const t=this.mediaAudioTrackList;this.defaultSlot.textContent="",t.sort((e,i)=>e.id.localeCompare(i.id,void 0,{numeric:!0}));for(const e of t){const i=this.formatMenuItemText(e.label,e),a=tr({type:"radio",text:i,value:`${e.id}`,checked:e.enabled});a.prepend(ta(this,"checked-indicator")),this.defaultSlot.append(a)}};Ps=new WeakSet;Sd=function(){if(this.value==null)return;const t=new f.CustomEvent(I.MEDIA_AUDIO_TRACK_REQUEST,{composed:!0,bubbles:!0,detail:this.value});this.dispatchEvent(t)};f.customElements.get("media-audio-track-menu")||f.customElements.define("media-audio-track-menu",My);const xy=`<svg aria-hidden="true" viewBox="0 0 24 24">
  <path d="M11 17H9.5V7H11v10Zm-3-3H6.5v-4H8v4Zm6-5h-1.5v6H14V9Zm3 7h-1.5V8H17v8Z"/>
  <path d="M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10Zm-2 0a8 8 0 1 0-16 0 8 8 0 0 0 16 0Z"/>
</svg>`;function Oy(){return`
    <style>
      :host([aria-expanded="true"]) slot[name=tooltip] {
        display: none;
      }
    </style>
    <slot name="icon">${xy}</slot>
  `}function Ny(){return L("Audio")}const wh=t=>{const e=L("Audio");t.setAttribute("aria-label",e)};class Qu extends lr{static get observedAttributes(){return[...super.observedAttributes,u.MEDIA_AUDIO_TRACK_ENABLED,u.MEDIA_AUDIO_TRACK_UNAVAILABLE]}connectedCallback(){super.connectedCallback(),wh(this)}attributeChangedCallback(e,i,a){super.attributeChangedCallback(e,i,a),e===u.MEDIA_LANG&&wh(this)}get invokeTargetElement(){var e;return this.invokeTarget!=null?super.invokeTargetElement:(e=Be(this))==null?void 0:e.querySelector("media-audio-track-menu")}get mediaAudioTrackEnabled(){var e;return(e=ae(this,u.MEDIA_AUDIO_TRACK_ENABLED))!=null?e:""}set mediaAudioTrackEnabled(e){re(this,u.MEDIA_AUDIO_TRACK_ENABLED,e)}}Qu.getSlotTemplateHTML=Oy;Qu.getTooltipContentHTML=Ny;f.customElements.get("media-audio-track-menu-button")||f.customElements.define("media-audio-track-menu-button",Qu);var zu=(t,e,i)=>{if(!e.has(t))throw TypeError("Cannot "+i)},Py=(t,e,i)=>(zu(t,e,"read from private field"),e.get(t)),pl=(t,e,i)=>{if(e.has(t))throw TypeError("Cannot add the same private member more than once");e instanceof WeakSet?e.add(t):e.set(t,i)},Uy=(t,e,i,a)=>(zu(t,e,"write to private field"),e.set(t,i),i),Wn=(t,e,i)=>(zu(t,e,"access private method"),i),ko,Us,wd,$s,Id;const $y=`
  <svg aria-hidden="true" viewBox="0 0 26 24" part="captions-indicator indicator">
    <path d="M22.83 5.68a2.58 2.58 0 0 0-2.3-2.5c-3.62-.24-11.44-.24-15.06 0a2.58 2.58 0 0 0-2.3 2.5c-.23 4.21-.23 8.43 0 12.64a2.58 2.58 0 0 0 2.3 2.5c3.62.24 11.44.24 15.06 0a2.58 2.58 0 0 0 2.3-2.5c.23-4.21.23-8.43 0-12.64Zm-11.39 9.45a3.07 3.07 0 0 1-1.91.57 3.06 3.06 0 0 1-2.34-1 3.75 3.75 0 0 1-.92-2.67 3.92 3.92 0 0 1 .92-2.77 3.18 3.18 0 0 1 2.43-1 2.94 2.94 0 0 1 2.13.78c.364.359.62.813.74 1.31l-1.43.35a1.49 1.49 0 0 0-1.51-1.17 1.61 1.61 0 0 0-1.29.58 2.79 2.79 0 0 0-.5 1.89 3 3 0 0 0 .49 1.93 1.61 1.61 0 0 0 1.27.58 1.48 1.48 0 0 0 1-.37 2.1 2.1 0 0 0 .59-1.14l1.4.44a3.23 3.23 0 0 1-1.07 1.69Zm7.22 0a3.07 3.07 0 0 1-1.91.57 3.06 3.06 0 0 1-2.34-1 3.75 3.75 0 0 1-.92-2.67 3.88 3.88 0 0 1 .93-2.77 3.14 3.14 0 0 1 2.42-1 3 3 0 0 1 2.16.82 2.8 2.8 0 0 1 .73 1.31l-1.43.35a1.49 1.49 0 0 0-1.51-1.21 1.61 1.61 0 0 0-1.29.58A2.79 2.79 0 0 0 15 12a3 3 0 0 0 .49 1.93 1.61 1.61 0 0 0 1.27.58 1.44 1.44 0 0 0 1-.37 2.1 2.1 0 0 0 .6-1.15l1.4.44a3.17 3.17 0 0 1-1.1 1.7Z"/>
  </svg>`;function Hy(t){return`
    ${lt.getTemplateHTML(t)}
    <slot name="captions-indicator" hidden>${$y}</slot>
  `}class Mv extends lt{constructor(){super(...arguments),pl(this,Us),pl(this,$s),pl(this,ko,void 0)}static get observedAttributes(){return[...super.observedAttributes,u.MEDIA_SUBTITLES_LIST,u.MEDIA_SUBTITLES_SHOWING]}attributeChangedCallback(e,i,a){super.attributeChangedCallback(e,i,a),e===u.MEDIA_SUBTITLES_LIST&&i!==a?Wn(this,Us,wd).call(this):e===u.MEDIA_SUBTITLES_SHOWING&&i!==a&&(this.value=a||"",Wn(this,Us,wd).call(this))}connectedCallback(){super.connectedCallback(),this.addEventListener("change",Wn(this,$s,Id))}disconnectedCallback(){super.disconnectedCallback(),this.removeEventListener("change",Wn(this,$s,Id))}get anchorElement(){return this.anchor!=="auto"?super.anchorElement:Be(this).querySelector("media-captions-menu-button")}get mediaSubtitlesList(){return Ih(this,u.MEDIA_SUBTITLES_LIST)}set mediaSubtitlesList(e){Rh(this,u.MEDIA_SUBTITLES_LIST,e)}get mediaSubtitlesShowing(){return Ih(this,u.MEDIA_SUBTITLES_SHOWING)}set mediaSubtitlesShowing(e){Rh(this,u.MEDIA_SUBTITLES_SHOWING,e)}}ko=new WeakMap;Us=new WeakSet;wd=function(){var t;const e=Py(this,ko)!==JSON.stringify(this.mediaSubtitlesList),i=this.value!==this.getAttribute(u.MEDIA_SUBTITLES_SHOWING);if(!e&&!i)return;Uy(this,ko,JSON.stringify(this.mediaSubtitlesList)),this.defaultSlot.textContent="";const a=!this.value,r=tr({type:"radio",text:this.formatMenuItemText(L("Off")),value:"off",checked:a});r.prepend(ta(this,"checked-indicator")),this.defaultSlot.append(r);const n=this.mediaSubtitlesList;for(const s of n){const o=tr({type:"radio",text:this.formatMenuItemText(s.label,s),value:Pl(s),checked:this.value==Pl(s)});o.prepend(ta(this,"checked-indicator")),((t=s.kind)!=null?t:"subs")==="captions"&&o.append(ta(this,"captions-indicator")),this.defaultSlot.append(o)}};$s=new WeakSet;Id=function(){const t=this.mediaSubtitlesShowing,e=this.getAttribute(u.MEDIA_SUBTITLES_SHOWING),i=this.value!==e;if(t?.length&&i&&this.dispatchEvent(new f.CustomEvent(I.MEDIA_DISABLE_SUBTITLES_REQUEST,{composed:!0,bubbles:!0,detail:t})),!this.value||!i)return;const a=new f.CustomEvent(I.MEDIA_SHOW_SUBTITLES_REQUEST,{composed:!0,bubbles:!0,detail:this.value});this.dispatchEvent(a)};Mv.getTemplateHTML=Hy;const Ih=(t,e)=>{const i=t.getAttribute(e);return i?Uo(i):[]},Rh=(t,e,i)=>{if(!i?.length){t.removeAttribute(e);return}const a=un(i);t.getAttribute(e)!==a&&t.setAttribute(e,a)};f.customElements.get("media-captions-menu")||f.customElements.define("media-captions-menu",Mv);const By=`<svg aria-hidden="true" viewBox="0 0 26 24">
  <path d="M22.83 5.68a2.58 2.58 0 0 0-2.3-2.5c-3.62-.24-11.44-.24-15.06 0a2.58 2.58 0 0 0-2.3 2.5c-.23 4.21-.23 8.43 0 12.64a2.58 2.58 0 0 0 2.3 2.5c3.62.24 11.44.24 15.06 0a2.58 2.58 0 0 0 2.3-2.5c.23-4.21.23-8.43 0-12.64Zm-11.39 9.45a3.07 3.07 0 0 1-1.91.57 3.06 3.06 0 0 1-2.34-1 3.75 3.75 0 0 1-.92-2.67 3.92 3.92 0 0 1 .92-2.77 3.18 3.18 0 0 1 2.43-1 2.94 2.94 0 0 1 2.13.78c.364.359.62.813.74 1.31l-1.43.35a1.49 1.49 0 0 0-1.51-1.17 1.61 1.61 0 0 0-1.29.58 2.79 2.79 0 0 0-.5 1.89 3 3 0 0 0 .49 1.93 1.61 1.61 0 0 0 1.27.58 1.48 1.48 0 0 0 1-.37 2.1 2.1 0 0 0 .59-1.14l1.4.44a3.23 3.23 0 0 1-1.07 1.69Zm7.22 0a3.07 3.07 0 0 1-1.91.57 3.06 3.06 0 0 1-2.34-1 3.75 3.75 0 0 1-.92-2.67 3.88 3.88 0 0 1 .93-2.77 3.14 3.14 0 0 1 2.42-1 3 3 0 0 1 2.16.82 2.8 2.8 0 0 1 .73 1.31l-1.43.35a1.49 1.49 0 0 0-1.51-1.21 1.61 1.61 0 0 0-1.29.58A2.79 2.79 0 0 0 15 12a3 3 0 0 0 .49 1.93 1.61 1.61 0 0 0 1.27.58 1.44 1.44 0 0 0 1-.37 2.1 2.1 0 0 0 .6-1.15l1.4.44a3.17 3.17 0 0 1-1.1 1.7Z"/>
</svg>`,Wy=`<svg aria-hidden="true" viewBox="0 0 26 24">
  <path d="M17.73 14.09a1.4 1.4 0 0 1-1 .37 1.579 1.579 0 0 1-1.27-.58A3 3 0 0 1 15 12a2.8 2.8 0 0 1 .5-1.85 1.63 1.63 0 0 1 1.29-.57 1.47 1.47 0 0 1 1.51 1.2l1.43-.34A2.89 2.89 0 0 0 19 9.07a3 3 0 0 0-2.14-.78 3.14 3.14 0 0 0-2.42 1 3.91 3.91 0 0 0-.93 2.78 3.74 3.74 0 0 0 .92 2.66 3.07 3.07 0 0 0 2.34 1 3.07 3.07 0 0 0 1.91-.57 3.17 3.17 0 0 0 1.07-1.74l-1.4-.45c-.083.43-.3.822-.62 1.12Zm-7.22 0a1.43 1.43 0 0 1-1 .37 1.58 1.58 0 0 1-1.27-.58A3 3 0 0 1 7.76 12a2.8 2.8 0 0 1 .5-1.85 1.63 1.63 0 0 1 1.29-.57 1.47 1.47 0 0 1 1.51 1.2l1.43-.34a2.81 2.81 0 0 0-.74-1.32 2.94 2.94 0 0 0-2.13-.78 3.18 3.18 0 0 0-2.43 1 4 4 0 0 0-.92 2.78 3.74 3.74 0 0 0 .92 2.66 3.07 3.07 0 0 0 2.34 1 3.07 3.07 0 0 0 1.91-.57 3.23 3.23 0 0 0 1.07-1.74l-1.4-.45a2.06 2.06 0 0 1-.6 1.07Zm12.32-8.41a2.59 2.59 0 0 0-2.3-2.51C18.72 3.05 15.86 3 13 3c-2.86 0-5.72.05-7.53.17a2.59 2.59 0 0 0-2.3 2.51c-.23 4.207-.23 8.423 0 12.63a2.57 2.57 0 0 0 2.3 2.5c1.81.13 4.67.19 7.53.19 2.86 0 5.72-.06 7.53-.19a2.57 2.57 0 0 0 2.3-2.5c.23-4.207.23-8.423 0-12.63Zm-1.49 12.53a1.11 1.11 0 0 1-.91 1.11c-1.67.11-4.45.18-7.43.18-2.98 0-5.76-.07-7.43-.18a1.11 1.11 0 0 1-.91-1.11c-.21-4.14-.21-8.29 0-12.43a1.11 1.11 0 0 1 .91-1.11C7.24 4.56 10 4.49 13 4.49s5.76.07 7.43.18a1.11 1.11 0 0 1 .91 1.11c.21 4.14.21 8.29 0 12.43Z"/>
</svg>`;function Fy(){return`
    <style>
      :host([data-captions-enabled="true"]) slot[name=off] {
        display: none !important;
      }

      
      :host(:not([data-captions-enabled="true"])) slot[name=on] {
        display: none !important;
      }

      :host([aria-expanded="true"]) slot[name=tooltip] {
        display: none;
      }
    </style>

    <slot name="icon">
      <slot name="on">${By}</slot>
      <slot name="off">${Wy}</slot>
    </slot>
  `}function Ky(){return L("Captions")}const Ch=t=>{t.setAttribute("data-captions-enabled",fp(t).toString())},Lh=t=>{t.setAttribute("aria-label",L("closed captions"))};class Zu extends lr{static get observedAttributes(){return[...super.observedAttributes,u.MEDIA_SUBTITLES_LIST,u.MEDIA_SUBTITLES_SHOWING,u.MEDIA_LANG]}connectedCallback(){super.connectedCallback(),Lh(this),Ch(this)}attributeChangedCallback(e,i,a){super.attributeChangedCallback(e,i,a),e===u.MEDIA_SUBTITLES_SHOWING?Ch(this):e===u.MEDIA_LANG&&Lh(this)}get invokeTargetElement(){var e;return this.invokeTarget!=null?super.invokeTargetElement:(e=Be(this))==null?void 0:e.querySelector("media-captions-menu")}get mediaSubtitlesList(){return Dh(this,u.MEDIA_SUBTITLES_LIST)}set mediaSubtitlesList(e){Mh(this,u.MEDIA_SUBTITLES_LIST,e)}get mediaSubtitlesShowing(){return Dh(this,u.MEDIA_SUBTITLES_SHOWING)}set mediaSubtitlesShowing(e){Mh(this,u.MEDIA_SUBTITLES_SHOWING,e)}}Zu.getSlotTemplateHTML=Fy;Zu.getTooltipContentHTML=Ky;const Dh=(t,e)=>{const i=t.getAttribute(e);return i?Uo(i):[]},Mh=(t,e,i)=>{if(!i?.length){t.removeAttribute(e);return}const a=un(i);t.getAttribute(e)!==a&&t.setAttribute(e,a)};f.customElements.get("media-captions-menu-button")||f.customElements.define("media-captions-menu-button",Zu);var xv=(t,e,i)=>{if(!e.has(t))throw TypeError("Cannot "+i)},Ma=(t,e,i)=>(xv(t,e,"read from private field"),i?i.call(t):e.get(t)),vl=(t,e,i)=>{if(e.has(t))throw TypeError("Cannot add the same private member more than once");e instanceof WeakSet?e.add(t):e.set(t,i)},ha=(t,e,i)=>(xv(t,e,"access private method"),i),bi,xa,Wr,Hs,Rd;const fl={RATES:"rates"};class Vy extends lt{constructor(){super(),vl(this,xa),vl(this,Hs),vl(this,bi,new nu(this,fl.RATES,{defaultValue:zp})),ha(this,xa,Wr).call(this)}static get observedAttributes(){return[...super.observedAttributes,u.MEDIA_PLAYBACK_RATE,fl.RATES]}attributeChangedCallback(e,i,a){super.attributeChangedCallback(e,i,a),e===u.MEDIA_PLAYBACK_RATE&&i!=a?(this.value=a,ha(this,xa,Wr).call(this)):e===fl.RATES&&i!=a&&(Ma(this,bi).value=a,ha(this,xa,Wr).call(this))}connectedCallback(){super.connectedCallback(),this.addEventListener("change",ha(this,Hs,Rd))}disconnectedCallback(){super.disconnectedCallback(),this.removeEventListener("change",ha(this,Hs,Rd))}get anchorElement(){return this.anchor!=="auto"?super.anchorElement:Be(this).querySelector("media-playback-rate-menu-button")}get rates(){return Ma(this,bi)}set rates(e){e?Array.isArray(e)?Ma(this,bi).value=e.join(" "):typeof e=="string"&&(Ma(this,bi).value=e):Ma(this,bi).value="",ha(this,xa,Wr).call(this)}get mediaPlaybackRate(){return ie(this,u.MEDIA_PLAYBACK_RATE,Ha)}set mediaPlaybackRate(e){ue(this,u.MEDIA_PLAYBACK_RATE,e)}}bi=new WeakMap;xa=new WeakSet;Wr=function(){this.defaultSlot.textContent="";const t=this.mediaPlaybackRate,e=new Set(Array.from(Ma(this,bi)).map(a=>Number(a)));t>0&&!e.has(t)&&e.add(t);const i=Array.from(e).sort((a,r)=>a-r);for(const a of i){const r=tr({type:"radio",text:this.formatMenuItemText(`${a}x`,a),value:a.toString(),checked:t===a});r.prepend(ta(this,"checked-indicator")),this.defaultSlot.append(r)}};Hs=new WeakSet;Rd=function(){if(!this.value)return;const t=new f.CustomEvent(I.MEDIA_PLAYBACK_RATE_REQUEST,{composed:!0,bubbles:!0,detail:this.value});this.dispatchEvent(t)};f.customElements.get("media-playback-rate-menu")||f.customElements.define("media-playback-rate-menu",Vy);const Bs=1;function qy(t){return`
    <style>
      :host {
        min-width: 5ch;
        padding: var(--media-button-padding, var(--media-control-padding, 10px 5px));
      }
      
      :host([aria-expanded="true"]) slot {
        display: block;
      }

      :host([aria-expanded="true"]) slot[name=tooltip] {
        display: none;
      }
    </style>
    <slot name="icon">${t.mediaplaybackrate||Bs}x</slot>
  `}function Yy(){return L("Playback rate")}class ju extends lr{static get observedAttributes(){return[...super.observedAttributes,u.MEDIA_PLAYBACK_RATE]}constructor(){var e;super(),this.container=this.shadowRoot.querySelector('slot[name="icon"]'),this.container.innerHTML=`${(e=this.mediaPlaybackRate)!=null?e:Bs}x`}attributeChangedCallback(e,i,a){if(super.attributeChangedCallback(e,i,a),e===u.MEDIA_PLAYBACK_RATE){const r=a?+a:Number.NaN,n=Number.isNaN(r)?Bs:r;this.container.innerHTML=`${n}x`,this.setAttribute("aria-label",L("Playback rate {playbackRate}",{playbackRate:n}))}}get invokeTargetElement(){return this.invokeTarget!=null?super.invokeTargetElement:Be(this).querySelector("media-playback-rate-menu")}get mediaPlaybackRate(){return ie(this,u.MEDIA_PLAYBACK_RATE,Bs)}set mediaPlaybackRate(e){ue(this,u.MEDIA_PLAYBACK_RATE,e)}}ju.getSlotTemplateHTML=qy;ju.getTooltipContentHTML=Yy;f.customElements.get("media-playback-rate-menu-button")||f.customElements.define("media-playback-rate-menu-button",ju);var Xu=(t,e,i)=>{if(!e.has(t))throw TypeError("Cannot "+i)},Fr=(t,e,i)=>(Xu(t,e,"read from private field"),i?i.call(t):e.get(t)),Fn=(t,e,i)=>{if(e.has(t))throw TypeError("Cannot add the same private member more than once");e instanceof WeakSet?e.add(t):e.set(t,i)},xh=(t,e,i,a)=>(Xu(t,e,"write to private field"),e.set(t,i),i),ma=(t,e,i)=>(Xu(t,e,"access private method"),i),Kr,Ba,Oa,Vr,Ws,Cd;class Gy extends lt{constructor(){super(...arguments),Fn(this,Oa),Fn(this,Ws),Fn(this,Kr,[]),Fn(this,Ba,{})}static get observedAttributes(){return[...super.observedAttributes,u.MEDIA_RENDITION_LIST,u.MEDIA_RENDITION_SELECTED,u.MEDIA_RENDITION_UNAVAILABLE,u.MEDIA_HEIGHT]}static formatMenuItemText(e,i){return super.formatMenuItemText(e,i)}static formatRendition(e,{showBitrate:i=!1}={}){const a=`${Math.min(e.width,e.height)}p`;if(i&&e.bitrate){const r=e.bitrate/1e6,n=`${r.toFixed(r<1?1:0)} Mbps`;return`${a} (${n})`}return this.formatMenuItemText(a,e)}static compareRendition(e,i){var a,r;return i.height===e.height?((a=i.bitrate)!=null?a:0)-((r=e.bitrate)!=null?r:0):i.height-e.height}attributeChangedCallback(e,i,a){super.attributeChangedCallback(e,i,a),e===u.MEDIA_RENDITION_SELECTED&&i!==a?(this.value=a??"auto",ma(this,Oa,Vr).call(this)):e===u.MEDIA_RENDITION_LIST&&i!==a?(xh(this,Kr,ug(a)),ma(this,Oa,Vr).call(this)):e===u.MEDIA_HEIGHT&&i!==a&&ma(this,Oa,Vr).call(this)}connectedCallback(){super.connectedCallback(),this.addEventListener("change",ma(this,Ws,Cd))}disconnectedCallback(){super.disconnectedCallback(),this.removeEventListener("change",ma(this,Ws,Cd))}get anchorElement(){return this.anchor!=="auto"?super.anchorElement:Be(this).querySelector("media-rendition-menu-button")}get mediaRenditionList(){return Fr(this,Kr)}set mediaRenditionList(e){xh(this,Kr,e),ma(this,Oa,Vr).call(this)}get mediaRenditionSelected(){return ae(this,u.MEDIA_RENDITION_SELECTED)}set mediaRenditionSelected(e){re(this,u.MEDIA_RENDITION_SELECTED,e)}get mediaHeight(){return ie(this,u.MEDIA_HEIGHT)}set mediaHeight(e){ue(this,u.MEDIA_HEIGHT,e)}compareRendition(e,i){return this.constructor.compareRendition(e,i)}formatMenuItemText(e,i){return this.constructor.formatMenuItemText(e,i)}formatRendition(e,i){return this.constructor.formatRendition(e,i)}showRenditionBitrate(e){return this.mediaRenditionList.some(i=>i!==e&&i.height===e.height&&i.bitrate!==e.bitrate)}}Kr=new WeakMap;Ba=new WeakMap;Oa=new WeakSet;Vr=function(){if(Fr(this,Ba).mediaRenditionList===JSON.stringify(this.mediaRenditionList)&&Fr(this,Ba).mediaHeight===this.mediaHeight)return;Fr(this,Ba).mediaRenditionList=JSON.stringify(this.mediaRenditionList),Fr(this,Ba).mediaHeight=this.mediaHeight;const t=this.mediaRenditionList.sort(this.compareRendition.bind(this)),e=t.find(s=>s.id===this.mediaRenditionSelected);for(const s of t)s.selected=s===e;this.defaultSlot.textContent="";const i=!this.mediaRenditionSelected;for(const s of t){const o=this.formatRendition(s,{showBitrate:this.showRenditionBitrate(s)}),l=tr({type:"radio",text:o,value:`${s.id}`,checked:s.selected&&!i});l.prepend(ta(this,"checked-indicator")),this.defaultSlot.append(l)}const a=e&&this.showRenditionBitrate(e),r=i?e?this.formatMenuItemText(`${L("Auto")} • ${this.formatRendition(e,{showBitrate:a})}`,e):this.formatMenuItemText(`${L("Auto")} (${this.mediaHeight}p)`):this.formatMenuItemText(L("Auto")),n=tr({type:"radio",text:r,value:"auto",checked:i});n.dataset.description=r,n.prepend(ta(this,"checked-indicator")),this.defaultSlot.append(n)};Ws=new WeakSet;Cd=function(){if(this.value==null)return;const t=new f.CustomEvent(I.MEDIA_RENDITION_REQUEST,{composed:!0,bubbles:!0,detail:this.value});this.dispatchEvent(t)};f.customElements.get("media-rendition-menu")||f.customElements.define("media-rendition-menu",Gy);const Qy=`<svg aria-hidden="true" viewBox="0 0 24 24">
  <path d="M13.5 2.5h2v6h-2v-2h-11v-2h11v-2Zm4 2h4v2h-4v-2Zm-12 4h2v6h-2v-2h-3v-2h3v-2Zm4 2h12v2h-12v-2Zm1 4h2v6h-2v-2h-8v-2h8v-2Zm4 2h7v2h-7v-2Z" />
</svg>`;function zy(){return`
    <style>
      :host([aria-expanded="true"]) slot[name=tooltip] {
        display: none;
      }
    </style>
    <slot name="icon">${Qy}</slot>
  `}function Zy(){return L("Quality")}class Ju extends lr{static get observedAttributes(){return[...super.observedAttributes,u.MEDIA_RENDITION_SELECTED,u.MEDIA_RENDITION_UNAVAILABLE,u.MEDIA_HEIGHT]}connectedCallback(){super.connectedCallback(),this.setAttribute("aria-label",L("quality"))}get invokeTargetElement(){return this.invokeTarget!=null?super.invokeTargetElement:Be(this).querySelector("media-rendition-menu")}get mediaRenditionSelected(){return ae(this,u.MEDIA_RENDITION_SELECTED)}set mediaRenditionSelected(e){re(this,u.MEDIA_RENDITION_SELECTED,e)}get mediaHeight(){return ie(this,u.MEDIA_HEIGHT)}set mediaHeight(e){ue(this,u.MEDIA_HEIGHT,e)}}Ju.getSlotTemplateHTML=zy;Ju.getTooltipContentHTML=Zy;f.customElements.get("media-rendition-menu-button")||f.customElements.define("media-rendition-menu-button",Ju);var ec=(t,e,i)=>{if(!e.has(t))throw TypeError("Cannot "+i)},$t=(t,e,i)=>(ec(t,e,"read from private field"),i?i.call(t):e.get(t)),St=(t,e,i)=>{if(e.has(t))throw TypeError("Cannot add the same private member more than once");e instanceof WeakSet?e.add(t):e.set(t,i)},Ov=(t,e,i,a)=>(ec(t,e,"write to private field"),e.set(t,i),i),nt=(t,e,i)=>(ec(t,e,"access private method"),i),ar,bn,Yo,Fi,Wa,tc,Nv,Fs,Ld,Ks,Dd,Pv,So,wo,Vs;function jy(t){return`
      ${lt.getTemplateHTML(t)}
      <style>
        :host {
          --_menu-bg: rgb(20 20 30 / .8);
          background: var(--media-settings-menu-background,
            var(--media-menu-background,
              var(--media-control-background,
                var(--media-secondary-color, var(--_menu-bg)))));
          min-width: var(--media-settings-menu-min-width, 170px);
          border-radius: 2px;
          overflow: hidden;
        }
      </style>
    `}class Uv extends lt{constructor(){super(),St(this,bn),St(this,Fi),St(this,tc),St(this,Fs),St(this,Dd),St(this,ar,!1),St(this,Ks,e=>{const i=e.target,a=i?.nodeName==="VIDEO",r=nt(this,Fs,Ld).call(this,i);(a||r)&&($t(this,ar)?nt(this,Fi,Wa).call(this):nt(this,Dd,Pv).call(this,e))}),St(this,So,e=>{const i=e.target,a=this.contains(i),r=e.button===2,n=i?.nodeName==="VIDEO",s=nt(this,Fs,Ld).call(this,i);a||r&&(n||s)||nt(this,Fi,Wa).call(this)}),St(this,wo,e=>{e.key==="Escape"&&nt(this,Fi,Wa).call(this)}),St(this,Vs,e=>{var i,a;const r=e.target;if((i=r.matches)!=null&&i.call(r,'button[invoke="copy"]')){const n=(a=r.closest("media-context-menu-item"))==null?void 0:a.querySelector('input[slot="copy"]');n&&navigator.clipboard.writeText(n.value)}nt(this,Fi,Wa).call(this)}),this.setAttribute("noautohide",""),nt(this,bn,Yo).call(this)}connectedCallback(){super.connectedCallback(),Be(this).addEventListener("contextmenu",$t(this,Ks)),this.addEventListener("click",$t(this,Vs))}disconnectedCallback(){super.disconnectedCallback(),Be(this).removeEventListener("contextmenu",$t(this,Ks)),this.removeEventListener("click",$t(this,Vs)),document.removeEventListener("mousedown",$t(this,So)),document.removeEventListener("keydown",$t(this,wo))}}ar=new WeakMap;bn=new WeakSet;Yo=function(){this.hidden=!$t(this,ar)};Fi=new WeakSet;Wa=function(){Ov(this,ar,!1),nt(this,bn,Yo).call(this)};tc=new WeakSet;Nv=function(){document.querySelectorAll("media-context-menu").forEach(e=>{var i;e!==this&&nt(i=e,Fi,Wa).call(i)})};Fs=new WeakSet;Ld=function(t){return t?t.hasAttribute("slot")&&t.getAttribute("slot")==="media"?!0:t.nodeName.includes("-")&&t.tagName.includes("-")?t.hasAttribute("src")||t.hasAttribute("poster")||t.hasAttribute("preload")||t.hasAttribute("playsinline"):!1:!1};Ks=new WeakMap;Dd=new WeakSet;Pv=function(t){t.preventDefault(),nt(this,tc,Nv).call(this),Ov(this,ar,!0),this.style.position="fixed",this.style.left=`${t.clientX}px`,this.style.top=`${t.clientY}px`,nt(this,bn,Yo).call(this),document.addEventListener("mousedown",$t(this,So),{once:!0}),document.addEventListener("keydown",$t(this,wo),{once:!0})};So=new WeakMap;wo=new WeakMap;Vs=new WeakMap;Uv.getTemplateHTML=jy;f.customElements.get("media-context-menu")||f.customElements.define("media-context-menu",Uv);function Xy(t){return`
    ${Ii.getTemplateHTML.call(this,t)}
    <style>
        ::slotted(*) {
            color: var(--media-text-color, white);
            text-decoration: none;
            border: none;
            background: none;
            cursor: pointer;
            padding: 0;
            min-height: var(--media-control-height, 24px);
        }
    </style>
  `}class ic extends Ii{}ic.shadowRootOptions={mode:"open"};ic.getTemplateHTML=Xy;f.customElements.get("media-context-menu-item")||f.customElements.define("media-context-menu-item",ic);var $v=t=>{throw TypeError(t)},ac=(t,e,i)=>e.has(t)||$v("Cannot "+i),z=(t,e,i)=>(ac(t,e,"read from private field"),i?i.call(t):e.get(t)),Et=(t,e,i)=>e.has(t)?$v("Cannot add the same private member more than once"):e instanceof WeakSet?e.add(t):e.set(t,i),Yt=(t,e,i,a)=>(ac(t,e,"write to private field"),e.set(t,i),i),Ee=(t,e,i)=>(ac(t,e,"access private method"),i),Go=class{addEventListener(){}removeEventListener(){}dispatchEvent(t){return!0}};if(typeof DocumentFragment>"u"){class t extends Go{}globalThis.DocumentFragment=t}var rc=class extends Go{},Jy=class extends Go{},eT={get(t){},define(t,e,i){},getName(t){return null},upgrade(t){},whenDefined(t){return Promise.resolve(rc)}},qs,tT=class{constructor(e,i={}){Et(this,qs),Yt(this,qs,i?.detail)}get detail(){return z(this,qs)}initCustomEvent(){}};qs=new WeakMap;function iT(t,e){return new rc}var Hv={document:{createElement:iT},DocumentFragment,customElements:eT,CustomEvent:tT,EventTarget:Go,HTMLElement:rc,HTMLVideoElement:Jy},Bv=typeof window>"u"||typeof globalThis.customElements>"u",Wt=Bv?Hv:globalThis,Io=Bv?Hv.document:globalThis.document;function aT(t){let e="";return Object.entries(t).forEach(([i,a])=>{a!=null&&(e+=`${Md(i)}: ${a}; `)}),e?e.trim():void 0}function Md(t){return t.replace(/([a-z])([A-Z])/g,"$1-$2").toLowerCase()}function Wv(t){return t.replace(/[-_]([a-z])/g,(e,i)=>i.toUpperCase())}function ze(t){if(t==null)return;let e=+t;return Number.isNaN(e)?void 0:e}function Fv(t){let e=rT(t).toString();return e?"?"+e:""}function rT(t){let e={};for(let i in t)t[i]!=null&&(e[i]=t[i]);return new URLSearchParams(e)}var Kv=(t,e)=>!t||!e?!1:t.contains(e)?!0:Kv(t,e.getRootNode().host),Vv="mux.com",nT=()=>{try{return"3.10.2"}catch{}return"UNKNOWN"},sT=nT(),qv=()=>sT,oT=(t,{token:e,customDomain:i=Vv,thumbnailTime:a,programTime:r}={})=>{var n;let s=e==null?a:void 0,{aud:o}=(n=Fa(e))!=null?n:{};if(!(e&&o!=="t"))return`https://image.${i}/${t}/thumbnail.webp${Fv({token:e,time:s,program_time:r})}`},lT=(t,{token:e,customDomain:i=Vv,programStartTime:a,programEndTime:r}={})=>{var n;let{aud:s}=(n=Fa(e))!=null?n:{};if(!(e&&s!=="s"))return`https://image.${i}/${t}/storyboard.vtt${Fv({token:e,format:"webp",program_start_time:a,program_end_time:r})}`},nc=t=>{if(t){if([Q.LIVE,Q.ON_DEMAND].includes(t))return t;if(t!=null&&t.includes("live"))return Q.LIVE}},dT={crossorigin:"crossOrigin",playsinline:"playsInline"};function uT(t){var e;return(e=dT[t])!=null?e:Wv(t)}var Na,Pa,He,cT=class{constructor(e,i){Et(this,Na),Et(this,Pa),Et(this,He,[]),Yt(this,Na,e),Yt(this,Pa,i)}[Symbol.iterator](){return z(this,He).values()}get length(){return z(this,He).length}get value(){var e;return(e=z(this,He).join(" "))!=null?e:""}set value(e){var i;e!==this.value&&(Yt(this,He,[]),this.add(...(i=e?.split(" "))!=null?i:[]))}toString(){return this.value}item(e){return z(this,He)[e]}values(){return z(this,He).values()}keys(){return z(this,He).keys()}forEach(e){z(this,He).forEach(e)}add(...e){var i,a;e.forEach(r=>{this.contains(r)||z(this,He).push(r)}),!(this.value===""&&!((i=z(this,Na))!=null&&i.hasAttribute(`${z(this,Pa)}`)))&&((a=z(this,Na))==null||a.setAttribute(`${z(this,Pa)}`,`${this.value}`))}remove(...e){var i;e.forEach(a=>{z(this,He).splice(z(this,He).indexOf(a),1)}),(i=z(this,Na))==null||i.setAttribute(`${z(this,Pa)}`,`${this.value}`)}contains(e){return z(this,He).includes(e)}toggle(e,i){return typeof i<"u"?i?(this.add(e),!0):(this.remove(e),!1):this.contains(e)?(this.remove(e),!1):(this.add(e),!0)}replace(e,i){this.remove(e),this.add(i)}};Na=new WeakMap,Pa=new WeakMap,He=new WeakMap;var Yv=`[mux-player ${qv()}]`;function Jt(...t){console.warn(Yv,...t)}function st(...t){console.error(Yv,...t)}function Gv(t){var e;let i=(e=t.message)!=null?e:"";t.context&&(i+=` ${t.context}`),t.file&&(i+=` ${D("Read more: ")}
https://github.com/muxinc/elements/blob/main/errors/${t.file}`),Jt(i)}var Oe={AUTOPLAY:"autoplay",CROSSORIGIN:"crossorigin",LOOP:"loop",MUTED:"muted",PLAYSINLINE:"playsinline",PRELOAD:"preload"},$i={VOLUME:"volume",PLAYBACKRATE:"playbackrate",MUTED:"muted"},Oh=Object.freeze({length:0,start(t){let e=t>>>0;if(e>=this.length)throw new DOMException(`Failed to execute 'start' on 'TimeRanges': The index provided (${e}) is greater than or equal to the maximum bound (${this.length}).`);return 0},end(t){let e=t>>>0;if(e>=this.length)throw new DOMException(`Failed to execute 'end' on 'TimeRanges': The index provided (${e}) is greater than or equal to the maximum bound (${this.length}).`);return 0}}),hT=Object.values(Oe).filter(t=>Oe.PLAYSINLINE!==t),mT=Object.values($i),pT=[...hT,...mT],vT=class extends Wt.HTMLElement{static get observedAttributes(){return pT}constructor(){super()}attributeChangedCallback(t,e,i){var a,r;switch(t){case $i.MUTED:{this.media&&(this.media.muted=i!=null,this.media.defaultMuted=i!=null);return}case $i.VOLUME:{let n=(a=ze(i))!=null?a:1;this.media&&(this.media.volume=n);return}case $i.PLAYBACKRATE:{let n=(r=ze(i))!=null?r:1;this.media&&(this.media.playbackRate=n,this.media.defaultPlaybackRate=n);return}}}play(){var t,e;return(e=(t=this.media)==null?void 0:t.play())!=null?e:Promise.reject()}pause(){var t;(t=this.media)==null||t.pause()}load(){var t;(t=this.media)==null||t.load()}get media(){var t;return(t=this.shadowRoot)==null?void 0:t.querySelector("mux-video")}get audioTracks(){return this.media.audioTracks}get videoTracks(){return this.media.videoTracks}get audioRenditions(){return this.media.audioRenditions}get videoRenditions(){return this.media.videoRenditions}get paused(){var t,e;return(e=(t=this.media)==null?void 0:t.paused)!=null?e:!0}get duration(){var t,e;return(e=(t=this.media)==null?void 0:t.duration)!=null?e:NaN}get ended(){var t,e;return(e=(t=this.media)==null?void 0:t.ended)!=null?e:!1}get buffered(){var t,e;return(e=(t=this.media)==null?void 0:t.buffered)!=null?e:Oh}get seekable(){var t,e;return(e=(t=this.media)==null?void 0:t.seekable)!=null?e:Oh}get readyState(){var t,e;return(e=(t=this.media)==null?void 0:t.readyState)!=null?e:0}get videoWidth(){var t,e;return(e=(t=this.media)==null?void 0:t.videoWidth)!=null?e:0}get videoHeight(){var t,e;return(e=(t=this.media)==null?void 0:t.videoHeight)!=null?e:0}get currentSrc(){var t,e;return(e=(t=this.media)==null?void 0:t.currentSrc)!=null?e:""}get currentTime(){var t,e;return(e=(t=this.media)==null?void 0:t.currentTime)!=null?e:0}set currentTime(t){this.media&&(this.media.currentTime=Number(t))}get volume(){var t,e;return(e=(t=this.media)==null?void 0:t.volume)!=null?e:1}set volume(t){this.media&&(this.media.volume=Number(t))}get playbackRate(){var t,e;return(e=(t=this.media)==null?void 0:t.playbackRate)!=null?e:1}set playbackRate(t){this.media&&(this.media.playbackRate=Number(t))}get defaultPlaybackRate(){var t;return(t=ze(this.getAttribute($i.PLAYBACKRATE)))!=null?t:1}set defaultPlaybackRate(t){t!=null?this.setAttribute($i.PLAYBACKRATE,`${t}`):this.removeAttribute($i.PLAYBACKRATE)}get crossOrigin(){return gr(this,Oe.CROSSORIGIN)}set crossOrigin(t){this.setAttribute(Oe.CROSSORIGIN,`${t}`)}get autoplay(){return gr(this,Oe.AUTOPLAY)!=null}set autoplay(t){t?this.setAttribute(Oe.AUTOPLAY,typeof t=="string"?t:""):this.removeAttribute(Oe.AUTOPLAY)}get loop(){return gr(this,Oe.LOOP)!=null}set loop(t){t?this.setAttribute(Oe.LOOP,""):this.removeAttribute(Oe.LOOP)}get muted(){var t,e;return(e=(t=this.media)==null?void 0:t.muted)!=null?e:!1}set muted(t){this.media&&(this.media.muted=!!t)}get defaultMuted(){return gr(this,Oe.MUTED)!=null}set defaultMuted(t){t?this.setAttribute(Oe.MUTED,""):this.removeAttribute(Oe.MUTED)}get playsInline(){return gr(this,Oe.PLAYSINLINE)!=null}set playsInline(t){st("playsInline is set to true by default and is not currently supported as a setter.")}get preload(){return this.media?this.media.preload:this.getAttribute("preload")}set preload(t){["","none","metadata","auto"].includes(t)?this.setAttribute(Oe.PRELOAD,t):this.removeAttribute(Oe.PRELOAD)}};function gr(t,e){return t.media?t.media.getAttribute(e):t.getAttribute(e)}var Nh=vT,fT=`:host {
  --media-control-display: var(--controls);
  --media-loading-indicator-display: var(--loading-indicator);
  --media-dialog-display: var(--dialog);
  --media-play-button-display: var(--play-button);
  --media-live-button-display: var(--live-button);
  --media-seek-backward-button-display: var(--seek-backward-button);
  --media-seek-forward-button-display: var(--seek-forward-button);
  --media-mute-button-display: var(--mute-button);
  --media-captions-button-display: var(--captions-button);
  --media-captions-menu-button-display: var(--captions-menu-button, var(--media-captions-button-display));
  --media-rendition-menu-button-display: var(--rendition-menu-button);
  --media-audio-track-menu-button-display: var(--audio-track-menu-button);
  --media-airplay-button-display: var(--airplay-button);
  --media-pip-button-display: var(--pip-button);
  --media-fullscreen-button-display: var(--fullscreen-button);
  --media-cast-button-display: var(--cast-button, var(--_cast-button-drm-display));
  --media-playback-rate-button-display: var(--playback-rate-button);
  --media-playback-rate-menu-button-display: var(--playback-rate-menu-button);
  --media-volume-range-display: var(--volume-range);
  --media-time-range-display: var(--time-range);
  --media-time-display-display: var(--time-display);
  --media-duration-display-display: var(--duration-display);
  --media-title-display-display: var(--title-display);

  display: inline-block;
  line-height: 0;
  width: 100%;
}

a {
  color: #fff;
  font-size: 0.9em;
  text-decoration: underline;
}

media-theme {
  display: inline-block;
  line-height: 0;
  width: 100%;
  height: 100%;
  direction: ltr;
}

media-poster-image {
  display: inline-block;
  line-height: 0;
  width: 100%;
  height: 100%;
}

media-poster-image:not([src]):not([placeholdersrc]) {
  display: none;
}

::part(top),
[part~='top'] {
  --media-control-display: var(--controls, var(--top-controls));
  --media-play-button-display: var(--play-button, var(--top-play-button));
  --media-live-button-display: var(--live-button, var(--top-live-button));
  --media-seek-backward-button-display: var(--seek-backward-button, var(--top-seek-backward-button));
  --media-seek-forward-button-display: var(--seek-forward-button, var(--top-seek-forward-button));
  --media-mute-button-display: var(--mute-button, var(--top-mute-button));
  --media-captions-button-display: var(--captions-button, var(--top-captions-button));
  --media-captions-menu-button-display: var(
    --captions-menu-button,
    var(--media-captions-button-display, var(--top-captions-menu-button))
  );
  --media-rendition-menu-button-display: var(--rendition-menu-button, var(--top-rendition-menu-button));
  --media-audio-track-menu-button-display: var(--audio-track-menu-button, var(--top-audio-track-menu-button));
  --media-airplay-button-display: var(--airplay-button, var(--top-airplay-button));
  --media-pip-button-display: var(--pip-button, var(--top-pip-button));
  --media-fullscreen-button-display: var(--fullscreen-button, var(--top-fullscreen-button));
  --media-cast-button-display: var(--cast-button, var(--top-cast-button, var(--_cast-button-drm-display)));
  --media-playback-rate-button-display: var(--playback-rate-button, var(--top-playback-rate-button));
  --media-playback-rate-menu-button-display: var(
    --captions-menu-button,
    var(--media-playback-rate-button-display, var(--top-playback-rate-menu-button))
  );
  --media-volume-range-display: var(--volume-range, var(--top-volume-range));
  --media-time-range-display: var(--time-range, var(--top-time-range));
  --media-time-display-display: var(--time-display, var(--top-time-display));
  --media-duration-display-display: var(--duration-display, var(--top-duration-display));
  --media-title-display-display: var(--title-display, var(--top-title-display));
}

::part(center),
[part~='center'] {
  --media-control-display: var(--controls, var(--center-controls));
  --media-play-button-display: var(--play-button, var(--center-play-button));
  --media-live-button-display: var(--live-button, var(--center-live-button));
  --media-seek-backward-button-display: var(--seek-backward-button, var(--center-seek-backward-button));
  --media-seek-forward-button-display: var(--seek-forward-button, var(--center-seek-forward-button));
  --media-mute-button-display: var(--mute-button, var(--center-mute-button));
  --media-captions-button-display: var(--captions-button, var(--center-captions-button));
  --media-captions-menu-button-display: var(
    --captions-menu-button,
    var(--media-captions-button-display, var(--center-captions-menu-button))
  );
  --media-rendition-menu-button-display: var(--rendition-menu-button, var(--center-rendition-menu-button));
  --media-audio-track-menu-button-display: var(--audio-track-menu-button, var(--center-audio-track-menu-button));
  --media-airplay-button-display: var(--airplay-button, var(--center-airplay-button));
  --media-pip-button-display: var(--pip-button, var(--center-pip-button));
  --media-fullscreen-button-display: var(--fullscreen-button, var(--center-fullscreen-button));
  --media-cast-button-display: var(--cast-button, var(--center-cast-button, var(--_cast-button-drm-display)));
  --media-playback-rate-button-display: var(--playback-rate-button, var(--center-playback-rate-button));
  --media-playback-rate-menu-button-display: var(
    --playback-rate-menu-button,
    var(--media-playback-rate-button-display, var(--center-playback-rate-menu-button))
  );
  --media-volume-range-display: var(--volume-range, var(--center-volume-range));
  --media-time-range-display: var(--time-range, var(--center-time-range));
  --media-time-display-display: var(--time-display, var(--center-time-display));
  --media-duration-display-display: var(--duration-display, var(--center-duration-display));
}

::part(bottom),
[part~='bottom'] {
  --media-control-display: var(--controls, var(--bottom-controls));
  --media-play-button-display: var(--play-button, var(--bottom-play-button));
  --media-live-button-display: var(--live-button, var(--bottom-live-button));
  --media-seek-backward-button-display: var(--seek-backward-button, var(--bottom-seek-backward-button));
  --media-seek-forward-button-display: var(--seek-forward-button, var(--bottom-seek-forward-button));
  --media-mute-button-display: var(--mute-button, var(--bottom-mute-button));
  --media-captions-button-display: var(--captions-button, var(--bottom-captions-button));
  --media-captions-menu-button-display: var(
    --captions-menu-button,
    var(--media-captions-button-display, var(--bottom-captions-menu-button))
  );
  --media-rendition-menu-button-display: var(--rendition-menu-button, var(--bottom-rendition-menu-button));
  --media-audio-track-menu-button-display: var(--audio-track-menu-button, var(--bottom-audio-track-menu-button));
  --media-airplay-button-display: var(--airplay-button, var(--bottom-airplay-button));
  --media-pip-button-display: var(--pip-button, var(--bottom-pip-button));
  --media-fullscreen-button-display: var(--fullscreen-button, var(--bottom-fullscreen-button));
  --media-cast-button-display: var(--cast-button, var(--bottom-cast-button, var(--_cast-button-drm-display)));
  --media-playback-rate-button-display: var(--playback-rate-button, var(--bottom-playback-rate-button));
  --media-playback-rate-menu-button-display: var(
    --playback-rate-menu-button,
    var(--media-playback-rate-button-display, var(--bottom-playback-rate-menu-button))
  );
  --media-volume-range-display: var(--volume-range, var(--bottom-volume-range));
  --media-time-range-display: var(--time-range, var(--bottom-time-range));
  --media-time-display-display: var(--time-display, var(--bottom-time-display));
  --media-duration-display-display: var(--duration-display, var(--bottom-duration-display));
  --media-title-display-display: var(--title-display, var(--bottom-title-display));
}

:host([no-tooltips]) {
  --media-tooltip-display: none;
}
`,yr=new WeakMap,ET=class Qv{constructor(e,i){this.element=e,this.type=i,this.element.addEventListener(this.type,this);let a=yr.get(this.element);a&&a.set(this.type,this)}set(e){if(typeof e=="function")this.handleEvent=e.bind(this.element);else if(typeof e=="object"&&typeof e.handleEvent=="function")this.handleEvent=e.handleEvent.bind(e);else{this.element.removeEventListener(this.type,this);let i=yr.get(this.element);i&&i.delete(this.type)}}static for(e){yr.has(e.element)||yr.set(e.element,new Map);let i=e.attributeName.slice(2),a=yr.get(e.element);return a&&a.has(i)?a.get(i):new Qv(e.element,i)}};function _T(t,e){return t instanceof gt&&t.attributeName.startsWith("on")?(ET.for(t).set(e),t.element.removeAttributeNS(t.attributeNamespace,t.attributeName),!0):!1}function bT(t,e){return e instanceof zv&&t instanceof or?(e.renderInto(t),!0):!1}function gT(t,e){return e instanceof DocumentFragment&&t instanceof or?(e.childNodes.length&&t.replace(...e.childNodes),!0):!1}function yT(t,e){if(t instanceof gt){let i=t.attributeNamespace,a=t.element.getAttributeNS(i,t.attributeName);return String(e)!==a&&(t.value=String(e)),!0}return t.value=String(e),!0}function TT(t,e){if(t instanceof gt&&e instanceof Element){let i=t.element;return i[t.attributeName]!==e&&(t.element.removeAttributeNS(t.attributeNamespace,t.attributeName),i[t.attributeName]=e),!0}return!1}function AT(t,e){if(typeof e=="boolean"&&t instanceof gt){let i=t.attributeNamespace,a=t.element.hasAttributeNS(i,t.attributeName);return e!==a&&(t.booleanValue=e),!0}return!1}function kT(t,e){return e===!1&&t instanceof or?(t.replace(""),!0):!1}function ST(t,e){TT(t,e)||AT(t,e)||_T(t,e)||kT(t,e)||bT(t,e)||gT(t,e)||yT(t,e)}var El=new Map,Ph=new WeakMap,Uh=new WeakMap,zv=class{constructor(e,i,a){this.strings=e,this.values=i,this.processor=a,this.stringsKey=this.strings.join("")}get template(){if(El.has(this.stringsKey))return El.get(this.stringsKey);{let e=Io.createElement("template"),i=this.strings.length-1;return e.innerHTML=this.strings.reduce((a,r,n)=>a+r+(n<i?`{{ ${n} }}`:""),""),El.set(this.stringsKey,e),e}}renderInto(e){var i;let a=this.template;if(Ph.get(e)!==a){Ph.set(e,a);let n=new Ko(a,this.values,this.processor);Uh.set(e,n),e instanceof or?e.replace(...n.children):e.appendChild(n);return}let r=Uh.get(e);(i=r?.update)==null||i.call(r,this.values)}},wT={processCallback(t,e,i){var a;if(i){for(let[r,n]of e)if(r in i){let s=(a=i[r])!=null?a:"";ST(n,s)}}}};function Ys(t,...e){return new zv(t,e,wT)}function IT(t,e){t.renderInto(e)}var RT=t=>{let{tokens:e}=t;return e.drm?":host(:not([cast-receiver])) { --_cast-button-drm-display: none; }":""},CT=t=>Ys`
  <style>
    ${RT(t)}
    ${fT}
  </style>
  ${xT(t)}
`,LT=t=>{let e=t.hotKeys?`${t.hotKeys}`:"";return nc(t.streamType)==="live"&&(e+=" noarrowleft noarrowright"),e},DT={TOP:"top",CENTER:"center",BOTTOM:"bottom",LAYER:"layer",MEDIA_LAYER:"media-layer",POSTER_LAYER:"poster-layer",VERTICAL_LAYER:"vertical-layer",CENTERED_LAYER:"centered-layer",GESTURE_LAYER:"gesture-layer",CONTROLLER_LAYER:"controller",BUTTON:"button",RANGE:"range",THUMB:"thumb",DISPLAY:"display",CONTROL_BAR:"control-bar",MENU_BUTTON:"menu-button",MENU:"menu",MENU_ITEM:"menu-item",OPTION:"option",POSTER:"poster",LIVE:"live",PLAY:"play",PRE_PLAY:"pre-play",SEEK_BACKWARD:"seek-backward",SEEK_FORWARD:"seek-forward",MUTE:"mute",CAPTIONS:"captions",AIRPLAY:"airplay",PIP:"pip",FULLSCREEN:"fullscreen",CAST:"cast",PLAYBACK_RATE:"playback-rate",VOLUME:"volume",TIME:"time",TITLE:"title",AUDIO_TRACK:"audio-track",RENDITION:"rendition"},MT=Object.values(DT).join(", "),xT=t=>{var e,i,a,r,n,s,o,l,d,m,p,h,c,v,E,g,y,T,_,S,C,N,$,G,J,K,U,Me,Fe,Ke,he,Pe,Tt,Ue,dt,Ve,ke,xe;return Ys`
  <media-theme
    template="${t.themeTemplate||!1}"
    defaultstreamtype="${(e=t.defaultStreamType)!=null?e:!1}"
    hotkeys="${LT(t)||!1}"
    nohotkeys="${t.noHotKeys||!t.hasSrc||!1}"
    noautoseektolive="${!!((i=t.streamType)!=null&&i.includes(Q.LIVE))&&t.targetLiveWindow!==0}"
    novolumepref="${t.novolumepref||!1}"
    nomutedpref="${t.nomutedpref||!1}"
    disabled="${!t.hasSrc||t.isDialogOpen}"
    audio="${(a=t.audio)!=null?a:!1}"
    style="${(r=aT({"--media-primary-color":t.primaryColor,"--media-secondary-color":t.secondaryColor,"--media-accent-color":t.accentColor}))!=null?r:!1}"
    defaultsubtitles="${!t.defaultHiddenCaptions}"
    forwardseekoffset="${(n=t.forwardSeekOffset)!=null?n:!1}"
    backwardseekoffset="${(s=t.backwardSeekOffset)!=null?s:!1}"
    playbackrates="${(o=t.playbackRates)!=null?o:!1}"
    defaultshowremainingtime="${(l=t.defaultShowRemainingTime)!=null?l:!1}"
    defaultduration="${(d=t.defaultDuration)!=null?d:!1}"
    hideduration="${(m=t.hideDuration)!=null?m:!1}"
    title="${(p=t.title)!=null?p:!1}"
    videotitle="${(h=t.videoTitle)!=null?h:!1}"
    proudlydisplaymuxbadge="${(c=t.proudlyDisplayMuxBadge)!=null?c:!1}"
    exportparts="${MT}"
    onclose="${t.onCloseErrorDialog}"
    onfocusin="${t.onFocusInErrorDialog}"
  >
    <mux-video
      slot="media"
      inert="${(v=t.noHotKeys)!=null?v:!1}"
      target-live-window="${(E=t.targetLiveWindow)!=null?E:!1}"
      stream-type="${(g=nc(t.streamType))!=null?g:!1}"
      crossorigin="${(y=t.crossOrigin)!=null?y:""}"
      playsinline
      autoplay="${(T=t.autoplay)!=null?T:!1}"
      muted="${(_=t.muted)!=null?_:!1}"
      loop="${(S=t.loop)!=null?S:!1}"
      preload="${(C=t.preload)!=null?C:!1}"
      debug="${(N=t.debug)!=null?N:!1}"
      prefer-cmcd="${($=t.preferCmcd)!=null?$:!1}"
      disable-tracking="${(G=t.disableTracking)!=null?G:!1}"
      disable-cookies="${(J=t.disableCookies)!=null?J:!1}"
      prefer-playback="${(K=t.preferPlayback)!=null?K:!1}"
      start-time="${t.startTime!=null?t.startTime:!1}"
      beacon-collection-domain="${(U=t.beaconCollectionDomain)!=null?U:!1}"
      player-init-time="${(Me=t.playerInitTime)!=null?Me:!1}"
      player-software-name="${(Fe=t.playerSoftwareName)!=null?Fe:!1}"
      player-software-version="${(Ke=t.playerSoftwareVersion)!=null?Ke:!1}"
      env-key="${(he=t.envKey)!=null?he:!1}"
      custom-domain="${(Pe=t.customDomain)!=null?Pe:!1}"
      src="${t.src?t.src:t.playbackId?Rl(t):!1}"
      cast-src="${t.src?t.src:t.playbackId?Rl(t):!1}"
      cast-receiver="${(Tt=t.castReceiver)!=null?Tt:!1}"
      drm-token="${(dt=(Ue=t.tokens)==null?void 0:Ue.drm)!=null?dt:!1}"
      exportparts="video"
      disable-pseudo-ended="${(Ve=t.disablePseudoEnded)!=null?Ve:!1}"
      max-auto-resolution="${(ke=t.maxAutoResolution)!=null?ke:!1}"
    >
      ${t.storyboard?Ys`<track label="thumbnails" default kind="metadata" src="${t.storyboard}" />`:Ys``}
      <slot></slot>
    </mux-video>
    <slot name="poster" slot="poster">
      <media-poster-image
        part="poster"
        exportparts="poster, img"
        src="${t.poster?t.poster:!1}"
        placeholdersrc="${(xe=t.placeholder)!=null?xe:!1}"
      ></media-poster-image>
    </slot>
  </media-theme>
`},Zv=t=>t.charAt(0).toUpperCase()+t.slice(1),OT=(t,e=!1)=>{var i,a;if(t.muxCode){let r=Zv((i=t.errorCategory)!=null?i:"video"),n=Co((a=t.errorCategory)!=null?a:te.VIDEO);if(t.muxCode===x.NETWORK_OFFLINE)return D("Your device appears to be offline",e);if(t.muxCode===x.NETWORK_TOKEN_EXPIRED)return D("{category} URL has expired",e).format({category:r});if([x.NETWORK_TOKEN_SUB_MISMATCH,x.NETWORK_TOKEN_AUD_MISMATCH,x.NETWORK_TOKEN_AUD_MISSING,x.NETWORK_TOKEN_MALFORMED].includes(t.muxCode))return D("{category} URL is formatted incorrectly",e).format({category:r});if(t.muxCode===x.NETWORK_TOKEN_MISSING)return D("Invalid {categoryName} URL",e).format({categoryName:n});if(t.muxCode===x.NETWORK_NOT_FOUND)return D("{category} does not exist",e).format({category:r});if(t.muxCode===x.NETWORK_NOT_READY){let s=t.streamType==="live"?"Live stream":"Video";return D("{mediaType} is not currently available",e).format({mediaType:s})}}if(t.code){if(t.code===R.MEDIA_ERR_NETWORK)return D("Network Error",e);if(t.code===R.MEDIA_ERR_DECODE)return D("Media Error",e);if(t.code===R.MEDIA_ERR_SRC_NOT_SUPPORTED)return D("Source Not Supported",e)}return D("Error",e)},NT=(t,e=!1)=>{var i,a;if(t.muxCode){let r=Zv((i=t.errorCategory)!=null?i:"video"),n=Co((a=t.errorCategory)!=null?a:te.VIDEO);return t.muxCode===x.NETWORK_OFFLINE?D("Check your internet connection and try reloading this video.",e):t.muxCode===x.NETWORK_TOKEN_EXPIRED?D("The video’s secured {tokenNamePrefix}-token has expired.",e).format({tokenNamePrefix:n}):t.muxCode===x.NETWORK_TOKEN_SUB_MISMATCH?D("The video’s playback ID does not match the one encoded in the {tokenNamePrefix}-token.",e).format({tokenNamePrefix:n}):t.muxCode===x.NETWORK_TOKEN_MALFORMED?D("{category} URL is formatted incorrectly",e).format({category:r}):[x.NETWORK_TOKEN_AUD_MISMATCH,x.NETWORK_TOKEN_AUD_MISSING].includes(t.muxCode)?D("The {tokenNamePrefix}-token is formatted with incorrect information.",e).format({tokenNamePrefix:n}):[x.NETWORK_TOKEN_MISSING,x.NETWORK_INVALID_URL].includes(t.muxCode)?D("The video URL or {tokenNamePrefix}-token are formatted with incorrect or incomplete information.",e).format({tokenNamePrefix:n}):t.muxCode===x.NETWORK_NOT_FOUND?"":t.message}return t.code&&(t.code===R.MEDIA_ERR_NETWORK||t.code===R.MEDIA_ERR_DECODE||(t.code,R.MEDIA_ERR_SRC_NOT_SUPPORTED)),t.message},PT=(t,e=!1)=>{let i=OT(t,e).toString(),a=NT(t,e).toString();return{title:i,message:a}},UT=t=>{if(t.muxCode){if(t.muxCode===x.NETWORK_TOKEN_EXPIRED)return"403-expired-token.md";if(t.muxCode===x.NETWORK_TOKEN_MALFORMED)return"403-malformatted-token.md";if([x.NETWORK_TOKEN_AUD_MISMATCH,x.NETWORK_TOKEN_AUD_MISSING].includes(t.muxCode))return"403-incorrect-aud-value.md";if(t.muxCode===x.NETWORK_TOKEN_SUB_MISMATCH)return"403-playback-id-mismatch.md";if(t.muxCode===x.NETWORK_TOKEN_MISSING)return"missing-signed-tokens.md";if(t.muxCode===x.NETWORK_NOT_FOUND)return"404-not-found.md";if(t.muxCode===x.NETWORK_NOT_READY)return"412-not-playable.md"}if(t.code){if(t.code===R.MEDIA_ERR_NETWORK)return"";if(t.code===R.MEDIA_ERR_DECODE)return"media-decode-error.md";if(t.code===R.MEDIA_ERR_SRC_NOT_SUPPORTED)return"media-src-not-supported.md"}return""},$h=(t,e)=>{let i=UT(t);return{message:t.message,context:t.context,file:i}},$T=`<template id="media-theme-gerwig">
  <style>
    @keyframes pre-play-hide {
      0% {
        transform: scale(1);
        opacity: 1;
      }

      30% {
        transform: scale(0.7);
      }

      100% {
        transform: scale(1.5);
        opacity: 0;
      }
    }

    :host {
      --_primary-color: var(--media-primary-color, #fff);
      --_secondary-color: var(--media-secondary-color, transparent);
      --_accent-color: var(--media-accent-color, #fa50b5);
      --_text-color: var(--media-text-color, #000);

      --media-icon-color: var(--_primary-color);
      --media-control-background: var(--_secondary-color);
      --media-control-hover-background: var(--_accent-color);
      --media-time-buffered-color: rgba(255, 255, 255, 0.4);
      --media-preview-time-text-shadow: none;
      --media-control-height: 14px;
      --media-control-padding: 6px;
      --media-tooltip-container-margin: 6px;
      --media-tooltip-distance: 18px;

      color: var(--_primary-color);
      display: inline-block;
      width: 100%;
      height: 100%;
    }

    :host([audio]) {
      --_secondary-color: var(--media-secondary-color, black);
      --media-preview-time-text-shadow: none;
    }

    :host([audio]) ::slotted([slot='media']) {
      height: 0px;
    }

    :host([audio]) media-loading-indicator {
      display: none;
    }

    :host([audio]) media-controller {
      background: transparent;
    }

    :host([audio]) media-controller::part(vertical-layer) {
      background: transparent;
    }

    :host([audio]) media-control-bar {
      width: 100%;
      background-color: var(--media-control-background);
    }

    /*
     * 0.433s is the transition duration for VTT Regions.
     * Borrowed here, so the captions don't move too fast.
     */
    media-controller {
      --media-webkit-text-track-transform: translateY(0) scale(0.98);
      --media-webkit-text-track-transition: transform 0.433s ease-out 0.3s;
    }
    media-controller:is([mediapaused], :not([userinactive])) {
      --media-webkit-text-track-transform: translateY(-50px) scale(0.98);
      --media-webkit-text-track-transition: transform 0.15s ease;
    }

    /*
     * CSS specific to iOS devices.
     * See: https://stackoverflow.com/questions/30102792/css-media-query-to-target-only-ios-devices/60220757#60220757
     */
    @supports (-webkit-touch-callout: none) {
      /* Disable subtitle adjusting for iOS Safari */
      media-controller[mediaisfullscreen] {
        --media-webkit-text-track-transform: unset;
        --media-webkit-text-track-transition: unset;
      }
    }

    media-time-range {
      --media-box-padding-left: 6px;
      --media-box-padding-right: 6px;
      --media-range-bar-color: var(--_accent-color);
      --media-time-range-buffered-color: var(--_primary-color);
      --media-range-track-color: transparent;
      --media-range-track-background: rgba(255, 255, 255, 0.4);
      --media-range-thumb-background: radial-gradient(
        circle,
        #000 0%,
        #000 25%,
        var(--_accent-color) 25%,
        var(--_accent-color)
      );
      --media-range-thumb-width: 12px;
      --media-range-thumb-height: 12px;
      --media-range-thumb-transform: scale(0);
      --media-range-thumb-transition: transform 0.3s;
      --media-range-thumb-opacity: 1;
      --media-preview-background: var(--_primary-color);
      --media-box-arrow-background: var(--_primary-color);
      --media-preview-thumbnail-border: 5px solid var(--_primary-color);
      --media-preview-border-radius: 5px;
      --media-text-color: var(--_text-color);
      --media-control-hover-background: transparent;
      --media-preview-chapter-text-shadow: none;
      color: var(--_accent-color);
      padding: 0 6px;
    }

    :host([audio]) media-time-range {
      --media-preview-time-padding: 1.5px 6px;
      --media-preview-box-margin: 0 0 -5px;
    }

    media-time-range:hover {
      --media-range-thumb-transform: scale(1);
    }

    media-preview-thumbnail {
      border-bottom-width: 0;
    }

    [part~='menu'] {
      border-radius: 2px;
      border: 1px solid rgba(0, 0, 0, 0.1);
      bottom: 50px;
      padding: 2.5px 10px;
    }

    [part~='menu']::part(indicator) {
      fill: var(--_accent-color);
    }

    [part~='menu']::part(menu-item) {
      box-sizing: border-box;
      display: flex;
      align-items: center;
      padding: 6px 10px;
      min-height: 34px;
    }

    [part~='menu']::part(checked) {
      font-weight: 700;
    }

    media-captions-menu,
    media-rendition-menu,
    media-audio-track-menu,
    media-playback-rate-menu {
      position: absolute; /* ensure they don't take up space in DOM on load */
      --media-menu-background: var(--_primary-color);
      --media-menu-item-checked-background: transparent;
      --media-text-color: var(--_text-color);
      --media-menu-item-hover-background: transparent;
      --media-menu-item-hover-outline: var(--_accent-color) solid 1px;
    }

    media-rendition-menu {
      min-width: 140px;
    }

    /* The icon is a circle so make it 16px high instead of 14px for more balance. */
    media-audio-track-menu-button {
      --media-control-padding: 5px;
      --media-control-height: 16px;
    }

    media-playback-rate-menu-button {
      --media-control-padding: 6px 3px;
      min-width: 4.4ch;
    }

    media-playback-rate-menu {
      --media-menu-flex-direction: row;
      --media-menu-item-checked-background: var(--_accent-color);
      --media-menu-item-checked-indicator-display: none;
      margin-right: 6px;
      padding: 0;
      --media-menu-gap: 0.25em;
    }

    media-playback-rate-menu[part~='menu']::part(menu-item) {
      padding: 6px 6px 6px 8px;
    }

    media-playback-rate-menu[part~='menu']::part(checked) {
      color: #fff;
    }

    :host(:not([audio])) media-time-range {
      /* Adding px is required here for calc() */
      --media-range-padding: 0px;
      background: transparent;
      z-index: 10;
      height: 10px;
      bottom: -3px;
      width: 100%;
    }

    media-control-bar :is([role='button'], [role='switch'], button) {
      line-height: 0;
    }

    media-control-bar :is([part*='button'], [part*='range'], [part*='display']) {
      border-radius: 3px;
    }

    .spacer {
      flex-grow: 1;
      background-color: var(--media-control-background, rgba(20, 20, 30, 0.7));
    }

    media-control-bar[slot~='top-chrome'] {
      min-height: 42px;
      pointer-events: none;
    }

    media-control-bar {
      --gradient-steps:
        hsl(0 0% 0% / 0) 0%, hsl(0 0% 0% / 0.013) 8.1%, hsl(0 0% 0% / 0.049) 15.5%, hsl(0 0% 0% / 0.104) 22.5%,
        hsl(0 0% 0% / 0.175) 29%, hsl(0 0% 0% / 0.259) 35.3%, hsl(0 0% 0% / 0.352) 41.2%, hsl(0 0% 0% / 0.45) 47.1%,
        hsl(0 0% 0% / 0.55) 52.9%, hsl(0 0% 0% / 0.648) 58.8%, hsl(0 0% 0% / 0.741) 64.7%, hsl(0 0% 0% / 0.825) 71%,
        hsl(0 0% 0% / 0.896) 77.5%, hsl(0 0% 0% / 0.951) 84.5%, hsl(0 0% 0% / 0.987) 91.9%, hsl(0 0% 0%) 100%;
    }

    :host([title]) media-control-bar[slot='top-chrome']::before,
    :host([videotitle]) media-control-bar[slot='top-chrome']::before {
      content: '';
      position: absolute;
      width: 100%;
      padding-bottom: min(100px, 25%);
      background: linear-gradient(to top, var(--gradient-steps));
      opacity: 0.8;
      pointer-events: none;
    }

    :host(:not([audio])) media-control-bar[part~='bottom']::before {
      content: '';
      position: absolute;
      width: 100%;
      bottom: 0;
      left: 0;
      padding-bottom: min(100px, 25%);
      background: linear-gradient(to bottom, var(--gradient-steps));
      opacity: 0.8;
      z-index: 1;
      pointer-events: none;
    }

    media-control-bar[part~='bottom'] > * {
      z-index: 20;
    }

    media-control-bar[part~='bottom'] {
      padding: 6px 6px;
    }

    media-control-bar[slot~='top-chrome'] > * {
      --media-control-background: transparent;
      --media-control-hover-background: transparent;
      position: relative;
    }

    media-controller::part(vertical-layer) {
      transition: background-color 1s;
    }

    media-controller:is([mediapaused], :not([userinactive]))::part(vertical-layer) {
      background-color: var(--controls-backdrop-color, var(--controls, transparent));
      transition: background-color 0.25s;
    }

    .center-controls {
      --media-button-icon-width: 100%;
      --media-button-icon-height: auto;
      --media-tooltip-display: none;
      pointer-events: none;
      width: 100%;
      display: flex;
      flex-flow: row;
      align-items: center;
      justify-content: center;
      paint-order: stroke;
      stroke: rgba(102, 102, 102, 1);
      stroke-width: 0.3px;
      text-shadow:
        0 0 2px rgb(0 0 0 / 0.25),
        0 0 6px rgb(0 0 0 / 0.25);
    }

    .center-controls media-play-button {
      --media-control-background: transparent;
      --media-control-hover-background: transparent;
      --media-control-padding: 0;
      width: 40px;
      filter: drop-shadow(0 0 2px rgb(0 0 0 / 0.25)) drop-shadow(0 0 6px rgb(0 0 0 / 0.25));
    }

    [breakpointsm] .center-controls media-play-button {
      width: 90px;
      height: 90px;
      border-radius: 50%;
      transition: background 0.4s;
      padding: 24px;
      --media-control-background: #000;
      --media-control-hover-background: var(--_accent-color);
    }

    .center-controls media-seek-backward-button,
    .center-controls media-seek-forward-button {
      --media-control-background: transparent;
      --media-control-hover-background: transparent;
      padding: 0;
      margin: 0 20px;
      width: max(33px, min(8%, 40px));
      text-shadow:
        0 0 2px rgb(0 0 0 / 0.25),
        0 0 6px rgb(0 0 0 / 0.25);
    }

    [breakpointsm]:not([audio]) .center-controls.pre-playback {
      display: grid;
      align-items: initial;
      justify-content: initial;
      height: 100%;
      overflow: hidden;
    }

    [breakpointsm]:not([audio]) .center-controls.pre-playback media-play-button {
      place-self: var(--_pre-playback-place, center);
      grid-area: 1 / 1;
      margin: 16px;
    }

    /* Show and hide controls or pre-playback state */

    [breakpointsm]:is([mediahasplayed], :not([mediapaused])):not([audio])
      .center-controls.pre-playback
      media-play-button {
      /* Using \`forwards\` would lead to a laggy UI after the animation got in the end state */
      animation: 0.3s linear pre-play-hide;
      opacity: 0;
      pointer-events: none;
    }

    .autoplay-unmute {
      --media-control-hover-background: transparent;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      filter: drop-shadow(0 0 2px rgb(0 0 0 / 0.25)) drop-shadow(0 0 6px rgb(0 0 0 / 0.25));
    }

    .autoplay-unmute-btn {
      --media-control-height: 16px;
      border-radius: 8px;
      background: #000;
      color: var(--_primary-color);
      display: flex;
      align-items: center;
      padding: 8px 16px;
      font-size: 18px;
      font-weight: 500;
      cursor: pointer;
    }

    .autoplay-unmute-btn:hover {
      background: var(--_accent-color);
    }

    [breakpointsm] .autoplay-unmute-btn {
      --media-control-height: 30px;
      padding: 14px 24px;
      font-size: 26px;
    }

    .autoplay-unmute-btn svg {
      margin: 0 6px 0 0;
    }

    [breakpointsm] .autoplay-unmute-btn svg {
      margin: 0 10px 0 0;
    }

    media-controller:not([audio]):not([mediahasplayed]) *:is(media-control-bar, media-time-range) {
      display: none;
    }

    media-error-dialog:not([mediaerrorcode]) {
      opacity: 0;
    }

    media-loading-indicator {
      --media-loading-icon-width: 100%;
      --media-button-icon-height: auto;
      display: var(--media-control-display, var(--media-loading-indicator-display, flex));
      pointer-events: none;
      position: absolute;
      width: min(15%, 150px);
      flex-flow: row;
      align-items: center;
      justify-content: center;
    }

    /* Intentionally don't target the div for transition but the children
     of the div. Prevents messing with media-chrome's autohide feature. */
    media-loading-indicator + div * {
      transition: opacity 0.15s;
      opacity: 1;
    }

    media-loading-indicator[medialoading]:not([mediapaused]) ~ div > * {
      opacity: 0;
      transition-delay: 400ms;
    }

    media-volume-range {
      width: min(100%, 100px);
      --media-range-padding-left: 10px;
      --media-range-padding-right: 10px;
      --media-range-thumb-width: 12px;
      --media-range-thumb-height: 12px;
      --media-range-thumb-background: radial-gradient(
        circle,
        #000 0%,
        #000 25%,
        var(--_primary-color) 25%,
        var(--_primary-color)
      );
      --media-control-hover-background: none;
    }

    media-time-display {
      white-space: nowrap;
    }

    /* Generic style for explicitly disabled controls */
    media-control-bar[part~='bottom'] [disabled],
    media-control-bar[part~='bottom'] [aria-disabled='true'] {
      opacity: 60%;
      cursor: not-allowed;
    }

    media-text-display {
      --media-font-size: 16px;
      --media-control-padding: 14px;
      font-weight: 500;
    }

    media-play-button.animated *:is(g, path) {
      transition: all 0.3s;
    }

    media-play-button.animated[mediapaused] .pause-icon-pt1 {
      opacity: 0;
    }

    media-play-button.animated[mediapaused] .pause-icon-pt2 {
      transform-origin: center center;
      transform: scaleY(0);
    }

    media-play-button.animated[mediapaused] .play-icon {
      clip-path: inset(0 0 0 0);
    }

    media-play-button.animated:not([mediapaused]) .play-icon {
      clip-path: inset(0 0 0 100%);
    }

    media-seek-forward-button,
    media-seek-backward-button {
      --media-font-weight: 400;
    }

    .mute-icon {
      display: inline-block;
    }

    .mute-icon :is(path, g) {
      transition: opacity 0.5s;
    }

    .muted {
      opacity: 0;
    }

    media-mute-button[mediavolumelevel='low'] :is(.volume-medium, .volume-high),
    media-mute-button[mediavolumelevel='medium'] :is(.volume-high) {
      opacity: 0;
    }

    media-mute-button[mediavolumelevel='off'] .unmuted {
      opacity: 0;
    }

    media-mute-button[mediavolumelevel='off'] .muted {
      opacity: 1;
    }

    /**
     * Our defaults for these buttons are to hide them at small sizes
     * users can override this with CSS
     */
    media-controller:not([breakpointsm]):not([audio]) {
      --bottom-play-button: none;
      --bottom-seek-backward-button: none;
      --bottom-seek-forward-button: none;
      --bottom-time-display: none;
      --bottom-playback-rate-menu-button: none;
      --bottom-pip-button: none;
    }

    [part='mux-badge'] {
      position: absolute;
      bottom: 10px;
      right: 10px;
      z-index: 2;
      opacity: 0.6;
      transition:
        opacity 0.2s ease-in-out,
        bottom 0.2s ease-in-out;
    }

    [part='mux-badge']:hover {
      opacity: 1;
    }

    [part='mux-badge'] a {
      font-size: 14px;
      font-family: var(--_font-family);
      color: var(--_primary-color);
      text-decoration: none;
      display: flex;
      align-items: center;
      gap: 5px;
    }

    [part='mux-badge'] .mux-badge-text {
      transition: opacity 0.5s ease-in-out;
      opacity: 0;
    }

    [part='mux-badge'] .mux-badge-logo {
      width: 40px;
      height: auto;
      display: inline-block;
    }

    [part='mux-badge'] .mux-badge-logo svg {
      width: 100%;
      height: 100%;
      fill: white;
    }

    media-controller:not([userinactive]):not([mediahasplayed]) [part='mux-badge'],
    media-controller:not([userinactive]) [part='mux-badge'],
    media-controller[mediahasplayed][mediapaused] [part='mux-badge'] {
      transition: bottom 0.1s ease-in-out;
    }

    media-controller[userinactive]:not([mediapaused]) [part='mux-badge'] {
      transition: bottom 0.2s ease-in-out 0.62s;
    }

    media-controller:not([userinactive]) [part='mux-badge'] .mux-badge-text,
    media-controller[mediahasplayed][mediapaused] [part='mux-badge'] .mux-badge-text {
      opacity: 1;
    }

    media-controller[userinactive]:not([mediapaused]) [part='mux-badge'] .mux-badge-text {
      opacity: 0;
    }

    media-controller[userinactive]:not([mediapaused]) [part='mux-badge'] {
      bottom: 10px;
    }

    media-controller:not([userinactive]):not([mediahasplayed]) [part='mux-badge'] {
      bottom: 10px;
    }

    media-controller:not([userinactive])[mediahasplayed] [part='mux-badge'],
    media-controller[mediahasplayed][mediapaused] [part='mux-badge'] {
      bottom: calc(28px + var(--media-control-height, 0px) + var(--media-control-padding, 0px) * 2);
    }
  </style>

  <template partial="TitleDisplay">
    <template if="videotitle">
      <template if="videotitle != true">
        <media-text-display part="top title display" class="title-display">{{videotitle}}</media-text-display>
      </template>
    </template>
    <template if="!videotitle">
      <template if="title">
        <media-text-display part="top title display" class="title-display">{{title}}</media-text-display>
      </template>
    </template>
  </template>

  <template partial="PlayButton">
    <media-play-button
      part="{{section ?? 'bottom'}} play button"
      disabled="{{disabled}}"
      aria-disabled="{{disabled}}"
      class="animated"
    >
      <svg aria-hidden="true" viewBox="0 0 18 14" slot="icon">
        <g class="play-icon">
          <path
            d="M15.5987 6.2911L3.45577 0.110898C2.83667 -0.204202 2.06287 0.189698 2.06287 0.819798V13.1802C2.06287 13.8103 2.83667 14.2042 3.45577 13.8891L15.5987 7.7089C16.2178 7.3938 16.2178 6.6061 15.5987 6.2911Z"
          />
        </g>
        <g class="pause-icon">
          <path
            class="pause-icon-pt1"
            d="M5.90709 0H2.96889C2.46857 0 2.06299 0.405585 2.06299 0.9059V13.0941C2.06299 13.5944 2.46857 14 2.96889 14H5.90709C6.4074 14 6.81299 13.5944 6.81299 13.0941V0.9059C6.81299 0.405585 6.4074 0 5.90709 0Z"
          />
          <path
            class="pause-icon-pt2"
            d="M15.1571 0H12.2189C11.7186 0 11.313 0.405585 11.313 0.9059V13.0941C11.313 13.5944 11.7186 14 12.2189 14H15.1571C15.6574 14 16.063 13.5944 16.063 13.0941V0.9059C16.063 0.405585 15.6574 0 15.1571 0Z"
          />
        </g>
      </svg>
    </media-play-button>
  </template>

  <template partial="PrePlayButton">
    <media-play-button
      part="{{section ?? 'center'}} play button pre-play"
      disabled="{{disabled}}"
      aria-disabled="{{disabled}}"
    >
      <svg aria-hidden="true" viewBox="0 0 18 14" slot="icon" style="transform: translate(3px, 0)">
        <path
          d="M15.5987 6.2911L3.45577 0.110898C2.83667 -0.204202 2.06287 0.189698 2.06287 0.819798V13.1802C2.06287 13.8103 2.83667 14.2042 3.45577 13.8891L15.5987 7.7089C16.2178 7.3938 16.2178 6.6061 15.5987 6.2911Z"
        />
      </svg>
    </media-play-button>
  </template>

  <template partial="SeekBackwardButton">
    <media-seek-backward-button
      seekoffset="{{backwardseekoffset}}"
      part="{{section ?? 'bottom'}} seek-backward button"
      disabled="{{disabled}}"
      aria-disabled="{{disabled}}"
    >
      <svg viewBox="0 0 22 14" aria-hidden="true" slot="icon">
        <path
          d="M3.65 2.07888L0.0864 6.7279C-0.0288 6.87812 -0.0288 7.12188 0.0864 7.2721L3.65 11.9211C3.7792 12.0896 4 11.9703 4 11.7321V2.26787C4 2.02968 3.7792 1.9104 3.65 2.07888Z"
        />
        <text transform="translate(6 12)" style="font-size: 14px; font-family: 'ArialMT', 'Arial'">
          {{backwardseekoffset}}
        </text>
      </svg>
    </media-seek-backward-button>
  </template>

  <template partial="SeekForwardButton">
    <media-seek-forward-button
      seekoffset="{{forwardseekoffset}}"
      part="{{section ?? 'bottom'}} seek-forward button"
      disabled="{{disabled}}"
      aria-disabled="{{disabled}}"
    >
      <svg viewBox="0 0 22 14" aria-hidden="true" slot="icon">
        <g>
          <text transform="translate(-1 12)" style="font-size: 14px; font-family: 'ArialMT', 'Arial'">
            {{forwardseekoffset}}
          </text>
          <path
            d="M18.35 11.9211L21.9136 7.2721C22.0288 7.12188 22.0288 6.87812 21.9136 6.7279L18.35 2.07888C18.2208 1.91041 18 2.02968 18 2.26787V11.7321C18 11.9703 18.2208 12.0896 18.35 11.9211Z"
          />
        </g>
      </svg>
    </media-seek-forward-button>
  </template>

  <template partial="MuteButton">
    <media-mute-button part="bottom mute button" disabled="{{disabled}}" aria-disabled="{{disabled}}">
      <svg viewBox="0 0 18 14" slot="icon" class="mute-icon" aria-hidden="true">
        <g class="unmuted">
          <path
            d="M6.76786 1.21233L3.98606 3.98924H1.19937C0.593146 3.98924 0.101743 4.51375 0.101743 5.1607V6.96412L0 6.99998L0.101743 7.03583V8.83926C0.101743 9.48633 0.593146 10.0108 1.19937 10.0108H3.98606L6.76773 12.7877C7.23561 13.2547 8 12.9007 8 12.2171V1.78301C8 1.09925 7.23574 0.745258 6.76786 1.21233Z"
          />
          <path
            class="volume-low"
            d="M10 3.54781C10.7452 4.55141 11.1393 5.74511 11.1393 6.99991C11.1393 8.25471 10.7453 9.44791 10 10.4515L10.7988 11.0496C11.6734 9.87201 12.1356 8.47161 12.1356 6.99991C12.1356 5.52821 11.6735 4.12731 10.7988 2.94971L10 3.54781Z"
          />
          <path
            class="volume-medium"
            d="M12.3778 2.40086C13.2709 3.76756 13.7428 5.35806 13.7428 7.00026C13.7428 8.64246 13.2709 10.233 12.3778 11.5992L13.2106 12.1484C14.2107 10.6185 14.739 8.83796 14.739 7.00016C14.739 5.16236 14.2107 3.38236 13.2106 1.85156L12.3778 2.40086Z"
          />
          <path
            class="volume-high"
            d="M15.5981 0.75L14.7478 1.2719C15.7937 2.9919 16.3468 4.9723 16.3468 7C16.3468 9.0277 15.7937 11.0082 14.7478 12.7281L15.5981 13.25C16.7398 11.3722 17.343 9.211 17.343 7C17.343 4.789 16.7398 2.6268 15.5981 0.75Z"
          />
        </g>
        <g class="muted">
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M4.39976 4.98924H1.19937C1.19429 4.98924 1.17777 4.98961 1.15296 5.01609C1.1271 5.04369 1.10174 5.09245 1.10174 5.1607V8.83926C1.10174 8.90761 1.12714 8.95641 1.15299 8.984C1.17779 9.01047 1.1943 9.01084 1.19937 9.01084H4.39977L7 11.6066V2.39357L4.39976 4.98924ZM7.47434 1.92006C7.4743 1.9201 7.47439 1.92002 7.47434 1.92006V1.92006ZM6.76773 12.7877L3.98606 10.0108H1.19937C0.593146 10.0108 0.101743 9.48633 0.101743 8.83926V7.03583L0 6.99998L0.101743 6.96412V5.1607C0.101743 4.51375 0.593146 3.98924 1.19937 3.98924H3.98606L6.76786 1.21233C7.23574 0.745258 8 1.09925 8 1.78301V12.2171C8 12.9007 7.23561 13.2547 6.76773 12.7877Z"
          />
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M15.2677 9.30323C15.463 9.49849 15.7796 9.49849 15.9749 9.30323C16.1701 9.10796 16.1701 8.79138 15.9749 8.59612L14.2071 6.82841L15.9749 5.06066C16.1702 4.8654 16.1702 4.54882 15.9749 4.35355C15.7796 4.15829 15.4631 4.15829 15.2678 4.35355L13.5 6.1213L11.7322 4.35348C11.537 4.15822 11.2204 4.15822 11.0251 4.35348C10.8298 4.54874 10.8298 4.86532 11.0251 5.06058L12.7929 6.82841L11.0251 8.59619C10.8299 8.79146 10.8299 9.10804 11.0251 9.3033C11.2204 9.49856 11.537 9.49856 11.7323 9.3033L13.5 7.53552L15.2677 9.30323Z"
          />
        </g>
      </svg>
    </media-mute-button>
  </template>

  <template partial="PipButton">
    <media-pip-button part="bottom pip button" disabled="{{disabled}}" aria-disabled="{{disabled}}">
      <svg viewBox="0 0 18 14" aria-hidden="true" slot="icon">
        <path
          d="M15.9891 0H2.011C0.9004 0 0 0.9003 0 2.0109V11.989C0 13.0996 0.9004 14 2.011 14H15.9891C17.0997 14 18 13.0997 18 11.9891V2.0109C18 0.9003 17.0997 0 15.9891 0ZM17 11.9891C17 12.5465 16.5465 13 15.9891 13H2.011C1.4536 13 1.0001 12.5465 1.0001 11.9891V2.0109C1.0001 1.4535 1.4536 0.9999 2.011 0.9999H15.9891C16.5465 0.9999 17 1.4535 17 2.0109V11.9891Z"
        />
        <path
          d="M15.356 5.67822H8.19523C8.03253 5.67822 7.90063 5.81012 7.90063 5.97282V11.3836C7.90063 11.5463 8.03253 11.6782 8.19523 11.6782H15.356C15.5187 11.6782 15.6506 11.5463 15.6506 11.3836V5.97282C15.6506 5.81012 15.5187 5.67822 15.356 5.67822Z"
        />
      </svg>
    </media-pip-button>
  </template>

  <template partial="CaptionsMenu">
    <media-captions-menu-button part="bottom captions button">
      <svg aria-hidden="true" viewBox="0 0 18 14" slot="on">
        <path
          d="M15.989 0H2.011C0.9004 0 0 0.9003 0 2.0109V11.9891C0 13.0997 0.9004 14 2.011 14H15.989C17.0997 14 18 13.0997 18 11.9891V2.0109C18 0.9003 17.0997 0 15.989 0ZM4.2292 8.7639C4.5954 9.1902 5.0935 9.4031 5.7233 9.4031C6.1852 9.4031 6.5544 9.301 6.8302 9.0969C7.1061 8.8933 7.2863 8.614 7.3702 8.26H8.4322C8.3062 8.884 8.0093 9.3733 7.5411 9.7273C7.0733 10.0813 6.4703 10.2581 5.732 10.2581C5.108 10.2581 4.5699 10.1219 4.1168 9.8489C3.6637 9.5759 3.3141 9.1946 3.0685 8.7058C2.8224 8.2165 2.6994 7.6511 2.6994 7.009C2.6994 6.3611 2.8224 5.7927 3.0685 5.3034C3.3141 4.8146 3.6637 4.4323 4.1168 4.1559C4.5699 3.88 5.108 3.7418 5.732 3.7418C6.4703 3.7418 7.0733 3.922 7.5411 4.2818C8.0094 4.6422 8.3062 5.1461 8.4322 5.794H7.3702C7.2862 5.4283 7.106 5.1368 6.8302 4.921C6.5544 4.7052 6.1852 4.5968 5.7233 4.5968C5.0934 4.5968 4.5954 4.8116 4.2292 5.2404C3.8635 5.6696 3.6804 6.259 3.6804 7.009C3.6804 7.7531 3.8635 8.3381 4.2292 8.7639ZM11.0974 8.7639C11.4636 9.1902 11.9617 9.4031 12.5915 9.4031C13.0534 9.4031 13.4226 9.301 13.6984 9.0969C13.9743 8.8933 14.1545 8.614 14.2384 8.26H15.3004C15.1744 8.884 14.8775 9.3733 14.4093 9.7273C13.9415 10.0813 13.3385 10.2581 12.6002 10.2581C11.9762 10.2581 11.4381 10.1219 10.985 9.8489C10.5319 9.5759 10.1823 9.1946 9.9367 8.7058C9.6906 8.2165 9.5676 7.6511 9.5676 7.009C9.5676 6.3611 9.6906 5.7927 9.9367 5.3034C10.1823 4.8146 10.5319 4.4323 10.985 4.1559C11.4381 3.88 11.9762 3.7418 12.6002 3.7418C13.3385 3.7418 13.9415 3.922 14.4093 4.2818C14.8776 4.6422 15.1744 5.1461 15.3004 5.794H14.2384C14.1544 5.4283 13.9742 5.1368 13.6984 4.921C13.4226 4.7052 13.0534 4.5968 12.5915 4.5968C11.9616 4.5968 11.4636 4.8116 11.0974 5.2404C10.7317 5.6696 10.5486 6.259 10.5486 7.009C10.5486 7.7531 10.7317 8.3381 11.0974 8.7639Z"
        />
      </svg>
      <svg aria-hidden="true" viewBox="0 0 18 14" slot="off">
        <path
          d="M5.73219 10.258C5.10819 10.258 4.57009 10.1218 4.11699 9.8488C3.66389 9.5758 3.31429 9.1945 3.06869 8.7057C2.82259 8.2164 2.69958 7.651 2.69958 7.0089C2.69958 6.361 2.82259 5.7926 3.06869 5.3033C3.31429 4.8145 3.66389 4.4322 4.11699 4.1558C4.57009 3.8799 5.10819 3.7417 5.73219 3.7417C6.47049 3.7417 7.07348 3.9219 7.54128 4.2817C8.00958 4.6421 8.30638 5.146 8.43238 5.7939H7.37039C7.28639 5.4282 7.10618 5.1367 6.83039 4.9209C6.55459 4.7051 6.18538 4.5967 5.72348 4.5967C5.09358 4.5967 4.59559 4.8115 4.22939 5.2403C3.86369 5.6695 3.68058 6.2589 3.68058 7.0089C3.68058 7.753 3.86369 8.338 4.22939 8.7638C4.59559 9.1901 5.09368 9.403 5.72348 9.403C6.18538 9.403 6.55459 9.3009 6.83039 9.0968C7.10629 8.8932 7.28649 8.6139 7.37039 8.2599H8.43238C8.30638 8.8839 8.00948 9.3732 7.54128 9.7272C7.07348 10.0812 6.47049 10.258 5.73219 10.258Z"
        />
        <path
          d="M12.6003 10.258C11.9763 10.258 11.4382 10.1218 10.9851 9.8488C10.532 9.5758 10.1824 9.1945 9.93685 8.7057C9.69075 8.2164 9.56775 7.651 9.56775 7.0089C9.56775 6.361 9.69075 5.7926 9.93685 5.3033C10.1824 4.8145 10.532 4.4322 10.9851 4.1558C11.4382 3.8799 11.9763 3.7417 12.6003 3.7417C13.3386 3.7417 13.9416 3.9219 14.4094 4.2817C14.8777 4.6421 15.1745 5.146 15.3005 5.7939H14.2385C14.1545 5.4282 13.9743 5.1367 13.6985 4.9209C13.4227 4.7051 13.0535 4.5967 12.5916 4.5967C11.9617 4.5967 11.4637 4.8115 11.0975 5.2403C10.7318 5.6695 10.5487 6.2589 10.5487 7.0089C10.5487 7.753 10.7318 8.338 11.0975 8.7638C11.4637 9.1901 11.9618 9.403 12.5916 9.403C13.0535 9.403 13.4227 9.3009 13.6985 9.0968C13.9744 8.8932 14.1546 8.6139 14.2385 8.2599H15.3005C15.1745 8.8839 14.8776 9.3732 14.4094 9.7272C13.9416 10.0812 13.3386 10.258 12.6003 10.258Z"
        />
        <path
          d="M15.9891 1C16.5465 1 17 1.4535 17 2.011V11.9891C17 12.5465 16.5465 13 15.9891 13H2.0109C1.4535 13 1 12.5465 1 11.9891V2.0109C1 1.4535 1.4535 0.9999 2.0109 0.9999L15.9891 1ZM15.9891 0H2.0109C0.9003 0 0 0.9003 0 2.0109V11.9891C0 13.0997 0.9003 14 2.0109 14H15.9891C17.0997 14 18 13.0997 18 11.9891V2.0109C18 0.9003 17.0997 0 15.9891 0Z"
        />
      </svg>
    </media-captions-menu-button>
    <media-captions-menu
      hidden
      anchor="auto"
      part="bottom captions menu"
      disabled="{{disabled}}"
      aria-disabled="{{disabled}}"
      exportparts="menu-item"
    >
      <div slot="checked-indicator">
        <style>
          .indicator {
            position: relative;
            top: 1px;
            width: 0.9em;
            height: auto;
            fill: var(--_accent-color);
            margin-right: 5px;
          }

          [aria-checked='false'] .indicator {
            display: none;
          }
        </style>
        <svg viewBox="0 0 14 18" class="indicator">
          <path
            d="M12.252 3.48c-.115.033-.301.161-.425.291-.059.063-1.407 1.815-2.995 3.894s-2.897 3.79-2.908 3.802c-.013.014-.661-.616-1.672-1.624-.908-.905-1.702-1.681-1.765-1.723-.401-.27-.783-.211-1.176.183a1.285 1.285 0 0 0-.261.342.582.582 0 0 0-.082.35c0 .165.01.205.08.35.075.153.213.296 2.182 2.271 1.156 1.159 2.17 2.159 2.253 2.222.189.143.338.196.539.194.203-.003.412-.104.618-.299.205-.193 6.7-8.693 6.804-8.903a.716.716 0 0 0 .085-.345c.01-.179.005-.203-.062-.339-.124-.252-.45-.531-.746-.639a.784.784 0 0 0-.469-.027"
            fill-rule="evenodd"
          />
        </svg></div
    ></media-captions-menu>
  </template>

  <template partial="AirplayButton">
    <media-airplay-button part="bottom airplay button" disabled="{{disabled}}" aria-disabled="{{disabled}}">
      <svg viewBox="0 0 18 14" aria-hidden="true" slot="icon">
        <path
          d="M16.1383 0H1.8618C0.8335 0 0 0.8335 0 1.8617V10.1382C0 11.1664 0.8335 12 1.8618 12H3.076C3.1204 11.9433 3.1503 11.8785 3.2012 11.826L4.004 11H1.8618C1.3866 11 1 10.6134 1 10.1382V1.8617C1 1.3865 1.3866 0.9999 1.8618 0.9999H16.1383C16.6135 0.9999 17.0001 1.3865 17.0001 1.8617V10.1382C17.0001 10.6134 16.6135 11 16.1383 11H13.9961L14.7989 11.826C14.8499 11.8785 14.8798 11.9432 14.9241 12H16.1383C17.1665 12 18.0001 11.1664 18.0001 10.1382V1.8617C18 0.8335 17.1665 0 16.1383 0Z"
        />
        <path
          d="M9.55061 8.21903C9.39981 8.06383 9.20001 7.98633 9.00011 7.98633C8.80021 7.98633 8.60031 8.06383 8.44951 8.21903L4.09771 12.697C3.62471 13.1838 3.96961 13.9998 4.64831 13.9998H13.3518C14.0304 13.9998 14.3754 13.1838 13.9023 12.697L9.55061 8.21903Z"
        />
      </svg>
    </media-airplay-button>
  </template>

  <template partial="FullscreenButton">
    <media-fullscreen-button part="bottom fullscreen button" disabled="{{disabled}}" aria-disabled="{{disabled}}">
      <svg viewBox="0 0 18 14" aria-hidden="true" slot="enter">
        <path
          d="M1.00745 4.39539L1.01445 1.98789C1.01605 1.43049 1.47085 0.978289 2.02835 0.979989L6.39375 0.992589L6.39665 -0.007411L2.03125 -0.020011C0.920646 -0.023211 0.0176463 0.874489 0.0144463 1.98509L0.00744629 4.39539H1.00745Z"
        />
        <path
          d="M17.0144 2.03431L17.0076 4.39541H18.0076L18.0144 2.03721C18.0176 0.926712 17.1199 0.0237125 16.0093 0.0205125L11.6439 0.0078125L11.641 1.00781L16.0064 1.02041C16.5638 1.02201 17.016 1.47681 17.0144 2.03431Z"
        />
        <path
          d="M16.9925 9.60498L16.9855 12.0124C16.9839 12.5698 16.5291 13.022 15.9717 13.0204L11.6063 13.0078L11.6034 14.0078L15.9688 14.0204C17.0794 14.0236 17.9823 13.1259 17.9855 12.0153L17.9925 9.60498H16.9925Z"
        />
        <path
          d="M0.985626 11.9661L0.992426 9.60498H-0.0074737L-0.0142737 11.9632C-0.0174737 13.0738 0.880226 13.9767 1.99083 13.98L6.35623 13.9926L6.35913 12.9926L1.99373 12.98C1.43633 12.9784 0.983926 12.5236 0.985626 11.9661Z"
        />
      </svg>
      <svg viewBox="0 0 18 14" aria-hidden="true" slot="exit">
        <path
          d="M5.39655 -0.0200195L5.38955 2.38748C5.38795 2.94488 4.93315 3.39708 4.37565 3.39538L0.0103463 3.38278L0.00744629 4.38278L4.37285 4.39538C5.48345 4.39858 6.38635 3.50088 6.38965 2.39028L6.39665 -0.0200195H5.39655Z"
        />
        <path
          d="M12.6411 2.36891L12.6479 0.0078125H11.6479L11.6411 2.36601C11.6379 3.47651 12.5356 4.37951 13.6462 4.38271L18.0116 4.39531L18.0145 3.39531L13.6491 3.38271C13.0917 3.38111 12.6395 2.92641 12.6411 2.36891Z"
        />
        <path
          d="M12.6034 14.0204L12.6104 11.613C12.612 11.0556 13.0668 10.6034 13.6242 10.605L17.9896 10.6176L17.9925 9.61759L13.6271 9.60499C12.5165 9.60179 11.6136 10.4995 11.6104 11.6101L11.6034 14.0204H12.6034Z"
        />
        <path
          d="M5.359 11.6315L5.3522 13.9926H6.3522L6.359 11.6344C6.3622 10.5238 5.4645 9.62088 4.3539 9.61758L-0.0115043 9.60498L-0.0144043 10.605L4.351 10.6176C4.9084 10.6192 5.3607 11.074 5.359 11.6315Z"
        />
      </svg>
    </media-fullscreen-button>
  </template>

  <template partial="CastButton">
    <media-cast-button part="bottom cast button" disabled="{{disabled}}" aria-disabled="{{disabled}}">
      <svg viewBox="0 0 18 14" aria-hidden="true" slot="enter">
        <path
          d="M16.0072 0H2.0291C0.9185 0 0.0181 0.9003 0.0181 2.011V5.5009C0.357 5.5016 0.6895 5.5275 1.0181 5.5669V2.011C1.0181 1.4536 1.4716 1 2.029 1H16.0072C16.5646 1 17.0181 1.4536 17.0181 2.011V11.9891C17.0181 12.5465 16.5646 13 16.0072 13H8.4358C8.4746 13.3286 8.4999 13.6611 8.4999 13.9999H16.0071C17.1177 13.9999 18.018 13.0996 18.018 11.989V2.011C18.0181 0.9003 17.1178 0 16.0072 0ZM0 6.4999V7.4999C3.584 7.4999 6.5 10.4159 6.5 13.9999H7.5C7.5 9.8642 4.1357 6.4999 0 6.4999ZM0 8.7499V9.7499C2.3433 9.7499 4.25 11.6566 4.25 13.9999H5.25C5.25 11.1049 2.895 8.7499 0 8.7499ZM0.0181 11V14H3.0181C3.0181 12.3431 1.675 11 0.0181 11Z"
        />
      </svg>
      <svg viewBox="0 0 18 14" aria-hidden="true" slot="exit">
        <path
          d="M15.9891 0H2.01103C0.900434 0 3.35947e-05 0.9003 3.35947e-05 2.011V5.5009C0.338934 5.5016 0.671434 5.5275 1.00003 5.5669V2.011C1.00003 1.4536 1.45353 1 2.01093 1H15.9891C16.5465 1 17 1.4536 17 2.011V11.9891C17 12.5465 16.5465 13 15.9891 13H8.41773C8.45653 13.3286 8.48183 13.6611 8.48183 13.9999H15.989C17.0996 13.9999 17.9999 13.0996 17.9999 11.989V2.011C18 0.9003 17.0997 0 15.9891 0ZM-0.0180664 6.4999V7.4999C3.56593 7.4999 6.48193 10.4159 6.48193 13.9999H7.48193C7.48193 9.8642 4.11763 6.4999 -0.0180664 6.4999ZM-0.0180664 8.7499V9.7499C2.32523 9.7499 4.23193 11.6566 4.23193 13.9999H5.23193C5.23193 11.1049 2.87693 8.7499 -0.0180664 8.7499ZM3.35947e-05 11V14H3.00003C3.00003 12.3431 1.65693 11 3.35947e-05 11Z"
        />
        <path d="M2.15002 5.634C5.18352 6.4207 7.57252 8.8151 8.35282 11.8499H15.8501V2.1499H2.15002V5.634Z" />
      </svg>
    </media-cast-button>
  </template>

  <template partial="LiveButton">
    <media-live-button part="{{section ?? 'top'}} live button" disabled="{{disabled}}" aria-disabled="{{disabled}}">
      <span slot="text">Live</span>
    </media-live-button>
  </template>

  <template partial="PlaybackRateMenu">
    <media-playback-rate-menu-button part="bottom playback-rate button"></media-playback-rate-menu-button>
    <media-playback-rate-menu
      hidden
      anchor="auto"
      rates="{{playbackrates}}"
      exportparts="menu-item"
      part="bottom playback-rate menu"
      disabled="{{disabled}}"
      aria-disabled="{{disabled}}"
    ></media-playback-rate-menu>
  </template>

  <template partial="VolumeRange">
    <media-volume-range
      part="bottom volume range"
      disabled="{{disabled}}"
      aria-disabled="{{disabled}}"
    ></media-volume-range>
  </template>

  <template partial="TimeDisplay">
    <media-time-display
      remaining="{{defaultshowremainingtime}}"
      showduration="{{!hideduration}}"
      part="bottom time display"
      disabled="{{disabled}}"
      aria-disabled="{{disabled}}"
    ></media-time-display>
  </template>

  <template partial="TimeRange">
    <media-time-range part="bottom time range" disabled="{{disabled}}" aria-disabled="{{disabled}}" exportparts="thumb">
      <media-preview-thumbnail slot="preview"></media-preview-thumbnail>
      <media-preview-chapter-display slot="preview"></media-preview-chapter-display>
      <media-preview-time-display slot="preview"></media-preview-time-display>
      <div slot="preview" part="arrow"></div>
    </media-time-range>
  </template>

  <template partial="AudioTrackMenu">
    <media-audio-track-menu-button part="bottom audio-track button">
      <svg aria-hidden="true" slot="icon" viewBox="0 0 18 16">
        <path d="M9 15A7 7 0 1 1 9 1a7 7 0 0 1 0 14Zm0 1A8 8 0 1 0 9 0a8 8 0 0 0 0 16Z" />
        <path
          d="M5.2 6.3a.5.5 0 0 1 .5.5v2.4a.5.5 0 1 1-1 0V6.8a.5.5 0 0 1 .5-.5Zm2.4-2.4a.5.5 0 0 1 .5.5v7.2a.5.5 0 0 1-1 0V4.4a.5.5 0 0 1 .5-.5ZM10 5.5a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm2.4-.8a.5.5 0 0 1 .5.5v5.6a.5.5 0 0 1-1 0V5.2a.5.5 0 0 1 .5-.5Z"
        />
      </svg>
    </media-audio-track-menu-button>
    <media-audio-track-menu
      hidden
      anchor="auto"
      part="bottom audio-track menu"
      disabled="{{disabled}}"
      aria-disabled="{{disabled}}"
      exportparts="menu-item"
    >
      <div slot="checked-indicator">
        <style>
          .indicator {
            position: relative;
            top: 1px;
            width: 0.9em;
            height: auto;
            fill: var(--_accent-color);
            margin-right: 5px;
          }

          [aria-checked='false'] .indicator {
            display: none;
          }
        </style>
        <svg viewBox="0 0 14 18" class="indicator">
          <path
            d="M12.252 3.48c-.115.033-.301.161-.425.291-.059.063-1.407 1.815-2.995 3.894s-2.897 3.79-2.908 3.802c-.013.014-.661-.616-1.672-1.624-.908-.905-1.702-1.681-1.765-1.723-.401-.27-.783-.211-1.176.183a1.285 1.285 0 0 0-.261.342.582.582 0 0 0-.082.35c0 .165.01.205.08.35.075.153.213.296 2.182 2.271 1.156 1.159 2.17 2.159 2.253 2.222.189.143.338.196.539.194.203-.003.412-.104.618-.299.205-.193 6.7-8.693 6.804-8.903a.716.716 0 0 0 .085-.345c.01-.179.005-.203-.062-.339-.124-.252-.45-.531-.746-.639a.784.784 0 0 0-.469-.027"
            fill-rule="evenodd"
          />
        </svg>
      </div>
    </media-audio-track-menu>
  </template>

  <template partial="RenditionMenu">
    <media-rendition-menu-button part="bottom rendition button">
      <svg aria-hidden="true" slot="icon" viewBox="0 0 18 14">
        <path
          d="M2.25 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM9 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm6.75 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"
        />
      </svg>
    </media-rendition-menu-button>
    <media-rendition-menu
      hidden
      anchor="auto"
      part="bottom rendition menu"
      disabled="{{disabled}}"
      aria-disabled="{{disabled}}"
    >
      <div slot="checked-indicator">
        <style>
          .indicator {
            position: relative;
            top: 1px;
            width: 0.9em;
            height: auto;
            fill: var(--_accent-color);
            margin-right: 5px;
          }

          [aria-checked='false'] .indicator {
            opacity: 0;
          }
        </style>
        <svg viewBox="0 0 14 18" class="indicator">
          <path
            d="M12.252 3.48c-.115.033-.301.161-.425.291-.059.063-1.407 1.815-2.995 3.894s-2.897 3.79-2.908 3.802c-.013.014-.661-.616-1.672-1.624-.908-.905-1.702-1.681-1.765-1.723-.401-.27-.783-.211-1.176.183a1.285 1.285 0 0 0-.261.342.582.582 0 0 0-.082.35c0 .165.01.205.08.35.075.153.213.296 2.182 2.271 1.156 1.159 2.17 2.159 2.253 2.222.189.143.338.196.539.194.203-.003.412-.104.618-.299.205-.193 6.7-8.693 6.804-8.903a.716.716 0 0 0 .085-.345c.01-.179.005-.203-.062-.339-.124-.252-.45-.531-.746-.639a.784.784 0 0 0-.469-.027"
            fill-rule="evenodd"
          />
        </svg>
      </div>
    </media-rendition-menu>
  </template>

  <template partial="MuxBadge">
    <div part="mux-badge">
      <a href="https://www.mux.com/player" target="_blank">
        <span class="mux-badge-text">Powered by</span>
        <div class="mux-badge-logo">
          <svg
            viewBox="0 0 1600 500"
            style="fill-rule: evenodd; clip-rule: evenodd; stroke-linejoin: round; stroke-miterlimit: 2"
          >
            <g>
              <path
                d="M994.287,93.486c-17.121,-0 -31,-13.879 -31,-31c0,-17.121 13.879,-31 31,-31c17.121,-0 31,13.879 31,31c0,17.121 -13.879,31 -31,31m0,-93.486c-34.509,-0 -62.484,27.976 -62.484,62.486l0,187.511c0,68.943 -56.09,125.033 -125.032,125.033c-68.942,-0 -125.03,-56.09 -125.03,-125.033l0,-187.511c0,-34.51 -27.976,-62.486 -62.485,-62.486c-34.509,-0 -62.484,27.976 -62.484,62.486l0,187.511c0,137.853 112.149,250.003 249.999,250.003c137.851,-0 250.001,-112.15 250.001,-250.003l0,-187.511c0,-34.51 -27.976,-62.486 -62.485,-62.486"
                style="fill-rule: nonzero"
              ></path>
              <path
                d="M1537.51,468.511c-17.121,-0 -31,-13.879 -31,-31c0,-17.121 13.879,-31 31,-31c17.121,-0 31,13.879 31,31c0,17.121 -13.879,31 -31,31m-275.883,-218.509l-143.33,143.329c-24.402,24.402 -24.402,63.966 0,88.368c24.402,24.402 63.967,24.402 88.369,-0l143.33,-143.329l143.328,143.329c24.402,24.4 63.967,24.402 88.369,-0c24.403,-24.402 24.403,-63.966 0.001,-88.368l-143.33,-143.329l0.001,-0.004l143.329,-143.329c24.402,-24.402 24.402,-63.965 0,-88.367c-24.402,-24.402 -63.967,-24.402 -88.369,-0l-143.329,143.328l-143.329,-143.328c-24.402,-24.401 -63.967,-24.402 -88.369,-0c-24.402,24.402 -24.402,63.965 0,88.367l143.329,143.329l0,0.004Z"
                style="fill-rule: nonzero"
              ></path>
              <path
                d="M437.511,468.521c-17.121,-0 -31,-13.879 -31,-31c0,-17.121 13.879,-31 31,-31c17.121,-0 31,13.879 31,31c0,17.121 -13.879,31 -31,31m23.915,-463.762c-23.348,-9.672 -50.226,-4.327 -68.096,13.544l-143.331,143.329l-143.33,-143.329c-17.871,-17.871 -44.747,-23.216 -68.096,-13.544c-23.349,9.671 -38.574,32.455 -38.574,57.729l0,375.026c0,34.51 27.977,62.486 62.487,62.486c34.51,-0 62.486,-27.976 62.486,-62.486l0,-224.173l80.843,80.844c24.404,24.402 63.965,24.402 88.369,-0l80.843,-80.844l0,224.173c0,34.51 27.976,62.486 62.486,62.486c34.51,-0 62.486,-27.976 62.486,-62.486l0,-375.026c0,-25.274 -15.224,-48.058 -38.573,-57.729"
                style="fill-rule: nonzero"
              ></path>
            </g>
          </svg>
        </div>
      </a>
    </div>
  </template>

  <media-controller
    part="controller"
    defaultstreamtype="{{defaultstreamtype ?? 'on-demand'}}"
    breakpoints="sm:470"
    gesturesdisabled="{{disabled}}"
    hotkeys="{{hotkeys}}"
    nohotkeys="{{nohotkeys}}"
    novolumepref="{{novolumepref}}"
    audio="{{audio}}"
    noautoseektolive="{{noautoseektolive}}"
    defaultsubtitles="{{defaultsubtitles}}"
    defaultduration="{{defaultduration ?? false}}"
    keyboardforwardseekoffset="{{forwardseekoffset}}"
    keyboardbackwardseekoffset="{{backwardseekoffset}}"
    exportparts="layer, media-layer, poster-layer, vertical-layer, centered-layer, gesture-layer"
    style="--_pre-playback-place:{{preplaybackplace ?? 'center'}}"
  >
    <slot name="media" slot="media"></slot>
    <slot name="poster" slot="poster"></slot>

    <media-loading-indicator slot="centered-chrome" noautohide></media-loading-indicator>

    <template if="!audio">
      <media-error-dialog slot="dialog" noautohide></media-error-dialog>
      <!-- Pre-playback UI -->
      <!-- same for both on-demand and live -->
      <div slot="centered-chrome" class="center-controls pre-playback">
        <template if="!breakpointsm">{{>PlayButton section="center"}}</template>
        <template if="breakpointsm">{{>PrePlayButton section="center"}}</template>
      </div>

      <!-- Mux Badge -->
      <template if="proudlydisplaymuxbadge"> {{>MuxBadge}} </template>

      <!-- Autoplay centered unmute button -->
      <!--
        todo: figure out how show this with available state variables
        needs to show when:
        - autoplay is enabled
        - playback has been successful
        - audio is muted
        - in place / instead of the pre-plaback play button
        - not to show again after user has interacted with this button
          - OR user has interacted with the mute button in the control bar
      -->
      <!--
        There should be a >MuteButton to the left of the "Unmute" text, but a templating bug
        makes it appear even if commented out in the markup, add it back when code is un-commented
      -->
      <!-- <div slot="centered-chrome" class="autoplay-unmute">
        <div role="button" class="autoplay-unmute-btn">Unmute</div>
      </div> -->

      <template if="streamtype == 'on-demand'">
        <template if="breakpointsm">
          <media-control-bar part="control-bar top" slot="top-chrome">{{>TitleDisplay}} </media-control-bar>
        </template>
        {{>TimeRange}}
        <media-control-bar part="control-bar bottom">
          {{>PlayButton}} {{>SeekBackwardButton}} {{>SeekForwardButton}} {{>TimeDisplay}} {{>MuteButton}}
          {{>VolumeRange}}
          <div class="spacer"></div>
          {{>RenditionMenu}} {{>PlaybackRateMenu}} {{>AudioTrackMenu}} {{>CaptionsMenu}} {{>AirplayButton}}
          {{>CastButton}} {{>PipButton}} {{>FullscreenButton}}
        </media-control-bar>
      </template>

      <template if="streamtype == 'live'">
        <media-control-bar part="control-bar top" slot="top-chrome">
          {{>LiveButton}}
          <template if="breakpointsm"> {{>TitleDisplay}} </template>
        </media-control-bar>
        <template if="targetlivewindow > 0">{{>TimeRange}}</template>
        <media-control-bar part="control-bar bottom">
          {{>PlayButton}}
          <template if="targetlivewindow > 0">{{>SeekBackwardButton}} {{>SeekForwardButton}}</template>
          {{>MuteButton}} {{>VolumeRange}}
          <div class="spacer"></div>
          {{>RenditionMenu}} {{>AudioTrackMenu}} {{>CaptionsMenu}} {{>AirplayButton}} {{>CastButton}} {{>PipButton}}
          {{>FullscreenButton}}
        </media-control-bar>
      </template>
    </template>

    <template if="audio">
      <template if="streamtype == 'on-demand'">
        <template if="title">
          <media-control-bar part="control-bar top">{{>TitleDisplay}}</media-control-bar>
        </template>
        <media-control-bar part="control-bar bottom">
          {{>PlayButton}}
          <template if="breakpointsm"> {{>SeekBackwardButton}} {{>SeekForwardButton}} </template>
          {{>MuteButton}}
          <template if="breakpointsm">{{>VolumeRange}}</template>
          {{>TimeDisplay}} {{>TimeRange}}
          <template if="breakpointsm">{{>PlaybackRateMenu}}</template>
          {{>AirplayButton}} {{>CastButton}}
        </media-control-bar>
      </template>

      <template if="streamtype == 'live'">
        <template if="title">
          <media-control-bar part="control-bar top">{{>TitleDisplay}}</media-control-bar>
        </template>
        <media-control-bar part="control-bar bottom">
          {{>PlayButton}} {{>LiveButton section="bottom"}} {{>MuteButton}}
          <template if="breakpointsm">
            {{>VolumeRange}}
            <template if="targetlivewindow > 0"> {{>SeekBackwardButton}} {{>SeekForwardButton}} </template>
          </template>
          <template if="targetlivewindow > 0"> {{>TimeDisplay}} {{>TimeRange}} </template>
          <template if="!targetlivewindow"><div class="spacer"></div></template>
          {{>AirplayButton}} {{>CastButton}}
        </media-control-bar>
      </template>
    </template>

    <slot></slot>
  </media-controller>
</template>
`,xd=Io.createElement("template");"innerHTML"in xd&&(xd.innerHTML=$T);var Hh,Bh,jv=class extends Vo{};jv.template=(Bh=(Hh=xd.content)==null?void 0:Hh.children)==null?void 0:Bh[0];Wt.customElements.get("media-theme-gerwig")||Wt.customElements.define("media-theme-gerwig",jv);var HT="gerwig",jt={SRC:"src",POSTER:"poster"},A={STYLE:"style",DEFAULT_HIDDEN_CAPTIONS:"default-hidden-captions",PRIMARY_COLOR:"primary-color",SECONDARY_COLOR:"secondary-color",ACCENT_COLOR:"accent-color",FORWARD_SEEK_OFFSET:"forward-seek-offset",BACKWARD_SEEK_OFFSET:"backward-seek-offset",PLAYBACK_TOKEN:"playback-token",THUMBNAIL_TOKEN:"thumbnail-token",STORYBOARD_TOKEN:"storyboard-token",FULLSCREEN_ELEMENT:"fullscreen-element",DRM_TOKEN:"drm-token",STORYBOARD_SRC:"storyboard-src",THUMBNAIL_TIME:"thumbnail-time",AUDIO:"audio",NOHOTKEYS:"nohotkeys",HOTKEYS:"hotkeys",PLAYBACK_RATES:"playbackrates",DEFAULT_SHOW_REMAINING_TIME:"default-show-remaining-time",DEFAULT_DURATION:"default-duration",TITLE:"title",VIDEO_TITLE:"video-title",PLACEHOLDER:"placeholder",THEME:"theme",DEFAULT_STREAM_TYPE:"default-stream-type",TARGET_LIVE_WINDOW:"target-live-window",EXTRA_SOURCE_PARAMS:"extra-source-params",NO_VOLUME_PREF:"no-volume-pref",NO_MUTED_PREF:"no-muted-pref",CAST_RECEIVER:"cast-receiver",NO_TOOLTIPS:"no-tooltips",PROUDLY_DISPLAY_MUX_BADGE:"proudly-display-mux-badge",DISABLE_PSEUDO_ENDED:"disable-pseudo-ended"},Od=["audio","backwardseekoffset","defaultduration","defaultshowremainingtime","defaultsubtitles","noautoseektolive","disabled","exportparts","forwardseekoffset","hideduration","hotkeys","nohotkeys","playbackrates","defaultstreamtype","streamtype","style","targetlivewindow","template","title","videotitle","novolumepref","nomutedpref","proudlydisplaymuxbadge"];function BT(t,e){var i,a,r;return{src:!t.playbackId&&t.src,playbackId:t.playbackId,hasSrc:!!t.playbackId||!!t.src||!!t.currentSrc,poster:t.poster,storyboard:((i=t.media)==null?void 0:i.currentSrc)&&t.storyboard,storyboardSrc:t.getAttribute(A.STORYBOARD_SRC),fullscreenElement:t.getAttribute(A.FULLSCREEN_ELEMENT),placeholder:t.getAttribute("placeholder"),themeTemplate:FT(t),thumbnailTime:!t.tokens.thumbnail&&t.thumbnailTime,autoplay:t.autoplay,crossOrigin:t.crossOrigin,loop:t.loop,noHotKeys:t.hasAttribute(A.NOHOTKEYS),hotKeys:t.getAttribute(A.HOTKEYS),muted:t.muted,paused:t.paused,preload:t.preload,envKey:t.envKey,preferCmcd:t.preferCmcd,debug:t.debug,disableTracking:t.disableTracking,disableCookies:t.disableCookies,tokens:t.tokens,beaconCollectionDomain:t.beaconCollectionDomain,maxResolution:t.maxResolution,minResolution:t.minResolution,maxAutoResolution:t.maxAutoResolution,programStartTime:t.programStartTime,programEndTime:t.programEndTime,assetStartTime:t.assetStartTime,assetEndTime:t.assetEndTime,renditionOrder:t.renditionOrder,metadata:t.metadata,playerInitTime:t.playerInitTime,playerSoftwareName:t.playerSoftwareName,playerSoftwareVersion:t.playerSoftwareVersion,startTime:t.startTime,preferPlayback:t.preferPlayback,audio:t.audio,defaultStreamType:t.defaultStreamType,targetLiveWindow:t.getAttribute(b.TARGET_LIVE_WINDOW),streamType:nc(t.getAttribute(b.STREAM_TYPE)),primaryColor:t.getAttribute(A.PRIMARY_COLOR),secondaryColor:t.getAttribute(A.SECONDARY_COLOR),accentColor:t.getAttribute(A.ACCENT_COLOR),forwardSeekOffset:t.forwardSeekOffset,backwardSeekOffset:t.backwardSeekOffset,defaultHiddenCaptions:t.defaultHiddenCaptions,defaultDuration:t.defaultDuration,defaultShowRemainingTime:t.defaultShowRemainingTime,hideDuration:KT(t),playbackRates:t.getAttribute(A.PLAYBACK_RATES),customDomain:(a=t.getAttribute(b.CUSTOM_DOMAIN))!=null?a:void 0,title:t.getAttribute(A.TITLE),videoTitle:(r=t.getAttribute(A.VIDEO_TITLE))!=null?r:t.getAttribute(A.TITLE),novolumepref:t.hasAttribute(A.NO_VOLUME_PREF),nomutedpref:t.hasAttribute(A.NO_MUTED_PREF),proudlyDisplayMuxBadge:t.hasAttribute(A.PROUDLY_DISPLAY_MUX_BADGE),castReceiver:t.castReceiver,disablePseudoEnded:t.hasAttribute(A.DISABLE_PSEUDO_ENDED),...e,extraSourceParams:t.extraSourceParams}}var WT=Kp.formatErrorMessage;Kp.formatErrorMessage=t=>{var e,i;if(t instanceof R){let a=PT(t,!1);return`
      ${a!=null&&a.title?`<h3>${a.title}</h3>`:""}
      ${a!=null&&a.message||a!=null&&a.linkUrl?`<p>
        ${a?.message}
        ${a!=null&&a.linkUrl?`<a
              href="${a.linkUrl}"
              target="_blank"
              rel="external noopener"
              aria-label="${(e=a.linkText)!=null?e:""} ${D("(opens in a new window)")}"
              >${(i=a.linkText)!=null?i:a.linkUrl}</a
            >`:""}
      </p>`:""}
    `}return WT(t)};function FT(t){var e,i;let a=t.theme;if(a){let r=(i=(e=t.getRootNode())==null?void 0:e.getElementById)==null?void 0:i.call(e,a);if(r&&r instanceof HTMLTemplateElement)return r;a.startsWith("media-theme-")||(a=`media-theme-${a}`);let n=Wt.customElements.get(a);if(n!=null&&n.template)return n.template}}function KT(t){var e;let i=(e=t.mediaController)==null?void 0:e.querySelector("media-time-display");return i&&getComputedStyle(i).getPropertyValue("--media-duration-display-display").trim()==="none"}function Wh(t){let e=t.videoTitle?{video_title:t.videoTitle}:{};return t.getAttributeNames().filter(i=>i.startsWith("metadata-")).reduce((i,a)=>{let r=t.getAttribute(a);return r!==null&&(i[a.replace(/^metadata-/,"").replace(/-/g,"_")]=r),i},e)}var VT=Object.values(b),qT=Object.values(jt),YT=Object.values(A),Fh=qv(),Kh="mux-player",Vh={isDialogOpen:!1},GT={redundant_streams:!0},Gs,Qs,zs,Hi,Zs,Za,le,_i,Xv,Nd,Bi,qh,Yh,Gh,Qh,QT=class extends Nh{constructor(){super(),Et(this,le),Et(this,Gs),Et(this,Qs,!1),Et(this,zs,{}),Et(this,Hi,!0),Et(this,Zs,new cT(this,"hotkeys")),Et(this,Za,{...Vh,onCloseErrorDialog:t=>{var e;((e=t.composedPath()[0])==null?void 0:e.localName)==="media-error-dialog"&&Ee(this,le,Nd).call(this,{isDialogOpen:!1})},onFocusInErrorDialog:t=>{var e;((e=t.composedPath()[0])==null?void 0:e.localName)==="media-error-dialog"&&(Kv(this,Io.activeElement)||t.preventDefault())}}),Yt(this,Gs,Yd()),this.attachShadow({mode:"open"}),Ee(this,le,Xv).call(this),this.isConnected&&Ee(this,le,_i).call(this)}static get NAME(){return Kh}static get VERSION(){return Fh}static get observedAttributes(){var t;return[...(t=Nh.observedAttributes)!=null?t:[],...qT,...VT,...YT]}get mediaTheme(){var t;return(t=this.shadowRoot)==null?void 0:t.querySelector("media-theme")}get mediaController(){var t,e;return(e=(t=this.mediaTheme)==null?void 0:t.shadowRoot)==null?void 0:e.querySelector("media-controller")}connectedCallback(){let t=this.media;t&&(t.metadata=Wh(this))}attributeChangedCallback(t,e,i){switch(Ee(this,le,_i).call(this),super.attributeChangedCallback(t,e,i),t){case A.HOTKEYS:z(this,Zs).value=i;break;case A.THUMBNAIL_TIME:{i!=null&&this.tokens.thumbnail&&Jt(D("Use of thumbnail-time with thumbnail-token is currently unsupported. Ignore thumbnail-time.").toString());break}case A.THUMBNAIL_TOKEN:{if(i){let a=Fa(i);if(a){let{aud:r}=a,n=Gr.THUMBNAIL;r!==n&&Jt(D("The {tokenNamePrefix}-token has an incorrect aud value: {aud}. aud value should be {expectedAud}.").format({aud:r,expectedAud:n,tokenNamePrefix:"thumbnail"}))}}break}case A.STORYBOARD_TOKEN:{if(i){let a=Fa(i);if(a){let{aud:r}=a,n=Gr.STORYBOARD;r!==n&&Jt(D("The {tokenNamePrefix}-token has an incorrect aud value: {aud}. aud value should be {expectedAud}.").format({aud:r,expectedAud:n,tokenNamePrefix:"storyboard"}))}}break}case A.DRM_TOKEN:{if(i){let a=Fa(i);if(a){let{aud:r}=a,n=Gr.DRM;r!==n&&Jt(D("The {tokenNamePrefix}-token has an incorrect aud value: {aud}. aud value should be {expectedAud}.").format({aud:r,expectedAud:n,tokenNamePrefix:"drm"}))}}break}case b.PLAYBACK_ID:{i!=null&&i.includes("?token")&&st(D("The specificed playback ID {playbackId} contains a token which must be provided via the playback-token attribute.").format({playbackId:i}));break}case b.STREAM_TYPE:{i&&![Q.LIVE,Q.ON_DEMAND,Q.UNKNOWN].includes(i)?["ll-live","live:dvr","ll-live:dvr"].includes(this.streamType)?this.targetLiveWindow=i.includes("dvr")?Number.POSITIVE_INFINITY:0:Gv({file:"invalid-stream-type.md",message:D("Invalid stream-type value supplied: `{streamType}`. Please provide stream-type as either: `on-demand` or `live`").format({streamType:this.streamType})}):i===Q.LIVE?this.getAttribute(A.TARGET_LIVE_WINDOW)==null&&(this.targetLiveWindow=0):this.targetLiveWindow=Number.NaN;break}case A.FULLSCREEN_ELEMENT:{if(i!=null||i!==e){let a=Io.getElementById(i),r=a?.querySelector("mux-player");this.mediaController&&a&&r&&(this.mediaController.fullscreenElement=a)}break}}[b.PLAYBACK_ID,jt.SRC,A.PLAYBACK_TOKEN].includes(t)&&e!==i&&Yt(this,Za,{...z(this,Za),...Vh}),Ee(this,le,Bi).call(this,{[uT(t)]:i})}async requestFullscreen(t){var e;if(!(!this.mediaController||this.mediaController.hasAttribute(u.MEDIA_IS_FULLSCREEN)))return(e=this.mediaController)==null||e.dispatchEvent(new Wt.CustomEvent(I.MEDIA_ENTER_FULLSCREEN_REQUEST,{composed:!0,bubbles:!0})),new Promise((i,a)=>{var r;(r=this.mediaController)==null||r.addEventListener(ri.MEDIA_IS_FULLSCREEN,()=>i(),{once:!0})})}async exitFullscreen(){var t;if(!(!this.mediaController||!this.mediaController.hasAttribute(u.MEDIA_IS_FULLSCREEN)))return(t=this.mediaController)==null||t.dispatchEvent(new Wt.CustomEvent(I.MEDIA_EXIT_FULLSCREEN_REQUEST,{composed:!0,bubbles:!0})),new Promise((e,i)=>{var a;(a=this.mediaController)==null||a.addEventListener(ri.MEDIA_IS_FULLSCREEN,()=>e(),{once:!0})})}get preferCmcd(){var t;return(t=this.getAttribute(b.PREFER_CMCD))!=null?t:void 0}set preferCmcd(t){t!==this.preferCmcd&&(t?to.includes(t)?this.setAttribute(b.PREFER_CMCD,t):Jt(`Invalid value for preferCmcd. Must be one of ${to.join()}`):this.removeAttribute(b.PREFER_CMCD))}get hasPlayed(){var t,e;return(e=(t=this.mediaController)==null?void 0:t.hasAttribute(u.MEDIA_HAS_PLAYED))!=null?e:!1}get inLiveWindow(){var t;return(t=this.mediaController)==null?void 0:t.hasAttribute(u.MEDIA_TIME_IS_LIVE)}get _hls(){var t;return(t=this.media)==null?void 0:t._hls}get mux(){var t;return(t=this.media)==null?void 0:t.mux}get theme(){var t;return(t=this.getAttribute(A.THEME))!=null?t:HT}set theme(t){this.setAttribute(A.THEME,`${t}`)}get themeProps(){let t=this.mediaTheme;if(!t)return;let e={};for(let i of t.getAttributeNames()){if(Od.includes(i))continue;let a=t.getAttribute(i);e[Wv(i)]=a===""?!0:a}return e}set themeProps(t){var e,i;Ee(this,le,_i).call(this);let a={...this.themeProps,...t};for(let r in a){if(Od.includes(r))continue;let n=t?.[r];typeof n=="boolean"||n==null?(e=this.mediaTheme)==null||e.toggleAttribute(Md(r),!!n):(i=this.mediaTheme)==null||i.setAttribute(Md(r),n)}}get playbackId(){var t;return(t=this.getAttribute(b.PLAYBACK_ID))!=null?t:void 0}set playbackId(t){t?this.setAttribute(b.PLAYBACK_ID,t):this.removeAttribute(b.PLAYBACK_ID)}get src(){var t,e;return this.playbackId?(t=Di(this,jt.SRC))!=null?t:void 0:(e=this.getAttribute(jt.SRC))!=null?e:void 0}set src(t){t?this.setAttribute(jt.SRC,t):this.removeAttribute(jt.SRC)}get poster(){var t;let e=this.getAttribute(jt.POSTER);if(e!=null)return e;let{tokens:i}=this;if(i.playback&&!i.thumbnail){Jt("Missing expected thumbnail token. No poster image will be shown");return}if(this.playbackId&&!this.audio)return oT(this.playbackId,{customDomain:this.customDomain,thumbnailTime:(t=this.thumbnailTime)!=null?t:this.startTime,programTime:this.programStartTime,token:i.thumbnail})}set poster(t){t||t===""?this.setAttribute(jt.POSTER,t):this.removeAttribute(jt.POSTER)}get storyboardSrc(){var t;return(t=this.getAttribute(A.STORYBOARD_SRC))!=null?t:void 0}set storyboardSrc(t){t?this.setAttribute(A.STORYBOARD_SRC,t):this.removeAttribute(A.STORYBOARD_SRC)}get storyboard(){let{tokens:t}=this;if(this.storyboardSrc&&!t.storyboard)return this.storyboardSrc;if(!(this.audio||!this.playbackId||!this.streamType||[Q.LIVE,Q.UNKNOWN].includes(this.streamType)||t.playback&&!t.storyboard))return lT(this.playbackId,{customDomain:this.customDomain,token:t.storyboard,programStartTime:this.programStartTime,programEndTime:this.programEndTime})}get audio(){return this.hasAttribute(A.AUDIO)}set audio(t){if(!t){this.removeAttribute(A.AUDIO);return}this.setAttribute(A.AUDIO,"")}get hotkeys(){return z(this,Zs)}get nohotkeys(){return this.hasAttribute(A.NOHOTKEYS)}set nohotkeys(t){if(!t){this.removeAttribute(A.NOHOTKEYS);return}this.setAttribute(A.NOHOTKEYS,"")}get thumbnailTime(){return ze(this.getAttribute(A.THUMBNAIL_TIME))}set thumbnailTime(t){this.setAttribute(A.THUMBNAIL_TIME,`${t}`)}get videoTitle(){var t,e;return(e=(t=this.getAttribute(A.VIDEO_TITLE))!=null?t:this.getAttribute(A.TITLE))!=null?e:""}set videoTitle(t){t!==this.videoTitle&&(t?this.setAttribute(A.VIDEO_TITLE,t):this.removeAttribute(A.VIDEO_TITLE))}get placeholder(){var t;return(t=Di(this,A.PLACEHOLDER))!=null?t:""}set placeholder(t){this.setAttribute(A.PLACEHOLDER,`${t}`)}get primaryColor(){var t,e;let i=this.getAttribute(A.PRIMARY_COLOR);if(i!=null||this.mediaTheme&&(i=(e=(t=Wt.getComputedStyle(this.mediaTheme))==null?void 0:t.getPropertyValue("--_primary-color"))==null?void 0:e.trim(),i))return i}set primaryColor(t){this.setAttribute(A.PRIMARY_COLOR,`${t}`)}get secondaryColor(){var t,e;let i=this.getAttribute(A.SECONDARY_COLOR);if(i!=null||this.mediaTheme&&(i=(e=(t=Wt.getComputedStyle(this.mediaTheme))==null?void 0:t.getPropertyValue("--_secondary-color"))==null?void 0:e.trim(),i))return i}set secondaryColor(t){this.setAttribute(A.SECONDARY_COLOR,`${t}`)}get accentColor(){var t,e;let i=this.getAttribute(A.ACCENT_COLOR);if(i!=null||this.mediaTheme&&(i=(e=(t=Wt.getComputedStyle(this.mediaTheme))==null?void 0:t.getPropertyValue("--_accent-color"))==null?void 0:e.trim(),i))return i}set accentColor(t){this.setAttribute(A.ACCENT_COLOR,`${t}`)}get defaultShowRemainingTime(){return this.hasAttribute(A.DEFAULT_SHOW_REMAINING_TIME)}set defaultShowRemainingTime(t){t?this.setAttribute(A.DEFAULT_SHOW_REMAINING_TIME,""):this.removeAttribute(A.DEFAULT_SHOW_REMAINING_TIME)}get playbackRates(){if(this.hasAttribute(A.PLAYBACK_RATES))return this.getAttribute(A.PLAYBACK_RATES).trim().split(/\s*,?\s+/).map(t=>Number(t)).filter(t=>!Number.isNaN(t)).sort((t,e)=>t-e)}set playbackRates(t){if(!t){this.removeAttribute(A.PLAYBACK_RATES);return}this.setAttribute(A.PLAYBACK_RATES,t.join(" "))}get forwardSeekOffset(){var t;return(t=ze(this.getAttribute(A.FORWARD_SEEK_OFFSET)))!=null?t:10}set forwardSeekOffset(t){this.setAttribute(A.FORWARD_SEEK_OFFSET,`${t}`)}get backwardSeekOffset(){var t;return(t=ze(this.getAttribute(A.BACKWARD_SEEK_OFFSET)))!=null?t:10}set backwardSeekOffset(t){this.setAttribute(A.BACKWARD_SEEK_OFFSET,`${t}`)}get defaultHiddenCaptions(){return this.hasAttribute(A.DEFAULT_HIDDEN_CAPTIONS)}set defaultHiddenCaptions(t){t?this.setAttribute(A.DEFAULT_HIDDEN_CAPTIONS,""):this.removeAttribute(A.DEFAULT_HIDDEN_CAPTIONS)}get defaultDuration(){return ze(this.getAttribute(A.DEFAULT_DURATION))}set defaultDuration(t){t==null?this.removeAttribute(A.DEFAULT_DURATION):this.setAttribute(A.DEFAULT_DURATION,`${t}`)}get playerInitTime(){return this.hasAttribute(b.PLAYER_INIT_TIME)?ze(this.getAttribute(b.PLAYER_INIT_TIME)):z(this,Gs)}set playerInitTime(t){t!=this.playerInitTime&&(t==null?this.removeAttribute(b.PLAYER_INIT_TIME):this.setAttribute(b.PLAYER_INIT_TIME,`${+t}`))}get playerSoftwareName(){var t;return(t=this.getAttribute(b.PLAYER_SOFTWARE_NAME))!=null?t:Kh}get playerSoftwareVersion(){var t;return(t=this.getAttribute(b.PLAYER_SOFTWARE_VERSION))!=null?t:Fh}get beaconCollectionDomain(){var t;return(t=this.getAttribute(b.BEACON_COLLECTION_DOMAIN))!=null?t:void 0}set beaconCollectionDomain(t){t!==this.beaconCollectionDomain&&(t?this.setAttribute(b.BEACON_COLLECTION_DOMAIN,t):this.removeAttribute(b.BEACON_COLLECTION_DOMAIN))}get maxResolution(){var t;return(t=this.getAttribute(b.MAX_RESOLUTION))!=null?t:void 0}set maxResolution(t){t!==this.maxResolution&&(t?this.setAttribute(b.MAX_RESOLUTION,t):this.removeAttribute(b.MAX_RESOLUTION))}get minResolution(){var t;return(t=this.getAttribute(b.MIN_RESOLUTION))!=null?t:void 0}set minResolution(t){t!==this.minResolution&&(t?this.setAttribute(b.MIN_RESOLUTION,t):this.removeAttribute(b.MIN_RESOLUTION))}get maxAutoResolution(){var t;return(t=this.getAttribute(b.MAX_AUTO_RESOLUTION))!=null?t:void 0}set maxAutoResolution(t){t==null?this.removeAttribute(b.MAX_AUTO_RESOLUTION):this.setAttribute(b.MAX_AUTO_RESOLUTION,t)}get renditionOrder(){var t;return(t=this.getAttribute(b.RENDITION_ORDER))!=null?t:void 0}set renditionOrder(t){t!==this.renditionOrder&&(t?this.setAttribute(b.RENDITION_ORDER,t):this.removeAttribute(b.RENDITION_ORDER))}get programStartTime(){return ze(this.getAttribute(b.PROGRAM_START_TIME))}set programStartTime(t){t==null?this.removeAttribute(b.PROGRAM_START_TIME):this.setAttribute(b.PROGRAM_START_TIME,`${t}`)}get programEndTime(){return ze(this.getAttribute(b.PROGRAM_END_TIME))}set programEndTime(t){t==null?this.removeAttribute(b.PROGRAM_END_TIME):this.setAttribute(b.PROGRAM_END_TIME,`${t}`)}get assetStartTime(){return ze(this.getAttribute(b.ASSET_START_TIME))}set assetStartTime(t){t==null?this.removeAttribute(b.ASSET_START_TIME):this.setAttribute(b.ASSET_START_TIME,`${t}`)}get assetEndTime(){return ze(this.getAttribute(b.ASSET_END_TIME))}set assetEndTime(t){t==null?this.removeAttribute(b.ASSET_END_TIME):this.setAttribute(b.ASSET_END_TIME,`${t}`)}get extraSourceParams(){return this.hasAttribute(A.EXTRA_SOURCE_PARAMS)?[...new URLSearchParams(this.getAttribute(A.EXTRA_SOURCE_PARAMS)).entries()].reduce((t,[e,i])=>(t[e]=i,t),{}):GT}set extraSourceParams(t){t==null?this.removeAttribute(A.EXTRA_SOURCE_PARAMS):this.setAttribute(A.EXTRA_SOURCE_PARAMS,new URLSearchParams(t).toString())}get customDomain(){var t;return(t=this.getAttribute(b.CUSTOM_DOMAIN))!=null?t:void 0}set customDomain(t){t!==this.customDomain&&(t?this.setAttribute(b.CUSTOM_DOMAIN,t):this.removeAttribute(b.CUSTOM_DOMAIN))}get envKey(){var t;return(t=Di(this,b.ENV_KEY))!=null?t:void 0}set envKey(t){this.setAttribute(b.ENV_KEY,`${t}`)}get noVolumePref(){return this.hasAttribute(A.NO_VOLUME_PREF)}set noVolumePref(t){t?this.setAttribute(A.NO_VOLUME_PREF,""):this.removeAttribute(A.NO_VOLUME_PREF)}get noMutedPref(){return this.hasAttribute(A.NO_MUTED_PREF)}set noMutedPref(t){t?this.setAttribute(A.NO_MUTED_PREF,""):this.removeAttribute(A.NO_MUTED_PREF)}get debug(){return Di(this,b.DEBUG)!=null}set debug(t){t?this.setAttribute(b.DEBUG,""):this.removeAttribute(b.DEBUG)}get disableTracking(){return Di(this,b.DISABLE_TRACKING)!=null}set disableTracking(t){this.toggleAttribute(b.DISABLE_TRACKING,!!t)}get disableCookies(){return Di(this,b.DISABLE_COOKIES)!=null}set disableCookies(t){t?this.setAttribute(b.DISABLE_COOKIES,""):this.removeAttribute(b.DISABLE_COOKIES)}get streamType(){var t,e,i;return(i=(e=this.getAttribute(b.STREAM_TYPE))!=null?e:(t=this.media)==null?void 0:t.streamType)!=null?i:Q.UNKNOWN}set streamType(t){this.setAttribute(b.STREAM_TYPE,`${t}`)}get defaultStreamType(){var t,e,i;return(i=(e=this.getAttribute(A.DEFAULT_STREAM_TYPE))!=null?e:(t=this.mediaController)==null?void 0:t.getAttribute(A.DEFAULT_STREAM_TYPE))!=null?i:Q.ON_DEMAND}set defaultStreamType(t){t?this.setAttribute(A.DEFAULT_STREAM_TYPE,t):this.removeAttribute(A.DEFAULT_STREAM_TYPE)}get targetLiveWindow(){var t,e;return this.hasAttribute(A.TARGET_LIVE_WINDOW)?+this.getAttribute(A.TARGET_LIVE_WINDOW):(e=(t=this.media)==null?void 0:t.targetLiveWindow)!=null?e:Number.NaN}set targetLiveWindow(t){t==this.targetLiveWindow||Number.isNaN(t)&&Number.isNaN(this.targetLiveWindow)||(t==null?this.removeAttribute(A.TARGET_LIVE_WINDOW):this.setAttribute(A.TARGET_LIVE_WINDOW,`${+t}`))}get liveEdgeStart(){var t;return(t=this.media)==null?void 0:t.liveEdgeStart}get startTime(){return ze(Di(this,b.START_TIME))}set startTime(t){this.setAttribute(b.START_TIME,`${t}`)}get preferPlayback(){let t=this.getAttribute(b.PREFER_PLAYBACK);if(t===Ft.MSE||t===Ft.NATIVE)return t}set preferPlayback(t){t!==this.preferPlayback&&(t===Ft.MSE||t===Ft.NATIVE?this.setAttribute(b.PREFER_PLAYBACK,t):this.removeAttribute(b.PREFER_PLAYBACK))}get metadata(){var t;return(t=this.media)==null?void 0:t.metadata}set metadata(t){if(Ee(this,le,_i).call(this),!this.media){st("underlying media element missing when trying to set metadata. metadata will not be set.");return}this.media.metadata={...Wh(this),...t}}get _hlsConfig(){var t;return(t=this.media)==null?void 0:t._hlsConfig}set _hlsConfig(t){if(Ee(this,le,_i).call(this),!this.media){st("underlying media element missing when trying to set _hlsConfig. _hlsConfig will not be set.");return}this.media._hlsConfig=t}async addCuePoints(t){var e;if(Ee(this,le,_i).call(this),!this.media){st("underlying media element missing when trying to addCuePoints. cuePoints will not be added.");return}return(e=this.media)==null?void 0:e.addCuePoints(t)}get activeCuePoint(){var t;return(t=this.media)==null?void 0:t.activeCuePoint}get cuePoints(){var t,e;return(e=(t=this.media)==null?void 0:t.cuePoints)!=null?e:[]}addChapters(t){var e;if(Ee(this,le,_i).call(this),!this.media){st("underlying media element missing when trying to addChapters. chapters will not be added.");return}return(e=this.media)==null?void 0:e.addChapters(t)}get activeChapter(){var t;return(t=this.media)==null?void 0:t.activeChapter}get chapters(){var t,e;return(e=(t=this.media)==null?void 0:t.chapters)!=null?e:[]}getStartDate(){var t;return(t=this.media)==null?void 0:t.getStartDate()}get currentPdt(){var t;return(t=this.media)==null?void 0:t.currentPdt}get tokens(){let t=this.getAttribute(A.PLAYBACK_TOKEN),e=this.getAttribute(A.DRM_TOKEN),i=this.getAttribute(A.THUMBNAIL_TOKEN),a=this.getAttribute(A.STORYBOARD_TOKEN);return{...z(this,zs),...t!=null?{playback:t}:{},...e!=null?{drm:e}:{},...i!=null?{thumbnail:i}:{},...a!=null?{storyboard:a}:{}}}set tokens(t){Yt(this,zs,t??{})}get playbackToken(){var t;return(t=this.getAttribute(A.PLAYBACK_TOKEN))!=null?t:void 0}set playbackToken(t){this.setAttribute(A.PLAYBACK_TOKEN,`${t}`)}get drmToken(){var t;return(t=this.getAttribute(A.DRM_TOKEN))!=null?t:void 0}set drmToken(t){this.setAttribute(A.DRM_TOKEN,`${t}`)}get thumbnailToken(){var t;return(t=this.getAttribute(A.THUMBNAIL_TOKEN))!=null?t:void 0}set thumbnailToken(t){this.setAttribute(A.THUMBNAIL_TOKEN,`${t}`)}get storyboardToken(){var t;return(t=this.getAttribute(A.STORYBOARD_TOKEN))!=null?t:void 0}set storyboardToken(t){this.setAttribute(A.STORYBOARD_TOKEN,`${t}`)}addTextTrack(t,e,i,a){var r;let n=(r=this.media)==null?void 0:r.nativeEl;if(n)return Fd(n,t,e,i,a)}removeTextTrack(t){var e;let i=(e=this.media)==null?void 0:e.nativeEl;if(i)return K_(i,t)}get textTracks(){var t;return(t=this.media)==null?void 0:t.textTracks}get castReceiver(){var t;return(t=this.getAttribute(A.CAST_RECEIVER))!=null?t:void 0}set castReceiver(t){t!==this.castReceiver&&(t?this.setAttribute(A.CAST_RECEIVER,t):this.removeAttribute(A.CAST_RECEIVER))}get castCustomData(){var t;return(t=this.media)==null?void 0:t.castCustomData}set castCustomData(t){if(!this.media){st("underlying media element missing when trying to set castCustomData. castCustomData will not be set.");return}this.media.castCustomData=t}get noTooltips(){return this.hasAttribute(A.NO_TOOLTIPS)}set noTooltips(t){if(!t){this.removeAttribute(A.NO_TOOLTIPS);return}this.setAttribute(A.NO_TOOLTIPS,"")}get proudlyDisplayMuxBadge(){return this.hasAttribute(A.PROUDLY_DISPLAY_MUX_BADGE)}set proudlyDisplayMuxBadge(t){t?this.setAttribute(A.PROUDLY_DISPLAY_MUX_BADGE,""):this.removeAttribute(A.PROUDLY_DISPLAY_MUX_BADGE)}};Gs=new WeakMap,Qs=new WeakMap,zs=new WeakMap,Hi=new WeakMap,Zs=new WeakMap,Za=new WeakMap,le=new WeakSet,_i=function(){var t,e,i,a;if(!z(this,Qs)){Yt(this,Qs,!0),Ee(this,le,Bi).call(this);try{if(customElements.upgrade(this.mediaTheme),!(this.mediaTheme instanceof Wt.HTMLElement))throw""}catch{st("<media-theme> failed to upgrade!")}try{customElements.upgrade(this.media)}catch{st("underlying media element failed to upgrade!")}try{if(customElements.upgrade(this.mediaController),!(this.mediaController instanceof m0))throw""}catch{st("<media-controller> failed to upgrade!")}Ee(this,le,qh).call(this),Ee(this,le,Yh).call(this),Ee(this,le,Gh).call(this),Yt(this,Hi,(e=(t=this.mediaController)==null?void 0:t.hasAttribute(M.USER_INACTIVE))!=null?e:!0),Ee(this,le,Qh).call(this),(i=this.media)==null||i.addEventListener("streamtypechange",()=>Ee(this,le,Bi).call(this)),(a=this.media)==null||a.addEventListener("loadstart",()=>Ee(this,le,Bi).call(this))}},Xv=function(){var t,e;try{(t=window?.CSS)==null||t.registerProperty({name:"--media-primary-color",syntax:"<color>",inherits:!0}),(e=window?.CSS)==null||e.registerProperty({name:"--media-secondary-color",syntax:"<color>",inherits:!0})}catch{}},Nd=function(t){Object.assign(z(this,Za),t),Ee(this,le,Bi).call(this)},Bi=function(t={}){IT(CT(BT(this,{...z(this,Za),...t})),this.shadowRoot)},qh=function(){let t=e=>{var i,a;if(!(e!=null&&e.startsWith("theme-")))return;let r=e.replace(/^theme-/,"");if(Od.includes(r))return;let n=this.getAttribute(e);n!=null?(i=this.mediaTheme)==null||i.setAttribute(r,n):(a=this.mediaTheme)==null||a.removeAttribute(r)};new MutationObserver(e=>{for(let{attributeName:i}of e)t(i)}).observe(this,{attributes:!0}),this.getAttributeNames().forEach(t)},Yh=function(){let t=e=>{var i;let a=(i=this.media)==null?void 0:i.error;if(!(a instanceof R)){let{message:n,code:s}=a??{};a=new R(n,s)}if(!(a!=null&&a.fatal)){Jt(a),a.data&&Jt(`${a.name} data:`,a.data);return}let r=$h(a);r.message&&Gv(r),st(a),a.data&&st(`${a.name} data:`,a.data),Ee(this,le,Nd).call(this,{isDialogOpen:!0})};this.addEventListener("error",t),this.media&&(this.media.errorTranslator=(e={})=>{var i,a,r;if(!(((i=this.media)==null?void 0:i.error)instanceof R))return e;let n=$h((a=this.media)==null?void 0:a.error);return{player_error_code:(r=this.media)==null?void 0:r.error.code,player_error_message:n.message?String(n.message):e.player_error_message,player_error_context:n.context?String(n.context):e.player_error_context}})},Gh=function(){var t,e,i,a;let r=()=>Ee(this,le,Bi).call(this);(e=(t=this.media)==null?void 0:t.textTracks)==null||e.addEventListener("addtrack",r),(a=(i=this.media)==null?void 0:i.textTracks)==null||a.addEventListener("removetrack",r)},Qh=function(){var t,e;if(!/Firefox/i.test(navigator.userAgent))return;let i,a=new WeakMap,r=()=>this.streamType===Q.LIVE&&!this.secondaryColor&&this.offsetWidth>=800,n=(l,d,m=!1)=>{r()||Array.from(l&&l.activeCues||[]).forEach(p=>{if(!(!p.snapToLines||p.line<-5||p.line>=0&&p.line<10))if(!d||this.paused){let h=p.text.split(`
`).length,c=-3;this.streamType===Q.LIVE&&(c=-2);let v=c-h;if(p.line===v&&!m)return;a.has(p)||a.set(p,p.line),p.line=v}else setTimeout(()=>{p.line=a.get(p)||"auto"},500)})},s=()=>{var l,d;n(i,(d=(l=this.mediaController)==null?void 0:l.hasAttribute(M.USER_INACTIVE))!=null?d:!1)},o=()=>{var l,d;let m=Array.from(((d=(l=this.mediaController)==null?void 0:l.media)==null?void 0:d.textTracks)||[]).filter(p=>["subtitles","captions"].includes(p.kind)&&p.mode==="showing")[0];m!==i&&i?.removeEventListener("cuechange",s),i=m,i?.addEventListener("cuechange",s),n(i,z(this,Hi))};o(),(t=this.textTracks)==null||t.addEventListener("change",o),(e=this.textTracks)==null||e.addEventListener("addtrack",o),this.addEventListener("userinactivechange",()=>{var l,d;let m=(d=(l=this.mediaController)==null?void 0:l.hasAttribute(M.USER_INACTIVE))!=null?d:!0;z(this,Hi)!==m&&(Yt(this,Hi,m),n(i,z(this,Hi)))})};function Di(t,e){return t.media?t.media.getAttribute(e):t.getAttribute(e)}var zh=QT,Jv=class{addEventListener(){}removeEventListener(){}dispatchEvent(t){return!0}};if(typeof DocumentFragment>"u"){class t extends Jv{}globalThis.DocumentFragment=t}var zT=class extends Jv{},ZT={get(t){},define(t,e,i){},getName(t){return null},upgrade(t){},whenDefined(t){return Promise.resolve(zT)}},jT={customElements:ZT},XT=typeof window>"u"||typeof globalThis.customElements>"u",_l=XT?jT:globalThis;_l.customElements.get("mux-player")||(_l.customElements.define("mux-player",zh),_l.MuxPlayerElement=zh);var ef=parseInt(tn.version)>=19,Zh={className:"class",classname:"class",htmlFor:"for",crossOrigin:"crossorigin",viewBox:"viewBox",playsInline:"playsinline",autoPlay:"autoplay",playbackRate:"playbackrate"},JT=t=>t==null,eA=(t,e)=>JT(e)?!1:t in e,tA=t=>t.replace(/[A-Z]/g,e=>`-${e.toLowerCase()}`),iA=(t,e)=>{if(!(!ef&&typeof e=="boolean"&&!e)){if(eA(t,Zh))return Zh[t];if(typeof e<"u")return/[A-Z]/.test(t)?tA(t):t}},aA=(t,e)=>!ef&&typeof t=="boolean"?"":t,rA=(t={})=>{let{ref:e,...i}=t;return Object.entries(i).reduce((a,[r,n])=>{let s=iA(r,n);if(!s)return a;let o=aA(n);return a[s]=o,a},{})};function jh(t,e){if(typeof t=="function")return t(e);t!=null&&(t.current=e)}function nA(...t){return e=>{let i=!1,a=t.map(r=>{let n=jh(r,e);return!i&&typeof n=="function"&&(i=!0),n});if(i)return()=>{for(let r=0;r<a.length;r++){let n=a[r];typeof n=="function"?n():jh(t[r],null)}}}}function sA(...t){return an.useCallback(nA(...t),t)}var oA=Object.prototype.hasOwnProperty,lA=(t,e)=>{if(Object.is(t,e))return!0;if(typeof t!="object"||t===null||typeof e!="object"||e===null)return!1;if(Array.isArray(t))return!Array.isArray(e)||t.length!==e.length?!1:t.some((r,n)=>e[n]===r);let i=Object.keys(t),a=Object.keys(e);if(i.length!==a.length)return!1;for(let r=0;r<i.length;r++)if(!oA.call(e,i[r])||!Object.is(t[i[r]],e[i[r]]))return!1;return!0},tf=(t,e,i)=>!lA(e,t[i]),dA=(t,e,i)=>{t[i]=e},uA=(t,e,i,a=dA,r=tf)=>an.useEffect(()=>{let n=i?.current;n&&r(n,e,t)&&a(n,e,t)},[i?.current,e]),wt=uA,cA=()=>{try{return"3.10.2"}catch{}return"UNKNOWN"},hA=cA(),mA=()=>hA,ne=(t,e,i)=>an.useEffect(()=>{let a=e?.current;if(!a||!i)return;let r=t,n=i;return a.addEventListener(r,n),()=>{a.removeEventListener(r,n)}},[e?.current,i,t]),pA=tn.forwardRef(({children:t,...e},i)=>tn.createElement("mux-player",{suppressHydrationWarning:!0,...rA(e),ref:i},t)),vA=(t,e)=>{let{onAbort:i,onCanPlay:a,onCanPlayThrough:r,onEmptied:n,onLoadStart:s,onLoadedData:o,onLoadedMetadata:l,onProgress:d,onDurationChange:m,onVolumeChange:p,onRateChange:h,onResize:c,onWaiting:v,onPlay:E,onPlaying:g,onTimeUpdate:y,onPause:T,onSeeking:_,onSeeked:S,onStalled:C,onSuspend:N,onEnded:$,onError:G,onCuePointChange:J,onChapterChange:K,metadata:U,tokens:Me,paused:Fe,playbackId:Ke,playbackRates:he,currentTime:Pe,themeProps:Tt,extraSourceParams:Ue,castCustomData:dt,_hlsConfig:Ve,...ke}=e;return wt("tokens",Me,t),wt("playbackId",Ke,t),wt("playbackRates",he,t),wt("metadata",U,t),wt("extraSourceParams",Ue,t),wt("_hlsConfig",Ve,t),wt("themeProps",Tt,t),wt("castCustomData",dt,t),wt("paused",Fe,t,(xe,et)=>{et!=null&&(et?xe.pause():xe.play())},(xe,et,na)=>xe.hasAttribute("autoplay")&&!xe.hasPlayed?!1:tf(xe,et,na)),wt("currentTime",Pe,t,(xe,et)=>{et!=null&&(xe.currentTime=et)}),ne("abort",t,i),ne("canplay",t,a),ne("canplaythrough",t,r),ne("emptied",t,n),ne("loadstart",t,s),ne("loadeddata",t,o),ne("loadedmetadata",t,l),ne("progress",t,d),ne("durationchange",t,m),ne("volumechange",t,p),ne("ratechange",t,h),ne("resize",t,c),ne("waiting",t,v),ne("play",t,E),ne("playing",t,g),ne("timeupdate",t,y),ne("pause",t,T),ne("seeking",t,_),ne("seeked",t,S),ne("stalled",t,C),ne("suspend",t,N),ne("ended",t,$),ne("error",t,G),ne("cuepointchange",t,J),ne("chapterchange",t,K),[ke]},fA=mA(),EA="mux-player-react",_A=tn.forwardRef((t,e)=>{var i;let a=an.useRef(null),r=sA(a,e),[n]=vA(a,t),[s]=an.useState((i=t.playerInitTime)!=null?i:Yd());return tn.createElement(pA,{ref:r,defaultHiddenCaptions:t.defaultHiddenCaptions,playerSoftwareName:EA,playerSoftwareVersion:fA,playerInitTime:s,...n})}),HA=_A;export{AA as MaxResolution,R as MediaError,kA as MinResolution,SA as RenditionOrder,HA as default,Yd as generatePlayerInitTime,EA as playerSoftwareName,fA as playerSoftwareVersion};
