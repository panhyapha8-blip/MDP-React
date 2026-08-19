import { useSupabaseTable } from "../hooks/useSupabaseTable";
import "./DashboardPage.css";
import { useState, useEffect } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useNavigate } from "react-router-dom";

function initials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

function DashboardPage() {
  const { data, loading, error } = useSupabaseTable("dashboard_stats");
  const { data: schools } = useSupabaseTable("world_schools");
  const { data: professors } = useSupabaseTable("world_professors");
  const { data: categories } = useSupabaseTable("student_categories");
  const { data: courses } = useSupabaseTable("course_demand");

  const [showAllSchools, setShowAllSchools] = useState(false);
  const [showAllProfessors, setShowAllProfessors] = useState(false);
  const [courseCategory, setCourseCategory] = useState("science");
  const [isMobile, setIsMobile] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const navigate = useNavigate();

  const quotes = [
    "Fortune favors the bold",
    "Silence is a true friend that never betrays",
    "Drop by drop is the water pot filled",
    "Mastery of self is true power",
    "Action expresses priorities",
    "Patience is bitter, but its fruit is sweet",
    "Simplicity is the ultimate sophistication",
    "He who moves a mountain begins by carrying away small stones",
    "What you seek is seeking you",
    "Doubt kills more dreams than failure ever will",
  ];

  // Modern fade rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % quotes.length);
    }, 3200);

    return () => clearInterval(interval);
  }, []);

  if (loading) return <p className="dash-loading">Loading...</p>;
  if (error)
    return (
      <div className="alert alert-danger m-3" role="alert">
        There is an error: {error}
      </div>
    );

  const tooltipStyle = {
    background: "#14141f",
    border: "1px solid rgba(201, 169, 97, 0.4)",
    borderRadius: 8,
    color: "#f0e6d2",
    fontSize: 13,
  };

  return (
    <div className="dashboard-container">
      <button className="back-btn" onClick={() => window.history.back()}>
        ← Back
      </button>

      {/* ===== Motion Bar (Modern Fade) ===== */}
      <div className="motion-bar">
        <div className="motion-bar-content">
          {quotes.map((quote, i) => (
            <span
              key={i}
              className={`quote ${i === quoteIndex ? "active" : ""}`}
            >
              {quote}
            </span>
          ))}
        </div>
      </div>

      <section className="dash-section">
        <span className="section-eyebrow">Institutions</span>
        <h2>Top Universities Around the World</h2>
        <div className="index-grid">
          {[...(schools || [])]
            .sort((a, b) => a.rank - b.rank)
            .slice(0, showAllSchools ? undefined : 10)
            .map((s) => (
              <div key={s.id} className="index-card">
                <span className="tab" />
                <div className="card-with-logo">
                  {s.image_url ? (
                    <img
                      src={s.image_url}
                      alt={s.name}
                      className="school-logo"
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.nextSibling.style.display = "flex";
                      }}
                    />
                  ) : null}
                  <div
                    className="school-logo-fallback"
                    style={{ display: s.image_url ? "none" : "flex" }}
                  >
                    {s.name?.[0]}
                  </div>
                  <div>
                    <span className="card-no">
                      {String(s.rank).padStart(2, "0")}
                    </span>
                    <h3>{s.name}</h3>
                    <p className="meta">{s.country}</p>
                  </div>
                </div>
              </div>
            ))}
        </div>
        {schools?.length > 10 && (
          <button
            className="check-more-btn"
            onClick={() => setShowAllSchools((v) => !v)}
          >
            {showAllSchools
              ? "Show Less"
              : `Show More (${schools.length - 10} More)`}
          </button>
        )}
      </section>

      <section className="dash-section">
        <span className="section-eyebrow">People</span>
        <h2>Top Professors Around the World</h2>
        <div className="index-grid">
          {professors
            ?.slice(0, showAllProfessors ? undefined : 10)
            .map((p) => (
              <div key={p.id} className="index-card">
                <span className="tab" />
                <div className="card-with-logo">
                  {p.image_url ? (
                    <img
                      src={p.image_url}
                      alt={p.name}
                      className="school-logo"
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.nextSibling.style.display = "flex";
                      }}
                    />
                  ) : null}
                  <div
                    className="avatar"
                    style={{ display: p.image_url ? "none" : "flex" }}
                  >
                    {initials(p.name)}
                  </div>
                  <div>
                    <h3>{p.name}</h3>
                    <p className="meta accent">{p.field}</p>
                    <p className="meta">
                      {p.university}, {p.country}
                    </p>
                  </div>
                </div>
              </div>
            ))}
        </div>
        {professors?.length > 10 && (
          <button
            className="check-more-btn"
            onClick={() => setShowAllProfessors((v) => !v)}
          >
            {showAllProfessors
              ? "Show Less"
              : `Show More (${professors.length - 10} More)`}
          </button>
        )}
      </section>

      <section className="dash-section">
        <span className="section-eyebrow">Distribution</span>
        <h2>Science Students vs Social Science Students</h2>
        <div className="chart-panel">
          <ResponsiveContainer width="100%" height={isMobile ? 220 : 280}>
            <BarChart
              data={categories}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(201,169,97,0.12)"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                stroke="#a89f8f"
                tick={{
                  fontSize: 12,
                  fontFamily: "IBM Plex Mono, monospace",
                  fill: "#a89f8f",
                }}
                axisLine={{ stroke: "rgba(201,169,97,0.25)" }}
                tickLine={false}
              />
              <YAxis
                stroke="#a89f8f"
                tick={{
                  fontSize: 12,
                  fontFamily: "IBM Plex Mono, monospace",
                  fill: "#a89f8f",
                }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                cursor={{ fill: "rgba(201,169,97,0.08)" }}
              />
              <Bar dataKey="count" fill="#c9a961" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="dash-section">
        <span className="section-eyebrow">Demand</span>
        <h2>Course Demand</h2>
        <div className="chart-toggle">
          <button
            className={`toggle-btn ${courseCategory === "science" ? "active" : ""}`}
            onClick={() => setCourseCategory("science")}
          >
            Science
          </button>
          <button
            className={`toggle-btn ${courseCategory === "social" ? "active" : ""}`}
            onClick={() => setCourseCategory("social")}
          >
            Social Science
          </button>
        </div>
        <div className="chart-panel">
          <ResponsiveContainer width="100%" height={isMobile ? 220 : 280}>
            <LineChart
              data={courses?.filter((c) => c.category === courseCategory)}
              margin={{ top: 8, right: 8, left: 30, bottom: 80 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(201,169,97,0.12)"
                vertical={false}
              />
              <XAxis
                dataKey="course_name"
                stroke="#a89f8f"
                tick={{
                  fontSize: 10,
                  fontFamily: "IBM Plex Mono, monospace",
                  fill: "#a89f8f",
                }}
                axisLine={{ stroke: "rgba(201,169,97,0.25)" }}
                tickLine={false}
                angle={-45}
                textAnchor="end"
                interval={0}
              />
              <YAxis
                stroke="#a89f8f"
                tick={{
                  fontSize: 12,
                  fontFamily: "IBM Plex Mono, monospace",
                  fill: "#a89f8f",
                }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                cursor={{ stroke: "rgba(201,169,97,0.3)" }}
              />
              <Line
                type="monotone"
                dataKey="demand_count"
                stroke="#e8c988"
                strokeWidth={2.5}
                dot={{ fill: "#c9a961", r: 3 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}

export default DashboardPage;