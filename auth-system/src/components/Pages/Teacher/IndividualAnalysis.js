import React, { useState, useEffect } from "react";
import axios from "axios";
import { Box, Button, IconButton, Typography, useTheme } from "@mui/material";
import { tokens } from "../../../theme";
import { Select, MenuItem } from "@mui/material";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import SpellCheckIcon from "@mui/icons-material/Spellcheck";
import PendingIcon from "@mui/icons-material/Pending";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import TrafficIcon from "@mui/icons-material/Traffic";
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import Header from "../../Header";
import LineChartIndividual from "../../LineChartIndividual"; 
import PieChartIndividual from "../../PieChartIndividual"; 
import BarChartIndividual from "../../BarChartIndividual";
import StatBox from "../../StatBox";
import ProgressCircle from "../../ProgressCircle";
import { useParams } from "react-router-dom"; // Import useParams for routing
import { Chart, registerables } from "chart.js";

// Register necessary Chart.js components
Chart.register(...registerables);

const IndividualAnalysis = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  // Extract classId and userId from the URL params using useParams
  const { classId, userId } = useParams();

  // State for charts and grades data
  const [selectedChart, setSelectedChart] = useState("BarChartIndividual");
  const [grades, setGrades] = useState([]);
  const [averageGrade, setAverageGrade] = useState(null);
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

  // Fetch grades for the specific user and classId
  const fetchGrades = async () => {
    if (!classId || !userId) {
      console.error("Missing classId or userId");
      return;
    }

    try {
      const response = await axios.get(
        `http://localhost:5000/individual-analysis?classId=${classId}&userId=${userId}`
      );
      setGrades(response.data.grades || []);
      setAverageGrade(response.data.averageGrade);
      setGradeDistribution(response.data.gradeDistribution || []);
      setTotalAttempts(response.data.totalAttempts);
    } catch (error) {
      console.error("Error fetching grades:", error);
    }
  };
  
  // Fetch average time from backend
  useEffect(() => {
    axios.get('http://localhost:5000/average-time')
      .then((response) => {
        const avgTime = parseFloat(response.data.averageTime);
        if (!isNaN(avgTime)) {
          setAverageTime(avgTime);  // Always store a number
        } else {
          setAverageTime(null);  // Handle if data is invalid
        }
      })
      .catch((error) => {
        console.error('Error fetching average time:', error);
      });
  }, []);


  // Fetch grades on component mount
  useEffect(() => {
    fetchGrades();
  }, [classId, userId]);

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
            title="Average Grade/Band Of Class"
            subtitle={averageGrade !== null ? `${averageGrade.toFixed(2)}% / ${getGradeBand(averageGrade)}` : "Loading..."}
            progress="0.1"  // Optional: replace with your own progress logic if necessary
            increase=""
            icon={<SpellCheckIcon sx={{ color: "#4a4e69", fontSize: "28px" }} />}
          />
        </Box>
  
        <Box gridColumn="span 3" backgroundColor="white" boxShadow="0 4px 8px rgba(0, 0, 0, 0.1)" borderRadius="12px" display="flex" alignItems="center" justifyContent="center">
          <StatBox
            title="Oral Assessments Pending For Marking"
            subtitle="12"
            progress="0.50"
            increase=""
            icon={<PendingIcon sx={{ color: "#4a4e69", fontSize: "28px" }} />}
          />
        </Box>
  
        <Box gridColumn="span 3" backgroundColor="white" boxShadow="0 4px 8px rgba(0, 0, 0, 0.1)" borderRadius="12px" display="flex" alignItems="center" justifyContent="center">
          <StatBox
            title="Average Attempts Per Class/Topic/Individual"
            subtitle="12"
            progress="0.30"
            increase=""
            icon={<PersonAddIcon sx={{ color: "#4a4e69", fontSize: "28px" }} />}
          />
        </Box>
  
        <Box gridColumn="span 3" backgroundColor="white" boxShadow="0 4px 8px rgba(0, 0, 0, 0.1)" borderRadius="12px" display="flex" alignItems="center" justifyContent="center">
          <StatBox
            title="Ungraded Orals"
            subtitle="80%"
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
                <MenuItem value="BarChartIndividual">Bar Chart</MenuItem>
                <MenuItem value="LineChartIndividual">Line Chart</MenuItem>
                <MenuItem value="PieChartIndividual">Pie Chart</MenuItem>
              </Select>
              <IconButton>
                <DownloadOutlinedIcon sx={{ fontSize: "26px", color: "#4a4e69" }} />
              </IconButton>
            </Box>
          </Box>
          <Box height="250px" m="-20px 0 0 0">
            {selectedChart === "BarChartIndividual" && <BarChartIndividual data={gradeDistribution} isClassAnalysis={true} />}
            {selectedChart === "LineChartIndividual" && <LineChartIndividual data={gradeDistribution} isClassAnalysis={true} />}
            {selectedChart === "PieChartIndividual" && <PieChartIndividual data={gradeDistribution} isClassAnalysis={true} />}
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
              {averageTime ? `${averageTime.toPrecision(3)} seconds` : "Loading..."}
            </Typography>
            <Typography>Average response time across all students</Typography>
          </Box>
        </Box>
  
        <Box gridColumn="span 4" gridRow="span 2" backgroundColor="white" borderRadius="12px" boxShadow="0 4px 8px rgba(0, 0, 0, 0.1)">
          <Typography variant="h5" fontWeight="600" sx={{ padding: "30px 30px 0 30px" }}>
            Percentage of Attempts/Number
          </Typography>
          <Box height="250px" mt="-20px">
            <BarChartIndividual isClassAnalysis={true} />
          </Box>
        </Box>
  
        <Box gridColumn="span 4" gridRow="span 2" backgroundColor="white" borderRadius="12px" boxShadow="0 4px 8px rgba(0, 0, 0, 0.1)" padding="30px">
          <Typography variant="h5" fontWeight="600" sx={{ marginBottom: "15px" }}>
            Percentage of Pass/Fail/Distinction for Topic/Class
          </Typography>
          <Box height="200px">
            <PieChartIndividual isClassAnalysis={true} />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}  

export default IndividualAnalysis;
