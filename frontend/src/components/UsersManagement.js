import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { UserCheck, UserX } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function UsersManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/users`);
      setUsers(response.data);
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUpdateUser = async (userId, updates) => {
    try {
      await axios.patch(`${API}/users/${userId}`, updates);
      toast.success('User updated successfully');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update user');
    }
  };

  const getRoleBadge = (role) => {
    const styles = {
      admin: 'bg-primary text-white',
      supervisor: 'bg-blue-100 text-blue-700',
    };
    return (
      <span className={`px-3 py-1 rounded-sm text-xs font-medium ${styles[role] || ''}`}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </span>
    );
  };

  return (
    <div className="space-y-4" data-testid="users-management">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-foreground font-heading">
          Users Management
        </h2>
        <p className="text-sm text-muted-foreground mt-1">Manage user accounts and roles</p>
      </div>

      <div className="bg-card border border-border rounded-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No users found</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="text-xs font-semibold uppercase tracking-wider">Email</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider">Name</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider">Role</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider">Status</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} className="border-b border-border" data-testid={`user-row-${user.id}`}>
                  <TableCell className="text-sm font-medium">{user.email}</TableCell>
                  <TableCell className="text-sm">{user.full_name || 'N/A'}</TableCell>
                  <TableCell>
                    <Select
                      value={user.role}
                      onValueChange={(value) => handleUpdateUser(user.id, { role: value })}
                    >
                      <SelectTrigger className="w-32 rounded-sm border-input h-8" data-testid={`role-select-${user.id}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="supervisor">Supervisor</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {user.is_active ? (
                      <span className="px-3 py-1 bg-success-light text-success-dark rounded-sm text-xs font-medium">
                        Active
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-red-50 text-red-700 rounded-sm text-xs font-medium">
                        Inactive
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUpdateUser(user.id, { is_active: !user.is_active })}
                      className="rounded-sm border-border hover:bg-muted h-8 px-3"
                      data-testid={`toggle-status-${user.id}`}
                    >
                      {user.is_active ? (
                        <>
                          <UserX className="h-4 w-4 mr-1" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <UserCheck className="h-4 w-4 mr-1" />
                          Activate
                        </>
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}