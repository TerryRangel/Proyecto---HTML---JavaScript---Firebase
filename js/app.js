import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc,updateDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyA2Wz_A6mJTAAw9skqZTOAuyf_bGECdEqc",
    authDomain: "proyecto-tlgd.firebaseapp.com",
    projectId: "proyecto-tlgd",
    storageBucket: "proyecto-tlgd.firebasestorage.app",
    messagingSenderId: "497618192234",
    appId: "1:497618192234:web:8c74278688440a152b4713",
    measurementId: "G-THRQDRV1G4"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
let editingProductId = null;


// Mostrar alerta visual con Bootstrap
function showAlert(message, type = "success") {
    const alertContainer = document.getElementById("alert-container");
    const alertElement = document.createElement("div");

    alertElement.className = `alert alert-${type} alert-dismissible fade show`;
    alertElement.role = "alert";
    alertElement.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

    alertContainer.appendChild(alertElement);

    setTimeout(() => {
        const bsAlert = bootstrap.Alert.getOrCreateInstance(alertElement);
        bsAlert.close();
    }, 3000);
}

// Verificar si el ID ya existe
async function isProductIdUsed(productId) {
    const querySnapshot = await getDocs(collection(db, "products"));
    for (const docSnap of querySnapshot.docs) {
        const data = docSnap.data();
        if (data.id === productId) {
            return true;
        }
    }
    return false;
}

// Añadir producto
async function addProduct(product) {
    try {
        await addDoc(collection(db, "products"), product);
        showAlert("Producto agregado con éxito", "success");
        fetchProducts();
    } catch (e) {
        console.error("Error al agregar producto: ", e);
        showAlert("Error al agregar producto", "danger");
    }
}

// Obtener productos y calcular el total de productos y dinero total
async function fetchProducts() {
    const querySnapshot = await getDocs(collection(db, "products"));
    const tbody = document.querySelector("tbody");
    const totalProductsContainer = document.querySelector(".productostotales");
    const totalCategoriasContainer = document.querySelector(".categoria");
    const outOfStockContainer = document.querySelector(".outstock"); 
    const lowstockContainer = document.querySelector(".lowstock"); 

    let totalQuantity = 0;
    let totalPrice = 0;
    let totalCategories = new Set();
    let outOfStockCount = 0; 
    let lowStockCount = 0;

    tbody.innerHTML = "";

    if (querySnapshot.empty) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-danger fw-bold">Out of Stock</td>
            </tr>
        `;
        totalProductsContainer.innerHTML = `
            <h5>Total Products: 0</h5>
            <h5>Total Money: $0.00</h5>
        `;
        totalCategoriasContainer.innerHTML = `
            <h5>Categories</h5><br>
            <h5>0</h5>
        `;
        outOfStockContainer.innerHTML = `
            <h5>Out of Stock</h5><br>
            <h5>0</h5>
        `;
        lowstockContainer.innerHTML = `
            <h5>Low Stock</h5><br>
            <h5>0</h5>
        `;



        return;
    }

    querySnapshot.forEach((documento) => {
        const data = documento.data();
        const productId = documento.id;

        // Acumular categorías únicas
        if (data.category) {
            totalCategories.add(data.category);
        }

        let status, statusClass;
        if (data.quantity === 0) {
            status = "Out of Stock";
            statusClass = "text-danger fw-bold";
            outOfStockCount++; 
        } else if (data.quantity > data.threshold) {
            status = "In-Stock";
            statusClass = "text-success fw-bold";
        } else {
            status = "Low Stock";
            statusClass = "text-warning fw-bold";
            lowStockCount++; 
        }

        const row = `
            <tr style="
  
  overflow-y: auto;
  "
  data-id="${productId}">
                <td>${data.name}</td>
                <td>$${data.price}</td>
                <td>${data.quantity} Packets</td>
                <td>${data.threshold} Packets</td>
                <td>${data.expiryDate}</td>
                <td class="${statusClass}">${status}</td>
                <td>
                    <button class="btn btn-outline-dark btn-sm delete-btn">❌</button> 
                    <button class="btn btn-outline-dark btn-sm edit-btn">✏️</button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;

        totalQuantity += data.quantity;
        totalPrice += data.quantity * data.price;
    });

    totalProductsContainer.innerHTML = `
        <h5>Total Products</h5>

        <h5 style="color:black" >
  <span>${totalQuantity}</span>
  <span style="margin-left: 55px;">$${totalPrice.toFixed(2)}</span>
</h5>

    `;

    totalCategoriasContainer.innerHTML = `
        <h5>Categories</h5><br>
        <h5 style="color:black">${totalCategories.size}</h5>
    `;

    outOfStockContainer.innerHTML = `
        <h5>Out of Stock</h5>
        <h5 style="color:black">${outOfStockCount}</h5>
    `;
    lowstockContainer.innerHTML = `
        <h5>Low Stock</h5>
        <h5 style="color:black">${lowStockCount}</h5>
    `;

    document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", async function () {
            const row = this.closest("tr");
            const productId = row.getAttribute("data-id");
            if (confirm("¿Estás seguro de que deseas eliminar este producto?")) {
                await deleteProduct(productId);
            }
        });
    });
    // Al final de fetchProducts(), después de los delete-btn...
