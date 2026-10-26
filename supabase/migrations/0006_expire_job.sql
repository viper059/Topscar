-- Daily job: listings past their 60 days become "expired" (2026-10-26)
-- Runs at 00:00 Bangkok time (17:00 UTC). Expired listings disappear from public pages;
-- the seller can re-list them from "บัญชีของฉัน".
create extension if not exists pg_cron with schema pg_catalog;

select cron.schedule('expire-listings', '0 17 * * *', $$select public.expire_listings()$$);

-- See the job and its recent runs:
--   select * from cron.job;
--   select * from cron.job_run_details order by start_time desc limit 10;
