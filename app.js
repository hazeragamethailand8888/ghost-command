import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getAuth, connectAuthEmulator, onAuthStateChanged, signInAnonymously, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import { getFirestore, connectFirestoreEmulator, doc, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';
import * as E from './engine.js';

const app = initializeApp(firebaseConfig), auth = getAuth(app), fs = getFirestore(app);
if (new URLSearchParams(location.search).get('emu')) { connectAuthEmulator(auth, 'http://localhost:9099'); connectFirestoreEmulator(fs, 'localhost', 8080); }
const FEE = { soul: 200, hp: 300 }, START_COINS = 1000;
let G = null;   // local game state (the engine runs in this browser; no server)

const KEYS = [...'grbp'].flatMap(s => Array.from({ length: 13 }, (_, i) => s + i)).concat(['curse','prot','fort','joker','back','swap','heal','asura','cover','s0','s1','s2','s3','s4','s5','s6','s7']);
const STAT = ['จุดธูปเรียกวิญญาณ','สับสำรับไพ่ 60 ใบ','ผนึกคำสาปลงบนไพ่','ผีกำลังตื่น','พร้อมแล้ว'];
const PICK = new Set(['p9', 'p12', 'sp8']);
const $ = s => document.querySelector(s), sleep = ms => new Promise(r => setTimeout(r, ms));
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, m => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[m]));
const fmt = n => Number(n || 0).toLocaleString('th-TH');
const fx = c => c.desc || '';
const cn = c => c.x ? c.name : `${c.r} ${c.name}`;

const ui = { scr: 'load', pc: 0, ready: false, target: 0, authReady: false, mode: 'soul', n: 3, fee: 0, code: new URLSearchParams(location.search).get('room') || '', dlg: null, sel: -1, busy: false, pops: [], coins: null, profile: null, T: null, hand: [], email: '', pass: '', name: '', reg: false, board: null, msg: '', tid: null, sc: {}, shown: -1, noScare: false };
let user = null, unsubs = [], tUnsubs = [], tt = null;
function toast(m) { ui.msg = m; render(); clearTimeout(tt); tt = setTimeout(() => { ui.msg = ''; render(); }, 3500); }

/* audio */
let AC=null,muted=false,amb=null;
function ac(){try{AC=AC||new(window.AudioContext||window.webkitAudioContext)();if(AC.state==='suspended')AC.resume()}catch(e){}return AC}
function tone(f,d,type='sine',v=.15,f2,delay=0){const a=ac();if(!a||muted)return;const t=a.currentTime+delay,o=a.createOscillator(),g=a.createGain();o.type=type;o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+d);g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(a.destination);o.start(t);o.stop(t+d+.02)}
function noise(d,v=.2,fr=1200,delay=0){const a=ac();if(!a||muted)return;const n=a.sampleRate*d|0,b=a.createBuffer(1,n,a.sampleRate),x=b.getChannelData(0);for(let i=0;i<n;i++)x[i]=(Math.random()*2-1)*(1-i/n);const s=a.createBufferSource(),f=a.createBiquadFilter(),g=a.createGain();s.buffer=b;f.type='bandpass';f.frequency.value=fr;g.gain.value=v;s.connect(f);f.connect(g);g.connect(a.destination);s.start(a.currentTime+delay)}
const SFX={card:()=>noise(.12,.25,2500),hit:()=>{tone(150,.35,'sine',.35,40);noise(.2,.3,500)},curse:()=>{tone(90,.9,'sawtooth',.12,45);tone(93,.9,'sawtooth',.1,47);noise(.5,.1,300)},prot:()=>{tone(880,.8,'sine',.12);tone(1320,.9,'sine',.08)},ward:()=>tone(520,.3,'triangle',.1),heal:()=>{tone(440,.3,'sine',.12);tone(660,.5,'sine',.12,0,.12)},win:()=>[392,494,587,784].forEach((f,i)=>tone(f,.6,'triangle',.14,0,i*.14)),lose:()=>[330,277,220,165].forEach((f,i)=>tone(f,.8,'sawtooth',.08,0,i*.25)),click:()=>tone(300,.06,'square',.05)};
SFX.scream=()=>{const a=ac();if(!a||muted)return;tone(500,.9,'sawtooth',.24,1400);tone(530,.9,'sawtooth',.2,1350);tone(95,1.8,'square',.22,40);noise(1.8,.5,1800);tone(720,.9,'sawtooth',.22,1700,.7);noise(.8,.4,2500,.7)};
async function scare(){if(ui.noScare||ui.scaring||(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches))return;
 ui.scaring=1;if(amb)amb.gain.value=0;await sleep(450);
 const d=document.createElement('div');d.id='scare';{const k=Math.random()*8|0;d.innerHTML='<div class="g i-s'+k+'" style="background-position:50% '+(38-120*[.09,.09,.37,.13,.07,.31,.12,.06][k]).toFixed(1)+'vh;--z:'+[1,1,.55,1,1,1,1,1][k]+'"></div>'};document.body.appendChild(d);sfx('scream');
 await sleep(2000);d.remove();if(amb&&!muted)amb.gain.value=.05;ui.scaring=0}
