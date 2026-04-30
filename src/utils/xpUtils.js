import { RANKS, LEVEL_UNLOCK_XP } from "../constants.js";

export const getRank = xp => [...RANKS].reverse().find(r => xp >= r.xpReq) || RANKS[0];
export const getNextRank = xp => RANKS.find(r => xp < r.xpReq) || null;

export const getMaxUnlockedLevel = (xp) =>
  Math.max(...Object.entries(LEVEL_UNLOCK_XP).filter(([, req]) => xp >= req).map(([l]) => Number(l)));
