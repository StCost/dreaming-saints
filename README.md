# Saint Blog

A super quick and simple GitHub Pages blog built with Vite + React, featuring dark mode and markdown support.

## Features

- 🌙 **Dark Mode**: Beautiful GitHub-inspired dark theme
- 📝 **Markdown Support**: Write posts in markdown format
- ⚙️ **Configurable**: Centralized configuration for all text and settings
- 🔄 **Auto-sorting**: Posts sorted by number in filename (descending)
- ⚡ **Fast**: Built with Vite for lightning-fast development
- 🚀 **GitHub Pages Ready**: Deploy easily with GitHub Actions
- 🔗 **Hash Routing**: Works perfectly with GitHub Pages
- ✏️ **GitHub Integration**: Edit posts and create new ones directly on GitHub
- 📤 **Social Sharing**: Share posts on X (Twitter) with one click

## Quick Start

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Start development server:**

   ```bash
   npm run dev
   ```

3. **Build for production:**
   ```bash
   npm run build
   ```

## Adding Blog Posts

### Method 1: Manual File Creation

1. Create a new markdown file in `src/posts/`
2. Name it with a number prefix: `004.md`
3. Higher numbers appear first in the list
4. Posts are automatically discovered and imported - no manual updates needed!

### Method 2: Using the New Post Button (Recommended)

1. Click the "New Post" button at the bottom of the home page
2. This opens GitHub's file creation interface with a pre-filled filename
3. The filename is automatically numbered (e.g., `004.md`) based on existing posts
4. Write your post in markdown format
5. Commit the changes - GitHub handles the rest!

### Editing Posts

- Click the "Edit on GitHub" button on any blog post page
- Make your changes directly on GitHub
- GitHub handles authentication and permissions
- Perfect for quick fixes and updates

### Example Post Structure

````markdown
# My Blog Post Title

Your content here...

## Subheading

More content with **bold** and _italic_ text.

```javascript
// Code blocks are supported
console.log("Hello, World!");
```
````

> Blockquotes work too!

- Lists
- Are
- Supported

## GitHub Pages Deployment

### Automatic Deployment

The repo includes a GitHub Actions workflow that automatically deploys to GitHub Pages when you push to the `main` branch.

### Manual Deployment

You can also deploy manually:

```bash
npm run build
npm run deploy
```

### Setup GitHub Pages

1. Go to your repository settings
2. Navigate to "Pages" section
3. Set source to "GitHub Actions"
4. The site will be available at `https://yourusername.github.io/blog/`

## Project Structure

```
blog/
├── public/
│   └── favicon.svg      # Site favicon
├── src/
│   ├── posts/           # Markdown blog posts
│   │   ├── 001-first-post.md
│   │   ├── 002-second-post.md
│   │   └── 003-third-post.md
│   ├── components/
│   │   ├── BlogList.jsx # Post listing page
│   │   └── BlogPost.jsx # Individual post viewer
│   ├── App.jsx          # Main app component
│   ├── main.jsx         # React entry point
│   ├── config.js        # Centralized configuration
│   ├── utils.js         # Utility functions
│   └── index.css        # Dark theme styles
├── .github/
│   └── workflows/
│       └── deploy.yml   # GitHub Actions deployment
├── CONFIG.md            # Configuration guide
├── package.json
├── vite.config.js
└── index.html
```

## Configuration

Saint Blog now uses a centralized configuration system! All text, settings, and customization options are located in `src/config.js`.

### Quick Setup

1. **Open** `src/config.js`
2. **Update** these essential settings:
   ```javascript
   site: {
     title: "Your Blog Name",
     description: "Your blog description",
     tagline: "Your subtitle",
     author: "Your Name",
     url: "https://yourusername.github.io/blog/"
   }
   ```
3. **Save** and restart your dev server

### Full Configuration Guide

See **[CONFIG.md](CONFIG.md)** for complete documentation on all available options including:

- UI text and messages
- SEO and meta tags
- Theme settings
- Social media links
- Feature toggles

## Customization

### Styling

Edit `src/index.css` to customize the dark theme colors and layout.

### Advanced Configuration

The configuration system allows you to customize:

- Loading messages and error text
- Post excerpt length
- SEO keywords and meta tags
- Social media integration
- Future feature toggles

### Base URL

If your repository name is different, update the `base` in `vite.config.js`:

```javascript
export default defineConfig({
  plugins: [react()],
  base: "/YourRepoName/",
  // ...
});
```

## Technologies Used

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **React Router** - Hash-based routing
- **React Markdown** - Markdown rendering
- **GitHub Actions** - Automatic deployment
- **GitHub Pages** - Free hosting
- **NPM** - Package manager

## License

MIT License - feel free to use this for your own blog!

---

Happy blogging! 🚀

## Todo
- cheap pagination
- show preview images
- show created and updated dates of post
- shared link of post must preview title and content
