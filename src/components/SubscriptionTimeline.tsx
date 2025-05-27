import React from "react";
import { YearlyPlan, MonthlyRecommendation } from "../types/ottTypes";

interface SubscriptionTimelineProps {
    yearlyPlan: YearlyPlan;
}

const SubscriptionTimeline: React.FC<SubscriptionTimelineProps> = ({ yearlyPlan }) => (
    <div className="subscription-timeline">
        <h3>🔔 구독 관리 알림</h3>
        <div className="timeline-list">
            {yearlyPlan.monthlyPlans.map((plan: MonthlyRecommendation, index: number) => (
                <div key={plan.month} className="timeline-item">
                    <div className="timeline-date">{plan.monthName} 1일</div>
                    <div className="timeline-action">
                        {index > 0 && yearlyPlan.monthlyPlans[index - 1].platform !== plan.platform && (
                            <span className="action-cancel">{yearlyPlan.monthlyPlans[index - 1].platform} 해지 →</span>
                        )}
                        <span className="action-subscribe">{plan.platform} 구독 시작</span>
                    </div>
                    <div className="timeline-cost">{plan.price.toLocaleString()}원</div>
                </div>
            ))}
        </div>
    </div>
);

export default SubscriptionTimeline;