function sfx(k){try{SFX[k]&&SFX[k]()}catch(e){}}
function ambient(){const a=ac();if(!a||amb)return;const g=a.createGain();g.gain.value=muted?0:.05;[55,55.7,110.3].forEach(f=>{const o=a.createOscillator();o.type='sine';o.frequency.value=f;o.connect(g);o.start()});g.connect(a.destination);amb=g}
function setMute(m){muted=m;if(amb)amb.gain.value=m?0:.05;render()}



/* ---- account & wallet (Firestore: users/{uid}) ---- */
async function loadUser(u) {
  let d = null;
  try { const s = await getDoc(doc(fs, 'users', u.uid)); d = s.exists() ? s.data() : null; } catch (e) { toast('โหลดข้อมูลผู้เล่นไม่สำเร็จ'); }
  if (!d) {
    d = { name: (ui.name || '').trim().slice(0, 16) || 'ผู้เล่น' + u.uid.slice(0, 4), coins: START_COINS, wins: 0, games: 0, soulWins: 0 };
    try { await setDoc(doc(fs, 'users', u.uid), d); } catch (e) { toast('สร้างบัญชีไม่สำเร็จ'); }
  }
  ui.coins = d.coins; ui.profile = d;
  if (relief()) await saveUser();
}
async function saveUser() {
  if (!user || !ui.profile) return;
  ui.profile.coins = ui.coins;
  try { await setDoc(doc(fs, 'users', user.uid), ui.profile); } catch (e) { toast('บันทึกข้อมูลไม่สำเร็จ'); }
}
onAuthStateChanged(auth, async u => {
  user = u;
  if (u) { await loadUser(u); if (ui.scr === 'auth') ui.scr = 'menu'; }
  else { ui.profile = null; ui.coins = null; if (ui.scr !== 'load') { closeTable(true); ui.scr = 'auth'; } }
  ui.authReady = true; render();
});
const AUTH_ERR = { 'auth/invalid-credential': 'อีเมลหรือรหัสผ่านไม่ถูกต้อง', 'auth/email-already-in-use': 'อีเมลนี้สมัครแล้ว', 'auth/weak-password': 'รหัสผ่านอย่างน้อย 6 ตัว', 'auth/invalid-email': 'อีเมลไม่ถูกต้อง', 'auth/network-request-failed': 'เชื่อมต่ออินเทอร์เน็ตไม่ได้' };
async function authDo(kind) {
  try {
    if (kind === 'guest') await signInAnonymously(auth);
    else if (kind === 'login') await signInWithEmailAndPassword(auth, ui.email.trim(), ui.pass);
    else { if (!ui.name.trim()) return toast('ใส่ชื่อผู้เล่นก่อน'); await createUserWithEmailAndPassword(auth, ui.email.trim(), ui.pass); }
  } catch (e) { toast(AUTH_ERR[e.code] || e.message); }
}


