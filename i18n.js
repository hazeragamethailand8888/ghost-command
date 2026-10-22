// UI text (English default, Thai on request), English card text, log formatting.
export const DICT = {
  en: {
    stat: ['Lighting the incense…', 'Shuffling the 60-card deck…', 'Sealing curses into the cards…', 'The ghosts are waking…', 'Ready'],
    enter: 'Tap to enter', connecting: 'Connecting…', rotate: 'Rotate your phone to landscape', rotateSub: 'GHOST COMMAND is played in landscape',
    // account
    signIn: 'Sign in', signUp: 'Create account', playerName: 'Player name', email: 'Email', password: 'Password (6+ characters)',
    btnLogin: 'Sign in', btnRegister: 'Sign up & get 🪙1,000', haveAcc: 'Have an account? Sign in', noAcc: 'No account? Sign up free',
    guest: 'Play as guest', guestSub: '(your progress is tied to this device)', needName: 'Enter a player name first',
    errCred: 'Wrong email or password', errUsed: 'That email is already registered', errWeak: 'Password needs at least 6 characters',
    errMail: 'Invalid email address', errNet: 'No internet connection', errLoad: 'Could not load your player data', errSave: 'Could not save your data',
    // menu
    playGhosts: 'Play vs Ghosts', playGhostsSub: (a, b) => `Entry 🪙${a}–${b}`, createRoom: 'Create Room', createRoomSub: (m) => `Play with friends · 🪙${m}+`,
    joinRoom: 'Join Room', joinRoomSub: 'Enter a 5-letter code', howTo: 'How to Play', rename: 'Rename', settings: 'Settings', logout: 'Log out',
    wl: (w, g) => `${w}/${g} wins`,
    // modes & setup
    modeSoul: 'Soul Hunt', modeSoulSub: 'First to 10 Soul points', modeHp: 'Cursed Return', modeHpSub: 'Last ghost standing',
    players: 'Players', mode: 'Mode', entry: (f, pot) => `Entry 🪙${f} · winner takes 🪙${pot}`, startGame: 'Start game', close: 'Close', cancel: 'Cancel',
    save: 'Save', noCoins: 'Not enough coins', relief: 'Low on coins — the system added 🪙500', saved: 'Saved',
    feeLabel: (m) => `Entry fee per player (min ${m})`, potFull: (p) => `Pot when the room is full: 🪙${p}`, create: 'Create room',
    codeLabel: 'Room code (5 characters)', join: 'Join', badCode: 'The code must be 5 characters', noRoom: 'Room not found', roomStarted: 'That room has already started',
    roomFull: 'The room is full', joinFail: 'Could not join the room', netErr: 'Network error — try again', roomGone: 'The room no longer exists',
    // lobby
    lobbyTitle: 'Room lobby', roomCode: 'Room code', invite: 'Invite friends', copied: 'Invitation copied', inviteText: (c) => `Join my GHOST COMMAND room! Code: ${c}`,
    empty: 'Empty', hostTag: 'Host', fee: (f) => `Entry 🪙${f} each (charged when the game starts)`, pot: (p) => `Pot so far 🪙${p}`,
    startRoom: (a, b) => `Start game (${a}/${b})`, needTwo: 'Need at least 2 players', waitHost: 'Waiting for the host to start…', leaveRoom: 'Leave room',
    hostLost: 'The host seems to be offline…', hostGone: 'The host left — game cancelled, your entry fee was refunded', hostGoneLeave: 'Leave (refund)',
    // table
    deck: (n) => `Draw ${n}`, discard: (n) => `Discard ${n}`, yourTurn: 'Your turn', waitingFor: (n) => `Waiting for ${n}`, outSpectate: 'You are out — spectating until the end',
    gameOver: 'Game over', potLabel: (p) => `Pot 🪙${p}`, playCard: 'Play card', pass: 'Pass', skipResult: 'Skip to result', exit: '⎋ Exit', tapCard: 'Tap a card to read it',
    tapPlay: 'Tap “Play card” to use it', autoRevive: 'Triggers automatically at 0 HP', timeLeft: (s) => `${s}s`,
    youWin: 'You win!', someoneWins: (n) => `${n} wins`, winSub: 'The ghosts bow before you', loseSub: 'Fate was not on your side. Try again.',
    gain: (n) => `You received +🪙${n}`, lost: (n) => `Entry lost −🪙${n}`, calc: 'Counting coins…', backMenu: 'Back to menu',
    leaveTitle: 'Leave the table?', leaveBody: 'Leaving during a game counts as a loss and you lose the entry fee.', leaveGo: 'Leave',
    chooseTarget: 'Choose a target', pickTitle: 'Pick a card from the discard pile', pickTitleUse: 'Pick a discard-pile card to copy', 
    peekTitle: 'Top card of the draw pile', keep: 'Keep in hand', bottom: 'Put on the bottom', draw2Title: 'Draw 2, then discard 1', draw2Sub: 'Tap the card to discard',
    needAccount: 'Create an account to use this', illegal: 'That move is not allowed',
    // settings
    language: 'Language', master: 'Master volume', music: 'Music', sfx: 'Sound effects', scares: 'Jump scares', on: 'On', off: 'Off', mute: 'Mute all', testSound: 'Test sound',
    scareWarn: 'Contains jump scares (flashes and loud sounds).', soundOn: 'Sound on', soundOff: 'Sound off',
    // status tags
    tags: { shield: (n) => `🛡${n}`, curse: 'Cursed', skip: 'Blind', noDraw: 'No draw', noExtra: 'No extra draw', bleed: (n) => `Bleed −${n}`, sealed: 'Sealed', reflect: 'Reflect', blockAtk: 'Dodge', blockAny: 'Warded', ward: 'Curse ward', redirect: 'Redirect', boost: (n) => `Power +${n}` },
    pop: { ward: 'Ward', curse: 'Curse' },
    rules: `<b>Basics:</b> start with 50 HP and 5 cards. Each turn you draw 1 card, then play at most 1 card or pass. Hand limit 7. Tap a card to read its ability.<br><b>Suits:</b> Gold — heavy attacks · Red — curses and damage over time · Blue — shields, healing, protection · Purple — tricks.<br><b>Statuses:</b> Shield N absorbs N damage (max 12) · Cursed: +1 damage taken until the end of your turn · Blind: skip playing a card · Bleed: lose HP at the start of your turn · Sealed: J/Q/K, purple cards and special cards do nothing, number cards only do their main effect · The Revival Card triggers automatically at 0 HP.<br><b>Soul Hunt:</b> first to 10 Soul points wins. Earn points from the Gold K, hits of 4+ damage (+1) and knockouts (+2). <b>Cursed Return:</b> last one standing wins.<br><b>Coins:</b> you start with 🪙1,000. Entry vs ghosts: Soul Hunt 200 / Cursed Return 300 (the ghosts pay too, the winner takes the pot). Private rooms: minimum 500, everyone pays the same when the game starts. If you drop below 200 the game adds 🪙500. Coins are for fun only and can never be cashed out.<br><b>Rooms:</b> the creator hosts the game from their device and keeps it open; players cannot see each other’s hands, and eliminated players keep watching until the end.`,
  },
  th: {
    stat: ['จุดธูปเรียกวิญญาณ…', 'สับสำรับไพ่ 60 ใบ…', 'ผนึกคำสาปลงบนไพ่…', 'ผีกำลังตื่น…', 'พร้อมแล้ว'],
    enter: 'แตะเพื่อเข้าสู่เกม', connecting: 'กำลังเชื่อมต่อ…', rotate: 'หมุนจอเป็นแนวนอน', rotateSub: 'GHOST COMMAND เล่นในแนวนอนเท่านั้น',
    signIn: 'เข้าสู่ระบบ', signUp: 'สมัครบัญชี', playerName: 'ชื่อผู้เล่น', email: 'อีเมล', password: 'รหัสผ่าน (6 ตัวขึ้นไป)',
    btnLogin: 'เข้าสู่ระบบ', btnRegister: 'สมัครและรับ 🪙1,000', haveAcc: 'มีบัญชีแล้ว? เข้าสู่ระบบ', noAcc: 'ยังไม่มีบัญชี? สมัครฟรี',
    guest: 'เล่นแบบแขก', guestSub: '(ข้อมูลผูกกับเครื่องนี้)', needName: 'ใส่ชื่อผู้เล่นก่อน',
    errCred: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง', errUsed: 'อีเมลนี้สมัครแล้ว', errWeak: 'รหัสผ่านอย่างน้อย 6 ตัว',
    errMail: 'อีเมลไม่ถูกต้อง', errNet: 'เชื่อมต่ออินเทอร์เน็ตไม่ได้', errLoad: 'โหลดข้อมูลผู้เล่นไม่สำเร็จ', errSave: 'บันทึกข้อมูลไม่สำเร็จ',
    playGhosts: 'เล่นกับผี', playGhostsSub: (a, b) => `ค่าเข้า 🪙${a}–${b}`, createRoom: 'สร้างห้อง', createRoomSub: (m) => `ชวนเพื่อน · 🪙${m}+`,
    joinRoom: 'เข้าห้อง', joinRoomSub: 'ใส่รหัส 5 ตัว', howTo: 'วิธีเล่น', rename: 'เปลี่ยนชื่อ', settings: 'ตั้งค่า', logout: 'ออกจากระบบ',
    wl: (w, g) => `ชนะ ${w}/${g}`,
    modeSoul: 'ชิงวิญญาณ', modeSoulSub: 'ถึง 10 แต้มวิญญาณก่อน', modeHp: 'คืนอาถรรพ์', modeHpSub: 'รอดเป็นคนสุดท้าย',
    players: 'ผู้เล่น', mode: 'โหมด', entry: (f, pot) => `ค่าเข้า 🪙${f} · ผู้ชนะรับ 🪙${pot}`, startGame: 'เริ่มเกม', close: 'ปิด', cancel: 'ยกเลิก',
    save: 'บันทึก', noCoins: 'เหรียญไม่พอ', relief: 'เหรียญเหลือน้อย ระบบเพิ่มให้ 🪙500', saved: 'บันทึกแล้ว',
    feeLabel: (m) => `ค่าเข้าคนละ (ขั้นต่ำ ${m})`, potFull: (p) => `กองรวมเมื่อห้องเต็ม 🪙${p}`, create: 'สร้างห้อง',
    codeLabel: 'รหัสห้อง 5 ตัว', join: 'เข้าห้อง', badCode: 'รหัสห้องต้องมี 5 ตัว', noRoom: 'ไม่พบห้องนี้', roomStarted: 'ห้องนี้เริ่มเล่นไปแล้ว',
    roomFull: 'ห้องเต็มแล้ว', joinFail: 'เข้าห้องไม่สำเร็จ', netErr: 'เครือข่ายขัดข้อง ลองใหม่อีกครั้ง', roomGone: 'ห้องนี้ถูกปิดแล้ว',
    lobbyTitle: 'ห้องรอ', roomCode: 'รหัสห้อง', invite: 'ส่งคำเชิญให้เพื่อน', copied: 'คัดลอกคำเชิญแล้ว', inviteText: (c) => `มาเล่น GHOST COMMAND กับฉัน! รหัสห้อง ${c}`,
    empty: 'ว่าง', hostTag: 'เจ้าของห้อง', fee: (f) => `ค่าเข้าคนละ 🪙${f} (หักเมื่อเริ่มเกม)`, pot: (p) => `กองรวมตอนนี้ 🪙${p}`,
    startRoom: (a, b) => `เริ่มเกม (${a}/${b})`, needTwo: 'ต้องมีผู้เล่นอย่างน้อย 2 คน', waitHost: 'รอเจ้าของห้องกดเริ่มเกม…', leaveRoom: 'ออกจากห้อง',
    hostLost: 'เจ้าของห้องเหมือนจะออฟไลน์…', hostGone: 'เจ้าของห้องออกไปแล้ว เกมถูกยกเลิก คืนค่าเข้าให้แล้ว', hostGoneLeave: 'ออก (คืนเหรียญ)',
    deck: (n) => `กองจั่ว ${n}`, discard: (n) => `กองทิ้ง ${n}`, yourTurn: 'เทิร์นของคุณ', waitingFor: (n) => `รอเทิร์นของ ${n}`, outSpectate: 'คุณแพ้แล้ว · ดูต่อจนจบ',
    gameOver: 'จบเกม', potLabel: (p) => `กอง 🪙${p}`, playCard: 'เล่นไพ่', pass: 'ข้ามเทิร์น', skipResult: 'ข้ามไปดูผล', exit: '⎋ ออก', tapCard: 'แตะไพ่เพื่อดูความสามารถ',
    tapPlay: 'กด “เล่นไพ่” เพื่อใช้', autoRevive: 'ทำงานอัตโนมัติเมื่อ HP หมด', timeLeft: (s) => `${s} วิ`,
    youWin: 'คุณชนะ', someoneWins: (n) => `${n} ชนะ`, winSub: 'ผีทั้งหมดยอมสยบ', loseSub: 'ชะตาไม่เข้าข้างคุณ ลองอีกครั้ง',
    gain: (n) => `ได้รับ +🪙${n}`, lost: (n) => `เสียค่าเข้า −🪙${n}`, calc: 'กำลังคำนวณเหรียญ…', backMenu: 'กลับหน้าหลัก',
    leaveTitle: 'ออกจากโต๊ะ?', leaveBody: 'ถ้าออกระหว่างเล่นจะถือว่าแพ้และเสียค่าเข้า', leaveGo: 'ออกจากโต๊ะ',
    chooseTarget: 'เลือกเป้าหมาย', pickTitle: 'เลือกไพ่จากกองทิ้งขึ้นมือ', pickTitleUse: 'เลือกไพ่จากกองทิ้งที่จะใช้ความสามารถ',
    peekTitle: 'ไพ่บนสุดของกองจั่ว', keep: 'เก็บเข้ามือ', bottom: 'วางใต้กอง', draw2Title: 'จั่ว 2 ใบ แล้วทิ้ง 1 ใบ', draw2Sub: 'แตะใบที่ต้องการทิ้ง',
    needAccount: 'ต้องสมัครบัญชีก่อน', illegal: 'ทำแบบนั้นไม่ได้',
    language: 'ภาษา', master: 'ระดับเสียงรวม', music: 'เพลงพื้นหลัง', sfx: 'เสียงเอฟเฟกต์', scares: 'ผีจั๊มสแกร์', on: 'เปิด', off: 'ปิด', mute: 'ปิดเสียงทั้งหมด', testSound: 'ทดสอบเสียง',
    scareWarn: 'มีฉากผีจั๊มสแกร์ (แสงวาบและเสียงดัง)', soundOn: 'เปิดเสียง', soundOff: 'ปิดเสียง',
    tags: { shield: (n) => `🛡${n}`, curse: 'คำสาป', skip: 'ตาพร่า', noDraw: 'ห้ามจั่ว', noExtra: 'จั่วเพิ่มไม่ได้', bleed: (n) => `เลือด−${n}`, sealed: 'ผนึก', reflect: 'สะท้อน', blockAtk: 'หลบ', blockAny: 'ยันต์', ward: 'กันสาป', redirect: 'เปลี่ยนเป้า', boost: (n) => `พลัง+${n}` },
    pop: { ward: 'ปัด', curse: 'สาป' },
    rules: `<b>พื้นฐาน:</b> เริ่มด้วย HP 50 และไพ่ 5 ใบ ทุกเทิร์นจั่ว 1 ใบ แล้วเล่นไพ่ได้ไม่เกิน 1 ใบ หรือข้ามเทิร์น มือเกิน 7 ใบต้องทิ้ง แตะไพ่เพื่อดูความสามารถ<br><b>สี:</b> ทอง = โจมตีแรง · แดง = คำสาปและโจมตีต่อเนื่อง · น้ำเงิน = โล่ ฟื้นฟู ป้องกัน · ม่วง = กลยุทธ์<br><b>สถานะ:</b> โล่ N หน่วยกันความเสียหายได้ N (สูงสุด 12) · ติดคำสาป = รับความเสียหายเพิ่ม +1 จนจบเทิร์นของตัวเอง · ตาพร่า = ข้ามการเล่นไพ่ · เลือด = เสีย HP ต้นเทิร์น · ผนึก = ไพ่ J/Q/K ไพ่ม่วง และไพ่พิเศษใช้ไม่ได้ ไพ่เลขทำได้เฉพาะผลหลัก · ไพ่คืนชีพทำงานอัตโนมัติเมื่อ HP หมด<br><b>ชิงวิญญาณ:</b> ถึง 10 แต้มก่อนชนะ ได้แต้มจากไพ่ K ทอง การโจมตีแรง 4 ขึ้นไป (+1) และกำจัดผู้เล่น (+2) · <b>คืนอาถรรพ์:</b> รอดเป็นคนสุดท้าย<br><b>เหรียญ:</b> เริ่มต้นฟรี 1,000 · ค่าเข้าเล่นกับผี ชิงวิญญาณ 200 / คืนอาถรรพ์ 300 (ผีบอทออกค่าเข้าเท่ากัน ผู้ชนะรับกอง) · ห้องส่วนตัวขั้นต่ำ 500 ทุกคนจ่ายเท่ากันตอนเริ่มเกม · ถ้าเหลือต่ำกว่า 200 ระบบเพิ่มให้ 🪙500 · เหรียญใช้ในเกมเท่านั้น ไม่แลกเป็นเงินจริง<br><b>ห้องเพื่อน:</b> เจ้าของห้องเป็นผู้คุมเกมจากเครื่องของตัวเองและต้องเปิดค้างไว้ ผู้เล่นมองไม่เห็นไพ่ของกันและกัน คนที่แพ้ดูต่อจนจบได้`,
  },
};

