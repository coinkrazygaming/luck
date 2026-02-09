# CoinKrazy Admin Panel - Setup & Usage Guide

## Admin Account

**Email:** `ooinkrazy00@gmail.com`  
**Password:** `Woot6969!`

The admin account is automatically created on first database initialization.

---

## Admin Features Overview

### 1. **User Management**
- View all registered users with search and filtering
- View user details (KYC status, verification, activity)
- Edit user information (name, verified status, KYC status)
- Promote/demote users as admin
- Delete user accounts (except your own)

**API Endpoints:**
```
GET    /api/admin/users              # List all users
GET    /api/admin/users/:userId      # Get user details
POST   /api/admin/users/:userId      # Update user
DELETE /api/admin/users/:userId      # Delete user
GET    /api/admin/users/:userId/stats # User statistics
```

### 2. **Player Analytics**
- Track player losses and wagering behavior
- Monitor KYC status and verification
- Risk level assessment
- Last activity tracking
- Filter by status, search by name/email

### 3. **Financial Management**

#### Transactions
- View all transactions with filtering
- Track transaction type, status, amount
- Filter by date range

**API Endpoints:**
```
GET /api/admin/transactions              # List transactions
GET /api/admin/transactions/stats        # Transaction statistics
```

#### Withdrawals
- Manage pending withdrawal requests
- Approve/reject withdrawals
- Track withdrawal status and payment methods
- View withdrawal statistics

**API Endpoints:**
```
GET    /api/admin/withdrawals                    # List withdrawals
POST   /api/admin/withdrawals/:withdrawalId/approve  # Approve withdrawal
POST   /api/admin/withdrawals/:withdrawalId/reject   # Reject withdrawal
GET    /api/admin/withdrawals/stats              # Withdrawal statistics
```

#### User Balance Management
- View individual user balances (Gold Coins, Sweep Coins, Real Money)
- Adjust balances for admin purposes
- Automatic transaction recording

**API Endpoints:**
```
GET  /api/admin/balances/:userId      # View user balance
POST /api/admin/balances/:userId      # Update user balance
```

#### Financial Reports
- Revenue analysis
- Payout tracking
- Bonus distribution
- Net revenue calculations

**API Endpoints:**
```
GET /api/admin/revenue-report     # Get revenue report
GET /api/admin/financial-summary  # Get financial summary
```

### 4. **Game & Provider Management**

#### Providers
- Add new game providers
- Enable/disable providers
- Manage provider configuration

**API Endpoints:**
```
GET    /api/admin/providers          # List providers
POST   /api/admin/providers          # Create provider
POST   /api/admin/providers/:providerId  # Update provider
DELETE /api/admin/providers/:providerId  # Delete provider
```

#### Games
- Manage game catalog
- Enable/disable games
- Search games by provider

**API Endpoints:**
```
GET    /api/admin/games           # List games
POST   /api/admin/games           # Create game
POST   /api/admin/games/:gameId   # Update game
DELETE /api/admin/games/:gameId   # Delete game
GET    /api/admin/games-stats     # Game statistics
```

#### Game Blacklist
- Blacklist problematic games
- Track blacklist reasons
- Remove from blacklist

**API Endpoints:**
```
GET    /api/admin/blacklist              # View blacklist
POST   /api/admin/blacklist              # Add to blacklist
DELETE /api/admin/blacklist/:blacklistId # Remove from blacklist
```

### 5. **Tournament Management**

#### Create & Manage Tournaments
- Create new tournaments with name, type, dates
- Set entry fees and prize pools
- Define max participants
- Edit tournament details
- Delete tournaments

**API Endpoints:**
```
GET    /api/admin/tournaments              # List tournaments
GET    /api/admin/tournaments/:tournamentId # Get details
POST   /api/admin/tournaments              # Create
POST   /api/admin/tournaments/:tournamentId # Update
DELETE /api/admin/tournaments/:tournamentId # Delete
```

#### Tournament Status Management
- Start tournaments
- End tournaments
- Cancel tournaments

**API Endpoints:**
```
POST /api/admin/tournaments/:tournamentId/start   # Start
POST /api/admin/tournaments/:tournamentId/end     # End
POST /api/admin/tournaments/:tournamentId/cancel  # Cancel
```

#### Leaderboard Management
- Update tournament leaderboards
- Manage rankings and prizes

