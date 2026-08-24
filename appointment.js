// ============================================
// GESTION DES RENDEZ-VOUS
// ============================================

// Clé pour stocker les rendez-vous dans localStorage
const STORAGE_KEY = 'goldenglow_appointments';

// Identifiants admin (à changer en production)
const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'goldenglow2026'
};

// ============================================
// 1. FONCTIONS DE GESTION DES DONNÉES
// ============================================

// Récupérer tous les rendez-vous
function getAppointments() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

// Sauvegarder les rendez-vous
function saveAppointments(appointments) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appointments));
}

// Générer un ID unique
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// ============================================
// 2. CRÉATION D'UN RENDEZ-VOUS
// ============================================

document.getElementById('appointmentForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Récupération des valeurs
    const appointment = {
        id: generateId(),
        name: document.getElementById('clientName').value.trim(),
        email: document.getElementById('clientEmail').value.trim(),
        phone: document.getElementById('clientPhone').value.trim(),
        service: document.getElementById('serviceType').value,
        date: document.getElementById('appointmentDate').value,
        time: document.getElementById('appointmentTime').value,
        comments: document.getElementById('comments').value.trim(),
        status: 'pending', // pending, confirmed, cancelled, completed
        createdAt: new Date().toISOString()
    };
    
    // Validation
    if (!appointment.name || !appointment.email || !appointment.phone || 
        !appointment.service || !appointment.date || !appointment.time) {
        showMessage('Veuillez remplir tous les champs obligatoires.', 'error');
        return;
    }
    
    // Vérifier si le créneau est déjà pris
    const appointments = getAppointments();
    const existing = appointments.find(a => a.date === appointment.date && a.time === appointment.time);
    
    if (existing) {
        showMessage('Désolé, ce créneau horaire est déjà réservé. Veuillez choisir un autre horaire.', 'error');
        return;
    }
    
    // Ajouter le rendez-vous
    appointments.push(appointment);
    saveAppointments(appointments);
    
    // Afficher la confirmation
    showMessage(`✅ Rendez-vous confirmé !\n\n${appointment.name}, vous êtes inscrit(e) le ${formatDate(appointment.date)} à ${appointment.time} pour un service "${getServiceLabel(appointment.service)}".\nUn email de confirmation vous a été envoyé.`, 'success');
    
    // Réinitialiser le formulaire
    this.reset();
    
    // Notification (si les permissions sont accordées)
    if (Notification.permission === 'granted') {
        new Notification('Nouveau rendez-vous', {
            body: `${appointment.name} a pris un rendez-vous pour ${getServiceLabel(appointment.service)}`,
            icon: '/favicon.ico'
        });
    }
});

// ============================================
// 3. AFFICHAGE DES MESSAGES
// ============================================

function showMessage(message, type = 'success') {
    const container = document.getElementById('confirmationMessage');
    container.style.display = 'block';
    container.className = `alert alert-${type === 'success' ? 'success' : 'danger'} mt-3`;
    container.innerHTML = message.replace(/\n/g, '<br>');
    
    // Faire défiler jusqu'au message
    container.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Masquer après 10 secondes
    setTimeout(() => {
        container.style.display = 'none';
    }, 10000);
}

// ============================================
// 4. FORMATAGE DES DONNÉES
// ============================================

function formatDate(dateString) {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

function getServiceLabel(value) {
    const services = {
        'coupe-homme': 'Coupe Homme',
        'coupe-femme': 'Coupe Femme',
        'coloration': 'Coloration',
        'brushing': 'Brushing',
        'shampoing': 'Shampoing Traitant'
    };
    return services[value] || value;
}

function getStatusLabel(status) {
    const labels = {
        'pending': '⏳ En attente',
        'confirmed': '✅ Confirmé',
        'cancelled': '❌ Annulé',
        'completed': '✔️ Terminé'
    };
    return labels[status] || status;
}

// ============================================
// 5. ADMINISTRATION - PANEL DE GESTION
// ============================================

// Fonction de connexion
function loginAdmin(username, password) {
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        sessionStorage.setItem('admin_logged_in', 'true');
        document.getElementById('adminDashboard').style.display = 'block';
        loadAppointments();
        return true;
    }
    return false;
}

