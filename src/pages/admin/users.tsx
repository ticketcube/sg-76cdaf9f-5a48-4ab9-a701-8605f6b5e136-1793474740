"use client";

import { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { authService } from "@/services/authService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, UserPlus, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface User {
  user: {
    id: string;
    email: string;
    created_at: string;
  };
  profile: {
    user_id: string;
    email: string;
    username: string;
    display_name: string | null;
    role: string | null;
    is_admin: boolean;
    created_at: string;
    updated_at: string;
  };
}

export default function UsersManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    displayName: "",
    role: "otwl-staff" as "otwl-dj" | "otwl-podcast" | "otwl-staff",
    isAdmin: false
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    const { users: fetchedUsers } = await authService.adminGetAllUsers();
    setUsers(fetchedUsers);
    setLoading(false);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError("");
    setSuccess("");

    const { user, error: createError } = await authService.adminCreateUser(
      formData.email,
      formData.password,
      formData.displayName,
      formData.role,
      formData.isAdmin
    );

    if (createError) {
      setError(createError.message);
      setCreating(false);
      return;
    }

    setSuccess(`User ${formData.displayName} created successfully`);
    setFormData({
      email: "",
      password: "",
      displayName: "",
      role: "otwl-staff",
      isAdmin: false
    });
    setCreating(false);
    setCreateDialogOpen(false);
    loadUsers();
  };

  const getRoleBadge = (role: string | null) => {
    if (!role) return <Badge variant="outline">No Role</Badge>;
    
    const roleMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      "otwl-dj": { label: "DJ", variant: "default" },
      "otwl-podcast": { label: "Podcast", variant: "secondary" },
      "otwl-staff": { label: "Staff", variant: "outline" }
    };

    const roleInfo = roleMap[role] || { label: role, variant: "outline" as const };
    return <Badge variant={roleInfo.variant}>{roleInfo.label}</Badge>;
  };

  return (
    <ProtectedRoute requireAdmin>
      <div className="page-container">
        <div className="max-w-7xl mx-auto section-spacing">
          <div className="flex items-center justify-between mb-8">
            <div>
              <Link href="/admin">
                <Button variant="ghost" size="sm" className="mb-2">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <h1 className="text-4xl font-bold">User Management</h1>
              <p className="text-muted-foreground mt-2">
                Create and manage OTW Radio staff, DJs, and podcast creators
              </p>
            </div>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Create User
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={handleCreateUser}>
                  <DialogHeader>
                    <DialogTitle>Create New User</DialogTitle>
                    <DialogDescription>
                      Add a new staff member, DJ, or podcast creator to OTW Radio
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="user@onestowatch.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="displayName">Display Name</Label>
                      <Input
                        id="displayName"
                        placeholder="John Doe"
                        value={formData.displayName}
                        onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Min. 6 characters"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                        minLength={6}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Select
                        value={formData.role}
                        onValueChange={(value) => setFormData({ ...formData, role: value as typeof formData.role })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="otwl-staff">Staff</SelectItem>
                          <SelectItem value="otwl-dj">DJ</SelectItem>
                          <SelectItem value="otwl-podcast">Podcast Creator</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isAdmin"
                        checked={formData.isAdmin}
                        onCheckedChange={(checked) => setFormData({ ...formData, isAdmin: checked as boolean })}
                      />
                      <Label htmlFor="isAdmin" className="cursor-pointer">
                        Grant admin privileges
                      </Label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={creating}>
                      {creating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Create User"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-6">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid gap-4">
              {users.length === 0 ? (
                <Card>
                  <CardContent className="py-12">
                    <p className="text-center text-muted-foreground">
                      No users found. Create your first user to get started.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                users.map((user) => (
                  <Card key={user.profile.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">
                            {user.profile.display_name || "Unnamed User"}
                          </CardTitle>
                          <CardDescription className="font-mono text-xs mt-1">
                            {user.profile.email}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          {getRoleBadge(user.profile.role)}
                          {user.profile.is_admin && (
                            <Badge variant="destructive">Admin</Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground">
                        <p>Created: {new Date(user.profile.created_at).toLocaleDateString()}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}