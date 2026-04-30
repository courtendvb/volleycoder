import { C, LEVEL_UNLOCK_XP } from "../constants.js";

export default function HomeScreen({ score, maxStreak, xp, rank, xpPct, nextRank, levelFilter, setLevelFilter, maxUnlockedLevel, onStart, onNav }) {
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
          <span style={{padding:"5px 14px",borderRadius:20,fontSize:11,background:"rgba(255,214,10,0.1)",border:\`1px solid \${C.yellow}\`,color:C.yellow,fontFamily:"monospace"}}>{rank.icon} {rank.name}アナリスト</span>
          <span style={{padding:"5px 12px",borderRadius:20,fontSize:11,background:"rgba(0,212,255,0.07)",border:\`1px solid \${C.border}\`,color:C.muted,fontFamily:"monospace"}}>{xp} XP</span>
        </div>
        <div style={{width:"100%",maxWidth:260}}>
          <div style={{background:"rgba(255,255,255,0.07)",borderRadius:20,height:5,overflow:"hidden"}}>
            <div style={{width:\`\${xpPct}%\`,height:"100%",borderRadius:20,background:\`linear-gradient(90deg,\${C.orange},\${C.yellow})\`,transition:"width 0.7s"}}/>
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
                title={locked ? \`\${LEVEL_UNLOCK_XP[l]} XP で解放\` : \`Lv.\${l}\`}
                style={{
                  padding:"6px 16px",borderRadius:20,
                  border:\`1px solid \${locked ? "rgba(255,255,255,0.1)" : active ? C.orange : C.border}\`,
                  background: locked ? "rgba(255,255,255,0.03)" : active ? "rgba(255,107,53,0.18)" : "transparent",
                  color: locked ? "rgba(255,255,255,0.2)" : active ? C.orange : C.muted,
                  fontSize:11,fontFamily:"monospace",
                  cursor: locked ? "default" : "pointer",
                  letterSpacing:1,
                }}>
                {locked ? "🔒" : \`Lv.\${l}\`}
              </button>
            );
          })}
        </div>
        <button onClick={onStart} style={{padding:"15px 48px",background:\`linear-gradient(135deg,\${C.orange},#e65100)\`,border:"none",borderRadius:10,color:"white",fontWeight:900,fontSize:16,letterSpacing:3,cursor:"pointer",width:"100%",maxWidth:260,fontFamily:"'Noto Sans JP',sans-serif",animation:"glow 2.2s ease-in-out infinite",marginTop:4}}>
          🏐 試合開始
        </button>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,width:"100%",maxWidth:300}}>
          {[{icon:"📚",label:"コード辞書",sc:"ref"},{icon:"📊",label:"進捗",sc:"prog"},{icon:"📖",label:"チュートリアル",sc:"tutorial"}].map(({icon,label,sc}) => (
            <button key={sc} onClick={() => onNav(sc)} style={{padding:"12px 8px",background:"rgba(255,255,255,0.04)",border:\`1px solid \${C.border}\`,borderRadius:10,color:"rgba(220,235,255,0.7)",cursor:"pointer",textAlign:"center",fontFamily:"'Noto Sans JP',sans-serif"}}>
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
