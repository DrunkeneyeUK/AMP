from fastapi import FastAPI, APIRouter, HTTPException, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")


def utcnow_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# ==================== MODELS ====================

class EventBase(BaseModel):
    title: str
    description: Optional[str] = ""
    start: str  # ISO string
    end: str  # ISO string
    location: Optional[str] = ""
    category: str = "work"  # work | personal | meeting | deadline
    color: str = "#FF6B5C"
    assignee: Optional[str] = ""
    all_day: bool = False


class EventCreate(EventBase):
    pass


class Event(EventBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: str = Field(default_factory=utcnow_iso)
    updated_at: str = Field(default_factory=utcnow_iso)


class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    start: Optional[str] = None
    end: Optional[str] = None
    location: Optional[str] = None
    category: Optional[str] = None
    color: Optional[str] = None
    assignee: Optional[str] = None
    all_day: Optional[bool] = None


class TaskBase(BaseModel):
    title: str
    description: Optional[str] = ""
    due_date: Optional[str] = None  # ISO date
    priority: str = "medium"  # low | medium | high
    status: str = "todo"  # todo | in_progress | done
    category: str = "work"
    assignee: Optional[str] = ""


class TaskCreate(TaskBase):
    pass


class Task(TaskBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: str = Field(default_factory=utcnow_iso)
    updated_at: str = Field(default_factory=utcnow_iso)


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    category: Optional[str] = None
    assignee: Optional[str] = None


# ==================== ROUTES ====================

@api_router.get("/")
async def root():
    return {"message": "DaySync API", "status": "ok"}


# --- Events ---
@api_router.post("/events", response_model=Event)
async def create_event(payload: EventCreate):
    event = Event(**payload.dict())
    await db.events.insert_one(event.dict())
    return event


@api_router.get("/events", response_model=List[Event])
async def list_events(
    start_after: Optional[str] = Query(None),
    start_before: Optional[str] = Query(None),
):
    query: dict = {}
    if start_after or start_before:
        query["start"] = {}
        if start_after:
            query["start"]["$gte"] = start_after
        if start_before:
            query["start"]["$lte"] = start_before
    docs = await db.events.find(query, {"_id": 0}).sort("start", 1).to_list(1000)
    return [Event(**d) for d in docs]


@api_router.get("/events/{event_id}", response_model=Event)
async def get_event(event_id: str):
    doc = await db.events.find_one({"id": event_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Event not found")
    return Event(**doc)


@api_router.patch("/events/{event_id}", response_model=Event)
async def update_event(event_id: str, payload: EventUpdate):
    updates = {k: v for k, v in payload.dict().items() if v is not None}
    if not updates:
        doc = await db.events.find_one({"id": event_id}, {"_id": 0})
        if not doc:
            raise HTTPException(status_code=404, detail="Event not found")
        return Event(**doc)
    updates["updated_at"] = utcnow_iso()
    result = await db.events.update_one({"id": event_id}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    doc = await db.events.find_one({"id": event_id}, {"_id": 0})
    return Event(**doc)


@api_router.delete("/events/{event_id}")
async def delete_event(event_id: str):
    result = await db.events.delete_one({"id": event_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    return {"ok": True}


# --- Tasks ---
@api_router.post("/tasks", response_model=Task)
async def create_task(payload: TaskCreate):
    task = Task(**payload.dict())
    await db.tasks.insert_one(task.dict())
    return task


@api_router.get("/tasks", response_model=List[Task])
async def list_tasks(
    status: Optional[str] = Query(None),
    due_after: Optional[str] = Query(None),
    due_before: Optional[str] = Query(None),
):
    query: dict = {}
    if status:
        query["status"] = status
    if due_after or due_before:
        query["due_date"] = {}
        if due_after:
            query["due_date"]["$gte"] = due_after
        if due_before:
            query["due_date"]["$lte"] = due_before
    docs = await db.tasks.find(query, {"_id": 0}).sort("due_date", 1).to_list(1000)
    return [Task(**d) for d in docs]


@api_router.get("/tasks/{task_id}", response_model=Task)
async def get_task(task_id: str):
    doc = await db.tasks.find_one({"id": task_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Task not found")
    return Task(**doc)


@api_router.patch("/tasks/{task_id}", response_model=Task)
async def update_task(task_id: str, payload: TaskUpdate):
    updates = {k: v for k, v in payload.dict().items() if v is not None}
    if not updates:
        doc = await db.tasks.find_one({"id": task_id}, {"_id": 0})
        if not doc:
            raise HTTPException(status_code=404, detail="Task not found")
        return Task(**doc)
    updates["updated_at"] = utcnow_iso()
    result = await db.tasks.update_one({"id": task_id}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    doc = await db.tasks.find_one({"id": task_id}, {"_id": 0})
    return Task(**doc)


@api_router.delete("/tasks/{task_id}")
async def delete_task(task_id: str):
    result = await db.tasks.delete_one({"id": task_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"ok": True}


# --- Combined agenda ---
@api_router.get("/agenda")
async def get_agenda(date: str = Query(..., description="YYYY-MM-DD date")):
    # date is YYYY-MM-DD; find events overlapping that day and tasks due that day
    day_start = f"{date}T00:00:00"
    day_end = f"{date}T23:59:59.999"
    events = await db.events.find(
        {"start": {"$gte": day_start, "$lte": day_end}}, {"_id": 0}
    ).sort("start", 1).to_list(1000)
    tasks = await db.tasks.find(
        {"due_date": {"$gte": day_start, "$lte": day_end}}, {"_id": 0}
    ).sort("due_date", 1).to_list(1000)
    return {"events": events, "tasks": tasks}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
