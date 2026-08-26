"""DaySync category CRUD tests (feature: admin manage event category types)."""
import os
import time
import uuid
import pytest
import requests

BASE_URL = os.environ['EXPO_PUBLIC_BACKEND_URL'].rstrip('/')
API = f"{BASE_URL}/api"


def H(tok: str) -> dict:
    return {"Authorization": f"Bearer {tok}", "Content-Type": "application/json"}


@pytest.fixture(scope="module")
def actors():
    """Create a fresh company + admin + employee for this suite."""
    ts = int(time.time() * 1000)
    aemail = f"admin_cat_{ts}@acme.co"
    r = requests.post(f"{API}/auth/register-company", json={
        "company_name": f"TEST_CatCo_{ts}",
        "admin_email": aemail,
        "admin_password": "Password123!",
        "admin_name": "Cat Admin",
        "visibility_mode": "shared",
    }, timeout=30)
    assert r.status_code == 200, r.text
    j = r.json()
    admin_token = j["access_token"]
    invite = j["invite_code"]

    eemail = f"emp_cat_{ts}@acme.co"
    r2 = requests.post(f"{API}/auth/join", json={
        "invite_code": invite,
        "email": eemail,
        "password": "Password123!",
        "name": "Cat Employee",
    }, timeout=30)
    assert r2.status_code == 200, r2.text
    emp_token = r2.json()["access_token"]

    return {"admin": admin_token, "emp": emp_token, "company_id": j["user"]["company_id"]}


# ---- Defaults ----
def test_default_categories_on_fresh_company(actors):
    r = requests.get(f"{API}/company/categories", headers=H(actors["admin"]), timeout=30)
    assert r.status_code == 200, r.text
    cats = r.json()
    assert isinstance(cats, list)
    keys = [c["key"] for c in cats]
    assert keys == ["work", "meeting", "deadline", "personal", "focus"]
    for c in cats:
        assert set(c.keys()) >= {"key", "label", "color", "bg"}
        assert c["color"].startswith("#")
        assert c["bg"].startswith("#")


def test_me_and_company_include_categories(actors):
    r = requests.get(f"{API}/auth/me", headers=H(actors["admin"]), timeout=30)
    assert r.status_code == 200
    data = r.json()
    assert "company" in data and "categories" in data["company"]
    assert len(data["company"]["categories"]) == 5

    r2 = requests.get(f"{API}/company", headers=H(actors["admin"]), timeout=30)
    assert r2.status_code == 200
    assert len(r2.json()["categories"]) == 5


# ---- Employee read access ----
def test_employee_can_list_categories(actors):
    r = requests.get(f"{API}/company/categories", headers=H(actors["emp"]), timeout=30)
    assert r.status_code == 200
    assert len(r.json()) >= 5


# ---- Create ----
def test_admin_creates_category_generates_key_and_bg(actors):
    r = requests.post(
        f"{API}/company/categories",
        json={"label": "Client Call", "color": "#8E44AD"},
        headers=H(actors["admin"]), timeout=30,
    )
    assert r.status_code == 200, r.text
    c = r.json()
    assert c["label"] == "Client Call"
    assert c["color"] == "#8E44AD"
    assert c["key"] == "client-call"  # slug
    assert c["bg"].startswith("#") and c["bg"] != c["color"]  # auto-tinted

    # GET verify persistence
    r2 = requests.get(f"{API}/company/categories", headers=H(actors["admin"]), timeout=30)
    keys = [x["key"] for x in r2.json()]
    assert "client-call" in keys


def test_create_dedupes_key_slug(actors):
    # Second "Client Call" should become "client-call-2"
    r = requests.post(
        f"{API}/company/categories",
        json={"label": "Client Call", "color": "#111111"},
        headers=H(actors["admin"]), timeout=30,
    )
    assert r.status_code == 200
    assert r.json()["key"] == "client-call-2"


# ---- Employee forbidden ----
def test_employee_cannot_create_category(actors):
    r = requests.post(
        f"{API}/company/categories",
        json={"label": "Nope", "color": "#000000"},
        headers=H(actors["emp"]), timeout=30,
    )
    assert r.status_code == 403


def test_employee_cannot_update_category(actors):
    r = requests.patch(
        f"{API}/company/categories/work",
        json={"label": "Not allowed"},
        headers=H(actors["emp"]), timeout=30,
    )
    assert r.status_code == 403