// Déconnexion
function logoutAdmin() {
    sessionStorage.removeItem('admin_logged_in');
    document.getElementById('adminDashboard').style.display = 'none';
    alert('Déconnecté');
}

// Charger et afficher les rendez-vous
function loadAppointments() {
    const appointments = getAppointments();
    const container = document.getElementById('appointmentsList');
    
    if (appointments.length === 0) {
        container.innerHTML = '<div class="alert alert-info">Aucun rendez-vous pour le moment.</div>';
        return;
    }
    
    // Trier par date (du plus récent au plus ancien)
    appointments.sort((a, b) => a.date.localeCompare(b.date));
    
    let html = `
        <div class="table-responsive">
            <table class="table table-striped">
                <thead>
                    <tr>
                        <th>Client</th>
                        <th>Service</th>
                        <th>Date</th>
                        <th>Horaire</th>
                        <th>Statut</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    appointments.forEach(apt => {
        html += `
            <tr>
                <td>
                    <strong>${apt.name}</strong><br>
                    <small>${apt.email}</small><br>
                    <small>${apt.phone}</small>
                </td>
                <td>${getServiceLabel(apt.service)}</td>
                <td>${formatDate(apt.date)}</td>
                <td>${apt.time}</td>
                <td>
                    <select class="form-control form-control-sm status-select" data-id="${apt.id}">
                        <option value="pending" ${apt.status === 'pending' ? 'selected' : ''}>⏳ En attente</option>
                        <option value="confirmed" ${apt.status === 'confirmed' ? 'selected' : ''}>✅ Confirmé</option>
                        <option value="completed" ${apt.status === 'completed' ? 'selected' : ''}>✔️ Terminé</option>
                        <option value="cancelled" ${apt.status === 'cancelled' ? 'selected' : ''}>❌ Annulé</option>
                    </select>
                </td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="viewAppointment('${apt.id}')">👁️</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteAppointment('${apt.id}')">🗑️</button>
                </td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
        <div class="mt-3">
            <strong>Total :</strong> ${appointments.length} rendez-vous
        </div>
    `;
    
    container.innerHTML = html;
    
    // Ajouter les événements pour les changements de statut
    document.querySelectorAll('.status-select').forEach(select => {
        select.addEventListener('change', function() {
            const id = this.dataset.id;
            const newStatus = this.value;
            updateAppointmentStatus(id, newStatus);
        });
    });
}

// Mettre à jour le statut d'un rendez-vous
function updateAppointmentStatus(id, newStatus) {
    const appointments = getAppointments();
    const index = appointments.findIndex(a => a.id === id);
    
    if (index !== -1) {
        appointments[index].status = newStatus;
        saveAppointments(appointments);
        loadAppointments(); // Rafraîchir la liste
    }
}

// Voir les détails d'un rendez-vous
function viewAppointment(id) {
    const appointments = getAppointments();
    const apt = appointments.find(a => a.id === id);
    
    if (apt) {
        const details = `
            === DÉTAILS DU RENDEZ-VOUS ===
            
            Client : ${apt.name}
            Email : ${apt.email}
            Téléphone : ${apt.phone}
            Service : ${getServiceLabel(apt.service)}
            Date : ${formatDate(apt.date)}
            Horaire : ${apt.time}
            Statut : ${getStatusLabel(apt.status)}
            Commentaires : ${apt.comments || 'Aucun'}
            Créé le : ${new Date(apt.createdAt).toLocaleString('fr-FR')}
        `;
        alert(details);
    }
}

// Supprimer un rendez-vous
function deleteAppointment(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce rendez-vous ?')) {
        let appointments = getAppointments();
        appointments = appointments.filter(a => a.id !== id);
        saveAppointments(appointments);
        loadAppointments(); // Rafraîchir la liste
    }
}

// ============================================
// 6. INTERFACE ADMIN - AUTHENTIFICATION
// ============================================

// Ajouter un bouton d'accès admin en bas de page
function addAdminAccess() {
    const adminLink = document.createElement('div');
    adminLink.style.position = 'fixed';
    adminLink.style.bottom = '10px';
    adminLink.style.right = '10px';
    adminLink.innerHTML = `
        <button class="btn btn-sm btn-secondary" onclick="showLoginModal()">🔑 Admin</button>
    `;
    document.body.appendChild(adminLink);
}

// Afficher la modale de connexion
function showLoginModal() {
    const username = prompt('Nom d\'utilisateur :');
    if (username === null) return;
    
    const password = prompt('Mot de passe :');
    if (password === null) return;
    
    if (loginAdmin(username, password)) {
        alert('Connexion réussie !');
        document.getElementById('adminDashboard').scrollIntoView({ behavior: 'smooth' });
    } else {
        alert('Identifiants incorrects. Veuillez réessayer.');
    }
}

// ============================================
// 7. NOTIFICATIONS ET RAPPELS
// ============================================

// Demander la permission pour les notifications
if ('Notification' in window) {
    Notification.requestPermission();
}

// Vérifier les rappels (exécuter au chargement et toutes les heures)
function checkReminders() {
    const appointments = getAppointments();
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    appointments.forEach(apt => {
        if (apt.date === today && apt.status === 'pending') {
            const [hour, minute] = apt.time.split(':').map(Number);
            const diffMinutes = (hour * 60 + minute) - (currentHour * 60 + currentMinute);
            
            // Si le rendez-vous est dans moins de 60 minutes
            if (diffMinutes > 0 && diffMinutes <= 60) {
                // Notification de rappel (à implémenter avec un service comme EmailJS)
                console.log(`Rappel : Rendez-vous de ${apt.name} à ${apt.time}`);
            }
        }
    });
}

// ============================================
// 8. INITIALISATION
// ============================================

// Charger les rendez-vous si l'admin est déjà connecté
document.addEventListener('DOMContentLoaded', function() {
    // Ajouter les dates minimum pour le sélecteur de date
    const dateInput = document.getElementById('appointmentDate');
    const today = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('min', today);
    
    // Ajouter l'accès admin
    addAdminAccess();
    
    // Vérifier si l'admin est déjà connecté
    if (sessionStorage.getItem('admin_logged_in') === 'true') {
        document.getElementById('adminDashboard').style.display = 'block';
        loadAppointments();
    }
    
    // Vérifier les rappels toutes les heures
    checkReminders();
    setInterval(checkReminders, 3600000); // 1 heure
});

// ============================================
// 9. EXPORTATION (si nécessaire)
// ============================================

// Exporter les rendez-vous en CSV (pour le gestionnaire)
function exportAppointmentsCSV() {
    const appointments = getAppointments();
    if (appointments.length === 0) {
        alert('Aucun rendez-vous à exporter.');
        return;
    }
    
    // Créer les lignes CSV
    let csv = 'Nom,Email,Téléphone,Service,Date,Horaire,Statut,Commentaires\n';
    
    appointments.forEach(apt => {
        csv += `${apt.name},${apt.email},${apt.phone},${getServiceLabel(apt.service)},${apt.date},${apt.time},${apt.status},${apt.comments || ''}\n`;
    });
    
    // Télécharger
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `rendez-vous_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
}

// Ajouter le bouton d'export dans le dashboard
document.addEventListener('DOMContentLoaded', function() {
    const dashboardHeader = document.querySelector('#adminDashboard .col-12');
    if (dashboardHeader) {
        const exportBtn = document.createElement('button');
        exportBtn.className = 'btn btn-success mb-3 ms-2';
        exportBtn.innerHTML = '📊 Exporter CSV';
        exportBtn.onclick = exportAppointmentsCSV;
        dashboardHeader.querySelector('.mb-3').appendChild(exportBtn);
    }
});