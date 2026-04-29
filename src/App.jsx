import { useState, useEffect, useCallback, useRef } from "react";
import QUESTIONS_RAW from "./questions.js";

// ══════════════════════════════════════════════════════════════
// 1. 定数 & カラーパレット
// ══════════════════════════════════════════════════════════════
const C = {
  bg:"#04080f", surface:"#0c1524", surface2:"#111f36",
  border:"rgba(0,212,255,0.18)",
  orange:"#ff6b35", yellow:"#ffd60a", cyan:"#00d4ff",
  green:"#00ff88", red:"#ff3344", purple:"#a855f7",
  muted:"rgba(220,235,255,0.45)", text:"#dce8ff",
};
const SKILL_COLOR = {S:C.orange,A:C.yellow,R:C.cyan,E:C.purple,B:C.green,D:"#f97316"};
const SKILL_LABEL = {S:"サーブ",A:"アタック",R:"レセプション",E:"トス",B:"ブロック",D:"ディグ"};

// ══════════════════════════════════════════════════════════════
// 2. キーボード定義（固定4行）
// ══════════════════════════════════════════════════════════════
const KB_ROWS = [
  [
    {label:"a",  value:"a",  color:C.purple, hint:"相手チーム"},
    {label:"*",  value:"*",  color:C.muted,  hint:"自チーム(明示)"},
    {label:"SPC", value:" ", color:C.cyan,   hint:"スペース（コード区切り）", wide:true},
    {label:"⌫",  value:"BS", color:C.red,    hint:"削除", wide:true},
  ],
  [
    {label:"1",value:"1",color:C.text},{label:"2",value:"2",color:C.text},
    {label:"3",value:"3",color:C.text},{label:"4",value:"4",color:C.text},
    {label:"5",value:"5",color:C.text},{label:"6",value:"6",color:C.text},
    {label:"7",value:"7",color:C.text},{label:"8",value:"8",color:C.text},
    {label:"9",value:"9",color:C.text},{label:"0",value:"0",color:C.text},
  ],
  [
    {label:"S",value:"S",color:C.orange,  hint:"サーブ"},
    {label:"R",value:"R",color:"#38bdf8", hint:"レセプション"},
    {label:"A",value:"A",color:C.yellow,  hint:"アタック/Aクイック(PA)"},
    {label:"E",value:"E",color:C.purple,  hint:"トス"},
    {label:"B",value:"B",color:C.green,   hint:"ブロック/Bクイック(PB)"},
    {label:"D",value:"D",color:"#f97316", hint:"ディグ"},
    {label:"P",value:"P",color:C.yellow,  hint:"アタック詳細(PV/PZ/PA…)"},
    {label:"V",value:"V",color:C.yellow,  hint:"レフト平行(PV)"},
    {label:"Z",value:"Z",color:C.yellow,  hint:"ライト平行(PZ)"},
    {label:"C",value:"C",color:C.yellow,  hint:"Cクイック(PC)"},
    {label:"M",value:"M",color:C.orange,  hint:"J.フローター(SM)"},
    {label:"Q",value:"Q",color:C.orange,  hint:"ジャンピング(SQ)"},
  ],
  [
    {label:"#",value:"#",color:C.green,  hint:"決定"},
    {label:"=",value:"=",color:C.red,    hint:"ミス"},
    {label:"+",value:"+",color:C.yellow, hint:"優れた"},
    {label:"!",value:"!",color:C.muted,  hint:"普通"},
    {label:"-",value:"-",color:C.orange, hint:"やや悪い"},
    {label:"/",value:"/",color:C.cyan,   hint:"ブロックアウト"},
    {label:".",value:".",color:C.muted,  hint:"区切り"},
    {label:"~",value:"~",color:C.muted,  hint:"フリー"},
    {label:"↵",value:"ENTER",color:C.green,hint:"確定",wide:true},
  ],
];

// ══════════════════════════════════════════════════════════════
// 3. コートゾーン定義
// SVG viewBox 0 0 300 230 / コート x:30〜270 / ネット y:115
// HOME y:115〜210 / AWAY y:20〜115
// HOME列: 左=70 中=150 右=230
//   前衛 y=130: [4=左][3=中][2=右]
//   中列 y=162: [7=左][8=中][9=右]
//   後衛 y=195: [5=左][6=中][1=右]
// AWAY列: 同じx / 上下反転
//   後衛 y=34:  [5=左][6=中][1=右]
//   中列 y=66:  [7=左][8=中][9=右]
//   前衛 y=98:  [4=左][3=中][2=右]
// ══════════════════════════════════════════════════════════════
const HOME_ZONES = {
  1:{x:230,y:195}, 2:{x:230,y:130}, 3:{x:150,y:130},
  4:{x:70, y:130}, 5:{x:70, y:195}, 6:{x:150,y:195},
  7:{x:70, y:162}, 8:{x:150,y:162}, 9:{x:230,y:162},
};
const AWAY_ZONES = {
  1:{x:70,  y:34},  2:{x:70,  y:98},  3:{x:150, y:98},
  4:{x:230, y:98},  5:{x:230, y:34},  6:{x:150, y:34},
  7:{x:230, y:66},  8:{x:150, y:66},  9:{x:70,  y:66},
};
const ZW = 64;
const ZH = 26;
const SUB = {
  A:{ dx: ZW/4,  dy: ZH/4 },
  B:{ dx: ZW/4,  dy:-ZH/4 },
  C:{ dx:-ZW/4,  dy:-ZH/4 },
  D:{ dx:-ZW/4,  dy: ZH/4 },
};

// ── 問題バンクは ./questions.js に分離 ──────────────────────────
// QUESTIONS_RAW は questions.js から import

const QUESTIONS = QUESTIONS_RAW.map((q, i) => ({ ...q, id: i + 1 }));

const ROUND_SIZE = 7;

// ══════════════════════════════════════════════════════════════
// 5. ランク定義 & XPユーティリティ
// ══════════════════════════════════════════════════════════════
const RANKS = [
  {level:1,name:"見習い",icon:"📋",xpReq:0},
  {level:2,name:"初級",icon:"🎯",xpReq:150},
  {level:3,name:"中級",icon:"🏅",xpReq:400},
  {level:4,name:"上級",icon:"🏆",xpReq:900},
  {level:5,name:"代表",icon:"⭐",xpReq:1800},
];
const getRank     = xp => [...RANKS].reverse().find(r => xp >= r.xpReq) || RANKS[0];
const getNextRank = xp => RANKS.find(r => xp < r.xpReq) || null;

const LEVEL_UNLOCK_XP = { 1: 0, 2: 150, 3: 400, 4: 900, 5: 1800 };
const getMaxUnlockedLevel = (xp) =>
  Math.max(...Object.entries(LEVEL_UNLOCK_XP).filter(([, req]) => xp >= req).map(([l]) => Number(l)));

