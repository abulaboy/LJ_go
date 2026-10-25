// 把 Gemini 交出的區塊插進 index.html 檔尾（netStart 之前），並檢查整段 <script> 語法
// 用法：node tools/integrate.js tools/gemini/work/v80/block.js [--dry]
const fs = require('fs'), path = require('path'), os = require('os');
const { spawnSync } = require('child_process');
const [blockFile, dry] = process.argv.slice(2);
const file = path.resolve(__dirname, '..', 'index.html');
const M = 'netStart();\nrequestAnimationFrame(frame);\n})();\n</script>';
let h = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
if (h.split(M).length !== 2) { console.log('找不到唯一的插入位置（檔尾 netStart 那四行）'); process.exit(1); }
const block = fs.readFileSync(blockFile, 'utf8').replace(/\r\n/g, '\n').trimEnd() + '\n';
const title = (block.match(/\/\/ ===== (第 \d+ 版[^=]*)=====/) || [])[1];
if (!title) { console.log('區塊第一行缺少「// ===== 第 XX 版：標題 =====」'); process.exit(1); }
if (h.includes(block.split('\n')[0])) { console.log('index.html 已經有這一版了：' + title.trim()); process.exit(1); }
h = h.replace(M, block + M);
const s = h.slice(h.lastIndexOf('<script>') + 8, h.lastIndexOf('</script>'));
const tmp = path.join(os.tmpdir(), 'jiazou-check.js'); fs.writeFileSync(tmp, s);
const r = spawnSync(process.execPath, ['--check', tmp], { encoding: 'utf8' });
if (r.status !== 0) { console.log('整合後語法錯誤：\n' + r.stderr.slice(0, 800)); process.exit(2); }
if (dry === '--dry') { console.log('語法正確（試跑，沒有寫入）：' + title.trim()); process.exit(0); }
fs.writeFileSync(file, h);
console.log('已插入：' + title.trim());
