let editIndex = null;
let projects = [];

const projectGrid = document.getElementById("projectGrid");
const projectModal = document.getElementById("projectModal");
const modalTitle = document.getElementById("modalTitle");
const projectTitle = document.getElementById("projectTitle");
const projectDesc = document.getElementById("projectDesc");
const projectTech = document.getElementById("projectTech");
const projectLive = document.getElementById("projectLive");
const resumeUpload = document.getElementById("resumeUpload");
const downloadResume = document.getElementById("downloadResume");

// Fetch projects from Flask API on page load
async function fetchProjects() {
    const res = await fetch("/projects_api");
    projects = await res.json();
    renderProjects();
}

// Open modal
function openModal(index = null) {
    projectModal.style.display = "flex";
    editIndex = index;

    if (index !== null) {
        modalTitle.innerText = "Edit Project";
        const p = projects[index];
        projectTitle.value = p.title;
        projectDesc.value = p.description;
        projectTech.value = p.tech_stack;
        projectLive.value = p.live_link || "";
    } else {
        modalTitle.innerText = "Add Project";
        projectTitle.value = "";
        projectDesc.value = "";
        projectTech.value = "";
        projectLive.value = "";
    }
}

// Close modal
function closeModal() {
    projectModal.style.display = "none";
}

// Save project via Flask API
async function saveProject() {
    const project = {
        title: projectTitle.value,
        description: projectDesc.value,
        tech_stack: projectTech.value,
        live_link: projectLive.value
    };

    await fetch("/add_project", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(project)
    });

    await fetchProjects();  // refresh projects
    closeModal();
}

// Render projects
function renderProjects() {
    projectGrid.innerHTML = "";
    projects.forEach((p, i) => {
        projectGrid.innerHTML += `
            <div class="project-card">
                <h4>${p.title}</h4>
                <p>${p.description}</p>
                <p><small>${p.tech_stack}</small></p>
                <div class="project-actions">
                    ${p.live_link ? `<a href="${p.live_link}" target="_blank" class="btn-primary">Live Demo</a>` : ""}
                    <button class="btn-outline" onclick="openModal(${i})">Edit</button>
                    <button class="btn-outline" onclick="deleteProject(${p.project_id})">Delete</button>
                </div>
            </div>
        `;
    });
}

// Delete project via Flask API
async function deleteProject(id) {
    if (confirm("Delete this project?")) {
        await fetch(`/delete_project/${id}`, {method: "DELETE"});
        await fetchProjects();
    }
}

// Resume upload via Flask
function uploadResume() {
    resumeUpload.click();
}

resumeUpload.addEventListener("change", async function () {
    const formData = new FormData();
    formData.append("resume", this.files[0]);
    const res = await fetch("/upload_resume", {method: "POST", body: formData});
    const data = await res.json();
    if(data.status === "success") {
        alert("Resume uploaded successfully!");
        location.reload();
    }
});

// Intersection observer for animations (same as before)
const cards = document.querySelectorAll('.animate');
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if(entry.isIntersecting){
            entry.target.classList.add('show');
        }
    });
}, { threshold: 0.2 });
cards.forEach(card => observer.observe(card));

// Initialize
fetchProjects();
