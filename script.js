
document.addEventListener('DOMContentLoaded', async () => {
  if (!localStorage.getItem('sessionId')) {
    localStorage.setItem('sessionId', crypto.randomUUID());
  }
  const sessionId = localStorage.getItem('sessionId');
  console.log("🌐 Initialized sessionId:", sessionId);

  const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm');
  const supabase = createClient('https://aivqfbuaagtwpspbwmec.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpdnFmYnVhYWd0d3BzcGJ3bWVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNzEyODAsImV4cCI6MjA2Mzk0NzI4MH0.hebC2ZU5h6DjHDPNWeGSCY7Xabxp-3-YwoLTPNoinsw');

  let currentUser = null;

  const signupForm = document.getElementById('signup-form');
  const loginForm = document.getElementById('login-form');
  const profileForm = document.getElementById('profile-form');
  const chatForm = document.getElementById('chat-form');
  const chatInput = document.getElementById('chat-input');
  const chatWindow = document.getElementById('chat-window');

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

  signupForm.onsubmit = async (e) => {
    e.preventDefault();
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return alert('Signup failed: ' + error.message);

    if (!data.session) {
  alert('✅ You’ve signed up successfully! Please check your email and confirm your address before logging in.');
  return;
    }

    const { session, user } = data;
    currentUser = user || session?.user;

    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;

    await fetch('https://aivqfbuaagtwpspbwmec.supabase.co/rest/v1/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpdnFmYnVhYWd0d3BzcGJ3bWVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNzEyODAsImV4cCI6MjA2Mzk0NzI4MH0.hebC2ZU5h6DjHDPNWeGSCY7Xabxp-3-YwoLTPNoinsw'
      },
      body: JSON.stringify([
        { auth_id: currentUser.id, email, created_at: new Date().toISOString() }
      ])
    });

    showSection('profile');
  };

  loginForm.onsubmit = async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return alert('Login failed: ' + error.message);

    currentUser = data.user;
    // 🔍 Check if profile already exists
const { data: profile, error: profileError } = await supabase
  .from('users')
  .select('*')
  .eq('auth_id', currentUser.id)
  .single();

if (profile && !profileError) {
  // ✅ User profile exists, go straight to chat
  showSection('chat');
} else {
  // 🆕 No profile yet, prompt for profile info
  showSection('profile');
}
  };

  function showSection(name) {
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('profile-section').style.display = name === 'profile' ? 'block' : 'none';
    document.getElementById('chat-section').style.display = name === 'chat' ? 'block' : 'none';

    if (name === 'profile') {
      currentQuestionIndex = 0;
      profileData = {};
      const profileChat = document.getElementById('profile-chat');
      profileChat.innerHTML = '';
      askNextQuestion();
    }

    if (name === 'chat') {
      const welcomeMsg = "Thanks for providing your information. Shall I go ahead and look at what immigration options you may be eligible for, based on the profile information you just entered?";
      addMessage('🤖', welcomeMsg);
    }
  }

  function askNextQuestion() {
    const question = profileQuestions[currentQuestionIndex];
    if (question) {
      const profileChat = document.getElementById('profile-chat');
      const msg = document.createElement('div');
      msg.textContent = `🤖: ${question.prompt}`;
      profileChat.appendChild(msg);
      profileChat.scrollTop = profileChat.scrollHeight;
    }
  }

  if (profileForm) {
    profileForm.onsubmit = async (e) => {
      e.preventDefault();
      const answer = document.getElementById('profile-input').value.trim();
      if (!answer) return;

      const question = profileQuestions[currentQuestionIndex];
      profileData[question.key] = answer;

      const profileChat = document.getElementById('profile-chat');
      const userMsg = document.createElement('div');
      userMsg.textContent = `🧑: ${answer}`;
      profileChat.appendChild(userMsg);
      document.getElementById('profile-input').value = '';

      currentQuestionIndex++;
      if (currentQuestionIndex < profileQuestions.length) {
        askNextQuestion();
      } else {
        await supabase.from('users').update(profileData).eq('auth_id', currentUser.id);
        const doneMsg = document.createElement('div');
        doneMsg.textContent = `🤖: Thanks! Your profile has been saved. You can now begin chatting.`;
        profileChat.appendChild(doneMsg);
        setTimeout(() => {
          showSection('chat');
        }, 1200);
      }
    };
  }

  if (chatForm) {
    chatForm.onsubmit = async (e) => {
      e.preventDefault();
      const userMessage = chatInput.value.trim();
      if (!userMessage) return;

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
  }

  function addMessage(sender, text) {
    const msgDiv = document.createElement('div');
    msgDiv.className = sender;
    msgDiv.textContent = `${sender}: ${text}`;
    chatWindow.appendChild(msgDiv);
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }
});
