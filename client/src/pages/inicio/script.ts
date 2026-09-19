interface Product {
    id: number;
    category: string;
    name: string;
    description: string;
    price: number;
    imageUrl: string; 
}

const products: Product[] = [
    {
        id: 1,
        category: "ANILLO SOLITARIO",
        name: "Éclat de la Rose",
        description: "1.2 ct - Oro blanco 18k",
        price: 48200,
        imageUrl: "https://images.unsplash.com/photo-1605100804763-247f67b4549e?auto=format&fit=crop&q=80&w=600" 
    },
    {
        id: 2,
        category: "COLGANTE",
        name: "Larme Dorée",
        description: "Pera 0.8 ct - Oro amarillo",
        price: 32900,
        imageUrl: "https://images.unsplash.com/photo-1599643477874-c5a5c11f24fc?auto=format&fit=crop&q=80&w=600"
    },
    {
        id: 3,
        category: "PENDIENTES",
        name: "Aurore Éternelle",
        description: "Halo 0.5 ct c/u - Oro amarillo",
        price: 21400,
        imageUrl: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=600"
    }
];

const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 0
    }).format(amount);
};

const renderProducts = (productsToRender: Product[]) => {
    const gridContainer = document.getElementById('product-grid');
    if (!gridContainer) return;

    gridContainer.innerHTML = ''; 

    productsToRender.forEach(product => {
        const card = document.createElement('div');
        card.className = 'card';

        card.innerHTML = `
            <img src="${product.imageUrl}" alt="${product.name}" class="card-image">
            <div class="product-category">${product.category}</div>
            <h3 class="product-title">${product.name}</h3>
            <div class="product-desc">${product.description}</div>
            <div class="card-footer">
                <span class="price">${formatCurrency(product.price)}</span>
                <button class="btn-add">AGREGAR</button>
            </div>
        `;

        gridContainer.appendChild(card);
    });
};

document.addEventListener('DOMContentLoaded', () => {
    renderProducts(products);
});