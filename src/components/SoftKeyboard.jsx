import { useState } from "react";
import { C, KB_ROWS } from "../constants.js";

export default function SoftKeyboard({ onKey, onSubmit }) {
  const [hint, setHint] = useState(null);
  return (
    <div style={{background:"#070d18",borderTop:`1px solid ${C.border}`,padding:"3px 6px 6px",flexShrink:0}}>
      <div style={{height:12,marginBottom:3,textAlign:"center",fontSize:10,fontFamily:"monospace",letterSpacing:1,color:hint?C.cyan:"transparent",transition:"color 0.15s"}}>
        {hint || "　"}
      </div>
      {KB_ROWS.map((row,ri) => (
        <div key={ri} style={{display:"flex",gap:3,marginBottom:3,justifyContent:"center"}}>
          {row.map((k,ki) => {
            const isBs    = k.value === "BS";
            const isSp    = k.value === " ";
            const isEnter = k.value === "ENTER";
            const isUtil  = isBs;
            const isHex   = k.color && k.color.startsWith("#");
            return (
              <button
                key={ki}
                onPointerDown={() => {
                  if (isEnter) { onSubmit?.(); }
                  else { onKey(k.value); }
                  if (k.hint) setHint(k.hint);
                }}
                onPointerUp={() => setTimeout(() => setHint(null), 900)}
                style={{
                  flex: k.wide ? 2 : 1,
                  minWidth: k.wide ? 48 : 26,
                  maxWidth: k.wide ? 70 : 44,
                  height:36,
                  background: isBs ? "rgba(255,51,68,0.1)" : isUtil ? "rgba(255,255,255,0.04)" : isHex ? `${k.color}18` : "rgba(255,255,255,0.05)",
                  border:`1px solid ${isBs ? "rgba(255,51,68,0.35)" : isUtil ? C.border : isHex ? `${k.color}55` : C.border}`,
                  borderRadius:7,
                  color:k.color || C.text,
                  fontFamily:"'JetBrains Mono',monospace",
                  fontSize: isUtil ? 11 : 15,
                  fontWeight:700,
                  cursor:"pointer",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  WebkitTapHighlightColor:"transparent",
                  padding:0,
                  boxShadow: (isUtil || !isHex) ? "none" : `0 2px 6px ${k.color}20`,
                }}
              >{k.label}</button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
