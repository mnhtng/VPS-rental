'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Users,
  Server,
  ShoppingCart,
  DollarSign,
  LogOut,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Eye
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { User, Order, VPSPlan } from '@/lib/types';
import { formatPrice, convertUSDToVND } from '@/utils/currency';

// Mock data for demonstration
const mockUsers: User[] = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    created_at: '2024-01-15',
    subscription_status: 'active'
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane@example.com',
    created_at: '2024-01-20',
    subscription_status: 'inactive'
  },
  {
    id: 3,
    name: 'Mike Johnson',
    email: 'mike@example.com',
    created_at: '2024-02-01',
    subscription_status: 'active'
  }
];

const mockOrders: Order[] = [
  {
    id: 1,
    user_id: 1,
    plan_id: 1,
    status: 'active',
    payment_method: 'qr_code',
    total: convertUSDToVND(29.99), // Convert from $29.99 to VND
    created_at: '2024-01-15',
    order_items: []
  },
  {
    id: 2,
    user_id: 2,
    plan_id: 2,
    status: 'pending',
    payment_method: 'momo',
    total: convertUSDToVND(59.99), // Convert from $59.99 to VND
    created_at: '2024-01-20',
    order_items: []
  }
];

const mockVPSPlans: VPSPlan[] = [
  {
    id: 1,
    name: 'Basic VPS',
    description: 'Perfect for small websites and development projects',
    price: convertUSDToVND(29.99), // Convert from $29.99 to VND
    monthly_price: convertUSDToVND(29.99),
    cpu: '2 cores',
    cpu_cores: 2,
    ram: '4 GB',
    ram_gb: 4,
    storage: '80 GB SSD',
    storage_type: 'SSD',
    storage_gb: 80,
    bandwidth: '2 TB',
    bandwidth_gb: 2000,
    features: ['Full Root Access', '24/7 Support', '99.9% Uptime'],
    popular: false,
    is_active: true,
    created_at: '2024-01-01'
  },
  {
    id: 2,
    name: 'Standard VPS',
    description: 'Great for growing businesses and applications',
    price: convertUSDToVND(59.99), // Convert from $59.99 to VND
    monthly_price: convertUSDToVND(59.99),
    cpu: '4 cores',
    cpu_cores: 4,
    ram: '8 GB',
    ram_gb: 8,
    storage: '160 GB SSD',
    storage_type: 'SSD',
    storage_gb: 160,
    bandwidth: '4 TB',
    bandwidth_gb: 4000,
    features: ['Full Root Access', '24/7 Support', '99.9% Uptime', 'Free Backup'],
    popular: true,
    is_active: true,
    created_at: '2024-01-01'
  }
];

