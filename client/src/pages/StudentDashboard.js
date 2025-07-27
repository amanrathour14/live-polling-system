import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import '../styles/StudentDashboard.css';

const StudentDashboard = () => {
  const [socket, setSocket] = useState(null);
  const [sessionId, setSessionId] = useState('');
  const [username, setUsername] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [currentPoll, setCurrentPoll] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [pollResults, setPollResults] = useState(null);
  const [showJoinForm, setShowJoinForm] = useState(true);
  const [chatMessages, setChatMessages] = useState([]);
  const [showChat, setShowChat] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [tabId, setTabId] = useState('');
  const [showNameForm, setShowNameForm] = useState(false);
  const [isKicked, setIsKicked] = useState(false);
  
  const navigate = useNavigate();

  // Generate or retrieve tabId and username
  useEffect(() => {
    const storedTabId = localStorage.getItem('studentTabId');
    if (storedTabId) {
      setTabId(storedTabId);
      const storedUsername = localStorage.getItem(`studentName_${storedTabId}`);
      if (storedUsername) {
        setUsername(storedUsername);
        setShowNameForm(false);
      } else {
        setShowNameForm(true);
      }
    } else {
      const newTabId = `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setTabId(newTabId);
      localStorage.setItem('studentTabId', newTabId);
      setShowNameForm(true);
    }
  }, []);

  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on('session-joined', (data) => {
      setIsConnected(true);
      setShowJoinForm(false);
      console.log('Joined session:', data);
    });

    socket.on('poll-created', (poll) => {
      setCurrentPoll(poll);
      setSelectedOption(null);
      setHasVoted(false);
      setPollResults(null);
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
    });

    socket.on('new-message', (message) => {
      setChatMessages(prev => [...prev, message]);
    });

    socket.on('chat-history', (messages) => {
      setChatMessages(messages);
    });

    socket.on('kicked', (data) => {
      setIsKicked(true);
      setIsConnected(false);
      setCurrentPoll(null);
      setPollResults(null);
    });

    socket.on('error', (error) => {
      alert(error.message);
    });

    return () => {
      socket.off('session-joined');
      socket.off('poll-created');
      socket.off('poll-updated');
      socket.off('poll-ended');
      socket.off('new-message');
      socket.off('chat-history');
      socket.off('kicked');
      socket.off('error');
    };
  }, [socket]);

  // Timer effect
  useEffect(() => {
    let interval;
    if (timeRemaining > 0 && !hasVoted) {
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
  }, [timeRemaining, hasVoted]);

  // Show results when time runs out
  useEffect(() => {
    if (timeRemaining === 0 && currentPoll && !pollResults) {
      socket.emit('request-poll-results', { pollId: currentPoll.id });
    }
  }, [timeRemaining, currentPoll, pollResults, socket]);

  // Show results when student has voted
  useEffect(() => {
    if (hasVoted && currentPoll && !pollResults) {
      socket.emit('request-poll-results', { pollId: currentPoll.id });
    }
  }, [hasVoted, currentPoll, pollResults, socket]);

  const handleSetName = () => {
    if (username.trim()) {
      localStorage.setItem(`studentName_${tabId}`, username);
      setShowNameForm(false);
    }
  };

  const handleJoinSession = () => {
    if (!sessionId.trim() || !username.trim()) return;
    
    socket.emit('join-session', {
      sessionId: sessionId,
      role: 'student',
      username: username,
      tabId: tabId
    });
  };

  const handleVote = (optionIndex) => {
    if (hasVoted || !currentPoll || timeRemaining <= 0) return;

    setSelectedOption(optionIndex);
    setHasVoted(true);

    socket.emit('submit-vote', {
      pollId: currentPoll.id,
      optionIndex: optionIndex
    });

    // Request updated results immediately after voting
    setTimeout(() => {
      socket.emit('request-poll-results', { pollId: currentPoll.id });
    }, 100);
  };

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      socket.emit('send-message', {
        sessionId,
        message: newMessage,
        username,
        role: 'student'
      });
      setNewMessage('');
    }
  };

  const handleBackToWelcome = () => {
    navigate('/');
  };

  const handleTryAgain = () => {
    setIsKicked(false);
    setShowJoinForm(true);
    setSessionId('');
    setCurrentPoll(null);
    setPollResults(null);
    setHasVoted(false);
    setSelectedOption(null);
    setTimeRemaining(0);
  };

  const handleChangeName = () => {
    // Clear the stored username and show name form again
    localStorage.removeItem(`studentName_${tabId}`);
    setUsername('');
    setShowNameForm(true);
    setShowJoinForm(false);
  };

  const handleClearData = () => {
    // Clear all localStorage data for this student
    localStorage.removeItem('studentTabId');
    localStorage.removeItem(`studentName_${tabId}`);
    // Reload the page to start fresh
    window.location.reload();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getVotePercentage = (votes, totalVotes) => {
    if (totalVotes === 0) return 0;
    return Math.round((votes / totalVotes) * 100);
  };

  // Kicked out screen
  if (isKicked) {
    return (
      <div className="student-dashboard kicked-screen">
        <div className="kicked-content">
          <div className="brand-tag">
            <span className="lightning-icon">⚡</span>
            + Intervue Poll
          </div>
          <h1>You've been Kicked out !</h1>
          <p>Looks like the teacher had removed you from the poll system. Please Try again sometime.</p>
          <button className="try-again-btn" onClick={handleTryAgain}>
            Try Again
          </button>
          <button className="back-btn" onClick={handleBackToWelcome}>
            ← Back to Welcome
          </button>
          <button className="reset-btn" onClick={handleClearData}>
            Reset All Data
          </button>
        </div>
      </div>
    );
  }

  // Name setup screen
  if (showNameForm) {
    return (
      <div className="student-dashboard">
        <div className="name-setup">
          <div className="brand-tag">
            <span className="lightning-icon">⚡</span>
            Intervue Poll
          </div>
          <div className="setup-card">
            <h2>Welcome to Live Polling</h2>
            <p>Enter your name to get started with the interactive polling experience.</p>
            
            <div className="input-group">
              <label>Enter your name</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your name"
                className="input-field"
                maxLength={50}
                onKeyPress={(e) => e.key === 'Enter' && handleSetName()}
              />
            </div>

            <button 
              className="continue-btn"
              onClick={handleSetName}
              disabled={!username.trim()}
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Join session screen
  if (showJoinForm) {
    return (
      <div className="student-dashboard">
        <div className="join-session">
          <div className="brand-tag">
            <span className="lightning-icon">⚡</span>
            Intervue Poll
          </div>
          <div className="setup-card">
            <h2>Join a Poll Session</h2>
            <p>Enter the session ID provided by your teacher to join the live poll.</p>
            
            <div className="input-group">
              <label>Session ID</label>
              <input
                type="text"
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                placeholder="Enter session ID"
                className="input-field"
                onKeyPress={(e) => e.key === 'Enter' && handleJoinSession()}
              />
            </div>

            <div className="student-info">
              <p><strong>Your Name:</strong> {username}</p>
              <button 
                className="change-name-btn"
                onClick={handleChangeName}
              >
                Change Name
              </button>
            </div>

            <button 
              className="join-btn"
              onClick={handleJoinSession}
              disabled={!sessionId.trim()}
            >
              Join Session
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="student-dashboard">
      <div className="dashboard-header">
        <div className="brand-section">
          <div className="brand-tag">
            <span className="lightning-icon">⚡</span>
            Intervue Poll
          </div>
        </div>
        <div className="header-actions">
          <button className="back-button" onClick={handleBackToWelcome}>
            ← Back to Welcome
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="session-info">
          <h3>Student Dashboard</h3>
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
          </div>
        </div>

        <div className="main-content">
          {!currentPoll ? (
            <div className="waiting-poll">
              <div className="waiting-card">
                <h3>Waiting for Poll</h3>
                <p>Your teacher will create a poll soon...</p>
                <div className="loading-spinner"></div>
              </div>
            </div>
          ) : (
            <div className="active-poll-section">
              <div className="poll-header">
                <h3>Question 1</h3>
                {timeRemaining > 0 && !hasVoted && (
                  <div className="timer">
                    <span className="clock-icon">🕐</span>
                    <span className="time-text">{formatTime(timeRemaining)}</span>
                  </div>
                )}
              </div>
              
              <div className="poll-card">
                <div className="poll-question">
                  {currentPoll.question}
                </div>
                
                {!hasVoted && timeRemaining > 0 ? (
                  <div className="poll-options">
                    {currentPoll.options.map((option, index) => (
                      <button
                        key={index}
                        className={`poll-option-btn ${selectedOption === index ? 'selected' : ''}`}
                        onClick={() => handleVote(index)}
                      >
                        <div className="option-number">{index + 1}</div>
                        <span className="option-text">{option.text}</span>
                      </button>
                    ))}
                  </div>
                ) : hasVoted && !pollResults ? (
                  <div className="poll-results">
                    <h5>Loading Results...</h5>
                    <p>Your vote has been submitted. Loading poll results...</p>
                    <div className="loading-spinner"></div>
                  </div>
                ) : (
                  <div className="poll-results">
                    <h5>Poll Results</h5>
                    {pollResults && pollResults.results.map((option, index) => (
                      <div key={index} className="result-item">
                        <div className="option-number">{index + 1}</div>
                        <span className="option-text">{option.text}</span>
                        <div className="result-bar">
                          <div 
                            className="result-fill"
                            style={{ 
                              width: `${getVotePercentage(option.votes, pollResults.totalVotes)}%` 
                            }}
                          ></div>
                        </div>
                        <span className="vote-percentage">
                          {getVotePercentage(option.votes, pollResults.totalVotes)}%
                        </span>
                      </div>
                    ))}
                    <div className="total-votes">
                      Total Votes: {pollResults ? pollResults.totalVotes : 0}
                    </div>
                  </div>
                )}
                
                {!hasVoted && timeRemaining > 0 && (
                  <div className="submit-section">
                    <button 
                      className="submit-btn"
                      onClick={() => selectedOption !== null && handleVote(selectedOption)}
                      disabled={selectedOption === null}
                    >
                      Submit
                    </button>
                  </div>
                )}
                
                {hasVoted && (
                  <div className="waiting-message">
                    <p>Wait for the teacher to ask a new question..</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {showChat && (
          <div className="chat-section">
            <h3>Chat</h3>
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

      <div className="chat-toggle" onClick={() => setShowChat(!showChat)}>
        💬
      </div>
    </div>
  );
};

export default StudentDashboard; 