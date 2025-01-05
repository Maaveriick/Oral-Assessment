import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Chart, registerables } from "chart.js";

// Register necessary Chart.js components
Chart.register(...registerables);

const ClassAnalysis = () => {
  const chartRef = useRef(null);
  const canvasRef = useRef(null);
  const [chartType, setChartType] = useState("bar");
  const [grades, setGrades] = useState([]);
  const [classAverage, setClassAverage] = useState(0);
  const [gradeDistribution, setGradeDistribution] = useState({
    A: 0,
    B: 0,
    C: 0,
    D: 0,
    F: 0,
  });

  const fetchGrades = async () => {
    const classId = new URLSearchParams(window.location.search).get("classId");
    const teacherUsername = "teacher1"; // Replace with actual teacher username from login/session
    
    // Log the values for debugging
    console.log(`Fetching grades for classId: ${classId}, teacherUsername: ${teacherUsername}`);
  
    try {
      const response = await axios.get(
        `http://localhost:5000/grades?classId=${classId}&teacherUsername=${teacherUsername}`
      );
      setGrades(response.data.grades);
      setClassAverage(response.data.classAverage);
      setGradeDistribution(response.data.gradeDistribution);
    } catch (error) {
      console.error("Error fetching grades:", error);
    }
  };
  
  

  const chartData = {
    labels: ["A", "B", "C", "D", "F"],
    datasets: [
      {
        label: "Grade Distribution",
        data: [
          gradeDistribution.A,
          gradeDistribution.B,
          gradeDistribution.C,
          gradeDistribution.D,
          gradeDistribution.F,
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
    fetchGrades();
  }, []);

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
      <h2 className="text-center mb-4 text-primary">Grade Analysis Dashboard</h2>

      <div className="mb-4">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h4>Class Average Grade: {classAverage.toFixed(2)}</h4>
            <h4>Number of Distinctions (A): {gradeDistribution.A} </h4> 
           <h4> Number of Failures (F): {gradeDistribution.F}</h4>
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

export default ClassAnalysis;
