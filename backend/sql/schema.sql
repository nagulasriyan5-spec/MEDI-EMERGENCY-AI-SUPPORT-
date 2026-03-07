CREATE DATABASE IF NOT EXISTS medirescue;
USE medirescue;

CREATE TABLE IF NOT EXISTS fingerprint_enrollments (
  hospital_id VARCHAR(64) PRIMARY KEY,
  enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS emergency_alerts (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  hospital_id INT NOT NULL,
  patient VARCHAR(120) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL,
  remaining_seconds INT NOT NULL,
  created_at_ms BIGINT NOT NULL,
  INDEX idx_emergency_hospital (hospital_id),
  INDEX idx_emergency_status (status),
  INDEX idx_emergency_created (created_at_ms)
);

CREATE TABLE IF NOT EXISTS report_referrals (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  hospital_id INT NOT NULL,
  hospital_name VARCHAR(160) NOT NULL,
  patient_name VARCHAR(120) NOT NULL,
  doctor_specialty VARCHAR(120) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  cause TEXT NOT NULL,
  summary TEXT NOT NULL,
  source VARCHAR(20) NOT NULL,
  report_excerpt TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_referral_hospital (hospital_id),
  INDEX idx_referral_created (created_at)
);
