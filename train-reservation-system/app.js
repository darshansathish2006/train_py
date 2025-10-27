// Backend API URL
const API_URL = 'http://localhost:8000';

// Application State
let currentUser = null;
let currentTripType = 'oneway';
let selectedTrain = null;
let bookings = [];
let feedbackData = [];
const trains = [];

const discounts = {
  'General': 0,
  'Senior Citizen': 30,
  'Student': 25,
  'Military': 50
};

// Page Navigation
function showPage(pageId) {
  document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
  document.getElementById(pageId).classList.add('active');
}

// Dashboard Navigation (safe: accept optional element reference)
function showDashboardSection(sectionId, el) {
  document.querySelectorAll('.dashboard-section').forEach(section => section.classList.remove('active'));
  const targetSection = document.getElementById(sectionId + '-section');
  if (targetSection) targetSection.classList.add('active');

  document.querySelectorAll('.navbar-link').forEach(link => link.classList.remove('active'));
  if (el && el.classList) {
    el.classList.add('active');
  } else {
    const fallback = Array.from(document.querySelectorAll('.navbar-link')).find(l => {
      return l.getAttribute('onclick') && l.getAttribute('onclick').includes(`'${sectionId}'`);
    });
    if (fallback) fallback.classList.add('active');
  }

  if (sectionId === 'bookings') loadBookings();
  else if (sectionId === 'feedback') loadFeedbackList();
}

// Admin Dashboard Navigation
function showAdminSection(sectionId, el) {
  document.querySelectorAll('.dashboard-section').forEach(section => section.classList.remove('active'));
  const targetSection = document.getElementById(sectionId + '-section');
  if (targetSection) targetSection.classList.add('active');

  document.querySelectorAll('.navbar-link').forEach(link => link.classList.remove('active'));
  if (el && el.classList) {
    el.classList.add('active');
  } else {
    const fallback = Array.from(document.querySelectorAll('.navbar-link')).find(l => {
      return l.getAttribute('onclick') && l.getAttribute('onclick').includes(`'${sectionId}'`);
    });
    if (fallback) fallback.classList.add('active');
  }
}

// Trip Type Toggle (accepts optional element)
function setTripType(type, el) {
  currentTripType = type;
  document.querySelectorAll('.trip-btn').forEach(btn => btn.classList.remove('active'));
  if (el && el.classList) el.classList.add('active');

  const returnDateGroup = document.getElementById('return-date-group');
  if (type === 'roundtrip') {
    returnDateGroup.style.display = 'block';
    document.getElementById('search-return-date').required = true;
  } else {
    returnDateGroup.style.display = 'none';
    document.getElementById('search-return-date').required = false;
  }
}

// Authentication
async function handlePassengerLogin(event) {
  event.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  try {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password })
    });
    const result = await response.json();
    if (result.success) {
      currentUser = result.user;
      showPage('passenger-dashboard');
      showSuccessModal('Login Successful!', `Welcome back, ${currentUser.name}!`);
      document.getElementById('login-form').reset();
    } else alert(result.message);
  } catch (error) {
    console.error('Login error:', error);
    alert('Unable to connect to server. Please make sure the backend is running on port 8000.');
  }
  return false;
}

async function handlePassengerRegister(event) {
  event.preventDefault();
  const name = document.getElementById('reg-name').value;
  const email = document.getElementById('reg-email').value;
  const password = document.getElementById('reg-password').value;
  const age = document.getElementById('reg-age')?.value || 0;
  const gender = document.getElementById('reg-gender')?.value || '';
  const phone = document.getElementById('reg-phone')?.value || null;

  try {
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, password, age, gender, phone })
    });
    const result = await response.json();
    if (result.success) {
      showSuccessModal('Registration Successful!', 'You can now login with your credentials.');
      setTimeout(() => { closeSuccessModal(); showPage('passenger-login'); }, 2000);
      document.getElementById('register-form').reset();
    } else alert(result.message);
  } catch (error) {
    console.error('Registration error:', error);
    alert('Unable to connect to server. Please make sure the backend is running on port 8000.');
  }
  return false;
}

