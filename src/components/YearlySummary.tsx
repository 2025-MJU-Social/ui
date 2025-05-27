import React from "react";
import { YearlyPlan } from "../types/ottTypes";

interface YearlySummaryProps {
    yearlyPlan: YearlyPlan;
}

const YearlySummary: React.FC<YearlySummaryProps> = ({ yearlyPlan }) => (
    <div className="yearly-summary">
        <h3>📊 연간 구독 계획 요약</h3>
        <div className="summary-stats">
            <div className="stat-item">
                <span className="stat-label">연간 총 비용</span>
                <span className="stat-value">{yearlyPlan.totalAnnualCost.toLocaleString()}원</span>
            </div>
            <div className="stat-item">
                <span className="stat-label">월 평균 비용</span>
                <span className="stat-value">{Math.round(yearlyPlan.averageMonthlyCost).toLocaleString()}원</span>
            </div>
            <div className="stat-item success">
                <span className="stat-label">예상 절약액</span>
                <span className="stat-value">{yearlyPlan.totalSavings.toLocaleString()}원</span>
            </div>
            <div className="stat-item">
                <span className="stat-label">콘텐츠 활용률</span>
                <span className="stat-value">{yearlyPlan.utilizationRate.toFixed(1)}%</span>
            </div>
        </div>
    </div>
);

export default YearlySummary;
