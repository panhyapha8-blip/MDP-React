-- engagement_generic.sql
-- ប្រព័ន្ធ Like/Comment ទូទៅ សម្រាប់ទាំងកាតវិទ្យាសាស្ត្រ (static data)
-- និង User Post (Database record)

CREATE TABLE IF NOT EXISTS engagement_likes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    target_type VARCHAR(20) NOT NULL,   -- 'scientist' ឬ 'post'
    target_id VARCHAR(50) NOT NULL,     -- id របស់ scientist ឬ post
    likes INT NOT NULL DEFAULT 0,
    UNIQUE KEY uniq_target (target_type, target_id)
);

CREATE TABLE IF NOT EXISTS engagement_comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    target_type VARCHAR(20) NOT NULL,
    target_id VARCHAR(50) NOT NULL,
    commenter_name VARCHAR(255) NOT NULL,
    comment_text VARCHAR(500) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ចំណាំ: ជួរឈរ posts.likes និងតារាង comments ចាស់ (ភ្ជាប់តែនឹង Post)
-- លែងប្រើទៀតហើយ ព្រោះឥឡូវប្រើតារាងទូទៅខាងលើជំនួសវិញ
