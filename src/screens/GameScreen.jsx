import { C, SKILL_COLOR, SKILL_LABEL } from "../constants.js";
import CourtAnim from "../components/CourtAnim.jsx";
import SoftKeyboard from "../components/SoftKeyboard.jsx";

export default function GameScreen({ q, qs, qIndex, input, shake, streak, score, animKey, xpAnim, unlockAnim, timeLeft, onKey, onSubmit, onClearInput, onHome }) {
  const timerColor = timeLeft <= 3 ? C.red : timeLeft <= 6 ? C.yellow : C.green;
  const timerPulse = timeLeft <= 3;
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
          <span style={{
            fontFamily:"'JetBrains Mono',monospace",fontSize:14,fontWeight:700,
            color:timerColor,
            border:`1px solid ${timerColor}55`,
            borderRadius:20,padding:"2px 8px",
            background:`${timerColor}12`,
            minWidth:36,textAlign:"center",
            animation: timerPulse ? "timerPulse 0.6s ease-in-out infinite" : "none",
          }}>⏱{timeLeft}</span>
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
