BEGIN;

-- Eliminar tablas si ya existen
DROP TABLE IF EXISTS feed_eventos CASCADE;
DROP TABLE IF EXISTS plan_syncs CASCADE;
DROP TABLE IF EXISTS planes CASCADE;
DROP TABLE IF EXISTS horarios CASCADE;
DROP TABLE IF EXISTS comidas_programadas CASCADE;
DROP TABLE IF EXISTS dispensador_config CASCADE;
DROP TABLE IF EXISTS mascotas CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;

-- Tabla: usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(80) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    fecha_registro TIMESTAMPTZ DEFAULT NOW(),
    rol VARCHAR(20) DEFAULT 'usuario'
);

-- Tabla: mascotas
CREATE TABLE mascotas (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(80) NOT NULL,
  sexo VARCHAR(10) NOT NULL,
  raza VARCHAR(80),
  peso_kg NUMERIC(5,2),
  fecha_nacimiento DATE,
  creado_en TIMESTAMPTZ DEFAULT now(),
  usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
  kcal_100g INT
);

-- Tabla: planes
CREATE TABLE planes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  mode TEXT NOT NULL CHECK (mode IN ('repeat_week','per_day')),
  seconds_open INT NOT NULL CHECK (seconds_open BETWEEN 1 AND 60),
  dayplan TIME[],
  weekplan JSONB,
  grams_per_meal INT NOT NULL CHECK (grams_per_meal > 0),
  hopper_g INT,
  esp JSONB,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_planes_user ON planes(user_id);

-- Tabla: plan_syncs
CREATE TABLE plan_syncs (
  id SERIAL PRIMARY KEY,
  plan_id INTEGER NOT NULL REFERENCES planes(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  ok BOOLEAN NOT NULL,
  message TEXT,
  esp JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_plan_syncs_plan ON plan_syncs(plan_id);

-- Tabla: horarios
CREATE TABLE horarios (
  id SERIAL PRIMARY KEY,
  mascota_id INTEGER NOT NULL REFERENCES mascotas(id) ON DELETE CASCADE,
  hora_local TIME NOT NULL,
  gramos INT NOT NULL CHECK (gramos > 0),
  dias VARCHAR(7) NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_horarios_mascota ON horarios(mascota_id);

-- Tabla: configuracion de dispensador
CREATE TABLE dispensador_config (
  mascota_id INTEGER PRIMARY KEY REFERENCES mascotas(id) ON DELETE CASCADE,
  mode TEXT NOT NULL CHECK (mode IN ('per_day','per_week')),
  seconds_open INT NOT NULL CHECK (seconds_open BETWEEN 1 AND 60),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla: comidas programadas
CREATE TABLE comidas_programadas (
  id SERIAL PRIMARY KEY,
  mascota_id INTEGER NOT NULL REFERENCES mascotas(id) ON DELETE CASCADE,
  dia_semana SMALLINT NOT NULL,
  hora_local TIME NOT NULL,
  gramos INTEGER NOT NULL,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_dia_semana CHECK (dia_semana BETWEEN 1 AND 7),
  CONSTRAINT chk_gramos_pos CHECK (gramos > 0),
  CONSTRAINT uq_mascota_dia_hora UNIQUE (mascota_id, dia_semana, hora_local)
);
CREATE INDEX IF NOT EXISTS idx_comidas_mascota ON comidas_programadas (mascota_id);
CREATE INDEX IF NOT EXISTS idx_comidas_dia ON comidas_programadas (dia_semana);

-- Tabla: feed_eventos
CREATE TABLE feed_eventos (
  id SERIAL PRIMARY KEY,
  mascota_id INTEGER NOT NULL REFERENCES mascotas(id) ON DELETE CASCADE,
  plan_id INTEGER REFERENCES planes(id) ON DELETE SET NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('servo','sensor')),
  accion TEXT NOT NULL CHECK (accion IN ('comida','agua')),
  estado TEXT NOT NULL CHECK (estado IN ('ok','fail')),
  gramos INT,
  fuente TEXT CHECK (fuente IN ('plan','manual','api')),
  detalle TEXT,
  esp_id TEXT,
  slot_hhmm TIME,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_feed_eventos_mascota ON feed_eventos(mascota_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_tick_por_slot_dia
  ON feed_eventos (mascota_id, slot_hhmm, (created_at AT TIME ZONE 'America/Argentina/Buenos_Aires')::date)
  WHERE estado = 'ok';

COMMIT;

