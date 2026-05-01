import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { UserCheck, UserX, Search, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';
import Skeleton, { TableSkeleton } from '@/components/ui/skeleton';
import ColumnChooser from '@/components/ui/column-chooser';
import { format } from 'date-fns';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_API_URL;
const API = `${BACKEND_URL}/api`;

const ALL_COLUMNS = [
  { key: 'email', label: 'Email' },
  { key: 'full_name', label: 'Name' },
  { key: 'role', label: 'Role' },
  { key: 'status', label: 'Status' },
  { key: 'created_at', label: 'Created' },
  { key: 'actions', label: 'Actions' },
];

export default function UsersManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [visibleColumns, setVisibleColumns] = useState(['email', 'full_name', 'role', 'status', 'actions']);
  const limit = 50;

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (roleFilter !== 'all') params.append('role', roleFilter);
      params.append('page', page);
      params.append('limit', limit);
      params.append('sort_by', sortBy);
      params.append('sort_order', sortOrder);

      const response = await axios.get(`${API}/users?${params.toString()}`);
      setUsers(response.data);
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [searchQuery, roleFilter, page, sortBy, sortOrder]);

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const handleUpdateUser = async (userId, updates) => {
    try {
      await axios.patch(`${API}/users/${userId}`, updates);
      toast.success('User updated successfully');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update user');
    }
  };

  const SortableHeader = ({ column, children }) => (
    <TableHead className="text-xs font-semibold uppercase tracking-wider cursor-pointer hover:bg-muted/50" onClick={() => handleSort(column)}>
      <div className="flex items-center gap-2">{children}<ArrowUpDown className="h-3 w-3" /></div>
    </TableHead>
  );

  const toggleColumn = (columnKey) => {
    setVisibleColumns(prev => prev.includes(columnKey) ? prev.filter(k => k !== columnKey) : [...prev, columnKey]);
  };

  return (
    <div className="space-y-4" data-testid="users-management">
      {/* Filters */}
      <div className="bg-card border border-border rounded-sm p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type="text" placeholder="Search email or name..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }} className="pl-10 rounded-sm border-input" data-testid="users-search-input" />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">Role</label>
            <Select value={roleFilter} onValueChange={(val) => { setRoleFilter(val); setPage(1); }}>
              <SelectTrigger className="rounded-sm border-input" data-testid="users-role-filter" style={{ backgroundColor: 'white' }}>
                <SelectValue placeholder="All roles" />
              </SelectTrigger>
              <SelectContent style={{ backgroundColor: 'white', zIndex: 100 }}>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="supervisor">Supervisor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <ColumnChooser columns={ALL_COLUMNS} visibleColumns={visibleColumns} onToggleColumn={toggleColumn} />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-sm overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-6"><TableSkeleton rows={10} columns={5} /></div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No users found</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    {visibleColumns.includes('email') && <SortableHeader column="email">Email</SortableHeader>}
                    {visibleColumns.includes('full_name') && <SortableHeader column="full_name">Name</SortableHeader>}
                    {visibleColumns.includes('role') && <SortableHeader column="role">Role</SortableHeader>}
                    {visibleColumns.includes('status') && <TableHead className="text-xs font-semibold uppercase tracking-wider">Status</TableHead>}
                    {visibleColumns.includes('created_at') && <SortableHeader column="created_at">Created</SortableHeader>}
                    {visibleColumns.includes('actions') && <TableHead className="text-xs font-semibold uppercase tracking-wider">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id} className="border-b border-border hover:bg-muted/30 transition-colors" data-testid={`user-row-${user.id}`}>
                      {visibleColumns.includes('email') && <TableCell className="text-sm font-medium">{user.email}</TableCell>}
                      {visibleColumns.includes('full_name') && <TableCell className="text-sm">{user.full_name || 'N/A'}</TableCell>}
                      {visibleColumns.includes('role') && (
                        <TableCell>
                          <Select value={user.role} onValueChange={(value) => handleUpdateUser(user.id, { role: value })}>
                            <SelectTrigger className="w-32 rounded-sm border-input h-8" data-testid={`role-select-${user.id}`} style={{ backgroundColor: 'white' }}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent style={{ backgroundColor: 'white', zIndex: 100 }}>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="supervisor">Supervisor</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      )}
                      {visibleColumns.includes('status') && (
                        <TableCell>
                          {user.is_active ? (
                            <span className="px-3 py-1 bg-success-light text-success-dark rounded-sm text-xs font-medium">Active</span>
                          ) : (
                            <span className="px-3 py-1 bg-red-50 text-red-700 rounded-sm text-xs font-medium">Inactive</span>
                          )}
                        </TableCell>
                      )}
                      {visibleColumns.includes('created_at') && (
                        <TableCell className="text-sm text-muted-foreground">
                          {user.created_at ? format(new Date(user.created_at), 'MMM dd, yyyy') : '-'}
                        </TableCell>
                      )}
                      {visibleColumns.includes('actions') && (
                        <TableCell>
                          <Button size="sm" variant="outline" onClick={() => handleUpdateUser(user.id, { is_active: !user.is_active })} className="rounded-sm border-border hover:bg-muted h-8 px-3" data-testid={`toggle-status-${user.id}`}>
                            {user.is_active ? (
                              <><UserX className="h-4 w-4 mr-1" /> Deactivate</>
                            ) : (
                              <><UserCheck className="h-4 w-4 mr-1" /> Activate</>
                            )}
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between p-4 border-t border-border bg-muted/20">
              <div className="text-sm text-muted-foreground">Page {page} • Showing {users.length} users</div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="rounded-sm">
                  <ChevronLeft className="h-4 w-4" /> Previous
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={users.length < limit} className="rounded-sm">
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
