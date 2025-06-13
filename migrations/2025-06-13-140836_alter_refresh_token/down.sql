-- This file should undo anything in `up.sql`
alter table refresh_tokens rename column user_id to userId;
alter table reset_tokens rename column user_id to userId;
alter table email_verification_tokens rename column user_id to userId;
