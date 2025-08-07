// backend/api/index.js
export default function handler(req, res) {
  res.status(200).json({
    message: "IG Reels Embed API",
    version: "1.0.0",
    endpoints: {
      folders: "/api/folder",
      media: "/api/media",
      embed: "/api/embed"
    },
    documentation: "https://github.com/DK0124/ig-reels-embed-r2"
  });
}