'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Maximize2,
    Minimize2,
    MonitorOff,
    RefreshCw,
    Power,
    Loader2,
    ExternalLink,
    AlertCircle,
    MonitorUp
} from 'lucide-react';
import { toast } from 'sonner';
import useProxmox from '@/hooks/useProxmox';
import { useTranslations } from 'next-intl';

interface VNCConsoleProps {
    vmId: number;
    node?: string;
    onClose?: () => void;
    className?: string;
}

const VNCConsole: React.FC<VNCConsoleProps> = ({ vmId, node = 'pve', onClose, className }) => {
    const t = useTranslations('vnc_console');
    const { getVNCInfo } = useProxmox();

    const containerRef = useRef<HTMLDivElement>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [connectionError, setConnectionError] = useState<string | null>(null);
    const [consoleUrl, setConsoleUrl] = useState<string | null>(null);
    const [loadingText, setLoadingText] = useState('initializing');


    // Disconnect VNC
    const disconnectVNC = useCallback(() => {
        setConsoleUrl(null);
        setIsConnected(false);
        setConnectionError(null);
    }, []);

    // Connect to VNC (embedded)
    const connectVNC = useCallback(async () => {
        // Disconnect existing connection first
        disconnectVNC();

        setIsConnecting(true);
        setConnectionError(null);
        setLoadingText('getting_info');

        try {
            // Verify VNC is available
            const result = await getVNCInfo(vmId);

            if (result.error || !result.data) {
                throw new Error(result.error?.details || 'Failed to get VNC info');
            }

            setLoadingText('loading');

            // Build URL for our custom VNC console page
            // Use the backend API URL, not the frontend origin
            const backendApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
            // Extract just the origin (without /api/v1 path)
            const backendOrigin = backendApiUrl.replace(/\/api\/v1\/?$/, '');
            const vncPageUrl = `/vnc-console.html?vmid=${vmId}&node=${node}&vmname=VM-${vmId}&api=${encodeURIComponent(backendOrigin)}&autoconnect=true`;

            console.log('Opening VNC console:', vncPageUrl, 'API:', backendOrigin);
            setConsoleUrl(vncPageUrl);

            // Mark as connected after iframe loads
            setTimeout(() => {
                setIsConnected(true);
                setIsConnecting(false);
                toast.success(t('success.ready'));
            }, 1500);

        } catch (error) {
            console.error('VNC connection error:', error);
            setConnectionError(error instanceof Error ? error.message : t('error.connection_failed_toast'));
            setIsConnecting(false);
            toast.error(t('error.init_failed'));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [vmId, node, getVNCInfo, disconnectVNC]);

    // Open in new window
    const openInNewWindow = useCallback(() => {
        const backendApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
        const backendOrigin = backendApiUrl.replace(/\/api\/v1\/?$/, '');
        const vncPageUrl = `/vnc-console.html?vmid=${vmId}&node=${node}&vmname=VM-${vmId}&api=${encodeURIComponent(backendOrigin)}`;
        window.open(vncPageUrl, `vnc_${vmId}`, 'width=1024,height=768,toolbar=no,menubar=no,resizable=yes');
        toast.info(t('success.window_opened'));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [vmId, node]);

    // Open Proxmox console directly
    const openProxmoxDirect = useCallback(async () => {
        try {
            const result = await getVNCInfo(vmId);
            const proxmoxHost = result.data?.host || '10.10.1.12';
            const proxmoxUrl = `https://${proxmoxHost}:8006/?console=kvm&novnc=1&vmid=${vmId}&vmname=VM-${vmId}&node=${node}&resize=off`;
            window.open(proxmoxUrl, `proxmox_${vmId}`, 'width=1024,height=768,toolbar=no,menubar=no,resizable=yes');
            toast.info(t('success.proxmox_opened'));
        } catch {
            const proxmoxUrl = `https://10.10.1.12:8006/?console=kvm&novnc=1&vmid=${vmId}&vmname=VM-${vmId}&node=${node}&resize=off`;
            window.open(proxmoxUrl, `proxmox_${vmId}`, 'width=1024,height=768,toolbar=no,menubar=no,resizable=yes');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [vmId, node, getVNCInfo]);

    // Send Ctrl+Alt+Del to VNC console
    const sendCtrlAltDel = useCallback(() => {
        if (iframeRef.current && iframeRef.current.contentWindow) {
            try {
                // Send message to iframe to trigger Ctrl+Alt+Del
                iframeRef.current.contentWindow.postMessage(
                    { type: 'sendCtrlAltDel' },
                    '*'
                );
                toast.success(t('success.cad_sent'));
            } catch (error) {
                console.error('Failed to send Ctrl+Alt+Del:', error);
                toast.error(t('error.send_cad_failed'));
            }
        } else {
            toast.warning(t('error.console_not_ready'));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Toggle fullscreen
    const toggleFullscreen = useCallback(() => {
        if (!containerRef.current) return;

        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    }, []);

    // Handle fullscreen change events
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            disconnectVNC();
        };
    }, [disconnectVNC]);

    // Handle iframe load events
    const handleIframeLoad = () => {
        setIsConnecting(false);
        setIsConnected(true);
    };

    return (
        <Card className={`bg-black border-slate-800 py-0 overflow-hidden ${className}`} ref={containerRef}>
            {/* Toolbar */}
            <div className="flex items-center justify-between p-2 bg-slate-900 border-b border-slate-800">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : isConnecting ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'}`} />
                    <span className="text-sm text-slate-400">
                        {isConnecting ? t('status.loading_short') : isConnected ? t('status.ready') : t('status.disconnected')}
                    </span>
                    <span className="text-xs text-slate-600">
                        | {t('info.vm_info', { id: vmId, node })}
                    </span>
                </div>

                <div className="flex items-center gap-1">
                    {isConnected && (
                        <>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-slate-400 hover:text-white hover:bg-slate-800"
                                onClick={sendCtrlAltDel}
                                title={t('tooltip.send_cad')}
                            >
                                Ctrl+Alt+Del
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800"
                                onClick={openProxmoxDirect}
                                title={t('tooltip.open_proxmox')}
                            >
                                <MonitorUp className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800"
                                onClick={toggleFullscreen}
                                title={isFullscreen ? t('tooltip.exit_fullscreen') : t('tooltip.fullscreen')}
                            >
                                {isFullscreen ? (
                                    <Minimize2 className="h-4 w-4" />
                                ) : (
                                    <Maximize2 className="h-4 w-4" />
                                )}
                            </Button>
                        </>
                    )}

                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800"
                        onClick={openInNewWindow}
                        title={t('tooltip.open_window')}
                    >
                        <ExternalLink className="h-4 w-4" />
                    </Button>

                    {!isConnected ? (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-green-500 hover:text-green-400 hover:bg-green-500/10"
                            onClick={connectVNC}
                            disabled={isConnecting}
                        >
                            {isConnecting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {t('status.loading_short')}
                                </>
                            ) : (
                                <>
                                    <Power className="mr-2 h-4 w-4" />
                                    {t('button.load_console')}
                                </>
                            )}
                        </Button>
                    ) : (
                        <>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800"
                                onClick={connectVNC}
                                title={t('tooltip.reload')}
                            >
                                <RefreshCw className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                                onClick={disconnectVNC}
                            >
                                <MonitorOff className="mr-2 h-4 w-4" />
                                {t('button.close')}
                            </Button>
                        </>
                    )}

                    {onClose && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-slate-400 hover:text-white ml-2"
                            onClick={() => {
                                disconnectVNC();
                                onClose();
                            }}
                        >
                            {t('button.close')}
                        </Button>
                    )}
                </div>
            </div>

            {/* VNC Display Area */}
            <CardContent className="p-0 relative">
                {/* Iframe for VNC Console */}
                {consoleUrl && (
                    <iframe
                        ref={iframeRef}
                        src={consoleUrl}
                        className="w-full bg-black border-0"
                        style={{
                            height: isFullscreen ? 'calc(100vh - 40px)' : '500px',
                            display: isConnected || isConnecting ? 'block' : 'none'
                        }}
                        onLoad={handleIframeLoad}
                        allow="fullscreen; clipboard-read; clipboard-write"
                    />
                )}

                {/* Overlay states */}
                {!consoleUrl && (
                    <div
                        className="w-full bg-black flex items-center justify-center"
                        style={{ minHeight: '500px' }}
                    >
                        {isConnecting ? (
                            <div className="text-center space-y-4">
                                <Loader2 className="h-16 w-16 text-blue-500 mx-auto animate-spin" />
                                <div className="text-slate-400">{t(`status.${loadingText}`)}</div>
                            </div>
                        ) : connectionError ? (
                            <div className="text-center space-y-4 max-w-md px-4">
                                <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
                                <div className="text-red-400 font-medium">{t('error.connection_failed')}</div>
                                <div className="text-slate-500 text-sm">{connectionError}</div>
                                <div className="flex gap-3 justify-center">
                                    <Button onClick={connectVNC} variant="outline" className="border-slate-700">
                                        <RefreshCw className="mr-2 h-4 w-4" />
                                        {t('button.retry')}
                                    </Button>
                                    <Button onClick={openInNewWindow} variant="outline" className="border-slate-700">
                                        <ExternalLink className="mr-2 h-4 w-4" />
                                        {t('button.open_window')}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center space-y-4">
                                <MonitorOff className="h-16 w-16 text-slate-600 mx-auto" />
                                <div className="text-slate-400">{t('info.title', { id: vmId })}</div>
                                <div className="text-xs text-slate-500 max-w-sm mx-auto">
                                    {t('info.description')}
                                </div>
                                <div className="flex gap-3 justify-center flex-wrap">
                                    <Button onClick={connectVNC} className="bg-green-600 hover:bg-green-700">
                                        <Power className="mr-2 h-4 w-4" />
                                        {t('button.load_console')}
                                    </Button>
                                    <Button onClick={openProxmoxDirect} variant="ghost" className="border-blue-600 text-blue-400">
                                        <ExternalLink className="mr-2 h-4 w-4" />
                                        {t('button.open_proxmox')}
                                    </Button>
                                    <Button onClick={openInNewWindow} variant="outline" className="border-slate-700">
                                        <ExternalLink className="mr-2 h-4 w-4" />
                                        {t('button.open_window')}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>

            {/* Footer hint */}
            <div className="text-xs text-slate-500 text-center py-2 border-t border-slate-800">
                {isConnected
                    ? t('info.tip_connected')
                    : t('info.tip_disconnected')
                }
            </div>
        </Card>
    );
};

export default VNCConsole;
