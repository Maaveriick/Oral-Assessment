import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css'; // Import Bootstrap CSS
import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk'; // Azure SDK

const OralAssessmentHome = () => {
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false); // Track if generating questions
  const [generatedQuestion, setGeneratedQuestion] = useState(''); // Store the generated question
  const [userResponse, setUserResponse] = useState(''); // Store user input
  const [chatHistory, setChatHistory] = useState([]); // Store chat history
  const [isListening, setIsListening] = useState(false); // Track if listening
  const [isActive, setIsActive] = useState(false); // New state to control button activation
  const [recognizer, setRecognizer] = useState(null); // Store recognizer instance

  // Fetch topics from the API when the component mounts
  useEffect(() => {
    const fetchTopicsForStudent = async () => {
      const username = localStorage.getItem('username'); // Get logged-in user's username
      const email = localStorage.getItem('email');
console.log('Email from localStorage:', email); // Check if email is retrieved correctly


      console.log('Username:', username); // Check if the username is correct
      try {
        const response = await fetch(`http://localhost:5000/topics/student/${username}/${email}`);
        if (!response.ok) {
          throw new Error(`Error: ${response.status} ${response.statusText}`);
        }
  
        const data = await response.json();
        setTopics(data); // Update topics state with filtered topics
      } catch (error) {
        console.error('Error fetching topics:', error);
        setTopics([]); // Clear topics on error
      }
    };
  
    fetchTopicsForStudent();
  }, []);
  
  // Handle topic selection
  const handleTopicSelect = async (topic) => {
    setSelectedTopic(topic);
    setGeneratedQuestion(''); // Clear previous question when a new topic is selected

    try {
      // Fetch questions for the selected topic from the server
      const response = await fetch(`http://localhost:5000/topics/${topic.id}`);
      const topicData = await response.json();

      if (topicData.questions && topicData.questions.length > 0) {
        topic.questions = topicData.questions; // Save questions in the selected topic
      }
    } catch (error) {
      console.error('Error fetching topic questions:', error);
    }
  };

  // Handle Start Button Click
  const handleStartClick = () => {
    if (selectedTopic && selectedTopic.questions && selectedTopic.questions.length > 0) {
      setIsGenerating(true); // Disable the Start button while displaying the question
      setIsActive(true); // Enable Send and Record buttons

      // Randomly select a question from the questions array
      const randomQuestion = selectedTopic.questions[Math.floor(Math.random() * selectedTopic.questions.length)];

      setGeneratedQuestion(randomQuestion);
      setIsGenerating(false); // Re-enable the Start button
    }
  };

  // Handle sending user response in the chat
  const handleSendResponse = async () => {
    if (!userResponse.trim()) return; // Don't allow empty responses

    // Add user's response to chat history
    const newChat = [...chatHistory, { sender: 'user', text: userResponse }];
    setChatHistory(newChat); // Update chat history
    setUserResponse(''); // Clear input field

    try {
      const aiResponse = await fetch('http://localhost:5000/ai_response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topicId: selectedTopic.id,
          userResponse: userResponse,
          generatedQuestion: generatedQuestion, // Include the generated question
        }),
      });

      if (!aiResponse.ok) {
        throw new Error(`Error: ${aiResponse.status} ${aiResponse.statusText}`);
      }

      const aiResponseData = await aiResponse.json();
      const aiReply = aiResponseData.response;

      setChatHistory((prevChat) => [...prevChat, { sender: 'ai', text: aiReply }]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      setChatHistory((prevChat) => [
        ...prevChat,
        { sender: 'ai', text: 'Error getting response from the server.' },
      ]);
    }
  };

  const handleSpeechInput = async () => {
    const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(
      "EeA6bETcWe1z5iMKBcm9i4UoQ32HYryQ1YKcsYRVLj4LEwdDwCKZJQQJ99AKAC3pKaRXJ3w3AAAYACOGVLcF",
      "eastasia"
    );
    speechConfig.speechRecognitionLanguage = "en-SG";
    const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
    const newRecognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);

    setRecognizer(newRecognizer); // Save the recognizer instance
    setIsListening(true);

    // Handle recognized speech events
    newRecognizer.recognized = (s, e) => {
      if (e.result.reason === SpeechSDK.ResultReason.RecognizedSpeech) {
        setUserResponse((prevResponse) => `${prevResponse} ${e.result.text}`); // Append new recognized text
      }
    };

    // Handle errors
    newRecognizer.canceled = (s, e) => {
      console.error(`Recognition canceled: ${e.errorDetails}`);
      setIsListening(false);
      newRecognizer.stopContinuousRecognitionAsync();
    };

    // Start continuous recognition
    newRecognizer.startContinuousRecognitionAsync();
  };

  const handleStopRecording = () => {
    if (recognizer) {
      recognizer.stopContinuousRecognitionAsync(() => {
        setIsListening(false);
        setRecognizer(null); // Clear recognizer instance
      });
    }
  };

  const handleEndSession = async () => {
    const email = localStorage.getItem('email'); // Retrieve the email from localStorage
    const sessionData = {
      email,
      topicId: selectedTopic.id,
      generatedQuestion,
      responses: chatHistory,
      datetime: new Date().toISOString(),
    };
  
    try {
      const response = await fetch('http://localhost:5000/end_session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData),
      });
  
      if (response.ok) {
        alert('Session data saved successfully.');
      } else {
        const errorData = await response.json();
        console.error('Failed to save session:', errorData);
        alert('Failed to save session.');
      }
    } catch (error) {
      console.error('Error saving session:', error);
      alert('An error occurred while saving the session.');
    }
  };
  
  

  return (
    <div className="container-fluid mt-5">
      <div className="row">
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
                  key={selectedTopic.id}
                  controls
                  width="600"
                  className="mb-3"
                >
                  <source
                    src={`http://localhost:5000/${selectedTopic.video_url}`}
                    type="video/mp4"
                  />
                  Your browser does not support the video tag.
                </video>
              </>
            ) : (
              <p>Please select a topic to start.</p>
            )}
          </div>
          <div
          className="d-flex justify-content-end align-items-center"
          style={{ marginTop: '20px' }}
        >
          <button
            className="btn btn-primary me-2" // Add margin-end (me-2) for spacing
            onClick={handleStartClick}
            disabled={isGenerating || !selectedTopic}
          >
            {isGenerating ? 'Generating...' : 'Start'}
          </button>
          <button
            className="btn btn-warning"
            onClick={handleEndSession}
            disabled={!selectedTopic || chatHistory.length === 0 || !generatedQuestion}
          >
            End Session
          </button>
        </div>
          {generatedQuestion && (
            <div className="mt-4">
              <h3>Generated Question:</h3>
              <p>{generatedQuestion}</p>
            </div>
          )}

          <div className="mt-4">
            <h3>Chat with AI</h3>
            <div
              className="chat-box"
              style={{ height: '200px', overflowY: 'scroll', border: '1px solid #ccc', padding: '10px' }}
            >
              {chatHistory.length === 0 ? (
                <p>Start a conversation by typing your response below.</p>
              ) : (
                chatHistory.map((chat, index) => (
                  <div
                    key={index}
                    className={chat.sender === 'user' ? 'text-right' : 'text-left'}
                  >
                    <strong>{chat.sender === 'user' ? 'You' : 'AI'}:</strong>{' '}
                    {chat.text}
                  </div>
                ))
              )}
            </div>

            <div className="input-group mt-3">
              <input
                type="text"
                className="form-control"
                value={userResponse}
                onChange={(e) => setUserResponse(e.target.value)}
                placeholder="Type your response here..."
                disabled={!isActive} // Disable when isActive is false
              />
              <div className="input-group-append">
                <button
                  className="btn btn-primary"
                  onClick={handleSendResponse}
                  disabled={!isActive}
                >
                  Send
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={handleSpeechInput}
                  disabled={!isActive || isListening} // Disable when already listening
                >
                  {isListening ? 'Listening...' : 'Record'}
                </button>
                <button
                  className="btn btn-danger"
                  onClick={handleStopRecording}
                  disabled={!isListening} // Enable only when listening
                >
                  Stop Recording
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OralAssessmentHome;
