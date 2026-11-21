-- Cigario v2 additive collection contract. Run once AFTER 001_initial.sql.
-- Requires MariaDB 10.6+ / MySQL 8.0. Backup existing database before application.
-- Never run while v2 API is accepting writes; imports and migrations must be serialized.
CREATE TABLE humidors (
  id CHAR(36) NOT NULL PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  name VARCHAR(50) NOT NULL,
  notes VARCHAR(120) NOT NULL DEFAULT '',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_humidors_user (user_id),
  UNIQUE KEY uq_humidors_user_name (user_id,name),
  CONSTRAINT fk_humidors_owner FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE lots
  ADD COLUMN humidor_id CHAR(36) NULL AFTER cigar_id,
  ADD COLUMN origin_lot_id CHAR(36) NULL AFTER humidor_id,
  ADD COLUMN allocated_cost_cents INT UNSIGNED NULL AFTER origin_lot_id,
  ADD KEY idx_lots_humidor (user_id,humidor_id),
  ADD CONSTRAINT fk_lots_humidor FOREIGN KEY (humidor_id) REFERENCES humidors(id) ON DELETE RESTRICT;

ALTER TABLE stock_events
  MODIFY kind ENUM('acquisition','consumed','adjustment','transfer_in','transfer_out','transferred','metadata_updated') NOT NULL,
  ADD COLUMN transaction_id CHAR(36) NULL,
  ADD COLUMN event_sequence INT UNSIGNED NULL;

ALTER TABLE reviews
  ADD COLUMN occurred_at DATETIME NULL,
  ADD COLUMN mode ENUM('quick','detailed') NOT NULL DEFAULT 'quick',
  ADD COLUMN thirds_json LONGTEXT NULL,
  ADD COLUMN draw_note VARCHAR(80) NULL,
  ADD COLUMN construction_note VARCHAR(80) NULL;

-- The user revision is the basis for optimistic concurrency: never blindly overwrite an account.
CREATE TABLE collection_revisions (
  user_id CHAR(36) NOT NULL PRIMARY KEY,
  revision BIGINT UNSIGNED NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_revisions_owner FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Persist the import mutation ID to make network retries safe.
CREATE TABLE collection_imports (
  user_id CHAR(36) NOT NULL,
  mutation_id CHAR(36) NOT NULL,
  device_id CHAR(36) NOT NULL,
  payload_hash CHAR(64) NOT NULL,
  resulting_revision BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(user_id,mutation_id),
  CONSTRAINT fk_imports_owner FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO schema_migrations(version) VALUES ('002_collection_v2');
