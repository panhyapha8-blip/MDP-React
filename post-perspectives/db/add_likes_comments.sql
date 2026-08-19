-- add_likes_comments.sql
-- បន្ថែមមុខងារ Like និង Comment សម្រាប់ Post

-- បន្ថែមជួរឈរ likes ទៅតារាង posts ដែលមានស្រាប់
ALTER TABLE posts ADD COLUMN likes INT NOT NULL DEFAULT 0;

-- បង្កើតតារាងថ្មីសម្រាប់រក្សាទុក Comment
CREATE TABLE IF NOT EXISTS comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    commenter_name VARCHAR(255) NOT NULL,
    comment_text VARCHAR(500) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);
