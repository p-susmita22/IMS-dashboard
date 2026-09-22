import React, { useState, useEffect } from 'react';
import { UserCheck, Plus, Shield, Mail, Lock, User as UserIcon } from 'lucide-react';
import { userApi } from '../services/opsApi';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Modal } from '../components/common/Modal';
import { Table } from '../components/common/Table';
import { Loader } from '../components/common/Loader';
import { EmptyState } from '../components/common/EmptyState';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('STAFF');

  const { user: currentUser } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await userApi.getUsers();
      if (res.success) setUsers(res.data || []);
    } catch (err) {
      showToast('Failed to fetch users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      showToast('Please fill all required fields', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await userApi.createUser({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role
      });

      if (res.success) {
        showToast(res.message || 'User created successfully!', 'success');
        setIsModalOpen(false);
        setName('');
        setEmail('');
        setPassword('');
        setRole('STAFF');
        fetchUsers();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error creating user', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (user) => {
    const newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await userApi.updateStatus(user._id, newStatus);
      if (res.success) {
        showToast(`User status changed to ${newStatus}`, 'success');
        fetchUsers();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error updating user status', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <UserCheck className="w-7 h-7 text-indigo-600" />
            User Management
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage system access and role permissions (Admin, Manager, Staff).
          </p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          variant="brand"
          size="lg"
          icon={Plus}
        >
          Add New User
        </Button>
      </div>

      {loading ? (
        <Loader message="Loading users..." />
      ) : users.length === 0 ? (
        <EmptyState
          icon={UserCheck}
          title="No Users Found"
          description="Create your first user account."
        />
      ) : (
        <Table
          headers={[
            'Name',
            'Email',
            'Role',
            'Status',
            'Created Date',
            'Actions'
          ]}
        >
          {users.map((u) => (
            <tr key={u._id} className="hover:bg-slate-50/70 transition-colors">
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 font-bold text-xs flex items-center justify-center text-slate-700 uppercase">
                    {u.name.charAt(0)}
                  </div>
                  <span className="font-bold text-slate-900 text-xs">{u.name}</span>
                </div>
              </td>
              <td className="px-5 py-3.5 text-xs text-slate-600">{u.email}</td>
              <td className="px-5 py-3.5">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    u.role === 'ADMIN'
                      ? 'bg-purple-100 text-purple-800'
                      : u.role === 'MANAGER'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {u.role}
                </span>
              </td>
              <td className="px-5 py-3.5">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    u.status === 'ACTIVE'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {u.status}
                </span>
              </td>
              <td className="px-5 py-3.5 text-xs text-slate-500 whitespace-nowrap">
                {new Date(u.createdAt).toLocaleDateString()}
              </td>
              <td className="px-5 py-3.5">
                {currentUser?.id !== u._id && (
                  <button
                    onClick={() => handleToggleStatus(u)}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 underline"
                  >
                    {u.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </Table>
      )}

      {/* Add User Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New System User"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <Input
            label="Full Name"
            required
            placeholder="e.g. Multimaart Admin"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            label="Email Address"
            type="email"
            required
            placeholder="e.g. rahul@ims.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="Password"
            type="password"
            required
            placeholder="Minimum 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Select
            label="System Role"
            required
            value={role}
            onChange={(e) => setRole(e.target.value)}
            options={[
              { value: 'STAFF', label: 'STAFF (Day-to-day stock in/out, create orders)' },
              { value: 'ADMIN', label: 'ADMIN (Full system control, users, settings)' }
            ]}
          />
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="brand"
              loading={submitting}
            >
              Create User
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