// Dentro del event listener del botón ".edit-btn" en fetchProducts()
document.querySelectorAll(".edit-btn").forEach((button) => {
    button.addEventListener("click", async function () {
      const row = this.closest("tr");
      const productId = row.getAttribute("data-id");
  
      // Obtén el dato concreto
      const querySnapshot = await getDocs(collection(db, "products"));
      const docSnap = querySnapshot.docs.find(doc => doc.id === productId);
      const productData = docSnap?.data();
  
      if (!productData) {
        showAlert("No se pudo cargar la información del producto", "danger");
        return;
      }
  
      // Oculta la lista y muestra el detalle
      document.getElementById("product-list-view").style.display = "none";
      const detailView = document.getElementById("product-detail-view");
      detailView.style.display = "block";
  
      // Rellena el detalle
      detailView.innerHTML = `
     <div class="card p-4">
       <!-- Cabecera: nombre y botones -->
       <div class="d-flex justify-content-between mb-3 align-items-center">
         <h3>${productData.name}</h3>
         <div class="d-flex">
           <!-- Botón Editar con id "Edit" -->
           <button id="Edit" 
             onmouseover="this.style.backgroundColor='#000'; this.style.color='#fff';"
             onmouseout="this.style.backgroundColor=''; this.style.color='';"
             class="btn btn-secondary me-2"
             style="color: rgb(78, 77, 77) !important;
                    background-color: rgb(255, 255, 255) !important;
                    font-weight: bold;
                    width: 150px;">
             ✏️ Edit
           </button>
           <!-- Botón Descargar -->
           <button 
             class="btn btn-secondary"
             id="download"
             style="color: rgb(78, 77, 77) !important;
                    background-color: rgb(255, 255, 255) !important;
                    font-weight: bold;
                    width: 150px;">
             Download
           </button>
         </div>
       </div>
  
       <!-- Línea y subtítulo -->
       <div class="w-70 mb-4" style="border-bottom: 2px solid rgb(78, 77, 77);">
         <h5>Overview</h5>
       </div>
  
       <!-- Contenido: detalles + imagen -->
       <div class="d-flex justify-content-between align-items-start">
         <!-- Detalles del producto -->
         <div>
           <p><strong>PRIMARY DETAILS:</strong></p>
           <br>
           <p><strong style="display:inline-block; width:300px;">Product Name</strong> ${productData.name}</p>
           <p><strong style="display:inline-block; width:300px;">Product ID</strong> ${productData.id}</p>
           <p><strong style="display:inline-block; width:300px;">Product Category:</strong> ${productData.category}</p>
           <p><strong style="display:inline-block; width:300px;">Price</strong> $${productData.price}</p>
           <p><strong style="display:inline-block; width:300px;">Quantity</strong> ${productData.quantity}</p>
           <p><strong style="display:inline-block; width:300px;">Unit</strong> ${productData.unit}</p>
           <p><strong style="display:inline-block; width:300px;">Threshold Value</strong> ${productData.threshold}</p>
           <p><strong style="display:inline-block; width:300px;">Expiry Day:</strong> ${productData.expiryDate}</p>
         </div>
  
         <!-- Imagen del producto -->
         <div>
           <img 
             src="${productData.imageUrl || 'image.png'}"
             alt="${productData.name}"
              style="
    width: 500px;
    height: auto;
    border: 2px solid #ccc;
    border-radius: 40px;
    box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.5);
    position: relative;
    top: 50px;
    right: 50%;
">
         </div>
       </div>
  
       <!-- Botón volver -->
       <br><br><br><br><br><br>
       <button  onmouseover="this.style.backgroundColor='#000'; this.style.color='#fff';"
             onmouseout="this.style.backgroundColor=''; this.style.color='';" style="color: rgb(78, 77, 77) !important;
                    background-color: rgb(255, 255, 255) !important;
                    font-weight: bold;
                    width: 150px;"  class="btn btn-secondary mt-4" id="backToList">⬅️</button>
     </div>
      `;

     
  
      // Listener para el botón de volver
      document.getElementById("backToList").addEventListener("click", () => {
        detailView.innerHTML = "";
        detailView.style.display = "none";
        document.getElementById("product-list-view").style.display = "block";
        fetchProducts();
      });
  
      // ---- NUEVO: Listener para el botón con id "Edit" dentro del detalle ----
      document.getElementById("Edit").addEventListener("click", () => {
        // Configurar el modal en modo "Editar" usando productData ya obtenido
        editingProductId = productId;
        document.getElementById("addProductModalLabel").innerText = "Edit Product";
        document.querySelector("#addProductModal .btn-primary").innerText = "Save Changes";
  
        // Pre-cargar los campos del formulario
        document.getElementById("productName").value = productData.name;
        document.getElementById("productID").value = productData.id;
        document.getElementById("category").value = productData.category;
        document.getElementById("buyingPrice").value = productData.price;
        document.getElementById("quantity").value = productData.quantity;
        document.getElementById("unit").value = productData.unit;
        document.getElementById("threshold").value = productData.threshold;
        document.getElementById("expiryDate").value = productData.expiryDate;
  
        if (productData.imageUrl) {
          document.getElementById("productImageUrl").value = productData.imageUrl;
          updateImagePreview();
        } else {
          document.getElementById("productImageUrl").value = "";
          document.getElementById("imagePreview").style.display = "none";
        }
  
        // Mostrar el modal de edición
        const addProductModalEl = document.getElementById("addProductModal");
        const modalInstance = new bootstrap.Modal(addProductModalEl);
        modalInstance.show();
      });
      // ---- FIN NUEVO ----
    });
});




  
}


