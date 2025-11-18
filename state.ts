import { atom, selector } from "recoil";
import Router from "next/router";
import { role } from "@prisma/client";
import axios from "axios";

const getInitialTheme = (): "light" | "dark" => {
	if (typeof window !== "undefined") {
		const stored = localStorage.getItem("theme");
		if (stored === "dark" || stored === "light") return stored;
	}
	return "light";
};
export type workspaceinfo = {
	groupId: number;
				groupThumbnail: string;
				groupName: string
}

export type LoginState = {
	userId: number;
	username: string;
	displayname: string;
	thumbnail: string;
	canMakeWorkspace: boolean;
	workspaces: workspaceinfo[];
	isOwner: boolean;
}

const loginState = atom<LoginState>({
	key: "loginState",
	default: {
		userId: 1,
		username: '',
		displayname: '',
		thumbnail: '',
		canMakeWorkspace: false,
		workspaces: [] as workspaceinfo[],
		isOwner: false
	},
});

const workspacestate = atom({
	key: "workspacestate",
	default: {
		groupId: typeof window !== 'undefined' ? parseInt(window.location.pathname.split('/')[2]) || 1 : 1,
		groupThumbnail: '',
		groupName: '',
		yourPermission: [] as string[],
		groupTheme: '',
		roles: [] as role[],
		yourRole: '',
		settings: {
			guidesEnabled: false,
			sessionsEnabled: false,
			alliesEnabled: false,
			noticesEnabled: false,
			leaderboardEnabled: false,
			widgets: [] as string[]
		}
	}
});

const themeState = atom<"light" | "dark">({
	key: "themeState",
	default: getInitialTheme(),
});

export {loginState, workspacestate, themeState};