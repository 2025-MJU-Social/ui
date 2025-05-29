import React, { useState } from "react";
import "./App.css";
import InputForm from "./components/InputForm";
import { BasicRecommendation, OttRecommendationResponse } from "./types/ottTypes";

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
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>("");

    const handleSubmit = async () => {
        setIsLoading(true);
        setError("");
        setBasicRecommendations([]);
        setOttRecommendations(null);

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

            // 두 번째 API 호출 (/ott_recommend) - 월 예산 그대로 전달
            const ottRequest = {
                base_genres: baseGenresArray,
                detail_genres: detailGenresArray,
                age_group: ageGroup,
                gender: gender,
                weekly_hours: weeklyHours,
                budget: monthlyBudget, // 월 예산 그대로 전달
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
                                        ([key, plan]: [string, any]) => {
                                            const [serviceName, planName] = key.split("|");
                                            return (
                                                <li key={key}>
                                                    <span className="platform">{serviceName}</span>
                                                    <span className="plan-name">{planName}</span>
                                                    <span className="plan-price">{plan.price.toLocaleString()}원</span>
                                                    <span className="cover-count">{plan.cover_count}개 콘텐츠</span>
                                                </li>
                                            );
                                        }
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
