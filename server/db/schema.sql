CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE classes (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                    VARCHAR(100) NOT NULL,
  section                 VARCHAR(20),
  semester                VARCHAR(20),
  attend_window_minutes   INT DEFAULT 7,
  lockout_time            TIME,
  created_at              TIMESTAMP DEFAULT NOW()
);

CREATE TABLE students (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id          UUID REFERENCES classes(id) ON DELETE CASCADE,
  first_name        VARCHAR(50) NOT NULL,
  last_name         VARCHAR(50) NOT NULL,
  email_hash        VARCHAR(64) NOT NULL,
  email_encrypted   TEXT NOT NULL,
  display_alias     VARCHAR(30),
  display_avatar    VARCHAR(10),
  alias_set         BOOLEAN DEFAULT FALSE,
  participate_mode  VARCHAR(10) DEFAULT 'verbal',
  created_at        TIMESTAMP DEFAULT NOW(),
  UNIQUE(class_id, email_hash)
);

CREATE TABLE auth_codes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_hash  VARCHAR(64) NOT NULL,
  code        VARCHAR(6) NOT NULL,
  expires_at  TIMESTAMP NOT NULL,
  used        BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id    UUID REFERENCES classes(id) ON DELETE CASCADE,
  date        DATE NOT NULL,
  opened_at   TIMESTAMP,
  closed_at   TIMESTAMP,
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE attendance (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID REFERENCES sessions(id) ON DELETE CASCADE,
  student_id      UUID REFERENCES students(id) ON DELETE CASCADE,
  present         BOOLEAN DEFAULT FALSE,
  checked_in_at   TIMESTAMP,
  UNIQUE(session_id, student_id)
);

CREATE TABLE grades (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID REFERENCES sessions(id) ON DELETE CASCADE,
  student_id  UUID REFERENCES students(id) ON DELETE CASCADE,
  score       NUMERIC(3,1) CHECK (score BETWEEN 0.0 AND 5.0),
  type        VARCHAR(10) NOT NULL,
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE submissions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grade_id      UUID REFERENCES grades(id),
  student_id    UUID REFERENCES students(id) ON DELETE CASCADE,
  session_id    UUID REFERENCES sessions(id) ON DELETE CASCADE,
  content       TEXT NOT NULL,
  submitted_at  TIMESTAMP DEFAULT NOW()
);
