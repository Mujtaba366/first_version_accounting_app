from django.urls import path
from . import views

urlpatterns = [
    path("name", views.get_name, name="get_name"),
    path("supabase/status", views.supabase_status, name="supabase_status"),
    path("auth/session", views.auth_status, name="auth_session"),
    path("auth/signup", views.signup, name="signup"),
    path("auth/login", views.login, name="login"),
    path("auth/logout", views.logout, name="logout"),
    path("accounts", views.accounts_collection, name="accounts_collection"),
    path("accounts/<str:account_id>", views.account_item, name="account_item"),
    path("transactions", views.transactions_collection, name="transactions_collection"),
    path("transactions/<str:transaction_id>", views.transaction_item, name="transaction_item"),
    path("entries", views.entries_collection, name="entries_collection"),
    path("entries/<str:entry_id>", views.entry_item, name="entry_item"),
]
