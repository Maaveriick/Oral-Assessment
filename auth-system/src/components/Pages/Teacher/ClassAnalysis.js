import React, { useState, useEffect } from "react";
import axios from "axios";
import { Box, Button, IconButton, Typography, useTheme } from "@mui/material";
import { tokens } from "../../../theme";
import { Select, MenuItem } from "@mui/material";  // Import Select and MenuItem components
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import SpellCheckIcon from "@mui/icons-material/Spellcheck";
import PendingIcon from "@mui/icons-material/Pending";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import TrafficIcon from "@mui/icons-material/Traffic";
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import Header from "../../Header";
import LineChart from "../../LineChart"; 
import PieChart from "../../PieChart"; 
import BarChart from "../../BarChart";
import StatBox from "../../StatBox";
import ProgressCircle from "../../ProgressCircle";
import { User } from "microsoft-cognitiveservices-speech-sdk";


const ClassAnalysis = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  // State for charts and grades data
  const [selectedChart, setSelectedChart] = useState("BarChart");
  const [grades, setGrades] = useState([]);
  const [classAverage, setClassAverage] = useState(null);
  const [gradeDistribution, setGradeDistribution] = useState([]);
  const [averageTime, setAverageTime] = useState(null); 
  const [totalAttempts, setTotalAttempts] = useState(0);
  
  

  const getGradeBand = (average) => {
    if (average >= 70) return 'A';
    if (average >= 60) return 'B';
    if (average >= 55) return 'C';
    if (average >= 50) return 'D';
    if (average >= 40) return 'E';
    else return 'F';
  };


  // Fetch grades data from backend
  const fetchGrades = async () => {
    const classId = new URLSearchParams(window.location.search).get("classId");
    const teacherUsername = "EthanChew"; // Replace with actual teacher username from login/session

    console.log(`Fetching grades for classId: ${classId}, teacherUsername: ${teacherUsername}`);
  
    try {
      const response = await axios.get(
        `http://localhost:5000/grades?classId=${classId}&teacherUsername=${teacherUsername}`
      );
      console.log("Response from server:", response.data);
  
      setGrades(response.data.grades || []);
      setClassAverage(response.data.classAverage || null);
      setGradeDistribution(response.data.gradeDistribution || []);
      setTotalAttempts(response.data.totalAttempts);
    } catch (error) {
      console.error("Error fetching grades:", error);
    }
  };
  

