"use client"

import type React from "react"
import type { pageWithLayout } from "@/layoutTypes"
import { loginState, workspacestate } from "@/state"
import Workspace from "@/layouts/workspace"
import { useRecoilState } from "recoil"
import { useState, useEffect } from "react"
import {
  IconDeviceGamepad2,
  IconPlus,
  IconRefresh,
  IconUsers,
  IconMessage,
  IconActivity,
  IconSettings,
  IconChevronRight,
  IconCircle,
  IconCircleFilled,
  IconDownload,
  IconBook,
  IconExternalLink,
} from "@tabler/icons-react"
import clsx from "clsx"
import axios from "axios"

interface GameServer {
  id: string
  name: string
  description?: string
  gameId: string
  playerCount: number
  maxPlayers: number
  isActive: boolean
  lastSeen?: string
  createdAt: string
}

interface ServerStats {
  totalServers: number
  activeServers: number
  totalPlayers: number
  totalChatMessages24h: number
  totalEvents24h: number
}

const RemoteAdmin: pageWithLayout = () => {
  const [login] = useRecoilState(loginState)
  const [workspace] = useRecoilState(workspacestate)
  const [servers, setServers] = useState<GameServer[]>([])
  const [stats, setStats] = useState<ServerStats>({
    totalServers: 0,
    activeServers: 0,
    totalPlayers: 0,
    totalChatMessages24h: 0,
    totalEvents24h: 0,
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showInstallGuide, setShowInstallGuide] = useState(false)

  const fetchServers = async () => {
    try {
      const response = await axios.get(`/api/workspace/${workspace.groupId}/remote-admin/servers`)
      setServers(response.data.servers || [])
      setStats(response.data.stats || stats)
    } catch (error) {
      console.error("Failed to fetch servers:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchServers()
  }

  const handleDownloadScript = async () => {
    try {
      const response = await axios.get(`/api/workspace/${workspace.groupId}/remote-admin/download-script`, {
        responseType: 'blob'
      })

      const blob = new Blob([response.data], { type: 'application/octet-stream' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `Orbit-RemoteAdmin-${workspace.groupId}.rbxmx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Failed to download script:", error)
    }
  }

  useEffect(() => {
    if (workspace.groupId) {
      fetchServers()
    }
  }, [workspace.groupId])

  const StatCard = ({ icon: Icon, title, value, subtitle, color = "blue" }: {
    icon: React.ElementType
    title: string
    value: string | number
    subtitle?: string
    color?: string
  }) => (
    <div className="bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 p-6">
      <div className="flex items-center gap-4">
        <div className={clsx(
          "p-3 rounded-lg",
          color === "blue" && "bg-blue-100 dark:bg-blue-900/20",
          color === "green" && "bg-green-100 dark:bg-green-900/20",
          color === "orange" && "bg-orange-100 dark:bg-orange-900/20",
          color === "purple" && "bg-purple-100 dark:bg-purple-900/20"
        )}>
          <Icon className={clsx(
            "w-6 h-6",
            color === "blue" && "text-blue-600 dark:text-blue-400",
            color === "green" && "text-green-600 dark:text-green-400",
            color === "orange" && "text-orange-600 dark:text-orange-400",
            color === "purple" && "text-purple-600 dark:text-purple-400"
          )} />
        </div>
        <div>
          <p className="text-2xl font-bold text-zinc-900 dark:text-white">{value}</p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{title}</p>
          {subtitle && <p className="text-xs text-zinc-400 dark:text-zinc-500">{subtitle}</p>}
        </div>
      </div>
    </div>
  )

  const ServerCard = ({ server }: { server: GameServer }) => (
    <div className="bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <IconDeviceGamepad2 className="w-8 h-8 text-primary" />
            {server.isActive ? (
              <IconCircleFilled className="w-3 h-3 text-green-500 absolute -top-1 -right-1" />
            ) : (
              <IconCircle className="w-3 h-3 text-gray-400 absolute -top-1 -right-1" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-zinc-900 dark:text-white">{server.name}</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Game ID: {server.gameId}</p>
            {server.description && (
              <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-1">{server.description}</p>
            )}
          </div>
        </div>
        <button className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg">
          <IconChevronRight className="w-4 h-4 text-zinc-400" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center gap-2">
          <IconUsers className="w-4 h-4 text-zinc-400" />
          <span className="text-sm text-zinc-600 dark:text-zinc-300">
            {server.playerCount}/{server.maxPlayers} players
          </span>
        </div>
        <div className="flex items-center gap-2">
          <IconActivity className="w-4 h-4 text-zinc-400" />
          <span className="text-sm text-zinc-600 dark:text-zinc-300">
            {server.isActive ? "Online" : "Offline"}
          </span>
        </div>
      </div>

      <div className="flex gap-2">
        <button className="flex-1 px-3 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
          Manage
        </button>
        <button className="px-3 py-2 bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg text-sm font-medium hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors">
          Console
        </button>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white flex items-center gap-3">
            <IconDeviceGamepad2 className="w-8 h-8 text-primary" />
            Remote Admin
          </h1>
          <p className="text-zinc-600 dark:text-zinc-300 mt-2">
            Manage and monitor your connected Roblox game servers
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2 bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg font-medium hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors flex items-center gap-2"
          >
            <IconRefresh className={clsx("w-4 h-4", refreshing && "animate-spin")} />
            Refresh
          </button>
          <button className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center gap-2">
            <IconPlus className="w-4 h-4" />
            Add Server
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <StatCard
          icon={IconDeviceGamepad2}
          title="Total Servers"
          value={stats.totalServers}
          color="blue"
        />
        <StatCard
          icon={IconActivity}
          title="Active Servers"
          value={stats.activeServers}
          subtitle={`${stats.totalServers - stats.activeServers} offline`}
          color="green"
        />
        <StatCard
          icon={IconUsers}
          title="Total Players"
          value={stats.totalPlayers}
          subtitle="across all servers"
          color="orange"
        />
        <StatCard
          icon={IconMessage}
          title="Chat Messages"
          value={stats.totalChatMessages24h}
          subtitle="last 24 hours"
          color="purple"
        />
        <StatCard
          icon={IconActivity}
          title="Events"
          value={stats.totalEvents24h}
          subtitle="last 24 hours"
          color="blue"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <button className="p-6 bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 hover:shadow-md transition-shadow text-left">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <IconMessage className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="font-semibold text-zinc-900 dark:text-white">Chat Monitor</h3>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            View and moderate chat messages across all servers
          </p>
        </button>

        <button className="p-6 bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 hover:shadow-md transition-shadow text-left">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <IconActivity className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="font-semibold text-zinc-900 dark:text-white">Live Activity</h3>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            Real-time feed of all player actions and events
          </p>
        </button>

        <button className="p-6 bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 hover:shadow-md transition-shadow text-left">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <IconUsers className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="font-semibold text-zinc-900 dark:text-white">Player Manager</h3>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            Manage players across all connected game servers
          </p>
        </button>
      </div>

      {/* Servers Grid */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
            Connected Servers ({servers.length})
          </h2>
        </div>

        {servers.length === 0 ? (
          <div className="bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700">
            {!showInstallGuide ? (
              <div className="text-center py-12">
                <IconDeviceGamepad2 className="w-16 h-16 text-zinc-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-zinc-900 dark:text-white mb-2">
                  No servers connected
                </h3>
                <p className="text-zinc-600 dark:text-zinc-300 mb-6">
                  Install the Orbit Remote Admin script in your Roblox games to start monitoring and managing players.
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => setShowInstallGuide(true)}
                    className="px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
                  >
                    <IconBook className="w-4 h-4" />
                    Installation Guide
                  </button>
                  <button
                    onClick={handleDownloadScript}
                    className="px-6 py-3 bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg font-medium hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors flex items-center gap-2"
                  >
                    <IconDownload className="w-4 h-4" />
                    Download Script
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">
                    Orbit Remote Admin Installation Guide
                  </h3>
                  <button
                    onClick={() => setShowInstallGuide(false)}
                    className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <IconBook className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">Before you begin</h4>
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                          Make sure you have edit access to your Roblox game and HTTP requests are enabled in your game settings.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-semibold">
                        1
                      </div>
                      <div>
                        <h4 className="font-medium text-zinc-900 dark:text-white mb-2">Download the script</h4>
                        <p className="text-sm text-zinc-600 dark:text-zinc-300 mb-3">
                          Download the pre-configured Orbit Remote Admin script for your workspace.
                        </p>
                        <button
                          onClick={handleDownloadScript}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                        >
                          <IconDownload className="w-4 h-4" />
                          Download Orbit-RemoteAdmin-{workspace.groupId}.rbxmx
                        </button>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-semibold">
                        2
                      </div>
                      <div>
                        <h4 className="font-medium text-zinc-900 dark:text-white mb-2">Enable HTTP requests</h4>
                        <p className="text-sm text-zinc-600 dark:text-zinc-300 mb-2">
                          In Roblox Studio, go to Home → Game Settings → Security:
                        </p>
                        <ul className="text-sm text-zinc-600 dark:text-zinc-300 space-y-1 ml-4">
                          <li>• Enable "Allow HTTP Requests"</li>
                          <li>• Save your game settings</li>
                        </ul>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-semibold">
                        3
                      </div>
                      <div>
                        <h4 className="font-medium text-zinc-900 dark:text-white mb-2">Import the script</h4>
                        <p className="text-sm text-zinc-600 dark:text-zinc-300 mb-2">
                          In Roblox Studio:
                        </p>
                        <ul className="text-sm text-zinc-600 dark:text-zinc-300 space-y-1 ml-4">
                          <li>• Right-click on ServerScriptService</li>
                          <li>• Select "Insert Object" → "Script"</li>
                          <li>• Copy the contents from the downloaded .rbxmx file</li>
                          <li>• Paste into the new script</li>
                          <li>• Rename the script to "OrbitRemoteAdmin"</li>
                        </ul>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-semibold">
                        4
                      </div>
                      <div>
                        <h4 className="font-medium text-zinc-900 dark:text-white mb-2">Publish and test</h4>
                        <p className="text-sm text-zinc-600 dark:text-zinc-300 mb-2">
                          Publish your game and start a server:
                        </p>
                        <ul className="text-sm text-zinc-600 dark:text-zinc-300 space-y-1 ml-4">
                          <li>• Publish your game to Roblox</li>
                          <li>• Start a test server or wait for players to join</li>
                          <li>• The script will automatically connect to Orbit</li>
                          <li>• Refresh this page to see your server appear</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <IconActivity className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-green-900 dark:text-green-100 mb-1">What you'll get</h4>
                        <ul className="text-sm text-green-800 dark:text-green-200 space-y-1">
                          <li>• Real-time player activity monitoring</li>
                          <li>• Chat message logging and moderation</li>
                          <li>• Remote admin commands (kick, ban, teleport, etc.)</li>
                          <li>• Server performance metrics</li>
                          <li>• Player join/leave notifications</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pt-4 border-t border-gray-200 dark:border-zinc-700">
                    <button
                      onClick={handleRefresh}
                      className="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                    >
                      <IconRefresh className="w-4 h-4" />
                      Check for Connected Servers
                    </button>
                    <a
                      href="https://create.roblox.com/docs/scripting/scripts"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg font-medium hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors flex items-center gap-2"
                    >
                      <IconExternalLink className="w-4 h-4" />
                      Roblox Docs
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {servers.map((server) => (
              <ServerCard key={server.id} server={server} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

RemoteAdmin.layout = Workspace

export default RemoteAdmin