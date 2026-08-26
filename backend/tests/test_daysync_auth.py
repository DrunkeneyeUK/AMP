"""DaySync multi-tenant auth + isolation tests."""
import os
import uuid
import io
import pytest
import requests

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "https://gpt-cross-platform.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


def _rand(prefix):
    return f"TEST_{prefix}_{uuid.uuid4().hex[:8]}"


@pytest.fixture(scope="module")
def companies():
    """Create two companies (A & B) with admin + employee each."""
    data = {}
    for label in ("A", "B"):
        cname = _rand(f"co{label}")
        aemail = f"{_rand('admin').lower()}@example.com"
        r = requests.post(f"{API}/auth/register-company", json={
            "company_name": cname,
            "admin_email": aemail,
            "admin_password": "Password123!",
            "admin_name": f"Admin {label}",
            "visibility_mode": "shared" if label == "A" else "private",
        }, timeout=30)
        assert r.status_code == 200, r.text
        j = r.json()
        assert "access_token" in j and "invite_code" in j
        assert j["user"]["role"] == "admin"
        assert "_id" not in j["user"]
        admin_token = j["access_token"]
        invite = j["invite_code"]

        # Employee
        eemail = f"{_rand('emp').lower()}@example.com"
        r2 = requests.post(f"{API}/auth/join", json={
            "invite_code": invite,
            "email": eemail,
            "password": "Password123!",
            "name": f"Emp {label}",
        }, timeout=30)
        assert r2.status_code == 200, r2.text
        j2 = r2.json()
        assert j2["user"]["role"] == "employee"
        emp_token = j2["access_token"]

        data[label] = {
            "admin_email": aemail, "admin_token": admin_token,
            "emp_email": eemail, "emp_token": emp_token,
            "invite": invite, "company_id": j["user"]["company_id"],
            "admin_id": j["user"]["id"], "emp_id": j2["user"]["id"],
            "visibility": "shared" if label == "A" else "private",
        }
    return data


def H(tok):
    return {"Authorization": f"Bearer {tok}"}


# --- Auth basics ---
def test_join_invalid_invite():
    r = requests.post(f"{API}/auth/join", json={
        "invite_code": "BADCODE9",
        "email": f"{_rand('x').lower()}@example.com",
        "password": "Password123!",
        "name": "X",
    }, timeout=30)
    assert r.status_code == 400


def test_login_wrong_password(companies):
    r = requests.post(f"{API}/auth/login", json={
        "email": companies["A"]["admin_email"],
        "password": "wrong",
    }, timeout=30)
    assert r.status_code == 401


def test_login_success(companies):
    r = requests.post(f"{API}/auth/login", json={
        "email": companies["A"]["admin_email"],
        "password": "Password123!",
    }, timeout=30)
    assert r.status_code == 200
    j = r.json()
    assert j["user"]["role"] == "admin"
    assert "_id" not in j["user"]


def test_me_requires_token():
    r = requests.get(f"{API}/auth/me", timeout=30)
    assert r.status_code == 401


def test_me_invalid_token():
    r = requests.get(f"{API}/auth/me", headers={"Authorization": "Bearer nope"}, timeout=30)
    assert r.status_code == 401


def test_me_returns_user_with_company(companies):
    r = requests.get(f"{API}/auth/me", headers=H(companies["A"]["admin_token"]), timeout=30)
    assert r.status_code == 200
    j = r.json()
    assert j["email"] == companies["A"]["admin_email"]
    assert j["company"] and j["company"]["id"] == companies["A"]["company_id"]
    assert "_id" not in j


# --- Company admin-only endpoints ---
def test_patch_company_admin(companies):
    r = requests.patch(f"{API}/company",
                       json={"brand_color": "#123456"},
                       headers=H(companies["A"]["admin_token"]), timeout=30)
    assert r.status_code == 200
    assert r.json()["brand_color"] == "#123456"


def test_patch_company_employee_forbidden(companies):
    r = requests.patch(f"{API}/company",
                       json={"brand_color": "#000000"},
                       headers=H(companies["A"]["emp_token"]), timeout=30)
    assert r.status_code == 403


def test_rotate_invite_admin(companies):
    old = companies["A"]["invite"]
    r = requests.post(f"{API}/company/rotate-invite",
                      headers=H(companies["A"]["admin_token"]), timeout=30)
    assert r.status_code == 200
    new = r.json()["invite_code"]
    assert new and new != old
    # Old code should no longer work
    r2 = requests.post(f"{API}/auth/join", json={
        "invite_code": old,
        "email": f"{_rand('e').lower()}@example.com",
        "password": "Password123!",
        "name": "Late",
    }, timeout=30)
    assert r2.status_code == 400
    companies["A"]["invite"] = new


def test_rotate_invite_employee_forbidden(companies):
    r = requests.post(f"{API}/company/rotate-invite",
                      headers=H(companies["A"]["emp_token"]), timeout=30)
    assert r.status_code == 403


# --- Logo upload + file serve ---
def _tiny_png():
    # 1x1 red PNG
    import base64
    return base64.b64decode(
        b"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg=="
    )


