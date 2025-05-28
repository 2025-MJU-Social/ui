import React from "react";

interface InputFormProps {
    ageGroup: string;
    setAgeGroup: (v: string) => void;
    gender: string;
    setGender: (v: string) => void;
    likedTitles: string;
    setLikedTitles: (v: string) => void;
    baseGenres: string;
    setBaseGenres: (v: string) => void;
    detailGenres: string;
    setDetailGenres: (v: string) => void;
    weeklyHours: number;
    setWeeklyHours: (v: number) => void;
    monthlyBudget: number;
    setMonthlyBudget: (v: number) => void;
    handleSubmit: () => void;
    isLoading: boolean;
}

const InputForm: React.FC<InputFormProps> = ({
    ageGroup,
    setAgeGroup,
    gender,
    setGender,
    likedTitles,
    setLikedTitles,
    baseGenres,
    setBaseGenres,
    detailGenres,
    setDetailGenres,
    weeklyHours,
    setWeeklyHours,
    monthlyBudget,
    setMonthlyBudget,
    handleSubmit,
    isLoading,
}) => (
    <section id="input-section">
        <div>
            <div className="input-grid">
                <div className="form-group">
                    <label htmlFor="age-group">연령대:</label>
                    <select id="age-group" value={ageGroup} onChange={(e) => setAgeGroup(e.target.value)}>
                        <option value="10대">10대</option>
                        <option value="20대">20대</option>
                        <option value="30대">30대</option>
                        <option value="40대">40대</option>
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
                {isLoading ? "검색 중..." : "검색하기"}
            </button>
        </div>
    </section>
);

export default InputForm;
