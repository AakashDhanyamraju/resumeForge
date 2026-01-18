# Resume Forge - LaTeX Resume Builder

A modern, web-based resume maker that allows you to create and edit LaTeX resumes with live preview. Features ATS-friendly templates and real-time PDF compilation.

![GitHub license](https://img.shields.io/github/license/AakashDhanyamraju/resumeForge)
![GitHub last commit](https://img.shields.io/github/last-commit/AakashDhanyamraju/resumeForge)
![GitHub issues](https://img.shields.io/github/issues/AakashDhanyamraju/resumeForge)
![OpenAI](https://img.shields.io/badge/AI-OpenAI-green)

## Features

- 📝 **Live LaTeX Editor** - Edit your resume in real-time with syntax highlighting
- 👁️ **Live Preview** - See your changes instantly as PDF preview
- 🤖 **AI-Powered Editing** - Enhance your content with AI suggestions (OpenAI integration)
- 🎨 **Modern Templates** - Pre-built ATS-friendly resume templates stored in S3
- 📄 **PDF Export** - Download your resume as a professional PDF
- ⚡ **Fast Compilation** - Powered by Bun for lightning-fast LaTeX compilation
- 🎯 **ATS Optimized** - Templates designed to pass Applicant Tracking Systems
- 🔐 **Role-Based Access** - Admin, Content Manager, and User roles
- 🐳 **Docker Support** - No need to install LaTeX locally - everything runs in containers
- 🌐 **Production Ready** - Nginx reverse proxy for single-server deployment

## Security & Open Source

- The repository now includes a `.env.example` file with placeholder environment variables to avoid exposing secrets.
- All real secrets have been removed from the codebase and are listed in `.gitignore`.
- A secret‑leak audit was performed; no hard‑coded secrets remain.

## Prerequisites

- [Docker](https://www.docker.com/get-started) and Docker Compose
- OR [Bun](https://bun.sh/) + LaTeX for local development

## Quick Start with Docker (Recommended)

No need to install LaTeX locally! Everything runs in Docker containers.

### Production Deployment

1. **Build and start the application:**
```bash
docker-compose up -d --build
```

2. **Access the application:**
   - Open your browser to `http://localhost`

3. **View logs:**
```bash
docker-compose logs -f
```

4. **Stop the application:**
```bash
docker-compose down
```

### Development Mode

For local development with hot reload:

```bash
docker-compose -f docker-compose.dev.yml up --build
```

Then access:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3000`

## Local Development (Without Docker)

### Prerequisites

- [Bun](https://bun.sh/) - JavaScript runtime and package manager
- LaTeX Distribution:
  - **Windows**: [MiKTeX](https://miktex.org/) or [TeX Live](https://www.tug.org/texlive/)
  - **macOS**: [MacTeX](https://www.tug.org/mactex/)
  - **Linux**: `sudo apt-get install texlive-full` (or equivalent)

### Installation

1. Clone or download this repository
2. Install dependencies:

```bash
# Install backend dependencies
bun install

# Install frontend dependencies
cd client
bun install
cd ..
```

### Running the Application

1. Start the backend server:
```bash
bun run dev
```

2. In a new terminal, start the frontend:
```bash
bun run client:dev
```

3. Open your browser to `http://localhost:5173`

## Usage

1. **Select a Template**: Choose from the available templates in the header dropdown
2. **Edit Your Resume**: Modify the LaTeX code in the editor panel
3. **Live Preview**: Your changes automatically compile and appear in the preview panel (with 1.5s debounce)
4. **Download PDF**: Click the "Download PDF" button to save your resume

## Available Templates

- **Modern** - Contemporary design with color accents, ideal for tech and creative roles
- **Minimal** - Clean and simple, perfect for traditional industries
- **Executive** - Professional layout for senior-level positions
- **Classic** - Traditional design with minimal dependencies

All templates are optimized for ATS (Applicant Tracking System) parsing.

## Project Structure

```
resume-maker/
├── src/
│   └── server.ts          # Backend API server
├── client/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── App.tsx        # Main app component
│   │   └── main.tsx       # Entry point
│   └── package.json       # Frontend dependencies
├── templates/            # LaTeX resume templates
├── nginx.conf           # Nginx configuration for production
├── Dockerfile            # Production Docker image
├── docker-compose.yml    # Production Docker Compose
└── README.md
```

## Architecture

### Production (Docker)

- **Backend Container**: Runs Bun server with LaTeX (texlive) installed
- **Nginx Container**: Serves frontend static files and proxies API requests
- **Database**: PostgreSQL (Supabase) for user data and sessions
- **Storage**: S3-compatible storage (Supabase Storage) for templates and assets
- **Single Port**: Access everything on port 80 (or 443 for HTTPS)

### API Endpoints

- `GET /api/templates` - Get all available templates
- `GET /api/templates/:name` - Get a specific template
- `POST /api/compile` - Compile LaTeX to PDF

## Customization

### Adding New Templates

1. Create a new `.tex` file in the `templates/` directory
2. Use ATS-friendly formatting:
   - Standard fonts (Times New Roman, Arial, Calibri)
   - Simple section headers
   - Avoid complex tables and graphics
   - Use standard date formats
   - Include keywords relevant to your industry

### Modifying Styles

Edit the CSS files in `client/src/` to customize the UI appearance.

### Environment Variables

You can customize the setup with environment variables:

```bash
# In docker-compose.yml or .env file
NODE_ENV=production
PORT=3000
```

## Troubleshooting

### Docker Issues

**Container won't start:**
- Check Docker is running: `docker ps`
- View logs: `docker-compose logs`
- Rebuild: `docker-compose up -d --build --force-recreate`

**Port already in use:**
- Change ports in `docker-compose.yml`:
  ```yaml
  ports:
    - "8080:80"  # Use port 8080 instead
  ```

**LaTeX compilation fails in Docker:**
- Check backend logs: `docker-compose logs backend`
- Ensure texlive image is properly built
- Try rebuilding: `docker-compose build --no-cache backend`

### Local Development Issues

**LaTeX Not Found:**
- See [INSTALL_LATEX_WINDOWS.md](./INSTALL_LATEX_WINDOWS.md) for Windows installation
- Ensure LaTeX is in your system PATH
- Restart terminal after installation

**Compilation Errors:**
- Check the error message in the preview panel
- Ensure all required LaTeX packages are installed
- Verify your LaTeX syntax is correct

## Deployment

### Production Deployment

1. **Build and deploy:**
```bash
docker-compose up -d --build
```

2. **Set up HTTPS (optional):**
   - Update `nginx.conf` to include SSL certificates
   - Use Let's Encrypt with certbot
   - Configure port 443 in `docker-compose.yml`

3. **Environment-specific configuration:**
   - Copy `.env.example` to `.env` and fill in your credentials
   - Update `docker-compose.yml` to use `.env` file

### Cloud Deployment

The application can be deployed to:
- **AWS**: Use ECS, EKS, or EC2 with Docker
- **Google Cloud**: Cloud Run or GKE
- **Azure**: Container Instances or AKS
- **DigitalOcean**: App Platform or Droplets
- **Heroku**: Using container registry

## Technologies Used

- **Backend**: Bun, Elysia
- **Frontend**: React, TypeScript, Vite
- **LaTeX Compilation**: pdflatex (via texlive Docker image)
- **Reverse Proxy**: Nginx
- **Containerization**: Docker, Docker Compose
- **UI Icons**: Lucide React

## License

MIT License - feel free to use this for your own projects!

## Contributing

Contributions are welcome! Feel free to submit issues or pull requests.
