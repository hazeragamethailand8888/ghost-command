import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getAuth, connectAuthEmulator, onAuthStateChanged, signInAnonymously, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import { getFirestore, connectFirestoreEmulator, doc, getDoc, setDoc, updateDoc, addDoc, deleteDoc, collection, onSnapshot, writeBatch } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';
import * as E from './engine.js';
import { DICT, BOT_EN, CARD_EN, fmtLog } from './i18n.js';

const app = initializeApp(firebaseConfig), auth = getAuth(app), fs = getFirestore(app);
if (new URLSearchParams(location.search).get('emu')) { connectAuthEmulator(auth, 'http://localhost:9099'); connectFirestoreEmulator(fs, 'localhost', 8080); }

const FEE = { soul: 200, hp: 300 }, START_COINS = 1000, MIN_ROOM = 500, MAX_HP = 50;
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const KEYS = [...'grbp'].flatMap(s => Array.from({ length: 13 }, (_, i) => s + i)).concat(['curse', 'prot', 'fort', 'joker', 'back', 'swap', 'heal', 'asura', 'cover', 's0', 's1', 's2', 's3', 's4', 's5', 's6', 's7']);
const PICK = new Set(['p9', 'p12', 'sp8']);
const $ = s => document.querySelector(s), sleep = ms => new Promise(r => setTimeout(r, ms));
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
const fmt = n => Number(n || 0).toLocaleString('en-US');

/* ---------- settings & language ---------- */
const SKEY = 'gc_settings';
const S = Object.assign({ lang: 'en', master: 0.8, music: 0.5, sfx: 0.9, scare: true, mute: false }, (() => { try { return JSON.parse(localStorage.getItem(SKEY) || '{}'); } catch (e) { return {}; } })());
const saveS = () => { try { localStorage.setItem(SKEY, JSON.stringify(S)); } catch (e) {} };
const t = (k, ...a) => { const d = DICT[S.lang] || DICT.en, v = k in d ? d[k] : DICT.en[k]; return typeof v === 'function' ? v(...a) : v; };
const nm = n => (S.lang === 'en' && BOT_EN[n]) || n || '';
const cardName = c => S.lang === 'th' ? ((E.CARDS[c.key] || {}).name || c.name) : ((CARD_EN[c.key] || [])[0] || c.name);
const cardDesc = c => S.lang === 'th' ? ((E.CARDS[c.key] || {}).desc || c.desc) : ((CARD_EN[c.key] || [])[1] || c.desc);
const labelOf = (k, r) => { const n = S.lang === 'th' ? (E.CARDS[k] || {}).name : (CARD_EN[k] || [])[0]; return r ? `${r} ${n}` : n; };
const cn = c => c.x ? cardName(c) : `${c.r} ${cardName(c)}`;
const logText = e => fmtLog(S.lang, e, labelOf, nm);

const ui = { scr: 'load', pc: 0, ready: false, target: 0, authReady: false, mode: 'soul', n: 3, fee: MIN_ROOM, code: (new URLSearchParams(location.search).get('room') || '').toUpperCase().slice(0, 5), dlg: null, sel: -1, busy: false, pops: [], coins: 0, profile: null, T: null, hand: [], pending: null, room: null, mp: null, hostLost: false, email: '', pass: '', name: '', reg: false, msg: '', sc: {}, shown: -1, pl: null };
let user = null, G = null, RG = null, tt = null;
function toast(m) { ui.msg = m; render(); clearTimeout(tt); tt = setTimeout(() => { ui.msg = ''; render(); }, 3500); }
function applyLang() {
  document.documentElement.lang = S.lang;
  const r = $('#rot'); if (r) r.innerHTML = `<i>📱</i><div class="serif" style="font-size:20px">${esc(t('rotate'))}</div><div style="color:var(--mut)">${esc(t('rotateSub'))}</div>`;
}