// Eliminar producto
async function deleteProduct(productId) {
    try {
        await deleteDoc(doc(db, "products", productId));
        showAlert("Producto eliminado con éxito", "danger");
        fetchProducts();
    } catch (error) {
        console.error("Error al eliminar producto:", error);
        showAlert("Error al eliminar producto", "danger");
    }
}

// Añadir producto desde formulario modal (con verificación de ID)
// Listener para el botón del modal (se distingue entre agregar y editar)
document.querySelector("#addProductModal .btn-primary").addEventListener("click", async () => {
    // Recolectar datos del formulario
    const product = {
        name: document.getElementById("productName").value,
        id: document.getElementById("productID").value,
        category: document.getElementById("category").value,
        price: parseFloat(document.getElementById("buyingPrice").value),
        quantity: parseInt(document.getElementById("quantity").value),
        unit: document.getElementById("unit").value,
        expiryDate: document.getElementById("expiryDate").value,
        threshold: parseInt(document.getElementById("threshold").value),
        imageUrl: document.getElementById("productImageUrl").value
    };

    // Si estamos en modo edición, actualizamos el producto; de lo contrario, lo agregamos
    if (editingProductId) {
        await updateProduct(editingProductId, product);
    } else {
        const isUsed = await isProductIdUsed(product.id);
        if (isUsed) {
            showAlert("El ID del producto ya está en uso. Introduce uno diferente.", "warning");
            return;
        }
        await addProduct(product);
    }

    // Cerrar el modal
    const modalElement = document.getElementById("addProductModal");
    const modalInstance = bootstrap.Modal.getInstance(modalElement);
    if (modalInstance) {
        modalInstance.hide();
    }
});


// Actualizar vista previa de imagen
function updateImagePreview() {
    const imageUrl = document.getElementById("productImageUrl").value;
    const imagePreview = document.getElementById("imagePreview");

    if (imageUrl) {
        imagePreview.src = imageUrl;
        imagePreview.style.display = "block";
    } else {
        imagePreview.style.display = "none";
    }
}

// Filtrar productos por nombre
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.querySelector('.search-box');
    const tableBody = document.querySelector('tbody');
  
    // Escuchar cada vez que se escribe algo
    searchInput.addEventListener('input', () => {
      const searchValue = searchInput.value.toLowerCase();
      const rows = tableBody.querySelectorAll('tr');
  
      rows.forEach(row => {
        const productNameCell = row.querySelector('td');
        if (productNameCell) {
          const productName = productNameCell.textContent.toLowerCase();
          const match = productName.includes(searchValue);
  
          // Mostrar solo si hay coincidencia
          row.style.display = match ? '' : 'none';
        }
      });
    });
});

// Accesibilidad del modal
document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById("addProductModal");

    modal.addEventListener("shown.bs.modal", () => {
        modal.removeAttribute("aria-hidden");
        modal.removeAttribute("inert");
    });

    modal.addEventListener("hidden.bs.modal", () => {
        modal.setAttribute("aria-hidden", "true");
        modal.setAttribute("inert", "");
    });

    document.getElementById("productImageUrl").addEventListener("input", updateImagePreview);
});


// Función para actualizar producto
async function updateProduct(productId, updatedData) {
    try {
        const productRef = doc(db, "products", productId);
        await updateDoc(productRef, updatedData);
        showAlert("Producto actualizado con éxito", "success");
        // Reseteamos el modo edición y el formulario del modal
        editingProductId = null;
        resetModalToAdd();
        fetchProducts();
        window.location.reload();
    } catch (error) {
        console.error("Error al actualizar producto: ", error);
        showAlert("Error al actualizar producto", "danger");
    }
}

// Función para resetear el modal a modo "Agregar Producto"
function resetModalToAdd() {
    document.getElementById("addProductModalLabel").innerText = "New Product";
    document.querySelector("#addProductModal .btn-primary").innerText = "Add Product";
    document.querySelector("#addProductModal form").reset();
    document.getElementById("imagePreview").style.display = "none";
}





// Cargar productos al inicio
fetchProducts();
