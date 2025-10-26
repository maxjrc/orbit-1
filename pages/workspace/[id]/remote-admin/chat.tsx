"use client"

import type React from "react"
import type { pageWithLayout } from "@/layoutTypes"
import { loginState, workspacestate } from "@/state"
import Workspace from "@/layouts/workspace"
import { useRecoilState } from "recoil"
import { useState, useEffect, useRef } from "react"
import {
  IconMessage,
  IconSearch,
  IconFilter,
  IconFlag,
  IconUser,
  IconClock,
  IconServer,
  IconRefresh,
  IconX,
  IconCheck,
  IconBan,
  IconVolume,
  IconAlertTriangle,
} from "@tabler/icons-react"
import clsx from "clsx"
import axios from "axios"

interface ChatMessage {
  id: string
  serverId: string
  serverName: string
  userId: string
  username: string
  message: string
  filtered: boolean
  flagged: boolean
  timestamp: string
  moderatedBy?: string
}

interface FilterOptions {
  serverId?: string
  flaggedOnly: boolean
  userId?: string
  timeRange: "1h" | "24h" | "7d" | "30d"
}

const ChatMonitor: pageWithLayout = () => {
  const [login] = useRecoilState(loginState)
  const [workspace] = useRecoilState(workspacestate)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [servers, setServers] = useState<Array<{ id: string; name: string }>>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filters, setFilters] = useState<FilterOptions>({
    flaggedOnly: false,
    timeRange: "24h"
  })
  const [showFilters, setShowFilters] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState<ChatMessage | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const fetchMessages = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        timeRange: filters.timeRange,
        ...(filters.serverId && { serverId: filters.serverId }),
        ...(filters.flaggedOnly && { flaggedOnly: "true" }),
        ...(filters.userId && { userId: filters.userId }),
        ...(searchTerm && { search: searchTerm })
      })

      const response = await axios.get(`/api/workspace/${workspace.groupId}/remote-admin/chat?${params}`)
      setMessages(response.data.messages || [])
    } catch (error) {
      console.error("Failed to fetch chat messages:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchServers = async () => {
    try {
      const response = await axios.get(`/api/workspace/${workspace.groupId}/remote-admin/servers`)
      setServers(response.data.servers || [])
    } catch (error) {
      console.error("Failed to fetch servers:", error)
    }
  }

  const handleModerateMessage = async (messageId: string, action: "flag" | "unflag" | "delete") => {
    try {
      await axios.post(`/api/workspace/${workspace.groupId}/remote-admin/chat/moderate`, {
        messageId,
        action
      })
      await fetchMessages()
      setSelectedMessage(null)
    } catch (error) {
      console.error("Failed to moderate message:", error)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    if (workspace.groupId) {
      fetchServers()
      fetchMessages()
    }
  }, [workspace.groupId])

  useEffect(() => {
    fetchMessages()
  }, [filters])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== "") {
        fetchMessages()
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 1) {
      const minutes = Math.floor(diffInHours * 60)
      return `${minutes}m ago`
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  const MessageCard = ({ message }: { message: ChatMessage }) => (
    <div
      className={clsx(
        "p-4 bg-white dark:bg-zinc-800 rounded-lg border transition-all cursor-pointer hover:shadow-md",
        message.flagged ? "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10" : "border-gray-200 dark:border-zinc-700",
        selectedMessage?.id === message.id && "ring-2 ring-primary"
      )}
      onClick={() => setSelectedMessage(message)}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <IconUser className="w-4 h-4 text-zinc-400" />
            <span className="font-medium text-zinc-900 dark:text-white">{message.username}</span>
            <span className="text-xs text-zinc-500">#{message.userId}</span>
          </div>
          {message.flagged && (
            <IconFlag className="w-4 h-4 text-red-500" />
          )}
          {message.filtered && (
            <IconAlertTriangle className="w-4 h-4 text-orange-500" />
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <IconServer className="w-3 h-3" />
          <span>{message.serverName}</span>
          <IconClock className="w-3 h-3 ml-2" />
          <span>{formatTime(message.timestamp)}</span>
        </div>
      </div>

      <div className="mb-3">
        <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
          {message.message}
        </p>
      </div>

      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          {!message.flagged ? (
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleModerateMessage(message.id, "flag")
              }}
              className="px-2 py-1 text-xs bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors"
            >
              Flag
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleModerateMessage(message.id, "unflag")
              }}
              className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded hover:bg-green-200 dark:hover:bg-green-900/30 transition-colors"
            >
              Unflag
            </button>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b border-gray-200 dark:border-zinc-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white flex items-center gap-3">
              <IconMessage className="w-8 h-8 text-primary" />
              Chat Monitor
            </h1>
            <p className="text-zinc-600 dark:text-zinc-300 mt-2">
              Monitor and moderate chat messages across all connected servers
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={clsx(
                "px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2",
                showFilters
                  ? "bg-primary text-white"
                  : "bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-600"
              )}
            >
              <IconFilter className="w-4 h-4" />
              Filters
            </button>
            <button
              onClick={fetchMessages}
              className="px-4 py-2 bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg font-medium hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors flex items-center gap-2"
            >
              <IconRefresh className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search messages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-zinc-900 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Server
                </label>
                <select
                  value={filters.serverId || ""}
                  onChange={(e) => setFilters({ ...filters, serverId: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                >
                  <option value="">All Servers</option>
                  {servers.map((server) => (
                    <option key={server.id} value={server.id}>
                      {server.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Time Range
                </label>
                <select
                  value={filters.timeRange}
                  onChange={(e) => setFilters({ ...filters, timeRange: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                >
                  <option value="1h">Last Hour</option>
                  <option value="24h">Last 24 Hours</option>
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  User ID
                </label>
                <input
                  type="text"
                  placeholder="Filter by user ID..."
                  value={filters.userId || ""}
                  onChange={(e) => setFilters({ ...filters, userId: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                />
              </div>

              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.flaggedOnly}
                    onChange={(e) => setFilters({ ...filters, flaggedOnly: e.target.checked })}
                    className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2"
                  />
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">Flagged only</span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden flex">
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12">
              <IconMessage className="w-16 h-16 text-zinc-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-zinc-900 dark:text-white mb-2">
                No messages found
              </h3>
              <p className="text-zinc-600 dark:text-zinc-300">
                No chat messages match your current filters.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <MessageCard key={message.id} message={message} />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Message Detail Sidebar */}
        {selectedMessage && (
          <div className="w-80 border-l border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Message Details</h3>
              <button
                onClick={() => setSelectedMessage(null)}
                className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded"
              >
                <IconX className="w-4 h-4 text-zinc-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">User</label>
                <p className="text-zinc-900 dark:text-white">{selectedMessage.username}</p>
                <p className="text-xs text-zinc-500">ID: {selectedMessage.userId}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Server</label>
                <p className="text-zinc-900 dark:text-white">{selectedMessage.serverName}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Message</label>
                <p className="text-zinc-900 dark:text-white bg-zinc-50 dark:bg-zinc-900 p-3 rounded-lg">
                  {selectedMessage.message}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Status</label>
                <div className="flex gap-2 mt-1">
                  {selectedMessage.flagged && (
                    <span className="px-2 py-1 text-xs bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded">
                      Flagged
                    </span>
                  )}
                  {selectedMessage.filtered && (
                    <span className="px-2 py-1 text-xs bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 rounded">
                      Filtered
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Timestamp</label>
                <p className="text-zinc-900 dark:text-white">
                  {new Date(selectedMessage.timestamp).toLocaleString()}
                </p>
              </div>

              <div className="border-t border-gray-200 dark:border-zinc-700 pt-4">
                <h4 className="text-sm font-medium text-zinc-900 dark:text-white mb-3">Actions</h4>
                <div className="space-y-2">
                  {!selectedMessage.flagged ? (
                    <button
                      onClick={() => handleModerateMessage(selectedMessage.id, "flag")}
                      className="w-full px-3 py-2 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors"
                    >
                      Flag Message
                    </button>
                  ) : (
                    <button
                      onClick={() => handleModerateMessage(selectedMessage.id, "unflag")}
                      className="w-full px-3 py-2 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/30 transition-colors"
                    >
                      Unflag Message
                    </button>
                  )}
                  <button
                    onClick={() => handleModerateMessage(selectedMessage.id, "delete")}
                    className="w-full px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Delete Message
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

ChatMonitor.layout = Workspace

export default ChatMonitor