let currentCalendarId = null;

// Clear all forms on page load
function clearAllForms() {
    document.getElementById('createCalendarForm').reset();
    document.getElementById('viewCalendarForm').reset();
    document.getElementById('addTimeSlotForm').reset();
    document.getElementById('calendarResult').innerHTML = '';
}

// Create Calendar
document.getElementById('createCalendarForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const title = document.getElementById('calendarTitle').value;
    const description = document.getElementById('calendarDescription').value;
    
    try {
        const response = await fetch('/api/calendars', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ title, description })
        });
        
        // Check if response is ok before trying to parse JSON
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        const calendar = await response.json();
        
        document.getElementById('calendarResult').innerHTML = 
            `Calendar created! ID: <strong>${calendar.id}</strong><br>
             Share this link: <a href="?id=${calendar.id}" target="_blank">${window.location.origin}?id=${calendar.id}</a>`;
        
        // Clear the form after successful creation
        document.getElementById('createCalendarForm').reset();
    } catch (error) {
        console.error('Error creating calendar:', error);
        alert('Error creating calendar: ' + error.message);
    }
});

// View Calendar
document.getElementById('viewCalendarForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const calendarId = document.getElementById('calendarId').value;
    await loadCalendar(calendarId);
    
    // Clear the form after loading
    document.getElementById('viewCalendarForm').reset();
});

// Load calendar data
async function loadCalendar(calendarId) {
    try {
        const response = await fetch(`/api/calendars/${calendarId}`);
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        const data = await response.json();
        currentCalendarId = calendarId;
        displayCalendar(data);
    } catch (error) {
        console.error('Error loading calendar:', error);
        alert('Error loading calendar: ' + error.message);
    }
}

// Display calendar
function displayCalendar(data) {
    const { calendar, timeSlots } = data;
    
    document.getElementById('calendarDisplay').style.display = 'block';
    document.getElementById('calendarTitle').textContent = calendar.title;
    document.getElementById('calendarDescription').textContent = calendar.description || '';
    
    displayTimeSlots(timeSlots);
}

// Display time slots
function displayTimeSlots(timeSlots) {
    const container = document.getElementById('timeSlotsList');
    container.innerHTML = '<h4>Time Slots</h4>';
    
    if (timeSlots.length === 0) {
        container.innerHTML += '<p>No time slots available.</p>';
        return;
    }
    
    timeSlots.forEach(slot => {
        const slotElement = createTimeSlotElement(slot);
        container.appendChild(slotElement);
    });
}

// Create time slot element
function createTimeSlotElement(slot) {
    const div = document.createElement('div');
    div.className = 'time-slot';
    
    const startTime = new Date(slot.start_time).toLocaleString();
    const endTime = new Date(slot.end_time).toLocaleString();
    const isFull = slot.current_participants >= slot.max_participants;
    
    div.innerHTML = `
        <h4>${startTime} - ${endTime}</h4>
        <p>Participants: ${slot.current_participants}/${slot.max_participants}</p>
        ${isFull ? '<p style="color: red;">FULL</p>' : createParticipantForm(slot.id)}
        <div class="participants-list" id="participants-${slot.id}"></div>
    `;
    
    return div;
}

// Create participant form
function createParticipantForm(slotId) {
    return `
        <div class="participant-form">
            <input type="text" placeholder="Your Name" id="name-${slotId}" required>
            <input type="email" placeholder="Your Email" id="email-${slotId}">
            <button onclick="joinTimeSlot('${slotId}')">Join Time Slot</button>
        </div>
    `;
}

// Join time slot
async function joinTimeSlot(slotId) {
    const name = document.getElementById(`name-${slotId}`).value;
    const email = document.getElementById(`email-${slotId}`).value;
    
    if (!name) {
        alert('Please enter your name');
        return;
    }
    
    try {
        const response = await fetch(`/api/time-slots/${slotId}/participants`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, email })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        const result = await response.json();
        alert('Successfully joined time slot!');
        
        // Clear the participant form
        document.getElementById(`name-${slotId}`).value = '';
        document.getElementById(`email-${slotId}`).value = '';
        
        // Reload calendar to show updated participant count
        if (currentCalendarId) {
            await loadCalendar(currentCalendarId);
        }
    } catch (error) {
        console.error('Error joining time slot:', error);
        alert('Error joining time slot: ' + error.message);
    }
}

// Add time slot
document.getElementById('addTimeSlotForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!currentCalendarId) {
        alert('Please load a calendar first');
        return;
    }
    
    const startTime = document.getElementById('startTime').value;
    const endTime = document.getElementById('endTime').value;
    const maxParticipants = document.getElementById('maxParticipants').value;
    
    try {
        const response = await fetch(`/api/calendars/${currentCalendarId}/time-slots`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ startTime, endTime, maxParticipants })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        const result = await response.json();
        alert('Time slot added successfully!');
        
        // Clear the form after successful addition
        document.getElementById('addTimeSlotForm').reset();
        
        // Reload calendar
        await loadCalendar(currentCalendarId);
    } catch (error) {
        console.error('Error adding time slot:', error);
        alert('Error adding time slot: ' + error.message);
    }
});

// Check for calendar ID in URL on page load
window.addEventListener('load', () => {
    // Clear all forms first
    clearAllForms();
    
    const urlParams = new URLSearchParams(window.location.search);
    const calendarId = urlParams.get('id');
    if (calendarId) {
        document.getElementById('calendarId').value = calendarId;
        loadCalendar(calendarId);
    }
});

// Clear forms when page is refreshed
window.addEventListener('beforeunload', () => {
    clearAllForms();
}); 