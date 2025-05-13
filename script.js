let carrito = [];
let paginaActual = 1;
let productosPorPagina = 30;
let todosLosProductos = [];
let productosFiltrados = [];

fetch('productos.json')
  .then(response => response.json())
  .then(data => {
    const productos = data.map(p => ({
      ...p,
      precio: parseFloat(p.precio),
      stock: p.cantidad,
      imagen: `imagenes/${p.nombre
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "")}.jpg`
    }));
    todosLosProductos = productos;
    mostrarProductosPaginados();
  })
  .catch(error => {
    console.error("Error al cargar productos:", error);
  });


function aplicarFiltroBusqueda() {
  const busqueda = document.getElementById("busqueda").value.toLowerCase();

  productosFiltrados = todosLosProductos.filter(p =>
    p.nombre.toLowerCase().includes(busqueda)
  );

  paginaActual = 1;
  mostrarProductosPaginados();
}

function mostrarProductosPaginados() {
  const inicio = (paginaActual - 1) * productosPorPagina;
  const fin = inicio + productosPorPagina;
  const productosPagina = productosFiltrados.slice(inicio, fin);
  mostrarProductos(productosPagina);
  mostrarControlesPaginacion();
}

function mostrarProductos(productos) {
  const cont = document.getElementById('productos-container');
  cont.innerHTML = "";

  if (productos.length === 0) {
    cont.innerHTML = "<p>No se encontraron productos.</p>";
    return;
  }

  productos.forEach(p => {
    const div = document.createElement('div');
    div.className = "producto";
    div.innerHTML = `
      <img src="${p.imagen}" alt="${p.nombre}">
      <h3>${p.nombre}</h3>
      <p><strong>$${p.precio.toFixed(2)}</strong></p>
      <p class="${p.stock > 0 ? '' : 'agotado'}">${p.stock > 0 ? 'En stock' : 'Agotado'}</p>
      <button ${p.stock === 0 ? 'disabled' : ''} data-id="${p.id}">Agregar al carrito</button>
    `;
    cont.appendChild(div);
  });

  document.querySelectorAll('button[data-id]').forEach(boton => {
    boton.addEventListener('click', () => {
      const id = parseInt(boton.getAttribute('data-id'));
      agregarAlCarrito(id);
    });
  });
}

function mostrarControlesPaginacion() {
  const totalPaginas = Math.ceil(productosFiltrados.length / productosPorPagina);
  const contenedor = document.getElementById("paginacion");
  contenedor.innerHTML = "";

  if (totalPaginas <= 1) return;

  for (let i = 1; i <= totalPaginas; i++) {
    const boton = document.createElement("button");
    boton.textContent = i;
    boton.disabled = i === paginaActual;
    boton.onclick = () => {
      paginaActual = i;
      mostrarProductosPaginados();
      window.scrollTo(0, 0);
    };
    contenedor.appendChild(boton);
  }
}

function agregarAlCarrito(id) {
  const producto = todosLosProductos.find(p => p.id === id);
  if (producto && producto.stock > 0) {
    carrito.push(producto);
    producto.stock -= 1;
    actualizarContador();
    aplicarFiltroBusqueda();
    mostrarMensajeAgregado();
  }
}

function actualizarContador() {
  document.getElementById('contador-carrito').textContent = carrito.length;
}

function mostrarModalCarrito() {
  const modal = document.getElementById("modal-carrito");
  const lista = document.getElementById("lista-carrito");
  const total = document.getElementById("total");

  lista.innerHTML = "";

  if (carrito.length === 0) {
    lista.innerHTML = "<p>El carrito está vacío.</p>";
    total.textContent = "Total: $0.00";
  } else {
    const resumen = {};
    carrito.forEach(item => {
      if (!resumen[item.id]) {
        resumen[item.id] = { ...item, cantidad: 0 };
      }
      resumen[item.id].cantidad++;
    });

    let totalPagar = 0;

    for (const id in resumen) {
      const item = resumen[id];
      const subtotal = item.precio * item.cantidad;
      totalPagar += subtotal;
      const div = document.createElement("div");
      div.innerHTML = `<p><strong>${item.nombre}</strong> x${item.cantidad} - $${subtotal.toFixed(2)}</p>`;
      lista.appendChild(div);
    }

    total.textContent = `Total: $${totalPagar.toFixed(2)}`;
  }

  modal.style.display = "block";
}

function mostrarMensajeAgregado() {
  const mensaje = document.getElementById('mensaje-agregado');
  mensaje.classList.remove('oculto');
  mensaje.classList.add('visible');

  setTimeout(() => {
    mensaje.classList.remove('visible');
    mensaje.classList.add('oculto');
  }, 2000);
}

document.getElementById("carrito").addEventListener("click", mostrarModalCarrito);
document.querySelector(".cerrar").addEventListener("click", () => {
  document.getElementById("modal-carrito").style.display = "none";
});

document.getElementById("busqueda").addEventListener("input", aplicarFiltroBusqueda);
