BEGIN;

-- Eliminar tablas si ya existen
DROP TABLE IF EXISTS horarios CASCADE;
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
  especie VARCHAR(20) NOT NULL,
  raza VARCHAR(80),
  peso_kg NUMERIC(5,2),
  fecha_nacimiento DATE,
  creado_en TIMESTAMPTZ DEFAULT now()
);

-- Datos de ejemplo para mascotas
INSERT INTO mascotas (id, nombre, especie, raza, peso_kg, fecha_nacimiento) VALUES
(1, 'Calcu', 'Perro', 'Labrador', 25.5, '2019-04-15'),
(2, 'Zahir', 'Gato', 'Siames', 4.3, '2021-08-10');

-- Tabla: horarios
CREATE TABLE horarios (
  id SERIAL PRIMARY KEY,
  mascota_id INTEGER NOT NULL,
  hora_local TIME NOT NULL, 
  gramos INTEGER NOT NULL,
  dias VARCHAR(14) NOT NULL,
  activo BOOLEAN DEFAULT true,
  creado_en TIMESTAMPTZ DEFAULT now()
);

-- Datos de ejemplo para horarios
INSERT INTO horarios (id, mascota_id, hora_local, gramos, dias, activo) VALUES
(1, 1, '09:00:00', 200, '1234567', true),
(2, 1, '18:00:00', 250, '1234567', true),
(3, 2, '08:30:00', 50, '1234567', true);

-- Secuencias para IDs
SELECT setval('mascotas_id_seq', (SELECT MAX(id) FROM mascotas));
SELECT setval('horarios_id_seq', (SELECT MAX(id) FROM horarios));

-- Claves foráneas
ALTER TABLE horarios
  ADD CONSTRAINT fk_horarios_mascota
  FOREIGN KEY (mascota_id) REFERENCES mascotas(id);
  
ALTER TABLE mascotas
  ADD COLUMN IF NOT EXISTS usuario_id INT;

ALTER TABLE mascotas
  ADD CONSTRAINT fk_mascotas_usuario
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
  ON DELETE CASCADE;

COMMIT;
