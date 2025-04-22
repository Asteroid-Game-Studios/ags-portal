function openMeetingModal() {
    document.getElementById('meetingModal').style.display = 'block';
}

function closeMeetingModal() {
    document.getElementById('meetingModal').style.display = 'none';
}

document.addEventListener('DOMContentLoaded', () => {
    const meetingForm = document.getElementById('meetingForm');
    if (meetingForm) {
        meetingForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const invitedRoles = Array.from(document.querySelectorAll('input[name="invitedRoles"]:checked'))
                .map(checkbox => checkbox.value);

            const meeting = {
                title: document.getElementById('meetingTitle').value,
                date: document.getElementById('meetingDate').value,
                duration: document.getElementById('meetingDuration').value,
                description: document.getElementById('meetingDescription').value,
                invitedRoles: invitedRoles,
                meetingRoom: document.getElementById('meetingRoom').value // <-- Add this line
            };

            try {
                const response = await fetch('/meetings', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(meeting)
                });

                if (response.ok) {
                    closeMeetingModal();
                    window.location.reload();
                } else {
                    const error = await response.text();
                    throw new Error(error);
                }
            } catch (error) {
                console.error('Error:', error);
                alert(`Error: ${error.message}`);
            }
        });
    }

    // Add event delegation for delete buttons
    document.body.addEventListener('click', async (e) => {
        if (e.target.closest('.delete-meeting')) {
            const button = e.target.closest('.delete-meeting');
            const meetingId = button.dataset.id;
            if (confirm('Are you sure you want to delete this meeting?')) {
                try {
                    const response = await fetch(`/meetings/${meetingId}`, {
                        method: 'DELETE'
                    });

                    if (response.ok) {
                        window.location.reload();
                    } else {
                        const error = await response.json();
                        alert(error.error || 'Failed to delete meeting');
                    }
                } catch (error) {
                    console.error('Error:', error);
                    alert('Error deleting meeting');
                }
            }
        }
    });
});