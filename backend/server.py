from fastapi import FastAPI, APIRouter, HTTPException, Query, Depends, UploadFile, File, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import Response
from fastapi.concurrency import run_in_threadpool
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import secrets
import uuid
import requests
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
import jwt


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALG = "HS256"
JWT_EXP_HOURS = 24 * 30  # 30 days

# Public base URL for building absolute URLs to uploaded files (logo, etc.).
# Prefer explicit PUBLIC_BASE_URL, fall back to EXPO_PUBLIC_BACKEND_URL (which
# the platform sets to the outward-facing preview URL). Never use request.base_url —
# it resolves to the internal cluster host which Cloudflare blocks.
PUBLIC_BASE_URL = (
    os.environ.get("PUBLIC_BASE_URL")
    or os.environ.get("EXPO_PUBLIC_BACKEND_URL")
    or ""
).rstrip("/")

# Object Storage config
STORAGE_BASE = (os.environ.get("INTEGRATION_PROXY_URL") or "").strip() or "https://integrations.emergentagent.com"
STORAGE_URL = STORAGE_BASE.rstrip("/") + "/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
APP_NAME = "daysync"
_storage_key: Optional[str] = None

pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer = HTTPBearer(auto_error=False)

app = FastAPI()
api_router = APIRouter(prefix="/api")


def utcnow_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# ==================== STORAGE HELPERS ====================

def _init_storage_sync() -> str:
    global _storage_key
    if _storage_key:
        return _storage_key
    resp = requests.post(
        f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY}, timeout=30
    )
    resp.raise_for_status()
    _storage_key = resp.json()["storage_key"]
    return _storage_key


def _put_object_sync(path: str, data: bytes, content_type: str) -> dict:
    key = _init_storage_sync()
    try:
        resp = requests.put(
            f"{STORAGE_URL}/objects/{path}",
            headers={"X-Storage-Key": key, "Content-Type": content_type},
            data=data,
            timeout=120,
        )
        if resp.status_code == 503:
            # stale key, retry once
            global _storage_key
            _storage_key = None
            key = _init_storage_sync()
            resp = requests.put(
                f"{STORAGE_URL}/objects/{path}",
                headers={"X-Storage-Key": key, "Content-Type": content_type},
                data=data,
                timeout=120,
            )
        resp.raise_for_status()
        return resp.json()
    except requests.HTTPError as e:
        if e.response is not None and e.response.status_code == 402:
            raise HTTPException(status_code=402, detail="Storage credits exhausted")
        raise HTTPException(status_code=500, detail=f"Storage upload failed: {e}")


def _get_object_sync(path: str) -> tuple[bytes, str]:
    key = _init_storage_sync()
    resp = requests.get(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key},
        timeout=60,
    )
    if resp.status_code == 503:
        global _storage_key
        _storage_key = None
        key = _init_storage_sync()
        resp = requests.get(
            f"{STORAGE_URL}/objects/{path}",
            headers={"X-Storage-Key": key},
            timeout=60,
        )
    if resp.status_code >= 400:
        raise HTTPException(status_code=404, detail="Object not found")
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")


# ==================== MODELS ====================

class RegisterCompanyRequest(BaseModel):
    company_name: str = Field(min_length=1, max_length=120)
    admin_email: EmailStr
    admin_password: str = Field(min_length=6, max_length=128)
    admin_name: str = Field(min_length=1, max_length=100)
    visibility_mode: str = Field(default="shared")  # shared | private


class JoinCompanyRequest(BaseModel):
    invite_code: str = Field(min_length=6, max_length=128)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    name: str = Field(min_length=1, max_length=100)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UpdateCompanyRequest(BaseModel):
    name: Optional[str] = None
    logo_url: Optional[str] = None
    brand_color: Optional[str] = None
    visibility_mode: Optional[str] = None


