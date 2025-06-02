// ✅ Generate and persist sessionId
if (!localStorage.getItem('sessionId')) {
  localStorage.setItem('sessionId', crypto.randomUUID());
}
const sessionId = localStorage.getItem('sessionId');
console.log("🌐 Initialized sessionId:", sessionId);

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const supabase = createClient(
  'https://aivqfbuaagtwpspbwmec.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpdnFmYnVhYWd0d3BzcGJ3bWVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNzEyODAsImV4cCI6MjA2Mzk0NzI4MH0.hebC2ZU5h6DjHDPNWeGSCY7Xabxp-3-YwoLTPNoinsw'
);

let currentUser = null;

const signupForm = document.getElementById('signup-form');
const loginForm = document.getElementById('login-form');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const chatWindow = document.getElementById('chat-window');

function showSection(name) {
  document.getElementById('auth-section').style.display = name === 'auth' ? 'block' : 'none';
  document.getElementById('chat-section').style.display = name === 'chat' ? 'block' : 'none';
}

signupForm.onsubmit = async (e) => {
  e.preventDefault();
  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return alert('Signup failed: ' + error.message);

  alert('Signup successful! Please check your email and confirm your address before logging in.');
};

loginForm.onsubmit = async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return alert('Login failed: ' + error.message);

  currentUser = data.user;
  console.log("✅ Logged in user:", currentUser.id);

  // Fetch profile info
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('auth_id', currentUser.id)
    .single();

  if (profileError || !profile) {
    console.warn("No existing profile found. Chatbot will gather info.");
  } else {
    console.log("✅ User profile loaded:", profile);
  }

  showSection('chat');

  setTimeout(() => {
    addMessage('🤖', "Thanks for providing your information. Shall I go ahead and look at what immigration options you may be eligible for, based on the profile information you just entered?");
  }, 400);
};

chatForm.onsubmit = async (e) => {
  e.preventDefault();
  const userMessage = chatInput.value;
  addMessage('🧑', userMessage);
  chatInput.value = '';

  const response = await fetch(`https://cloud.flowiseai.com/api/v1/prediction/2dc876c0-402a-4d8b-a11f-1d647ad6f6f2?sessionId=${sessionId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: userMessage, user_id: currentUser?.id })
  });

  const data = await response.json();
  const botMessage = data.text || '[No response]';
  addMessage('🤖', botMessage);

  await supabase.from('chat_logs').insert([
    {
      user_id: currentUser.id,
      session_id: sessionId,
      message: userMessage,
      sender: 'user',
      timestamp: new Date().toISOString()
    },
    {
      user_id: currentUser.id,
      session_id: sessionId,
      message: botMessage,
      sender: 'bot',
      timestamp: new Date().toISOString()
    }
  ]);
};

function addMessage(sender, text) {
  const msgDiv = document.createElement('div');
  msgDiv.className = sender;
  msgDiv.textContent = `${sender}: ${text}`;
  chatWindow.appendChild(msgDiv);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

