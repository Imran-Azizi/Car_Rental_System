-- Create a gapless sequence for sequential contract numbers.
-- The sequence starts at 1 and is incremented by 1 for each new contract.
-- Even if a contract is deleted, its number is never reassigned.
CREATE SEQUENCE IF NOT EXISTS contract_number_seq
  START 1
  INCREMENT 1
  CACHE 1;
