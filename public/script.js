// ======================================================
// 1. CONFIGURAÇÕES E VARIÁVEIS GLOBAIS
// ======================================================
// Antes era: const API_URL = 'http://localhost:5000/gifts';

// Agora use caminho relativo ou a URL de produção:
// Como configuramos o "rewrites" no vercel.json, podemos chamar direto /gifts
const API_URL = 'api/gifts';

let gifts = []; 
let currentFilter = 'all';
let editingId = null;
let idToDelete = null;

// ======================================================
// 2. INICIALIZAÇÃO
// ======================================================
document.addEventListener('DOMContentLoaded', () => {
    fetchGifts(); 
    atualizarContador();
    
    const priceInput = document.getElementById('giftPrice');
    if (priceInput) {
        priceInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, "");
            if (value === "") { e.target.value = ""; return; }
            value = (parseInt(value) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            e.target.value = value;
        });
    }

    const hiddenElements = document.querySelectorAll('.hidden');
    hiddenElements.forEach((el) => observer.observe(el));
});

// ======================================================
// 3. COMUNICAÇÃO COM A API (BACK-END)
// ======================================================

// BUSCAR (GET)
async function fetchGifts() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Erro ao conectar com o servidor');
        gifts = await response.json(); 
        renderGifts(); 
    } catch (error) {
        console.error("Erro ao buscar presentes:", error);
    }
}

