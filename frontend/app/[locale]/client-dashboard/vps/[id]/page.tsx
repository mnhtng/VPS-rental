"use client"

import { useEffect, useState, useRef } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { useLocale } from "next-intl"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RefreshCw, Square, HardDrive, Activity, Network, Server, Power, Plus, RotateCcw, Trash2, Loader2, Camera, AlertTriangle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { UsageChart } from "@/components/custom/client/UsageChart"
import VNCConsole from "@/components/custom/console/VNCConsole"
import { cn } from "@/lib/utils"
import { VPSItemPlaceholder } from "@/components/custom/placeholder/vps"
import { toast } from "sonner"
import useVPS from "@/hooks/useVPS"
import { VPSInfo, VPSRRDDataPoint } from "@/types/types"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDateTime } from "@/utils/string"
import { VPSSnapshot } from "@/types/types"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function VPSDetail() {
  const params = useParams();
  const locale = useLocale();
  const vpsId = params.id as string;
  const { getVpsInfo, getRRD, stopVM, rebootVM, startVM, listSnapshots, createSnapshot, restoreSnapshot, deleteSnapshot } = useVPS()

  const [vpsInfo, setVpsInfo] = useState<VPSInfo | null>(null)
  const prevNetworkCounterRef = useRef<{
    rx: number; // received bytes (netin)
    tx: number; // transmitted bytes (netout)
  } | null>(null)
  const timeDeltaRef = useRef<{
    lastFetch: number;
    currentFetch: number;
  }>({
    lastFetch: 0,
    currentFetch: 0,
  })
  const [rrdData, setRrdData] = useState<VPSRRDDataPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [rrdLoading, setRrdLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  // Snapshot states
  const [snapshots, setSnapshots] = useState<VPSSnapshot | null>(null)
  const [snapshotsLoading, setSnapshotsLoading] = useState(true)
  const [snapshotActionLoading, setSnapshotActionLoading] = useState<string | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newSnapshotName, setNewSnapshotName] = useState('')
  const [newSnapshotDescription, setNewSnapshotDescription] = useState('')


  const fetchVPSInfo = async (signal?: AbortSignal) => {
    try {
      const result = await getVpsInfo(vpsId, signal)

      if (signal?.aborted) return

      if (result.error) {
        toast.error(result.message, {
          description: result.error.detail
        })
        setLoading(false)
      } else {
        // Update previous network counters and time delta for network rate calculation
        if (prevNetworkCounterRef.current === null) {
          prevNetworkCounterRef.current = {
            rx: result.data?.vm_info.netin || 0,
            tx: result.data?.vm_info.netout || 0,
          }
          timeDeltaRef.current = {
            lastFetch: 0,
            currentFetch: Date.now(),
          }
        } else {
          const currentNet = vpsInfo?.vm_info
          const prevTimeDelta = timeDeltaRef.current.currentFetch

          if (currentNet) {
            prevNetworkCounterRef.current = {
              rx: currentNet.netin || 0,
              tx: currentNet.netout || 0,
            }
          }

          timeDeltaRef.current = {
            lastFetch: prevTimeDelta,
            currentFetch: Date.now(),
          }
        }

        setVpsInfo(result.data)
        setLoading(false)
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;

      toast.error('Failed to fetch VPS info', {
        description: "Please try again later"
      })
      setLoading(false)
    }
  }

  const fetchProxmoxRRD = async (signal?: AbortSignal) => {
    try {
      const result = await getRRD(vpsId, 'day', 'AVERAGE', signal)

      if (signal?.aborted) return

      if (result.error) {
        toast.error(result.message, {
          description: result.error.detail
        })
      } else {
        setRrdData(result.data || [])
      }

      setRrdLoading(false)
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;

      toast.error('Failed to fetch VPS RRD data', {
        description: "Please try again later"
      })
      setRrdLoading(false)
    }
  }

  const fetchSnapshots = async (signal?: AbortSignal) => {
    try {
      const result = await listSnapshots(vpsId, signal)

      if (signal?.aborted) return

      if (result.error) {
        toast.error(result.message, {
          description: result.error.detail
        })
      } else {
        setSnapshots(result.data || null)
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;

      toast.error('Failed to fetch snapshots', {
        description: "Please try again later"
      })
    } finally {
      setSnapshotsLoading(false)
    }
  }

  useEffect(() => {
    const controller = new AbortController()

    fetchVPSInfo(controller.signal)
    fetchProxmoxRRD(controller.signal)
    fetchSnapshots(controller.signal)

    if (vpsInfo?.vm_info.status === 'running') {
      const scheduleNextFetchInfo = () => {
        const randomDelay = Math.floor(Math.random() * 4000) + 1000

        return setTimeout(() => {
          fetchVPSInfo(controller.signal)
          intervalId = scheduleNextFetchInfo()
        }, randomDelay)
      }

      const scheduleNextFetchRrd = () => {
        return setTimeout(() => {
          fetchProxmoxRRD(controller.signal)
          rrdIntervalId = scheduleNextFetchRrd()
        }, 1000 * 60)
      }

      let intervalId = scheduleNextFetchInfo()
      let rrdIntervalId = scheduleNextFetchRrd()

      return () => {
        controller.abort()
        clearTimeout(intervalId)
        clearTimeout(rrdIntervalId)
      }
    } else {
      return () => {
        controller.abort()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vpsInfo?.vm_info.status])

  const getNetworkSpeed = (mbps: number) => {
    if (mbps >= 1000) {
      const gbps = (mbps / 1000).toFixed(1);
      return `${gbps} Gbps`;
    }
    return `${mbps} Mbps`;
  };

  const getDiskSize = (storage_gb: number, storage_type?: string) => {
    if (storage_gb >= 1000) {
      const tb = (storage_gb / 1000).toFixed(1);
      return `${tb} TB ${storage_type || ''}`;
    }
    return `${storage_gb} GB ${storage_type || ''}`;
  }

  const formatUptime = (uptime: number) => {
    const d = Math.floor(uptime / 86400)
    const h = Math.floor((uptime % 86400) / 3600)
    const m = Math.floor((uptime % 3600) / 60)
    const s = uptime % 60

    if (d > 0) return `${d}d ${h}h ${m}m`
    if (h > 0) return `${h}h ${m}m ${s}s`
    if (m > 0) return `${m}m ${s}s`
    return `${s}s`
  }

  const handleActionVM = async (action: string) => {
    if (action === 'start') {
      if (vpsInfo?.vm_info.status === 'running') return
    } else {
      if (vpsInfo?.vm_info.status === 'stopped') return
    }

    setActionLoading(true)
    toast.info('Performing action...', {
      description: 'Please wait a moment'
    })

    try {
      const result = await (action === 'stop'
        ? stopVM(vpsId)
        : action === 'reboot'
          ? rebootVM(vpsId)
          : startVM(vpsId)
      )

      if (result.error) {
        toast.error(result.message, {
          description: result.error.detail
        })
      } else {
        toast.success('Success', {
          description: "Please wait a moment for the system to update the new status"
        })

        setTimeout(() => {
          window.location.reload()
        }, action === 'stop'
          ? 2000
          : action === 'reboot'
            ? 12000
            : 10000)
      }
    } catch {
      toast.error('Failed to perform action', {
        description: "Please try again later"
      })
      setActionLoading(false)
    }
  }

  const handleCreateSnapshot = async () => {
    if (!newSnapshotName.trim()) {
      toast.error('Snapshot name is required')
      return
    }

    const nameRegex = /^[a-zA-Z0-9_-]+$/
    if (!nameRegex.test(newSnapshotName)) {
      toast.error('Invalid snapshot name', {
        description: 'Only alphanumeric characters, hyphens, and underscores are allowed'
      })
      return
    }

    setSnapshotActionLoading('create')

    try {
      const result = await createSnapshot(vpsId, newSnapshotName, newSnapshotDescription)

      if (result.error) {
        toast.error(result.message, {
          description: result.error.detail
        })
      } else {
        toast.success('Snapshot creation initiated', {
          description: 'Please wait a few minutes for the snapshot to be created'
        })

        setCreateDialogOpen(false)
        setNewSnapshotName('')
        setNewSnapshotDescription('')
        setTimeout(() => fetchSnapshots(), 3000)
      }
    } catch {
      toast.error('Failed to create snapshot', {
        description: "Please try again later"
      })
    } finally {
      setSnapshotActionLoading(null)
    }
  }

  const handleRestoreSnapshot = async (snapshotName: string) => {
    setSnapshotActionLoading(`restore-${snapshotName}`)

    try {
      const result = await restoreSnapshot(vpsId, snapshotName)

      if (result.error) {
        toast.error(result.message, {
          description: result.error.detail
        })
      } else {
        toast.success('Snapshot restore initiated', {
          description: 'Please wait a few minutes for the VPS to be restored'
        })
      }
    } catch {
      toast.error('Failed to restore snapshot', {
        description: "Please try again later"
      })
    } finally {
      setSnapshotActionLoading(null)
    }
  }

  const handleDeleteSnapshot = async (snapshotName: string) => {
    setSnapshotActionLoading(`delete-${snapshotName}`)

    try {
      const result = await deleteSnapshot(vpsId, snapshotName)

      if (result.error) {
        toast.error(result.message, {
          description: result.error.detail
        })
      } else {
        toast.success('Snapshot deletion initiated', {
          description: 'Please wait a few minutes for the snapshot to be deleted'
        })
        setTimeout(() => fetchSnapshots(), 2000)
      }
    } catch {
      toast.error('Failed to delete snapshot', {
        description: "Please try again later"
      })
    } finally {
      setSnapshotActionLoading(null)
    }
  }

  const formatSnapshotDate = (timestamp?: number) => {
    if (!timestamp) return 'N/A'
    const date = new Date(timestamp * 1000)
    return formatDateTime(date)
  }

  const getNetworkRateDisplay = () => {
    //* Calculate network rate
    // Receive rate (rx rate) = (new rx value - old rx value) / time between two fetches
    // Transmit rate (tx rate) = (new tx value - old tx value) / time between two fetches

    if (vpsInfo?.vm_info.status !== 'running') {
      return '0 bps'
    }

    if (!prevNetworkCounterRef.current) {
      return '0 bps'
    }

    const currentRx = vpsInfo?.vm_info.netin || 0
    const currentTx = vpsInfo?.vm_info.netout || 0
    const timeDiffMs = timeDeltaRef.current.currentFetch - timeDeltaRef.current.lastFetch

    if (timeDiffMs <= 0) {
      return '0 bps'
    }

    if (currentRx < prevNetworkCounterRef.current.rx || currentTx < prevNetworkCounterRef.current.tx) {
      prevNetworkCounterRef.current = { rx: currentRx, tx: currentTx }
      return '0 bps'
    }

    const rxRate = (currentRx - prevNetworkCounterRef.current.rx) / (timeDiffMs / 1000)
    const txRate = (currentTx - prevNetworkCounterRef.current.tx) / (timeDiffMs / 1000)

    const rateInBytesPerSec = rxRate + txRate
    const rateInBitsPerSec = rateInBytesPerSec * 8

    if (rateInBitsPerSec >= 1_000_000_000) {
      return `${(rateInBitsPerSec / 1_000_000_000).toFixed(1)} Gbps`
    } else if (rateInBitsPerSec >= 1_000_000) {
      return `${(rateInBitsPerSec / 1_000_000).toFixed(1)} Mbps`
    } else if (rateInBitsPerSec >= 1_000) {
      return `${(rateInBitsPerSec / 1_000).toFixed(0)} Kbps`
    } else {
      return `${rateInBitsPerSec.toFixed(0)} bps`
    }
  }

  const calculateDiskUsagePercent = () => {
    // Check if disk_info exists and has result array
    if (!vpsInfo?.disk_info || !vpsInfo?.disk_info.result || !Array.isArray(vpsInfo.disk_info.result)) {
      return 0;
    }

    let totalUsed = 0;
    let totalSize = 0;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vpsInfo.disk_info.result.forEach((disk: any) => {
      if (disk?.["used-bytes"] && disk?.["total-bytes"]) {
        totalUsed += disk["used-bytes"];
        totalSize += disk["total-bytes"];
      }
    })

    return totalSize > 0 ? (totalUsed / totalSize) * 100 : 0;
  }

  // Calculate resource usage
  const cpu_usage = (vpsInfo?.vm_info.cpu_usage * 100).toFixed(2) || '0.00'
  const memory_usage = ((vpsInfo?.vm_info.memory_usage / vpsInfo?.vm_info.max_memory) * 100).toFixed(2) || '0.00'
  const disk_usage = calculateDiskUsagePercent().toFixed(2) || '0.00'
  const network_rate = getNetworkRateDisplay()
  const max_cpu = vpsInfo?.vm_info.max_cpu || 0
  const max_memory = (vpsInfo?.vm_info.memory / 1024).toFixed(2) || 0
  const max_disk = getDiskSize(vpsInfo?.vm?.storage_gb || 0, vpsInfo?.vm?.storage_type)

  return (
    <div className={cn(
      "space-y-6 w-full h-full animate-in fade-in slide-in-from-bottom-4 duration-700",
      !vpsInfo && "justify-center flex"
    )}>
      {/* Header Section */}
      {loading ? (
        <VPSItemPlaceholder />
      ) : vpsInfo ? (
        <>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between animate-in fade-in slide-in-from-top-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {vpsInfo?.vm?.hostname || 'Configuring...'}
                </h1>
                <div className="flex items-center gap-2">
                  <div
                    className={`h-2 w-2 rounded-full animate-pulse ${vpsInfo.vm_info.status === 'running'
                      ? 'bg-green-500'
                      : vpsInfo.vm_info.status === 'stopped'
                        ? 'bg-red-500'
                        : 'bg-yellow-500'
                      }`}
                  />
                  <Badge className={cn(
                    'hidden sm:inline-flex',
                    vpsInfo.vm_info.status === 'running' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'
                  )}>
                    {vpsInfo.vm_info.status === 'running' ? 'Running' : vpsInfo.vm_info.status === 'stopped' ? 'Stopped' : vpsInfo.vm_info.status}
                  </Badge>
                </div>
              </div>
              <p className="text-muted-foreground mt-1">
                {vpsInfo.vm_info?.ostype.toUpperCase() || 'N/A'} • {vpsInfo.vm?.vcpu || 0} vCPU • {vpsInfo.vm?.ram_gb || 0}GB RAM • {getDiskSize(vpsInfo.vm?.storage_gb || 0, vpsInfo.vm?.storage_type)} • {getNetworkSpeed(vpsInfo.vm?.bandwidth_mbps || 0)} Network
              </p>
            </div>

            {vpsInfo.vm?.vps_instance?.status !== 'suspended' && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent hover:scale-105 transition-all"
                  disabled={actionLoading || vpsInfo.vm_info.status === 'stopped' || vpsInfo.vm?.vps_instance?.status === 'suspended'}
                  onClick={() => handleActionVM('stop')}
                >
                  <Square className="mr-0 sm:mr-2 h-4 w-4" />
                  <span>Stop</span>
                </Button>
                <Button
                  variant="outline"
                  className="hover:scale-105 transition-all"
                  disabled={actionLoading || vpsInfo.vm_info.status === 'stopped' || vpsInfo.vm?.vps_instance?.status === 'suspended'}
                  onClick={() => handleActionVM('reboot')}
                >
                  <RefreshCw className={`mr-0 sm:mr-2 h-4 w-4 ${actionLoading ? 'animate-spin' : ''}`} />
                  <span>Reboot</span>
                </Button>
                <Button
                  className="bg-linear-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 hover:scale-105 transition-all"
                  disabled={vpsInfo.vm_info.status === 'running' || vpsInfo.vm?.vps_instance?.status === 'suspended'}
                  onClick={() => handleActionVM('start')}
                >
                  <Power className="mr-0 sm:mr-2 h-4 w-4" />
                  <span>Start</span>
                </Button>
              </div>
            )}
          </div>

          {/* Suspension Banner */}
          {vpsInfo.vm?.vps_instance?.status === 'suspended' && (
            <Card className="border-amber-500/50 bg-amber-50/50 dark:bg-amber-900/10 animate-in fade-in slide-in-from-top-4">
              <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-amber-500/20 p-2">
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-amber-700 dark:text-amber-500">VPS Suspended</h3>
                    <p className="text-sm text-amber-600/80 dark:text-amber-400/80">
                      Your VPS has been suspended due to expiration. Please renew to restore access and resume operations.
                    </p>
                  </div>
                </div>
                <Button asChild className="bg-amber-500 hover:bg-amber-600 text-white shrink-0">
                  <Link href={`/${locale}/client-dashboard/billing`}>
                    Renew Now
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          <Tabs defaultValue="overview" className="space-y-4">
            {vpsInfo.vm?.vps_instance?.status !== 'suspended' && (
              <TabsList className="w-full justify-start overflow-x-auto">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="console">Console (VNC)</TabsTrigger>
                <TabsTrigger value="snapshots">Snapshots</TabsTrigger>
              </TabsList>
            )}

            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02] animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: '0ms' }}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
                    <Activity className="h-4 w-4 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{cpu_usage || '0'}%</div>
                    <p className="text-xs text-muted-foreground">of {max_cpu || 0} Cores</p>
                  </CardContent>
                </Card>
                <Card className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02] animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: '50ms' }}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Memory</CardTitle>
                    <Activity className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {memory_usage || '0'}%
                    </div>
                    <p className="text-xs text-muted-foreground">of {max_memory || 0} GB</p>
                  </CardContent>
                </Card>
                <Card className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02] animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: '100ms' }}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Disk Usage</CardTitle>
                    <HardDrive className="h-4 w-4 text-purple-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-600">
                      {disk_usage || '0'}%
                    </div>
                    <p className="text-xs text-muted-foreground">of {max_disk}</p>
                  </CardContent>
                </Card>
                <Card className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02] animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: '150ms' }}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Network</CardTitle>
                    <Network className="h-4 w-4 text-orange-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">
                      {network_rate}
                    </div>
                    <p className="text-xs text-muted-foreground">Current rate</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 lg:grid-cols-7">
                <Card className="lg:col-span-4 animate-in fade-in slide-in-from-left-4 duration-500">
                  <CardHeader>
                    <CardTitle>Performance (Last 24h)</CardTitle>
                    <CardDescription>Real-time data from Proxmox RRD</CardDescription>
                  </CardHeader>
                  <CardContent className="pl-2">
                    <UsageChart data={rrdData} loading={rrdLoading} />
                  </CardContent>
                </Card>
                <Card className="lg:col-span-3 animate-in fade-in slide-in-from-right-4 duration-500">
                  <CardHeader>
                    <CardTitle>Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="text-muted-foreground">VM ID</div>
                      <div className="font-medium">{vpsInfo.vm?.vmid || 'N/A'}</div>
                      <div className="text-muted-foreground">Node</div>
                      <div className="font-medium">{vpsInfo.node_name || 'N/A'}</div>
                      <div className="text-muted-foreground">IP Address</div>
                      <div className="font-medium font-mono">{vpsInfo.vm?.ip_address || 'Pending'}</div>
                      <div className="text-muted-foreground">MAC Address</div>
                      <div className="font-medium font-mono">{vpsInfo.vm?.mac_address || 'N/A'}</div>
                      <div className="text-muted-foreground">Uptime</div>
                      <div className="font-medium">{formatUptime(vpsInfo.vm_info?.uptime) || 'N/A'}</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="console" className="space-y-4">
              <div className="animate-in fade-in zoom-in duration-500">
                <VNCConsole vmId={vpsInfo.vm?.vmid || 100} node={vpsInfo.node_name || 'pve'} />
              </div>
            </TabsContent>

            <TabsContent value="snapshots" className="space-y-4">
              <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <CardHeader>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Camera className="h-5 w-5 text-blue-600" />
                        Snapshots
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Create restore points for your VPS. Used {snapshots?.total}/{snapshots?.max_snapshots} snapshots.
                      </CardDescription>
                    </div>
                    <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          className="bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:scale-105 transition-all"
                          disabled={snapshots && snapshots?.total >= snapshots?.max_snapshots || snapshotActionLoading !== null}
                        >
                          <Plus className="mr-2 h-4 w-4" /> Create Snapshot
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <Camera className="h-5 w-5 text-blue-600" />
                            Create New Snapshot
                          </DialogTitle>
                          <DialogDescription>
                            Snapshot will save the current state of your VPS, allowing you to restore to this point later.
                          </DialogDescription>
                        </DialogHeader>
                        <ScrollArea className="flex-1 overflow-y-auto">
                          <ScrollArea className="py-4">
                            <div className="grid gap-4 py-4 px-1">
                              <div className="grid gap-2">
                                <Label htmlFor="snapshot-name">Snapshot name *</Label>
                                <Input
                                  id="snapshot-name"
                                  placeholder="e.g. before-update-v2"
                                  value={newSnapshotName}
                                  onChange={(e) => setNewSnapshotName(e.target.value)}
                                  maxLength={40}
                                />
                                <p className="text-xs text-muted-foreground">
                                  Only letters, numbers, hyphens and underscores allowed
                                </p>
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor="snapshot-desc">Description (optional)</Label>
                                <Textarea
                                  id="snapshot-desc"
                                  placeholder="Describe this snapshot..."
                                  value={newSnapshotDescription}
                                  onChange={(e) => setNewSnapshotDescription(e.target.value)}
                                  maxLength={500}
                                  rows={3}
                                />
                              </div>
                            </div>
                          </ScrollArea>
                          <DialogFooter>
                            <Button
                              variant="outline"
                              onClick={() => setCreateDialogOpen(false)}
                              disabled={snapshotActionLoading === 'create'}
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={handleCreateSnapshot}
                              disabled={snapshotActionLoading === 'create' || !newSnapshotName.trim()}
                              className="bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                            >
                              {snapshotActionLoading === 'create' ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Creating...
                                </>
                              ) : (
                                <>
                                  <Plus className="mr-2 h-4 w-4" />
                                  Create Snapshot
                                </>
                              )}
                            </Button>
                          </DialogFooter>
                        </ScrollArea>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {snapshotsLoading ? (
                    <div className="space-y-4">
                      {[...Array(2)].map((_, i) => (
                        <div key={i} className="flex items-center justify-between border p-4 rounded-lg">
                          <div className="space-y-2">
                            <Skeleton className="h-5 w-40" />
                            <Skeleton className="h-4 w-56" />
                          </div>
                          <div className="flex gap-2">
                            <Skeleton className="h-8 w-20" />
                            <Skeleton className="h-8 w-16" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : snapshots?.total === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="rounded-full bg-linear-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 p-4 mb-4">
                        <Camera className="h-8 w-8 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">No snapshots yet</h3>
                      <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                        Create a snapshot to save your VPS state and restore anytime
                      </p>
                      <Button
                        onClick={() => setCreateDialogOpen(true)}
                        className="bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      >
                        <Plus className="mr-2 h-4 w-4" /> Create first snapshot
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {snapshots?.snapshots.map((snap, i) => (
                        <div
                          key={snap.name}
                          className="flex flex-col sm:flex-row sm:items-center justify-between border p-4 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900/50 hover:shadow-md transition-all animate-in fade-in slide-in-from-left-4"
                          style={{ animationDelay: `${i * 100}ms` }}
                        >
                          <div className="flex items-start gap-3 mb-3 sm:mb-0">
                            <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-2 mt-0.5">
                              <Camera className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium">{snap.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {formatSnapshotDate(snap.snaptime)}
                                {snap.vmstate ? ' • With RAM state' : ' • Without RAM state'}
                              </p>
                              {snap.description && (
                                <p className="text-sm text-muted-foreground mt-1 max-w-md truncate">
                                  {snap.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2 ml-auto sm:ml-0">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 hover:scale-105 transition-all"
                                  disabled={snapshotActionLoading !== null}
                                >
                                  {snapshotActionLoading === `restore-${snap.name}` ? (
                                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                  ) : (
                                    <RotateCcw className="mr-1 h-3 w-3" />
                                  )}
                                  Rollback
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                                    Confirm Rollback
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    You are about to restore VPS to snapshot <strong>&quot;{snap.name}&quot;</strong>.
                                    <br /><br />
                                    <span className="text-yellow-600 dark:text-yellow-500 font-medium">
                                      ⚠️ Warning: All changes made after the snapshot ({formatSnapshotDate(snap.snaptime)}) will be permanently lost!
                                    </span>
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleRestoreSnapshot(snap.name)}
                                    className="bg-blue-600 hover:bg-blue-700"
                                  >
                                    <RotateCcw className="mr-2 h-4 w-4" />
                                    Confirm Rollback
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 hover:scale-105 transition-all"
                                  disabled={snapshotActionLoading !== null}
                                >
                                  {snapshotActionLoading === `delete-${snap.name}` ? (
                                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                  ) : (
                                    <Trash2 className="mr-1 h-3 w-3" />
                                  )}
                                  Delete
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                                    <AlertTriangle className="h-5 w-5" />
                                    Confirm Delete Snapshot
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete snapshot <strong>&quot;{snap.name}&quot;</strong>?
                                    <br /><br />
                                    <span className="text-red-600 dark:text-red-500 font-medium">
                                      This action cannot be undone!
                                    </span>
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteSnapshot(snap.name)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Snapshot
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      ))}

                      {snapshots && snapshots?.total >= snapshots?.max_snapshots && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-500 text-sm">
                          <AlertTriangle className="h-4 w-4 shrink-0" />
                          <span>
                            You have reached the limit of {snapshots?.max_snapshots} snapshots. Please delete old snapshots to create new ones.
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <div className="my-auto flex flex-col items-center justify-center py-16 text-center animate-in zoom-in duration-500">
          <div className="rounded-full bg-linear-to-br from-blue-100 to-purple-100 p-6 mb-4">
            <Server className="h-16 w-16 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">VPS not found</h3>
          <p className="text-muted-foreground mb-6">Could not find information for this VPS</p>
        </div>
      )}
    </div>
  )
}
