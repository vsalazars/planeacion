CREATE TABLE unidades_academicas (
  id BIGSERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  abreviatura VARCHAR(50)
);

CREATE TYPE user_role AS ENUM ('admin','profesor');

CREATE TABLE usuarios (
  id BIGSERIAL PRIMARY KEY,
  unidad_id INTEGER NOT NULL
      REFERENCES unidades_academicas(id)
      ON UPDATE CASCADE
      ON DELETE RESTRICT,
  nombre_completo VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'profesor',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_usuarios_role ON usuarios(role);
CREATE INDEX idx_usuarios_unidad_id ON usuarios(unidad_id);

CREATE TYPE planeacion_status AS ENUM (
  'borrador',
  'en_progreso',
  'finalizada',
  'archivada'
);

CREATE TABLE planeaciones (
  id BIGSERIAL PRIMARY KEY,
  docente_id INTEGER NOT NULL
      REFERENCES usuarios(id)
      ON UPDATE CASCADE
      ON DELETE RESTRICT,
  unidad_academica_id INTEGER NOT NULL
      REFERENCES unidades_academicas(id)
      ON UPDATE CASCADE
      ON DELETE RESTRICT,
  nombre_planeacion VARCHAR(255) NOT NULL,
  asignatura VARCHAR(255),
  periodo VARCHAR(50),
  grupo VARCHAR(50),
  status planeacion_status NOT NULL DEFAULT 'borrador',
  secciones_completas JSONB NOT NULL DEFAULT
    '{
      "datos": false,
      "relaciones": false,
      "organizacion": false,
      "referencias": false,
      "plagio": false
    }',
  finalizada_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_planeaciones_docente ON planeaciones(docente_id);
CREATE INDEX idx_planeaciones_status ON planeaciones(status);

CREATE TABLE planeacion_datos_generales (
  id BIGSERIAL PRIMARY KEY,
  planeacion_id BIGINT NOT NULL
      REFERENCES planeaciones(id)
      ON UPDATE CASCADE
      ON DELETE CASCADE,
  asignatura VARCHAR(255),
  periodo VARCHAR(50),
  grupo VARCHAR(50),
  proposito TEXT,
  metodologia TEXT,
  consideraciones TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE planeacion_relaciones_ejes (
  id BIGSERIAL PRIMARY KEY,
  planeacion_id BIGINT NOT NULL
      REFERENCES planeaciones(id)
      ON UPDATE CASCADE
      ON DELETE CASCADE,
  eje_disciplinar TEXT,
  eje_transversal TEXT,
  competencias TEXT,
  resultados_aprendizaje TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE planeacion_referencias (
  id BIGSERIAL PRIMARY KEY,
  planeacion_id BIGINT NOT NULL
      REFERENCES planeaciones(id)
      ON UPDATE CASCADE
      ON DELETE CASCADE,
  referencia TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE planeacion_plagio (
  id BIGSERIAL PRIMARY KEY,
  planeacion_id BIGINT NOT NULL
      REFERENCES planeaciones(id)
      ON UPDATE CASCADE
      ON DELETE CASCADE,
  acepta_plagio BOOLEAN NOT NULL DEFAULT false,
  descripcion TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE unidades_tematicas (
  id BIGSERIAL PRIMARY KEY,
  planeacion_id BIGINT NOT NULL
      REFERENCES planeaciones(id)
      ON UPDATE CASCADE
      ON DELETE CASCADE,
  numero INTEGER NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  horas INTEGER,
  sesiones_por_espacio INTEGER,
  sesiones_totales INTEGER,
  porcentaje INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_unidades_planeacion ON unidades_tematicas(planeacion_id);

CREATE TABLE sesiones_didacticas (
  id BIGSERIAL PRIMARY KEY,
  unidad_tematica_id BIGINT NOT NULL
      REFERENCES unidades_tematicas(id)
      ON UPDATE CASCADE
      ON DELETE CASCADE,
  numero_sesion INTEGER NOT NULL,
  temas TEXT,
  actividades TEXT,
  valor_porcentual INTEGER,
  evidencia TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sesiones_unidad ON sesiones_didacticas(unidad_tematica_id);

CREATE TRIGGER trg_usuarios_updated_at
BEFORE UPDATE ON usuarios
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_planeaciones_updated_at
BEFORE UPDATE ON planeaciones
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_pdg_updated_at
BEFORE UPDATE ON planeacion_datos_generales
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_pre_updated_at
BEFORE UPDATE ON planeacion_relaciones_ejes
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_pref_updated_at
BEFORE UPDATE ON planeacion_referencias
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_pp_updated_at
BEFORE UPDATE ON planeacion_plagio
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_ut_updated_at
BEFORE UPDATE ON unidades_tematicas
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_sd_updated_at
BEFORE UPDATE ON sesiones_didacticas
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
