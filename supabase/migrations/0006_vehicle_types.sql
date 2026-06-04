-- =============================================================================
-- Rideva — Add motorcycle & rickshaw vehicle classes
-- =============================================================================
-- IMPORTANT: run this file BY ITSELF, before 0007. Postgres does not allow a
-- newly-added enum value to be USED in the same transaction it was added in, so
-- the pricing rows that reference these values live in the next migration.
-- =============================================================================

alter type vehicle_class add value if not exists 'motorcycle';
alter type vehicle_class add value if not exists 'rickshaw';