// ══════════════════════════════════════════════════════════════
// 6. コンパウンドコード解析・展開
// 書式: 左コード . 受け側番号 [D] [評価]
// S系: 受け側は常にR / A系: Dなし=ブロック、D付き=ディグ
// ══════════════════════════════════════════════════════════════
function parseCompound(code) {
  const dotIdx = code.indexOf(".");
  if (dotIdx === -1) return null;
  const left  = code.slice(0, dotIdx);
  const right = code.slice(dotIdx + 1);
  const m = right.match(/^(\d{1,2})(D?)([#=+!\-/]?)$/i);
  if (!m) return null;
  return { left, right, recvNum: m[1], hasD: m[2].toUpperCase() === "D", recvEval: m[3] || "" };
}

function expandCompound(code) {
  const p = parseCompound(code);
  if (!p) return null;
  const isAway = p.left.startsWith("a");
  const leftSkillPart = p.left.replace(/^a/, "").replace(/^\d+/, "");
  const isServe  = leftSkillPart.startsWith("S");
  const isAttack = leftSkillPart.startsWith("A") || leftSkillPart.startsWith("P");
  const recv = isAway ? "" : "a";
  let code1, code2;
  if (isServe) {
    code1 = p.left;
    code2 = `${recv}${p.recvNum}R${p.recvEval}`;
  } else if (isAttack) {
    if (p.hasD) {
      code1 = p.left;
      code2 = `${recv}${p.recvNum}D${p.recvEval}`;
    } else {
      const attackEval = p.recvEval === "#" ? "/" : p.recvEval === "=" ? "#" : "";
      code1 = `${p.left}${attackEval}`;
      code2 = `${recv}${p.recvNum}B${p.recvEval}`;
    }
  } else {
    code1 = p.left;
    code2 = `${recv}${p.recvNum}D${p.recvEval}`;
  }
  return { code1, code2, isServe, isAttack, hasD: p.hasD };
}

// ══════════════════════════════════════════════════════════════
// 6b. 背番号ランダム化
// ══════════════════════════════════════════════════════════════
const JERSEY_POOL = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20];

function randomizeQuestion(q) {
  const base = q;
  const isAway = base.sideRandom ? Math.random() < 0.5 : false;
  const PRE  = isAway ? "相手" : "";
  const APRE = isAway ? "a"   : "";

  if (!base.players) {
    const sub2 = str => typeof str === "string"
      ? str.replace(/\{PRE\}/g, PRE).replace(/\{APRE\}/g, APRE) : str;
    return {
      ...base,
      scene: { ...base.scene, desc: sub2(base.scene.desc) },
      answer: sub2(base.answer),
      variants: base.variants.map(sub2),
      explanation: sub2(base.explanation ?? ""),
    };
  }

  const slots = Object.keys(base.players);
  const used = new Set();
  const numMap = {};
  for (const slot of slots) {
    let n;
    do { n = JERSEY_POOL[Math.floor(Math.random() * JERSEY_POOL.length)]; }
    while (used.has(n));
    used.add(n);
    numMap[slot] = n;
  }

  const sub = str => typeof str === "string"
    ? str.replace(/\{PRE\}/g, PRE).replace(/\{APRE\}/g, APRE)
         .replace(/\{(\w)\}/g, (_, k) => numMap[k] ?? k)
    : str;

  const flipBall = segs => segs?.map(seg => ({
    ...seg,
    fx: 300 - seg.fx, fy: Math.max(10, 230 - seg.fy),
    tx: 300 - seg.tx, ty: Math.max(10, 230 - seg.ty),
  })) ?? [];

  return {
    ...base,
    scene: {
      ...base.scene,
      desc: sub(base.scene.desc),
      ball: base.sideRandom && isAway ? flipBall(base.scene.ball) : base.scene.ball,
      hlHome: base.sideRandom && isAway ? (base.scene.hlAway || []) : base.scene.hlHome,
      hlAway: base.sideRandom && isAway ? (base.scene.hlHome || []) : base.scene.hlAway,
      actors: base.scene.actors?.map(a => {
        const resolvedN = typeof a.n === "string" ? (numMap[a.n] ?? a.n) : a.n;
        if (base.sideRandom && isAway) {
          return { ...a, n: resolvedN, side: "away", x: 300 - a.x, y: Math.max(20, 230 - a.y) };
        }
        return { ...a, n: resolvedN };
      }),
    },
    answer: sub(base.answer),
    variants: base.variants.map(sub),
    explanation: sub(base.explanation ?? ""),
  };
}

// ══════════════════════════════════════════════════════════════
// 7. グローバルCSS
// ══════════════════════════════════════════════════════════════
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Noto+Sans+JP:wght@400;700;900&family=JetBrains+Mono:wght@400;700&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  ::-webkit-scrollbar{width:3px}
  ::-webkit-scrollbar-track{background:#04080f}
  ::-webkit-scrollbar-thumb{background:#ff6b35;border-radius:2px}
  @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}
  @keyframes glow{0%,100%{box-shadow:0 0 18px rgba(255,107,53,0.4)}50%{box-shadow:0 0 38px rgba(255,107,53,0.9)}}
  @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
  @keyframes pop{0%{transform:scale(0.4);opacity:0}70%{transform:scale(1.15)}100%{transform:scale(1);opacity:1}}
  @keyframes xpFloat{0%{opacity:0;transform:translateX(-50%) translateY(0)}40%{opacity:1;transform:translateX(-50%) translateY(-18px)}100%{opacity:0;transform:translateX(-50%) translateY(-44px)}}
  @keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}
  @keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
  @keyframes unlockPop{0%{opacity:0;transform:translateX(-50%) scale(0.7)}60%{transform:translateX(-50%) scale(1.08)}100%{opacity:1;transform:translateX(-50%) scale(1)}}
  button:active{opacity:0.7!important;transform:scale(0.95)!important}
`;

// ══════════════════════════════════════════════════════════════
// 8. CourtAnim コンポーネント
// ══════════════════════════════════════════════════════════════
function CourtAnim({ scene, animKey, showSub = false }) {
  const [phase,   setPhase]   = useState(0);
  const [ballSeg, setBallSeg] = useState(0);
  const balls = scene.ball || [];

  useEffect(() => {
    setPhase(0); setBallSeg(0);
    const t1 = setTimeout(() => setPhase(1), 150);
    const t2 = setTimeout(() => setPhase(2), 820);
    const t3 = setTimeout(() => { if (balls[1]) { setBallSeg(1); setPhase(3); } }, 1400);
    const t4 = setTimeout(() => { if (balls[1]) setPhase(4); }, 2000);
    return () => [t1,t2,t3,t4].forEach(clearTimeout);
  }, [animKey]);

  const seg  = (ballSeg === 0 || !balls[1]) ? balls[0] : balls[1];
  const prog = ballSeg === 0 ? phase : phase - 3;
  const bx   = (prog >= 1 && seg) ? seg.tx : (seg?.fx ?? 150);
  const by   = (prog >= 1 && seg) ? seg.ty : (seg?.fy ?? 115);
  const hlH  = scene.hlHome || [];
  const hlA  = scene.hlAway || [];

  const ZoneBlock = ({ z, cx, cy, isHL }) => (
    <g>
      <rect
        x={cx-ZW/2} y={cy-ZH/2} width={ZW} height={ZH}
        fill={isHL ? "rgba(255,107,53,0.18)" : "rgba(255,255,255,0.03)"}
        stroke={isHL ? "#ff6b35" : "rgba(180,210,255,0.18)"}
        strokeWidth={isHL ? 1.4 : 0.7}
        rx="2"
      />
      {showSub && (
        <>
          <line x1={cx} y1={cy-ZH/2} x2={cx} y2={cy+ZH/2}
            stroke={isHL ? "rgba(255,107,53,0.4)" : "rgba(180,210,255,0.15)"} strokeWidth="0.5"/>
          <line x1={cx-ZW/2} y1={cy} x2={cx+ZW/2} y2={cy}
            stroke={isHL ? "rgba(255,107,53,0.4)" : "rgba(180,210,255,0.15)"} strokeWidth="0.5"/>
          {Object.entries(SUB).map(([lbl,{dx,dy}]) => (
            <text key={lbl} x={cx+dx} y={cy+dy+3} textAnchor="middle"
              fill={isHL ? "rgba(255,150,80,0.7)" : "rgba(180,210,255,0.2)"}
              fontSize="5" fontFamily="monospace">{lbl}</text>
          ))}
        </>
      )}
      <text x={cx} y={cy+3.5} textAnchor="middle"
        fill={isHL ? "#ff8855" : "rgba(180,210,255,0.45)"}
        fontSize={showSub ? 7 : 9} fontFamily="monospace"
        fontWeight={isHL ? "bold" : "normal"}>{z}</text>
    </g>
  );

  return (
    <div style={{userSelect:"none"}}>
      <div style={{position:"relative",width:"100%",paddingBottom:"60%",borderRadius:12,overflow:"hidden"}}>
        <svg
          style={{position:"absolute",inset:0,width:"100%",height:"100%"}}
          viewBox="0 0 300 230"
          preserveAspectRatio="xMidYMid meet"
        >
        <defs>
          <linearGradient id="cg1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#1a3a6e" stopOpacity="0.6"/>
            <stop offset="50%"  stopColor="#0e2240" stopOpacity="0.1"/>
            <stop offset="100%" stopColor="#1a3a6e" stopOpacity="0.6"/>
          </linearGradient>
          <linearGradient id="netG" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#ffffff" stopOpacity="0.9"/>
            <stop offset="100%" stopColor="#aaccff" stopOpacity="0.4"/>
          </linearGradient>
          <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="1.5" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="bglow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* 背景 */}
        <rect width="300" height="230" fill="#090e18"/>
        <rect x="0"  y="0"   width="300" height="20"  fill="#0b1322"/>
        <rect x="0"  y="210" width="300" height="20"  fill="#0b1322"/>
        <rect x="30" y="20"  width="240" height="190" fill="#0c2040"/>
        <rect x="30" y="20"  width="240" height="190" fill="url(#cg1)"/>

        {/* コートアウトライン */}
        <rect x="30" y="20" width="240" height="190"
          fill="none" stroke="rgba(255,255,255,0.82)" strokeWidth="2.2"
          filter="url(#glow)"/>

        {/* ゾーン区分線 */}
        <line x1="110" y1="20"  x2="110" y2="210" stroke="rgba(255,255,255,0.11)" strokeWidth="0.7" strokeDasharray="3,4"/>
        <line x1="190" y1="20"  x2="190" y2="210" stroke="rgba(255,255,255,0.11)" strokeWidth="0.7" strokeDasharray="3,4"/>
        <line x1="30"  y1="146" x2="270" y2="146" stroke="rgba(255,255,255,0.11)" strokeWidth="0.7" strokeDasharray="3,4"/>
        <line x1="30"  y1="178" x2="270" y2="178" stroke="rgba(255,255,255,0.11)" strokeWidth="0.7" strokeDasharray="3,4"/>
        <line x1="30"  y1="50"  x2="270" y2="50"  stroke="rgba(255,255,255,0.11)" strokeWidth="0.7" strokeDasharray="3,4"/>
        <line x1="30"  y1="82"  x2="270" y2="82"  stroke="rgba(255,255,255,0.11)" strokeWidth="0.7" strokeDasharray="3,4"/>

        {/* アタックライン */}
        <line x1="30" y1="146" x2="270" y2="146"
          stroke="rgba(255,255,255,0.5)" strokeWidth="1.6" filter="url(#glow)"/>
        <line x1="30" y1="82"  x2="270" y2="82"
          stroke="rgba(255,255,255,0.5)" strokeWidth="1.6" filter="url(#glow)"/>

        {/* ネット */}
        <rect x="26" y="111" width="248" height="8" rx="1"
          fill="rgba(160,190,255,0.06)" stroke="rgba(255,255,255,0.25)" strokeWidth="0.5"/>
        <rect x="26" y="111" width="248" height="2.5" rx="1" fill="url(#netG)"/>
        {[...Array(25)].map((_,i) => (
          <line key={i} x1={26+i*10} y1="111" x2={26+i*10} y2="119"
            stroke="rgba(255,255,255,0.13)" strokeWidth="0.5"/>
        ))}
        {[111,113.5,116,118.5].map(y => (
          <line key={y} x1="26" y1={y} x2="274" y2={y}
            stroke="rgba(255,255,255,0.09)" strokeWidth="0.4"/>
        ))}
        <rect x="24"  y="103" width="3" height="24" rx="1.5" fill="rgba(255,255,255,0.65)"/>
        <rect x="273" y="103" width="3" height="24" rx="1.5" fill="rgba(255,255,255,0.65)"/>

        {/* チームラベル */}
        <text x="150" y="225" textAnchor="middle"
          fill="rgba(255,107,53,0.55)" fontSize="7" fontFamily="monospace" letterSpacing="2">HOME</text>
        <text x="150" y="16" textAnchor="middle"
          fill="rgba(100,180,255,0.55)" fontSize="7" fontFamily="monospace" letterSpacing="2">AWAY</text>

        {/* ゾーン */}
        {Object.entries(HOME_ZONES).map(([z,{x,y}]) => (
          <ZoneBlock key={`h${z}`} z={z} cx={x} cy={y} isHL={hlH.includes(Number(z))}/>
        ))}
        {Object.entries(AWAY_ZONES).map(([z,{x,y}]) => (
          <ZoneBlock key={`a${z}`} z={z} cx={x} cy={y} isHL={hlA.includes(Number(z))}/>
        ))}

        {/* コート外サーブライン参考 */}
        <line x1="30" y1="218" x2="270" y2="218"
          stroke="rgba(255,107,53,0.2)" strokeWidth="0.8" strokeDasharray="5,4"/>
        <line x1="30" y1="12"  x2="270" y2="12"
          stroke="rgba(100,180,255,0.2)" strokeWidth="0.8" strokeDasharray="5,4"/>

        {/* 選手 */}
        {scene.actors?.map((a,i) => {
          const isHome = a.side === "home";
          const jy = (a.jump && phase === 1) ? a.y - 9 : a.y;
          return (
            <g key={i}>
              <ellipse cx={a.x} cy={a.y+10} rx="10" ry="3"
                fill="rgba(0,0,0,0.45)" opacity={(a.jump && phase===1) ? 0.15 : 0.55}/>
              <circle cx={a.x} cy={jy} r="11"
                fill={isHome ? "#ff6b35" : "#1ca8e0"} filter="url(#glow)"/>
              <circle cx={a.x} cy={jy} r="11" fill="none"
                stroke={isHome ? "rgba(255,180,120,0.7)" : "rgba(100,220,255,0.7)"} strokeWidth="1.4"/>
              <text x={a.x} y={jy+4} textAnchor="middle"
                fill="white" fontSize="8.5" fontWeight="bold" fontFamily="monospace">{a.n}</text>
            </g>
          );
        })}

        {/* ネット当たり */}
        {seg?.net && phase >= 2 && (
          <g>
            <line x1="138" y1="108" x2="162" y2="122"
              stroke={C.red} strokeWidth="2.2" strokeDasharray="4,3" opacity="0.9"/>
            <text x="168" y="108" fill={C.red} fontSize="8" fontFamily="monospace">NET</text>
          </g>
        )}

        {/* ボール */}
        {phase > 0 && (
          <g style={{
            transform:`translate(${bx}px,${by}px)`,
            transition: prog >= 1 ? "transform 0.68s cubic-bezier(0.25,0.46,0.45,0.94)" : "none",
          }}>
            <circle cx="0" cy="0" r="9" fill="rgba(255,200,40,0.2)" filter="url(#bglow)"/>
            <text x="0" y="6" textAnchor="middle" fontSize="14">🏐</text>
          </g>
        )}
        </svg>
      </div>
      {/* 結果バッジ */}
      {phase >= 2 && scene.result && (
        <div style={{
          textAlign:"right",marginTop:4,
          animation:"fadeIn 0.3s ease",
        }}>
          <span style={{
            display:"inline-block",
            padding:"2px 10px",borderRadius:20,
            fontSize:10,fontFamily:"monospace",letterSpacing:1,
            background: scene.result==="ace" ? "rgba(0,255,136,0.2)" : scene.result==="miss" ? "rgba(255,51,68,0.2)" : "rgba(255,214,10,0.2)",
            border:`1px solid ${scene.result==="ace" ? C.green : scene.result==="miss" ? C.red : C.yellow}`,
            color: scene.result==="ace" ? C.green : scene.result==="miss" ? C.red : C.yellow,
          }}>
            {scene.result==="ace" ? "POINT! 🎉" : scene.result==="miss" ? "MISS! ❌" : "GOOD! ⭐"}
          </span>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 9. SoftKeyboard コンポーネント
// ══════════════════════════════════════════════════════════════
function SoftKeyboard({ onKey, onSubmit }) {
  const [hint, setHint] = useState(null);
  return (
    <div style={{background:"#070d18",borderTop:`1px solid ${C.border}`,padding:"3px 6px 6px",flexShrink:0}}>
      <div style={{height:12,marginBottom:3,textAlign:"center",fontSize:10,fontFamily:"monospace",letterSpacing:1,color:hint?C.cyan:"transparent",transition:"color 0.15s"}}>
        {hint || "　"}
      </div>
      {KB_ROWS.map((row,ri) => (
        <div key={ri} style={{display:"flex",gap:3,marginBottom:3,justifyContent:"center"}}>
          {row.map((k,ki) => {
            const isBs    = k.value === "BS";
            const isSp    = k.value === " ";
            const isEnter = k.value === "ENTER";
            const isUtil  = isBs;
            const isHex   = k.color && k.color.startsWith("#");
            return (
              <button
                key={ki}
                onPointerDown={() => {
                  if (isEnter) { onSubmit?.(); }
                  else { onKey(k.value); }
                  if (k.hint) setHint(k.hint);
                }}
                onPointerUp={() => setTimeout(() => setHint(null), 900)}
                style={{
                  flex: k.wide ? 2 : 1,
                  minWidth: k.wide ? 48 : 26,
                  maxWidth: k.wide ? 70 : 44,
                  height:36,
                  background: isBs ? "rgba(255,51,68,0.1)" : isUtil ? "rgba(255,255,255,0.04)" : isHex ? `${k.color}18` : "rgba(255,255,255,0.05)",
                  border:`1px solid ${isBs ? "rgba(255,51,68,0.35)" : isUtil ? C.border : isHex ? `${k.color}55` : C.border}`,
                  borderRadius:7,
                  color:k.color || C.text,
                  fontFamily:"'JetBrains Mono',monospace",
                  fontSize: isUtil ? 11 : 15,
                  fontWeight:700,
                  cursor:"pointer",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  WebkitTapHighlightColor:"transparent",
                  padding:0,
                  boxShadow: (isUtil || !isHex) ? "none" : `0 2px 6px ${k.color}20`,
                }}
              >{k.label}</button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 10. 各画面コンポーネント
// ══════════════════════════════════════════════════════════════

function HomeScreen({ score, maxStreak, xp, rank, xpPct, nextRank, levelFilter, setLevelFilter, maxUnlockedLevel, onStart, onNav }) {
  return (
    <div style={{flex:1,overflowY:"auto"}}>
      <div style={{position:"fixed",inset:0,backgroundImage:"repeating-linear-gradient(0deg,transparent,transparent 39px,rgba(0,212,255,0.04) 39px,rgba(0,212,255,0.04) 40px),repeating-linear-gradient(90deg,transparent,transparent 39px,rgba(0,212,255,0.04) 39px,rgba(0,212,255,0.04) 40px)",pointerEvents:"none",zIndex:0}}/>

      <div style={{position:"relative",zIndex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px 20px",gap:11,minHeight:"100%",animation:"fadeIn 0.5s ease"}}>
        <div style={{fontSize:50,animation:"float 2.8s ease-in-out infinite",filter:"drop-shadow(0 0 16px rgba(255,107,53,0.7))"}}>🏐</div>
        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:46,letterSpacing:6,lineHeight:1,textAlign:"center"}}>
          <span style={{color:C.yellow}}>Volley</span><span style={{color:C.orange}}>Coder</span>
        </div>
        <div style={{fontSize:10,color:C.muted,letterSpacing:3,textTransform:"uppercase",fontFamily:"monospace"}}>データバレー コーディング練習</div>
        <div style={{display:"flex",gap:8}}>
          <span style={{padding:"5px 14px",borderRadius:20,fontSize:11,background:"rgba(255,214,10,0.1)",border:`1px solid ${C.yellow}`,color:C.yellow,fontFamily:"monospace"}}>{rank.icon} {rank.name}アナリスト</span>
          <span style={{padding:"5px 12px",borderRadius:20,fontSize:11,background:"rgba(0,212,255,0.07)",border:`1px solid ${C.border}`,color:C.muted,fontFamily:"monospace"}}>{xp} XP</span>
        </div>
        <div style={{width:"100%",maxWidth:260}}>
          <div style={{background:"rgba(255,255,255,0.07)",borderRadius:20,height:5,overflow:"hidden"}}>
            <div style={{width:`${xpPct}%`,height:"100%",borderRadius:20,background:`linear-gradient(90deg,${C.orange},${C.yellow})`,transition:"width 0.7s"}}/>
          </div>
          {nextRank && <div style={{fontSize:9,color:C.muted,fontFamily:"monospace",textAlign:"right",marginTop:3}}>→ {nextRank.name} まで {nextRank.xpReq-xp} XP</div>}
        </div>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          <span style={{fontSize:10,color:C.muted,fontFamily:"monospace",letterSpacing:1}}>難易度</span>
          {[1,2,3,4,5].map(l => {
            const locked = l > maxUnlockedLevel;
            const active = levelFilter === l;
            return (
              <button key={l}
                onClick={() => !locked && setLevelFilter(l)}
                title={locked ? `${LEVEL_UNLOCK_XP[l]} XP で解放` : `Lv.${l}`}
                style={{
                  padding:"6px 16px",borderRadius:20,
                  border:`1px solid ${locked ? "rgba(255,255,255,0.1)" : active ? C.orange : C.border}`,
                  background: locked ? "rgba(255,255,255,0.03)" : active ? "rgba(255,107,53,0.18)" : "transparent",
                  color: locked ? "rgba(255,255,255,0.2)" : active ? C.orange : C.muted,
                  fontSize:11,fontFamily:"monospace",
                  cursor: locked ? "default" : "pointer",
                  letterSpacing:1,
                }}>
                {locked ? "🔒" : `Lv.${l}`}
              </button>
            );
          })}
        </div>
        <button onClick={onStart} style={{padding:"15px 48px",background:`linear-gradient(135deg,${C.orange},#e65100)`,border:"none",borderRadius:10,color:"white",fontWeight:900,fontSize:16,letterSpacing:3,cursor:"pointer",width:"100%",maxWidth:260,fontFamily:"'Noto Sans JP',sans-serif",animation:"glow 2.2s ease-in-out infinite",marginTop:4}}>
          🏐 試合開始
        </button>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,width:"100%",maxWidth:260}}>
          {[{icon:"📚",label:"コード辞書",sc:"ref"},{icon:"📊",label:"進捗",sc:"prog"}].map(({icon,label,sc}) => (
            <button key={sc} onClick={() => onNav(sc)} style={{padding:"12px 8px",background:"rgba(255,255,255,0.04)",border:`1px solid ${C.border}`,borderRadius:10,color:"rgba(220,235,255,0.7)",cursor:"pointer",textAlign:"center",fontFamily:"'Noto Sans JP',sans-serif"}}>
              <div style={{fontSize:20,marginBottom:4}}>{icon}</div>
              <div style={{fontSize:11,letterSpacing:1}}>{label}</div>
            </button>
          ))}
        </div>
        {(score > 0 || maxStreak > 0) && <div style={{display:"flex",gap:16,fontSize:11,color:C.muted,fontFamily:"monospace"}}><span>正解 {score}</span><span>最大ストリーク {maxStreak}</span></div>}
      </div>
    </div>
  );
}

