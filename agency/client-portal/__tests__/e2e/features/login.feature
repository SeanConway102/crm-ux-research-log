Feature: Client Login

  Clients access the portal via their branded subdomain or the agency portal URL.
  They sign in using a magic link sent to their email address.

  @smoke
  Scenario: Unauthenticated user is redirected to login
    Given I am not logged in
    When I visit "/dashboard"
    Then I should be redirected to "/login"

  @smoke
  Scenario: Unauthenticated user can see login form
    Given I am on "/login"
    Then I should see "Sign in to your portal"
    And I should see an email input field

  @smoke
  Scenario: User submits valid email to receive magic link
    Given I am on "/login"
    When I fill in "email" with "client@example.com"
    And I click "Send sign-in link"
    Then I should see "Check your email"

  Scenario: User submits invalid email
    Given I am on "/login"
    When I fill in "email" with "not-an-email"
    And I click "Send sign-in link"
    Then I should see a validation error
