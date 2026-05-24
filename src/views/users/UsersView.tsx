"use client";

import { useState } from "react";
import { Plus, X, Loader2, Upload, User, Eye, EyeOff, Trash2, Edit2 } from "lucide-react";
import { fmtDate } from "@/utils/dateFormat";
import toast from "react-hot-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { ModernDropdown } from "@/components/ui/ModernDropdown";

type Store = {
  id: string;
  name: string;
};

type UserType = {
  id: string;
  employeeNo: string | null;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  storeId?: string | null;
  store?: Store | null;
  createdAt: Date;
  imageUrl?: string | null;
};

type UsersViewProps = {
  initialUsers: UserType[];
  stores: Store[];
};

const ROLE_ID_PREFIX: Record<string, string> = {
  ADMIN: "AD",
  ADMIN_MANAGER: "ADMM",
  STORE_MANAGER: "SM",
  SUB_STORE_LOGIN: "SS",
  INWARD_PERSON: "IP",
  OUTWARD_PERSON: "OP",
};

export function UsersView({ initialUsers, stores }: UsersViewProps) {
  const { isAdmin } = useUserRole();
  const [users, setUsers] = useState<UserType[]>(initialUsers);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "ADMIN_MANAGER",
    storeId: "",
  });
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
    storeId: "",
    isActive: true,
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const generateEmployeeNo = (role: string): string => {
    const prefix = ROLE_ID_PREFIX[role] || "EMP";
    const count = users.filter((u) => u.role === role).length + 1;
    return `${prefix}${String(count).padStart(3, "0")}`;
  };

  const handleEdit = (user: UserType) => {
    setEditingUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      storeId: user.storeId || "",
      isActive: user.isActive,
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setLoading(true);

    try {
      const updateData: any = {
        name: editForm.name,
        email: editForm.email,
        role: editForm.role,
        storeId: editForm.storeId,
        isActive: editForm.isActive,
      };

      // Only include password if provided
      if (editForm.password.trim()) {
        if (editForm.password.length < 6) {
          throw new Error("Password must be at least 6 characters");
        }
        updateData.password = editForm.password;
      }

      const response = await fetch(`/api/users/${editingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to update user");
      }

      toast.success("User updated successfully");
      setUsers((prev) =>
        prev.map((u) => (u.id === editingUser.id ? result.data : u))
      );
      setShowEditModal(false);
      setEditingUser(null);
      setEditForm({
        name: "",
        email: "",
        password: "",
        role: "",
        storeId: "",
        isActive: true,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update user");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, employeeNo: undefined }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to create user");
      }

      // Upload photo if selected
      if (photoFile && result.data?.id) {
        const fd = new FormData();
        fd.append("file", photoFile);
        await fetch(`/api/uploads/users/${result.data.id}`, { method: "POST", body: fd });
      }

      toast.success("User created successfully");
      setUsers([result.data, ...users]);
      setShowModal(false);
      setPhotoFile(null);
      setPhotoPreview(null);
      setShowPassword(false);
      setForm({
        name: "",
        email: "",
        password: "",
        role: "ADMIN_MANAGER",
        storeId: "",
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId: string, userName: string) => {
    if (!confirm(`Delete user "${userName}"? This action cannot be undone.`)) return;

    setDeleting(userId);
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to delete user");
      }

      toast.success("User deleted successfully");
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete user");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              Administration
            </p>
            <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">Users</h1>
          </div>
          {isAdmin && (
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:bg-slate-900 hover:shadow-xl dark:bg-slate-950 dark:hover:bg-black"
            >
              <Plus className="h-4 w-4" />
              Add User
            </button>
          )}
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                <th className="hidden sm:table-cell px-3 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Photo</th>
                <th className="px-3 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">ID</th>
                <th className="px-3 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Name</th>
                <th className="hidden sm:table-cell px-3 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Email</th>
                <th className="hidden md:table-cell px-3 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Role</th>
                <th className="hidden lg:table-cell px-3 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Store</th>
                <th className="hidden lg:table-cell px-3 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Status</th>
                <th className="hidden xl:table-cell px-3 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Created</th>
                <th className="px-3 py-3 text-center font-semibold text-slate-700 dark:text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-3 py-8 text-center text-slate-500 dark:text-slate-400">No users found</td>
                </tr>
              ) : (
                users.map((user, index) => (
                  <tr key={user.id} className="stagger-item border-b border-slate-200 transition-all duration-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800" style={{ animationDelay: `${index * 0.05}s` }}>
                    <td className="hidden sm:table-cell px-3 py-3">
                      <div className="h-12 w-12 overflow-hidden rounded-full border-2 border-slate-200 bg-slate-100 shadow-sm transition-all duration-300 hover:scale-110 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600">
                        {user.imageUrl ? (
                          <img src={user.imageUrl} alt={user.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-900 to-slate-700 text-white dark:from-slate-100 dark:to-slate-300 dark:text-slate-900">
                            <User className="h-6 w-6" />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 font-medium text-slate-900 text-xs sm:text-sm dark:text-slate-100">{user.employeeNo || "-"}</td>
                    <td className="px-3 py-3 text-slate-600 font-medium dark:text-slate-400">{user.name}</td>
                    <td className="hidden sm:table-cell px-3 py-3 text-slate-600 text-xs sm:text-sm dark:text-slate-400">{user.email}</td>
                    <td className="hidden md:table-cell px-3 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                        user.role === "ADMIN" 
                          ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                          : user.role === "ADMIN_MANAGER"
                          ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
                          : user.role === "STORE_MANAGER"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          : user.role === "SUB_STORE_LOGIN"
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                          : user.role === "INWARD_PERSON"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : user.role === "OUTWARD_PERSON"
                          ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                          : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      }`}>
                        {user.role === "SUB_STORE_LOGIN" ? "Sub" : user.role === "ADMIN_MANAGER" ? "Mgr" : user.role === "STORE_MANAGER" ? "Store" : user.role === "INWARD_PERSON" ? "In" : user.role === "OUTWARD_PERSON" ? "Out" : user.role}
                      </span>
                    </td>
                    <td className="hidden lg:table-cell px-3 py-3 text-sm text-slate-600 dark:text-slate-400">
                      {user.store?.name || (user.storeId ? "Unknown" : "-")}
                    </td>
                    <td className="hidden lg:table-cell px-3 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                        user.isActive 
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      }`}>
                        <span className={`h-1 w-1 rounded-full ${user.isActive ? "bg-green-500" : "bg-red-500"}`} />
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="hidden xl:table-cell px-3 py-3 text-xs sm:text-sm text-slate-600 dark:text-slate-400">{fmtDate(user.createdAt)}</td>
                    <td className="px-3 py-3 text-center">
                      {isAdmin && (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleEdit(user)}
                            className="p-1.5 text-slate-600 hover:bg-blue-100 hover:text-blue-600 rounded transition-colors dark:text-slate-400 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
                            title="Edit user"
                          >
                            <Edit2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(user.id, user.name)}
                            disabled={deleting === user.id}
                            className="p-1.5 text-slate-600 hover:bg-red-100 hover:text-red-600 rounded transition-colors disabled:opacity-50 dark:text-slate-400 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                            title="Delete user"
                          >
                            {deleting === user.id ? (
                              <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            )}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-3 sm:p-4 backdrop-blur-sm">
          <div className="w-full max-w-md max-h-[90vh] animate-scale-in rounded-t-3xl sm:rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-xl overflow-y-auto dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Add New User</h2>
              <button type="button" onClick={() => setShowModal(false)} className="rounded-lg p-1 hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <ModernDropdown
                  label="Role"
                  required
                  searchable={false}
                  clearable={false}
                  options={[
                    { value: "ADMIN", label: "Admin" },
                    { value: "ADMIN_MANAGER", label: "Admin Manager" },
                    { value: "STORE_MANAGER", label: "Store Manager" },
                    { value: "SUB_STORE_LOGIN", label: "Sub Store" },
                    { value: "INWARD_PERSON", label: "Inward Person" },
                    { value: "OUTWARD_PERSON", label: "Outward Person" },
                  ]}
                  value={form.role}
                  onChange={(value) => setForm({ ...form, role: value as string })}
                  placeholder="Select role..."
                />
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  ID auto-generated based on role
                </p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Name <span className="text-rose-500">*</span></label>
                <input 
                  type="text" 
                  value={form.name} 
                  onChange={(e) => setForm({ ...form, name: e.target.value })} 
                  placeholder="John Doe" 
                  required 
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-slate-400" 
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Email <span className="text-rose-500">*</span></label>
                <input 
                  type="email" 
                  value={form.email} 
                  onChange={(e) => setForm({ ...form, email: e.target.value })} 
                  placeholder="john@example.com" 
                  required 
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-slate-400" 
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Password <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={form.password} 
                    onChange={(e) => setForm({ ...form, password: e.target.value })} 
                    placeholder="••••••••" 
                    required 
                    minLength={6}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 pr-10 text-sm outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-slate-400" 
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <ModernDropdown
                  label="Store"
                  required
                  options={stores.map((store) => ({
                    value: store.id,
                    label: store.name,
                  }))}
                  value={form.storeId}
                  onChange={(value) => setForm({ ...form, storeId: value as string })}
                  placeholder="Select store..."
                  searchPlaceholder="Search stores..."
                />
                {["ADMIN", "ADMIN_MANAGER"].includes(form.role) && (
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    All users must be assigned to a store
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Photo</label>
                <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-800">
                  <Upload className="h-4 w-4" />
                  {photoFile ? photoFile.name : "Upload photo (optional)"}
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => { 
                      const f = e.target.files?.[0]; 
                      if (!f) return; 
                      setPhotoFile(f); 
                      const reader = new FileReader(); 
                      reader.onload = (ev) => setPhotoPreview(ev.target?.result as string); 
                      reader.readAsDataURL(f); 
                    }} 
                  />
                </label>
                {photoPreview && (
                  <div className="mt-3 flex justify-center">
                    <div className="h-32 w-32 overflow-hidden rounded-full border-2 border-slate-200 shadow-md dark:border-slate-700">
                      <img src={photoPreview} alt="preview" className="h-full w-full object-cover" />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:scale-105 hover:border-slate-400 hover:bg-slate-50 hover:shadow-md dark:border-slate-600 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={loading} 
                  className="flex-1 rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:bg-slate-900 hover:shadow-xl disabled:opacity-50 dark:bg-slate-950 dark:hover:bg-black"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating...
                    </span>
                  ) : (
                    "Create User"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && editingUser && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-3 sm:p-4 backdrop-blur-sm">
          <div className="w-full max-w-md max-h-[90vh] animate-scale-in rounded-t-3xl sm:rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-xl overflow-y-auto dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Edit User</h2>
              <button type="button" onClick={() => setShowEditModal(false)} className="rounded-lg p-1 hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Name <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="text" 
                  value={editForm.name} 
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} 
                  placeholder="John Doe" 
                  required 
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-slate-400" 
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Email <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="email" 
                  value={editForm.email} 
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} 
                  placeholder="john@example.com" 
                  required 
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-slate-400" 
                />
              </div>

              <div>
                <ModernDropdown
                  label="Role"
                  required
                  searchable={false}
                  clearable={false}
                  options={[
                    { value: "ADMIN", label: "Admin" },
                    { value: "ADMIN_MANAGER", label: "Admin Manager" },
                    { value: "STORE_MANAGER", label: "Store Manager" },
                    { value: "SUB_STORE_LOGIN", label: "Sub Store" },
                    { value: "INWARD_PERSON", label: "Inward Person" },
                    { value: "OUTWARD_PERSON", label: "Outward Person" },
                  ]}
                  value={editForm.role}
                  onChange={(value) => setEditForm({ ...editForm, role: value as string })}
                  placeholder="Select role..."
                />
              </div>

              <div>
                <ModernDropdown
                  label="Store"
                  required
                  options={stores.map((store) => ({
                    value: store.id,
                    label: store.name,
                  }))}
                  value={editForm.storeId}
                  onChange={(value) => setEditForm({ ...editForm, storeId: value as string })}
                  placeholder="Select store..."
                  searchPlaceholder="Search stores..."
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Status</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="status"
                      checked={editForm.isActive === true}
                      onChange={() => setEditForm({ ...editForm, isActive: true })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300">Active</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="status"
                      checked={editForm.isActive === false}
                      onChange={() => setEditForm({ ...editForm, isActive: false })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300">Inactive</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Password <span className="text-slate-500 text-xs font-normal">(Leave empty to keep current password)</span>
                </label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={editForm.password} 
                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} 
                    placeholder="••••••••" 
                    minLength={6}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 pr-10 text-sm outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-slate-400" 
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowEditModal(false)} 
                  className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:scale-105 hover:border-slate-400 hover:bg-slate-50 hover:shadow-md dark:border-slate-600 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={loading} 
                  className="flex-1 rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:bg-slate-900 hover:shadow-xl disabled:opacity-50 dark:bg-slate-950 dark:hover:bg-black"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Updating...
                    </span>
                  ) : (
                    "Update User"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
