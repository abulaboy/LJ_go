// 產生「JIO 辦公室體驗版」：node tools/make_office.js
// 讀根目錄 index.html（主線最新版），加上流暢版補丁與「辦公室模式」，寫到 office/index.html。
// 遊戲本身的程式不動：辦公室模式只負責
//   1. 網頁一打開就用載入畫面整個蓋住，傳送到辦公室、藏好外面的東西之後才掀開（看不到家裡）
//   2. 隱藏辦公室以外的物件、小地圖（家的平面圖）與用不到的按鈕
//   3. 走出辦公室就拉回來
// 主線更新後重跑一次就同步。
const fs = require('fs'), path = require('path');
const { patch, threeTag, source } = require('./make_smooth.js');
const root = path.join(__dirname, '..');

const DBG = '/[?&]dbg=1/.test(location.search)';
if (!source.includes(DBG)) throw new Error('找不到 __dbg 開關，主線可能改過寫法');

// 體驗版用不到的按鈕：去哪裡、交通工具、屋頂、換人、工具箱、說明、語音、第一人稱、自由檢視／天花板工具列、小地圖
const HIDE = ['#v85-quick-go-btn', '#v69VehicleBtn', '#v69RoofBtn', '#swap', '#v67-toolbox-wrap', '#v67-toolbox-toggle',
  '#v67-info-toggle', '#goList', '#voiceB', '#jio-v119-fpv-btn', '#v69ToolBar', '#map', '#v54-info-btn', '#v54-menu-btn'];

const head = '<style id="jio-office-css">' + HIDE.join(',') + '{display:none!important;clip-path:inset(50%)!important}' +
  '#jio-office-badge{position:fixed;left:50%;top:10px;transform:translateX(-50%);z-index:99999;background:rgba(40,25,15,.85);color:#ffe7b0;font:600 13px/1.4 system-ui,sans-serif;padding:6px 12px;border-radius:999px;pointer-events:none;white-space:nowrap}' +
  '@media (max-width:560px){#jio-office-badge{font-size:11px}}' +
  '#jio-office-load{position:fixed;inset:0;z-index:2147483647;background:#2b1a10;color:#ffe7b0;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:10px;font:600 16px system-ui,sans-serif;transition:opacity .4s}' +
  '</style>';
const coverHtml = '<div id="jio-office-load"><div style="font-size:40px">🏢</div><div>JIO 辦公室載入中…</div></div>';

