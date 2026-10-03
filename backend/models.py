import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, Float, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class AnalysisRecord(Base):
    __tablename__ = "analysis_records"

    id = Column(Integer, primary_key=True, index=True)
    repo_url = Column(String(500), index=True, nullable=False)
    repo_name = Column(String(255), nullable=False)
    commits_analyzed = Column(Integer, default=0)
    files_analyzed = Column(Integer, default=0)
    high_risk_count = Column(Integer, default=0)
    avg_risk_score = Column(Float, default=0.0)
    results_json = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class SharedReport(Base):
    __tablename__ = "shared_reports"

    id = Column(String(64), primary_key=True, index=True)
    repo_name = Column(String(255), nullable=False)
    results_json = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