/* ---------- audio ---------- */
let AC = null, MG = null, MU = null, SX = null, amb = null;
function ac() {
  try {
    if (!AC) { AC = new (window.AudioContext || window.webkitAudioContext)(); MG = AC.createGain(); MU = AC.createGain(); SX = AC.createGain(); MU.connect(MG); SX.connect(MG); MG.connect(AC.destination); applyVol(); }
    if (AC.state === 'suspended') AC.resume();
  } catch (e) {}
  return AC;
}
function applyVol() { if (!AC) return; MG.gain.value = S.mute ? 0 : S.master; MU.gain.value = S.music; SX.gain.value = S.sfx; }
function tone(f, d, type = 'sine', v = 0.15, f2, delay = 0) {
  const a = ac(); if (!a) return;
  const at = a.currentTime + delay, o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(f, at); if (f2) o.frequency.exponentialRampToValueAtTime(f2, at + d);
  g.gain.setValueAtTime(v, at); g.gain.exponentialRampToValueAtTime(0.0001, at + d);
  o.connect(g); g.connect(SX); o.start(at); o.stop(at + d + 0.02);
}
function noise(d, v = 0.2, fr = 1200, delay = 0) {
  const a = ac(); if (!a) return;
  const n = a.sampleRate * d | 0, b = a.createBuffer(1, n, a.sampleRate), x = b.getChannelData(0);
  for (let i = 0; i < n; i++) x[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
  s.buffer = b; f.type = 'bandpass'; f.frequency.value = fr; g.gain.value = v; s.connect(f); f.connect(g); g.connect(SX); s.start(a.currentTime + delay);
}
const SFX = {
  card: () => noise(0.12, 0.25, 2500), hit: () => { tone(150, 0.35, 'sine', 0.35, 40); noise(0.2, 0.3, 500); },
  curse: () => { tone(90, 0.9, 'sawtooth', 0.12, 45); tone(93, 0.9, 'sawtooth', 0.1, 47); noise(0.5, 0.1, 300); },
  prot: () => { tone(880, 0.8, 'sine', 0.12); tone(1320, 0.9, 'sine', 0.08); }, ward: () => tone(520, 0.3, 'triangle', 0.1),
  heal: () => { tone(440, 0.3, 'sine', 0.12); tone(660, 0.5, 'sine', 0.12, 0, 0.12); },
  win: () => [392, 494, 587, 784].forEach((f, i) => tone(f, 0.6, 'triangle', 0.14, 0, i * 0.14)),
  lose: () => [330, 277, 220, 165].forEach((f, i) => tone(f, 0.8, 'sawtooth', 0.08, 0, i * 0.25)),
  click: () => tone(300, 0.06, 'square', 0.05),
  scream: () => { tone(500, 0.9, 'sawtooth', 0.24, 1400); tone(530, 0.9, 'sawtooth', 0.2, 1350); tone(95, 1.8, 'square', 0.22, 40); noise(1.8, 0.5, 1800); tone(720, 0.9, 'sawtooth', 0.22, 1700, 0.7); noise(0.8, 0.4, 2500, 0.7); },
};
/* real scream recordings (random pick, never the same twice in a row); synthetic scream is the fallback */
const SCREAMS = [['scream1.mp3', 2.6], ['scream2.mp3', 3.5], ['scream3.mp3', 3.5], ['scream4.mp3', 2.8]];
const SCREAM_BUF = []; let lastScream = -1;
function loadScreams() {
  const a = ac(); if (!a) return;
  SCREAMS.forEach(async ([f], i) => { try { const r = await fetch(f); SCREAM_BUF[i] = await a.decodeAudioData(await r.arrayBuffer()); } catch (e) {} });
}
function playScream() {            // returns how long the jump scare should last (seconds)
  const a = ac(), have = SCREAM_BUF.map((b, i) => b ? i : -1).filter(i => i >= 0);
  if (!a || !have.length) { sfx('scream'); return 2.0; }
  const pool = have.filter(i => i !== lastScream), pick = (pool.length ? pool : have)[Math.random() * (pool.length ? pool.length : have.length) | 0];
  lastScream = pick;
  const s = a.createBufferSource(); s.buffer = SCREAM_BUF[pick]; s.connect(SX); s.start();
  return Math.max(2.2, SCREAM_BUF[pick].duration);
}
function sfx(k) { try { SFX[k] && SFX[k](); } catch (e) {} }
function ambient() {
  const a = ac(); if (!a || amb) return;
  const g = a.createGain(); g.gain.value = 0.06;
  [55, 55.7, 110.3].forEach(f => { const o = a.createOscillator(); o.type = 'sine'; o.frequency.value = f; o.connect(g); o.start(); });
  g.connect(MU); amb = g;
}
async function scare() {
  if (!S.scare || ui.scaring || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) return;
  ui.scaring = 1; if (amb) amb.gain.value = 0;
  await sleep(450);
  const d = document.createElement('div'); d.id = 'scare';
  { const k = Math.random() * 8 | 0; d.innerHTML = '<div class="g i-s' + k + '" style="background-position:50% ' + (38 - 120 * [.09, .09, .37, .13, .07, .31, .12, .06][k]).toFixed(1) + 'vh;--z:' + [1, 1, .55, 1, 1, 1, 1, 1][k] + '"></div>'; }
  document.body.appendChild(d);
  const dur = playScream(); d.style.animationDuration = dur + 's,.08s'; d.firstChild.style.animationDuration = dur + 's';
  await sleep(dur * 1000); d.remove(); if (amb) amb.gain.value = 0.06; ui.scaring = 0;
}

/* ---------- account & wallet (Firestore: users/{uid}) ---------- */
async function loadUser(u) {
  let d = null;
  try { const s = await getDoc(doc(fs, 'users', u.uid)); d = s.exists() ? s.data() : null; } catch (e) { toast(t('errLoad')); }
  if (!d) {
    d = { name: (ui.name || '').trim().slice(0, 16) || 'Player' + u.uid.slice(-4), coins: START_COINS, wins: 0, games: 0, soulWins: 0 };
    try { await setDoc(doc(fs, 'users', u.uid), d); } catch (e) { toast(t('errSave')); }
  }
  ui.coins = d.coins; ui.profile = d;
  if (relief()) await saveUser();
}
async function saveUser() {
  if (!user || !ui.profile) return;
  ui.profile.coins = ui.coins;
  try { await setDoc(doc(fs, 'users', user.uid), ui.profile); } catch (e) { toast(t('errSave')); }
}
function relief() { if (ui.coins < 200) { ui.coins += 500; toast(t('relief')); return true; } return false; }
onAuthStateChanged(auth, async u => {
  user = u;
  if (u) { await loadUser(u); if (ui.scr === 'auth') { ui.scr = 'menu'; afterEnter(); } }
  else { ui.profile = null; ui.coins = 0; if (ui.scr !== 'load') { closeTable(true); stopRoom(); ui.scr = 'auth'; } }
  ui.authReady = true; render();
});
const AUTH_ERR = { 'auth/invalid-credential': 'errCred', 'auth/wrong-password': 'errCred', 'auth/user-not-found': 'errCred', 'auth/email-already-in-use': 'errUsed', 'auth/weak-password': 'errWeak', 'auth/invalid-email': 'errMail', 'auth/network-request-failed': 'errNet' };
async function authDo(kind) {
  try {
    if (kind === 'guest') await signInAnonymously(auth);
    else if (kind === 'login') await signInWithEmailAndPassword(auth, ui.email.trim(), ui.pass);
    else { if (!ui.name.trim()) return toast(t('needName')); await createUserWithEmailAndPassword(auth, ui.email.trim(), ui.pass); }
  } catch (e) { toast(AUTH_ERR[e.code] ? t(AUTH_ERR[e.code]) : e.message); }
}
async function afterEnter() {
  if (ui.code.length === 5) ui.dlg = 'join';
  render();
  const last = localStorage.getItem(roomKey());
  if (last && !ui.mp) {
    try {
      const s = await getDoc(doc(fs, 'rooms', last)), r = s.exists() ? s.data() : null;
      if (r && (r.status === 'waiting' || r.status === 'playing') && (r.seats || []).some(x => x.uid === user.uid)) openRoom(last, r.host === user.uid);
      else localStorage.removeItem(roomKey());
    } catch (e) {}
  }
}

/* ---------- shared table logic ---------- */
const mySeat = () => ui.T && user ? ui.T.seats.findIndex(s => s.uid === user.uid) : -1;
function closeTable(quiet) {
  G = null; ui.T = null; ui.hand = []; ui.pending = null; ui.dlg = null; ui.sel = -1; ui.busy = false;
  if (!quiet) { ui.scr = 'menu'; render(); }
}
function effects(p, T) {
  const me = mySeat();
  if (T.last && (!p.last || p.last.id !== T.last.id)) sfx(T.last.key === 'sp2' || T.last.key === 'r3' ? 'curse' : 'card');
  (T.evt.list || []).forEach(e => { ui.pops.push({ i: e.i, txt: e.txt, t: Date.now() }); if (e.txt[0] === '-') sfx('hit'); else if (e.txt.startsWith('🛡')) sfx('prot'); else if (e.txt[0] === '+') sfx('heal'); });
  if (me >= 0 && p.seats[me] && T.seats[me]) {
    const a = p.seats[me].hp, b = T.seats[me].hp;
    if (b < a) { document.body.classList.add('hurt'); setTimeout(() => document.body.classList.remove('hurt'), 650); }
    const th = [25, 12].find(x => a > x && b <= x && !ui.sc[x]);
    if (th) { ui.sc[th] = 1; scare(); }
    else if (b < a && (T.evt.list || []).some(e => e.i === me && e.txt === 'curse') && Math.random() < 0.35) scare();
  }
}

/* ---------- solo (the engine runs in this browser) ---------- */
function push() {
  G.seq++;
  const prev = ui.T, T = E.publicState(G);
  T.status = G.over ? 'over' : 'playing'; T.kind = 'solo'; T.deadline = 0; T.max = G.seats.length;
  if (G.over) { const w = G.seats[G.over.seat]; T.payout = { to: w.uid || null, amount: w.uid ? G.fee * G.seats.length : 0 }; }
  ui.T = T; ui.hand = G.hands[0]; ui.pending = G.pending && G.pending.seat === 0 ? G.pending : null; ui.scr = 'table';
  if (prev && prev.evt && prev.evt.n !== T.evt.n) effects(prev, T);
  render();
}
async function settleSolo(g) {
  const won = g.over && g.over.seat === 0, p = ui.profile;
  if (won) ui.coins += g.fee * g.seats.length;
  p.games = (p.games || 0) + 1;
  if (won) { p.wins = (p.wins || 0) + 1; if (g.mode === 'soul') p.soulWins = (p.soulWins || 0) + 1; }
  relief(); await saveUser();
}
async function botsLoop() {
  const g = G; let guard = 0;
  while (G === g && !g.over && g.seats[g.turn].bot && guard++ < 5000) {
    if (g.fast) { E.botTurn(g, g.turn, Date.now()); continue; }   // "skip to result": no animation delay
    await sleep(900); if (G !== g) return; E.botTurn(g, g.turn, Date.now()); push();
  }
  if (G === g && g.fast) push();
  if (G === g && g.over && !g.settled) { g.settled = true; sfx(g.over.seat === 0 ? 'win' : 'lose'); await settleSolo(g); render(); }
}
async function skipToEnd() {
  const g = G; if (!g || g.over) return;
  g.fast = true;                                   // a running bot loop picks this up on its next step
  if (!ui.busy) { ui.busy = true; await botsLoop(); ui.busy = false; render(); }
}
async function startSolo() {
  const fee = FEE[ui.mode];
  if (relief()) await saveUser();
  if (ui.coins < fee) return toast(t('noCoins'));
  ui.coins -= fee; await saveUser();
  const seats = [{ uid: user.uid, name: ui.profile.name }];
  for (let i = 0; i < ui.n - 1; i++) seats.push({ name: E.BOT_NAMES[i], bot: true });
  G = E.newGame({ seats, mode: ui.mode, fee, now: Date.now(), watch: true });
  ui.sc = {}; ui.sel = -1; ui.busy = false; ui.shown = -1; ui.pops = []; ui.T = null; ui.dlg = null;
  push(); await botsLoop();
}

/* ---------- rooms: the creator's device runs the game ---------- */
const MP = { unsubs: [], q: Promise.resolve(), hb: null, tick: null, watch: null, seats: [] };
const flagKey = (c, k) => `gc_${k}_${c}_${user ? user.uid : ''}`;
const roomKey = () => 'gc_room_' + (user ? user.uid : '');
const flag = (c, k) => { try { return localStorage.getItem(flagKey(c, k)); } catch (e) { return null; } };
const setFlag = (c, k) => { try { localStorage.setItem(flagKey(c, k), '1'); } catch (e) {} };
const mkCode = () => Array.from({ length: 5 }, () => CODE_CHARS[Math.random() * CODE_CHARS.length | 0]).join('');
const roomRef = () => doc(fs, 'rooms', ui.mp.code);
const hostRun = fn => { MP.q = MP.q.then(fn).catch(e => console.error(e)); return MP.q; };

function stopRoom() {
  MP.unsubs.forEach(f => f()); MP.unsubs = []; clearInterval(MP.hb); clearInterval(MP.tick); clearInterval(MP.watch);
  MP.q = Promise.resolve(); MP.seats = []; RG = null; ui.mp = null; ui.room = null; ui.hostLost = false; lastSig = '';
}
async function createRoom() {
  const fee = Math.max(MIN_ROOM, Math.floor(ui.fee) || MIN_ROOM);
  if (relief()) await saveUser();
  if (ui.coins < fee) return toast(t('noCoins'));
  let code = '', tries = 0;
  try {
    do { code = mkCode(); const s = await getDoc(doc(fs, 'rooms', code)); if (!s.exists()) break; } while (++tries < 8);
    await setDoc(doc(fs, 'rooms', code), { host: user.uid, hostName: ui.profile.name, mode: ui.mode, fee, max: ui.n, status: 'waiting', seats: [{ uid: user.uid, name: ui.profile.name }], hb: Date.now(), created: Date.now() });
  } catch (e) { return toast(t('netErr')); }
  ui.dlg = null; openRoom(code, true);
}
async function joinRoom(raw) {
  const code = String(raw || '').toUpperCase().trim();
  if (code.length !== 5) return toast(t('badCode'));
  let r;
  try { const s = await getDoc(doc(fs, 'rooms', code)); if (!s.exists()) return toast(t('noRoom')); r = s.data(); } catch (e) { return toast(t('netErr')); }
  const mine = (r.seats || []).some(x => x.uid === user.uid);
  if (!mine) {
    if (r.status !== 'waiting') return toast(t('roomStarted'));
    if (r.seats.length >= r.max) return toast(t('roomFull'));
    if (relief()) await saveUser();
    if (ui.coins < r.fee) return toast(t('noCoins'));
    try { await addDoc(collection(fs, 'rooms', code, 'moves'), { uid: user.uid, type: 'join', name: ui.profile.name, t: Date.now() }); } catch (e) { return toast(t('netErr')); }
  }
  ui.dlg = null; ui.code = ''; openRoom(code, r.host === user.uid);
}
function openRoom(code, isHost) {
  closeTable(true); stopRoom();
  ui.mp = { code, host: isHost, joinTs: Date.now() }; ui.sc = {}; ui.sel = -1; ui.busy = false; ui.shown = -1; ui.pops = []; ui.T = null; ui.hand = []; ui.pending = null;
  try { localStorage.setItem(roomKey(), code); } catch (e) {}
  MP.unsubs.push(onSnapshot(roomRef(), onRoomDoc, () => { toast(t('netErr')); }));
  if (!isHost) MP.unsubs.push(onSnapshot(doc(fs, 'rooms', code, 'hands', user.uid), s => { ui.hand = s.exists() ? s.data().cards : []; ui.pending = s.exists() ? (s.data().pending || null) : null; render(); }, () => {}));
  else hostBoot();
  MP.watch = setInterval(watchHost, 4000);
  ui.scr = 'lobby'; render();
}
let lastSig = '';
function onRoomDoc(s) {
  if (!ui.mp) return;
  if (!s.exists()) { toast(t('roomGone')); return leaveLocal(); }
  const r = s.data(), prevRoom = ui.room; ui.room = r;
  const sig = JSON.stringify([r.status, (r.seats || []).map(x => x.uid), r.T && r.T.evt && r.T.evt.n, r.payout]);
  if (prevRoom && sig === lastSig) return;                    // heartbeat only: no re-render
  lastSig = sig;
  const code = ui.mp.code;
  if (r.status === 'closed') {
    if (flag(code, 'fee') && !flag(code, 'done')) { setFlag(code, 'done'); ui.coins += r.fee; saveUser(); toast(t('hostGone')); }
    return leaveLocal();
  }
  const me = (r.seats || []).findIndex(x => x.uid === user.uid);
  if (r.status === 'waiting') {
    ui.scr = 'lobby';
    if (me < 0 && !ui.mp.host && Date.now() - ui.mp.joinTs > 8000) { toast(t('joinFail')); return leaveLocal(); }
    return render();
  }
  if (me < 0) { toast(t('roomStarted')); return leaveLocal(); }
  const prev = ui.T, T = Object.assign({}, r.T, { status: r.status, payout: r.payout, kind: 'room', max: r.max });
  ui.T = T; ui.scr = 'table'; ui.busy = false;
  if (!flag(code, 'fee')) { setFlag(code, 'fee'); ui.coins = Math.max(0, ui.coins - r.fee); saveUser(); }
  if (prev && prev.evt && T.evt && prev.evt.n !== T.evt.n) effects(prev, T);
  if (r.status === 'over' && !flag(code, 'done')) {
    setFlag(code, 'done');
    const won = r.payout && r.payout.to === user.uid, p = ui.profile;
    if (won) ui.coins += r.payout.amount;
    p.games = (p.games || 0) + 1; if (won) { p.wins = (p.wins || 0) + 1; if (r.mode === 'soul') p.soulWins = (p.soulWins || 0) + 1; }
    relief(); saveUser(); sfx(won ? 'win' : 'lose');
  }
  render();
}
function leaveLocal() { try { localStorage.removeItem(roomKey()); } catch (e) {} stopRoom(); closeTable(true); ui.scr = 'menu'; ui.dlg = null; render(); }
async function leaveRoom() {
  const mp = ui.mp; if (!mp) return;
  const code = mp.code, r = ui.room || {};
  try {
    if (mp.host) { if (r.status !== 'over') await updateDoc(roomRef(), { status: 'closed' }); }
    else if (r.status === 'waiting' || r.status === 'playing') await addDoc(collection(fs, 'rooms', code, 'moves'), { uid: user.uid, type: 'leave', t: Date.now() });
  } catch (e) {}
  if (r.status === 'playing' && (mp.host || ui.hostLost) && flag(code, 'fee') && !flag(code, 'done')) { setFlag(code, 'done'); ui.coins += r.fee; await saveUser(); }
  leaveLocal();
}
function watchHost() {
  const r = ui.room; if (!r || !ui.mp || ui.mp.host) return;
  const lost = r.status !== 'over' && r.status !== 'closed' && Date.now() - (r.hb || 0) > 30000;
  if (lost !== ui.hostLost) { ui.hostLost = lost; render(); }
}
/* host side */
async function hostBoot() {
  const code = ui.mp.code;
  try {
    const s = await getDoc(doc(fs, 'rooms', code)), r = s.data();
    MP.seats = (r.seats || []).map(x => ({ uid: x.uid, name: x.name }));
    if (r.status === 'playing' || r.status === 'over') {
      const sec = await getDoc(doc(fs, 'rooms', code, 'secret', 'g'));
      if (sec.exists()) { RG = E.load(r.T, sec.data()); RG.seq = r.T.evt.n; hostSelf(); }
    }
  } catch (e) { toast(t('netErr')); }
  MP.unsubs.push(onSnapshot(collection(fs, 'rooms', code, 'moves'), qs => qs.docChanges().forEach(ch => { if (ch.type === 'added') hostRun(() => processMove(ch.doc.id, ch.doc.data())); })));
  MP.hb = setInterval(() => { if (ui.room && ui.room.status !== 'over' && ui.room.status !== 'closed') updateDoc(roomRef(), { hb: Date.now() }).catch(() => {}); }, 8000);
  MP.tick = setInterval(() => hostRun(hostTick), 1000);
}
function hostSelf() {
  if (!RG) return;
  const me = RG.seats.findIndex(s => s.uid === user.uid);
  ui.hand = me >= 0 ? RG.hands[me] : []; ui.pending = RG.pending && RG.pending.seat === me ? RG.pending : null;
}
async function publish() {
  RG.seq++;
  hostSelf();
  const T = E.publicState(RG), over = !!RG.over, upd = { T, status: over ? 'over' : 'playing', hb: Date.now() };
  if (over) { const w = RG.seats[RG.over.seat]; upd.payout = { to: w.uid || null, amount: RG.fee * RG.seats.length }; }
  const code = ui.mp.code, b = writeBatch(fs);
  b.update(roomRef(), upd);
  RG.seats.forEach((s, i) => { if (s.uid && s.uid !== user.uid) b.set(doc(fs, 'rooms', code, 'hands', s.uid), { cards: RG.hands[i], pending: RG.pending && RG.pending.seat === i ? RG.pending : null }); });
  b.set(doc(fs, 'rooms', code, 'secret', 'g'), { deck: RG.deck, discard: RG.discard, hands: RG.hands, exiled: RG.exiled, pending: RG.pending, watch: false });
  await b.commit();
}
async function processMove(id, m) {
  try {
    const r = ui.room || {};
    if (m.type === 'join') {
      if (!RG && r.status === 'waiting' && !MP.seats.some(s => s.uid === m.uid) && MP.seats.length < r.max) {
        MP.seats.push({ uid: m.uid, name: String(m.name || 'Player').replace(/[<>"&]/g, '').slice(0, 16) });
        await updateDoc(roomRef(), { seats: MP.seats });
      }
    } else if (m.type === 'leave') {
      if (!RG) { if (m.uid !== user.uid && MP.seats.some(s => s.uid === m.uid)) { MP.seats = MP.seats.filter(s => s.uid !== m.uid); await updateDoc(roomRef(), { seats: MP.seats }); } }
      else if (!RG.over) { const si = RG.seats.findIndex(s => s.uid === m.uid); if (si >= 0) { E.forfeit(RG, si, Date.now()); await publish(); } }
    } else if (RG && !RG.over) {
      const si = RG.seats.findIndex(s => s.uid === m.uid);
      if (si >= 0) { try { E.act(RG, si, { type: m.type, card: m.card, pick: m.pick, target: m.target }, Date.now()); await publish(); } catch (e) { if (typeof e !== 'string') console.error(e); } }
    }
  } finally { if (ui.mp) deleteDoc(doc(fs, 'rooms', ui.mp.code, 'moves', id)).catch(() => {}); }
}
async function hostTick() {
  if (!RG || RG.over || !ui.mp) return;
  if (RG.deadline && Date.now() > RG.deadline + 500 && !RG.seats[RG.turn].bot) { E.timeout(RG, RG.turn, Date.now()); await publish(); }
}
function hostStartGame() {
  return hostRun(async () => {
    const r = ui.room;
    if (RG || !r || r.status !== 'waiting' || MP.seats.length < 2) return;
    RG = E.newGame({ seats: MP.seats.map(s => ({ uid: s.uid, name: s.name })), mode: r.mode, fee: r.fee, now: Date.now(), watch: false });
    await publish();
  });
}
setInterval(() => {
  const T = ui.T, el = document.getElementById('tmr'); if (!T || !el) return;
  if (T.deadline && !T.over) el.textContent = t('timeLeft', Math.max(0, Math.ceil((T.deadline - Date.now()) / 1000)));
}, 1000);

/* ---------- actions ---------- */
async function doAct(payload) {
  if (ui.busy) return;
  ui.busy = true; ui.sel = -1; render();
  if (ui.mp) {
    if (ui.mp.host) {
      await hostRun(async () => {
        if (!RG || RG.over) return;
        try { E.act(RG, RG.seats.findIndex(s => s.uid === user.uid), payload, Date.now()); await publish(); } catch (e) { toast(typeof e === 'string' ? t('illegal') : t('netErr')); }
      });
      ui.busy = false; render();
    } else {
      try { await addDoc(collection(fs, 'rooms', ui.mp.code, 'moves'), Object.assign({ uid: user.uid, t: Date.now() }, JSON.parse(JSON.stringify(payload)))); }
      catch (e) { toast(t('netErr')); ui.busy = false; render(); return; }
      setTimeout(() => { if (ui.busy) { ui.busy = false; render(); } }, 5000);
    }
    return;
  }
  if (!G) { ui.busy = false; return; }
  try { E.act(G, 0, payload, Date.now()); push(); await botsLoop(); }
  catch (e) { toast(typeof e === 'string' ? t('illegal') : 'Error'); console.error(e); }
  ui.busy = false; render();
}
function candsOf(c) { const D = (ui.T && ui.T.discard) || []; return c.key === 'p9' ? D : c.key === 'p12' ? D.filter(x => x.s && x.v <= 10) : c.key === 'sp8' ? D.filter(x => x.key !== 'sp8' && x.key !== 'sp7') : []; }
function startPlay(c) {
  ui.pl = { card: c.id, pick: undefined };
  if (PICK.has(c.key) && candsOf(c).length) { ui.dlg = 'pick'; render(); return; }
  resolvePlay();
}
function resolvePlay() {
  const c = ui.hand.find(x => x.id === ui.pl.card); if (!c) return;
  let needT = !!c.t;
  if (PICK.has(c.key) && c.key !== 'p9' && ui.pl.pick != null) { const s = (ui.T.discard || []).find(x => x.id === ui.pl.pick); needT = !!(s && s.t); }
  if (!needT) return doAct({ type: 'play', card: c.id, pick: ui.pl.pick });
  const me = mySeat(), tg = ui.T.seats.map((s, i) => i !== me && s.alive ? i : -1).filter(i => i >= 0);
  if (tg.length === 1) return doAct({ type: 'play', card: c.id, pick: ui.pl.pick, target: tg[0] });
  ui.dlg = 'target'; render();
}

/* ---------- loader ---------- */
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
    const el = (performance.now() - t0) / 3000, tgt = Math.min(ui.target === 1 ? 1 : loaded / total * 0.9, el);
    ui.pc += (tgt - ui.pc) * 0.12 + (tgt > ui.pc ? 0.002 : 0); ui.pc = Math.min(ui.pc, 1);
    if (ui.pc >= 0.995 && ui.target === 1 && el >= 1 && ui.authReady) { ui.pc = 1; ui.ready = true; }
    if (ui.scr === 'load') render();
    if (!ui.ready) requestAnimationFrame(tick);
  })();
}

/* ---------- views ---------- */
const cover = inner => `<div class="cover bgc i-cover"><div class="dock">${inner}</div></div>`;
const pips = (p, T) => T.mode === 'soul' ? `<div class="pips">${Array.from({ length: 10 }, (_, i) => `<u class="${i < p.soul ? 'f' : ''}"></u>`).join('')}</div>` : '';
function tags(p) {
  const g = t('tags'), a = [];
  if (p.shield > 0) a.push(g.shield(p.shield)); if (p.curse > 0) a.push(g.curse); if (p.skip) a.push(g.skip); if (p.noDraw) a.push(g.noDraw);
  if (p.noExtra) a.push(g.noExtra); if (p.bleed > 0) a.push(g.bleed(p.bleed)); if (p.sealed > 0) a.push(g.sealed);
  if (p.reflectAll || p.reflectN) a.push(g.reflect); if (p.blockAtk) a.push(g.blockAtk); if (p.blockAny) a.push(g.blockAny);
  if (p.ward) a.push(g.ward); if (p.redirect) a.push(g.redirect); if (p.boost > 0) a.push(g.boost(p.boost));
  return a.join(' · ');
}
function plHtml(p, i, T) {
  const n = Math.min(3, Math.max(1, p.hand.length));
  const popTxt = x => x.txt === 'ward' ? t('pop').ward : x.txt;
  const ps = ui.pops.filter(x => x.i === i && Date.now() - x.t < 900 && x.txt !== 'curse').map(x => `<span class="dmg ${x.txt[0] === '+' ? 'heal' : ''}" style="animation-delay:-${Date.now() - x.t}ms">${esc(popTxt(x))}</span>`).join('');
  return `<div class="pl ${i === T.turn && T.status === 'playing' ? 'cur' : ''} ${p.alive ? '' : 'dead'}">${ps}<div class="mini">${'<div class="i-back"></div>'.repeat(n)}<b>${p.hand.length}</b></div>
  <div class="nm"><div>${esc(nm(p.name))}${p.bot ? ' 👻' : ''}</div><div class="bar"><i style="width:${p.hp * 100 / MAX_HP}%"></i></div><div class="tg">HP ${p.hp} ${esc(tags(p))}</div>${pips(p, T)}</div>${(p.rev || []).length ? `<div class="rv">${p.rev.map(c => `<i class="i-${c.img}" title="${esc(cardName(c))}"></i>`).join('')}</div>` : ''}</div>`;
}
function loadHtml() {
  const pc = Math.round(ui.pc * 100), st = t('stat')[pc >= 100 ? 4 : Math.floor(pc / 25)];
  if (!ui.ready) return cover(`<div class="ld"><div class="st">${esc(st)}</div><div class="pc">${pc}%</div></div><div class="thread"><i style="width:${pc}%"></i></div>`);
  return cover(`<div class="thread"><i style="width:100%"></i></div><button class="enter" data-a="enter">${esc(t('enter'))}</button>`);
}
function authHtml() {
  return cover(`<div class="authbox"><h2 style="font-size:22px;color:var(--gold);margin-bottom:6px">${esc(ui.reg ? t('signUp') : t('signIn'))}</h2>
  ${ui.reg ? `<input id="name" class="inp" maxlength="16" placeholder="${esc(t('playerName'))}" value="${esc(ui.name)}">` : ''}
  <input id="email" class="inp" type="email" placeholder="${esc(t('email'))}" autocomplete="email" value="${esc(ui.email)}">
  <input id="pass" class="inp" type="password" placeholder="${esc(t('password'))}" autocomplete="${ui.reg ? 'new-password' : 'current-password'}" value="${esc(ui.pass)}">
  <div class="row" style="display:flex;gap:8px"><button class="go" style="flex:1;padding:12px;font-size:18px" data-a="${ui.reg ? 'register' : 'login'}">${esc(ui.reg ? t('btnRegister') : t('btnLogin'))}</button></div>
  <div class="links" style="margin-top:8px"><button class="lnk" data-a="togreg">${esc(ui.reg ? t('haveAcc') : t('noAcc'))}</button><button class="lnk" data-a="guest">${esc(t('guest'))} <span style="color:var(--mut)">${esc(t('guestSub'))}</span></button></div></div>`);
}
function menuHtml() {
  return cover(`<div class="menu3">
  <button class="big" data-a="dlg" data-v="solo">${esc(t('playGhosts'))}<small>${esc(t('playGhostsSub', FEE.soul, FEE.hp))}</small></button>
  <button class="big" data-a="dlg" data-v="room">${esc(t('createRoom'))}<small>${esc(t('createRoomSub', MIN_ROOM))}</small></button>
  <button class="big" data-a="dlg" data-v="join">${esc(t('joinRoom'))}<small>${esc(t('joinRoomSub'))}</small></button></div>
  <div class="links"><button class="lnk" data-a="dlg" data-v="rules">${esc(t('howTo'))}</button><button class="lnk" data-a="dlg" data-v="name">${esc(t('rename'))}</button><button class="lnk" data-a="dlg" data-v="settings">${esc(t('settings'))}</button><button class="lnk" data-a="logout">${esc(t('logout'))}</button></div>`);
}
function lobbyHtml() {
  const r = ui.room; if (!r) return cover(`<div class="ld"><div class="st">${esc(t('connecting'))}</div></div>`);
  const host = ui.mp && ui.mp.host, seats = MP.seats.length && host ? MP.seats : (r.seats || []);
  const rows = Array.from({ length: r.max }, (_, i) => seats[i] ? `<div class="seat"><span>${esc(seats[i].name)}${seats[i].uid === r.host ? ' 👑' : ''}</span><span>🪙${fmt(r.fee)}</span></div>` : `<div class="seat empty"><span>${esc(t('empty'))}</span></div>`).join('');
  return `<div class="cover bgc i-cover"></div><div class="lobby"><div class="box"><h2>${esc(t('lobbyTitle'))} · ${esc(r.mode === 'soul' ? t('modeSoul') : t('modeHp'))}</h2>
  <div style="color:var(--mut);font-size:14px">${esc(t('roomCode'))}</div><div class="codebig">${esc(ui.mp.code)}</div>
  <div class="row"><button data-a="share">${esc(t('invite'))}</button></div>${rows}
  <div style="margin:6px 0">${esc(t('fee', fmt(r.fee)))} · ${esc(t('pot', fmt(r.fee * seats.length)))}</div>
  ${ui.hostLost ? `<div style="color:#ff8a8a">${esc(t('hostLost'))}</div>` : ''}
  <div class="row">${host ? `<button data-a="start" ${seats.length < 2 ? 'disabled' : ''}>${esc(t('startRoom', seats.length, r.max))}</button>` : `<div style="flex:1;color:var(--mut)">${esc(t('waitHost'))}</div>`}<button data-a="leave">${esc(t('leaveRoom'))}</button></div></div></div>`;
}
function tableHtml() {
  const T = ui.T, me = mySeat(); if (me < 0) return '';
  const ps = T.seats.map((s, i) => Object.assign({}, s, { hand: i === me ? ui.hand : new Array(s.hand).fill(0) }));
  const m = ps[me], order = []; for (let k = 1; k < ps.length; k++) order.push((me + k) % ps.length);
  const playing = T.status === 'playing', my = playing && T.turn === me && m.alive;
  const on = my && !ui.busy && !ui.dlg && !T.pending, sc = ui.sel >= 0 ? m.hand[ui.sel] : null;
  const last = T.last; let lastHtml = '';
  if (last) { const anim = ui.shown !== last.id ? 'pop' : ''; ui.shown = last.id; lastHtml = `<div class="i-${last.img} ${anim}"></div>`; }
  const turnName = ps[T.turn] ? nm(ps[T.turn].name) : '';
  const ov = T.over ? T.seats[T.over.seat] : null;
  const pay = T.payout ? (T.payout.to === user.uid ? t('gain', fmt(T.payout.amount)) : t('lost', fmt(T.fee))) : t('calc');
  const status = my ? t('yourTurn') : playing ? (m.alive ? '' : t('outSpectate') + ' · ') + t('waitingFor', turnName) : t('gameOver');
  const timer = T.deadline && playing ? ` · <span class="tmr" id="tmr"></span>` : '';
  const btns = !m.alive && playing && !ui.mp ? `<button class="pass" data-a="skip">${esc(t('skipResult'))}</button>`
    : `<button class="play" data-a="play" ${on && sc && sc.key !== 'sp7' ? '' : 'disabled'}>${esc(t('playCard'))}</button><button class="pass" data-a="pass" ${on ? '' : 'disabled'}>${esc(t('pass'))}</button>`;
  const warn = ui.hostLost ? `<div class="warnbar">${esc(t('hostLost'))} <button data-a="leave">${esc(t('hostGoneLeave'))}</button></div>` : '';
  return `<div class="tbl"><div class="bd bgc i-cover"></div>${warn}
  <div class="opps">${order.map(i => plHtml(ps[i], i, T)).join('')}</div>
  <div class="mid"><div class="log" aria-live="polite">${T.log.slice(0, 4).map(l => `<div>${esc(logText(l))}</div>`).join('')}</div>
   <div class="piles"><div class="pile deck i-back"><small>${esc(t('deck', T.deckN))}</small></div><div class="pile dis">${lastHtml}<small>${esc(t('discard', T.discardN))}</small></div></div>
   <div class="info">${sc ? `<div><b>${esc(cn(sc))}</b></div><div>${esc(cardDesc(sc))}</div><div style="color:var(--mut);font-size:13px">${esc(sc.key === 'sp7' ? t('autoRevive') : t('tapPlay'))}</div>` : `<div>${esc(status)}${timer}</div><div style="color:var(--mut);font-size:13px">${esc(my ? t('tapCard') : t('potLabel', fmt(T.fee * T.seats.length)))}</div>`}</div></div>
  <div class="bot"><div class="me ${my ? 'cur' : ''}"><b>${esc(nm(m.name))}</b><div class="bar"><i style="width:${m.hp * 100 / MAX_HP}%"></i></div><div class="tg">HP ${m.hp} · 🪙${fmt(ui.coins)} ${esc(tags(m))}</div>${pips(m, T)}</div>
   <div class="hand" style="--ov:${m.hand.length <= 4 ? -10 : m.hand.length === 5 ? -22 : m.hand.length === 6 ? -34 : -44}px">${m.hand.map((c, i) => `<button class="c i-${c.img} ${i === ui.sel ? 'sel' : ''} ${on ? 'ok' : ''}" data-a="card" data-i="${i}" aria-label="${esc(cn(c))}" ${on ? '' : 'disabled'}></button>`).join('')}</div>
   <div class="btns">${btns}</div></div></div>
  <button class="acct" data-a="dlg" data-v="leave">${esc(t('exit'))}</button>${pendingHtml(T, me)}
  ${ov ? `<div class="modal"><div class="box" style="text-align:center"><h2>${esc(ov.uid === user.uid ? t('youWin') : t('someoneWins', nm(ov.name)))}</h2><p>${esc(ov.uid === user.uid ? t('winSub') : t('loseSub'))}</p><p class="serif" style="color:var(--gold)">${esc(pay)}</p><div class="row"><button data-a="done">${esc(t('backMenu'))}</button></div></div></div>` : ''}`;
}
function pendingHtml(T, me) {
  const pd = ui.pending; if (!pd || !T.pending || T.pending.seat !== me || T.over) return '';
  if (pd.kind === 'peek') { const c = pd.cards[0]; return `<div class="modal"><div class="box" style="text-align:center"><h2>${esc(t('peekTitle'))}</h2><div class="pkgrid"><div class="c i-${c.img}" style="margin:0"></div></div><p><b>${esc(cn(c))}</b><br>${esc(cardDesc(c))}</p><div class="row"><button data-a="choose" data-i="0">${esc(t('keep'))}</button><button data-a="choose" data-i="1">${esc(t('bottom'))}</button></div></div></div>`; }
  return `<div class="modal"><div class="box" style="text-align:center"><h2>${esc(t('draw2Title'))}</h2><p>${esc(t('draw2Sub'))}</p><div class="pkgrid">${pd.cards.map((c, i) => `<button class="c i-${c.img}" style="margin:0" data-a="choose" data-i="${i}" aria-label="${esc(cn(c))}"></button>`).join('')}</div><p style="color:var(--mut)">${pd.cards.map(c => esc(cn(c))).join(' / ')}</p></div></div>`;
}
const modeBtns = () => `<div class="row" style="display:flex;gap:8px;flex-wrap:wrap"><button class="opt ${ui.mode === 'soul' ? 'on' : ''}" data-a="mode" data-v="soul">${esc(t('modeSoul'))}<small style="display:block;color:var(--mut)">${esc(t('modeSoulSub'))}</small></button><button class="opt ${ui.mode === 'hp' ? 'on' : ''}" data-a="mode" data-v="hp">${esc(t('modeHp'))}<small style="display:block;color:var(--mut)">${esc(t('modeHpSub'))}</small></button></div>`;
const nBtns = (a, b) => `<div class="row" style="display:flex;gap:8px;align-items:center"><span>${esc(t('players'))}</span>${[2, 3, 4].filter(x => x >= a && x <= b).map(x => `<button class="opt ${ui.n === x ? 'on' : ''}" data-a="n" data-v="${x}">${x}</button>`).join('')}</div>`;
const slider = (key, label) => `<div class="vol"><label for="v_${key}">${esc(label)}</label><input id="v_${key}" type="range" min="0" max="100" value="${Math.round(S[key] * 100)}" data-vol="${key}"><span id="vl_${key}">${Math.round(S[key] * 100)}%</span></div>`;
function dlgHtml() {
  const d = ui.dlg, close = `<button data-a="close">${esc(t('close'))}</button>`;
  let h = '';
  if (d === 'solo') { const f = FEE[ui.mode]; h = `<h2>${esc(t('playGhosts'))}</h2>${modeBtns()}${nBtns(2, 4)}<p>${esc(t('entry', fmt(f), fmt(f * ui.n)))}${ui.coins < f ? ` · <span style="color:#ff8a8a">${esc(t('noCoins'))}</span>` : ''}</p><div class="row"><button data-a="go-solo">${esc(t('startGame'))}</button>${close}</div>`; }
  else if (d === 'room') h = `<h2>${esc(t('createRoom'))}</h2>${modeBtns()}${nBtns(2, 4)}<label class="fld">${esc(t('feeLabel', fmt(MIN_ROOM)))}<input id="fee" class="inp" type="number" min="${MIN_ROOM}" step="100" value="${ui.fee}"></label><p>${esc(t('potFull', fmt(Math.max(MIN_ROOM, ui.fee) * ui.n)))}</p><div class="row"><button data-a="go-room">${esc(t('create'))}</button>${close}</div>`;
  else if (d === 'join') h = `<h2>${esc(t('joinRoom'))}</h2><label class="fld">${esc(t('codeLabel'))}<input id="code" class="inp" maxlength="5" autocapitalize="characters" autocomplete="off" value="${esc(ui.code)}"></label><div class="row"><button data-a="go-join">${esc(t('join'))}</button>${close}</div>`;
  else if (d === 'rules') h = `<h2>${esc(t('howTo'))}</h2>${t('rules')}<p style="color:var(--mut)">${esc(t('scareWarn'))}</p><div class="row">${close}</div>`;
  else if (d === 'name') h = `<h2>${esc(t('rename'))}</h2><input id="name" class="inp" maxlength="16" value="${esc(ui.name || (ui.profile && ui.profile.name) || '')}"><div class="row"><button data-a="go-name">${esc(t('save'))}</button>${close}</div>`;
  else if (d === 'settings') h = `<h2>${esc(t('settings'))}</h2>
    <div class="vol"><label>${esc(t('language'))}</label><div class="seg"><button class="opt ${S.lang === 'en' ? 'on' : ''}" data-a="lang" data-v="en">English</button><button class="opt ${S.lang === 'th' ? 'on' : ''}" data-a="lang" data-v="th">ไทย</button></div></div>
    ${slider('master', t('master'))}${slider('music', t('music'))}${slider('sfx', t('sfx'))}
    <div class="vol"><label>${esc(t('scares'))}</label><div class="seg"><button class="opt ${S.scare ? 'on' : ''}" data-a="scare" data-v="1">${esc(t('on'))}</button><button class="opt ${!S.scare ? 'on' : ''}" data-a="scare" data-v="0">${esc(t('off'))}</button></div></div>
    <div class="row"><button data-a="mute">${esc(S.mute ? '🔇 ' + t('soundOff') : '🔊 ' + t('soundOn'))}</button><button data-a="test">${esc(t('testSound'))}</button>${close}</div>`;
  else if (d === 'pick') { const c = ui.hand.find(x => x.id === ui.pl.card); h = `<h2>${esc(c && c.key === 'p9' ? t('pickTitle') : t('pickTitleUse'))}</h2><div class="pkgrid">${(c ? candsOf(c) : []).map(x => `<button class="c i-${x.img}" data-a="pickc" data-i="${x.id}" aria-label="${esc(cn(x))}"></button>`).join('')}</div><div class="row">${close}</div>`; }
  else if (d === 'target') { const T = ui.T, me = mySeat(); h = `<h2>${esc(t('chooseTarget'))}</h2><div class="row">${T.seats.map((s, i) => i !== me && s.alive ? `<button data-a="tgt" data-i="${i}">${esc(nm(s.name))} · HP ${s.hp}</button>` : '').join('')}</div><div class="row">${close}</div>`; }
  else if (d === 'leave') h = `<h2>${esc(t('leaveTitle'))}</h2><p>${esc(t('leaveBody'))}</p><div class="row"><button data-a="go-leave">${esc(t('leaveGo'))}</button>${close}</div>`;
  return `<div class="modal"><div class="box">${h}</div></div>`;
}
function chrome() {
  const menu = ui.scr === 'menu';
  return `<button class="gear" data-a="dlg" data-v="settings" aria-label="${esc(t('settings'))}">⚙</button><button class="mute" data-a="mute" aria-label="${esc(S.mute ? t('soundOff') : t('soundOn'))}">${S.mute ? '🔇' : '🔊'}</button>` +
    (menu && ui.profile ? `<button class="acct" data-a="dlg" data-v="name">🪙 ${fmt(ui.coins)} · 👤 ${esc(ui.profile.name)}${ui.profile.games ? ' · ' + esc(t('wl', ui.profile.wins || 0, ui.profile.games)) : ''}</button>` : '');
}
function render() {
  const A = document.getElementById('app'), f = document.activeElement, fid = f && f.id, ss = f && f.selectionStart;
  ui.pops = ui.pops.filter(x => Date.now() - x.t < 900);
  const body = ui.scr === 'load' ? loadHtml() : ui.scr === 'auth' ? authHtml() : ui.scr === 'menu' ? menuHtml() : ui.scr === 'lobby' ? lobbyHtml() : ui.scr === 'table' && ui.T ? tableHtml() : cover(`<div class="ld"><div class="st">${esc(t('connecting'))}</div></div>`);
  A.innerHTML = body + chrome() + (ui.dlg ? dlgHtml() : '') + (ui.msg ? `<div class="toast">${esc(ui.msg)}</div>` : '');
  if (fid && fid.indexOf('v_') !== 0) { const e = document.getElementById(fid); if (e) { e.focus(); try { e.setSelectionRange(ss, ss); } catch (x) {} } }
}

/* ---------- events ---------- */
document.addEventListener('input', e => {
  const el = e.target, i = el.id;
  if (el.dataset && el.dataset.vol) { S[el.dataset.vol] = el.value / 100; applyVol(); saveS(); const l = document.getElementById('vl_' + el.dataset.vol); if (l) l.textContent = el.value + '%'; return; }
  if (i === 'email') ui.email = el.value; else if (i === 'pass') ui.pass = el.value; else if (i === 'name') ui.name = el.value;
  else if (i === 'fee') ui.fee = Math.floor(+el.value) || 0; else if (i === 'code') ui.code = el.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
});
document.addEventListener('click', async e => {
  const b = e.target.closest('[data-a]'); if (!b || b.disabled) return;
  const a = b.dataset.a, v = b.dataset.v; sfx('click');
  if (a === 'enter') {
    ui.scr = user ? 'menu' : 'auth'; ambient(); loadScreams();
    try { document.documentElement.requestFullscreen && document.documentElement.requestFullscreen().catch(() => {}); screen.orientation.lock('landscape').catch(() => {}); } catch (x) {}
    render(); if (user) afterEnter();
  }
  else if (a === 'mute') { S.mute = !S.mute; applyVol(); saveS(); render(); }
  else if (a === 'lang') { S.lang = v; saveS(); applyLang(); render(); }
  else if (a === 'scare') { S.scare = v === '1'; saveS(); render(); }
  else if (a === 'test') { sfx('hit'); setTimeout(() => sfx('prot'), 350); }
  else if (a === 'togreg') { ui.reg = !ui.reg; render(); }
  else if (a === 'login' || a === 'register' || a === 'guest') authDo(a);
  else if (a === 'logout') { stopRoom(); signOut(auth); }
  else if (a === 'dlg') { ui.dlg = v; render(); }
  else if (a === 'close') { ui.dlg = null; render(); }
  else if (a === 'mode') { ui.mode = v; render(); }
  else if (a === 'n') { ui.n = +v; render(); }
  else if (a === 'go-solo') startSolo();
  else if (a === 'go-room') createRoom();
  else if (a === 'go-join') joinRoom(ui.code);
  else if (a === 'go-name') { ui.dlg = null; const n = (ui.name || '').trim().slice(0, 16); if (n && ui.profile) { ui.profile.name = n; saveUser(); } render(); }
  else if (a === 'share') {
    const code = ui.mp.code, url = location.origin + location.pathname + '?room=' + code, text = t('inviteText', code);
    if (navigator.share) navigator.share({ title: 'GHOST COMMAND', text, url }).catch(() => {});
    else if (navigator.clipboard) navigator.clipboard.writeText(text + ' ' + url).then(() => toast(t('copied')));
  }
  else if (a === 'start') hostStartGame();
  else if (a === 'leave') leaveRoom();
  else if (a === 'go-leave') { ui.dlg = null; if (ui.mp) leaveRoom(); else closeTable(); }
  else if (a === 'done') { if (ui.mp) leaveRoom(); else closeTable(); }
  else if (a === 'skip') skipToEnd();
  else if (a === 'card') { ui.sel = +b.dataset.i === ui.sel ? -1 : +b.dataset.i; render(); }
  else if (a === 'pass') doAct({ type: 'pass' });
  else if (a === 'play') { const c = ui.hand[ui.sel]; if (c && c.key !== 'sp7') startPlay(c); }
  else if (a === 'pickc') { ui.pl.pick = +b.dataset.i; ui.dlg = null; resolvePlay(); }
  else if (a === 'choose') doAct({ type: 'choose', pick: +b.dataset.i });
  else if (a === 'tgt') { ui.dlg = null; if (ui.pl) doAct({ type: 'play', card: ui.pl.card, pick: ui.pl.pick, target: +b.dataset.i }); else render(); }
});
if (location.search.includes('gctest=1')) window.__gc = { scare, ui };
applyLang(); applyVol(); render(); boot();