const mySeat = () => ui.T ? ui.T.seats.findIndex(s => s.uid === (user && user.uid)) : -1;
function effects(p, t) {
  const me = mySeat();
  if (t.last && (!p.last || p.last.id !== t.last.id)) sfx(t.last.k === 'curse' ? 'curse' : 'card');
  (t.evt.list || []).forEach(e => { ui.pops.push({ i: e.i, txt: e.txt, t: Date.now() }); if (e.txt[0] === '-') sfx('hit'); else if (e.txt.startsWith('🛡')) sfx('prot'); else if (e.txt[0] === '+') sfx('heal'); });
  if (me >= 0 && p.seats[me] && t.seats[me]) {
    const a = p.seats[me].hp, b = t.seats[me].hp;
    if (b < a) { document.body.classList.add('hurt'); setTimeout(() => document.body.classList.remove('hurt'), 650); }
    const th = [25, 12].find(x => a > x && b <= x && !ui.sc[x]);
    if (th) { ui.sc[th] = 1; scare(); }
    else if (b < a && (t.evt.list || []).some(e => e.i === me && e.txt === 'curse') && Math.random() < .35) scare();
  }
}
/* ---- local game (engine runs in the browser) ---- */
function closeTable(quiet) {
  G = null; ui.T = null; ui.hand = []; ui.pending = null; ui.dlg = null; ui.sel = -1; ui.busy = false;
  if (!quiet) { ui.scr = 'menu'; render(); }
}
function push() {
  G.seq++;
  const prev = ui.T, T = E.publicState(G);
  T.status = G.over ? 'over' : 'playing'; T.kind = 'solo'; T.deadline = 0; T.max = G.seats.length;
  if (G.over) { const w = G.seats[G.over.seat]; T.payout = { to: w.uid || null, amount: w.uid ? G.fee * G.seats.length : 0 }; }
  ui.T = T; ui.hand = G.hands[0]; ui.pending = G.pending && G.pending.seat === 0 ? G.pending : null; ui.scr = 'table';
  if (prev && prev.evt && prev.evt.n !== T.evt.n) effects(prev, T);
  render();
}
async function settle(g) {
  const won = g.over && g.over.seat === 0, p = ui.profile;
  if (won) ui.coins += g.fee * g.seats.length;
  p.games = (p.games || 0) + 1;
  if (won) { p.wins = (p.wins || 0) + 1; if (g.mode === 'soul') p.soulWins = (p.soulWins || 0) + 1; }
  relief();
  await saveUser();
}
function relief() {   // coins below 200 -> the system adds 500 immediately
  if (ui.coins < 200) { ui.coins += 500; toast('เหรียญเหลือน้อย ระบบเพิ่มให้ 🪙500'); return true; }
  return false;
}
async function skipToEnd() {   // after you are out: jump straight to the result
  const g = G; if (!g || g.over || ui.busy) return;
  ui.busy = true; let n = 0;
  while (!g.over && n++ < 3000 && g.seats[g.turn].bot) E.botTurn(g, g.turn, Date.now());
  push(); await botsLoop(); ui.busy = false; render();
}
async function botsLoop() {
  const g = G;
  while (G === g && !g.over && g.seats[g.turn].bot) { await sleep(900); if (G !== g) return; E.botTurn(g, g.turn, Date.now()); push(); }
  if (G === g && g.over && !g.settled) { g.settled = true; sfx(g.over.seat === 0 ? 'win' : 'lose'); await settle(g); render(); }
}
async function startLocal() {
  const fee = FEE[ui.mode];
  if (relief()) await saveUser();
  if (ui.coins < fee) return toast('เหรียญไม่พอสำหรับโหมดนี้');
  ui.coins -= fee; await saveUser();
  const seats = [{ uid: user.uid, name: ui.profile.name }];
  for (let i = 0; i < ui.n - 1; i++) seats.push({ name: E.BOT_NAMES[i], bot: true });
  G = E.newGame({ seats, mode: ui.mode, fee, now: Date.now(), watch: true });
  ui.sc = {}; ui.sel = -1; ui.busy = false; ui.shown = -1; ui.pops = []; ui.T = null;
  push(); await botsLoop();
}
async function doAct(payload) {
  if (!G || ui.busy) return;
  ui.busy = true; ui.sel = -1; render();
  try { E.act(G, 0, payload, Date.now()); push(); await botsLoop(); }
  catch (e) { toast(typeof e === 'string' ? e : 'เกิดข้อผิดพลาด'); console.error(e); }
  ui.busy = false; render();
}