class UpdateUserRequest(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None


class CategoryCreate(BaseModel):
    label: str = Field(min_length=1, max_length=40)
    color: str = Field(min_length=4, max_length=9)  # hex
    bg: Optional[str] = None


class CategoryUpdate(BaseModel):
    label: Optional[str] = None
    color: Optional[str] = None
    bg: Optional[str] = None


class EventCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    start: str
    end: str
    location: Optional[str] = ""
    category: str = "work"
    color: str = "#FF6B5C"
    assignee: Optional[str] = ""  # user id or free-text name
    all_day: bool = False


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


class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    due_date: Optional[str] = None
    priority: str = "medium"
    status: str = "todo"
    category: str = "work"
    assignee: Optional[str] = ""


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    category: Optional[str] = None
    assignee: Optional[str] = None


# ==================== AUTH HELPERS ====================

DEFAULT_USER_COLORS = [
    "#FF6B5C", "#32ADE6", "#34C759", "#FFB340", "#AF52DE",
    "#FF3B30", "#5AC8FA", "#FFCC00", "#FF9500", "#4CD964",
]

DEFAULT_CATEGORIES = [
    {"key": "work", "label": "Work", "color": "#FF6B5C", "bg": "#FFDED9"},
    {"key": "meeting", "label": "Meeting", "color": "#32ADE6", "bg": "#D6EEFA"},
    {"key": "deadline", "label": "Deadline", "color": "#FF453A", "bg": "#FFD7D4"},
    {"key": "personal", "label": "Personal", "color": "#34C759", "bg": "#D6F5DE"},
    {"key": "focus", "label": "Focus", "color": "#FFB340", "bg": "#FFEBCC"},
]


def _hex_to_bg(hex_color: str) -> str:
    """Return a light tint of the given hex color to use as chip background."""
    h = hex_color.lstrip("#")
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    try:
        r, g, b = int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
    except Exception:
        return "#F2EFEB"
    # blend 85% white
    r = int(r * 0.15 + 255 * 0.85)
    g = int(g * 0.15 + 255 * 0.85)
    b = int(b * 0.15 + 255 * 0.85)
    return f"#{r:02X}{g:02X}{b:02X}"


def hash_password(pw: str) -> str:
    return pwd_ctx.hash(pw)


def verify_password(pw: str, hashed: str) -> bool:
    try:
        return pwd_ctx.verify(pw, hashed)
    except Exception:
        return False


def make_token(user_id: str, company_id: str, role: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "cid": company_id,
        "role": role,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(hours=JWT_EXP_HOURS)).timestamp()),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


def public_user(u: dict, company: dict | None = None) -> dict:
    return {
        "id": u["id"],
        "company_id": u["company_id"],
        "email": u["email"],
        "role": u["role"],
        "name": u["name"],
        "color": u.get("color", "#FF6B5C"),
        "created_at": u.get("created_at"),
        "company": public_company(company) if company else None,
    }


def public_company(c: dict) -> dict:
    return {
        "id": c["id"],
        "name": c["name"],
        "logo_url": c.get("logo_url"),
        "brand_color": c.get("brand_color", "#FF6B5C"),
        "visibility_mode": c.get("visibility_mode", "shared"),
        "categories": c.get("categories", DEFAULT_CATEGORIES),
    }


async def get_current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer),
) -> dict:
    if not creds or not creds.credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(creds.credentials, JWT_SECRET, algorithms=[JWT_ALG])
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user = await db.users.find_one({"id": payload.get("sub")}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User no longer exists")
    return user


async def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    return user


# ==================== ROUTES ====================

@api_router.get("/")
async def root():
    return {"message": "DaySync API", "status": "ok"}


# --- Auth ---
@api_router.post("/auth/register-company")
async def register_company(payload: RegisterCompanyRequest):
    email = payload.admin_email.lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    company_id = str(uuid.uuid4())
    invite_code = secrets.token_urlsafe(6)[:8].upper()
    company_doc = {
        "id": company_id,
        "name": payload.company_name.strip(),
        "logo_url": None,
        "brand_color": "#FF6B5C",
        "visibility_mode": payload.visibility_mode if payload.visibility_mode in ("shared", "private") else "shared",
        "invite_code": invite_code,
        "categories": [dict(c) for c in DEFAULT_CATEGORIES],
        "created_at": utcnow_iso(),
    }
    await db.companies.insert_one(company_doc)

    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "company_id": company_id,
        "email": email,
        "password_hash": hash_password(payload.admin_password),
        "name": payload.admin_name.strip(),
        "role": "admin",
        "color": DEFAULT_USER_COLORS[0],
        "created_at": utcnow_iso(),
    }
    await db.users.insert_one(user_doc)

    token = make_token(user_id, company_id, "admin")
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": public_user(user_doc, company_doc),
        "invite_code": invite_code,
    }