export const BOT_EN = { 'ร่างทรงเงา': 'Shadow Medium', 'หลวงตาผี': 'Ghost Monk', 'แม่นากจำแลง': 'Disguised Mae Nak' };

export const CARD_EN = {
  g0: ['Krahang Ghost', 'Deal 1 damage and draw 1 extra card.'],
  g1: ['Tai Thang Klom Ghost', 'Deal 2 damage.'],
  g2: ['Pong Ghost', 'Deal 3 damage.'],
  g3: ['Pop Ghost', 'Deal 4 damage.'],
  g4: ['Violent-Death Ghost', 'Deal 5 damage.'],
  g5: ['Treasure Guardian Ghost', 'Deal 3 damage and gain 2 Shield.'],
  g6: ['Cursed Naga King', 'Deal 4 damage. The target cannot draw extra cards next turn.'],
  g7: ['Guardian Spirit of the Land', 'Deal 3 damage and remove 1 curse from yourself.'],
  g8: ['Gatekeeper Yaksha', "Deal 5 damage and destroy the target's Shield first."],
  g9: ['Sea Ogress Suea Samut', "Deal 5 damage and reduce the target's Shield by 2."],
  g10: ["Khun Phaen's Charm", 'Your next card deals +3 attack.'],
  g11: ['Golden Takhian Maiden', 'Restore 4 HP.'],
  g12: ['Lord of Spirits', 'Deal 5 damage and gain 1 Soul point.'],
  r0: ['Krasue', "Deal 1 damage and reduce the target's Shield by 1."],
  r1: ['Crimson Violent-Death Ghost', 'Deal 2 damage.'],
  r2: ['Starving Pop', 'Deal 3 damage and heal 1 HP.'],
  r3: ['Widow Ghost', 'Deal 2 damage and curse the target for 1 turn.'],
  r4: ['Vengeful Mae Nak', 'Deal 3 damage. The target cannot draw a card next turn.'],
  r5: ['Headless Ghost', 'Deal 4 damage.'],
  r6: ['Avici Preta', 'Deal 4 damage. The target loses 1 HP at the start of their next turn.'],
  r7: ['Rice Mill Ghost', "Deal 4 damage and reveal 2 cards from the target's hand."],
  r8: ['Vengeful Tai Thang Klom', 'Deal 5 damage and curse the target for 1 turn.'],
  r9: ['Faceless Spirit', "Deal 5 damage and seal the target's special abilities for 1 turn."],
  r10: ['Lord of Karmic Debt', "Reflect the next attack's damage back at the attacker."],
  r11: ['Nang Tani', 'Blind the target: they skip playing a card next turn.'],
  r12: ['Vengeful Ghost King', 'Deal 5 damage. The target loses 2 HP at the start of their next turn.'],
  b0: ['Kuman Thong', 'Gain 2 Shield.'],
  b1: ['Guardian Wood Nymph', 'Heal 2 HP.'],
  b2: ['House Spirit', 'Gain 3 Shield.'],
  b3: ['Tepharak, Guardian Deity', 'Heal 3 HP and remove 1 curse.'],
  b4: ['Guardian Naga King', 'Gain 4 Shield.'],
  b5: ['Shrine Guardian Spirit', 'Cancel the curse affecting you.'],
  b6: ['Protective Phra Phum', 'Gain 5 Shield.'],
  b7: ['Guardian Takhian Maiden', 'Heal 4 HP and gain 2 Shield.'],
  b8: ['Guardian Yaksha', 'Gain 6 Shield and block 1 curse.'],
  b9: ['Protector Deity', 'Heal 5 HP and gain 3 Shield.'],
  b10: ['Spirit Medium', 'Remove all of your negative statuses.'],
  b11: ['Mother Takhian', 'Block all damage from the next attack.'],
  b12: ['Guardian of the Yant', 'Gain 5 Shield and reflect 2 damage from the next attack.'],
  p0: ['Shadow-Hiding Ghost', 'Look at the top card of the draw pile, then keep it or put it at the bottom.'],
  p1: ['Deceiving Ghost', "Reveal 1 card from the target's hand."],
  p2: ['Body-Swapping Ghost', 'Randomly swap 1 card from your hand with the target.'],
  p3: ['Wandering Spirit', 'Draw 2 cards, then discard 1.'],
  p4: ['Shadowless Ghost', 'Dodge the next attack aimed at you.'],
  p5: ['Possessing Ghost', "Seal the target's special abilities for 1 turn."],
  p6: ['Luck-Thief Ghost', 'Steal 2 Shield from the target.'],
  p7: ['Veil Ghost', "Reveal the target's whole hand until the end of their next turn."],
  p8: ['Realm-Crossing Ghost', 'Cancel the effect of the next card used on you.'],
  p9: ['Time-Reversing Spirit', 'Return 1 card from the discard pile to your hand.'],
  p10: ['Medium of the Spirits', 'Redirect the next attack aimed at you to another player.'],
  p11: ['Curse Witch', 'Move your curse to another player.'],
  p12: ['Grand Sorcerer', 'Use the ability of 1 card (A–10) from the discard pile.'],
  sp1: ['Cursed Palad Khik', 'Fire a holy white light at the target: they are blinded and skip playing a card next turn.'],
  sp2: ['Blood Curse', 'Deal 3 damage; the target also loses 1 HP at the start of their next turn.'],
  sp3: ['Protective Yant', 'Completely block the next attack or curse.'],
  sp4: ['Karma Mirror', "Reflect the next attack's damage back at the attacker."],
  sp5: ['Reversed Fate', 'Swap HP with the target (max 50 HP).'],
  sp6: ['Soul Seal', "Seal the target's special abilities for 2 turns."],
  sp7: ['Revival Card', 'When your HP hits 0, revive with 5 HP. Once per game (automatic).'],
  sp8: ['JOKER — Ghost King', 'Use the ability of 1 card from the discard pile (except JOKER and the Revival Card).'],
};

