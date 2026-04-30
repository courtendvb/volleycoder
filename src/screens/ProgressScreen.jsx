import { C, SKILL_LABEL, SKILL_COLOR, LEVEL_UNLOCK_XP } from "../constants.js";
import { QUESTIONS } from "../utils/gameUtils.js";

export default function ProgressScreen({ stats, xp, rank, xpPct, nextRank, onBack }) {
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