async function handleAdminLogin(event) {
  event.preventDefault();
  const email = document.getElementById('admin-email').value;
  const password = document.getElementById('admin-password').value;

  try {
    const response = await fetch(`${API_URL}/admin-login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password })
    });
    const result = await response.json();
    if (result.success) {
      currentUser = result.user;
      showPage('admin-dashboard');
      showSuccessModal('Admin Login Successful!', `Welcome, ${currentUser.name}!`);
      document.getElementById('admin-login-form').reset();
    } else alert(result.message);
  } catch (error) {
    console.error('Admin login error:', error);
    alert('Unable to connect to server. Please make sure the backend is running on port 8000.');
  }
  return false;
}

function logout() {
  currentUser = null;
  showPage('home-page');
}

// ===== STATION AUTOCOMPLETE =====
document.addEventListener("DOMContentLoaded", () => {
  const sourceInput = document.getElementById("search-source");
  const destInput = document.getElementById("search-destination");

  if (sourceInput) {
    sourceInput.addEventListener("input", (e) => {
      const value = e.target.value.trim();
      if (value.length >= 2) fetchStationSuggestions(value, "source");
      else document.getElementById("source-suggestions").style.display = "none";
    });
  }
  if (destInput) {
    destInput.addEventListener("input", (e) => {
      const value = e.target.value.trim();
      if (value.length >= 2) fetchStationSuggestions(value, "destination");
      else document.getElementById("destination-suggestions").style.display = "none";
    });
  }
  document.addEventListener("click", function(event) {
    if (!event.target.closest('.search-input-group')) {
      document.getElementById("source-suggestions").style.display = "none";
      document.getElementById("destination-suggestions").style.display = "none";
    }
  });
  const today = new Date().toISOString().split('T')[0];
  document.querySelectorAll('input[type="date"]').forEach(input => input.min = today);
});

async function fetchStationSuggestions(query, type) {
  try {
    const response = await fetch(`${API_URL}/search-stations`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query })
    });
    const data = await response.json();
    const suggestionsBox = document.getElementById(`${type}-suggestions`);
    suggestionsBox.innerHTML = "";
    if (data.success && data.stations && data.stations.length > 0) {
      suggestionsBox.style.display = "block";
      data.stations.slice(0, 10).forEach(station => {
        const div = document.createElement("div");
        div.className = "suggestion-item";
        div.innerHTML = `<strong>${station.name}</strong><small>${station.code}</small>`;
        div.onclick = () => {
          document.getElementById(`search-${type}`).value = station.name;
          document.getElementById(`search-${type}-code`).value = station.code;
          suggestionsBox.style.display = "none";
        };
        suggestionsBox.appendChild(div);
      });
    } else suggestionsBox.style.display = "none";
  } catch (error) {
    console.error("Error fetching station suggestions:", error);
    document.getElementById(`${type}-suggestions`).style.display = "none";
  }
}

// Train Search with Station codes
function searchTrains(event) {
  event.preventDefault();
  const sourceCode = document.getElementById('search-source-code').value;
  const destCode = document.getElementById('search-destination-code').value;
  const date = document.getElementById('search-date').value;
  if (!sourceCode || !destCode) { alert('Please select both source and destination stations'); return false; }
  if (sourceCode === destCode) { alert('Source and destination cannot be the same!'); return false; }
  if (!date) { alert('Please select a travel date.'); return false; }
  const dateParts = date.split('-');
  const formattedDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;

  fetch(`${API_URL}/search-trains`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ source: sourceCode, destination: destCode, date: formattedDate })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success && data.trains && data.trains.length > 0) displayTrainResults(data.trains, date);
    else alert('No trains found for this route');
  })
  .catch(err => { console.error('Search error:', err); alert('Error fetching train data'); });
  return false;
}

function displayTrainResults(results, date) {
  const resultsContainer = document.getElementById('search-results');
  const trainsList = document.getElementById('trains-list');
  if (results.length === 0) {
    trainsList.innerHTML = `<div class="card"><div class="card__body"><p style="text-align:center;color:var(--color-text-secondary);">No trains found for this route. Please try a different search.</p></div></div>`;
    resultsContainer.style.display = 'block';
    return;
  }
  trainsList.innerHTML = results.map(train => {
    const availabilityClass = train.available_seats > 50 ? 'available' : train.available_seats > 0 ? 'limited' : 'full';
    const availabilityText = train.available_seats > 0 ? `${train.available_seats} seats available` : 'Fully Booked';
    return `<div class="train-card"><div class="train-header"><div class="train-info"><h4>${train.name}</h4><p class="train-id">Train #${train.train_id}</p></div><span class="status status--${train.available_seats > 0 ? 'success' : 'error'}">${train.available_seats > 0 ? 'Available' : 'Full'}</span></div><div class="train-details"><div class="detail-item"><span class="detail-label">Departure</span><span class="detail-value">${train.departure_time}</span></div><div class="detail-item"><span class="detail-label">Arrival</span><span class="detail-value">${train.arrival_time}</span></div><div class="detail-item"><span class="detail-label">Route</span><span class="detail-value">${train.source} → ${train.destination}</span></div><div class="detail-item"><span class="detail-label">Availability</span><span class="detail-value availability ${availabilityClass}">${availabilityText}</span></div></div><div class="train-footer"><div class="fare-info"><div>Sleeper: ₹${train.fare_sleeper}</div><div style="font-size:var(--font-size-sm);color:var(--color-text-secondary);font-weight:normal;">AC: ₹${train.fare_ac} | First Class: ₹${train.fare_first_class}</div></div><button class="btn btn--primary" onclick="openBookingModal('${train.train_id}', '${date}')" ${train.available_seats === 0 ? 'disabled' : ''}>${train.available_seats > 0 ? 'Book Now' : 'Sold Out'}</button></div></div>`;
  }).join('');
  resultsContainer.style.display = 'block';
  resultsContainer.scrollIntoView({ behavior: 'smooth' });
}

