import { C, SKILL_COLOR, SKILL_LABEL } from "../constants.js";

export default function ReferenceScreen({ onBack }) {
  const compoundExamples = [
    ["3SM.6+", "3番J.フローター → 相手6番が優れたレセプション（S系→R）"],
    ["7S.3=",  "7番サーブ → 相手3番がレセプションミス（S系→R=）"],
    ["7A.1#",  "7番スパイク → 相手1番ブロック決定 → 7A/ / a1B#"],
    ["7A.1=",  "7番スパイク → 相手1番ブロックミス → 7A# / a1B="],
    ["7A.1D",  "7番スパイク → 相手1番ディグ継続  → 7A  / a1D"],
    ["7A.1D+", "7番スパイク → 相手1番優れたディグ → 7A  / a1D+"],
  ];
  const skillRows = [
    {k:"S",rows:[["S","基本サーブ"],["SM","ジャンプフローター（無回転変化球）"],["SQ","ジャンピングサーブ（トップスピン）"]]},
    {k:"A",rows:[["A","スパイク（汎用）"],["PV","レフト平行（ゾーン4から）"],["PZ","ライト平行（ゾーン2から）"],["PA","Aクイック（ゾーン3から）"],["PB","Bクイック（ゾーン3から）"],["PC","Cクイック（ゾーン3から）"],["P8","パイプ（ゾーン8から）"],["P9","ライトバックアタック（ゾーン9から）"],["P1","レフトハイボール（ゾーン4から）"],["P5","ライトハイボール（ゾーン2から）"]]},
    {k:"R",rows:[["R","レセプション（評価なし = 普通）"],["R#","完璧なレセプション（パーフェクト）"],["R+","優れたレセプション"],["R!","普通のレセプション"],["R-","やや悪いレセプション"],["R=","レセプションミス"]]},
    {k:"E",rows:[["E","セット（トス）"]]},
    {k:"B",rows:[["B#","ブロック決定"],["B=","ブロックミス"]]},
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

        <button onClick={onBack} style={{width:"100%",padding:"12px",background:`linear-gradient(135deg,${C.orange},#e65100)`,border:"none",borderRadius:10,color:"white",fontWeight:700,fontSize:14,letterSpacing:2,cursor:"pointer",fontFamily:"'Noto Sans JP',sans-serif"}}>← ホームに戻る</button>
      </div>
    </>
  );
}
