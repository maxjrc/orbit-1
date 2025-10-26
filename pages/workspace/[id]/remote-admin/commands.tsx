"use client"

import type React from "react"
import type { pageWithLayout } from "@/layoutTypes"
import { loginState, workspacestate } from "@/state"
import Workspace from "@/layouts/workspace"
import { useRecoilState } from "recoil"
import { useState, useEffect } from "react"
import {
  IconTerminal,
  IconUser,
  IconUsers,
  IconMessage,
  IconBan,
  IconPlayerEject,
  IconServer,
  IconShield,
  IconMapPin,
  IconSend,
  IconRefresh,
  IconClock,
  IconCheck,
  IconX,
  IconAlertTriangle,
} from "@tabler/icons-react"
import clsx from "clsx"
import axios from "axios"

interface GameServer {
  id: string
  name: string
  playerCount: number
  isActive: boolean
}

interface QueuedCommand {
  id: string
  command: string
  targetUserId?: string
  parameters?: any
  status: string
  createdAt: string
  executedBy: {
    username: string
    displayname: string
  }
  server?: {
    name: string
  }
}

const RemoteCommands: pageWithLayout = () => {
  const [login] = useRecoilState(loginState)
  const [workspace] = useRecoilState(workspacestate)
  const [servers, setServers] = useState<GameServer[]>([])
  const [queuedCommands, setQueuedCommands] = useState<QueuedCommand[]>([])
  const [selectedServer, setSelectedServer] = useState<string>("all")
  const [selectedCommand, setSelectedCommand] = useState<string>("")
  const [targetUserId, setTargetUserId] = useState<string>("")
  const [commandParams, setCommandParams] = useState<any>({})
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const commandTypes = [
    { id: "kick_player", name: "Kick Player", icon: IconPlayerEject, needsTarget: true, color: "orange" },
    { id: "ban_player", name: "Ban Player", icon: IconBan, needsTarget: true, color: "red" },
    { id: "message_player", name: "Message Player", icon: IconMessage, needsTarget: true, color: "blue" },
    { id: "broadcast_message", name: "Broadcast Message", icon: IconUsers, needsTarget: false, color: "green" },
    { id: "teleport_player", name: "Teleport Player", icon: IconMapPin, needsTarget: true, color: "purple" },
    { id: "give_admin", name: "Give Admin", icon: IconShield, needsTarget: true, color: "yellow" },
    { id: "server_shutdown", name: "Shutdown Server", icon: IconServer, needsTarget: false, color: "red" },
  ]

  const fetchServers = async () => {
    try {
      const response = await axios.get(`/api/workspace/${workspace.groupId}/remote-admin/servers`)
      setServers(response.data.servers || [])
    } catch (error) {
      console.error("Failed to fetch servers:", error)
    }
  }

  const fetchQueuedCommands = async () => {
    try {
      const response = await axios.get(`/api/workspace/${workspace.groupId}/remote-admin/queue`)
      setQueuedCommands(response.data.commands || [])
    } catch (error) {
      console.error("Failed to fetch queued commands:", error)
    }
  }

  const executeCommand = async () => {
    if (!selectedCommand) {
      setMessage({ type: "error", text: "Please select a command" })
      return
    }

    const commandType = commandTypes.find(cmd => cmd.id === selectedCommand)
    if (commandType?.needsTarget && !targetUserId) {
      setMessage({ type: "error", text: "Please enter a target user ID" })
      return
    }

    setLoading(true)
    try {
      const payload = {
        command: selectedCommand,
        serverId: selectedServer === "all" ? null : selectedServer,
        targetUserId: targetUserId || null,
        parameters: commandParams,
        priority: 1
      }

      const response = await axios.post(`/api/workspace/${workspace.groupId}/remote-admin/commands`, payload)

      setMessage({ type: "success", text: response.data.message })
      setSelectedCommand("")
      setTargetUserId("")
      setCommandParams({})
      await fetchQueuedCommands()
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.response?.data?.error || "Failed to execute command"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (workspace.groupId) {
      fetchServers()
      fetchQueuedCommands()
    }
  }, [workspace.groupId])

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [message])

  const getCommandIcon = (command: string) => {
    const commandType = commandTypes.find(cmd => cmd.id === command)
    return commandType?.icon || IconTerminal
  }

  const getCommandColor = (command: string) => {
    const commandType = commandTypes.find(cmd => cmd.id === command)
    return commandType?.color || "gray"
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <IconClock className="w-4 h-4 text-yellow-500" />
      case "delivered":
        return <IconCheck className="w-4 h-4 text-green-500" />
      case "failed":
        return <IconX className="w-4 h-4 text-red-500" />
      default:
        return <IconClock className="w-4 h-4 text-gray-500" />
    }
  }

  const CommandCard = ({ cmd }: { cmd: typeof commandTypes[0] }) => (
    <button
      onClick={() => {
        setSelectedCommand(cmd.id)
        setCommandParams({})
      }}
      className={clsx(
        "p-4 rounded-lg border-2 transition-all text-left",
        selectedCommand === cmd.id
          ? "border-primary bg-primary/10"
          : "border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600",
        "bg-white dark:bg-zinc-800"
      )}
    >
      <div className="flex items-center gap-3 mb-2">
        <div className={clsx(
          "p-2 rounded-lg",
          cmd.color === "red" && "bg-red-100 dark:bg-red-900/20",
          cmd.color === "orange" && "bg-orange-100 dark:bg-orange-900/20",
          cmd.color === "blue" && "bg-blue-100 dark:bg-blue-900/20",
          cmd.color === "green" && "bg-green-100 dark:bg-green-900/20",
          cmd.color === "purple" && "bg-purple-100 dark:bg-purple-900/20",
          cmd.color === "yellow" && "bg-yellow-100 dark:bg-yellow-900/20"
        )}>
          <cmd.icon className={clsx(
            "w-5 h-5",
            cmd.color === "red" && "text-red-600 dark:text-red-400",
            cmd.color === "orange" && "text-orange-600 dark:text-orange-400",
            cmd.color === "blue" && "text-blue-600 dark:text-blue-400",
            cmd.color === "green" && "text-green-600 dark:text-green-400",
            cmd.color === "purple" && "text-purple-600 dark:text-purple-400",
            cmd.color === "yellow" && "text-yellow-600 dark:text-yellow-400"
          )} />
        </div>
        <h3 className="font-semibold text-zinc-900 dark:text-white">{cmd.name}</h3>
      </div>
      <p className="text-sm text-zinc-600 dark:text-zinc-300">
        {cmd.needsTarget ? "Requires target user ID" : "Server-wide command"}
      </p>
    </button>
  )

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white flex items-center gap-3">
            <IconTerminal className="w-8 h-8 text-primary" />
            Remote Commands
          </h1>
          <p className="text-zinc-600 dark:text-zinc-300 mt-2">
            Execute admin commands on your connected game servers
          </p>
        </div>
        <button
          onClick={() => {
            fetchServers()
            fetchQueuedCommands()
          }}
          className="px-4 py-2 bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg font-medium hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors flex items-center gap-2"
        >
          <IconRefresh className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={clsx(
          "mb-6 p-4 rounded-lg flex items-center gap-3",
          message.type === "success" && "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200",
          message.type === "error" && "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200"
        )}>
          {message.type === "success" ? (
            <IconCheck className="w-5 h-5" />
          ) : (
            <IconAlertTriangle className="w-5 h-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Command Execution */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 p-6">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-6">Execute Command</h2>

            {/* Server Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Target Server
              </label>
              <select
                value={selectedServer}
                onChange={(e) => setSelectedServer(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
              >
                <option value="all">All Servers</option>
                {servers.filter(s => s.isActive).map((server) => (
                  <option key={server.id} value={server.id}>
                    {server.name} ({server.playerCount} players)
                  </option>
                ))}
              </select>
            </div>

            {/* Command Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
                Select Command
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {commandTypes.map((cmd) => (
                  <CommandCard key={cmd.id} cmd={cmd} />
                ))}
              </div>
            </div>

            {/* Command Parameters */}
            {selectedCommand && (
              <div className="space-y-4">
                {commandTypes.find(cmd => cmd.id === selectedCommand)?.needsTarget && (
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                      Target User ID
                    </label>
                    <input
                      type="text"
                      value={targetUserId}
                      onChange={(e) => setTargetUserId(e.target.value)}
                      placeholder="Enter Roblox User ID"
                      className="w-full px-3 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                    />
                  </div>
                )}

                {(selectedCommand === "kick_player" || selectedCommand === "ban_player" || selectedCommand === "server_shutdown") && (
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                      Reason
                    </label>
                    <input
                      type="text"
                      value={commandParams.reason || ""}
                      onChange={(e) => setCommandParams({ ...commandParams, reason: e.target.value })}
                      placeholder="Enter reason"
                      className="w-full px-3 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                    />
                  </div>
                )}

                {(selectedCommand === "message_player" || selectedCommand === "broadcast_message") && (
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                      Message
                    </label>
                    <textarea
                      value={commandParams.message || ""}
                      onChange={(e) => setCommandParams({ ...commandParams, message: e.target.value })}
                      placeholder="Enter message"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                    />
                  </div>
                )}

                {selectedCommand === "teleport_player" && (
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">X</label>
                      <input
                        type="number"
                        value={commandParams.x || 0}
                        onChange={(e) => setCommandParams({ ...commandParams, x: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Y</label>
                      <input
                        type="number"
                        value={commandParams.y || 50}
                        onChange={(e) => setCommandParams({ ...commandParams, y: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Z</label>
                      <input
                        type="number"
                        value={commandParams.z || 0}
                        onChange={(e) => setCommandParams({ ...commandParams, z: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                      />
                    </div>
                  </div>
                )}

                <button
                  onClick={executeCommand}
                  disabled={loading}
                  className="w-full px-4 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <IconSend className="w-4 h-4" />
                  )}
                  {loading ? "Executing..." : "Execute Command"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Command Queue */}
        <div className="bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 p-6">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-6">Command Queue</h2>

          <div className="space-y-3">
            {queuedCommands.length === 0 ? (
              <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
                <IconTerminal className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No commands in queue</p>
              </div>
            ) : (
              queuedCommands.slice(0, 10).map((command) => {
                const CommandIcon = getCommandIcon(command.command)
                return (
                  <div key={command.id} className="p-4 bg-gray-50 dark:bg-zinc-900 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <CommandIcon className="w-4 h-4 text-zinc-500" />
                        <span className="font-medium text-zinc-900 dark:text-white">
                          {commandTypes.find(cmd => cmd.id === command.command)?.name || command.command}
                        </span>
                        {getStatusIcon(command.status)}
                      </div>
                      <span className="text-xs text-zinc-500">
                        {new Date(command.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-sm text-zinc-600 dark:text-zinc-300">
                      Target: {command.server?.name || "All servers"}
                      {command.targetUserId && ` • User: ${command.targetUserId}`}
                    </div>
                    <div className="text-xs text-zinc-500 mt-1">
                      By: {command.executedBy.displayname || command.executedBy.username}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

RemoteCommands.layout = Workspace

export default RemoteCommands