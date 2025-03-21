-- Kullanıcılar tablosu
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    surname TEXT NOT NULL,
    age INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tedavi bilgileri tablosu
CREATE TABLE IF NOT EXISTS treatments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    antibody_id INTEGER NOT NULL,
    disease_id INTEGER NOT NULL,
    drug_id INTEGER NOT NULL,
    dosage_id INTEGER NOT NULL,
    disease_duration INTEGER NOT NULL,
    disease_duration_type TEXT NOT NULL,
    drug_duration INTEGER NOT NULL,
    drug_duration_type TEXT NOT NULL,
    start_date DATE NOT NULL,
    frequency_days INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Takvim notları tablosu
CREATE TABLE IF NOT EXISTS calendar_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    treatment_id INTEGER NOT NULL,
    date DATE NOT NULL,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (treatment_id) REFERENCES treatments(id)
); 