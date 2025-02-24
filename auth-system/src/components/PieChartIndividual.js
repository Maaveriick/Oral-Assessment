import { ResponsivePie } from "@nivo/pie";
import { tokens } from "../theme";
import { useTheme } from "@mui/material";
import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const PieChartIndividual = () => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);

    // Destructure classId and userId from URL params
    const { classId, userId } = useParams(); // Using classId and userId from the URL parameters

    const [chartData, setChartData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Memoizing fetchChartData with useCallback
    const fetchChartData = useCallback(async () => {
        try {
            // Using axios to fetch data for the specific classId and userId
            const response = await axios.get(
                `http://localhost:5000/individual-analysis?classId=${classId}&userId=${userId}`
            );
            const data = response.data; // Data from the response

            const gradeDistribution = data.gradeDistribution || {};

            // Include "E" grade here
            const pieData = [
                { id: "A", label: "A", value: gradeDistribution.A || 0 },
                { id: "B", label: "B", value: gradeDistribution.B || 0 },
                { id: "C", label: "C", value: gradeDistribution.C || 0 },
                { id: "D", label: "D", value: gradeDistribution.D || 0 },
                { id: "E", label: "E", value: gradeDistribution.E || 0 },
                { id: "F", label: "F", value: gradeDistribution.F || 0 },
            ];

            setChartData(pieData);
            setIsLoading(false);
        } catch (error) {
            console.error("Error fetching chart data:", error);
            setIsLoading(false);
        }
    }, [classId, userId]); // Depend on classId and userId

    useEffect(() => {
        fetchChartData();
    }, [fetchChartData]); // Only re-run when fetchChartData changes

    return (
        isLoading ? (
            <div>Loading...</div> // You can add a loading spinner here
        ) : (
            <ResponsivePie
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
                margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
                innerRadius={0.5}
                padAngle={0.7}
                cornerRadius={3}
                activeOuterRadiusOffset={8}
                borderColor={{
                    from: "color",
                    modifiers: [["darker", 0.2]],
                }}
                arcLinkLabelsSkipAngle={10}
                arcLinkLabelsTextColor={colors.grey[100]}
                arcLinkLabelsThickness={2}
                arcLinkLabelsColor={{ from: "color" }}
                enableArcLabels={false}
                arcLabelsRadiusOffset={0.4}
                arcLabelsSkipAngle={7}
                arcLabelsTextColor={{
                    from: "color",
                    modifiers: [["darker", 2]],
                }}
                defs={[
                    {
                        id: "dots",
                        type: "patternDots",
                        background: "inherit",
                        color: "rgba(255, 255, 255, 0.3)",
                        size: 4,
                        padding: 1,
                        stagger: true,
                    },
                    {
                        id: "lines",
                        type: "patternLines",
                        background: "inherit",
                        color: "rgba(255, 255, 255, 0.3)",
                        rotation: -45,
                        lineWidth: 6,
                        spacing: 10,
                    },
                ]}
                legends={[
                    {
                        anchor: "bottom",
                        direction: "row",
                        justify: false,
                        translateX: 0,
                        translateY: 56,
                        itemsSpacing: 0,
                        itemWidth: 100,
                        itemHeight: 18,
                        itemTextColor: "#999",
                        itemDirection: "left-to-right",
                        itemOpacity: 1,
                        symbolSize: 18,
                        symbolShape: "circle",
                        effects: [
                            {
                                on: "hover",
                                style: {
                                    itemTextColor: "#000",
                                },
                            },
                        ],
                    },
                ]}
            />
        )
    );
};

export default PieChartIndividual;
