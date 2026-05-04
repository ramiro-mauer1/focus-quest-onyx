'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react';

const COMBO_MULTIPLIER = 1.2;
const COMBO_RESET_MS = 7_200_000;
const STORAGE_KEY = 'onyx_xp_state';

export function getXPForNextLevel(level: number): number {
  return Math.floor(1000 * Math.pow(level, 1.2));
}

export type Skill = 'Intelecto' | 'Vigor' | 'Voluntad';
export type SkillImpact = { skill: Skill; weight: number };
export type LevelUpScope = 'General' | Skill;
export type LevelUpEvent = { id: number; scope: LevelUpScope; level: number };

export const ALL_SKILLS: Skill[] = ['Intelecto', 'Vigor', 'Voluntad'];

type Progress = { level: number; currentXP: number };
type SkillProgressMap = Record<Skill, Progress>;

const initialSkillState = (): SkillProgressMap =>
  ALL_SKILLS.reduce((acc, s) => {
    acc[s] = { level: 1, currentXP: 0 };
    return acc;
  }, {} as SkillProgressMap);

type State = {
  general: Progress;
  skills: SkillProgressMap;
  comboMultiplier: number;
  pendingLevelUps: LevelUpEvent[];
  eventCounter: number;
};

const initialState: State = {
  general: { level: 1, currentXP: 0 },
  skills: initialSkillState(),
  comboMultiplier: 1,
  pendingLevelUps: [],
  eventCounter: 0,
};

type StoredSnapshot = {
  general: Progress;
  skills: SkillProgressMap;
  comboMultiplier: number;
  lastActivityAt: number;
};

type Action =
  | { type: 'addXP'; baseAmount: number; impacts: SkillImpact[] }
  | { type: 'resetCombo' }
  | { type: 'consumeLevelUp'; id: number }
  | { type: 'hydrate'; general: Progress; skills: SkillProgressMap; comboMultiplier: number };

function applyXP(
  progress: Progress,
  gained: number,
  scope: LevelUpScope,
  startCounter: number,
  events: LevelUpEvent[],
): { progress: Progress; counter: number } {
  let xp = progress.currentXP + gained;
  let lvl = progress.level;
  let counter = startCounter;
  while (xp >= getXPForNextLevel(lvl)) {
    xp -= getXPForNextLevel(lvl);
    lvl += 1;
    counter += 1;
    events.push({ id: counter, scope, level: lvl });
  }
  return { progress: { level: lvl, currentXP: xp }, counter };
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'addXP': {
      const { baseAmount, impacts } = action;
      if (baseAmount <= 0) return state;

      const m = state.comboMultiplier;
      const events: LevelUpEvent[] = [];
      let counter = state.eventCounter;

      const gainedGeneral = Math.round(baseAmount * m);
      const gen = applyXP(state.general, gainedGeneral, 'General', counter, events);
      counter = gen.counter;

      const skills = { ...state.skills };
      for (const { skill, weight } of impacts) {
        if (!skills[skill]) continue;
        const gained = Math.round(baseAmount * m * weight);
        if (gained <= 0) continue;
        const res = applyXP(skills[skill], gained, skill, counter, events);
        counter = res.counter;
        skills[skill] = res.progress;
      }

      return {
        general: gen.progress,
        skills,
        comboMultiplier: COMBO_MULTIPLIER,
        pendingLevelUps: [...state.pendingLevelUps, ...events],
        eventCounter: counter,
      };
    }
    case 'resetCombo':
      return { ...state, comboMultiplier: 1 };
    case 'consumeLevelUp':
      return {
        ...state,
        pendingLevelUps: state.pendingLevelUps.filter((e) => e.id !== action.id),
      };
    case 'hydrate':
      return {
        ...state,
        general: action.general,
        skills: action.skills,
        comboMultiplier: action.comboMultiplier,
      };
    default:
      return state;
  }
}

type XPContextValue = {
  level: number;
  currentXP: number;
  xpForNextLevel: number;
  skills: SkillProgressMap;
  comboMultiplier: number;
  pendingLevelUps: LevelUpEvent[];
  isLoaded: boolean;
  addXP: (baseAmount: number, impacts?: SkillImpact[]) => void;
  consumeLevelUp: (id: number) => void;
};

const XPContext = createContext<XPContextValue | null>(null);

export function XPProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [isLoaded, setIsLoaded] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<StoredSnapshot>;
        const hasNewSchema =
          parsed.skills &&
          typeof parsed.skills === 'object' &&
          ALL_SKILLS.every((s) => s in (parsed.skills as object));

        if (hasNewSchema && parsed.general) {
          const elapsed = Date.now() - (parsed.lastActivityAt ?? 0);
          const combo =
            elapsed > COMBO_RESET_MS ? 1 : parsed.comboMultiplier ?? 1;
          dispatch({
            type: 'hydrate',
            general: parsed.general,
            skills: parsed.skills as SkillProgressMap,
            comboMultiplier: combo,
          });
          if (combo > 1) {
            timerRef.current = setTimeout(
              () => dispatch({ type: 'resetCombo' }),
              Math.max(0, COMBO_RESET_MS - elapsed),
            );
          }
        } else if (parsed.general) {
          // Old schema (4 skills): preserve general level, reset triad.
          dispatch({
            type: 'hydrate',
            general: parsed.general,
            skills: initialSkillState(),
            comboMultiplier: 1,
          });
        }
      }
    } catch {
      /* noop */
    }
    setIsLoaded(true);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    try {
      const snapshot: StoredSnapshot = {
        general: state.general,
        skills: state.skills,
        comboMultiplier: state.comboMultiplier,
        lastActivityAt: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    } catch {
      /* noop */
    }
  }, [state.general, state.skills, state.comboMultiplier, isLoaded]);

  const addXP = useCallback((baseAmount: number, impacts: SkillImpact[] = []) => {
    if (baseAmount <= 0) return;
    dispatch({ type: 'addXP', baseAmount, impacts });
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => dispatch({ type: 'resetCombo' }), COMBO_RESET_MS);
  }, []);

  const consumeLevelUp = useCallback(
    (id: number) => dispatch({ type: 'consumeLevelUp', id }),
    [],
  );

  const value: XPContextValue = {
    level: state.general.level,
    currentXP: state.general.currentXP,
    xpForNextLevel: getXPForNextLevel(state.general.level),
    skills: state.skills,
    comboMultiplier: state.comboMultiplier,
    pendingLevelUps: state.pendingLevelUps,
    isLoaded,
    addXP,
    consumeLevelUp,
  };

  return <XPContext.Provider value={value}>{children}</XPContext.Provider>;
}

export function useXP(): XPContextValue {
  const ctx = useContext(XPContext);
  if (!ctx) throw new Error('useXP debe usarse dentro de <XPProvider>');
  return ctx;
}
