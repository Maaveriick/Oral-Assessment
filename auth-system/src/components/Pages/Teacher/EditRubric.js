import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';

const defaultRow = {
  criteria: '',
  weightage: '',
};

const defaultColumn = {
  name: '',
};

const EditRubric = () => {
  const [rubric, setRubric] = useState([defaultRow]);
  const [rubricTitle, setRubricTitle] = useState('');
  const [columns, setColumns] = useState([defaultColumn]);
  const { rubricId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRubric = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/rubric/${rubricId}`);
        const { rubricTitle, gradingColumns, rows, columnOrder } = response.data;

        setRubricTitle(rubricTitle);
        setColumns(columnOrder.map(name => ({ name })));
        
        // Convert weightage from numeric to percentage for display
        setRubric(rows.map(row => ({
          ...row,
          criteria: row.criteria || '',
          weightage: row.weightage ? `${row.weightage * 100}%` : '',  // Convert to percentage
        })));
      } catch (error) {
        console.error('Error fetching rubric:', error);
      }
    };

    fetchRubric();
  }, [rubricId]);

  const handleInputChange = (e, rowIndex, field) => {
    const updatedRubric = [...rubric];
    updatedRubric[rowIndex][field] = e.target.value;
    setRubric(updatedRubric);
  };

  const handleColumnChange = (e, index) => {
    const updatedColumns = [...columns];
    updatedColumns[index].name = e.target.value;
    setColumns(updatedColumns);
  
    // Ensure all rows have the updated column name reflected.
    setRubric(rubric.map(row => {
      const updatedRow = { ...row };
      updatedRow[e.target.value] = updatedRow[columns[index].name] || '';  // Reflect change in row data.
      delete updatedRow[columns[index].name];  // Remove old column reference.
      return updatedRow;
    }));
  };

  const addRow = () => {
    setRubric([...rubric, { ...defaultRow }]);  
  };
  
  const removeRow = rowIndex => {
    if (rubric.length > 1) {
      setRubric(rubric.filter((_, index) => index !== rowIndex));
    }
  };

  const addColumn = () => {
    const newColumn = { name: '' };
    const updatedColumns = [...columns, newColumn];
    setColumns(updatedColumns);
    
    // Add the new column to each row, initialized to empty value
    setRubric(rubric.map(row => ({
      ...row,
      [newColumn.name]: '',
    })));
  };

  const removeColumn = columnIndex => {
    const columnName = columns[columnIndex].name;
    setColumns(columns.filter((_, index) => index !== columnIndex));
    setRubric(rubric.map(row => {
      const updatedRow = { ...row };
      delete updatedRow[columnName];
      return updatedRow;
    }));
  };

  const saveRubric = async () => {
    const totalWeightage = rubric.reduce((sum, row) => {
      const weight = parseFloat(row.weightage.replace('%', '')) / 100;  // Convert back to numeric
      return sum + (isNaN(weight) ? 0 : weight);
    }, 0);

    if (totalWeightage !== 1) {
      alert('The total weightage must add up to 100%. Currently, it is ' + totalWeightage * 100 + '%.');
      return;
    }

    const isValid = rubric.every(row => row.criteria && row.weightage && columns.every(col => row[col.name] && row[col.name].trim() !== ''));
    if (!isValid) {
      alert('All fields must be filled and weightage must be a percentage (e.g., 20%)');
      return;
    }

    try {
      const formattedRubric = rubric.map(row => {
        const gradingColumns = columns.reduce((acc, column) => {
          acc[column.name] = row[column.name] || '';
          return acc;
        }, {});

        return {
          ...row,
          weightage: row.weightage.includes('%') ? (parseFloat(row.weightage.replace('%', '')) / 100).toString() : row.weightage,  // Convert back to numeric
          grading_columns: gradingColumns,
        };
      });

      await axios.put(`http://localhost:5000/api/rubric/${rubricId}`, {
        rubricTitle,
        rubric: formattedRubric,
        columns,
      });

      console.log('Rubric updated successfully');
      navigate('/crud-rubric');
    } catch (error) {
      console.error('Error updating rubric:', error);
      alert('Failed to update rubric: ' + (error.response ? error.response.data.error : 'Unknown error'));
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Edit Rubric</h1>

      <div style={{ marginBottom: '20px' }}>
        <label htmlFor="rubricTitle" style={{ display: 'block', marginBottom: '5px' }}>
          Rubric Title:
        </label>
        <input
          id="rubricTitle"
          type="text"
          value={rubricTitle}
          onChange={e => setRubricTitle(e.target.value)}
          placeholder="Enter rubric title"
          style={{ width: '100%', padding: '8px' }}
        />
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Criteria</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Weightage</th>
            {columns.map((column, index) => (
              <th key={index} style={{ border: '1px solid #ddd', padding: '8px' }}>
                <input
                  type="text"
                  value={column.name}
                  onChange={e => handleColumnChange(e, index)}
                  placeholder="Column Name"
                  style={{ width: '100%', padding: '5px' }}
                />
                <button
                  onClick={() => removeColumn(index)}
                  style={{
                    padding: '5px 10px',
                    backgroundColor: 'red',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    marginTop: '5px',
                    display: 'block',
                    width: '100%',
                  }}
                >
                  Remove Column
                </button>
              </th>
            ))}
            <th style={{ border: '1px solid #ddd', padding: '8px' }}></th>
          </tr>
        </thead>
        <tbody>
          {rubric.map((row, rowIndex) => (
            <tr key={rowIndex}>
              <td>
                <input
                  type="text"
                  value={row.criteria}
                  onChange={e => handleInputChange(e, rowIndex, 'criteria')}
                  placeholder="Criterion"
                  style={{ width: '100%', padding: '5px' }}
                />
              </td>
              <td>
                <input
                  type="text"
                  value={row.weightage}
                  onChange={e => handleInputChange(e, rowIndex, 'weightage')}
                  placeholder="Weightage (In %)"
                  style={{ width: '100%', padding: '5px' }}
                />
              </td>
              {columns.map((column, colIndex) => (
                <td key={colIndex}>
                  <textarea
                    value={row[column.name] || ''}
                    onChange={e => handleInputChange(e, rowIndex, column.name)}
                    placeholder={`Enter ${column.name}`}
                    style={{ width: '100%', padding: '5px' }}
                  />
                </td>
              ))}
              <td>
                <button
                  onClick={() => removeRow(rowIndex)}
                  style={{
                    padding: '5px 10px',
                    backgroundColor: 'red',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Remove Row
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: '20px' }}>
        <button
          onClick={addRow}
          style={{
            marginRight: '10px',
            padding: '10px 20px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Add Row
        </button>
        <button
          onClick={addColumn}
          style={{
            marginRight: '10px',
            padding: '10px 20px',
            backgroundColor: '#FFC107',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Add Column
        </button>
        <button
          onClick={saveRubric}
          style={{
            marginRight: '10px',
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Save Rubric
        </button>
        <button
          onClick={() => navigate('/crud-rubric')}
          style={{
            padding: '10px 20px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Back
        </button>
      </div>
    </div>
  );
};

export default EditRubric;