**API Endpoints:**
```
POST /api/admin/tournaments/:tournamentId/leaderboard # Update leaderboard
GET  /api/admin/tournaments/stats                     # Tournament statistics
```

### 6. **System Management**

- System status and health checks
- Game configuration (RTP, max bet)
- Responsible gaming settings
- Daily loss limits
- Session time limits

**API Endpoints:**
```
GET /api/admin/system           # System status
GET /api/admin/dashboard        # Dashboard data
GET /api/admin/stats            # Admin statistics
```

---

## How to Access the Admin Panel

1. **Login with Admin Account:**
   - Navigate to `/login`
   - Enter email: `ooinkrazy00@gmail.com`
   - Enter password: `Woot6969!`

2. **Access Admin Panel:**
   - After login, navigate to `/admin`
   - You should see the full Admin Panel

3. **Available Admin Routes:**
   - `/admin` - Main admin dashboard
   - `/admin/packages` - Package management
   - `/admin/ai-employees` - AI employee management

---

## API Authentication

All admin API endpoints require JWT authentication:

```bash
curl -H "Authorization: Bearer <token>" \
     http://localhost:8080/api/admin/users
```

The JWT token is provided upon login and must be included in the `Authorization` header.

---

## Database Tables

### User Management
- `users` - User accounts with admin flags
- `user_balances` - User currency balances

### Games
- `providers` - Game provider definitions
- `games` - Game catalog
- `game_blacklist` - Blacklisted games

### Financial
- `transactions` - All financial transactions
- `withdrawals` - Withdrawal requests
- `user_balances` - User account balances

### Tournaments
- `tournaments` - Tournament definitions
- `tournament_participants` - Tournament registrations
- `tournament_leaderboard` - Tournament rankings

---

## Authorization & Security

- **Admin Middleware:** All admin routes are protected with `requireAdmin` middleware
- **JWT Verification:** All requests must include valid JWT token
- **Admin Flag Check:** User must have `is_admin = true` in database
- **Route Protection:** AuthGuard component protects `/admin` routes on frontend

---

## Testing the Admin Panel

### 1. Login Test
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ooinkrazy00@gmail.com","password":"Woot6969!"}'
```

### 2. Get User List
```bash
curl -H "Authorization: Bearer <token>" \
     http://localhost:8080/api/admin/users
```

### 3. Get Dashboard Stats
```bash
curl -H "Authorization: Bearer <token>" \
     http://localhost:8080/api/admin/dashboard
```

### 4. Get Financial Summary
```bash
curl -H "Authorization: Bearer <token>" \
     http://localhost:8080/api/admin/financial-summary
```

---

## Admin Panel Features

The Admin Panel (accessed at `/admin`) includes:

### Tabs
1. **Player Analytics** - View and manage players
2. **User Profiles** - Manage user profiles
3. **AI Employees** - Manage AI customer service agents
4. **Messaging Center** - Send campaigns and emails
5. **Jackpot Management** - Manage progressive jackpots
6. **Package Management** - Manage Gold Coin packages
7. **System Settings** - Configure game parameters
8. **Reports** - Generate financial and compliance reports

### Dashboard Overview
- **Total Players** - Count of registered users
- **Total Player Losses** - Sum of player losses
- **System RTP** - Return to player percentage
- **Jackpot Pool** - Active jackpot amounts

### Quick Actions
- Refresh Data
- Export Reports
- Search and Filter

---

## Best Practices

1. **Regular Backups:** Ensure database backups are configured
2. **Monitor Transactions:** Regularly review financial reports
3. **Withdrawal Management:** Process withdrawals promptly
4. **Game Management:** Keep game catalog up to date
5. **User Monitoring:** Watch for high-risk players
6. **Tournament Management:** Regularly create and manage tournaments
7. **Responsible Gaming:** Enforce responsible gaming limits

---

## Troubleshooting

### Admin Panel Not Accessible
- Verify user account has `is_admin = true`
- Check JWT token is valid
- Ensure logged in correctly

### API Returns 403 Forbidden
- Token may be expired, re-login
- User account may not be admin
- Check Authorization header format

### Database Errors
- Ensure all tables are initialized
- Check database connection
- Verify environment variables

---

## Support

For issues or questions:
1. Check the API endpoint documentation above
2. Review database schema
3. Check browser console for errors
4. Verify environment variables are set correctly

---

## API Base URL

All endpoints are relative to: `http://localhost:8080/api/admin/`

When deployed, replace with your production domain.
