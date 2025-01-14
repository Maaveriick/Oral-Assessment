import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

const ViewRubric = () => {
  const { rubricId } = useParams(); // Fetch rubricId from URL
  const [rubricData, setRubricData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRubric = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/rubric/${rubricId}`);
        if (response.data) {
          setRubricData(response.data);
        } else {
          setError('No data received.');
        }
      } catch (err) {
        console.error('Error fetching rubric:', err);
        setError('Failed to load rubric data.');
      }
    };

    fetchRubric();
  }, [rubricId]);

  if (error) {
    return <p>{error}</p>;
  }

  if (!rubricData) {
    return <p>Loading...</p>;
  }

  const { rubricTitle, gradingColumns, rows, columnOrder } = rubricData;

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>{rubricTitle}</h1>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Criteria</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Weightage</th>
            {columnOrder.map((column, index) => (
              <th key={index} style={{ border: '1px solid #ddd', padding: '8px' }}>
                {column}
                <br />
                <span style={{ fontSize: '0.85em', color: '#666' }}>
                  {gradingColumns[column] || ''}
                </span>
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => {
            // Ensure grading_values is an object
            const gradingValues = row.grading_values || {};

            return (
              <tr key={row.id}>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{row.criteria}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                  {row.weightage ? `${row.weightage * 100}%` : 'N/A'}
                </td>
                {columnOrder.map((column, index) => (
                <td key={index} style={{ border: '1px solid #ddd', padding: '8px' }}>
                  {gradingValues[column] || 'N/A'}  {/* Use 'N/A' if no grading value is found */}
                </td>
              ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ViewRubric;
