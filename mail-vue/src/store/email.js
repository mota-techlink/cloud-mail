import { defineStore } from 'pinia'

export const useEmailStore = defineStore('email', {
    state: () => ({
        deleteIds: 0,
        starScroll: null,
        emailScroll: null,
        archiveScroll: null,
        cancelStarEmailId: 0,
        addStarEmailId: 0,
        contentData: {
            email: null,
            delType: null,
            showStar: true,
            showReply: true,
            showUnread: false,
            showArchive: true,
            archived: 0,
            navList: [],
            navIndex: -1
        },
        sendScroll: null,
    }),
    persist: {
        pick: ['contentData'],
    },
})
