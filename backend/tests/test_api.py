import pytest
import os
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.app.main import app
from backend.app.db.database import Base, get_db
from backend.app.db.models import User, Assessment, AuditLog
from backend.app.core.security import get_password_hash

# Isolated SQLite test database
TEST_DB_FILE = "./test_temp.db"
SQLALCHEMY_DATABASE_URL = f"sqlite:///{TEST_DB_FILE}"
test_engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="module", autouse=True)
def setup_database():
    Base.metadata.create_all(bind=test_engine)
    # Seed an admin and standard user
    db = TestingSessionLocal()
    admin = User(
        email="testadmin@example.com",
        hashed_password=get_password_hash("AdminPass123!"),
        full_name="Admin Tester",
        role="ADMIN",
        is_active=True
    )
    user2 = User(
        email="otheruser@example.com",
        hashed_password=get_password_hash("OtherPass123!"),
        full_name="Other User",
        role="USER",
        is_active=True
    )
    db.add(admin)
    db.add(user2)
    db.commit()
    db.close()
    
    yield
    
    Base.metadata.drop_all(bind=test_engine)
    if os.path.exists(TEST_DB_FILE):
        try:
            os.remove(TEST_DB_FILE)
        except Exception:
            pass

@pytest.fixture
def client():
    return TestClient(app)

def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "model_loaded" in data

def test_user_registration(client):
    payload = {
        "email": "student1@example.com",
        "password": "Password123!",
        "full_name": "Student One"
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["email"] == "student1@example.com"
    assert data["role"] == "USER"

def test_duplicate_registration_fails(client):
    payload = {
        "email": "student1@example.com",
        "password": "Password123!",
        "full_name": "Student Duplicate"
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]

def test_user_login_success_and_invalid(client):
    # Invalid password
    bad_login = client.post("/api/v1/auth/login", json={"email": "student1@example.com", "password": "WrongPassword!"})
    assert bad_login.status_code == 401

    # Valid password
    good_login = client.post("/api/v1/auth/login", json={"email": "student1@example.com", "password": "Password123!"})
    assert good_login.status_code == 200
    assert "access_token" in good_login.json()

def test_role_based_authorization_user_cannot_access_admin(client):
    # Login as student (USER)
    user_login = client.post("/api/v1/auth/login", json={"email": "student1@example.com", "password": "Password123!"})
    token = user_login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Attempt admin endpoint
    admin_res = client.get("/api/v1/admin/stats", headers=headers)
    assert admin_res.status_code == 403
    assert "Administrative privileges required" in admin_res.json()["detail"]

def test_admin_can_access_admin_endpoints(client):
    # Login as admin
    admin_login = client.post("/api/v1/auth/login", json={"email": "testadmin@example.com", "password": "AdminPass123!"})
    token = admin_login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    stats_res = client.get("/api/v1/admin/stats", headers=headers)
    assert stats_res.status_code == 200
    assert "total_users" in stats_res.json()
    assert "label_distribution" in stats_res.json()

    users_res = client.get("/api/v1/admin/users", headers=headers)
    assert users_res.status_code == 200
    assert "users" in users_res.json()

def test_assessment_validation_and_submission(client):
    user_login = client.post("/api/v1/auth/login", json={"email": "student1@example.com", "password": "Password123!"})
    token = user_login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Invalid assessment: age out of range
    invalid_payload = {
        "age": 12, # Min is 16
        "gender": "Male",
        "academic_pressure": 4,
        "study_satisfaction": 2,
        "sleep_duration": "Less than 5 hours",
        "study_hours": 6,
        "financial_stress": 4,
        "social_support": "Low",
        "family_history": "Yes",
        "attendance": 80
    }
    inv_res = client.post("/api/v1/assessments/", json=invalid_payload, headers=headers)
    assert inv_res.status_code == 422

    # Valid assessment submission
    valid_payload = {
        "age": 22,
        "gender": "Female",
        "academic_pressure": 4,
        "study_satisfaction": 2,
        "sleep_duration": "Less than 5 hours",
        "study_hours": 6,
        "financial_stress": 4,
        "social_support": "Low",
        "family_history": "Yes",
        "attendance": 70
    }
    res = client.post("/api/v1/assessments/", json=valid_payload, headers=headers)
    assert res.status_code == 201
    data = res.json()
    assert "id" in data
    assert "prediction_label" in data
    assert "probability" in data
    assert "risk_level" in data
    assert "feature_importance_snapshot" in data

    # Verify user dashboard summary updates
    dash_res = client.get("/api/v1/dashboard/summary", headers=headers)
    assert dash_res.status_code == 200
    dash_data = dash_res.json()
    assert dash_data["total_assessments"] >= 1
    assert len(dash_data["trend_data"]) >= 1

def test_user_history_isolation(client):
    # Student 1 logs in
    login1 = client.post("/api/v1/auth/login", json={"email": "student1@example.com", "password": "Password123!"})
    token1 = login1.json()["access_token"]

    # Student 2 logs in
    login2 = client.post("/api/v1/auth/login", json={"email": "otheruser@example.com", "password": "OtherPass123!"})
    token2 = login2.json()["access_token"]

    # Student 1 gets their history
    res1 = client.get("/api/v1/assessments/history", headers={"Authorization": f"Bearer {token1}"})
    assert res1.status_code == 200
    items1 = res1.json()["items"]
    assert len(items1) > 0
    assessment_id = items1[0]["id"]

    # Student 2 checks their own history (should be empty for them)
    res2 = client.get("/api/v1/assessments/history", headers={"Authorization": f"Bearer {token2}"})
    assert res2.status_code == 200
    assert len(res2.json()["items"]) == 0

    # Student 2 attempts to directly read Student 1's assessment ID
    res_forbidden = client.get(f"/api/v1/assessments/{assessment_id}", headers={"Authorization": f"Bearer {token2}"})
    assert res_forbidden.status_code == 403