// log entries from the engine are language-neutral objects {c, a, b, n, v, k, r}
export function fmtLog(lang, e, card, nm) {
  const A = nm(e.a), B = nm(e.b), C = e.k ? card(e.k, e.r) : '';
  const th = lang === 'th';
  switch (e.c) {
    case 'start': return th ? 'เกมเริ่มแล้ว' : 'The game begins';
    case 'turn': return th ? `เทิร์นของ ${A}` : `${A}'s turn`;
    case 'bleed': return th ? `${A} เสีย ${e.n} HP จากคำสาปเลือด` : `${A} loses ${e.n} HP to bleeding`;
    case 'nodraw': return th ? `${A} ไม่ได้จั่วไพ่` : `${A} can't draw this turn`;
    case 'skip': return th ? `${A} ตาพร่า ข้ามการเล่นไพ่` : `${A} is blinded and skips playing a card`;
    case 'out': return th ? `${A} ออกจากเกม` : `${A} is out of the game`;
    case 'revive': return th ? `${A} ใช้ไพ่คืนชีพ ฟื้นด้วย 5 HP` : `${A} uses the Revival Card and returns with 5 HP`;
    case 'blocked': return th ? `${A} ป้องกันไว้ได้` : `${A} blocks it`;
    case 'dodged': return th ? `${A} หลบการโจมตี` : `${A} dodges the attack`;
    case 'wardcurse': return th ? `${A} ป้องกันคำสาปไว้ได้` : `${A}'s ward blocks the curse`;
    case 'cursed': return th ? `${A} ติดคำสาป` : `${A} is cursed`;
    case 'redirect': return th ? `${A} เปลี่ยนเป้าหมายการโจมตีไปที่ ${B}` : `${A} redirects the attack to ${B}`;
    case 'reflect': return th ? `${A} สะท้อนความเสียหายกลับ` : `${A} reflects the damage back`;
    case 'reflectn': return th ? `${A} สะท้อนความเสียหาย ${e.n}` : `${A} reflects ${e.n} damage`;
    case 'hit': return th ? `${A} ทำให้ ${B} เสีย ${e.n} HP${e.v ? ` (โล่กัน ${e.v})` : ''}` : `${A} deals ${e.n} damage to ${B}${e.v ? ` (Shield absorbed ${e.v})` : ''}`;
    case 'soul': return th ? `${A} ได้ +1 แต้มวิญญาณ` : `${A} gains +1 Soul point`;
    case 'reveal': return th ? `เปิดเผยไพ่ของ ${A}` : `A card of ${A} is revealed`;
    case 'use': return th ? `${A} ใช้ ${C}` : `${A} plays ${C}`;
    case 'sealedout': return th ? `${A} ถูกผนึก ไพ่ไม่ทำงาน` : `${A} is sealed — the card fails`;
    case 'noextra': return th ? `${A} จั่วเพิ่มไม่ได้` : `${A} can't draw extra cards`;
    case 'boost': return th ? `${A} เพิ่มพลังโจมตีใบถัดไป +3` : `${A}'s next attack gets +3`;
    case 'cleanse': return th ? `${A} ล้างสถานะผิดปกติ` : `${A} cleanses all negative statuses`;
    case 'swapcards': return th ? `${A} สลับไพ่กับ ${B}` : `${A} swaps a card with ${B}`;
    case 'steal': return th ? `${A} ขโมยโล่ ${e.n}` : `${A} steals ${e.n} Shield`;
    case 'revealall': return th ? `เปิดไพ่ทั้งมือของ ${A}` : `${A}'s whole hand is revealed`;
    case 'nocurse': return th ? 'ไม่มีคำสาปให้ย้าย' : 'There is no curse to move';
    case 'sealed': return th ? `${A} ถูกผนึก${e.n === 2 ? ' 2 เทิร์น' : ''}` : `${A} is sealed${e.n === 2 ? ' for 2 turns' : ''}`;
    case 'blind': return th ? `${A} ตาพร่า` : `${A} is blinded`;
    case 'swaphp': return th ? `${A} สลับพลังชีวิตกับ ${B}` : `${A} swaps HP with ${B}`;
    case 'nodisc': return th ? 'ไม่มีไพ่ในกองทิ้งให้ใช้' : 'No valid card in the discard pile';
    case 'recall': return th ? `${A} เรียก ${C} กลับขึ้นมือ` : `${A} returns ${C} to hand`;
    case 'copied': return th ? `ใช้ความสามารถของ ${C}` : `Uses the ability of ${C}`;
    case 'notarget': return th ? 'ไม่มีเป้าหมาย' : 'No valid target';
    case 'trim': return th ? `${A} ทิ้ง ${C} (เกิน 7 ใบ)` : `${A} discards ${C} (hand limit 7)`;
    case 'pass': return th ? `${A} ข้ามเทิร์น` : `${A} passes`;
    case 'timeout': return th ? `${A} หมดเวลา` : `${A} ran out of time`;
    default: return '';
  }
}
