-- Add border_radius column to white_labels table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'white_labels' AND column_name = 'border_radius'
    ) THEN
        ALTER TABLE white_labels ADD COLUMN border_radius text DEFAULT '0.5rem';
    END IF;
END $$;