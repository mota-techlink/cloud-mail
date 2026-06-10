import http from "@/axios/index.js";

export function signatureList() {
    return http.get('/signature/list')
}

export function signatureAdd(data) {
    return http.post('/signature/add', data)
}

export function signatureUpdate(data) {
    return http.put('/signature/update', data)
}

export function signatureDelete(sigId) {
    return http.delete('/signature/delete', {params: {sigId}})
}

export function signatureSetDefault(sigId) {
    return http.put('/signature/setDefault', {sigId})
}

export function signatureAddCompany(data) {
    return http.post('/signature/company/add', data)
}
