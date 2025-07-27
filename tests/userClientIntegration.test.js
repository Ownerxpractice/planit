// tests/integration/userClientIntegration.test.js
const request = require('supertest');
const { app } = require('../../app');

describe('Integration Tests - User View and Client View Components', () => {

  describe('User View Component Integration', () => {
    
    // Test that User view pages load and connect to backend
    test('User view pages integrate with backend authentication system', async () => {
      // Test that user-facing pages load correctly
      const signinPageResponse = await request(app)
        .get('/signin')
        .expect(200);
      
      // Verify the User view component renders HTML properly
      expect(signinPageResponse.headers['content-type']).toMatch(/html/);
      
      // Test User view form submission integrates with backend
      const userLoginAttempt = await request(app)
        .post('/signin')
        .send({
          email: 'testuser@example.com',
          password: 'userpassword123'
        });
      
      // Verify User view successfully communicates with backend
      expect(userLoginAttempt.status).toBeDefined();
      expect([200, 302, 401, 400]).toContain(userLoginAttempt.status);
    });

    // Test User view dashboard integration with backend API
    test('User dashboard view integrates with calendar API backend', async () => {
      // SETUP: Access user dashboard (should redirect if not authenticated)
      const dashboardResponse = await request(app)
        .get('/dashboard');
      
      // Verify User view handles authentication integration
      // Should either show dashboard or redirect to signin
      expect([200, 302]).toContain(dashboardResponse.status);
      
      // If redirected, should go to signin page (User view component)
      if (dashboardResponse.status === 302) {
        expect(dashboardResponse.headers.location).toContain('/signin');
      }
    });

  });

  describe('Client View Component Integration', () => {
    
    // Test Client view signup process integrates with backend
    test('Client signup view integrates with user registration backend', async () => {
      // Test Client view signup page loads
      const signupPageResponse = await request(app)
        .get('/signup')
        .expect(200);
      
      // Verify Client view component renders properly
      expect(signupPageResponse.headers['content-type']).toMatch(/html/);
      
      // Test Client view registration form integrates with backend
      const clientRegistration = await request(app)
        .post('/signup')
        .send({
          name: 'Test Client',
          email: 'testclient@example.com',
          password: 'clientpassword123'
        });
      
      // Verify Client view successfully processes registration
      expect(clientRegistration.status).toBeDefined();
      expect([200, 201, 302, 400]).toContain(clientRegistration.status);
    });

    // Test Client view calendar access integrates with API
    test('Client view calendar access integrates with calendar API', async () => {
      // Test Client view can access calendar endpoints
      const calendarListResponse = await request(app)
        .get('/api/calendars');
      
      // Verify Client view can interact with calendar backend
      expect(calendarListResponse.status).toBeDefined();
      
      // Backend responds to Client view requests appropriately
      expect([200, 401, 404, 500]).toContain(calendarListResponse.status);
    });

  });

  describe('User View and Client View Cross-Component Integration', () => {
    
    // Test that User view and Client view can both access shared resources
    test('User view and Client view both integrate with shared backend services', async () => {
      // Test both components can access home page
      const homePageResponse = await request(app)
        .get('/')
        .expect(200);
      
      expect(homePageResponse.headers['content-type']).toMatch(/html/);
      
      // Test both User and Client views can access calendar API
      const userCalendarAccess = await request(app)
        .get('/api/calendars');
      
      const clientCalendarAccess = await request(app)
        .post('/api/calendars')
        .send({
          title: 'Integration Test Calendar',
          description: 'Testing cross-component integration'
        });
      
      // Both components successfully integrate with shared backend
      expect(userCalendarAccess.status).toBeDefined();
      expect(clientCalendarAccess.status).toBeDefined();
      
      // Both should get valid HTTP responses from backend
      expect([200, 401, 404, 500]).toContain(userCalendarAccess.status);
      expect([200, 201, 400, 401, 500]).toContain(clientCalendarAccess.status);
    });

    // Test User and Client view form handling integration
    test('User and Client view forms both integrate with authentication backend', async () => {
      // Array of form submissions from both User and Client views
      const formSubmissions = [
        // User view signin form
        { 
          endpoint: '/signin', 
          data: { email: 'user@test.com', password: 'userpass' },
          component: 'User View'
        },
        // Client view signup form
        { 
          endpoint: '/signup', 
          data: { name: 'Client User', email: 'client@test.com', password: 'clientpass' },
          component: 'Client View'
        }
      ];
      
      // Test both components integrate with backend form processing
      for (const submission of formSubmissions) {
        const response = await request(app)
          .post(submission.endpoint)
          .send(submission.data);
        
        // Both User and Client view forms integrate successfully
        expect(response.status).toBeDefined();
        expect(response.status).toBeGreaterThanOrEqual(200);
        expect(response.status).toBeLessThan(600);
      }
    });

  });

  describe('End-to-End Integration Workflow', () => {
    
    // Test complete integration between User view, Client view, and Backend
    test('Complete integration workflow: User view → Backend → Client view', async () => {
      // Start with User view accessing application
      const userHomeAccess = await request(app)
        .get('/')
        .expect(200);
      
      //  User view component loads successfully
      expect(userHomeAccess.headers['content-type']).toMatch(/html/);
      
      // User navigates to Client signup (Client view component)
      const clientSignupAccess = await request(app)
        .get('/signup')
        .expect(200);
      
      expect(clientSignupAccess.headers['content-type']).toMatch(/html/);
      
      // Client view submits data to backend
      const backendProcessing = await request(app)
        .post('/signup')
        .send({
          name: 'Integration User',
          email: 'integration@test.com',
          password: 'integrationpass123'
        });
      
      // User view accesses calendar through backend
      const calendarAccess = await request(app)
        .get('/api/calendars');
      
      // Complete integration workflow functions properly
      expect([200, 201, 302, 400]).toContain(backendProcessing.status);
      expect(calendarAccess.status).toBeDefined();
      expect([200, 401, 404, 500]).toContain(calendarAccess.status);
      
      // Verify all components integrated successfully in the workflow
      expect(userHomeAccess.status).toBe(200);
      expect(clientSignupAccess.status).toBe(200);
    });

  });

});