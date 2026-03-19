# Lagos Waste Management System - User Guide

## Overview
This is a comprehensive waste management system designed for Lagos State, Nigeria. It connects citizens, recycling companies, and government officials in a unified platform for efficient waste collection and recycling.

## System Features

### 🧑‍💼 User Features (Citizens)
- **Create Pickup Requests**: Submit waste collection requests with photos, location, and waste type
- **Track Request Status**: Monitor the progress of your requests in real-time
- **Earn Reward Points**: Get points for recycling (50 points for plastic, 40 for paper, etc.)
- **QR Code Verification**: Generate unique QR codes for pickup verification
- **Notifications**: Receive updates when recyclers accept or complete your requests
- **Request History**: View all your past and current requests

### ♻️ Recycler Features (Companies)
- **View Available Requests**: See all pending pickup requests from citizens
- **Accept Requests**: Claim requests and assign them to your drivers
- **Contact Information**: Access user contact details for pickup coordination
- **Complete Pickups**: Mark requests as completed and verify with QR codes
- **Track Performance**: Monitor your completed pickups and active jobs
- **Search & Filter**: Find requests by location, waste type, or description

### 🏛️ Admin Features (Government)
- **Comprehensive Dashboard**: Overview of all system activities
- **Analytics & Reports**: Visual charts showing waste collection trends
- **Unattended Requests Alert**: Automatic flagging of requests pending >3 days
- **Monitor All Requests**: Track requests across all users and companies
- **Environmental Metrics**: Track total waste collected and environmental impact
- **User & Company Management**: View all registered users and recycling companies

## Demo Credentials

### Login as Citizen/User
- **Email**: `adebayo@example.com`
- **Role**: User
- **Features**: Create requests, earn points, view history

### Login as Recycling Company
- **Email**: `contact@greenlagos.com`
- **Role**: Recycler
- **Company**: Green Lagos Recycling
- **Features**: Accept requests, manage pickups, complete jobs

### Login as Government Official
- **Email**: `admin@lasg.gov.ng`
- **Role**: Admin
- **Features**: View analytics, monitor unattended requests, oversight

## How It Works

### For Citizens
1. **Sign In**: Login with your email
2. **Create Request**: Click "New Request" button
3. **Fill Details**: 
   - Select waste type (Plastic, Paper, Glass, Metal, Electronics, Organic, Hazardous)
   - Enter quantity
   - Describe the waste
   - Add pickup location
   - Upload photos (optional)
   - Set priority (Normal, Urgent, Commercial)
4. **Submit**: Your request is now visible to recycling companies
5. **Get Notified**: Receive notifications when a company accepts your request
6. **Show QR Code**: Present your QR code to the driver during pickup
7. **Earn Points**: Automatically receive reward points when pickup is completed

### For Recycling Companies
1. **Sign In**: Login with your company email
2. **Browse Requests**: View all available pickup requests
3. **Review Details**: See user info, location, waste type, and contact details
4. **Accept Request**: Click "Accept" on requests you want to handle
5. **Contact User**: Use phone number to coordinate pickup time
6. **Complete Pickup**: 
   - Scan user's QR code
   - Mark request as completed
   - User automatically receives reward points

### For Government Officials
1. **Sign In**: Login with admin credentials
2. **View Dashboard**: See overall statistics and trends
3. **Monitor Alerts**: Check unattended requests (>3 days old)
4. **Analyze Data**: Review charts and environmental metrics
5. **Track Performance**: Monitor active users, companies, and waste collected
6. **Take Action**: Identify areas needing attention or additional resources

## Key Metrics Tracked

- **Total Requests**: All-time request count
- **Pending Requests**: Currently awaiting assignment
- **Completed Requests**: Successfully collected waste
- **Total Waste Collected**: Estimated weight in tons
- **Waste by Type**: Distribution across different waste categories
- **Active Users**: Registered citizens
- **Active Companies**: Participating recycling companies
- **Unattended Requests**: Requests pending >3 days (Admin Alert)

## Reward System

Citizens earn points for recycling:
- **Plastic**: 50 points
- **Paper**: 40 points
- **Glass**: 60 points
- **Metal**: 70 points
- **Electronics**: 100 points
- **Organic**: 30 points
- **Hazardous**: 80 points

Additional points:
- **Creating Request**: +10 points

## Priority Levels

- **Normal Pickup**: Standard collection timeline
- **Urgent Pickup**: Priority handling for overflowing waste
- **Commercial Pickup**: Large-scale business waste collection

## Waste Categories

1. **Plastic**: Bottles, containers, bags, packaging
2. **Paper**: Newspapers, cardboard, office paper
3. **Glass**: Bottles, jars, broken glass
4. **Metal**: Cans, scrap metal, aluminum
5. **Electronics**: Phones, computers, appliances (e-waste)
6. **Organic**: Food waste, garden waste, compostables
7. **Hazardous**: Batteries, chemicals, medical waste

## System Alerts

### 3-Day Unattended Alert
When a request remains pending for more than 3 days:
- Appears in Admin dashboard with warning badge
- Highlighted in yellow for visibility
- Shows "X days old" indicator
- Requires immediate attention

## Technical Features

- **Local Storage Persistence**: All data saved in browser
- **Real-time Updates**: Instant notifications and status changes
- **Responsive Design**: Works on desktop and mobile devices
- **QR Code Generation**: Unique codes for pickup verification
- **Search Functionality**: Find requests quickly across all views
- **Data Visualization**: Charts and graphs for analytics
- **Mock Data**: Pre-populated with sample requests and users

## Best Practices

### For Users
- Provide accurate location and description
- Upload clear photos of waste items
- Keep your QR code ready during pickup
- Mark urgent only for genuine emergencies

### For Recyclers
- Accept requests you can realistically handle
- Contact users promptly after accepting
- Verify QR codes before completing pickups
- Update status to keep users informed

### For Admins
- Monitor unattended requests daily
- Review analytics to identify trends
- Coordinate with companies for pending requests
- Use data to improve system efficiency

## Future Enhancements (Roadmap)

- **Map Integration**: Google Maps/Mapbox for location pinning
- **Route Optimization**: Smart clustering of nearby requests
- **Mobile App**: React Native app for drivers
- **SMS Notifications**: Twilio integration for alerts
- **Payment Integration**: Reward redemption system
- **IoT Smart Bins**: Automatic fill-level monitoring
- **AI Predictions**: Waste generation forecasting
- **Multi-language**: Support for local languages

## Support

For technical issues or questions:
- Contact: Lagos State Ministry of Environment
- Email: admin@lasg.gov.ng
- Phone: +234 805 678 9012

---

**Built with**: React, TypeScript, Tailwind CSS, React Router, Recharts, QR Code Generation
**Version**: 1.0.0
**Last Updated**: March 7, 2026
