// Application State
let currentUser = null;
let currentTripType = 'oneway';
let selectedTrain = null;
let bookings = [
  {
    id: 'BK001',
    passenger: 'John Doe',
    train: 'Express Superfast',
    trainId: '12345',
    route: 'Mumbai to Delhi',
    date: '2025-11-15',
    seats: 2,
    status: 'Confirmed',
    fare: 900
  },
  {
    id: 'BK002',
    passenger: 'Jane Smith',
    train: 'Rajdhani Express',
    trainId: '67890',
    route: 'Chennai to Kolkata',
    date: '2025-11-20',
    seats: 1,
    status: 'Waiting List',
    fare: 1150
  }
];

let feedbackData = [
  {
    passenger: 'John Doe',
    train: 'Express Superfast',
    rating: 4,
    comment: 'Comfortable journey, good service',
    date: '2025-10-20'
  },
  {
    passenger: 'Jane Smith',
    train: 'Rajdhani Express',
    rating: 5,
    comment: 'Excellent food and punctual arrival',
    date: '2025-10-18'
  }
];

const trains = [
  {
    train_id: '12345',
    name: 'Express Superfast',
    source: 'Mumbai',
    destination: 'Delhi',
    departure_time: '06:00',
    arrival_time: '22:30',
    total_seats: 200,
    booked_seats: 150,
    available_seats: 50,
    fare_sleeper: 450,
    fare_ac: 850,
    fare_first_class: 1200
  },
  {
    train_id: '67890',
    name: 'Rajdhani Express',
    source: 'Chennai',
    destination: 'Kolkata',
    departure_time: '14:15',
    arrival_time: '08:45',
    total_seats: 300,
    booked_seats: 280,
    available_seats: 20,
    fare_sleeper: 680,
    fare_ac: 1150,
    fare_first_class: 1800
  }
];

const discounts = {
  'General': 0,
  'Senior Citizen': 30,
  'Student': 25,
  'Military': 50
};

// Page Navigation
function showPage(pageId) {
  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
  });
  document.getElementById(pageId).classList.add('active');
}

// Dashboard Navigation
function showDashboardSection(sectionId) {
  document.querySelectorAll('.dashboard-section').forEach(section => {
    section.classList.remove('active');
  });
  document.getElementById(sectionId + '-section').classList.add('active');

  // Update navbar links
  document.querySelectorAll('.navbar-link').forEach(link => {
    link.classList.remove('active');
  });
  event.target.classList.add('active');

  // Load section-specific data
  if (sectionId === 'bookings') {
    loadBookings();
  } else if (sectionId === 'feedback') {
    loadFeedbackList();
  }
}

// Admin Dashboard Navigation
function showAdminSection(sectionId) {
  document.querySelectorAll('.dashboard-section').forEach(section => {
    section.classList.remove('active');
  });
  document.getElementById(sectionId + '-section').classList.add('active');

  // Update navbar links
  document.querySelectorAll('.navbar-link').forEach(link => {
    link.classList.remove('active');
  });
  event.target.classList.add('active');
}

// Authentication
function handlePassengerLogin(event) {
  event.preventDefault();
  const email = document.getElementById('login-email').value;
  currentUser = { email: email, name: 'John Doe', type: 'passenger' };
  showPage('passenger-dashboard');
  return false;
}

function handlePassengerRegister(event) {
  event.preventDefault();
  const name = document.getElementById('reg-name').value;
  const email = document.getElementById('reg-email').value;
  currentUser = { email: email, name: name, type: 'passenger' };
  showSuccessModal('Registration Successful!', 'You can now login with your credentials.');
  setTimeout(() => {
    closeSuccessModal();
    showPage('passenger-login');
  }, 2000);
  return false;
}

function handleAdminLogin(event) {
  event.preventDefault();
  const email = document.getElementById('admin-email').value;
  currentUser = { email: email, name: 'Admin', type: 'admin' };
  showPage('admin-dashboard');
  return false;
}

function logout() {
  currentUser = null;
  showPage('home-page');
}

