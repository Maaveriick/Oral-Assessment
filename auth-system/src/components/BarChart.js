import React, { useEffect, useState } from "react";
import { useTheme } from "@mui/material";
import { ResponsiveBar } from "@nivo/bar";
import { tokens } from "../theme";

const BarChart = ({ isDashboard = false }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchChartData = async () => {
    try {
      const classId = new URLSearchParams(window.location.search).get("classId");
      const teacherUsername = "teacher1";

      const response = await fetch(
        `http://localhost:5000/grades?classId=${classId}&teacherUsername=${teacherUsername}`
      );
      const data = await response.json();

      const gradeDistribution = data.gradeDistribution || {};

      const barData = [
        { id: "A",  A: gradeDistribution.A || 0 },
        { id: "B",  B: gradeDistribution.B || 0 },
        { id: "C",  C: gradeDistribution.C || 0 },
        { id: "D",  D: gradeDistribution.D || 0 },
        { id: "E",  D: gradeDistribution.E || 0 },
        { id: "F",  F: gradeDistribution.F || 0 },
      ];

      setChartData(barData);
    } catch (error) {
      console.error("Error fetching chart data:", error);
    } finally {
      setIsLoading(false);
    }
  };
  const calculateTickValues = () => {
    if (!chartData.length) return [0, 1, 2, 3, 4, 5, 6];
  
    // Get the maximum value from the chartData's grade distribution values
    const allValues = chartData.flatMap((bar) => Object.values(bar).slice(1)); // Skip the 'id' key
    const maxValue = Math.max(...allValues);
    const minValue = Math.min(...allValues);
  
    // Ensure minimum value is non-negative
    const adjustedMinValue = Math.max(0, minValue);
  
    // Calculate the step value for ticks
    const step = Math.ceil((maxValue - adjustedMinValue) / 5) || 1;
  
    // Generate the ticks
    const ticks = [];
    for (let i = adjustedMinValue; i <= maxValue; i += step) {
      if (i <= maxValue) {
        ticks.push(i);
      }
    }
  
    // Add a final tick for the max value
    if (ticks[ticks.length - 1] !== maxValue) {
      ticks.push(maxValue);
    }
  
    return ticks;
  };
  
  useEffect(() => {
    fetchChartData();
  }, []);

  return (
    <ResponsiveBar
    data={chartData}
    theme={{
      axis: {
        domain: {
          line: {
            stroke: colors.grey[100],
          },
        },
        legend: {
          text: {
            fill: colors.grey[100],
          },
        },
        ticks: {
          line: {
            stroke: colors.grey[100],
            strokeWidth: 1,
          },
          text: {
            fill: colors.grey[100],
          },
        },
      },
      legends: {
        text: {
          fill: colors.grey[100],
        },
      },
    }}
    keys={["A", "B", "C", "D", "E", "F"]}
    indexBy="id"
    margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
    padding={0.3}
    valueScale={{ type: "linear" }}
    indexScale={{ type: "band", round: true }}
    colors={{ scheme: "nivo" }}
    defs={[
      {
        id: "dots",
        type: "patternDots",
        background: "inherit",
        color: "#38bcb2",
        size: 4,
        padding: 1,
        stagger: true,
      },
      {
        id: "lines",
        type: "patternLines",
        background: "inherit",
        color: "#eed312",
        rotation: -45,
        lineWidth: 6,
        spacing: 10,
      },
    ]}
    borderColor={{
      from: "color",
      modifiers: [["darker", "1.6"]],
    }}
    axisTop={null}
    axisRight={null}
    axisBottom={{
      tickSize: 5,
      tickPadding: 5,
      tickRotation: 0,
      legend: isDashboard ? undefined : "Grade",
      legendPosition: "middle",
      legendOffset: 32,
    }}
    axisLeft={{
      tickSize: 5,
      tickValues: calculateTickValues(),
      tickPadding: 5,
      tickRotation: 0,
      legend: isDashboard ? undefined : "Count",
      legendPosition: "middle",
      legendOffset: -40,
      scale: {
        type: 'linear',
      }
    }}
    enableLabel={false}
    legends={[
      {
        dataFrom: "keys",
        anchor: "bottom-right",
        direction: "column",
        justify: false,
        translateX: 120,
        translateY: 0,
        itemsSpacing: 2,
        itemWidth: 100,
        itemHeight: 20,
        itemDirection: "left-to-right",
        itemOpacity: 0.85,
        symbolSize: 20,
        effects: [
          {
            on: "hover",
            style: {
              itemOpacity: 1,
            },
          },
        ],
      },
    ]}
    role="application"
    barAriaLabel={(e) => `${e.id}: ${e.formattedValue} Grade: ${e.indexValue}`}
  />
  );
};

export default BarChart;