/* ---- loader ---- */
function boot() {
  const t0 = performance.now(), total = KEYS.length; let loaded = 0;
  const probe = document.createElement('div'); probe.style.cssText = 'position:absolute;left:-9999px;width:1px;height:1px'; document.body.appendChild(probe);
  setTimeout(() => { ui.authReady = true; }, 8000);
  (async () => {
    for (const k of KEYS) {
      probe.className = 'i-' + k; const m = /url\("?(.+?)"?\)/.exec(getComputedStyle(probe).backgroundImage);
      if (m) await new Promise(r => { const im = new Image(); im.onload = im.onerror = r; im.src = m[1]; });
      loaded++;
    }
    try { await document.fonts.ready; } catch (e) {}
    ui.target = 1;
  })();
  (function tick() {
    const el = (performance.now() - t0) / 3000, tgt = Math.min(ui.target === 1 ? 1 : loaded / total * .9, el);
    ui.pc += (tgt - ui.pc) * .12 + (tgt > ui.pc ? .002 : 0); ui.pc = Math.min(ui.pc, 1);
    if (ui.pc >= .995 && ui.target === 1 && el >= 1 && ui.authReady) { ui.pc = 1; ui.ready = true; }
    if (ui.scr === 'load') render();
    if (!ui.ready) requestAnimationFrame(tick);
  })();
}

