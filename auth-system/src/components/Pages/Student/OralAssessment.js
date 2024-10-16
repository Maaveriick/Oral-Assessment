import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css'; // Import Bootstrap CSS

const OralAssessmentHome = () => {
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false); // Track if generating questions
  const [generatedQuestion, setGeneratedQuestion] = useState(''); // Store the generated question

  // Fetch topics from the API when the component mounts
  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const response = await fetch('http://localhost:5000/topics'); // Adjust the URL if necessary
        const data = await response.json();
        setTopics(data);
      } catch (error) {
        console.error('Error fetching topics:', error);
      }
    };

    // Log the signed-in user
    const username = localStorage.getItem('username');
    console.log(`Signed in as: ${username}`); // Log the username

    fetchTopics();
  }, []);

  // Handle topic selection
  const handleTopicSelect = (topic) => {
    setSelectedTopic(topic);
    setGeneratedQuestion(''); // Clear previous question when a new topic is selected
  };


  //Handle Start Button Click
  const handleStartClick = async () => {
    if (selectedTopic) {
      setIsGenerating(true); // Disable the Start button while generating the question
  
      const username = localStorage.getItem('username'); // Retrieve username from localStorage
  
      try {
        // Step 1: Check if a question already exists for the selected topic and user
        const existingResponse = await fetch(`http://localhost:5000/questions?topicId=${selectedTopic.id}&username=${username}`);
        const existingQuestions = await existingResponse.json();
  
        let generatedQuestion;
  
        // Step 2: If a question exists, update it; otherwise, generate a new question
        if (existingQuestions.length > 0) {
          // Use the existing question ID to update
          const questionId = existingQuestions[0].id; // Assuming the first question is to be updated
  
          // Generate new question
          const generationResponse = await fetch(`http://localhost:5000/generate_questions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              description: selectedTopic.description, 
              topicId: selectedTopic.id, 
              username 
            }),
          });
  
          if (!generationResponse.ok) {
            throw new Error(`Error: ${generationResponse.statusText}`);
          }
  
          const generationResult = await generationResponse.json();
          generatedQuestion = generationResult.questions[0].question; // Get the first generated question
  
          // Step 3: Update the existing question in the database
          await fetch(`http://localhost:5000/questions/${questionId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              topicId: selectedTopic.id,
              username,
              newQuestion: generatedQuestion
            }),
          });
        } else {
          // No existing question found, proceed to generate new questions
          const generationResponse = await fetch(`http://localhost:5000/generate_questions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              description: selectedTopic.description, 
              topicId: selectedTopic.id, 
              username 
            }),
          });
  
          if (!generationResponse.ok) {
            throw new Error(`Error: ${generationResponse.statusText}`);
          }
  
          const generationResult = await generationResponse.json();
          generatedQuestion = generationResult.questions[0].question; // Get the first generated question
  
          // Optionally: Save the new question in the database
          await fetch(`http://localhost:5000/questions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              topicId: selectedTopic.id,
              username,
              question: generatedQuestion
            }),
          });
        }
  
        setGeneratedQuestion(generatedQuestion); // Update state with the generated or updated question
        setIsGenerating(false); // Re-enable the Start button
  
      } catch (error) {
        console.error('Error generating or updating question:', error);
        setIsGenerating(false); // Re-enable the Start button even if there's an error
      }
    }
  };
  
  
  
  


  return (
    <div className="container-fluid mt-5">
      <div className="row">
        {/* Sidebar */}
        <div className="col-md-3 bg-light sidebar">
          <div className="p-3">
            <h3>Topics</h3>
            <div className="dropdown">
              <button
                className="btn btn-secondary dropdown-toggle"
                type="button"
                id="dropdownMenuButton"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                Select a Topic
              </button>
              <ul className="dropdown-menu" aria-labelledby="dropdownMenuButton">
                {topics.map((topic) => (
                  <li key={topic.id}>
                    <button
                      className="dropdown-item"
                      onClick={() => handleTopicSelect(topic)}
                    >
                      {topic.topicname}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="col-md-9">
          <div className="text-center mb-4">
            <h1>Hi, Welcome!</h1>
            <h2>Choose your topic:</h2>
          </div>

          <div className="text-center">
            {selectedTopic ? (
              <>
                <h2>{selectedTopic.topicname}</h2>
                <video
                  key={selectedTopic.id} // Use key to force re-render
                  controls
                  width="600"
                  className="mb-3"
                >
                  <source src={`http://localhost:5000/${selectedTopic.video_url}`} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </>
            ) : (
              <p>Please select a topic to start.</p>
            )}
          </div>

          {/* Start Button */}
          <div className="d-flex justify-content-end align-items-end" style={{ height: '2%', marginTop: '20px' }}>
            <button
              className="btn btn-primary"
              onClick={handleStartClick}
              disabled={isGenerating || !selectedTopic}
            >
              {isGenerating ? 'Generating...' : 'Start'}
            </button>
          </div>

          {/* Display Generated Question */}
          {generatedQuestion && (
            <div className="mt-4">
              <h3>Generated Question:</h3>
              <p>{generatedQuestion}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OralAssessmentHome;
