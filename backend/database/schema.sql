-- ============================================================
-- Private Chat — PostgreSQL Schema
-- ============================================================
-- Run with: psql -U <user> -d <database> -f schema.sql
-- ============================================================

-- Clean slate (safe to re-run during development)
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS active_users CASCADE;
DROP TABLE IF EXISTS temporary_credentials CASCADE;
DROP TABLE IF EXISTS chat_rooms CASCADE;
DROP TABLE IF EXISTS settings CASCADE;
DROP TABLE IF EXISTS admins CASCADE;

-- ------------------------------------------------------------
-- ADMIN — exactly one row is expected in normal operation
-- ------------------------------------------------------------
CREATE TABLE admins (
    id              SERIAL PRIMARY KEY,
    username        VARCHAR(64)  NOT NULL UNIQUE,
    password_hash   TEXT         NOT NULL,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- CHAT ROOMS
-- ------------------------------------------------------------
CREATE TABLE chat_rooms (
    id              SERIAL PRIMARY KEY,
    room_code       VARCHAR(16)  NOT NULL UNIQUE,       -- e.g. ABCD123
    name            VARCHAR(128) NOT NULL,
    status          VARCHAR(16)  NOT NULL DEFAULT 'open' -- open | closed
                        CHECK (status IN ('open', 'closed')),
    created_by      INTEGER      REFERENCES admins(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    closed_at       TIMESTAMPTZ
);

CREATE INDEX idx_chat_rooms_room_code ON chat_rooms(room_code);
CREATE INDEX idx_chat_rooms_status ON chat_rooms(status);

-- ------------------------------------------------------------
-- TEMPORARY CREDENTIALS — username/password pairs tied to a room
-- Multiple concurrent users can share one credential set.
-- ------------------------------------------------------------
CREATE TABLE temporary_credentials (
    id              SERIAL PRIMARY KEY,
    room_id         INTEGER      NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    username        VARCHAR(64)  NOT NULL,
    password_hash   TEXT         NOT NULL,
    expires_at      TIMESTAMPTZ,                          -- NULL = no expiry
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE (room_id, username)
);

CREATE INDEX idx_temp_creds_room_id ON temporary_credentials(room_id);

-- ------------------------------------------------------------
-- MESSAGES
-- ------------------------------------------------------------
CREATE TABLE messages (
    id              BIGSERIAL PRIMARY KEY,
    room_id         INTEGER      NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    sender_name     VARCHAR(64)  NOT NULL,
    socket_id       VARCHAR(64),
    content         TEXT         NOT NULL,
    message_type    VARCHAR(16)  NOT NULL DEFAULT 'text'  -- text | system
                        CHECK (message_type IN ('text', 'system')),
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_room_id ON messages(room_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- ------------------------------------------------------------
-- ACTIVE USERS — currently-connected sockets per room (presence)
-- ------------------------------------------------------------
CREATE TABLE active_users (
    id              SERIAL PRIMARY KEY,
    room_id         INTEGER      NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    display_name    VARCHAR(64)  NOT NULL,
    socket_id       VARCHAR(64)  NOT NULL UNIQUE,
    joined_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_active_users_room_id ON active_users(room_id);

-- ------------------------------------------------------------
-- SETTINGS — simple key/value store for admin-configurable options
-- ------------------------------------------------------------
CREATE TABLE settings (
    key             VARCHAR(64) PRIMARY KEY,
    value           TEXT NOT NULL,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO settings (key, value) VALUES
    ('max_rooms', '100'),
    ('default_credential_expiry_hours', '24');

-- ------------------------------------------------------------
-- Trigger: keep admins.updated_at fresh
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_admins_updated_at
BEFORE UPDATE ON admins
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