export default function AdminDashboard() {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users] = useState<User[]>(mockUsers);
  const [orders] = useState<Order[]>(mockOrders);
  const [vpsPlans] = useState<VPSPlan[]>(mockVPSPlans);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState('overview');
  const router = useRouter();

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('admin_authenticated');
    if (!isAuthenticated) {
      router.push('/admin/login');
    } else {
      setAuthenticated(true);
    }
    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('admin_authenticated');
    localStorage.removeItem('admin_user');
    router.push('/admin/login');
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!authenticated) {
    return null;
  }

  const filteredUsers = users.filter(user =>
    (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
  const activeUsers = users.filter(user => user.subscription_status === 'active').length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <Button onClick={handleLogout} variant="outline">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="vps-plans">VPS Plans</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{users.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {activeUsers} active users
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{orders.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {orders.filter(o => o.status === 'active').length} active
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatPrice(totalRevenue)}</div>
                  <p className="text-xs text-muted-foreground">
                    This month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">VPS Plans</CardTitle>
                  <Server className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{vpsPlans.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Active plans
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Orders */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>Latest customer orders</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orders.slice(0, 5).map((order) => {
                    const user = users.find(u => u.id === order.user_id);
                    return (
                      <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">{user?.name || 'Unknown User'}</p>
                          <p className="text-sm text-gray-500">Order #{order.id}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatPrice(order.total || 0)}</p>
                          <Badge variant={order.status === 'active' ? 'default' : 'secondary'}>
                            {order.status}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">User Management</h2>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b">
                      <tr>
                        <th className="text-left p-4 font-medium">Name</th>
                        <th className="text-left p-4 font-medium">Email</th>
                        <th className="text-left p-4 font-medium">Status</th>
                        <th className="text-left p-4 font-medium">Joined</th>
                        <th className="text-left p-4 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="border-b last:border-0">
                          <td className="p-4 font-medium">{user.name}</td>
                          <td className="p-4 text-gray-600">{user.email}</td>
                          <td className="p-4">
                            <Badge variant={user.subscription_status === 'active' ? 'default' : 'secondary'}>
                              {user.subscription_status}
                            </Badge>
                          </td>
                          <td className="p-4 text-gray-600">{user.created_at}</td>
                          <td className="p-4">
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Order Management</h2>
              <Button>
                <Filter className="h-4 w-4 mr-2" />
                Filter Orders
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b">
                      <tr>
                        <th className="text-left p-4 font-medium">Order ID</th>
                        <th className="text-left p-4 font-medium">Customer</th>
                        <th className="text-left p-4 font-medium">Plan</th>
                        <th className="text-left p-4 font-medium">Payment</th>
                        <th className="text-left p-4 font-medium">Total</th>
                        <th className="text-left p-4 font-medium">Status</th>
                        <th className="text-left p-4 font-medium">Date</th>
                        <th className="text-left p-4 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => {
                        const user = users.find(u => u.id === order.user_id);
                        const plan = vpsPlans.find(p => p.id === order.plan_id);
                        const paymentMethodDisplay = order.payment_method === 'qr_code' ? 'QR Code' :
                          order.payment_method === 'momo' ? 'MoMo' :
                            order.payment_method === 'vnpay' ? 'VNPay' : order.payment_method;
                        return (
                          <tr key={order.id} className="border-b last:border-0">
                            <td className="p-4 font-mono">#{order.id}</td>
                            <td className="p-4">{user?.name || 'Unknown'}</td>
                            <td className="p-4">{plan?.name || 'Unknown Plan'}</td>
                            <td className="p-4">{paymentMethodDisplay}</td>
                            <td className="p-4 font-medium">{formatPrice(order.total || 0)}</td>
                            <td className="p-4">
                              <Badge variant={order.status === 'active' ? 'default' : 'secondary'}>
                                {order.status}
                              </Badge>
                            </td>
                            <td className="p-4 text-gray-600">{order.created_at}</td>
                            <td className="p-4">
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="outline">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* VPS Plans Tab */}
          <TabsContent value="vps-plans" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">VPS Plan Management</h2>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add New Plan
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vpsPlans.map((plan) => (
                <Card key={plan.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">{plan.name}</CardTitle>
                        <CardDescription className="text-2xl font-bold text-primary mt-2">
                          {formatPrice(plan.price || 0)}/month
                        </CardDescription>
                      </div>
                      {plan.popular && (
                        <Badge variant="default">Popular</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">CPU:</span>
                        <span className="text-sm font-medium">{plan.cpu}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">RAM:</span>
                        <span className="text-sm font-medium">{plan.ram}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Storage:</span>
                        <span className="text-sm font-medium">{plan.storage}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Bandwidth:</span>
                        <span className="text-sm font-medium">{plan.bandwidth}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <h2 className="text-2xl font-bold">Settings</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Site Configuration</CardTitle>
                  <CardDescription>Manage site-wide settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="site-name">Site Name</Label>
                    <Input id="site-name" defaultValue="VPS Rental" />
                  </div>
                  <div>
                    <Label htmlFor="support-email">Support Email</Label>
                    <Input id="support-email" defaultValue="support@vpsrental.com" />
                  </div>
                  <div>
                    <Label htmlFor="maintenance-message">Maintenance Message</Label>
                    <Textarea id="maintenance-message" placeholder="Enter maintenance message..." />
                  </div>
                  <Button>Save Changes</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Payment Settings</CardTitle>
                  <CardDescription>Configure payment methods</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Enabled Payment Methods</Label>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" defaultChecked />
                        <span>QR Code Payment</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" defaultChecked />
                        <span>MoMo Payment</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" defaultChecked />
                        <span>VNPay</span>
                      </label>
                    </div>
                  </div>
                  <Button>Update Payment Settings</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