const office = `<script>/* JIO 辦公室體驗版（tools/make_office.js 產生，不要手改） */
(function(){
var GO='🏢 JIO 公司辦公室（16 樓西側）';
var ROOMS=null,BOX=null,last=null,state=0,hidden=[],lastScan=0,lastToast=0;
var cover=document.getElementById('jio-office-load');
document.title='JIO 辦公室｜家裡走走';
var badge=document.createElement('div');badge.id='jio-office-badge';badge.textContent='JIO 辦公室體驗版';document.body.appendChild(badge);
addEventListener('keydown',function(e){var k=(e.key||'').toLowerCase();if(k==='q'||k==='v'||k==='r'||k==='t'){e.stopImmediatePropagation();e.preventDefault()}},true);
function rects(){var J=window.__JIO;if(!J||!J.rooms)return null;var out=[];for(var k in J.rooms){var m=J.rooms[k].m||[];for(var i=0;i<m.length;i++)out.push(m[i])}return out.length?out:null}
function inside(p){for(var i=0;i<ROOMS.length;i++){var r=ROOMS[i];if(p[0]>=r[0]-0.35&&p[0]<=r[2]+0.35&&p[1]>=r[1]-0.35&&p[1]<=r[3]+0.35)return true}return false}
function bbox(){var x0=1e9,x1=-1e9,z0=1e9,z1=-1e9;ROOMS.forEach(function(r){x0=Math.min(x0,r[0]);z0=Math.min(z0,r[1]);x1=Math.max(x1,r[2]);z1=Math.max(z1,r[3])});return [x0-0.8,x1+0.8,z0-0.8,z1+0.8]}
function hideOutside(){var sc=window.__smoothScene;if(!sc||!window.THREE)return;var bb=new THREE.Box3(),keep=new Set();
 var J=window.__JIO;
 (J&&J.npcs||[]).forEach(function(n){var g=n&&(n.group||n.g||n.mesh||n.obj);if(g&&g.traverse)g.traverse(function(o){keep.add(o)})});
 hidden=[];sc.updateMatrixWorld();
 sc.traverse(function(o){if(!(o.isMesh||o.isLine||o.isPoints||o.isSprite)||keep.has(o)||!o.visible||!o.geometry)return;
  if(!o.geometry.boundingBox)o.geometry.computeBoundingBox();bb.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld);
  var span=Math.max(bb.max.x-bb.min.x,bb.max.z-bb.min.z);if(span>30)return;
  var cx=(bb.min.x+bb.max.x)/2,cz=(bb.min.z+bb.max.z)/2,inRoom=false;
  for(var i=0;i<ROOMS.length;i++){var r=ROOMS[i];if(cx>=r[0]-0.25&&cx<=r[2]+0.25&&cz>=r[1]-0.25&&cz<=r[3]+0.25){inRoom=true;break}}
  if(!inRoom){o.visible=false;hidden.push(o)}});
}
function reveal(){requestAnimationFrame(function(){requestAnimationFrame(function(){setTimeout(function(){if(!cover)return;cover.style.opacity='0';setTimeout(function(){cover.remove();cover=null},500)},600)})})}
function toast(t){var now=Date.now();if(now-lastToast<3000)return;lastToast=now;badge.textContent=t;setTimeout(function(){badge.textContent='JIO 辦公室體驗版'},2500)}
setInterval(function(){
 var tt=document.getElementById('toast');if(tt){var bad=/換人|全家|客廳/.test(tt.textContent);if(bad!==!!tt.__offHidden){tt.__offHidden=bad;tt.style.visibility=bad?'hidden':''}}
 var skip=Array.prototype.find.call(document.querySelectorAll('button'),function(x){return x.textContent.indexOf('先不選')>=0&&x.offsetParent});if(skip)skip.click();
 if(!window.__dbg)return;
 if(state===0){var b=Array.prototype.find.call(document.querySelectorAll('button'),function(x){return x.textContent.trim()===GO});if(b){b.click();state=1}return}
 if(!ROOMS){ROOMS=rects();if(ROOMS)BOX=bbox();return}
 var p=window.__dbg.pos();
 if(state===1){if(inside(p)){state=2;setTimeout(function(){hideOutside();lastScan=Date.now();state=3;reveal()},1500)}return}
 if(state<3)return;
 if(inside(p))last=p;else if(last){window.__dbg.tp(last[0],last[1]);toast('體驗版只開放辦公室喔！')}
 for(var i=0;i<hidden.length;i++)if(hidden[i].visible)hidden[i].visible=false;
 if(Date.now()-lastScan>15000){lastScan=Date.now();hideOutside()}
},250);
})();
</script>`;

let out = source.replace(threeTag, () => threeTag + '\n' + patch);
out = out.replace(DBG, 'true');
if (!/<\/head>/i.test(out) || !/<body[^>]*>/i.test(out)) throw new Error('找不到 </head> 或 <body>');
out = out.replace(/<\/head>/i, (h) => head + h);
out = out.replace(/<body[^>]*>/i, (b) => b + coverHtml);
const i = out.lastIndexOf('</body>');
out = i >= 0 ? out.slice(0, i) + office + '\n' + out.slice(i) : out + office;
out = out.replace(/<title>[^<]*<\/title>/, '<title>JIO 辦公室｜家裡走走</title>');
fs.mkdirSync(path.join(root, 'office'), { recursive: true });
fs.writeFileSync(path.join(root, 'office', 'index.html'), out);
console.log('已產生 office/index.html', out.length, 'chars');
