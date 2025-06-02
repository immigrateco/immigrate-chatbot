// ✅ Persist sessionId
if (!localStorage.getItem('sessionId')) {
  localStorage.setItem('sessionId', crypto.randomUUID());
}
const sessionId = localStorage.getItem('sessionId');
console.log("🌐 Initialized sessionId:", sessionId);

// ✅ Import Supabase
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
const supabase = createClient(
  'https://aivqfbuaagtwpspbwmec.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpdnFmYnVhYWd0d3BzcGJ3bWVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNzEyODAsImV4cCI6MjA2Mzk0NzI4MH0.hebC2ZU5h6DjHDPNWeGSCY7Xabxp-3-YwoLTPNoinsw'
);

let currentUser = null;

// ✅ Sections
const signupForm = document.getElementById('signup-form');
const loginForm = document.getElementById('login-form');
const profileForm = document.getElementById('profile-chat-form');
const profileInput = document.getElementById('profile-input');
const profileChat = document.getElementById('profile-chat');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const chatWindow = document.getElementById('chat-window');

// ✅ AUTH FLOW
signupForm.onsubmit = async (e) => {
  e.preventDefault();
  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return alert('Signup failed: ' + error.message);

  currentUser = data.user;
  await supabase.from('users').insert([
    { auth_id: currentUser.id, email, created_at: new Date().toISOString() }
  ]);
  showSection('profile');
  askNextQuestion();
};

loginForm.onsubmit = async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return alert('Login failed: ' + error.message);

  currentUser = data.user;
  showSection('profile');
  askNextQuestion();
};

function showSection(name) {
  document.getElementById('auth-section').style.display = 'none';
  document.getElementById('profile-section').style.display = name === 'profile' ? 'block' : 'none';
  document.getElementById('chat-section').style.display = name === 'chat' ? 'block' : 'none';
}

// ✅ CONVERSATIONAL PROFILE FLOW
const profileQuestions = [
  { key: 'age', prompt: 'How old are you?' },
  { key: 'country_of_origin', prompt: 'What is your nationality?' },
  { key: 'country_of_residence', prompt: 'Which country do you currently live in?' },
  { key: 'education', prompt: 'What is your highest level of education?' },
  { key: 'language', prompt: 'What is your English proficiency? (Do you have an IELTS score?)' },
  { key: 'job_title', prompt: 'What is your current job title?' },
  { key: 'job_description', prompt: 'Briefly describe your job duties.' },
  { key: 'experience', prompt: 'How many years of experience do you have in that role?' },
  { key: 'family', prompt: 'What are your family details? (Marital status, kids?)' }
];

let profileData = {};
let currentQuestionIndex = 0;

function askNextQuestion() {
  const question = profileQuestions[currentQuestionIndex];
  if (question) {
    addToProfileChat('🤖', question.prompt);
  }
}

profileForm.onsubmit = async (e) => {
  e.preventDefault();
  const answer = profileInput.value.trim();
  if (!answer) return;

  const question = profileQuestions[currentQuestionIndex];
  profileData[question.key] = answer;
  addToProfileChat('🧑', answer);
  profileInput.value = '';
  currentQuestionIndex++;

  if (currentQuestionIndex < profileQuestions.length) {
    askNextQuestion();
  } else {
    // Save profile
    await supabase.from('users').update(profileData).eq('auth_id', currentUser.id);
    showSection('chat');
  }
};

function addToProfileChat(sender, text) {
  const msg = document.createElement('div');
  msg.textContent = `${sender}: ${text}`;
  profileChat.appendChild(msg);
  profileChat.scrollTop = profileChat.scrollHeight;
}

// ✅ CHAT FLOW
chatForm.onsubmit = async (e) => {
  e.preventDefault();
  const userMessage = chatInput.value.trim();
  if (!userMessage) return;

  addToChat('🧑', userMessage);
  chatInput.value = '';

  const response = await fetch(`https://cloud.flowiseai.com/api/v1/prediction/2dc876c0-402a-4d8b-a11f-1d647ad6f6f2?sessionId=${sessionId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: userMessage, user_id: currentUser?.id })
  });

  const data = await response.json();
  const botMessage = data.text || '[No response]';
  addToChat('🤖', botMessage);

  await supabase.from('chat_logs').insert([
    { user_id: currentUser.id, session_id: sessionId, message: userMessage, sender: 'user', timestamp: new Date().toISOString() },
    { user_id: currentUser.id, session_id: sessionId, message: botMessage, sender: 'bot', timestamp: new Date().toISOString() }
  ]);
};

function addToChat(sender, text) {
  const msgDiv = document.createElement('div');
  msgDiv.className = sender;
  msgDiv.textContent = `${sender}: ${text}`;
  chatWindow.appendChild(msgDiv);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}
