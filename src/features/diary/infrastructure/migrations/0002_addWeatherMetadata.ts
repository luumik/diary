export const addWeatherMetadataMigration = {
  id: "0002_add_weather_metadata",
  sql: `
    ALTER TABLE diary_entries ADD COLUMN weather_location TEXT;
    ALTER TABLE diary_entries ADD COLUMN weather_summary TEXT;
    ALTER TABLE diary_entries ADD COLUMN weather_source TEXT;
  `,
};
