# Orbit Remote Admin Setup Guide

## Overview

The Orbit Remote Admin feature allows you to monitor and manage multiple Roblox game servers from a centralized dashboard. This guide will walk you through setting up the enhanced Roblox script and configuring your servers.

## Prerequisites

- Orbit workspace with admin permissions
- Roblox Studio access
- HTTP requests enabled in your Roblox game
- Valid Orbit workspace URL and API key

## Step 1: Install the Remote Admin Script

1. **Download the Script**: Use `Orbitb5-remote-admin.rbxmx` (enhanced version)
2. **Import to Studio**:
   - Open Roblox Studio
   - Go to Model tab > Import
   - Select the `.rbxmx` file
   - Place it in ServerScriptService

## Step 2: Configure the Script

Edit the `Configuration` table in the script:

```lua
local Configuration = {
    -- Required: Replace with your Orbit workspace URL
    url = "https://your-orbit-instance.com",

    -- Required: Replace with your workspace API key
    auth = "orbit_your_api_key_here",

    -- Optional: Customize tracking settings
    bansEnabled = false,
    rankChecking = false,
    groupId = 3167534, -- Your Roblox group ID
    minTrackedRank = 99,
    minutesTillAFK = 2,

    -- Remote Admin Features
    enableRemoteAdmin = true,
    enableChatTracking = true,
    enableEventTracking = true,
    metricsInterval = 30, -- Server metrics update frequency
}
```

## Step 3: Get Your API Key

1. **Access Remote Admin**: Go to `/workspace/[id]/remote-admin` in your Orbit dashboard
2. **Add New Server**: Click "Add Server" button
3. **Fill Server Details**:
   - Name: Your game name
   - Description: Optional description
   - Game ID: Your Roblox place ID
   - Universe ID: Your game's universe ID
   - Max Players: Server capacity
4. **Copy API Key**: After creation, copy the generated API key

## Step 4: Enable HTTP Requests

In Roblox Studio:
1. Go to Home tab > Game Settings
2. Navigate to Security tab
3. Enable "Allow HTTP Requests"
4. Save and publish your game

## Step 5: Test the Integration

1. **Publish Your Game**: Make sure the script is published with your game
2. **Join Your Game**: Play the game to generate test data
3. **Check Remote Admin**: Visit the Remote Admin dashboard to see:
   - Server appearing as "Online"
   - Player join events
   - Chat messages (if you typed any)
   - Real-time activity feed

## Features Included

### 📊 **Server Dashboard**
- Real-time server status
- Player counts across all servers
- 24-hour activity statistics
- Quick action buttons

### 💬 **Chat Monitor**
- Live chat messages from all servers
- Automatic profanity flagging
- Chat moderation tools
- Search and filter capabilities

### 📈 **Live Activity Feed**
- Player joins and leaves
- Chat messages
- Player actions (AFK, movement)
- Game events (deaths, achievements)
- Real-time updates every 5 seconds

### 🔧 **Enhanced Tracking**

The new script tracks:
- **Player Sessions**: Join/leave with session duration
- **Chat Messages**: All player chat with timestamps
- **Player Actions**: Movement, AFK status, swimming, climbing
- **Game Events**: Deaths, character spawns, custom events
- **Server Metrics**: Player counts, performance data

## Advanced Features

### Custom Event Tracking

Use the global API in your game scripts:

```lua
-- Track custom events
_G.OrbitRemoteAdmin.TrackEvent("level_completed", player.UserId, player.Name, {
    level = 5,
    score = 1250,
    time = 300
})

-- Track purchases
_G.OrbitRemoteAdmin.TrackPurchase(player, 123456, 100)

-- Track achievements
_G.OrbitRemoteAdmin.TrackAchievement(player, "First Victory", "Won your first match")
```

### Configuration Options

- `enableRemoteAdmin`: Master switch for all Remote Admin features
- `enableChatTracking`: Track chat messages
- `enableEventTracking`: Track game events
- `metricsInterval`: How often to send server performance data

## Troubleshooting

### Server Not Appearing
- Check API key is correct
- Verify HTTP requests are enabled
- Check script is in ServerScriptService
- Ensure URL is correct (no trailing slash)

### Chat Not Tracking
- Verify `enableChatTracking = true`
- Check players are actually typing chat
- Ensure players meet rank requirements (if rank checking enabled)

### Authentication Errors
- Verify you have admin permissions in the workspace
- Check API key format starts with "orbit_"
- Ensure workspace ID matches the API key

### No Activity Data
- Check `enableRemoteAdmin = true`
- Verify script is not disabled
- Check for script errors in output
- Ensure players meet tracking requirements

## Security Notes

- Keep your API keys secure
- Only give admin access to trusted users
- Regularly rotate API keys if needed
- Monitor for suspicious activity in the dashboard

## Support

If you encounter issues:
1. Check the Roblox Studio output for error messages
2. Verify all configuration values are correct
3. Test with a simple place first
4. Check the Remote Admin dashboard for any error logs

The Remote Admin system provides comprehensive monitoring and management capabilities for your Roblox games, giving you full visibility into player activity and server performance.