// SALVAR OU EDITAR (POST / PUT)
async function saveGift() {
    const name = document.getElementById('giftName').value;
    const price = document.getElementById('giftPrice').value;
    const category = document.getElementById('giftCategory').value;
    let image = document.getElementById('giftImageBase64').value;

    if (!name) return alert("Digite o nome do presente!");

    if (!image && !editingId) { 
        image = 'https://placehold.co/150?text=Sem+Foto'; 
    }

    const giftData = { name, price, image, category };

    try {
        if (editingId) {
            // --- MODO EDIÇÃO (PUT) ---
            await fetch(`${API_URL}/${editingId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(giftData)
            });
        } else {
            // --- MODO CRIAÇÃO (POST) ---
            await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(giftData)
            });
        }
        
        await fetchGifts(); // Recarrega lista atualizada do banco
        closeModal();

    } catch (error) {
        console.error("Erro ao salvar:", error);
        alert("Erro ao salvar. Verifique se o servidor está rodando.");
    }
}

// DELETAR (DELETE)
async function confirmDelete() {
    if (idToDelete) {
        try {
            await fetch(`${API_URL}/${idToDelete}`, {
                method: 'DELETE'
            });
            await fetchGifts(); 
            closeDeleteModal();
        } catch (error) {
            console.error("Erro ao deletar:", error);
            alert("Erro ao tentar deletar.");
        }
    }
}

// MARCAR COMO FEITO (PUT)
async function toggleDone(id) {
    try {
        await fetch(`${API_URL}/${id}/done`, {
            method: 'PUT'
        });
        await fetchGifts(); 
    } catch (error) {
        console.error("Erro ao atualizar status:", error);
    }
}

// ======================================================
// 4. RENDERIZAÇÃO NA TELA
// ======================================================
const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.classList.add('show');
        }
    });
});

function renderGifts() {
    const container = document.getElementById('gift-container');
    if (!container) return;
    
    container.innerHTML = '';
    const filtered = gifts.filter(item => currentFilter === 'all' || item.category === currentFilter);

    filtered.sort((a, b) => a.done === b.done ? 0 : a.done ? 1 : -1);

    filtered.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = `gift-item hidden ${item.done ? 'done' : ''}`;
        card.style.transitionDelay = `${index * 0.1}s`;
        
        const imgUrl = item.image || 'https://placehold.co/150?text=Sem+Foto';

        card.innerHTML = `
            <img src="${imgUrl}" alt="${item.name}">
            <div class="gift-info">
                <h4>${item.name}</h4>
                <span class="price">${item.price}</span>
                <div class="card-actions">
                    <button class="btn-icon btn-check" onclick="toggleDone(${item.id})"><i class="fa-solid fa-check"></i></button>
                    <button class="btn-icon btn-edit" onclick="editItem(${item.id})"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn-icon btn-delete" onclick="openDeleteModal(${item.id})"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>
        `;
        container.appendChild(card);
        observer.observe(card); 
    });
}

function filterGifts(category) {
    currentFilter = category;
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if(btn.getAttribute('onclick') && btn.getAttribute('onclick').includes(`'${category}'`)) {
            btn.classList.add('active');
        }
    });
    renderGifts();
}

// ======================================================
// 5. MODAIS E UTILITÁRIOS
// ======================================================
function openModal() {
    const modal = document.getElementById('giftModal');
    if (modal) {
        document.getElementById('modalTitle').innerText = "Novo Desejo";
        
        document.getElementById('giftName').value = '';
        document.getElementById('giftPrice').value = '';
        document.getElementById('giftCategory').value = 'casa';
        document.getElementById('giftFileInput').value = '';
        document.getElementById('giftImageBase64').value = ''; 
        
        const preview = document.getElementById('imagePreview');
        if(preview) { preview.src = ''; preview.style.display = 'none'; }
        
        editingId = null;
        modal.classList.add('open');
    }
}

function editItem(id) {
    const item = gifts.find(g => g.id === id);
    if (!item) return;
    
    document.getElementById('modalTitle').innerText = "Editar Desejo";
    document.getElementById('giftName').value = item.name;
    document.getElementById('giftPrice').value = item.price;
    document.getElementById('giftCategory').value = item.category;
    
    const preview = document.getElementById('imagePreview');
    const hiddenInput = document.getElementById('giftImageBase64');
    
    if (item.image) {
        preview.src = item.image; 
        preview.style.display = "block";
        hiddenInput.value = item.image; 
    } else {
        preview.src = ""; 
        preview.style.display = "none";
        hiddenInput.value = "";
    }
    
    document.getElementById('giftFileInput').value = ''; 
    editingId = id;
    document.getElementById('giftModal').classList.add('open');
}

function closeModal() {
    const modal = document.getElementById('giftModal');
    if (modal) modal.classList.remove('open');
}

function openDeleteModal(id) {
    idToDelete = id;
    document.getElementById('deleteModal').classList.add('open');
}

function closeDeleteModal() {
    idToDelete = null;
    document.getElementById('deleteModal').classList.remove('open');
}

// 1. Função utilitária para comprimir imagem
function compressImage(file, maxWidth, quality) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Redimensiona mantendo a proporção se for muito grande
                if (width > maxWidth) {
                    height *= maxWidth / width;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // Converte para Base64 comprimido (JPEG com qualidade reduzida)
                // quality vai de 0 a 1 (0.7 é um bom balanço)
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
}

// 2. Nova função de Preview (agora assíncrona)
async function previewImage() {
    const fileInput = document.getElementById('giftFileInput');
    const preview = document.getElementById('imagePreview');
    const hiddenInput = document.getElementById('giftImageBase64');

    if (fileInput && fileInput.files && fileInput.files[0]) {
        try {
            // Comprime a imagem para no máx 800px de largura e qualidade 0.7
            const compressedBase64 = await compressImage(fileInput.files[0], 800, 0.7);
            
            preview.src = compressedBase64;
            preview.style.display = "block";
            hiddenInput.value = compressedBase64; // Salva a versão LEVE
        } catch (error) {
            console.error("Erro ao processar imagem:", error);
            alert("Erro ao carregar a imagem. Tente outra.");
        }
    }
}

// ======================================================
// 6. CONTADOR DE DIAS
// ======================================================
function atualizarContador() {
    const dataInicio = new Date(2025, 8, 13); 
    const dataAtual = new Date();
    const diff = Math.floor((dataAtual - dataInicio) / (1000 * 60 * 60 * 24));
    
    if(document.getElementById('texto-total-dias')) 
        document.getElementById('texto-total-dias').textContent = (dataAtual >= dataInicio) ? `${diff} Dias Juntos` : "Em Breve...";
    
    let anos = dataAtual.getFullYear() - dataInicio.getFullYear();
    let meses = dataAtual.getMonth() - dataInicio.getMonth();
    let dias = dataAtual.getDate() - dataInicio.getDate();
    if (dias < 0) { meses--; dias += 30; }
    if (meses < 0) { anos--; meses += 12; }
    const totalMeses = (anos * 12) + meses;
    
    if(document.getElementById('months-count')) document.getElementById('months-count').innerText = (dataAtual >= dataInicio) ? totalMeses : "0";
    if(document.getElementById('days-count')) document.getElementById('days-count').innerText = (dataAtual >= dataInicio) ? dias : "0";
}

// Fechar ao clicar fora
window.onclick = function (event) {
    const modalAdd = document.getElementById('giftModal');
    const modalDel = document.getElementById('deleteModal');
    if (event.target === modalAdd) closeModal();
    if (event.target === modalDel) closeDeleteModal();
}