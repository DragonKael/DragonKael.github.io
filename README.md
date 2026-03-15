# 🧪 DragonKael Research Lab

Personal **Engineering Research Lab** of **Luis Salas (DragonKael)**.

This repository powers my public research portal hosted with GitHub Pages, where I document experiments, projects, technical notes, and research in Systems Engineering and emerging technologies.

🔗 Live Site  
https://dragonkael.github.io/

---

# 🧠 Purpose

This site acts as a **knowledge hub and research laboratory**, where ideas, prototypes, and technical explorations are documented and organized.

The platform automatically indexes research documents and projects using the GitHub API, enabling a dynamic and scalable documentation environment.

---

# 🔬 Research Areas

Main topics currently explored:

- Semantic Web Integration
- QR Standards and Information Encoding
- Federated Blockchain for Digital Signatures
- OCR and Document Digitalization
- Distributed Systems
- Microservices Architecture
- Network Security and SDR Experiments

---

# 🏗 Architecture

The platform is a **static research dashboard** built with:

- HTML
- CSS
- JavaScript
- GitHub API

Repository structure:

DragonKael.github.io
│
├── index.html
├── config/
│   └── lab-config.js
├── js/
│   ├── repo-indexer.js
│   └── ui.js
├── css/
│   └── style.css
│
├── research/
├── projects/
├── experiments/
├── notes/
│
└── assets/

Each folder represents a knowledge domain and contains `.html` documents automatically indexed by the dashboard.

---

# ⚙ How the Auto-Indexing Works

The dashboard scans repository folders through the GitHub API and extracts metadata from HTML documents.

Example metadata:
```bash
<meta name="title" content="Web Semantics Integration">
<meta name="description" content="Research about semantic web applications">
<meta name="tags" content="semantic web, qr, blockchain">
<meta name="year" content="2026">
<meta name="featured" content="true">
```

These fields are used to generate:

- searchable documents
- research tags
- featured projects
- timeline filtering

---

# 📂 Adding New Research

1. Place the file in the corresponding folder:

research/
projects/
experiments/
notes/

2. Add metadata in the HTML header.

3. Commit and push.

The dashboard will automatically index the document.

---

# 🚀 Future Improvements

Planned features:

- Knowledge graph visualization
- Automatic research timeline
- Markdown support
- Research tagging system
- GitHub repository integration
- Experiment documentation framework

---

# 👨‍💻 Author

**Luis Salas**  
Systems Engineering Researcher

GitHub  
https://github.com/DragonKael

---

# 📜 License

This project is licensed under the MIT License. See the **LICENSE** file for details.
