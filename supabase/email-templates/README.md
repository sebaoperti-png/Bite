# Bite auth emails

Templates for Supabase Authentication > Emails (Confirm sign up, Reset password). English and German in one file, chosen by the user's `lang` metadata (set by the app at sign-up and sign-in). Edit `build.py`, run `python3 build.py`, paste the HTML in Supabase. Keep the subject plain text: Supabase falls back to its default email if the subject contains `{{ if }}`.
