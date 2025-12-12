const API_URL = '/api/gifts'; 
let gifts = []; 
let currentFilter = 'all';
let editingId = null;
let idToDelete = null;

document.addEventListener('DOMContentLoaded', () => {
    fetchGifts(); 
    // Tenta rodar o contador se ele existir no HTML
    if (typeof actualizarContador === "function") atualizarContador();
    if (typeof atualizarContador === "function") atualizarContador();
    
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
});

// === NOVA COMPRESSÃO INTELIGENTE ===
function compressImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                
                // Força largura máxima de 600px (Otimo para celular)
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
                
                // Usa qualidade 0.5 (50%) para garantir que fique leve (< 150KB)
                resolve(canvas.toDataURL('image/jpeg', 0.5)); 
            };
        };
        reader.onerror = (error) => reject(error);
    });
}

// Preview da imagem ao selecionar
async function previewImage() {
    const fileInput = document.getElementById('giftFileInput');
    const preview = document.getElementById('imagePreview');
    const hiddenInput = document.getElementById('giftImageBase64');

    if (fileInput && fileInput.files && fileInput.files[0]) {
        try {
            // Processa a imagem
            const compressedBase64 = await compressImage(fileInput.files[0]);
            
            preview.src = compressedBase64;
            preview.style.display = "block";
            hiddenInput.value = compressedBase64; 
        } catch (error) {
            console.error("Erro imagem:", error);
            alert("Não foi possível carregar esta imagem.");
        }
    }
}

// Funções de API
async function fetchGifts() {
    try {
        const response = await fetch(API_URL);
        if (response.ok) {
            gifts = await response.json(); 
            renderGifts();
        }
    } catch (error) {
        console.error("Erro ao buscar presentes:", error);
    }
}

async function saveGift() {
    const name = document.getElementById('giftName').value;
    const price = document.getElementById('giftPrice').value;
    const category = document.getElementById('giftCategory').value;
    let image = document.getElementById('giftImageBase64').value; // Pega a versão comprimida

    if (!name) return alert("Digite o nome do presente!");

    // Imagem padrão se não tiver nenhuma
    if (!image && !editingId) { 
        image = 'https://placehold.co/150?text=Sem+Foto'; 
    }

    const giftData = { name, price, image, category };
    const btnSave = document.querySelector('.btn-save');

    try {
        btnSave.innerText = "Salvando...";
        btnSave.disabled = true;

        const url = editingId ? `${API_URL}/${editingId}` : API_URL; // Ajuste se tiver rota de edição
        
        // Como sua rota atual é só POST para criar, vamos focar nela
        // Se for edição de dados (nome/preço), seu backend precisaria de rota PUT /gifts/:id
        // Vou usar POST para criação que é o foco do erro da imagem
        
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
        } else {
            alert("Erro ao salvar. Tente uma imagem diferente.");
        }
    } catch (error) {
        alert("Erro de conexão.");
    } finally {
        btnSave.innerText = "Salvar";
        btnSave.disabled = false;
    }
}

// ... (Mantenha aqui as funções renderGifts, filterGifts, openModal, closeModal, toggleDone, confirmDelete) ...
// Copie elas do seu arquivo anterior ou peça se precisar delas novamente.
// IMPORTANTE: Adicione a lógica de IntersectionObserver e o renderGifts aqui.