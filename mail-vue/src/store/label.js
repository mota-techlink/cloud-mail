import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import {
    labelAdd,
    labelDelete,
    labelList,
    labelUpdate,
    labelAttach,
    labelBatchAttach
} from '@/request/label.js';

function flatten(tree, depth = 0, out = []) {
    (tree || []).forEach(node => {
        const {children, ...rest} = node;
        out.push({...rest, depth});
        if (children && children.length) flatten(children, depth + 1, out);
    });
    return out;
}

export const useLabelStore = defineStore('label', () => {
    const tree = ref([]);
    const labels = ref([]);
    const loaded = ref(false);

    function applyTree(t) {
        tree.value = t || [];
        labels.value = flatten(tree.value);
    }

    async function fetch(force = false) {
        if (loaded.value && !force) return labels.value;
        const data = await labelList();
        applyTree(data || []);
        loaded.value = true;
        return labels.value;
    }

    async function add(name, color, parentId = 0) {
        const row = await labelAdd(name, color, parentId);
        await fetch(true);
        return row;
    }

    async function update(labelId, name, color, parentId) {
        await labelUpdate(labelId, name, color, parentId);
        await fetch(true);
    }

    async function remove(labelId) {
        await labelDelete(labelId);
        await fetch(true);
    }

    async function setEmailLabels(emailId, labelIds) {
        await labelAttach(emailId, labelIds);
    }

    async function batchAttach(emailIds, labelIds) {
        await labelBatchAttach(emailIds, labelIds);
    }

    function findById(id) {
        return labels.value.find(l => l.labelId === id) || null;
    }

    return { labels, tree, loaded, fetch, add, update, remove, setEmailLabels, batchAttach, findById };
});
