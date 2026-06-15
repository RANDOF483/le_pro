// ============================================================
// LE PRO COLLECTION – Global Store (Supabase Cloud Connected)
// WhatsApp & MoMo: +237682676142
// ============================================================

const WHATSAPP_NUMBER = '237682676142';
const MOMO_NUMBER = '682676142';
// Admin password removed for security - using Supabase Auth

// ── Supabase Configuration ────────────────────────────────
// IMPORTANT: Replace these dummy values with your actual Supabase config!
const SUPABASE_URL = "https://lauxyocrzpdgvjwiljvb.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_LpSUujiHr9sZ6dtmiRu2NA_HHaVfE9_";

let supabaseClient = null;
let CACHED_PRODUCTS = [];
let CACHED_ORDERS = [];
let isSupabaseActive = false;

// ── Default Products ──────────────────────────────────────
const DEFAULT_PRODUCTS = [
  { id: 'p1', name: 'Obsidian Premium Tee', category: 'T-Shirts', price: 8500, oldPrice: 12000, image: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600', badge: 'New Arrival', sizes: ['S','M','L','XL','XXL'], stock: 15, description: 'Premium heavyweight cotton.', mood: 'Luxury', trending: true },
  { id: 'p4', name: 'Noir Fleece Hoodie', category: 'Hoodies', price: 22000, oldPrice: 28000, image: 'https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=600', badge: 'Best Seller', sizes: ['S','M','L','XL','XXL'], stock: 12, description: 'Ultra-soft fleece.', mood: 'Streetwear', trending: true },
  { id: 'p8', name: 'Obsidian Leather Jacket', category: 'Jackets', price: 65000, oldPrice: 85000, image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600', badge: 'Luxury', sizes: ['S','M','L','XL'], stock: 6, description: 'Full-grain genuine leather.', mood: 'Luxury', trending: true },
  { id: 'p10', name: 'Pro Runner Elite', category: 'Sneakers', price: 45000, oldPrice: 58000, image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600', badge: 'Best Seller', sizes: ['39','40','41','42','43','44','45'], stock: 20, description: 'Lightweight foam sole.', mood: 'Streetwear', trending: true },
  { id: 'p13', name: 'Chronos Black Gold Watch', category: 'Watches', price: 95000, oldPrice: 125000, image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600', badge: 'Luxury', sizes: ['One Size'], stock: 8, description: 'Swiss-style automatic movement.', mood: 'Luxury', trending: true },
  { id: 'p21', name: 'Noir Absolu EDP', category: 'Perfumes', price: 35000, oldPrice: 45000, image: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=600', badge: 'Best Seller', sizes: ['50ml','100ml'], stock: 20, description: 'Dark, smoky oriental.', mood: 'Luxury', scentFamily: 'Oud', occasion: 'Evening', season: 'Winter', trending: true }
];

// Initialize LocalStorage fallback first
if (!localStorage.getItem('lp_products')) {
  localStorage.setItem('lp_products', JSON.stringify(DEFAULT_PRODUCTS));
}
CACHED_PRODUCTS = JSON.parse(localStorage.getItem('lp_products'));
CACHED_ORDERS = JSON.parse(localStorage.getItem('lp_orders') || '[]');

function triggerUIUpdate() {
  if (typeof renderNewArrivals === 'function') renderNewArrivals();
  if (typeof renderPerfumes === 'function') renderPerfumes();
  if (typeof renderTrending === 'function') renderTrending();
  if (typeof applyFilters === 'function') applyFilters();
  if (typeof render === 'function') render();
  if (typeof loadData === 'function') loadData();
  if (typeof loadMyOrders === 'function') loadMyOrders();
  if (typeof renderProduct === 'function') {
    const pid = new URLSearchParams(window.location.search).get('id');
    const p = Store.getProductById(pid);
    if(p) { renderProduct(p); if (typeof renderRelated === 'function') renderRelated(p); }
  }
}

// ── Load Supabase Dynamically ─────────────────────────────
(function loadSupabase() {
  if(SUPABASE_URL === "YOUR_SUPABASE_URL") {
    console.log("Supabase not configured. Using Local Storage only.");
    return;
  }

  const s1 = document.createElement('script');
  s1.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
  document.head.appendChild(s1);

  s1.onload = async () => {
    try {
      const { createClient } = window.supabase;
      supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      isSupabaseActive = true;
      console.log("Supabase Connected");

      await fetchInitialData();

    } catch (e) {
      console.error("Supabase Initialization Error:", e);
    }
  };
})();

async function fetchInitialData() {
  // Fetch Products
  const { data: pData } = await supabaseClient.from('products').select('*');
  if (pData && pData.length > 0) {
    CACHED_PRODUCTS = pData.map(row => row.data);
  } else if (pData && pData.length === 0) {
    // Seed default products if database is completely empty
    for (const p of DEFAULT_PRODUCTS) {
      await supabaseClient.from('products').insert([{ id: p.id, data: p }]);
    }
    CACHED_PRODUCTS = [...DEFAULT_PRODUCTS];
  }
  localStorage.setItem('lp_products', JSON.stringify(CACHED_PRODUCTS));

  // Fetch Orders
  const { data: oData } = await supabaseClient.from('orders').select('*').order('created_at', { ascending: false });
  if (oData) {
    CACHED_ORDERS = oData.map(row => row.data);
    localStorage.setItem('lp_orders', JSON.stringify(CACHED_ORDERS));
  }

  await Store.cleanOldProducts();

  triggerUIUpdate();
}

// ── Store Getters/Setters ─────────────────────────────────
const Store = {
  getProducts() { return CACHED_PRODUCTS; },
  saveProducts(products) { // Local fallback
    localStorage.setItem('lp_products', JSON.stringify(products));
    CACHED_PRODUCTS = products;
    triggerUIUpdate();
  },
  
  // Cart & Wishlist are always local (per device)
  getCart() { return JSON.parse(localStorage.getItem('lp_cart') || '[]'); },
  saveCart(cart) {
    localStorage.setItem('lp_cart', JSON.stringify(cart));
    document.dispatchEvent(new Event('cartUpdated'));
  },
  getWishlist() { return JSON.parse(localStorage.getItem('lp_wishlist') || '[]'); },
  saveWishlist(w) {
    localStorage.setItem('lp_wishlist', JSON.stringify(w));
    document.dispatchEvent(new Event('wishlistUpdated'));
  },

  getOrders() { return CACHED_ORDERS; },
  saveOrders(orders) {
    localStorage.setItem('lp_orders', JSON.stringify(orders));
    CACHED_ORDERS = orders;
    triggerUIUpdate();
  },

  async isAdminLoggedIn() { 
    if(!isSupabaseActive) return sessionStorage.getItem('lp_admin') === 'true';
    const { data: { session } } = await supabaseClient.auth.getSession();
    return !!session;
  },
  async adminLogin(email, password) {
    if(!isSupabaseActive) {
      if (password === 'leprocollection2024') { sessionStorage.setItem('lp_admin', 'true'); return true; }
      return false;
    }
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: email,
      password: password,
    });
    if (error) throw error;
    return true;
  },
  async adminLogout() { 
    if(!isSupabaseActive) sessionStorage.removeItem('lp_admin'); 
    else await supabaseClient.auth.signOut();
  },

  // Cart helpers
  addToCart(product, size, qty = 1) {
    const cart = this.getCart();
    const existing = cart.find(i => i.id === product.id && i.size === size);
    if (existing) { existing.qty += qty; } else { cart.push({ ...product, size, qty }); }
    this.saveCart(cart);
  },
  removeFromCart(id, size) { this.saveCart(this.getCart().filter(i => !(i.id === id && i.size === size))); },
  updateCartQty(id, size, qty) {
    const cart = this.getCart();
    const item = cart.find(i => i.id === id && i.size === size);
    if (item) { qty <= 0 ? this.removeFromCart(id, size) : (item.qty = qty, this.saveCart(cart)); }
  },
  getCartTotal() { return this.getCart().reduce((sum, i) => sum + i.price * i.qty, 0); },
  getCartCount() { return this.getCart().reduce((sum, i) => sum + i.qty, 0); },

  // Wishlist helpers
  toggleWishlist(product) {
    let w = this.getWishlist();
    const idx = w.findIndex(i => i.id === product.id);
    if (idx > -1) { w.splice(idx, 1); } else { w.push(product); }
    this.saveWishlist(w);
    return idx === -1;
  },
  isWishlisted(id) { return this.getWishlist().some(i => i.id === id); },

  // WhatsApp
  openWhatsApp(message) { window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank'); },
  orderOnWhatsApp(product, size) {
    const msg = `🛍️ *Le Pro Collection – Order Request*\n\n👔 *Product:* ${product.name}\n📦 *Category:* ${product.category}\n📏 *Size:* ${size || 'N/A'}\n💰 *Price:* ${formatPrice(product.price)}\n\nPlease confirm availability and delivery details. Thank you! 🙏`;
    this.openWhatsApp(msg);
  },
  orderCartOnWhatsApp(cart) {
    const items = cart.map(i => `• ${i.name} (${i.size}) x${i.qty} = ${formatPrice(i.price * i.qty)}`).join('\n');
    const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
    const msg = `🛍️ *Le Pro Collection – Cart Order*\n\n${items}\n\n💰 *Total:* ${formatPrice(total)}\n\nPlease confirm my order. Thank you! 🙏`;
    this.openWhatsApp(msg);
  },

  // Image Upload (Supabase Storage)
  async uploadImage(file) {
    if (!isSupabaseActive) {
      alert("Cloud database not connected. Image upload disabled.");
      return null;
    }
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `public/${fileName}`;

    const { data, error } = await supabaseClient.storage
      .from('product-images')
      .upload(filePath, file);

    if (error) {
      console.error('Upload error:', error);
      alert('Failed to upload image. Did you create the public product-images bucket?');
      throw error;
    }

    const { data: { publicUrl } } = supabaseClient.storage
      .from('product-images')
      .getPublicUrl(filePath);

    return publicUrl;
  },

  // Products CRUD (Cloud connected)
  async addProduct(product) {
    product.id = 'p' + Date.now();
    product.createdAt = Date.now(); // Track creation time for auto-deletion
    if(isSupabaseActive) {
      await supabaseClient.from('products').insert([{ id: product.id, data: product }]);
      CACHED_PRODUCTS.unshift(product);
      this.saveProducts(CACHED_PRODUCTS);
    } else {
      CACHED_PRODUCTS.unshift(product);
      this.saveProducts(CACHED_PRODUCTS);
    }
    return product;
  },
  async updateProduct(id, updates) {
    const idx = CACHED_PRODUCTS.findIndex(p => p.id === id);
    if (idx > -1) { 
      CACHED_PRODUCTS[idx] = { ...CACHED_PRODUCTS[idx], ...updates }; 
      if(isSupabaseActive) {
        await supabaseClient.from('products').update({ data: CACHED_PRODUCTS[idx] }).eq('id', id);
      }
      this.saveProducts(CACHED_PRODUCTS);
    }
  },
  async deleteProduct(id) {
    if(isSupabaseActive) {
      await supabaseClient.from('products').delete().eq('id', id);
    }
    CACHED_PRODUCTS = CACHED_PRODUCTS.filter(p => p.id !== id);
    this.saveProducts(CACHED_PRODUCTS);
  },
  
  async cleanOldProducts() {
    const twoWeeksAgo = Date.now() - (14 * 24 * 60 * 60 * 1000); // 14 days in milliseconds
    const productsToDelete = CACHED_PRODUCTS.filter(p => p.createdAt && p.createdAt < twoWeeksAgo);
    
    for (const p of productsToDelete) {
      await this.deleteProduct(p.id);
    }
  },

  getProductById(id) { return this.getProducts().find(p => p.id === id); },

  // Orders (Cloud connected)
  async placeOrder(order) {
    order.id = 'ORD' + Date.now();
    order.date = new Date().toISOString();
    order.status = 'Pending';
    if(isSupabaseActive) {
      await supabaseClient.from('orders').insert([{ id: order.id, data: order }]);
    }
    CACHED_ORDERS.unshift(order);
    this.saveOrders(CACHED_ORDERS);
    return order;
  },
  async updateOrderStatus(id, status) {
    const o = CACHED_ORDERS.find(o => o.id === id);
    if (o) { 
      o.status = status; 
      if(isSupabaseActive) {
        await supabaseClient.from('orders').update({ data: o }).eq('id', id);
      }
      this.saveOrders(CACHED_ORDERS); 
    }
  },
};

// ── Utilities ─────────────────────────────────────────────
function formatPrice(amount) { return amount.toLocaleString('fr-CM') + ' FCFA'; }
function slugify(str) { return str.toLowerCase().replace(/\s+/g, '-'); }

function updateNavBadges() {
  const cartCount = Store.getCartCount();
  const wishCount = Store.getWishlist().length;
  document.querySelectorAll('.cart-badge').forEach(el => {
    el.textContent = cartCount;
    el.style.display = cartCount > 0 ? 'flex' : 'none';
  });
  document.querySelectorAll('.wish-badge').forEach(el => {
    el.textContent = wishCount;
    el.style.display = wishCount > 0 ? 'flex' : 'none';
  });
}

// ── AI Stylist Engine ─────────────────────────────────────
const AIStylist = {
  recommend({ budget, occasion, mood, scentFamily }) {
    const products = Store.getProducts();
    const filtered = products.filter(p => p.price <= budget);
    return {
      outfit: filtered.filter(p => ['T-Shirts','Hoodies','Jackets','Suits','Jeans'].includes(p.category) && (!mood || p.mood === mood)).slice(0, 2),
      shoes: filtered.filter(p => p.category === 'Sneakers').slice(0, 1),
      watch: filtered.filter(p => p.category === 'Watches').slice(0, 1),
      perfume: filtered.filter(p => ['Perfumes','Luxury Fragrances'].includes(p.category) && (!scentFamily || p.scentFamily === scentFamily)).slice(0, 1),
    };
  }
};

// ── Fragrance Engine ──────────────────────────────────────
const FragranceEngine = {
  recommend({ scentFamily, occasion, season, budget }) {
    return Store.getProducts().filter(p =>
      ['Perfumes','Luxury Fragrances','Body Sprays'].includes(p.category) &&
      (!scentFamily || p.scentFamily === scentFamily) &&
      (!occasion || p.occasion === occasion) &&
      (!season || p.season === season || p.season === 'All Season') &&
      (!budget || p.price <= budget)
    );
  }
};

// ── Size Advisor ──────────────────────────────────────────
const SizeAdvisor = {
  recommend({ height, weight }) {
    const bmi = weight / ((height / 100) ** 2);
    if (bmi < 18.5) return 'S'; if (bmi < 22) return 'M'; if (bmi < 26) return 'L'; if (bmi < 30) return 'XL'; return 'XXL';
  }
};

document.addEventListener('DOMContentLoaded', () => { 
  updateNavBadges(); 
  if (!isSupabaseActive) {
    // If Supabase is not active, run clean up here
    Store.cleanOldProducts();
  }
});
document.addEventListener('cartUpdated', updateNavBadges);
document.addEventListener('wishlistUpdated', updateNavBadges);
