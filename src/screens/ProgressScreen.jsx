import { C, SKILL_LABEL, SKILL_COLOR, LEVEL_UNLOCK_XP } from "../constants.js";
import { QUESTIONS } from "../utils/gameUtils.js";

export default function ProgressScreen({ stats, xp, rank, xpPct, nextRank, maxStreak, onBack }) {
  const ss = {};
  for (const qq of QUESTIONS) if (!ss[qq.skill]) ss[qq.skill] = {c:0,t:0};
  for (const [id,ok] of Object.entries(stats)) {
    const qq = QUESTIONS.find(q => q.id === Number(id));
    if (!qq) continue;
    ss[qq.skill].t++;
    if (ok) ss[qq.skill].c++;
  }

  const totalAnswered = Object.keys(stats).length;
  const totalCorrect  = Object.values(stats).filter(Boolean).length;
  const accuracy      = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
  const unlockedLevels = [1,2,3,4,5].filter(l => xp >= LEVEL_UNLOCK_XP[l]);

  return (
    <>
      <div style={{background:C.surface,padding:"14px 16px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
        <button onClick={onBack} style={{background:"transparent",border:"none",color:C.muted,cursor:"pointer",fontSize:20}}>←</button>
        <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,letterSpacing:3}}>PROGRESS</span>
        <span style={{marginLeft:"auto",fontSize:10,color:C.muted,fontFamily:"monospace"}}>📸 スクショでシェア</span>
      </div>

      <div style={{flex:1,overflowY:"auto",padding:"16px"}}>

        {/* ── シェア用サマリーカード ── */}
        <div style={{
          background:`linear-gradient(145deg,#0c1830,#071020)`,
          border:`1.5px solid ${C.cyan}44`,
          borderRadius:16,padding:"20px 18px",marginBottom:16,
          boxShadow:`0 0 30px rgba(0,212,255,0.08)`,
        }}>
          {/* ロゴ行 */}
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
            <span style={{fontSize:18}}>🏐</span>
            <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:20,letterSpacing:4,color:C.cyan}}>VolleCoder</span>
          </div>

          {/* ランク・XP */}
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
            <span style={{fontSize:36}}>{rank.icon}</span>
            <div style={{flex:1}}>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:20,letterSpacing:3,color:C.yellow}}>{rank.name}アナリスト</div>
              <div style={{background:"rgba(255,255,255,0.07)",borderRadius:20,height:5,margin:"6px 0 3px",overflow:"hidden"}}>
                <div style={{width:`${xpPct}%`,height:"100%",borderRadius:20,background:`linear-gradient(90deg,${C.orange},${C.yellow})`}}/>
              </div>
              <div style={{fontSize:9,color:C.muted,fontFamily:"monospace"}}>{xp} XP{nextRank ? ` → ${nextRank.xpReq} XP` : " MAX"}</div>
            </div>
          </div>

          {/* 区切り */}
          <div style={{borderTop:`1px solid ${C.border}`,marginBottom:14}}/>

          {/* 主要スタッツ */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14}}>
            {[
              {label:"解答数", value:totalAnswered, unit:"問", color:C.cyan},
              {label:"正解率", value:accuracy,      unit:"%",  color:C.green},
              {label:"最大🔥",  value:maxStreak,     unit:"",   color:C.orange},
            ].map(({label,value,unit,color}) => (
              <div key={label} style={{textAlign:"center",background:"rgba(255,255,255,0.04)",borderRadius:10,padding:"10px 4px",border:`1px solid ${color}22`}}>
                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:26,color,letterSpacing:1}}>{value}<span style={{fontSize:13}}>{unit}</span></div>
                <div style={{fontSize:9,color:C.muted,fontFamily:"monospace",marginTop:2}}>{label}</div>
              </div>
            ))}
          </div>

          {/* 解放レベル */}
          <div style={{display:"flex",gap:5,justifyContent:"center"}}>
            {[1,2,3,4,5].map(l => {
              const done = xp >= LEVEL_UNLOCK_XP[l];
              return (
                <div key={l} style={{
                  padding:"3px 10px",borderRadius:20,fontFamily:"monospace",fontSize:11,fontWeight:700,
                  background: done ? `${C.green}18` : "rgba(255,255,255,0.04)",
                  color: done ? C.green : C.muted,
                  border:`1px solid ${done ? C.green+"44" : C.border}`,
                }}>Lv.{l}{done ? "✓" : ""}</div>
              );
            })}
          </div>
        </div>

        {/* ── スキル別習熟度 ── */}
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
                <div style={{fontSize:11,fontWeight:700,color:SKILL_COLOR[k]}}>{s.t > 0 ? `${pct}% (${s.c}/${s.t})` : "未挑戦"}</div>
              </div>
            );
          })}
        </div>

        <button onClick={onBack} style={{width:"100%",padding:"12px",background:`linear-gradient(135deg,${C.orange},#e65100)`,border:"none",borderRadius:10,color:"white",fontWeight:700,fontSize:14,letterSpacing:2,cursor:"pointer",fontFamily:"'Noto Sans JP',sans-serif"}}>← ホームに戻る</button>
      </div>
    </>
  );
}
