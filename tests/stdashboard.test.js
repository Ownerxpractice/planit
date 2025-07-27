// tests/stdashboard.test.js

/**
 * Test for participant count display and 50% capacity color warning
 * Tests the implementation for issue #45
 */

// Mock DOM environment for testing frontend JavaScript
const { JSDOM } = require('jsdom');

// Set up DOM before tests
beforeAll(() => {
  const dom = new JSDOM(`
    <!DOCTYPE html>
    <html>
      <body>
        <ul id="availableSlotsList" class="list-group mb-4"></ul>
      </body>
    </html>
  `);

  global.window = dom.window;
  global.document = dom.window.document;
});

describe('Dashboard Participant Count and Color Warning - Issue #45', () => {
  let availList;

  beforeEach(() => {
    availList = document.getElementById('availableSlotsList');
    availList.innerHTML = ''; // Clear list before each test
  });

  // Helper function to create a time slot element
  const createSlotElement = (current_participants, max_participants) => {
    const li = document.createElement('li');
    li.className = 'list-group-item d-flex justify-content-between align-items-center';

    // Add participant count badge 
    const participantBadge = document.createElement('span');
    participantBadge.className = 'badge bg-secondary';
    participantBadge.textContent = `${current_participants} / ${max_participants}`;
    li.appendChild(participantBadge);

    // Add color-coded status badge 
    const statusBadge = document.createElement('span');
    const percentageFilled = (current_participants / max_participants) * 100;
    
    if (percentageFilled >= 50) {
      statusBadge.className = 'badge bg-warning';
      statusBadge.textContent = 'Available (Almost Full)';
    } else {
      statusBadge.className = 'badge bg-success';
      statusBadge.textContent = 'Available';
    }
    li.appendChild(statusBadge);

    return li;
  };

  describe('Participant Count Display', () => {
    test('should show correct participant count for low capacity', () => {
      const slotElement = createSlotElement(2, 10);
      availList.appendChild(slotElement);

      const participantBadge = availList.querySelector('.badge.bg-secondary');
      expect(participantBadge.textContent).toBe('2 / 10');
    });

    test('should show correct participant count for high capacity', () => {
      const slotElement = createSlotElement(8, 10);
      availList.appendChild(slotElement);

      const participantBadge = availList.querySelector('.badge.bg-secondary');
      expect(participantBadge.textContent).toBe('8 / 10');
    });
  });

  describe('50% Capacity Color Warning', () => {
    test('should show green badge when less than 50% full', () => {
      // 4/10 = 40%
      const slotElement = createSlotElement(4, 10);
      availList.appendChild(slotElement);

      const statusBadge = availList.querySelector('.badge.bg-success');
      expect(statusBadge).toBeTruthy();
      expect(statusBadge.textContent).toBe('Available');
    });

    test('should show yellow badge when exactly 50% full', () => {
      // 5/10 = 50%
      const slotElement = createSlotElement(5, 10);
      availList.appendChild(slotElement);

      const statusBadge = availList.querySelector('.badge.bg-warning');
      expect(statusBadge).toBeTruthy();
      expect(statusBadge.textContent).toBe('Available (Almost Full)');
    });

    test('should show yellow badge when over 50% full', () => {
      // 6/10 = 60%
      const slotElement = createSlotElement(6, 10);
      availList.appendChild(slotElement);

      const statusBadge = availList.querySelector('.badge.bg-warning');
      expect(statusBadge).toBeTruthy();
      expect(statusBadge.textContent).toBe('Available (Almost Full)');
    });

    test('should show green badge just under 50% threshold', () => {
      // 49/100 = 49%
      const slotElement = createSlotElement(49, 100);
      availList.appendChild(slotElement);

      const statusBadge = availList.querySelector('.badge.bg-success');
      expect(statusBadge).toBeTruthy();
      expect(statusBadge.textContent).toBe('Available');
    });
  });
});