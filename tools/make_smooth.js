// 產生「流暢版」：node tools/make_smooth.js
// 讀根目錄 index.html（主線最新版），在 three.min.js 後面插一段效能補丁，寫到 smooth/index.html。
// 主線每次更新後都要重跑一次，再一起推上 main 和 gh-pages。
// 補丁內容：解析度上限 1、關閉陰影與反鋸齒、只開最靠近鏡頭的 8 盞點光源、
// 不會動的物件停止每格重算位置（偵測到有動就自動恢復）。遊戲本身的程式完全不動。
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const s = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const m = s.match(/<script src="[^"]*three(?:\.min)?\.js"><\/script>/);
if (!m) throw new Error('找不到 three.min.js 的 <script> 標籤');
const MAXL = 8;
const patch = `<script>/* 流暢版補丁（tools/make_smooth.js 產生，不要手改） */
(function(){if(!window.THREE)return;var R=THREE.WebGLRenderer;
THREE.WebGLRenderer=function(o){o=Object.assign({},o||{},{antialias:false,powerPreference:'high-performance'});var r=new R(o);
var sp=r.setPixelRatio.bind(r);r.setPixelRatio=function(){sp(1)};sp(1);
r.shadowMap.enabled=false;try{Object.defineProperty(r.shadowMap,'enabled',{get:function(){return false},set:function(){}})}catch(e){}
var rd=r.render.bind(r),lights=null,last=0,lastScan=0,v=new THREE.Vector3(),cp=new THREE.Vector3();
r.render=function(sc,cam){var now=performance.now();
 if(sc&&sc.isScene&&cam&&now-last>400){last=now;
  if(!lights||now-lastScan>5000){lastScan=now;lights=[];sc.traverse(function(o){if(o.isPointLight||o.isSpotLight){if(o.__on===undefined)o.__on=o.visible;lights.push(o)}})}
  cam.getWorldPosition(cp);
  var c=lights.filter(function(l){return l.__on}).map(function(l){l.getWorldPosition(v);return [l,v.distanceToSquared(cp)]}).sort(function(a,b){return a[1]-b[1]});
  for(var i=0;i<c.length;i++){c[i][0].visible=i<${MAXL};c[i][0].castShadow=false}
 }
 if(sc&&sc.isScene){window.__smoothScene=sc;window.__smoothR=r;freeze(sc,cam,now)}
 return rd(sc,cam)};
var all=[],idx=0,built=0;
function snap(o){var p=o.position,q=o.quaternion,s=o.scale;return [p.x,p.y,p.z,q.x,q.y,q.z,q.w,s.x,s.y,s.z]}
function same(a,o){var p=o.position,q=o.quaternion,s=o.scale;return a[0]===p.x&&a[1]===p.y&&a[2]===p.z&&a[3]===q.x&&a[4]===q.y&&a[5]===q.z&&a[6]===q.w&&a[7]===s.x&&a[8]===s.y&&a[9]===s.z}
function freeze(sc,cam,now){
 if(now-built>5000){built=now;all=[];var skip=new Set();for(var c=cam;c;c=c.parent)skip.add(c);sc.traverse(function(o){if(o!==sc&&!skip.has(o)&&!o.isCamera&&!o.isBone&&!o.isSkinnedMesh)all.push(o)});idx=0}
 var n=Math.min(all.length,Math.max(800,Math.ceil(all.length/6)));
 for(var k=0;k<n&&all.length;k++){var o=all[idx++%all.length];
  if(!o.__fz){o.__fz={s:snap(o),st:0,on:false};continue}
  var z=o.__fz;
  if(!same(z.s,o)){z.s=snap(o);z.st=0;if(z.on){z.on=false;o.matrixAutoUpdate=true}}
  else if(!z.on&&o.matrixAutoUpdate&&++z.st>=3){o.updateMatrix();o.matrixWorldNeedsUpdate=true;o.matrixAutoUpdate=false;z.on=true}
 }
}
return r};
THREE.WebGLRenderer.prototype=R.prototype;})();
</script>`;
module.exports = { patch, threeTag: m[0], source: s };
if (require.main !== module) return;
let out = s.replace(m[0], () => m[0] + '\n' + patch);
out = out.replace(/<title>([^<]*)<\/title>/, (t, x) => '<title>' + x + '（流暢版）</title>');
fs.mkdirSync(path.join(root, 'smooth'), { recursive: true });
fs.writeFileSync(path.join(root, 'smooth', 'index.html'), out);
console.log('已產生 smooth/index.html', out.length, 'bytes');
