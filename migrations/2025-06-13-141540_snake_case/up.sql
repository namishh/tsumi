-- Your SQL goes here
alter table accounts rename column userId to user_id;
alter table accounts rename column providerAccountId to provider_account_id;
alter table post_versions rename column userId to user_id;
alter table posts rename column userId to user_id;