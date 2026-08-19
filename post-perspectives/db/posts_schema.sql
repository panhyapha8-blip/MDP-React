-- posts_schema.sql
-- Table for storing user-created "Perspective" posts
-- (photo + slogan + short bio/description)

CREATE TABLE IF NOT EXISTS posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    author_name VARCHAR(255) NOT NULL,
    slogan VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Sample row (optional, for testing)
-- INSERT INTO posts (author_name, slogan, description, image_url)
-- VALUES ('Sokha', 'Dream big, code bigger.', 'Year 2 CS student who loves React and MLBB.', '/uploads/sample.jpg');
