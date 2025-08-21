
// ===== Utilities =====
const currency = new Intl.NumberFormat('en-ZA', { style:'currency', currency:'ZAR' });
const $ = (sel,ctx=document)=>ctx.querySelector(sel);
const $$ = (sel,ctx=document)=>Array.from(ctx.querySelectorAll(sel));

function uid(){ return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`; }
function hashStr(str){ let h=0; for(let i=0;i<str.length;i++){ h=(h*33)^str.charCodeAt(i);} return (h>>>0).toString(16); }

// ===== Storage =====
const jget = (k,fb)=>{ try{return JSON.parse(localStorage.getItem(k)??fb);}catch{ return JSON.parse(fb??"null"); } };
const jset = (k,v)=>localStorage.setItem(k, JSON.stringify(v));
const getProducts=()=>jget('products','[]'); const setProducts=(v)=>jset('products',v);
const getCart=()=>jget('cart','[]'); const setCart=(v)=>jset('cart',v);
const getBrands=()=>jget('brands','[]'); const setBrands=(v)=>jset('brands',v);
const getOrders=()=>jget('orders','[]'); const setOrders=(v)=>jset('orders',v);
const getAdmin=()=>jget('adminUser','null'); const setAdmin=(o)=>jset('adminUser',o);
const adminLoggedIn=()=>!!localStorage.getItem('admin_session');
const setAdminSession=(on)=> on?localStorage.setItem('admin_session','1'):localStorage.removeItem('admin_session');

// ===== Seeds =====
function seedIfEmpty(){
  if(!getProducts().length){
    const demo=[
      {name:"AeroRun 1", description:"Lightweight daily trainer with breathable knit upper.", price:1299, brand:"Aero", image:"https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1200&auto=format&fit=crop"},
      {name:"StreetFlex", description:"Sleek lifestyle shoe for all-day comfort.", price:1499, brand:"Flex", image:"https://images.unsplash.com/photo-1543508282-6319a3e2621f?q=80&w=1200&auto=format&fit=crop"},
      {name:"TrailClimb Pro", description:"Aggressive lugs and rock plate for gnarly trails.", price:1799, brand:"Climb", image:"https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200&auto=format&fit=crop"},
      {name:"Court Ace", description:"Responsive midsole and grippy outsole for the court.", price:1399, brand:"Ace", image:"https://images.unsplash.com/photo-1608231387042-66d1773070a5?q=80&w=1200&auto=format&fit=crop"}
    ].map(p=>({id:uid(),...p}));
    setProducts(demo);
  }
  if(!getBrands().length){
    setBrands(["Aero","Flex","Climb","Ace","Puma","Adidas","Nike"]);
  }
}

// ===== Auth (Admin) =====
function ensureAdminGuard(){
  const needsGuard = document.body.dataset.guard === "admin";
  if(!needsGuard) return;
  if(!adminLoggedIn()){
    location.href = "admin-login.html";
  }
}
function handleAdminLoginPage(){
  const createWrap = $("#create-admin");
  const loginWrap = $("#login-admin");
  if(!createWrap && !loginWrap) return;
  const admin = getAdmin();
  if(!admin){
    createWrap.style.display="block";
    $("#create-form").addEventListener("submit",(e)=>{
      e.preventDefault();
      const username=$("#c-username").value.trim();
      const password=$("#c-password").value;
      if(!username||!password){ alert("Please provide username and password."); return; }
      setAdmin({ username, passHash: hashStr(username+'::'+password) });
      alert("Admin created. Please login.");
      location.reload();
    });
  }else{
    loginWrap.style.display="block";
    $("#login-form").addEventListener("submit",(e)=>{
      e.preventDefault();
      const username=$("#l-username").value.trim();
      const password=$("#l-password").value;
      const ok = admin.username===username && admin.passHash===hashStr(username+'::'+password);
      if(!ok){ alert("Invalid credentials."); return; }
      setAdminSession(true);
      location.href="admin.html";
    });
  }
}

// ===== Mobile menu =====
function initMobileMenu(){
  const btn = $("#menu-toggle");
  const drawer = $("#nav-drawer");
  if(!btn || !drawer) return;
  const close = ()=>drawer.classList.remove("open");
  btn.addEventListener("click", ()=>drawer.classList.add("open"));
  drawer.querySelector(".overlay")?.addEventListener("click", close);
  drawer.querySelectorAll("a").forEach(a=>a.addEventListener("click", close));
}

// ===== Catalogue =====
function renderBrandChips(activeBrand){
  const brands = getBrands();
  const box = $("#brand-chips");
  if(!box) return;
  const all = ["All", ...brands];
  box.innerHTML = all.map(b=>`<button class="chip ${b===activeBrand?'active':''}" data-brand="${b}">${b}</button>`).join("");
  box.addEventListener("click",(e)=>{
    const btn = e.target.closest(".chip");
    if(!btn) return;
    const brand = btn.dataset.brand;
    const params = new URLSearchParams(location.search);
    if(brand && brand!=="All"){ params.set("brand", brand); } else { params.delete("brand"); }
    location.href = `index.html?${params.toString()}`;
  });
}
function renderCatalog(){
  seedIfEmpty();
  const listEl = $("#catalog-grid");
  if(!listEl) return;
  const params = new URLSearchParams(location.search);
  const q = (params.get("q")||"").toLowerCase();
  const activeBrand = params.get("brand")||"All";
  renderBrandChips(activeBrand);
  let products = getProducts().map(p=>({...p, brand: p.brand || "Unbranded"}));
  if(q) products = products.filter(p => (p.name+p.description+p.brand).toLowerCase().includes(q));
  if(activeBrand && activeBrand!=="All") products = products.filter(p => p.brand===activeBrand);
  listEl.innerHTML = products.map(p => `
    <a class="card" href="product.html?id=${encodeURIComponent(p.id)}" aria-label="${p.name}">
      <div class="thumb">${p.image ? `<img src="${p.image}" alt="${p.name}">` : ""}</div>
      <div class="meta">
        <div class="row"><div class="title">${p.name}</div><span class="brand-tag">${p.brand}</span></div>
        <div class="muted">${p.description}</div>
        <div class="row"><span class="price">${currency.format(p.price)}</span><span class="muted">View</span></div>
      </div>
    </a>
  `).join("") || `<p class="muted">No shoes yet. Go to <a href="admin.html">Admin</a> to add some.</p>`;
  const search = $("#search");
  if(search){
    search.addEventListener("keydown", (e)=>{
      if(e.key==="Enter"){
        const params = new URLSearchParams(location.search);
        params.set("q", search.value.trim());
        location.href = `index.html?${params.toString()}`;
      }
    });
  }
}

// ===== Product Page =====
function renderProduct(){
  const wrap = $("#product-wrap");
  if(!wrap) return;
  const id = new URLSearchParams(location.search).get("id");
  const product = getProducts().find(p => p.id === id);
  if(!product){ wrap.innerHTML = "<p>Product not found.</p>"; return; }
  $("#p-title").textContent = product.name;
  $("#p-brand").textContent = product.brand || "Unbranded";
  $("#p-img").src = product.image || "";
  $("#p-price").textContent = currency.format(product.price);
  $("#p-desc").textContent = product.description;
  const sizeSel = $("#p-size");
  const sizes = [5,6,7,8,9,10,11,12];
  sizeSel.innerHTML = `<option value="">Select size</option>` + sizes.map(s=>`<option value="${s}">${s}</option>`).join("");
  const add = ()=>{
    const size = sizeSel.value;
    if(!size){ alert("Please choose a size."); return; }
    const qty = Math.max(1, parseInt($("#p-qty").value || "1",10));
    const cart = getCart();
    const existing = cart.find(i => i.productId===product.id && i.size===size);
    if(existing){ existing.qty += qty; } else { cart.push({ id: uid(), productId: product.id, size, qty }); }
    setCart(cart);
    alert("Added to cart!");
  };
  $("#add-to-cart")?.addEventListener("click", add);
  $("#go-checkout")?.addEventListener("click", ()=>location.href="checkout.html");
  // Mobile sticky buttons
  $("#add-to-cart-mobile")?.addEventListener("click", add);
  $("#go-checkout-mobile")?.addEventListener("click", ()=>location.href="checkout.html");
}

// ===== Checkout Page =====
function renderCheckout(){
  const tbody = $("#cart-body");
  if(!tbody) return;
  seedIfEmpty();
  const products = getProducts();
  function recalcTotal(cart){
    let sum = 0;
    cart.forEach(ci=>{
      const p = products.find(pp=>pp.id===ci.productId);
      sum += (p?.price||0) * (ci.qty||1);
    });
    $("#grand-total").textContent = currency.format(sum);
    return sum;
  }
  function draw(){
    const cart = getCart();
    let total = 0;
    tbody.innerHTML = cart.map(item => {
      const p = products.find(pp=>pp.id===item.productId);
      const line = (p?.price||0) * (item.qty||1);
      total += line;
      return `
        <tr data-id="${item.id}">
          <td style="width:60px">${p?.image?`<img src="${p.image}" alt="${p.name}" style="width:56px;height:56px;object-fit:cover;border-radius:10px">`:""}</td>
          <td>
            <div style="font-weight:600">${p?.name||"Unknown"}</div>
            <div class="muted">Brand: ${p?.brand||"Unbranded"} • Size ${item.size}</div>
          </td>
          <td class="price">${p?currency.format(p.price):"-"}</td>
          <td><input type="number" min="1" value="${item.qty}" class="qty-input" style="width:70px"></td>
          <td><button class="btn small" data-action="remove">Remove</button></td>
        </tr>
      `;
    }).join("") || `<tr><td colspan="5" class="muted">Your cart is empty.</td></tr>`;
    $("#grand-total").textContent = currency.format(total);
  }
  draw();
  tbody.addEventListener("input", (e)=>{
    if(!e.target.classList.contains("qty-input")) return;
    const row = e.target.closest("tr");
    const id = row.dataset.id;
    const cart = getCart();
    const item = cart.find(i=>i.id===id);
    item.qty = Math.max(1, parseInt(e.target.value||"1",10));
    setCart(cart);
    recalcTotal(cart);
  });
  tbody.addEventListener("click", (e)=>{
    if(e.target.dataset.action!=="remove") return;
    const row = e.target.closest("tr");
    const id = row.dataset.id;
    const cart = getCart().filter(i=>i.id!==id);
    setCart(cart);
    row.remove();
    recalcTotal(cart);
  });
  $("#place-order")?.addEventListener("click", ()=>{
    const cart = getCart();
    if(!cart.length){ alert("Your cart is empty."); return; }
    const firstName = $("#c-first").value.trim();
    const lastName = $("#c-last").value.trim();
    const email = $("#c-email").value.trim();
    const phone = $("#c-phone").value.trim();
    const address = $("#c-address").value.trim();
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const phoneOk = phone.replace(/\D/g,'').length >= 9;
    if(!firstName || !lastName || !email || !phone || !address){ alert("Please fill in all required details."); return; }
    if(!emailOk){ alert("Please enter a valid email address."); return; }
    if(!phoneOk){ alert("Please enter a valid phone number."); return; }
    const items = cart.map(ci=>{
      const p = getProducts().find(pp=>pp.id===ci.productId);
      return { productId: ci.productId, name: p?.name || "Unknown", brand: p?.brand || "Unbranded", size: ci.size, qty: ci.qty, price: p?.price || 0 };
    });
    const total = items.reduce((s,i)=>s + i.price*i.qty, 0);
    const order = { id: uid(), createdAt: new Date().toISOString(), customer:{ firstName, lastName, email, phone, address }, items, total };
    const orders = getOrders(); orders.unshift(order); setOrders(orders);
    setCart([]);
    alert("✅ Order placed! (Demo)");
    location.href="index.html";
  });
}

// ===== Admin Page =====
function renderAdmin(){
  const page = $("#admin-page");
  if(!page) return;
  $("#logout").addEventListener("click", ()=>{ setAdminSession(false); location.href="admin-login.html"; });
  const sections = $$(".admin-section");
  $$(".tab").forEach(tab=>tab.addEventListener("click",()=>{
    $$(".tab").forEach(t=>t.classList.remove("active"));
    tab.classList.add("active");
    const target = tab.dataset.target;
    sections.forEach(sec => sec.style.display = (sec.id===target) ? "block" : "none");
  }));
  // Products
  const brandSelect = $("#a-brand");
  function refreshBrandSelect(){
    const brands = getBrands();
    brandSelect.innerHTML = brands.map(b=>`<option value="${b}">${b}</option>`).join("");
  }
  refreshBrandSelect();
  $("#admin-form").addEventListener("submit",(e)=>{
    e.preventDefault();
    const name=$("#a-name").value.trim();
    const desc=$("#a-desc").value.trim();
    const price=parseFloat($("#a-price").value);
    const image=$("#a-image").value.trim();
    const brand=brandSelect.value||"Unbranded";
    if(!name||!desc||isNaN(price)){ alert("Please fill name, description and a valid price."); return; }
    const item={ id:uid(), name, description:desc, price:Math.round(price*100)/100, image, brand };
    const prods=getProducts(); prods.push(item); setProducts(prods);
    $("#admin-form").reset(); refreshProductPreview(); alert("✅ Shoe added!");
  });
  function refreshProductPreview(){
    const grid=$("#preview-grid"); const products=getProducts();
    grid.innerHTML = products.map(p=>`
      <div class="card">
        <div class="thumb">${p.image?`<img src="${p.image}" alt="${p.name}">`:""}</div>
        <div class="meta">
          <div class="row"><div class="title">${p.name}</div><span class="brand-tag">${p.brand||"Unbranded"}</span></div>
          <div class="muted">${p.description}</div>
          <div class="price">${currency.format(p.price)}</div>
        </div>
      </div>
    `).join("") || `<p class="muted">No products yet.</p>`;
  }
  refreshProductPreview();
  // Brands
  function renderBrands(){
    const list=$("#brands-list"); const brands=getBrands();
    list.innerHTML = brands.map(b=>`
      <div class="row" style="justify-content:space-between;border-bottom:1px solid var(--border);padding:8px 0">
        <span>${b}</span>
        <button class="btn danger small" data-action="del" data-brand="${b}">Delete</button>
      </div>
    `).join("") || `<p class="muted">No brands. Add one below.</p>`;
  }
  renderBrands();
  $("#add-brand-form").addEventListener("submit",(e)=>{
    e.preventDefault();
    const name=$("#brand-name").value.trim();
    if(!name){ alert("Enter a brand name."); return; }
    const brands=getBrands();
    if(brands.includes(name)){ alert("Brand already exists."); return; }
    brands.push(name); setBrands(brands);
    $("#brand-name").value=""; renderBrands(); refreshBrandSelect(); alert("✅ Brand added.");
  });
  $("#brands-list").addEventListener("click",(e)=>{
    const btn=e.target.closest("button[data-action='del']"); if(!btn) return;
    const b=btn.dataset.brand; const brands=getBrands().filter(x=>x!==b); setBrands(brands);
    renderBrands(); refreshBrandSelect();
  });
  // Orders
  function renderOrders(){
    const box=$("#orders-box"); const orders=getOrders();
    if(!orders.length){ box.innerHTML=`<p class="muted">No orders yet.</p>`; return; }
    box.innerHTML = orders.map(o=>{
      const items = o.items.map(i=>`<li>${i.name} <span class="badge">Brand: ${i.brand}</span> • Size ${i.size} × ${i.qty} — <strong>${currency.format(i.price*i.qty)}</strong></li>`).join("");
      const date = new Date(o.createdAt).toLocaleString();
      const c=o.customer||{}; const full=[c.firstName,c.lastName].filter(Boolean).join(" ");
      return `
        <div class="cardish" style="margin-bottom:12px">
          <div class="row"><div><strong>Order #${o.id}</strong></div><div class="price">${currency.format(o.total)}</div></div>
          <div class="muted">Placed: ${date}</div>
          <div style="margin:6px 0">
            <span class="badge">${full||"Unnamed"}</span>
            ${c.email?`<span class="badge">${c.email}</span>`:""}
            ${c.phone?`<span class="badge">${c.phone}</span>`:""}
          </div>
          ${c.address?`<div class="muted">Address: ${c.address}</div>`:""}
          <ul style="margin-top:8px">${items}</ul>
        </div>
      `;
    }).join("");
  }
  renderOrders();
}

// ===== Init =====
document.addEventListener("DOMContentLoaded", ()=>{
  seedIfEmpty();
  ensureAdminGuard();
  handleAdminLoginPage();
  initMobileMenu();
  renderCatalog();
  renderProduct();
  renderCheckout();
  renderAdmin();
});
