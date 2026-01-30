-- Run this once before restarting the backend if you have existing members with string partyId.
-- Converts varchar partyId to integer (strips non-digits: "P0001" -> 1, "1" -> 1).
-- If your column is named party_id, replace "partyId" with party_id in the ALTER below.

ALTER TABLE members
  ALTER COLUMN "partyId" TYPE integer
  USING (COALESCE(NULLIF(REGEXP_REPLACE(TRIM(COALESCE("partyId"::text, '')), '[^0-9]', '', 'g'), '')::integer, 0));