def test_employee_cannot_delete_category(actors):
    r = requests.delete(
        f"{API}/company/categories/work",
        headers=H(actors["emp"]), timeout=30,
    )
    assert r.status_code == 403


# ---- Update ----
def test_admin_updates_category_label_and_color(actors):
    r = requests.patch(
        f"{API}/company/categories/work",
        json={"label": "Deep Work", "color": "#00AAFF"},
        headers=H(actors["admin"]), timeout=30,
    )
    assert r.status_code == 200
    d = r.json()
    assert d["label"] == "Deep Work"
    assert d["color"] == "#00AAFF"
    # bg auto-refreshed on color change
    assert d["bg"].startswith("#") and d["bg"].lower() != "#00aaff"

    # verify persisted
    r2 = requests.get(f"{API}/company/categories", headers=H(actors["admin"]), timeout=30)
    work = next(c for c in r2.json() if c["key"] == "work")
    assert work["label"] == "Deep Work"
    assert work["color"] == "#00AAFF"


def test_update_missing_category(actors):
    r = requests.patch(
        f"{API}/company/categories/does-not-exist",
        json={"label": "x"},
        headers=H(actors["admin"]), timeout=30,
    )
    assert r.status_code == 404


# ---- Delete ----
def test_admin_deletes_category(actors):
    # delete the one we created earlier (client-call)
    r = requests.delete(
        f"{API}/company/categories/client-call",
        headers=H(actors["admin"]), timeout=30,
    )
    assert r.status_code == 200

    r2 = requests.get(f"{API}/company/categories", headers=H(actors["admin"]), timeout=30)
    keys = [c["key"] for c in r2.json()]
    assert "client-call" not in keys


def test_delete_missing_category(actors):
    r = requests.delete(
        f"{API}/company/categories/never-existed",
        headers=H(actors["admin"]), timeout=30,
    )
    assert r.status_code == 404


def test_cannot_delete_last_remaining_category():
    """Fresh company: delete all but one, then final delete must return 400."""
    ts = int(time.time() * 1000)
    r = requests.post(f"{API}/auth/register-company", json={
        "company_name": f"TEST_LastCat_{ts}",
        "admin_email": f"last_{ts}@acme.co",
        "admin_password": "Password123!",
        "admin_name": "Last Admin",
    }, timeout=30)
    assert r.status_code == 200
    tok = r.json()["access_token"]

    cats = requests.get(f"{API}/company/categories", headers=H(tok), timeout=30).json()
    # delete N-1 to leave exactly one
    for c in cats[:-1]:
        d = requests.delete(f"{API}/company/categories/{c['key']}", headers=H(tok), timeout=30)
        assert d.status_code == 200, d.text

    remaining = requests.get(f"{API}/company/categories", headers=H(tok), timeout=30).json()
    assert len(remaining) == 1
    last_key = remaining[0]["key"]

    r_bad = requests.delete(f"{API}/company/categories/{last_key}", headers=H(tok), timeout=30)
    assert r_bad.status_code == 400, r_bad.text
    assert "at least one" in r_bad.json()["detail"].lower()


# ---- Regression: existing endpoints still work ----
def test_regression_events_task_still_work(actors):
    tok = actors["admin"]
    # create event
    e = requests.post(f"{API}/events", json={
        "title": "TEST_CatRegEvt",
        "start": "2026-03-01T10:00:00",
        "end": "2026-03-01T11:00:00",
        "category": "meeting",
    }, headers=H(tok), timeout=30)
    assert e.status_code == 200
    eid = e.json()["id"]
    g = requests.get(f"{API}/events/{eid}", headers=H(tok), timeout=30)
    assert g.status_code == 200
    requests.delete(f"{API}/events/{eid}", headers=H(tok), timeout=30)

    # create task
    t = requests.post(f"{API}/tasks", json={
        "title": "TEST_CatRegTask",
        "due_date": "2026-03-02T09:00:00",
    }, headers=H(tok), timeout=30)
    assert t.status_code == 200
    requests.delete(f"{API}/tasks/{t.json()['id']}", headers=H(tok), timeout=30)


def test_regression_users_list(actors):
    r = requests.get(f"{API}/users", headers=H(actors["admin"]), timeout=30)
    assert r.status_code == 200
    arr = r.json()
    assert len(arr) >= 2  # admin + employee
    for u in arr:
        assert "password_hash" not in u
        assert "_id" not in u
