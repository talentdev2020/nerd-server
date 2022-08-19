export interface ITime {
  hours: number;
  minutes: number;
}

export interface ITimeStats {
  msSinceBeginningOfDay: number;
  msActiveToday: number;
  dailyRequiredActiveHours: number;
  numNodesInNetwork?: number;
  numTotalGalaNodes?: number;
  townstarMaterialOfTheWeek?: string;
  error?: string;
}
