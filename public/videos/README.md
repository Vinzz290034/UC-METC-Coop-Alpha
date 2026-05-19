# Landing page video

GitHub does not allow files over 100 MB. The coop intro video is **not** stored in git.

## Local development

Copy your video here once:

```bash
cp "src/assets/FINAL COOP.mp4" "public/videos/FINAL-COOP.mp4"
```

## Production

Upload the MP4 to Cloudinary, YouTube, or your CDN, then set in the frontend env:

```env
VITE_LANDING_VIDEO_URL=https://your-cdn.example.com/FINAL-COOP.mp4
```

Or upload `FINAL-COOP.mp4` to your static host’s `public/videos/` folder on deploy.
