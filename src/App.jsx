import { useState, useEffect, useCallback, useRef } from "react";

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
    {label:"SP", value:" ",  color:C.muted,  hint:"スペース(区切り)", wide:true},
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

// ══════════════════════════════════════════════════════════════
// 4. 問題バンク（テンプレート形式）
// {A}/{B} は背番号スロット。players:{A:初期値} で定義。
// ══════════════════════════════════════════════════════════════
const QUESTIONS_RAW = [
  {skill:"S",level:1,
   players:{A:7},
   scene:{
     desc:"{A}番がサーブを打った。",
     ball:[{fx:245,fy:222,tx:150,ty:66}],
     actors:[{n:"A",side:"home",x:245,y:220}],
     hlHome:[1],hlAway:[],
   },
   answer:"{A}S",variants:["{A}S"],
   explanation:"基本形：背番号＋S。評価なしはラリーが続いたことを意味します。",
   cycle2:[
     {extraPlayers:{B:4},descSuffix:"相手{B}番のレセプション評価は+。",answer:"{A}S.{B}+",variants:["{A}S.{B}+"],explanation:"S系コンパウンド。{A}S.{B}+ → CODE1:{A}S / CODE2:a{B}R+（優れたレセプション）。"},
     {extraPlayers:{B:4},descSuffix:"相手{B}番のレセプション評価は！。",answer:"{A}S.{B}!",variants:["{A}S.{B}!","{A}S"],explanation:"S系コンパウンド。{A}S.{B}! → CODE1:{A}S / CODE2:a{B}R!（普通のレセプション）。"},
     {extraPlayers:{B:4},descSuffix:"相手{B}番のレセプション評価は－。",answer:"{A}S.{B}-",variants:["{A}S.{B}-"],explanation:"S系コンパウンド。{A}S.{B}- → CODE1:{A}S / CODE2:a{B}R-（やや悪いレセプション）。"},
   ]},

  {skill:"S",level:1,
   players:{A:3},
   scene:{
     desc:"{A}番のサーブがエースになった！",
     ball:[{fx:55,fy:222,tx:150,ty:34}],
     actors:[{n:"A",side:"home",x:55,y:220}],
     hlHome:[5],hlAway:[6],result:"ace",
   },
   answer:"{A}S#",variants:["{A}S#"],
   explanation:"「#」は決定。サーブエース = S# です。"},

  {skill:"A",level:1,
   players:{A:5},
   scene:{
     desc:"{A}番がスパイクを打って得点！",
     ball:[{fx:70,fy:128,tx:110,ty:66,spike:true}],
     actors:[{n:"A",side:"home",x:70,y:126,jump:true}],
     hlHome:[4],hlAway:[],result:"ace",
   },
   answer:"{A}A#",variants:["{A}A#"],
   explanation:"A = アタック。決定は「#」。"},

  {skill:"B",level:1,
   players:{A:2},
   scene:{
     desc:"自チーム{A}番が相手スパイクをブロックして得点！",
     ball:[{fx:230,fy:98,tx:230,ty:115},{fx:230,fy:115,tx:210,ty:185}],
     actors:[{n:"A",side:"home",x:230,y:128,jump:true},{n:6,side:"away",x:230,y:98,jump:true}],
     hlHome:[2],hlAway:[],result:"ace",
   },
   answer:"{A}B#",variants:["{A}B#"],
   explanation:"B = Block。ブロック成功も「#」で記録。"},

  {skill:"E",level:1,
   players:{A:10},
   scene:{
     desc:"セッター{A}番がトスを上げた。",
     ball:[{fx:150,fy:162,tx:150,ty:130},{fx:150,fy:130,tx:70,ty:130}],
     actors:[{n:"A",side:"home",x:150,y:162}],
     hlHome:[8],hlAway:[],
   },
   answer:"{A}E",variants:["{A}E"],
   explanation:"E = sEt（トス）。セッターの背番号＋E。ゾーン8は中央。",
   cycle2:[
     {descSuffix:"このトスの評価は+。",answer:"{A}E+",variants:["{A}E+"],explanation:"E+ = 優れたセット。アタッカーが打ちやすいトス。"},
     {descSuffix:"このトスの評価は－。",answer:"{A}E-",variants:["{A}E-"],explanation:"E- = やや悪いセット。アタッカーが打ちにくいトス。"},
   ]},

  {skill:"D",level:1,
   players:{A:8},
   scene:{
     desc:"相手スパイクを自チーム{A}番がディグした。",
     ball:[{fx:230,fy:98,tx:150,ty:162},{fx:150,fy:162,tx:150,ty:145}],
     actors:[{n:"A",side:"home",x:150,y:160},{n:4,side:"away",x:230,y:98,jump:true}],
     hlHome:[8],hlAway:[],
   },
   answer:"{A}D",variants:["{A}D","{A}D!"],
   explanation:"D = Dig（スパイクレシーブ）。ゾーン8（センター）でスパイクを拾った。",
   cycle2:[
     {descSuffix:"このディグの評価は+。",answer:"{A}D+",variants:["{A}D+"],explanation:"D+ = 優れたディグ。セッターが上げやすい好レシーブ。"},
     {descSuffix:"このディグは＝（ミス）だった。",answer:"{A}D=",variants:["{A}D="],explanation:"D= = ディグミス。スパイクを拾えず失点。"},
   ]},

  {skill:"A",level:2,
   players:{A:1},
   scene:{
     desc:"相手{A}番（右後）がスパイクを打ったがアウトになった。",
     ball:[{fx:70,fy:34,tx:40,ty:215,spike:true}],
     actors:[{n:"A",side:"away",x:70,y:34,jump:true}],
     hlHome:[],hlAway:[1],result:"miss",
   },
   answer:"a{A}A=",variants:["a{A}A="],
   explanation:"相手チームは先頭に「a」を付ける。a{A}A= = 相手{A}番のスパイクアウト。"},

  {skill:"A",level:2,
   players:{A:9,B:2},
   scene:{
     desc:"相手{A}番がスパイクを打ち、自チーム{B}番がブロックして得点。",
     ball:[{fx:70,fy:66,tx:70,ty:115},{fx:70,fy:115,tx:90,ty:185}],
     actors:[{n:"A",side:"away",x:70,y:64,jump:true},{n:"B",side:"home",x:70,y:128,jump:true}],
     hlHome:[4],hlAway:[9],result:"ace",
   },
   answer:"a{A}A=",variants:["a{A}A="],
   explanation:"ブロックされたスパイクは「=」ミス。相手なので先頭に「a」。"},

  {skill:"S",level:2,
   compound:true,
   players:{A:7,B:3},
   scene:{
     desc:"相手{A}番がサーブを打ち、自チーム{B}番がレシーブした。コンパウンドコードで入力せよ。",
     ball:[{fx:55,fy:15,tx:70,ty:195},{fx:70,fy:195,tx:150,ty:162}],
     actors:[{n:"A",side:"away",x:55,y:18},{n:"B",side:"home",x:70,y:193}],
     hlHome:[5],hlAway:[1],
   },
   answer:"a{A}S.{B}!",variants:["a{A}S.{B}!","a{A}S.{B}"],
   explanation:"相手サーブもコンパウンドで記録。a{A}S.{B}! = 相手{A}番サーブ / 自チーム{B}番が普通のレシーブ（継続）。"},

  {skill:"S",level:2,
   compound:true,
   players:{A:8,B:3},
   scene:{
     desc:"相手{A}番がサーブを打ち、自チーム{B}番が優れたレセプションで返した。コンパウンドコードで入力せよ。",
     ball:[{fx:150,fy:15,tx:70,ty:195},{fx:70,fy:195,tx:150,ty:162}],
     actors:[{n:"A",side:"away",x:150,y:18},{n:"B",side:"home",x:70,y:193}],
     hlHome:[5],hlAway:[6],result:"good",
   },
   answer:"a{A}S.{B}+",variants:["a{A}S.{B}+"],
   explanation:"a{A}S.{B}+ = 相手{A}番サーブ / 自チーム{B}番の優れたレセプション。S系は「.」後が常にR（レセプション）。"},

  {skill:"S",level:2,
   compound:true,
   players:{A:6,B:4},
   scene:{
     desc:"相手{A}番がサーブを打ち、自チーム{B}番がレシーブミスした。コンパウンドコードで入力せよ。",
     ball:[{fx:150,fy:15,tx:70,ty:195}],
     actors:[{n:"A",side:"away",x:150,y:18},{n:"B",side:"home",x:70,y:193}],
     hlHome:[5],hlAway:[6],result:"miss",
   },
   answer:"a{A}S.{B}=",variants:["a{A}S.{B}="],
   explanation:"a{A}S.{B}= = 相手{A}番サーブ / 自チーム{B}番がレセプションミス。「=」でミスを示す。結果的に相手サーブエースと同義。"},

  {skill:"S",level:2,
   compound:true,
   players:{A:7,B:3},
   scene:{
     desc:"{A}番がサーブを打ち、相手{B}番がレセプションミスした。コンパウンドコードで入力せよ。",
     ball:[{fx:55,fy:222,tx:150,ty:34}],
     actors:[{n:"A",side:"home",x:55,y:220},{n:"B",side:"away",x:150,y:34}],
     hlHome:[5],hlAway:[6],result:"ace",
   },
   answer:"{A}S.{B}=",variants:["{A}S.{B}="],
   explanation:"{A}S.{B}= → CODE1: {A}S（{A}番サーブ） / CODE2: a{B}R=（相手{B}番のレセプションミス）。結果的にサーブエースと同義。"},

  {skill:"A",level:2,
   compound:true,
   players:{A:5,B:8},
   scene:{
     desc:"{A}番がスパイクを打ち、相手{B}番がブロック決定した。コンパウンドコードで入力せよ。",
     ball:[{fx:70,fy:128,tx:150,ty:66,spike:true},{fx:150,fy:66,tx:150,ty:130}],
     actors:[{n:"A",side:"home",x:70,y:126,jump:true},{n:"B",side:"away",x:150,y:66,jump:true}],
     hlHome:[4],hlAway:[8],result:"ace",
   },
   answer:"{A}A.{B}#",variants:["{A}A.{B}#"],
   explanation:"{A}A.{B}# → CODE1: {A}A/（ブロックされた） / CODE2: a{B}B#（ブロック決定）。A系・Dなし・受け#→スパイク側は/になる。"},

  {skill:"A",level:2,
   compound:true,
   players:{A:2,B:9},
   scene:{
     desc:"{A}番がスパイクを打ち、相手{B}番がディグで返した。コンパウンドコードで入力せよ。",
     ball:[{fx:230,fy:128,tx:150,ty:66,spike:true},{fx:150,fy:66,tx:150,ty:130}],
     actors:[{n:"A",side:"home",x:230,y:126,jump:true},{n:"B",side:"away",x:70,y:66}],
     hlHome:[2],hlAway:[8],
   },
   answer:"{A}A.{B}D",variants:["{A}A.{B}D","{A}A.{B}D!"],
   explanation:"{A}A.{B}D → CODE1: {A}A（{A}番スパイク） / CODE2: a{B}D（相手{B}番のディグ）。A系でD付き=ディグ。評価なしは継続。"},

  {skill:"A",level:3,
   players:{A:5},
   scene:{
     desc:"{A}番がレフト平行（PV）をゾーン7に打って決まった！",
     ball:[{fx:70,fy:128,tx:230,ty:66,spike:true}],
     actors:[{n:"A",side:"home",x:70,y:126,jump:true}],
     hlHome:[4],hlAway:[7],result:"ace",
   },
   answer:"{A}PV7#",variants:["{A}PV7#"],
   explanation:"PV = レフト平行（ゾーン4から打つ）。ゾーン7 = AWAY右エリア。{A}PV7# = {A}番・レフト平行・ゾーン7に決定。"},

  {skill:"A",level:3,
   compound:true,
   players:{A:7,B:3},
   scene:{
     desc:"{A}番がAクイック（PA）をゾーン1方向に打ったが、相手{B}番にブロックされた。コンパウンドコードで入力せよ。",
     ball:[{fx:150,fy:130,tx:70,ty:98,spike:true},{fx:70,fy:98,tx:70,ty:130}],
     actors:[{n:"A",side:"home",x:150,y:130,jump:true},{n:"B",side:"away",x:70,y:96,jump:true}],
     hlHome:[3],hlAway:[1],result:"ace",
   },
   answer:"{A}PA1.{B}#",variants:["{A}PA1.{B}#"],
   explanation:"{A}PA1.{B}# → CODE1: {A}PA1/（Aクイックがブロックされた） / CODE2: a{B}B#（相手{B}番ブロック決定）。P系アタックもA系と同じルールでコンパウンド展開。"},

  {skill:"S",level:4,
   players:{A:7},
   scene:{
     desc:"{A}番がゾーン1（右後）からジャンプフローターサーブを打った。",
     ball:[{fx:245,fy:222,tx:70,ty:98,curve:true}],
     actors:[{n:"A",side:"home",x:245,y:220,jump:true}],
     hlHome:[1],hlAway:[2],
   },
   answer:"{A}SM1",variants:["{A}SM1"],
   explanation:"SM = ジャンプフローター。ゾーン1（右後）から打った。{A}SM1 = {A}番・ジャンプフローター・ゾーン1から。"},

  {skill:"S",level:4,
   players:{A:11},
   scene:{
     desc:"{A}番がゾーン6（中後）からジャンピングサーブを打ったがネットに当たった。",
     ball:[{fx:150,fy:222,tx:150,ty:112,net:true}],
     actors:[{n:"A",side:"home",x:150,y:220,jump:true}],
     hlHome:[6],hlAway:[],result:"miss",
   },
   answer:"{A}SQ6=",variants:["{A}SQ6="],
   explanation:"SQ = ジャンピングサーブ（トップスピン）。ゾーン6 = 中央後衛。ネットは「=」ミス。"},

  {skill:"S",level:4,
   players:{A:1},
   scene:{
     desc:"{A}番がゾーン1（右後）からサーブを打ちエースになった！",
     ball:[{fx:245,fy:222,tx:230,ty:34}],
     actors:[{n:"A",side:"home",x:245,y:220}],
     hlHome:[1],hlAway:[5],result:"ace",
   },
   answer:"{A}S1#",variants:["{A}S1#","{A}S#"],
   explanation:"ゾーン番号はスキルの直後。{A}S1# = {A}番・サーブ・ゾーン1から・決定。"},

  {skill:"S",level:4,
   players:{A:9},
   scene:{
     desc:"{A}番がゾーン6（中後）からジャンプフローターをゾーン8（中央）に打った。",
     ball:[{fx:150,fy:222,tx:150,ty:66,curve:true}],
     actors:[{n:"A",side:"home",x:150,y:220,jump:true}],
     hlHome:[6],hlAway:[8],
   },
   answer:"{A}SM6",variants:["{A}SM6"],
   explanation:"SM = ジャンプフローター。ゾーン6（中後）から打った = {A}SM6。"},

  {skill:"S",level:4,
   compound:true,
   players:{A:3,B:6},
   scene:{
     desc:"{A}番がジャンプフローターサーブを打ち、相手{B}番が優れたレセプションで返した。コンパウンドコードで入力せよ。",
     ball:[{fx:245,fy:222,tx:150,ty:66},{fx:150,fy:66,tx:150,ty:130}],
     actors:[{n:"A",side:"home",x:245,y:220,jump:true},{n:"B",side:"away",x:150,y:64}],
     hlHome:[1],hlAway:[8],result:"good",
   },
   answer:"{A}SM.{B}+",variants:["{A}SM.{B}+"],
   explanation:"{A}SM.{B}+ → CODE1: {A}SM（{A}番J.フローター） / CODE2: a{B}R+（相手{B}番の優れたレセプション）。S系は「.」後がR（レセプション）になる。"},
];

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

