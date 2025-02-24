import React, { useEffect, useState } from "react";
import { useTheme } from "@mui/material";
import { ResponsiveLine } from "@nivo/line";
import { tokens } from "../theme";
import { useParams } from "react-router-dom";
import axios from "axios";

const LineChartIndividual = ({ isCustomLineColors = false, isDashboard = false }) => {
  const { classId, userId } = useParams(); // Extract classId and userId from URL
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch individual student data
  const fetchChartData = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/individual-analysis?classId=${classId}&userId=${userId}`
      );
      const data = response.data;

      const gradeDistribution = data.gradeDistribution || {};

      // Prepare line chart data
      const lineData = [
        {
          id: "Grades",
          data: [
            { x: ".", y: null }, // Invisible buffer point
            { x: "A", y: gradeDistribution.A || 0 },
            { x: "B", y: gradeDistribution.B || 0 },
            { x: "C", y: gradeDistribution.C || 0 },
            { x: "D", y: gradeDistribution.D || 0 },
            { x: "E", y: gradeDistribution.E || 0 }, // Added E grade
            { x: "F", y: gradeDistribution.F || 0 },
            { x: ",", y: null }, // Invisible buffer point
          ],
        },
      ];

      setChartData(lineData);
    } catch (error) {
      console.error("Error fetching chart data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to calculate dynamic tick values
  const calculateTickValues = () => {
    if (!chartData.length || !chartData[0].data) return [0, 1, 2, 3, 4, 5, 6];

    const allValues = chartData[0].data
      .filter((point) => point.y !== null) // Ignore null buffer points
      .map((point) => point.y);

    const maxValue = Math.max(...allValues);
    const minValue = Math.min(...allValues);

    const adjustedMinValue = Math.max(0, minValue); // Ensure minimum value is non-negative

    // Avoid unnecessary values outside the actual range
    const step = Math.ceil((maxValue - adjustedMinValue) / 5) || 1;

    // Generate ticks based on the actual range
    const ticks = [];
    for (let i = adjustedMinValue; i <= maxValue; i += step) {
      // Only add relevant ticks, avoid values outside the data range
      if (i <= maxValue) {
        ticks.push(i);
      }
    }

    // Add a final tick that matches the max value to ensure it appears on the axis
    if (ticks[ticks.length - 1] !== maxValue) {
      ticks.push(maxValue);
    }

    return ticks;
  };

  useEffect(() => {
    fetchChartData();
  }, [classId, userId]);

  if (isLoading) return <div>Loading...</div>;

  return (
    <ResponsiveLine
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
        tooltip: {
          container: {
            color: colors.primary[500],
          },
        },
      }}
      colors={isDashboard ? { datum: "color" } : { scheme: "nivo" }}
      margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
      xScale={{
        type: "point",
        domain: ["A", "B", "C", "D", "E", "F"], // Updated domain with E grade
        padding: 0.4,
        round: true,
      }}
      yScale={{
        type: "linear",
        min: 0,
        max: "auto",
        stacked: false,
        reverse: false,
      }}
      yFormat=" >-.2f"
      curve="catmullRom"
      axisTop={null}
      axisRight={null}
      axisBottom={{
        orient: "bottom",
        tickSize: 0,
        tickPadding: 5,
        tickRotation: 0,
        legend: isDashboard ? undefined : "Grades",
        legendOffset: 36,
        legendPosition: "middle",
      }}
      axisLeft={{
        orient: "left",
        tickValues: calculateTickValues(), // Use the dynamic tick calculation here
        tickSize: 3,
        tickPadding: 5,
        tickRotation: 0,
        legend: isDashboard ? undefined : "Count",
        legendOffset: -40,
        legendPosition: "middle",
      }}
      enableGridX={false}
      enableGridY={true}
      pointSize={8}
      pointColor={{ theme: "background" }}
      pointBorderWidth={2}
      pointBorderColor={{ from: "serieColor" }}
      pointLabelYOffset={-12}
      useMesh={true}
      legends={[
        {
          anchor: "bottom-right",
          direction: "column",
          justify: false,
          translateX: 100,
          translateY: 0,
          itemsSpacing: 0,
          itemDirection: "left-to-right",
          itemWidth: 80,
          itemHeight: 20,
          itemOpacity: 0.75,
          symbolSize: 12,
          symbolShape: "circle",
          symbolBorderColor: "rgba(0, 0, 0, .5)",
          effects: [
            {
              on: "hover",
              style: {
                itemBackground: "rgba(0, 0, 0, .03)",
                itemOpacity: 1,
              },
            },
          ],
        },
      ]}
    />
  );
};

export default LineChartIndividual;
