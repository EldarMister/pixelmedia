-- Pixel Media CRM PostgreSQL schema

CREATE TABLE IF NOT EXISTS services (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('video', 'photo', 'design')),
  description TEXT,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  duration VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS equipment (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  description TEXT,
  photo_url TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'free' CHECK (status IN ('free', 'in_use')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  client_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  service_type VARCHAR(255) NOT NULL,
  service_id INTEGER REFERENCES services(id) ON DELETE SET NULL,
  order_date DATE NOT NULL,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  deposit DECIMAL(10, 2) NOT NULL DEFAULT 0,
  status VARCHAR(30) NOT NULL DEFAULT 'booked' CHECK (status IN ('booked', 'deposit', 'in_progress', 'completed')),
  comment TEXT,
  photos JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS off_days (
  id SERIAL PRIMARY KEY,
  off_date DATE NOT NULL UNIQUE,
  note TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(order_date);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_equipment_status ON equipment(status);
CREATE INDEX IF NOT EXISTS idx_off_days_date ON off_days(off_date);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS orders_updated_at ON orders;
CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS services_updated_at ON services;
CREATE TRIGGER services_updated_at
  BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS equipment_updated_at ON equipment;
CREATE TRIGGER equipment_updated_at
  BEFORE UPDATE ON equipment
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

INSERT INTO services (name, category, description, price, duration)
SELECT seed.name, seed.category, seed.description, seed.price, seed.duration
FROM (
  VALUES
    ('Стандарт', 'video', '1 камера и 1 дрон', 0, 'Пакет'),
    ('VIP', 'video', '2 камеры и 2 дрона: одна камера для фото, вторая для видео', 0, 'Пакет'),
    ('Клип тартуу', 'video', 'Кесипкой клип тартуу кызматы', 15000, '4-8 саат'),
    ('Корпоратив видео', 'video', 'Компания учун видео контент жасоо', 25000, '1-2 кун'),
    ('Фото сессия', 'photo', 'Студиялык же сырттагы фото сессия', 8000, '2-3 саат'),
    ('Продукт фото', 'photo', 'Товар жана продукт фотографиясы', 5000, '2-4 саат'),
    ('Логотип дизайн', 'design', 'Уникалдуу логотип иштеп чыгуу', 12000, '3-5 жумуш кун'),
    ('Социалдык медиа дизайн', 'design', 'SMM контент жана баннерлер', 6000, '1-2 жумуш кун')
) AS seed(name, category, description, price, duration)
WHERE NOT EXISTS (
  SELECT 1 FROM services s WHERE s.name = seed.name
);

INSERT INTO equipment (name, category, description, status)
SELECT seed.name, seed.category, seed.description, seed.status
FROM (
  VALUES
    ('Sony A7 III', 'Камера', 'Кесипкой фото жана видео камера', 'free'),
    ('DJI Ronin-S', 'Стабилизатор', '3-огу стабилизатор', 'free'),
    ('Aputure 300D', 'Жарык', 'Кесипкой LED жарык', 'in_use'),
    ('DJI Mini 3 Pro', 'Дрон', 'Аэрофото учун дрон', 'free'),
    ('MacBook Pro M3', 'Компьютер', 'Монтаж жана дизайн учун', 'in_use')
) AS seed(name, category, description, status)
WHERE NOT EXISTS (
  SELECT 1 FROM equipment e WHERE e.name = seed.name
);
