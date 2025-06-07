/*
  # Esquema completo para plataforma de bolsa de trabajo

  1. Nuevas Tablas
    - `profiles` - Perfiles de usuarios (aspirantes y empleadores)
    - `jobs` - Empleos publicados por empleadores
    - `applications` - Postulaciones de aspirantes a empleos

  2. Seguridad
    - Habilitar RLS en todas las tablas
    - Políticas para que usuarios solo accedan a sus datos
    - Políticas para empleadores gestionen sus empleos
    - Políticas para aspirantes vean empleos y gestionen postulaciones

  3. Storage
    - Bucket para currículums en PDF
*/

-- Crear tabla de perfiles
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL,
  user_type text NOT NULL CHECK (user_type IN ('applicant', 'employer')),
  phone text,
  location text,
  skills text[],
  experience text,
  resume_url text,
  company_name text,
  company_description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Crear tabla de empleos
CREATE TABLE IF NOT EXISTS jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  requirements text NOT NULL,
  location text NOT NULL,
  salary numeric NOT NULL CHECK (salary > 0),
  currency text NOT NULL DEFAULT 'USD',
  job_type text NOT NULL CHECK (job_type IN ('full-time', 'part-time', 'contract', 'freelance')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Crear tabla de postulaciones
CREATE TABLE IF NOT EXISTS applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  applicant_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  cover_letter text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(job_id, applicant_id)
);

-- Habilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Políticas para jobs
CREATE POLICY "Anyone can read active jobs"
  ON jobs
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Employers can read own jobs"
  ON jobs
  FOR SELECT
  TO authenticated
  USING (employer_id = auth.uid());

CREATE POLICY "Employers can create jobs"
  ON jobs
  FOR INSERT
  TO authenticated
  WITH CHECK (employer_id = auth.uid());

CREATE POLICY "Employers can update own jobs"
  ON jobs
  FOR UPDATE
  TO authenticated
  USING (employer_id = auth.uid());

-- Políticas para applications
CREATE POLICY "Applicants can read own applications"
  ON applications
  FOR SELECT
  TO authenticated
  USING (applicant_id = auth.uid());

CREATE POLICY "Employers can read applications for their jobs"
  ON applications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = applications.job_id 
      AND jobs.employer_id = auth.uid()
    )
  );

CREATE POLICY "Applicants can create applications"
  ON applications
  FOR INSERT
  TO authenticated
  WITH CHECK (applicant_id = auth.uid());

CREATE POLICY "Employers can update applications for their jobs"
  ON applications
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = applications.job_id 
      AND jobs.employer_id = auth.uid()
    )
  );

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_jobs_employer_id ON jobs(employer_id);
CREATE INDEX IF NOT EXISTS idx_jobs_is_active ON jobs(is_active);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_applicant_id ON applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);

-- Crear bucket para currículums si no existe
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('resumes', 'resumes', true)
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Política de storage para currículums
CREATE POLICY IF NOT EXISTS "Users can upload own resume"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY IF NOT EXISTS "Users can read own resume"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY IF NOT EXISTS "Users can update own resume"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY IF NOT EXISTS "Users can delete own resume"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();