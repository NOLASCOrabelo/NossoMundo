const API_URL = '/api/gifts'; 
let gifts = []; 
let currentFilter = 'all';
let editingId = null;

document.addEventListener('DOMContentLoaded', () => {
    fetchGifts(); 
    atualizarContador();
    
    // Configura input de preço
    const priceInput = document.getElementById('giftPrice');
    if (priceInput) {
        priceInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, "");
            if (value === "") { e.target.value = ""; return; }
            value = (parseInt(value) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            e.target.value = value;
        });
    }
});

// --- COMPRESSÃO DE IMAGEM ---
function compressImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const maxWidth = 600; 
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height *= maxWidth / width;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.5)); 
            };
        };
        reader.onerror = (error) => reject(error);
    });
}

async function previewImage() {
    const fileInput = document.getElementById('giftFileInput');
    const preview = document.getElementById('imagePreview');
    const hiddenInput = document.getElementById('giftImageBase64');

    if (fileInput && fileInput.files && fileInput.files[0]) {
        try {
            const compressedBase64 = await compressImage(fileInput.files[0]);
            preview.src = compressedBase64;
            preview.style.display = "block";
            hiddenInput.value = compressedBase64; 
        } catch (error) {
            alert("Erro na imagem.");
        }
    }
}

// --- FUNÇÕES DE API ---
async function fetchGifts() {
    try {
        const response = await fetch(API_URL);
        if (response.ok) {
            gifts = await response.json(); 
            renderGifts();
        }
    } catch (error) {
        console.error("Erro API:", error);
    }
}

async function saveGift() {
    const name = document.getElementById('giftName').value;
    const price = document.getElementById('giftPrice').value;
    const category = document.getElementById('giftCategory').value;
    let image = document.getElementById('giftImageBase64').value;

    if (!name) return alert("Digite o nome!");
    if (image.length > 4000000) return alert("Foto muito grande. Tente outra.");
    if (!image && !editingId) image = 'https://placehold.co/150?text=Sem+Foto'; 

    const giftData = { name, price, image, category };
    const btnSave = document.querySelector('.btn-save');

    try {
        btnSave.innerText = "Enviando...";
        btnSave.disabled = true;
        
        // POST para criar
        const response = await fetch(API_URL, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(giftData)
        });

        if (response.ok) {
            await fetchGifts();
            closeModal();
            document.getElementById('giftImageBase64').value = "";
            document.getElementById('giftFileInput').value = "";
            document.getElementById('imagePreview').src = "";
            document.getElementById('imagePreview').style.display = "none";
        } else {
            alert("Erro ao salvar.");
        }
    } catch (error) {
        alert("Erro de conexão.");
    } finally {
        btnSave.innerText = "Salvar";
        btnSave.disabled = false;
    }
}

// --- FUNÇÕES DE TELA (QUE FALTAVAM) ---
function renderGifts() {
    const container = document.getElementById('gift-container');
    if (!container) return;
    container.innerHTML = '';
    
    // Filtra e Ordena
    const filtered = gifts.filter(item => currentFilter === 'all' || item.category === currentFilter);
    filtered.sort((a, b) => a.done === b.done ? 0 : a.done ? 1 : -1);

    filtered.forEach((item) => {
        const card = document.createElement('div');
        card.className = `gift-item ${item.done ? 'done' : ''}`;
        const imgUrl = item.image || 'https://placehold.co/150?text=Sem+Foto';

        card.innerHTML = `
            <img src="${imgUrl}" alt="${item.name}">
            <div class="gift-info">
                <h4>${item.name}</h4>
                <span class="price">${item.price}</span>
                <div class="card-actions">
                    <button class="btn-icon btn-check" onclick="toggleDone(${item.id})"><i class="fa-solid fa-check"></i></button>
                    <button class="btn-icon btn-delete" onclick="openDeleteModal(${item.id})"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

function filterGifts(category) {
    currentFilter = category;
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if(btn.getAttribute('onclick').includes(`'${category}'`)) btn.classList.add('active');
    });
    renderGifts();
}

async function toggleDone(id) {
    await fetch(`${API_URL}/${id}/done`, { method: 'PUT' });
    fetchGifts();
}

let idToDelete = null;
function openDeleteModal(id) {
    idToDelete = id;
    document.getElementById('deleteModal').classList.add('open');
}
function closeDeleteModal() {
    idToDelete = null;
    document.getElementById('deleteModal').classList.remove('open');
}
async function confirmDelete() {
    if (idToDelete) {
        await fetch(`${API_URL}/${idToDelete}`, { method: 'DELETE' });
        fetchGifts();
        closeDeleteModal();
    }
}

// Modais
function openModal() { document.getElementById('giftModal').classList.add('open'); }
function closeModal() { document.getElementById('giftModal').classList.remove('open'); }

// Contador de Dias
function atualizarContador() {
    const dataInicio = new Date(2025, 8, 13); // Mês 8 é Setembro (0-indexado)
    const dataAtual = new Date();
    
    let anos = dataAtual.getFullYear() - dataInicio.getFullYear();
    let meses = dataAtual.getMonth() - dataInicio.getMonth();
    let dias = dataAtual.getDate() - dataInicio.getDate();
    
    if (dias < 0) { meses--; dias += 30; }
    if (meses < 0) { anos--; meses += 12; }
    const totalMeses = (anos * 12) + meses;

    const elMeses = document.getElementById('months-count');
    const elDias = document.getElementById('days-count');
    const elTexto = document.getElementById('texto-total-dias');

    if(elMeses) elMeses.innerText = totalMeses;
    if(elDias) elDias.innerText = dias;
    if(elTexto) elTexto.textContent = `${totalMeses} meses e ${dias} dias juntos`;
}