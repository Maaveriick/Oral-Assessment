import React, { useEffect, useState, useRef } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css'; // Import Bootstrap CSS
import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk'; // Azure SDK
import axios from "axios";

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
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [originalQuestion, setOriginalQuestion] = useState(''); // Store the original question
  const [countdown, setCountdown] = useState(0); // Countdown state
  const [currentAttempts, setCurrentAttempts] = useState(0);  // Define currentAttempts here
  const [selectedRubric, setSelectedRubric] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiEnabled, setAiEnabled] = useState(false);  // Track AI status
  const timerRef = useRef(null); // Store the timer reference using useRef


    // Fetch topics from the API when the component mounts
    useEffect(() => {
      const fetchTopicsForStudent = async () => {
        const username = localStorage.getItem('username'); // Get logged-in user's username
        const email = localStorage.getItem('email');
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

 // Reset states when selecting a new topic
 const handleTopicSelect = async (topic) => {
  // Reset state when switching topics
  resetState();
  setSelectedTopic(topic);
  setGeneratedQuestion('');  // Reset generated question
  setOriginalQuestion(''); // Reset original question
 
  try {
    const response = await fetch(`http://localhost:5000/topics/${topic.id}`);
    const topicData = await response.json();

    // Select a random question for the new topic
    if (topicData.questions && topicData.questions.length > 0) {
      const randomQuestion = topicData.questions[Math.floor(Math.random() * topicData.questions.length)];
      setOriginalQuestion(randomQuestion); // Set the original question for this topic
      setGeneratedQuestion(''); // Reset generated question before starting timer
    }

    // Handle timer if available
    if (topicData.timer) {
      const timerInSeconds = topicData.timer * 60;
      setCountdown(timerInSeconds);
      startTimer(timerInSeconds); // Start timer here
      
    } else {
      console.error("Timer value is missing for the selected topic.");
    }
  } catch (error) {
    console.error('Error fetching topic data:', error);
  }
};



// Start timer logic// Start timer logic
const startTimer = (time) => {
  if (timerRef.current) {
    clearInterval(timerRef.current);
  }

  timerRef.current = setInterval(() => {
    setCountdown((prev) => {
      if (prev <= 0) {
        clearInterval(timerRef.current); // Stop the timer
        alert("Time's up!"); // Show an alert when the timer reaches 0
        return 0; // Ensure the timer stops at 0
      }
      return prev - 1;
    });
  }, 1000);
};


// When the countdown reaches 0, generate and read the question
useEffect(() => {
  if (countdown === 0 && selectedTopic && selectedTopic.questions.length > 0) {
    const questionToDisplay = originalQuestion || selectedTopic.questions[Math.floor(Math.random() * selectedTopic.questions.length)];
    setGeneratedQuestion(questionToDisplay); // Set the generated question
  }
}, [countdown, originalQuestion, selectedTopic]); // Runs when countdown or topic changes

// Format time in minutes:seconds
const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
};

  // Reset states
  const resetState = () => {
    setGeneratedQuestion('');
    setOriginalQuestion('');
    setUserResponse('');
    setChatHistory([]);
  };

        
      // Handle sending user response in the chat
      const handleSendResponse = async () => {
  if (!userResponse.trim()) return; // Don't allow empty responses

  // Add user's response to chat history
  const newChat = [
    ...chatHistory,
    { sender: 'user', text: userResponse }
  ];
  setChatHistory(newChat); // Update chat history
  setUserResponse(''); // Clear input field

  // Store the generated question
  const questionToSend = generatedQuestion;

  try {
    // Send the current generated question along with the user's response
    const aiResponse = await fetch('http://localhost:5000/ai_response', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topicId: selectedTopic.id,
        userResponse: userResponse,
        generatedQuestion: questionToSend, // Include the generated question
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`Error: ${aiResponse.status} ${aiResponse.statusText}`);
    }

    const aiResponseData = await aiResponse.json();
    const aiReply = aiResponseData.response;

    // Set AI's response in the generatedQuestion state to display it as the new question
    setGeneratedQuestion(aiReply);

    // Add AI's response to chat history
    setChatHistory((prevChat) => [
      ...prevChat,
      { sender: 'ai', text: aiReply }
    ]);

    // Read the AI response out loud using Azure Speech SDK
    readGeneratedQuestion(aiReply); // Use the Azure function for speech synthesis

  } catch (error) {
    console.error('Error getting AI response:', error);
    setChatHistory((prevChat) => [
      ...prevChat,
      { sender: 'ai', text: 'Error getting response from the server.' }
    ]);
  }
};
 

       // Function to read out the generated question using Azure Text to Speech
  const readGeneratedQuestion = (question) => {
    setIsSpeaking(true); // Disable the button when speech synthesis starts

    const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(
      "", // Replace with your Azure Speech API Key
      "eastasia" // Replace with your Azure region
    );
    speechConfig.speechSynthesisVoiceName = "en-SG-WayneNeural"; // You can choose other voices as needed

    const synthesizer = new SpeechSDK.SpeechSynthesizer(speechConfig);

    // Start speech synthesis
    synthesizer.speakTextAsync(
      question,
      (result) => {
        if (result.reason === SpeechSDK.ResultReason.SynthesizingAudioCompleted) {
          console.log("Successfully synthesized the message.");
        } else {
          console.error("Error synthesizing speech: " + result.errorDetails);
        }

        // Ensure that the button is re-enabled **after** the speech synthesis is finished
        setIsSpeaking(false); // Re-enable the button when speech synthesis is completed
      },
      (error) => {
        console.error("Speech synthesis failed: ", error);
        setIsSpeaking(false); // Re-enable the button if there's an error
      }
    );
  };
  const handleSpeechInput = async () => {
    const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(
      "",
      "eastasia"
    );
    speechConfig.speechRecognitionLanguage = "en-SG";
    const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
    const newRecognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);
  
    setRecognizer(newRecognizer); // Save the recognizer instance
    setIsListening(true);
    setIsActive(true); // Enable the "Send Response" button when speaking starts
  
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
      setIsActive(false); // Disable the "Send Response" button if recognition is canceled
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


const handleEndSession = () => {
  // Display the "Thank You" pop-up
  const thankYouPopup = window.confirm("Thank You! Click OK to generate and save your feedback and grade.");

  if (thankYouPopup) {
    // Proceed with saving feedback and grade if user clicks "OK"
    saveFeedbackAndGrade();
  }
};

// Fetch AI status when the component mounts
useEffect(() => {
  const fetchAIStatus = async () => {
    const username = localStorage.getItem('username'); // Get logged-in user's username

    if (!username) {
      console.error('Username is not available in localStorage.');
      setAiEnabled(false); // Default to false if username is not found
      setLoading(false);
      return; // Stop execution if username is undefined
    }

    try {
      const response = await fetch(`http://localhost:5000/assessment/student/${username}`);

      if (!response.ok) {
        // If the response is not successful, throw an error
        const errorText = await response.text(); // Get the raw error text
        throw new Error(`Error fetching AI status: ${errorText}`);
      }

      const data = await response.json(); // Parse the response as JSON
      setAiEnabled(data.aiEnabled); // Set AI status
      console.log(`AI is ${data.aiEnabled ? 'enabled' : 'disabled'} for the class of ${username}`); // Log AI status
    } catch (error) {
      console.error('Error fetching AI status:', error);
      setAiEnabled(false); // Default to false if there is an error
    } finally {
      setLoading(false); // Set loading to false after the fetch
    }
  };

  fetchAIStatus();
}, []);

// Function to save feedback and grade after the pop-up confirmation
const saveFeedbackAndGrade = async () => {
  // Prepare session data before checking AI status
  const email = localStorage.getItem('email'); // Retrieve the email from localStorage
  console.log("Original Question to be saved:", originalQuestion); // Use originalQuestion

  const sessionData = {
    email,
    topicId: selectedTopic.id,
    generatedQuestion: originalQuestion, // Use the original question
    responses: chatHistory, // Save the entire chat history with responses
    datetime: new Date().toISOString(),
  };

  try {
    // Save session data
    const response = await fetch('http://localhost:5000/end_session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sessionData),
    });

    if (response.ok) {
      alert('Session data saved successfully.');

      // Fetch the user_id based on email
      const userIdResponse = await fetch(`http://localhost:5000/get-user-id-by-email?email=${email}`);
      const userIdData = await userIdResponse.json();

      if (!userIdData || !userIdData.user_id) {
        alert('Failed to retrieve user ID.');
        return;
      }

      const userId = userIdData.user_id;

      // Only proceed with feedback and grade generation if the feature is enabled
      if (aiEnabled) {
        setLoading(true); // Set loading state to true to show the loading screen
        setIsGenerating(true); // Show the loading screen
        // Generate feedback and grade concurrently
        setTimeout(async () => {
          try {
            const feedbackResponse = await fetch('http://localhost:5000/generate-feedback-and-grade', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                question: originalQuestion,
                responses: chatHistory,
                selectedRubric: selectedRubric,
              }),
            });

            const feedbackData = await feedbackResponse.json();

            if (feedbackData.feedback) {
              console.log("Generated Feedback:", feedbackData.feedback);
              console.log("Generated Grade:", feedbackData.grade);

              alert(`Feedback and Grade can be seen in your grade.`);

              // Save the feedback and grade into the database
              const feedbackSaveResponse = await fetch('http://localhost:5000/save-feedback', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  userId: userId, // Use the retrieved user_id here
                  username: email,
                  topicId: selectedTopic.id,
                  grade: feedbackData.grade,
                  currentAttempts: currentAttempts,
                  feedback: feedbackData.feedback,
                }),
              });

              if (!feedbackSaveResponse.ok) {
                const errorData = await feedbackSaveResponse.json();
                console.error('Failed to save feedback:', errorData);
                alert('Failed to save feedback.');
              } else {
                alert('Feedback and grade saved successfully.');
              }

            } else {
              console.error('Generated feedback is null or empty');
              alert('Failed to generate valid feedback.');
            }
          } catch (error) {
            console.error('Error generating or saving feedback:', error);
            alert('An error occurred while generating or saving feedback.');
          } finally {
            setIsGenerating(false); // Hide the loading screen
            setLoading(false); // Hide the loading screen once the process is complete
            window.location.href = './'; // Redirect to home (./)
          }
        }, 1000); // Wait for a brief moment before generating feedback
      } else {
        console.log('AI Grading is disabled for this class, skipping feedback and grade generation.');
        window.location.href = './'; // Redirect to home (./) if AI is disabled
      }
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



