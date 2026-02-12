
import React, { useState, useEffect } from 'react';
import { Users, Plus, Mail, CheckCircle, Ban, Trash2, X, Lock } from 'lucide-react';
import { Button } from '../UI/Button';
import { UserProfile } from '../../types';
import { getStaffMembers, inviteStaffMember, updateStaffPermissions, toggleStaffBlock, removeStaff } from '../../services/staffService';
import { useToast } from '../../context/ToastContext';
import { Checkbox } from '../UI/Checkbox';

interface StaffManagementProps {
  userId: string;
}

const AVAILABLE_PERMISSIONS = [
  { id: 'overview', label: 'Overview Dashboard' },
  { id: 'bookings', label: 'Live Sessions & Bookings' },
  { id: 'orders', label: 'Kitchen Display' },
  { id: 'billing', label: 'Billing & POS' },
  { id: 'reservations', label: 'Reservations Manager' },
  { id: 'tables', label: 'Table Management' },
  { id: 'menu', label: 'Menu Editor' },
  { id: 'offers', label: 'Offers & Coupons' },
  { id: 'reviews', label: 'Reviews' },
  { id: 'ai-photography', label: 'AI Studio' },
  { id: 'wallet', label: 'Wallet View' },
  { id: 'settings', label: 'Settings' }
];

