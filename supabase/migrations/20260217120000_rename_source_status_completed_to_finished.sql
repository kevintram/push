-- Rename source status COMPLETED to FINISHED.

-- Drop the existing constraint
ALTER TABLE sources DROP CONSTRAINT sources_status_check;

-- Update existing rows
UPDATE sources SET status = 'FINISHED' WHERE status = 'COMPLETED';

-- Re-add the constraint with FINISHED instead of COMPLETED
ALTER TABLE sources
ADD CONSTRAINT sources_status_check
CHECK (status IN ('NEW', 'IN_PROGRESS', 'ON_HOLD', 'DROPPED', 'FINISHED'));
