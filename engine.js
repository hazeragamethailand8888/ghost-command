'use strict';
// GHOST COMMAND engine v2 — implements the card sheet (52 ghost cards + 8 special cards = 60).
// Pure & server-authoritative: runs inside Cloud Functions.
const RK = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
const TURN_MS = 45000, SHIELD_CAP = 12, MAXHP = 50;
const BOT_NAMES = ['ร่างทรงเงา','หลวงตาผี','แม่นากจำแลง'];
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };

// ---------- card sheet: key -> [name, needsTarget, baseDamage, text] ----------
const CARDS = {};
const def = (key, name, t, d, desc, img) => { CARDS[key] = { name, t: t ? 1 : 0, d: d || 0, desc, img: img || key }; };
// gold
def('g0','ผีกระหัง',1,1,'โจมตี 1 HP และจั่วไพ่เพิ่ม 1 ใบ');
def('g1','ผีตายทั้งกลม',1,2,'สร้างความเสียหาย 2 HP');
def('g2','ผีโพง',1,3,'สร้างความเสียหาย 3 HP');
def('g3','ผีปอบ',1,4,'สร้างความเสียหาย 4 HP');
def('g4','ผีตายโหง',1,5,'สร้างความเสียหาย 5 HP');
def('g5','ผีเฝ้าสมบัติ',1,3,'สร้างความเสียหาย 3 HP และได้รับโล่ 2 หน่วย');
def('g6','พญานาคอาถรรพ์',1,4,'สร้างความเสียหาย 4 HP เป้าหมายจั่วไพ่เพิ่มไม่ได้ในเทิร์นถัดไป');
def('g7','พระภูมิเจ้าที่',1,3,'สร้างความเสียหาย 3 HP และลบคำสาปของตัวเอง 1 อย่าง');
def('g8','ยักษ์เฝ้าประตู',1,5,'สร้างความเสียหาย 5 HP และทำลายโล่ของเป้าหมายก่อน');
def('g9','ผีเสื้อสมุทร',1,5,'สร้างความเสียหาย 5 HP และลดโล่เป้าหมาย 2 หน่วย');
def('g10','ขุนแผนมนตรา',0,0,'เพิ่มพลังโจมตีของไพ่ใบถัดไป 3 หน่วย');
def('g11','นางตะเคียนทอง',0,0,'ฟื้นฟูพลังชีวิตตัวเอง 4 HP');
def('g12','เจ้าแห่งวิญญาณ',1,5,'สร้างความเสียหาย 5 HP และได้รับแต้มวิญญาณ 1 แต้ม');
// red
def('r0','ผีกระสือ',1,1,'สร้างความเสียหาย 1 HP และลดโล่เป้าหมาย 1 หน่วย');
def('r1','ผีตายโหงแดง',1,2,'สร้างความเสียหาย 2 HP');
def('r2','ผีปอบหิวโหย',1,3,'สร้างความเสียหาย 3 HP และฟื้นฟูตัวเอง 1 HP');
def('r3','ผีแม่ม่าย',1,2,'สร้างความเสียหาย 2 HP และติดคำสาป 1 เทิร์น');
def('r4','แม่นากอาฆาต',1,3,'สร้างความเสียหาย 3 HP และห้ามเป้าหมายจั่วไพ่ในเทิร์นถัดไป');
def('r5','ผีหัวขาด',1,4,'สร้างความเสียหาย 4 HP');
def('r6','เปรตอเวจี',1,4,'สร้างความเสียหาย 4 HP และทำให้เป้าหมายเสีย 1 HP ในต้นเทิร์นถัดไป');
def('r7','ผีโรงสี',1,4,'สร้างความเสียหาย 4 HP และเปิดเผยไพ่ในมือเป้าหมาย 2 ใบ');
def('r8','ผีตายทั้งกลมอาฆาต',1,5,'สร้างความเสียหาย 5 HP และติดคำสาป 1 เทิร์น');
def('r9','วิญญาณไร้หน้า',1,5,'สร้างความเสียหาย 5 HP และปิดความสามารถพิเศษเป้าหมาย 1 เทิร์น');
def('r10','เจ้ากรรมนายเวร',0,0,'สะท้อนความเสียหายจากการโจมตีครั้งถัดไปกลับไปยังผู้โจมตี');
def('r11','นางตานี',1,0,'ทำให้เป้าหมายตาพร่าและข้ามการเล่นไพ่ในเทิร์นถัดไป');
def('r12','ราชันผีอาฆาต',1,5,'สร้างความเสียหาย 5 HP และทำให้เป้าหมายเสีย 2 HP ในต้นเทิร์นถัดไป');
// blue
def('b0','กุมารทอง',0,0,'ได้รับโล่ 2 หน่วย');
def('b1','นางไม้พิทักษ์',0,0,'ฟื้นฟู 2 HP');
def('b2','ผีบ้านผีเรือน',0,0,'ได้รับโล่ 3 หน่วย');
def('b3','เทพารักษ์',0,0,'ฟื้นฟู 3 HP และลบคำสาป 1 อย่าง');
def('b4','พญานาคผู้พิทักษ์',0,0,'ได้รับโล่ 4 หน่วย');
def('b5','ผีเฝ้าศาล',0,0,'ยกเลิกคำสาปที่กำลังมีผลกับตัวเอง');
def('b6','พระภูมิคุ้มภัย',0,0,'ได้รับโล่ 5 หน่วย');
def('b7','นางตะเคียนผู้พิทักษ์',0,0,'ฟื้นฟู 4 HP และได้รับโล่ 2 หน่วย');
def('b8','ยักษ์พิทักษ์',0,0,'ได้รับโล่ 6 หน่วย และป้องกันคำสาป 1 ครั้ง');
def('b9','เทพผู้คุ้มครอง',0,0,'ฟื้นฟู 5 HP และได้รับโล่ 3 หน่วย');
def('b10','ร่างทรง',0,0,'ลบสถานะผิดปกติของตัวเองทั้งหมด');
def('b11','เจ้าแม่ตะเคียน',0,0,'ป้องกันการโจมตีครั้งถัดไปทั้งหมด');
def('b12','ผู้พิทักษ์แห่งยันต์',0,0,'ได้รับโล่ 5 หน่วย และสะท้อนความเสียหาย 2 หน่วยจากการโจมตีครั้งถัดไป');
// purple
def('p0','ผีซ่อนเงา',0,0,'ดูไพ่บนสุดของกองจั่ว แล้วเลือกเก็บไว้หรือวางใต้กอง');
def('p1','ผีหลอกตา',1,0,'เปิดเผยไพ่ในมือเป้าหมาย 1 ใบ');
def('p2','ผีสลับร่าง',1,0,'สุ่มสลับไพ่ 1 ใบในมือกับเป้าหมาย');
def('p3','วิญญาณเร่ร่อน',0,0,'จั่วไพ่ 2 ใบ แล้วทิ้ง 1 ใบ');
def('p4','ผีไร้เงา',0,0,'หลบการโจมตีครั้งถัดไปที่มุ่งเป้ามายังตัวเอง');
def('p5','ผีสิง',1,0,'ปิดความสามารถพิเศษของเป้าหมาย 1 เทิร์น');
def('p6','ผีขโมยโชค',1,0,'ขโมยโล่จากเป้าหมาย 2 หน่วย');
def('p7','ผีบังตา',1,0,'เปิดเผยไพ่ในมือทั้งหมดของเป้าหมายจนจบเทิร์นถัดไป');
def('p8','ผีข้ามภพ',0,0,'ยกเลิกผลของไพ่ที่เพิ่งใช้กับตัวเอง 1 ใบ');
def('p9','วิญญาณย้อนเวลา',0,0,'นำไพ่ 1 ใบจากกองทิ้งกลับขึ้นมือ');
def('p10','คนทรงเจ้า',0,0,'เปลี่ยนเป้าหมายของการโจมตี 1 ครั้ง');
def('p11','แม่หมอคำสาป',1,0,'ย้ายคำสาปจากตัวเองไปยังผู้เล่นอื่น 1 คน');
def('p12','จอมขมังเวท',0,0,'เลือกใช้ความสามารถของไพ่ A–10 ในกองทิ้ง 1 ใบ');
// special cards (art reuse: sp1 -> b1 crop)
def('sp1','ปลัดขิกอาถรรพ์',1,0,'ยิงแสงสีขาวแฟนตาซีใส่เป้าหมาย ทำให้ตาพร่าและข้ามการเล่นไพ่ในเทิร์นถัดไป','b1');
def('sp2','คำสาปเลือด',1,3,'เลือกเป้าหมาย สร้างความเสียหาย 3 HP และทำให้เสีย 1 HP ในต้นเทิร์นถัดไป','curse');
def('sp3','ยันต์คุ้มภัย',0,0,'ป้องกันการโจมตีและคำสาปครั้งถัดไปทั้งหมด','prot');
def('sp4','กระจกสะท้อนกรรม',0,0,'สะท้อนความเสียหายจากการโจมตีครั้งถัดไปกลับไปยังผู้โจมตี','asura');
def('sp5','ดวงชะตากลับด้าน',1,0,'สลับพลังชีวิตกับเป้าหมาย โดยพลังชีวิตสูงสุดไม่เกิน 50 HP','fort');
def('sp6','ผนึกวิญญาณ',1,0,'ปิดความสามารถพิเศษของเป้าหมาย 2 เทิร์น','swap');
def('sp7','ไพ่คืนชีพ',0,0,'เมื่อ HP เหลือ 0 ฟื้นคืนชีพด้วย 5 HP ใช้ได้ครั้งเดียวต่อเกม (ทำงานอัตโนมัติ)','heal');
def('sp8','JOKER — ราชาผี',0,0,'เลือกใช้ความสามารถของไพ่ 1 ใบจากกองทิ้ง ยกเว้น JOKER และไพ่คืนชีพ','joker');

