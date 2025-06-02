// ✅ Generate and persist sessionId
if (!localStorage.getItem('sessionId')) {
  localStorage.setItem('sessionId', crypto.randomUUID());
}
const sessionId = localStorage.getItem('sessionId');
console.log("🌐 Initialized sessionId:", sessionId);

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
  'https://aivqfbuaagtwpspbwmec.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...Noinsw'
);

let currentUser = null;

// 🔐 AUTH HANDLING
const signupForm = document.getElementById('signup-form');
const loginForm = document.getElementById('login-form');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const chatWindow = document.getElementById('chat-window');

const conversationalFields = [
  { id: 'age', question: "How old are you?" },
  { id: 'nationality', question: "What is your nationality or nationalities?" },
  { id: 'residence', question: "Which country do you currently reside in?" },
  { id: 'education', question: "What is your highest level of education?" },
  { id: 'language', question: "How would you describe your English proficiency? Include any test scores if applicable." },
  { id: 'experience', question: "Tell me about your work experience — your job title, number of years, and a short description." },
  { id: 'family', question: "Can you briefly describe your family status? For example: married with 2 kids." }
];

let profileData = {};
let profileIndex = 0;

function askNextProfileQuestion() {
  if (profileIndex < conversationalFields.length) {
    const question = conversationalFields[profileIndex].question;
    addMessage('🤖', question);
  } else {
    saveProfile();
  }
}

async function saveProfile() {
  const updates = {
    auth_id: currentUser.id,
    age: profileData.age,
    country_of_origin: profileData.nationality,
    country_of_residence: profileData.residence,
    education: profileData.education,
    language: profileData.language,
    work_experience: profileData.experience,
    family_details: profileData.family,
    created_at: new Date().toISOString()
  };

  await supabase.from('users').insert([updates]);
  showSection('chat');
  addMessage('🤖', "Thanks for providing your information. Shall I go ahead and look at what immigration options you may be eligible for, based on the profile information you just entered?");
}

function showSection(sectionName) {
  document.getElementById('auth-section').style.display = 'none';
  document.getElementById('chat-section').style.display = sectionName === 'chat' ? 'block' : 'none';
}

// ✅ Sign Up
signupForm.onsubmit = async (e) => {
  e.preventDefault();
  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return alert('Signup failed: ' + error.message);

  currentUser = data.user;
  addMessage('🤖', "Welcome! Let's set up your profile.");
  showSection('chat');
  profileIndex = 0;
  profileData = {};
  askNextProfileQuestion();
};

// ✅ Log In
loginForm.onsubmit = async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return alert('Login failed: ' + error.message);

  currentUser = data.user;

  const { data: users } = await supabase.from('users').select('*').eq('auth_id', currentUser.id);
  if (users.length > 0) {
    showSection('chat');
    addMessage('🤖', "Welcome back! Ready to explore your immigration options?");
  } else {
    addMessage('🤖', "Welcome! Let's set up your profile.");
    showSection('chat');
    profileIndex = 0;
    profileData = {};
    askNextProfileQuestion();
  }
};

// 💬 Chat Form Handler
chatForm.onsubmit = async (e) => {
  e.preventDefault();
  const userMessage = chatInput.value.trim();
  if (!userMessage) return;

  addMessage('🧑', userMessage);
  chatInput.value = '';

  // If collecting profile:
  if (profileIndex < conversationalFields.length) {
    const fieldId = conversationalFields[profileIndex].id;
    profileData[fieldId] = userMessage;
    profileIndex++;
    askNextProfileQuestion();
    return;
  }

  // If normal message:
  const res = await fetch(`https://cloud.flowiseai.com/api/v1/prediction/2dc876c0-402a-4d8b-a11f-1d647ad6f6f2?sessionId=${sessionId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: userMessage, user_id: currentUser?.id })
  });

  const data = await res.json();
  const botReply = data.text || '[No response]';
  addMessage('🤖', botReply);

  await supabase.from('chat_logs').insert([
    { user_id: currentUser.id, session_id: sessionId, message: userMessage, sender: 'user', timestamp: new Date().toISOString() },
    { user_id: currentUser.id, session_id: sessionId, message: botReply, sender: 'bot', timestamp: new Date().toISOString() }
  ]);
};

function addMessage(sender, text) {
  const div = document.createElement('div');
  div.className = sender;
  div.textContent = `${sender}: ${text}`;
  chatWindow.appendChild(div);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}