/* ---- views ---- */
const cover = inner => `<div class="cover bgc i-cover"><div class="dock">${inner}</div></div>`;
const pips = (p, T) => T.mode === 'soul' ? `<div class="pips">${Array.from({ length: 10 }, (_, i) => `<u class="${i < p.soul ? 'f' : ''}"></u>`).join('')}</div>` : '';
const tags = p => [p.shield > 0 ? '🛡' + p.shield : '', p.curse > 0 ? 'คำสาป' : '', p.skip ? 'ตาพร่า' : '', p.noDraw ? 'ห้ามจั่ว' : '', p.noExtra ? 'จั่วเพิ่มไม่ได้' : '', p.bleed > 0 ? 'เลือด−' + p.bleed : '', p.sealed > 0 ? 'ผนึก' : '', p.reflectAll || p.reflectN ? 'สะท้อน' : '', p.blockAtk ? 'กันโจมตี' : '', p.blockAny ? 'ยันต์' : '', p.ward ? 'กันสาป' : '', p.redirect ? 'เปลี่ยนเป้า' : '', p.boost > 0 ? 'พลัง+' + p.boost : ''].filter(Boolean).join(' · ');
function plHtml(p, i, T) {
  const n = Math.min(3, Math.max(1, p.hand.length));
  const ps = ui.pops.filter(x => x.i === i && Date.now() - x.t < 900 && x.txt !== 'curse').map(x => `<span class="dmg ${x.txt[0] === '+' ? 'heal' : ''}" style="animation-delay:-${Date.now() - x.t}ms">${esc(x.txt)}</span>`).join('');
  return `<div class="pl ${i === T.turn && T.status === 'playing' ? 'cur' : ''} ${p.alive ? '' : 'dead'}">${ps}<div class="mini">${'<div class="i-back"></div>'.repeat(n)}<b>${p.hand.length}</b></div>
  <div class="nm"><div>${esc(p.name)}${p.bot ? ' 👻' : ''}</div><div class="bar"><i style="width:${p.hp * 2}%"></i></div><div class="tg">HP ${p.hp} ${tags(p)}</div>${pips(p, T)}</div>${(p.rev || []).length ? `<div class="rv">${p.rev.map(c => `<i class="i-${c.img}" title="${esc(c.name)}"></i>`).join('')}</div>` : ''}</div>`;
}
function loadHtml() {
  const pc = Math.round(ui.pc * 100), st = STAT[pc >= 100 ? 4 : Math.floor(pc / 25)];
  if (!ui.ready) return cover(`<div class="ld"><div class="st">${st}…</div><div class="pc">${pc}%</div></div><div class="thread"><i style="width:${pc}%"></i></div>`);
  return cover(`<div class="thread"><i style="width:100%"></i></div><button class="enter" data-a="enter">แตะเพื่อเข้าสู่เกม</button>`);
}
function authHtml() {
  return cover(`<div class="authbox"><h2 style="font-size:22px;color:var(--gold);margin-bottom:6px">${ui.reg ? 'สมัครบัญชี' : 'เข้าสู่ระบบ'}</h2>
  ${ui.reg ? `<input id="name" class="inp" maxlength="16" placeholder="ชื่อผู้เล่น" value="${esc(ui.name)}">` : ''}
  <input id="email" class="inp" type="email" placeholder="อีเมล" autocomplete="email" value="${esc(ui.email)}">
  <input id="pass" class="inp" type="password" placeholder="รหัสผ่าน (6 ตัวขึ้นไป)" autocomplete="${ui.reg ? 'new-password' : 'current-password'}" value="${esc(ui.pass)}">
  <div class="row" style="display:flex;gap:8px"><button class="go" style="flex:1;padding:12px;font-size:18px" data-a="${ui.reg ? 'register' : 'login'}">${ui.reg ? 'สมัครและรับ 🪙1,000' : 'เข้าสู่ระบบ'}</button></div>
  <div class="links" style="margin-top:8px"><button class="lnk" data-a="togreg">${ui.reg ? 'มีบัญชีแล้ว? เข้าสู่ระบบ' : 'ยังไม่มีบัญชี? สมัครฟรี'}</button><button class="lnk" data-a="guest">เล่นแบบแขก (เล่นกับผีเท่านั้น)</button></div></div>`);
}
function menuHtml() {
  return cover(`<div class="menu" style="gap:10px">
  <button class="big" data-a="dlg" data-v="solo">เล่นกับผี<small>ค่าเข้า 🪙${FEE.soul}–${FEE.hp}</small></button></div>
  <div class="links"><button class="lnk" data-a="dlg" data-v="rules">วิธีเล่น</button><button class="lnk" data-a="dlg" data-v="name">เปลี่ยนชื่อ</button><button class="lnk" data-a="logout">ออกจากระบบ</button></div>`);
}
function tableHtml() {
  const T = ui.T, me = mySeat(); if (me < 0) return '';
  const ps = T.seats.map((s, i) => Object.assign({}, s, { hand: i === me ? ui.hand : new Array(s.hand).fill(0) }));
  const m = ps[me], order = []; for (let k = 1; k < ps.length; k++) order.push((me + k) % ps.length);
  const playing = T.status === 'playing', my = playing && T.turn === me && m.alive;
  const on = my && !ui.busy && !ui.dlg && !(T.pending), sc = ui.sel >= 0 ? m.hand[ui.sel] : null;
  const last = T.last; let lastHtml = '';
  if (last) { const anim = ui.shown !== last.id ? 'pop' : ''; ui.shown = last.id; lastHtml = `<div class="i-${last.img} ${anim}"></div>`; }
  const turnName = ps[T.turn] ? ps[T.turn].name : '';
  const ov = T.over ? T.seats[T.over.seat] : null;
  const pay = T.payout ? (T.payout.to === user.uid ? `ได้รับ +🪙${fmt(T.payout.amount)}` : `เสียค่าเข้า −🪙${fmt(T.fee)}`) : 'กำลังคำนวณเหรียญ…';
  return `<div class="tbl"><div class="bd bgc i-cover"></div>
  <div class="opps">${order.map(i => plHtml(ps[i], i, T)).join('')}</div>
  <div class="mid"><div class="log" aria-live="polite">${T.log.slice(0, 4).map(l => `<div>${esc(l)}</div>`).join('')}</div>
   <div class="piles"><div class="pile deck i-back"><small>กองจั่ว ${T.deckN}</small></div><div class="pile dis">${lastHtml}<small>กองทิ้ง ${T.discardN}</small></div></div>
   <div class="info">${sc ? `<div><b>${esc(cn(sc))}</b></div><div>${esc(fx(sc))}</div><div style="color:var(--mut);font-size:13px">${sc.key === 'sp7' ? 'ทำงานอัตโนมัติเมื่อ HP หมด' : 'กด “เล่นไพ่” เพื่อใช้'}</div>` : `<div>${my ? 'เทิร์นของคุณ' : playing ? (m.alive ? '' : 'คุณแพ้แล้ว · กำลังดูต่อจนจบ · ') + 'รอเทิร์นของ ' + esc(turnName) + '' : 'จบเกม'}</div><div style="color:var(--mut);font-size:13px">🪙กอง ${fmt(T.fee * T.seats.length)}</div>`}</div></div>
  <div class="bot"><div class="me ${my ? 'cur' : ''}"><b>${esc(m.name)}</b><div class="bar"><i style="width:${m.hp * 2}%"></i></div><div class="tg">HP ${m.hp} · 🪙${fmt(ui.coins)} ${tags(m)}</div>${pips(m, T)}</div>
   <div class="hand" style="--ov:${m.hand.length <= 4 ? -10 : m.hand.length === 5 ? -22 : m.hand.length === 6 ? -34 : -44}px">${m.hand.map((c, i) => `<button class="c i-${c.img} ${i === ui.sel ? 'sel' : ''} ${on ? 'ok' : ''}" data-a="card" data-i="${i}" aria-label="${esc(cn(c))}" ${on ? '' : 'disabled'}></button>`).join('')}</div>
   <div class="btns">${!m.alive && !T.over ? '<button class="pass" data-a="skip">ข้ามไปดูผล</button>' : `<button class="play" data-a="play" ${on && sc && sc.key !== 'sp7' ? '' : 'disabled'}>เล่นไพ่</button><button class="pass" data-a="pass" ${on ? '' : 'disabled'}>ข้ามเทิร์น</button>`}</div></div></div>
  <button class="acct" data-a="dlg" data-v="leave">⎋ ออก</button>${pendingHtml(T, me)}
  ${ov ? `<div class="modal"><div class="box" style="text-align:center"><h2>${ov.uid === user.uid ? 'คุณชนะ' : esc(ov.name) + ' ชนะ'}</h2><p class="serif" style="color:var(--gold)">${pay}</p><div class="row"><button data-a="done">กลับหน้าหลัก</button></div></div></div>` : ''}`;
}
function pendingHtml(T, me) {
  const pd = ui.pending; if (!pd || !T.pending || T.pending.seat !== me || T.over) return '';
  if (pd.kind === 'peek') { const c = pd.cards[0]; return `<div class="modal"><div class="box" style="text-align:center"><h2>ไพ่บนสุดของกองจั่ว</h2><div class="pkgrid"><div class="c i-${c.img}" style="margin:0"></div></div><p><b>${esc(cn(c))}</b><br>${esc(fx(c))}</p><div class="row"><button data-a="choose" data-i="0">เก็บเข้ามือ</button><button data-a="choose" data-i="1">วางใต้กอง</button></div></div></div>`; }
  return `<div class="modal"><div class="box" style="text-align:center"><h2>จั่ว 2 ใบ แล้วทิ้ง 1 ใบ</h2><p>แตะใบที่ต้องการ<b>ทิ้ง</b></p><div class="pkgrid">${pd.cards.map((c, i) => `<button class="c i-${c.img}" style="margin:0" data-a="choose" data-i="${i}" aria-label="${esc(cn(c))}"></button>`).join('')}</div><p style="color:var(--mut)">${pd.cards.map(c => esc(cn(c))).join(' / ')}</p></div></div>`;
}
function candsOf(c) { const D = (ui.T && ui.T.discard) || []; return c.key === 'p9' ? D : c.key === 'p12' ? D.filter(x => x.s && x.v <= 10) : c.key === 'sp8' ? D.filter(x => x.key !== 'sp8' && x.key !== 'sp7') : []; }
function startPlay(c) {
  ui.pl = { card: c.id, pick: undefined };
  if (PICK.has(c.key)) { if (candsOf(c).length) { ui.dlg = 'pick'; render(); return; } }
  resolvePlay();
}
function resolvePlay() {
  const c = ui.hand.find(x => x.id === ui.pl.card); if (!c) return;
  let t = !!c.t;
  if (PICK.has(c.key) && c.key !== 'p9' && ui.pl.pick != null) { const s = (ui.T.discard || []).find(x => x.id === ui.pl.pick); t = !!(s && s.t); }
  if (!t) return doAct({ type: 'play', card: c.id, pick: ui.pl.pick });
  const me = mySeat(), tg = ui.T.seats.map((s, i) => i !== me && s.alive ? i : -1).filter(i => i >= 0);
  if (tg.length === 1) return doAct({ type: 'play', card: c.id, pick: ui.pl.pick, target: tg[0] });
  ui.dlg = 'target'; render();
}
function rulesBody() {
  return `เริ่มด้วย HP 50 และไพ่ 5 ใบ ทุกเทิร์นจั่ว 1 ใบ แล้วเล่นไพ่ได้ไม่เกิน 1 ใบ หรือข้ามเทิร์น มือเกิน 7 ใบต้องทิ้ง <br><b>แตะไพ่เพื่อดูความสามารถ</b> · ทอง = โจมตีแรง · แดง = คำสาปและโจมตีต่อเนื่อง · น้ำเงิน = โล่ ฟื้นฟู ป้องกัน · ม่วง = กลยุทธ์<br><b>สถานะ:</b> โล่ N หน่วยกันความเสียหายได้ N (สูงสุด 12) · ติดคำสาป = รับความเสียหายเพิ่ม +1 จนจบเทิร์นของตัวเอง · ตาพร่า = ข้ามการเล่นไพ่ · เลือด = เสีย HP ต้นเทิร์น · ผนึก = ไพ่ J/Q/K ไพ่ม่วง และไพ่พิเศษใช้ไม่ได้ ไพ่เลขทำได้เฉพาะผลหลัก · ไพ่คืนชีพทำงานอัตโนมัติเมื่อ HP หมด<br><b>ชิงวิญญาณ:</b> ถึง 10 แต้มก่อนชนะ ได้แต้มจากไพ่ K ทอง การโจมตีแรง 4 ขึ้นไป (+1) และกำจัดผู้เล่น (+2) · <b>คืนอาถรรพ์:</b> รอดเป็นคนสุดท้าย<br><b>เหรียญ:</b> เริ่มต้นฟรี 1,000 · ค่าเข้าชิงวิญญาณ 200 / คืนอาถรรพ์ 300 ผีบอทออกค่าเข้าเท่ากัน ผู้ชนะรับกองทั้งหมด เหรียญใช้ในเกมเท่านั้น ไม่แลกเป็นเงินจริง<br><span style="color:var(--mut)">คำเตือน: มีฉากผีจั๊มสแกร์ (แสงวาบและเสียงดัง) ปิดได้ที่ปุ่ม 👻</span>`;
}
const modeBtns = () => `<div class="row" style="display:flex;gap:8px"><button class="opt ${ui.mode === 'soul' ? 'on' : ''}" data-a="mode" data-v="soul">ชิงวิญญาณ</button><button class="opt ${ui.mode === 'hp' ? 'on' : ''}" data-a="mode" data-v="hp">คืนอาถรรพ์</button></div>`;
const nBtns = (a, b) => `<div class="row" style="display:flex;gap:8px;align-items:center"><span>ผู้เล่น</span>${[2, 3, 4].filter(x => x >= a && x <= b).map(x => `<button class="opt ${ui.n === x ? 'on' : ''}" data-a="n" data-v="${x}">${x}</button>`).join('')}</div>`;
function dlgHtml() {
  const d = ui.dlg, close = '<button data-a="close">ปิด</button>';
  let h = '';
  if (d === 'solo') { const f = FEE[ui.mode]; h = `<h2>เล่นกับผี</h2>${modeBtns()}${nBtns(2, 4)}<p>ค่าเข้า 🪙${fmt(f)} · ผู้ชนะรับ 🪙${fmt(f * ui.n)}${ui.coins != null && ui.coins < f ? ' · <span style="color:#ff6b6b">เหรียญไม่พอ</span>' : ''}</p><div class="row"><button data-a="go-solo">เริ่มเกม</button>${close}</div>`; }
  else if (d === 'rules') h = `<h2>วิธีเล่น</h2>${rulesBody()}<div class="row">${close}</div>`;
  else if (d === 'name') h = `<h2>เปลี่ยนชื่อ</h2><input id="name" class="inp" maxlength="16" value="${esc(ui.name || (ui.profile && ui.profile.name) || '')}"><div class="row"><button data-a="go-name">บันทึก</button>${close}</div>`;
  else if (d === 'target') { const T = ui.T, me = mySeat(); h = `<h2>เลือกเป้าหมาย</h2><div class="row">${T.seats.map((s, i) => i !== me && s.alive ? `<button data-a="tgt" data-i="${i}">${esc(s.name)} · HP ${s.hp}</button>` : '').join('')}</div><div class="row">${close}</div>`; }
  else if (d === 'pick') { const c = ui.hand.find(x => x.id === ui.pl.card); h = `<h2>${c && c.key === 'p9' ? 'เลือกไพ่จากกองทิ้งขึ้นมือ' : 'เลือกไพ่จากกองทิ้งที่จะใช้ความสามารถ'}</h2><div class="pkgrid">${(c ? candsOf(c) : []).map(x => `<button class="c i-${x.img}" data-a="pickc" data-i="${x.id}" aria-label="${esc(cn(x))}"></button>`).join('')}</div><div class="row">${close}</div>`; }
  else if (d === 'leave') h = `<h2>ออกจากโต๊ะ?</h2><p>ถ้าออกระหว่างเล่นจะถือว่าแพ้และเสียค่าเข้า</p><div class="row"><button data-a="go-leave">ออกจากโต๊ะ</button>${close}</div>`;
  return `<div class="modal"><div class="box">${h}</div></div>`;
}
function chrome() {
  const menu = ui.scr === 'menu';
  return `<button class="mute" data-a="mute" aria-label="เปิดปิดเสียง">${muted ? '🔇' : '🔊'}</button><button class="mute sc" data-a="noscare" aria-label="เปิดปิดผีจั๊มสแกร์">👻 ${ui.noScare ? 'ปิด' : 'เปิด'}</button>` +
    (menu ? `<button class="acct" data-a="dlg" data-v="name">🪙 ${fmt(ui.coins)} · 👤 ${esc(ui.profile ? ui.profile.name : '…')}${ui.profile && ui.profile.games ? ' · ชนะ ' + (ui.profile.wins || 0) + '/' + ui.profile.games : ''}</button>` : '');
}
function render() {
  const A = document.getElementById('app'), f = document.activeElement, fid = f && f.id, ss = f && f.selectionStart;
  ui.pops = ui.pops.filter(x => Date.now() - x.t < 900);
  const body = ui.scr === 'load' ? loadHtml() : ui.scr === 'auth' ? authHtml() : ui.scr === 'menu' ? menuHtml() : ui.scr === 'table' && ui.T ? tableHtml() : cover('<div class="ld"><div class="st">กำลังเชื่อมต่อ…</div></div>');
  A.innerHTML = body + chrome() + (ui.dlg ? dlgHtml() : '') + (ui.msg ? `<div class="toast">${esc(ui.msg)}</div>` : '');
  if (fid) { const e = document.getElementById(fid); if (e) { e.focus(); try { e.setSelectionRange(ss, ss); } catch (x) {} } }
}

