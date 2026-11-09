/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise, SuppressedError, Symbol, Iterator */


function __decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}

typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};

/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const t$1=globalThis,e$4=t$1.ShadowRoot&&(void 0===t$1.ShadyCSS||t$1.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,s$2=Symbol(),o$4=new WeakMap;let n$3 = class n{constructor(t,e,o){if(this._$cssResult$=true,o!==s$2)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e;}get styleSheet(){let t=this.o;const s=this.t;if(e$4&&void 0===t){const e=void 0!==s&&1===s.length;e&&(t=o$4.get(s)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),e&&o$4.set(s,t));}return t}toString(){return this.cssText}};const r$4=t=>new n$3("string"==typeof t?t:t+"",void 0,s$2),i$3=(t,...e)=>{const o=1===t.length?t[0]:e.reduce(((e,s,o)=>e+(t=>{if(true===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(s)+t[o+1]),t[0]);return new n$3(o,t,s$2)},S$1=(s,o)=>{if(e$4)s.adoptedStyleSheets=o.map((t=>t instanceof CSSStyleSheet?t:t.styleSheet));else for(const e of o){const o=document.createElement("style"),n=t$1.litNonce;void 0!==n&&o.setAttribute("nonce",n),o.textContent=e.cssText,s.appendChild(o);}},c$2=e$4?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let e="";for(const s of t.cssRules)e+=s.cssText;return r$4(e)})(t):t;

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const{is:i$2,defineProperty:e$3,getOwnPropertyDescriptor:h$1,getOwnPropertyNames:r$3,getOwnPropertySymbols:o$3,getPrototypeOf:n$2}=Object,a$1=globalThis,c$1=a$1.trustedTypes,l$1=c$1?c$1.emptyScript:"",p$1=a$1.reactiveElementPolyfillSupport,d$1=(t,s)=>t,u$1={toAttribute(t,s){switch(s){case Boolean:t=t?l$1:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t);}return t},fromAttribute(t,s){let i=t;switch(s){case Boolean:i=null!==t;break;case Number:i=null===t?null:Number(t);break;case Object:case Array:try{i=JSON.parse(t);}catch(t){i=null;}}return i}},f$1=(t,s)=>!i$2(t,s),b$1={attribute:true,type:String,converter:u$1,reflect:false,useDefault:false,hasChanged:f$1};Symbol.metadata??=Symbol("metadata"),a$1.litPropertyMetadata??=new WeakMap;let y$1 = class y extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t);}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,s=b$1){if(s.state&&(s.attribute=false),this._$Ei(),this.prototype.hasOwnProperty(t)&&((s=Object.create(s)).wrapped=true),this.elementProperties.set(t,s),!s.noAccessor){const i=Symbol(),h=this.getPropertyDescriptor(t,i,s);void 0!==h&&e$3(this.prototype,t,h);}}static getPropertyDescriptor(t,s,i){const{get:e,set:r}=h$1(this.prototype,t)??{get(){return this[s]},set(t){this[s]=t;}};return {get:e,set(s){const h=e?.call(this);r?.call(this,s),this.requestUpdate(t,h,i);},configurable:true,enumerable:true}}static getPropertyOptions(t){return this.elementProperties.get(t)??b$1}static _$Ei(){if(this.hasOwnProperty(d$1("elementProperties")))return;const t=n$2(this);t.finalize(),void 0!==t.l&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties);}static finalize(){if(this.hasOwnProperty(d$1("finalized")))return;if(this.finalized=true,this._$Ei(),this.hasOwnProperty(d$1("properties"))){const t=this.properties,s=[...r$3(t),...o$3(t)];for(const i of s)this.createProperty(i,t[i]);}const t=this[Symbol.metadata];if(null!==t){const s=litPropertyMetadata.get(t);if(void 0!==s)for(const[t,i]of s)this.elementProperties.set(t,i);}this._$Eh=new Map;for(const[t,s]of this.elementProperties){const i=this._$Eu(t,s);void 0!==i&&this._$Eh.set(i,t);}this.elementStyles=this.finalizeStyles(this.styles);}static finalizeStyles(s){const i=[];if(Array.isArray(s)){const e=new Set(s.flat(1/0).reverse());for(const s of e)i.unshift(c$2(s));}else void 0!==s&&i.push(c$2(s));return i}static _$Eu(t,s){const i=s.attribute;return  false===i?void 0:"string"==typeof i?i:"string"==typeof t?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=false,this.hasUpdated=false,this._$Em=null,this._$Ev();}_$Ev(){this._$ES=new Promise((t=>this.enableUpdating=t)),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach((t=>t(this)));}addController(t){(this._$EO??=new Set).add(t),void 0!==this.renderRoot&&this.isConnected&&t.hostConnected?.();}removeController(t){this._$EO?.delete(t);}_$E_(){const t=new Map,s=this.constructor.elementProperties;for(const i of s.keys())this.hasOwnProperty(i)&&(t.set(i,this[i]),delete this[i]);t.size>0&&(this._$Ep=t);}createRenderRoot(){const t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return S$1(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(true),this._$EO?.forEach((t=>t.hostConnected?.()));}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach((t=>t.hostDisconnected?.()));}attributeChangedCallback(t,s,i){this._$AK(t,i);}_$ET(t,s){const i=this.constructor.elementProperties.get(t),e=this.constructor._$Eu(t,i);if(void 0!==e&&true===i.reflect){const h=(void 0!==i.converter?.toAttribute?i.converter:u$1).toAttribute(s,i.type);this._$Em=t,null==h?this.removeAttribute(e):this.setAttribute(e,h),this._$Em=null;}}_$AK(t,s){const i=this.constructor,e=i._$Eh.get(t);if(void 0!==e&&this._$Em!==e){const t=i.getPropertyOptions(e),h="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==t.converter?.fromAttribute?t.converter:u$1;this._$Em=e,this[e]=h.fromAttribute(s,t.type)??this._$Ej?.get(e)??null,this._$Em=null;}}requestUpdate(t,s,i){if(void 0!==t){const e=this.constructor,h=this[t];if(i??=e.getPropertyOptions(t),!((i.hasChanged??f$1)(h,s)||i.useDefault&&i.reflect&&h===this._$Ej?.get(t)&&!this.hasAttribute(e._$Eu(t,i))))return;this.C(t,s,i);} false===this.isUpdatePending&&(this._$ES=this._$EP());}C(t,s,{useDefault:i,reflect:e,wrapped:h},r){i&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,r??s??this[t]),true!==h||void 0!==r)||(this._$AL.has(t)||(this.hasUpdated||i||(s=void 0),this._$AL.set(t,s)),true===e&&this._$Em!==t&&(this._$Eq??=new Set).add(t));}async _$EP(){this.isUpdatePending=true;try{await this._$ES;}catch(t){Promise.reject(t);}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[t,s]of this._$Ep)this[t]=s;this._$Ep=void 0;}const t=this.constructor.elementProperties;if(t.size>0)for(const[s,i]of t){const{wrapped:t}=i,e=this[s];true!==t||this._$AL.has(s)||void 0===e||this.C(s,void 0,i,e);}}let t=false;const s=this._$AL;try{t=this.shouldUpdate(s),t?(this.willUpdate(s),this._$EO?.forEach((t=>t.hostUpdate?.())),this.update(s)):this._$EM();}catch(s){throw t=false,this._$EM(),s}t&&this._$AE(s);}willUpdate(t){}_$AE(t){this._$EO?.forEach((t=>t.hostUpdated?.())),this.hasUpdated||(this.hasUpdated=true,this.firstUpdated(t)),this.updated(t);}_$EM(){this._$AL=new Map,this.isUpdatePending=false;}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return  true}update(t){this._$Eq&&=this._$Eq.forEach((t=>this._$ET(t,this[t]))),this._$EM();}updated(t){}firstUpdated(t){}};y$1.elementStyles=[],y$1.shadowRootOptions={mode:"open"},y$1[d$1("elementProperties")]=new Map,y$1[d$1("finalized")]=new Map,p$1?.({ReactiveElement:y$1}),(a$1.reactiveElementVersions??=[]).push("2.1.0");

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const t=globalThis,i$1=t.trustedTypes,s$1=i$1?i$1.createPolicy("lit-html",{createHTML:t=>t}):void 0,e$2="$lit$",h=`lit$${Math.random().toFixed(9).slice(2)}$`,o$2="?"+h,n$1=`<${o$2}>`,r$2=document,l=()=>r$2.createComment(""),c=t=>null===t||"object"!=typeof t&&"function"!=typeof t,a=Array.isArray,u=t=>a(t)||"function"==typeof t?.[Symbol.iterator],d="[ \t\n\f\r]",f=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,v=/-->/g,_=/>/g,m=RegExp(`>|${d}(?:([^\\s"'>=/]+)(${d}*=${d}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),p=/'/g,g=/"/g,$=/^(?:script|style|textarea|title)$/i,y=t=>(i,...s)=>({_$litType$:t,strings:i,values:s}),x=y(1),b=y(2),T=Symbol.for("lit-noChange"),E=Symbol.for("lit-nothing"),A=new WeakMap,C=r$2.createTreeWalker(r$2,129);function P(t,i){if(!a(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==s$1?s$1.createHTML(i):i}const V=(t,i)=>{const s=t.length-1,o=[];let r,l=2===i?"<svg>":3===i?"<math>":"",c=f;for(let i=0;i<s;i++){const s=t[i];let a,u,d=-1,y=0;for(;y<s.length&&(c.lastIndex=y,u=c.exec(s),null!==u);)y=c.lastIndex,c===f?"!--"===u[1]?c=v:void 0!==u[1]?c=_:void 0!==u[2]?($.test(u[2])&&(r=RegExp("</"+u[2],"g")),c=m):void 0!==u[3]&&(c=m):c===m?">"===u[0]?(c=r??f,d=-1):void 0===u[1]?d=-2:(d=c.lastIndex-u[2].length,a=u[1],c=void 0===u[3]?m:'"'===u[3]?g:p):c===g||c===p?c=m:c===v||c===_?c=f:(c=m,r=void 0);const x=c===m&&t[i+1].startsWith("/>")?" ":"";l+=c===f?s+n$1:d>=0?(o.push(a),s.slice(0,d)+e$2+s.slice(d)+h+x):s+h+(-2===d?i:x);}return [P(t,l+(t[s]||"<?>")+(2===i?"</svg>":3===i?"</math>":"")),o]};class N{constructor({strings:t,_$litType$:s},n){let r;this.parts=[];let c=0,a=0;const u=t.length-1,d=this.parts,[f,v]=V(t,s);if(this.el=N.createElement(f,n),C.currentNode=this.el.content,2===s||3===s){const t=this.el.content.firstChild;t.replaceWith(...t.childNodes);}for(;null!==(r=C.nextNode())&&d.length<u;){if(1===r.nodeType){if(r.hasAttributes())for(const t of r.getAttributeNames())if(t.endsWith(e$2)){const i=v[a++],s=r.getAttribute(t).split(h),e=/([.?@])?(.*)/.exec(i);d.push({type:1,index:c,name:e[2],strings:s,ctor:"."===e[1]?H:"?"===e[1]?I:"@"===e[1]?L:k}),r.removeAttribute(t);}else t.startsWith(h)&&(d.push({type:6,index:c}),r.removeAttribute(t));if($.test(r.tagName)){const t=r.textContent.split(h),s=t.length-1;if(s>0){r.textContent=i$1?i$1.emptyScript:"";for(let i=0;i<s;i++)r.append(t[i],l()),C.nextNode(),d.push({type:2,index:++c});r.append(t[s],l());}}}else if(8===r.nodeType)if(r.data===o$2)d.push({type:2,index:c});else {let t=-1;for(;-1!==(t=r.data.indexOf(h,t+1));)d.push({type:7,index:c}),t+=h.length-1;}c++;}}static createElement(t,i){const s=r$2.createElement("template");return s.innerHTML=t,s}}function S(t,i,s=t,e){if(i===T)return i;let h=void 0!==e?s._$Co?.[e]:s._$Cl;const o=c(i)?void 0:i._$litDirective$;return h?.constructor!==o&&(h?._$AO?.(false),void 0===o?h=void 0:(h=new o(t),h._$AT(t,s,e)),void 0!==e?(s._$Co??=[])[e]=h:s._$Cl=h),void 0!==h&&(i=S(t,h._$AS(t,i.values),h,e)),i}class M{constructor(t,i){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=i;}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:i},parts:s}=this._$AD,e=(t?.creationScope??r$2).importNode(i,true);C.currentNode=e;let h=C.nextNode(),o=0,n=0,l=s[0];for(;void 0!==l;){if(o===l.index){let i;2===l.type?i=new R(h,h.nextSibling,this,t):1===l.type?i=new l.ctor(h,l.name,l.strings,this,t):6===l.type&&(i=new z(h,this,t)),this._$AV.push(i),l=s[++n];}o!==l?.index&&(h=C.nextNode(),o++);}return C.currentNode=r$2,e}p(t){let i=0;for(const s of this._$AV) void 0!==s&&(void 0!==s.strings?(s._$AI(t,s,i),i+=s.strings.length-2):s._$AI(t[i])),i++;}}class R{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,i,s,e){this.type=2,this._$AH=E,this._$AN=void 0,this._$AA=t,this._$AB=i,this._$AM=s,this.options=e,this._$Cv=e?.isConnected??true;}get parentNode(){let t=this._$AA.parentNode;const i=this._$AM;return void 0!==i&&11===t?.nodeType&&(t=i.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,i=this){t=S(this,t,i),c(t)?t===E||null==t||""===t?(this._$AH!==E&&this._$AR(),this._$AH=E):t!==this._$AH&&t!==T&&this._(t):void 0!==t._$litType$?this.$(t):void 0!==t.nodeType?this.T(t):u(t)?this.k(t):this._(t);}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t));}_(t){this._$AH!==E&&c(this._$AH)?this._$AA.nextSibling.data=t:this.T(r$2.createTextNode(t)),this._$AH=t;}$(t){const{values:i,_$litType$:s}=t,e="number"==typeof s?this._$AC(t):(void 0===s.el&&(s.el=N.createElement(P(s.h,s.h[0]),this.options)),s);if(this._$AH?._$AD===e)this._$AH.p(i);else {const t=new M(e,this),s=t.u(this.options);t.p(i),this.T(s),this._$AH=t;}}_$AC(t){let i=A.get(t.strings);return void 0===i&&A.set(t.strings,i=new N(t)),i}k(t){a(this._$AH)||(this._$AH=[],this._$AR());const i=this._$AH;let s,e=0;for(const h of t)e===i.length?i.push(s=new R(this.O(l()),this.O(l()),this,this.options)):s=i[e],s._$AI(h),e++;e<i.length&&(this._$AR(s&&s._$AB.nextSibling,e),i.length=e);}_$AR(t=this._$AA.nextSibling,i){for(this._$AP?.(false,true,i);t&&t!==this._$AB;){const i=t.nextSibling;t.remove(),t=i;}}setConnected(t){ void 0===this._$AM&&(this._$Cv=t,this._$AP?.(t));}}class k{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,i,s,e,h){this.type=1,this._$AH=E,this._$AN=void 0,this.element=t,this.name=i,this._$AM=e,this.options=h,s.length>2||""!==s[0]||""!==s[1]?(this._$AH=Array(s.length-1).fill(new String),this.strings=s):this._$AH=E;}_$AI(t,i=this,s,e){const h=this.strings;let o=false;if(void 0===h)t=S(this,t,i,0),o=!c(t)||t!==this._$AH&&t!==T,o&&(this._$AH=t);else {const e=t;let n,r;for(t=h[0],n=0;n<h.length-1;n++)r=S(this,e[s+n],i,n),r===T&&(r=this._$AH[n]),o||=!c(r)||r!==this._$AH[n],r===E?t=E:t!==E&&(t+=(r??"")+h[n+1]),this._$AH[n]=r;}o&&!e&&this.j(t);}j(t){t===E?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"");}}class H extends k{constructor(){super(...arguments),this.type=3;}j(t){this.element[this.name]=t===E?void 0:t;}}class I extends k{constructor(){super(...arguments),this.type=4;}j(t){this.element.toggleAttribute(this.name,!!t&&t!==E);}}class L extends k{constructor(t,i,s,e,h){super(t,i,s,e,h),this.type=5;}_$AI(t,i=this){if((t=S(this,t,i,0)??E)===T)return;const s=this._$AH,e=t===E&&s!==E||t.capture!==s.capture||t.once!==s.once||t.passive!==s.passive,h=t!==E&&(s===E||e);e&&this.element.removeEventListener(this.name,this,s),h&&this.element.addEventListener(this.name,this,t),this._$AH=t;}handleEvent(t){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t);}}class z{constructor(t,i,s){this.element=t,this.type=6,this._$AN=void 0,this._$AM=i,this.options=s;}get _$AU(){return this._$AM._$AU}_$AI(t){S(this,t);}}const j=t.litHtmlPolyfillSupport;j?.(N,R),(t.litHtmlVersions??=[]).push("3.3.0");const B=(t,i,s)=>{const e=s?.renderBefore??i;let h=e._$litPart$;if(void 0===h){const t=s?.renderBefore??null;e._$litPart$=h=new R(i.insertBefore(l(),t),t,void 0,s??{});}return h._$AI(t),h};

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const s=globalThis;class i extends y$1{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0;}createRenderRoot(){const t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){const r=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=B(r,this.renderRoot,this.renderOptions);}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(true);}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(false);}render(){return T}}i._$litElement$=true,i["finalized"]=true,s.litElementHydrateSupport?.({LitElement:i});const o$1=s.litElementPolyfillSupport;o$1?.({LitElement:i});(s.litElementVersions??=[]).push("4.2.0");

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const o={attribute:true,type:String,converter:u$1,reflect:false,hasChanged:f$1},r$1=(t=o,e,r)=>{const{kind:n,metadata:i}=r;let s=globalThis.litPropertyMetadata.get(i);if(void 0===s&&globalThis.litPropertyMetadata.set(i,s=new Map),"setter"===n&&((t=Object.create(t)).wrapped=true),s.set(r.name,t),"accessor"===n){const{name:o}=r;return {set(r){const n=e.get.call(this);e.set.call(this,r),this.requestUpdate(o,n,t);},init(e){return void 0!==e&&this.C(o,void 0,t,e),e}}}if("setter"===n){const{name:o}=r;return function(r){const n=this[o];e.call(this,r),this.requestUpdate(o,n,t);}}throw Error("Unsupported decorator location: "+n)};function n(t){return (e,o)=>"object"==typeof o?r$1(t,e,o):((t,e,o)=>{const r=e.hasOwnProperty(o);return e.constructor.createProperty(o,t),r?Object.getOwnPropertyDescriptor(e,o):void 0})(t,e,o)}

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */function r(r){return n({...r,state:true,attribute:false})}

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const e$1=(e,t,c)=>(c.configurable=true,c.enumerable=true,Reflect.decorate&&"object"!=typeof t&&Object.defineProperty(e,t,c),c);

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */function e(e,r){return (n,s,i)=>{const o=t=>t.renderRoot?.querySelector(e)??null;{const{get:e,set:r}="object"==typeof s?n:i??(()=>{const t=Symbol();return {get(){return this[t]},set(e){this[t]=e;}}})();return e$1(n,s,{get(){let t=e.call(this);return void 0===t&&(t=o(this),(null!==t||this.hasUpdated)&&r.call(this,t)),t}})}}}

/**
 * Config for GoogleService
 */
const CONFIG = {
  GOOGLE: {
    MAX_RETRIES: 3,
    RETRY_DELAY_MS: 1000,
    FETCH_TIMEOUT_MS: 6000
  }
};
/**
 * Service for translating and romanizing text using Google Translate (unofficial API)
 */
class GoogleService {
  static delay(ms) {
    return new Promise(resolve => {
      setTimeout(resolve, ms);
    });
  }
  static fetchWithTimeout(url, timeoutMs = CONFIG.GOOGLE.FETCH_TIMEOUT_MS) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    return fetch(url, {
      signal: controller.signal
    }).finally(() => clearTimeout(timeoutId));
  }
  static isPurelyLatinScript(text) {
    // Basic check for Latin script characters plus common punctuation and numbers
    // eslint-disable-next-line no-control-regex
    return /^[\u0000-\u007F\u0080-\u00FF\u0100-\u017F\u0180-\u024F]*$/.test(text);
  }
  static async translate(textOrArray, targetLang) {
    if (!textOrArray || Array.isArray(textOrArray) && textOrArray.length === 0) {
      return Array.isArray(textOrArray) ? [] : '';
    }
    const isArray = Array.isArray(textOrArray);
    const texts = isArray ? textOrArray : [textOrArray];
    // Check for empty strings to preserve indices
    const nonEmptyIndices = [];
    const textsToTranslate = [];
    texts.forEach((t, i) => {
      if (t && t.trim()) {
        nonEmptyIndices.push(i);
        textsToTranslate.push(t);
      }
    });
    if (textsToTranslate.length === 0) {
      return isArray ? texts : texts[0];
    }
    // Batching logic: Google Translate URL limit is roughly 2000 chars.
    // We'll be conservative with 1500 chars per batch.
    const BATCH_SIZE_CHARS = 1500;
    const translatedResults = new Array(textsToTranslate.length).fill('');
    let currentBatch = [];
    let currentBatchIndices = [];
    let currentBatchLength = 0;
    const processBatch = async (batch, indices) => {
      if (batch.length === 0) return;
      const joinedText = batch.join('\n');
      let attempt = 0;
      let success = false;
      while (attempt < CONFIG.GOOGLE.MAX_RETRIES && !success) {
        try {
          const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(joinedText)}`;
          // eslint-disable-next-line no-await-in-loop
          const response = await GoogleService.fetchWithTimeout(url);
          if (!response.ok) throw new Error(`Status ${response.status}`);
          // eslint-disable-next-line no-await-in-loop
          const data = await response.json();
          // data[0] contains segments.
          // With batching/newlines, Google sometimes returns one large segment with newlines,
          // or multiple segments. We need to reconstruct the full text first.
          const fullTranslation = data?.[0]?.map(seg => seg?.[0]).join('') || '';
          // Split by newline to get individual lines back
          const lines = fullTranslation.split('\n');
          // Edge case: Google might strip trailing newlines or add extra.
          // If we sent N lines, we expect N lines back approx.
          // However, empty lines in input were filtered out before sending.
          // So 'lines' should match 'batch'.
          // If mismatch, try to align? Or just take what we have.
          // If lines.length < batch.length, we might have lost some.
          // If lines.length > batch.length, maybe some line wrap?
          // We'll trust the split for now but ensure we don't overflow.
          indices.forEach((originalIdx, i) => {
            // Safe access
            if (i < lines.length) {
              translatedResults[originalIdx] = lines[i];
            } else {
              // Fallback if response is shorter
              translatedResults[originalIdx] = batch[i];
            }
          });
          success = true;
        } catch (e) {
          attempt += 1;
          if (attempt < CONFIG.GOOGLE.MAX_RETRIES) {
            // eslint-disable-next-line no-await-in-loop
            await GoogleService.delay(CONFIG.GOOGLE.RETRY_DELAY_MS * 2 ** (attempt - 1));
          } else {
            // Fail: fill with original
            indices.forEach((originalIdx, i) => {
              translatedResults[originalIdx] = batch[i];
            });
          }
        }
      }
    };
    for (let i = 0; i < textsToTranslate.length; i += 1) {
      const text = textsToTranslate[i];
      if (currentBatchLength + text.length > BATCH_SIZE_CHARS) {
        // eslint-disable-next-line no-await-in-loop
        await processBatch(currentBatch, currentBatchIndices);
        currentBatch = [];
        currentBatchIndices = [];
        currentBatchLength = 0;
      }
      currentBatch.push(text);
      currentBatchIndices.push(i);
      currentBatchLength += text.length;
    }
    if (currentBatch.length > 0) {
      await processBatch(currentBatch, currentBatchIndices);
    }
    // Reconstruct final array
    const finalArray = [...texts];
    nonEmptyIndices.forEach((realIdx, mappedIdx) => {
      finalArray[realIdx] = translatedResults[mappedIdx];
    });
    return isArray ? finalArray : finalArray[0];
  }
  static async romanize(originalLyrics) {
    // Determine if we should treat as word-synced (has syllabus) or line-synced
    const lines = Array.isArray(originalLyrics) ? originalLyrics : originalLyrics.data || originalLyrics.content || [];
    if (!lines || lines.length === 0) return Array.isArray(originalLyrics) ? originalLyrics : [];
    // Check if word synced
    const isWordSynced = lines.some(l => l.isWordSynced !== false && Array.isArray(l.text) && l.text.length > 1);
    if (isWordSynced) {
      return this.romanizeWordSynced(lines);
    }
    return this.romanizeLineSynced(lines);
  }
  static async romanizeWordSynced(lines) {
    return Promise.all(lines.map(async line => {
      if (!line.text || !Array.isArray(line.text) || line.text.length === 0 || line.romanizedText // Skip if already romanized
      ) return line;
      // Get the entire line text to romanize together for context-aware pronunciation
      const fullText = line.text.map(s => s.text).join('');
      // romanizeTexts expects an array of strings, so we pass an array of one
      const [romanizedFullLine] = await this.romanizeTexts([fullText]);
      const newSyllabus = line.text.map(s => ({
        ...s,
        romanizedText: s.romanizedText // Keep any existing syllabus romanization if provided by API natively
      }));
      return {
        ...line,
        text: newSyllabus,
        romanizedText: romanizedFullLine || ''
      };
    }));
  }
  static async romanizeLineSynced(lines) {
    const linesToRomanize = lines.map(line => {
      // If already romanized, skip
      if (line.romanizedText) {
        return '';
      }
      // If it's line-synced, it usually has 1 syllable with the full text.
      if (Array.isArray(line.text) && line.text.length > 0) {
        return line.text.map(s => s.text).join('');
      }
      return '';
    });
    const romanizedLines = await this.romanizeTexts(linesToRomanize);
    return lines.map((line, index) => ({
      ...line,
      romanizedText: romanizedLines[index] || ''
    }));
  }
  static async romanizeTexts(texts) {
    const contextText = texts.join(' ');
    if (GoogleService.isPurelyLatinScript(contextText)) {
      return texts;
    }
    const romanizedTexts = [];
    /* eslint-disable no-await-in-loop */
    for (const text of texts) {
      if (!text || GoogleService.isPurelyLatinScript(text)) {
        romanizedTexts.push(text);
      } else {
        let attempt = 0;
        let success = false;
        let lastError = null;
        while (attempt < CONFIG.GOOGLE.MAX_RETRIES && !success) {
          try {
            const romanizeUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=rm&q=${encodeURIComponent(text)}`;
            const response = await GoogleService.fetchWithTimeout(romanizeUrl);
            const data = await response.json();
            // Response format is [[["...","...","...","romanization"]],...]
            // or [null, ...] for English/Latin input where no romanization is needed
            const romanized = data?.[0]?.[0]?.[3] || text;
            romanizedTexts.push(romanized);
            success = true;
          } catch (error) {
            lastError = error;
            // eslint-disable-next-line no-console
            console.warn(`GoogleService: Error romanizing text "${text}" (attempt ${attempt + 1}/${CONFIG.GOOGLE.MAX_RETRIES}):`, error);
            attempt += 1;
            if (attempt < CONFIG.GOOGLE.MAX_RETRIES) {
              await GoogleService.delay(CONFIG.GOOGLE.RETRY_DELAY_MS * 2 ** (attempt - 1)); // Exponential backoff
            }
          }
        }
        if (!success) {
          // eslint-disable-next-line no-console
          console.error(`GoogleService: Failed to romanize text "${text}" after ${CONFIG.GOOGLE.MAX_RETRIES} attempts. Last error:`, lastError);
          romanizedTexts.push(text); // Fallback to original text
        }
      }
    }
    /* eslint-enable no-await-in-loop */
    return romanizedTexts;
  }
}

// These providers express every timestamp in seconds, including whole numbers.
function secondsToMs(value, fallback = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.round(value * 1000)) : fallback;
}
function webUrl(value) {
  if (typeof value !== 'string') return undefined;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : undefined;
  } catch {
    return undefined;
  }
}
function spicyContributors(attribution) {
  if (!attribution || typeof attribution !== 'object') return [];
  const people = new Map();
  Object.entries(attribution).forEach(([role, value]) => {
    const entries = Array.isArray(value) ? value : [value];
    entries.forEach(person => {
      if (typeof person?.username !== 'string' || !person.username.trim()) return;
      const url = webUrl(person.url);
      const key = person.id || url || person.username;
      const existing = people.get(key);
      if (existing) {
        if (!existing.roles.includes(role)) existing.roles.push(role);
      } else {
        people.set(key, {
          username: person.username,
          url,
          avatar: webUrl(person.avatar),
          roles: [role]
        });
      }
    });
  });
  return [...people.values()];
}
function parseSpicyLyrics(payload) {
  const body = payload?.Body;
  if (!body || !['Syllable', 'Line', 'Static'].includes(body.Type)) return null;
  const wordSynced = body.Type === 'Syllable';
  const untimed = body.Type === 'Static';
  const content = untimed ? body.Lines : body.Content;
  if (!Array.isArray(content)) return null;
  const syllables = group => {
    if (!Array.isArray(group?.Syllables)) return [];
    const entries = group.Syllables.filter(s => typeof s?.Text === 'string' && s.Text.length);
    return entries.map((s, index) => {
      const space = !s.IsPartOfWord && index < entries.length - 1 ? ' ' : '';
      return {
        text: s.Text + space,
        part: Boolean(s.IsPartOfWord),
        timestamp: secondsToMs(s.StartTime, secondsToMs(group.StartTime)),
        endtime: secondsToMs(s.EndTime, secondsToMs(group.EndTime)),
        romanizedText: typeof s.TransliteratedText === 'string' ? s.TransliteratedText + space : undefined
      };
    });
  };
  const lines = [];
  content.forEach(entry => {
    if (!entry || !untimed && entry.Type !== 'Vocal') return;
    const lead = wordSynced ? entry.Lead : entry;
    if (!lead) return;
    let text = [];
    if (wordSynced) text = syllables(lead);else if (typeof lead.Text === 'string' && lead.Text.trim()) {
      text = [{
        text: lead.Text,
        part: false,
        timestamp: untimed ? 0 : secondsToMs(lead.StartTime),
        endtime: untimed ? 0 : secondsToMs(lead.EndTime),
        lineSynced: true
      }];
    }
    if (!text.length) return;
    const backgrounds = Array.isArray(entry.Background) ? entry.Background.map(syllables).filter(s => s.length) : [];
    const backgroundText = [];
    backgrounds.forEach((group, index) => {
      if (index && backgroundText.length) {
        const previous = backgroundText[backgroundText.length - 1];
        previous.text += ' ';
        previous.part = false;
      }
      backgroundText.push(...group);
    });
    const timestamp = untimed ? 0 : secondsToMs(lead.StartTime, Math.min(...text.map(s => s.timestamp)));
    const endtime = untimed ? 0 : secondsToMs(lead.EndTime, Math.max(...text.map(s => s.endtime)));
    lines.push({
      text,
      background: backgroundText.length > 0,
      backgroundText,
      oppositeTurn: Boolean(entry.OppositeAligned),
      alignment: entry.OppositeAligned ? 'end' : 'start',
      timestamp,
      endtime: Math.max(timestamp, endtime),
      isWordSynced: wordSynced,
      romanizedText: lead.TransliteratedText,
      translation: lead.TranslatedText
    });
  });
  if (!lines.length) return null;
  const catalogues = {
    apple_music: ' (Apple Music)',
    spotify: ' (Spotify)'
  };
  const catalogue = catalogues[body.source] || '';
  return {
    lines,
    source: `Spicy Lyrics${catalogue}`,
    songwriters: Array.isArray(body.SongWriters) ? body.SongWriters.filter(s => typeof s === 'string').join(', ') : undefined,
    contributors: body.source === 'spicy_lyrics' ? spicyContributors(body.UploadAttribution) : undefined
  };
}

const VERSION = '1.9.0';
const SPICY_LYRICS_CLIENT_KEY = 'sl_pk_8nNuJf0L-xFUv8L5uU-pfin69WU4j3IzzV2-T3GPWKY';
const SPOTIFY_TOKEN_URL = 'https://flxgjwpkztgpdywkgckk.supabase.co/functions/v1/spotify-token';
const INSTRUMENTAL_THRESHOLD_MS = 7000; // Show dots for gaps >= 7s
const FETCH_TIMEOUT_MS = 8000; // Default timeout for lyrics fetch requests
const LRC_RED_TIMEOUT_MS = 3000;
const BINIMUM_LOOKUP_TIMEOUT_MS = 3000;
const SEEK_THRESHOLD_MS = 500;
const SCROLL_ANIMATION_DURATION_MS = 350;
const BACKGROUND_EXIT_DURATION_MS = 450;
const BACKGROUND_CARRY_MIN_OVERLAP_MS = 800;
const USER_SCROLL_RESUME_DELAY_MS = 5000;
const GAP_PULSE_DURATION_MS = 4000;
const GAP_ENTRY_FADE_MS = 160;
const GAP_ENTRY_SCALE_MS = 400;
const GAP_COLLAPSE_LEAD_MS = 500;
const GAP_EXIT_LEAD_MS = SCROLL_ANIMATION_DURATION_MS;
const GAP_EXIT_TRAIL_MS = 250;
const GAP_BREATH_MIN_SCALE = 0.85;
const GAP_BREATH_MAX_SCALE = 1.12;
const GAP_EXIT_POP_SCALE = 1.2;
const GAP_EXIT_POP_PROGRESS = 0.35;
const NEXT_WORD_PRE_WIPE_MAX_GAP_MS = 180;
const NEXT_WORD_PRE_WIPE_MIN_DURATION_MS = 80;
const NEXT_WORD_PRE_WIPE_MAX_DURATION_MS = 240;
const BASE_WIPE_GRADIENT_EM = 0.75;
const CJK_WIPE_GRADIENT_EM = 0.3;
const LONG_WORD_WIPE_EXTRA_EM = 0.45;
const LONG_WORD_WIPE_EXTRA_RATIO = 0.35;
const WORD_PRE_WIPE_HANDOFF_LEAD_MS = 100;
const WORD_WIPE_LOOKAHEAD_MS = 500;
const NEXT_LINE_BASE_BLUR_EM = 0.02;
const NEXT_LINE_UNBLUR_DURATION_MS = 2000;
const NORMAL_WORD_SPRING_DURATION_MS = 2000;
/**
 * Fetch with an automatic timeout via AbortSignal.
 * Rejects if the request takes longer than `timeoutMs`.
 */
function fetchWithTimeout(url, options = {}, timeoutMs = FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, {
    ...options,
    signal: controller.signal
  }).finally(() => clearTimeout(timeoutId));
}
const KPOE_SERVERS = ['https://lyricsplus.binimum.org', 'https://lyricsplus-seven.vercel.app', 'https://lyricsplus.prjktla.workers.dev', 'https://lyrics-plus-backend.vercel.app'];
const DEFAULT_KPOE_SOURCE_ORDER = 'apple,lyricsplus,musixmatch,spotify,qq,deezer,musixmatch-word';
const GENIUS_WORKER_URL = 'https://fetch-genius.samidy.workers.dev/';
class AmLyrics extends i {
  constructor() {
    super(...arguments);
    this.downloadFormat = 'auto';
    this.highlightColor = '#ffffff';
    this.autoScroll = true;
    this.interpolate = true;
    /** Freeze the playback clock and timed effects while the player is paused. */
    this.paused = false;
    /** Use supplied alternates only; disable Google generation, including button actions. */
    this.noAutoAlternates = false;
    /** Disable distance and predictive blur without changing lyric timing. */
    this.noBlur = false;
    this.hidePlayedLines = false;
    /** Also enabled automatically by the system reduced-motion preference. */
    this.reducedMotion = false;
    /** Browser implementations; these are not the native app's version IDs. */
    this.lineMotion = 'staggered';
    this.systemReducedMotion = false;
    this.handleMotionPreference = event => {
      this.systemReducedMotion = event.matches;
    };
    this.showRomanization = false;
    this.showTranslation = false;
    this._currentTime = 0;
    this.playbackAnchor = 0;
    this.playbackStamp = 0;
    this.lastAdvanceStamp = 0;
    this.hostCadence = 250;
    this.clockAdvancing = false;
    this.playbackEvents = [];
    this.playbackEventIndex = -1;
    this.heldPlaybackAnimations = new Set();
    this.handlePlaybackVisibility = () => {
      if (document.hidden) {
        this.cancelPlaybackTick();
        this.holdPlaybackAnimations();
      } else {
        if (performance.now() - this.playbackStamp >= this.playbackHorizon) this.clockAdvancing = false;
        if (!this.paused) this.releasePlaybackAnimations();
        this.applyPlaybackTime(this.estimatedPlaybackTime(), true, true, false);
        if (this.paused || this.interpolate && !this.clockAdvancing) this.holdPlaybackAnimations();
        this.schedulePlaybackTick();
      }
    };
    this.rewindingLines = new Set();
    this.rewindFrame = 0;
    this.rewindEffects = [];
    this.isLoading = false;
    this.activeLineIndices = [];
    this.lineHighlightEnds = [];
    this.backgroundWraps = new WeakMap();
    this.lyricsSource = null;
    this.availableSources = [];
    this.currentSourceIndex = 0;
    this.isFetchingAlternatives = false;
    this.sourceSwitchPending = false;
    this.selectedSourceKey = null;
    this.hasFetchedAllProviders = false;
    this.hasFetchedSpicyLyrics = false;
    this.lastInstrumentalIndex = null;
    this.isUserScrolling = false;
    this.isProgrammaticScroll = false;
    this.isClickSeeking = false;
    // Cached DOM elements for animation updates
    this.cachedLyricsLines = [];
    // Cached line elements array for scroll/position queries
    this.cachedLineArray = [];
    // Cached line and gap element maps for fast lookup
    this.lineElementCache = new Map();
    this.gapElementCache = new Map();
    this.gapAnimations = new Map();
    this.gapDotCache = new WeakMap();
    this.gapExitDurationCache = new WeakMap();
    this.gapCollapseDurationCache = new WeakMap();
    // Cached gap computation results
    this.cachedAllGaps = [];
    this.gapsCached = false;
    // Cached isUnsynced flag
    this.cachedIsUnsynced = false;
    // Cached pre-computed line data for render
    this.cachedLineData = null;
    this.backgroundTailIndices = [];
    // Active line tracking
    this.activeLineIds = new Set();
    this.currentPrimaryActiveLine = null;
    this.lastPrimaryActiveLine = null;
    this.backgroundExpandedLines = new Set();
    this.backgroundAnimations = new Map();
    this.contentSprings = new Map();
    this.currentScrollOffset = 0;
    // Syllable animation tracking
    this.lastActiveIndex = 0;
    this.visibleLineIds = new Set();
    // Cached element tracking to avoid repeated querySelectorAll calls
    this.preActiveLineElements = [];
    this.progressiveBlurLine = null;
    this.positionedLineElements = [];
    this.activeGapLineElements = [];
    // Bound handler references for proper event listener removal
    this._boundHandleUserScroll = this.handleUserScroll.bind(this);
    this.sourceUpgrade = false;
    this.pendingLayoutOffsets = new Map();
    this.backgroundCarries = new Map();
    this.restoreCarriesAfterRender = false;
    this.backgroundCarryRestoreTops = new Map();
    this.backgroundCarryRestoreOwners = new Map();
    this.lastCarryTime = 0;
    this.lineSprings = new Map();
  }
  get shouldReduceMotion() {
    return this.reducedMotion || this.systemReducedMotion;
  }
  async toggleRomanization() {
    this.showRomanization = !this.showRomanization;
    await this.applyRomanization();
  }
  async applyRomanization() {
    if (this.noAutoAlternates) return;
    if (this.showRomanization && this.lyrics) {
      const needsRomanization = this.lyrics.some(l => !l.romanizedText && (!l.text || !l.text.some(s => s.romanizedText)));
      if (needsRomanization) {
        this.isLoading = true;
        try {
          const romanizedLines = await GoogleService.romanize(this.lyrics);
          this.lyrics = romanizedLines;
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error('Romanization failed', e);
        } finally {
          this.isLoading = false;
        }
      }
    }
  }
  async toggleTranslation() {
    this.showTranslation = !this.showTranslation;
    await this.applyTranslation();
  }
  async applyTranslation() {
    if (this.noAutoAlternates) return;
    if (this.showTranslation && this.lyrics) {
      const needsTranslation = this.lyrics.some(l => !l.translation);
      if (needsTranslation) {
        this.isLoading = true;
        try {
          // Prepare batch: extract text from all lines
          const textToTranslate = this.lyrics.map(line => {
            if (line.translation) return '';
            return line.text.map(s => s.text).join('');
          });
          // If all are empty, skip
          if (textToTranslate.every(t => !t)) {
            this.isLoading = false;
            return;
          }
          const result = await GoogleService.translate(textToTranslate, 'en');
          const translations = Array.isArray(result) ? result : [result];
          const newLyrics = this.lyrics.map((line, index) => {
            if (line.translation) return line;
            return {
              ...line,
              translation: translations[index] || undefined
            };
          });
          this.lyrics = newLyrics;
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error('Translation failed', e);
        } finally {
          this.isLoading = false;
        }
      }
    }
  }
  playbackEventAt(time) {
    let low = 0;
    let high = this.playbackEvents.length;
    while (low < high) {
      const middle = Math.floor((low + high) / 2);
      if (this.playbackEvents[middle] <= time) low = middle + 1;else high = middle;
    }
    return low;
  }
  get playbackHorizon() {
    return AmLyrics.clamp(this.hostCadence * 2.5, 750, 5000);
  }
  estimatedPlaybackTime(now = performance.now()) {
    return this.clockAdvancing && this.interpolate && !this.paused ? this.playbackAnchor + Math.min(Math.max(0, now - this.playbackStamp), this.playbackHorizon) : this._currentTime;
  }
  cancelPlaybackTick() {
    clearTimeout(this.playbackTimer);
    this.playbackTimer = undefined;
  }
  schedulePlaybackTick() {
    this.cancelPlaybackTick();
    if (!this.clockAdvancing || !this.interpolate || this.paused || !this.isConnected || document.hidden || !this.lyrics || this.cachedIsUnsynced) return;
    const now = performance.now();
    const time = Math.max(this._currentTime, this.estimatedPlaybackTime(now));
    const next = this.playbackEvents[this.playbackEventAt(time)] ?? Infinity;
    const remaining = this.playbackStamp + this.playbackHorizon - now;
    // Native effects run continuously. JS wakes only at lyric boundaries or
    // when host updates stop, rather than rewriting clocks every frame.
    this.playbackTimer = setTimeout(() => {
      this.playbackTimer = undefined;
      this.applyPlaybackTime(Math.max(this._currentTime, this.estimatedPlaybackTime()), false, false);
      if (performance.now() - this.playbackStamp >= this.playbackHorizon) {
        this.clockAdvancing = false;
        this.holdPlaybackAnimations();
      } else this.schedulePlaybackTick();
    }, Math.max(1, Math.min(next - time, remaining)));
  }
  holdPlaybackAnimations() {
    const roots = new Set();
    for (const index of this.activeLineIndices) {
      const line = this._getLineElement(index);
      if (line) roots.add(line);
    }
    this.preActiveLineElements.forEach(line => roots.add(line));
    this.backgroundCarries.forEach(entry => roots.add(entry.clone));
    this.activeGapLineElements.forEach(line => roots.add(line));
    for (const root of roots) for (const animation of root.getAnimations({
      subtree: true
    })) {
      const target = animation.effect?.target;
      const glyph = target instanceof HTMLElement && (target.classList.contains('char-motion') ? target.querySelector('.char') : target);
      const name = 'animationName' in animation ? String(animation.animationName) : '';
      const gap = target instanceof Element && target.closest('.lyrics-gap');
      if ((AmLyrics.wipeClocks.has(animation) || AmLyrics.normalRiseClocks.has(animation) || glyph && AmLyrics.characterAnimations.get(glyph)?.animation === animation || /wipe|char-glow/.test(name) || gap) && animation.playState !== 'finished' && animation.playState !== 'idle') {
        animation.pause();
        this.heldPlaybackAnimations.add(animation);
      }
    }
  }
  releasePlaybackAnimations() {
    for (const animation of this.heldPlaybackAnimations) if (animation.playState === 'paused') {
      const time = animation.currentTime;
      animation.play();
      animation.currentTime = time;
    }
    this.heldPlaybackAnimations.clear();
  }
  finishLineRewind() {
    cancelAnimationFrame(this.rewindFrame);
    this.rewindFrame = 0;
    for (const {
      animation
    } of this.rewindEffects) {
      if (animation.playState !== 'idle' && Number(animation.currentTime) < Number(animation.effect?.getComputedTiming().endTime)) {
        const time = animation.currentTime;
        animation.play();
        // play() rewinds negative local times to zero. Negative times are valid
        // here because CSS wipes/glow may have started with a negative delay.
        animation.currentTime = time;
      }
    }
    this.rewindEffects = [];
    for (const line of this.rewindingLines) line.querySelectorAll('.shared-word-wipe').forEach(fragment => fragment.style.removeProperty('transition'));
    this.rewindingLines.clear();
  }
  startLineRewind(lines, targetTime) {
    this.finishLineRewind();
    this.rewindingLines = new Set(lines);
    for (const line of lines) {
      for (const word of AmLyrics.motionWords.get(line) || []) {
        if (word.wipe && targetTime < word.wipe.end && (word.wipe.settled || word.wipe.animations.some(animation => animation.playState === 'idle'))) AmLyrics.startWordWipe(word.wipe, word.wipe.end, word.wipe.epoch, true);
        const motion = AmLyrics.normalWordMotions.get(word.element);
        if (motion?.settled && targetTime < motion.start + NORMAL_WORD_SPRING_DURATION_MS) AmLyrics.startNormalWordMotion(motion, NORMAL_WORD_SPRING_DURATION_MS);
      }
      for (const syllable of AmLyrics.motionSyllables.get(line) || []) {
        const parameters = AmLyrics.motionParameters.get(syllable);
        for (const char of parameters?.chars || []) {
          const entry = AmLyrics.characterAnimations.get(char);
          if (entry?.settled && targetTime < entry.start + entry.end) AmLyrics.resumeCharacterMotion(char, entry.end);
        }
      }
    }
    // Use the existing painted pose, even when another rewind is interrupted.
    // Only the short seek transition needs JS; normal playback stays compositor-driven.
    lines.flatMap(line => line.getAnimations({
      subtree: true
    })).forEach(animation => {
      const effect = animation.effect;
      const target = effect?.target;
      if (!(target instanceof HTMLElement)) return;
      const name = 'animationName' in animation ? String(animation.animationName) : '';
      const syllable = target.closest('.lyrics-syllable');
      let to;
      const wipeEpoch = AmLyrics.wipeClocks.get(animation);
      const riseEpoch = AmLyrics.normalRiseClocks.get(animation);
      if (riseEpoch !== undefined) {
        to = targetTime - riseEpoch;
      } else if (wipeEpoch !== undefined) {
        to = targetTime - wipeEpoch;
      } else if (name.includes('wipe') && syllable) {
        to = targetTime - Number(syllable.dataset.startTime) + Number(effect.getTiming().delay);
      } else {
        const char = target.classList.contains('char-motion') ? target.querySelector('.char') : target;
        const entry = char && AmLyrics.characterAnimations.get(char);
        if (!entry || entry.animation !== animation && name !== 'char-glow') return;
        to = targetTime - entry.start - (name === 'char-glow' ? entry.glowEpoch : 0);
      }
      const end = Number(effect.getComputedTiming().endTime);
      this.rewindEffects.push({
        animation,
        from: Number(animation.currentTime || 0),
        to: Math.min(to, end)
      });
      animation.pause();
    });
    lines.forEach(line => line.querySelectorAll('.lyrics-syllable.finished').forEach(syllable => syllable.classList.remove('finished')));
    lines.forEach(line => line.querySelectorAll('.shared-word-wipe').forEach(fragment => {
      const target = fragment;
      target.style.transition = 'none';
      target.style.backgroundColor = 'var(--word-inactive-color, var(--lyplus-text-secondary))';
    }));
    const started = performance.now();
    const tick = now => {
      const progress = Math.min(1, (now - started) / 260);
      const eased = progress * progress * (3 - 2 * progress);
      const playbackAdvance = this.currentTime - targetTime;
      for (const {
        animation,
        from,
        to
      } of this.rewindEffects) if (animation.playState !== 'idle') animation.currentTime = from + (to + playbackAdvance - from) * eased;
      if (progress < 1) {
        this.rewindFrame = requestAnimationFrame(tick);
      } else {
        this.finishLineRewind();
        for (const line of lines) {
          AmLyrics.updateSyllablesForLine(line, this.currentTime, this.shouldReduceMotion);
          AmLyrics.seekLineWipes(line, this.currentTime);
        }
      }
    };
    this.rewindFrame = requestAnimationFrame(tick);
  }
  set currentTime(value) {
    if (!Number.isFinite(value)) return;
    const now = performance.now();
    const previousHost = this.lastHostTime;
    const expected = previousHost !== undefined && this.interpolate && !this.paused ? this.playbackAnchor + Math.min(Math.max(0, now - this.playbackStamp), 5000) : this._currentTime;
    const isSeek = previousHost !== undefined && (value < previousHost - 32 || Math.abs(value - expected) > SEEK_THRESHOLD_MS);
    const advances = previousHost !== undefined && value > previousHost;
    const duplicateWhileMoving = previousHost === value && this.clockAdvancing && now - this.lastAdvanceStamp < Math.max(200, Math.min(1000, this.hostCadence * 1.5));
    const minorCorrection = previousHost !== undefined && value < previousHost && previousHost - value <= 32 && this.clockAdvancing;
    if (advances && !isSeek && this.playbackStamp && now - this.playbackStamp > 8) this.hostCadence = AmLyrics.clamp(now - this.playbackStamp, 16, 2000);
    this.clockAdvancing = this.interpolate && !this.paused && (advances || duplicateWhileMoving || minorCorrection) && !isSeek;
    if (!duplicateWhileMoving && !minorCorrection) {
      this.playbackAnchor = value;
      this.playbackStamp = now;
    }
    if (advances || previousHost === undefined) this.lastAdvanceStamp = now;
    this.lastHostTime = value;
    if (previousHost !== value && !this.paused && !document.hidden) this.releasePlaybackAnimations();
    if (document.hidden) {
      this._currentTime = value;
      this.cancelPlaybackTick();
      return;
    }
    this.applyPlaybackTime(this.clockAdvancing ? Math.max(value, this._currentTime, this.estimatedPlaybackTime(now)) : value, previousHost === undefined || isSeek, isSeek || previousHost === undefined, previousHost !== value && !this.paused);
    if (this.paused || previousHost === value && !this.clockAdvancing) {
      this.finishLineRewind();
      this.holdPlaybackAnimations();
    }
    this.schedulePlaybackTick();
  }
  get currentTime() {
    return this._currentTime;
  }
  applyPlaybackTime(value, force = false, isSeek = false, allowRewind = true) {
    const oldValue = this._currentTime;
    if (allowRewind && oldValue - value > 32 && !this.shouldReduceMotion) {
      const nextActive = this.findActiveLineIndices(value);
      const sharedLines = this.activeLineIndices.filter(index => nextActive.includes(index)).map(index => this._getLineElement(index)).filter(line => line !== null);
      if (sharedLines.length) this.startLineRewind(sharedLines, value);else this.finishLineRewind();
    } else if (this.rewindingLines.size) {
      const nextActive = this.findActiveLineIndices(value);
      if (value - oldValue > SEEK_THRESHOLD_MS || [...this.rewindingLines].some(line => !nextActive.includes(AmLyrics.getLineIndexFromElement(line) ?? -1))) this.finishLineRewind();
    }
    this._currentTime = value;
    if ((force || oldValue !== value) && this.lyrics) {
      this._ensureLineDataCache();
      const index = this.playbackEventAt(value);
      if (force || value < oldValue || index !== this.playbackEventIndex) {
        this.playbackEventIndex = index;
        this._onTimeChanged(oldValue, value, isSeek);
      }
    }
  }
  ensureTimingCache() {
    if (this.timingLyrics === this.lyrics) return;
    this.timingLyrics = this.lyrics;
    this.lineHighlightEnds = [];
    this.activeTimelineInterval = undefined;
  }
  getBackgroundWrap(line) {
    let wrap = this.backgroundWraps.get(line);
    if (wrap === undefined) {
      wrap = line.querySelector('.background-vocal-container:not([data-bg-carried]) .background-vocal-wrap');
      this.backgroundWraps.set(line, wrap);
    }
    return wrap;
  }
  _updateFooter() {
    // Lit owns the label and icon nodes, including their update markers.
    this.requestUpdate();
  }
  connectedCallback() {
    super.connectedCallback();
    document.addEventListener('visibilitychange', this.handlePlaybackVisibility);
    this.motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.systemReducedMotion = this.motionPreference.matches;
    this.motionPreference.addEventListener('change', this.handleMotionPreference);
    this.fetchLyrics();
  }
  disconnectedCallback() {
    this.cancelPlaybackTick();
    this.clockAdvancing = false;
    this.lastHostTime = undefined;
    this.heldPlaybackAnimations.clear();
    document.removeEventListener('visibilitychange', this.handlePlaybackVisibility);
    this.finishLineRewind();
    this.pendingLayoutOffsets.clear();
    this.clearGapAnimations();
    super.disconnectedCallback();
    this.motionPreference?.removeEventListener('change', this.handleMotionPreference);
    this.motionPreference = undefined;
    this.cancelLineScrollAnimation();
    this.lyricsContainer?.querySelectorAll('.native-motion').forEach(char => AmLyrics.clearCharacterMotion(char));
    this.lyricsContainer?.querySelectorAll('.lyrics-word').forEach(word => {
      AmLyrics.clearNormalWordMotion(word);
      AmLyrics.clearWordWipe(word);
    });
    if (this.userScrollTimeoutId) {
      clearTimeout(this.userScrollTimeoutId);
      this.userScrollTimeoutId = undefined;
    }
    if (this.clickSeekTimeout) {
      clearTimeout(this.clickSeekTimeout);
      this.clickSeekTimeout = undefined;
    }
    this.clearBackgroundExpandedLine();
    this.clearProgressiveBlurLine();
    // Cancel any in-flight fetch requests
    this.fetchAbortController?.abort();
    this.fetchAbortController = undefined;
    // Remove scroll event listeners
    if (this.lyricsContainer) {
      this.lyricsContainer.removeEventListener('wheel', this._boundHandleUserScroll);
      this.lyricsContainer.removeEventListener('touchmove', this._boundHandleUserScroll);
    }
    this.preActiveLineElements = [];
    this.positionedLineElements = [];
    this.clearGapAnimations();
    this.activeGapLineElements = [];
    this.lastInstrumentalIndex = null;
    this.visibilityObserver?.disconnect();
    this.visibilityObserver = undefined;
  }
  async fetchLyrics() {
    this.cancelPlaybackTick();
    this.clockAdvancing = false;
    this.lastHostTime = undefined;
    this.heldPlaybackAnimations.clear();
    // Cancel any in-flight fetch to prevent stale results from racing
    this.fetchAbortController?.abort();
    const controller = new AbortController();
    this.fetchAbortController = controller;
    this.isLoading = true;
    this.sourceUpgrade = false;
    this.lyrics = undefined;
    this.lyricsSource = null;
    this.availableSources = [];
    this.currentSourceIndex = 0;
    this.isFetchingAlternatives = false;
    this.sourceSwitchPending = false;
    this.selectedSourceKey = null;
    this.hasFetchedAllProviders = false;
    this.hasFetchedSpicyLyrics = false;
    this._updateFooter();
    try {
      if (this.ttml) {
        const parseResult = AmLyrics.parseTTML(this.ttml);
        if (parseResult && parseResult.lines.length > 0) {
          this.lyrics = parseResult.lines;
          this.lyricsSource = 'Local';
          if (parseResult.songwriters) {
            this.songwriters = parseResult.songwriters;
          }
          this.availableSources = [{
            lines: this.lyrics,
            source: 'Local',
            originalTTML: this.ttml,
            songwriters: this.songwriters
          }];
          this.currentSourceIndex = 0;
          this.hasFetchedAllProviders = true;
          this._updateFooter();
          await this.onLyricsLoaded();
          return;
        }
      }
      const lrcRedResult = await AmLyrics.fetchLyricsFromLrcRed(this.songTitle?.trim() || '', this.songArtist?.trim() || '', this.isrc?.trim(), {
        album: this.songAlbum?.trim(),
        durationMs: this.songDurationMs || this.duration
      }, this.query?.trim(), controller.signal);
      if (controller.signal.aborted) return;
      if (lrcRedResult && !lrcRedResult.byModel && AmLyrics.hasWordSyncedLyrics(lrcRedResult.lines)) {
        this.availableSources = [lrcRedResult];
        this.lyrics = lrcRedResult.lines;
        this.lyricsSource = lrcRedResult.source;
        if (lrcRedResult.songwriters) {
          this.songwriters = lrcRedResult.songwriters;
        }
        this._updateFooter();
        await this.onLyricsLoaded();
        return;
      }
      this.isFetchingAlternatives = true;
      if (lrcRedResult) {
        await this.publishAvailableSources([lrcRedResult], controller.signal);
      }
      const resolvedMetadata = await this.resolveSongMetadata(lrcRedResult?.metadata);
      // If a newer fetch was triggered while we awaited, bail out
      if (controller.signal.aborted) return;
      const isMusicIdOnlyRequest = Boolean(this.musicId) && !this.songTitle && !this.songArtist && !this.query && !this.isrc;
      const collectedSources = lrcRedResult ? [lrcRedResult] : [];
      const hasWordSync = sources => sources.some(s => !s.byModel && AmLyrics.hasWordSyncedLyrics(s.lines));
      if (resolvedMetadata?.metadata && !isMusicIdOnlyRequest) {
        const title = resolvedMetadata.metadata.title?.trim() || '';
        const artist = resolvedMetadata.metadata.artist?.trim() || '';
        if (!lrcRedResult?.byModel) {
          const biniResult = await AmLyrics.fetchLyricsFromBiniLyrics(title, artist, resolvedMetadata.catalogIsrc, resolvedMetadata.metadata);
          if (controller.signal.aborted) return;
          if (biniResult?.lines.length) {
            collectedSources.push(biniResult);
            await this.publishAvailableSources(collectedSources, controller.signal);
          }
        }
      }
      if (lrcRedResult?.byModel || !hasWordSync(collectedSources)) {
        const spicyResult = await this.fetchLyricsFromSpicyLyrics(resolvedMetadata.spotifyId, controller.signal, lrcRedResult?.isrc || resolvedMetadata.catalogIsrc, resolvedMetadata.metadata);
        if (controller.signal.aborted) return;
        if (spicyResult) {
          collectedSources.push(spicyResult);
          await this.publishAvailableSources(collectedSources, controller.signal);
        }
      }
      const unisonIsrc = lrcRedResult?.isrc || resolvedMetadata.catalogIsrc;
      if ((resolvedMetadata.metadata || unisonIsrc) && !isMusicIdOnlyRequest && !hasWordSync(collectedSources)) {
        const unisonResult = await AmLyrics.fetchLyricsFromUnison(resolvedMetadata.metadata, unisonIsrc);
        if (unisonResult && unisonResult.lines.length > 0) {
          collectedSources.push(unisonResult);
          await this.publishAvailableSources(collectedSources, controller.signal);
        }
        if (controller.signal.aborted) return;
      }
      if (resolvedMetadata?.metadata && !isMusicIdOnlyRequest) {
        const {
          title,
          artist
        } = resolvedMetadata.metadata;
        if (!hasWordSync(collectedSources)) {
          const youLyResults = await AmLyrics.fetchLyricsFromYouLyPlus(title, artist, resolvedMetadata.catalogIsrc, resolvedMetadata.metadata, true);
          if (youLyResults && youLyResults.length > 0) {
            collectedSources.push(...youLyResults);
            await this.publishAvailableSources(collectedSources, controller.signal);
          }
          if (controller.signal.aborted) return;
        }
      }
      const hasLineSync = sources => sources.some(s => AmLyrics.hasWordSyncedLyrics(s.lines) || !s.byModel && AmLyrics.getTimingRank(s.lines) < 2);
      if ((collectedSources.length === 0 || !hasLineSync(collectedSources)) && resolvedMetadata?.metadata) {
        // Fallback: LRCLIB
        const lrclibResult = await AmLyrics.fetchLyricsFromLrclib(resolvedMetadata.metadata);
        if (lrclibResult && lrclibResult.lines.length > 0) {
          collectedSources.push({
            lines: lrclibResult.lines,
            source: 'LRCLIB'
          });
        }
      }
      if (collectedSources.length === 0 && resolvedMetadata?.metadata) {
        const geniusResult = await AmLyrics.fetchLyricsFromGenius(resolvedMetadata.metadata);
        if (geniusResult && geniusResult.lines.length > 0) {
          collectedSources.push({
            lines: geniusResult.lines,
            source: 'Genius'
          });
        }
      }
      if (controller.signal.aborted) return;
      this.hasFetchedAllProviders = collectedSources.length === 0 || collectedSources.some(s => s.source === 'LRCLIB' || s.source === 'Genius');
      this._updateFooter();
      const published = await this.publishAvailableSources(collectedSources, controller.signal);
      if (controller.signal.aborted) return;
      if (published) {
        if (!this.noAutoAlternates) await this.autoProcessLyrics();
        return;
      }
      this.lyrics = undefined;
      this.lyricsSource = null;
    } finally {
      // Only update loading state if this fetch wasn't superseded
      if (!controller.signal.aborted) {
        this.isLoading = false;
        this.isFetchingAlternatives = false;
        this.sourceSwitchPending = false;
        this._updateFooter();
      }
    }
  }
  async publishAvailableSources(sources, signal) {
    if (signal?.aborted) return false;
    const previousSource = this.availableSources[this.findCurrentSourceIndex()];
    this.availableSources = AmLyrics.mergeAndSortSources(sources);
    const best = this.availableSources[0];
    if (!best) return false;
    let selected = this.availableSources.find(source => AmLyrics.getSourceKey(source.source) === this.selectedSourceKey) || best;
    if (this.sourceSwitchPending) {
      const currentKey = AmLyrics.getSourceKey(this.lyricsSource);
      const alternative = this.availableSources.find(source => AmLyrics.getSourceKey(source.source) !== currentKey);
      if (alternative) {
        selected = alternative;
        this.selectedSourceKey = AmLyrics.getSourceKey(selected.source);
        this.sourceSwitchPending = false;
      }
    }
    this.currentSourceIndex = this.availableSources.indexOf(selected);
    this.isLoading = false;
    if (!this.lyrics || previousSource?.lines !== selected.lines || this.lyricsSource !== selected.source) {
      this.sourceUpgrade = Boolean(this.lyrics);
      this.lyrics = selected.lines;
      this.lyricsSource = selected.source;
      this.songwriters = selected.songwriters;
      await this.onLyricsLoaded(false);
    }
    this._updateFooter();
    return true;
  }
  async onLyricsLoaded(processAlternates = true) {
    this.activeLineIndices = [];
    this.preActiveLineElements = [];
    this.positionedLineElements = [];
    this.clearGapAnimations();
    this.activeGapLineElements = [];
    this.lastInstrumentalIndex = null;
    this.clearBackgroundExpandedLine();
    if (this.lyricsContainer) {
      this.isProgrammaticScroll = true;
      this.lyricsContainer.scrollTop = 0;
      window.setTimeout(() => {
        this.isProgrammaticScroll = false;
      }, 100);
    }
    if (processAlternates && !this.noAutoAlternates) await this.autoProcessLyrics();
  }
  async autoProcessLyrics() {
    if (this.noAutoAlternates) return;
    if (this.showRomanization) {
      await this.applyRomanization();
    }
    if (this.showTranslation && !this.noAutoAlternates) {
      await this.applyTranslation();
    }
  }
  static hasWordSyncedLyrics(lines) {
    return lines.some(line => line.text.some(s => s.text.trim() && (s.timestamp > 0 || s.endtime > 0)) && (line.isWordSynced ?? (line.text.length > 1 && !line.text.every(s => s.lineSynced))));
  }
  static getTimingRank(lines) {
    if (AmLyrics.hasWordSyncedLyrics(lines)) return 0;
    return lines.some(line => line.text.some(s => s.text.trim()) && (line.timestamp > 0 || line.endtime > 0)) ? 1 : 2;
  }
  static getRankForCollected(sourceLabel) {
    const lower = sourceLabel.trim().toLowerCase();
    if (lower === 'lrc.red') return 0;
    // Spicy catalogue labels belong to Spicy, including "(Apple Music)".
    if (lower.startsWith('spicy lyrics')) return 2.5;
    if (lower.includes('apple')) return 1;
    if (lower.includes('bini')) return 2;
    if (lower.includes('unison')) return 3;
    if (lower.includes('qq') || lower.includes('lyricsplus')) return 4;
    if (lower.includes('musixmatch')) return 5;
    if (lower.includes('lrclib')) return 6;
    if (lower.includes('genius')) return 8;
    return 7;
  }
  static compareSources(a, b) {
    // Word > line > plain; prefer non-model results within each timing tier.
    return AmLyrics.getTimingRank(a.lines) - AmLyrics.getTimingRank(b.lines) || Number(Boolean(a.byModel)) - Number(Boolean(b.byModel)) || AmLyrics.getRankForCollected(a.source) - AmLyrics.getRankForCollected(b.source);
  }
  static getDisplaySourceLabel(sourceLabel) {
    return sourceLabel.toLowerCase().includes('lyricsplus') ? 'QQ' : sourceLabel;
  }
  static getSourceKey(sourceLabel) {
    const lower = (sourceLabel || '').trim().toLowerCase();
    if (!lower) return '';
    if (lower.includes('lyricsplus') || lower === 'qq') return 'qq';
    return lower.replace(/\s+/g, ' ');
  }
  static mergeAndSortSources(collectedSources) {
    const uniqueSourcesMap = new Map();
    collectedSources.forEach(source => {
      if (!source.lines.some(line => line.text.some(s => s.text.trim()))) return;
      const key = AmLyrics.getSourceKey(source.source);
      const previous = uniqueSourcesMap.get(key);
      if (!previous || AmLyrics.compareSources(source, previous) < 0) {
        uniqueSourcesMap.set(key, {
          ...source,
          source: AmLyrics.getDisplaySourceLabel(source.source)
        });
      }
    });
    return Array.from(uniqueSourcesMap.values()).sort(AmLyrics.compareSources);
  }
  findCurrentSourceIndex(sources = this.availableSources, sourceLabel = this.lyricsSource, lines = this.lyrics) {
    const identityIndex = sources.findIndex(source => source.lines === lines);
    if (identityIndex !== -1) return identityIndex;
    const sourceKey = AmLyrics.getSourceKey(sourceLabel);
    if (!sourceKey) return -1;
    return sources.findIndex(source => AmLyrics.getSourceKey(source.source) === sourceKey);
  }
  static getNextSourceIndex(sources, currentIndex, currentSourceLabel, currentLines) {
    if (sources.length <= 1) return -1;
    if (currentIndex !== -1) {
      return (currentIndex + 1) % sources.length;
    }
    const currentKey = AmLyrics.getSourceKey(currentSourceLabel);
    const fallbackIndex = sources.findIndex(source => source.lines !== currentLines && AmLyrics.getSourceKey(source.source) !== currentKey);
    return fallbackIndex === -1 ? 0 : fallbackIndex;
  }
  async applySourceAtIndex(index) {
    const sourceResult = this.availableSources[index];
    if (!sourceResult) return;
    this.currentSourceIndex = index;
    this.sourceUpgrade = Boolean(this.lyrics);
    this.lyrics = sourceResult.lines;
    this.lyricsSource = sourceResult.source;
    this.songwriters = sourceResult.songwriters;
    await this.onLyricsLoaded();
  }
  async switchSource() {
    const controller = this.fetchAbortController;
    if (this.availableSources.length > 1) {
      const nextIndex = AmLyrics.getNextSourceIndex(this.availableSources, this.findCurrentSourceIndex(), this.lyricsSource, this.lyrics);
      if (nextIndex !== -1) {
        this.selectedSourceKey = AmLyrics.getSourceKey(this.availableSources[nextIndex].source);
        this.sourceSwitchPending = false;
        await this.applySourceAtIndex(nextIndex);
      }
    } else if (!this.hasFetchedAllProviders) {
      this.sourceSwitchPending = true;
    }
    if (controller !== this.fetchAbortController || controller?.signal.aborted || this.isFetchingAlternatives || this.hasFetchedAllProviders) return;
    await this.discoverAlternativeSources();
  }
  async discoverAlternativeSources() {
    const controller = this.fetchAbortController;
    const isCurrent = () => this.isConnected && controller === this.fetchAbortController && !controller?.signal.aborted;
    const publish = async sources => {
      if (isCurrent() && sources.length) await this.publishAvailableSources([...this.availableSources, ...sources], controller?.signal);
    };
    let completed = false;
    this.isFetchingAlternatives = true;
    this._updateFooter();
    try {
      const resolvedMetadata = await this.resolveSongMetadata(this.availableSources.find(s => s.source === 'lrc.red')?.metadata);
      if (!isCurrent()) return;
      if (resolvedMetadata.metadata && !this.availableSources.some(s => s.byModel) && !this.availableSources.some(s => s.source.toLowerCase().includes('bini'))) {
        const biniResult = await AmLyrics.fetchLyricsFromBiniLyrics(resolvedMetadata.metadata.title, resolvedMetadata.metadata.artist, resolvedMetadata.catalogIsrc, resolvedMetadata.metadata);
        if (!isCurrent()) return;
        if (biniResult) await publish([biniResult]);
      }
      if (!this.hasFetchedSpicyLyrics) {
        const spicyResult = await this.fetchLyricsFromSpicyLyrics(resolvedMetadata.spotifyId, controller?.signal, this.availableSources.find(s => s.source === 'lrc.red')?.isrc || resolvedMetadata.catalogIsrc, resolvedMetadata.metadata);
        if (!isCurrent()) return;
        if (spicyResult) await publish([spicyResult]);
      }
      const unisonIsrc = this.availableSources.find(s => s.source === 'lrc.red')?.isrc || resolvedMetadata.catalogIsrc;
      if ((resolvedMetadata.metadata || unisonIsrc) && !this.availableSources.some(s => s.source.toLowerCase().includes('unison'))) {
        const unisonResult = await AmLyrics.fetchLyricsFromUnison(resolvedMetadata.metadata, unisonIsrc);
        if (!isCurrent()) return;
        if (unisonResult && unisonResult.lines.length > 0) await publish([unisonResult]);
      }
      if (resolvedMetadata.metadata) {
        // Only a non-model Apple word result completes the KPoe upgrade search.
        if (!this.availableSources.some(s => !s.byModel && AmLyrics.getRankForCollected(s.source) === 1 && AmLyrics.hasWordSyncedLyrics(s.lines))) {
          const title = resolvedMetadata.metadata.title?.trim() || '';
          const artist = resolvedMetadata.metadata.artist?.trim() || '';
          const youLyResults = await AmLyrics.fetchLyricsFromYouLyPlus(title, artist, resolvedMetadata.catalogIsrc, resolvedMetadata.metadata, true);
          if (!isCurrent()) return;
          if (youLyResults && youLyResults.length > 0) {
            await publish(youLyResults);
          }
        }
        // Try LRCLIB if not fetched
        if (!this.availableSources.some(s => s.source.toLowerCase().includes('lrclib'))) {
          const lrclibResult = await AmLyrics.fetchLyricsFromLrclib(resolvedMetadata.metadata);
          if (!isCurrent()) return;
          if (lrclibResult && lrclibResult.lines.length > 0) {
            await publish([{
              ...lrclibResult,
              source: 'LRCLIB'
            }]);
          }
        }
        if (!this.availableSources.some(s => s.source.toLowerCase().includes('genius'))) {
          const geniusResult = await AmLyrics.fetchLyricsFromGenius(resolvedMetadata.metadata);
          if (!isCurrent()) return;
          if (geniusResult && geniusResult.lines.length > 0) {
            await publish([{
              ...geniusResult,
              source: 'Genius'
            }]);
          }
        }
      }
      completed = true;
    } catch (error) {
      // Keep available sources usable and allow another discovery attempt.
      // eslint-disable-next-line no-console
      console.warn('Alternative lyrics search failed', error);
    } finally {
      if (isCurrent()) {
        this.hasFetchedAllProviders = completed;
        this.isFetchingAlternatives = false;
        this.sourceSwitchPending = false;
        this._updateFooter();
      }
    }
  }
  async resolveSongMetadata(fallback) {
    const metadata = {
      title: this.songTitle?.trim() || fallback?.title || '',
      artist: this.songArtist?.trim() || fallback?.artist || '',
      album: this.songAlbum?.trim() || fallback?.album,
      songwriters: this.songwriters?.trim() || undefined,
      durationMs: fallback?.durationMs
    };
    if (typeof this.songDurationMs === 'number' && this.songDurationMs > 0) {
      metadata.durationMs = this.songDurationMs;
    } else if (typeof this.duration === 'number' && this.duration > 0) {
      metadata.durationMs = this.duration;
    }
    const appleSong = null;
    let appleId = this.musicId;
    let catalogIsrc = this.isrc;
    if (this.query && (!metadata.title || !metadata.artist || !metadata.album)) {
      const parsed = AmLyrics.parseQueryMetadata(this.query);
      if (parsed) {
        if (!metadata.title && parsed.title) {
          metadata.title = parsed.title;
        }
        if (!metadata.artist && parsed.artist) {
          metadata.artist = parsed.artist;
        }
        if (!metadata.album && parsed.album) {
          metadata.album = parsed.album;
        }
      }
    }
    let catalogResult = null;
    if (this.query && (!metadata.title || !metadata.artist)) {
      catalogResult = await AmLyrics.searchLyricsPlusCatalog(this.query);
      if (catalogResult) {
        if (!metadata.title && catalogResult.title) {
          metadata.title = catalogResult.title;
        }
        if (!metadata.artist && catalogResult.artist) {
          metadata.artist = catalogResult.artist;
        }
        if (!metadata.album && catalogResult.album) {
          metadata.album = catalogResult.album;
        }
        if (!metadata.songwriters && catalogResult.songwriters) {
          metadata.songwriters = catalogResult.songwriters;
        }
        if (metadata.durationMs == null && typeof catalogResult.durationMs === 'number' && catalogResult.durationMs > 0) {
          metadata.durationMs = catalogResult.durationMs;
        }
        if (!appleId && catalogResult.id?.appleMusic) {
          appleId = catalogResult.id.appleMusic;
        }
        if (!catalogIsrc && catalogResult.isrc) {
          catalogIsrc = catalogResult.isrc;
        }
      }
    }
    const trimmedTitle = metadata.title?.trim() ?? '';
    const trimmedArtist = metadata.artist?.trim() ?? '';
    const trimmedAlbum = metadata.album?.trim();
    const sanitizedDuration = typeof metadata.durationMs === 'number' && Number.isFinite(metadata.durationMs) && metadata.durationMs > 0 ? Math.round(metadata.durationMs) : undefined;
    const finalMetadata = trimmedTitle && trimmedArtist ? {
      title: trimmedTitle,
      artist: trimmedArtist,
      album: trimmedAlbum || undefined,
      durationMs: sanitizedDuration
    } : undefined;
    return {
      metadata: finalMetadata,
      appleId,
      appleSong,
      catalogIsrc,
      spotifyId: this.spotifyId?.trim() || catalogResult?.id?.spotify
    };
  }
  static async lookupSpotifyIdByIsrc(isrc, signal) {
    if (signal.aborted) return undefined;
    const controller = new AbortController();
    const abort = () => controller.abort();
    signal.addEventListener('abort', abort, {
      once: true
    });
    const timeout = setTimeout(abort, BINIMUM_LOOKUP_TIMEOUT_MS);
    try {
      const response = await fetch(`https://link.binimum.org/api/v1/isrc/${encodeURIComponent(isrc.trim())}`, {
        signal: controller.signal
      });
      if (!response.ok) return undefined;
      const data = await response.json();
      return typeof data?.spotify === 'string' && /^[A-Za-z0-9]{22}$/.test(data.spotify) ? data.spotify : undefined;
    } catch {
      return undefined;
    } finally {
      clearTimeout(timeout);
      signal.removeEventListener('abort', abort);
    }
  }
  static async getSpotifyToken() {
    if (AmLyrics.spotifyToken && AmLyrics.spotifyToken.expiresAt > Date.now()) return AmLyrics.spotifyToken.value;
    if (AmLyrics.spotifyTokenRequest) return AmLyrics.spotifyTokenRequest;
    // Share one request across component instances; a track change must not
    // cancel a refresh that another instance is still waiting for.
    AmLyrics.spotifyTokenRequest = (async () => {
      const requestedAt = Date.now();
      try {
        const response = await fetchWithTimeout(SPOTIFY_TOKEN_URL, {
          method: 'POST'
        });
        if (!response.ok) return null;
        const payload = await response.json();
        const lifetime = payload.expires_in * 1000;
        if (typeof payload.access_token !== 'string' || !payload.access_token.trim() || !Number.isFinite(lifetime) || lifetime <= 0) return null;
        AmLyrics.spotifyToken = {
          value: payload.access_token,
          expiresAt: requestedAt + lifetime - Math.min(30000, lifetime * 0.1)
        };
        return AmLyrics.spotifyToken.value;
      } catch {
        return null;
      }
    })();
    try {
      return await AmLyrics.spotifyTokenRequest;
    } finally {
      AmLyrics.spotifyTokenRequest = undefined;
    }
  }
  async fetchLyricsFromSpicyLyrics(spotifyId, signal, isrc, metadata) {
    this.hasFetchedSpicyLyrics = true;
    const controller = new AbortController();
    const abort = () => controller.abort();
    if (signal?.aborted) return null;
    signal?.addEventListener('abort', abort, {
      once: true
    });
    const timeout = setTimeout(abort, FETCH_TIMEOUT_MS);
    try {
      let trackId = spotifyId;
      if (!trackId && isrc) {
        trackId = await AmLyrics.lookupSpotifyIdByIsrc(isrc, controller.signal);
        if (controller.signal.aborted) return null;
      }
      if (!trackId) {
        let searchTerm = isrc ? `isrc:${isrc}` : '';
        if (!searchTerm && metadata?.title && metadata.artist) searchTerm = `track:${metadata.title} artist:${metadata.artist}`;
        if (!searchTerm) return null;
        const search = new URLSearchParams({
          q: searchTerm,
          type: 'track',
          limit: isrc ? '1' : '5'
        });
        let token = await AmLyrics.getSpotifyToken();
        if (!token || controller.signal.aborted) return null;
        const lookupTrack = accessToken => fetch(`https://api.spotify.com/v1/search?${search}`, {
          signal: controller.signal,
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        });
        let lookup = await lookupTrack(token);
        if (lookup.status === 401) {
          if (AmLyrics.spotifyToken?.value === token) AmLyrics.spotifyToken = undefined;
          token = await AmLyrics.getSpotifyToken();
          if (!token || controller.signal.aborted) return null;
          lookup = await lookupTrack(token);
        }
        if (!lookup.ok) return null;
        const result = await lookup.json();
        const tracks = Array.isArray(result?.tracks?.items) ? result.tracks.items : [];
        const normalize = value => value.normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim();
        const match = isrc ? tracks.find(track => !track.external_ids?.isrc || track.external_ids.isrc.toUpperCase() === isrc.toUpperCase()) : tracks.find(track => normalize(track.name || '') === normalize(metadata.title) && track.artists?.some(artist => normalize(artist.name || '') === normalize(metadata.artist)) && (!metadata.durationMs || Math.abs(track.duration_ms - metadata.durationMs) <= 3000));
        trackId = match?.id;
      }
      if (!trackId || !/^[A-Za-z0-9]{22}$/.test(trackId)) return null;
      const response = await fetch(`https://api.spicylyrics.org/v1/lyrics/${encodeURIComponent(trackId)}`, {
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${SPICY_LYRICS_CLIENT_KEY}`
        }
      });
      if (!response.ok) return null;
      return parseSpicyLyrics(await response.json());
    } catch {
      return null;
    } finally {
      clearTimeout(timeout);
      signal?.removeEventListener('abort', abort);
    }
  }
  static parseQueryMetadata(rawQuery) {
    const trimmed = rawQuery?.trim();
    if (!trimmed) return null;
    const result = {};
    const hyphenSplit = trimmed.split(/\s[-–—]\s/);
    if (hyphenSplit.length >= 2) {
      const [rawTitle, ...rest] = hyphenSplit;
      const rawArtist = rest.join(' - ');
      const titleCandidate = rawTitle.trim();
      const artistCandidate = rawArtist.trim();
      if (titleCandidate && artistCandidate) {
        result.title = titleCandidate;
        result.artist = artistCandidate;
        return result;
      }
    }
    const bySplit = trimmed.split(/\s+[bB]y\s+/);
    if (bySplit.length === 2) {
      const [maybeTitle, maybeArtist] = bySplit.map(part => part.trim());
      if (maybeTitle && maybeArtist) {
        result.title = maybeTitle;
        result.artist = maybeArtist;
        return result;
      }
    }
    return null;
  }
  static async searchLyricsPlusCatalog(searchTerm) {
    const trimmedQuery = searchTerm?.trim();
    if (!trimmedQuery) return null;
    for (const base of KPOE_SERVERS) {
      const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base;
      const url = `${normalizedBase}/v1/songlist/search?q=${encodeURIComponent(trimmedQuery)}`;
      try {
        // eslint-disable-next-line no-await-in-loop
        const response = await fetchWithTimeout(url);
        if (response.ok) {
          // eslint-disable-next-line no-await-in-loop
          const payload = await response.json();
          let results = [];
          const typedPayload = payload;
          if (Array.isArray(typedPayload?.results)) {
            results = typedPayload.results;
          } else if (Array.isArray(payload)) {
            results = payload;
          }
          if (results.length > 0) {
            const primary = results.find(item => item?.id && item.id.appleMusic);
            return primary ?? results[0];
          }
        }
      } catch (error) {
        // Ignore and try next server
      }
    }
    return null;
  }
  static async fetchLyricsFromLrcRed(title, artist, isrc, metadata = {}, searchQuery = '', signal = undefined) {
    if (signal?.aborted) return null;
    const controller = new AbortController();
    const abort = () => controller.abort();
    signal?.addEventListener('abort', abort, {
      once: true
    });
    const timeoutId = setTimeout(() => controller.abort(), LRC_RED_TIMEOUT_MS);
    try {
      const fetchSong = async trackIsrc => {
        try {
          const response = await fetch(`https://lrc.red/s/${encodeURIComponent(trackIsrc)}.song.json`, {
            signal: controller.signal
          });
          if (!response.ok) return null;
          const song = await response.json();
          // The JSON also carries the original TTML, including its alternates
          // and background vocals. Keep that for lossless rendering/downloads.
          const originalTTML = typeof song.source === 'string' ? song.source : undefined;
          const parsed = originalTTML ? AmLyrics.parseTTML(originalTTML) : null;
          const lines = parsed?.lines.length ? parsed.lines : AmLyrics.parseLrcRedJson(song);
          if (!lines.length) return null;
          return {
            lines,
            source: 'lrc.red',
            originalTTML,
            byModel: song.byModel === true,
            isrc: trackIsrc,
            metadata: typeof song.title === 'string' && typeof song.artist === 'string' ? {
              title: song.title,
              artist: song.artist,
              album: typeof song.album === 'string' ? song.album : undefined,
              durationMs: secondsToMs(song.duration) || undefined
            } : undefined,
            songwriters: Array.isArray(song.songwriters) ? song.songwriters.join(', ') : parsed?.songwriters
          };
        } catch {
          return null;
        }
      };
      if (isrc) {
        const result = await fetchSong(isrc);
        if (result) return result;
        if (controller.signal.aborted) return null;
      }
      let url;
      if (title && artist) {
        const params = new URLSearchParams({
          track: title,
          artist
        });
        if (metadata.album) params.set('album', metadata.album);
        if (metadata.durationMs && Number.isFinite(metadata.durationMs) && metadata.durationMs > 0) {
          params.set('duration', Math.round(metadata.durationMs / 1000).toString());
        }
        url = `https://lrc.red/match.json?${params.toString()}`;
      } else if (searchQuery) {
        url = `https://lrc.red/search.json?${new URLSearchParams({
          q: searchQuery
        })}`;
      } else {
        return null;
      }
      try {
        const response = await fetch(url, {
          signal: controller.signal
        });
        if (!response.ok) return null;
        const payload = await response.json();
        const hit = Array.isArray(payload?.hits) ? payload.hits[0] : undefined;
        if (typeof hit?.isrc === 'string' && hit.isrc.trim()) {
          return await fetchSong(hit.isrc.trim());
        }
      } catch {
        // Continue with the existing providers when lrc.red is unavailable.
      }
      return null;
    } finally {
      clearTimeout(timeoutId);
      signal?.removeEventListener('abort', abort);
    }
  }
  static parseLrcRedJson(song) {
    const entries = song?.lyrics?.lines;
    if (!Array.isArray(entries)) return [];
    return entries.flatMap(line => {
      if (typeof line?.text !== 'string' || !line.text.trim()) return [];
      const timestamp = secondsToMs(line.begin);
      const endtime = secondsToMs(line.end, timestamp);
      const wordSynced = song.lyrics.sync === 'word' && Array.isArray(line.words) && line.words.length > 0;
      const text = wordSynced ? line.words.flatMap((word, wordIndex) => Array.isArray(word) ? word.map((syllable, index) => {
        const part = index < word.length - 1;
        const space = !part && wordIndex < line.words.length - 1 ? ' ' : '';
        return {
          text: `${syllable.text || ''}${space}`,
          part,
          timestamp: secondsToMs(syllable.begin, timestamp),
          endtime: secondsToMs(syllable.end, endtime)
        };
      }) : []) : [{
        text: line.text,
        part: false,
        timestamp,
        endtime,
        lineSynced: true
      }];
      return text.length ? [{
        text,
        background: false,
        backgroundText: [],
        oppositeTurn: line.voice === 'b',
        agentId: line.voice,
        timestamp,
        endtime,
        isWordSynced: wordSynced
      }] : [];
    });
  }
  static async fetchLyricsFromBiniLyrics(title, artist, isrc, metadata = {}) {
    if ((!title || !artist) && !isrc) return null;
    try {
      let cacheData = null;
      if (isrc) {
        try {
          const isrcUrl = `https://lyrics-api.binimum.org/?isrc=${encodeURIComponent(isrc)}`;
          const isrcRes = await fetchWithTimeout(isrcUrl);
          if (isrcRes.ok) {
            const data = await isrcRes.json();
            if (data.results && data.results.length > 0) {
              cacheData = data;
            }
          }
        } catch {
          // Fall through to title/artist search
        }
      }
      if (!cacheData && title && artist) {
        const cacheParams = new URLSearchParams({
          track: title,
          artist
        });
        if (metadata.album) {
          cacheParams.append('album', metadata.album);
        }
        if (metadata.durationMs && metadata.durationMs > 0) {
          cacheParams.append('duration', Math.round(metadata.durationMs / 1000).toString());
        }
        const cacheUrl = `https://lyrics-api.binimum.org/?${cacheParams.toString()}`;
        const cacheRes = await fetchWithTimeout(cacheUrl);
        if (cacheRes.ok) {
          cacheData = await cacheRes.json();
        }
      }
      if (cacheData && cacheData.results && cacheData.results.length > 0) {
        const result = cacheData.results[0];
        if (result.lyricsUrl) {
          const ttmlRes = await fetchWithTimeout(result.lyricsUrl);
          if (ttmlRes.ok) {
            const ttmlText = await ttmlRes.text();
            const parseResult = AmLyrics.parseTTML(ttmlText);
            if (parseResult && parseResult.lines.length > 0) {
              return {
                lines: parseResult.lines,
                source: 'BiniLyrics',
                originalTTML: ttmlText,
                songwriters: parseResult.songwriters
              };
            }
          }
        }
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Cache API failed', e);
    }
    return null;
  }
  static async fetchLyricsFromYouLyPlus(title, artist, isrc, metadata = {}, skipBiniCache = false) {
    if ((!title || !artist) && !isrc) return [];
    const params = new URLSearchParams();
    if (title) params.append('title', title);
    if (artist) params.append('artist', artist);
    if (isrc) params.append('isrc', isrc);
    if (metadata.album) {
      params.append('album', metadata.album);
    }
    if (metadata.durationMs && metadata.durationMs > 0) {
      params.append('duration', Math.round(metadata.durationMs / 1000).toString());
    }
    if (!DEFAULT_KPOE_SOURCE_ORDER.includes('apple')) {
      params.append('source', DEFAULT_KPOE_SOURCE_ORDER);
    }
    const allResults = [];
    if (!skipBiniCache) {
      const biniResult = await AmLyrics.fetchLyricsFromBiniLyrics(title, artist, isrc, metadata);
      if (biniResult) {
        allResults.push(biniResult);
        if (!biniResult.byModel && AmLyrics.hasWordSyncedLyrics(biniResult.lines)) return allResults;
      }
    }
    // Shuffle servers so we pick a random one first, with all others as fallback
    // Try up to 3 servers to improve reliability when some have CORS or connectivity issues
    const shuffledServers = [...KPOE_SERVERS].sort(() => Math.random() - 0.5).slice(0, 3);
    for (const base of shuffledServers) {
      const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base;
      const url = `${normalizedBase}/v2/lyrics/get?${params.toString()}`;
      let payload = null;
      try {
        // eslint-disable-next-line no-await-in-loop
        const response = await fetchWithTimeout(url);
        if (response.ok) {
          // eslint-disable-next-line no-await-in-loop
          payload = await response.json();
        }
      } catch {
        payload = null;
      }
      if (payload) {
        const lines = AmLyrics.convertKPoeLyrics(payload);
        if (lines && lines.length > 0) {
          const sourceLabel = payload?.metadata?.source || payload?.metadata?.provider || 'LyricsPlus (KPoe)';
          const rank = AmLyrics.getRankForCollected(sourceLabel);
          const result = {
            lines,
            source: sourceLabel
          };
          allResults.push(result);
          // If source is Apple synced, we have the best so we can just immediately break the sweep
          if (rank === 1 && AmLyrics.hasWordSyncedLyrics(lines)) {
            break;
          }
        }
      }
    }
    // If we haven't found a completely synced result (rank 1 or 2) among the servers,
    // force an explicit query against lyricsplus.binimum.org looking for word lyrics
    const hasHighRankResult = allResults.some(r => AmLyrics.getRankForCollected(r.source) <= 2 && !r.byModel && AmLyrics.hasWordSyncedLyrics(r.lines));
    if (!hasHighRankResult) {
      try {
        const fallbackParams = new URLSearchParams(params);
        const url = `https://lyricsplus.binimum.org/v2/lyrics/get?${fallbackParams.toString()}`;
        const response = await fetchWithTimeout(url);
        if (response.ok) {
          const payload = await response.json();
          if (payload) {
            const lines = AmLyrics.convertKPoeLyrics(payload);
            const sourceLabel = payload?.metadata?.source || payload?.metadata?.provider || 'LyricsPlus (KPoe)';
            const hasWordSync = lines && AmLyrics.hasWordSyncedLyrics(lines);
            if (lines && lines.length > 0 && hasWordSync) {
              allResults.push({
                lines,
                source: sourceLabel
              });
            }
          }
        }
      } catch (error) {
        // Explicit fallback failed, ignore
      }
    }
    return AmLyrics.mergeAndSortSources(allResults);
  }
  /**
   * Parse LRC subtitle format into LyricsLine[].
   * Handles "[mm:ss.xx] text" lines.
   */
  static parseLrcSubtitles(lrc) {
    if (!lrc || typeof lrc !== 'string') return [];
    const lines = [];
    const rawLines = lrc.split('\n');
    const parsed = [];
    for (const raw of rawLines) {
      const match = raw.match(/^\[(\d{1,3}):(\d{2})\.(\d{2,3})\]\s?(.*)$/);
      if (!match) {
        // Skip non-timestamped lines (headers like [ti:], [ar:], etc.)
        // eslint-disable-next-line no-continue
        continue;
      }
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      let centiseconds = parseInt(match[3], 10);
      // Handle both mm:ss.xx (centiseconds) and mm:ss.xxx (milliseconds)
      if (match[3].length === 3) {
        centiseconds = Math.round(centiseconds / 10);
      }
      const timestamp = (minutes * 60 + seconds) * 1000 + centiseconds * 10;
      const text = match[4] || '';
      parsed.push({
        timestamp,
        text
      });
    }
    for (let i = 0; i < parsed.length; i += 1) {
      const {
        timestamp,
        text
      } = parsed[i];
      // Endtime is the start of the next line, or timestamp + 5s for the last line
      const endtime = i + 1 < parsed.length ? parsed[i + 1].timestamp : timestamp + 5000;
      // Skip empty lines (instrumental gaps)
      if (!text.trim()) {
        // eslint-disable-next-line no-continue
        continue;
      }
      const syllable = {
        text,
        part: false,
        timestamp,
        endtime,
        lineSynced: true
      };
      lines.push({
        text: [syllable],
        background: false,
        backgroundText: [],
        oppositeTurn: false,
        timestamp,
        endtime,
        isWordSynced: false
      });
    }
    return lines;
  }
  /**
   * Fetch lyrics from LRCLIB.
   * Uses search endpoint, prefers synced lyrics.
   */
  static async fetchLyricsFromLrclib(metadata) {
    const title = metadata.title?.trim();
    const artist = metadata.artist?.trim();
    if (!title || !artist) return null;
    try {
      const searchQuery = `${artist} ${title}`;
      const params = new URLSearchParams({
        q: searchQuery
      });
      const response = await fetchWithTimeout(`https://lrclib.net/api/search?${params.toString()}`, {
        headers: {
          'Lrclib-Client': `am-lyrics/${VERSION} (https://github.com/uimaxbai/apple-music-web-components)`
        }
      });
      if (!response.ok) return null;
      const results = await response.json();
      if (!Array.isArray(results) || results.length === 0) return null;
      // Prefer results with synced lyrics
      const withSynced = results.find(r => r.syncedLyrics && typeof r.syncedLyrics === 'string');
      const bestMatch = withSynced || results[0];
      // Try synced lyrics first
      if (bestMatch.syncedLyrics) {
        const lines = AmLyrics.parseLrcSubtitles(bestMatch.syncedLyrics);
        if (lines.length > 0) {
          return {
            lines,
            source: 'LRCLIB'
          };
        }
      }
      // Fall back to plain lyrics (unsynced)
      if (bestMatch.plainLyrics && typeof bestMatch.plainLyrics === 'string') {
        const plainLines = bestMatch.plainLyrics.split('\n').filter(l => l.trim());
        if (plainLines.length > 0) {
          const lines = plainLines.map(text => ({
            text: [{
              text,
              part: false,
              timestamp: 0,
              endtime: 0
            }],
            background: false,
            backgroundText: [],
            oppositeTurn: false,
            timestamp: 0,
            endtime: 0,
            isWordSynced: false
          }));
          return {
            lines,
            source: 'LRCLIB (unsynced)'
          };
        }
      }
    } catch {
      // LRCLIB fetch failed
    }
    return null;
  }
  static async fetchLyricsFromGenius(metadata) {
    const title = metadata.title?.trim();
    const artist = metadata.artist?.trim();
    if (!title || !artist) return null;
    try {
      const params = new URLSearchParams({
        title,
        artist
      });
      const response = await fetchWithTimeout(`${GENIUS_WORKER_URL}?${params.toString()}`);
      if (!response.ok) return null;
      const data = await response.json();
      if (data.lyrics) {
        const plainLines = data.lyrics.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('['));
        if (plainLines.length > 0) {
          const lines = plainLines.map(text => ({
            text: [{
              text,
              part: false,
              timestamp: 0,
              endtime: 0
            }],
            background: false,
            backgroundText: [],
            oppositeTurn: false,
            timestamp: 0,
            endtime: 0,
            isWordSynced: false
          }));
          return {
            lines,
            source: 'Genius'
          };
        }
      }
    } catch {
      // Genius fetch failed, will fall through to return null
    }
    return null;
  }
  static async fetchLyricsFromUnison(metadata, isrc) {
    const title = metadata?.title?.trim();
    const artist = metadata?.artist?.trim();
    const recordingIsrc = isrc?.trim();
    if (!recordingIsrc && (!title || !artist)) return null;
    const params = new URLSearchParams();
    if (recordingIsrc) params.append('isrc', recordingIsrc);
    if (title) params.append('song', title);
    if (artist) params.append('artist', artist);
    if (metadata?.album) {
      params.append('album', metadata.album);
    }
    if (metadata?.durationMs && metadata.durationMs > 0) {
      params.append('duration', Math.round(metadata.durationMs / 1000).toString());
    }
    try {
      const response = await fetchWithTimeout(`https://unison.boidu.dev/lyrics?${params.toString()}`);
      if (!response.ok) return null;
      const data = await response.json();
      if (!data.success || !data.data?.lyrics) return null;
      const lyricsData = data.data;
      const {
        submitter
      } = lyricsData;
      const attribution = {
        confidence: typeof lyricsData.confidence === 'string' ? lyricsData.confidence : undefined,
        matchScore: typeof lyricsData.matchScore === 'number' && Number.isFinite(lyricsData.matchScore) ? lyricsData.matchScore : undefined,
        matchedBy: typeof lyricsData.matchedBy === 'string' ? lyricsData.matchedBy : undefined,
        contributors: typeof submitter?.displayName === 'string' && submitter.displayName.trim() ? [{
          username: submitter.displayName.trim(),
          url: typeof submitter.keyId === 'string' ? `https://unison.betterlyrics.org/curator/${encodeURIComponent(submitter.keyId)}` : undefined,
          roles: ['Lyric author']
        }] : undefined
      };
      const format = lyricsData.format || 'lrc';
      const syncType = lyricsData.syncType || 'linesync';
      const lyricsText = lyricsData.lyrics;
      if (format === 'ttml') {
        const parseResult = AmLyrics.parseTTML(lyricsText);
        if (parseResult && parseResult.lines.length > 0) {
          return {
            lines: parseResult.lines,
            source: 'Unison',
            songwriters: parseResult.songwriters,
            ...attribution
          };
        }
      }
      if (format === 'lrc') {
        if (syncType === 'plain') {
          const plainLines = lyricsText.split('\n').map(l => l.trim()).filter(l => l);
          if (plainLines.length > 0) {
            const lines = plainLines.map(text => ({
              text: [{
                text,
                part: false,
                timestamp: 0,
                endtime: 0
              }],
              background: false,
              backgroundText: [],
              oppositeTurn: false,
              timestamp: 0,
              endtime: 0,
              isWordSynced: false
            }));
            return {
              lines,
              source: 'Unison (unsynced)',
              ...attribution
            };
          }
        } else {
          const lines = AmLyrics.parseLrcSubtitles(lyricsText);
          if (lines.length > 0) {
            return {
              lines,
              source: 'Unison',
              ...attribution
            };
          }
        }
      }
    } catch {
      // Unison fetch failed
    }
    return null;
  }
  static calculateLineAlignments(lineSingers, agentTypes) {
    const lineSideAssignments = new Array(lineSingers.length).fill(undefined);
    let currentSideIsLeft = true;
    let lastPersonSingerId = null;
    let rightCount = 0;
    let totalCount = 0;
    lineSingers.forEach((singerId, index) => {
      let sideClass;
      if (singerId) {
        let type = agentTypes[singerId];
        if (!type) {
          if (singerId === 'v1000') {
            type = 'group';
          } else if (singerId === 'v2000') {
            type = 'other';
          } else {
            type = 'person';
          }
        }
        if (type === 'group') {
          sideClass = 'start';
        } else {
          if (lastPersonSingerId === null) {
            if (type === 'other') {
              currentSideIsLeft = false;
            } else {
              currentSideIsLeft = true;
            }
          } else if (singerId !== lastPersonSingerId) {
            currentSideIsLeft = !currentSideIsLeft;
          }
          sideClass = currentSideIsLeft ? 'start' : 'end';
          lastPersonSingerId = singerId;
        }
      }
      if (sideClass) {
        totalCount += 1;
        if (sideClass === 'end') rightCount += 1;
      }
      lineSideAssignments[index] = sideClass;
    });
    if (totalCount > 0 && Math.round(rightCount / totalCount * 100) >= 85) {
      const flip = s => {
        if (s === 'start') return 'end';
        if (s === 'end') return 'start';
        return s;
      };
      for (let i = 0; i < lineSideAssignments.length; i += 1) {
        lineSideAssignments[i] = flip(lineSideAssignments[i]);
      }
    }
    return lineSideAssignments;
  }
  static parseTTMLTime(value, fallback = 0) {
    if (!value) return fallback;
    const normalized = value.trim().toLowerCase();
    const unitMatch = normalized.match(/^(-?\d+(?:\.\d+)?)(ms|h|m|s)$/);
    if (unitMatch) {
      const amount = Number(unitMatch[1]);
      const multipliers = {
        ms: 1,
        s: 1000,
        m: 60_000,
        h: 3_600_000
      };
      return Math.max(0, Math.round(amount * multipliers[unitMatch[2]]));
    }
    const parts = normalized.split(':').map(Number);
    if (parts.some(part => !Number.isFinite(part))) return fallback;
    let seconds = 0;
    if (parts.length === 3) {
      seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
      seconds = parts[0] * 60 + parts[1];
    } else if (parts.length === 1) {
      [seconds] = parts;
    } else {
      return fallback;
    }
    return Math.max(0, Math.round(seconds * 1000));
  }
  static isRightToLeftLanguage(language) {
    if (!language) return false;
    const primaryLanguage = language.toLowerCase().split(/[-_]/)[0];
    return ['ar', 'dv', 'fa', 'he', 'ku', 'ps', 'ur', 'yi'].includes(primaryLanguage);
  }
  static parseTTML(ttmlString) {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(ttmlString, 'text/xml');
      const translations = {};
      const transliterations = {};
      const agentMap = {};
      const documentLanguage = doc.documentElement.getAttribute('xml:lang') || doc.documentElement.getAttribute('lang');
      const agents = doc.getElementsByTagName('ttm:agent');
      for (let i = 0; i < agents.length; i += 1) {
        const agent = agents[i];
        const id = agent.getAttribute('xml:id');
        const type = agent.getAttribute('type');
        if (id && type) {
          agentMap[id] = type;
        }
      }
      let songwriters;
      const songwritersNodes = doc.getElementsByTagName('songwriter');
      if (songwritersNodes.length > 0) {
        const names = [];
        for (let i = 0; i < songwritersNodes.length; i += 1) {
          if (songwritersNodes[i].textContent) {
            names.push(songwritersNodes[i].textContent);
          }
        }
        if (names.length > 0) {
          songwriters = names.join(', ');
        }
      }
      const translationNodes = doc.getElementsByTagName('translation');
      for (let i = 0; i < translationNodes.length; i += 1) {
        const texts = translationNodes[i].getElementsByTagName('text');
        for (let j = 0; j < texts.length; j += 1) {
          const textNode = texts[j];
          const key = textNode.getAttribute('for');
          if (key && textNode.textContent) {
            translations[key] = textNode.textContent;
          }
        }
      }
      const timeToMs = AmLyrics.parseTTMLTime;
      const transliterationNodes = doc.getElementsByTagName('transliteration');
      for (let i = 0; i < transliterationNodes.length; i += 1) {
        const texts = transliterationNodes[i].getElementsByTagName('text');
        for (let j = 0; j < texts.length; j += 1) {
          const textNode = texts[j];
          const key = textNode.getAttribute('for');
          if (!key) {
            // eslint-disable-next-line no-continue
            continue;
          }
          const spans = Array.from(textNode.getElementsByTagName('span')).filter(span => span.getAttribute('begin'));
          if (spans.length > 0) {
            const syllabus = [];
            let fullText = '';
            for (let k = 0; k < spans.length; k += 1) {
              const span = spans[k];
              const begin = span.getAttribute('begin');
              const end = span.getAttribute('end');
              let spanText = span.textContent || '';
              const nextNode = span.nextSibling;
              if (nextNode && nextNode.nodeType === 3 && /^\s/.test(nextNode.textContent || '') && !spanText.endsWith(' ')) {
                spanText += ' ';
              }
              if (spanText.trim() === '') {
                // eslint-disable-next-line no-continue
                continue;
              }
              syllabus.push({
                time: timeToMs(begin),
                duration: timeToMs(end) - timeToMs(begin),
                text: spanText
              });
              fullText += spanText;
            }
            transliterations[key] = {
              text: fullText.trim(),
              syllabus
            };
          } else if (textNode.textContent) {
            transliterations[key] = {
              text: textNode.textContent.trim().replace(/\s+/g, ' ')
            };
          }
        }
      }
      const lines = [];
      const pNodes = doc.getElementsByTagName('p');
      for (let i = 0; i < pNodes.length; i += 1) {
        const p = pNodes[i];
        const key = p.getAttributeNS('http://lrc.red/lyric-ttml-internal', 'key') || p.getAttribute('itunes:key');
        const beginMs = timeToMs(p.getAttribute('begin'));
        const endMs = timeToMs(p.getAttribute('end'), beginMs);
        const agentId = p.getAttribute('ttm:agent') || undefined;
        const lineLanguage = p.getAttribute('xml:lang') || p.getAttribute('lang') || documentLanguage;
        let songPart;
        if (p.parentNode && p.parentNode.tagName === 'div') {
          songPart = p.parentNode.getAttributeNS('http://lrc.red/lyric-ttml-internal', 'songPart') || p.parentNode.getAttribute('itunes:songPart') || undefined;
        }
        const mainSyllables = [];
        const bgSyllables = [];
        const spans = p.getElementsByTagName('span');
        const hasWordLevelSync = Array.from(spans).some(span => {
          const isBackground = span.getAttribute('ttm:role') === 'x-bg' || span.parentNode?.getAttribute?.('ttm:role') === 'x-bg';
          return !isBackground && Boolean(span.getAttribute('begin')) && Boolean(span.getAttribute('end'));
        });
        if (spans.length > 0) {
          for (let j = 0; j < spans.length; j += 1) {
            const span = spans[j];
            if (span.getAttribute('ttm:role') === 'x-bg') {
              const bgInnerSpans = span.getElementsByTagName('span');
              for (let k = 0; k < bgInnerSpans.length; k += 1) {
                const bgSpan = bgInnerSpans[k];
                let bgText = bgSpan.textContent || '';
                const nextNode = bgSpan.nextSibling;
                if (nextNode && nextNode.nodeType === 3 && /^\s/.test(nextNode.textContent || '') && !bgText.endsWith(' ')) {
                  bgText += ' ';
                }
                const bgTimestamp = timeToMs(bgSpan.getAttribute('begin'), beginMs);
                bgSyllables.push({
                  text: bgText,
                  timestamp: bgTimestamp,
                  endtime: Math.max(bgTimestamp, timeToMs(bgSpan.getAttribute('end'), endMs)),
                  part: !/\s$/.test(bgText)
                });
              }
              // eslint-disable-next-line no-continue
              continue;
            }
            if (span.parentNode && span.parentNode.getAttribute?.('ttm:role') === 'x-bg') {
              // eslint-disable-next-line no-continue
              continue;
            }
            let text = span.textContent || '';
            const nextNode = span.nextSibling;
            if (nextNode && nextNode.nodeType === 3 && /^\s/.test(nextNode.textContent || '') && !text.endsWith(' ')) {
              text += ' ';
            }
            const syllableTimestamp = timeToMs(span.getAttribute('begin'), beginMs);
            mainSyllables.push({
              text,
              timestamp: syllableTimestamp,
              endtime: Math.max(syllableTimestamp, timeToMs(span.getAttribute('end'), endMs)),
              part: !/\s$/.test(text)
            });
          }
        }
        if (mainSyllables.length === 0) {
          const primaryLineText = Array.from(p.childNodes).filter(node => !(node instanceof Element && node.getAttribute('ttm:role') === 'x-bg')).map(node => node.textContent || '').join('').trim();
          mainSyllables.push({
            text: primaryLineText,
            timestamp: beginMs,
            endtime: endMs,
            part: false,
            lineSynced: true
          });
        }
        // Distribute line-level transliteration to individual syllables
        // so that per-syllable animated romanisation works (like KPoe lyrics)
        const lineTransliterationItem = key ? transliterations[key] : undefined;
        if (lineTransliterationItem && mainSyllables.length > 1 && spans.length > 0) {
          if (lineTransliterationItem.syllabus && lineTransliterationItem.syllabus.length === mainSyllables.length) {
            mainSyllables.forEach((syl, mapIdx) => {
              // eslint-disable-next-line no-param-reassign
              syl.romanizedText = lineTransliterationItem.syllabus[mapIdx].text;
            });
          } else {
            const lineTransliteration = lineTransliterationItem.text;
            const romanWords = lineTransliteration.split(/\s+/).filter(Boolean);
            const syllableGroups = [];
            for (let si = 0; si < mainSyllables.length; si += 1) {
              if (mainSyllables[si].part && syllableGroups.length > 0) {
                syllableGroups[syllableGroups.length - 1].push(si);
              } else {
                syllableGroups.push([si]);
              }
            }
            const isCJK = /[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/.test(mainSyllables.map(s => s.text).join(''));
            if (romanWords.length === syllableGroups.length) {
              syllableGroups.forEach((group, gi) => {
                // eslint-disable-next-line no-param-reassign
                mainSyllables[group[0]].romanizedText = romanWords[gi];
              });
            } else if (romanWords.length === mainSyllables.length) {
              mainSyllables.forEach((syl, mapIdx) => {
                // eslint-disable-next-line no-param-reassign
                syl.romanizedText = romanWords[mapIdx];
              });
            } else if (isCJK) {
              let romanIdx = 0;
              for (const group of syllableGroups) {
                const syl = mainSyllables[group[0]];
                const sylText = group.map(gIndex => mainSyllables[gIndex].text).join('');
                const validChars = sylText.match(/[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7afA-Za-z0-9]/g) || [];
                const needed = validChars.length;
                if (needed > 0 && romanIdx < romanWords.length) {
                  // eslint-disable-next-line no-param-reassign
                  syl.romanizedText = romanWords.slice(romanIdx, romanIdx + needed).join(' ');
                  romanIdx += needed;
                }
              }
            }
          }
        }
        const resolvedBeginMs = p.getAttribute('begin') ? beginMs : Math.min(...mainSyllables.map(syllable => syllable.timestamp));
        const resolvedEndMs = Math.max(endMs, resolvedBeginMs, ...mainSyllables.map(syllable => syllable.endtime), ...bgSyllables.map(syllable => syllable.endtime));
        lines.push({
          text: mainSyllables,
          background: bgSyllables.length > 0,
          backgroundText: bgSyllables,
          timestamp: resolvedBeginMs,
          endtime: resolvedEndMs,
          isWordSynced: hasWordLevelSync,
          songPart,
          translation: key ? translations[key] : undefined,
          romanizedText: lineTransliterationItem?.text,
          oppositeTurn: false,
          agentId,
          direction: p.getAttribute('dir') === 'rtl' || AmLyrics.isRightToLeftLanguage(lineLanguage) ? 'rtl' : undefined
        });
      }
      const sortedLines = lines.map((line, sourceIndex) => ({
        line,
        sourceIndex
      })).sort((a, b) => a.line.timestamp - b.line.timestamp || a.sourceIndex - b.sourceIndex).map(item => item.line);
      const alignments = AmLyrics.calculateLineAlignments(sortedLines.map(line => line.agentId), agentMap);
      const alignedLines = sortedLines.map((line, index) => ({
        ...line,
        alignment: alignments[index],
        oppositeTurn: alignments[index] === 'end'
      }));
      return {
        lines: alignedLines,
        songwriters
      };
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Failed to parse TTML', e);
      return null;
    }
  }
  static convertKPoeLyrics(payload) {
    if (!payload) {
      return null;
    }
    let rawLyrics = null;
    if (Array.isArray(payload?.lyrics)) {
      rawLyrics = payload.lyrics;
    } else if (Array.isArray(payload?.data?.lyrics)) {
      rawLyrics = payload.data.lyrics;
    } else if (Array.isArray(payload?.data)) {
      rawLyrics = payload.data;
    }
    if (!rawLyrics || rawLyrics.length === 0) {
      return null;
    }
    const sanitizedEntries = rawLyrics.filter(item => Boolean(item));
    const lines = [];
    // If type is 'Line', we revert to line-by-line highlighting by skipping syllabus parsing
    const isLineType = payload.type === 'Line' || payload.type === 'line';
    // Convert metadata.agents to type map
    const agentTypes = {};
    if (payload.metadata?.agents) {
      Object.entries(payload.metadata.agents).forEach(([key, agent]) => {
        const mappedKey = agent.alias || key;
        agentTypes[mappedKey] = agent.type;
      });
    }
    const lineSingers = sanitizedEntries.map(entry => entry.element?.singer);
    const alignments = AmLyrics.calculateLineAlignments(lineSingers, agentTypes);
    for (let i = 0; i < sanitizedEntries.length; i += 1) {
      const entry = sanitizedEntries[i];
      const alignment = alignments[i];
      const lineText = typeof entry.text === 'string' ? entry.text : '';
      const lineStart = AmLyrics.toMilliseconds(entry.time);
      const lineDuration = AmLyrics.toMilliseconds(entry.duration);
      const explicitEnd = AmLyrics.toMilliseconds(entry.endTime);
      const lineEnd = explicitEnd || lineStart + (lineDuration || 0);
      let syllabus = [];
      if (Array.isArray(entry.syllabus)) {
        syllabus = entry.syllabus.filter(s => Boolean(s));
      } else if (Array.isArray(entry.words)) {
        syllabus = entry.words.filter(s => Boolean(s));
      }
      const mainSyllables = [];
      const backgroundSyllables = [];
      if (!isLineType && syllabus.length > 0) {
        for (const syl of syllabus) {
          const sylStart = AmLyrics.toMilliseconds(syl.time, lineStart);
          const sylDuration = AmLyrics.toMilliseconds(syl.duration);
          // If there's only 1 syllable and duration is 0, it's likely a line-synced fallback.
          // Otherwise, it's an instantaneous boundary (like a space or comma) and should not span the line.
          const sylEnd = sylDuration === 0 && syllabus.length === 1 ? lineEnd : sylStart + sylDuration;
          const syllable = {
            text: typeof syl.text === 'string' ? syl.text : '',
            part: Boolean(syl.part),
            timestamp: sylStart,
            endtime: sylEnd
          };
          if (syl.isBackground) {
            backgroundSyllables.push(syllable);
          } else {
            mainSyllables.push(syllable);
          }
        }
      }
      if (mainSyllables.length === 0 && lineText) {
        mainSyllables.push({
          text: lineText,
          part: false,
          timestamp: lineStart,
          endtime: lineEnd || lineStart,
          lineSynced: isLineType // Mark as line-synced
        });
      }
      const hasWordSync = !isLineType && syllabus.length > 0 && (mainSyllables.length > 0 || backgroundSyllables.length > 0);
      const {
        transliteration
      } = entry;
      let romanizedTextFromPayload;
      if (transliteration) {
        romanizedTextFromPayload = transliteration.text;
        // If syllabus data matches, map it to main syllables
        if (Array.isArray(transliteration.syllabus) && transliteration.syllabus.length === mainSyllables.length) {
          transliteration.syllabus.forEach((s, idx) => {
            mainSyllables[idx].romanizedText = s.text;
          });
        }
      }
      // Extract translation from KPoe API if available
      const translationText = entry.translation?.text;
      const lineResult = {
        text: mainSyllables,
        background: backgroundSyllables.length > 0,
        backgroundText: backgroundSyllables,
        oppositeTurn: alignment === 'end' || (Array.isArray(entry.element) ? entry.element.includes('opposite') || entry.element.includes('right') : false),
        timestamp: lineStart,
        endtime: lineEnd,
        isWordSynced: isLineType ? false : hasWordSync,
        alignment,
        songPart: entry.element?.songPart,
        romanizedText: romanizedTextFromPayload,
        translation: translationText
      };
      lines.push(lineResult);
    }
    return lines;
  }
  static toMilliseconds(value, fallback = 0) {
    const num = Number(value);
    if (!Number.isFinite(num) || Number.isNaN(num)) {
      return fallback;
    }
    if (!Number.isInteger(num)) {
      return Math.round(num * 1000);
    }
    return Math.max(0, Math.round(num));
  }
  firstUpdated() {
    // Set up scroll event listener for user scroll detection
    // Use wheel/touchmove which are guaranteed to be user initiated,
    // unlike 'scroll' which fires for both user and programmatic/inertia
    if (this.lyricsContainer) {
      this.lyricsContainer.addEventListener('wheel', this._boundHandleUserScroll, {
        passive: true
      });
      this.lyricsContainer.addEventListener('touchmove', this._boundHandleUserScroll, {
        passive: true
      });
    }
  }
  /**
   * Handle currentTime changes imperatively, bypassing Lit's render cycle.
   * This prevents the template from re-rendering on every frame, which would
   * reset imperative animation classes (highlight, finished, etc.) set by
   * updateSyllablesForLine.
   */
  _onTimeChanged(oldTime, newTime, isSeek = Math.abs(newTime - oldTime) > SEEK_THRESHOLD_MS) {
    if (this.cachedIsUnsynced) return;
    const newActiveLines = this.findActiveLineIndices(newTime);
    const oldActiveLines = this.activeLineIndices;
    // Reset animation if active lines change or if we skip time.
    const linesChanged = !AmLyrics.arraysEqual(newActiveLines, oldActiveLines);
    if (this.hidePlayedLines && (linesChanged || isSeek)) this.updatePlayedLines(newTime);
    if (newTime < oldTime && (linesChanged || isSeek)) {
      // A retired word keeps its lift until playback returns before its start.
      for (const line of this.cachedLineArray) {
        for (const word of AmLyrics.motionWords.get(line) || []) {
          if (newTime < word.start) {
            word.element.classList.remove('word-started');
            if (!this.rewindingLines.has(line)) AmLyrics.clearNormalWordMotion(word.element);
          }
        }
      }
    }
    if (linesChanged || isSeek) {
      if (this.lyricsContainer) {
        // Drop highlighting at the phrase end. Backing layout is managed by
        // predictive scroll so its entrance and exit do not lag behind it.
        for (const lineIndex of oldActiveLines) {
          if (!newActiveLines.includes(lineIndex)) {
            const lineElement = this._getLineElement(lineIndex);
            if (lineElement) {
              AmLyrics.unfinishSyllables(lineElement);
              lineElement.classList.remove('active', 'scroll-exiting');
              lineElement.classList.remove('progressive-unblur');
              lineElement.removeAttribute('aria-current');
              if (lineElement.classList.contains('pre-active')) {
                lineElement.classList.remove('pre-active');
              }
              lineElement.style.removeProperty('filter');
              const preIdx = this.preActiveLineElements.indexOf(lineElement);
              if (preIdx !== -1) this.preActiveLineElements.splice(preIdx, 1);
            }
          }
        }
        // Add 'active' to newly active lines. Background expansion is driven
        // separately by the current scroll target.
        for (const lineIndex of newActiveLines) {
          if (!oldActiveLines.includes(lineIndex) || isSeek) {
            const lineElement = this._getLineElement(lineIndex);
            if (lineElement) {
              if (!oldActiveLines.includes(lineIndex)) {
                lineElement.querySelectorAll('.native-motion').forEach(char => AmLyrics.clearCharacterMotion(char));
              }
              lineElement.classList.add('active');
              lineElement.setAttribute('aria-current', 'true');
              lineElement.classList.remove('pre-active', 'scroll-exiting');
              lineElement.classList.remove('progressive-unblur');
              lineElement.style.removeProperty('filter');
              const preIdx = this.preActiveLineElements.indexOf(lineElement);
              if (preIdx !== -1) this.preActiveLineElements.splice(preIdx, 1);
            }
          }
        }
        // Remove pre-active from lines that are now active (they no longer
        // need the unblur preview class) and from lines that dropped.
        for (const lineElement of this.preActiveLineElements) {
          const idx = AmLyrics.getLineIndexFromElement(lineElement);
          if (idx === null || !newActiveLines.includes(idx) && lineElement !== this.currentPrimaryActiveLine) {
            lineElement.classList.remove('pre-active');
            lineElement.classList.remove('progressive-unblur');
            lineElement.style.removeProperty('filter');
          }
        }
        this.preActiveLineElements = this.preActiveLineElements.filter(el => el.classList.contains('pre-active'));
      }
      this.activeLineIndices = newActiveLines;
    }
    // Predictive scroll: run on every tick so we scroll *before* the next
    // line starts, matching YouLyPlus behaviour.
    this._handleActiveLineScroll(isSeek);
    if (linesChanged || isSeek) {
      this.clearPastLineHighlights();
    }
    if (this.lyricsContainer) {
      // Update syllables in active lines using cached elements
      for (const lineIndex of this.activeLineIndices) {
        const lineElement = this._getLineElement(lineIndex);
        if (lineElement?.classList.contains('active') && !this.rewindingLines.has(lineElement)) {
          AmLyrics.updateSyllablesForLine(lineElement, newTime, this.shouldReduceMotion);
          if (isSeek) AmLyrics.seekLineWipes(lineElement, newTime);
        }
      }
      if (isSeek) {
        for (const entry of this.backgroundCarries.values()) if (!entry.exiting) AmLyrics.seekLineWipes(entry.clone, newTime);
      }
      // Tie gap motion directly to playback time. This keeps the entrance,
      // breathing, sequential dots, and exit deterministic across seeks. Only
      // touch the current/previous gap instead of scanning every gap per frame.
      const currentGap = this.findInstrumentalGapAt(newTime);
      const gapElements = new Set(this.activeGapLineElements);
      if (currentGap) {
        const currentGapElement = this._getGapElement(currentGap.insertBeforeIndex);
        if (currentGapElement) gapElements.add(currentGapElement);
      }
      for (const gap of gapElements) {
        this.updateInstrumentalGap(gap, newTime);
      }
      // Track instrumental gap state
      if (currentGap) {
        if (currentGap.insertBeforeIndex !== this.lastInstrumentalIndex) {
          this.setBackgroundExpandedLine(null);
          if (this.autoScroll && !this.isUserScrolling && !this.isClickSeeking) {
            this.scrollToInstrumental(currentGap.insertBeforeIndex);
          }
        }
        this.lastInstrumentalIndex = currentGap.insertBeforeIndex;
        // Un-highlight the previous line immediately when gap dots are playing
        if (currentGap.insertBeforeIndex > 0) {
          const prevLine = this._getLineElement(currentGap.insertBeforeIndex - 1);
          if (prevLine && prevLine.classList.contains('persist-highlight') && !prevLine.classList.contains('active')) {
            AmLyrics.unfinishSyllables(prevLine);
          }
        }
      } else if (this.lastInstrumentalIndex !== null) {
        this.lastInstrumentalIndex = null;
      }
      // Check footer active state
      const lastLyric = this.lyrics && this.lyrics.length > 0 ? this.lyrics[this.lyrics.length - 1] : null;
      const footer = this.footerElement;
      if (footer && lastLyric && lastLyric.endtime > 0) {
        const isFooterActive = newTime > lastLyric.endtime + 200; // Snappier 200ms buffer
        if (isFooterActive && !footer.classList.contains('active')) {
          footer.classList.add('active');
          // Clear pre-active from the last lyric so it doesn't stay
          // unblurred when the footer takes over.
          const lastLine = this.lyrics ? this._getLineElement(this.lyrics.length - 1) : null;
          if (lastLine) {
            lastLine.classList.remove('pre-active');
            lastLine.classList.remove('progressive-unblur');
            lastLine.style.removeProperty('filter');
            const preIdx = this.preActiveLineElements.indexOf(lastLine);
            if (preIdx !== -1) this.preActiveLineElements.splice(preIdx, 1);
          }
          if (this.autoScroll && !this.isUserScrolling && !this.isClickSeeking) {
            this.focusLine(footer);
          }
        } else if (!isFooterActive && footer.classList.contains('active')) {
          footer.classList.remove('active');
        }
      }
    }
  }
  updatePlayedLines(time) {
    if (!this.lyrics) return;
    this.lyrics.forEach((line, index) => {
      const played = this.hidePlayedLines && this.getLineHighlightEndTime(index) > line.timestamp && time >= this.getLineHighlightEndTime(index);
      this._getLineElement(index)?.classList.toggle('played', played);
    });
  }
  willUpdate(changedProperties) {
    if (this.backgroundCarries.size && ['lyrics', 'isLoading', 'showRomanization', 'showTranslation', 'fontFamily'].some(propertyName => changedProperties.has(propertyName))) {
      if (!changedProperties.has('lyrics')) for (const [index, entry] of this.backgroundCarries) if (!entry.exiting) {
        this.backgroundCarryRestoreTops.set(index, AmLyrics.getBackgroundCarryTop(entry.clone));
        const ownerIndex = AmLyrics.getLineIndexFromElement(entry.owner);
        if (ownerIndex !== null) this.backgroundCarryRestoreOwners.set(index, ownerIndex);
      }
      this.restoreCarriesAfterRender = true;
      this.clearBackgroundCarries();
    }
    if (changedProperties.has('lyrics')) {
      this._updateCachedIsUnsynced();
      this.cachedLineData = null;
      this._ensureLineDataCache();
    }
    if (this.lyrics && !changedProperties.has('lyrics') && (changedProperties.has('showRomanization') || changedProperties.has('showTranslation') || changedProperties.has('fontFamily'))) this.pendingRenderLayout = this.captureLyricLayout();
  }
  updated(changedProperties) {
    const lyricsDomBecameRenderable = changedProperties.has('lyrics') || changedProperties.has('isLoading') && !this.isLoading && Boolean(this.lyrics);
    if (lyricsDomBecameRenderable) {
      this._invalidateCaches();
      this._ensureLineDataCache();
      // Recalculate timing data for accurate animations whenever lyrics change
      this._updateCharTimingData();
      // Apply 'active' classes imperatively after lyrics first render,
      // since the template no longer binds the 'active' class (to avoid
      // clobbering imperative scroll-animate classes on re-render).
      if (this.lyricsContainer && this.lyrics && !this.cachedIsUnsynced) {
        const activeLines = this.findActiveLineIndices(this.currentTime);
        for (const lineIndex of activeLines) {
          const lineEl = this._getLineElement(lineIndex);
          if (lineEl) {
            lineEl.classList.add('active');
            lineEl.setAttribute('aria-current', 'true');
          }
        }
        const primaryActiveLine = this.getPrimaryActiveLineIndex(activeLines);
        this.setBackgroundExpandedLine(primaryActiveLine !== null ? this._getLineElement(primaryActiveLine) : null, true, activeLines);
        // Trigger a faux time-change so that updateSyllablesForLine fires
        // to setup inline syllable CSS wipe animations for whatever the current time is
        this._onTimeChanged(0, this.currentTime);
        if (this.sourceUpgrade) {
          this.cancelLineScrollAnimation();
        }
        // Ensure position classes are applied on initial render if not playing yet
        if (this.positionedLineElements.length === 0) {
          const firstLine = this.lyricsContainer.querySelector('.lyrics-line');
          if (firstLine) this.updatePositionClasses(firstLine);
        }
        // Set up IntersectionObserver for viewport virtualization
        this.visibilityObserver?.disconnect();
        this.visibilityObserver = new IntersectionObserver(entries => {
          entries.forEach(entry => {
            const el = entry.target;
            el.classList.toggle('far-line', !entry.isIntersecting);
          });
        }, {
          root: this.lyricsContainer,
          rootMargin: '200px',
          threshold: 0
        });
        const lines = this.lyricsContainer.querySelectorAll('.lyrics-line');
        lines.forEach(line => this.visibilityObserver.observe(line));
      }
      this.sourceUpgrade = false;
    }
    if (lyricsDomBecameRenderable || changedProperties.has('hidePlayedLines')) {
      this.updatePlayedLines(this.currentTime);
    }
    if (this.pendingRenderLayout && !lyricsDomBecameRenderable) {
      this._updateCharTimingData();
      for (const line of this.backgroundExpandedLines) {
        const wrap = this.getBackgroundWrap(line);
        if (wrap) line.style.setProperty('--am-lyrics-background-vocal-height', `${wrap.offsetHeight + 4}px`);
      }
      this.finishLyricLayout(this.pendingRenderLayout);
      for (const index of this.activeLineIndices) {
        const line = this._getLineElement(index);
        if (line) AmLyrics.updateSyllablesForLine(line, this.currentTime, this.shouldReduceMotion);
      }
    }
    this.pendingRenderLayout = undefined;
    if (this.restoreCarriesAfterRender) {
      this.restoreCarriesAfterRender = false;
      this._handleActiveLineScroll(true);
      this.backgroundCarryRestoreTops.clear();
      this.backgroundCarryRestoreOwners.clear();
    }
    if (changedProperties.has('noBlur') && this.noBlur) {
      this.clearProgressiveBlurLine();
    }
    if (changedProperties.has('reducedMotion') || changedProperties.has('systemReducedMotion') || changedProperties.has('lineMotion')) {
      if (this.shouldReduceMotion) {
        this.finishLineRewind();
        for (const line of this.cachedLineArray) {
          for (const word of AmLyrics.motionWords.get(line) || []) AmLyrics.clearNormalWordMotion(word.element);
          line.querySelectorAll('.native-motion').forEach(char => AmLyrics.clearCharacterMotion(char));
        }
        for (const [line, animation] of this.backgroundAnimations) {
          animation.cancel();
          line.classList.remove('bg-collapsing');
        }
        this.backgroundAnimations.clear();
        for (const {
          animation
        } of this.contentSprings.values()) animation.cancel();
        this.contentSprings.clear();
      }
      this.cancelLineScrollAnimation();
      if (this.lyricsContainer) {
        // Cancel an in-flight native smooth scroll at its current position.
        this.lyricsContainer.scrollTo({
          top: this.lyricsContainer.scrollTop,
          behavior: 'instant'
        });
      }
      if (this.lyrics) this._onTimeChanged(this.currentTime, this.currentTime);
    }
    // Handle duration reset (-1 stops playback and resets currentTime to 0)
    if (changedProperties.has('duration') && this.duration === -1) {
      this.currentTime = 0;
      this.finishLineRewind();
      this.clockAdvancing = false;
      this.cancelPlaybackTick();
      this.holdPlaybackAnimations();
      this.activeLineIndices = [];
      this.preActiveLineElements = [];
      this.positionedLineElements = [];
      this.clearGapAnimations();
      this.activeGapLineElements = [];
      this.clearBackgroundExpandedLine();
      this.setUserScrolling(false);
      // Cancel any running animations
      // Clear user scroll timeout
      if (this.userScrollTimeoutId) {
        clearTimeout(this.userScrollTimeoutId);
        this.userScrollTimeoutId = undefined;
      }
      this.cancelLineScrollAnimation();
      if (this.lyricsContainer) this.lyricsContainer.scrollTop = 0;
      return;
    }
    if (changedProperties.has('paused') || changedProperties.has('interpolate')) {
      this.cancelPlaybackTick();
      if (this.paused) {
        this.finishLineRewind();
        this.holdPlaybackAnimations();
      } else {
        if (changedProperties.has('paused') && this.lastHostTime !== undefined) this.clockAdvancing = this.interpolate;
        if (!this.interpolate) this.clockAdvancing = false;
        this.playbackAnchor = this._currentTime;
        this.playbackStamp = performance.now();
        this.releasePlaybackAnimations();
        this.schedulePlaybackTick();
      }
    }
    if (lyricsDomBecameRenderable) this.schedulePlaybackTick();
    if (this.paused || document.hidden) this.holdPlaybackAnimations();
    if ((changedProperties.has('query') || changedProperties.has('musicId') || changedProperties.has('spotifyId') || changedProperties.has('isrc') || changedProperties.has('ttml') || changedProperties.has('songTitle') || changedProperties.has('songArtist') || changedProperties.has('songAlbum') || changedProperties.has('songDurationMs')) && !changedProperties.has('currentTime')) {
      this.fetchLyrics();
    }
    if (changedProperties.has('currentTime') && this.lyrics) ;
  }
  /**
   * Handle scrolling when active line indices change.
   * Called imperatively from _onTimeChanged instead of from updated().
   *
   * Uses predictive scroll like YouLyPlus: computes a scrollLookAheadMs based
   * on the gap to the next line, finds the primary line at predictiveTime,
   * and scrolls with a duration matching the lookahead.
   */
  _handleActiveLineScroll(forceScroll = false) {
    if (!this.lyricsContainer || !this.lyrics || this.lyrics.length === 0 || this.cachedIsUnsynced) {
      return;
    }
    // If the footer is already active, it set up its own scroll.
    // Don't override it with a scroll back to the last lyric.
    const footer = this.footerElement;
    if (footer?.classList.contains('active')) {
      this.setBackgroundExpandedLine(null);
      return;
    }
    // 1. Compute scroll lookahead based on gap to next line (YouLyPlus style)
    let scrollLookAheadMs = 350;
    let low = 0;
    let high = this.lyrics.length;
    while (low < high) {
      const middle = Math.floor((low + high) / 2);
      if (this.lyrics[middle].timestamp <= this.currentTime) low = middle + 1;else high = middle;
    }
    const currentAudioIndex = low - 1;
    if (currentAudioIndex !== -1 && currentAudioIndex + 1 < this.lyrics.length) {
      const currentLine = this.lyrics[currentAudioIndex];
      const nextLine = this.lyrics[currentAudioIndex + 1];
      const gap = nextLine.timestamp - currentLine.endtime;
      scrollLookAheadMs = Math.min(500, Math.max(350, gap));
    }
    // Blur follows playback time, independently of predictive scrolling.
    const nextLineIndex = currentAudioIndex + 1;
    const nextLineElement = nextLineIndex >= 0 && nextLineIndex < this.lyrics.length ? this._getLineElement(nextLineIndex) : null;
    if (nextLineElement && !this.noBlur && !this.shouldReduceMotion && !this.isUserScrolling && this.lyricsContainer.classList.contains('blur-inactive-enabled') && !this.lyricsContainer.classList.contains('not-focused') && !nextLineElement.classList.contains('active') && !nextLineElement.classList.contains('lyrics-gap')) {
      if (this.progressiveBlurLine !== nextLineElement) {
        this.clearProgressiveBlurLine();
        this.progressiveBlurLine = nextLineElement;
        nextLineElement.classList.add('progressive-unblur');
        // Animate the filter in the browser instead of invalidating the next
        // line's styles on every playback tick. The underlying style holds zero.
        nextLineElement.style.filter = 'blur(0em)';
        const animation = nextLineElement.animate([{
          filter: `blur(${NEXT_LINE_BASE_BLUR_EM}em)`
        }, {
          filter: 'blur(0em)'
        }], {
          duration: NEXT_LINE_UNBLUR_DURATION_MS,
          easing: 'linear',
          fill: 'both'
        });
        this.progressiveBlurAnimation = animation;
        animation.onfinish = () => {
          if (this.progressiveBlurAnimation === animation) animation.cancel();
        };
      }
      const elapsed = this.currentTime - this.lyrics[nextLineIndex].timestamp + NEXT_LINE_UNBLUR_DURATION_MS;
      const animation = this.progressiveBlurAnimation;
      if (elapsed < NEXT_LINE_UNBLUR_DURATION_MS) {
        if (animation.playState === 'idle') animation.play();
        if (forceScroll || animation.currentTime === null || Math.abs(Number(animation.currentTime) - elapsed) > 200) animation.currentTime = elapsed;
      }
    } else {
      this.clearProgressiveBlurLine();
    }
    // 2. Find scroll target at predictive time
    const predictiveTime = this.currentTime + scrollLookAheadMs;
    const predictiveActiveIndices = this.findActiveLineIndices(predictiveTime);
    let targetElement = null;
    let targetLineIndex = null;
    if (predictiveActiveIndices.length > 0) {
      targetLineIndex = this.getPrimaryScrollLineIndex(predictiveActiveIndices, predictiveTime);
      if (targetLineIndex !== null && targetLineIndex !== -1) {
        targetElement = this._getLineElement(targetLineIndex);
      }
    }
    if (!targetElement) {
      // Fallback: closest line before predictiveTime
      targetLineIndex = this.getLineIndexAtTime(predictiveTime, 0);
      if (targetLineIndex !== null && targetLineIndex !== -1) {
        targetElement = this._getLineElement(targetLineIndex);
      }
    }
    if (!targetElement) {
      return;
    }
    const scrollDuration = scrollLookAheadMs;
    if (targetElement !== this.currentPrimaryActiveLine || forceScroll) {
      targetElement.style.setProperty('--scroll-duration', `${scrollDuration}ms`);
    }
    // Unblur the upcoming target line early as the predictive scroll begins.
    if (!targetElement.classList.contains('active') && !targetElement.classList.contains('pre-active')) {
      targetElement.classList.add('pre-active');
      if (!this.preActiveLineElements.includes(targetElement)) {
        this.preActiveLineElements.push(targetElement);
      }
      AmLyrics.updateSyllablesForLine(targetElement, this.currentTime, this.shouldReduceMotion);
    }
    // Commit backing spacing before measuring the destination. Its displacement
    // and scrolling share the same spring rather than competing height tweens.
    const carryChanged = this.syncBackgroundCarries(targetElement, predictiveTime);
    const layoutChanged = this.setBackgroundExpandedLine(targetElement, true, predictiveActiveIndices, predictiveTime);
    this.focusLine(targetElement, forceScroll || layoutChanged || carryChanged, scrollDuration);
    if (this.pendingLayoutOffsets.size) this.finishLyricLayout(this.captureLyricLayout());
    this.animateBackgroundCarries();
  }
  _rebuildDomCache() {
    this.backgroundWraps = new WeakMap();
    if (!this.lyricsContainer) return;
    this.lineElementCache.clear();
    this.gapElementCache.clear();
    this.footerElement = this.lyricsContainer.querySelector('.lyrics-footer') ?? undefined;
    this.cachedLineArray = [];
    if (!this.lyrics) return;
    for (let i = 0; i < this.lyrics.length; i += 1) {
      const lineEl = this.lyricsContainer.querySelector(`#lyrics-line-${i}`);
      if (lineEl) {
        if (this.sourceUpgrade) lineEl.classList.remove('active', 'pre-active', 'scroll-exiting');
        this.lineElementCache.set(i, lineEl);
        if (lineEl.querySelector('.shared-word-wipe, .native-motion, .highlight, .finished, .pre-highlight, .normal-word-motion')) AmLyrics.resetSyllables(lineEl);
        lineEl._cachedSyllableElements = null;
        AmLyrics.motionWords.delete(lineEl);
        AmLyrics.motionSyllables.delete(lineEl);
      }
      const gapEl = this.lyricsContainer.querySelector(`#gap-${i}`);
      if (gapEl) {
        // Cache numeric timing values to avoid parseFloat on every frame
        gapEl._cachedStartTime = parseFloat(gapEl.getAttribute('data-start-time') || '0');
        gapEl._cachedEndTime = parseFloat(gapEl.getAttribute('data-end-time') || '0');
        this.gapElementCache.set(i, gapEl);
      }
    }
    this.lyricsContainer.querySelectorAll('.lyrics-word').forEach(wordElement => {
      AmLyrics.clearNormalWordMotion(wordElement);
      AmLyrics.clearWordWipe(wordElement);
      AmLyrics.wordWipes.delete(wordElement);
      const target = wordElement;
      target._cachedVirtualWordElements = undefined;
      target._cachedVirtualWordCharSpans = undefined;
      target._wordPreWipeKey = undefined;
    });
    this.lyricsContainer.querySelectorAll('.lyrics-syllable').forEach(syllable => {
      AmLyrics.motionParameters.delete(syllable);
      AmLyrics.getCachedCharSpans(syllable).forEach(char => AmLyrics.clearCharacterMotion(char));
      const target = syllable;
      target._cachedStartTime = undefined;
      target._cachedEndTime = undefined;
      target._cachedVocalTrack = undefined;
      target._cachedCharSpans = undefined;
    });
    // Rebuild cached line array for scroll/position queries
    const lineElements = this.lyricsContainer.querySelectorAll('.lyrics-line');
    this.cachedLineArray = Array.from(lineElements);
  }
  _getLineElement(index) {
    const cached = this.lineElementCache.get(index);
    if (cached) return cached;
    if (!this.lyricsContainer) return null;
    const el = this.lyricsContainer.querySelector(`#lyrics-line-${index}`);
    if (el) this.lineElementCache.set(index, el);
    return el;
  }
  _getGapElement(index) {
    const cached = this.gapElementCache.get(index);
    if (cached) return cached;
    if (!this.lyricsContainer) return null;
    const el = this.lyricsContainer.querySelector(`#gap-${index}`);
    if (el) this.gapElementCache.set(index, el);
    return el;
  }
  clearGapAnimations() {
    this.gapAnimations.forEach((motion, gap) => {
      motion.animations.forEach(animation => animation.cancel());
      gap.classList.remove('active', 'gap-collapsing', 'gap-exiting');
    });
    this.gapAnimations.clear();
  }
  _invalidateCaches() {
    this.timingLyrics = undefined;
    this.lineHighlightEnds = [];
    this.activeTimelineInterval = undefined;
    this.finishLineRewind();
    for (const line of this.cachedLineArray) {
      for (const word of AmLyrics.motionWords.get(line) || []) AmLyrics.clearNormalWordMotion(word.element);
    }
    this.pendingLayoutOffsets.clear();
    this.clearGapAnimations();
    this.cancelLineScrollAnimation();
    this.lyricsContainer?.querySelectorAll('.native-motion').forEach(char => AmLyrics.clearCharacterMotion(char));
    this.clearProgressiveBlurLine();
    this.cachedAllGaps = [];
    this.gapsCached = false;
    this.cachedLineData = null;
    this.lineElementCache.clear();
    this.gapElementCache.clear();
    this.footerElement = undefined;
    this.cachedLineArray = [];
    this.preActiveLineElements = [];
    this.positionedLineElements = [];
    this.clearGapAnimations();
    this.activeGapLineElements = [];
    this.lastInstrumentalIndex = null;
    this.clearBackgroundExpandedLine();
    this.visibilityObserver?.disconnect();
    this.visibilityObserver = undefined;
  }
  _updateCachedIsUnsynced() {
    this.cachedIsUnsynced = this.lyrics && this.lyrics.length > 0 ? this.lyrics.every(l => l.timestamp === 0 && l.endtime === 0) : false;
  }
  static characterMotionMode(text, durationMs, background = false) {
    // Native constructor RVA 0x2f483c–0x2f48e0 and draw gate 0x2f662f.
    // 0x2f4080 detects Chinese/Japanese; Hangul is not part of that predicate.
    // Keep connected RTL scripts intact in the browser renderer.
    if (/[\u0590-\u08ff]/.test(text)) return 'none';
    const count = Array.from(text.trim()).length;
    if (!count) return 'none';
    if (/[\u3400-\u4dbf\u4e00-\u9fff\u3040-\u30ff]/.test(text)) {
      return count > 1 ? 'rise' : 'none';
    }
    return !background && durationMs >= 1000 && count <= 7 ? 'emphasis' : 'none';
  }
  static getOverlapWordEnds(syllables) {
    const text = syllables.map(s => s.text).join('');
    const segments = AmLyrics.overlapSegmenter ? Array.from(AmLyrics.overlapSegmenter.segment(text)) : Array.from(text.matchAll(/[\u3400-\u9fff\u3040-\u30ff\uac00-\ud7af]|[^\s\u3400-\u9fff\u3040-\u30ff\uac00-\ud7af]+/g), match => ({
      index: match.index,
      segment: match[0]
    }));
    let offset = 0;
    const spans = syllables.map(syllable => {
      const start = offset;
      offset += syllable.text.length;
      return {
        syllable,
        start,
        end: offset
      };
    });
    return segments.filter(segment => segment.isWordLike ?? /[^\s.,!?;:…。，！？、]/.test(segment.segment)).map(segment => {
      const end = segment.index + segment.segment.length;
      const span = spans.find(item => end > item.start && end <= item.end);
      return span.syllable.timestamp + (span.syllable.endtime - span.syllable.timestamp) * ((end - span.start) / Math.max(1, span.end - span.start));
    });
  }
  _ensureLineDataCache() {
    if (this.cachedLineData || !this.lyrics) return;
    this.backgroundTailIndices = [];
    this.cachedLineData = this.lyrics.map((line, index) => {
      if (line.backgroundText.length && AmLyrics.getBackgroundTextPlacement(line) === 'after') this.backgroundTailIndices.push(index);
      const wordGroups = [];
      let group = [];
      line.text.forEach((syllable, syllableIndex) => {
        group.push(syllable);
        const next = line.text[syllableIndex + 1];
        if (!next || /\s$/.test(syllable.text) || /^\s/.test(next.text)) {
          wordGroups.push(group);
          group = [];
        }
      });
      const lineSynced = AmLyrics.isLineSyncedLine(line);
      const words = wordGroups.map(syllables => {
        const text = syllables.map(syllable => syllable.text).join('').trim();
        const start = Math.min(...syllables.map(syllable => syllable.timestamp));
        const end = Math.max(...syllables.map(syllable => syllable.endtime));
        return {
          start,
          end,
          duration: end - start,
          mode: lineSynced ? 'none' : AmLyrics.characterMotionMode(text, end - start),
          rtl: /[\u0590-\u08ff]/.test(text)
        };
      });
      const overlapWordEnds = AmLyrics.getOverlapWordEnds(line.text);
      const nextLine = this.lyrics[index + 1];
      return {
        wordGroups,
        mainEnd: Math.max(line.timestamp, ...line.text.map(s => s.endtime)),
        overlapWordEnds,
        substantialOverlap: Boolean(nextLine && overlapWordEnds.filter(end => end > nextLine.timestamp).length > 1),
        backgroundEnd: Math.max(line.timestamp, ...line.backgroundText.map(s => s.endtime)),
        groupGrowable: words.map(word => word.mode === 'emphasis'),
        groupGlowing: words.map(word => word.mode === 'emphasis'),
        groupCharRise: words.map(word => word.mode === 'rise'),
        groupCharDrag: words.map(() => false),
        vwFullDuration: words.map(word => word.duration),
        vwCharOffset: words.map(() => 0),
        vwStartMs: words.map(word => word.start),
        vwEndMs: words.map(word => word.end),
        lineIsRTL: line.direction === 'rtl' || words.some(word => word.rtl)
      };
    });
    const events = new Set();
    const addGapEvents = end => {
      events.add(end - GAP_COLLAPSE_LEAD_MS - GAP_EXIT_LEAD_MS);
      events.add(end - GAP_COLLAPSE_LEAD_MS);
      events.add(end + GAP_EXIT_TRAIL_MS);
    };
    this.lyrics.forEach((line, index) => {
      const next = this.lyrics[index + 1];
      const lead = this.cachedLineData[index];
      const lookAhead = next ? Math.min(500, Math.max(350, next.timestamp - line.endtime)) : 350;
      events.add(line.timestamp - 500);
      events.add(line.timestamp - 350);
      events.add(line.timestamp);
      events.add(line.endtime + 1);
      events.add(line.endtime + 201);
      events.add(lead.mainEnd);
      if (next) events.add(next.timestamp - lookAhead);
      if (index === 0 && line.timestamp >= INSTRUMENTAL_THRESHOLD_MS) addGapEvents(line.timestamp);
      if (next && next.timestamp - line.endtime >= INSTRUMENTAL_THRESHOLD_MS) addGapEvents(next.timestamp);
      lead.overlapWordEnds.forEach(time => events.add(time));
      for (const syllable of [...line.text, ...line.backgroundText]) {
        events.add(syllable.timestamp - WORD_WIPE_LOOKAHEAD_MS);
        events.add(syllable.timestamp - NEXT_WORD_PRE_WIPE_MAX_DURATION_MS);
        events.add(syllable.timestamp - WORD_PRE_WIPE_HANDOFF_LEAD_MS);
        events.add(syllable.timestamp);
        events.add(syllable.endtime);
        events.add(syllable.endtime + 1);
      }
    });
    this.playbackEvents = [...events].filter(Number.isFinite).sort((a, b) => a - b);
    this.playbackEventIndex = -1;
  }
  _updateCharTimingData() {
    if (!this.shadowRoot) return;
    this._rebuildDomCache();
    const words = Array.from(this.shadowRoot.querySelectorAll('.lyrics-word'));
    const wordsById = new Map();
    words.forEach((word, index) => {
      const id = word.dataset.virtualWordId || `word-${index}`;
      const group = wordsById.get(id) || [];
      group.push(word);
      wordsById.set(id, group);
    });
    wordsById.forEach(group => {
      const chars = group.flatMap(word => Array.from(word.querySelectorAll('.char')));
      group.forEach(word => {
        const target = word;
        target._cachedVirtualWordElements = group;
        target._cachedVirtualWordCharSpans = chars;
      });
      // Word geometry is prepared lazily for active/upcoming lines.
    });
  }
  static arraysEqual(a, b) {
    return a.length === b.length && a.every((val, i) => val === b[i]);
  }
  static isOppositeAgent(line) {
    return line.alignment === 'end' || line.alignment === undefined && line.oppositeTurn;
  }
  static isLineSyncedLine(line) {
    if (!line) return false;
    return line.isWordSynced === false || line.text.some(s => s.lineSynced);
  }
  getLineHighlightEndTime(index) {
    this.ensureTimingCache();
    if (this.lineHighlightEnds[index] !== undefined) return this.lineHighlightEnds[index];
    const end = this.computeLineHighlightEndTime(index);
    this.lineHighlightEnds[index] = end;
    return end;
  }
  computeLineHighlightEndTime(index) {
    if (!this.lyrics) return 0;
    const line = this.lyrics[index];
    if (!line) return 0;
    const backgroundEnd = line.backgroundText?.reduce((latest, syllable) => Math.max(latest, syllable.endtime), line.timestamp);
    const rawEnd = Math.max(line.endtime, backgroundEnd ?? line.timestamp, line.timestamp);
    const nextLine = this.lyrics[index + 1];
    if (!nextLine || nextLine.timestamp <= line.timestamp) {
      return rawEnd > line.timestamp ? rawEnd + 200 : rawEnd;
    }
    this._ensureLineDataCache();
    const leadEnd = this.cachedLineData?.[index].mainEnd ?? line.endtime;
    if (backgroundEnd && backgroundEnd > Math.max(leadEnd, nextLine.timestamp)) return Math.max(leadEnd, nextLine.timestamp);
    if (rawEnd > line.timestamp) {
      if (nextLine.timestamp < rawEnd) {
        return rawEnd;
      }
      const gapToNext = nextLine.timestamp - rawEnd;
      if (gapToNext >= INSTRUMENTAL_THRESHOLD_MS) {
        return rawEnd;
      }
    }
    return nextLine.timestamp;
  }
  static getLineIndexFromElement(lineElement) {
    if (!lineElement) return null;
    const match = lineElement.id.match(/^lyrics-line-(\d+)$/);
    return match ? parseInt(match[1], 10) : null;
  }
  static easeOutExpo(progress) {
    if (progress <= 0) return 0;
    if (progress >= 1) return 1;
    return 1 - 2 ** (-10 * progress);
  }
  static getCssTimeMs(element, propertyName, fallback) {
    const value = getComputedStyle(element).getPropertyValue(propertyName).trim();
    const parsed = Number.parseFloat(value);
    if (!Number.isFinite(parsed)) return fallback;
    return value.endsWith('ms') ? parsed : parsed * 1000;
  }
  updateInstrumentalGap(gap, timeMs) {
    const gapStartTime = gap._cachedStartTime ?? parseFloat(gap.getAttribute('data-start-time') || '0');
    const gapEndTime = gap._cachedEndTime ?? parseFloat(gap.getAttribute('data-end-time') || '0');
    let exitLeadMs = this.gapExitDurationCache.get(gap);
    if (exitLeadMs === undefined) {
      exitLeadMs = AmLyrics.getCssTimeMs(gap, '--am-lyrics-instrumental-exit-duration', GAP_EXIT_LEAD_MS);
      this.gapExitDurationCache.set(gap, exitLeadMs);
    }
    let collapseLeadMs = this.gapCollapseDurationCache.get(gap);
    if (collapseLeadMs === undefined) {
      collapseLeadMs = AmLyrics.getCssTimeMs(gap, '--am-lyrics-instrumental-collapse-duration', GAP_COLLAPSE_LEAD_MS);
      this.gapCollapseDurationCache.set(gap, collapseLeadMs);
    }
    let dots = this.gapDotCache.get(gap);
    if (!dots) {
      dots = Array.from(gap.querySelectorAll('.lyrics-syllable'));
      this.gapDotCache.set(gap, dots);
    }
    const duration = Math.max(1, gapEndTime - gapStartTime);
    const elapsed = timeMs - gapStartTime;
    if (elapsed < 0 || elapsed >= duration + GAP_EXIT_TRAIL_MS) {
      const before = gap.classList.contains('active') ? this.captureLyricLayout() : null;
      this.gapAnimations.get(gap)?.animations.forEach(animation => animation.cancel());
      this.gapAnimations.delete(gap);
      gap.classList.remove('active', 'gap-collapsing', 'gap-exiting');
      const index = this.activeGapLineElements.indexOf(gap);
      if (index !== -1) this.activeGapLineElements.splice(index, 1);
      if (before) this.finishLyricLayout(before);
      return;
    }
    const remaining = duration - elapsed;
    const layoutBefore = gap.classList.contains('active') !== remaining > collapseLeadMs ? this.captureLyricLayout() : null;
    gap.classList.toggle('active', remaining > collapseLeadMs);
    gap.classList.toggle('gap-collapsing', remaining <= collapseLeadMs);
    gap.classList.toggle('gap-exiting', remaining <= collapseLeadMs + exitLeadMs);
    if (!this.activeGapLineElements.includes(gap)) this.activeGapLineElements.push(gap);
    if (layoutBefore) this.finishLyricLayout(layoutBefore);
    let motion = this.gapAnimations.get(gap);
    if (!motion) {
      const layer = gap.querySelector('.main-vocal-container');
      if (!layer) return;
      const exitStart = Math.max(GAP_ENTRY_SCALE_MS, duration - collapseLeadMs - exitLeadMs);
      const end = Math.min(duration, exitStart + exitLeadMs);
      const entryStart = Math.max(0, Math.min(elapsed, exitStart - GAP_ENTRY_SCALE_MS));
      // Dense samples only around the entrance and exit; the slow breath needs
      // far fewer. The browser interpolates all frames without playback ticks.
      const times = new Set([0, entryStart, entryStart + GAP_ENTRY_FADE_MS, entryStart + GAP_ENTRY_SCALE_MS, exitStart, end]);
      for (let t = entryStart + 25; t < entryStart + GAP_ENTRY_SCALE_MS; t += 25) times.add(t);
      for (let t = entryStart + GAP_ENTRY_SCALE_MS; t < exitStart; t += Math.max(200, exitStart / 1000)) times.add(t);
      for (let t = exitStart; t < end; t += 20) times.add(t);
      const frames = [...times].filter(t => t <= end).sort((a, b) => a - b).map(time => {
        const cycle = GAP_PULSE_DURATION_MS * 2;
        const phase = (time + GAP_PULSE_DURATION_MS - exitStart % cycle + cycle) % cycle;
        const mix = (1 - Math.cos(Math.PI * phase / GAP_PULSE_DURATION_MS)) / 2;
        let scale = (GAP_BREATH_MAX_SCALE + (GAP_BREATH_MIN_SCALE - GAP_BREATH_MAX_SCALE) * mix) * AmLyrics.easeOutExpo(AmLyrics.clamp((time - entryStart) / GAP_ENTRY_SCALE_MS, 0, 1));
        let opacity = AmLyrics.clamp((time - entryStart) / GAP_ENTRY_FADE_MS, 0, 1);
        if (time >= exitStart) {
          const progress = (time - exitStart) / Math.max(1, end - exitStart);
          const popping = progress <= GAP_EXIT_POP_PROGRESS;
          const phaseProgress = popping ? progress / GAP_EXIT_POP_PROGRESS : (progress - GAP_EXIT_POP_PROGRESS) / (1 - GAP_EXIT_POP_PROGRESS);
          const ease = phaseProgress * phaseProgress * (3 - 2 * phaseProgress);
          scale = popping ? GAP_BREATH_MIN_SCALE + (GAP_EXIT_POP_SCALE - GAP_BREATH_MIN_SCALE) * ease : GAP_EXIT_POP_SCALE * (1 - ease);
          opacity = popping ? 1 : 1 - ease;
        }
        return {
          offset: time / end,
          transform: `scale(${scale})`,
          opacity
        };
      });
      const animation = layer.animate(frames, {
        duration: end,
        fill: 'both'
      });
      const animations = [animation, ...dots.map((dot, index) => dot.animate([{
        opacity: 0.25
      }, {
        opacity: 1
      }], {
        duration: exitStart / 3,
        delay: index * exitStart / 3,
        fill: 'both'
      }))];
      animations.forEach(effect => {
        const timeline = effect;
        timeline.currentTime = elapsed;
      });
      motion = {
        animations,
        end
      };
      this.gapAnimations.set(gap, motion);
    } else if (Math.abs(Number(motion.animations[0].currentTime) - Math.min(elapsed, motion.end)) > 200) {
      motion.animations.forEach(animation => {
        const timeline = animation;
        timeline.currentTime = elapsed;
        if (animation.playState === 'finished' && elapsed < Number(animation.effect?.getComputedTiming().endTime)) animation.play();
      });
    }
  }
  clearProgressiveBlurLine() {
    this.progressiveBlurAnimation?.cancel();
    this.progressiveBlurAnimation = undefined;
    if (!this.progressiveBlurLine) return;
    this.progressiveBlurLine.classList.remove('progressive-unblur');
    this.progressiveBlurLine.style.removeProperty('filter');
    this.progressiveBlurLine = null;
  }
  captureLyricLayout() {
    const lines = this.cachedLineArray.length ? this.cachedLineArray : Array.from(this.lyricsContainer?.querySelectorAll('.lyrics-line') || []);
    const reference = Math.max(0, lines.indexOf(this.currentPrimaryActiveLine));
    const nearby = lines.slice(Math.max(0, reference - 20), reference + 21);
    const contents = nearby.flatMap(line => Array.from(line.querySelectorAll('.lyrics-line-container, .main-vocal-container')));
    return {
      tops: new Map(nearby.map(line => [line, line.offsetTop])),
      contents: new Map(contents.map(content => [content, content.offsetTop])),
      scrollTop: this.lyricsContainer?.scrollTop || 0
    };
  }
  finishLyricLayout(before, deferScroll = false) {
    if (!this.lyricsContainer) return;
    const scrollCorrection = this.lyricsContainer.scrollTop - before.scrollTop;
    before.tops.forEach((top, line) => {
      const delta = top - line.offsetTop + scrollCorrection;
      if (Math.abs(delta) > 0.1) this.pendingLayoutOffsets.set(line, (this.pendingLayoutOffsets.get(line) || 0) + delta);
    });
    const contentChanges = [...before.contents].map(([content, top]) => ({
      content,
      delta: top - content.offsetTop
    }));
    for (const {
      content,
      delta
    } of contentChanges) {
      // eslint-disable-next-line no-continue
      if (Math.abs(delta) < 0.1) continue;
      const previous = this.contentSprings.get(content);
      const pose = previous ? AmLyrics.sampleSpring(previous.position, previous.velocity, Number(previous.animation.currentTime || 0) / 1000, 10) : {
        position: 0,
        velocity: 0
      };
      previous?.animation.cancel();
      this.contentSprings.delete(content);
      // eslint-disable-next-line no-continue
      if (this.shouldReduceMotion || this.lineMotion === 'instant') continue;
      const position = pose.position + delta;
      const animation = content.animate(AmLyrics.createLineSpringFrames(position, pose.velocity, 10, 'translate'), {
        duration: 1200,
        easing: 'linear',
        fill: 'both'
      });
      this.contentSprings.set(content, {
        animation,
        position,
        velocity: pose.velocity
      });
      animation.onfinish = () => {
        if (this.contentSprings.get(content)?.animation !== animation) return;
        animation.cancel();
        this.contentSprings.delete(content);
      };
    }
    if (deferScroll || !this.pendingLayoutOffsets.size) return;
    const target = this.currentPrimaryActiveLine;
    const top = target && this.autoScroll && !this.isUserScrolling ? Math.max(0, target.offsetTop - this.getScrollPaddingTop()) : this.lyricsContainer.scrollTop;
    this.animateScrollYouLy(-top, false, undefined, target);
  }
  setBackgroundExpandedLine(lineElement, deferScroll = false, visibleIndices = [], visibilityTime = this.currentTime) {
    const desired = new Set();
    for (const index of visibleIndices) {
      const line = this._getLineElement(index);
      if (line && this.getBackgroundWrap(line) && this.lyrics?.[index].backgroundText.some(note => note.endtime > visibilityTime)) desired.add(line);
    }
    if (lineElement && this.getBackgroundWrap(lineElement)) desired.add(lineElement);
    const entering = [...desired].filter(line => !this.backgroundExpandedLines.has(line));
    const leaving = [...this.backgroundExpandedLines].filter(line => !desired.has(line));
    if (!entering.length && !leaving.length) return false;
    const before = this.captureLyricLayout();
    // Capture every pose before committing any height, including interrupted fades.
    const changes = [...leaving, ...entering].map(line => {
      const wrap = this.getBackgroundWrap(line);
      const style = getComputedStyle(wrap);
      const pose = {
        opacity: style.opacity,
        transform: style.transform
      };
      const expanded = desired.has(line);
      const duration = this.shouldReduceMotion ? 0 : AmLyrics.getCssTimeMs(line, expanded ? '--am-lyrics-background-vocal-enter-duration' : '--am-lyrics-background-vocal-exit-duration', expanded ? 650 : BACKGROUND_EXIT_DURATION_MS);
      const height = expanded ? wrap.offsetHeight + 4 : 0;
      return {
        line,
        wrap,
        pose,
        expanded,
        duration,
        height
      };
    });
    for (const {
      line,
      wrap,
      pose,
      expanded,
      duration,
      height
    } of changes) {
      this.backgroundAnimations.get(line)?.cancel();
      this.backgroundAnimations.delete(line);
      if (expanded) {
        line.style.setProperty('--am-lyrics-background-vocal-height', `${height}px`);
        this.backgroundExpandedLines.add(line);
      } else {
        this.backgroundExpandedLines.delete(line);
      }
      line.classList.toggle('bg-expanded', expanded);
      line.classList.toggle('bg-collapsing', !expanded && duration > 0);
      const destination = getComputedStyle(wrap);
      if (duration > 0) {
        const animation = wrap.animate([pose, {
          opacity: destination.opacity,
          transform: destination.transform
        }], {
          duration,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          fill: 'both'
        });
        this.backgroundAnimations.set(line, animation);
        animation.onfinish = () => {
          if (this.backgroundAnimations.get(line) !== animation) return;
          animation.cancel();
          this.backgroundAnimations.delete(line);
          line.classList.remove('bg-collapsing');
        };
      }
    }
    this.finishLyricLayout(before, deferScroll);
    return true;
  }
  clearBackgroundExpandedLine() {
    this.clearBackgroundCarries();
    for (const animation of this.backgroundAnimations.values()) animation.cancel();
    for (const line of new Set([...this.backgroundExpandedLines, ...this.backgroundAnimations.keys()])) line.classList.remove('bg-expanded', 'bg-collapsing');
    this.backgroundAnimations.clear();
    this.backgroundExpandedLines.clear();
    for (const {
      animation
    } of this.contentSprings.values()) animation.cancel();
    this.contentSprings.clear();
  }
  static getBackgroundCarryTop(container) {
    return (container.querySelector('.lyrics-word') || container).getBoundingClientRect().top;
  }
  animateBackgroundCarries() {
    for (const entry of this.backgroundCarries.values()) {
      // eslint-disable-next-line no-continue
      if (entry.fromTop === undefined || entry.exiting) continue;
      const {
        fromTop
      } = entry;
      entry.fromTop = undefined;
      // eslint-disable-next-line no-continue
      if (this.shouldReduceMotion || this.lineMotion === 'instant') continue;
      // Measure after the new line's scroll/layout springs have committed.
      // The local spring and its parent then share the same displacement curve.
      const scale = entry.clone.getBoundingClientRect().height / Math.max(1, entry.clone.offsetHeight);
      const delta = (fromTop - AmLyrics.getBackgroundCarryTop(entry.clone)) / Math.max(0.01, scale);
      const animation = entry.clone.animate(AmLyrics.createLineSpringFrames(delta, 0), {
        duration: 1200,
        easing: 'linear',
        fill: 'both'
      });
      entry.animation = animation;
      animation.onfinish = () => {
        if (entry.animation !== animation) return;
        animation.cancel();
        entry.animation = undefined;
      };
    }
  }
  static invalidateVocalCache(line) {
    AmLyrics.motionWords.delete(line);
    AmLyrics.motionSyllables.delete(line);
    const target = line;
    target._cachedSyllableElements = null;
  }
  removeBackgroundCarry(index) {
    const entry = this.backgroundCarries.get(index);
    if (!entry) return;
    entry.animation?.cancel();
    AmLyrics.resetSyllables(entry.clone);
    entry.clone.getAnimations({
      subtree: true
    }).forEach(a => a.cancel());
    entry.clone.remove();
    entry.original.style.display = entry.display;
    entry.original.removeAttribute('data-bg-suspended');
    AmLyrics.invalidateVocalCache(entry.sourceLine);
    this.backgroundCarries.delete(index);
  }
  clearBackgroundCarries() {
    for (const index of this.backgroundCarries.keys()) this.removeBackgroundCarry(index);
  }
  syncBackgroundCarries(owner, predictiveTime) {
    if (!this.lyrics) return false;
    const ownerIndex = AmLyrics.getLineIndexFromElement(owner);
    if (ownerIndex === null) return false;
    if (this.currentTime < this.lastCarryTime) this.clearBackgroundCarries();
    this.lastCarryTime = this.currentTime;
    const desired = new Set();
    const currentCarry = [...this.backgroundCarries].find(([, entry]) => !entry.exiting && this.currentTime < entry.until);
    const restoredCarry = [...this.backgroundCarryRestoreOwners].find(([, restoredOwner]) => this.currentTime < this.lyrics[restoredOwner].endtime);
    if (currentCarry) desired.add(currentCarry[0]);else if (restoredCarry) desired.add(restoredCarry[0]);else {
      const index = ownerIndex - 1;
      const line = this.lyrics[index];
      const end = this.cachedLineData?.[index]?.backgroundEnd ?? 0;
      const leadEnd = this.cachedLineData?.[index]?.mainEnd ?? 0;
      const incoming = this.lyrics[ownerIndex];
      if (line && end > this.currentTime && end - Math.max(leadEnd, incoming.timestamp) >= BACKGROUND_CARRY_MIN_OVERLAP_MS && leadEnd <= Math.max(this.currentTime, incoming.timestamp) && incoming.timestamp <= predictiveTime && this.currentTime < incoming.endtime && AmLyrics.isOppositeAgent(line) === AmLyrics.isOppositeAgent(incoming) && (!line.agentId || !incoming.agentId || line.agentId === incoming.agentId) && AmLyrics.getBackgroundTextPlacement(line) === 'after') desired.add(index);
    }
    let changed = false;
    let before;
    const capture = () => {
      before ??= this.captureLyricLayout();
    };
    Array.from(this.backgroundCarries).forEach(([index, carry]) => {
      const entry = carry;
      if (desired.has(index) && !entry.exiting) return;
      if (desired.size && !desired.has(index)) {
        capture();
        this.removeBackgroundCarry(index);
        changed = true;
        return;
      }
      if (entry.exiting) {
        if (desired.has(index)) this.removeBackgroundCarry(index);
        return;
      }
      capture();
      const wrap = entry.clone.querySelector('.background-vocal-wrap');
      entry.animation?.cancel();
      entry.exiting = true;
      changed = true;
      if (this.shouldReduceMotion) {
        this.removeBackgroundCarry(index);
        return;
      }
      // Release its layout space now; the lead's spring absorbs the displacement.
      const top = entry.clone.offsetTop;
      const width = entry.clone.offsetWidth;
      entry.clone.style.cssText += `;position:absolute;top:${top}px;width:${width}px;height:0;`;
      entry.animation = wrap.animate([{
        opacity: getComputedStyle(wrap).opacity,
        transform: getComputedStyle(wrap).transform
      }, {
        opacity: 0,
        transform: 'translateY(-6px)'
      }], {
        duration: BACKGROUND_EXIT_DURATION_MS,
        easing: 'ease-out',
        fill: 'forwards'
      });
      entry.animation.onfinish = () => {
        if (this.backgroundCarries.get(index) === entry && entry.exiting) this.removeBackgroundCarry(index);
      };
    });
    desired.forEach(index => {
      let entry = this.backgroundCarries.get(index);
      if (!entry) {
        const destinationIndex = this.backgroundCarryRestoreOwners.get(index) ?? ownerIndex;
        const destination = this._getLineElement(destinationIndex) || owner;
        const sourceLine = this._getLineElement(index);
        const original = sourceLine?.querySelector('.background-vocal-container:not([data-bg-carried])');
        const main = destination.querySelector('.lyrics-line-container');
        if (!sourceLine || !original || !main) return;
        capture();
        const oldTop = this.backgroundCarryRestoreTops.get(index) ?? AmLyrics.getBackgroundCarryTop(original);
        const style = getComputedStyle(original);
        const clone = original.cloneNode(true);
        clone.setAttribute('data-bg-carried', `${index}`);
        clone.classList.replace('background-after', 'background-before');
        clone.style.direction = style.direction;
        clone.style.textAlign = style.textAlign;
        clone.style.display = 'block';
        for (const node of clone.querySelectorAll('.lyrics-word, .lyrics-syllable, .char, .char-motion')) {
          node.classList.remove('shared-word-wipe', 'word-wipe-rtl', 'native-motion', 'highlight', 'finished', 'pre-highlight', 'word-started', 'normal-word-motion');
          node.removeAttribute('data-glow');
          for (const prop of ['animation', 'background-position', 'background-size', 'background-color', 'transform']) node.style.removeProperty(prop);
        }
        const {
          display
        } = original.style;
        AmLyrics.resetSyllables(original);
        original.setAttribute('data-bg-suspended', '');
        original.style.display = 'none';
        AmLyrics.invalidateVocalCache(sourceLine);
        main.before(clone);
        const wrap = clone.querySelector('.background-vocal-wrap');
        wrap.style.opacity = '1';
        wrap.style.transform = 'none';
        clone.style.height = `${wrap.offsetHeight + 4}px`;
        entry = {
          original,
          clone,
          sourceLine,
          owner: destination,
          display,
          exiting: false,
          fromTop: oldTop,
          until: this.lyrics[destinationIndex].endtime
        };
        this.backgroundCarries.set(index, entry);
        changed = true;
      }
      AmLyrics.updateSyllablesForLine(entry.clone, this.currentTime, this.shouldReduceMotion);
    });
    if (before && changed) this.finishLyricLayout(before, true);
    return changed;
  }
  getPrimaryActiveLineIndex(activeIndices) {
    if (activeIndices.length === 0) return null;
    const groupStart = activeIndices[0];
    const groupEnd = activeIndices[activeIndices.length - 1];
    let candidateIndex = Math.max(groupStart, groupEnd - 2);
    const currentPrimaryIndex = AmLyrics.getLineIndexFromElement(this.currentPrimaryActiveLine);
    if (currentPrimaryIndex !== null && activeIndices.includes(currentPrimaryIndex)) {
      if (activeIndices.length <= 3) {
        candidateIndex = currentPrimaryIndex;
      } else if (candidateIndex < currentPrimaryIndex) {
        candidateIndex = currentPrimaryIndex;
      }
    }
    return candidateIndex;
  }
  getPrimaryScrollLineIndex(activeIndices, time) {
    if (!this.lyrics || this.lyrics.length === 0) return null;
    const latest = activeIndices.length ? activeIndices[activeIndices.length - 1] : this.getLineIndexAtTime(time, this.lastActiveIndex);
    if (latest === -1) return null;
    this._ensureLineDataCache();
    // Judge overlap at its start, then hold until the earlier lead actually ends.
    for (const index of this.findActiveLineIndices(this.currentTime)) {
      const data = this.cachedLineData?.[index];
      if (index < latest && data && data.mainEnd > this.currentTime && data.substantialOverlap) return index;
    }
    return latest;
  }
  focusLine(lineElement, forceScroll = false, scrollDuration = undefined, skipScroll = false, preservePrimary = false) {
    const primaryChanged = lineElement !== this.currentPrimaryActiveLine;
    if (primaryChanged && !preservePrimary) {
      this.lastPrimaryActiveLine = this.currentPrimaryActiveLine;
      if (this.lastPrimaryActiveLine) {
        this.lastPrimaryActiveLine.style.setProperty('--scroll-duration', `${scrollDuration ?? SCROLL_ANIMATION_DURATION_MS}ms`);
        const previousIndex = AmLyrics.getLineIndexFromElement(this.lastPrimaryActiveLine);
        const nextIndex = AmLyrics.getLineIndexFromElement(lineElement);
        const overlaps = previousIndex !== null && nextIndex !== null && this.getLineHighlightEndTime(previousIndex) > (this.lyrics?.[nextIndex].timestamp ?? 0);
        this.lastPrimaryActiveLine.classList.toggle('scroll-exiting', !overlaps);
        if (!this.lastPrimaryActiveLine.classList.contains('active')) {
          this.lastPrimaryActiveLine.classList.remove('pre-active');
          this.preActiveLineElements = this.preActiveLineElements.filter(element => element !== this.lastPrimaryActiveLine);
        }
      }
      this.currentPrimaryActiveLine = lineElement;
      this.currentPrimaryActiveLine.classList.remove('scroll-exiting');
      const lineIndex = AmLyrics.getLineIndexFromElement(lineElement);
      if (lineIndex !== null) {
        this.lastActiveIndex = lineIndex;
      }
    }
    // Line-timed highlighting follows pre-scroll, including seeks while the
    // target stays unchanged. Word-timed overlaps keep their own clocks.
    const targetIndex = AmLyrics.getLineIndexFromElement(lineElement);
    if (!preservePrimary && targetIndex !== null) {
      for (const index of this.activeLineIndices) {
        if (index < targetIndex && AmLyrics.isLineSyncedLine(this.lyrics?.[index]) && this.getLineHighlightEndTime(index) <= (this.lyrics?.[targetIndex].timestamp ?? 0)) {
          const previousLine = this._getLineElement(index);
          if (previousLine?.classList.contains('active')) {
            previousLine.classList.remove('active', 'pre-active');
            previousLine.removeAttribute('aria-current');
            AmLyrics.unfinishSyllables(previousLine);
          }
        }
      }
    }
    // Only update blur/opacity position classes when the primary line
    // actually changes (or on force scroll). Running this every tick
    // causes visual churn and upward glitches.
    if (primaryChanged || forceScroll) {
      this.updatePositionClasses(lineElement);
    }
    if (!skipScroll && (forceScroll || primaryChanged || preservePrimary) && this.autoScroll && !this.isUserScrolling && !this.isClickSeeking) {
      this.scrollToActiveLineYouLy(lineElement, forceScroll, scrollDuration);
    }
  }
  setUserScrolling(value) {
    this.isUserScrolling = value;
    if (value) {
      this.lyricsContainer?.classList.add('user-scrolling');
      this.clearProgressiveBlurLine();
    } else {
      this.lyricsContainer?.classList.remove('user-scrolling');
    }
  }
  handleUserScroll() {
    // Ignore programmatic scrolls and click-seek scrolls
    if (this.isProgrammaticScroll || this.isClickSeeking) {
      return;
    }
    // Mark that user is currently scrolling
    this.setUserScrolling(true);
    this.clearPastLineHighlights();
    // Clear any existing timeout
    if (this.userScrollTimeoutId) {
      clearTimeout(this.userScrollTimeoutId);
    }
    // Let native momentum settle before returning control to auto-scroll.
    this.userScrollTimeoutId = window.setTimeout(() => {
      this.setUserScrolling(false);
      this.userScrollTimeoutId = undefined;
      // Optionally scroll back to current active line when re-enabling auto-scroll
      if (this.activeLineIndices.length > 0) {
        this._handleActiveLineScroll(true);
      } else {
        const currentGap = this.findInstrumentalGapAt(this.currentTime);
        if (currentGap) {
          this.scrollToInstrumental(currentGap.insertBeforeIndex, true);
        }
      }
    }, USER_SCROLL_RESUME_DELAY_MS);
  }
  clearPastLineHighlights() {
    if (!this.lyricsContainer) return;
    const lineElements = this.cachedLineArray.length ? this.cachedLineArray : Array.from(this.lyricsContainer.querySelectorAll('.lyrics-line:not(.lyrics-gap)'));
    for (const line of lineElements) {
      if (!line.classList.contains('active') && line.classList.contains('persist-highlight')) {
        AmLyrics.unfinishSyllables(line);
      }
    }
  }
  /**
   * Find the first (lowest-index) line whose raw time range contains `timeMs`.
   * Uses a stable forward scan so overlapping ranges always return the same
   * line, preventing primary-target jitter that causes scroll glitches.
   */
  getLineIndexAtTime(timeMs, startHintIndex = 0) {
    if (!this.lyrics || this.lyrics.length === 0) return -1;
    const len = this.lyrics.length;
    // 1. Check hint and immediate neighbours first (fast path)
    const hint = Math.max(0, Math.min(startHintIndex, len - 1));
    for (let i = hint; i < len; i += 1) {
      const line = this.lyrics[i];
      if (line.timestamp > timeMs) break;
      if (timeMs >= line.timestamp && timeMs < line.endtime) {
        return i;
      }
    }
    for (let i = hint - 1; i >= 0; i -= 1) {
      const line = this.lyrics[i];
      if (timeMs >= line.timestamp && timeMs < line.endtime) {
        return i;
      }
      if (line.endtime < timeMs) break;
    }
    // 2. Full forward scan — guaranteed deterministic for overlaps
    for (let i = 0; i < len; i += 1) {
      const line = this.lyrics[i];
      if (line.timestamp > timeMs) break;
      if (timeMs >= line.timestamp && timeMs < line.endtime) {
        return i;
      }
    }
    return -1;
  }
  findActiveLineIndices(time) {
    if (!this.lyrics || this.lyrics.length === 0) return [];
    this.ensureTimingCache();
    const interval = this.activeTimelineInterval;
    if (interval && time >= interval.start && time < interval.end) return interval.indices;
    const activeLines = [];
    let start = -Infinity;
    let end = Infinity;
    for (let i = 0; i < this.lyrics.length; i += 1) {
      const line = this.lyrics[i];
      const highlightEndTime = this.getLineHighlightEndTime(i);
      if (line.timestamp > time) {
        end = Math.min(end, line.timestamp);
        break;
      }
      start = Math.max(start, line.timestamp);
      if (time >= line.timestamp && time < highlightEndTime) {
        activeLines.push(i);
        end = Math.min(end, highlightEndTime);
      } else {
        start = Math.max(start, highlightEndTime);
      }
    }
    this.activeTimelineInterval = {
      start,
      end,
      indices: activeLines
    };
    return activeLines;
  }
  findInstrumentalGapAt(time) {
    if (!this.lyrics || this.lyrics.length === 0) return null;
    const gaps = this.findAllInstrumentalGaps();
    let low = 0;
    let high = gaps.length;
    while (low < high) {
      const middle = Math.floor((low + high) / 2);
      if (gaps[middle].gapStart <= time) low = middle + 1;else high = middle;
    }
    const gap = gaps[low - 1];
    return gap && time < gap.gapEnd ? gap : null;
  }
  /**
   * Find ALL instrumental gaps in the song, regardless of current time.
   * Used by the template to always render gap elements in the DOM.
   */
  findAllInstrumentalGaps() {
    if (this.gapsCached) return this.cachedAllGaps;
    if (!this.lyrics || this.lyrics.length === 0) return [];
    const gaps = [];
    // Start-of-song gap
    const first = this.lyrics[0];
    if (first.timestamp >= INSTRUMENTAL_THRESHOLD_MS) {
      gaps.push({
        insertBeforeIndex: 0,
        gapStart: 0,
        gapEnd: first.timestamp
      });
    }
    // Inter-line gaps
    for (let i = 0; i < this.lyrics.length - 1; i += 1) {
      const curr = this.lyrics[i];
      const next = this.lyrics[i + 1];
      const gapStart = curr.endtime;
      const gapEnd = next.timestamp;
      if (gapEnd - gapStart >= INSTRUMENTAL_THRESHOLD_MS) {
        gaps.push({
          insertBeforeIndex: i + 1,
          gapStart,
          gapEnd
        });
      }
    }
    this.cachedAllGaps = gaps;
    this.gapsCached = true;
    return gaps;
  }
  handleLineClick(line) {
    if (this.cachedIsUnsynced) return;
    // Reset all syllables to prevent highlighting conflicts during seek
    if (this.lyricsContainer) {
      const allLines = this.lyricsContainer.querySelectorAll('.lyrics-line');
      allLines.forEach(lineEl => {
        AmLyrics.resetSyllables(lineEl);
        // Remove scroll-animate class and properties to stop any scroll animations
        lineEl.classList.remove('scroll-animate', 'scroll-exiting');
        lineEl.style.removeProperty('--scroll-delta');
        lineEl.style.removeProperty('--lyrics-line-delay');
      });
      // Ensure container state is clean
      this.lyricsContainer.classList.remove('wheel-scrolling');
    }
    this.cancelLineScrollAnimation();
    // Clear scroll animation timeouts
    // Also clear user scroll timeout to prevent stale scrollToActiveLine
    if (this.userScrollTimeoutId) {
      clearTimeout(this.userScrollTimeoutId);
      this.userScrollTimeoutId = undefined;
    }
    this.setUserScrolling(false);
    // Reset active line tracking to prevent scroll fighting
    this.currentPrimaryActiveLine = null;
    this.lastPrimaryActiveLine = null;
    this.activeLineIds.clear();
    this.setBackgroundExpandedLine(null);
    // Find the clicked line element and scroll to it with forceScroll (like YouLyPlus)
    // Timestamps are already in milliseconds — match the data-start-time attribute directly
    const clickedLineElement = this.lyricsContainer?.querySelector(`.lyrics-line[data-start-time="${line.text[0]?.timestamp || 0}"]`);
    if (clickedLineElement && this.lyricsContainer) {
      // Update active line reference to the clicked line
      this.currentPrimaryActiveLine = clickedLineElement;
      // Reset currentScrollOffset to actual scroll position to prevent stale delta
      this.currentScrollOffset = -this.lyricsContainer.scrollTop;
      // Set click-seek cooldown to prevent updated() scroll from fighting
      this.isClickSeeking = true;
      if (this.clickSeekTimeout) clearTimeout(this.clickSeekTimeout);
      this.clickSeekTimeout = setTimeout(() => {
        this.isClickSeeking = false;
      }, 800);
      this.scrollToActiveLineYouLy(clickedLineElement, true);
      this.setBackgroundExpandedLine(clickedLineElement);
    }
    const event = new CustomEvent('line-click', {
      detail: {
        timestamp: line.timestamp
      },
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(event);
  }
  static getBackgroundTextPlacement(line) {
    if (!line.backgroundText || line.backgroundText.length === 0 || line.text.length === 0) {
      return 'after'; // Default to after if no comparison is possible
    }
    // Compare the start times of the first syllables
    const mainTextStartTime = line.text[0].timestamp;
    const backgroundTextStartTime = line.backgroundText[0].timestamp;
    return backgroundTextStartTime < mainTextStartTime ? 'before' : 'after';
  }
  scrollToActiveLine() {
    if (!this.lyricsContainer || this.activeLineIndices.length === 0) {
      return;
    }
    // Scroll to the first active line
    const firstActiveLineIndex = Math.min(...this.activeLineIndices);
    const activeLineElement = this.lyricsContainer.querySelector(`.lyrics-line:nth-child(${firstActiveLineIndex + 1})`);
    if (activeLineElement) {
      const containerHeight = this.lyricsContainer.clientHeight;
      const lineTop = activeLineElement.offsetTop;
      const lineHeight = activeLineElement.clientHeight;
      // Check if the line has background text placed before the main text
      const hasBackgroundBefore = activeLineElement.querySelector('.background-text.before');
      // Calculate the offset to center the main text content, accounting for background text placement
      let offsetAdjustment = 0;
      if (hasBackgroundBefore) {
        const backgroundElement = hasBackgroundBefore;
        offsetAdjustment = backgroundElement.clientHeight / 2; // Adjust to focus on main content
      }
      const top = lineTop - containerHeight / 2 + lineHeight / 2 - offsetAdjustment;
      // Use requestAnimationFrame for smoother iOS performance
      requestAnimationFrame(() => {
        this.isProgrammaticScroll = true;
        this.lyricsContainer?.scrollTo({
          top,
          behavior: 'smooth'
        });
        // Reset the flag after a short delay to allow the scroll to complete
        setTimeout(() => {
          this.isProgrammaticScroll = false;
        }, 100);
      });
    }
  }
  scrollToInstrumental(insertBeforeIndex, forceScroll = false) {
    if (!this.lyricsContainer) return;
    // Find the gap element by ID instead of nth-child
    const gapTarget = this.lyricsContainer.querySelector(`#gap-${insertBeforeIndex}`);
    if (gapTarget) {
      // Use same scroll position as lyrics (scroll-padding-top from top), not center
      // This matches YouLyPlus behavior where gaps don't scroll to a different position
      const paddingTop = this.getScrollPaddingTop();
      const targetTranslateY = paddingTop - gapTarget.offsetTop;
      this.isProgrammaticScroll = true;
      this.clearPastLineHighlights();
      this.animateScrollYouLy(targetTranslateY, forceScroll, undefined, gapTarget);
      setTimeout(() => {
        this.isProgrammaticScroll = false;
      }, 250);
    }
  }
  // === YouLyPlus-style Animation Methods ===
  /**
   * Get the scroll padding top value from CSS variable
   */
  getScrollPaddingTop() {
    if (!this.lyricsContainer) return 0;
    const style = getComputedStyle(this.lyricsContainer);
    const paddingTopValue = style.getPropertyValue('--lyrics-scroll-padding-top') || '12%';
    let result;
    if (paddingTopValue.includes('%')) {
      result = this.lyricsContainer.clientHeight * (parseFloat(paddingTopValue) / 100);
    } else {
      result = parseFloat(paddingTopValue) || 0;
    }
    return result;
  }
  cancelLineScrollAnimation() {
    this.lineSprings.forEach((spring, line) => {
      spring.animation.cancel();
      line.style.removeProperty('will-change');
    });
    this.lineSprings.clear();
  }
  static sampleSpring(position, velocity, time, frequency, damping = 0.9 * frequency) {
    const omega = Math.sqrt(frequency * frequency - damping * damping);
    const decay = Math.exp(-damping * time);
    const cos = Math.cos(omega * time);
    const sin = Math.sin(omega * time);
    return {
      position: decay * (position * cos + (velocity + damping * position) / omega * sin),
      velocity: decay * (velocity * cos - (damping * velocity + frequency * frequency * position) / omega * sin)
    };
  }
  static createLineSpringFrames(position, velocity, frequency = 10, propertyName = 'transform') {
    let samples = AmLyrics.lineSpringSamples.get(frequency);
    if (!samples) {
      samples = Array.from({
        length: 97
      }, (_, frame) => {
        const offset = frame / 96;
        const time = 1.2 * offset;
        return {
          offset,
          fromPosition: frame === 96 ? 0 : AmLyrics.sampleSpring(1, 0, time, frequency).position,
          fromVelocity: frame === 96 ? 0 : AmLyrics.sampleSpring(0, 1, time, frequency).position
        };
      });
      AmLyrics.lineSpringSamples.set(frequency, samples);
    }
    // A spring is linear in its starting position and velocity. Reuse the
    // two unit curves instead of repeating trigonometry for every moving row.
    return samples.map(({
      offset,
      fromPosition,
      fromVelocity
    }) => {
      const y = position * fromPosition + velocity * fromVelocity;
      // Content containers already scale in CSS. Their layout correction must
      // compose with that scale rather than replace it during the spring.
      return propertyName === 'translate' ? {
        offset,
        translate: `0 ${y}px`
      } : {
        offset,
        transform: `translate3d(0, ${y}px, 0)`
      };
    });
  }
  getLayoutScrollHeight() {
    const parent = this.lyricsContainer;
    if (!parent) return 0;
    const last = this.footerElement || parent.lastElementChild;
    if (!last) return parent.scrollHeight;
    return Math.max(parent.clientHeight, last.offsetTop + last.offsetHeight + (Number.parseFloat(getComputedStyle(last).marginBottom) || 0) + (Number.parseFloat(getComputedStyle(parent).paddingBottom) || 0));
  }
  animateScrollYouLy(newTranslateY, _forceScroll, _scrollDuration, referenceElement = null) {
    if (!this.lyricsContainer) return;
    const parent = this.lyricsContainer;
    const currentTop = parent.scrollTop;
    const requestedDelta = -newTranslateY - currentTop;
    if (this.shouldReduceMotion || this.lineMotion === 'instant') {
      this.cancelLineScrollAnimation();
      parent.scrollTop = Math.max(0, -newTranslateY);
      this.currentScrollOffset = -parent.scrollTop;
      this.pendingLayoutOffsets.clear();
      return;
    }
    if (Math.abs(requestedDelta) < 0.5 && !this.pendingLayoutOffsets.size) return;
    const lines = this.cachedLineArray.length ? this.cachedLineArray : Array.from(parent.querySelectorAll('.lyrics-line'));
    const reference = lines.indexOf(referenceElement || this.currentPrimaryActiveLine || lines[0]);
    const retargeting = this.lineSprings.size > 0;
    // LyricsBlossom's published line spring: mass 1, stiffness 100,
    // damping 18. Predictive look-ahead is not a playback-speed multiplier.
    const frequency = 10;
    // Sample the analytic spring once. The compositor advances translation;
    // playback work, lyric painting and JS frame scheduling cannot hold it up.
    // Read all current poses before cancelling anything or changing scrollTop.
    const firstVisibleIndex = Math.max(0, reference - 20);
    const poses = lines.slice(firstVisibleIndex, reference + 21).map((line, localIndex) => {
      const index = firstVisibleIndex + localIndex;
      const previous = this.lineSprings.get(line);
      const age = previous ? Math.max(0, Number(previous.animation.currentTime || 0) / 1000 - previous.delay) : 0;
      const pose = previous ? AmLyrics.sampleSpring(previous.position, previous.velocity, age, previous.frequency) : {
        position: 0,
        velocity: 0
      };
      const steps = requestedDelta >= 0 ? index - reference : reference - index;
      // Keep an in-flight cascade's remaining delays. A row that settled
      // early must not start a fresh stagger while its neighbours are moving.
      let delay = 0;
      if (this.lineMotion !== 'uniform') {
        if (retargeting && previous) {
          delay = Math.max(0, previous.delay - Number(previous.animation.currentTime || 0) / 1000);
        } else if (!retargeting) {
          delay = Math.max(0, Math.min(4, steps)) * 0.05;
        }
      }
      return {
        line,
        index,
        top: line.offsetTop,
        height: line.offsetHeight,
        moving: Boolean(previous),
        position: pose.position + (this.pendingLayoutOffsets.get(line) || 0),
        velocity: pose.velocity,
        delay
      };
    });
    this.pendingLayoutOffsets.clear();
    this.cancelLineScrollAnimation();
    // Animated translation contributes to scrollHeight. Measure the real
    // range only after removing it, or retargeting near the bottom jumps.
    const target = AmLyrics.clamp(-newTranslateY, 0, Math.max(0, this.getLayoutScrollHeight() - parent.clientHeight));
    const delta = target - currentTop;
    // Cover the entire swept viewport, not just its destination. Retargeted
    // rows retain their motion; distant rows need no sampled spring or layer.
    const visibleStart = Math.min(currentTop, target) - 200;
    const visibleEnd = Math.max(currentTop, target) + parent.clientHeight + 200;
    parent.scrollTop = target;
    this.currentScrollOffset = -target;
    poses.forEach(({
      line,
      index,
      top,
      height,
      moving,
      position: previousPosition,
      velocity,
      delay
    }) => {
      const position = previousPosition + delta;
      if (Math.abs(index - reference) > 20 || !moving && (top + height < visibleStart || top > visibleEnd) || Math.abs(position) < 0.1 && Math.abs(velocity) < 0.1) return;
      const duration = 1.2;
      const frames = AmLyrics.createLineSpringFrames(position, velocity, frequency);
      line.style.setProperty('will-change', 'transform');
      const animation = line.animate(frames, {
        duration: duration * 1000,
        delay: delay * 1000,
        fill: 'both',
        easing: 'linear'
      });
      this.lineSprings.set(line, {
        animation,
        position,
        velocity,
        delay,
        frequency
      });
      animation.onfinish = () => {
        if (this.lineSprings.get(line)?.animation !== animation) return;
        animation.cancel();
        line.style.removeProperty('will-change');
        this.lineSprings.delete(line);
      };
    });
  }
  /**
   * Update position classes for YouLyPlus-style opacity/blur gradients
   */
  updatePositionClasses(lineToScroll) {
    if (!this.lyricsContainer) return;
    const positionClasses = ['lyrics-activest', 'post-active-line', 'next-active-line', 'prev-1', 'prev-2', 'prev-3', 'prev-4', 'next-1', 'next-2', 'next-3', 'next-4'];
    // Remove old position classes from tracked elements
    for (const el of this.positionedLineElements) {
      el.classList.remove(...positionClasses);
    }
    this.positionedLineElements = [];
    // Add new position classes
    lineToScroll.classList.add('lyrics-activest');
    this.positionedLineElements.push(lineToScroll);
    if (this.cachedLineArray.length === 0) {
      this.cachedLineArray = Array.from(this.lyricsContainer.querySelectorAll('.lyrics-line'));
    }
    const lineElements = this.cachedLineArray;
    const scrollLineIndex = lineElements.indexOf(lineToScroll);
    if (scrollLineIndex === -1) return;
    for (let i = Math.max(0, scrollLineIndex - 4); i <= Math.min(lineElements.length - 1, scrollLineIndex + 4); i += 1) {
      const position = i - scrollLineIndex;
      if (position !== 0) {
        const element = lineElements[i];
        if (position === -1) element.classList.add('post-active-line');else if (position === 1) element.classList.add('next-active-line');else if (position < 0) element.classList.add(`prev-${Math.abs(position)}`);else element.classList.add(`next-${position}`);
        this.positionedLineElements.push(element);
      }
    }
  }
  /**
   * Scroll to active line with YouLyPlus-style animation
   */
  scrollToActiveLineYouLy(activeLine, forceScroll = false, scrollDuration = undefined) {
    if (!activeLine || !this.lyricsContainer) return;
    const paddingTop = this.getScrollPaddingTop();
    const targetTop = Math.max(0, activeLine.offsetTop - paddingTop);
    const targetTranslateY = -targetTop;
    // Skip if already at target position
    if (!forceScroll && !this.pendingLayoutOffsets.size && Math.abs(this.lyricsContainer.scrollTop - targetTop) < 1) {
      return;
    }
    // Skip scroll if near the bottom of content and we aren't trying to scroll back up
    if (!forceScroll && !this.pendingLayoutOffsets.size && !activeLine.classList.contains('lyrics-footer')) {
      const parent = this.lyricsContainer;
      const atBottom = parent.scrollTop + parent.clientHeight >= parent.scrollHeight - 50;
      if (atBottom && targetTop > parent.scrollTop - 50) {
        return;
      }
    }
    this.lyricsContainer.classList.remove('not-focused', 'user-scrolling');
    this.isProgrammaticScroll = true;
    this.setUserScrolling(false);
    if (this.userScrollTimeoutId) {
      clearTimeout(this.userScrollTimeoutId);
      this.userScrollTimeoutId = undefined;
    }
    this.clearPastLineHighlights();
    const duration = scrollDuration ?? SCROLL_ANIMATION_DURATION_MS;
    setTimeout(() => {
      this.isProgrammaticScroll = false;
    }, duration + 160);
    this.animateScrollYouLy(targetTranslateY, forceScroll, scrollDuration, activeLine);
  }
  /**
   * Update syllable highlight animation - apply CSS wipe animation
   */
  static clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }
  static getVisibleCharacterCount(element) {
    const attrLength = parseFloat(element.getAttribute('data-word-length') || '');
    if (Number.isFinite(attrLength) && attrLength > 0) return attrLength;
    return (element.textContent || '').replace(/\s/g, '').length;
  }
  static getLongWordWipeScale(charCount) {
    if (charCount <= 6) return 1;
    return 1 + AmLyrics.clamp((charCount - 6) / 10, 0, 1) * LONG_WORD_WIPE_EXTRA_RATIO;
  }
  static applyWipeShape(element, charCount, cjk = false) {
    const extra = AmLyrics.clamp((charCount - 6) / 10, 0, 1) * LONG_WORD_WIPE_EXTRA_EM;
    const width = cjk ? CJK_WIPE_GRADIENT_EM : BASE_WIPE_GRADIENT_EM + extra;
    element.style.setProperty('--wipe-gradient-width', `${width.toFixed(3)}em`);
    element.style.setProperty('--wipe-gradient-half', `${(width / 2).toFixed(3)}em`);
  }
  static ensureWordWipeGeometry(charSpans, charCount) {
    if (charSpans.length === 0) return;
    const approxWidthCh = Math.max(1, charCount || charSpans.length);
    charSpans.forEach((span, index) => {
      if (!span.style.getPropertyValue('--word-wipe-width')) {
        span.style.setProperty('--word-wipe-width', `${approxWidthCh}ch`);
      }
      if (!span.style.getPropertyValue('--char-wipe-position')) {
        const startPct = index / Math.max(1, charSpans.length);
        span.style.setProperty('--char-wipe-position', `${-(AmLyrics.clamp(startPct, 0, 1) * approxWidthCh)}ch`);
      }
    });
  }
  static clearPreHighlight(syllable) {
    const word = AmLyrics.getWordElementForSyllable(syllable);
    if (word) AmLyrics.clearWordWipe(word);
    const target = syllable;
    target.classList.remove('pre-highlight');
    target.style.removeProperty('--pre-wipe-duration');
    target.style.removeProperty('--pre-wipe-delay');
    target.style.animation = '';
    target.querySelectorAll('.pre-wipe-lead').forEach(element => AmLyrics.clearPreWipeLead(element));
    AmLyrics.getCachedVirtualWordElements(AmLyrics.getWordElementForSyllable(syllable)).forEach(element => {
      const wordTarget = element;
      wordTarget._wordPreWipeKey = undefined;
    });
  }
  static clearPreWipeLead(element) {
    element.classList.remove('pre-wipe-lead');
    element.style.removeProperty('--pre-wipe-duration');
    element.style.removeProperty('--pre-wipe-delay');
  }
  static hasTextBoundaryAfter(syllable) {
    return /\s$/.test(syllable.textContent || '');
  }
  static getSyllableWordIndex(syllable) {
    const wordElement = AmLyrics.getWordElementForSyllable(syllable);
    const virtualWordId = wordElement?.dataset.virtualWordId;
    if (virtualWordId) {
      return `virtual:${virtualWordId}`;
    }
    const virtualWordStart = wordElement?.dataset.virtualWordStart;
    const virtualWordEnd = wordElement?.dataset.virtualWordEnd;
    if (virtualWordStart || virtualWordEnd) {
      return `virtual:${virtualWordStart || ''}:${virtualWordEnd || ''}`;
    }
    return syllable.getAttribute('data-word-index') || syllable.getAttribute('data-syllable-index') || '';
  }
  static getNextWordSyllable(syllables, index) {
    const current = syllables[index];
    const currentWordIndex = AmLyrics.getSyllableWordIndex(current);
    const previousSyllable = current;
    const currentVocalTrack = AmLyrics.getVocalTrack(current);
    for (let i = index + 1; i < syllables.length; i += 1) {
      const candidate = syllables[i];
      if (AmLyrics.getVocalTrack(candidate) !== currentVocalTrack) {
        return null;
      }
      if (candidate.classList.contains('transliteration')) {
        // eslint-disable-next-line no-continue
        continue;
      }
      const candidateWordIndex = AmLyrics.getSyllableWordIndex(candidate);
      if (candidateWordIndex === currentWordIndex || !AmLyrics.hasTextBoundaryAfter(previousSyllable) && !/^\s/.test(candidate.textContent || '')) {
        return null;
      }
      return candidate;
    }
    return null;
  }
  static getPreviousNonTransliterationSyllable(syllables, index) {
    const currentVocalTrack = AmLyrics.getVocalTrack(syllables[index]);
    for (let i = index - 1; i >= 0; i -= 1) {
      const candidate = syllables[i];
      if (AmLyrics.getVocalTrack(candidate) !== currentVocalTrack) {
        return null;
      }
      if (!candidate.classList.contains('transliteration')) {
        return candidate;
      }
    }
    return null;
  }
  static getVocalTrack(syllable) {
    const target = syllable;
    if (target._cachedVocalTrack === undefined) {
      target._cachedVocalTrack = syllable.closest('.main-vocal-container, .background-vocal-container');
    }
    return target._cachedVocalTrack;
  }
  static getRenderedWordSyllables(syllable) {
    const wordElement = AmLyrics.getWordElementForSyllable(syllable);
    const wordElements = AmLyrics.getCachedVirtualWordElements(wordElement);
    const wordSyllables = wordElements.flatMap(element => Array.from(element.querySelectorAll('.lyrics-syllable')));
    return wordSyllables.filter(wordSyllable => !wordSyllable.classList.contains('transliteration'));
  }
  static getWordWipe(syllable) {
    if (syllable.classList.contains('line-synced') || syllable.classList.contains('transliteration')) return undefined;
    const words = AmLyrics.getCachedVirtualWordElements(AmLyrics.getWordElementForSyllable(syllable));
    const word = words[0];
    if (!word) return undefined;
    const cached = AmLyrics.wordWipes.get(word);
    if (cached) return cached;
    const syllables = AmLyrics.getRenderedWordSyllables(syllable);
    const fragments = [];
    const segments = [];
    let width = 0;
    for (const segment of syllables) {
      const chars = AmLyrics.getCachedCharSpans(segment);
      const targets = chars.length ? chars : [segment];
      let segmentWidth = 0;
      for (const element of targets) {
        const style = getComputedStyle(element);
        const fragmentWidth = Number.parseFloat(style.width);
        // eslint-disable-next-line no-continue
        if (!Number.isFinite(fragmentWidth) || fragmentWidth <= 0) continue;
        fragments.push({
          element,
          width: fragmentWidth,
          offset: width,
          fontSize: Number.parseFloat(style.fontSize),
          padding: Math.max(Number.parseFloat(style.paddingLeft) || 0, Number.parseFloat(style.paddingRight) || 0)
        });
        width += fragmentWidth;
        segmentWidth += fragmentWidth;
      }
      segments.push({
        start: Number(segment.dataset.startTime),
        end: Number(segment.dataset.endTime),
        width: segmentWidth
      });
    }
    if (!width || !segments.length) return undefined;
    const start = Math.min(...segments.map(segment => segment.start));
    let end = Math.max(start + 1, ...segments.map(segment => segment.end));
    const nextWord = words[words.length - 1].nextElementSibling;
    const nextStart = Number(nextWord?.dataset.virtualWordStart);
    // Some providers overlap adjacent words. Finish the preceding edge at the
    // next word's timestamp while retaining the soft pre-wipe handoff.
    if (nextStart > start) end = Math.min(end, nextStart);
    const text = syllables.map(segment => segment.textContent || '').join('').replace(/\s/g, '');
    // Resolve the handoff once, even if no player tick lands in its window.
    let epoch = start;
    const previousWord = word.previousElementSibling;
    const previousStart = Number(previousWord?.dataset.virtualWordStart);
    const previousEnd = Math.min(Number(previousWord?.dataset.virtualWordEnd), start);
    const previousSyllables = previousWord?.querySelectorAll('.lyrics-syllable:not(.transliteration)');
    const previousSyllable = previousSyllables?.[previousSyllables.length - 1];
    if (previousStart < start && previousEnd > previousStart && start - previousEnd <= NEXT_WORD_PRE_WIPE_MAX_GAP_MS && previousSyllable && (AmLyrics.hasTextBoundaryAfter(previousSyllable) || /^\s/.test(syllables[0].textContent || ''))) {
      epoch = Math.max(start - AmLyrics.getWordPreWipeDuration(syllables[0], syllables), previousEnd - WORD_PRE_WIPE_HANDOFF_LEAD_MS);
    }
    const wipe = {
      syllables,
      fragments,
      segments,
      width,
      count: Array.from(text).length,
      cjk: /[\u3400-\u4dbf\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]/.test(text),
      start,
      end,
      rtl: syllable.classList.contains('rtl-text'),
      animations: [],
      epoch,
      prepared: false,
      settled: false
    };
    words.forEach(element => AmLyrics.wordWipes.set(element, wipe));
    return wipe;
  }
  static startWordWipe(wipe, time, epoch = wipe.epoch, restore = false) {
    if (wipe.animations.length) {
      if (restore) {
        for (const animation of wipe.animations) {
          // eslint-disable-next-line no-continue
          if (animation.playState !== 'idle') continue;
          const effect = animation.effect;
          const target = effect?.target;
          const fragment = wipe.fragments.find(item => item.element === target);
          if (target instanceof HTMLElement && fragment) {
            const feather = fragment.fontSize * Number.parseFloat(target.style.getPropertyValue('--wipe-gradient-width'));
            target.style.backgroundPosition = wipe.rtl ? `${(fragment.width + fragment.padding) / fragment.fontSize}em 0%` : `${(-wipe.width - feather - fragment.padding) / fragment.fontSize}em 0%`;
          }
          animation.play();
          animation.currentTime = Math.min(time - wipe.epoch, Number(animation.effect?.getComputedTiming().endTime));
        }
        // eslint-disable-next-line no-param-reassign
        wipe.settled = false;
      }
      return;
    }
    if (wipe.settled && !restore) return;
    const startEpoch = Math.min(epoch, wipe.start);
    const duration = Math.max(1, wipe.end - startEpoch);
    const stops = [];
    if (startEpoch < wipe.start) stops.push({
      offset: 0,
      progress: 0,
      pre: true
    });
    stops.push({
      offset: (wipe.start - startEpoch) / duration,
      progress: 0
    });
    let previousEnd = wipe.start;
    let progress = 0;
    for (const segment of wipe.segments) {
      const start = AmLyrics.clamp(segment.start, previousEnd, wipe.end);
      const end = AmLyrics.clamp(segment.end, start, wipe.end);
      if (start > previousEnd) stops.push({
        offset: (start - startEpoch) / duration,
        progress
      });
      progress += segment.width;
      stops.push({
        offset: (end - startEpoch) / duration,
        progress
      });
      previousEnd = end;
    }
    stops.push({
      offset: 1,
      progress: wipe.width
    });
    const wordWipe = wipe;
    wordWipe.epoch = startEpoch;
    wordWipe.prepared = true;
    wordWipe.settled = false;
    wipe.syllables.forEach(syllable => {
      const target = syllable;
      target.style.animation = 'none';
    });
    const enterFromOutside = startEpoch === wipe.start;
    for (const {
      element,
      width,
      offset,
      fontSize,
      padding
    } of wipe.fragments) {
      AmLyrics.applyWipeShape(element, wipe.count, wipe.cjk);
      // Keep the edge and feather in the same units when the font size changes.
      const wordWidthEm = wipe.width / fontSize;
      element.style.setProperty('--word-wipe-width', `${wordWidthEm}em`);
      element.style.backgroundColor = 'var(--word-inactive-color, var(--lyplus-text-secondary))';
      element.style.backgroundSize = `calc(${wordWidthEm}em + var(--wipe-gradient-width, 0.75em)) 100%`;
      element.style.animation = 'none';
      element.classList.add('shared-word-wipe');
      element.classList.toggle('word-wipe-rtl', wipe.rtl);
      const feather = fontSize * Number.parseFloat(element.style.getPropertyValue('--wipe-gradient-width'));
      // Hold invisible/fully lit fragments still. Insert exact crossing times
      // so the shared edge keeps its original speed, softness and syllable stops.
      const lower = offset - feather - padding;
      const upper = offset + width + padding;
      const positions = stops.map(stop => {
        // Without a pre-wipe, the feather must enter from outside the word.
        // Carry that distance through the shared path, not a short onset ramp
        // that races over the first glyphs. An existing pre-wipe keeps its path.
        let edge = stop.progress;
        if (stop.pre) edge -= feather;else if (enterFromOutside) edge -= feather * (1 - stop.progress / wipe.width);
        return {
          offset: stop.offset,
          edge
        };
      });
      const samples = [];
      positions.forEach((stop, index) => {
        const previous = positions[index - 1];
        if (previous && stop.edge > previous.edge) {
          for (const edge of [lower, upper]) {
            if (edge > previous.edge && edge < stop.edge) samples.push({
              offset: previous.offset + (edge - previous.edge) / (stop.edge - previous.edge) * (stop.offset - previous.offset),
              edge
            });
          }
        }
        samples.push(stop);
      });
      const frames = samples.map(stop => {
        const edge = AmLyrics.clamp(stop.edge, lower, upper);
        const x = wipe.rtl ? width + offset - edge - feather : -offset - wipe.width + edge;
        return {
          offset: stop.offset,
          backgroundPosition: `${x / fontSize}em 0%`
        };
      });
      const finalPosition = frames[frames.length - 1].backgroundPosition;
      // Keep pending/delayed effects unlit. A fully lit fallback can show
      // through before the native effect reaches its first painted frame.
      const unlitPosition = wipe.rtl ? `${(width + padding) / fontSize}em 0%` : `${(-wipe.width - feather - padding) / fontSize}em 0%`;
      element.style.backgroundPosition = unlitPosition;
      if (time >= wipe.end && !restore) {
        element.style.backgroundPosition = finalPosition;
        // eslint-disable-next-line no-continue
        continue;
      }
      let first = 0;
      let last = frames.length - 1;
      while (first < last && frames[first].backgroundPosition === frames[first + 1].backgroundPosition) first += 1;
      while (last > first && frames[last].backgroundPosition === frames[last - 1].backgroundPosition) last -= 1;
      if (first === last) {
        element.style.backgroundPosition = finalPosition;
        // eslint-disable-next-line no-continue
        continue;
      }
      const from = frames[first].offset;
      const range = frames[last].offset - from;
      const localFrames = range > 0 ? frames.slice(first, last + 1).map(frame => ({
        ...frame,
        offset: (frame.offset - from) / range
      })) : frames;
      const animation = element.animate(localFrames, {
        delay: range > 0 ? from * duration : 0,
        duration: range > 0 ? range * duration : duration,
        easing: 'linear',
        fill: 'forwards'
      });
      const elapsed = Math.min(time - startEpoch, range > 0 ? frames[last].offset * duration : duration);
      animation.currentTime = elapsed;
      // Anchor every fragment to one document frame. Pending play tasks can
      // otherwise start early glyphs late, then jump when playback catches up.
      const timelineTime = animation.timeline?.currentTime;
      if (typeof timelineTime === 'number') animation.startTime = timelineTime - elapsed;
      AmLyrics.wipeClocks.set(animation, startEpoch);
      wipe.animations.push(animation);
      animation.onfinish = () => {
        if (!wordWipe.prepared || !wordWipe.animations.includes(animation) || animation.playState !== 'finished') return;
        element.style.backgroundPosition = finalPosition;
        animation.cancel();
        wordWipe.settled = wordWipe.animations.every(effect => effect.playState === 'idle');
      };
    }
    if (!wipe.animations.length) wordWipe.settled = true;
  }
  static clearWordWipe(word) {
    const wipe = AmLyrics.wordWipes.get(word);
    if (!wipe || !wipe.prepared) return;
    wipe.animations.forEach(animation => animation.cancel());
    wipe.animations = [];
    wipe.prepared = false;
    wipe.settled = false;
    wipe.fragments.forEach(({
      element
    }) => {
      element.classList.remove('shared-word-wipe', 'word-wipe-rtl');
      element.style.removeProperty('background-color');
      element.style.removeProperty('background-size');
      element.style.removeProperty('background-position');
      element.style.removeProperty('animation');
    });
  }
  static getWordElementForSyllable(syllable) {
    return syllable.parentElement?.parentElement;
  }
  static getWordPreWipeKey(syllable) {
    const wordElement = AmLyrics.getWordElementForSyllable(syllable);
    return wordElement?.dataset.virtualWordId || `${syllable.getAttribute('data-start-time') || ''}:${AmLyrics.getSyllableWordIndex(syllable)}`;
  }
  static isPreWipeArmed(syllable) {
    const wordElement = AmLyrics.getWordElementForSyllable(syllable);
    const target = wordElement;
    return Boolean(target?._wordPreWipeKey === AmLyrics.getWordPreWipeKey(syllable));
  }
  static applyWordPreWipe(nextSyllable, currentTimeMs, preWipeStartMs) {
    if (AmLyrics.isPreWipeArmed(nextSyllable)) return;
    const wipe = AmLyrics.getWordWipe(nextSyllable);
    if (!wipe) return;
    AmLyrics.startWordWipe(wipe, currentTimeMs, preWipeStartMs);
    nextSyllable.classList.add('pre-highlight');
    AmLyrics.getCachedVirtualWordElements(AmLyrics.getWordElementForSyllable(nextSyllable)).forEach(element => {
      const target = element;
      target._wordPreWipeKey = AmLyrics.getWordPreWipeKey(nextSyllable);
    });
  }
  static getWordPreWipeDuration(syllable, wordSyllables = AmLyrics.getRenderedWordSyllables(syllable)) {
    const renderedSyllables = wordSyllables.length > 0 ? wordSyllables : [syllable];
    const wordElement = AmLyrics.getWordElementForSyllable(syllable);
    const charSpans = AmLyrics.getCachedVirtualWordCharSpans(wordElement, []);
    const charCount = charSpans.length || renderedSyllables.reduce((total, wordSyllable) => total + (wordSyllable.textContent || '').replace(/\s/g, '').length, 0);
    if (charCount <= 0) return 0;
    return AmLyrics.clamp(64 + charCount * 9, NEXT_WORD_PRE_WIPE_MIN_DURATION_MS, NEXT_WORD_PRE_WIPE_MAX_DURATION_MS);
  }
  static maybePreWipeNextWord(syllables, index, currentTimeMs, currentEndTimeMs) {
    const syllable = syllables[index];
    const currentWipe = AmLyrics.getWordWipe(syllable);
    const wordEndTime = currentWipe?.end ?? currentEndTimeMs;
    if (syllable.classList.contains('line-synced') || syllable.classList.contains('transliteration') || syllable.closest('.lyrics-gap')) {
      return;
    }
    const currentWordReady = syllable.classList.contains('finished') || currentTimeMs >= wordEndTime - WORD_PRE_WIPE_HANDOFF_LEAD_MS;
    if (!currentWordReady) return;
    const nextSyllable = AmLyrics.getNextWordSyllable(syllables, index);
    if (!nextSyllable || nextSyllable.classList.contains('line-synced') || nextSyllable.classList.contains('transliteration') || nextSyllable.closest('.lyrics-gap') || nextSyllable.classList.contains('highlight') || nextSyllable.classList.contains('finished')) {
      return;
    }
    const nextStartTimeMs = nextSyllable._cachedStartTime;
    if (!Number.isFinite(nextStartTimeMs)) return;
    const gapMs = nextStartTimeMs - wordEndTime;
    if (gapMs > NEXT_WORD_PRE_WIPE_MAX_GAP_MS || gapMs < 0) {
      return;
    }
    const nextWordSyllables = AmLyrics.getRenderedWordSyllables(nextSyllable);
    const preWipeSyllables = nextWordSyllables.length > 0 ? nextWordSyllables : [nextSyllable];
    const preWipeDuration = AmLyrics.getWordPreWipeDuration(nextSyllable, preWipeSyllables);
    if (preWipeDuration <= 0) return;
    const preWipeStart = Math.max(nextStartTimeMs - preWipeDuration, wordEndTime - WORD_PRE_WIPE_HANDOFF_LEAD_MS);
    if (currentTimeMs < preWipeStart || currentTimeMs >= nextStartTimeMs) {
      return;
    }
    if (AmLyrics.isPreWipeArmed(nextSyllable)) return;
    AmLyrics.applyWordPreWipe(nextSyllable, currentTimeMs, preWipeStart);
  }
  static getCachedCharSpans(element) {
    const cacheTarget = element;
    if (!cacheTarget._cachedCharSpans) {
      cacheTarget._cachedCharSpans = Array.from(element.querySelectorAll('span.char'));
    }
    return cacheTarget._cachedCharSpans;
  }
  static getCachedVirtualWordElements(wordElement) {
    if (!wordElement) return [];
    const cacheTarget = wordElement;
    if (cacheTarget._cachedVirtualWordElements) {
      return cacheTarget._cachedVirtualWordElements;
    }
    const {
      virtualWordId
    } = wordElement.dataset;
    let wordElements = [wordElement];
    if (virtualWordId && wordElement.parentElement) {
      wordElements = Array.from(wordElement.parentElement.querySelectorAll('.lyrics-word')).filter(el => el.dataset.virtualWordId === virtualWordId);
    }
    wordElements.forEach(element => {
      const target = element;
      target._cachedVirtualWordElements = wordElements;
    });
    return wordElements;
  }
  static getCachedVirtualWordCharSpans(wordElement, fallbackCharSpans) {
    if (!wordElement) return fallbackCharSpans;
    const cacheTarget = wordElement;
    if (cacheTarget._cachedVirtualWordCharSpans) {
      return cacheTarget._cachedVirtualWordCharSpans;
    }
    const wordElements = AmLyrics.getCachedVirtualWordElements(wordElement);
    const charSpans = wordElements.flatMap(word => Array.from(word.querySelectorAll('span.char')));
    const result = charSpans.length > 0 ? charSpans : fallbackCharSpans;
    wordElements.forEach(element => {
      const target = element;
      target._cachedVirtualWordCharSpans = result;
    });
    return result;
  }
  static updateSyllableAnimation(syllable, elapsedTimeMs = 0) {
    if (syllable.classList.contains('highlight')) return;
    if (!syllable.classList.contains('transliteration') && !syllable.closest('.lyrics-gap')) {
      const wipe = AmLyrics.getWordWipe(syllable);
      if (wipe) {
        AmLyrics.startWordWipe(wipe, Number(syllable.dataset.startTime) + elapsedTimeMs);
        syllable.classList.remove('pre-highlight');
        syllable.classList.add('highlight');
        return;
      }
    }
    const {
      classList
    } = syllable;
    const hadPreHighlight = classList.contains('pre-highlight');
    const isRTL = classList.contains('rtl-text') || classList.contains('wipe-rtl');
    const charSpans = AmLyrics.getCachedCharSpans(syllable);
    const isFirstSyllable = syllable.getAttribute('data-syllable-index') === '0';
    const isFirstInContainer = isFirstSyllable; // Simplified
    const isGap = syllable.closest('.lyrics-gap') !== null;
    // Get duration from data attribute
    const syllableDurationMs = parseFloat(syllable.getAttribute('data-duration') || '0') || 300;
    const charAnimationsMap = new Map();
    if (charSpans.length > 0) {
      // Every glyph receives the same clock and moving edge. Only its fixed
      // sampling offset differs. Keep explicit syllable timing for joined words.
      AmLyrics.applyWipeShape(syllable, charSpans.length);
      AmLyrics.ensureWordWipeGeometry(charSpans, charSpans.length);
      const animation = `char-word-wipe ${syllableDurationMs}ms linear ${-elapsedTimeMs}ms both`;
      charSpans.forEach(span => {
        AmLyrics.applyWipeShape(span, charSpans.length);
        charAnimationsMap.set(span, animation);
      });
    } else {
      // Syllable-level wipe for regular (non-growable) words without chars
      const wipeRatio = parseFloat(syllable.getAttribute('data-wipe-ratio') || '1');
      const wipeCharCount = AmLyrics.getVisibleCharacterCount(syllable);
      const wipeScale = AmLyrics.getLongWordWipeScale(wipeCharCount);
      const nominalVisualDuration = syllableDurationMs * wipeRatio * wipeScale;
      const visualDuration = Math.min(syllableDurationMs, nominalVisualDuration);
      AmLyrics.applyWipeShape(syllable, wipeCharCount);
      let wipeAnimation = 'wipe';
      if (hadPreHighlight) {
        wipeAnimation = isRTL ? 'wipe-from-pre-rtl' : 'wipe-from-pre';
      } else if (isFirstInContainer) {
        wipeAnimation = isRTL ? 'start-wipe-rtl' : 'start-wipe';
      } else {
        wipeAnimation = isRTL ? 'wipe-rtl' : 'wipe';
      }
      if (syllable.classList.contains('line-synced')) return;
      const currentWipeAnimation = isGap ? 'fade-gap' : wipeAnimation;
      // eslint-disable-next-line no-param-reassign
      syllable.style.animation = `${currentWipeAnimation} ${visualDuration}ms ${isGap ? 'ease-out' : 'linear'} ${-elapsedTimeMs}ms forwards`;
    }
    AmLyrics.getCachedVirtualWordElements(AmLyrics.getWordElementForSyllable(syllable)).forEach(element => {
      const target = element;
      target._wordPreWipeKey = undefined;
    });
    classList.remove('pre-highlight');
    classList.add('highlight');
    charSpans.forEach(span => AmLyrics.clearPreWipeLead(span));
    // Apply keyframe variables before assigning animation strings so the
    // first painted frame never uses fallback transform values.
    for (const [span, animationString] of charAnimationsMap.entries()) {
      span.style.removeProperty('background-color');
      span.style.animation = animationString;
    }
  }
  /**
   * Reset syllable animation state
   */
  static resetSyllable(syllable) {
    if (!syllable) return;
    // eslint-disable-next-line no-param-reassign
    syllable.style.animation = '';
    syllable.style.removeProperty('--pre-wipe-duration');
    syllable.style.removeProperty('--pre-wipe-delay');
    // Character containers stay transparent; only their glyphs paint the text.
    // eslint-disable-next-line no-param-reassign
    syllable.style.transition = 'none';
    // eslint-disable-next-line no-param-reassign
    syllable.style.backgroundColor = syllable.classList.contains('has-chars') ? 'transparent' : 'var(--word-inactive-color, var(--lyplus-text-secondary))';
    // Reset character animations — disable transition so finished chars don't slowly fade
    const charSpans = syllable.querySelectorAll('span.char');
    for (let i = 0; i < charSpans.length; i += 1) {
      const el = charSpans[i];
      el.style.animation = '';
      AmLyrics.clearCharacterMotion(el);
      el.style.transition = 'none';
      el.style.backgroundColor = 'var(--word-inactive-color, var(--lyplus-text-secondary))';
      AmLyrics.clearPreWipeLead(el);
    }
    // Immediately remove all state classes
    syllable.classList.remove('highlight', 'finished', 'pre-highlight', 'cleanup');
  }
  static resetWordAnimationState(line, preserveNormalRise = false) {
    const wordElements = line.querySelectorAll('.lyrics-word');
    wordElements.forEach(wordElement => {
      AmLyrics.clearWordWipe(wordElement);
      if (!preserveNormalRise) AmLyrics.clearNormalWordMotion(wordElement);
      if (!preserveNormalRise || wordElement.matches('.growable, .char-rise, .char-drag')) wordElement.classList.remove('word-started');
      const target = wordElement;
      target._wordPreWipeKey = undefined;
    });
  }
  /**
   * Reset all syllables in a line — batches deferred cleanup into a single rAF
   */
  static resetSyllables(line) {
    if (!line) return;
    line.classList.remove('persist-highlight');
    AmLyrics.resetWordAnimationState(line);
    // eslint-disable-next-line no-param-reassign
    line._cachedSyllableElements = null;
    const syllables = line.getElementsByClassName('lyrics-syllable');
    for (let i = 0; i < syllables.length; i += 1) {
      AmLyrics.resetSyllable(syllables[i]);
    }
    // Batch deferred style cleanup into a single rAF for all syllables in the line
    requestAnimationFrame(() => {
      for (let i = 0; i < syllables.length; i += 1) {
        const syllable = syllables[i];
        if (!syllable.classList.contains('shared-word-wipe')) syllable.style.removeProperty('background-color');
        syllable.style.removeProperty('transition');
        const chars = syllable.querySelectorAll('span.char');
        for (let j = 0; j < chars.length; j += 1) {
          const el = chars[j];
          if (!el.classList.contains('shared-word-wipe')) el.style.removeProperty('background-color');
          el.style.removeProperty('transition');
          el.style.removeProperty('will-change');
        }
      }
    });
  }
  /**
   * Retire colour and glow while existing character transforms finish.
   */
  static unfinishSyllables(line) {
    if (!line) return;
    line.classList.remove('persist-highlight');
    AmLyrics.resetWordAnimationState(line, true);
    const syllables = line.getElementsByClassName('lyrics-syllable');
    for (let i = 0; i < syllables.length; i += 1) {
      const s = syllables[i];
      s.classList.remove('highlight', 'finished', 'pre-highlight', 'cleanup');
      s.style.animation = '';
      s.style.removeProperty('--pre-wipe-duration');
      s.style.removeProperty('--pre-wipe-delay');
      s.style.removeProperty('background-color');
      s.style.removeProperty('transition');
      const chars = s.querySelectorAll('span.char');
      for (let j = 0; j < chars.length; j += 1) {
        const el = chars[j];
        el.style.animation = '';
        AmLyrics.setCharacterGlow(el, false);
        el.style.removeProperty('will-change');
        el.style.removeProperty('background-color');
        el.style.removeProperty('transition');
        el.style.removeProperty('filter');
        AmLyrics.clearPreWipeLead(el);
      }
    }
  }
  static clearNormalWordMotion(word) {
    const motion = AmLyrics.normalWordMotions.get(word);
    if (!motion) return;
    motion.animations.forEach(animation => animation.cancel());
    AmLyrics.normalWordMotions.delete(word);
    word.classList.remove('normal-word-motion');
  }
  static startNormalWordMotion(motion, elapsed) {
    const normalMotion = motion;
    if (!AmLyrics.normalWordFrames) {
      // Native whole-word spring: RVA 0x2f4efd, mass 1, stiffness 14, damping 7.
      AmLyrics.normalWordFrames = Array.from({
        length: 65
      }, (_, frame) => {
        const rise = frame === 64 ? 1 : 1 - AmLyrics.sampleSpring(1, 0, NORMAL_WORD_SPRING_DURATION_MS / 1000 * frame / 64, Math.sqrt(14), 3.5).position;
        return {
          offset: frame / 64,
          transform: `translate3d(0, calc(var(--char-rise-y) * ${rise} * var(--am-lyrics-lift)), 0)`
        };
      });
    }
    normalMotion.settled = false;
    normalMotion.animations = normalMotion.targets.map(target => {
      const animation = target.animate(AmLyrics.normalWordFrames, {
        duration: NORMAL_WORD_SPRING_DURATION_MS,
        easing: 'linear',
        fill: 'both'
      });
      animation.currentTime = elapsed;
      AmLyrics.normalRiseClocks.set(animation, normalMotion.start);
      return animation;
    });
    // The CSS holds the final lift, so finished effects need no compositor layer.
    const last = normalMotion.animations[normalMotion.animations.length - 1];
    last.onfinish = () => {
      if (normalMotion.animations[normalMotion.animations.length - 1] !== last) return;
      normalMotion.animations.forEach(animation => animation.cancel());
      normalMotion.animations = [];
      normalMotion.settled = true;
    };
  }
  static updateNormalWordMotion(word, start, time) {
    const elapsed = time - start;
    if (elapsed < 0) {
      AmLyrics.clearNormalWordMotion(word);
      return;
    }
    let motion = AmLyrics.normalWordMotions.get(word);
    if (!motion) {
      // Inline words retain wrapping; their syllables share the same spring clock.
      const targets = word.classList.contains('allow-break') ? Array.from(word.querySelectorAll('.lyrics-syllable.no-chars:not(.line-synced)')) : [word];
      if (!targets.length) return;
      motion = {
        targets,
        animations: [],
        start,
        settled: false
      };
      AmLyrics.normalWordMotions.set(word, motion);
      word.classList.add('normal-word-motion');
    }
    if (motion.settled && elapsed >= NORMAL_WORD_SPRING_DURATION_MS - 200) return;
    if (elapsed >= NORMAL_WORD_SPRING_DURATION_MS) {
      motion.animations.forEach(animation => animation.cancel());
      motion.animations = [];
      motion.settled = true;
      return;
    }
    if (!motion.animations.length) {
      AmLyrics.startNormalWordMotion(motion, elapsed);
    } else {
      for (const animation of motion.animations) {
        if (Math.abs(Number(animation.currentTime) - elapsed) > 200) {
          animation.currentTime = elapsed;
          if (animation.playState === 'finished') animation.play();
        }
      }
    }
  }
  static clearCharacterMotion(char) {
    const entry = AmLyrics.characterAnimations.get(char);
    if (!entry) return;
    entry.animation.cancel();
    if (entry.settled) {
      const target = char.parentElement?.classList.contains('char-motion') ? char.parentElement : char;
      target.style.removeProperty('transform');
    }
    AmLyrics.characterAnimations.delete(char);
    char.classList.remove('native-motion');
    AmLyrics.setCharacterGlow(char, false);
  }
  static setCharacterGlow(char, enabled) {
    char.toggleAttribute('data-glow', enabled);
    const layer = char.parentElement;
    if (!layer?.classList.contains('char-motion')) return;
    layer.toggleAttribute('data-glow', enabled);
    if (enabled) {
      layer.setAttribute('data-glyph', char.textContent || '');
      for (const propertyName of ['--char-glow-max', '--char-glow-duration', '--char-glow-delay']) layer.style.setProperty(propertyName, char.style.getPropertyValue(propertyName));
    }
  }
  static resumeCharacterMotion(char, elapsed) {
    const entry = AmLyrics.characterAnimations.get(char);
    if (!entry?.settled) return;
    const target = char.parentElement?.classList.contains('char-motion') ? char.parentElement : char;
    target.style.removeProperty('transform');
    entry.settled = false;
    entry.animation.play();
    entry.animation.currentTime = elapsed;
    if (Number(char.style.getPropertyValue('--char-glow-max')) > 0) {
      char.style.setProperty('--char-glow-delay', `${Number(entry.animation.effect?.getTiming().delay) - elapsed}ms`);
      AmLyrics.setCharacterGlow(char, true);
      entry.glowEpoch = elapsed;
    }
  }
  static updateCharacterMotion(line, timeMs) {
    // Timing VM RVA 0x34722d0, emphasis VM 0x34723b0; CJK rise spring
    // mass 1, stiffness 14, damping 7 in 0x2f4e46 / 0x2f510b.
    let syllables = AmLyrics.motionSyllables.get(line);
    if (!syllables) {
      const seen = new Set();
      syllables = Array.from(line.querySelectorAll('.lyrics-syllable.has-chars')).filter(syllable => {
        const track = syllable.closest('[data-bg-suspended], [data-bg-carried]');
        if (track && track !== line) return false;
        const word = AmLyrics.getWordElementForSyllable(syllable);
        // CJK has no reliable whitespace word boundaries. Keep each timed
        // segment's clock; only non-CJK split words share a motion clock.
        const key = word?.classList.contains('char-rise') ? syllable : AmLyrics.getCachedVirtualWordElements(word)[0] || syllable;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      AmLyrics.motionSyllables.set(line, syllables);
    }
    syllables.forEach(syllable => {
      let parameters = AmLyrics.motionParameters.get(syllable);
      if (!parameters) {
        const word = AmLyrics.getWordElementForSyllable(syllable);
        const cjk = word?.classList.contains('char-rise') ?? false;
        const localChars = AmLyrics.getCachedCharSpans(syllable);
        const chars = cjk ? localChars : AmLyrics.getCachedVirtualWordCharSpans(word, localChars);
        const start = Number(cjk ? syllable.dataset.startTime : word?.dataset.virtualWordStart ?? syllable.dataset.startTime);
        const end = Number(cjk ? syllable.dataset.endTime : word?.dataset.virtualWordEnd ?? syllable.dataset.endTime);
        parameters = {
          chars,
          duration: Math.max(0.001, (end - start) / 1000),
          start,
          cjk
        };
        AmLyrics.motionParameters.set(syllable, parameters);
      }
      const {
        chars,
        duration,
        start,
        cjk
      } = parameters;
      const count = chars.length;
      if (!count) return;
      const elapsed = timeMs - start;
      const staggerMs = duration * 1000 / count * (cjk ? 0.4 : 0.35);
      const delayMs = cjk ? Math.min(staggerMs, 50, 200 / count) : Math.min(staggerMs, 350);
      const hold = 2 * duration / count;
      const response = Math.min(3, duration);
      const emphasis = cjk ? 0 : AmLyrics.clamp(duration - 1, 0, 1);
      const glow = cjk ? 0 : 0.45 * AmLyrics.clamp((duration - 1) / 0.5, 0, 1);
      const spanDuration = Math.max(hold + response * 2, cjk ? 3 : 0);
      chars.forEach((char, index) => {
        const startDelay = (index + 1) * delayMs;
        // Schedule before the stagger starts so host timestamp updates cannot
        // delay its first frames. Forward fill leaves the waiting glyph untouched.
        if (elapsed < 0) {
          AmLyrics.clearCharacterMotion(char);
          return;
        }
        const end = spanDuration * 1000 + startDelay;
        const key = parameters;
        let entry = AmLyrics.characterAnimations.get(char);
        if (!entry || entry.key !== key) {
          AmLyrics.clearCharacterMotion(char);
          const frameKey = `${duration}:${count}:${emphasis ? index : 0}:${cjk}`;
          let frames = AmLyrics.characterFrames.get(frameKey);
          if (!frames) {
            frames = Array.from({
              length: 61
            }, (_, frame) => {
              const time = spanDuration * frame / 60;
              const finished = frame === 60;
              let rise = cjk ? 1 - AmLyrics.sampleSpring(1, 0, time, Math.sqrt(14), 3.5).position : AmLyrics.springProgress(time, response);
              if (finished) rise = 1;
              const envelope = finished ? 0 : AmLyrics.springProgress(time, response) * (1 - AmLyrics.springProgress(time - hold, response));
              const x = (index - (count - 1) / 2) * 0.5 * 0.1 * emphasis * envelope;
              const lift = 2.5 * emphasis * envelope;
              return {
                offset: frame / 60,
                transform: `translate(calc(${x}em * var(--am-lyrics-lift)), calc((var(--char-rise-y) * ${rise} - ${lift}px) * var(--am-lyrics-lift))) scale(${1 + 0.1 * emphasis * envelope})`
              };
            });
            if (AmLyrics.characterFrames.size >= 64) {
              AmLyrics.characterFrames.delete(AmLyrics.characterFrames.keys().next().value);
            }
            AmLyrics.characterFrames.set(frameKey, frames);
          }
          if (glow) {
            char.setAttribute('data-glyph', char.textContent || '');
            char.style.setProperty('--char-glow-max', `${glow}`);
            char.style.setProperty('--char-glow-duration', `${spanDuration * 1000}ms`);
            char.style.setProperty('--char-glow-delay', `${startDelay - elapsed}ms`);
            AmLyrics.setCharacterGlow(char, true);
          }
          char.classList.add('native-motion');
          // Transform a separate wrapper. WebKit can expose rectangular clip
          // edges when the gradient-clipped glyph itself is transformed.
          const motionTarget = char.parentElement?.classList.contains('char-motion') ? char.parentElement : char;
          const animation = motionTarget.animate(frames, {
            duration: spanDuration * 1000,
            delay: startDelay,
            fill: 'forwards',
            easing: 'linear'
          });
          const timelineTime = animation.timeline?.currentTime;
          if (typeof timelineTime === 'number') animation.startTime = timelineTime - Math.min(elapsed, end);else animation.currentTime = Math.min(elapsed, end);
          entry = {
            animation,
            start,
            end,
            key,
            glowEpoch: elapsed,
            settled: false,
            finalTransform: frames[frames.length - 1].transform
          };
          AmLyrics.characterAnimations.set(char, entry);
          const motion = entry;
          animation.onfinish = () => {
            if (AmLyrics.characterAnimations.get(char) !== motion || animation.playState !== 'finished') return;
            motionTarget.style.transform = motion.finalTransform;
            motion.settled = true;
            AmLyrics.setCharacterGlow(char, false);
            animation.cancel();
          };
        } else if (entry.settled) {
          // Match the drift tolerance above: a completed rise must not restart
          // just because playback trails the native clock by a few frames.
          if (elapsed < entry.end - 200) AmLyrics.resumeCharacterMotion(char, elapsed);
        } else if (Math.abs(Number(entry.animation.currentTime) - Math.min(elapsed, entry.end)) > 200) {
          // Correct seeks/drift, not every playback tick: repeated currentTime
          // writes pin compositor motion to the host's timestamp frequency.
          entry.animation.currentTime = Math.min(elapsed, entry.end);
          if (glow) {
            const glowLayer = char.parentElement?.classList.contains('char-motion') ? char.parentElement : char;
            for (const effect of glowLayer.getAnimations()) {
              if ('animationName' in effect && effect.animationName === 'char-glow') {
                effect.currentTime = elapsed - entry.glowEpoch;
                if (elapsed < entry.end) effect.play();
              }
            }
          }
          if (elapsed < entry.end && entry.animation.playState === 'finished') entry.animation.play();
        }
      });
    });
  }
  static springProgress(time, response) {
    if (time <= 0) return 0;
    // Unit-mass critically damped spring, omega = 2 pi / response.
    // Native constructor: RVA 0x1559b0. Exact step response, no frame integration.
    const phase = 2 * Math.PI * time / Math.max(0.001, response);
    return 1 - (1 + phase) * Math.exp(-phase);
  }
  static seekLineWipes(line, time) {
    for (const word of AmLyrics.motionWords.get(line) || []) {
      if (word.wipe && time < word.wipe.end && (word.wipe.settled || word.wipe.animations.some(animation => animation.playState === 'idle'))) AmLyrics.startWordWipe(word.wipe, time, word.wipe.epoch, true);
    }
    line.getAnimations({
      subtree: true
    }).forEach(animation => {
      const epoch = AmLyrics.wipeClocks.get(animation);
      if (epoch !== undefined) {
        const timeline = animation;
        const end = Number(animation.effect?.getComputedTiming().endTime);
        const elapsed = time - epoch;
        timeline.currentTime = Math.min(elapsed, end);
        if (elapsed < end && animation.playState !== 'running') {
          animation.play();
          timeline.currentTime = elapsed;
        }
        return;
      }
      if (!('animationName' in animation) || !String(animation.animationName).includes('wipe')) return;
      const effect = animation.effect;
      const syllable = effect.target?.closest('.lyrics-syllable');
      if (!syllable) return;
      const elapsed = time - Number(syllable.dataset.startTime) + Number(effect.getTiming().delay);
      const end = Number(effect.getComputedTiming().endTime);
      const timeline = animation;
      timeline.currentTime = Math.min(elapsed, end);
      if (elapsed < end && animation.playState !== 'running') {
        animation.play();
        timeline.currentTime = elapsed;
      }
    });
  }
  static updateSyllablesForLine(line, currentTimeMs, reduceMotion = false) {
    let words = AmLyrics.motionWords.get(line);
    if (!words) {
      words = Array.from(line.querySelectorAll('.lyrics-word[data-virtual-word-start]')).filter(element => {
        const track = element.closest('[data-bg-suspended], [data-bg-carried]');
        return !track || track === line;
      }).map(element => {
        const syllable = element.querySelector('.lyrics-syllable');
        return {
          element,
          start: Number(element.dataset.virtualWordStart),
          wipe: syllable ? AmLyrics.getWordWipe(syllable) : undefined,
          normal: Boolean(syllable && !syllable.matches('.has-chars, .line-synced') && !element.matches('.growable, .char-rise, .char-drag'))
        };
      });
      AmLyrics.motionWords.set(line, words);
    }
    words.forEach(({
      element,
      start,
      wipe,
      normal
    }) => {
      const started = currentTimeMs >= start;
      if (element.classList.contains('word-started') !== started) element.classList.toggle('word-started', started);
      if (normal && !reduceMotion) AmLyrics.updateNormalWordMotion(element, start, currentTimeMs);
      // Native delays preserve the opening frames between sparse player ticks.
      // Only prepare the nearby words, keeping long lines cheap to animate.
      if (wipe && currentTimeMs >= wipe.epoch - WORD_WIPE_LOOKAHEAD_MS) AmLyrics.startWordWipe(wipe, currentTimeMs);
    });
    if (!reduceMotion) AmLyrics.updateCharacterMotion(line, currentTimeMs);
    // DOM cache: avoid querySelectorAll on every frame
    let syllables = line._cachedSyllableElements;
    if (!syllables) {
      syllables = Array.from(line.querySelectorAll('.lyrics-syllable')).filter(syllable => {
        const track = syllable.closest('[data-bg-suspended], [data-bg-carried]');
        return !track || track === line;
      });
      for (let i = 0; i < syllables.length; i += 1) {
        const syllable = syllables[i];
        syllable._cachedStartTime = parseFloat(syllable.getAttribute('data-start-time') || '0');
        syllable._cachedEndTime = parseFloat(syllable.getAttribute('data-end-time') || '0');
      }
      // eslint-disable-next-line no-param-reassign
      line._cachedSyllableElements = syllables;
    }
    for (let i = 0; i < syllables.length; i += 1) {
      const syllable = syllables[i];
      const startTime = syllable._cachedStartTime;
      const endTime = syllable._cachedEndTime;
      if (Number.isFinite(startTime) && Number.isFinite(endTime)) {
        const {
          classList
        } = syllable;
        const hasHighlight = classList.contains('highlight');
        const hasFinished = classList.contains('finished');
        const hasPreHighlight = classList.contains('pre-highlight');
        const hasActiveState = hasHighlight || hasFinished || hasPreHighlight;
        // Early exit check
        if (!(currentTimeMs < startTime - 1000 && !hasActiveState)) {
          let preHighlightReset = false;
          // Before the syllable starts, pre-highlight only belongs beside a
          // previous active word. Once the syllable starts, updateSyllableAnimation
          // consumes the class so the actual wipe can continue from the pre-wipe
          // pose instead of restarting from the beginning.
          if (hasPreHighlight && currentTimeMs < startTime) {
            const prevSyllable = AmLyrics.getPreviousNonTransliterationSyllable(syllables, i);
            const previousCarriesHighlight = prevSyllable?.classList.contains('highlight') || prevSyllable?.classList.contains('finished');
            const preview = AmLyrics.getWordWipe(syllable);
            if (!previousCarriesHighlight || preview && currentTimeMs < preview.epoch) {
              AmLyrics.clearPreHighlight(syllable);
              preHighlightReset = true;
            }
          }
          if (!preHighlightReset) {
            if (currentTimeMs >= startTime && currentTimeMs <= endTime) {
              // Currently active
              if (!hasHighlight) {
                AmLyrics.updateSyllableAnimation(syllable, currentTimeMs - startTime);
              }
              if (hasFinished) {
                classList.remove('finished');
              }
            } else if (currentTimeMs > endTime) {
              // Finished
              if (!hasFinished) {
                if (!hasHighlight) {
                  AmLyrics.updateSyllableAnimation(syllable, currentTimeMs - startTime);
                }
                classList.add('finished');
                // The shared edge owns the fill, including joined syllables.
                // Keep its dim base underneath as individual segments finish.
              }
            } else if (hasHighlight || hasFinished) {
              // Not yet started
              const wipe = AmLyrics.getWordWipe(syllable);
              if (wipe && currentTimeMs >= wipe.start) {
                classList.remove('highlight', 'finished', 'cleanup');
              } else {
                const word = AmLyrics.getWordElementForSyllable(syllable);
                if (word) AmLyrics.clearWordWipe(word);
                AmLyrics.resetSyllable(syllable);
              }
            }
            AmLyrics.maybePreWipeNextWord(syllables, i, currentTimeMs, endTime);
          }
        }
      }
    }
  }
  generateLRC() {
    if (!this.lyrics) return '';
    let lrc = '';
    // Add metadata if available
    if (this.songTitle) lrc += `[ti:${this.songTitle}]\n`;
    if (this.songArtist) lrc += `[ar:${this.songArtist}]\n`;
    if (this.songAlbum) lrc += `[al:${this.songAlbum}]\n`;
    if (this.lyricsSource) lrc += `[re:${this.lyricsSource}]\n`;
    for (const line of this.lyrics) {
      if (line.text && line.text.length > 0) {
        const timestamp = AmLyrics.formatTimestampLRC(line.timestamp);
        // Construct line text from syllables
        const lineText = line.text.map(s => s.text).join('').trim();
        lrc += `[${timestamp}]${lineText}\n`;
      }
    }
    return lrc;
  }
  generatePlain() {
    if (!this.lyrics) return '';
    return this.lyrics.flatMap(line => {
      const main = line.text.map(syllable => syllable.text).join('').trim();
      const backing = (line.backgroundText || []).map(syllable => syllable.text).join('').trim();
      // eslint-disable-next-line no-nested-ternary
      const background = backing ? backing.startsWith('(') && backing.endsWith(')') ? backing : `(${backing})` : '';
      return (AmLyrics.getBackgroundTextPlacement(line) === 'before' ? [background, main] : [main, background]).filter(Boolean);
    }).join('\n');
  }
  generateTTML() {
    if (!this.lyrics) return '';
    // Basic TTML structure
    let ttml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    ttml += '<tt xmlns="http://www.w3.org/ns/ttml" xmlns:itunes="http://music.apple.com/lyrics">\n';
    ttml += '  <body>\n';
    let currentPart;
    for (let i = 0; i < this.lyrics.length; i += 1) {
      const line = this.lyrics[i];
      const part = line.songPart;
      // If part changed (or first line), start new div
      if (part !== currentPart || i === 0) {
        if (i > 0) {
          ttml += '    </div>\n';
        }
        currentPart = part;
        if (currentPart) {
          ttml += `    <div itunes:song-part="${currentPart}">\n`;
        } else {
          ttml += '    <div>\n';
        }
      }
      // For TTML, we can represent syllables as spans if word-synced
      const begin = AmLyrics.formatTimestampTTML(line.timestamp);
      const end = AmLyrics.formatTimestampTTML(line.endtime);
      ttml += `      <p begin="${begin}" end="${end}">\n`;
      for (const word of line.text) {
        const wBegin = AmLyrics.formatTimestampTTML(word.timestamp);
        const wEnd = AmLyrics.formatTimestampTTML(word.endtime);
        // Escape special characters in text
        const text = word.text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        ttml += `        <span begin="${wBegin}" end="${wEnd}">${text}</span>\n`;
      }
      ttml += '      </p>\n';
    }
    if (this.lyrics.length > 0) {
      ttml += '    </div>\n';
    }
    ttml += '  </body>\n';
    ttml += '</tt>';
    return ttml;
  }
  static formatTimestampLRC(ms) {
    const totalSeconds = ms / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const hundredths = Math.floor(ms % 1000 / 10);
    const pad = n => n.toString().padStart(2, '0');
    return `${pad(minutes)}:${pad(seconds)}.${pad(hundredths)}`;
  }
  static formatTimestampTTML(ms) {
    // TTML standard format: HH:MM:SS.mmm
    const totalSeconds = ms / 1000;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor(totalSeconds % 3600 / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const milliseconds = Math.floor(ms % 1000);
    const pad = (n, width = 2) => n.toString().padStart(width, '0');
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}.${pad(milliseconds, 3)}`;
  }
  downloadLyrics() {
    if (!this.lyrics || this.lyrics.length === 0) return;
    // Determine format: TTML if ANY line is word-synced, else LRC
    const isWordSynced = this.lyrics.some(l => l.isWordSynced !== false);
    let content = '';
    let extension = this.downloadFormat;
    if (extension === 'auto') {
      extension = isWordSynced ? 'ttml' : 'lrc';
    }
    let mimeType = '';
    if (extension === 'ttml') {
      const source = this.availableSources[this.currentSourceIndex];
      content = source?.source === this.lyricsSource && source.originalTTML || this.generateTTML();
      mimeType = 'application/xml';
    } else if (extension === 'plain') {
      content = this.generatePlain();
      extension = 'txt';
      mimeType = 'text/plain;charset=utf-8';
    } else {
      content = this.generateLRC();
      mimeType = 'text/plain';
    }
    if (!content) return;
    const blob = new Blob([content], {
      type: mimeType
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const filename = this.songTitle ? `${this.songTitle}${this.songArtist ? ` - ${this.songArtist}` : ''}.${extension}` : `lyrics.${extension}`;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  renderSourceDetails() {
    const source = this.availableSources[this.currentSourceIndex];
    if (!source) return E;
    if (source.byModel) return x`<span class="source-badge model-generated"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-sparkles preview-icon"><path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"/><path d="M20 2v4"/><path d="M22 4h-4"/><circle cx="4" cy="20" r="2"/></svg>Model-generated</span>`;
    if (!source.source.startsWith('Unison')) return E;
    const author = source.contributors?.[0];
    return x` ${author ? x`<span class="source-badge unison-author">by <a href="${author.url || E}" target="_blank" rel="noopener noreferrer">${author.username}</a></span>` : E} ${source.confidence ? x`<span class="source-badge unison-confidence" title="Unison community confidence">${source.confidence} confidence</span>` : E} `;
  }
  renderContributors() {
    if (this.lyricsSource?.startsWith('Unison')) return E;
    const people = this.availableSources[this.currentSourceIndex]?.contributors;
    if (!people?.length) return E;
    const portrait = person => x` <span aria-hidden="true">${Array.from(person.username)[0]}</span> ${person.avatar ? x`<img src="${person.avatar}" alt="" width="32" height="32" loading="lazy" decoding="async" @error="${event => {
      const image = event.currentTarget;
      image.hidden = true;
    }}" @load="${event => {
      const image = event.currentTarget;
      image.hidden = false;
    }}">` : E} `;
    return x`<div class="contributor-stack"> ${people.slice(0, 3).map(person => x`<a class="contributor-avatar" href="${person.url || E}" target="_blank" rel="noopener noreferrer" tabindex="0" aria-label="${`${person.username} — ${person.roles.join(', ')}`}">${portrait(person)}<span class="contributor-tooltip" aria-hidden="true">${person.username} · ${person.roles.join(', ')}</span></a>`)} ${people.length > 3 ? x`<details class="contributor-overflow"> <summary aria-label="${`${people.length - 3} more contributors`}"> +${people.length - 3} </summary> <div class="contributor-menu"> ${people.slice(3).map(person => x`<a href="${person.url || E}" target="_blank" rel="noopener noreferrer" tabindex="0"><span class="contributor-avatar">${portrait(person)}</span><span>${person.username}<br>${person.roles.join(', ')}</span></a>`)} </div> </details>` : E} </div>`;
  }
  static renderTimedRomanization(groups, trackId) {
    const hasReading = syllable => syllable.romanizedText?.trim() && syllable.romanizedText.trim() !== syllable.text.trim();
    if (!groups.some(group => group.some(hasReading))) return E;
    let previousReading;
    return x`<span class="lyrics-timed-romanization" dir="ltr">${groups.map((group, groupIndex) => {
      const readings = group.filter(hasReading);
      if (!readings.length) return E;
      const wordSpace = previousReading !== undefined && !/\s$/.test(previousReading) && !/^\s/.test(readings[0].romanizedText || '');
      previousReading = readings[readings.length - 1].romanizedText;
      return x`${wordSpace ? ' ' : E}<span class="lyrics-word" data-virtual-word-id="${trackId}:reading:${groupIndex}" data-virtual-word-start="${Math.min(...group.map(s => s.timestamp))}" data-virtual-word-end="${Math.max(...group.map(s => s.endtime))}">${readings.map(syllable => x`<span class="lyrics-syllable-wrap"><span dir="ltr" class="lyrics-syllable transliteration no-chars" data-start-time="${syllable.timestamp}" data-end-time="${syllable.endtime}" data-duration="${syllable.endtime - syllable.timestamp}" data-syllable-index="0" data-word-index="${groupIndex}" data-wipe-ratio="1">${syllable.romanizedText}</span></span>`)}</span>`;
    })}</span>`;
  }
  render() {
    if (this.fontFamily) {
      this.style.fontFamily = this.fontFamily;
    }
    // Set both old internal CSS variables (for backward compatibility)
    // and new public CSS variables (which take precedence)
    this.style.setProperty('--highlight-color', this.highlightColor);
    const sourceLabel = this.lyricsSource ?? 'Unavailable';
    const isUnsynced = this.cachedIsUnsynced;
    const hasLeftAlignedLines = this.lyrics?.some(line => !AmLyrics.isOppositeAgent(line));
    const hasRightAlignedLines = this.lyrics?.some(line => AmLyrics.isOppositeAgent(line));
    const hasDuetLines = hasLeftAlignedLines && hasRightAlignedLines;
    const renderContent = () => {
      if (this.isLoading) {
        // Render stylized skeleton lines
        return x` <div class="skeleton-line"></div> <div class="skeleton-line"></div> <div class="skeleton-line"></div> <div class="skeleton-line"></div> <div class="skeleton-line"></div> <div class="skeleton-line"></div> <div class="skeleton-line"></div> `;
      }
      if (!this.lyrics || this.lyrics.length === 0) {
        return x`<div class="no-lyrics">No lyrics found.</div>`;
      }
      // Build a lookup map of ALL gaps so they are always in the DOM
      const allGaps = this.findAllInstrumentalGaps();
      const gapByIndex = new Map(allGaps.map(g => [g.insertBeforeIndex, g]));
      return this.lyrics.map((line, lineIndex) => {
        const lineId = `lyrics-line-${lineIndex}`;
        // Calculate line timing
        const lineStartTime = line.text[0]?.timestamp || 0;
        const lineEndTime = line.text[line.text.length - 1]?.endtime || 0;
        // Always render background vocals in the DOM so the syllable cache
        // includes them and the wipe effect applies correctly.
        const hasBackground = line.backgroundText && line.backgroundText.length > 0;
        const bgPlacement = hasBackground ? AmLyrics.getBackgroundTextPlacement(line) : 'after';
        const backingWords = [];
        const backingGroups = [];
        const backing = line.backgroundText || [];
        for (let first = 0; first < backing.length;) {
          let last = first;
          while (last + 1 < backing.length && !/\s$/.test(backing[last].text) && !/^\s/.test(backing[last + 1].text)) last += 1;
          const group = backing.slice(first, last + 1);
          backingGroups.push(group);
          const word = {
            text: group.map(syllable => syllable.text).join(''),
            start: backing[first].timestamp,
            end: backing[last].endtime
          };
          for (let index = first; index <= last; index += 1) backingWords[index] = word;
          first = last + 1;
        }
        const lineIsRTL = this.cachedLineData?.[lineIndex]?.lineIsRTL ?? false;
        const separateRomanization = lineIsRTL && this.showRomanization && !AmLyrics.isLineSyncedLine(line);
        // Create background vocals container (with romanization support)
        const backgroundVocalElement = hasBackground ? x`<p class="background-vocal-container background-${bgPlacement}"> <span class="background-vocal-wrap"> ${line.backgroundText.map((syllable, syllableIndex) => {
          const startTimeMs = syllable.timestamp;
          const endTimeMs = syllable.endtime;
          const durationMs = endTimeMs - startTimeMs;
          const bgRomanizedText = this.showRomanization && !separateRomanization && syllable.romanizedText && syllable.romanizedText.trim() !== syllable.text.trim() ? x`<span dir="auto" class="lyrics-syllable transliteration no-chars ${lineIsRTL ? 'wipe-rtl' : ''} ${syllable.lineSynced ? 'line-synced' : ''}" data-start-time="${startTimeMs}" data-end-time="${endTimeMs}" data-duration="${durationMs}" data-syllable-index="0" data-wipe-ratio="1">${syllable.romanizedText}</span>` : '';
          const backingWord = backingWords[syllableIndex];
          const bgChars = !syllable.lineSynced && AmLyrics.characterMotionMode(backingWord.text, backingWord.end - backingWord.start, true) !== 'none' ? Array.from(syllable.text.replace(/\s/g, '')) : [];
          let bgCharIndex = 0;
          return x`<span class="lyrics-word${bgChars.length ? ' char-rise' : ''}" data-virtual-word-id="bg-${lineIndex}-${backingWord.start}" data-virtual-word-start="${backingWord.start}" data-virtual-word-end="${backingWord.end}"><span class="lyrics-syllable-wrap${bgRomanizedText ? ' has-transliteration' : ''}"><span class="lyrics-syllable${lineIsRTL ? ' rtl-text' : ''} ${bgChars.length ? 'has-chars' : 'no-chars'}${syllable.lineSynced ? ' line-synced' : ''}" data-start-time="${startTimeMs}" data-end-time="${endTimeMs}" data-duration="${durationMs}" data-syllable-index="0" data-word-index="${syllableIndex}" data-word-length="${syllable.text.replace(/\s/g, '').length}" data-wipe-ratio="1">${bgChars.length ? Array.from(syllable.text).map(char => {
            if (/\s/.test(char)) return char;
            const index = bgCharIndex;
            bgCharIndex += 1;
            return x`<span class="char-motion"><span class="char" data-syllable-char-index="${index}" data-wipe-start="${index / bgChars.length}" data-wipe-duration="${1 / bgChars.length}">${char}</span></span>`;
          }) : syllable.text}</span>${bgRomanizedText}</span></span>`;
        })} ${separateRomanization ? AmLyrics.renderTimedRomanization(backingGroups, `bg-${lineIndex}`) : E} </span> </p>` : '';
        // Background vocals share the same line.translation and line.romanizedText
        // as the main vocal, so we intentionally do NOT render a separate
        // translation/romanization block for background — it would just duplicate
        // the main line's text.
        const lineData = this.cachedLineData?.[lineIndex];
        const wordGroups = lineData?.wordGroups ?? [];
        const groupGrowable = lineData?.groupGrowable ?? [];
        const groupGlowing = lineData?.groupGlowing ?? [];
        const groupCharRise = lineData?.groupCharRise ?? [];
        const groupCharDrag = lineData?.groupCharDrag ?? [];
        const vwFullDuration = lineData?.vwFullDuration ?? [];
        const vwCharOffset = lineData?.vwCharOffset ?? [];
        const vwStartMs = lineData?.vwStartMs ?? [];
        const vwEndMs = lineData?.vwEndMs ?? [];
        const mainVocalElement = x`<p class="main-vocal-container ${lineIsRTL ? 'rtl-text' : ''}"> ${wordGroups.map((group, groupIdx) => {
          const isGrowable = groupGrowable[groupIdx];
          const isGlowing = groupGlowing[groupIdx];
          const isCharRise = groupCharRise[groupIdx];
          const isCharDrag = groupCharDrag[groupIdx];
          const isAnimatedByChar = isGrowable || isCharRise || isCharDrag;
          const groupLineSynced = line.isWordSynced === false || group.some(s => s.lineSynced);
          const wordDuration = isAnimatedByChar ? vwFullDuration[groupIdx] : 0;
          const groupCharOffset = isAnimatedByChar ? vwCharOffset[groupIdx] : 0;
          const virtualWordId = `${lineIndex}:${vwStartMs[groupIdx]}:${vwEndMs[groupIdx]}`;
          const virtualWordStart = vwStartMs[groupIdx];
          const virtualWordEnd = vwEndMs[groupIdx];
          let sylCharAccumulator = 0;
          const groupText = group.map(s => s.text).join('');
          const visibleWordLength = groupText.replace(/\s/g, '').length;
          const shouldAllowBreak = groupText.trim().length >= 16 || /[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/.test(groupText);
          return x`<span class="lyrics-word${isGrowable ? ' growable' : ''}${isCharRise ? ' char-rise' : ''}${isCharDrag ? ' char-drag' : ''}${isGlowing ? ' glowing' : ''}${shouldAllowBreak ? ' allow-break' : ''}" data-virtual-word-id="${virtualWordId}" data-virtual-word-start="${virtualWordStart}" data-virtual-word-end="${virtualWordEnd}">${group.map((syllable, sylIdx) => {
            const startTimeMs = syllable.timestamp;
            const endTimeMs = syllable.endtime;
            const durationMs = endTimeMs - startTimeMs;
            const text = syllable.text || '';
            const romanizedText = this.showRomanization && !separateRomanization && syllable.romanizedText && syllable.romanizedText.trim() !== syllable.text.trim() ? x`<span dir="auto" class="lyrics-syllable transliteration no-chars ${lineIsRTL ? 'wipe-rtl' : ''} ${groupLineSynced ? 'line-synced' : ''}" data-start-time="${startTimeMs}" data-end-time="${endTimeMs}" data-duration="${durationMs}" data-syllable-index="0" data-wipe-ratio="1">${syllable.romanizedText}</span>` : '';
            const animateSyllable = isAnimatedByChar && !groupLineSynced;
            let syllableContent = text;
            if (animateSyllable) {
              syllableContent = x`${Array.from(text).map(char => {
                if (char === ' ') return ' ';
                const charIndexInsideWord = groupCharOffset + sylCharAccumulator;
                sylCharAccumulator += 1;
                return x`<span class="char-motion"><span class="char" data-char-index="${charIndexInsideWord}" data-syllable-char-index="${charIndexInsideWord}">${char}</span></span>`;
              })}`;
            }
            return x`<span class="lyrics-syllable-wrap${romanizedText ? ' has-transliteration' : ''}"><span class="lyrics-syllable${lineIsRTL ? ' rtl-text' : ''}${groupLineSynced ? ' line-synced' : ''}${animateSyllable ? ' has-chars' : ' no-chars'}" data-start-time="${startTimeMs}" data-end-time="${endTimeMs}" data-duration="${durationMs}" data-word-duration="${wordDuration}" data-syllable-index="${sylIdx}" data-word-index="${groupIdx}" data-word-length="${visibleWordLength}" data-wipe-ratio="1">${syllableContent}</span>${romanizedText}</span>`;
          })}</span>`;
        })} ${separateRomanization ? AmLyrics.renderTimedRomanization(wordGroups, `${lineIndex}`) : E} </p>`;
        // Translation container (if enabled)
        // Hide translation if it matches the original line text
        const fullLineText = line.text.map(s => s.text).join('').trim();
        const translationElement = this.showTranslation && line.translation && line.translation.trim() !== fullLineText ? x`<div class="lyrics-translation-container"> ${line.translation} </div>` : '';
        // Line-synced romanization (fallback if no word-level romanization)
        // Hide if the romanized text matches the original line text
        const lineRomanizationElement = this.showRomanization && line.romanizedText && !line.text.some(s => s.romanizedText) && line.romanizedText.trim() !== fullLineText ? x`<div class="lyrics-romanization-container" dir="auto"> ${line.romanizedText} </div>` : '';
        // Check for instrumental gap before this line
        let maybeInstrumentalBlock = null;
        const gapForLine = gapByIndex.get(lineIndex);
        if (gapForLine) {
          const gapDuration = gapForLine.gapEnd - gapForLine.gapStart;
          // Calculate dot timing for fill-up animation (3 dots)
          const dotDuration = gapDuration / 3;
          // Gap starts without 'active' — _onTimeChanged toggles it imperatively
          maybeInstrumentalBlock = x`<div id="gap-${lineIndex}" class="lyrics-line lyrics-gap" aria-hidden="true" data-start-time="${gapForLine.gapStart}" data-end-time="${gapForLine.gapEnd}"> <p class="main-vocal-container"> <span class="lyrics-word"><span class="lyrics-syllable-wrap"><span class="lyrics-syllable" data-start-time="${gapForLine.gapStart}" data-end-time="${gapForLine.gapStart + dotDuration}" data-duration="${dotDuration}" data-wipe-ratio="1" data-syllable-index="0"></span></span><span class="lyrics-syllable-wrap"><span class="lyrics-syllable" data-start-time="${gapForLine.gapStart + dotDuration}" data-end-time="${gapForLine.gapStart + dotDuration * 2}" data-duration="${dotDuration}" data-wipe-ratio="1" data-syllable-index="1"></span></span><span class="lyrics-syllable-wrap"><span class="lyrics-syllable" data-start-time="${gapForLine.gapStart + dotDuration * 2}" data-end-time="${gapForLine.gapEnd}" data-duration="${dotDuration}" data-wipe-ratio="1" data-syllable-index="2"></span></span></span> </p> </div>`;
        }
        return x` ${maybeInstrumentalBlock} <div id="${lineId}" class="lyrics-line ${AmLyrics.isOppositeAgent(line) ? 'singer-right' : 'singer-left'} ${lineIsRTL ? 'rtl-text' : ''} ${hasBackground ? `bg-${bgPlacement}` : ''}" role="${isUnsynced ? 'paragraph' : 'button'}" aria-label="${isUnsynced ? fullLineText : `Seek to lyric: ${fullLineText}`}" data-start-time="${lineStartTime}" data-end-time="${lineEndTime}" @click="${() => this.handleLineClick(line)}" tabindex="${isUnsynced ? -1 : 0}" @keydown="${e => {
          if (e.key === 'Enter' || e.key === ' ') {
            this.handleLineClick(line);
          }
        }}"> <div class="lyrics-line-container ${lineIsRTL ? 'rtl-text' : ''}"> ${bgPlacement === 'before' ? backgroundVocalElement : ''} ${mainVocalElement} ${bgPlacement === 'after' ? backgroundVocalElement : ''} ${lineRomanizationElement} ${translationElement} </div> </div> `;
      });
    };
    return x` <div class="lyrics-container ${isUnsynced ? 'is-unsynced' : ''} ${!isUnsynced && !this.noBlur ? 'blur-inactive-enabled' : ''} ${hasDuetLines ? 'has-duet-lines' : ''} ${this.shouldReduceMotion ? 'reduced-motion' : ''}" role="region" aria-label="${isUnsynced ? 'Lyrics' : 'Synced lyrics'}"> ${!this.isLoading && this.lyrics && this.lyrics.length > 0 ? x` <div class="lyrics-header"> <div class="header-controls"> <button type="button" class="download-button ${this.showRomanization ? 'active' : ''}" @click="${this.toggleRomanization}" title="Toggle Romanization" aria-label="Toggle romanization" aria-pressed="${this.showRomanization}"> <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-speech-icon lucide-speech"> <path d="M8.8 20v-4.1l1.9.2a2.3 2.3 0 0 0 2.164-2.1V8.3A5.37 5.37 0 0 0 2 8.25c0 2.8.656 3.054 1 4.55a5.77 5.77 0 0 1 .029 2.758L2 20"/> <path d="M19.8 17.8a7.5 7.5 0 0 0 .003-10.603"/> <path d="M17 15a3.5 3.5 0 0 0-.025-4.975"/> </svg> </button> <button type="button" class="download-button ${this.showTranslation ? 'active' : ''}" @click="${this.toggleTranslation}" title="Toggle Translation" aria-label="Toggle translation" aria-pressed="${this.showTranslation}"> <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-languages-icon lucide-languages"> <path d="m5 8 6 6"/> <path d="m4 14 6-6 2-3"/> <path d="M2 5h12"/> <path d="M7 2h1"/> <path d="m22 22-5-10-5 10"/> <path d="M14 18h6"/> </svg> </button> </div> <div class="download-controls"> <select class="format-select" aria-label="Lyrics download format" @change="${e => {
      this.downloadFormat = e.target.value;
    }}" .value="${this.downloadFormat}" @click="${e => e.stopPropagation()}"> <option value="auto">Auto</option> <option value="lrc">LRC</option> <option value="ttml">TTML</option> <option value="plain">Plain</option> </select> <button type="button" class="download-button" @click="${this.downloadLyrics}" title="Download Lyrics" aria-label="Download lyrics"> <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-download-icon lucide-download"> <path d="M12 15V3"/> <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/> <path d="m7 10 5 5 5-5"/> </svg> </button> </div> </div> ` : ''} ${renderContent()} ${!this.isLoading ? x` <footer class="lyrics-footer lyrics-line"> <div class="footer-content"> <div class="source-info"> <b style="font-weight: 750;">Source</b> ${sourceLabel} ${this.renderSourceDetails()} ${this.renderContributors()} ${this.availableSources && this.availableSources.length > 1 || !this.hasFetchedAllProviders ? x` <button type="button" class="download-button source-switch-btn" title="Switch Lyrics Source" aria-label="Switch lyrics source" @click="${this.switchSource}" ?disabled="${this.sourceSwitchPending}" aria-busy="${this.sourceSwitchPending}"> <svg class="source-switch-svg lucide lucide-arrow-down-up-icon lucide-arrow-down-up ${this.sourceSwitchPending ? 'is-loading' : ''}" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"> ${this.sourceSwitchPending ? b`<path
                                    d="M21 12a9 9 0 1 1-6.219-8.56"
                                  ></path>` : b`<path d="m3 16 4 4 4-4"></path
                                    ><path d="M7 20V4"></path
                                    ><path d="m21 8-4-4-4 4"></path
                                    ><path d="M17 4v16"></path>`} </svg> <span class="source-switch-label">${this.sourceSwitchPending ? 'Searching...' : 'Switch'}</span> </button> ` : ''} </div> ${this.songwriters ? x`<span class="songwriters-info" style="margin-top: 4px; font-weight: normal; font-size: 0.9em;"> <b style="font-weight: 750;">Songwriters</b> ${this.songwriters} </span>` : ''} <span class="version-info" style="margin-top: 8px;"> <b style="font-weight: 750;">am-lyrics</b> v${VERSION} • <a href="https://github.com/uimaxbai/apple-music-web-components" target="_blank" rel="noopener noreferrer" style="display: inline-flex; align-items: center; gap: 4px;">Star me on GitHub </a> </span> </div> </footer> ` : ''} </div> `;
  }
}
AmLyrics.styles = i$3`:host{--lyplus-lyrics-palette:var(--am-lyrics-highlight-color,var(--highlight-color,#fff));--lyplus-text-primary:var(--lyplus-lyrics-palette);--lyplus-text-secondary:color-mix(in srgb,var(--lyplus-lyrics-palette),transparent 45%);--lyplus-padding-base:1em;--lyplus-padding-line:10px;--lyplus-padding-gap:.3em;--lyplus-border-radius-base:.6em;--lyplus-gap-dot-size:.4em;--lyplus-gap-dot-margin:.08em;--lyplus-font-size-base:34px;--lyplus-font-size-base-grow:24.5;--lyplus-font-size-subtext:.6em;--am-lyrics-line-height:1.2;--am-lyrics-line-spacing:25px;--am-lyrics-background-vocal-spacing:15px;--am-lyrics-background-vocal-font-size:.65em;--am-lyrics-background-vocal-stack-shift:7.5px;--am-lyrics-background-vocal-max-height:8em;--am-lyrics-background-vocal-enter-duration:.65s;--am-lyrics-background-vocal-exit-duration:.45s;--am-lyrics-instrumental-height:40px;--am-lyrics-instrumental-spacing:16px;--am-lyrics-instrumental-enter-duration:.4s;--am-lyrics-instrumental-collapse-duration:.5s;--am-lyrics-instrumental-exit-duration:.35s;--am-lyrics-instrumental-exit-scale:0;--am-lyrics-inactive-scale:.98;--am-lyrics-background-vocal-scale:.96;--am-lyrics-touch-scale:.96;--am-lyrics-highlight-radius:16px;--am-lyrics-highlight-surface:#ffffff14;--am-lyrics-progression-feather:30px;--am-lyrics-glow-radius:5px;--am-lyrics-inline-padding:20px;--am-lyrics-lift:1;--char-rise-y:-3px;--am-lyrics-character-rise-peak:-1.25px;--lyplus-blur-amount:.07em;--lyplus-blur-amount-near:.035em;--lyplus-fade-gap-timing-function:ease-out;--wipe-gradient-width:var(--am-lyrics-progression-feather);--wipe-gradient-half:calc(var(--am-lyrics-progression-feather)/2);--lyrics-scroll-padding-top:12%;height:100%;color:var(--lyplus-text-primary);-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;background:0 0;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Oxygen,Ubuntu,Cantarell,Open Sans,Helvetica Neue,sans-serif;font-weight:700;display:block;overflow:hidden;container-type:inline-size}.lyrics-container{padding:60px var(--am-lyrics-inline-padding)calc(var(--am-lyrics-instrumental-height) + var(--am-lyrics-instrumental-spacing));-webkit-overflow-scrolling:touch;-webkit-touch-callout:none;-webkit-user-select:none;user-select:none;box-sizing:border-box;scrollbar-width:none;overflow-anchor:none;overscroll-behavior-y:contain;width:100%;height:100%;max-height:100vh;background-color:#0000;scroll-padding-block-start:var(--lyrics-scroll-padding-top);position:relative;overflow-y:auto}.lyrics-container::-webkit-scrollbar{display:none}.lyrics-container.touch-scrolling .lyrics-line,.lyrics-container.touch-scrolling .lyrics-plus-metadata{filter:none!important;transition:none!important}.lyrics-container.wheel-scrolling .lyrics-line{filter:none!important;transition:transform .3s ease-out!important}.lyrics-container.user-scrolling .lyrics-line{--lyrics-line-delay:0s!important;transition-delay:0s!important}.lyrics-line{isolation:isolate;padding:0 var(--lyplus-padding-line);opacity:.8;color:var(--lyplus-text-secondary);font-size:var(--lyplus-font-size-base);line-height:var(--am-lyrics-line-height);cursor:pointer;transform-origin:0;transition:opacity .7s ease,transform .4s cubic-bezier(.41,0,.12,.99)var(--lyrics-line-delay,0s),filter .7s ease;contain:layout style;text-rendering:optimizeLegibility;margin-block-end:var(--am-lyrics-line-spacing);position:relative}.lyrics-line:before{content:"";z-index:-1;border-radius:var(--am-lyrics-highlight-radius);background:var(--am-lyrics-highlight-surface);opacity:0;pointer-events:none;transition:opacity .18s cubic-bezier(.2,0,0,1),transform .18s cubic-bezier(.2,0,0,1),box-shadow .18s ease-out;position:absolute;inset:-6px -8px;transform:scale(.98);box-shadow:0 0 0 1px #0000}.lyrics-line:focus-visible{outline:none}.lyrics-line:focus-visible:before{opacity:1;box-shadow:0 0 0 2px color-mix(in srgb,var(--lyplus-text-primary)72%,transparent);transform:scale(1)}.lyrics-line{animation:none}.lyrics-line-container{overflow-wrap:break-word;transform-origin:0;transform:scale(var(--am-lyrics-inactive-scale));transition:transform .7s,background-color .7s,color .7s;position:relative}.lyrics-line.active .lyrics-line-container,.lyrics-line.pre-active .lyrics-line-container{transition:transform .5s,background-color .18s,color .18s;transform:scale(1)}.main-vocal-container{transform-origin:5%;transition:transform var(--scroll-duration,.4s)cubic-bezier(.2,.8,.2,1);margin:0}.background-vocal-container{--word-inactive-color:color-mix(in srgb,var(--lyplus-text-secondary)50%,#888);--word-wipe-color:color-mix(in srgb,var(--lyplus-text-primary)50%,#888);height:0;font-size:var(--am-lyrics-background-vocal-font-size);box-sizing:border-box;color:color-mix(in srgb,var(--lyplus-text-secondary)80%,transparent);pointer-events:none;margin:0;padding:0;line-height:1.22;position:relative;overflow:visible}.background-vocal-wrap{opacity:0;transform:translateY(var(--background-vocal-offset,6px))scale(var(--am-lyrics-background-vocal-scale));transform-origin:0;padding-top:.08em;padding-bottom:.14em;display:block}.lyrics-line.singer-right .background-vocal-container,.lyrics-line.rtl-text .background-vocal-container{margin-left:auto;margin-right:0}.lyrics-line.bg-expanded .background-vocal-container{height:var(--am-lyrics-background-vocal-height,var(--am-lyrics-background-vocal-max-height))}.lyrics-line.bg-expanded .background-vocal-wrap{opacity:1;transform:translateY(0)scale(1)}.lyrics-line.bg-collapsing .background-vocal-container{height:0}.lyrics-line.bg-collapsing .background-vocal-wrap{opacity:0;transform:translateY(var(--background-vocal-offset,6px))scale(var(--am-lyrics-background-vocal-scale))}.background-vocal-container.background-after .background-vocal-wrap{padding-top:calc(var(--am-lyrics-background-vocal-spacing) + .08em)}.background-vocal-container.background-before .background-vocal-wrap{--background-vocal-offset:-6px;padding-bottom:calc(var(--am-lyrics-background-vocal-spacing) + .14em)}.lyrics-line.singer-right .background-vocal-wrap,.lyrics-line.rtl-text .background-vocal-wrap{transform-origin:100%}.lyrics-container.user-scrolling .background-vocal-container,.lyrics-container.user-scrolling .background-vocal-wrap,.lyrics-container.touch-scrolling .background-vocal-container,.lyrics-container.touch-scrolling .background-vocal-wrap{transition-duration:1ms!important}.lyrics-line.active{opacity:1;color:var(--lyplus-text-primary)}.lyrics-line.pre-active{opacity:1;transition:opacity .7s ease,transform .4s cubic-bezier(.41,0,.12,.99)var(--lyrics-line-delay,0s)}.lyrics-line.scroll-exiting{opacity:.8;color:var(--lyplus-text-secondary);filter:blur(var(--lyplus-blur-amount-near));transition:opacity var(--scroll-duration,.4s)cubic-bezier(.41,0,.12,.99),transform var(--scroll-duration,.4s)cubic-bezier(.41,0,.12,.99)var(--lyrics-line-delay,0s),filter var(--scroll-duration,.4s)ease}.lyrics-line.persist-highlight .lyrics-syllable.finished,.lyrics-line.persist-highlight .lyrics-syllable.finished span.char{transition:none!important}.lyrics-line.singer-right{text-align:end}.lyrics-line.singer-right .lyrics-line-container,.lyrics-line.singer-right .main-vocal-container{transform-origin:100%}.lyrics-line.rtl-text{text-align:right;transform-origin:100%;direction:rtl}.lyrics-line.rtl-text .lyrics-line-container,.lyrics-line.rtl-text .main-vocal-container{transform-origin:100%}.lyrics-line.rtl-text .lyrics-romanization-container,.lyrics-line.rtl-text .lyrics-translation-container{text-align:right}.lyrics-line.rtl-text.singer-right{text-align:left;transform-origin:0}.lyrics-line.rtl-text.singer-right .lyrics-line-container,.lyrics-line.rtl-text.singer-right .main-vocal-container,.lyrics-line.rtl-text.singer-right .background-vocal-wrap{transform-origin:0}.lyrics-line.rtl-text.singer-right .background-vocal-container{margin-left:0;margin-right:auto}.lyrics-line.rtl-text.singer-right .lyrics-romanization-container,.lyrics-line.rtl-text.singer-right .lyrics-translation-container{text-align:left}.lyrics-container.has-duet-lines .lyrics-line.singer-left{padding-inline-end:max(var(--lyplus-padding-line),15%)}.lyrics-container.has-duet-lines .lyrics-line.singer-right{padding-inline-start:max(var(--lyplus-padding-line),15%)}.lyrics-container.is-unsynced .lyrics-line{cursor:default;opacity:1!important;color:var(--lyplus-text-primary)!important;filter:none!important;transform:none!important}.lyrics-container.is-unsynced .lyrics-line-container{background-color:#0000!important;transform:none!important}.lyrics-container.is-unsynced .lyrics-syllable{color:var(--lyplus-text-primary)!important;background-color:#0000!important;-webkit-background-clip:unset!important;background-clip:unset!important;-webkit-text-fill-color:unset!important;text-fill-color:unset!important;text-shadow:none!important;filter:none!important;opacity:1!important;transform:none!important}@media (hover:hover) and (pointer:fine){.lyrics-line:hover{filter:none!important}.lyrics-container.is-unsynced .lyrics-line:hover{background:0 0!important}}.lyrics-line:not(.lyrics-gap):active .lyrics-line-container{transform:scale(var(--am-lyrics-touch-scale));transition-duration:.12s}.lyrics-container.blur-inactive-enabled:not(.not-focused) .lyrics-line:not(.active):not(.pre-active):not(.lyrics-gap){filter:blur(var(--lyplus-blur-amount))}.lyrics-line.far-line{filter:none!important;will-change:auto!important;animation:none!important}.lyrics-container.blur-inactive-enabled:not(.not-focused) .lyrics-line.post-active-line:not(.lyrics-gap):not(.active):not(.pre-active),.lyrics-container.blur-inactive-enabled:not(.not-focused) .lyrics-line.next-active-line:not(.lyrics-gap):not(.active):not(.pre-active),.lyrics-container.blur-inactive-enabled:not(.not-focused) .lyrics-line.lyrics-activest:not(.active):not(.lyrics-gap):not(.pre-active){filter:blur(var(--lyplus-blur-amount-near))}.lyrics-line.prev-2,.lyrics-line.next-2{opacity:.7}.lyrics-line.prev-3,.lyrics-line.next-3{opacity:.58}.lyrics-line.prev-4,.lyrics-line.next-4{opacity:.46}.lyrics-container.blur-inactive-enabled:not(.not-focused) .lyrics-line.next-active-line:not(.lyrics-gap):not(.active):not(.pre-active),.lyrics-container.blur-inactive-enabled:not(.not-focused) .lyrics-line.next-2:not(.lyrics-gap):not(.active):not(.pre-active){filter:blur(.028em)}.lyrics-container.blur-inactive-enabled:not(.not-focused) .lyrics-line.next-3:not(.lyrics-gap):not(.active):not(.pre-active){filter:blur(.05em)}.lyrics-container.blur-inactive-enabled:not(.not-focused) .lyrics-line.next-4:not(.lyrics-gap):not(.active):not(.pre-active){filter:blur(var(--lyplus-blur-amount))}.lyrics-container.user-scrolling .lyrics-line{filter:none!important;opacity:.8!important;transition:none!important}.lyrics-container.blur-inactive-enabled .lyrics-line.pre-active:not(.progressive-unblur){opacity:1;filter:none!important}.lyrics-line.progressive-unblur{transition:opacity .7s ease,transform .4s cubic-bezier(.41,0,.12,.99)var(--lyrics-line-delay,0s),filter 0s linear}.lyrics-word:not(.allow-break){vertical-align:baseline;white-space:nowrap;display:inline-block}.lyrics-word.allow-break{display:inline}.lyrics-line .lyrics-word .lyrics-syllable.has-chars{transform:none!important}.lyrics-line .lyrics-word.normal-word-motion .lyrics-syllable.no-chars{transition-property:color,background-color,opacity!important}.lyrics-line .lyrics-word.normal-word-motion:not(.allow-break) .lyrics-syllable.no-chars{transform:none!important}.lyrics-word.normal-word-motion.word-started:not(.allow-break){transform:translate3d(0,calc(var(--char-rise-y)*var(--am-lyrics-lift)),0)}.lyrics-line .lyrics-word .lyrics-syllable .char.native-motion{transform-origin:50% 80%;transition-property:color,background-color!important}.reduced-motion .lyrics-line .lyrics-word .lyrics-syllable .char.native-motion{text-shadow:none!important;transform:none!important}.lyrics-word.char-rise,.lyrics-word.char-drag{vertical-align:baseline;white-space:nowrap;display:inline-block}.lyrics-word.char-rise.allow-break,.lyrics-word.char-drag.allow-break{white-space:normal;display:inline}.lyrics-syllable-wrap{display:inline}.lyrics-syllable-wrap.has-transliteration{flex-direction:column;align-items:start;display:inline-flex}.lyrics-syllable{vertical-align:baseline;color:#0000;background-color:var(--lyplus-text-secondary);white-space:pre-wrap;font-variant-ligatures:none;font-feature-settings:"liga" 0;-webkit-background-clip:text;background-clip:text;transition:color .7s,background-color .7s,transform .7s;display:inline-block}.lyrics-syllable.finished{background-color:var(--lyplus-text-primary);transition:transform 1s,background-color .7s,color .7s}.lyrics-syllable.finished.has-chars{background-color:#0000}.lyrics-line.active:not(.lyrics-gap) .lyrics-syllable{transition:transform 1s,background-color .5s,color .5s}.lyrics-line .lyrics-word .lyrics-syllable.line-synced{transform:none!important}.lyrics-line.active:not(.lyrics-gap) .lyrics-syllable.highlight.no-chars,.lyrics-line.active:not(.lyrics-gap) .lyrics-syllable.pre-highlight.no-chars{background-repeat:no-repeat;background-image:linear-gradient(90deg,var(--lyplus-text-primary,#fff)0%,var(--lyplus-text-primary,#fff)calc(100% - var(--wipe-gradient-width,.75em)),#0000 100%);background-position:0;background-size:0% 100%}.lyrics-line.active:not(.lyrics-gap) .lyrics-syllable.highlight.rtl-text,.lyrics-line.active:not(.lyrics-gap) .lyrics-syllable.pre-highlight.rtl-text{background-image:linear-gradient(-90deg,var(--lyplus-text-primary)0%,var(--lyplus-text-primary)calc(100% - var(--wipe-gradient-width,.75em)),transparent 100%);direction:rtl;background-position:right 0%;background-size:0% 100%}.lyrics-line.active:not(.lyrics-gap) .lyrics-syllable.wipe-rtl.highlight,.lyrics-line.active:not(.lyrics-gap) .lyrics-syllable.wipe-rtl.pre-highlight{background-image:linear-gradient(-90deg,var(--word-wipe-color,var(--lyplus-text-primary))0%,var(--word-wipe-color,var(--lyplus-text-primary))calc(100% - var(--wipe-gradient-width,.75em)),transparent 100%);background-position:right 0%;background-size:0% 100%}.lyrics-line.active .background-vocal-container .lyrics-syllable.highlight.no-chars,.lyrics-line.active .background-vocal-container .lyrics-syllable.pre-highlight.no-chars,.lyrics-line.pre-active .background-vocal-container .lyrics-syllable.highlight.no-chars,.lyrics-line.pre-active .background-vocal-container .lyrics-syllable.pre-highlight.no-chars{background-image:linear-gradient(90deg,color-mix(in srgb,var(--lyplus-text-primary,#fff)50%,#888)0%,color-mix(in srgb,var(--lyplus-text-primary,#fff)50%,#888)calc(100% - var(--wipe-gradient-width,.75em)),#0000 100%)}.lyrics-line.active .background-vocal-container .lyrics-syllable.highlight.rtl-text,.lyrics-line.active .background-vocal-container .lyrics-syllable.pre-highlight.rtl-text,.lyrics-line.pre-active .background-vocal-container .lyrics-syllable.highlight.rtl-text,.lyrics-line.pre-active .background-vocal-container .lyrics-syllable.pre-highlight.rtl-text{background-image:linear-gradient(-90deg,color-mix(in srgb,var(--lyplus-text-primary)50%,#888)0%,color-mix(in srgb,var(--lyplus-text-primary)50%,#888)calc(100% - var(--wipe-gradient-width,.75em)),transparent 100%)}.lyrics-line:not(.lyrics-gap) .lyrics-word.word-started:not(.growable):not(.char-rise):not(.char-drag) .lyrics-syllable.no-chars,.lyrics-line.active:not(.lyrics-gap) .lyrics-word.word-started .lyrics-syllable.no-chars,.lyrics-line.persist-highlight:not(.lyrics-gap) .lyrics-word .lyrics-syllable.no-chars.finished,.lyrics-word.growable .lyrics-syllable.cleanup .char,.lyrics-word.char-drag .lyrics-syllable.cleanup .char,.lyrics-line.persist-highlight .lyrics-word.growable .lyrics-syllable.finished .char,.lyrics-line.persist-highlight .lyrics-word.char-drag .lyrics-syllable.finished .char{transform:translate3d(0,calc(var(--char-rise-y,-1.12px)*var(--am-lyrics-lift)),0)}.background-vocal-container .lyrics-syllable{background-color:color-mix(in srgb,var(--lyplus-text-secondary)50%,#888)}.lyrics-line.active:not(.lyrics-gap) .background-vocal-container .lyrics-syllable.finished:not(.has-chars),.lyrics-line.pre-active .background-vocal-container .lyrics-syllable.finished:not(.has-chars){background-color:color-mix(in srgb,var(--lyplus-text-primary)50%,#888)}.background-vocal-container .lyrics-syllable.line-synced{color:color-mix(in srgb,var(--lyplus-text-secondary)50%,#888)!important}.lyrics-line.active:not(.lyrics-gap) .background-vocal-container .lyrics-syllable.line-synced,.lyrics-line.pre-active .background-vocal-container .lyrics-syllable.line-synced,.lyrics-line.active:not(.lyrics-gap) .background-vocal-container .lyrics-syllable.line-synced.finished,.lyrics-line.pre-active .background-vocal-container .lyrics-syllable.line-synced.finished{color:color-mix(in srgb,var(--lyplus-text-primary)50%,#888)!important}.lyrics-line.active:not(.lyrics-gap) .background-vocal-container .lyrics-word.word-started .lyrics-syllable.no-chars,.lyrics-line.persist-highlight:not(.lyrics-gap) .background-vocal-container .lyrics-word .lyrics-syllable.no-chars.finished{transform:translate3d(0,calc(var(--char-rise-y)*var(--am-lyrics-lift)),0)}.lyrics-line.active:not(.lyrics-gap) .lyrics-word.char-rise.word-started .lyrics-syllable.transliteration:not(.highlight):not(.finished){transform:none}.lyrics-syllable.pre-highlight{animation-name:pre-wipe-universal;animation-duration:var(--pre-wipe-duration);animation-delay:var(--pre-wipe-delay);animation-timing-function:linear;animation-fill-mode:forwards}.lyrics-syllable.pre-highlight.rtl-text{animation-name:pre-wipe-universal-rtl}.lyrics-syllable.transliteration{font-size:var(--lyplus-font-size-subtext);white-space:pre-wrap;pointer-events:none;user-select:none}.lyrics-timed-romanization{font-size:var(--lyplus-font-size-subtext);direction:ltr;unicode-bidi:isolate;display:block}.lyrics-timed-romanization .lyrics-syllable.transliteration{font-size:1em}.lyrics-line .lyrics-word .lyrics-syllable.has-chars{color:#0000;background-color:#0000}.char-motion{vertical-align:baseline;transform-origin:50% 80%;display:inline-block;position:relative}.lyrics-line:not(.far-line).active .char-motion,.lyrics-line:not(.far-line).pre-active .char-motion{will-change:transform}.lyrics-syllable .char-motion>.char{transform:none!important}.reduced-motion .char-motion{will-change:auto!important;transform:none!important}.lyrics-syllable span.char{background-color:var(--word-inactive-color,var(--lyplus-text-secondary));white-space:break-spaces;font-variant-ligatures:none;font-feature-settings:"liga" 0;-webkit-text-fill-color:transparent;transform-origin:50% 80%;background-origin:content-box;-webkit-background-clip:text;background-clip:text;margin-inline:-.04em;padding-inline:.04em;transition:color .7s,background-color .7s,transform .7s;display:inline-block;position:relative}.lyrics-line.active .char.shared-word-wipe,.lyrics-line.pre-active .char.shared-word-wipe{clip-path:inset(0)}.lyrics-line.active .char-motion[data-glow]:after{content:attr(data-glyph);pointer-events:none;color:#0000;-webkit-text-fill-color:transparent;text-shadow:0 0 .3em var(--lyplus-text-primary);animation:char-glow var(--char-glow-duration)linear var(--char-glow-delay)both;position:absolute;inset:0}@keyframes char-glow{0%,to{opacity:0}15%{opacity:calc(.8*var(--char-glow-max,0))}30%{opacity:var(--char-glow-max,0)}60%{opacity:calc(.3*var(--char-glow-max,0))}}.reduced-motion .char-motion:after{display:none}.lyrics-syllable.finished span.char{background-color:var(--lyplus-text-primary);transition:color .7s,background-color .7s,transform .7s}.lyrics-word.char-drag span.char{transition:color .18s}.lyrics-line.active .lyrics-syllable span.char{background-repeat:no-repeat;-webkit-background-clip:text;background-clip:text;background-image:linear-gradient(90deg,var(--lyplus-text-primary,#fff)0%,var(--lyplus-text-primary,#fff)calc(100% - var(--wipe-gradient-width,.75em)),#0000 100%);background-size:calc(var(--word-wipe-width,1ch) + var(--wipe-gradient-width,.75em))100%;background-position:calc(var(--char-wipe-position,0px) - var(--word-wipe-width,1ch) - var(--wipe-gradient-width,.75em))0%;transition:transform .7s,color .18s}.lyrics-line.active .lyrics-syllable span.char.highlight{background-image:linear-gradient(-90deg,var(--lyplus-text-primary,#fff)0%,var(--lyplus-text-primary,#fff)calc(100% - var(--wipe-gradient-width,.75em)),#0000 100%);background-position:right 0%;background-size:0% 100%}.lyrics-line.active .lyrics-syllable span.char.pre-wipe-lead{animation-name:char-word-wipe;animation-duration:var(--pre-wipe-duration);animation-delay:var(--pre-wipe-delay);animation-timing-function:linear;animation-fill-mode:forwards}.lyrics-line.active .lyrics-syllable:not(.highlight):not(.pre-highlight):not(.finished) span.char:not(.shared-word-wipe){background-image:none}.lyrics-line .lyrics-word .lyrics-syllable.shared-word-wipe,.lyrics-line .lyrics-word .lyrics-syllable span.char.shared-word-wipe{color:var(--word-wipe-color,var(--lyplus-text-primary));-webkit-text-fill-color:transparent;background-repeat:no-repeat;background-size:calc(var(--word-wipe-width) + var(--wipe-gradient-width,.75em))100%;transition:color,background-color,transform 1s;background-image:linear-gradient(90deg,currentColor 0%,currentColor calc(100% - var(--wipe-gradient-width,.75em)),transparent 100%)!important}.lyrics-line .lyrics-word .lyrics-syllable.shared-word-wipe.word-wipe-rtl,.lyrics-line .lyrics-word .lyrics-syllable span.char.shared-word-wipe.word-wipe-rtl{background-image:linear-gradient(-90deg,currentColor 0%,currentColor calc(100% - var(--wipe-gradient-width,.75em)),transparent 100%)!important}.lyrics-container:not(.is-unsynced) .lyrics-line:not(.active):not(.pre-active):not(.lyrics-gap),.lyrics-container:not(.is-unsynced) .lyrics-line.scroll-exiting{transition:opacity var(--scroll-duration,.35s)ease-out,transform .4s cubic-bezier(.41,0,.12,.99)var(--lyrics-line-delay,0s),filter var(--scroll-duration,.35s)ease-out}.lyrics-container:not(.is-unsynced) .lyrics-line:not(.active):not(.pre-active):not(.lyrics-gap) .lyrics-syllable,.lyrics-container:not(.is-unsynced) .lyrics-line:not(.active):not(.pre-active):not(.lyrics-gap) .lyrics-syllable span.char,.lyrics-container:not(.is-unsynced) .lyrics-line.scroll-exiting .lyrics-syllable,.lyrics-container:not(.is-unsynced) .lyrics-line.scroll-exiting .lyrics-syllable span.char{transition:color var(--scroll-duration,.35s)ease-out,background-color var(--scroll-duration,.35s)ease-out,opacity var(--scroll-duration,.35s)ease-out,transform .7s ease}.lyrics-container:not(.is-unsynced) .lyrics-line.scroll-exiting .lyrics-syllable.no-chars:not(.line-synced),.lyrics-container:not(.is-unsynced) .lyrics-line.scroll-exiting .lyrics-syllable span.char{color:#0000!important;background-color:var(--word-inactive-color,var(--lyplus-text-secondary))!important}.lyrics-line.scroll-exiting .char-motion:after{opacity:0!important}.lyrics-container:not(.is-unsynced) .lyrics-line:not(.active):not(.pre-active):not(.lyrics-gap) .lyrics-syllable.no-chars:not(.line-synced),.lyrics-container:not(.is-unsynced) .lyrics-line:not(.active):not(.pre-active):not(.lyrics-gap) .lyrics-syllable span.char{background-image:none!important;background-color:var(--word-inactive-color,var(--lyplus-text-secondary))!important}.lyrics-gap{--gap-scale:0;--gap-opacity:0;height:0;padding:0 var(--lyplus-padding-line);opacity:1;box-sizing:border-box;background-clip:unset;transform-origin:top;transition:transform var(--scroll-duration,.28s);align-items:center;margin-block-end:0;display:flex;overflow:visible;content-visibility:visible!important;contain:none!important}.lyrics-gap.active{height:calc(var(--am-lyrics-instrumental-height) + var(--am-lyrics-instrumental-spacing));transition:transform var(--scroll-duration,.28s)}.lyrics-gap.gap-collapsing{height:0;transition:transform var(--scroll-duration,.28s)}.lyrics-gap .main-vocal-container{height:calc(var(--am-lyrics-instrumental-height) + var(--am-lyrics-instrumental-spacing) + var(--am-lyrics-line-spacing));opacity:0;transform-origin:50%;transition:opacity var(--scroll-duration,.4s)cubic-bezier(.4,0,.6,1),transform var(--scroll-duration,.4s)cubic-bezier(.2,0,.2,1);align-items:center;margin:0;line-height:1;display:flex;position:absolute;inset-block-start:calc(0px - var(--am-lyrics-line-spacing));inset-inline-start:var(--lyplus-padding-line);transform:scale(0)}.lyrics-gap.active .main-vocal-container{will-change:transform,opacity;opacity:var(--gap-opacity);transform:scale(var(--gap-scale));transition:none}.lyrics-gap.gap-collapsing .main-vocal-container,.lyrics-gap.gap-exiting .main-vocal-container{height:calc(var(--am-lyrics-instrumental-height) + var(--am-lyrics-instrumental-spacing) + var(--am-lyrics-line-spacing))}.lyrics-gap.gap-exiting .main-vocal-container{opacity:var(--gap-exit-opacity,0);transform:scale(var(--gap-exit-scale,var(--am-lyrics-instrumental-exit-scale)));transition:none}.lyrics-gap .lyrics-word,.lyrics-gap .lyrics-syllable-wrap{align-items:center;height:100%;display:flex}.lyrics-gap .lyrics-syllable{width:var(--lyplus-gap-dot-size);height:var(--lyplus-gap-dot-size);background-color:var(--lyplus-text-primary);margin:0 var(--lyplus-gap-dot-margin);border-radius:50%;display:inline-block}.lyrics-syllable.line-synced{opacity:.55;color:var(--lyplus-lyrics-palette)!important;background:0 0!important}.lyrics-line:is(.active,.pre-active) .lyrics-syllable.line-synced{color:var(--lyplus-text-primary)!important;animation:.2s ease-out forwards fade-in-line!important}.lyrics-line:is(.active,.pre-active) .lyrics-syllable.line-synced span.char{background-image:none!important;background-color:var(--lyplus-text-primary)!important;transition:background-color .12s ease-out!important}@keyframes fade-in-line{0%{opacity:.5;color:var(--lyplus-text-secondary)}to{opacity:1;color:var(--lyplus-lyrics-palette)}}.lyrics-gap .lyrics-syllable{background-color:var(--lyplus-text-primary);background-clip:unset;opacity:var(--gap-dot-opacity,.25)}.lyrics-gap.active .lyrics-syllable.finished,.lyrics-gap.gap-exiting .lyrics-syllable.finished,.lyrics-gap:not(.active):not(.gap-exiting).post-active-line .lyrics-syllable,.lyrics-gap:not(.active):not(.gap-exiting).lyrics-activest .lyrics-syllable{background-color:var(--lyplus-text-primary);animation:none!important}.lyrics-plus-metadata{box-sizing:border-box;transform:translateY(var(--lyrics-scroll-offset,0px));transition:opacity .3s ease,transform .6s cubic-bezier(.23,1,.32,1)var(--lyrics-line-delay,0s),filter .3s ease;font-weight:400;display:block;position:relative}.lyrics-plus-empty{height:100vh;transform:translateY(var(--lyrics-scroll-offset,0px));display:block}.lyrics-footer{text-align:left;font-size:calc(var(--lyplus-font-size-base)*.5);color:var(--lyplus-text-secondary);opacity:.8;transform-origin:0;flex-wrap:wrap;justify-content:space-between;align-items:center;margin-top:10px;padding:20px 0 50vh;font-weight:400;transition:opacity .3s,transform .5s cubic-bezier(.41,0,.12,.99),filter .3s;display:flex}.lyrics-footer.lyrics-line{font-size:calc(var(--lyplus-font-size-base)*.5);padding:20px var(--lyplus-padding-line)50vh var(--lyplus-padding-line);margin-top:0;margin-block-end:0}.lyrics-footer.active{opacity:1;color:#ffffff80}.contributor-stack{flex-shrink:0;align-items:center;display:flex}.contributor-avatar,.contributor-overflow>summary{box-sizing:border-box;color:#fff;cursor:pointer;background:#303030;border-radius:50%;outline:1px solid #ffffff29;flex:0 0 32px;justify-content:center;align-items:center;width:32px;height:32px;font:500 12px/1 sans-serif;text-decoration:none;display:inline-flex;position:relative;box-shadow:0 0 0 2px #222}.contributor-stack>*+*{margin-inline-start:-8px}.contributor-avatar img{border-radius:inherit;object-fit:cover;width:100%;height:100%;position:absolute;inset:0}.contributor-avatar:hover,.contributor-avatar:focus-visible,.contributor-overflow[open]{z-index:2}.contributor-avatar:focus-visible,.contributor-overflow>summary:focus-visible{outline:2px solid var(--lyplus-text-primary);outline-offset:3px}.contributor-tooltip,.contributor-menu{bottom:calc(100% + 10px);color:#fff;backdrop-filter:blur(18px)saturate(1.4);background:#202020d9;border-radius:14px;padding:9px 12px;font:500 12px/1.4 sans-serif;position:absolute;inset-inline-start:0;box-shadow:inset 0 0 0 1px #ffffff2e,0 8px 24px #00000040}.contributor-tooltip{opacity:0;pointer-events:none;width:max-content;max-width:220px;transition:opacity .14s ease-out,transform .14s ease-out;transform:translateY(3px)}.contributor-avatar:hover .contributor-tooltip,.contributor-avatar:focus-visible .contributor-tooltip{opacity:1;transform:none}.contributor-overflow{position:relative}.contributor-overflow>summary{font-variant-numeric:tabular-nums;list-style:none}.contributor-overflow>summary::-webkit-details-marker{display:none}.contributor-menu{flex-direction:column;gap:8px;width:max-content;max-width:min(260px,70vw);max-height:220px;display:flex;overflow:auto}.contributor-menu a{min-height:40px;color:inherit;align-items:center;gap:9px;text-decoration:none;display:flex}.contributor-menu .contributor-avatar{flex-shrink:0}@media (prefers-reduced-motion:reduce){.contributor-tooltip{transition:none}}.lyrics-container.blur-inactive-enabled:not(.not-focused) .lyrics-footer:not(.active){filter:blur(var(--lyplus-blur-amount));opacity:.5}.lyrics-container.user-scrolling .lyrics-footer{filter:none!important;opacity:.8!important;transition:none!important}.lyrics-footer p{margin:5px 0}.lyrics-footer a{color:var(--lyplus-text-primary);text-underline-offset:2px;opacity:.8;transition:opacity .2s}.lyrics-footer a:hover{opacity:1}.footer-content{flex-direction:column;align-items:flex-start;gap:8px;display:flex}.source-info{flex-wrap:wrap;align-items:center;gap:8px;display:flex}.source-badge{white-space:nowrap;align-items:center;gap:.3em;font-size:.8em;line-height:1;display:inline-flex}.source-badge svg{flex-shrink:0;width:1em;height:1em;display:block}.footer-controls{align-items:center;display:flex}.lyrics-header{z-index:2;inset:10px var(--am-lyrics-inline-padding)auto;justify-content:space-between;align-items:center;gap:10px;height:40px;margin:0;padding:0;display:flex;position:absolute}.lyrics-header .download-button{cursor:pointer;width:40px;height:40px;color:color-mix(in srgb,var(--lyplus-text-primary)62%,transparent);vertical-align:middle;box-shadow:none;background:0 0;border:none;border-radius:12px;justify-content:center;align-items:center;margin:0;padding:0;font-family:inherit;transition:color .16s ease-out,background-color .16s ease-out,box-shadow .16s ease-out,transform .12s ease-out;display:inline-flex;position:relative}.lyrics-header .download-button:hover{color:var(--lyplus-text-primary);box-shadow:none;background:0 0}.lyrics-header .download-button.active{color:var(--lyplus-text-primary);background:0 0}.lyrics-header .download-button:active:not(:disabled){transform:scale(.96)}.lyrics-header .download-button:focus-visible,.source-switch-btn:focus-visible,.format-select:focus-visible{outline:2px solid color-mix(in srgb,var(--lyplus-text-primary)72%,transparent);outline-offset:2px}.header-controls{gap:8px;display:flex}.download-controls{align-items:center;gap:4px;display:flex}.source-switch-btn{box-sizing:border-box;color:#aaa;cursor:pointer;white-space:nowrap;background:#ffffff0f;border:0;border-radius:6px;flex:none;justify-content:center;align-items:center;height:26px;padding:0 8px;font-family:inherit;font-size:11px;line-height:1;transition:color .2s,border-color .2s,background-color .2s,transform .12s;display:inline-flex;position:relative}.source-switch-btn:active:not(:disabled){transform:scale(.96)}.source-switch-btn:disabled{cursor:default;opacity:.7}.source-switch-svg{flex:0 0 12px;width:12px;height:12px;margin-right:4px}.source-switch-svg.is-loading{animation:1s linear infinite source-switch-spin}.control-button{color:#fff9;cursor:pointer;background:0 0;border:1px solid #ffffff4d;border-radius:4px;padding:2px 8px;font-size:.8em;font-weight:400;transition:color .2s,border-color .2s,background-color .2s}.control-button:hover{color:#ffffffe6;border-color:#ffffff80}.control-button.active{background-color:var(--lyplus-text-primary);border-color:var(--lyplus-text-primary);color:#000}.format-select{box-sizing:border-box;color:#fff9;cursor:pointer;background:#ffffff0f;border:1px solid #ffffff4d;border-radius:6px;flex:none;height:28px;margin-left:0;padding:0 6px;font-family:inherit;font-size:12px;font-weight:400;line-height:normal}.format-select:hover{color:#ffffffe6;border-color:#ffffff80}.format-select option{color:#fff;background:#1a1a1a}.lyrics-translation-container,.lyrics-romanization-container{opacity:.8;font-size:var(--lyplus-font-size-subtext);overflow-wrap:break-word;pointer-events:none;user-select:none;padding-top:.2em;font-weight:400;transition:opacity .3s,color .3s}.lyrics-romanization-container{unicode-bidi:plaintext}.lyrics-romanization-container .lyrics-syllable{white-space:pre-wrap}.lyrics-translation-container{opacity:.5}.main-line-wrapper.small{opacity:.8;margin-bottom:0;font-size:.5em;display:block}.translation-line{margin-top:0;font-size:1em;font-weight:700;line-height:1.1;display:block}.romanized-line{color:#ffffff80;margin-top:2px;font-size:.5em;font-weight:400;display:block}@keyframes skeleton-loading{0%{background-color:#ffffff1a}to{background-color:#fff3}}.skeleton-line{height:2.5em;margin:0 0 var(--am-lyrics-line-spacing);opacity:.7;border-radius:16px;width:60%;animation:1s linear infinite alternate skeleton-loading}.skeleton-line:nth-child(2n){width:80%}.skeleton-line:nth-child(3n){width:50%}.skeleton-line:nth-child(5n){width:70%}.no-lyrics{color:#ffffff80;text-align:center;padding:2em;font-size:1.2em;font-weight:400}@keyframes source-switch-spin{to{transform:rotate(360deg)}}@keyframes wipe{0%{background-position:0;background-size:0% 100%}to{background-size:calc(100% + var(--wipe-gradient-width,.75em))100%;background-position:0}}@keyframes wipe-from-pre{0%{background-size:var(--wipe-gradient-width,.75em)100%;background-position:0}to{background-size:calc(100% + var(--wipe-gradient-width,.75em))100%;background-position:0}}@keyframes start-wipe{0%{background-position:0;background-size:0% 100%}to{background-size:calc(100% + var(--wipe-gradient-width,.75em))100%;background-position:0}}@keyframes wipe-rtl{0%{background-position:right 0%;background-size:0% 100%}to{background-size:calc(100% + var(--wipe-gradient-width,.75em))100%;background-position:right 0%}}@keyframes wipe-from-pre-rtl{0%{background-size:var(--wipe-gradient-width,.75em)100%;background-position:right 0%}to{background-size:calc(100% + var(--wipe-gradient-width,.75em))100%;background-position:right 0%}}@keyframes start-wipe-rtl{0%{background-position:right 0%;background-size:0% 100%}to{background-size:calc(100% + var(--wipe-gradient-width,.75em))100%;background-position:right 0%}}@keyframes pre-wipe-universal{0%{background-position:0;background-size:0% 100%}to{background-size:var(--wipe-gradient-width,.75em)100%;background-position:0}}@keyframes pre-wipe-universal-rtl{0%{background-position:right 0%;background-size:0% 100%}to{background-size:var(--wipe-gradient-width,.75em)100%;background-position:right 0%}}@keyframes char-word-wipe{0%{background-position:calc(var(--char-wipe-position,0px) - var(--word-wipe-width,1ch) - var(--wipe-gradient-width,.75em))0%}to{background-position:var(--char-wipe-position,0px)0%}}@keyframes fade-gap{0%{background-color:var(--lyplus-text-secondary)}to{background-color:var(--lyplus-text-primary)}}@keyframes grow-static{0%,to{text-shadow:0 0 0 color-mix(in srgb,var(--lyplus-lyrics-palette),transparent 100%);transform:scale3d(1.01,1.01,1.1)translateY(-.05%)}30%,40%{text-shadow:0 0 .3em color-mix(in srgb,var(--lyplus-lyrics-palette),transparent 50%);transform:scale3d(1.1,1.1,1.1)translateY(-.05%)}}@keyframes fadeInUp{0%{opacity:0;transform:translateY(20px)}to{opacity:.7;transform:translateY(0)}}.opposite-turn{text-align:right}.singer-right{text-align:right;justify-content:flex-end}.singer-left{text-align:left;justify-content:flex-start}.progress-text{background:linear-gradient(to right,var(--lyplus-text-primary)0%,var(--lyplus-text-primary)var(--line-progress,0%),var(--lyplus-text-secondary)var(--line-progress,0%),var(--lyplus-text-secondary)100%);-webkit-text-fill-color:transparent;color:var(--lyplus-text-secondary);-webkit-background-clip:text;background-clip:text;display:inline-block;position:relative;transform:translate(0,0)}.progress-text:before{display:none}.active-line{font-weight:700}.background-text{color:var(--lyplus-text-secondary);flex-shrink:0;margin:0;font-size:.8em;font-style:normal;line-height:1.1;display:block}.background-text.before{order:-1}.background-text.after{order:1}.instrumental-line{color:var(--lyplus-text-secondary);align-items:baseline;gap:8px;padding:4px 10px;font-size:.9em;font-weight:400;animation:.22s fadeInUp;display:inline-flex}.instrumental-duration{color:var(--lyplus-text-secondary);font-size:.8em}@container (width<=519px){.lyrics-container{--lyplus-font-size-base:var(--am-lyrics-compact-font-size,28px);--am-lyrics-line-spacing:var(--am-lyrics-compact-line-spacing,20px);--am-lyrics-background-vocal-font-size:var(--am-lyrics-compact-background-vocal-font-size,.857em);--lyrics-scroll-padding-top:var(--am-lyrics-compact-selected-position,18%);--am-lyrics-inline-padding:14px}}@container (width>=900px){.lyrics-container{--lyplus-font-size-base:var(--am-lyrics-wide-font-size,48px);--am-lyrics-line-height:1.17;--am-lyrics-line-spacing:var(--am-lyrics-wide-line-spacing,32px);--am-lyrics-background-vocal-font-size:var(--am-lyrics-wide-background-vocal-font-size,.667em);--lyrics-scroll-padding-top:var(--am-lyrics-wide-selected-position,20%);--am-lyrics-inline-padding:32px}}@media (prefers-contrast:more){:host{--lyplus-text-secondary:color-mix(in srgb,var(--lyplus-lyrics-palette),transparent 24%)}.lyrics-line:focus-visible:before{box-shadow:0 0 0 3px var(--lyplus-text-primary)}}:host([no-blur]) .lyrics-line{filter:none!important;transition-property:opacity,transform!important}:host([hide-played-lines]) .lyrics-container:not(.user-scrolling):not(.touch-scrolling) .lyrics-line.played:not(:focus-within){opacity:0;pointer-events:none}.lyrics-container.reduced-motion .lyrics-line,.lyrics-container.reduced-motion .lyrics-line:before,.lyrics-container.reduced-motion .lyrics-line-container,.lyrics-container.reduced-motion .main-vocal-container,.lyrics-container.reduced-motion .background-vocal-container,.lyrics-container.reduced-motion .background-vocal-wrap,.lyrics-container.reduced-motion .lyrics-plus-metadata,.lyrics-container.reduced-motion .lyrics-footer{transition:none!important;animation:none!important}.lyrics-container.reduced-motion .lyrics-line,.lyrics-container.reduced-motion .lyrics-line-container,.lyrics-container.reduced-motion .main-vocal-container,.lyrics-container.reduced-motion .background-vocal-wrap,.lyrics-container.reduced-motion .lyrics-syllable,.lyrics-container.reduced-motion .lyrics-word.normal-word-motion,.lyrics-container.reduced-motion .lyrics-syllable span.char{transform:none!important}.lyrics-container.reduced-motion .lyrics-syllable span.char{filter:none!important;transition:none!important}`;
AmLyrics.overlapSegmenter = Intl.Segmenter ? new Intl.Segmenter(undefined, {
  granularity: 'word'
}) : null;
AmLyrics.lineSpringSamples = new Map();
AmLyrics.wordWipes = new WeakMap();
AmLyrics.wipeClocks = new WeakMap();
/**
 * Update syllables based on current time
 * Uses DOM caching and pre-highlight reset for smooth transitions
 */
AmLyrics.motionWords = new WeakMap();
AmLyrics.normalWordMotions = new WeakMap();
AmLyrics.normalRiseClocks = new WeakMap();
AmLyrics.motionSyllables = new WeakMap();
AmLyrics.motionParameters = new WeakMap();
// Repeated syllable durations share sampled curves; bound memory across songs.
AmLyrics.characterFrames = new Map();
AmLyrics.characterAnimations = new WeakMap();
__decorate([n({
  type: String
})], AmLyrics.prototype, "query", void 0);
__decorate([n({
  type: String
})], AmLyrics.prototype, "musicId", void 0);
__decorate([n({
  type: String,
  attribute: 'spotify-id'
})], AmLyrics.prototype, "spotifyId", void 0);
__decorate([n({
  type: String
})], AmLyrics.prototype, "isrc", void 0);
__decorate([n({
  type: String
})], AmLyrics.prototype, "ttml", void 0);
__decorate([n({
  type: String,
  attribute: 'song-title'
})], AmLyrics.prototype, "songTitle", void 0);
__decorate([r()], AmLyrics.prototype, "downloadFormat", void 0);
__decorate([n({
  type: String,
  attribute: 'song-artist'
})], AmLyrics.prototype, "songArtist", void 0);
__decorate([n({
  type: String,
  attribute: 'song-album'
})], AmLyrics.prototype, "songAlbum", void 0);
__decorate([n({
  type: String,
  attribute: 'songwriters'
})], AmLyrics.prototype, "songwriters", void 0);
__decorate([n({
  type: Number,
  attribute: 'song-duration'
})], AmLyrics.prototype, "songDurationMs", void 0);
__decorate([n({
  type: String,
  attribute: 'highlight-color'
})], AmLyrics.prototype, "highlightColor", void 0);
__decorate([n({
  type: String,
  attribute: 'font-family'
})], AmLyrics.prototype, "fontFamily", void 0);
__decorate([n({
  type: Boolean
})], AmLyrics.prototype, "autoScroll", void 0);
__decorate([n({
  type: Boolean
})], AmLyrics.prototype, "interpolate", void 0);
__decorate([n({
  type: Boolean
})], AmLyrics.prototype, "paused", void 0);
__decorate([n({
  type: Boolean,
  attribute: 'no-auto-alternates'
})], AmLyrics.prototype, "noAutoAlternates", void 0);
__decorate([n({
  type: Boolean,
  attribute: 'no-blur',
  reflect: true
})], AmLyrics.prototype, "noBlur", void 0);
__decorate([n({
  type: Boolean,
  attribute: 'hide-played-lines',
  reflect: true
})], AmLyrics.prototype, "hidePlayedLines", void 0);
__decorate([n({
  type: Boolean,
  attribute: 'reduced-motion'
})], AmLyrics.prototype, "reducedMotion", void 0);
__decorate([n({
  type: String,
  attribute: 'line-motion'
})], AmLyrics.prototype, "lineMotion", void 0);
__decorate([r()], AmLyrics.prototype, "systemReducedMotion", void 0);
__decorate([r()], AmLyrics.prototype, "showRomanization", void 0);
__decorate([r()], AmLyrics.prototype, "showTranslation", void 0);
__decorate([n({
  type: Number
})], AmLyrics.prototype, "duration", void 0);
__decorate([n({
  type: Number,
  attribute: 'currenttime',
  hasChanged: () => false
})], AmLyrics.prototype, "currentTime", null);
__decorate([r()], AmLyrics.prototype, "isLoading", void 0);
__decorate([r()], AmLyrics.prototype, "lyrics", void 0);
__decorate([r()], AmLyrics.prototype, "lyricsSource", void 0);
__decorate([r()], AmLyrics.prototype, "availableSources", void 0);
__decorate([r()], AmLyrics.prototype, "currentSourceIndex", void 0);
__decorate([r()], AmLyrics.prototype, "isFetchingAlternatives", void 0);
__decorate([r()], AmLyrics.prototype, "sourceSwitchPending", void 0);
__decorate([e('.lyrics-container')], AmLyrics.prototype, "lyricsContainer", void 0);

const amLyricsRegistry = globalThis.customElements || globalThis.window?.customElements || document.defaultView?.customElements;
if (!amLyricsRegistry) throw new Error('AM Lyrics requires a CustomElementRegistry.');
if (!amLyricsRegistry.get('am-lyrics')) amLyricsRegistry.define('am-lyrics', AmLyrics);

function getLoopAmLyricsHost() {
  return document.getElementById('loop-lyrics-host');
}
function updateLoopAmLyricsElement(host, element) {
  if (!host || !element) return;
  const currentTime = Number(host.dataset.loopAmCurrentTime);
  const duration = Number(host.dataset.loopAmDuration);
  if (Number.isFinite(currentTime)) element.currentTime = currentTime;
  element.paused = host.dataset.loopAmPaused !== 'false';
  element.duration = Number.isFinite(duration) && duration > 0 ? duration : undefined;
}
window.addEventListener('loop-am-lyrics-create', () => {
  const host = getLoopAmLyricsHost();
  if (!host || host.querySelector('am-lyrics')) return;
  const element = document.createElement('am-lyrics');
  element.ttml = host.dataset.loopAmTtml || '';
  element.songTitle = host.dataset.loopAmTitle || '';
  element.songArtist = host.dataset.loopAmArtist || '';
  element.songAlbum = host.dataset.loopAmAlbum || '';
  element.songwriters = host.dataset.loopAmSongwriters || '';
  const duration = Number(host.dataset.loopAmDuration);
  element.songDurationMs = Number.isFinite(duration) && duration > 0 ? duration : undefined;
  element.duration = element.songDurationMs;
  element.autoScroll = true;
  element.interpolate = true;
  element.noAutoAlternates = true;
  element.style.display = 'block';
  element.style.width = '100%';
  element.style.height = '100%';
  updateLoopAmLyricsElement(host, element);
  host.appendChild(element);
});
window.addEventListener('loop-am-lyrics-update', () => {
  const host = getLoopAmLyricsHost();
  updateLoopAmLyricsElement(host, host?.querySelector('am-lyrics'));
});
window.addEventListener('loop-am-lyrics-destroy', () => {
  getLoopAmLyricsHost()?.querySelector('am-lyrics')?.remove();
});
//# sourceMappingURL=am-lyrics.js.map
