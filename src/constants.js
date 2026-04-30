export const C = {
  bg:"#04080f", surface:"#0c1524", surface2:"#111f36",
  border:"rgba(0,212,255,0.18)",
  orange:"#ff6b35", yellow:"#ffd60a", cyan:"#00d4ff",
  green:"#00ff88", red:"#ff3344", purple:"#a855f7",
  muted:"rgba(220,235,255,0.45)", text:"#dce8ff",
};

export const SKILL_COLOR = {S:C.orange,A:C.yellow,R:C.cyan,E:C.purple,B:C.green,D:"#f97316"};
export const SKILL_LABEL = {S:"サーブ",A:"アタック",R:"レセプション",E:"トス",B:"ブロック",D:"ディグ"};

export const KB_ROWS = [
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

export const TUTORIAL_SLIDES = [
  {
    title: "DataVolley記法とは",
    body: "バレーボールの各プレーを、短いコードで記録する世界標準の入力方式です。「誰が」「どんなプレーを」「どう結果したか」を記号化することで、試合を瞬時にデータ化します。近年主流の分析ソフトである「VolleyStation」でも、DataVolleyとほぼ同じコードルールが採用されています。そのため、一度この記法を習得してしまえば、分析環境が変わっても通用する「アナリストの共通言語」として長く役立つスキルになります。\n最初からすべてのコードを完璧に入力する必要はありません。DataVolley記法は、自分のレベルに合わせて情報量をコントロールできるのが大きな特徴です。最初は「サーブ」や「アタック」といった基本プレーだけを記録し、慣れてきたら「アタックのコース」や「セッターのトス位置」など、より詳細な情報を付け足していくことができます。\nVolleyCoderでは、あなたのスキルに合わせてコード入力を基礎から無理なく練習できます。まずはシンプルな入力から始め、少しずつステップアップしていきましょう！",
    example: null,
    note: null,
  },
  {
    title: "基本構造",
    body: "コードは「背番号 ＋ スキル ＋ 評価」の順で構成されます。",
    example: "7S#",
    note: "7番がサーブを打ってエース",
  },
  {
    title: "スキルコード",
    body: "プレーの種類をアルファベット1文字で表します。",
    example: null,
    table: [
      ["S", "サーブ"],
      ["R", "レセプション（サーブレシーブ）"],
      ["A", "アタック（スパイク）"],
      ["B", "ブロック"],
      ["D", "ディグ（スパイクレシーブ）"],
      ["E", "セット（トス）"],
    ],
  },
  {
    title: "評価コード",
    body: "プレーの結果や質を記号で表します。/nアタックの場合、一般的に",
    example: null,
    table: [
      ["#", "決定（得点）"],
      ["=", "ミス（失点）"],
      ["+", "ポジティブアタック"],
      ["!", "ブロックのリバウンド"],
      ["-", "ネガティブアタック"],
      ["/", "シャットアウト"],
      
    ],
  },
  {
    title: "相手チームのプレー",
    body: "相手チームのプレーには「a」を先頭に付けます。",
    example: "a3S#",
    note: "相手3番がサーブエース",
  },
  {
    title: "コンパウンドコード",
    body: "2つのプレーを「.」でつなげて1コードにします。\nLv3以降で登場します。",
    example: "a7S.3+",
    note: "相手7番のサーブ → 自チーム3番が優れたレセプション",
  },
  {
    title: "準備完了！",
    body: "まずはLv1の基本コードから挑戦しましょう。\n問題文とコートを見てコードを入力してください。",
    example: null,
    note: null,
  },
];

export const HOME_ZONES = {
  1:{x:230,y:195}, 2:{x:230,y:130}, 3:{x:150,y:130},
  4:{x:70, y:130}, 5:{x:70, y:195}, 6:{x:150,y:195},
  7:{x:70, y:162}, 8:{x:150,y:162}, 9:{x:230,y:162},
};
export const AWAY_ZONES = {
  1:{x:70,  y:34},  2:{x:70,  y:98},  3:{x:150, y:98},
  4:{x:230, y:98},  5:{x:230, y:34},  6:{x:150, y:34},
  7:{x:230, y:66},  8:{x:150, y:66},  9:{x:70,  y:66},
};
export const ZW = 64;
export const ZH = 26;
export const SUB = {
  A:{ dx: ZW/4,  dy: ZH/4 },
  B:{ dx: ZW/4,  dy:-ZH/4 },
  C:{ dx:-ZW/4,  dy:-ZH/4 },
  D:{ dx:-ZW/4,  dy: ZH/4 },
};

export const ROUND_SIZE = 7;
export const TIME_LIMIT = 10;

export const RANKS = [
  {level:1,name:"見習い",icon:"📋",xpReq:0},
  {level:2,name:"初級",icon:"🎯",xpReq:150},
  {level:3,name:"中級",icon:"🏅",xpReq:400},
  {level:4,name:"上級",icon:"🏆",xpReq:900},
  {level:5,name:"代表",icon:"⭐",xpReq:1800},
];

export const LEVEL_UNLOCK_XP = { 1: 0, 2: 150, 3: 400, 4: 900, 5: 1800 };

export const GLOBAL_CSS = `
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
  @keyframes timerPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.18)}}
  button:active{opacity:0.7!important;transform:scale(0.95)!important}
`;
