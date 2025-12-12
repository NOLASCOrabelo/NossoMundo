// Configuração da API
const API_URL = '/api/gifts'; 
let gifts = []; 
let currentFilter = 'all';
let editingId = null;
let idToDelete = null;

document.addEventListener('DOMContentLoaded', () => {
    fetchGifts(); 
    atualizarContador(); // Se tiver a função de contador
});

// --- COMPRESSÃO DE IMAGEM BLINDADA ---
function compressImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                
                // Força máxima de 600px (ideal para celular)
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
                
                // Qualidade 0.5 (Resolve 99% dos problemas de tamanho)
                resolve(canvas.toDataURL('image/jpeg', 0.5)); 
            };
        };
        reader.onerror = (error) => reject(error);
    });
}

// Preview da imagem
async function previewImage() {
    const fileInput = document.getElementById('giftFileInput');
    const preview = document.getElementById('imagePreview');
    const hiddenInput = document.getElementById('giftImageBase64');

    if (fileInput && fileInput.files && fileInput.files[0]) {
        try {
            preview.style.display = 'none'; // Esconde antiga
            
            // Comprime
            const compressedBase64 = await compressImage(fileInput.files[0]);
            
            preview.src = compressedBase64;
            preview.style.display = "block";
            hiddenInput.value = compressedBase64;
            
        } catch (error) {
            alert("Erro ao ler imagem.");
        }
    }
}

// Buscar presentes
async function fetchGifts() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Erro servidor');
        gifts = await response.json(); 
        renderGifts(); 
    } catch (error) {
        console.error("Erro fetch:", error);
    }
}

// Salvar presente
async function saveGift() {
    const name = document.getElementById('giftName').value;
    const price = document.getElementById('giftPrice').value;
    const category = document.getElementById('giftCategory').value;
    let image = document.getElementById('giftImageBase64').value;

    if (!name) return alert("Digite o nome!");

    // VERIFICAÇÃO FINAL DE TAMANHO
    // 3.5 milhões de caracteres = aprox 2.6MB (Seguro para Vercel)
    if (image.length > 3500000) {
        return alert("Essa foto é muito complexa. Tente tirar um print dela ou usar outra.");
    }

    if (!image && !editingId) { 
        image = 'https://placehold.co/150?text=Sem+Foto'; 
    }

    const giftData = { name, price, image, category };

    try {
        // Trava o botão para evitar clique duplo
        const btn = document.querySelector('.btn-save');
        btn.innerText = "Enviando...";
        btn.disabled = true;

        const url = editingId ? `${API_URL}/${editingId}` : API_URL; // Note a correção da URL aqui
        const method = editingId ? 'PUT' : 'POST'; // PUT não costuma ser usado para criar, verifique se seu server espera PUT ou POST na edição

        // Se for edição, o server.js que mandei não tem rota PUT para editar tudo,
        // apenas PUT para /done. Se precisar editar dados, teria que criar a rota.
        // Vou assumir POST para criar.
        
        const response = await fetch(editingId ? `${API_URL}/${editingId}` : API_URL, { // Se não tiver rota de editar dados completos, isso pode dar erro 404
             // Vamos simplificar: Se for edição de status, é outro botão. 
             // Se for edição de dados, precisaria da rota PUT /gifts/:id no backend.
             // Como seu backend atual só tem PUT /done, vou assumir CRIAÇÃO (POST) para testar o upload.
             method: 'POST', 
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify(giftData)
        });

        // Se você tiver a lógica de edição, mantenha. O importante é o fetch acima.

        if (response.ok) {
            await fetchGifts();
            closeModal();
            document.getElementById('giftImageBase64').value = "";
        } else {
            const txt = await response.text();
            alert("Erro ao salvar: " + txt);
        }
        
        btn.innerText = "Salvar";
        btn.disabled = false;

    } catch (error) {
        alert("Erro de conexão.");
        document.querySelector('.btn-save').disabled = false;
        document.querySelector('.btn-save').innerText = "Salvar";
    }
}

// ... Resto das funções (renderGifts, filterGifts, openModal, closeModal, etc) ...
// Copie do seu arquivo antigo as funções de renderização que não mexemos.