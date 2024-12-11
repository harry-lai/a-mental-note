document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (token) {
    showDashboard(); // Show the dashboard if logged in
  } else {
    resetToLogin(); // Reset to login/signup forms if not logged in
  }
});

// Reset UI to login/signup view
function resetToLogin() {
  document.getElementById('signupForm').style.display = 'block';
  document.getElementById('loginForm').style.display = 'block';
  document.getElementById('journalForm').style.display = 'none';
  document.getElementById('entriesList').style.display = 'none';
  document.getElementById('logoutButton').style.display = 'none';
}

// Journal dashboard
async function showDashboard() {
  console.log('Showing dashboard UI');
  document.getElementById('signupForm').style.display = 'none';
  document.getElementById('loginForm').style.display = 'none';
  document.getElementById('signupTitle').style.display = 'none';
  document.getElementById('loginTitle').style.display = 'none';

  document.getElementById('journalForm').style.display = 'block';
  document.getElementById('entriesList').style.display = 'block';
  document.getElementById('logoutButton').style.display = 'block';

  await loadEntries(); 
}

// Journal entry loading
async function loadEntries() {
  console.log('Loading entries...');
  const token = localStorage.getItem('token');
  if (!token) {
    alert('You must log in to view your journal entries.');
    return;
  }

  try {
    const response = await fetch('/entries', {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      if (response.status === 401) {
        alert('Session expired. Please log in again.');
        localStorage.removeItem('token');
        resetToLogin();
        return;
      } else {
        throw new Error('Failed to load entries');
      }
    }

    const entries = await response.json();
    console.log('Loaded entries:', entries);

    // Group entries by date
    const groupedEntries = entries.reduce((groups, entry) => {
      const date = new Date(entry.createdAt).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(entry);
      return groups;
    }, {});

    renderEntries(groupedEntries);
  } catch (error) {
    console.error('Error loading entries:', error);
    alert('Error loading journal entries.');
  }
}

// Detail Entries
function renderEntries(groupedEntries) {
  const entriesList = document.getElementById('entriesList');
  entriesList.innerHTML = ''; // Clear existing entries

  for (const [date, entries] of Object.entries(groupedEntries)) {
    const dateContainer = document.createElement('div');
    dateContainer.classList.add('date-container');

    const dateHeading = document.createElement('h2');
    dateHeading.textContent = date; // Display the formatted date
    dateHeading.classList.add('date-heading');
    dateContainer.appendChild(dateHeading);

    entries.forEach((entry) => {
      const entryItem = document.createElement('div');
      entryItem.classList.add('entry-item');
      entryItem.innerHTML = `
        <h3>${entry.title}</h3> <!-- Display the title -->
        <p>${entry.text}</p>
        <small>Sentiment: ${entry.sentiment}</small>
      `;
      dateContainer.appendChild(entryItem);
    });

    entriesList.appendChild(dateContainer);
  }
}

// Journal submission
document.getElementById('journalForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const title = document.getElementById('entryTitle').value.trim();
  const text = document.getElementById('entryText').value.trim();

  if (!title || !text) {
    alert('Please provide a title and text for your journal entry.');
    return;
  }

  try {
    const response = await fetch('/entries', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ title, text }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message);
    }

    const data = await response.json();
    alert(data.message);
    loadEntries(); // Reload entries after saving
  } catch (error) {
    console.error('Error submitting entry:', error);
    alert(`Failed to save entry: ${error.message}`);
  }
});

// Log out button
document.getElementById('logoutButton').addEventListener('click', () => {
  // Remove the session token
  localStorage.removeItem('token');
  // Reset the UI
  alert('Logged out successfully.');
  location.reload(); // Reload the page to reset forms and visibility
});

// Login Form
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value.trim();

  try {
    const response = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message);
    }

    const data = await response.json();
    localStorage.setItem('token', data.token);
    alert('Login successful!');
    showDashboard(); // This function hides the login/signup and shows the journal dashboard
  } catch (error) {
    console.error('Login error:', error);
    alert(`Login failed: ${error.message}`);
  }
});