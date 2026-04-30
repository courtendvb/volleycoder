import { useState, useEffect } from "react";
import { C, HOME_ZONES, AWAY_ZONES, ZW, ZH, SUB } from "../constants.js";

function buildMotionProps(balls) {
  const b0 = balls[0];
  const b1 = balls[1];
  if (!b0) return null;
  if (b1) {
    const d0 = Math.hypot(b0.tx - b0.fx, b0.ty - b0.fy);
    const d1 = Math.hypot(b1.tx - b1.fx, b1.ty - b1.fy);
    const total = d0 + d1;
    const f0 = total > 0 ? (d0 / total).toFixed(4) : "0.5000";
    const seg0Dur = 0.68, seg1Dur = 0.60, totalDur = seg0Dur + seg1Dur;
    return {
      path: `M ${b0.fx},${b0.fy} L ${b0.tx},${b0.ty} L ${b1.tx},${b1.ty}`,
      dur: `${totalDur}s`,
      keyTimes: `0;${(seg0Dur / totalDur).toFixed(4)};1`,
      keyPoints: `0;${f0};1`,
      keySplines: "0.25 0.46 0.45 0.94;0.55 0.06 0.68 0.19",
    };
  }
  return {
    path: `M ${b0.fx},${b0.fy} L ${b0.tx},${b0.ty}`,
    dur: "0.68s",
    keyTimes: "0;1",
    keyPoints: "0;1",
    keySplines: "0.25 0.46 0.45 0.94",
  };
}

