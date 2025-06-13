-- Your SQL goes here
alter table refresh_tokens rename column userId to user_id;
alter table reset_tokens rename column userId to user_id;
alter table email_verification_tokens rename column userId to user_id;