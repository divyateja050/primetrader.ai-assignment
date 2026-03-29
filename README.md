# Backend Developer (Intern) Assignment: Task Manager

A scalable, secure Task Management REST API featuring a fast Python backend and a responsive Vanilla JavaScript frontend.

## 🏆 Core Deliverables Achieved

- ✅ **Auth**: Implemented `passlib[bcrypt]` for secure password hashing and `python-jose` for stateless JSON Web Token (JWT) handling.
- ✅ **RBAC (Role-Based Access Control)**: Segregated permissions securely between `user` and `admin`. Base registrations successfully default to standard `user` permissions with no privilege escalation holes.
- ✅ **CRUD Operations**: The secondary entity (`Tasks`) features complete *Create, Read, Update, and Delete* endpoints correctly bridged to the UI.
- ✅ **Standards & Best Practices**:
  - Strict logic flow utilizing API Versioning (routers attached cleanly to `/api/v1/`).
  - Robust Error Handling (`HTTPException`s mapped safely across endpoints).
  - Comprehensive Input Validation natively bound using Pydantic core schemas.
- ✅ **Database**: Clean migration directly native to a distributed **PostgreSQL** instance via SQLAlchemy ORM mapping (`psycopg2-binary`).
- ✅ **Frontend**: A minimal, beautifully rapid Vanilla JS dashboard that handles login validation, API cache refreshing, state separation, and full data CRUD interaction.
- ✅ **DevOps & Documentation**: Zero-config interactive API map provided dynamically via FastAPI Swagger UI mapping (`/docs`).

---

## 📋 Getting Started

### 1. Database Configuration

You must have a live local or remote **PostgreSQL** URL mapped.

1. Create a `.env` file identically stationed in the backend directory.
2. Populate the `.env` with exactly this line:

   ```env
   DATABASE_URL="postgresql://user:password@host/db"
   ```

### 2. Backend Setup

First, make sure you have Python installed. Then, configure your dependencies:

```bash
# 1. Activate your virtual environment (Windows)
venv\Scripts\activate  
# Alternatively on Mac/Linux: source venv/bin/activate

# 2. Install dependencies (including db drivers)
pip install -r requirements.txt

# 3. Start the FastAPI development server
uvicorn main:app --reload
```

Once running, the interactive **Swagger Documentation** is generated dynamically at:  
[http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### 3. Frontend Setup

The frontend operates completely independently using pure `HTML` and native Browser APIs, meaning zero package management (`npm` / Node.js) environments are required.

Simply **double-click** `index.html` to boot the application directly in your browser, or spin up a fast development server natively:

### 4. Testing Admin Privileges (RBAC)

Because the registration API is strictly locked down to prevent users from escalating their own privileges, an included Python script allows you to easily bypass it for local testing purposes.

1. Register an account natively on the frontend (e.g., `test@example.com`).
2. Inside the `backend/` directory, verify your virtual environment is active, then execute the elevation script:

   ```bash
   venv\Scripts\activate  # Windows
   python make_admin.py test@example.com
   ```

3. Refresh the website and log back in. Your account will now display the **Admin Panel**.

---

## 📈 Scalability Note

In the event this microservice suddenly observed hyper-traffic demands (e.g. going viral or handling an influx of concurrent heavy database pulls), the following mitigatory protocols would be implemented to protect uptime:

1. **Async Event Loop**: The backend is utilizing safe, standard synchronous handlers. Under heavy enterprise load, upgrading the router logic to `async def` and modifying the underlying engine hook (`sqlalchemy.ext.asyncio`) unblocks standard Python I/O threading, massively lowering the TTFB bottleneck.
2. **In-Memory Caching (Redis)**: Utilizing **Redis** to intercept redundant HTTP requests (such as `GET /tasks/`, hitting the database on every page load) would immediately alleviate structural IO constraints and reduce database throttling dynamically.
3. **Container Orchestration**: Expanding the enclosed `docker-compose.yml` to bundle the FastAPI worker and a Redis service directly enables instantaneous horizontal container scaling across high-availability clusters.
