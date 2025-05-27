import React from "react";
import { YearlyPlan, MonthlyRecommendation, OttRecommendationItem } from "../types/ottTypes";

interface MonthlyCalendarProps {
    yearlyPlan: YearlyPlan;
}

const MonthlyCalendar: React.FC<MonthlyCalendarProps> = ({ yearlyPlan }) => (
    <div className="monthly-calendar">
        <h3>📅 월별 구독 캘린더</h3>
        <div className="calendar-grid">
            {yearlyPlan.monthlyPlans.map((plan: MonthlyRecommendation, index: number) => (
                <div key={plan.month} className="month-card">
                    <div className="month-header">
                        <span className="month-name">{plan.monthName}</span>
                        <span className="month-cost">{plan.price.toLocaleString()}원</span>
                    </div>
                    <div className="platform-info">
                        <span className="platform-name">{plan.platform}</span>
                        <span className="platform-plan">{plan.planName}</span>
                    </div>
                    <div className="month-stats">
                        <div className="stat">
                            <span>예상 시청: {plan.totalWatchHours.toFixed(1)}h</span>
                        </div>
                        <div className="stat">
                            <span>추천 콘텐츠: {plan.contents.length}개</span>
                        </div>
                    </div>
                    <div className="content-preview">
                        {plan.contents.slice(0, 2).map((content: OttRecommendationItem, idx: number) => (
                            <div key={idx} className="preview-item">
                                <span className="content-title">{content.title}</span>
                                <span className="content-hours">{content.watch_hours.toFixed(1)}h</span>
                            </div>
                        ))}
                        {plan.contents.length > 2 && (
                            <div className="preview-more">+{plan.contents.length - 2}개 더</div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    </div>
);

export default MonthlyCalendar;
