{
  "rewrites": [
    {
      "source": "/api/chat",
      "destination": "/api/chat.js"
    },
    {
      "source": "/api/:path*",
      "destination": "/api/:path*"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