export const StaffManagement: React.FC<StaffManagementProps> = ({ userId }) => {
  const { showToast } = useToast();
  const [staff, setStaff] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [editingStaff, setEditingStaff] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    permissions: ['overview', 'orders', 'bookings'] as string[]
  });

  useEffect(() => {
    loadStaff();
  }, [userId]);

  const loadStaff = async () => {
    setIsLoading(true);
    const data = await getStaffMembers(userId);
    setStaff(data);
    setIsLoading(false);
  };

  const handleOpenModal = (staffMember?: UserProfile) => {
    if (staffMember) {
      setEditingStaff(staffMember);
      setFormData({
        name: staffMember.displayName || '',
        email: staffMember.email || '',
        permissions: staffMember.permissions || []
      });
    } else {
      setEditingStaff(null);
      setFormData({
        name: '',
        email: '',
        permissions: ['overview', 'orders', 'bookings'] // Default permissions
      });
    }
    setIsModalOpen(true);
  };

  const handleTogglePermission = (permId: string) => {
    setFormData(prev => {
      if (prev.permissions.includes(permId)) {
        return { ...prev, permissions: prev.permissions.filter(p => p !== permId) };
      } else {
        return { ...prev, permissions: [...prev.permissions, permId] };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.name) {
      showToast("Name and email are required.", "error");
      return;
    }
    
    setIsSubmitting(true);
    try {
      if (editingStaff) {
        // Update permissions only
        await updateStaffPermissions(editingStaff.uid, formData.permissions);
        setStaff(prev => prev.map(s => s.uid === editingStaff.uid ? { ...s, permissions: formData.permissions } : s));
        showToast("Permissions updated.", "success");
      } else {
        // Invite new
        const result = await inviteStaffMember(userId, formData.email, formData.name, formData.permissions);
        if (result.success && result.newUser) {
          setStaff(prev => [...prev, result.newUser!]);
          showToast(result.message, "success");
        } else {
          showToast(result.message, "error");
        }
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error(error);
      showToast("Operation failed.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBlockToggle = async (s: UserProfile) => {
    const newStatus = !s.isStaffBlocked;
    const success = await toggleStaffBlock(s.uid, newStatus);
    if (success) {
      setStaff(prev => prev.map(u => u.uid === s.uid ? { ...u, isStaffBlocked: newStatus } : u));
      showToast(`Staff member ${newStatus ? 'blocked' : 'unblocked'}.`, "info");
    }
  };

  const handleRemove = async (s: UserProfile) => {
    if (!confirm(`Are you sure you want to remove ${s.displayName}? They will lose all access.`)) return;
    const success = await removeStaff(s.uid);
    if (success) {
      setStaff(prev => prev.filter(u => u.uid !== s.uid));
      showToast("Staff member removed.", "success");
    }
  };

  return (
    <div className="animate-fade-in-up pb-10">
      <div className="flex justify-between items-center mb-8">
        <div>
           <h2 className="text-2xl font-bold text-gray-900">Staff Management</h2>
           <p className="text-gray-500">Manage access and roles for your team.</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
           <Plus size={20} className="mr-2" /> Add Staff
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-gray-400">Loading team...</div>
      ) : staff.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
           <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
              <Users size={32} />
           </div>
           <h3 className="text-lg font-bold text-gray-900 mb-2">No staff members yet</h3>
           <p className="text-gray-500 mb-6">Invite your team to help manage the restaurant.</p>
           <Button variant="outline" onClick={() => handleOpenModal()}>Invite First Member</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {staff.map(s => (
             <div key={s.uid} className={`bg-white p-5 rounded-2xl shadow-sm border transition-all ${s.isStaffBlocked ? 'border-red-200 bg-red-50/30' : 'border-gray-200 hover:border-primary-200'}`}>
                <div className="flex justify-between items-start mb-4">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-bold text-lg">
                         {s.displayName?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                         <h3 className="font-bold text-gray-900 leading-tight">{s.displayName}</h3>
                         <p className="text-xs text-gray-500">{s.email}</p>
                      </div>
                   </div>
                   {s.invitationStatus === 'pending' ? (
                      <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-1 rounded font-bold uppercase flex items-center gap-1"><Mail size={10}/> Invited</span>
                   ) : s.isStaffBlocked ? (
                      <span className="text-[10px] bg-red-100 text-red-700 px-2 py-1 rounded font-bold uppercase flex items-center gap-1"><Lock size={10}/> Blocked</span>
                   ) : (
                      <span className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded font-bold uppercase flex items-center gap-1"><CheckCircle size={10}/> Active</span>
                   )}
                </div>
                
                <div className="mb-4">
                   <p className="text-xs font-bold text-gray-400 uppercase mb-2">Access</p>
                   <div className="flex flex-wrap gap-1">
                      {s.permissions?.slice(0, 4).map(p => (
                         <span key={p} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded capitalize border border-gray-200">
                            {p.replace('-', ' ')}
                         </span>
                      ))}
                      {(s.permissions?.length || 0) > 4 && (
                         <span className="text-[10px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded border border-gray-200">
                            +{(s.permissions?.length || 0) - 4} more
                         </span>
                      )}
                   </div>
                </div>

                <div className="flex gap-2 pt-4 border-t border-gray-100">
                   <button onClick={() => handleOpenModal(s)} className="flex-1 py-2 text-xs font-bold bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Permissions</button>
                   <button onClick={() => handleBlockToggle(s)} className={`p-2 rounded-lg border transition-colors ${s.isStaffBlocked ? 'bg-green-50 text-green-600 border-green-200' : 'bg-white text-orange-600 border-gray-200 hover:bg-orange-50'}`} title={s.isStaffBlocked ? "Unblock" : "Block Access"}>
                      <Ban size={16} />
                   </button>
                   <button onClick={() => handleRemove(s)} className="p-2 bg-white text-red-500 border border-gray-200 rounded-lg hover:bg-red-50 hover:border-red-200 transition-colors" title="Remove Staff">
                      <Trash2 size={16} />
                   </button>
                </div>
             </div>
           ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
           <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                 <h3 className="text-xl font-bold text-gray-900">{editingStaff ? 'Edit Staff Access' : 'Invite New Staff'}</h3>
                 <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full"><X size={20}/></button>
              </div>
              
              <div className="p-6 overflow-y-auto custom-scrollbar">
                 <form id="staffForm" onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                       <div>
                          <label className="block text-xs font-bold text-gray-600 mb-1">Name</label>
                          <input 
                            type="text" required
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-900 outline-none focus:border-primary-500 disabled:bg-gray-100"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            disabled={!!editingStaff} // Disable name edit for existing user
                          />
                       </div>
                       <div>
                          <label className="block text-xs font-bold text-gray-600 mb-1">Email</label>
                          <input 
                            type="email" required
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-900 outline-none focus:border-primary-500 disabled:bg-gray-100"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            disabled={!!editingStaff} // Disable email edit for existing user
                          />
                       </div>
                    </div>

                    <div>
                       <label className="block text-xs font-bold text-gray-600 mb-3">Permissions</label>
                       <div className="grid grid-cols-2 gap-3">
                          {AVAILABLE_PERMISSIONS.map(p => (
                             <div key={p.id} onClick={() => handleTogglePermission(p.id)} className={`p-3 rounded-lg border cursor-pointer flex items-center justify-between transition-all ${formData.permissions.includes(p.id) ? 'bg-primary-50 border-primary-500' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                                <span className="text-sm font-medium text-gray-700">{p.label}</span>
                                <Checkbox checked={formData.permissions.includes(p.id)} onChange={() => {}} />
                             </div>
                          ))}
                       </div>
                    </div>
                 </form>
              </div>

              <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                 <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                 <Button type="submit" form="staffForm" isLoading={isSubmitting}>{editingStaff ? 'Update Access' : 'Send Invite'}</Button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
