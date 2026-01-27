const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'database.db');
const db = new Database(dbPath);

console.log('🛠️  Inicializando banco de dados SQL Puro...');

try {
  // Tabela USERS
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('super_admin', 'organizador', 'atleta')),
      cpf TEXT
    );
  `);
  console.log('✅ Tabela users verificada/criada.');

  // Adicionar coluna cpf se não existir (migração)
  try {
    db.exec(`ALTER TABLE users ADD COLUMN cpf TEXT;`);
    console.log('✅ Coluna cpf adicionada à tabela users.');
  } catch (error) {
    // Coluna já existe, tudo bem
    if (!error.message.includes('duplicate column name')) {
      throw error;
    }
  }

  // Tabela ATHLETE_PROFILES (perfil completo dos atletas)
  db.exec(`
    CREATE TABLE IF NOT EXISTS athlete_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      phone TEXT,
      birth_date TEXT,
      weight REAL,
      gender TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);
  console.log('✅ Tabela athlete_profiles verificada/criada.');

  // Criar índice para athlete_profiles
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_athlete_profiles_user_id 
    ON athlete_profiles(user_id);
  `);


  // Tabela SESSIONS
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token TEXT NOT NULL UNIQUE,
      created_at DATETIME NOT NULL,
      expires_at DATETIME NOT NULL,
      revoked_at DATETIME,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);
  console.log('✅ Tabela sessions verificada/criada.');

  // Tabela EVENTS
  // Adicionamos organizer_id
  db.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      organizer_id INTEGER NOT NULL DEFAULT 0,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      description TEXT,
      date TEXT NOT NULL,
      FOREIGN KEY(organizer_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Tentar adicionar coluna se tabela já existia sem ela (migração manual simples)
  try {
    db.prepare("ALTER TABLE events ADD COLUMN organizer_id INTEGER NOT NULL DEFAULT 0").run();
    console.log('✅ Coluna organizer_id adicionada.');
  } catch (e) {
    // Ignorar erro se coluna já existe
  }

  console.log('✅ Tabela events verificada/criada.');

  // Tabela CATEGORIES
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      organizer_id INTEGER NOT NULL DEFAULT 0,
      belt TEXT NOT NULL,
      min_weight REAL NOT NULL,
      max_weight REAL NOT NULL,
      age_group TEXT NOT NULL,
      registration_fee REAL NOT NULL DEFAULT 0,
      FOREIGN KEY(organizer_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Tentar adicionar colunas se tabela já existia sem elas
  try {
    db.prepare("ALTER TABLE categories ADD COLUMN organizer_id INTEGER NOT NULL DEFAULT 0").run();
  } catch (e) { }

  try {
    db.prepare("ALTER TABLE categories ADD COLUMN registration_fee REAL NOT NULL DEFAULT 0").run();
    console.log('✅ Coluna registration_fee adicionada à tabela categories.');
  } catch (e) { }

  console.log('✅ Tabela categories verificada/criada.');

  // Tabela EVENT_CATEGORIES (relacionamento)
  db.exec(`
    CREATE TABLE IF NOT EXISTS event_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL,
      category_id INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(event_id, category_id),
      FOREIGN KEY(event_id) REFERENCES events(id) ON DELETE CASCADE,
      FOREIGN KEY(category_id) REFERENCES categories(id) ON DELETE CASCADE
    );
  `)
  console.log('✅ Tabela event_categories verificada/criada.')

  // Tabela de eventos de interesse dos atletas
  db.exec(`
    CREATE TABLE IF NOT EXISTS athlete_event_interests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      athlete_user_id INTEGER NOT NULL,
      event_id INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(athlete_user_id, event_id),
      FOREIGN KEY(athlete_user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(event_id) REFERENCES events(id) ON DELETE CASCADE
    );
  `)
  console.log('✅ Tabela athlete_event_interests verificada/criada.')

  // Tabela de inscrições de atletas em eventos
  db.exec(`
    CREATE TABLE IF NOT EXISTS registrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      athlete_user_id INTEGER NOT NULL,
      event_id INTEGER NOT NULL,
      category_id INTEGER NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('pending_payment', 'paid', 'cancelled')),
      amount_cents INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT,
      UNIQUE(athlete_user_id, event_id),
      FOREIGN KEY(athlete_user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(event_id) REFERENCES events(id) ON DELETE CASCADE,
      FOREIGN KEY(category_id) REFERENCES categories(id) ON DELETE RESTRICT
    );
  `)
  console.log('✅ Tabela registrations verificada/criada.')

  // Tabela de credenciais Asaas por organizador
  db.exec(`
    CREATE TABLE IF NOT EXISTS organizer_asaas_credentials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      organizer_user_id INTEGER NOT NULL UNIQUE,
      asaas_api_key TEXT NOT NULL,
      environment TEXT NOT NULL CHECK(environment IN ('sandbox', 'production')),
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT,
      FOREIGN KEY(organizer_user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `)
  console.log('✅ Tabela organizer_asaas_credentials verificada/criada.')

  // Tabela de cobranças Pix via Asaas
  db.exec(`
    CREATE TABLE IF NOT EXISTS asaas_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      registration_id INTEGER NOT NULL UNIQUE,
      organizer_user_id INTEGER NOT NULL,
      asaas_payment_id TEXT NOT NULL,
      asaas_customer_id TEXT NOT NULL,
      status TEXT NOT NULL,
      value_cents INTEGER NOT NULL,
      pix_qr_code TEXT,
      pix_copy_paste TEXT,
      expires_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT,
      FOREIGN KEY(registration_id) REFERENCES registrations(id) ON DELETE CASCADE,
      FOREIGN KEY(organizer_user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `)
  console.log('✅ Tabela asaas_payments verificada/criada.')

  console.log('🚀 Banco de dados pronto para uso.')
} catch (error) {
  console.error('❌ Erro ao inicializar banco de dados:', error);
  process.exit(1);
}
