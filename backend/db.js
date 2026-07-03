// db.js — PostgreSQL connection + schema setup
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Run once on startup to create all tables if they don't exist yet
async function initSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS businesses (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      category    TEXT NOT NULL,
      area        TEXT NOT NULL,
      icon        TEXT NOT NULL DEFAULT '🏪',
      open_time   TEXT NOT NULL,
      close_time  TEXT NOT NULL,
      phone       TEXT NOT NULL,
      -- bcrypt hash of the owner's chosen password
      password_hash TEXT,
      created_at  TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token       TEXT PRIMARY KEY,
      business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
      created_at  TIMESTAMPTZ DEFAULT NOW()
    );

    -- Push subscriptions for owners (one per business, last one wins)
    CREATE TABLE IF NOT EXISTS owner_push_subs (
      business_id   TEXT PRIMARY KEY REFERENCES businesses(id) ON DELETE CASCADE,
      subscription  JSONB NOT NULL,
      updated_at    TIMESTAMPTZ DEFAULT NOW()
    );

    -- Push subscriptions for customers (linked to a booking code)
    CREATE TABLE IF NOT EXISTS customer_push_subs (
      booking_code  TEXT PRIMARY KEY,
      subscription  JSONB NOT NULL,
      created_at    TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id            SERIAL PRIMARY KEY,
      business_id   TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
      -- 'today' or 'tomorrow' — simple strings for the prototype
      day_key       TEXT NOT NULL,
      slot_start    TEXT NOT NULL,   -- e.g. '09:00'
      slot_end      TEXT NOT NULL,   -- e.g. '10:00'
      status        TEXT NOT NULL DEFAULT 'booked',  -- booked | blocked | late
      booking_code  TEXT UNIQUE,     -- null for owner-blocked slots
      reminder_mins INT,             -- customer's chosen reminder offset
      created_at    TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (business_id, day_key, slot_start)
    );
  `);

  // Seed starter businesses if the table is empty
  const { rowCount } = await pool.query('SELECT 1 FROM businesses LIMIT 1');
  if (rowCount === 0) {
    await pool.query(`
      INSERT INTO businesses (id, name, category, area, icon, open_time, close_time, phone) VALUES
        ('b1', 'Mama Joy''s Kitchen',     'Home-cooked meals', 'Khayelitsha', '🍲', '08:00', '18:00', '071 234 5678'),
        ('b2', 'Sbu Fades Barbershop',    'Barber',            'Soweto',      '💈', '09:00', '19:00', '082 345 6789'),
        ('b3', 'Thandi Braids & Beauty',  'Hair & beauty',     'Umlazi',      '💇', '08:00', '17:00', '073 456 7890'),
        ('b4', 'Vusi Tyre & Repair',      'Mechanic',          'Mamelodi',    '🔧', '07:30', '17:30', '084 567 8901'),
        ('b5', 'Nokuthula Spaza Shop',    'Spaza shop',        'Tembisa',     '🛒', '06:00', '20:00', '076 678 9012'),
        ('b6', 'Sipho Phone Repairs',     'Phone & electronics','Gugulethu',  '📱', '09:00', '18:00', '079 789 0123'),
        ('b7', 'Lindiwe''s Nails',        'Nail bar',          'Alexandra',   '💅', '09:00', '17:00', '081 890 1234'),
        ('b8', 'Bongani Driving School',  'Driving lessons',   'Khayelitsha', '🚗', '08:00', '16:00', '072 901 2345')
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log('Seeded starter businesses.');
  }

  console.log('Database schema ready.');
}

module.exports = { pool, initSchema };