useEffect(() => {
  const classId = new URLSearchParams(window.location.search).get("classId"); // Extract classId from URL

  if (!classId) {
    console.error("Class ID is missing in URL");
    return;
  }

  axios.get(`http://localhost:5000/average-time?classId=${classId}`)
    .then((response) => {
      const avgTime = parseFloat(response.data.averageTime);
      setAverageTime(!isNaN(avgTime) ? avgTime : null);
    })
    .catch((error) => {
      console.error("Error fetching class-specific average time:", error);
    });
}, []);

  // Call fetchGrades and fetchAverageTime when the component mounts
  useEffect(() => {
    fetchGrades();
  }, []);

  // Handle changing the chart when a dropdown item is selected
  const handleChartSelect = (event) => {
    setSelectedChart(event.target.value);
  };

  return (
    <Box 
      m="0" 
      p="20px" 
      fontFamily="'Roboto', sans-serif" 
      backgroundColor="#f4f7fb" 
      width="100%" 
      minHeight="100vh" 
      display="flex" 
      flexDirection="column"
    >
      {/* HEADER */}
      <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
        <Header 
          title="PERFORMANCE DASHBOARD" 
          subtitle="Welcome to your dashboard"
          sx={{ fontSize: "24px", fontWeight: "bold", color: "#4a4e69" }} 
        />
  
        
      </Box>
  
      {/* GRID & CHARTS */}
      <Box 
        display="grid" 
        gridTemplateColumns="repeat(12, 1fr)" 
        gridAutoRows="140px" 
        gap="20px" 
        width="100%" 
        maxWidth="100%"
      >
        {/* ROW 1 */}
        <Box gridColumn="span 3" backgroundColor="white" boxShadow="0 4px 8px rgba(0, 0, 0, 0.1)" borderRadius="12px" display="flex" alignItems="center" justifyContent="center">
          <StatBox
            title="Average Grade Of Class"
            subtitle={classAverage ? `${classAverage.toPrecision(3)}%` : "Loading..."}
            progress="0.1"
            increase=""
            icon={<SpellCheckIcon sx={{ color: "#4a4e69", fontSize: "28px" }} />}
          />
        </Box>
  
        <Box gridColumn="span 3" backgroundColor="white" boxShadow="0 4px 8px rgba(0, 0, 0, 0.1)" borderRadius="12px" display="flex" alignItems="center" justifyContent="center">
          <StatBox
            title="Average Band Of Class"
            subtitle={classAverage ? `${getGradeBand(classAverage)}` : "Loading..."}
            progress="0.50"
            increase=""
            icon={<PendingIcon sx={{ color: "#4a4e69", fontSize: "28px" }} />}
          />
        </Box>
  
        <Box gridColumn="span 3" backgroundColor="white" boxShadow="0 4px 8px rgba(0, 0, 0, 0.1)" borderRadius="12px" display="flex" alignItems="center" justifyContent="center">
          <StatBox
            title="Total Attempts Of Class"
            subtitle={totalAttempts !== null ? totalAttempts : "Loading..."}
            progress="0.30"
            increase=""
            icon={<PersonAddIcon sx={{ color: "#4a4e69", fontSize: "28px" }} />}
          />
        </Box>
  
        <Box gridColumn="span 3" backgroundColor="white" boxShadow="0 4px 8px rgba(0, 0, 0, 0.1)" borderRadius="12px" display="flex" alignItems="center" justifyContent="center">
          <StatBox
            title="Ungraded Orals"
            subtitle="/////"
            progress="0.80"
            increase=""
            icon={<TrafficIcon sx={{ color: "#4a4e69", fontSize: "28px" }} />}
          />
        </Box>
  
        {/* ROW 2 */}
        <Box gridColumn="span 8" gridRow="span 2" backgroundColor="white" borderRadius="12px" boxShadow="0 4px 8px rgba(0, 0, 0, 0.1)">
          <Box mt="25px" p="0 30px" display="flex" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h5" fontWeight="600" color="#4a4e69">
                Grade Distribution Of Class
              </Typography>
            </Box>
            <Box>
              <Select
                value={selectedChart}
                onChange={handleChartSelect}
                sx={{
                  color: "#4a4e69",
                  fontSize: "16px",
                  border: "none", 
                  '& .MuiSelect-icon': {
                    color: "#4a4e69", 
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    border: 'none', 
                  },
                  '&:focus': {
                    outline: 'none', 
                  },
                }}
              >
                <MenuItem value="BarChart">Bar Chart</MenuItem>
                <MenuItem value="LineChart">Line Chart</MenuItem>
                <MenuItem value="PieChart">Pie Chart</MenuItem>
              </Select>
              <IconButton>
                <DownloadOutlinedIcon sx={{ fontSize: "26px", color: "#4a4e69" }} />
              </IconButton>
            </Box>
          </Box>
          <Box height="250px" m="-20px 0 0 0">
            {selectedChart === "BarChart" && <BarChart data={gradeDistribution} isClassAnalysis={true} />}
            {selectedChart === "LineChart" && <LineChart data={gradeDistribution} isClassAnalysis={true} />}
            {selectedChart === "PieChart" && <PieChart data={gradeDistribution} isClassAnalysis={true} />}
          </Box>
        </Box>
  
        <Box gridColumn="span 4" gridRow="span 2" backgroundColor="white" overflow="auto" borderRadius="12px" boxShadow="0 4px 8px rgba(0, 0, 0, 0.1)">
          <Box display="flex" justifyContent="space-between" alignItems="center" borderBottom="4px solid #f4f7fb" p="15px">
            <Typography color="#4a4e69" variant="h5" fontWeight="600">
              Highest Grade Of Each Student
            </Typography>
          </Box>
          {grades.length > 0 ? (
            grades.map((student) => (
              <Typography key={student.user_id}>{student.username}: {student.grade}%</Typography>
            ))
          ) : (
            <Typography>Loading grades...</Typography>
          )}
        </Box>
  
        {/* ROW 3 */}
        <Box gridColumn="span 4" gridRow="span 2" backgroundColor="white" borderRadius="12px" boxShadow="0 4px 8px rgba(0, 0, 0, 0.1)" p="30px">
          <Typography variant="h5" fontWeight="600">
            Average Time Taken For Student Response
          </Typography>
          <Box display="flex" flexDirection="column" alignItems="center" mt="25px">
            <ProgressCircle size="110" />
            <Typography variant="h5" color="#4a4e69" sx={{ mt: "15px" }}>
              {averageTime !== null ? `${averageTime.toPrecision(3)} seconds` : "Loading..."}
            </Typography>
            <Typography>Average response time for this class</Typography>
          </Box>
        </Box>

  
        <Box gridColumn="span 4" gridRow="span 2" backgroundColor="white" borderRadius="12px" boxShadow="0 4px 8px rgba(0, 0, 0, 0.1)">
          <Typography variant="h5" fontWeight="600" sx={{ padding: "30px 30px 0 30px" }}>
            Percentage of Attempts/Number
          </Typography>
          <Box display="flex" flexDirection="column" alignItems="center" mt="25px">
            <ProgressCircle size="110" />
            <Typography variant="h5" color="#4a4e69" sx={{ mt: "15px" }}>
            /////
            </Typography>
            <Typography>/////</Typography>
          </Box>
        </Box>
  
        <Box gridColumn="span 4" gridRow="span 2" backgroundColor="white" borderRadius="12px" boxShadow="0 4px 8px rgba(0, 0, 0, 0.1)" padding="30px">
          <Typography variant="h5" fontWeight="600" sx={{ marginBottom: "15px" }}>
            Percentage of Pass/Fail/Distinction for Topic/Class
          </Typography>
          <Box display="flex" flexDirection="column" alignItems="center" mt="25px">
            <ProgressCircle size="110" />
            <Typography variant="h5" color="#4a4e69" sx={{ mt: "15px" }}>
            /////
            </Typography>
            <Typography>/////</Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
  
}  

export default ClassAnalysis;
