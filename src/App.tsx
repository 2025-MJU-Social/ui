import React, { useState } from "react";
import "./App.css";
import InputForm from "./components/InputForm";
import YearlySummary from "./components/YearlySummary";
import MonthlyCalendar from "./components/MonthlyCalendar";
import SubscriptionTimeline from "./components/SubscriptionTimeline";
import {
    YearlyPlan,
    MonthlyRecommendation,
    BasicRecommendation,
    OttRecommendationResponse,
    OttRecommendationItem,
    SubscriptionPlan,
} from "./types/ottTypes";

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
            console.log(basicData);
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
            console.log(ottData);
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

    // 1. 플랫폼별 등장 횟수 집계 함수
    function getTopOttPlatforms(recommendations: OttRecommendationItem[], topN = 3) {
        const count: { [platform: string]: number } = {};
        recommendations.forEach((item) => {
            item.platform
                .split(",")
                .map((p) => p.trim())
                .forEach((platform) => {
                    if (platform) count[platform] = (count[platform] || 0) + 1;
                });
        });
        // 등장 횟수 내림차순 정렬 후 상위 N개 추출
        return Object.entries(count)
            .sort((a, b) => b[1] - a[1])
            .slice(0, topN)
            .map(([platform, cnt]) => ({ platform, count: cnt }));
    }

    // 플랫폼명과 구독플랜 key를 유연하게 매칭 (한글/영문, 대소문자, 특수문자, 공백 등 최대한 허용)
    function normalizePlatformName(name: string) {
        return name
            .toLowerCase()
            .replace(/\s+/g, "")
            .replace(/[+]/g, "plus")
            .replace(/-/g, "")
            .replace(/_/g, "")
            .replace(/tv/g, "")
            .replace(/\(.*?\)/g, "")
            .replace(/\./g, "")
            .replace(/쿠팡플레이/g, "coupangplay")
            .replace(/왓챠/g, "watcha")
            .replace(/웨이브/g, "wavve")
            .replace(/티빙/g, "tving")
            .replace(/디즈니플러스/g, "disneyplus")
            .replace(/애플tv/g, "appletv")
            .replace(/넷플릭스/g, "netflix")
            .replace(/유플러스|u\+모바일tv|uplus/g, "uplusmobile");
    }
    function getPlanForPlatform(platform: string, subscriptionPlan: any) {
        const normPlatform = normalizePlatformName(platform);
        const keys = Object.keys(subscriptionPlan);
        for (const key of keys) {
            const normKey = normalizePlatformName(key);
            if (normPlatform === normKey || normPlatform.includes(normKey) || normKey.includes(normPlatform)) {
                return key;
            }
        }
        return undefined;
    }

    return (
        <div className="App">
            <div id="layout">
                <div id="layout-wrapper">
                    <header id="header">
                        <h2>스마트 월별 OTT 로테이션</h2>
                    </header>

                    <InputForm
                        ageGroup={ageGroup}
                        setAgeGroup={setAgeGroup}
                        gender={gender}
                        setGender={setGender}
                        likedTitles={likedTitles}
                        setLikedTitles={setLikedTitles}
                        baseGenres={baseGenres}
                        setBaseGenres={setBaseGenres}
                        detailGenres={detailGenres}
                        setDetailGenres={setDetailGenres}
                        weeklyHours={weeklyHours}
                        setWeeklyHours={setWeeklyHours}
                        monthlyBudget={monthlyBudget}
                        setMonthlyBudget={setMonthlyBudget}
                        handleSubmit={handleSubmit}
                        isLoading={isLoading}
                    />

                    {error && <div className="error-message">{error}</div>}

                    {/* 기본 추천 결과 별도 출력 */}
                    {basicRecommendations.length > 0 && (
                        <section id="basic-recommend-section">
                            <h3>1️⃣ 기본 OTT 추천 결과</h3>
                            <div className="basic-recommend-list">
                                {basicRecommendations.map((rec, idx) => (
                                    <div key={rec.OTT} className="basic-recommend-item">
                                        <span className="ott-name">{rec.OTT}</span>
                                        <span className="ott-score">점수: {rec.score}</span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* OTT 상세 추천 결과 별도 출력 */}
                    {ottRecommendations && (
                        <section id="ott-recommend-section">
                            <h3>2️⃣ OTT 상세 추천 결과</h3>
                            <div className="ott-recommend-summary">
                                <div>총 예상 시청 시간: {ottRecommendations.total_estimated_watch_time}시간</div>
                                <div>총 구독 비용: {ottRecommendations.total_subscription_cost.toLocaleString()}원</div>
                            </div>
                            <div className="ott-recommend-list">
                                {ottRecommendations.recommendations.map((item, idx) => (
                                    <div key={item.title + idx} className="ott-recommend-item">
                                        <div className="ott-title">{item.title}</div>
                                        <div>플랫폼: {item.platform}</div>
                                        <div>
                                            장르: {item.genre} / {item.genre_detail}
                                        </div>
                                        <div>예상 시청 시간: {item.watch_hours}h</div>
                                        <div>점수: {item.score}</div>
                                    </div>
                                ))}
                            </div>
                            {/* 추천 OTT 플랫폼 */}
                            <div className="ott-recommend-section">
                                <h4>추천 OTT 구독 플랜</h4>
                                <ul>
                                    {Object.entries(ottRecommendations.subscription_plan).map(
                                        ([platform, plan]: [string, any]) => (
                                            <li key={platform}>
                                                <span className="top3-platform">{platform}</span>
                                                <span className="plan-name">{plan.plan_name}</span>
                                                <span className="plan-price">{plan.price.toLocaleString()}원</span>
                                            </li>
                                        )
                                    )}
                                </ul>
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </div>
    );
}

export default App;
