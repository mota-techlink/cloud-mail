import http from "@/axios/index.js";

export function filterList() {
    return http.get('/filter/list')
}

export function filterAdd(data) {
    return http.post('/filter/add', data)
}

export function filterUpdate(data) {
    return http.put('/filter/update', data)
}

export function filterDelete(filterRuleId) {
    return http.delete('/filter/delete', {params: {filterRuleId}})
}

export function filterSetEnabled(filterRuleId, enabled) {
    return http.put('/filter/enabled', {filterRuleId, enabled: enabled ? 1 : 0})
}
