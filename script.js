
// Initialize Supabase
const supabase = supabase.createClient(
  'https://aivqfbuaagtwpspbwmec.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpdnFmYnVhYWd0d3BzcGJ3bWVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNzEyODAsImV4cCI6MjA2Mzk0NzI4MH0.hebC2ZU5h6DjHDPNWeGSCY7Xabxp-3-YwoLTPNoinsw'
);

let currentUser = null;

function showSection(name) {
  document.getElementById('login-section').style.display = name === 'login' ? 'block' : 'none';
  document.getElementById('profile-section').style.display = name === 'profile' ? 'block' : 'none';
  document.getElementById('chat-section').style.display = name === 'chat' ? 'block' : 'none';
}

window.onload = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    currentUser = user;
    const { data: profile, error } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', user.id)
      .single();

    if (profile) {
      showSection('chat');
      setTimeout(() => {
        addMessage('🤖', "Welcome back! Shall I go ahead and look at what immigration options you may be eligible for, based on your profile?");
      }, 400);
    } else {
      showSection('profile');
    }
  } else {
    showSection('login');
  }
};

const loginForm = document.getElementById('login-form');
loginForm.onsubmit = async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return alert('Login failed: ' + error.message);

  currentUser = data.user;

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('auth_id', currentUser.id)
    .single();

  if (profileError || !profile) {
    showSection('profile');
  } else {
    showSection('chat');
    setTimeout(() => {
      addMessage('🤖', "Welcome back! Shall I go ahead and look at what immigration options you may be eligible for, based on your profile?");
    }, 400);
  }
};

const profileForm = document.getElementById('profile-form');
profileForm.onsubmit = async (e) => {
  e.preventDefault();

  const jobTitle = document.getElementById('job-title').value;
  const education = document.getElementById('education').value;
  const country = document.getElementById('country').value;

  const { error } = await supabase.from('users').insert([
    {
      auth_id: currentUser.id,
      job_title: jobTitle,
      education,
      country
    }
  ]);

  if (error) {
    alert("Error saving profile: " + error.message);
    return;
  }

  alert("✅ Profile saved!");
  showSection('chat');

  setTimeout(() => {
    addMessage('🤖', "Thanks for providing your information. Shall I go ahead and look at what immigration options you may be eligible for?");
  }, 400);
};

const chatForm = document.getElementById('chat-form');
chatForm.onsubmit = async (e) => {
  e.preventDefault();
  const input = document.getElementById('user-input').value;
  if (!input.trim()) return;

  addMessage('🧑', input);
  document.getElementById('user-input').value = '';

  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: input, userId: currentUser?.id }),
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
