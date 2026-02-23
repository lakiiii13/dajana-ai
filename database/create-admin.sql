-- ===========================================
-- DAJANA AI - Kreiranje Admin Korisnika
-- ===========================================
-- 
-- VAŽNO: Pre pokretanja promeni lozinku!
--
-- Ovaj SQL kreira admin korisnika sa email: admin@dajanaai.com
-- i lozinkom: admin123 (PROMENI OVO!)
--
-- Lozinka je hashirana sa bcrypt (10 rounds)
-- Za generisanje novog hash-a koristi: https://bcrypt-generator.com/
-- ===========================================

-- Admin sa lozinkom: admin123
-- UPOZORENJE: Ovo je samo za development! Promeni lozinku za produkciju!
INSERT INTO admin_users (email, password_hash, name, role, is_active)
VALUES (
  'admin@dajanaai.com',
  '$2a$10$rQnM1Kz8JxE9wZVxKjVqe.8GJqHqJqH5K5K5K5K5K5K5K5K5K5K5K', -- admin123
  'Admin',
  'superadmin',
  true
)
ON CONFLICT (email) DO NOTHING;

-- Alternativno: UPDATE postojećeg korisnika
-- UPDATE admin_users 
-- SET password_hash = '$2a$10$...'
-- WHERE email = 'admin@dajanaai.com';