@api_router.post("/auth/join")
async def join_company(payload: JoinCompanyRequest):
    code = payload.invite_code.strip().upper()
    company = await db.companies.find_one({"invite_code": code}, {"_id": 0})
    if not company:
        raise HTTPException(status_code=400, detail="Invalid invite code")

    email = payload.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=409, detail="Email already registered")

    # Assign a rotating color based on member count
    member_count = await db.users.count_documents({"company_id": company["id"]})
    color = DEFAULT_USER_COLORS[member_count % len(DEFAULT_USER_COLORS)]

    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "company_id": company["id"],
        "email": email,
        "password_hash": hash_password(payload.password),
        "name": payload.name.strip(),
        "role": "employee",
        "color": color,
        "created_at": utcnow_iso(),
    }
    await db.users.insert_one(user_doc)

    token = make_token(user_id, company["id"], "employee")
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": public_user(user_doc, company),
    }


@api_router.post("/auth/login")
async def login(payload: LoginRequest):
    user = await db.users.find_one({"email": payload.email.lower()}, {"_id": 0})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    company = await db.companies.find_one({"id": user["company_id"]}, {"_id": 0})
    token = make_token(user["id"], user["company_id"], user["role"])
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": public_user(user, company),
    }


@api_router.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    company = await db.companies.find_one({"id": user["company_id"]}, {"_id": 0})
    return public_user(user, company)


# --- Company ---
@api_router.get("/company")
async def get_company(user: dict = Depends(get_current_user)):
    company = await db.companies.find_one({"id": user["company_id"]}, {"_id": 0})
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    result = public_company(company)
    # only admins see the invite code
    if user["role"] == "admin":
        result["invite_code"] = company.get("invite_code")
    return result


@api_router.patch("/company")
async def update_company(
    payload: UpdateCompanyRequest, user: dict = Depends(require_admin)
):
    updates = {k: v for k, v in payload.dict().items() if v is not None}
    if updates:
        await db.companies.update_one({"id": user["company_id"]}, {"$set": updates})
    company = await db.companies.find_one({"id": user["company_id"]}, {"_id": 0})
    result = public_company(company)
    result["invite_code"] = company.get("invite_code")
    return result


@api_router.post("/company/rotate-invite")
async def rotate_invite(user: dict = Depends(require_admin)):
    new_code = secrets.token_urlsafe(6)[:8].upper()
    await db.companies.update_one(
        {"id": user["company_id"]}, {"$set": {"invite_code": new_code}}
    )
    return {"invite_code": new_code}


# --- Categories (event types) ---
@api_router.get("/company/categories")
async def list_categories(user: dict = Depends(get_current_user)):
    company = await db.companies.find_one({"id": user["company_id"]}, {"_id": 0})
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company.get("categories", DEFAULT_CATEGORIES)


@api_router.post("/company/categories")
async def create_category(payload: CategoryCreate, user: dict = Depends(require_admin)):
    company = await db.companies.find_one({"id": user["company_id"]}, {"_id": 0})
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    cats = list(company.get("categories") or DEFAULT_CATEGORIES)
    # Generate a stable slug key from the label
    base = "".join(c.lower() if c.isalnum() else "-" for c in payload.label).strip("-") or "category"
    key = base
    idx = 2
    existing_keys = {c["key"] for c in cats}
    while key in existing_keys:
        key = f"{base}-{idx}"
        idx += 1
    new_cat = {
        "key": key,
        "label": payload.label.strip(),
        "color": payload.color,
        "bg": payload.bg or _hex_to_bg(payload.color),
    }
    cats.append(new_cat)
    await db.companies.update_one({"id": user["company_id"]}, {"$set": {"categories": cats}})
    return new_cat


@api_router.patch("/company/categories/{key}")
async def update_category(
    key: str, payload: CategoryUpdate, user: dict = Depends(require_admin)
):
    company = await db.companies.find_one({"id": user["company_id"]}, {"_id": 0})
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    cats = list(company.get("categories") or DEFAULT_CATEGORIES)
    for i, c in enumerate(cats):
        if c["key"] == key:
            if payload.label is not None:
                cats[i]["label"] = payload.label.strip()
            if payload.color is not None:
                cats[i]["color"] = payload.color
                # auto-refresh bg if not explicitly set
                if payload.bg is None:
                    cats[i]["bg"] = _hex_to_bg(payload.color)
            if payload.bg is not None:
                cats[i]["bg"] = payload.bg
            await db.companies.update_one(
                {"id": user["company_id"]}, {"$set": {"categories": cats}}
            )
            return cats[i]
    raise HTTPException(status_code=404, detail="Category not found")


