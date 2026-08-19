-- add_message_image.sql
-- បន្ថែមលទ្ធភាពផ្ញើរូបភាពក្នុងសារ

ALTER TABLE messages ADD COLUMN image_url VARCHAR(500) NULL;
ALTER TABLE messages MODIFY message_text VARCHAR(1000) NULL;
