"use client"

import type React from "react"
import type { pageWithLayout } from "@/layoutTypes"
import { loginState, workspacestate } from "@/state"
import Workspace from "@/layouts/workspace"
import { useRecoilState } from "recoil"
import { useState, useEffect, useRef } from "react"
import {
  IconActivity,
  IconUser,
  IconUserPlus,
  IconUserMinus,
  IconMessage,
  IconSword,
  IconCoin,
  IconTrophy,
  IconServer,
  IconClock,
  IconRefresh,
  IconFilter,
  IconSearch,
  IconCircle,
  IconArrowRight,
  IconPlayerPlay,
  IconPlayerStop,
} from "@tabler/icons-react"
import clsx from "clsx"
import axios from "axios"

interface ActivityEvent {
  id: string
  type: "player_join" | "player_leave" | "chat_message" | "player_action" | "game_event"
  serverId: string
  serverName: string
  userId?: string
  username?: string
  message?: string
  data?: any
  timestamp: string
}

interface FilterOptions {
  serverId?: string
  eventType?: string
  userId?: string
  showChatMessages: boolean
}

const LiveActivity: pageWithLayout = () => {
  const [login] = useRecoilState(loginState)
  const [workspace] = useRecoilState(workspacestate)
  const [events, setEvents] = useState<ActivityEvent[]>([])
  const [servers, setServers] = useState<Array<{ id: string; name: string }>>([])
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filters, setFilters] = useState<FilterOptions>({
    showChatMessages: true
  })
  const [showFilters, setShowFilters] = useState(false)
  const eventsEndRef = useRef<HTMLDivElement>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const fetchEvents = async () => {
    try {
      const params = new URLSearchParams({
        limit: "50",
        ...(filters.serverId && { serverId: filters.serverId }),
        ...(filters.eventType && { eventType: filters.eventType }),
        ...(filters.userId && { userId: filters.userId }),
        ...(searchTerm && { search: searchTerm }),
        includeChatMessages: filters.showChatMessages.toString()
      })

      const response = await axios.get(`/api/workspace/${workspace.groupId}/remote-admin/activity?${params}`)
      setEvents(response.data.events || [])
    } catch (error) {
      console.error("Failed to fetch activity events:", error)
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

  const scrollToBottom = () => {
    eventsEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    if (workspace.groupId) {
      fetchServers()
      fetchEvents()
    }
  }, [workspace.groupId])

  useEffect(() => {
    fetchEvents()
  }, [filters])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== "") {
        fetchEvents()
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(fetchEvents, 5000) // Refresh every 5 seconds
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [autoRefresh])

  useEffect(() => {
    scrollToBottom()
  }, [events])

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString()
  }

  const getEventIcon = (type: string, data?: any) => {
    switch (type) {
      case "player_join":
        return <IconUserPlus className="w-4 h-4 text-green-500" />
      case "player_leave":
        return <IconUserMinus className="w-4 h-4 text-red-500" />
      case "chat_message":
        return <IconMessage className="w-4 h-4 text-blue-500" />
      case "player_action":
        if (data?.actionType === "afk_start") {
          return <IconPlayerStop className="w-4 h-4 text-orange-500" />
        } else if (data?.actionType === "afk_end") {
          return <IconPlayerPlay className="w-4 h-4 text-green-500" />
        }
        return <IconActivity className="w-4 h-4 text-purple-500" />
      case "game_event":
        if (data?.eventType === "death") {
          return <IconSword className="w-4 h-4 text-red-500" />
        } else if (data?.eventType === "purchase") {
          return <IconCoin className="w-4 h-4 text-yellow-500" />
        } else if (data?.eventType === "achievement") {
          return <IconTrophy className="w-4 h-4 text-purple-500" />
        }
        return <IconActivity className="w-4 h-4 text-gray-500" />
      default:
        return <IconCircle className="w-4 h-4 text-gray-500" />
    }
  }

  const getEventDescription = (event: ActivityEvent) => {
    switch (event.type) {
      case "player_join":
        return `${event.username} joined the game`
      case "player_leave":
        return `${event.username} left the game`
      case "chat_message":
        return `${event.username}: ${event.message}`
      case "player_action":
        if (event.data?.actionType === "afk_start") {
          return `${event.username} went AFK`
        } else if (event.data?.actionType === "afk_end") {
          return `${event.username} is no longer AFK`
        }
        return `${event.username} performed action: ${event.data?.actionType}`
      case "game_event":
        if (event.data?.eventType === "death") {
          return `${event.username} died`
        } else if (event.data?.eventType === "purchase") {
          return `${event.username} made a purchase`
        } else if (event.data?.eventType === "achievement") {
          return `${event.username} earned an achievement`
        }
        return `Game event: ${event.data?.eventType}`
      default:
        return "Unknown event"
    }
  }

  const EventCard = ({ event }: { event: ActivityEvent }) => (
    <div className="p-4 bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">
          {getEventIcon(event.type, event.data)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm text-zinc-900 dark:text-white">
              {getEventDescription(event)}
            </p>
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <IconServer className="w-3 h-3" />
              <span>{event.serverName}</span>
              <IconClock className="w-3 h-3 ml-1" />
              <span>{formatTime(event.timestamp)}</span>
            </div>
          </div>
          {event.userId && (
            <p className="text-xs text-zinc-500">User ID: {event.userId}</p>
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
              <IconActivity className="w-8 h-8 text-primary" />
              Live Activity Feed
            </h1>
            <p className="text-zinc-600 dark:text-zinc-300 mt-2">
              Real-time activity stream from all connected game servers
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={clsx(
                "px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2",
                autoRefresh
                  ? "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                  : "bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
              )}
            >
              <div className={clsx(
                "w-2 h-2 rounded-full",
                autoRefresh ? "bg-green-500 animate-pulse" : "bg-gray-400"
              )} />
              {autoRefresh ? "Live" : "Paused"}
            </button>
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
              onClick={fetchEvents}
              className="px-4 py-2 bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg font-medium hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors flex items-center gap-2"
            >
              <IconRefresh className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search activity..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="p-4 bg-gray-50 dark:bg-zinc-900 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
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
                  Event Type
                </label>
                <select
                  value={filters.eventType || ""}
                  onChange={(e) => setFilters({ ...filters, eventType: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                >
                  <option value="">All Events</option>
                  <option value="player_join">Player Joins</option>
                  <option value="player_leave">Player Leaves</option>
                  <option value="chat_message">Chat Messages</option>
                  <option value="player_action">Player Actions</option>
                  <option value="game_event">Game Events</option>
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
                    checked={filters.showChatMessages}
                    onChange={(e) => setFilters({ ...filters, showChatMessages: e.target.checked })}
                    className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2"
                  />
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">Include chat messages</span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Activity Feed */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12">
            <IconActivity className="w-16 h-16 text-zinc-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-zinc-900 dark:text-white mb-2">
              No activity yet
            </h3>
            <p className="text-zinc-600 dark:text-zinc-300">
              Activity from your connected game servers will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-w-4xl mx-auto">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
            <div ref={eventsEndRef} />
          </div>
        )}
      </div>
    </div>
  )
}

LiveActivity.layout = Workspace

export default LiveActivity