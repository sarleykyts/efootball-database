document.addEventListener("DOMContentLoaded", () => {
    // --- Loading Screen ---
    setTimeout(() => {
        document.getElementById('loader').style.opacity = '0';
        setTimeout(() => document.getElementById('loader').style.display = 'none', 500);
    }, 2000);

    // --- Particles JS Initialization ---
    particlesJS('particles-js', {
        particles: {
            number: { value: 50 },
            color: { value: '#00f3ff' },
            shape: { type: 'circle' },
            opacity: { value: 0.5 },
            size: { value: 3 },
            line_linked: { enable: true, distance: 150, color: '#00f3ff', opacity: 0.2, width: 1 },
            move: { enable: true, speed: 2 }
        },
        interactivity: {
            events: { onhover: { enable: true, mode: 'grab' } }
        }
    });

    // --- State Management ---
    let players = [...playersData];
    let favorites = JSON.parse(localStorage.getItem('efootFavs')) || [];
    let isCompareMode = false;
    let compareQueue = [];

    const grid = document.getElementById('cardsGrid');
    const modal = document.getElementById('playerModal');
    const modalBody = document.getElementById('modalBody');

    // --- Render Cards ---
    function renderCards(data) {
        grid.innerHTML = '';
        data.forEach(player => {
            const isFav = favorites.includes(player.id);
            const starsHTML = '★'.repeat(player.stars) + '☆'.repeat(5 - player.stars);
            
            const card = document.createElement('div');
            card.className = `card ${player.rarity}`;
            card.innerHTML = `
                <i class="fas fa-heart fav-btn ${isFav ? 'active' : ''}" data-id="${player.id}"></i>
                <div class="card-header">
                    <span class="ovr">${player.overall}</span>
                    <span class="pos">${player.position}</span>
                </div>
                <img src="${player.image}" alt="${player.name}" loading="lazy">
                <div class="stars">${starsHTML}</div>
                <div class="card-name">${player.name} ${player.country}</div>
            `;

            // Card Click Logic (Detail or Compare)
            card.addEventListener('click', (e) => {
                if(e.target.classList.contains('fav-btn')) return; // Ignore fav click
                if(isCompareMode) {
                    handleCompare(player);
                } else {
                    openModal(player);
                }
            });

            // Favorite Logic
            card.querySelector('.fav-btn').addEventListener('click', (e) => {
                const id = parseInt(e.target.dataset.id);
                if (favorites.includes(id)) {
                    favorites = favorites.filter(fav => fav !== id);
                    e.target.classList.remove('active');
                } else {
                    favorites.push(id);
                    e.target.classList.add('active');
                }
                localStorage.setItem('efootFavs', JSON.stringify(favorites));
            });

            grid.appendChild(card);
        });
    }

    // --- Search & Filter ---
    function filterData() {
        const query = document.getElementById('searchInput').value.toLowerCase();
        const pos = document.getElementById('posFilter').value;
        const sort = document.getElementById('sortFilter').value;

        let filtered = players.filter(p => {
            const matchName = p.name.toLowerCase().includes(query);
            const matchPos = pos === 'all' || p.position === pos;
            return matchName && matchPos;
        });

        if(sort === 'ovr-desc') filtered.sort((a, b) => b.overall - a.overall);
        if(sort === 'ovr-asc') filtered.sort((a, b) => a.overall - b.overall);
        if(sort === 'name') filtered.sort((a, b) => a.name.localeCompare(b.name));

        renderCards(filtered);
    }

    document.getElementById('searchInput').addEventListener('input', filterData);
    document.getElementById('posFilter').addEventListener('change', filterData);
    document.getElementById('sortFilter').addEventListener('change', filterData);

    // --- Modal Logic ---
    function openModal(player) {
        modal.classList.remove('hidden');
        modalBody.innerHTML = `
            <h2 style="text-align:center; color:var(--neon-cyan);">${player.name} - ${player.overall} ${player.position}</h2>
            <div style="text-align:center; margin: 15px 0;"><img src="${player.image}" style="height:150px;"></div>
            ${Object.entries(player.stats).map(([stat, val]) => `
                <div class="stat-row">
                    <div class="stat-label">${stat.toUpperCase()}</div>
                    <div class="stat-bar-bg"><div class="stat-bar-fill" id="bar-${stat}"></div></div>
                    <div class="stat-val">${val}</div>
                </div>
            `).join('')}
        `;
        
        // Trigger Progress Bar Animation
        setTimeout(() => {
            Object.entries(player.stats).forEach(([stat, val]) => {
                document.getElementById(`bar-${stat}`).style.width = `${val}%`;
                // Color code stat bars
                document.getElementById(`bar-${stat}`).style.background = val >= 90 ? '#00ff88' : val >= 80 ? '#00f3ff' : val >= 70 ? '#ffd700' : '#ff0055';
            });
        }, 50);
    }

    document.querySelector('.close').addEventListener('click', () => modal.classList.add('hidden'));
    window.addEventListener('click', (e) => { if(e.target === modal) modal.classList.add('hidden'); });

    // --- Compare Logic ---
    document.getElementById('compareBtn').addEventListener('click', function() {
        isCompareMode = !isCompareMode;
        this.style.background = isCompareMode ? 'var(--neon-pink)' : 'rgba(0,0,0,0.2)';
        document.getElementById('compare-banner').classList.toggle('hidden');
        compareQueue = [];
    });

    function handleCompare(player) {
        if(!compareQueue.includes(player)) compareQueue.push(player);
        if(compareQueue.length === 2) {
            showCompareModal(compareQueue[0], compareQueue[1]);
            isCompareMode = false;
            document.getElementById('compareBtn').style.background = 'rgba(0,0,0,0.2)';
            document.getElementById('compare-banner').classList.add('hidden');
        }
    }

    function showCompareModal(p1, p2) {
        modal.classList.remove('hidden');
        modalBody.innerHTML = `
            <h2 style="text-align:center; margin-bottom: 20px;">Comparison</h2>
            <div class="compare-container">
                <div class="compare-side">
                    <h3 style="color:var(--neon-cyan)">${p1.name} (${p1.overall})</h3>
                    ${Object.entries(p1.stats).map(([stat, val]) => `<p>${stat.toUpperCase()}: <b>${val}</b></p>`).join('')}
                </div>
                <div class="compare-side">
                    <h3 style="color:var(--neon-pink)">${p2.name} (${p2.overall})</h3>
                    ${Object.entries(p2.stats).map(([stat, val]) => `<p>${stat.toUpperCase()}: <b>${val}</b></p>`).join('')}
                </div>
            </div>
        `;
    }

    // --- Audio & Theme Toggles ---
    const bgMusic = document.getElementById('bgMusic');
    document.getElementById('musicToggle').addEventListener('click', function() {
        if(bgMusic.paused) { bgMusic.play(); this.innerHTML = '<i class="fas fa-pause"></i>'; }
        else { bgMusic.pause(); this.innerHTML = '<i class="fas fa-music"></i>'; }
    });

    document.getElementById('themeToggle').addEventListener('click', function() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        this.innerHTML = newTheme === 'dark' ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
    });

    // --- Init ---
    renderCards(players);

    // --- PWA Service Worker Registration ---
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('sw.js').catch(err => console.log('SW Reg Failed:', err));
        });
    }
});
