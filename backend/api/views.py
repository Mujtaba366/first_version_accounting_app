import json
from decimal import Decimal, InvalidOperation

from django.http import JsonResponse
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt

from .supabase_client import get_supabase_client

def get_name(request):
    return JsonResponse({"name": "hello world"})

def supabase_status(request):
    try:
        client = get_supabase_client()
    except RuntimeError as exc:
        return JsonResponse({"connected": False, "error": str(exc)}, status=500)

    data = {
        "connected": True,
        "project_url": settings.SUPABASE_URL,
        "using_key": "service_role" if settings.SUPABASE_SERVICE_ROLE_KEY else "anon",
    }

    # Optional lightweight check against a table name provided in env.
    if settings.SUPABASE_TEST_TABLE:
        try:
            response = (
                client.table(settings.SUPABASE_TEST_TABLE)
                .select("*", count="exact")
                .limit(1)
                .execute()
            )
            data["table_check"] = {
                "table": settings.SUPABASE_TEST_TABLE,
                "ok": True,
                "sample_rows": len(response.data or []),
                "total_count": response.count,
            }
        except Exception as exc:  # pragma: no cover - network/runtime dependent
            data["table_check"] = {
                "table": settings.SUPABASE_TEST_TABLE,
                "ok": False,
                "error": str(exc),
            }

    return JsonResponse(data)

def _parse_auth_payload(request):
    try:
        payload = json.loads(request.body.decode("utf-8") or "{}")
    except (json.JSONDecodeError, UnicodeDecodeError):
        return None, JsonResponse({"error": "invalid json body"}, status=400)

    gmail = payload.get("gmail")
    password = payload.get("password")

    if not gmail or not isinstance(gmail, str):
        return None, JsonResponse({"error": "gmail is required"}, status=400)
    if not password or not isinstance(password, str):
        return None, JsonResponse({"error": "password is required"}, status=400)

    return {"email": gmail.strip(), "password": password}, None

def _normalize_auth_error(exc):
    text = str(exc).lower()

    if "already" in text and ("user" in text or "email" in text or "registered" in text):
        return "gmail already used"
    if "weak" in text or "password" in text and ("least" in text or "length" in text or "short" in text):
        return "password weak"
    if "invalid login" in text or "invalid credentials" in text or "email not confirmed" in text:
        return "invalid gmail or password"

    return str(exc)

def _extract_user_id_from_auth_response(auth_response):
    """Extract Supabase auth user id from different response shapes."""
    if not auth_response:
        return None

    user = getattr(auth_response, "user", None)
    if user is not None:
        user_id = getattr(user, "id", None)
        if user_id:
            return str(user_id)

    session = getattr(auth_response, "session", None)
    if session is not None:
        session_user = getattr(session, "user", None)
        if session_user is not None:
            user_id = getattr(session_user, "id", None)
            if user_id:
                return str(user_id)

    if isinstance(auth_response, dict):
        user = auth_response.get("user")
        if isinstance(user, dict) and user.get("id"):
            return str(user["id"])

        session = auth_response.get("session")
        if isinstance(session, dict):
            session_user = session.get("user")
            if isinstance(session_user, dict) and session_user.get("id"):
                return str(session_user["id"])

    return None

def _set_auth_session(request, email, user_id=None):
    request.session.cycle_key()
    request.session["app_authenticated"] = True
    request.session["auth_email"] = email
    if user_id:
        request.session["auth_user_id"] = str(user_id)
    else:
        request.session.pop("auth_user_id", None)
    request.session.set_expiry(settings.SESSION_COOKIE_AGE)

def _is_auth_session_active(request):
    return bool(request.session.get("app_authenticated"))

@csrf_exempt
def auth_status(request):
    if request.method != "GET":
        return JsonResponse({"error": "method not allowed"}, status=405)

    return JsonResponse(
        {
            "authenticated": _is_auth_session_active(request),
            "email": request.session.get("auth_email"),
            "user_id": request.session.get("auth_user_id"),
        }
    )

@csrf_exempt
def logout(request):
    if request.method != "POST":
        return JsonResponse({"error": "method not allowed"}, status=405)

    request.session.flush()
    return JsonResponse({"logout": "ok"})

@csrf_exempt
def signup(request):
    if request.method != "POST":
        return JsonResponse({"error": "method not allowed"}, status=405)

    parsed, error_response = _parse_auth_payload(request)
    if error_response:
        return error_response

    try:
        client = get_supabase_client()
        auth_response = client.auth.sign_up(parsed)
        user_id = _extract_user_id_from_auth_response(auth_response)
        _set_auth_session(request, parsed["email"], user_id)
        return JsonResponse({"signup": "ok"})
    except Exception as exc:  # pragma: no cover - network/runtime dependent
        return JsonResponse({"signup": "error", "error": _normalize_auth_error(exc)}, status=400)

