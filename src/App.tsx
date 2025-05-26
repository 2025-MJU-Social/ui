import React, { useState } from "react";
import "./App.css";

// 기본 추천 응답
interface BasicRecommendation {
    OTT: string;
    score: number;
}

// OTT 추천 응답
interface OttRecommendationItem {
    title: string;
    platform: string;
    score: number;
    watch_hours: number;
    genre: string;
    genre_detail: string;
}

interface SubscriptionPlan {
    plan_name: string;
    price: number;
}

interface OttRecommendationResponse {
    status: string;
    recommendations: OttRecommendationItem[];
    total_estimated_watch_time: number;
    total_subscription_cost: number;
    subscription_plan: { [key: string]: SubscriptionPlan };
}

// 월별 추천 인터페이스
interface MonthlyRecommendation {
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

// 연간 추천 결과
interface YearlyPlan {
    monthlyPlans: MonthlyRecommendation[];
    totalAnnualCost: number;
    averageMonthlyCost: number;
    totalSavings: number;
    utilizationRate: number;
}

function App() {
    // 공통 입력 상태
    const [ageGroup, setAgeGroup] = useState<string>("20대");
    const [gender, setGender] = useState<string>("m");
    const [likedTitles, setLikedTitles] = useState<string>("");
    const [baseGenres, setBaseGenres] = useState<string>("");
    const [detailGenres, setDetailGenres] = useState<string>("");
    const [weeklyHours, setWeeklyHours] = useState<number>(12);
    const [monthlyBudget, setMonthlyBudget] = useState<number>(10000);

    // 결과 상태
    const [basicRecommendations, setBasicRecommendations] = useState<BasicRecommendation[]>([]);
    const [ottRecommendations, setOttRecommendations] = useState<OttRecommendationResponse | null>(null);
    const [yearlyPlan, setYearlyPlan] = useState<YearlyPlan | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>("");

    const monthNames = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];