function ProgressScreen({ stats, xp, rank, xpPct, nextRank, onBack }) {
  const ss = {};
  for (const qq of QUESTIONS) if (!ss[qq.skill]) ss[qq.skill] = {c:0,t:0};
  for (const [id,ok] of Object.entries(stats)) {
    const qq = QUESTIONS.find(q => q.id === Number(id));
    if (!qq) continue;
    ss[qq.skill].t++;
    if (ok) ss[qq.skill].c++;
  }
  return (
    <>
      <div style={{background:C.surface,padding:"14px 16px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
        <button onClick={onBack} style={{background:"transparent",border:"none",color:C.muted,cursor:"pointer",fontSize:20}}>←</button>
        <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,letterSpacing:3}}>PROGRESS</span>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"16px"}}>
        <div style={{textAlign:"center",marginBottom:18}}>
          <div style={{fontSize:42,marginBottom:6}}>{rank.icon}</div>
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:24,letterSpacing:4,color:C.yellow}}>{rank.name}アナリスト</div>
          <div style={{maxWidth:240,margin:"10px auto 0"}}>
            <div style={{background:"rgba(255,255,255,0.07)",borderRadius:20,height:5,overflow:"hidden"}}>
              <div style={{width:`${xpPct}%`,height:"100%",borderRadius:20,background:`linear-gradient(90deg,${C.orange},${C.yellow})`,transition:"width 0.7s"}}/>
            </div>
            <div style={{fontSize:9,color:C.muted,fontFamily:"monospace",textAlign:"right",marginTop:3}}>{xp} XP{nextRank ? ` / ${nextRank.xpReq}` : ""}</div>
          </div>
        </div>

        <div style={{fontSize:10,color:C.muted,letterSpacing:2,fontFamily:"monospace",marginBottom:8}}>レベル解放状況</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:16}}>
          {[1,2,3,4,5].map(l => {
            const req  = LEVEL_UNLOCK_XP[l];
            const done = xp >= req;
            return (
              <div key={l} style={{
                background: done ? "rgba(0,255,136,0.06)" : C.surface2,
                borderRadius:8,padding:"8px 12px",
                border:`1px solid ${done ? "rgba(0,255,136,0.25)" : C.border}`,
                display:"flex",alignItems:"center",gap:8,
              }}>
                <span style={{fontSize:14}}>{done ? "✓" : "🔒"}</span>
                <div>
                  <div style={{fontSize:12,fontWeight:700,color:done?C.green:C.muted,fontFamily:"monospace"}}>Lv.{l}</div>
                  <div style={{fontSize:10,color:C.muted,fontFamily:"monospace"}}>{done ? "解放済" : `${req} XP`}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{fontSize:10,color:C.muted,letterSpacing:2,fontFamily:"monospace",marginBottom:10}}>スキル別習熟度</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
          {Object.entries(SKILL_LABEL).map(([k,label]) => {
            const s = ss[k] || {c:0,t:0};
            const pct = s.t > 0 ? Math.round((s.c/s.t)*100) : 0;
            return (
              <div key={k} style={{background:C.surface2,borderRadius:8,padding:"10px 12px",border:`1px solid ${C.border}`}}>
                <div style={{fontSize:10,color:C.muted,letterSpacing:1,marginBottom:6,fontFamily:"monospace"}}>{k} — {label}</div>
                <div style={{background:"rgba(255,255,255,0.05)",borderRadius:10,height:4,marginBottom:4}}>
                  <div style={{width:`${pct}%`,height:"100%",borderRadius:10,background:SKILL_COLOR[k],transition:"width 0.6s"}}/>
                </div>
                <div style={{fontSize:11,fontWeight:700,color:SKILL_COLOR[k]}}>{s.t > 0 ? `${pct}%` : "未挑戦"}</div>
              </div>
            );
          })}
        </div>
        <button onClick={onBack} style={{width:"100%",padding:"12px",background:`linear-gradient(135deg,${C.orange},#e65100)`,border:"none",borderRadius:10,color:"white",fontWeight:700,fontSize:14,letterSpacing:2,cursor:"pointer",fontFamily:"'Noto Sans JP',sans-serif"}}>← ホームに戻る</button>
      </div>
    </>
  );
}

// ──────────────────────────────────────────────────────────────
function ReferenceScreen({ onBack }) {
  const compoundExamples = [
    ["3SM.6+", "3番J.フローター → 相手6番が優れたレセプション（S系→R）"],
    ["7S.3=",  "7番サーブ → 相手3番がレセプションミス（S系→R=）"],
    ["7A.1#",  "7番スパイク → 相手1番ブロック決定 → 7A/ / a1B#"],
    ["7A.1=",  "7番スパイク → 相手1番ブロックミス → 7A# / a1B="],
    ["7A.1D",  "7番スパイク → 相手1番ディグ継続  → 7A  / a1D"],
    ["7A.1D+", "7番スパイク → 相手1番優れたディグ → 7A  / a1D+"],
  ];
  const skillRows = [
    {k:"S",rows:[["S","基本サーブ"],["SM","ジャンプフローター（無回転変化球）"],["SQ","ジャンピングサーブ（トップスピン）"],["ST","テニスサーブ"]]},
    {k:"A",rows:[["A","スパイク（汎用）"],["AT","チップ（フェイント）"],["PV","レフト平行（ゾーン4から）"],["PZ","ライト平行（ゾーン2から）"],["PA","Aクイック（ゾーン3から）"],["PB","Bクイック（ゾーン3から）"],["PC","Cクイック（ゾーン3から）"],["P8","パイプ（ゾーン8から）"],["P9","ライトバックアタック（ゾーン9から）"],["P1","レフトハイボール（ゾーン4から）"],["P5","ライトハイボール（ゾーン2から）"]]},
    {k:"R",rows:[["R","レセプション（評価なし = 普通）"],["R#","完璧なレセプション（パーフェクト）"],["R+","優れたレセプション"],["R!","普通のレセプション"],["R-","やや悪いレセプション"],["R=","レセプションミス"],["S系.番号eval","コンパウンド経由でも記録可 例: a7S.3+"],]},
    {k:"E",rows:[["E","セット（トス）"]]},
    {k:"B",rows:[["B#","ブロック決定"],["B/","ブロックアウト"],["B=","ブロックミス"]]},
    {k:"D",rows:[["D","ディグ"],["D+","優れたディグ"],["D=","ディグミス"]]},
  ];

  return (
    <>
      <div style={{background:C.surface,padding:"14px 16px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
        <button onClick={onBack} style={{background:"transparent",border:"none",color:C.muted,cursor:"pointer",fontSize:20}}>←</button>
        <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,letterSpacing:3}}>CODE REFERENCE</span>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"14px"}}>
        <div style={{fontFamily:"monospace",fontSize:12,color:C.muted,marginBottom:10,lineHeight:1.9,background:C.surface2,padding:"10px 12px",borderRadius:8,border:`1px solid ${C.border}`}}>
          基本形：<span style={{color:C.cyan}}>背番号</span><span style={{color:C.orange}}>スキル</span><span style={{color:C.yellow}}>詳細/ゾーン</span><span style={{color:C.green}}>評価</span><br/>
          相手チーム: 先頭に <span style={{color:C.purple,fontWeight:700}}>a</span>　例: <span style={{color:C.cyan}}>a7SM1</span>
        </div>

        {/* コンパウンドコード */}
        <div style={{marginBottom:10,background:C.surface2,borderRadius:8,overflow:"hidden",border:`1px solid rgba(0,212,255,0.3)`}}>
          <div style={{padding:"7px 12px",background:"rgba(0,212,255,0.1)",borderBottom:`1px solid rgba(0,212,255,0.2)`,display:"flex",gap:8,alignItems:"center"}}>
            <span style={{fontFamily:"monospace",fontSize:13,fontWeight:700,color:C.cyan}}>.</span>
            <span style={{fontSize:12}}>コンパウンドコード</span>
            <span style={{fontSize:10,color:C.cyan,fontFamily:"monospace",letterSpacing:1,marginLeft:"auto"}}>1入力→2出力</span>
          </div>
          <div style={{padding:"10px 12px",display:"flex",flexDirection:"column",gap:8}}>
            <div style={{fontSize:11,color:C.muted,lineHeight:1.8}}>
              「<span style={{color:C.cyan,fontFamily:"monospace"}}>.</span>」で区切ることで、サーブ/アタック側と受け側を1コードで同時入力できる。
            </div>
            {compoundExamples.map(([code,desc]) => (
              <div key={code} style={{display:"flex",flexDirection:"column",gap:3}}>
                <span style={{fontFamily:"monospace",fontSize:13,color:C.yellow,background:"rgba(255,214,10,0.1)",padding:"2px 8px",borderRadius:4,alignSelf:"flex-start"}}>{code}</span>
                <span style={{fontSize:11,color:C.muted,paddingLeft:4}}>{desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* スキル別一覧 */}
        {skillRows.map(({k,rows}) => (
          <div key={k} style={{marginBottom:10,background:C.surface2,borderRadius:8,overflow:"hidden",border:`1px solid ${C.border}`}}>
            <div style={{padding:"7px 12px",background:"rgba(0,212,255,0.06)",borderBottom:`1px solid ${C.border}`,display:"flex",gap:8,alignItems:"center"}}>
              <span style={{fontFamily:"monospace",fontSize:13,fontWeight:700,color:SKILL_COLOR[k]}}>{k}</span>
              <span style={{fontSize:12}}>{SKILL_LABEL[k]}</span>
            </div>
            <div style={{padding:"8px 12px",display:"flex",flexDirection:"column",gap:5}}>
              {rows.map(([code,desc]) => (
                <div key={code} style={{display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontFamily:"monospace",fontSize:12,color:C.yellow,background:"rgba(255,214,10,0.1)",padding:"2px 8px",borderRadius:4,minWidth:44,textAlign:"center"}}>{code}</span>
                  <span style={{fontSize:11,color:C.muted}}>{desc}</span>
                </div>
              ))}
            </div>
          </div>
        ))}

        <button onClick={onBack} style={{width:"100%",padding:"12px",background:`linear-gradient(135deg,${C.orange},#e65100)`,border:"none",borderRadius:10,color:"white",fontWeight:700,fontSize:14,letterSpacing:2,cursor:"pointer",fontFamily:"'Noto Sans JP',sans-serif"}}>← ホームに戻る</button>
      </div>
    </>
  );
}

function ResultScreen({ result, q, streak, onNext, onHome }) {
  const ex = q.compound && result.correct ? expandCompound(result.codeStr) : null;

  return (
    <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px 20px",textAlign:"center",gap:12,borderTop:`3px solid ${result.correct?C.green:C.red}`,background:result.correct?"rgba(0,255,136,0.03)":"rgba(255,51,68,0.03)"}}>
      <div style={{fontSize:58,animation:"pop 0.4s ease"}}>{result.correct ? "🎯" : "🔕"}</div>
      <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:38,letterSpacing:4,color:result.correct?C.green:C.red}}>{result.correct ? "SPIKE!!" : "OUT!"}</div>

      {!result.correct && (
        <div>
          <div style={{fontSize:10,color:C.muted,fontFamily:"monospace",letterSpacing:2,marginBottom:5}}>あなたの入力</div>
          <div style={{fontFamily:"monospace",fontSize:18,letterSpacing:4,color:C.red,background:"rgba(255,51,68,0.1)",padding:"8px 16px",borderRadius:6,border:"1px solid rgba(255,51,68,0.3)",marginBottom:8}}>{result.codeStr || "（未入力）"}</div>
        </div>
      )}

      <div>
        <div style={{fontSize:10,color:C.muted,fontFamily:"monospace",letterSpacing:2,marginBottom:5}}>正解コード</div>
        <div style={{fontFamily:"monospace",fontSize:20,letterSpacing:5,color:C.yellow,background:"rgba(255,214,10,0.1)",padding:"10px 20px",borderRadius:6,border:"1px solid rgba(255,214,10,0.3)"}}>{q.answer}</div>
      </div>

      {ex && (
        <div style={{width:"100%",maxWidth:300,background:C.surface2,borderRadius:8,padding:"10px 14px",border:`1px solid rgba(0,212,255,0.2)`}}>
          <div style={{fontSize:10,color:C.cyan,fontFamily:"monospace",letterSpacing:2,marginBottom:8}}>▶ 出力される2コード</div>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {[{label:"CODE 1",code:ex.code1,color:C.orange,bg:"rgba(255,107,53,0.1)",desc:"サーブ/アタック側"},
              {label:"CODE 2",code:ex.code2,color:C.cyan,  bg:"rgba(0,212,255,0.1)", desc:"受け側（自動生成）"}].map(({label,code,color,bg,desc}) => (
              <div key={label} style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:10,color:C.muted,fontFamily:"monospace",width:40}}>{label}</span>
                <span style={{fontFamily:"monospace",fontSize:15,letterSpacing:3,color,background:bg,padding:"3px 10px",borderRadius:4}}>{code}</span>
                <span style={{fontSize:10,color:C.muted}}>{desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {q.compound && (
        <div style={{display:"flex",alignItems:"center",gap:6,padding:"3px 12px",borderRadius:20,border:"1px solid rgba(0,212,255,0.3)",fontSize:10,color:C.cyan,fontFamily:"monospace"}}>
          ⚡ COMPOUND CODE
        </div>
      )}

      <div style={{fontSize:13,color:"rgba(220,235,255,0.75)",lineHeight:1.85,maxWidth:300,background:C.surface2,padding:"12px 14px",borderRadius:8,border:`1px solid ${C.border}`,textAlign:"left"}}>{q.explanation}</div>

      {result.correct && (
        <div style={{display:"inline-flex",alignItems:"center",gap:6,background:"rgba(255,107,53,0.12)",border:`1px solid ${C.orange}`,borderRadius:20,padding:"4px 16px",fontSize:13,color:C.orange,fontFamily:"monospace"}}>
          ⚡ +{result.gainXp} XP {streak >= 3 ? "🔥 STREAK!" : ""}
        </div>
      )}

      <span style={{padding:"3px 10px",borderRadius:20,border:`1px solid ${SKILL_COLOR[q.skill]}`,color:SKILL_COLOR[q.skill],fontSize:10,fontFamily:"monospace",letterSpacing:2}}>{q.skill} — {SKILL_LABEL[q.skill]}</span>

      <div style={{display:"flex",gap:10,width:"100%",maxWidth:290}}>
        <button onClick={onNext} style={{flex:2,padding:"12px",background:`linear-gradient(135deg,${C.orange},#e65100)`,border:"none",borderRadius:10,color:"white",fontWeight:700,fontSize:14,letterSpacing:2,cursor:"pointer",fontFamily:"'Noto Sans JP',sans-serif"}}>次へ →</button>
      </div>
      <button onClick={onHome} style={{background:"transparent",border:"none",color:"rgba(220,235,255,0.25)",cursor:"pointer",fontSize:11,fontFamily:"monospace",letterSpacing:1}}>ホームに戻る</button>
    </div>
  );
}

function RoundReviewScreen({ roundData, streak, onContinue, onHome }) {
  const pct = Math.round((roundData.correct / ROUND_SIZE) * 100);
  const msg = pct >= 80 ? "素晴らしい！この調子で次も！" : pct >= 60 ? "まずまず。次は完璧を目指そう！" : "復習して次に挑戦しよう！";
  const icon = pct >= 80 ? "🏆" : pct >= 60 ? "🎯" : "📋";
  return (
    <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"28px 20px",gap:14,animation:"fadeIn 0.4s ease"}}>
      <div style={{fontSize:52,animation:"pop 0.4s ease"}}>{icon}</div>
      <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:30,letterSpacing:5,color:C.yellow}}>ROUND {roundData.num} 完了</div>
      <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:48,letterSpacing:3}}>
        <span style={{color:pct>=80?C.green:pct>=60?C.yellow:C.orange}}>{roundData.correct}</span>
        <span style={{color:C.muted,fontSize:22}}> / {ROUND_SIZE}</span>
      </div>
      <div style={{fontSize:11,color:C.muted,fontFamily:"monospace",letterSpacing:1}}>正解率 {pct}%</div>
      {roundData.xpGained > 0 && (
        <div style={{display:"inline-flex",alignItems:"center",gap:6,background:"rgba(255,107,53,0.12)",border:`1px solid ${C.orange}`,borderRadius:20,padding:"5px 18px",fontSize:14,color:C.orange,fontFamily:"monospace"}}>
          ⚡ +{roundData.xpGained} XP
        </div>
      )}
      {streak >= 3 && (
        <div style={{display:"inline-flex",alignItems:"center",gap:6,background:"rgba(255,107,53,0.08)",border:`1px solid ${C.orange}`,borderRadius:20,padding:"3px 14px",fontSize:12,color:C.orange,fontFamily:"monospace"}}>
          🔥 ストリーク継続中 ×{streak}
        </div>
      )}
      <div style={{fontSize:13,color:"rgba(220,235,255,0.7)",textAlign:"center",lineHeight:1.8,background:C.surface2,padding:"12px 16px",borderRadius:8,border:`1px solid ${C.border}`,maxWidth:280}}>{msg}</div>
      <button onClick={onContinue} style={{padding:"14px 0",width:"100%",maxWidth:260,background:`linear-gradient(135deg,${C.orange},#e65100)`,border:"none",borderRadius:10,color:"white",fontWeight:900,fontSize:15,letterSpacing:3,cursor:"pointer",fontFamily:"'Noto Sans JP',sans-serif"}}>
        次のクールへ →
      </button>
      <button onClick={onHome} style={{background:"transparent",border:"none",color:"rgba(220,235,255,0.25)",cursor:"pointer",fontSize:11,fontFamily:"monospace",letterSpacing:1}}>ホームに戻る</button>
    </div>
  );
}

