# YouTube Watch Together Feature

This feature allows users in a study room to watch YouTube videos together with synchronized playback.

## Features

- Search for YouTube videos
- Synchronized video playback across all participants
- Video queue management
- Collaborative controls (all participants can manage videos)

## Setup

### YouTube API Key

The video search functionality requires a YouTube Data API key. To set up:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the YouTube Data API v3
4. Create an API key
5. Add the API key to your `.env` file:

```
VITE_YOUTUBE_API_KEY=YOUR_API_KEY_HERE
```

### Fallback for API Key

If no API key is provided, the component still functions in a limited mode:
- Users can only add videos by directly pasting a YouTube URL or video ID
- No search results will be displayed
- Synchronization still works normally

## Usage

1. In a study room, click on the "Watch Together" tool
2. Search for videos or paste YouTube URLs
3. Video playback is automatically synchronized
4. All participants have equal control:
   - Everyone can play/pause videos
   - Everyone can skip to the next video
   - Everyone can add and remove videos from the queue

## Firebase Structure

The feature uses the following Firestore structure:

```
studyRooms/{roomId}/tools/youtubePlayer
```

The `youtubePlayer` document contains:

- `videoId` - Current video ID
- `status` - Playback status (playing/paused/buffering/ended)
- `timestamp` - Current playback position in seconds
- `lastUpdated` - Timestamp of last update
- `updatedBy` - User ID of last person to update
- `updatedByName` - Display name of last person to update
- `queue` - Array of queued videos

## Technical Details

- Uses the YouTube iframe API for the player
- Firebase Firestore for synchronization
- Handles latency with 2-second tolerance for sync
- Mobile responsive design

## Troubleshooting

If videos are not playing:
1. Check if the YouTube API key is valid and configured
2. Ensure the video ID is correct
3. Check if the video allows embedding (some videos restrict this)
4. Verify network connectivity for all participants 