// Booking Modal
function openBookingModal(trainId, date) {
  const trainCards = document.querySelectorAll('.train-card');
  let foundTrain = null;
  trainCards.forEach(card => {
    if (card.querySelector('.train-id').textContent.includes(trainId)) {
      let availText = card.querySelector('.availability')?.textContent || '';
      let availNum = parseInt(availText.replace(/[^0-9]/g, '')) || 0;
      foundTrain = {
        train_id: trainId,
        name: card.querySelector('.train-info h4').textContent,
        source: card.querySelector('.train-details').querySelectorAll('.detail-value')[2].textContent.split(' → ')[0],
        destination: card.querySelector('.train-details').querySelectorAll('.detail-value')[2].textContent.split(' → ')[1],
        departure_time: card.querySelector('.train-details').querySelectorAll('.detail-value')[0].textContent,
        arrival_time: card.querySelector('.train-details').querySelectorAll('.detail-value')[1].textContent,
        available_seats: availNum,
        fare_sleeper: 450,
        fare_ac: 850,
        fare_first_class: 1200
      };
    }
  });
  selectedTrain = foundTrain;
  if (!selectedTrain) return;
  const modal = document.getElementById('booking-modal');
  const trainInfo = document.getElementById('booking-train-info');
  trainInfo.innerHTML = `<h4>${selectedTrain.name}</h4><p><strong>Train:</strong> #${selectedTrain.train_id}</p><p><strong>Route:</strong> ${selectedTrain.source} → ${selectedTrain.destination}</p><p><strong>Date:</strong> ${date}</p><p><strong>Departure:</strong> ${selectedTrain.departure_time} | <strong>Arrival:</strong> ${selectedTrain.arrival_time}</p>`;
  if (currentUser) document.getElementById('passenger-name').value = currentUser.name;
  modal.style.display = 'flex';
  calculateFare();
}