function newDeck() {
  const d = []; let id = 0;
  'grbp'.split('').forEach(s => RK.forEach((r, i) => { const key = s + i, c = CARDS[key]; d.push({ id: id++, key, s, r, v: i + 1, name: c.name, img: c.img, t: c.t, desc: c.desc }); }));
  for (let i = 1; i <= 8; i++) { const key = 'sp' + i, c = CARDS[key]; d.push({ id: id++, key, x: 1, r: '', v: 0, name: c.name, img: c.img, t: c.t, desc: c.desc }); }
  return shuffle(d);
}
const isFace = c => !c.x && c.v >= 11;
const val = c => c.key === 'sp7' ? 9 : (c.v || 8);
const cn = c => c.x ? c.name : `${c.r} ${c.name}`;
const mini = c => ({ id: c.id, img: c.img, key: c.key, name: c.name, r: c.r, v: c.v, x: c.x || 0, t: c.t, s: c.s || null });

function mkSeat(s) {
  return { uid: s.uid || null, name: s.name, bot: !!s.bot, hp: MAXHP, soul: 0, shield: 0, curse: 0, noDraw: false, noExtra: false, skip: false, bleed: 0, sealed: 0, reflectAll: false, reflectN: 0, blockAtk: false, blockAny: false, ward: 0, redirect: false, boost: 0, showAll: 0, shown: [], alive: true, afk: 0 };
}
function log(G, c, o) { G.log.unshift(Object.assign({ c }, o || {})); if (G.log.length > 12) G.log.length = 12; }
function pop(G, i, txt) { G.evt.push({ i, txt }); }
function pull(G) { if (!G.deck.length) { G.deck = shuffle(G.discard); G.discard = []; } return G.deck.pop(); }
function draw(G, i, n = 1) { while (n--) { const c = pull(G); if (!c) return; G.hands[i].push(c); } }
function xdraw(G, i, n) { const s = G.seats[i]; if (s.noExtra) { log(G, 'noextra', { a: s.name }); return false; } draw(G, i, n); return true; }

