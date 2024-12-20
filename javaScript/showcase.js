document.getElementById('fetchUsers').addEventListener('click', () => {
  fetch('/.netlify/functions/getUsers')
    .then(response => response.json())
    .then(data => {
      const outputDiv = document.getElementById('output');
      outputDiv.innerHTML = '<h3>Users</h3>';
      data.forEach(user => {
        const userDiv = document.createElement('div');
        userDiv.innerHTML = `<p><strong>Username:</strong> ${user.username}</p>`;
        outputDiv.appendChild(userDiv);
      });
    })
    .catch(error => console.error('Error fetching users:', error));
});

document.getElementById('fetchGarments').addEventListener('click', () => {
  fetch('/.netlify/functions/getGarments')
    .then(response => response.json())
    .then(data => {
      const outputDiv = document.getElementById('output');
      outputDiv.innerHTML = '<h3>Garments</h3>';
      data.forEach(garment => {
        const garmentDiv = document.createElement('div');
        garmentDiv.innerHTML = `<p><strong>Garment Name:</strong> ${garment.garmentName}</p>`;
        outputDiv.appendChild(garmentDiv);
      });
    })
    .catch(error => console.error('Error fetching garments:', error));
});
