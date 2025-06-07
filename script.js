
const supabaseUrl = 'https://aivqfbuaagtwpspbwmec.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpdnFmYnVhYWd0d3BzcGJ3bWVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNzEyODAsImV4cCI6MjA2Mzk0NzI4MH0.hebC2ZU5h6DjHDPNWeGSCY7Xabxp-3-YwoLTPNoinsw';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');
  const profileForm = document.getElementById('profile-form');
  const chatInterface = document.getElementById('chat-interface');

  function show(element) {
    element.style.display = 'block';
  }

  function hide(element) {
    element.style.display = 'none';
  }

  async function checkProfileAndRedirect(user) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', user.id);

    if (error) {
      console.error('Error checking user profile:', error.message);
      return;
    }

    if (data.length === 0) {
      // No profile exists, show profile form
      hide(loginForm);
      hide(signupForm);
      show(profileForm);
    } else {
      // Profile exists, go to chat
      hide(loginForm);
      hide(signupForm);
      show(chatInterface);
    }
  }

  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;

    const { user, error } = await supabase.auth.signUp({ email, password });

    if (error) return alert('Signup error: ' + error.message);
    if (user) await checkProfileAndRedirect(user);
  });

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) return alert('Login error: ' + error.message);
    if (data.user) await checkProfileAndRedirect(data.user);
  });

  profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const user = (await supabase.auth.getUser()).data.user;

    const profile = {
      auth_id: user.id,
      job_title: document.getElementById('job-title').value,
      nationality: document.getElementById('nationality').value,
      education: document.getElementById('education').value,
      language_score: document.getElementById('language-score').value,
      years_experience: document.getElementById('years-experience').value
    };

    const { error } = await supabase.from('users').insert([profile]);

    if (error) return alert('Profile save error: ' + error.message);

    hide(profileForm);
    show(chatInterface);
  });
});
