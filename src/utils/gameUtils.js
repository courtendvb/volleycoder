import QUESTIONS_RAW from "../questions.js";

export const JERSEY_POOL = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20];

export const QUESTIONS = QUESTIONS_RAW.map((q, i) => ({ ...q, id: i + 1 }));

export function parseCompound(code) {
  const dotIdx = code.indexOf(".");
  if (dotIdx === -1) return null;
  const left  = code.slice(0, dotIdx);
  const right = code.slice(dotIdx + 1);
  const m = right.match(/^(\d{1,2})(D?)([#=+!\-/]?)$/i);
  if (!m) return null;
  return { left, right, recvNum: m[1], hasD: m[2].toUpperCase() === "D", recvEval: m[3] || "" };
}

export function expandCompound(code) {
  const p = parseCompound(code);
  if (!p) return null;
  const isAway = p.left.startsWith("a");
  const leftSkillPart = p.left.replace(/^a/, "").replace(/^\d+/, "");
  const isServe  = leftSkillPart.startsWith("S");
  const isAttack = leftSkillPart.startsWith("A") || leftSkillPart.startsWith("P");
  const recv = isAway ? "" : "a";
  let code1, code2;
  if (isServe) {
    code1 = p.left;
    code2 = \`\${recv}\${p.recvNum}R\${p.recvEval}\`;
  } else if (isAttack) {
    if (p.hasD) {
      code1 = p.left;
      code2 = \`\${recv}\${p.recvNum}D\${p.recvEval}\`;
    } else {
      const attackEval = p.recvEval === "#" ? "/" : p.recvEval === "=" ? "#" : "";
      code1 = \`\${p.left}\${attackEval}\`;
      code2 = \`\${recv}\${p.recvNum}B\${p.recvEval}\`;
    }
  } else {
    code1 = p.left;
    code2 = \`\${recv}\${p.recvNum}D\${p.recvEval}\`;
  }
  return { code1, code2, isServe, isAttack, hasD: p.hasD };
}

export function randomizeQuestion(q) {
  const base = q;
  const isAway = base.sideRandom ? Math.random() < 0.5 : false;
  const PRE  = isAway ? "相手" : "";
  const APRE = isAway ? "a"   : "";

  if (!base.players) {
    const sub2 = str => typeof str === "string"
      ? str.replace(/\{PRE\}/g, PRE).replace(/\{APRE\}/g, APRE) : str;
    return {
      ...base,
      scene: { ...base.scene, desc: sub2(base.scene.desc) },
      answer: sub2(base.answer),
      variants: base.variants.map(sub2),
      explanation: sub2(base.explanation ?? ""),
    };
  }

  const slots = Object.keys(base.players);
  const used = new Set();
  const numMap = {};
  for (const slot of slots) {
    let n;
    do { n = JERSEY_POOL[Math.floor(Math.random() * JERSEY_POOL.length)]; }
    while (used.has(n));
    used.add(n);
    numMap[slot] = n;
  }

  const sub = str => typeof str === "string"
    ? str.replace(/\{PRE\}/g, PRE).replace(/\{APRE\}/g, APRE)
         .replace(/\{(\w)\}/g, (_, k) => numMap[k] ?? k)
    : str;
  // 解説用：背番号を2桁ゼロパディング（DataVolley標準形式）
  const subPad = str => typeof str === "string"
    ? str.replace(/\{PRE\}/g, PRE).replace(/\{APRE\}/g, APRE)
         .replace(/\{(\w)\}/g, (_, k) => numMap[k] !== undefined ? String(numMap[k]).padStart(2, '0') : k)
    : str;

  const flipBall = segs => segs?.map(seg => ({
    ...seg,
    fx: 300 - seg.fx, fy: Math.max(10, 230 - seg.fy),
    tx: 300 - seg.tx, ty: Math.max(10, 230 - seg.ty),
  })) ?? [];

  return {
    ...base,
    scene: {
      ...base.scene,
      desc: sub(base.scene.desc),
      ball: base.sideRandom && isAway ? flipBall(base.scene.ball) : base.scene.ball,
      hlHome: base.sideRandom && isAway ? (base.scene.hlAway || []) : base.scene.hlHome,
      hlAway: base.sideRandom && isAway ? (base.scene.hlHome || []) : base.scene.hlAway,
      actors: base.scene.actors?.map(a => {
        const resolvedN = typeof a.n === "string" ? (numMap[a.n] ?? a.n) : a.n;
        if (base.sideRandom && isAway) {
          return { ...a, n: resolvedN, side: "away", x: 300 - a.x, y: Math.max(20, 230 - a.y) };
        }
        return { ...a, n: resolvedN };
      }),
    },
    answer: sub(base.answer),
    variants: base.variants.map(sub),
    explanation: subPad(base.explanation ?? ""),
  };
}