def test_logo_upload_admin_and_serve(companies):
    files = {"file": ("logo.png", _tiny_png(), "image/png")}
    r = requests.post(f"{API}/company/logo",
                      headers=H(companies["A"]["admin_token"]),
                      files=files, timeout=60)
    if r.status_code == 402:
        pytest.skip("Storage credits exhausted")
    assert r.status_code == 200, r.text
    url = r.json()["logo_url"]
    assert url.startswith("http") and "/api/files/" in url
    # Serve
    r2 = requests.get(url, timeout=30)
    assert r2.status_code == 200
    assert r2.headers.get("content-type", "").startswith("image/")


def test_logo_upload_employee_forbidden(companies):
    files = {"file": ("logo.png", _tiny_png(), "image/png")}
    r = requests.post(f"{API}/company/logo",
                      headers=H(companies["A"]["emp_token"]),
                      files=files, timeout=30)
    assert r.status_code == 403


# --- Users list scoped to company ---
def test_list_users_scoped(companies):
    r = requests.get(f"{API}/users", headers=H(companies["A"]["admin_token"]), timeout=30)
    assert r.status_code == 200
    users = r.json()
    ids = {u["id"] for u in users}
    assert companies["A"]["admin_id"] in ids
    assert companies["A"]["emp_id"] in ids
    assert companies["B"]["admin_id"] not in ids
    for u in users:
        assert "_id" not in u
        assert "password_hash" not in u


def test_patch_users_me(companies):
    r = requests.patch(f"{API}/users/me",
                       json={"color": "#ABCDEF", "name": "New Name"},
                       headers=H(companies["A"]["emp_token"]), timeout=30)
    assert r.status_code == 200
    j = r.json()
    assert j["color"] == "#ABCDEF"
    assert j["name"] == "New Name"
    assert "_id" not in j


# --- Multi-tenant isolation for events ---
@pytest.fixture(scope="module")
def event_A(companies):
    r = requests.post(f"{API}/events", json={
        "title": "TEST_evt_A", "start": "2026-02-01T10:00:00", "end": "2026-02-01T11:00:00",
        "category": "work", "color": "#FF0000",
    }, headers=H(companies["A"]["admin_token"]), timeout=30)
    assert r.status_code == 200
    return r.json()


def test_event_isolation_get(companies, event_A):
    # Company B cannot GET company A's event
    r = requests.get(f"{API}/events/{event_A['id']}",
                     headers=H(companies["B"]["admin_token"]), timeout=30)
    assert r.status_code == 404


def test_event_isolation_patch(companies, event_A):
    r = requests.patch(f"{API}/events/{event_A['id']}",
                       json={"title": "hax"},
                       headers=H(companies["B"]["admin_token"]), timeout=30)
    assert r.status_code == 404


def test_event_isolation_delete(companies, event_A):
    r = requests.delete(f"{API}/events/{event_A['id']}",
                        headers=H(companies["B"]["admin_token"]), timeout=30)
    assert r.status_code == 404


def test_event_isolation_list(companies, event_A):
    r = requests.get(f"{API}/events", headers=H(companies["B"]["admin_token"]), timeout=30)
    assert r.status_code == 200
    for e in r.json():
        assert e["id"] != event_A["id"]


# --- Visibility mode ---
def test_shared_visibility_employee_sees_admin_events(companies, event_A):
    # Company A is shared. Employee should see admin's event.
    r = requests.get(f"{API}/events", headers=H(companies["A"]["emp_token"]), timeout=30)
    assert r.status_code == 200
    ids = {e["id"] for e in r.json()}
    assert event_A["id"] in ids


def test_private_visibility_employee_only_own(companies):
    # Company B is private. Admin creates event, employee should NOT see it.
    r = requests.post(f"{API}/events", json={
        "title": "TEST_priv_admin", "start": "2026-02-02T10:00:00", "end": "2026-02-02T11:00:00",
    }, headers=H(companies["B"]["admin_token"]), timeout=30)
    assert r.status_code == 200
    admin_event_id = r.json()["id"]

    # Employee lists — should NOT include admin's event
    r2 = requests.get(f"{API}/events", headers=H(companies["B"]["emp_token"]), timeout=30)
    assert r2.status_code == 200
    ids = {e["id"] for e in r2.json()}
    assert admin_event_id not in ids

    # Admin sees all
    r3 = requests.get(f"{API}/events", headers=H(companies["B"]["admin_token"]), timeout=30)
    assert r3.status_code == 200
    ids3 = {e["id"] for e in r3.json()}
    assert admin_event_id in ids3


# --- Basic tasks CRUD ---
def test_tasks_crud(companies):
    tok = companies["A"]["admin_token"]
    r = requests.post(f"{API}/tasks", json={
        "title": "TEST_task", "priority": "high", "status": "todo",
    }, headers=H(tok), timeout=30)
    assert r.status_code == 200
    tid = r.json()["id"]

    r2 = requests.get(f"{API}/tasks/{tid}", headers=H(tok), timeout=30)
    assert r2.status_code == 200
    assert r2.json()["title"] == "TEST_task"

    r3 = requests.patch(f"{API}/tasks/{tid}", json={"status": "done"},
                        headers=H(tok), timeout=30)
    assert r3.status_code == 200
    assert r3.json()["status"] == "done"

    r4 = requests.delete(f"{API}/tasks/{tid}", headers=H(tok), timeout=30)
    assert r4.status_code == 200

    r5 = requests.get(f"{API}/tasks/{tid}", headers=H(tok), timeout=30)
    assert r5.status_code == 404
