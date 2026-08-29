import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  ArrowLeft,
  Trash2,
  Edit2,
  Loader2,
  AlertCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { listUsers, setUserUsage, deleteUser } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — ACE PITCH" },
      {
        name: "description",
        content: "Manage users and usage limits.",
      },
    ],
  }),
  component: AdminDashboard,
});

interface User {
  id: string;
  email: string;
  createdAt: string;
  usageCount: number;
  usageLimit: number;
}

function AdminDashboard() {
  const listUsersServerFn = useServerFn(listUsers);
  const setUsageServerFn = useServerFn(setUserUsage);
  const deleteUserServerFn = useServerFn(deleteUser);
  const queryClient = useQueryClient();

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newLimit, setNewLimit] = useState<string>("");
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<User | null>(null);

  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => listUsersServerFn(),
  });

  const setUsageMutation = useMutation({
    mutationFn: (data: { id: string; limit: number }) =>
      setUsageServerFn({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setEditingUser(null);
      setNewLimit("");
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => deleteUserServerFn({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setDeleteConfirmUser(null);
    },
  });

  const handleSaveUsage = () => {
    if (!editingUser || !newLimit) return;
    const limit = parseInt(newLimit, 10);
    if (isNaN(limit) || limit < 0) {
      window.alert("Please enter a valid number");
      return;
    }
    setUsageMutation.mutate({ id: editingUser.id, limit });
  };

  const handleDeleteUser = () => {
    if (!deleteConfirmUser) return;
    deleteUserMutation.mutate(deleteConfirmUser.id);
  };

  if (error) {
    return (
      <main className="min-h-screen bg-background px-5 py-12 sm:px-8">
        <div className="mx-auto w-full max-w-5xl">
          <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
            <AlertCircle className="size-5" />
            <p className="text-sm">
              {error instanceof Error
                ? error.message
                : "Failed to load users. Make sure you're an admin."}
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-5 py-12 sm:px-8">
      <div className="mx-auto w-full max-w-5xl">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back to analysis
        </Link>

        <h1 className="mt-5 text-3xl font-semibold tracking-tight text-foreground">
          Admin Dashboard
        </h1>
        <p className="mt-2 text-muted-foreground">
          Manage user accounts and usage limits
        </p>

        {isLoading ? (
          <div className="mt-10 flex items-center justify-center">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="mt-8 overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Usage / Limit</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-mono text-sm">{user.email}</TableCell>
                      <TableCell className="text-sm">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="rounded-full bg-muted px-2 py-1 text-sm font-medium">
                          {user.usageCount} / {user.usageLimit}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingUser(user);
                              setNewLimit(user.usageLimit.toString());
                            }}
                          >
                            <Edit2 className="size-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setDeleteConfirmUser(user)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Edit Usage Dialog */}
      <Dialog
        open={editingUser !== null}
        onOpenChange={(open) => !open && setEditingUser(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Usage Limit</DialogTitle>
            <DialogDescription>
              Change the usage limit for {editingUser?.email}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="new-limit">New Limit</Label>
              <Input
                id="new-limit"
                type="number"
                min="0"
                max="10000"
                value={newLimit}
                onChange={(e) => setNewLimit(e.target.value)}
                placeholder="Enter new limit"
              />
              <p className="mt-2 text-xs text-muted-foreground">
                Current usage: {editingUser?.usageCount} / {editingUser?.usageLimit}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingUser(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveUsage}
              disabled={setUsageMutation.isPending}
            >
              {setUsageMutation.isPending && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteConfirmUser !== null}
        onOpenChange={(open) => !open && setDeleteConfirmUser(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete the account for{" "}
              <span className="font-mono font-semibold">
                {deleteConfirmUser?.email}
              </span>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteUser}
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
