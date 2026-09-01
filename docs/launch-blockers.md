# Nokta launch blockers

## P0 - blocks beta launch

- None known from the local code audit.

## P1 - serious before public launch

- Production email delivery depends on a verified Resend sender domain.
- Production URL configuration must be switched fully to the final Nokta domain before indexing.
- Stripe test/live mode separation should be smoke-tested after every billing function deploy.
- Run `supabase/sprint-41-owner-onboarding.sql` before testing persisted owner onboarding tasks in production.

## P2 - important post-beta

- Split the main client bundle if load performance becomes a launch issue.
- Add automated route smoke tests for public, owner and admin paths.
- Expand venue data review beyond required fields into opening-hours accuracy.

## P3 - polish

- Add a final Open Graph image once the visual identity is locked.
- Consider richer empty states after beta feedback.
