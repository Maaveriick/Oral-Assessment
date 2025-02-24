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

const Dashboard = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  // State for charts and grades data
  const [selectedChart, setSelectedChart] = useState("BarChart");
  const [grades, setGrades] = useState([]);
  const [classAverage, setClassAverage] = useState(null);
  const [gradeDistribution, setGradeDistribution] = useState([]);

  // Fetch grades data from backend
  const fetchGrades = async () => {
    const classId = new URLSearchParams(window.location.search).get("classId");
    const teacherUsername = "teacher1"; // Replace with actual teacher username from login/session
  
    console.log(`Fetching grades for classId: ${classId}, teacherUsername: ${teacherUsername}`);
  
    try {
      const response = await axios.get(
        `http://localhost:5000/grades?classId=${classId}&teacherUsername=${teacherUsername}`
      );
      console.log("Response from server:", response.data);
  
      setGrades(response.data.grades || []);
      setClassAverage(response.data.classAverage || null);
      setGradeDistribution(response.data.gradeDistribution || []);
    } catch (error) {
      console.error("Error fetching grades:", error);
    }
  };
  

  // Call fetchGrades when the component mounts
  useEffect(() => {
    fetchGrades();
  }, []);

  // Handle changing the chart when a dropdown item is selected
  const handleChartSelect = (event) => {
    setSelectedChart(event.target.value);
  };

  return (
    <Box m="20px">
      {/* HEADER */}
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Header title="PERFORMANCE DASHBOARD" subtitle="Welcome to your dashboard" />

        <Box>
          <Button
            sx={{
              backgroundColor: colors.blueAccent[700],
              color: colors.grey[100],
              fontSize: "14px",
              fontWeight: "bold",
              padding: "10px 20px",
            }}
          >
            <DownloadOutlinedIcon sx={{ mr: "10px" }} />
            Download Reports
          </Button>
        </Box>
      </Box>

      {/* GRID & CHARTS */}
      <Box
        display="grid"
        gridTemplateColumns="repeat(12, 1fr)"
        gridAutoRows="140px"
        gap="20px"
      >
        {/* ROW 1 */}
        <Box
          gridColumn="span 3"
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <StatBox
            title="Average Grade Of Class"
            subtitle={classAverage ? `${classAverage}%` : "Loading..."}
            progress="0.1"
            increase=""
            icon={
              <SpellCheckIcon
                sx={{ color: colors.greenAccent[600], fontSize: "26px" }}
              />
            }
          />
        </Box>
        <Box
          gridColumn="span 3"
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <StatBox
            title="Oral Assessments Pending For Marking"
            subtitle="12"
            progress="0.50"
            increase=""
            icon={
              <PendingIcon
                sx={{ color: colors.greenAccent[600], fontSize: "26px" }}
              />
            }
          />
        </Box>
        <Box
          gridColumn="span 3"
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <StatBox
            title="Oral Assessments"
            subtitle="12"
            progress="0.30"
            increase=""
            icon={
              <PersonAddIcon
                sx={{ color: colors.greenAccent[600], fontSize: "26px" }}
              />
            }
          />
        </Box>
        <Box
          gridColumn="span 3"
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <StatBox
            title="Traffic"
            subtitle="80%"
            progress="0.80"
            increase=""
            icon={
              <TrafficIcon
                sx={{ color: colors.greenAccent[600], fontSize: "26px" }}
              />
            }
          />
        </Box>

        {/* ROW 2 */}
        <Box
          gridColumn="span 8"
          gridRow="span 2"
          backgroundColor={colors.primary[400]}
        >
          <Box
            mt="25px"
            p="0 30px"
            display="flex "
            justifyContent="space-between"
            alignItems="center"
          >
            <Box>
              <Typography variant="h5" fontWeight="600" color={colors.grey[100]}>
                Grade Distribution Of Class
              </Typography>
            </Box>
            <Box>
              <Select
                value={selectedChart}
                onChange={handleChartSelect}
                sx={{
                  color: colors.greenAccent[500],
                  fontSize: "16px",
                  border: "none", // Remove the border outline
                  '& .MuiSelect-icon': {
                    color: colors.greenAccent[500], // Keep the arrow dropdown button green
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    border: 'none', // Remove the border outline
                  },
                  '&:focus': {
                    outline: 'none', // Remove the focus outline
                  },
                }}
              >
                <MenuItem value="BarChart">Bar Chart</MenuItem>
                <MenuItem value="LineChart">Line Chart</MenuItem>
                <MenuItem value="PieChart">Pie Chart</MenuItem>
              </Select>
              <IconButton>
                <DownloadOutlinedIcon sx={{ fontSize: "26px", color: colors.greenAccent[500] }} />
              </IconButton>
            </Box>
          </Box>
          <Box height="250px" m="-20px 0 0 0">
            {/* Render chart based on selectedChart */}
            {selectedChart === "BarChart" && <BarChart data={gradeDistribution} isDashboard={true} />}
            {selectedChart === "LineChart" && <LineChart data={gradeDistribution} isDashboard={true} />}
            {selectedChart === "PieChart" && <PieChart data={gradeDistribution} isDashboard={true} />}
          </Box>
        </Box>
        <Box
          gridColumn="span 4"
          gridRow="span 2"
          backgroundColor={colors.primary[400]}
          overflow="auto"
        >
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            borderBottom={`4px solid ${colors.primary[500]}`}
            colors={colors.grey[100]}
            p="15px"
          >
            <Typography color={colors.grey[100]} variant="h5" fontWeight="600">
              Highest Grade Of Each Student
            </Typography>
          </Box>
          {/* Displaying mock data for student grades */}
          {grades.length > 0 ? (
            grades.map((student) => (
              <Typography key={student.id}>{student.name}: {student.grade}%</Typography>
            ))
          ) : (
            <Typography>Loading grades...</Typography>
          )}
        </Box>

        {/* ROW 3 */}
        <Box
          gridColumn="span 4"
          gridRow="span 2"
          backgroundColor={colors.primary[400]}
          p="30px"
        >
          <Typography variant="h5" fontWeight="600">
            Average Time Taken For Student Response
          </Typography>
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            mt="25px"
          >
            <ProgressCircle size="125" />
            <Typography
              variant="h5"
              color={colors.greenAccent[500]}
              sx={{ mt: "15px" }}
            >
              $48,352 revenue generated
            </Typography>
            <Typography>Includes extra misc expenditures and costs</Typography>
          </Box>
        </Box>
        <Box
          gridColumn="span 4"
          gridRow="span 2"
          backgroundColor={colors.primary[400]}
        >
          <Typography
            variant="h5"
            fontWeight="600"
            sx={{ padding: "30px 30px 0 30px" }}
          >
            ----- 
          </Typography>
          <Box height="250px" mt="-20px">
            {/* Empty chart (BarChart with no data) */}
            <BarChart isDashboard={true} />
          </Box>
        </Box>
        <Box
          gridColumn="span 4"
          gridRow="span 2"
          backgroundColor={colors.primary[400]}
          padding="30px"
        >
          <Typography
            variant="h5"
            fontWeight="600"
            sx={{ marginBottom: "15px" }}
          >
            -----
          </Typography>
          <Box height="200px">
            {/* Pie Chart with no data */}
            <PieChart isDashboard={true} />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;
