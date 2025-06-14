const supabase = window.supabase.createClient(
  'https://aivqfbuaagtwpspbwmec.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpdnFmYnVhYWd0d3BzcGJ3bWVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNzEyODAsImV4cCI6MjA2Mzk0NzI4MH0.hebC2ZU5h6DjHDPNWeGSCY7Xabxp-3-YwoLTPNoinsw'
);

let currentUser = null;

function showSection(name) {
  document.getElementById('auth-section').style.display = name === 'auth' ? 'block' : 'none';
  document.getElementById('profile-section').style.display = name === 'profile' ? 'block' : 'none';
  document.getElementById('chat-section').style.display = name === 'chat' ? 'block' : 'none';
}

window.onload = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    currentUser = user;
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', user.id)
      .single();

    if (profile) {
      showSection('chat');
      setTimeout(() => {
        addMessage('🤖', "Welcome back! Shall I check your immigration eligibility based on your saved profile?");
      }, 400);
    } else {
      showSection('profile');
    }
  } else {
    showSection('auth');
  }
};

document.getElementById('signup-form').onsubmit = async (e) => {
  e.preventDefault();
  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return alert('Signup failed: ' + error.message);

  currentUser = data.user ?? data.session?.user;
  showSection('profile');
};

document.getElementById('login-form').onsubmit = async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return alert('Login failed: ' + error.message);

  currentUser = data.user;

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('auth_id', currentUser.id)
    .single();

  if (profile) {
    showSection('chat');
    setTimeout(() => {
      addMessage('🤖', "Welcome back! Shall I check your immigration eligibility based on your saved profile?");
    }, 400);
  } else {
    showSection('profile');
  }
};

document.getElementById('profile-form').onsubmit = async (e) => {
  e.preventDefault();
  const formData = {
    auth_id: currentUser.id,
    full_name: document.getElementById('full-name').value,
    country_of_origin: document.getElementById('country-of-origin').value,
    country_of_residence: document.getElementById('country-of-residence').value,
    education: document.getElementById('education').value,
    language: document.getElementById('language').value,
    job_title: document.getElementById('job-title').value,
    job_description: document.getElementById('job-description').value,
    experience: document.getElementById('experience').value,
    family: document.getElementById('family').value
  };

  const { error } = await supabase.from('users').insert([formData]);
  if (error) return alert("Error saving profile: " + error.message);

  alert("✅ Profile saved!");
  showSection('chat');
  setTimeout(() => {
    addMessage('🤖', "Thanks! Shall I look into your immigration eligibility now?");
  }, 400);
};

document.getElementById('chat-form').onsubmit = async (e) => {
  e.preventDefault();
  const input = document.getElementById('user-input').value;
  if (!input.trim()) return;

  addMessage('🧑', input);
  document.getElementById('user-input').value = '';

const response = await fetch('https://cloud.flowiseai.com/api/v1/prediction/2dc876c0-402a-4d8b-a11f-1d647ad6f6f2', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer urda6WDgqtGWNMKYQn91zxCSBezawWlR_BqLjDDgTYk'
  },
  body: JSON.stringify({ question: input, sessionId: currentUser?.id })
});

  const data = await response.json();
  addMessage('🤖', data.reply);
};

function addMessage(sender, text) {
  const chat = document.getElementById('chat');
  const message = document.createElement('div');
  message.classList.add('message');
  message.innerHTML = `<strong>${sender}:</strong> ${text}`;
  chat.appendChild(message);
  chat.scrollTop = chat.scrollHeight;
}