@csrf_exempt
def login(request):
    if request.method != "POST":
        return JsonResponse({"error": "method not allowed"}, status=405)

    parsed, error_response = _parse_auth_payload(request)
    if error_response:
        return error_response

    try:
        client = get_supabase_client()
        auth_response = client.auth.sign_in_with_password(parsed)
        user_id = _extract_user_id_from_auth_response(auth_response)
        _set_auth_session(request, parsed["email"], user_id)
        return JsonResponse({"login": "ok"})
    except Exception as exc:  # pragma: no cover - network/runtime dependent
        return JsonResponse({"login": "error", "error": _normalize_auth_error(exc)}, status=400)


ACCOUNT_TYPES = {"asset", "liability", "equity", "income", "expense"}
ENTRY_SIDES = {"debit", "credit"}


def _parse_json_body(request):
    try:
        return json.loads(request.body.decode("utf-8") or "{}"), None
    except (json.JSONDecodeError, UnicodeDecodeError):
        return None, JsonResponse({"error": "invalid json body"}, status=400)


def _first_row(response):
    rows = getattr(response, "data", None) or []
    if not rows:
        return None
    return rows[0]


def _validate_account_payload(payload, partial=False):
    errors = []
    cleaned = {}

    if not partial or "code" in payload:
        code = payload.get("code")
        if not code or not isinstance(code, str):
            errors.append("code is required")
        else:
            cleaned["code"] = code.strip()

    if not partial or "name" in payload:
        name = payload.get("name")
        if not name or not isinstance(name, str):
            errors.append("name is required")
        else:
            cleaned["name"] = name.strip()

    if not partial or "type" in payload:
        account_type = payload.get("type")
        if not account_type or not isinstance(account_type, str):
            errors.append("type is required")
        elif account_type not in ACCOUNT_TYPES:
            errors.append("type must be one of asset, liability, equity, income, expense")
        else:
            cleaned["type"] = account_type

    return cleaned, errors


def _validate_transaction_payload(payload, partial=False):
    errors = []
    cleaned = {}

    if "date" in payload:
        date = payload.get("date")
        if date is not None and not isinstance(date, str):
            errors.append("date must be a string in YYYY-MM-DD format")
        elif isinstance(date, str) and date.strip():
            cleaned["date"] = date.strip()

    if not partial or "memo" in payload:
        memo = payload.get("memo", "")
        if memo is None:
            memo = ""
        if not isinstance(memo, str):
            errors.append("memo must be a string")
        else:
            cleaned["memo"] = memo

    return cleaned, errors


def _validate_entries_payload(payload, partial=False):
    errors = []
    cleaned = {}

    if not partial or "transaction_id" in payload:
        transaction_id = payload.get("transaction_id")
        if not transaction_id or not isinstance(transaction_id, str):
            errors.append("transaction_id is required")
        else:
            cleaned["transaction_id"] = transaction_id

    if not partial or "account_id" in payload:
        account_id = payload.get("account_id")
        if not account_id or not isinstance(account_id, str):
            errors.append("account_id is required")
        else:
            cleaned["account_id"] = account_id

    if not partial or "amount" in payload:
        amount = payload.get("amount")
        if amount is None:
            errors.append("amount is required")
        else:
            try:
                amount_decimal = Decimal(str(amount))
                if amount_decimal <= 0:
                    errors.append("amount must be greater than 0")
                else:
                    cleaned["amount"] = str(amount_decimal)
            except (InvalidOperation, ValueError):
                errors.append("amount must be a valid number")

    if not partial or "side" in payload:
        side = payload.get("side")
        if not side or not isinstance(side, str):
            errors.append("side is required")
        elif side not in ENTRY_SIDES:
            errors.append("side must be debit or credit")
        else:
            cleaned["side"] = side

    return cleaned, errors


@csrf_exempt
def accounts_collection(request):
    if request.method not in {"GET", "POST"}:
        return JsonResponse({"error": "method not allowed"}, status=405)

    client = get_supabase_client()

    if request.method == "GET":
        response = client.table("accounts").select("*").order("code").execute()
        return JsonResponse({"accounts": response.data or []})

    payload, error_response = _parse_json_body(request)
    if error_response:
        return error_response

    cleaned, errors = _validate_account_payload(payload, partial=False)
    if errors:
        return JsonResponse({"error": "; ".join(errors)}, status=400)

    response = client.table("accounts").insert(cleaned).execute()
    created = _first_row(response)
    return JsonResponse({"account": created}, status=201)


