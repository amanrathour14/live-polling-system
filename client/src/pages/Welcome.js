import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Welcome.css';

const Welcome = () => {
  const [selectedRole, setSelectedRole] = useState(null);
  const navigate = useNavigate();

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
  };

  const handleContinue = () => {
    if (selectedRole === 'teacher') {
      navigate('/teacher');
    } else if (selectedRole === 'student') {
      navigate('/student');
    }
  };

  return (
    <div className="welcome-container">
      {/* Top Banner */}
      <div className="top-banner">
        <div className="brand-tag">
          <span className="star-icon">✦</span>
          Intervue Poll
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <h1 className="main-title">Welcome to the Live Polling System</h1>
        <p className="instruction-text">
          Please select the role that best describes you to begin using the live polling system
        </p>

        {/* Role Selection Cards */}
        <div className="role-cards">
          <div 
            className={`role-card ${selectedRole === 'student' ? 'selected' : ''}`}
            onClick={() => handleRoleSelect('student')}
          >
            <h2 className="role-title">I'm a Student</h2>
            <p className="role-description">
              Join live polls, submit answers, and view real-time results. Your name is saved per tab for convenience.
            </p>
          </div>

          <div 
            className={`role-card ${selectedRole === 'teacher' ? 'selected' : ''}`}
            onClick={() => handleRoleSelect('teacher')}
          >
            <h2 className="role-title">I'm a Teacher</h2>
            <p className="role-description">
              Create polls, manage sessions, view live results, and interact with students through chat.
            </p>
          </div>
        </div>

        {/* Continue Button */}
        <button 
          className={`continue-button ${selectedRole ? 'active' : ''}`}
          onClick={handleContinue}
          disabled={!selectedRole}
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default Welcome; 