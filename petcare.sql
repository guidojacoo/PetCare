BEGIN;

-- Eliminar tablas si ya existen
DROP TABLE IF EXISTS comidas_programadas CASCADE;
DROP TABLE IF EXISTS dispensador_config CASCADE;
DROP TABLE IF EXISTS mascotas CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;

--Tabla: usuarios
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
  usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Tabla: configuracion de dispensador
CREATE TABLE dispensador_config (
  mascota_id INTEGER PRIMARY KEY REFERENCES mascotas(id) ON DELETE CASCADE,
  dias_activos VARCHAR(14) NOT NULL DEFAULT '',
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_dias_activos_formato CHECK (dias_activos ~ '^[1-7]*$')
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

COMMIT;
