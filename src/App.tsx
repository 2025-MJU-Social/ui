import React, { useState } from "react";
import "./App.css";

interface RecommendRequest {
    age: number;
    sex: string;
    liked_titles: string[];
}

interface OttRecommendation {
    OTT: string;
    score: number;
}

function App() {
    const [age, setAge] = useState<number>(20);
    const [sex, setSex] = useState<string>("m");
    const [likedTitles, setLikedTitles] = useState<string>("");
    const [recommendations, setRecommendations] = useState<OttRecommendation[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const requestData: RecommendRequest = {
                age: age,
                sex: sex,
                liked_titles: likedTitles.split(",").map((title) => title.trim()),
            };

            const response = await fetch("http://127.0.0.1:8000/recommend", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(requestData),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            setRecommendations(data);
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
                        <h2>OTT 및 콘텐츠 추천</h2>
                    </header>
                    <section id="input-section">
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label htmlFor="age">나이:</label>
                                <input
                                    type="number"
                                    id="age"
                                    value={age}
                                    onChange={(e) => setAge(parseInt(e.target.value) || 0)}
                                    min="0"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="sex">성별:</label>
                                <select id="sex" value={sex} onChange={(e) => setSex(e.target.value)} required>
                                    <option value="m">남성</option>
                                    <option value="f">여성</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="liked-titles">좋아하는 콘텐츠 (콤마로 구분):</label>
                                <input
                                    type="text"
                                    id="liked-titles"
                                    value={likedTitles}
                                    onChange={(e) => setLikedTitles(e.target.value)}
                                    placeholder="예: 오징어 게임, 슬기로운 의사생활"
                                    required
                                />
                            </div>

                            <button type="submit" disabled={isLoading}>
                                {isLoading ? "검색 중..." : "추천 받기"}
                            </button>
                        </form>
                    </section>

                    {error && <div className="error-message">{error}</div>}

                    {recommendations.length > 0 && (
                        <section id="results-section">
                            <h3>추천 결과</h3>
                            <div className="results-container">
                                {recommendations.map((rec, index) => (
                                    <div key={index} className="result-item">
                                        <span className="ott-name">{rec.OTT}</span>
                                        <span className="ott-score">점수: {rec.score.toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </div>
    );
}

export default App;
