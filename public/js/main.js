let currentCalendarId = null;

// clear all the forms and result messages
function clearAllForms() {
  // make a list of the forms and loop through them
  ['createCalendarForm', 'viewCalendarForm', 'addTimeSlotForm'].forEach(id => {
    const form = document.getElementById(id);
    // reset the form
    if (form) {
        form.reset();
    }
  });
  // get the response message
  const resultDiv = document.getElementById('calendarResult');
  if (resultDiv) {
    // set that to empty as well
    resultDiv.innerHTML = '';
  }
}

// create a new calendar and auto add it to the dropdown box
async function handleCreateCalendar(event) {
  // prevent the page reloading
  event.preventDefault();
  // set the calendar title
  const title = document.getElementById('calendarTitle').value;
  // set the description
  const description = document.getElementById('calendarDescription').value;

  try {
    // send a post request to the api endpoint
    const res = await fetch('/api/calendars', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({title, description})
    });
    // if the response is not in the 200 - 299 range then read the error message
    if (!res.ok) {
        throw new Error(await res.text());
    }
    // otherwise parse the json response
    const cal = await res.json();

    // show the feedback under the form
    document.getElementById('calendarResult').innerHTML =
      `Created “${cal.title}” (ID: ${cal.id})`;

    // add it to the drop down
    const select = document.getElementById('calendarSelect');
    const option = new Option(cal.title, cal.id);
    select.add(option);

    // auto select the new option
    select.value = cal.id;
    // load up the new changes
    select.dispatchEvent(new Event('change'));

  } catch (err) {
    // otherwise display the error message
    alert('Error creating calendar: ' + err.message);
  }
}

// when a calendar is chosen show the link and the slot
function handleCalendarChange(event) {
  currentCalendarId = event.target.value;

  // construct the sharable link
  const shareContainer = document.getElementById('shareLinkContainer');
  const shareLink = document.getElementById('shareLinkUrl');
  const url = `${window.location.origin}/view/${currentCalendarId}`;
  shareLink.href = url;
  shareLink.textContent = url;
  shareContainer.style.display = 'block';

  // reveal the add slot panel and load its slots
  document.getElementById('calendarDetails').style.display = 'block';
  loadDashboardSlots(currentCalendarId);
}

// load the time slots and split into available and booked
async function loadDashboardSlots(calendarId) {
  try {
    // fetch the calendar’s data from the api
    const res = await fetch(`/api/calendars/${calendarId}`, {
      credentials: 'same-origin'
    });
    if (!res.ok) throw new Error(await res.text());

    // pull out the array of time slot objects
    const {timeSlots} = await res.json();

    // grab the two unordered list elements where the booked and available slots will go
    const availList = document.getElementById('availableSlotsList');
    const bookedList = document.getElementById('bookedSlotsList');

    // clear any old content
    availList.innerHTML = '';
    bookedList.innerHTML = '';

    // loop through each slot and build a list item for it
    timeSlots.forEach(slot => {
      // create the list item container
      const li = document.createElement('li');
      li.className = 'list-group-item d-flex justify-content-between align-items-center';

      // format the start and end times
      const start = new Date(slot.start_time).toLocaleString();
      const end = new Date(slot.end_time).toLocaleString();
      li.textContent = `${start} – ${end}`;

      // create a badge to indicate availability
      const badge = document.createElement('span');
      // check if the slot still has room
      if (slot.current_participants < slot.max_participants) {
        // if so then use a bootstrap badge to available
        badge.className = 'badge bg-success';
        badge.textContent = 'Available';
        availList.appendChild(li);
      } else {
        // otherwise the slot is full
        // use a bootstrap badge to show it as full
        badge.className = 'badge bg-secondary';
        badge.textContent = `Booked (${slot.current_participants})`;
        bookedList.appendChild(li);
      }

      // attach the badge to the list item
      li.appendChild(badge);
    });

  } catch (err) {
    // if anything goes wrong, give back the error message
    alert('Error loading slots: ' + err.message);
  }
}

// add a new time slot for the selected calendar
async function handleAddSlot(event) {
  // prevent the default loading
  event.preventDefault();
  // if a calendar is not selected then give a message to do so
  if (!currentCalendarId) {
    return alert('Select a calendar first');
  }

  // get the needed information
  const startTime = document.getElementById('startTime').value;
  const endTime = document.getElementById('endTime').value;
  const maxParticipants = document.getElementById('maxParticipants').value;

  try {
    const res = await fetch(
      // make a post to the api to insert the new time slot
      `/api/calendars/${currentCalendarId}/time-slots`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({startTime, endTime, maxParticipants: maxParticipants})
      }
    );
    // if the response is in the error range then throw an error and read the message
    if (!res.ok) {
        throw new Error(await res.text());
    }
    // if the slot is added then give an alert that it was made
    alert('Time slot added!');
    // reset the add slot form
    document.getElementById('addTimeSlotForm').reset();
    // load all the time slots
    await loadDashboardSlots(currentCalendarId);
  } catch (err) {
    // otherwise load the error message
    alert('Error adding slot: ' + err.message);
  }
}

// set up all the listeners on the dom
document.addEventListener('DOMContentLoaded', () => {
  clearAllForms();

  // create calendar form
  const createForm = document.getElementById('createCalendarForm');
  if (createForm) createForm.addEventListener('submit', handleCreateCalendar);

  // calendar dropdown
  const selector = document.getElementById('calendarSelect');
  if (selector) selector.addEventListener('change', handleCalendarChange);

  // add time slot form
  const addForm = document.getElementById('addTimeSlotForm');
  if (addForm) addForm.addEventListener('submit', handleAddSlot);
});