@api_router.delete("/company/categories/{key}")
async def delete_category(key: str, user: dict = Depends(require_admin)):
    company = await db.companies.find_one({"id": user["company_id"]}, {"_id": 0})
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    cats = list(company.get("categories") or DEFAULT_CATEGORIES)
    if len(cats) <= 1:
        raise HTTPException(status_code=400, detail="At least one category is required")
    new_cats = [c for c in cats if c["key"] != key]
    if len(new_cats) == len(cats):
        raise HTTPException(status_code=404, detail="Category not found")
    await db.companies.update_one({"id": user["company_id"]}, {"$set": {"categories": new_cats}})
    return {"ok": True}


@api_router.post("/company/logo")
async def upload_logo(
    request: Request,
    file: UploadFile = File(...),
    user: dict = Depends(require_admin),
):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Must be an image")
    data = await file.read()
    if len(data) > 2 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Image must be < 2MB")
    ext = (file.filename or "logo.png").split(".")[-1].lower()
    if ext not in ("png", "jpg", "jpeg", "webp"):
        ext = "png"
    path = f"{APP_NAME}/companies/{user['company_id']}/logo-{uuid.uuid4()}.{ext}"
    await run_in_threadpool(_put_object_sync, path, data, file.content_type)

    # Build public URL using the outward-facing base URL, not request.base_url
    # (which is the internal cluster host that Cloudflare blocks).
    base = PUBLIC_BASE_URL or str(request.base_url).rstrip("/")
    logo_url = f"{base}/api/files/{path}"
    await db.companies.update_one(
        {"id": user["company_id"]},
        {"$set": {"logo_url": logo_url, "logo_path": path}},
    )
    return {"logo_url": logo_url}


@api_router.get("/files/{full_path:path}")
async def get_file(full_path: str):
    content, ctype = await run_in_threadpool(_get_object_sync, full_path)
    return Response(content=content, media_type=ctype, headers={"Cache-Control": "public, max-age=3600"})


# --- Users (company members) ---
@api_router.get("/users")
async def list_users(user: dict = Depends(get_current_user)):
    docs = await db.users.find(
        {"company_id": user["company_id"]},
        {"_id": 0, "password_hash": 0},
    ).to_list(1000)
    return docs


@api_router.patch("/users/me")
async def update_me(payload: UpdateUserRequest, user: dict = Depends(get_current_user)):
    updates = {k: v for k, v in payload.dict().items() if v is not None}
    if updates:
        await db.users.update_one({"id": user["id"]}, {"$set": updates})
    updated = await db.users.find_one({"id": user["id"]}, {"_id": 0, "password_hash": 0})
    return updated


# --- Events ---
def _visibility_filter(user: dict) -> dict:
    """Returns the MongoDB filter based on the company's visibility mode."""
    return {"company_id": user["company_id"]}


async def _visibility_scope(user: dict) -> dict:
    """Returns the base filter. If visibility_mode is 'private', restrict to own items."""
    company = await db.companies.find_one({"id": user["company_id"]}, {"_id": 0})
    if company and company.get("visibility_mode") == "private" and user["role"] != "admin":
        return {"company_id": user["company_id"], "owner_id": user["id"]}
    return {"company_id": user["company_id"]}


@api_router.post("/events")
async def create_event(payload: EventCreate, user: dict = Depends(get_current_user)):
    doc = payload.dict()
    doc.update({
        "id": str(uuid.uuid4()),
        "company_id": user["company_id"],
        "owner_id": user["id"],
        "owner_name": user["name"],
        "owner_color": user.get("color", "#FF6B5C"),
        "created_at": utcnow_iso(),
        "updated_at": utcnow_iso(),
    })
    await db.events.insert_one(doc)
    return {k: v for k, v in doc.items() if k != "_id"}


@api_router.get("/events")
async def list_events(
    start_after: Optional[str] = Query(None),
    start_before: Optional[str] = Query(None),
    user: dict = Depends(get_current_user),
):
    query = await _visibility_scope(user)
    if start_after or start_before:
        query["start"] = {}
        if start_after:
            query["start"]["$gte"] = start_after
        if start_before:
            query["start"]["$lte"] = start_before
    docs = await db.events.find(query, {"_id": 0}).sort("start", 1).to_list(1000)
    return docs


