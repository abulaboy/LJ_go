#!/usr/bin/env node
// 家裡走走：Claude（主管）派工給 Gemini CLI 的小工具（改用 API 金鑰）
//
// 金鑰放在環境變數 GEMINI_API_KEY（不要寫進任何檔案）。只有一組金鑰，不輪流切換帳號。
//
// 用法（在專案根目錄執行）：
//   node tools/gemini/dispatch.js check                檢查金鑰是否已設定（不會顯示金鑰）
//   node tools/gemini/dispatch.js run v80 tasks/v80.md
//                                                      派工：建立 tools/gemini/work/v80/，讓 Gemini 在裡面寫 block.js
//   node tools/gemini/dispatch.js fix v80 tasks/v80-fix.md
//                                                      同一個任務的修正
//   node tools/gemini/dispatch.js status               列出所有任務的狀態
//
// 結束代碼：0 = 完成（block.js 存在且語法正確）；2 = 交出的程式有問題；3 = 額度用完（停止，告訴使用者）；4 = 模型忙線 503（可稍後重試或換模型）；1 = 其他錯誤
// 環境變數：GEMINI_API_KEY（必要）、GEMINI_MODEL（可選，指定模型）、GEMINI_TIMEOUT_MIN（可選，預設 40 分鐘）

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn, spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const WORK = path.join(__dirname, 'work');
// Gemini CLI 專用的設定資料夾：固定用 API 金鑰登入，不受電腦上其他 Google 登入影響（不含金鑰，金鑰只從環境變數讀）
const HOME_DIR = path.join(os.homedir(), '.gemini-api-home');
const QUOTA_RE = /RESOURCE_EXHAUSTED|status 429|"code": ?429|exceeded your current quota|daily limit|quota exceeded/i;
const BUSY_RE = /status 503|high demand|UNAVAILABLE/i;
const KEY_RE = /API key not valid|API_KEY_INVALID|PERMISSION_DENIED|\b401\b|\b403\b/i;

function hasKey() { return !!process.env.GEMINI_API_KEY; }
function geminiEnv() {
  const g = path.join(HOME_DIR, '.gemini');
  fs.mkdirSync(g, { recursive: true });
  const f = path.join(g, 'settings.json');
  if (!fs.existsSync(f)) fs.writeFileSync(f, JSON.stringify({ security: { auth: { selectedType: 'gemini-api-key' } } }, null, 2));
  return Object.assign({}, process.env, { USERPROFILE: HOME_DIR, HOME: HOME_DIR, GEMINI_CLI_TRUST_WORKSPACE: 'true' });
}
function syntaxOk(file) {
  const r = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  return { ok: r.status === 0, err: (r.stderr || '').slice(0, 800) };
}
function scrub(s) { const k = process.env.GEMINI_API_KEY; return k ? s.split(k).join('***') : s; }

