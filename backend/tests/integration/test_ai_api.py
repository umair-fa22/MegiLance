"""
@AI-HINT: Integration tests for advanced AI API
Tests all endpoints in backend/app/api/v1/ai_advanced.py
Skipped: requires running AI service on port 7860
"""

import pytest
from httpx import AsyncClient

# pytestmark = pytest.mark.skip(reason="Requires running AI service")


@pytest.mark.asyncio
class TestFreelancerMatching:
    """Test AI-powered freelancer matching"""
    
    async def test_match_freelancers_basic(self, client: AsyncClient, auth_headers: dict):
        """Test basic freelancer matching"""
        response = await client.post(
            "/api/ai-advanced/match-freelancers",
            json={
                "project_title": "Mobile app development",
                "project_description": "iOS and Android app with React Native",
                "skills_required": ["React Native", "JavaScript", "Mobile Development"],
                "budget": 5000.0,
                "deadline_days": 30
            },
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "matches" in data
        assert isinstance(data["matches"], list)
        
        if len(data["matches"]) > 0:
            match = data["matches"][0]
            assert "freelancer_id" in match
            assert "match_score" in match
            assert 0 <= match["match_score"] <= 100
            assert "factors" in match
    
    async def test_match_freelancers_with_preferences(self, client: AsyncClient, auth_headers: dict):
        """Test matching with specific preferences"""
        response = await client.post(
            "/api/ai-advanced/match-freelancers",
            json={
                "project_title": "Data science project",
                "skills_required": ["Python", "Machine Learning", "TensorFlow"],
                "budget": 10000.0,
                "preferences": {
                    "min_rating": 4.5,
                    "min_completed_projects": 10,
                    "location": "US"
                }
            },
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        for match in data["matches"]:
            assert match["match_score"] >= 0


@pytest.mark.asyncio
class TestSemanticSkillMatching:
    """Test semantic NLP skill matching"""
    
    async def test_semantic_skill_match(self, client: AsyncClient):
        """Test semantic skill matching with NLP"""
        response = await client.post(
            "/api/ai-advanced/semantic-skill-match",
            json={
                "required_skills": ["React", "Vue", "Angular"],
                "freelancer_skills": ["React.js", "Next.js", "TypeScript"]
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "similarity_score" in data
        assert 0 <= data["similarity_score"] <= 1
        assert "matched_skills" in data
    
    async def test_semantic_match_with_synonyms(self, client: AsyncClient):
        """Test semantic matching recognizes synonyms"""
        response = await client.post(
            "/api/ai-advanced/semantic-skill-match",
            json={
                "required_skills": ["JavaScript", "Backend", "Database"],
                "freelancer_skills": ["Node.js", "Server-side", "SQL"]
            }
        )
        assert response.status_code == 200
        data = response.json()
        # Should recognize Node.js ~ JavaScript, Server-side ~ Backend
        assert data["similarity_score"] > 0.3


@pytest.mark.asyncio
class TestFraudDetection:
    """Test fraud detection endpoints"""
    
    async def test_detect_fraud_clean_user(self, client: AsyncClient, auth_headers: dict):
        """Test fraud detection on legitimate user"""
        response = await client.post(
            "/api/ai-advanced/detect-fraud",
            json={
                "user_id": 1,
                "activity_data": {
                    "login_count": 5,
                    "project_count": 10,
                    "review_average": 4.8
                }
            },
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "fraud_score" in data
        assert "is_fraud" in data
        assert 0 <= data["fraud_score"] <= 100
        assert data["fraud_score"] < 50  # Clean user should have low score
    
    async def test_detect_fraud_suspicious_activity(self, client: AsyncClient, auth_headers: dict):
        """Test fraud detection on suspicious activity"""
        response = await client.post(
            "/api/ai-advanced/detect-fraud",
            json={
                "user_id": 999,
                "activity_data": {
                    "login_count": 100,  # Excessive logins
                    "project_count": 1,  # Very few projects
                    "failed_payments": 5,  # Multiple failed payments
                    "duplicate_ip_count": 10  # Multiple accounts from same IP
                }
            },
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["fraud_score"] > 50  # Should flag as suspicious
        assert "risk_factors" in data


@pytest.mark.asyncio
class TestQualityAssessment:
    """Test quality assessment endpoints"""
    
    async def test_assess_code_quality(self, client: AsyncClient, auth_headers: dict):
        """Test code quality assessment"""
        response = await client.post(
            "/api/ai-advanced/assess-quality",
            json={
                "content_type": "code",
                "content": "def hello_world():\n    print('Hello, World!')",
                "language": "python"
            },
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "quality_score" in data
        assert 0 <= data["quality_score"] <= 100
        assert "feedback" in data
    
    async def test_assess_design_quality(self, client: AsyncClient, auth_headers: dict):
        """Test design quality assessment"""
        response = await client.post(
            "/api/ai-advanced/assess-quality",
            json={
                "content_type": "design",
                "file_url": "https://example.com/design.png",
                "design_type": "ui_mockup"
            },
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "quality_score" in data
    
    async def test_assess_writing_quality(self, client: AsyncClient, auth_headers: dict):
        """Test content writing quality assessment"""
        response = await client.post(
            "/api/ai-advanced/assess-quality",
            json={
                "content_type": "writing",
                "content": "This is a sample article about AI in freelancing platforms.",
                "target_audience": "professionals"
            },
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "quality_score" in data
        assert "readability_score" in data


@pytest.mark.asyncio
class TestPriceOptimization:
    """Test AI price optimization"""
    
    async def test_optimize_project_price(self, client: AsyncClient, auth_headers: dict):
        """Test price optimization for project"""
        response = await client.post(
            "/api/ai-advanced/optimize-price",
            json={
                "project_type": "web_development",
                "skills_required": ["React", "Node.js", "MongoDB"],
                "estimated_hours": 80,
                "complexity": "medium",
                "market_data": {
                    "similar_projects_avg": 4500.0,
                    "freelancer_hourly_rate": 60.0
                }
            },
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "optimized_price" in data
        assert "confidence" in data
        assert data["optimized_price"] > 0
        assert 0 <= data["confidence"] <= 1


@pytest.mark.asyncio
class TestProjectSuccessPrediction:
    """Test project success prediction"""
    
    async def test_predict_project_success(self, client: AsyncClient, auth_headers: dict):
        """Test predicting project success likelihood"""
        response = await client.post(
            "/api/ai-advanced/predict-success",
            json={
                "project_id": 1,
                "client_history": {"completed_projects": 5, "average_rating": 4.5},
                "freelancer_history": {"completed_projects": 20, "average_rating": 4.8},
                "project_budget": 5000.0,
                "estimated_duration_days": 30
            },
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "success_probability" in data
        assert 0 <= data["success_probability"] <= 1
        assert "key_factors" in data


@pytest.mark.asyncio
class TestChurnPrediction:
    """Test user churn prediction"""
    
    async def test_predict_user_churn(self, client: AsyncClient, auth_headers: dict):
        """Test predicting if user will churn"""
        response = await client.get(
            "/api/ai-advanced/predict-churn/1",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "churn_probability" in data
        assert 0 <= data["churn_probability"] <= 1
        assert "risk_level" in data
        assert data["risk_level"] in ["low", "medium", "high"]


@pytest.mark.asyncio
class TestPortfolioAnalysis:
    """Test portfolio analysis"""
    
    async def test_analyze_portfolio(self, client: AsyncClient, auth_headers: dict):
        """Test AI portfolio analysis"""
        response = await client.post(
            "/api/ai-advanced/analyze-portfolio/1",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "overall_score" in data
        assert "strengths" in data
        assert "improvements" in data
        assert isinstance(data["strengths"], list)
        assert isinstance(data["improvements"], list)


# Fixtures
@pytest.fixture
async def client():
    """Create async HTTP client"""
    from main import app
    import httpx
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.fixture
async def auth_headers(client: AsyncClient):
    """Create authenticated user and return auth headers"""
    from datetime import datetime
    
    # Register user
    register_response = await client.post(
        "/api/auth/register",
        json={
            "email": f"ai_test_{datetime.now().timestamp()}@example.com",
            "password": "TestPassword123!",
            "full_name": "AI Test User",
            "user_type": "client"
        }
    )
    
    # Login
    login_response = await client.post(
        "/api/auth/login",
        json={
            "email": register_response.json()["email"],
            "password": "TestPassword123!"
        }
    )
    
    token = login_response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
