export interface BasicRecommendation {
    OTT: string;
    score: number;
}

export interface OttRecommendationItem {
    title: string;
    platform: string;
    score: number;
    watch_hours: number;
    genre: string;
    genre_detail: string;
}

export interface SubscriptionPlan {
    plan_name: string;
    price: number;
}

export interface OttRecommendationResponse {
    status: string;
    recommendations: OttRecommendationItem[];
    total_estimated_watch_time: number;
    total_subscription_cost: number;
    subscription_plan: { [key: string]: SubscriptionPlan };
}

export interface MonthlyRecommendation {
    month: number;
    monthName: string;
    platform: string;
    platformScore: number;
    price: number;
    planName: string;
    contents: OttRecommendationItem[];
    totalWatchHours: number;
    efficiency: number; // 시간/비용 효율성
}

export interface YearlyPlan {
    monthlyPlans: MonthlyRecommendation[];
    totalAnnualCost: number;
    averageMonthlyCost: number;
    totalSavings: number;
    utilizationRate: number;
}
