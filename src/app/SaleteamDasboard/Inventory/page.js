'use client'

import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { Plus, Save, Edit, Trash2, X, FileText, ShoppingCart, Boxes } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  PageShell,
  PageHeader,
  Card,
  SearchInput,
  PrimaryButton,
  SecondaryButton,
  TableWrap,
  Th,
  Td,
} from "../../_components/ui";

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({
    Itemcode: '',
    Model: '',
    price: '',
    Brand: '',
    Inward: '',
    Outward: '0',
    Current: '',
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [editMode, setEditMode] = useState(null);
  const [editedProduct, setEditedProduct] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const token = typeof window !== "undefined" ? localStorage.getItem('admintokens') : null;
  const role = typeof window !== "undefined" ? localStorage.getItem('role') : null;

  // Fetch products
  const fetchProducts = async () => {
    try {
      const response = await axios.get('http://localhost:5005/api-inventory/get-product');
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Filter products based on the search query
  const filteredProducts = products.filter((product) =>
    product.Model?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.Brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.Itemcode?.toLowerCase().includes(searchQuery.toLowerCase())
  );


  const handleAddProduct = async (e) => {
    e.preventDefault();

    const existingProduct = products.find(product => product.Itemcode === newProduct.Itemcode);

    try {
      if (existingProduct) {
        const updatedProduct = {
          ...existingProduct,
          ...newProduct,
          Current: parseInt(existingProduct.Inward) + parseInt(newProduct.Inward) || 0,
        };

        await axios.put(`http://localhost:5005/api-Inventory/update/${existingProduct._id}`, updatedProduct, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setProducts(products.map((product) =>
          product._id === existingProduct._id ? { ...product, ...updatedProduct } : product
        ));
      } else {
        const response = await axios.post('http://localhost:5005/api-inventory/add-product', newProduct, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setProducts([...products, response.data]);
      }
      fetchProducts();
      setNewProduct({
        Itemcode: '',
        Model: '',
        price: '',
        Brand: '',
        Inward: '',
        Outward: '0',
        Current: '',
      });
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding or updating product:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === 'Inward') {
      const inwardValue = parseInt(value) || 0;
      setNewProduct({
        ...newProduct,
        [name]: value,
        Current: inwardValue,
      });
    } else {
      setNewProduct({
        ...newProduct,
        [name]: value,
      });
    }
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditedProduct({
      ...editedProduct,
      [name]: value,
    });
  };

  const handleSaveEdit = async (id) => {
    try {
      await axios.put(`http://localhost:5005/api-Inventory/update/${id}`, editedProduct, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setProducts(products.map((product) =>
        product._id === id ? { ...product, ...editedProduct } : product
      ));
      setEditMode(null);
      setEditedProduct({});
    } catch (error) {
      console.error('Error saving edited product:', error);
    }
  };

  const handleEdit = (product) => {
    setEditMode(product._id);
    setEditedProduct(product);
  };

  const deleteProduct = async (id) => {
    try {
      await axios.delete(`http://localhost:5005/api-Inventory/delete/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setProducts(products.filter((product) => product._id !== id));
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const handleBackClick = () => {
    const role = localStorage.getItem("role")?.trim().toLowerCase();

    if (role === "service engineer" || role === "engineer") {
      router.push("/ServiceProject/Dasboard");
    } else if (role === "md") {
      router.push("/admin/adminDasboard");
    } else {
      router.push("/SaleteamDasboard/Dasboard");
    }
  };


  const toggleAddForm = () => {
    setShowAddForm(!showAddForm);
  };

  const cancelEdit = () => {
    setEditMode(null);
    setEditedProduct({});
  };

  const purchaseOrder = () => {
    router.push('/SaleteamDasboard/PurchaseOrder');
  }

  const perfomaInvoice = () => {
    router.push('/SaleteamDasboard/Perfomainvoice');
  }

  const editInputClass =
    "w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100";
  const formInputClass =
    "w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100";

  return (
    <PageShell>
      <PageHeader
        eyebrow="Procurement"
        title="Inventory Management"
        subtitle="Track stock levels, manage products, and raise orders."
        onBack={handleBackClick}
        actions={
          <>
            <SecondaryButton onClick={purchaseOrder}>
              <ShoppingCart size={16} />
              Purchase Order
            </SecondaryButton>
            <PrimaryButton onClick={perfomaInvoice}>
              <FileText size={16} />
              Proforma Invoice
            </PrimaryButton>
          </>
        }
      />

      {/* Add Product Form */}
      {role === 'Stock Filler' && (
        <div className="flex justify-end">
          <SecondaryButton onClick={toggleAddForm}>
            {showAddForm ? <X size={16} /> : <Plus size={16} />}
            {showAddForm ? 'Cancel' : 'Add Product'}
          </SecondaryButton>
        </div>
      )}

      {showAddForm && role === 'Stock Filler' && (
        <Card>
          <h3 className="text-base font-semibold text-slate-900">Add New Product</h3>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Item Code</label>
              <input className={formInputClass} type="text" name="Itemcode" value={newProduct.Itemcode} onChange={handleInputChange} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Model</label>
              <input className={formInputClass} type="text" name="Model" value={newProduct.Model} onChange={handleInputChange} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Brand</label>
              <input className={formInputClass} type="text" name="Brand" value={newProduct.Brand} onChange={handleInputChange} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Price</label>
              <input className={formInputClass} type="number" name="price" value={newProduct.price} onChange={handleInputChange} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Inward</label>
              <input className={formInputClass} type="number" name="Inward" value={newProduct.Inward} onChange={handleInputChange} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Current</label>
              <input className={`${formInputClass} bg-slate-100`} type="number" name="Current" value={newProduct.Current} readOnly />
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <PrimaryButton onClick={handleAddProduct}>
              <Save size={16} />
              Save Product
            </PrimaryButton>
          </div>
        </Card>
      )}

      {/* Search Bar */}
      <SearchInput
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search by item code, model or brand…"
        className="max-w-md"
      />

      {/* Products Table */}
      <TableWrap>
        <thead>
          <tr>
            <Th>Item Code</Th>
            <Th>Model</Th>
            <Th>Brand</Th>
            <Th>Price</Th>
            <Th>Inward</Th>
            <Th>Outward</Th>
            <Th>Current</Th>
            {role === 'Stock Filler' && <Th>Actions</Th>}
          </tr>
        </thead>
        <tbody>
          {filteredProducts.length === 0 ? (
            <tr>
              <Td className="text-center text-slate-500" colSpan={role === 'Stock Filler' ? 8 : 7}>
                No products found
              </Td>
            </tr>
          ) : (
            filteredProducts.map((product) => (
              <tr key={product._id} className="hover:bg-slate-50">
                <Td className="font-medium text-slate-900">
                  {editMode === product._id ? (
                    <input className={editInputClass} type="text" name="Itemcode" value={editedProduct.Itemcode || ''} onChange={handleEditInputChange} />
                  ) : (product.Itemcode)}
                </Td>
                <Td>
                  {editMode === product._id ? (
                    <input className={editInputClass} type="text" name="Model" value={editedProduct.Model || ''} onChange={handleEditInputChange} />
                  ) : (product.Model)}
                </Td>
                <Td>
                  {editMode === product._id ? (
                    <input className={editInputClass} type="text" name="Brand" value={editedProduct.Brand || ''} onChange={handleEditInputChange} />
                  ) : (product.Brand)}
                </Td>
                <Td>
                  {editMode === product._id ? (
                    <input className={editInputClass} type="number" name="price" value={editedProduct.price || ''} onChange={handleEditInputChange} />
                  ) : (product.price)}
                </Td>
                <Td>
                  {editMode === product._id ? (
                    <input className={editInputClass} type="number" name="Inward" value={editedProduct.Inward || ''} onChange={handleEditInputChange} />
                  ) : (product.Inward)}
                </Td>
                <Td>
                  {editMode === product._id ? (
                    <input className={editInputClass} type="number" name="Outward" value={editedProduct.Outward || ''} onChange={handleEditInputChange} />
                  ) : (product.Outward)}
                </Td>
                <Td>
                  {editMode === product._id ? (
                    <input className={editInputClass} type="number" name="Current" value={editedProduct.Current || ''} onChange={handleEditInputChange} />
                  ) : (product.Current)}
                </Td>
                {role === 'Stock Filler' && (
                  <Td>
                    <div className="flex gap-1">
                      {editMode === product._id ? (
                        <>
                          <button className="rounded p-1.5 text-emerald-600 hover:bg-emerald-50" onClick={() => handleSaveEdit(product._id)} aria-label="Save changes">
                            <Save size={16} />
                          </button>
                          <button className="rounded p-1.5 text-slate-600 hover:bg-slate-100" onClick={cancelEdit} aria-label="Cancel edit">
                            <X size={16} />
                          </button>
                        </>
                      ) : (
                        <button className="rounded p-1.5 text-blue-600 hover:bg-blue-50" onClick={() => handleEdit(product)} aria-label="Edit product">
                          <Edit size={16} />
                        </button>
                      )}
                      {!editMode && (
                        <button className="rounded p-1.5 text-rose-600 hover:bg-rose-50" onClick={() => deleteProduct(product._id)} aria-label="Delete product">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </Td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </TableWrap>

      <p className="text-sm text-slate-500">
        Showing {filteredProducts.length} of {products.length} products
      </p>
    </PageShell>
  );
};

export default ProductList;
