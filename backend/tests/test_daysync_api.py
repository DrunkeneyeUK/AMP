"""DaySync backend API tests - events, tasks, agenda CRUD + filters"""
import os
import pytest
import requests
from datetime import datetime, timedelta

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', 'https://gpt-cross-platform.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# --- Health ---
def test_root(client):
    r = client.get(f"{API}/")
    assert r.status_code == 200
    assert r.json().get("status") == "ok"


# --- Events CRUD ---
class TestEvents:
    created_id = None

    def test_create_event(self, client):
        payload = {
            "title": "TEST_Event_1",
            "description": "test desc",
            "start": "2026-01-15T10:00:00",
            "end": "2026-01-15T11:00:00",
            "location": "Room A",
            "category": "meeting",
            "color": "#FF6B5C",
            "assignee": "Alice",
            "all_day": False,
        }
        r = client.post(f"{API}/events", json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["title"] == "TEST_Event_1"
        assert data["category"] == "meeting"
        assert "id" in data
        assert "_id" not in data
        TestEvents.created_id = data["id"]

    def test_list_events(self, client):
        r = client.get(f"{API}/events")
        assert r.status_code == 200
        arr = r.json()
        assert isinstance(arr, list)
        assert any(e["id"] == TestEvents.created_id for e in arr)
        for e in arr:
            assert "_id" not in e

    def test_get_event(self, client):
        r = client.get(f"{API}/events/{TestEvents.created_id}")
        assert r.status_code == 200
        assert r.json()["id"] == TestEvents.created_id

    def test_filter_events_range(self, client):
        r = client.get(f"{API}/events", params={
            "start_after": "2026-01-15T00:00:00",
            "start_before": "2026-01-15T23:59:59",
        })
        assert r.status_code == 200
        arr = r.json()
        assert any(e["id"] == TestEvents.created_id for e in arr)

    def test_patch_event(self, client):
        r = client.patch(f"{API}/events/{TestEvents.created_id}", json={"title": "TEST_Event_Updated"})
        assert r.status_code == 200
        assert r.json()["title"] == "TEST_Event_Updated"
        # verify persistence
        g = client.get(f"{API}/events/{TestEvents.created_id}")
        assert g.json()["title"] == "TEST_Event_Updated"

    def test_delete_event(self, client):
        r = client.delete(f"{API}/events/{TestEvents.created_id}")
        assert r.status_code == 200
        g = client.get(f"{API}/events/{TestEvents.created_id}")
        assert g.status_code == 404

    def test_get_nonexistent_event(self, client):
        r = client.get(f"{API}/events/nonexistent-id-xyz")
        assert r.status_code == 404


# --- Tasks CRUD ---
class TestTasks:
    created_id = None

    def test_create_task(self, client):
        payload = {
            "title": "TEST_Task_1",
            "description": "task desc",
            "due_date": "2026-01-16T09:00:00",
            "priority": "high",
            "status": "todo",
            "category": "work",
            "assignee": "Bob",
        }
        r = client.post(f"{API}/tasks", json=payload)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["title"] == "TEST_Task_1"
        assert d["priority"] == "high"
        assert "_id" not in d
        TestTasks.created_id = d["id"]

    def test_list_tasks(self, client):
        r = client.get(f"{API}/tasks")
        assert r.status_code == 200
        arr = r.json()
        assert any(t["id"] == TestTasks.created_id for t in arr)

    def test_get_task(self, client):
        r = client.get(f"{API}/tasks/{TestTasks.created_id}")
        assert r.status_code == 200
        assert r.json()["id"] == TestTasks.created_id

    def test_filter_tasks_status(self, client):
        r = client.get(f"{API}/tasks", params={"status": "todo"})
        assert r.status_code == 200
        for t in r.json():
            assert t["status"] == "todo"

    def test_filter_tasks_due_range(self, client):
        r = client.get(f"{API}/tasks", params={
            "due_after": "2026-01-16T00:00:00",
            "due_before": "2026-01-16T23:59:59",
        })
        assert r.status_code == 200
        assert any(t["id"] == TestTasks.created_id for t in r.json())

    def test_patch_task_status(self, client):
        r = client.patch(f"{API}/tasks/{TestTasks.created_id}", json={"status": "in_progress"})
        assert r.status_code == 200
        assert r.json()["status"] == "in_progress"
        g = client.get(f"{API}/tasks/{TestTasks.created_id}")
        assert g.json()["status"] == "in_progress"

    def test_delete_task(self, client):
        r = client.delete(f"{API}/tasks/{TestTasks.created_id}")
        assert r.status_code == 200
        g = client.get(f"{API}/tasks/{TestTasks.created_id}")
        assert g.status_code == 404

    def test_get_nonexistent_task(self, client):
        r = client.get(f"{API}/tasks/does-not-exist")
        assert r.status_code == 404


# --- Agenda ---
class TestAgenda:
    def test_agenda_returns_events_and_tasks(self, client):
        # Create event + task for a specific date
        date = "2026-02-01"
        e = client.post(f"{API}/events", json={
            "title": "TEST_Agenda_Event",
            "start": f"{date}T10:00:00",
            "end": f"{date}T11:00:00",
        }).json()
        t = client.post(f"{API}/tasks", json={
            "title": "TEST_Agenda_Task",
            "due_date": f"{date}T09:00:00",
        }).json()

        r = client.get(f"{API}/agenda", params={"date": date})
        assert r.status_code == 200
        data = r.json()
        assert "events" in data and "tasks" in data
        assert any(x["id"] == e["id"] for x in data["events"])
        assert any(x["id"] == t["id"] for x in data["tasks"])
        # verify no _id
        for x in data["events"] + data["tasks"]:
            assert "_id" not in x

        # cleanup
        client.delete(f"{API}/events/{e['id']}")
        client.delete(f"{API}/tasks/{t['id']}")

    def test_agenda_empty_day(self, client):
        r = client.get(f"{API}/agenda", params={"date": "2030-12-31"})
        assert r.status_code == 200
        d = r.json()
        assert d["events"] == [] and d["tasks"] == []

    def test_agenda_missing_date(self, client):
        r = client.get(f"{API}/agenda")
        assert r.status_code == 422
