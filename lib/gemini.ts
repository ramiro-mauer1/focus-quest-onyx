export type QuestType = 'Principal' | 'Secundaria' | 'Diaria';
export type QuestSkill = 'Intelecto' | 'Vigor' | 'Voluntad';

export type QuestSkillImpact = { name: QuestSkill; weight: number };

export type GeneratedQuest = {
  title: string;
  type: QuestType;
  skills: QuestSkillImpact[];
  xp: number;
};
