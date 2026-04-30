import { C, ROUND_SIZE } from "../constants.js";

export default function RoundReviewScreen({ roundData, streak, onContinue, onHome }) {
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
        <div style={{display:"inline-flex",alignItems:"center",gap:6,background:"rgba(255,107,53,0.12)",border:\`1px solid \${C.orange}\`,borderRadius:20,padding:"5px 18px",fontSize:14,color:C.orange,fontFamily:"monospace"}}>
          ⚡ +\${roundData.xpGained} XP
        </div>
      )}
      {streak >= 3 && (
        <div style={{display:"inline-flex",alignItems:"center",gap:6,background:"rgba(255,107,53,0.08)",border:\`1px solid \${C.orange}\`,borderRadius:20,padding:"3px 14px",fontSize:12,color:C.orange,fontFamily:"monospace"}}>
          🔥 ストリーク継続中 ×{streak}
        </div>
      )}
      <div style={{fontSize:13,color:"rgba(220,235,255,0.7)",textAlign:"center",lineHeight:1.8,background:C.surface2,padding:"12px 16px",borderRadius:8,border:\`1px solid \${C.border}\`,maxWidth:280}}>{msg}</div>
      <button onClick={onContinue} style={{padding:"14px 0",width:"100%",maxWidth:260,background:\`linear-gradient(135deg,\${C.orange},#e65100)\`,border:"none",borderRadius:10,color:"white",fontWeight:900,fontSize:15,letterSpacing:3,cursor:"pointer",fontFamily:"'Noto Sans JP',sans-serif"}}>
        次のクールへ →
      </button>
      <button onClick={onHome} style={{background:"transparent",border:"none",color:"rgba(220,235,255,0.25)",cursor:"pointer",fontSize:11,fontFamily:"monospace",letterSpacing:1}}>ホームに戻る</button>
    </div>
  );
}
