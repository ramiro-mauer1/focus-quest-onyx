export type QuestType = 'Principal' | 'Secundaria' | 'Diaria';
export type QuestSkill = 'Intelecto' | 'Vigor' | 'Voluntad';

export type QuestSkillImpact = { name: QuestSkill; weight: number };

export type SubMission = {
  title: string;
  skills: QuestSkillImpact[];
  xp: number;
};

export type GeneratedQuest = {
  title: string;
  type: QuestType;
  subMissions: SubMission[];
};
