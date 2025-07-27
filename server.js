const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS (Socket.IO)"));
      }
    },
    methods: ["GET", "POST"],
    credentials: true
  }
});


// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Middleware
app.use(helmet());
const allowedOrigins = [
  "http://localhost:3000",
  "https://live-polling-system-frontttttt.onrender.com"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));


// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

app.use(express.json());

// Create public directory if it doesn't exist
const fs = require('fs');
const path = require('path');
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

app.use(express.static('public'));

// In-memory storage for demo (replace with MySQL/Redis in production)
const polls = new Map();
const activeSessions = new Map();
const userSessions = new Map();
const studentNames = new Map(); // Track student names per session
const pollTimers = new Map(); // Track poll timers
const pastPolls = new Map(); // Store past poll results

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join a polling session
  socket.on('join-session', (data) => {
    const { sessionId, role, username, tabId } = data;
    socket.join(sessionId);
    
    if (!activeSessions.has(sessionId)) {
      activeSessions.set(sessionId, {
        teacher: null,
        students: new Map(), // Changed to Map to track by tabId
        currentPoll: null,
        pollResults: {},
        pollStartTime: null,
        maxTime: 60000, // Default 60 seconds
        allStudentsAnswered: false,
        chatMessages: []
      });
    }
    
    const session = activeSessions.get(sessionId);
    userSessions.set(socket.id, { sessionId, role, username, tabId });
    
    if (role === 'teacher') {
      session.teacher = socket.id;
    } else {
      // Check if this tabId is already in the session (prevent duplicate tabs)
      if (session.students.has(tabId)) {
        socket.emit('error', { message: 'This tab is already connected to the session' });
        return;
      }
      
      session.students.set(tabId, { socketId: socket.id, username, hasAnswered: false });
      studentNames.set(tabId, username);
    }
    
    socket.emit('session-joined', { sessionId, role });
    io.to(sessionId).emit('user-joined', { role, username });
    
    // Send current session state
    if (session.currentPoll) {
      socket.emit('poll-created', polls.get(session.currentPoll));
      if (role === 'student') {
        const student = session.students.get(tabId);
        if (student && student.hasAnswered) {
          socket.emit('poll-updated', {
            pollId: session.currentPoll,
            results: polls.get(session.currentPoll).options,
            totalVotes: polls.get(session.currentPoll).options.reduce((sum, opt) => sum + opt.votes, 0)
          });
        }
      }
    }
    
    // Send chat messages
    socket.emit('chat-history', session.chatMessages);
  });

  // Create a new poll (Teacher only)
  socket.on('create-poll', (data) => {
    const { sessionId, question, options, maxTime, correctAnswers } = data;
    const userSession = userSessions.get(socket.id);
    
    if (userSession && userSession.role === 'teacher') {
      const session = activeSessions.get(sessionId);
      
      // Check if there's already an active poll or if not all students have answered
      if (session.currentPoll && !session.allStudentsAnswered) {
        socket.emit('error', { message: 'Cannot create new poll while current poll is active' });
        return;
      }
      
      const pollId = `poll_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const poll = {
        id: pollId,
        question,
        options: options.map((opt, index) => ({ 
          text: opt, 
          votes: 0,
          isCorrect: correctAnswers && correctAnswers[index] ? true : false
        })),
        createdAt: new Date(),
        isActive: true,
        maxTime: maxTime || 60000
      };
      
      polls.set(pollId, poll);
      
      if (session) {
        session.currentPoll = pollId;
        session.pollResults[pollId] = { totalVotes: 0, options: {} };
        session.pollStartTime = Date.now();
        session.allStudentsAnswered = false;
        
        // Reset student answer status
        session.students.forEach(student => {
          student.hasAnswered = false;
        });
      }
      
      io.to(sessionId).emit('poll-created', poll);
      
      // Start timer
      const timer = setTimeout(() => {
        endPoll(sessionId, pollId);
      }, poll.maxTime);
      
      pollTimers.set(pollId, timer);
    }
  });

  // Submit a vote (Student only)
  socket.on('submit-vote', (data) => {
    const { pollId, optionIndex } = data;
    const userSession = userSessions.get(socket.id);
    
    if (userSession && userSession.role === 'student') {
      const poll = polls.get(pollId);
      const session = activeSessions.get(userSession.sessionId);
      
      if (poll && poll.isActive && session) {
        const student = session.students.get(userSession.tabId);
        
        if (student && !student.hasAnswered) {
          poll.options[optionIndex].votes++;
          student.hasAnswered = true;
          
          if (session.pollResults[pollId]) {
            session.pollResults[pollId].totalVotes++;
            session.pollResults[pollId].options[optionIndex] = 
              (session.pollResults[pollId].options[optionIndex] || 0) + 1;
          }
          
          // Check if all students have answered
          const allAnswered = Array.from(session.students.values()).every(s => s.hasAnswered);
          if (allAnswered) {
            session.allStudentsAnswered = true;
            // End poll early if all students answered
            endPoll(userSession.sessionId, pollId);
          } else {
            // Broadcast updated results to all users in the session
            const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes, 0);
            io.to(userSession.sessionId).emit('poll-updated', {
              pollId,
              results: poll.options,
              totalVotes: totalVotes
            });
          }
        }
      }
    }
  });

  // End a poll (Teacher only or timer)
  socket.on('end-poll', (data) => {
    const { pollId } = data;
    const userSession = userSessions.get(socket.id);
    
    if (userSession && userSession.role === 'teacher') {
      endPoll(userSession.sessionId, pollId);
    }
  });

  // Request poll results
  socket.on('request-poll-results', (data) => {
    const { pollId } = data;
    const userSession = userSessions.get(socket.id);
    
    if (userSession) {
      const poll = polls.get(pollId);
      if (poll) {
        const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes, 0);
        socket.emit('poll-updated', {
          pollId,
          results: poll.options,
          totalVotes: totalVotes
        });
      }
    }
  });

  // Chat functionality
  socket.on('send-message', (data) => {
    const { sessionId, message, username, role } = data;
    const userSession = userSessions.get(socket.id);
    
    if (userSession) {
      const session = activeSessions.get(sessionId);
      if (session) {
        const chatMessage = {
          id: Date.now(),
          username,
          role,
          message,
          timestamp: new Date()
        };
        
        session.chatMessages.push(chatMessage);
        io.to(sessionId).emit('new-message', chatMessage);
      }
    }
  });

  // Kick student (Teacher only)
  socket.on('kick-student', (data) => {
    const { sessionId, studentIndex } = data;
    const userSession = userSessions.get(socket.id);
    
    if (userSession && userSession.role === 'teacher') {
      const session = activeSessions.get(sessionId);
      if (session) {
        const studentEntries = Array.from(session.students.entries());
        if (studentIndex >= 0 && studentIndex < studentEntries.length) {
          const [studentTabId, student] = studentEntries[studentIndex];
          const studentSocket = io.sockets.sockets.get(student.socketId);
          
          if (studentSocket) {
            studentSocket.emit('kicked', { message: 'You have been kicked from the session' });
            studentSocket.disconnect();
          }
          
          session.students.delete(studentTabId);
          io.to(sessionId).emit('student-kicked', { studentTabId, username: student.username });
        }
      }
    }
  });

  // Disconnect handling
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    const userSession = userSessions.get(socket.id);
    
    if (userSession) {
      const session = activeSessions.get(userSession.sessionId);
      if (session) {
        if (userSession.role === 'teacher') {
          session.teacher = null;
        } else {
          session.students.delete(userSession.tabId);
        }
        
        // If no users left, clean up the session
        if (!session.teacher && session.students.size === 0) {
          activeSessions.delete(userSession.sessionId);
        }
      }
      userSessions.delete(socket.id);
    }
  });
});

// Helper function to end poll
function endPoll(sessionId, pollId) {
  const session = activeSessions.get(sessionId);
  const poll = polls.get(pollId);
  
  if (session && poll) {
    poll.isActive = false;
    session.currentPoll = null;
    session.allStudentsAnswered = true;
    
    // Clear timer
    if (pollTimers.has(pollId)) {
      clearTimeout(pollTimers.get(pollId));
      pollTimers.delete(pollId);
    }
    
    // Store in past polls
    if (!pastPolls.has(sessionId)) {
      pastPolls.set(sessionId, []);
    }
    pastPolls.get(sessionId).push({
      ...poll,
      endedAt: new Date(),
      results: poll.options
    });
    
    const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes, 0);
    io.to(sessionId).emit('poll-ended', { 
      pollId, 
      finalResults: {
        results: poll.options,
        totalVotes: totalVotes
      }
    });
  }
}

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Live Polling System is running' });
});

app.get('/api/sessions/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const session = activeSessions.get(sessionId);
  
  if (session) {
    res.json({
      sessionId,
      teacherConnected: !!session.teacher,
      studentCount: session.students.size,
      currentPoll: session.currentPoll ? polls.get(session.currentPoll) : null,
      students: Array.from(session.students.values()).map(s => ({ username: s.username, hasAnswered: s.hasAnswered }))
    });
  } else {
    res.status(404).json({ error: 'Session not found' });
  }
});

app.get('/api/sessions/:sessionId/past-polls', (req, res) => {
  const { sessionId } = req.params;
  const pastPollsList = pastPolls.get(sessionId) || [];
  res.json(pastPollsList);
});

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, 'client/build')));

// Serve React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Live Polling System server running on port ${PORT}`);
  console.log(`📡 Socket.IO server ready for real-time connections`);
}); 