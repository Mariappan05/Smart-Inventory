"use client";

import { useEffect, useState } from "react";
import { User, Mail, Lock, Save, Eye, EyeOff, BadgeCheck, Building2 } from "lucide-react";
import { fmtDate, fmtDateTime } from "@/utils/dateFormat";
import toast from "react-hot-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { ModernDropdown } from "@/components/ui/ModernDropdown";

type Profile = {
  id: string;
  name: string;
  email: string;
  employeeNo: string;
  role: string;
  createdAt: string;
  lastLoginAt: string | null;
  storeId: string | null;
  store: { id: string; name: string } | null;
  images?: { id: string; url: string; isPrimary: boolean }[];
};

type Store = {
  id: string;
  name: string;
};

export function ProfileView() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [storeId, setStoreId] = useState<string>("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { isAdmin, hasAdminAccess } = useUserRole();

  const profileImage = profile?.images?.find((i) => i.isPrimary)?.url || profile?.images?.[0]?.url;

  useEffect(() => {
    const loadData = () => {
      fetch("/api/profile")
        .then((r) => r.json())
        .then((d) => {
          if (d.success) {
            setProfile(d.data);
            setName(d.data.name);
            setEmail(d.data.email);
            setStoreId(d.data.storeId || "");
          }
        })
        .catch((err) => console.error("Profile fetch failed:", err));

      fetch("/api/plants")
        .then((r) => r.json())
        .then((d) => {
          if (d.success) {
            setStores(d.data);
          }
        })
        .catch((err) => console.error("Stores fetch failed:", err));
    };

    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`/api/uploads/users/${profile?.id}`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Upload failed");
      }

      toast.success("Profile image updated");
      
      const profileRes = await fetch("/api/profile");
      const profileData = await profileRes.json();
      if (profileData.success) {
        setProfile(profileData.data);
      }
      
      window.location.reload();
    } catch (error) {
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent non-admin users from changing password
    if (newPassword && !isAdmin) {
      toast.error("Only Admin users can change passwords");
      return;
    }
    
    if (newPassword && newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (newPassword && newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setSaving(true);
    try {
      const payload: any = { name, email };
      
      // Only include storeId if user is Admin
      if (hasAdminAccess) {
        payload.storeId = storeId || null;
      }
      
      // Only include password if user is Admin
      if (newPassword && isAdmin) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }

      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.message ?? "Failed to update profile");
        return;
      }
      setProfile((p) => p && { ...p, name: data.data.name, email: data.data.email });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Profile updated");
    } finally {
      setSaving(false);
    }
  };

  if (!profile) {
    return (
      <div className="flex h-40 items-center justify-center text-slate-400">
        Loading…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Avatar + meta */}
      <div className="flex items-center gap-5 rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-panel dark:border-slate-700 dark:bg-slate-900/70">
        <div className="relative">
          <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-4 border-slate-200 bg-slate-100 shadow-lg transition-all duration-300 hover:scale-105 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600">
            {profileImage ? (
              <img src={profileImage} alt={profile.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-900 to-slate-700 text-white dark:from-slate-100 dark:to-slate-300 dark:text-slate-900">
                <User className="h-16 w-16" />
              </div>
            )}
          </div>
          <label className="absolute -bottom-1 -right-1 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-slate-900 text-white shadow-lg transition-all duration-200 hover:scale-110 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200">
            <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="hidden" />
            <User className="h-5 w-5" />
          </label>
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
            </div>
          )}
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{profile.name}</h2>
          <p className="text-sm text-slate-500">{profile.email}</p>
          <div className="mt-1 flex items-center gap-2">
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {profile.role}
            </span>
            <span className="text-xs text-slate-400">{profile.employeeNo}</span>
          </div>
          {profile.store && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
              <span className="font-semibold">Store:</span>
              <span className="rounded-md bg-blue-50 px-2 py-0.5 font-medium text-blue-700 dark:bg-blue-950/30 dark:text-blue-400">
                {profile.store.name}
              </span>
            </div>
          )}
        </div>
        <div className="ml-auto hidden text-right text-xs text-slate-400 sm:block">
          <p>Member since</p>
          <p className="font-medium text-slate-600 dark:text-slate-300">
            {fmtDate(profile.createdAt)}
          </p>
          {profile.lastLoginAt && (
            <>
              <p className="mt-1">Last login</p>
              <p className="font-medium text-slate-600 dark:text-slate-300">
                {fmtDateTime(profile.lastLoginAt)}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Edit form */}
      <form onSubmit={handleSave} className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-panel dark:border-slate-700 dark:bg-slate-900/70 space-y-6">
        {/* Basic info */}
        <div>
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.15em] text-slate-500">
            <BadgeCheck className="h-4 w-4" /> Basic Information
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Full Name</label>
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-950">
                <User className="h-4 w-4 shrink-0 text-slate-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="flex-1 bg-transparent text-sm outline-none dark:text-slate-100"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Email Address</label>
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-950">
                <Mail className="h-4 w-4 shrink-0 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex-1 bg-transparent text-sm outline-none dark:text-slate-100"
                />
              </div>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <ModernDropdown
                label="Store"
                disabled={!hasAdminAccess}
                options={[
                  { value: "", label: "No Store Assigned" },
                  ...stores.map((store) => ({
                    value: store.id,
                    label: store.name,
                  })),
                ]}
                value={storeId}
                onChange={(value) => setStoreId(value as string)}
                placeholder="Select store..."
                searchPlaceholder="Search stores..."
              />
              {!hasAdminAccess && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Only Admin can change store assignment
                </p>
              )}
            </div>
          </div>
        </div>

        <hr className="border-slate-100 dark:border-slate-800" />

        {/* Change password - Admin Only */}
        {isAdmin && (
          <>
            <div>
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.15em] text-slate-500">
                <Lock className="h-4 w-4" /> Change Password
                <span className="ml-1 text-xs font-normal normal-case tracking-normal text-slate-400">(leave blank to keep current)</span>
              </h3>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Current Password</label>
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-950">
                    <Lock className="h-4 w-4 shrink-0 text-slate-400" />
                    <input
                      type={showCurrent ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="flex-1 bg-transparent text-sm outline-none dark:text-slate-100"
                    />
                    <button type="button" onClick={() => setShowCurrent((v) => !v)} className="text-slate-400 hover:text-slate-600">
                      {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">New Password</label>
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-950">
                    <Lock className="h-4 w-4 shrink-0 text-slate-400" />
                    <input
                      type={showNew ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="flex-1 bg-transparent text-sm outline-none dark:text-slate-100"
                    />
                    <button type="button" onClick={() => setShowNew((v) => !v)} className="text-slate-400 hover:text-slate-600">
                      {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Confirm Password</label>
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-950">
                    <Lock className="h-4 w-4 shrink-0 text-slate-400" />
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="flex-1 bg-transparent text-sm outline-none dark:text-slate-100"
                    />
                    <button type="button" onClick={() => setShowConfirm((v) => !v)} className="text-slate-400 hover:text-slate-600">
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
        
        {!isAdmin && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
            <p className="text-sm text-amber-900 dark:text-amber-200">
              <Lock className="inline h-4 w-4 mr-2" />
              Password changes are restricted to Admin users only. Contact your administrator to change your password.
            </p>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-full bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
