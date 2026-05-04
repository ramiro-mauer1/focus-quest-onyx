import type { Skill } from '@/contexts/XPContext';

export type DailyQuestDef = {
  id: string;
  title: string;
  skills: { name: Skill; weight: number }[];
  xp: number;
  unlockAfter?: string;
};

export const DAILY_QUESTS: DailyQuestDef[] = [
  {
    id: 'bed',
    title: 'Hacer la cama',
    skills: [{ name: 'Voluntad', weight: 1.0 }],
    xp: 60,
  },
  {
    id: 'water',
    title: 'Tomar 3L de agua',
    skills: [
      { name: 'Vigor', weight: 1.0 },
      { name: 'Voluntad', weight: 0.4 },
    ],
    xp: 100,
  },
  {
    id: 'teeth-morning',
    title: 'Lavarse los dientes (Mañana)',
    skills: [{ name: 'Voluntad', weight: 1.0 }],
    xp: 50,
  },
  {
    id: 'teeth-night',
    title: 'Lavarse los dientes (Noche)',
    skills: [{ name: 'Voluntad', weight: 1.0 }],
    xp: 50,
    unlockAfter: 'teeth-morning',
  },
  {
    id: 'gym',
    title: 'Ir al gimnasio',
    skills: [
      { name: 'Vigor', weight: 1.0 },
      { name: 'Voluntad', weight: 0.5 },
    ],
    xp: 200,
  },
];