@csrf_exempt
def account_item(request, account_id):
    if request.method not in {"GET", "PUT", "PATCH", "DELETE"}:
        return JsonResponse({"error": "method not allowed"}, status=405)

    client = get_supabase_client()

    if request.method == "GET":
        response = client.table("accounts").select("*").eq("id", account_id).limit(1).execute()
        account = _first_row(response)
        if not account:
            return JsonResponse({"error": "account not found"}, status=404)
        return JsonResponse({"account": account})

    if request.method in {"PUT", "PATCH"}:
        payload, error_response = _parse_json_body(request)
        if error_response:
            return error_response

        cleaned, errors = _validate_account_payload(payload, partial=(request.method == "PATCH"))
        if errors:
            return JsonResponse({"error": "; ".join(errors)}, status=400)
        if not cleaned:
            return JsonResponse({"error": "no updatable fields provided"}, status=400)

        response = client.table("accounts").update(cleaned).eq("id", account_id).execute()
        updated = _first_row(response)
        if not updated:
            return JsonResponse({"error": "account not found"}, status=404)
        return JsonResponse({"account": updated})

    response = client.table("accounts").delete().eq("id", account_id).execute()
    deleted = _first_row(response)
    if not deleted:
        return JsonResponse({"error": "account not found"}, status=404)
    return JsonResponse({"deleted": True, "account": deleted})


@csrf_exempt
def transactions_collection(request):
    if request.method not in {"GET", "POST"}:
        return JsonResponse({"error": "method not allowed"}, status=405)

    client = get_supabase_client()

    if request.method == "GET":
        response = client.table("transactions").select("*").order("date", desc=True).execute()
        return JsonResponse({"transactions": response.data or []})

    payload, error_response = _parse_json_body(request)
    if error_response:
        return error_response

    cleaned, errors = _validate_transaction_payload(payload, partial=False)
    if errors:
        return JsonResponse({"error": "; ".join(errors)}, status=400)

    response = client.table("transactions").insert(cleaned).execute()
    created = _first_row(response)
    return JsonResponse({"transaction": created}, status=201)


@csrf_exempt
def transaction_item(request, transaction_id):
    if request.method not in {"GET", "PUT", "PATCH", "DELETE"}:
        return JsonResponse({"error": "method not allowed"}, status=405)

    client = get_supabase_client()

    if request.method == "GET":
        response = (
            client.table("transactions").select("*").eq("id", transaction_id).limit(1).execute()
        )
        transaction = _first_row(response)
        if not transaction:
            return JsonResponse({"error": "transaction not found"}, status=404)
        return JsonResponse({"transaction": transaction})

    if request.method in {"PUT", "PATCH"}:
        payload, error_response = _parse_json_body(request)
        if error_response:
            return error_response

        cleaned, errors = _validate_transaction_payload(payload, partial=(request.method == "PATCH"))
        if errors:
            return JsonResponse({"error": "; ".join(errors)}, status=400)
        if not cleaned:
            return JsonResponse({"error": "no updatable fields provided"}, status=400)

        response = client.table("transactions").update(cleaned).eq("id", transaction_id).execute()
        updated = _first_row(response)
        if not updated:
            return JsonResponse({"error": "transaction not found"}, status=404)
        return JsonResponse({"transaction": updated})

    response = client.table("transactions").delete().eq("id", transaction_id).execute()
    deleted = _first_row(response)
    if not deleted:
        return JsonResponse({"error": "transaction not found"}, status=404)
    return JsonResponse({"deleted": True, "transaction": deleted})


@csrf_exempt
def entries_collection(request):
    if request.method not in {"GET", "POST"}:
        return JsonResponse({"error": "method not allowed"}, status=405)

    client = get_supabase_client()

    if request.method == "GET":
        response = client.table("entries").select("*").order("created_at", desc=True).execute()
        return JsonResponse({"entries": response.data or []})

    payload, error_response = _parse_json_body(request)
    if error_response:
        return error_response

    cleaned, errors = _validate_entries_payload(payload, partial=False)
    if errors:
        return JsonResponse({"error": "; ".join(errors)}, status=400)

    response = client.table("entries").insert(cleaned).execute()
    created = _first_row(response)
    return JsonResponse({"entry": created}, status=201)


@csrf_exempt
def entry_item(request, entry_id):
    if request.method not in {"GET", "PUT", "PATCH", "DELETE"}:
        return JsonResponse({"error": "method not allowed"}, status=405)

    client = get_supabase_client()

    if request.method == "GET":
        response = client.table("entries").select("*").eq("id", entry_id).limit(1).execute()
        entry = _first_row(response)
        if not entry:
            return JsonResponse({"error": "entry not found"}, status=404)
        return JsonResponse({"entry": entry})

    if request.method in {"PUT", "PATCH"}:
        payload, error_response = _parse_json_body(request)
        if error_response:
            return error_response

        cleaned, errors = _validate_entries_payload(payload, partial=(request.method == "PATCH"))
        if errors:
            return JsonResponse({"error": "; ".join(errors)}, status=400)
        if not cleaned:
            return JsonResponse({"error": "no updatable fields provided"}, status=400)

        response = client.table("entries").update(cleaned).eq("id", entry_id).execute()
        updated = _first_row(response)
        if not updated:
            return JsonResponse({"error": "entry not found"}, status=404)
        return JsonResponse({"entry": updated})

    response = client.table("entries").delete().eq("id", entry_id).execute()
    deleted = _first_row(response)
    if not deleted:
        return JsonResponse({"error": "entry not found"}, status=404)
    return JsonResponse({"deleted": True, "entry": deleted})

