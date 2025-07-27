import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import '../styles/TeacherDashboard.css';

const TeacherDashboard = () => {
  const [socket, setSocket] = useState(null);
  const [sessionId, setSessionId] = useState('');
  const [username, setUsername] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [currentPoll, setCurrentPoll] = useState(null);
  const [pollResults, setPollResults] = useState(null);
  const [showCreatePoll, setShowCreatePoll] = useState(false);
  const [connectedStudents, setConnectedStudents] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [showChat, setShowChat] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [showPastPolls, setShowPastPolls] = useState(false);
  const [pastPolls, setPastPolls] = useState([]);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [showParticipants, setShowParticipants] = useState(false);
  
  const [newPoll, setNewPoll] = useState({
    question: '',
    options: ['', '', '', ''],
    maxTime: 60,
    correctAnswers: [false, false, false, false]
  });
  
  const navigate = useNavigate();

            const fetchSessionInfo = useCallback(async () => {
            if (!sessionId) return;
            try {
              const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
              const response = await fetch(`${apiUrl}/api/sessions/${sessionId}`);
              const data = await response.json();
              setConnectedStudents(data.students || []);
            } catch (error) {
              console.error('Error fetching session info:', error);
            }
          }, [sessionId]);

            const fetchPastPolls = useCallback(async () => {
            if (!sessionId) return;
            try {
              const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
              const response = await fetch(`${apiUrl}/api/sessions/${sessionId}/past-polls`);
              const data = await response.json();
              setPastPolls(data);
            } catch (error) {
              console.error('Error fetching past polls:', error);
            }
          }, [sessionId]);

  useEffect(() => {
    const socketUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    const newSocket = io(socketUrl);
    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on('session-joined', (data) => {
      setIsConnected(true);
      console.log('Joined session:', data);
    });

    socket.on('user-joined', (data) => {
      if (data.role === 'student') {
        fetchSessionInfo();
      }
    });

    socket.on('poll-created', (poll) => {
      setCurrentPoll(poll);
      setShowCreatePoll(false);
      setTimeRemaining(poll.maxTime / 1000);
    });

    socket.on('poll-updated', (data) => {
      console.log('Poll updated:', data);
      setPollResults(data);
    });

    socket.on('poll-ended', (data) => {
      console.log('Poll ended:', data);
      setPollResults(data.finalResults);
      setTimeRemaining(0);
      fetchPastPolls();
    });

    socket.on('new-message', (message) => {
      setChatMessages(prev => [...prev, message]);
    });

    socket.on('chat-history', (messages) => {
      setChatMessages(messages);
    });

    socket.on('student-kicked', (data) => {
      fetchSessionInfo();
    });

    socket.on('error', (error) => {
      alert(error.message);
    });

    return () => {
      socket.off('session-joined');
      socket.off('user-joined');
      socket.off('poll-created');
      socket.off('poll-updated');
      socket.off('poll-ended');
      socket.off('new-message');
      socket.off('chat-history');
      socket.off('student-kicked');
      socket.off('error');
    };
  }, [socket, fetchSessionInfo, fetchPastPolls]);

  // Timer effect
  useEffect(() => {
    let interval;
    if (timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timeRemaining]);

  const handleCreateSession = () => {
    if (!username.trim()) return;
    
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setSessionId(newSessionId);
    
    socket.emit('join-session', {
      sessionId: newSessionId,
      role: 'teacher',
      username: username
    });
  };

  const handleCreatePoll = () => {
    if (!newPoll.question.trim() || newPoll.options.some(opt => !opt.trim())) {
      alert('Please fill in all fields');
      return;
    }

    socket.emit('create-poll', {
      sessionId,
      question: newPoll.question,
      options: newPoll.options.filter(opt => opt.trim()),
      maxTime: newPoll.maxTime * 1000,
      correctAnswers: newPoll.correctAnswers
    });

    setNewPoll({ 
      question: '', 
      options: ['', '', '', ''], 
      maxTime: 60,
      correctAnswers: [false, false, false, false]
    });
  };

  const handleEndPoll = () => {
    if (currentPoll) {
      socket.emit('end-poll', { pollId: currentPoll.id });
    }
  };

  const handleOptionChange = (index, value) => {
    const updatedOptions = [...newPoll.options];
    updatedOptions[index] = value;
    setNewPoll({ ...newPoll, options: updatedOptions });
  };

  const handleCorrectAnswerChange = (index, isCorrect) => {
    const updatedCorrectAnswers = [...newPoll.correctAnswers];
    updatedCorrectAnswers[index] = isCorrect;
    setNewPoll({ ...newPoll, correctAnswers: updatedCorrectAnswers });
  };

  const handleAddOption = () => {
    const updatedOptions = [...newPoll.options, ''];
    const updatedCorrectAnswers = [...newPoll.correctAnswers, false];
    setNewPoll({ 
      ...newPoll, 
      options: updatedOptions,
      correctAnswers: updatedCorrectAnswers
    });
  };

  const handleRemoveOption = (index) => {
    if (newPoll.options.length <= 2) {
      alert('You must have at least 2 options');
      return;
    }
    
    const updatedOptions = newPoll.options.filter((_, i) => i !== index);
    const updatedCorrectAnswers = newPoll.correctAnswers.filter((_, i) => i !== index);
    setNewPoll({ 
      ...newPoll, 
      options: updatedOptions,
      correctAnswers: updatedCorrectAnswers
    });
  };

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      socket.emit('send-message', {
        sessionId,
        message: newMessage,
        username,
        role: 'teacher'
      });
      setNewMessage('');
    }
  };

  const handleKickStudent = (studentIndex) => {
    if (window.confirm('Are you sure you want to kick this student?')) {
      socket.emit('kick-student', { sessionId, studentIndex });
    }
  };

  const handleBackToWelcome = () => {
    navigate('/');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getVotePercentage = (votes, totalVotes) => {
    if (totalVotes === 0) return 0;
    return Math.round((votes / totalVotes) * 100);
  };

  if (!isConnected) {
    return (
      <div className="teacher-dashboard">
        <div className="dashboard-header">
          <div className="brand-section">
            <div className="brand-tag">
              <span className="lightning-icon">⚡</span>
              Intervue Poll
            </div>
          </div>
          <button className="back-button" onClick={handleBackToWelcome}>
            ← Back to Welcome
          </button>
        </div>

        <div className="session-setup">
          <div className="setup-card">
            <h2>Let's Get Started</h2>
            <p>You'll have the ability to create and manage polls, ask questions, and monitor your students' responses in real-time.</p>
            
            <div className="input-group">
              <label>Enter your name</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your name"
                className="input-field"
                maxLength={50}
              />
            </div>

            <button 
              className="create-session-btn"
              onClick={handleCreateSession}
              disabled={!username.trim()}
            >
              Create Session
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="teacher-dashboard">
      <div className="dashboard-header">
        <div className="brand-section">
          <div className="brand-tag">
            <span className="lightning-icon">⚡</span>
            Intervue Poll
          </div>
        </div>
        <div className="header-actions">
          <button 
            className="view-history-btn"
            onClick={() => setShowPastPolls(!showPastPolls)}
          >
            👁️ View Poll History
          </button>
          <button className="back-button" onClick={handleBackToWelcome}>
            ← Back
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="session-info">
          <h3>Session Information</h3>
          <p><strong>Session ID:</strong> {sessionId}</p>
          <p><strong>Your Name:</strong> {username}</p>
          <p><strong>Status:</strong> {isConnected ? 'Connected' : 'Disconnected'}</p>
          
          <div className="action-buttons">
            <button 
              className="chat-btn"
              onClick={() => setShowChat(!showChat)}
            >
              {showChat ? 'Hide Chat' : 'Show Chat'}
            </button>
            <button 
              className="participants-btn"
              onClick={() => setShowParticipants(!showParticipants)}
            >
              {showParticipants ? 'Hide Participants' : 'Show Participants'}
            </button>
          </div>
        </div>

        <div className="main-content">
          {!currentPoll ? (
            <div className="create-poll-section">
              <h3>Let's Get Started</h3>
              <p>You'll have the ability to create and manage polls, ask questions, and monitor your students' responses in real-time.</p>
              
              <div className="poll-form">
                <div className="question-section">
                  <div className="question-header">
                    <label>Enter your question</label>
                    <div className="time-selector">
                      <select 
                        value={newPoll.maxTime} 
                        onChange={(e) => setNewPoll({...newPoll, maxTime: parseInt(e.target.value)})}
                      >
                        <option value={30}>30 seconds</option>
                        <option value={60}>60 seconds</option>
                        <option value={120}>2 minutes</option>
                        <option value={300}>5 minutes</option>
                      </select>
                    </div>
                  </div>
                  <textarea
                    value={newPoll.question}
                    onChange={(e) => setNewPoll({...newPoll, question: e.target.value})}
                    placeholder="Enter your question here..."
                    className="question-input"
                    maxLength={100}
                  />
                  <div className="char-counter">{newPoll.question.length}/100</div>
                </div>

                <div className="options-section">
                  <label>Edit Options</label>
                  <div className="options-list">
                    {newPoll.options.map((option, index) => (
                      <div key={index} className="option-row">
                        <div className="option-number">{index + 1}</div>
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => handleOptionChange(index, e.target.value)}
                          placeholder={`Option ${index + 1}`}
                          className="option-input"
                        />
                        <div className="correct-answer">
                          <label>
                            <input
                              type="radio"
                              name={`correct-${index}`}
                              checked={newPoll.correctAnswers[index]}
                              onChange={() => handleCorrectAnswerChange(index, true)}
                            />
                            Yes
                          </label>
                          <label>
                            <input
                              type="radio"
                              name={`correct-${index}`}
                              checked={!newPoll.correctAnswers[index]}
                              onChange={() => handleCorrectAnswerChange(index, false)}
                            />
                            No
                          </label>
                        </div>
                        {newPoll.options.length > 2 && (
                          <button 
                            className="remove-option-btn"
                            onClick={() => handleRemoveOption(index)}
                            type="button"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button 
                    className="add-option-btn"
                    onClick={handleAddOption}
                    type="button"
                  >
                    + Add More option
                  </button>
                </div>

                <div className="form-actions">
                  <button 
                    className="ask-question-btn"
                    onClick={handleCreatePoll}
                    disabled={!newPoll.question.trim() || newPoll.options.some(opt => !opt.trim())}
                  >
                    Ask Question
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="active-poll-section">
              <h3>Question</h3>
              <div className="poll-card">
                <div className="poll-question">
                  {currentPoll.question}
                </div>
                
                {timeRemaining > 0 && (
                  <div className="timer">
                    Time Remaining: {formatTime(timeRemaining)}
                  </div>
                )}
                
                <div className="poll-options">
                  {currentPoll.options.map((option, index) => (
                    <div key={index} className="poll-option">
                      <div className="option-number">{index + 1}</div>
                      <span className="option-text">{option.text}</span>
                      {pollResults && (
                        <>
                          <div className="vote-bar">
                            <div 
                              className="vote-fill"
                              style={{ 
                                width: `${pollResults && pollResults.results && pollResults.results[index] ? (pollResults.results[index].votes / Math.max(1, pollResults.totalVotes)) * 100 : 0}%` 
                              }}
                            ></div>
                          </div>
                          <span className="vote-percentage">
                            {pollResults && pollResults.results && pollResults.results[index] ? getVotePercentage(pollResults.results[index].votes, pollResults.totalVotes) : 0}%
                          </span>
                        </>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="poll-actions">
                  <button className="ask-new-btn" onClick={() => setCurrentPoll(null)}>
                    + Ask a new question
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {showParticipants && (
          <div className="participants-section">
            <div className="participants-header">
              <h3>Participants</h3>
              <div className="participants-tabs">
                <button 
                  className={`tab ${!showChat ? 'active' : ''}`}
                  onClick={() => setShowChat(false)}
                >
                  Participants
                </button>
                <button 
                  className={`tab ${showChat ? 'active' : ''}`}
                  onClick={() => setShowChat(true)}
                >
                  Chat
                </button>
              </div>
            </div>
            
            {!showChat ? (
              <div className="participants-list">
                <div className="participants-header-row">
                  <span>Name</span>
                  <span>Action</span>
                </div>
                {connectedStudents.map((student, index) => (
                  <div key={index} className="participant-item">
                    <span className="participant-name">{student.username}</span>
                    <button 
                      className="kick-link"
                      onClick={() => handleKickStudent(index)}
                    >
                      Kick out
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="chat-section">
                <div className="chat-messages">
                  {chatMessages.map((msg, index) => (
                    <div key={index} className={`chat-message ${msg.role}`}>
                      <span className="message-author">{msg.username}</span>
                      <span className="message-text">{msg.message}</span>
                      <span className="message-time">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="chat-input">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <button onClick={handleSendMessage}>Send</button>
                </div>
              </div>
            )}
          </div>
        )}

        {showPastPolls && (
          <div className="past-polls-section">
            <h3>View Poll History</h3>
            <div className="past-polls-list">
              {pastPolls.map((poll, index) => (
                <div key={index} className="past-poll-item">
                  <h4>Question {index + 1}</h4>
                  <div className="past-poll-question">{poll.question}</div>
                  <div className="past-poll-results">
                    {poll.results.map((option, optIndex) => (
                      <div key={optIndex} className="past-result-item">
                        <div className="option-number">{optIndex + 1}</div>
                        <span className="option-text">{option.text}</span>
                        <div className="result-bar">
                          <div 
                            className="result-fill"
                            style={{ 
                              width: `${getVotePercentage(option.votes, poll.results.reduce((sum, opt) => sum + opt.votes, 0))}%` 
                            }}
                          ></div>
                        </div>
                        <span className="vote-percentage">
                          {getVotePercentage(option.votes, poll.results.reduce((sum, opt) => sum + opt.votes, 0))}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="chat-toggle" onClick={() => setShowChat(!showChat)}>
        💬
      </div>
    </div>
  );
};

export default TeacherDashboard; 