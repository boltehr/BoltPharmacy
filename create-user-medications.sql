-- Create user_medications table
CREATE TABLE IF NOT EXISTS user_medications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  medication_id INTEGER NOT NULL REFERENCES medications(id),
  prescription_id INTEGER REFERENCES prescriptions(id),
  start_date TIMESTAMP DEFAULT NOW(),
  end_date TIMESTAMP,
  dosage TEXT,
  frequency TEXT,
  instructions TEXT,
  notes TEXT,
  active BOOLEAN DEFAULT TRUE,
  source TEXT DEFAULT 'manual'
);