// State
let allItems = [];
let isEditing = false;

// DOM Elements
const itemForm = document.getElementById('item-form');
const itemIdInput = document.getElementById('item-id');
const itemNameInput = document.getElementById('item-name');
const itemPriceInput = document.getElementById('item-price');
const submitBtn = document.getElementById('submit-btn');
const submitBtnText = document.getElementById('submit-btn-text');
const cancelBtn = document.getElementById('cancel-btn');
const formTitle = document.getElementById('form-title');
const formSubtitle = document.getElementById('form-subtitle');
const itemsTbody = document.getElementById('items-tbody');
const searchInput = document.getElementById('search-input');
const countBadge = document.getElementById('count-badge');
const toastContainer = document.getElementById('toast-container');

// Stat Elements
const statTotalItems = document.getElementById('stat-total-items');
const statTotalValue = document.getElementById('stat-total-value');

// 1. READ: Fetch all items from GET /items
async function fetchItems() {
  try {
    const response = await fetch('/items');
    if (!response.ok) {
      throw new Error(`Server returned ${response.status}: ${response.statusText}`);
    }
    allItems = await response.json();
    updateStats(allItems);
    filterAndRender();
  } catch (error) {
    console.error('Error fetching items:', error);
    itemsTbody.innerHTML = `<tr><td colspan="4" class="empty-state">Error connecting to server.</td></tr>`;
    showToast('Failed to load items from server', 'danger');
  }
}

// Update Overview Stats
function updateStats(items) {
  const count = items.length;
  const total = items.reduce((sum, item) => sum + (Number(item.price) || 0), 0);

  statTotalItems.textContent = count;
  statTotalValue.textContent = `₹${total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  countBadge.textContent = `${count} item${count === 1 ? '' : 's'}`;
}

// Filter and Render Table
function filterAndRender() {
  const query = searchInput.value.trim().toLowerCase();
  const filtered = allItems.filter(item => {
    return (
      item.name.toLowerCase().includes(query) ||
      item.price.toString().includes(query)
    );
  });

  renderTable(filtered);
}

// Render items with continuous Serial Numbers
function renderTable(items) {
  itemsTbody.innerHTML = '';

  if (items.length === 0) {
    const isSearching = searchInput.value.trim().length > 0;
    itemsTbody.innerHTML = `
      <tr>
        <td colspan="4" class="empty-state">
          <div class="empty-state-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="8" y1="12" x2="16" y2="12"></line>
            </svg>
          </div>
          <div>${isSearching ? 'No items match your search.' : 'No items found. Add one above!'}</div>
        </td>
      </tr>
    `;
    return;
  }

  items.forEach((item, index) => {
    const serialNo = index + 1;
    const row = document.createElement('tr');

    row.innerHTML = `
      <td><span class="serial-pill">${serialNo}</span></td>
      <td class="item-name-cell">${escapeHtml(item.name)}</td>
      <td><span class="price-tag">₹${Number(item.price).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></td>
      <td style="text-align: center;">
        <div class="action-group">
          <button class="btn-sm btn-edit" onclick="handleEdit(${item.id}, '${escapeQuotes(item.name)}', ${item.price})">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            Edit
          </button>
          <button class="btn-sm btn-delete" onclick="handleDelete(${item.id}, '${escapeQuotes(item.name)}')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
            Delete
          </button>
        </div>
      </td>
    `;

    itemsTbody.appendChild(row);
  });
}

// 2. CREATE or UPDATE on form submit
itemForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = itemNameInput.value.trim();
  const price = parseFloat(itemPriceInput.value);

  if (!name || isNaN(price)) {
    showToast('Please enter a valid item name and price.', 'danger');
    return;
  }

  try {
    if (isEditing) {
      // UPDATE: PUT /items/:id
      const id = itemIdInput.value;
      const response = await fetch(`/items/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, price })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update item.');
      }

      showToast(`Updated "${name}" successfully!`, 'success');
    } else {
      // CREATE: POST /items
      const response = await fetch('/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, price })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create item.');
      }

      showToast(`Added "${name}" to inventory!`, 'success');
    }

    resetForm();
    await fetchItems();
  } catch (error) {
    console.error('Submission error:', error);
    showToast(error.message, 'danger');
  }
});

// 3. EDIT: Populate form with existing data
window.handleEdit = function(id, name, price) {
  isEditing = true;
  itemIdInput.value = id;
  itemNameInput.value = name;
  itemPriceInput.value = price;

  formTitle.textContent = 'Edit Item';
  formSubtitle.textContent = `Modify details for "${name}"`;
  submitBtnText.textContent = 'Update Item';
  cancelBtn.style.display = 'inline-flex';
  
  window.scrollTo({ top: itemForm.offsetTop - 40, behavior: 'smooth' });
  itemNameInput.focus();
};

// 4. DELETE: Send DELETE /items/:id
window.handleDelete = async function(id, name) {
  const confirmed = confirm(`Are you sure you want to delete "${name}"?`);
  if (!confirmed) return;

  try {
    const response = await fetch(`/items/${id}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete item.');
    }

    showToast(`Deleted "${name}"`, 'success');

    if (isEditing && itemIdInput.value == id) {
      resetForm();
    }

    await fetchItems();
  } catch (error) {
    console.error('Delete error:', error);
    showToast(error.message, 'danger');
  }
};

// Cancel edit
cancelBtn.addEventListener('click', () => {
  resetForm();
});

// Reset form
function resetForm() {
  itemForm.reset();
  itemIdInput.value = '';
  isEditing = false;
  formTitle.textContent = 'Add New Item';
  formSubtitle.textContent = 'Fill in the item details below to add it to your inventory';
  submitBtnText.textContent = 'Add Item';
  cancelBtn.style.display = 'none';
}

// Search input listener
searchInput.addEventListener('input', () => {
  filterAndRender();
});

// Toast notification helper
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'fadeOut 0.25s ease-out forwards';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 250);
  }, 3000);
}

// Helpers
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function escapeQuotes(text) {
  return text.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

// Initial fetch on page load
document.addEventListener('DOMContentLoaded', fetchItems);

