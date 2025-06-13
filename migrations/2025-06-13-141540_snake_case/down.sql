-- This file should undo anything in `up.sql`
alter table accounts rename column user_id to userId;
alter table accounts rename column provider_account_id to providerAccountId;
alter table post_versions rename column user_id to userId;
alter table posts rename column user_id to userId;
