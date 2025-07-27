let currentCalendarId = null;
// variables used for the modal timeslot editor
let editModal, editForm;

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
  getParticipants(currentCalendarId);
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
      // Create a container for the time and participant info
      const timeContainer = document.createElement('div');
      timeContainer.innerHTML = `${start} – ${end}`;
      
      // Add participant count badge 
      const participantBadge = document.createElement('span');
      participantBadge.className = 'badge bg-secondary';
      participantBadge.textContent = `${slot.current_participants} / ${slot.max_participants}`;
      timeContainer.appendChild(participantBadge);
      
      li.appendChild(timeContainer);

      // create a badge to indicate availability
      const badge = document.createElement('span');
       // Calculate percentage filled
      const percentageFilled = (slot.current_participants / slot.max_participants) * 100;
      // check if the slot still has room
      if (slot.current_participants < slot.max_participants) {
        // check if 80% or more filled (yellow) or less than 80% (green)
        if (percentageFilled >= 50) {
        badge.className = 'badge bg-warning';
        badge.textContent = 'Available (Almost Full)';
      } else {
        // if so then use a bootstrap badge to available
        badge.className = 'badge bg-success';
        badge.textContent = 'Available';
      }
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

      // use a div to place the edit and delete buttons inside of
      // then move them to the right side
      const actions = document.createElement('div')
      actions.className = 'd-flex ms-auto'

      // make the edit button and define its properties
      const editBtn = document.createElement('button');
      editBtn.className = 'btn btn-secondary btn-sm ms-3';
      editBtn.textContent = 'Edit';
      editBtn.onclick = () => editSlot(slot);

      // make the delete button and define its properties
      const delBtn = document.createElement('button');
      delBtn.className = 'btn btn-danger btn-sm ms-2';
      delBtn.textContent = 'Delete';
      delBtn.onclick = () => deleteSlot(slot.id);

      // place both buttons in the actions div
      actions.append(editBtn, delBtn)
      li.appendChild(actions)

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

// use an event listener to start the boostrap modal
document.addEventListener('DOMContentLoaded', () => {
  // get the place to add the modal
  const modalEl = document.getElementById('editSlotModal');
  // use bootstrap to create the modal window
  editModal = new bootstrap.Modal(modalEl);
  // get the form for editing
  editForm = document.getElementById('editSlotForm');
  // use another event lister for the submit
  editForm.addEventListener('submit', handleEditFormSubmit);
});

// make the function to handle editing a slot
function editSlot(slot) {
  // fill in the fields
  document.getElementById('editSlotId').value = slot.id;
  // strip the seconds off for start and end times
  document.getElementById('editStartTime').value = slot.start_time.slice(0,16);
  document.getElementById('editEndTime').value   = slot.end_time.slice(0,16);
  document.getElementById('editMaxParticipants').value = slot.max_participants;
  // show the modal
  editModal.show();
}

// handle the save changes button event
async function handleEditFormSubmit(event) {
  // first prevent the default loading
  event.preventDefault();

  // get the id, start time, end time, and participants
  const id = document.getElementById('editSlotId').value;
  const startTime = document.getElementById('editStartTime').value;
  const endTime = document.getElementById('editEndTime').value;
  const maxParticipants = document.getElementById('editMaxParticipants').value;

  try {
    // try to use the api to make a put for the new information
    const res = await fetch(`/api/time-slots/${id}`, {
      method: 'PUT',
      credentials: 'same-origin',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({startTime, endTime, maxParticipants})
    });
    // if the response has an errro then throw a new error
    if (!res.ok) throw new Error(await res.text());

    // after using it die the modal window
    editModal.hide();
    // then load in all the slots
    await loadDashboardSlots(currentCalendarId);
  } catch (err) {
    // if the error was thrown then diplay the message to the user
    alert('Error updating slot: ' + err.message);
  }
}

// make the function to delete a slot
async function deleteSlot(slotId) {
  // use a confirmation message to be sure the the user wants to delete the slot
  // otherwise exit the routine
  if (!confirm('Are you sure you want to delete this time slot?')) return;

  // try to use the api to make a fetch for deleting the slot 
  try {
    const res = await fetch(`/api/time-slots/${slotId}`, {
      method: 'DELETE',
      credentials: 'same-origin'
    });
    // if an error occurs throw a new one and give the message back to the user
    if (!res.ok) throw new Error(await res.text());
    await loadDashboardSlots(currentCalendarId);
  } catch (err) {
    alert('Error deleting slot: ' + err.message);
  }
}

// function to get participants' names and emails for a given calendar ID
async function getParticipants(calendarId) {
  const listEl = document.getElementById('participants-list');
  const loadingEl = document.getElementById('loading-indicator');
  const errorEl = document.getElementById('error-message');

  // reset the states
  listEl.innerHTML = '';
  errorEl.style.display = 'none';
  loadingEl.style.display = 'block';

  try {
    // access the participants through the api
    const res = await fetch(`/api/calendars/${calendarId}/participants`, {
      credentials: 'same-origin'
    });
    if (!res.ok) throw new Error(await res.text());
    const participants = await res.json();
    loadingEl.style.display = 'none';

    if (participants.length === 0) {
      listEl.innerHTML = '<p class="text-muted">No one has signed up yet.</p>';
    } else {
      const ul = document.createElement('ul');
      ul.className = 'list-group';
      participants.forEach(p => {
        const li = document.createElement('li');
        li.className = 'list-group-item';
        // show the time, name, and email
        li.textContent = 
          `${new Date(p.start_time).toLocaleString()} – ${p.name}` +
          (p.email ? ` (${p.email})` : '');
        ul.appendChild(li);
      });
      listEl.appendChild(ul);
    }
  } catch (err) {
    loadingEl.style.display = 'none';
    errorEl.style.display = 'block';
  }
}
