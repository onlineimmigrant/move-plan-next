# Video Clipper - Quick Reference

## 🎬 Tabs Overview

| Tab | Purpose | Key Features |
|-----|---------|--------------|
| **Trim** | Basic clip editing | Trim handles, segments list, project save/load |
| **Timeline** | Visual editing | Draggable segments, zoom, split, segment controls |
| **Metadata** | Publishing info | Title, description, tags, thumbnail selector |
| **Captions** | Subtitles | Manual editing, SRT import/export, time sync |
| **Export Queue** | Batch processing | Multiple presets, progress tracking, downloads |

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| **Space** or **K** | Play/Pause |
| **S** | Split segment at playhead |
| **Ctrl/Cmd + S** | Save project |
| **J** or **←** | Jump back 1 second |
| **L** or **→** | Jump forward 1 second |
| **1** | Set speed to 0.5x |
| **2** | Set speed to 0.75x |
| **3** | Set speed to 1x (normal) |
| **4** | Set speed to 1.25x |
| **5** | Set speed to 1.5x |
| **6** | Set speed to 2x |

## 📋 Export Presets

### YouTube
- 1080p High Quality
- 720p Medium Quality

### Instagram
- Reel (9:16, max 90s)
- Post (1:1, max 60s)
- Story (9:16, max 60s)

### TikTok
- 1080p 9:16 (max 180s)

### Twitter/X
- 1080p 16:9 (max 140s)

### LinkedIn
- 1080p 16:9 (max 600s)

### Generic
- High Quality (1080p)
- Web Optimized (720p)
- Small File Size (480p)

## 🔄 Workflow Examples

### Create Multi-Clip Montage
1. Trim → Set first clip range
2. Click "Add Segment"
3. Adjust trim handles for second clip
4. Click "Add Segment" again
5. Repeat for all clips
6. Timeline → Drag to reorder
7. Export → Choose preset

### Add Professional Captions
1. Captions → Click "Add Caption"
2. Set start/end times (or click timeline)
3. Type caption text
4. Repeat for all captions
5. Export → Download SRT file
6. Or: Import SRT → Upload existing file

### Speed Up/Slow Down Clip
1. Timeline → Click segment
2. Segment Controls → Click speed button
3. Or: Press 1-6 on keyboard
4. Export with speed applied

### Create Social Media Variants
1. Edit your video normally
2. Export Queue → Click multiple presets
3. YouTube 1080p + Instagram Reel + TikTok
4. All export simultaneously
5. Download each format

## 💾 Database Schema

```typescript
video_clipper_projects {
  id: UUID
  organization_id: UUID
  name: string
  source_url: string
  timeline: TimelineSegment[]  // Array of clips
  settings: {
    exportFormat: 'mp4' | 'webm'
  }
  metadata: {
    title?: string
    description?: string
    tags?: string[]
    thumbnailUrl?: string
    thumbnailTime?: number
  }
  captions: Caption[]  // Subtitle array
}

video_clipper_export_jobs {
  id: UUID
  organization_id: UUID
  project_id: UUID
  status: 'queued' | 'processing' | 'done' | 'error'
  progress: number
  output_url: string
}
```

## 🔧 Troubleshooting

### Video won't load
- Check CORS on R2 bucket
- Verify video URL is accessible
- Check browser console for errors

### Export fails
- Check FFmpeg is installed (server)
- Verify R2 credentials in env vars
- Check segment times don't exceed duration

### Keyboard shortcuts not working
- Click inside modal first
- Don't use shortcuts while typing in inputs
- Check browser console for conflicts

### Autosave not working
- Verify you have project saved first
- Check auth token is valid
- Wait 5 seconds after last edit

## 🚀 Performance Tips

1. **Keep segments reasonable** - Too many tiny clips can slow down
2. **Use presets** - Pre-configured for optimal quality/size
3. **Export queue** - Batch similar formats together
4. **Save frequently** - Autosave helps but manual save is faster
5. **Close unused tabs** - Reduces memory usage

## 📞 API Endpoints

```
GET    /api/video-clipper/projects          # List all projects
POST   /api/video-clipper/projects          # Create new project
GET    /api/video-clipper/projects/:id      # Get project
PUT    /api/video-clipper/projects/:id      # Update project
DELETE /api/video-clipper/projects/:id      # Delete project
POST   /api/video-clipper/export            # Multi-segment export
```

---

**Need Help?** Check [VIDEO_CLIPPER_INTEGRATION_COMPLETE.md](VIDEO_CLIPPER_INTEGRATION_COMPLETE.md) for full docs.
