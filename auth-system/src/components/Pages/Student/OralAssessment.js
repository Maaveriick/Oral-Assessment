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

    fetchTopics();
  }, []);

  // Handle topic selection
  const handleTopicSelect = (topic) => {
    setSelectedTopic(topic);
    setGeneratedQuestion(''); // Clear previous question when a new topic is selected
  };

  // Handle Start button click
  const handleStartClick = async () => {
    if (selectedTopic) {
      setIsGenerating(true); // Disable the Start button while generating the question

      // Call the API to generate the question
      try {
        const response = await fetch(`http://localhost:5000/generate_questions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ description: selectedTopic.description, topicId: selectedTopic.id }),
        });

        if (!response.ok) {
          throw new Error(`Error: ${response.statusText}`);
        }

        const result = await response.json();

        // Check if questions were generated and set the first one as the generated question
        if (result.questions && result.questions.length > 0) {
          setGeneratedQuestion(result.questions[0].question); // Assuming each question object has a 'question' field
        } else {
          console.error('No questions found in the response.');
        }
      } catch (error) {
        console.error('Error generating question:', error);
      }

      // After generating the question, keep the button disabled
      // Reset only when a new topic is selected
      // Note: The button will still be disabled due to isGenerating state
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
