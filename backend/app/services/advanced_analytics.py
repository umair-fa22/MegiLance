# @AI-HINT: Advanced analytics service with ML predictions and market intelligence
"""Advanced Analytics Service - ML-powered analytics and business intelligence."""

import logging
from datetime import datetime, timedelta, timezone
from typing import Optional, List, Dict, Any, Tuple
from app.db.turso_http import execute_query, parse_rows
from collections import defaultdict
import math

logger = logging.getLogger(__name__)


class AdvancedAnalyticsService:
    """
    Advanced analytics engine for platform intelligence.
    
    Provides ML-powered predictions, cohort analysis, and
    comprehensive business intelligence.
    """
    
    def __init__(self):
        pass
    
    # =========================================================================
    # Revenue Analytics
    # =========================================================================
    
    async def get_revenue_forecast(
        self,
        months_ahead: int = 6,
        include_confidence: bool = True
    ) -> Dict[str, Any]:
        """
        Generate revenue forecast using Linear Regression on historical data.
        """
        try:
            # Get historical revenue data (12 months)
            end_date = datetime.now(timezone.utc)
            start_date = end_date - timedelta(days=365)
            
            result = await execute_query(
                "SELECT created_at, amount FROM payments WHERE created_at >= ? AND status = 'completed'",
                [start_date.isoformat()]
            )
            payments = parse_rows(result)
            
            # Aggregate by month
            monthly_revenue = defaultdict(float)
            for payment in payments:
                created = payment.get("created_at", "")
                if created:
                    month_key = created[:7]  # "YYYY-MM"
                    monthly_revenue[month_key] += float(payment.get("amount") or 0)
            
            # Prepare data for regression
            # X = month index (0, 1, 2...), y = revenue
            sorted_months = sorted(monthly_revenue.keys())
            
            # Fill gaps with 0
            X = []
            y = []
            historical = []
            
            if sorted_months:
                # Find range
                first_month_str = sorted_months[0]
                first_month = datetime.strptime(first_month_str, "%Y-%m")
                last_month = datetime.strptime(sorted_months[-1], "%Y-%m")
                
                current = first_month
                idx = 0
                while current <= last_month:
                    m_key = current.strftime("%Y-%m")
                    rev = monthly_revenue.get(m_key, 0.0)
                    X.append(idx)
                    y.append(rev)
                    historical.append({"month": m_key, "revenue": rev})
                    
                    # Next month
                    if current.month == 12:
                        current = current.replace(year=current.year + 1, month=1)
                    else:
                        current = current.replace(month=current.month + 1)
                    idx += 1
            else:
                X = [0]
                y = [0.0]
                historical = [{"month": end_date.strftime("%Y-%m"), "revenue": 0.0}]

            # Linear Regression
            n = len(X)
            slope = 0
            intercept = 0
            mean_x = 0
            denominator = 0
            
            if n > 1:
                mean_x = sum(X) / n
                mean_y = sum(y) / n
                numerator = sum((X[i] - mean_x) * (y[i] - mean_y) for i in range(n))
                denominator = sum((X[i] - mean_x) ** 2 for i in range(n))
                
                if denominator != 0:
                    slope = numerator / denominator
                intercept = mean_y - (slope * mean_x)
            elif n == 1:
                intercept = y[0]

            # Generate Forecast
            forecast = []
            last_idx = X[-1] if X else 0
            
            for i in range(1, months_ahead + 1):
                future_idx = last_idx + i
                predicted = (slope * future_idx) + intercept
                predicted = max(0, predicted) # No negative revenue
                
                future_date = end_date + timedelta(days=30 * i)
                month_key = future_date.strftime("%Y-%m")
                
                # Confidence interval based on variance
                confidence_width = 0
                if include_confidence:
                    if n > 2 and denominator > 0:
                        # Standard Error of Estimate
                        sse = sum((y[i] - ((slope * X[i]) + intercept)) ** 2 for i in range(n))
                        see = math.sqrt(sse / (n - 2))
                        
                        # Prediction Interval
                        # 1.96 for 95% confidence
                        confidence_width = 1.96 * see * math.sqrt(1 + (1/n) + ((future_idx - mean_x)**2 / denominator))
                    else:
                        confidence_width = predicted * 0.2 # Fallback 20% margin

                forecast.append({
                    "month": month_key,
                    "predicted_revenue": round(predicted, 2),
                    "confidence_low": round(max(0, predicted - confidence_width), 2) if include_confidence else None,
                    "confidence_high": round(predicted + confidence_width, 2) if include_confidence else None,
                    "confidence_level": 0.95 if include_confidence else None
                })
            
            # Calculate summary metrics
            total_forecast = sum(f["predicted_revenue"] for f in forecast)
            avg_monthly = total_forecast / len(forecast) if forecast else 0
            
            return {
                "historical": historical[-6:],  # Last 6 months
                "forecast": forecast,
                "summary": {
                    "total_forecasted_revenue": round(total_forecast, 2),
                    "average_monthly": round(avg_monthly, 2),
                    "growth_rate": round(slope, 2), # Slope represents monthly growth in currency units
                    "trend": "growing" if slope > 0 else "declining" if slope < 0 else "stable"
                },
                "model_info": {
                    "type": "linear_regression",
                    "last_updated": datetime.now(timezone.utc).isoformat()
                }
            }
            
        except Exception as e:
            logger.error(f"Revenue forecast error: {str(e)}")
            raise
    
    async def get_revenue_breakdown(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        Get revenue breakdown by category, type, and source.
        """
        try:
            if not end_date:
                end_date = datetime.now(timezone.utc)
            if not start_date:
                start_date = end_date - timedelta(days=30)
            
            result = await execute_query(
                "SELECT * FROM payments WHERE created_at >= ? AND created_at <= ? AND status = 'completed'",
                [start_date.isoformat(), end_date.isoformat()]
            )
            payments = parse_rows(result)
            
            # Breakdown by payment type
            by_type = defaultdict(float)
            by_category = defaultdict(float)
            project_ids = set()
            
            for payment in payments:
                ptype = payment.get("payment_type") or "project"
                by_type[ptype] += float(payment.get("amount") or 0)
                pid = payment.get("project_id")
                if pid:
                    project_ids.add(pid)
            
            # Get project categories in batch
            if project_ids:
                placeholders = ",".join(["?"] * len(project_ids))
                proj_result = await execute_query(
                    f"SELECT id, category FROM projects WHERE id IN ({placeholders})",
                    list(project_ids)
                )
                proj_rows = parse_rows(proj_result)
                proj_cat_map = {r["id"]: r.get("category") or "uncategorized" for r in proj_rows}
            else:
                proj_cat_map = {}
            
            for payment in payments:
                pid = payment.get("project_id")
                if pid and pid in proj_cat_map:
                    by_category[proj_cat_map[pid]] += float(payment.get("amount") or 0)
            
            total_revenue = sum(by_type.values())
            
            return {
                "period": {
                    "start": start_date.isoformat(),
                    "end": end_date.isoformat()
                },
                "total_revenue": round(total_revenue, 2),
                "by_type": [
                    {"type": k, "amount": round(v, 2), "percentage": round(v / total_revenue * 100, 1) if total_revenue > 0 else 0}
                    for k, v in sorted(by_type.items(), key=lambda x: x[1], reverse=True)
                ],
                "by_category": [
                    {"category": k, "amount": round(v, 2), "percentage": round(v / total_revenue * 100, 1) if total_revenue > 0 else 0}
                    for k, v in sorted(by_category.items(), key=lambda x: x[1], reverse=True)[:10]
                ],
                "transaction_count": len(payments),
                "average_transaction": round(total_revenue / len(payments), 2) if payments else 0
            }
            
        except Exception as e:
            logger.error(f"Revenue breakdown error: {str(e)}")
            raise
    
    # =========================================================================
    # User Analytics
    # =========================================================================
    
    async def get_cohort_analysis(
        self,
        cohort_type: str = "monthly",  # monthly, weekly
        metric: str = "retention"  # retention, revenue, activity
    ) -> Dict[str, Any]:
        """
        Perform cohort analysis for user retention and engagement.
        """
        try:
            cutoff = (datetime.now(timezone.utc) - timedelta(days=180)).isoformat()
            user_result = await execute_query(
                "SELECT id, created_at FROM users WHERE created_at >= ?",
                [cutoff]
            )
            users = parse_rows(user_result)
            
            # Group users into cohorts
            cohorts = defaultdict(list)
            for user in users:
                created = user.get("created_at", "")
                if not created:
                    continue
                try:
                    dt = datetime.fromisoformat(created.replace("Z", "+00:00")) if isinstance(created, str) else created
                except (ValueError, AttributeError):
                    continue
                if cohort_type == "monthly":
                    cohort_key = dt.strftime("%Y-%m")
                else:
                    week_start = dt - timedelta(days=dt.weekday())
                    cohort_key = week_start.strftime("%Y-W%W")
                cohorts[cohort_key].append({"id": user["id"], "created_at": dt})
            
            # Calculate retention for each cohort
            cohort_data = []
            
            for cohort_key, cohort_users in sorted(cohorts.items()):
                cohort_size = len(cohort_users)
                user_ids = [u["id"] for u in cohort_users]
                
                periods = []
                for period in range(6):
                    if cohort_type == "monthly":
                        try:
                            period_start = datetime.strptime(cohort_key, "%Y-%m") + timedelta(days=30 * period)
                        except ValueError:
                            continue
                        period_end = period_start + timedelta(days=30)
                    else:
                        try:
                            period_start = datetime.strptime(cohort_key + "-1", "%Y-W%W-%w") + timedelta(weeks=period)
                        except ValueError:
                            continue
                        period_end = period_start + timedelta(weeks=1)
                    
                    # Count active users (users with projects in this period)
                    if user_ids:
                        placeholders = ",".join(["?"] * len(user_ids))
                        count_result = await execute_query(
                            f"SELECT COUNT(DISTINCT client_id) as cnt FROM projects WHERE client_id IN ({placeholders}) AND created_at >= ? AND created_at < ?",
                            user_ids + [period_start.isoformat(), period_end.isoformat()]
                        )
                        count_rows = parse_rows(count_result)
                        active_count = int(count_rows[0]["cnt"]) if count_rows else 0
                    else:
                        active_count = 0
                    
                    retention_rate = (active_count / cohort_size * 100) if cohort_size > 0 else 0
                    
                    periods.append({
                        "period": period,
                        "active_users": active_count,
                        "retention_rate": round(retention_rate, 1)
                    })
                
                cohort_data.append({
                    "cohort": cohort_key,
                    "size": cohort_size,
                    "periods": periods
                })
            
            # Calculate overall retention curve
            retention_curve = []
            for period in range(6):
                period_retentions = [
                    c["periods"][period]["retention_rate"] 
                    for c in cohort_data 
                    if period < len(c["periods"])
                ]
                avg_retention = sum(period_retentions) / len(period_retentions) if period_retentions else 0
                retention_curve.append({
                    "period": period,
                    "average_retention": round(avg_retention, 1)
                })
            
            return {
                "cohort_type": cohort_type,
                "metric": metric,
                "cohorts": cohort_data,
                "retention_curve": retention_curve,
                "insights": self._generate_cohort_insights(cohort_data, retention_curve)
            }
            
        except Exception as e:
            logger.error(f"Cohort analysis error: {str(e)}")
            raise
    
    async def get_churn_prediction(
        self,
        user_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Predict user churn probability using ML model.
        """
        try:
            if user_id:
                user_result = await execute_query(
                    "SELECT id, created_at, last_login, is_active FROM users WHERE id = ?", [user_id]
                )
                users = parse_rows(user_result)
                if not users:
                    raise ValueError("User not found")
            else:
                user_result = await execute_query(
                    "SELECT id, created_at, last_login, is_active FROM users WHERE is_active = 1 LIMIT 100"
                )
                users = parse_rows(user_result)
            
            # Batch-fetch project counts and proposal counts
            all_user_ids = [u["id"] for u in users]
            project_counts = {}
            proposal_counts = {}
            
            if all_user_ids:
                placeholders = ",".join(["?"] * len(all_user_ids))
                pc_result = await execute_query(
                    f"SELECT client_id, COUNT(*) as cnt FROM projects WHERE client_id IN ({placeholders}) GROUP BY client_id",
                    all_user_ids
                )
                for row in parse_rows(pc_result):
                    project_counts[row["client_id"]] = int(row["cnt"])
                
                pp_result = await execute_query(
                    f"SELECT freelancer_id, COUNT(*) as cnt FROM proposals WHERE freelancer_id IN ({placeholders}) GROUP BY freelancer_id",
                    all_user_ids
                )
                for row in parse_rows(pp_result):
                    proposal_counts[row["freelancer_id"]] = int(row["cnt"])
            
            predictions = []
            now = datetime.now(timezone.utc)
            
            for user in users:
                # Calculate churn features
                created_str = user.get("created_at", "")
                login_str = user.get("last_login", "")
                
                try:
                    created_dt = datetime.fromisoformat(created_str.replace("Z", "+00:00")) if created_str else now
                except (ValueError, AttributeError):
                    created_dt = now
                    
                try:
                    login_dt = datetime.fromisoformat(login_str.replace("Z", "+00:00")) if login_str else None
                except (ValueError, AttributeError):
                    login_dt = None
                
                days_since_registration = (now - created_dt).days
                days_since_last_login = (now - login_dt).days if login_dt else 30
                
                project_count = project_counts.get(user["id"], 0)
                proposal_count = proposal_counts.get(user["id"], 0)
                
                # Simple churn scoring (in production, use trained ML model)
                # Higher score = higher churn risk
                churn_score = 0
                
                # Inactivity increases churn
                if days_since_last_login > 30:
                    churn_score += 0.3
                elif days_since_last_login > 14:
                    churn_score += 0.15
                
                # Low activity increases churn
                total_activity = project_count + proposal_count
                if total_activity == 0:
                    churn_score += 0.3
                elif total_activity < 3:
                    churn_score += 0.1
                
                # New users have higher churn
                if days_since_registration < 30 and total_activity == 0:
                    churn_score += 0.2
                
                # Normalize to 0-1
                churn_probability = min(churn_score, 0.95)
                
                # Determine risk level
                if churn_probability > 0.6:
                    risk_level = "high"
                    recommendations = [
                        "Send re-engagement email",
                        "Offer promotional credit",
                        "Personal outreach from support"
                    ]
                elif churn_probability > 0.3:
                    risk_level = "medium"
                    recommendations = [
                        "Send feature highlights email",
                        "Suggest relevant projects/freelancers"
                    ]
                else:
                    risk_level = "low"
                    recommendations = [
                        "Continue regular engagement"
                    ]
                
                predictions.append({
                    "user_id": user["id"],
                    "churn_probability": round(churn_probability, 3),
                    "risk_level": risk_level,
                    "factors": {
                        "days_since_last_login": days_since_last_login,
                        "total_activity": total_activity,
                        "account_age_days": days_since_registration
                    },
                    "recommendations": recommendations
                })
            
            # Aggregate statistics
            high_risk = sum(1 for p in predictions if p["risk_level"] == "high")
            medium_risk = sum(1 for p in predictions if p["risk_level"] == "medium")
            low_risk = sum(1 for p in predictions if p["risk_level"] == "low")
            
            return {
                "predictions": predictions if user_id else predictions[:10],
                "summary": {
                    "total_users_analyzed": len(predictions),
                    "high_risk_count": high_risk,
                    "medium_risk_count": medium_risk,
                    "low_risk_count": low_risk,
                    "average_churn_probability": round(
                        sum(p["churn_probability"] for p in predictions) / len(predictions), 3
                    ) if predictions else 0
                },
                "generated_at": datetime.now(timezone.utc).isoformat()
            }
            
        except Exception as e:
            logger.error(f"Churn prediction error: {str(e)}")
            raise
    
    # =========================================================================
    # Market Analytics
    # =========================================================================
    
    async def get_market_trends(
        self,
        category: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Analyze market trends for skills, categories, and pricing.
        """
        try:
            start_date = datetime.now(timezone.utc) - timedelta(days=90)
            
            if category:
                proj_result = await execute_query(
                    "SELECT * FROM projects WHERE created_at >= ? AND category = ?",
                    [start_date.isoformat(), category]
                )
            else:
                proj_result = await execute_query(
                    "SELECT * FROM projects WHERE created_at >= ?",
                    [start_date.isoformat()]
                )
            projects = parse_rows(proj_result)
            
            # Analyze skill demand
            skill_demand = defaultdict(int)
            category_demand = defaultdict(int)
            budget_by_category = defaultdict(list)
            
            for project in projects:
                cat = project.get("category") or "uncategorized"
                category_demand[cat] += 1
                
                bmin = project.get("budget_min")
                bmax = project.get("budget_max")
                if bmin and bmax:
                    avg_budget = (float(bmin) + float(bmax)) / 2
                    budget_by_category[cat].append(avg_budget)
                
                skills_req = project.get("skills_required") or ""
                if skills_req:
                    skills_list = skills_req.split(",") if isinstance(skills_req, str) else skills_req
                    for skill in skills_list:
                        skill_demand[skill.strip().lower()] += 1
            
            top_skills = sorted(skill_demand.items(), key=lambda x: x[1], reverse=True)[:15]
            top_categories = sorted(category_demand.items(), key=lambda x: x[1], reverse=True)[:10]
            
            avg_budgets = {
                cat: round(sum(budgets) / len(budgets), 2)
                for cat, budgets in budget_by_category.items()
                if budgets
            }
            
            # Compare to previous period
            prev_start = start_date - timedelta(days=90)
            if category:
                prev_result = await execute_query(
                    "SELECT skills_required FROM projects WHERE created_at >= ? AND created_at < ? AND category = ?",
                    [prev_start.isoformat(), start_date.isoformat(), category]
                )
            else:
                prev_result = await execute_query(
                    "SELECT skills_required FROM projects WHERE created_at >= ? AND created_at < ?",
                    [prev_start.isoformat(), start_date.isoformat()]
                )
            prev_projects = parse_rows(prev_result)

            prev_skill_demand = defaultdict(int)
            for project in prev_projects:
                skills_req = project.get("skills_required") or ""
                if skills_req:
                    skills_list = skills_req.split(",") if isinstance(skills_req, str) else skills_req
                    for skill in skills_list:
                        prev_skill_demand[skill.strip().lower()] += 1

            trends = []
            for skill, count in top_skills:
                prev_count = prev_skill_demand.get(skill, 0)
                if prev_count > 0:
                    change_pct = round(((count - prev_count) / prev_count) * 100, 1)
                    if change_pct > 10:
                        trend = "rising"
                    elif change_pct < -10:
                        trend = "declining"
                    else:
                        trend = "stable"
                elif count > 0:
                    trend = "new"
                    change_pct = 100.0
                else:
                    trend = "stable"
                    change_pct = 0
                trends.append({
                    "skill": skill,
                    "demand_count": count,
                    "prev_demand_count": prev_count,
                    "trend": trend,
                    "change_percent": change_pct
                })
            
            return {
                "period": {
                    "start": start_date.isoformat(),
                    "end": datetime.now(timezone.utc).isoformat(),
                    "days": 90
                },
                "top_skills": trends,
                "top_categories": [
                    {"category": cat, "project_count": count, "avg_budget": avg_budgets.get(cat, 0)}
                    for cat, count in top_categories
                ],
                "market_summary": {
                    "total_projects": len(projects),
                    "unique_skills": len(skill_demand),
                    "avg_budget_overall": round(
                        sum(sum(b) for b in budget_by_category.values()) / 
                        sum(len(b) for b in budget_by_category.values()), 2
                    ) if budget_by_category else 0
                },
                "insights": [
                    f"Top skill: {top_skills[0][0] if top_skills else 'N/A'}",
                    f"Most active category: {top_categories[0][0] if top_categories else 'N/A'}",
                    f"Average project budget: ${avg_budgets.get(top_categories[0][0], 0) if top_categories else 0}"
                ]
            }
            
        except Exception as e:
            logger.error(f"Market trends error: {str(e)}")
            raise
    
    # =========================================================================
    # Platform Health
    # =========================================================================
    
    async def get_platform_health(self) -> Dict[str, Any]:
        """
        Get comprehensive platform health metrics.
        """
        try:
            now = datetime.now(timezone.utc)
            day_ago = (now - timedelta(days=1)).isoformat()
            week_ago = (now - timedelta(days=7)).isoformat()
            
            # User metrics — batch queries
            u1 = await execute_query("SELECT COUNT(*) as cnt FROM users")
            u2 = await execute_query("SELECT COUNT(*) as cnt FROM users WHERE last_login >= ?", [day_ago])
            u3 = await execute_query("SELECT COUNT(*) as cnt FROM users WHERE created_at >= ?", [week_ago])
            
            total_users = int(parse_rows(u1)[0]["cnt"]) if parse_rows(u1) else 0
            active_users_24h = int(parse_rows(u2)[0]["cnt"]) if parse_rows(u2) else 0
            new_users_week = int(parse_rows(u3)[0]["cnt"]) if parse_rows(u3) else 0
            
            # Project metrics
            p1 = await execute_query("SELECT COUNT(*) as cnt FROM projects")
            p2 = await execute_query("SELECT COUNT(*) as cnt FROM projects WHERE status = 'open'")
            p3 = await execute_query("SELECT COUNT(*) as cnt FROM projects WHERE created_at >= ?", [week_ago])
            
            total_projects = int(parse_rows(p1)[0]["cnt"]) if parse_rows(p1) else 0
            active_projects = int(parse_rows(p2)[0]["cnt"]) if parse_rows(p2) else 0
            new_projects_week = int(parse_rows(p3)[0]["cnt"]) if parse_rows(p3) else 0
            
            # Proposal metrics
            pr1 = await execute_query("SELECT COUNT(*) as cnt FROM proposals")
            pr2 = await execute_query("SELECT COUNT(*) as cnt FROM proposals WHERE created_at >= ?", [week_ago])
            
            total_proposals = int(parse_rows(pr1)[0]["cnt"]) if parse_rows(pr1) else 0
            proposals_week = int(parse_rows(pr2)[0]["cnt"]) if parse_rows(pr2) else 0
            
            # Contract metrics
            c1 = await execute_query("SELECT COUNT(*) as cnt FROM contracts")
            c2 = await execute_query("SELECT COUNT(*) as cnt FROM contracts WHERE status = 'active'")
            
            total_contracts = int(parse_rows(c1)[0]["cnt"]) if parse_rows(c1) else 0
            active_contracts = int(parse_rows(c2)[0]["cnt"]) if parse_rows(c2) else 0
            
            # Calculate health scores
            engagement_score = min(100, (active_users_24h / max(total_users, 1)) * 500)
            activity_score = min(100, (new_projects_week / max(total_projects, 1)) * 200)
            conversion_score = min(100, (total_contracts / max(total_proposals, 1)) * 200)
            
            overall_health = (engagement_score + activity_score + conversion_score) / 3
            
            return {
                "timestamp": now.isoformat(),
                "overall_health_score": round(overall_health, 1),
                "health_status": "healthy" if overall_health > 70 else "warning" if overall_health > 40 else "critical",
                "metrics": {
                    "users": {
                        "total": total_users,
                        "active_24h": active_users_24h,
                        "new_this_week": new_users_week,
                        "engagement_rate": round(active_users_24h / max(total_users, 1) * 100, 2)
                    },
                    "projects": {
                        "total": total_projects,
                        "active": active_projects,
                        "new_this_week": new_projects_week,
                        "fill_rate": round(active_projects / max(total_projects, 1) * 100, 2)
                    },
                    "proposals": {
                        "total": total_proposals,
                        "this_week": proposals_week,
                        "avg_per_project": round(total_proposals / max(total_projects, 1), 2)
                    },
                    "contracts": {
                        "total": total_contracts,
                        "active": active_contracts,
                        "conversion_rate": round(total_contracts / max(total_proposals, 1) * 100, 2)
                    }
                },
                "health_scores": {
                    "engagement": round(engagement_score, 1),
                    "activity": round(activity_score, 1),
                    "conversion": round(conversion_score, 1)
                },
                "alerts": self._generate_health_alerts(
                    engagement_score, activity_score, conversion_score
                )
            }
            
        except Exception as e:
            logger.error(f"Platform health error: {str(e)}")
            raise
    
    # =========================================================================
    # Helper Methods
    # =========================================================================
    
    def _generate_cohort_insights(
        self,
        cohort_data: List[Dict],
        retention_curve: List[Dict]
    ) -> List[str]:
        """Generate insights from cohort analysis."""
        insights = []
        
        if retention_curve:
            # Check retention drop-off
            if len(retention_curve) >= 2:
                first_period = retention_curve[0]["average_retention"]
                second_period = retention_curve[1]["average_retention"]
                drop = first_period - second_period
                
                if drop > 30:
                    insights.append(f"High early churn: {drop:.1f}% drop in first period")
                elif drop < 10:
                    insights.append(f"Strong early retention: only {drop:.1f}% drop")
            
            # Check long-term retention
            if len(retention_curve) >= 4:
                fourth_period = retention_curve[3]["average_retention"]
                if fourth_period > 30:
                    insights.append(f"Good long-term retention: {fourth_period:.1f}% at period 4")
                elif fourth_period < 10:
                    insights.append(f"Low long-term retention: only {fourth_period:.1f}% at period 4")
        
        if cohort_data:
            # Find best performing cohort
            best_cohort = max(cohort_data, key=lambda c: c["periods"][0]["retention_rate"] if c["periods"] else 0)
            insights.append(f"Best performing cohort: {best_cohort['cohort']}")
        
        return insights
    
    def _generate_health_alerts(
        self,
        engagement: float,
        activity: float,
        conversion: float
    ) -> List[Dict[str, str]]:
        """Generate alerts based on health scores."""
        alerts = []
        
        if engagement < 30:
            alerts.append({
                "level": "critical",
                "metric": "engagement",
                "message": "User engagement critically low"
            })
        elif engagement < 50:
            alerts.append({
                "level": "warning",
                "metric": "engagement",
                "message": "User engagement below target"
            })
        
        if activity < 30:
            alerts.append({
                "level": "critical",
                "metric": "activity",
                "message": "Platform activity critically low"
            })
        elif activity < 50:
            alerts.append({
                "level": "warning",
                "metric": "activity",
                "message": "Platform activity below target"
            })
        
        if conversion < 20:
            alerts.append({
                "level": "critical",
                "metric": "conversion",
                "message": "Conversion rate critically low"
            })
        elif conversion < 40:
            alerts.append({
                "level": "warning",
                "metric": "conversion",
                "message": "Conversion rate below target"
            })
        
        return alerts


# Singleton instance
_analytics_service: Optional[AdvancedAnalyticsService] = None


def get_advanced_analytics_service() -> AdvancedAnalyticsService:
    """Get or create analytics service instance."""
    global _analytics_service
    if _analytics_service is None:
        _analytics_service = AdvancedAnalyticsService()
    return _analytics_service