useEffect(() => {
  const fetchRubrics = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/rubrics");
      if (response.data.length > 0) {
        fetchRubricDetails(response.data[0].rubric_id); // Load first rubric
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error("Error fetching rubrics:", error);
      setLoading(false);
    }
  };

  fetchRubrics();
}, []);

// Fetch details of the first rubric
const fetchRubricDetails = async (rubricId) => {
  try {
    const response = await axios.get(`http://localhost:5000/api/rubric/${rubricId}`);
    console.log("Rubric details:", response.data); // Debugging
    setSelectedRubric(response.data);
  } catch (error) {
    console.error("Error fetching rubric details:", error);
  } finally {
    setLoading(false);
  }
};

// Loading component
const LoadingScreen = () => {
  return (
    <div className="loading-screen">
      <p>Generating feedback and grade...</p>
      <div className="spinner"></div> {/* You can add a CSS spinner here */}
    </div>
  );
};


return (
  <div>
    {/* Inline Navbar */}
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container-fluid">
        {/* Logo or Brand */}
        <a className="navbar-brand" href="/">Home</a>

        {/* Navbar Toggle Button (for mobile responsiveness) */}
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Navbar Links */}
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <a className="nav-link" href="/">Home</a>
            </li>
          </ul>
        </div>
      </div>
    </nav>

    {/* Main Content */}
    <div className="container-fluid mt-5">
      <div className="row">
        {/* Container 1 - Topic Selection */}
        <div className="col-md-2 bg-light sidebar p-3">
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

        {/* Container 2 - Video, Buttons, and Content */}
        <div className="col-md-8">
          <div className="text-center mb-4">
            {/* Show only welcome message and topic selection */}
            {!selectedTopic && (
              <>
                <h1>Hi, Welcome!</h1>
                <h2>Choose your topic:</h2>
              </>
            )}
          </div>

          {/* Show content only if a topic is selected */}
          {selectedTopic && (
            <>
              <div className="text-center">
                <h2>{selectedTopic.topicname}</h2>

                {/* Show video before Start is clicked */}
                {!isGenerating && !generatedQuestion && (
                  <div>
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

                    {/* Timer next to the video */}
                    {selectedTopic && (
                      <div className="text-center">
                        <h3>Time Remaining: {formatTime(countdown)} min</h3>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Show generated question after Start button is clicked */}
              {generatedQuestion && (
                <>
                  <div className="text-center">
                    <h3>Question:</h3>
                    {isGenerating ? (
                      <p>Generating question...</p>
                    ) : (
                      <p>{generatedQuestion}</p>
                    )}
                  </div>

                  {/* Add button to repeat question */}
                  <div className="text-center mt-2">
                    <button
                      className="btn btn-primary"
                      onClick={() => readGeneratedQuestion(generatedQuestion)} // Pass the generated question dynamically
                      disabled={isSpeaking}  // Disable the button when speaking is in progress
                    >
                      Repeat Question
                    </button>
                  </div>

                  {/* User Speech Input */}
                  <div className="text-center">
                    <textarea
                      rows="4"
                      cols="50"
                      value={userResponse}
                      readOnly
                      className="form-control"
                      placeholder="Your speech input will appear here..."
                    ></textarea>
                  </div>

                  {/* Show buttons after Start button is clicked */}
                  <div className="text-center mt-4">
                    <button
                      className="btn btn-secondary mx-2"
                      onClick={() => {
                        handleSendResponse();
                        if (isListening) handleStopRecording(); // Stop recording on send
                      }}
                      disabled={!isActive}
                    >
                      Send Response
                    </button>

                    <button
                      className="btn btn-danger mx-2"
                      onClick={() => {
                        handleSpeechInput(); // Start recording
                      }}
                      disabled={isListening}
                    >
                      {isListening ? 'Listening...' : 'Start Recording'}
                    </button>

                    <button
                      className="btn btn-warning"
                      onClick={() => {
                        // Stop recording if it's active
                        if (isListening) {
                          handleStopRecording();
                        }
                        // Now end the session
                        handleEndSession();
                      }}
                    >
                      End Session
                    </button>
                  </div>
                </>
              )}

              {/* Show the "Click Start To Begin Assessment" text if the question is not yet generated */}
              {!generatedQuestion && !isGenerating && (
                <div className="text-center">
                 
                </div>
              )}

            </>
          )}
        </div>

        {/* Container 3 - Chat History */}
        <div className="col-md-2">
          {/* Always show "Chat History" after a topic is selected */}
          {selectedTopic && (
            <>
              <h3>Chat History</h3>
              <div className="chat-history" style={{ maxHeight: '400px', overflowY: 'scroll' }}>
                {chatHistory.length === 0 ? (
                  <p>No chat history yet.</p> // Show a message if no chat history
                ) : (
                  chatHistory.map((message, index) => (
                    <div key={index} className={message.sender === 'user' ? 'text-end' : 'text-start'}>
                      <p><strong>{message.sender === 'user' ? 'You' : 'AI'}:</strong> {message.text}</p>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>

    {/* Loading Screen (when generating) */}
    {isGenerating && (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex',
        justifyContent: 'center', alignItems: 'center', zIndex: 9999
      }}>
        <div style={{
          backgroundColor: 'white', padding: '20px', borderRadius: '10px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <p>Generating Feedback & Grades...</p>
        </div>
      </div>
    )}
  </div>
);

    };

    export default OralAssessmentHome;
