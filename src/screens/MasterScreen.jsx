import { C } from "../constants.js";

const SPARKLES = [
  {s:"✨",top:8,left:5,d:0},{s:"⭐",top:14,left:88,d:0.6},
  {s:"🌟",top:32,left:2,d:1.1},{s:"✨",top:52,left:93,d:0.3},
  {s:"⭐",top:68,left:4,d:0.9},{s:"🌟",top:80,left:87,d:1.4},
  {s:"✨",top:42,left:95,d:0.5},{s:"⭐",top:22,left:92,d:1.8},
];

export default function MasterScreen({ xp, rank, maxStreak, roundXp, onHome }) {
  return (
    <div style={{
      flex:1, overflowY:"auto",
      background:"linear-gradient(160deg,#08001e,#001208,#000e1e)",
      display:"flex", flexDirection:"column", alignItems:"center",
      padding:"32px 16px 28px",
      position:"relative",
    }}>
      <style>{`
        @keyframes goldGlow{0%,100%{text-shadow:0 0 20px #ffd60a,0 0 50px #ff6b35}50%{text-shadow:0 0 40px #ffd60a,0 0 90px #ffd60a,0 0 120px #ff6b35}}
        @keyframes masterFloat{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-12px) scale(1.05)}}
        @keyframes sparkleRise{0%{opacity:0;transform:translateY(10px) scale(0.5)}20%{opacity:1}80%{opacity:1}100%{opacity:0;transform:translateY(-60px) scale(1.3)}}
        @keyframes rainbowShift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
        @keyframes borderPulse{0%,100%{box-shadow:0 0 20px rgba(255,214,10,0.2),inset 0 0 20px rgba(255,214,10,0.03)}50%{box-shadow:0 0 50px rgba(255,214,10,0.4),inset 0 0 30px rgba(255,214,10,0.06)}}
      `}</style>

      {SPARKLES.map(({s,top,left,d},i)=>(
        <div key={i} style={{
          position:"absolute",top:`${top}%`,left:`${left}%`,
          fontSize:18,pointerEvents:"none",zIndex:0,
          animation:`sparkleRise 3s ease-in-out infinite`,
          animationDelay:`${d}s`,
        }}>{s}</div>
      ))}

      <div style={{fontSize:26,letterSpacing:6,marginBottom:10,zIndex:1}}>⭐⭐⭐⭐⭐</div>

      <div style={{
        fontFamily:"'Bebas Neue',sans-serif",
        fontSize:36, letterSpacing:10,
        color:"#ffd60a",
        animation:"goldGlow 2s ease-in-out infinite",
        textAlign:"center", zIndex:1,
      }}>VOLLECODER</div>

      <div style={{
        fontFamily:"'Bebas Neue',sans-serif",
        fontSize:76, letterSpacing:8,
        background:"linear-gradient(90deg,#ff6b35,#ffd60a,#00ff88,#00d4ff,#a855f7,#ff6b35)",
        backgroundSize:"300% 100%",
        WebkitBackgroundClip:"text",
        WebkitTextFillColor:"transparent",
        backgroundClip:"text",
        textAlign:"center", zIndex:1,
        animation:"rainbowShift 3s linear infinite",
        lineHeight:1, marginBottom:6,
      }}>MASTER</div>

      <div style={{
        fontSize:58, marginBottom:10, zIndex:1,
        animation:"masterFloat 2.2s ease-in-out infinite",
      }}>🏆</div>

      <div style={{
        fontFamily:"'Noto Sans JP',sans-serif",
        fontSize:14, color:C.cyan,
        letterSpacing:2, textAlign:"center",
        marginBottom:4, zIndex:1, fontWeight:700,
      }}>あなたはバレーコーダーの達人！</div>
      <div style={{
        fontFamily:"monospace",
        fontSize:10, color:"rgba(255,214,10,0.65)",
        letterSpacing:3, textAlign:"center",
        marginBottom:24, zIndex:1,
      }}>LV.5 PERFECT CLEAR</div>

      <div style={{
        width:"100%", zIndex:1,
        background:"linear-gradient(145deg,rgba(255,214,10,0.07),rgba(255,107,53,0.04))",
        border:"1.5px solid rgba(255,214,10,0.35)",
        borderRadius:18,
        padding:"20px 18px",
        marginBottom:16,
        animation:"borderPulse 2.5s ease-in-out infinite",
      }}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
          <span style={{fontSize:16}}>🏐</span>
          <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:16,letterSpacing:4,color:C.cyan}}>VolleCoder</span>
          <span style={{marginLeft:"auto",fontSize:9,color:"rgba(255,214,10,0.5)",fontFamily:"monospace"}}>📸 スクショでシェア</span>
        </div>

        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
          <span style={{fontSize:32}}>{rank.icon}</span>
          <div>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:20,letterSpacing:3,color:"#ffd60a"}}>{rank.name}アナリスト</div>
            <div style={{fontSize:9,color:C.muted,fontFamily:"monospace"}}>{xp} XP 獲得済み</div>
          </div>
        </div>

        <div style={{borderTop:`1px solid rgba(255,214,10,0.18)`,marginBottom:14}}/>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
          {[
            {label:"総XP",value:xp,color:C.cyan},
            {label:"獲得XP",value:`+${roundXp}`,color:"#ffd60a"},
            {label:"最大🔥",value:maxStreak,color:C.orange},
          ].map(({label,value,color})=>(
            <div key={label} style={{
              textAlign:"center",
              background:"rgba(255,255,255,0.03)",
              borderRadius:10,padding:"10px 4px",
              border:`1px solid ${color}22`,
            }}>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,color,letterSpacing:1}}>{value}</div>
              <div style={{fontSize:9,color:C.muted,fontFamily:"monospace",marginTop:2}}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      <button onClick={onHome} style={{
        zIndex:1, width:"100%", padding:"15px",
        background:"linear-gradient(135deg,#ffd60a,#ff6b35)",
        border:"none", borderRadius:12,
        color:"#08001e", fontWeight:900,
        fontSize:18, letterSpacing:5,
        cursor:"pointer",
        fontFamily:"'Bebas Neue',sans-serif",
        boxShadow:"0 0 30px rgba(255,214,10,0.5)",
      }}>← ホームへ</button>
    </div>
  );
}
