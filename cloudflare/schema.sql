CREATE TABLE IF NOT EXISTS contributions (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  schema_version INTEGER NOT NULL,
  app_version TEXT,
  assessment_json TEXT NOT NULL,
  name TEXT,
  institution TEXT,
  country TEXT,
  professional_role TEXT,
  email TEXT,
  interests TEXT,
  allow_acknowledgment INTEGER NOT NULL DEFAULT 0,
  allow_future_contact INTEGER NOT NULL DEFAULT 0,
  consent_version TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_contributions_created_at ON contributions(created_at);
CREATE INDEX IF NOT EXISTS idx_contributions_country ON contributions(country);
