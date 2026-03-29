import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

# The assignment requires a PostgreSQL instance (managed via Supabase)
DATABASE_URI = os.getenv("DATABASE_URL")

if not DATABASE_URI:
    raise ValueError("CRITICAL: Missing DATABASE_URL configuration in .env file. Please supply a valid PostgreSQL connection string.")

# Initialize strictly using the Postgres URI
engine = create_engine(DATABASE_URI)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()