// Trip Type Toggle
function setTripType(type) {
  currentTripType = type;
  document.querySelectorAll('.trip-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  event.target.classList.add('active');

  const returnDateGroup = document.getElementById('return-date-group');
  if (type === 'roundtrip') {
    returnDateGroup.style.display = 'block';
    document.getElementById('search-return-date').required = true;
  } else {
    returnDateGroup.style.display = 'none';
    document.getElementById('search-return-date').required = false;
  }
}

// Train Search
function searchTrains(event) {
  event.preventDefault();
  
  const source = document.getElementById('search-source').value;
  const destination = document.getElementById('search-destination').value;
  const date = document.getElementById('search-date').value;

  if (source === destination) {
    alert('Source and destination cannot be the same!');
    return false;
  }

  // Filter trains based on search criteria
  const results = trains.filter(train => 
    train.source === source && train.destination === destination
  );

  displayTrainResults(results, date);
  return false;
}

function displayTrainResults(results, date) {
  const resultsContainer = document.getElementById('search-results');
  const trainsList = document.getElementById('trains-list');

  if (results.length === 0) {
    trainsList.innerHTML = `
      <div class="card">
        <div class="card__body">
          <p style="text-align: center; color: var(--color-text-secondary);">No trains found for this route. Please try a different search.</p>
        </div>
      </div>
    `;
    resultsContainer.style.display = 'block';
    return;
  }

  trainsList.innerHTML = results.map(train => {
    const availabilityClass = train.available_seats > 50 ? 'available' : 
                             train.available_seats > 0 ? 'limited' : 'full';
    const availabilityText = train.available_seats > 0 ? 
                            `${train.available_seats} seats available` : 
                            'Fully Booked';

    return `
      <div class="train-card">
        <div class="train-header">
          <div class="train-info">
            <h4>${train.name}</h4>
            <p class="train-id">Train #${train.train_id}</p>
          </div>
          <span class="status status--${train.available_seats > 0 ? 'success' : 'error'}">
            ${train.available_seats > 0 ? 'Available' : 'Full'}
          </span>
        </div>
        
        <div class="train-details">
          <div class="detail-item">
            <span class="detail-label">Departure</span>
            <span class="detail-value">${train.departure_time}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Arrival</span>
            <span class="detail-value">${train.arrival_time}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Route</span>
            <span class="detail-value">${train.source} → ${train.destination}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Availability</span>
            <span class="detail-value availability ${availabilityClass}">${availabilityText}</span>
          </div>
        </div>

        <div class="train-footer">
          <div class="fare-info">
            <div>Sleeper: ₹${train.fare_sleeper}</div>
            <div style="font-size: var(--font-size-sm); color: var(--color-text-secondary); font-weight: normal;">AC: ₹${train.fare_ac} | First Class: ₹${train.fare_first_class}</div>
          </div>
          <button class="btn btn--primary" 
                  onclick="openBookingModal('${train.train_id}', '${date}')" 
                  ${train.available_seats === 0 ? 'disabled' : ''}>
            ${train.available_seats > 0 ? 'Book Now' : 'Sold Out'}
          </button>
        </div>
      </div>
    `;
  }).join('');

  resultsContainer.style.display = 'block';
  resultsContainer.scrollIntoView({ behavior: 'smooth' });
}

// Booking Modal
function openBookingModal(trainId, date) {
  selectedTrain = trains.find(t => t.train_id === trainId);
  if (!selectedTrain) return;

  const modal = document.getElementById('booking-modal');
  const trainInfo = document.getElementById('booking-train-info');

  trainInfo.innerHTML = `
    <h4>${selectedTrain.name}</h4>
    <p><strong>Train:</strong> #${selectedTrain.train_id}</p>
    <p><strong>Route:</strong> ${selectedTrain.source} → ${selectedTrain.destination}</p>
    <p><strong>Date:</strong> ${date}</p>
    <p><strong>Departure:</strong> ${selectedTrain.departure_time} | <strong>Arrival:</strong> ${selectedTrain.arrival_time}</p>
  `;

  // Set default passenger name from current user
  if (currentUser) {
    document.getElementById('passenger-name').value = currentUser.name;
  }

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
  if (classSelect === 'Sleeper') {
    baseFare = selectedTrain.fare_sleeper;
  } else if (classSelect === 'First Class') {
    baseFare = selectedTrain.fare_first_class;
  } else {
    baseFare = selectedTrain.fare_ac;
  }

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
  const travelClass = document.getElementById('booking-class').value;
  const date = document.getElementById('booking-train-info').querySelector('p:nth-child(4)').textContent.split(': ')[1];

  // Create booking
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
    fare: parseFloat(totalFare.replace('₹', '')),
    class: travelClass
  };

  bookings.push(newBooking);

  // Update train availability
  selectedTrain.booked_seats += numSeats;
  selectedTrain.available_seats -= numSeats;

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
          <div class="booking-date">Booked on: ${booking.date}</div>
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
          <span class="detail-value">₹${booking.fare}</span>
        </div>
      </div>
    </div>
  `).join('');
}

// Submit Feedback
function submitFeedback(event) {
  event.preventDefault();

  const train = document.getElementById('feedback-train').value;
  const rating = document.querySelector('input[name="rating"]:checked').value;
  const comment = document.getElementById('feedback-comment').value;

  const newFeedback = {
    passenger: currentUser ? currentUser.name : 'Anonymous',
    train: train,
    rating: parseInt(rating),
    comment: comment,
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
    const stars = '⭐'.repeat(feedback.rating) + '☆'.repeat(5 - feedback.rating);
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

// Update Profile
function updateProfile(event) {
  event.preventDefault();
  showSuccessModal('Profile Updated!', 'Your profile information has been updated successfully.');
  return false;
}

// Admin Functions
function showAddTrainForm() {
  document.getElementById('add-train-form').style.display = 'block';
}

function hideAddTrainForm() {
  document.getElementById('add-train-form').style.display = 'none';
}

function addTrain(event) {
  event.preventDefault();
  showSuccessModal('Train Added!', 'New train has been added to the system successfully.');
  hideAddTrainForm();
  event.target.reset();
  return false;
}

// Success Modal
function showSuccessModal(title, message) {
  document.getElementById('success-title').textContent = title;
  document.getElementById('success-message').textContent = message;
  document.getElementById('success-modal').style.display = 'flex';
}

function closeSuccessModal() {
  document.getElementById('success-modal').style.display = 'none';
}

// Set minimum date for date inputs
window.addEventListener('DOMContentLoaded', () => {
  const today = new Date().toISOString().split('T')[0];
  const dateInputs = document.querySelectorAll('input[type="date"]');
  dateInputs.forEach(input => {
    input.min = today;
  });
});