import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ShoppingBag,
    Clock,
    DollarSign,
    Search,
    RefreshCw,
    Download,
    Plus,
    Calendar,
    MoreHorizontal,
    MoreVertical,
    ChevronLeft,
    ChevronRight,
    Eye,
    ClipboardList,
    IndianRupee,
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    useAdminOrders,
    useOrderStats,
    useUpdateOrderStatus,
    OrderStatus,
    OrderWithItemCount,
} from '@/hooks/useAdminOrders';
import { formatPrice, formatDate } from '@/lib/format';
import { getRandomColor } from '@/lib/colors';
import { useQueryClient } from '@tanstack/react-query';
import { useDebounce } from '@/hooks/useDebounce';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import TextLoader from '@/components/TextLoader';

const PAGE_SIZE = 10;

const STATUS_OPTIONS: { value: OrderStatus | 'all'; label: string }[] = [
    { value: 'all', label: 'ALL STATUS' },
    { value: 'pending', label: 'PENDING' },
    { value: 'shipped', label: 'SHIPPED' },
    { value: 'delivered', label: 'DELIVERED' },
    { value: 'cancelled', label: 'CANCELLED' },
];

const getStatusBadgeClasses = (status: string) => {
    switch (status) {
        case 'pending':
            return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
        case 'shipped':
            return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
        case 'delivered':
            return 'bg-green-500/10 text-green-600 border-green-500/20';
        case 'cancelled':
            return 'bg-red-500/10 text-red-600 border-red-500/20';
        default:
            return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
};

const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

const AdminOrders = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

    // Debounce search to avoid excessive queries
    const debouncedSearch = useDebounce(search, 300);

    // Query options
    const queryOptions = useMemo(
        () => ({
            page,
            pageSize: PAGE_SIZE,
            search: debouncedSearch,
            statusFilter,
            dateRange,
        }),
        [page, debouncedSearch, statusFilter, dateRange]
    );

    // Fetch orders and stats
    const { data: ordersData, isLoading, isFetching } = useAdminOrders(queryOptions);
    const { data: stats, isLoading: statsLoading } = useOrderStats();
    const updateStatusMutation = useUpdateOrderStatus();

    // Calculate pagination info
    const totalPages = Math.ceil((ordersData?.totalCount || 0) / PAGE_SIZE);
    const startItem = (page - 1) * PAGE_SIZE + 1;
    const endItem = Math.min(page * PAGE_SIZE, ordersData?.totalCount || 0);

    // Handle filter changes - reset to page 1
    const handleStatusChange = (status: OrderStatus | 'all') => {
        setStatusFilter(status);
        setPage(1);
    };

    const handleDateRangeChange = (range: DateRange | undefined) => {
        setDateRange(range);
        setPage(1);
    };

    const handleSearchChange = (value: string) => {
        setSearch(value);
        setPage(1);
    };

    // Handle refresh
    const handleRefresh = () => {
        queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
        queryClient.invalidateQueries({ queryKey: ['admin-order-stats'] });
    };

    // Handle status update
    const handleStatusUpdate = (orderId: string, newStatus: OrderStatus) => {
        updateStatusMutation.mutate({ orderId, status: newStatus });
    };

    // Export CSV
    const handleExportCSV = () => {
        if (!ordersData?.orders.length) return;

        const headers = ['Order ID', 'Customer', 'Email', 'Date', 'Status', 'Total', 'Items'];
        const rows = ordersData.orders.map((order) => [
            order.order_code || order.id,
            `${order.first_name} ${order.last_name}`,
            order.email,
            formatDate(new Date(order.created_at || '')),
            order.status,
            order.total,
            order.item_count,
        ]);

        const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    // Stats cards data
    const statCards = [
        {
            title: 'TOTAL ORDERS',
            value: stats?.totalOrders || 0,
            icon: ClipboardList,
            color: 'text-foreground',
            bgColor: 'bg-accent/10',
        },
        {
            title: 'PENDING',
            value: stats?.pendingOrders || 0,
            icon: Clock,
            color: 'text-yellow-600',
            bgColor: 'bg-yellow-500/10',
        },
        {
            title: 'REVENUE',
            value: formatPrice(stats?.totalRevenue || 0),
            icon: IndianRupee,
            color: 'text-green-600',
            bgColor: 'bg-green-500/10',
            isLarge: true,
        },
    ];

    return (
        <AdminLayout
            header={
                <header className="h-20 shrink-0 bg-white border-b border-border px-8 flex items-center justify-between">
                    <div className="flex flex-col">
                        <h2 className="text-2xl font-bold text-black tracking-tight actions uppercase">Orders Management</h2>
                        <p className="text-xs text-muted-foreground">Manage and track customer orders</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <RefreshCw
                            onClick={handleRefresh}
                            className={`h-5 w-5 cursor-pointer text-black hover:opacity-70 transition-all ${isFetching ? 'animate-spin' : ''}`}
                        />
                        <button
                            onClick={handleExportCSV}
                            className="h-10 px-4 flex items-center justify-center gap-2 rounded-lg border border-border hover:bg-black hover:text-white text-black bg-white text-sm font-bold transition-all"
                        >
                            <Download className="h-5 w-5" />
                            Export CSV
                        </button>
                        <Popover>
                            <PopoverTrigger asChild>
                                <button className="h-10 px-4 flex items-center justify-center gap-2 rounded-lg border border-border bg-black text-white text-sm font-bold transition-all hover:bg-red-600">
                                    <Calendar className="h-4 w-4" />
                                    <span>
                                        {dateRange?.from ? (
                                            dateRange.to ? (
                                                <>
                                                    {format(dateRange.from, "LLL dd")} - {format(dateRange.to, "LLL dd")}
                                                </>
                                            ) : (
                                                format(dateRange.from, "LLL dd")
                                            )
                                        ) : (
                                            "Date Range"
                                        )}
                                    </span>
                                </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="end">
                                <CalendarPicker
                                    initialFocus
                                    mode="range"
                                    defaultMonth={dateRange?.from}
                                    selected={dateRange}
                                    onSelect={handleDateRangeChange}
                                    numberOfMonths={1}
                                />
                                {dateRange && (
                                    <div className="p-3 border-t border-border flex justify-end">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-xs font-bold uppercase tracking-tight"
                                            onClick={() => handleDateRangeChange(undefined)}
                                        >
                                            Clear Range
                                        </Button>
                                    </div>
                                )}
                            </PopoverContent>
                        </Popover>
                    </div>
                </header>
            }
        >
            <div className="space-y-6">

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {statCards.map((card, index) => (
                        <motion.div
                            key={card.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                            className="bg-white border border-[#e6dbdc] p-6 rounded-2xl shadow-sm"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-bold text-muted-foreground tracking-wider">
                                        {card.title}
                                    </p>
                                    <p className={`text-3xl font-black mt-1 ${card.isLarge ? 'text-black' : ''}`}>
                                        {statsLoading ? <TextLoader text="" className="inline-flex min-w-0" showDots={true} /> : card.value}
                                    </p>
                                </div>
                                <div className={`p-3 rounded-full ${card.bgColor}`}>
                                    <card.icon className={`h-6 w-6 ${card.color}`} />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Filters */}
                <div className="bg-white border border-border p-2 rounded-2xl shadow-sm flex flex-row items-center justify-between gap-2 overflow-x-auto no-scrollbar">
                    {/* Search */}
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by Order"
                            value={search}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            className="pl-10 h-10 border border-border bg-secondary/50 rounded-xl focus-visible:ring-1 focus-visible:ring-ring font-medium box-border"
                        />
                    </div>

                    {/* Status Filters */}
                    <div className="flex items-center gap-2">
                        {STATUS_OPTIONS.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => handleStatusChange(option.value)}
                                className={`
                                    px-5 h-10 rounded-xl text-xs font-black tracking-wide uppercase whitespace-nowrap transition-all flex items-center justify-center border border-border box-border
                                    ${statusFilter === option.value
                                        ? 'bg-black text-white shadow-md border-black'
                                        : 'bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground'}
                                `}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Orders Table */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                    className="bg-white border border-[#e6dbdc] rounded-2xl shadow-sm overflow-hidden"
                >
                    <Table>
                        <TableHeader>
                            <TableRow className="border-b border-border bg-secondary/50 hover:bg-secondary/50">
                                <TableHead className="font-bold text-xs text-muted-foreground tracking-wider">
                                    ORDER ID
                                </TableHead>
                                <TableHead className="font-bold text-xs text-muted-foreground tracking-wider">
                                    CUSTOMER
                                </TableHead>
                                <TableHead className="font-bold text-xs text-muted-foreground tracking-wider">
                                    PRODUCT
                                </TableHead>
                                <TableHead className="font-bold text-xs text-muted-foreground tracking-wider">
                                    DATE
                                </TableHead>
                                <TableHead className="font-bold text-xs text-muted-foreground tracking-wider">
                                    TOTAL
                                </TableHead>
                                <TableHead className="font-bold text-xs text-muted-foreground tracking-wider">
                                    STATUS
                                </TableHead>
                                <TableHead className="font-bold text-xs text-muted-foreground tracking-wider text-right">
                                    ACTIONS
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                // Loading skeleton
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i} className="border-b border-foreground/5">
                                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Skeleton className="h-10 w-10 rounded-full" />
                                                <div>
                                                    <Skeleton className="h-4 w-24 mb-1" />
                                                    <Skeleton className="h-3 w-32" />
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Skeleton className="h-10 w-10 rounded-md" />
                                                <Skeleton className="h-4 w-32" />
                                            </div>
                                        </TableCell>
                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                        <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                                    </TableRow>
                                ))
                            ) : ordersData?.orders.length === 0 ? (
                                // Empty state
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-12">
                                        <div className="flex flex-col items-center gap-2">
                                            <ShoppingBag className="h-12 w-12 text-muted-foreground/50" />
                                            <p className="font-bold text-lg">No orders found</p>
                                            <p className="text-muted-foreground text-sm">
                                                {search || statusFilter !== 'all'
                                                    ? 'Try adjusting your filters'
                                                    : 'Orders will appear here when customers place them'}
                                            </p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                // Order rows
                                ordersData?.orders.map((order: OrderWithItemCount) => (
                                    <TableRow
                                        key={order.id}
                                        className="border-b border-border hover:bg-neutral-50/50"
                                    >
                                        <TableCell className="font-bold">
                                            #{order.order_code || order.id.slice(0, 8).toUpperCase()}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-10 w-10">
                                                    <AvatarFallback className={`font-bold ${getRandomColor(order.email)}`}>
                                                        {getInitials(order.first_name, order.last_name)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-bold">
                                                        {order.first_name} {order.last_name.charAt(0)}.
                                                    </p>
                                                    <p className="text-sm text-muted-foreground" title={order.email}>
                                                        {order.email.length > 15 ? order.email.substring(0, 15) + "..." : order.email}
                                                    </p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md border border-border bg-secondary/50">
                                                    {order.product_image ? (
                                                        <img
                                                            src={order.product_image}
                                                            alt={order.product_name}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="flex h-full w-full items-center justify-center">
                                                            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="font-medium" title={order.product_name}>
                                                    {order.product_name && order.product_name.length > 20
                                                        ? order.product_name.substring(0, 20) + "..."
                                                        : order.product_name || 'Unknown Product'}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {formatDate(new Date(order.created_at || ''))}
                                        </TableCell>
                                        <TableCell className="font-bold">{formatPrice(order.total)}</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="outline"
                                                className={`font-bold capitalize border ${getStatusBadgeClasses(order.status)}`}
                                            >
                                                <span className="mr-1.5">●</span>
                                                {order.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48">
                                                    <DropdownMenuItem
                                                        onClick={() => navigate(`/admin/orders/${order.id}`)}
                                                        className="font-medium"
                                                    >
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        View Details
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuLabel>Update Status</DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    {(['pending', 'shipped', 'delivered', 'cancelled'] as OrderStatus[]).map(
                                                        (status) => (
                                                            <DropdownMenuItem
                                                                key={status}
                                                                onClick={() => handleStatusUpdate(order.id, status)}
                                                                disabled={order.status === status || updateStatusMutation.isPending}
                                                                className="capitalize"
                                                            >
                                                                <span
                                                                    className={`mr-2 h-2 w-2 rounded-full ${status === 'pending'
                                                                        ? 'bg-yellow-500'
                                                                        : status === 'shipped'
                                                                            ? 'bg-blue-500'
                                                                            : status === 'delivered'
                                                                                ? 'bg-green-500'
                                                                                : 'bg-red-500'
                                                                        }`}
                                                                />
                                                                {status}
                                                            </DropdownMenuItem>
                                                        )
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>

                    {/* Pagination */}
                    {!isLoading && ordersData && ordersData.totalCount > 0 && (
                        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-secondary/50">
                            <p className="text-sm text-muted-foreground">
                                Showing <span className="font-bold text-foreground">{startItem}-{endItem}</span> of{' '}
                                <span className="font-bold text-foreground">{ordersData.totalCount}</span> orders
                            </p>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page === 1 || isFetching}
                                    className="border-foreground/20"
                                >
                                    <ChevronLeft className="h-4 w-4 mr-1" />
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={page >= totalPages || isFetching}
                                    className="border-foreground/20"
                                >
                                    Next
                                    <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </AdminLayout>
    );
};

export default AdminOrders;