    // 월별 로테이션 계획 생성
    const generateYearlyPlan = (basic: BasicRecommendation[], ott: OttRecommendationResponse): YearlyPlan => {
        const monthlyHours = weeklyHours * 4;

        // 플랫폼별 콘텐츠 그룹화
        const platformContents: { [key: string]: OttRecommendationItem[] } = {};
        ott.recommendations.forEach((content) => {
            const platforms = content.platform.split(",").map((p) => p.trim());
            platforms.forEach((platform) => {
                if (!platformContents[platform]) {
                    platformContents[platform] = [];
                }
                platformContents[platform].push(content);
            });
        });

        // 추천 플랫폼 데이터 생성
        const platformData = basic
            .filter((rec) => rec.score > 0)
            .map((basicRec) => {
                const contents = platformContents[basicRec.OTT] || [];
                const subscriptionInfo = ott.subscription_plan[basicRec.OTT];

                if (contents.length > 0 && subscriptionInfo) {
                    const totalWatchHours = contents.reduce((sum, content) => sum + content.watch_hours, 0);
                    const efficiency = (totalWatchHours / subscriptionInfo.price) * 1000; // 1000원당 시청 시간

                    return {
                        platform: basicRec.OTT,
                        platformScore: basicRec.score,
                        price: subscriptionInfo.price,
                        planName: subscriptionInfo.plan_name,
                        contents: contents,
                        totalWatchHours,
                        efficiency,
                    };
                }
                return null;
            })
            .filter((item) => item !== null)
            .sort((a, b) => b!.efficiency - a!.efficiency); // 효율성 순 정렬

        // 월별 할당 로직
        const monthlyPlans: MonthlyRecommendation[] = [];
        let currentMonth = 0;
        let remainingAnnualBudget = monthlyBudget * 12;

        // 플랫폼을 효율성과 선호도 기준으로 월별 분배
        platformData.forEach((platform, index) => {
            if (platform && remainingAnnualBudget >= platform.price) {
                // 각 플랫폼당 할당할 월 수 계산 (콘텐츠 양과 효율성 기반)
                const contentHours = platform.totalWatchHours;
                const recommendedMonths = Math.min(
                    Math.ceil(contentHours / monthlyHours), // 콘텐츠 소화 기간
                    Math.floor(remainingAnnualBudget / platform.price), // 예산 제한
                    3 // 최대 3개월
                );

                for (let i = 0; i < recommendedMonths && currentMonth < 12; i++) {
                    monthlyPlans.push({
                        month: currentMonth + 1,
                        monthName: monthNames[currentMonth],
                        platform: platform.platform,
                        platformScore: platform.platformScore,
                        price: platform.price,
                        planName: platform.planName,
                        contents: platform.contents.slice(0, Math.ceil(platform.contents.length / recommendedMonths)),
                        totalWatchHours: contentHours / recommendedMonths,
                        efficiency: platform.efficiency,
                    });

                    remainingAnnualBudget -= platform.price;
                    currentMonth++;
                }
            }
        });

        // 빈 달 채우기 (가장 효율적인 플랫폼으로)
        while (currentMonth < 12 && platformData.length > 0) {
            const bestPlatform = platformData[0];
            if (bestPlatform && remainingAnnualBudget >= bestPlatform.price) {
                monthlyPlans.push({
                    month: currentMonth + 1,
                    monthName: monthNames[currentMonth],
                    platform: bestPlatform.platform,
                    platformScore: bestPlatform.platformScore,
                    price: bestPlatform.price,
                    planName: bestPlatform.planName,
                    contents: bestPlatform.contents.slice(0, 5),
                    totalWatchHours: Math.min(bestPlatform.totalWatchHours, monthlyHours),
                    efficiency: bestPlatform.efficiency,
                });
                remainingAnnualBudget -= bestPlatform.price;
                currentMonth++;
            } else {
                break;
            }
        }

        const totalAnnualCost = monthlyPlans.reduce((sum, plan) => sum + plan.price, 0);
        const averageMonthlyCost = totalAnnualCost / 12;
        const worstCaseAnnualCost = Math.max(...platformData.map((p) => p?.price || 0)) * 12;
        const totalSavings = worstCaseAnnualCost - totalAnnualCost;
        const utilizationRate =
            (monthlyPlans.reduce((sum, plan) => sum + plan.totalWatchHours, 0) / (monthlyHours * 12)) * 100;

        return {
            monthlyPlans,
            totalAnnualCost,
            averageMonthlyCost,
            totalSavings,
            utilizationRate,
        };
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        setError("");
        setBasicRecommendations([]);
        setOttRecommendations(null);
        setYearlyPlan(null);

        try {
            // 입력 데이터 준비
            const likedTitlesArray = likedTitles
                .split(",")
                .map((title) => title.trim())
                .filter((title) => title);
            const baseGenresArray = baseGenres
                .split(",")
                .map((genre) => genre.trim())
                .filter((genre) => genre);
            const detailGenresArray = detailGenres
                .split(",")
                .map((genre) => genre.trim())
                .filter((genre) => genre);

            // 첫 번째 API 호출 (/recommend)
            const basicRequest = {
                age_group: ageGroup,
                gender: gender,
                liked_titles: likedTitlesArray,
            };

            const basicResponse = await fetch("http://127.0.0.1:8000/recommend", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(basicRequest),
            });

            if (!basicResponse.ok) {
                throw new Error(`기본 추천 API 오류! Status: ${basicResponse.status}`);
            }

            const basicData = await basicResponse.json();
            setBasicRecommendations(basicData.recommendations || []);

            // 두 번째 API 호출 (/ott_recommend) - 연간 예산으로 계산
            const ottRequest = {
                base_genres: baseGenresArray,
                detail_genres: detailGenresArray,
                age_group: ageGroup,
                gender: gender,
                weekly_hours: weeklyHours,
                budget: monthlyBudget * 12, // 연간 예산으로 전달
            };

            const ottResponse = await fetch("http://127.0.0.1:8000/ott_recommend", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(ottRequest),
            });

            if (!ottResponse.ok) {
                throw new Error(`OTT 추천 API 오류! Status: ${ottResponse.status}`);
            }

            const ottData = await ottResponse.json();
            setOttRecommendations(ottData);