function closeBookingModal() {
  document.getElementById('booking-modal').style.display = 'none';
  document.getElementById('booking-form').reset();
}

// Fare Calculation
function calculateFare() {
  if (!selectedTrain) return;
  const classSelect = document.getElementById('booking-class').value;
  const category = document.getElementById('booking-category').value;
  const numSeats = parseInt(document.getElementById('num-seats').value) || 1;
  let baseFare;
  if (classSelect === 'Sleeper') baseFare = selectedTrain.fare_sleeper;
  else if (classSelect === 'First Class') baseFare = selectedTrain.fare_first_class;
  else baseFare = selectedTrain.fare_ac;
  const totalBaseFare = baseFare * numSeats;
  const discountPercent = discounts[category] || 0;
  const discountAmount = (totalBaseFare * discountPercent) / 100;
  const finalFare = totalBaseFare - discountAmount;
  document.getElementById('base-fare').textContent = `₹${totalBaseFare.toFixed(2)}`;
  document.getElementById('discount-amount').textContent = `- ₹${discountAmount.toFixed(2)} (${discountPercent}%)`;
  document.getElementById('total-fare').textContent = `₹${finalFare.toFixed(2)}`;
}

// Confirm Booking
function confirmBooking(event) {
  event.preventDefault();
  if (!selectedTrain) return false;
  const passengerName = document.getElementById('passenger-name').value;
  const numSeats = parseInt(document.getElementById('num-seats').value);
  const totalFare = document.getElementById('total-fare').textContent;
    // finish confirmBooking
  const travelClass = document.getElementById('booking-class').value;
  const date = document.getElementById('booking-train-info').querySelector('p:nth-child(4)').textContent.split(': ')[1];

  const bookingId = 'BK' + String(bookings.length + 100).padStart(3, '0');
  const newBooking = {
    id: bookingId,
    passenger: passengerName,
    train: selectedTrain.name,
    trainId: selectedTrain.train_id,
    route: `${selectedTrain.source} to ${selectedTrain.destination}`,
    date: date,
    seats: numSeats,
    status: 'Confirmed',
    fare: parseFloat(totalFare.replace('₹', '').replace(/,/g, '')),
    class: travelClass
  };

  // push booking and update local available seats safely
  bookings.push(newBooking);
  if (typeof selectedTrain.available_seats === 'number') {
    selectedTrain.available_seats = Math.max(0, selectedTrain.available_seats - numSeats);
  }

  closeBookingModal();
  showSuccessModal(
    'Booking Confirmed!',
    `Your booking ID is ${bookingId}. Total fare: ${totalFare}`
  );

  return false;
}

// Load Bookings
function loadBookings() {
  const bookingsList = document.getElementById('bookings-list');

  if (!bookingsList) return;
  if (bookings.length === 0) {
    bookingsList.innerHTML = `
      <div class="card">
        <div class="card__body">
          <p style="text-align: center; color: var(--color-text-secondary);">No bookings found. Start by searching for trains!</p>
        </div>
      </div>
    `;
    return;
  }

  bookingsList.innerHTML = bookings.map(booking => `
    <div class="booking-card">
      <div class="booking-header">
        <div>
          <div class="booking-id">Booking ID: ${booking.id}</div>
          <div class="booking-date">Travel Date: ${booking.date}</div>
        </div>
        <span class="status status--${booking.status === 'Confirmed' ? 'success' : 'warning'}">
          ${booking.status}
        </span>
      </div>
      <div class="booking-details">
        <div class="detail-item">
          <span class="detail-label">Train</span>
          <span class="detail-value">${booking.train}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Route</span>
          <span class="detail-value">${booking.route}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Seats</span>
          <span class="detail-value">${booking.seats}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Fare</span>
          <span class="detail-value">₹${booking.fare.toFixed(2)}</span>
        </div>
      </div>
    </div>
  `).join('');
}

