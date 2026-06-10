import http from "@/axios/index.js";

export function labelAdd(name, color, parentId = 0) {
    return http.post('/label/add', {name, color, parentId})
}

export function labelUpdate(labelId, name, color, parentId) {
    return http.put('/label/update', {labelId, name, color, parentId})
}

export function labelDelete(labelId) {
    return http.delete('/label/delete', {params: {labelId}})
}

export function labelList() {
    return http.get('/label/list')
}

export function labelAttach(emailId, labelIds) {
    return http.post('/label/attach', {emailId, labelIds})
}

export function labelBatchAttach(emailIds, labelIds) {
    return http.post('/label/batch-attach', {emailIds, labelIds})
}

export function labelEmailList(labelId, emailId, size) {
    return http.get('/label/email/list', {params: {labelId, emailId, size}})
}
