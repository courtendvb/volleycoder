import { useState, useEffect, useCallback, useRef } from "react";
import { C, ROUND_SIZE, TIME_LIMIT, GLOBAL_CSS } from "./constants.js";
import { QUESTIONS, randomizeQuestion } from "./utils/gameUtils.js";
import { getRank, getNextRank, getMaxUnlockedLevel } from "./utils/xpUtils.js";

import TutorialScreen from "./screens/TutorialScreen.jsx";
import HomeScreen from "./screens/HomeScreen.jsx";
import ProgressScreen from "./screens/ProgressScreen.jsx";
import ReferenceScreen from "./screens/ReferenceScreen.jsx";
import RoundReviewScreen from "./screens/RoundReviewScreen.jsx";
import ResultScreen from "./screens/ResultScreen.jsx";
import GameScreen from "./screens/GameScreen.jsx";

export default function VolleyCoder() {
  const [screen,      setScreen]      = useState(() =>
    localStorage.getItem("vc_tutorial_done") ? "home" : "tutorial"
  );
  const [levelFilter, setLevelFilter] = useState(1);
  const [qIndex,      setQIndex]      = useState(0);
  const [input,       setInput]       = useState("");
  const [result,      setResult]      = useState(null);
  const [score,       setScore]       = useState(0);
  const [streak,      setStreak]      = useState(0);
  const [maxStreak,   setMaxStreak]   = useState(() => Number(localStorage.getItem("vc_max_streak")) || 0);
  const [xp,          setXp]          = useState(() => Number(localStorage.getItem("vc_xp")) || 0);
  const [stats,       setStats]       = useState(() => {
    try {
      const saved = localStorage.getItem("vc_stats");
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });
  const [xpAnim,      setXpAnim]      = useState(null);
  const [unlockAnim,  setUnlockAnim]  = useState(null);
  const [animKey,     setAnimKey]     = useState(0);
  const [shake,       setShake]       = useState(false);
  const [rq,          setRq]          = useState(null);
  const [roundData,   setRoundData]   = useState({ num:1, correct:0, xpGained:0, count:0 });
  const [qOrder,      setQOrder]      = useState([]);
  const [timeLeft,    setTimeLeft]    = useState(TIME_LIMIT);
  const timerRef      = useRef(null);
  const timerStartRef = useRef(null);
  const timeoutHandlerRef = useRef(null);

  const maxUnlockedLevel = getMaxUnlockedLevel(xp);
  const prevMaxLevel = useRef(maxUnlockedLevel);

  // タイムアウトハンドラ（毎レンダーで最新クロージャに更新）
  timeoutHandlerRef.current = () => {
    if (screen !== "game" || result) return;
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setStats(p => ({ ...p, [q?.id]: false }));
    setRoundData(r => ({ ...r, count: r.count + 1 }));
    setStreak(0);
    setShake(true);
    setTimeout(() => setShake(false), 400);
    setResult({ correct: false, codeStr: input, gainXp: 0, timeout: true });
  };

  // データの永続化
  useEffect(() => {
    localStorage.setItem("vc_xp", xp);
  }, [xp]);

  useEffect(() => {
    localStorage.setItem("vc_max_streak", maxStreak);
  }, [maxStreak]);

  useEffect(() => {
    localStorage.setItem("vc_stats", JSON.stringify(stats));
  }, [stats]);

  const safeLevelFilter  = Math.min(levelFilter, maxUnlockedLevel);
  const qs       = QUESTIONS.filter(q => q.level <= safeLevelFilter);
  const q        = qOrder.length > 0 ? qs[qOrder[qIndex % qOrder.length]] : qs[0];
  const rank     = getRank(xp);
  const nextRank = getNextRank(xp);
  const xpPct    = nextRank ? Math.round(((xp - rank.xpReq) / (nextRank.xpReq - rank.xpReq)) * 100) : 100;
  const displayQ = rq ?? q;

  useEffect(() => {
    if (maxUnlockedLevel > prevMaxLevel.current) {
      setUnlockAnim(`Lv.${maxUnlockedLevel} 解放！`);
      setLevelFilter(maxUnlockedLevel);
      const timer = setTimeout(() => setUnlockAnim(null), 3000);
      prevMaxLevel.current = maxUnlockedLevel;
      return () => clearTimeout(timer);
    }
  }, [maxUnlockedLevel]);

  useEffect(() => {
    if (screen === "game") {
      setAnimKey(k => k + 1);
      setRq(randomizeQuestion(q));
      if (qOrder.length > 0 && qIndex > 0 && qIndex % qOrder.length === 0) {
        setQOrder(shuffleIndices(qs.length));
      }
      // アニメーション完了後にタイマースタート（800ms遅延）
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      setTimeLeft(TIME_LIMIT);
      const startDelay = setTimeout(() => {
        timerStartRef.current = Date.now();
        timerRef.current = setInterval(() => {
          setTimeLeft(t => {
            if (t <= 1) {
              clearInterval(timerRef.current);
              timerRef.current = null;
              setTimeout(() => timeoutHandlerRef.current?.(), 0);
              return 0;
            }
            return t - 1;
          });
        }, 1000);
      }, 800);
      return () => {
        clearTimeout(startDelay);
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      };
    }
  }, [screen, qIndex]);

  const handleKey = useCallback((v) => {
    if (v === "BS") { setInput(i => i.slice(0, -1)); return; }
    setInput(i => i + v);
  }, []);

  const handleSubmit = useCallback(() => {
    if (!input.trim()) return;
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    const elapsed = timerStartRef.current ? (Date.now() - timerStartRef.current) / 1000 : 99;
    let multiplier = 1;
    let timeBonus = null;
    if (elapsed <= 2)   { multiplier = 2;   timeBonus = "×2"; }
    else if (elapsed <= 3.5) { multiplier = 1.5; timeBonus = "×1.5"; }
    const dq      = rq ?? q;
    const correct = dq.variants.some(v => v.trim().toLowerCase() === input.trim().toLowerCase());
    const baseXp  = dq.level * 10 + (streak >= 3 ? 5 : 0);
    const gainXp  = correct ? Math.round(baseXp * multiplier) : 0;
    if (correct) {
      setScore(s => s + 1);
      setStreak(s => { const ns = s + 1; setMaxStreak(m => Math.max(m, ns)); return ns; });
      setXp(x => x + gainXp);
      setXpAnim(timeBonus ? `+${gainXp} XP ${timeBonus}` : `+${gainXp} XP`);
      setTimeout(() => setXpAnim(null), 1600);
    } else {
      setStreak(0);
      setShake(true);
      setTimeout(() => setShake(false), 400);
    }
    setStats(p => ({ ...p, [q.id]: correct }));
    setRoundData(r => ({ ...r, correct: r.correct + (correct?1:0), xpGained: r.xpGained + gainXp, count: r.count + 1 }));
    setResult({ correct, codeStr: input, gainXp, timeBonus });
  }, [input, q, rq, streak]);

  const handleNext = useCallback(() => {
    setInput(""); setResult(null);
    if (roundData.count > 0 && roundData.count % ROUND_SIZE === 0) {
      setScreen("roundReview");
    } else {
      setQIndex(i => i + 1);
      setScreen("game");
    }
  }, [roundData.count]);

  const handleContinueRound = useCallback(() => {
    setRoundData(r => ({ num: r.num + 1, correct: 0, xpGained: 0, count: 0 }));
    setQIndex(i => i + 1);
    setScreen("game");
  }, []);

  const shuffleIndices = (len) => {
    const arr = Array.from({length: len}, (_, i) => i);
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  const handleStart = useCallback(() => {
    const order = shuffleIndices(qs.length);
    setQOrder(order);
    setQIndex(0); setScore(0); setStreak(0);
    setInput(""); setResult(null); setRq(null);
    setRoundData({ num:1, correct:0, xpGained:0, count:0 });
    setScreen("game");
  }, [qs]);

  const shell = (children) => (
    <div style={{fontFamily:"'Noto Sans JP',sans-serif",background:C.bg,color:C.text,height:"100vh",display:"flex",flexDirection:"column",maxWidth:480,margin:"0 auto",overflow:"hidden"}}>
      <style>{GLOBAL_CSS}</style>
      {children}
    </div>
  );

  if (screen === "tutorial") return shell(
    <TutorialScreen onDone={() => {
      localStorage.setItem("vc_tutorial_done", "1");
      setScreen("home");
    }} fromHome={localStorage.getItem("vc_tutorial_done") === "1"} />
  );

  if (screen === "home") return shell(
    <HomeScreen
      score={score} maxStreak={maxStreak}
      xp={xp} rank={rank} xpPct={xpPct} nextRank={nextRank}
      levelFilter={safeLevelFilter} setLevelFilter={setLevelFilter}
      maxUnlockedLevel={maxUnlockedLevel}
      onStart={handleStart} onNav={setScreen}
    />
  );

  if (screen === "prog") return shell(
    <ProgressScreen
      stats={stats} xp={xp} rank={rank} xpPct={xpPct} nextRank={nextRank}
      onBack={() => setScreen("home")}
    />
  );

  if (screen === "ref") return shell(
    <ReferenceScreen onBack={() => setScreen("home")} />
  );

  if (screen === "roundReview") return shell(
    <RoundReviewScreen
      roundData={roundData} streak={streak}
      onContinue={handleContinueRound} onHome={() => setScreen("home")}
    />
  );

  if (result) return shell(
    <ResultScreen
      result={result} q={displayQ} streak={streak}
      onNext={handleNext} onHome={() => setScreen("home")}
    />
  );

  return shell(
    <GameScreen
      q={displayQ} qs={qs} qIndex={qIndex}
      input={input} shake={shake} streak={streak} score={score}
      animKey={animKey} xpAnim={xpAnim} unlockAnim={unlockAnim}
      timeLeft={timeLeft}
      onKey={handleKey} onSubmit={handleSubmit}
      onClearInput={() => setInput("")}
      onHome={() => setScreen("home")}
    />
  );
}