function GameScreen({ q, qs, qIndex, input, shake, streak, score, animKey, xpAnim, unlockAnim, onKey, onSubmit, onClearInput, onHome }) {
  const qNum = (qIndex % qs.length) + 1;
  return (
    <>
      {xpAnim && (
        <div style={{position:"fixed",top:"16%",left:"50%",color:C.yellow,fontFamily:"'Bebas Neue',sans-serif",fontSize:26,letterSpacing:3,pointerEvents:"none",zIndex:50,animation:"xpFloat 1.5s ease forwards"}}>
          {xpAnim}
        </div>
      )}

      {unlockAnim && (
        <div style={{position:"fixed",top:"22%",left:"50%",transform:"translateX(-50%)",zIndex:60,animation:"unlockPop 0.5s ease forwards",pointerEvents:"none"}}>
          <div style={{background:"linear-gradient(135deg,rgba(0,255,136,0.25),rgba(0,212,255,0.15))",border:`1px solid ${C.green}`,borderRadius:12,padding:"10px 20px",textAlign:"center"}}>
            <div style={{fontSize:22}}>🔓</div>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:20,letterSpacing:3,color:C.green}}>{unlockAnim}</div>
          </div>
        </div>
      )}

      {/* ヘッダー */}
      <div style={{background:C.surface,padding:"6px 12px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
        <button onClick={onHome} style={{background:"transparent",border:"none",color:C.muted,cursor:"pointer",fontSize:18,padding:"4px 6px"}}>←</button>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontFamily:"monospace",fontSize:11,color:C.muted}}>Q.{qNum}<span style={{color:"rgba(220,235,255,0.2)"}}>/{qs.length}</span></span>
          {streak >= 2 && <span style={{background:"rgba(255,107,53,0.18)",border:`1px solid ${C.orange}`,borderRadius:20,padding:"2px 8px",fontSize:11,color:C.orange,fontFamily:"monospace"}}>🔥×{streak}</span>}
          <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,color:C.yellow,letterSpacing:2}}>{score}</span>
        </div>
        <div style={{display:"flex",gap:3}}>
          {[...Array(5)].map((_,i) => (
            <div key={i} style={{width:6,height:6,borderRadius:"50%",background:i<Math.floor(qIndex/qs.length)?C.yellow:i===Math.floor(qIndex/qs.length)?C.orange:"rgba(0,212,255,0.15)"}}/>
          ))}
        </div>
      </div>

      {/* コンテンツ */}
      <div style={{flex:1,overflowY:"auto",padding:"6px 10px",display:"flex",flexDirection:"column",gap:6}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{padding:"3px 10px",borderRadius:20,border:`1px solid ${SKILL_COLOR[q.skill]}`,color:SKILL_COLOR[q.skill],fontSize:10,fontFamily:"monospace",letterSpacing:2}}>{q.skill} — {SKILL_LABEL[q.skill]}</span>
          <span style={{fontSize:10,color:C.muted,fontFamily:"monospace"}}>Lv.{q.level}</span>
        </div>

        <CourtAnim scene={q.scene} animKey={animKey} showSub={q.level >= 4}/>

        <div style={{background:C.surface2,borderRadius:8,padding:"8px 12px",border:`1px solid ${C.border}`}}>
          <div style={{fontSize:10,color:C.muted,fontFamily:"monospace",letterSpacing:2,marginBottom:3}}>シーン</div>
          <div style={{fontSize:13,fontWeight:700,lineHeight:1.7}}>{q.scene.desc}</div>
        </div>

        {/* 入力フィールド */}
        <div style={{background:"#0d1f3a",border:`2px solid ${shake?C.red:C.border}`,borderRadius:8,padding:"8px 12px",display:"flex",alignItems:"center",justifyContent:"space-between",animation:shake?"shake 0.4s ease":"none",minHeight:44}}>
          <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:20,letterSpacing:5,color:C.cyan,flex:1}}>
            {input || <span style={{color:"rgba(0,212,255,0.2)",fontSize:12,letterSpacing:2}}>キーをタップ...</span>}
          </span>
          <div style={{display:"flex",gap:5,alignItems:"center"}}>
            {input && <button onClick={onClearInput} style={{background:"transparent",border:"none",color:"rgba(220,235,255,0.3)",cursor:"pointer",fontSize:14,padding:"2px 4px"}}>✕</button>}
            <button onClick={onSubmit} disabled={!input.trim()} style={{padding:"6px 14px",borderRadius:6,border:"none",background:input.trim()?`linear-gradient(135deg,${C.orange},#e65100)`:"rgba(255,255,255,0.06)",color:input.trim()?"white":"rgba(220,235,255,0.3)",fontWeight:700,fontSize:12,letterSpacing:1,cursor:input.trim()?"pointer":"default",fontFamily:"'Noto Sans JP',sans-serif"}}>確定</button>
          </div>
        </div>
      </div>

      <SoftKeyboard onKey={onKey} onSubmit={onSubmit}/>
    </>
  );
}

