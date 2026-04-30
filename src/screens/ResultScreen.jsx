import { C, SKILL_COLOR, SKILL_LABEL } from "../constants.js";
import { expandCompound } from "../utils/gameUtils.js";

export default function ResultScreen({ result, q, streak, onNext, onHome }) {
  const ex = q.compound && result.correct ? expandCompound(result.codeStr) : null;

  return (
    <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px 20px",textAlign:"center",gap:12,borderTop:`3px solid ${result.correct?C.green:C.red}`,background:result.correct?"rgba(0,255,136,0.03)":"rgba(255,51,68,0.03)"}}>
      <div style={{fontSize:58,animation:"pop 0.4s ease"}}>{result.correct ? "🎯" : result.timeout ? "⏰" : "🔕"}</div>
      <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:38,letterSpacing:4,color:result.correct?C.green:C.red}}>{result.correct ? "SPIKE!!" : result.timeout ? "TIMEOUT!" : "OUT!"}</div>

      {result.timeout && (
        <div style={{display:"inline-flex",alignItems:"center",gap:6,background:"rgba(255,51,68,0.1)",border:`1px solid ${C.red}`,borderRadius:20,padding:"4px 16px",fontSize:12,color:C.red,fontFamily:"monospace",letterSpacing:1}}>
          ⏱ 入力遅延ミス — 10秒超過
        </div>
      )}

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

      {result.correct && result.timeBonus && (
        <div style={{display:"inline-flex",alignItems:"center",gap:6,background:"rgba(0,212,255,0.1)",border:`1px solid ${C.cyan}`,borderRadius:20,padding:"4px 16px",fontSize:13,color:C.cyan,fontFamily:"monospace",letterSpacing:1}}>
          ⚡ タイムボーナス {result.timeBonus}
        </div>
      )}
      {result.correct && (
        <div style={{display:"inline-flex",alignItems:"center",gap:6,background:"rgba(255,107,53,0.12)",border:`1px solid ${C.orange}`,borderRadius:20,padding:"4px 16px",fontSize:13,color:C.orange,fontFamily:"monospace"}}>
          ⚡ +${result.gainXp} XP {streak >= 3 ? "🔥 STREAK!" : ""}
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
