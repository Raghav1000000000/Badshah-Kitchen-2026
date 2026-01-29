"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/lib/adminAuth";
import { supabase } from "@/lib/supabase";

type MenuItem = {
  id: string;
  name: string;
  category: string;
  price: number;
  is_available: boolean;
  is_special: boolean;
  created_at: string;
};

type DailyStats = {
  totalOrders: number;
  totalRevenue: number;
  completedOrders: number;
  averageOrderValue: number;
  ordersByStatus: Record<string, number>;
  popularItems: { name: string; count: number; revenue: number }[];
  feedbackStats: {
    totalFeedbacks: number;
    averageRating: number;
    ratingDistribution: Record<number, number>;
  };
};

export default function AdminPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading, signOut } = useAdminAuth();
  const [activeTab, setActiveTab] = useState<'menu' | 'stats'>('menu');
  
  // Menu state
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Category state
  const [categories, setCategories] = useState<string[]>(['Starters', 'Main Course', 'Breads', 'Rice', 'Desserts', 'Beverages']);
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  
  // Stats state
  const [stats, setStats] = useState<DailyStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  
  // Modal state for details
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showOrdersModal, setShowOrdersModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [feedbackDetails, setFeedbackDetails] = useState<any[]>([]);
  const [orderDetails, setOrderDetails] = useState<any[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: 'Starters',
    price: '',
    is_available: true,
    is_special: false
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/admin/login');
    }
  }, [isAuthenticated, authLoading, router]);

  // Fetch menu items
  useEffect(() => {
    if (isAuthenticated && activeTab === 'menu') {
      fetchMenuItems();
      loadCategories();
    }
  }, [isAuthenticated, activeTab]);

  // Fetch stats
  useEffect(() => {
    if (isAuthenticated && activeTab === 'stats') {
      fetchDailyStats();
    }
  }, [isAuthenticated, activeTab]);

  const fetchMenuItems = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      setMenuItems(data || []);
    } catch (error) {
      console.error('Error fetching menu items:', error);
      alert('Failed to load menu items');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('category');

      if (error) throw error;
      
      // Get unique categories from database
      const uniqueCategories = [...new Set(data?.map(item => item.category).filter(Boolean))] as string[];
      
      // Merge with default categories
      const defaultCategories = ['Starters', 'Main Course', 'Breads', 'Rice', 'Desserts', 'Beverages'];
      const allCategories = [...new Set([...defaultCategories, ...uniqueCategories])];
      
      setCategories(allCategories.sort());
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleRenameCategory = async (oldName: string, newName: string) => {
    if (!newName.trim() || oldName === newName) {
      setEditingCategory(null);
      return;
    }

    if (categories.includes(newName)) {
      alert('Category already exists!');
      return;
    }

    try {
      const { error } = await supabase
        .from('menu_items')
        .update({ category: newName })
        .eq('category', oldName);

      if (error) throw error;

      alert(`Renamed "${oldName}" to "${newName}"`);
      setEditingCategory(null);
      setEditCategoryName('');
      // Fetch both in parallel
      await Promise.all([loadCategories(), fetchMenuItems()]);
    } catch (error) {
      console.error('Error renaming category:', error);
      alert('Failed to rename category');
    }
  };

  const handleDeleteCategory = async (categoryName: string) => {
    const itemsInCategory = menuItems.filter(item => item.category === categoryName);
    
    if (itemsInCategory.length > 0) {
      if (!confirm(
        `"${categoryName}" has ${itemsInCategory.length} item(s).\n\n` +
        `Delete all items in this category?`
      )) return;

      try {
        const { error } = await supabase
          .from('menu_items')
          .delete()
          .eq('category', categoryName);

        if (error) throw error;

        alert(`Deleted category "${categoryName}" and ${itemsInCategory.length} item(s)`);
        // Fetch both in parallel
        await Promise.all([loadCategories(), fetchMenuItems()]);
      } catch (error) {
        console.error('Error deleting category:', error);
        alert('Failed to delete category');
      }
    } else {
      alert(`Category "${categoryName}" has no items.`);
    }
  };

  const fetchDailyStats = async () => {
    setStatsLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Fetch today's orders
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            quantity,
            item_name,
            item_price_at_order
          )
        `)
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`);

      if (ordersError) throw ordersError;

      // Fetch today's feedback (via orders.created_at since feedback might not have migration)
      const todayOrderIds = orders?.map(o => o.id) || [];
      
      const { data: feedbacks, error: feedbackError } = todayOrderIds.length > 0
        ? await supabase
            .from('feedback')
            .select('rating')
            .in('order_id', todayOrderIds)
        : { data: [], error: null };

      if (feedbackError) throw feedbackError;

      // Calculate order stats
      const totalOrders = orders?.length || 0;
      const completedOrders = orders?.filter(o => o.status === 'COMPLETED').length || 0;
      const totalRevenue = orders?.reduce((sum, order) => sum + order.total_amount, 0) || 0;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      
      const ordersByStatus: Record<string, number> = {};
      orders?.forEach(order => {
        ordersByStatus[order.status] = (ordersByStatus[order.status] || 0) + 1;
      });

      // Calculate popular items
      const itemCounts: Record<string, { count: number; revenue: number }> = {};
      orders?.forEach(order => {
        order.order_items?.forEach((item: any) => {
          const name = item.item_name || 'Unknown';
          const price = item.item_price_at_order || 0;
          if (!itemCounts[name]) {
            itemCounts[name] = { count: 0, revenue: 0 };
          }
          itemCounts[name].count += item.quantity;
          itemCounts[name].revenue += price * item.quantity;
        });
      });

      const popularItems = Object.entries(itemCounts)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Calculate feedback stats
      const totalFeedbacks = feedbacks?.length || 0;
      const averageRating = totalFeedbacks > 0
        ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / totalFeedbacks
        : 0;
      
      const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      feedbacks?.forEach(f => {
        ratingDistribution[f.rating] = (ratingDistribution[f.rating] || 0) + 1;
      });

      setStats({
        totalOrders,
        totalRevenue,
        completedOrders,
        averageOrderValue,
        ordersByStatus,
        popularItems,
        feedbackStats: {
          totalFeedbacks,
          averageRating,
          ratingDistribution
        }
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      alert('Failed to load stats');
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchFeedbackDetails = async () => {
    setLoadingDetails(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data: orders } = await supabase
        .from('orders')
        .select('id')
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`);
      
      const todayOrderIds = orders?.map(o => o.id) || [];
      
      if (todayOrderIds.length > 0) {
        const { data, error } = await supabase
          .from('feedback')
          .select(`
            *,
            orders (
              order_number,
              customer_name
            )
          `)
          .in('order_id', todayOrderIds);
        
        if (error) throw error;
        setFeedbackDetails(data || []);
      } else {
        setFeedbackDetails([]);
      }
      setShowFeedbackModal(true);
    } catch (error) {
      console.error('Error fetching feedback details:', error);
      alert('Failed to load feedback details');
    } finally {
      setLoadingDetails(false);
    }
  };

  const fetchOrdersByStatus = async (status: string) => {
    setLoadingDetails(true);
    setSelectedStatus(status);
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            quantity,
            menu_items (
              name
            )
          )
        `)
        .eq('status', status)
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setOrderDetails(data || []);
      setShowOrdersModal(true);
    } catch (error) {
      console.error('Error fetching order details:', error);
      alert('Failed to load order details');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('menu_items')
        .insert([{
          name: formData.name,
          category: formData.category,
          price: parseInt(formData.price) * 100, // Convert rupees to paise
          is_available: formData.is_available,
          is_special: formData.is_special
        }]);

      if (error) throw error;
      
      alert('Menu item added successfully!');
      setShowAddForm(false);
      resetForm();
      fetchMenuItems();
      loadCategories();
    } catch (error) {
      console.error('Error adding item:', error);
      alert('Failed to add menu item');
    }
  };

  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      const { error } = await supabase
        .from('menu_items')
        .update({
          name: formData.name,
          category: formData.category,
          price: parseInt(formData.price) * 100, // Convert rupees to paise
          is_available: formData.is_available,
          is_special: formData.is_special
        })
        .eq('id', editingItem.id);

      if (error) throw error;
      
      alert('Menu item updated successfully!');
      setEditingItem(null);
      resetForm();
      fetchMenuItems();
      loadCategories();
    } catch (error) {
      console.error('Error updating item:', error);
      alert('Failed to update menu item');
    }
  };

  const handleDeleteItem = async (id: string, name: string) => {
    if (!confirm(
      `Are you sure you want to delete "${name}"?\n\n` +
      `This will remove it from the menu. Order history will be preserved.`
    )) return;

    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      alert('Menu item deleted successfully!');
      fetchMenuItems();
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete menu item. Please try again.');
    }
  };

  const startEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      price: (item.price / 100).toString(),
      is_available: item.is_available,
      is_special: item.is_special
    });
    setShowAddForm(false);
    // Scroll to form
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'Starters',
      price: '',
      is_available: true,
      is_special: false
    });
    setIsNewCategory(false);
    setNewCategoryName('');
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to log out?')) {
      signOut();
      router.push('/admin/login');
    }
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
              <p className="text-sm text-gray-600">Manage menu and view statistics</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('menu')}
              className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                activeTab === 'menu'
                  ? 'border-orange-600 text-orange-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Menu Management
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                activeTab === 'stats'
                  ? 'border-orange-600 text-orange-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Daily Statistics
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'menu' && (
          <div className="space-y-6">
            {/* Action Buttons and Filter */}
            <div className="space-y-4">
              <div className="flex justify-between items-center flex-wrap gap-3">
                <h2 className="text-xl font-bold text-gray-900">Menu Items ({menuItems.length})</h2>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowAddForm(true);
                      setEditingItem(null);
                      resetForm();
                    }}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold"
                  >
                    + Add Menu Item
                  </button>
                  <button
                    onClick={() => setShowCategoryManager(!showCategoryManager)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                  >
                    🏷️ Manage Categories
                  </button>
                </div>
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-gray-700">Filter by:</span>
                <button
                  onClick={() => setSelectedCategoryFilter(null)}
                  className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                    selectedCategoryFilter === null
                      ? 'bg-orange-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All ({menuItems.length})
                </button>
                {categories.map(category => {
                  const count = menuItems.filter(item => item.category === category).length;
                  if (count === 0) return null;
                  return (
                    <button
                      key={category}
                      onClick={() => setSelectedCategoryFilter(category)}
                      className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                        selectedCategoryFilter === category
                          ? 'bg-orange-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {category} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Category Manager Modal */}
            {showCategoryManager && (
              <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Manage Categories</h3>
                  <button
                    onClick={() => {
                      setShowCategoryManager(false);
                      setEditingCategory(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-3">
                  {categories.map(category => {
                    const itemCount = menuItems.filter(item => item.category === category).length;
                    return (
                      <div key={category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        {editingCategory === category ? (
                          <input
                            type="text"
                            value={editCategoryName}
                            onChange={(e) => setEditCategoryName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleRenameCategory(category, editCategoryName);
                              } else if (e.key === 'Escape') {
                                setEditingCategory(null);
                                setEditCategoryName('');
                              }
                            }}
                            className="flex-1 px-3 py-1 border border-orange-500 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            autoFocus
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{category}</span>
                            <span className="text-sm text-gray-500">({itemCount} items)</span>
                          </div>
                        )}
                        <div className="flex gap-2">
                          {editingCategory === category ? (
                            <>
                              <button
                                onClick={() => handleRenameCategory(category, editCategoryName)}
                                className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                              >
                                ✓ Save
                              </button>
                              <button
                                onClick={() => {
                                  setEditingCategory(null);
                                  setEditCategoryName('');
                                }}
                                className="px-3 py-1 text-sm bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => {
                                  setEditingCategory(category);
                                  setEditCategoryName(category);
                                }}
                                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                              >
                                Rename
                              </button>
                              <button
                                onClick={() => handleDeleteCategory(category)}
                                className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                                disabled={itemCount === 0}
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Category Manager Modal */}
            {showCategoryManager && (
              <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Manage Categories</h3>
                  <button
                    onClick={() => {
                      setShowCategoryManager(false);
                      setEditingCategory(null);
                    }}
                    className="text-gray-400 hover:text-gray-600 text-xl"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-3">
                  {categories.map(category => {
                    const itemCount = menuItems.filter(item => item.category === category).length;
                    return (
                      <div key={category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        {editingCategory === category ? (
                          <input
                            type="text"
                            value={editCategoryName}
                            onChange={(e) => setEditCategoryName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleRenameCategory(category, editCategoryName);
                              } else if (e.key === 'Escape') {
                                setEditingCategory(null);
                                setEditCategoryName('');
                              }
                            }}
                            className="flex-1 px-3 py-1 border border-orange-500 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            autoFocus
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{category}</span>
                            <span className="text-sm text-gray-500">({itemCount} items)</span>
                          </div>
                        )}
                        <div className="flex gap-2">
                          {editingCategory === category ? (
                            <>
                              <button
                                onClick={() => handleRenameCategory(category, editCategoryName)}
                                className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                              >
                                ✓ Save
                              </button>
                              <button
                                onClick={() => {
                                  setEditingCategory(null);
                                  setEditCategoryName('');
                                }}
                                className="px-3 py-1 text-sm bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => {
                                  setEditingCategory(category);
                                  setEditCategoryName(category);
                                }}
                                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                              >
                                Rename
                              </button>
                              {itemCount > 0 && (
                                <button
                                  onClick={() => handleDeleteCategory(category)}
                                  className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                                >
                                  Delete ({itemCount})
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Add/Edit Form */}
            {(showAddForm || editingItem) && (
              <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
                </h3>
                <form onSubmit={editingItem ? handleUpdateItem : handleAddItem} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="Chicken Tikka"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category *
                      </label>
                      <select
                        value={isNewCategory ? '__new__' : formData.category}
                        onChange={(e) => {
                          if (e.target.value === '__new__') {
                            setIsNewCategory(true);
                            setNewCategoryName('');
                          } else {
                            setIsNewCategory(false);
                            setFormData({ ...formData, category: e.target.value });
                          }
                        }}
                        required={!isNewCategory}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      >
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                        <option value="__new__">➕ Add New Category</option>
                      </select>
                      {isNewCategory && (
                        <div className="mt-2">
                          <input
                            type="text"
                            value={newCategoryName}
                            onChange={(e) => {
                              setNewCategoryName(e.target.value);
                              setFormData({ ...formData, category: e.target.value });
                            }}
                            required
                            placeholder="Enter new category name"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            autoFocus
                          />
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Price (₹) *
                      </label>
                      <input
                        type="number"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        required
                        min="0"
                        step="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="299"
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.is_available}
                        onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                        className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                      />
                      <label className="ml-2 text-sm text-gray-700">
                        Available for ordering
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.is_special}
                        onChange={(e) => setFormData({ ...formData, is_special: e.target.checked })}
                        className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                      />
                      <label className="ml-2 text-sm text-gray-700">
                        Mark as special/featured item
                      </label>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold"
                    >
                      {editingItem ? '✓ Update Item' : '+ Add Item'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddForm(false);
                        setEditingItem(null);
                        resetForm();
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                    >
                      ✕ Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Menu Items List */}
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {menuItems
                  .filter(item => selectedCategoryFilter === null || item.category === selectedCategoryFilter)
                  .map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-lg shadow p-6 border border-gray-200 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded ${
                            item.is_available
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {item.is_available ? 'Available' : 'Unavailable'}
                          </span>
                          {item.is_special && (
                            <span className="px-2 py-1 text-xs font-medium rounded bg-yellow-100 text-yellow-800">
                              ⭐ Special
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{item.category}</p>
                        <p className="text-lg font-bold text-orange-600">₹{item.price / 100}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(item)}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id, item.name)}
                          className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Today&apos;s Statistics</h2>
              <button
                onClick={fetchDailyStats}
                disabled={statsLoading}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors"
              >
                {statsLoading ? 'Loading...' : 'Refresh'}
              </button>
            </div>

            {statsLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
              </div>
            ) : stats ? (
              <div className="space-y-6">
                {/* Overview Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
                    <h3 className="text-xs font-medium text-gray-600 mb-1">Total Orders</h3>
                    <p className="text-3xl font-bold text-gray-900">{stats.totalOrders}</p>
                  </div>
                  <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
                    <h3 className="text-xs font-medium text-gray-600 mb-1">Completed</h3>
                    <p className="text-3xl font-bold text-green-600">{stats.completedOrders}</p>
                  </div>
                  <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
                    <h3 className="text-xs font-medium text-gray-600 mb-1">Total Revenue</h3>
                    <p className="text-2xl font-bold text-orange-600">₹{(stats.totalRevenue / 100).toFixed(0)}</p>
                  </div>
                  <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
                    <h3 className="text-xs font-medium text-gray-600 mb-1">Avg Order</h3>
                    <p className="text-2xl font-bold text-blue-600">₹{(stats.averageOrderValue / 100).toFixed(0)}</p>
                  </div>
                </div>

                {/* Customer Feedback */}
                {stats.feedbackStats && (
                  <div 
                    onClick={() => fetchFeedbackDetails()}
                    className="bg-white rounded-lg shadow p-6 border border-gray-200 cursor-pointer hover:shadow-lg transition-shadow"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
                      Customer Feedback
                      <span className="text-xs text-gray-500 font-normal">(Click to view details)</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <p className="text-sm text-gray-600">Total Feedbacks</p>
                            <p className="text-3xl font-bold text-gray-900">{stats.feedbackStats.totalFeedbacks}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-600">Average Rating</p>
                            <p className="text-3xl font-bold text-yellow-500">{stats.feedbackStats.averageRating.toFixed(1)} ⭐</p>
                          </div>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Rating Distribution</p>
                        <div className="space-y-2">
                          {[5, 4, 3, 2, 1].map(rating => (
                            <div key={rating} className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-700 w-8">{rating} ⭐</span>
                              <div className="flex-1 bg-gray-200 rounded-full h-5">
                                <div
                                  className="bg-yellow-500 h-5 rounded-full flex items-center justify-end px-2"
                                  style={{
                                    width: stats.feedbackStats.totalFeedbacks > 0
                                      ? `${(stats.feedbackStats.ratingDistribution[rating] / stats.feedbackStats.totalFeedbacks) * 100}%`
                                      : '0%'
                                  }}
                                >
                                  {stats.feedbackStats.ratingDistribution[rating] > 0 && (
                                    <span className="text-xs font-medium text-white">{stats.feedbackStats.ratingDistribution[rating]}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Orders by Status */}
                <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
                    Order Status
                    <span className="text-xs text-gray-500 font-normal">(Click status to view details)</span>
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
                    {Object.entries(stats.ordersByStatus).map(([status, count]) => (
                      <button
                        key={status}
                        onClick={() => fetchOrdersByStatus(status)}
                        className="text-center p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer border border-gray-200"
                      >
                        <p className="text-2xl font-bold text-gray-900">{count}</p>
                        <p className="text-sm text-gray-600">{status}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Popular Items */}
                <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 5 Popular Items</h3>
                  <div className="space-y-3">
                    {stats.popularItems.length > 0 ? (
                      stats.popularItems.map((item, index) => (
                        <div key={item.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                            <span className="font-medium text-gray-900">{item.name}</span>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-gray-900">{item.count} orders</p>
                            <p className="text-xs text-gray-600">₹{(item.revenue / 100).toFixed(0)}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-gray-500 py-4">No orders yet today</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-600">
                No data available. Click Refresh to load stats.
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Feedback Details Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => setShowFeedbackModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-amber-700 text-white p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold">Feedback Details</h2>
              <button onClick={() => setShowFeedbackModal(false)} className="text-white hover:text-gray-200">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-88px)]">
              {loadingDetails ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-700 mx-auto"></div>
                </div>
              ) : feedbackDetails.length > 0 ? (
                <div className="space-y-4">
                  {feedbackDetails.map((feedback) => (
                    <div key={feedback.id} className="border border-stone-200 rounded-lg p-4 bg-stone-50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-stone-800">Order #{feedback.orders?.order_number}</span>
                          <span className="text-sm text-stone-600">{feedback.orders?.customer_name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <svg key={i} className={`w-5 h-5 ${i < feedback.rating ? 'text-yellow-500 fill-current' : 'text-gray-300'}`} viewBox="0 0 24 24">
                              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                            </svg>
                          ))}
                          <span className="ml-2 font-bold text-amber-700">{feedback.rating}/5</span>
                        </div>
                      </div>
                      {feedback.comment && (
                        <p className="text-stone-700 italic bg-white p-3 rounded border border-stone-200 mt-2">&quot;{feedback.comment}&quot;</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">No feedback available for today</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Orders by Status Modal */}
      {showOrdersModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => setShowOrdersModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-amber-700 text-white p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold">{selectedStatus} Orders</h2>
              <button onClick={() => setShowOrdersModal(false)} className="text-white hover:text-gray-200">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-88px)]">
              {loadingDetails ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-700 mx-auto"></div>
                </div>
              ) : orderDetails.length > 0 ? (
                <div className="space-y-4">
                  {orderDetails.map((order) => (
                    <div key={order.id} className="border border-stone-200 rounded-lg p-4 bg-stone-50">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <span className="font-bold text-xl text-amber-700">Order #{order.order_number}</span>
                          <p className="text-sm text-stone-600 mt-1">{order.customer_name} - {order.customer_phone}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-stone-800">₹{(order.total_amount / 100).toFixed(0)}</p>
                          <p className="text-xs text-stone-500">{new Date(order.created_at).toLocaleTimeString('en-IN')}</p>
                        </div>
                      </div>
                      <div className="space-y-2 mt-3 pt-3 border-t border-stone-200">
                        {order.order_items?.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span className="text-stone-700">{item.menu_items?.name} x {item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">No {selectedStatus} orders for today</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
