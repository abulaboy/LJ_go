(function(){
function mk(){const f=function(){};return new Proxy(f,{
 get(t,k){if(k===Symbol.toPrimitive)return()=>0;if(k==='then')return undefined;if(k in t&&k!=='prototype'&&k!=='length'&&k!=='name')return t[k];if(!(k in store(t)))store(t)[k]=mk();return store(t)[k];},
 set(t,k,v){store(t)[k]=v;return true;},
 apply(){return mk();},construct(){return mk();}});}
const S=new WeakMap();function store(t){if(!S.has(t))S.set(t,{});return S.get(t);}
window.THREE=mk();
})();