const LEVEL_UNLOCK_XP = { 1: 0, 2: 150, 3: 400, 4: 900 };
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
  const leftSkillPart = p.left.replace(/^\d+/, "");
  const isServe  = leftSkillPart.startsWith("S");
  const isAttack = leftSkillPart.startsWith("A") || leftSkillPart.startsWith("P");
  let code1, code2;
  if (isServe) {
    code1 = p.left;
    code2 = `a${p.recvNum}R${p.recvEval}`;
  } else if (isAttack) {
    if (p.hasD) {
      code1 = p.left;
      code2 = `a${p.recvNum}D${p.recvEval}`;
    } else {
      const attackEval = p.recvEval === "#" ? "/" : p.recvEval === "=" ? "#" : "";
      code1 = `${p.left}${attackEval}`;
      code2 = `a${p.recvNum}B${p.recvEval}`;
    }
  } else {
    code1 = p.left;
    code2 = `a${p.recvNum}D${p.recvEval}`;
  }
  return { code1, code2, isServe, isAttack, hasD: p.hasD };
}

// ══════════════════════════════════════════════════════════════
// 6b. 背番号ランダム化
// ══════════════════════════════════════════════════════════════
const JERSEY_POOL = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20];

function randomizeQuestion(q, cycleNum = 0) {
  let base = q;
  if (cycleNum >= 1 && base.cycle2?.length > 0) {
    const c2 = base.cycle2[Math.floor(Math.random() * base.cycle2.length)];
    base = {
      ...base,
      players: { ...base.players, ...(c2.extraPlayers || {}) },
      scene: { ...base.scene, desc: base.scene.desc + " " + c2.descSuffix },
      answer: c2.answer,
      variants: c2.variants,
      explanation: c2.explanation ?? base.explanation,
    };
  }
  if (!base.players) return base;
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
    ? str.replace(/\{(\w)\}/g, (_, k) => numMap[k] ?? k)
    : str;
  return {
    ...base,
    scene: {
      ...base.scene,
      desc: sub(base.scene.desc),
      actors: base.scene.actors?.map(a => ({
        ...a,
        n: typeof a.n === "string" ? (numMap[a.n] ?? a.n) : a.n,
      })),
    },
    answer: sub(base.answer),
    variants: base.variants.map(sub),
    explanation: sub(base.explanation),
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
      <div style={{position:"relative",width:"100%",paddingBottom:"70%",borderRadius:12,overflow:"hidden"}}>
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
            const isUtil  = isBs || isSp;
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
          {[1,2,3,4].map(l => {
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
          {[1,2,3,4].map(l => {
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
    {k:"R",rows:[["（コンパウンドのみ）","R単体での入力はしない。必ずコンパウンドコード「.」経由で記録する"],["S系.番号+","例: a7S.3+ = 相手7番サーブ / 3番の優れたレセプション"],["S系.番号=","例: a6S.4= = 相手6番サーブ / 4番のレシーブミス"]]},
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
  const q        = qs[qIndex % qs.length];
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
      const cycleNum = Math.floor(qIndex / qs.length);
      setRq(randomizeQuestion(q, cycleNum));
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

  const handleStart = useCallback(() => {
    setQIndex(0); setScore(0); setStreak(0);
    setInput(""); setResult(null); setRq(null);
    setRoundData({ num:1, correct:0, xpGained:0, count:0 });
    setScreen("game");
  }, []);

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
