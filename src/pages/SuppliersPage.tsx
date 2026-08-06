import React, { useState, useEffect } from 'react';
import {
  Truck,
  Plus,
  Search,
  Trash2,
  X,
  AlertTriangle,
  Mail,
  Phone,
  MapPin,
  User,
  Menu,
  Building2,
  DollarSign,
  Clock,
  CheckCircle2,
  Edit2,
  Eye,
} from 'lucide-react';
import { useUIStore } from '../store/uiStore';
import { AnimatedSelect } from '../components/AnimatedSelect';

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  accountsPayable: number;
  status: 'Paid' | 'Unpaid';
  notes?: string;
  createdAt: string;
}

const INITIAL_SUPPLIERS: Supplier[] = [];

export const SuppliersPage: React.FC = () => {
  const { setSidebarOpen, showNotification } = useUIStore();

  // Suppliers state
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    // Check migration flag to clear initial mock suppliers once
    const legacyMigratedKey = 'silms_suppliers_cleared_v1';
    if (!localStorage.getItem(legacyMigratedKey)) {
      localStorage.setItem('silms_suppliers', JSON.stringify([]));
      localStorage.setItem(legacyMigratedKey, 'true');
      return [];
    }

    const saved = localStorage.getItem('silms_suppliers');
    if (saved !== null) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (e) {
        console.error('Failed to parse saved suppliers:', e);
      }
    }
    return INITIAL_SUPPLIERS;
  });

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Paid' | 'Unpaid'>('All');

  // Modals state
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [viewSupplierModal, setViewSupplierModal] = useState<{ show: boolean; supplier: Supplier | null }>({
    show: false,
    supplier: null,
  });
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{ show: boolean; supplier: Supplier | null }>({
    show: false,
    supplier: null,
  });

  // Form input state
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    accountsPayable: 0,
    status: 'Unpaid' as 'Paid' | 'Unpaid',
    notes: '',
  });

  // Save suppliers to localStorage on change and notify listeners
  useEffect(() => {
    localStorage.setItem('silms_suppliers', JSON.stringify(suppliers));
    window.dispatchEvent(new CustomEvent('suppliers_updated'));
  }, [suppliers]);

  // Handle open add modal
  const handleOpenAddModal = () => {
    setEditingSupplier(null);
    setFormData({
      name: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      accountsPayable: 0,
      status: 'Unpaid',
      notes: '',
    });
    setShowFormModal(true);
  };

  // Handle open edit modal
  const handleOpenEditModal = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      contactPerson: supplier.contactPerson || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      accountsPayable: supplier.accountsPayable,
      status: supplier.status,
      notes: supplier.notes || '',
    });
    setShowFormModal(true);
  };

  // Handle Save Supplier
  const handleSaveSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showNotification('Supplier name is required', 'error');
      return;
    }

    const payableVal = Number(formData.accountsPayable) || 0;
    const computedStatus = payableVal === 0 ? 'Paid' : formData.status;

    if (editingSupplier) {
      setSuppliers(prev =>
        prev.map(s =>
          s.id === editingSupplier.id
            ? {
                ...s,
                name: formData.name.trim(),
                contactPerson: formData.contactPerson.trim(),
                email: formData.email.trim(),
                phone: formData.phone.trim(),
                address: formData.address.trim(),
                accountsPayable: payableVal,
                status: computedStatus,
                notes: formData.notes.trim(),
              }
            : s
        )
      );
      showNotification(`Supplier "${formData.name.trim()}" updated successfully`, 'success');
    } else {
      const newSupplier: Supplier = {
        id: `sup-${Date.now()}`,
        name: formData.name.trim(),
        contactPerson: formData.contactPerson.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        accountsPayable: payableVal,
        status: computedStatus,
        notes: formData.notes.trim(),
        createdAt: new Date().toISOString(),
      };
      setSuppliers(prev => [newSupplier, ...prev]);
      showNotification(`New supplier "${formData.name.trim()}" added successfully`, 'success');
    }

    setShowFormModal(false);
  };

  // Handle Delete Supplier
  const handleDeleteSupplier = () => {
    if (!deleteConfirmModal.supplier) return;
    const targetId = deleteConfirmModal.supplier.id;
    const targetName = deleteConfirmModal.supplier.name;

    setSuppliers(prev => prev.filter(s => s.id !== targetId));
    showNotification(`Supplier "${targetName}" removed`, 'success');
    setDeleteConfirmModal({ show: false, supplier: null });
  };

  // Filtered suppliers
  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch =
      supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || supplier.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Summary statistics
  const totalSuppliersCount = suppliers.length;
  const totalAccountsPayable = suppliers.reduce((sum, s) => sum + s.accountsPayable, 0);
  const unpaidCount = suppliers.filter(s => s.status === 'Unpaid').length;
  const paidCount = suppliers.filter(s => s.status === 'Paid').length;

  return (
    <div className="min-h-screen p-4 sm:p-6 bg-gradient-to-br from-[#ebdcfc] via-[#f3e8ff] to-[#e2f7e5] animate-slide-in-right">
      {/* Mobile Top Header */}
      <div className="lg:hidden flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-slate-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
          >
            <Menu size={24} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Suppliers</h1>
            <p className="text-xs text-slate-500">Manage vendor accounts payable</p>
          </div>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <Truck size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Suppliers</h1>
              <p className="text-sm text-slate-500">Directory of suppliers, vendors, and accounts payable balances</p>
            </div>
          </div>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all active:scale-95"
        >
          <Plus size={18} />
          <span>New Supplier</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Building2 size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Suppliers</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">{totalSuppliersCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Accounts Payable</p>
            <p className="text-xl font-extrabold text-amber-700 mt-0.5">
              ₱{totalAccountsPayable.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Unpaid Accounts</p>
            <p className="text-2xl font-extrabold text-red-600 mt-0.5">{unpaidCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Settled Accounts</p>
            <p className="text-2xl font-extrabold text-emerald-600 mt-0.5">{paidCount}</p>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Controls Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="relative flex-1 sm:w-80">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search suppliers by name or contact..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all placeholder-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex bg-slate-200/80 p-1 rounded-xl text-xs font-semibold">
              {(['All', 'Unpaid', 'Paid'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    statusFilter === tab
                      ? 'bg-white text-purple-700 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3">
            <span className="text-xs text-slate-500 font-medium">
              Showing {filteredSuppliers.length} of {suppliers.length} suppliers
            </span>
            <button
              onClick={handleOpenAddModal}
              className="lg:hidden flex items-center space-x-1.5 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl font-semibold text-xs transition-all"
            >
              <Plus size={16} />
              <span>New Supplier</span>
            </button>
          </div>
        </div>

        {/* Table Layout */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-100/90 border-b border-slate-200 text-xs uppercase text-slate-700 tracking-wider font-semibold">
              <tr>
                <th className="px-4 py-3.5 text-center w-16">Edit</th>
                <th className="px-4 py-3.5 text-center w-16">View</th>
                <th className="px-5 py-3.5 text-left font-bold text-slate-800">Name</th>
                <th className="px-6 py-3.5 text-right font-bold text-slate-800">Accounts payable</th>
                <th className="px-4 py-3.5 text-center font-bold text-slate-800 w-28">Status</th>
                <th className="px-4 py-3.5 text-center w-16">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <Truck size={48} className="mx-auto mb-4 text-slate-300" />
                    <p className="text-lg font-semibold text-slate-700">No suppliers found</p>
                    <p className="text-sm mt-1 text-slate-400">
                      {searchQuery ? `No matches for "${searchQuery}"` : 'Click "New Supplier" to register vendor'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map(supplier => (
                  <tr key={supplier.id} className="hover:bg-slate-50/80 transition-colors border-b border-slate-100">
                    {/* Edit Button Column */}
                    <td className="px-3 py-4 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(supplier)}
                        className="p-1.5 text-slate-600 hover:bg-slate-100 hover:text-purple-600 rounded-lg transition-colors inline-flex items-center justify-center"
                        title="Edit supplier"
                      >
                        <Edit2 size={16} />
                      </button>
                    </td>

                    {/* View Button Column */}
                    <td className="px-3 py-4 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setViewSupplierModal({ show: true, supplier })}
                        className="p-1.5 text-slate-600 hover:bg-slate-100 hover:text-purple-600 rounded-lg transition-colors inline-flex items-center justify-center"
                        title="View supplier details"
                      >
                        <Eye size={16} />
                      </button>
                    </td>

                    {/* Supplier Name */}
                    <td className="px-5 py-4 text-sm font-semibold text-slate-900">
                      <div>{supplier.name}</div>
                      {supplier.contactPerson && (
                        <div className="text-xs text-slate-500 font-normal mt-0.5 flex items-center gap-1">
                          <User size={12} className="text-slate-400" />
                          <span>{supplier.contactPerson}</span>
                        </div>
                      )}
                    </td>

                    {/* Accounts Payable */}
                    <td className="px-6 py-4 text-sm font-extrabold text-amber-700 text-right whitespace-nowrap font-mono">
                      {supplier.accountsPayable.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>

                    {/* Status Badge */}
                    <td className="px-4 py-4 text-center whitespace-nowrap">
                      {supplier.status === 'Unpaid' ? (
                        <span className="inline-block px-3 py-1 rounded-md text-xs font-extrabold bg-red-500 text-white shadow-xs">
                          Unpaid
                        </span>
                      ) : (
                        <span className="inline-block px-3 py-1 rounded-md text-xs font-extrabold bg-emerald-500 text-white shadow-xs">
                          Paid
                        </span>
                      )}
                    </td>

                    {/* Actions Column */}
                    <td className="px-3 py-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => setDeleteConfirmModal({ show: true, supplier })}
                        className="p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors"
                        title="Delete Supplier"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: New / Edit Supplier Modal */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-scale-in flex flex-col">
            <div className="px-6 py-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <Building2 size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    {editingSupplier ? 'Edit Supplier' : 'New Supplier'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {editingSupplier ? 'Update supplier information and balance' : 'Add a new vendor to the suppliers directory'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowFormModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg transition-colors font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Supplier / Company Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cottonseed, Inc."
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Manager Name"
                    value={formData.contactPerson}
                    onChange={e => setFormData({ ...formData, contactPerson: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 0917-123-4567"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="e.g. supplier@domain.com"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Business Address
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cebu City, Philippines"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Accounts Payable (₱)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.accountsPayable}
                    onChange={e => setFormData({ ...formData, accountsPayable: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                  />
                </div>

                  <AnimatedSelect
                    label="Payment Status"
                    value={formData.status}
                    options={[
                      { value: 'Unpaid', label: 'Unpaid' },
                      { value: 'Paid', label: 'Paid' },
                    ]}
                    onChange={(val) => setFormData({ ...formData, status: val as 'Paid' | 'Unpaid' })}
                  />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Notes & Remarks
                </label>
                <textarea
                  rows={3}
                  placeholder="Additional vendor terms, provided products, or notes..."
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                />
              </div>

              <div className="pt-4 flex items-center justify-end space-x-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-sm font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-95"
                >
                  {editingSupplier ? 'Save Changes' : 'Create Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: View Supplier Details Modal */}
      {viewSupplierModal.show && viewSupplierModal.supplier && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in"
          onClick={() => setViewSupplierModal({ show: false, supplier: null })}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-scale-in flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-purple-50 to-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900">{viewSupplierModal.supplier.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">Supplier Profile & Financial Overview</p>
              </div>
              <button
                onClick={() => setViewSupplierModal({ show: false, supplier: null })}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg transition-colors font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="p-4 bg-purple-50 rounded-xl border border-purple-200 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-purple-700 uppercase tracking-wider">Accounts Payable</p>
                  <p className="text-2xl font-extrabold text-slate-900 mt-0.5 font-mono">
                    ₱{viewSupplierModal.supplier.accountsPayable.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
                <div>
                  {viewSupplierModal.supplier.status === 'Unpaid' ? (
                    <span className="px-4 py-1.5 rounded-lg text-xs font-extrabold bg-red-500 text-white shadow-xs">
                      Unpaid
                    </span>
                  ) : (
                    <span className="px-4 py-1.5 rounded-lg text-xs font-extrabold bg-emerald-500 text-white shadow-xs">
                      Paid
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center space-x-3 text-slate-700">
                  <User size={16} className="text-purple-600 flex-shrink-0" />
                  <span className="font-semibold text-slate-500 w-28">Contact Person:</span>
                  <span className="font-bold text-slate-900">{viewSupplierModal.supplier.contactPerson || '-'}</span>
                </div>

                <div className="flex items-center space-x-3 text-slate-700">
                  <Phone size={16} className="text-purple-600 flex-shrink-0" />
                  <span className="font-semibold text-slate-500 w-28">Phone:</span>
                  <span className="font-bold text-slate-900">{viewSupplierModal.supplier.phone || '-'}</span>
                </div>

                <div className="flex items-center space-x-3 text-slate-700">
                  <Mail size={16} className="text-purple-600 flex-shrink-0" />
                  <span className="font-semibold text-slate-500 w-28">Email:</span>
                  <span className="font-bold text-slate-900">{viewSupplierModal.supplier.email || '-'}</span>
                </div>

                <div className="flex items-start space-x-3 text-slate-700">
                  <MapPin size={16} className="text-purple-600 flex-shrink-0 mt-0.5" />
                  <span className="font-semibold text-slate-500 w-28">Address:</span>
                  <span className="font-medium text-slate-900">{viewSupplierModal.supplier.address || '-'}</span>
                </div>
              </div>

              {viewSupplierModal.supplier.notes && (
                <div className="pt-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Remarks / Products</p>
                  <p className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 leading-relaxed">
                    {viewSupplierModal.supplier.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button
                onClick={() => {
                  const sup = viewSupplierModal.supplier;
                  setViewSupplierModal({ show: false, supplier: null });
                  if (sup) handleOpenEditModal(sup);
                }}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all"
              >
                Edit Supplier
              </button>
              <button
                onClick={() => setViewSupplierModal({ show: false, supplier: null })}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Delete Supplier Confirmation Modal */}
      {deleteConfirmModal.show && deleteConfirmModal.supplier && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-in">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={24} className="text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Delete Supplier</h3>
                <p className="text-xs text-slate-500">This action will remove the supplier record</p>
              </div>
            </div>

            <p className="text-sm text-slate-700 mb-6">
              Are you sure you want to delete supplier{' '}
              <strong className="text-slate-900">"{deleteConfirmModal.supplier.name}"</strong>?
            </p>

            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirmModal({ show: false, supplier: null })}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSupplier}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center space-x-1.5"
              >
                <Trash2 size={16} />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
