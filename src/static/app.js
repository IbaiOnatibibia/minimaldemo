document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Reset activity select to avoid duplicate options on repeated fetches
      activitySelect.innerHTML = `<option value="">-- Select an activity --</option>`;

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>

          <div class="participants-section">
            <h5>Participants <span class="participants-count">${(details.participants || []).length}</span></h5>
            <div class="participants-list" role="list" aria-label="Participants list"></div>
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Populate participants chips
        const participantsListDiv = activityCard.querySelector(".participants-list");
        const participants = details.participants || [];
        const maxVisible = 6;

        function initialsFromEmail(email) {
          const name = email.split("@")[0];
          const parts = name.split(/[\.\-_ ]+/).filter(Boolean);
          if (parts.length === 0) return email.slice(0, 2).toUpperCase();
          const initials = parts.slice(0, 2).map(p => p[0].toUpperCase()).join("");
          return initials;
        }

        function pickColor(email) {
          const palette = [
            "linear-gradient(135deg,#ff6b6b,#ff9a9e)",
            "linear-gradient(135deg,#ffb86b,#ffd86b)",
            "linear-gradient(135deg,#b2f2bb,#6bd4ff)",
            "linear-gradient(135deg,#6bd4ff,#6b8bff)",
            "linear-gradient(135deg,#c06cff,#8f7bff)",
            "linear-gradient(135deg,#ff6fe6,#ff9bd6)"
          ];
          let h = 0;
          for (let i = 0; i < email.length; i++) h = (h << 5) - h + email.charCodeAt(i);
          return palette[Math.abs(h) % palette.length];
        }

        if (participants.length === 0) {
          const noPart = document.createElement("span");
          noPart.className = "no-participants";
          noPart.textContent = "No participants yet";
          participantsListDiv.appendChild(noPart);
        } else {
          participants.slice(0, maxVisible).forEach((email) => {
            const p = document.createElement("span");
            p.className = "participant";
            p.setAttribute("role", "listitem");
            p.title = email;
            p.setAttribute("aria-label", `Participant ${email}`);
            p.style.background = pickColor(email);
            p.textContent = initialsFromEmail(email);
            participantsListDiv.appendChild(p);
          });

          if (participants.length > maxVisible) {
            const more = document.createElement("span");
            more.className = "participant more";
            more.title = `${participants.length - maxVisible} more participants`;
            more.textContent = `+${participants.length - maxVisible}`;
            participantsListDiv.appendChild(more);
          }
        }

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
