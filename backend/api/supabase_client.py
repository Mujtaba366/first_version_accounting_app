from django.conf import settings
from supabase import Client, create_client


def get_supabase_client() -> Client:
    """Return a configured Supabase client from Django settings."""
    url = settings.SUPABASE_URL
    key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY

    if not url or not key:
        raise RuntimeError(
            "Missing Supabase configuration. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY "
            "(or SUPABASE_ANON_KEY) in environment variables."
        )

    return create_client(url, key)