/* ---- events ---- */
document.addEventListener('input', e => { const i = e.target.id; if (i === 'email') ui.email = e.target.value; else if (i === 'pass') ui.pass = e.target.value; else if (i === 'name') ui.name = e.target.value; else if (i === 'fee') ui.fee = Math.floor(+e.target.value) || 0; else if (i === 'code') ui.code = e.target.value.toUpperCase(); });
document.addEventListener('click', async e => {
  const b = e.target.closest('[data-a]'); if (!b || b.disabled) return;
  const a = b.dataset.a, v = b.dataset.v; sfx('click');
  if (a === 'enter') {
    ui.scr = user ? 'menu' : 'auth'; ambient();
    try { document.documentElement.requestFullscreen && document.documentElement.requestFullscreen().catch(() => {}); screen.orientation.lock('landscape').catch(() => {}); } catch (x) {}
    render();
  }
  else if (a === 'mute') setMute(!muted);
  else if (a === 'noscare') { ui.noScare = !ui.noScare; render(); }
  else if (a === 'togreg') { ui.reg = !ui.reg; render(); }
  else if (a === 'login' || a === 'register' || a === 'guest') authDo(a);
  else if (a === 'logout') { signOut(auth); }
  else if (a === 'dlg') { ui.dlg = v; render(); }
  else if (a === 'close') { ui.dlg = null; render(); }
  else if (a === 'mode') { ui.mode = v; render(); }
  else if (a === 'n') { ui.n = +v; render(); }
  else if (a === 'go-solo') { ui.dlg = null; startLocal(); }
  else if (a === 'go-name') { ui.dlg = null; const n = (ui.name || '').trim().slice(0, 16); if (n && ui.profile) { ui.profile.name = n; saveUser(); } render(); }
  else if (a === 'skip') skipToEnd();
  else if (a === 'go-leave') closeTable();
  else if (a === 'done') closeTable();
  else if (a === 'card') { ui.sel = +b.dataset.i === ui.sel ? -1 : +b.dataset.i; render(); }
  else if (a === 'pass') doAct({ type: 'pass' });
  else if (a === 'play') { const c = ui.hand[ui.sel]; if (c && c.key !== 'sp7') startPlay(c); }
  else if (a === 'pickc') { ui.pl.pick = +b.dataset.i; ui.dlg = null; resolvePlay(); }
  else if (a === 'choose') doAct({ type: 'choose', pick: +b.dataset.i });
  else if (a === 'tgt') { ui.dlg = null; if (ui.pl) doAct({ type: 'play', card: ui.pl.card, pick: ui.pl.pick, target: +b.dataset.i }); else render(); }
});
render(); boot();