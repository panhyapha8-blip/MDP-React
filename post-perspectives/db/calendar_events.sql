-- calendar_events.sql
-- តារាងសម្រាប់រក្សាទុកព្រឹត្តិការណ៍ផ្ទាល់ខ្លួនរបស់អ្នកប្រើ

CREATE TABLE IF NOT EXISTS calendar_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    owner_email VARCHAR(255) NOT NULL,
    event_date DATE NOT NULL,
    title VARCHAR(255) NOT NULL,
    note VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
