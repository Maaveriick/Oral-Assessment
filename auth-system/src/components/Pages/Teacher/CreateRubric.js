import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const defaultRow = {
  criteria: '',
  weightage: '',
};

const defaultColumn = {
  name: '',
};

const CreateRubric = () => {
  const [rubric, setRubric] = useState([defaultRow]);
  const [rubricTitle, setRubricTitle] = useState('');
  const [columns, setColumns] = useState([defaultColumn]);
  const navigate = useNavigate();

  const handleInputChange = (e, rowIndex, field) => {
    const updatedRubric = [...rubric];
    updatedRubric[rowIndex][field] = e.target.value;

    if (field !== 'criteria' && field !== 'weightage') {
      const updatedGradingColumns = { ...updatedRubric[rowIndex].grading_columns };
      updatedGradingColumns[field] = e.target.value;
      updatedRubric[rowIndex].grading_columns = updatedGradingColumns;
    }

    setRubric(updatedRubric);
  };

  const handleColumnChange = (e, index) => {
    const updatedColumns = [...columns];
    updatedColumns[index].name = e.target.value;
    setColumns(updatedColumns);

    setRubric(rubric.map(row => ({ ...row, [e.target.value]: '' })));
  };

  const addRow = () => {
    if (rubric.length < 10) {
      setRubric([...rubric, { ...defaultRow }]);
    } else {
      alert('Maximum 10 rows allowed');
    }
  };

  const removeRow = index => setRubric(rubric.filter((_, i) => i !== index));

  const addColumn = () => {
    if (columns.length < 10) {
      const newColumn = { ...defaultColumn };
      setColumns([...columns, newColumn]);
      setRubric(rubric.map(row => ({ ...row, [newColumn.name]: '' })));
    } else {
      alert('Maximum 10 columns allowed');
    }
  };

  const removeColumn = index => {
    const updatedColumns = columns.filter((_, i) => i !== index);
    setColumns(updatedColumns);
    setRubric(rubric.map(row => {
      const updatedRow = { ...row };
      delete updatedRow[columns[index].name];
      return updatedRow;
    }));
  };

  const saveRubric = async () => {
    // Calculate total weightage
    const totalWeightage = rubric.reduce((sum, row) => {
      const weight = parseFloat(row.weightage.replace('%', ''));
      return sum + (isNaN(weight) ? 0 : weight);
    }, 0);
  
    if (totalWeightage !== 100) {
      alert('The total weightage must add up to 100%. Currently, it is ' + totalWeightage + '%.');
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
          weightage: row.weightage.includes('%') ? row.weightage : `${row.weightage}%`,
          grading_columns: gradingColumns,
        };
      });
  
      const response = await axios.post('http://localhost:5000/api/rubric', {
        rubricTitle,
        rubric: formattedRubric,
        columns,
      });
  
      console.log('Rubric saved successfully:', response.data);
      navigate('/crud-rubric');
    } catch (error) {
      console.error('Error saving rubric:', error);
      alert('Failed to save rubric: ' + (error.response ? error.response.data.error : 'Unknown error'));
    }
  };
  

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Rubric Evaluator (Admin)</h1>

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
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Weightage </th>
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

export default CreateRubric;
