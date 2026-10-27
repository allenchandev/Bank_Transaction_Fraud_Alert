-- Aegis Bank Intelligence Schema
-- Database: aegis_bank (MySQL 8.0+ compatible, relational with strict foreign keys & constraints)

CREATE DATABASE IF NOT EXISTS aegis_bank;
USE aegis_bank;

-- Drop tables in reverse dependency order if resetting
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS alerts;
DROP TABLE IF EXISTS investigation_cases;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS accounts;
DROP TABLE IF EXISTS customers;

-- 1. Customers Table
CREATE TABLE customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_ref VARCHAR(32) NOT NULL UNIQUE,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    age_band VARCHAR(20) NOT NULL,
    occupation VARCHAR(80),
    declared_income_band VARCHAR(40),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_customer_ref (customer_ref)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Accounts Table
CREATE TABLE accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    account_ref VARCHAR(32) NOT NULL UNIQUE,
    customer_id INT NOT NULL,
    account_type ENUM('savings', 'current', 'student') NOT NULL DEFAULT 'savings',
    balance DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    daily_transfer_limit DECIMAL(14, 2) NOT NULL DEFAULT 5000.00,
    per_tx_limit DECIMAL(14, 2) NOT NULL DEFAULT 2500.00,
    monthly_budget DECIMAL(14, 2) DEFAULT 8000.00,
    status ENUM('active', 'frozen', 'closed') NOT NULL DEFAULT 'active',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_accounts_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT,
    CONSTRAINT chk_positive_balance CHECK (balance >= 0.00),
    CONSTRAINT chk_positive_limits CHECK (daily_transfer_limit >= 0.00 AND per_tx_limit >= 0.00),
    INDEX idx_account_ref (account_ref),
    INDEX idx_customer_id (customer_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Transactions Table
CREATE TABLE transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tx_ref VARCHAR(64) NOT NULL UNIQUE,
    source_account VARCHAR(32) NULL,
    destination_account VARCHAR(32) NULL,
    tx_type ENUM('deposit', 'withdrawal', 'transfer') NOT NULL,
    amount DECIMAL(14, 2) NOT NULL,
    status ENUM('completed', 'rejected', 'flagged') NOT NULL DEFAULT 'completed',
    description VARCHAR(255) NOT NULL,
    idempotency_key VARCHAR(128) UNIQUE NULL,
    rejection_reason VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_positive_amount CHECK (amount > 0.00),
    INDEX idx_source (source_account),
    INDEX idx_destination (destination_account),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Alerts Table
CREATE TABLE alerts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    alert_ref VARCHAR(32) NOT NULL UNIQUE,
    account_ref VARCHAR(32) NOT NULL,
    tx_ref VARCHAR(64) NULL,
    risk_score INT NOT NULL,
    severity ENUM('low', 'medium', 'high', 'critical') NOT NULL,
    rule_code VARCHAR(64) NOT NULL,
    explanation TEXT NOT NULL,
    evidence JSON NULL,
    status ENUM('open', 'investigating', 'resolved', 'false_positive') NOT NULL DEFAULT 'open',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_alert_account (account_ref),
    INDEX idx_alert_severity (severity),
    INDEX idx_alert_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Audit Logs Table
CREATE TABLE audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    actor VARCHAR(100) NOT NULL,
    action VARCHAR(64) NOT NULL,
    target_account VARCHAR(32) NULL,
    details JSON NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_actor (actor),
    INDEX idx_audit_target (target_account),
    INDEX idx_audit_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Investigation Cases Table
CREATE TABLE investigation_cases (
    id INT AUTO_INCREMENT PRIMARY KEY,
    case_ref VARCHAR(32) NOT NULL UNIQUE,
    target_account VARCHAR(32) NOT NULL,
    title VARCHAR(200) NOT NULL,
    status ENUM('open', 'investigating', 'resolved', 'false_positive') NOT NULL DEFAULT 'open',
    notes TEXT NULL,
    assigned_analyst VARCHAR(100) DEFAULT 'Lead Fraud Analyst',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_case_account (target_account),
    INDEX idx_case_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