function runGemini(cwd, prompt) {
  return new Promise(resolve => {
    const args = ['-y', '-p', process.platform === 'win32' ? '"' + prompt.replace(/"/g, '\\"') + '"' : prompt];
    if (process.env.GEMINI_MODEL) args.unshift('-m', process.env.GEMINI_MODEL);
    const log = fs.createWriteStream(path.join(cwd, 'run.log'), { flags: 'a' });
    log.write('\n===== ' + new Date().toISOString() + ' =====\n');
    const child = spawn('gemini', args, { cwd, env: geminiEnv(), shell: process.platform === 'win32' });
    let out = '';
    const onData = d => { const s = scrub(d.toString()); out += s; log.write(s); };
    child.stdout.on('data', onData);
    child.stderr.on('data', onData);
    const min = +process.env.GEMINI_TIMEOUT_MIN || 40;
    const timer = setTimeout(() => { out += '\n[逾時]'; child.kill(); }, min * 60000);
    child.on('error', e => { out += '\n[無法啟動 gemini：' + e.message + ']'; });
    child.on('close', code => { clearTimeout(timer); log.end(); resolve({ code, out }); });
  });
}

// 給 Gemini 的指令只用英文，避免 Windows 命令列編碼問題；中文內容都放在 task.md 與 GEMINI.md
const PROMPT_RUN = 'Read GEMINI.md and task.md in the current folder first, then complete the task described in task.md. ' +
  'Only create or edit files inside the current folder. Do not modify index.html. ' +
  'Deliver block.js and report.md (report in Traditional Chinese), and run your own sim.js self-test with node before finishing.';
const PROMPT_FIX = 'Read GEMINI.md, task.md, report.md and fix.md in the current folder. fix.md contains test results from the supervisor. ' +
  'Fix block.js accordingly (keep everything else working), re-run your self-test, and update report.md (Traditional Chinese).';

async function dispatch(taskId, taskFile, opts) {
  if (!hasKey()) { console.log('找不到環境變數 GEMINI_API_KEY，請先設定（見 SETUP.md）。'); process.exit(1); }
  const dir = path.join(WORK, taskId);
  fs.mkdirSync(dir, { recursive: true });
  fs.copyFileSync(path.join(__dirname, 'GEMINI.md'), path.join(dir, 'GEMINI.md'));
  fs.copyFileSync(path.join(ROOT, 'index.html'), path.join(dir, 'index.html'));
  fs.copyFileSync(path.resolve(taskFile), path.join(dir, opts.fix ? 'fix.md' : 'task.md'));

  console.log('派工給 Gemini（API 金鑰）：' + taskId + (opts.fix ? '（修正）' : ''));
  const block = path.join(dir, 'block.js');
  const before = fs.existsSync(block) ? fs.statSync(block).mtimeMs : 0;
  let r, fresh;
  for (let i = 1; i <= 4; i++) {   // 模型忙線（503）最多重試 4 次，每次間隔 60 秒
    r = await runGemini(dir, opts.fix ? PROMPT_FIX : PROMPT_RUN);
    fresh = fs.existsSync(block) && fs.statSync(block).mtimeMs > before;
    if (fresh || QUOTA_RE.test(r.out) || !BUSY_RE.test(r.out) || i === 4) break;
    console.log('模型忙線（503），60 秒後重試（' + i + '/3）');
    await new Promise(ok => setTimeout(ok, 60000));
  }
  fs.writeFileSync(path.join(dir, 'meta.json'), JSON.stringify({ taskId, at: new Date().toISOString(), code: r.code }, null, 2));
  if (!fresh && !QUOTA_RE.test(r.out) && BUSY_RE.test(r.out)) { console.log('Gemini 模型忙線中（503，不是額度問題），稍後再試，或用 GEMINI_MODEL 換模型。'); process.exit(4); }
  if (!fresh && QUOTA_RE.test(r.out)) { console.log('額度已用完，停止派工。請告訴使用者。'); process.exit(3); }
  if (!fresh && KEY_RE.test(r.out)) { console.log('金鑰無效或沒有權限，請檢查 GEMINI_API_KEY。'); process.exit(1); }
  if (!fresh) { console.log('Gemini 沒有交出新的 block.js，請看 ' + path.relative(ROOT, dir) + '/run.log'); process.exit(2); }
  const s = syntaxOk(block);
  if (!s.ok) { console.log('block.js 語法錯誤：\n' + s.err); process.exit(2); }
  console.log('完成：' + path.relative(ROOT, block) + '（說明在 report.md）');
  process.exit(0);
}

function status() {
  if (!fs.existsSync(WORK)) return console.log('還沒有任何任務。');
  for (const t of fs.readdirSync(WORK)) {
    const b = path.join(WORK, t, 'block.js');
    console.log(t + '：' + (fs.existsSync(b) ? (syntaxOk(b).ok ? '已交件' : '交件但語法錯誤') : '未完成'));
  }
}

(async () => {
  const [cmd, a1, a2] = process.argv.slice(2);
  if (cmd === 'check') {
    console.log('GEMINI_API_KEY：' + (hasKey() ? '已設定' : '未設定'));
    const v = spawnSync('gemini', ['--version'], { encoding: 'utf8', shell: process.platform === 'win32' });
    console.log('gemini 指令：' + (v.status === 0 ? v.stdout.trim() : '找不到（請照 SETUP.md 安裝）'));
  } else if (cmd === 'run' || cmd === 'fix') {
    if (!a1 || !a2) { console.log('用法：dispatch.js ' + cmd + ' <任務代號> <任務檔.md>'); process.exit(1); }
    await dispatch(a1, a2, { fix: cmd === 'fix' });
  } else if (cmd === 'status') {
    status();
  } else {
    console.log(fs.readFileSync(__filename, 'utf8').split('\n').slice(1, 17).join('\n'));
  }
})();
