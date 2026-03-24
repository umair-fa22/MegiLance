# @AI-HINT: Database seeding script - populates demo/development data for users, projects, skills
import logging
import json
from sqlalchemy.orm import Session
from app.db.session import engine
from app.db.base import Base
from app.models.user import User
from app.models.project import Project
from app.models.proposal import Proposal
from app.models.contract import Contract
from app.models.portfolio import PortfolioItem
from app.models.payment import Payment
from app.core.security import get_password_hash
from datetime import datetime, timedelta, timezone
logger = logging.getLogger(__name__)

def seed_database():
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    # Create a session
    from app.db.session import SessionLocal
    db = SessionLocal()
    
    try:
        # Check if data already exists
        if db.query(User).first():
            logger.info("Database already seeded. Skipping...")
            return
        
        # Create sample users
        freelancer1 = User(
            email="freelancer1@example.com",
            hashed_password=get_password_hash("password123"),
            is_active=True,
            name="Alice Johnson",
            user_type="Freelancer",
            bio="Experienced full-stack developer with 5+ years of experience in React, Node.js, and Python.",
            skills="React,Node.js,Python,PostgreSQL,MongoDB",
            hourly_rate=50.0,
            profile_image_url="/avatars/alice.png",
            location="San Francisco, CA",
            joined_at=datetime.now(timezone.utc)
        )
        
        freelancer2 = User(
            email="freelancer2@example.com",
            hashed_password=get_password_hash("password123"),
            is_active=True,
            name="Bob Smith",
            user_type="Freelancer",
            bio="UI/UX designer with expertise in creating beautiful and functional user interfaces.",
            skills="UI/UX,Design,Figma,Adobe XD,Prototyping",
            hourly_rate=45.0,
            profile_image_url="/avatars/bob.jpg",
            location="New York, NY",
            joined_at=datetime.now(timezone.utc)
        )
        
        client1 = User(
            email="client1@example.com",
            hashed_password=get_password_hash("password123"),
            is_active=True,
            name="Tech Corp",
            user_type="Client",
            bio="Innovative tech company looking for talented freelancers to help build our products.",
            location="Los Angeles, CA",
            joined_at=datetime.now(timezone.utc)
        )
        
        db.add_all([freelancer1, freelancer2, client1])
        db.commit()
        
        # Create sample projects
        project1 = Project(
            title="E-commerce Website Development",
            description="Build a modern e-commerce website with React frontend and Node.js backend.",
            category="Web Development",
            budget_type="Fixed",
            budget_min=5000.0,
            budget_max=10000.0,
            experience_level="Intermediate",
            estimated_duration="1-4 weeks",
            skills="React,Node.js,PostgreSQL,Stripe",
            client_id=client1.id,
            status="open",
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        
        project2 = Project(
            title="Mobile App UI Design",
            description="Design a beautiful and intuitive UI for our new mobile application.",
            category="UI/UX Design",
            budget_type="Fixed",
            budget_min=2000.0,
            budget_max=4000.0,
            experience_level="Entry",
            estimated_duration="Less than 1 week",
            skills="UI/UX,Figma,Prototyping",
            client_id=client1.id,
            status="open",
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        
        db.add_all([project1, project2])
        db.commit()
        
        # Create sample proposals
        proposal1 = Proposal(
            project_id=project1.id,
            freelancer_id=freelancer1.id,
            cover_letter="I'm excited to work on this e-commerce project. With my 5+ years of experience in React and Node.js, I can deliver a high-quality solution.",
            estimated_hours=120,
            hourly_rate=50.0,
            availability="1-2_weeks",
            status="submitted",
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        
        proposal2 = Proposal(
            project_id=project1.id,
            freelancer_id=freelancer2.id,
            cover_letter="As a UI/UX designer, I can help create an intuitive and beautiful user interface for your e-commerce website.",
            estimated_hours=80,
            hourly_rate=45.0,
            availability="immediate",
            status="submitted",
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        
        db.add_all([proposal1, proposal2])
        db.commit()
        
        # Create sample portfolio items
        portfolio1 = PortfolioItem(
            freelancer_id=freelancer1.id,
            title="E-commerce Platform",
            description="A full-featured e-commerce platform built with React and Node.js.",
            image_url="/portfolio/ecommerce.jpg",
            project_url="https://example-ecommerce.com",
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        
        portfolio2 = PortfolioItem(
            freelancer_id=freelancer1.id,
            title="Task Management App",
            description="A productivity app for managing tasks and projects.",
            image_url="/portfolio/taskapp.jpg",
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        
        db.add_all([portfolio1, portfolio2])
        db.commit()
        
        logger.info("Database seeded successfully!")
        
    except Exception as e:
        logger.info(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()