export default function CourtAnim({ scene, animKey, showSub = false }) {
  const [phase, setPhase] = useState(0);
  const balls = scene.ball || [];

  useEffect(() => {
    setPhase(0);
    const t1 = setTimeout(() => setPhase(1), 150);
    const t2 = setTimeout(() => setPhase(2), 820);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [animKey]);

  const motionProps = buildMotionProps(balls);
  const hasNet = balls.some(b => b?.net);
  const hlH = scene.hlHome || [];
  const hlA = scene.hlAway || [];

  const ZoneBlock = ({ z, cx, cy, isHL }) => (
    <g>
      <rect
        x={cx-ZW/2} y={cy-ZH/2} width={ZW} height={ZH}
        fill={isHL ? "rgba(255,107,53,0.18)" : "rgba(255,255,255,0.03)"}
        stroke={isHL ? "#ff6b35" : "rgba(180,210,255,0.18)"}
        strokeWidth={isHL ? 1.4 : 0.7}
        rx="2"
      />
      {showSub && (
        <>
          <line x1={cx} y1={cy-ZH/2} x2={cx} y2={cy+ZH/2}
            stroke={isHL ? "rgba(255,107,53,0.4)" : "rgba(180,210,255,0.15)"} strokeWidth="0.5"/>
          <line x1={cx-ZW/2} y1={cy} x2={cx+ZW/2} y2={cy}
            stroke={isHL ? "rgba(255,107,53,0.4)" : "rgba(180,210,255,0.15)"} strokeWidth="0.5"/>
          {Object.entries(SUB).map(([lbl,{dx,dy}]) => (
            <text key={lbl} x={cx+dx} y={cy+dy+3} textAnchor="middle"
              fill={isHL ? "rgba(255,150,80,0.7)" : "rgba(180,210,255,0.2)"}
              fontSize="5" fontFamily="monospace">{lbl}</text>
          ))}
        </>
      )}
      <text x={cx} y={cy+3.5} textAnchor="middle"
        fill={isHL ? "#ff8855" : "rgba(180,210,255,0.45)"}
        fontSize={showSub ? 7 : 9} fontFamily="monospace"
        fontWeight={isHL ? "bold" : "normal"}>{z}</text>
    </g>
  );

  return (
    <div style={{userSelect:"none"}}>
      <div style={{position:"relative",width:"100%",paddingBottom:"60%",borderRadius:12,overflow:"hidden"}}>
        <svg
          style={{position:"absolute",inset:0,width:"100%",height:"100%"}}
          viewBox="0 0 300 230"
          preserveAspectRatio="xMidYMid meet"
        >
        <defs>
          <linearGradient id="cg1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#1a3a6e" stopOpacity="0.6"/>
            <stop offset="50%"  stopColor="#0e2240" stopOpacity="0.1"/>
            <stop offset="100%" stopColor="#1a3a6e" stopOpacity="0.6"/>
          </linearGradient>
          <linearGradient id="netG" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#ffffff" stopOpacity="0.9"/>
            <stop offset="100%" stopColor="#aaccff" stopOpacity="0.4"/>
          </linearGradient>
          <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="1.5" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="bglow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* 背景 */}
        <rect width="300" height="230" fill="#090e18"/>
        <rect x="0"  y="0"   width="300" height="20"  fill="#0b1322"/>
        <rect x="0"  y="210" width="300" height="20"  fill="#0b1322"/>
        <rect x="30" y="20"  width="240" height="190" fill="#0c2040"/>
        <rect x="30" y="20"  width="240" height="190" fill="url(#cg1)"/>

        {/* コートアウトライン */}
        <rect x="30" y="20" width="240" height="190"
          fill="none" stroke="rgba(255,255,255,0.82)" strokeWidth="2.2"
          filter="url(#glow)"/>

        {/* ゾーン区分線 */}
        <line x1="110" y1="20"  x2="110" y2="210" stroke="rgba(255,255,255,0.11)" strokeWidth="0.7" strokeDasharray="3,4"/>
        <line x1="190" y1="20"  x2="190" y2="210" stroke="rgba(255,255,255,0.11)" strokeWidth="0.7" strokeDasharray="3,4"/>
        <line x1="30"  y1="146" x2="270" y2="146" stroke="rgba(255,255,255,0.11)" strokeWidth="0.7" strokeDasharray="3,4"/>
        <line x1="30"  y1="178" x2="270" y2="178" stroke="rgba(255,255,255,0.11)" strokeWidth="0.7" strokeDasharray="3,4"/>
        <line x1="30"  y1="50"  x2="270" y2="50"  stroke="rgba(255,255,255,0.11)" strokeWidth="0.7" strokeDasharray="3,4"/>
        <line x1="30"  y1="82"  x2="270" y2="82"  stroke="rgba(255,255,255,0.11)" strokeWidth="0.7" strokeDasharray="3,4"/>

        {/* アタックライン */}
        <line x1="30" y1="146" x2="270" y2="146"
          stroke="rgba(255,255,255,0.5)" strokeWidth="1.6" filter="url(#glow)"/>
        <line x1="30" y1="82"  x2="270" y2="82"
          stroke="rgba(255,255,255,0.5)" strokeWidth="1.6" filter="url(#glow)"/>

        {/* ネット */}
        <rect x="26" y="111" width="248" height="8" rx="1"
          fill="rgba(160,190,255,0.06)" stroke="rgba(255,255,255,0.25)" strokeWidth="0.5"/>
        <rect x="26" y="111" width="248" height="2.5" rx="1" fill="url(#netG)"/>
        {[...Array(25)].map((_,i) => (
          <line key={i} x1={26+i*10} y1="111" x2={26+i*10} y2="119"
            stroke="rgba(255,255,255,0.13)" strokeWidth="0.5"/>
        ))}
        {[111,113.5,116,118.5].map(y => (
          <line key={y} x1="26" y1={y} x2="274" y2={y}
            stroke="rgba(255,255,255,0.09)" strokeWidth="0.4"/>
        ))}
        <rect x="24"  y="103" width="3" height="24" rx="1.5" fill="rgba(255,255,255,0.65)"/>
        <rect x="273" y="103" width="3" height="24" rx="1.5" fill="rgba(255,255,255,0.65)"/>

        {/* チームラベル */}
        <text x="150" y="225" textAnchor="middle"
          fill="rgba(255,107,53,0.55)" fontSize="7" fontFamily="monospace" letterSpacing="2">HOME</text>
        <text x="150" y="16" textAnchor="middle"
          fill="rgba(100,180,255,0.55)" fontSize="7" fontFamily="monospace" letterSpacing="2">AWAY</text>

        {/* ゾーン */}
        {Object.entries(HOME_ZONES).map(([z,{x,y}]) => (
          <ZoneBlock key={`h${z}`} z={z} cx={x} cy={y} isHL={hlH.includes(Number(z))}/>
        ))}
        {Object.entries(AWAY_ZONES).map(([z,{x,y}]) => (
          <ZoneBlock key={`a${z}`} z={z} cx={x} cy={y} isHL={hlA.includes(Number(z))}/>
        ))}

        {/* コート外サーブライン参考 */}
        <line x1="30" y1="218" x2="270" y2="218"
          stroke="rgba(255,107,53,0.2)" strokeWidth="0.8" strokeDasharray="5,4"/>
        <line x1="30" y1="12"  x2="270" y2="12"
          stroke="rgba(100,180,255,0.2)" strokeWidth="0.8" strokeDasharray="5,4"/>

        {/* 選手 */}
        {scene.actors?.map((a,i) => {
          const isHome = a.side === "home";
          const jy = (a.jump && phase === 1) ? a.y - 9 : a.y;
          return (
            <g key={i}>
              <ellipse cx={a.x} cy={a.y+10} rx="10" ry="3"
                fill="rgba(0,0,0,0.45)" opacity={(a.jump && phase===1) ? 0.15 : 0.55}/>
              <circle cx={a.x} cy={jy} r="11"
                fill={isHome ? "#ff6b35" : "#1ca8e0"} filter="url(#glow)"/>
              <circle cx={a.x} cy={jy} r="11" fill="none"
                stroke={isHome ? "rgba(255,180,120,0.7)" : "rgba(100,220,255,0.7)"} strokeWidth="1.4"/>
              <text x={a.x} y={jy+4} textAnchor="middle"
                fill="white" fontSize="8.5" fontWeight="bold" fontFamily="monospace">{a.n}</text>
            </g>
          );
        })}

        {/* ネット当たり */}
        {hasNet && phase >= 2 && (
          <g>
            <line x1="138" y1="108" x2="162" y2="122"
              stroke={C.red} strokeWidth="2.2" strokeDasharray="4,3" opacity="0.9"/>
            <text x="168" y="108" fill={C.red} fontSize="8" fontFamily="monospace">NET</text>
          </g>
        )}

        {/* ボール — <animateMotion> で連続パスアニメーション */}
        {motionProps && (
          <g key={`ball_${animKey}`} visibility="hidden">
            <set attributeName="visibility" to="visible" begin="0.15s" fill="freeze"/>
            <animateMotion
              begin="0.15s"
              dur={motionProps.dur}
              fill="freeze"
              calcMode="spline"
              keyTimes={motionProps.keyTimes}
              keyPoints={motionProps.keyPoints}
              keySplines={motionProps.keySplines}
              path={motionProps.path}
            />
            <circle cx="0" cy="0" r="9" fill="rgba(255,200,40,0.2)" filter="url(#bglow)"/>
            <text x="0" y="6" textAnchor="middle" fontSize="14">🏐</text>
          </g>
        )}
        </svg>
      </div>
      {/* 結果バッジ */}
      {phase >= 2 && scene.result && (
        <div style={{
          textAlign:"right",marginTop:4,
          animation:"fadeIn 0.3s ease",
        }}>
          <span style={{
            display:"inline-block",
            padding:"2px 10px",borderRadius:20,
            fontSize:10,fontFamily:"monospace",letterSpacing:1,
            background: scene.result==="ace" ? "rgba(0,255,136,0.2)" : scene.result==="miss" ? "rgba(255,51,68,0.2)" : "rgba(255,214,10,0.2)",
            border:`1px solid ${scene.result==="ace" ? C.green : scene.result==="miss" ? C.red : C.yellow}`,
            color: scene.result==="ace" ? C.green : scene.result==="miss" ? C.red : C.yellow,
          }}>
            {scene.result==="ace" ? "POINT! 🎉" : scene.result==="miss" ? "MISS! ❌" : "GOOD! ⭐"}
          </span>
        </div>
      )}
    </div>
  );
}
