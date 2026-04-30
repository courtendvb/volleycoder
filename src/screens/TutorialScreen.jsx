import { useState } from "react";
import { C, TUTORIAL_SLIDES } from "../constants.js";

export default function TutorialScreen({ onDone, fromHome }) {
  const [slide, setSlide] = useState(0);
  const total = TUTORIAL_SLIDES.length;
  const s = TUTORIAL_SLIDES[slide];
  const isLast = slide === total - 1;

  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",padding:"24px 20px",gap:16,overflowY:"auto"}}>
      {/* progress dots */}
      <div style={{display:"flex",gap:6,justifyContent:"center",marginTop:8}}>
        {TUTORIAL_SLIDES.map((_,i) => (
          <div key={i} style={{width:6,height:6,borderRadius:"50%",
            background: i===slide ? C.orange : i<slide ? C.yellow : "rgba(255,255,255,0.15)",
            transition:"background 0.2s"}} />
        ))}
      </div>

      {/* card */}
      <div style={{flex:1,display:"flex",flexDirection:"column",gap:14,justifyContent:"center"}}>
        <div style={{fontSize:20,fontWeight:700,color:C.orange,letterSpacing:1,textAlign:"center"}}>
          {s.title}
        </div>

        <div style={{fontSize:13,color:C.text,lineHeight:1.8,textAlign:"center",whiteSpace:"pre-line"}}>
          {s.body}
        </div>

        {s.example && (
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
            <div style={{fontFamily:"monospace",fontSize:28,fontWeight:700,
              color:C.cyan,letterSpacing:3,padding:"12px 24px",
              background:"rgba(0,212,255,0.08)",borderRadius:12,
              border:\`1px solid rgba(0,212,255,0.2)\`}}>
              {s.example}
            </div>
            {s.note && <div style={{fontSize:11,color:C.muted}}>{s.note}</div>}
          </div>
        )}

        {s.table && (
          <div style={{display:"flex",flexDirection:"column",gap:4,alignSelf:"center",width:"100%",maxWidth:320}}>
            {s.table.map(([code, label]) => (
              <div key={code} style={{display:"flex",alignItems:"center",gap:10,
                padding:"6px 12px",borderRadius:8,background:"rgba(255,255,255,0.04)"}}>
                <span style={{fontFamily:"monospace",fontSize:16,fontWeight:700,
                  color:C.cyan,minWidth:52,textAlign:"center"}}>{code}</span>
                <span style={{fontSize:12,color:C.muted}}>{label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* buttons */}
      <div style={{display:"flex",gap:10,paddingBottom:8}}>
        <button onClick={onDone}
          style={{flex:1,padding:"10px 0",borderRadius:20,border:\`1px solid \${C.border}\`,
            background:"transparent",color:C.muted,fontSize:12,fontFamily:"monospace",cursor:"pointer"}}>
          {fromHome ? "閉じる" : "スキップ"}
        </button>
        <button onClick={() => isLast ? onDone() : setSlide(s => s + 1)}
          style={{flex:2,padding:"10px 0",borderRadius:20,border:"none",
            background: isLast ? C.orange : \`rgba(255,107,53,0.18)\`,
            color: isLast ? "#fff" : C.orange,
            fontSize:13,fontFamily:"monospace",fontWeight:700,cursor:"pointer",letterSpacing:1}}>
          {isLast ? "はじめる！" : "つぎへ →"}
        </button>
      </div>
    </div>
  );
}
