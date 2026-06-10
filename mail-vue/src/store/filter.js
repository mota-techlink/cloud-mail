import { defineStore } from 'pinia';
import { ref } from 'vue';
import {
    filterAdd,
    filterDelete,
    filterList,
    filterSetEnabled,
    filterUpdate
} from '@/request/filter.js';

export const useFilterStore = defineStore('filter', () => {
    const rules = ref([]);
    const loaded = ref(false);

    async function fetch(force = false) {
        if (loaded.value && !force) return rules.value;
        const data = await filterList();
        rules.value = data || [];
        loaded.value = true;
        return rules.value;
    }

    async function add(data) {
        const row = await filterAdd(data);
        await fetch(true);
        return row;
    }

    async function update(data) {
        await filterUpdate(data);
        await fetch(true);
    }

    async function remove(id) {
        await filterDelete(id);
        await fetch(true);
    }

    async function toggleEnabled(id, enabled) {
        await filterSetEnabled(id, enabled);
        await fetch(true);
    }

    return { rules, loaded, fetch, add, update, remove, toggleEnabled };
});
