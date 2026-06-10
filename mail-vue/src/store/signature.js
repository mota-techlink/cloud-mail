import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import {
    signatureAdd,
    signatureAddCompany,
    signatureDelete,
    signatureList,
    signatureSetDefault,
    signatureUpdate
} from '@/request/signature.js';

export const useSignatureStore = defineStore('signature', () => {
    const items = ref([]);
    const loaded = ref(false);

    const personal = computed(() => items.value.filter(s => !s.isCompany));
    const company = computed(() => items.value.filter(s => s.isCompany));
    const defaultSignature = computed(() => personal.value.find(s => s.isDefault) || null);

    async function fetch(force = false) {
        if (loaded.value && !force) return items.value;
        const data = await signatureList();
        items.value = data || [];
        loaded.value = true;
        return items.value;
    }

    async function add(data) {
        const row = await signatureAdd(data);
        await fetch(true);
        return row;
    }

    async function addCompany(data) {
        const row = await signatureAddCompany(data);
        await fetch(true);
        return row;
    }

    async function update(data) {
        await signatureUpdate(data);
        await fetch(true);
    }

    async function remove(sigId) {
        await signatureDelete(sigId);
        await fetch(true);
    }

    async function setDefault(sigId) {
        await signatureSetDefault(sigId);
        await fetch(true);
    }

    return { items, personal, company, defaultSignature, loaded, fetch, add, addCompany, update, remove, setDefault };
});
