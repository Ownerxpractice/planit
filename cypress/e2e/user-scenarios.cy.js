// cypress/e2e/user-scenarios.cy.js

describe('Key User Scenarios - Acceptance Tests', () => {
  
  describe('User Story 1: Professional Creating Calendars', () => {
    beforeEach(() => {
      // Visit the application
      cy.visit('http://localhost:3000')
      
      // Sign up as professional first
      cy.get('a').contains('Sign In').click() 
   
     
          cy.get('input[name="username"]').type('test')
          cy.get('input[name="password"]').type('12345')
          cy.get('button[type="submit"]').click()
        
      
      // Wait for dashboard to load
      cy.url().should('include', '/dashboard')
    })

    it('should allow professional to create a new calendar', () => {
      // Given: Professional is on the dashboard
      cy.get('h1').should('contain.text', 'Your Calendars')
      
      // When: Professional creates a new calendar
      cy.get('#calendarTitle').should('be.visible').type('Hair Styling Services')
      cy.get('#calendarDescription').type('Book your hair styling appointment with professional stylist')
      cy.get('#createCalendarForm button[type="submit"]').click()
      
      // And: Calendar appears in the dropdown
      cy.get('#calendarSelect option').should('contain.text', 'Hair Styling Services')
    })
  })
})