
if (!localStorage.getItem('sessionId')) {
  localStorage.setItem('sessionId', crypto.randomUUID());
}
const sessionId = localStorage.getItem('sessionId');

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const supabase = createClient('https://aivqfbuaagtwpspbwmec.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpdnFmYnVhYWd0d3BzcGJ3bWVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNzEyODAsImV4cCI6MjA2Mzk0NzI4MH0.hebC2ZU5h6DjHDPNWeGSCY7Xabxp-3-YwoLTPNoinsw')

let user = null

window.login = async function () {
  const email = document.getElementById('email').value
  const password = document.getElementById('password').value

  let { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    // Try signing up if login fails
    const signup = await supabase.auth.signUp({ email, password })
    if (signup.error) {
      alert('Login/signup failed: ' + signup.error.message)
      return
    }
    data = signup.data
  }

  user = data.user
  document.getElementById('auth').style.display = 'none'
  document.getElementById('chat').style.display = 'block'
}

window.sendMessage = async function () {
  const input = document.getElementById('userInput').value
  addMessage('🧑', input)

  const res = await fetch(`https://cloud.flowiseai.com/api/v1/prediction/2dc876c0-402a-4d8b-a11f-1d647ad6f6f2?sessionId=${sessionId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: input, user_id: user?.id })
  })
  const data = await res.json()
  addMessage('🤖', data.text)

  await supabase.from('chat_logs').insert([
    { user_id: user.id, question: input, answer: data.text }
  ])
}

function addMessage(sender, text) {
  const msg = document.createElement('div')
  msg.textContent = `${sender}: ${text}`
  document.getElementById('messages').appendChild(msg)
}
