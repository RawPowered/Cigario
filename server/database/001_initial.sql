-- Cigario v1, MariaDB 10.6+/MySQL 8.0+, utf8mb4. Run in a new empty database.
-- No fictional catalog or user accounts are inserted by this migration.
CREATE TABLE schema_migrations (
  version VARCHAR(40) NOT NULL PRIMARY KEY,
  applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE users (
  id CHAR(36) NOT NULL PRIMARY KEY,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('user','curator','admin') NOT NULL DEFAULT 'user',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE api_tokens (
  id CHAR(36) NOT NULL PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_tokens_user (user_id),
  CONSTRAINT fk_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE login_attempts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  fingerprint CHAR(64) NOT NULL,
  attempted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_attempts_window (fingerprint, attempted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE cigar_catalog (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  brand VARCHAR(150) NOT NULL,
  line_name VARCHAR(160) NOT NULL,
  origin VARCHAR(140) NOT NULL,
  vitola VARCHAR(100) NOT NULL,
  size VARCHAR(60) NOT NULL,
  wrapper VARCHAR(160) NOT NULL,
  binder VARCHAR(160) NOT NULL,
  filler VARCHAR(160) NOT NULL,
  strength TINYINT UNSIGNED NOT NULL,
  notes_json LONGTEXT NOT NULL,
  description TEXT NOT NULL,
  msrp_cents INT UNSIGNED NULL,
  tone ENUM('light','medium','dark') NOT NULL DEFAULT 'medium',
  published TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_catalog_browse (published, name),
  KEY idx_catalog_brand (brand, line_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE catalog_field_sources (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  cigar_id VARCHAR(64) NOT NULL,
  field_name VARCHAR(70) NOT NULL,
  source_title VARCHAR(200) NOT NULL,
  source_url VARCHAR(1000) NULL,
  license_note VARCHAR(250) NULL,
  verification_state ENUM('unverified','reviewed','verified') NOT NULL DEFAULT 'unverified',
  verified_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_source_field (cigar_id, field_name),
  CONSTRAINT fk_source_cigar FOREIGN KEY (cigar_id) REFERENCES cigar_catalog(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE lots (
  id CHAR(36) NOT NULL PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  cigar_id VARCHAR(64) NOT NULL,
  mutation_id CHAR(36) NOT NULL,
  acquired_at DATE NOT NULL,
  location VARCHAR(160) NOT NULL,
  source VARCHAR(190) NOT NULL DEFAULT '',
  quantity_acquired INT UNSIGNED NOT NULL,
  price_paid_cents INT UNSIGNED NULL,
  format ENUM('Single','Pack','Box') NOT NULL,
  memo TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_lots_mutation (user_id, mutation_id),
  KEY idx_lots_user_date (user_id, acquired_at),
  CONSTRAINT fk_lots_owner FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_lots_cigar FOREIGN KEY (cigar_id) REFERENCES cigar_catalog(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE stock_events (
  id CHAR(36) NOT NULL PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  lot_id CHAR(36) NOT NULL,
  mutation_id CHAR(36) NOT NULL,
  delta INT NOT NULL,
  kind ENUM('acquisition','consumed','adjustment') NOT NULL,
  occurred_at DATETIME NOT NULL,
  note VARCHAR(350) NOT NULL DEFAULT '',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_events_mutation (user_id, mutation_id),
  KEY idx_events_lot (user_id, lot_id, occurred_at),
  CONSTRAINT fk_events_owner FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_events_lot FOREIGN KEY (lot_id) REFERENCES lots(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE reviews (
  id CHAR(36) NOT NULL PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  cigar_id VARCHAR(64) NOT NULL,
  lot_id CHAR(36) NULL,
  rating TINYINT UNSIGNED NOT NULL,
  notes TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_reviews_user (user_id, created_at),
  CONSTRAINT fk_reviews_owner FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_reviews_cigar FOREIGN KEY (cigar_id) REFERENCES cigar_catalog(id) ON DELETE RESTRICT,
  CONSTRAINT fk_reviews_lot FOREIGN KEY (lot_id) REFERENCES lots(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO schema_migrations (version) VALUES ('001_initial');