// ══════════════════════════════════════════════════════════════
// 11. メインアプリ
// ══════════════════════════════════════════════════════════════
export default function VolleyCoder() {
  const [screen,      setScreen]      = useState("home");
  const [levelFilter, setLevelFilter] = useState(1);
  const [qIndex,      setQIndex]      = useState(0);
  const [input,       setInput]       = useState("");
  const [result,      setResult]      = useState(null);
  const [score,       setScore]       = useState(0);
  const [streak,      setStreak]      = useState(0);
  const [maxStreak,   setMaxStreak]   = useState(() => Number(localStorage.getItem("vc_max_streak")) || 0);
  const [xp,          setXp]          = useState(() => Number(localStorage.getItem("vc_xp")) || 0);
  const [stats,       setStats]       = useState(() => {
    try {
      const saved = localStorage.getItem("vc_stats");
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });
  const [xpAnim,      setXpAnim]      = useState(null);
  const [unlockAnim,  setUnlockAnim]  = useState(null);
  const [animKey,     setAnimKey]     = useState(0);
  const [shake,       setShake]       = useState(false);
  const [rq,          setRq]          = useState(null);
  const [roundData,   setRoundData]   = useState({ num:1, correct:0, xpGained:0, count:0 });
  const [qOrder,      setQOrder]      = useState([]);

  const maxUnlockedLevel = getMaxUnlockedLevel(xp);
  const prevMaxLevel = useRef(maxUnlockedLevel);

  // データの永続化
  useEffect(() => {
    localStorage.setItem("vc_xp", xp);
  }, [xp]);

  useEffect(() => {
    localStorage.setItem("vc_max_streak", maxStreak);
  }, [maxStreak]);

  useEffect(() => {
    localStorage.setItem("vc_stats", JSON.stringify(stats));
  }, [stats]);

  const safeLevelFilter  = Math.min(levelFilter, maxUnlockedLevel);
  const qs       = QUESTIONS.filter(q => q.level <= safeLevelFilter);
  const q        = qOrder.length > 0 ? qs[qOrder[qIndex % qOrder.length]] : qs[0];
  const rank     = getRank(xp);
  const nextRank = getNextRank(xp);
  const xpPct    = nextRank ? Math.round(((xp - rank.xpReq) / (nextRank.xpReq - rank.xpReq)) * 100) : 100;
  const displayQ = rq ?? q;

  useEffect(() => {
    if (maxUnlockedLevel > prevMaxLevel.current) {
      setUnlockAnim(`Lv.${maxUnlockedLevel} 解放！`);
      setLevelFilter(maxUnlockedLevel);
      const timer = setTimeout(() => setUnlockAnim(null), 3000);
      prevMaxLevel.current = maxUnlockedLevel;
      return () => clearTimeout(timer);
    }
  }, [maxUnlockedLevel]);

  useEffect(() => {
    if (screen === "game") {
      setAnimKey(k => k + 1);
      setRq(randomizeQuestion(q));
      if (qOrder.length > 0 && qIndex > 0 && qIndex % qOrder.length === 0) {
        setQOrder(shuffleIndices(qs.length));
      }
    }
  }, [screen, qIndex]);

  const handleKey = useCallback((v) => {
    if (v === "BS") { setInput(i => i.slice(0, -1)); return; }
    setInput(i => i + v);
  }, []);

  const handleSubmit = useCallback(() => {
    if (!input.trim()) return;
    const dq      = rq ?? q;
    const correct = dq.variants.some(v => v.trim().toLowerCase() === input.trim().toLowerCase());
    const gainXp  = correct ? (dq.level * 10 + (streak >= 3 ? 5 : 0)) : 0;
    if (correct) {
      setScore(s => s + 1);
      setStreak(s => { const ns = s + 1; setMaxStreak(m => Math.max(m, ns)); return ns; });
      setXp(x => x + gainXp);
      setXpAnim(`+${gainXp} XP`);
      setTimeout(() => setXpAnim(null), 1600);
    } else {
      setStreak(0);
      setShake(true);
      setTimeout(() => setShake(false), 400);
    }
    setStats(p => ({ ...p, [q.id]: correct }));
    setRoundData(r => ({ ...r, correct: r.correct + (correct?1:0), xpGained: r.xpGained + gainXp, count: r.count + 1 }));
    setResult({ correct, codeStr: input, gainXp });
  }, [input, q, rq, streak]);

  const handleNext = useCallback(() => {
    setInput(""); setResult(null);
    if (roundData.count > 0 && roundData.count % ROUND_SIZE === 0) {
      setScreen("roundReview");
    } else {
      setQIndex(i => i + 1);
      setScreen("game");
    }
  }, [roundData.count]);

  const handleContinueRound = useCallback(() => {
    setRoundData(r => ({ num: r.num + 1, correct: 0, xpGained: 0, count: 0 }));
    setQIndex(i => i + 1);
    setScreen("game");
  }, []);

  const shuffleIndices = (len) => {
    const arr = Array.from({length: len}, (_, i) => i);
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  const handleStart = useCallback(() => {
    const order = shuffleIndices(qs.length);
    setQOrder(order);
    setQIndex(0); setScore(0); setStreak(0);
    setInput(""); setResult(null); setRq(null);
    setRoundData({ num:1, correct:0, xpGained:0, count:0 });
    setScreen("game");
  }, [qs]);

  const shell = (children) => (
    <div style={{fontFamily:"'Noto Sans JP',sans-serif",background:C.bg,color:C.text,height:"100vh",display:"flex",flexDirection:"column",maxWidth:480,margin:"0 auto",overflow:"hidden"}}>
      <style>{GLOBAL_CSS}</style>
      {children}
    </div>
  );

  if (screen === "home") return shell(
    <HomeScreen
      score={score} maxStreak={maxStreak}
      xp={xp} rank={rank} xpPct={xpPct} nextRank={nextRank}
      levelFilter={safeLevelFilter} setLevelFilter={setLevelFilter}
      maxUnlockedLevel={maxUnlockedLevel}
      onStart={handleStart} onNav={setScreen}
    />
  );

  if (screen === "prog") return shell(
    <ProgressScreen
      stats={stats} xp={xp} rank={rank} xpPct={xpPct} nextRank={nextRank}
      onBack={() => setScreen("home")}
    />
  );

  if (screen === "ref") return shell(
    <ReferenceScreen onBack={() => setScreen("home")} />
  );

  if (screen === "roundReview") return shell(
    <RoundReviewScreen
      roundData={roundData} streak={streak}
      onContinue={handleContinueRound} onHome={() => setScreen("home")}
    />
  );

  if (result) return shell(
    <ResultScreen
      result={result} q={displayQ} streak={streak}
      onNext={handleNext} onHome={() => setScreen("home")}
    />
  );

  return shell(
    <GameScreen
      q={displayQ} qs={qs} qIndex={qIndex}
      input={input} shake={shake} streak={streak} score={score}
      animKey={animKey} xpAnim={xpAnim} unlockAnim={unlockAnim}
      onKey={handleKey} onSubmit={handleSubmit}
      onClearInput={() => setInput("")}
      onHome={() => setScreen("home")}
    />
  );
}
