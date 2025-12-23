# Requirements Document

## Introduction

This document specifies the requirements for fixing the automatic logout issue that occurs when users navigate to the Personal Center page. The system currently logs users out automatically when they click on the Personal Center while logged in, which is caused by 401 Unauthorized errors from API requests.

## Glossary

- **Personal_Center**: The user's personal dashboard page showing download history, upload history, and VIP information
- **Auth_Token**: The authentication token stored in cookies that validates user identity
- **Request_Interceptor**: The Axios middleware that adds authentication headers to API requests
- **Token_Expiry_Check**: The validation logic that determines if a token is expired or expiring soon
- **API_Request**: HTTP requests made to backend endpoints requiring authentication
- **User_Store**: The Pinia store managing user state and authentication status

## Requirements

### Requirement 1: Prevent Premature Token Expiry Checks

**User Story:** As a logged-in user, I want to access my Personal Center without being logged out, so that I can view my download history, uploads, and VIP information.

#### Acceptance Criteria

1. WHEN a user navigates to the Personal Center page THEN the system SHALL NOT perform token expiry checks that cause false positives
2. WHEN the token expiry time is not set in cookies THEN the system SHALL NOT treat the token as expired
3. WHEN API requests are made to Personal Center endpoints THEN the system SHALL include valid authentication headers
4. IF the token is genuinely expired THEN the system SHALL redirect to login page with appropriate error message
5. WHEN multiple API requests fail with 401 errors THEN the system SHALL handle them gracefully without multiple logout attempts

### Requirement 2: Robust Token Management

**User Story:** As a developer, I want reliable token validation logic, so that users are not incorrectly logged out due to missing or invalid token expiry metadata.

#### Acceptance Criteria

1. WHEN a token exists in cookies but expiry time is missing THEN the system SHALL treat the token as valid
2. WHEN checking token expiry THEN the system SHALL verify both token existence and expiry time validity
3. WHEN setting a new token THEN the system SHALL always set a corresponding expiry time
4. WHEN the token is refreshed THEN the system SHALL update both token and expiry time atomically
5. WHEN initializing the application THEN the system SHALL validate token state consistency

### Requirement 3: Graceful API Error Handling

**User Story:** As a user, I want the system to handle API errors gracefully, so that temporary network issues don't force me to log out.

#### Acceptance Criteria

1. WHEN an API request returns 401 Unauthorized THEN the system SHALL verify if the token is actually expired before logging out
2. WHEN multiple concurrent requests fail with 401 THEN the system SHALL deduplicate logout actions
3. WHEN a single API request fails THEN the system SHALL NOT immediately clear all user state
4. WHEN Personal Center data fails to load THEN the system SHALL display empty states without logging out
5. IF the token is valid but API returns 401 THEN the system SHALL attempt token refresh before logging out

### Requirement 4: Personal Center Data Loading

**User Story:** As a user, I want my Personal Center data to load reliably, so that I can access my history and information.

#### Acceptance Criteria

1. WHEN the Personal Center page loads THEN the system SHALL fetch download history with proper authentication
2. WHEN API requests fail due to network issues THEN the system SHALL display error messages without logging out
3. WHEN switching between tabs in Personal Center THEN the system SHALL load data only when needed
4. WHEN data loading fails THEN the system SHALL show empty states with retry options
5. WHEN the user is not authenticated THEN the system SHALL redirect to login before making API requests

### Requirement 5: Token Initialization and Synchronization

**User Story:** As a developer, I want token state to be synchronized between cookies and the store, so that authentication state is consistent across the application.

#### Acceptance Criteria

1. WHEN the application initializes THEN the system SHALL read token from cookies and update store state
2. WHEN the token is set in cookies THEN the system SHALL update the store token state
3. WHEN the store is initialized THEN the system SHALL verify token existence in cookies
4. WHEN cookies are cleared externally THEN the system SHALL detect the change and update store state
5. WHEN the user logs in THEN the system SHALL set both token and expiry time in cookies and store
