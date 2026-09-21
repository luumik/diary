import type { WeatherMetadata } from "./validateDiaryEntryInput";

export interface WeatherSummary extends WeatherMetadata {
  readonly date: string;
}
