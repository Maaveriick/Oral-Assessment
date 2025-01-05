import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { Chart, registerables } from "chart.js";

// Register necessary Chart.js components
Chart.register(...registerables);

const IndividualAnalysis = () => {
  const { classId, userId } = useParams(); // Extract classId and userId from URL
  const [individualGrades, setIndividualGrades] = useState([]);
  const [averageGrade, setAverageGrade] = useState(null);
  const [gradeDistribution, setGradeDistribution] = useState({});
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [averageGradeDistribution, setAverageGradeDistribution] = useState("");
  const [chartType, setChartType] = useState("bar");

  const chartRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const fetchIndividualGrades = async () => {
      try {
        const response = await axios.get(
          `http://localhost:5000/individual-analysis?classId=${classId}&userId=${userId}`
        );
        setIndividualGrades(response.data.individualGrades);
        setAverageGrade(response.data.averageGrade);
        setGradeDistribution(response.data.gradeDistribution);
        setTotalAttempts(response.data.totalAttempts);
        setAverageGradeDistribution(response.data.averageGradeDistribution);
      } catch (error) {
        console.error("Error fetching individual grades:", error);
      }
    };

    fetchIndividualGrades();
  }, [classId, userId]);

  const chartData = {
    labels: ["A", "B", "C", "D", "F"],
    datasets: [
      {
        label: "Grade Distribution",
        data: [
          gradeDistribution.A || 0,
          gradeDistribution.B || 0,
          gradeDistribution.C || 0,
          gradeDistribution.D || 0,
          gradeDistribution.F || 0,
        ],
        backgroundColor: [
          "rgba(75, 192, 192, 0.2)",
          "rgba(54, 162, 235, 0.2)",
          "rgba(255, 206, 86, 0.2)",
          "rgba(255, 99, 132, 0.2)",
          "rgba(153, 102, 255, 0.2)",
        ],
        borderColor: [
          "rgba(75, 192, 192, 1)",
          "rgba(54, 162, 235, 1)",
          "rgba(255, 206, 86, 1)",
          "rgba(255, 99, 132, 1)",
          "rgba(153, 102, 255, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true },
      tooltip: { enabled: true },
    },
  };

  const renderChart = () => {
    if (chartRef.current) {
      chartRef.current.destroy(); // Destroy previous chart instance
    }

    chartRef.current = new Chart(canvasRef.current, {
      type: chartType,
      data: chartData,
      options: chartOptions,
    });
  };

  useEffect(() => {
    renderChart();
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [chartType, gradeDistribution]);

  return (
    <div className="container mt-5">
      <h2 className="text-center mb-4 text-primary">Individual Performance Analysis</h2>
      

      <table className="table">
        <thead>
          <tr>
            <th>Username</th>
            <th>Grade</th>
            <th>Attempt Count</th>
          </tr>
        </thead>
        <tbody>
          {individualGrades.length > 0 ? (
            individualGrades.map((gradeData) => (
              <tr key={gradeData.username}>
                <td>{gradeData.username}</td>
                <td>{gradeData.grade}</td>
                <td>{gradeData.attempt_count}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="3">No grades found for this user.</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Display Average Grade and Grade Distribution */}
      {averageGrade !== null && (
        <div className="mb-4">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h4>Average Grade : {averageGrade.toFixed(2)}</h4>
          <h4>Total Attempts: {totalAttempts}</h4>
          <h4>Average Grade Distribution: {averageGradeDistribution}</h4>
          </div>
          <h4>Grade Distribution:</h4>
          <ul style={{ display: "flex", justifyContent: "space-between", listStyle: "none", padding: 0 }}>
            <li>A: {gradeDistribution.A}</li>
            <li>B: {gradeDistribution.B}</li>
            <li>C: {gradeDistribution.C}</li>
            <li>D: {gradeDistribution.D}</li>
            <li>F: {gradeDistribution.F}</li>
          </ul>
        </div>
      )}

      <div>
        <label htmlFor="chartType">Select Chart Type:</label>
        <select
          id="chartType"
          value={chartType}
          onChange={(e) => setChartType(e.target.value)}
          style={{ marginLeft: "10px", marginBottom: "20px" }}
        >
          <option value="bar">Bar Chart</option>
          <option value="pie">Pie Chart</option>
          <option value="line">Line Chart</option>
        </select>
      </div>

      <div style={{ height: "400px", width: "1150px" }}>
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
};

export default IndividualAnalysis;
