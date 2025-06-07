// Initialize Supabase
const supabase = supabase.createClient(
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
        addMessage('🤖', "Welcome back! Shall I go ahead and look at what immigration options you may be eligible for, based on your profile?");
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
      addMessage('🤖', "Welcome back! Shall I go ahead and look at what immigration options you may be eligible for, based on your profile?");
    }, 400);
  } else {
    showSection('profile');
  }
};

document.getElementById('profile-form').onsubmit = async (e) => {
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

document.getElementById('chat-form').onsubmit = async (e) => {
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
