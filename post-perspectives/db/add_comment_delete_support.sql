-- add_comment_delete_support.sql
-- បន្ថែមការតាមដានម្ចាស់ Post និងអ្នកសរសេរមតិយោបល់
-- ដើម្បីអនុញ្ញាតឲ្យលុបមតិយោបល់បាន (ទាំងម្ចាស់ Post និងអ្នកសរសេរផ្ទាល់)

ALTER TABLE posts ADD COLUMN owner_email VARCHAR(255) NULL;
ALTER TABLE engagement_comments ADD COLUMN commenter_email VARCHAR(255) NULL;
