-- ============================================
-- ASSISTEN CALENDAR — Initial Schema
-- Supabase / Postgres Migration
-- ============================================

-- Tabla de Perfiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  google_refresh_token TEXT,
  google_access_token TEXT,
  token_expires_at TIMESTAMPTZ,
  timezone TEXT DEFAULT 'America/Bogota',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de Actividades (Principal)
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('academica', 'personal')),
  course_name TEXT,
  title TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  due_date TIMESTAMPTZ NOT NULL,
  block_duration_hours INTEGER DEFAULT 2 CHECK (block_duration_hours BETWEEN 2 AND 3),
  status TEXT NOT NULL DEFAULT 'en_proceso'
    CHECK (status IN ('en_proceso', 'cumplida', 'vencida', 'eliminada')),
  priority TEXT DEFAULT 'normal'
    CHECK (priority IN ('baja', 'normal', 'alta', 'urgente')),
  file_url TEXT,
  google_event_id TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de Subtareas
CREATE TABLE subtasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de Recordatorios
CREATE TABLE reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  remind_at TIMESTAMPTZ NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('7_dias', '5_dias', '3_dias', 'dia_cierre')),
  is_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de Archivos Subidos
CREATE TABLE file_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  ai_processed BOOLEAN DEFAULT FALSE,
  ai_result JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ÍNDICES
-- ============================================
CREATE INDEX idx_activities_user_status ON activities(user_id, status);
CREATE INDEX idx_activities_user_date ON activities(user_id, due_date);
CREATE INDEX idx_activities_user_category ON activities(user_id, category);
CREATE INDEX idx_activities_course ON activities(user_id, course_name);
CREATE INDEX idx_reminders_pending ON reminders(remind_at) WHERE is_sent = FALSE;
CREATE INDEX idx_subtasks_activity ON subtasks(activity_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own profile" ON profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users manage own activities" ON activities
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own subtasks" ON subtasks
  FOR ALL USING (activity_id IN (
    SELECT id FROM activities WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users manage own reminders" ON reminders
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own uploads" ON file_uploads
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- TRIGGER: Auto-generate reminders
-- ============================================
CREATE OR REPLACE FUNCTION generate_reminders()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO reminders (activity_id, user_id, remind_at, type) VALUES
    (NEW.id, NEW.user_id, NEW.due_date - INTERVAL '7 days', '7_dias'),
    (NEW.id, NEW.user_id, NEW.due_date - INTERVAL '5 days', '5_dias'),
    (NEW.id, NEW.user_id, NEW.due_date - INTERVAL '3 days', '3_dias'),
    (NEW.id, NEW.user_id, NEW.due_date, 'dia_cierre');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generate_reminders
  AFTER INSERT ON activities
  FOR EACH ROW EXECUTE FUNCTION generate_reminders();

-- ============================================
-- TRIGGER: Auto-update updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_activities_updated
  BEFORE UPDATE ON activities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