function newGame(o) {
  const G = { mode: o.mode, fee: o.fee, seats: o.seats.map(mkSeat), deck: newDeck(), discard: [], exiled: [], pending: null, watch: !!o.watch, hands: {}, turn: 0, dir: 1, log: [{ c: 'start' }], last: null, over: null, evt: [], seq: 0, deadline: 0 };
  G.seats.forEach((_, i) => { G.hands[i] = []; });
  G.seats.forEach((_, i) => draw(G, i, 5));
  const n = G.seats.length; G.turn = ((Math.random() * n | 0) + n - 1) % n;
  advance(G, o.now || Date.now());
  return G;
}
function tick(G, i) { const s = G.seats[i]; s.noExtra = false; if (s.curse > 0) s.curse--; if (s.sealed > 0) s.sealed--; if (s.showAll > 0) s.showAll--; }
function advance(G, now) {
  const n = G.seats.length; let guard = 0;
  while (guard++ < n * 3 + 3) {
    do { G.turn = (G.turn + G.dir + n) % n; } while (!G.seats[G.turn].alive);
    const i = G.turn, s = G.seats[i];
    if (s.bleed > 0) {
      const b = s.bleed; s.bleed = 0; s.hp = Math.max(0, s.hp - b); pop(G, i, '-' + b); log(G, 'bleed', { a: s.name, n: b });
      if (s.hp <= 0) die(G, i, null);
      checkOver(G); if (G.over) return; if (!s.alive) continue;
    }
    if (s.noDraw) { s.noDraw = false; log(G, 'nodraw', { a: s.name }); } else draw(G, i, 1);
    log(G, 'turn', { a: s.name });
    if (s.skip) { s.skip = false; log(G, 'skip', { a: s.name }); trim(G, i); tick(G, i); continue; }
    G.deadline = s.bot ? 0 : now + TURN_MS;
    return;
  }
}
function kill(G, ti, si) {
  const t = G.seats[ti]; t.alive = false; t.hp = 0;
  G.discard.push(...G.hands[ti]); G.hands[ti] = [];
  log(G, 'out', { a: t.name });
  if (si != null && si !== ti && G.mode === 'soul' && G.seats[si].alive) G.seats[si].soul += 2;
}
function die(G, ti, si) {
  const h = G.hands[ti], ri = h.findIndex(c => c.key === 'sp7');
  if (ri >= 0) { G.exiled.push(h.splice(ri, 1)[0]); G.seats[ti].hp = 5; pop(G, ti, '+5'); log(G, 'revive', { a: G.seats[ti].name }); return; }
  kill(G, ti, si);
}
function heal(G, i, n) { const s = G.seats[i], b = s.hp; s.hp = Math.min(MAXHP, s.hp + n); if (s.hp > b) pop(G, i, '+' + (s.hp - b)); }
function addShield(G, i, n) { const s = G.seats[i]; s.shield = Math.min(SHIELD_CAP, s.shield + n); pop(G, i, '🛡+' + n); }
function guarded(G, ti, kind) {
  const t = G.seats[ti];
  if (t.blockAny) { t.blockAny = false; pop(G, ti, '🛡'); log(G, 'blocked', { a: t.name }); return true; }
  if (kind === 'atk' && t.blockAtk) { t.blockAtk = false; pop(G, ti, '🛡'); log(G, 'dodged', { a: t.name }); return true; }
  return false;
}
function curse(G, ti, turns) {
  const t = G.seats[ti];
  if (t.ward > 0) { t.ward--; pop(G, ti, 'ward'); log(G, 'wardcurse', { a: t.name }); return false; }
  t.curse = Math.max(t.curse, turns); pop(G, ti, 'curse'); log(G, 'cursed', { a: t.name }); return true;
}
function attack(G, si, ti, d, o) {
  o = o || {};
  const S = G.seats, src = S[si], t = S[ti];
  if (o.card && src.boost) { d += src.boost; src.boost = 0; }
  if (!o.noRedirect && t.redirect) {
    t.redirect = false;
    const c = []; S.forEach((s, i) => { if (s.alive && i !== ti && i !== si) c.push(i); });
    const ni = c.length ? c[Math.random() * c.length | 0] : si;
    log(G, 'redirect', { a: t.name, b: S[ni].name });
    return attack(G, si, ni, d, Object.assign({}, o, { noRedirect: true }));
  }
  if (guarded(G, ti, 'atk')) return false;
  if (!o.reflected && t.reflectAll) {
    t.reflectAll = false; pop(G, ti, '↩'); log(G, 'reflect', { a: t.name });
    attack(G, ti, si, d, { reflected: true, noRedirect: true }); return false;
  }
  if (!o.reflected && t.reflectN) {
    const r = t.reflectN; t.reflectN = 0; pop(G, ti, '↩'); log(G, 'reflectn', { a: t.name, n: r });
    attack(G, ti, si, r, { reflected: true, noRedirect: true });
  }
  if (t.curse > 0) d += 1;
  if (o.breakShield) t.shield = 0; else if (o.cut) t.shield = Math.max(0, t.shield - o.cut);
  const ab = Math.min(t.shield, d); t.shield -= ab; d -= ab;
  if (ab > 0) pop(G, ti, '🛡');
  t.hp = Math.max(0, t.hp - d);
  if (d > 0) pop(G, ti, '-' + d);
  log(G, 'hit', { a: src.name, b: t.name, n: d, v: ab });
  if (G.mode === 'soul' && o.card && d >= 4 && src.alive) { src.soul++; log(G, 'soul', { a: src.name }); }
  if (t.hp <= 0) die(G, ti, si);
  return true;
}
function reveal(G, ti, n) {
  const s = G.seats[ti], pool = G.hands[ti].filter(c => !s.shown.includes(c.id));
  shuffle(pool).slice(0, n).forEach(c => s.shown.push(c.id));
  log(G, 'reveal', { a: s.name });
}
// ----- discard-pick helpers (JOKER / Sorcerer K / Time-spirit 10) -----
function cands(G, c) {
  if (c.key === 'p9') return G.discard.slice();
  if (c.key === 'p12') return G.discard.filter(x => x.s && x.v <= 10);
  if (c.key === 'sp8') return G.discard.filter(x => x.key !== 'sp8' && x.key !== 'sp7');
  return [];
}
const PICK_CARDS = new Set(['p9', 'p12', 'sp8']);
function bestDiscard(G, list) { return list.slice().sort((a, b) => (CARDS[b.key].d * 2 + val(b)) - (CARDS[a.key].d * 2 + val(a)))[0]; }
function needTarget(G, c, pick) {
  if (PICK_CARDS.has(c.key)) { if (c.key === 'p9') return false; const src = G.discard.find(x => x.id === pick); return !!(src && src.t); }
  return !!c.t;
}
function copyEff(G, si, ti, ctx, c) {
  const list = cands(G, c);
  let src = list.find(x => x.id === ctx.pick) || (list.length ? bestDiscard(G, list) : null);
  if (!src) { log(G, 'nodisc'); return; }
  if ((ctx.depth || 0) >= 2) return;
  if (c.key === 'p9') { const k = G.discard.indexOf(src); G.discard.splice(k, 1); G.hands[si].push(src); log(G, 'recall', { a: G.seats[si].name, k: src.key, r: src.r }); return; }
  log(G, 'copied', { k: src.key, r: src.r });
  if (src.t && !(Number.isInteger(ti) && ti !== si && G.seats[ti] && G.seats[ti].alive)) { log(G, 'notarget'); return; }
  EFF[src.key](G, si, ti, true, { pick: null, depth: (ctx.depth || 0) + 1 }, src);
}
// ----- effects -----
const A = (d, o, post) => (G, si, ti, X, ctx) => {
  const landed = attack(G, si, ti, d, Object.assign({ card: 1 }, X && o ? o : {}));
  if (landed && X && post) post(G, si, ti);
};
const self = f => (G, si) => f(G, si);
const hostile = f => (G, si, ti) => { if (!guarded(G, ti, 'h')) f(G, si, ti); };
const EFF = {};
Object.assign(EFF, {
  g0: A(1, null, (G, si) => xdraw(G, si, 1)),
  g1: A(2), g2: A(3), g3: A(4), g4: A(5),
  g5: A(3, null, (G, si) => addShield(G, si, 2)),
  g6: A(4, null, (G, si, ti) => { G.seats[ti].noExtra = true; log(G, 'noextra', { a: G.seats[ti].name }); }),
  g7: A(3, null, (G, si) => { G.seats[si].curse = 0; }),
  g8: A(5, { breakShield: 1 }),
  g9: A(5, { cut: 2 }),
  g10: self((G, si) => { G.seats[si].boost += 3; log(G, 'boost', { a: G.seats[si].name }); }),
  g11: self((G, si) => heal(G, si, 4)),
  g12: A(5, null, (G, si) => { if (G.mode === 'soul') G.seats[si].soul++; }),
  r0: A(1, { cut: 1 }),
  r1: A(2),
  r2: A(3, null, (G, si) => heal(G, si, 1)),
  r3: A(2, null, (G, si, ti) => curse(G, ti, 1)),
  r4: A(3, null, (G, si, ti) => { G.seats[ti].noDraw = true; }),
  r5: A(4),
  r6: A(4, null, (G, si, ti) => { G.seats[ti].bleed += 1; }),
  r7: A(4, null, (G, si, ti) => reveal(G, ti, 2)),
  r8: A(5, null, (G, si, ti) => curse(G, ti, 1)),
  r9: A(5, null, (G, si, ti) => { G.seats[ti].sealed = Math.max(G.seats[ti].sealed, 1); log(G, 'sealed', { a: G.seats[ti].name, n: 1 }); }),
  r10: self((G, si) => { G.seats[si].reflectAll = true; }),
  r11: hostile((G, si, ti) => { G.seats[ti].skip = true; log(G, 'blind', { a: G.seats[ti].name }); }),
  r12: A(5, null, (G, si, ti) => { G.seats[ti].bleed += 2; }),
  b0: self((G, si) => addShield(G, si, 2)),
  b1: self((G, si) => heal(G, si, 2)),
  b2: self((G, si) => addShield(G, si, 3)),
  b3: (G, si, ti, X) => { heal(G, si, 3); if (X) G.seats[si].curse = 0; },
  b4: self((G, si) => addShield(G, si, 4)),
  b5: self((G, si) => { G.seats[si].curse = 0; }),
  b6: self((G, si) => addShield(G, si, 5)),
  b7: (G, si, ti, X) => { heal(G, si, 4); if (X) addShield(G, si, 2); },
  b8: (G, si, ti, X) => { addShield(G, si, 6); if (X) G.seats[si].ward++; },
  b9: (G, si, ti, X) => { heal(G, si, 5); if (X) addShield(G, si, 3); },
  b10: self((G, si) => { const s = G.seats[si]; s.curse = 0; s.noDraw = false; s.noExtra = false; s.skip = false; s.sealed = 0; s.bleed = 0; s.showAll = 0; s.shown = []; log(G, 'cleanse', { a: s.name }); }),
  b11: self((G, si) => { G.seats[si].blockAtk = true; }),
  b12: self((G, si) => { addShield(G, si, 5); G.seats[si].reflectN = 2; }),
  p0: (G, si) => {
    if (G.seats[si].noExtra) { log(G, 'noextra', { a: G.seats[si].name }); return; }
    const top = pull(G); if (top) G.pending = { seat: si, kind: 'peek', cards: [top] };
  },
  p1: (G, si, ti) => reveal(G, ti, 1),
  p2: hostile((G, si, ti) => {
    const a = G.hands[si], b = G.hands[ti]; if (!a.length || !b.length) return;
    const i = Math.random() * a.length | 0, j = Math.random() * b.length | 0; [a[i], b[j]] = [b[j], a[i]];
    log(G, 'swapcards', { a: G.seats[si].name, b: G.seats[ti].name });
  }),
  p3: (G, si) => {
    if (G.seats[si].noExtra) { log(G, 'noextra', { a: G.seats[si].name }); return; }
    const a = pull(G), b = pull(G);
    if (a && b) G.pending = { seat: si, kind: 'draw2', cards: [a, b] }; else if (a) G.hands[si].push(a);
  },
  p4: self((G, si) => { G.seats[si].blockAtk = true; }),
  p5: hostile((G, si, ti) => { G.seats[ti].sealed = Math.max(G.seats[ti].sealed, 1); log(G, 'sealed', { a: G.seats[ti].name, n: 1 }); }),
  p6: hostile((G, si, ti) => { const n = Math.min(2, G.seats[ti].shield); G.seats[ti].shield -= n; G.seats[si].shield = Math.min(SHIELD_CAP, G.seats[si].shield + n); log(G, 'steal', { a: G.seats[si].name, n }); }),
  p7: (G, si, ti) => { G.seats[ti].showAll = 1; log(G, 'revealall', { a: G.seats[ti].name }); },
  p8: self((G, si) => { G.seats[si].blockAny = true; }),
  p9: (G, si, ti, X, ctx, c) => copyEff(G, si, ti, ctx, c),
  p10: self((G, si) => { G.seats[si].redirect = true; }),
  p11: hostile((G, si, ti) => { const p = G.seats[si]; if (p.curse > 0) { p.curse = 0; curse(G, ti, 1); } else log(G, 'nocurse'); }),
  p12: (G, si, ti, X, ctx, c) => copyEff(G, si, ti, ctx, c),
  sp1: hostile((G, si, ti) => { G.seats[ti].skip = true; log(G, 'blind', { a: G.seats[ti].name }); }),
  sp2: A(3, null, (G, si, ti) => { G.seats[ti].bleed += 1; }),
  sp3: self((G, si) => { G.seats[si].blockAny = true; }),
  sp4: self((G, si) => { G.seats[si].reflectAll = true; }),
  sp5: hostile((G, si, ti) => {
    const a = G.seats[si], b = G.seats[ti], ha = a.hp, hb = b.hp;
    a.hp = Math.min(MAXHP, hb); b.hp = Math.min(MAXHP, ha);
    if (a.hp !== ha) pop(G, si, (a.hp > ha ? '+' : '-') + Math.abs(a.hp - ha));
    if (b.hp !== hb) pop(G, ti, (b.hp > hb ? '+' : '-') + Math.abs(b.hp - hb));
    log(G, 'swaphp', { a: a.name, b: b.name });
  }),
  sp6: hostile((G, si, ti) => { G.seats[ti].sealed = Math.max(G.seats[ti].sealed, 2); log(G, 'sealed', { a: G.seats[ti].name, n: 2 }); }),
  sp7: () => {},
  sp8: (G, si, ti, X, ctx, c) => copyEff(G, si, ti, ctx, c),
});
function sealedOut(c, p) { return p.sealed > 0 && (c.x || c.s === 'p' || isFace(c)); }
function play(G, si, c, ti, ctx) {
  const p = G.seats[si], h = G.hands[si];
  h.splice(h.indexOf(c), 1); G.discard.push(c); G.last = c;
  log(G, 'use', { a: p.name, k: c.key, r: c.r });
  if (sealedOut(c, p)) { log(G, 'sealedout', { a: p.name }); return; }
  EFF[c.key](G, si, ti, !(p.sealed > 0), ctx || {}, c);
}
function resolvePending(G, pick) {
  const pd = G.pending; if (!pd) return;
  const h = G.hands[pd.seat]; G.pending = null;
  if (pd.kind === 'peek') { if (pick === 1) G.deck.unshift(pd.cards[0]); else h.push(pd.cards[0]); }
  else { const d = pick === 1 ? 1 : 0; G.discard.push(pd.cards[d]); h.push(pd.cards[1 - d]); }
}
function autoPending(G) {
  const pd = G.pending; if (!pd) return;
  if (pd.kind === 'peek') resolvePending(G, val(pd.cards[0]) >= 6 || pd.cards[0].x ? 0 : 1);
  else resolvePending(G, val(pd.cards[0]) <= val(pd.cards[1]) ? 0 : 1);
}
function checkOver(G) {
  const al = []; G.seats.forEach((s, i) => { if (s.alive) al.push(i); });
  let w = null;
  if (al.length === 1) w = al[0];
  else if (G.mode === 'soul') { const x = al.find(i => G.seats[i].soul >= 10); if (x != null) w = x; }
  if (w == null && !G.watch && !al.some(i => !G.seats[i].bot)) w = al[0];
  if (w != null) G.over = { seat: w };
}
function trim(G, i) {
  const h = G.hands[i];
  while (h.length > 7) { const w = h.reduce((m, c) => val(c) < val(m) ? c : m); h.splice(h.indexOf(w), 1); G.discard.push(w); log(G, 'trim', { a: G.seats[i].name, k: w.key, r: w.r }); }
}
function endTurn(G, now) {
  trim(G, G.turn); tick(G, G.turn);
  checkOver(G);
  if (!G.over) advance(G, now);
}
// ---- player actions ----
function act(G, si, a, now) {
  if (G.over) throw 'เกมจบแล้ว';
  if (G.turn !== si) throw 'ยังไม่ถึงเทิร์นของคุณ';
  G.evt = [];
  if (G.pending) {
    if (G.pending.seat !== si || a.type !== 'choose') throw 'ต้องเลือกไพ่ก่อน';
    resolvePending(G, a.pick | 0);
  } else if (a.type === 'pass') log(G, 'pass', { a: G.seats[si].name });
  else if (a.type === 'play') {
    const c = G.hands[si].find(x => x.id === a.card);
    if (!c) throw 'ไม่มีไพ่ใบนี้ในมือ';
    if (c.key === 'sp7') throw 'ไพ่คืนชีพทำงานอัตโนมัติ เล่นเองไม่ได้';
    if (PICK_CARDS.has(c.key)) {
      const list = cands(G, c);
      if (list.length && !list.some(x => x.id === a.pick)) throw 'เลือกไพ่จากกองทิ้งให้ถูกต้อง';
    }
    let ti = null;
    if (needTarget(G, c, a.pick)) {
      ti = a.target;
      if (!(Number.isInteger(ti) && ti >= 0 && ti < G.seats.length && ti !== si && G.seats[ti].alive)) throw 'เป้าหมายไม่ถูกต้อง';
    }
    play(G, si, c, ti, { pick: a.pick });
    if (G.pending) { G.seats[si].afk = 0; return; }   // wait for the player's choice
  } else throw 'คำสั่งไม่ถูกต้อง';
  G.seats[si].afk = 0;
  endTurn(G, now);
}
function timeout(G, si, now) {
  const p = G.seats[si]; G.evt = [];
  p.afk = (p.afk || 0) + 1;
  log(G, 'timeout', { a: p.name });
  if (p.afk >= 2) { forfeit(G, si, now); return; }
  if (G.pending) autoPending(G);
  endTurn(G, now);
}
function forfeit(G, si, now) {
  if (!G.seats[si].alive) return;
  if (G.pending && G.pending.seat === si) { G.deck.unshift(...G.pending.cards); G.pending = null; }
  kill(G, si, null);
  checkOver(G);
  if (!G.over && G.turn === si) advance(G, now);
}
// ---- bots ----
function score(G, si, c, weak) {
  const S = G.seats, p = S[si], w = S[weak], d = CARDS[c.key].d, k = c.key;
  if (k === 'sp7') return -9;
  if (sealedOut(c, p)) return -5;
  if (d > 0) return d + (w.hp + w.shield <= d ? 6 : 0) - (w.shield >= d ? 2 : 0) + (k === 'g12' ? 3 : 0) + (S[si].boost ? 1 : 0);
  const hurt = MAXHP - p.hp;
  switch (k) {
    case 'g10': return G.hands[si].some(x => CARDS[x.key].d > 0) ? 3 : 0.5;
    case 'g11': return hurt >= 4 ? 6 : -1;
    case 'b1': return hurt >= 2 ? 4 : -1;
    case 'b3': return hurt >= 3 || p.curse ? 5 : -1;
    case 'b7': case 'b9': return hurt >= 4 ? 6 : 1;
    case 'b0': case 'b2': case 'b4': case 'b6': case 'b8': case 'b12': return p.shield < 6 ? 3 : 0.5;
    case 'b5': return p.curse ? 5 : -1;
    case 'b10': return (p.curse || p.skip || p.sealed || p.bleed) ? 5 : -1;
    case 'b11': case 'p4': return p.blockAtk ? -9 : (p.hp < 28 ? 4 : 1.5);
    case 'r10': case 'sp4': return p.reflectAll ? -9 : (p.hp < 28 ? 4 : 1.5);
    case 'sp3': case 'p8': return p.blockAny ? -9 : (p.hp < 28 ? 4 : 1.5);
    case 'p10': return p.redirect ? -9 : 1;
    case 'r11': case 'sp1': return 3;
    case 'p5': case 'sp6': return w.sealed ? -1 : 2.5;
    case 'p6': return w.shield > 0 ? 3 : -1;
    case 'p11': return p.curse ? 4 : -1;
    case 'p2': return G.hands[si].length > 1 && G.hands[weak].length ? 1 : -1;
    case 'p1': case 'p7': return 0.8;
    case 'sp5': return w.hp > p.hp + 12 ? 5 : -1;
    case 'p0': case 'p3': return p.noExtra ? -9 : (G.hands[si].length < 4 ? 3 : 0.8);
    case 'p9': return G.discard.length && G.hands[si].length < 5 ? 2.5 : -1;
    case 'p12': case 'sp8': return cands(G, c).length ? 3 : -1;
    default: return 0;
  }
}
function botTurn(G, si, now) {
  const S = G.seats, h = G.hands[si];
  const opp = []; S.forEach((s, i) => { if (s.alive && i !== si) opp.push(i); });
  const weak = opp.slice().sort((a, b) => (S[a].hp + S[a].shield) - (S[b].hp + S[b].shield))[0];
  const strong = opp.slice().sort((a, b) => S[b].hp - S[a].hp)[0];
  G.evt = [];
  const sc = h.map(c => [score(G, si, c, weak) + Math.random(), c]).sort((a, b) => b[0] - a[0]);
  if (!sc.length || sc[0][0] < 0) log(G, 'pass', { a: S[si].name });
  else {
    const c = sc[0][1];
    let pick = null; const list = cands(G, c); if (list.length) pick = bestDiscard(G, list).id;
    play(G, si, c, c.key === 'sp5' ? strong : weak, { pick, auto: true });
    if (G.pending) autoPending(G);
  }
  endTurn(G, now);
}
function runBots(G, now) {
  let guard = 0;
  while (!G.over && G.seats[G.turn].bot && guard++ < 300) botTurn(G, G.turn, now);
}
// ---- (de)serialisation ----
function publicState(G) {
  return {
    mode: G.mode, fee: G.fee, watch: !!G.watch,
    seats: G.seats.map((s, i) => {
      const h = G.hands[i], keep = s.shown.filter(id => h.some(c => c.id === id)); s.shown = keep;
      const rev = (s.showAll > 0 ? h : h.filter(c => keep.includes(c.id))).map(mini);
      return { uid: s.uid, name: s.name, bot: s.bot, hp: s.hp, soul: s.soul, shield: s.shield, curse: s.curse, noDraw: s.noDraw, noExtra: s.noExtra, skip: s.skip, bleed: s.bleed, sealed: s.sealed, reflectAll: s.reflectAll, reflectN: s.reflectN, blockAtk: s.blockAtk, blockAny: s.blockAny, ward: s.ward, redirect: s.redirect, boost: s.boost, showAll: s.showAll, shown: keep, alive: s.alive, afk: s.afk, hand: h.length, rev };
    }),
    turn: G.turn, dir: G.dir, deckN: G.deck.length, discardN: G.discard.length, discard: G.discard.map(mini),
    pending: G.pending ? { seat: G.pending.seat, kind: G.pending.kind } : null,
    last: G.last, log: G.log, evt: { n: G.seq, list: G.evt }, over: G.over, deadline: G.deadline,
  };
}
function load(pub, sec) {
  return {
    mode: pub.mode, fee: pub.fee, watch: !!pub.watch,
    seats: pub.seats.map(s => Object.assign(mkSeat(s), { hp: s.hp, soul: s.soul, shield: s.shield, curse: s.curse, noDraw: !!s.noDraw, noExtra: !!s.noExtra, skip: !!s.skip, bleed: s.bleed || 0, sealed: s.sealed || 0, reflectAll: !!s.reflectAll, reflectN: s.reflectN || 0, blockAtk: !!s.blockAtk, blockAny: !!s.blockAny, ward: s.ward || 0, redirect: !!s.redirect, boost: s.boost || 0, showAll: s.showAll || 0, shown: s.shown || [], alive: !!s.alive, afk: s.afk || 0 })),
    deck: sec.deck, discard: sec.discard, hands: sec.hands, exiled: sec.exiled || [], pending: sec.pending || null,
    turn: pub.turn, dir: pub.dir, log: pub.log, last: pub.last || null, over: pub.over || null,
    evt: [], seq: pub.evt ? pub.evt.n : 0, deadline: pub.deadline || 0,
  };
}
export { CARDS, newGame, act, timeout, forfeit, botTurn, runBots, publicState, load, needTarget, cands, BOT_NAMES, TURN_MS };
