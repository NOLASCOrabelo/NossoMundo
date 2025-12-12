const API_URL = '/api/gifts'; 
let gifts = []; 
let currentFilter = 'all';
let editingId = null;
let idToDelete = null;

// ======================================================
// 1. INICIALIZAÇÃO (Traz de volta o Observer)
// ======================================================
document.addEventListener('DOMContentLoaded', () => {
    fetchGifts(); 
    atualizarContador();
    
    // Configura input de preço para formatar R$
    const priceInput = document.getElementById('giftPrice');
    if (priceInput) {
        priceInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, "");
            if (value === "") { e.target.value = ""; return; }
            value = (parseInt(value) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            e.target.value = value;
        });
    }

    // --- AQUI ESTÁ A CORREÇÃO DAS ANIMAÇÕES ---
    // Faz os elementos aparecerem quando rola a tela
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('show');
            }
        });
    });

    const hiddenElements = document.querySelectorAll('.hidden');
    hiddenElements.forEach((el) => observer.observe(el));
});

// ======================================================
// 2. COMPRESSÃO DE IMAGEM (Mantida a que funcionou)
// ======================================================
function compressImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                // Mantém 600px e 50% qualidade (Leve para celular)
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

// ======================================================
// 3. FUNÇÕES DE API (GET e POST)
// ======================================================
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
    if (image.length > 4500000) return alert("Foto muito grande. Tente outra.");
    if (!image && !editingId) image = 'https://placehold.co/150?text=Sem+Foto'; 

    const giftData = { name, price, image, category };
    const btnSave = document.querySelector('.btn-save');

    try {
        btnSave.innerText = "Enviando...";
        btnSave.disabled = true;

        // Lógica para Criar (POST) ou Editar (PUT - se seu back suportasse, mas vamos manter simples)
        // Se for edição, idealmente você teria que implementar PUT no server.js para dados completos.
        // Assumindo criação para novas fotos:
        const response = await fetch(API_URL, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(giftData)
        });

        if (response.ok) {
            await fetchGifts();
            closeModal();
            // Limpa tudo
            document.getElementById('giftName').value = "";
            document.getElementById('giftPrice').value = "";
            document.getElementById('giftImageBase64').value = "";
            document.getElementById('giftFileInput').value = "";
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

// ======================================================
// 4. RENDERIZAÇÃO (Traz de volta o botão EDITAR)
// ======================================================
function renderGifts() {
    const container = document.getElementById('gift-container');
    if (!container) return;
    container.innerHTML = '';
    
    const filtered = gifts.filter(item => currentFilter === 'all' || item.category === currentFilter);
    // Ordena: Feitos por último
    filtered.sort((a, b) => a.done === b.done ? 0 : a.done ? 1 : -1);

    // Observer para animar os cards que entram na tela
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) entry.target.classList.add('show');
        });
    });

    filtered.forEach((item) => {
        const card = document.createElement('div');
        // Adiciona a classe 'hidden' para o observer pegar
        card.className = `gift-item hidden ${item.done ? 'done' : ''}`;
        
        const imgUrl = item.image || 'https://placehold.co/150?text=Sem+Foto';

        // AQUI ESTÁ O BOTÃO DE EDITAR DE VOLTA (btn-edit)
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
        observer.observe(card); // Anima o card
    });
}

function filterGifts(category) {
    currentFilter = category;
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        // Verifica se o onclick contem a categoria (mesmo com aspas simples)
        if(btn.getAttribute('onclick').includes(`'${category}'`)) btn.classList.add('active');
    });
    renderGifts();
}

// ======================================================
// 5. AÇÕES DOS ITENS (Editar, Excluir, Check)
// ======================================================

// Função de preencher o modal para editar (FALTAVA ISSO)
function editItem(id) {
    const item = gifts.find(g => g.id === id);
    if (!item) return;
    
    document.getElementById('modalTitle').innerText = "Editar (Recrie para salvar)";
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
        preview.style.display = "none";
        hiddenInput.value = "";
    }
    
    editingId = id; // Marca que estamos editando
    document.getElementById('giftModal').classList.add('open');
}

async function toggleDone(id) {
    await fetch(`${API_URL}/${id}/done`, { method: 'PUT' });
    fetchGifts();
}

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

// ======================================================
// 6. MODAIS E CONTADOR
// ======================================================
function openModal() { 
    editingId = null;
    document.getElementById('modalTitle').innerText = "Novo Desejo";
    // Limpa campos
    document.getElementById('giftName').value = "";
    document.getElementById('giftPrice').value = "";
    document.getElementById('giftImageBase64').value = "";
    document.getElementById('giftFileInput').value = "";
    document.getElementById('imagePreview').style.display = "none";
    
    document.getElementById('giftModal').classList.add('open'); 
}

function closeModal() { 
    document.getElementById('giftModal').classList.remove('open'); 
}

// Contador de Dias
function atualizarContador() {
    // DATA DO INÍCIO DO NAMORO: 13 de Setembro de 2025
    // Meses no JS começam em 0 (Janeiro=0, Setembro=8)
    const dataInicio = new Date(2025, 8, 13); 
    const dataAtual = new Date();
    
    let anos = dataAtual.getFullYear() - dataInicio.getFullYear();
    let meses = dataAtual.getMonth() - dataInicio.getMonth();
    let dias = dataAtual.getDate() - dataInicio.getDate();
    
    // Ajuste matemático de datas
    if (dias < 0) { 
        meses--; 
        // Pega quantos dias tem o mês anterior para somar
        const ultimoDiaMesAnterior = new Date(dataAtual.getFullYear(), dataAtual.getMonth(), 0).getDate();
        dias += ultimoDiaMesAnterior; 
    }
    if (meses < 0) { 
        anos--; 
        meses += 12; 
    }
    
    const totalMeses = (anos * 12) + meses;

    // Atualiza na tela
    const elMeses = document.getElementById('months-count');
    const elDias = document.getElementById('days-count');
    const elTexto = document.getElementById('texto-total-dias');

    if(elMeses) elMeses.innerText = totalMeses;
    if(elDias) elDias.innerText = dias;
    if(elTexto) elTexto.textContent = `${totalMeses} meses e ${dias} dias juntos`;
}