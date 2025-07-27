# 🚀 Live Polling System

A real-time interactive polling system built with React.js, Node.js, and Socket.IO. Perfect for classrooms, presentations, and interactive sessions where teachers can create polls and students can vote in real-time.

**Made with ❤️ by Aman Rathour**

![Live Polling System](https://img.shields.io/badge/React-18.2.0-blue)
![Node.js](https://img.shields.io/badge/Node.js-20.17.0-green)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4.7.2-orange)
![License](https://img.shields.io/badge/License-MIT-yellow)

## ✨ Features

### 🎓 Teacher Features
- **Create Interactive Polls** - Design custom questions with multiple options
- **Dynamic Options Management** - Add/remove options on the fly (minimum 2, unlimited maximum)
- **Time Management** - Set custom time limits (30s, 60s, 2min, 5min)
- **Correct Answer Marking** - Mark correct answers for quiz functionality
- **Real-time Results** - View live voting results with progress bars and percentages
- **Student Management** - Kick students from sessions
- **Poll History** - View past poll results and statistics
- **Live Chat** - Communicate with students in real-time
- **Professional UI** - Clean, modern interface with Intervue Poll branding

### 👨‍🎓 Student Features
- **Easy Session Joining** - Join with simple session ID
- **Persistent Names** - Names saved per browser tab
- **Real-time Voting** - Vote on active polls with visual feedback
- **Live Results** - See results immediately after voting
- **Timer Display** - Visual countdown timer
- **Interactive Chat** - Chat with teacher and other students
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Kick Handling** - Graceful handling when removed from session

### 🔧 Technical Features
- **Real-time Communication** - Powered by Socket.IO
- **Multiple Students** - Unlimited students can join simultaneously
- **Tab-based Uniqueness** - Each browser tab acts as a unique student
- **Data Persistence** - localStorage for user preferences
- **Error Handling** - Comprehensive error management
- **Responsive Design** - Mobile-first approach
- **Modern UI/UX** - Professional design with purple gradients

## 🛠️ Tech Stack

### Frontend
- **React.js 18.2.0** - Modern UI framework
- **Socket.IO Client** - Real-time communication
- **React Router DOM** - Client-side routing
- **CSS3** - Modern styling with gradients and animations

### Backend
- **Node.js 20.17.0** - Server runtime
- **Express.js** - Web framework
- **Socket.IO** - Real-time bidirectional communication
- **CORS** - Cross-origin resource sharing
- **Helmet** - Security middleware
- **Rate Limiting** - API protection

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/live-polling-system.git
   cd live-polling-system
   ```

2. **Install backend dependencies**
   ```bash
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd client
   npm install
   cd ..
   ```

4. **Start the backend server**
   ```bash
   npm start
   ```
   The server will run on `http://localhost:5000`

5. **Start the frontend application**
   ```bash
   cd client
   npm start
   ```
   The application will run on `http://localhost:3000`

## 📸 Screenshots

### Welcome Screen
![Welcome Screen](https://i.imgur.com/example1.png)
*Clean and modern welcome interface with role selection for students and teachers*

### Teacher Dashboard - Poll Creation
![Teacher Dashboard - Poll Creation](https://i.imgur.com/example2.png)
*Advanced poll creation interface with multiple options, time limits, and correct answer selection*

### Student Interface - Active Poll
![Student Interface - Active Poll](https://i.imgur.com/example3.png)
*Student view with active poll, countdown timer, and submit button*

### Student Interface - Poll Results
![Student Interface - Poll Results](https://i.imgur.com/example4.png)
*Live voting results with progress bars, participant list, and chat functionality*

### Student Interface - Kicked Out
![Student Interface - Kicked Out](https://i.imgur.com/example5.png)
*Clean kicked out message with Intervue Poll branding*

### Student Interface - Poll Selection
![Student Interface - Poll Selection](https://i.imgur.com/example6.png)
*Student view with poll options and selection interface*

## 🚀 Usage

### For Teachers

1. **Access the Application**
   - Open `http://localhost:3000` in your browser
   - Click "Teacher" to enter teacher mode

2. **Create a Session**
   - Enter your name
   - Click "Create Session"
   - Share the Session ID with your students

3. **Create a Poll**
   - Enter your question (max 100 characters)
   - Add options (minimum 2, click "+ Add More option" for more)
   - Set time limit
   - Mark correct answers if needed
   - Click "Ask Question"

4. **Monitor Results**
   - View real-time voting results
   - See student participation
   - Use chat to communicate
   - View poll history

### For Students

1. **Join a Session**
   - Open `http://localhost:3000` in your browser
   - Click "Student" to enter student mode
   - Enter your name (saved per tab)
   - Enter the Session ID provided by your teacher
   - Click "Join Session"

2. **Participate in Polls**
   - Select your answer from the options
   - Click "Submit" to vote
   - View real-time results
   - Use chat to communicate

## 📱 Features in Detail

### Real-time Polling
- **Instant Updates** - Results update in real-time as students vote
- **Visual Progress Bars** - See vote distribution with animated bars
- **Percentage Display** - Clear percentage breakdown of votes
- **Timer Integration** - Automatic poll ending with countdown

### Student Management
- **Unique Tab System** - Each browser tab represents a unique student
- **Name Persistence** - Names saved locally per tab
- **Kick Functionality** - Teachers can remove disruptive students
- **Connection Status** - Real-time connection monitoring

### Chat System
- **Real-time Messaging** - Instant communication between teachers and students
- **Role-based Messages** - Different styling for teachers and students
- **Message History** - View chat history when joining
- **Floating Chat Toggle** - Easy access to chat from anywhere

### Poll History
- **Past Poll Results** - View all previous polls in the session
- **Detailed Statistics** - See vote counts and percentages
- **Question Tracking** - Organized by question number
- **Session Persistence** - History maintained throughout session

## 🎨 UI/UX Design

### Design Philosophy
- **Clean & Modern** - Minimalist design with focus on functionality
- **Professional Branding** - Intervue Poll identity with lightning bolt icon
- **Purple Gradient Theme** - Consistent color scheme throughout
- **Responsive Layout** - Works seamlessly on all device sizes

### Key Design Elements
- **Gradient Buttons** - Purple gradients for primary actions
- **Card-based Layout** - Clean card design for content organization
- **Progress Bars** - Visual representation of poll results
- **Smooth Animations** - Subtle animations for better user experience

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory:

```env
PORT=5000
NODE_ENV=development
```

### Customization
- **Port Configuration** - Change server port in `server.js`
- **Time Limits** - Modify available time options in TeacherDashboard
- **UI Colors** - Update CSS variables for custom theming
- **Maximum Options** - Adjust option limits in validation logic

## 🚀 Deployment

### Local Development
```bash
# Backend
npm start

# Frontend
cd client && npm start
```

### Production Deployment
1. **Build the frontend**
   ```bash
   cd client
   npm run build
   ```

2. **Deploy to your preferred platform**
   - Heroku
   - Vercel
   - Netlify
   - AWS
   - DigitalOcean

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Socket.IO** - For real-time communication capabilities
- **React.js** - For the powerful frontend framework
- **Express.js** - For the robust backend framework
- **CSS3** - For modern styling and animations

## 📞 Support

If you have any questions or need support:

1. **Check the Issues** - Look for similar problems in the GitHub issues
2. **Create an Issue** - Report bugs or request features
3. **Contact** - Reach out for additional support

---

**Made with ❤️ by Aman Rathour for interactive learning and real-time engagement**

*Intervue Poll - Making learning interactive and engaging* 