@api_router.get("/events/{event_id}")
async def get_event(event_id: str, user: dict = Depends(get_current_user)):
    doc = await db.events.find_one(
        {"id": event_id, "company_id": user["company_id"]}, {"_id": 0}
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Event not found")
    return doc


@api_router.patch("/events/{event_id}")
async def update_event(
    event_id: str, payload: EventUpdate, user: dict = Depends(get_current_user)
):
    updates = {k: v for k, v in payload.dict().items() if v is not None}
    updates["updated_at"] = utcnow_iso()
    result = await db.events.update_one(
        {"id": event_id, "company_id": user["company_id"]}, {"$set": updates}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    doc = await db.events.find_one({"id": event_id}, {"_id": 0})
    return doc


@api_router.delete("/events/{event_id}")
async def delete_event(event_id: str, user: dict = Depends(get_current_user)):
    result = await db.events.delete_one(
        {"id": event_id, "company_id": user["company_id"]}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    return {"ok": True}


# --- Tasks ---
@api_router.post("/tasks")
async def create_task(payload: TaskCreate, user: dict = Depends(get_current_user)):
    doc = payload.dict()
    doc.update({
        "id": str(uuid.uuid4()),
        "company_id": user["company_id"],
        "owner_id": user["id"],
        "owner_name": user["name"],
        "owner_color": user.get("color", "#FF6B5C"),
        "created_at": utcnow_iso(),
        "updated_at": utcnow_iso(),
    })
    await db.tasks.insert_one(doc)
    return {k: v for k, v in doc.items() if k != "_id"}


@api_router.get("/tasks")
async def list_tasks(
    status: Optional[str] = Query(None),
    due_after: Optional[str] = Query(None),
    due_before: Optional[str] = Query(None),
    user: dict = Depends(get_current_user),
):
    query = await _visibility_scope(user)
    if status:
        query["status"] = status
    if due_after or due_before:
        query["due_date"] = {}
        if due_after:
            query["due_date"]["$gte"] = due_after
        if due_before:
            query["due_date"]["$lte"] = due_before
    docs = await db.tasks.find(query, {"_id": 0}).sort("due_date", 1).to_list(1000)
    return docs


@api_router.get("/tasks/{task_id}")
async def get_task(task_id: str, user: dict = Depends(get_current_user)):
    doc = await db.tasks.find_one(
        {"id": task_id, "company_id": user["company_id"]}, {"_id": 0}
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Task not found")
    return doc


@api_router.patch("/tasks/{task_id}")
async def update_task(
    task_id: str, payload: TaskUpdate, user: dict = Depends(get_current_user)
):
    updates = {k: v for k, v in payload.dict().items() if v is not None}
    updates["updated_at"] = utcnow_iso()
    result = await db.tasks.update_one(
        {"id": task_id, "company_id": user["company_id"]}, {"$set": updates}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    doc = await db.tasks.find_one({"id": task_id}, {"_id": 0})
    return doc


@api_router.delete("/tasks/{task_id}")
async def delete_task(task_id: str, user: dict = Depends(get_current_user)):
    result = await db.tasks.delete_one(
        {"id": task_id, "company_id": user["company_id"]}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"ok": True}


# --- Agenda ---
@api_router.get("/agenda")
async def get_agenda(
    date: str = Query(..., description="YYYY-MM-DD date"),
    user: dict = Depends(get_current_user),
):
    day_start = f"{date}T00:00:00"
    day_end = f"{date}T23:59:59.999"
    base = await _visibility_scope(user)
    events = await db.events.find(
        {**base, "start": {"$gte": day_start, "$lte": day_end}}, {"_id": 0}
    ).sort("start", 1).to_list(1000)
    tasks = await db.tasks.find(
        {**base, "due_date": {"$gte": day_start, "$lte": day_end}}, {"_id": 0}
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

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@app.on_event("startup")
async def startup():
    # Try to warm the storage key; ignore failures so backend still starts
    try:
        await run_in_threadpool(_init_storage_sync)
        logger.info("Object storage initialized")
    except Exception as e:
        logger.warning(f"Storage init deferred: {e}")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