            // 연간 계획 생성
            if (basicData.recommendations && ottData) {
                const plan = generateYearlyPlan(basicData.recommendations, ottData);
                setYearlyPlan(plan);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="App">
            <div id="layout">
                <div id="layout-wrapper">
                    <header id="header">
                        <h2>스마트 월별 OTT 로테이션</h2>
                    </header>

                    <section id="input-section">
                        <div>
                            <div className="input-grid">
                                <div className="form-group">
                                    <label htmlFor="age-group">연령대:</label>
                                    <select
                                        id="age-group"
                                        value={ageGroup}
                                        onChange={(e) => setAgeGroup(e.target.value)}
                                    >
                                        <option value="10대">10대</option>
                                        <option value="20대">20대</option>
                                        <option value="30대">30대</option>
                                        <option value="40대">40대</option>
                                        <option value="50대">50대</option>
                                        <option value="50대 이상">50대 이상</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="gender">성별:</label>
                                    <select id="gender" value={gender} onChange={(e) => setGender(e.target.value)}>
                                        <option value="m">남성</option>
                                        <option value="f">여성</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="liked-titles">좋아하는 콘텐츠 (콤마로 구분):</label>
                                <input
                                    type="text"
                                    id="liked-titles"
                                    value={likedTitles}
                                    onChange={(e) => setLikedTitles(e.target.value)}
                                    placeholder="예: 오징어 게임, 슬기로운 의사생활, 태어난김에 세계일주"
                                />
                            </div>

                            <div className="input-grid">
                                <div className="form-group">
                                    <label htmlFor="base-genres">선호 장르 (콤마로 구분):</label>
                                    <input
                                        type="text"
                                        id="base-genres"
                                        value={baseGenres}
                                        onChange={(e) => setBaseGenres(e.target.value)}
                                        placeholder="예: 드라마, 영화, 예능"
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="detail-genres">세부 장르 (콤마로 구분):</label>
                                    <input
                                        type="text"
                                        id="detail-genres"
                                        value={detailGenres}
                                        onChange={(e) => setDetailGenres(e.target.value)}
                                        placeholder="예: 스릴러, 로맨스, 액션"
                                    />
                                </div>
                            </div>

                            <div className="input-grid">
                                <div className="form-group">
                                    <label htmlFor="weekly-hours">주간 시청 시간 (시간):</label>
                                    <input
                                        type="number"
                                        id="weekly-hours"
                                        value={weeklyHours}
                                        onChange={(e) => setWeeklyHours(parseInt(e.target.value) || 0)}
                                        min="1"
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="budget">월 예산 (원):</label>
                                    <input
                                        type="number"
                                        id="budget"
                                        value={monthlyBudget}
                                        onChange={(e) => setMonthlyBudget(parseInt(e.target.value) || 0)}
                                        min="1000"
                                        step="1000"
                                    />
                                </div>
                            </div>

                            <button onClick={handleSubmit} disabled={isLoading}>
                                {isLoading ? "연간 계획 생성 중..." : "맞춤 연간 구독 계획 받기"}
                            </button>
                        </div>
                    </section>

                    {error && <div className="error-message">{error}</div>}

                    {yearlyPlan && (
                        <section id="results-section">
                            {/* 연간 요약 */}
                            <div className="yearly-summary">
                                <h3>📊 연간 구독 계획 요약</h3>
                                <div className="summary-stats">
                                    <div className="stat-item">
                                        <span className="stat-label">연간 총 비용</span>
                                        <span className="stat-value">
                                            {yearlyPlan.totalAnnualCost.toLocaleString()}원
                                        </span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-label">월 평균 비용</span>
                                        <span className="stat-value">
                                            {Math.round(yearlyPlan.averageMonthlyCost).toLocaleString()}원
                                        </span>
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

                            {/* 월별 구독 캘린더 */}
                            <div className="monthly-calendar">
                                <h3>📅 월별 구독 캘린더</h3>
                                <div className="calendar-grid">
                                    {yearlyPlan.monthlyPlans.map((plan, index) => (
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
                                                {plan.contents.slice(0, 2).map((content, idx) => (
                                                    <div key={idx} className="preview-item">
                                                        <span className="content-title">{content.title}</span>
                                                        <span className="content-hours">
                                                            {content.watch_hours.toFixed(1)}h
                                                        </span>
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

                            {/* 구독 알림 일정 */}
                            <div className="subscription-timeline">
                                <h3>🔔 구독 관리 알림</h3>
                                <div className="timeline-list">
                                    {yearlyPlan.monthlyPlans.map((plan, index) => (
                                        <div key={plan.month} className="timeline-item">
                                            <div className="timeline-date">{plan.monthName} 1일</div>
                                            <div className="timeline-action">
                                                {index > 0 &&
                                                    yearlyPlan.monthlyPlans[index - 1].platform !== plan.platform && (
                                                        <span className="action-cancel">
                                                            {yearlyPlan.monthlyPlans[index - 1].platform} 해지 →
                                                        </span>
                                                    )}
                                                <span className="action-subscribe">{plan.platform} 구독 시작</span>
                                            </div>
                                            <div className="timeline-cost">{plan.price.toLocaleString()}원</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </div>
    );
}

export default App;