// Submit Feedback
function submitFeedback(event) {
  event.preventDefault();

  const train = document.getElementById('feedback-train').value;
  const ratingEl = document.querySelector('input[name="rating"]:checked');
  const rating = ratingEl ? ratingEl.value : 0;
  const comment = document.getElementById('feedback-comment').value;

  if (!train) {
    alert('Please select a train to review.');
    return false;
  }

  const newFeedback = {
    passenger: currentUser ? currentUser.name : 'Anonymous',
    train: train,
    rating: parseInt(rating) || 0,
    comment: comment || '',
    date: new Date().toISOString().split('T')[0]
  };

  feedbackData.push(newFeedback);

  showSuccessModal('Thank You!', 'Your feedback has been submitted successfully.');
  document.getElementById('feedback-form').reset();
  loadFeedbackList();

  return false;
}

// Load Feedback List
function loadFeedbackList() {
  const feedbackList = document.getElementById('feedback-list');
  if (!feedbackList) return;

  if (feedbackData.length === 0) {
    feedbackList.innerHTML = `
      <div class="card">
        <div class="card__body">
          <p style="text-align: center; color: var(--color-text-secondary);">No feedback yet.</p>
        </div>
      </div>
    `;
    return;
  }

  feedbackList.innerHTML = feedbackData.map(feedback => {
    const stars = '⭐'.repeat(Math.max(0, Math.min(5, feedback.rating))) + '☆'.repeat(5 - Math.max(0, Math.min(5, feedback.rating)));
    return `
      <div class="feedback-card">
        <div class="feedback-header">
          <div>
            <div class="feedback-author">${feedback.passenger}</div>
            <div class="feedback-meta">${feedback.train} • ${feedback.date}</div>
          </div>
          <div class="feedback-rating">${stars} ${feedback.rating}.0</div>
        </div>
        <div class="feedback-comment">${feedback.comment}</div>
      </div>
    `;
  }).join('');
}

// Update Profile (client-side demo)
function updateProfile(event) {
  event.preventDefault();
  // In a real app you'd send profile data to backend. Here we just show success.
  showSuccessModal('Profile Updated!', 'Your profile information has been updated successfully.');
  return false;
}

// Admin Functions (client-side/demo)
function showAddTrainForm() {
  const form = document.getElementById('add-train-form');
  if (form) form.style.display = 'block';
}

function hideAddTrainForm() {
  const form = document.getElementById('add-train-form');
  if (form) form.style.display = 'none';
}

function addTrain(event) {
  event.preventDefault();
  // In a real app you'd post the new train to the backend.
  showSuccessModal('Train Added!', 'New train has been added to the system successfully.');
  hideAddTrainForm();
  if (event && event.target) event.target.reset();
  return false;
}

// Success Modal Helpers
function showSuccessModal(title, message) {
  const modal = document.getElementById('success-modal');
  if (!modal) {
    alert(`${title}\n\n${message}`);
    return;
  }
  document.getElementById('success-title').textContent = title;
  document.getElementById('success-message').textContent = message;
  modal.style.display = 'flex';
  // Auto-close after 3s (optional)
  // setTimeout(() => closeSuccessModal(), 3000);
}

function closeSuccessModal() {
  const modal = document.getElementById('success-modal');
  if (modal) modal.style.display = 'none';
}

// Optional: close modals by clicking outside (improves UX)
document.addEventListener('click', (e) => {
  const bookingModal = document.getElementById('booking-modal');
  const successModal = document.getElementById('success-modal');

  if (bookingModal && bookingModal.style.display === 'flex') {
    if (e.target === bookingModal) closeBookingModal();
  }
  if (successModal && successModal.style.display === 'flex') {
    if (e.target === successModal) closeSuccessModal();
  }
});

// safe export for debugging (optional)
window._appState = {
  getBookings: () => bookings,
  getFeedback: () => feedbackData,
  getCurrentUser: () => currentUser
};
